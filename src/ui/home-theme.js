import { syncBrowserThemeColor } from './theme-color.js';
import { themeForPersona } from './entry-personas.js';
import { JIANGJIANG } from '../character/wenwen.js';
import {
  MOON_FOX, YANRONG, JADE_EMPRESS, QINGLAN, XIYAO,
  LUYE, SUYAN, RONGRONG, ZHIYA, TAROT_MASTER, XINGLUO,
} from '../character/characters.data.js';

// One registry supplies the home scene and report styling for every
// character. The funnel is the only entry: the guide chosen there decides
// the character here; there is no in-app character or trait picker.
// New characters need only add another entry; choices remain page-local.
export const HOME_THEMES = Object.freeze({
  wenwen: Object.freeze({
    accent: '#ecc1ae',
    reportLead: '别急，我们慢慢看。',
    character: JIANGJIANG,
    backdrop: Object.freeze({ wide: './art/sacred-study-wide.webp', mobile: './art/sacred-study-mobile.webp' }),
  }),
  moonfox: Object.freeze({
    accent: '#b9dbef',
    guide: Object.freeze({ name: '月白', title: '神秘人', focus: '全能推演' }),
    reportLead: '东西两面都看全，再下判断。',
    character: MOON_FOX,
    backdrop: Object.freeze({ wide: './art/moon-fox-study-wide.webp', mobile: './art/moon-fox-study-mobile.webp' }),
  }),
  muse: Object.freeze({
    accent: '#e6cf9a',
    guide: Object.freeze({ name: '絮羽', title: '卡罗大师', focus: '塔罗推演' }),
    reportLead: '问题先放心里，让牌说话。',
    character: TAROT_MASTER,
    backdrop: Object.freeze({ wide: './art/muse-hall-wide.webp', mobile: './art/muse-hall-mobile.webp' }),
  }),
  diyan: Object.freeze({
    accent: '#dfb36c',
    guide: Object.freeze({ name: '焱绒', title: '财富', focus: '财富推演' }),
    reportLead: '先看财路，再定进退。',
    character: YANRONG,
    backdrop: Object.freeze({ wide: './art/earthfire-hall-wide.webp', mobile: './art/earthfire-hall-mobile.webp' }),
  }),
  yuchen: Object.freeze({
    accent: '#d3dda6',
    guide: Object.freeze({ name: '玉宸', title: '事业', focus: '事业推演' }),
    reportLead: '事业这一局，先看势。',
    character: JADE_EMPRESS,
    backdrop: Object.freeze({ wide: './art/yuchen-hall-wide.webp', mobile: './art/yuchen-hall-mobile.webp' }),
  }),
  qinglan: Object.freeze({
    accent: '#a9d8d0',
    reportLead: '不妨换个角度。',
    character: QINGLAN,
    backdrop: Object.freeze({ wide: './art/qinglan-room-wide.webp', mobile: './art/qinglan-room-mobile.webp' }),
  }),
  xingling: Object.freeze({
    accent: '#ff9ac6',
    guide: Object.freeze({ name: '夕瑶', title: '姻缘', focus: '姻缘推演' }),
    reportLead: '姻缘这一线，先看心。',
    character: XIYAO,
    backdrop: Object.freeze({ wide: './art/xingling-room-wide.webp', mobile: './art/xingling-room-mobile.webp' }),
  }),
  xingluo: Object.freeze({
    accent: '#a9bcf5',
    guide: Object.freeze({ name: '星罗', title: '占星术', focus: '占星推演' }),
    reportLead: '星盘之上，自有答案。',
    character: XINGLUO,
    backdrop: Object.freeze({ wide: './art/xingluo-observatory-wide.webp', mobile: './art/xingluo-observatory-mobile.webp' }),
  }),
  luye: Object.freeze({
    accent: '#e8c595',
    reportLead: '发现一个有趣的起点。',
    character: LUYE,
    backdrop: Object.freeze({ wide: './art/luye-room-wide.webp', mobile: './art/luye-room-mobile.webp' }),
  }),
  suyan: Object.freeze({
    accent: '#e8b4c1',
    reportLead: '先把重点抓出来。',
    character: SUYAN,
    backdrop: Object.freeze({ wide: './art/suyan-room-wide.webp', mobile: './art/suyan-room-mobile.webp' }),
  }),
  rongrong: Object.freeze({
    accent: '#f0ad78',
    reportLead: '把复杂的事拆小，也给自己一点暖意。',
    character: RONGRONG,
    backdrop: Object.freeze({ wide: './art/rongrong-room-wide.webp', mobile: './art/rongrong-room-mobile.webp' }),
  }),
  zhiya: Object.freeze({
    accent: '#f0dc90',
    reportLead: '带着好奇出发，答案会慢慢展开。',
    character: ZHIYA,
    backdrop: Object.freeze({ wide: './art/zhiya-room-wide.webp', mobile: './art/zhiya-room-mobile.webp' }),
  }),
});

