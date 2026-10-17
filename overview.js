const OVERVIEW_URL = chrome.runtime.getURL('overview.html');
const fromTabId = Number(new URLSearchParams(location.search).get('from')) || null;

const container = document.getElementById('windows');
const search = document.getElementById('search');
const countEl = document.getElementById('count');
const emptyEl = document.getElementById('empty');
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings');

let selfTab = null;
let tabs = [];
let groups = new Map(); // groupId -> chrome tab group
let thumbs = {};
let selectedKey = null; // 'tab:<id>' or 'group:<id>'
let openGroupId = null; // set while looking inside one tab group
let leaving = false;
let loaded = false;
let langPref = 'auto';
let t = translator(resolveLang(langPref));

const NO_GROUP = -1; // chrome.tabGroups.TAB_GROUP_ID_NONE
const MOSAIC_MAX = 9;

const thumbKey = (tabId) => `thumb:${tabId}`;
const tabKey = (id) => `tab:${id}`;
const groupKey = (id) => `group:${id}`;

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

async function load() {
  selfTab ??= await chrome.tabs.getCurrent();
  const [all, stored, groupList] = await Promise.all([
    chrome.tabs.query({}),
    chrome.storage.session.get(null),
    // Missing until the extension is reloaded with the tabGroups permission.
    chrome.tabGroups?.query({}) ?? [],
  ]);
  tabs = all.filter((t) => t.id !== selfTab?.id && !t.url?.startsWith(OVERVIEW_URL));
  groups = new Map(groupList.map((g) => [g.id, g]));
  thumbs = stored;
  render();
}

let loadTimer;
function scheduleLoad() {
  clearTimeout(loadTimer);
  loadTimer = setTimeout(load, 120);
}

// ---- rendering ----

function fillThumb(thumb, tab) {
  const shot = thumbs[thumbKey(tab.id)];
  if (shot) {
    const img = el('img', 'shot');
    img.decoding = 'async';
    img.src = shot.src;
    img.alt = '';
    thumb.replaceChildren(img);
  } else {
    const ph = el('div', 'placeholder');
    const icon = el('img');
    icon.src = faviconUrl(tab);
    icon.alt = '';
    ph.append(icon, el('span', '', hostOf(tab.url)));
    thumb.replaceChildren(ph);
  }
}

function buildCard(tab, i) {
  const key = tabKey(tab.id);
  const card = el('div', 'card');
  card.dataset.key = key;
  card.style.setProperty('--i', i);
  if (tab.id === fromTabId) card.classList.add('current');

  const thumb = el('div', 'thumb');
  thumb.dataset.tab = tab.id;
  fillThumb(thumb, tab);

  const meta = el('div', 'meta');
  // Outside its group (i.e. in search results), mark which group a tab belongs to.
  if (tab.groupId !== NO_GROUP && openGroupId == null) {
    const dot = el('span', 'dot');
    dot.style.setProperty('--group-color', groupColor(tab.groupId));
    meta.append(dot);
  }
  const fav = el('img');
  fav.src = faviconUrl(tab);
  fav.alt = '';
  meta.append(fav, el('span', 'title', tab.title || hostOf(tab.url) || t('untitled')));
  if (tab.audible) meta.append(el('span', 'badge', '🔊'));
  if (tab.pinned) meta.append(el('span', 'badge', '📌'));

  const close = el('button', 'close', '×');
  close.title = t('closeTab');
  close.addEventListener('click', (e) => {
    e.stopPropagation();
    closeCard(card, tab.id);
  });

  card.append(thumb, meta, close);
  card.addEventListener('click', () => activate(tab.id));
  card.addEventListener('mousemove', () => select(key));
  return card;
}

function groupColor(groupId) {
  return `var(--g-${groups.get(groupId)?.color || 'grey'})`;
}

function groupTitle(groupId) {
  return groups.get(groupId)?.title || t('tabGroup');
}

// One card standing in for a whole tab group: a mosaic of its first few tabs.
function buildGroupCard(groupId, list, i) {
  const key = groupKey(groupId);
  const card = el('div', 'card group');
  card.dataset.key = key;
  card.style.setProperty('--i', i);
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
    fillThumb(tile, tab);
    mosaic.append(tile);
  });

  const meta = el('div', 'meta');
  meta.append(
    el('span', 'dot'),
    el('span', 'title', groupTitle(groupId)),
    el('span', 'count', String(list.length)),
  );

  const close = el('button', 'close', '×');
  close.title = t('closeGroup');
  close.addEventListener('click', (e) => {
    e.stopPropagation();
    closeCard(card, list.map((tab) => tab.id));
  });

  card.append(mosaic, meta, close);
  card.addEventListener('click', () => openGroup(groupId));
  card.addEventListener('mousemove', () => select(key));
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

function buildNewTabCard(windowId, i) {
  const card = el('button', 'new-tab');
  card.type = 'button';
  card.title = t(openGroupId != null ? 'newTabInGroupTitle' : 'newTabTitle');
  card.style.setProperty('--i', i);
  const box = el('div', 'thumb');
  box.append(el('span', 'plus', '+'));
  card.append(box, el('div', 'meta', t('newTab')));
  card.addEventListener('click', () => newTab(windowId, openGroupId));
  return card;
}

