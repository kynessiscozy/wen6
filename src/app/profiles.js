/* ============================================================
   命盘档案库（IndexedDB + 存档 / 读档 / 导入导出）
   ------------------------------------------------------------
   从 main.js 抽出。排盘动作由外部注入（initProfiles(calc)），
   模块本身不直接触发计算，避免与主流程互相引用。
   数据库名与版本需与 public/funnel.html 保持一致。
   ============================================================ */

import { CD } from '../engines/cities.js';
import { mkBazi, mkWx, mkSs, mkDy, mkLn } from '../engines/bazi.js';
import { CURR_YEAR, SS } from '../engines/shared.js';
import { TJ } from '../state/tj.js';
import { getCtx } from '../state/context.js';
import { calcYearScores } from '../state/scoring.js';
import { getResultStyle } from '../state/result-style.js';
import { showToast } from '../ui/toast.js';

let _profileOnLoad = () => {};
/** 注入「重新排盘」回调，读档后由主流程执行 */
export function initProfiles(fn) { if (typeof fn === 'function') _profileOnLoad = fn; }

const profileEscape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Version 3 repairs v2 databases created without a profiles store by older funnel menus.
// Keep this schema in sync with public/funnel.html.
const DB_NAME='TJ_Bazi',DB_VER=3;
let _db=null;
function initDB(){return new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,DB_VER);r.onerror=()=>rej(r.error);r.onsuccess=(e)=>{_db=e.target.result;_db.onversionchange=()=>{_db.close();_db=null;};res(_db);};r.onupgradeneeded=(e)=>{const d=e.target.result;const s=d.objectStoreNames.contains('profiles')?r.transaction.objectStore('profiles'):d.createObjectStore('profiles',{keyPath:'id',autoIncrement:true});if(!s.indexNames.contains('updatedAt'))s.createIndex('updatedAt','updatedAt',{unique:false});};});}
function dbPut(p){return new Promise((res,rej)=>{if(!_db)return rej('DB未就绪');const t=_db.transaction('profiles','readwrite'),s=t.objectStore('profiles');const r=s.put(p);r.onsuccess=(e)=>res(e.target.result);r.onerror=()=>rej(r.error);});}
function dbGetAll(){return new Promise((res,rej)=>{if(!_db)return res([]);const t=_db.transaction('profiles','readonly'),s=t.objectStore('profiles');const r=s.index('updatedAt').openCursor(null,'prev');const arr=[];r.onsuccess=(e)=>{const c=e.target.result;if(c){arr.push(c.value);c.continue();}else res(arr);};r.onerror=()=>rej(r.error);});}
function dbDel(id){return new Promise((res,rej)=>{if(!_db)return rej('DB未就绪');const t=_db.transaction('profiles','readwrite'),s=t.objectStore('profiles');const r=s.delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
function saveCurrentProfile(name){
  const d=getCtx();
  const input=d&&(d._input||d.input);
  if(!d||!input)return Promise.reject('无当前命盘数据');
  // 仅持久化"原始输入"，避免存入巨大对象
  const rec={bd:input.bd_raw||input.bd,timeStr:input.timeStr,bp:input.bp,gen:input.gen,q:input.q,useTrueSolar:!!input.useTrueSolar,resultStyle:input.resultStyle||'companion',name,createdAt:Date.now(),updatedAt:Date.now()};
  return dbPut(rec);
}
async function renderProfiles(){try{const list=await dbGetAll();const zone=document.getElementById('profileZone');const grid=document.getElementById('profileGrid');const empty=document.getElementById('profileEmpty');const recentZone=document.getElementById('recentZone');const recentGrid=document.getElementById('recentGrid');const recentEmpty=document.getElementById('recentEmpty');const profileZoneEmpty=document.getElementById('profileZoneEmpty');
  if(!list.length){if(grid)grid.innerHTML='';if(empty)empty.style.display='none';if(zone)zone.style.display='none';if(recentZone)recentZone.style.display='none';if(recentEmpty)recentEmpty.style.display='block';if(profileZoneEmpty)profileZoneEmpty.style.display='block';return;}
  if(empty)empty.style.display='none';if(zone)zone.style.display='block';if(recentEmpty)recentEmpty.style.display='none';if(profileZoneEmpty)profileZoneEmpty.style.display='none';
  if(recentZone){recentZone.style.display='block';recentGrid.innerHTML=list.slice(0,3).map(p=>{const _bd=(p.bd||'1990-1-1').split('-').map(Number);/* 用保存的出生时间推时辰（无则按子时），避免档案星级一律按子时失真 */const _hm=String(p.timeStr||'').split(':');const _hh=Number(_hm[0]);const _hz=(Number.isFinite(_hh))?Math.floor(((_hh+1)%24)/2):0;const _b=mkBazi(_bd[0],_bd[1],_bd[2],_hz,Number.isFinite(_hh)?_hh:12);const dg=_b.D.g;const dy=mkDy(_b,p.gen||'male',_bd[0],_bd[1]||1,_bd[2]||1);const age=TJ.calcAge(_bd[0],_bd[1]||1,_bd[2]||1);const cDy=TJ.findDaYun(dy,age)||dy.ds[0];const cLn=mkLn(CURR_YEAR);let stars='★★★☆☆';try{const wx=mkWx(_b),ss=mkSs(_b);const sc=calcYearScores(_b,wx,ss,SS[dg][cDy.g],SS[dg][cLn.g],null,cDy,cLn);const avgv=(sc.career+sc.wealth+sc.love+sc.health)/4;const n=Math.max(1,Math.min(5,Math.round(avgv/20)));stars='★'.repeat(n)+'☆'.repeat(5-n);}catch(e){}return`<div class="r-card" onclick="loadProfile(${Number(p.id)})"><div class="r-ava">${profileEscape(String(p.name||'未').charAt(0))}</div><div class="r-info"><div class="r-name">${profileEscape(p.name||'未命名')}</div><div class="r-meta">当前大运：${cDy.g}${cDy.z} · ${CURR_YEAR}运势：${stars}<br>最近关注：${profileEscape(p.q||'综合')}</div></div><div class="r-arrow">›</div></div>`;}).join('');}
  if(grid)grid.innerHTML=list.slice(0,8).map(p=>{const city=CD[p.bp]||{n:'未知'};return`<div class="r-card" onclick="loadProfile(${Number(p.id)})"><div class="r-ava">${profileEscape(String(p.name||'未').charAt(0))}</div><div class="r-info"><div class="r-name">${profileEscape(p.name||'未命名')}</div><div class="r-meta">${profileEscape(p.bd||'')} · ${city.n} · ${p.gen==='male'?'男':'女'}${p.useTrueSolar?'·真':''}</div></div><div style="position:absolute;top:6px;right:8px;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.9em;color:var(--c-text-4);cursor:pointer;transition:all .15s;z-index:2" onclick="event.stopPropagation();deleteProfile(${Number(p.id)})">×</div></div>`;}).join('');
}catch(e){console.warn('[profile] render',e);}}
async function loadProfile(id){try{const list=await dbGetAll();const p=list.find(x=>x.id===id);if(!p)return;document.getElementById('bDate').value=p.bd||'';document.getElementById('bTime').value=p.timeStr||'09:00';document.getElementById('bPlace').value=p.bp||'';document.getElementById('cInp').value=(CD[p.bp]||{n:''}).n;document.getElementById('bGen').value=p.gen||'male';const styleEl=document.getElementById('bResultStyle');if(styleEl){styleEl.value=p.resultStyle||'companion';document.querySelectorAll('.result-style-option').forEach(btn=>{const on=btn.dataset.style===styleEl.value;btn.classList.toggle('active',on);btn.setAttribute('aria-checked',on?'true':'false');});const loadedStyle=getResultStyle(styleEl.value);const loadedHint=document.getElementById('resultStyleHint');if(loadedHint)loadedHint.textContent=loadedStyle.intro;}document.getElementById('bQ').value=p.q||'';const sw=document.getElementById('swTrueSolar');if(sw){if(p.useTrueSolar)sw.classList.add('on');else sw.classList.remove('on');sw.setAttribute('aria-checked',String(sw.classList.contains('on')));document.getElementById('swText').textContent=(sw.classList.contains('on')?'开启':'关闭')+'真太阳时（按时区、经度和均时差估算）';}const chips=document.getElementById('qChips');if(chips){chips.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active',c.dataset.q===p.q));}_profileOnLoad();}catch(e){console.warn('[profile] load',e);}}
async function deleteProfile(id){try{await dbDel(id);renderProfiles();}catch(e){console.warn('[profile] delete',e);}}
function openSaveModal(){
  const m=document.getElementById('saveModal');
  if(!m)return;
  m.classList.add('open');
  // 隐藏 dock 栏，避免底部按钮被遮挡
  const dock=document.querySelector('.ig-dock.tab-bar');
  if(dock)dock.style.display='none';
  const n=document.getElementById('saveName');
  n.value='';
  updateSaveNameCount();
  setTimeout(()=>n.focus(),100);
  // 填充命盘预览
  const d=getCtx();
  const input=d&&(d._input||d.input);
  const bdEl=document.getElementById('spBd');
  const bpEl=document.getElementById('spBp');
  const genEl=document.getElementById('spGen');
  const genIconEl=document.getElementById('spGenIcon');
  const baziEl=document.getElementById('spBazi');
  if(input){
    if(bdEl)bdEl.textContent=input.bd||'—';
    if(bpEl)bpEl.textContent=(CD[input.bp]||{n:'未知'}).n;
    if(genEl)genEl.textContent=input.gen==='male'?'男（乾造）':'女（坤造）';
    if(genIconEl)genIconEl.textContent=input.gen==='male'?'♂':'♀';
    // 填充四柱
    if(baziEl&&d&&d.b){
      const b=d.b;
      const pillars=[
        {label:'年',gz:b.Y.g+b.Y.z},
        {label:'月',gz:b.M.g+b.M.z},
        {label:'日',gz:b.D.g+b.D.z},
        {label:'时',gz:b.H.g+b.H.z}
      ];
      baziEl.innerHTML=pillars.map(p=>
        `<span class="bz-pillar"><small>${p.label}</small><b>${p.gz}</b></span>`
      ).join('');
    }
  }
}
function closeSaveModal(){
  document.getElementById('saveModal').classList.remove('open');
  // 恢复 dock 栏显示
  const dock=document.querySelector('.ig-dock.tab-bar');
  if(dock)dock.style.display='';
}
/* ---- 档案库弹窗 ---- */
function openArchiveModal(){
  const m=document.getElementById('archiveModal');
  if(!m)return;
  m.classList.add('open');
  const dock=document.querySelector('.ig-dock.tab-bar');
  if(dock)dock.style.display='none';
  renderArchiveList();
}
function closeArchiveModal(){
  const m=document.getElementById('archiveModal');
  if(!m)return;
  m.classList.remove('open');
  const dock=document.querySelector('.ig-dock.tab-bar');
  if(dock)dock.style.display='';
}
async function renderArchiveList(){
  const list=document.getElementById('archiveList');
  if(!list)return;
  try{
    const profiles=await dbGetAll();
    if(!profiles.length){
      list.innerHTML='<div class="save-archives-empty">还没有保存的命盘<br>点击「保存命盘」即可添加</div>';
      return;
    }
    list.innerHTML=profiles.map(p=>{
      const city=CD[p.bp]||{n:'未知'};
      const d=new Date(p.updatedAt);
      const dateStr=`${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      return `<div class="save-archive-card" onclick="loadProfileFromArchive(${Number(p.id)})">
        <div class="sa-ava">${profileEscape(String(p.name||'未').charAt(0))}</div>
        <div class="sa-info">
          <div class="sa-name">${profileEscape(p.name||'未命名')}</div>
          <div class="sa-meta">${profileEscape(p.bd||'')} · ${city.n} · ${p.gen==='male'?'男':'女'} · ${dateStr}</div>
        </div>
        <div class="sa-actions">
          <button type="button" class="sa-del" onclick="event.stopPropagation();deleteProfileFromArchive(${Number(p.id)})" title="删除">×</button>
        </div>
      </div>`;
    }).join('');
  }catch(e){console.warn('[archive] render',e);}
}
function loadProfileFromArchive(id){
  loadProfile(id);
  closeArchiveModal();
}
async function deleteProfileFromArchive(id){
  try{
    await dbDel(id);
    renderArchiveList();
    renderProfiles();
    showToast('已删除');
  }catch(e){console.warn('[archive] delete',e);}
}
function updateSaveNameCount(){
  const n=document.getElementById('saveName');
  const c=document.getElementById('saveNameCount');
  if(!n||!c)return;
  c.textContent=n.value.length;
  c.parentElement?.classList.toggle('has-text',n.value.length>0);
}
function quickSaveName(name){
  const n=document.getElementById('saveName');
  if(!n)return;
  n.value=name;
  updateSaveNameCount();
  n.focus();
  n.setSelectionRange(name.length,name.length);
}
function confirmSaveProfile(){const name=document.getElementById('saveName').value.trim();if(!name){showToast('请输入档案名称');return;}saveCurrentProfile(name).then(()=>{closeSaveModal();renderProfiles();showToast('已保存到档案库');}).catch(e=>showToast('保存失败：'+e));}
async function exportProfiles(){try{const list=await dbGetAll();const blob=new Blob([JSON.stringify(list,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='问问大师档案_'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href);}catch(e){showToast('导出失败');}}
async function handleImport(input){const file=input.files[0];if(!file)return;try{const text=await file.text();const arr=JSON.parse(text);if(!Array.isArray(arr))throw new Error('格式错误');let count=0;for(const p of arr){if(p && typeof p === 'object' && typeof p.bd === 'string' && /^\d{1,4}-\d{1,2}-\d{1,2}$/.test(p.bd) && typeof p.bp === 'string' && Object.prototype.hasOwnProperty.call(CD,p.bp) && (p.gen === 'male' || p.gen === 'female')){const rec={bd:p.bd,bp:p.bp,gen:p.gen,timeStr:typeof p.timeStr==='string'?p.timeStr.slice(0,16):'',q:typeof p.q==='string'?p.q.slice(0,500):'',name:typeof p.name==='string'?p.name.slice(0,100):'',useTrueSolar:p.useTrueSolar===true,resultStyle:typeof p.resultStyle==='string'?p.resultStyle.slice(0,40):'companion',createdAt:Date.now(),updatedAt:Date.now()};await dbPut(rec);count++;}}renderProfiles();renderArchiveList();showToast(`成功导入 ${count} 条档案`);}catch(e){showToast('导入失败：'+e.message);}input.value='';}
export {
  initDB, dbGetAll,
  profileEscape, saveCurrentProfile, renderProfiles, loadProfile, deleteProfile,
  openSaveModal, closeSaveModal, openArchiveModal, closeArchiveModal,
  renderArchiveList, loadProfileFromArchive, deleteProfileFromArchive,
  updateSaveNameCount, quickSaveName, confirmSaveProfile, exportProfiles, handleImport,
};
