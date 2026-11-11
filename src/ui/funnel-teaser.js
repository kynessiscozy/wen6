/* 漏斗预告页（P2）：从 funnel.html 进来的访客，推演完成后先看一页
   「引路人预告」——真排盘 + 日主基调 + 三个引擎事实钩子 + 报告目录，
   再一键进入完整报告。全程免费，无任何锁定与收费元素。
   所有数字与干支都取自 window._ctx 的真实推演结果，不另造解读。

   版式：整屏视频做底（沉浸层），首屏只放引路人与一句开场白，
   向下滑才展开四柱、三句话与报告目录——把「先看人、再看盘」
   的顺序做出来，而不是把视频当缩略图塞在卡片堆顶上。

   仅由当前问卷交接调用，且要求 applied && !teasered；预告页本身
   是可退出的模态：可关闭、可跳过、支持 Esc 与焦点约束，并隔离背景交互。 */

import { focusSafely } from './focus.js';
import { personaFor, paletteFor } from './entry-personas.js';
import { getApiKey } from './ai-settings.js';
import { generateTeaserCopy } from './teaser-copy.js';
import { guideRouteFor, buildGuideHooks, runGuideAction } from './guide-route.js';

const DAY_MASTER_TONE = {
  甲: '甲木参天，认准方向便不轻易回头，做事讲原则、有担当。',
  乙: '乙木如藤，看似柔和，韧性极强，擅长在缝隙里找到自己的路。',
  丙: '丙火如日，热情直接，藏不住心事，感染力是你的天赋。',
  丁: '丁火如灯，外静内明，心思细、悟性高，认定的人和事会守很久。',
  戊: '戊土如山，稳重可靠，答应的事一定做到，是身边人的定心丸。',
  己: '己土如园，包容务实，手巧心细，擅长把日子过出秩序感。',
  庚: '庚金如刃，快人快语，执行力强，越是难事越能显出锋芒。',
  辛: '辛金如玉，精致敏锐，审美与直觉俱佳，对品质有自己的坚持。',
  壬: '壬水如江，脑子转得快，格局大，不喜欢被小事困住手脚。',
  癸: '癸水如雨，温润聪慧，洞察人心，常常一句话点中要害。',
};

/* 姓名、报告标题等来自档案 / DOM 的文本统一转义；钩子里的 <b> 是
   guide-route.js 自己拼好的受控标记，不在这里二次转义。 */
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[ch]));

