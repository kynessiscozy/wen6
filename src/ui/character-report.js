import { HOME_THEMES } from './home-theme.js';
import { buildGuidePerspective } from './guide-perspective.js';
import { guideRouteFor, runGuideAction } from './guide-route.js';
import { createGuideVideo, mountGuideVideo, syncGuideVideos } from './guide-video.js';

// The report uses the same page-lifetime choice as the home and calculation
// scene. No character identity or chart data is stored or sent anywhere here.
function selectedTheme() {
  const id = document.documentElement.dataset.homeTheme;
  return Object.prototype.hasOwnProperty.call(HOME_THEMES, id) ? [id, HOME_THEMES[id]] : null;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function imageFor(asset, className) {
  const image = element('img', className);
  image.src = asset.src;
  image.alt = '';
  image.width = asset.width;
  image.height = asset.height;
  image.decoding = 'async';
  return image;
}

function makePortrait(character, className, withBlink = false, useVideo = false) {
  const portrait = element('div', className);
  portrait.setAttribute('aria-hidden', 'true');
  // V6.1：报告头图改用同一位引路人的 invite 视频，poster 是定妆图；
  // 视频不可播时静态立绘接管，不叠任何表情静帧。
  if (useVideo && character.motion?.src) {
    const video = createGuideVideo(character.motion, 'result-character-portrait result-character-video');
    portrait.append(video);
    mountGuideVideo(video);
    return portrait;
  }
  portrait.append(imageFor(character.assets.portrait, 'result-character-portrait'));
  const blink = character.assets.blink;
  const original = character.assets.portrait;
  if (withBlink && blink?.src && blink.width === original.width && blink.height === original.height &&
      (!blink.forPortrait || blink.forPortrait === original.src)) {
    portrait.append(imageFor(blink, 'result-character-blink'));
  }
  return portrait;
}

function animateSpeaking(character, figure) {
  if (figure && figure.querySelector('video')) return; /* 视频头图不叠说话静帧 */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const speech = character.assets.speaking;
  const portrait = character.assets.portrait;
  if (!speech?.src || speech.width !== portrait.width || speech.height !== portrait.height ||
      (speech.forPortrait && speech.forPortrait !== portrait.src)) return;
  let image = figure.querySelector('.result-character-speaking');
  if (!image) {
    image = imageFor(speech, 'result-character-speaking');
    figure.append(image);
  }
  const play = () => {
    if (!figure.isConnected || document.getElementById('characterResultHint')?.hidden ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    figure.classList.remove('is-speaking');
    void figure.offsetWidth; // Restart on each interaction.
    figure.classList.add('is-speaking');
  };
  if (image.complete && image.naturalWidth > 0) play();
  else image.addEventListener('load', play, { once: true });
}

function revealHint(hint) {
  requestAnimationFrame(() => {
    if (hint.hidden || !hint.isConnected) return;
    const scroll = document.getElementById('p2Scroll');
    if (!scroll) return;
    const dock = document.getElementById('tabBar');
    const scrollBottom = scroll.getBoundingClientRect().bottom;
    const dockTop = dock?.getClientRects().length ? dock.getBoundingClientRect().top : scrollBottom;
    const distance = hint.getBoundingClientRect().bottom - Math.min(scrollBottom, dockTop) + 12;
    if (distance > 0) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      scroll.scrollBy({ top: distance, behavior: reduced ? 'auto' : 'smooth' });
    }
  });
}

function makeTheatre(container) {
  if (!container) return null;
  const theatre = element('div', 'result-western-theatre sys-western');
  theatre.append(container); // Keep the existing canvas, controls and 3D state.
  return theatre;
}

// Portrait visibility is a report preference, shared across the three western
// scenes and preserved when a trait is reselected without rebuilding the canvas.
let westernPortraitHidden = false;
let portraitInteractionInstalled = false;

function syncPortraitToggle(host) {
  host.classList.toggle('is-portrait-hidden', westernPortraitHidden);
  const button = host.querySelector('.result-portrait-toggle');
  if (!button) return;
  button.textContent = westernPortraitHidden ? '显示立绘' : '收起立绘';
  button.setAttribute('aria-label', westernPortraitHidden ? '显示人物立绘' : '收起人物立绘');
  button.setAttribute('aria-expanded', String(!westernPortraitHidden));
}

function setPortraitHidden(hidden) {
  westernPortraitHidden = hidden;
  document.querySelectorAll('#page2 .result-character-hero, #page2 .result-character-chapter').forEach(syncPortraitToggle);
  // 收起立绘时同步停掉人物视频，重新显示时再接着播。
  syncGuideVideos();
}

function addPortraitToggle(host, figure, section, toggleHost = host) {
  figure.id = `resultPortrait-${section}`;
  const button = element('button', 'result-portrait-toggle sys-western');
  button.type = 'button';
  button.setAttribute('aria-controls', figure.id);
  button.title = '也可以轻点人物；拖动仍可旋转场景';
  button.addEventListener('click', () => setPortraitHidden(!westernPortraitHidden));
  toggleHost.append(button);
  syncPortraitToggle(host);
}

function portraitHit(host, x, y) {
  const figure = host.querySelector('.result-character-figure, .result-chapter-figure');
  const image = figure?.querySelector('.result-character-portrait');
  if (!figure || !image || image.tagName === 'VIDEO' || !figure.getClientRects().length) return false;
  const rect = figure.getBoundingClientRect(), frame = host.getBoundingClientRect();
  const ratio = Number(image.getAttribute('width')) / Number(image.getAttribute('height'));
  if (!ratio) return false;
  // object-fit: contain, object-position: center top. Exclude transparent margins
  // and the clipped part of the figure rather than covering the whole canvas.
  const width = Math.min(rect.width, rect.height * ratio);
  const height = width / ratio, left = rect.left + (rect.width - width) / 2;
  return x >= Math.max(frame.left, left + width * .08) && x <= Math.min(frame.right, left + width * .92) &&
    y >= Math.max(frame.top, rect.top + height * .06) && y <= Math.min(frame.bottom, rect.top + height * .9);
}

function installPortraitInteraction() {
  if (portraitInteractionInstalled) return;
  portraitInteractionInstalled = true;
  const presses = new Map();
  const hostFor = target => target?.closest?.('.result-western-theatre .w3d-hero')
    ?.closest('.result-character-hero, .result-character-chapter');
  const canStart = event => {
    if (westernPortraitHidden || document.documentElement.dataset.systemMode !== 'western' ||
        event.target?.closest?.('button, a, input, select, textarea')) return null;
    const host = hostFor(event.target);
    return host && portraitHit(host, event.clientX, event.clientY) ? host : null;
  };
  if (window.PointerEvent) {
    // Do not intercept the actual pointer stream: an intentional drag starting
    // over the art still reaches the same 3D orbit and its pointer capture.
    document.addEventListener('pointerdown', event => {
      if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
      const host = canStart(event);
      if (host) presses.set(event.pointerId, { host, x: event.clientX, y: event.clientY, moved: false });
    }, true);
    document.addEventListener('pointermove', event => {
      const press = presses.get(event.pointerId);
      if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 9) press.moved = true;
    }, true);
    document.addEventListener('pointerup', event => {
      const press = presses.get(event.pointerId);
      presses.delete(event.pointerId);
      if (press && !press.moved && press.host.isConnected && !westernPortraitHidden &&
          portraitHit(press.host, event.clientX, event.clientY)) setPortraitHidden(true);
    }, true);
    document.addEventListener('pointercancel', event => presses.delete(event.pointerId), true);
  } else {
    // Older browsers without pointer events still get a simple tap/click path.
    document.addEventListener('click', event => { if (event.detail && canStart(event)) setPortraitHidden(true); }, true);
  }
}

