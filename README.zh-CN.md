<p align="center"><img src="docs/images/icon.png" width="128" height="128" alt=""></p>

<h1 align="center">Tab Overview</h1>

<p align="center"><a href="README.md">English</a> · <strong>简体中文</strong></p>

<p align="center">像 Safari 一样，用缩略图网格一眼看清 Chrome 里打开的所有标签页。<br>按下 <kbd>⌘</kbd><kbd>⇧</kbd><kbd>E</kbd>，找到想要的标签页，直接跳过去。</p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/zh/overview-dark.webp">
  <img src="docs/images/zh/overview.webp" alt="Tab Overview：所有标签页以缩略图显示，按窗口分区，标签页分组显示为拼图">
</picture>

## 功能

- **所有标签页一览无余**：跨所有窗口显示缩略图，当前窗口排在最前。
- **即时搜索**：按标题或网址边输入边过滤，支持拼音等输入法。
- **键盘优先**：方向键移动，<kbd>Enter</kbd> 切换，<kbd>Esc</kbd> 返回。
- **标签页分组**：每个分组折叠成一张卡片，显示组内标签页的拼图；点开即可查看全部。
- **就地整理**：关闭单个标签页或整个分组，或在任意窗口、分组里新建标签页。
- **浅色 / 深色**主题跟随系统；界面支持**简体中文和英文**。
- **截图需手动开启**：默认关闭，标签页只显示网站图标。在设置里打开后，才会在你浏览时截图；截图只保存在浏览器内存里，不写入硬盘、不上传，关闭 Chrome 后自动清除。

## 安装

目前还没有上架 Chrome 网上应用店，需要以"已解压的扩展程序"方式安装：

