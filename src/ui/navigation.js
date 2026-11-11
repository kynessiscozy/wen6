import { KB } from '../ai/kb.js';

export function jumpTo(secId,cardKey,fieldKey){
  // 关 AI 面板
  if(typeof window.closeAsk==='function')window.closeAsk();
  // 若 secId 为空，从 KB.routes 推断；同时取 sub（合并卡子区）
  let subKey=null,routeCard=cardKey;
  if(cardKey&&KB&&KB.routes&&KB.routes[cardKey]){
    const r=KB.routes[cardKey];
    if(!secId)secId=r.sec;
    if(r.sub)subKey=r.sub;
    routeCard=r.card; // 重定向到真正的 DOM data-card
  }
  // 切 tab
  const tab=document.querySelector('.tab-item[data-sec="'+secId+'"]');
  if(tab&&!tab.classList.contains('active'))tab.click();
  // 重写：使用 routeCard 进行查找
  cardKey=routeCard;
  // 滚动+高亮
  setTimeout(()=>{
    let el=null;
    if(cardKey){
      el=document.querySelector('[data-card="'+cardKey+'"]');
    }
    if(!el){
      el=document.getElementById(secId);
    }
    if(!el)return;
    // 卡片本身折叠时先展开，字段才有可滚动的位置
    if(el.classList.contains('collapsed'))el.classList.remove('collapsed');
    // 档位面板（年/月/周/日）里的卡片：先唤醒所在档位再滚动
    const yunPane=el.closest&&el.closest('.yun-pane');
    if(yunPane&&typeof window.TJActivateYunTab==='function')window.TJActivateYunTab(yunPane.dataset.yun);
    // 东方 / 西方分区标签里的卡片：先唤醒所在面板，避免滚动到隐藏内容。
    // 引路人路线会跳 astro-core / astro-planets 等西方卡片，这里必须一并覆盖。
    const groupedPane=el.closest&&el.closest('.ming-pane,.rel-pane,.wastro-pane,.whoro-pane,.wnum-pane');
    if(groupedPane){
      const activate=[['ming','TJActivateMingTab'],['rel','TJActivateRelTab'],
        ['wastro','TJActivateWastroTab'],['whoro','TJActivateWhoroTab'],['wnum','TJActivateWnumTab']]
        .find(([kind])=>groupedPane.classList.contains(kind+'-pane'));
      const paneKey=activate&&groupedPane.dataset[activate[0]];
      if(paneKey&&typeof window[activate[1]]==='function')window[activate[1]](paneKey);
    }
    // 新版分区标签把卡片收进 .sec-pane；不点对应 .sec-tab 目标仍是隐藏的。
    const secTabPane=el.closest&&el.closest('.sec-pane');
    if(secTabPane){
      const wrap=secTabPane.closest('.sec-tabs-wrap');
      const panes=wrap?[...wrap.querySelectorAll(':scope > .sec-panes > .sec-pane')]:[];
      const idx=panes.indexOf(secTabPane);
      const tab=idx>=0&&wrap?wrap.querySelector('.sec-tab[data-idx="'+idx+'"]'):null;
      if(tab&&!tab.classList.contains('active'))tab.click();
    }
    // “命盘结构”将四柱、五行等收进分栏；跳转前先唤醒所在分栏，避免滚动到隐藏内容。
    const structurePane=el.closest&&el.closest('.structure-pane');
    if(structurePane){
      const structure=structurePane.closest('.master-structure');
      const structureTab=structure&&structure.querySelector('.structure-tab[data-structure="'+structurePane.dataset.structure+'"]');
      if(structureTab&&typeof window.switchStructureTab==='function')window.switchStructureTab(structureTab);
    }
    // 依据字段：定位到卡片内具体的 data-report-value，而不是整张卡片
    const target=(fieldKey&&el.querySelector('[data-report-value="'+fieldKey+'"]'))||el;
    // 速读项可能触发默认收起的专业数值区；先展开，保证字段真的可见
    const pro=target.closest&&target.closest('.pro-wrap.collapsed');
    if(pro){
      pro.classList.remove('collapsed');
      const proToggle=pro.previousElementSibling;
      if(proToggle&&proToggle.classList.contains('pro-toggle'))proToggle.setAttribute('aria-expanded','true');
    }
    target.scrollIntoView({behavior:'smooth',block:'center'});
    target.classList.add('tj-flash');
    setTimeout(()=>target.classList.remove('tj-flash'),1800);
    // 如果是合并卡的子区跳转，自动激活对应子 tab
    if(subKey){
      const sub=el.querySelector('.focus-tab[data-sub="'+subKey+'"]');
      if(sub)sub.click();
    }
  },280);
}

export function applyTheme(yongShen){
  /* 特质决定全站强调色；用神只作数据标记，供五行等局部内容使用。 */
  document.documentElement.setAttribute('data-yongshen', yongShen || '土');
}

