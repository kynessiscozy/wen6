/* ============================================================
   V6.1 人物视频运行时
   ------------------------------------------------------------
   六位引路人的四段视频已生成完毕。漏斗四段与预告页各自直接播放；
   报告页用同一批 invite 视频做「会动的立绘」，但必须遵守：
     · 静止海报（poster = 定妆图）永远先显示，视频解码失败不黑屏；
     · 只在进入视口、页面可见、未被「收起立绘」隐藏、且用户未要求
       减少动效时播放；
     · 退出视口 / 页面隐藏 / 节点被移除时立即暂停，避免后台解码；
     · 视频不参与排盘、评分或任何结论生成，纯演出层。
   ============================================================ */

const watched = new WeakSet();
const inView = new WeakSet();
let observer = null;
let visibilityBound = false;

function motionAllowed() {
  try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch (_) { return true; }
}

function suppressed(video) {
  return !video?.isConnected || document.hidden || !motionAllowed() ||
    !!video.closest('.is-portrait-hidden');
}

function play(video) {
  if (suppressed(video) || (observer && !inView.has(video))) return;
  const attempt = video.play?.();
  attempt?.catch?.(() => { /* 自动播放受限时保留 poster。 */ });
}

function pause(video) {
  try { video.pause?.(); } catch (_) { /* 已卸载的节点忽略。 */ }
}

/* Older WebViews may lack IntersectionObserver. Wait until the node is in the
   document, then treat any connected, visible page as in-view; visibilitychange
   and the portrait toggle still pause/resume it. */
function waitForConnection(video) {
  if (!video.isConnected) { requestAnimationFrame(() => waitForConnection(video)); return; }
  inView.add(video);
  play(video);
}

function ensureObserver() {
  if (visibilityBound) return observer;
  visibilityBound = true;
  document.addEventListener('visibilitychange', syncGuideVideos);
  if (typeof IntersectionObserver === 'function') {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (!video.isConnected) { observer.unobserve(video); inView.delete(video); pause(video); return; }
        if (entry.isIntersecting) inView.add(video);
        else inView.delete(video);
        play(video);
        if (!entry.isIntersecting) pause(video);
      });
    }, { threshold: .12 });
  }
  return observer;
}

/** Re-evaluate all mounted guide videos (e.g. after the portrait toggle). */
export function syncGuideVideos() {
  document.querySelectorAll('video[data-guide-video]').forEach(video => {
    if (suppressed(video)) pause(video);
    else play(video);
  });
}

/** Build one muted, looping, poster-backed video element from a character motion spec. */
export function createGuideVideo(motion, className) {
  const video = document.createElement('video');
  video.className = className;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'none';
  video.poster = motion.poster;
  video.src = motion.src;
  video.width = motion.width;
  video.height = motion.height;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.setAttribute('tabindex', '-1');
  video.setAttribute('disablepictureinpicture', '');
  return video;
}

/** Register a guide video for viewport-aware playback. Idempotent per element. */
export function mountGuideVideo(video) {
  if (!video || watched.has(video)) return;
  watched.add(video);
  video.dataset.guideVideo = 'true';
  video.addEventListener('playing', () => {
    video.classList.add('is-ready');
    video.classList.remove('is-fallback');
  });
  video.addEventListener('error', () => {
    video.classList.remove('is-ready');
    video.classList.add('is-fallback');
  });
  const io = ensureObserver();
  if (io) io.observe(video);
  else waitForConnection(video);
}
