/* ============================================================
   问问大师 · 内置模型提供方（免密钥大模型）
   ------------------------------------------------------------
   与 deepseek.js / openrouter.js 保持同一接口签名，由 ai/index.js
   统一路由。区别在于：不需要用户填写 API Key，模型由内置模型目录
   动态提供，调用走 SDK 的流式 chat.completions。
   ============================================================ */

import { createWorkBuddyCloud } from '@tencent-ai/workbuddy-cloud-sdk';
import { publicConfig } from './cloud-config.js';

/* 单一客户端，所有模块共用（此处只用 llm）。 */
const cloud = createWorkBuddyCloud({
  endpoint: publicConfig.endpoint,
  oauthRelayBaseUrl: publicConfig.oauthRelayBaseUrl,
  publishableKey: publicConfig.publishableKey,
});

export const ASK_MODELS = [];
export const TOOL_MODELS = [];
export const MODEL_LABELS = {};

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

/* ============================================================
   模型目录 —— 首次调用前必须查询，空列表显式报错
   ============================================================ */
let _catalog = null;   // { ids: string[], labels: Record<string,string> }

async function listModels(force = false) {
  if (_catalog && !force) return _catalog;
  const models = await cloud.llm.models.list();
  const usable = (Array.isArray(models) ? models : [])
    .filter(m => m && m.id && m.disabled !== true && m.enabled !== false);
  if (!usable.length) throw new Error('内置模型暂无可用模型，请稍后再试或在设置中切换服务商');
  const labels = {};
  usable.forEach(m => { labels[m.id] = m.name || m.id; });
  _catalog = { ids: usable.map(m => m.id), labels };
  return _catalog;
}

/** 设置页/诊断用：返回当前可用模型（不触发网络以外的副作用）。 */
export async function getCloudModels(force = false) {
  const c = await listModels(force);
  return c.ids.map(id => ({ id, name: c.labels[id] }));
}

export function modelLabel(id) {
  if (!id) return id;
  return (_catalog && _catalog.labels[id]) || id;
}

/* ============================================================
   应用自有的会话 ID：同一聊天窗口内复用，刷新后从 sessionStorage 恢复
   ============================================================ */
const LS_CONV = 'tj_cloud_conversation_id';
let _memoryConvId = '';

function uuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function conversationId() {
  try {
    let id = globalThis.sessionStorage?.getItem(LS_CONV);
    if (!id) {
      id = uuid();
      globalThis.sessionStorage?.setItem(LS_CONV, id);
    }
    return id;
  } catch (_) {
    if (!_memoryConvId) _memoryConvId = uuid();
    return _memoryConvId;
  }
}

/** 新开一轮对话时轮换 ID（由 UI 调用，可选）。 */
export function rotateConversation() {
  const id = uuid();
  try { globalThis.sessionStorage?.setItem(LS_CONV, id); } catch (_) { _memoryConvId = id; }
  return id;
}

/* ============================================================
   通用工具
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
  if (code.startsWith('auth_')) return '内置模型未授权：请从应用的正式分享链接打开页面';
  if (code.startsWith('quota_')) return '内置模型额度已用尽或触发限流，请稍后再试';
  if (code.startsWith('request_')) return '内置模型请求不被接受：' + (msg || code);
  if (code.startsWith('gateway_') || code.startsWith('model_')) return '模型服务暂时不可用，请稍后重试';
  return '内置模型调用失败：' + (msg || '未知错误');
}

/**
 * 统一的流式收集：每个 create() 调用的 messages[0] 都是 system。
 * 返回累积文本；遇到错误抛出带可读信息的 Error。
 */
async function collectStream({ model, messages, temperature, signal, onChunk }) {
  let full = '';
  const params = {
    model,
    messages,
    stream: true,
    temperature: temperature ?? 0.6,
  };
  if (signal) params.signal = signal;
  for await (const chunk of cloud.llm.chat.completions.create(params)) {
    const content = chunk?.choices?.[0]?.delta?.content;
    if (content) {
      full += content;
      onChunk?.(full, content);
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
  const catalog = await listModels();
  const messages = [
    { role: 'system', content: buildAskSystemPrompt({ systemPrompt, aiPrefs, chartContext }) },
    ...cleanTurns(previousTurns),
    { role: 'user', content: String(question || '').slice(0, 2000) },
  ];
  const temperature = aiPrefs?.temperature ?? 0.55;
  let lastError = '';

  for (const model of catalog.ids.slice(0, 3)) {
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
      lastError = '内置模型未返回内容';
    } catch (err) {
      if (signal?.aborted) throw err;
      lastError = describeError(err);
    }
  }

  _notifyConn('offline');
  throw new Error(lastError || '内置模型模型调用失败');
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
  const catalog = await listModels();
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

  for (const model of catalog.ids.slice(0, 3)) {
    try {
      const full = await collectStream({
        model, messages, temperature: 0.65, signal,
        onChunk: (text, delta) => onDelta?.(text, delta, model),
      });
      if (full.trim()) {
        _notifyConn('online');
        return full.trim();
      }
      lastError = '内置模型未返回内容';
    } catch (err) {
      if (signal?.aborted) throw err;
      lastError = describeError(err);
    }
  }

  _notifyConn('offline');
  throw new Error(lastError || '内置模型模型调用失败');
}

/* ============================================================
   连接检测：拉取模型目录即代表内置模型可用，无需任何密钥
   ============================================================ */
export async function probeConnection() {
  _notifyConn('checking');
  try {
    await listModels();
    _notifyConn('online');
    return 'online';
  } catch (_) {
    _notifyConn('offline');
    return 'offline';
  }
}
