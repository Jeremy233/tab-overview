// Chrome can only screenshot the tab that is currently visible in a window,
// so we capture each tab whenever it is shown and cache a small thumbnail.

importScripts('i18n.js');

const OVERVIEW_URL = chrome.runtime.getURL('overview.html');
const THUMB_WIDTH = 560;
const MIN_CAPTURE_GAP = 600; // Chrome allows ~2 captureVisibleTab calls per second

let lastCaptureAt = 0;
const capturedAt = new Map(); // tabId -> time of last screenshot
const timers = new Map(); // windowId -> pending capture timer

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const thumbKey = (tabId) => `thumb:${tabId}`;

function isCapturable(tab) {
  return tab && /^(https?|file):/.test(tab.url || '');
}

async function toDataUrl(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:${blob.type};base64,${btoa(bin)}`;
}

async function shrink(dataUrl) {
  const bitmap = await createImageBitmap(await (await fetch(dataUrl)).blob());
  const scale = Math.min(1, THUMB_WIDTH / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(w, h);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  return toDataUrl(await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.72 }));
}

async function saveThumb(tabId, shot) {
  try {
    await chrome.storage.session.set({ [thumbKey(tabId)]: { src: await shrink(shot), at: Date.now() } });
  } catch (err) {
    console.warn('saving thumbnail failed', err);
  }
}

// Resolves as soon as the raw screenshot is taken; shrinking and saving
// continue in the background so callers can move on immediately.
async function captureWindow(windowId, { skipIfFresherThan = 0 } = {}) {
  const [tab] = await chrome.tabs.query({ active: true, windowId });
  if (!isCapturable(tab)) return;
  if (Date.now() - (capturedAt.get(tab.id) || 0) < skipIfFresherThan) return;

  const wait = lastCaptureAt + MIN_CAPTURE_GAP - Date.now();
  if (wait > 0) await sleep(wait);
  lastCaptureAt = Date.now();

  try {
    const shot = await chrome.tabs.captureVisibleTab(windowId, { format: 'jpeg', quality: 85 });
    // The user may have switched tabs while we waited; don't mislabel the shot.
    const [still] = await chrome.tabs.query({ active: true, windowId });
    if (still?.id !== tab.id) return;
    capturedAt.set(tab.id, Date.now());
    saveThumb(tab.id, shot);
  } catch (err) {
    // Window minimized, page not capturable, etc.
    console.warn('capture failed', tab.url, err);
  }
}

function scheduleCapture(windowId, delay = 400) {
  clearTimeout(timers.get(windowId));
  timers.set(windowId, setTimeout(() => {
    timers.delete(windowId);
    captureWindow(windowId);
  }, delay));
}

chrome.tabs.onActivated.addListener(({ windowId }) => scheduleCapture(windowId));

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === 'complete' && tab.active) scheduleCapture(tab.windowId, 300);
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) scheduleCapture(windowId);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  capturedAt.delete(tabId);
  chrome.storage.session.remove(thumbKey(tabId));
});
chrome.tabs.onReplaced.addListener((_added, removed) => chrome.storage.session.remove(thumbKey(removed)));

// Toolbar button / ⌘⇧E: open the overview, or close it if it's already showing.
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url?.startsWith(OVERVIEW_URL)) {
    const from = Number(new URL(tab.url).searchParams.get('from'));
    if (from) await chrome.tabs.update(from, { active: true }).catch(() => {});
    await chrome.tabs.remove(tab.id);
    return;
  }

  // Grab the current tab while it's still visible (skipped if we just did),
  // then open the overview right away; the thumbnail is saved in the background.
  clearTimeout(timers.get(tab.windowId));
  await captureWindow(tab.windowId, { skipIfFresherThan: 1500 });

  const created = await chrome.tabs.create({
    url: `${OVERVIEW_URL}?from=${tab.id}`,
    index: tab.index + 1,
    windowId: tab.windowId,
  });

  const all = await chrome.tabs.query({});
  const stale = all.filter((t) => t.id !== created.id && t.url?.startsWith(OVERVIEW_URL)).map((t) => t.id);
  if (stale.length) chrome.tabs.remove(stale);
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
