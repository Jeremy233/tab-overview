const OVERVIEW_URL = chrome.runtime.getURL('overview.html');
const fromTabId = Number(new URLSearchParams(location.search).get('from')) || null;

const container = document.getElementById('windows');
const search = document.getElementById('search');
const countEl = document.getElementById('count');
const emptyEl = document.getElementById('empty');
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings');
const shotsSwitch = document.getElementById('shots-switch');
const shotsTip = document.getElementById('shots-tip');

let selfTab = null;
let tabs = [];
let groups = new Map(); // groupId -> chrome tab group
let thumbs = {};
let selectedKey = null; // 'tab:<id>' or 'group:<id>'
let openGroupId = null; // set while looking inside one tab group
let leaving = false;
let ready = false; // true once the first data has arrived
let started; // promise for that first data
let langPref = 'auto';
let t = translator(resolveLang(langPref));

const nodes = new Map(); // key -> { node, sig }: card elements kept from earlier renders
const shotImgs = new Map(); // tabId -> { shot, img }, so screenshots aren't decoded again
const closing = new Set(); // tabs we've asked Chrome to close

// Screenshots are opt-in: they need access to all sites, an optional permission.
const SCREENSHOT_PERMISSION = { origins: ['<all_urls>'] };
const NO_GROUP = -1; // chrome.tabGroups.TAB_GROUP_ID_NONE
const MOSAIC_MAX = 9;

const thumbKey = (tabId) => `thumb:${tabId}`;
const tabKey = (id) => `tab:${id}`;
const groupKey = (id) => `group:${id}`;
const isOverview = (tab) => (tab.url || tab.pendingUrl || '').startsWith(OVERVIEW_URL);

