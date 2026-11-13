/* V6.1 引路人全面换新回归：纯 Node，无需浏览器。
   覆盖「六位引导方向 / 跨页配色逐值对齐 / 2D 素材与四段视频齐备 /
   旧 3D 立绘与表情贴图退场 / 版本与缓存版本」。 */
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import {
  GUIDE_V61, GUIDE_KEYS, FUNNEL_PERSONAS, DEFAULT_PERSONA,
  themeForPersona, paletteFor, videoFor, GUIDE_VIDEO_VERSION, GUIDE_VIDEO_QUERY,
  APP_CACHE_VERSION,
} from '../src/ui/entry-personas.js';
import { HOME_THEMES } from '../src/ui/home-theme.js';
import { buildGuidePerspective } from '../src/ui/guide-perspective.js';
import { PRODUCT } from '../src/product-copy.js';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const exists = async path => {
  try { return (await stat(new URL(`public/${path}`, root))).isFile(); }
  catch { return false; }
};
let pass = 0;
const ok = (condition, message) => { assert.ok(condition, message); pass++; console.log('  ✓ ' + message); };

console.log('═══════════════════════════════════════════════');
console.log('  V6.1 引路人全面换新回归');
console.log('═══════════════════════════════════════════════\n');

/* ---- 1. 六位引导方向（用户定版） ---- */
const expected = Object.freeze({
  moonfox: ['月白', '神秘人', '全能推演', 'moonfox'],
  yuchen: ['玉宸', '事业', '事业推演', 'yuchen'],
  xiyao: ['夕瑶', '姻缘', '姻缘推演', 'xingling'],
  diyan: ['焱绒', '财富', '财富推演', 'diyan'],
  muse: ['絮羽', '卡罗大师', '塔罗推演', 'muse'],
  xingluo: ['星罗', '占星术', '占星推演', 'xingluo'],
});
ok(GUIDE_KEYS.length === 6 && Object.keys(expected).every(key => GUIDE_KEYS.includes(key)),
  '引路人阵容恰好六位：月白 / 玉宸 / 夕瑶 / 焱绒 / 絮羽 / 星罗');
for (const [key, [name, title, focus, theme]] of Object.entries(expected)) {
  const guide = GUIDE_V61[key];
  assert.deepEqual([guide.name, guide.title, guide.focus, guide.theme], [name, title, focus, theme]);
  assert.equal(FUNNEL_PERSONAS[key].name, name);
  assert.equal(FUNNEL_PERSONAS[key].title, title);
  assert.equal(FUNNEL_PERSONAS[key].focus, focus);
  assert.equal(themeForPersona(key), theme, `${key} 映射到正确的报告主题`);
  const perspective = buildGuidePerspective(theme);
  assert.equal(perspective.name, name);
  assert.equal(perspective.title, title);
  assert.equal(perspective.focus, focus);
  assert.equal(perspective.prompt, guide.prompt, `${key} 报告提示与唯一数据源一致`);
  assert.ok(HOME_THEMES[theme].guide && HOME_THEMES[theme].guide.name === name,
    `${key} 主应用主题登记了同一位引路人`);
}
console.log(`  ✓ 六位的头衔 / 专长 / 报告视角 / 主题映射全部对齐（${pass} 项累计）`);
ok(DEFAULT_PERSONA === 'moonfox', '默认引路人仍是全能推演的月白');
ok(buildGuidePerspective('leizi') === null && buildGuidePerspective('unknown') === null,
  '雷兹等旧角色已退出 V6.1 引路人阵容');

/* ---- 2. 跨页配色逐值对齐 ---- */
const funnel = await read('public/funnel.html');
const themeBlock = key => {
  const match = new RegExp(`html\\[data-funnel-persona="${key}"\\]\\{([\\s\\S]*?)\\}`).exec(funnel);
  assert.ok(match, `funnel.html 存在 ${key} 主题块`);
  return match[1];
};
const cssVar = (block, name) => {
  const match = new RegExp(`--${name}:([^;]+);`).exec(block);
  assert.ok(match, `主题块含 --${name}`);
  return match[1].trim();
};
for (const key of GUIDE_KEYS) {
  const guide = GUIDE_V61[key];
  const palette = paletteFor(key);
  const block = themeBlock(key);
  const theme = HOME_THEMES[themeForPersona(key)];
  ok(palette.accent === guide.color && theme.accent === guide.color && cssVar(block, 'gold') === guide.color,
    `${key} 主题色三处同值（${guide.color}）`);
  ok(palette.bg === guide.bg && cssVar(block, 'bg') === guide.bg,
    `${key} 首屏底色与预刷一致`);
  ok(cssVar(block, 'accent-rgb') === palette.accentRgb && cssVar(block, 'button-top') === palette.btnTop,
    `${key} 强调色 RGB 与按钮渐变一致`);
  assert.ok(funnel.includes(`${key}: '${guide.bg}'`), `${key} 预刷 meta theme-color 与主题一致`);
}
ok(/html\[data-funnel-persona="xiyao"\][\s\S]*--gold:#ff9ac6/.test(funnel),
  '夕瑶主题色按用户要求调得更粉（#ff9ac6）');
ok(/html\[data-funnel-persona="diyan"\][\s\S]*--gold:#dfb36c/.test(funnel) &&
   !/html\[data-funnel-persona="diyan"\][\s\S]*#ec8278/.test(funnel),
  '焱绒弃旧三文鱼红，改黑金掌柜配色');
