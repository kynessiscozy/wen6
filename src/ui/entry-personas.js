/* ============================================================
   V6.1 引路人唯一数据源（2026-11-11 全面换新）
   ------------------------------------------------------------
   funnel.html 是 public/ 下的独立页面（不能用 ES module 导入），所以它保留
   一份很小的视频路径表 + 同值的 CSS 配色；但「名字、头衔、专长方向、语气、
   对应哪个 HOME_THEMES 角色、素材路径」这类跨页语义只在这里定义一次。
   新增/调整引路人时，改这里 + funnel.html 的素材表与配色即可。

   六位引路人的引导方向（用户定版）：
     月白 神秘人 · 全能推演（默认）｜玉宸 事业推演｜夕瑶 姻缘推演
     焱绒 财富推演｜絮羽 卡罗大师 · 塔罗推演（西方卡罗牌）
     星罗 西方占星师 · 占星推演（V6.1 新增）

   注意 xiyao（夕瑶）在 HOME_THEMES 里没有同名条目：她沿用 xingling（原
   「星绫」）这一历史主题键，但角色、名称、立绘与配色已全部换成 V6.1 红娘，
   不再静默回退成焱绒。内部 id 保持不变，是为了让旧档案与深链继续可用。
   ============================================================ */

export const DEFAULT_PERSONA = 'moonfox';

/* 视频素材版本：24 段 MP4 已随表演版替换升 v76，URL 查询串按站点既有写法用 ?v=76。
   应用离线缓存另走 APP_CACHE_VERSION：只改代码 / 文案时升缓存，不误伤
   videoFor() 拼出的 ?v76 这类无效参数，也不强迫视频 URL 跟着变。 */
export const GUIDE_VIDEO_VERSION = 'v76';
export const GUIDE_VIDEO_QUERY = '?v=76';
/* 引路人阅读路线上线后，funnel.html / 预告页 / 报告指引都需要刷新离线副本。 */
export const APP_CACHE_VERSION = 'v87';

/**
 * 六位引路人的完整定义。color 是跨页唯一的主题色：
 * funnel.html 的 --gold、PALETTES.accent、HOME_THEMES.accent 必须同值。
 */
export const GUIDE_V61 = Object.freeze({
  moonfox: Object.freeze({
    id: 'moonfox', name: '月白', title: '神秘人', focus: '全能推演',
    theme: 'moonfox', art: 'yuebai',
    color: '#b9dbef', bg: '#090f17', shade: '9,15,23',
    prompt: '不预设方向，先把整张盘看全：哪些线索彼此印证，哪些还互相矛盾？',
    videos: Object.freeze({ entry: 'yuebai-entry.mp4?v=76', quiz: 'yuebai-quiz.mp4?v=76', ritual: 'yuebai-ritual.mp4?v=76', invite: 'yuebai-invite.mp4?v=76' }),
  }),
  yuchen: Object.freeze({
    id: 'yuchen', name: '玉宸', title: '事业', focus: '事业推演',
    theme: 'yuchen', art: 'yuchen',
    color: '#d3dda6', bg: '#10140e', shade: '16,20,14',
    prompt: '专看事业这一条线：眼下这步大运里，哪一件事最值得先押注？',
    videos: Object.freeze({ entry: 'yuchen-entry.mp4?v=76', quiz: 'yuchen-quiz.mp4?v=76', ritual: 'yuchen-ritual.mp4?v=76', invite: 'yuchen-invite.mp4?v=76' }),
  }),
  xiyao: Object.freeze({
    id: 'xiyao', name: '夕瑶', title: '姻缘', focus: '姻缘推演',
    theme: 'xingling', art: 'xiyao',
    /* 用户定：主题色更粉一点——从 #f2a7c3 提到更饱和的桃花粉。 */
    color: '#ff9ac6', bg: '#1b0d18', shade: '27,13,24',
    prompt: '专看姻缘这一条线：你心里那个人，和盘里写的缘分对得上吗？',
    videos: Object.freeze({ entry: 'xiyao-entry.mp4?v=76', quiz: 'xiyao-quiz.mp4?v=76', ritual: 'xiyao-ritual.mp4?v=76', invite: 'xiyao-invite.mp4?v=76' }),
  }),
  diyan: Object.freeze({
    id: 'diyan', name: '焱绒', title: '财富', focus: '财富推演',
    theme: 'diyan', art: 'diyan',
    /* 黑金掌柜定妆：弃旧「地炎君」三文鱼红 #ec8278。 */
    color: '#dfb36c', bg: '#0e0a07', shade: '14,10,7',
    prompt: '专看财富这一条线：你的财从哪里来，又最容易从哪里漏掉？',
    videos: Object.freeze({ entry: 'diyan-entry2.mp4?v=76', quiz: 'diyan-quiz.mp4?v=76', ritual: 'diyan-ritual.mp4?v=76', invite: 'diyan-invite.mp4?v=76' }),
  }),
  muse: Object.freeze({
    id: 'muse', name: '絮羽', title: '卡罗大师', focus: '塔罗推演',
    theme: 'muse', art: 'muse',
    /* 西方卡罗牌大师：梅子紫底 + 烛光金，弃旧缪斯藏青底。 */
    color: '#e6cf9a', bg: '#160d1a', shade: '22,13,26',
    prompt: '先把问题在心里问清楚，再去翻牌：牌面说的，和你盘里写的，是不是同一件事？',
    videos: Object.freeze({ entry: 'muse-entry.mp4?v=76', quiz: 'muse-quiz.mp4?v=76', ritual: 'muse-ritual.mp4?v=76', invite: 'muse-invite.mp4?v=76' }),
  }),
  xingluo: Object.freeze({
    id: 'xingluo', name: '星罗', title: '占星术', focus: '占星推演',
    theme: 'xingluo', art: 'xingluo',
    color: '#a9bcf5', bg: '#0a0d20', shade: '10,13,32',
    prompt: '先看星盘的骨架——太阳、月亮、上升落在哪里，你的底色就定在哪里。',
    videos: Object.freeze({ entry: 'xingluo-entry.mp4?v=76', quiz: 'xingluo-quiz.mp4?v=76', ritual: 'xingluo-ritual.mp4?v=76', invite: 'xingluo-invite.mp4?v=76' }),
  }),
});

