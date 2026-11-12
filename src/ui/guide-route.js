/* ============================================================
   引路人阅读路线 · 功能契约（2026-11-11）
   ------------------------------------------------------------
   此前六位引路人只有「头衔 / 专长 / 配色 / 视频」：选谁都不改变
   接下来会发生什么。这里把「作用」落成一张可执行路线表：

     · 预告页：按专长挑三处真数据当钩子、按路线重排目录、给出可点四步；
     · 报告页：同一张路线做成按钮，点一下真的跳卡片 / 开工具 / 带问题去问；
     · 漏斗首屏：用 chips 预告这位引路人会带你先做什么。

   硬边界：动作只改「先看哪里、用哪个体系、打开哪款工具、问什么问题」；
   不写入、不重算、不改写 ctx / western，也不碰评分、结论与输入数据。
   报告主题键（如 xingling）与漏斗人物键（如 xiyao）在此统一解析。
   ============================================================ */

import { GUIDE_V61, GUIDE_KEYS, DEFAULT_PERSONA, themeForPersona } from './entry-personas.js';

/* ---------- 纯数据助手：只允许已算出的值进入文案 ---------- */

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[ch]));
const text = value => typeof value === 'string' ? value.trim()
  : (typeof value === 'number' || typeof value === 'boolean' ? String(value) : '');
const em = value => {
  const v = text(value);
  return v ? `<b>${esc(v)}</b>` : '';
};
const gz = p => `${text(p?.g)}${text(p?.z)}`;
const factsList = pairs => pairs
  .filter(([, v]) => text(v))
  .map(([label, v]) => `${label} ${em(v)}`)
  .join('、');
const scoreText = row => row ? `${row.label} ${row.value} 分` : '';
const concernText = concern => concern
  ? concern.values.map(row => `${row.label} ${row.value} 分`).join('、')
  : '';

/* ---------- 可执行动作 ---------- */

const card = (sec, key, system, field) => Object.freeze({
  kind: 'card', sec, card: key, system, ...(field ? { field } : {}),
});
const openTool = id => Object.freeze({ kind: 'tool', tool: id });
const askWith = question => Object.freeze({ kind: 'ask', question });

/* ---------- 六位引路人的路线 ---------- */

