// Fictional websites the screenshots are taken of, in English and Chinese.
// Each is a single self-contained page: no external images, fonts or scripts.

const FONT = `-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif`;

const L = {
  en: {
    lorem: 'The quick brown fox jumps over the lazy dog while the team ships another release. Small steps every day add up to something big, and good tools make the work feel lighter.',
    mail: { title: 'Inbox (3) – Mail', compose: 'Compose', folders: ['Inbox', 'Starred', 'Sent', 'Drafts', 'Archive'], search: 'Search mail',
      rows: [['Maya Chen', 'Design review moved to Thursday', 'Hi! Quick heads-up — we moved the review…', '9:41'], ['Travel Desk', 'Your Kyoto booking is confirmed', 'Check-in: Oct 24 · 3 nights · Gion…', '8:15'], ['Leo Park', 'Re: Q4 roadmap draft', 'Looks great. A few small comments…', 'Yesterday'], ['Book Club', 'November pick 📚', 'We are reading “The Overstory”…', 'Mon'], ['Nimbus', 'Your weekly usage report', '42 deploys, 99.98% uptime…', 'Mon'], ['Aunt Rosa', 'Lemon pasta recipe!', 'Here is the one you liked…', 'Sun'], ['Dev Weekly', 'Issue #312: faster browsers', 'This week: tab management…', 'Sat']] },
    news: { title: 'Daily Brief — Top stories', mast: 'The Daily Brief', nav: ['World', 'Tech', 'Science', 'Culture', 'Travel', 'Food'], lead: 'Autumn arrives early across the mountains as maple leaves turn red', more: ['City adds 40 km of new bike lanes', 'Tiny satellites map coral reefs from orbit', 'The comeback of the neighbourhood bookstore'] },
    recipe: { title: 'Lemon Garlic Pasta — 20-minute recipe', h: 'Lemon Garlic Pasta', meta: ['20 min', 'Serves 2', 'Easy'], ing: 'Ingredients', items: ['200 g spaghetti', '2 lemons, zest & juice', '3 cloves garlic', '40 g parmesan', 'Olive oil, pepper'], steps: 'Steps' },
    docs: { title: 'Getting Started — Nimbus Docs', brand: 'Nimbus Docs', side: ['Introduction', 'Getting started', 'Configuration', 'Deploying', 'CLI reference', 'FAQ'], h: 'Getting started', p: 'Install the CLI, create a project and deploy it in under a minute.' },
    pr: { title: 'Fix flaky upload test · Pull Request #128', h: 'Fix flaky upload test', open: 'Open', tabs: ['Conversation', 'Commits 3', 'Checks', 'Files changed 2'] },
    cal: { title: 'Calendar — October 2026', month: 'October 2026', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], ev: ['Standup', 'Design review', '1:1 with Leo', 'Launch 🚀', 'Flight to Kyoto', 'Yoga', 'Team lunch'] },
    stats: { title: 'Analytics — Weekly overview', h: 'Weekly overview', kpi: [['Visitors', '48.2k', '+12%'], ['Sign-ups', '1,284', '+8%'], ['Revenue', '$9.6k', '+15%'], ['Churn', '1.9%', '−0.3%']] },
    weather: { title: 'Kyoto Weather — 10-day forecast', city: 'Kyoto', cond: 'Partly cloudy', days: ['Today', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'] },
    hotel: { title: 'Hotels in Kyoto — 3 nights', search: 'Kyoto · Oct 24 – 27 · 2 guests', names: ['Gion Garden Inn', 'Kamo River Hotel', 'Arashiyama Ryokan'], night: '/ night' },
    photos: { title: 'Kyoto · Photo album', h: 'Kyoto, autumn', sub: '128 photos · shared with 3 people' },
    music: { kind: 'PLAYLIST', title: 'Lo-fi Focus — Playlist', h: 'Lo-fi Focus', sub: 'Playlist · 48 songs · 2 h 31 min', tracks: ['Rainy Window', 'Late Night Tea', 'Paper Planes', 'Soft Static', 'Sunday Morning', 'City Lights'] },
    board: { title: 'Sprint 14 — Board', h: 'Sprint 14', cols: ['To do', 'In progress', 'Review', 'Done'], cards: ['Search shortcut', 'Dark mode polish', 'Onboarding emails', 'Fix upload test', 'Pricing page copy', 'Faster thumbnails', 'Release notes', 'A11y audit'] },
    wiki: { brand: 'Open Encyclopedia', title: 'Fushimi Inari-taisha — Encyclopedia', h: 'Fushimi Inari-taisha', sub: 'From the free encyclopedia', p: 'Fushimi Inari-taisha is the head shrine of the kami Inari, located in Fushimi-ku, Kyoto. It is famous for its thousands of vermilion torii gates, which straddle a network of trails behind its main buildings.' },
    video: { title: 'How to make fresh pasta at home — Video', h: 'How to make fresh pasta at home', sub: '1.2M views · 3 weeks ago', up: 'Up next' },
    sheet: { title: 'Budget 2026 — Sheets', h: 'Budget 2026', cols: ['Category', 'Jan', 'Feb', 'Mar', 'Apr', 'Total'], rows: ['Rent', 'Groceries', 'Transport', 'Travel', 'Books', 'Gym', 'Utilities', 'Savings'] },
  },
  zh: {
    lorem: '敏捷的棕色狐狸跳过了懒狗，团队又顺利发布了一个新版本。每天进步一点点，积少成多；好用的工具会让工作变得更轻松，也让生活多一点从容。',
    mail: { title: '收件箱 (3) – 邮件', compose: '写邮件', folders: ['收件箱', '星标', '已发送', '草稿', '归档'], search: '搜索邮件',
      rows: [['陈曼', '设计评审改到周四', '你好！提前说一声，评审时间调整了…', '9:41'], ['旅行服务', '京都住宿预订成功', '入住：10 月 24 日 · 3 晚 · 祇园…', '8:15'], ['朴乐', '回复：第四季度路线图', '整体很好，有几处小建议…', '昨天'], ['读书会', '十一月书单 📚', '这个月我们读《树语》…', '周一'], ['Nimbus', '每周用量报告', '42 次部署，可用率 99.98%…', '周一'], ['罗莎阿姨', '柠檬意面的做法！', '就是你上次喜欢的那道…', '周日'], ['开发周刊', '第 312 期：更快的浏览器', '本周话题：标签页管理…', '周六']] },
    news: { title: '每日简报 — 头条新闻', mast: '每日简报', nav: ['国际', '科技', '科学', '文化', '旅行', '美食'], lead: '秋意提前到来，山间枫叶渐次染红', more: ['城市新增 40 公里自行车道', '微型卫星从太空绘制珊瑚礁地图', '社区书店正在回归'] },
    recipe: { title: '柠檬蒜香意面 — 20 分钟食谱', h: '柠檬蒜香意面', meta: ['20 分钟', '2 人份', '简单'], ing: '食材', items: ['意面 200 克', '柠檬 2 个（皮屑和汁）', '大蒜 3 瓣', '帕玛森奶酪 40 克', '橄榄油、黑胡椒'], steps: '步骤' },
    docs: { title: '快速开始 — Nimbus 文档', brand: 'Nimbus 文档', side: ['简介', '快速开始', '配置', '部署', '命令行参考', '常见问题'], h: '快速开始', p: '安装命令行工具、创建项目，一分钟内即可完成部署。' },
    pr: { title: '修复不稳定的上传测试 · 合并请求 #128', h: '修复不稳定的上传测试', open: '开放', tabs: ['讨论', '提交 3', '检查', '文件改动 2'] },
    cal: { title: '日历 — 2026 年 10 月', month: '2026 年 10 月', days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], ev: ['站会', '设计评审', '与朴乐 1:1', '发布 🚀', '飞往京都', '瑜伽', '团队午餐'] },
    stats: { title: '数据分析 — 每周概览', h: '每周概览', kpi: [['访客', '4.82 万', '+12%'], ['注册', '1,284', '+8%'], ['收入', '¥6.9 万', '+15%'], ['流失率', '1.9%', '−0.3%']] },
    weather: { title: '京都天气 — 10 日预报', city: '京都', cond: '多云', days: ['今天', '周五', '周六', '周日', '周一', '周二', '周三'] },
    hotel: { title: '京都酒店 — 3 晚', search: '京都 · 10 月 24 – 27 日 · 2 位客人', names: ['祇园花园旅馆', '鸭川酒店', '岚山日式旅馆'], night: '/ 晚' },
    photos: { title: '京都 · 相册', h: '京都之秋', sub: '128 张照片 · 与 3 人共享' },
    music: { kind: '歌单', title: '专注 Lo-fi — 歌单', h: '专注 Lo-fi', sub: '歌单 · 48 首 · 2 小时 31 分', tracks: ['雨天的窗', '深夜的茶', '纸飞机', '轻柔的噪点', '周日早晨', '城市灯火'] },
    board: { title: '第 14 次迭代 — 看板', h: '第 14 次迭代', cols: ['待办', '进行中', '评审', '完成'], cards: ['搜索快捷键', '深色模式细节', '新用户引导邮件', '修复上传测试', '定价页文案', '更快的缩略图', '发布说明', '无障碍检查'] },
    wiki: { brand: '开放百科', title: '伏见稻荷大社 — 百科', h: '伏见稻荷大社', sub: '来自自由的百科全书', p: '伏见稻荷大社位于京都市伏见区，是全日本稻荷神社的总本社。神社以绵延山间的数千座朱红色鸟居闻名，形成了著名的“千本鸟居”步道。' },
    video: { title: '在家做手工意面 — 视频', h: '在家做手工意面', sub: '120 万次观看 · 3 周前', up: '接下来播放' },
    sheet: { title: '2026 预算 — 表格', h: '2026 预算', cols: ['类别', '1 月', '2 月', '3 月', '4 月', '合计'], rows: ['房租', '买菜', '交通', '旅行', '书籍', '健身', '水电', '储蓄'] },
  },
};

