import assert from 'node:assert/strict';
import { jqInstant, solarTermDutyDay } from '../src/engines/calendar.js';
import { getWesternProfile } from '../src/engines/western-context.js';
import { calcWesternChart } from '../src/engines/western.js';
import { CD } from '../src/engines/cities.js';
import { smartAnswer, installEvolveHooks } from '../src/ai/smart-answer.js';
import { renderZiWeiCard, _qrCard, renderQuickRead } from '../src/render/report.js';
import { ABOUT } from '../src/product-copy.js';
import { readFileSync } from 'node:fs';
import { TJ } from '../src/state/tj.js';
import { renderSmartAnswer } from '../src/render/ai.js';

const term = jqInstant(1990, 2).getTime();
assert.equal(solarTermDutyDay(term), 1);
assert.equal(solarTermDutyDay(term + 86400000), 2);
assert.notEqual(solarTermDutyDay(term - 1), 1);
for (const [city, y, m, d, h, offset] of [[CD.newyork,1995,6,15,9,-4],[CD.london,1995,1,15,9,0],[CD.shanghai,1990,7,1,9,9]]) {
  const profile = getWesternProfile({input:{by:y,bm:m,bd:d,timeStr:'09:00'},city});
  assert.deepEqual(profile.chart, calcWesternChart(y,m,d,h,0,city.o,city.a,offset));
}
const personal = {kind:'personal',title:'local',sections:[],links:[],related:[]};
let called = false;
installEvolveHooks({matchEvolved: () => { called = true; return personal; }});
assert.equal(smartAnswer('一件完全陌生的事情', {}), personal);
assert.equal(called, true);
assert.doesNotMatch(renderSmartAnswer({kind:'personal', title:'<img src=x>', sections:[{title:'x', content:'<img src=x>'}], links:[], related:[]}), /<img/);
assert.match(renderZiWeiCard({ps:[],approximate:true}), /近似算法/);
assert.doesNotMatch(renderZiWeiCard({ps:[],approximate:false}), /近似算法/);
assert.equal(TJ.findLiuNian([{y:new Date().getFullYear()}]).y, new Date().getFullYear());

const store = new Map([['tj_ai_provider','deepseek'],['tj_ai_apikey','unknown-legacy']]);
globalThis.localStorage = {getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
const {getApiKey} = await import('../src/ui/ai-settings.js');
const {setProvider} = await import('../src/ai/index.js');
assert.equal(getApiKey(), '');
store.set('tj_ai_apikey_deepseek','deep-secret');
store.set('tj_ai_apikey_openrouter','open-secret');
assert.equal(getApiKey(),'deep-secret');
setProvider('openrouter');
assert.equal(getApiKey(),'open-secret');

const nativeTimeout = globalThis.setTimeout;
globalThis.setTimeout = (fn, ms, ...args) => nativeTimeout(fn, ms === 22000 ? 20 : ms, ...args);
for (const provider of ['deepseek','openrouter']) {
  let cancelled = false;
  globalThis.fetch = async () => new Response(new ReadableStream({
    start(c) { c.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"开头"}}]}\n\n')); },
    cancel() { cancelled = true; }
  }), {status:200});
  const {streamAskAnswer} = await import(`../src/ai/${provider}.js`);
  await assert.rejects(streamAskAnswer({apiKey:'test',systemPrompt:'',chartContext:'',question:'test',models:['test']}));
  assert.ok(cancelled, `${provider} 流超时必须取消读取`);
}
globalThis.setTimeout = nativeTimeout;
// P0-1：速读项必须能追溯到具体依据字段，且保留原有 data-report-value 契约
const qr = _qrCard('测试速读', [
  {l:'日主', v:'甲木', f:'day-master', e:{card:'bazi', field:'day-master'}},
  {l:'强弱', v:'身旺', e:{card:'bazi', field:'strength'}},
  {l:'用神', v:'水', f:'useful-element', e:{card:'wuxing', field:'useful-element'}},
], '摘要', [], 'ming');
assert.match(qr, /<button type="button" class="qr-item qr-item--evidence"/);
assert.match(qr, /TJTraceEvidence\('s-ming','bazi','day-master'\)/);
assert.match(qr, /aria-label="查看日主的计算依据"/);
assert.match(qr, /data-report-value="day-master"/);
assert.match(qr, /TJTraceEvidence\('s-ming','wuxing','useful-element'\)/);
assert.match(qr, /aria-label="查看用神的计算依据"/);
assert.doesNotMatch(qr, /TJTraceEvidence\('s-ming','',/);

const ctx = {dg:'甲', wx:{dw:'木', st:true, ys:'水'}, pa:['正官格'], ss:{},
  cDy:{g:'乙', z:'亥', as:30, ae:40}, cDySS:'正印', cLn:{g:'丙', z:'午'}, cLnSS:'食神', cs:70, ws:80, gen:'male', shensha:[]};
for (const [sec, expected] of [
  ['ming', ["'s-ming','bazi','day-master'", "'s-ming','bazi','strength'", "'s-ming','wuxing','useful-element'", "'s-ming','bazi','pattern'"]],
  ['yun', ["'s-yun','trend','year'", "'s-yun','trend','year-god'", "'s-yun','trend','career'", "'s-yun','trend','wealth'"]],
  ['rel', ["'s-rel','intimacy','partner-star'", "'s-rel','intimacy','peach'", "'s-rel','intimacy','relation-mode'", "'s-rel','intimacy','year-god'"]],
]) {
  const html = renderQuickRead(sec, ctx);
  for (const anchor of expected) assert.ok(html.includes(anchor), `${sec} 速读项缺少依据锚点 ${anchor}`);
  assert.equal((html.match(/qr-item--evidence/g) || []).length, 4, `${sec} 应有 4 个可追溯速读项`);
}

// P0-3：口径页与漏斗文案
const provenance = ABOUT.sections.find(s => s.title === '计算口径与版本');
assert.ok(provenance, '关于页应包含计算口径与版本');
assert.match(provenance.paragraphs.join(' '), /真太阳时/);
assert.match(provenance.paragraphs.join(' '), /AI 不参与排盘/);
const funnel = readFileSync(new URL('../public/funnel.html', import.meta.url), 'utf8');
assert.doesNotMatch(funnel, /比别家|最准|最灵|独家|领先|更准|更细/);
assert.match(funnel, /用于真太阳时校正，让时柱更贴近出生地/);
const baseCss = readFileSync(new URL('../src/styles/00-base.css', import.meta.url), 'utf8');
assert.match(baseCss, /button\.qr-item\.qr-item--evidence:focus-visible/);
assert.match(baseCss, /\.tj-flash\{/);

console.log('✓ 修复回归：时区、司权、个人知识、紫微提示、密钥隔离、流超时、速读依据与口径文案');
