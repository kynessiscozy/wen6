import { showToast } from './ui/toast.js';
import { showFunnelTeaserIfNeeded } from './ui/funnel-teaser.js';
import { focusSafely } from './ui/focus.js';
import { CURR_YEAR, TG, DZ, SS, ZHI_CHONG } from './engines/shared.js';
import { CD, CG } from './engines/cities.js';
import { jqDate, solarTermDutyDay, resolveBirthDateTime, getDayPillarIndex } from './engines/calendar.js';
import { mkBazi, mkWx, mkSs, mkShenSha, mkDy, mkLn, getLiuYue } from './engines/bazi.js';
import { mkZw } from './engines/ziwei.js';
import { solarToLunar } from './engines/lunar.js';
import { mkQm } from './engines/qimen.js';
import { mkMh } from './engines/meihua.js';
import { mkSi } from './engines/sizhi.js';
import { initSectionTabs } from './ui/section-tabs.js';
import { TJ } from './state/tj.js';
import { getCtx } from './state/context.js';
import { closeToolPage, openToolPage } from './tools/center.js';
import { openDecisionTool, runDecisionTool } from './tools/decision.js';
import { startBreathTool } from './tools/wellness.js';
import { runWealthTool } from './tools/wealth.js';
import { runCareerTool } from './tools/career.js';
import { runDateTool } from './tools/dating.js';
import { runLayoffTool } from './tools/layoff-tool.js';
import { runDailyTool } from './tools/daily.js';
import { runNameTool } from './tools/naming.js';
import { runOracleTool } from './tools/oracle.js';
import { runLotteryTool } from './tools/lottery.js';
import { runZodiacTool } from './tools/zodiac.js';
import { runRelationTool } from './tools/relation.js';
import { openPosterShare as showPosterShare, openCanvasShare } from './share/studio.js';
import { initTools3DRingCarousel } from './render/tools-ring.js';
import { characterCompanion, homeThemePicker } from './home.js';
import { mountCharacterReport } from './ui/character-report.js';
import { beginCharacterCalculation, warmCharacterCalculation } from './ui/character-calculation.js';
import { getResultStyle } from './state/result-style.js';

// The preview module loads with the report, so an already available report
// can still be shared for the first time without a network connection.
window.openPosterShare = function(kind = 'report') {
  try { showPosterShare({ kind, opener: document.activeElement }); }
  catch(error) { console.error('[share]', error); showToast(error?.message || '分享暂时不可用，请重试'); }
};
window.TJOpenSharePreview = openCanvasShare;
// Preserve the old entry point for integrations while opening the new studio.
window.openFullReportShare = () => window.openPosterShare('report');
window.openNoviceGuide = openNoviceGuide;
window.closeNoviceGuide = closeNoviceGuide;
window.switchNoviceGuideTab = switchNoviceGuideTab;

window.selectResultStyle=function(value){
  const hidden=document.getElementById('bResultStyle');
  const hint=document.getElementById('resultStyleHint');
  if(hidden)hidden.value=value;
  document.querySelectorAll('.result-style-option').forEach(btn=>{
    const active=btn.dataset.style===value;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-checked',active?'true':'false');
  });
  if(hint)hint.textContent=getResultStyle(value).intro;
  window._formDirty=true;
};
// 捕获阶段兜底：即使局部表单监听未初始化，按钮仍能切换风格。
document.addEventListener('click',e=>{
  const btn=e.target.closest?.('.result-style-option');
  if(btn)window.selectResultStyle(btn.dataset.style);
},true);
import { calcYearScores } from './state/scoring.js';
import { buildContext } from './state/context.js';
import {
  calcLayoffRisk, renderAll, switchStructureTab, toggleFullGods, calcRelation, copyReport
} from './render/index.js';
import {
  applyTheme, jumpTo, showPage2, goBack, switchTab, setGlassMode, moveTabIndicator, initNavigationUI, openAsk, closeAsk, newAskChat, doAsk, doAskCustom, aiOnInputSuggest, setAiBasis, toggleAISettings, initAISettings, buildAISettingsPanel, applyThemePref, getThemePref
} from './ui/index.js';
import { initFontSize } from './font-size.js';
import { initWeather } from './ui/weather.js';
import { initOnboarding, openNoviceGuide, closeNoviceGuide, switchNoviceGuideTab } from './onboarding.js';
import { initEvolveUI } from './evolve/ui.js';
import { installSelectionGloss } from './app/glossary.js';
import { initProfiles, initDB, dbGetAll, profileEscape, saveCurrentProfile, renderProfiles, loadProfile, deleteProfile, openSaveModal, closeSaveModal, openArchiveModal, closeArchiveModal, renderArchiveList, loadProfileFromArchive, deleteProfileFromArchive, updateSaveNameCount, quickSaveName, confirmSaveProfile, exportProfiles, handleImport } from './app/profiles.js';

// This module can arrive after DOMContentLoaded or load on a slow connection.
function onDomReady(callback){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',callback,{once:true});
  else queueMicrotask(callback);
}
function onWindowLoad(callback){
  if(document.readyState==='complete')queueMicrotask(callback);
  else window.addEventListener('load',callback,{once:true});
}

/* tools2 改为动态 import（见文件末尾 bootstrap 处）：
   工具系统体积大且非首屏必需，独立成异步 chunk，缩小主包。 */

initWeather();
initSectionTabs();
initNavigationUI();
initAISettings();
initFontSize();
initEvolveUI();

/* ============================================================
   全局函数暴露：index.html 和动态生成的 onclick 需要全局访问
   ES module 内的函数默认不挂载到 window，
   但 inline onclick="fn()" 只能调用 window.fn。
   ============================================================ */
