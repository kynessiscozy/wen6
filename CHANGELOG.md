# 更新日志(Changelog)

本文件记录「问问大师」的所有重要变更。

格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。产品正式版本号以 `src/product-copy.js` 的 `PRODUCT.version` 为准；npm 包版本遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased] - 2026-11-11 · V6.1 引路人革新（本地未上线）

### 新增（引路人全面革新）

- **六位引路人定版**：月白（神秘人·全能推演，默认）、玉宸（事业推演）、夕瑶（姻缘推演）、焱绒（财富推演）、絮羽（卡罗大师·西方卡罗牌塔罗推演）、星罗（新增·西方占星师）。专长方向在 `src/ui/guide-perspective.js` 只读取已算出的结果，不改写排盘数据。
- **24 段人物视频接入漏斗四段**（入口 / 问卷 / 仪式 / 邀约）与交接预告；报告头图改用邀约视频，按视口、页面可见性与 `prefers-reduced-motion` 自动播放或暂停，poster 为定妆静帧，解码失败不黑屏（`src/ui/guide-video.js`）。
- **V6.1 回归套件** `tools/test-guide-v61.mjs`：校验六位引导方向、跨页配色逐值一致、2D 素材与 24 段视频齐备、旧 3D 立绘退场、版本与缓存版本；已纳入 `npm run test:unit`。

### 变更（形象与配色全面换新）

- **全站换用 2D 定妆**：六位主应用角色改用透明全身立绘（`*-v61.webp`）与同版头像（`*-v61-avatar.webp`），弃用旧 3D 电影渲染立绘、逐帧表情贴图与火焰王座 / 星扇等道具；报告、首页、推演过场、分享海报与对话头像同步换新。星罗场景改用自己的观星室，不再借絮羽大厅。
- **主题配色对齐定妆**：夕瑶调为更饱和的桃花粉 `#ff9ac6`；焱绒弃旧三文鱼红，改黑金掌柜 `#dfb36c` / `#0e0a07`；絮羽改梅子紫底 `#160d1a` ＋ 烛光金；玉宸强调色改翡翠金 `#d3dda6`。三处数据源（漏斗 CSS、预告页 PALETTES、主应用 trait.color）逐值一致。
- **入口选择器**逐条标注六位引导方向；交接遮罩静态默认回到月白。
- **版本口径**：产品版本与 npm 包版本维持 `wen6.0` / `6.0.0`（V6.1 是引路人革新规格，不是对外版本号）；Service Worker 缓存升 `wenda-cache-v75`，`npm run check:copy` 继续校验原版本口径。

## [wen6.0] - 2026-11-10

### 文档（README 重写与产品定位统一）

- **README 重写**：按「项目简介 / 核心特性 / 体验流程 / 快速开始 / 新手入门 / 技术架构 / 质量保障 / 隐私与外部服务 / 版本 / 贡献」重新组织，补齐沉浸式体验分层、分层阅读、设计原则，以及本地开发、构建、部署与测试验证说明；在线体验、仓库与 CI 链接更新为 `kynessiscozy/wen6`。
- **产品定位统一为「沉浸式命理推演应用」**：README、应用内「关于问问大师」、`public/manifest.webmanifest`、页面 description 与复制报告水印统一口径，明确「计算与叙事分离、引路人不参与排盘、AI 不改写命盘数据」。
- **版本标识统一为 wen6.0**：`src/product-copy.js` 的 `PRODUCT.version` 与 `package.json` 的 `productVersion` 同步改为 `wen6.0`；`npm run check:copy` 增加旧标识 `wenV6` 的反向校验；2026-11-06 的发布条目保留为当时记录并加注说明。
- **新手入门重写**：使用指南 5 个标签统一更新，新增「速读与专业数值」说明与术语条目；常见问题补充分层阅读建议；关于与免责声明补充沉浸式体验、引路人叙事及 AI 内容的边界说明。
- **修正过时表述**：移除文档中已下线的「新手版 / 大师版」切换描述，统一为当前的分层阅读：「新手解读」速读 + 分区标签 + 默认收起的「查看专业数值」。
- 验证：`npm run sync:copy` 三份产物一致，`npm run check:copy` / `npm run build` / `npm run test:unit` 通过。

### 变更（历史品牌标识统一为 WEN）