export const GUIDE_KEYS = Object.freeze(Object.keys(GUIDE_V61));

/* 每位引路人的「对应元素」：首屏「进入命盘厅」共用一张精致箔纹贴图，
   再按 element / foilHue / 纹章区分六位，不再用六套异形轮廓。
   element 是元素意象，shape 是贴图里的徽记名，motif 是 2D 定妆里已过审的道具 / 场景符号，
   foilHue 把同一张金箔贴图旋到该人物的主题色。funnel.html 是 public/ 下的独立页面，
   保留同值小表；两处由 tools/test-guide-cta-shape.mjs 校验不漂移。 */
export const GUIDE_ELEMENTS = Object.freeze({
  moonfox: Object.freeze({ element: '月与水', shape: '月牙水波贴图', motif: '蓝色狐火 / 水面 / 狐面具', texture: 'art/cta-foil.webp', foilHue: '157deg' }),
  yuchen: Object.freeze({ element: '玉与木', shape: '玉圭贴图', motif: '绿玉凤冠 / 玉印 / 竹影回廊', texture: 'art/cta-foil.webp', foilHue: '26deg' }),
  xiyao: Object.freeze({ element: '桃花与红线', shape: '四瓣桃花贴图', motif: '红线 / 桃花簪 / 同心结', texture: 'art/cta-foil.webp', foilHue: '-71deg' }),
  diyan: Object.freeze({ element: '金与铜钱', shape: '元宝金锭贴图', motif: '金算盘 / 铜钱串 / 元宝', texture: 'art/cta-foil.webp', foilHue: '-8deg' }),
  muse: Object.freeze({ element: '羽与牌', shape: '斜角塔罗牌贴图', motif: '悬浮牌弧 / 羽毛', texture: 'art/cta-foil.webp', foilHue: '-3deg' }),
  xingluo: Object.freeze({ element: '星与黄道', shape: '星芒贴图', motif: '星图卷 / 黄道环 / 星座连线', texture: 'art/cta-foil.webp', foilHue: '180deg' }),
});

/* 人物主题配色：与 funnel.html 中 html[data-funnel-persona=...] 的变量逐值对齐。
   预告页用它生成 --ft-* 变量，让同一次问卷的漏斗页与预告页是同一个人物主题。 */