let aboutReturnFocus=null;
(function(){
  // 1. 已存在但未暴露的函数（来自 import 或本模块定义）
  window.setGlassMode=setGlassMode;
  window.jumpTo=jumpTo;
  window.newAskChat=newAskChat;
  window.doAskCustom=doAskCustom;
  window.closeRq=closeRq;
  window.showRiQian=showRiQian;
  window.focusSwitchTab=focusSwitchTab;
  window.calcLayoffRisk=calcLayoffRisk;
  window.calcRelation=calcRelation;
  window.switchStructureTab=switchStructureTab;
  window.toggleFullGods=toggleFullGods;
  window.setUserMode=setSystemMode;
  window.setSystemMode=setSystemMode;
  window.setAiBasis=setAiBasis;
  window.toggleUserMode=toggleUserMode;
  window.doAsk=doAsk;
  window.toggleAISettings=toggleAISettings;

  // 2. 旧版工具函数（tools/ 模块，已被 tools2 接管但仍可能被 onclick 引用）
  window.openToolPage=openToolPage;
  window.closeToolPage=closeToolPage;
  window.openDecisionTool=openDecisionTool;
  window.runDecisionTool=runDecisionTool;
  window.startBreathTool=startBreathTool;
  window.runWealthTool=runWealthTool;
  window.runCareerTool=runCareerTool;
  window.runDateTool=runDateTool;
  window.runLayoffTool=runLayoffTool;
  window.runDailyTool=runDailyTool;
  window.runNameTool=runNameTool;
  window.runOracleTool=runOracleTool;
  window.runLotteryTool=runLotteryTool;
  window.runZodiacTool=runZodiacTool;
  window.runRelationTool=runRelationTool;

  // 3. 之前已暴露的函数（保持不变）
initProfiles(calc);

  window.calc=calc;window.loadProfile=loadProfile;window.selChip=selChip;window.exportProfiles=exportProfiles;window.handleImport=handleImport;window.openAsk=openAsk;window.closeAsk=closeAsk;window.goBack=goBack;window.switchTab=switchTab;window.showPage2=showPage2;window.openSaveModal=openSaveModal;window.closeSaveModal=closeSaveModal;window.openArchiveModal=openArchiveModal;window.closeArchiveModal=closeArchiveModal;window.loadProfileFromArchive=loadProfileFromArchive;window.deleteProfileFromArchive=deleteProfileFromArchive;window.confirmSaveProfile=confirmSaveProfile;window.quickSaveName=quickSaveName;window.updateSaveNameCount=updateSaveNameCount;window.deleteProfile=deleteProfile;window.openMonthModal=openMonthModal;window.closeMonthModal=closeMonthModal;window.openCalendarMode=openCalendarMode;window.openAboutModal=function(){const m=document.getElementById('aboutModal');if(!m)return;aboutReturnFocus=document.activeElement;m.classList.add('open');focusSafely(m.querySelector('.modal-close'));};window.closeAboutModal=function(){const m=document.getElementById('aboutModal');if(!m?.classList.contains('open'))return;m.classList.remove('open');if(aboutReturnFocus?.isConnected&&aboutReturnFocus.getClientRects().length)focusSafely(aboutReturnFocus);aboutReturnFocus=null;};window.openDisclaimerModal=function(){document.getElementById('disclaimerModal').classList.add('open');};window.closeDisclaimerModal=function(){document.getElementById('disclaimerModal').classList.remove('open');};

  // Report and contextual share buttons all open the same preview studio.
  window.TJShareReport=()=>window.openPosterShare('year');
  window.TJShareRiQian=()=>window.openPosterShare('today');
  window.TJShareWeek=()=>window.openPosterShare('week');

  // 5. 缺失函数：速读卡折叠/展开
  window.TJToggleQuickRead=function(btn){
    const card=btn.closest('.qr-card');if(!card)return;
    const expanded=btn.getAttribute('aria-expanded')==='true';
    btn.setAttribute('aria-expanded',!expanded);
    card.classList.toggle('qr-collapsed',expanded);
    const body=card.querySelector('.qr-body');
    if(body){if(expanded)body.setAttribute('inert','');else body.removeAttribute('inert');body.setAttribute('aria-hidden',String(expanded));}
    if(btn.dataset.compactOverview==='true'){
      const title=btn.querySelector('.qr-title');
      if(title)title.textContent=expanded?'展开':'收起';
      btn.setAttribute('aria-label',(expanded?'展开':'收起')+(btn.dataset.overviewLabel||'命盘速读'));
    }
  };

  // 5.5 运势页：年/月/周/日 档位切换
  window.TJActivateYunTab=function(key){
    const yunSec=document.getElementById('s-yun');if(!yunSec)return;
    const tabs=yunSec.querySelectorAll('.yun-tab');
    const panes=yunSec.querySelectorAll('.yun-pane');
    let found=false;
    tabs.forEach(t=>{
      const on=t.dataset.yun===key;
      t.classList.toggle('active',on);
      t.setAttribute('aria-selected',on?'true':'false');
      if(on)found=true;
    });
    panes.forEach(p=>{
      p.classList.toggle('active',p.dataset.yun===key);
    });
    if(!found)return;
    // 切换后滚动回标签栏顶部
    const sc=document.getElementById('p2Scroll');
    const tabsEl=yunSec.querySelector('.yun-tabs');
    if(sc&&tabsEl){
      const top=tabsEl.getBoundingClientRect().top-(sc.getBoundingClientRect()?.top||0);
      if(top<0)sc.scrollBy({top,behavior:'smooth'});
    }
  };

  // 5.6 命盘/关系页：与运势页同构的分区标签切换（命盘：结构/人格/三式/判读；关系：亲密/朋友/亲人/合盘）
  function activateSecGroup(secId,cls,attr,key){
    const sec=document.getElementById(secId);if(!sec)return;
    let found=false;
    sec.querySelectorAll('.'+cls+'-tab').forEach(t=>{
      const on=t.getAttribute(attr)===key;
      t.classList.toggle('active',on);
      t.setAttribute('aria-selected',on?'true':'false');
      if(on)found=true;
    });
    sec.querySelectorAll('.'+cls+'-pane').forEach(p=>p.classList.toggle('active',p.getAttribute(attr)===key));
    if(!found)return;
    // 切换后滚动回标签栏顶部
    const sc=document.getElementById('p2Scroll');
    const tabsEl=sec.querySelector('.'+cls+'-tabs');
    if(sc&&tabsEl){
      const top=tabsEl.getBoundingClientRect().top-(sc.getBoundingClientRect()?.top||0);
      if(top<0)sc.scrollBy({top,behavior:'smooth'});
    }
  }
  window.TJActivateMingTab=function(key){activateSecGroup('s-ming','ming','data-ming',key);};
  window.TJActivateRelTab=function(key){activateSecGroup('s-rel','rel','data-rel',key);};
  // 西方三分区标签组(与东方同款切换)
  window.TJActivateWastroTab=function(key){activateSecGroup('s-ming','wastro','data-wastro',key);};
  window.TJActivateWhoroTab=function(key){activateSecGroup('s-yun','whoro','data-whoro',key);};
  window.TJActivateWnumTab=function(key){activateSecGroup('s-rel','wnum','data-wnum',key);};

  // 6. 档案菜单切换（使用 IndexedDB）
  window.TJToggleProfileMenu=async function(){
    const menu=document.getElementById('p2ProfileMenu');
    const btn=document.getElementById('p2ProfileBtn');
    if(!menu)return;
    const isOpen=menu.classList.toggle('open');
    if(btn)btn.setAttribute('aria-expanded',isOpen?'true':'false');
    if(!isOpen)return;
    try{
      const list=await dbGetAll();
      let html='';
      html+='<button class="p2-profile-save-btn" onclick="openSaveModal();document.getElementById(\'p2ProfileMenu\').classList.remove(\'open\')"><span class="p2ps-icon">＋</span><span class="p2ps-text">保存当前命盘</span><span class="p2ps-arrow">→</span></button>';
      html+='<div class="p2-profile-sep" style="height:1px;background:var(--c-border,#eee);margin:6px 0"></div>';
      if(list.length===0){
        html+='<div class="profile-empty">还没有保存的档案</div>';
      }else{
        html+=list.slice(0,10).map(p=>{
          const city=CD[p.bp]||{n:'未知'};
          return `<div class="profile-item" style="cursor:pointer" onclick="loadProfile(${Number(p.id)});document.getElementById('p2ProfileMenu').classList.remove('open')">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:600;font-size:.9em">${profileEscape(p.name||'未命名')}</span>
              <span style="font-size:.7em;color:var(--c-text-4,#aaa);cursor:pointer" onclick="event.stopPropagation();deleteProfile(${Number(p.id)});TJToggleProfileMenu()">×</span>
            </div>
            <div style="font-size:.72em;color:var(--c-text-3,#999);margin-top:2px">${profileEscape(p.bd||'')} · ${city.n} · ${p.gen==='male'?'男':'女'}</div>
          </div>`;
        }).join('');
      }
      html+='<div class="p2-profile-sep" style="height:1px;background:var(--c-border,#eee);margin:6px 0"></div>';
      html+='<div style="display:flex;gap:8px;padding:0 4px">';
      html+='<button class="profile-item" style="flex:1;font-size:.78em;padding:6px" onclick="exportProfiles();document.getElementById(\'p2ProfileMenu\').classList.remove(\'open\')">导出</button>';
      html+='<button class="profile-item" style="flex:1;font-size:.78em;padding:6px" onclick="document.getElementById(\'impFile2\').click();document.getElementById(\'p2ProfileMenu\').classList.remove(\'open\')">导入</button>';
      html+='</div>';
      html+='<input type="file" id="impFile2" style="display:none" accept=".json" onchange="handleImport(this)">';
      menu.innerHTML=html;
    }catch(e){
      menu.innerHTML='<div class="profile-empty">加载失败</div>';
    }
  };
})();

function refreshCharacterReport(isDemo=!!window._ctx?.isDemoPreview){
  try{
    mountCharacterReport({ctx:window._ctx,western:window.__w3dData,isDemo});
  }catch(error){
    // A missing optional character asset must not prevent the report itself.
    console.warn('[report] 角色导览暂不可用',error);
  }
}
// Switching traits updates the already calculated report without recalculating
// it, discarding inputs, or changing the separate 问问 assistant.
window.addEventListener('tj:trait-change',()=>{
  if(window._ctx && document.getElementById('s-ming'))refreshCharacterReport();
});

// A visible, persistent error is actionable on a small screen, unlike a short toast.
function clearFormError(){
  const error=document.getElementById('formError');
  if(error){error.hidden=true;error.textContent='';}
  document.querySelectorAll('#formModal [aria-invalid="true"]').forEach(el=>el.removeAttribute('aria-invalid'));
}
function showFormError(message,field){
  const modal=document.getElementById('formModal');
  if(!modal?.classList.contains('open'))window.TJOpenForm?.();
  const error=document.getElementById('formError');
  if(modal?.classList.contains('open')&&error){
    clearFormError();
    error.textContent=message;error.hidden=false;
    if(field){
      field.setAttribute('aria-invalid','true');
      // TJOpenForm may have queued focus on the heading; the invalid field wins.
      requestAnimationFrame(()=>{if(modal.classList.contains('open')&&field.getAttribute('aria-invalid')==='true')field.focus();});
    }
  }else showToast(message,{type:'error',duration:6000});
}

const CITY_SELECTION_MESSAGE='请从候选列表选择出生地点；找不到时可选择附近城市。';
function closeCityDropdown(){
  const dd=document.getElementById('cDD'),inp=document.getElementById('cInp');
  dd?.classList.remove('show');
  inp?.setAttribute('aria-expanded','false');
  inp?.removeAttribute('aria-activedescendant');
}
function selectBirthCity(id){
  const city=CD[id],inp=document.getElementById('cInp'),hid=document.getElementById('bPlace');
  if(!city||!inp||!hid)return;
  if(hid.value!==id||inp.value!==city.n)window._formDirty=true;
  hid.value=id;inp.value=city.n;
  closeCityDropdown();clearFormError();
}
function resolveBirthCity(){
  const inp=document.getElementById('cInp'),hid=document.getElementById('bPlace');
  const text=(inp?.value||'').trim();
  if(!text)return null;
  const selected=CD[hid?.value];
  if(selected&&text===selected.n)return {id:hid.value,city:selected};
  // Exact names, ids and unambiguous abbreviations are safe to accept even
  // when the user pressed submit instead of tapping a suggestion. Never guess
  // from a partial or ambiguous query (e.g. sz = 深圳 / 苏州).
  const key=text.toLowerCase().replace(/市$/,'');
  const matches=Object.entries(CD).filter(([id,city])=>
    id.toLowerCase()===key||city.n.toLowerCase().replace(/市$/,'')===key||(city.p||'').toLowerCase()===key);
  if(matches.length!==1)return null;
  const [id,city]=matches[0];
  selectBirthCity(id);
  return {id,city};
}
/* funnel.html 的问卷允许自由填写甚至跳过出生城市，而表单要求一个已选中的
   城市 id。统一在这里解析：识别不了就回退默认城市并提示，绝不让访客困在
   遮罩后面看一条看不见的校验错误。 */
