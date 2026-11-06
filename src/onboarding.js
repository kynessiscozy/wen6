/* A compact, always-available guide to the current experience.
   文案统一来自 src/product-copy.js，与漏斗页、README 同源。 */
import { getWesternSvgIcon } from './render/western-view.js';
import { focusSafely } from './ui/focus.js';
import { GUIDE, GUIDE_TABS, GUIDE_SUBTITLE } from './product-copy.js';

const tabs = GUIDE_TABS;
let activeGuideTab = 'tour';
let returnFocus = null;

const header = (kicker, title, description) => `
  <div class="ng-section-hero">
    <div class="ng-kicker">${kicker}</div>
    <h3 class="ng-title">${title}</h3>
    <p class="ng-desc">${description}</p>
  </div>`;
const steps = items => `<div class="ng-steps-flow">${items.map(([title, text], i) => `
  <div class="ng-step-card">
    <span class="step-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
    <div class="step-content"><h4>${title}</h4><p>${text}</p></div>
  </div>`).join('')}</div>`;

function renderSection(sec) {
  let html = header(sec.kicker, sec.title, sec.desc);
  if (sec.steps) html += steps(sec.steps);
  if (sec.terms) html += `
      <div class="ng-glossary-grid">${sec.terms.map(([name, system, description]) => `
        <div class="ng-glossary-item">
          <div class="term-hd"><span class="term-name">${name}</span><span class="term-tag ${system === '东方' ? 'east' : 'west'}">${system}</span></div>
          <p class="term-desc">${description}</p>
        </div>`).join('')}</div>`;
  if (sec.faqs) html += `
      <div class="ng-faq-list">${sec.faqs.map(([question, answer]) => `
        <div class="ng-faq-item"><h4 class="faq-q">${question}</h4><p class="faq-a">${answer}</p></div>`).join('')}</div>`;
  return html;
}

const content = Object.fromEntries(Object.keys(GUIDE).map(key => [key, () => renderSection(GUIDE[key])]));

export function openNoviceGuide(initialTab = 'tour') {
  activeGuideTab = Object.prototype.hasOwnProperty.call(content, initialTab) ? initialTab : 'tour';
  let modal = document.getElementById('noviceGuideModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'noviceGuideModal';
    modal.className = 'ng-modal';
    modal.innerHTML = `
      <div class="ng-backdrop" onclick="closeNoviceGuide()"></div>
      <div class="ng-sheet" role="dialog" aria-modal="true" aria-labelledby="ngTitle">
        <div class="ng-header">
          <div><h2 class="ng-header-title" id="ngTitle">使用指南</h2><p class="ng-header-sub">${GUIDE_SUBTITLE}</p></div>
          <button class="ng-close-btn" type="button" onclick="closeNoviceGuide()" aria-label="关闭指引">×</button>
        </div>
        <div class="ng-tabs-bar" role="tablist" aria-label="指引目录">
          ${tabs.map(([key, label, icon]) => `<button class="ng-tab-btn" id="ng-tab-${key}" data-tab="${key}" onclick="switchNoviceGuideTab('${key}')" type="button" role="tab" aria-controls="ngBodyContent">${getWesternSvgIcon(icon, 14)} ${label}</button>`).join('')}
        </div>
        <div class="ng-body" id="ngBodyContent" role="tabpanel" tabindex="0"></div>
        <div class="ng-footer">
          <button class="ng-act-btn primary" type="button" onclick="closeNoviceGuide(); window.TJOpenForm && window.TJOpenForm();">填写出生信息</button>
          <button class="ng-act-btn ghost" type="button" onclick="closeNoviceGuide()">稍后再看</button>
        </div>
      </div>`;
    modal.addEventListener('keydown', guideKeydown);
    document.body.appendChild(modal);
  }
  if (!modal.classList.contains('open')) returnFocus = document.activeElement;
  modal.classList.add('open');
  switchNoviceGuideTab(activeGuideTab);
  focusSafely(modal.querySelector('.ng-close-btn'));
}

export function closeNoviceGuide() {
  const modal = document.getElementById('noviceGuideModal');
  if (!modal?.classList.contains('open')) return;
  modal.classList.remove('open');
  if (returnFocus?.isConnected && returnFocus.getClientRects().length) focusSafely(returnFocus);
  returnFocus = null;
}

export function switchNoviceGuideTab(tabKey) {
  activeGuideTab = Object.prototype.hasOwnProperty.call(content, tabKey) ? tabKey : 'tour';
  const modal = document.getElementById('noviceGuideModal');
  if (!modal) return;
  modal.querySelectorAll('.ng-tab-btn').forEach(button => {
    const selected = button.dataset?.tab === activeGuideTab;
    button.classList.toggle('active', selected);
    button.setAttribute?.('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  const panel = document.getElementById('ngBodyContent');
  if (!panel) return;
  panel.innerHTML = content[activeGuideTab]();
  panel.setAttribute?.('aria-labelledby', `ng-tab-${activeGuideTab}`);
  panel.scrollTop = 0;
}

function guideKeydown(event) {
  event.stopPropagation(); // Escape and numeric shortcuts must not affect the report behind the guide.
  if (event.key === 'Escape') { event.preventDefault(); closeNoviceGuide(); return; }
  const modal = event.currentTarget;
  if (event.target.matches('.ng-tab-btn') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    const current = tabs.findIndex(([key]) => key === event.target.dataset.tab);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 :
      (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    event.preventDefault();
    switchNoviceGuideTab(tabs[next][0]);
    modal.querySelector(`#ng-tab-${tabs[next][0]}`)?.focus();
  } else if (event.key === 'Tab') {
    const focusable = [...modal.querySelectorAll('button:not(:disabled), [tabindex="0"]')]
      .filter(node => node.getClientRects().length);
    const index = focusable.indexOf(document.activeElement);
    if (focusable.length && (index < 0 || (!event.shiftKey && index === focusable.length - 1) || (event.shiftKey && index === 0))) {
      event.preventDefault();
      focusable[event.shiftKey ? focusable.length - 1 : 0].focus();
    }
  }
}

export function initGlobalNoviceGuide() {
  if (typeof window === 'undefined') return;
  window.openNoviceGuide = openNoviceGuide;
  window.closeNoviceGuide = closeNoviceGuide;
  window.switchNoviceGuideTab = switchNoviceGuideTab;
}
export function initOnboarding() { initGlobalNoviceGuide(); }