function faviconUrl(tab) {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', tab.url || tab.pendingUrl || '');
  url.searchParams.set('size', '64');
  return url.toString();
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '') || url;
  } catch {
    return url || '';
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// ---- language ----

function applyLanguage() {
  const lang = resolveLang(langPref);
  t = translator(lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = t('pageTitle');
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of document.querySelectorAll('[data-i18n-placeholder]')) node.placeholder = t(node.dataset.i18nPlaceholder);
  for (const node of document.querySelectorAll('[data-i18n-title]')) node.title = t(node.dataset.i18nTitle);
  document.documentElement.style.setProperty('--current-label', JSON.stringify(t('currentBadge')));
  for (const btn of settingsPanel.querySelectorAll('[data-lang]')) {
    btn.setAttribute('aria-checked', btn.dataset.lang === langPref);
  }
}

// ---- data ----

function queryTabs() {
  return Promise.all([
    chrome.tabs.query({}),
    // Missing until the extension is reloaded with the tabGroups permission.
    chrome.tabGroups?.query({}) ?? [],
  ]);
}

function setTabs(all, groupList) {
  // Refresh our own tab too: it may have been dragged to another window.
  selfTab = all.find((tab) => tab.id === selfTab?.id) ?? selfTab;
  tabs = all.filter((tab) => tab.id !== selfTab?.id && !isOverview(tab));
  groups = new Map(groupList.map((g) => [g.id, g]));
  // Forget the elements and screenshots of tabs, groups and windows that are gone.
  const ids = new Set(tabs.map((tab) => tab.id));
  const windows = new Set(all.map((tab) => tab.windowId));
  for (const id of shotImgs.keys()) if (!ids.has(id)) shotImgs.delete(id);
  for (const key of nodes.keys()) {
    const [kind, id] = key.split(':');
    const live = kind === 'tab' ? ids : kind === 'group' ? groups : windows;
    if (!live.has(Number(id))) nodes.delete(key);
  }
}

// Thumbnails are kept current by storage.onChanged, so a reload only needs the tabs.
let loadSeq = 0;
async function load() {
  await started;
  const seq = ++loadSeq;
  const [all, groupList] = await queryTabs();
  if (seq !== loadSeq) return; // a newer load is already on its way
  setTabs(all, groupList);
  render();
}

let loadTimer;
function scheduleLoad() {
  clearTimeout(loadTimer);
  loadTimer = setTimeout(load, 120);
}

// ---- rendering ----
//
// Each render describes the whole grid, but keeps the elements of cards whose
// content hasn't changed and only moves what's out of place. Typing a search, or
// another tab updating its title, then touches a few nodes instead of rebuilding,
// re-laying-out and repainting every card.

// The element kept under `key` if it was built from the same inputs (`sig`), else a fresh one.
function reuse(key, sig, build) {
  let entry = nodes.get(key);
  if (entry?.sig !== sig) {
    entry = { node: build(), sig };
    nodes.set(key, entry);
  }
  return entry.node;
}

// Makes `parent`'s children exactly `wanted`, in order, leaving the ones already in place alone.
function reconcile(parent, wanted) {
  const current = [...parent.children];
  if (current.length === wanted.length && current.every((child, i) => child === wanted[i])) return;
  const keep = new Set(wanted);
  const stale = current.filter((child) => !keep.has(child));
  // When most children go (a search narrowing down), swapping them all at once is cheaper.
  if (stale.length > wanted.length) return parent.replaceChildren(...wanted);
  for (const child of stale) child.remove();
  let cursor = parent.firstElementChild;
  for (const node of wanted) {
    if (node === cursor) cursor = cursor.nextElementSibling;
    else parent.insertBefore(node, cursor);
  }
}

// A card's position, used to stagger the entrance animation.
function setIndex(node, i) {
  if (node.style.getPropertyValue('--i') !== String(i)) node.style.setProperty('--i', i);
}

function shotImg(tabId, shot) {
  let entry = shotImgs.get(tabId);
  if (entry?.shot !== shot) {
    const img = el('img', 'shot');
    img.decoding = 'async';
    img.alt = '';
    img.src = shot.src;
    entry = { shot, img };
    shotImgs.set(tabId, entry);
  }
  return entry.img;
}

// Shows the tab's screenshot in `box`, or its favicon if there's none yet.
function fillThumb(box, tab) {
  const shot = thumbs[thumbKey(tab.id)];
  if (shot) {
    const img = shotImg(tab.id, shot);
    if (box.firstChild !== img) box.replaceChildren(img);
  } else if (!box.firstChild?.classList.contains('placeholder')) {
    shotImgs.delete(tab.id);
    const ph = el('div', 'placeholder');
    const icon = el('img');
    icon.src = faviconUrl(tab);
    icon.alt = '';
    ph.append(icon, el('span', '', hostOf(tab.url)));
    box.replaceChildren(ph);
  }
}

function closeButton(label, onClick) {
  const close = el('button', 'close', '×');
  close.type = 'button';
  close.title = label;
  close.setAttribute('aria-label', label);
  close.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return close;
}

function buildCard(tab, dotColor) {
  const card = el('div', 'card');
  card.dataset.key = tabKey(tab.id);
  if (tab.id === fromTabId) card.classList.add('current');

  const thumb = el('div', 'thumb');
  thumb.dataset.tab = tab.id;

  const meta = el('div', 'meta');
  if (dotColor) {
    const dot = el('span', 'dot');
    dot.style.setProperty('--group-color', dotColor);
    meta.append(dot);
  }
  const fav = el('img');
  fav.src = faviconUrl(tab);
  fav.alt = '';
  meta.append(fav, el('span', 'title', tab.title || hostOf(tab.url) || t('untitled')));
  if (tab.audible) meta.append(el('span', 'badge', '🔊'));
  if (tab.pinned) meta.append(el('span', 'badge', '📌'));

  card.append(thumb, meta, closeButton(t('closeTab'), () => closeCard(card, [tab.id])));
  card.addEventListener('click', () => activate(tab.id));
  return card;
}

function tabCard(tab, i) {
  // Outside its group (i.e. in search results), a dot marks which group a tab belongs to.
  const dot = tab.groupId !== NO_GROUP && openGroupId == null ? groupColor(tab.groupId) : '';
  const sig = JSON.stringify([tab.title, tab.url, tab.pendingUrl, tab.audible, tab.pinned, dot, t('closeTab')]);
  const card = reuse(tabKey(tab.id), sig, () => buildCard(tab, dot));
  card.classList.toggle('removing', closing.has(tab.id));
  setIndex(card, i);
  fillThumb(card.firstChild, tab);
  return card;
}

function groupColor(groupId) {
  return `var(--g-${groups.get(groupId)?.color || 'grey'})`;
}

function groupTitle(groupId) {
  return groups.get(groupId)?.title || t('tabGroup');
}

// One card standing in for a whole tab group: a mosaic of its first few tabs.
function buildGroupCard(groupId, list) {
  const card = el('div', 'card group');
  card.dataset.key = groupKey(groupId);
  card.style.setProperty('--group-color', groupColor(groupId));
  if (list.some((tab) => tab.id === fromTabId)) card.classList.add('current');

  const shown = list.slice(0, MOSAIC_MAX);
  const cols = Math.ceil(Math.sqrt(shown.length));
  const rows = Math.ceil(shown.length / cols);
  const mosaic = el('div', 'thumb mosaic');
  mosaic.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  mosaic.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  shown.forEach((tab, n) => {
    const tile = el('div', 'tile');
    tile.dataset.tab = tab.id;
    // The first tile absorbs any leftover cells so the grid has no holes.
    if (n === 0) tile.style.gridColumn = `span ${cols * rows - shown.length + 1}`;
    mosaic.append(tile);
  });

  const meta = el('div', 'meta');
  meta.append(
    el('span', 'dot'),
    el('span', 'title', groupTitle(groupId)),
    el('span', 'count', String(list.length)),
  );

  card.append(mosaic, meta, closeButton(t('closeGroup'), () => closeCard(card, list.map((tab) => tab.id))));
  card.addEventListener('click', () => openGroup(groupId));
  return card;
}

function groupCard(groupId, list, i) {
  const shown = list.slice(0, MOSAIC_MAX);
  const sig = JSON.stringify([
    groupTitle(groupId), groupColor(groupId), list.map((tab) => tab.id),
    shown.map((tab) => tab.url || tab.pendingUrl), t('closeGroup'),
  ]);
  const card = reuse(groupKey(groupId), sig, () => buildGroupCard(groupId, list));
  card.classList.toggle('removing', list.every((tab) => closing.has(tab.id)));
  setIndex(card, i);
  const tiles = card.firstChild.children;
  shown.forEach((tab, n) => fillThumb(tiles[n], tab));
  return card;
}

function buildGroupHeader(groupId, count) {
  const h = el('h2', 'group-header');
  h.style.setProperty('--group-color', groupColor(groupId));
  const back = el('button', 'back', `‹ ${t('pageTitle')}`);
  back.type = 'button';
  back.addEventListener('click', closeGroup);
  h.append(back, el('span', 'dot'), el('span', 'name', groupTitle(groupId)), el('span', '', `· ${t('tabCount', count)}`));
  return h;
}

function buildNewTabCard(windowId, title) {
  const card = el('button', 'new-tab');
  card.type = 'button';
  card.title = title;
  const box = el('span', 'thumb');
  box.append(el('span', 'plus', '+'));
  card.append(box, el('span', 'meta', t('newTab')));
  card.addEventListener('click', () => newTab(windowId, openGroupId));
  return card;
}

function newTabCard(windowId, i) {
  const title = t(openGroupId != null ? 'newTabInGroupTitle' : 'newTabTitle');
  const card = reuse(`new:${windowId}`, title, () => buildNewTabCard(windowId, title));
  setIndex(card, i);
  return card;
}

function windowSection(windowId, header, items) {
  const section = reuse(`window:${windowId}`, '', () => {
    const node = el('section', 'window');
    node.append(el('div', 'grid'));
    return node;
  });
  const grid = section.lastElementChild;
  reconcile(section, header ? [header, grid] : [grid]);
  reconcile(grid, items);
  return section;
}

// `scroll` brings the selected card into view; it's left off for refreshes
// caused by other tabs changing, so the page doesn't jump while you browse it.
function render({ scroll = false } = {}) {
  if (!ready) return;
  const q = search.value.trim().toLowerCase();
  if (openGroupId != null && !tabs.some((tab) => tab.groupId === openGroupId)) openGroupId = null;
  const scope = openGroupId != null ? tabs.filter((tab) => tab.groupId === openGroupId) : tabs;
  const visible = q
    ? scope.filter((tab) => `${tab.title || ''} ${tab.url || ''}`.toLowerCase().includes(q))
    : scope;
  // Groups fold into a single card, except while searching or inside a group.
  const folded = !q && openGroupId == null;

  // Current window first, then the rest in creation order. The current window is
  // listed even with no other tabs, so its "new tab" card is always there.
  const windowIds = [...new Set([selfTab?.windowId, ...tabs.map((tab) => tab.windowId)])]
    .filter((wid) => wid != null)
    .sort((a, b) => (b === selfTab?.windowId) - (a === selfTab?.windowId) || a - b);

  const sections = [];
  let i = 0;
  windowIds.forEach((wid, n) => {
    const list = visible.filter((tab) => tab.windowId === wid).sort((a, b) => a.index - b.index);
    if (!list.length && (q || openGroupId != null || wid !== selfTab?.windowId)) return;
    let header = null;
    if (openGroupId != null) {
      const sig = JSON.stringify([openGroupId, groupTitle(openGroupId), groupColor(openGroupId), t('pageTitle'), t('tabCount', list.length)]);
      header = reuse(`header:${wid}`, sig, () => buildGroupHeader(openGroupId, list.length));
    } else if (windowIds.length > 1) {
      const name = wid === selfTab?.windowId ? t('currentWindow') : t('windowN', n + 1);
      const text = `${name} · ${t('tabCount', list.length)}`;
      header = reuse(`header:${wid}`, text, () => el('h2', '', text));
    }
    const items = [];
    const seen = new Set();
    for (const tab of list) {
      if (!folded || tab.groupId === NO_GROUP) {
        items.push(tabCard(tab, i++));
      } else if (!seen.has(tab.groupId)) {
        seen.add(tab.groupId);
        items.push(groupCard(tab.groupId, list.filter((other) => other.groupId === tab.groupId), i++));
      }
    }
    if (!q) items.push(newTabCard(wid, i++));
    sections.push(windowSection(wid, header, items));
  });
  reconcile(container, sections);

  const keys = cards().map((c) => c.dataset.key);
  if (!keys.includes(selectedKey)) {
    const from = q ? null : visible.find((tab) => tab.id === fromTabId);
    const fromKey = from && (folded && from.groupId !== NO_GROUP ? groupKey(from.groupId) : tabKey(from.id));
    selectedKey = keys.includes(fromKey) ? fromKey : keys[0] ?? null;
  }
  updateSelection(scroll);

  countEl.textContent = q ? `${visible.length} / ${scope.length}` : t('tabCount', scope.length);
  emptyEl.hidden = !q || visible.length > 0;
}

function cards() {
  return [...container.querySelectorAll('.card:not(.removing)')];
}

function updateSelection(scroll) {
  const card = selectedKey ? container.querySelector(`.card[data-key="${selectedKey}"]`) : null;
  for (const other of container.querySelectorAll('.card.selected')) if (other !== card) other.classList.remove('selected');
  if (!card) return;
  card.classList.add('selected');
  if (scroll) card.scrollIntoView({ block: 'nearest' });
}

function select(key) {
  if (selectedKey !== key) {
    selectedKey = key;
    updateSelection(false);
  }
}

// Replay the entrance animation when switching between the overview and a group.
let animateTimer;
function animateIn() {
  document.body.classList.add('animate');
  clearTimeout(animateTimer);
  animateTimer = setTimeout(() => document.body.classList.remove('animate'), 300);
}

// ---- actions ----

function choose(key) {
  const [kind, id] = key.split(':');
  if (kind === 'group') openGroup(Number(id));
  else activate(Number(id));
}

function openGroup(groupId) {
  openGroupId = groupId;
  selectedKey = null;
  search.value = '';
  animateIn();
  scrollTo(0, 0);
  render({ scroll: true });
  search.focus({ preventScroll: true });
}

function closeGroup() {
  const groupId = openGroupId;
  openGroupId = null;
  selectedKey = groupKey(groupId);
  search.value = '';
  animateIn();
  render({ scroll: true });
  search.focus({ preventScroll: true });
}

function closeSelf() {
  if (selfTab) chrome.tabs.remove(selfTab.id);
}

async function activate(id) {
  const tab = tabs.find((t) => t.id === id);
  if (!tab || leaving) return;
  leaving = true;
  try {
    await chrome.tabs.update(id, { active: true });
    if (tab.windowId !== selfTab?.windowId) await chrome.windows.update(tab.windowId, { focused: true });
    closeSelf();
  } catch {
    // The tab closed in the meantime; stay and show what's there now.
    leaving = false;
    load();
  }
}

async function newTab(windowId, groupId = null) {
  if (leaving) return;
  leaving = true;
  let tab;
  try {
    tab = await chrome.tabs.create({ windowId, active: true });
  } catch {
    leaving = false; // e.g. the window just closed
    load();
    return;
  }
  // The group may have been closed meanwhile; the new tab is still wanted.
  if (groupId != null) await chrome.tabs.group({ groupId, tabIds: tab.id }).catch(() => {});
  if (windowId !== selfTab?.windowId) await chrome.windows.update(windowId, { focused: true }).catch(() => {});
  closeSelf();
}

function goBack() {
  if (fromTabId && tabs.some((t) => t.id === fromTabId)) return activate(fromTabId);
  if (leaving) return;
  leaving = true;
  closeSelf();
}

// Close one tab, or every tab behind a group card.
function closeCard(card, ids) {
  if (selectedKey === card.dataset.key) {
    const list = cards();
    const idx = list.indexOf(card);
    const next = list[idx + 1] || list[idx - 1];
    selectedKey = next ? next.dataset.key : null;
  }
  card.classList.add('removing');
  updateSelection(false);
  search.focus({ preventScroll: true }); // the clicked button is going away
  for (const id of ids) closing.add(id);
  chrome.tabs.remove(ids)
    .then(() => { tabs = tabs.filter((tab) => !ids.includes(tab.id)); }) // don't bring them back before the reload
    .catch(() => {})
    .finally(() => {
      // Refresh either way: if a tab survived (or was already gone), the grid catches up.
      for (const id of ids) closing.delete(id);
      scheduleLoad();
    });
}

function moveSelection(dir) {
  const list = cards();
  if (!list.length) return;
  const cur = list.find((c) => c.dataset.key === selectedKey) || list[0];
  let next = cur;

  if (dir === 'left' || dir === 'right') {
    const idx = list.indexOf(cur) + (dir === 'right' ? 1 : -1);
    next = list[Math.max(0, Math.min(list.length - 1, idx))];
  } else {
    const r = cur.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const others = list
      .map((c) => ({ c, b: c.getBoundingClientRect() }))
      .filter(({ b }) => (dir === 'down' ? b.top > r.top + 4 : b.top < r.top - 4));
    if (others.length) {
      const tops = others.map(({ b }) => b.top);
      const rowTop = dir === 'down' ? Math.min(...tops) : Math.max(...tops);
      next = others
        .filter(({ b }) => Math.abs(b.top - rowTop) < 4)
        .reduce((best, o) =>
          Math.abs(o.b.left + o.b.width / 2 - cx) < Math.abs(best.b.left + best.b.width / 2 - cx) ? o : best,
        ).c;
    }
  }

  selectedKey = next.dataset.key;
  updateSelection(true);
}

// ---- settings ----

async function showShortcut() {
  const commands = await chrome.commands.getAll();
  const key = commands.find((c) => c.name === '_execute_action')?.shortcut;
  document.getElementById('shortcut-key').textContent = key || t('shortcutNone');
}

// ---- version, updates, developer ----

const MANIFEST = chrome.runtime.getManifest();
const REPO_URL = MANIFEST.homepage_url; // https://github.com/<developer>/<repo>
// The manifest on GitHub's main branch is the latest release.
const LATEST_MANIFEST_URL = `${REPO_URL.replace('//github.com/', '//raw.githubusercontent.com/')}/main/extension/manifest.json`;
const updateStatus = document.getElementById('update-status');
const checkUpdatesBtn = document.getElementById('check-updates');

document.getElementById('version').textContent = MANIFEST.version;
document.getElementById('developer').textContent = new URL(REPO_URL).pathname.split('/')[1];

// Is version `a` newer than `b`? (dotted numbers, e.g. 0.10.1 > 0.9.3)
function isNewer(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  }
  return false;
}

