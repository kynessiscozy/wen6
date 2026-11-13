/* 首屏「进入命盘厅」按钮贴图回归：纯 Node，无需浏览器。
   校验六套异形轮廓已推翻、改用同一张精致箔纹贴图 + 元素徽记、
   六位色相 / 跨页小表 / 素材 / 离线缓存一致，并把呼吸发光压到极淡。 */
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import {
  GUIDE_V61, GUIDE_KEYS, GUIDE_ELEMENTS, DEFAULT_PERSONA,
  APP_CACHE_VERSION, GUIDE_VIDEO_VERSION, GUIDE_VIDEO_QUERY,
} from '../src/ui/entry-personas.js';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const exists = async path => {
  try { return (await stat(new URL(path, root))).isFile(); }
  catch { return false; }
};
let pass = 0;
const ok = (condition, message) => { assert.ok(condition, message); pass++; console.log('  ✓ ' + message); };

console.log('═══════════════════════════════════════════════');
console.log('  首屏按钮贴图 / 引路人元素回归');
console.log('═══════════════════════════════════════════════\n');

/* ---- 1. 单一数据源 ---- */
assert.deepEqual(Object.keys(GUIDE_ELEMENTS).sort(), [...GUIDE_KEYS].sort());
for (const key of GUIDE_KEYS) {
  const e = GUIDE_ELEMENTS[key];
  assert.ok(e && e.element && e.shape && e.motif && e.texture && e.foilHue, `${key} 元素字段齐备`);
  assert.ok(GUIDE_V61[key], `${key} 仍是有效引路人`);
}
ok(new Set(GUIDE_KEYS.map(k => GUIDE_ELEMENTS[k].element)).size === 6, '六位元素意象互不相同');
ok(new Set(GUIDE_KEYS.map(k => GUIDE_ELEMENTS[k].shape)).size === 6, '六位贴图徽记名互不相同');
ok(new Set(GUIDE_KEYS.map(k => GUIDE_ELEMENTS[k].foilHue)).size === 6, '六位箔纹色相互不相同');
ok(new Set(GUIDE_KEYS.map(k => GUIDE_ELEMENTS[k].texture)).size === 1 &&
   GUIDE_ELEMENTS[DEFAULT_PERSONA].texture === 'art/cta-foil.webp',
  '六位共用同一张精致箔纹贴图');

const funnelHtml = await read('public/funnel.html');
const sw = await read('public/sw.js');
const preview = await read('tools/preview-cta-shapes.html');

/* ---- 2. funnel.html 小表与单一数据源逐值一致 ---- */
const tableMatch = /var CTA_ELEMENTS=(\{[\s\S]*?\n\});/.exec(funnelHtml);
assert.ok(tableMatch, 'funnel.html 存在 CTA_ELEMENTS 小表');
assert.deepEqual(JSON.parse(tableMatch[1]), JSON.parse(JSON.stringify(GUIDE_ELEMENTS)),
  'funnel.html 元素小表与 entry-personas.js 逐值一致');
ok(true, '独立页元素小表与 ES module 单一数据源不漂移');

/* ---- 3. 旧异形轮廓已推翻 ---- */
ok(!funnelHtml.includes('--cta-clip:polygon') && !/clip-path:\s*var\(--cta-clip\)/.test(funnelHtml),
  '六套 polygon 异形轮廓已移除，不再靠 clip-path 抢形');
