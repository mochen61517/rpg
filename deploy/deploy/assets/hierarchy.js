/* Clear action hierarchy; existing task and archive data remain the source of truth. */
let taskTypeFilter='',habitManagement=false,memoryQuery='',memoryMonth='',memoryAll=false,calendarPendingGoal=null;
function renderSaveSafety(){
  const el=document.getElementById('saveSafetyBox');if(!el)return;const points=restorePoints(),last=points[0];
  el.innerHTML='<strong>'+(typeof SAVE_OK!=='undefined'&&SAVE_OK===false?'本次保存失败，请立即导出备份':'当前浏览器存档')+'</strong><div class="hint">'+(last?'最近本机恢复点：'+escHtml(new Date(last.ts).toLocaleString('zh-CN')):'尚无本机恢复点')+' · 已保留 '+points.length+' / 3 份</div>';
}
function taskDateGroup(t,date=todayStr()){
  const due=t.due||t.schedule?.date||'';
  return !due?'无日期':due<date?(t.due?'已逾期':'今天'):due===date?'今天':'之后';
}
function taskListHtml(rows,row){
  rows=rows.filter(t=>!taskTypeFilter||(t.a||'MIND')===taskTypeFilter);
  if(!rows.length)return '<p class="hint">这个分类下没有未完成任务。</p>';
  if(S.taskOrder==='created')return rows.map(t=>row(t,false)).join('');
  const groups=new Map();
  if(S.taskOrder!=='type')['已逾期','今天','之后','无日期'].forEach(k=>groups.set(k,[]));
  rows.forEach(t=>{const k=S.taskOrder==='type'?(ATTRS[t.a||'MIND']||ATTRS.MIND).name:taskDateGroup(t);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(t);});
  return Array.from(groups).filter(([,v])=>v.length).map(([k,v])=>'<section class="task-date-group"><h3 class="task-group-label'+(k==='已逾期'?' late':'')+'">'+escHtml(k)+' <span>'+v.length+'</span></h3>'+v.map(t=>row(t,false)).join('')+'</section>').join('');
}
function clarityTaskTools(){
  const mode=S.taskOrder||'due';
  return '<div class="clarity-task-tools"><label>类型 <select aria-label="筛选任务类型" onchange="taskTypeFilter=this.value;renderDayTasks()"><option value="">全部类型</option>'+Object.entries(ATTRS).map(([k,a])=>'<option value="'+k+'"'+(taskTypeFilter===k?' selected':'')+'>'+escHtml(a.name)+'</option>').join('')+'</select></label><label>排列 <select aria-label="任务排序" onchange="setTaskOrder(this.value)">'+[['due','按日期分组'],['type','按类型分组'],['created','添加顺序']].map(([k,t])=>'<option value="'+k+'"'+(mode===k?' selected':'')+'>'+t+'</option>').join('')+'</select></label></div>';
}
function editYearGoal(i,anchor){
  const c=S.year[i];if(!c)return;
  startInlineRename(anchor,c.t,value=>{c.titleHistory=c.titleHistory||[];c.titleHistory.push({date:todayStr(),from:c.t,to:value});c.t=value;c.editCount=(c.editCount||0)+1;save();renderLongterm();});
}
function yearNextText(c){return c.nextAction||((c.items||[]).find(x=>!isDoneEver(x))||{}).t||'';}
function yearStepsHtml(c,i){
  return (c.items||[]).map((x,j)=>'<div class="year-step"><span>'+escHtml(x.t)+'</span>'+(x.mode==='time'?'<input aria-label="本次实际分钟" id="min_year_'+i+'_'+j+'" type="number" min="1" placeholder="分钟">':'')+'<button class="text-action" onclick="toggleChecklistItem(\'year\','+i+','+j+')">'+(isDone(x,recordDateStr())?'撤销今天记录':'完成')+'</button></div>').join('');
}
function editYearNext(i,anchor){const c=S.year[i];if(!c)return;startInlineRename(anchor,yearNextText(c),v=>{c.nextAction=v;save();renderLongterm();});}
function yearNextTask(i){
  const c=S.year[i],title=yearNextText(c);if(!title)return;
  const task=(S.dayTasks||[]).find(t=>t.id===c.nextTaskId&&!t.done);
  openCalendarEditor(task?task.id:null);calendarPendingGoal=c;
  if(!task){document.getElementById('calTitle').value=title;document.getElementById('calAttr').value=yearGoalAnalysis(c,i).track?.a||'MIND';}
}
function yearAnalysisCard(c,i){
  const a=yearGoalAnalysis(c,i),next=yearNextText(c);
  const progress=c.done?'已完成':a.total?(a.doneEv+' / '+a.total+' 个步骤完成'):'以实际结果确认完成';
  const pct=c.done?100:a.total?Math.round(a.doneEv/a.total*100):0;
  const records=(c.records||[]).length;
  const histories=(c.titleHistory||[]).slice().reverse().map(x=>'<p>'+escHtml(x.date+' · '+x.from+' → '+x.to)+'</p>').join('');
  return '<article class="goal-row'+(c.done?' goal-done':'')+'"><div class="goal-heading"><div><div class="goal-eyebrow">'+(c.paused?'已暂停':c.done?'已完成':'年度目标')+(a.track?' · '+escHtml(a.track.n):'')+'</div><h3>'+escHtml(c.t)+'</h3></div><button class="text-action" onclick="editYearGoal('+i+',this)">编辑目标</button></div>'+
    '<div class="goal-next"><span>下一步</span><div><strong>'+escHtml(next||'写下一个具体、可以开始的行动')+'</strong><div class="goal-next-actions"><button class="text-action" onclick="editYearNext('+i+',this)">'+(next?'编辑下一步':'设置下一步')+'</button>'+(next&&!c.done&&!c.paused?'<button class="btn sm primary" onclick="yearNextTask('+i+')">安排时间</button>':'')+'</div></div></div>'+
    '<div class="goal-progress"><span>'+progress+'</span>'+(a.total||c.done?'<div class="goal-meter"><i style="width:'+pct+'%"></i></div>':'')+'</div>'+
    clarityFold('year-'+i,'进展记录'+(records?' · '+records+' 条':''),yearRecordBlock(c,i))+
    clarityFold('year-more-'+i,'目标详情与管理',yearStepsHtml(c,i)+'<p class="hint">关联轨道的投入量不等于目标完成度。以下为辅助参考，不代表结果预测。</p><p class="hint">参考进度 '+a.progressPct+'% '+escHtml(a.progressNote||'')+'</p><ul class="hint">'+a.advice.map(t=>'<li>'+escHtml(t)+'</li>').join('')+'</ul>'+histories+'<div class="goal-next-actions">'+(!a.total?'<button class="btn ghost" onclick="toggleYearDone('+i+')">'+(c.done?'恢复进行中':'标记目标完成')+'</button>':'')+'<button class="btn ghost" onclick="delYearQuest('+i+')">删除目标</button></div>')+'</article>';
}
function renderMonthPlanEdit(){
  const el=document.getElementById('monthPlanEdit');if(!el)return;
  const current=thisMonth(),year=current.slice(0,4),month=Number(current.slice(5));
  const plans=S.monthPlansByYear?.[year]||{};
  const labels={'':'未回顾',done:'已达成',part:'部分达成',miss:'未达成'};
  const one=m=>{
    const key=year+'-'+String(m).padStart(2,'0'),r=plans[key]||{},cur=m===month,future=m>month,editing=mpOpen.has(key)||(cur&&!r.plan);
    const field=(suffix)=>cur?suffix:suffix+'_'+key;
    const status='<select id="'+field('mStatus')+'"'+(future?' disabled':'')+'>'+Object.entries(labels).map(([v,t])=>'<option value="'+v+'"'+((r.status||'')===v?' selected':'')+'>'+t+'</option>').join('')+'</select>';
    const editReview='<div class="month-review-fields"><label>实际推进<textarea id="'+field('mActual')+'"'+(future?' disabled':'')+'>'+escHtml(r.actual||'')+'</textarea></label><label>复盘与调整<textarea id="'+field('mReason')+'"'+(future?' disabled':'')+'>'+escHtml(r.reason||'')+'</textarea></label><label>达成情况'+status+'</label></div>';
    const review=editing?editReview:'<div class="month-review-text"><h4>实际推进</h4><p>'+escHtml(r.actual||'尚未记录')+'</p><h4>复盘与调整</h4><p>'+escHtml(r.reason||'尚未记录')+'</p><small>'+labels[r.status||'']+'</small></div>';
    const body='<article class="month-focus"><div class="month-heading"><span>'+m+' 月'+(cur?' · 当前主线':'')+'</span>'+(!editing?'<button class="text-action" onclick="toggleMpOpen(\''+key+'\')">编辑</button>':'')+'</div><div class="goal-eyebrow">这个月，优先推进</div>'+
      (editing?'<label class="sr-label">本月计划<textarea class="month-plan-input" id="'+field('mPlan')+'" placeholder="写下本月最想推进的一件事">'+escHtml(r.plan||'')+'</textarea></label>':'<p class="month-plan-text">'+escHtml(r.plan||'尚未安排')+'</p>')+
      (!future?clarityFold('review-'+key,'月末回顾'+(r.actual?' · 已有记录':''),review):editReview.replace('month-review-fields','month-review-fields future-review'))+
      (editing?'<div class="month-save"><button class="btn primary" onclick="'+(cur?'saveMonthPlan()':"saveMonthPlanKey('"+key+"')")+'">保存计划</button></div>':'')+'</article>';
    return cur?body:clarityFold('month-'+key,m+' 月 · '+escHtml((r.plan||'尚未安排').slice(0,48)),body);
  };
  let future='',past='';for(let m=month+1;m<=12;m++)future+=one(m);for(let m=month-1;m>=1;m--)past+=one(m);
  el.innerHTML=one(month)+(future?clarityFold('months-future','之后的月份',future):'')+(past?clarityFold('months-past','过去的月份',past):'');
}
function toggleHabitManagement(){habitManagement=!habitManagement;applyHabitManagement();}
function applyHabitManagement(){
  const panel=document.getElementById('dailyList')?.closest('.panel');if(!panel)return;
  panel.classList.toggle('habit-managing',habitManagement);panel.classList.add('habit-panel');
  let b=document.getElementById('habitManage');if(!b){b=document.createElement('button');b.id='habitManage';b.className='text-action';b.onclick=toggleHabitManagement;panel.querySelector('h2').append(b);}
  b.textContent=habitManagement?'完成管理':'管理习惯与补剂';b.setAttribute('aria-expanded',String(habitManagement));
  panel.querySelectorAll('.addrow').forEach(n=>n.hidden=!habitManagement);
  panel.querySelectorAll('.supp-ic').forEach(button=>{
    let edit=button.querySelector('.habit-edit');
    if(!edit){edit=document.createElement('span');edit.className='habit-edit';edit.textContent='编辑';edit.setAttribute('role','button');edit.tabIndex=0;
      const change=e=>{e.stopPropagation();const arr=button.closest('#dailyList')?S.daily:S.supps;const item=arr[Array.from(button.parentElement.children).indexOf(button)];if(!item)return;startInlineRename(edit,item.t,v=>{item.t=v;save();render();});};
      edit.onclick=change;edit.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();change(e);}};button.append(edit);
    }
    edit.hidden=!habitManagement;
  });
}
function memoryMatches(rows,q,month){return rows.filter(m=>(!month||String(m.d).startsWith(month))&&(!q||(m.text||'').toLowerCase().includes(q.toLowerCase()))).slice().sort((a,b)=>String(b.d).localeCompare(String(a.d)));}
function refreshMemoryBrowser(){
  const box=document.getElementById('memoryResults');if(!box)return;
  const rows=memoryMatches(realMemories(),memoryQuery,memoryMonth),shown=memoryAll?rows:rows.slice(0,12);
  box.innerHTML='<p class="hint">'+rows.length+' 条记录'+(shown.length<rows.length?' · 先显示最近 '+shown.length+' 条':'')+'</p>'+shown.map(m=>'<button class="memory-result" data-memory-id="'+escHtml(m.id)+'"><time>'+escHtml(m.d)+'</time><span>'+escHtml(m.text||'一张照片')+'</span>'+(m.img?'<small>含照片</small>':'')+'</button>').join('')+(rows.length>shown.length?'<button class="text-action" onclick="memoryAll=true;refreshMemoryBrowser()">显示全部匹配记录</button>':'');
  box.querySelectorAll('[data-memory-id]').forEach(b=>b.onclick=()=>openLifeFragmentModal(b.dataset.memoryId));
}
function setupMemoryBrowser(){
  const source=document.querySelector('#lifeBlendBox .lc-memory-list');if(!source)return;
  let tools=document.getElementById('memoryBrowser');
  if(!tools){tools=document.createElement('div');tools.id='memoryBrowser';tools.innerHTML='<h3 class="memory-heading">最近记录</h3><div class="memory-tools"><label>搜索<input type="search" id="memorySearch" placeholder="关键词"></label><label>月份<select id="memoryMonth"><option value="">全部月份</option></select></label></div><div id="memoryResults"></div>';source.before(tools);
    const search=tools.querySelector('input');search.value=memoryQuery;search.oninput=()=>{memoryQuery=search.value;memoryAll=false;refreshMemoryBrowser();};
    tools.querySelector('select').onchange=e=>{memoryMonth=e.target.value;memoryAll=false;refreshMemoryBrowser();};
  }
  source.hidden=true;const months=[...new Set(realMemories().map(m=>String(m.d).slice(0,7)))].sort().reverse();
  const select=document.getElementById('memoryMonth');select.innerHTML='<option value="">全部月份</option>'+months.map(m=>'<option value="'+escHtml(m)+'">'+escHtml(m)+'</option>').join('');select.value=memoryMonth;refreshMemoryBrowser();
}
function openActiveTasks(){switchShortTaskTab('jianghu',false,'my');}
function renderActiveCommissions(){
  const host=document.getElementById('jh-my-pane');if(!host)return;
  let box=document.getElementById('activeCommissions');if(!box){box=document.createElement('div');box.id='activeCommissions';host.prepend(box);}
  const quests=(S.npc?.active||[]).filter(q=>!q.done);
  box.innerHTML='<div class="panel"><h2>进行中的委托</h2>'+quests.map(q=>{const npc=NPCS.find(n=>n.id===q.npc);return '<div class="active-commission"><div><strong>'+escHtml(q.t)+'</strong><small>'+escHtml(npc?.n||'故人')+' · 每周委托</small></div><button class="text-action" data-commission="'+escHtml(q.id)+'">查看委托</button></div>';}).join('')+(!quests.length?'<p class="hint">本周委托已完成，或尚未刷新。</p>':'')+'</div>';
  box.querySelectorAll('[data-commission]').forEach(b=>b.onclick=()=>{switchJianghuTab('npc');document.getElementById('qi_'+b.dataset.commission)?.scrollIntoView({block:'center',behavior:'smooth'});});
}
function setupHierarchy(){
  applyHabitManagement();setupMemoryBrowser();renderActiveCommissions();
  const my=document.querySelector('[data-jh="my"]');if(my){my.childNodes[0].textContent='进行中 ';document.getElementById('jhTabs').prepend(my);}
  const header=document.querySelector('#myJianghuBox')?.closest('.panel')?.querySelector('h2');if(header)header.textContent='已接榜任务 · 按截止时间';
  const weekTab=document.querySelector('[data-st="week"]');if(weekTab)weekTab.hidden=true;
  const tabs=document.getElementById('stTabs');
  if(tabs&&!document.getElementById('reviewAccess')){const b=document.createElement('button');b.id='reviewAccess';b.className='text-action review-access';b.textContent='历史与回顾';b.onclick=()=>switchShortTaskTab('week');tabs.after(b);}
  const week=document.getElementById('st-week-pane');
  if(week&&!week.dataset.simplified){week.dataset.simplified='1';
    const note=week.querySelector(':scope > .panel');if(note?.textContent.includes('每日有用感'))note.hidden=true;
    const current=week.querySelector('#weeklyReviewBox')?.closest('.panel');if(current){const title=document.createElement('h2');title.textContent='本周回顾';current.prepend(title);}
    const reports=week.querySelector('#reportWeek')?.closest('.panel');if(reports)clarityWrap(reports,'周报 / 月报 · 生成与导出','reports');
    const histories=week.querySelector('#weeklyHistoryBox')?.closest('.panel');if(histories)clarityWrap(histories,'以前的回顾','past-reviews');
  }
  const backup=document.getElementById('settings-backup');
  if(backup&&!backup.dataset.simplified){backup.dataset.simplified='1';
    const transfer=backup.querySelector('.settings-item');
    const safety=document.getElementById('saveSafetyBox')?.closest('.settings-item');
    if(transfer&&safety)backup.insertBefore(safety,transfer);
    const fileBanner=document.getElementById('fsBanner');if(fileBanner)clarityWrap(fileBanner,'本地文件存档 · 使用说明','file-help');
    if(transfer){const row=transfer.querySelector('.row'),exportButton=row?.querySelector('button[onclick*="export"]');
      if(row&&exportButton){const secondary=document.createElement('div');secondary.className='backup-secondary';Array.from(row.children).filter(n=>n!==exportButton).forEach(n=>secondary.append(n));row.after(secondary);clarityWrap(secondary,'导入或连接本地文件','backup-import');}
      const hint=transfer.querySelector('.hint');if(hint)clarityWrap(hint,'备份操作说明','backup-help');
    }
  }
}
