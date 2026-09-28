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
function planPriorityLabel(value){return (GOAL_PRIORITIES.find(([k])=>k===value)||GOAL_PRIORITIES[1])[1]+'优先级';}
function planGoalHtml(g,kind,key,label){
  const args="'"+kind+"','"+key+"'",tasks=planTasks(g,kind),complete=planGoalDone(g,kind),pct=planProgress(g,kind);
  const rows=planTaskOrder(tasks),open=rows.filter(({t})=>!planTaskDone(t)),done=rows.filter(({t})=>planTaskDone(t));
  const row=({t,i})=>{
    const checked=planTaskDone(t),late=!checked&&t.due&&t.due<todayStr(),a=args+','+i;
    return '<div class="compact-plan-task'+(checked?' is-done':'')+'"><input type="checkbox" aria-label="完成任务：'+escHtml(t.t)+'" '+(checked?'checked':'')+' onchange="setPlanTask('+a+',\'done\',this.checked)"><button class="compact-task-title" onclick="openPlanEditor('+a+')">'+escHtml(t.t)+'</button><span class="plan-priority priority-'+(t.priority==='high'?'high':t.priority==='low'?'low':'normal')+'">'+planPriorityLabel(t.priority)+'</span><time class="compact-task-due'+(late?' is-late':'')+'">'+(t.due?escHtml(t.due)+(late?' · 逾期':''):'无截止日期')+'</time><button class="text-action" aria-label="编辑任务：'+escHtml(t.t)+'" onclick="openPlanEditor('+a+')">编辑</button></div>';
  };
  return '<article class="compact-plan'+(complete?' is-complete':'')+'"><header class="compact-plan-header"><button class="compact-goal-title" aria-label="编辑总目标" onclick="openPlanEditor('+args+')">'+escHtml(g[kind==='year'?'t':'plan']||'点击设置'+label)+'</button><span class="plan-priority priority-'+(g.priority==='high'?'high':g.priority==='low'?'low':'normal')+'">'+planPriorityLabel(g.priority)+'</span><button class="compact-progress" aria-label="编辑目标进度 '+pct+'%" onclick="openPlanEditor('+args+')"><span class="compact-progress-track"><i style="width:'+pct+'%"></i></span><span>'+pct+'%</span></button><button class="text-action" onclick="openPlanEditor('+args+')">编辑</button></header>'+open.map(row).join('')+(!complete&&tasks.length<5?'<button class="compact-add text-action" onclick="openPlanEditor('+args+',-1)">＋ 拆分任务 <small>'+tasks.length+'/5</small></button>':'')+(done.length?'<div class="compact-done-label">已完成 · '+done.length+'</div>'+done.map(row).join(''):'')+'</article>';
}
function openPlanEditor(kind,key,index){
  const g=planGoal(kind,key);if(!g)return;
  const taskEdit=Number.isInteger(index),adding=index===-1;
  if(adding&&(planTasks(g,kind).length>=5||planGoalDone(g,kind)))return;
  const t=taskEdit?(adding?{t:'',priority:'normal',due:''}:planTasks(g,kind)[index]):g;if(!t)return;
  let modal=document.getElementById('planEditor');if(!modal){modal=document.createElement('dialog');modal.id='planEditor';modal.className='plan-editor';document.body.append(modal);}
  const priorityOptions=GOAL_PRIORITIES.map(([k,n])=>'<option value="'+k+'"'+((t.priority||'normal')===k?' selected':'')+'>'+n+'优先级</option>').join('');
  modal.innerHTML='<form><h2>'+(taskEdit?(adding?'添加拆分任务':'编辑任务'):'编辑总目标')+'</h2><label>名称<textarea name="title" required maxlength="500" rows="3">'+escHtml(taskEdit?t.t:(g[kind==='year'?'t':'plan']||''))+'</textarea></label><label>优先级<select name="priority">'+priorityOptions+'</select></label>'+(taskEdit?'<label>截止日期<input type="date" name="due" value="'+escHtml(t.due||'')+'"></label>':'<label>进度方式<select name="mode"><option value="tasks"'+(g.progressMode!=='manual'?' selected':'')+'>按任务完成数计算</option><option value="manual"'+(g.progressMode==='manual'?' selected':'')+'>手动填写</option></select></label><label class="manual-progress">当前进度（%）<input type="number" name="progress" min="0" max="100" value="'+planProgress(g,kind)+'"></label><label class="editor-check"><input type="checkbox" name="done" '+(planGoalDone(g,kind)?'checked':'')+'>目标已完成</label>')+'<div class="plan-editor-actions">'+(!adding?'<button type="button" class="text-action editor-delete">删除'+(taskEdit?'任务':'目标')+'</button>':'')+'<button type="button" class="btn ghost editor-cancel">取消</button><button class="btn primary" type="submit">保存</button></div></form>';
  const form=modal.querySelector('form');
  if(!taskEdit){const sync=()=>{form.querySelector('.manual-progress').hidden=form.elements.mode.value!=='manual';};form.elements.mode.onchange=sync;sync();}
  form.querySelector('.editor-cancel').onclick=()=>modal.close();
  const del=form.querySelector('.editor-delete');if(del){if(!taskEdit&&kind==='month')del.remove();else del.onclick=()=>{if(taskEdit){removePlanTask(kind,key,index);modal.close();}else{delYearQuest(Number(key));modal.close();}};}
  form.onsubmit=e=>{
    e.preventDefault();const title=form.elements.title.value.trim();if(!title){form.elements.title.focus();return;}
    const priority=form.elements.priority.value;
    if(taskEdit){
      const tasks=planTasks(g,kind);if(adding&&tasks.length>=5)return;
      const target=adding?{id:id(),planDone:false}:tasks[index];if(!target)return;
      target.t=title;target.priority=priority;target.due=form.elements.due.value;
      if(adding){if(kind==='year')g.items=tasks;else g.tasks=tasks;tasks.push(target);}
    }else{
      if(kind==='year'&&g.t!==title){g.titleHistory||=[];g.titleHistory.push({date:todayStr(),from:g.t,to:title});}
      g[kind==='year'?'t':'plan']=title;g.priority=priority;g.progressMode=form.elements.mode.value;
      if(g.progressMode==='manual')g.progress=Math.max(0,Math.min(100,Number(form.elements.progress.value)||0));
      const checked=form.elements.done.checked;
      if(kind==='year')g.done=checked;
      else if(checked&&g.status!=='done'){g.previousStatus=g.status;g.status='done';}
      else if(!checked&&g.status==='done')g.status=g.previousStatus&&g.previousStatus!=='done'?g.previousStatus:'';
    }
    modal.close();planRefresh();
  };
  modal.showModal();
}
function yearAnalysisCard(c,i){return '<section class="compact-year-entry">'+planGoalHtml(c,'year',String(i),'年度总目标')+'</section>';}
function renderMonthPlanEdit(){
  const el=document.getElementById('monthPlanEdit');if(!el)return;
  const key=goalMonth||thisMonth(),g=planGoal('month',key);
  el.innerHTML='<div class="plan-month-picker"><label>月份 <input type="month" value="'+key+'" onchange="if(this.value){goalMonth=this.value;renderMonthPlanEdit()}"></label></div>'+planGoalHtml(g,'month',key,key.replace('-',' 年 ')+' 月总目标');
}
