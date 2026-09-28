/* Monthly and annual plans share a task editor; existing records stay intact. */
let goalMonth='';
const GOAL_PRIORITIES=[['high','高'],['normal','中'],['low','低']];
function planGoal(kind,key){
  if(kind==='year')return S.year[Number(key)];
  if(kind!=='month'||!/^\d{4}-\d{2}$/.test(String(key)))return null;
  S.monthPlansByYear||={};S.monthPlansByYear[key.slice(0,4)]||={};
  return S.monthPlansByYear[key.slice(0,4)][key]||=( {plan:'',actual:'',status:'',reason:''} );
}
function planTasks(g,kind){return (kind==='year'?g.items:g.tasks)||[];}
function planTaskDone(t){return typeof t.planDone==='boolean'?t.planDone:!!(t.done||isDoneEver(t));}
function planGoalDone(g,kind){return kind==='month'?g.status==='done':!!g.done;}
function planProgress(g,kind){
  if(planGoalDone(g,kind))return 100;
  if(g.progressMode==='manual')return Math.min(100,Math.max(0,Number(g.progress)||0));
  const tasks=planTasks(g,kind);return tasks.length?Math.round(tasks.filter(planTaskDone).length/tasks.length*100):0;
}
function planTaskOrder(tasks){
  const rank={high:0,normal:1,low:2};
  return tasks.map((t,i)=>({t,i})).sort((a,b)=>Number(planTaskDone(a.t))-Number(planTaskDone(b.t))||(rank[a.t.priority]??1)-(rank[b.t.priority]??1)||(a.t.due||'9999-12-31').localeCompare(b.t.due||'9999-12-31')||a.i-b.i);
}
function planRefresh(){const drafts=Array.from(document.querySelectorAll('.plan-add input')).map(e=>({id:e.id,value:e.value}));save();renderLongterm();drafts.forEach(d=>{const e=document.getElementById(d.id);if(e)e.value=d.value;});}
function setPlanField(kind,key,field,value){
  const g=planGoal(kind,key);if(!g)return;
  if(field==='title'){
    value=String(value).trim();if(!value){renderLongterm();return;}
    if(kind==='year'&&g.t!==value){g.titleHistory||=[];g.titleHistory.push({date:todayStr(),from:g.t,to:value});}
    g[kind==='year'?'t':'plan']=value;
  }else if(field==='priority'){if(!GOAL_PRIORITIES.some(([k])=>k===value))return;g.priority=value;}
  else if(field==='progress'){const n=Number(value);if(!Number.isFinite(n)||value==='')return;g.progress=Math.max(0,Math.min(100,n));g.progressMode='manual';}
  else if(field==='auto')g.progressMode='tasks';
  else if(field==='done'){
    if(kind==='month'){if(value){g.previousStatus=g.status;g.status='done';}else g.status=g.previousStatus&&g.previousStatus!=='done'?g.previousStatus:'';}
    else g.done=!!value;
  }else return;
  planRefresh();
}
function addPlanTask(kind,key){
  const g=planGoal(kind,key);if(!g||planGoalDone(g,kind))return;
  const tasks=planTasks(g,kind);if(tasks.length>=5)return;
  const el=document.getElementById('plan-add-'+kind+'-'+key),title=(el?.value||'').trim();if(!title)return;
  if(kind==='year')g.items=tasks;else g.tasks=tasks;
  tasks.push({id:id(),t:title,priority:'normal',due:'',planDone:false});el.value='';planRefresh();
}
function setPlanTask(kind,key,index,field,value){
  const g=planGoal(kind,key),t=g&&planTasks(g,kind)[index];if(!t)return;
  if(field==='done')t.planDone=!!value;
  else if(field==='title'){if(!String(value).trim()){renderLongterm();return;}t.t=String(value).trim();}
  else if(field==='priority'){if(!GOAL_PRIORITIES.some(([k])=>k===value))return;t.priority=value;}
  else if(field==='due'){if(value&&!/^\d{4}-\d{2}-\d{2}$/.test(value))return;t.due=value;}
  else return;
  planRefresh();
}
function removePlanTask(kind,key,index){
  const g=planGoal(kind,key);if(!g)return;
  if(!confirm('删除这条拆分任务？已有历史记录仍会保留。'))return;
  g.removedPlanTasks||=[];g.removedPlanTasks.push({...planTasks(g,kind)[index],removedOn:todayStr()});
  planTasks(g,kind).splice(index,1);planRefresh();
}
function planPriority(value,handler,label){return '<select aria-label="'+label+'" onchange="'+handler+'">'+GOAL_PRIORITIES.map(([key,text])=>'<option value="'+key+'"'+((value||'normal')===key?' selected':'')+'>'+text+'优先级</option>').join('')+'</select>';}
function planGoalHtml(g,kind,key,label){
  const args="'"+kind+"','"+key+"'",tasks=planTasks(g,kind),complete=planGoalDone(g,kind),pct=planProgress(g,kind);
  const rows=planTaskOrder(tasks),open=rows.filter(({t})=>!planTaskDone(t)),done=rows.filter(({t})=>planTaskDone(t));
  const row=({t,i})=>{
    const done=planTaskDone(t),late=!done&&t.due&&t.due<todayStr(),a=args+','+i;
    return '<div class="plan-task'+(done?' is-done':'')+'"><input type="checkbox" aria-label="完成任务：'+escHtml(t.t)+'" '+(done?'checked':'')+' onchange="setPlanTask('+a+',\'done\',this.checked)"><div class="plan-task-main"><textarea rows="1" class="plan-task-title" aria-label="任务名称" onchange="setPlanTask('+a+',\'title\',this.value)">'+escHtml(t.t)+'</textarea><div class="plan-task-meta">'+planPriority(t.priority,'setPlanTask('+a+',\'priority\',this.value)','任务优先级')+'<label class="'+(late?'is-late':'')+'">'+(late?'已逾期':'截止')+' <input type="date" aria-label="任务截止日期" value="'+escHtml(t.due||'')+'" onchange="setPlanTask('+a+',\'due\',this.value)"></label></div></div><button class="text-action" aria-label="删除任务" onclick="removePlanTask('+a+')">×</button></div>';
  };
  return '<article class="plan-goal'+(complete?' is-complete':'')+'"><div class="plan-kicker">'+label+'</div><div class="plan-title-row"><textarea rows="1" class="plan-title" aria-label="总目标" placeholder="写下一个明确的总目标" onchange="setPlanField('+args+',\'title\',this.value)">'+escHtml(g[kind==='year'?'t':'plan']||'')+'</textarea><label class="plan-complete"><input type="checkbox" '+(complete?'checked':'')+' onchange="setPlanField('+args+',\'done\',this.checked)">已完成</label></div><div class="plan-goal-meta">'+planPriority(g.priority,'setPlanField('+args+',\'priority\',this.value)','目标优先级')+'<label>当前进度 <input class="plan-percent" aria-label="当前进度百分比" type="number" min="0" max="100" value="'+pct+'" '+(complete?'disabled':'')+' onchange="setPlanField('+args+',\'progress\',this.value)">%</label>'+(g.progressMode==='manual'?'<button class="text-action" onclick="setPlanField('+args+',\'auto\',true)">按任务计算</button>':'<small>按任务完成数计算 · 可直接改百分比</small>')+'</div><div class="plan-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><i style="width:'+pct+'%"></i></div><div class="plan-task-heading">拆分任务 <small>'+tasks.filter(planTaskDone).length+' / '+tasks.length+' 已完成</small></div>'+open.map(row).join('')+(!tasks.length?'<p class="hint">从一个具体的小任务开始，最多拆分 5 个。</p>':'')+(!complete&&tasks.length<5?'<div class="plan-add"><input id="plan-add-'+kind+'-'+key+'" aria-label="新拆分任务" placeholder="添加任务（'+tasks.length+'/5）" onkeydown="if(event.key===\'Enter\'){event.preventDefault();addPlanTask('+args+')}"><button class="btn sm" onclick="addPlanTask('+args+')">＋ 添加</button></div>':!complete?'<p class="plan-limit">'+(tasks.length>5?'已有任务全部保留；':'')+'已达 5 个任务上限</p>':'')+(done.length?'<div class="plan-done-heading">已完成 · '+done.length+'</div>'+done.map(row).join(''):'')+'</article>';
}
function yearAnalysisCard(c,i){
  const legacy=(c.nextAction?'<p>原下一步：'+escHtml(c.nextAction)+'</p>':'')+(c.titleHistory||[]).map(x=>'<p>'+escHtml(x.date+' · '+x.from+' → '+x.to)+'</p>').join('');
  return '<section class="plan-year-entry">'+planGoalHtml(c,'year',String(i),'年度总目标')+clarityFold('year-'+i,'进展记录'+((c.records||[]).length?' · '+c.records.length+' 条':''),yearRecordBlock(c,i))+clarityFold('year-more-'+i,'历史与管理',legacy+'<button class="text-action" onclick="delYearQuest('+i+')">删除目标</button>')+'</section>';
}
function renderMonthPlanEdit(){
  const el=document.getElementById('monthPlanEdit');if(!el)return;
  const key=goalMonth||thisMonth(),g=planGoal('month',key);
  const legacy='<label>实际推进<textarea id="mActual_'+key+'">'+escHtml(g.actual||'')+'</textarea></label><label>复盘与调整<textarea id="mReason_'+key+'">'+escHtml(g.reason||'')+'</textarea></label><button class="btn sm" onclick="saveMonthPlanKey(\''+key+'\')">保存回顾</button>';
  el.innerHTML='<div class="plan-month-picker"><label>月份 <input type="month" value="'+key+'" onchange="if(this.value){goalMonth=this.value;renderMonthPlanEdit()}"></label></div>'+planGoalHtml(g,'month',key,key.replace('-',' 年 ')+' 月总目标')+clarityFold('review-'+key,'月末回顾'+(g.actual?' · 已有记录':''),'<div class="month-review-fields">'+legacy+'</div>');
}
