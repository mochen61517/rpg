/* Settings reorganizes existing controls without cloning handlers or save fields. */
let settingsTab='backup';
const SETTINGS_SECTIONS=[
  {key:'backup',title:'存档与备份',note:'导出、导入、本地文件与云备份'},
  {key:'preferences',title:'使用偏好',note:'外观、反馈节奏与个人设置'},
  {key:'access',title:'通知与访问',note:'微信推送、手机入口与访问口令'},
  {key:'records',title:'记录与内容',note:'操作历史、使用统计与灵感库'}
];
function settingsItem(section,title,node,keywords){
  if(!node)return;
  const item=document.createElement('section');item.className='settings-item';
  item.dataset.search=title+' '+(keywords||'');
  item.setAttribute('aria-label',title);
  if(node.classList.contains('panel')){
    node.classList.add('settings-card');item.append(node);
  }else{
    const card=document.createElement('div');card.className='panel settings-card';
    const h=document.createElement('h2');h.textContent=title;card.append(h,node);item.append(card);
  }
  document.getElementById('settings-'+section).append(item);
  return item;
}
function setupDataSettings(){
  const root=document.getElementById('page-data');if(!root||document.getElementById('settingsLayout'))return;
  const panelFor=id=>document.getElementById(id)?.closest('.panel');
  const rowFor=id=>document.getElementById(id)?.closest('.row');
  const safety=panelFor('saveSafetyBox'),quiet=panelFor('quietModeBtn'),visibility=panelFor('togglePage-ledger');
  const theme=panelFor('theme-light'),profile=panelFor('birthYear'),ideas=panelFor('ideaText'),history=panelFor('histBox');
  const usage=document.getElementById('usageInsightsPanel'),push=panelFor('pushToken'),phone=panelFor('phoneUrl');
  const password=rowFor('pwdNew'),transfer=rowFor('impFile'),cloud=document.getElementById('ghOwner')?.closest('details');
  const maintenance=root.querySelector('button[onclick="resetAll()"]')?.closest('.row');
  const fileBanner=document.getElementById('fsBanner'),saveWarning=document.getElementById('saveWarn');
  const oldFoot=root.querySelector(':scope > .foot');
  const layout=document.createElement('div');layout.id='settingsLayout';
  layout.innerHTML='<div class="settings-intro"><p>管理存档、调整偏好，或查找历史记录。</p><label class="settings-search">查找设置<input type="search" id="settingsSearch" placeholder="搜索：备份、主题、口令…" autocomplete="off"></label></div>'+
    '<div class="settings-tabs" role="tablist" aria-label="设置分类">'+SETTINGS_SECTIONS.map(s=>'<button type="button" role="tab" id="settings-tab-'+s.key+'" aria-controls="settings-'+s.key+'" data-settings-tab="'+s.key+'">'+s.title+'</button>').join('')+'</div>'+
    '<div id="settingsSearchStatus" class="hint" role="status" aria-live="polite"></div>'+
    SETTINGS_SECTIONS.map(s=>'<div class="settings-pane" role="tabpanel" id="settings-'+s.key+'" aria-labelledby="settings-tab-'+s.key+'"><div class="settings-section-title"><h2>'+s.title+'</h2><p>'+s.note+'</p></div></div>').join('');
  root.querySelector('.phead')?.insertAdjacentElement('afterend',layout);
  const transferItem=settingsItem('backup','导出与导入',transfer,'存档 备份 JSON 文件 保存');
  if(transferItem){const hint=document.createElement('p');hint.className='hint';hint.textContent='导出下载一份备份；导入会替换当前进度，并先创建恢复点。选择本地文件后，后续保存会写入该文件。';transferItem.querySelector('.panel').append(hint);}
  settingsItem('backup','存档安全',safety,'恢复点 自动 保存');
  if(fileBanner)document.getElementById('settings-backup').append(fileBanner);
  if(saveWarning)layout.prepend(saveWarning);
  settingsItem('backup','GitHub 云备份',cloud,'跨设备 同步 远程 配置 恢复 令牌');
  if(maintenance){
    const details=document.createElement('details');details.className='settings-maintenance';
    details.innerHTML='<summary>维护与重置</summary><p class="hint">每日结算通常自动执行。清空重来会重置当前进度，执行前会保存恢复点。</p>';
    const reset=maintenance.querySelector('button[onclick="resetAll()"]');if(reset)reset.classList.add('warn');
    details.append(maintenance);settingsItem('backup','维护与重置',details,'清空重来 新的一天 结算');
  }
  settingsItem('preferences','外观主题',theme,'皮肤 深色 浅色 字体');
  settingsItem('preferences','反馈节奏',quiet,'安静 提示 奖励');
  settingsItem('preferences','板块显隐',visibility,'钱庄 显示 隐藏');
  settingsItem('preferences','人生时间轴',profile,'出生 寿命 个人资料');
  settingsItem('access','微信推送',push,'pushplus 通知');
  settingsItem('access','手机访问',phone,'链接 二维码');
  settingsItem('access','访问口令',password,'密码 登录');
  settingsItem('records','操作历史',history,'打卡 完成 撤销');
  settingsItem('records','本机使用概览',usage,'频次 次数 统计 导出');
  settingsItem('records','灵感库存',ideas,'随机 日任务 周任务 月任务');
  // Preserve future or optional controls rather than dropping unknown settings.
  Array.from(root.children).filter(n=>n!==layout&&!n.classList.contains('phead')&&n!==oldFoot).forEach(n=>{
    settingsItem('records',n.querySelector('h2')?.textContent||'其他设置',n,'其他');
  });
  if(oldFoot){oldFoot.textContent='进度默认保存在当前浏览器。导出存档、选择本地文件或使用云备份，可降低清缓存和换设备造成的数据丢失风险。';root.append(oldFoot);}
  layout.querySelectorAll('[data-settings-tab]').forEach(b=>{
    b.addEventListener('click',()=>switchSettingsTab(b.dataset.settingsTab));
    b.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();const i=SETTINGS_SECTIONS.findIndex(s=>s.key===b.dataset.settingsTab);
      const next=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4;
      switchSettingsTab(SETTINGS_SECTIONS[next].key);layout.querySelector('[data-settings-tab="'+settingsTab+'"]').focus();
    });
  });
  document.getElementById('settingsSearch').addEventListener('input',filterSettings);
  switchSettingsTab(settingsTab,false);
  labelSettingsControls();
  setupHistoryTools();
}
function switchSettingsTab(key,track=true){
  if(!SETTINGS_SECTIONS.some(s=>s.key===key))return;
  settingsTab=key;document.getElementById('settingsSearch').value='';
  filterSettings();if(track&&typeof trackUsage==='function')trackUsage('tab','设置:'+key);
}
function filterSettings(){
  const q=document.getElementById('settingsSearch').value.trim().toLowerCase();let count=0;
  SETTINGS_SECTIONS.forEach(s=>{
    const pane=document.getElementById('settings-'+s.key);let hits=0;
    pane.querySelectorAll('.settings-item').forEach(item=>{item.hidden=!!q&&!item.dataset.search.toLowerCase().includes(q);if(!item.hidden)hits++;});
    count+=hits;pane.hidden=q?!hits:s.key!==settingsTab;
    const tab=document.getElementById('settings-tab-'+s.key);tab.setAttribute('aria-selected',String(!q&&s.key===settingsTab));tab.tabIndex=s.key===settingsTab?0:-1;
  });
  document.getElementById('settingsSearchStatus').textContent=q?(count?'找到 '+count+' 项设置':'没有匹配的设置，试试“存档”“主题”或“通知”。'):'';
}
function labelSettingsControls(){
  const names={ghOwner:'GitHub 用户名',ghRepo:'备份仓库',ghPath:'存档文件路径',ghToken:'GitHub 访问令牌',pushToken:'pushplus 推送令牌',pwdNew:'新访问口令',birthYear:'出生年份',lifeExpect:'预期寿命',ideaText:'灵感内容',ideaType:'灵感周期',phoneUrl:'手机访问地址'};
  Object.entries(names).forEach(([id,name])=>{
    const input=document.getElementById(id);if(!input)return;
    input.setAttribute('aria-label',name);
    const existing=input.parentElement.querySelector(':scope > label');
    if(existing&&!existing.contains(input)){existing.htmlFor=id;return;}
    if(!input.closest('label')&&!input.previousElementSibling?.matches('.settings-field-label')){
      const wrap=document.createElement('div');wrap.className='settings-field';
      const label=document.createElement('label');label.htmlFor=id;label.className='settings-field-label';label.textContent=name;
      input.replaceWith(wrap);wrap.append(label,input);
    }
  });
}
function historyMatches(rows,query){
  const q=query.trim().toLowerCase();
  return rows.map((entry,index)=>({entry,index})).reverse().filter(({entry})=>!q||(String(entry.ts||'')+' '+String(entry.text||'')).toLowerCase().includes(q));
}
function setupHistoryTools(){
  const box=document.getElementById('histBox');if(!box||document.getElementById('settingsHistorySearch'))return;
  const tools=document.createElement('div');tools.className='settings-history-tools';
  tools.innerHTML='<label>查找记录<input id="settingsHistorySearch" type="search" placeholder="任务名称、日期或撤销…"></label><label>显示条数<select id="settingsHistoryLimit"><option value="50">最近 50 条</option><option value="100">最近 100 条</option><option value="500">全部保留记录</option></select></label><span id="settingsHistoryCount" class="hint" role="status"></span>';
  box.before(tools);
  tools.addEventListener('input',()=>{box.style.display='block';renderSettingsHistory();});
  tools.addEventListener('change',()=>{box.style.display='block';renderSettingsHistory();});
  renderSettingsHistory();
}
function renderSettingsHistory(){
  const box=document.getElementById('histBox');if(!box)return;
  const q=document.getElementById('settingsHistorySearch')?.value||'';
  const limit=Number(document.getElementById('settingsHistoryLimit')?.value)||50;
  const rows=historyMatches(S.history||[],q),shown=rows.slice(0,limit);
  const count=document.getElementById('settingsHistoryCount');
  if(count)count.textContent='显示 '+shown.length+' / '+rows.length+' 条匹配记录 · 存档最多保留 500 条，含自动刷新与补录';
  box.innerHTML=shown.map(({entry:e,index})=>'<div class="hist"><span class="ts">'+escHtml(e.ts||'')+'</span><span class="ht">'+escHtml(e.text||'')+'</span>'+(e.xp?'<span class="xp">'+(e.xp>0?'+':'')+Number(e.xp)+'XP</span>':'')+'<button type="button" class="hist-del" title="删除这条记录" onclick="delHistory('+index+')">×</button></div>').join('')||'<p class="hint">没有匹配记录。</p>';
}
function renderUsageOverview(){
  const box=document.getElementById('usageInsightsBox');if(!box)return;
  const u=readUsage(),rows=Object.values(u.events||{}).sort((a,b)=>b.count-a.count);
  if(!rows.length){box.innerHTML='<p class="hint">还没有本机使用记录。缺失记录不代表没有使用。</p>';return;}
  const names={dashboard:'Dashboard',action:'短期任务',growth:'修行成长',longterm:'长期主线',journey:'角色设定',energy:'精力恢复',map:'旅行脚印',ledger:'钱庄',data:'数据设置'};
  const pages=rows.filter(r=>r.kind==='page'&&names[r.key]);
  const legacy=rows.filter(r=>r.kind==='page'&&!names[r.key]);
  const other=rows.filter(r=>r.kind!=='page');
  const max=Math.max(1,...pages.map(r=>r.count));
  const cutoff=calAdd(todayStr(),-13),days=Object.keys(u.daily||{}).filter(d=>d>=cutoff),recent={};
  days.forEach(d=>Object.entries(u.daily[d]).forEach(([k,v])=>recent[k]=(recent[k]||0)+v));
  const detail=list=>list.map(r=>'<div class="usage-row"><span>'+escHtml(usageLabel(r))+'</span><b>'+r.count+' 次</b></div>').join('');
  box.innerHTML='<p class="hint">累计统计 '+escHtml((u.first||'').slice(0,10))+' — '+escHtml((u.last||'').slice(0,10))+'</p>'+
    '<div class="usage-coverage">页面次数包含打开和跳转，不等于使用时长。子页与关键操作从 '+escHtml(u.dailySince||'本次更新')+' 才开始补充采集；最近14天仅有 '+days.length+' 天的按日记录，缺失日期不按未使用处理。</div>'+
    '<div class="usage-page-bars">'+pages.map(r=>'<div class="usage-page-row"><span>'+names[r.key]+'</span><div class="usage-page-meter"><i style="width:'+Math.round(r.count/max*100)+'%"></i></div><b>'+r.count+' 次</b></div>').join('')+'</div>'+
    '<details class="usage-detail"><summary>子页与操作明细（'+other.length+' 类）</summary>'+(detail(other)||'<p class="hint">尚无记录。</p>')+'</details>'+
    (legacy.length?'<details class="usage-detail"><summary>旧版入口历史（'+legacy.length+' 类，保留原始计数）</summary>'+detail(legacy)+'</details>':'')+
    '<details class="usage-detail"><summary>近14天已采集记录</summary>'+rows.filter(r=>recent[r.kind+':'+r.key]).map(r=>'<div class="usage-row"><span>'+escHtml(usageLabel(r))+'</span><b>'+recent[r.kind+':'+r.key]+' 次</b></div>').join('')+'</details>'+
    '<button class="btn ghost" onclick="usageExport()">导出本机统计</button>';
}