- **包名**：`package.json` 与 `package-lock.json` 的 npm 包名由 `wendi` 改为 `wen`（npm 包名不允许大写）；产品名、版本号与私有发布配置不变。
- **分享海报**：海报底部水印由 `WENWEN` 改为 `WEN`，与统一品牌标识一致。
- **AI 请求标识**：OpenAI 兼容请求的 `X-Title` 由 `Wenwen Dashi` / `Wenwen Dashi Tool` 改为 `WEN` / `WEN Tool`；内置模型与 OpenRouter 的服务端点不变。
- **文档**：README 增加项目代号 WEN；历史更新日志中的 `wendi 时期` 标题改为 `WEN 时期`。
- **兼容范围**：本次仅调整品牌层。角色 id `wenwen`、`src/character/wenwen.js`、`public/art/wenwen-*.webp`、CSS 选择器与 Service Worker 缓存路径保持不变，旧档案与离线缓存不受影响。
- 验证：`npm run check:copy` / `npm run build` / `npm run test:unit` 通过。

## [wenV6] - 2026-11-06（正式版）

> 本条目为 6.0 正式版的发布记录，当时对外标识为 wenV6；自 wen6.0 起统一写作 `wen6.0`，历史内容保留不改。

### 重构（清理 + 拆分成多个模块）

- **素材清理**：`public/art` 中 31 个无引用旧素材（`diyan-entry-live.mp4`、`*-blink.webp`、`*-avatar.webp` 等，共 7.1MB）移出仓库；浏览器实测首页与预告页零 404，角色立绘、头像、视频全部正常。素材总量 235 → 204 个，84.6MB → 77.5MB。
- **调试输出**：`main.js` 6 处 `console.log` 改为带模块前缀的 `console.warn`（`[profile]` / `[archive]`），保留 IndexedDB 失败诊断能力。
- **样式拆分**：`src/styles.css`（3342 行 / 232KB）按原有章节拆成 `src/styles/` 下 14 个文件（base、chat、连接状态、AI 设置、工具结果页、弹窗、横幅、体系模式、西方、工具卡片、长报告、新手引导、轮播），入口只保留 `@import` 顺序表。拆分前后样式内容逐行一致，构建产物 CSS 哈希不变（`index-vSg5eMxk.css` / 520.93KB）。
- **脚本拆分**：`main.js` 1937 → 1408 行。抽出 `src/app/glossary.js`（GLOSSARY 词表 + 右键/长按菜单 + 选区胶囊 + Dock 操作条）与 `src/app/profiles.js`（IndexedDB 档案库 + 存档读档 + 导入导出），排盘动作通过 `initProfiles(calc)` 注入，避免双向依赖。
- **测试适配**：新增 `tools/read-styles.mjs`，`test-tools-ring` 与 `test-theme-cascade` 改为按顺序拼读 `src/styles/`；新增 `tools/smoke-assets.mjs` 检查页面资源 404。
- 验证：`build` / `check:copy` / `test:unit` 全通过；`test-persist` 存档 → 刷新 → 读档全流程通过，`test-firstscreen` 通过；`test-theme-cascade` 的「选择之前不显示说明」断言在拆分前后同样失败，属既有环境问题，非本次改动引入。

### 变更（全局文案去除第三方平台品牌）

- 用户可见文案里不再出现「WorkBuddy 云服务」字样，默认 AI 提供方统一称为**内置模型**：AI 设置面板的下拉选项改为「内置模型（免密钥・默认）」，说明段改为「由应用内置的模型能力提供回复」，分节标题改为「内置模型状态」，可用状态徽标改为「内置」。
- 常见问题、隐私与数据说明、`index.html` / `funnel.html` 的内嵌条文、README 功能清单同步改口径（由 `src/product-copy.js` 统一生成，`npm run sync:copy` 落盘）。
- 运行时错误提示去掉品牌：`workbuddy-cloud.js` 的未授权 / 额度 / 请求 / 调用失败提示统一改为「内置模型…」；`ai-insight.js` 缺 Key 时的引导改为「切换为「内置模型」」。
- 内部标识保持不变（提供方 id `workbuddy`、模块名、SDK 依赖、接口地址），仅改对外文案，不影响鉴权与调用链路。
- 验证：`check:copy` 三份文件一致、`test:unit` 全通过；`dist` 全量检索无「WorkBuddy 云服务」残留，`index.html` / `funnel.html` 与主包内新文案已生效。

