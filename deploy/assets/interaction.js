/* Shared interaction helpers. No user data is transmitted. */
const uxPagePositions = new Map();
function rememberPagePosition(){
  const p=document.querySelector('.page.active'),c=document.querySelector('.content');
  if(p)uxPagePositions.set(p.id,{window:window.scrollY,content:c?c.scrollTop:0});
}
function restorePagePosition(p){
  const position=uxPagePositions.get('page-'+p)||{window:0,content:0};
  requestAnimationFrame(()=>{window.scrollTo(0,position.window);const c=document.querySelector('.content');if(c)c.scrollTop=position.content;});
}
function render(){
  const focused=document.activeElement;
  const group=focused&&focused.closest('.addrow,.dt-edit-form');
  const drafts=group?Array.from(group.querySelectorAll('input[id],select[id],textarea[id]')).map(e=>({id:e.id,value:e.value})):[];
  const focusId=focused&&focused.id;
  const selection=focused&&typeof focused.selectionStart==='number'?[focused.selectionStart,focused.selectionEnd]:null;
  renderCore();
  setupClarity();
  setupHierarchy();
  drafts.forEach(d=>{const e=document.getElementById(d.id);if(e)e.value=d.value;});
  if(focusId&&drafts.length){const e=document.getElementById(focusId);if(e){e.focus({preventScroll:true});if(selection&&e.setSelectionRange)e.setSelectionRange(...selection);}}
  updateRecordNotice();
  if(S.stTab==='calendar')renderCalendar();
}
function updateRecordNotice(){
  let bar=document.getElementById('uxRecordNotice');
  if(!bar){bar=document.createElement('div');bar.id='uxRecordNotice';bar.className='ux-record-notice';document.querySelector('.content').prepend(bar);}
  const active=REC_DATE&&REC_DATE!==todayStr();
  bar.hidden=!active;
  if(active)bar.innerHTML='<strong>正在补录 '+escHtml(REC_DATE)+'</strong><span>练习与习惯记录将保存到这个日期；日历安排使用任务自己的日期。</span><button class="btn ghost" onclick="setRecDate(\'\')">返回今天</button>';
}
function startInlineRename(anchor,value,onSave){
  if(!anchor||anchor.closest('.ux-inline-editor'))return;
  const original=anchor;
  const wrap=document.createElement('span');wrap.className='ux-inline-editor';
  const input=document.createElement('input');input.type='text';input.value=value;input.setAttribute('aria-label','修改名称');
  const saveButton=document.createElement('button');saveButton.className='btn sm';saveButton.textContent='保存';
  const cancel=document.createElement('button');cancel.className='btn sm ghost';cancel.textContent='取消';
  wrap.append(input,saveButton,cancel);original.replaceWith(wrap);
  const restore=()=>{if(wrap.isConnected)wrap.replaceWith(original);};
  const commit=()=>{const next=input.value.trim();if(!next){input.focus();return;}restore();if(next!==value)onSave(next);};
  saveButton.onclick=commit;cancel.onclick=restore;
  wrap.onclick=e=>e.stopPropagation();
  input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();commit();}if(e.key==='Escape'){e.preventDefault();restore();}};
  input.focus();input.select();
}
function undoLastLifePractice(key){
  const lc=ensureLifeCompound(),date=recordDateStr();
  let index=-1;
  for(let i=lc.logs.length-1;i>=0;i--){const log=lc.logs[i];if(log.key===key&&log.d===date&&log.src==='quick'){index=i;break;}}
  if(index<0){alert('这一天没有可撤销的手动练习记录。任务关联记录请到原任务中撤销。');return;}
  const log=lc.logs[index];lc.logs.splice(index,1);grant(log.a||LIFE_TRACKS[key].a,log.min,true);
  addHist('↩ 撤销最近一次'+LIFE_TRACKS[key].n+' '+log.min+' 分钟',-log.min,date);save();render();
}
function confirmClearLifeToday(key){
  const rows=ensureLifeCompound().logs.filter(x=>x.key===key&&x.d===recordDateStr()&&x.src==='quick');
  if(!rows.length){alert('没有可清除的手动记录。');return;}
  if(!confirm('清除 '+recordDateStr()+'「'+LIFE_TRACKS[key].n+'」的 '+rows.length+' 条手动记录，共 '+rows.reduce((n,x)=>n+x.min,0)+' 分钟？任务关联记录保留。'))return;
  const lc=ensureLifeCompound();lc.logs=lc.logs.filter(x=>!rows.includes(x));
  rows.forEach(x=>grant(x.a||LIFE_TRACKS[key].a,x.min,true));
  addHist('清除'+LIFE_TRACKS[key].n+'当天手动记录',-rows.reduce((n,x)=>n+x.min,0),recordDateStr());save();render();
}
function usageExport(){
  const blob=new Blob([JSON.stringify(readUsage(),null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='rpg-usage-'+todayStr()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
