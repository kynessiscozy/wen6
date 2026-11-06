/* ============================================================
   问问大师 · OpenRouter 提供方（OpenAI 兼容 / SSE 流式）
   ------------------------------------------------------------
   公共流式/超时/状态机实现见 openai-compatible.js，这里只放差异配置。
   ============================================================ */

import { createOpenAICompatibleProvider } from './openai-compatible.js';

export const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
export const ASK_MODELS = [
  'inclusionai/ling-3.0-flash:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'openai/gpt-oss-20b:free',
];
export const TOOL_MODELS = [
  'inclusionai/ling-3.0-flash:free',
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-20b:free',
];

export const MODEL_LABELS = {
  'inclusionai/ling-3.0-flash:free': 'Ling 3.0 Flash',
  'google/gemma-4-31b-it:free': 'Gemma 4 31B',
  'google/gemma-4-26b-a4b-it:free': 'Gemma 4 26B',
  'openai/gpt-oss-20b:free': 'GPT-OSS 20B',
};

const provider = createOpenAICompatibleProvider({
  name: 'OpenRouter',
  base: OPENROUTER_BASE,
  probePath: '/models',
  askModels: ASK_MODELS,
  toolModels: TOOL_MODELS,
  modelLabels: MODEL_LABELS,
  labelFallback: id => (id.split('/').pop() || '').replace(/:free$/, ''),
  buildHeaders: (apiKey, title) => ({
    Authorization: 'Bearer ' + apiKey,
    'Content-Type': 'application/json',
    'X-Title': title,
    'HTTP-Referer': typeof location !== 'undefined' ? location.origin : 'https://wenwen-master-75489.app.workbuddy.host/',
  }),
  askTokens: { standard: 320, short: 240 },
  toolTokens: { depth: 360, short: 180 },
  lenRule: {
    depth: '请展开到200–300字做具体拆解：明确指出用户在哪个方位、放什么物件、为什么，并给出今天就能执行的小动作。',
    short: '控制在140字以内。',
  },
});

export const getConnState = provider.getConnState;
export const onConnChange = provider.onConnChange;
export const probeConnection = provider.probeConnection;
export const streamAskAnswer = provider.streamAskAnswer;
export const askToolInsight = provider.askToolInsight;
export const modelLabel = provider.modelLabel;