const ROUTE_DEFS = Object.freeze({
  moonfox: {
    theme: 'moonfox',
    role: '不替你收窄方向：把东方四柱与西方三核摆在一起，先找互相印证的线索。',
    opening: '别急着下结论，先把整张盘看全。',
    heroLine: '你的盘，先摊开第一层',
    hookTitle: '月 白 先 摊 开 三 处',
    cta: '按月白的路线看报告',
    chips: ['四柱与日主', '星盘三核', '答案之书', '问问追问'],
    toc: ['s-ming', 's-yun', 's-rel'],
    tool: 'answerbook', toolName: '答案之书',
    entry: card('s-ming', 'bazi', 'eastern'),
    steps: [
      { label: '四柱与日主', detail: '先看四柱、日主与用神，把底盘摆正。', action: card('s-ming', 'bazi', 'eastern') },
      { label: '星盘三核', detail: '切到西方视图，对照太阳、月亮、上升。', action: card('s-ming', 'astro-core', 'western') },
      { label: '答案之书', detail: '心里若还有没成形的问题，先翻一页。', action: openTool('answerbook') },
      { label: '问问追问', detail: '带着「哪两条线索互相印证」去问问。', action: askWith('不预设结论，请只根据已算出的四柱和星盘，指出哪两条线索互相印证、哪一条还互相矛盾？') },
    ],
  },
  yuchen: {
    theme: 'yuchen',
    role: '只盯事业这条线：用大运定窗口、用流年定今年，再落到可执行的取舍。',
    opening: '事业这一局，先看势，不急着落子。',
    heroLine: '事业这条线，先落在盘上',
    hookTitle: '玉 宸 先 圈 出 三 处',
    cta: '按玉宸的路线看报告',
    chips: ['人生时间线', '年度趋势', '事业大师', '问问追问'],
    toc: ['s-yun', 's-ming', 's-rel'],
    tool: 'career', toolName: '事业大师',
    entry: card('s-yun', 'timeline', 'eastern'),
    steps: [
      { label: '人生时间线', detail: '先看当前大运与下一次换柱，定时间窗口。', action: card('s-yun', 'timeline', 'eastern') },
      { label: '年度趋势', detail: '把大运落到今年流年与十神。', action: card('s-yun', 'trend', 'eastern', 'year-god') },
      { label: '事业大师', detail: '打开转行 / 副业与职场风控，核对现实条件。', action: openTool('career') },
      { label: '问问追问', detail: '只问一件事：这步运里最该先押注什么。', action: askWith('结合当前大运、今年流年和已算出的事业评分，事业这条线里现在最该先确认的一件事是什么？请只依据报告里的依据。') },
    ],
  },
  xiyao: {
    theme: 'xingling',
    role: '只陪你看姻缘：从配偶宫与情感线索读起，再给两个人留一次合盘的位置。',
    opening: '姻缘这一线，先看心，不先下断语。',
    heroLine: '姻缘这一线，先替你圈出来',
    hookTitle: '夕 瑶 先 圈 出 三 处',
    cta: '按夕瑶的路线看报告',
    chips: ['亲密关系', '八字合盘', '合盘助手', '问问追问'],
    toc: ['s-rel', 's-yun', 's-ming'],
    tool: 'relation', toolName: '合盘助手',
    entry: card('s-rel', 'intimacy', 'eastern', 'partner-star'),
    steps: [
      { label: '亲密关系', detail: '先看日支配偶宫与关系画像，不替你判结局。', action: card('s-rel', 'intimacy', 'eastern', 'partner-star') },
      { label: '八字合盘', detail: '报告里的双人排盘，只比对依据不预测结果。', action: card('s-rel', 'relAi', 'eastern') },
      { label: '合盘助手', detail: '若心里有人，打开合盘工具逐柱对照。', action: openTool('relation') },
      { label: '问问追问', detail: '把「我给的与我要的」问清楚。', action: askWith('只依据报告里已算出的日支、金星与月亮线索，我在亲密关系里最容易忽略的一个相处事实是什么？不要预测结局。') },
    ],
  },
  diyan: {
    theme: 'diyan',
    role: '只算财路的分寸：先看财运评分与流年，再回到日主用神找财源根基。',
    opening: '先看财路，再定进退。',
    heroLine: '财路这一本，先替你翻开',
    hookTitle: '焱 绒 先 拨 三 笔 账',
    cta: '按焱绒的路线看报告',
    chips: ['年度趋势', '人生时间线', '择日助手', '问问追问'],
    toc: ['s-yun', 's-ming', 's-rel'],
    tool: 'date', toolName: '择日助手',
    entry: card('s-yun', 'trend', 'eastern', 'year'),
    steps: [
      { label: '年度趋势', detail: '先看今年流年与财运评分，不追加新结论。', action: card('s-yun', 'trend', 'eastern', 'year') },
      { label: '人生时间线', detail: '再看大运换柱，找到「进退」的时间窗口。', action: card('s-yun', 'timeline', 'eastern') },
      { label: '择日助手', detail: '重要取舍看时间窗口，工具只作文化参考。', action: openTool('date') },
      { label: '问问追问', detail: '问财从哪来、又最容易从哪里漏。', action: askWith('只依据报告里的财运评分、日主与用神，我的财路根基和最容易漏掉的一环分别是什么？不要给投资建议。') },
    ],
  },
  muse: {
    theme: 'muse',
    role: '不替命盘说话：先把问题在心里问清楚，再用塔罗与「问问」各给一个反思角度。',
    opening: '问题先放心里，牌会说话。',
    heroLine: '先把问题放心里，再翻牌',
    hookTitle: '絮 羽 先 摊 开 三 张',
    cta: '按絮羽的路线看报告',
    chips: ['当下关注', '梅花易数', '塔罗大师', '问问追问'],
    toc: ['s-yun', 's-ming', 's-rel'],
    tool: 'tarot', toolName: '塔罗大师',
    entry: card('s-yun', 'todayAdv', 'eastern'),
    steps: [
      { label: '当下关注', detail: '先看今日建议与当下关注，把问题收窄。', action: card('s-yun', 'todayAdv', 'eastern') },
      { label: '梅花易数', detail: '再看具体问题的另一种东方趋势框架。', action: card('s-ming', 'meihua', 'eastern') },
      { label: '塔罗大师', detail: '带着同一个问题去翻牌，牌面不改写命盘。', action: openTool('tarot') },
      { label: '问问追问', detail: '对照牌面与盘面，只问是不是同一件事。', action: askWith('我刚带着一个问题翻了牌。请只对照报告里已算出的月柱、流年、月亮与水星线索，指出牌面与盘面可以互相印证的阅读角度，不要生成新结论。') },
    ],
  },
  xingluo: {
    theme: 'xingluo',
    role: '先立星盘骨架：太阳、月亮、上升与行星落座在先，东方年柱 / 大运只作时间辅证。',
    opening: '星盘之上，自有骨架。',
    heroLine: '出生那一刻的星空，先重新画出来',
    hookTitle: '星 罗 先 定 三 个 点',
    cta: '按星罗的路线看报告',
    chips: ['星盘三核', '十大星曜', '星座助手', '问问追问'],
    toc: ['s-ming', 's-yun', 's-rel'],
    tool: 'horoscope', toolName: '星座助手',
    entry: card('s-ming', 'astro-core', 'western'),
    steps: [
      { label: '星盘三核', detail: '第一站切到西方视图，看太阳、月亮、上升。', action: card('s-ming', 'astro-core', 'western') },
      { label: '十大星曜', detail: '再展开行星落座与相位，核对同一份出生数据。', action: card('s-ming', 'astro-planets', 'western') },
      { label: '星座助手', detail: '打开星座工具看三核与运势罗盘。', action: openTool('horoscope') },
      { label: '问问追问', detail: '只问星盘骨架，不让它改写东方命盘。', action: askWith('只依据报告里已算出的太阳、月亮、上升和行星落座，我的星盘骨架里最值得先核对的一组张力是什么？不要改动四柱或评分。') },
    ],
  },
});