window.applyEntryPayload = function(payload){
  const set=(id,value)=>{
    const el=document.getElementById(id);
    if(!el || value===undefined || value===null) return;
    el.value=value;
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  };
  const cityInput=document.getElementById('cInp');
  const placeInput=document.getElementById('bPlace');
  const defaults={city:cityInput?.value||'',place:placeInput?.value||''};
  set('bDate',payload.bd);
  if(payload.timeStr)set('bTime',payload.timeStr); // 跳过时保留默认 09:00
  if(payload.gen)set('bGen',payload.gen);
  let warning='';
  if(payload.cityName){
    set('cInp',payload.cityName);
    if(placeInput)placeInput.value=''; // 强制按新文本重新解析
    if(!resolveBirthCity()){
      set('cInp',defaults.city);
      if(placeInput)placeInput.value=defaults.place;
      warning='出生地点没能识别，已按默认城市计算；可在表单里修改。';
      showToast(warning,{duration:6000});
    }
  }else if(placeInput&&!CD[placeInput.value]){
    set('cInp',defaults.city);
    placeInput.value=defaults.place;
  }
  clearFormError();
  window._formDirty=false;
  return {ok:true,warning};
};

function validBirthDate(value){
  const match=/^(\d{4,})-(\d{2})-(\d{2})$/.exec(value);
  if(!match)return false;
  const [,ys,ms,ds]=match;const y=Number(ys),m=Number(ms),d=Number(ds);
  if(y<1||y>9999||m<1||m>12||d<1||d>31)return false;
  const date=new Date(0);date.setUTCFullYear(y,m-1,d);date.setUTCHours(0,0,0,0);
  return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d;
}

let calculationInProgress=false;
async function calc(isDemoPreview=false){
  if(calculationInProgress)return;
  window.__wenFlow?.onCalcStart?.();
  const formModal=document.getElementById('formModal');
  const fromForm=!!(formModal&&formModal.classList.contains('open'))&&!isDemoPreview;
  const dateField=document.getElementById('bDate'),timeField=document.getElementById('bTime');
  const bd=dateField.value;
  const validationError=(message,field)=>{
    window.__wenFlow?.onCalcFailed?.({formOpen:!!formModal?.classList.contains('open')});
    return showFormError(message,field);
  };
  if(!validBirthDate(bd))return validationError(bd?'请输入有效的出生日期。':'请选择出生日期。',dateField);
  const timeStr=timeField.value||'09:00';
  if(timeField.validity?.badInput||!/^([01]\d|2[0-3]):[0-5]\d(?::00(?:\.0{1,3})?)?$/.test(timeStr)){
    return validationError('请输入有效的出生时间。',timeField);
  }
  const [hh,mm]=timeStr.split(':').map(Number);
  const place=resolveBirthCity();
  if(!place)return validationError(CITY_SELECTION_MESSAGE,document.getElementById('cInp'));
  const {id:bp,city}=place;
  const gen=document.getElementById('bGen').value;
  const q=document.getElementById('bQ').value;
  const resultStyleId=document.getElementById('bResultStyle')?.value||'companion';
  const resultStyle=getResultStyle(resultStyleId);
  const useTrueSolar=document.getElementById('swTrueSolar').classList.contains('on');
  const[y,m,d]=bd.split('-').map(Number);
  clearFormError();closeCityDropdown();

  // 纯计算与渲染。失败抛错，由两条过渡路径各自处理界面。
  function doCompute(){
    const resolved=resolveBirthDateTime(y,m,d,hh,mm,useTrueSolar,city.o,city.tz);
    const b=mkBazi(resolved.year,resolved.month,resolved.day,resolved.hourZhi,resolved.hour,resolved.minute,resolved.instant);
    const wx=mkWx(b),ss=mkSs(b),dy=mkDy(b,gen,y,m,d),ln=mkLn(CURR_YEAR),zw=mkZw(b,solarToLunar(resolved.year,resolved.month,resolved.day)),qm=mkQm(b),mh=mkMh(b),si=mkSi(b);
    const shensha=mkShenSha(b);const liuyue=getLiuYue(CURR_YEAR);
    b._meta={hourZhi:resolved.hourZhi,useTrueSolar:resolved.note?true:false,by:y,bm:m,bd:d,dutyDay:solarTermDutyDay(resolved.instant)};
    const _input={by:y,bm:m,bd:d,bd_raw:bd,timeStr,bp,gen,q,useTrueSolar,resultStyle:resultStyleId,resultStyleLabel:resultStyle.label};
    const _preCtx=buildContext({b,wx,ss,dy,ln,zw,qm,mh,si,shensha,liuyue,P:null,gen,q,city,input:_input});
    window._ctx=_preCtx;window._baziData=_preCtx;window._reportData=_preCtx;
    window._formDirty=false; // 已推演应用，表单修改视为已保存
    applyTheme(wx.ys);
    renderAll(b,wx,ss,dy,ln,zw,qm,mh,si,gen,q,city,y,shensha,liuyue,_preCtx);
    // 让问问大师与报告顶部共享“示例报告”状态。
    if(window._ctx)window._ctx.isDemoPreview=!!isDemoPreview;
    if(window._baziData)window._baziData.isDemoPreview=!!isDemoPreview;
    if(window._reportData)window._reportData.isDemoPreview=!!isDemoPreview;
    if(isDemoPreview){
      const reportInner=document.getElementById('p2Inner');
      if(reportInner)reportInner.insertAdjacentHTML('afterbegin','<div class="demo-report-note" role="status"><span>示例</span><b>当前为体验用示例报告</b><em>内容基于默认示例信息生成，请勿用于个人判断。</em></div>');
    }
    // The chosen home character accompanies the real report, including when
    // a calendar update recalculates it without immediately opening the page.
    refreshCharacterReport(!!isDemoPreview);
  }

  // 日历录入只更新档案并留在日历；所有真正打开报告的入口共享同一推演场景。
  const calModal=document.getElementById('toolModal');
  const fromCalendar=fromForm&&!!(calModal&&calModal.classList.contains('cal-fullscreen'));
  const previous={ctx:window._ctx,bazi:window._baziData,report:window._reportData,dirty:window._formDirty,
    yongShen:document.documentElement.getAttribute('data-yongshen')};
  calculationInProgress=true;
  let scene=null,completed=false;
  // Only the calculation belonging to this handoff may present its teaser.
  // A saved profile or a manual recalculation must never inherit an old one.
  const isFunnelHandoff=!!window.__wenFlow?.isAutoAdvance?.();
  try{
    if(!fromCalendar){
      // Only an in-flight funnel handoff may auto-acknowledge the result;
      // every other visit keeps the explicit "查看报告" confirmation.
      scene=beginCharacterCalculation({autoAdvance:isFunnelHandoff});
      if(scene)await scene.paint(); // 让角色场景先绘制，再执行同步排盘
    }
    doCompute();
    if(fromCalendar){
      formModal.classList.remove('open');
      document.body.classList.remove('form-open');
      const mb=document.getElementById('homeMenuBtn');if(mb)mb.style.display='';
      window.dispatchEvent(new CustomEvent('tj:profile-ready'));
      // Calendar re-renders after receiving the profile, replacing its button.
      if(!formReturnFocus?.isConnected)formReturnFocus=calModal.querySelector('[data-fill]');
      restoreFormFocus();
      completed=true;
      window.__wenFlow?.onCalcFailed?.({formOpen:false});
      return;
    }
    scene?.showResult(window._ctx?.b);
    if(scene)await scene.wait();
    scene?.close();
    if(formModal&&formModal.classList.contains('open')){
      formModal.classList.remove('open');
      document.body.classList.remove('form-open');
      const mb=document.getElementById('homeMenuBtn');if(mb)mb.style.display='';
    }
    showPage2();
    characterCompanion.onReportReady({isDemo:isDemoPreview});
    // 只显示这次问卷对应的预告，避免旧问卷串到档案或手动推演。
    if(isFunnelHandoff)try { showFunnelTeaserIfNeeded(); } catch (e) { console.warn('[funnel] 预告页失败', e); }
    window.__wenFlow?.onReportReady?.();
    document.querySelectorAll('.tab-item')[0].click();
    formReturnFocus=null;
    focusSafely(document.getElementById('p2MenuBtn'));
    completed=true;
  }catch(e){
    // Keep the original form and last successful context available for retry.
    window._ctx=previous.ctx;window._baziData=previous.bazi;window._reportData=previous.report;
    window._formDirty=previous.dirty;
    if(previous.yongShen===null)document.documentElement.removeAttribute('data-yongshen');
    else document.documentElement.setAttribute('data-yongshen',previous.yongShen);
    scene?.close({restoreFocus:true});
    console.error(e);
    window.__wenFlow?.onCalcFailed?.({formOpen:!!formModal?.classList.contains('open')});
    const detail=e?.message||String(e);
    if(fromForm)showFormError('推演未完成：'+detail+'。出生信息已保留，请检查后重试。');
    showToast('推演出错：'+detail+'。出生信息已保留，请检查后重试。',{type:'error',duration:6000});
  }finally{
    scene?.close({restoreFocus:!completed});
    calculationInProgress=false;
  }
}