function openPage(url) {
  chrome.tabs.create({ url });
}

// The only network request Tab Overview ever makes, and only when asked to.
async function checkForUpdates() {
  checkUpdatesBtn.disabled = true;
  updateStatus.hidden = false;
  updateStatus.textContent = t('checking');
  try {
    const res = await fetch(LATEST_MANIFEST_URL, { cache: 'no-store', credentials: 'omit' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const latest = String((await res.json()).version || '');
    if (latest && isNewer(latest, MANIFEST.version)) {
      const link = el('button', 'link', t('getUpdate'));
      link.type = 'button';
      link.addEventListener('click', () => openPage(REPO_URL));
      updateStatus.replaceChildren(`${t('updateAvailable', latest)} `, link);
    } else {
      updateStatus.textContent = t('upToDate');
    }
  } catch (err) {
    console.warn('update check failed', err);
    updateStatus.textContent = t('updateFailed');
  } finally {
    checkUpdatesBtn.disabled = false;
  }
}

checkUpdatesBtn.addEventListener('click', checkForUpdates);
document.getElementById('github').addEventListener('click', () => openPage(REPO_URL));

async function showScreenshotsSetting() {
  shotsSwitch.setAttribute('aria-checked', await chrome.permissions.contains(SCREENSHOT_PERMISSION));
}

// While screenshots are off, a small tip points to the setting, until dismissed.
async function showScreenshotsTip() {
  const [on, { shotsTipDismissed }] = await Promise.all([
    chrome.permissions.contains(SCREENSHOT_PERMISSION),
    chrome.storage.sync.get('shotsTipDismissed'),
  ]);
  shotsTip.hidden = on || !!shotsTipDismissed;
}

function toggleSettings(open = settingsPanel.hidden) {
  settingsPanel.hidden = !open;
  settingsBtn.setAttribute('aria-expanded', open);
  if (open) {
    showShortcut();
    showScreenshotsSetting();
  } else {
    search.focus({ preventScroll: true });
  }
}

settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleSettings();
});

