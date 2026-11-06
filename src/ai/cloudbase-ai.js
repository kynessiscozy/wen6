/* ============================================================
   问问大师 · CloudBase 云开发 AI 提供方（免密钥大模型）
   ------------------------------------------------------------
   与 workbuddy-cloud.js 保持同一接口签名，由 ai/index.js 统一路由。
   模型走自有云开发环境（env 见 cloudbase-config.js）的 AI 能力：
   浏览器以 Publishable Key 初始化 @cloudbase/js-sdk，
   ai.createModel("cloudbase") 后以 streamText 流式生成。
   环境已开通模型：hy3 / hy4（混元），按序尝试、失败自动降级。
   ============================================================ */

import cloudbase from '@cloudbase/js-sdk';
import { cloudbaseConfig } from './cloudbase-config.js';

export const ASK_MODELS = ['hy3', 'hy4'];
export const TOOL_MODELS = ['hy3', 'hy4'];
export const MODEL_LABELS = Object.freeze({
  hy3: '混元 hy3',
  hy4: '混元 hy4',
});

/* 单一客户端，懒初始化（避免未用到的页面提前建连）。 */
let _model = null;
function getModel() {
  if (_model) return _model;
  const app = cloudbase.init({
    env: cloudbaseConfig.env,
    region: cloudbaseConfig.region,
    accessKey: cloudbaseConfig.accessKey,
  });
  _model = app.ai().createModel('cloudbase');
  return _model;
}

/* ============================================================
   连接状态探针
   ============================================================ */
let _connState = 'unknown';   // unknown | checking | online | offline
let _connListeners = [];

export function getConnState() { return _connState; }
export function onConnChange(fn) {
  _connListeners.push(fn);
  return () => { _connListeners = _connListeners.filter(x => x !== fn); };
}
function _notifyConn(s) {
  _connState = s;
  _connListeners.forEach(fn => { try { fn(s); } catch (_) {} });
}

export function modelLabel(id) {
  if (!id) return id;
  return MODEL_LABELS[id] || id;
}

/** 设置页/诊断用：本提供方固定模型目录（环境已开通）。 */
export async function getCloudModels() {
  return ASK_MODELS.map(id => ({ id, name: MODEL_LABELS[id] }));
}

/* ============================================================
   通用工具（与内置模型提供方保持一致的问答口径）
   ============================================================ */
function cleanTurns(turns) {
  return (turns || []).slice(-6).map(x => ({
    role: x.role === 'assistant' ? 'assistant' : 'user',
    content: String(x.content || '').slice(0, 700)
  })).filter(x => x.content);
}

function buildAskSystemPrompt({ systemPrompt, aiPrefs, chartContext }) {
  return String(systemPrompt || '你是「问问大师」的决策助理，用温和、清醒、有分寸的中文回答。不把命理说成事实，不制造焦虑，涉及健康、财务、法律与关系重大决定时提醒结合现实信息与专业意见。')
    + '\n回复偏好：'
    + (aiPrefs?.natural ? '使用自然口语。' : '直接、少寒暄。')
    + (aiPrefs?.length === 'standard' ? '回复可放宽到180至260字。' : '保持简洁。')
    + '\n用户命盘：\n'
    + String(chartContext || '').slice(0, 5000)
    + '\n当前时间：'
    + new Date().toLocaleString('zh-CN');
}

function describeError(err) {
  const code = err?.error?.code || err?.code || '';
  const msg = err?.error?.message || err?.message || '';
  if (/auth|unauthorized|forbidden|401|403/i.test(code + ' ' + msg)) return '云开发 AI 未授权：请从正式站点打开页面，或检查环境 API Key 配置';
  if (/quota|limit|rate|429/i.test(code + ' ' + msg)) return '云开发 AI 额度已用尽或触发限流，请稍后再试';
  if (/model/i.test(code + ' ' + msg)) return '云开发 AI 模型暂不可用（可能未在控制台开通）：' + (msg || code);
  return '云开发 AI 调用失败：' + (msg || '未知错误');
}

function abortError() {
  const e = new Error('The operation was aborted');
  e.name = 'AbortError';
  return e;
}

