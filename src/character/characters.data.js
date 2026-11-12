/* ============================================================
   引路人角色素材表（单一数据源）
   ------------------------------------------------------------
   原先 11 个文件各自导出一份结构完全相同的角色定义，只有图片路径、
   名称、镜头参数不同。这里集中为一份数据表；换素材、加角色只改此处。
   wenwen.js / chat-master.js / companion.js 含行为逻辑，保持独立。

   V6.1 全面换新：六位引路人改用 2D 定妆的透明立绘（*-v61.webp）、
   同版头像（*-v61-avatar.webp）与人物视频（motion，报告头图用）；旧的
   3D 电影渲染立绘、逐帧表情贴图与火焰王座/星扇等道具全部退场。
   历史主题键（moonfox / xingling / diyan / …）保持不变，旧档案可用。
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

/** V6.1 焱绒：黑金掌柜，弃旧火焰王座/权杖/符文整套设定。 */
export const EARTHFIRE_SOVEREIGN = defineCharacter({
  id: 'diyan',
  name: '焱绒',
  camera: { closeScale: 1.04, fullBody: true },
  assets: {
    portrait: { src: './art/diyan-v61.webp', alt: '焱绒身着黑金长袍，垂金铜钱串立于藏宝阁', width: 1000, height: 1800 },
    avatar: { src: './art/diyan-v61-avatar.webp', alt: '', width: 192, height: 192 },
  },
  motion: { src: './art/diyan-invite.mp4?v=75', poster: './art/diyan-lord.webp', width: 672, height: 1344 },
});
/** V6.1 定名（旧导出名保留兼容历史引用）。 */
export const YANRONG = EARTHFIRE_SOVEREIGN;

/** V6.1 玉宸：翡翠金凤袍 + 宫苑回廊，事业推演专家。 */
export const JADE_EMPRESS = defineCharacter({
  id: 'yuchen',
  name: '玉宸',
  camera: { closeScale: 1.04, fullBody: true },
  assets: {
    portrait: { src: './art/yuchen-v61.webp', alt: '玉宸头戴绿玉凤冠，身着墨绿描金凤凰袍，手捧玉印', width: 1000, height: 1800 },
    avatar: { src: './art/yuchen-v61-avatar.webp', alt: '', width: 192, height: 192 },
  },
  motion: { src: './art/yuchen-invite.mp4?v=75', poster: './art/yuchen-lord.webp', width: 672, height: 1344 },
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

/** V6.1 月白：银白冰蓝丝缎袍、白底蓝纹狐面具、蓝色狐火，悬浮于水面。 */
export const MOON_FOX = defineCharacter({
  id: 'moonfox',
  name: '月白',
  camera: { closeScale: 1.04, fullBody: true },
  assets: {
    portrait: { src: './art/moonfox-v61.webp', alt: '月白身着银白冰蓝丝缎袍，执狐面具悬浮于水面，蓝色狐火环绕', width: 1000, height: 1800 },
    avatar: { src: './art/moonfox-v61-avatar.webp', alt: '', width: 192, height: 192 },
  },
  motion: { src: './art/yuebai-invite.mp4?v=75', poster: './art/yuebai-lord.webp', width: 672, height: 1344 },
});

/** V6.1 絮羽：整体改为西方卡罗牌大师——梅子紫缎裙、黑西装披肩、悬浮牌弧。 */
export const TAROT_MASTER = defineCharacter({
  id: 'muse',
  name: '絮羽',
  camera: { closeScale: 1.04, fullBody: true },
  assets: {
    portrait: { src: './art/muse-v61.webp', alt: '絮羽身着梅子紫缎裙与黑西装披肩，指尖悬起一张卡罗牌，四周牌弧环绕', width: 1000, height: 1800 },
    avatar: { src: './art/muse-v61-avatar.webp', alt: '', width: 192, height: 192 },
  },
  motion: { src: './art/muse-invite.mp4?v=75', poster: './art/muse-lord.webp', width: 672, height: 1344 },
});
/** 旧导出名保留，历史集成不会断。 */
export const MUSE = TAROT_MASTER;

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

/** V6.1 夕瑶：红娘设定——桃花簪、姻缘簿、红线、桃花愿树；弃旧星绫星扇。 */
export const XIYAO = defineCharacter({
  id: 'xingling',
  name: '夕瑶',
  camera: { closeScale: 1.04, fullBody: true },
  assets: {
    portrait: { src: './art/xingling-v61.webp', alt: '夕瑶身着粉白襦裙，执姻缘簿与一缕红线，立于桃花愿树下', width: 1000, height: 1800 },
    avatar: { src: './art/xingling-v61-avatar.webp', alt: '', width: 192, height: 192 },
  },
  motion: { src: './art/xiyao-invite.mp4?v=75', poster: './art/xiyao-lord.webp', width: 672, height: 1344 },
});
/** 旧导出名保留（历史主题键 xingling 不变）。 */
export const XINGLING = XIYAO;

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

/** V6.1 新增引路人：西方占星师。白衬衫 + 午夜蓝占星袍褂、黄铜星盘吊坠、
 *  羊皮纸星图卷、黄道纹身；观星室黄道环与星座连线。 */
export const XINGLUO = defineCharacter({
  id: 'xingluo',
  name: '星罗',
  camera: { closeScale: 1.04, fullBody: true },
  assets: {
    portrait: { src: './art/xingluo-v61.webp', alt: '星罗身着白衬衫与午夜蓝占星袍褂，佩黄铜星盘吊坠，手持羊皮纸星图卷', width: 1000, height: 1800 },
    avatar: { src: './art/xingluo-v61-avatar.webp', alt: '', width: 192, height: 192 },
  },
  motion: { src: './art/xingluo-invite.mp4?v=75', poster: './art/xingluo-lord.webp', width: 672, height: 1344 },
});
