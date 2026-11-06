/* 漏斗引路人 → 主应用角色的唯一映射表。
 *
 * funnel.html 是 public/ 下的独立页面（不能用 ES module 导入），所以它保留了
 * 一份很小的视频/立绘路径表 + 同值的 CSS 配色；但「名字、语气、对应哪个
 * HOME_THEMES 角色」这类跨页语义只在这里定义一次。新增引路人时，改这里 +
 * funnel.html 的素材表与配色即可。
 *
 * 注意 xiyao（夕瑶）在 HOME_THEMES 里没有同名条目：她的紫色星扇立绘就是
 * xingling（魅惑）那一套素材，因此映射到 xingling，而不是静默回退成焱绒。
 * 同理 yuebai（月白）是 moonfox 的素材，yuchen / diyan 与主题同名。
 */

export const DEFAULT_PERSONA = 'moonfox';

/* 人物主题配色：与 funnel.html 中 html[data-funnel-persona=...] 的变量逐值对齐。
   预告页用它生成 --ft-* 变量，让同一次问卷的漏斗页与预告页是同一个人物主题。 */
const PALETTES = Object.freeze({
  moonfox: Object.freeze({
    bg: '#090f17', shade: '9,15,23', accent: '#b9dbef', accentRgb: '185,219,239',
    accentSoft: '#d4e8f5', ink: '#edf6fa', inkDim: '#c2d4df',
    btnTop: '#315d7a', btnBottom: '#18374e',
  }),
  diyan: Object.freeze({
    bg: '#130b0b', shade: '19,11,11', accent: '#ec8278', accentRgb: '236,130,120',
    accentSoft: '#f5c5bc', ink: '#fff1ed', inkDim: '#dec3bb',
    btnTop: '#8a2015', btnBottom: '#5f130d',
  }),
  yuchen: Object.freeze({
    bg: '#10140e', shade: '16,20,14', accent: '#d9d3a9', accentRgb: '217,211,169',
    accentSoft: '#eee9cc', ink: '#f5f5e9', inkDim: '#d2d5bf',
    btnTop: '#566440', btnBottom: '#313e26',
  }),
  xiyao: Object.freeze({
    bg: '#100c18', shade: '16,12,24', accent: '#d4b7f2', accentRgb: '212,183,242',
    accentSoft: '#e8d8f7', ink: '#f8f1ff', inkDim: '#d8c8e4',
    btnTop: '#63477a', btnBottom: '#3e2a53',
  }),
  leizi: Object.freeze({
    bg: '#0a0e1a', shade: '10,14,26', accent: '#f2c14e', accentRgb: '242,193,78',
    accentSoft: '#fbe3a1', ink: '#fdf6e0', inkDim: '#ddd0ac',
    btnTop: '#a07d24', btnBottom: '#6b5316',
  }),
  muse: Object.freeze({
    bg: '#10182b', shade: '16,24,43', accent: '#e6cf9a', accentRgb: '230,207,154',
    accentSoft: '#f4e7c3', ink: '#faf3e0', inkDim: '#d8d0b8',
    btnTop: '#a68d4e', btnBottom: '#77622f',
  }),
});

export const FUNNEL_PERSONAS = Object.freeze({
  diyan: Object.freeze({
    key: 'diyan',
    name: '焱绒',
    theme: 'diyan',
    palette: PALETTES.diyan,
    poster: './art/diyan-lord.webp',
    video: './art/diyan-invite.mp4',
    lead: '先定根基，再看全局。',
    circle: '是焱绒先替你圈出来的',
    hooksTitle: '焱 绒 先 说 三 句',
    byline: '焱绒正在为你排盘…',
  }),
  yuchen: Object.freeze({
    key: 'yuchen',
    name: '玉宸',
    theme: 'yuchen',
    palette: PALETTES.yuchen,
    poster: './art/yuchen-lord.webp',
    video: './art/yuchen-invite.mp4',
    lead: '静下心，先看这一处。',
    circle: '是玉宸先替你圈出来的',
    hooksTitle: '玉 宸 先 说 三 句',
    byline: '玉宸正在为你排盘…',
  }),
  moonfox: Object.freeze({
    key: 'moonfox',
    name: '月白',
    theme: 'moonfox',
    palette: PALETTES.moonfox,
    poster: './art/yuebai-lord.webp',
    video: './art/yuebai-invite.mp4',
    lead: '别急，先看清这一处。',
    circle: '是月白先替你圈出来的',
    hooksTitle: '月 白 先 说 三 句',
    byline: '月白正在为你翻册…',
  }),
  xiyao: Object.freeze({
    key: 'xiyao',
    name: '夕瑶',
    theme: 'xingling',
    palette: PALETTES.xiyao,
    poster: './art/xiyao-lord.webp',
    video: './art/xiyao-invite.mp4',
    lead: '别急，先看你这一局。',
    circle: '是夕瑶先替你圈出来的',
    hooksTitle: '夕 瑶 先 说 三 句',
    byline: '夕瑶正在为你看盘…',
  }),
  leizi: Object.freeze({
    key: 'leizi',
    name: '雷兹',
    theme: 'leizi',
    palette: PALETTES.leizi,
    poster: './art/leizi-lord.webp',
    video: './art/leizi-invite.mp4?v=64',
    lead: '先看天势，再定落子。',
    circle: '是雷兹先替你圈出来的',
    hooksTitle: '雷 兹 先 说 三 句',
    byline: '雷兹正在为你排盘…',
  }),
  muse: Object.freeze({
    key: 'muse',
    name: '絮羽',
    theme: 'muse',
    palette: PALETTES.muse,
    poster: './art/muse-lord.webp',
    video: './art/muse-invite.mp4?v=69',
    lead: '让灵感先落在你身上。',
    circle: '是絮羽先替你圈出来的',
    hooksTitle: '絮 羽 先 说 三 句',
    byline: '絮羽正在为你展翼…',
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
