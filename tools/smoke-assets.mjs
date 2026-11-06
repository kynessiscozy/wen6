import puppeteer from 'puppeteer';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const pages = ['/index.html?sharecode=GLG66364RT', '/funnel.html?sharecode=GLG66364RT'];
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--no-sandbox'],
});
const report = [];

for (const route of pages) {
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });
  const bad = [];
  const missing = [];
  page.on('response', (res) => {
    const url = res.url();
    if (res.status() >= 400 && !url.includes('favicon')) bad.push(res.status() + ' ' + url);
  });
  page.on('requestfailed', (req) => missing.push(req.failure()?.errorText + ' ' + req.url()));
  await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 30000 }).catch((e) => bad.push('goto: ' + e.message));
  await new Promise((r) => setTimeout(r, 2500));
  const shot = route.includes('funnel') ? 'funnel' : 'home';
  await page.screenshot({ path: `/tmp/smoke-${shot}.png` });
  report.push({ route, bad, missing });
  await page.close();
}

await browser.close();
let fail = 0;
for (const r of report) {
  console.log(`\n== ${r.route} ==`);
  console.log('  >=400: ' + (r.bad.length ? r.bad.join('\n         ') : '无'));
  console.log('  请求失败: ' + (r.missing.length ? r.missing.join('\n         ') : '无'));
  fail += r.bad.length + r.missing.length;
}
console.log('\n总异常: ' + fail);
process.exit(fail ? 1 : 0);