/* ---------- 按专长挑钩子：只读已算出的结果 ---------- */

const ssOf = (ctx, stem) => typeof ctx?.ssOf === 'function' ? text(ctx.ssOf(stem)) : '';
const planet = (chart, key) => text((chart?.planets || []).find(p => p?.key === key)?.sign?.name);

function buildGuideFacts({ ctx = {}, western = {}, concerns = [], yearNow = new Date().getFullYear() } = {}) {
  const b = ctx?.b || {};
  const cDy = ctx?.cDy || null;
  const cLn = ctx?.cLn || null;
  const nextDy = (ctx?.dy?.ds || [])[(ctx?.cDyIdx ?? 0) + 1] || null;
  const nextLn = (ctx?.ln || []).find(entry => entry?.y === yearNow + 1) || null;
  const scoreRows = [
    ['cs', '事业', ctx?.cs], ['ws', '财运', ctx?.ws],
    ['ls', '感情', ctx?.ls], ['hs', '健康', ctx?.hs],
  ].filter(row => typeof row[2] === 'number')
    .map(([key, label, value]) => ({ key, label, value }));
  const top = scoreRows.length ? scoreRows.reduce((a, r) => r.value > a.value ? r : a, scoreRows[0]) : null;
  const low = scoreRows.length ? scoreRows.reduce((a, r) => r.value < a.value ? r : a, scoreRows[0]) : null;
  const CONCERNS = {
    career: { label: '事业与金钱', keys: ['cs', 'ws'] },
    love: { label: '感情与婚姻', keys: ['ls'] },
    health: { label: '健康状态', keys: ['hs'] },
  };
  const concern = (concerns || []).map(key => CONCERNS[key]).find(Boolean) || null;
  const astro = western?.astro || {};
  return {
    yearNow,
    day: `${text(ctx?.dg)}${text(ctx?.dw)}`,
    dg: text(ctx?.dg), dw: text(ctx?.dw), ys: text(ctx?.wx?.ys),
    pa: (ctx?.pa || []).map(text).filter(Boolean).join('、'),
    pillars: ['Y', 'M', 'D', 'H'].map(k => gz(b[k])).filter(Boolean).join(' · '),
    monthPillar: gz(b.M), yearPillar: gz(b.Y), spouse: text(b.D?.z),
    dayun: cDy ? { gz: gz(cDy), ss: text(ctx?.cDySS) || ssOf(ctx, cDy.g), ys: cDy.ys, ye: cDy.ye } : null,
    nextDayun: nextDy ? { gz: gz(nextDy), ys: nextDy.ys, as: nextDy.as, ss: ssOf(ctx, nextDy.g) } : null,
    liunian: cLn ? { y: cLn.y || yearNow, gz: gz(cLn), ss: text(ctx?.cLnSS) || ssOf(ctx, cLn.g) } : null,
    nextLiunian: nextLn ? { y: nextLn.y, gz: gz(nextLn), ss: ssOf(ctx, nextLn.g) } : null,
    scores: scoreRows, top, low,
    cs: ctx?.cs, ws: ctx?.ws, ls: ctx?.ls, hs: ctx?.hs,
    concern: concern ? {
      label: concern.label,
      values: concern.keys.map(key => scoreRows.find(row => row.key === key)).filter(Boolean),
    } : null,
    chart: {
      sun: text(astro.sun?.name), moon: text(astro.moon?.name), asc: text(astro.asc?.name),
      mercury: planet(astro, 'Mercury'), venus: planet(astro, 'Venus'),
      mars: planet(astro, 'Mars'), jupiter: planet(astro, 'Jupiter'),
    },
  };
}

