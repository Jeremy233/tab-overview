// Chrome can only screenshot the tab that is currently visible in a window,
// so we capture each tab whenever it is shown and cache a small thumbnail.

importScripts('i18n.js');

const OVERVIEW_URL = chrome.runtime.getURL('overview.html');
const THUMB_WIDTH = 560;
// captureVisibleTab may be called at most this many times per second, across all windows.
const CAPTURES_PER_SECOND = chrome.tabs.MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND || 2;
const CAPTURE_WINDOW = 1100; // one second, plus slack for timing jitter

const recentCaptures = []; // start times of the latest captureVisibleTab calls
const capturedAt = new Map(); // tabId -> time of last screenshot
const shooting = new Map(); // tabId -> screenshot being taken right now
const timers = new Map(); // windowId -> pending capture timer

// Screenshots are opt-in. Taking them needs access to all sites, an optional
// permission the user grants or revokes with the switch in the overview's settings.
const SCREENSHOT_PERMISSION = { origins: ['<all_urls>'] };
let screenshotsOn = false;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const thumbKey = (tabId) => `thumb:${tabId}`;
const isOverview = (tab) => (tab.url || tab.pendingUrl || '').startsWith(OVERVIEW_URL);

function isCapturable(tab) {
  return tab && /^(https?|file):/.test(tab.url || '');
}

function toDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function shrink(dataUrl) {
  const bitmap = await createImageBitmap(await (await fetch(dataUrl)).blob());
  const scale = Math.min(1, THUMB_WIDTH / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high'; // crisper text, and a slightly smaller file
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return toDataUrl(await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.72 }));
}

// Session storage holds 10 MB, roughly 180 thumbnails. When it's full, drop the
// thumbnails of tabs that are gone, then of the tabs that were shown longest ago.
async function makeRoom(bytes) {
  const [stored, open] = await Promise.all([chrome.storage.session.get(null), chrome.tabs.query({})]);
  const live = new Set(open.map((tab) => thumbKey(tab.id)));
  const entries = Object.entries(stored)
    .filter(([key]) => key.startsWith('thumb:'))
    .map(([key, value]) => ({ key, live: live.has(key), at: value?.at || 0, size: key.length + (value?.src?.length || 0) + 128 }))
    .sort((a, b) => a.live - b.live || a.at - b.at);
  let used = entries.reduce((sum, e) => sum + e.size, 0);
  const target = chrome.storage.session.QUOTA_BYTES * 0.85 - bytes; // free some headroom, not just enough
  const drop = [];
  for (const e of entries) {
    if (used <= target) break;
    drop.push(e.key);
    used -= e.size;
  }
  if (drop.length) await chrome.storage.session.remove(drop);
}

async function clearThumbs() {
  const keys = Object.keys(await chrome.storage.session.get(null)).filter((key) => key.startsWith('thumb:'));
  if (keys.length) await chrome.storage.session.remove(keys);
}

async function syncScreenshotPermission() {
  screenshotsOn = await chrome.permissions.contains(SCREENSHOT_PERMISSION);
  if (!screenshotsOn) {
    // Turned off: forget every screenshot right away.
    capturedAt.clear();
    await clearThumbs();
  }
}

const screenshotsChecked = syncScreenshotPermission(); // first check, when the worker starts
async function screenshotsAllowed() {
  await screenshotsChecked;
  return screenshotsOn;
}

chrome.permissions.onAdded.addListener(syncScreenshotPermission);
chrome.permissions.onRemoved.addListener(syncScreenshotPermission);

async function saveThumb(tabId, shot) {
  try {
    const src = await shrink(shot);
    // The tab was closed, or screenshots were turned off, in the meantime.
    if (!capturedAt.has(tabId) || !(await screenshotsAllowed())) return;
    const item = { [thumbKey(tabId)]: { src, at: Date.now() } };
    try {
      await chrome.storage.session.set(item);
    } catch (err) {
      if (!/quota/i.test(err?.message)) throw err;
      await makeRoom(src.length);
      await chrome.storage.session.set(item);
    }
  } catch (err) {
    console.warn('saving thumbnail failed', err);
  }
}

// How long until one more capture fits in Chrome's rate limit.
function captureSlotWait() {
  if (recentCaptures.length < CAPTURES_PER_SECOND) return 0;
  return Math.max(0, recentCaptures[0] + CAPTURE_WINDOW - Date.now());
}

// Waits until one more capture fits in the rate limit, then claims it. The
// check and the claim happen together, so concurrent callers can't both take
// the last slot.
async function claimCaptureSlot() {
  let waited = false;
  for (let wait; (wait = captureSlotWait()) > 0; waited = true) await sleep(wait);
  const at = Date.now();
  recentCaptures.push(at);
  if (recentCaptures.length > CAPTURES_PER_SECOND) recentCaptures.shift();
  return { at, waited };
}

// Hands back a claimed slot that went unused, so the next capture needn't wait for it.
function releaseCaptureSlot({ at }) {
  const i = recentCaptures.indexOf(at);
  if (i >= 0) recentCaptures.splice(i, 1);
}