/* 表单弹窗开关：操作按钮在对话框内，首页和日历共用。 */
let formReturnFocus = null;
function restoreFormFocus(){
  let target=formReturnFocus;
  formReturnFocus=null;
  if(!target?.isConnected || !target.getClientRects().length){
    target=window.__wenFlow?.focusTarget?.() ||
      document.getElementById(document.body.classList.contains('report-active')?'p2MenuBtn':'homeCtaMain');
  }
  if(target && target.isConnected && target.getClientRects().length && typeof target.focus==='function'){
    focusSafely(target);
  }
}
window.TJOpenForm=function(){
  const m=document.getElementById('formModal');
  if(!m || m.classList.contains('open'))return;
  window.__wenFlow?.onFormOpen?.();
  formReturnFocus=document.activeElement;
  m.classList.add('open');
  document.body.classList.add('form-open');
  // Non-blocking: the chosen character's props can arrive while the form is filled.
  if(!document.getElementById('toolModal')?.classList.contains('cal-fullscreen')){
    try{warmCharacterCalculation();}catch(error){console.warn('[calculation] 道具预加载失败',error);}
  }

  // The weather location is not necessarily the user's birthplace. Do not
  // overwrite a selected or partially entered city when the form is reopened.

  requestAnimationFrame(()=>{
    if(m.classList.contains('open'))focusSafely(document.getElementById('formModalTitle'));
  });
};
window.TJCloseForm=function(){
  const m=document.getElementById('formModal');
  if(m)m.classList.remove('open');
  closeCityDropdown();
  document.body.classList.remove('form-open');
  // 单一状态机决定下一屏：回到刚才的报告，或显示可操作的兜底入口卡。
  // 不再用 setTimeout 猜 DOM、不再静默跳回 funnel.html。
  window.__wenFlow?.onFormClosed?.();
  restoreFormFocus();
};
// Clear stale feedback only when the user edits an input; an error otherwise remains visible.
document.getElementById('formModal')?.addEventListener('input',clearFormError);
document.getElementById('formModal')?.addEventListener('change',clearFormError);
// Keep keyboard focus inside the modal until it is closed.
document.getElementById('formModal')?.addEventListener('keydown',e=>{
  if(e.key!=='Tab')return;
  const controls=[...e.currentTarget.querySelectorAll('button:not([disabled]),input:not([type="hidden"]):not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(el=>el.getClientRects().length);
  if(!controls.length)return;
  const first=controls[0],last=controls[controls.length-1];
  if(e.shiftKey && (document.activeElement===first || !controls.includes(document.activeElement))){e.preventDefault();last.focus();}
  else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
});

function renderRiQian(){
  const now=new Date();const y=now.getFullYear(),m=now.getMonth()+1,d=now.getDate();
  const dji=getDayPillarIndex(y,m,d);const dgi=dji%10,dzi=dji%12;const dg=TG[dgi],dz=DZ[dzi];
  let jie='';for(let i=0;i<12;i++){const j=jqDate(y,i);if(j){if(m>j[0]||(m===j[0]&&d>=j[1]))jie=['立春','惊蛰','清明','立夏','芒种','小暑','立秋','白露','寒露','立冬','大雪','小寒'][i];}}
  const sxm={'子':'鼠','丑':'牛','寅':'虎','卯':'兔','辰':'龙','巳':'蛇','午':'马','未':'羊','申':'猴','酉':'鸡','戌':'狗','亥':'猪'};
  const todaySX=sxm[dz],chongSX=sxm[ZHI_CHONG[dz]];
  const sxjx={'鼠':'天贵','牛':'天德','虎':'天马','兔':'文昌','龙':'紫微','蛇':'红鸾','马':'将星','羊':'天医','猴':'驿马','鸡':'桃花','狗':'华盖','猪':'福星'};
  let yi=[],ji=['与'+chongSX+'相冲者大事需谨慎'];let yj='';
  if('甲乙'.includes(dg)){yi.push('种植','出行','会友');ji.push('动土','开矿');yj='木气生发之日，宜动不宜静，早起行好运，利谋新事。';}
  else if('丙丁'.includes(dg)){yi.push('文书','庆典','装饰');ji.push('涉水','冷库作业');yj='火德当令，光明在前，利文书庆典，忌口舌争执。';}
  else if('戊己'.includes(dg)){yi.push('置业','收纳','祭祀');ji.push('嫁娶','远行');yj='土性厚重，稳中求进，忌冒进求快，适合整理收纳。';}
  else if('庚辛'.includes(dg)){yi.push('裁决','交易','修造');ji.push('宴饮','借贷');yj='金气锐利，当断则断，利裁决交易，忌优柔寡断。';}
  else{yi.push('流通','迁移','沐浴');ji.push('签约','婚嫁');yj='水势汪洋，顺势而为，宜流通迁移，忌固守一域。';}
  return`<div style="text-align:center;margin-bottom:14px"><div style="font-family:var(--serif);font-size:1.6em;color:var(--ac-text);margin-bottom:4px">${dg}${dz}日</div><div style="font-size:.75em;color:var(--ac-dim)">${y}年${m}月${d}日${jie?' · '+jie+'后':''}</div></div>
  <div style="display:flex;gap:8px;margin:12px 0"><div style="flex:1;padding:10px;border-radius:10px;background:var(--c-surface-2);text-align:center"><div style="font-size:.65em;color:var(--c-text-3);margin-bottom:4px">生肖</div><div style="font-size:1.1em;font-weight:600">${todaySX}</div></div><div style="flex:1;padding:10px;border-radius:10px;background:var(--c-surface-2);text-align:center"><div style="font-size:.65em;color:var(--c-text-3);margin-bottom:4px">冲煞</div><div style="font-size:1.1em;font-weight:600;color:#d4654a">冲${chongSX}</div></div><div style="flex:1;padding:10px;border-radius:10px;background:var(--c-surface-2);text-align:center"><div style="font-size:.65em;color:var(--c-text-3);margin-bottom:4px">吉神</div><div style="font-size:1.1em;font-weight:600;color:#7ab648">${sxjx[todaySX]||'天德'}</div></div></div>
  <div style="margin:10px 0"><div style="font-size:.75em;color:var(--ac-dim);margin-bottom:6px">今日宜</div><div style="display:flex;flex-wrap:wrap;gap:6px">${yi.map(x=>`<span class="tg tj">${x}</span>`).join('')}</div></div>
  <div style="margin:10px 0"><div style="font-size:.75em;color:var(--ac-dim);margin-bottom:6px">今日忌</div><div style="display:flex;flex-wrap:wrap;gap:6px">${ji.map(x=>`<span class="tg tc">${x}</span>`).join('')}</div></div>
  <div style="font-size:.78em;color:var(--c-text-2);margin-top:12px;padding-top:10px;border-top:1px solid var(--c-border)"><b>一句话日签：</b>${yj}</div>`;
}
function showRiQian(){const baseHtml=renderRiQian();document.getElementById('rqResult').innerHTML=baseHtml;document.getElementById('rqModal').classList.add('open');}
function closeRq(){document.getElementById('rqModal').classList.remove('open');}

function openMonthModal(idx,name,gz,jq,ss){
  const d=window._baziData;if(!d)return;
  const dg=d.dg;
  const monthAnalysis={
    '比肩':'本月比肩当令，自我意识增强，适合独立行动与团队协作，但需防过度竞争消耗精力。',
    '劫财':'本月劫财临旺，易有意外支出或人际摩擦，理财需谨慎，防朋友借贷不还。',
    '食神':'本月食神吐秀，创意与表达力强，适合学习新技能、展示才华、社交联谊。',
    '伤官':'本月伤官透出，思维活跃但易言辞过激，注意沟通方式，利创新突破与变革。',
    '偏财':'本月偏财星动，有意外收入机会，但忌贪心冒进，适可而止见好就收。',
    '正财':'本月正财当旺，适合稳健理财、谈薪资、收款项，财运平稳上升。',
    '七杀':'本月七杀压身，压力较大但机遇并存，适合攻坚克难、挑战自我、突破瓶颈。',
    '正官':'本月正官临旺，事业运佳，适合争取晋升、考试认证、建立规则与秩序。',
    '偏印':'本月偏印当令，适合学习研究、向内探索，但需防思虑过多、情绪低落。',
    '正印':'本月正印生身，贵人运旺，适合拜师学习、获取资源支持、充电提升。'
  };
  const analysis=monthAnalysis[ss]||'本月气场平和，按部就班即可，宜整理与复盘。';
  // 宜忌跟着当月十神走，不再是一张通用清单
  const _mYiJi={
    '比肩':{yi:['独立推进','团队协作','健身蓄力'],ji:['过度竞争','单打独斗到底']},
    '劫财':{yi:['明确权责','谈清分成','守住边界'],ji:['冲动借钱','为人担保']},
    '食神':{yi:['创作表达','学习技能','轻松社交'],ji:['透支玩乐','拖延正事']},
    '伤官':{yi:['创新提案','优化流程','表达观点'],ji:['顶撞上级','言辞带刺']},
    '偏财':{yi:['拓展渠道','捕捉机会','灵活增收'],ji:['贪多冒进','重仓投机']},
    '正财':{yi:['稳健理财','谈薪收款','精算账目'],ji:['盲目扩张','轻信高息']},
    '七杀':{yi:['攻坚克难','争取突破','立规矩'],ji:['硬碰硬','透支健康']},
    '正官':{yi:['争取晋升','考试认证','理顺流程'],ji:['越权行事','忽视规则']},
    '偏印':{yi:['研究复盘','独处充电','整理思路'],ji:['钻牛角尖','闭门造车']},
    '正印':{yi:['拜师学习','争取支持','休养生息'],ji:['过度依赖','懒散拖延']}
  };
  const _mj=_mYiJi[ss]||{yi:['整理规划','稳步推进'],ji:['冲动决定','熬夜透支']};
  const yi=_mj.yi,ji=_mj.ji;
  const el=document.getElementById('monthModalContent');
  el.innerHTML=`<div class="mm-title">${name} · ${gz}</div>
    <div class="mm-row"><span class="mm-label">十神</span><span class="mm-value">${ss}</span></div>
    <div class="mm-row"><span class="mm-label">节气</span><span class="mm-value">${jq||'待查'}</span></div>
    <div class="mm-row"><span class="mm-label">日主</span><span class="mm-value">${dg}</span></div>
    <div style="margin:14px 0;font-size:.82em;color:var(--c-text);line-height:1.8">${analysis}</div>
    <div style="margin:10px 0"><div style="font-size:.7em;color:rgba(122,182,72,.8);margin-bottom:6px">本月宜</div><div style="display:flex;flex-wrap:wrap;gap:4px">${yi.map(x=>`<span class="mm-tag yi">宜${x}</span>`).join('')}</div></div>
    <div style="margin:10px 0"><div style="font-size:.7em;color:rgba(212,101,74,.8);margin-bottom:6px">本月忌</div><div style="display:flex;flex-wrap:wrap;gap:4px">${ji.map(x=>`<span class="mm-tag ji">忌${x}</span>`).join('')}</div></div>`;
  document.getElementById('monthModal').classList.add('open');
}
function closeMonthModal(){document.getElementById('monthModal').classList.remove('open');}

function selChip(el){const wrap=document.getElementById('qChips');wrap.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));el.classList.add('active');document.getElementById('bQ').value=el.dataset.q;}


