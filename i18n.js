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
