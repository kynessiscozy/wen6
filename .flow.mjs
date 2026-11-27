import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
const exe=await chromium.executablePath();
const browser=await puppeteer.launch({executablePath:exe,args:chromium.args.concat(['--no-sandbox','--disable-gpu','--use-gl=swiftshader']),headless:'shell'});
const page=await browser.newPage();
await page.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
page.on('pageerror',e=>console.log('[pageerror]',String(e).slice(0,400)));
page.on('console',m=>{const t=m.text();if(m.type()==='error'||/western3d|Uncaught/i.test(t))console.log('[console]',m.type(),t.slice(0,300));});
await page.setRequestInterception(true);
page.on('request',r=>{
  const u=r.url();
  if(u.endsWith('/__zhfont/noto.css')){
    r.respond({status:200,contentType:'text/css',body:readFileSync('/home/user/wen6/node_modules/.zhfont/noto.css','utf8')});
  } else if(u.includes('/__zhfont/files/')){
    const f=u.split('/__zhfont/files/')[1].split('?')[0];
    r.respond({status:200,contentType:'font/woff2',body:readFileSync('/home/user/wen6/node_modules/.zhfont/files/'+f)});
  } else r.continue();
});
await page.evaluateOnNewDocument(()=>{
  document.addEventListener('DOMContentLoaded',()=>{const l=document.createElement('link');l.rel='stylesheet';l.href='/__zhfont/noto.css';document.head.append(l);});
});
await page.goto('http://localhost:5173/index.html',{waitUntil:'domcontentloaded'});
await page.evaluate(()=>{document.documentElement.style.setProperty('--sf',"'Noto Sans SC',system-ui,sans-serif");});
await page.addStyleTag({content:"html,body,*{font-family:'Noto Sans SC',system-ui,sans-serif !important}"});
await new Promise(r=>setTimeout(r,2500));
await page.waitForFunction(()=>window.__wenEntryIntent!==undefined,{timeout:60000});
await page.waitForFunction(()=>typeof window.TJOpenForm==='function',{timeout:90000});
await page.evaluate(()=>window.TJOpenForm());
await page.waitForFunction(()=>!!document.querySelector('#formModal.open'),{timeout:30000});
await page.waitForSelector('#formModal.open',{timeout:40000});
await page.evaluate(()=>{document.getElementById('bDate').value='1992-11-20';document.getElementById('bTime').value='11:30';});
await page.click('.character-form-submit');
await page.waitForFunction(()=>document.querySelector('#calculationOverlay')?.dataset.calculationState==='ready',{timeout:90000});
await page.click('#calculationContinue');
await page.waitForFunction(()=>document.body.classList.contains('report-active'),{timeout:60000});
await new Promise(r=>setTimeout(r,1200));
const info=await page.evaluate(()=>({
  view:document.body.dataset.resultView,
  activeSec:document.querySelector('.sec.active')?.id,
  dock:[...document.querySelectorAll('.tab-item')].map(t=>t.dataset.sec+':'+t.classList.contains('active')),
  eastGroupHidden:document.getElementById('eastModeGroup').hidden,
  sections:[...document.querySelectorAll('.sec')].map(s=>s.id),
  hero:!!document.getElementById('characterResultHero'),
  heroParent:document.getElementById('characterResultHero')?.parentElement?.id||null,
  astroTabs:document.querySelectorAll('.astro-tab').length,
  lib:document.querySelectorAll('.report-lib-item').length,
}));
console.log(JSON.stringify(info,null,1));
await page.screenshot({path:'.shot-ming.png',fullPage:false});
await page.click('.tab-item[data-sec="s-astro"]');
await new Promise(r=>setTimeout(r,1500));
console.log('astro',await page.evaluate(()=>({view:document.body.dataset.resultView,active:document.querySelector('.sec.active')?.id,pane:document.querySelector('.astro-pane.active')?.dataset.astro,canvas:!!document.querySelector('#s-astro canvas'),w3d:window._w3d?.STATE?.activeKey})));
await page.screenshot({path:'.shot-astro.png'});
await page.click('.tab-item[data-sec="s-report"]');
await new Promise(r=>setTimeout(r,700));
await page.screenshot({path:'.shot-report.png'});
await page.evaluate(()=>document.getElementById('aiFab').click());
await new Promise(r=>setTimeout(r,900));
console.log('wen',await page.evaluate(()=>({wenPage:document.body.classList.contains('wen-page'),open:document.getElementById('aiSheet').classList.contains('open'),modal:document.getElementById('aiSheet').getAttribute('aria-modal'),inert:document.getElementById('aiSheet').inert,box:document.getElementById('aiSheet').getBoundingClientRect().toJSON&&{h:Math.round(document.getElementById('aiSheet').getBoundingClientRect().height),w:Math.round(document.getElementById('aiSheet').getBoundingClientRect().width)}})));
await page.screenshot({path:'.shot-wen.png'});
await browser.close();
