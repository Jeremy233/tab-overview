// UI strings for the two supported languages. The 'auto' preference
// follows the browser's UI language (Chinese variants → zh, else en).

const STRINGS = {
  zh: {
    pageTitle: '所有标签页',
    searchPlaceholder: '搜索标签页',
    noMatches: '没有匹配的标签页',
    hintSelect: '选择',
    hintOpen: '打开',
    hintBack: '返回',
    currentWindow: '当前窗口',
    windowN: (n) => `窗口 ${n}`,
    tabCount: (n) => `${n} 个标签页`,
    untitled: '新标签页',
    closeTab: '关闭标签页',
    closeGroup: '关闭整个分组',
    newTab: '新建标签页',
    newTabTitle: '在这个窗口新建标签页',
    newTabInGroupTitle: '在这个分组新建标签页',
    tabGroup: '标签页分组',
    currentBadge: '当前',
    actionTitle: '显示所有标签页',
    settings: '设置',
    language: '语言',
    langAuto: '跟随浏览器',
    screenshots: '页面截图',
    screenshotsHint: '用缩略图显示每个网页，在你浏览时截取，只存在本机内存里。开启时 Chrome 会请求访问网站的权限。',
    shotsTip: '现在只显示网站图标。打开页面截图，就能看到每个网页的缩略图。',
    shotsTipAction: '去设置',
    dismiss: '不再显示',
    shortcut: '快捷键',
    shortcutNone: '未设置',
    changeShortcut: '修改',
  },
  en: {
    pageTitle: 'All Tabs',
    searchPlaceholder: 'Search tabs',
    noMatches: 'No matching tabs',
    hintSelect: 'Select',
    hintOpen: 'Open',
    hintBack: 'Back',
    currentWindow: 'This Window',
    windowN: (n) => `Window ${n}`,
    tabCount: (n) => (n === 1 ? '1 tab' : `${n} tabs`),
    untitled: 'New Tab',
    closeTab: 'Close tab',
    closeGroup: 'Close all tabs in this group',
    newTab: 'New Tab',
    newTabTitle: 'Open a new tab in this window',
    newTabInGroupTitle: 'Open a new tab in this group',
    tabGroup: 'Tab group',
    currentBadge: 'Current',
    actionTitle: 'Show all tabs',
    settings: 'Settings',
    language: 'Language',
    langAuto: 'Follow browser',
    screenshots: 'Page screenshots',
    screenshotsHint: 'Show a picture of each page, taken as you view it and kept only in this computer’s memory. Chrome asks for site access first.',
    shotsTip: 'Tabs show their site icon. Turn on page screenshots to see a picture of each page.',
    shotsTipAction: 'Open settings',
    dismiss: 'Don’t show again',
    shortcut: 'Shortcut',
    shortcutNone: 'Not set',
    changeShortcut: 'Change',
  },
};

function resolveLang(pref) {
  if (pref === 'zh' || pref === 'en') return pref;
  return chrome.i18n.getUILanguage().toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

async function getLangPref() {
  const { language = 'auto' } = await chrome.storage.sync.get('language');
  return language;
}

function translator(lang) {
  const dict = STRINGS[lang] || STRINGS.en;
  return (key, ...args) => {
    const value = dict[key] ?? STRINGS.en[key] ?? key;
    return typeof value === 'function' ? value(...args) : value;
  };
}