function makeHero(id, theme, ctx, western, isDemo, overview, astro, perspective) {
  const hero = element('section', 'result-character-hero is-guide-companion-merged');
  hero.id = 'characterResultHero';
  hero.dataset.reportCharacter = id;
  hero.dataset.reportDemo = String(isDemo);
  hero.dataset.guideMerged = 'true';
  if (perspective?.dataset.guideRoute) hero.dataset.guideRoute = perspective.dataset.guideRoute;
  hero.style.setProperty('--result-character-accent', theme.accent);
  hero.setAttribute('aria-label', isDemo
    ? '示例：同行场景、真实速读与引路人阅读路线'
    : '同行场景、真实速读与引路人阅读路线');

  /* 视觉层：人物 / 场景 / 3D 星盘收进右侧独立画面，不再铺满整张卡。 */
  const visual = element('div', 'guide-companion-visual');
  const theatre = makeTheatre(astro);
  if (theatre) visual.append(theatre);
  const scene = element('div', 'result-character-scene');
  scene.setAttribute('aria-hidden', 'true');
  const picture = document.createElement('picture');
  const mobile = document.createElement('source');
  mobile.media = '(max-aspect-ratio: 4/5)';
  mobile.srcset = theme.backdrop.mobile;
  const background = element('img', 'result-character-backdrop');
  background.src = theme.backdrop.wide;
  background.alt = '';
  background.decoding = 'async';
  picture.append(mobile, background);
  const figure = makePortrait(theme.character, 'result-character-figure', true, true);
  scene.append(picture, figure);
  visual.append(scene);
  hero.append(visual);

  /* 内容层：身份一行 + 速读 / 星盘 + 引路人路线，全部在同一张卡里。 */
  const shell = element('div', 'guide-companion-shell');
  const head = element('header', 'guide-companion-head result-character-copy');
  const kicker = element('p', 'result-character-kicker');
  const displayName = theme.guide?.name || theme.character.name;
  const guideTitle = theme.guide?.title || '引路人';
  const mark = element('span', 'result-character-mark', displayName.slice(0, 1));
  mark.setAttribute('aria-hidden', 'true');
  kicker.append(mark, element('span', '', `${displayName} · ${guideTitle} · 同行`));
  if (isDemo) kicker.append(element('span', 'result-character-demo', '示例'));
  head.append(kicker);

  const controls = element('div', 'result-character-controls');
  const hint = element('div', 'result-character-hint');
  hint.id = 'characterResultHint';
  hint.hidden = true;
  hint.setAttribute('role', 'status');
  hint.setAttribute('aria-live', 'polite');
  const lead = theme.reportLead || '先从这里看起。';
  const dayMaster = [ctx?.dg, ctx?.dw].filter(Boolean).join('');
  const easternFacts = [dayMaster && `日主${dayMaster}`, ctx?.wx?.ys && `用神${ctx.wx.ys}`].filter(Boolean).join('、');
  const westernFacts = [western?.astro?.sun?.name && `太阳${western.astro.sun.name}`,
    western?.astro?.moon?.name && `月亮${western.astro.moon.name}`].filter(Boolean).join('、');
  const chart = isDemo ? '示例' : '这张';
  hint.append(element('p', 'sys-eastern', easternFacts
    ? `${lead}${easternFacts}是${chart}命盘的起点，可以接着看四柱和五行。`
    : `${lead}从${chart}命盘的四柱和五行开始读。`));
  hint.append(element('p', 'sys-western', westernFacts
    ? `${lead}${westernFacts}是${chart}星盘的起点，可以接着看它们的落点与相位。`
    : `${lead}从${chart}星盘的星体位置开始读。`));
  const hintButton = element('button', 'result-character-hint-button', '看一条提示');
  hintButton.type = 'button';
  hintButton.setAttribute('aria-controls', hint.id);
  hintButton.setAttribute('aria-expanded', 'false');
  hintButton.addEventListener('click', () => {
    const opening = hint.hidden;
    hint.hidden = !opening;
    hero.classList.toggle('has-hint', opening);
    hintButton.setAttribute('aria-expanded', String(opening));
    hintButton.textContent = opening ? '收起提示' : '看一条提示';
    if (opening) {
      animateSpeaking(theme.character, figure);
      revealHint(hint);
    }
  });
  controls.append(hintButton);
  head.append(controls, hint);
  shell.append(head);

  const body = element('div', 'guide-companion-body');
  const data = element('div', 'guide-companion-data');
  const westernHeading = element('div', 'result-character-reading sys-western');
  westernHeading.append(element('h1', 'result-character-title', isDemo ? '示例星盘' : '星盘一览'));
  westernHeading.append(element('p', 'result-character-description',
    '拖动星盘，探索星体位置。星盘按出生地时区及历史夏令时计算；夏令时切换时的重复或不存在的时间可能产生偏差。'));
  data.append(westernHeading);
  if (overview) {
    const eastern = element('div', 'result-character-overview sys-eastern');
    // Keep a structural heading for assistive technology without adding a
    // second visible title above the calculated values.
    eastern.append(element('h1', 'result-overview-heading', '命盘'), overview);
    data.append(eastern);
  }
  body.append(data);
  if (perspective) {
    perspective.classList.add('guide-companion-route');
    body.append(perspective);
  }
  shell.append(body);
  hero.append(shell);

  addPortraitToggle(hero, figure, 'ming', visual);
  return hero;
}

