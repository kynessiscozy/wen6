import '../character-report.css';
import { HOME_THEMES } from './home-theme.js';
import { buildGuidePerspective } from './guide-perspective.js';
import { guideRouteFor, runGuideAction } from './guide-route.js';
import { syncGuideVideos } from './guide-video.js';
import { getWesternProfile } from '../engines/western-context.js';

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

function makePortrait(character, className, withBlink = false) {
  const portrait = element('div', className);
  portrait.setAttribute('aria-hidden', 'true');
  // 报告头图用静态立绘（用户 2026-11-12 定）：竖版视频放进头图版式不搭，
  // 视频只留在漏斗入口 / 问卷 / 仪式等原生场景。
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

/* 报告页摘要只显示「锚点值」，完整读数留在各自分区。 */
function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/* 日主由天干 + 五行两个值拼成，所以这里接受数组；单值也可直接用。 */
function eastFact(value, extra) {
  const main = (Array.isArray(value) ? value.map(text).join('') : text(value)).trim();
  if (!main) return '';
  const tail = text(extra);
  return tail ? `${main}（${tail}）` : main;
}

function makeFactGrid(pairs, side) {
  const grid = element('div', `report-fact-grid report-fact-grid--${side}`);
  pairs.forEach(([label, value, key]) => {
    const cell = element('div', 'report-fact');
    cell.append(element('span', '', label));
    const b = element('b', '', value);
    // 既有测试与跳转契约依赖 data-report-value="day-master" 这类英文键。
    if (key) b.dataset.reportValue = key;
    cell.append(b);
    grid.append(cell);
  });
  return grid;
}

/* 摘要卡点击走和其它出口完全相同的路径，避免两套跳转逻辑。 */
function bindReportJumps(root) {
  root.querySelectorAll('[data-report-jump]').forEach(card => {
    card.addEventListener('click', event => {
      event.preventDefault();
      const sec = card.dataset.reportJump;
      if (typeof window.TJJumpReport === 'function') window.TJJumpReport(sec);
    });
  });
}

function readAstroTrio(ctx) {
  try {
    const profile = getWesternProfile(ctx);
    if (!profile?.chart) return null;
    return { sun: profile.chart.sun, moon: profile.chart.moon, asc: profile.chart.asc };
  } catch (error) {
    return null;
  }
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

function makeHero(id, theme, ctx, western, isDemo, perspective, knownLabels = new Set()) {
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

  /* 视觉层：人物 / 场景收进右侧独立画面，不再铺满整张卡。
     3D 星盘留在星相页作为主角，这里只取它算出的三核数值，
     避免为了报告头图把星相页的中心场景搬空。 */
  const visual = element('div', 'guide-companion-visual');
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
  const figure = makePortrait(theme.character, 'result-character-figure', true);
  scene.append(picture, figure);
  // 动作版完整插画（2026-11-13 用户定）：东方视图下整幅压场呈现，不再抠图合成；
  // 西方视图仍是 3D 星盘 + 定妆立绘（CSS 按体系切换）。星罗待补，补齐后自动生效。
  const heroAsset = theme.character.assets.hero;
  if (heroAsset?.src) {
    const heroArt = element('img', 'result-character-heroart');
    heroArt.src = heroAsset.src;
    heroArt.alt = '';
    heroArt.decoding = 'async';
    scene.classList.add('has-heroart');
    scene.append(heroArt);
  }
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
  /* 提示只说「怎么读」，不重复页面上已经列出的数值与路线。 */
  const hintTrio = readAstroTrio(ctx) || {};
  const eastAnchor = [text(ctx?.dg) + text(ctx?.dw)].filter(Boolean).join('');
  const hintParts = [];
  if (eastAnchor) hintParts.push(`命盘从日主 ${eastAnchor} 起读，先看四柱与用神。`);
  if (hintTrio.sun?.name) hintParts.push(`星盘从太阳 ${hintTrio.sun.name} 起读，先看它与月亮、上升的关系。`);
  hint.append(element('p', '', isDemo
    ? '这是示例报告，数值与文案仅用于体验。'
    : (hintParts.join(' ') || '先选一处最在意的事，再顺着下面的路线往下读。')));
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

  /* 报告页只做「一眼看全 + 带路」，不复制命理 / 星相页的内容。
     东西各一栏：只放这一页不重复的锚点数值，点进去才是完整读数。 */
  const summary = element('div', 'report-summary');

  const easternValues = [
    ['日主', eastFact([ctx?.dg, ctx?.dw]), 'day-master'],
    ['用神', text(ctx?.wx?.ys), 'useful-element'],
    ['当前大运', eastFact(ctx?.cDy ? [ctx.cDy.g, ctx.cDy.z].filter(Boolean).join('') : '', ctx?.cDy?.ys), 'dayun'],
    ['流年', eastFact(ctx?.cLn ? [ctx.cLn.g, ctx.cLn.z].filter(Boolean).join('') : ''), 'liunian'],
  ].filter(([, value]) => value);
  const easternCard = element('a', 'report-summary-card sys-eastern');
  easternCard.href = '#';
  easternCard.dataset.reportJump = 's-ming';
  easternCard.append(
    element('b', 'report-summary-kicker', '东方命理'),
    makeFactGrid(easternValues, 'east'),
    element('span', 'report-summary-go', '看完整的命盘、运势与关系 ›'),
  );
  summary.append(easternCard);

  const trio = readAstroTrio(ctx) || {};
  const westernValues = [
    ['太阳', trio.sun?.name, 'sun'], ['月亮', trio.moon?.name, 'moon'], ['上升', trio.asc?.name, 'asc'],
  ].filter(([, value]) => value);
  if (westernValues.length) {
    const westernCard = element('a', 'report-summary-card sys-western');
    westernCard.href = '#';
    westernCard.dataset.reportJump = 's-astro';
    westernCard.append(
      element('b', 'report-summary-kicker', '西方星相'),
      makeFactGrid(westernValues, 'west'),
      element('span', 'report-summary-go', '看星盘、运程与灵数 ›'),
    );
    summary.append(westernCard);
  }
  data.append(summary);

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

// A guide highlights existing chart facts and offers a distinct reflection.
// This is presentation only: neither the input nor calculated context is changed.
// 速读瓷砖已经展示过的事实标签，不在线索行里重复出现。
const dropKnownFacts = (facts, knownLabels) => facts
  ? facts.split(' · ').filter(pair => !knownLabels.has(pair.split(' ')[0])).join(' · ')
  : facts;

function makeGuidePerspective(id, ctx, western, isDemo, knownLabels = new Set()) {
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
  // 与命盘速读同卡合并：瓷砖里已有的事实（日主 / 用神等）从线索行剔除；
  // 某侧事实被瓷砖全覆盖时整行省略，不显示「暂不可用」。
  const easternText = dropKnownFacts(perspective.eastern, knownLabels);
  const westernText = dropKnownFacts(perspective.western, knownLabels);
  const easternEl = perspective.eastern
    ? (easternText ? element('p', 'guide-perspective-facts sys-eastern', `命盘线索：${easternText}`) : null)
    : element('p', 'guide-perspective-facts sys-eastern', '命盘线索暂不可用，请查看完整报告。');
  const westernEl = perspective.western
    ? (westernText ? element('p', 'guide-perspective-facts sys-western', `星盘线索：${westernText}`) : null)
    : element('p', 'guide-perspective-facts sys-western', '星盘线索暂不可用，请查看完整报告。');
  // 西方系引路人（絮羽·塔罗、星罗·占星）以西方星象为主视角在先，东方命盘退为辅助；其余引路人维持命盘在先。
  const factsInOrder = id === 'xingluo' || id === 'muse' ? [westernEl, easternEl] : [easternEl, westernEl];
  factsInOrder.filter(Boolean).forEach(el => card.append(el));
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
  // The merged companion card now lives on the 报告 page; it still borrows the
  // real 命盘速读 and the 3D 星盘 from 命理 / 星相, so those sections must exist.
  const lead = document.getElementById('reportLead');
  if (!ming || !yun || !rel) return;

  // Build the new character surfaces around the existing overview and 3D
  // containers. They are moved, not recreated, so fold and orbit state survive.
  // 报告页只放一份「导览」：合并卡。速读卡留在命理 / 运势 / 关系各自的分区里，
  // 报告页用真实数值摘要指过去，避免同一批数字在一页里说两遍。
  const overview = ming.querySelector('.sys-eastern .qr-card');
  // 速读卡的标签就是报告页要排除的重复项（日主 / 强弱 / 用神 / 格局）。
  const tileLabels = new Set([...(overview?.querySelectorAll('.qr-item .qr-l') || [])]
    .map(el => el.textContent.trim()).filter(Boolean));
  const perspective = makeGuidePerspective(id, ctx, western, isDemo, tileLabels);
  const hero = makeHero(id, theme, ctx, western, isDemo, null, perspective, tileLabels);

  // 只回滚本页自己的旧卡，绝不移动其它分区的节点。
  [ming, yun, rel, lead].forEach(section =>
    section?.querySelector(':scope > .result-character-hero, :scope > .result-character-chapter')?.remove());
  ming.querySelectorAll('.guide-perspective').forEach(node => node.remove());
  (lead || ming).prepend(hero);
  bindReportJumps(hero);
  installPortraitInteraction();
}
