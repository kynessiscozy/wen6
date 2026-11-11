/* ============================================================
   引路人角色素材表（单一数据源）
   ------------------------------------------------------------
   原先 11 个文件各自导出一份结构完全相同的角色定义，只有图片路径、
   名称、镜头参数不同。这里集中为一份数据表；换素材、加角色只改此处。
   wenwen.js / chat-master.js / companion.js 含行为逻辑，保持独立。
   ============================================================ */

const NO_TOPICS = Object.freeze([]);

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function defineCharacter(data) {
  return deepFreeze({ greeting: '', topics: NO_TOPICS, ...data });
}

/** 火焰王座是独立布景，不属于人物轮廓；权杖在轮廓内，近景要留。 */
export const EARTHFIRE_SOVEREIGN = defineCharacter({
  id: 'diyan',
  name: '焱绒',
  camera: { closeScale: 1.7, safeX: .885, safeInset: .06 },
  assets: {
    portrait: { src: './art/diyan-cinema3d.webp', alt: '焱绒手持权杖，坐在燃烧的火焰王座前', width: 848, height: 1264 },
    blink: { src: './art/diyan-cinema3d-blink-v2.webp', alt: '', width: 848, height: 1264, forPortrait: './art/diyan-cinema3d.webp' },
    speaking: { src: './art/diyan-cinema3d-speak.webp', alt: '', width: 848, height: 1264, forPortrait: './art/diyan-cinema3d.webp' },
    fireThrone: { src: './art/earthfire-flame-seat.webp', alt: '', width: 1124, height: 644 },
    runes: { src: './art/earthfire-runes.webp', alt: '', width: 512, height: 512 },
    runeSeal: { src: './art/earthfire-rune-seal.webp', alt: '', width: 960, height: 640 },
    avatar: { src: './art/diyan-cinema3d-avatar.webp', alt: '', width: 192, height: 192 },
  },
});

/** 玉印在左侧，窄屏近景需要保留。 */
export const JADE_EMPRESS = defineCharacter({
  id: 'yuchen',
  name: '玉宸',
  camera: { closeScale: 2.06, safeX: .30, safeInset: .05 },
  assets: {
    portrait: { src: './art/yuchen-cinema3d.webp', alt: '玉宸头戴凤冠，身着翡翠金纹礼服，手捧玉印立于殿中', width: 896, height: 1200 },
    blink: { src: './art/yuchen-cinema3d-blink-v2.webp', alt: '', width: 896, height: 1200, forPortrait: './art/yuchen-cinema3d.webp' },
    speaking: { src: './art/yuchen-cinema3d-speak.webp', alt: '', width: 896, height: 1200, forPortrait: './art/yuchen-cinema3d.webp' },
    avatar: { src: './art/yuchen-cinema3d-avatar.webp', alt: '', width: 192, height: 192 },
  },
});

export const LEIZI = defineCharacter({
  id: 'leizi',
  name: '雷兹',
  camera: { closeScale: 1.6, safeX: .5, safeInset: .05 },
  assets: {
    portrait: { src: './art/leizi-cinema3d.webp', alt: '雷兹站在奥林匹斯云端台阶上，指尖绕着一束闪电', width: 768, height: 1376 },
    blink: { src: './art/leizi-cinema3d-blink.webp', alt: '', width: 768, height: 1376, forPortrait: './art/leizi-cinema3d.webp' },
    speaking: { src: './art/leizi-cinema3d-speak.webp', alt: '', width: 768, height: 1376, forPortrait: './art/leizi-cinema3d.webp' },
    avatar: { src: './art/leizi-cinema3d-avatar.webp', alt: '', width: 192, height: 192 },
  },
});

/** 全身像，暂不提供与肖像对齐的表情层。 */
export const LUYE = defineCharacter({
  id: 'luye',
  name: '陆野',
  camera: { closeScale: 1.04, fullBody: true },
  assets: {
    portrait: { src: './art/luye-fullbody.webp', alt: '年轻音乐人戴着耳机倾听，神情充满好奇', width: 864, height: 1821 },
    avatar: { src: './art/luye-fullbody-avatar.webp', alt: '', width: 192, height: 192 },
  },
});

/** 狐火要留在画面内，近景时靠左取景。 */
export const MOON_FOX = defineCharacter({
  id: 'moonfox',
  name: '月白',
  camera: { closeScale: 1.85, safeX: .23, safeInset: .05 },
  assets: {
    portrait: { src: './art/moonfox-cinema3d.webp', alt: '银发狐妖月白坐在祥云上，手中托着蓝色狐火', width: 768, height: 1376 },
    blink: { src: './art/moonfox-cinema3d-blink-v2.webp', alt: '', width: 768, height: 1376, forPortrait: './art/moonfox-cinema3d.webp' },
    speaking: { src: './art/moonfox-cinema3d-speak.webp', alt: '', width: 768, height: 1376, forPortrait: './art/moonfox-cinema3d.webp' },
    cloudTrail: { src: './art/moon-fox-cloud-trail.webp', alt: '', width: 1000, height: 319 },
    avatar: { src: './art/moonfox-cinema3d-avatar.webp', alt: '', width: 192, height: 192 },
  },
});