// Put each original quick-read card inside its companion scene. Moving the
// existing node preserves actual data, action handlers and folding state.
function makeChapter(id, theme, section, westernText, theatreContainer, overview, isDemo) {
  const aside = element('aside', 'result-character-chapter');
  aside.dataset.reportCharacter = id;
  aside.dataset.reportChapter = section;
  aside.style.setProperty('--result-character-accent', theme.accent);
  aside.setAttribute('aria-label', `${theme.guide?.name || theme.character.name}同行解读`);
  const theatre = makeTheatre(theatreContainer);
  if (theatre) aside.append(theatre);
  const figure = makePortrait(theme.character, 'result-chapter-figure');
  aside.append(figure);

  const copy = element('div', 'result-chapter-copy');
  copy.append(element('p', 'result-chapter-kicker', `${theme.guide?.name || theme.character.name} · 同行解读${isDemo ? ' · 示例' : ''}`));
  const reading = element('div', 'result-chapter-reading sys-western');
  reading.append(element('h2', '', westernText[0]), element('p', '', westernText[1]));
  copy.append(reading);
  aside.append(copy);
  if (overview) {
    const eastern = element('div', 'result-character-overview result-chapter-overview sys-eastern');
    eastern.append(overview);
    aside.append(eastern);
  }
  addPortraitToggle(aside, figure, section);
  return aside;
}

