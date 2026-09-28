const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ctx=vm.createContext({S:{uiPrefs:{quiet:true},year:[{t:'目标',nextAction:'下一步'}],dayTasks:[{id:'old',t:'旧日历任务',schedule:{date:'2026-10-01'}}]},save(){},render(){},showPage(){},switchShortTaskTab(){},id:()=> 'new',todayStr:()=> '2026-09-28',yearNextText:c=>c.nextAction,yearGoalAnalysis:()=>({track:{a:'MIND'}})});
vm.runInContext(fs.readFileSync('assets/lightweight.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
assert.equal(run("optionalEnabled('calendar')"),false);
run("setOptionalFeature('calendar',true)");assert.equal(run("optionalEnabled('calendar')"),true);assert.equal(ctx.S.uiPrefs.quiet,true);
run("setOptionalFeature('calendar',false)");assert.equal(ctx.S.dayTasks[0].schedule.date,'2026-10-01');
run('addGoalTodo(0);addGoalTodo(0)');assert.equal(ctx.S.dayTasks.length,2);assert.equal(ctx.S.dayTasks[1].t,'下一步');assert.equal(ctx.S.dayTasks[1].schedule,undefined);
console.log('PASS: optional defaults, reversible controls, preserved scheduled data, next action adds one ordinary task.');
