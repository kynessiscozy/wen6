/* ============================================================
   问问大师 · DeepSeek 提供方（OpenAI 兼容 / SSE 流式）
   ------------------------------------------------------------
   端点：https://api.deepseek.com/chat/completions
   模型：deepseek-v4-flash（主）/ deepseek-chat (V3) / deepseek-reasoner (R1)
   说明：浏览器直连，密钥仅存本地；CORS 已确认支持跨域。
   公共流式/超时/状态机实现见 openai-compatible.js，这里只放差异配置。
   ============================================================ */

import { createOpenAICompatibleProvider } from './openai-compatible.js';

export const DEEPSEEK_BASE = 'https://api.deepseek.com';
export const ASK_MODELS = ['deepseek-v4-flash', 'deepseek-chat', 'deepseek-reasoner'];
export const TOOL_MODELS = ['deepseek-v4-flash', 'deepseek-chat'];

export const MODEL_LABELS = {
  'deepseek-v4-flash': 'DeepSeek V4 Flash',
  'deepseek-chat': 'DeepSeek V3',
  'deepseek-reasoner': 'DeepSeek R1',
};

const provider = createOpenAICompatibleProvider({
  name: 'DeepSeek',
  base: DEEPSEEK_BASE,
  probePath: '/user/balance',
  askModels: ASK_MODELS,
  toolModels: TOOL_MODELS,
  modelLabels: MODEL_LABELS,
  labelFallback: id => id.replace(/^deepseek-/, 'DeepSeek '),
  buildHeaders: apiKey => ({
    Authorization: 'Bearer ' + apiKey,
    'Content-Type': 'application/json',
  }),
  askTokens: { standard: 360, short: 280 },
  toolTokens: { depth: 240, short: 180 },
  lenRule: {
    depth: '控制在150字以内。只给一条最具体的可执行建议：说明在用户空间（家/办公）的具体方位、放什么物件、为什么，必须引用其所在城市、坐向、命卦/用神与重点方位，不得泛泛而谈、不得复述测算参数。',
    short: '控制在140字以内。',
  },
});

export const getConnState = provider.getConnState;
export const onConnChange = provider.onConnChange;
export const probeConnection = provider.probeConnection;
export const streamAskAnswer = provider.streamAskAnswer;
export const askToolInsight = provider.askToolInsight;
export const modelLabel = provider.modelLabel;