export function showPage2(){document.body.classList.add('report-active');document.getElementById('page1').classList.add('hidden');const p2=document.getElementById('page2');p2.classList.remove('hidden');p2.classList.add('active');document.getElementById('tabBar').classList.add('show');document.getElementById('p2Scroll').scrollTop=0;if(typeof window.resetGlossaryState==='function')window.resetGlossaryState();requestAnimationFrame(()=>{if(typeof window._rebindTilt==='function')window._rebindTilt();if(typeof window._injectCardToggles==='function')window._injectCardToggles();const a=document.querySelector('.tab-item.active');if(a&&typeof moveTabIndicator==='function')moveTabIndicator(a);});}

export function goBack(){document.body.classList.remove('report-active');applyTheme('土');['page2'].forEach(id=>{document.getElementById(id).classList.remove('active');document.getElementById(id).classList.add('hidden');});document.getElementById('tabBar').classList.remove('show');document.getElementById('lgPanel').classList.remove('open');
  /* 漏斗单一入口没有首页可回：「重新推演」打开表单，并记录报告为返回目标。
     关闭表单时由 entry-flow.js 恢复报告，而不是把访客重定向到 funnel.html。 */
  if(window.__wenFlow?.onReportBack)window.__wenFlow.onReportBack();
  else if(typeof window.TJOpenForm==='function')window.TJOpenForm();
}

export function scrollToForm(){document.getElementById('formCard').scrollIntoView({behavior:'smooth',block:'center'});}

export function switchTab(el){
  document.querySelectorAll('.tab-item').forEach(t=>t.classList.remove('active','tab-pop'));el.classList.add('active');
  if(typeof moveTabIndicator==='function')moveTabIndicator(el);
  // IG-style tap feedback: restart the pop animation on the icon that just became active
  void el.offsetWidth;
  el.classList.add('tab-pop');
  el.addEventListener('animationend',()=>el.classList.remove('tab-pop'),{once:true});
  // 切换 sec 时让卡片重新错落入场（重置动画）
  const targetSec=document.getElementById(el.dataset.sec);
  if(targetSec){
    targetSec.querySelectorAll('.glass').forEach(c=>{c.style.animation='none';void c.offsetWidth;c.style.animation='';});
  }
  const secId=el.dataset.sec;document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));const target=document.getElementById(secId);if(target){target.classList.add('active');}
  document.getElementById('p2Scroll').scrollTop=0;
  if(secId==='s-ming'||secId==='s-yun'){requestAnimationFrame(()=>{document.querySelectorAll('.wxf,.ff').forEach(el=>{el.style.width='0%';setTimeout(()=>{el.style.width=el.dataset.w},50)});});}
  if(secId==='s-yun'){requestAnimationFrame(()=>{const cv=document.getElementById('cvC');if(cv&&cv._data&&typeof window.drawCurve==='function')window.drawCurve(cv._data,cv._dys,cv._age);const tl=document.getElementById('daYunTl');if(tl){const cu=tl.querySelector('.ti.cu');if(cu){setTimeout(()=>cu.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}),100);}}});}
}

export function setGlassMode(mode){
  document.body.setAttribute('data-glass',mode);
  try{localStorage.setItem('tj_glass_mode',mode);}catch(e){}
  document.querySelectorAll('.lg-opt').forEach(o=>o.classList.toggle('active',o.dataset.mode===mode));
  const fab=document.getElementById('lgFab');if(fab)fab.classList.toggle('active',mode!=='standard');
}

export function toggleLgPanel(){document.getElementById('lgPanel').classList.toggle('open');}

export function moveTabIndicator(el){
  const ind=document.getElementById('tabIndicator');
  const wrap=document.getElementById('tabBar')&&document.getElementById('tabBar').querySelector('.tab-bar-inner');
  if(!ind||!wrap||!el)return;
  const wr=wrap.getBoundingClientRect(),er=el.getBoundingClientRect();
  ind.style.width=er.width+'px';
  ind.style.transform='translateX('+(er.left-wr.left)+'px)';
  ind.classList.add('ready');
}


export function initNavigationUI(){
  document.addEventListener('click',function(e){
    const panel=document.getElementById('lgPanel'),fab=document.getElementById('lgFab');
    if(panel&&panel.classList.contains('open')&&!panel.contains(e.target)&&e.target!==fab){panel.classList.remove('open');}
  });
  window.addEventListener('resize',function(){
    const a=document.querySelector('.tab-item.active');
    if(a)moveTabIndicator(a);
  });
  let mode='standard';
  try{mode=localStorage.getItem('tj_glass_mode')||'standard';}catch(e){}
  setGlassMode(mode);
}

// 速读项 → 依据字段：复用 jumpTo 的唤醒 / 滚动 / 高亮，仅多传一个字段键
if(typeof window!=='undefined')window.TJTraceEvidence=(sec,card,field)=>jumpTo(sec,card,field);