const hueDecls = [...funnelHtml.matchAll(/--cta-foil-hue:([^;]+);/g)].map(m => m[1].trim());
ok(hueDecls.length === 6 && new Set(hueDecls).size === 6, '六个主题块各注入一条不同箔纹色相');
ok(GUIDE_KEYS.every(k => hueDecls.includes(GUIDE_ELEMENTS[k].foilHue)), '页面色相与 GUIDE_ELEMENTS 逐值一致');
ok(/:root, html\[data-funnel-persona="moonfox"\]\{/.test(funnelHtml),
  '未设置人物时 :root 默认回落到月白箔纹色相');

/* ---- 4. 贴图真的接到按钮上 ---- */
ok(await exists('public/art/cta-foil.webp'), 'public/art/cta-foil.webp 精致贴图素材存在');
ok(funnelHtml.includes("background:url('./art/cta-foil.webp') center/100% 100% no-repeat") &&
   funnelHtml.includes('mix-blend-mode:screen') &&
   funnelHtml.includes('filter:hue-rotate(var(--cta-foil-hue,0deg))'),
  '按钮 ::before 以 screen 混合叠箔纹，并按主题色相旋色');
ok(/#s-entry \.cta\{[\s\S]*?background:linear-gradient\(180deg,var\(--button-top\),var\(--button-bottom\)\)/.test(funnelHtml),
  '按钮本体仍是角色主题渐变（配色回归依赖 computedStyle）');
ok(funnelHtml.includes('border-radius:18px') && funnelHtml.includes('.cta-edge{'),
  '统一圆角矩形 + 一圈极细金边，取代粗金边与双层内描边');
ok(funnelHtml.includes('#s-entry .cta-seal{') && funnelHtml.includes('<span class="cta-seal"') &&
   funnelHtml.includes('<span class="cta-arrow"'),
  '元素徽记收进小圆章，右侧补一枚轻箭头');
ok(!/ctaPulse|infinite\s+alternate/.test(funnelHtml) &&
   funnelHtml.includes('静止后不再呼吸 / 闪烁'),
  '连续呼吸 / 闪烁动画已移除');
ok(/#s-entry \.cta:hover\{[\s\S]*?rgba\(var\(--accent-rgb\),\.10\)/.test(funnelHtml) &&
   /#s-entry \.cta:active\{transform:scale\(\.99\)\}/.test(funnelHtml),
  '只保留极轻的 hover / active 反馈');
ok(funnelHtml.includes('.cta:focus-visible{outline:2px solid var(--gold-soft);outline-offset:3px}'),
  '焦点环回到按钮本身，不再依赖 :has 外层');

/* ---- 5. 纹章与换人接线 ---- */
const emblems = [...funnelHtml.matchAll(/data-emblem="(\w+)"/g)].map(m => m[1]);
ok(new Set(emblems).size === 6 && [...GUIDE_KEYS].every(k => emblems.includes(k)),
  '六位各有自己的元素纹章');
ok(funnelHtml.includes('.cta-emblem [data-emblem]{display:none}') &&
   [...GUIDE_KEYS].every(k => funnelHtml.includes(`html[data-funnel-persona="${k}"] #s-entry .cta-emblem [data-emblem="${k}"]`)) &&
   /\{display:inline\}/.test(funnelHtml),
  '纹章默认隐藏，按当前引路人显示一个（显示规则优先级高于隐藏规则）');
ok(funnelHtml.includes('startBtn.dataset.guideElement=ce.element') &&
   funnelHtml.includes('var ce=CTA_ELEMENTS[key]') &&
   funnelHtml.includes("ce.shape)"),
  '换人时同步写入元素说明与贴图名');
ok(funnelHtml.includes('id="btnStart"') && funnelHtml.includes('进入命盘厅') &&
   funnelHtml.includes('class="cta-wrap rise"'), '主按钮文案与入口动画保持不变');

/* ---- 6. 离线缓存 / 对照页 ---- */
ok(sw.includes(`const CACHE = 'wenda-cache-${APP_CACHE_VERSION}';`) &&
   sw.includes("'art/cta-foil.webp'"),
  '新贴图纳入 SW 预缓存，缓存版本随素材升位');
ok(APP_CACHE_VERSION === 'v86' && GUIDE_VIDEO_VERSION === 'v76' && GUIDE_VIDEO_QUERY === '?v=76',
  '应用缓存升 v86，视频素材版本保持 v76');
ok(preview.includes('cta-foil.webp') && preview.includes('cta-seal') &&
   preview.includes('cta-arrow') && preview.includes('改动前'),
  '静态对照页展示新贴图按钮与旧异形基准');
ok(GUIDE_KEYS.every(k => preview.includes(GUIDE_ELEMENTS[k].foilHue)), '对照页覆盖六位箔纹色相');

console.log(`\n✓ 首屏按钮贴图回归通过（${pass} 项显式断言）\n`);
