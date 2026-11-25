// exaone-proxy — CloudBase 云函数：把问问对话的请求转发到 LG EXAONE API。
// EXAONE 接口不允许浏览器跨域直连（CORS 预检被拒），故由云函数中转。
// 用户的 Key 只随请求传入（或读函数环境变量 EXAONE_KEY），不落盘、不写日志。
const ENDPOINT = 'https://api.exaone.ai/v1/chat/completions';
const DEFAULT_MODEL = 'k-exaone_v2.5';

exports.main = async (event) => {
  const apiKey = (event && event.apiKey) || process.env.EXAONE_KEY || '';
  if (!apiKey) return { error: 'missing api key', code: 'missing_key' };
  const messages = event && Array.isArray(event.messages) ? event.messages : null;
  if (!messages || !messages.length) return { error: 'missing messages', code: 'bad_request' };
  const body = {
    model: event.model || DEFAULT_MODEL,
    messages,
    temperature: typeof event.temperature === 'number' ? event.temperature : 0.6,
  };
  if (event.maxTokens) body.max_tokens = event.maxTokens;
  let resp;
  try {
    resp = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { error: 'upstream unreachable: ' + ((e && e.message) || e), code: 'network' };
  }
  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    return { error: (data && data.error && data.error.message) || ('HTTP ' + resp.status), code: 'upstream_' + resp.status };
  }
  const choice = data && data.choices && data.choices[0];
  const text = (choice && choice.message && choice.message.content) || '';
  return { text, model: (data && data.model) || body.model };
};
