/* 引路人阅读路线回归：纯 Node，无需浏览器。
   校验「六位真的有不同作用 / 动作落在真实卡片与工具 / 跨页 chips 不漂移 /
   钩子只读真数据 / 执行器只用既有全局入口」。 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  GUIDE_ROUTES, GUIDE_ROUTE_KEYS, guideRouteFor,
  buildGuideHooks, runGuideAction,
} from '../src/ui/guide-route.js';
import {
  GUIDE_V61, GUIDE_KEYS, DEFAULT_PERSONA, themeForPersona,
  GUIDE_VIDEO_VERSION, GUIDE_VIDEO_QUERY, APP_CACHE_VERSION,
} from '../src/ui/entry-personas.js';
import { TOOL_DEFINITIONS } from '../src/render/tools-catalog.js';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
let pass = 0;
const ok = (condition, message) => { assert.ok(condition, message); pass++; console.log('  ✓ ' + message); };

console.log('═══════════════════════════════════════════════');
console.log('  引路人阅读路线回归');
console.log('═══════════════════════════════════════════════\n');

/* ---- 1. 六位功能契约 ---- */
assert.equal(GUIDE_ROUTE_KEYS.length, 6);
assert.deepEqual([...GUIDE_ROUTE_KEYS].sort(), [...GUIDE_KEYS].sort());
assert.equal(guideRouteFor('unknown').key, DEFAULT_PERSONA, '未知键回退月白');
assert.equal(guideRouteFor('leizi').key, DEFAULT_PERSONA, '旧角色不在路线表内');
assert.equal(guideRouteFor('xingling').key, 'xiyao', '报告主题键解析到夕瑶');
assert.equal(guideRouteFor('xiyao').key, 'xiyao', '漏斗人物键直接命中');

const validSections = new Set(['s-ming', 's-yun', 's-rel', 's-adv']);
const toolIds = new Set(TOOL_DEFINITIONS.map(tool => tool.id));
const toolNames = Object.fromEntries(TOOL_DEFINITIONS.map(tool => [tool.id, tool.name]));
const reportJs = await read('src/render/report.js');
const westernJs = await read('src/render/western-view.js');
const cardKeys = new Set();
for (const source of [reportJs, westernJs]) {
  for (const match of source.matchAll(/data-card="([^"]+)"/g)) cardKeys.add(match[1]);
  for (const match of source.matchAll(/dataset\.card='([^']+)'/g)) cardKeys.add(match[1]);
}
for (const key of ['bazi', 'intimacy', 'relAi', 'trend', 'timeline', 'todayAdv', 'meihua', 'astro-core', 'astro-planets']) {
  assert.ok(cardKeys.has(key), `报告里存在真实卡片 ${key}`);
}

const firstStops = new Set();
const tools = new Set();
const questions = new Set();
for (const [key, route] of Object.entries(GUIDE_ROUTES)) {
  const guide = GUIDE_V61[key];
  assert.equal(route.name, guide.name, `${key} 名称同源`);
  assert.equal(route.title, guide.title, `${key} 头衔同源`);
  assert.equal(route.focus, guide.focus, `${key} 专长同源`);
  assert.equal(route.theme, themeForPersona(key), `${key} 主题映射同源`);
  assert.equal(guideRouteFor(route.theme).key, key, `${key} 主题键可反查`);
  assert.ok(route.role && route.opening && route.heroLine && route.hookTitle && route.cta,
    `${key} 功能文案齐全`);
  assert.ok(route.cta.includes(route.name), `${key} CTA 点名引路人`);
  assert.equal(route.steps.length, 4, `${key} 路线恰好四步`);
  assert.deepEqual([...route.chips], route.steps.map(step => step.label), `${key} chips 与四步标签逐值一致`);
  assert.equal(route.toc.length, 3, `${key} 目录仍是三个报告分区`);
  assert.equal(route.toc[0], route.entry.sec, `${key} 目录首项就是路线第一站`);
  assert.deepEqual(route.steps[0].action, route.entry, `${key} 第一步等于 CTA 起点`);
  assert.equal(route.steps[2].action.kind, 'tool', `${key} 第三步打开工具`);
  assert.equal(route.steps[2].action.tool, route.tool, `${key} 工具与目录工具行一致`);
  assert.equal(route.steps[3].action.kind, 'ask', `${key} 第四步预填追问`);
  assert.ok(route.steps[3].action.question.length > 20, `${key} 追问是可直接发送的完整问题`);
  assert.equal(route.toolName, toolNames[route.tool], `${key} 工具名与工具目录一致`);
  assert.ok(toolIds.has(route.tool), `${key} 工具 id 真实存在`);
  for (const step of route.steps) {
    const action = step.action;
    if (action.kind === 'card') {
      assert.ok(validSections.has(action.sec), `${key} ${step.label} 分区真实存在`);
      assert.ok(cardKeys.has(action.card), `${key} ${step.label} 卡片真实存在`);
      assert.ok(['eastern', 'western'].includes(action.system), `${key} ${step.label} 明确阅读体系`);
    } else if (action.kind === 'tool') {
      assert.ok(toolIds.has(action.tool), `${key} ${step.label} 工具真实存在`);
    } else if (action.kind === 'ask') {
      assert.ok(action.question, `${key} ${step.label} 追问不为空`);
    } else {
      assert.fail(`${key} ${step.label} 动作类型未知：${action.kind}`);
    }
  }
  firstStops.add(`${route.entry.sec}:${route.entry.card}`);
  tools.add(route.tool);
  questions.add(route.steps[3].action.question);
}
ok(firstStops.size === 6, '六位第一站互不相同（不是换皮）');
ok(tools.size === 6, '六位分别打开六款不同工具');
ok(questions.size === 6, '六位预填的追问互不相同');
ok(new Set(Object.values(GUIDE_ROUTES).map(r => r.role)).size === 6, '六位「具体作用」各不相同');
ok(new Set(Object.values(GUIDE_ROUTES).map(r => r.hookTitle)).size === 6, '六位钩子标题各不相同');

