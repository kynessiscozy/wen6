import puppeteer from 'puppeteer-core';
const exe = '/home/hatch/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome';
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.evaluateOnNewDocument(() => {
  localStorage.setItem('wen_funnel_v1', JSON.stringify({
    v: 1, applied: 0, trait: 'xiyao', who: 'self', bd: '1995-06-15', timeStr: '10:30',
    cityName: '', gen: 'female', name: '小测', concerns: ['姻缘'], ts: Date.now(),
  }));
});
await page.goto('http://localhost:8815/index.html', { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForSelector('#s-ming .guide-perspective', { timeout: 45000 });
await new Promise(r => setTimeout(r, 1000));
const cta = await page.$('#funnelTeaser .ft-cta');
if (cta) { await cta.click(); await new Promise(r => setTimeout(r, 1500)); }
await page.evaluate(() => {
  const cands = [...document.querySelectorAll('button, .tab-item, [role="tab"]')]
    .filter(x => x.textContent.trim() === '命盘' && x.getBoundingClientRect().top > 650);
  cands[0]?.click();
});
await new Promise(r => setTimeout(r, 1600));
const dump = await page.evaluate(() => {
  const scene = document.querySelector('#characterResultHero .result-character-scene');
  const art = scene?.querySelector('.result-character-heroart');
  const fig = scene?.querySelector('.result-character-figure');
  return {
    sceneClass: scene?.className,
    artSrc: art?.getAttribute('src'), artShown: art ? getComputedStyle(art).display !== 'none' : false,
    figShown: fig ? getComputedStyle(fig).display !== 'none' : null,
  };
});
console.log(JSON.stringify(dump), 'ERRORS', errors.slice(0, 2));
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: 'shot-heroart.png' });
await browser.close();
