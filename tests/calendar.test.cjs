const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const elements=new Map();
const root={innerHTML:'',dataset:{},addEventListener(){},querySelector(){return null;}};
elements.set('calendarRoot',root);
const ctx=vm.createContext({console,Date,Map,Blob,URL,setTimeout,requestAnimationFrame:f=>f(),
  S:{dayTasks:[],attrs:{MIND:100}},todayStr:()=> '2026-09-24',id:()=> 'new-id',
  escHtml:s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  ATTRS:{MIND:{name:'灵台',icon:'x'}},optAttrs:()=>'<option value="MIND">灵台</option>',
  save(){},trackUsage(){},renderDayTasks(){},addHist(){},alert(){},
  document:{getElementById:id=>elements.get(id),querySelector:()=>null},
});
vm.runInContext(fs.readFileSync('assets/calendar.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('assets/clarity.js','utf8'),ctx);
function run(s){return vm.runInContext(s,ctx);}
assert.equal(run("calAdd('2026-12-31',1)"),'2027-01-01');
assert.equal(run("calAdd('2024-02-28',1)"),'2024-02-29');
assert.equal(run("calValidDate('2026-02-29')"),false);
assert.equal(run("calValidate({t:'a',date:'2026-09-24',endDate:'2026-09-24',allDay:false,start:'10:00',end:'09:00',xp:10})"),'结束时间必须晚于开始时间');
assert.equal(run("calValidate({t:'a',date:'2026-09-24',endDate:'2026-09-25',allDay:false,start:'23:00',end:'01:00',xp:10})"),'');
ctx.S.dayTasks=[{id:'a',t:'<img onerror=x>',done:false,schedule:{date:'2026-09-24',endDate:'2026-09-25',allDay:false,start:'23:00',end:'01:00'}}];
assert.equal(run("calTasksOn('2026-09-25').length"),1);
assert.equal(run("calTasksOn('2026-09-26').length"),0);
assert.equal(run("calConflict({date:'2026-09-25',endDate:'2026-09-25',allDay:false,start:'00:30',end:'01:30'},null).length"),1);
assert.equal(run("calConflict({date:'2026-09-25',endDate:'2026-09-25',allDay:false,start:'01:00',end:'02:00'},null).length"),0);
assert.equal(run("calConflict({date:'2026-09-25',endDate:'2026-09-25',allDay:false,start:'00:30',end:'01:30'},'a').length"),0);
for(const view of ['month','week','day']){run(`calendarView='${view}';calendarDate='2026-09-24';renderCalendar()`);assert.ok(root.innerHTML.includes('&lt;img'));assert.ok(!root.innerHTML.includes('<img'));}
for(const [key,value] of Object.entries({calTitle:'项目讨论',calStartDate:'2026-09-24',calEndDate:'2026-09-24',calStartTime:'14:00',calEndTime:'15:00',calAttr:'MIND',calXp:'10'}))elements.set(key,{value});
elements.set('calAllDay',{checked:false});elements.set('calError',{textContent:''});elements.set('calendarEditor',{close(){}});
run('calSave()');assert.equal(ctx.S.dayTasks.length,2);assert.equal(ctx.S.dayTasks[1].schedule.start,'14:00');
run("calendarEditingId='new-id'");elements.get('calStartDate').value='2026-09-26';elements.get('calEndDate').value='2026-09-26';run('calSave()');
assert.equal(ctx.S.dayTasks.length,2);assert.equal(ctx.S.dayTasks[1].schedule.date,'2026-09-26');
ctx.S.dayTasks[1].done=true;elements.get('calXp').value='100';run('calSave()');assert.equal(ctx.S.dayTasks[1].xp,10);
run('calUnSchedule()');assert.equal(ctx.S.dayTasks.length,2);assert.equal(ctx.S.dayTasks[1].schedule,undefined);
// Exercise the real task completion functions, including XP reversal and future filtering.
const taskSource=fs.readFileSync('assets/tasks-render.js','utf8');
ctx.grant=(a,xp,neg)=>ctx.S.attrs[a]+=(neg?-xp:xp);ctx.floatXP=()=>{};
const taskStart=taskSource.indexOf('let _editingDayTask=null;'),taskEnd=taskSource.indexOf('// ===== 旅行地图：',taskStart);
vm.runInContext(taskSource.slice(taskStart,taskEnd),ctx);
ctx.S.dayTasks[1].done=false;ctx.S.attrs.MIND=100;
run("toggleDayTask('new-id')");assert.equal(ctx.S.attrs.MIND,110);
run("undoDoneDayTask('new-id')");assert.equal(ctx.S.attrs.MIND,100);
ctx.addDays=(d,n)=>run(`calAdd('${d}',${n})`);ctx.fmtMD=d=>d;
elements.set('dayTaskList',{innerHTML:''});
ctx.S.dayTasks[1].schedule={date:'2026-09-26',endDate:'2026-09-26',allDay:true};run('renderDayTasks()');
assert.ok(!elements.get('dayTaskList').innerHTML.includes('项目讨论'));
vm.runInContext(fs.readFileSync('assets/interaction.js','utf8'),ctx);
ctx.REC_DATE='';ctx.recordDateStr=()=> '2026-09-24';ctx.LIFE_TRACKS={reading:{a:'MIND',n:'阅读'}};
const logs=[{id:'task',key:'reading',d:'2026-09-24',min:20,src:'task',a:'MIND'},{id:'1',key:'reading',d:'2026-09-24',min:10,src:'quick',a:'MIND'},{id:'2',key:'reading',d:'2026-09-24',min:5,src:'quick',a:'MIND'}];
ctx.ensureLifeCompound=()=>({logs});ctx.render=()=>{};
run("undoLastLifePractice('reading')");assert.equal(logs.length,2);assert.equal(logs[0].id,'task');assert.equal(ctx.S.attrs.MIND,95);
console.log('PASS: dates, leap year, cross-day, overlap, escaping, 3 views, add/edit/unschedule, completed XP lock, task completion/undo XP, future filtering, single-record undo.');
// Navigation must not redirect users to an unread NPC tab.
const pages=new Map(['action','growth','journey','longterm','dashboard'].map(p=>['page-'+p,{classList:{add(){}}}]));
ctx.document.querySelectorAll=()=>[];ctx.document.getElementById=id=>pages.get(id)||elements.get(id);
ctx.rememberPagePosition=()=>{};ctx.restorePagePosition=()=>{};ctx.location={hash:'#dashboard'};
ctx.history={replaceState(){}};ctx.window={};ctx.markSideSeen=()=>{};ctx.markBondsSeen=()=>{};ctx.renderNotifications=()=>{};ctx.renderNavBadges=()=>{};
ctx.switchShortTaskTab=(tab)=>ctx.selectedTab=tab;ctx.switchGrowthTab=tab=>ctx.selectedGrowth=tab;
ctx.S.stTab='calendar';ctx.S.gpTab='rewards';ctx.S.npc={week:'new',seenWeek:'old',active:[{}]};ctx.S.myJianghu=[{done:false}];
const navStart=taskSource.indexOf('var _isDeepLink=false;'),navEnd=taskSource.indexOf('// v6.0.37 板块显隐：',navStart);
vm.runInContext(taskSource.slice(navStart,navEnd),ctx);run("showPage('action')");assert.equal(ctx.selectedTab,'calendar');
run("showPage('growth')");assert.equal(ctx.selectedGrowth,'rewards');
const clickStart=taskSource.indexOf('function todayMainOrRecord(k){'),clickEnd=taskSource.indexOf('function renderTodayCockpit',clickStart);
ctx._lcOpenTrack=null;ctx.renderLifeCompound=()=>{};ctx.toggleTodayMain=()=>{throw Error('Recording must not toggle priority')};
vm.runInContext(taskSource.slice(clickStart,clickEnd),ctx);run("todayMainOrRecord('reading')");assert.equal(ctx._lcOpenTrack,'reading');
run("todayMainOrRecord('reading')");assert.equal(ctx._lcOpenTrack,null);
console.log('PASS: remembered tabs, unread NPC does not hijack navigation, record button never changes priority.');