### 变更（预告页重构：整屏视频 + 下滑揭幕）

- **版式重做**：原来的「300px 视频缩略图 + 四张卡片纵向堆叠」改成沉浸式结构——引路人的邀请视频铺满整屏做底（宽屏时居中成一块银幕，两侧用同帧虚化铺底），首屏只留人物标识、一句开场白与下滑提示，向下滑才展开四柱、三句话与报告目录。
- **开场白改为云端流式**：新增 `src/ui/teaser-copy.js`，通过已接入的云服务流式生成开场白并逐字渲染，命中本地缓存（按人物 + 日主 + 关注点，最多 12 条）时不再发起调用；请求失败、被中止或离线时静默回退本地文案。只上传引路人称谓、日主天干与关注点标签，**不上传姓名 / 出生日期时辰 / 四柱 / 评分**；四柱、评分、大运流年等真实数据始终本地渲染，不交给模型改写。
- **信息层级细化**：四柱改为干支两行大字、日柱高亮；日主 / 格局 / 当前大运拆成标签+值三行；三句话改为带序号的条目；报告目录改为「分区 / 速读标题 / 评分」三列。
- **交互与可访问性**：新增顶部滚动进度线、内容块下滑浮现（`IntersectionObserver`）、常驻底部主按钮；`prefers-reduced-motion` 下不下载视频、只留海报静帧并取消全部动效；关闭 / 跳过 / Esc 立即暂停并释放视频、中止在途文案请求。
- 验证：390×844 首屏高度精确等于视口、无横向溢出、底部按钮与文案零重叠；桌面 1280×800 视频居中成银幕；浏览器实测外网请求被拦截（未触发任何模型调用）、纯本地回退正常；`build` / `check:copy` / `test:unit` 全通过。
- 新增 `tools/preview-teaser.html` + `tools/test-teaser-visual.mjs`：不经漏斗流程也能直接渲染预告页并做视觉/交互验收（默认拦截所有外网请求，不会产生计费调用）。

### 变更（首屏手机全屏适配加固）

- **动态视口高度**：`funnel.html` 的 `html,body` 与全屏层（`.bg` / `.screen` / `.fm-overlay` / `.fm-drawer`）改用 `100dvh`（旧浏览器回退 `height:100%` + `inset:0`），避免 iOS / Chrome 地址栏收放时底部被遮；`body` 加 `overscroll-behavior:none` 防止橡皮筋露白边。
- **安全区兜底**：4 处 `env(safe-area-inset-*)` 补 `, 0px` fallback，避免旧 WebView 整条 `padding` / `top` 声明失效。
- **PWA 全屏一致性**：`index.html` 补 `apple-mobile-web-app-capable=yes`，从主屏启动或页面跳转后不弹浏览器工具栏；不加 `black-translucent`，避免浅色主题下状态栏白字不可读。
- **安装提示避让**：`pwa-install.js` 在漏斗首屏（`html[data-funnel-persona]`）把「安装到桌面」胶囊移到右上角人物切换控件下方，不再压住「进入命盘厅」主按钮；其它页面位置不变。
- 验证：390×844 / 375×667 / 412×915 三种视口全屏层高度精确等于视口、无滚动溢出；CDP 模拟刘海（top 47 / bottom 34）下顶部按钮避让 47px、底部内容留 34px、安装按钮与主 CTA 零重叠；`build` / `check:copy` / `test:unit` 全通过。

### 变更（结果页 DOCK 栏显示功能文字）

- 放开 `ig-dock.css` 中 `.ig-nav-label` 的屏幕阅读器专用隐藏（1px + clip），改为图标下方常驻显示 10px 文字标签；`.tab-item` 由 grid 居中改为纵向 flex（图标 + 3px 间距 + 文字），选中项文字加粗提亮，窄屏（≤350px）降到 9px。
- 文案沿用 `main.js` 的 `setSystemMode()`：东方「命盘 / 运势 / 关系 / 工具」，西方「占星术 / 星座全览 / 生命灵术 / 工具」，切换体系时自动更新。
- 中央「问问大师」光球入口保持纯图标（`aria-label` 完整），不改变其强调视觉。
- 浏览器实测：4 个标签均可见（20–41px 宽 / 12px 高），东方 / 西方文案切换生效；构建与静态测试全通过。

### 变更（侧边菜单样式统一，以结果页为基准）