const HOOKS = Object.freeze({
  moonfox: [
    f => f.day ? `不预设方向，先把底盘摆正：${factsList([['日主', f.day], ['用神', f.ys], ['格局', f.pa]])}；四柱 ${em(f.pillars)} 已按所填时间排定。` : '',
    f => {
      const trio = factsList([['太阳', f.chart.sun], ['月亮', f.chart.moon], ['上升', f.chart.asc]]);
      return trio ? `东西方并陈：${trio}；路线会切到星盘三核，再回到四柱逐处对照，不另造结论。`
        : (f.pillars ? `四柱 ${em(f.pillars)} 已排定；星盘线索暂缺时，报告仍可继续往下读。` : '');
    },
    f => f.top ? `${f.yearNow} 年四项评分里 ${em(scoreText(f.top))} 最高${f.low ? `，${em(scoreText(f.low))} 最要留心` : ''}；分数背后的时间点都在完整报告里。` : '',
  ],
  yuchen: [
    f => f.dayun ? `事业先看时间窗口：当前大运 ${em(f.dayun.gz)}${f.dayun.ss ? `（十神 ${em(f.dayun.ss)}）` : ''}${f.dayun.ys ? `，${em(`${f.dayun.ys}–${f.dayun.ye}`)}` : ''}${f.nextDayun ? `；下一次 ${em(`${f.nextDayun.ys} 年`)} 换柱为 ${em(f.nextDayun.gz)}` : ''}。` : '',
    f => typeof f.cs === 'number' ? `你问卷里勾的是 ${em(f.concern?.label || '事业与金钱')}：事业评分 ${em(`${f.cs} 分`)}；路线第二站落到 ${em('年度核心趋势')}，把大运读进今年。` : '',
    f => {
      const drive = factsList([['太阳', f.chart.sun], ['火星', f.chart.mars]]);
      return f.liunian ? `今年流年 ${em(`${f.liunian.y} ${f.liunian.gz}`)}，十神 ${em(f.liunian.ss || '—')}${drive ? `；驱动可在西方视图核对 ${drive}` : ''}。` : '';
    },
  ],
  xiyao: [
    f => f.spouse ? `姻缘从配偶宫读起：${factsList([['日支', f.spouse], ['日主', f.day]])}；第一站是 ${em('亲密关系画像')}，只列依据不判结局。` : '',
    f => {
      const feeling = factsList([['金星', f.chart.venus], ['月亮', f.chart.moon]]);
      return typeof f.ls === 'number' ? `感情评分 ${em(`${f.ls} 分`)}${feeling ? `，西方以 ${feeling} 作情感线索` : ''}；两处都已在报告里算好。` : '';
    },
    f => f.liunian ? `今年流年 ${em(`${f.liunian.y} ${f.liunian.gz}`)}，十神 ${em(f.liunian.ss || '—')}；想比对两个人的盘，路线会带你去 ${em('八字合盘')} 与 ${em('合盘助手')}。` : '',
  ],
  diyan: [
    f => typeof f.ws === 'number' ? `财路先看分寸：财运评分 ${em(`${f.ws} 分`)}${f.top ? `，四项里最旺的是 ${em(scoreText(f.top))}` : ''}；这些数字报告里已经算好，引路人不改它们。` : '',
    f => {
      const western = factsList([['木星', f.chart.jupiter], ['太阳', f.chart.sun]]);
      return f.day ? `财源根基回到 ${factsList([['日主', f.day], ['用神', f.ys]])}${western ? `；西方以 ${western} 作扩张参考` : ''}，两边只读同一份数据。` : '';
    },
    f => f.nextDayun ? `下一次大运在 ${em(`${f.nextDayun.ys} 年`)}（${em(`${f.nextDayun.as} 岁`)}）换柱为 ${em(f.nextDayun.gz)}；「进退」看时间窗口，路线会去 ${em('人生时间线')} 与 ${em('择日助手')}。` : (f.dayun ? `当前大运 ${em(f.dayun.gz)} 的得失，报告已逐年拆好。` : ''),
  ],
  muse: [
    f => {
      const intuition = factsList([['月亮', f.chart.moon], ['水星', f.chart.mercury]]);
      return intuition ? `先把问题放心里：${intuition}，一个管直觉、一个管讯息；牌面与命盘互不改写。` : '';
    },
    f => f.monthPillar ? `东方只作背景节律：${factsList([['月柱', f.monthPillar], ['今年流年', f.liunian?.gz]])}；路线先落在 ${em('当下关注')}，再去看 ${em('梅花易数')}。` : '',
    f => f.concern ? `问卷里你勾了 ${em(f.concern.label)}（${em(concernText(f.concern))}）；${em('塔罗大师')} 已备好，带着同一个问题去翻牌。` : (f.top ? `四项里 ${em(scoreText(f.top))} 最旺，但这次先不定方向，让牌替你换一个角度。` : ''),
  ],
  xingluo: [
    f => {
      const trio = factsList([['太阳', f.chart.sun], ['月亮', f.chart.moon], ['上升', f.chart.asc]]);
      return trio ? `星盘骨架先立住：${trio}；第一站切到 ${em('西方星盘三核')}，东方命盘退为辅证。` : '';
    },
    f => f.yearPillar ? `东方只作时间辅证：${factsList([['年柱', f.yearPillar], ['当前大运', f.dayun?.gz]])}；同一份出生数据，不重算也不覆盖。` : '',
    f => f.nextDayun ? `下一次大运 ${em(`${f.nextDayun.ys} 年 ${f.nextDayun.gz}`)} 只作时间参照；路线会打开 ${em('星座助手')} 与 ${em('十大星曜')}。` : (f.liunian ? `今年流年 ${em(`${f.liunian.y} ${f.liunian.gz}`)} 也只作参照，星盘结论不回写四柱。` : ''),
  ],
});

