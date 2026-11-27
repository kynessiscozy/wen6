import { KB } from '../ai/kb.js';

/* ============================================================
   结果页导航（2026-11 重构）
   ------------------------------------------------------------
   DOCK 五个入口：报告 / 命理 / WEN / 星相 / 工具。

   · 命理仍由三个真实分区组成（#s-ming / #s-yun / #s-rel），
     它们不再是 DOCK 项，而是命理页顶栏的「命盘 / 运势 / 关系」切换。
     保留这三个 id 是因为报告渲染、速读证据锚点、AI 路由与引路人
     路线都直接用它们定位；换 id 只会制造无意义的别名层。
   · 星相是独立分区 #s-astro，内部再按「本命 / 运程 / 灵数」分域。
   · WEN 是 #aiSheet 的整页形态（见 ask-panel.js），不占用 .sec。
   ============================================================ */

const EAST_SECS = ['s-ming', 's-yun', 's-rel'];
const DOCK_VIEWS = {
  's-report': 'report',
  's-ming': 'ming', 's-yun': 'ming', 's-rel': 'ming',
  's-astro': 'astro',
  's-adv': 'tools',
  's-wen': 'wen',
};
const ASTRO_TABS = { 'astro-core': 'astro', 'astro-elements': 'astro', 'astro-planets': 'astro', 'astro-portrait': 'astro',
  'horoscope-today': 'horo', 'horoscope-all': 'horo', 'horoscope-macro': 'horo',
  'num-core': 'num', 'num-grid': 'num', 'num-year': 'num' };

let eastView = 's-ming';

function isEastern(secId) { return EAST_SECS.includes(secId); }

/** 命理页顶栏「命盘 / 运势 / 关系」同步。 */
function syncEastSwitch(secId) {
  const group = document.getElementById('eastModeGroup');
  const active = isEastern(secId) ? secId : (document.querySelector('.sec.active')?.id);
  const show = isEastern(active);
  if (group) {
    group.hidden = !show;
    group.querySelectorAll('[data-east]').forEach(btn => {
      const on = btn.dataset.east === active;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });
  }
  if (show) eastView = active;
  syncTopTitle(DOCK_VIEWS[active] || 'report');
  document.body.dataset.resultView = DOCK_VIEWS[active] || 'report';
}

const TOP_TITLES = {
  report: ['报告', '引路人把整份报告读薄成一页。'],
  ming: ['命理', '东方命理：命盘、运势、关系，三个角度看同一张盘。'],
  astro: ['星相', '西方星相：本命、运程、灵数，换成天体视角再看一遍。'],
  tools: ['工具', '决策与大师工具，需要算得更细时再用。'],
};

/** 顶栏身份行：固定吸顶后，用户需要一眼知道自己在哪一页。 */
function syncTopTitle(view) {
  const host = document.getElementById('p2TopTitle');
  if (!host) return;
  const [title] = TOP_TITLES[view] || [];
  host.hidden = !title;
  host.textContent = '';
  if (!title) return;
  const strong = document.createElement('strong');
  strong.textContent = title;
  host.append(strong);
}

/** DOCK 高亮：命理三个分区共用一个入口。 */
function syncDock(view) {
  document.querySelectorAll('.tab-item').forEach(item => {
    item.classList.toggle('active', (DOCK_VIEWS[item.dataset.sec] || item.dataset.sec) === view);
  });
  syncTopTitle(view);
  const active = document.querySelector('.tab-item.active');
  if (active && typeof moveTabIndicator === 'function') moveTabIndicator(active);
}

/** 星相页内部「本命 / 运程 / 灵数」切换。 */
export function activateAstroTab(key) {
  const root = document.getElementById('s-astro');
  if (!root) return;
  let found = false;
  root.querySelectorAll('.astro-tab').forEach(t => {
    const on = t.dataset.astro === key;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', on ? 'true' : 'false');
    if (on) found = true;
  });
  root.querySelectorAll('.astro-pane').forEach(p => p.classList.toggle('active', p.dataset.astro === key));
  if (!found) return;
  const target = root.querySelector(`.astro-pane[data-astro="${key}"]`);
  if (target) {
    // 让 3D 场景在面板真正可见后才拿到尺寸。
    window.dispatchEvent(new CustomEvent('tj:astro-tab', { detail: { key } }));
    if (typeof window.syncWestern3D === 'function') window.syncWestern3D();
  }
}