- **合并两套重复样式**：`enhance.css` 里首页 / 结果页近乎逐行重复的汉堡按钮、遮罩、抽屉、头部、关闭按钮规则合并为一套逗号选择器，统一 42px 圆形按钮、`min(300px,82vw)` 抽屉、`16px` 内容内边距、实色背景与标准描边。
- **移除首页专属外观覆盖**：`liquid-glass.css` / `character-theme.css` 中只作用于首页菜单的玻璃化与人物主题规则（透明抽屉、28px 圆形关闭按钮、无边框头部、大写分区标题、44px 主题色按钮）全部去掉，仅保留首页按钮在 `character-header` 内所需的布局定位；补上两页共用的 `focus-visible` 描边，清掉从未使用的 `.p2-menu-title` 死选择器。
- **内容结构按功能保留**：首页仍是分区列表（每日建议 / 最近推演 / 命盘档案），结果页仍是双列图标卡片；天气卡与底部三项页脚按钮两页共用。
- 浏览器实测：按钮 / 抽屉 / 遮罩 / 头部 / 关闭按钮的计算样式逐项一致，内容区 padding 一致；唯一保留差异是首页浮动按钮的 `z-index:1100`（定位所需）。

### 变更（代码清理：合并重复实现）

- **AI 提供方去重**：`deepseek.js` / `openrouter.js` 原有 59 段完全相同的 8 行代码块（超时控制、SSE 解析、连接状态机、模型自动降级、工具解读提示词）。抽出 `src/ai/openai-compatible.js` 公共内核，两家服务只保留端点、模型表、请求头、token 上限与长度规则配置；导出签名、常量与 `modelLabel` 行为逐项比对无差异，约减 175 行。
- **引路人素材单一数据源**：11 个结构相同、不含逻辑的人物 js 合并为 `src/character/characters.data.js`，由 `defineCharacter()` 深度冻结保证不可变性；`home-theme.js` 与两个角色测试的 import 同步收敛，11 个角色对象逐字等值校验通过。
- **删除零引用遗留文件**：根目录 11 个一次性诊断脚本、3 个 demo 演示页、5 个 check/probe 脚本（全量引用扫描确认 0 引用）。`tools/archive/` 因被 `CLAUDE-STYLE.md` 明确引用而保留；旧 `src/tools/` 兼容层是 tools2 异步加载完成前及加载失败时的降级入口，保留。
- 全量扫描结论：`src/` 下 128 个模块均有 import 入边、5 个依赖全部在用、版本相关字符串均为有意保留的历史记录与生成器反向断言，故未做无关删改。构建与 `check:copy` / `test:unit` 全部通过。

### 变更（正式版发布：版本号与文案全局统一）

- **产品正式版本号定为 wenV6**：移除 Beta 标记，`package.json` 包版本升为 `6.0.0` 并新增 `productVersion / productName / release`；README 徽章、分享长报告海报水印、审计与算法验证工具标题同步。源码仓库名 `wenV5` 与历史 release 链接属于历史沿用。
- **建立唯一文案源** `src/product-copy.js`：使用指南（5 标签）、关于问问大师、免责声明三份文案由它生成，`npm run sync:copy` 同步到 `index.html` / `public/funnel.html` / `README.md`，`npm run check:copy` 校验不漂移。
- **口径对齐**：角色统一称「引路人」；AI 默认走 WorkBuddy 云服务（免密钥），第三方服务商需自填 API Key；西方星盘统一表述为按出生地时区及历史夏令时换算（原免责声明中的 UTC+8 为过时描述）；主应用与漏斗页指南由 4 步 / 3 步统一为同一份 4 步内容。
- **README 重写**：补齐与弹窗同颗粒度的使用指南、关于问问大师、免责声明三章。
- wenV6 期间其他改动：免密钥云服务接入、PWA 安装完善、字号异常修复、漏斗首屏入口修复、预告页人物主题、离线缓存升至 v71。

### 变更（交互逻辑梳理：全免费漏斗并入后）

