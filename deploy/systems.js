/* ---------- ⑤ 四系技能树 ---------- */
// bonus: 该系经验加成百分比；每解锁一个节点永久生效
const SKILL_TREE={
  BADMINTON:[
    {id:'bm1',n:'握拍如握笔',d:'基本功打底',cost:1,req:null,b:.03},
    {id:'bm2',n:'步法生根',d:'启动步 / 交叉步成型',cost:2,req:'bm1',b:.05},
    {id:'bm3',n:'反手不虚',d:'反手高远稳定过中场',cost:2,req:'bm1',b:.05},
    {id:'bm4',n:'杀球有声',d:'进攻端形成威胁',cost:3,req:'bm2',b:.07},
    {id:'bm5',n:'临场读人',d:'能看懂对手意图',cost:3,req:'bm3',b:.07},
    {id:'bm6',n:'羽道三·五',d:'可稳定对抗，战术成型',cost:5,req:'bm4',b:.12},
  ],
  CAREER:[
    {id:'cr1',n:'先动手',d:'把「打算」变成「投了」',cost:1,req:null,b:.03},
    {id:'cr2',n:'叙事成型',d:'能讲清自己这五年做成了什么',cost:2,req:'cr1',b:.05},
    {id:'cr3',n:'情报网',d:'有人能告诉你里面的真相',cost:2,req:'cr1',b:.05},
    {id:'cr4',n:'谈判不怯',d:'敢开价，也敢说不',cost:3,req:'cr2',b:.07},
    {id:'cr5',n:'AI 为我所用',d:'Agent 闭环缩短验证周期',cost:3,req:'cr3',b:.07},
    {id:'cr6',n:'够大够稳',d:'拿到能托付的平台',cost:5,req:'cr4',b:.12},
  ],
  BODY:[
    {id:'bd1',n:'按时躺下',d:'23:30 前睡觉成为常态',cost:1,req:null,b:.03},
    {id:'bd2',n:'力量地基',d:'规律力量训练不断档',cost:2,req:'bd1',b:.05},
    {id:'bd3',n:'会休息',d:'疗愈按周期来，不硬撑',cost:2,req:'bd1',b:.05},
    {id:'bd4',n:'体态归位',d:'不再含胸驼背',cost:3,req:'bd2',b:.07},
    {id:'bd5',n:'耐力见长',d:'打满三局还有余力',cost:3,req:'bd2',b:.07},
    {id:'bd6',n:'身轻体健',d:'体脂与体重都到位',cost:5,req:'bd4',b:.12},
  ],
  MIND:[
    {id:'md1',n:'留一点给自己',d:'每天有不为任何人的时间',cost:1,req:null,b:.03},
    {id:'md2',n:'指下有声',d:'能完整弹下一首',cost:2,req:'md1',b:.05},
    {id:'md3',n:'沉得进去',d:'读书不被手机打断',cost:2,req:'md1',b:.05},
    {id:'md4',n:'情绪有处放',d:'难受时知道怎么安放',cost:3,req:'md2',b:.07},
    {id:'md5',n:'不比较',d:'少看别人，多看自己',cost:3,req:'md3',b:.07},
    {id:'md6',n:'灵台澄明',d:'心稳了，事就顺了',cost:5,req:'md4',b:.12},
  ],
};
function skillPointsTotal(){ return Math.max(0, lvlOf(overallXP())-1); }  // 每升 1 级得 1 点
function skillPointsSpent(){ let s=0; for(const k in SKILL_TREE) SKILL_TREE[k].forEach(nd=>{ if(S.skill.un.includes(nd.id)) s+=nd.cost; }); return s; }
function skillPointsLeft(){ return skillPointsTotal()-skillPointsSpent(); }
function renderGrowthLevel(){
  const el=document.getElementById('growthLvl'); if(!el) return;
  const gxp=overallXP(), gL=lvlOf(gxp), gi=xpInLvl(gxp);
  document.getElementById('growthLvl').textContent='Lv.'+gL;
  document.getElementById('growthXpFill').style.width=gi.pct+'%';
  document.getElementById('growthXpText').textContent=gi.xp+' / '+gi.need+' 加权经验';
  const gp=document.getElementById('growthPoints'); if(gp) gp.textContent='修行点 '+skillPointsLeft()+' / '+skillPointsTotal();
  const gs=document.getElementById('growthStreak'); if(gs) gs.textContent=computeStreak();
}
function skillBonusFor(attr){
  let b=0; const tree=SKILL_TREE[attr]||[];
  tree.forEach(nd=>{ if(S.skill.un.includes(nd.id)) b+=nd.b; });
  return b;
}
function canUnlock(attr,nid){
  const nd=(SKILL_TREE[attr]||[]).find(x=>x.id===nid); if(!nd) return {ok:false,why:'节点不存在'};
  if(S.skill.un.includes(nid)) return {ok:false,why:'已解锁'};
  if(nd.req && !S.skill.un.includes(nd.req)) return {ok:false,why:'需先解锁前置'};
  if(skillPointsLeft()<nd.cost) return {ok:false,why:'修行点不足（需 '+nd.cost+'）'};
  return {ok:true};
}
function unlockSkill(attr,nid){
  const c=canUnlock(attr,nid);
  if(!c.ok){ alert('无法解锁：'+c.why); return; }
  const nd=SKILL_TREE[attr].find(x=>x.id===nid);
  S.skill.un.push(nid);
  addHist('🌳 '+ATTRS[attr].name+'·'+nd.n+' 已开枝（+'+Math.round(nd.b*100)+'% '+ATTRS[attr].name+'经验）', 0);
  celebrateTask('🌳 '+nd.n+' 开枝：'+ATTRS[attr].name+' 经验 +'+Math.round(nd.b*100)+'%');
  save(); render();
}

/* ---------- ⑥ 赛季 + 称号 ---------- */
function curSeasonKey(){ const n=new Date(); return n.getFullYear()+'-Q'+(Math.floor(n.getMonth()/3)+1); }
function seasonRange(key){
  const [y,q]=key.split('-Q').map(Number);
  const m0=(q-1)*3;
  const p=v=>String(v).padStart(2,'0');
  const start=y+'-'+p(m0+1)+'-01';
  const endD=new Date(y,m0+3,0);
  return {start,end:endD.getFullYear()+'-'+p(endD.getMonth()+1)+'-'+p(endD.getDate())};
}
const TITLES=[
  {id:'t_flame',ic:'🔥',n:'灯火不熄者',d:'赛季内连击达 30 日',cond:st=>st.maxStreak>=30},
  {id:'t_dawn', ic:'🌅',n:'晨型人',   d:'赛季内「按时睡觉」完成 40 次',cond:st=>st.sleep>=40},
  {id:'t_wing', ic:'🏸',n:'羽道行者', d:'赛季内羽道投入满 30 小时',cond:st=>st.attr.BADMINTON>=1800},
  {id:'t_forge',ic:'💼',n:'破局者',   d:'赛季内业道投入满 40 小时',cond:st=>st.attr.CAREER>=2400},
  {id:'t_iron', ic:'💪',n:'铁骨',     d:'赛季内体道投入满 30 小时',cond:st=>st.attr.BODY>=1800},
  {id:'t_zen',  ic:'🎹',n:'灵台清明', d:'赛季内灵台投入满 25 小时',cond:st=>st.attr.MIND>=1500},
  {id:'t_road', ic:'🗺️',n:'远行客',   d:'赛季内点亮 3 个新地点',cond:st=>st.places>=3},
  {id:'t_all',  ic:'🏮',n:'四方尽欢', d:'赛季内完成 200 项行动',cond:st=>st.done>=200},
];
function seasonStats(key){
  const {start,end}=seasonRange(key);
  const attr={BADMINTON:0,CAREER:0,BODY:0,MIND:0};
  let done=0, sleep=0;
  allTaskLists().forEach(list=>list.forEach(x=>{
    (x.donedates||[]).forEach(d=>{ if(d>=start&&d<=end){ done++; if(/睡觉|早睡/.test(x.t||'')) sleep++; } });
    if(x.mins) for(const d in x.mins){ if(d>=start&&d<=end) attr[safeAttr(x.a)]+=x.mins[d]; }
  }));
  // 赛季内最长连击（用 activeDays 算）
  const days=(S.activeDays||[]).filter(d=>d>=start&&d<=end).sort();
  let maxStreak=0,cur=0,prev='';
  days.forEach(d=>{ if(prev && shiftDate(prev,1)===d) cur++; else cur=1; prev=d; if(cur>maxStreak) maxStreak=cur; });
  const places=Object.keys(S.travel||{}).filter(k=>S.travel[k]&&S.travel[k].visited&&S.travel[k].date>=start&&S.travel[k].date<=end).length;
  return {start,end,attr,done,sleep,maxStreak,places};
}
// 赛季结算已移除（赛季称号模块已停用）
// 本季实时进度（未结算也能看到快要到手的称号）
function seasonPreview(){
  const key=curSeasonKey(), st=seasonStats(key);
  return TITLES.map(t=>({...t, hit:t.cond(st)}));
}
function wearTitle(tid){ S.season.worn = (S.season.worn===tid?'':tid); save(); render(); }
function wornTitleObj(){ return TITLES.find(t=>t.id===S.season.worn)||null; }

/* ---------- ⑦ 今日战报 ---------- */
function buildBrief(dateStr){
  const am=attrMinutesOn(dateStr);
  const done=doneCountOn(dateStr);
  const mins=minutesOn(dateStr);
  // 经验增量：trend 快照差
  const tr=(S.trend||[]).filter(e=>e.d<=dateStr);
  let dxp=0;
  if(tr.length>=2) dxp=Math.round(tr[tr.length-1].xp-tr[tr.length-2].xp);
  const drops=(S.rewards.drops||[]).filter(x=>(x.ts||'').slice(0,10)===dateStr)
    .map(x=>{ const r=findReward(x.rewardId); return r?r.name:x.rewardId; });
  const streak=computeStreak();
  const en=energyState();
  const dh=dingHuoNow();
  return {date:dateStr,done,mins,am,dxp,drops,streak,en,dh};
}
function briefLine(b){
  if(b.done===0) return '今天什么都没做也没关系。休息是修行的一部分。';
  if(b.done>=8) return '今天做得很满。记得给自己留一点不做事的时间。';
  if(b.en.v<30) return '完成得不少，但精力已经透支了。明天可以慢一点。';
  if(b.streak>=7) return '灯火已连 '+b.streak+' 日不熄。这不是运气，是你每天选的。';
  return '稳稳地过了一天。';
}
function showBrief(dateStr){
  const d=dateStr||yesterdayStr();
  const b=buildBrief(d);
  const el=document.getElementById('briefBody'); if(!el) return;
  const attrRow=Object.keys(ATTRS).map(k=>{
    const m=b.am[k]||0;
    return '<div class="bf-a"><span class="bf-ic">'+ATTRS[k].icon+'</span><span class="bf-n">'+ATTRS[k].name+'</span><span class="bf-v">'+(m?h(m):'—')+'</span></div>';
  }).join('');
  el.innerHTML=
     '<div class="bf-date">'+fmtMD(d)+' 战报</div>'
    +'<div class="bf-grid">'
      +'<div class="bf-k"><b>'+b.done+'</b><span>完成行动</span></div>'
      +'<div class="bf-k"><b>'+(b.mins?h(b.mins):'0h')+'</b><span>总投入</span></div>'
      +'<div class="bf-k"><b>'+(b.dxp>0?'+'+b.dxp:b.dxp)+'</b><span>加权经验</span></div>'
      +'<div class="bf-k"><b>'+b.streak+'</b><span>灯火连日</span></div>'
    +'</div>'
    +'<div class="bf-attrs">'+attrRow+'</div>'
    +'<div class="bf-en"><span>精力 '+b.en.v+' · '+b.en.label+'</span><div class="bf-enbar"><i style="width:'+b.en.v+'%"></i></div></div>'
    +(b.drops.length?'<div class="bf-drop">🎁 掉落：'+b.drops.join('、')+'</div>':'')
    +'<div class="bf-say">'+briefLine(b)+'</div>'
    +'<div class="bf-liu">🕯 '+b.dh.jieqi+'·'+b.dh.el+'行当令（'+b.dh.lv+'）：'+b.dh.adv+'</div>';
  document.getElementById('briefMask').style.display='flex';
}
function closeBrief(){ const m=document.getElementById('briefMask'); if(m) m.style.display='none'; S.brief.last=todayStr(); save(); }
function maybeShowBrief(){
  const t=todayStr();
  if(S.brief.last===t) return;
  // 昨天有活动才弹，避免首次使用/长期空窗时打扰
  const y=yesterdayStr();
  if(doneCountOn(y)===0){ S.brief.last=t; return; }
  setTimeout(()=>showBrief(y),600);
}