/**
 * 统一的结果页视图切换：DOCK 入口、命理顶部切换、AI 路由与引路人路线
 * 都走这里，状态只写一次，避免「DOCK 高亮说命理、内容却是星相」。
 */
export function openResultView(secId) {
  const section = document.getElementById(secId);
  if (!section) return false;
  // 星相与命理互斥：切页时先收起仍在整页形态的 WEN。
  if (document.body.classList.contains('wen-page')) window.closeAskPage?.();

  document.querySelectorAll('.sec').forEach(s => s.classList.remove('active'));
  section.classList.add('active');
  if (isEastern(secId)) {
    setSystemMode('eastern');
  } else if (secId === 's-astro') {
    setSystemMode('western');
    if (!section.querySelector('.astro-pane.active')) activateAstroTab('astro');
  } else {
    setSystemMode('eastern');
  }
  syncEastSwitch(secId);
  syncDock(DOCK_VIEWS[secId] || 'report');
  const scroll = document.getElementById('p2Scroll');
  if (scroll) scroll.scrollTop = 0;
  return true;
}

function setSystemMode(mode) {
  if (typeof window.setSystemMode === 'function') { window.setSystemMode(mode); return; }
  document.body.setAttribute('data-system-mode', mode);
  document.documentElement.setAttribute('data-system-mode', mode);
}

/** 报告页的目录跳转：命理 / 星相都落到对应分区与子域。 */
function viewForJump(secId, cardKey) {
  if (secId === 's-astro') return 's-astro';
  if (DOCK_VIEWS[secId]) return secId;
  if (cardKey && KB?.routes?.[cardKey]) return KB.routes[cardKey].sec;
  return secId;
}

