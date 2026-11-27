/* 问问大师 PWA：离线可用 + 秒开的缓存策略。
   静态资源带 hash，可长期缓存；HTML 走 network-first 保证更新及时。 */
const CACHE = 'wenda-cache-v90';
const BASE = './';

/* 安装期预缓存：应用骨架（HTML / JS / CSS）+ 下面 CORE_ASSETS。
   预缓存集合由两类构成，全部被离线回归测试锁定：
   1. 角色 / 场景 / 双子素材 —— tools/test-build-integrity.mjs 从 HOME_THEMES
      与 CHAT_MASTER 注册表逐项强制登记，任一引路人离线都能完整推演；
   2. 漏斗立绘 / 推演演出 / 图标 —— tools/test-home-offline.mjs、
      tools/test-guide-v61.mjs、tools/test-service-worker-upgrade.mjs 锁定。
   其余 art（视频、海报、活动图等）不预缓存，走 fetch 处理器的运行时回填，
   首次在线访问后即可离线。相对旧版手工清单（190 项 / ~13.8 MB），
   预缓存约 8.9 MB。调整 CORE_ASSETS 前请先跑这三个测试。 */
const CORE_ASSETS = [
  // 注册表驱动的角色 / 场景 / 双子素材（tools/test-build-integrity.mjs 强制）：
  // 任一引路人在离线时都能完整演出与阅读报告。
  'art/diyan-action.webp',
  'art/diyan-v61-avatar.webp',
  'art/diyan-v61.webp',
  'art/earthfire-hall-mobile.webp',
  'art/earthfire-hall-wide.webp',
  'art/luye-fullbody-avatar.webp',
  'art/luye-fullbody.webp',
  'art/luye-room-mobile.webp',
  'art/luye-room-wide.webp',
  'art/master-twin-indigo-avatar.webp',
  'art/master-twin-indigo.webp',
  'art/master-twin-rose-avatar.webp',
  'art/master-twin-rose.webp',
  'art/moon-fox-study-mobile.webp',
  'art/moon-fox-study-wide.webp',
  'art/moonfox-action.webp',
  'art/moonfox-v61-avatar.webp',
  'art/moonfox-v61.webp',
  'art/muse-action.webp',
  'art/muse-hall-mobile.webp',
  'art/muse-hall-wide.webp',
  'art/muse-v61-avatar.webp',
  'art/muse-v61.webp',
  'art/qinglan-cinema3d-avatar.webp',
  'art/qinglan-cinema3d-blink-v2.webp',
  'art/qinglan-cinema3d-speak.webp',
  'art/qinglan-cinema3d.webp',
  'art/qinglan-room-mobile.webp',
  'art/qinglan-room-wide.webp',
  'art/rongrong-cinema3d-avatar.webp',
  'art/rongrong-cinema3d-blink-v2.webp',
  'art/rongrong-cinema3d-speak.webp',
  'art/rongrong-cinema3d.webp',
  'art/rongrong-pawbell.webp',
  'art/rongrong-room-mobile.webp',
  'art/rongrong-room-wide.webp',
  'art/sacred-study-mobile.webp',
  'art/sacred-study-wide.webp',
  'art/suyan-fullbody-avatar.webp',
  'art/suyan-fullbody.webp',
  'art/suyan-room-mobile.webp',
  'art/suyan-room-wide.webp',
  'art/wenwen-cinema3d-avatar.webp',
  'art/wenwen-cinema3d-blink-v2.webp',
  'art/wenwen-cinema3d-speak.webp',
  'art/wenwen-cinema3d.webp',
  'art/wenwen-cloud-trail.webp',
  'art/wenwen-lantern.webp',
  'art/xingling-action.webp',
  'art/xingling-room-mobile.webp',
  'art/xingling-room-wide.webp',
  'art/xingling-v61-avatar.webp',
  'art/xingling-v61.webp',
  'art/xingluo-action.webp',
  'art/xingluo-observatory-mobile.webp',
  'art/xingluo-observatory-wide.webp',
  'art/xingluo-v61-avatar.webp',
  'art/xingluo-v61.webp',
  'art/yuchen-action.webp',
  'art/yuchen-hall-mobile.webp',
  'art/yuchen-hall-wide.webp',
  'art/yuchen-v61-avatar.webp',
  'art/yuchen-v61.webp',
  'art/zhiya-cinema3d-avatar.webp',
  'art/zhiya-cinema3d-blink-v2.webp',
  'art/zhiya-cinema3d-speak.webp',
  'art/zhiya-cinema3d.webp',
  'art/zhiya-crane.webp',
  'art/zhiya-room-mobile.webp',
  'art/zhiya-room-wide.webp',
  // 漏斗六位引路人立绘：离线漏斗与待机入口卡（含四位必选项）
  'art/diyan-lord.webp', 'art/yuchen-lord.webp', 'art/yuebai-lord.webp', 'art/xiyao-lord.webp',
  'art/muse-lord.webp', 'art/xingluo-lord.webp',
  // 推演演出：离线也能完成一次真实推演
  'art/awakening-scroll.webp', 'art/awakening-fox-fan.webp', 'art/awakening-phoenix-wing.webp',
  'art/cta-foil.webp',
  // 默认同行立绘：缓存升级回归依赖（缺失时可从旧缓存沿用）
  'art/wenwen-reimagined.webp',
  // 图标与清单
  'manifest.webmanifest', 'pwa-install.js', 'icon.svg', 'icon-192.png', 'icon-512.png',
  'icon-twins-128.png', 'icon-twins-192.png', 'icon-twins-512.png',
  'icon-twins-maskable-192.png', 'icon-twins-maskable-512.png', 'apple-touch-icon-twins.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Never replace a working offline version unless the new HTML is available.
    await cache.add(BASE);
    // funnel.html is a separate navigation target (the fallback surface links
    // back to it). Keep its own cached copy instead of serving index.html.
    await cache.add(BASE + 'funnel.html');
    await cache.add(BASE + 'index.html');
    // Production emits a manifest of hashed application chunks. Fetch them at
    // install time so a first visit can be used offline after activation.
    try {
      const response = await fetch(BASE + 'offline-assets.json', { cache: 'no-store' });
      if (response.ok) {
        const text = await response.text();
        // Vite's dev server responds to unknown URLs with its HTML fallback.
        const assets = text.trimStart().startsWith('<') ? [] : JSON.parse(text);
        if (Array.isArray(assets)) await Promise.all(assets.filter(asset => /^assets\/[\w.\-]+\.(?:js|css)$/.test(asset)).map(asset => cache.add(BASE + asset)));
      }
    } catch (error) {
      // Do not replace a working version with an incomplete installation.
      throw error;
    }
    await Promise.all(CORE_ASSETS.map(async (asset) => {
      const url = BASE + asset;
      try {
        await cache.add(url);
      } catch {
        // Keep a previous offline copy if a nonessential asset is unavailable.
        const previous = await caches.match(url);
        if (previous) await cache.put(url, previous);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('wenda-cache-') && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 只缓存本站，AI API 等外部请求不碰

  // HTML: never replace a usable offline page with an error response.
  if (req.mode === 'navigate') {
    const isRoot = url.pathname === new URL(BASE, self.location.href).pathname;
    const network = fetch(req);
    e.waitUntil(network.then((res) => {
      if (res.ok) {
        // Cache each navigation under its own URL: caching funnel.html under
        // BASE would make offline visits to the app root open the funnel page.
        return caches.open(CACHE).then((cache) => cache.put(isRoot ? BASE : req, res.clone()));
      }
    }).catch(() => {}));
    const offline = () => caches.match(req).then(async (hit) => {
      if (hit) return hit;
      // Query strings (e.g. ?stats or ?panel=guide) do not change the shell.
      // Never turn an offline funnel navigation into the app's index page.
      const path = url.pathname.slice(new URL(BASE, self.location.href).pathname.length);
      if (path === 'funnel.html') return caches.match(BASE + 'funnel.html');
      if (isRoot || path === 'index.html') return (await caches.match(BASE + 'index.html')) || caches.match(BASE);
      return caches.match(BASE);
    });
    e.respondWith(network.then((res) => {
      if (res.ok) return res;
      return offline().then((hit) => hit || res);
    }).catch(offline));
    return;
  }

  const basePath = new URL(BASE, self.location.href).pathname;
  const relativePath = url.pathname.startsWith(basePath) ? url.pathname.slice(basePath.length) : '';

  // Vite's development modules and styles reuse URLs as files change. Never
  // serve them from CacheStorage; a stale module can break a newly loaded page.
  if (/^(?:src\/|@vite\/|@id\/|node_modules\/\.vite\/)/.test(relativePath)) return;

  // Artwork keeps readable, un-hashed names. Prefer fresh artwork online while
  // keeping the pre-cached copy available for offline use.
  if (relativePath.startsWith('art/')) {
    const network = fetch(req);
    e.waitUntil(network.then((res) => {
      if (res && res.ok && res.type === 'basic') {
        const copy = res.clone();
        return caches.open(CACHE).then((c) => c.put(req, copy));
      }
    }).catch(() => {}));
    e.respondWith(network.then((res) => {
      if (res.ok) return res;
      return caches.match(req).then((hit) => hit || res);
    }).catch(() => caches.match(req)));
    return;
  }

  // 带 hash 的资源与其他静态：cache-first，miss 再网络并回填
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