const STYLE_ID = 'funnel-teaser-style';
const OVERLAY_ID = 'funnelTeaser';

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  /* 所有颜色都取自 --ft-*，由本次问卷的引路人在显示时注入；
     这里的默认值是月白主题，保证变量未注入时页面依然完整可读。 */
  style.textContent = `
  #${OVERLAY_ID}{
    --ft-bg:#090f17; --ft-shade:9,15,23; --ft-accent:#b9dbef; --ft-accent-rgb:185,219,239;
    --ft-accent-soft:#d4e8f5; --ft-ink:#edf6fa; --ft-ink-dim:#c2d4df;
    --ft-btn-top:#315d7a; --ft-btn-bottom:#18374e;
    position:fixed;inset:0;z-index:1200;height:100vh;height:100dvh;overflow:hidden;
    background:var(--ft-bg);color:var(--ft-ink);
    font-family:"Noto Serif SC","Songti SC",serif;
    -webkit-tap-highlight-color:transparent;}
  #${OVERLAY_ID},#${OVERLAY_ID} *{box-sizing:border-box;}

  /* ---------- 沉浸层：整屏视频 ---------- */
  #${OVERLAY_ID} .ft-stage{position:absolute;inset:0;overflow:hidden;background:#04070b;}
  #${OVERLAY_ID} .ft-backdrop{position:absolute;inset:-10%;background-position:center;background-size:cover;
    filter:blur(42px) saturate(.85) brightness(.7);transform:scale(1.08);}
  #${OVERLAY_ID} .ft-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
    object-position:center 30%;opacity:0;transition:opacity 1.1s ease;
    filter:brightness(.9) saturate(1.02);will-change:transform;}
  #${OVERLAY_ID} .ft-video.is-ready{opacity:1;animation:ft-drift 26s ease-in-out infinite alternate;}
  #${OVERLAY_ID} .ft-scrim{position:absolute;inset:0;pointer-events:none;
    background:
      linear-gradient(180deg,rgba(var(--ft-shade),.82) 0%,rgba(var(--ft-shade),.18) 20%,rgba(var(--ft-shade),.04) 40%,rgba(var(--ft-shade),.72) 66%,rgba(var(--ft-shade),.96) 88%,var(--ft-bg) 100%),
      radial-gradient(130% 58% at 50% 4%,rgba(var(--ft-accent-rgb),.18),transparent 62%),
      radial-gradient(120% 100% at 50% 50%,transparent 55%,rgba(0,0,0,.45) 100%);}
  @keyframes ft-drift{from{transform:scale(1.02) translate3d(0,0,0)}to{transform:scale(1.1) translate3d(0,-1.2%,0)}}

  /* ---------- 滚动容器 ---------- */
  #${OVERLAY_ID} .ft-scroll{position:relative;z-index:2;height:100%;overflow-y:auto;overflow-x:hidden;
    overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
  #${OVERLAY_ID} .ft-scroll::-webkit-scrollbar{display:none;}

  /* ---------- 进度线 ---------- */
  #${OVERLAY_ID} .ft-progress{position:absolute;top:0;left:0;right:0;height:2px;z-index:8;
    background:rgba(255,255,255,.07);pointer-events:none;}
  #${OVERLAY_ID} .ft-progress i{display:block;height:100%;transform:scaleX(0);transform-origin:0 50%;
    background:linear-gradient(90deg,var(--ft-accent),var(--ft-accent-soft));transition:transform .12s linear;}

  /* ---------- 关闭 ---------- */
  #${OVERLAY_ID} .ft-close{position:absolute;z-index:9;top:calc(12px + env(safe-area-inset-top,0px));right:14px;
    width:36px;height:36px;padding:0;border-radius:50%;cursor:pointer;
    border:1px solid rgba(255,255,255,.26);background:rgba(var(--ft-shade),.62);
    backdrop-filter:blur(10px) saturate(130%);-webkit-backdrop-filter:blur(10px) saturate(130%);
    color:var(--ft-ink);font:inherit;font-size:20px;line-height:1;
    display:grid;place-items:center;box-shadow:0 4px 16px rgba(0,0,0,.35);transition:background .2s ease,transform .2s ease;}
  #${OVERLAY_ID} .ft-close:active{transform:scale(.92);}

  /* ---------- 首屏：人 + 一句话 ---------- */
  #${OVERLAY_ID} .ft-hero{position:relative;min-height:100%;min-height:100dvh;
    display:flex;flex-direction:column;justify-content:space-between;
    padding:calc(22px + env(safe-area-inset-top,0px)) 20px calc(96px + env(safe-area-inset-bottom,0px));}
  /* 开场白无论落在多亮的人物立绘上都要读得清：底部再加一层局部压暗 */
  #${OVERLAY_ID} .ft-hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:54%;
    pointer-events:none;background:linear-gradient(180deg,transparent,rgba(var(--ft-shade),.58) 46%,rgba(var(--ft-shade),.94) 100%);}
  #${OVERLAY_ID} .ft-who,#${OVERLAY_ID} .ft-hero-copy{position:relative;z-index:1;}
  #${OVERLAY_ID} .ft-who{display:flex;align-items:center;gap:11px;padding-right:52px;}
  #${OVERLAY_ID} .ft-who img{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#000;
    border:1px solid rgba(var(--ft-accent-rgb),.55);box-shadow:0 6px 18px rgba(0,0,0,.45);}
  #${OVERLAY_ID} .ft-kicker{font-size:11.5px;letter-spacing:.32em;color:var(--ft-accent-soft);
    text-shadow:0 1px 10px rgba(0,0,0,.6);}
  #${OVERLAY_ID} .ft-name{font-size:15px;letter-spacing:.14em;margin-top:3px;
    color:var(--ft-ink);text-shadow:0 1px 10px rgba(0,0,0,.6);}

  #${OVERLAY_ID} .ft-hero-copy{padding:0 2px 6px;}
  #${OVERLAY_ID} .ft-open{margin:0;font-size:clamp(17px,4.7vw,21px);line-height:2;letter-spacing:.02em;
    color:#fff;text-shadow:0 2px 18px rgba(0,0,0,.75),0 0 1px rgba(0,0,0,.9);}
  #${OVERLAY_ID} .ft-open .hl{color:var(--ft-accent);}
  #${OVERLAY_ID} .ft-open.is-streaming::after{content:"▍";margin-left:2px;color:var(--ft-accent);
    animation:ft-caret 1s steps(1) infinite;}
  @keyframes ft-caret{50%{opacity:0}}

  #${OVERLAY_ID} .ft-hint{display:flex;align-items:center;gap:8px;margin:20px 2px 0;
    font-size:11.5px;letter-spacing:.34em;color:rgba(var(--ft-accent-rgb),.85);}
  #${OVERLAY_ID} .ft-hint i{display:block;width:1px;height:26px;
    background:linear-gradient(180deg,var(--ft-accent),transparent);animation:ft-drop 1.9s ease-in-out infinite;}
  @keyframes ft-drop{0%,100%{opacity:.25;transform:translateY(-3px)}50%{opacity:1;transform:translateY(3px)}}

  /* ---------- 下滑内容层 ---------- */
  #${OVERLAY_ID} .ft-sheet{position:relative;padding:28px 18px calc(104px + env(safe-area-inset-bottom,0px));
    background:linear-gradient(180deg,rgba(var(--ft-shade),.62) 0%,rgba(var(--ft-shade),.9) 14%,rgba(var(--ft-shade),.97) 40%,var(--ft-bg) 100%);}
  #${OVERLAY_ID} .ft-sheet::before{content:"";position:absolute;top:-1px;left:22px;right:22px;height:1px;
    background:linear-gradient(90deg,transparent,rgba(var(--ft-accent-rgb),.45),transparent);}
  #${OVERLAY_ID} .ft-card{margin:0 auto;max-width:620px;
    background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02));
    border:1px solid rgba(var(--ft-accent-rgb),.2);border-radius:18px;padding:18px 17px;
    box-shadow:0 18px 44px rgba(0,0,0,.32);}
  #${OVERLAY_ID} .ft-card + .ft-card{margin-top:14px;}
  #${OVERLAY_ID} .ft-card h3{display:flex;align-items:center;gap:9px;margin:0 0 14px;
    font-size:11.5px;font-weight:600;letter-spacing:.3em;color:var(--ft-accent-soft);}
  #${OVERLAY_ID} .ft-card h3::before{content:"";width:3px;height:12px;border-radius:2px;
    background:var(--ft-accent);box-shadow:0 0 10px rgba(var(--ft-accent-rgb),.7);}

  #${OVERLAY_ID} .ft-pillars{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;}
  #${OVERLAY_ID} .pl{position:relative;text-align:center;padding:12px 4px 10px;border-radius:12px;
    background:rgba(var(--ft-accent-rgb),.055);border:1px solid rgba(var(--ft-accent-rgb),.12);}
  #${OVERLAY_ID} .pl.is-self{background:rgba(var(--ft-accent-rgb),.13);border-color:rgba(var(--ft-accent-rgb),.5);
    box-shadow:0 0 0 1px rgba(var(--ft-accent-rgb),.18),0 8px 22px rgba(var(--ft-accent-rgb),.14);}
  #${OVERLAY_ID} .pl b{display:block;font-size:23px;line-height:1.15;letter-spacing:.04em;color:#fff;}
  #${OVERLAY_ID} .pl i{display:block;font-style:normal;font-size:23px;line-height:1.15;letter-spacing:.04em;
    color:var(--ft-accent);}
  #${OVERLAY_ID} .pl span{display:block;margin-top:7px;font-size:10.5px;letter-spacing:.24em;color:var(--ft-ink-dim);}

  #${OVERLAY_ID} .ft-rows{margin:16px 0 0;padding:14px 0 0;border-top:1px dashed rgba(var(--ft-accent-rgb),.2);}
  #${OVERLAY_ID} .ft-rows > div{display:flex;gap:14px;align-items:baseline;padding:5px 0;}
  #${OVERLAY_ID} .ft-rows dt{flex:0 0 62px;font-size:11.5px;letter-spacing:.2em;color:var(--ft-ink-dim);}
  #${OVERLAY_ID} .ft-rows dd{margin:0;font-size:14.5px;line-height:1.7;color:var(--ft-ink);}

  #${OVERLAY_ID} .ft-hooks{list-style:none;margin:0;padding:0;counter-reset:ft-hook;}
  #${OVERLAY_ID} .ft-hook{position:relative;padding:0 0 0 34px;font-size:15px;line-height:1.95;}
  #${OVERLAY_ID} .ft-hook + .ft-hook{margin-top:15px;padding-top:15px;border-top:1px dashed rgba(var(--ft-accent-rgb),.16);}
  #${OVERLAY_ID} .ft-hook::before{counter-increment:ft-hook;content:counter(ft-hook,decimal-leading-zero);
    position:absolute;left:0;top:1px;font-size:11.5px;letter-spacing:.06em;color:var(--ft-accent);
    opacity:.72;}
  #${OVERLAY_ID} .ft-hook b{color:var(--ft-accent);}

  #${OVERLAY_ID} .ft-toc{list-style:none;margin:0;padding:0;}
  #${OVERLAY_ID} .ft-toc li{border-top:1px solid rgba(255,255,255,.07);color:var(--ft-ink);}
  #${OVERLAY_ID} .ft-toc li:first-child{border-top:0;}
  #${OVERLAY_ID} .ft-toc-btn{display:grid;grid-template-columns:52px 1fr auto;gap:10px;align-items:baseline;
    width:100%;padding:11px 0;appearance:none;border:0;background:none;color:inherit;font:inherit;
    font-size:14.5px;line-height:1.65;text-align:left;cursor:pointer;}
  #${OVERLAY_ID} .ft-toc-btn:hover{color:var(--ft-accent-soft);}
  #${OVERLAY_ID} .ft-toc-btn:active{opacity:.72;}
  #${OVERLAY_ID} .ft-toc-btn:focus-visible{outline:2px solid var(--ft-accent-soft);outline-offset:2px;}
  #${OVERLAY_ID} .ft-toc .tk{font-size:11px;letter-spacing:.16em;color:var(--ft-accent-soft);}
  #${OVERLAY_ID} .ft-toc .tv{font-size:12px;color:var(--ft-accent);white-space:nowrap;}
  #${OVERLAY_ID} .ft-toc-first{display:inline-block;margin-left:8px;padding:1px 7px;border-radius:999px;
    font-style:normal;font-size:10px;letter-spacing:.12em;color:var(--ft-bg);background:var(--ft-accent);vertical-align:1px;}

  /* ---------- 引路人阅读路线：四步都真的可点 ---------- */
  #${OVERLAY_ID} .ft-route-intro{margin:0 0 14px;font-size:13px;line-height:1.8;color:var(--ft-ink-dim);}
  #${OVERLAY_ID} .ft-route{list-style:none;margin:0;padding:0;display:grid;gap:9px;}
  #${OVERLAY_ID} .ft-route-btn{display:grid;grid-template-columns:26px 1fr 16px;gap:10px;align-items:center;
    width:100%;padding:11px 12px;appearance:none;text-align:left;cursor:pointer;
    border:1px solid rgba(var(--ft-accent-rgb),.22);border-radius:12px;
    background:rgba(var(--ft-accent-rgb),.055);color:var(--ft-ink);font:inherit;
    transition:border-color .2s ease,background .2s ease,transform .16s ease;}
  #${OVERLAY_ID} .ft-route-btn:hover{border-color:rgba(var(--ft-accent-rgb),.55);background:rgba(var(--ft-accent-rgb),.1);}
  #${OVERLAY_ID} .ft-route-btn:active{transform:scale(.99);}
  #${OVERLAY_ID} .ft-route-btn:focus-visible{outline:2px solid var(--ft-accent-soft);outline-offset:2px;}
  #${OVERLAY_ID} .ft-route-num{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;
    font-size:11px;color:var(--ft-bg);background:var(--ft-accent);}
  #${OVERLAY_ID} .ft-route-btn b{display:block;font-size:14px;letter-spacing:.06em;font-weight:600;}
  #${OVERLAY_ID} .ft-route-btn small{display:block;margin-top:3px;font-size:11.5px;line-height:1.6;color:var(--ft-ink-dim);}
  #${OVERLAY_ID} .ft-route-go{font-size:18px;color:var(--ft-accent);}

  #${OVERLAY_ID} .ft-note{margin:12px 2px 0;font-size:12.5px;line-height:1.8;color:var(--ft-ink-dim);}
  #${OVERLAY_ID} .ft-skip{display:block;width:100%;margin:18px 0 0;padding:12px;appearance:none;
    border:0;background:none;color:var(--ft-ink-dim);font:inherit;font-size:13px;
    letter-spacing:.1em;text-decoration:underline;text-underline-offset:4px;cursor:pointer;}
  #${OVERLAY_ID} .ft-free{margin:6px 0 0;text-align:center;font-size:11.5px;letter-spacing:.14em;color:var(--ft-ink-dim);}

  /* 下滑后才出现的内容：轻微上浮 */
  #${OVERLAY_ID} .ft-reveal{opacity:0;transform:translateY(16px);
    transition:opacity .62s cubic-bezier(.22,.9,.24,1),transform .62s cubic-bezier(.22,.9,.24,1);}
  #${OVERLAY_ID} .ft-reveal.in{opacity:1;transform:none;}

  /* ---------- 底部常驻操作条 ---------- */
  #${OVERLAY_ID} .ft-bar{position:absolute;z-index:7;left:0;right:0;bottom:0;
    padding:14px 16px calc(14px + env(safe-area-inset-bottom,0px));
    background:linear-gradient(180deg,rgba(var(--ft-shade),0),rgba(var(--ft-shade),.55) 34%,rgba(var(--ft-shade),.92) 100%);
    animation:ft-bar-in .7s cubic-bezier(.22,.9,.24,1) .35s both;}
  @keyframes ft-bar-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  #${OVERLAY_ID} .ft-cta{display:block;width:100%;max-width:620px;margin:0 auto;appearance:none;cursor:pointer;
    padding:15px;border-radius:999px;font:inherit;font-size:16px;letter-spacing:.24em;
    border:1px solid rgba(var(--ft-accent-rgb),.55);
    background:linear-gradient(180deg,var(--ft-btn-top),var(--ft-btn-bottom));color:#fff;
    box-shadow:0 12px 30px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.16);
    transition:transform .16s ease,box-shadow .2s ease;}
  #${OVERLAY_ID} .ft-cta:active{transform:scale(.98);}
  #${OVERLAY_ID} .ft-close:focus-visible,#${OVERLAY_ID} .ft-cta:focus-visible,#${OVERLAY_ID} .ft-skip:focus-visible{outline:2px solid var(--ft-accent-soft);outline-offset:3px;}

  /* 宽屏：竖屏视频不硬拉满，居中成一块银幕，两侧用同帧虚化铺底 */
  @media (min-aspect-ratio:1/1){
    #${OVERLAY_ID} .ft-backdrop{opacity:1;}
    #${OVERLAY_ID} .ft-video{object-fit:contain;}
    #${OVERLAY_ID} .ft-scrim{background:
      linear-gradient(180deg,rgba(var(--ft-shade),.86) 0%,rgba(var(--ft-shade),.2) 22%,rgba(var(--ft-shade),.06) 44%,rgba(var(--ft-shade),.6) 74%,var(--ft-bg) 100%),
      radial-gradient(120% 60% at 50% 0%,rgba(var(--ft-accent-rgb),.16),transparent 62%);}
    #${OVERLAY_ID} .ft-hero{padding-left:max(22px,6vw);padding-right:max(22px,6vw);}
    #${OVERLAY_ID} .ft-open{max-width:760px;}
  }

  @media (prefers-reduced-motion:reduce){
    #${OVERLAY_ID} .ft-video.is-ready{animation:none;}
    #${OVERLAY_ID} .ft-hint i{animation:none;}
    #${OVERLAY_ID} .ft-bar{animation:none;}
    #${OVERLAY_ID} .ft-reveal{opacity:1;transform:none;transition:none;}
    #${OVERLAY_ID} .ft-open.is-streaming::after{animation:none;}
  }
  `;
  document.head.appendChild(style);
}

