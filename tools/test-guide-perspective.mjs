import assert from 'node:assert/strict';
import { buildGuidePerspective } from '../src/ui/guide-perspective.js';

const ctx = Object.freeze({
  dg: '甲', dw: '木', wx: Object.freeze({ ys: '水' }),
  b: Object.freeze({
    Y: Object.freeze({ g: '乙', z: '丑' }),
    M: Object.freeze({ g: '丙', z: '寅' }), D: Object.freeze({ g: '甲', z: '子' }),
  }),
  cDy: Object.freeze({ g: '丁', z: '卯' }), cLn: Object.freeze({ g: '丙', z: '午' }),
  scores: Object.freeze({ career: 61, love: 77 }),
});
const western = Object.freeze({ astro: Object.freeze({
  sun: Object.freeze({ name: '双子座' }),
  moon: Object.freeze({ name: '处女座' }), asc: Object.freeze({ name: '天秤座' }),
  planets: Object.freeze([
    Object.freeze({ key: 'Mercury', sign: Object.freeze({ name: '巨蟹座' }) }),
    Object.freeze({ key: 'Venus', sign: Object.freeze({ name: '金牛座' }) }),
    Object.freeze({ key: 'Mars', sign: Object.freeze({ name: '狮子座' }) }),
    Object.freeze({ key: 'Jupiter', sign: Object.freeze({ name: '射手座' }) }),
  ]),
}) });
const before = JSON.stringify({ ctx, western });
const ids = ['diyan', 'yuchen', 'moonfox', 'xingling', 'muse', 'xingluo'];
const guides = ids.map(id => buildGuidePerspective(id, ctx, western));
assert.deepEqual(guides.map(guide => guide.focus),
  ['财富推演', '事业推演', '全能推演', '姻缘推演', '塔罗推演', '占星推演']);
assert.equal(new Set(guides.map(guide => guide.prompt)).size, 6);
const byId = Object.fromEntries(ids.map((id, i) => [id, guides[i]]));
assert.ok(byId.diyan.eastern.includes('日主 甲木') && byId.diyan.eastern.includes('用神 水'));
assert.ok(byId.diyan.western.includes('木星 射手座'), '财富视角主看木星');
assert.ok(byId.yuchen.eastern.includes('大运 丁卯') && byId.yuchen.eastern.includes('流年 丙午'));
assert.ok(byId.yuchen.western.includes('火星 狮子座'), '事业视角主看火星');
assert.ok(byId.moonfox.eastern.includes('月柱 丙寅') && byId.moonfox.eastern.includes('日柱 甲子'));
assert.ok(byId.moonfox.western.includes('太阳 双子座') && byId.moonfox.western.includes('上升 天秤座'),
  '全能视角东西方全景并陈');
assert.ok(byId.xingling.eastern.includes('日支 子'));
assert.ok(byId.xingling.western.includes('金星 金牛座') && byId.xingling.western.includes('月亮 处女座'),
  '姻缘视角主看金星与月亮');
assert.ok(byId.muse.western.includes('月亮 处女座') && byId.muse.western.includes('水星 巨蟹座'));
assert.ok(byId.xingluo.western.includes('太阳 双子座') && byId.xingluo.western.includes('上升 天秤座'));
assert.ok(byId.xingluo.eastern.includes('年柱 乙丑'), '占星视角东方只作辅助');
assert.equal(JSON.stringify({ ctx, western }), before, '不同视角不得修改计算结果或输入');
assert.equal(buildGuidePerspective('unknown', ctx, western), null);
assert.equal(buildGuidePerspective('leizi', ctx, western), null, '雷兹已退出 V6.1 引路人阵容');
const empty = buildGuidePerspective('moonfox');
assert.equal(empty.eastern, '');
assert.equal(empty.western, '');
assert.ok(empty.prompt, '缺少数据仍可显示阅读方式，但不虚构命盘');
console.log('✓ V6.1 六种引路人专长视角各不相同，只读取现有依据且不改变命盘');
