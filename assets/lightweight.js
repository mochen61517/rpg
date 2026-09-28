const OPTIONAL_FEATURES=[
  ['recovery','精力趋势与身体指标'],['calendar','站内日历'],['reviews','周报与复盘'],
  ['xp','修为账本'],['collections','时间胶囊与收藏'],['dashboardExtras','首页辅助统计']
];
function optionalEnabled(key){return S.uiPrefs?.optionalFeatures?.[key]===true;}
function setOptionalFeature(key,on){
  if(!OPTIONAL_FEATURES.some(x=>x[0]===key))return;
  S.uiPrefs=S.uiPrefs||{};S.uiPrefs.optionalFeatures=S.uiPrefs.optionalFeatures||{};
  S.uiPrefs.optionalFeatures[key]=!!on;save();render();
}
function setupLightweight(){
  OPTIONAL_FEATURES.forEach(([key])=>document.documentElement.classList.toggle('hide-'+key,!optionalEnabled(key)));
  if((S.stTab==='calendar'&&!optionalEnabled('calendar'))||(S.stTab==='week'&&!optionalEnabled('reviews')))switchShortTaskTab('action');
  const pane=document.getElementById('settings-preferences');
  if(pane&&!document.getElementById('optionalFeatures')){
    const item=document.createElement('section');item.id='optionalFeatures';item.className='settings-item';item.dataset.search='功能 显示 隐藏 日历 精力 身体 复盘 周报 修为 胶囊 收藏 统计';
    item.innerHTML='<div class="panel settings-card"><h2>按需启用</h2><div class="optional-feature-list">'+OPTIONAL_FEATURES.map(([key,label])=>'<label><input type="checkbox" data-optional="'+key+'" onchange="setOptionalFeature(\''+key+'\',this.checked)">'+label+'</label>').join('')+'</div></div>';pane.prepend(item);
  }
  document.querySelectorAll('[data-optional]').forEach(e=>e.checked=optionalEnabled(e.dataset.optional));
}
function addGoalTodo(i){
  const goal=S.year[i],title=goal&&yearNextText(goal);if(!title)return;
  S.dayTasks=S.dayTasks||[];
  if(!S.dayTasks.some(t=>t.id===goal.nextTaskId&&!t.done)){
    const task={id:id(),t:title,a:yearGoalAnalysis(goal,i).track?.a||'MIND',xp:10,d:todayStr(),due:'',done:false};
    S.dayTasks.push(task);goal.nextTaskId=task.id;save();
  }
  showPage('action');switchShortTaskTab('action');render();
}
