/* Presentation preferences only; task records keep their original IDs and order. */
const clarityOpen=new Set();
function clarityFold(key,title,body){
  return '<details class="clarity-fold"'+(clarityOpen.has(key)?' open':'')+' ontoggle="clarityRemember(this,\''+key+'\')"><summary>'+title+'</summary><div class="clarity-body">'+body+'</div></details>';
}
function clarityRemember(el,key){if(el.open)clarityOpen.add(key);else clarityOpen.delete(key);}
function sortedDayTasks(tasks,mode){
  const due=x=>x.due||'9999-12-31';
  return tasks.slice().sort((a,b)=> mode==='type'
    ? (a.a||'MIND').localeCompare(b.a||'MIND')||due(a).localeCompare(due(b))
    : mode==='created'?0:due(a).localeCompare(due(b)));
}
function setTaskOrder(mode){S.taskOrder=['due','type','created'].includes(mode)?mode:'due';save();renderDayTasks();}
function clarityTaskTools(){
  const mode=S.taskOrder||'due';
  return '<div class="clarity-task-tools"><span>未完成任务</span><label>排序 <select aria-label="任务排序" onchange="setTaskOrder(this.value)">'+[['due','截止时间优先'],['type','按类型分组'],['created','添加顺序']].map(([v,t])=>'<option value="'+v+'"'+(mode===v?' selected':'')+'>'+t+'</option>').join('')+'</select></label></div>';
}
function clarityWrap(node,title,key){
  if(!node||node.parentElement?.dataset.clarity===key)return;
  const fold=document.createElement('details');fold.className='clarity-fold';fold.dataset.clarity=key;
  const sum=document.createElement('summary');sum.textContent=title;node.before(fold);fold.append(sum,node);
}
function setupClarity(){
  const cockpit=document.getElementById('todayDetailCockpit'),tasks=document.querySelector('#st-action-pane .today-task-panel');
  if(cockpit&&tasks&&cockpit.nextElementSibling!==tasks)cockpit.after(tasks);
  clarityWrap(document.querySelector('.xp-ledger'),'修为账本 · 查看奖励明细','xp');
  const pane=document.getElementById('jr-memory-pane');
  if(pane){
    const fragments=document.getElementById('jpFragments');if(fragments&&pane.contains(fragments))pane.prepend(fragments);
    [['jpCapsule','写给未来 · 时间胶囊'],['jpWishes','想去完成 · 人生愿望'],['jpCodex','已经收集 · 人生收集册'],['jpLoot','故人信物 · 收藏']].forEach(([id,title])=>{
      const node=document.getElementById(id);if(node&&pane.contains(node))clarityWrap(node,title,id);
    });
  }
  const energy=document.getElementById('page-energy');
  if(energy)Array.from(energy.children).filter(n=>n.classList.contains('panel')).forEach(n=>clarityWrap(n,'身体指标 · 需要时更新','body-metrics'));
}
