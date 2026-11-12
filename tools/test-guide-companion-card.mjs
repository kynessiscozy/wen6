/* 同行卡 + 引路人卡合并重排回归：纯 Node，无需浏览器。
   校验两张旧卡的内容真的进了同一张 #characterResultHero、
   布局被重做、数据 / 路线 / 计算边界不丢，且上一轮按钮元素化改动仍在。 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GUIDE_ELEMENTS, GUIDE_KEYS } from '../src/ui/entry-personas.js';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
let pass = 0;
const ok = (condition, message) => { assert.ok(condition, message); pass++; console.log('  ✓ ' + message); };

console.log('═══════════════════════════════════════════════');
console.log('  同行 / 引路人合并主卡回归');
console.log('═══════════════════════════════════════════════\n');

const reportUiJs = await read('src/ui/character-report.js');
const reportCss = await read('src/character-report.css');
const copyJs = await read('src/product-copy.js');
const readme = await read('README.md');
const funnelHtml = await read('public/funnel.html');
const contentFlow = await read('docs/content-flow.md');
const guidesDoc = await read('docs/v6.1-guides.md');
const changelog = await read('CHANGELOG.md');
const preview = await read('tools/preview-guide-companion-card.html');
const personaJs = await read('src/ui/entry-personas.js');
const pkg = JSON.parse(await read('package.json'));

/* ---- 1. 一张卡，而不是两张 ---- */
ok(reportUiJs.includes("element('section', 'result-character-hero is-guide-companion-merged')"),
  '主卡带 is-guide-companion-merged 标记');
ok(reportUiJs.includes("hero.dataset.guideMerged = 'true'") &&
   reportUiJs.includes('hero.dataset.guideRoute = perspective.dataset.guideRoute'),
  '合并卡记录引路人路线键，便于回归 / 读屏定位');
ok(reportUiJs.includes("element('div', 'guide-companion-visual')") &&
   reportUiJs.includes("element('div', 'guide-companion-shell')") &&
   reportUiJs.includes("element('div', 'guide-companion-body')") &&
   reportUiJs.includes("perspective.classList.add('guide-companion-route')"),
  '画面层 / 内容层 / 路线面板都在同一张卡里重建');
ok(reportUiJs.includes('body.append(perspective)') && reportUiJs.includes('hero.append(shell)') &&
   !reportUiJs.includes('hero.after(perspective)') && !reportUiJs.includes(':scope > .guide-perspective'),
  '引路人卡不再作为兄弟卡插在 hero 后面');
ok(reportUiJs.includes("ming.querySelectorAll('.guide-perspective').forEach(node => node.remove())"),
  '旧的独立 / 嵌套指引卡都会被清理，不产生重复');
ok(reportUiJs.includes('makeHero(id, theme, ctx, western, isDemo, overview, astro, perspective)'),
  'makeHero 直接接收路线卡，构建顺序先路线后主卡');

/* ---- 2. 原数据节点与四步动作没丢 ---- */
for (const needle of [
  'result-character-reading sys-western', 'result-character-overview sys-eastern',
  'result-overview-heading', 'result-character-figure', 'result-western-theatre',
  'result-portrait-toggle', 'characterResultHint', 'result-character-hint-button',
]) {
  ok(reportUiJs.includes(needle), `合并后仍保留 ${needle}`);
}
ok(reportUiJs.includes("addPortraitToggle(hero, figure, 'ming', visual)"),
  '立绘开关挂进独立画面层，隐藏态仍由主卡承载');
ok(reportUiJs.includes("mark.setAttribute('aria-hidden', 'true')"),
  '角色主题徽记仅作装饰，不在读屏名称中重复人物名字');
ok(reportUiJs.includes('guideRouteFor(id)') && reportUiJs.includes('runGuideAction(step.action)') &&
   reportUiJs.includes("element('button', 'guide-route-btn')") && reportUiJs.includes('不改变排盘或评分'),
  '四步路线仍是同一份 GUIDE_ROUTES，边界说明不变');
ok(reportUiJs.includes('originals.forEach') && reportUiJs.includes('parent.insertBefore'),
  '构建失败时真实速读与 3D 容器仍会还原');
ok(!/ctx\s*\.\s*\w+\s*=/.test(reportUiJs.replace(/ctx\?\.[\w?.]+/g, 'X')),
  '合并层不写回排盘 ctx（仅读取已算结果）');

/* ---- 3. 布局确实重做 ---- */
ok(reportCss.includes('.guide-companion-body {') &&
   reportCss.includes('grid-template-columns: minmax(0, 1fr)') &&
   reportCss.includes('grid-template-columns: minmax(0, .82fr) minmax(0, 1.18fr)'),
  '窄屏按速读、路线分层；宽屏将两块内容并列，避免纵向堆成长卡');