// A click outside the open panel only closes it (doesn't also open a tab).
document.addEventListener('click', (e) => {
  if (!settingsPanel.hidden && !settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
    e.stopPropagation();
    toggleSettings(false);
  }
}, true);

for (const btn of settingsPanel.querySelectorAll('[data-lang]')) {
  btn.addEventListener('click', () => chrome.storage.sync.set({ language: btn.dataset.lang }));
}

// Turning screenshots on asks Chrome for access to all sites (Chrome shows its own
// confirmation); turning them off gives that access back, and the background
// worker then deletes every screenshot.
shotsSwitch.addEventListener('click', async () => {
  const on = shotsSwitch.getAttribute('aria-checked') !== 'true';
  shotsSwitch.disabled = true;
  try {
    // request() must run straight from the click, before anything is awaited.
    if (on) await chrome.permissions.request(SCREENSHOT_PERMISSION);
    else await chrome.permissions.remove(SCREENSHOT_PERMISSION);
  } catch (err) {
    console.warn('changing the screenshot permission failed', err);
  } finally {
    shotsSwitch.disabled = false;
    showScreenshotsSetting();
  }
});
for (const event of [chrome.permissions.onAdded, chrome.permissions.onRemoved]) {
  event.addListener(showScreenshotsSetting);
  event.addListener(showScreenshotsTip);
}