(function(){
  const inp=document.getElementById('cInp'),hid=document.getElementById('bPlace'),dd=document.getElementById('cDD');
  if(!inp||!hid||!dd)return;
  let ai=-1,blurTimer=null;
  // Escape overflow clipping, while keeping the list anchored to the input.
  document.body.appendChild(dd);dd.classList.add('cdd-floating');
  function placeDropdown(){
    const r=inp.getBoundingClientRect(),viewport=window.visualViewport;
    const top=viewport?.offsetTop||0;
    const bottom=top+(viewport?.height||window.innerHeight);
    const submit=document.querySelector('#formModal .character-form-submit')?.getBoundingClientRect();
    const error=document.getElementById('formError');
    const feedback=!error?.hidden?error?.getBoundingClientRect():null;
    // Keep the submit button and any validation feedback tappable and visible.
    const lowerEdge=Math.min(bottom-8,
      submit&&submit.top>r.bottom?submit.top-8:bottom-8,
      feedback&&feedback.top>r.bottom?feedback.top-8:bottom-8);
    const spaceBelow=Math.max(0,lowerEdge-r.bottom-4);
    const spaceAbove=Math.max(0,r.top-top-8);
    const below=spaceBelow>=120||spaceBelow>=spaceAbove;
    const maxHeight=Math.min(260,below?spaceBelow:spaceAbove);
    dd.style.left=Math.round(r.left)+'px';
    dd.style.width=Math.round(r.width)+'px';
    dd.style.bottom='auto';
    dd.style.maxHeight=Math.round(maxHeight)+'px';
    if(below){dd.style.top=Math.round(r.bottom+4)+'px';}
    else{
      // A short list should touch the input instead of floating maxHeight away.
      const height=dd.getBoundingClientRect().height;
      dd.style.top=Math.round(Math.max(top+4,r.top-4-height))+'px';
    }
  }
  function rdd(f){
    let h='',n=0;const q=(f||'').trim().toLowerCase();
    CG.forEach(g=>{
      const m=g.c.filter(c=>!q||c.n.includes(q)||c.i.includes(q)||g.g.includes(q)||(c.p&&c.p.toLowerCase().includes(q)));
      if(!m.length)return;
      h+=`<div class="cg" role="presentation">${g.g}</div>`;
      m.forEach(c=>{h+=`<button type="button" class="co" role="option" aria-selected="false" tabindex="-1" id="city-option-${c.i}" data-i="${c.i}"><span>${c.n}</span><span class="cp">${g.g}</span></button>`;n++;});
    });
    if(!n)h='<div class="cg" role="presentation">未找到城市，请选择附近城市</div>';
    dd.innerHTML=h;ai=-1;inp.removeAttribute('aria-activedescendant');
  }
  function openDD(){
    if(!document.getElementById('formModal')?.classList.contains('open'))return;
    dd.classList.add('show');inp.setAttribute('aria-expanded','true');placeDropdown();
  }
  function updateActive(opts){
    opts.forEach((option,index)=>{
      const active=index===ai;option.classList.toggle('act',active);
      option.setAttribute('aria-selected',String(active));
    });
    if(opts[ai]){
      inp.setAttribute('aria-activedescendant',opts[ai].id);
      opts[ai].scrollIntoView({block:'nearest'});
    }else inp.removeAttribute('aria-activedescendant');
  }
  inp.addEventListener('focus',()=>{clearTimeout(blurTimer);rdd(inp.value===(CD[hid.value]||{}).n?'':inp.value);openDD();});
  inp.addEventListener('input',()=>{hid.value='';rdd(inp.value);openDD();});
  inp.addEventListener('blur',()=>{blurTimer=setTimeout(closeCityDropdown,200);});
  // mousedown prevents an early blur; click also fires reliably for touch and
  // assistive technology on the semantic button, including older iOS Safari.
  dd.addEventListener('mousedown',e=>{if(e.target.closest('.co'))e.preventDefault();});
  dd.addEventListener('click',e=>{const option=e.target.closest('.co');if(option){clearTimeout(blurTimer);selectBirthCity(option.dataset.i);}});
  const reposition=()=>{
    if(!dd.classList.contains('show'))return;
    const r=inp.getBoundingClientRect(),sheet=document.querySelector('#formModal .form-modal-sheet')?.getBoundingClientRect();
    const viewport=window.visualViewport,top=viewport?.offsetTop||0,bottom=top+(viewport?.height||window.innerHeight);
    if(r.bottom<=Math.max(top,sheet?.top??top)||r.top>=Math.min(bottom,sheet?.bottom??bottom))closeCityDropdown();
    else placeDropdown();
  };
  window.addEventListener('resize',reposition);
  window.addEventListener('scroll',reposition,true);
  window.visualViewport?.addEventListener('resize',reposition);
  window.visualViewport?.addEventListener('scroll',reposition);
  inp.addEventListener('keydown',e=>{
    // Enter/Escape may belong to the Chinese input method, not the picker.
    if(e.isComposing||e.keyCode===229)return;
    const opts=dd.querySelectorAll('.co');
    if(e.key==='ArrowDown'){e.preventDefault();if(!dd.classList.contains('show'))openDD();ai=Math.min(ai+1,opts.length-1);updateActive(opts);}
    else if(e.key==='ArrowUp'){e.preventDefault();ai=Math.max(ai-1,0);updateActive(opts);}
    else if(e.key==='Enter'){
      e.preventDefault();
      if(ai>=0&&opts[ai])selectBirthCity(opts[ai].dataset.i);
      else{
        const match=resolveBirthCity();
        if(match)selectBirthCity(match.id);
        else showFormError(CITY_SELECTION_MESSAGE,inp);
      }
    }
    else if(e.key==='Escape'&&dd.classList.contains('show')){e.stopPropagation();closeCityDropdown();}
  });
  window.rdd=rdd;window.sel=selectBirthCity;
})();

/* 首页汉堡菜单 */
function toggleHomeMenu(force){
  const btn=document.getElementById('homeMenuBtn');
  const ov=document.getElementById('homeMenuOverlay');
  const dw=document.getElementById('homeMenuDrawer');
  if(!btn||!ov||!dw)return;
  let open;
  if(force===false)open=false;
  else if(force===true)open=true;
  else open=!btn.classList.contains('active');
  btn.classList.toggle('active',open);
  btn.setAttribute('aria-expanded',String(open));
  btn.setAttribute('aria-label',open?'关闭菜单':'打开菜单');
  ov.classList.toggle('open',open);
  dw.classList.toggle('open',open);
  dw.inert=!open;
  dw.setAttribute('aria-hidden',String(!open));
  if(open)focusSafely(dw.querySelector('.home-menu-close'));
  else if(dw.contains(document.activeElement))focusSafely(window.__wenFlow?.focusTarget?.()||btn);
  document.body.style.overflow=open?'hidden':'';
  window.__wenFlow?.onMenuToggle?.(open);
}
window.toggleHomeMenu=toggleHomeMenu;

/* 推演结果页汉堡菜单 */
function toggleP2Menu(force){
  const btn=document.getElementById('p2MenuBtn');
  const ov=document.getElementById('p2MenuOverlay');
  const dw=document.getElementById('p2MenuDrawer');
  if(!btn||!ov||!dw)return;
  let open;
  if(force===false)open=false;
  else if(force===true)open=true;
  else open=!btn.classList.contains('active');
  btn.classList.toggle('active',open);
  ov.classList.toggle('open',open);
  dw.classList.toggle('open',open);
  document.body.style.overflow=open?'hidden':'';
  /* 打开时同步浅色、深色与跟随系统设置。 */
  if(open)_syncP2ThemeSeg();
}
window.toggleP2Menu=toggleP2Menu;

/* P2 菜单内联主题切换 */
let _p2ThemeBound=false;
function _syncP2ThemeSeg(){
  const seg=document.getElementById('p2ThemeSeg');
  if(!seg)return;
  const pref=getThemePref();
  seg.querySelectorAll('.gs-seg-opt').forEach(b=>b.classList.toggle('active',b.dataset.val===pref));
  if(!_p2ThemeBound){
    _p2ThemeBound=true;
    seg.addEventListener('click',e=>{
      const btn=e.target.closest('.gs-seg-opt');
      if(!btn)return;
      applyThemePref(btn.dataset.val);
      seg.querySelectorAll('.gs-seg-opt').forEach(b=>b.classList.toggle('active',b===btn));
    });
  }
}

