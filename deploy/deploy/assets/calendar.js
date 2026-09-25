/* Calendar tasks share S.dayTasks; due dates remain independent of scheduling. */
let calendarDate = '';
let calendarView = typeof matchMedia==='function'&&matchMedia('(max-width:760px)').matches?'day':'month';
let calendarEditingId = null;
const calPad = n => String(n).padStart(2, '0');
function calDate(d){ return d.getFullYear()+'-'+calPad(d.getMonth()+1)+'-'+calPad(d.getDate()); }
function calParse(s){ const p=s.split('-').map(Number); return new Date(p[0],p[1]-1,p[2],12); }
function calAdd(s,n){ const d=calParse(s);d.setDate(d.getDate()+n);return calDate(d); }
function calValidDate(s){ return /^\d{4}-\d{2}-\d{2}$/.test(s||'') && calDate(calParse(s))===s; }
function calValidate(v){
  if(!v.t.trim())return '请填写任务名称';
  if(!calValidDate(v.date)||!calValidDate(v.endDate))return '请选择有效日期';
  if(v.endDate<v.date)return '结束日期不能早于开始日期';
  if(v.due&&!calValidDate(v.due))return '请选择有效的最晚完成日期';
  if(!v.allDay){
    const time=/^([01]\d|2[0-3]):[0-5]\d$/;
    if(!time.test(v.start)||!time.test(v.end))return '请填写有效的起止时间';
    if(v.endDate+'T'+v.end<=v.date+'T'+v.start)return '结束时间必须晚于开始时间';
  }
  if(!Number.isFinite(v.xp)||v.xp<1)return '经验值必须为正数';
  return '';
}
function calTasksOn(date){
  return (S.dayTasks||[]).filter(t=>t.schedule && t.schedule.date<=date && (t.schedule.endDate||t.schedule.date)>=date)
    .sort((a,b)=>Number(a.done)-Number(b.done)||Number(b.schedule.allDay)-Number(a.schedule.allDay)||(a.schedule.start||'').localeCompare(b.schedule.start||''));
}
function calScheduleLabel(s){
  if(!s)return '';
  if(s.allDay)return s.date+((s.endDate||s.date)!==s.date?' — '+s.endDate:'')+' 全天';
  return s.date+(s.allDay?' 全天':' '+s.start)+' — '+((s.endDate||s.date)!==s.date?(s.endDate||s.date)+' ':'')+(s.allDay?'全天':s.end);
}
function calConflict(v,ignore){
  if(v.allDay)return [];
  const start=v.date+'T'+v.start,end=v.endDate+'T'+v.end;
  return (S.dayTasks||[]).filter(t=>t.id!==ignore&&!t.done&&t.schedule&&!t.schedule.allDay&&
    t.schedule.date+'T'+t.schedule.start<end&&(t.schedule.endDate||t.schedule.date)+'T'+t.schedule.end>start);
}
function calSetView(view){calendarView=view;renderCalendar();trackUsage('action','日历视图:'+view);}
function calMove(n){
  const d=calParse(calendarDate||todayStr());
  if(calendarView==='month'){d.setDate(1);d.setMonth(d.getMonth()+n);calendarDate=calDate(d);}
  else calendarDate=calAdd(calDate(d),n*(calendarView==='week'?7:1));
  renderCalendar();
}
function calToday(){calendarDate=todayStr();renderCalendar();}
function calPick(date){if(calValidDate(date)){calendarDate=date;renderCalendar();}}
function calEventButton(t,date){
  const s=t.schedule;
  const time=s.allDay?'全天':s.date<date?'跨日':s.start;
  return '<button class="cal-event '+(t.done?'is-done':'')+'" data-cal-edit="'+escHtml(t.id)+'" title="'+escHtml(t.t+' · '+calScheduleLabel(s))+'">'+
    '<span>'+escHtml(time)+'</span><b>'+escHtml(t.t)+'</b>'+(t.done?'<span>✓</span>':'')+'</button>';
}
function renderCalendar(){
  const root=document.getElementById('calendarRoot');if(!root)return;
  calendarDate=calendarDate||todayStr();
  const viewKey=calendarView+':'+calendarDate;
  const previousScroll=root.dataset.viewKey===viewKey&&root.querySelector('.cal-scroll')?root.querySelector('.cal-scroll').scrollTop:null;
  root.dataset.viewKey=viewKey;
  const d=calParse(calendarDate),today=todayStr();
  let h='<div class="cal-toolbar"><div class="cal-nav"><button class="btn ghost" onclick="calMove(-1)" aria-label="上一段日期">‹</button><h2>'+d.getFullYear()+'年 '+(d.getMonth()+1)+'月</h2><button class="btn ghost" onclick="calMove(1)" aria-label="下一段日期">›</button><button class="btn ghost" onclick="calToday()">今天</button></div>'+
    '<div class="cal-views" role="group" aria-label="日历视图">'+['month','week','day'].map((v,i)=>'<button class="btn '+(calendarView===v?'primary':'ghost')+'" aria-pressed="'+(calendarView===v)+'" onclick="calSetView(\''+v+'\')">'+['月','周','日'][i]+'</button>').join('')+'</div>'+
    '<button class="btn primary" onclick="openCalendarEditor()">＋ 安排任务</button></div>';
  h+='<div class="cal-datebar"><label>查看日期 <input type="date" value="'+calendarDate+'" onchange="calPick(this.value)"></label><span>点击日期旁的 ＋ 或空白时段即可安排</span></div>';
  if(calendarView==='month'){
    const first=new Date(d.getFullYear(),d.getMonth(),1,12);
    const start=calAdd(calDate(first),-((first.getDay()+6)%7));
    h+='<div class="cal-scroll"><div class="cal-month"><div class="cal-weekdays">'+['一','二','三','四','五','六','日'].map(x=>'<span>周'+x+'</span>').join('')+'</div><div class="cal-days">';
    for(let i=0;i<42;i++){
      const date=calAdd(start,i),tasks=calTasksOn(date);
      h+='<div class="cal-cell '+(date.slice(0,7)!==calendarDate.slice(0,7)?'outside ':'')+(date===today?'today ':'')+(date===calendarDate?'selected':'')+'">'+
        '<div class="cal-cell-head"><button class="cal-date" data-cal-pick="'+date+'" aria-label="查看 '+date+'">'+Number(date.slice(-2))+'</button><button class="cal-add" data-cal-new="'+date+'" aria-label="'+date+' 添加任务">＋</button></div>'+
        tasks.slice(0,3).map(t=>calEventButton(t,date)).join('')+(tasks.length>3?'<button class="cal-more" data-cal-pick="'+date+'">还有 '+(tasks.length-3)+' 项</button>':'')+'</div>';
    }
    h+='</div></div></div>';
  }else{
    const start=calendarView==='day'?calendarDate:calAdd(calendarDate,-((d.getDay()+6)%7));
    const days=Array.from({length:calendarView==='day'?1:7},(_,i)=>calAdd(start,i));
    h+='<div class="cal-scroll"><div class="cal-time-grid" style="--cal-cols:'+days.length+'"><div class="cal-time-head"><span>时间</span>'+days.map(date=>'<button class="cal-date '+(date===today?'today':'')+'" data-cal-pick="'+date+'">'+date.slice(5)+' 周'+['日','一','二','三','四','五','六'][calParse(date).getDay()]+'</button>').join('')+'</div>';
    h+='<div class="cal-time-row"><span class="cal-hour">全天</span>'+days.map(date=>'<div class="cal-slot">'+calTasksOn(date).filter(t=>t.schedule.allDay).map(t=>calEventButton(t,date)).join('')+'<button class="cal-slot-add" data-cal-new="'+date+'">＋ 全天任务</button></div>').join('')+'</div>';
    for(let hour=0;hour<24;hour++){
      h+='<div class="cal-time-row"><span class="cal-hour">'+calPad(hour)+':00</span>'+days.map(date=>{
        const tasks=calTasksOn(date).filter(t=>!t.schedule.allDay&&(t.schedule.date<date?hour===0:Number(t.schedule.start.slice(0,2))===hour));
        return '<div class="cal-slot">'+tasks.map(t=>calEventButton(t,date)).join('')+'<button class="cal-slot-add" data-cal-new="'+date+'" data-cal-time="'+calPad(hour)+':00" aria-label="'+date+' '+calPad(hour)+':00 添加任务">＋</button></div>';
      }).join('')+'</div>';
    }
    h+='</div></div><p class="hint">时段按任务开始时间排列，跨日任务在后续日期的 00:00 显示；点任务查看完整起止时间。</p>';
  }
  const selected=calTasksOn(calendarDate);
  h+='<section class="cal-agenda"><h3>'+calendarDate+' · '+selected.length+' 项安排</h3>'+ (selected.map(t=>'<div class="cal-agenda-row"><button class="btn ghost" data-cal-toggle="'+escHtml(t.id)+'" aria-label="'+(t.done?'恢复':'完成')+' '+escHtml(t.t)+'">'+(t.done?'✓':'○')+'</button><div><b class="'+(t.done?'cal-done-text':'')+'">'+escHtml(t.t)+'</b><small>'+escHtml(calScheduleLabel(t.schedule))+'</small></div><button class="btn ghost" data-cal-edit="'+escHtml(t.id)+'">编辑</button></div>').join('')||'<p class="hint">这一天还没有安排。可以留白，也可以添加一件想做的事。</p>')+'</section>';
  const loose=(S.dayTasks||[]).filter(t=>!t.done&&!t.schedule);
  if(loose.length)h+='<details class="cal-loose"><summary>未安排时间的任务（'+loose.length+'）</summary>'+loose.map(t=>'<div class="cal-agenda-row"><span>'+escHtml(t.t)+'</span><button class="btn ghost" data-cal-edit="'+escHtml(t.id)+'">安排时间</button></div>').join('')+'</details>';
  root.innerHTML=h;
  const scroller=root.querySelector('.cal-scroll');
  if(scroller)scroller.scrollTop=previousScroll!==null?previousScroll:(calendarView==='month'?0:390);
  if(!root.dataset.bound){root.dataset.bound='1';root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.calNew)openCalendarEditor(null,b.dataset.calNew,b.dataset.calTime||'');
    else if(b.dataset.calEdit)openCalendarEditor(b.dataset.calEdit);
    else if(b.dataset.calPick){calendarDate=b.dataset.calPick;renderCalendar();}
    else if(b.dataset.calToggle){toggleDayTask(b.dataset.calToggle);renderCalendar();}
  });}
}
function openCalendarEditor(uid,date,time){
  if(typeof calendarPendingGoal!=='undefined')calendarPendingGoal=null;
  if(typeof _editingDayTask!=='undefined'&&_editingDayTask===uid){saveDayTaskEdit(uid);}
  const task=(S.dayTasks||[]).find(t=>t.id===uid);
  calendarEditingId=task?task.id:null;
  const s=task&&task.schedule||{};
  const day=s.date||date||calendarDate||todayStr();
  const start=s.start||time||'09:00';
  const startMin=Number(start.slice(0,2))*60+Number(start.slice(3));
  const endMin=(startMin+60)%1440;
  const end=s.end||calPad(Math.floor(endMin/60))+':'+calPad(endMin%60);
  const endDate=s.endDate||((time||s.start)&&startMin+60>=1440?calAdd(day,1):day);
  let dialog=document.getElementById('calendarEditor');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='calendarEditor';dialog.className='ux-dialog';dialog.setAttribute('aria-labelledby','calEditorTitle');document.body.appendChild(dialog);}
  dialog.innerHTML='<form id="calForm"><div class="ux-dialog-head"><h2 id="calEditorTitle">'+(task?'编辑任务安排':'安排任务')+'</h2><button type="button" class="btn ghost" onclick="closeCalendarEditor()" aria-label="关闭">×</button></div>'+
    '<label>任务名称<input id="calTitle" required maxlength="200" value="'+escHtml(task?task.t:'')+'" placeholder="例如：练琴、项目讨论"></label>'+
    '<label class="cal-check"><input id="calAllDay" type="checkbox" '+(s.allDay||(!task&&!time)?'checked':'')+' onchange="calToggleTimes()">全天</label>'+
    '<div class="cal-form-grid"><label>计划开始日期<input type="date" id="calStartDate" required value="'+day+'"></label><label>计划结束日期<input type="date" id="calEndDate" required value="'+endDate+'"></label><label class="cal-time-field">开始时间<input type="time" id="calStartTime" value="'+start+'"></label><label class="cal-time-field">结束时间<input type="time" id="calEndTime" value="'+end+'"></label>'+
    '<label>最晚完成日期（可选）<input type="date" id="calDue" value="'+escHtml(task?.due||'')+'"></label><label>属性<select id="calAttr" '+(task&&task.done?'disabled':'')+'>'+optAttrs(task?task.a:'MIND')+'</select></label><label>完成经验<input type="number" id="calXp" min="1" max="10000" value="'+(task?task.xp||10:10)+'" '+(task&&task.done?'disabled':'')+'></label></div>'+
    '<p class="hint">计划时间表示准备什么时候做；最晚完成日期是截止日，可不同于计划时间。已完成任务的属性与经验锁定，恢复未完成后可修改。</p><p id="calError" class="ux-error" role="alert"></p><p id="calOverlap" class="hint" role="status"></p>'+
    '<div class="ux-dialog-actions">'+(s.date?'<button type="button" class="btn ghost" onclick="calUnSchedule()">移除时间安排</button>':'')+'<button type="button" class="btn ghost" onclick="closeCalendarEditor()">取消</button><button type="submit" class="btn primary">保存安排</button></div></form>';
  document.getElementById('calForm').addEventListener('submit',e=>{e.preventDefault();calSave();});
  document.getElementById('calForm').addEventListener('input',calShowConflict);
  document.getElementById('calStartDate').addEventListener('change',()=>{
    const a=document.getElementById('calStartDate'),b=document.getElementById('calEndDate');if(b.value<a.value)b.value=a.value;
    calShowConflict();
  });
  calToggleTimes();calShowConflict();dialog.showModal();document.getElementById('calTitle').focus();
}
function closeCalendarEditor(){if(typeof calendarPendingGoal!=='undefined')calendarPendingGoal=null;document.getElementById('calendarEditor').close();}
function calToggleTimes(){const all=document.getElementById('calAllDay').checked;document.querySelectorAll('#calendarEditor .cal-time-field').forEach(e=>{e.hidden=all;e.querySelector('input').disabled=all;});}
function calFormValue(){return {due:document.getElementById('calDue')?.value,t:document.getElementById('calTitle').value.trim(),date:document.getElementById('calStartDate').value,endDate:document.getElementById('calEndDate').value,allDay:document.getElementById('calAllDay').checked,start:document.getElementById('calStartTime').value,end:document.getElementById('calEndTime').value,a:document.getElementById('calAttr').value,xp:Number(document.getElementById('calXp').value)};}
function calShowConflict(){const v=calFormValue(),hits=calValidate(v)?[]:calConflict(v,calendarEditingId);document.getElementById('calOverlap').textContent=hits.length?'时间与 '+hits.length+' 项未完成任务重叠，仍可保存。':'';}
function calSave(){
  const v=calFormValue(),err=calValidate(v);if(err){document.getElementById('calError').textContent=err;return;}
  S.dayTasks=S.dayTasks||[];let task=S.dayTasks.find(t=>t.id===calendarEditingId);
  if(!task){task={id:id(),d:todayStr(),done:false,from:'calendar',due:''};S.dayTasks.push(task);}
  task.t=v.t;if(v.due!==undefined)task.due=v.due;if(!task.done){task.a=ATTRS[v.a]?v.a:'MIND';task.xp=Math.round(v.xp);}
  task.schedule={date:v.date,endDate:v.endDate,allDay:v.allDay,start:v.allDay?'':v.start,end:v.allDay?'':v.end};
  if(typeof calendarPendingGoal!=='undefined'&&calendarPendingGoal){calendarPendingGoal.nextTaskId=task.id;calendarPendingGoal=null;}
  calendarDate=v.date;save();trackUsage('action',calendarEditingId?'日历编辑':'日历新增');
  closeCalendarEditor();renderDayTasks();renderCalendar();
}
function calUnSchedule(){const task=(S.dayTasks||[]).find(t=>t.id===calendarEditingId);if(!task)return;delete task.schedule;save();closeCalendarEditor();renderDayTasks();renderCalendar();}