document.getElementById('shots-tip-open').addEventListener('click', () => {
  toggleSettings(true);
  const row = document.getElementById('shots-row');
  row.classList.remove('flash');
  void row.offsetWidth; // restart the highlight if it's clicked again
  row.classList.add('flash');
  shotsSwitch.focus();
});

document.getElementById('shots-tip-close').addEventListener('click', () => {
  shotsTip.hidden = true;
  chrome.storage.sync.set({ shotsTipDismissed: true });
  search.focus({ preventScroll: true });
});

document.getElementById('shortcut-key').addEventListener('click', () => openPage('chrome://extensions/shortcuts'));

// ---- events ----

// While an IME is composing (e.g. typing pinyin), wait for the final text before filtering.
search.addEventListener('input', (e) => {
  if (!e.isComposing) render({ scroll: true });
});
search.addEventListener('compositionend', () => render({ scroll: true }));

// Hovering selects a card.
container.addEventListener('mousemove', (e) => {
  const card = e.target.closest('.card:not(.removing)');
  if (card) select(card.dataset.key);
});

document.addEventListener('keydown', (e) => {
  // Enter, Esc and arrows confirm or navigate an IME composition; they aren't for us.
  if (e.isComposing || e.keyCode === 229) return;
  if (!settingsPanel.hidden) {
    if (e.key === 'Escape') toggleSettings(false);
    return;
  }
  const arrows = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  if (arrows[e.key]) {
    // Let left/right move the caret while typing a search.
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && search.value) return;
    e.preventDefault();
    moveSelection(arrows[e.key]);
  } else if (e.key === 'Enter') {
    if (e.target instanceof HTMLButtonElement) return; // let a focused button handle it
    e.preventDefault();
    if (selectedKey != null) choose(selectedKey);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    if (search.value) {
      search.value = '';
      render({ scroll: true });
    } else if (openGroupId != null) {
      closeGroup();
    } else {
      goBack();
    }
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.language) {
    langPref = changes.language.newValue || 'auto';
    applyLanguage();
    render();
    return;
  }
  if (area !== 'session') return;
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (newValue) thumbs[key] = newValue;
    else delete thumbs[key];
    // Swap just that tab's image (card or mosaic tile) instead of re-rendering everything.
    const tab = tabs.find((t) => thumbKey(t.id) === key);
    if (!tab) continue;
    for (const thumb of container.querySelectorAll(`[data-tab="${tab.id}"]`)) fillThumb(thumb, tab);
  }
});

