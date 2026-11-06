/* ============================================================
   问问大师 · AI 提供方门面
   ------------------------------------------------------------
   统一导出，调用方无需感知底层是哪家服务。
   默认提供方：cloudbase（自有云开发环境 AI，免密钥），可在设置中切换。
   切换状态存于 localStorage['tj_ai_provider']。
   ============================================================ */

import * as openrouter from './openrouter.js';
import * as deepseek from './deepseek.js';
import * as workbuddy from './workbuddy-cloud.js';
import * as cloudbaseAi from './cloudbase-ai.js';

const LS_PROVIDER = 'tj_ai_provider';
const PROVIDERS = ['cloudbase', 'workbuddy', 'deepseek', 'openrouter'];

export function getProvider() {
  try { return localStorage.getItem(LS_PROVIDER) || 'cloudbase'; } catch (_) { return 'cloudbase'; }
}
export function setProvider(p) {
  if (!PROVIDERS.includes(p)) return;
  try { localStorage.setItem(LS_PROVIDER, p); } catch (_) {}
}
/** 云端提供方（cloudbase / workbuddy）不需要用户填写 API Key。 */
export function providerNeedsKey() { const p = getProvider(); return p !== 'workbuddy' && p !== 'cloudbase'; }
function active() {
  const p = getProvider();
  if (p === 'openrouter') return openrouter;
  if (p === 'deepseek') return deepseek;
  if (p === 'workbuddy') return workbuddy;
  return cloudbaseAi;
}

/* —— 自动路由到当前提供方（签名一致）—— */
export const streamAskAnswer = (opts) => active().streamAskAnswer(opts);
export const askToolInsight  = (opts) => active().askToolInsight(opts);
export const probeConnection = (key) => active().probeConnection(key);
export const getConnState    = () => active().getConnState();
export const modelLabel      = (id) => active().modelLabel(id);

// 连接状态监听挂到所有提供方，保证切换后 UI 仍能收到更新
export function onConnChange(fn) {
  const offOpenrouter = openrouter.onConnChange(fn);
  const offDeepseek = deepseek.onConnChange(fn);
  const offWorkbuddy = workbuddy.onConnChange(fn);
  const offCloudbase = cloudbaseAi.onConnChange(fn);
  return () => {
    offOpenrouter && offOpenrouter();
    offDeepseek && offDeepseek();
    offWorkbuddy && offWorkbuddy();
    offCloudbase && offCloudbase();
  };
}

/* —— 提供方常量（供设置页读取）—— */
export const DEEPSEEK_BASE        = deepseek.DEEPSEEK_BASE;
export const DEEPSEEK_ASK_MODELS  = deepseek.ASK_MODELS;
export const DEEPSEEK_TOOL_MODELS = deepseek.TOOL_MODELS;
export const OPENROUTER_BASE      = openrouter.OPENROUTER_BASE;
export const ASK_MODELS           = openrouter.ASK_MODELS;
export const TOOL_MODELS          = openrouter.TOOL_MODELS;
export const MODEL_LABELS         = openrouter.MODEL_LABELS;

/* —— 内置模型诊断入口 —— */
export { getCloudModels, rotateConversation } from './workbuddy-cloud.js';

/* —— 命理/知识库能力（与提供方无关）—— */
export { KB } from './kb.js';
export { KBSearch, smartAnswer, extractIntents, buildBaziContext, buildWesternContext } from './smart-answer.js';
export { getLayoffAstroRisk } from './risk.js';
export { generateAnswerFallback } from './fallback.js';