- **漏斗成为唯一入口**：`funnel.html` 也是 PWA `start_url`；原首页与特质轮盘保留 DOM 但由唯一的 `html[data-entry="funnel"]` 开关隐藏，不再有双入口、特质轮盘或报告「重新选择特质」。四位引路人到主应用角色的映射集中到 `src/ui/entry-personas.js`，修复「夕瑶」静默回退成地炎君、「月白」素材与主题不一致的问题。
- **单一状态机取代轮询与强制跳转**：删除 `index.html` 尾部三段各自 `setInterval` 抢屏的内联脚本，改由 `src/ui/entry-plan.js`（纯决策）+ `src/ui/entry-flow.js`（界面状态）在 `tj:app-ready` 后一次性判定「深链意图 / 档案载入 / 问卷交接 / 待机入口卡」。新增可操作的待机入口卡；关闭表单不再 60ms 后静默跳回 `funnel.html`，报告「重新推演」→ 表单 → 关闭后回到报告，报告菜单另有明确「返回入口页」。
- **交接不再盲点推进**：问卷答案一次性消费（`applied` 标记），自由填写的城市由 `applyEntryPayload()` 解析，识别不了回退默认并提示，避免遮罩后隐藏的校验错误；演算场景只在漏斗交接时、且展示真实四柱结果后才自动确认一次，其他所有路径仍必须显式点「查看报告」。遮罩在报告就绪 / 失败 / 20 秒兜底时揭开。
- **预告页可退出**：保留 `applied && !teasered` 触发方式（含载入档案与重算），新增关闭按钮、跳过、Esc、焦点约束、背景 inert 与关闭后焦点归还；显示期间后台全局快捷键被隔离。
- **漏斗页细节**：`?stats` 统计页不再因替换 body 后绑定空元素而抛错；中段过场期间锁定上/下一题；最后一题双击只提交一次；提交时动态读取当前引路人（问卷途中可切换），并清除上一次残留的档案载入意图。
- **离线 / PWA**：`wenda-cache-v48` 把 `funnel.html` 作为独立导航页缓存，导航按自身 URL 缓存而非一律写回 `BASE`，预缓存四位引路人立绘；`manifest.start_url` 改为 `./funnel.html`。
- **测试**：新增 `tools/test-entry-flow.mjs`（`npm run test:flow`，51 项纯函数 + 静态不变量）；重写 `tools/test-home-offline.mjs` 与 `tools/test-service-worker-upgrade.mjs` 以覆盖漏斗单一入口的离线与升级链路；`tools/test-entry.mjs` / `tools/trait-picker-helper.mjs` 兼容隐藏轮盘，`test:e2e` 全绿。旧版逐一转动特质轮盘的 `test:character` / `test:trait-picker` 等脚本保留为历史套件，不随漏斗单一入口执行。

## [5.1.0-beta.1] - 2026-10-13

### 新增

- **真实朔望历引擎** `lunar.js` + `lunar-table.js`(1900–2100,含闰月与农历年干支):
  - 数据表由 `tools/gen-lunar-table.mjs` 生成(数据源 lunar-javascript,MIT;程序化提取,禁止手抄)
  - `tools/verify-lunar-v1.mjs`:1901–2099 **逐日全量比对 72,691 项一致**,含春节/闰月公开事实锚点
- **紫微斗数交叉验证** `tools/verify-ziwei-v1.mjs`:与 iztro(MIT)逐盘比对,1902–2098 广域 + 闰月专测 + 2026 逐日,**10,378 盘 × 16 字段 = 166,048 项零失败**
- `CHANGELOG.md` 与 GitHub Issue 模板(Bug 报告 / 功能请求)
- devDependencies:lunar-javascript、iztro(仅作验证 oracle 与数据生成源,不入产物包)
- **全局数据深度审计工具** `tools/audit-deep-v1.mjs`(`npm run audit:deep`,85 项检查):节气表三重交叉(仓库内互源/lunar-javascript 时刻 oracle/寿星公式)、农历表不变量+冬至锚定、干支/藏干/纳音/十神正典重推导、四柱 vs oracle(日柱穷举 72,684 天+年月时柱抽样)、城市时区合理性、西方星历天文锚点(J2000/二分二至/月亮日速)、亮星星表定点、塔罗/MBTI/占星/KB 结构、静态资源引用完整性、代码卫生(乱码/顶层 DOM/存储键盘点/AST 重复键);审计报告 `docs/audit-deep-2026-10-13.md`
- **全局算法验证工具** `tools/verify-algo-v1.mjs`(`npm run verify:algo`,61 项检查):真太阳时/EOT 历书锚点、神煞+刑冲合害破标签 vs 独立重实现、五行强弱/十神性质、大运/起运 vs lunar-javascript oracle(204 盘)、梅花卦象 64 全组合 vs 《周易》正典卦序+两组全链 KAT+全字段 fuzz、奇门结构不变量、十天体黄经 vs astronomy-engine(1940–2060)+ASC 双公式/MC 几何、相位/宫位/元素独立重算、生命灵数 KAT(含大师数)、MBTI 成熟度、占星工具与引擎一致性(月座 365 天)、合盘/流日 vs oracle(400 天);验证报告 `docs/algo-verification-2026-10-13.md` + 修复前基线 `docs/algo-baseline-2026-10-13.md`