chrome.tabs.onCreated.addListener(scheduleLoad);
chrome.tabs.onRemoved.addListener(scheduleLoad);
chrome.tabs.onMoved.addListener(scheduleLoad);
chrome.tabs.onAttached.addListener(scheduleLoad);
chrome.tabs.onDetached.addListener(scheduleLoad);
chrome.tabs.onUpdated.addListener((_id, info) => {
  if (info.title || info.url || info.favIconUrl || info.audible != null || info.pinned != null || info.groupId != null) {
    scheduleLoad();
  }
});
chrome.tabGroups?.onCreated.addListener(scheduleLoad);
chrome.tabGroups?.onUpdated.addListener(scheduleLoad);
chrome.tabGroups?.onRemoved.addListener(scheduleLoad);

// If the user leaves the overview by clicking another tab, close it.
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  if (!leaving && selfTab && windowId === selfTab.windowId && tabId !== selfTab.id) {
    leaving = true;
    closeSelf();
  }
});

history.scrollRestoration = 'manual';
search.focus();
// Ask for everything the first render needs at once rather than one after another.
started = Promise.all([
  getLangPref(),
  chrome.tabs.getCurrent(),
  queryTabs(),
  // Taken the moment it arrives, so thumbnail changes reported after it aren't lost.
  chrome.storage.session.get(null).then((stored) => { thumbs = stored; }),
  showScreenshotsTip(), // settled before the first paint, so the grid doesn't shift
]).then(([pref, current, [all, groupList]]) => {
  langPref = pref;
  selfTab = current;
  applyLanguage();
  setTabs(all, groupList);
  ready = true;
  render();
  scrollTo(0, 0);
  updateSelection(true);
  setTimeout(() => document.body.classList.remove('animate'), 300);
});
