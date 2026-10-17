// Renders the README screenshots into docs/images/<lang>/.
//
// It loads the extension (with screenshots turned on) into a throwaway Chrome
// profile, opens a set of fictional demo sites (demo-sites.js) in two windows,
// lets the extension capture them, then photographs the overview page.
//
//   npm install
//   npm run screenshots              # both languages
//   npm run screenshots -- --lang zh # one language
//
// Uses your installed Google Chrome (a recent version: it relies on the
// Extensions.loadUnpacked DevTools command); set CHROME_PATH to use another
// Chrome or Chromium binary. Your own Chrome profile is never touched.

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer-core');
const { demoPage } = require('./demo-sites');

const ROOT = path.resolve(__dirname, '../..');
const EXTENSION_DIR = path.join(ROOT, 'extension');
const OUT_DIR = path.join(ROOT, 'docs/images');

// Window 1, in tab order, then window 2.
const WINDOW_1 = ['mail', 'news', 'recipe', 'docs', 'pr', 'cal', 'stats', 'weather', 'hotel', 'photos', 'music', 'board'];
const WINDOW_2 = ['wiki', 'video', 'sheet'];
const GROUPS = [
  { tabs: ['docs', 'pr', 'cal', 'stats'], color: 'blue', title: { en: 'Work', zh: '工作' } },
  { tabs: ['weather', 'hotel', 'photos'], color: 'orange', title: { en: 'Kyoto trip', zh: '京都旅行' } },
];
const SEARCH = { en: 'kyoto', zh: '京都' };
const IMAGE = { type: 'webp', quality: 92 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startDemoServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const name = url.pathname.slice(1);
    try {
      const html = demoPage(name, url.searchParams.get('lang') || 'en');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }));
  });
}

// Screenshots are opt-in: turning them on grants an optional permission through a
// Chrome dialog that can't be clicked in headless mode. So install a copy of the
// extension whose manifest asks for that permission up front, which is the same
// state as a user who switched screenshots on.
function extensionWithScreenshotsOn(tmp) {
  const dir = path.join(tmp, 'extension');
  fs.cpSync(EXTENSION_DIR, dir, { recursive: true });
  const manifestPath = path.join(dir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.host_permissions = manifest.optional_host_permissions;
  delete manifest.optional_host_permissions;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return dir;
}

async function launchChrome() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tab-overview-screenshots-'));
  const userDataDir = path.join(tmp, 'profile');
  const browser = await puppeteer.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }),
    headless: true,
    pipe: true,
    enableExtensions: true, // lets installExtension() load an unpacked extension
    userDataDir,
    defaultViewport: null,
    args: [
      '--window-size=1440,900',
      '--force-device-scale-factor=2',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-search-engine-choice-screen',
      '--disable-features=Translate,MediaRouter',
    ],
  });
  const id = await browser.installExtension(extensionWithScreenshotsOn(tmp));
  const workerTarget = await browser.waitForTarget(
    (t) => t.type() === 'service_worker' && t.url().startsWith(`chrome-extension://${id}/`),
  );
  return {
    browser,
    worker: await workerTarget.worker(),
    extension: (await browser.extensions()).get(id),
    overviewUrl: `chrome-extension://${id}/overview.html`,
    async close() {
      await browser.close().catch(() => {});
      fs.rmSync(tmp, { recursive: true, force: true });
    },
  };
}