/* ---------- v5.17 渲染 ---------- */
function renderEnergy(){
  const el=document.getElementById('energyBox'); if(!el) return;
  const e=energyState();
  el.innerHTML=
     '<div class="en-card" onclick="showPage(\'energy\')" title="查看精力详情">'
    +  '<div class="en-left">'
    +    '<span class="en-lab '+e.cls+'">'+e.label+'</span>'
    +    '<div class="en-score"><b class="en-num">'+e.v+'</b><span class="en-unit">/100</span></div>'
    +  '</div>'
    +  '<div class="en-right">'
    +    '<div class="en-tip">'+e.tip+'</div>'
    +  '</div>'
    +'</div>';
}
function renderLifeBanner(){
  const el=document.getElementById('lifeBanner'); if(!el) return;
  const by=Math.max(1900,Math.min(2100, S.profile.birthYear||1995));
  const le=Math.max(1, S.profile.lifeExpect||85);
  const now=new Date();
  const born=new Date(by,0,1);
  const lifeMs=le*365.25*86400000;
  const livedMs=Math.max(0, now-born);
  const livedYears=livedMs/(365.25*86400000);
  const livedPct=Math.max(0,Math.min(100,Math.round(livedYears/le*1000)/10));
  const totalDays=Math.floor(lifeMs/86400000);
  const livedDays=Math.floor(livedMs/86400000);

  // 每日 seed（YYYY-MM-DD 哈希 → 伪随机），保证当日稳定、次日换
  const todayKey=now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate();
  let h=2166136261>>>0;
  for(let i=0;i<todayKey.length;i++){ h=((h^(todayKey.charCodeAt(i)))*16777619)>>>0; }
  function rng(){ h=((h+0x6D2B79F5)*0x9E3779B1)>>>0; return (h>>>0)/4294967296; }

  // 每日一句：从生活意象中随机选一位「主角」，只展示一条，浪漫、诗意、不堆叠
  const themes=[
    {icon:'🌅', name:'日出', past:livedDays, total:totalDays,
     line:(p,r)=>'你已迎来 <b>'+p.toLocaleString()+'</b> 次日出，余生还有约 '+r.toLocaleString()+' 场——请别错过任何一个清晨。'},
    {icon:'🌇', name:'日落', past:livedDays, total:totalDays,
     line:(p,r)=>'你看过 <b>'+p.toLocaleString()+'</b> 场日落，余下的每一场，都值得停下脚步好好看。'},
    {icon:'🌸', name:'春天', past:Math.floor(livedYears), total:le,
     line:(p)=>'你路过 <b>'+p+'</b> 个春天，第 '+(p+1)+' 个正在悄悄发芽。'},
    {icon:'🌕', name:'满月', past:Math.floor(livedDays/29.53), total:Math.floor(totalDays/29.53),
     line:(p)=>'你见过 <b>'+p.toLocaleString()+'</b> 轮满月，每一轮都曾有人为你点亮一盏灯。'},
    {icon:'🌊', name:'潮汐', past:livedDays, total:totalDays,
     line:(p,r)=>'你已错过 <b>'+p.toLocaleString()+'</b> 次潮汐，但下一浪，永远正向你赶来。'},
    {icon:'✨', name:'星光', past:livedDays, total:totalDays,
     line:(p,r)=>'你与 <b>'+p.toLocaleString()+'</b> 个夜晚擦肩而过，总有一颗星，是为你而亮的。'},
  ];
  // 保证不与昨日重复：当日 seed 随机后，若与昨日结果相同则后移一位
  function themeIdxForDate(d){
    const key=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
    let hh=2166136261>>>0;
    for(let i=0;i<key.length;i++){ hh=((hh^key.charCodeAt(i))*16777619)>>>0; }
    function rng2(){ hh=((hh+0x6D2B79F5)*0x9E3779B1)>>>0; return (hh>>>0)/4294967296; }
    return Math.floor(rng2()*themes.length);
  }
  const yest=new Date(now); yest.setDate(yest.getDate()-1);
  let idx=Math.floor(rng()*themes.length);
  if(idx===themeIdxForDate(yest)) idx=(idx+1)%themes.length;
  const feat=themes[idx];
  const remF=Math.max(0, feat.total-feat.past);
  const openers=[
    '今天，是你余生里最年轻的一天。',
    '此刻的你，比往后任何一天都更接近清晨。',
    '余生还长，但今天的太阳，只会升起这一次。',
    '世界还在，你也还在，这就够了。',
    '不必追赶时间，你已经是时间本身。',
  ];
  const opener=openers[Math.floor(rng()*openers.length)];
  el.innerHTML=
     '<div class="lb-head">☀️ 今日一句</div>'
    +'<div class="lb-poem">'
    +  '<span class="lb-poem-ic">'+feat.icon+'</span>'
    +  '<span class="lb-poem-t">'+feat.line(feat.past,remF)+'</span>'
    +'</div>'
    +'<div class="lb-bar-wrap">'
    +  '<div class="lb-bar"><i style="width:'+livedPct+'%"></i></div>'
    +  '<div class="lb-bar-label">人生这条路，已走过 '+livedPct+'% · 余下 '+Math.round(100-livedPct)+'%</div>'
    +'</div>'
    +'<div class="lb-foot">'+opener+'</div>';
}
// 修行卷册已移除（与长期复利轨道重复）
function renderDayun(){
  const el=document.getElementById('dayunBox'); if(!el) return;
  const y=new Date().getFullYear();
  el.innerHTML=DAYUN.map(d=>{
    const isCur=(y>=d.y0 && y<d.y1);
    return '<div class="dy-node'+(isCur?' on':'')+'">'
      +'<div class="dy-y">'+(isCur?'▶ ':'')+d.n+'</div>'
      +'<div class="dy-range">'+d.y0+'–'+d.y1+'</div>'
      +'<div class="dy-yi">宜 · '+d.yi+'</div>'
      +'<div class="dy-ji">忌 · '+d.ji+'</div>'
      +(isCur?('<div class="dy-note">'+d.note+'</div>'):'')
      +'</div>';
  }).join('');
}
function renderLiunian(){
  const el=document.getElementById('liunianBox'); if(!el) return;
  const d=dingHuoNow();
  const sug=jieqiSuggest();
  el.innerHTML=
     '<div class="ln-head" style="border-color:'+d.c+'">'
      +'<div class="ln-jq"><b>'+d.jieqi+'</b><span>'+d.el+'行当令 · 丁火'+d.lv+'</span></div>'
      +'<div class="ln-next">距「'+d.next+'」还有 '+d.left+' 天</div>'
     +'</div>'
    +'<div class="ln-t">'+d.t+'</div>'
    +'<div class="ln-adv">'+d.adv+'</div>'
    +'<div class="ln-sh">当令宜做（点一下入随机任务库）</div>'
    +'<div class="ln-sug">'+sug.map(s=>'<button class="btn sm ghost" onclick="addJieqiIdea('+JSON.stringify(s.t).replace(/"/g,'&quot;')+',\''+s.x+'\')">'+s.t+'</button>').join('')+'</div>'
    +'<div class="hint">丁火日主喜金水（清凉流动）、忌火土过旺（燥烈壅塞）。节气为近似日期，误差 ±1 天。</div>';
}
let npcChatOpen=new Set();
function npcToggleChat(qid){ if(npcChatOpen.has(qid))npcChatOpen.delete(qid); else npcChatOpen.add(qid); var el=document.getElementById('qi_'+qid); if(el)el.classList.toggle('open-chat',npcChatOpen.has(qid)); var box=el?el.querySelector('.npc-chat'):null; if(box)box.style.display=npcChatOpen.has(qid)?'block':'none'; }
function npcSend(qid){
  var ta=document.getElementById('npcChat_'+qid); if(!ta)return; var v=(ta.value||'').trim(); if(!v)return;
  var q=S.npc.active.find(function(x){return x.id===qid;}); if(!q)return;
  if(!q.chat)q.chat=[];
  q.chat.push({who:'me',t:v,ts:new Date().toISOString().slice(0,16).replace('T',' ')});
  var reply=npcReply(q.npc,q,v);
  q.chat.push({who:'npc',t:reply,ts:new Date().toISOString().slice(0,16).replace('T',' ')});
  var rel=npcRel(q.npc); rel.know=(rel.know||0)+1; if(rel.know<=10) S.bonusXP=(S.bonusXP||0)+2;
  var nm=(NPCS.find(function(n){return n.id===q.npc;})||{}).n||'故人';
  addHist('💬 与'+nm+'聊了聊：'+v.slice(0,12)+(v.length>12?'…':''));
  save(); render();
}
function renderNpc(){
  const el=document.getElementById('npcBox'); if(!el) return;
  if(!S.npc.active.length){ el.innerHTML='<div class="dash-empty">本周江湖委托待刷新</div>'; return; }
  el.innerHTML=S.npc.active.map(q=>{
    const p=NPCS.find(n=>n.id===q.npc)||{n:'?',ic:'❓',d:''};
    const ri=npcRelInfo(p.id);
    const adv=nextAdvancedNpcEvent(p.id,ri.xp),marks=[6,10].map(lv=>S.npcEvents[p.id+'_'+lv]).filter(Boolean).map(x=>x.mark);
    const open=npcChatOpen.has(q.id);
    const mc=(q.chat?q.chat.filter(m=>m.who==='me').length:0);
    const msgs=(q.chat&&q.chat.length)?q.chat.map(m=>'<div class="npc-msg '+(m.who==='me'?'me':'npc')+'"><span class="npc-msg-who">'+(m.who==='me'?'我':escHtml(p.n))+'</span><span class="npc-msg-t">'+escHtml(m.t)+'</span></div>').join(''):'<div class="npc-chat-empty">点「💬 聊聊」，告诉他你练了什么、练得怎样——他记得越多，越懂你。</div>';
    return '<div class="npcq '+(q.done?'done':'')+(open?' open-chat':'')+'" id="qi_'+q.id+'">'
      +'<div class="npc-ic">'+p.ic+'</div>'
      +'<div class="npc-body"><div class="npc-n">'+p.n+' <span class="npc-d">'+p.d+'</span></div>'
      +'<div class="npc-t">「'+q.t+'」</div>'
      +(q.branch&&q.choice!=null?'<div class="npc-branch-chose">你选了：'+escHtml(q.choices[q.choice].t)+' · '+escHtml(q.choices[q.choice].d)+'</div>':'')
      +'<div class="npc-rel"><span class="npc-rel-lv">'+ri.name+' · '+ri.xp+(ri.know?' · 聊'+ri.know:'')+'</span><span class="npc-rel-bar"><i style="width:'+ri.pct+'%"></i></span></div>'
      +'<div class="npc-memory">'+npcMemory(p,ri)+'</div>'
      +(S.npcEvents[p.id]?'<span class="npc-event-done">🧿 '+NPC_EVENTS[p.id].relic.name+(marks.length?' · '+marks.join(' · '):'')+'</span>':(ri.xp>=3?'<div><button class="btn sm ghost npc-event-btn" onclick="openNpcEvent(\''+p.id+'\')">📜 专属事件 · 熟识</button></div>':''))
      +(adv?'<div><button class="btn sm ghost npc-event-btn" onclick="openAdvancedNpcEvent(\''+p.id+'\','+adv.lv+')">📖 '+(adv.lv===6?'知交':'莫逆')+'事件 · '+adv.e.title+'</button></div>':'')
      +'<div class="npc-chat"'+(open?'':' style="display:none"')+'>'
      +'<div class="npc-chat-msgs" id="npcMsgs_'+q.id+'">'+msgs+'</div>'
      +'<div class="npc-chat-compose"><textarea id="npcChat_'+q.id+'" rows="2" placeholder="比如：今天把《平沙落雁》第一段顺下来了，左手按弦还是疼…"></textarea><button class="btn sm primary" onclick="npcSend(\''+q.id+'\')">发送</button></div>'
      +'</div>'
      +'</div>'
      +'<div class="npc-r">'
      +(q.branch
          ? '<span class="npc-xp branch-tag">二选一</span>'+(q.choice!=null?'<button class="btn sm ghost" onclick="npcDone(\''+q.id+'\')">撤销</button>':'<button class="btn sm primary" onclick="npcDone(\''+q.id+'\')">选一下</button>')
          : '<span class="npc-xp">+'+q.xp+'</span>'+'<button class="btn sm '+(q.done?'ghost':'primary')+'" onclick="npcDone(\''+q.id+'\')">'+(q.done?'撤销':'交差')+'</button>')
      +'<button class="btn sm ghost" onclick="npcToggleChat(\''+q.id+'\')">💬 聊聊'+(mc?' '+mc:'')+'</button>'
      +'</div>'
      +'</div>';
  }).join('')
  + birthdayQuestRowsHtml()
  +(NPCS.every(p=>S.npcEvents[p.id])&&!S.npcEvents.joint_four?'<div class="npcq"><div class="npc-ic">🏮</div><div class="npc-body"><div class="npc-n">四方故人 · 联动事件</div><div class="npc-t">「雨夜里，四盏灯恰好照到了一张桌上。」</div></div><button class="btn sm primary" onclick="openJointNpcEvent()">赴约</button></div>':'')
  +'<div class="hint">每周一自动刷新江湖委托。交差会积累关系：初识 → 相识 → 熟识 → 知交 → 莫逆；撤销会同步回退。四人全清额外掉落一份嘉奖。</div>';
}
// 技能树已移除：升级打怪改为按复利轨道总时长点亮武侠境界
// 赛季称号已移除（与复利轨道 / 成就重复）
// 佩戴称号已移除（赛季模块停用）

// ===== v5.18 今日一句（名著 / 名言 / 影视 / 歌词 / 节气） =====
const QUOTES=[
 // —— 文学 · 中外交集 ——
 {t:'我深怕自己本非美玉，故而不敢加以刻苦琢磨；却又半信自己是块美玉，故又不肯庸庸碌碌，与瓦砾为伍。', s:'中岛敦《山月记》'},
 {t:'你为你的玫瑰花费的时间，使你的玫瑰变得重要。', s:'圣埃克苏佩里《小王子》'},
 {t:'所有的大人都曾经是小孩，虽然，只有少数的人记得。', s:'圣埃克苏佩里《小王子》'},
 {t:'对每个人而言，真正的职责只有一个：找到自我，然后在心中坚守一生。', s:'赫尔曼·黑塞《德米安》'},
 {t:'我唯一的事，是爱这个世界。', s:'赫尔曼·黑塞《悉达多》'},
 {t:'世界上只有一种真正的英雄主义，就是认清了生活的真相后，还依然热爱它。', s:'罗曼·罗兰'},
 {t:'其实地上本没有路，走的人多了，也便成了路。', s:'鲁迅《故乡》'},
 {t:'自由，就是被别人讨厌。', s:'岸见一郎 / 古贺史健《被讨厌的勇气》'},
 {t:'应当想象西西弗是幸福的。', s:'阿尔贝·加缪《西西弗神话》'},
 {t:'我必须画画，就像溺水的人必须挣扎。', s:'毛姆《月亮与六便士》'},
 {t:'每一个不曾起舞的日子，都是对生命的辜负。', s:'尼采'},
 {t:'凡杀不死我的，必使我更强大。', s:'尼采'},
 {t:'有何胜利可言？挺住意味着一切。', s:'里尔克《给青年诗人的信》'},
 {t:'未经审视的人生不值得过。', s:'苏格拉底'},
 {t:'我们重复做的事，决定了我们是怎样的人。', s:'亚里士多德（常引）'},
 {t:'有两种东西，我对它们的思考越是深沉，唤起的惊奇与敬畏就越日新月异：头上的星空，与心中的道德律。', s:'康德'},
 {t:'参差多态，乃是幸福的本源。', s:'罗素'},
 {t:'支配我一生的三种激情：对爱的渴望、对知识的追求、对人类苦难的同情。', s:'罗素'},
 {t:'做你自己，因为别人都有人做了。', s:'奥斯卡·王尔德'},
 {t:'我们都生活在阴沟里，但依然有人仰望星空。', s:'奥斯卡·王尔德'},
 {t:'一个人可以被毁灭，但不能被打败。', s:'海明威《老人与海》'},
 {t:'我步入丛林，因为我希望生活得有意义。', s:'梭罗《瓦尔登湖》'},
 {t:'一本书必须是一把能劈开内心冰封海洋的斧子。', s:'卡夫卡'},
 {t:'当你穿过了暴风雨，你就不再是原来那个人。', s:'村上春树'},
 {t:'哪里会有人喜欢孤独，不过是不喜欢失望罢了。', s:'村上春树《挪威的森林》'},
 {t:'删除我一生中的任何一个瞬间，我都不能成为今天的自己。', s:'芥川龙之介'},
 {t:'如果你想要批评任何人，请记住：不是所有人都拥有你那些优越条件。', s:'菲茨杰拉德《了不起的盖茨比》'},
 {t:'不必行色匆匆，不必光芒四射，不必成为别人，只需做自己。', s:'弗吉尼亚·伍尔夫'},
 {t:'理性的人使自己适应世界，非理性的人坚持让世界适应自己，因此一切进步都靠非理性的人。', s:'萧伯纳'},
 // —— 中国古典 ——
 {t:'鹏之徙于南冥也，水击三千里，抟扶摇而上者九万里。', s:'庄子《逍遥游》'},
 {t:'吾生也有涯，而知也无涯。', s:'庄子《养生主》'},
 {t:'上善若水，水善利万物而不争。', s:'老子《道德经》'},
 {t:'知人者智，自知者明。', s:'老子《道德经》'},
 {t:'行到水穷处，坐看云起时。', s:'王维'},
 {t:'众里寻他千百度，蓦然回首，那人却在，灯火阑珊处。', s:'辛弃疾'},
 {t:'会当凌绝顶，一览众山小。', s:'杜甫'},
 {t:'老骥伏枥，志在千里；烈士暮年，壮心不已。', s:'曹操《龟虽寿》'},
 {t:'路漫漫其修远兮，吾将上下而求索。', s:'屈原《离骚》'},
 {t:'古今之成大事业者，必经过三种之境界。', s:'王国维《人间词话》'},
 {t:'知行合一。', s:'王阳明'},
 {t:'结硬寨，打呆仗。', s:'曾国藩'},
 {t:'悟已往之不谏，知来者之可追。', s:'陶渊明《归去来兮辞》'},
 {t:'莫听穿林打叶声，何妨吟啸且徐行。竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。', s:'苏轼《定风波》'},
 {t:'长风破浪会有时，直挂云帆济沧海。', s:'李白《行路难》'},
 {t:'知者乐水，仁者乐山。', s:'《论语·雍也》'},
 {t:'志之所趋，无远弗届；穷山距海，不能限也。', s:'《格言联璧》'},
 // —— 影视 ——
 {t:'希望是好事，也许是人间至善，而美好的事物永不消逝。', s:'《肖申克的救赎》'},
 {t:'要么忙着活，要么忙着死。', s:'《肖申克的救赎》'},
 {t:'生活就像一盒巧克力，你永远不知道下一颗是什么味道。', s:'《阿甘正传》'},
 {t:'昨天是历史，明天是谜团，而今天……是礼物。', s:'《功夫熊猫》'},
 {t:'别让别人告诉你，你成不了才。如果你有梦想，就要去捍卫它。', s:'《当幸福来敲门》'},
 {t:'念念不忘，必有回响。', s:'《一代宗师》'},
 {t:'见自己，见天地，见众生。', s:'《一代宗师》'},
 {t:'愿你在被打击时记起你的珍贵，抵抗恶意；愿你在迷茫时坚信你的珍贵。', s:'《无问西东》'},
 {t:'这个世界缺的不是完美的人，而是从心底给出的真心、正义、无畏与同情。', s:'《无问西东》'},
 {t:'火花不是人生目标，当你想要生活的那一刻，火花就已经被点燃。', s:'《心灵奇旅》'},
 {t:'假如再也不能见到你，祝你早安、午安、晚安。', s:'《楚门的世界》'},
 {t:'及时采撷你的花蕾，旧时光一去不回。', s:'《死亡诗社》'},
 {t:'追求卓越，成功就会在不经意间追上你。', s:'《三傻大闹宝莱坞》'},
 {t:'不管你做什么，都要做到极致；上班就认真工作，笑就尽情大笑。', s:'《绿皮书》'},
 {t:'年龄从不是限制，热爱才是。', s:'《实习生》'},
 {t:'停止做梦，去生活吧。', s:'《白日梦想家》'},
 {t:'每个孩子都是坠落凡间的天使。', s:'《放牛班的春天》'},
 {t:'我不认同"还行"这种评价——要么卓越，要么重来。', s:'《爆裂鼓手》'},
 {t:'如果你赢了银牌，很快就会被遗忘；但如果你赢了金牌，你就会成为榜样。', s:'《摔跤吧！爸爸》'},
 {t:'我们笑着说再见，却深知再见遥遥无期。', s:'《海上钢琴师》'},
 // —— 歌词 · 中文 ——
 {t:'越过山丘，虽然已白了头；喋喋不休，时不我予的哀愁。', s:'李宗盛《山丘》'},
 {t:'还未如愿见着不朽，就把自己先搞丢。', s:'李宗盛《山丘》'},
 {t:'想得却不可得，你奈人生何。', s:'李宗盛《给自己的歌》'},
 {t:'你我皆凡人，生在人世间，终日奔波苦，一刻不得闲。', s:'李宗盛《凡人歌》'},
 {t:'我曾经跨过山和大海，也穿过人山人海；直到看见平凡，才是唯一的答案。', s:'朴树《平凡之路》'},
 {t:'逆风的方向，更适合飞翔。', s:'五月天《倔强》'},
 {t:'一杯敬自由，一杯敬死亡。', s:'毛不易《消愁》'},
 {t:'要拥有，必先懂失去怎接受。', s:'陈奕迅《富士山下》'},
 {t:'没有什么能够阻挡，你对自由的向往。', s:'许巍《蓝莲花》'},
 {t:'每当我找不到存在的意义，每当我迷失在黑夜里，夜空中最亮的星，请指引我靠近你。', s:'逃跑计划《夜空中最亮的星》'},
 {t:'我梦寐以求，是真爱和自由。', s:'郑钧《私奔》'},
 {t:'该吃吃，该喝喝，该工作的时候好好工作。', s:'郝云《活着》'},
 {t:'这一切没有想象的那么糟。', s:'万晓利《这一切没有想象的那么糟》'},
 {t:'一代人终将老去，但总有人正年轻。', s:'刺猬《火车驶向云外，梦安魂于九霄》'},
 // —— 歌词 · 英文 ——
 {t:'当你身处逆境，请记住：顺其自然，一切终将安好。', s:'The Beatles《Let It Be》'},
 {t:'伴随清晨的阳光，一切都会好起来。', s:'The Beatles《Here Comes The Sun》'},
 {t:'不要停止相信，坚持住这份感觉。', s:'Journey《Don\'t Stop Believin\'》'},
 {t:'重要的不是山顶，而是攀爬的过程。', s:'Miley Cyrus《The Climb》'},
 {t:'想象世上没有国界，也不分你我。', s:'John Lennon《Imagine》'},
 // —— 名言 · 现代 ——
 {t:'逻辑会把你从A带到B，想象力能带你去任何地方。', s:'爱因斯坦'},
 {t:'生活就像骑自行车，要保持平衡，就得不断前进。', s:'爱因斯坦'},
 {t:'你的时间有限，不要浪费在重复别人的生活上。', s:'史蒂夫·乔布斯'},
 {t:'求知若饥，虚心若愚。', s:'史蒂夫·乔布斯'},
 {t:'人生就像滚雪球，重要的是找到很湿的雪和很长的坡。', s:'沃伦·巴菲特'},
 {t:'要得到你想要的某样东西，最可靠的办法是让你自己配得上它。', s:'查理·芒格'},
 {t:'成功就是从失败到失败，也依然不改热情。', s:'丘吉尔'},
 {t:'我们唯一需要恐惧的，就是恐惧本身。', s:'富兰克林·罗斯福'},
 {t:'知识就是力量。', s:'培根'},
 {t:'早睡早起使人健康、富裕又聪明。', s:'富兰克林'},
 // —— 心理 · 成长 ——
 {t:'生命的意义，在于成为你自己。', s:'武志红'},
 {t:'改变不是靠意志力，而是靠创造新的经验。', s:'陈海贤《了不起的我》'},
 {t:'关注你的呼吸，它是你与身体、与当下唯一的锚。', s:'埃克哈特·托利《当下的力量》'},
 {t:'人是自己行动的结果，除此之外什么都不是。', s:'萨特'},
 // —— 节气专属（当令优先）——
 {t:'冬天来了，春天还会远吗？', s:'雪莱《西风颂》', j:['小寒','大寒','立春','雨水','惊蛰']},
 {t:'一年之计在于春，一日之计在于晨。', s:'《增广贤文》', j:['立春','雨水','惊蛰','春分','清明','谷雨']},
 {t:'死亡不是生命的终点，遗忘才是。', s:'《寻梦环游记》', j:['清明','寒露','霜降']},
 {t:'非淡泊无以明志，非宁静无以致远。', s:'诸葛亮《诫子书》', j:['立夏','小满','芒种','夏至','小暑','大暑']},
 {t:'春华秋实，一分耕耘一分收获。', s:'《后汉书》', j:['立秋','处暑','白露','秋分']},
 {t:'凡事豫则立，不豫则废。', s:'《礼记·中庸》', j:['小满','芒种','谷雨']},
 {t:'梅花香自苦寒来。', s:'《警世贤文》', j:['小雪','大雪','冬至']},
  {t:'海纳百川，有容乃大；壁立千仞，无欲则刚。', s:'林则徐', j:['立冬','小雪','大雪','冬至','小寒','大寒']},
];
// 名人小故事：按日与名言混排，主题围绕「善待自己 / 享受当下 / 自己的节奏 / 允许休息 / 慢慢来」。
// 目的：激励，让人更愿意好好对待自己和今天。
const SOUL_STORIES=[
 {kind:'story', tag:'慢慢来', s:'村上春树',
  t:'村上春树三十岁前只是个开爵士酒吧的年轻人。有一天看棒球赛，他忽然想：「我能不能写一本小说？」于是每晚打烊后，伏在厨房桌上写，一写就是半年。方向可以来得很晚，但只要今天比昨天多走一步，路会自己显形。'},
 {kind:'story', tag:'低谷里的光', s:'J.K.罗琳',
  t:'罗琳在离婚、领救济金、被十二家出版社拒绝的那些年里，常在咖啡馆里写一个小巫师的故事。她说，低谷不是终点，只是你还没走到故事好看的地方。请对自己温柔一点，你正在写的故事才刚开头。'},
 {kind:'story', tag:'画自己的光', s:'莫奈',
  t:'莫奈晚年患了白内障，视线越来越模糊，却仍天天支起画架画睡莲。他说：「我想在最困难的时候，画下最美的光。」即使世界在你眼里失了焦，你依然可以为自己留下一点明亮。'},
 {kind:'story', tag:'认真生活', s:'袁隆平',
  t:'袁隆平九十岁仍下田弯腰看稻子，也爱拉小提琴、游泳、逗孙子。他说研究是为了让人人吃饱，而生活本身也值得好好过。努力的人，也可以是个会玩的大孩子。'},
 {kind:'story', tag:'风雨里逍遥', s:'苏轼',
  t:'苏轼被贬到黄州，穷得自己开荒种地，却写出了「一蓑烟雨任平生」。他说，竹杖芒鞋轻胜马，谁怕？人生的雨来了就来了，撑着伞慢慢走，也能走出自己的潇洒。'},
 {kind:'story', tag:'热爱不退休', s:'宫崎骏',
  t:'宫崎骏七十多岁还在每天画图，说「不想画给孩子的，是谎言」。他说自己画了一辈子，是因为真的喜欢。你不必急着抵达哪里，喜欢的事本身，就是回来的理由。'},
 {kind:'story', tag:'善良是礼物', s:'奥黛丽·赫本',
  t:'赫本晚年放下光环，去做联合国儿童基金会的亲善大使，蹲在泥地里抱起饥饿的孩子。她说，人有两个名字，一个是父母取的，一个是自己活出来的。好好对待别人，也好好对待自己。'},
 {kind:'story', tag:'允许休息', s:'李娜',
  t:'李娜退役后第一次能安心吃一顿饭、睡一个整觉。她说，原来「什么都不做」也可以这么踏实。你不必时刻紧绷，休息不是偷懒，是把弦松一松，好让下一首曲子更准。'},
 {kind:'story', tag:'开始不晚', s:'塔莎·杜朵',
  t:'塔莎·杜朵五十岁才独自搬去乡下，自己盖木屋、种花草、养山羊，把日子过成了童话。她说，想做的事，什么时候开始都不算晚。今天，就是你去过想过的生活的最好时机。'},
 {kind:'story', tag:'内心安宁', s:'丰子恺',
  t:'丰子恺在战乱年月里，仍画着孩子的笑脸、檐下的猫、田埂的风。他说，不乱于心，不困于情，不畏将来，不念过往。把今天安顿好，世界就安静了一大半。'},
 {kind:'story', tag:'一人成光', s:'珍妮·古道尔',
  t:'珍妮·古道尔二十六岁只身去非洲丛林，研究黑猩猩，一待就是一辈子。她说，唯一能改变世界的，是少数不肯放弃的人。你一个人的坚持，可能正悄悄照亮某片角落。'},
 {kind:'story', tag:'不被定义', s:'王贞仪',
  t:'清代女子王贞仪，在「女子无才便是德」的年代，自学天文、数学、地理，写下一卷卷算稿。她说，足行万里，眼观八方。别让环境替你写结局，你的人生由你落笔。'},
];
// 确定性按日取一句：优先当令节气专属，否则按日期种子轮换；_qoff 为当日换一句偏移
let _qoff=0, _qLoaded=false;
function _loadQoff(){ try{ _qoff=parseInt(localStorage.getItem('qoff_'+todayStr())||'0',10)||0; }catch(e){ _qoff=0; } _qLoaded=true; }
function dailyQuote(off){
  const j=curJieqi();
  const themed=QUOTES.filter(q=>q.j && q.j.indexOf(j.name)>=0);
  const seed=[...todayStr()].reduce((a,c)=>a+c.charCodeAt(0),0);
  const o=off||0;
  const pool=QUOTES.concat(SOUL_STORIES); // 全库（含当令名言，抽到时自动带「当令」标）
  // 当令优先：仅当有多个当令可选时，才在当令池内按日期种子轮换（保证每日都变）
  if(themed.length>1 && o===0) return themed[seed % themed.length];
  // 否则在「全部名言 + 名人小故事」中按日期种子轮换，保证每日刷新
  return pool[(seed + o) % pool.length];
}
function renderQuote(){
  const el=document.getElementById('quoteBanner'); if(!el) return;
  if(!_qLoaded) _loadQoff();
  const q=dailyQuote(_qoff);
  const j=curJieqi();
  const isStory=(q.kind==='story');
  const tag=(!isStory && q.j && q.j.indexOf(j.name)>=0)?(' · 当令 '+j.name):'';
  const d=todayStr()||'';
  const pm=(d.length>=10)? d.slice(5).replace('-','·') : d;
  if(isStory){
    el.innerHTML='<div class="pc-inner pc-story">'
      +'<div class="pc-main">'
      +'<div class="pc-story-tag">✷ 今日小记 · '+(q.tag||'')+'</div>'
      +'<div class="pc-text pc-story-text">'+q.t+'</div>'
      +'<div class="pc-src">—— 关于 '+q.s+'</div>'
      +'</div>'
      +'<div class="pc-divider"></div>'
      +'<div class="pc-side"><div class="pc-postmark">'+pm+'</div>'
      +'<button class="pc-shuffle" onclick="shuffleQuote()">换一句 ›</button></div></div>';
  } else {
    el.innerHTML='<div class="pc-inner">'
      +'<div class="pc-main"><div class="pc-text">'+q.t+'</div><div class="pc-src">—— '+q.s+tag+'</div></div>'
      +'<div class="pc-divider"></div>'
      +'<div class="pc-side"><div class="pc-postmark">'+pm+'</div>'
      +'<button class="pc-shuffle" onclick="shuffleQuote()">换一句 ›</button></div></div>';
  }
}
function shuffleQuote(){ _qoff++; try{ localStorage.setItem('qoff_'+todayStr(), String(_qoff)); }catch(e){} renderQuote(); }

// ===== v5.19 互动版块：每日宜忌抽签 / 远方来信 / 江湖偶遇 / 成就羁绊 =====
// 复用同一套 NPC 阵容（林教头/沈掌柜/云娘/白鹭先生），让世界感连贯

// —— ② 每日宜忌抽签 ——
const YIJI=[
 {yi:'动脑',ji:'久坐',note:'给大脑一点新挑战，别黏在椅子上。'},
 {yi:'出出汗',ji:'熬到深夜',note:'动起来，今晚早点熄灯。'},
 {yi:'主动联系老友',ji:'独自硬扛',note:'一条消息，就能接住你自己。'},
 {yi:'深读一书',ji:'碎片刷屏',note:'放下手机，读完一章。'},
 {yi:'早睡',ji:'咖啡因续命',note:'今天的能量，从昨晚的觉开始。'},
 {yi:'把一件事做透',ji:'贪多并行',note:'少即是多，做完再开下一件。'},
 {yi:'对镜练一段琴',ji:'苛责手生',note:'不求好，求完整。'},
 {yi:'走出去晒太阳',ji:'闷在屋里',note:'丁火喜金水清凉，也需一点暖意。'},
 {yi:'写下今日三件小确幸',ji:'只盯不足',note:'看见拥有的，比盯着缺的更有力。'},
 {yi:'约一场球',ji:'久坐不动',note:'身体是你能直接掌控的领地。'},
 {yi:'复盘一段经历',ji:'反复懊悔',note:'复盘是为了往前，不是为了鞭尸。'},
 {yi:'给未来的自己写句话',ji:'焦虑未知',note:'把担心写下来，它就小了一圈。'},
 {yi:'慢炖一锅饭',ji:'敷衍肠胃',note:'好好吃饭，是最朴素的善待。'},
 {yi:'听一首老歌',ji:'比较他人',note:'你的节奏，不用和谁对齐。'},
 {yi:'闭眼静坐十分钟',ji:'信息过载',note:'留白，是为了更好的运转。'},
 {yi:'把烦恼说给风听',ji:'憋在心里',note:'说出来，风就替你扛了一半。'},
];
const YIJI_REST={yi:'休息',ji:'硬撑硬扛',note:'精力已透支，今天的事可以留到明天，先把人照顾好。'};
function drawRoll(){
  let st=''; try{ st=(energyState()||{}).state; }catch(_){}
  const pick=(st==='透支')?YIJI_REST:YIJI[Math.floor(Math.random()*YIJI.length)];
  S.draw={date:todayStr(), yi:pick.yi, ji:pick.ji, note:pick.note, claimed:false};
}
function drawClaim(){
  if(!S.draw||S.draw.date!==todayStr()||S.draw.claimed) return;
  S.bonusXP=(S.bonusXP||0)+20;
  addHist('✔【宜忌】承接今日气运 +20 XP', 20);
  try{ touchActivity(todayStr()); }catch(_){}
  celebrateTask('今日气运已承 ✦ +20');
  S.draw.claimed=true; save(); checkAch(); render();
}
function renderDraw(){
  const el=document.getElementById('drawBox'); if(!el) return;
  if(!S.draw||S.draw.date!==todayStr()) drawRoll();
  const d=S.draw;
  let h='<h2>🎴 今日宜忌 <span class="note">每日一签 · 承气运 +20</span></h2>';
  h+='<div class="yiji"><span class="yj yi">宜 · '+d.yi+'</span><span class="yj ji">忌 · '+d.ji+'</span></div>';
  h+='<div class="yiji-note">'+(d.note||'')+'</div>';
  h+= d.claimed? '<div class="yiji-done">✦ 今日气运已承</div>'
                : '<button class="btn sm" style="margin-top:8px" onclick="drawClaim()">承接今日气运 +20 XP</button>';
  el.innerHTML=h;
}

// —— ③ 远方来信 ——
const LETTERS_ORDER=['yunnan','xizang','chuanxi','guizhou','guangxi','hainan','xinjiang','japan','sweden','beijing'];
// 交错解锁序列：按地点轮流，避免某个地方（如云南）连发 9 封。
// 每项是 [place, idx]，idx 为该地点在 LETTERS[place] 中的下标。
const LETTER_SEQ=[
  ['yunnan',0],['xizang',0],['yunnan',1],['chuanxi',0],['yunnan',2],['guizhou',0],
  ['yunnan',3],['guangxi',0],['yunnan',4],['hainan',0],['yunnan',5],['xinjiang',0],
  ['yunnan',6],['japan',0],['yunnan',7],['sweden',0],['yunnan',8],['beijing',0],
  ['xizang',1],['chuanxi',1]
];
const LETTERS={
  yunnan:[
    {t:'昆明 · 第一封信', b:'这里的云是低的，低到像要落进翠湖里。你先前说想找个凉爽近水的地方，昆明八月不过二十多度，风一过就凉。我在滇池边坐了一下午，什么也没做，难得地，不觉得浪费。', task:{t:'给云南写一句你想对它说的话', xp:15}},
    {t:'大理 · 风的形状', b:'洱海的水是安静的蓝，苍山在背后沉默地绿着。古城里随便一家小院都种着花。你说不想一直在北京——这里的人不急，连卖花的老太太都慢。也许你可以先来住满一个月，看看是不是真的合。', task:{t:'列三个你最想在大理做的事', xp:15}},
    {t:'丽江 · 雪山与慢', b:'玉龙雪山远远白着，古城的溪水从脚边流过。夜里四方街有歌，有人弹吉他唱老歌。你喜水，这里处处是水。我替你把窗打开了，风进来，丁火也就凉了半分。', task:null},
    {t:'普洱 · 茶山的凉', b:'茶山一层层绿上去，雾常年在。这里海拔高，夏天不用空调，夜里要盖薄被。你喜凉，普洱的凉是浸在茶香里的，慢得理直气壮。我在一棵古茶树下坐了很久，什么也没想。', task:{t:'给自己泡一杯茶，认真喝完', xp:15}},
    {t:'腾冲 · 和顺与热海', b:'和顺的巷子静得能听见自己走路。热海的水烫，但高原的风是凉的，泡完不闷。火山、湿地、古籍，小城把历史和松弛都收着。你若想找个安静处住一阵，这里不错。', task:{t:'查一查腾冲的住处与气候', xp:15}},
    {t:'建水 · 慢城的底气', b:'古城没被游客挤变形。文庙、双龙桥、米轨小火车，慢得有底气。傍晚的烧烤摊烟火气足，老人们下棋不急。你说不想一直在北京——这里的人也不急。', task:{t:'写一句你对「慢城」的想象', xp:15}},
    {t:'抚仙湖 · 冷而透的水', b:'水清到能看见十几米下的石头，比洱海更静、更冷。你喜水，这里的水是透的、凉的，风一过就起细浪。我在湖边坐了一下午，难得地，不觉得浪费。', task:null},
    {t:'弥勒 · 红砖与林子', b:'东风韵的红砖房子像从地里长出来的外星建筑，太平湖的林子凉。小城把艺术和松弛揉在一起，红酒、温泉、湖，都不赶。你若想换个环境待几天，这里不吵。', task:{t:'列三个你理想小城该有的气质', xp:15}},
    {t:'西双版纳 · 湿热的另一面', b:'告庄的夜是热的，热带植物园的绿稠得化不开。你说过喜清凉不喜湿热，所以版纳不是长住的地方——但偶尔来看看这个「另一个云南」，也值得。热带的浓，是云南的另一张脸。', task:{t:'记一句你对版纳的感受（哪怕只是「太热」）', xp:15}},
  ],
  xizang:[
    {t:'拉萨 · 海拔之上', b:'这里的天蓝得不像话，经幡被风念了一整年。氧气薄，反而让人慢下来、只想好好呼吸。若你来，记得先缓几天，别跟身体较劲。', task:{t:'做一组深呼吸，想象自己在高原', xp:10}},
    {t:'拉萨 · 一盏酥油灯', b:'大昭寺前人人都平静。我点了一盏灯，替所有还在城市里硬撑的人。你也该有人替你点一盏。', task:null},
  ],
  chuanxi:[
    {t:'成都 · 慢的练习', b:'茶馆里一坐就是一下午，没人觉得你在虚度。你说怕虚无，可虚无的反面不是忙，是「愿意停」。成都教你停。', task:{t:'允许自己无所事事半小时', xp:10}},
    {t:'川西 · 雪山公路', b:'出城往西，山一下子高了。路边的牦牛比人悠闲。你若自驾走一趟，会明白什么叫「世界很大，我的愁很小」。', task:null},
  ],
  guizhou:[
    {t:'贵阳 · 爽爽的城', b:'「爽爽的贵阳」不是广告词，是体感。夏天不用空调，山风穿堂。你喜凉，这里是天然的。', task:{t:'查一查贵阳的住处与气候', xp:10}},
  ],
  guangxi:[
    {t:'桂林 · 山水之间', b:'从小课本里的山水，真到了才知道为什么叫甲天下。竹筏漂在漓江，时间像被水冲慢了。', task:null},
  ],
  hainan:[
    {t:'海口 · 海风来信', b:'冬天这里穿短袖，你若厌了北京的冷，可以来避。但你说喜清凉不喜湿热，所以海南只作备选——记着，别勉强自己待在不舒服的地方。', task:{t:'记下你理想气候的三个关键词', xp:10}},
  ],
  xinjiang:[
    {t:'乌鲁木齐 · 辽阔', b:'天山大得很，人在里头显得小，愁也小。烤肉和瓜果都实在。若你想远远地逃开人群，这里够远。', task:null},
  ],
  japan:[
    {t:'东京 · 烟火与秩序', b:'涩谷的人流像河，却从不乱。小酒馆里陌生人也能聊一夜。你若想看看另一种「认真生活」的样子，东京不错。', task:{t:'学一句想去国度的语言问候', xp:10}},
  ],
  sweden:[
    {t:'斯德哥尔摩 · 静谧', b:'夏天白夜长，太阳迟迟不落。森林湖边的小木屋，安静得能听见自己。你喜水，这里的湖多得数不清。', task:null},
  ],
  beijing:[
    {t:'北京 · 给现在的你', b:'你正身处其中，也许倦了。但那些球馆、琴房、老同事，都是你一点点攒下的据点。离开或留下都行，先别否定它们。', task:{t:'给北京写一句感谢或告别', xp:10}},
  ],
};
// 「远方回信」池：信库 20 封寄达后，从这里每天循环一封，让远方来信一直不断。
// 内容不绑定具体城市，是与你自身的回响，避免和 LETTERS 重复。
const LETTER_WELL=[
  {t:'回信 · 关于慢', b:'你总怕虚度，可虚度的反面不是忙，是愿意停。今天试着什么都不赶，让时间自己流。', task:{t:'允许自己无所事事半小时', xp:10}},
  {t:'回信 · 关于凉', b:'你喜凉。北京的八月闷，但你心里有云南的风。需要时把窗开着，想像自己在抚仙湖边。', task:null},
  {t:'回信 · 关于身体', b:'球馆、器械、汗出透——你用身体确认自己活着。今天也动一动，不为身材，为掌控感。', task:{t:'今天动一动身子（打球/健身/散步）', xp:10}},
  {t:'回信 · 关于琴', b:'琴房是你的避难所。哪怕只弹十分钟，指尖的旋律会替你清掉一天的杂。', task:{t:'今天碰一下琴，哪怕只一首', xp:10}},
  {t:'回信 · 关于远', b:'地图在你心里长。想去的地方不用一次走完，先让它们在心里抵达，脚步自然会跟上。', task:null},
  {t:'回信 · 关于自由', b:'你想要的从来不是逃离，是能自主的一天。把今天的一件小事，握回自己手里。', task:{t:'今天做一件完全由你决定的小事', xp:10}},
  {t:'回信 · 关于规律', b:'你靠规律活得不焦虑。今晚照常睡、照常起，节奏是你给自己的温柔。', task:{t:'今晚按时睡，给明天留节奏', xp:10}},
  {t:'回信 · 关于唱', b:'卡拉OK的均分是你和自己玩的方式。下次去，挑一首难一点的，不为分，为开心。', task:null},
  {t:'回信 · 关于怕普通', b:'你怕普通，可普通是把事做好的底色。今天做完一件小事，就算普通，也踏实。', task:{t:'今天认真做完一件小事', xp:10}},
  {t:'回信 · 关于云南', b:'你心里已经住了云南。不用立刻搬去，先让那股凉意在日常里留个缝。', task:null},
  {t:'回信 · 关于此刻', b:'你正处在一个过渡期。过渡不是停，是换轨道前的蓄力。信会一直陪你，直到你点亮那个愿望。', task:null},
  {t:'回信 · 关于人', b:'你需要的不是很多人，是一两个能托住你的人。今天给那样的人一句真的问候。', task:{t:'给一个在乎的人发句真的问候', xp:10}},
];
// 人生愿望是否「本次主动点亮」（历史已达成的不算，避免一开就停信）
function anyWishReached(){ return (S.wishes||[]).some(w=>w.un===true && !w.pre); }
// 首次运行把历史已点亮愿望标记为 pre（预设达成项），仅执行一次
function migrateWishesPre(){
  if(S._wishPreTagged) return;
  (S.wishes||[]).forEach(w=>{ if(w.un===true) w.pre=true; });
  S._wishPreTagged=true; save();
}
function letterPlaceName(l){
  if(l.place==='well') return '远方回信';
  return (TRAVEL_PLACES.find(p=>p.id===l.place)||{}).name||l.place;
}
function letterTotal(){ return LETTER_SEQ.length; }
function letterCheck(force){
  if(!S.letters) S.letters={unlocked:[],pointer:0,wellIdx:0};
  if(typeof S.letters.wellIdx!=='number') S.letters.wellIdx=0;
  migrateWishesPre();
  const list=S.letters.unlocked||[];
  // 人生愿望已点亮（非历史预设）→ 远方来信收束，不再寄新信
  if(anyWishReached()){ return; }
  const hasUnread=list.some(l=>!l.read);
  if(hasUnread && !force) return;
  // 先寄信库里的（交错去重，忽略回信池）
  const have=new Set(list.filter(l=>l.place!=='well').map(l=>l.place+'#'+l.idx));
  let idx=-1;
  for(let k=0;k<LETTER_SEQ.length;k++){ if(!have.has(LETTER_SEQ[k][0]+'#'+LETTER_SEQ[k][1])){ idx=k; break; } }
  if(idx>=0){
    const tgt=LETTER_SEQ[idx];
    const meta=LETTERS[tgt[0]][tgt[1]];
    if(meta){
      list.push({place:tgt[0], idx:tgt[1], read:false, date:todayStr(), title:meta.t, body:meta.b, task:meta.task?{...meta.task,done:false}:null});
      S.letters.pointer=idx+1;
      addHist('✉️ 远方来信：'+meta.t); save();
      return;
    }
  }
  // 信库寄完 → 从「远方回信」池继续，每天一封，直到人生愿望点亮
  const wm=LETTER_WELL[S.letters.wellIdx % LETTER_WELL.length];
  list.push({place:'well', idx:S.letters.wellIdx, read:false, date:todayStr(), title:wm.t, body:wm.b, task:wm.task?{...wm.task,done:false}:null});
  S.letters.wellIdx++;
  addHist('✉️ 远方来信：'+wm.t); save();
}
function letterUnread(){ return (S.letters.unlocked||[]).filter(l=>!l.read).length; }
function renderLetters(){
  const el=document.getElementById('letterBox'); if(!el) return;
  const list=S.letters.unlocked||[];
  let h='<h2>✉️ 远方来信 <span class="note">按你心里的地图，慢慢寄到</span>';
  const un=letterUnread(); if(un) h+=' <span class="badge-new">'+un+' 封未读</span>';
  h+='</h2>';
  if(!list.length){ h+='<div class="hint">还没有来信。信会按节奏慢慢寄到——先把北京安放好，远方自会抵达。</div>'; el.innerHTML=h; return; }
  h+='<div class="letter-list">';
  list.forEach((l,i)=>{
    const placeName=letterPlaceName(l);
    h+='<div class="letter-item'+(l.read?' read':'')+'" onclick="openLetter('+i+')">'
      +'<span class="lt">'+l.title+'</span><span class="lp">'+placeName+'</span>'
      +'<span class="ls">'+(l.read?'已读':'未读')+'</span></div>';
  });
  h+='</div>';
  if(anyWishReached()){
    h+='<div class="hint" style="margin-top:10px">🌟 你点亮了一个人生愿望，远方的信就此收束。地图与脚印会一直在，信箱留着你来时的路。</div>';
  }else{
    h+='<div class="hint" style="margin-top:10px">✉️ 远方来信会一直寄来，直到你点亮一个人生愿望。已寄达 '+list.length+' 封。</div>';
  }
  el.innerHTML=h;
}
function openLetter(i){
  const l=(S.letters.unlocked||[])[i]; if(!l) return;
  l.read=true; save(); renderLetters();
  const placeName=letterPlaceName(l);
  let body='<div class="letter-head">'+l.title+'</div><div class="letter-from">—— 寄自 '+placeName+'</div><div class="letter-body">'+l.body+'</div>';
  if(l.task){
    body+='<div class="letter-task">附：'+l.task.t+' <b>+'+l.task.xp+' XP</b></div>';
    body+= l.task.done? '<div class="letter-done">✦ 已回应</div>'
                      : '<button class="btn sm" style="margin-top:8px" onclick="respondLetter('+i+')">回应这封信（领取 +'+l.task.xp+' XP）</button>';
  }
  showModal('letterModal', body);
}
function respondLetter(i){
  const l=(S.letters.unlocked||[])[i]; if(!l||!l.task||l.task.done) return;
  l.task.done=true;
  S.bonusXP=(S.bonusXP||0)+l.task.xp;
  addHist('✔【来信】回应「'+l.title+'」 +'+l.task.xp+' XP', l.task.xp);
  try{ touchActivity(todayStr()); }catch(_){}
  celebrateTask('远方回响 ✦ +'+l.task.xp);
  save(); checkAch(); hideModal('letterModal'); render();
}

// ===== 灵宠（可交互猫角色，可多只） =====
// 数据在 S.pets[]；开屏问候 + 生日信 + 召唤 + 可编辑档案
function catToHumanAge(y){            // 兽医通用换算：第1年=15，第2年=25，之后每年+4
  y=Math.max(0,Math.floor(y||0));
  if(y<=0) return 0; if(y===1) return 15; if(y===2) return 25;
  return 25+(y-2)*4;
}
function petAgeInfo(p){
  p=p||(S.pets&&S.pets[0])||{}; const bd=p.birthday||'2021-02-24'; const ad=p.adopted;
  const today=new Date(todayStr()+'T00:00:00'); const b=new Date(bd+'T00:00:00');
  let ms=today-b; if(ms<0) ms=0;
  const daysTotal=Math.floor(ms/86400000);
  let y=today.getFullYear()-b.getFullYear();
  const m=today.getMonth()-b.getMonth();
  if(m<0 || (m===0 && today.getDate()<b.getDate())) y--;   // 按生日周年算整岁（当天满岁）
  const catYears=Math.max(0,y);
  let daysTogether=null;
  if(ad && ad.length>=10){ const a2=new Date(ad+'T00:00:00'); let ams=today-a2; if(ams<0) ams=0; daysTogether=Math.floor(ams/86400000); }
  const isBirthday=bd.slice(5)===todayStr().slice(5);
  return {catYears,humanYears:catToHumanAge(catYears),daysTotal,daysTogether,isBirthday,
    breed:p.breed,color:p.color,name:p.name,emoji:p.emoji||'🐱',personality:p.personality||[]};
}
function petNextBirthday(bd){
  if(!bd||bd.length<5) return '未知';
  const mmdd=bd.slice(5); const now=new Date(todayStr()+'T00:00:00'); const y=now.getFullYear();
  let d=new Date(y+'-'+mmdd+'T00:00:00');
  if(d<now) d=new Date((y+1)+'-'+mmdd+'T00:00:00');
  return mmdd+'（还有约 '+Math.ceil((d-now)/86400000)+' 天）';
}
const PET_LINES={
  greet:['铲屎官，今天辛苦啦，和你在一起好安心呀','喵～你回来啦，我一直在等你呢','蹭蹭你，今天也要开开心心的哦','你忙了一天，我给你呼噜呼噜解解压','土豆来啦，今天的你也很好很好','把头靠过来——蹭一下，充电完成'],
  task:['又完成一件！我就知道你最棒啦 🐾','看见你认真的样子，我也想蹭蹭你庆祝','又往前走了一步，乖，摸摸头','你做到啦，我要扑上来给你一个猫抱'],
  comfort:['累了就靠着我和猫一起发会儿呆吧','不想动也没关系，今天陪你瘫着','你不用一直坚强，在我这儿可以软下来','呼噜呼噜——听，这是给你的安心'],
  playful:['我要扑你的鼠标线啦——开玩笑的，蹭一下就好','今天的风很凉，适合窝在你腿上打盹','你打字我在旁边监工，顺便帮你暖手'],
};
function pickPetLine(kind){
  const arr=(PET_LINES[kind]&&PET_LINES[kind].length)?PET_LINES[kind]:PET_LINES.greet;
  return arr[Math.floor(Math.random()*arr.length)];
}
function showPetToast(line, p){
  const el=document.getElementById('petToast'); if(!el) return;
  p=p||(S.pets&&S.pets[0])||{};
  const f=el.querySelector('.pet-toast-face'), nm=el.querySelector('.pet-toast-name'), ln=el.querySelector('.pet-toast-line');
  if(f) f.textContent=p.emoji||'🐱'; if(nm) nm.textContent=p.name||'猫'; if(ln) ln.textContent=line;
  el.classList.add('show'); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'), 6500);
}
function summonPet(i){
  const pets=S.pets||[]; if(!pets.length) return;
  if(typeof i!=='number' || isNaN(i)) i=Math.floor(Math.random()*pets.length);
  const p=pets[i]||pets[0];
  const kind=Math.random()<0.5?'greet':(Math.random()<0.5?'playful':'comfort');
  showPetToast(pickPetLine(kind), p);
}
function summonPotato(){ summonPet(0); }   // 兼容旧调用（召唤土豆）
function petStageTxt(catYears){
  if(catYears>=1&&catYears<3) return '青少年猫，正调皮';
  if(catYears>=3&&catYears<7) return '壮年猫，稳重又黏人';
  if(catYears>=7&&catYears<11) return '中年猫，温柔沉静';
  if(catYears>=11) return '老猫，慢慢陪你';
  return '小猫咪';
}
function petBirthdayLetterText(p){
  p=p||(S.pets&&S.pets[0])||{}; const info=petAgeInfo(p); const bd=p.birthday||'2021-02-24';
  const dt=(info.daysTogether!=null)?info.daysTogether.toLocaleString('zh-CN'):'（还没记录接回家日）';
  return '亲爱的铲屎官：\n\n今年我 '+info.catYears+' 岁啦（猫咪 '+info.catYears+' 岁，相当于你们人类大约 '+info.humanYears+' 岁），'+petStageTxt(info.catYears)+'。\n\n从 '+bd+' 你把我接回家，到今天，我们已经一起度过了 '+dt+' 天。\n\n这段时间我过得很快乐——有你的腿可以趴，有你的手可以蹭，有你喊我「'+(p.name||'猫')+'」的声音可以等。\n\n下一个年岁，也要一直在一起哦。🐾\n\n—— '+(p.name||'猫');
}
function petBdayHtml(p){
  const t=petBirthdayLetterText(p);
  return '<div class="pet-bday-letter">'+escapeHtml(t).replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>')+'</p></div>';
}
function petCheck(){
  const pets=S.pets||[]; if(!pets.length) return;
  const t=todayStr();
  const notGreeted=pets.filter(function(p){ return p.lastGreet!==t; });   // 开屏问候：每天随机一只猫冒泡
  if(notGreeted.length && Math.random()<0.7){
    const p=notGreeted[Math.floor(Math.random()*notGreeted.length)];
    p.lastGreet=t;
    try{ showPetToast(pickPetLine('greet'), p); }catch(e){}
  }
  const yr=String(new Date(t+'T00:00:00').getFullYear());                 // 生日信：今天=某只猫生日且今年未展示
  pets.forEach(function(p){
    const info=petAgeInfo(p);
    if(info.isBirthday && yr!==String(p.birthdayShown||'')){
      p.birthdayShown=yr;
      try{ showModal('petBirthdayModal', '<div class="letter-head">🎂 '+(p.name||'猫')+' 的生日信</div>'+petBdayHtml(p)); }catch(e){}
      save();
    }
  });
}
function renderPet(){
  const el=document.getElementById('petBox'); if(!el) return;
  const pets=S.pets||[];
  if(!pets.length){ el.innerHTML='<div class="dash-empty">还没有灵宠。在「添加灵宠」里认识一只猫吧。</div>'; return; }
  let h='';
  pets.forEach(function(p,i){
    const info=petAgeInfo(p);
    const stageTxt=info.catYears>=3&&info.catYears<7?'壮年猫':(info.catYears>=7?'中年猫+':'小猫咪');
    h+='<div class="pet-panel">'
      +'<div class="pet-avatar">'+(p.emoji||'🐱')+'</div>'
      +'<div class="pet-id"><div class="pet-name">'+escapeHtml(p.name||'猫')+'</div>'
      +'<div class="pet-meta">'+escapeHtml(p.breed||'未知品种')+(p.color?' · '+escapeHtml(p.color):'')+'</div></div>'
      +'<button class="btn sm" onclick="summonPet('+i+')">召唤'+(p.name||'猫')+' 🐾</button></div>';
    h+='<div class="pet-stat">🎂 '+info.catYears+' 岁（人类≈'+info.humanYears+' 岁 · '+stageTxt+'） · 🤝 在一起 '+(info.daysTogether!=null?info.daysTogether:'—')+' 天</div>';
    if(info.isBirthday) h+='<div style="margin-top:8px">'+petBdayHtml(p)+'</div>';
    else h+='<div class="hint" style="margin-top:8px">'+(p.name||'猫')+' 的生日（'+petNextBirthday(p.birthday)+'）会收到她的一封信 💌</div>';
    h+='<details class="fold" style="margin-top:10px"><summary>✏️ 编辑'+(p.name||'猫')+'的资料</summary>'
      +'<div class="pet-edit">'
      +'<label>名字</label><input id="petName_'+i+'" value="'+escapeHtml(p.name||'')+'">'
      +'<label>生日</label><input id="petBday_'+i+'" type="date" value="'+escapeHtml(p.birthday||'')+'">'
      +'<label>接回家日</label><input id="petAdopt_'+i+'" type="date" value="'+escapeHtml(p.adopted||'')+'">'
      +'<label>品种</label><input id="petBreed_'+i+'" value="'+escapeHtml(p.breed||'')+'">'
      +'<label>毛色</label><input id="petColor_'+i+'" value="'+escapeHtml(p.color||'')+'">'
      +'<label>性格（逗号分隔）</label><input id="petPers_'+i+'" value="'+escapeHtml((p.personality||[]).join('，'))+'">'
      +'<label>想对'+(p.name||'猫')+'说的话 / 备注</label><textarea id="petNotes_'+i+'" rows="2">'+escapeHtml(p.notes||'')+'</textarea>'
      +'<button class="btn sm primary" onclick="savePetProfile('+i+')">保存资料</button>'
      +'</div></details>';
    h+='</div>';
  });
  el.innerHTML=h;
}
function savePetProfile(i){
  const p=(S.pets||[])[i]; if(!p) return;
  const g=id=>{ const e=document.getElementById(id); return e?e.value.trim():''; };
  p.name=g('petName_'+i)||'猫'; p.birthday=g('petBday_'+i)||'2021-02-24'; p.adopted=g('petAdopt_'+i)||'';
  p.breed=g('petBreed_'+i); p.color=g('petColor_'+i);
  const pers=g('petPers_'+i); p.personality=pers?pers.split(/[，,]/).map(s=>s.trim()).filter(Boolean):p.personality;
  p.notes=g('petNotes_'+i);
  save(); renderPet();
  try{ showPetToast('资料更新好啦，我还是最爱你的'+(p.name||'猫'), p); }catch(_){}
}

// ===== 重要日子 · 生日提醒 + 自动江湖委托 =====
const BIRTHDAY_LEAD_DAYS = 3;     // 生日提前 N 天来信通知 + 安排江湖委托
// 阴历→阳历换算表（1900-2100，标准 lunarInfo，来源 solarlunar）
const LUNAR_INFO=[0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252,0x0d520];
function lunarLeapMonth(y){ return LUNAR_INFO[y-1900]&0xf; }
function lunarLeapDays(y){ const lm=lunarLeapMonth(y); if(!lm) return 0; return (LUNAR_INFO[y-1900]&0x10000)?30:29; }
function lunarMonthDays(y,m){ return (LUNAR_INFO[y-1900]&(0x10000>>m))?30:29; }
function lunarYearDays(y){ let s=348; for(let i=0x8000;i>0x8;i>>=1) s+=(LUNAR_INFO[y-1900]&i)?1:0; return s+lunarLeapDays(y); }
function lunarToSolar(ly,lm,ld){
  let offset=0; for(let i=1900;i<ly;i++) offset+=lunarYearDays(i);
  for(let i=1;i<lm;i++) offset+=lunarMonthDays(ly,i);
  const lm2=lunarLeapMonth(ly);
  if(lm2>0 && lm2<lm) offset+=lunarLeapDays(ly);
  offset+=ld-1;
  const d=new Date(Date.UTC(1900,0,31)+offset*86400000);
  return {y:d.getUTCFullYear(),m:d.getUTCMonth()+1,d:d.getUTCDate()};
}

function birthdayEntities(){
  const arr=[];
  (S.pets||[]).forEach(function(p,idx){ arr.push({uid:'pet_'+idx,type:'pet',name:p.name||'猫',rel:'灵宠',date:(p.birthday||'').slice(5)||p.birthday,lunar:false,note:''}); });
  (S.birthdays||[]).forEach(function(b,idx){ arr.push({uid:'bd_'+idx,type:'person',name:b.name,rel:b.rel,date:b.date||'',lunar:!!b.lunar,note:b.note||''}); });
  return arr;
}
function nextOccurrence(e, nowStr){
  nowStr=nowStr||todayStr();
  const now=new Date(nowStr+'T00:00:00');
  if(e.lunar){
    const mm=parseInt(e.date.slice(0,2),10), dd=parseInt(e.date.slice(3,5),10);
    if(isNaN(mm)||isNaN(dd)) return {solar:'',daysLeft:9999,year:now.getFullYear(),label:e.date+'（阴历）'};
    let s=lunarToSolar(now.getFullYear(),mm,dd);
    let sd=new Date(s.y+'-'+(s.m<10?'0':'')+s.m+'-'+(s.d<10?'0':'')+s.d+'T00:00:00');
    if(sd<now){ const s2=lunarToSolar(now.getFullYear()+1,mm,dd); sd=new Date(s2.y+'-'+(s2.m<10?'0':'')+s2.m+'-'+(s2.d<10?'0':'')+s2.d+'T00:00:00'); s=s2; }
    const solar=(s.m<10?'0':'')+s.m+'-'+(s.d<10?'0':'')+s.d;
    return {solar:solar,year:s.y,daysLeft:Math.ceil((sd-now)/86400000),label:s.m+'月'+s.d+'日（阴历'+e.date+'）'};
  }
  const mmdd=e.date; if(!mmdd||mmdd.length<5) return {solar:'',daysLeft:9999,year:now.getFullYear(),label:e.date};
  const y=now.getFullYear();
  let d=new Date(y+'-'+mmdd+'T00:00:00');
  if(d<now) d=new Date((y+1)+'-'+mmdd+'T00:00:00');
  return {solar:mmdd,year:d.getFullYear(),daysLeft:Math.ceil((d-now)/86400000),label:mmdd.replace('-','月')+'日'};
}
function birthdayReminderText(e, occ){
  const who=e.name;
  const lead = occ.daysLeft===0 ? ('今天就是 '+who+' 的生日啦') : ('还有 '+occ.daysLeft+' 天就是 '+who+'（'+e.rel+'）的生日');
  const prep = e.note ? ('记得：'+e.note+'。') : '';
  if(e.type==='pet'){
    return '亲爱的铲屎官：\n\n'+lead+'（'+occ.label+'）。\n\n'+prep+'陪 '+(who)+' 多玩一会儿，给她最爱的罐头或冻干，拍张生日照留念吧——被你记挂着的猫，最幸福了。\n\n已为你备好一份生日江湖委托，去完成它，给她一个稳稳的生日。🐾';
  }
  return '亲爱的 Mochen：\n\n'+lead+'（'+occ.label+'）。\n\n'+prep+'重要的人，值得被认真地惦记。已为你备好一份生日江湖委托，去完成它，让这份心意落进日常里。💌';
}
function birthdayQuestTitle(e){
  if(e.type==='pet') return '🎂 给'+e.name+'过生日：备好罐头/冻干 + 拍张生日照';
  if(e.name==='我自己') return '🎂 给自己的生日：放半天假 + 写一句今年的愿望';
  if(e.rel==='父亲') return '🎂 给爸爸的生日：打个电话 / 发消息说声生日快乐';
  if(e.rel==='母亲') return '🎂 给妈妈的生日：做顿饭 / 买束花 / 视频通话';
  return '🎂 给'+e.name+'的生日：发一句祝福，约个见面';
}
function birthdayCheck(nowStr){
  nowStr=nowStr||todayStr();
  let created=0;
  birthdayEntities().forEach(function(e){
    const occ=nextOccurrence(e, nowStr);
    if(occ.daysLeft<0 || occ.daysLeft>BIRTHDAY_LEAD_DAYS) return;   // 仅临近窗口内（提前 N 天 ~ 当天）
    const key=e.uid+'#'+occ.year;
    const si=+e.uid.split('_')[1];
    const storeObj = e.type==='pet' ? (S.pets||[])[si] : (S.birthdays||[])[si];
    if(storeObj && storeObj.remindKey===key) return;                // 今年已提醒过
    if(storeObj) storeObj.remindKey=key;
    const id='bdr_'+e.uid+'_'+occ.year;
    (S.birthdayReminders=S.birthdayReminders||[]).push({id:id,forName:e.name,rel:e.rel,type:e.type,solarDate:occ.solar,daysLeft:occ.daysLeft,body:birthdayReminderText(e,occ),year:occ.year,read:false,questId:'bdq_'+e.uid+'_'+occ.year});
    const qid='bdq_'+e.uid+'_'+occ.year;
    const quests=S.birthdayQuests=S.birthdayQuests||[];
    if(!quests.some(function(q){return q.id===qid;})){
      quests.push({id:qid,icon:'🎂',forName:e.name,rel:e.rel,type:e.type,title:birthdayQuestTitle(e),a:'MIND',xp:(e.type==='pet'?25:(e.name==='我自己'?30:25)),due:occ.solar,done:false,year:occ.year,bdayLabel:occ.label});
    }
    created++;
  });
  if(created) save();
  return created;
}
function birthdayQuestRowsHtml(){
  const qs=(S.birthdayQuests||[]).filter(function(q){return !q.done;});
  if(!qs.length) return '';
  return '<div class="npcq bday-quest-head"><div class="npc-ic">🎂</div><div class="npc-body"><div class="npc-n">生日江湖委托</div><div class="npc-t">重要日子临近，为他们在江湖里留一份心意</div></div></div>'
    + qs.map(function(q){
      return '<div class="npcq bday-quest">'
        +'<div class="npc-ic">'+q.icon+'</div>'
        +'<div class="npc-body"><div class="npc-n">'+escapeHtml(q.forName)+' <span class="npc-d">'+(q.rel||'')+'</span></div>'
        +'<div class="npc-t">「'+escapeHtml(q.title)+'」</div>'
        +'<div class="npc-rel"><span class="jh-attr">🧠 心智</span><span class="jh-diff">'+jianghuStars(1)+'</span></div></div>'
        +'<div class="npc-r"><span class="npc-xp">+'+q.xp+'</span>'
        +'<button class="btn sm '+(q.done?'ghost':'primary')+'" onclick="birthdayQuestToggle(\''+q.id+'\')">'+(q.done?'撤销':'完成')+'</button></div>'
        +'</div>';
    }).join('');
}
function birthdayQuestToggle(id){
  const qs=S.birthdayQuests||[]; const q=qs.find(function(x){return x.id===id;}); if(!q) return;
  const a='MIND';
  if(!q.done){ q.done=true; grant(a,q.xp); addHist('✔【生日委托】'+q.title+' +'+q.xp+' XP',q.xp); save(); render(); try{ celebrateTask('🎂 '+q.title+' · +'+q.xp+' XP'); }catch(e){} }
  else { q.done=false; grant(a,q.xp,true); addHist('✘【生日委托】'+q.title,-q.xp); save(); render(); }
}
function renderBirthday(){
  const el=document.getElementById('birthdayBox'); if(!el) return;
  const ents=birthdayEntities();
  if(!ents.length){ el.innerHTML='<div class="dash-empty">还没有设置重要日子。</div>'; return; }
  const now=todayStr();
  // 按距离现在的时间升序（daysLeft 越小 = 越近）排列，时间越近的生日来信越靠前
  const items=ents.map(function(e){
    return { e:e, occ:nextOccurrence(e, now) };
  }).sort(function(a,b){ return a.occ.daysLeft - b.occ.daysLeft; });
  let anyUnread=false;
  let h='';
  items.forEach(function(it){
    const e=it.e;
    const occ=it.occ;
    const qid='bdq_'+e.uid+'_'+occ.year;
    const q=(S.birthdayQuests||[]).find(function(x){return x.id===qid;});
    const rem=(S.birthdayReminders||[]).find(function(x){return x.id==='bdr_'+e.uid+'_'+occ.year;});
    if(rem && !rem.read){ rem.read=true; anyUnread=true; }
    const cnt = occ.daysLeft===0?'🎉 今天！':('还有 '+occ.daysLeft+' 天');
    const icon = e.type==='pet'?'🐱':(e.rel==='自己'?'🎂':(e.rel==='父亲'?'👨':(e.rel==='母亲'?'👩':'💛')));
    const yrTag = occ.year>new Date(now+'T00:00:00').getFullYear() ? '（明年）' : '';
    let card='<div class="bday-card'+(occ.daysLeft<=BIRTHDAY_LEAD_DAYS?' soon':'')+'">'
      +'<div class="bday-ic">'+icon+'</div>'
      +'<div class="bday-main"><div class="bday-name">'+escapeHtml(e.name)+' <span class="bday-rel">'+escapeHtml(e.rel)+'</span></div>'
      +'<div class="bday-date">下一次生日：'+escapeHtml(occ.label)+yrTag+' · <b>'+cnt+'</b></div>';
    if(rem){
      card+='<div class="bday-letter">'+escapeHtml(rem.body).replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>')+'</p></div>';
    } else {
      card+='<div class="bday-letter muted">生日临近（提前 '+BIRTHDAY_LEAD_DAYS+' 天）时会自动寄来一封信，并为你安排一份生日江湖委托。</div>';
    }
    if(q){
      card+='<div class="bday-quest-row"><span>🎂 '+escapeHtml(q.title)+'</span>'
        +'<button class="btn xs '+(q.done?'ghost':'primary')+'" onclick="birthdayQuestToggle(\''+q.id+'\')">'+(q.done?'已完成 ✓':'完成 +'+q.xp)+'</button></div>';
    }
    card+='</div></div>';
    h+=card;
  });
  el.innerHTML=h;
  if(anyUnread){ try{ save(); }catch(e){} }
}

// —— ④ 江湖偶遇 ——
const ENCOUNTERS=[
  {id:'lin', who:'林教头', a:'BADMINTON', tex:'林教头在馆外拎着拍：「手感是练出来的。现在空场，来多打十个好球？」',
   opts:[{t:'现在多练10分钟基本功',xp:30,note:'羽道精进'},{t:'下次一定',xp:0}]},
  {id:'lin2', who:'林教头', a:'BADMINTON', tex:'林教头发来消息：「周末馆里缺个人，来打一场？」',
   opts:[{t:'答应，记到本周',xp:20,note:'应约赴局'},{t:'这周没空，改天',xp:0}]},
  {id:'shen', who:'沈掌柜', a:'CAREER', tex:'沈掌柜：「别光看岗位，去招聘 App 翻翻，闻闻气味。」',
   opts:[{t:'打开刷5分钟',xp:20,note:'业道有进'},{t:'先收着',xp:0}]},
  {id:'yun', who:'云娘', a:'BODY', tex:'云娘递来一杯温水：「你脸色不太好，先喝一口。」',
   opts:[{t:'起身喝一杯水',xp:15,note:'根基回血'},{t:'等会儿',xp:0}]},
  {id:'bailu', who:'白鹭先生', a:'MIND', tex:'白鹭先生在旧书铺弹琴，招手：「来，现在弹一段，不求好。」',
   opts:[{t:'现在弹10分钟琴',xp:20,note:'灵台澄明'},{t:'只听不弹',xp:0}]},
  {id:'old', who:'卖花老太太', a:null, tex:'路边卖花老太太，篮里几支蔫了却还香的花。',
   opts:[{t:'买一支插瓶',xp:10,note:'生活的小确幸'},{t:'匆匆走过',xp:0}]},
  {id:'tea', who:'茶摊老板', a:null, tex:'巷口茶摊老板给你续了杯：「看你总在赶路，坐下喝完这杯。」',
   opts:[{t:'坐下喝完这杯',xp:10,note:'留白片刻'},{t:'道谢带走',xp:0}]},
];
function encWeight(e){ let w=1; if(e.a){ try{ if((attrMinutesOn(todayStr())[e.a]||0)>0) w+=2; }catch(_){} } return w; }
function encounterRoll(auto){
  const pool=ENCOUNTERS.slice();
  const totalW=pool.reduce((s,e)=>s+encWeight(e),0);
  let r=Math.random()*totalW, pick=pool[0];
  for(const e of pool){ r-=encWeight(e); if(r<=0){ pick=e; break; } }
  S.enc.cur={eid:pick.id, who:pick.who, tex:pick.tex, opts:pick.opts.map(o=>({t:o.t,xp:o.xp||0,note:o.note||''}))};
  S.enc.seen=false;
  if(!auto) save();
}
function encPick(i){
  const cur=S.enc.cur; if(!cur) return;
  const o=cur.opts[i]; if(!o) return;
  if(o.xp){ S.bonusXP=(S.bonusXP||0)+o.xp; addHist('✔【偶遇】'+cur.who+'：'+o.t+' +'+o.xp+' XP', o.xp); try{ touchActivity(todayStr()); }catch(_){} celebrateTask(cur.who+'点了点头 ✦ +'+o.xp); }
  if(cur.eid==='lin2' && i===0){ (S.sideWeekly=S.sideWeekly||[]).push({id:id(),t:'应林教头之约 · 打一场球',cat:'探索',type:'weekly',xp:20,src:'enc',w:1,done:false,donedates:[],mins:{}}); addHist('🏸 已答应林教头，记到本周'); }
  (S.enc.done=S.enc.done||[]).push({eid:cur.eid,t:o.t,xp:o.xp||0,date:todayStr()});
  S.enc.cur=null; save(); checkAch(); render();
}
function renderEncounter(){
  const el=document.getElementById('encBox'); if(!el) return;
  let h='<h2>🪄 江湖偶遇 <span class="note">按你近日行迹，故人偶现 · 接了就去做</span></h2>';
  if(S.enc.cur){
    const c=S.enc.cur;
    h+='<div class="enc-who">'+c.who+'</div><div class="enc-tex">'+c.tex+'</div><div class="enc-opts">';
    c.opts.forEach((o,i)=>{ const act=o.xp?' btn-act':''; h+='<button class="btn sm'+act+'" onclick="encPick('+i+')">'+(o.xp?'🟢 ':'')+o.t+(o.xp?' <b>+'+o.xp+'</b>':'')+'</button>'; });
    h+='</div>';
  } else {
    const doneToday=(S.enc.done||[]).filter(x=>x.date===todayStr()).length;
    h+='<div class="hint">此刻江湖平静。'+(doneToday?('今日已接 '+doneToday+' 桩小事 ✅ 不错，去做了。'):'点击「探寻」，看今日会撞见哪位故人。')+'</div>';
    h+='<button class="btn sm" style="margin-top:8px" onclick="encounterRoll(false);save();render()">🪄 探寻江湖</button>';
  }
  el.innerHTML=h;
}

// —— ⑤ 故人 · 我们的链接（原「成就羁绊」改为关系视角） ——
let _blessOff=0;
function npcBlessingsOf(pid){ return (typeof NPC_BLESSINGS!=='undefined' && NPC_BLESSINGS[pid]) || []; }
function blessSeed(){
  const d=todayStr();
  let h=2166136261>>>0;
  for(let i=0;i<d.length;i++) h=Math.imul(h^d.charCodeAt(i),16777619)>>>0;
  h=Math.imul(h^(_blessOff+1),0x9E3779B1)>>>0;
  return h>>>0;
}
function todayBlessing(){
  const ids=NPCS.map(p=>p.id);
  const s=blessSeed();
  const pid=ids[s%ids.length];
  const arr=npcBlessingsOf(pid);
  const p=NPCS.find(x=>x.id===pid);
  const text=arr.length? arr[s%arr.length] : (p?p.d:'');
  return {pid, npc:p?p.n:'', ic:p?p.ic:'', text};
}
function nextBlessing(){ _blessOff=(_blessOff+1)%97; renderBonds(); }
function renderBonds(){
  const el=document.getElementById('bondBox'); if(!el) return;
  let h='<h2>🤝 故人 · 我们的链接 <span class="note">印象 · 好感度 · 一封来自他们的信</span></h2>';
  h+='<div class="rel-list">';
  NPCS.forEach(p=>{
    const ri=npcRelInfo(p.id);
    const mem=npcMemory(p,ri);
    const bar=ri.pct;
    const isTop=ri.level>=NPC_REL_STEPS.length-1;
    const nextName = isTop? '已至莫逆' : ri.next;
    const need = isTop? 0 : (NPC_REL_STEPS[ri.level+1].v-ri.xp);
    h+='<div class="rel-card" onclick="openRel(\''+p.id+'\')">'
      +'<div class="rel-ic">'+p.ic+'</div>'
      +'<div class="rel-body">'
      +'<div class="rel-h"><span class="rel-n">'+p.n+'</span><span class="rel-link">'+ri.name+'</span></div>'
      +'<div class="rel-mem">「'+mem+'」</div>'
      +'<div class="rel-bar"><i style="width:'+bar+'%"></i></div>'
      +'<div class="rel-fav">好感 '+ri.xp+' · 下一阶「'+nextName+'」还差 '+need+'</div>'
      +'</div></div>';
  });
  h+='</div>';
  const bl=todayBlessing();
  const isNew = S.bonds && S.bonds.blessRead!==todayStr();
  h+='<div class="rel-letter" id="relLetter">'
    +'<div class="rl-head">✉️ 今日一封信 · 来自 '+bl.ic+' '+bl.npc+'</div>'
    +'<div class="rl-body">'+bl.text+'</div>'
    +'<div class="rl-foot"><button class="btn sm ghost" onclick="nextBlessing()">换一封 ›</button>'
    +(isNew?'<span class="rl-new">· 新</span>':'')+'</div></div>';
  el.innerHTML=h;
}
function openRel(pid){
  const p=NPCS.find(n=>n.id===pid); if(!p) return;
  const ri=npcRelInfo(pid);
  const mem=npcMemory(p,ri);
  const st=NPC_REL_STEPS;
  const isTop=ri.level>=st.length-1;
  const nextName = isTop? ri.name : ri.next;
  const need = isTop? 0 : (st[ri.level+1].v-ri.xp);
  const arr=npcBlessingsOf(pid);
  let hsh=2166136261>>>0; const key=pid+ri.level;
  for(let i=0;i<key.length;i++) hsh=Math.imul(hsh^key.charCodeAt(i),16777619)>>>0;
  const letter = arr.length? arr[hsh%arr.length] : p.d;
  let body='<div class="rel-detail">'
    +'<div class="rd-head">'+p.ic+' '+p.n+' <span class="rd-link">'+ri.name+'</span></div>'
    +'<div class="rd-desc">'+p.d+'</div>'
    +'<div class="rd-sec"><b>他们对我的印象</b><div class="rd-mem">「'+mem+'」</div></div>'
    +'<div class="rd-sec"><b>好感度</b><div class="rd-bar"><i style="width:'+ri.pct+'%"></i></div><div class="rd-fav">'+ri.xp+' 点 · 距「'+nextName+'」还差 '+need+'</div></div>'
    +'<div class="rd-sec"><b>我们的链接</b><div class="rd-linktxt">'+relLinkText(ri.level)+'</div></div>'
    +'<div class="rd-sec"><b>一封来自 '+p.n+' 的信</b><div class="rd-letter">'+letter+'</div></div>'
    +'<div class="hint">完成本周江湖委托、触发专属事件，好感度会慢慢累积；关系越深，他们留给你的话也越不一样。</div>'
    +'</div>';
  showModal('bondModal', body);
}
function relLinkText(lv){
  if(lv>=4) return '你们已是莫逆。彼此不必多说，沉默也自在。';
  if(lv>=3) return '你已是他愿意托付心事的人。';
  if(lv>=2) return '熟了。他开始在建议你之前，先听你说完。';
  if(lv>=1) return '比初识近了些。他记得你肯做、也肯复盘。';
  return '才刚认识。多接几次他的江湖委托，关系会自己长出来。';
}

// ===== v5.43 旅行脚印（纯文字版，替代自绘世界地图） =====
let _tripWish=false,_tripEditId=null;
function tripStars(n){
  n=Math.max(0,Math.min(5,n|0));
  return '★'.repeat(n)+'☆'.repeat(5-n);
}
function tripEscape(s){return (s==null?'':String(s)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function tripSave(){
  if(!Array.isArray(S.trips)) S.trips=[];
  S.trips=S.trips.filter(t=>t&&t.name&&String(t.name).trim());
  save();
}
function renderTripsPage(){
  const el=document.getElementById('tripsPage'); if(!el) return;
  if(!Array.isArray(S.trips)) S.trips=[];
  const visited=S.trips.filter(t=>!t.wish).sort((a,b)=>(b.date||b.createdAt||'').localeCompare(a.date||a.createdAt||''));
  const wish=S.trips.filter(t=>!!t.wish);
  const total=S.trips.length;
  const cVis=visited.length, cWish=wish.length;
  const tab=(_tripWish?'wish':'vis');
  const html='<div class="trips-tabs">'
    +'<button class="ttab'+(tab==='vis'?'':' off')+'" onclick="tripSwitchTab(\'vis\')">📍 已去过 <span class="tn">'+cVis+'</span></button>'
    +'<button class="ttab'+(tab==='wish'?' off':'')+'" onclick="tripSwitchTab(\'wish\')">✈️ 想去 <span class="tn">'+cWish+'</span></button>'
    +'</div>'
    +tripFormHtml(_tripEditId)
    +(tab==='vis'?tripListHtml(visited,'vis'):tripListHtml(wish,'wish'))
    +'<div class="trips-foot">已记录 '+total+' 个脚印'+(_tripEditId?' <button class="btn xs ghost" onclick="tripCancelEdit()">取消编辑</button>':'')+'</div>';
  el.innerHTML=html;
}
function tripSwitchTab(t){ _tripWish=(t==='wish'); _tripEditId=null; renderTripsPage(); }
function tripFormHtml(id){
  const t=(id?S.trips.find(x=>x.id===id):null)||null;
  const wish=!t?!!_tripWish:!!t.wish;
  return '<div class="trip-form">'
    +'<div class="tf-head">'+(id?'✎ 编辑脚印':'✚ 记一笔新的脚印')+'</div>'
    +'<div class="tf-row">'
      +'<input id="tfName" class="tf-inp" placeholder="地点名（如 大理、冰岛、家门口公园）" value="'+tripEscape(t?t.name:'')+'" maxlength="40">'
      +'<input id="tfSub" class="tf-inp sub" placeholder="具体点（古城 / 老巷 / 苍山）" value="'+tripEscape(t?t.sub:'')+'" maxlength="40">'
    +'</div>'
    +'<div class="tf-row two">'
      +(wish
        ? '<span class="tf-hint">这一栏是你还「想去」的地方 🌱</span>'
        : '<label>到访日期 <input id="tfDate" type="text" placeholder="YYYY / YYYY-MM / YYYY-MM-DD" value="'+tripEscape(t?t.date||'':'')+'"></label>'
          +'<label>评分 <span id="tfStars" class="tf-stars">'+tripStars(t?(t.rating||0):0).split('').map((s,i)=>'<i data-n="'+(i+1)+'"'+(i<(t?(t.rating||0):0)?' class="on"':'')+'>'+s+'</i>').join('')+'</span></label>')
    +'</div>'
    +'<textarea id="tfRefl" class="tf-refl" rows="3" maxlength="400" placeholder="'+(wish?'想去的理由（风景 / 故事 / 心愿）…':'那次的感受 / 一句记忆 / 还想再去的理由…')+'">'+(t?tripEscape(t.refl||''):'')+'</textarea>'
    +'<div class="tf-foot">'
      +'<label class="tf-toggle"><input id="tfWish" type="checkbox" '+(wish?'checked':'')+' onchange="_tripWish=this.checked"> 还没去 · 标记为「想去」</label>'
      +(id?'<button class="btn xs ghost" onclick="tripDel(\''+id+'\')">删除</button>':'')
      +'<button class="btn sm primary" onclick="tripSubmit('+(id?'\''+id+'\'':'null')+')">'+(id?'更新':'写入')+'</button>'
    +'</div>'
    +'</div>';
}
function tripListHtml(list,kind){
  if(!list.length) return '<div class="trips-empty">'+(kind==='wish'?'还没有「想去」的地方——把心里挂着的城市写下来，让远方先在心里抵达。':'还没有到访记录。从下一段旅程开始，把脚步与感受留下。')+'</div>';
  return '<div class="trip-list">'+list.map(t=>{
    const date=t.date?t.date:(t.createdAt||'').slice(0,10);
    return '<div class="trip-card" onclick="tripEdit(\''+t.id+'\')">'
      +'<div class="tc-head"><span class="tc-name">'+tripEscape(t.name)+(t.sub?' <span class="tc-sub">'+tripEscape(t.sub)+'</span>':'')+'</span><span class="tc-date">📅 '+tripEscape(date||'—')+'</span></div>'
      +(t.rating?'<div class="tc-rating">'+tripStars(t.rating)+'</div>':'')
      +(t.refl?'<div class="tc-refl">'+tripEscape(t.refl)+'</div>':'')
    +'</div>';
  }).join('')+'</div>';
}
function tripSubmit(id){
  const nameEl=document.getElementById('tfName'); if(!nameEl) return;
  const name=nameEl.value.trim(); if(!name){ nameEl.focus(); nameEl.classList.add('shake'); setTimeout(()=>nameEl.classList.remove('shake'),420); return; }
  if(!Array.isArray(S.trips)) S.trips=[];
  const sub=(document.getElementById('tfSub')||{}).value||'';
  const refl=(document.getElementById('tfRefl')||{}).value||'';
  const wish=!document.getElementById('tfWish')?!!_tripWish:document.getElementById('tfWish').checked;
  let rating=0,date='';
  if(!wish){
    const starsEl=document.getElementById('tfStars');
    const onStars=starsEl?starsEl.querySelectorAll('i.on'):[];
    rating=onStars.length;
    date=((document.getElementById('tfDate')||{}).value||'').trim();
    if(!/^\d{4}(-\d{2}){0,2}$/.test(date)) date=todayStr();
  }
  if(id){
    const t=S.trips.find(x=>x.id===id);
    if(t){ t.name=name; t.sub=sub.trim(); t.refl=refl.trim(); t.wish=wish; t.rating=wish?0:rating; t.date=wish?'':date; }
    _tripEditId=null;
  }else{
    S.trips.push({id:'t_'+Date.now()+'_'+Math.floor(Math.random()*1e4),name,sub:sub.trim(),refl:refl.trim(),wish,rating:wish?0:rating,date:wish?'':date,createdAt:new Date().toISOString().slice(0,10)});
  }
  _tripWish=wish;
  tripSave();
  try{ touchActivity(todayStr()); }catch(_){}
  try{ addHist((wish?'✈️':'📍')+' 旅行脚印'+(wish?'想去':'去过')+' · '+name, 0, todayStr()); }catch(_){}
  try{ if(!wish&&yiTravelActive()){ S.bonusXP=(S.bonusXP||0)+20; addHist('✈️ 宜出行·承气运：旅行脚印「'+name+'」 +20 XP',20,todayStr()); } }catch(_){}
  try{ celebrateTask((wish?'想把远方写下来 — ':'一城一帧 — ')+name); }catch(_){}
  renderTripsPage(); render();
}
function tripEdit(id){ _tripEditId=id; const t=S.trips.find(x=>x.id===id); if(t) _tripWish=!!t.wish; renderTripsPage(); setTimeout(()=>{document.getElementById('tfName')?.focus();},30); }
function tripDel(id){
  const t=S.trips.find(x=>x.id===id); if(!t) return;
  if(!confirm('确定删除「'+t.name+'」？')) return;
  S.trips=S.trips.filter(x=>x.id!==id);
  if(_tripEditId===id) _tripEditId=null;
  tripSave(); renderTripsPage(); render();
}
function tripCancelEdit(){ _tripEditId=null; renderTripsPage(); }
document.addEventListener('click',function(e){
  const i=e.target.closest && e.target.closest('#tfStars i'); if(!i) return;
  const starsEl=document.getElementById('tfStars'); if(!starsEl) return;
  const n=parseInt(i.dataset.n||'0',10);
  [...starsEl.children].forEach((s,idx)=>{
    const on=idx<n;
    s.classList.toggle('on',on);
    s.textContent=on?'★':'☆';
  });
});

// —— 通知中心：仪表盘小喇叭 + 左侧导航红点 ——
function notifList(){
  const arr=[];
  if(S.enc && S.enc.cur && !S.enc.seen)
    arr.push({page:'dashboard', ic:'🪄', t:'江湖偶遇待回应', d:(S.enc.cur.who||'故人')+'在等你', key:'enc'});
  if(S.npc && S.npc.week && S.npc.week!==S.npc.seenWeek && S.npc.active && S.npc.active.length)
    arr.push({page:'action', st:'action', ic:'📜', t:'本周江湖委托已刷新', d:'四位故人各留一言 · 在今日行动页', key:'npc'});
  const lu=letterUnread();
  if(lu>0)
    arr.push({page:'map', ic:'✉️', t:lu+' 封远方来信未读', d:'点开看看', key:'letter'});
  // v5.45 嘉奖箱未兑换提醒
  const _unclaim=(S.rewards&&S.rewards.drops||[]).filter(d=>!d.claimed).length;
  if(_unclaim>0){
    arr.push({page:'growth', ic:'🎁', t:'嘉奖箱有 '+_unclaim+' 个未享用', d:'去翻翻看 · 点选「我享用啦」封存', key:'reward', scroll:'rewardList'});
  }
  // 我的揭榜：未完成的任务（逾期优先）进 dashboard 提示区
  try{
    const _mj=(S.myJianghu||[]).filter(function(e){return !e.done;});
    _mj.sort(function(a,b){ return (a.deadline<b.deadline?-1:1); });
    _mj.forEach(function(e){
      const _od=e.deadline<Date.now();
      arr.push({page:'action', tab:'my', ic:'🗡️', t:'揭榜待完成：'+e.t, d:(_od?'已逾期 · ':'截止 ')+fmtDeadline(e.deadline)+(_od?'（仍可完成）':''), key:'myjianghu', scroll:'myJianghuBox'});
    });
  }catch(e){}
  // 生日来信：临近窗口内未读的提醒进通知中心
  try{
    (S.birthdayReminders||[]).forEach(function(r){
      if(r.read) return;
      arr.push({page:'journey', ic:'💌', t:(r.forName||'')+' 的生日来信', d:(r.daysLeft===0?'今天！':('还有 '+r.daysLeft+' 天')+' · 已备好江湖委托'), key:'bday_'+r.id, scroll:'birthdayBox'});
    });
  }catch(e){}
  return arr;
}
function notifGo(el){
  const p=el.dataset.page, s=el.dataset.scroll, tab=el.dataset.tab, st=el.dataset.st;
  _isDeepLink=true;   // 深层链接期间不强制重置为第一个 tab，保留精准跳转
  try{
  // 先决定短期任务页内的顶层 tab（江湖榜子 tab 与 action 顶层 tab 分开处理）
  if(tab && typeof S==='object' && S){
    S.stTab='jianghu'; S.jhTab=tab;
  } else if(st && typeof S==='object' && S){
    S.stTab=st;
  }
  // 先切到目标页（滚动锚点可能在别的页面里）
  if(p && p!==getActivePage()){ showPage(p); }
  // v5.51.20 嘉奖箱已并入修行成长页【嘉奖箱】tab：掉落奖励后切到该页并展开嘉奖 tab
  if(s==='rewardList'){
    try{ if(typeof showPage==='function') showPage('growth'); }catch(e){}
    try{ if(typeof switchGrowthTab==='function') switchGrowthTab('rewards'); }catch(e){}
  }
  if(s){
    const t=document.getElementById(s);
    if(t){
      // 展开所有祖先 <details>，否则折叠区里的锚点不可见
      let n=t.parentElement;
      while(n){ if(n.tagName==='DETAILS' && !n.open) n.open=true; n=n.parentElement; }
      t.scrollIntoView({behavior:'smooth',block:'center'});
      t.classList.remove('pulse'); void t.offsetWidth; t.classList.add('pulse');
    }
  }
  if(tab && p==='action'){ try{ switchShortTaskTab('jianghu'); switchJianghuTab(tab); }catch(e){} }
  } finally {
    _isDeepLink=false;
  }
  return false;
}
function getActivePage(){
  const a=document.querySelector('.page.active'); return a?a.id.replace(/^page-/,''):null;
}
function renderNotifications(){
  const el=document.getElementById('notifBox'); if(!el) return;
  const list=notifList();
  if(!list.length){
    el.style.display='';
    el.innerHTML='<div class="notif-h">🔔 待你回应</div><div class="notif-empty">暂无待你回应的互动 ✨<br><small>完成江湖偶遇、查收远方来信后，这里会亮起提醒</small></div>';
    return;
  }
  el.style.display='';
  let h='<div class="notif-h">🔔 待你回应 <span class="notif-cnt">'+list.length+'</span></div><div class="notif-rows">';
  list.forEach(n=>{
    h+='<div class="notif-row" data-page="'+n.page+'" data-scroll="'+(n.scroll||'')+'" data-tab="'+(n.tab||'')+'" data-st="'+(n.st||'')+'" onclick="notifGo(this)">'
      +'<span class="notif-ic">'+n.ic+'</span>'
      +'<span class="notif-t">'+n.t+'</span>'
      +'<span class="notif-d">'+n.d+'</span>'
      +'<span class="notif-go">前往 ›</span></div>';
  });
  h+='</div>';
  el.innerHTML=h;
}
function navBadgeCount(page){
  if(page==='short'||page==='action'||page==='current'){
    let c=0;
    if(S.npc && S.npc.week && S.npc.week!==S.npc.seenWeek && S.npc.active && S.npc.active.length) c++;
    c += (S.myJianghu||[]).filter(function(e){return !e.done;}).length;
    return c;
  }
  if(page==='map') return letterUnread();
  if(page==='growth'){ if(!S.bonds) return 0; return S.bonds.blessRead!==todayStr()?1:0; }
  return 0;
}
function renderNavBadges(){
  ['short','map','growth'].forEach(p=>{
    const sp=document.getElementById('navBadge-'+p); if(!sp) return;
    const c=navBadgeCount(p);
    sp.textContent = c>0 ? (c>99?'99+':String(c)) : '';
    sp.style.display = c>0 ? 'inline-block' : 'none';
  });
  try{ renderShortTaskBadges(); }catch(e){}
}
function shortTaskBadgeData(){
  const hasNpc = !!(S.npc && S.npc.week && S.npc.week!==S.npc.seenWeek && S.npc.active && S.npc.active.length);
  const myUndone = (S.myJianghu||[]).filter(function(e){return !e.done;}).length;
  return {hasNpc:hasNpc?1:0, myUndone:myUndone, total:(hasNpc?1:0)+myUndone};
}
function renderShortTaskBadges(){
  const d=shortTaskBadgeData();
  const setBadge=function(id,n){
    const el=document.getElementById(id); if(!el) return;
    const show=n>0;
    el.textContent = show ? (n>99?'99+':String(n)) : '';
    el.style.display = show ? 'inline-block' : 'none';
  };
  setBadge('stBadge-action',0);
  setBadge('stBadge-jianghu',d.total);
  setBadge('stBadge-week',0);
  setBadge('jhBadge-npc',d.hasNpc);
  setBadge('jhBadge-day',0);
  setBadge('jhBadge-week',0);
  setBadge('jhBadge-month',0);
  setBadge('jhBadge-my',d.myUndone);
}
function markSideSeen(){
  let ch=false;
  if(S.enc && S.enc.cur && !S.enc.seen){ S.enc.seen=true; ch=true; }
  if(S.npc && S.npc.week && S.npc.seenWeek!==S.npc.week){ S.npc.seenWeek=S.npc.week; ch=true; }
  if(ch){ try{ save(); }catch(e){} }
}
function markBondsSeen(){
  if(!S.bonds) S.bonds={blessRead:''};
  S.bonds.blessRead=todayStr();
  try{ save(); }catch(e){}
}

// 成就羁绊已改为「故人 · 我们的链接」关系面板（见 renderBonds / openRel / todayBlessing）
// 通用模态
function showModal(id, html){
  const m=document.getElementById(id); if(!m) return;
  const c=m.querySelector('.modal-body'); if(c) c.innerHTML=html;
  m.style.display='flex';
}
function hideModal(id){ const m=document.getElementById(id); if(m) m.style.display='none'; }

/* ---------- v5.21 身体年龄 / 心理年龄系统 ---------- */
// 参考 Grow App 模型：基准年龄(实岁) ± 各因素加减 = 身体/心理年龄
// 数据来源：任务完成记录自动推导 + 可选手动录入健康指标
function chronoAge(){
  // 1995 年生，按当前日期算实岁
  const now=new Date(), born=new Date(1995,0,1);
  let age=now.getFullYear()-born.getFullYear();
  const m=now.getMonth()-born.getMonth();
  if(m<0 || (m===0 && now.getDate()<born.getDate())) age--;
  return Math.max(1,age);
}
// 近 N 天的任务完成情况（用于滚动窗口计算）
function recentDays(n){
  const out=[];
  for(let i=n-1;i>=0;i--) out.push(shiftDate(todayStr(),-i));
  return out;
}
// 按关键词匹配任务
function tasksMatching(keyword, days){
  let count=0, mins=0;
  days.forEach(d=>{
    allTaskLists().forEach(list=>list.forEach(x=>{
      if(!x.t||!x.t.includes(keyword)) return;
      if(Array.isArray(x.donedates)&&x.donedates.includes(d)){ count++; }
      if(x.mins&&x.mins[d]){ mins+=x.mins[d]; }
    }));
  });
  return {count,mins};
}
// —— 身体年龄因素定义 ——
const BODY_FACTORS=[
  {id:'strength', ic:'🏋️', n:'力量训练', d:'规律力量训练延缓肌肉流失',
   calc:(d)=>{ const r=tasksMatching('力量训练',d); return {val:-Math.min(0.6,r.count*0.2), detail:r.count+'次'}; }},
  {id:'cardio', ic:'🏸', n:'有氧运动', d:'羽毛球/跑步等心肺训练',
   calc:(d)=>{ const r=tasksMatching('羽毛球',d); const r2=tasksMatching('跑步',d);
     const c=r.count+r2.count; return {val:-Math.min(0.5,c*0.15), detail:c+'次'}; }},
  {id:'stretch', ic:'🧘', n:'拉伸恢复', d:'拉伸/康复理疗（每周限 1 次有效）',
   calc:(d)=>{ const r=tasksMatching('拉伸',d); const r2=tasksMatching('理疗',d);
     const c=Math.min(1,r.count+r2.count); return {val:-c*0.12, detail:c+'次'}; }},
  {id:'sleep', ic:'😴', n:'早睡习惯', d:'23:30 前睡觉',
   calc:(d)=>{ let c=0; d.forEach(dd=>{
     allTaskLists().forEach(list=>list.forEach(x=>{
       if(x.t&&x.t.includes('睡觉')&&Array.isArray(x.donedates)&&x.donedates.includes(dd)) c++;
     }));
   }); return {val:-c*0.08, detail:c+'/'+d.length+'夜'}; }},
  {id:'sedentary', ic:'🪑', n:'久坐惩罚', d:'当日无任何身体活动则 +0.15',
   calc:(d)=>{ let p=0; d.forEach(dd=>{
     const am=attrMinutesOn(dd);
     if((am.BODY||0)+(am.BADMINTON||0)<5) p+=0.15;
   }); return {val:p, detail:(p>0?Math.round(p/0.15)+"天无活动":"每日都有动")}; }},
  {id:'therapy', ic:'💆', n:'理疗/体检', d:'头疗/按摩/体检（一次性）',
   calc:(d)=>{ const r=tasksMatching('体检',d); const r2=tasksMatching('理疗',d); const r3=tasksMatching('头疗',d);
     const c=r.count+r2.count+r3.count; return {val:-c*0.2, detail:c+'次'}; }},
];
// —— 心理年龄因素定义 ——
const MIND_FACTORS=[
  {id:'creative', ic:'🎹', n:'精神充电', d:'弹琴/唱歌/阅读等创造性休息',
   calc:(d)=>{ let c=0; d.forEach(dd=>{
     allTaskLists().forEach(list=>list.forEach(x=>{
       if((x.a==='MIND')&&x.t&&!x.t.includes('职业')&&!x.t.includes('睡觉')
          &&Array.isArray(x.donedates)&&x.donedates.includes(dd)) c++;
     }));
   }); return {val:-Math.min(0.6,c*0.12), detail:c+'次'}; }},
  {id:'growth', ic:'📖', n:'成长行动', d:'职业学习/AI应用/读书等自我投资',
   calc:(d)=>{ const r=tasksMatching('职业',d); const r2=tasksMatching('学习',d); const r3=tasksMatching('读书',d);
     const c=r.count+r2.count+r3.count; return {val:-Math.min(0.4,c*0.08), detail:c+"次"}; }},
  {id:'streak', ic:'🔥', n:'连续修行', d:'灯火不熄 ≥3 天额外 -0.15',
   calc:(d)=>{ const s=computeStreak(); return {val:s>=3?-0.15:0, detail:s+'天连续'}; }},
  {id:'stress', ic:'😤', n:'压力预警', d:'职业任务大量未完成时 +0.2',
   calc:(d)=>{ let undone=0; (S.daily||[]).forEach(x=>{ if(x.a==='CAREER'&&!x.done) undone++; });
     const val=undone>=3?0.2:0; return {val, detail:undone>0?undone+'项未做':'状态平稳'}; }},
];
// 计算完整年龄数据
function computeBioAge(){
  const ca=chronoAge();
  const d=recentDays(7); // 滚动 7 日窗口
  const factors={};
  let bodyDelta=0, mindDelta=0;
  BODY_FACTORS.forEach(f=>{ const r=f.calc(d); factors[f.id]=Object.assign({ic:f.ic,n:f.n,d:f.d},r); bodyDelta+=r.val; });
  MIND_FACTORS.forEach(f=>{ const r=f.calc(d); factors['m_'+f.id]=Object.assign({ic:f.ic,n:f.n,d:f.d},r); mindDelta+=r.val; });
  // 手动健康数据微调
  if(S.bioAge.sleepHours!==null && S.bioAge.sleepHours<6) bodyDelta+=0.2; // 睡不够
  if(S.bioAge.sleepHours!==null && S.bioAge.sleepHours>=7.5) bodyDelta-=0.1; // 睡得好
  if(S.bioAge.restingHR!==null && S.bioAge.restingHR<=60) bodyDelta-=0.15; // 静息心率低
  if(S.bioAge.restingHR!==null && S.bioAge.restingHR>80) bodyDelta+=0.15; // 静息心率高
  const bodyAge=Math.round((ca+bodyDelta)*10)/10;
  const mentalAge=Math.round((ca+mindDelta)*10)/10;
  S.bioAge.lastCompute=todayStr(); S.bioAge.bodyAge=bodyAge; S.bioAge.mentalAge=mentalAge; S.bioAge.factors=factors;
  if(!S.bioAge.ageLog) S.bioAge.ageLog={}; S.bioAge.ageLog[todayStr()]={body:bodyAge,mental:mentalAge};
  return {chrono:ca,bodyAge,mentalAge,bodyDelta:Math.round(bodyDelta*10)/10,mindDelta:Math.round(mindDelta*10)/10,factors};
}
// 年龄段标签
function ageTag(age, chrono){
  const d=age-chrono;
  if(d<=-2) return '青春正盛';
  if(d<=-0.5) return '青春余波';
  if(d<0.5) return '稳中向好';
  if(d<=2) return '蓄势待发';
  return '需要关注';
}
// dashboard 生物年龄：仅汇总色块
function bioAgeSummaryHtml(b){
  const bt=b.bodyAge, mt=b.mentalAge, ct=b.chrono;
  const bTag=ageTag(bt,ct), mTag=ageTag(mt,ct);
  const bd=bt-ct, md=mt-ct;
  const bdCls=bd<=0?"ba-young":(bd>0?"ba-old":"");
  const mdCls=md<=0?"ba-young":(md>0?"ba-old":"");
  let h=`<div class="ba-header">`;
  h+=`<div class="ba-circle"><div class="ba-num">${bt.toFixed(1)}</div><div class="ba-label">身体年龄</div><div class="ba-tag">${bTag}</div></div>`;
  h+=`<div class="ba-circle ba-mind"><div class="ba-num">${mt.toFixed(1)}</div><div class="ba-label">心理年龄</div><div class="ba-tag">${mTag}</div></div>`;
  h+=`</div>`;
  h+=`<div class="ba-compare ${bdCls}">实岁 <b>${ct}</b> · 身体${bd>=0?"年长":"年轻"} <b>${Math.abs(bd).toFixed(1)}</b> 岁</div>`;
  h+=`<div class="ba-compare ${mdCls}">心理${md>=0?"年长":"年轻"} <b>${Math.abs(md).toFixed(1)}</b> 岁 · 更新于 ${todayStr()}</div>`;
  return h;
}
// 生物年龄详细因素（用于详情页）
function bioAgeFactorsHtml(b){
  let h=`<div class="ba-section"><div class="ba-stitle">\u{1FA9A} 身体影响因素 <span class="ba-note">近 7 日</span></div>`;
  BODY_FACTORS.forEach(f=>{ const v=b.factors[f.id]; if(!v)return;
    const cls=v.val<0?"ba-good":(v.val>0?"ba-bad":"");
    h+=`<div class="ba-row ${cls}"><span class="ba-ric">${v.ic}</span><span class="ba-rn">${v.n}</span><span class="ba-rv">${v.val>=0?"+":""}${v.val.toFixed(1)}岁</span><span class="ba-rd">${v.detail}</span></div>`;
  });
  if(S.bioAge.sleepHours!==null){ h+=`<div class="ba-row"><span class="ba-ric">\u{1F4A4}</span><span class="ba-rn">睡眠时长</span><span class="ba-rv">${S.bioAge.sleepHours<6?"+0.2":(S.bioAge.sleepHours>=7.5?"-0.1":"0")}岁</span><span class="ba-rd">${S.bioAge.sleepHours}h</span></div>`; }
  if(S.bioAge.restingHR!==null){ h+=`<div class="ba-row"><span class="ba-ric">\u2764\uFE0F</span><span class="ba-rn">静息心率</span><span class="ba-rv">${S.bioAge.restingHR<=60?"-0.15":(S.bioAge.restingHR>80?"+0.15":"0")}岁</span><span class="ba-rd">${S.bioAge.restingHR} bpm</span></div>`; }
  h+=`</div>`;
  h+=`<div class="ba-section"><div class="ba-stitle">\u{1F9E0} 心理影响因素 <span class="ba-note">近 7 日</span></div>`;
  MIND_FACTORS.forEach(f=>{ const v=b.factors["m_"+f.id]; if(!v)return;
    const cls=v.val<0?"ba-good":(v.val>0?"ba-bad":"");
    h+=`<div class="ba-row ${cls}"><span class="ba-ric">${v.ic}</span><span class="ba-rn">${v.n}</span><span class="ba-rv">${v.val>=0?"+":""}${v.val.toFixed(1)}岁</span><span class="ba-rd">${v.detail}</span></div>`;
  });
  h+=`</div>`;
  return h;
}
// 渲染仪表盘年龄卡片
function renderBioAge(){
  const el=document.getElementById('bioAgeBox'); if(!el) return;
  const b=computeBioAge();
  el.innerHTML=bioAgeSummaryHtml(b)
    +'<div class="ba-manual"><button class="btn sm ghost" onclick="showBioAgeInput()">\u270F\uFE0F 录入健康数据（睡眠/步数/心率）</button></div>';
}
// 健康数据录入弹窗
function showBioAgeInput(){
  const ba=S.bioAge;
  const html=`<div class="modal-body">`
    +`<h3 style="margin-top:0">\u270F\uFE0F 录入今日健康数据</h3>`
    +`<p class="hint" style="margin-bottom:12px">可选填，不填则仅从任务记录推导。数据仅本地存储。</p>`
    +`<label>睡眠时长（小时）</label>`
    +`<input type="number" id="bai_sleep" step="0.5" min="0" max="24" value="${ba.sleepHours!==null?ba.sleepHours:""}" placeholder="如 7.5">`
    +`<label>今日步数</label>`
    +`<input type="number" id="bai_steps" min="0" max="100000" value="${ba.steps!==null?ba.steps:""}" placeholder="如 8000">`
    +`<label>静息心率（bpm）</label>`
    +`<input type="number" id="bai_hr" min="30" max="200" value="${ba.restingHR!==null?ba.restingHR:""}" placeholder="如 62">`
    +`<div style="display:flex;gap:8px;margin-top:14px">`
    +`<button class="btn sm" onclick="saveBioAgeInput()">保存</button>`
    +`<button class="btn sm ghost" onclick="hideModal('bioAgeModal')">取消</button>`
    +`</div></div>`;
  showModal('bioAgeModal','录入健康数据',html);
}
function saveBioAgeInput(){
  const s=document.getElementById('bai_sleep'), st=document.getElementById('bai_steps'), hr=document.getElementById('bai_hr');
  if(s.value!=='') S.bioAge.sleepHours=parseFloat(s.value); else S.bioAge.sleepHours=null;
  if(st.value!=='') S.bioAge.steps=parseInt(st.value); else S.bioAge.steps=null;
  if(hr.value!=='') S.bioAge.restingHR=parseInt(hr.value); else S.bioAge.restingHR=null;
  if(S.bioAge.sleepHours!=null){ if(!S.bioAge.sleepLog) S.bioAge.sleepLog={}; S.bioAge.sleepLog[todayStr()]=S.bioAge.sleepHours; }
  try{ save(); }catch(e){}
  hideModal('bioAgeModal'); renderBioAge(); addHist('📊 更新了健康数据');
}

// init
// ===== v5.16 命理主题皮肤 / 趋势曲线 / 周报月报 =====

function applyTheme(){
  const k = S.theme||'light';
  if(k==='light' || !k) document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', k);
  ['light','bing','dark'].forEach(t=>{ const b=document.getElementById('theme-'+t); if(b) b.classList.toggle('cur', t===k); });
}
function setTheme(k){
  S.theme=k; applyTheme(); save();
}

// ---- 趋势曲线：每次保存 / 新的一天自动快照 ----
function recordTrend(){
  if(!S.trend) S.trend=[];
  const d=todayStr();
  const last=S.trend[S.trend.length-1];
  const e = (last && last.d===d) ? last : {d:d, xp:0, net:null, w:null};
  e.xp = overallXP();
  if(S.assets && S.assets.net!=null) e.net = S.assets.net;
  if(S.weight) e.w = S.weight;
  if(last!==e) S.trend.push(e);
  if(S.trend.length>400) S.trend = S.trend.slice(-400);
}
function trendSeries(key){ return (S.trend||[]).filter(e=>e[key]!=null).map(e=>({d:e.d,v:e[key]})); }
function sparkSVG(series, color){
  if(!series || series.length<2) return '<div class="hint" style="margin:14px 0;font-size:12px">数据不足（需至少 2 次记录）。每次保存/每日结算会自动留痕。</div>';
  const W=300,H=72,pad=6;
  const vals=series.map(s=>s.v);
  let min=Math.min.apply(null,vals), max=Math.max.apply(null,vals);
  if(min===max){ min-=1; max+=1; }
  const n=series.length;
  const X=i=> pad + i*(W-2*pad)/(n-1);
  const Y=v=> H-pad - (v-min)/(max-min)*(H-2*pad);
  const pts=series.map((s,i)=>X(i).toFixed(1)+','+Y(s.v).toFixed(1)).join(' ');
  const area=pad+','+(H-pad)+' '+pts+' '+(W-pad)+','+(H-pad);
  return '<svg viewBox="0 0 '+W+' '+H+'" width="100%" height="72" preserveAspectRatio="none" style="display:block">'
    +'<polygon points="'+area+'" fill="'+color+'" opacity="0.12"/>'
    +'<polyline points="'+pts+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
    +'<circle cx="'+X(n-1).toFixed(1)+'" cy="'+Y(vals[n-1]).toFixed(1)+'" r="3" fill="'+color+'"/></svg>';
}
function renderTrendCard(){
  const el=document.getElementById('dashTrend'); if(!el) return;
  const xp=trendSeries('xp'), net=trendSeries('net'), w=trendSeries('w');
  const lastXp = xp.length?xp[xp.length-1].v:0;
  const fmt=(v)=> v>=10000? (v/10000).toFixed(1)+'万' : Math.round(v).toLocaleString();
  el.innerHTML =
    '<div class="trend-grid">'
    +'<div class="trend-cell"><div class="trend-cap">加权经验（Lv.'+lvlOf(lastXp)+'）</div>'+sparkSVG(xp,'#3fa9bf')+'<div class="trend-val">'+fmt(lastXp)+'</div></div>'
    +'<div class="trend-cell"><div class="trend-cap">净资产</div>'+(net.length?sparkSVG(net,'#5bb6a6')+'<div class="trend-val">¥'+fmt(net[net.length-1].v)+'</div>':'<div class="hint" style="font-size:12px;margin:14px 0">去「⚙️ 数据&设置 → 💰 资产快照」录入后可见</div>')+'</div>'
    +'<div class="trend-cell"><div class="trend-cap">体重</div>'+(w.length?sparkSVG(w,'#7d9fc9')+'<div class="trend-val">'+w[w.length-1].v+' kg</div>':'<div class="hint" style="font-size:12px;margin:14px 0">去「⚖️ 身体指标」记录后可见</div>')+'</div>'
    +'</div>'
    +'<div class="hint">数据自动留痕（'+(S.trend?S.trend.length:0)+' 条快照）：每次保存或每日结算记一次。经验持续向上累积；净资产/体重随你录入变化。鼠标移到图上可看每日点位。</div>';
}
function saveWeight(){
  const inp=document.getElementById('weightInput'); if(!inp) return;
  const v=parseFloat(inp.value);
  if(isNaN(v)||v<=0){ alert('请输入有效体重（如 62.5）'); return; }
  S.weight=v; recordTrend(); save(); render();
}
function saveProfile(){
  const by=parseInt(document.getElementById('birthYear').value,10);
  const le=parseInt(document.getElementById('lifeExpect').value,10);
  if(isNaN(by)||by<1900||by>2100){ alert('出生年份请在 1900–2100 之间'); return; }
  if(isNaN(le)||le<=by){ alert('预期寿命需大于出生年份'); return; }
  S.profile.birthYear=by; S.profile.lifeExpect=le; save(); render();
  alert('已保存 · 仪表盘横幅已更新');
}
function fillProfileInputs(){
  const a=document.getElementById('birthYear'), b=document.getElementById('lifeExpect');
  if(a) a.value=S.profile.birthYear||1995;
  if(b) b.value=S.profile.lifeExpect||85;
}

// ---- 周报 / 月报 ----
function reportWindow(kind){
  const end=todayStr();
  const start = kind==='week' ? monday() : (thisMonth()+'-01');
  return {start,end};
}
function windowAttrMinutes(list, start, end){
  const hrs={BADMINTON:0,CAREER:0,BODY:0,MIND:0}; let count=0; const names=[];
  (list||[]).forEach(x=>{
    const ds=(x.donedates||[]).filter(d=>d>=start&&d<=end);
    if(ds.length){ count++; names.push(x.t);
      ds.forEach(d=>{ const m=(x.mins&&x.mins[d])||0; hrs[safeAttr(x.a)]+=m; });
    }
  });
  return {count,names,hrs};
}
function buildReport(kind, start, end){
  const daily=windowAttrMinutes(S.daily,start,end);
  const weekly=windowAttrMinutes(S.weekly,start,end);
  const sd=windowAttrMinutes(S.sideDaily,start,end);
  const sw=windowAttrMinutes(S.sideWeekly,start,end);
  const sm=windowAttrMinutes(S.sideMonthly,start,end);
  const jwDone=jianghuPeriodDone('week'), jmDone=jianghuPeriodDone('month');
  const hrs={BADMINTON:daily.hrs.BADMINTON+weekly.hrs.BADMINTON+sd.hrs.BADMINTON+sw.hrs.BADMINTON+sm.hrs.BADMINTON,
             CAREER:daily.hrs.CAREER+weekly.hrs.CAREER+sd.hrs.CAREER+sw.hrs.CAREER+sm.hrs.CAREER,
             BODY:daily.hrs.BODY+weekly.hrs.BODY+sd.hrs.BODY+sw.hrs.BODY+sm.hrs.BODY,
             MIND:daily.hrs.MIND+weekly.hrs.MIND+sd.hrs.MIND+sw.hrs.MIND+sm.hrs.MIND};
  const totalMin=Object.values(hrs).reduce((a,b)=>a+b,0);
  // 一次性步骤（月/年主线）按是否做过统计
  const monthDone=(S.month.items||[]).filter(x=>isDoneEver(x)).map(x=>x.t);
  const yearDoneList=(S.year||[]).filter(c=>!c.paused&&yearDone(S.year.indexOf(c))).map(c=>c.t);
  // 旅行：窗口内新到访
  const newVisits=[];
  for(const pid in (S.travel||{})){ const t=S.travel[pid]; if(t&&t.visited&&t.date>=start&&t.date<=end) newVisits.push(pid); }
  // 嘉奖掉落（ts 含时分，按日期部分比较，避免同日被排除）
  const drops=(S.rewards.drops||[]).filter(d=>d.ts&&d.ts.slice(0,10)>=start&&d.ts.slice(0,10)<=end).map(d=>{
    const r=(typeof REWARDS!=='undefined')?REWARDS.find(x=>x.id===d.rewardId):null;
    return (r?r.name:d.rewardId)+(d.tier?('（'+d.tier+'）'):'');
  });
  // 升级/突破
  const ups=(S.history||[]).filter(e=>e.ts&&e.ts.slice(0,10)>=start&&e.ts.slice(0,10)<=end&&/突破|升级/.test(e.text)).map(e=>e.text);
  const gxp=overallXP(), gL=lvlOf(gxp);
  const label=kind==='week'?'周':'月';
  const lines=[];
  lines.push('📊 '+(kind==='week'?'周报':'月报')+'（'+start+' ~ '+end+'）');
  lines.push('🔥 灯火不熄：'+computeStreak()+' 日');
  lines.push('⚔️ 完成行动：日常 '+daily.count+' · 江湖周榜 '+jwDone+' · 江湖月榜 '+jmDone+' · 轶事 '+(sd.count+sw.count+sm.count));
  lines.push('🧭 四系投入：'+Object.keys(ATTRS).map(k=>ATTRS[k].name+' '+(hrs[k]/60).toFixed(1)+'h').join(' · ')+'（合计 '+(totalMin/60).toFixed(1)+'h）');
  if(monthDone.length) lines.push('🌕 本月主线推进：'+monthDone.join('、'));
  if(yearDoneList.length) lines.push('🗺️ 今年大道完成：'+yearDoneList.join('、'));
  if(newVisits.length) lines.push('🌍 新到访：'+newVisits.join('、'));
  if(drops.length) lines.push('🛡️ 嘉奖掉落：'+drops.join(' · '));
  if(ups.length) lines.push('⭐ 突破：'+ups.join('；'));
  lines.push('📈 当前 Lv.'+gL+'（加权经验 '+Math.round(gxp)+'）');
  lines.push('💡 一句话：这'+(kind==='week'?'周':'月')+'把节奏稳住，'+ (totalMin>0?'有在持续投入。':'可以再往前推一步。'));
  // —— 结构化可读卡片（屏幕展示用，与上方纯文本推送内容同源）——
  const attrRows=Object.keys(ATTRS).map(k=>{
    const h=(hrs[k]/60); const pct= totalMin>0? Math.round(h/(totalMin/60)*100):0;
    return '<div class="rep-attr"><span class="rep-attr-n">'+ATTRS[k].icon+' '+ATTRS[k].name+'</span>'
      +'<span class="rep-attr-v">'+h.toFixed(1)+'h</span>'
      +'<span class="rep-attr-bar"><i style="width:'+pct+'%"></i></span></div>';
  }).join('');
  const hi=[];
  if(monthDone.length) hi.push(['🌕 本月主线推进', monthDone.join('、')]);
  if(yearDoneList.length) hi.push(['🗺️ 今年大道完成', yearDoneList.join('、')]);
  if(newVisits.length) hi.push(['🌍 新到访', newVisits.join('、')]);
  if(drops.length) hi.push(['🛡️ 嘉奖掉落', drops.join(' · ')]);
  if(ups.length) hi.push(['⭐ 突破', ups.join('；')]);
  const hiHtml=hi.length? '<div class="rep-hi">'+hi.map(x=>'<div class="rep-hi-row"><span class="rep-hi-k">'+x[0]+'</span><span class="rep-hi-v">'+x[1]+'</span></div>').join('')+'</div>' : '';
  const html='<div class="rep-card">'
    +'<div class="rep-top"><span class="rep-title">'+(kind==='week'?'📅 本周报':'🌕 本月报')+'</span><span class="rep-range">'+start+' ~ '+end+'</span></div>'
    +'<div class="rep-stats">'
      +'<div class="rep-stat"><b>'+computeStreak()+'</b><span>🔥 灯火不熄 · 日</span></div>'
      +'<div class="rep-stat"><b>'+daily.count+'</b><span>⚔️ 日常完成</span></div>'
      +'<div class="rep-stat"><b>'+jwDone+'</b><span>🗡️ 周榜完成</span></div>'
      +'<div class="rep-stat"><b>'+jmDone+'</b><span>🗡️ 月榜完成</span></div>'
      +'<div class="rep-stat"><b>'+(sd.count+sw.count+sm.count)+'</b><span>📜 轶事</span></div>'
      +'<div class="rep-stat"><b>Lv.'+gL+'</b><span>📈 当前等级</span></div>'
    +'</div>'
    +'<div class="rep-secs"><span class="rep-secs-t">🧭 四系投入（合计 '+(totalMin/60).toFixed(1)+'h）</span>'+attrRows+'</div>'
    +hiHtml
    +'<div class="rep-tip">💡 这'+label+'把节奏稳住，'+(totalMin>0?'有在持续投入。':'可以再往前推一步。')+'</div>'
    +'</div>';
  return { title:(kind==='week'?'周报':'月报')+' · Lv.'+gL, text:lines.join('\n'), html };
}
function pushText(title, content){
  let token=S.pushToken || prompt('输入 pushplus token（一次填入即记住）：');
  if(!token) return;
  S.pushToken=token; save();
  const url='https://www.pushplus.plus/send?token='+encodeURIComponent(token)+'&title='+encodeURIComponent(title)+'&content='+encodeURIComponent(content);
  fetch(url).then(r=>r.json()).then(j=>{ addHist('推送'+title+'到微信'); alert(j&&j.code===200?'已推送到微信 ✅':'推送失败：'+(j&&j.msg||'未知错误')); }).catch(e=>alert('推送出错（检查网络/token）：'+e.message));
}
function genReport(kind, push){
  const {start,end}=reportWindow(kind);
  const rep=buildReport(kind,start,end);
  // 写入各自专属区域（周/月互不覆盖）
  const box=document.getElementById(kind==='week'?'reportWeek':'reportMonth');
  if(box){ box.style.display='block'; box.innerHTML=rep.html; }
  // 历史留痕（周月分开、各留最近 12 条）
  S.reports = S.reports||[];
  S.reports.unshift({kind, ts:new Date().toISOString().slice(0,16).replace('T',' '), title:rep.title, html:rep.html, text:rep.text});
  const cap=12; if(S.reports.length>cap) S.reports.length=cap;
  try{ save(); }catch(e){}
  renderReportHistory();
  if(push) pushText(rep.title, rep.text);
}
function renderReportHistory(){
  const el=document.getElementById('reportHist'); if(!el) return;
  const list=(S.reports||[]).slice(0,12);
  if(!list.length){ el.innerHTML='<div class="hint">还没有生成过报告。点上方按钮生成，会自动留痕在这里，周/月分开记录。</div>'; return; }
  const items=list.map((r,i)=>{
    const ic=r.kind==='week'?'📅':'🌕';
    return '<div class="rep-hist-item" onclick="showReport('+i+')">'
      +'<span class="rep-hist-ic">'+ic+'</span>'
      +'<span class="rep-hist-t">'+r.title+'</span>'
      +'<span class="rep-hist-ts">'+r.ts+'</span></div>';
  }).join('');
  el.innerHTML='<div class="rep-hist-h">🕘 历史记录（点击重看 · 周月分开）</div><div class="rep-hist-list">'+items+'</div>';
}
function showReport(i){
  const r=(S.reports||[])[i]; if(!r) return;
  const box=document.getElementById(r.kind==='week'?'reportWeek':'reportMonth');
  if(box){ box.style.display='block'; box.innerHTML=r.html; }
  const hEl=document.getElementById('reportHist'); if(hEl) hEl.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// v5.31 详情页信息架构：每项能力只保留一个可见归属，移动 DOM 不改动任何存档数据。
function reorganizeDetailPages(){
  const page=id=>document.getElementById('page-'+id);
  const panels=id=>Array.from((page(id)||document).querySelectorAll(':scope > .panel'));
  const byTitle=(id, keyword)=>panels(id).find(el=>{
    const h=el.querySelector('h2');
    return h && h.textContent.includes(keyword);
  });
  const move=(from, keyword, to, beforeKeyword)=>{
    const el=byTitle(from,keyword), target=page(to);
    if(!el || !target) return;
    const before=beforeKeyword ? byTitle(to,beforeKeyword) : null;
    target.insertBefore(el,before || null);
  };
  const merge=(id, primaryKeyword, secondaryKeyword)=>{
    const primary=byTitle(id,primaryKeyword), secondary=byTitle(id,secondaryKeyword);
    if(!primary || !secondary || primary===secondary) return;
    Array.from(secondary.children).forEach(child=>{
      if(child.tagName!=='H2') primary.appendChild(child);
    });
    secondary.remove();
  };
  const setHead=(id,title,sub)=>{
    const head=(page(id)||{}).querySelector?.(':scope > .phead');
    if(head) head.innerHTML=title+'<span class="psub">'+sub+'</span>';
  };
  const detailGroup=(targetId,title,subtitle,nodes,open=false)=>{
    const target=page(targetId);
    const valid=nodes.filter(Boolean);
    if(!target || !valid.length) return;
    const details=document.createElement('details');
    details.className='panel ia-detail-group';
    details.open=open;
    const summary=document.createElement('summary');
    summary.innerHTML='<span>'+title+'</span><small>'+subtitle+'</small>';
    details.appendChild(summary);
    const body=document.createElement('div');
    body.className='ia-detail-body';
    valid.forEach(node=>body.appendChild(node));
    details.appendChild(body);
    target.appendChild(details);
  };

  // 高频信息在前；设置、录入和内容管理沉到底部或归入设置页。
  move('data','身体指标','energy');
  move('data','资产快照','ledger','每日搬砖打卡');
  move('action','羽毛球专精','growth','修行卷册');
    move('action','任务生成器','data','补充灵感');
  move('journey','角色档案','journey','丁火流年');
  merge('journey','丁火流年','命格 · 丁火流年');
  move('journey','修为说明','growth','修行卷册');
  move('journey','长期目标','longterm');

  const monthly=byTitle('action','月行大计');
  const monthlyTitle=monthly&&monthly.querySelector('h2');
  if(monthlyTitle) monthlyTitle.innerHTML='🌙 月度挑战 <span class="note">每月 1 日刷新 · 区别于长期主线</span>';

  // 低频独立页合并：保留完整功能和数据，只减少导航与页面切换。
  const xp=document.querySelector('#page-loot > .xp-ledger');
  if(xp){
    const growthFirst=page('growth')?.querySelector(':scope > .panel');
    growthFirst?.insertAdjacentElement('afterend',xp);
  }
  // 技能树已移除：升级打怪改为按复利轨道总时长点亮武侠境界
  // v5.51.20 嘉奖箱已并入修行成长页【嘉奖箱】tab；装备库功能移除（角色设定的故人信物已承载故事收藏诉求）
  move('loot','故人信物','journey');
  detailGroup('journey','🗺️ 人生足迹','旅行地图、目标与远方来信',[
    document.querySelector('#page-map > .lifemap')
  ]);

  const fate=byTitle('journey','丁火流年');
  const fortune=byTitle('journey','人生大运时间轴');
  if(fate || fortune){
    const profile=byTitle('journey','角色档案');
    const marker=document.createElement('div');
    profile?.insertAdjacentElement('afterend',marker);
    detailGroup('journey','🔮 命理与大运','默认收起 · 需要参考时展开',[fate,fortune]);
    const group=page('journey')?.lastElementChild;
    if(marker.parentNode && group) marker.replaceWith(group);
  }

  setupUsageTracking();
  setupLifeCompoundUI();
  try{ switchGrowthTab('compound'); }catch(e){ console.warn('init growth tab',e); }

  setHead('energy','精力 · 恢复','今日状态优先 · 身体指标 · 趋势放后');
  setHead('ledger','钱庄 · 金币人生','目标与资产优先 · 记录与分析随后');
  setHead('journey','角色设定','角色档案 · 命格历程 · 时间轴设置');
  setHead('action','短期任务','今日行动 · 江湖榜 · 周期揭榜');
  setHead('growth','修行 · 成长','等级与专精优先 · 成就愿望随后');
  setHead('data','设置与内容管理','存档与反馈 · 通知 · 随机内容库');
}

// 长期复利轨道 = 唯一累计时长真源。覆盖所有需要长期复利的维度；
// reading 用真实历史基数 182h（不虚构拆分自「精神享受」）；身体/职业/生涯教练沿用 S.goals 真实基数。
// realms：按「总累计小时」自动升级的武侠境界阶梯（每轨道自带风味名）。
const LIFE_TRACKS={
  badminton:{ic:'🏸',n:'羽毛球',a:'BADMINTON',base:BM_PLAY_BASE+BM_BASIC_BASE,unit:'终身',rec:30,paused:false,
    realms:[[0,'初出茅庐'],[2000,'向名扬俱乐部'],[4000,'区里成名'],[6000,'省队水准'],[8000,'全国新锐'],[10000,'一代宗师']],
    variants:['练启动步时，留意身体变轻的那一刻。','只观察一次击球后的回位。','打十个好球，不追求多，只记住最顺的一拍。','步法慢就是快，今天多球先求稳。','把反手高远练三十球，让身体记住节奏。','录一段自己的杀球，回看时只看脚步。']},
  singing:{ic:'🎤',n:'唱歌',a:'MIND',base:122*60,unit:'累计',rec:15,paused:false,
    realms:[[0,'初出茅庐'],[50,'敢开嗓'],[150,'麦上常客'],[400,'小有所成'],[800,'一曲倾城'],[1500,'绕梁宗师']],
    variants:['唱一首旧歌，找回当时的自己。','只认真唱最喜欢的一段。','留意哪一句让呼吸真正舒展开。']},
  reading:{ic:'📖',n:'阅读',a:'MIND',base:182*60,unit:'累计',rec:15,paused:false,
    realms:[[0,'初出茅庐'],[100,'初窥门径'],[300,'渐入佳境'],[600,'博观约取'],[1000,'胸有丘壑'],[1500,'一代书宗']],
    variants:['读五页，收藏一句让你停下来的话。','不追页数，只寻找一个新念头。','换一个舒服的位置读十分钟。']},
  piano:{ic:'🎹',n:'钢琴',a:'MIND',base:178*60,unit:'累计',rec:15,paused:false,
    realms:[[0,'初出茅庐'],[50,'认谱'],[150,'小曲流畅'],[400,'小有所成'],[800,'登堂入室'],[1500,'琴心宗师']],
    variants:['只练一个乐句，听它比昨天顺一点。','闭眼弹一次熟悉的片段。','把最卡的两小节放慢一半。']},
  stretch:{ic:'🧘',n:'放松拉伸',a:'BODY',base:150*60,unit:'累计',rec:10,paused:false,
    realms:[[0,'初出茅庐'],[50,'舒展'],[150,'柔和'],[400,'松活'],[800,'筋长一寸'],[1500,'养生宗师']],
    variants:['先问身体：今天哪里最需要被照顾？','用三分钟把呼吸送到最紧的位置。','不追求幅度，只感受紧张慢慢松开。']},
  strength:{ic:'🏋️',n:'力量训练',a:'BODY',base:Math.round(61.7*60),unit:'累计',rec:20,paused:false,
    realms:[[0,'初出茅庐'],[50,'初见肌力'],[150,'动作稳健'],[400,'力量渐长'],[800,'小有所成'],[1500,'钢筋铁骨']],
    variants:['今天练一个让你更有掌控感的动作。','重量不变也没关系，先把动作做满。','感受发力，而不是急着冲数字。']},
  meditation:{ic:'🧘',n:'冥想呼吸',a:'BODY',base:Math.round(65.8*60),unit:'累计',rec:10,paused:false,
    realms:[[0,'初出茅庐'],[50,'开始入座'],[150,'呼吸平稳'],[400,'心念清明'],[800,'内观有成'],[1500,'定心宗师']],
    variants:['先坐下来，呼吸三次，其余再说。','今天只观察一次吸气的全过程。','念头跑了就轻轻回来，不用责备自己。']},
  career:{ic:'💼',n:'职业发展',a:'CAREER',base:1017*60,unit:'终身',rec:30,paused:false,
    realms:[[0,'初出茅庐'],[500,'独当一面'],[1000,'小有所成'],[2000,'业内立足']],
    variants:['今天哪一步让「安稳平台」更近一点？','记下一件你做得比上次好的事。','给未来的自己留一句职场观察。']},
  ai:{ic:'🤖',n:'AI提效',a:'CAREER',base:0,unit:'累计',rec:20,paused:false,
    realms:[[0,'初出茅庐'],[100,'工具上手'],[300,'流程打通'],[600,'半自动'],[1000,'人机协同'],[1500,'AI 原生']],
    variants:['今天用 AI 帮自己省下一件本要手动的琐事。','把一个重复动作试着交给 AI 跑一遍。','记下今天 AI 帮你做成的一件小事。']},
  travel:{ic:'🧭',n:'旅行·探索',a:'BODY',base:0,unit:'累计',rec:30,paused:false,
    realms:[[0,'初出茅庐'],[50,'初探四方'],[150,'行脚渐广'],[400,'走南闯北'],[800,'见多识广'],[1500,'行走的智者']],
    variants:['今天去了一个新地方，留意和平时不一样的空气。','不赶行程，只认真看一处。','把路上遇见的某个小细节记下来。']}
};
const LIFE_PROMPTS=['今天哪个普通瞬间值得被保存？','今天有什么声音、气味或光线让你停了一下？','哪一刻你感觉自己不是在赶路，而是在生活？','今天身体给了你什么细小反馈？','今天有什么东西比预想中更好？','如果只留下一帧，你想留下什么？'];
function ensureLifeCompound(){
  if(!S.lifeCompound||typeof S.lifeCompound!=='object')S.lifeCompound={logs:[],memories:[]};
  if(!Array.isArray(S.lifeCompound.logs))S.lifeCompound.logs=[];
  if(!Array.isArray(S.lifeCompound.memories))S.lifeCompound.memories=[];
  // v5.45 用户可改的轨道基数（小时）。改完即写入；首次访问时用 LIFE_TRACKS 默认值兜底。
  if(!S.lifeCompound.bases||typeof S.lifeCompound.bases!=='object')S.lifeCompound.bases={};
  // v5.45.1 迁移：v5.45 默认 {singing:150*60, piano:150*60, stretch:250*60} → v5.45.1 iHour 真实 {122,178,150}
  // 只迁「bases 仍是 v5.45 默认」的用户；已用 editLifeBase 自改的不会被覆盖（值不在 v5.45 默认范围）
  if(!S.lifeCompound._v5451_migrated){
    var OLD5={singing:150*60, piano:150*60, stretch:250*60};
    var NEW51={singing:122*60, piano:178*60, stretch:150*60};
    Object.keys(OLD5).forEach(function(k){
      if(S.lifeCompound.bases[k]===OLD5[k]) S.lifeCompound.bases[k]=NEW51[k];
    });
    S.lifeCompound._v5451_migrated=true;
  }
  // v6.0.30 一次性迁移：把已走过的旅行脚印折算进「旅行·探索」轨道历史基数（每处去过的地方≈30 分钟）
  if(!S.lifeCompound._v630_travel_base){
    var _gone=(S.trips||[]).filter(function(x){return !x.wish;}).length;
    S.lifeCompound.bases.travel=Math.round(_gone*30);
    S.lifeCompound._v630_travel_base=true;
  }
  Object.keys(LIFE_TRACKS).forEach(function(k){
    if(typeof S.lifeCompound.bases[k]!=='number') S.lifeCompound.bases[k]=LIFE_TRACKS[k].base;
  });
  return S.lifeCompound;
}
// 取得轨道当前基数（小时→分钟）：用户自定义优先 → LIFE_TRACKS 默认
function getLifeBaseMin(key){
  ensureLifeCompound();
  const override=S.lifeCompound.bases[key];
  if(typeof override==='number') return override;
  const t=LIFE_TRACKS[key]; return t? t.base: 0;
}
// 弹一个简易编辑器让用户调整某条轨道的历史基数（小时）
function editLifeBase(key){
  const t=LIFE_TRACKS[key]; if(!t) return;
  const cur=(getLifeBaseMin(key)/60).toFixed(1);
  const v=prompt('调整「'+t.n+'」的历史基数（小时）。当前 '+cur+'h。建议：约略估算你记录本系统前累计的练习小时数。',cur);
  if(v===null) return;
  const num=Math.max(0,Math.round(parseFloat(v)*10)/10);
  if(isNaN(num)) return;
  ensureLifeCompound(); S.lifeCompound.bases[key]=Math.round(num*60);
  try{ save(); }catch(e){}
  renderLifeCompound(); celebrateTask('🎯 「'+t.n+'」基数已更新为 '+num+'h');
}
// v5.39 任务→轨道映射（扩到 body / career，原来只认羽毛球和精神类，
// 导致「力量训练」「职业行动」做完不进任何轨道 —— 既重复又漏账）。
function lifeTrackOfTask(item){
  const t=(item&&item.t)||'';
  if(/羽毛球|打球|对抗|比赛|挥拍|多球|实战|基本功|步法|专项|技术练习|挥拍练习/.test(t)) return 'badminton';
  if(/拉伸|放松|恢复|筋膜/.test(t)) return 'stretch';
  if(/力量训练|健身|撸铁|有氧|跑步|核心|课表/.test(t)) return 'strength';
  if(/冥想|呼吸|正念|打坐|静坐/.test(t)) return 'meditation';
  if(/AI提效|AI 提效|用 ?AI|AI 工具|AI 学习|提示词|prompt|自动化工作流|coze|扣子/.test(t)) return 'ai';
  if(/职业|求职|事业编|央企|文职|简历|面试/.test(t)) return 'career';
  if(/出行|旅行|出游|远游|游玩|逛展|看展|采风|闲逛|远足|徒步|户外|探索|散心/.test(t)) return 'travel';
  const mind=[/唱歌|声乐/.test(t)&&'singing',/钢琴|弹琴/.test(t)&&'piano',/阅读|读书|小说/.test(t)&&'reading'].filter(Boolean);
  return mind.length===1?mind[0]:'';
}
// 「精神充电（唱歌/钢琴/阅读任选）」这类一对多的日课，在复利面板里已被拆成独立轨道，
// 留着只会让同一件事记两遍，故一并列为冗余。
const REDUNDANT_DAILY=/精神充电|生活复利/;
// 一次性迁移：把与复利轨道重复的固定日常收走，只留无法映射的真·小习惯（如「23:30 前睡觉」）。
// 只动 S.daily 清单本身，不碰任何历史记录 / XP / 轨道时长。
function migrateDailyIntoTracks(){
  if(!S.migr||typeof S.migr!=='object') S.migr={};
  if(S.migr.dailyTracks) return;
  const keep=[], moved=[];
  (S.daily||[]).forEach(function(it){
    const k=lifeTrackOfTask(it);
    if(k||REDUNDANT_DAILY.test(it.t||'')) moved.push(it.t); else keep.push(it);
  });
  if(moved.length) S.daily=keep;
  S.migr.dailyTracks=todayStr();
  S.migr.dailyMoved=moved;
  try{ save(); }catch(e){}
}
// v5.49 羽毛球拆「打球 / 基本功」：历史 1649h 按 2/3·1/3 拆到两轨道基数；旧日志(key=badminton)已归打球。
function migrateBmSplit(){
  if(!S.migr||typeof S.migr!=='object') S.migr={};
  if(S.migr.bmSplit) return;
  S.migr.bmSplit=todayStr();
  try{
    ensureLifeCompound();
    S.lifeCompound.bases.badminton = BM_PLAY_BASE;   // 打球（含旧日志）
    S.lifeCompound.bases.bmbasic = BM_BASIC_BASE;     // 基本功（按比例预填，可双击改）
    save();
  }catch(e){}
}
// v5.51.18 合并「羽毛球·打球 / 羽毛球·基本功」为单一「羽毛球」轨道（同一分类不拆分显示）。
function migrateBmMerge(){
  if(!S.migr||typeof S.migr!=='object') S.migr={};
  if(S.migr.bmMerge) return;
  try{
    ensureLifeCompound();
    const b=S.lifeCompound.bases.bmbasic;
    if(typeof b==='number'){
      S.lifeCompound.bases.badminton=(S.lifeCompound.bases.badminton||0)+b;
      delete S.lifeCompound.bases.bmbasic;
    }
    S.lifeCompound.logs.forEach(function(x){ if(x.key==='bmbasic') x.key='badminton'; });
    S.migr.bmMerge=todayStr();
    save();
  }catch(e){}
}
// v6.0.26 身体健康拆分为力量训练 + 冥想呼吸；base 按 iHour 2026 年 1-6 月截图汇总重置。
function migrateBodySplit(){
  if(!S.migr||typeof S.migr!=='object') S.migr={};
  if(S.migr.bodySplit) return;
  ensureLifeCompound();
  let moved=0;
  if(Array.isArray(S.lifeCompound.logs)){
    S.lifeCompound.logs.forEach(function(x){
      if(x.key!=='body') return;
      const text=String(x.id||'')+' '+String(x.t||'')+' '+String(x.a||'');
      if(/力量|健身|撸铁|核心|课表|有氧|跑步/.test(text)) x.key='strength';
      else if(/冥想|呼吸|正念|打坐|静坐/.test(text)) x.key='meditation';
      else x.key='strength'; // 无法识别的默认归入力量训练
      moved++;
    });
  }
  // 旧 body base 不再使用；新轨道 base 由 LIFE_TRACKS 默认值提供（iHour 截图汇总）。
  if(typeof S.lifeCompound.bases.body==='number') delete S.lifeCompound.bases.body;
  S.migr.bodySplit=todayStr();
  console.log('migrateBodySplit: moved', moved);
  try{ save(); }catch(e){}
}
function practiceLogs(key){return ensureLifeCompound().logs.filter(x=>x.key===key);}
function practiceNewMinutes(key){return practiceLogs(key).reduce((n,x)=>n+(+x.min||0),0);}
function practiceTodayMinutes(key){return practiceLogs(key).filter(x=>x.d===todayStr()).reduce((n,x)=>n+(+x.min||0),0);}
// v6.0.10 显示用：当前查看的日期（REC_DATE 或今天）当天该轨道分钟数。
// 今日行动页切到补录日期时，复利图标/今日主线都按这一天渲染，已点亮的照常亮起。
function practiceViewMinutes(key){return practiceLogs(key).filter(x=>x.d===recordDateStr()).reduce((n,x)=>n+(+x.min||0),0);}
function practiceWeekMinutes(key){const start=monday();return practiceLogs(key).filter(x=>x.d>=start&&x.d<=shiftDate(start,6)).reduce((n,x)=>n+(+x.min||0),0);}
function trackStage(totalMin, realms){
  const H=totalMin/60; let cur=realms[0], next=null;
  for(let i=0;i<realms.length;i++){ if(H>=realms[i][0]) cur=realms[i]; else { next=realms[i]; break; } }
  const at=cur[0], nh=next?next[0]:null;
  const pct = next ? Math.min(100, Math.max(0,(H-at)/(nh-at)*100)) : 100;
  return {n:cur[1], at, next: next?{h:nh,n:next[1]}:null, pct, H};
}
function practiceDays(key){return new Set(practiceLogs(key).map(x=>x.d)).size;}
function lifeVariant(key){const t=LIFE_TRACKS[key];return t.variants[seededIndex(recordDateStr()+key,t.variants.length)];}
function addLifePractice(key,min){
  const t=LIFE_TRACKS[key];if(!t)return;min=Math.max(1,+min||5);const d=recordDateStr(),lc=ensureLifeCompound();
  const yiBonus=(key==='travel'&&yiTravelActive());
  const effMin=yiBonus?Math.round(min*1.2):min;
  // v5.44.1 同步存属性，便于 weeklyReviewStats 直接归类（不必再反查 LIFE_TRACKS）
  lc.logs.push({id:'manual:'+Date.now()+':'+key,key,d,min:effMin,src:'quick',a:t.a});grant(t.a,effMin,false);const sk=(typeof skillBonusFor==='function')?skillBonusFor(t.a):0;const xpGain=Math.round(effMin*(1+equipBonusFor(t.a)+sk));touchActivity(d);addHist(t.ic+' '+t.n+'复利 +'+effMin+' 分钟'+(yiBonus?'（宜出行·气运+20%）':''),effMin,d);save();renderLifeCompound();render();celebrateTask(t.ic+' '+t.n+' +'+effMin+' 分钟 · +'+xpGain+' XP'+(yiBonus?' · 宜出行':''));
}
function syncLifePracticeFromTask(item,d,min,remove){
  const key=lifeTrackOfTask(item);if(!key)return;const lc=ensureLifeCompound(),lid='task:'+(item.id||item.t)+':'+d,idx=lc.logs.findIndex(x=>x.id===lid);
  if(remove){if(idx>=0)lc.logs.splice(idx,1);return;}
  min=Math.max(1,+min||+item.rec||+item.min||5);const a=(LIFE_TRACKS[key]&&LIFE_TRACKS[key].a)||'BODY';const row={id:lid,key,d,min,src:'task',a};if(idx>=0)lc.logs[idx]=row;else lc.logs.push(row);
}
function saveLifeMemory(){
  const input=document.getElementById('lifeMemoryInput'),sel=document.getElementById('lifeMemoryTrack');const textv=(input&&input.value||'').trim();if(!textv)return;
  const lc=ensureLifeCompound();lc.memories.push({id:'mem:'+Date.now(),d:recordDateStr(),text:textv,key:sel&&sel.value||'life'});if(input)input.value='';save();renderLifeCompound();celebrateTask('✨ 一枚生活碎片已被留下');
}
function lifeChapter(count){const chapters=['开始留心','生活有光','细节收藏家','日常鉴赏家','人间值得'];return chapters[Math.min(chapters.length-1,Math.floor(count/7))];}
// v5.39 复利面板 = 今日行动的唯一记录入口（原「固定日常」里同名的项已迁走，不再两处各记一遍）。
// 每条轨道可直接填分钟并标记完成；填了时间即视为今天完成，卡片点亮。
function recordLifePractice(key){
  const t=LIFE_TRACKS[key]; if(!t) return;
  const el=document.getElementById('lcMin_'+key);
  const v=Math.max(1, Math.round(+((el&&el.value)||t.rec||15)));
  addLifePractice(key, v);
}
function clearLifeToday(key){
  const t=LIFE_TRACKS[key]; if(!t) return;
  const d=recordDateStr(), lc=ensureLifeCompound();
  const gone=lc.logs.filter(function(x){return x.key===key&&x.d===d;});
  if(!gone.length) return;
  const mins=gone.reduce(function(n,x){return n+(+x.min||0);},0);
  lc.logs=lc.logs.filter(function(x){return !(x.key===key&&x.d===d);});
  try{ grant(t.a, -mins, false); }catch(e){}
  addHist(t.ic+' '+t.n+'撤销'+fmtMD(d)+'记录 −'+mins+' 分钟', -mins, d);
  save(); renderLifeCompound(); render();
}
// v5.42 复利轨道改为图标优先：默认只显示图标，点击图标展开时间录入器；
// 记录后图标从暗(未记录)变亮(已记录)，已点亮的再点可继续叠加时间。
let _lcOpenTrack=null;
function lcToggle(key){ _lcOpenTrack=key; renderLifeCompound(); const i=document.getElementById('lcMin_'+key); if(i) i.focus(); }
function lcClose(){ _lcOpenTrack=null; renderLifeCompound(); }
function renderLifeCompound(){
  ensureLifeCompound();
  const keys=Object.keys(LIFE_TRACKS);
  const live=keys.filter(function(k){return !LIFE_TRACKS[k].paused;});
  const viewDate=recordDateStr();
  const isViewToday=viewDate===todayStr();
  const viewActive=keys.filter(function(k){return practiceViewMinutes(k)>0;}).length;
  const mems=S.lifeCompound.memories||[];
  const viewMin=keys.reduce(function(n,k){return n+practiceViewMinutes(k);},0);
  const prompt=LIFE_PROMPTS[seededIndex(viewDate,LIFE_PROMPTS.length)];

  const quick=document.getElementById('lifeBlendBox');
  if(quick) quick.innerHTML=
    '<div class="lc-head"><div><b>🌱 '+(isViewToday?'今日行动':'补录')+' · 复利轨道</b><span>'+(isViewToday?'点图标记一笔，今天完成的会亮起来':('这里显示 '+fmtMD(viewDate)+' 已点亮的情况；点图可在那天补记一笔'))+'</span></div>'
      +'<div class="lc-score">'+viewActive+'/'+live.length+' 条已点亮 · 共 '+viewMin+' 分钟'+(isViewToday?'':' · '+fmtMD(viewDate))+'</div></div>'
    +'<div class="lc-ic-row">'+keys.filter(function(k){return !LIFE_TRACKS[k].paused;}).map(function(k){
      const t=LIFE_TRACKS[k], m=practiceViewMinutes(k), lit=m>0;
      return '<button class="lc-ic-btn '+(lit?'lit':'dim')+(_lcOpenTrack===k?' open':'')+'" onclick="lcToggle(\''+k+'\')" title="'+escHtml(lifeVariant(k))+'">'
        +'<span class="lc-ic">'+t.ic+'</span>'
        +'<span class="lc-ic-name">'+t.n+'</span>'
        +(lit?'<span class="lc-ic-badge">'+m+'</span>':'')
        +'</button>';
    }).join('')+'</div>'
    +(_lcOpenTrack?(function(){
        const k=_lcOpenTrack, t=LIFE_TRACKS[k], m=practiceViewMinutes(k), rec=t.rec||15;
        return '<div class="lc-expand">'
          +'<div class="lc-expand-head"><b>'+t.ic+' '+t.n+'</b><span>'+(isViewToday?'今天':fmtMD(viewDate))+'已 '+m+' 分钟 · 建议 '+rec+' 分钟</span>'
          +'<button class="btn xs ghost lc-close" onclick="lcClose()" title="收起">✕</button></div>'
          +'<div class="lc-expand-body">'
            +'<input class="lc-min" id="lcMin_'+k+'" type="number" min="1" max="600" step="5" value="'+rec+'" '
              +'onkeydown="if(event.key===\'Enter\')recordLifePractice(\''+k+'\')">'
            +'<span class="lc-unit">分钟</span>'
            +'<button class="btn xs primary" onclick="recordLifePractice(\''+k+'\')">✓ 记录</button>'
            +'<button class="btn xs ghost" onclick="addLifePractice(\''+k+'\',5)" title="只做了一点点">+5</button>'
            +(m?'<button class="btn xs ghost lc-undo" onclick="clearLifeToday(\''+k+'\')" title="撤销当天这条轨道的全部记录">↺</button>':'')
          +'</div></div>';
      })():'')
    +'<div class="lc-memory"><div><b>✨ '+(isViewToday?'今日生活碎片':fmtMD(viewDate)+'生活碎片')+'</b><span>'+prompt+'</span></div>'
      +'<div class="lc-memory-row"><select id="lifeMemoryTrack"><option value="life">生活本身</option>'
      +keys.map(function(k){return '<option value="'+k+'">'+LIFE_TRACKS[k].ic+' '+LIFE_TRACKS[k].n+'</option>';}).join('')
      +'</select><input id="lifeMemoryInput" maxlength="120" placeholder="一句话就够了…">'
      +'<button class="btn sm primary" onclick="saveLifeMemory()">留下这一帧</button></div></div>';

  const detail=document.getElementById('longPracticeBox');
  if(detail) detail.innerHTML=
    '<div class="lp-head"><div><b>🌳 长期复利轨道</b><span>不追求每天完美，只让总量持续向前</span></div>'
      +'<div class="lp-chapter">✨ '+lifeChapter(mems.length)+' · '+mems.length+' 枚生活碎片</div></div>'
    +'<div class="lp-grid">'+keys.map(function(k){
      const t=LIFE_TRACKS[k], fresh=practiceNewMinutes(k), total=getLifeBaseMin(k)+fresh, st=trackStage(total,t.realms);
      return '<div class="lp-card'+(t.paused?' paused':'')+'">'
        +'<div class="lp-title" ondblclick="editLifeBase(\''+k+'\')" title="双击调整历史基数"><b>'+t.ic+' '+t.n+'</b><span>'+st.n+'</span></div>'
        +'<div class="lp-total">'+(total/60).toFixed(1)+'h <small>'+t.unit+'累计</small></div>'
        +'<div class="lp-bar"><i style="width:'+st.pct+'%"></i></div>'
        +'<div class="lp-meta"><span>本周 '+(practiceWeekMinutes(k)/60).toFixed(1)+'h</span><span>'+practiceDays(k)+' 个投入日</span>'
        +'<span>'+(st.next?('下一境界「'+st.next.n+'」还差 '+Math.max(0,(st.next.h*60-total)/60).toFixed(0)+'h'):'已达最高境界 ✦')+'</span></div></div>';
    }).join('')+'</div>'
    +'<div class="lp-note">羽毛球/力量/冥想/职业沿用真实累计基数；阅读用真实历史 182h。今日行动页填的时间会直接累进这里，每个轨道按总小时自动点亮武侠境界。<br><span class="hint">卡头上双击可调该轨道历史基数（小时）</span></div>';
}

function setupLifeCompoundUI(){
  ensureLifeCompound();
  try{ migrateDailyIntoTracks(); }catch(e){ console.warn('daily->tracks migrate',e); }
  try{ migrateBmSplit(); }catch(e){ console.warn('bm split migrate',e); }
  try{ migrateBmMerge(); }catch(e){ console.warn('bm merge migrate',e); }
  try{ migrateBodySplit(); }catch(e){ console.warn('body split migrate',e); }
  if(!document.getElementById('lifeBlendBox')){const p=document.createElement('div');p.className='panel life-compound';p.id='lifeBlendPanel';p.innerHTML='<div id="lifeBlendBox"></div>';const anchor=document.getElementById('recBar')||document.getElementById('todayDetailCockpit');anchor?.insertAdjacentElement('afterend',p);}
  if(!document.getElementById('longPracticeBox')){const p=document.createElement('div');p.className='panel long-practice';p.id='longPracticePanel';p.innerHTML='<div id="longPracticeBox"></div>';const xp=document.querySelector('#page-growth .xp-ledger');xp?.insertAdjacentElement('afterend',p);}
  renderLifeCompound();
}

// ===== 今日运势 · 天象 · 宜忌 =====
// 日干支用真实 60 甲子推算（2000-01-07 为甲子日，可与万年历核对）；
// 吉凶依角色命格「丁火 · 身强偏旺 · 喜金水清凉」判定，非通用黄历。
const GZ_GAN=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const GZ_ZHI=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const GAN_WX=['木','木','火','火','土','土','金','金','水','水'];
const ZHI_WX=['水','土','木','木','土','火','火','土','金','金','土','水'];
// 丁火身强偏旺：喜金水（调候/耗泄），土可泄火为平，木火则火上加火。
const WX_SCORE={'金':2,'水':2,'土':1,'木':-1,'火':-2};
const WX_IC={'金':'⚔️','水':'💧','木':'🌿','火':'🔥','土':'⛰️'};

function dayGanzhi(ds){
  const d=ds||todayStr(), p=d.split('-').map(Number);
  const base=Date.UTC(2000,0,7); // 2000-01-07 = 甲子日
  const cur=Date.UTC(p[0],p[1]-1,p[2]);
  const days=Math.floor((cur-base)/86400000);
  const idx=((days%60)+60)%60;
  const gan=GZ_GAN[idx%10], zhi=GZ_ZHI[idx%12];
  return {idx, gan, zhi, gz:gan+zhi, ganWx:GAN_WX[idx%10], zhiWx:ZHI_WX[idx%12]};
}

// 宜/忌基础规则：按当日主导五行对丁火的作用给方向，不是通用黄历。
const WX_ADVICE={
  '金':{yi:['谈事、定合同、把悬着的决定落定','上强度：对抗练球 / 力量训练','说清楚一件一直没说的事'],
        ji:['反复权衡不下决心','把锋利的话说给在乎的人']},
  '水':{yi:['沉下来学一样东西 / 阅读','复盘、写规划、整理思路','独处一会儿，不安排社交'],
        ji:['熬夜耗神（水日透支最伤）','把安静误当停滞而焦虑']},
  '木':{yi:['见人、社交、聊机会','启动一件小的新事','出门走走，换个场景'],
        ji:['同时开太多头，样样起头样样浅','答应超过自己容量的事']},
  '火':{yi:['静守、少做决定','拉伸、慢走、降燥','读点跟自己无关的书'],
        ji:['冲动做决定 / 签字','为他人背书、担保、当中间人','争执与情绪对撞']},
  '土':{yi:['整理、归档、收纳、清理','做总结、结账、算账','把半成品收个尾'],
        ji:['翻旧账、纠结已经过去的事','拖着不开始']}
};
// 阈值按实际取值域校准：raw ∈ [-3.5, 3.5]（干权重 1、支权重 0.75）。
// 60 甲子实测分布 = 大吉 8 / 吉 16 / 平 24 / 小滞 6 / 宜静 6，不会天天大吉，也不会天天倒霉。
const FORTUNE_TONE=[
  {min:3.0,lv:5,t:'大吉',d:'金水当令，今天顺水推舟'},
  {min:1.5,lv:4,t:'吉',  d:'气场清爽，适合往前推一步'},
  {min:-0.5,lv:3,t:'平',  d:'不好不坏，按本分做事最稳'},
  {min:-2.0,lv:2,t:'小滞',d:'略有燥意，慢一点没关系'},
  {min:-99,lv:1,t:'宜静',d:'火旺之日，守住比赢重要'}
];

function fortuneToday(){
  const g=dayGanzhi(todayStr());
  const raw=(WX_SCORE[g.ganWx]||0)+(WX_SCORE[g.zhiWx]||0)*0.75;
  const tone=FORTUNE_TONE.find(x=>raw>=x.min)||FORTUNE_TONE[FORTUNE_TONE.length-1];
  // 主导五行：取分值更极端的一方（更能代表当日气质）
  const main=Math.abs(WX_SCORE[g.ganWx]||0)>=Math.abs(WX_SCORE[g.zhiWx]||0)?g.ganWx:g.zhiWx;
  const rule=WX_ADVICE[main]||WX_ADVICE['土'];
  const yi=rule.yi.slice(0,2), ji=rule.ji.slice(0,2);
  // —— 以下为「真实数据驱动」的追加条目，不是命理，是你自己的记录说话 ——
  try{
    const td=todayStr();
    const logs=(ensureLifeCompound().logs)||[];
    const bmRecent=[0,1,2].some(i=>{ const dd=shiftDate(td,-i); return logs.some(x=>x.key==='badminton'&&x.d===dd); });
    if(!bmRecent && raw>=1.5) yi.push('已经 3 天没碰球拍了 · 去活动筋骨');
    if(practiceWeekMinutes('career')===0) yi.push('本周职业主线还是 0 · 先做 30 分钟');
    if(practiceTodayMinutes('stretch')===0 && practiceTodayMinutes('badminton')>0) yi.push('今天练过球了 · 补 10 分钟拉伸');
    const activeToday=Object.keys(LIFE_TRACKS).filter(k=>practiceTodayMinutes(k)>0).length;
    if(activeToday>=4) ji.push('今天已点亮 '+activeToday+' 条轨道 · 别再加码了');
  }catch(e){}
  return {g, raw, tone, main, yi:yi.slice(0,4), ji:ji.slice(0,3)};
}

// 今日是否「宜出行」：宜忌（命理+真实记录）命中出行/探索类关键词 → 旅行·探索轨道经验 +20%
function yiTravelActive(){
  try{
    const yi=fortuneToday().yi||[];
    return yi.some(function(s){ return /出行|远行|出游|远游|游[玩历]|探索|旅行|出门|采风|看展|逛展|闲逛|远足|徒步|户外|散心/.test(s); });
  }catch(e){ return false; }
}

// ===== 天气（Open-Meteo · 免 key · 支持 CORS）=====
const WX_CITIES={
  beijing:{n:'北京',lat:39.9042,lon:116.4074},
  kunming:{n:'昆明',lat:25.0389,lon:102.7183},
  dali:{n:'大理',lat:25.6065,lon:100.2679},
  lijiang:{n:'丽江',lat:26.8721,lon:100.2299},
  shanghai:{n:'上海',lat:31.2304,lon:121.4737}
};
const WMO={0:['晴','☀️'],1:['少云','🌤'],2:['多云','⛅'],3:['阴','☁️'],45:['雾','🌫'],48:['雾凇','🌫'],
  51:['小毛雨','🌦'],53:['毛毛雨','🌦'],55:['密毛雨','🌦'],56:['冻毛雨','🌧'],57:['冻毛雨','🌧'],
  61:['小雨','🌧'],63:['中雨','🌧'],65:['大雨','🌧'],66:['冻雨','🌧'],67:['冻雨','🌧'],
  71:['小雪','🌨'],73:['中雪','🌨'],75:['大雪','❄️'],77:['米雪','🌨'],
  80:['阵雨','🌦'],81:['阵雨','🌧'],82:['强阵雨','⛈'],85:['阵雪','🌨'],86:['强阵雪','❄️'],
  95:['雷阵雨','⛈'],96:['雷暴冰雹','⛈'],99:['强雷暴','⛈']};
let _wxCache=null;
function wxCityKey(){ return (S.wxCity && WX_CITIES[S.wxCity]) ? S.wxCity : 'beijing'; }
function setWxCity(k){ S.wxCity=k; try{save();}catch(e){} _wxCache=null; try{localStorage.removeItem('lifeRPG_wx');}catch(e){} renderFortune(); loadWeather(true); }
function loadWeather(force){
  const key=wxCityKey(), c=WX_CITIES[key], now=Date.now();
  if(!force){
    try{
      const raw=localStorage.getItem('lifeRPG_wx');
      if(raw){ const o=JSON.parse(raw); if(o&&o.key===key&&now-o.ts<3600000){ _wxCache=o.data; renderFortune(); return; } }
    }catch(e){}
  }
  const url='https://api.open-meteo.com/v1/forecast?latitude='+c.lat+'&longitude='+c.lon
    +'&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m'
    +'&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max'
    +'&timezone=Asia%2FShanghai&forecast_days=1';
  fetch(url).then(r=>r.json()).then(j=>{
    if(!j||!j.current) throw new Error('bad');
    const data={t:Math.round(j.current.temperature_2m), ft:Math.round(j.current.apparent_temperature),
      code:j.current.weather_code, rh:j.current.relative_humidity_2m,
      hi:Math.round(j.daily.temperature_2m_max[0]), lo:Math.round(j.daily.temperature_2m_min[0]),
      pop:j.daily.precipitation_probability_max[0]};
    _wxCache=data;
    try{ localStorage.setItem('lifeRPG_wx', JSON.stringify({key, ts:now, data})); }catch(e){}
    renderFortune();
  }).catch(function(){ _wxCache={err:true}; renderFortune(); });
}
// 天气对「今天怎么练」的实际影响，加进宜忌
function weatherAdvice(w){
  const yi=[], ji=[];
  if(!w||w.err) return {yi:yi,ji:ji};
  if(w.pop>=60){ ji.push('户外安排（降水概率 '+w.pop+'%）'); yi.push('改室内：基本功 / 教学视频'); }
  if(w.ft>=32){ ji.push('午间高强度（体感 '+w.ft+'°，丁火忌燥）'); yi.push('挪到清晨或傍晚练，随身补水'); }
  else if(w.ft<=3){ yi.push('热身拉长到 10 分钟再上强度'); }
  if(w.rh!=null && w.rh<=30) yi.push('空气偏干 · 多喝水');
  return {yi:yi,ji:ji};
}

function seasonAct(el){
  const M={木:['春生之机，宜舒展生发、定新计划','户外散步 20 分钟 / 拉伸一组'],
           火:['丁火忌燥，宜静守、补水、避烈阳','早睡半小时 / 闭眼静坐 10 分钟'],
           土:['长夏主运化，宜沉淀、整理、复盘','大扫除一处 / 记一笔账'],
           金:['秋金主收敛，宜决断、断舍离','复盘本周 / 读完手边一书'],
           水:['冬水主藏养，宜蓄力、内观','写一句话给未来的自己 / 早睡']};
  return M[el]||['顺时而为','按自己的节奏来'];
}
function renderFortune(){
  const el=document.getElementById('fortuneBox'); if(!el) return;
  const f=fortuneToday(), w=_wxCache, wa=weatherAdvice(w), jq=dingHuoNow();
  document.body.dataset.season=jq.el;
  const city=WX_CITIES[wxCityKey()];
  const stars='★'.repeat(f.tone.lv)+'☆'.repeat(5-f.tone.lv);
  let wxHtml;
  if(!w) wxHtml='<div class="fo-wx-load">正在观天象…</div>';
  else if(w.err) wxHtml='<div class="fo-wx-load">天象未接通<br><small>离线或网络受限</small></div>';
  else{
    const m=WMO[w.code]||['—','🌡'];
    wxHtml='<div class="fo-wx-main"><span class="fo-wx-ic">'+m[1]+'</span><span class="fo-wx-t">'+w.t+'°</span>'
      +'<span class="fo-wx-d">'+m[0]+'</span></div>'
      +'<div class="fo-wx-sub">体感 '+w.ft+'° · '+w.lo+'~'+w.hi+'° · 降水 '+(w.pop==null?'—':w.pop+'%')+'</div>';
  }
  const opts=Object.keys(WX_CITIES).map(function(k){return '<option value="'+k+'"'+(k===wxCityKey()?' selected':'')+'>'+WX_CITIES[k].n+'</option>';}).join('');
  const yiAll=f.yi.concat(wa.yi).slice(0,5), jiAll=f.ji.concat(wa.ji).slice(0,4);
  el.innerHTML=
    '<div class="fo-top">'
      +'<div class="fo-gz"><div class="fo-gz-c">'+f.g.gz+'</div><div class="fo-gz-l">'+WX_IC[f.g.ganWx]+f.g.ganWx+' · '+WX_IC[f.g.zhiWx]+f.g.zhiWx+'</div></div>'
      +'<div class="fo-tone lv'+f.tone.lv+'"><div class="fo-tone-t">'+f.tone.t+'<span class="fo-stars">'+stars+'</span></div><div class="fo-tone-d">'+f.tone.d+'</div></div>'
      +'<div class="fo-wx"><select class="fo-wx-city" onchange="setWxCity(this.value)">'+opts+'</select>'+wxHtml+'</div>'
    +'</div>'
    +'<div class="fo-cols">'
      +'<div class="fo-col fo-yi"><div class="fo-col-h">宜</div><ul>'+yiAll.map(function(x){return '<li>'+escHtml(x)+'</li>';}).join('')+'</ul></div>'
      +'<div class="fo-col fo-ji"><div class="fo-col-h">忌</div><ul>'+jiAll.map(function(x){return '<li>'+escHtml(x)+'</li>';}).join('')+'</ul></div>'
    +'</div>'
    +(yiTravelActive()?'<div class="fo-yi-travel">✈️ 今日宜出行：在「旅行·探索」复利轨道记录，或记旅行脚印，经验 +20%（气运加持）</div>':'')
    +'<div class="fo-season">🌿 当令 · '+jq.jieqi+'（'+jq.el+'行）：'+seasonAct(jq.el)[0]+' <span class="fo-season-act">今日小行动 · '+seasonAct(jq.el)[1]+'</span></div>'
    +'<div class="fo-note">依你的命格「丁火 · 身强偏旺 · 喜金水清凉」判定，非通用黄历。带「·」的条目来自你自己的记录与'+city.n+'实时天气。</div>';
}

const USAGE_KEY='lifeRPG_usage_v1';
function readUsage(){try{return JSON.parse(localStorage.getItem(USAGE_KEY)||'{}')||{};}catch(e){return {};}}
function writeUsage(v){try{localStorage.setItem(USAGE_KEY,JSON.stringify(v));}catch(e){}}
function trackUsage(kind,key){
  if(!kind||!key)return;const u=readUsage(),id=kind+':'+key,now=new Date().toISOString();
  u.first=u.first||now;u.last=now;u.events=u.events||{};
  const row=u.events[id]||{kind,key,count:0,last:''};row.count++;row.last=now;u.events[id]=row;writeUsage(u);
  if(location.hash==='#data')renderUsageInsights();
}
function usageLabel(row){
  const names={page:'页面',group:'展开',action:'操作'};
  const pages={dashboard:'仪表盘',energy:'精力恢复',action:'短期任务',current:'短期任务',week:'本周卷册',longterm:'长期主线',ledger:'钱庄',journey:'角色设定',growth:'修行成长',data:'设置'};
  return (names[row.kind]||row.kind)+' · '+(row.kind==='page'?(pages[row.key]||row.key):row.key);
}
function renderUsageInsights(){
  const box=document.getElementById('usageInsightsBox');if(!box)return;const u=readUsage(),rows=Object.values(u.events||{}).sort((a,b)=>b.count-a.count),pages=rows.filter(x=>x.kind==='page'),groups=rows.filter(x=>x.kind==='group');
  if(!rows.length){box.innerHTML='<div class="hint">还没有使用记录。之后打开页面、展开低频模块和执行关键操作时，会仅在本机累计次数。</div>';return;}
  const top=rows.slice(0,8).map(x=>'<div class="usage-row"><span>'+escHtml(usageLabel(x))+'</span><b>'+x.count+' 次</b></div>').join('');
  const cold=pages.filter(x=>x.count<=1).slice(0,4).map(x=>escHtml(usageLabel(x).replace('页面 · ',''))).join('、');
  box.innerHTML='<div class="usage-summary"><span>已记录 '+rows.reduce((n,x)=>n+x.count,0)+' 次交互</span><span>'+pages.length+' 个页面 · '+groups.length+' 个折叠区</span></div>'+top+(cold?'<div class="hint" style="margin-top:10px">低频候选：'+cold+'。建议至少观察两周后再决定删除。</div>':'');
}
function clearUsageInsights(){if(!confirm('只清除本机使用统计，不影响游戏存档。确定吗？'))return;localStorage.removeItem(USAGE_KEY);renderUsageInsights();}
function setupUsageTracking(){
  if(document.getElementById('usageInsightsPanel'))return;
  const target=document.getElementById('page-data');if(!target)return;
  const panel=document.createElement('div');panel.className='panel';panel.id='usageInsightsPanel';panel.innerHTML='<h2>📊 本机使用概览 <span class="note">不上传 · 用于两周后判断去留</span><button class="btn xs ghost" style="float:right" onclick="clearUsageInsights()">清零统计</button></h2><div id="usageInsightsBox"></div>';
  target.appendChild(panel);renderUsageInsights();
  document.addEventListener('toggle',e=>{const d=e.target;if(d.matches&&d.matches('.ia-detail-group')&&d.open){const name=d.querySelector('summary span')?.textContent||'折叠区';trackUsage('group',name.trim());}},true);
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(!b)return;const txt=(b.textContent||'').trim();if(/新增地点|打造|记一笔|生成周报|生成月报|只看今日三件|退出三件模式/.test(txt))trackUsage('action',txt.slice(0,18));},true);
}

(async ()=>{
function _initErr(label,e){
  console.error('[init:'+label+']', e);
  try{
    const bar=document.getElementById('__initErrBar');
    const msg=(e&&e.message)||String(e);
    if(bar){ bar.textContent='⚠ 初始化警告['+label+']：'+msg+'（不影响登录，可继续使用；某页空白请截图反馈）'; bar.style.display='block'; }
    else{
      const b=document.createElement('div'); b.id='__initErrBar';
      b.style.cssText='position:fixed;left:8px;right:8px;top:8px;z-index:99999;background:#7a2222;color:#fff;padding:10px 12px;border-radius:8px;font-size:13px;box-shadow:0 4px 16px rgba(0,0,0,.4)';
      b.textContent='⚠ 初始化警告['+label+']：'+msg+'（不影响登录，可继续使用；某页空白请截图反馈）';
      document.body.appendChild(b);
    }
  }catch(_){}
}
try{
  await load();
  try{ initAvatar(); }catch(e){ console.warn('init avatar',e); }
  reorganizeDetailPages();
  applyTheme();                   // 应用上次选择的命理主题皮肤
  newDay();                       // 日期变化时自动结算连击、重置日常/周/月
  REC_DATE='';                   // 默认记今天
  const _ri=document.getElementById('recDate'); if(_ri) _ri.value=todayStr();
  lastLevel = lvlOf(overallXP());
  try{ npcRoll(); letterCheck(); if(!S.enc.cur) encounterRoll(true); }catch(e){ console.warn('v5.19 init',e); }
  try{ petCheck(); }catch(e){ console.warn('pet init',e); }
  try{ birthdayCheck(); }catch(e){ console.warn('birthday init',e); }
  checkAch();
  try{ render(); }catch(e){ _initErr('render', e); }
  try{ applyDashOrder(); }catch(e){}
  try{ initDashDrag(); }catch(e){}
  const _validPages=['dashboard','journey','action','jianghu','longterm','growth','map','ledger','data'];
  let _ip=(location.hash||'#dashboard').slice(1);
  if(_ip==='loot') _ip='growth'; // 战利品页已并入修行页，旧 hash 防空白
  if(_validPages.indexOf(_ip)<0) _ip='dashboard';
  try{ showPage(_ip); }catch(e){ _initErr('showPage', e); }
  try{ maybeShowBrief(); }catch(e){}
  try{ loadWeather(false); }catch(e){}   // 天象：命中 1 小时缓存则不发请求
  try{ fillGhInputs(); }catch(e){}
  try{ renderAssetEditor(); }catch(e){}
  const lDate=document.getElementById('lDate'); if(lDate) lDate.value=todayStr();
  const _w=document.getElementById('weightInput'); if(_w && S.weight) _w.value=S.weight;
  if(FS_AVAILABLE && !saveFileHandle){
    const b=document.getElementById('fsBanner'); if(b) b.style.display='block';
  }
  const _pc=document.getElementById('pwdCur'); if(_pc) _pc.textContent = ((store.get(PWD_KEY)||'').trim()!=='')? '当前：自定义口令' : '当前：默认口令';
}catch(e){
  _initErr('init', e);
}finally{
  // 登录门必须无条件绑定：即便上面任何渲染出错，也至少能进入系统（彻底避免“点击进入没反应”）
  try{ setupPwdGate(); }catch(e){ console.error('setupPwdGate',e); }
  try{ startAutoBackup(); }catch(e){}
}
})();