/* 数据缺失时不编造：用通用真事实补足三条；仍不足就少显示，不硬凑。 */
const FALLBACK_HOOKS = Object.freeze([
  f => f.pillars ? `四柱 ${em(f.pillars)} 已按所填时间排定，换引路人不会改动它们。` : '',
  f => f.dayun ? `当前大运 ${em(f.dayun.gz)}${f.dayun.ss ? `（十神 ${em(f.dayun.ss)}）` : ''}，时间线在报告里已经算好。` : '',
  f => f.nextLiunian ? `明年 ${em(f.nextLiunian.y)} 流年 ${em(f.nextLiunian.gz)}${f.nextLiunian.ss ? `，十神 ${em(f.nextLiunian.ss)}` : ''}；逐年拆解在完整报告里。` : '',
  f => f.scores.length ? `四项评分是 ${em(f.scores.map(row => `${row.label} ${row.value}`).join(' / '))}，只作阅读线索，不是新结论。` : '',
]);

/* ---------- 对外接口 ---------- */

export const GUIDE_ROUTES = Object.freeze(Object.fromEntries(
  Object.entries(ROUTE_DEFS).map(([key, def]) => {
    const guide = GUIDE_V61[key];
    return [key, Object.freeze({
      ...def, key,
      name: guide.name, title: guide.title, focus: guide.focus,
      steps: Object.freeze(def.steps.map(step => Object.freeze(step))),
      chips: Object.freeze([...def.chips]), toc: Object.freeze([...def.toc]),
    })];
  }),
));
export const GUIDE_ROUTE_KEYS = Object.freeze(Object.keys(GUIDE_ROUTES));

