/* ============================================================
   命盘预告页 · 云端开场文案
   ------------------------------------------------------------
   只优化「语气与句式」这类硬编码文案；四柱、评分、大运流年等真实
   推演数据仍由本地生成，不交给模型改写。

   上传字段仅限：引路人名称 / 风格样例（通用话术）、该引路人的通用作用
   与路线标签、日主天干（单字）、问卷关注点标签。不含姓名、出生日期时辰、
   出生地、具体四柱或评分；路线标签只描述阅读顺序，不含任何计算结果。

   命中缓存直接返回，不发起调用；失败由调用方静默回退本地文案。
   ============================================================ */

import { streamAskAnswer } from '../ai/index.js';

const CACHE_KEY = 'wen_teaser_copy_v2';
const CACHE_VERSION = 'v2';
const MAX_CACHE_ENTRIES = 12;

const CONCERN_LABELS = Object.freeze({
  career: '事业',
  love: '感情',
  health: '健康',
});

const SYSTEM_PROMPT = [
  '你是「问问大师」的文案撰写助手，只负责润色命盘预告页的开场白，不做命理推算、不生成任何结论。',
  '硬性规则：',
  '1. 只输出一段 80–120 字的中文开场白；不要标题、列表、JSON、引号或解释。',
  '2. 不得出现任何具体数字、年份、评分、天干地支、四柱、大运、流年，也不得复述或编造命理结论。',
  '3. 不得出现姓名、出生日期、出生时辰、出生地等个人信息。',
  '4. 不制造焦虑、不承诺结果、不涉及医疗、投资、法律建议。',
  '5. 语气贴合给定的引路人，温和、克制、有分寸，结尾自然引出下方已排好的真实内容。',
  '6. 这位引路人现在有明确分工（见「具体作用」与「阅读路线」）：可呼应他会先带你看什么，但不得写出具体卡片名、工具名、数字或命理结论。',
].join('\n');

/** 缓存键只由非敏感的通用维度组成，文案本身也不含个人信息。 */
export function teaserCopyId({ personaKey, dayMaster, concerns }) {
  return [
    CACHE_VERSION,
    personaKey || '-',
    dayMaster || '-',
    [...(concerns || [])].sort().join(',') || '-',
  ].join('|');
}

function readCache(id) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const hit = cache[id];
    return hit && typeof hit.text === 'string' && hit.text.trim() ? hit.text : null;
  } catch (_) { return null; }
}

function writeCache(id, text) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[id] = { text, at: Date.now() };
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE_ENTRIES) {
      keys.sort((a, b) => (cache[a].at || 0) - (cache[b].at || 0))
        .slice(0, keys.length - MAX_CACHE_ENTRIES)
        .forEach(k => { delete cache[k]; });
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (_) {}
}

/** 模型偶尔会带 Markdown 记号，这里是纯文本位置，去掉记号但保留中文标点。 */
function sanitize(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*#`_>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 生成预告页开场白。缓存命中时不发起任何模型调用。
 * @returns {Promise<{text:string, cached:boolean}>}
 */
export async function generateTeaserCopy({
  persona,
  guideRoute,
  dayMaster,
  concerns = [],
  apiKey,
  signal,
  onDelta,
}) {
  const id = teaserCopyId({ personaKey: persona?.key, dayMaster, concerns });
  const cached = readCache(id);
  if (cached) {
    onDelta?.(cached, cached, 'cache');
    return { text: cached, cached: true };
  }

  /* 流式片段里可能夹着 Markdown 记号，渲染前统一清洗。 */
  const emit = onDelta ? (full) => onDelta(sanitize(full), full) : undefined;

  const concernText = concerns.map(c => CONCERN_LABELS[c]).filter(Boolean).join('、') || '未指定';
  const question = [
    `引路人：${persona?.name || '引路人'}（语气参考：「${persona?.lead || ''}」）`,
    `具体作用：${guideRoute?.role || '陪你按专长读报告'}`,
    `阅读路线：${(guideRoute?.chips || []).join(' → ') || '按报告顺序阅读'}（只用于把握语气，禁止在输出中写出具体卡片名或工具名）`,
    `日主天干：${dayMaster || '未提供'}（仅用于把握语气，禁止在输出中出现该字或任何干支）`,
    `访客在问卷里最关心：${concernText}`,
    '请写出这段开场白。',
  ].join('\n');

  const result = await streamAskAnswer({
    apiKey,
    systemPrompt: SYSTEM_PROMPT,
    chartContext: '',            // 不上传命盘
    question,
    aiPrefs: { natural: true, length: 'short', temperature: 0.7 },
    previousTurns: [],
    signal,
    onDelta: emit,
  });

  const text = sanitize(result?.text);
  if (!text || text.length < 20 || text.length > 400) {
    throw new Error('云端文案长度异常');
  }
  writeCache(id, text);
  return { text, cached: false };
}