/* 离开报告页时自动关闭 p2 菜单 */
(function(){
  const _goBack=window.goBack;
  if(typeof _goBack==='function'){
    window.goBack=function(){toggleP2Menu(false);return _goBack.apply(this,arguments);};
  }
})();

/* ============================================================
   全局设置弹窗
   ============================================================ */
function _buildGlobalSettingsPanel(){
  const panel=document.getElementById('globalSettingsPanel');
  if(!panel||panel.children.length)return panel;

  panel.innerHTML='<div id="gsAIContainer"></div>';

  /* AI 设置面板嵌入 */
  const aiContainer=panel.querySelector('#gsAIContainer');
  if(aiContainer && typeof buildAISettingsPanel==='function'){
    buildAISettingsPanel(aiContainer);
  }

  return panel;
}

function openGlobalSettings(){
  const modal=document.getElementById('globalSettingsModal');
  if(!modal)return;
  _buildGlobalSettingsPanel();
  modal.classList.add('open');
  const dock=document.querySelector('.ig-dock.tab-bar');
  if(dock)dock.style.display='none';
}
window.openGlobalSettings=openGlobalSettings;

function closeGlobalSettings(){
  const modal=document.getElementById('globalSettingsModal');
  if(!modal)return;
  modal.classList.remove('open');
  const dock=document.querySelector('.ig-dock.tab-bar');
  if(dock)dock.style.display='';
}
window.closeGlobalSettings=closeGlobalSettings;

/* 离开首页时自动关闭菜单 */
(function(){
  const _goBack=window.goBack;
  if(typeof _goBack==='function'){
    window.goBack=function(){toggleHomeMenu(false);return _goBack.apply(this,arguments);};
  }
  const _loadProfile=window.loadProfile;
  if(typeof _loadProfile==='function'){
    window.loadProfile=function(){toggleHomeMenu(false);return _loadProfile.apply(this,arguments);};
  }
})();

onDomReady(()=>{
  initOnboarding();
  const about=document.getElementById('aboutModal');
  about?.addEventListener('keydown',e=>{
    e.stopPropagation();
    if(e.key==='Escape'){e.preventDefault();window.closeAboutModal();return;}
    if(e.key==='Tab'){
      const controls=[...about.querySelectorAll('button:not(:disabled), [tabindex="0"]')].filter(el=>el.getClientRects().length);
      const i=controls.indexOf(document.activeElement);
      if(controls.length&&(i<0||(!e.shiftKey&&i===controls.length-1)||(e.shiftKey&&i===0))){e.preventDefault();controls[e.shiftKey?controls.length-1:0].focus();}
    }
  });
  window.__wenProfilesReady=initDB().then(()=>renderProfiles()).catch(e=>console.warn('[profile] db init',e));
  const ai=document.getElementById('askInput');
  if(ai){
    ai.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();doAskCustom()}});
    ai.addEventListener('input',aiOnInputSuggest);
    ai.addEventListener('focus',aiOnInputSuggest);
    ai.addEventListener('blur',()=>setTimeout(()=>{const s=document.getElementById('aiSuggest');if(s)s.classList.remove('show');},200));
  }
  document.addEventListener('keydown',e=>{
    if(document.getElementById('funnelTeaser'))return; // 预告罩层独占键盘
    if(e.key==='Escape'){
      const aiSettings=document.getElementById('aiSettingsModal');if(aiSettings&&aiSettings.classList.contains('open')){window.closeAISettingsModal();return;}
      const ask=document.getElementById('aiSheet');if(ask&&ask.classList.contains('open')){closeAsk();return;}
      const save=document.getElementById('saveModal');if(save&&save.classList.contains('open')){closeSaveModal();return;}
      const arch=document.getElementById('archiveModal');if(arch&&arch.classList.contains('open')){closeArchiveModal();return;}
      const fm=document.getElementById('formModal');if(fm&&fm.classList.contains('open')){window.TJCloseForm&&window.TJCloseForm();return;}
      const rq=document.getElementById('rqModal');if(rq&&rq.classList.contains('open')){closeRq();return;}
      const p2=document.getElementById('page2');if(p2&&(p2.classList.contains('active')||!p2.classList.contains('hidden'))){window.goBack();return;}
    }
    if((e.ctrlKey||e.metaKey)&&e.key==='p'){e.preventDefault();window.print();return;}
    if((e.ctrlKey||e.metaKey)&&e.key==='c'){
      // 用户正在选中文本或在输入框里时，不劫持系统复制
      const sel=window.getSelection?window.getSelection().toString():'';
      const ae=document.activeElement;
      if(sel||(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'||ae.isContentEditable)))return;
      const p2=document.getElementById('page2');if(p2&&p2.classList.contains('active')){e.preventDefault();copyReport();return;}
    }
    const p2=document.getElementById('page2');
    if(p2&&p2.classList.contains('active')){if(e.key>='1'&&e.key<='4'){const tabs=document.querySelectorAll('.tab-item');const idx=parseInt(e.key,10)-1;if(tabs[idx]){tabs[idx].click();return;}}}
  });
});

/* ====== 卡片常开 ======
   分区标签一次只显示一张卡片，折叠按钮与折叠态已无意义。
   不再注入折叠按钮；进入报告时清理历史会话可能残留的
   折叠按钮/折叠态标记，保证卡片始终完整展开。 */
(function(){
  function injectToggles(){
    document.querySelectorAll('#page2 .glass[data-card]').forEach(el=>{
      el.classList.remove('collapsed');
      el.removeAttribute('data-collapsible');
      const hd=el.querySelector('.card-hd');
      const btn=el.querySelector('.card-toggle');
      if(btn){btn.remove();if(hd){hd.style.cursor='';const clone=hd.cloneNode(true);hd.replaceWith(clone);}}
    });
  }
  window._injectCardToggles=injectToggles;
})();

/* ====== 合并卡：当下关注 子 tab 切换 ====== */
function focusSwitchTab(btn){
  const card=btn.closest('.focus-card');
  if(!card)return;
  const sub=btn.dataset.sub;
  card.querySelectorAll('.focus-tab').forEach(t=>t.classList.toggle('active',t===btn));
  card.querySelectorAll('.focus-pane').forEach(p=>p.classList.toggle('active',p.dataset.sub===sub));
}

/* ====== 信息密度：紧凑/详细 切换 + 返回顶部 ====== */
(function(){
  // 还原上次设置
  try{if(localStorage.getItem('tj_density')==='1')document.body.classList.add('density-compact');}catch(e){}
  // 滚动监听显示返回顶部
  onWindowLoad(()=>{
    const sc=document.getElementById('p2Scroll');
    const btn=document.getElementById('backToTop');
    if(!sc||!btn)return;
    let ticking=false;
    sc.addEventListener('scroll',()=>{
      if(ticking)return;
      ticking=true;
      requestAnimationFrame(()=>{
        btn.classList.toggle('show',sc.scrollTop>200);
        ticking=false;
      });
    },{passive:true});
    if(document.getElementById('densityToggle')&&document.body.classList.contains('density-compact')){
      document.getElementById('densityToggle').classList.add('on');
    }
  });
})();

/* =========================================================
   首页：粒子 + 鼠标跟随 + 卡片视差 + body.home 自动切换
   ========================================================= */