1. 获取代码：`git clone https://github.com/Jeremy233/tab-overview.git`，或在 GitHub 页面点 **Code → Download ZIP** 下载后解压。
2. 打开 `chrome://extensions`，打开右上角的 **开发者模式**。
3. 点 **加载已解压的扩展程序**，选择项目里的 **`extension`** 文件夹。
4. 可选：点 Chrome 工具栏上的拼图图标，把 **Tab Overview** 固定到工具栏。
5. 可选：想看到网页缩略图而不只是图标，就打开总览，点齿轮，打开 **页面截图**（见下文[页面截图](#页面截图)）。

需要 Chrome 112 或更高版本。其他基于 Chromium 的浏览器理论上也能用，但还没有测试过。

想知道有没有新版本，就在总览页的设置里点 **检查更新**。更新时，拉取最新代码（或重新下载），然后在 `chrome://extensions` 里点这个扩展卡片上的刷新按钮 ↻。

## 使用方法

### 打开与关闭

在 macOS 上按 <kbd>⌘</kbd><kbd>⇧</kbd><kbd>E</kbd>，在 Windows 和 Linux 上按 <kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>E</kbd>，或者点工具栏按钮。你原来所在的标签页会标上 **当前**，并且已经选中。再按一次快捷键或按 <kbd>Esc</kbd>，就会关闭总览，回到原来的标签页。

> 如果按快捷键没反应，可能是被其他扩展占用了。在 **设置** 里点一下显示的快捷键就能换一个，或者直接打开 `chrome://extensions/shortcuts` 设置。

### 查找标签页

直接打字就行，搜索框默认已经获得焦点。会在所有窗口中按标题和网址查找。搜索时分组会自动展开，每个标签页前的彩色圆点表示它属于哪个分组；右上角显示"匹配数 / 总数"。

<img src="docs/images/zh/search.webp" alt="搜索“京都”，找到“京都旅行”分组里的三个标签页">

### 键盘操作

| 按键 | 作用 |
| --- | --- |
| <kbd>⌘</kbd><kbd>⇧</kbd><kbd>E</kbd> / <kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>E</kbd> | 打开或关闭总览 |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | 移动选中的卡片（输入搜索词时，<kbd>←</kbd> <kbd>→</kbd> 用来移动光标） |
| <kbd>Enter</kbd> | 切换到选中的标签页，或打开选中的分组 |
| <kbd>Esc</kbd> | 依次：清空搜索 → 退出分组 → 回到原来的标签页 |

鼠标操作：点卡片切换到该标签页，点 **×** 关闭，点 **+ 新建标签页** 在该窗口新开一个标签页。

### 标签页分组

每个分组显示为一张卡片，带有分组的颜色、名称、标签页数量，以及最多九个标签页拼成的缩略图。点击它（或按 <kbd>Enter</kbd>）查看组内所有标签页，点 **‹ 所有标签页**（或按 <kbd>Esc</kbd>）返回。在分组里点 **+ 新建标签页**，新标签页会直接加入这个分组。分组卡片上的 **×** 会关闭组内所有标签页。

<img src="docs/images/zh/group.webp" alt="“工作”分组内部：四个标签页和一张新建标签页卡片">

### 设置

点右上角的齿轮图标，可以：

- 切换界面语言（跟随浏览器、中文或 English）；
- 开关页面截图；
- 查看快捷键，点一下就能修改；
- 查看版本号，并 **检查更新**；
- 打开项目的 **GitHub** 页面。

<img src="docs/images/zh/settings.webp" alt="设置面板：语言和快捷键" width="540">

## 页面截图

截图**默认关闭**：每个标签页只显示网站图标和域名。想看到网页缩略图，就打开 **设置 → 页面截图**。这时 Chrome 会询问是否允许 Tab Overview *"读取和更改您在所有网站上的所有数据"*：这是 Chrome 允许扩展截取当前标签页的前提，Tab Overview 只用它来截图，不做别的。关掉开关会立即交还这项权限，并删除所有截图。截图关闭时，总览页顶部会有一行小提示指向这个设置；点 **×** 后就不再显示。

开启之后要注意，Chrome 只允许扩展截取当前显示在屏幕上的那个标签页。所以 Tab Overview 会在你看某个标签页的时候顺手截一张小图：切换过去后不久、页面加载完成后，以及打开总览之前。因此：

- 开启截图后（或 Chrome 启动后）还没看过的标签页，会先显示网站图标和域名，看过一次后就有缩略图了。
- 有些页面无法截图：`chrome://…` 等浏览器内置页面、Chrome 网上应用店，以及本地文件（除非在扩展详情里打开 **允许访问文件网址**）。
- 缩略图只保存在内存里，上限约 10 MB（大约 180 个标签页）。存满后，最久没看过的标签页的缩略图会先被删掉。关闭 Chrome 后全部清除。

## 权限说明

| 权限 | 用途 |
| --- | --- |
| `tabs` | 列出标签页及其标题和网址；切换、关闭、新建标签页 |
| `tabGroups` | 显示标签页分组的名称和颜色 |
| `storage` | 保存缩略图（仅在内存中）和语言设置 |
| `favicon` | 从 Chrome 自身的缓存读取网站图标，不发起任何网络请求 |
| 访问所有网站的数据（可选） | 只在你打开页面截图时才会申请：Chrome 要求有这个权限才能截取当前标签页 |

安装时 Chrome 只会提示"读取您的浏览记录"（来自 `tabs`）和管理标签页分组。Tab Overview 没有统计分析，也不加载远程代码。它唯一会发起的网络请求，是在你点 **检查更新** 时，去 GitHub 读取本仓库 `extension/manifest.json` 里的版本号。

## 重新生成截图

README 里的截图是用脚本自动生成的，界面改动后可以随时重新生成。需要 [Node.js](https://nodejs.org) 18 或更高版本，以及 Google Chrome。

```bash
cd tools/screenshots
npm install
npm run screenshots
```

脚本会在后台用一个临时配置启动 Chrome（不会动你自己的浏览器数据），从 `extension/` 加载一份已开启页面截图的扩展副本，在两个窗口里打开一组虚构的演示网站，等扩展截好缩略图后，再给总览页拍照。中英文两套大约需要一分钟，图片会写入 `docs/images/en/` 和 `docs/images/zh/`。

- 只生成一种语言：`npm run screenshots -- --lang zh`
- 使用其他 Chrome 或 Chromium：`CHROME_PATH=/path/to/chrome npm run screenshots`
- 演示网站在 `tools/screenshots/demo-sites.js` 里；要打开哪些标签页、怎么分组、搜什么词，在 `tools/screenshots/render.js` 开头设置。

## 项目结构

```
tab-overview/
├── extension/           扩展本体：安装时加载的就是这个文件夹
│   ├── manifest.json
│   ├── background.js    截取缩略图；处理工具栏按钮和快捷键
│   ├── overview.html    总览页面
│   ├── overview.css
│   ├── overview.js
│   ├── i18n.js          中英文界面文字
│   ├── icons/           16、32、48、128 像素的扩展图标
│   └── _locales/        Chrome 显示的扩展名称和描述
├── docs/images/         README 里用到的图标和截图
├── tools/screenshots/   生成这些截图的脚本
├── LICENSE
├── README.md
└── README.zh-CN.md
```

## 开源许可

[MIT](LICENSE) © 2026 Jeremy233