export function jumpTo(secId, cardKey, fieldKey) {
  // 关 AI 面板（整页形态的 WEN 也要先退出）
  if (document.body.classList.contains('wen-page')) window.closeAskPage?.();
  else if (typeof window.closeAsk === 'function') window.closeAsk();
  // 若 secId 为空，从 KB.routes 推断；同时取 sub（合并卡子区）
  let subKey = null, routeCard = cardKey;
  if (cardKey && KB && KB.routes && KB.routes[cardKey]) {
    const r = KB.routes[cardKey];
    if (!secId) secId = r.sec;
    if (r.sub) subKey = r.sub;
    routeCard = r.card; // 重定向到真正的 DOM data-card
  }
  secId = viewForJump(secId, routeCard);
  const tab = document.querySelector(`.tab-item[data-sec="${DOCK_VIEWS[secId] === 'ming' ? eastView : secId}"]`) ||
    document.querySelector(`.tab-item[data-sec="${secId}"]`);
  // 命理三兄弟共用一个 DOCK 入口，直接开分区而不是点 DOCK。
  if (DOCK_VIEWS[secId] === 'ming' && !tab?.dataset.sec?.startsWith('s-')) {
    openResultView(secId);
  } else if (tab) {
    if (tab.dataset.sec !== secId && DOCK_VIEWS[secId] !== 'ming') tab.click();
    else if (DOCK_VIEWS[secId] === 'ming' && isEastern(secId)) openResultView(secId);
  } else {
    openResultView(secId);
  }
  // 重写：使用 routeCard 进行查找
  cardKey = routeCard;

  // 滚动 + 高亮
  setTimeout(() => {
    // 星相里的卡片：先唤醒所在星相分域，再找卡片
    const astroKey = cardKey && ASTRO_TABS[cardKey];
    if (astroKey) {
      activateAstroTab(astroKey);
      window.dispatchEvent(new CustomEvent('tj:astro-tab', { detail: { key: astroKey } }));
    }
    let el = null;
    if (cardKey) el = document.querySelector(`[data-card="${cardKey}"]`);
    if (!el) el = document.getElementById(secId);
    if (!el) return;
    // 卡片本身折叠时先展开，字段才有可滚动的位置
    if (el.classList.contains('collapsed')) el.classList.remove('collapsed');
    // 档位面板（年/月/周/日）里的卡片：先唤醒所在档位再滚动
    const yunPane = el.closest && el.closest('.yun-pane');
    if (yunPane && typeof window.TJActivateYunTab === 'function') window.TJActivateYunTab(yunPane.dataset.yun);
    // 星相卡片所在分域
    const astroPane = el.closest && el.closest('.astro-pane');
    if (astroPane) activateAstroTab(astroPane.dataset.astro);
    // 东方分区标签里的卡片：先唤醒所在面板，避免滚动到隐藏内容。
    const groupedPane = el.closest && el.closest('.ming-pane,.rel-pane');
    if (groupedPane) {
      const activate = [['ming', 'TJActivateMingTab'], ['rel', 'TJActivateRelTab']]
        .find(([kind]) => groupedPane.classList.contains(kind + '-pane'));
      const paneKey = activate && groupedPane.dataset[activate[0]];
      if (paneKey && typeof window[activate[1]] === 'function') window[activate[1]](paneKey);
    }
    // 新版分区标签把卡片收进 .sec-pane；不点对应 .sec-tab 目标仍是隐藏的。
    const secTabPane = el.closest && el.closest('.sec-pane');
    if (secTabPane) {
      const wrap = secTabPane.closest('.sec-tabs-wrap');
      const panes = wrap ? [...wrap.querySelectorAll(':scope > .sec-panes > .sec-pane')] : [];
      const idx = panes.indexOf(secTabPane);
      const tabBtn = idx >= 0 && wrap ? wrap.querySelector(`.sec-tab[data-idx="${idx}"]`) : null;
      if (tabBtn && !tabBtn.classList.contains('active')) tabBtn.click();
    }
    // “命盘结构”将四柱、五行等收进分栏；跳转前先唤醒所在分栏，避免滚动到隐藏内容。
    const structurePane = el.closest && el.closest('.structure-pane');
    if (structurePane) {
      const structure = structurePane.closest('.master-structure');
      const structureTab = structure && structure.querySelector(`.structure-tab[data-structure="${structurePane.dataset.structure}"]`);
      if (structureTab && typeof window.switchStructureTab === 'function') window.switchStructureTab(structureTab);
    }
    // 依据字段：定位到卡片内具体的 data-report-value，而不是整张卡片
    const target = (fieldKey && el.querySelector(`[data-report-value="${fieldKey}"]`)) || el;
    // 速读项可能触发默认收起的专业数值区；先展开，保证字段真的可见
    const pro = target.closest && target.closest('.pro-wrap.collapsed');
    if (pro) {
      pro.classList.remove('collapsed');
      const proToggle = pro.previousElementSibling;
      if (proToggle && proToggle.classList.contains('pro-toggle')) proToggle.setAttribute('aria-expanded', 'true');
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('tj-flash');
    setTimeout(() => target.classList.remove('tj-flash'), 1800);
    // 如果是合并卡的子区跳转，自动激活对应子 tab
    if (subKey) {
      const sub = el.querySelector(`.focus-tab[data-sub="${subKey}"]`);
      if (sub) sub.click();
    }
  }, 280);
}

export function applyTheme(yongShen) {
  /* 特质决定全站强调色；用神只作数据标记，供五行等局部内容使用。 */
  document.documentElement.setAttribute('data-yongshen', yongShen || '土');
}

export function showPage2() {
  document.body.classList.add('report-active');
  document.getElementById('page1').classList.add('hidden');
  const p2 = document.getElementById('page2');
  p2.classList.remove('hidden');
  p2.classList.add('active');
  document.getElementById('tabBar').classList.add('show');
  document.getElementById('p2Scroll').scrollTop = 0;
  if (typeof window.resetGlossaryState === 'function') window.resetGlossaryState();
  requestAnimationFrame(() => {
    if (typeof window._rebindTilt === 'function') window._rebindTilt();
    if (typeof window._injectCardToggles === 'function') window._injectCardToggles();
    const a = document.querySelector('.tab-item.active');
    if (a && typeof moveTabIndicator === 'function') moveTabIndicator(a);
  });
}

export function goBack() {
  document.body.classList.remove('report-active');
  document.body.classList.remove('wen-page');
  delete document.body.dataset.resultView;
  applyTheme('土');
  ['page2'].forEach(id => {
    document.getElementById(id).classList.remove('active');
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById('tabBar').classList.remove('show');
  document.getElementById('lgPanel').classList.remove('open');

  /* 漏斗单一入口没有首页可回：「重新推演」打开表单，并记录报告为返回目标。
     关闭表单时由 entry-flow.js 恢复报告，而不是把访客重定向到 funnel.html。 */
  if (window.__wenFlow?.onReportBack) window.__wenFlow.onReportBack();
  else if (typeof window.TJOpenForm === 'function') window.TJOpenForm();
}

export function scrollToForm() { document.getElementById('formCard').scrollIntoView({ behavior: 'smooth', block: 'center' }); }

/**
 * DOCK 点击入口。命理入口保留上次看的子分区（命盘 / 运势 / 关系）；
 * WEN 入口打开整页对话，不再弹底部浮层。
 */
export function switchTab(el) {
  const sec = el?.dataset?.sec;
  if (!sec) return;
  if (DOCK_VIEWS[sec] === 'wen' || sec === 's-wen') {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active', 'tab-pop'));
    el.classList.add('active');
    if (typeof moveTabIndicator === 'function') moveTabIndicator(el);
    void el.offsetWidth;
    el.classList.add('tab-pop');
    el.addEventListener('animationend', () => el.classList.remove('tab-pop'), { once: true });
    window.openAskPage?.();
    return;
  }
  if (document.body.classList.contains('wen-page')) window.closeAskPage?.();
  // 切 sec 时让卡片重新错落入场（重置动画）
  const targetSec = document.getElementById(sec);
  if (targetSec) {
    targetSec.querySelectorAll('.glass').forEach(c => {
      c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
    });
  }
  const wantsMing = DOCK_VIEWS[sec] === 'ming';
  if (wantsMing && !isEastern(sec)) openResultView(eastView);
  else openResultView(sec);

  if (sec === 's-ming' || sec === 's-yun') {
    requestAnimationFrame(() => {
      document.querySelectorAll('.wxf,.ff').forEach(e => { e.style.width = '0%'; setTimeout(() => { e.style.width = e.dataset.w; }, 50); });
    });
  }
  if (sec === 's-yun') {
    requestAnimationFrame(() => {
      const cv = document.getElementById('cvC');
      if (cv && cv._data && typeof window.drawCurve === 'function') window.drawCurve(cv._data, cv._dys, cv._age);
      const tl = document.getElementById('daYunTl');
      if (tl) {
        const cu = tl.querySelector('.ti.cu');
        if (cu) setTimeout(() => cu.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }), 100);
      }
    });
  }
}

export function setGlassMode(mode) {
  document.body.setAttribute('data-glass', mode);
  try { localStorage.setItem('tj_glass_mode', mode); } catch (e) {}
  document.querySelectorAll('.lg-opt').forEach(o => o.classList.toggle('active', o.dataset.mode === mode));
  const fab = document.getElementById('lgFab'); if (fab) fab.classList.toggle('active', mode !== 'standard');
}

export function toggleLgPanel() { document.getElementById('lgPanel').classList.toggle('open'); }

export function moveTabIndicator(el) {
  const ind = document.getElementById('tabIndicator');
  const wrap = document.getElementById('tabBar') && document.getElementById('tabBar').querySelector('.tab-bar-inner');
  if (!ind || !wrap || !el) return;
  const wr = wrap.getBoundingClientRect(), er = el.getBoundingClientRect();
  ind.style.width = er.width + 'px';
  ind.style.transform = `translateX(${er.left - wr.left}px)`;
  ind.classList.add('ready');
}

export function initNavigationUI() {
  document.addEventListener('click', function (e) {
    const panel = document.getElementById('lgPanel'), fab = document.getElementById('lgFab');
    if (panel && panel.classList.contains('open') && !panel.contains(e.target) && e.target !== fab) panel.classList.remove('open');
  });
  window.addEventListener('resize', function () {
    const a = document.querySelector('.tab-item.active');
    if (a) moveTabIndicator(a);
  });
  let mode = 'standard';
  try { mode = localStorage.getItem('tj_glass_mode') || 'standard'; } catch (e) {}
  setGlassMode(mode);
}

// 速读项 → 依据字段：复用 jumpTo 的唤醒 / 滚动 / 高亮，仅多传一个字段键
if (typeof window !== 'undefined') window.TJTraceEvidence = (sec, card, field) => jumpTo(sec, card, field);