(function(){
  const isMobile=window.matchMedia('(hover:none)').matches;

  // ---- body.home 状态管理（page1 显示时启用首页特效）----
  function applyHomeState(){
    const p1=document.getElementById('page1');
    const p2=document.getElementById('page2');
    const onHome=p1&&!p1.classList.contains('hidden')&&(!p2||p2.classList.contains('hidden')||!p2.classList.contains('active'));
    document.body.classList.toggle('home',onHome);
  }
  // 初始
  onDomReady(applyHomeState);
  // 监听 page1/page2 class 改动
  const obs=new MutationObserver(()=>applyHomeState());
  onWindowLoad(()=>{
    const p1=document.getElementById('page1'),p2=document.getElementById('page2');
    if(p1)obs.observe(p1,{attributes:true,attributeFilter:['class']});
    if(p2)obs.observe(p2,{attributes:true,attributeFilter:['class']});
    applyHomeState();
  });

  // ---- 鼠标光球：只在可见时运动，静止后停止调度帧 ----
  // Older WebViews may reject a media query even when matchMedia exists.
  let reducedMotion={matches:false};
  try{reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');}catch(e){}
  const onMotionChange=(callback)=>{
    if(reducedMotion.addEventListener)reducedMotion.addEventListener('change',callback);
    else if(reducedMotion.addListener)reducedMotion.addListener(callback);
  };
  if(!isMobile){
    const dot=document.getElementById('tjCursorDot');
    const ring=document.getElementById('tjCursorRing');
    if(dot&&ring){
      let mx=window.innerWidth/2,my=window.innerHeight/2;
      let dx=mx,dy=my,rx=mx,ry=my,frame=0,hasPointer=false;
      const visible=()=>!document.hidden&&!document.body.classList.contains('home');
      const position=()=>{
        dot.style.transform='translate3d('+dx+'px,'+dy+'px,0) translate(-50%,-50%)';
        ring.style.transform='translate3d('+rx+'px,'+ry+'px,0) translate(-50%,-50%)';
      };
      const cancel=()=>{if(frame)cancelAnimationFrame(frame);frame=0;};
      function tick(){
        frame=0;
        if(!visible()||!hasPointer)return;
        dx+=(mx-dx)*0.4;dy+=(my-dy)*0.4;
        rx+=(mx-rx)*0.18;ry+=(my-ry)*0.18;
        if(Math.max(Math.abs(mx-dx),Math.abs(my-dy),Math.abs(mx-rx),Math.abs(my-ry))<0.15){
          dx=rx=mx;dy=ry=my;
          position();
          return;
        }
        position();frame=requestAnimationFrame(tick);
      }
      function sync(){
        if(!visible()||!hasPointer){cancel();return;}
        if(reducedMotion.matches){cancel();dx=rx=mx;dy=ry=my;position();}
        else if(!frame)frame=requestAnimationFrame(tick);
      }
      window.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;hasPointer=true;dot.classList.remove('hide');ring.classList.remove('hide');sync();},{passive:true});
      window.addEventListener('mouseleave',()=>{hasPointer=false;cancel();dot.classList.add('hide');ring.classList.add('hide');});
      window.addEventListener('mousedown',()=>ring.classList.add('active'));
      window.addEventListener('mouseup',()=>ring.classList.remove('active'));
      document.addEventListener('mouseover',e=>{
        const t=e.target;
        if(t&&t.closest&&t.closest('button,a,input,select,textarea,.chip,.cta,.tab-item,.r-card,.pf-card,.ai-chip,.ai-cat,.ai-route-btn,.tl-card,.lym-item,[onclick],[data-q]')){
          dot.classList.add('hover');ring.classList.add('hover');
        }
      });
      document.addEventListener('mouseout',e=>{
        const t=e.target;
        if(t&&t.closest&&t.closest('button,a,input,select,textarea,.chip,.cta,.tab-item,.r-card,.pf-card,.ai-chip,.ai-cat,.ai-route-btn,.tl-card,.lym-item,[onclick],[data-q]')){
          dot.classList.remove('hover');ring.classList.remove('hover');
        }
      });
      new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
      document.addEventListener('visibilitychange',sync);
      onMotionChange(sync);
    }
  }

  // ---- 粒子：仅在报告可见时初始化和绘制；减少动态效果时保留静态星点 ----
  const cv=document.getElementById('tjParticles');
  if(cv){
    let ctx=null,W=0,H=0,DPR=1,parts=[],frame=0,lastDraw=0,needsResize=true;
    let mouseX=-9999,mouseY=-9999;
    let accentH='38',accentS='55%';
    const visible=()=>!document.hidden&&document.body.classList.contains('report-active');
    function readAccent(){
      const st=getComputedStyle(document.documentElement);
      accentH=st.getPropertyValue('--accent-h').trim()||'38';
      accentS=st.getPropertyValue('--accent-s').trim()||'55%';
    }
    function resize(){
      DPR=Math.min(window.devicePixelRatio||1,2);
      W=window.innerWidth;H=window.innerHeight;
      cv.width=W*DPR;cv.height=H*DPR;
      cv.style.width=W+'px';cv.style.height=H+'px';
      ctx.setTransform(DPR,0,0,DPR,0,0);
      const target=Math.min(130,Math.max(55,Math.floor(W*H/13000)));
      parts=Array.from({length:target},()=>{
        const bright=Math.random()<0.12;
        return {x:Math.random()*W,y:Math.random()*H,
          vx:(Math.random()-0.5)*0.18,vy:(Math.random()-0.5)*0.18,
          r:bright?(Math.random()*1.4+1.0):(Math.random()*1.0+0.3),
          a:bright?(Math.random()*0.3+0.55):(Math.random()*0.5+0.2),
          twinkle:Math.random()*Math.PI*2,tspd:0.02+Math.random()*0.05};
      });
      needsResize=false;
    }
    function draw(){
      ctx.clearRect(0,0,W,H);
      for(const p of parts){
        if(!reducedMotion.matches){
          p.x+=p.vx;p.y+=p.vy;p.twinkle+=p.tspd;
          if(p.x<0)p.x=W;else if(p.x>W)p.x=0;
          if(p.y<0)p.y=H;else if(p.y>H)p.y=0;
          const dx=p.x-mouseX,dy=p.y-mouseY,d2=dx*dx+dy*dy;
          if(d2<14400){const f=(1-d2/14400)*0.6;p.x+=dx*f*0.04;p.y+=dy*f*0.04;}
        }
        const tw=0.7+Math.sin(p.twinkle)*0.3;
        ctx.fillStyle='hsla('+accentH+','+accentS+',75%,'+(p.a*tw)+')';
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
      }
    }
    function tick(now){
      frame=0;
      if(!visible()||reducedMotion.matches)return;
      if(now-lastDraw>=33){lastDraw=now;draw();}
      frame=requestAnimationFrame(tick);
    }
    function sync(){
      if(!visible()){
        if(frame)cancelAnimationFrame(frame);
        frame=0;
        return;
      }
      if(!ctx)ctx=cv.getContext('2d');
      if(!ctx)return;
      if(needsResize)resize();
      if(reducedMotion.matches){
        if(frame)cancelAnimationFrame(frame);
        frame=0;draw();
      }else if(!frame){
        lastDraw=0;frame=requestAnimationFrame(tick);
      }
    }
    function updateAccent(){readAccent();if(visible()&&reducedMotion.matches&&ctx)draw();}
    window.addEventListener('mousemove',e=>{mouseX=e.clientX;mouseY=e.clientY;},{passive:true});
    window.addEventListener('mouseleave',()=>{mouseX=-9999;mouseY=-9999;});
    window.addEventListener('resize',()=>{needsResize=true;readAccent();sync();},{passive:true});
    document.addEventListener('visibilitychange',sync);
    new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
    new MutationObserver(updateAccent).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-home-theme']});
    onMotionChange(sync);
    readAccent();sync();
  }

  // ---- 表单与独立卡片 3D 视差倾斜 (自动跳过 3D 轮播卡片避免矩阵冲突) ----
  function bindTilt(el){
    if(!el||isMobile)return;
    if(el.closest('.tool-hub, .tool-ring-stage, .tool-row-stage, .tool-card-portrait, .tool-card-ring'))return;
    let raf=null;
    el.addEventListener('mousemove',e=>{
      const r=el.getBoundingClientRect();
      const x=e.clientX-r.left,y=e.clientY-r.top;
      const px=x/r.width,py=y/r.height;
      // 光点位置（CSS 变量驱动 ::before 径向光）
      el.style.setProperty('--mx',(px*100).toFixed(1)+'%');
      el.style.setProperty('--my',(py*100).toFixed(1)+'%');
      if(raf)cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{
        const rx=(0.5-py)*8,ry=(px-0.5)*8;
        el.style.setProperty('--rx', rx.toFixed(2)+'deg');
        el.style.setProperty('--ry', ry.toFixed(2)+'deg');
        el.style.transform='perspective(1000px) rotateX('+rx.toFixed(2)+'deg) rotateY('+ry.toFixed(2)+'deg) translateY(-4px) scale3d(1.02, 1.02, 1.02)';
      });
    });
    el.addEventListener('mouseleave',()=>{
      el.style.transform='perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)';
      el.style.setProperty('--mx','50%');el.style.setProperty('--my','50%');
      el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg');
    });
  }
  // —— 全局：绑定到 .home-card 与 page2 内的独立 .glass 卡片 ——
  function bindAllTilt(){
    document.querySelectorAll('.home-card:not([data-tilted])').forEach(el=>{bindTilt(el);el.setAttribute('data-tilted','1');});
    document.querySelectorAll('#page2 .glass:not(.tool-hub):not([data-tilted])').forEach(el=>{bindTilt(el);el.setAttribute('data-tilted','1');});
  }
  onWindowLoad(bindAllTilt);
  // 推算完成后 page2 内容会被重渲染，提供一个全局钩子
  window._rebindTilt=bindAllTilt;

  // ---- CTA 按钮涟漪 ----
  document.addEventListener('click',e=>{
    const btn=e.target&&e.target.closest&&e.target.closest('.cta');
    if(!btn||btn.disabled)return;
    const r=btn.getBoundingClientRect();
    const x=e.clientX-r.left,y=e.clientY-r.top;
    const size=Math.max(r.width,r.height);
    const rip=document.createElement('span');
    rip.className='cta-ripple';
    rip.style.width=rip.style.height=size+'px';
    rip.style.left=(x-size/2)+'px';rip.style.top=(y-size/2)+'px';
    btn.appendChild(rip);
    setTimeout(()=>rip.remove(),700);
  });
})();

/* ===== iOS 27 Liquid Glass：强度切换 + 标签栏指示条液化滑动 ===== */
/* ===== 分层阅读：术语解释 + 专业数据折叠 ===== */

let proWrapCounter=0;
function wrapProCollapsibles(root){
  if(!root)return;
  root.querySelectorAll('.pls, .qr-grid, table').forEach(el=>{
    if(el.dataset.proWrapped || !el.parentNode)return;
    el.dataset.proWrapped='1';
    const wrap=document.createElement('div');
    wrap.className='pro-wrap collapsed';
    wrap.id=`tj-pro-wrap-${++proWrapCounter}`;
    el.parentNode.insertBefore(wrap,el);
    wrap.appendChild(el);
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='pro-toggle';
    btn.setAttribute('aria-controls',wrap.id);
    btn.setAttribute('aria-expanded','false');
    btn.textContent='查看专业数值 ▾';
    btn.addEventListener('click',()=>{
      const collapsed=wrap.classList.toggle('collapsed');
      btn.setAttribute('aria-expanded',String(!collapsed));
      btn.textContent=collapsed?'查看专业数值 ▾':'收起专业数值 ▴';
    });
    if(wrap.parentNode)wrap.parentNode.insertBefore(btn,wrap);
  });
}

function enrichBeginnerContent(root){wrapProCollapsibles(root);}