function readPayload() {
  try {
    const p = JSON.parse(localStorage.getItem('wen_funnel_v1') || 'null');
    return p && p.applied && !p.teasered ? p : null;
  } catch (e) { return null; }
}

function markTeasered(p) {
  try { p.teasered = 1; localStorage.setItem('wen_funnel_v1', JSON.stringify(p)); } catch (e) {}
}

function bumpStat(key) {
  try {
    const s = JSON.parse(localStorage.getItem('wen_funnel_stats_v1') || '{}');
    s[key] = (s[key] || 0) + 1;
    localStorage.setItem('wen_funnel_stats_v1', JSON.stringify(s));
  } catch (e) {}
}

const PILLARS = [['Y', '年柱'], ['M', '月柱'], ['D', '日柱'], ['H', '时柱']];

/** 一柱拆成干、支两行渲染；缺数据时退化成一条横线。 */
function pillarCells(b) {
  return PILLARS.map(([key, label]) => {
    const p = (b && b[key]) || null;
    const g = p && p.g ? p.g : '';
    const z = p && p.z ? p.z : '';
    if (!g && !z) {
      return `<div class="pl"><b>—</b><i></i><span>${label}</span></div>`;
    }
    return `<div class="pl${key === 'D' ? ' is-self' : ''}"><b>${g || '—'}</b><i>${z || ''}</i><span>${label}</span></div>`;
  }).join('');
}

