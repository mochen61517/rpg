const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const nodes=new Map([['monthPlanEdit',{innerHTML:''}]]);
const ctx=vm.createContext({console,Date,Map,Set,S:{year:[{t:'旧目标',editCount:8,records:[{text:'原始进展'}]}],monthPlansByYear:{'2026':{'2026-09':{plan:'本月重点',actual:'已有实际',reason:'已有复盘',status:'part'}}}},todayStr:()=> '2026-09-25',thisMonth:()=> '2026-09',
  ATTRS:{MIND:{name:'灵台'},BODY:{name:'体魄'}},escHtml:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),mpOpen:new Set(),isDoneEver:x=>!!x.done,
  save(){},renderLongterm(){},renderDayTasks(){},startInlineRename:(anchor,title,commit)=>commit('新目标'),document:{getElementById:id=>nodes.get(id)}});
for(const f of ['clarity','hierarchy'])vm.runInContext(fs.readFileSync('assets/'+f+'.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
assert.equal(run("taskDateGroup({due:'2026-09-24'})"),'已逾期');
assert.equal(run("taskDateGroup({schedule:{date:'2026-09-28'}})"),'之后');
assert.equal(run("taskDateGroup({schedule:{date:'2026-09-24'}})"),'今天');
assert.equal(run('taskDateGroup({})'),'无日期');
assert.equal(run("memoryMatches([{d:'2026-09-01',text:'读书'},{d:'2026-08-01',text:'读书'},{d:'2026-09-02',text:'运动'}],'读','2026-09').length"),1);
run('editYearGoal(0,{})');assert.equal(ctx.S.year[0].t,'新目标');assert.equal(ctx.S.year[0].titleHistory[0].from,'旧目标');assert.equal(ctx.S.year[0].editCount,9);
// Execute the actual migration statement to guard against silently discarding new and old fields.
ctx.S.year[0].nextAction='下一步';ctx.id=()=> 'goal-id';
const core=fs.readFileSync('assets/core-state.js','utf8');const migration=core.match(/S\.year = S\.year\.map\(c=>\(\{[^\n]+/)[0];run(migration);
assert.equal(ctx.S.year[0].records[0].text,'原始进展');assert.equal(ctx.S.year[0].nextAction,'下一步');assert.equal(ctx.S.year[0].titleHistory.length,1);
run('renderMonthPlanEdit()');let html=nodes.get('monthPlanEdit').innerHTML;
assert.ok(html.includes('本月重点'));assert.ok(!html.includes('mp-cards'));assert.ok(html.includes('月末回顾 · 已有记录'));assert.ok(!html.includes('id="mPlan"'));
ctx.mpOpen.add('2026-09');run('renderMonthPlanEdit()');html=nodes.get('monthPlanEdit').innerHTML;
for(const field of ['mPlan','mActual','mReason','mStatus'])assert.equal((html.match(new RegExp('id="'+field+'"','g'))||[]).length,1);
assert.ok(html.includes('已有实际'));assert.ok(html.includes('已有复盘'));
// Opening an annual next action does not create a task until the calendar is saved.
ctx.S.dayTasks=[];nodes.set('calTitle',{value:''});nodes.set('calAttr',{value:''});ctx.openCalendarEditor=()=>{};ctx.yearGoalAnalysis=()=>({track:{a:'MIND'}});
run('yearNextTask(0)');assert.equal(ctx.S.dayTasks.length,0);assert.equal(nodes.get('calTitle').value,'下一步');
console.log('PASS: date grouping, memory filtering, unlimited edits with history, annual migration retention, month edit IDs and next-action draft without side effects.');