function setSystemMode(mode){
  const isWestern=mode==='western';
  const sysMode=isWestern?'western':'eastern';
  document.body.setAttribute('data-system-mode',sysMode);
  document.documentElement.setAttribute('data-system-mode',sysMode);
  try{localStorage.setItem('tj_system_mode',sysMode);}catch(e){}
  const easternBtn=document.getElementById('modeEastern');
  const westernBtn=document.getElementById('modeWestern');
  if(easternBtn&&westernBtn){
    easternBtn.classList.toggle('active',!isWestern);
    westernBtn.classList.toggle('active',isWestern);
    easternBtn.setAttribute('aria-selected',!isWestern?'true':'false');
    westernBtn.setAttribute('aria-selected',isWestern?'true':'false');
  }

  // 底部 Dock 标签文案与图标切换
  const labelMing=document.getElementById('tabLabelMing');
  const labelYun=document.getElementById('tabLabelYun');
  const labelRel=document.getElementById('tabLabelRel');
  if(labelMing)labelMing.textContent=isWestern?'占星术':'命盘';
  if(labelYun)labelYun.textContent=isWestern?'星座全览':'运势';
  if(labelRel)labelRel.textContent=isWestern?'生命灵术':'关系';

  document.querySelectorAll('.ig-nav-icon-eastern').forEach(el=>{
    el.style.setProperty('display',isWestern?'none':'block','important');
  });
  document.querySelectorAll('.ig-nav-icon-western').forEach(el=>{
    el.style.setProperty('display',isWestern?'block':'none','important');
  });

  const pop=document.getElementById('glossPop');if(pop)pop.classList.remove('open');

  // 重构标签页
  if(typeof window.TJBuildSectionTabs==='function'){
    window.TJBuildSectionTabs();
  }

  // 触发 indicator 居中重算
  const activeTab=document.querySelector('.tab-item.active');
  if(activeTab&&typeof moveTabIndicator==='function'){
    moveTabIndicator(activeTab);
  }
}
/* 顶部右侧圆形按钮：打开日历模式 */
let calendarOpening = false;
async function openCalendarMode(){
  if(calendarOpening)return;
  calendarOpening=true;
  const fab=document.getElementById('calFab');
  const button=document.getElementById('homeCtaCal');
  const label=button?.querySelector(':scope > span:last-child');
  const original=label?.textContent;
  if(fab)fab.classList.add('active');
  if(!window._tools2Ready){
    button?.setAttribute('aria-busy','true');
    if(label)label.textContent='加载中…';
  }
  try{
    await ensureTools2();
    window.openToolPage('calendar');
  }catch(e){
    console.error('[openCalendarMode] 日历加载失败',e);
    showToast('日历暂时无法加载，请检查网络后重试。');
    fab?.classList.remove('active');
  }finally{
    button?.removeAttribute('aria-busy');
    if(label)label.textContent=original;
    calendarOpening=false;
  }
}
function toggleUserMode(){
  const cur=document.body.getAttribute('data-system-mode')||'eastern';
  setSystemMode(cur==='eastern'?'western':'eastern');
}
(function initSystemMode(){
  let mode='eastern';
  try{mode=localStorage.getItem('tj_system_mode')||'eastern';}catch(e){}
  setSystemMode(mode);
})();
(function observeReportContent(){
  const target=document.getElementById('p2Inner');
  if(!target||typeof MutationObserver==='undefined')return;
  let t=null;
  const obs=new MutationObserver(()=>{
    clearTimeout(t);
    t=setTimeout(()=>enrichBeginnerContent(target),120);
  });
  obs.observe(target,{childList:true,subtree:true});
})();

/* 工具中心 3D 环形轮播初始化 */
(function(){
  function mount(){
    const hub=document.querySelector('#s-adv .tool-hub');
    if(!hub)return;
    if(!window._tools3DRing || !window._tools3DRing.stage?.isConnected){
      initTools3DRingCarousel(hub);
    }
  }
  const oldSwitch=window.switchTab;
  window.switchTab=function(el){
    if(oldSwitch)oldSwitch(el);
    if(el&&el.dataset.sec==='s-adv'){
      setTimeout(()=>{
        mount();
        if(window._tools3DRing) window._tools3DRing.onTabShow();
      },50);
    }
  };
  onDomReady(mount);
  new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});
})();

/* ============================================================
   tools2 · 非首屏功能在首页素材完成后加载；点日历时立即按需加载。
   bootstrap 必须位于所有旧 IIFE 之后，避免旧入口覆盖新入口。
   ============================================================ */
let tools2Promise;
function ensureTools2(){
  if(!tools2Promise){
    tools2Promise=import('./tools2/index.js')
      .then(m=>{m.bootstrap();})
      .catch(e=>{tools2Promise=null;throw e;});
  }
  return tools2Promise;
}
function scheduleTools2(){
  const start=()=>ensureTools2().catch(e=>console.error('[tools2] 加载失败，继续使用旧版工具页',e));
  if('requestIdleCallback' in window)window.requestIdleCallback(start,{timeout:1500});
  else setTimeout(start,100);
}
if(document.readyState==='complete')scheduleTools2();
else window.addEventListener('load',scheduleTools2,{once:true});

/* 术语解释：选中文字 → 右键/长按菜单（取消自动下划线标注） */
installSelectionGloss();

/* ============================================================
   表单未推演保护：修改输入后未推演，点击「重新推演」弹窗确认
   ============================================================ */
(function(){
  /* 轻量确认弹窗（移动端友好，非原生 confirm） */
  window.showConfirm=function(opts){
    document.getElementById('tjConfirm')?.remove();
    const box=document.createElement('div');
    box.className='tj-confirm';box.id='tjConfirm';
    box.innerHTML=
      '<div class="tj-confirm-bg"></div>'+
      '<div class="tj-confirm-card" role="alertdialog" aria-modal="true" aria-label="'+(opts.title||'提示')+'">'+
        '<div class="tt">'+(opts.title||'提示')+'</div>'+
        '<div class="tx">'+(opts.text||'')+'</div>'+
        '<div class="acts">'+
          '<button type="button" class="ghost" data-act="cancel">'+(opts.cancelText||'取消')+'</button>'+
          '<button type="button" class="primary" data-act="ok">'+(opts.okText||'确定')+'</button>'+
        '</div>'+
      '</div>';
    document.body.appendChild(box);
    const done=(act)=>{box.remove();if(act==='ok'&&opts.onOk)opts.onOk();if(act==='cancel'&&opts.onCancel)opts.onCancel();};
    box.querySelector('[data-act="ok"]').addEventListener('click',()=>done('ok'));
    box.querySelector('[data-act="cancel"]').addEventListener('click',()=>done('cancel'));
    box.querySelector('.tj-confirm-bg').addEventListener('click',()=>done('cancel'));
    return box;
  };

  /* 表单字段变化 → 标记「已修改未推演」 */
  window._formDirty=false;
  ['bDate','bTime','cInp','bGen','bResultStyle'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el)return;
    el.addEventListener('input',()=>{window._formDirty=true;});
    el.addEventListener('change',()=>{window._formDirty=true;});
  });
  const styleSelect=document.getElementById('bResultStyle'),styleHint=document.getElementById('resultStyleHint');
  const styleButtons=document.querySelectorAll('.result-style-option');
  styleButtons.forEach(btn=>btn.addEventListener('click',()=>{
    const value=btn.dataset.style;
    if(styleSelect)styleSelect.value=value;
    styleButtons.forEach(x=>{const on=x===btn;x.classList.toggle('active',on);x.setAttribute('aria-checked',on?'true':'false');});
    if(styleHint)styleHint.textContent=getResultStyle(value).intro;
    window._formDirty=true;
  }));
  const sw=document.getElementById('swTrueSolar');
  if(sw)sw.addEventListener('click',()=>{window._formDirty=true;});

  /* 拦截「重新推演」：有未推演修改时弹窗确认 */
  const _origGoBack=window.goBack;
  window.goBack=function(){
    if(window._formDirty&&window._ctx){
      window.showConfirm({
        title:'尚未推演',
        text:'你修改了出生信息，但还没有重新推演。返回后修改会保留在表单里，下次打开即可继续。',
        okText:'继续返回',cancelText:'取消',
        onOk:()=>{window._formDirty=false;_origGoBack();},
      });
      return;
    }
    _origGoBack();
  };
})();

/* ============================================================
   彩蛋：长按「关于问问大师」播放图标绘制动画
   ============================================================ */
(function(){
  const HOLD_MS=600;
  let timer=null,triggered=false;

  function playIconDraw(){
    const ov=document.getElementById('iconDrawOverlay');
    if(!ov)return;
    ov.classList.remove('show');
    void ov.offsetWidth;
    ov.classList.add('show');
    setTimeout(()=>{ov.classList.remove('show');},3600);
  }

  function bind(){
    const btn=document.getElementById('aboutBtnP2');
    if(!btn)return;
    btn.addEventListener('pointerdown',function(){
      triggered=false;
      timer=setTimeout(function(){
        triggered=true;timer=null;
        toggleP2Menu(false);
        playIconDraw();
      },HOLD_MS);
    });
    function cancel(){if(timer){clearTimeout(timer);timer=null;}}
    btn.addEventListener('pointerup',cancel);
    btn.addEventListener('pointerleave',cancel);
    btn.addEventListener('pointercancel',cancel);
    btn.addEventListener('click',function(e){
      if(triggered){e.preventDefault();e.stopImmediatePropagation();triggered=false;}
    },true);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',bind);
  }else{bind();}
})();

// Replay a home action made while the larger application modules were loading.
window.__wenAppReady=true;
queueMicrotask(()=>window.dispatchEvent(new Event('tj:app-ready')));