/* ---- 2. 钩子只读真数据、不编造、不改写输入 ---- */
const ctx = Object.freeze({
  dg: '甲', dw: '木', wx: Object.freeze({ ys: '水' }),
  b: Object.freeze({
    Y: Object.freeze({ g: '乙', z: '丑' }), M: Object.freeze({ g: '丙', z: '寅' }),
    D: Object.freeze({ g: '甲', z: '子' }), H: Object.freeze({ g: '己', z: '巳' }),
  }),
  pa: Object.freeze(['偏印格', '食神生财']),
  cDy: Object.freeze({ g: '戊', z: '戌', ys: 2021, ye: 2031 }), cDyIdx: 2, cDySS: '偏财',
  cLn: Object.freeze({ y: 2026, g: '丙', z: '午' }), cLnSS: '食神',
  dy: Object.freeze({ ds: Object.freeze([
    Object.freeze({ g: '丁', z: '酉', ys: 2011, as: 18 }),
    Object.freeze({ g: '戊', z: '戌', ys: 2021, as: 28 }),
    Object.freeze({ g: '己', z: '亥', ys: 2031, as: 38, }),
    Object.freeze({ g: '庚', z: '子', ys: 2041, as: 48 }),
  ]) }),
  ln: Object.freeze([
    Object.freeze({ y: 2026, g: '丙', z: '午' }),
    Object.freeze({ y: 2027, g: '丁', z: '未' }),
  ]),
  cs: 78, ws: 64, ls: 71, hs: 58,
  ssOf: g => ({ 甲: '比肩', 乙: '劫财', 丙: '食神', 丁: '伤官', 戊: '偏财', 己: '正财' }[g] || '—'),
});
const western = Object.freeze({ astro: Object.freeze({
  sun: Object.freeze({ name: '双子座' }), moon: Object.freeze({ name: '处女座' }),
  asc: Object.freeze({ name: '天秤座' }),
  planets: Object.freeze([
    Object.freeze({ key: 'Mercury', sign: Object.freeze({ name: '巨蟹座' }) }),
    Object.freeze({ key: 'Venus', sign: Object.freeze({ name: '金牛座' }) }),
    Object.freeze({ key: 'Mars', sign: Object.freeze({ name: '狮子座' }) }),
    Object.freeze({ key: 'Jupiter', sign: Object.freeze({ name: '射手座' }) }),
  ]),
}) });
const before = JSON.stringify({ ctx, western });
const allHooks = [];
const keyword = {
  moonfox: '底盘', yuchen: '大运', xiyao: '配偶宫',
  diyan: '财运', muse: '牌', xingluo: '星盘',
};
for (const key of GUIDE_ROUTE_KEYS) {
  const hooks = buildGuideHooks(key, { ctx, western, concerns: ['career'], yearNow: 2026 });
  assert.equal(hooks.length, 3, `${key} 恰好三句钩子`);
  assert.equal(new Set(hooks).size, 3, `${key} 三句不重复`);
  for (const hook of hooks) {
    assert.ok(hook.includes('<b>'), `${key} 钩子有受控高亮`);
    assert.ok(!/undefined|NaN|<script/i.test(hook), `${key} 钩子不夹无效值或原始标签`);
  }
  assert.ok(hooks.some(hook => hook.includes(keyword[key])), `${key} 钩子围绕「${keyword[key]}」`);
  allHooks.push(...hooks.map(h => h.replace(/<[^>]+>/g, '')));
}
assert.equal(JSON.stringify({ ctx, western }), before, '生成钩子不得改写 ctx / western');
ok(new Set(allHooks).size === 18, '六位 × 三句共 18 条互不重复');
const emptyHooks = GUIDE_ROUTE_KEYS.flatMap(key => buildGuideHooks(key));
ok(emptyHooks.length === 0, '没有任何计算结果时不编造钩子');
const injected = { ...ctx, dw: '<木>' };
const escaped = buildGuideHooks('moonfox', { ctx: injected, western, yearNow: 2026 });
ok(escaped.length > 0 && !escaped.join('').includes('<木>') && escaped.join('').includes('&lt;木&gt;'),
  '来自档案的特殊字符被转义，不注入 HTML');

