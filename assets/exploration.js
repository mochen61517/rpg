/* Exploration is stored separately from long-term practice and legacy monthly plans. */
const EXPLORATION_THEMES=['积极心理学','法律','摇滚民谣','古典乐','乐器','健身解剖','经济学','金融','佛学','道教','基督教','人物传记','哲学','英语','粤语','日语'];
const EXPLORATION_OPTIONS=[['book','读一本相关书籍'],['video1','看一段相关科普视频'],['video2','再看一段相关科普视频'],['film','看一部职业相关电影']];
let explorationPeriod='';
function explorationStore(){S.exploration||={cycles:[]};return S.exploration;}
function explorationBounds(date){
  const y=Number(date.slice(0,4)),m=Number(date.slice(5,7)),first=m%2?m:m-1;
  const start=y+'-'+String(first).padStart(2,'0')+'-01',end=new Date(y,first+1,0);
  return {id:start.slice(0,7),start,end:y+'-'+String(first+1).padStart(2,'0')+'-'+String(end.getDate()).padStart(2,'0')};
}
function ensureExplorationCycle(date=todayStr()){
  const store=explorationStore(),bounds=explorationBounds(date);let c=store.cycles.find(c=>c.id===bounds.id);
  if(!c){const used=new Set(store.cycles.map(c=>c.theme));let choices=EXPLORATION_THEMES.filter(t=>!used.has(t));if(!choices.length)choices=EXPLORATION_THEMES;
    c={...bounds,theme:choices[Math.floor(Math.random()*choices.length)],targetMinutes:3600,tasks:[],logs:[]};store.cycles.push(c);save();}
  return c;
}
function explorationCycle(id){return explorationStore().cycles.find(c=>c.id===id);}
function explorationMinutes(c){return c.logs.reduce((sum,l)=>sum+l.minutes,0);}
function explorationTotals(){const totals=new Map(EXPLORATION_THEMES.map(t=>[t,0]));explorationStore().cycles.forEach(c=>totals.set(c.theme,(totals.get(c.theme)||0)+explorationMinutes(c)));return [...totals].sort((a,b)=>b[1]-a[1]);}
function addExplorationTask(cycleId,title,template=''){
  const c=explorationCycle(cycleId);title=String(title||'').trim();if(!c||!title)return false;
  if(template&&c.tasks.some(t=>t.template===template))return false;
  c.tasks.push({id:id(),title,template,done:false});save();return true;
}
function explorationLog(cycleId,taskId,date,minutes,finished,logId=''){
  const c=explorationCycle(cycleId),task=c?.tasks.find(t=>t.id===taskId);minutes=Number(minutes);
  if(!task||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(new Date(date+'T00:00:00Z').getTime())||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date||date<c.start||date>c.end||date>todayStr()||!Number.isInteger(minutes)||minutes<1||minutes>1440)throw Error('请填写本期内且不晚于今天的日期，以及 1–1440 分钟的实际投入。');
  const previous=logId?c.logs.find(l=>l.id===logId):null;if(logId&&!previous)throw Error('这条记录已不存在，请刷新后重试。');
  if(previous)S.attrs.MIND=Math.max(0,(S.attrs.MIND||0)-previous.awardedXP);
  const before=S.attrs.MIND||0;grant('MIND',minutes*RATE,false);const awardedXP=(S.attrs.MIND||0)-before;
  const record={id:previous?.id||id(),taskId,date,minutes,awardedXP,finished:!!finished};
  if(previous)c.logs[c.logs.indexOf(previous)]=record;else c.logs.push(record);
  task.done=c.logs.some(l=>l.taskId===taskId&&l.finished);
  touchActivity(date);addHist('探索 · '+c.theme+' · '+task.title+' '+minutes+' 分钟'+(previous?'（修改）':''),awardedXP-(previous?.awardedXP||0),date);save();return record;
}
function deleteExplorationLog(cycleId,logId){
  const c=explorationCycle(cycleId),log=c?.logs.find(l=>l.id===logId);if(!log)return;
  S.attrs.MIND=Math.max(0,(S.attrs.MIND||0)-log.awardedXP);c.logs=c.logs.filter(l=>l.id!==logId);
  const task=c.tasks.find(t=>t.id===log.taskId);if(task)task.done=c.logs.some(l=>l.taskId===task.id&&l.finished);
  addHist('撤销探索投入 · '+c.theme+' '+log.minutes+' 分钟',-log.awardedXP,log.date);save();
}
function explorationDialog(title){
  let d=document.getElementById('explorationEditor');if(!d){d=document.createElement('dialog');d.id='explorationEditor';d.className='plan-editor';document.body.append(d);}
  d.innerHTML='<form><h2>'+title+'</h2><div class="exploration-fields"></div><p class="exploration-error" role="alert"></p><div class="plan-editor-actions"><button type="button" class="btn ghost">取消</button><button class="btn primary" type="submit">保存</button></div></form>';
  d.querySelector('button[type=button]').onclick=()=>d.close();return d;
}
function openExplorationTask(cycleId){
  const c=explorationCycle(cycleId);if(!c)return;const d=explorationDialog('添加探索任务');
  d.querySelector('.exploration-fields').innerHTML='<label>任务名称<input name="title" required maxlength="200" placeholder="书名、视频名，或你想做的探索"></label>';
  d.querySelector('form').onsubmit=e=>{e.preventDefault();if(addExplorationTask(cycleId,e.target.elements.title.value)){d.close();render();}};d.showModal();
}
function openExplorationLog(cycleId,taskId,logId=''){
  const c=explorationCycle(cycleId),t=c?.tasks.find(t=>t.id===taskId),log=c?.logs.find(l=>l.id===logId);if(!t)return;
  const d=explorationDialog(log?'修改投入记录':'记录投入'),latest=todayStr()<c.end?todayStr():c.end;
  d.querySelector('.exploration-fields').innerHTML='<p>'+escHtml(t.title)+'</p><label>日期<input type="date" name="date" required min="'+c.start+'" max="'+latest+'" value="'+(log?.date||latest)+'"></label><label>本次实际投入（分钟）<input type="number" name="minutes" min="1" max="1440" step="1" required value="'+(log?.minutes||'')+'" placeholder="例如 45"></label><label class="editor-check"><input name="finished" type="checkbox" '+(log?.finished?'checked':'')+'>这次已完成整项任务</label><small>可以分多次记录；完成标记不会额外增加时长。</small>';
  d.querySelector('form').onsubmit=e=>{e.preventDefault();try{const f=e.target.elements;explorationLog(cycleId,taskId,f.date.value,f.minutes.value,f.finished.checked,logId);d.close();checkAch();render();}catch(err){d.querySelector('.exploration-error').textContent=err.message;}};d.showModal();
}
function renderMonthPlanEdit(){
  const el=document.getElementById('monthPlanEdit');if(!el)return;const current=ensureExplorationCycle(),c=explorationCycle(explorationPeriod)||current;
  const minutes=explorationMinutes(c),pct=Math.min(100,minutes/36),taskMinutes=t=>c.logs.filter(l=>l.taskId===t.id).reduce((s,l)=>s+l.minutes,0);
  const options=explorationStore().cycles.slice().sort((a,b)=>b.id.localeCompare(a.id)).map(x=>'<option value="'+x.id+'"'+(x.id===c.id?' selected':'')+'>'+x.start.slice(0,7)+' — '+x.end.slice(0,7)+' · '+escHtml(x.theme)+'</option>').join('');
  const available=EXPLORATION_OPTIONS.filter(([k])=>!c.tasks.some(t=>t.template===k));
  el.innerHTML='<section class="exploration-cycle"><header><div><small>双月探索 · '+c.start+' — '+c.end+'</small><h2>'+escHtml(c.theme)+'</h2></div><select aria-label="探索周期" onchange="explorationPeriod=this.value;renderMonthPlanEdit()">'+options+'</select></header><div class="exploration-target"><strong>'+(minutes/60).toFixed(2)+' <small>/ 60 小时</small></strong><span>'+(minutes>=3600?'本期已达标':'还差 '+((3600-minutes)/60).toFixed(2)+' 小时')+'</span></div><div class="plan-progress"><i style="width:'+pct+'%"></i></div><div class="exploration-task-heading">本期任务 <button class="text-action" data-explore-add>＋ 自定义任务</button></div>'+c.tasks.slice().sort((a,b)=>Number(a.done)-Number(b.done)).map(t=>'<div class="exploration-task'+(t.done?' is-done':'')+'"><span>'+(t.done?'✓ ':'')+escHtml(t.title)+'</span><small>'+ (taskMinutes(t)/60).toFixed(2)+'h</small><button class="text-action" data-explore-record="'+escHtml(t.id)+'">记录投入</button><button class="text-action" data-explore-rename="'+escHtml(t.id)+'">编辑</button></div>').join('')+(!c.tasks.length?'<p class="hint">从下面选择任务，或添加自己的探索。</p>':'')+(available.length?'<details class="exploration-options" open><summary>可选任务</summary><div>'+available.map(([k,title])=>'<button class="btn sm ghost" data-explore-option="'+k+'">＋ '+title+'</button>').join('')+'</div></details>':'')+'<details class="exploration-history"><summary>投入记录 · '+c.logs.length+' 条</summary>'+c.logs.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(l=>'<div class="exploration-log"><span>'+l.date+' · '+escHtml(c.tasks.find(t=>t.id===l.taskId)?.title||'探索')+'</span><small>'+l.minutes+' 分钟</small><button class="text-action" data-explore-log="'+l.id+'">修改</button><button class="text-action" data-explore-delete="'+l.id+'">删除</button></div>').join('')+'</details><p class="exploration-note">按实际投入累计，1 分钟 = 1 原始灵台经验；已在其他任务记过的时长请勿重复记录。</p></section>';
  el.querySelector('[data-explore-add]').onclick=()=>openExplorationTask(c.id);
  el.querySelectorAll('[data-explore-option]').forEach(b=>b.onclick=()=>{const opt=EXPLORATION_OPTIONS.find(([k])=>k===b.dataset.exploreOption);addExplorationTask(c.id,opt[1],opt[0]);renderMonthPlanEdit();});
  el.querySelectorAll('[data-explore-record]').forEach(b=>b.onclick=()=>openExplorationLog(c.id,b.dataset.exploreRecord));
  el.querySelectorAll('[data-explore-rename]').forEach(b=>b.onclick=()=>{const t=c.tasks.find(t=>t.id===b.dataset.exploreRename);const d=explorationDialog('编辑任务');d.querySelector('.exploration-fields').innerHTML='<label>任务名称<input name="title" required maxlength="200" value="'+escHtml(t.title)+'"></label>';d.querySelector('form').onsubmit=e=>{e.preventDefault();const title=e.target.elements.title.value.trim();if(title){t.title=title;save();d.close();render();}};d.showModal();});
  el.querySelectorAll('[data-explore-log]').forEach(b=>b.onclick=()=>{const l=c.logs.find(l=>l.id===b.dataset.exploreLog);openExplorationLog(c.id,l.taskId,l.id);});
  el.querySelectorAll('[data-explore-delete]').forEach(b=>b.onclick=()=>{if(confirm('删除这次投入，并撤回对应的时长和经验？')){deleteExplorationLog(c.id,b.dataset.exploreDelete);render();}});
  const old=Object.entries(S.monthPlansByYear||{}).flatMap(([,months])=>Object.entries(months)).filter(([,v])=>v.plan||v.actual||v.reason||(v.tasks||[]).length).sort((a,b)=>b[0].localeCompare(a[0]));
  if(old.length)el.insertAdjacentHTML('beforeend','<details class="exploration-history"><summary>原月度计划</summary>'+old.map(([key,g])=>'<details><summary>'+key+' · '+escHtml(g.plan||'月度记录')+'</summary>'+planGoalHtml(g,'month',key,key)+'<p>'+escHtml(g.actual||'')+'</p><p>'+escHtml(g.reason||'')+'</p></details>').join('')+'</details>');
}
function renderExplorationOverview(){
  const host=document.getElementById('longPracticeBox');if(!host)return;
  const rows=explorationTotals().filter(([,n])=>n>0);let section=document.getElementById('explorationOverview');if(!section){section=document.createElement('section');section.id='explorationOverview';host.append(section);}
  section.innerHTML='<h2>探索 · 主题累计</h2><p class="hint">各期投入按主题累加，与长期练习分别统计。</p>'+(rows.length?rows.map(([title,n])=>'<div class="exploration-total"><span>'+escHtml(title)+'</span><strong>'+(n/60).toFixed(2)+'h</strong></div>').join(''):'<p class="hint">主题月记录投入后，会在这里按分类累计。</p>');
}
