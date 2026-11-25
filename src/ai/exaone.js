/* ============================================================
   问问大师 · EXAONE 提供方（LG K-EXAONE 2.5 / 自填密钥）
   ------------------------------------------------------------
   与其它提供方保持同一接口签名，由 ai/index.js 统一路由。
   EXAONE 接口（https://api.exaone.ai/v1）不允许浏览器跨域直连
   （CORS 预检被拒），故浏览器不直接请求它：请求先经自有云开发
   环境的云函数 exaone-proxy 中转（见 cloudfunctions/），用户的
   Key 只随请求传入云函数，不落盘、不写日志；Key 本身仅存本地
   浏览器（ai-settings 的 tj_ai_apikey_exaone）。
   云函数为一次性返回（非流式），回答整段到达后一次回传 UI。
   ============================================================ */

import cloudbase from '@cloudbase/js-sdk';
import { cloudbaseConfig } from './cloudbase-config.js';

export const ASK_MODELS = ['k-exaone_v2.5'];
export const TOOL_MODELS = ['k-exaone_v2.5'];
export const MODEL_LABELS = Object.freeze({
  'k-exaone_v2.5': 'EXAONE 2.5',
});
const FN_NAME = 'exaone-proxy';

/* 独立客户端（长超时）：云函数要等 EXAONE 整段生成完才返回。 */
let _app = null;
function getApp() {
  if (_app) return _app;
  _app = cloudbase.init({
    env: cloudbaseConfig.env,
    region: cloudbaseConfig.region,
    accessKey: cloudbaseConfig.accessKey,
    timeout: 90000,
  });
  return _app;
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

/* ============================================================
   通用工具（与 CloudBase 提供方保持一致的问答口径）
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

function abortError() {
  const e = new Error('The operation was aborted');
  e.name = 'AbortError';
  return e;
}

/**
 * 调云函数中转。SDK 的 callFunction 不吃 AbortSignal：
 * 用 Promise.race 实现取消（云端调用会自然跑完，结果被丢弃）。
 */
async function callProxy(data, signal) {
  if (signal?.aborted) throw abortError();
  const p = getApp().callFunction({ name: FN_NAME, data });
  const res = signal
    ? await Promise.race([
        p,
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(abortError()), { once: true });
        }),
      ])
    : await p;
  const result = (res && res.result) || {};
  if (result.error) {
    if (result.code === 'missing_key') throw new Error('未配置 EXAONE API 密钥：请在 AI 设置中粘贴你的 EXAONE Key');
    if (result.code === 'upstream_401' || result.code === 'upstream_403') throw new Error('EXAONE 密钥无效或已过期：请在 AI 设置中更新 Key');
    throw new Error('EXAONE 调用失败：' + result.error);
  }
  return result;
}

/* ============================================================
   流式问答 — 云函数整段返回，签名与其它提供方一致
   返回 { text, model }
   ============================================================ */
export async function streamAskAnswer({
  apiKey,
  systemPrompt,
  chartContext,
  question,
  aiPrefs = { natural: true, length: 'short' },
  previousTurns = [],
  onDelta,
  onModelSwitch,
  signal,
}) {
  if (!apiKey) throw new Error('未配置 EXAONE API 密钥：请在 AI 设置中粘贴你的 EXAONE Key');
  const model = ASK_MODELS[0];
  const messages = [
    { role: 'system', content: buildAskSystemPrompt({ systemPrompt, aiPrefs, chartContext }) },
    ...cleanTurns(previousTurns),
    { role: 'user', content: String(question || '').slice(0, 2000) },
  ];
  onModelSwitch?.(model);
  try {
    const result = await callProxy({
      apiKey,
      model,
      messages,
      temperature: aiPrefs?.temperature ?? 0.55,
      maxTokens: aiPrefs?.length === 'standard' ? 700 : 500,
    }, signal);
    const full = String(result.text || '');
    if (!full.trim()) throw new Error('EXAONE 未返回内容');
    _notifyConn('online');
    onDelta?.(full, full, model);
    return { text: full, model: result.model || model };
  } catch (err) {
    if (signal?.aborted || err?.name === 'AbortError') throw err;
    _notifyConn('offline');
    throw err;
  }
}

/* ============================================================
   工具旁白 — 同一条中转链路
   ============================================================ */
export async function askToolInsight({
  apiKey,
  typeLabel,
  source,
  chartSummary,
  extraSystem = '',
  depth = false,
  signal,
}) {
  if (!apiKey) throw new Error('未配置 EXAONE API 密钥：请在 AI 设置中粘贴你的 EXAONE Key');
  const lenRule = depth
    ? '控制在150字以内。只给一条最具体的可执行建议：说明在用户空间（家/办公）的具体方位、放什么物件、为什么，必须引用其所在城市、坐向、命卦/用神与重点方位，不得泛泛而谈、不得复述测算参数。'
    : '控制在140字以内。';
  const system = '你是一位温暖、清醒、有分寸的决策助理。把工具结果翻译成自然中文：先接住用户的处境，再指出一条最重要的现实重点，最后给一个今天就能完成的小动作。只引用与结果直接相关的依据，不把命理说成事实，不制造恐惧或夸张承诺；涉及健康、财务、法律和关系重大决定时，提醒结合现实信息与专业意见。' + lenRule + String(extraSystem || '').slice(0, 1200);
  const user = `用户刚完成「${typeLabel}」工具。工具结果：${String(source || '').slice(0, 1800)}。用户命盘参考：${String(chartSummary || '').slice(0, 1200)}。`;
  try {
    const result = await callProxy({
      apiKey,
      model: TOOL_MODELS[0],
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.65,
      maxTokens: 400,
    }, signal);
    const full = String(result.text || '').trim();
    if (!full) throw new Error('EXAONE 未返回内容');
    _notifyConn('online');
    return full;
  } catch (err) {
    if (signal?.aborted || err?.name === 'AbortError') throw err;
    _notifyConn('offline');
    throw err;
  }
}

/* ============================================================
   连接检测：带 Key 做一次极短生成；无 Key 直接离线
   ============================================================ */
export async function probeConnection(apiKey) {
  if (!apiKey) { _notifyConn('offline'); return 'offline'; }
  _notifyConn('checking');
  try {
    const result = await callProxy({
      apiKey,
      model: ASK_MODELS[0],
      messages: [{ role: 'user', content: '你好' }],
      temperature: 0,
      maxTokens: 1,
    });
    if (typeof result.text === 'string') { _notifyConn('online'); return 'online'; }
    _notifyConn('offline');
    return 'offline';
  } catch (_) {
    _notifyConn('offline');
    return 'offline';
  }
}