const PALETTES = Object.freeze({
  moonfox: Object.freeze({
    bg: '#090f17', shade: '9,15,23', accent: '#b9dbef', accentRgb: '185,219,239',
    accentSoft: '#d4e8f5', ink: '#edf6fa', inkDim: '#c2d4df',
    btnTop: '#315d7a', btnBottom: '#18374e',
  }),
  yuchen: Object.freeze({
    bg: '#10140e', shade: '16,20,14', accent: '#d3dda6', accentRgb: '211,221,166',
    accentSoft: '#e9efc8', ink: '#f5f5e9', inkDim: '#d7ddc2',
    btnTop: '#566440', btnBottom: '#313e26',
  }),
  xiyao: Object.freeze({
    bg: '#1b0d18', shade: '27,13,24', accent: '#ff9ac6', accentRgb: '255,154,198',
    accentSoft: '#ffd6e8', ink: '#fff3f8', inkDim: '#f2c8dc',
    btnTop: '#b05082', btnBottom: '#7a2f59',
  }),
  diyan: Object.freeze({
    bg: '#0e0a07', shade: '14,10,7', accent: '#dfb36c', accentRgb: '223,179,108',
    accentSoft: '#f0d6a6', ink: '#fbf3e4', inkDim: '#dcc9a6',
    btnTop: '#8a6428', btnBottom: '#4a3212',
  }),
  muse: Object.freeze({
    bg: '#160d1a', shade: '22,13,26', accent: '#e6cf9a', accentRgb: '230,207,154',
    accentSoft: '#f4e7c3', ink: '#faf3e0', inkDim: '#d8cbe0',
    btnTop: '#6b3f7a', btnBottom: '#43224f',
  }),
  xingluo: Object.freeze({
    bg: '#0a0d20', shade: '10,13,32', accent: '#a9bcf5', accentRgb: '169,188,245',
    accentSoft: '#d5defc', ink: '#f0f3ff', inkDim: '#c2cbe9',
    btnTop: '#46548c', btnBottom: '#2a3460',
  }),
});

export const FUNNEL_PERSONAS = Object.freeze({
  diyan: Object.freeze({
    key: 'diyan', name: '焱绒', title: '财富', focus: '财富推演', theme: 'diyan',
    palette: PALETTES.diyan, videos: GUIDE_V61.diyan.videos,
    poster: './art/diyan-lord.webp',
    video: videoFor('diyan', 'invite'),
    byline: '焱绒正在为你算财…',
  }),
  yuchen: Object.freeze({
    key: 'yuchen', name: '玉宸', title: '事业', focus: '事业推演', theme: 'yuchen',
    palette: PALETTES.yuchen, videos: GUIDE_V61.yuchen.videos,
    poster: './art/yuchen-lord.webp',
    video: videoFor('yuchen', 'invite'),
    byline: '玉宸正在为你看事业…',
  }),
  moonfox: Object.freeze({
    key: 'moonfox', name: '月白', title: '神秘人', focus: '全能推演', theme: 'moonfox',
    palette: PALETTES.moonfox, videos: GUIDE_V61.moonfox.videos,
    poster: './art/yuebai-lord.webp',
    video: videoFor('moonfox', 'invite'),
    byline: '月白正在为你翻册…',
  }),
  xiyao: Object.freeze({
    key: 'xiyao', name: '夕瑶', title: '姻缘', focus: '姻缘推演', theme: 'xingling',
    palette: PALETTES.xiyao, videos: GUIDE_V61.xiyao.videos,
    poster: './art/xiyao-lord.webp',
    video: videoFor('xiyao', 'invite'),
    byline: '夕瑶正在为你看姻缘…',
  }),
  xingluo: Object.freeze({
    key: 'xingluo', name: '星罗', title: '占星术', focus: '占星推演', theme: 'xingluo',
    palette: PALETTES.xingluo, videos: GUIDE_V61.xingluo.videos,
    poster: './art/xingluo-lord.webp',
    video: videoFor('xingluo', 'invite'),
    byline: '星罗正在为你观星…',
  }),
  muse: Object.freeze({
    key: 'muse', name: '絮羽', title: '卡罗大师', focus: '塔罗推演', theme: 'muse',
    palette: PALETTES.muse, videos: GUIDE_V61.muse.videos,
    poster: './art/muse-lord.webp',
    video: videoFor('muse', 'invite'),
    byline: '絮羽正在为你洗牌…',
  }),
});

export function personaFor(trait) {
  return FUNNEL_PERSONAS[trait] || FUNNEL_PERSONAS[DEFAULT_PERSONA];
}

/** Funnel persona id → HOME_THEMES id. */
export function themeForPersona(trait) {
  return personaFor(trait).theme;
}

/** Colors for the teaser overlay; values become --ft-* custom properties. */
export function paletteFor(trait) {
  return personaFor(trait).palette || PALETTES[DEFAULT_PERSONA];
}

/** Stage video for the teaser / report hero (entry|quiz|ritual|invite). */
export function videoFor(trait, stage = 'invite') {
  const videos = GUIDE_V61[trait]?.videos || GUIDE_V61[DEFAULT_PERSONA].videos;
  return `./art/${videos[stage] || videos.invite}${GUIDE_VIDEO_QUERY}`;
}