// A guide highlights existing chart facts and offers a distinct reflection.
// This is presentation only: neither the input nor calculated context is changed.
function makeGuidePerspective(id, ctx, western, isDemo) {
  const perspective = buildGuidePerspective(id, ctx, western);
  if (!perspective) return null;
  const route = guideRouteFor(id);
  const card = element('aside', 'guide-perspective');
  card.dataset.guidePerspective = id;
  card.dataset.guideRoute = route.key;
  card.dataset.guideMerged = 'true';
  card.setAttribute('aria-label', `${perspective.name}的同行与阅读路线`);
  card.append(element('p', 'guide-perspective-kicker', `阅读路线${isDemo ? ' · 示例' : ''}`));
  card.append(element('h2', 'guide-perspective-title', perspective.focus));
  const easternEl = element('p', 'guide-perspective-facts sys-eastern',
    perspective.eastern ? `命盘线索：${perspective.eastern}` : '命盘线索暂不可用，请查看完整报告。');
  const westernEl = element('p', 'guide-perspective-facts sys-western',
    perspective.western ? `星盘线索：${perspective.western}` : '星盘线索暂不可用，请查看完整报告。');
  // 西方系引路人（絮羽·塔罗、星罗·占星）以西方星象为主视角在先，东方命盘退为辅助；其余引路人维持命盘在先。
  if (id === 'xingluo' || id === 'muse') card.append(westernEl, easternEl);
  else card.append(easternEl, westernEl);
  card.append(element('p', 'guide-perspective-prompt', perspective.prompt));

  // 之前这张卡只有一句反思问题；现在四步都能真的跳卡片 / 开工具 / 预填追问。
  const routeNav = element('nav', 'guide-route');
  routeNav.setAttribute('aria-label', `${perspective.name}的阅读路线`);
  route.steps.forEach((step, i) => {
    const btn = element('button', 'guide-route-btn');
    btn.type = 'button';
    btn.dataset.guideStep = String(i);
    btn.dataset.guideKey = route.key;
    const copy = element('span', 'guide-route-copy');
    copy.append(element('b', '', step.label), element('small', '', step.detail));
    const go = element('span', 'guide-route-go', '›');
    go.setAttribute('aria-hidden', 'true');
    btn.append(element('span', 'guide-route-num', String(i + 1).padStart(2, '0')), copy, go);
    btn.addEventListener('click', () => runGuideAction(step.action));
    routeNav.append(btn);
  });
  card.append(element('h3', 'guide-route-title', `${perspective.name}会带你这样读`));
  card.append(routeNav);
  card.append(element('p', 'guide-perspective-note', '引路人只决定先看哪张卡、用哪个体系、打开哪款工具与追问方向，不改变排盘或评分。'));
  return card;
}