/* ---- 3. 漏斗首屏 chips 与单一数据源不漂移 ---- */
const funnelHtml = await read('public/funnel.html');
const tableMatch = /var GUIDE_ROUTES=(\{[\s\S]*?\n\});/.exec(funnelHtml);
assert.ok(tableMatch, 'funnel.html 存在 GUIDE_ROUTES 小表');
const funnelRoutes = JSON.parse(tableMatch[1]);
assert.deepEqual(Object.keys(funnelRoutes).sort(), [...GUIDE_ROUTE_KEYS].sort());
for (const key of GUIDE_ROUTE_KEYS) {
  assert.deepEqual(funnelRoutes[key].chips, [...GUIDE_ROUTES[key].chips], `${key} 入口 chips 与路线表一致`);
}
ok(funnelHtml.includes('id="personaRoute"') && funnelHtml.includes('这位引路人会带你走'),
  '漏斗首屏明确展示「这位引路人会带你走」');
ok(funnelHtml.includes('gr.chips.join(') && funnelHtml.includes('fmApplyPersona'),
  '切换引路人时同步刷新路线 chips');
ok(funnelHtml.includes(GUIDE_ROUTES.moonfox.chips.join(' → ')), '静态默认仍是月白路线');

/* ---- 3b. 首屏内容流：解释性文案按需展开，不再堆在入口 ---- */
ok(funnelHtml.includes('id="btnGuideRoute"') && funnelHtml.includes("fmOpenPanel('guide')"),
  '路线条可点，四步路线的完整解释改由「使用指南」按需展开');
ok(!funnelHtml.includes('引路人决定先看哪张卡 / 打开哪款工具，不参与排盘') &&
   !funnelHtml.includes('预告页与报告里可直接点开这四步'),
  '首屏删掉两行重复的作用说明');
ok(funnelHtml.includes('出生信息只保存在本机，不上传、不注册') &&
   !funnelHtml.includes('命理推演仅供文化研究与娱乐参考'),
  '隐私提示压成一行，免责声明回到免责声明面板');

/* ---- 4. 预告页 / 报告指引 / 跳转 / 文案 / 缓存接线 ---- */
const teaserJs = await read('src/ui/funnel-teaser.js');
const reportUiJs = await read('src/ui/character-report.js');
const reportCss = await read('src/character-report.css');
const navJs = await read('src/ui/navigation.js');
const copyJs = await read('src/product-copy.js');
const teaserCopyJs = await read('src/ui/teaser-copy.js');
const personaJs = await read('src/ui/entry-personas.js');
const sw = await read('public/sw.js');
const pkg = JSON.parse(await read('package.json'));

for (const needle of ['buildGuideHooks(', 'guideRouteFor(', 'runGuideAction(', 'reportToc(route)',
  'window.__w3dData', 'ft-route-btn', 'data-guide-tool', 'route.cta', 'route.hookTitle']) {
  assert.ok(teaserJs.includes(needle), `预告页接线包含 ${needle}`);
}
ok(!teaserJs.includes('十二位大师工具箱'), '预告页不再用六人共用的笼统工具目录');
ok(teaserJs.includes('<details class="ft-card ft-toc-fold') && teaserJs.includes('ft-toc-fold[open]'),
  '完整报告目录默认收起，内容层不再一次铺满文字');
ok(!teaserJs.includes('DAY_MASTER_TONE') && !teaserJs.includes('PERSONA.circle'),
  '本地兜底开场白删掉重复 lead、三十字性格长句与「下面三处」');
ok(teaserCopyJs.includes('40–60 字') && teaserCopyJs.includes("'wen_teaser_copy_v4'") &&
   teaserCopyJs.includes("CACHE_VERSION = 'v4'"),
  '云端开场白限 40–60 字并换新缓存键，旧长文案不会继续显示');
ok(!personaJs.includes('hooksTitle:') && !personaJs.includes('circle:') && !personaJs.includes('lead:'),
  '开场白 / 钩子标题收敛到 guide-route.js 单一数据源');
