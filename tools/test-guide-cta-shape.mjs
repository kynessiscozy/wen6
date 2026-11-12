/* 首屏「进入命盘厅」按钮形状回归：纯 Node，无需浏览器。
   校验六位引路人各有自己的元素 / 轮廓 / 纹章、跨页小表不漂移、
   形状真的接到 CSS 上，且按钮仍保留角色主题渐变。 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  GUIDE_V61, GUIDE_KEYS, GUIDE_ELEMENTS, DEFAULT_PERSONA,
} from '../src/ui/entry-personas.js';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
let pass = 0;
const ok = (condition, message) => { assert.ok(condition, message); pass++; console.log('  ✓ ' + message); };

console.log('═══════════════════════════════════════════════');
console.log('  首屏按钮形状 / 引路人元素回归');
console.log('═══════════════════════════════════════════════\n');

/* ---- 1. 单一数据源 ---- */
assert.deepEqual(Object.keys(GUIDE_ELEMENTS).sort(), [...GUIDE_KEYS].sort());
for (const key of GUIDE_KEYS) {
  const e = GUIDE_ELEMENTS[key];
  assert.ok(e && e.element && e.shape && e.motif, `${key} 的元素 / 形状 / 依据齐备`);
  assert.ok(GUIDE_V61[key], `${key} 仍是有效引路人`);
}
ok(new Set(GUIDE_KEYS.map(k => GUIDE_ELEMENTS[k].element)).size === 6, '六位元素意象互不相同');
ok(new Set(GUIDE_KEYS.map(k => GUIDE_ELEMENTS[k].shape)).size === 6, '六位按钮形状互不相同');
ok(new Set(GUIDE_KEYS.map(k => GUIDE_ELEMENTS[k].motif)).size === 6, '六位定妆依据互不相同');

const funnelHtml = await read('public/funnel.html');

/* ---- 2. funnel.html 小表与单一数据源逐值一致 ---- */
const tableMatch = /var CTA_ELEMENTS=(\{[\s\S]*?\n\});/.exec(funnelHtml);
assert.ok(tableMatch, 'funnel.html 存在 CTA_ELEMENTS 小表');
assert.deepEqual(JSON.parse(tableMatch[1]), JSON.parse(JSON.stringify(GUIDE_ELEMENTS)),
  'funnel.html 元素小表与 entry-personas.js 逐值一致');
ok(true, '独立页元素小表与 ES module 单一数据源不漂移');

/* ---- 3. 六个主题块各注入一条不同轮廓 ---- */
const blocks = {};
for (const key of GUIDE_KEYS) {
  const re = new RegExp('html\\[data-funnel-persona="' + key + '"\\]\\{([\\s\\S]*?)\\n  \\}');
  const m = re.exec(funnelHtml);
  assert.ok(m, `${key} 主题块存在`);
  const clip = /--cta-clip:(polygon\([^;]+\));/.exec(m[1]);
  assert.ok(clip, `${key} 定义了 --cta-clip`);
  blocks[key] = clip[1];
}
ok(new Set(Object.values(blocks)).size === 6, '六条 --cta-clip 轮廓两两不同');
ok(Object.values(blocks).every(v => /^polygon\([\d.% ,]+\)$/.test(v) && !/px|em|rem|calc/.test(v)),
  '轮廓全部用百分比坐标，随按钮宽度缩放');
ok(/:root, html\[data-funnel-persona="moonfox"\]\{/.test(funnelHtml),
  '未设置人物时 :root 默认回落到月白轮廓');
assert.equal(blocks[DEFAULT_PERSONA], blocks.moonfox);

/* ---- 4. 轮廓真的接到按钮与金边上 ---- */
ok(funnelHtml.includes('clip-path:var(--cta-clip)'), '按钮 / 金边使用 --cta-clip');
ok(/#s-entry \.cta-edge\{[^}]*clip-path:var\(--cta-clip\)/.test(funnelHtml), '金边与按钮共用同一形状');
ok(/#s-entry \.cta\{[\s\S]*?background:linear-gradient\(180deg,var\(--button-top\),var\(--button-bottom\)\)/.test(funnelHtml),
  '按钮本体仍是角色主题渐变（配色回归依赖 computedStyle）');
ok(funnelHtml.includes('@keyframes ctaPulse') && funnelHtml.includes('drop-shadow'),
  '发光改用 drop-shadow，跟着裁切后的轮廓走');
ok(/#s-entry\.active \.cta-wrap\{animation:riseIn[\s\S]*?ctaPulse/.test(funnelHtml),
  '入场 riseIn 与呼吸 ctaPulse 并行，互不覆盖');
ok(funnelHtml.includes('.cta-wrap:has(.cta:focus-visible)'), '焦点环放在未裁切的外层');

/* ---- 5. 纹章与换人接线 ---- */
const emblems = [...funnelHtml.matchAll(/data-emblem="(\w+)"/g)].map(m => m[1]);
ok(new Set(emblems).size === 6 && [...GUIDE_KEYS].every(k => emblems.includes(k)),
  '六位各有自己的元素纹章');
ok(funnelHtml.includes('.cta-emblem [data-emblem]{display:none}') &&
   [...GUIDE_KEYS].every(k => funnelHtml.includes(`html[data-funnel-persona="${k}"] .cta-emblem [data-emblem="${k}"]`)) &&
   /\{display:inline\}/.test(funnelHtml),
  '纹章默认隐藏，按当前引路人显示一个');
ok(funnelHtml.includes("startBtn.dataset.guideElement=ce.element") &&
   funnelHtml.includes('var ce=CTA_ELEMENTS[key]'),
  '换人时同步写入元素说明');
ok(funnelHtml.includes('id="btnStart"') && funnelHtml.includes('进入命盘厅') &&
   funnelHtml.includes('class="cta-wrap rise"'), '主按钮文案与入口动画保持不变');

/* ---- 6. 预览夹具与页面同源 ---- */
const gallery = await read('tools/preview-cta-shapes.html');
ok(Object.values(blocks).every(v => gallery.includes(v)), '形状对照页逐条复用页面里的六条轮廓');
ok([...GUIDE_KEYS].every(k => gallery.includes(`data-emblem="${k}"`)), '对照页覆盖六位元素纹章');

console.log(`\n✓ 首屏按钮形状回归通过（${pass} 项显式断言）\n`);