const THEME_TO_KEY = Object.freeze(Object.fromEntries(
  GUIDE_KEYS.map(key => [themeForPersona(key), key]),
));

/** 漏斗人物键或报告主题键都接受；未知值回退月白。 */
export function guideRouteFor(keyOrTheme) {
  const key = Object.prototype.hasOwnProperty.call(GUIDE_ROUTES, keyOrTheme)
    ? keyOrTheme : (THEME_TO_KEY[keyOrTheme] || DEFAULT_PERSONA);
  return GUIDE_ROUTES[key];
}

/** 按专长挑三处真数据；返回可安全插入预告页的 HTML 片段。 */
export function buildGuideHooks(keyOrTheme, options = {}) {
  const route = guideRouteFor(keyOrTheme);
  const facts = buildGuideFacts(options);
  const hooks = (HOOKS[route.key] || []).map(fn => fn(facts)).filter(Boolean);
  for (const fn of FALLBACK_HOOKS) {
    if (hooks.length >= 3) break;
    const extra = fn(facts);
    if (extra && !hooks.includes(extra)) hooks.push(extra);
  }
  return hooks.slice(0, 3);
}

/**
 * 执行一步路线。只用页面已有全局入口；缺入口时安静失败，不打断阅读。
 * card → 切体系 + 跳真实卡片，tool → 开真实工具，ask → 预填问题不代发。
 */
export function runGuideAction(action) {
  if (!action || typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (action.system && typeof window.setSystemMode === 'function') window.setSystemMode(action.system);
  if (action.kind === 'card') {
    if (typeof window.jumpTo !== 'function') return false;
    window.jumpTo(action.sec, action.card, action.field);
    return true;
  }
  if (action.kind === 'tool') {
    if (typeof window.openToolPage !== 'function') return false;
    window.openToolPage(action.tool);
    return true;
  }
  if (action.kind === 'ask') {
    const question = text(action.question);
    if (!question) return false;
    const sheet = document.getElementById('aiSheet');
    if (sheet && !sheet.classList.contains('open') && typeof window.openAsk === 'function') window.openAsk();
    const input = document.getElementById('askInput');
    if (input) {
      input.value = question;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      try { sessionStorage.setItem('tj_ai_draft', question); } catch (_) {}
      try { input.focus({ preventScroll: true }); } catch (_) { try { input.focus(); } catch (_) {} }
    }
    return true;
  }
  return false;
}

export { buildGuideFacts };