const isFresh = (tabId, maxAge) => Date.now() - (capturedAt.get(tabId) || 0) < maxAge;

// After waiting for the rate limit: is a screenshot of `tab` still called for?
async function stillWanted(tab) {
  if (shooting.has(tab.id) || isFresh(tab.id, 1000)) return false;
  const [active] = await chrome.tabs.query({ active: true, windowId: tab.windowId }).catch(() => []);
  return active?.id === tab.id;
}

async function shoot(tab) {
  try {
    // The capture is only ever shown shrunk to a thumbnail, so quality 70 loses
    // nothing visible and is quicker to encode, pass around and decode than 85.
    const shot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 70 });
    // The user may have switched tabs while the shot was taken; don't mislabel it.
    const [still] = await chrome.tabs.query({ active: true, windowId: tab.windowId });
    if (still?.id !== tab.id) return;
    capturedAt.set(tab.id, Date.now());
    saveThumb(tab.id, shot);
  } catch (err) {
    // Window minimized, page not capturable, etc.
    console.warn('capture failed', tab.url, err);
  }
}

// Screenshots `tab`, the active tab of its window, unless that happened less
// than `maxAge` ms ago. Resolves as soon as the raw screenshot is taken;
// shrinking and saving continue in the background. A screenshot of the tab
// that's already being taken is shared.
async function captureTab(tab, maxAge = 0) {
  if (!isCapturable(tab) || !(await screenshotsAllowed())) return;
  if (shooting.has(tab.id)) return shooting.get(tab.id);
  if (isFresh(tab.id, maxAge)) return;
  const slot = await claimCaptureSlot();
  if (slot.waited && !(await stillWanted(tab))) {
    releaseCaptureSlot(slot);
    return shooting.get(tab.id);
  }
  const job = shoot(tab).finally(() => shooting.delete(tab.id));
  shooting.set(tab.id, job);
  return job;
}

async function captureWindow(windowId) {
  if (!(await screenshotsAllowed())) return;
  const [tab] = await chrome.tabs.query({ active: true, windowId }).catch(() => []); // window may be gone
  await captureTab(tab);
}

function scheduleCapture(windowId, delay = 400) {
  clearTimeout(timers.get(windowId));
  timers.set(windowId, setTimeout(() => {
    timers.delete(windowId);
    captureWindow(windowId);
  }, delay));
}

function cancelCapture(windowId) {
  clearTimeout(timers.get(windowId));
  timers.delete(windowId);
}

chrome.tabs.onActivated.addListener(({ windowId }) => scheduleCapture(windowId));

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === 'complete' && tab.active) scheduleCapture(tab.windowId, 300);
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) scheduleCapture(windowId);
});

function forgetTab(tabId) {
  capturedAt.delete(tabId);
  chrome.storage.session.remove(thumbKey(tabId));
}

chrome.tabs.onRemoved.addListener(forgetTab);
chrome.tabs.onReplaced.addListener((_added, removed) => forgetTab(removed));

// Toolbar button / ⌘⇧E: open the overview, or close it if it's already showing.
async function toggleOverview(windowId) {
  // Look the tab up afresh: a click just before this one may have opened the overview.
  const [tab] = await chrome.tabs.query({ active: true, windowId });
  if (!tab) return;

  if (isOverview(tab)) {
    const from = Number(new URL(tab.url || tab.pendingUrl).searchParams.get('from'));
    if (from) await chrome.tabs.update(from, { active: true }).catch(() => {});
    // The overview may already be closing itself because another tab became active.
    await chrome.tabs.remove(tab.id).catch(() => {});
    return;
  }

  // Grab the current tab while it's still visible (skipped if we just did),
  // then open the overview right away; the thumbnail is saved in the background.
  // If the rate limit would hold the overview up noticeably, skip the screenshot:
  // this is the tab the user was just looking at, so opening fast matters more.
  cancelCapture(windowId);
  if (shooting.has(tab.id) || captureSlotWait() < 200) await captureTab(tab, 1500);

  const created = await chrome.tabs.create({
    url: `${OVERVIEW_URL}?from=${tab.id}`,
    index: tab.index + 1,
    windowId,
  });

  const all = await chrome.tabs.query({});
  const stale = all.filter((t) => t.id !== created.id && isOverview(t)).map((t) => t.id);
  if (stale.length) chrome.tabs.remove(stale).catch(() => {});
}

// Handle clicks one at a time, so a quick double press opens and then closes
// the overview instead of opening two.
let toggling = Promise.resolve();
chrome.action.onClicked.addListener(({ windowId }) => {
  toggling = toggling
    .then(() => toggleOverview(windowId))
    .catch((err) => console.warn('toggling the overview failed', err));
});

// Keep the toolbar tooltip in the chosen language.
async function updateActionTitle() {
  const t = translator(resolveLang(await getLangPref()));
  chrome.action.setTitle({ title: t('actionTitle') });
}

chrome.runtime.onInstalled.addListener(updateActionTitle);
chrome.runtime.onStartup.addListener(updateActionTitle);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.language) updateActionTitle();
});