const ICONS = { mail: '✉️', news: '📰', recipe: '🍋', docs: '📘', pr: '🔀', cal: '📅', stats: '📊', weather: '⛅', hotel: '🏨', photos: '🍁', music: '🎧', board: '🗂️', wiki: '📖', video: '▶️', sheet: '📗' };

const favicon = (emoji) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="88">${emoji}</text></svg>`);
const para = (s, n = 1) => Array.from({ length: n }, () => `<p>${s}</p>`).join('');

const PAGES = {
  mail: (t) => [`body{display:grid;grid-template-columns:220px 1fr;height:100vh;background:#f6f8fc}
    aside{padding:18px 12px} .compose{display:inline-block;padding:16px 26px;border-radius:16px;background:#c2e7ff;font-weight:600;margin-bottom:16px}
    aside div.f{padding:9px 16px;border-radius:20px;color:#333} aside div.f.on{background:#d3e3fd;font-weight:700}
    main{background:#fff;margin:12px 12px 12px 0;border-radius:16px;overflow:hidden} .bar{padding:14px 20px} .bar span{display:block;max-width:560px;padding:12px 18px;border-radius:24px;background:#eaf1fb;color:#666}
    .row{display:grid;grid-template-columns:44px 190px 1fr 90px;gap:14px;align-items:center;padding:14px 22px;border-top:1px solid #eee;font-size:17px} .av{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700} .row.u b{font-weight:700} .row i{font-style:normal;color:#777} .row time{text-align:right;color:#555;font-size:13px}`,
    `<aside><span class="compose">✏️ ${t.compose}</span>${t.folders.map((f, i) => `<div class="f ${i ? '' : 'on'}">${f}</div>`).join('')}</aside>
    <main><div class="bar"><span>🔍 ${t.search}</span></div>${t.rows.map((r, i) => `<div class="row ${i < 3 ? 'u' : ''}"><span class="av" style="background:${['#e8710a', '#1a73e8', '#188038', '#a142f4', '#12b5cb', '#d01884', '#5f6368'][i]}">${r[0][0]}</span><b>${r[0]}</b><span><b>${r[1]}</b> <i>— ${r[2]}</i></span><time>${r[3]}</time></div>`).join('')}</main>`],
  news: (t, l) => [`body{background:#fbf8f3;color:#1a1a1a} .mast{text-align:center;font:700 54px/1.1 Georgia,"Songti SC",serif;padding:26px 0 10px;letter-spacing:-1px}
    nav{display:flex;justify-content:center;gap:34px;border-top:2px solid #111;border-bottom:1px solid #111;padding:10px;font-weight:600;text-transform:uppercase;font-size:13px}
    .lead{display:grid;grid-template-columns:1.4fr 1fr;gap:32px;padding:28px 60px} .img{border-radius:6px;background:linear-gradient(135deg,#c0392b,#e67e22 45%,#f1c40f)} .lead .img{height:330px}
    h1{font:700 40px/1.15 Georgia,"Songti SC",serif;margin:0 0 14px} .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;padding:0 60px} .grid .img{height:150px;margin-bottom:10px} h3{font:700 20px Georgia,"Songti SC",serif;margin:6px 0}`,
    `<div class="mast">${t.mast}</div><nav>${t.nav.map((n) => `<span>${n}</span>`).join('')}</nav>
    <div class="lead"><div class="img"></div><div><h1>${t.lead}</h1>${para(l.lorem, 3)}</div></div>
    <div class="grid">${t.more.map((m, i) => `<div><div class="img" style="background:linear-gradient(135deg,${['#16a085,#2ecc71', '#2c3e50,#3498db', '#8e44ad,#e84393'][i]})"></div><h3>${m}</h3></div>`).join('')}</div>`],
  recipe: (t, l) => [`body{background:#fffdf5;color:#3b2f1e} .hero{height:300px;background:radial-gradient(circle at 25% 55%,#fff176 0 60px,transparent 61px),radial-gradient(circle at 70% 40%,#ffee58 0 85px,transparent 86px),radial-gradient(circle at 48% 80%,#c5e1a5 0 50px,transparent 51px),linear-gradient(135deg,#fbc02d,#f57f17)}
    .wrap{max-width:1100px;margin:-60px auto 0;background:#fff;border-radius:18px;padding:30px 44px;box-shadow:0 10px 30px rgba(0,0,0,.08)} h1{font:800 44px/1.1 Georgia,"Songti SC",serif;margin:0 0 12px}
    .meta span{display:inline-block;margin-right:10px;padding:5px 14px;border-radius:20px;background:#fff3c4;font-weight:600} .cols{display:grid;grid-template-columns:1fr 2fr;gap:40px;margin-top:22px} li{margin:8px 0} h2{color:#e65100}`,
    `<div class="hero"></div><div class="wrap"><h1>${t.h}</h1><div class="meta">${t.meta.map((m) => `<span>${m}</span>`).join('')}</div>
    <div class="cols"><div><h2>${t.ing}</h2><ul>${t.items.map((x) => `<li>${x}</li>`).join('')}</ul></div><div><h2>${t.steps}</h2><ol><li>${l.lorem}</li><li>${l.lorem}</li></ol></div></div></div>`],
  docs: (t, l) => [`body{color:#1f2937} header{background:#111827;color:#fff;padding:16px 28px;font-weight:700;font-size:18px} .cols{display:grid;grid-template-columns:240px 1fr}
    aside{border-right:1px solid #e5e7eb;padding:20px;min-height:100vh} aside div{padding:7px 12px;border-radius:8px;color:#4b5563} aside div.on{background:#eef2ff;color:#4338ca;font-weight:600}
    main{padding:30px 56px;max-width:880px} h1{font-size:40px;margin:0 0 10px} pre{background:#0f172a;color:#a5f3fc;padding:18px 22px;border-radius:10px;font:15px/1.6 Menlo,monospace} .tip{border-left:4px solid #6366f1;background:#eef2ff;padding:12px 16px;border-radius:6px}`,
    `<header>☁️ ${t.brand}</header><div class="cols"><aside>${t.side.map((s, i) => `<div class="${i === 1 ? 'on' : ''}">${s}</div>`).join('')}</aside>
    <main><h1>${t.h}</h1><p style="font-size:19px;color:#4b5563">${t.p}</p><pre>$ npm install -g nimbus-cli\n$ nimbus init my-app\n$ nimbus deploy\n✔ Deployed to https://my-app.nimbus.example</pre><div class="tip">💡 ${l.lorem}</div>${para(l.lorem, 2)}</main></div>`],
  pr: (t) => [`body{color:#1f2328} .top{padding:22px 40px 0;border-bottom:1px solid #d0d7de} h1{font-size:30px;font-weight:500;margin:0 0 10px} h1 span{color:#656d76}
    .open{display:inline-block;background:#1f883d;color:#fff;border-radius:20px;padding:5px 14px;font-weight:600;margin-bottom:16px} .tabs span{display:inline-block;padding:10px 16px;color:#656d76} .tabs span.on{border-bottom:2px solid #fd8c73;color:#1f2328;font-weight:600}
    .file{margin:24px 40px;border:1px solid #d0d7de;border-radius:8px;overflow:hidden;font:14px/1.7 Menlo,monospace} .file div{padding:0 14px} .head{background:#f6f8fa;padding:8px 14px!important;border-bottom:1px solid #d0d7de} .add{background:#dafbe1} .del{background:#ffebe9}`,
    `<div class="top"><h1>${t.h} <span>#128</span></h1><span class="open">⇄ ${t.open}</span><div class="tabs">${t.tabs.map((x, i) => `<span class="${i === 3 ? 'on' : ''}">${x}</span>`).join('')}</div></div>
    <div class="file"><div class="head">tests/upload.test.js</div><div>  it('uploads a file', async () =&gt; {</div><div class="del">-   await sleep(500);</div><div class="add">+   await waitFor(() =&gt; queue.isEmpty());</div><div>    expect(await list()).toContain('a.png');</div><div class="del">-   expect(progress).toBe(100);</div><div class="add">+   expect(await progress()).toBe(100);</div><div>  });</div></div>
    <div class="file"><div class="head">src/queue.js</div><div>export class Queue {</div><div class="add">+   isEmpty() { return this.items.length === 0; }</div><div>  push(item) { this.items.push(item); }</div><div>}</div></div>`],
  cal: (t) => [`body{color:#202124} header{display:flex;align-items:center;gap:18px;padding:16px 28px;font-size:24px} header b{font-weight:500}
    .grid{display:grid;grid-template-columns:repeat(7,1fr);border-top:1px solid #dadce0;border-left:1px solid #dadce0;margin:0 20px} .grid div{border-right:1px solid #dadce0;border-bottom:1px solid #dadce0;height:118px;padding:6px 8px;font-size:13px}
    .grid .d{height:auto;text-align:center;color:#70757a;font-weight:600} .e{display:block;margin-top:4px;padding:2px 6px;border-radius:4px;color:#fff;font-size:12px;white-space:nowrap;overflow:hidden}`,
    `<header>📅 <b>${t.month}</b></header><div class="grid">${t.days.map((d) => `<div class="d">${d}</div>`).join('')}${Array.from({ length: 28 }, (_, i) => {
      const ev = { 1: 0, 3: 1, 8: 2, 10: 0, 15: 3, 17: 0, 22: 4, 23: 5, 24: 0, 25: 6 }[i];
      const color = ['#1a73e8', '#8e24aa', '#33b679', '#e67c73', '#f4511e', '#039be5', '#f6bf26'][ev ?? 0];
      return `<div>${i + 1}${ev != null ? `<span class="e" style="background:${color}">${t.ev[ev]}</span>` : ''}</div>`;
    }).join('')}</div>`],
  stats: (t) => [`body{background:#f4f6fb;color:#1e293b} h1{margin:0;padding:26px 40px 8px;font-size:32px} .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;padding:12px 40px}
    .k{background:#fff;border-radius:14px;padding:18px 22px;box-shadow:0 1px 3px rgba(0,0,0,.06)} .k small{color:#64748b} .k b{display:block;font-size:30px;margin:6px 0} .k i{font-style:normal;color:#16a34a;font-weight:600}
    .charts{display:grid;grid-template-columns:2fr 1fr;gap:18px;padding:8px 40px} .card{background:#fff;border-radius:14px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06)}`,
    `<h1>📊 ${t.h}</h1><div class="kpis">${t.kpi.map((k) => `<div class="k"><small>${k[0]}</small><b>${k[1]}</b><i>${k[2]}</i></div>`).join('')}</div>
    <div class="charts"><div class="card"><svg viewBox="0 0 600 260" width="100%"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6366f1" stop-opacity=".35"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/></linearGradient></defs>
    <path d="M0 200 C60 180 90 120 150 130 S260 60 320 90 S430 40 480 60 S560 30 600 20 L600 260 L0 260Z" fill="url(#g)"/><path d="M0 200 C60 180 90 120 150 130 S260 60 320 90 S430 40 480 60 S560 30 600 20" fill="none" stroke="#6366f1" stroke-width="4"/></svg></div>
    <div class="card"><svg viewBox="0 0 260 260" width="100%">${[150, 210, 120, 180, 90, 230].map((h, i) => `<rect x="${12 + i * 41}" y="${250 - h}" width="28" height="${h}" rx="6" fill="${i === 5 ? '#f97316' : '#c7d2fe'}"/>`).join('')}</svg></div></div>`],
  weather: (t) => [`body{min-height:100vh;background:linear-gradient(180deg,#4a90e2,#89c4f4 60%,#cde8fb);color:#fff;text-align:center} .city{font-size:38px;padding-top:56px}
    .temp{font-size:150px;font-weight:200;line-height:1} .cond{font-size:26px;opacity:.9} .days{display:flex;justify-content:center;gap:16px;margin-top:44px}
    .day{width:120px;padding:16px 0;border-radius:18px;background:rgba(255,255,255,.22)} .day b{display:block;font-size:34px;margin:8px 0}`,
    `<div class="city">📍 ${t.city}</div><div class="temp">18°</div><div class="cond">${t.cond} · H 21° L 12°</div>
    <div class="days">${t.days.map((d, i) => `<div class="day">${d}<b>${['⛅', '☀️', '☀️', '🌧️', '⛅', '☀️', '🌤️'][i]}</b>${[21, 23, 22, 17, 19, 22, 20][i]}° / ${[12, 13, 14, 12, 11, 13, 12][i]}°</div>`).join('')}</div>`],
  hotel: (t) => [`body{background:#f3f5f7;color:#1c2b33} .bar{background:#003b95;padding:26px 60px} .bar span{display:block;background:#fff;border:3px solid #ffb700;border-radius:10px;padding:14px 18px;font-weight:600;max-width:760px}
    .list{padding:24px 60px;display:grid;gap:18px;max-width:1000px} .h{display:grid;grid-template-columns:240px 1fr 160px;gap:20px;background:#fff;border-radius:12px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
    .ph{height:150px;border-radius:8px} h3{margin:4px 0 6px;color:#006ce4;font-size:22px} .p{text-align:right;align-self:end;font-size:26px;font-weight:700} .p small{display:block;font-size:13px;color:#6b7280;font-weight:400} .s{background:#003b95;color:#fff;border-radius:6px;padding:2px 8px;font-weight:700}`,
    `<div class="bar"><span>🔍 ${t.search}</span></div><div class="list">${t.names.map((n, i) => `<div class="h"><div class="ph" style="background:linear-gradient(135deg,${['#a1887f,#d7ccc8', '#4db6ac,#b2dfdb', '#e57373,#ffcdd2'][i]})"></div><div><h3>${n}</h3><span class="s">${[9.1, 8.7, 9.4][i]}</span> ★★★★☆</div><div class="p">¥${['18,400', '14,900', '26,800'][i]}<small>${t.night}</small></div></div>`).join('')}</div>`],
  photos: (t) => [`body{background:#fff;color:#202124} header{padding:26px 36px 12px} h1{margin:0;font-size:34px} header small{color:#5f6368;font-size:16px}
    .grid{display:grid;grid-template-columns:repeat(6,1fr);grid-auto-rows:150px;gap:6px;padding:0 36px} .grid div{border-radius:4px} .w{grid-column:span 2} .t{grid-row:span 2}`,
    `<header><h1>🍁 ${t.h}</h1><small>${t.sub}</small></header><div class="grid">${['#e65100,#ffb74d', '#b71c1c,#ef5350', '#33691e,#9ccc65', '#4a148c,#ce93d8', '#bf360c,#ff8a65', '#827717,#dce775', '#0d47a1,#64b5f6', '#e65100,#ffcc80', '#880e4f,#f48fb1', '#1b5e20,#81c784', '#f57f17,#fff176', '#3e2723,#a1887f', '#c62828,#ff8a80', '#ef6c00,#ffe0b2'].map((c, i) => `<div class="${[0, 7].includes(i) ? 'w t' : i === 4 ? 'w' : ''}" style="background:linear-gradient(135deg,${c})"></div>`).join('')}</div>`],
  music: (t) => [`body{min-height:100vh;background:linear-gradient(180deg,#5b2a86,#1c1029 55%);color:#fff} .top{display:flex;gap:30px;align-items:end;padding:44px 44px 26px}
    .art{width:230px;height:230px;border-radius:8px;background:radial-gradient(circle at 30% 30%,#ffd1dc,#ff7eb3 35%,#7a3cff 75%);box-shadow:0 18px 40px rgba(0,0,0,.4)} h1{font-size:76px;margin:6px 0} .sub{opacity:.8}
    .tr{display:grid;grid-template-columns:40px 1fr 80px;padding:11px 44px;color:#ddd} .tr:nth-child(2){color:#1ed760}`,
    `<div class="top"><div class="art"></div><div><small>${t.kind}</small><h1>${t.h}</h1><div class="sub">${t.sub}</div></div></div>${t.tracks.map((x, i) => `<div class="tr"><span>${i + 1}</span><span>${x}</span><span>${['2:48', '3:12', '2:31', '3:05', '2:56', '3:20'][i]}</span></div>`).join('')}`],
  board: (t) => [`body{min-height:100vh;background:linear-gradient(135deg,#0079bf,#5067c5);color:#172b4d} h1{color:#fff;margin:0;padding:20px 28px;font-size:28px}
    .cols{display:flex;gap:14px;padding:0 28px;align-items:start} .col{width:280px;background:#ebecf0;border-radius:12px;padding:10px} .col b{display:block;padding:4px 6px 10px}
    .c{background:#fff;border-radius:8px;padding:10px 12px;margin-bottom:8px;box-shadow:0 1px 1px rgba(9,30,66,.25)} .c i{display:block;width:42px;height:8px;border-radius:4px;margin-bottom:8px}`,
    `<h1>🗂️ ${t.h}</h1><div class="cols">${t.cols.map((c, ci) => `<div class="col"><b>${c}</b>${t.cards.filter((_, k) => k % 4 === ci || (ci === 0 && k === 6)).map((x, k) => `<div class="c"><i style="background:${['#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0'][(ci + k) % 5]}"></i>${x}</div>`).join('')}</div>`).join('')}</div>`],
  wiki: (t, l) => [`body{color:#202122;background:#fff} .top{border-bottom:1px solid #a2a9b1;padding:16px 40px;font:600 20px Georgia,"Songti SC",serif} main{display:grid;grid-template-columns:1fr 320px;gap:30px;padding:20px 40px}
    h1{font:400 38px Georgia,"Songti SC",serif;border-bottom:1px solid #a2a9b1;margin:0 0 4px;padding-bottom:4px} .sub{color:#54595d;font-size:14px;margin-bottom:14px} p{line-height:1.65;font-size:16px}
    .box{border:1px solid #a2a9b1;background:#f8f9fa;padding:10px;font-size:14px} .box .ph{height:220px;background:repeating-linear-gradient(90deg,#d32f2f 0 26px,#ff7043 26px 34px);margin-bottom:8px}`,
    `<div class="top">📖 ${t.brand}</div><main><div><h1>${t.h}</h1><div class="sub">${t.sub}</div><p>${t.p}</p>${para(l.lorem, 3)}</div><div class="box"><div class="ph"></div><b>${t.h}</b>${para(l.lorem, 1)}</div></main>`],
  video: (t) => [`body{background:#0f0f0f;color:#f1f1f1} main{display:grid;grid-template-columns:1fr 380px;gap:24px;padding:24px 32px}
    .player{aspect-ratio:16/9;border-radius:14px;background:radial-gradient(circle at 50% 50%,rgba(0,0,0,0) 0 40px,transparent 41px),linear-gradient(135deg,#f9a825,#ef6c00 50%,#6d4c41);display:grid;place-items:center;font-size:70px}
    h1{font-size:24px;margin:14px 0 6px} .sub{color:#aaa} .up{display:grid;grid-template-columns:168px 1fr;gap:10px;margin-bottom:12px;font-size:14px} .up i{height:94px;border-radius:8px}`,
    `<main><div><div class="player">▶</div><h1>${t.h}</h1><div class="sub">${t.sub}</div></div><div><b>${t.up}</b><br><br>${['#43a047,#a5d6a7', '#1e88e5,#90caf9', '#e53935,#ef9a9a', '#8e24aa,#ce93d8', '#fb8c00,#ffcc80'].map((c, i) => `<div class="up"><i style="background:linear-gradient(135deg,${c})"></i><span>Video ${i + 1}<br><small style="color:#aaa">2.${i}M</small></span></div>`).join('')}</div></main>`],
  sheet: (t) => [`body{color:#202124} header{padding:14px 20px;font-size:20px;border-bottom:1px solid #e0e0e0} table{border-collapse:collapse;margin:0;width:100%;font-size:14px}
    td,th{border:1px solid #e2e3e3;padding:7px 12px;text-align:right} th{background:#0f9d58;color:#fff;font-weight:600} td:first-child,th:first-child{text-align:left} tr:nth-child(even) td{background:#f5fbf7} .rn{background:#f8f9fa!important;color:#80868b;text-align:center;width:36px}`,
    `<header>📗 <b>${t.h}</b></header><table><tr><th class="rn"></th>${t.cols.map((c) => `<th>${c}</th>`).join('')}</tr>${t.rows.map((r, i) => {
      const v = [0, 1, 2, 3].map((m) => 200 + ((i * 37 + m * 53) % 900));
      return `<tr><td class="rn">${i + 2}</td><td>${r}</td>${v.map((x) => `<td>${x.toLocaleString()}</td>`).join('')}<td><b>${v.reduce((a, b) => a + b, 0).toLocaleString()}</b></td></tr>`;
    }).join('')}${Array.from({ length: 10 }, (_, i) => `<tr><td class="rn">${i + 10}</td>${'<td></td>'.repeat(6)}</tr>`).join('')}</table>`],
};

function demoPage(name, lang = 'en') {
  const l = L[lang];
  const [css, body] = PAGES[name](l[name], l);
  return `<!doctype html><html lang="${lang === 'zh' ? 'zh-CN' : 'en'}"><head><meta charset="utf-8"><title>${l[name].title}</title>
<link rel="icon" href="${favicon(ICONS[name])}"><style>*{box-sizing:border-box}body{margin:0;font:16px/1.5 ${FONT}}${css}</style></head><body>${body}</body></html>`;
}

module.exports = { demoPage };