function reportToc(route) {
  /* 目录仍取报告本人的三个分区，但按引路人路线重排：第一站标「路线起点」，
     工具行改成这位引路人真正会打开的那一款，而不是笼统的工具箱。 */
  const labels = { 's-ming': '命盘', 's-yun': '运势', 's-rel': '关系' };
  const out = [];
  for (const id of route.toc) {
    const sec = document.getElementById(id);
    if (!sec) continue;
    const head = (sec.querySelector('.bb-title')?.textContent || '').trim().replace(/\s+/g, ' ');
    const score = (sec.querySelector('.bs-head')?.textContent || '').trim().replace(/\s+/g, ' ');
    out.push({ id, label: labels[id] || id, head, score, first: id === route.entry.sec });
  }
  if (out.length) out.push({
    id: 's-adv', tool: route.tool, label: '工具',
    head: `${route.toolName}：${route.name}会直接带你打开这一款`, score: '',
  });
  return out;
}

export function showFunnelTeaserIfNeeded() {
  const payload = readPayload();
  const ctx = window._ctx;
  if (!payload || !ctx || ctx.isDemoPreview || document.getElementById(OVERLAY_ID)) return false;

  const b = ctx.b || {};
  const name = (payload.name || '').trim();
  const yearNow = ctx.cLn && ctx.cLn.y ? ctx.cLn.y : new Date().getFullYear();
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const PERSONA = personaFor(payload.trait);
  const route = guideRouteFor(payload.trait);
  /* 三句钩子改由引路人路线挑：玉宸只圈大运 / 事业评分 / 流年，
     絮羽只圈月亮水星 / 月柱流年 / 问卷关注点，不再六人共用一套。 */
  const hooks = buildGuideHooks(PERSONA.key, {
    ctx,
    western: window.__w3dData || {},
    concerns: payload.concerns || [],
    yearNow,
  });
  const toc = reportToc(route);
  const tone = DAY_MASTER_TONE[ctx.dg] || '';
  /* 本地兜底文案：首帧先显示它，云端文案不可用或请求中断时恢复它。 */
  const localOpenHtml = `${route.opening}${tone ? `日主<b class="hl">${escapeHtml(ctx.dg)}（${escapeHtml(ctx.dw || '')}）</b>——${tone}` : ''}${PERSONA.lead}下面三处，${PERSONA.circle}。`;
  const dayunText = ctx.cDy ? `${ctx.cDy.g}${ctx.cDy.z}（${ctx.cDy.ys}–${ctx.cDy.ye}）` : '—';

  ensureStyle();
  const previousFocus = document.activeElement;
  const previousOverflow = document.body.style.overflow;
  const el = document.createElement('div');
  el.id = OVERLAY_ID;
  /* 主题跟随本次问卷选中的引路人：与 funnel.html 里同名人物的配色逐值一致，
     写在罩层自身的内联变量上，不污染全站，也允许同页多次切换人物。 */
  const palette = paletteFor(payload.trait);
  Object.entries(palette).forEach(([key, value]) => {
    el.style.setProperty('--ft-' + key.replace(/[A-Z]/g, m => '-' + m.toLowerCase()), value);
  });
  el.dataset.persona = PERSONA.key;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', PERSONA.name + '命盘预告');
  el.tabIndex = -1;
  el.innerHTML = `
  <div class="ft-stage" aria-hidden="true">
    <div class="ft-backdrop" style="background-image:url('${PERSONA.poster}')"></div>
    <video class="ft-video" autoplay muted loop playsinline preload="auto" disablepictureinpicture
      poster="${PERSONA.poster}" src="${PERSONA.video}" aria-hidden="true" tabindex="-1"></video>
    <div class="ft-scrim"></div>
  </div>
  <div class="ft-progress"><i></i></div>
  <button class="ft-close" type="button" aria-label="关闭预告">×</button>
  <div class="ft-scroll">
    <section class="ft-hero">
      <div class="ft-who">
        <img src="${PERSONA.poster}" alt="">
        <div>
          <div class="ft-kicker">${PERSONA.name} · 命盘预告</div>
          <div class="ft-name">${name ? `${escapeHtml(name)}，` : ''}${escapeHtml(route.heroLine)}</div>
        </div>
      </div>
      <div class="ft-hero-copy">
        <p class="ft-open">${localOpenHtml}</p>
        <div class="ft-hint"><span>向下滑 · 看${PERSONA.name}的路线</span><i></i></div>
      </div>
    </section>
    <div class="ft-sheet">
      <div class="ft-card ft-reveal">
        <h3>四 柱 排 盘</h3>
        <div class="ft-pillars">${pillarCells(b)}</div>
        <dl class="ft-rows">
          <div><dt>日主</dt><dd>${escapeHtml(ctx.dg || '—')}${ctx.dw ? ` · ${escapeHtml(ctx.dw)}` : ''}</dd></div>
          <div><dt>格局</dt><dd>${escapeHtml((ctx.pa || []).join('、') || '—')}</dd></div>
          <div><dt>当前大运</dt><dd>${escapeHtml(dayunText)}</dd></div>
        </dl>
        ${payload.timeStr ? '' : '<p class="ft-note">你跳过了出生时间，时柱按默认时刻起；若之后想起准确时辰，在报告页改表单重推即可。</p>'}
      </div>
      ${hooks.length ? `<div class="ft-card ft-reveal"><h3>${escapeHtml(route.hookTitle)}</h3><ol class="ft-hooks">${hooks.map(h => `<li class="ft-hook">${h}</li>`).join('')}</ol></div>` : ''}
      <div class="ft-card ft-reveal">
        <h3>${PERSONA.name} 的 阅 读 路 线</h3>
        <p class="ft-route-intro">${escapeHtml(route.role)}</p>
        <ol class="ft-route">${route.steps.map((step, i) => `<li><button class="ft-route-btn" type="button" data-guide-step="${i}" data-guide-key="${route.key}"><span class="ft-route-num">${String(i + 1).padStart(2, '0')}</span><span><b>${escapeHtml(step.label)}</b><small>${escapeHtml(step.detail)}</small></span><span class="ft-route-go" aria-hidden="true">›</span></button></li>`).join('')}</ol>
        <p class="ft-note">点任一步会关掉预告并直接带到对应卡片 / 工具 / 问问；只改阅读顺序，不改排盘或评分。</p>
      </div>
      ${toc.length ? `<div class="ft-card ft-reveal"><h3>完 整 报 告 目 录</h3><ul class="ft-toc">${toc.map(t => `<li><button class="ft-toc-btn" type="button" data-guide-toc="${t.id}" ${t.tool ? `data-guide-tool="${t.tool}"` : ''}><span class="tk">${escapeHtml(t.label)}</span><span>${escapeHtml(t.head)}${t.first ? '<i class="ft-toc-first">路线起点</i>' : ''}</span><span class="tv">${escapeHtml(t.score || '')}</span></button></li>`).join('')}</ul></div>` : ''}
      <button class="ft-skip ft-reveal" type="button">跳过预告，直接看报告</button>
      <p class="ft-free ft-reveal">全程免费 · 无隐藏收费 · 报告已在下方备好</p>
    </div>
  </div>
  <div class="ft-bar"><button class="ft-cta" type="button">${escapeHtml(route.cta)}</button></div>`;
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';

  const scroller = el.querySelector('.ft-scroll');
  const video = el.querySelector('.ft-video');
  const openEl = el.querySelector('.ft-open');
  const progress = el.querySelector('.ft-progress i');
  const cleanups = [];

  /* ---------- 视频：首帧就绪后淡入；不可播放时留在海报帧，不报错 ---------- */
  if (reduced) {
    /* 减少动效：不自动播放也不下载视频，只留清晰的海报静帧，
       四周由同一张图的虚化版铺底，视觉层次保持一致。 */
    video.autoplay = false;
    video.preload = 'none';
    video.removeAttribute('src');
    video.classList.add('is-ready');
  } else {
    const tryPlay = () => {
      const p = video.play?.();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    const onReady = () => video.classList.add('is-ready');
    if (video.readyState >= 2) {
      onReady();
    } else {
      ['loadeddata', 'canplay', 'playing'].forEach(ev => video.addEventListener(ev, onReady, { once: true }));
      /* 部分内嵌浏览器/省电模式不派发 canplay，兜底露出首帧：
         video 自带 poster，即使解码失败也是同一个人物画面，不会黑屏。 */
      const readyTimer = setTimeout(onReady, 1500);
      cleanups.push(() => clearTimeout(readyTimer));
    }
    tryPlay();
    const onVisibility = () => { if (document.hidden) video.pause(); else tryPlay(); };
    document.addEventListener('visibilitychange', onVisibility);
    cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));
  }

  /* ---------- 滚动进度 ---------- */
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const max = scroller.scrollHeight - scroller.clientHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / max)) : 0;
      progress.style.transform = `scaleX(${ratio})`;
    });
  };
  scroller.addEventListener('scroll', onScroll, { passive: true });
  cleanups.push(() => scroller.removeEventListener('scroll', onScroll));

  /* ---------- 下滑内容逐块浮现 ---------- */
  const reveals = [...el.querySelectorAll('.ft-reveal')];
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { root: scroller, threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(node => io.observe(node));
    cleanups.push(() => io.disconnect());
  } else {
    reveals.forEach(node => node.classList.add('in'));
  }

  /* 云端优化：只润色开场白的语气与句式；四柱、评分、大运流年等真实数据
     仍由本地渲染，不上传也不交给模型改写。首帧保留本地文案，缓存命中或
     首个流式片段到达后再逐字替换；失败与关闭均静默回退，不打扰访客。 */
  const copyController = new AbortController();
  let copyCancelled = false;
  (async () => {
    try {
      await generateTeaserCopy({
        persona: PERSONA,
        guideRoute: route,
        dayMaster: ctx.dg,
        concerns: payload.concerns || [],
        apiKey: getApiKey(),
        signal: copyController.signal,
        onDelta: (full) => {
          if (copyCancelled || !openEl.isConnected) return;
          openEl.classList.add('is-streaming');
          openEl.textContent = full; // 纯文本赋值，避免任何注入
        },
      });
      openEl.classList.remove('is-streaming');
    } catch (err) {
      openEl.classList.remove('is-streaming');
      if (!copyCancelled && !copyController.signal.aborted) {
        openEl.innerHTML = localOpenHtml;
        console.warn('[teaser] 云端文案不可用，已回退本地文案', err);
      }
    }
  })();

  // A modal teaser must not leave the report behind it clickable or reachable
  // by keyboard shortcuts. Snapshot and restore, like the calculation scene.
  const background = Array.from(document.body.children)
    .filter(node => node !== el && !['SCRIPT', 'STYLE', 'LINK'].includes(node.tagName))
    .map(node => ({ node, inert: node.hasAttribute('inert'), aria: node.getAttribute('aria-hidden') }));
  background.forEach(({ node }) => { node.setAttribute('inert', ''); node.setAttribute('aria-hidden', 'true'); });
  window.__wenFlow?.onTeaserOpen?.();
  bumpStat('teaser_shown');
  focusSafely(el);

  let closed = false;
  function dismiss(reason) {
    if (closed) return;
    closed = true;
    copyCancelled = true;
    copyController.abort(); // 提前离开时取消在途请求，不浪费额度
    cleanups.forEach(fn => { try { fn(); } catch (e) {} });
    if (raf) cancelAnimationFrame(raf);
    try { video.pause?.(); video.removeAttribute('src'); } catch (e) {}
    bumpStat(reason === 'continue' || reason === 'route' ? 'report_open' : 'teaser_skip');
    markTeasered(payload);
    background.forEach(({ node, inert, aria }) => {
      if (!inert) node.removeAttribute('inert');
      if (aria === null) node.removeAttribute('aria-hidden');
      else node.setAttribute('aria-hidden', aria);
    });
    document.body.style.overflow = previousOverflow;
    el.remove();
    const reportScroller = document.getElementById('p2Scroll');
    if (reportScroller) reportScroller.scrollTop = 0;
    window.scrollTo(0, 0);
    window.__wenFlow?.onTeaserClosed?.();
    const restore = previousFocus?.isConnected && previousFocus.getClientRects().length
      ? previousFocus : document.getElementById('p2MenuBtn');
    focusSafely(restore);
  }

  el.querySelector('.ft-cta').addEventListener('click', () => {
    dismiss('continue');
    runGuideAction(route.entry); // 主按钮直接落到这位引路人的第一站
  });
  el.querySelectorAll('.ft-route-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = route.steps[Number(btn.dataset.guideStep)];
      if (!step) return;
      dismiss('route');
      runGuideAction(step.action);
    });
  });
  el.querySelectorAll('.ft-toc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const toolId = btn.dataset.guideTool;
      const sec = btn.dataset.guideToc;
      dismiss('route');
      if (toolId) runGuideAction({ kind: 'tool', tool: toolId });
      else runGuideAction({ kind: 'card', sec });
    });
  });
  el.querySelector('.ft-skip').addEventListener('click', () => dismiss('skip'));
  el.querySelector('.ft-close').addEventListener('click', () => dismiss('skip'));
  el.addEventListener('keydown', event => {
    event.stopPropagation(); // 预告页独占 Escape 与报告的数字快捷键
    if (event.key === 'Escape') { event.preventDefault(); dismiss('skip'); return; }
    if (event.key !== 'Tab') return;
    const controls = [...el.querySelectorAll('button:not(:disabled)')].filter(node => node.getClientRects().length);
    if (!controls.length) { event.preventDefault(); focusSafely(el); return; }
    const index = controls.indexOf(document.activeElement);
    if (index < 0 || (!event.shiftKey && index === controls.length - 1) || (event.shiftKey && index === 0)) {
      event.preventDefault();
      focusSafely(controls[event.shiftKey ? controls.length - 1 : 0]);
    }
  });
  return true;
}