async function render(lang, base) {
  const outDir = path.join(OUT_DIR, lang);
  fs.mkdirSync(outDir, { recursive: true });
  const url = (name) => `${base}/${name}?lang=${lang}`;
  const env = await launchChrome();
  const { browser, worker } = env;
  try {
    await worker.evaluate((l) => chrome.storage.sync.set({ language: l }), lang);

    // Open window 1 and show every tab for a moment, so the extension captures it
    // (it takes at most two screenshots a second).
    const [first] = await browser.pages();
    const pages = [first];
    await first.goto(url(WINDOW_1[0]), { waitUntil: 'load' });
    for (const name of WINDOW_1.slice(1)) {
      const page = await browser.newPage();
      await page.goto(url(name), { waitUntil: 'load' });
      pages.push(page);
    }
    for (const page of pages) {
      await page.bringToFront();
      await sleep(1300);
    }

    // Window 2, same again.
    const win = await worker.evaluate(async (urls) => {
      const w = await chrome.windows.create({ url: urls, focused: true });
      return { id: w.id, tabs: w.tabs.map((t) => t.id) };
    }, WINDOW_2.map(url));
    await sleep(1500);
    for (const tabId of win.tabs) {
      await worker.evaluate(async (tab, w) => {
        await chrome.tabs.update(tab, { active: true });
        await chrome.windows.update(w, { focused: true });
      }, tabId, win.id);
      await sleep(1300);
    }

    // Pin the inbox and make the tab groups (in window 1).
    await worker.evaluate(async (groups, lang) => {
      const tabs = await chrome.tabs.query({});
      const idOf = (name) => tabs.find((t) => new URL(t.url).pathname === `/${name}`).id;
      const windowId = tabs.find((t) => new URL(t.url).pathname === '/news').windowId;
      await chrome.tabs.update(idOf('mail'), { pinned: true });
      for (const g of groups) {
        const groupId = await chrome.tabs.group({ tabIds: g.tabs.map(idOf), createProperties: { windowId } });
        await chrome.tabGroups.update(groupId, { title: g.title[lang], color: g.color });
      }
    }, GROUPS, lang);

    // Open the overview from the news tab, as if pressing the shortcut there.
    const news = pages[WINDOW_1.indexOf('news')];
    await news.bringToFront();
    await sleep(1600);
    await news.triggerExtensionAction(env.extension);
    const overview = await (await browser.waitForTarget((t) => t.url().startsWith(env.overviewUrl))).page();
    await overview.waitForSelector('.card');
    await overview.setViewport({ width: 1440, height: 830, deviceScaleFactor: 2 });
    await overview.mouse.move(8, 8); // keep the pointer off the cards
    await sleep(1200); // let the entrance animation finish

    const missing = await overview.evaluate(() => document.querySelectorAll('[data-tab]:not(:has(img.shot))').length);
    if (missing) console.warn(`  ${missing} tab(s) have no thumbnail yet; rerun if the images look incomplete`);
    const shoot = (name, options = {}) => overview.screenshot({ path: path.join(outDir, `${name}.webp`), ...IMAGE, ...options });

    // Set the theme explicitly: headless Chrome otherwise follows the system's.
    const theme = (value) => overview.emulateMediaFeatures([{ name: 'prefers-color-scheme', value }]);
    await theme('dark');
    await sleep(300);
    await shoot('overview-dark');
    await theme('light');
    await sleep(300);
    await shoot('overview');

    await overview.setViewport({ width: 1440, height: 420, deviceScaleFactor: 2 });
    await overview.focus('#search');
    await overview.keyboard.type(SEARCH[lang]);
    await sleep(500);
    await shoot('search');

    await overview.keyboard.press('Escape');
    await sleep(300);
    await overview.click('.card.group');
    await overview.mouse.move(8, 8);
    await sleep(700);
    await shoot('group');

    await overview.keyboard.press('Escape');
    await sleep(400);
    await overview.click('#settings-btn');
    await overview.mouse.move(8, 8);
    await sleep(300);
    await shoot('settings', { clip: { x: 900, y: 0, width: 540, height: 410 } });

    console.log(`  ${path.relative(ROOT, outDir)}/: ${fs.readdirSync(outDir).join(', ')}`);
  } finally {
    await env.close();
  }
}

(async () => {
  const i = process.argv.indexOf('--lang');
  const langs = i > 0 ? [process.argv[i + 1]] : ['en', 'zh'];
  for (const lang of langs) {
    if (!SEARCH[lang]) throw new Error(`unknown language "${lang}" (use en or zh)`);
  }
  const { server, base } = await startDemoServer();
  try {
    for (const lang of langs) {
      console.log(`Rendering ${lang} screenshots…`);
      await render(lang, base);
    }
  } finally {
    server.close();
  }
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