ok(/html\[data-funnel-persona="muse"\][\s\S]*--bg:#160d1a/.test(funnel),
  '絮羽改梅子紫底，呼应西方卡罗大师定妆');

/* ---- 3. 2D 素材与四段视频齐备 ---- */
const sw = await read('public/sw.js');
const v61Keys = ['moonfox', 'yuchen', 'xingling', 'diyan', 'muse', 'xingluo'];
for (const themeKey of v61Keys) {
  const character = HOME_THEMES[themeKey].character;
  const { portrait, avatar } = character.assets;
  ok(portrait.src === `./art/${themeKey}-v61.webp` && portrait.width === 1000 && portrait.height === 1800,
    `${themeKey} 使用 V6.1 透明 2D 全身立绘`);
  ok(avatar.src === `./art/${themeKey}-v61-avatar.webp`, `${themeKey} 使用同版 2D 头像`);
  ok(!character.assets.blink && !character.assets.speaking && !character.assets.fireThrone,
    `${themeKey} 不再叠旧 3D 表情贴图 / 火焰王座`);
  ok(character.camera.fullBody === true, `${themeKey} 全身取景，不再做旧近景放大`);
  for (const path of [portrait.src.slice(2), avatar.src.slice(2)]) {
    assert.ok(await exists(path), `${path} 必须存在`);
    assert.ok(sw.includes(`'${path}'`), `${path} 必须登记离线缓存`);
  }
  assert.ok(character.motion?.src && character.motion?.poster, `${themeKey} 登记人物视频与定妆海报`);
  const videoPath = character.motion.src.slice(2).split('?')[0];
  assert.ok(await exists(videoPath), `${videoPath} 必须存在`);
  assert.ok(await exists(character.motion.poster.slice(2)), `${themeKey} 视频 poster 必须存在`);
}
console.log('  ✓ 六位 V6.1 立绘 / 头像 / 视频海报 / invite 视频齐备');

for (const key of GUIDE_KEYS) {
  const videos = GUIDE_V61[key].videos;
  for (const [stage, file] of Object.entries(videos)) {
    assert.ok(await exists(`art/${file}`), `${key} ${stage} 视频 art/${file} 必须存在`);
  }
  assert.ok(funnel.includes(`./art/${videos.entry}`), `${key} 入口段接入 funnel.html`);
  assert.ok(funnel.includes(`./art/${videos.quiz}`), `${key} 问卷段接入 funnel.html`);
  assert.ok(funnel.includes(`./art/${videos.ritual}`), `${key} 仪式段接入 funnel.html`);
  assert.equal(GUIDE_VIDEO_VERSION, 'v76', '视频素材版本升至 v76（表演版替换）');
  assert.equal(GUIDE_VIDEO_QUERY, '?v=76', '视频 URL 查询串写法为 v=76');
  assert.equal(videoFor(key, 'invite'), `./art/${videos.invite}${GUIDE_VIDEO_QUERY}`,
    `${key} 邀约段视频带统一缓存版本`);
  assert.equal(FUNNEL_PERSONAS[key].video, videoFor(key, 'invite'),
    `${key} 预告页与报告头图共用同一条邀约视频`);
}
console.log('  ✓ 四段 × 六位 = 24 段人物视频全部存在且接入');
ok(sw.includes(`'art/xingluo-observatory-wide.webp'`) &&
   HOME_THEMES.xingluo.backdrop.wide === './art/xingluo-observatory-wide.webp',
  '星罗用自己的观星室场景，不再借絮羽大厅');

/* ---- 4. 版本、缓存与入口文案 ---- */
const pkg = JSON.parse(await read('package.json'));
const indexHtml = await read('index.html');
ok(APP_CACHE_VERSION === 'v86' && sw.includes(`const CACHE = 'wenda-cache-${APP_CACHE_VERSION}';`),
  'Service Worker 缓存版本与应用构建同步升级，不再绑死视频素材版本');
ok(!funnel.includes('?v=75') && (funnel.match(/\?v=76/g) || []).length === 29,
  '漏斗 29 处视频引用全部在 v=76（含月白/玉宸/焱绒沉浸分支 look/sit 六条），旧 v=75 已清零');
ok(PRODUCT.version === 'wen6.0' && pkg.productVersion === 'wen6.0' && pkg.version === '6.0.0',
  'V6.1 是引路人革新规格，对外产品版本仍为 wen6.0 / npm 6.0.0');
ok(indexHtml.includes('wen6.0') && funnel.includes('wen6.0') && (await read('README.md')).includes('wen6.0'),
  '主应用 / 漏斗 / README 三处版本号同步');
ok(indexHtml.includes('data-veil-portrait src="./art/yuebai-lord.webp"'),
  '交接遮罩静态默认回到月白，不再是焱绒');
for (const label of ['财富 · 看财路与进退', '事业 · 看大运与选择', '全盘 · 东方命盘与星盘', '姻缘 · 看相处与互动', '占星 · 看星体与宫位', '塔罗 · 围绕问题读牌']) {
  assert.ok(funnel.includes(label), `入口选择器明确标注「${label}」`);
}
console.log('  ✓ 六位引导方向在入口选择器逐条可见');

console.log(`\n✓ V6.1 全面换新回归通过（${pass} 项显式断言 + 素材/视频逐项校验）\n`);