/** Rebuild the selected character's result surfaces after each actual calculation. */
export function mountCharacterReport({ ctx, western = {}, isDemo = false } = {}) {
  const selected = selectedTheme();
  if (!selected || !ctx) return;
  const [id, theme] = selected;
  const ming = document.getElementById('s-ming');
  const yun = document.getElementById('s-yun');
  const rel = document.getElementById('s-rel');
  if (!ming || !yun || !rel) return;

  // Build the new character surfaces around the existing overview and 3D
  // containers. They are moved, not recreated, so fold and orbit state survive.
  const overview = ming.querySelector('.sys-eastern .qr-card');
  const luckOverview = yun.querySelector('.sys-eastern .qr-card');
  const relationOverview = rel.querySelector('.sys-eastern .qr-card');
  const astro = ming.querySelector('#w3d-astro');
  const horo = yun.querySelector('#w3d-horo');
  const num = rel.querySelector('#w3d-num');
  const originals = [overview, luckOverview, relationOverview, astro, horo, num].filter(Boolean).map(node => ({
    node, parent: node.parentNode, next: node.nextSibling,
  }));
  let hero, luckChapter, relationChapter, perspective;
  try {
    perspective = makeGuidePerspective(id, ctx, western, isDemo);
    hero = makeHero(id, theme, ctx, western, isDemo, overview, astro, perspective);
    luckChapter = makeChapter(id, theme, 'yun',
      [isDemo ? '示例星象' : '星象一览', '拖动星象，探索十二星座示意。'], horo, luckOverview, isDemo);
    relationChapter = makeChapter(id, theme, 'rel',
      [isDemo ? '示例灵数' : '灵数一览', '从主命数出发，探索数字线索。'], num, relationOverview, isDemo);
  } catch (error) {
    // A bad optional character definition must never remove calculated report
    // data or a working canvas. The previous surfaces are still connected here.
    originals.forEach(({ node, parent, next }) => {
      if (parent) parent.insertBefore(node, next?.parentNode === parent ? next : null);
    });
    throw error;
  }
  [ming, yun, rel].forEach(section => section.querySelector(':scope > .result-character-hero, :scope > .result-character-chapter')?.remove());
  ming.querySelectorAll('.guide-perspective').forEach(node => node.remove());
  ming.prepend(hero);
  yun.prepend(luckChapter);
  rel.prepend(relationChapter);
  installPortraitInteraction();
}
