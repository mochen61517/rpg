const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const host={innerHTML:''};
const ctx=vm.createContext({S:{growthFocus:[]},document:{getElementById:()=>host},todayStr:()=> '2026-09-28',
  calAdd:()=> '2026-09-01',escHtml:s=>String(s),save(){},alert(){},LIFE_TRACKS:{a:{n:'A',ic:'A',realms:[]},b:{n:'B',ic:'B',realms:[]},c:{n:'C',ic:'C',realms:[]}},
  ensureLifeCompound:()=>({logs:[{key:'a',d:'2026-09-01',min:200},{key:'a',d:'2026-09-01',min:200},{key:'b',d:'2026-09-02',min:5},{key:'b',d:'2026-09-03',min:5}]}),
  getLifeBaseMin:()=>100000,practiceNewMinutes:()=>5,practiceWeekMinutes:()=>0,practiceDays:()=>2,trackStage:()=>({n:'阶段',next:{n:'下一步',h:2000}})});
for(const f of ['clarity','hierarchy'])vm.runInContext(fs.readFileSync('assets/'+f+'.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
assert.deepEqual(Array.from(run("rankedTrackKeys(['a','b','c'],ensureLifeCompound().logs,[],'2026-09-28')")),['b','a','c']);
run('renderTrackOverview()');assert.equal((host.innerHTML.match(/class="track-feature"/g)||[]).length,1);assert.equal((host.innerHTML.match(/class="track-row"/g)||[]).length,2);
run("setGrowthFocus('c',true);setGrowthFocus('a',true);setGrowthFocus('b',true)");assert.equal(ctx.S.growthFocus.length,2);assert.deepEqual(Array.from(ctx.S.growthFocus),['c','a']);
ctx.S.growthFocus=[];ctx.ensureLifeCompound=()=>({logs:[]});run('renderTrackOverview()');assert.ok(!host.innerHTML.includes('class="track-feature"'));
console.log('PASS: focus by unique recent practice days, maximum two user selections, compact remaining tracks, no invented focus without records.');