/**
 * 统一的流式收集：messages[0] 为 system。
 * streamText 的 textStream 逐段产出文本字符串；
 * SDK 不吃 AbortSignal，靠逐段检查 signal 实现取消。
 */
async function collectStream({ model, messages, temperature, signal, onChunk }) {
  let full = '';
  const res = await getModel().streamText({
    model,
    messages,
    temperature: temperature ?? 0.6,
  });
  for await (const str of res.textStream) {
    if (signal?.aborted) throw abortError();
    if (str) {
      full += str;
      onChunk?.(full, str);
    }
  }
  return full;
}

/* ============================================================
   流式问答 — 返回 { text, model }
   ============================================================ */
export async function streamAskAnswer({
  systemPrompt,
  chartContext,
  question,
  aiPrefs = { natural: true, length: 'short' },
  previousTurns = [],
  onDelta,
  onModelSwitch,
  signal,
}) {
  const messages = [
    { role: 'system', content: buildAskSystemPrompt({ systemPrompt, aiPrefs, chartContext }) },
    ...cleanTurns(previousTurns),
    { role: 'user', content: String(question || '').slice(0, 2000) },
  ];
  const temperature = aiPrefs?.temperature ?? 0.55;
  let lastError = '';

  for (const model of ASK_MODELS) {
    try {
      onModelSwitch?.(model);
      const full = await collectStream({
        model,
        messages,
        temperature,
        signal,
        onChunk: (text, delta) => onDelta?.(text, delta, model),
      });
      if (full.trim()) {
        _notifyConn('online');
        return { text: full, model };
      }
      lastError = '云开发 AI 未返回内容';
    } catch (err) {
      if (signal?.aborted) throw err;
      lastError = describeError(err);
    }
  }

  _notifyConn('offline');
  throw new Error(lastError || '云开发 AI 调用失败');
}

/* ============================================================
   工具旁白 — 与问答共用同一条流式链路，逐字回传给 UI
   ============================================================ */
export async function askToolInsight({
  typeLabel,
  source,
  chartSummary,
  extraSystem = '',
  depth = false,
  onDelta,
  signal,
}) {
  const lenRule = depth
    ? '控制在150字以内。只给一条最具体的可执行建议：说明在用户空间（家/办公）的具体方位、放什么物件、为什么，必须引用其所在城市、坐向、命卦/用神与重点方位，不得泛泛而谈、不得复述测算参数。'
    : '控制在140字以内。';
  const system = '你是一位温暖、清醒、有分寸的决策助理。把工具结果翻译成自然中文：先接住用户的处境，再指出一条最重要的现实重点，最后给一个今天就能完成的小动作。只引用与结果直接相关的依据，不把命理说成事实，不制造恐惧或夸张承诺；涉及健康、财务、法律和关系重大决定时，提醒结合现实信息与专业意见。' + lenRule + String(extraSystem || '').slice(0, 1200);
  const user = `用户刚完成「${typeLabel}」工具。工具结果：${String(source || '').slice(0, 1800)}。用户命盘参考：${String(chartSummary || '').slice(0, 1200)}。`;
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
  let lastError = '';

  for (const model of TOOL_MODELS) {
    try {
      const full = await collectStream({
        model, messages, temperature: 0.65, signal,
        onChunk: (text, delta) => onDelta?.(text, delta, model),
      });
      if (full.trim()) {
        _notifyConn('online');
        return full.trim();
      }
      lastError = '云开发 AI 未返回内容';
    } catch (err) {
      if (signal?.aborted) throw err;
      lastError = describeError(err);
    }
  }

  _notifyConn('offline');
  throw new Error(lastError || '云开发 AI 调用失败');
}

/* ============================================================
   连接检测：一次极短生成即代表链路可用，无需用户密钥
   ============================================================ */
export async function probeConnection() {
  _notifyConn('checking');
  try {
    const res = await getModel().streamText({
      model: ASK_MODELS[0],
      messages: [{ role: 'user', content: '你好' }],
    });
    for await (const _chunk of res.textStream) { break; }
    _notifyConn('online');
    return 'online';
  } catch (_) {
    _notifyConn('offline');
    return 'offline';
  }
}