### 变更

- **紫微斗数升级为标准安星**(输出行为有意变更,经 iztro 全量验证):
  - 真实朔望历农历月/日取代「日柱甲子序 % 30」近似;农历正月初一年界(与八字立春年界并存)
  - 紫微定位改商数-借数法(奇借减偶借加,寅宫起数);天府寅申轴对称不变
  - 宫名改为自命宫按地支逆布(旧版按数组槽位,盘面宫名与地支错位);新增宫干、五行局名、命宫干支字段
  - 新增禄存、天马;擎羊/陀罗改禄位法;火星/铃星改年支分组双起点;天魁天钺庚干顺序修正
  - 生年四化扩展至文昌/文曲/左辅/右弼;己干四化对齐 iztro 学派(文曲忌)
  - 闰月按「上半月归前月、下半月归后月」修正;农历表范围外自动降级旧近似并标记 `approximate`
- README:紫微移出「简化排盘」标注(附验证数字与未含项),奇门保留简化标注;新增农历引擎行与 verify:lunar / verify:ziwei / gen:lunar 命令
- **引擎可读化重构第二弹**(方法同 bazi.js:展开 → 新旧实现模糊等价对比 → 验证套件全绿):
  - `calendar.js` — 节气三级回退链、真太阳时/均时差、晚子时进日、日柱戊午锚点全注释;27,289 项模糊对比零差异(1895–2105 节气穷举、5 时区含夏令时)
  - `ziwei.js` / `qimen.js` — 具名常量表 + 口诀出处注释(后随标准安星升级);12,824 项模糊对比零差异
  - `solar-terms.js` — 55KB 单行数据表重排为一年一行(228 行),新增数据格式/约定/维护文档;2,424 个时刻字符串逐字节一致
  - `sizhi.js` — 四时旺衰表驱动化;12 月支 × 10 日干全组合 120 项零差异

### 修复(2026-10-13 深度审计发现)

- **节气 base64 回退表时区错位**(`calendar.js` JQ_STR):旧表按 UTC 日期生成,凡时刻在中国标准时间 0–8 点的节气,日精度回退值整体偏早一天(1,224 项中 640 项错位)。已由 `solar-terms.js` 时刻表的 CST 日期程序化重生成(覆盖范围与字节数不变);因精确时刻表优先级更高,线上行为此前未受影响,属回退链隐患
- **纳音正名**(`shared.js` NY):甲午/乙未「砂石金」→「沙中金」(《三命通会》正典,与 lunar-javascript oracle 一致;仓库内 `long-report.js` 自带字典本就用正典名,两表自此统一,审计新增 C5f 双表一致性回归)
- **西方星相十二宫格星图空白**(`zodiac-art.js` + `western-view.js`):星表键为缩写(`ari`)而调用方传 `SIGNS` 全名 id(`aries`),查表失败致 12 张星图 SVG 全部为空串——新增 SIGN_ALIAS 双约定兼容 + 审计 G4 回归;星图渐变背景由 SVG 非法 `fill`(CSS gradient 字符串)移至外层容器 style;`opts.star/line` 颜色别名生效
- **Node 环境导入崩溃**(`western3d.js`):模块顶层 `window._w3d` / `window._w3dReset` 未守护,任何经 import 链触及该文件的 Node 工具(如塔罗数据测试)直接 ReferenceError——已加 `typeof window` 守护
- 同步更新 `verify-bazi-v2/v3` 纳音期望值(v3 为 unicode 转义存储)

### 修复(2026-10-13 全局算法验证发现)