export const MUSE = defineCharacter({
  id: 'muse',
  name: '絮羽',
  camera: { closeScale: 1.6, safeX: .5, safeInset: .05 },
  assets: {
    portrait: { src: './art/muse-cinema3d.webp', alt: '絮羽悬浮在黄昏石柱大厅里，身后展开一只巨大的白色羽毛翅膀', width: 768, height: 1376 },
    blink: { src: './art/muse-cinema3d-blink.webp', alt: '', width: 768, height: 1376, forPortrait: './art/muse-cinema3d.webp' },
    speaking: { src: './art/muse-cinema3d-speak.webp', alt: '', width: 768, height: 1376, forPortrait: './art/muse-cinema3d.webp' },
    avatar: { src: './art/muse-cinema3d-avatar.webp', alt: '', width: 192, height: 192 },
  },
});

export const QINGLAN = defineCharacter({
  id: 'qinglan',
  name: '青岚',
  camera: { closeScale: 1.45, safeX: .82, safeInset: .04 },
  assets: {
    portrait: { src: './art/qinglan-cinema3d.webp', alt: '青岚倚风云举起酒葫芦，长发飘扬，手执长剑', width: 848, height: 1264 },
    blink: { src: './art/qinglan-cinema3d-blink-v2.webp', alt: '', width: 848, height: 1264, forPortrait: './art/qinglan-cinema3d.webp' },
    speaking: { src: './art/qinglan-cinema3d-speak.webp', alt: '', width: 848, height: 1264, forPortrait: './art/qinglan-cinema3d.webp' },
    avatar: { src: './art/qinglan-cinema3d-avatar.webp', alt: '', width: 192, height: 192 },
  },
});

export const RONGRONG = defineCharacter({
  id: 'rongrong',
  name: '绒绒',
  camera: { closeScale: 1.45, safeX: .90, safeInset: .04 },
  assets: {
    portrait: { src: './art/rongrong-cinema3d.webp', alt: '绒绒是伸手相邀的小熊猫灵，手提爪形铃铛', width: 848, height: 1264 },
    blink: { src: './art/rongrong-cinema3d-blink-v2.webp', alt: '', width: 848, height: 1264, forPortrait: './art/rongrong-cinema3d.webp' },
    speaking: { src: './art/rongrong-cinema3d-speak.webp', alt: '', width: 848, height: 1264, forPortrait: './art/rongrong-cinema3d.webp' },
    avatar: { src: './art/rongrong-cinema3d-avatar.webp', alt: '', width: 192, height: 192 },
    pawbell: { src: './art/rongrong-pawbell.webp', alt: '', width: 108, height: 165 },
  },
});

/** 全身像，暂不提供与肖像对齐的表情层。 */
export const SUYAN = defineCharacter({
  id: 'suyan',
  name: '苏言',
  camera: { closeScale: 1.04, fullBody: true },
  assets: {
    portrait: { src: './art/suyan-fullbody.webp', alt: '摄影师穿着简洁时尚的深色礼服，手持相机，自信从容', width: 864, height: 1821 },
    avatar: { src: './art/suyan-fullbody-avatar.webp', alt: '', width: 192, height: 192 },
  },
});

export const XINGLING = defineCharacter({
  id: 'xingling',
  name: '星绫',
  camera: { closeScale: 1.45, safeX: .22, safeInset: .04 },
  assets: {
    portrait: { src: './art/xingling-cinema3d.webp', alt: '星绫身披紫色星纹长衣，倚于云端，抬手执星扇', width: 768, height: 1376 },
    blink: { src: './art/xingling-cinema3d-blink-v2.webp', alt: '', width: 768, height: 1376, forPortrait: './art/xingling-cinema3d.webp' },
    speaking: { src: './art/xingling-cinema3d-speak.webp', alt: '', width: 768, height: 1376, forPortrait: './art/xingling-cinema3d.webp' },
    avatar: { src: './art/xingling-cinema3d-avatar.webp', alt: '', width: 192, height: 192 },
  },
});

export const ZHIYA = defineCharacter({
  id: 'zhiya',
  name: '纸鸢',
  camera: { closeScale: 1.45, safeX: .92, safeInset: .04 },
  assets: {
    portrait: { src: './art/zhiya-cinema3d.webp', alt: '纸鸢是腾空伸手的风与纸鹤使者，身穿羽纸披风', width: 848, height: 1264 },
    blink: { src: './art/zhiya-cinema3d-blink-v2.webp', alt: '', width: 848, height: 1264, forPortrait: './art/zhiya-cinema3d.webp' },
    speaking: { src: './art/zhiya-cinema3d-speak.webp', alt: '', width: 848, height: 1264, forPortrait: './art/zhiya-cinema3d.webp' },
    avatar: { src: './art/zhiya-cinema3d-avatar.webp', alt: '', width: 192, height: 192 },
    crane: { src: './art/zhiya-crane.webp', alt: '', width: 260, height: 218 },
  },
});

/** V6.1 新增引路人：西方占星师。定妆为候选版（待用户验脸确认），
 *  暂不提供与肖像对齐的表情层，与全身像角色同例。 */
export const XINGLUO = defineCharacter({
  id: 'xingluo',
  name: '星罗',
  camera: { closeScale: 1.5, safeX: .5, safeInset: .05 },
  assets: {
    portrait: { src: './art/xingluo-cinema3d.webp', alt: '星罗身穿哑光黑长大衣，站在圆形观星窗与银色轨道环装置前', width: 768, height: 1376 },
    avatar: { src: './art/xingluo-cinema3d-avatar.webp', alt: '', width: 192, height: 192 },
  },
});
