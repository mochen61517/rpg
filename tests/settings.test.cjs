const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const box={innerHTML:''},historyBox={innerHTML:''},count={textContent:''};
const elements={usageInsightsBox:box,histBox:historyBox,settingsHistoryCount:count,settingsHistorySearch:{value:'<note>'},settingsHistoryLimit:{value:'50'}};
const usage={first:'2026-08-01',last:'2026-09-25',dailySince:'2026-09-25',daily:{'2026-09-25':{'page:action':1}},events:{
  a:{kind:'page',key:'action',count:200},b:{kind:'page',key:'current',count:12},c:{kind:'action',key:'<unsafe>',count:2}
}};
const ctx=vm.createContext({console,document:{getElementById:id=>elements[id]},
  readUsage:()=>usage,todayStr:()=> '2026-09-25',calAdd:()=> '2026-09-12',
  escHtml:s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  usageLabel:r=>r.kind+':'+r.key,
  S:{history:[{ts:'2026-09-24',text:'<note>',xp:3},{ts:'2026-09-25',text:'second',xp:1}]}
});
vm.runInContext(fs.readFileSync('assets/settings.js','utf8'),ctx);
vm.runInContext('renderUsageOverview();renderSettingsHistory()',ctx);
assert.ok(box.innerHTML.includes('仅有 1 天'));
assert.ok(box.innerHTML.includes('旧版入口历史'));
assert.ok(box.innerHTML.includes('&lt;unsafe&gt;'));
assert.ok(!box.innerHTML.includes('<unsafe>'));
assert.ok(historyBox.innerHTML.includes('&lt;note&gt;'));
assert.ok(historyBox.innerHTML.includes('delHistory(0)'));
assert.ok(!historyBox.innerHTML.includes('second'));
elements.settingsHistorySearch.value='2026-09-25';vm.runInContext('renderSettingsHistory()',ctx);
assert.ok(historyBox.innerHTML.includes('second'));
assert.ok(historyBox.innerHTML.includes('delHistory(1)'));
assert.equal(ctx.S.history.length,2);
const html=fs.readFileSync('life-rpg.html','utf8');
for(const id of ['impFile','saveSafetyBox','ghOwner','ghRepo','ghToken','ghPath','quietModeBtn','pwdNew','pushToken','phoneUrl','histBox'])assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
assert.ok(html.indexOf('assets/settings.js')<html.indexOf('assets/systems.js'));
console.log('PASS: history search and stable deletion indices, escaping, sparse usage caveat, legacy separation, settings IDs and initialization order.');