ok(reportCss.includes('.guide-companion-visual {') && reportCss.includes('width: 36%') &&
   reportCss.includes('width: 64%'), '宽屏收窄人物画面，将更多空间留给报告内容');
ok(reportCss.includes('.result-character-overview .qr-head') &&
   reportCss.includes('.result-character-overview .qr-grid') &&
   reportCss.includes('width: 100%') && reportCss.includes('max-width: none'),
  '速读区占满数据面板，不再沿用满幅画面时的 57% 宽度');
ok(reportCss.includes('@media (max-width: 900px)') &&
   reportCss.includes('height: clamp(176px, 47vw, 204px)') &&
   reportCss.includes('grid-template-columns: minmax(0, 1fr)'),
  '窄屏人物场景缩短并移至内容上方，速读与路线纵向分区');
ok(reportCss.includes('grid-template-columns: repeat(2, minmax(0, 1fr))') &&
   reportCss.includes('@media (max-width: 380px)') &&
   reportCss.includes('guide-route-copy small { display: block;'),
  '四步路线保持 2×2，窄屏也保留步骤说明');
ok(reportCss.includes('.guide-perspective-title {') &&
   reportCss.includes('color: #fffaf4 !important') &&
   reportCss.includes('.guide-route-title {') &&
   reportCss.includes('color: var(--result-character-accent) !important'),
  '路线标题覆盖全局标题色，深色底上保持可读');
ok(reportCss.includes('.guide-companion-data {') &&
   reportCss.includes('border: 1px solid rgba(255, 249, 241, .13)') &&
   reportCss.includes('.guide-perspective {'),
  '速读与引路人路线使用独立面板和统一留白');
ok(reportCss.includes('is-guide-companion-merged::before') &&
   reportCss.includes('border-radius: 24px') && reportCss.includes('box-shadow'),
  '主题色左轨 / 圆角 / 阴影强化主卡边界');
ok(reportCss.includes('margin-bottom: calc(var(--ig-dock-height, 66px) + 20px + env(safe-area-inset-bottom, 0px))') &&
   reportCss.includes('padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px))'),
  '报告滚动区域在固定 Dock 上方结束，避免正文被遮挡');
ok(reportCss.includes('@media (forced-colors: active)') &&
   reportCss.includes('background: Canvas !important'), '强制颜色回退到位');
ok(reportCss.includes('.result-portrait-toggle') && reportCss.includes('top: 12px'),
  '立绘开关移到画面层右上角，不再压住路线按钮');

/* ---- 4. 文案 / 文档 / 对照页 ---- */
ok(copyJs.includes('合并后的「同行 / 引路人指引」卡') &&
   funnelHtml.includes('合并后的「同行 / 引路人指引」卡') &&
   readme.includes('合并后的「同行 / 引路人指引」主卡'),
  '唯一文案源、漏斗页与 README 体验流程口径一致');
ok(contentFlow.includes('报告「同行 / 引路人主卡」') &&
   guidesDoc.includes('同行 / 引路人卡合并重排') &&
   changelog.includes('推翻重做报告首屏布局'),
  '流程表 / 规格 / 更新日志都记录了这次推翻重做');
ok(preview.includes('guide-companion-visual') && preview.includes('guide-companion-shell') &&
   preview.includes('guide-companion-route') && preview.includes('改动前'),
  '静态对照页覆盖新布局与旧两卡基准');

/* ---- 5. 上一轮 CTA 元素化改动保留 ---- */
ok(Object.keys(GUIDE_ELEMENTS).length === GUIDE_KEYS.length &&
   personaJs.includes('export const GUIDE_ELEMENTS'),
  '六位引路人的元素映射仍在单一数据源');
ok((funnelHtml.match(/--cta-foil-hue:[^;]+;/g) || []).length === 6 &&
   funnelHtml.includes('var CTA_ELEMENTS=') &&
   !funnelHtml.includes('--cta-clip:polygon'),
  '首页按钮六位元素意象与跨页小表仍在，异形轮廓已换成精致贴图');
ok(pkg.scripts['test:guide-companion'] === 'node tools/test-guide-companion-card.mjs' &&
   pkg.scripts['test:unit'].includes('node tools/test-guide-companion-card.mjs'),
  '合并卡回归有独立脚本且纳入 test:unit');

console.log(`\n✓ 同行 / 引路人合并主卡回归通过（${pass} 项显式断言）\n`);
