/* 问问大师 · PWA 安装引导
   ------------------------------------------------------------
   独立普通脚本（无构建依赖），index.html 与 funnel.html 共用。
   Chromium：接住 beforeinstallprompt，提供一键「安装到桌面」。
   iOS / 无自动安装事件：给出「分享 → 添加到主屏幕」引导。
   已安装、用户关闭过、或不在安全上下文时不打扰。 */
(function () {
  'use strict';

  var LS_TIP = 'wen_pwa_tip_dismissed';
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    navigator.standalone === true;
  if (standalone) return;
  try { if (localStorage.getItem(LS_TIP) === '1') return; } catch (_) {}
  // 只有安全上下文才能注册 SW / 安装；http 内网预览不弹引导。
  if (!window.isSecureContext) return;

  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
  var deferredPrompt = null;
  var button = null;
  var tip = null;

  var CSS = [
    '.wb-pwa-btn,.wb-pwa-tip{position:fixed;z-index:9998;box-sizing:border-box;',
    'font:500 13px/1.35 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;',
    '-webkit-font-smoothing:antialiased}',
    '.wb-pwa-btn{right:14px;bottom:calc(90px + env(safe-area-inset-bottom));display:none;',
    'align-items:center;gap:7px;padding:10px 14px;border:1px solid rgba(127,127,127,.28);',
    'border-radius:999px;background:rgba(255,255,255,.94);color:#1f2329;cursor:pointer;',
    'box-shadow:0 8px 28px rgba(0,0,0,.16);backdrop-filter:blur(10px)}',
    '.wb-pwa-btn svg{width:16px;height:16px;flex:none;stroke:currentColor;fill:none;stroke-width:1.8}',
    '.wb-pwa-tip{left:12px;right:12px;bottom:calc(14px + env(safe-area-inset-bottom));display:none;',
    'align-items:center;gap:10px;padding:12px 12px 12px 14px;border:1px solid rgba(127,127,127,.28);',
    'border-radius:14px;background:rgba(255,255,255,.96);color:#1f2329;',
    'box-shadow:0 10px 34px rgba(0,0,0,.18);backdrop-filter:blur(10px)}',
    '.wb-pwa-tip .wb-pwa-txt{flex:1;min-width:0}',
    '.wb-pwa-tip .wb-pwa-txt b{display:block;font-size:13px;margin-bottom:2px}',
    '.wb-pwa-tip .wb-pwa-txt span{display:block;font-size:12px;opacity:.72;line-height:1.45}',
    '.wb-pwa-close{flex:none;width:30px;height:30px;border:0;border-radius:50%;background:rgba(127,127,127,.14);',
    'color:inherit;font-size:17px;line-height:30px;text-align:center;cursor:pointer;padding:0}',
    '@media (prefers-color-scheme:dark){',
    '.wb-pwa-btn,.wb-pwa-tip{background:rgba(28,32,38,.94);color:#f2f4f7;border-color:rgba(255,255,255,.18)}',
    '.wb-pwa-close{background:rgba(255,255,255,.14)}}',
    '@media (min-width:640px){.wb-pwa-tip{left:auto;right:16px;max-width:360px}}',
    /* 漏斗首屏专用：底部固定 90px 会压到「进入命盘厅」主按钮（刘海屏下安全区更大，压得更明显）。
       只在 funnel.html（html[data-funnel-persona]）把按钮移到右上角人物切换控件下方。 */
    'html[data-funnel-persona] .wb-pwa-btn{bottom:auto;top:calc(100px + env(safe-area-inset-top, 0px))}'
  ].join('');

  var ICON_DOWNLOAD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_SHARE = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:20px;height:20px;flex:none;stroke:currentColor;fill:none;stroke-width:1.8"><path d="M12 16V3m0 0L8 7m4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function remember() {
    try { localStorage.setItem(LS_TIP, '1'); } catch (_) {}
  }
  function hideAll() {
    if (button) button.style.display = 'none';
    if (tip) tip.style.display = 'none';
  }
  function showInstallButton() {
    if (!button || !deferredPrompt) return;
    if (tip) tip.style.display = 'none';
    button.style.display = 'flex';
  }

  function mount() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    button = document.createElement('button');
    button.type = 'button';
    button.className = 'wb-pwa-btn';
    button.setAttribute('aria-label', '把问问大师安装到桌面');
    button.innerHTML = ICON_DOWNLOAD + '<span>安装到桌面</span>';
    button.addEventListener('click', async function () {
      if (!deferredPrompt) return;
      var prompt = deferredPrompt;
      deferredPrompt = null;
      hideAll();
      try {
        await prompt.prompt();
        var choice = await prompt.userChoice;
        if (choice && choice.outcome === 'dismissed') remember();
      } catch (_) { /* 用户或系统取消，不重复打扰 */ }
    });
    document.body.appendChild(button);

    tip = document.createElement('div');
    tip.className = 'wb-pwa-tip';
    tip.setAttribute('role', 'status');
    tip.innerHTML = ICON_SHARE +
      '<div class="wb-pwa-txt"><b>把问问大师放到主屏幕</b>' +
      '<span>点底部「分享」按钮，再选「添加到主屏幕」，即可像 App 一样全屏打开。</span></div>' +
      '<button type="button" class="wb-pwa-close" aria-label="不再提示">&times;</button>';
    tip.querySelector('.wb-pwa-close').addEventListener('click', function () {
      remember();
      hideAll();
    });
    document.body.appendChild(tip);

    if (deferredPrompt) showInstallButton();
    else if (isIOS) tip.style.display = 'flex';
  }

  // 尽早接住事件：Chrome 要求 prompt() 由用户手势触发，但事件本身必须先存下来。
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    showInstallButton();
  });
  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    remember();
    hideAll();
  });

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, { once: true });
})();