ok(teaserJs.includes('personaFor(payload.trait)'), '预告页仍沿用共享人物表');
ok(reportUiJs.includes('guideRouteFor(id)') && reportUiJs.includes('runGuideAction(step.action)') &&
   reportUiJs.includes('guide-route-btn'), '报告「引路人指引」渲染同一张可点路线');
ok(reportUiJs.includes('不改变排盘或评分'), '报告指引保留不改写计算的边界说明');
ok(reportUiJs.includes('is-guide-companion-merged') && reportUiJs.includes('guide-companion-shell') &&
   reportUiJs.includes('guide-companion-route') && reportUiJs.includes('shell.append(body)') &&
   !reportUiJs.includes('hero.after(perspective)'),
  '同行卡与引路人卡合并进同一张主卡，不再并排两张卡');
ok(reportUiJs.includes("ming.querySelectorAll('.guide-perspective').forEach(node => node.remove())") &&
   reportUiJs.includes("addPortraitToggle(hero, figure, 'ming', visual)"),
  '旧独立指引卡会清理，立绘开关仍挂在合并后的画面层');
ok(reportCss.includes('.guide-companion-body {') && reportCss.includes('grid-template-columns: minmax(0, 1fr)') &&
   reportCss.includes('grid-template-columns: minmax(0, .82fr) minmax(0, 1.18fr)') &&
   reportCss.includes('@media (max-width: 900px)') && reportCss.includes('@media (forced-colors: active)'),
  '合并卡有宽屏速读 / 路线并列、窄屏纵向分区与强制颜色布局');
ok(navJs.includes('wastro-pane') && navJs.includes('sec-pane') && navJs.includes('TJActivateWastroTab'),
  'jumpTo 能唤醒西方分区与新版分区标签里的卡片');
ok(copyJs.includes('阅读路线') && copyJs.includes('引路人指引') &&
   copyJs.includes('合并后的「同行 / 引路人指引」卡') &&
   funnelHtml.includes('每位引路人都有自己的阅读路线') &&
   funnelHtml.includes('合并后的「同行 / 引路人指引」卡') &&
   (await read('README.md')).includes('合并后的「同行 / 引路人指引」卡'),
  '使用指南 / 关于 / FAQ / README 口径统一为「一张合并卡 + 引路人决定阅读路线」');
ok(APP_CACHE_VERSION === 'v86' && GUIDE_VIDEO_VERSION === 'v76' && GUIDE_VIDEO_QUERY === '?v=76',
  '应用缓存升 v86，视频素材保持 v76');
ok(sw.includes(`const CACHE = 'wenda-cache-${APP_CACHE_VERSION}';`), 'SW 缓存与 APP_CACHE_VERSION 同步');
ok(pkg.scripts['test:guide-route'] === 'node tools/test-guide-route.mjs' &&
   pkg.scripts['test:unit'].includes('node tools/test-guide-route.mjs'),
  '路线回归有独立脚本且已纳入 test:unit');

/* ---- 5. 执行器只调用页面已有入口；ask 不代发 ---- */
const calls = [];
const askInput = { value: '', dispatchEvent() {}, focus() {} };
const fakeDocument = {
  getElementById: id => {
    if (id === 'aiSheet') return { classList: { contains: () => true } };
    if (id === 'askInput') return askInput;
    return null;
  },
};
const fakeWindow = {
  setSystemMode: mode => calls.push(['mode', mode]),
  jumpTo: (...args) => calls.push(['jump', ...args]),
  openToolPage: id => calls.push(['tool', id]),
  openAsk: () => calls.push(['openAsk']),
};
globalThis.window = fakeWindow;
globalThis.document = fakeDocument;
try {
  assert.equal(runGuideAction(GUIDE_ROUTES.xingluo.entry), true);
  assert.deepEqual(calls, [['mode', 'western'], ['jump', 's-ming', 'astro-core', undefined]],
    '西方卡片动作先切体系再跳真实卡片');
  calls.length = 0;
  assert.equal(runGuideAction({ kind: 'tool', tool: 'tarot' }), true);
  assert.deepEqual(calls, [['tool', 'tarot']], '工具动作只调用 openToolPage');
  calls.length = 0;
  assert.equal(runGuideAction({ kind: 'ask', question: '只依据报告里的依据回答' }), true);
  assert.equal(askInput.value, '只依据报告里的依据回答', '追问只预填输入框');
  assert.ok(!calls.some(call => call[0] === 'openAsk'), '面板已开时不重复 toggle');
  assert.equal(runGuideAction(null), false, '空动作安静失败');
} finally {
  delete globalThis.window;
  delete globalThis.document;
}
ok(true, '执行器只走 setSystemMode / jumpTo / openToolPage / 预填，不自动发送追问');

console.log(`\n✓ 引路人阅读路线回归通过（${pass} 项显式断言）\n`);
