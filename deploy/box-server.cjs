/* ============================================================
   问问大师 · 小电脑（Simular Box）本机部署服务器
   ------------------------------------------------------------
   用途：在 Box 本机伺服 dist/ 静态站，并提供同源中转端点
   POST /api/exaone —— EXAONE 接口不允许浏览器跨域直连，
   由本服务器转发（请求体 {apiKey, model, messages, temperature,
   maxTokens}，返回 {text, model} 或 {error, code}，与
   src/ai/exaone.js 的约定一致）。Key 只随请求转发，不落盘、
   不写日志。仅监听 127.0.0.1:8080，供 Box 桌面浏览器本机访问。
   运行：node deploy/box-server.cjs（工作目录任意，根目录按本文件位置推导）
   ============================================================ */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'dist');
const EXAONE_ENDPOINT = 'https://api.exaone.ai/v1/chat/completions';
const DEFAULT_MODEL = 'k-exaone_v2.5';
const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

function sendJson(res, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(body);
}

function handleExaone(req, res) {
  let raw = '';
  req.on('data', (chunk) => {
    raw += chunk;
    if (raw.length > 1_000_000) req.destroy();
  });
  req.on('end', async () => {
    let event = {};
    try { event = JSON.parse(raw || '{}'); } catch (_) { /* 落到 missing 分支 */ }
    const apiKey = event.apiKey || process.env.EXAONE_KEY || '';
    if (!apiKey) return sendJson(res, { error: 'missing api key', code: 'missing_key' });
    const messages = Array.isArray(event.messages) ? event.messages : null;
    if (!messages || !messages.length) return sendJson(res, { error: 'missing messages', code: 'bad_request' });
    const body = {
      model: event.model || DEFAULT_MODEL,
      messages,
      temperature: typeof event.temperature === 'number' ? event.temperature : 0.6,
    };
    if (event.maxTokens) body.max_tokens = event.maxTokens;
    let resp;
    try {
      resp = await fetch(EXAONE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });
    } catch (e) {
      return sendJson(res, { error: 'upstream unreachable: ' + ((e && e.message) || e), code: 'network' });
    }
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      return sendJson(res, {
        error: (data && data.error && data.error.message) || ('HTTP ' + resp.status),
        code: 'upstream_' + resp.status,
      });
    }
    const choice = data && data.choices && data.choices[0];
    const text = (choice && choice.message && choice.message.content) || '';
    return sendJson(res, { text, model: (data && data.model) || body.model });
  });
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (req.method === 'POST' && urlPath === '/api/exaone') return handleExaone(req, res);
  let p = urlPath;
  if (p === '/') p = '/funnel.html';
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404);
    return res.end('not found');
  }
  res.writeHead(200, {
    'Content-Type': mime[path.extname(f)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(f).pipe(res);
}).listen(8080, '127.0.0.1', () => console.log('serving on 8080'));