function render() {
  const q = search.value.trim().toLowerCase();
  if (openGroupId != null && !tabs.some((t) => t.groupId === openGroupId)) openGroupId = null;
  const scope = openGroupId != null ? tabs.filter((t) => t.groupId === openGroupId) : tabs;
  const visible = q
    ? scope.filter((t) => `${t.title} ${t.url}`.toLowerCase().includes(q))
    : scope;
  // Groups fold into a single card, except while searching or inside a group.
  const folded = !q && openGroupId == null;

  // Current window first, then the rest in creation order.
  const windowIds = [...new Set(tabs.map((t) => t.windowId))].sort(
    (a, b) => (b === selfTab?.windowId) - (a === selfTab?.windowId) || a - b,
  );

  const sections = [];
  let i = 0;
  windowIds.forEach((wid, n) => {
    const list = visible.filter((t) => t.windowId === wid).sort((a, b) => a.index - b.index);
    if (!list.length) return;
    const section = el('section', 'window');
    if (openGroupId != null) {
      section.append(buildGroupHeader(openGroupId, list.length));
    } else if (windowIds.length > 1) {
      const name = wid === selfTab?.windowId ? t('currentWindow') : t('windowN', n + 1);
      section.append(el('h2', '', `${name} · ${t('tabCount', list.length)}`));
    }
    const grid = el('div', 'grid');
    const seen = new Set();
    for (const tab of list) {
      if (!folded || tab.groupId === NO_GROUP) {
        grid.append(buildCard(tab, i++));
      } else if (!seen.has(tab.groupId)) {
        seen.add(tab.groupId);
        grid.append(buildGroupCard(tab.groupId, list.filter((t) => t.groupId === tab.groupId), i++));
      }
    }
    if (!q) grid.append(buildNewTabCard(wid, i++));
    section.append(grid);
    sections.push(section);
  });
  container.replaceChildren(...sections);

  const keys = cards().map((c) => c.dataset.key);
  if (!keys.includes(selectedKey)) {
    const from = q ? null : visible.find((t) => t.id === fromTabId);
    const fromKey = from && (folded && from.groupId !== NO_GROUP ? groupKey(from.groupId) : tabKey(from.id));
    selectedKey = fromKey ?? keys[0] ?? null;
  }
  updateSelection(loaded);

  countEl.textContent = q ? `${visible.length} / ${scope.length}` : t('tabCount', scope.length);
  emptyEl.hidden = visible.length > 0;
}

function cards() {
  return [...container.querySelectorAll('.card:not(.removing)')];
}

function updateSelection(scroll) {
  for (const card of cards()) {
    const on = card.dataset.key === selectedKey;
    card.classList.toggle('selected', on);
    if (on && scroll) card.scrollIntoView({ block: 'nearest' });
  }
}

function select(key) {
  if (selectedKey !== key) {
    selectedKey = key;
    updateSelection(false);
  }
}

// Replay the entrance animation when switching between the overview and a group.
function animateIn() {
  document.body.classList.add('animate');
  setTimeout(() => document.body.classList.remove('animate'), 300);
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
  render();
}

function closeGroup() {
  const groupId = openGroupId;
  openGroupId = null;
  selectedKey = groupKey(groupId);
  search.value = '';
  animateIn();
  render();
  search.focus();
}

async function activate(id) {
  const tab = tabs.find((t) => t.id === id);
  if (!tab) return;
  leaving = true;
  await chrome.tabs.update(id, { active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
  if (selfTab) chrome.tabs.remove(selfTab.id);
}

async function newTab(windowId, groupId = null) {
  leaving = true;
  const tab = await chrome.tabs.create({ windowId, active: true });
  if (groupId != null) await chrome.tabs.group({ groupId, tabIds: tab.id });
  await chrome.windows.update(windowId, { focused: true });
  if (selfTab) chrome.tabs.remove(selfTab.id);
}

async function goBack() {
  if (fromTabId && tabs.some((t) => t.id === fromTabId)) return activate(fromTabId);
  leaving = true;
  if (selfTab) chrome.tabs.remove(selfTab.id);
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
  chrome.tabs.remove(ids);
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
  const kbd = document.getElementById('shortcut-key');
  kbd.textContent = key || t('shortcutNone');
}

function toggleSettings(open = settingsPanel.hidden) {
  settingsPanel.hidden = !open;
  settingsBtn.setAttribute('aria-expanded', open);
  if (open) showShortcut();
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

document.getElementById('shortcut-change').addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

// ---- events ----

search.addEventListener('input', render);

document.addEventListener('keydown', (e) => {
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
    e.preventDefault();
    if (selectedKey != null) choose(selectedKey);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    if (search.value) {
      search.value = '';
      render();
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
  if (info.title || info.favIconUrl || info.audible != null || info.pinned != null || info.groupId != null) scheduleLoad();
});
chrome.tabGroups?.onCreated.addListener(scheduleLoad);
chrome.tabGroups?.onUpdated.addListener(scheduleLoad);
chrome.tabGroups?.onRemoved.addListener(scheduleLoad);

// If the user leaves the overview by clicking another tab, close it.
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  if (!leaving && selfTab && windowId === selfTab.windowId && tabId !== selfTab.id) {
    leaving = true;
    chrome.tabs.remove(selfTab.id);
  }
});

history.scrollRestoration = 'manual';
getLangPref().then((pref) => {
  langPref = pref;
  applyLanguage();
  return load();
}).then(() => {
  search.focus();
  loaded = true;
  scrollTo(0, 0);
  requestAnimationFrame(() => updateSelection(true));
  setTimeout(() => document.body.classList.remove('animate'), 300);
});