/** The public name of a theme: the guide's name, else the character's. */
export function themeDisplayName(theme) {
  return theme?.guide?.name || theme?.character?.name || '';
}

// Derive readable UI shades from the registry's single character color. The
// illustrated swatch stays unchanged; a darker solid is used behind white text.
function applyAccent(color) {
  const match = /^#([0-9a-f]{6})$/i.exec(color || '');
  if (!match) return;
  const rgb = [0, 2, 4].map(i => parseInt(match[1].slice(i, i + 2), 16));
  const [r, g, b] = rgb.map(value => value / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const delta = max - min, lightness = (max + min) / 2;
  let hue = 0;
  if (delta) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
  const h = Math.round(hue);
  const s = Math.max(45, Math.min(75, Math.round(saturation * 100)));
  // Bright yellow and green swatches can be too luminous even at 34% HSL.
  // Preserve their hue and saturation, but darken the solid until white text
  // meets WCAG AA. Keep the chart's RGB exactly in step with that solid.
  const channelsAt = l => [0, 8, 4].map(n => {
    const a = s / 100 * Math.min(l, 1 - l);
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  });
  const whiteContrast = channels => {
    const luminance = channels.map(value => {
      const v = value / 255;
      return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    return 1.05 / (luminance + .05);
  };
  let accentLightness = 34;
  while (accentLightness > 20 && whiteContrast(channelsAt(accentLightness / 100)) < 4.6) accentLightness -= .5;
  const root = document.documentElement;
  root.style.setProperty('--trait-color', color);
  root.style.setProperty('--trait-h', String(h));
  root.style.setProperty('--trait-s', `${s}%`);
  root.style.setProperty('--trait-accent-l', `${accentLightness}%`);
  root.style.setProperty('--trait-graph-light', channelsAt(accentLightness / 100).join(','));
  root.style.setProperty('--trait-graph-dark', rgb.join(','));
  syncBrowserThemeColor();
}

/** Apply the funnel-chosen guide's theme to the home page. */
export function initHomeTheme({ setHomeCharacter = () => {} } = {}) {
  const home = document.getElementById('page1');
  if (!home) return null;

  const source = home.querySelector('.character-backdrop source');
  const backdrop = home.querySelector('.character-backdrop img');
  const portrait = home.querySelector('[data-character-asset="portrait"]');
  const imageNotice = document.getElementById('homeLoadingStatus');
  const imageError = '部分场景暂时无法加载，请检查网络后刷新重试。';
  let selected = '';

  function guardImage(image, expectedSource) {
    if (!image) return () => {};
    // Late load/error events from the previous character cannot reveal stale art.
    const request = image.__homeSceneRequest = (image.__homeSceneRequest || 0) + 1;
    image.__homeSceneCleanup?.();
    image.classList.add('is-scene-image-loading');
    const cleanup = () => {
      image.removeEventListener('load', reveal);
      image.removeEventListener('error', fail);
      if (image.__homeSceneCleanup === cleanup) delete image.__homeSceneCleanup;
    };
    image.__homeSceneCleanup = cleanup;
    const reveal = () => {
      if (image.__homeSceneRequest !== request) { cleanup(); return; }
      const expected = new URL(expectedSource(), document.baseURI).href;
      if (image.complete && image.naturalWidth > 0 && image.currentSrc === expected) {
        image.classList.remove('is-scene-image-loading');
        cleanup();
      }
    };
    const fail = () => {
      if (image.__homeSceneRequest !== request) { cleanup(); return; }
      // A queued error from the replaced source must not unmask the new one
      // while it is still pending (or has already succeeded).
      if (!image.complete || image.naturalWidth > 0) return;
      image.classList.remove('is-scene-image-loading');
      cleanup();
      if (imageNotice) imageNotice.textContent = imageError;
    };
    image.addEventListener('load', reveal);
    image.addEventListener('error', fail);
    return reveal;
  }

  function apply(id) {
    const previous = selected;
    const theme = HOME_THEMES[id];
    if (imageNotice?.textContent === imageError) imageNotice.textContent = '';
    const checkPortrait = guardImage(portrait, () => theme.character.assets.portrait.src);
    const checkBackdrop = guardImage(backdrop, () => window.matchMedia('(max-aspect-ratio: 4/5)').matches ? theme.backdrop.mobile : theme.backdrop.wide);
    selected = id;
    document.documentElement.dataset.homeTheme = id;
    const summary = document.getElementById('homeTraitSummary');
    if (summary) {
      document.getElementById('homeTraitLabel').textContent = themeDisplayName(theme);
      document.getElementById('homeTraitDescription').textContent =
        theme.guide ? `${theme.guide.title} · ${theme.guide.focus}` : theme.reportLead;
      summary.hidden = false;
    }
    applyAccent(theme.accent);
    if (source) source.srcset = theme.backdrop.mobile;
    if (backdrop) backdrop.src = theme.backdrop.wide;
    setHomeCharacter(theme.character);
    checkPortrait();
    checkBackdrop();
    document.documentElement.dataset.homeReady = 'true';
    if (previous && previous !== id) window.dispatchEvent(new CustomEvent('tj:theme-change', { detail: { id, previous } }));
  }

  /* 漏斗为唯一入口：引路人在 funnel.html 选定，主应用直接沿用其主题，
     不再有应用内换人界面。保留返回 false 的 open() 契约，旧版集成不会报错。 */
  function openPicker() {
    return false;
  }

  /* 漏斗问卷选定的引路人直接决定主应用角色；未知/缺失时回退月白。
     映射表在 entry-personas.js，避免「夕瑶」等没有同名主题的人物静默回退。
     普通访客（无问卷数据）也使用同一个默认角色。 */
  let selectedPersona = '';
  let loadingProfile = false;
  let payload = null;
  try { selectedPersona = localStorage.getItem('wen_funnel_persona') || ''; } catch (_) {}
  try { loadingProfile = !!localStorage.getItem('wen_load_profile_v1'); } catch (_) {}
  try { payload = JSON.parse(localStorage.getItem('wen_funnel_v1') || 'null'); } catch (_) {}
  // A profile selected from the funnel uses the current guide rather than a
  // previous questionnaire. A corrupt payload must not erase that choice.
  const requestedTrait = loadingProfile && selectedPersona ? selectedPersona :
    (payload?.trait || selectedPersona);
  const requestedTheme = Object.prototype.hasOwnProperty.call(HOME_THEMES, requestedTrait)
    ? requestedTrait : themeForPersona(requestedTrait);
  const directTheme = Object.prototype.hasOwnProperty.call(HOME_THEMES, requestedTheme)
    ? requestedTheme : 'moonfox';

  // The funnel already chose the guide. Apply identity synchronously so the
  // first calculation cannot use another guide; guardImage keeps unready
  // art hidden as it loads in the background.
  try { apply(directTheme); }
  catch (error) {
    console.warn('[home] 角色素材初始化失败', error);
    if (imageNotice) imageNotice.textContent = imageError;
  }
  return { getSelected: () => selected, open: openPicker };
}