- **梅花易数卦名系统性错误**:`_hexName` 查表索引上下卦次序颠倒(HEX_NAME 表按下卦主序排列,旧代码按上卦主序查询),除八个纯卦外全部 56 卦返回镜像卦名(如「天地否」查成「地天泰」)。已按《周易》通行本卦序正典 64/64 全组合验证修复
- **西方星历行星黄经大偏差**:`calcPlanetLongitude` 把平黄经直接当平近点角使用(缺 J2000 近日点黄经 ϖ),且中心差仅一阶截断。实测(vs astronomy-engine,1940–2060 48 样本):冥王星平均偏差 36.4°、星座一致率仅 8.3%,水星 6.3°/89.6%,天王星 7.1°/72.9%,土星 5.6°/79.2%,火星 5.1°/83.3%。已增补 ϖ 并将中心差升级为三阶截断,修复后十天体星座一致率 95.8–100%(冥王星残余 1–2° 为共面近似固有,已文档化)
- **月运工具月亮星座与星盘矛盾**:`getMoonSign` 为 2000-01-01 基准的匀速线性估算(偏差 ±6°),2026 全年 345/365 天与本命盘引擎月座不一致。已委托 `calcMoonLongitude` 同源计算,365/365 一致
- **加固** `tools/verify-western-v1.mjs` 月亮周期测试:旧断言「27 天后回到同星座」依赖具体日期巧合(27 天=355.8° 非整周期),改为全年换座间隔统计断言(≈160 次/年、平均 2.28 天、最大 ≤4 天)+ 引擎同源一致性断言

## [5.0.0-beta.1] - 2026-08-30

首个公开版本,MIT 开源。

### 新增

- **西方星象体系**:天体力学星历计算、本命星盘(十大星曜落座落宫)、十二宫位、几何相位、毕达哥拉斯生命灵数九宫
- **Three.js 3D 星象剧场**:命盘·金色罗盘 / 运势·黄道天球 / 关系·灵数粒子云(懒加载独立 chunk,`prefers-reduced-motion` 自动降级)
- 十二星座**真实星图**配图(`zodiac-art.js`,含主要恒星赤经/赤纬/星等与连线)
- 全景长报告重做:十神/藏干/纳音表/五行占比/三维评分/五维画像真实数据映射,夜空报头与星座星图带
- 新手指引 / 关于 / 免责声明 / README 全面重写
- 开源基础设施:MIT LICENSE、CONTRIBUTING.md、README 徽章(CI/License/版本)与在线演示链接

### 变更

- `bazi.js` 压缩风格展开为可读源码(引擎可读化重构第一弹;45,049 项新旧实现模糊对比零差异)

### 质量

- 验证矩阵全绿:八字 123 + 118 项交叉验证、西方星历 59 项、全局数据审计 15 项、流日/合盘/塔罗/MBTI/长报告/工具轮播单测
- CI(GitHub Actions)「构建 + 单测」门禁,合并 `main` 自动部署 GitHub Pages

## [4.3.x] - 2026-08(内部迭代)

- **4.3.1** — 三分区统一标签排版、今日建议卡重设计、Dock 纯光球入口、暗色可读性与背景光球优化
- **4.3.0** — 工具环形导航(`tools-ring`)、西方星盘 3D 浑仪(`armillary-western`)、长报告分享卡、新手引导流程、西方占星引擎升级、星座运势工具增强、能量穿搭工具;Claude 风格 CSS 体系(claude-refine / claude-ui / enhance)

## [V2.x–V4.x] - WEN 时期(内部版本)

- 东方命理核心:四柱八字、节气历法(真太阳时)、紫微、奇门、梅花、双人合盘、流日流周
- AI 智能问答(DeepSeek / OpenRouter 双提供方、结构化命盘上下文、意图识别与工具路由)
- 自进化系统(`evolve`:基因组、经历记忆、个人知识蒸馏,本地反馈调参)
- 工具中心 V1/V2(塔罗、MBTI、择日、合盘、起名、摇签、答案之书等 13 款)
- Claude 风格 UI(纸质/暗夜双主题、WCAG AA)、PWA(manifest + Service Worker)

[5.1.0-beta.1]: https://github.com/kynessiscozy/wenV5/compare/v5.0.0-beta.1...v5.1.0-beta.1
[5.0.0-beta.1]: https://github.com/kynessiscozy/wenV5/releases/tag/v5.0.0-beta.1

> 历史版本条目、compare / release 链接与 `docs/` 下的 wenV5 时期验证报告均为当时的记录，保留不改；当前产品正式版本号为 wen6.0（原发布标识 wenV6）。
