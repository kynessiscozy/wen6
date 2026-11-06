import puppeteer from 'puppeteer';

const BASE = 'http://127.0.0.1:5199/tools/preview-teaser.html';
const OUT = process.env.TEMP || '.';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--no-sandbox', '--proxy-server=direct://', '--proxy-bypass-list=*',
    '--autoplay-policy=no-user-gesture-required'],
});

const report = [];
function log(...a) { report.push(a.join(' ')); }

async function open(trait, viewport) {
  const page = await browser.newPage();
  await page.setViewport({ ...viewport, deviceScaleFactor: 2, isMobile: viewport.isMobile || false, hasTouch: true });
  // 只允许本地 dev server，任何外网请求（含云模型）一律拦掉，绝不计费
  await page.setRequestInterception(true);
  const blocked = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.startsWith('http://127.0.0.1:5199') || url.startsWith('data:') || url.startsWith('blob:')) return req.continue();
    blocked.push(url);
    req.abort();
  });
  page.on('console', (m) => { if (m.type() === 'error') log('  [console.error]', m.text().slice(0, 160)); });
  await page.goto(`${BASE}?trait=${trait}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#funnelTeaser .ft-cta', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1800));
  return { page, blocked };
}

function hex(rgb) { return rgb; }

// ---------- 手机竖屏 ----------
{
  const { page, blocked } = await open('diyan', { width: 390, height: 844, isMobile: true });
  const info = await page.evaluate(() => {
    const q = (s) => document.querySelector('#funnelTeaser ' + s);
    const cs = (s, p) => getComputedStyle(q(s))[p];
    const root = document.getElementById('funnelTeaser');
    const hero = q('.ft-hero');
    const video = q('.ft-video');
    const scroller = q('.ft-scroll');
    return {
      rootHeight: root.getBoundingClientRect().height,
      viewportH: innerHeight,
      heroHeight: Math.round(hero.getBoundingClientRect().height),
      scrollHeight: scroller.scrollHeight,
      clientHeight: scroller.clientHeight,
      videoRect: (() => { const r = video.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })(),
      videoState: { vw: video.videoWidth, vh: video.videoHeight, t: Math.round(video.currentTime * 100) / 100, paused: video.paused, ready: video.classList.contains('is-ready'), opacity: getComputedStyle(video).opacity },
      openText: q('.ft-open').textContent.trim().slice(0, 60),
      openSize: cs('.ft-open', 'fontSize'),
      openColor: cs('.ft-open', 'color'),
      pillars: [...document.querySelectorAll('#funnelTeaser .pl')].map(n => n.textContent.replace(/\s+/g, ' ').trim()),
      selfPillar: !!q('.pl.is-self'),
      hooksCount: document.querySelectorAll('#funnelTeaser .ft-hook').length,
      tocCount: document.querySelectorAll('#funnelTeaser .ft-toc li').length,
      barVisible: getComputedStyle(q('.ft-bar')).opacity,
      ctaText: q('.ft-cta').textContent.trim(),
      progress: getComputedStyle(q('.ft-progress')).height,
      heroCopyBottom: Math.round(q('.ft-hero-copy').getBoundingClientRect().bottom),
      hintBottom: Math.round(q('.ft-hint').getBoundingClientRect().bottom),
      barTop: Math.round(q('.ft-bar').getBoundingClientRect().top),
      overflowX: document.documentElement.scrollWidth > innerWidth,
      persona: root.dataset.persona,
    };
  });
  log('MOBILE 390x844', JSON.stringify(info, null, 1));
  log('BLOCKED_EXTERNAL', blocked.length, blocked.slice(0, 3).join(' | '));
  await page.screenshot({ path: `${OUT}/_p_teaser_hero.png` });

  // 下滑到内容层
  await page.evaluate(() => { const s = document.querySelector('#funnelTeaser .ft-scroll'); s.scrollTop = s.clientHeight * 0.98; });
  await new Promise(r => setTimeout(r, 900));
  const sheet = await page.evaluate(() => {
    const q = (s) => document.querySelector('#funnelTeaser ' + s);
    const revealed = [...document.querySelectorAll('#funnelTeaser .ft-reveal')].map(n => getComputedStyle(n).opacity);
    return { revealed, progress: q('.ft-progress i').style.transform, sheetTop: Math.round(q('.ft-sheet').getBoundingClientRect().top) };
  });
  log('SHEET', JSON.stringify(sheet));
  await page.screenshot({ path: `${OUT}/_p_teaser_sheet.png` });

  // 底部
  await page.evaluate(() => { const s = document.querySelector('#funnelTeaser .ft-scroll'); s.scrollTop = s.scrollHeight; });
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: `${OUT}/_p_teaser_end.png` });

  // Esc 关闭
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 400));
  const closed = await page.evaluate(() => ({
    gone: !document.getElementById('funnelTeaser'),
    teasered: JSON.parse(localStorage.getItem('wen_funnel_v1') || '{}').teasered,
    bodyOverflow: document.body.style.overflow,
  }));
  log('DISMISS', JSON.stringify(closed));
  await page.close();
}

// ---------- 桌面宽屏 ----------
{
  const { page } = await open('yuebai', { width: 1280, height: 800 });
  const info = await page.evaluate(() => {
    const v = document.querySelector('#funnelTeaser .ft-video');
    const r = v.getBoundingClientRect();
    return { videoFit: getComputedStyle(v).objectFit, backdropOpacity: getComputedStyle(document.querySelector('#funnelTeaser .ft-backdrop')).opacity, rect: [Math.round(r.width), Math.round(r.height)], copyMax: getComputedStyle(document.querySelector('#funnelTeaser .ft-open')).maxWidth };
  });
  log('DESKTOP 1280x800', JSON.stringify(info));
  await page.screenshot({ path: `${OUT}/_p_teaser_desktop.png` });
  await page.close();
}

// ---------- 减少动效 ----------
{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setRequestInterception(true);
  page.on('request', (req) => req.url().startsWith('http://127.0.0.1:5199') ? req.continue() : req.abort());
  await page.goto(`${BASE}?trait=muse`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#funnelTeaser .ft-cta', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 600));
  const info = await page.evaluate(() => {
    const v = document.querySelector('#funnelTeaser .ft-video');
    return {
      videoExists: !!v,
      videoSrc: v ? v.getAttribute('src') : 'removed',
      preload: v ? v.preload : '-',
      posterVisible: v ? getComputedStyle(v).opacity === '1' : false,
      backdropOpacity: getComputedStyle(document.querySelector('#funnelTeaser .ft-backdrop')).opacity,
      revealed: [...document.querySelectorAll('#funnelTeaser .ft-reveal')].filter(n => getComputedStyle(n).opacity === '1').length,
      totalReveal: document.querySelectorAll('#funnelTeaser .ft-reveal').length,
    };
  });
  log('REDUCED_MOTION', JSON.stringify(info));
  await page.screenshot({ path: `${OUT}/_p_teaser_reduced.png` });
  await page.close();
}

console.log(report.join('\n'));
await browser.close();
