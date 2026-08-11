

const DECADE_PLAN=[
  {y:2026,t:'安身立命：拿到够大够稳的平台（体制内 / 央企 / 海外增长平台），并完成云南探索可行性验证',open:true},
  {y:2027,t:'伴侣 + 结婚',open:false},
  {y:2028,t:'家庭与居所初定',open:false},
  {y:2029,t:'主业深耕，建立不可替代性',open:false},
  {y:2030,t:'副业 / 产品化收入从 0 到 1',open:false},
  {y:2031,t:'财富积累加速，为云南迁移蓄力',open:false},
  {y:2032,t:'换大运节点：复盘前十年，校正方向',open:false},
  {y:2033,t:'云南定居或长期旅居落地',open:false},
  {y:2034,t:'著书 / 工作室 / 稳定副业成型',open:false},
  {y:2035,t:'自由与体面并存，灯火长明',open:false}
];

/* ---------- 安全存储：避免沙箱/隐私模式下 setItem 抛错导致整页无响应 ---------- */
const SAVE_KEY = 'lifeRPG_mochen_v4';
const BACKUP_KEY = 'lifeRPG_restore_points_v1';
const SAVE_SCHEMA_VERSION = 6;
const PWD_KEY = 'lifeRPG_pwd';
// 访问口令：默认强口令（纯前端，只挡随手浏览，不挡查看源码）。可在设置页修改，修改后只存本机浏览器。
const PAGE_PWD_DEFAULT = 'mR9#pQ2$xL7!kVbN';
function effectivePwd(){ return (store.get(PWD_KEY) || '').trim() || PAGE_PWD_DEFAULT; }
let _dirty = false; // 是否有未落盘本地的更新（用于轮询自动备份）
const store = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k,v); return true; }catch(e){ return false; } },
};
let SAVE_OK = false;
let REC_DATE = '';            // 当前「记录于」日期（补录入口），空=今天

/* ---------- 本地文件持久化（File System Access API，仅 localhost/https 可用） ----------
   解决 file:// + localStorage 易丢失的问题：授权一次本地 save.json 后，每次保存自动落盘，
   清缓存 / 换浏览器都不丢。file:// 或不支持的浏览器自动降级为 localStorage 兜底。 */
const FS_AVAILABLE = ('showSaveFilePicker' in window);
let saveFileHandle = null;

const _idb = {
  _db:null,
  open(){ return new Promise((res,rej)=>{
    const r = indexedDB.open('lifeRPG_fs',1);
    r.onupgradeneeded = ()=>{ try{ r.result.createObjectStore('handles'); }catch(e){} };
    r.onsuccess = ()=>{ this._db=r.result; res(); };
    r.onerror = ()=>rej(r.error);
  });},
  async put(h){ try{ await this.open(); }catch(e){ return; }
    return new Promise((res,rej)=>{ try{
      const tx=this._db.transaction('handles','readwrite');
      tx.objectStore('handles').put(h,'save');
      tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error);
    }catch(e){ rej(e); } }); },
  async get(){ try{ await this.open(); }catch(e){ return null; }
    return new Promise((res)=>{ try{
      const tx=this._db.transaction('handles','readonly');
      const rq=tx.objectStore('handles').get('save');
      rq.onsuccess=()=>res(rq.result||null); rq.onerror=()=>res(null);
    }catch(e){ res(null); } }); }
};

async function chooseSaveFile(){
  if(!FS_AVAILABLE){ alert('当前环境不支持本地文件存档（需通过 http://localhost 或 https 打开）。请改用「导出存档」手动备份。'); return; }
  try{
    saveFileHandle = await window.showSaveFilePicker({
      suggestedName:'lifeRPG_save.json',
      types:[{description:'JSON 存档',accept:{'application/json':['.json']}}]
    });
    await _idb.put(saveFileHandle);
    await fsWrite();
    const b=document.getElementById('fsBanner'); if(b) b.remove();
    render();
    alert('已启用本地文件存档 ✅ 以后每次保存自动写入该文件，清缓存 / 换浏览器都不丢。');
  }catch(e){ if(e.name!=='AbortError') alert('选择失败：'+e.message); }
}

async function fsWrite(){
  if(!saveFileHandle) return false;
  try{
    const w = await saveFileHandle.createWritable();
    await w.write(JSON.stringify(S,null,2));
    await w.close();
    return true;
  }catch(e){ console.warn('写存档文件失败',e); return false; }
}

async function fsRead(){
  if(!saveFileHandle) return null;
  try{ const f = await saveFileHandle.getFile(); return await f.text(); }
  catch(e){ return null; }
}


const ATTRS = {
  BADMINTON:{name:'羽道',color:'var(--bm)',icon:'🏸',desc:'身法修行 · 羽毛球是你的人生主题'},
  CAREER:{name:'业道',color:'var(--career)',icon:'💼',desc:'术法修行 · 海外增长 / 市场 / AI'},
  BODY:{name:'体道',color:'var(--body)',icon:'💪',desc:'根基修行 · 力量 / 规律 / 早睡'},
  MIND:{name:'灵台',color:'var(--mind)',icon:'🎹',desc:'心性修行 · 琴歌 / 阅读 / 沉浸'},
};
const BADMINTON_LIFETIME_HOURS = 1649;
const LEDGER_BASELINE = {
  net: 181596.0,
  incomeTotal: 595469.0,
  expenseTotal: 413873.0,
  range: '2024-07-30 ~ 2026-07-30',
  expenseByCat: {"居家物业":115708.0, "兴趣爱好":86637.0, "饮食聚餐":53962.0, "学习进修":47829.0, "医疗保健":36858.0, "衣服饰品":23523.0, "人情往来":22075.0, "休闲娱乐":13218.0, "行车交通":12206.0, "交流通讯":1857.0},
  incomeByCat: {"职业收入":544491.0, "其他收入":50978.0},
  byYear: {"2024": {"income": 123086.0, "expense": 53799.5}, "2025": {"income": 431617.0, "expense": 288049.5}, "2026": {"income": 40766.0, "expense": 72024.0}}
};

/* ---------- 账户快照：随手记 App 净资产（2026-07-30） ---------- */
// 资产快照模板：仅结构占位，无真实余额、不含具体银行/保险产品名。
// 真实资产由用户首次在「数据&设置 → 💰 资产快照」录入，仅存本机浏览器（S.assets），公开文件不含真实数据。
const ASSETS_TEMPLATE = {
  date: '', total: 0, debt: 0, net: 0,
  accounts: [
    {name:'现金', group:'现金账户', value:0},
    {name:'银行卡', group:'储蓄账户', value:0},
    {name:'支付宝余额', group:'虚拟账户', value:0},
    {name:'微信钱包', group:'虚拟账户', value:0},
    {name:'医保卡', group:'虚拟账户', value:0},
    {name:'公积金', group:'投资账户', value:0},
    {name:'投资账户', group:'投资账户', value:0},
    {name:'定期存款', group:'投资账户', value:0},
    {name:'万能账户', group:'投资账户', value:0},
    {name:'理财账户1', group:'投资账户', value:0},
    {name:'理财账户2', group:'投资账户', value:0},
    {name:'理财账户3', group:'投资账户', value:0}
  ]
};

/* ---------- 历史继承（方案 B）：iHour 终身 4234h 折算为总等级底分 ---------- */
// 拆分口径（与 time-analysis.md 一致，按四大领域聚合）：
// 羽毛球 1649h → BADMINTON
// 身体/心理健康 881h + 体态教练 17h → BODY
// 职业发展 495h + 生涯教练转行 474h + 海外 48h → CAREER
// 艺术爱好 488h + 阅读 182h → MIND
// 四大领域之和 = 4234h。
const HISTORY_HOURS = { BADMINTON:1649, BODY:898, CAREER:1017, MIND:670 };
// 历史折算系数：每历史小时 × 版块权重 × 此系数 = 继承加权经验。调大→总等级更高。
// 为避免历史淹没每日打卡，历史作压缩折算（不与当前「分钟×1×权重」同口径，否则等级会爆到 Lv70+）。
const HISTORY_RATE = 2.5;
function inheritedXP(){
  let s=0; for(const k in HISTORY_HOURS) s += (HISTORY_HOURS[k]||0)*(S.weights[k]||1);
  return s*HISTORY_RATE;
}


function id(){return Math.random().toString(36).slice(2,9)}
function todayStr(){ const d=new Date(),p=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); } // 本地日期 YYYY-MM-DD
function fmtMD(s){ if(!s||s.length<10) return ''; const m=parseInt(s.slice(5,7),10), d=parseInt(s.slice(8,10),10); return m+'月'+d+'日'; } // 2026-07-30 → 7月30日
function fmtFull(d){ if(!(d instanceof Date)) d=new Date(); const wd=['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]; return d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日 · '+wd; }
function yesterdayStr(){const d=new Date();d.setDate(d.getDate()-1);const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());}
function monday(){const d=new Date();const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return d.toISOString().slice(0,10)}
function thisMonth(){return new Date().toISOString().slice(0,7)}
function lvlOf(xp){return Math.floor(Math.sqrt(xp/50))+1}
function xpInLvl(xp){const L=lvlOf(xp);const cur=(L-1)*(L-1)*50;const nxt=L*L*50;return{xp:Math.floor(xp-cur),need:nxt-cur,pct:Math.floor((xp-cur)/(nxt-cur)*100)}}
function h(m){return (m/60).toFixed(1)+'h'}
function safeAttr(a){return (a&&ATTRS[a])?a:'BODY';}  // 兜底：脏数据也不让渲染崩
/* 任务完成状态改为「按日期」存储：donedates=[日期], mins={日期:分钟}。
   这样补录历史某天、再切回今天，各自勾选互不干扰，已勾选会被自动复原。 */
function isDone(x,d){ d=d||REC_DATE||todayStr(); return !!(x&&Array.isArray(x.donedates)&&x.donedates.includes(d)); }
function setDone(x,d,val){ d=d||REC_DATE||todayStr(); if(!x.donedates)x.donedates=[]; if(!x.mins)x.mins={}; const i=x.donedates.indexOf(d); if(val&&i<0)x.donedates.push(d); if(!val&&i>=0)x.donedates.splice(i,1); }
function isDoneEver(x){ return !!(x&&Array.isArray(x.donedates)&&x.donedates.length>0); }   // 历史是否做过（用于进度条/里程碑，一次性步骤）
function lastDoneDate(x){ if(x&&Array.isArray(x.donedates)&&x.donedates.length) return [...x.donedates].sort().pop(); return ''; }
/* 低频疗愈类任务：间隔约束（v5.21.1 改为「组级」）
   旧实现把完成日期 lfDates 挂在任务对象上，而随机周游每周一 sampleFromBank 会生成全新对象、
   不继承历史 → 冷却跨周失效；且「按摩」和「理疗」是两个独立对象，互不约束 → 同周撞车。
   现在同类归入一个组，冷却历史写在 S.lfLog[组] 上，跨对象、跨周持久，并用于抽取互斥。 */
const LF_GROUPS=[
  {g:'heal', gap:21, label:'身体疗愈', re:/头疗|按摩|康复|理疗|推拿|体态评估/},
  {g:'eye',  gap:10, label:'眼部护理', re:/眼部护理|眼护/},
];
function lfGroupOf(item){
  if(!item) return null;
  if(item.lfGroup) return LF_GROUPS.find(x=>x.g===item.lfGroup)||null;
  const t=item.t||'';
  return LF_GROUPS.find(x=>x.re.test(t))||null;
}
function lfGapDays(item){
  if(item && item.minGapDays && item.minGapDays>0) return item.minGapDays;
  const g=lfGroupOf(item); return g?g.gap:0;
}
function lfLogOf(gk){
  if(!S.lfLog || typeof S.lfLog!=='object') S.lfLog={};
  if(!Array.isArray(S.lfLog[gk])) S.lfLog[gk]=[];
  return S.lfLog[gk];
}
// 组内最近一次完成日：组日志 ∪ 对象自带 lfDates（兼容老存档）
function lastLfDate(item){
  let out='';
  const g=lfGroupOf(item);
  if(g){ const ds=lfLogOf(g.g); if(ds.length){ const a=[...ds].sort().pop(); if(a>out) out=a; } }
  const own=(item&&item.lfDates)||[];
  if(own.length){ const b=[...own].sort().pop(); if(b>out) out=b; }
  return out;
}
function lfDaysLeft(item,d){
  const g=lfGapDays(item); if(!g) return 0;
  const last=lastLfDate(item); if(!last) return 0;
  const A=new Date(last+'T00:00:00'), B=new Date(d+'T00:00:00');
  const diff=Math.round((B-A)/86400000);
  return diff>=g?0:(g-diff);
}
// 组冷却剩余天数（抽取器用，不依赖具体任务对象）
function lfGroupDaysLeft(gk,d){
  const g=LF_GROUPS.find(x=>x.g===gk); if(!g) return 0;
  const ds=lfLogOf(gk); if(!ds.length) return 0;
  const last=[...ds].sort().pop();
  const diff=Math.round((new Date(d+'T00:00:00')-new Date(last+'T00:00:00'))/86400000);
  return diff>=g.gap?0:(g.gap-diff);
}
// 某天是否处在「近 n 日做过疗愈」窗口内（读组日志，跨对象有效）
function lfHealedWithin(d,n){
  for(const g of LF_GROUPS){
    for(const l of lfLogOf(g.g)){
      const gap=Math.round((new Date(d+'T00:00:00')-new Date(l+'T00:00:00'))/86400000);
      if(gap>=0 && gap<=n) return true;
    }
  }
  return false;
}
// 全局最近一次疗愈日期（组日志优先，回落到任务对象历史）
function lastHealDate(){
  let last='';
  LF_GROUPS.forEach(g=>{ const ds=lfLogOf(g.g); if(ds.length){ const a=[...ds].sort().pop(); if(a>last) last=a; } });
  try{ allTaskLists().forEach(list=>list.forEach(x=>{ const own=(x&&x.lfDates)||[]; if(own.length){ const b=[...own].sort().pop(); if(b>last) last=b; } })); }catch(e){}
  return last;
}
function itemXpAt(it,d){ d=d||REC_DATE||todayStr(); if(!it)return 0; return it.mode==='time'?((it.mins&&it.mins[d])||0)*RATE:(it.xp||0); }
function weightedXpAt(it,d){ return itemXpAt(it,d)*(S.weights[safeAttr(it.a)]||1); }
function itemXp(it){ return itemXpAt(it, REC_DATE||todayStr()); }
function weightedXp(it){ return weightedXpAt(it, REC_DATE||todayStr()); }
function overallXP(){
  let s=0;
  for(const k of Object.keys(ATTRS)) s += (S.attrs[k]||0)*(S.weights[k]||1);
  s += (S.bonusXP||0);
  s += inheritedXP();
  return s;
}
const RATE = 1; // 时间驱动型：每投入 1 分钟 = 1 原始经验（整体汇总时再乘版块权重）
function itemXp(it){ return it.mode==='time' ? (it.min||0)*RATE : (it.xp||0); }
function weightedXp(it){ return itemXp(it)*(S.weights[it.a]||1); }
function bmLevel(hours){return Math.floor(Math.sqrt(hours/50))+1}
function bmXpInLvl(hours){const L=bmLevel(hours);const cur=(L-1)*(L-1)*50;const nxt=L*L*50;return{pct:(hours-cur)/(nxt-cur)*100}}

function defaultHobbies(){
  // 平时兴趣爱好：状态 st → active 在玩 / sometimes 偶尔 / paused 暂歇
  return [
    {n:'羽毛球', ic:'🏸', st:'active'},
    {n:'钢琴', ic:'🎹', st:'active'},
    {n:'唱歌', ic:'🎤', st:'active'},
    {n:'力量健身', ic:'💪', st:'active'},
    {n:'古法健身', ic:'🧘', st:'active'},
    {n:'阅读小说', ic:'📖', st:'sometimes'},
    {n:'观影', ic:'🎬', st:'sometimes'},
  ];
}

function defaultWishes(){
  // 人生愿望副本：un=true 为已点亮（✔）。点徽章可切换点亮 / 待解锁。
  const raw = [
    ['人生', [
      ['稳定亲密关系',false],['500 万资产',false],['北京自己的房',false],['深耕有发展的主业',false],
      ['出一本书',false],['自己的工作室',false],
    ]],
    ['羽 · 琴 · 身', [
      ['一架真钢琴',false],['熟练弹 Summer',false],['熟练弹圣诞快乐劳伦斯',false],['钢琴视奏',false],
      ['钢琴 10 级',false],['羽毛球水平 4.0',false],['酒吧 / 街边驻唱',false],['体脂率 25 以下',false],
      ['体重 105 以下',false],['5 个引体向上',false],['会游泳',false],['一个爱好到 1 万小时',false],
      ['5000+ 音箱 / 黑胶机',false],['参加比赛（美舞之志）',true],['熟练弹梦婚',true],
    ]],
    ['读万卷书 · 行万里路', [
      ['读完所有书',false],['欧游（土耳其/瑞典/英/德/荷）',false],['去南极北极',false],['去日本',false],
      ['云南旅居',false],['去西藏',false],['去新疆',false],['去广西',false],['去贵州',false],['去川西',false],
      ['去海南',false],['体验话剧',false],['滑翔翼',false],['带父母出国',false],['带父母去云南',false],
      ['自驾带父母去张北',false],['看张学友演唱会',false],['看王菲演唱会',false],
    ]],
  ];
  const out=[];
  raw.forEach(([g,items])=>items.forEach(([t,un])=>out.push({g,t,un})));
  return out;
}

/* ---------- 装备库：数值生效型（非装饰） ---------- */
// 装备提供「领域经验加成」：穿上后在该领域修行获得经验 ×(1+bonus)。
// attr: 作用领域（BADMINTON/CAREER/BODY/MIND/ALL）；bonus: 加成倍率（0.1 = +10%）
const EQUIPS = [
  {id:'eq_racket',   name:'竞速球拍', icon:'🏸', attr:'BADMINTON', bonus:0.10, rarity:'稀有', desc:'羽道修行经验 +10%'},
  {id:'eq_handbook', name:'精进手册', icon:'📘', attr:'CAREER',    bonus:0.12, rarity:'稀有', desc:'业道修行经验 +12%'},
  {id:'eq_whey',     name:'蛋白补给', icon:'🥤', attr:'BODY',      bonus:0.08, rarity:'普通', desc:'体道修行经验 +8%'},
  {id:'eq_vinyl',    name:'黑胶唱片', icon:'💿', attr:'MIND',      bonus:0.12, rarity:'稀有', desc:'灵台修行经验 +12%'},
  {id:'eq_ring',     name:'专注指环', icon:'💍', attr:'ALL',       bonus:0.05, rarity:'史诗', desc:'全领域经验 +5%'},
  {id:'eq_cloak',    name:'旅行斗篷', icon:'🧥', attr:'ALL',       bonus:0.06, rarity:'传说', desc:'全领域经验 +6%'},
];
function findEquip(eid){
  return EQUIPS.find(e=>e.id===eid) || (S.customEquips||[]).find(e=>e.id===eid);
}
// 当前已装备对某领域的经验加成倍率（同类装备每领域仅 1 件，ALL 计入全领域）
function equipBonusFor(attr){
  let b=0;
  (S.equips.equipped||[]).forEach(eid=>{
    const e=findEquip(eid);
    if(e && (e.attr===attr || e.attr==='ALL')) b+=(e.bonus||0);
  });
  return b;
}

/* ---------- 随机掉落 · 自助嘉奖 ---------- */
// 按成本分级：micro(微) < small(小) < medium(中) < big(大)。小成就小奖励，大成就大奖励。
const REWARDS = [
  {id:'r_cake',    name:'一块蛋糕',        icon:'🍰', tier:'micro',  money:30,   time:0.5, desc:'小确幸'},
  {id:'r_milktea', name:'一杯奶茶',        icon:'🧋', tier:'micro',  money:25,   time:0.3, desc:'小确幸'},
  {id:'r_book',    name:'一本想要的书',    icon:'📚', tier:'micro',  money:60,   time:0.5, desc:'精神食粮'},
  {id:'r_meal',    name:'一顿喜欢的大餐',  icon:'🍲', tier:'small',  money:200,  time:2,   desc:'犒劳胃'},
  {id:'r_movie',   name:'一场电影',        icon:'🎬', tier:'small',  money:80,   time:3,   desc:'放松一下'},
  {id:'r_spa',     name:'一次按摩SPA',     icon:'💆', tier:'medium', money:600,  time:2,   desc:'身体回血'},
  {id:'r_gear',    name:'一件心仪的数码',  icon:'🎧', tier:'medium', money:800,  time:2,   desc:'心动物件'},
  {id:'r_sneaker', name:'一双喜欢的球鞋',  icon:'👟', tier:'big',    money:1200, time:3,   desc:'运动装备升级'},
  {id:'r_concert', name:'一场演唱会',      icon:'🎤', tier:'big',    money:1500, time:5,   desc:'现场快乐'},
  {id:'r_trip',    name:'一次周末短途旅行',icon:'🚆', tier:'big',    money:1500, time:48,  desc:'换个环境充能'},
];
function findReward(rid){ return REWARDS.find(r=>r.id===rid) || (S.customRewards||[]).find(r=>r.id===rid); }
// 掉落一个指定分级的奖励到嘉奖箱；micro/small 受每日上限（3 次）限制，避免刷屏
function dropReward(tier, reason){
  const pool=REWARDS.filter(r=>r.tier===tier);
  if(!pool.length) return null;
  if(tier==='micro' || tier==='small'){
    const k=todayStr();
    if(S.rewards.dailyDate!==k){ S.rewards.dailyDate=k; S.rewards.dailyCount=0; }
    if(S.rewards.dailyCount>=3) return null;
    S.rewards.dailyCount++;
  }
  const r=pool[Math.floor(Math.random()*pool.length)];
  const drop={rewardId:r.id, ts:new Date().toISOString().slice(0,16).replace('T',' '), tier, reason:reason||''};
  S.rewards.drops.push(drop);
  return drop;
}
function claimReward(idx){
  const drop=S.rewards.drops[idx];
  if(!drop || drop.claimed) return;
  drop.claimed=true;
  drop.claimedAt=new Date().toISOString().slice(0,16).replace('T',' ');
}

// 旅行地图：可解锁的地点目录（经纬度用于投影定位；wish=true 为人生愿望目的地）
const TRAVEL_PLACES = [
  {id:'beijing',    name:'北京',   sub:'家',        region:'国内', zone:'cn', lat:39.90, lng:116.40, wish:false},
  {id:'yunnan',     name:'云南',   sub:'昆大丽',     region:'国内', zone:'cn', lat:25.04, lng:102.71, wish:true},
  {id:'xizang',     name:'西藏',   sub:'拉萨',       region:'国内', zone:'cn', lat:29.65, lng:91.13,  wish:true},
  {id:'xinjiang',   name:'新疆',   sub:'乌鲁木齐',   region:'国内', zone:'cn', lat:43.83, lng:87.62,  wish:true},
  {id:'chuanxi',    name:'川西',   sub:'成都',       region:'国内', zone:'cn', lat:30.57, lng:104.07, wish:true},
  {id:'guizhou',    name:'贵州',   sub:'贵阳',       region:'国内', zone:'cn', lat:26.65, lng:106.63, wish:true},
  {id:'guangxi',    name:'广西',   sub:'桂林',       region:'国内', zone:'cn', lat:25.27, lng:110.29, wish:true},
  {id:'hainan',     name:'海南',   sub:'海口',       region:'国内', zone:'cn', lat:20.04, lng:110.32, wish:true},
  {id:'zhangbei',   name:'张北',   sub:'草原天路',   region:'国内', zone:'cn', lat:41.16, lng:114.71, wish:true},
  {id:'japan',      name:'日本',   sub:'东京',       region:'亚洲', zone:'sea', lat:35.68, lng:139.69, wish:true},
  {id:'turkey',     name:'土耳其', sub:'伊斯坦布尔', region:'欧亚', zone:'eu', lat:41.01, lng:28.98,  wish:true},
  {id:'sweden',     name:'瑞典',   sub:'斯德哥尔摩', region:'欧洲', zone:'eu', lat:59.33, lng:18.07,  wish:true},
  {id:'uk',         name:'英国',   sub:'伦敦',       region:'欧洲', zone:'eu', lat:51.51, lng:-0.13,  wish:true},
  {id:'germany',    name:'德国',   sub:'柏林',       region:'欧洲', zone:'eu', lat:52.52, lng:13.40,  wish:true},
  {id:'netherlands',name:'荷兰',   sub:'阿姆斯特丹', region:'欧洲', zone:'eu', lat:52.37, lng:4.90,   wish:true},
  {id:'antarctica', name:'南极',   sub:'南极洲',     region:'极地', zone:'s', lat:-80,   lng:0,      wish:true},
  {id:'arctic',     name:'北极',   sub:'北冰洋',     region:'极地', zone:'n', lat:85,    lng:0,      wish:true},
  {id:'xian',      name:'西安',   sub:'陕西',       region:'国内', zone:'cn', lat:34.34, lng:108.94, wish:false},
  {id:'dunhuang',  name:'敦煌',   sub:'甘肃',       region:'国内', zone:'cn', lat:40.14, lng:94.66,  wish:false},
  {id:'zhangjiajie',name:'张家界',sub:'湖南',       region:'国内', zone:'cn', lat:29.12, lng:110.48, wish:false},
  {id:'xiamen',    name:'厦门',   sub:'福建',       region:'国内', zone:'cn', lat:24.46, lng:118.10, wish:false},
  {id:'harbin',    name:'哈尔滨', sub:'黑龙江',     region:'国内', zone:'cn', lat:45.76, lng:126.64, wish:false},
  {id:'xining',    name:'西宁',   sub:'青海',       region:'国内', zone:'cn', lat:36.62, lng:101.78, wish:false},
];

// 旅行地图分区（顶部切换）：用 viewBox 放大世界投影对应的子区域，引脚只显示本区地点
const MAP_TABS = [
  {id:'cn', name:'中国',   bounds:[[80,125],[18,50]]},
  {id:'sea',name:'东南亚', bounds:[[-20,160],[-40,60]], note:'含东亚/南亚/中亚/非洲/大洋洲'},
  {id:'eu', name:'欧洲',   bounds:[[-30,55],[30,80]]},
  {id:'am', name:'美洲',   bounds:[[-175,-25],[-60,80]]},
  {id:'au', name:'澳洲',   bounds:[[105,185],[-55,5]]},
  {id:'n',  name:'北极洲', pole:'N'},
  {id:'s',  name:'南极洲', pole:'S'},
];
const CITY_COORDS = [{"n":"北京","py":"beijing|bj","en":"beijing","lng":116.4,"lat":39.9,"zone":"cn","region":"中国·北京"},{"n":"上海","py":"shanghai|sh","en":"shanghai","lng":121.47,"lat":31.23,"zone":"cn","region":"中国·上海"},{"n":"天津","py":"tianjin|tj","en":"tianjin","lng":117.2,"lat":39.13,"zone":"cn","region":"中国·天津"},{"n":"重庆","py":"chongqing|cq","en":"chongqing","lng":106.55,"lat":29.56,"zone":"cn","region":"中国·重庆"},{"n":"石家庄","py":"shijiazhuang|sjz","en":"shijiazhuang","lng":114.51,"lat":38.04,"zone":"cn","region":"中国·河北"},{"n":"太原","py":"taiyuan|ty","en":"taiyuan","lng":112.55,"lat":37.87,"zone":"cn","region":"中国·山西"},{"n":"呼和浩特","py":"huhehaote|hhht","en":"hohhot","lng":111.75,"lat":40.84,"zone":"cn","region":"中国·内蒙古"},{"n":"沈阳","py":"shenyang|sy","en":"shenyang","lng":123.43,"lat":41.8,"zone":"cn","region":"中国·辽宁"},{"n":"长春","py":"changchun|cc","en":"changchun","lng":125.32,"lat":43.82,"zone":"sea","region":"中国·吉林"},{"n":"哈尔滨","py":"haerbin|heb","en":"harbin","lng":126.53,"lat":45.8,"zone":"sea","region":"中国·黑龙江"},{"n":"南京","py":"nanjing|nj","en":"nanjing","lng":118.78,"lat":32.06,"zone":"cn","region":"中国·江苏"},{"n":"杭州","py":"hangzhou|hz","en":"hangzhou","lng":120.15,"lat":30.27,"zone":"cn","region":"中国·浙江"},{"n":"合肥","py":"hefei|hf","en":"hefei","lng":117.27,"lat":31.86,"zone":"cn","region":"中国·安徽"},{"n":"福州","py":"fuzhou|fz","en":"fuzhou","lng":119.3,"lat":26.08,"zone":"cn","region":"中国·福建"},{"n":"南昌","py":"nanchang|nc","en":"nanchang","lng":115.86,"lat":28.68,"zone":"cn","region":"中国·江西"},{"n":"济南","py":"jinan|jn","en":"jinan","lng":117,"lat":36.65,"zone":"cn","region":"中国·山东"},{"n":"郑州","py":"zhengzhou|zz","en":"zhengzhou","lng":113.62,"lat":34.75,"zone":"cn","region":"中国·河南"},{"n":"武汉","py":"wuhan|wh","en":"wuhan","lng":114.3,"lat":30.59,"zone":"cn","region":"中国·湖北"},{"n":"长沙","py":"changsha|cs","en":"changsha","lng":112.94,"lat":28.23,"zone":"cn","region":"中国·湖南"},{"n":"广州","py":"guangzhou|gz","en":"guangzhou","lng":113.26,"lat":23.13,"zone":"cn","region":"中国·广东"},{"n":"南宁","py":"nanning|nn","en":"nanning","lng":108.37,"lat":22.82,"zone":"cn","region":"中国·广西"},{"n":"海口","py":"haikou|hk","en":"haikou","lng":110.2,"lat":20.04,"zone":"cn","region":"中国·海南"},{"n":"成都","py":"chengdu|cd","en":"chengdu","lng":104.07,"lat":30.57,"zone":"cn","region":"中国·四川"},{"n":"贵阳","py":"guiyang|gy","en":"guiyang","lng":106.63,"lat":26.65,"zone":"cn","region":"中国·贵州"},{"n":"昆明","py":"kunming|km","en":"kunming","lng":102.83,"lat":24.88,"zone":"cn","region":"中国·云南"},{"n":"拉萨","py":"lasa|ls","en":"lhasa","lng":91.13,"lat":29.65,"zone":"cn","region":"中国·西藏"},{"n":"西安","py":"xian|xa","en":"xian","lng":108.94,"lat":34.34,"zone":"cn","region":"中国·陕西"},{"n":"兰州","py":"lanzhou|lz","en":"lanzhou","lng":103.83,"lat":36.06,"zone":"cn","region":"中国·甘肃"},{"n":"西宁","py":"xining|xn","en":"xining","lng":101.78,"lat":36.62,"zone":"cn","region":"中国·青海"},{"n":"银川","py":"yinchuan|yc","en":"yinchuan","lng":106.27,"lat":38.47,"zone":"cn","region":"中国·宁夏"},{"n":"乌鲁木齐","py":"wulumuqi|wlmq","en":"urumqi","lng":87.62,"lat":43.83,"zone":"cn","region":"中国·新疆"},{"n":"香港","py":"xianggang|xg","en":"hongkong","lng":114.17,"lat":22.32,"zone":"cn","region":"中国·香港"},{"n":"澳门","py":"aomen|am","en":"macau","lng":113.55,"lat":22.2,"zone":"cn","region":"中国·澳门"},{"n":"台北","py":"taibei|tb","en":"taipei","lng":121.56,"lat":25.04,"zone":"cn","region":"中国·台湾"},{"n":"深圳","py":"shenzhen|sz","en":"shenzhen","lng":114.06,"lat":22.54,"zone":"cn","region":"中国·广东"},{"n":"苏州","py":"suzhou|sz","en":"suzhou","lng":120.62,"lat":31.3,"zone":"cn","region":"中国·江苏"},{"n":"无锡","py":"wuxi|wx","en":"wuxi","lng":120.3,"lat":31.57,"zone":"cn","region":"中国·江苏"},{"n":"常州","py":"changzhou|cz","en":"changzhou","lng":119.95,"lat":31.79,"zone":"cn","region":"中国·江苏"},{"n":"宁波","py":"ningbo|nb","en":"ningbo","lng":121.55,"lat":29.87,"zone":"cn","region":"中国·浙江"},{"n":"温州","py":"wenzhou|wz","en":"wenzhou","lng":120.7,"lat":28,"zone":"cn","region":"中国·浙江"},{"n":"绍兴","py":"shaoxing|sx","en":"shaoxing","lng":120.58,"lat":30.01,"zone":"cn","region":"中国·浙江"},{"n":"厦门","py":"xiamen|xm","en":"xiamen","lng":118.09,"lat":24.48,"zone":"cn","region":"中国·福建"},{"n":"泉州","py":"quanzhou|qz","en":"quanzhou","lng":118.58,"lat":24.91,"zone":"cn","region":"中国·福建"},{"n":"珠海","py":"zhuhai|zh","en":"zhuhai","lng":113.55,"lat":22.27,"zone":"cn","region":"中国·广东"},{"n":"中山","py":"zhongshan|zs","en":"zhongshan","lng":113.39,"lat":22.52,"zone":"cn","region":"中国·广东"},{"n":"东莞","py":"dongguan|dg","en":"dongguan","lng":113.75,"lat":23.02,"zone":"cn","region":"中国·广东"},{"n":"佛山","py":"foshan|fs","en":"foshan","lng":113.12,"lat":23.02,"zone":"cn","region":"中国·广东"},{"n":"桂林","py":"guilin|gl","en":"guilin","lng":110.29,"lat":25.27,"zone":"cn","region":"中国·广西"},{"n":"三亚","py":"sanya|sy","en":"sanya","lng":109.51,"lat":18.25,"zone":"cn","region":"中国·海南"},{"n":"大理","py":"dali|dl","en":"dali","lng":100.23,"lat":25.6,"zone":"cn","region":"中国·云南"},{"n":"丽江","py":"lijiang|lj","en":"lijiang","lng":100.23,"lat":26.86,"zone":"cn","region":"中国·云南"},{"n":"香格里拉","py":"xianggelila|xgll","en":"shangri-la","lng":99.71,"lat":27.83,"zone":"cn","region":"中国·云南"},{"n":"腾冲","py":"tengchong|tc","en":"tengchong","lng":98.51,"lat":25.02,"zone":"cn","region":"中国·云南"},{"n":"西双版纳","py":"xishuangbanna|xsbn","en":"xishuangbanna","lng":100.8,"lat":22,"zone":"cn","region":"中国·云南"},{"n":"青岛","py":"qingdao|qd","en":"qingdao","lng":120.38,"lat":36.07,"zone":"cn","region":"中国·山东"},{"n":"烟台","py":"yantai|yt","en":"yantai","lng":121.39,"lat":37.54,"zone":"cn","region":"中国·山东"},{"n":"威海","py":"weihai|wh","en":"weihai","lng":122.12,"lat":37.51,"zone":"cn","region":"中国·山东"},{"n":"泰安","py":"taian|ta","en":"taian","lng":117.13,"lat":36.25,"zone":"cn","region":"中国·山东"},{"n":"曲阜","py":"qufu|qf","en":"qufu","lng":116.99,"lat":35.58,"zone":"cn","region":"中国·山东"},{"n":"蓬莱","py":"penglai|pl","en":"penglai","lng":120.75,"lat":37.8,"zone":"cn","region":"中国·山东"},{"n":"黄山","py":"huangshan|hs","en":"huangshan","lng":118.34,"lat":30.13,"zone":"cn","region":"中国·安徽"},{"n":"九华山","py":"jiuhuashan|jhs","en":"jiuhuashan","lng":117.8,"lat":30.48,"zone":"cn","region":"中国·安徽"},{"n":"庐山","py":"lushan|ls","en":"lushan","lng":115.97,"lat":29.55,"zone":"cn","region":"中国·江西"},{"n":"井冈山","py":"jinggangshan|jgs","en":"jinggangshan","lng":114.17,"lat":26.57,"zone":"cn","region":"中国·江西"},{"n":"武夷山","py":"wuyishan|wys","en":"wuyishan","lng":118.03,"lat":27.72,"zone":"cn","region":"中国·福建"},{"n":"张家界","py":"zhangjiajie|zjj","en":"zhangjiajie","lng":110.48,"lat":29.12,"zone":"cn","region":"中国·湖南"},{"n":"凤凰","py":"fenghuang|fh","en":"fenghuang","lng":109.6,"lat":27.95,"zone":"cn","region":"中国·湖南"},{"n":"岳阳","py":"yueyang|yy","en":"yueyang","lng":113.13,"lat":29.37,"zone":"cn","region":"中国·湖南"},{"n":"韶山","py":"shaoshan|ss","en":"shaoshan","lng":112.53,"lat":27.92,"zone":"cn","region":"中国·湖南"},{"n":"衡山","py":"hengshan|hs","en":"hengshan","lng":112.74,"lat":27.31,"zone":"cn","region":"中国·湖南"},{"n":"敦煌","py":"dunhuang|dh","en":"dunhuang","lng":94.66,"lat":40.14,"zone":"cn","region":"中国·甘肃"},{"n":"嘉峪关","py":"jiayuguan|jyg","en":"jiayuguan","lng":98.29,"lat":39.77,"zone":"cn","region":"中国·甘肃"},{"n":"张掖","py":"zhangye|zy","en":"zhangye","lng":100.45,"lat":38.93,"zone":"cn","region":"中国·甘肃"},{"n":"天水","py":"tianshui|ts","en":"tianshui","lng":105.72,"lat":34.58,"zone":"cn","region":"中国·甘肃"},{"n":"酒泉","py":"jiuquan|jq","en":"jiuquan","lng":98.51,"lat":39.74,"zone":"cn","region":"中国·甘肃"},{"n":"武威","py":"wuwei|ww","en":"wuwei","lng":102.63,"lat":37.93,"zone":"cn","region":"中国·甘肃"},{"n":"青海湖","py":"qinghaihu|qhh","en":"qinghaihu","lng":100.2,"lat":36.9,"zone":"cn","region":"中国·青海"},{"n":"茶卡盐湖","py":"chakayanhu|ckyh","en":"chakasalt","lng":99.08,"lat":36.78,"zone":"cn","region":"中国·青海"},{"n":"呼伦贝尔","py":"hulunbeier|hlbe","en":"hulunbuir","lng":119.77,"lat":49.21,"zone":"cn","region":"中国·内蒙古"},{"n":"满洲里","py":"manzhouli|mzl","en":"manzhouli","lng":117.43,"lat":49.58,"zone":"cn","region":"中国·内蒙古"},{"n":"漠河","py":"mohe|mh","en":"mohe","lng":122.37,"lat":52.97,"zone":"sea","region":"中国·黑龙江"},{"n":"延吉","py":"yanji|yj","en":"yanji","lng":129.51,"lat":42.91,"zone":"sea","region":"中国·吉林"},{"n":"长白山","py":"changbaishan|cbs","en":"changbaishan","lng":128.06,"lat":42.07,"zone":"sea","region":"中国·吉林"},{"n":"北戴河","py":"beidaihe|bdh","en":"beidaihe","lng":119.48,"lat":39.83,"zone":"cn","region":"中国·河北"},{"n":"承德","py":"chengde|cd","en":"chengde","lng":117.96,"lat":40.95,"zone":"cn","region":"中国·河北"},{"n":"大同","py":"datong|dt","en":"datong","lng":113.3,"lat":40.08,"zone":"cn","region":"中国·山西"},{"n":"平遥","py":"pingyao|py","en":"pingyao","lng":112.18,"lat":37.2,"zone":"cn","region":"中国·山西"},{"n":"开封","py":"kaifeng|kf","en":"kaifeng","lng":114.34,"lat":34.8,"zone":"cn","region":"中国·河南"},{"n":"洛阳","py":"luoyang|ly","en":"luoyang","lng":112.45,"lat":34.62,"zone":"cn","region":"中国·河南"},{"n":"景德镇","py":"jingdezhen|jdz","en":"jingdezhen","lng":117.18,"lat":29.27,"zone":"cn","region":"中国·江西"},{"n":"婺源","py":"wuyuan|wy","en":"wuyuan","lng":117.85,"lat":29.25,"zone":"cn","region":"中国·江西"},{"n":"三清山","py":"sanqingshan|sqs","en":"sanqingshan","lng":118.07,"lat":28.95,"zone":"cn","region":"中国·江西"},{"n":"龙虎山","py":"longhushan|lhs","en":"longhushan","lng":116.96,"lat":28.07,"zone":"cn","region":"中国·江西"},{"n":"千岛湖","py":"qiandaohu|qdh","en":"qiandaohu","lng":119.07,"lat":29.61,"zone":"cn","region":"中国·浙江"},{"n":"普陀山","py":"putuoshan|pts","en":"putuoshan","lng":122.4,"lat":30.02,"zone":"cn","region":"中国·浙江"},{"n":"莫干山","py":"moganshan|mgs","en":"moganshan","lng":119.84,"lat":30.61,"zone":"cn","region":"中国·浙江"},{"n":"乌镇","py":"wuzhen|wz","en":"wuzhen","lng":120.49,"lat":30.74,"zone":"cn","region":"中国·浙江"},{"n":"西塘","py":"xitang|xt","en":"xitang","lng":120.89,"lat":30.95,"zone":"cn","region":"中国·浙江"},{"n":"南浔","py":"nanxun|nx","en":"nanxun","lng":120.42,"lat":30.88,"zone":"cn","region":"中国·浙江"},{"n":"同里","py":"tongli|tl","en":"tongli","lng":120.72,"lat":31.16,"zone":"cn","region":"中国·江苏"},{"n":"周庄","py":"zhouzhuang|zz","en":"zhouzhuang","lng":120.85,"lat":31.11,"zone":"cn","region":"中国·江苏"},{"n":"都江堰","py":"doujiangyan|djy","en":"dujiangyan","lng":103.62,"lat":31,"zone":"cn","region":"中国·四川"},{"n":"峨眉山","py":"emeishan|ems","en":"emeishan","lng":103.34,"lat":29.52,"zone":"cn","region":"中国·四川"},{"n":"乐山","py":"leshan|ls","en":"leshan","lng":103.77,"lat":29.55,"zone":"cn","region":"中国·四川"},{"n":"九寨沟","py":"jiuzhaigou|jzg","en":"jiuzhaigou","lng":103.92,"lat":33.26,"zone":"cn","region":"中国·四川"},{"n":"黄龙","py":"huanglong|hl","en":"huanglong","lng":103.82,"lat":32.75,"zone":"cn","region":"中国·四川"},{"n":"稻城亚丁","py":"daochengyading|dcyd","en":"daocheng","lng":100.3,"lat":29,"zone":"cn","region":"中国·四川"},{"n":"色达","py":"seda|sd","en":"seda","lng":100,"lat":32.3,"zone":"cn","region":"中国·四川"},{"n":"林芝","py":"linzhi|lz","en":"linzhi","lng":94.36,"lat":29.65,"zone":"cn","region":"中国·西藏"},{"n":"日喀则","py":"rikaze|rkz","en":"shigatse","lng":88.88,"lat":29.27,"zone":"cn","region":"中国·西藏"},{"n":"喀什","py":"kashi|ks","en":"kashgar","lng":75.99,"lat":39.47,"zone":"sea","region":"中国·新疆"},{"n":"吐鲁番","py":"tulufan|tlf","en":"turpan","lng":89.18,"lat":42.95,"zone":"cn","region":"中国·新疆"},{"n":"伊宁","py":"yining|yn","en":"yining","lng":81.33,"lat":43.92,"zone":"cn","region":"中国·新疆"},{"n":"布尔津","py":"buerjin|bej","en":"burqin","lng":86.85,"lat":47.7,"zone":"cn","region":"中国·新疆"},{"n":"克拉玛依","py":"kelamayi|klmy","en":"karamay","lng":84.89,"lat":45.6,"zone":"cn","region":"中国·新疆"},{"n":"和田","py":"hetian|ht","en":"hotan","lng":79.92,"lat":37.11,"zone":"sea","region":"中国·新疆"},{"n":"阿克苏","py":"akesu|aks","en":"aksu","lng":80.27,"lat":41.17,"zone":"cn","region":"中国·新疆"},{"n":"库尔勒","py":"kuerle|kel","en":"korla","lng":86.15,"lat":41.76,"zone":"cn","region":"中国·新疆"},{"n":"哈密","py":"hami|hm","en":"hami","lng":93.51,"lat":42.83,"zone":"cn","region":"中国·新疆"},{"n":"包头","py":"baotou|bt","en":"baotou","lng":109.84,"lat":40.66,"zone":"cn","region":"中国·内蒙古"},{"n":"鄂尔多斯","py":"eerduosi|eeds","en":"ordos","lng":109.78,"lat":39.61,"zone":"cn","region":"中国·内蒙古"},{"n":"东京","py":"dongjing|dj","en":"tokyo","lng":139.69,"lat":35.68,"zone":"sea","region":"日本"},{"n":"大阪","py":"daban|db","en":"osaka","lng":135.5,"lat":34.69,"zone":"sea","region":"日本"},{"n":"京都","py":"jingdu|jd","en":"kyoto","lng":135.77,"lat":35.01,"zone":"sea","region":"日本"},{"n":"北海道","py":"beihaidao|bhd","en":"hokkaido","lng":141.35,"lat":43.06,"zone":"sea","region":"日本"},{"n":"札幌","py":"zhahuang|zh","en":"sapporo","lng":141.35,"lat":43.06,"zone":"sea","region":"日本"},{"n":"富士山","py":"fushishan|fss","en":"fuji","lng":138.73,"lat":35.36,"zone":"sea","region":"日本"},{"n":"冲绳","py":"chongsheng|cs","en":"okinawa","lng":127.68,"lat":26.21,"zone":"sea","region":"日本"},{"n":"名古屋","py":"mingguwu|mgw","en":"nagoya","lng":136.91,"lat":35.18,"zone":"sea","region":"日本"},{"n":"横滨","py":"hengbin|hb","en":"yokohama","lng":139.64,"lat":35.44,"zone":"sea","region":"日本"},{"n":"奈良","py":"nailiang|nl","en":"nara","lng":135.8,"lat":34.69,"zone":"sea","region":"日本"},{"n":"福冈","py":"fugang|fg","en":"fukuoka","lng":130.4,"lat":33.59,"zone":"sea","region":"日本"},{"n":"首尔","py":"shouer|se","en":"seoul","lng":126.98,"lat":37.57,"zone":"sea","region":"韩国"},{"n":"釜山","py":"fushan|bs","en":"busan","lng":129.08,"lat":35.18,"zone":"sea","region":"韩国"},{"n":"济州岛","py":"jizhudao|jzd","en":"jeju","lng":126.49,"lat":33.49,"zone":"sea","region":"韩国"},{"n":"乌兰巴托","py":"wulanbatuo|wlbt","en":"ulaanbaatar","lng":106.91,"lat":47.92,"zone":"cn","region":"蒙古"},{"n":"河内","py":"henei|hn","en":"hanoi","lng":105.83,"lat":21.03,"zone":"cn","region":"越南"},{"n":"胡志明市","py":"huzhimingshi|hzms","en":"hochiminh","lng":106.66,"lat":10.82,"zone":"sea","region":"越南"},{"n":"芽庄","py":"yazhuang|yz","en":"nhatrang","lng":109.22,"lat":12.25,"zone":"sea","region":"越南"},{"n":"岘港","py":"xiangang|xg","en":"danang","lng":108.22,"lat":16.05,"zone":"sea","region":"越南"},{"n":"金边","py":"jinbian|jb","en":"phnompenh","lng":104.92,"lat":11.56,"zone":"sea","region":"柬埔寨"},{"n":"吴哥窟","py":"wugeku|wgk","en":"angkorter","lng":103.86,"lat":13.41,"zone":"sea","region":"柬埔寨"},{"n":"万象","py":"wanxiang|wx","en":"vientiane","lng":102.61,"lat":17.97,"zone":"sea","region":"老挝"},{"n":"曼谷","py":"mangu|mg","en":"bangkok","lng":100.5,"lat":13.75,"zone":"sea","region":"泰国"},{"n":"清迈","py":"qingmai|qm","en":"chiangmai","lng":98.99,"lat":18.79,"zone":"cn","region":"泰国"},{"n":"普吉岛","py":"pujidao|pjd","en":"phuket","lng":98.34,"lat":7.88,"zone":"sea","region":"泰国"},{"n":"苏梅岛","py":"sumeidao|smd","en":"samui","lng":99.96,"lat":9.51,"zone":"sea","region":"泰国"},{"n":"新加坡","py":"xinjiapo|xjp","en":"singapore","lng":103.82,"lat":1.35,"zone":"sea","region":"新加坡"},{"n":"吉隆坡","py":"jilongpo|jlp","en":"kualalumpur","lng":101.69,"lat":3.14,"zone":"sea","region":"马来西亚"},{"n":"槟城","py":"bincheng|bc","en":"penang","lng":100.33,"lat":5.41,"zone":"sea","region":"马来西亚"},{"n":"兰卡威","py":"lankawei|lkw","en":"langkawi","lng":99.83,"lat":6.31,"zone":"sea","region":"马来西亚"},{"n":"巴厘岛","py":"balidao|bld","en":"bali","lng":115.17,"lat":-8.65,"zone":"au","region":"印尼"},{"n":"雅加达","py":"yajiada|yjd","en":"jakarta","lng":106.85,"lat":-6.21,"zone":"au","region":"印尼"},{"n":"日惹","py":"riye|ry","en":"yogyakarta","lng":110.36,"lat":-7.78,"zone":"au","region":"印尼"},{"n":"泗水","py":"sishui|ss","en":"surabaya","lng":112.75,"lat":-7.26,"zone":"au","region":"印尼"},{"n":"马尼拉","py":"manila|mnl","en":"manila","lng":120.98,"lat":14.6,"zone":"sea","region":"菲律宾"},{"n":"宿务","py":"suwu|sw","en":"cebu","lng":123.89,"lat":10.31,"zone":"sea","region":"菲律宾"},{"n":"仰光","py":"yangguang|yg","en":"yangon","lng":96.2,"lat":16.87,"zone":"sea","region":"缅甸"},{"n":"蒲甘","py":"pugan|pg","en":"bagan","lng":94.86,"lat":21.17,"zone":"cn","region":"缅甸"},{"n":"文莱","py":"wenlai|wl","en":"brunei","lng":114.94,"lat":4.94,"zone":"au","region":"文莱"},{"n":"东帝汶","py":"dongdimu|ddm","en":"timor","lng":125.57,"lat":-8.56,"zone":"au","region":"东帝汶"},{"n":"加德满都","py":"jiademandu|gdmd","en":"kathmandu","lng":85.32,"lat":27.72,"zone":"cn","region":"尼泊尔"},{"n":"博克拉","py":"bokela|bkl","en":"pokhara","lng":83.99,"lat":28.21,"zone":"cn","region":"尼泊尔"},{"n":"廷布","py":"tingbu|tb","en":"thimphu","lng":89.64,"lat":27.47,"zone":"cn","region":"不丹"},{"n":"新德里","py":"xindeli|xdl","en":"newdelhi","lng":77.21,"lat":28.61,"zone":"sea","region":"印度"},{"n":"孟买","py":"mengmai|mm","en":"mumbai","lng":72.83,"lat":19.08,"zone":"sea","region":"印度"},{"n":"班加罗尔","py":"banjialuoer|bjle","en":"bangalore","lng":77.59,"lat":12.97,"zone":"sea","region":"印度"},{"n":"加尔各答","py":"jiaerjieda|jejd","en":"kolkata","lng":88.36,"lat":22.57,"zone":"cn","region":"印度"},{"n":"斋普尔","py":"zhaipuer|zpe","en":"jaipur","lng":75.79,"lat":26.91,"zone":"sea","region":"印度"},{"n":"阿格拉","py":"agela|agl","en":"agra","lng":78.01,"lat":27.18,"zone":"sea","region":"印度"},{"n":"科伦坡","py":"kelunpo|klp","en":"colombo","lng":79.86,"lat":6.93,"zone":"sea","region":"斯里兰卡"},{"n":"马尔代夫","py":"maerdaifu|medf","en":"maldives","lng":73.51,"lat":4.18,"zone":"sea","region":"马尔代夫"},{"n":"达卡","py":"daka|dk","en":"dhaka","lng":90.41,"lat":23.81,"zone":"cn","region":"孟加拉"},{"n":"阿拉木图","py":"alamutu|almt","en":"almaty","lng":76.89,"lat":43.24,"zone":"sea","region":"哈萨克斯坦"},{"n":"塔什干","py":"tashen|tsg","en":"tashkent","lng":69.24,"lat":41.31,"zone":"sea","region":"乌兹别克斯坦"},{"n":"撒马尔罕","py":"samuerhan|smeh","en":"samarkand","lng":66.97,"lat":39.65,"zone":"sea","region":"乌兹别克斯坦"},{"n":"比什凯克","py":"bishikaike|bskk","en":"bishkek","lng":74.6,"lat":42.87,"zone":"sea","region":"吉尔吉斯斯坦"},{"n":"阿什哈巴德","py":"ashihabade|ashbd","en":"ashgabat","lng":58.38,"lat":37.95,"zone":"sea","region":"土库曼斯坦"},{"n":"迪拜","py":"dibai|db","en":"dubai","lng":55.27,"lat":25.2,"zone":"sea","region":"阿联酋"},{"n":"阿布扎比","py":"abuzhabi|abzb","en":"abudhabi","lng":54.37,"lat":24.45,"zone":"sea","region":"阿联酋"},{"n":"多哈","py":"duoha|dh","en":"doha","lng":51.53,"lat":25.29,"zone":"sea","region":"卡塔尔"},{"n":"利雅得","py":"liyade|lyd","en":"riyadh","lng":46.72,"lat":24.69,"zone":"sea","region":"沙特"},{"n":"麦加","py":"maijia|mj","en":"mecca","lng":39.83,"lat":21.39,"zone":"sea","region":"沙特"},{"n":"伊斯坦布尔","py":"yisitanbao|ystb","en":"istanbul","lng":28.98,"lat":41.01,"zone":"eu","region":"土耳其"},{"n":"安卡拉","py":"ankala|ank","en":"ankara","lng":32.85,"lat":39.93,"zone":"eu","region":"土耳其"},{"n":"伦敦","py":"londun|ld","en":"london","lng":-0.13,"lat":51.51,"zone":"eu","region":"英国"},{"n":"爱丁堡","py":"aidingbao|adb","en":"edinburgh","lng":-3.19,"lat":55.95,"zone":"eu","region":"英国"},{"n":"曼彻斯特","py":"manchest","en":"manchester","lng":-2.24,"lat":53.48,"zone":"eu","region":"英国"},{"n":"都柏林","py":"dubolin|dbl","en":"dublin","lng":-6.26,"lat":53.35,"zone":"eu","region":"爱尔兰"},{"n":"巴黎","py":"bali|bl","en":"paris","lng":2.35,"lat":48.86,"zone":"eu","region":"法国"},{"n":"尼斯","py":"nisi|ns","en":"nice","lng":7.27,"lat":43.7,"zone":"eu","region":"法国"},{"n":"里昂","py":"liang|ly","en":"lyon","lng":4.83,"lat":45.76,"zone":"eu","region":"法国"},{"n":"阿姆斯特丹","py":"amustedan|amstd","en":"amsterdam","lng":4.9,"lat":52.37,"zone":"eu","region":"荷兰"},{"n":"布鲁塞尔","py":"bulusaier|blse","en":"brussels","lng":4.35,"lat":50.85,"zone":"eu","region":"比利时"},{"n":"卢森堡","py":"lusenbao|lsb","en":"luxembourg","lng":6.13,"lat":49.61,"zone":"eu","region":"卢森堡"},{"n":"柏林","py":"bailin|bl","en":"berlin","lng":13.4,"lat":52.52,"zone":"eu","region":"德国"},{"n":"慕尼黑","py":"munnihe|mnh","en":"munich","lng":11.58,"lat":48.14,"zone":"eu","region":"德国"},{"n":"法兰克福","py":"falankfu|flkf","en":"frankfurt","lng":8.68,"lat":50.11,"zone":"eu","region":"德国"},{"n":"汉堡","py":"hanbao|hb","en":"hamburg","lng":9.99,"lat":53.55,"zone":"eu","region":"德国"},{"n":"科隆","py":"kelong|kl","en":"cologne","lng":6.96,"lat":50.94,"zone":"eu","region":"德国"},{"n":"维也纳","py":"weiyena|wyn","en":"vienna","lng":16.37,"lat":48.21,"zone":"eu","region":"奥地利"},{"n":"萨尔茨堡","py":"saercibao|secb","en":"salzburg","lng":13.05,"lat":47.8,"zone":"eu","region":"奥地利"},{"n":"苏黎世","py":"sulishi|sls","en":"zurich","lng":8.54,"lat":47.37,"zone":"eu","region":"瑞士"},{"n":"日内瓦","py":"rineiwa|rnw","en":"geneva","lng":6.14,"lat":46.2,"zone":"eu","region":"瑞士"},{"n":"巴塞尔","py":"basaier|bse","en":"basel","lng":7.59,"lat":47.56,"zone":"eu","region":"瑞士"},{"n":"罗马","py":"luoma|lm","en":"rome","lng":12.5,"lat":41.9,"zone":"eu","region":"意大利"},{"n":"米兰","py":"milan|ml","en":"milan","lng":9.19,"lat":45.46,"zone":"eu","region":"意大利"},{"n":"威尼斯","py":"weinisi|wns","en":"venice","lng":12.34,"lat":45.44,"zone":"eu","region":"意大利"},{"n":"佛罗伦萨","py":"fuluolunsa|flls","en":"florence","lng":11.26,"lat":43.77,"zone":"eu","region":"意大利"},{"n":"那不勒斯","py":"nabulesi|nbls","en":"naples","lng":14.27,"lat":40.85,"zone":"eu","region":"意大利"},{"n":"马德里","py":"madili|mdl","en":"madrid","lng":-3.7,"lat":40.42,"zone":"eu","region":"西班牙"},{"n":"巴塞罗那","py":"basailuona|bsln","en":"barcelona","lng":2.17,"lat":41.39,"zone":"eu","region":"西班牙"},{"n":"塞维利亚","py":"saiweiliya|swly","en":"seville","lng":-5.99,"lat":37.39,"zone":"eu","region":"西班牙"},{"n":"里斯本","py":"lisben|lsb","en":"lisbon","lng":-9.14,"lat":38.72,"zone":"eu","region":"葡萄牙"},{"n":"波尔图","py":"boertu|bet","en":"porto","lng":-8.61,"lat":41.15,"zone":"eu","region":"葡萄牙"},{"n":"哥本哈根","py":"gebenhagen|gbhg","en":"copenhagen","lng":12.57,"lat":55.68,"zone":"eu","region":"丹麦"},{"n":"奥斯陆","py":"aosilu|asl","en":"oslo","lng":10.75,"lat":59.91,"zone":"eu","region":"挪威"},{"n":"斯德哥尔摩","py":"sidegeermo|sdgelm","en":"stockholm","lng":18.07,"lat":59.33,"zone":"eu","region":"瑞典"},{"n":"哥德堡","py":"gedebao|gdb","en":"gothenburg","lng":11.97,"lat":57.71,"zone":"eu","region":"瑞典"},{"n":"赫尔辛基","py":"heerxinji|hexj","en":"helsinki","lng":24.94,"lat":60.17,"zone":"eu","region":"芬兰"},{"n":"雷克雅未克","py":"leikeyaweike|lkywk","en":"reykjavik","lng":-21.94,"lat":64.15,"zone":"eu","region":"冰岛"},{"n":"卑尔根","py":"beiergen|beg","en":"bergen","lng":5.32,"lat":60.39,"zone":"eu","region":"挪威"},{"n":"莫斯科","py":"mosike|msk","en":"moscow","lng":37.62,"lat":55.75,"zone":"eu","region":"俄罗斯"},{"n":"圣彼得堡","py":"shengbidebao|spdb","en":"stpetersburg","lng":30.34,"lat":59.93,"zone":"eu","region":"俄罗斯"},{"n":"喀山","py":"kashan|ks","en":"kazan","lng":49.1,"lat":55.79,"zone":"eu","region":"俄罗斯"},{"n":"索契","py":"suochi|sc","en":"sochi","lng":39.73,"lat":43.6,"zone":"eu","region":"俄罗斯"},{"n":"明斯克","py":"mingsike|msk","en":"minsk","lng":27.56,"lat":53.9,"zone":"eu","region":"白俄罗斯"},{"n":"基辅","py":"jiufu|jf","en":"kyiv","lng":30.52,"lat":50.45,"zone":"eu","region":"乌克兰"},{"n":"华沙","py":"huasha|hs","en":"warsaw","lng":21.01,"lat":52.23,"zone":"eu","region":"波兰"},{"n":"克拉科夫","py":"kelakufu|klkf","en":"krakow","lng":19.94,"lat":50.06,"zone":"eu","region":"波兰"},{"n":"布拉格","py":"bulage|bld","en":"prague","lng":14.42,"lat":50.08,"zone":"eu","region":"捷克"},{"n":"布达佩斯","py":"budapeisi|bdps","en":"budapest","lng":19.04,"lat":47.5,"zone":"eu","region":"匈牙利"},{"n":"雅典","py":"yadian|yd","en":"athens","lng":23.73,"lat":37.98,"zone":"eu","region":"希腊"},{"n":"圣托里尼","py":"shengtuolinen|stln","en":"santorini","lng":25.43,"lat":36.39,"zone":"eu","region":"希腊"},{"n":"开罗","py":"kailuo|kl","en":"cairo","lng":31.24,"lat":30.04,"zone":"eu","region":"埃及"},{"n":"亚历山大","py":"yalishanda|ylsd","en":"alexandria","lng":29.92,"lat":31.2,"zone":"eu","region":"埃及"},{"n":"卡萨布兰卡","py":"kasabulanka|ksblk","en":"casablanca","lng":-7.59,"lat":33.57,"zone":"eu","region":"摩洛哥"},{"n":"马拉喀什","py":"malakesi|mlks","en":"marrakech","lng":-8.01,"lat":31.63,"zone":"eu","region":"摩洛哥"},{"n":"突尼斯","py":"tunisi|tns","en":"tunis","lng":10.19,"lat":36.8,"zone":"eu","region":"突尼斯"},{"n":"阿尔及尔","py":"aerjier|aeje","en":"algiers","lng":3.06,"lat":36.75,"zone":"eu","region":"阿尔及利亚"},{"n":"纽约","py":"niuyue|ny","en":"newyork","lng":-74.01,"lat":40.71,"zone":"am","region":"美国"},{"n":"华盛顿","py":"huashengdun|hsd","en":"washington","lng":-77.04,"lat":38.91,"zone":"am","region":"美国"},{"n":"波士顿","py":"boshidun|bsd","en":"boston","lng":-71.06,"lat":42.36,"zone":"am","region":"美国"},{"n":"费城","py":"feicheng|fc","en":"philadelphia","lng":-75.16,"lat":39.95,"zone":"am","region":"美国"},{"n":"芝加哥","py":"zhijiage|zjg","en":"chicago","lng":-87.63,"lat":41.88,"zone":"am","region":"美国"},{"n":"迈阿密","py":"maiami|mam","en":"miami","lng":-80.19,"lat":25.76,"zone":"am","region":"美国"},{"n":"奥兰多","py":"aolanduo|ald","en":"orlando","lng":-81.38,"lat":28.54,"zone":"am","region":"美国"},{"n":"拉斯维加斯","py":"lasweiijiasi|lswjs","en":"lasvegas","lng":-115.14,"lat":36.17,"zone":"am","region":"美国"},{"n":"洛杉矶","py":"luoshanji|lsj","en":"losangeles","lng":-118.24,"lat":34.05,"zone":"am","region":"美国"},{"n":"旧金山","py":"jiujinshan|jjs","en":"sanfrancisco","lng":-122.42,"lat":37.77,"zone":"am","region":"美国"},{"n":"圣何塞","py":"shenghejie|shj","en":"sanjose","lng":-121.89,"lat":37.34,"zone":"am","region":"美国"},{"n":"西雅图","py":"xiyatu|xyt","en":"seattle","lng":-122.33,"lat":47.61,"zone":"am","region":"美国"},{"n":"圣地亚哥","py":"shengdiyage|sdyg","en":"sandiego","lng":-117.16,"lat":32.72,"zone":"am","region":"美国"},{"n":"丹佛","py":"danfo|df","en":"denver","lng":-104.99,"lat":39.74,"zone":"am","region":"美国"},{"n":"新奥尔良","py":"xinaoerliang|xoel","en":"neworleans","lng":-90.07,"lat":29.95,"zone":"am","region":"美国"},{"n":"波特兰","py":"botelan|btl","en":"portland","lng":-122.68,"lat":45.52,"zone":"am","region":"美国"},{"n":"夏威夷","py":"xiaweiyi|xwy","en":"hawaii","lng":-157.86,"lat":21.31,"zone":"am","region":"美国"},{"n":"多伦多","py":"duolunduo|dld","en":"toronto","lng":-79.38,"lat":43.65,"zone":"am","region":"加拿大"},{"n":"温哥华","py":"wenhuahua|whh","en":"vancouver","lng":-123.12,"lat":49.28,"zone":"am","region":"加拿大"},{"n":"蒙特利尔","py":"mengtelier|mtle","en":"montreal","lng":-73.57,"lat":45.5,"zone":"am","region":"加拿大"},{"n":"墨西哥城","py":"moxige|mxgc","en":"mexicocity","lng":-99.13,"lat":19.43,"zone":"am","region":"墨西哥"},{"n":"坎昆","py":"kunkun|kk","en":"cancun","lng":-86.85,"lat":21.16,"zone":"am","region":"墨西哥"},{"n":"哈瓦那","py":"hawana|hwn","en":"havana","lng":-82.38,"lat":23.11,"zone":"am","region":"古巴"},{"n":"巴拿马城","py":"banamacheng|bnmc","en":"panama","lng":-79.52,"lat":8.98,"zone":"am","region":"巴拿马"},{"n":"哥斯达黎加","py":"gesidalijia|gsdlj","en":"costarica","lng":-84.08,"lat":9.93,"zone":"am","region":"哥斯达黎加"},{"n":"利马","py":"lima|lm","en":"lima","lng":-77.04,"lat":-12.05,"zone":"am","region":"秘鲁"},{"n":"库斯科","py":"kusike|ksk","en":"cusco","lng":-71.97,"lat":-13.53,"zone":"am","region":"秘鲁"},{"n":"马丘比丘","py":"maqiubiqiu|mqbq","en":"machupicchu","lng":-72.55,"lat":-13.16,"zone":"am","region":"秘鲁"},{"n":"拉巴斯","py":"labasi|lbs","en":"lapaz","lng":-68.12,"lat":-16.5,"zone":"am","region":"玻利维亚"},{"n":"圣保罗","py":"shengbaoluo|sbli","en":"saopaulo","lng":-46.63,"lat":-23.55,"zone":"am","region":"巴西"},{"n":"里约热内卢","py":"liyuerenlilu|lyrln","en":"rio","lng":-43.17,"lat":-22.91,"zone":"am","region":"巴西"},{"n":"布宜诺斯艾利斯","py":"buyinuosiailis|bnosael","en":"buenosaires","lng":-58.38,"lat":-34.6,"zone":"am","region":"阿根廷"},{"n":"乌斯怀亚","py":"wusihuaiya|wshy","en":"ushuaia","lng":-68.31,"lat":-54.8,"zone":"am","region":"阿根廷"},{"n":"复活节岛","py":"fuhuojiedao|fhjd","en":"easterisland","lng":-109.43,"lat":-27.12,"zone":"am","region":"智利"},{"n":"加拉帕戈斯","py":"jialapagesi|jlpgs","en":"galapagos","lng":-90.72,"lat":-0.74,"zone":"am","region":"厄瓜多尔"},{"n":"悉尼","py":"xini|xn","en":"sydney","lng":151.21,"lat":-33.87,"zone":"au","region":"澳大利亚"},{"n":"墨尔本","py":"moerben|meb","en":"melbourne","lng":144.96,"lat":-37.81,"zone":"au","region":"澳大利亚"},{"n":"布里斯班","py":"bulisiban|blsb","en":"brisbane","lng":153.03,"lat":-27.47,"zone":"au","region":"澳大利亚"},{"n":"珀斯","py":"posi|ps","en":"perth","lng":115.86,"lat":-31.95,"zone":"au","region":"澳大利亚"},{"n":"阿德莱德","py":"adelaide|adld","en":"adelaide","lng":138.6,"lat":-34.93,"zone":"au","region":"澳大利亚"},{"n":"堪培拉","py":"kanpeila|kpl","en":"canberra","lng":149.13,"lat":-35.28,"zone":"au","region":"澳大利亚"},{"n":"黄金海岸","py":"huangjinhaian|hjha","en":"goldcoast","lng":153.43,"lat":-28,"zone":"au","region":"澳大利亚"},{"n":"大堡礁","py":"dabaojiao|dbj","en":"greatbarrierreef","lng":147.7,"lat":-18.3,"zone":"au","region":"澳大利亚"},{"n":"凯恩斯","py":"kaiensi|kes","en":"cairns","lng":145.78,"lat":-16.92,"zone":"au","region":"澳大利亚"},{"n":"奥克兰","py":"aokelan|akl","en":"auckland","lng":174.76,"lat":-36.85,"zone":"au","region":"新西兰"},{"n":"皇后镇","py":"huanghouzhen|hhz","en":"queenstown","lng":168.66,"lat":-45.03,"zone":"au","region":"新西兰"},{"n":"基督城","py":"jiduzcheng|jdc","en":"christchurch","lng":172.64,"lat":-43.53,"zone":"au","region":"新西兰"},{"n":"惠灵顿","py":"huilingdun|hld","en":"wellington","lng":174.78,"lat":-41.29,"zone":"au","region":"新西兰"},{"n":"斐济","py":"feiji|fj","en":"fiji","lng":178.44,"lat":-18.14,"zone":"au","region":"斐济"},{"n":"大溪地","py":"daxidi|dxd","en":"tahiti","lng":-149.56,"lat":-17.54,"zone":"am","region":"法属波利尼西亚"},{"n":"关岛","py":"guandao|gd","en":"guam","lng":144.79,"lat":13.44,"zone":"sea","region":"美国"},{"n":"塞班岛","py":"saibandao|sbd","en":"saipan","lng":145.75,"lat":15.2,"zone":"sea","region":"美国"},{"n":"北极点","py":"beijidian|bjd","en":"northpole","lng":0,"lat":90,"zone":"n","region":"北极"},{"n":"北极","py":"beiji|bj","en":"arctic","lng":0,"lat":85,"zone":"n","region":"北极"},{"n":"格陵兰","py":"gelinnan|gln","en":"greenland","lng":-51.69,"lat":64.18,"zone":"am","region":"格陵兰"},{"n":"斯瓦尔巴","py":"siwabaer|swbe","en":"svalbard","lng":15.65,"lat":78.22,"zone":"n","region":"挪威"},{"n":"南极点","py":"nanjidian|njd","en":"southpole","lng":0,"lat":-90,"zone":"s","region":"南极"},{"n":"南极","py":"nanji|nj","en":"antarctic","lng":0,"lat":-80,"zone":"s","region":"南极"},{"n":"喜马拉雅","py":"ximalaya|xml","en":"himalaya","lng":86.93,"lat":27.99,"zone":"cn","region":"中国·西藏"},{"n":"珠穆朗玛峰","py":"zhumulangmafeng|zmlmf","en":"everest","lng":86.93,"lat":27.99,"zone":"cn","region":"中国·西藏"},{"n":"阿尔卑斯","py":"aerbeisi|abs","en":"alps","lng":9,"lat":46.5,"zone":"eu","region":"欧洲"},{"n":"死海","py":"sihai|sh","en":"deadsea","lng":35.5,"lat":31.5,"zone":"eu","region":"约旦"},{"n":"冰岛","py":"bingdao|iceland","en":"reykjavik","lng":-21.94,"lat":64.13,"zone":"eu","region":"欧洲·冰岛"},{"n":"因特拉肯","py":"yintelaken|interlaken","en":"interlaken","lng":7.86,"lat":46.69,"zone":"eu","region":"欧洲·瑞士"},{"n":"内罗毕","py":"neiluobi|nairobi","en":"nairobi","lng":36.82,"lat":-1.29,"zone":"sea","region":"非洲·肯尼亚"},{"n":"清莱","py":"qinglai|chiangrai","en":"chiangrai","lng":99.89,"lat":19.91,"zone":"cn","region":"亚洲·泰国"},{"n":"琅勃拉邦","py":"langbolabang|luangprabang","en":"luangprabang","lng":102.13,"lat":19.89,"zone":"cn","region":"亚洲·老挝"},{"n":"斯里兰卡","py":"sililanka|srilanka","en":"srilanka","lng":80.77,"lat":7.87,"zone":"sea","region":"亚洲·斯里兰卡"},{"n":"尼泊尔","py":"niboer|nepal","en":"nepal","lng":85.32,"lat":27.72,"zone":"cn","region":"亚洲·尼泊尔"},{"n":"不丹","py":"budan|bhutan","en":"bhutan","lng":89.74,"lat":27.47,"zone":"cn","region":"亚洲·不丹"},{"n":"格鲁吉亚","py":"gelujiya|georgia","en":"georgia","lng":44.83,"lat":41.72,"zone":"eu","region":"亚洲·格鲁吉亚"},{"n":"卡帕多奇亚","py":"kapaduoqiya|cappadocia","en":"cappadocia","lng":34.68,"lat":38.64,"zone":"eu","region":"亚洲·土耳其"},{"n":"阿拉斯加","py":"alasijia|alaska","en":"alaska","lng":-149.9,"lat":61.22,"zone":"am","region":"美洲·美国"},{"n":"黄石公园","py":"huangshigongyuan|yellowstone","en":"yellowstone","lng":-110.99,"lat":44.6,"zone":"am","region":"美洲·美国"},{"n":"古巴","py":"guba|cuba","en":"cuba","lng":-77.78,"lat":23.11,"zone":"am","region":"美洲·古巴"},{"n":"秘鲁","py":"bilu|peru","en":"peru","lng":-77.04,"lat":-12.04,"zone":"am","region":"美洲·秘鲁"},{"n":"玻利维亚","py":"boliweiya|bolivia","en":"bolivia","lng":-68.15,"lat":-16.5,"zone":"am","region":"美洲·玻利维亚"},{"n":"乞力马扎罗","py":"qilimazharo|kilimanjaro","en":"kilimanjaro","lng":37.35,"lat":-3.07,"zone":"sea","region":"非洲·坦桑尼亚"},{"n":"塞舌尔","py":"shesheer|seychelles","en":"seychelles","lng":55.49,"lat":-4.62,"zone":"sea","region":"非洲·塞舌尔"},{"n":"毛里求斯","py":"maoliqiusi|mauritius","en":"mauritius","lng":57.55,"lat":-20.35,"zone":"sea","region":"非洲·毛里求斯"},{"n":"开普敦","py":"kaipudun|capeown|capetown","en":"capetown","lng":18.42,"lat":-33.92,"zone":"sea","region":"非洲·南非"}];

function norm(s){ return (s||'').toString().toLowerCase().replace(/\s+/g,'').replace(/[省市州县区县自治区特别行政区]/g,''); }
function findCoord(q){
  q=norm(q); if(!q) return [];
  const res=[];
  CITY_COORDS.forEach((c,idx)=>{
    const n=norm(c.n), py=(c.py||'').toLowerCase(), en=(c.en||'').toLowerCase();
    let score=-1;
    if(n===q) score=100;
    else if(n.includes(q)||q.includes(n)) score=80;
    else if(py && py.split('|').some(p=>p.startsWith(q)||p.includes(q))) score=70;
    else if(en && (en.includes(q)||q.includes(en))) score=68;
    if(score>0) res.push(Object.assign({score,_i:idx},c));
  });
  res.sort((a,b)=> (b.score-a.score) || (a.n.length-b.n.length) || (a._i-b._i));
  return res.slice(0,8);
}
function zoneName(z){ const t=MAP_TABS.find(t=>t.id===z); return t?t.name:z; }
function geoZoneFor(lng,lat){
  if(lat>=66) return 'n';
  if(lat<=-60) return 's';
  if(lng>=80&&lng<=125&&lat>=18&&lat<=50) return 'cn';
  if(lng>=-30&&lng<=55&&lat>=30&&lat<=80) return 'eu';
  if(lng>=-175&&lng<=-25&&lat>=-60&&lat<=80) return 'am';
  if(lng>=105&&lng<=185&&lat>=-55&&lat<=5) return 'au';
  return 'sea';
}
function defaultGoals(){
  return [
    {id:id(),ic:'🏸',n:'羽毛球',cur:1649,total:10000,paused:false,milestones:[
      {label:'基本功 300h',thr:300},{label:'千小时',thr:1000},{label:'1500h',thr:1500},
      {label:'水平达 3.5',skill:true,reached:false,auto:()=>!!(S.year[1]&&yearDone(1))},{label:'5000h',thr:5000},{label:'万小时大师',thr:10000}]},
    {id:id(),ic:'💪',n:'身体健康',cur:898,total:3000,paused:false,milestones:[
      {label:'500h',thr:500},{label:'千小时',thr:1000},{label:'2000h',thr:2000},{label:'3000h',thr:3000}]},
    {id:id(),ic:'💼',n:'职业发展',cur:1017,total:2000,paused:false,milestones:[
      {label:'500h',thr:500},{label:'千小时',thr:1000},{label:'2000h',thr:2000}]},
    {id:id(),ic:'🎤',n:'生涯教练转行',cur:474,total:2000,paused:true,milestones:[
      {label:'500h',thr:500},{label:'千小时',thr:1000},{label:'2000h',thr:2000}]},
    {id:id(),ic:'🎹',n:'精神享受（钢琴/唱歌/阅读/播客）',cur:670,total:1500,paused:false,milestones:[
      {label:'500h',thr:500},{label:'千小时',thr:1000},{label:'1500h',thr:1500}]},
    {id:id(),ic:'🏔',n:'云南探索',cur:0,total:30,paused:false,milestones:[
      {label:'7天',thr:7},{label:'15天',thr:15},{label:'30天',thr:30}]},
  ];
}
function defaultSupps(){
  const base=['维生素D','镁','鱼油','维生素C','氨糖','姜黄饮','姜黄奶','羽衣甘蓝粉','奇亚籽','甜菜根粉','电解质粉'];
  return base.map(t=>({id:id(),t,a:'BODY',xp:5,min:0,mode:'fixed',donedates:[],mins:{}}));
}
function defaultSideBank(){
  const D=[
    ['给一位朋友发信息，真心关心近况','社交'],
    ['给家人打个视频 / 电话 10 分钟','社交'],
    ['约朋友出来喝杯东西、聊聊天','社交'],
    ['录一段自己满意的人声 / 弹唱发小红书','创作'],
    ['写一段随笔或日记（哪怕 3 行）','创作'],
    ['拍一张自己喜欢的照片发动态','创作'],
    ['学一小段新曲子 / 新和弦','创作'],
    ['化个全妆出门走一圈','美丽'],
    ['穿上自己最喜欢的裙子','美丽'],
    ['认真护肤 15 分钟（面膜 / 精华）','美丽'],
    ['涂个喜欢的口红再出门','美丽'],
    ['睡前泡脚放松 15 分钟','疗愈'],
    ['给自己做个面膜','疗愈'],
    ['听一首老歌，静静坐着','疗愈'],
    ['抱起土豆 / Pepper 撸 10 分钟','灵宠'],
    ['用逗猫棒陪猫玩 5 分钟','灵宠'],
    ['给猫梳个毛','灵宠'],
    ['给猫拍张萌照存手机','灵宠'],
    ['做 10 分钟脸部操','养生'],
    ['站起来拉伸 10 分钟','养生'],
    ['闭眼静坐 / 冥想 10 分钟','养生'],
    ['喝够水 + 早点睡','养生'],
    ['做一组核心 / 臀桥训练','养生'],
    ['对镜笑一个，夸自己一句','日常'],
    ['记下今天一个开心瞬间','日常'],
    ['整理书桌 / 床铺 5 分钟','日常'],
    ['给植物浇个水','日常'],
    ['睡前拉伸 5 分钟','日常'],
    ['今晚去楼下公园散个步','探索'],
    ['认真做一顿自己喜欢的饭','探索'],
  ].map(([t,cat])=>({id:id(),t,cat,type:'daily',xp:8,src:'preset',w:1}));
  const W=[
    ['去和一个男生约会（咖啡 / 饭 / 展览都行）','社交'],
    ['约朋友周末出来聚一次','社交'],
    ['去做一次 80 分钟全身按摩','疗愈'],
    ['去做一次康复 / 理疗','疗愈'],
    ['去做一次头疗','疗愈'],
    ['去做一次眼部护理','疗愈'],
    ['本周抽一天去骑车 1h','探索'],
    ['本周去一家没去过的店 / 餐厅','探索'],
    ['本周看一部老电影','探索'],
    ['本周手写一封信 / 卡片寄给在意的人','探索'],
    ['本周去公园长走 30 分钟','探索'],
    ['本周录一首完整满意的歌发小红书','创作'],
    ['本周读完一本书的 20 页','创作'],
    ['本周安排一次全身护肤 / 美甲','美丽'],
    ['本周做一次大扫除','养生'],
    ['本周不许打车（公交 / 地铁 / 骑车 / 走路）','纪律'],
  ].map(([t,cat])=>({id:id(),t,cat,type:'weekly',xp:25,src:'preset',w:1}));
  const M=[
    ['本月不许买衣服','纪律'],
    ['本月不许买新包 / 新鞋','纪律'],
    ['本月每天记录一笔支出','纪律'],
    ['本月每周复盘一次消费','纪律'],
    ['本月清理一次衣柜，只留真心喜欢的','日常'],
    ['本月安排一次短途出行 / staycation','探索'],
    ['本月读完一本书','创作'],
  ].map(([t,cat])=>({id:id(),t,cat,type:'monthly',xp:60,src:'preset',w:1}));
  // 消费纪律日任务
  D.push(
    {id:id(),t:'今日不许叫外卖（自己做饭 / 下楼吃）',cat:'纪律',type:'daily',xp:8,src:'preset',w:1},
    {id:id(),t:'今日只花现金 / 只用一张卡，关闭其他支付方式',cat:'纪律',type:'daily',xp:8,src:'preset',w:1},
    {id:id(),t:'今日记录每一笔支出',cat:'纪律',type:'daily',xp:8,src:'preset',w:1}
  );
  return [...D,...W,...M];
}
const CAT_COLOR={社交:'#e98b8b',创作:'#a89be6',美丽:'#f0b24c',疗愈:'#7ed3a8',灵宠:'#5bbcd6',养生:'#9ccc65',日常:'#b0a8d0',探索:'#ff9f6b',纪律:'#d4a84b',灵感:'#e98b8b'};
// 大运序列（丁火 · 乙亥 壬午 丁丑 乙巳，约 7.5 岁起运，十年一步顺排）。宜/忌依「丁火喜金水清凉」通用调候，仅供参考。
const DAYUN=[
  {n:'癸未', y0:2002, y1:2012, yi:'扎根学习 · 积累基本功', ji:'急于求成'},
  {n:'甲申', y0:2012, y1:2022, yi:'开拓视野 · 专业起步', ji:'犹豫不决'},
  {n:'乙酉', y0:2022, y1:2032, yi:'静守精进 · 稳健积累 · 理财规划', ji:'冲动扩张 · 为他人背书 · 高风险投机', note:'金旺为喜用。收敛蓄力、把专业做深做厚，才是本运主线；关系上少替人担责，财务上重安全边际。'},
  {n:'丙戌', y0:2032, y1:2042, yi:'沉淀转化 · 把成果落定', ji:'急躁冒进 · 火土燥热耗神'},
  {n:'丁亥', y0:2042, y1:2052, yi:'舒展关系 · 享受生活', ji:'过度操劳'},
  {n:'戊子', y0:2052, y1:2062, yi:'守成传灯 · 慢生活', ji:'强出头'},
  {n:'己丑', y0:2062, y1:2072, yi:'养护身心 · 稳定节奏', ji:'透支'},
  {n:'庚寅', y0:2072, y1:2082, yi:'顺势而为 · 轻装前行', ji:'执念过重'},
];
function sampleFromBank(type,n){
  const d=todayStr();
  /* v5.21.1 低频疗愈互斥：
     ① 手动周目标 / 日任务里已有同组任务 → 本次不再抽同组（避免「按摩」和「理疗」同时在场）
     ② 该组仍在 21 天冷却内 → 不抽
     ③ 同一批里同组最多 1 条 */
  const occupied=new Set();
  if(type==='weekly'){
    [S.weekly,S.daily].forEach(arr=>(arr||[]).forEach(x=>{ const g=lfGroupOf(x); if(g) occupied.add(g.g); }));
  }
  const pool=(S.sideBank||[]).filter(b=>{
    if(b.type!==type || (b.w||1)<=0) return false;
    const g=lfGroupOf(b);
    if(g){
      if(occupied.has(g.g)) return false;
      if(lfGroupDaysLeft(g.g,d)>0) return false;
    }
    return true;
  });
  const out=[], used=new Set(), gTaken=new Set();
  while(out.length<n && used.size<pool.length){
    const avail=pool.filter(b=>{
      if(used.has(b.id)) return false;
      const g=lfGroupOf(b);
      return !(g && gTaken.has(g.g));
    });
    if(!avail.length) break;                       // 同组已占满时避免死循环
    const tot=avail.reduce((s,b)=>s+(b.w||1),0);
    let r=Math.random()*tot, pick=avail[0];
    for(const b of avail){ r-=(b.w||1); if(r<=0){pick=b;break;} }
    used.add(pick.id);
    const pg=lfGroupOf(pick); if(pg) gTaken.add(pg.g);
    out.push({id:id(),bid:pick.id,t:pick.t,cat:pick.cat,type,xp:pick.xp,mandatory:false,done:false,mood:0,like:false});
  }
  return out;
}
function refreshSideQuests(){
  const t=todayStr(), wk=monday(), mo=thisMonth();
  if(S.sideMeta.dailyDate!==t){ S.sideDaily=sampleFromBank('daily',4); S.sideMeta.dailyDate=t; }
  if(S.sideMeta.weeklyKey!==wk){ S.sideWeekly=sampleFromBank('weekly',3); S.sideMeta.weeklyKey=wk; }
  if(S.sideMeta.monthlyKey!==mo){ S.sideMonthly=sampleFromBank('monthly',2); S.sideMeta.monthlyKey=mo; }
}

function defaultState(){
  const d = new Date().toISOString().slice(0,10);
  return {
    _meta:{schema:SAVE_SCHEMA_VERSION,app:'life-rpg',updated:''},
    bonusXP:0, streak:0, lastActiveDay:'', activeDays:[], history:[], pushToken:'',
    profile:{birthYear:1995, lifeExpect:85},  // 人生时间轴：出生年份、预期寿命（岁），用于余生横幅与命理时间轴
    lfLog:{},        // 低频疗愈组冷却日志：{heal:[日期...], eye:[...]}，跨任务对象持久
    migLf211:false,  // 必须为 false：load() 用 Object.assign(defaultState(), 老存档)，若默认 true 会覆盖掉老存档的缺失值，迁移将永不执行
    weights:{BADMINTON:1.3,CAREER:1.5,BODY:1.1,MIND:1.0},
    attrs:{BADMINTON:0,CAREER:0,BODY:0,MIND:0},
    daily:[
      {id:id(),t:'力量训练（按课表）',a:'BODY',xp:0,min:20,mode:'time',done:false,rec:20},
      {id:id(),t:'羽毛球基本功',a:'BADMINTON',xp:0,min:15,mode:'time',done:false,rec:15},
      {id:id(),t:'羽毛球视频学习',a:'BADMINTON',xp:0,min:15,mode:'time',done:false,rec:15},
      {id:id(),t:'羽毛球训练/打球',a:'BADMINTON',xp:0,min:30,mode:'time',done:false,rec:30},
      {id:id(),t:'拉伸（身体放松/恢复）',a:'BODY',xp:0,min:10,mode:'time',done:false,rec:10},
      {id:id(),t:'精神充电（唱歌/钢琴/阅读任选，不强制钢琴）',a:'MIND',xp:0,min:15,mode:'time',done:false,rec:15},
      {id:id(),t:'职业行动（AI/求职/事业编/央企/文职）',a:'CAREER',xp:0,min:30,mode:'time',done:false,rec:30},
      {id:id(),t:'23:30 前睡觉',a:'BODY',xp:10,min:0,mode:'fixed',done:false,rec:'每日'},
    ],
    supps: defaultSupps(),
    // 固定周常不再自动生成：周任务 = 随机周游（江湖掉落）+ 手动周目标（你明确要做的）。
    // 老用户已有的 S.weekly 项目保留为「手动周目标」，此处仅清空默认种子。
    weekly:[],
    year:[
      {id:id(),t:'拿到一个「够大够稳」的平台（央企 / 体制内 / 文职）',paused:false,done:false,items:[]},
      {id:id(),t:'羽毛球水平达到 3.5（可稳定对抗、步法/战术成型）',paused:false,done:false,items:[
        {id:id(),t:'找教练或 3.5 球友评估当前短板',a:'BADMINTON',xp:0,min:60,mode:'time',done:false},
        {id:id(),t:'完成 4 周步法/多球专项训练',a:'BADMINTON',xp:0,min:120,mode:'time',done:false},
        {id:id(),t:'每周至少 1 次对抗并录像复盘',a:'BADMINTON',xp:0,min:90,mode:'time',done:false},
        {id:id(),t:'参加 1 次俱乐部/业余比赛验证水平',a:'BADMINTON',xp:120,min:0,mode:'fixed',done:false},
      ]},
      {id:id(),t:'云南探索：实地住满一个月，深度验证定居感',paused:false,items:[
        {id:id(),t:'选定候选城市（昆明 / 大理 / 丽江）并做功课',a:'MIND',xp:0,min:60,mode:'time',done:false},
        {id:id(),t:'订好 30 天住宿',a:'BODY',xp:0,min:30,mode:'time',done:false},
        {id:id(),t:'实地住满 30 天，感受定居气场',a:'MIND',xp:60,min:0,mode:'fixed',done:false},
        {id:id(),t:'写一份定居感复盘',a:'MIND',xp:0,min:60,mode:'time',done:false},
      ]},
      {id:id(),t:'生涯教练转行：跑通第一个付费客户或稳定副业收入',paused:true,items:[
        {id:id(),t:'完成 1 次教练对话实践',a:'CAREER',xp:0,min:60,mode:'time',done:false},
        {id:id(),t:'跑通第一个付费客户',a:'CAREER',xp:100,min:0,mode:'fixed',done:false},
        {id:id(),t:'建立稳定副业收入流',a:'CAREER',xp:100,min:0,mode:'fixed',done:false},
      ]},
    ],
    month:{t:'本月主线：推进求职 / 体制内进度（执行动作，非结果）',items:[
      {id:id(),t:'完成 1 次网申 / 投递',a:'CAREER',xp:0,min:60,mode:'time',done:false},
      {id:id(),t:'完成 1 次笔试 / 测评准备',a:'CAREER',xp:0,min:120,mode:'time',done:false},
      {id:id(),t:'完成 1 次面试（或面试模拟）',a:'CAREER',xp:0,min:90,mode:'time',done:false},
      {id:id(),t:'完善简历 / 梳理目标岗位与报考条件',a:'CAREER',xp:0,min:60,mode:'time',done:false},
      {id:id(),t:'体制内专项准备（行测 / 申论 / 时政 / 事考科目）',a:'CAREER',xp:0,min:90,mode:'time',done:false},
    ]},
    week:{t:'本周主线：完成 1 次求职 / 事业编 / AI 实质行动',items:[
      {id:id(),t:'完成 1 次求职/事业编/AI 实质行动',a:'CAREER',xp:0,min:60,mode:'time',done:false},
    ]},
    ach:[
      {id:'bm1k',ic:'🏸',n:'羽球修行',lv:'3.0',d:'已达成 · 正式入门（终身 1649h）',next:'4.0 业余进阶：系统练杀球 / 参赛得名次（主观认领）',un:true,auto:null},
      {id:'piano1',ic:'🎹',n:'琴艺修行',lv:'1.0',d:'已达成 · 熟练《梦中的婚礼》',next:'2.0：钢琴视奏 / 十级（待达成）',un:true,auto:null},
      {id:'body1',ic:'💪',n:'体魄修行',lv:'0.5',d:'进行中 · 规律力量 + 羽毛球',next:'1.0：体脂率 25 以下 / 体重 105 以下（待达成）',un:false,auto:null},
      {id:'yunnan',ic:'🏔',n:'云水初临',lv:'0',d:'进行中 · 云南旅居探索',next:'1.0：云南实地住满 7 天（主观认领）',un:false,auto:null},
      {id:'s7',ic:'🔥',n:'灯火·七日不熄',d:'灯火不熄 七日',un:false,auto:q=>computeStreak()>=7},
      {id:'s30',ic:'⚡',n:'灯火·三十日不熄',d:'灯火不熄 三十日',un:false,auto:q=>computeStreak()>=30},
      {id:'ashore',ic:'⚓',n:'立基·上岸',d:'完成年道·一（安身主线）',un:false,auto:q=>S.year[0]&&yearDone(0)},
      {id:'coachOpen',ic:'🎤',n:'传灯·开张',d:'生涯教练年道复活并完成',un:false,auto:q=>S.year[2]&&!S.year[2].paused&&yearDone(2)},
      {id:'careerCrown',ic:'💼',n:'术法精进',d:'业道连进 四周（主观认领）',un:false,auto:null},
      {id:'mindGuard',ic:'🎹',n:'灵台澄明',d:'心性充盈 四周（主观认领）',un:false,auto:null},
      {id:'mindBound',ic:'🎧',n:'守心有度',d:'心性不溺 四周（主观认领）',un:false,auto:null},
    ],
    goals: defaultGoals(),
    mainQ:null,
    lastDaily:d, lastWeekly:monday(), lastMonth:thisMonth(),
    sideBank: defaultSideBank(),
    sideDaily: [],
    sideWeekly: [],
    sideMonthly: [],
    sideMeta: {dailyDate:'',weeklyKey:'',monthlyKey:''},
    assets: null,   // 资产快照：null=未录入（首次在设置页录入，仅存本机）
    ledger: [],
    coin: { target:0, initial:0, labor:[] },  // 金币人生：目标金币 / 初始金币 / 搬砖时长打卡（labor:[{id,date,hours,link}]）
    hobbies: defaultHobbies(),
    wishes: defaultWishes(),
    travel: {},                 // 旅行地图：{ [placeId]: {visited,date,rating,refl} }
    travelGoals: {year:null, month:null},  // 年/月旅行目标（地点 id）
    mapTab: 'cn',                  // 旅行地图当前分区
    customPlaces: [],             // 旅行地图：用户自定义地点（直接在地图上点选新增）
    equips: { owned:['eq_racket','eq_handbook','eq_whey','eq_vinyl','eq_ring','eq_cloak'], equipped:[] }, // 装备库：owned=已拥有 equipped=已装备
    customEquips: [],             // 用户自制装备
    rewards: { drops:[], dailyCount:0, dailyDate:'' }, // 嘉奖箱：drops=掉落记录 dailyCount=每日掉落计数
    customRewards: [],            // 用户自制奖励
    lootTab: 'equips',            // 战利品页当前 tab
    trend: [],                    // 趋势曲线时序快照：{d,xp,net,w}
    weight: null,                 // 最新体重（kg），仅用于趋势
    theme: 'light',               // 命理主题皮肤：light / bing(丁火清凉) / dark(命理·夜)
    brief: { last:'' },           // 今日战报：最近展示日期
    saga: { vol:1, done:[] },     // 章·卷制：当前卷号 + 已结算卷号列表
    npc: { active:[], week:'', seenWeek:'' },  // NPC 委托：本周在办委托 + 所属周 + 已读周
    npcRel: {},                                 // v5.23 NPC 关系：{npcId:{xp,done}}
    npcEvents: {},                              // v5.24 NPC 专属事件：{npcId:{choice,ts}}
    npcRelics: [],                              // v5.24 故人信物 id 列表（叙事收藏，不加数值）
    dayRun: {date:'',ids:[],milestones:[],epilogue:''}, // v5.25 今日连携与冒险结语
    weekReview: {focus:{},sealed:{}},                 // v5.26 每周复盘与下周唯一重点
    taskView: {date:'',compact:false},                // v5.27 智能减负：今日三件模式
    uiPrefs: {quiet:false},                           // v5.29 奖励通知合并 / 安静模式
    story: {lastDate:'',lastFate:'',history:[]}, // v5.23 命运签跨日余波
    skill: { spent:{}, un:[] },   // 技能树：各系已花点数 + 已解锁节点 id
    season: { cur:'', titles:[], worn:'' }, // 赛季：当前赛季 / 已获称号 / 佩戴中
    draw: { date:'', yi:'', ji:'', claimed:false }, // 每日宜忌抽签：当日签文 + 是否已承接气运
    letters: { unlocked:[], pointer:0 },             // 远方来信：已解锁信件队列
    enc: { cur:null, done:[], seen:false },          // 江湖偶遇：当前偶遇 + 已完成记录 + 已读标记
    bonds: { awarded:[], viewed:[] },                // 成就羁绊：已解锁的系 + 已看过的系
    bioAge: {                                   // 身体年龄 / 心理年龄系统
      sleepHours:null, steps:null, restingHR:null, // 可选手动录入健康数据
      lastCompute:'', bodyAge:0, mentalAge:0,     // 缓存：上次计算日期 / 结果
      factors:{},                                // 各因素明细（供展示）
      sleepLog:{}, ageLog:{}                     // 每日睡眠时长 / 体龄脑龄快照（精力页趋势用）
    },
    todayPlan: {date:'', focusId:'', mode:'normal', fateChoice:'', settled:[]}, // v5.22 今日驾驶舱；仅保存当天选择，不影响旧任务数据
  };
}

let S = defaultState();
let lastLevel = 0;     // 上次渲染时的总等级，用于检测升级并触发庆祝
let newlyDone = [];    // 本帧刚完成的任务 id，用于触发闪光动效
function migrate(){
  // v5.21 曾误把长期投入 goals 的默认值写成旅行目标对象；旅行目标已有独立 travelGoals 字段。
  if(!Array.isArray(S.goals)) S.goals=defaultGoals();
  // 兼容旧存档：五维 → 四大领域（v4.7 及以前）
  if(S.attrs && ('VIT' in S.attrs || 'FLOW' in S.attrs || 'GRW' in S.attrs || 'CON' in S.attrs || 'ORD' in S.attrs)){
    const map={VIT:'BODY',FLOW:'MIND',GRW:'CAREER',CON:'MIND',ORD:'BODY'};
    const merged={BADMINTON:0,CAREER:0,BODY:0,MIND:0};
    for(const k in map) merged[map[k]] += (S.attrs[k]||0);
    S.attrs = Object.assign(merged, S.attrs); // 保留新键若已存在
    for(const k of ['VIT','FLOW','GRW','CON','ORD']) delete S.attrs[k];
    if(S.weights && ('VIT' in S.weights)) S.weights = {BADMINTON:1.3,CAREER:1.5,BODY:1.1,MIND:1.0};
    if(Array.isArray(S.history)) S.history.push({ts:new Date().toISOString().slice(0,16).replace('T',' '),text:'存档迁移：五维属性 → 四大领域',xp:0});
  }
  // 兼容旧存档：任务 a 字段（五维键 → 四大领域）。每次加载都跑但幂等：已是新键则原样保留。
  const AXMAP={VIT:'BODY',FLOW:'MIND',GRW:'CAREER',CON:'MIND',ORD:'BODY'};
  const remapA=(a,tags)=>{
    if(tags && tags.includes('badminton')) return 'BADMINTON';  // 羽毛球标签优先归羽毛球
    if(a && ATTRS[a]) return a;                 // 已是新键
    if(AXMAP[a]) return AXMAP[a];               // 旧五维键 → 对应领域
    return 'BODY';
  };
  const remapList=arr=>{ if(Array.isArray(arr)) arr.forEach(x=>{ x.a=remapA(x.a, x.tags); }); };
  remapList(S.daily); remapList(S.weekly); remapList(S.supps);
  (S.year||[]).forEach(c=>remapList(c.items));
  remapList(S.month&&S.month.items); remapList(S.week&&S.week.items);
  // 兼容旧存档：把旧版身体/羽毛球/拉伸合并项彻底拆成三项
  // 用 v2 标记：之前 patch1 已设 bodySplitMigrated=true 的用户，需要再跑一遍才能彻底拆开。
  if(!S.bodySplitMigrated_v2 && Array.isArray(S.daily)){
    let changed = false;
    for(let i=S.daily.length-1;i>=0;i--){
      const t = S.daily[i].t || '';
      const hasPower = /力量/.test(t);
      const hasBmBasic = /羽毛球基本功|羽毛球基本/.test(t);
      const hasStretch = /拉伸/.test(t);
      // 旧 v4.8 合并项：力量 + 羽毛球 + 拉伸
      if(hasPower && hasBmBasic && hasStretch){
        S.daily.splice(i, 1,
          {id:id(),t:'力量训练（按课表）',a:'BODY',xp:0,min:20,mode:'time',done:false,rec:20},
          {id:id(),t:'羽毛球基本功',a:'BADMINTON',xp:0,min:15,mode:'time',done:false,rec:15},
          {id:id(),t:'拉伸（身体放松/恢复）',a:'BODY',xp:0,min:10,mode:'time',done:false,rec:10}
        );
        changed = true;
      }
      // v4.8-patch1 合并项：羽毛球基本功 + 拉伸（不含力量）
      else if(hasBmBasic && hasStretch){
        S.daily.splice(i, 1,
          {id:id(),t:'羽毛球基本功',a:'BADMINTON',xp:0,min:15,mode:'time',done:false,rec:15},
          {id:id(),t:'拉伸（身体放松/恢复）',a:'BODY',xp:0,min:10,mode:'time',done:false,rec:10}
        );
        changed = true;
      }
    }
    if(changed){
      if(Array.isArray(S.history)) S.history.push({ts:new Date().toISOString().slice(0,16).replace('T',' '),text:'任务拆分 v2：羽毛球基本功/拉伸 合并项 → 羽毛球基本功(BADMINTON) + 拉伸(BODY)',xp:0});
      S.bodySplitMigrated_v2 = true;
    }
  }
  // 兼容旧存档：替换旧版默认每日任务名称/属性
  if(Array.isArray(S.daily)){
    S.daily.forEach(x=>{
      if(/成长行动/.test(x.t||'')){
        x.t='职业行动（AI/求职/事业编/央企/文职）'; x.a='CAREER'; x.min=30; x.mode='time'; x.rec=30; x.xp=0;
      } else if(/心流创作/.test(x.t||'')){
        x.t='精神充电（唱歌/钢琴/阅读任选，不强制钢琴）'; x.a='MIND'; x.min=15; x.mode='time'; x.rec=15; x.xp=0;
      }
    });
  }
  // 兼容旧存档：周常里的羽毛球视频学习应归羽毛球领域
  if(Array.isArray(S.weekly)){
    S.weekly.forEach(x=>{
      if(/羽毛球视频|羽毛球复盘/.test(x.t||'')){ x.a='BADMINTON'; x.t='羽毛球视频复盘/学习'; if(!x.tags||!x.tags.includes('badminton')) x.tags=['badminton']; }
    });
  }
  // 兼容旧存档：周任务重设计为「一次性离散行动」，去掉与每日重复的唱歌/阅读等
  if(!S.weeklyRedesign_v1 && Array.isArray(S.weekly)){
    const oldWeekly = /唱歌解压|沉浸阅读|播客|AI 学习|求职\/事业编\/央企行动|羽毛球对抗\/专项训练/;
    if(S.weekly.some(x=>oldWeekly.test(x.t||''))){
      S.weekly = defaultState().weekly;
      if(Array.isArray(S.history)) S.history.push({ts:new Date().toISOString().slice(0,16).replace('T',' '),text:'周任务重设计：改为一次性离散行动（投递/面试/对抗等），移除每日重复项',xp:0});
    }
    S.weeklyRedesign_v1 = true;
  }
  // 兼容旧存档：羽毛球视频学习 / 打球 不是周常一次性，移回日任务按时间累积
  if(!S.bmToDaily_v1){
    if(Array.isArray(S.weekly)){
      S.weekly = S.weekly.filter(x=>!/羽毛球对抗|羽毛球视频|羽毛球复盘|羽毛球比赛/.test(x.t||''));
    }
    if(Array.isArray(S.daily)){
      const has = t=>S.daily.some(x=>(x.t||'').includes(t));
      const add = (t,min,rec)=>{ if(!has(t)) S.daily.push({id:id(),t,a:'BADMINTON',xp:0,min,mode:'time',done:false,rec}); };
      add('羽毛球视频学习',15,15);
      add('羽毛球训练/打球',30,30);
    }
    if(Array.isArray(S.history)) S.history.push({ts:new Date().toISOString().slice(0,16).replace('T',' '),text:'羽毛球视频学习 / 打球 从周任务移回日任务（按时间累积，非一次性）',xp:0});
    S.bmToDaily_v1 = true;
  }
  // 兼容旧存档：力量训练已是日任务按时间累积，移除周任务里的「力量进阶」一次性项
  if(!S.weeklyStrengthClean_v1){
    if(Array.isArray(S.weekly)){
      const before = S.weekly.length;
      S.weekly = S.weekly.filter(x=>!/力量进阶|力量新重量|力量新动作/.test(x.t||''));
      if(S.weekly.length!==before && Array.isArray(S.history)) S.history.push({ts:new Date().toISOString().slice(0,16).replace('T',' '),text:'周任务移除「力量进阶」：力量训练已是日任务按时间累积，无需周常里程碑',xp:0});
    }
    S.weeklyStrengthClean_v1 = true;
  }
  // 兼容旧存档：年主线改为 checklist 结构
  if(Array.isArray(S.year)){
    S.year = S.year.map(c=>({id:c.id||id(),t:c.t||'未命名年主线',paused:!!c.paused,done:!!c.done,items:Array.isArray(c.items)?c.items:[]}));
  } else { S.year = defaultState().year; }
  // 兼容旧存档：月/周主线从 {t,p,target} 进度条改为 checklist
  function toChecklist(o, fallbackT){
    if(o && Array.isArray(o.items)) return o;
    return {t:(o&&o.t)||fallbackT, items:[]};
  }
  S.month = toChecklist(S.month, '本月主线');
  S.week  = toChecklist(S.week,  '本周主线');
  // 兼容旧存档：补剂数组缺失时补默认
  if(!Array.isArray(S.supps) || !S.supps.length) S.supps = defaultSupps();
  // 兼容旧存档：补 mode 字段（无 mode 的旧任务按是否填了分钟推断）
  const fixMode = o => { if(o && o.items) o.items.forEach(x=>{ if(x.mode===undefined) x.mode=(x.min>0)?'time':'fixed'; }); };
  (S.daily||[]).forEach(x=>{ if(x.mode===undefined) x.mode=(x.min>0)?'time':'fixed'; });
  (S.weekly||[]).forEach(x=>{ if(x.mode===undefined) x.mode=(x.min>0)?'time':'fixed'; });
  (S.supps||[]).forEach(x=>{ if(x.mode===undefined) x.mode='fixed'; });
  (S.year||[]).forEach(fixMode); fixMode(S.month); fixMode(S.week);
  // 兼容旧存档：每月主线复盘字段
  if(typeof S.month!=='object'||!S.month) S.month={t:'',items:[]};
  if(typeof S.month.plan!=='string') S.month.plan='';
  if(typeof S.month.actual!=='string') S.month.actual='';
  if(typeof S.month.status!=='string') S.month.status='';
  if(typeof S.month.reason!=='string') S.month.reason='';
  // v5.23：每月主线改为 12 月日历（每年字典）。迁移老存档的本月 plan/actual/status/reason 到 S.monthPlans[本月]
  if(!S.monthPlansByYear){
    S.monthPlansByYear = {};
    const yr = (S.month && S.month.plan!==undefined)?(new Date().getFullYear()) : (new Date().getFullYear());
    const yk = String(yr);
    if(!S.monthPlansByYear[yk]) S.monthPlansByYear[yk] = {};
    const mk = thisMonth();
    const legacy = S.month||{};
    if(legacy.plan||legacy.actual||legacy.status||legacy.reason){
      S.monthPlansByYear[yk][mk] = {
        plan: legacy.plan||'', actual: legacy.actual||'',
        status: legacy.status||'', reason: legacy.reason||''
      };
    }
  }
  const _yKey = String(new Date().getFullYear());
  if(!S.monthPlansByYear[_yKey]) S.monthPlansByYear[_yKey] = {};
  for(let m=1;m<=12;m++){
    const k = _yKey+'-'+(m<10?'0'+m:m);
    if(typeof S.monthPlansByYear[_yKey][k]!=='object'||!S.monthPlansByYear[_yKey][k]){
      S.monthPlansByYear[_yKey][k] = {plan:'',actual:'',status:'',reason:''};
    }
    const r = S.monthPlansByYear[_yKey][k];
    if(typeof r.plan!=='string') r.plan='';
    if(typeof r.actual!=='string') r.actual='';
    if(typeof r.status!=='string') r.status='';
    if(typeof r.reason!=='string') r.reason='';
  }
  // 兼容旧存档：把「够大够稳平台」年主线的执行步骤拆到月主线，年目标本身保留为完整大目标
  if(!S.yearCareerCompact_v1){
    const careerYear = (S.year||[]).find(c=>/够大够稳|平台|央企|体制内|文职/.test(c.t||''));
    if(careerYear && Array.isArray(careerYear.items) && careerYear.items.length){
      const norm = s => (s||'').replace(/\s+/g,'').replace(/[\/\\]/g,'/');
      const existing = new Set(S.month.items.map(x=>norm(x.t)));
      // 结果型步骤（拿到 offer / 体检 / 背调 / 入职等）属年目标终局，不搬到月主线
      const isOutcome = t => /offer|录用|体检|背调|入职|签约|报到/.test(t||'');
      const totalItems = careerYear.items.length;
      let moved = 0, filtered = 0;
      careerYear.items.forEach(it=>{
        if(isOutcome(it.t)){ filtered++; return; }
        if(!existing.has(norm(it.t))){ S.month.items.push({...it, id:it.id||id()}); moved++; }
      });
      careerYear.items = [];
      careerYear.done = false;
      if(Array.isArray(S.history)) S.history.push({ts:new Date().toISOString().slice(0,16).replace('T',' '),text:`年主线「${careerYear.t}」的执行步骤已拆到月主线（移入 ${moved} 项，过滤结果型 ${filtered} 项，去重跳过 ${totalItems-moved-filtered} 项），年目标保留为完整目标`,xp:0});
    }
    S.yearCareerCompact_v1 = true;
  }
  // 兼容旧存档：清理月主线中不应存在的结果型项目（offer/体检/背调/入职等），并去重
  if(!S.monthOutcomeClean_v1){
    if(S.month && Array.isArray(S.month.items)){
      const norm = s => (s||'').replace(/\s+/g,'').replace(/[\/\\]/g,'/');
      const isOutcome = t => /offer|录用|体检|背调|入职|签约|报到/.test(t||'');
      const seen = new Set();
      const before = S.month.items.length;
      const removed = [];
      S.month.items = S.month.items.filter(x=>{
        if(!x || typeof x.t !== 'string') return false;
        if(isOutcome(x.t)){ removed.push(x.t); return false; }
        const key = norm(x.t);
        if(seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const after = S.month.items.length;
      if(Array.isArray(S.history) && (before!==after || removed.length)){
        S.history.push({ts:new Date().toISOString().slice(0,16).replace('T',' '),text:`月主线清理：移除结果型项目 ${removed.join('、')||'无'}，去重后从 ${before} 项变为 ${after} 项`,xp:0});
      }
    }
    S.monthOutcomeClean_v1 = true;
  }
  // 兼容旧存档：把 done(bool) + doneDate 改为按日期存储 donedates[] + mins{}
  // 旧模型只有一个 done 布尔，无法区分「今天勾的」和「补录历史勾的」；新模型每个日期独立记录，
  // 切回今天时各自已勾选会被自动复原，互不覆盖。
  const convDates=(x)=>{
    if(!x||typeof x!=='object') return;
    if(!Array.isArray(x.donedates)){
      x.donedates=(x.done===true)?[(x.doneDate||todayStr())]:[];
    }
    if(x.mins===undefined) x.mins={};
    if(x.mode==='time' && x.donedates.length && (!x.mins||!Object.keys(x.mins).length) && x.min){ x.mins[x.donedates[0]]=x.min; }
    delete x.done; delete x.doneDate;
  };
  [S.daily,S.weekly,S.supps].forEach(arr=>{ if(Array.isArray(arr)) arr.forEach(convDates); });
  (S.year||[]).forEach(c=>{ if(c.items) c.items.forEach(convDates); });
  if(S.month&&S.month.items) S.month.items.forEach(convDates);
  if(S.week&&S.week.items) S.week.items.forEach(convDates);
  // 年主线简单目标（无步骤，如「够大够稳平台」）的 c.done 是终局达成标记，不参与日期勾选，保留不动。
  // 兼容旧存档：初始化江湖轶事 / 账本
  if(!Array.isArray(S.sideBank)) S.sideBank = defaultSideBank();
  if(!S.sideMeta) S.sideMeta={dailyDate:'',weeklyKey:'',monthlyKey:''};
  if(S.sideMeta.monthlyKey===undefined) S.sideMeta.monthlyKey='';
  if(!Array.isArray(S.sideDaily)) S.sideDaily=[];
  if(!Array.isArray(S.sideWeekly)) S.sideWeekly=[];
  if(!Array.isArray(S.sideMonthly)) S.sideMonthly=[];
  if(!Array.isArray(S.ledger)) S.ledger = [];
  if(!S.coin || typeof S.coin!=='object') S.coin={target:0, initial:0, labor:[]};
  if(typeof S.coin.target!=='number') S.coin.target=0;
  if(typeof S.coin.initial!=='number') S.coin.initial=0;
  if(!Array.isArray(S.coin.labor)) S.coin.labor=[];
  if(!S.travel || typeof S.travel!=='object') S.travel = {};
  if(!Array.isArray(S.customPlaces)) S.customPlaces = [];
  if(!S.travelGoals || typeof S.travelGoals!=='object') S.travelGoals = {year:null, month:null};
  if(!S.mapTab || typeof S.mapTab!=='string') S.mapTab = 'cn';
  if(!S.equips || typeof S.equips!=='object') S.equips={owned:[],equipped:[]};
  if(!Array.isArray(S.equips.owned)) S.equips.owned=[];
  if(!Array.isArray(S.equips.equipped)) S.equips.equipped=[];
  if(!Array.isArray(S.customEquips)) S.customEquips=[];
  if(!S.rewards || typeof S.rewards!=='object') S.rewards={drops:[],dailyCount:0,dailyDate:''};
  if(!Array.isArray(S.rewards.drops)) S.rewards.drops=[];
  if(!Array.isArray(S.customRewards)) S.customRewards=[];
  if(!S.lootTab) S.lootTab='equips';
  // v5.17 新字段兜底
  if(!S.brief || typeof S.brief!=='object') S.brief={last:''};
  if(!S.saga || typeof S.saga!=='object') S.saga={vol:1,done:[]};
  if(!Array.isArray(S.saga.done)) S.saga.done=[];
  if(!S.npc || typeof S.npc!=='object') S.npc={active:[],week:'',seenWeek:''};
  if(!Array.isArray(S.npc.active)) S.npc.active=[];
  if(typeof S.npc.seenWeek!=='string') S.npc.seenWeek='';
  if(!S.npcRel || typeof S.npcRel!=='object') S.npcRel={};
  if(!S.npcEvents || typeof S.npcEvents!=='object') S.npcEvents={};
  if(!Array.isArray(S.npcRelics)) S.npcRelics=[];
  if(!S.dayRun || typeof S.dayRun!=='object') S.dayRun={date:'',ids:[],milestones:[],epilogue:''};
  if(!Array.isArray(S.dayRun.ids)) S.dayRun.ids=[];
  if(!Array.isArray(S.dayRun.milestones)) S.dayRun.milestones=[];
  if(!S.weekReview || typeof S.weekReview!=='object') S.weekReview={focus:{},sealed:{}};
  if(!S.weekReview.focus || typeof S.weekReview.focus!=='object') S.weekReview.focus={};
  if(!S.weekReview.sealed || typeof S.weekReview.sealed!=='object') S.weekReview.sealed={};
  if(!S.taskView || typeof S.taskView!=='object') S.taskView={date:'',compact:false};
  if(!S.uiPrefs || typeof S.uiPrefs!=='object') S.uiPrefs={quiet:false};
  if(!S._meta || typeof S._meta!=='object') S._meta={schema:SAVE_SCHEMA_VERSION,app:'life-rpg',updated:''};
  S._meta.schema=SAVE_SCHEMA_VERSION;S._meta.app='life-rpg';
  if(!S.story || typeof S.story!=='object') S.story={lastDate:'',lastFate:'',history:[]};
  if(!Array.isArray(S.story.history)) S.story.history=[];
  if(!S.skill || typeof S.skill!=='object') S.skill={spent:{},un:[]};
  if(!S.skill.spent || typeof S.skill.spent!=='object') S.skill.spent={};
  if(!Array.isArray(S.skill.un)) S.skill.un=[];
  if(!S.season || typeof S.season!=='object') S.season={cur:'',titles:[],worn:''};
  if(!Array.isArray(S.season.titles)) S.season.titles=[];
  // v5.19 新字段兜底（每日宜忌 / 远方来信 / 江湖偶遇 / 成就羁绊）
  if(!S.draw || typeof S.draw!=='object') S.draw={date:'',yi:'',ji:'',claimed:false};
  if(!S.letters || typeof S.letters!=='object') S.letters={unlocked:[],pointer:0};
  if(!Array.isArray(S.letters.unlocked)) S.letters.unlocked=[];
  if(!S.enc || typeof S.enc!=='object') S.enc={cur:null,done:[],seen:false};
  if(!Array.isArray(S.enc.done)) S.enc.done=[];
  if(typeof S.enc.seen!=='boolean') S.enc.seen=false;
  if(!S.bonds || typeof S.bonds!=='object') S.bonds={awarded:[],viewed:[]};
  if(!Array.isArray(S.bonds.awarded)) S.bonds.awarded=[];
  if(!Array.isArray(S.bonds.viewed)) S.bonds.viewed=[];
  // v5.21 新字段兜底（身体/心理年龄）
  if(!S.bioAge || typeof S.bioAge!=='object') S.bioAge={sleepHours:null,steps:null,restingHR:null,lastCompute:'',bodyAge:0,mentalAge:0,factors:{}};
  // v5.21.1 低频疗愈组冷却
  if(!S.lfLog || typeof S.lfLog!=='object') S.lfLog={};
  LF_GROUPS.forEach(g=>{ if(!Array.isArray(S.lfLog[g.g])) S.lfLog[g.g]=[]; });
  if(!S.migLf211){
    // ① 把老存档散落在各任务对象上的疗愈完成历史，并入组日志（否则删旧任务后冷却历史会归零）
    const lists=[S.daily,S.weekly,S.sideDaily,S.sideWeekly,S.sideMonthly,(S.week&&S.week.items),(S.month&&S.month.items)];
    (S.year||[]).forEach(c=>{ if(c && c.items) lists.push(c.items); });
    lists.forEach(arr=>(arr||[]).forEach(x=>{
      const g=lfGroupOf(x); if(!g) return;
      (x.lfDates||[]).forEach(dt=>{ const L=S.lfLog[g.g]; if(dt && !L.includes(dt)) L.push(dt); });
    }));
    LF_GROUPS.forEach(g=>{ S.lfLog[g.g].sort(); if(S.lfLog[g.g].length>60) S.lfLog[g.g]=S.lfLog[g.g].slice(-60); });
    // ② 移除旧固定周常残留的「完成 1 次体检/理疗/体态评估」——疗愈统一交给随机周游 + 组冷却
    if(Array.isArray(S.weekly)) S.weekly=S.weekly.filter(x=>!(x && /体检\s*\/\s*理疗|体检\/理疗\/体态评估/.test(x.t||'')));
    S.migLf211=true;
  }
  refreshSideQuests();
}
function validateSaveObject(obj){
  const errors=[];if(!obj||typeof obj!=='object'||Array.isArray(obj))errors.push('根结构不是对象');
  if(!obj||!obj.attrs||typeof obj.attrs!=='object')errors.push('缺少属性数据');
  else Object.keys(ATTRS).forEach(k=>{if(obj.attrs[k]!==undefined&&(!Number.isFinite(Number(obj.attrs[k]))||Number(obj.attrs[k])<0))errors.push(k+' 经验无效');});
  if(!obj||!Array.isArray(obj.daily))errors.push('日常任务不是数组');if(!obj||!Array.isArray(obj.history))errors.push('历史记录不是数组');
  if(obj&&obj.daily&&obj.daily.length>5000)errors.push('任务数量异常');return {ok:errors.length===0,errors};
}
function restorePoints(){try{const a=JSON.parse(store.get(BACKUP_KEY)||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}}
function createRestorePoint(reason){
  try{const data=JSON.stringify(S),list=restorePoints();if(list[0]&&list[0].data===data)return false;list.unshift({ts:new Date().toISOString(),reason:reason||'自动备份',schema:SAVE_SCHEMA_VERSION,data});store.set(BACKUP_KEY,JSON.stringify(list.slice(0,3)));return true;}catch(e){return false;}
}
function latestValidRestore(){for(const p of restorePoints()){try{const o=JSON.parse(p.data),v=validateSaveObject(o);if(v.ok)return {point:p,obj:o};}catch(e){}}return null;}
function restoreLatestPoint(){const hit=latestValidRestore();if(!hit){alert('还没有可用的恢复点');return;}if(!confirm('恢复 '+hit.point.ts.slice(0,16).replace('T',' ')+' 的存档？当前状态会先自动备份。'))return;createRestorePoint('恢复前自动备份');S=Object.assign(defaultState(),hit.obj);migrate();save();render();alert('最近恢复点已恢复 ✅');}
function renderSaveSafety(){const el=document.getElementById('saveSafetyBox');if(!el)return;const ps=restorePoints(),last=ps[0];el.innerHTML='存档结构版本 <b>v'+SAVE_SCHEMA_VERSION+'</b> · 校验状态 <b style="color:var(--grw)">正常</b> · 本机恢复点 <b>'+ps.length+'/3</b>'+(last?' · 最近：'+last.ts.slice(0,16).replace('T',' ')+'（'+escHtml(last.reason)+'）':'');}
async function load(){
  let loaded=false;
  if(FS_AVAILABLE){
    try{ saveFileHandle = await _idb.get(); }catch(e){}
    if(saveFileHandle){
      const txt = await fsRead();
      if(txt){ try{ const obj=JSON.parse(txt),v=validateSaveObject(obj);if(!v.ok)throw new Error(v.errors.join('；'));S=Object.assign(defaultState(),obj);loaded=true; }catch(e){} }
    }
  }
  if(!loaded){
    const raw = store.get(SAVE_KEY);
    if(raw){ try{const obj=JSON.parse(raw),v=validateSaveObject(obj);if(!v.ok)throw new Error(v.errors.join('；'));S=Object.assign(defaultState(),obj);loaded=true;}catch(e){} }
  }
  if(!loaded){const hit=latestValidRestore();if(hit){S=Object.assign(defaultState(),hit.obj);loaded=true;setTimeout(()=>alert('检测到主存档不可用，已自动恢复最近的有效备份。'),300);}}
  migrate();
  if(S.lastActiveDay===undefined) S.lastActiveDay = S.lastDaily || new Date().toISOString().slice(0,10);
  if(!Array.isArray(S.activeDays)) S.activeDays=[];
  if(S.lastActiveDay && !S.activeDays.includes(S.lastActiveDay)) S.activeDays.push(S.lastActiveDay); // 旧存档连击日并入集合
  store.set(SAVE_KEY, JSON.stringify(S)); // localStorage 兜底备份
}
async function save(){ recordTrend();S._meta=S._meta||{};S._meta.schema=SAVE_SCHEMA_VERSION;S._meta.app='life-rpg';S._meta.updated=new Date().toISOString();const bd=store.get('lifeRPG_last_backup_day');if(bd!==todayStr()){createRestorePoint('每日自动恢复点');store.set('lifeRPG_last_backup_day',todayStr());}SAVE_OK = store.set(SAVE_KEY, JSON.stringify(S)); _dirty = true; if(saveFileHandle) await fsWrite(); }

// ---------- 访问口令门 ----------
function setupPwdGate(){
  const gate=document.getElementById('pwdGate');
  const inp=document.getElementById('pwdInput');
  const btn=document.getElementById('pwdBtn');
  const err=document.getElementById('pwdErr');
  const hint=document.getElementById('pwdHint');
  if(!gate) return;
  const changed = (store.get(PWD_KEY)||'').trim()!=='';
  if(hint) hint.innerHTML = changed
    ? '已自定义口令。忘记口令？清浏览器站点数据即可恢复为默认口令。'
    : '默认口令见下方提示 / 设置页「🔐 更新口令」可改。';
  const tryPwd=()=>{
    if(inp.value===effectivePwd()){
      gate.style.display='none'; inp.value=''; err.style.display='none';
    } else {
      err.textContent='口令错误，请重试';
      err.style.display='block';
      gate.classList.remove('shake'); void gate.offsetWidth; gate.classList.add('shake');
    }
  };
  btn.addEventListener('click', tryPwd);
  inp.addEventListener('keydown', e=>{ if(e.key==='Enter') tryPwd(); });
  setTimeout(()=>{ try{ inp.focus(); }catch(e){} }, 60);
}
function setPwd(){
  const v=(document.getElementById('pwdNew').value||'').trim();
  if(v && v.length<6){ alert('口令至少 6 位'); return; }
  store.set(PWD_KEY, v); // 留空 → 恢复默认口令
  document.getElementById('pwdNew').value='';
  if(document.getElementById('pwdCur')) document.getElementById('pwdCur').textContent = v? '当前：自定义口令' : '当前：默认口令';
  alert('口令已更新 ✅'+(v?'（新口令已生效）':'（已恢复默认口令）'));
}

// ---------- 自动备份：轮询 + 关闭/隐藏页面前落盘（防丢，随时可恢复） ----------
let _autoBackupStarted=false;
function startAutoBackup(){
  if(_autoBackupStarted) return; _autoBackupStarted=true;
  // 每 30 秒：若有更新且已授权本地存档文件，则把最新存档写入本机 save.json
  setInterval(()=>{ try{ if(_dirty && saveFileHandle){ fsWrite(); _dirty=false; } }catch(e){} }, 30000);
  // 关闭 / 切到后台前强制保存一次（localStorage 同步可靠；本地文件异步尽力）
  const flush=()=>{ try{ store.set(SAVE_KEY, JSON.stringify(S)); if(saveFileHandle) fsWrite(); }catch(e){} };
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') flush(); });
}

// 导出/导入存档：环境无关兜底（预览面板 localStorage 不持久时用）
function exportSave(){
  try{
    const blob = new Blob([JSON.stringify(S,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    const d = new Date(), p = n=>String(n).padStart(2,'0');
    a.href = URL.createObjectURL(blob);
    a.download = 'lifeRPG_'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
    addHist('导出存档备份');
    save(); render();
  }catch(e){ alert('导出失败：'+e.message); }
}
function importSave(file){
  if(!file) return;
  const r = new FileReader();
  r.onload = e=>{
    try{
      const obj = JSON.parse(e.target.result);
      const valid=validateSaveObject(obj);if(!valid.ok)throw new Error('存档校验失败：'+valid.errors.join('；'));
      createRestorePoint('导入前自动备份');
      S = Object.assign(defaultState(), obj);
      migrate();
      lastLevel = lvlOf(overallXP());   // 避免导入时误触发 LEVEL UP 庆祝
      addHist('导入存档');
      save(); render();
      alert('导入成功 ✅');
    }catch(err){ alert('导入失败：'+err.message); }
  };
  r.readAsText(file);
}

// ---------- GitHub 云备份（防丢 / 跨设备，可选） ----------
function utf8ToBase64(str){
  const bytes = new TextEncoder().encode(str);
  let bin=''; for(let i=0;i<bytes.length;i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function utf8FromBase64(b64){
  const bin = atob((b64||'').replace(/\s/g,''));
  const bytes = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function ensureGhCfg(){
  const o=document.getElementById('ghOwner'), rp=document.getElementById('ghRepo'),
        t=document.getElementById('ghToken'), p=document.getElementById('ghPath');
  if(o&&rp&&t&&p){
    S.gh = { owner:o.value.trim(), repo:rp.value.trim(),
             token:t.value.trim(), path:(p.value.trim()||'data/save.json') };
  }
  if(!S.gh || !S.gh.owner || !S.gh.repo || !S.gh.token){
    alert('请先在「☁ GitHub 云备份」面板填写：GitHub 用户名 / 仓库名 / 私人令牌（Settings → Developer settings → PAT，勾 repo 权限）。');
    return null;
  }
  return S.gh;
}
function saveGhCfg(){
  const c = ensureGhCfg(); if(!c) return;
  save(); render(); alert('GitHub 配置已保存 ✅');
}
async function backupToGithub(){
  const cfg = ensureGhCfg(); if(!cfg) return;
  const {owner, repo, token, path} = cfg;
  const base = 'https://api.github.com/repos/'+encodeURIComponent(owner)+'/'+encodeURIComponent(repo)+'/contents/'+encodeURIComponent(path);
  const H = {'Authorization':'Bearer '+token, 'Accept':'application/vnd.github+json'};
  try{
    const content = utf8ToBase64(JSON.stringify(S,null,2));
    let sha=null;                                   // 取已有文件的 sha 用于更新；不存在则 404
    const r1 = await fetch(base, { headers:H });
    if(r1.ok){ const j=await r1.json().catch(()=>({})); sha = j.sha||null; }
    else if(r1.status!==404){ const e=await r1.json().catch(()=>({})); alert('读取仓库失败：'+(e.message||r1.status)); return; }
    const body = { message:'lifeRPG backup '+new Date().toISOString().slice(0,10), content };
    if(sha) body.sha = sha;
    const r2 = await fetch(base, { method:'PUT',
      headers:Object.assign({'Content-Type':'application/json'}, H), body:JSON.stringify(body) });
    if(r2.ok){ addHist('备份到 GitHub'); save(); render(); alert('☁ 已备份到 GitHub ✅'); }
    else{ const e=await r2.json().catch(()=>({})); alert('备份失败：'+(e.message||r2.status)); }
  }catch(err){ alert('备份出错（可能网络问题）：'+err.message); }
}
async function restoreFromGithub(){
  const cfg = ensureGhCfg(); if(!cfg) return;
  const {owner, repo, token, path} = cfg;
  const base = 'https://api.github.com/repos/'+encodeURIComponent(owner)+'/'+encodeURIComponent(repo)+'/contents/'+encodeURIComponent(path);
  const H = {'Authorization':'Bearer '+token, 'Accept':'application/vnd.github+json'};
  try{
    const r = await fetch(base, { headers:H });
    if(!r.ok){ alert('拉取失败：'+(r.status===404?'仓库里还没有备份文件（先点一次备份）':r.status)); return; }
    const j = await r.json();
    const obj = JSON.parse(utf8FromBase64(j.content));
    const valid=validateSaveObject(obj);if(!valid.ok)throw new Error('云存档校验失败：'+valid.errors.join('；'));
    if(!confirm('将从 GitHub 恢复存档，覆盖当前本地数据，确定继续？')) return;
    createRestorePoint('云恢复前自动备份');
    S = Object.assign(defaultState(), obj);
    migrate();
    lastLevel = lvlOf(overallXP());                 // 避免恢复时误触发 LEVEL UP 庆祝
    addHist('从 GitHub 恢复');
    save(); render();
    alert('☁ 已从 GitHub 恢复 ✅');
  }catch(err){ alert('恢复出错：'+err.message); }
}

function fillGhInputs(){
  if(!S.gh) return;
  const map={ghOwner:S.gh.owner, ghRepo:S.gh.repo, ghToken:S.gh.token, ghPath:S.gh.path||'data/save.json'};
  for(const id in map){ const el=document.getElementById(id); if(el && !el.value) el.value=map[id]||''; }
}

function grant(attr,xp,neg){
  // 装备加成 + 技能树加成：该领域修行经验 ×(1+装备+天赋)
  const sk = (typeof skillBonusFor==='function') ? skillBonusFor(attr) : 0;
  const eff = xp*(1+equipBonusFor(attr)+sk);
  const d=neg?-eff:eff;
  S.attrs[attr]+=d; if(S.attrs[attr]<0)S.attrs[attr]=0;
}
function addHist(text,xp,dateStr){
  const d = dateStr || todayStr();
  const now=new Date();
  const p=n=>String(n).padStart(2,'0');
  const ts = d+' '+p(now.getHours())+':'+p(now.getMinutes());
  S.history.push({ts,text,xp:xp||0});
  if(S.history.length>500) S.history=S.history.slice(-500);
}

function toggle(list,idv){
  const item=list.find(x=>x.id===idv); if(!item)return;
  const wasTodayFocus=ensureTodayPlan().focusId===idv;
  const d=REC_DATE||todayStr();
  const was=isDone(item,d);
  const nowDone=!was;
  // 低频疗愈类（头疗/按摩/康复理疗）：间隔至少 21 天，不连续两周
  if(nowDone){
    const left=lfDaysLeft(item,d);
    if(left>0){
      const g=lfGapDays(item);
      alert('⏳ 间隔不足：「'+item.t+'」距上次完成仅 '+(g-left)+' 天，按你的习惯需至少间隔 '+g+' 天（不连续两周）。还需 '+left+' 天再做。');
      return;
    }
  }
  if(item.mode==='time' && !was){
    const mv=parseInt(document.getElementById('min_'+idv)?.value)||0;
    if(mv<=0){ alert('先填这次的时长（分钟）'); return; }
    item.mins=item.mins||{}; item.mins[d]=mv;
  }
  setDone(item,d,!was);
  if(nowDone) touchActivity(d);
  const xp=itemXpAt(item,d);
  grant(item.a, xp, !nowDone);
  if(nowDone && S.mainQ===idv) S.bonusXP=(S.bonusXP||0)+10;
  if(!nowDone && S.mainQ===idv) S.bonusXP=Math.max(0,(S.bonusXP||0)-10);
  addHist((nowDone?'✔ ':'✘ ')+item.t+(item.mode==='time'&&item.mins&&item.mins[d]?(' '+h(item.mins[d])):''), nowDone?xp:-xp, d);
  if(!nowDone && lfGapDays(item)>0){   // 取消勾选：同步撤销冷却记录（对象 + 组日志）
    if(Array.isArray(item.lfDates)) item.lfDates=item.lfDates.filter(x=>x!==d);
    const _ug=lfGroupOf(item);
    if(_ug) S.lfLog[_ug.g]=lfLogOf(_ug.g).filter(x=>x!==d);
  }
  if(nowDone){ if(lfGapDays(item)>0){ item.lfDates=item.lfDates||[]; if(!item.lfDates.includes(d)) item.lfDates.push(d);
      const _lg=lfGroupOf(item);
      if(_lg){ const L=lfLogOf(_lg.g); if(!L.includes(d)){ L.push(d); L.sort(); if(L.length>60) S.lfLog[_lg.g]=L.slice(-60); } } }
    newlyDone.push(idv); floatXP('+'+weightedXpAt(item,d)+' XP','qi_'+idv); const _cm=findCelebrate(item.t,item.a); if(_cm) celebrateTask(_cm);
    if(Math.random()<0.12){ const drp=dropReward(Math.random()<0.3?'small':'micro','完成：'+item.t); if(drp) setTimeout(()=>celebrateTask('🎁 嘉奖掉落：'+findReward(drp.rewardId).name),120); }
    setTimeout(()=>showQuestSettlement({id:item.id,text:item.t,attr:item.a,mins:(item.mins&&item.mins[d])||0,xp:weightedXpAt(item,d),focusDone:wasTodayFocus}),180);
  }
  save();checkAch();render();
}
// ===== v5.22 任务时长叠加：点一次 +N min 按推荐时长累加（XP 按增量 grant） =====
function _addMinTo(item,d,add){
  item.mins=item.mins||{};
  const before=item.mins[d]||0;
  item.mins[d]=before+add;
  if(!item.donedates) item.donedates=[];
  if(!item.donedates.includes(d)) item.donedates.push(d);
  touchActivity(d);
  const xpBefore=before*RATE;
  const xpAfter=item.mins[d]*RATE;
  grant(item.a, xpBefore, true);     // 减旧的（与 toggle 撤销同机制）
  grant(item.a, xpAfter, false);     // 加新的
  const inc=xpAfter-xpBefore;
  addHist('+'+h(add)+' · '+item.t+'（累计 '+h(item.mins[d])+'）', inc, d);
  return inc;
}
function addMin(list,idv){
  const item=list.find(x=>x.id===idv); if(!item||item.mode!=='time') return;
  const wasTodayFocus=ensureTodayPlan().focusId===idv;
  const d=REC_DATE||todayStr();
  const inp=document.getElementById('min_'+idv);
  const userVal=inp?parseInt(inp.value):0;
  const add=Math.max(1, userVal>0?userVal:(item.rec||item.min||10));
  if(inp) inp.value=''; // 清空输入框
  const inc=_addMinTo(item, d, add);
  floatXP('+'+inc+' XP','qi_'+idv);
  setTimeout(()=>showQuestSettlement({id:item.id,text:item.t,attr:item.a,mins:add,xp:inc*(S.weights[item.a]||1),focusDone:wasTodayFocus}),180);
  save();checkAch();render();
}
function addChecklistMin(kind,i,ii){
  const list=kind==='year'?S.year:(kind==='month'?S.month:S.week);
  const c=kind==='year'?list[i]:list; if(!c||!c.items||!c.items[ii]) return;
  const x=c.items[ii]; if(x.mode!=='time') return;
  const d=REC_DATE||todayStr();
  const inp=document.getElementById('min_'+kind+'_'+i+'_'+ii);
  const userVal=inp?parseInt(inp.value):0;
  const add=Math.max(1, userVal>0?userVal:(x.rec||x.min||10));
  if(inp) inp.value='';
  const inc=_addMinTo(x, d, add);
  if(!c.paused) floatXP('+'+inc+' XP','qi_'+x.id);
  save();checkAch();render();
}
function addQuest(kind){
  const txt=document.getElementById(kind[0]+'Text').value.trim();
  const a=document.getElementById(kind[0]+'Attr').value;
  const min=parseInt(document.getElementById(kind[0]+'Min')?.value)||0;
  const xp=parseInt(document.getElementById(kind[0]+'Xp').value)||10;
  if(!txt)return;
  const mode = min>0 ? 'time':'fixed';
  S[kind].push({id:id(),t:txt,a,xp:mode==='fixed'?xp:0,min,mode,donedates:[],mins:{}});
  document.getElementById(kind[0]+'Text').value='';
  save();render();
}
function delQuest(kind,idv){
  S[kind]=S[kind].filter(x=>x.id!==idv); save();render();
}
function sideList(kind){ return kind==='daily'?S.sideDaily:(kind==='weekly'?S.sideWeekly:S.sideMonthly); }
function setSideList(kind,list){ if(kind==='daily') S.sideDaily=list; else if(kind==='weekly') S.sideWeekly=list; else S.sideMonthly=list; }
function toggleSide(kind,idv){
  const list=sideList(kind);
  const item=list.find(x=>x.id===idv); if(!item)return;
  const wasTodayFocus=ensureTodayPlan().focusId===idv;
  item.done=!item.done;
  if(item.done){
    S.bonusXP=(S.bonusXP||0)+(item.xp||0);
    touchActivity(todayStr());
    addHist((item.mandatory?'✔【强制】':'✔ ')+'[轶事]'+item.t+' +'+(item.xp||0)+' XP', item.xp||0);
    const b=S.sideBank.find(x=>x.id===item.bid); if(b) b.w=Math.min(5,(b.w||1)+0.5);
    newlyDone.push(idv); floatXP('+'+(item.xp||0)+' XP','qi_'+idv); const _cm=findCelebrate(item.t,item.cat); if(_cm) celebrateTask(_cm);
    setTimeout(()=>showQuestSettlement({id:item.id,text:item.t,attr:item.a||'MIND',mins:item.min||0,xp:item.xp||0,focusDone:wasTodayFocus}),180);
  } else {
    S.bonusXP=Math.max(0,(S.bonusXP||0)-(item.xp||0));
    addHist((item.mandatory?'✘【强制】':'✘ ')+'[轶事]'+item.t, -(item.xp||0));
  }
  save();checkAch();render();
}
function delSideQuest(kind,idv){
  const list=sideList(kind);
  const item=list.find(x=>x.id===idv); if(!item)return;
  if(item.mandatory){ alert('🔴 强制任务不能删，完成它或等刷新。'); return; }
  setSideList(kind,list.filter(x=>x.id!==idv));
  save();render();
}
function addSideIdea(){
  const t=(document.getElementById('ideaText')?.value||'').trim();
  const type=document.getElementById('ideaType')?.value||'daily';
  if(!t)return;
  const xp=type==='daily'?8:(type==='weekly'?25:60);
  S.sideBank.push({id:id(),t,cat:'灵感',type:type,xp:xp,src:'user',w:1});
  const el=document.getElementById('ideaText'); if(el) el.value='';
  addHist('补充灵感入库：'+t); save();render();
}
function drawSideQuest(kind){
  const type=kind==='daily'?'daily':(kind==='weekly'?'weekly':'monthly');
  const pool=S.sideBank.filter(b=>b.type===type && (b.w||1)>0);
  if(!pool.length){ alert('任务库为空，先去「补充灵感」。'); return; }
  const tot=pool.reduce((s,b)=>s+(b.w||1),0);
  let r=Math.random()*tot, pick=pool[0];
  for(const b of pool){ r-=(b.w||1); if(r<=0){pick=b;break;} }
  const list=sideList(kind).filter(x=>!x.mandatory);
  list.push({id:id(),bid:pick.id,t:pick.t,cat:pick.cat,type,xp:pick.xp,mandatory:true,done:false,mood:0,like:false});
  setSideList(kind,list);
  addHist('抽中强制轶事：'+pick.t); save();render();
  setTimeout(()=>{ const el=document.getElementById('qi_'+list[list.length-1].id); if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.classList.add('flash'); } },80);
}
function resetSidePool(){
  const kept=S.sideBank.filter(x=>x.src==='user');
  S.sideBank=[...defaultSideBank(),...kept];
  refreshSideQuests();
  addHist('重置江湖轶事任务库'); save();render();
}
function moodSide(kind,idv,val){
  const list=sideList(kind);
  const item=list.find(x=>x.id===idv); if(!item)return;
  item.mood=val;
  const b=S.sideBank.find(x=>x.id===item.bid);
  if(b) b.w=Math.min(5,Math.max(0.3,(b.w||1)+(val===3?0.3:(val===1?-0.2:0))));
  save();render();
}
function likeSide(kind,idv){
  const list=sideList(kind);
  const item=list.find(x=>x.id===idv); if(!item)return;
  item.like=!item.like;
  const b=S.sideBank.find(x=>x.id===item.bid);
  if(b) b.w=Math.min(5,(b.w||1)+(item.like?0.3:-0.3));
  save();render();
}
function sideListHtml(arr,kind){
  if(!arr.length) return '<div style="color:var(--dim);font-size:13px">暂无任务。点上方「抽一则」生成强制任务，或等刷新。</div>';
  const sorted=[...arr].sort((a,b)=>(a.mandatory?0:1)-(b.mandatory?0:1)||(a.done?1:0)-(b.done?1:0));
  return sorted.map(x=>{
    const catColor=CAT_COLOR[x.cat]||'var(--dim)';
    return `<div class="qitem ${x.done?'done':''} ${x.mandatory?'mandatory':''}" id="qi_${x.id}">
      <div class="chk ${x.mandatory?'force':''}" onclick="toggleSide('${kind}','${x.id}')">${x.done?'✔':(x.mandatory?'🔴':'')}</div>
      <div class="qt">${x.t}</div>
      <div class="qmeta">
        <span class="cat-tag" style="color:${catColor}">${x.cat}</span>
        <span class="qxp">+${x.xp} XP</span>
        ${x.mandatory?'<span class="force-tag">强制</span>':''}
        ${x.done?'<span class="qdate">✔ 完成</span>':''}
      </div>
      <div class="qrow">
        <span class="react ${x.mood===3?'on':''}" onclick="moodSide('${kind}','${x.id}',3)" title="心情好">😊</span>
        <span class="react ${x.mood===2?'on':''}" onclick="moodSide('${kind}','${x.id}',2)" title="一般">😐</span>
        <span class="react ${x.mood===1?'on':''}" onclick="moodSide('${kind}','${x.id}',1)" title="一般般">😕</span>
        <span class="react like ${x.like?'on':''}" onclick="likeSide('${kind}','${x.id}')" title="喜欢，多来">👍</span>
        ${!x.mandatory?`<span class="qdel" onclick="delSideQuest('${kind}','${x.id}')" title="删除">×</span>`:''}
      </div>
    </div>`;
  }).join('');
}
function addYear(){
  const t=document.getElementById('yText').value.trim(); if(!t)return;
  S.year.push({id:id(),t,paused:false,done:false,items:[]});
  document.getElementById('yText').value=''; save();render();
}
function renameQuest(kind,idx){
  const o = kind==='year'?S.year[idx]:(kind==='month'?S.month:S.week);
  const nv=prompt('重命名：',o.t);
  if(nv!==null && nv.trim()){ o.t=nv.trim(); save();render(); }
}
function pickMain(){
  const open=S.daily.filter(x=>!isDone(x, todayStr()) && (x.a==='CAREER'||x.a==='MIND'));
  if(!open.length){S.mainQ=null;save();render();return;}
  const pick=open[Math.floor(Math.random()*open.length)];
  S.mainQ=pick.id; addHist('锁定每日主线：'+pick.t); save();render();
}
function claimAch(i){S.ach[i].un=true;save();render();}
function checkAch(){ S.ach.forEach((a,i)=>{ if(a.auto && !a.un && a.auto()) a.un=true; }); }
// 连击：以「天」为粒度的活跃计数（基于活跃日期集合，支持补录历史日期）
// 完成任意一项（含年/月/周主线，休眠项不计）即把「记录日期」写入 activeDays；
// 连续天数 = 从最近活跃日（今天或昨天，链未断）向前连续的活跃天数。
function touchActivity(dateStr){
  if(!S.activeDays) S.activeDays=[];
  const d = dateStr || todayStr();
  if(!S.activeDays.includes(d)) S.activeDays.push(d);
}
function computeStreak(){
  if(!S.activeDays || !S.activeDays.length) return 0;
  const set = new Set(S.activeDays);
  const sorted=[...set].sort();
  const last=sorted[sorted.length-1];
  const today=todayStr(), y=yesterdayStr();
  if(last!==today && last!==y) return 0;          // 链已断（最近活跃早于昨天）
  let n=0;
  let [Y,M,D] = last.split('-').map(Number);
  const key=(Y,M,D)=>`${Y}-${String(M).padStart(2,'0')}-${String(D).padStart(2,'0')}`;
  while(set.has(key(Y,M,D))){
    n++;
    const d=new Date(Y, M-1, D); d.setDate(d.getDate()-1);   // 纯本地回退，避免 toISOString 时区偏移
    Y=d.getFullYear(); M=d.getMonth()+1; D=d.getDate();
  }
  return n;
}
// 补录入口：切换「记录于」日期。空字符串=今天；切到过去日期后，所有勾选都会记到那天（含 doneDate、活跃日期、历史时间戳）。
function setRecDate(v){
  REC_DATE = v || '';
  const inp=document.getElementById('recDate'); if(inp) inp.value = REC_DATE || todayStr();
  const hint=document.getElementById('recHint');
  if(hint) hint.textContent = REC_DATE
    ? ('正在补录 '+fmtMD(REC_DATE)+'：勾选的任务会记到这一天。补完点「今天」切回正常记录。')
    : '默认记今天；要补录过去某天，先选日期再勾任务。';
  save();render();
}

function newDay(){
  const today=new Date().toISOString().slice(0,10);
  if(S.lastDaily===today) return;
  S.lastDaily=today; S.mainQ=null;
  // 日常/补剂改为按日期存储，新的一天天然为空（昨天勾的只在昨天的日期下，不会显示到今天），无需清空；
  // 但每周一 / 每月初仍需把周 / 月主线进度整体重置（本周 / 本月重新做）。
  if(S.lastWeekly!==monday()){
    S.weekly.forEach(x=>{ x.donedates=[]; x.mins={}; });
    if(S.week.items) S.week.items.forEach(x=>{ x.donedates=[]; x.mins={}; });   // 周主线重置
    if(S.sideWeekly) S.sideWeekly.forEach(x=>{ x.donedates=[]; x.mins={}; });  // 周游历险重置
    S.lastWeekly=monday();
  }
  if(S.lastMonth!==thisMonth()){
    if(S.month.items) S.month.items.forEach(x=>{ x.donedates=[]; x.mins={}; }); // 月主线重置
    if(S.sideMonthly) S.sideMonthly.forEach(x=>{ x.donedates=[]; x.mins={}; }); // 月行大计重置
    S.lastMonth=thisMonth();
  }
  addHist('🌅 新的一天');
  try{ npcRoll(); seasonCheck(); letterCheck(); if(!S.enc.cur) encounterRoll(true); }catch(e){}
  save();checkAch();render();
}
function resetAll(){
  if(confirm('确定清空所有进度，从头开始？当前存档会先保存为恢复点。')){ createRestorePoint('清空前自动备份');S=defaultState(); save(); render(); }
}
function importLedger(){
  const f=document.getElementById('ledgerFile')?document.getElementById('ledgerFile').files[0]:null;
  if(!f){ alert('先选一个 xlsx / csv 文件'); return; }
  if(typeof XLSX==='undefined'){ alert('解析库未加载（需联网一次）。请联网后重试，或把文件发我，我用脚本帮你汇总。'); return; }
  const reader=new FileReader();
  reader.onload=function(e){
    try{
      const wb=XLSX.read(e.target.result,{type:'array'});
      let added=0; const seen=new Set(S.ledger.map(x=>x.date+x.name+x.amount+x.type));
      (wb.SheetNames||[]).forEach(function(sn){
        const up=(sn||'').trim();
        if(up!=='支出' && up!=='收入') return;
        const rows=XLSX.utils.sheet_to_json(wb.Sheets[sn],{defval:null});
        const typ=up==='收入'?'income':'expense';
        rows.forEach(function(r){
          const date=(r['日期']||'').toString().slice(0,10);
          const name=((r['二级分类']||r['一级分类']||r['项目']||'未命名')||'').toString().trim()||'未命名';
          const amount=parseFloat(r['金额']);
          const cat=((r['一级分类']||'未分类')||'').toString().trim()||'未分类';
          const account=((r['支出账户']||r['收入账户']||r['账户']||'现金')||'').toString().trim()||'现金';
          const note=((r['备注']||'')||'').toString().trim()||'';
          if(!date || isNaN(amount) || amount<=0) return;
          const key=date+name+amount+typ+account;
          if(seen.has(key)) return; seen.add(key);
          S.ledger.push({id:id(),date:date,name:name,amount:amount,type:typ,cat:cat,account:account,note:note,ts:new Date().toISOString()});
          added++;
        });
      });
      addHist('导入账本：'+added+' 条'); save();render();
      alert('已导入 '+added+' 条（本月支出 / 收入已自动汇总，最近记录也已更新）。重复数据已跳过。');
    }catch(err){ alert('解析失败：'+(err&&err.message?err.message:err)); }
  };
  reader.readAsArrayBuffer(f);
}
// 离线导入：从本工具生成的 ledger_import.json 合并逐笔（不依赖 SheetJS / CDN）
function importLedgerJSON(){
  const f=document.getElementById('ledgerJsonFile')?document.getElementById('ledgerJsonFile').files[0]:null;
  if(!f){ alert('先选一个 ledger_import.json 文件'); return; }
  const reader=new FileReader();
  reader.onload=function(e){
    try{
      const data=JSON.parse(e.target.result);
      const arr=Array.isArray(data)?data:(data.items||[]);
      if(!Array.isArray(arr)){ alert('文件格式不正确：应为数组或含 items 数组的 JSON'); return; }
      const seen=new Set(S.ledger.map(x=>x.id));
      let added=0;
      arr.forEach(function(it){
        if(!it || !it.date || isNaN(parseFloat(it.amount)) || parseFloat(it.amount)<=0) return;
        if(it.type!=='income' && it.type!=='expense') return;
        if(seen.has(it.id)) return; seen.add(it.id);
        S.ledger.push({
          id: it.id || id(),
          date: it.date,
          name: (it.name||'未命名').toString().trim()||'未命名',
          amount: parseFloat(it.amount),
          type: it.type,
          cat: (it.cat||'未分类').toString().trim()||'未分类',
          account: (it.account||'现金').toString().trim()||'现金',
          note: (it.note||'').toString().trim(),
          ts: it.ts || new Date().toISOString()
        });
        added++;
      });
      // 排序：按日期倒序，便于查看
      S.ledger.sort((a,b)=> (b.date||'').localeCompare(a.date||'') || (b.ts||'').localeCompare(a.ts||''));
      addHist('导入账本(JSON)：'+added+' 条'); save();render();
      alert('已合并 '+added+' 条逐笔记录（重复数据已跳过）。钱庄现在显示真实逐笔账本。');
    }catch(err){ alert('解析失败：'+(err&&err.message?err.message:err)); }
  };
  reader.readAsText(f,'utf-8');
}
function addLedger(){
  const date=document.getElementById('lDate').value||todayStr();
  const name=document.getElementById('lName').value.trim();
  const amount=parseFloat(document.getElementById('lAmount').value);
  const type=document.getElementById('lType').value;
  const cat=(document.getElementById('lCat').value||'未分类').trim();
  const note=document.getElementById('lNote').value.trim();
  if(!name || isNaN(amount) || amount<=0){ alert('请填写名称和金额'); return; }
  S.ledger.push({id:id(),date,name,amount,type,cat,note,ts:new Date().toISOString()});
  document.getElementById('lName').value='';
  document.getElementById('lAmount').value='';
  document.getElementById('lNote').value='';
  addHist('记账：'+(type==='income'?'收入':'支出')+' '+name+' ¥'+amount.toFixed(2));
  save();render();
}
function delLedger(idv){
  S.ledger=S.ledger.filter(x=>x.id!==idv); save();render();
}
function renderAssetAccounts(){
  if(!S.assets){
    return '<div style="color:var(--dim);font-size:13px">尚未录入资产快照。去「⚙️ 数据&设置 → 💰 资产快照」录入（仅存本机，公开页面不含真实数据）。</div>';
  }
  const A=S.assets;
  const groups={};
  A.accounts.forEach(a=>{ groups[a.group]=(groups[a.group]||[]); groups[a.group].push(a); });
  const max=Math.max(...A.accounts.map(a=>a.value));
  let html=`<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px"><div style="flex:1;min-width:120px"><div style="font-size:11px;color:var(--dim)">总资产</div><div style="font-size:20px;font-weight:700;color:var(--grw)">¥${A.total.toFixed(2)}</div></div><div style="flex:1;min-width:120px"><div style="font-size:11px;color:var(--dim)">总负债</div><div style="font-size:20px;font-weight:700;color:#ff7a7a">¥${A.debt.toFixed(2)}</div></div><div style="flex:1;min-width:120px"><div style="font-size:11px;color:var(--dim)">净资产</div><div style="font-size:20px;font-weight:700;color:var(--gold)">¥${A.net.toFixed(2)}</div></div></div>`;
  Object.entries(groups).forEach(([g,list])=>{
    const groupSum=list.reduce((s,a)=>s+a.value,0);
    html+=`<div style="margin-top:12px;font-size:12px;color:var(--dim);border-bottom:1px solid var(--line);padding-bottom:4px;margin-bottom:6px">${g} · 合计 ¥${groupSum.toFixed(2)}</div>`;
    list.sort((a,b)=>b.value-a.value).forEach(a=>{
      const pct=max?a.value/max*100:0;
      html+=`<div class="ledger-cat"><span class="ledger-cat-name" style="flex:0 0 120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${a.name}">${a.name}</span><div class="ledger-cat-bar"><div style="width:${pct}%;"></div></div><span class="ledger-cat-sum">¥${a.value.toFixed(2)}</span></div>`;
    });
  });
  return html;
}

/* ---------- 资产快照录入（数据&设置页）：真实数据仅存本机 S.assets ---------- */
function renderAssetEditor(){
  const wrap=document.getElementById('assetRows'); if(!wrap) return;
  const dEl=document.getElementById('assetDebt'); if(dEl) dEl.value=(S.assets&&S.assets.debt)||0;
  const acc=(S.assets&&S.assets.accounts)||[];
  wrap.innerHTML=(acc.length?acc.map((a,i)=>assetRowHtml(i,a)).join(''):'<div style="color:var(--dim);font-size:12px">暂无账户，点「📋 载入模板」或「＋ 添加账户」。</div>');
  recalcAssets();
}
function assetRowHtml(i,a){
  const groups=['现金账户','储蓄账户','虚拟账户','投资账户'];
  const sel=`<select onchange="assetRowChange(${i},'group',this.value)" style="padding:5px 8px;border-radius:8px;border:1px solid var(--line);background:var(--panel2);color:var(--txt)">${groups.map(g=>`<option ${g===a.group?'selected':''}>${g}</option>`).join('')}</select>`;
  return `<div class="addrow" style="gap:8px;margin:6px 0;align-items:center">
    <input type="text" placeholder="账户名" value="${a.name||''}" oninput="assetRowChange(${i},'name',this.value)" style="width:150px;padding:6px 9px;border-radius:8px;border:1px solid var(--line);background:var(--panel2);color:var(--txt)">
    ${sel}
    <input type="number" placeholder="余额" value="${a.value!=null?a.value:''}" oninput="assetRowChange(${i},'value',this.value)" style="width:120px;padding:6px 9px;border-radius:8px;border:1px solid var(--line);background:var(--panel2);color:var(--txt)">
    <button class="btn sm ghost" onclick="delAssetRow(${i})">✕</button>
  </div>`;
}
function assetRowChange(i,field,val){
  if(!S.assets) S.assets={date:'',total:0,debt:0,net:0,accounts:[]};
  if(!S.assets.accounts[i]) S.assets.accounts[i]={name:'',group:'现金账户',value:0};
  if(field==='value') S.assets.accounts[i].value=parseFloat(val)||0; else S.assets.accounts[i][field]=val;
  recalcAssets();
}
function addAssetRow(){
  if(!S.assets) S.assets={date:'',total:0,debt:0,net:0,accounts:[]};
  S.assets.accounts.push({name:'',group:'现金账户',value:0});
  renderAssetEditor();
}
function fillAssetTemplate(){
  S.assets={date:'',total:0,debt:0,net:0,accounts:ASSETS_TEMPLATE.accounts.map(a=>({...a}))};
  renderAssetEditor();
}
function delAssetRow(i){
  if(S.assets) S.assets.accounts.splice(i,1);
  renderAssetEditor();
}
function recalcAssets(){
  const debt=S.assets? (parseFloat(document.getElementById('assetDebt').value)||0):0;
  if(S.assets) S.assets.debt=debt;
  const acc=S.assets?S.assets.accounts:[];
  const total=acc.reduce((s,a)=>s+(parseFloat(a.value)||0),0);
  const tEl=document.getElementById('assetTotal'); if(tEl) tEl.textContent='¥'+total.toFixed(2);
  const nEl=document.getElementById('assetNet'); if(nEl) nEl.textContent='¥'+(total-debt).toFixed(2);
}
function saveAssets(){
  if(!S.assets||!S.assets.accounts.length){ alert('请先「📋 载入模板」或「＋ 添加账户」再保存'); return; }
  S.assets.date=todayStr();
  S.assets.total=S.assets.accounts.reduce((s,a)=>s+(parseFloat(a.value)||0),0);
  S.assets.net=S.assets.total-S.assets.debt;
  save();
  const sEl=document.getElementById('assetSaved'); if(sEl) sEl.textContent='✅ 已保存 '+S.assets.accounts.length+' 个账户，净资产 ¥'+S.assets.net.toFixed(2)+'（'+todayStr()+'）。清缓存后用「📂 导入存档」可恢复。';
  render();
}

function renderLedgerBaseline(year){
  const B=LEDGER_BASELINE;
  const A=S.assets||ASSETS_TEMPLATE;
  const _ha=!!S.assets;
  const nwEl=document.getElementById('ledgerNetWorth');
  if(nwEl) nwEl.innerHTML=`<div class="ledger-big"><span class="ledger-label">当前家产（净资产）</span><span class="ledger-net income">${_ha?'¥'+A.net.toFixed(2):'未录入'}</span></div><div class="ledger-big"><span class="ledger-label">总资产</span><span class="ledger-income">${_ha?'¥'+A.total.toFixed(2):'—'}</span></div><div class="ledger-big"><span class="ledger-label">总负债</span><span class="ledger-expense">${_ha?'¥'+A.debt.toFixed(2):'—'}</span></div><div class="ledger-big"><span class="ledger-label">两年现金流净额</span><span class="ledger-net">¥${B.net.toFixed(2)}</span></div><div class="hint">${_ha?('账户快照 '+A.date+'. '):'资产快照未录入（去「⚙️ 数据&设置 → 💰 资产快照」录入，仅存本机）. '}累计收入 +¥${B.incomeTotal.toFixed(2)} / 累计支出 -¥${B.expenseTotal.toFixed(2)} 仅作现金流参考。</div>`;
  const accEl=document.getElementById('ledgerAccounts'); if(accEl) accEl.innerHTML=renderAssetAccounts();
  const summary=document.getElementById('ledgerSummary'); if(summary) summary.innerHTML='<div style="color:var(--dim);font-size:13px">逐笔账本为空，无法统计当月。导入 xlsx 后显示当月账簿。</div>';
  const catEl=document.getElementById('ledgerCats'); if(catEl) catEl.innerHTML='';
  const incEl=document.getElementById('ledgerYearIncome'); if(incEl) incEl.innerHTML=Object.entries(B.incomeByCat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="ledger-cat"><span class="ledger-cat-name">${k}</span><div class="ledger-cat-bar"><div style="width:${v/B.incomeTotal*100}%"></div></div><span class="ledger-cat-sum">+¥${v.toFixed(2)}</span></div>`).join('');
  const expEl=document.getElementById('ledgerYearExpense'); if(expEl) expEl.innerHTML=Object.entries(B.expenseByCat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="ledger-cat"><span class="ledger-cat-name">${k}</span><div class="ledger-cat-bar"><div style="width:${v/B.expenseTotal*100}%"></div></div><span class="ledger-cat-sum">-¥${v.toFixed(2)}</span></div>`).join('');
  const advEl=document.getElementById('ledgerAdvice');
  if(advEl){
    const yB=B.byYear[year]||{income:0,expense:0}; const yProfit=yB.income-yB.expense;
    const topExp=Object.entries(B.expenseByCat).sort((a,b)=>b[1]-a[1])[0];
    const tips=[];
    if(S.assets) tips.push(`当前家产（净资产）为 ¥${S.assets.net.toFixed(2)}（${S.assets.date} 录入）。`);
    else tips.push(`历史基线两年净现金流约 ¥${B.net.toFixed(2)}（${B.range}）；净资产请在「⚙️ 数据&设置 → 💰 资产快照」录入。`);
    tips.push(yProfit>=0?`今年（${year}）净结余约 ¥${yProfit.toFixed(2)}。`:`今年（${year}）净支出约 ¥${Math.abs(yProfit).toFixed(2)}，注意控制开支。`);
    tips.push(`最大支出类为「${topExp[0]}」¥${topExp[1].toFixed(2)}，可单独设月度预算。`);
    tips.push(`以上为汇总基线、非逐笔。重新导入 xlsx（需联网加载解析库）可看逐笔与当月明细。`);
    advEl.innerHTML=tips.map(t=>`<div class="dash-row" style="border-bottom:1px dashed var(--line);padding:6px 0"><span>${t}</span></div>`).join('');
  }
  const list=document.getElementById('ledgerList'); if(list) list.innerHTML='<div style="color:var(--dim);font-size:13px">历史基线为汇总数据，无逐笔明细。想看逐笔请重新导入随手记 xlsx。</div>';
}

function ledgerHtml(){
  const _sd=document.getElementById('assetSnapshotDate'); if(_sd) _sd.textContent = S.assets? S.assets.date : '未录入';
  const month=thisMonth();
  const year=new Date().getFullYear().toString();

  // 金币人生：目标环 + 图表（不依赖逐笔明细，两种分支都渲染）
  try{ renderCoin(); }catch(e){ console.error('renderCoin',e); }

  // 无逐笔账本 → 展示历史基线
  if(!S.ledger.length && typeof LEDGER_BASELINE!=='undefined'){
    renderLedgerBaseline(year);
    return;
  }

  // 当前家产：以随手记账户快照为基准，ledger 里的收支只作现金流参考
  const A=S.assets||ASSETS_TEMPLATE;
  const _ha=!!S.assets;
  const allIncome=S.ledger.filter(x=>x.type==='income').reduce((s,x)=>s+x.amount,0);
  const allExpense=S.ledger.filter(x=>x.type==='expense').reduce((s,x)=>s+x.amount,0);
  const cashFlowNet=allIncome-allExpense;
  const nwEl=document.getElementById('ledgerNetWorth');
  if(nwEl) nwEl.innerHTML=`<div class="ledger-big"><span class="ledger-label">当前家产（净资产）</span><span class="ledger-net income">${_ha?'¥'+A.net.toFixed(2):'未录入'}</span></div><div class="ledger-big"><span class="ledger-label">总资产</span><span class="ledger-income">${_ha?'¥'+A.total.toFixed(2):'—'}</span></div><div class="ledger-big"><span class="ledger-label">总负债</span><span class="ledger-expense">${_ha?'¥'+A.debt.toFixed(2):'—'}</span></div><div class="ledger-big"><span class="ledger-label">两年现金流净额</span><span class="ledger-net">¥${cashFlowNet.toFixed(2)}</span></div><div class="hint">${_ha?('账户快照 '+A.date+'. '):'资产快照未录入（去「⚙️ 数据&设置 → 💰 资产快照」录入，仅存本机）. '}累计收入 +¥${allIncome.toFixed(2)} / 累计支出 -¥${allExpense.toFixed(2)} 仅作现金流参考。</div>`;

  // 账户情况：展示随手记账户快照分组
  const accEl=document.getElementById('ledgerAccounts');
  if(accEl) accEl.innerHTML=renderAssetAccounts();

  // 当月账簿
  const items=S.ledger.filter(x=>x.date&&x.date.startsWith(month)).sort((a,b)=>b.date.localeCompare(a.date)||b.ts.localeCompare(a.ts));
  const income=items.filter(x=>x.type==='income').reduce((s,x)=>s+x.amount,0);
  const expense=items.filter(x=>x.type==='expense').reduce((s,x)=>s+x.amount,0);
  const summary=document.getElementById('ledgerSummary');
  if(summary) summary.innerHTML=`<div class="ledger-big"><span class="ledger-label">本月收入</span><span class="ledger-income">+¥${income.toFixed(2)}</span></div><div class="ledger-big"><span class="ledger-label">本月支出</span><span class="ledger-expense">-¥${expense.toFixed(2)}</span></div><div class="ledger-big"><span class="ledger-label">本月结余</span><span class="ledger-net ${income-expense>=0?'income':'expense'}">¥${(income-expense).toFixed(2)}</span></div>`;
  const cats={};
  items.filter(x=>x.type==='expense').forEach(x=>{ cats[x.cat]=(cats[x.cat]||0)+x.amount; });
  const catEl=document.getElementById('ledgerCats');
  if(catEl){
    const total=Object.values(cats).reduce((a,b)=>a+b,0)||1;
    catEl.innerHTML='<div style="font-size:13px;color:var(--dim);margin-bottom:6px">本月支出分类</div>'+Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>{
      const pct=v/total*100;
      return `<div class="ledger-cat"><span class="ledger-cat-name">${k}</span><div class="ledger-cat-bar"><div style="width:${pct}%"></div></div><span class="ledger-cat-sum">¥${v.toFixed(2)}</span></div>`;
    }).join('')||(total<=1?'<div style="color:var(--dim);font-size:12px">暂无支出记录</div>':'');
  }

  // 今年收支分类
  function yearCats(type, elId, label){
    const map={};
    S.ledger.filter(x=>x.date&&x.date.startsWith(year)&&x.type===type).forEach(x=>{ map[x.cat]=(map[x.cat]||0)+x.amount; });
    const el=document.getElementById(elId);
    if(el){
      const total=Object.values(map).reduce((a,b)=>a+b,0)||1;
      el.innerHTML=total<=1?`<div style="color:var(--dim);font-size:13px">暂无${label}记录。</div>`:Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([k,v])=>{
        const pct=v/total*100;
        return `<div class="ledger-cat"><span class="ledger-cat-name">${k}</span><div class="ledger-cat-bar"><div style="width:${pct}%"></div></div><span class="ledger-cat-sum">${type==='income'?'+':'-'}¥${v.toFixed(2)}</span></div>`;
      }).join('');
    }
  }
  yearCats('income','ledgerYearIncome','收入');
  yearCats('expense','ledgerYearExpense','支出');

  // 优化建议
  const advEl=document.getElementById('ledgerAdvice');
  if(advEl){
    if(!S.ledger.length){
      advEl.innerHTML='<div style="color:var(--dim);font-size:13px">导入账本后，这里会根据你的收支结构给出建议。</div>';
    } else {
      const yIncome=S.ledger.filter(x=>x.date&&x.date.startsWith(year)&&x.type==='income').reduce((s,x)=>s+x.amount,0);
      const yExpense=S.ledger.filter(x=>x.date&&x.date.startsWith(year)&&x.type==='expense').reduce((s,x)=>s+x.amount,0);
      const yProfit=yIncome-yExpense;
      const yCats={}; S.ledger.filter(x=>x.date&&x.date.startsWith(year)&&x.type==='expense').forEach(x=>{ yCats[x.cat]=(yCats[x.cat]||0)+x.amount; });
      const topCat=Object.entries(yCats).sort((a,b)=>b[1]-a[1])[0];
      const tips=[];
      if(yProfit<0) tips.push(`今年净支出 ¥${Math.abs(yProfit).toFixed(2)}，建议优先控制「${topCat?topCat[0]:'支出'}」大类。`);
      else tips.push(`今年净结余 ¥${yProfit.toFixed(2)}，储蓄率约 ${yIncome>0?(yProfit/yIncome*100).toFixed(1):0}%。`);
      if(topCat && yExpense>0 && topCat[1]/yExpense>0.3) tips.push(`「${topCat[0]}」占今年支出 ${(topCat[1]/yExpense*100).toFixed(1)}%，是最大开支项，可单独设一个月度预算上限。`);
      if(expense>income && items.length) tips.push(`本月超支 ¥${(expense-income).toFixed(2)}，下月可先覆盖缺口再恢复储蓄。`);
      if(!S.ledger.some(x=>x.date&&x.date.startsWith(year)&&x.cat==='储蓄'||x.name.includes('储蓄'))) tips.push(`还没有独立的「储蓄」分类记录，建议每月工资到账先转一笔固定储蓄，再安排支出。`);
      advEl.innerHTML=tips.map(t=>`<div class="dash-row" style="border-bottom:1px dashed var(--line);padding:6px 0"><span>${t}</span></div>`).join('');
    }
  }

  const list=document.getElementById('ledgerList');
  if(list){
    const recent=S.ledger.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.ts.localeCompare(a.ts)).slice(0,50);
    list.innerHTML=recent.length?recent.map(x=>`<div class="ledger-row ${x.type}"><span class="ledger-date">${x.date}</span><span class="ledger-name">${x.name}</span><span class="ledger-cat-tag">${x.cat}</span><span class="ledger-amount">${x.type==='income'?'+':'-'}¥${x.amount.toFixed(2)}</span>${x.note?'<span class="ledger-note">'+x.note+'</span>':''}<span class="qdel" onclick="delLedger('${x.id}')" title="删除">×</span></div>`).join(''):'<div style="color:var(--dim);font-size:13px">还没有记账记录。</div>';
  }
}

/* ============ 金币人生（硬币化钱庄） ============ */
function coinPool(){
  const inc=S.ledger.filter(x=>x.type==='income').reduce((s,x)=>s+(+x.amount||0),0);
  const exp=S.ledger.filter(x=>x.type==='expense').reduce((s,x)=>s+(+x.amount||0),0);
  return (+S.coin.initial||0) + inc - exp;
}
function fmtCoin(v){
  v=Math.round(v||0);
  return (v>=10000? (v/10000).toFixed(2)+'万' : v.toLocaleString());
}
function saveCoinSettings(){
  const t=document.getElementById('coinTarget'), i=document.getElementById('coinInitial');
  S.coin.target=Math.max(0, parseFloat(t&&t.value)||0);
  S.coin.initial=Math.max(0, parseFloat(i&&i.value)||0);
  save(); render();
}
function addCoinDay(){
  const dEl=document.getElementById('cDate'), hEl=document.getElementById('cHours'), iEl=document.getElementById('cInc'), eEl=document.getElementById('cExp');
  const date=(dEl&&dEl.value)||todayStr();
  const hours=parseFloat(hEl&&hEl.value)||0;
  const inc=parseFloat(iEl&&iEl.value)||0;
  const exp=parseFloat(eEl&&eEl.value)||0;
  if(inc<=0 && exp<=0 && hours<=0){ alert('至少填一项：搬砖时长 / 收入 / 支出'); return; }
  const ts=new Date().toISOString();
  const links=[];
  if(inc>0){ const idv=id(); S.ledger.push({id:idv,date,name:'搬砖收入',amount:inc,type:'income',cat:'搬砖',note:'金币·搬砖',ts}); links.push(idv); }
  if(exp>0){ const idv=id(); S.ledger.push({id:idv,date,name:'搬砖支出',amount:exp,type:'expense',cat:'搬砖',note:'金币·搬砖',ts}); links.push(idv); }
  S.coin.labor.push({id:id(),date,hours,inc,exp,link:links.join(',')});
  save(); render();
}
function delCoinDay(did){
  const rec=S.coin.labor.find(x=>x.id===did);
  if(rec && rec.link){ rec.link.split(',').forEach(lid=>{ S.ledger=S.ledger.filter(x=>x.id!==lid); }); }
  S.coin.labor=S.coin.labor.filter(x=>x.id!==did);
  save(); render();
}
function monthlyAgg(){
  const map={};
  S.ledger.forEach(x=>{ if(!x.date) return; const m=x.date.slice(0,7); if(!map[m]) map[m]={m,inc:0,exp:0}; map[m][x.type==='income'?'inc':'exp']+=(+x.amount||0); });
  return Object.values(map).sort((a,b)=>a.m.localeCompare(b.m));
}
function polar(cx,cy,r,deg){ const a=(deg-90)*Math.PI/180; return {x:cx+r*Math.cos(a), y:cy+r*Math.sin(a)}; }
function donutSeg(cx,cy,r,ir,a0,a1,color){
  const p0=polar(cx,cy,r,a0), p1=polar(cx,cy,r,a1), p2=polar(cx,cy,ir,a1), p3=polar(cx,cy,ir,a0);
  const large=(a1-a0)>180?1:0;
  return `<path d="M${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A${r} ${r} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} L${p2.x.toFixed(2)} ${p2.y.toFixed(2)} A${ir} ${ir} 0 ${large} 0 ${p3.x.toFixed(2)} ${p3.y.toFixed(2)} Z" fill="${color}"/>`;
}
function areaChart(series, color){
  if(!series || series.length<1) return '<div class="hint" style="margin:10px 0;font-size:12px">数据不足。</div>';
  const W=300,H=120,pad=18;
  const vals=series.map(s=>s.v);
  let min=Math.min.apply(null,vals.concat([0])), max=Math.max.apply(null,vals.concat([0]));
  if(min===max){ min-=1; max+=1; }
  const n=series.length;
  const X=i=> pad + i*(W-2*pad)/(n-1);
  const Y=v=> H-pad - (v-min)/(max-min)*(H-2*pad);
  const pts=series.map((s,i)=>X(i).toFixed(1)+','+Y(s.v).toFixed(1)).join(' ');
  const area=pad+','+(H-pad)+' '+pts+' '+(W-pad)+','+(H-pad);
  const lbls=series.map((s,i)=>{
    const last=i===n-1, first=i===0, mid=i===Math.floor(n/2);
    if(!(first||mid||last)) return '';
    const anchor=first?'start':(last?'end':'middle');
    return `<text x="${X(i).toFixed(1)}" y="${H-4}" text-anchor="${anchor}" fill="var(--dim)" font-size="9">${s.m.slice(2)}</text>`;
  }).join('');
  return '<svg viewBox="0 0 '+W+' '+H+'" width="100%" height="140" preserveAspectRatio="none" style="display:block">'+
    '<polygon points="'+area+'" fill="'+color+'" opacity="0.12"/>'+
    '<polyline points="'+pts+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'+
    '<circle cx="'+X(n-1).toFixed(1)+'" cy="'+Y(vals[n-1]).toFixed(1)+'" r="3" fill="'+color+'"/>'+
    lbls+'</svg>';
}
function renderCoin(){
  const tEl=document.getElementById('coinTarget'); if(tEl && document.activeElement!==tEl) tEl.value=(S.coin.target||0);
  const iEl=document.getElementById('coinInitial'); if(iEl && document.activeElement!==iEl) iEl.value=(S.coin.initial||0);
  renderCoinGoal(); renderCoinTrend(); renderCoinDonut(); renderCoinAccum(); renderCoinLabor(); renderCoinDayList();
}
function renderCoinGoal(){
  const ring=document.getElementById('coinRing'); if(!ring) return;
  const pool=coinPool(), target=(+S.coin.target||0);
  const pct = target>0 ? Math.min(100, pool/target*100) : 0;
  const remain = target - pool;
  const R=52, C=2*Math.PI*R, off=C*(1-pct/100);
  ring.innerHTML = `<svg viewBox="0 0 120 120" width="140" height="140">
    <circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--panel2)" stroke-width="12"/>
    <circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--gold)" stroke-width="12" stroke-linecap="round"
      stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 60 60)"/>
    <text x="60" y="55" text-anchor="middle" fill="var(--txt)" font-size="16" font-weight="700">${pct.toFixed(0)}%</text>
    <text x="60" y="74" text-anchor="middle" fill="var(--dim)" font-size="10">已达目标</text>
  </svg>`;
  const st=document.getElementById('coinStats'); if(st){
    st.innerHTML = `<div class="cs-row"><span>🪙 当前金币</span><b class="cs-gold">${fmtCoin(pool)}</b></div>
      <div class="cs-row"><span>🎯 目标金币</span><b>${fmtCoin(target)}</b></div>
      <div class="cs-row"><span>${remain>=0?'📉 还差':'✅ 已超出'}</span><b class="${remain>=0?'cs-warn':'cs-ok'}">${fmtCoin(Math.abs(remain))}</b></div>`;
  }
}
function renderCoinTrend(){
  const el=document.getElementById('coinTrend'); if(!el) return;
  const months=monthlyAgg();
  if(months.length<1){ el.innerHTML='<div class="hint" style="margin:10px 0;font-size:12px">还没有收支记录。导入账单或记账后这里会显示每月收支对比。</div>'; return; }
  const maxV=Math.max(1,...months.map(m=>Math.max(m.inc,m.exp)));
  const W=(100/months.length).toFixed(2);
  const cols=months.map(m=>{
    const hi=m.inc/maxV*100, he=m.exp/maxV*100;
    return `<div class="bar-col" style="width:${W}%"><div class="bar-pair"><div class="bar inc" style="height:${hi}%"></div><div class="bar exp" style="height:${he}%"></div></div><div class="bar-cap">${m.m.slice(2)}</div></div>`;
  }).join('');
  el.innerHTML=`<div class="bar-chart">${cols}</div><div class="bar-legend"><span class="lg inc">收入</span><span class="lg exp">支出</span></div>`;
}
function renderCoinDonut(){
  const el=document.getElementById('coinCatDonut'); if(!el) return;
  const cats={};
  S.ledger.filter(x=>x.type==='expense').forEach(x=>{ const k=x.cat||'其他'; cats[k]=(cats[k]||0)+(+x.amount||0); });
  const entries=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
  const total=entries.reduce((s,e)=>s+e[1],0);
  if(total<=0){ el.innerHTML='<div class="hint" style="margin:10px 0;font-size:12px">还没有支出记录。</div>'; return; }
  const palette=['#ff7a7a','#ffb86c','#f6c177','#a3be8c','#88c0d0','#b48ead','#81a1c1','#ebcb8b','#bf616a','#d08770'];
  let a0=0; const segs=[];
  entries.forEach((e,i)=>{ const ang=e[1]/total*360; const a1=a0+ang; segs.push(donutSeg(60,60,50,38,a0,a1,palette[i%palette.length])); a0=a1; });
  const legend=entries.map((e,i)=>`<div class="dn-lg"><span class="dn-dot" style="background:${palette[i%palette.length]}"></span>${e[0]} <b>${fmtCoin(e[1])}</b> <span class="dn-pct">${(e[1]/total*100).toFixed(1)}%</span></div>`).join('');
  el.innerHTML=`<div class="dn-wrap"><svg viewBox="0 0 120 120" width="160" height="160">${segs.join('')}<circle cx="60" cy="60" r="38" fill="var(--panel)"/><text x="60" y="56" text-anchor="middle" fill="var(--txt)" font-size="13" font-weight="700">${fmtCoin(total)}</text><text x="60" y="73" text-anchor="middle" fill="var(--dim)" font-size="10">总支出</text></svg><div class="dn-legend">${legend}</div></div>`;
}
function renderCoinAccum(){
  const el=document.getElementById('coinAccum'); if(!el) return;
  const months=monthlyAgg();
  if(months.length<1){ el.innerHTML='<div class="hint" style="margin:10px 0;font-size:12px">导入账单或记账后，这里显示累计余额曲线。</div>'; return; }
  let run=(+S.coin.initial||0);
  const pts=months.map(m=>{ run+=m.inc-m.exp; return {m:m.m, v:run}; });
  el.innerHTML=areaChart(pts, 'var(--gold)');
}
function renderCoinLabor(){
  const el=document.getElementById('coinLabor'); if(!el) return;
  const map={};
  S.coin.labor.forEach(x=>{ if(!x.date) return; const m=x.date.slice(0,7); map[m]=(map[m]||0)+(+x.hours||0); });
  const entries=Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0]));
  if(!entries.length){ el.innerHTML='<div class="hint" style="margin:10px 0;font-size:12px">还没有搬砖时长记录。用「每日搬砖打卡」记一下吧。</div>'; return; }
  const maxV=Math.max(1,...entries.map(e=>e[1]));
  const W=(100/entries.length).toFixed(2);
  const cols=entries.map(([m,v])=>`<div class="bar-col" style="width:${W}%"><div class="bar-pair solo"><div class="bar labor" style="height:${v/maxV*100}%"></div></div><div class="bar-cap">${m.slice(2)}</div><div class="bar-val">${v}h</div></div>`).join('');
  el.innerHTML=`<div class="bar-chart solo">${cols}</div>`;
}
function renderCoinDayList(){
  const el=document.getElementById('coinDayList'); if(!el) return;
  const list=S.coin.labor.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30);
  el.innerHTML = list.length? list.map(x=>`<div class="coin-day"><span class="cd-date">${x.date}</span><span class="cd-h">⛏ ${x.hours||0}h</span>${x.inc>0?`<span class="cd-inc">+${fmtCoin(x.inc)}</span>`:''}${x.exp>0?`<span class="cd-exp">-${fmtCoin(x.exp)}</span>`:''}<span class="qdel" onclick="delCoinDay('${x.id}')" title="删除">×</span></div>`).join('') : '<div class="hint" style="margin:8px 0;font-size:12px">还没有搬砖打卡记录。</div>';
}

function recordHours(gi,min){
  const g=S.goals[gi]; if(!g)return;
  g.cur=Math.max(0,+(g.cur+min/60).toFixed(2));
  addHist('长期目标 '+g.n+' '+(min>0?'+':'')+(min>=0?h(min):'-'+h(-min)));
  save();render();
}
function claimMilestone(gi,mi){
  const g=S.goals[gi]; if(!g)return;
  const m=g.milestones[mi];
  if(m&&m.skill){ m.reached=true; addHist('达成里程碑：'+g.n+' · '+m.label); save();render(); }
}
function editGoalTotal(gi){
  const g=S.goals[gi]; if(!g)return;
  const nv=prompt('修改总目标（小时）：',g.total);
  const v=parseFloat(nv);
  if(nv!==null && v>0){ g.total=v; save();render(); }
}
function toggleHistory(){
  const b=document.getElementById('histBox');
  b.style.display = b.style.display==='none'?'block':'none';
}
function pushWechat(){
  let token=S.pushToken || prompt('输入 pushplus token（一次填入即记住）：');
  if(!token) return;
  S.pushToken=token; save();
  const today=todayStr();
  const mq=[...S.daily,...S.weekly].find(x=>x.id===S.mainQ);
  const lines=['🎯 每日主线：'+(mq?(isDone(mq,today)?'✔ ':'')+mq.t:'未锁定'),'— 每日任务 —'];
  S.daily.forEach(x=>lines.push((isDone(x,today)?'✔':'○')+' '+x.t));
  lines.push('— 每日补剂 —');
  S.supps.forEach(x=>lines.push((isDone(x,today)?'✔':'○')+' '+x.t));
  lines.push('— 周常 —');
  S.weekly.forEach(x=>lines.push((isDone(x,today)?'✔':'○')+' '+x.t));
  lines.push('📱 手机随时打卡：http://192.168.1.76:8000 （同 WiFi 打开）');
  const url='https://www.pushplus.plus/send?token='+encodeURIComponent(token)+'&title='+encodeURIComponent('人生RPG·今日打卡')+'&content='+encodeURIComponent(lines.join('\n'));
  fetch(url).then(r=>r.json()).then(j=>{ addHist('推送今日打卡到微信'); alert(j&&j.code===200?'已推送到微信 ✅':'推送失败：'+(j&&j.msg||'未知错误')); }).catch(e=>alert('推送出错（检查网络/token）：'+e.message));
}

function optAttrs(sel){
  return Object.keys(ATTRS).map(k=>`<option value="${k}" ${sel===k?'selected':''}>${ATTRS[k].name}</option>`).join('');
}
function bmWeekHours(){
  let m=0;
  const wkStart=monday();
  [...S.daily,...S.weekly].forEach(q=>{
    if(q.tags && q.tags.includes('badminton') && Array.isArray(q.donedates)){
      q.donedates.forEach(dt=>{ if(dt>=wkStart && q.mins && q.mins[dt]) m+=q.mins[dt]; });
    }
  });
  return m;
}
function recText(x){
  if(x.rec===undefined) return '';
  if(typeof x.rec==='number') return `<span class="qmin">推荐 ${x.rec}min</span>`;
  return `<span class="qmin">${x.rec}</span>`;
}
function listHtml(arr,kind){
  if(!arr.length) return '<div style="color:var(--dim);font-size:13px">暂无，下面加一个。</div>';
  const d=REC_DATE||todayStr();
  // 已完成（当前查看日期）排到末尾，未完成的保持原顺序在前，列表更清爽
  const sorted=[...arr].sort((a,b)=>(isDone(a,d)?1:0)-(isDone(b,d)?1:0));
  return sorted.map(x=>{
    const done=isDone(x,d);
    if(x.mode==='time'){
      const am=done?((x.mins&&x.mins[d])||x.min||0):0;
      const predMin=(!done&&x.mode==='time')?(x.rec||x.min||0):0;
      const predW=predMin*RATE*(S.weights[safeAttr(x.a)]||1);
      const mins=(x.mins&&x.mins[d])||'';
      return `<div class="qitem ${done?'done':''}" id="qi_${x.id}">
        <div class="chk"></div>
        <div class="qt">${x.t}</div>
        <div class="qmeta">
          ${recText(x)}
          <input type="number" id="min_${x.id}" value="${done?mins:''}" placeholder="${done?'再填则叠加':'分钟'}" min="1" style="width:58px">
          ${done?`<span class="qxp">+${am*RATE} XP（${ATTRS[safeAttr(x.a)].name}）</span><span class="qadd" onclick="addMin(S.${kind},'${x.id}')" title="点一次：输入框有数字则按该值叠加；为空则按推荐 ${x.rec||x.min||10} min 叠加">+${x.rec||x.min||10}min</span>`:`<span class="qxp dim">预计 +${predW.toFixed(0)} 加权</span>`}
          <span style="color:${ATTRS[safeAttr(x.a)].color}">${ATTRS[safeAttr(x.a)].name}</span>
          ${x.tags&&x.tags.includes('badminton')?'<span class="qtag">🏸羽毛球</span>':''}
          ${done?`<span class="qdate">📅 ${fmtMD(lastDoneDate(x))}</span>`:''}
          ${!done && lfDaysLeft(x,d)>0?`<span class="qcool">⏳ 冷却中·还需${lfDaysLeft(x,d)}天</span>`:''}
        </div>
        <button class="btn ghost sm" onclick="toggle(S.${kind},'${x.id}')">${done?'撤销':'完成'}</button>
        <div class="qdel" onclick="delQuest('${kind}','${x.id}')" title="删除">×</div>
      </div>`;
    }
    return `<div class="qitem ${done?'done':''}" id="qi_${x.id}">
      <div class="chk" onclick="toggle(S.${kind},'${x.id}')">${done?'✔':''}</div>
      <div class="qt">${x.t}</div>
      <div class="qmeta">
        <span class="qxp">+${x.xp} XP</span>
        ${x.min?`<span class="qmin">${x.min}min</span>`:''}
        ${recText(x)}
        <span style="color:${ATTRS[safeAttr(x.a)].color}">${ATTRS[safeAttr(x.a)].name}</span>
        ${x.tags&&x.tags.includes('badminton')?'<span class="qtag">🏸羽毛球</span>':''}
        ${done?`<span class="qdate">📅 ${fmtMD(lastDoneDate(x))}</span>`:''}
        ${!done && lfDaysLeft(x,d)>0?`<span class="qcool">⏳ 冷却中·还需${lfDaysLeft(x,d)}天</span>`:''}
      </div>
      <div class="qdel" onclick="delQuest('${kind}','${x.id}')" title="删除">×</div>
    </div>`;
  }).join('');
}

// ===== 旅行地图：自绘世界地图 + 地点解锁 + 感受记录（合规：台湾属中国、含南海诸岛） =====
function projX(lng){ return ((lng+180)/360*1000).toFixed(1); }
function projY(lat){ return ((90-lat)/180*500).toFixed(1); }
const CH_LNG0=73, CH_LNG1=135, CH_LAT0=10, CH_LAT1=53.5;
const CH_W=1000;
const CH_H=Math.round((CH_LAT1-CH_LAT0)/(CH_LNG1-CH_LNG0)*CH_W);
function chX(lng){ return (lng-CH_LNG0)/(CH_LNG1-CH_LNG0)*CH_W; }
function chY(lat){ return (CH_LAT1-lat)/(CH_LAT1-CH_LAT0)*CH_H; }
const CHINA_PROV = [{"n":"北京市","d":"M715 208 L716 209 L717 209 L716 208 L717 207 L718 208 L718 207 L716 207 L715 207 L714 207 L713 207 L712 207 L711 206 L710 207 L709 206 L708 206 L708 205 L707 204 L706 204 L705 203 L704 202 L705 201 L704 201 L703 201 L704 201 L703 202 L702 202 L701 202 L701 203 L700 203 L699 203 L701 205 L701 206 L699 205 L699 206 L698 206 L698 205 L697 206 L696 207 L695 208 L694 208 L693 209 L693 208 L692 208 L691 208 L691 209 L690 209 L689 210 L690 210 L690 211 L691 212 L692 212 L693 213 L693 214 L692 214 L691 215 L690 215 L690 216 L687 216 L686 217 L685 217 L685 218 L684 218 L684 219 L685 219 L686 219 L686 220 L687 221 L686 221 L685 221 L685 222 L685 223 L686 224 L687 224 L688 224 L689 225 L690 226 L691 226 L691 225 L692 225 L692 224 L693 225 L693 224 L693 225 L694 225 L695 225 L696 225 L697 224 L697 225 L698 226 L699 226 L699 227 L701 227 L701 226 L700 226 L700 225 L701 226 L701 225 L702 225 L702 224 L703 224 L704 224 L705 224 L706 224 L707 224 L707 223 L708 223 L708 222 L709 221 L708 220 L708 221 L708 220 L707 220 L706 220 L706 219 L706 218 L706 217 L707 217 L708 217 L709 217 L710 217 L711 217 L712 217 L713 217 L713 216 L714 216 L715 216 L716 215 L716 214 L715 214 L715 213 L714 213 L714 212 L713 212 L713 211 L714 211 L713 210 L714 210 L714 209 L715 208 Z","cx":700.3,"cy":214.8},{"n":"天津市","d":"M722 228 L723 227 L724 227 L724 226 L724 225 L725 225 L724 224 L723 224 L722 224 L722 225 L721 225 L721 224 L720 225 L720 224 L720 223 L719 222 L718 221 L719 221 L718 220 L718 219 L718 218 L719 218 L720 218 L721 218 L722 218 L723 218 L722 218 L722 217 L721 217 L720 216 L720 215 L719 215 L719 214 L718 214 L717 214 L716 214 L716 215 L715 216 L714 216 L713 216 L713 217 L713 218 L712 219 L712 220 L713 220 L714 220 L714 221 L713 221 L712 221 L713 222 L712 222 L713 224 L712 224 L711 224 L710 223 L709 224 L709 223 L708 223 L707 223 L707 224 L707 225 L706 225 L707 225 L707 226 L706 226 L707 227 L708 227 L707 227 L707 228 L707 229 L708 228 L708 229 L708 230 L707 231 L708 232 L708 233 L707 233 L706 233 L706 234 L705 234 L705 235 L705 236 L706 237 L705 237 L706 238 L707 238 L708 239 L709 239 L710 239 L711 239 L711 240 L711 241 L712 240 L713 240 L714 240 L714 241 L716 241 L717 240 L719 240 L720 240 L720 239 L721 239 L722 239 L722 238 L721 238 L720 237 L722 236 L723 236 L724 235 L723 235 L723 233 L724 232 L725 231 L726 230 L727 230 L726 230 L726 229 L725 229 L724 229 L723 229 L723 228 L722 228 L720 228 L720 229 L719 228 L718 229 L718 228 L719 227 L720 227 L721 228 L721 227 L722 228 Z","cx":715.3,"cy":229.4},{"n":"河北省","d":"M717 207 L716 208 L717 209 L716 209 L715 208 L714 209 L714 210 L713 210 L714 211 L713 211 L713 212 L714 212 L714 213 L715 213 L715 214 L716 214 L717 214 L718 214 L719 214 L719 215 L720 215 L720 216 L721 217 L722 217 L722 218 L723 218 L722 218 L721 218 L720 218 L719 218 L718 218 L718 219 L718 220 L719 221 L718 221 L719 222 L720 223 L720 224 L720 225 L721 224 L721 225 L722 225 L722 224 L723 224 L724 224 L725 225 L724 225 L724 226 L724 227 L723 227 L723 228 L723 229 L724 229 L725 229 L726 229 L726 230 L727 230 L726 230 L726 231 L727 231 L728 231 L728 232 L729 233 L731 234 L732 234 L734 235 L735 235 L736 234 L735 234 L734 233 L735 232 L736 231 L738 232 L739 232 L740 231 L740 232 L741 231 L740 232 L741 232 L742 231 L743 231 L743 230 L744 229 L745 228 L746 228 L747 227 L746 226 L748 222 L750 221 L751 221 L750 220 L751 220 L751 219 L752 219 L753 219 L754 219 L755 219 L755 218 L756 219 L756 218 L756 217 L755 217 L754 217 L754 216 L754 215 L753 215 L753 214 L752 214 L752 213 L752 212 L751 212 L752 211 L751 210 L751 209 L750 209 L749 209 L747 209 L746 209 L745 209 L746 208 L745 208 L744 208 L745 207 L744 207 L743 207 L742 207 L741 206 L740 206 L740 205 L739 205 L740 204 L740 202 L741 202 L742 202 L741 201 L741 200 L743 201 L743 200 L744 199 L745 199 L745 198 L746 197 L745 197 L743 197 L742 197 L741 197 L740 197 L739 196 L738 196 L737 196 L736 196 L734 196 L732 196 L732 197 L731 196 L732 196 L731 195 L731 194 L730 194 L731 193 L729 192 L729 191 L728 191 L728 190 L728 189 L729 189 L730 189 L731 189 L731 188 L730 187 L731 187 L731 186 L731 185 L730 185 L731 185 L730 184 L729 184 L729 185 L728 185 L728 184 L727 184 L728 183 L726 182 L725 182 L727 181 L726 180 L726 179 L724 177 L723 177 L723 176 L722 176 L721 176 L720 176 L719 176 L718 176 L717 176 L717 177 L716 177 L716 178 L715 178 L714 178 L713 178 L712 178 L711 178 L710 178 L710 179 L709 179 L708 179 L708 180 L708 181 L708 182 L708 183 L706 182 L707 183 L708 184 L708 185 L706 186 L705 186 L704 186 L704 187 L703 187 L702 187 L702 186 L701 186 L700 187 L700 186 L700 185 L699 186 L698 186 L697 187 L697 188 L696 188 L695 188 L696 189 L695 189 L694 189 L693 188 L692 186 L691 187 L689 188 L688 188 L687 189 L686 189 L685 189 L684 190 L683 190 L683 191 L684 192 L682 192 L681 193 L681 192 L679 192 L678 192 L675 192 L676 191 L676 190 L676 189 L675 189 L676 188 L676 186 L676 185 L675 185 L675 184 L675 183 L674 183 L673 184 L672 184 L670 183 L670 184 L669 184 L669 185 L670 186 L669 186 L668 187 L667 186 L667 187 L666 188 L665 189 L665 190 L665 191 L665 192 L665 193 L663 193 L662 193 L661 194 L660 194 L659 195 L660 195 L660 196 L660 197 L661 197 L661 198 L661 197 L662 198 L661 199 L660 199 L659 200 L658 200 L659 201 L661 202 L661 203 L662 203 L662 204 L663 205 L663 206 L664 206 L664 207 L665 208 L666 208 L666 209 L666 210 L666 211 L666 212 L667 212 L668 212 L669 212 L670 212 L670 213 L669 214 L668 214 L667 214 L666 214 L665 214 L665 215 L664 215 L663 215 L662 215 L663 216 L663 217 L662 217 L662 216 L661 216 L661 217 L660 218 L662 218 L662 219 L664 220 L665 219 L665 220 L666 220 L668 220 L668 221 L668 222 L668 223 L668 224 L669 224 L670 225 L670 226 L669 226 L669 227 L669 228 L669 229 L668 229 L668 230 L669 231 L668 231 L667 232 L667 233 L665 233 L664 233 L663 233 L663 232 L662 232 L661 232 L660 233 L658 234 L658 235 L658 236 L659 237 L659 238 L658 238 L658 239 L657 239 L656 240 L655 240 L655 241 L654 241 L654 242 L655 243 L654 243 L654 244 L654 245 L654 246 L655 246 L656 246 L656 247 L657 247 L658 248 L659 247 L658 248 L659 249 L659 250 L660 250 L660 251 L661 252 L661 253 L662 254 L661 254 L661 255 L662 255 L663 255 L664 255 L663 256 L663 257 L662 258 L662 259 L661 260 L661 261 L660 261 L659 262 L659 263 L659 264 L658 264 L658 265 L657 265 L658 265 L658 266 L657 267 L658 268 L658 269 L657 269 L657 268 L656 268 L656 269 L656 270 L655 270 L654 270 L654 271 L653 270 L653 271 L653 272 L654 272 L654 273 L655 274 L654 274 L655 275 L656 276 L657 276 L657 277 L658 277 L659 277 L660 277 L661 277 L662 277 L662 278 L663 278 L664 278 L665 278 L666 278 L667 278 L667 279 L668 279 L669 279 L669 280 L670 280 L671 280 L671 281 L672 280 L673 280 L674 280 L675 280 L676 280 L676 281 L676 282 L677 281 L678 281 L678 280 L679 280 L679 279 L680 279 L681 279 L682 280 L682 281 L683 281 L683 280 L685 280 L685 278 L684 278 L684 277 L683 277 L683 276 L682 276 L683 275 L682 275 L682 274 L683 274 L683 272 L684 271 L685 271 L685 270 L686 270 L688 269 L689 268 L690 268 L690 267 L690 266 L691 265 L692 264 L692 263 L693 262 L693 261 L694 260 L695 260 L696 260 L697 260 L698 260 L697 259 L697 258 L698 259 L698 258 L698 257 L699 257 L700 258 L701 259 L701 258 L703 256 L704 255 L705 255 L705 254 L706 254 L706 253 L707 253 L708 253 L710 253 L711 253 L712 253 L713 253 L714 253 L715 252 L716 253 L717 252 L718 251 L718 250 L719 249 L721 249 L722 248 L722 247 L723 246 L724 245 L725 245 L725 244 L723 244 L722 244 L721 243 L721 242 L720 242 L721 241 L720 241 L720 240 L719 240 L717 240 L716 241 L714 241 L714 240 L713 240 L712 240 L711 241 L711 240 L711 239 L710 239 L709 239 L708 239 L707 238 L706 238 L705 237 L706 237 L705 236 L705 235 L705 234 L706 234 L706 233 L707 233 L708 233 L708 232 L707 231 L708 230 L708 229 L708 228 L707 229 L707 228 L707 227 L708 227 L707 227 L706 226 L707 226 L707 225 L706 225 L707 225 L707 224 L706 224 L705 224 L704 224 L703 224 L702 224 L702 225 L701 225 L701 226 L700 225 L700 226 L701 226 L701 227 L699 227 L699 226 L698 226 L697 225 L697 224 L696 225 L695 225 L694 225 L693 225 L693 224 L693 225 L692 224 L692 225 L691 225 L691 226 L690 226 L689 225 L688 224 L687 224 L686 224 L685 223 L685 222 L685 221 L686 221 L687 221 L686 220 L686 219 L685 219 L684 219 L684 218 L685 218 L685 217 L686 217 L687 216 L690 216 L690 215 L691 215 L692 214 L693 214 L693 213 L692 212 L691 212 L690 211 L690 210 L689 210 L690 209 L691 209 L691 208 L692 208 L693 208 L693 209 L694 208 L695 208 L696 207 L697 206 L698 205 L698 206 L699 206 L699 205 L701 206 L701 205 L699 203 L700 203 L701 203 L701 202 L702 202 L703 202 L704 201 L703 201 L704 201 L705 201 L704 202 L705 203 L706 204 L707 204 L708 205 L708 206 L709 206 L710 207 L711 206 L712 207 L713 207 L714 207 L715 207 L716 207 L718 207 L718 208 L717 207 Z","cx":669.4,"cy":249.4},{"n":"山西省","d":"M603 305 L604 305 L605 305 L607 305 L608 305 L609 304 L610 304 L610 305 L611 304 L612 303 L613 303 L615 302 L617 302 L617 301 L618 302 L618 301 L619 302 L620 301 L621 301 L622 301 L622 300 L623 300 L624 299 L625 298 L626 298 L628 297 L629 297 L630 298 L630 297 L630 296 L630 295 L630 294 L631 294 L633 294 L633 295 L634 294 L634 295 L635 295 L637 295 L639 295 L639 294 L641 295 L642 294 L643 295 L644 294 L645 294 L645 293 L646 293 L647 293 L648 293 L648 292 L648 291 L649 291 L650 292 L650 291 L651 291 L651 290 L652 290 L653 290 L653 289 L654 289 L654 288 L655 288 L655 287 L655 286 L655 285 L656 285 L655 285 L656 284 L656 283 L656 282 L656 281 L656 280 L657 280 L656 280 L656 279 L657 278 L657 277 L657 276 L656 276 L655 275 L654 274 L655 274 L654 273 L654 272 L653 272 L653 271 L653 270 L654 271 L654 270 L655 270 L656 270 L656 269 L656 268 L657 268 L657 269 L658 269 L658 268 L657 267 L658 266 L658 265 L657 265 L658 265 L658 264 L659 264 L659 263 L659 262 L660 261 L661 261 L661 260 L662 259 L662 258 L663 257 L663 256 L664 255 L663 255 L662 255 L661 255 L661 254 L662 254 L661 253 L661 252 L660 251 L660 250 L659 250 L659 249 L658 248 L659 247 L658 248 L657 247 L656 247 L656 246 L655 246 L654 246 L654 245 L654 244 L654 243 L655 243 L654 242 L654 241 L655 241 L655 240 L656 240 L657 239 L658 239 L658 238 L659 238 L659 237 L658 236 L658 235 L658 234 L660 233 L661 232 L662 232 L663 232 L663 233 L664 233 L665 233 L667 233 L667 232 L668 231 L669 231 L668 230 L668 229 L669 229 L669 228 L669 227 L669 226 L670 226 L670 225 L669 224 L668 224 L668 223 L668 222 L668 221 L668 220 L666 220 L665 220 L665 219 L664 220 L662 219 L662 218 L660 218 L661 217 L661 216 L662 216 L662 217 L663 217 L663 216 L662 215 L663 215 L664 215 L665 215 L665 214 L666 214 L667 214 L668 214 L669 214 L670 213 L670 212 L669 212 L668 212 L667 212 L666 212 L666 211 L666 210 L666 209 L666 208 L665 208 L664 207 L664 206 L663 206 L662 206 L662 207 L662 208 L663 209 L662 209 L661 210 L660 210 L659 210 L658 210 L657 210 L656 211 L654 212 L653 212 L651 213 L650 213 L650 212 L649 211 L647 212 L646 212 L644 213 L643 215 L641 215 L639 214 L637 214 L636 213 L635 214 L634 214 L633 215 L633 216 L632 217 L631 217 L631 218 L630 219 L630 220 L629 221 L628 223 L628 224 L627 224 L626 224 L625 224 L624 224 L623 224 L621 223 L620 224 L620 225 L620 226 L619 226 L619 227 L618 227 L616 227 L615 227 L615 228 L615 229 L616 228 L616 229 L617 229 L616 230 L616 232 L615 232 L615 233 L614 234 L613 234 L613 235 L613 236 L612 238 L612 239 L611 240 L611 241 L612 241 L611 242 L611 243 L610 243 L609 243 L609 244 L608 244 L607 245 L606 245 L606 247 L605 247 L605 248 L605 249 L605 250 L605 251 L606 251 L608 254 L609 254 L608 255 L609 255 L610 256 L609 256 L609 257 L610 257 L609 258 L609 259 L607 259 L607 260 L608 261 L608 262 L607 262 L606 263 L605 264 L605 265 L604 266 L603 266 L604 267 L603 268 L604 269 L603 269 L604 269 L603 270 L604 271 L603 271 L604 272 L605 273 L605 275 L604 275 L605 275 L605 276 L604 277 L604 278 L604 279 L604 280 L604 281 L605 282 L605 283 L605 284 L606 284 L606 285 L606 286 L606 287 L607 288 L606 289 L606 290 L605 290 L604 292 L604 293 L603 294 L603 295 L603 296 L602 298 L601 299 L600 300 L601 302 L601 303 L600 304 L601 305 L602 305 L603 305 Z","cx":633.9,"cy":256.3},{"n":"内蒙古自治区","d":"M390 173 L393 178 L395 182 L398 186 L401 191 L397 194 L397 195 L402 199 L403 200 L406 202 L407 203 L409 203 L409 209 L413 207 L412 206 L414 205 L414 207 L415 207 L416 208 L416 207 L416 206 L419 205 L420 207 L421 207 L421 206 L422 206 L422 204 L428 204 L430 203 L435 203 L436 203 L437 204 L439 206 L439 208 L438 209 L438 213 L436 215 L435 215 L434 217 L433 218 L431 218 L428 220 L427 220 L426 220 L427 220 L430 220 L433 220 L434 221 L435 222 L436 222 L438 223 L440 223 L441 224 L440 225 L441 226 L443 226 L444 226 L444 228 L445 228 L447 227 L449 227 L449 231 L449 232 L449 233 L449 234 L450 234 L451 234 L451 235 L454 234 L455 234 L455 235 L456 236 L457 236 L457 237 L457 238 L458 238 L461 239 L461 240 L462 239 L464 239 L466 238 L467 237 L469 236 L468 236 L467 234 L465 233 L466 232 L468 232 L469 232 L472 231 L473 230 L475 230 L477 231 L478 231 L482 232 L484 232 L486 231 L487 231 L488 230 L489 229 L491 228 L493 228 L496 227 L498 227 L499 227 L501 227 L501 228 L501 229 L503 231 L503 233 L503 234 L503 235 L501 236 L500 236 L498 240 L491 244 L492 246 L492 248 L490 249 L490 250 L490 252 L494 253 L495 254 L497 256 L498 257 L499 257 L501 259 L503 260 L504 260 L505 259 L507 259 L507 258 L510 258 L513 258 L514 257 L517 257 L518 256 L519 256 L520 255 L521 255 L523 255 L524 255 L526 255 L526 254 L527 254 L528 253 L529 252 L529 251 L530 250 L529 249 L529 248 L529 247 L530 246 L530 245 L529 244 L530 244 L529 243 L530 243 L530 242 L530 241 L530 240 L531 239 L530 239 L531 238 L531 237 L532 236 L532 235 L533 235 L534 234 L534 233 L535 232 L535 231 L535 232 L536 232 L537 232 L537 231 L537 230 L539 229 L541 230 L541 229 L542 228 L543 228 L544 228 L545 228 L545 229 L545 230 L545 231 L546 231 L546 232 L546 233 L547 233 L548 233 L548 234 L548 235 L546 236 L544 238 L544 239 L543 240 L543 243 L542 244 L540 245 L541 246 L542 246 L543 246 L544 247 L545 247 L546 248 L547 248 L549 248 L550 248 L551 248 L552 248 L554 249 L555 250 L555 251 L556 251 L557 252 L559 252 L560 253 L562 253 L563 253 L564 254 L565 255 L565 256 L567 256 L568 256 L569 256 L571 256 L572 255 L573 255 L575 256 L576 255 L577 255 L577 254 L577 252 L577 251 L578 250 L577 249 L578 249 L579 250 L580 251 L581 251 L581 250 L582 250 L581 249 L582 249 L580 248 L580 247 L580 246 L581 244 L582 243 L583 242 L584 241 L585 240 L586 240 L587 240 L586 239 L587 239 L588 238 L589 237 L590 237 L591 236 L591 235 L592 235 L591 234 L592 234 L593 233 L594 232 L595 232 L596 232 L595 232 L596 231 L595 230 L596 231 L597 231 L599 230 L600 229 L600 228 L599 228 L599 227 L601 227 L603 229 L604 228 L605 228 L606 228 L606 229 L607 230 L608 230 L609 229 L609 228 L611 226 L612 226 L613 225 L615 225 L615 226 L614 227 L614 228 L615 228 L615 227 L616 227 L618 227 L619 227 L619 226 L620 226 L620 225 L620 224 L621 223 L623 224 L624 224 L625 224 L626 224 L627 224 L628 224 L628 223 L629 221 L630 220 L630 219 L631 218 L631 217 L632 217 L633 216 L633 215 L634 214 L635 214 L636 213 L637 214 L639 214 L641 215 L643 215 L644 213 L646 212 L647 212 L649 211 L650 212 L650 213 L651 213 L653 212 L654 212 L656 211 L657 210 L658 210 L659 210 L660 210 L661 210 L662 209 L663 209 L662 208 L662 207 L662 206 L663 206 L663 205 L662 204 L662 203 L661 203 L661 202 L659 201 L658 200 L659 200 L660 199 L661 199 L662 198 L661 197 L661 198 L661 197 L660 197 L660 196 L660 195 L659 195 L660 194 L661 194 L662 193 L663 193 L665 193 L665 192 L665 191 L665 190 L665 189 L666 188 L667 187 L667 186 L668 187 L669 186 L670 186 L669 185 L669 184 L670 184 L670 183 L672 184 L673 184 L674 183 L675 183 L675 184 L675 185 L676 185 L676 186 L676 188 L675 189 L676 189 L676 190 L676 191 L675 192 L678 192 L679 192 L681 192 L681 193 L682 192 L684 192 L683 191 L683 190 L684 190 L685 189 L686 189 L687 189 L688 188 L689 188 L691 187 L692 186 L693 188 L694 189 L695 189 L696 189 L695 188 L696 188 L697 188 L697 187 L698 186 L699 186 L700 185 L700 186 L700 187 L701 186 L702 186 L702 187 L703 187 L704 187 L704 186 L705 186 L706 186 L708 185 L708 184 L707 183 L706 182 L708 183 L708 182 L708 181 L708 180 L708 179 L709 179 L710 179 L710 178 L711 178 L712 178 L713 178 L714 178 L715 178 L716 178 L716 177 L717 177 L717 176 L718 176 L719 176 L720 176 L721 176 L722 176 L723 176 L723 177 L724 177 L726 179 L726 180 L727 181 L725 182 L726 182 L728 183 L727 184 L728 184 L728 185 L729 185 L729 184 L730 184 L731 185 L730 185 L731 185 L731 186 L731 187 L730 187 L731 188 L731 189 L730 189 L729 189 L728 189 L728 190 L728 191 L729 191 L729 192 L731 193 L730 194 L731 194 L731 195 L732 196 L731 196 L732 197 L732 196 L734 196 L736 196 L737 196 L738 196 L739 196 L740 197 L741 197 L742 197 L743 197 L745 197 L746 197 L747 196 L747 195 L748 195 L748 194 L748 193 L749 193 L749 192 L747 192 L747 191 L747 190 L747 189 L747 188 L747 187 L747 186 L748 185 L748 184 L747 184 L747 183 L746 183 L746 182 L746 181 L748 181 L749 180 L750 180 L750 179 L751 180 L751 181 L752 181 L752 182 L753 182 L754 182 L756 182 L756 183 L755 183 L756 184 L756 185 L757 185 L757 186 L757 187 L758 187 L758 189 L759 189 L758 190 L759 190 L760 190 L760 189 L761 188 L762 188 L762 187 L763 188 L763 187 L762 187 L763 187 L763 186 L764 186 L765 186 L765 185 L766 184 L767 183 L768 183 L770 182 L771 182 L772 182 L772 181 L773 181 L774 181 L775 182 L775 181 L776 181 L777 180 L778 180 L779 179 L780 178 L781 178 L782 178 L783 178 L784 177 L784 178 L785 179 L786 178 L787 177 L788 177 L789 177 L789 176 L789 175 L789 174 L791 174 L793 175 L794 175 L794 174 L795 174 L796 175 L797 175 L797 174 L798 173 L797 173 L796 173 L796 172 L797 172 L799 172 L800 172 L800 173 L801 173 L802 173 L803 173 L804 174 L805 173 L806 173 L807 173 L808 173 L810 172 L809 172 L809 171 L811 170 L812 169 L813 169 L814 169 L815 169 L816 169 L817 168 L817 167 L817 166 L817 165 L818 165 L818 163 L816 164 L815 163 L814 162 L813 163 L813 162 L812 162 L812 161 L811 161 L812 160 L814 161 L814 160 L813 160 L815 160 L815 159 L815 158 L814 158 L814 157 L814 156 L813 154 L812 154 L813 154 L812 153 L812 152 L812 151 L813 151 L812 150 L811 150 L811 149 L810 148 L809 147 L808 147 L809 146 L808 146 L809 145 L808 145 L807 145 L804 147 L803 147 L802 148 L801 149 L799 149 L798 149 L795 150 L795 149 L795 148 L795 147 L795 146 L794 146 L794 145 L793 144 L792 144 L792 143 L792 142 L793 142 L793 141 L792 141 L793 141 L792 141 L792 140 L791 139 L792 139 L792 138 L792 137 L792 136 L792 135 L793 134 L794 134 L794 133 L793 132 L793 131 L793 130 L791 130 L790 129 L790 128 L790 127 L790 126 L789 126 L788 126 L787 126 L786 126 L785 125 L786 124 L787 124 L787 123 L787 122 L786 121 L787 121 L788 121 L789 121 L791 122 L792 122 L792 123 L794 123 L794 124 L795 124 L796 123 L796 122 L798 122 L798 123 L798 124 L799 124 L800 125 L801 125 L801 126 L802 126 L802 125 L803 125 L802 124 L803 123 L804 122 L803 120 L807 119 L808 119 L808 118 L809 118 L809 117 L809 116 L808 115 L807 114 L807 113 L806 112 L807 112 L807 111 L808 111 L809 111 L810 112 L811 111 L811 110 L812 110 L814 110 L816 110 L817 109 L817 108 L816 108 L817 107 L816 107 L816 108 L815 108 L814 107 L815 106 L814 106 L813 106 L812 105 L811 105 L812 105 L813 106 L812 108 L811 107 L810 107 L810 108 L809 109 L808 109 L807 109 L806 109 L805 108 L805 107 L805 106 L804 106 L803 106 L803 105 L804 104 L802 103 L801 103 L800 103 L800 102 L799 102 L798 101 L798 100 L797 100 L797 99 L799 98 L799 97 L800 96 L803 95 L804 94 L805 94 L807 93 L809 92 L810 92 L811 91 L811 90 L815 88 L816 88 L818 86 L820 84 L823 82 L824 82 L825 81 L827 80 L828 81 L827 81 L828 82 L828 83 L828 84 L829 85 L829 86 L830 86 L830 87 L829 87 L830 87 L831 87 L831 86 L832 85 L832 84 L831 83 L831 82 L832 81 L831 80 L832 79 L833 77 L832 77 L833 76 L833 75 L834 75 L834 74 L835 74 L835 73 L836 72 L836 71 L836 70 L837 70 L838 70 L839 70 L841 71 L841 70 L842 70 L842 69 L842 68 L843 67 L843 66 L843 65 L842 65 L842 64 L842 63 L841 62 L841 63 L841 62 L842 62 L842 61 L842 60 L842 59 L843 59 L842 59 L843 59 L842 58 L842 57 L843 57 L844 56 L843 56 L844 56 L844 55 L843 55 L843 54 L844 54 L845 54 L844 54 L845 54 L845 53 L846 53 L846 52 L847 51 L848 51 L847 50 L848 50 L848 49 L849 49 L850 49 L851 48 L852 48 L852 47 L852 46 L851 46 L852 45 L851 45 L852 45 L851 44 L852 44 L853 43 L854 43 L854 42 L855 42 L856 42 L856 41 L855 40 L856 40 L854 39 L855 38 L854 38 L854 39 L853 38 L852 37 L851 37 L851 36 L850 35 L849 34 L848 34 L848 33 L847 32 L846 31 L845 31 L844 30 L843 30 L842 30 L841 30 L840 30 L840 31 L839 32 L838 32 L837 33 L838 33 L837 34 L835 34 L835 35 L834 35 L833 35 L832 34 L830 34 L830 35 L829 35 L830 35 L829 36 L828 36 L827 36 L827 35 L826 35 L825 35 L824 35 L822 35 L821 35 L820 34 L819 35 L818 34 L817 35 L816 35 L816 36 L814 36 L813 36 L812 36 L811 36 L810 36 L809 36 L808 35 L806 35 L806 34 L805 34 L805 33 L804 33 L805 32 L804 32 L805 32 L804 31 L804 30 L803 30 L803 29 L802 28 L803 28 L802 27 L802 26 L802 25 L801 25 L801 24 L801 23 L800 23 L801 22 L800 22 L801 22 L802 22 L803 21 L803 20 L802 20 L801 20 L800 20 L799 20 L798 19 L798 18 L797 18 L796 18 L796 17 L795 17 L794 17 L793 16 L792 17 L791 18 L790 19 L789 19 L789 20 L788 20 L787 19 L786 19 L785 18 L785 17 L784 17 L783 17 L782 16 L781 16 L780 16 L779 15 L778 15 L777 15 L778 14 L779 14 L779 13 L780 13 L782 12 L783 11 L784 11 L784 10 L785 9 L786 8 L787 8 L787 7 L787 6 L786 6 L785 5 L785 4 L784 4 L783 3 L782 3 L781 3 L780 3 L779 3 L778 4 L777 3 L776 4 L776 3 L775 3 L773 3 L772 3 L772 4 L771 4 L772 4 L771 4 L770 5 L769 5 L769 6 L768 6 L767 7 L765 8 L765 9 L764 9 L764 10 L763 10 L762 11 L761 11 L760 11 L759 12 L759 13 L759 14 L759 15 L760 15 L761 15 L763 14 L764 14 L766 14 L767 15 L768 15 L769 15 L770 16 L769 16 L769 17 L769 18 L768 18 L768 19 L769 19 L769 20 L770 20 L770 21 L771 22 L770 22 L770 23 L769 23 L769 24 L770 24 L769 24 L769 25 L767 26 L766 26 L766 27 L765 27 L764 28 L763 28 L762 29 L761 29 L759 29 L760 30 L759 30 L759 31 L758 32 L758 33 L758 34 L757 34 L757 35 L756 35 L755 36 L755 37 L754 37 L755 38 L754 38 L754 39 L754 40 L753 40 L752 40 L752 41 L751 41 L750 42 L750 43 L750 44 L749 45 L748 45 L748 46 L747 47 L746 47 L747 47 L746 48 L746 49 L745 50 L744 50 L745 50 L744 51 L745 51 L746 51 L747 51 L748 51 L748 52 L747 53 L748 53 L747 53 L748 54 L747 54 L747 55 L746 55 L745 55 L745 56 L744 56 L743 57 L742 57 L741 57 L739 57 L738 57 L737 57 L736 58 L735 58 L734 58 L734 59 L733 59 L732 59 L732 60 L731 60 L730 61 L729 61 L728 62 L727 63 L726 63 L725 63 L724 63 L723 64 L720 63 L718 62 L714 62 L711 61 L705 59 L700 66 L694 75 L695 75 L695 76 L691 80 L690 80 L691 85 L690 85 L686 86 L686 87 L687 90 L693 94 L695 92 L696 92 L698 91 L701 91 L704 91 L706 90 L708 90 L711 92 L716 95 L718 93 L718 92 L723 88 L724 88 L725 89 L727 89 L728 88 L730 88 L730 89 L731 89 L732 88 L733 89 L735 89 L738 92 L744 94 L744 96 L745 97 L748 97 L747 98 L748 98 L749 99 L751 100 L751 101 L752 101 L753 102 L754 103 L755 104 L755 105 L756 105 L756 106 L757 106 L757 107 L757 108 L757 109 L757 110 L756 110 L755 110 L755 111 L754 111 L753 112 L753 111 L752 111 L751 111 L750 111 L749 111 L748 111 L747 111 L746 111 L745 111 L744 110 L744 111 L743 110 L742 109 L741 109 L739 109 L739 110 L737 110 L736 109 L735 110 L733 110 L732 109 L731 109 L730 109 L730 110 L729 110 L728 110 L727 111 L726 111 L724 111 L724 112 L723 112 L722 112 L722 113 L721 113 L720 112 L720 111 L719 111 L718 111 L716 112 L717 113 L716 114 L716 115 L714 115 L711 115 L708 115 L707 115 L706 116 L704 116 L703 116 L703 117 L702 117 L701 119 L700 119 L698 122 L697 123 L698 124 L698 125 L697 125 L697 126 L696 126 L695 126 L694 126 L694 127 L693 127 L691 128 L689 130 L687 130 L683 131 L680 131 L677 131 L676 131 L673 130 L671 131 L670 131 L670 132 L670 133 L669 134 L668 134 L667 135 L666 135 L664 137 L663 138 L662 138 L660 139 L659 139 L658 140 L657 141 L655 141 L654 141 L653 141 L647 140 L646 140 L644 140 L643 140 L641 139 L639 138 L638 137 L636 136 L635 136 L631 136 L630 136 L629 136 L627 136 L625 138 L624 139 L623 141 L622 142 L622 143 L622 144 L621 144 L621 145 L620 147 L620 148 L621 149 L622 149 L622 150 L622 151 L624 152 L624 153 L625 153 L627 154 L628 156 L629 157 L628 158 L627 159 L626 159 L623 161 L622 162 L620 161 L619 162 L616 163 L615 163 L614 164 L613 164 L610 167 L609 168 L608 169 L607 170 L604 172 L604 173 L602 174 L599 175 L595 175 L592 176 L592 177 L589 178 L588 178 L585 179 L581 178 L580 178 L578 179 L577 179 L576 179 L573 178 L569 179 L568 178 L566 179 L565 179 L564 179 L560 179 L558 179 L556 178 L553 179 L553 180 L549 180 L545 181 L542 182 L538 183 L532 185 L528 186 L526 187 L522 189 L521 190 L520 190 L516 192 L515 191 L513 191 L511 191 L508 191 L509 188 L507 188 L505 188 L501 189 L498 189 L491 188 L491 187 L487 186 L484 185 L479 183 L478 183 L476 183 L475 183 L469 182 L466 179 L465 177 L464 177 L461 177 L456 176 L449 175 L441 174 L440 175 L436 175 L435 175 L428 176 L419 176 L412 175 L406 175 L401 174 L392 173 L390 173 Z","cx":662.5,"cy":148},{"n":"辽宁省","d":"M815 221 L815 222 L816 221 L817 221 L818 221 L819 221 L820 221 L822 221 L823 221 L824 221 L825 222 L825 220 L826 220 L826 219 L827 219 L827 218 L828 218 L829 218 L828 217 L829 216 L830 215 L831 214 L833 213 L834 213 L835 212 L836 211 L837 210 L838 211 L838 210 L839 210 L839 209 L840 209 L841 209 L842 208 L843 208 L843 207 L844 207 L845 207 L846 208 L845 207 L846 207 L846 206 L847 206 L848 206 L848 205 L849 206 L850 205 L849 205 L850 204 L850 203 L849 203 L848 203 L849 203 L849 202 L850 202 L850 201 L851 200 L850 200 L851 200 L851 199 L851 198 L850 198 L850 197 L849 197 L849 196 L848 196 L848 195 L847 195 L847 194 L847 193 L846 193 L846 192 L846 191 L845 191 L844 191 L844 190 L844 189 L843 188 L844 187 L843 186 L844 186 L845 186 L845 185 L845 184 L846 184 L847 183 L846 183 L845 183 L844 183 L844 182 L843 183 L844 182 L843 182 L843 181 L844 181 L843 181 L842 181 L841 180 L842 180 L842 179 L841 178 L840 178 L840 177 L840 176 L839 176 L839 175 L838 174 L839 174 L838 173 L838 172 L837 173 L836 172 L836 171 L837 170 L836 169 L837 168 L837 167 L835 168 L834 168 L834 169 L833 170 L832 170 L832 171 L830 172 L830 171 L829 171 L830 171 L830 170 L829 170 L828 169 L829 168 L828 167 L827 167 L827 166 L826 166 L826 165 L825 166 L824 165 L823 165 L822 164 L821 164 L821 163 L820 163 L820 162 L819 162 L818 163 L818 165 L817 165 L817 166 L817 167 L817 168 L816 169 L815 169 L814 169 L813 169 L812 169 L811 170 L809 171 L809 172 L810 172 L808 173 L807 173 L806 173 L805 173 L804 174 L803 173 L802 173 L801 173 L800 173 L800 172 L799 172 L797 172 L796 172 L796 173 L797 173 L798 173 L797 174 L797 175 L796 175 L795 174 L794 174 L794 175 L793 175 L791 174 L789 174 L789 175 L789 176 L789 177 L788 177 L787 177 L786 178 L785 179 L784 178 L784 177 L783 178 L782 178 L781 178 L780 178 L779 179 L778 180 L777 180 L776 181 L775 181 L775 182 L774 181 L773 181 L772 181 L772 182 L771 182 L770 182 L768 183 L767 183 L766 184 L765 185 L765 186 L764 186 L763 186 L763 187 L762 187 L763 187 L763 188 L762 187 L762 188 L761 188 L760 189 L760 190 L759 190 L758 190 L759 189 L758 189 L758 187 L757 187 L757 186 L757 185 L756 185 L756 184 L755 183 L756 183 L756 182 L754 182 L753 182 L752 182 L752 181 L751 181 L751 180 L750 179 L750 180 L749 180 L748 181 L746 181 L746 182 L746 183 L747 183 L747 184 L748 184 L748 185 L747 186 L747 187 L747 188 L747 189 L747 190 L747 191 L747 192 L749 192 L749 193 L748 193 L748 194 L748 195 L747 195 L747 196 L746 197 L745 198 L745 199 L744 199 L743 200 L743 201 L741 200 L741 201 L742 202 L741 202 L740 202 L740 204 L739 205 L740 205 L740 206 L741 206 L742 207 L743 207 L744 207 L745 207 L744 208 L745 208 L746 208 L745 209 L746 209 L747 209 L749 209 L750 209 L751 209 L751 210 L752 211 L751 212 L752 212 L752 213 L752 214 L753 214 L753 215 L754 215 L754 216 L754 217 L755 217 L756 217 L756 218 L757 218 L757 217 L760 217 L761 216 L762 216 L764 215 L765 215 L766 215 L767 214 L766 213 L767 213 L768 212 L768 211 L768 210 L769 210 L770 210 L770 209 L771 208 L772 207 L771 207 L772 207 L773 207 L774 206 L775 206 L774 206 L774 205 L776 205 L775 205 L776 204 L777 204 L778 204 L779 204 L781 204 L782 204 L783 204 L783 205 L783 204 L784 204 L785 204 L786 204 L787 204 L787 203 L788 204 L788 205 L789 205 L789 206 L790 207 L791 207 L792 207 L793 207 L792 208 L793 208 L794 209 L794 210 L795 210 L794 210 L794 211 L793 211 L794 212 L793 212 L792 212 L793 212 L792 213 L792 212 L791 213 L791 214 L789 214 L790 215 L790 216 L789 217 L787 217 L787 218 L787 219 L785 219 L784 220 L783 220 L782 221 L782 222 L782 223 L781 223 L781 224 L779 224 L778 224 L778 225 L778 226 L779 226 L778 227 L779 227 L778 227 L778 228 L779 228 L780 228 L781 228 L781 229 L782 229 L783 229 L784 229 L786 228 L786 229 L785 229 L785 230 L784 229 L784 230 L784 231 L785 231 L785 232 L784 233 L785 232 L784 231 L783 232 L784 232 L784 233 L782 233 L781 234 L780 233 L779 234 L780 234 L779 234 L777 235 L776 235 L776 236 L776 237 L776 238 L777 238 L778 237 L779 237 L780 237 L781 237 L782 237 L783 236 L784 236 L785 236 L786 236 L786 235 L785 235 L784 235 L785 235 L785 234 L786 234 L787 234 L788 235 L789 234 L788 233 L789 234 L789 233 L790 234 L791 233 L791 232 L792 232 L793 231 L792 231 L793 230 L794 230 L795 229 L795 228 L796 228 L797 227 L798 227 L799 227 L800 227 L801 226 L803 225 L804 225 L804 224 L806 224 L807 224 L807 223 L808 223 L809 224 L809 223 L810 223 L811 223 L811 222 L812 222 L813 222 L814 222 L815 222 L815 221 Z","cx":800.1,"cy":196.9},{"n":"吉林省","d":"M913 179 L913 178 L914 179 L915 179 L915 178 L915 177 L915 176 L916 176 L915 175 L916 175 L916 174 L916 173 L916 172 L917 172 L917 171 L917 170 L918 170 L918 169 L919 169 L919 170 L920 170 L921 170 L922 170 L921 170 L921 171 L922 171 L923 171 L924 171 L924 172 L923 173 L923 174 L924 174 L925 175 L926 176 L927 176 L926 176 L926 177 L927 176 L927 175 L928 176 L928 178 L929 178 L929 179 L930 179 L929 178 L928 177 L929 177 L929 176 L930 176 L929 175 L928 174 L927 174 L926 174 L927 173 L928 173 L928 172 L929 172 L930 172 L931 172 L932 172 L932 171 L933 171 L934 172 L935 171 L935 172 L936 172 L936 171 L937 171 L938 170 L937 170 L937 169 L937 168 L938 168 L939 167 L939 166 L940 165 L940 163 L941 163 L940 162 L941 162 L941 161 L940 161 L940 162 L939 162 L938 162 L938 163 L936 161 L935 162 L934 162 L933 162 L933 161 L932 161 L931 160 L930 160 L929 160 L930 159 L929 159 L927 159 L926 159 L926 158 L926 157 L926 156 L925 156 L926 156 L925 155 L926 155 L925 154 L925 153 L924 153 L924 154 L923 154 L922 155 L921 155 L921 156 L920 156 L920 155 L920 154 L919 153 L918 153 L917 153 L916 154 L916 155 L915 155 L914 155 L912 155 L911 155 L910 156 L909 157 L908 156 L908 157 L907 156 L907 157 L907 158 L907 159 L907 160 L906 160 L905 161 L904 161 L903 161 L902 161 L901 161 L901 160 L900 159 L900 158 L899 158 L899 157 L899 156 L899 155 L898 155 L897 155 L897 154 L897 153 L896 153 L896 151 L895 151 L894 150 L895 149 L894 149 L895 148 L894 148 L895 148 L895 147 L894 147 L895 146 L894 146 L893 145 L892 146 L891 146 L890 148 L889 148 L888 147 L888 148 L889 149 L888 149 L889 150 L888 151 L889 151 L888 152 L886 152 L885 152 L884 152 L883 152 L883 151 L882 150 L882 151 L881 150 L880 150 L881 149 L880 148 L879 147 L879 146 L878 145 L879 145 L880 145 L880 144 L877 143 L875 143 L874 143 L875 143 L874 143 L873 144 L872 143 L872 144 L872 143 L871 142 L872 142 L871 141 L871 140 L871 139 L872 139 L872 138 L872 137 L871 137 L871 136 L870 136 L870 135 L869 135 L868 135 L867 134 L866 134 L865 134 L864 133 L863 133 L861 134 L860 134 L859 135 L858 135 L857 135 L856 135 L856 134 L855 135 L855 134 L854 134 L853 134 L852 133 L851 132 L850 132 L850 131 L850 129 L849 129 L848 129 L847 130 L846 129 L846 130 L845 130 L845 131 L844 130 L844 131 L843 130 L842 131 L841 131 L840 131 L840 130 L839 129 L838 129 L837 129 L837 130 L836 130 L835 130 L834 130 L833 130 L832 130 L831 131 L831 130 L830 130 L829 130 L828 129 L829 129 L828 128 L827 128 L826 128 L826 127 L825 127 L825 126 L824 126 L823 125 L824 124 L823 124 L824 124 L824 123 L823 123 L822 122 L822 121 L823 121 L822 121 L823 121 L823 120 L822 119 L823 119 L822 119 L823 118 L822 118 L822 117 L822 116 L821 117 L821 116 L820 116 L819 117 L818 117 L817 117 L816 117 L815 117 L814 117 L813 117 L812 117 L811 117 L810 117 L809 117 L809 118 L808 118 L808 119 L807 119 L803 120 L804 122 L803 123 L802 124 L803 125 L802 125 L802 126 L801 126 L801 125 L800 125 L799 124 L798 124 L798 123 L798 122 L796 122 L796 123 L795 124 L794 124 L794 123 L792 123 L792 122 L791 122 L789 121 L788 121 L787 121 L786 121 L787 122 L787 123 L787 124 L786 124 L785 125 L786 126 L787 126 L788 126 L789 126 L790 126 L790 127 L790 128 L790 129 L791 130 L793 130 L793 131 L793 132 L794 133 L794 134 L793 134 L792 135 L792 136 L792 137 L792 138 L792 139 L791 139 L792 140 L792 141 L793 141 L792 141 L793 141 L793 142 L792 142 L792 143 L792 144 L793 144 L794 145 L794 146 L795 146 L795 147 L795 148 L795 149 L795 150 L798 149 L799 149 L801 149 L802 148 L803 147 L804 147 L807 145 L808 145 L809 145 L808 146 L809 146 L808 147 L809 147 L810 148 L811 149 L811 150 L812 150 L813 151 L812 151 L812 152 L812 153 L813 154 L812 154 L813 154 L814 156 L814 157 L814 158 L815 158 L815 159 L815 160 L813 160 L814 160 L814 161 L812 160 L811 161 L812 161 L812 162 L813 162 L813 163 L814 162 L815 163 L816 164 L818 163 L819 162 L820 162 L820 163 L821 163 L821 164 L822 164 L823 165 L824 165 L825 166 L826 165 L826 166 L827 166 L827 167 L828 167 L829 168 L828 169 L829 170 L830 170 L830 171 L829 171 L830 171 L830 172 L832 171 L832 170 L833 170 L834 169 L834 168 L835 168 L837 167 L837 168 L836 169 L837 170 L836 171 L836 172 L837 173 L838 172 L838 173 L839 174 L838 174 L839 175 L839 176 L840 176 L840 177 L840 178 L841 178 L842 179 L842 180 L841 180 L842 181 L843 181 L844 181 L843 181 L843 182 L844 182 L843 183 L844 182 L844 183 L845 183 L846 183 L847 183 L846 184 L845 184 L845 185 L845 186 L844 186 L843 186 L844 187 L843 188 L844 189 L844 190 L844 191 L845 191 L846 191 L846 192 L846 193 L847 193 L847 194 L847 195 L848 195 L848 196 L849 196 L849 197 L850 197 L850 198 L851 198 L851 199 L851 200 L850 200 L851 200 L850 201 L850 202 L849 202 L849 203 L848 203 L849 203 L850 203 L850 204 L851 203 L852 204 L853 204 L853 203 L854 204 L855 203 L856 203 L856 202 L857 202 L856 201 L857 201 L857 200 L858 200 L860 199 L860 198 L861 198 L861 197 L862 196 L863 196 L864 196 L863 195 L864 193 L864 192 L865 191 L866 191 L867 190 L866 190 L867 190 L868 190 L869 190 L869 189 L870 189 L871 189 L871 190 L872 190 L872 191 L873 191 L872 192 L873 192 L874 192 L873 193 L874 193 L875 193 L876 194 L875 194 L876 194 L877 194 L878 194 L879 194 L880 194 L880 195 L881 195 L882 195 L884 195 L885 195 L885 194 L886 195 L887 195 L888 195 L889 195 L889 196 L890 195 L891 194 L892 193 L892 192 L891 191 L890 191 L890 190 L889 189 L889 188 L889 187 L889 186 L888 186 L889 185 L892 185 L894 185 L895 185 L895 186 L897 185 L898 185 L899 185 L900 185 L902 185 L902 184 L903 184 L904 184 L904 183 L905 183 L906 183 L907 182 L906 182 L906 181 L907 181 L907 180 L908 179 L909 179 L909 178 L909 179 L910 179 L910 178 L911 178 L911 179 L912 180 L913 179 L912 179 L913 179 Z","cx":857.6,"cy":158.1},{"n":"黑龙江省","d":"M816 117 L817 117 L818 117 L819 117 L820 116 L821 116 L821 117 L822 116 L822 117 L822 118 L823 118 L822 119 L823 119 L822 119 L823 120 L823 121 L822 121 L823 121 L822 121 L822 122 L823 123 L824 123 L824 124 L823 124 L824 124 L823 125 L824 126 L825 126 L825 127 L826 127 L826 128 L827 128 L828 128 L829 129 L828 129 L829 130 L830 130 L831 130 L831 131 L832 130 L833 130 L834 130 L835 130 L836 130 L837 130 L837 129 L838 129 L839 129 L840 130 L840 131 L841 131 L842 131 L843 130 L844 131 L844 130 L845 131 L845 130 L846 130 L846 129 L847 130 L848 129 L849 129 L850 129 L850 131 L850 132 L851 132 L852 133 L853 134 L854 134 L855 134 L855 135 L856 134 L856 135 L857 135 L858 135 L859 135 L860 134 L861 134 L863 133 L864 133 L865 134 L866 134 L867 134 L868 135 L869 135 L870 135 L870 136 L871 136 L871 137 L872 137 L872 138 L872 139 L871 139 L871 140 L871 141 L872 142 L871 142 L872 143 L872 144 L872 143 L873 144 L874 143 L875 143 L874 143 L875 143 L877 143 L880 144 L880 145 L879 145 L878 145 L879 146 L879 147 L880 148 L881 149 L880 150 L881 150 L882 151 L882 150 L883 151 L883 152 L884 152 L885 152 L886 152 L888 152 L889 151 L888 151 L889 150 L888 149 L889 149 L888 148 L888 147 L889 148 L890 148 L891 146 L892 146 L893 145 L894 146 L895 146 L894 147 L895 147 L895 148 L894 148 L895 148 L894 149 L895 149 L894 150 L895 151 L896 151 L896 153 L897 153 L897 154 L897 155 L898 155 L899 155 L899 156 L899 157 L899 158 L900 158 L900 159 L901 160 L901 161 L902 161 L903 161 L904 161 L905 161 L906 160 L907 160 L907 159 L907 158 L907 157 L907 156 L908 157 L908 156 L909 157 L910 156 L911 155 L912 155 L914 155 L915 155 L916 155 L916 154 L917 153 L918 153 L919 153 L920 154 L920 155 L920 156 L921 156 L921 155 L922 155 L923 154 L924 154 L924 153 L925 153 L925 154 L926 155 L925 155 L926 156 L925 156 L926 156 L926 157 L926 158 L926 159 L927 159 L929 159 L930 159 L929 160 L930 160 L931 160 L932 161 L933 161 L933 162 L934 162 L935 162 L936 161 L938 163 L938 162 L939 162 L940 162 L940 161 L939 161 L939 160 L939 159 L939 158 L939 157 L939 156 L940 155 L940 154 L939 154 L940 153 L937 142 L937 141 L936 141 L936 140 L935 140 L937 139 L937 138 L938 138 L939 138 L939 139 L940 138 L941 138 L941 137 L942 138 L942 137 L943 138 L944 138 L943 137 L944 137 L945 136 L946 136 L947 135 L946 135 L946 134 L947 133 L948 134 L948 133 L949 132 L950 132 L951 133 L952 133 L954 134 L958 135 L964 136 L966 136 L966 137 L967 137 L968 136 L969 136 L969 135 L970 135 L970 134 L969 133 L970 133 L969 133 L970 132 L970 131 L970 130 L971 129 L972 129 L973 128 L974 128 L975 128 L974 127 L975 127 L976 127 L976 126 L975 126 L975 125 L976 125 L975 125 L976 124 L975 124 L976 124 L976 123 L977 123 L978 123 L978 122 L979 122 L979 121 L980 120 L979 119 L979 118 L980 118 L981 118 L981 117 L981 118 L982 117 L983 117 L982 116 L983 116 L982 116 L982 115 L983 115 L982 114 L981 114 L981 113 L982 113 L983 111 L984 111 L984 110 L984 109 L985 108 L984 108 L985 107 L985 106 L985 105 L986 105 L986 104 L986 103 L987 103 L988 103 L988 102 L987 102 L986 101 L987 100 L987 99 L988 99 L989 98 L992 98 L992 97 L993 97 L994 96 L995 95 L996 93 L995 92 L995 91 L994 90 L993 89 L993 88 L994 87 L995 86 L995 85 L996 84 L998 83 L1000 83 L1001 82 L1002 82 L1001 81 L1001 82 L1000 82 L999 81 L998 82 L997 83 L996 83 L995 82 L994 82 L993 82 L992 82 L991 82 L990 83 L987 83 L986 83 L985 83 L984 83 L984 84 L983 84 L982 84 L981 84 L981 85 L980 85 L979 86 L977 86 L977 87 L975 87 L974 87 L973 87 L972 87 L971 87 L970 87 L969 87 L968 87 L968 88 L966 89 L965 90 L964 90 L963 89 L962 90 L963 91 L962 91 L962 92 L961 92 L961 93 L959 93 L958 93 L957 93 L956 93 L955 93 L954 94 L953 94 L952 93 L951 94 L950 94 L949 94 L947 93 L946 94 L945 94 L945 93 L944 93 L943 93 L941 93 L940 93 L939 93 L938 94 L937 94 L936 94 L935 93 L935 92 L934 90 L933 90 L932 89 L931 88 L930 87 L932 86 L932 85 L933 84 L933 83 L932 83 L931 82 L932 81 L931 81 L930 81 L929 81 L929 79 L928 79 L928 78 L929 78 L929 76 L930 75 L929 75 L928 75 L927 75 L927 74 L926 74 L924 75 L923 75 L923 74 L921 73 L920 73 L920 72 L918 72 L918 71 L917 71 L917 70 L916 70 L915 69 L916 68 L915 68 L914 68 L913 68 L912 68 L912 66 L910 66 L909 66 L909 67 L908 67 L908 66 L907 66 L906 66 L906 67 L905 67 L904 67 L903 65 L902 65 L901 65 L900 65 L899 65 L899 64 L900 64 L900 63 L899 63 L899 64 L898 63 L897 63 L896 63 L895 63 L893 63 L893 64 L892 63 L891 64 L890 64 L889 64 L888 64 L887 63 L886 63 L885 63 L884 63 L884 62 L882 62 L882 61 L882 60 L880 60 L880 59 L880 58 L880 57 L879 57 L879 56 L880 54 L881 54 L881 53 L878 52 L877 52 L876 51 L877 50 L877 49 L876 49 L876 48 L877 48 L877 47 L876 46 L876 45 L876 44 L875 44 L873 42 L873 41 L872 41 L871 40 L870 39 L870 38 L869 37 L870 36 L871 36 L871 35 L870 35 L869 35 L869 36 L870 36 L869 36 L868 36 L868 35 L869 35 L870 35 L869 34 L868 34 L868 33 L867 33 L868 32 L866 31 L867 30 L867 29 L866 29 L865 28 L864 27 L864 26 L863 25 L862 25 L862 24 L863 24 L864 22 L863 22 L862 22 L861 21 L860 21 L860 20 L861 20 L862 20 L862 19 L860 19 L860 18 L861 18 L860 17 L859 17 L858 17 L858 16 L857 15 L856 14 L856 15 L855 15 L855 14 L854 14 L855 13 L856 13 L856 12 L857 12 L856 11 L855 11 L855 12 L854 12 L854 11 L853 10 L852 10 L851 10 L850 10 L849 10 L849 9 L851 9 L851 8 L850 8 L849 7 L848 7 L847 7 L846 6 L844 6 L843 5 L842 5 L841 5 L839 5 L838 5 L837 5 L837 6 L836 6 L835 6 L834 6 L834 5 L832 5 L831 5 L830 5 L830 4 L829 4 L828 3 L826 2 L825 2 L824 2 L823 2 L822 1 L820 0 L819 0 L818 0 L817 -1 L816 -1 L816 0 L815 0 L815 -1 L814 -1 L815 0 L814 0 L814 -1 L813 -1 L811 -1 L810 -1 L809 0 L808 0 L807 0 L806 0 L805 1 L804 1 L803 1 L801 1 L800 1 L799 1 L798 1 L797 1 L796 0 L795 0 L794 1 L793 1 L792 1 L791 1 L788 1 L787 1 L786 2 L785 2 L784 2 L782 3 L783 3 L784 4 L785 4 L785 5 L786 6 L787 6 L787 7 L787 8 L786 8 L785 9 L784 10 L784 11 L783 11 L782 12 L780 13 L779 13 L779 14 L778 14 L777 15 L778 15 L779 15 L780 16 L781 16 L782 16 L783 17 L784 17 L785 17 L785 18 L786 19 L787 19 L788 20 L789 20 L789 19 L790 19 L791 18 L792 17 L793 16 L794 17 L795 17 L796 17 L796 18 L797 18 L798 18 L798 19 L799 20 L800 20 L801 20 L802 20 L803 20 L803 21 L802 22 L801 22 L800 22 L801 22 L800 23 L801 23 L801 24 L801 25 L802 25 L802 26 L802 27 L803 28 L802 28 L803 29 L803 30 L804 30 L804 31 L805 32 L804 32 L805 32 L804 33 L805 33 L805 34 L806 34 L806 35 L808 35 L809 36 L810 36 L811 36 L812 36 L813 36 L814 36 L816 36 L816 35 L817 35 L818 34 L819 35 L820 34 L821 35 L822 35 L824 35 L825 35 L826 35 L827 35 L827 36 L828 36 L829 36 L830 35 L829 35 L830 35 L830 34 L832 34 L833 35 L834 35 L835 35 L835 34 L837 34 L838 33 L837 33 L838 32 L839 32 L840 31 L840 30 L841 30 L842 30 L843 30 L844 30 L845 31 L846 31 L847 32 L848 33 L848 34 L849 34 L850 35 L851 36 L851 37 L852 37 L853 38 L854 39 L854 38 L855 38 L854 39 L856 40 L855 40 L856 41 L856 42 L855 42 L854 42 L854 43 L853 43 L852 44 L851 44 L852 45 L851 45 L852 45 L851 46 L852 46 L852 47 L852 48 L851 48 L850 49 L849 49 L848 49 L848 50 L847 50 L848 51 L847 51 L846 52 L846 53 L845 53 L845 54 L844 54 L845 54 L844 54 L843 54 L843 55 L844 55 L844 56 L843 56 L844 56 L843 57 L842 57 L842 58 L843 59 L842 59 L843 59 L842 59 L842 60 L842 61 L842 62 L841 62 L841 63 L841 62 L842 63 L842 64 L842 65 L843 65 L843 66 L843 67 L842 68 L842 69 L842 70 L841 70 L841 71 L839 70 L838 70 L837 70 L836 70 L836 71 L836 72 L835 73 L835 74 L834 74 L834 75 L833 75 L833 76 L832 77 L833 77 L832 79 L831 80 L832 81 L831 82 L831 83 L832 84 L832 85 L831 86 L831 87 L830 87 L829 87 L830 87 L830 86 L829 86 L829 85 L828 84 L828 83 L828 82 L827 81 L828 81 L827 80 L825 81 L824 82 L823 82 L820 84 L818 86 L816 88 L815 88 L811 90 L811 91 L810 92 L809 92 L807 93 L805 94 L804 94 L803 95 L800 96 L799 97 L799 98 L797 99 L797 100 L798 100 L798 101 L799 102 L800 102 L800 103 L801 103 L802 103 L804 104 L803 105 L803 106 L804 106 L805 106 L805 107 L805 108 L806 109 L807 109 L808 109 L809 109 L810 108 L810 107 L811 107 L812 108 L813 106 L812 105 L811 105 L812 105 L813 106 L814 106 L815 106 L814 107 L815 108 L816 108 L816 107 L817 107 L816 108 L817 108 L817 109 L816 110 L814 110 L812 110 L811 110 L811 111 L810 112 L809 111 L808 111 L807 111 L807 112 L806 112 L807 113 L807 114 L808 115 L809 116 L809 117 L810 117 L811 117 L812 117 L813 117 L814 117 L815 117 L816 117 Z","cx":882.1,"cy":88.1},{"n":"上海市","d":"M773 363 L774 363 L774 364 L774 365 L775 365 L774 366 L775 366 L776 365 L776 366 L776 367 L777 367 L778 367 L779 368 L780 368 L781 367 L783 367 L784 366 L785 366 L789 366 L789 367 L790 367 L790 366 L790 365 L790 364 L790 363 L789 362 L787 360 L786 358 L784 357 L783 357 L781 355 L780 355 L779 355 L778 355 L777 356 L777 357 L776 357 L776 358 L776 359 L776 358 L775 359 L775 361 L774 361 L773 361 L772 361 L772 362 L773 363 Z","cx":781.3,"cy":361.9},{"n":"江苏省","d":"M715 306 L714 306 L715 306 L714 306 L714 307 L712 308 L712 306 L711 304 L711 303 L710 302 L709 302 L709 301 L708 300 L707 300 L707 299 L706 299 L706 300 L704 300 L703 300 L701 300 L700 301 L700 302 L700 303 L699 303 L700 303 L700 304 L701 305 L703 306 L703 307 L704 307 L705 307 L706 307 L706 308 L707 308 L708 308 L709 308 L709 309 L709 310 L711 311 L710 312 L712 313 L713 314 L714 314 L714 313 L715 314 L715 313 L716 314 L717 314 L718 314 L719 315 L720 315 L720 314 L721 315 L721 316 L721 317 L722 316 L722 317 L722 319 L721 319 L722 319 L723 319 L724 319 L725 319 L726 319 L727 318 L728 318 L728 319 L729 320 L728 321 L728 323 L727 323 L726 323 L726 324 L726 325 L725 326 L725 327 L726 328 L726 329 L728 328 L729 327 L729 328 L729 329 L730 330 L730 331 L731 331 L731 332 L730 332 L730 333 L731 333 L731 334 L731 335 L732 335 L733 335 L734 335 L735 335 L736 335 L737 335 L738 335 L738 334 L738 333 L739 333 L739 332 L740 332 L741 332 L742 332 L743 333 L744 334 L745 334 L745 336 L745 337 L746 337 L745 338 L744 338 L745 338 L744 339 L743 340 L743 339 L742 339 L741 338 L740 338 L740 337 L739 338 L739 337 L738 338 L738 337 L737 337 L736 337 L736 338 L735 337 L735 338 L736 338 L735 339 L736 339 L737 339 L737 340 L737 342 L736 342 L737 343 L736 344 L734 344 L734 345 L733 346 L732 346 L732 347 L732 348 L733 349 L734 350 L734 351 L735 351 L736 351 L737 352 L736 352 L736 353 L738 353 L738 352 L739 353 L740 353 L740 354 L740 355 L740 357 L739 357 L738 357 L737 358 L738 359 L739 359 L740 359 L742 359 L744 359 L744 358 L745 358 L745 359 L746 359 L747 359 L748 358 L748 359 L748 360 L749 360 L749 361 L751 361 L752 361 L753 360 L753 361 L753 360 L755 360 L755 361 L755 360 L756 361 L757 360 L757 361 L758 362 L758 363 L759 363 L760 364 L762 364 L763 364 L764 364 L764 365 L765 365 L765 364 L765 365 L765 366 L766 367 L767 366 L768 365 L769 366 L769 365 L770 365 L770 364 L769 364 L770 364 L770 363 L771 363 L772 363 L773 363 L772 362 L772 361 L773 361 L774 361 L775 361 L775 359 L776 358 L776 359 L776 358 L776 357 L777 357 L777 356 L778 355 L779 355 L780 355 L780 354 L779 353 L777 351 L776 351 L777 350 L778 349 L779 349 L780 350 L781 351 L782 351 L784 352 L785 352 L786 352 L790 353 L790 352 L789 349 L788 348 L787 346 L786 346 L783 345 L782 344 L782 343 L781 342 L781 340 L780 340 L780 339 L779 339 L777 338 L776 338 L775 338 L775 337 L774 337 L774 336 L773 336 L773 335 L774 335 L774 333 L773 331 L773 330 L772 330 L772 329 L772 327 L771 327 L772 326 L771 326 L770 326 L770 325 L770 324 L769 322 L768 321 L767 320 L767 318 L766 317 L764 313 L764 312 L763 311 L763 310 L760 308 L757 307 L755 307 L755 306 L752 306 L752 305 L751 305 L749 304 L750 303 L749 303 L748 303 L750 303 L749 302 L748 302 L747 302 L746 302 L745 301 L745 300 L745 299 L746 298 L747 297 L747 298 L747 297 L746 297 L745 297 L744 297 L744 298 L742 298 L741 298 L740 298 L740 299 L739 301 L738 302 L737 303 L738 303 L737 304 L737 303 L736 303 L735 303 L733 304 L733 305 L733 306 L733 307 L732 308 L730 308 L729 308 L729 309 L729 307 L728 307 L729 306 L727 305 L728 305 L727 304 L725 304 L724 304 L722 304 L722 305 L723 306 L721 306 L720 307 L719 307 L718 307 L717 307 L716 306 L716 305 L715 305 L715 306 Z","cx":749.8,"cy":331.1},{"n":"浙江省","d":"M733 407 L734 408 L734 407 L735 407 L736 407 L737 407 L737 406 L738 407 L739 408 L738 408 L739 409 L739 410 L738 410 L737 410 L738 411 L738 412 L739 413 L739 414 L740 416 L740 417 L741 418 L740 418 L740 419 L740 420 L741 420 L742 420 L743 420 L744 420 L744 421 L746 421 L747 420 L748 419 L749 419 L750 418 L750 417 L751 417 L752 417 L752 418 L753 418 L753 419 L753 420 L753 421 L754 422 L755 422 L754 423 L756 423 L757 422 L758 422 L759 422 L760 421 L762 421 L764 421 L764 422 L765 423 L765 424 L766 425 L767 425 L767 424 L767 422 L769 422 L769 421 L769 420 L768 419 L768 418 L769 418 L770 417 L771 416 L771 415 L772 415 L773 414 L773 413 L774 413 L775 414 L776 415 L777 414 L776 415 L777 415 L777 414 L777 413 L776 413 L775 413 L774 412 L775 410 L776 409 L776 411 L777 411 L778 411 L779 410 L779 409 L780 409 L781 408 L782 407 L783 407 L784 408 L784 407 L785 406 L784 406 L785 405 L785 404 L785 403 L784 402 L783 401 L785 400 L786 399 L785 398 L787 398 L787 397 L786 396 L786 395 L785 394 L785 393 L784 393 L786 393 L787 393 L787 394 L788 394 L790 395 L790 394 L790 393 L789 392 L790 392 L790 391 L789 391 L790 390 L789 390 L789 389 L790 389 L790 388 L790 387 L790 386 L790 385 L789 385 L788 385 L789 383 L790 383 L791 382 L792 382 L793 381 L790 381 L790 380 L789 381 L788 380 L787 379 L786 379 L785 379 L785 378 L784 378 L783 376 L782 375 L781 374 L780 373 L779 373 L778 373 L777 372 L776 371 L775 370 L777 370 L777 369 L778 369 L779 368 L778 367 L777 367 L776 367 L776 366 L776 365 L775 366 L774 366 L775 365 L774 365 L774 364 L774 363 L773 363 L772 363 L771 363 L770 363 L770 364 L769 364 L770 364 L770 365 L769 365 L769 366 L768 365 L767 366 L766 367 L765 366 L765 365 L765 364 L765 365 L764 365 L764 364 L763 364 L762 364 L760 364 L759 363 L758 363 L758 362 L757 361 L757 360 L756 361 L755 360 L755 361 L755 360 L753 360 L753 361 L753 360 L752 361 L752 362 L752 363 L751 364 L751 365 L751 366 L750 367 L750 368 L749 369 L748 368 L747 369 L746 369 L746 370 L746 371 L747 371 L747 372 L748 373 L748 374 L747 373 L746 374 L745 375 L744 374 L743 374 L742 374 L741 373 L740 374 L740 375 L740 376 L741 376 L740 377 L740 378 L740 379 L740 380 L739 380 L739 381 L738 382 L738 383 L737 384 L736 385 L735 385 L734 386 L734 387 L732 387 L731 388 L731 387 L731 388 L731 389 L730 388 L729 389 L729 390 L728 390 L729 391 L728 391 L727 391 L727 392 L726 392 L726 393 L727 393 L726 394 L727 394 L727 395 L728 395 L728 396 L729 396 L729 397 L730 397 L731 398 L732 398 L732 400 L733 401 L733 402 L732 403 L733 403 L732 403 L733 404 L733 405 L734 406 L733 407 Z","cx":759.8,"cy":392.5},{"n":"安徽省","d":"M703 314 L704 315 L704 316 L704 317 L703 316 L703 317 L701 317 L701 318 L700 318 L699 318 L698 319 L697 319 L696 319 L695 318 L694 318 L695 317 L693 316 L694 315 L693 315 L692 315 L692 314 L692 315 L691 315 L691 314 L690 314 L689 313 L689 314 L688 314 L687 314 L687 315 L686 317 L688 317 L687 318 L687 319 L687 320 L688 321 L687 322 L686 322 L685 322 L684 322 L684 323 L683 322 L683 323 L683 324 L683 323 L683 324 L682 325 L683 325 L683 326 L683 327 L682 328 L682 329 L681 329 L680 329 L678 329 L677 329 L677 328 L676 328 L676 329 L676 331 L676 330 L676 331 L677 332 L678 332 L680 332 L680 333 L681 333 L680 334 L681 334 L680 335 L680 336 L681 337 L682 338 L684 338 L685 339 L686 339 L686 340 L687 340 L688 340 L689 339 L690 339 L691 338 L692 338 L691 339 L692 339 L691 340 L692 341 L692 343 L693 344 L692 346 L692 347 L692 348 L692 349 L692 350 L692 351 L691 350 L690 351 L690 350 L689 351 L688 351 L686 352 L685 352 L685 353 L685 354 L684 355 L683 355 L684 356 L683 357 L684 357 L683 357 L684 358 L685 358 L685 359 L686 359 L686 360 L687 361 L687 360 L688 360 L689 360 L690 361 L691 361 L692 361 L693 362 L694 363 L695 364 L694 364 L693 364 L692 365 L691 365 L691 366 L691 367 L690 367 L690 368 L691 369 L691 370 L692 370 L692 371 L692 372 L692 373 L692 374 L693 375 L694 375 L695 376 L694 376 L695 377 L695 378 L695 379 L695 380 L696 381 L696 382 L697 382 L698 383 L699 382 L701 381 L702 381 L703 379 L704 378 L705 378 L706 378 L706 379 L707 379 L707 380 L708 380 L708 381 L706 383 L706 382 L704 384 L705 384 L704 385 L705 386 L706 386 L707 386 L708 386 L709 385 L710 384 L711 384 L711 383 L712 383 L712 382 L711 382 L712 381 L713 380 L714 381 L714 382 L715 382 L716 382 L717 383 L717 384 L718 385 L718 386 L719 386 L720 385 L721 386 L721 387 L723 386 L724 387 L725 387 L726 386 L727 387 L728 387 L728 388 L728 389 L729 389 L730 388 L731 389 L731 388 L731 387 L731 388 L732 387 L734 387 L734 386 L735 385 L736 385 L737 384 L738 383 L738 382 L739 381 L739 380 L740 380 L740 379 L740 378 L740 377 L741 376 L740 376 L740 375 L740 374 L741 373 L742 374 L743 374 L744 374 L745 375 L746 374 L747 373 L748 374 L748 373 L747 372 L747 371 L746 371 L746 370 L746 369 L747 369 L748 368 L749 369 L750 368 L750 367 L751 366 L751 365 L751 364 L752 363 L752 362 L752 361 L751 361 L749 361 L749 360 L748 360 L748 359 L748 358 L747 359 L746 359 L745 359 L745 358 L744 358 L744 359 L742 359 L740 359 L739 359 L738 359 L737 358 L738 357 L739 357 L740 357 L740 355 L740 354 L740 353 L739 353 L738 352 L738 353 L736 353 L736 352 L737 352 L736 351 L735 351 L734 351 L734 350 L733 349 L732 348 L732 347 L732 346 L733 346 L734 345 L734 344 L736 344 L737 343 L736 342 L737 342 L737 340 L737 339 L736 339 L735 339 L736 338 L735 338 L735 337 L736 338 L736 337 L737 337 L738 337 L738 338 L739 337 L739 338 L740 337 L740 338 L741 338 L742 339 L743 339 L743 340 L744 339 L745 338 L744 338 L745 338 L746 337 L745 337 L745 336 L745 334 L744 334 L743 333 L742 332 L741 332 L740 332 L739 332 L739 333 L738 333 L738 334 L738 335 L737 335 L736 335 L735 335 L734 335 L733 335 L732 335 L731 335 L731 334 L731 333 L730 333 L730 332 L731 332 L731 331 L730 331 L730 330 L729 329 L729 328 L729 327 L728 328 L726 329 L726 328 L725 327 L725 326 L726 325 L726 324 L726 323 L727 323 L728 323 L728 321 L729 320 L728 319 L728 318 L727 318 L726 319 L725 319 L724 319 L723 319 L722 319 L721 319 L722 319 L722 317 L722 316 L721 317 L721 316 L721 315 L720 314 L720 315 L719 315 L718 314 L717 314 L716 314 L715 313 L715 314 L714 313 L714 314 L713 314 L712 313 L710 312 L711 311 L709 310 L709 309 L709 308 L708 308 L707 308 L706 308 L706 307 L705 307 L704 307 L703 307 L703 306 L701 305 L700 304 L699 305 L698 305 L698 306 L697 305 L697 306 L696 307 L696 308 L697 308 L697 309 L698 309 L699 310 L700 310 L701 310 L702 310 L703 310 L702 311 L703 312 L702 312 L702 313 L703 314 Z","cx":713.3,"cy":349.4},{"n":"福建省","d":"M742 460 L742 459 L742 460 L741 459 L740 458 L742 458 L741 457 L742 457 L741 457 L741 456 L740 456 L741 456 L742 456 L742 457 L743 456 L743 457 L742 457 L742 458 L743 458 L744 458 L744 459 L744 460 L744 459 L745 458 L744 457 L744 456 L745 457 L746 457 L747 457 L747 456 L748 456 L747 455 L746 455 L745 454 L744 454 L744 453 L745 453 L746 453 L745 452 L746 452 L746 453 L747 453 L748 453 L747 452 L748 452 L749 452 L749 453 L750 453 L750 454 L751 454 L751 453 L751 454 L752 455 L752 454 L753 454 L753 453 L752 453 L753 452 L753 453 L754 454 L754 453 L755 453 L756 453 L756 452 L755 452 L755 451 L756 451 L755 451 L756 450 L755 450 L755 449 L753 450 L753 451 L753 452 L752 452 L752 451 L751 450 L750 450 L750 449 L751 449 L752 449 L752 448 L752 446 L753 445 L754 444 L753 443 L752 442 L752 441 L753 441 L753 440 L754 439 L755 439 L756 439 L757 439 L757 438 L756 438 L755 437 L755 436 L755 434 L754 434 L753 434 L752 434 L751 434 L752 433 L752 432 L753 432 L753 433 L755 433 L756 433 L757 433 L756 433 L757 432 L757 431 L759 431 L758 432 L758 433 L757 434 L756 434 L755 435 L756 436 L757 435 L757 434 L758 434 L759 434 L760 434 L760 433 L761 432 L760 432 L760 431 L760 430 L759 431 L759 430 L760 430 L760 429 L761 429 L762 429 L762 428 L763 428 L763 427 L763 426 L764 426 L765 426 L766 425 L765 424 L765 423 L764 422 L764 421 L762 421 L760 421 L759 422 L758 422 L757 422 L756 423 L754 423 L755 422 L754 422 L753 421 L753 420 L753 419 L753 418 L752 418 L752 417 L751 417 L750 417 L750 418 L749 419 L748 419 L747 420 L746 421 L744 421 L744 420 L743 420 L742 420 L741 420 L740 420 L740 419 L740 418 L741 418 L740 417 L740 416 L739 414 L739 413 L738 412 L738 411 L737 410 L738 410 L739 410 L739 409 L738 408 L739 408 L738 407 L737 406 L737 407 L736 407 L735 407 L734 407 L734 408 L733 407 L731 408 L732 409 L732 410 L730 410 L729 411 L728 411 L727 411 L727 412 L726 412 L725 412 L724 412 L723 412 L722 413 L722 414 L722 415 L721 414 L720 414 L719 412 L718 412 L717 413 L717 412 L716 413 L715 414 L715 413 L714 414 L715 414 L714 415 L714 416 L713 416 L713 417 L712 417 L712 416 L711 417 L711 418 L711 417 L710 417 L710 418 L710 419 L711 419 L711 420 L712 421 L711 421 L711 422 L712 422 L712 423 L712 424 L710 425 L711 426 L709 427 L708 427 L707 428 L707 427 L705 428 L704 429 L703 429 L702 430 L702 431 L703 431 L702 432 L702 433 L703 433 L702 434 L702 435 L703 436 L704 436 L703 437 L703 438 L702 438 L702 437 L702 438 L701 438 L701 439 L700 439 L700 440 L700 441 L701 441 L701 442 L700 443 L699 444 L700 444 L699 444 L698 445 L697 445 L696 446 L696 447 L696 448 L695 449 L695 450 L694 450 L695 451 L694 451 L694 452 L694 453 L693 454 L694 455 L693 455 L692 456 L691 457 L692 458 L692 459 L692 460 L692 461 L691 461 L692 461 L693 462 L694 461 L695 462 L696 462 L697 462 L697 463 L698 463 L697 463 L698 463 L699 463 L699 462 L700 462 L700 463 L700 464 L701 465 L701 464 L702 466 L703 466 L704 466 L704 465 L706 465 L707 465 L706 467 L706 468 L707 468 L707 469 L708 470 L708 471 L709 472 L709 473 L710 473 L709 474 L709 475 L709 476 L709 477 L709 478 L710 478 L710 479 L710 480 L711 481 L712 482 L713 482 L713 483 L714 483 L715 483 L716 483 L717 483 L717 482 L718 482 L718 481 L719 481 L720 479 L721 478 L722 478 L723 477 L724 476 L725 475 L725 474 L726 474 L726 473 L727 472 L728 472 L728 470 L727 470 L727 469 L727 468 L728 467 L729 467 L730 468 L732 467 L733 466 L734 466 L735 467 L735 468 L736 468 L737 467 L737 466 L736 466 L737 465 L738 464 L736 463 L736 462 L737 462 L738 462 L739 462 L740 462 L741 462 L742 462 L741 461 L742 461 L742 460 Z","cx":725.9,"cy":442.7},{"n":"江西省","d":"M729 389 L728 389 L728 388 L728 387 L727 387 L726 386 L725 387 L724 387 L723 386 L721 387 L721 386 L720 385 L719 386 L718 386 L718 385 L717 384 L717 383 L716 382 L715 382 L714 382 L714 381 L713 380 L712 381 L711 382 L712 382 L712 383 L711 383 L711 384 L710 384 L709 385 L708 386 L707 386 L706 386 L705 386 L704 385 L705 384 L704 384 L706 382 L706 383 L708 381 L708 380 L707 380 L707 379 L706 379 L706 378 L705 378 L704 378 L703 379 L702 381 L701 381 L699 382 L698 383 L697 382 L696 382 L695 383 L694 383 L693 384 L692 384 L691 383 L690 383 L689 382 L688 382 L687 382 L686 382 L685 382 L685 383 L684 384 L683 385 L682 385 L681 385 L680 385 L679 384 L679 385 L680 385 L679 386 L680 386 L680 387 L679 387 L679 386 L678 387 L677 386 L677 387 L676 387 L675 388 L676 388 L677 388 L676 389 L675 389 L674 389 L674 390 L673 389 L672 389 L671 389 L671 390 L670 390 L669 390 L668 390 L667 390 L666 389 L665 390 L665 392 L664 392 L662 392 L662 393 L661 393 L661 394 L660 395 L661 395 L661 396 L661 397 L662 397 L663 398 L664 398 L664 399 L663 401 L663 402 L663 403 L664 403 L665 404 L664 405 L665 405 L665 406 L664 407 L664 408 L663 408 L663 409 L662 409 L661 409 L662 410 L662 411 L661 411 L660 411 L660 412 L659 411 L659 412 L658 412 L657 413 L657 414 L657 415 L656 416 L656 417 L655 418 L655 419 L655 420 L655 421 L655 422 L656 422 L657 422 L659 421 L659 422 L659 423 L659 424 L658 425 L658 426 L658 427 L659 427 L660 428 L660 429 L659 430 L659 431 L659 433 L660 434 L661 434 L662 434 L663 435 L662 436 L663 436 L663 437 L662 437 L662 438 L662 439 L661 440 L660 441 L661 441 L662 441 L663 441 L664 440 L665 441 L664 442 L663 442 L663 443 L662 443 L661 444 L662 444 L662 446 L661 446 L661 447 L660 448 L660 449 L661 450 L661 451 L660 453 L661 453 L662 454 L662 455 L662 456 L662 455 L663 455 L664 455 L665 455 L666 455 L666 454 L667 455 L668 454 L669 454 L670 453 L671 454 L672 455 L673 455 L673 456 L672 456 L672 457 L673 457 L673 458 L672 458 L672 459 L671 459 L670 459 L670 460 L669 460 L668 461 L668 462 L667 462 L667 463 L667 464 L666 464 L666 465 L664 465 L665 466 L666 466 L666 467 L667 467 L668 467 L668 468 L670 467 L671 467 L672 467 L673 468 L673 467 L673 466 L674 466 L675 467 L675 466 L675 467 L676 467 L676 465 L676 466 L677 465 L678 465 L679 465 L680 465 L682 464 L683 464 L684 463 L685 464 L686 465 L687 466 L688 466 L689 467 L690 467 L691 467 L690 466 L690 465 L690 464 L690 463 L690 462 L691 461 L691 462 L692 462 L692 461 L691 461 L692 461 L692 460 L692 459 L692 458 L691 457 L692 456 L693 455 L694 455 L693 454 L694 453 L694 452 L694 451 L695 451 L694 450 L695 450 L695 449 L696 448 L696 447 L696 446 L697 445 L698 445 L699 444 L700 444 L699 444 L700 443 L701 442 L701 441 L700 441 L700 440 L700 439 L701 439 L701 438 L702 438 L702 437 L702 438 L703 438 L703 437 L704 436 L703 436 L702 435 L702 434 L703 433 L702 433 L702 432 L703 431 L702 431 L702 430 L703 429 L704 429 L705 428 L707 427 L707 428 L708 427 L709 427 L711 426 L710 425 L712 424 L712 423 L712 422 L711 422 L711 421 L712 421 L711 420 L711 419 L710 419 L710 418 L710 417 L711 417 L711 418 L711 417 L712 416 L712 417 L713 417 L713 416 L714 416 L714 415 L715 414 L714 414 L715 413 L715 414 L716 413 L717 412 L717 413 L718 412 L719 412 L720 414 L721 414 L722 415 L722 414 L722 413 L723 412 L724 412 L725 412 L726 412 L727 412 L727 411 L728 411 L729 411 L730 410 L732 410 L732 409 L731 408 L733 407 L734 406 L733 405 L733 404 L732 403 L733 403 L732 403 L733 402 L733 401 L732 400 L732 398 L731 398 L730 397 L729 397 L729 396 L728 396 L728 395 L727 395 L727 394 L726 394 L727 393 L726 393 L726 392 L727 392 L727 391 L728 391 L729 391 L728 390 L729 390 L729 389 Z","cx":689.2,"cy":417.4},{"n":"山东省","d":"M700 304 L700 303 L699 303 L700 303 L700 302 L700 301 L701 300 L703 300 L704 300 L706 300 L706 299 L707 299 L707 300 L708 300 L709 301 L709 302 L710 302 L711 303 L711 304 L712 306 L712 308 L714 307 L714 306 L715 306 L714 306 L715 306 L715 305 L716 305 L716 306 L717 307 L718 307 L719 307 L720 307 L721 306 L723 306 L722 305 L722 304 L724 304 L725 304 L727 304 L728 305 L727 305 L729 306 L728 307 L729 307 L729 309 L729 308 L730 308 L732 308 L733 307 L733 306 L733 305 L733 304 L735 303 L736 303 L737 303 L737 304 L738 303 L737 303 L738 302 L739 301 L740 299 L740 298 L741 298 L742 298 L744 298 L744 297 L745 297 L746 297 L747 297 L748 297 L749 297 L748 296 L749 295 L749 294 L750 293 L751 294 L751 293 L751 292 L752 291 L753 289 L754 289 L755 289 L755 288 L755 289 L756 289 L757 288 L757 287 L757 286 L758 287 L759 286 L759 285 L759 284 L760 284 L761 284 L761 283 L761 284 L762 283 L763 283 L763 282 L762 283 L762 282 L761 282 L762 282 L762 281 L761 281 L760 281 L760 280 L761 279 L762 279 L763 279 L764 279 L764 280 L763 282 L764 282 L765 281 L766 281 L767 281 L768 281 L768 280 L768 281 L769 280 L770 280 L769 280 L769 279 L769 278 L769 277 L770 277 L769 276 L770 275 L771 275 L772 275 L772 276 L773 276 L773 275 L774 275 L773 274 L774 274 L774 273 L773 273 L772 273 L772 272 L773 273 L775 273 L777 272 L778 272 L779 271 L780 271 L781 271 L782 270 L782 269 L783 269 L782 270 L783 271 L783 270 L785 271 L784 269 L785 269 L786 269 L787 268 L789 267 L790 267 L791 268 L792 268 L792 267 L793 267 L792 268 L793 268 L793 269 L794 269 L795 269 L796 269 L797 268 L797 269 L798 268 L797 268 L798 268 L799 268 L799 267 L799 266 L800 266 L800 265 L798 266 L798 265 L798 264 L799 264 L800 264 L800 263 L800 262 L799 262 L800 261 L800 260 L801 260 L802 260 L801 260 L801 259 L799 260 L798 260 L798 259 L797 260 L796 260 L795 259 L794 259 L793 259 L792 258 L793 258 L793 257 L792 257 L792 258 L791 258 L790 258 L789 259 L787 259 L785 259 L784 258 L783 259 L782 259 L782 258 L781 257 L781 256 L780 256 L780 257 L779 257 L778 257 L777 257 L777 256 L776 256 L777 255 L776 255 L775 255 L774 254 L773 254 L773 253 L772 253 L770 253 L769 253 L768 253 L768 254 L766 254 L765 254 L764 255 L762 255 L762 256 L761 257 L762 257 L762 258 L760 259 L759 259 L758 259 L757 259 L757 260 L756 260 L755 261 L756 261 L756 262 L756 263 L755 263 L754 264 L753 264 L751 264 L750 264 L749 264 L748 264 L747 264 L747 263 L745 263 L745 262 L744 263 L744 262 L743 262 L743 261 L742 261 L741 258 L742 256 L744 256 L746 256 L746 255 L747 253 L747 252 L746 252 L745 253 L744 253 L744 251 L742 250 L742 249 L740 248 L739 248 L737 248 L736 248 L735 249 L734 249 L734 248 L733 248 L732 248 L731 248 L729 248 L729 247 L728 247 L727 247 L726 247 L724 246 L724 245 L723 246 L722 247 L722 248 L721 249 L719 249 L718 250 L718 251 L717 252 L716 253 L715 252 L714 253 L713 253 L712 253 L711 253 L710 253 L708 253 L707 253 L706 253 L706 254 L705 254 L705 255 L704 255 L703 256 L701 258 L701 259 L700 258 L699 257 L698 257 L698 258 L698 259 L697 258 L697 259 L698 260 L697 260 L696 260 L695 260 L694 260 L693 261 L693 262 L692 263 L692 264 L691 265 L690 266 L690 267 L690 268 L689 268 L688 269 L686 270 L685 270 L685 271 L684 271 L683 272 L683 274 L682 274 L682 275 L683 275 L682 276 L683 276 L683 277 L684 277 L684 278 L685 278 L685 280 L685 282 L683 283 L683 284 L683 286 L684 285 L685 285 L685 284 L686 284 L687 284 L688 284 L689 283 L690 283 L691 282 L692 282 L693 282 L694 281 L695 281 L695 282 L694 283 L693 283 L692 283 L692 284 L691 285 L690 285 L689 285 L689 286 L687 287 L686 287 L685 287 L684 289 L683 290 L683 291 L682 291 L681 292 L680 292 L679 292 L679 293 L678 292 L677 294 L676 295 L675 296 L676 297 L675 297 L674 298 L675 298 L676 299 L677 299 L678 299 L679 299 L679 298 L680 299 L681 299 L681 300 L681 301 L682 301 L683 301 L684 302 L685 303 L684 303 L685 304 L686 305 L686 306 L687 305 L688 306 L689 305 L690 305 L691 306 L693 305 L694 305 L695 305 L696 306 L697 305 L698 306 L698 305 L699 305 L700 304 Z","cx":728.8,"cy":276.3},{"n":"河南省","d":"M641 341 L642 341 L643 341 L644 341 L645 341 L645 340 L646 340 L646 341 L647 341 L648 341 L648 340 L649 340 L651 342 L650 342 L651 342 L652 343 L653 342 L655 341 L656 340 L657 340 L658 341 L657 342 L658 342 L657 343 L658 344 L657 345 L657 346 L658 346 L657 347 L658 348 L659 348 L659 349 L660 349 L661 349 L661 350 L661 351 L662 351 L663 350 L663 349 L664 349 L665 350 L666 351 L667 351 L668 351 L670 351 L671 351 L671 352 L670 353 L670 354 L671 354 L672 354 L673 355 L674 355 L675 356 L675 355 L676 356 L677 355 L678 355 L679 355 L679 354 L679 353 L680 353 L681 354 L681 355 L681 356 L681 357 L682 357 L683 357 L684 356 L683 355 L684 355 L685 354 L685 353 L685 352 L686 352 L688 351 L689 351 L690 350 L690 351 L691 350 L692 351 L692 350 L692 349 L692 348 L692 347 L692 346 L693 344 L692 343 L692 341 L691 340 L692 339 L691 339 L692 338 L691 338 L690 339 L689 339 L688 340 L687 340 L686 340 L686 339 L685 339 L684 338 L682 338 L681 337 L680 336 L680 335 L681 334 L680 334 L681 333 L680 333 L680 332 L678 332 L677 332 L676 331 L676 330 L676 331 L676 329 L676 328 L677 328 L677 329 L678 329 L680 329 L681 329 L682 329 L682 328 L683 327 L683 326 L683 325 L682 325 L683 324 L683 323 L683 324 L683 323 L683 322 L684 323 L684 322 L685 322 L686 322 L687 322 L688 321 L687 320 L687 319 L687 318 L688 317 L686 317 L687 315 L687 314 L688 314 L689 314 L689 313 L690 314 L691 314 L691 315 L692 315 L692 314 L692 315 L693 315 L694 315 L693 316 L695 317 L694 318 L695 318 L696 319 L697 319 L698 319 L699 318 L700 318 L701 318 L701 317 L703 317 L703 316 L704 317 L704 316 L704 315 L703 314 L702 313 L702 312 L703 312 L702 311 L703 310 L702 310 L701 310 L700 310 L699 310 L698 309 L697 309 L697 308 L696 308 L696 307 L697 306 L697 305 L696 306 L695 305 L694 305 L693 305 L691 306 L690 305 L689 305 L688 306 L687 305 L686 306 L686 305 L685 304 L684 303 L685 303 L684 302 L683 301 L682 301 L681 301 L681 300 L681 299 L680 299 L679 298 L679 299 L678 299 L677 299 L676 299 L675 298 L674 298 L675 297 L676 297 L675 296 L676 295 L677 294 L678 292 L679 293 L679 292 L680 292 L681 292 L682 291 L683 291 L683 290 L684 289 L685 287 L686 287 L687 287 L689 286 L689 285 L690 285 L691 285 L692 284 L692 283 L693 283 L694 283 L695 282 L695 281 L694 281 L693 282 L692 282 L691 282 L690 283 L689 283 L688 284 L687 284 L686 284 L685 284 L685 285 L684 285 L683 286 L683 284 L683 283 L685 282 L685 280 L683 280 L683 281 L682 281 L682 280 L681 279 L680 279 L679 279 L679 280 L678 280 L678 281 L677 281 L676 282 L676 281 L676 280 L675 280 L674 280 L673 280 L672 280 L671 281 L671 280 L670 280 L669 280 L669 279 L668 279 L667 279 L667 278 L666 278 L665 278 L664 278 L663 278 L662 278 L662 277 L661 277 L660 277 L659 277 L658 277 L657 277 L657 278 L656 279 L656 280 L657 280 L656 280 L656 281 L656 282 L656 283 L656 284 L655 285 L656 285 L655 285 L655 286 L655 287 L655 288 L654 288 L654 289 L653 289 L653 290 L652 290 L651 290 L651 291 L650 291 L650 292 L649 291 L648 291 L648 292 L648 293 L647 293 L646 293 L645 293 L645 294 L644 294 L643 295 L642 294 L641 295 L639 294 L639 295 L637 295 L635 295 L634 295 L634 294 L633 295 L633 294 L631 294 L630 294 L630 295 L630 296 L630 297 L630 298 L629 297 L628 297 L626 298 L625 298 L624 299 L623 300 L622 300 L622 301 L621 301 L620 301 L619 302 L618 301 L618 302 L617 301 L617 302 L615 302 L613 303 L612 303 L611 304 L610 305 L610 304 L609 304 L608 305 L607 305 L605 305 L604 305 L603 305 L603 306 L603 308 L604 308 L605 309 L604 310 L604 311 L605 311 L606 311 L606 312 L607 312 L607 313 L606 313 L606 314 L607 314 L608 315 L608 316 L607 316 L606 317 L607 317 L608 317 L609 318 L610 319 L610 320 L611 321 L612 321 L613 321 L613 322 L613 323 L613 324 L613 325 L613 327 L614 328 L615 328 L615 329 L616 329 L616 330 L615 330 L616 330 L617 331 L617 332 L617 333 L617 332 L618 333 L619 334 L620 335 L621 335 L620 335 L621 336 L621 337 L622 337 L623 337 L624 337 L626 338 L627 338 L627 339 L628 339 L629 339 L629 340 L630 339 L630 340 L632 341 L631 340 L632 341 L634 342 L635 341 L636 341 L637 341 L638 341 L638 340 L639 341 L641 341 Z","cx":655.2,"cy":316.3},{"n":"湖北省","d":"M614 328 L613 328 L614 328 L613 327 L612 327 L612 328 L611 327 L610 328 L609 328 L608 329 L607 328 L607 329 L606 328 L606 327 L604 328 L603 328 L602 328 L601 328 L600 328 L599 327 L597 328 L597 327 L596 328 L595 327 L594 327 L592 327 L591 327 L591 326 L590 327 L589 327 L588 328 L588 329 L589 329 L590 329 L592 329 L593 330 L593 331 L593 332 L593 333 L594 333 L594 332 L595 332 L596 333 L597 333 L598 333 L598 334 L599 334 L599 335 L599 336 L600 337 L599 337 L598 337 L598 338 L597 338 L596 338 L595 337 L594 338 L593 337 L592 337 L591 337 L591 338 L590 339 L589 340 L589 341 L589 342 L589 343 L590 343 L590 344 L591 345 L590 346 L590 347 L591 348 L590 349 L591 350 L590 350 L590 351 L591 352 L592 351 L592 352 L593 353 L592 354 L594 354 L595 355 L596 355 L596 356 L597 355 L597 356 L598 356 L599 356 L599 358 L599 359 L600 360 L600 361 L599 361 L599 362 L599 363 L600 363 L599 364 L599 365 L598 366 L597 366 L597 365 L596 365 L595 365 L594 365 L593 366 L592 367 L591 367 L591 368 L590 368 L590 369 L589 369 L588 370 L587 370 L586 371 L586 370 L585 369 L585 370 L584 370 L583 371 L582 370 L582 369 L581 369 L580 369 L579 370 L578 371 L577 371 L576 370 L575 370 L575 371 L574 372 L573 371 L572 371 L571 371 L571 372 L571 373 L571 374 L572 373 L573 374 L573 375 L574 375 L573 377 L574 377 L573 378 L573 380 L573 381 L572 381 L571 382 L571 383 L572 383 L573 384 L573 383 L573 382 L574 381 L575 382 L575 383 L576 384 L577 385 L577 384 L577 385 L578 385 L579 385 L579 386 L579 387 L578 388 L579 388 L580 389 L579 390 L580 390 L581 390 L582 389 L582 390 L582 391 L583 391 L582 392 L583 393 L583 392 L584 393 L585 393 L585 392 L586 391 L586 389 L587 389 L587 388 L587 387 L588 387 L588 386 L589 386 L589 385 L590 386 L590 385 L591 385 L591 386 L592 385 L593 384 L593 383 L595 383 L596 383 L597 383 L599 383 L600 383 L601 384 L602 385 L603 385 L604 385 L604 384 L605 384 L606 384 L607 383 L606 382 L605 381 L605 380 L606 379 L605 379 L605 378 L606 378 L607 378 L608 379 L609 378 L609 377 L611 377 L612 377 L612 378 L613 378 L617 379 L618 380 L619 380 L619 381 L620 380 L621 381 L621 380 L622 381 L624 381 L625 381 L626 381 L627 382 L628 382 L628 383 L629 383 L630 383 L630 384 L631 385 L632 385 L633 385 L634 386 L634 387 L635 387 L636 386 L636 385 L637 385 L638 386 L638 385 L639 386 L640 386 L641 385 L642 384 L643 383 L644 383 L644 384 L645 384 L646 383 L645 384 L644 385 L644 386 L644 388 L646 387 L646 388 L647 388 L648 388 L649 387 L650 386 L651 384 L654 382 L654 383 L654 384 L655 385 L656 384 L656 385 L657 385 L657 386 L655 387 L656 387 L657 388 L657 389 L656 389 L656 390 L655 390 L655 391 L656 392 L656 393 L656 394 L657 394 L658 394 L659 394 L659 395 L660 395 L661 394 L661 393 L662 393 L662 392 L664 392 L665 392 L665 390 L666 389 L667 390 L668 390 L669 390 L670 390 L671 390 L671 389 L672 389 L673 389 L674 390 L674 389 L675 389 L676 389 L677 388 L676 388 L675 388 L676 387 L677 387 L677 386 L678 387 L679 386 L679 387 L680 387 L680 386 L679 386 L680 385 L679 385 L679 384 L680 385 L681 385 L682 385 L683 385 L684 384 L685 383 L685 382 L686 382 L687 382 L688 382 L689 382 L690 383 L691 383 L692 384 L693 384 L694 383 L695 383 L696 382 L696 381 L695 380 L695 379 L695 378 L695 377 L694 376 L695 376 L694 375 L693 375 L692 374 L692 373 L692 372 L692 371 L692 370 L691 370 L691 369 L690 368 L690 367 L691 367 L691 366 L691 365 L692 365 L693 364 L694 364 L695 364 L694 363 L693 362 L692 361 L691 361 L690 361 L689 360 L688 360 L687 360 L687 361 L686 360 L686 359 L685 359 L685 358 L684 358 L683 357 L684 357 L683 357 L682 357 L681 357 L681 356 L681 355 L681 354 L680 353 L679 353 L679 354 L679 355 L678 355 L677 355 L676 356 L675 355 L675 356 L674 355 L673 355 L672 354 L671 354 L670 354 L670 353 L671 352 L671 351 L670 351 L668 351 L667 351 L666 351 L665 350 L664 349 L663 349 L663 350 L662 351 L661 351 L661 350 L661 349 L660 349 L659 349 L659 348 L658 348 L657 347 L658 346 L657 346 L657 345 L658 344 L657 343 L658 342 L657 342 L658 341 L657 340 L656 340 L655 341 L653 342 L652 343 L651 342 L650 342 L651 342 L649 340 L648 340 L648 341 L647 341 L646 341 L646 340 L645 340 L645 341 L644 341 L643 341 L642 341 L641 341 L639 341 L638 340 L638 341 L637 341 L636 341 L635 341 L634 342 L632 341 L631 340 L632 341 L630 340 L630 339 L629 340 L629 339 L628 339 L627 339 L627 338 L626 338 L624 337 L623 337 L622 337 L621 337 L621 336 L620 335 L621 335 L620 335 L619 334 L618 333 L617 332 L617 333 L617 332 L617 331 L616 330 L615 330 L616 330 L616 329 L615 329 L615 328 L614 328 Z","cx":633.4,"cy":363.3},{"n":"湖南省","d":"M629 464 L630 464 L631 462 L631 463 L632 462 L632 461 L631 461 L631 460 L632 460 L631 459 L632 458 L632 457 L633 457 L634 457 L635 457 L636 458 L636 457 L638 458 L639 458 L640 458 L641 459 L641 460 L641 461 L642 461 L642 462 L643 462 L644 461 L645 461 L645 460 L645 459 L645 458 L645 457 L646 457 L645 456 L644 456 L643 456 L643 454 L644 455 L645 454 L646 454 L647 453 L648 452 L649 452 L650 452 L650 453 L651 453 L652 453 L652 454 L653 454 L654 454 L655 454 L655 455 L656 455 L656 454 L657 454 L657 455 L658 455 L659 454 L659 453 L660 453 L661 451 L661 450 L660 449 L660 448 L661 447 L661 446 L662 446 L662 444 L661 444 L662 443 L663 443 L663 442 L664 442 L665 441 L664 440 L663 441 L662 441 L661 441 L660 441 L661 440 L662 439 L662 438 L662 437 L663 437 L663 436 L662 436 L663 435 L662 434 L661 434 L660 434 L659 433 L659 431 L659 430 L660 429 L660 428 L659 427 L658 427 L658 426 L658 425 L659 424 L659 423 L659 422 L659 421 L657 422 L656 422 L655 422 L655 421 L655 420 L655 419 L655 418 L656 417 L656 416 L657 415 L657 414 L657 413 L658 412 L659 412 L659 411 L660 412 L660 411 L661 411 L662 411 L662 410 L661 409 L662 409 L663 409 L663 408 L664 408 L664 407 L665 406 L665 405 L664 405 L665 404 L664 403 L663 403 L663 402 L663 401 L664 399 L664 398 L663 398 L662 397 L661 397 L661 396 L661 395 L660 395 L659 395 L659 394 L658 394 L657 394 L656 394 L656 393 L656 392 L655 391 L655 390 L656 390 L656 389 L657 389 L657 388 L656 387 L655 387 L657 386 L657 385 L656 385 L656 384 L655 385 L654 384 L654 383 L654 382 L651 384 L650 386 L649 387 L648 388 L647 388 L646 388 L646 387 L644 388 L644 386 L644 385 L645 384 L646 383 L645 384 L644 384 L644 383 L643 383 L642 384 L641 385 L640 386 L639 386 L638 385 L638 386 L637 385 L636 385 L636 386 L635 387 L634 387 L634 386 L633 385 L632 385 L631 385 L630 384 L630 383 L629 383 L628 383 L628 382 L627 382 L626 381 L625 381 L624 381 L622 381 L621 380 L621 381 L620 380 L619 381 L619 380 L618 380 L617 379 L613 378 L612 378 L612 377 L611 377 L609 377 L609 378 L608 379 L607 378 L606 378 L605 378 L605 379 L606 379 L605 380 L605 381 L606 382 L607 383 L606 384 L605 384 L604 384 L604 385 L603 385 L602 385 L601 384 L600 383 L599 383 L597 383 L596 383 L595 383 L593 383 L593 384 L592 385 L591 386 L591 385 L590 385 L590 386 L589 385 L589 386 L588 386 L588 387 L587 387 L587 388 L587 389 L586 389 L586 391 L585 392 L585 393 L584 393 L585 394 L586 394 L586 395 L585 395 L585 396 L584 397 L585 399 L585 400 L585 401 L584 401 L584 402 L585 402 L586 401 L586 402 L585 403 L585 404 L585 405 L585 406 L586 407 L587 407 L586 408 L586 409 L586 410 L585 411 L586 410 L587 411 L586 411 L586 412 L586 414 L586 415 L587 416 L588 417 L588 418 L587 419 L586 420 L585 421 L584 420 L583 421 L583 420 L583 421 L582 422 L581 422 L582 423 L580 423 L580 424 L579 424 L579 425 L579 426 L577 426 L579 427 L580 427 L581 426 L583 426 L582 427 L583 427 L584 426 L585 425 L585 426 L586 425 L587 425 L588 426 L588 425 L588 427 L589 426 L589 427 L590 429 L588 429 L588 430 L588 429 L589 430 L589 431 L589 432 L590 432 L589 432 L588 432 L587 432 L586 433 L585 433 L586 433 L587 434 L587 435 L587 436 L586 436 L587 436 L586 437 L585 438 L585 439 L586 439 L586 440 L587 439 L588 439 L588 440 L588 441 L589 442 L588 442 L588 443 L589 444 L590 443 L591 443 L591 444 L592 444 L592 445 L592 444 L592 445 L592 446 L593 446 L594 446 L594 445 L594 444 L593 444 L594 443 L595 443 L595 442 L596 441 L597 441 L598 441 L598 442 L598 443 L599 443 L600 443 L601 444 L602 444 L603 442 L604 441 L605 441 L606 440 L606 439 L607 438 L607 439 L608 439 L609 439 L609 440 L610 440 L612 439 L612 438 L613 438 L614 439 L616 439 L617 440 L617 439 L618 440 L617 440 L617 441 L617 442 L617 443 L616 445 L617 445 L617 446 L618 446 L618 445 L619 445 L619 446 L620 446 L621 446 L620 446 L620 447 L619 448 L618 448 L618 450 L618 451 L618 452 L617 453 L616 454 L615 455 L615 456 L613 457 L613 458 L612 459 L612 460 L613 461 L615 461 L615 459 L616 459 L616 458 L617 457 L618 458 L619 458 L620 458 L620 459 L620 460 L620 461 L620 462 L621 463 L620 464 L620 465 L621 465 L621 466 L622 466 L622 465 L623 465 L624 464 L624 463 L626 463 L626 464 L627 464 L628 464 L629 464 Z","cx":624.4,"cy":417.5},{"n":"广东省","d":"M654 505 L655 505 L655 503 L656 502 L656 501 L655 501 L655 502 L654 502 L655 501 L656 501 L656 500 L657 500 L657 498 L656 497 L657 496 L657 497 L658 498 L658 499 L659 500 L659 501 L660 501 L661 500 L662 500 L663 500 L664 500 L664 499 L665 499 L665 500 L666 499 L667 499 L668 499 L669 500 L669 501 L670 501 L671 501 L671 500 L670 499 L671 498 L670 498 L670 497 L671 497 L672 496 L673 496 L673 497 L673 498 L673 499 L675 499 L676 500 L676 499 L676 498 L677 498 L678 497 L678 496 L679 496 L680 495 L680 496 L680 495 L681 495 L681 496 L683 496 L683 497 L684 497 L685 497 L687 498 L687 497 L687 496 L686 496 L687 496 L687 495 L688 494 L689 495 L690 495 L690 496 L691 496 L692 496 L692 495 L693 495 L694 495 L695 495 L696 495 L697 493 L698 493 L700 494 L701 493 L702 493 L702 492 L703 492 L703 491 L702 490 L703 490 L704 490 L705 489 L706 489 L707 489 L707 488 L706 488 L706 487 L708 485 L708 484 L709 484 L710 484 L710 483 L711 484 L713 483 L713 482 L712 482 L711 481 L710 480 L710 479 L710 478 L709 478 L709 477 L709 476 L709 475 L709 474 L710 473 L709 473 L709 472 L708 471 L708 470 L707 469 L707 468 L706 468 L706 467 L707 465 L706 465 L704 465 L704 466 L703 466 L702 466 L701 464 L701 465 L700 464 L700 463 L700 462 L699 462 L699 463 L698 463 L697 463 L698 463 L697 463 L697 462 L696 462 L695 462 L694 461 L693 462 L692 461 L692 462 L691 462 L691 461 L690 462 L690 463 L690 464 L690 465 L690 466 L691 467 L690 467 L689 467 L688 466 L687 466 L686 465 L685 464 L684 463 L683 464 L682 464 L680 465 L679 465 L678 465 L677 465 L676 466 L676 465 L676 467 L675 467 L675 466 L675 467 L674 466 L673 466 L673 467 L673 468 L672 467 L671 467 L670 467 L668 468 L668 467 L667 467 L666 467 L666 466 L665 466 L664 465 L666 465 L666 464 L667 464 L667 463 L667 462 L668 462 L668 461 L669 460 L670 460 L670 459 L671 459 L672 459 L672 458 L673 458 L673 457 L672 457 L672 456 L673 456 L673 455 L672 455 L671 454 L670 453 L669 454 L668 454 L667 455 L666 454 L666 455 L665 455 L664 455 L663 455 L662 455 L662 456 L662 455 L662 454 L661 453 L660 453 L659 453 L659 454 L658 455 L657 455 L657 454 L656 454 L656 455 L655 455 L655 454 L654 454 L653 454 L652 454 L652 453 L651 453 L650 453 L650 452 L649 452 L648 452 L647 453 L646 454 L645 454 L644 455 L643 454 L643 456 L644 456 L645 456 L646 457 L645 457 L645 458 L645 459 L645 460 L645 461 L644 461 L643 462 L642 462 L642 461 L641 461 L641 460 L641 459 L640 458 L639 458 L638 458 L636 457 L636 458 L635 457 L634 457 L633 457 L632 457 L632 458 L631 459 L632 460 L631 460 L631 461 L632 461 L632 462 L631 463 L631 462 L630 464 L629 464 L628 464 L628 465 L628 466 L629 467 L629 468 L629 469 L630 470 L630 471 L629 471 L629 472 L628 472 L627 472 L627 473 L627 474 L628 476 L628 477 L627 477 L627 478 L626 478 L626 479 L625 479 L624 479 L623 479 L623 480 L624 481 L623 482 L622 482 L621 482 L621 484 L620 485 L619 485 L619 486 L619 487 L619 488 L619 489 L619 490 L619 491 L620 491 L620 492 L619 492 L619 493 L619 494 L616 496 L615 496 L614 497 L614 498 L613 498 L612 498 L611 498 L611 499 L610 499 L609 499 L609 500 L609 501 L608 501 L608 502 L609 503 L609 504 L608 504 L607 505 L608 506 L607 506 L606 506 L606 505 L605 506 L604 505 L603 505 L603 506 L602 505 L602 506 L603 506 L602 507 L603 508 L602 509 L603 509 L603 510 L602 510 L601 510 L600 510 L599 510 L598 510 L598 511 L597 510 L596 511 L596 512 L595 514 L594 514 L593 514 L593 515 L593 516 L593 517 L594 517 L595 517 L595 518 L595 519 L593 519 L593 521 L592 522 L592 523 L591 526 L591 527 L592 528 L592 529 L593 531 L594 531 L594 532 L594 533 L595 533 L595 534 L595 535 L595 536 L595 537 L596 537 L597 537 L598 536 L599 537 L600 537 L602 537 L602 536 L603 536 L604 536 L605 535 L606 534 L606 533 L605 531 L605 530 L604 530 L603 530 L603 529 L603 527 L602 527 L601 527 L600 527 L600 526 L600 525 L600 524 L601 524 L602 523 L603 522 L604 521 L605 521 L607 521 L608 519 L609 519 L610 518 L611 519 L612 518 L613 517 L615 517 L616 517 L617 517 L617 518 L618 518 L619 517 L619 516 L620 516 L621 516 L622 516 L623 516 L624 516 L624 515 L625 515 L626 515 L626 516 L627 515 L628 515 L629 515 L629 514 L628 514 L628 513 L630 512 L631 512 L632 512 L632 513 L633 513 L635 513 L636 513 L636 512 L637 512 L638 512 L639 512 L640 511 L642 510 L643 510 L643 511 L644 511 L645 510 L646 509 L646 508 L646 507 L647 506 L647 507 L647 508 L648 509 L649 510 L650 510 L650 509 L652 508 L653 508 L654 507 L654 506 L654 505 Z","cx":652.1,"cy":486.8},{"n":"广西壮族自治区","d":"M588 443 L588 444 L587 444 L588 445 L587 445 L586 446 L586 448 L585 448 L584 448 L584 447 L583 448 L583 447 L582 447 L581 447 L580 447 L581 448 L580 448 L579 448 L579 449 L580 449 L581 448 L582 448 L582 449 L581 450 L581 451 L582 451 L581 452 L580 451 L579 451 L578 451 L577 451 L577 450 L576 450 L575 450 L575 451 L576 451 L575 452 L574 452 L574 453 L575 455 L574 455 L574 454 L572 453 L571 453 L571 452 L570 452 L570 451 L569 451 L569 452 L568 452 L569 453 L568 453 L567 453 L568 453 L567 454 L567 455 L567 456 L566 457 L565 457 L563 457 L562 458 L561 458 L561 457 L561 456 L560 456 L560 457 L560 456 L559 456 L559 455 L558 456 L557 457 L556 456 L556 455 L555 455 L555 454 L554 453 L554 454 L554 453 L553 453 L554 452 L553 451 L552 451 L552 450 L551 451 L549 451 L549 452 L548 453 L548 454 L549 454 L549 455 L548 456 L547 456 L547 457 L546 457 L545 457 L544 457 L543 457 L543 458 L542 459 L541 459 L540 459 L539 460 L538 460 L537 460 L536 460 L535 461 L535 462 L536 462 L535 464 L534 465 L533 465 L533 466 L532 465 L531 464 L530 464 L529 465 L529 464 L528 464 L526 463 L525 463 L524 463 L524 462 L523 461 L522 461 L520 461 L520 460 L519 460 L519 461 L518 461 L517 461 L517 462 L517 463 L515 464 L514 464 L514 465 L512 465 L512 466 L511 466 L510 465 L509 464 L508 466 L508 467 L509 468 L509 469 L510 469 L510 470 L511 471 L512 471 L511 469 L512 469 L513 469 L515 469 L516 469 L517 469 L518 469 L518 470 L519 470 L519 471 L520 473 L519 473 L519 474 L520 475 L521 475 L521 474 L522 475 L523 475 L524 476 L525 474 L526 474 L527 476 L527 475 L528 475 L529 475 L529 476 L530 476 L530 475 L531 475 L531 474 L532 474 L533 475 L534 476 L534 477 L535 478 L535 479 L534 479 L535 481 L534 482 L535 483 L534 484 L533 484 L532 485 L532 484 L531 484 L530 484 L529 484 L529 485 L528 485 L527 486 L526 486 L527 486 L527 487 L526 487 L525 488 L525 489 L525 491 L526 491 L527 491 L528 491 L528 492 L529 492 L530 492 L530 494 L531 493 L532 493 L533 492 L534 492 L534 493 L535 492 L536 493 L537 494 L536 494 L537 494 L538 495 L538 494 L539 494 L540 494 L541 493 L542 493 L542 494 L543 494 L544 494 L545 495 L546 495 L545 496 L545 497 L544 497 L544 499 L543 499 L542 499 L542 500 L542 501 L541 501 L542 502 L541 503 L543 503 L543 504 L544 505 L543 505 L544 506 L543 506 L544 507 L544 508 L543 508 L544 509 L544 508 L545 508 L545 509 L546 509 L547 509 L548 510 L548 509 L549 510 L549 511 L550 512 L551 512 L552 513 L553 513 L554 514 L554 515 L555 515 L555 514 L556 514 L556 515 L557 515 L558 515 L560 515 L561 514 L562 514 L563 514 L563 515 L564 516 L565 516 L566 516 L568 516 L567 516 L568 515 L569 515 L568 516 L568 517 L570 516 L571 516 L572 516 L574 514 L575 514 L576 514 L577 515 L577 514 L578 515 L579 514 L580 515 L582 515 L583 515 L583 516 L582 517 L581 517 L581 518 L582 518 L583 518 L584 518 L585 518 L587 517 L588 517 L589 517 L590 517 L590 516 L591 515 L591 517 L592 517 L593 517 L593 516 L593 515 L593 514 L594 514 L595 514 L596 512 L596 511 L597 510 L598 511 L598 510 L599 510 L600 510 L601 510 L602 510 L603 510 L603 509 L602 509 L603 508 L602 507 L603 506 L602 506 L602 505 L603 506 L603 505 L604 505 L605 506 L606 505 L606 506 L607 506 L608 506 L607 505 L608 504 L609 504 L609 503 L608 502 L608 501 L609 501 L609 500 L609 499 L610 499 L611 499 L611 498 L612 498 L613 498 L614 498 L614 497 L615 496 L616 496 L619 494 L619 493 L619 492 L620 492 L620 491 L619 491 L619 490 L619 489 L619 488 L619 487 L619 486 L619 485 L620 485 L621 484 L621 482 L622 482 L623 482 L624 481 L623 480 L623 479 L624 479 L625 479 L626 479 L626 478 L627 478 L627 477 L628 477 L628 476 L627 474 L627 473 L627 472 L628 472 L629 472 L629 471 L630 471 L630 470 L629 469 L629 468 L629 467 L628 466 L628 465 L628 464 L629 464 L628 464 L627 464 L626 464 L626 463 L624 463 L624 464 L623 465 L622 465 L622 466 L621 466 L621 465 L620 465 L620 464 L621 463 L620 462 L620 461 L620 460 L620 459 L620 458 L619 458 L618 458 L617 457 L616 458 L616 459 L615 459 L615 461 L613 461 L612 460 L612 459 L613 458 L613 457 L615 456 L615 455 L616 454 L617 453 L618 452 L618 451 L618 450 L618 448 L619 448 L620 447 L620 446 L621 446 L620 446 L619 446 L619 445 L618 445 L618 446 L617 446 L617 445 L616 445 L617 443 L617 442 L617 441 L617 440 L618 440 L617 439 L617 440 L616 439 L614 439 L613 438 L612 438 L612 439 L610 440 L609 440 L609 439 L608 439 L607 439 L607 438 L606 439 L606 440 L605 441 L604 441 L603 442 L602 444 L601 444 L600 443 L599 443 L598 443 L598 442 L598 441 L597 441 L596 441 L595 442 L595 443 L594 443 L593 444 L594 444 L594 445 L594 446 L593 446 L592 446 L592 445 L592 444 L592 445 L592 444 L591 444 L591 443 L590 443 L589 444 L588 443 Z","cx":577.3,"cy":478.8},{"n":"海南省","d":"M598 540 L597 541 L596 541 L595 541 L594 541 L593 541 L592 540 L591 540 L590 541 L589 542 L589 543 L587 542 L586 542 L585 542 L585 543 L584 543 L583 544 L583 545 L582 546 L581 547 L579 548 L578 549 L577 550 L576 551 L575 551 L574 552 L574 554 L574 556 L575 557 L575 558 L574 559 L574 560 L575 561 L575 562 L575 564 L575 565 L576 566 L577 566 L579 566 L579 567 L580 568 L581 568 L582 568 L583 569 L585 569 L586 569 L588 570 L589 570 L590 571 L591 570 L592 570 L593 570 L593 567 L595 567 L597 567 L598 567 L598 566 L599 565 L600 564 L601 563 L602 563 L603 563 L605 562 L605 561 L606 560 L606 559 L607 554 L608 552 L609 551 L609 550 L610 549 L611 548 L612 548 L613 547 L614 547 L614 544 L613 543 L612 540 L611 540 L610 540 L609 540 L609 539 L608 538 L607 538 L606 539 L605 539 L603 539 L602 539 L601 540 L601 539 L599 539 L598 540 Z","cx":592.8,"cy":553.7},{"n":"重庆市","d":"M538 403 L539 402 L540 403 L540 402 L540 401 L541 401 L540 400 L540 399 L540 398 L541 399 L541 400 L542 400 L542 401 L543 401 L542 401 L543 401 L542 402 L542 403 L541 403 L541 404 L542 403 L544 404 L544 403 L545 402 L544 402 L545 401 L545 402 L546 401 L547 400 L546 400 L546 399 L547 398 L548 399 L548 398 L549 398 L549 397 L551 397 L552 398 L552 399 L553 399 L554 398 L555 398 L555 397 L556 396 L555 396 L555 395 L554 395 L555 395 L554 394 L555 394 L555 393 L555 392 L556 392 L556 393 L558 392 L558 393 L559 393 L560 393 L560 392 L561 393 L561 395 L562 395 L561 396 L562 396 L563 395 L565 395 L566 394 L567 395 L568 394 L569 395 L569 394 L569 395 L570 396 L570 397 L570 398 L571 399 L570 400 L570 401 L572 401 L573 401 L574 401 L575 401 L574 402 L574 403 L574 404 L574 405 L574 406 L575 406 L576 405 L575 404 L576 404 L576 403 L577 404 L577 405 L577 407 L576 407 L576 408 L577 408 L578 408 L579 408 L580 408 L581 409 L581 408 L582 409 L582 408 L583 407 L583 406 L583 405 L584 404 L585 404 L585 403 L586 402 L586 401 L585 402 L584 402 L584 401 L585 401 L585 400 L585 399 L584 397 L585 396 L585 395 L586 395 L586 394 L585 394 L584 393 L583 392 L583 393 L582 392 L583 391 L582 391 L582 390 L582 389 L581 390 L580 390 L579 390 L580 389 L579 388 L578 388 L579 387 L579 386 L579 385 L578 385 L577 385 L577 384 L577 385 L576 384 L575 383 L575 382 L574 381 L573 382 L573 383 L573 384 L572 383 L571 383 L571 382 L572 381 L573 381 L573 380 L573 378 L574 377 L573 377 L574 375 L573 375 L573 374 L572 373 L571 374 L571 373 L571 372 L571 371 L572 371 L573 371 L574 372 L575 371 L575 370 L576 370 L577 371 L578 371 L579 370 L580 369 L581 369 L582 369 L582 370 L583 371 L584 370 L585 370 L585 369 L586 370 L586 371 L587 370 L588 370 L589 369 L590 369 L590 368 L591 368 L591 367 L592 367 L593 366 L594 365 L595 365 L596 365 L597 365 L597 366 L598 366 L599 365 L599 364 L600 363 L599 363 L599 362 L599 361 L600 361 L600 360 L599 359 L599 358 L599 356 L598 356 L597 356 L597 355 L596 356 L596 355 L595 355 L594 354 L592 354 L593 353 L592 352 L592 351 L591 352 L590 351 L589 352 L588 351 L587 352 L585 352 L585 351 L585 350 L584 350 L584 349 L583 349 L582 348 L580 347 L579 347 L578 346 L577 346 L576 345 L575 345 L574 344 L573 344 L572 344 L571 344 L570 344 L571 344 L571 345 L572 346 L571 346 L570 346 L570 347 L569 347 L570 349 L571 349 L571 350 L572 350 L572 351 L573 351 L573 352 L572 353 L571 354 L570 354 L570 355 L569 355 L568 355 L568 356 L567 357 L568 358 L566 359 L565 359 L565 360 L566 359 L566 360 L565 361 L565 362 L565 363 L564 363 L564 364 L564 365 L562 366 L561 366 L561 365 L560 365 L559 366 L558 366 L557 365 L556 366 L556 367 L555 367 L556 368 L556 369 L557 369 L556 370 L555 370 L556 371 L555 371 L554 372 L554 373 L553 374 L553 375 L552 376 L550 378 L549 379 L548 378 L547 379 L546 379 L546 378 L546 379 L545 379 L544 379 L544 378 L544 377 L543 377 L542 376 L542 375 L543 375 L542 375 L541 374 L540 374 L539 374 L539 375 L538 375 L538 376 L537 375 L537 376 L536 376 L535 375 L535 374 L534 374 L533 374 L533 373 L531 373 L530 373 L529 372 L528 373 L528 374 L528 375 L527 375 L526 375 L527 376 L526 376 L525 376 L525 377 L526 377 L525 377 L526 377 L526 378 L527 378 L527 379 L528 379 L528 380 L527 380 L528 381 L528 382 L526 382 L525 383 L525 384 L524 384 L523 384 L522 385 L521 386 L521 387 L522 388 L523 388 L522 389 L523 389 L523 390 L524 390 L524 391 L525 391 L526 391 L527 391 L528 392 L527 393 L528 393 L528 394 L528 395 L528 396 L529 396 L530 396 L530 397 L531 397 L532 396 L533 396 L533 397 L534 397 L535 397 L536 397 L537 398 L536 398 L537 399 L537 400 L537 401 L538 402 L538 403 Z","cx":562.6,"cy":378.2},{"n":"四川省","d":"M454 424 L454 425 L454 426 L454 427 L455 428 L456 428 L456 429 L457 429 L458 430 L457 431 L458 432 L459 432 L459 431 L460 431 L459 433 L459 434 L458 434 L458 435 L459 436 L460 436 L461 436 L462 438 L462 439 L461 439 L462 440 L463 440 L464 440 L464 441 L465 441 L464 442 L465 442 L465 443 L466 442 L467 442 L468 442 L469 443 L470 442 L471 441 L472 441 L472 440 L473 440 L474 439 L475 439 L476 438 L477 438 L478 438 L478 439 L477 440 L478 440 L479 440 L480 439 L481 439 L482 438 L483 438 L484 438 L484 437 L484 436 L485 435 L484 435 L484 433 L484 432 L484 431 L483 430 L482 429 L482 428 L482 427 L482 425 L482 424 L482 423 L483 421 L484 422 L485 421 L486 421 L486 420 L487 419 L488 418 L488 419 L489 417 L490 417 L490 416 L491 415 L492 415 L492 414 L492 413 L493 412 L492 412 L492 411 L491 411 L491 410 L492 409 L493 408 L494 407 L495 408 L496 408 L497 407 L498 406 L498 405 L497 404 L496 403 L497 402 L498 401 L498 402 L499 401 L499 402 L501 401 L502 402 L502 401 L503 401 L504 401 L505 402 L506 401 L507 401 L507 402 L506 402 L506 403 L505 403 L504 403 L504 405 L505 406 L505 407 L506 406 L506 407 L507 407 L507 408 L506 408 L507 409 L507 410 L506 410 L506 411 L505 411 L506 411 L506 412 L507 413 L508 413 L509 414 L510 414 L511 413 L512 413 L513 413 L514 413 L515 413 L515 412 L516 411 L516 410 L517 410 L518 410 L519 410 L519 411 L519 412 L520 412 L520 411 L520 412 L521 413 L520 413 L520 414 L521 415 L521 416 L522 416 L523 415 L524 415 L525 416 L526 416 L526 417 L527 417 L528 417 L528 416 L529 416 L530 416 L531 416 L532 416 L533 416 L533 415 L534 415 L535 415 L536 415 L537 415 L538 414 L538 413 L537 413 L538 412 L537 411 L536 411 L537 410 L536 409 L535 409 L534 409 L532 410 L531 409 L531 410 L530 409 L530 408 L530 407 L529 407 L529 406 L528 407 L527 407 L526 406 L527 406 L527 405 L526 404 L526 403 L527 403 L527 402 L528 402 L529 402 L530 402 L530 401 L531 400 L532 399 L532 400 L533 400 L534 401 L535 401 L535 402 L536 403 L537 403 L538 404 L538 403 L538 402 L537 401 L537 400 L537 399 L536 398 L537 398 L536 397 L535 397 L534 397 L533 397 L533 396 L532 396 L531 397 L530 397 L530 396 L529 396 L528 396 L528 395 L528 394 L528 393 L527 393 L528 392 L527 391 L526 391 L525 391 L524 391 L524 390 L523 390 L523 389 L522 389 L523 388 L522 388 L521 387 L521 386 L522 385 L523 384 L524 384 L525 384 L525 383 L526 382 L528 382 L528 381 L527 380 L528 380 L528 379 L527 379 L527 378 L526 378 L526 377 L525 377 L526 377 L525 377 L525 376 L526 376 L527 376 L526 375 L527 375 L528 375 L528 374 L528 373 L529 372 L530 373 L531 373 L533 373 L533 374 L534 374 L535 374 L535 375 L536 376 L537 376 L537 375 L538 376 L538 375 L539 375 L539 374 L540 374 L541 374 L542 375 L543 375 L542 375 L542 376 L543 377 L544 377 L544 378 L544 379 L545 379 L546 379 L546 378 L546 379 L547 379 L548 378 L549 379 L550 378 L552 376 L553 375 L553 374 L554 373 L554 372 L555 371 L556 371 L555 370 L556 370 L557 369 L556 369 L556 368 L555 367 L556 367 L556 366 L557 365 L558 366 L559 366 L560 365 L561 365 L561 366 L562 366 L564 365 L564 364 L564 363 L565 363 L565 362 L565 361 L566 360 L566 359 L565 360 L565 359 L566 359 L568 358 L567 357 L568 356 L568 355 L569 355 L570 355 L570 354 L571 354 L572 353 L573 352 L573 351 L572 351 L572 350 L571 350 L571 349 L570 349 L569 347 L570 347 L570 346 L571 346 L572 346 L571 345 L571 344 L570 344 L571 344 L572 344 L573 344 L573 343 L572 343 L571 343 L570 343 L568 343 L567 343 L566 343 L565 344 L564 345 L563 344 L562 344 L561 343 L561 342 L560 342 L559 341 L559 340 L558 340 L557 341 L556 340 L555 339 L555 338 L554 339 L553 339 L553 340 L552 340 L551 339 L550 339 L550 338 L550 337 L550 336 L549 336 L549 335 L547 336 L547 335 L546 335 L546 336 L545 335 L544 335 L543 336 L542 336 L541 336 L540 336 L539 337 L538 336 L537 336 L536 336 L535 336 L534 335 L533 335 L534 334 L533 334 L533 333 L532 334 L532 333 L531 334 L531 333 L530 334 L529 334 L529 335 L528 335 L527 335 L526 336 L526 335 L525 335 L525 334 L525 333 L524 333 L524 332 L523 332 L523 333 L522 333 L523 333 L523 334 L523 335 L522 335 L522 336 L521 336 L520 336 L520 337 L519 337 L518 337 L517 337 L517 336 L515 337 L514 337 L514 336 L513 336 L513 337 L512 337 L511 336 L510 336 L509 335 L508 335 L507 335 L506 334 L505 333 L504 332 L505 332 L506 332 L506 331 L507 331 L506 330 L505 330 L506 329 L506 328 L505 327 L505 326 L506 326 L507 326 L506 325 L505 325 L504 325 L504 324 L503 324 L503 323 L503 322 L503 321 L502 320 L501 320 L500 320 L498 320 L496 320 L495 320 L494 319 L493 319 L493 320 L492 320 L493 319 L492 318 L491 318 L491 319 L490 319 L488 318 L487 318 L486 318 L487 316 L486 316 L486 315 L486 314 L487 313 L486 313 L486 312 L485 312 L484 312 L483 311 L484 311 L483 310 L482 310 L481 310 L480 311 L479 311 L478 312 L477 312 L478 313 L476 313 L475 314 L475 313 L474 314 L474 315 L473 315 L472 315 L471 315 L470 315 L472 317 L472 318 L473 318 L473 319 L472 319 L473 319 L473 320 L473 321 L475 322 L475 323 L475 324 L475 323 L474 324 L473 324 L472 324 L471 325 L471 327 L470 327 L470 326 L469 327 L469 328 L468 328 L467 328 L466 328 L466 329 L465 329 L465 328 L465 327 L464 327 L464 326 L466 326 L466 325 L466 324 L467 324 L466 323 L466 322 L466 321 L465 321 L465 322 L464 322 L464 323 L463 324 L462 325 L462 326 L463 326 L463 327 L462 328 L462 329 L461 328 L460 328 L459 327 L458 327 L458 328 L456 327 L455 327 L455 326 L454 327 L453 328 L454 329 L454 330 L455 330 L454 331 L455 331 L454 331 L454 332 L454 333 L455 333 L455 334 L455 335 L454 336 L453 336 L452 336 L452 337 L451 337 L450 337 L449 336 L448 337 L447 336 L447 337 L446 337 L446 338 L445 338 L444 338 L444 337 L443 336 L442 335 L442 336 L442 335 L441 335 L440 335 L439 336 L439 337 L437 337 L437 336 L438 335 L437 334 L437 333 L436 333 L436 332 L435 332 L435 331 L434 330 L434 331 L433 332 L432 332 L432 333 L432 334 L432 335 L431 335 L430 334 L429 334 L428 333 L427 333 L425 332 L425 333 L424 333 L423 332 L423 331 L423 330 L421 330 L420 329 L420 330 L419 329 L418 329 L417 328 L416 327 L416 326 L415 326 L416 325 L415 324 L415 323 L414 322 L414 321 L413 321 L414 320 L413 320 L413 319 L412 319 L412 318 L411 318 L411 317 L410 317 L410 316 L410 315 L410 314 L410 313 L409 313 L407 313 L406 313 L405 313 L404 313 L402 312 L402 311 L400 311 L400 312 L399 312 L398 313 L398 314 L398 315 L397 316 L396 316 L395 316 L395 317 L393 316 L394 317 L393 317 L393 318 L394 318 L394 319 L394 320 L394 321 L396 322 L395 322 L396 323 L397 323 L398 324 L399 324 L398 325 L397 325 L397 327 L396 328 L395 328 L395 329 L396 330 L395 331 L396 331 L394 331 L393 332 L393 333 L393 334 L394 335 L394 336 L395 336 L396 337 L397 337 L397 338 L398 338 L399 338 L400 339 L401 339 L402 339 L405 340 L405 341 L405 340 L407 341 L407 342 L407 343 L407 344 L408 345 L409 346 L410 346 L410 347 L410 348 L410 349 L410 350 L411 350 L411 351 L412 352 L413 354 L414 354 L415 355 L417 356 L418 357 L416 358 L416 359 L414 358 L413 358 L413 359 L413 360 L414 361 L415 361 L415 362 L416 363 L416 364 L416 365 L417 366 L418 367 L419 367 L418 368 L418 369 L418 370 L418 371 L419 372 L419 374 L419 375 L419 376 L419 377 L420 378 L420 380 L420 382 L420 383 L419 384 L420 386 L420 387 L420 389 L421 390 L421 391 L421 392 L421 393 L421 394 L421 396 L421 397 L421 398 L421 399 L422 400 L421 400 L422 401 L422 402 L422 404 L422 405 L423 406 L424 407 L424 408 L425 409 L426 407 L426 406 L426 405 L426 404 L426 403 L427 403 L427 402 L428 401 L428 400 L429 400 L429 399 L429 398 L430 398 L431 398 L431 399 L432 400 L433 401 L433 402 L434 402 L435 403 L435 404 L437 405 L436 406 L438 406 L438 407 L439 407 L438 408 L437 408 L437 409 L436 408 L436 409 L436 410 L437 411 L439 413 L438 413 L439 414 L440 414 L440 415 L441 416 L441 415 L442 414 L443 414 L444 414 L444 415 L445 414 L446 413 L447 414 L447 415 L448 415 L448 416 L449 417 L449 418 L450 419 L450 420 L451 420 L451 421 L452 422 L452 423 L452 424 L453 425 L454 424 Z","cx":478.9,"cy":368.4},{"n":"贵州省","d":"M585 404 L584 404 L583 405 L583 406 L583 407 L582 408 L582 409 L581 408 L581 409 L580 408 L579 408 L578 408 L577 408 L576 408 L576 407 L577 407 L577 405 L577 404 L576 403 L576 404 L575 404 L576 405 L575 406 L574 406 L574 405 L574 404 L574 403 L574 402 L575 401 L574 401 L573 401 L572 401 L570 401 L570 400 L571 399 L570 398 L570 397 L570 396 L569 395 L569 394 L569 395 L568 394 L567 395 L566 394 L565 395 L563 395 L562 396 L561 396 L562 395 L561 395 L561 393 L560 392 L560 393 L559 393 L558 393 L558 392 L556 393 L556 392 L555 392 L555 393 L555 394 L554 394 L555 395 L554 395 L555 395 L555 396 L556 396 L555 397 L555 398 L554 398 L553 399 L552 399 L552 398 L551 397 L549 397 L549 398 L548 398 L548 399 L547 398 L546 399 L546 400 L547 400 L546 401 L545 402 L545 401 L544 402 L545 402 L544 403 L544 404 L542 403 L541 404 L541 403 L542 403 L542 402 L543 401 L542 401 L543 401 L542 401 L542 400 L541 400 L541 399 L540 398 L540 399 L540 400 L541 401 L540 401 L540 402 L540 403 L539 402 L538 403 L538 404 L537 403 L536 403 L535 402 L535 401 L534 401 L533 400 L532 400 L532 399 L531 400 L530 401 L530 402 L529 402 L528 402 L527 402 L527 403 L526 403 L526 404 L527 405 L527 406 L526 406 L527 407 L528 407 L529 406 L529 407 L530 407 L530 408 L530 409 L531 410 L531 409 L532 410 L534 409 L535 409 L536 409 L537 410 L536 411 L537 411 L538 412 L537 413 L538 413 L538 414 L537 415 L536 415 L535 415 L534 415 L533 415 L533 416 L532 416 L531 416 L530 416 L529 416 L528 416 L528 417 L527 417 L526 417 L526 416 L525 416 L524 415 L523 415 L522 416 L521 416 L521 417 L521 418 L520 418 L520 419 L520 420 L520 421 L519 422 L519 421 L518 421 L517 421 L516 422 L515 422 L514 423 L514 422 L513 422 L512 423 L512 422 L510 423 L509 422 L508 421 L506 420 L505 421 L505 422 L504 422 L504 423 L503 423 L502 422 L501 422 L500 421 L499 421 L499 420 L498 421 L498 422 L498 423 L497 423 L497 424 L496 424 L495 426 L494 426 L495 427 L494 426 L494 427 L494 428 L495 427 L496 427 L496 428 L496 429 L496 430 L495 431 L496 432 L496 433 L496 434 L497 435 L498 436 L499 435 L500 436 L501 435 L502 433 L503 433 L504 434 L505 434 L506 434 L506 433 L507 432 L508 433 L507 434 L508 434 L509 434 L509 435 L510 435 L510 436 L510 437 L511 437 L511 438 L510 439 L509 440 L508 441 L509 442 L508 443 L507 442 L508 444 L507 445 L507 446 L506 448 L505 448 L505 449 L505 450 L506 450 L507 451 L507 452 L508 452 L508 451 L509 451 L509 453 L510 454 L510 455 L511 455 L512 456 L513 456 L513 457 L512 456 L512 457 L511 458 L511 459 L510 459 L511 459 L512 460 L511 461 L510 461 L509 462 L509 463 L509 464 L510 465 L511 466 L512 466 L512 465 L514 465 L514 464 L515 464 L517 463 L517 462 L517 461 L518 461 L519 461 L519 460 L520 460 L520 461 L522 461 L523 461 L524 462 L524 463 L525 463 L526 463 L528 464 L529 464 L529 465 L530 464 L531 464 L532 465 L533 466 L533 465 L534 465 L535 464 L536 462 L535 462 L535 461 L536 460 L537 460 L538 460 L539 460 L540 459 L541 459 L542 459 L543 458 L543 457 L544 457 L545 457 L546 457 L547 457 L547 456 L548 456 L549 455 L549 454 L548 454 L548 453 L549 452 L549 451 L551 451 L552 450 L552 451 L553 451 L554 452 L553 453 L554 453 L554 454 L554 453 L555 454 L555 455 L556 455 L556 456 L557 457 L558 456 L559 455 L559 456 L560 456 L560 457 L560 456 L561 456 L561 457 L561 458 L562 458 L563 457 L565 457 L566 457 L567 456 L567 455 L567 454 L568 453 L567 453 L568 453 L569 453 L568 452 L569 452 L569 451 L570 451 L570 452 L571 452 L571 453 L572 453 L574 454 L574 455 L575 455 L574 453 L574 452 L575 452 L576 451 L575 451 L575 450 L576 450 L577 450 L577 451 L578 451 L579 451 L580 451 L581 452 L582 451 L581 451 L581 450 L582 449 L582 448 L581 448 L580 449 L579 449 L579 448 L580 448 L581 448 L580 447 L581 447 L582 447 L583 447 L583 448 L584 447 L584 448 L585 448 L586 448 L586 446 L587 445 L588 445 L587 444 L588 444 L588 443 L588 442 L589 442 L588 441 L588 440 L588 439 L587 439 L586 440 L586 439 L585 439 L585 438 L586 437 L587 436 L586 436 L587 436 L587 435 L587 434 L586 433 L585 433 L586 433 L587 432 L588 432 L588 430 L588 429 L590 429 L589 427 L589 426 L588 427 L588 425 L588 426 L587 425 L586 425 L585 426 L585 425 L584 426 L583 427 L582 427 L583 426 L581 426 L580 427 L579 427 L577 426 L579 426 L579 425 L579 424 L580 424 L580 423 L582 423 L581 422 L582 422 L583 421 L583 420 L583 421 L584 420 L585 421 L586 420 L587 419 L588 418 L588 417 L587 416 L586 415 L586 414 L586 412 L586 411 L587 411 L586 410 L585 411 L586 410 L586 409 L586 408 L587 407 L586 407 L585 406 L585 405 L585 404 Z","cx":546.5,"cy":430.5},{"n":"云南省","d":"M521 416 L521 415 L520 414 L520 413 L521 413 L520 412 L520 411 L520 412 L519 412 L519 411 L519 410 L518 410 L517 410 L516 410 L516 411 L515 412 L515 413 L514 413 L513 413 L512 413 L511 413 L510 414 L509 414 L508 413 L507 413 L506 412 L506 411 L505 411 L506 411 L506 410 L507 410 L507 409 L506 408 L507 408 L507 407 L506 407 L506 406 L505 407 L505 406 L504 405 L504 403 L505 403 L506 403 L506 402 L507 402 L507 401 L506 401 L505 402 L504 401 L503 401 L502 401 L502 402 L501 401 L499 402 L499 401 L498 402 L498 401 L497 402 L496 403 L497 404 L498 405 L498 406 L497 407 L496 408 L495 408 L494 407 L493 408 L492 409 L491 410 L491 411 L492 411 L492 412 L493 412 L492 413 L492 414 L492 415 L491 415 L490 416 L490 417 L489 417 L488 419 L488 418 L487 419 L486 420 L486 421 L485 421 L484 422 L483 421 L482 423 L482 424 L482 425 L482 427 L482 428 L482 429 L483 430 L484 431 L484 432 L484 433 L484 435 L485 435 L484 436 L484 437 L484 438 L483 438 L482 438 L481 439 L480 439 L479 440 L478 440 L477 440 L478 439 L478 438 L477 438 L476 438 L475 439 L474 439 L473 440 L472 440 L472 441 L471 441 L470 442 L469 443 L468 442 L467 442 L466 442 L465 443 L465 442 L464 442 L465 441 L464 441 L464 440 L463 440 L462 440 L461 439 L462 439 L462 438 L461 436 L460 436 L459 436 L458 435 L458 434 L459 434 L459 433 L460 431 L459 431 L459 432 L458 432 L457 431 L458 430 L457 429 L456 429 L456 428 L455 428 L454 427 L454 426 L454 425 L454 424 L453 425 L452 424 L452 423 L452 422 L451 421 L451 420 L450 420 L450 419 L449 418 L449 417 L448 416 L448 415 L447 415 L447 414 L446 413 L445 414 L444 415 L444 414 L443 414 L442 414 L441 415 L441 416 L440 415 L440 414 L439 414 L438 413 L439 413 L437 411 L436 410 L436 409 L436 408 L437 409 L437 408 L438 408 L439 407 L438 407 L438 406 L436 406 L437 405 L435 404 L435 403 L434 402 L433 402 L433 401 L432 400 L431 399 L431 398 L430 398 L429 398 L429 399 L429 400 L428 400 L428 401 L427 402 L427 403 L426 403 L426 404 L426 405 L426 406 L426 407 L425 409 L424 408 L424 407 L423 406 L422 405 L422 404 L422 402 L422 401 L421 400 L422 400 L421 399 L421 398 L421 397 L421 396 L421 394 L421 393 L421 392 L420 392 L419 392 L419 393 L419 394 L420 395 L418 396 L418 397 L419 398 L418 398 L418 399 L417 399 L417 398 L416 397 L416 395 L415 395 L415 396 L414 396 L413 396 L414 397 L414 398 L414 400 L413 401 L414 403 L413 403 L413 404 L414 404 L414 405 L415 406 L415 407 L415 408 L414 408 L413 409 L412 409 L411 409 L410 410 L410 409 L409 409 L409 408 L409 407 L408 406 L408 405 L407 406 L408 408 L407 408 L406 408 L406 409 L405 409 L406 410 L405 412 L406 412 L407 413 L406 414 L407 415 L407 417 L408 417 L408 418 L408 419 L409 419 L410 419 L410 417 L411 417 L412 418 L412 417 L413 418 L414 418 L415 419 L414 420 L415 420 L414 421 L415 421 L415 422 L415 423 L415 424 L414 424 L415 425 L415 426 L416 427 L415 428 L415 430 L416 431 L415 433 L416 433 L416 434 L415 435 L415 436 L415 437 L415 438 L414 439 L414 440 L415 440 L415 441 L415 442 L414 442 L413 441 L413 442 L413 443 L413 444 L414 444 L414 445 L415 446 L414 447 L412 446 L411 447 L411 448 L411 449 L410 449 L410 450 L408 451 L407 450 L406 450 L406 451 L405 452 L406 453 L405 454 L404 455 L403 455 L402 456 L401 456 L400 457 L399 459 L399 460 L399 461 L400 462 L399 463 L398 463 L396 464 L396 465 L396 466 L396 468 L396 469 L397 469 L398 469 L398 470 L399 470 L398 471 L399 471 L399 472 L399 473 L399 474 L398 475 L397 475 L397 476 L396 476 L396 477 L397 478 L398 479 L398 478 L399 478 L400 477 L401 476 L402 476 L403 476 L403 475 L405 475 L406 474 L407 474 L409 474 L411 474 L412 474 L413 475 L414 474 L415 474 L416 474 L417 474 L418 474 L416 476 L415 477 L415 476 L414 477 L415 477 L414 478 L415 479 L414 479 L414 480 L416 480 L417 480 L416 481 L417 481 L417 482 L417 483 L416 483 L417 485 L417 484 L418 485 L418 486 L417 487 L418 487 L418 488 L418 489 L419 490 L420 490 L421 491 L422 491 L423 491 L424 491 L425 490 L425 491 L426 491 L427 491 L428 491 L428 492 L428 493 L428 494 L427 493 L426 494 L427 495 L426 495 L426 496 L425 496 L424 496 L425 497 L426 499 L425 500 L426 500 L424 502 L423 502 L424 503 L423 504 L423 505 L422 505 L422 506 L423 507 L424 507 L425 507 L426 507 L427 506 L428 507 L429 507 L430 507 L431 507 L432 507 L433 508 L433 507 L435 507 L435 508 L435 509 L435 510 L435 511 L435 513 L436 514 L437 513 L438 513 L438 514 L437 515 L438 516 L438 517 L438 516 L439 516 L439 517 L440 517 L441 516 L443 516 L443 517 L444 517 L445 517 L447 516 L448 516 L448 515 L449 514 L450 514 L450 513 L451 513 L452 513 L453 512 L454 512 L453 512 L453 513 L454 514 L454 515 L455 515 L455 516 L455 517 L455 518 L454 518 L455 519 L456 520 L455 521 L456 522 L458 521 L459 521 L460 520 L461 521 L461 522 L462 521 L463 522 L464 522 L464 521 L465 521 L465 520 L464 520 L463 519 L464 518 L464 517 L464 516 L464 515 L465 515 L465 514 L464 514 L464 513 L464 511 L463 510 L463 509 L462 509 L461 509 L462 508 L461 506 L460 504 L461 504 L462 504 L462 502 L462 501 L463 501 L464 500 L465 501 L466 502 L466 501 L467 501 L468 501 L470 501 L470 502 L471 501 L472 502 L472 501 L473 499 L474 498 L474 497 L475 497 L475 496 L476 496 L477 496 L477 497 L478 497 L479 497 L481 498 L482 499 L482 500 L483 501 L484 501 L485 501 L485 500 L487 499 L486 499 L487 498 L488 497 L489 497 L489 496 L489 495 L490 496 L491 496 L491 497 L491 498 L492 499 L493 498 L493 497 L494 496 L496 497 L497 498 L498 499 L499 500 L500 500 L500 499 L501 497 L501 496 L502 495 L504 495 L504 496 L505 497 L506 497 L507 496 L508 496 L509 495 L510 495 L511 495 L512 495 L512 494 L514 493 L513 492 L513 490 L514 490 L515 489 L515 490 L515 489 L518 488 L519 488 L520 488 L520 487 L521 486 L522 486 L522 487 L523 488 L523 487 L524 489 L525 489 L525 488 L526 487 L527 487 L527 486 L526 486 L527 486 L528 485 L529 485 L529 484 L530 484 L531 484 L532 484 L532 485 L533 484 L534 484 L535 483 L534 482 L535 481 L534 479 L535 479 L535 478 L534 477 L534 476 L533 475 L532 474 L531 474 L531 475 L530 475 L530 476 L529 476 L529 475 L528 475 L527 475 L527 476 L526 474 L525 474 L524 476 L523 475 L522 475 L521 474 L521 475 L520 475 L519 474 L519 473 L520 473 L519 471 L519 470 L518 470 L518 469 L517 469 L516 469 L515 469 L513 469 L512 469 L511 469 L512 471 L511 471 L510 470 L510 469 L509 469 L509 468 L508 467 L508 466 L509 464 L509 463 L509 462 L510 461 L511 461 L512 460 L511 459 L510 459 L511 459 L511 458 L512 457 L512 456 L513 457 L513 456 L512 456 L511 455 L510 455 L510 454 L509 453 L509 451 L508 451 L508 452 L507 452 L507 451 L506 450 L505 450 L505 449 L505 448 L506 448 L507 446 L507 445 L508 444 L507 442 L508 443 L509 442 L508 441 L509 440 L510 439 L511 438 L511 437 L510 437 L510 436 L510 435 L509 435 L509 434 L508 434 L507 434 L508 433 L507 432 L506 433 L506 434 L505 434 L504 434 L503 433 L502 433 L501 435 L500 436 L499 435 L498 436 L497 435 L496 434 L496 433 L496 432 L495 431 L496 430 L496 429 L496 428 L496 427 L495 427 L494 428 L494 427 L494 426 L495 427 L494 426 L495 426 L496 424 L497 424 L497 423 L498 423 L498 422 L498 421 L499 420 L499 421 L500 421 L501 422 L502 422 L503 423 L504 423 L504 422 L505 422 L505 421 L506 420 L508 421 L509 422 L510 423 L512 422 L512 423 L513 422 L514 422 L514 423 L515 422 L516 422 L517 421 L518 421 L519 421 L519 422 L520 421 L520 420 L520 419 L520 418 L521 418 L521 417 L521 416 Z","cx":459.4,"cy":459.8},{"n":"西藏自治区","d":"M270 281 L268 281 L268 280 L266 280 L264 279 L263 279 L262 278 L261 278 L260 278 L259 278 L258 277 L257 277 L256 277 L255 277 L255 278 L254 278 L253 276 L252 276 L251 275 L250 275 L249 275 L248 275 L246 275 L245 275 L244 276 L243 275 L242 275 L241 276 L239 276 L238 276 L236 277 L235 277 L233 277 L233 276 L232 276 L231 276 L231 277 L229 277 L228 277 L228 278 L227 277 L227 278 L226 277 L225 278 L224 278 L223 278 L222 278 L221 278 L219 279 L218 279 L217 279 L216 279 L215 280 L214 280 L213 280 L213 281 L213 282 L212 282 L212 283 L211 284 L211 285 L210 285 L209 286 L208 286 L207 286 L205 286 L204 287 L203 288 L202 288 L200 287 L199 286 L198 286 L196 287 L194 286 L193 287 L192 287 L190 288 L189 289 L188 289 L187 289 L186 289 L185 290 L185 291 L184 291 L183 292 L182 292 L181 292 L180 293 L180 292 L179 293 L179 292 L178 292 L176 292 L176 293 L174 293 L172 293 L171 293 L170 293 L169 293 L169 292 L168 292 L167 292 L166 292 L165 292 L164 292 L163 292 L162 291 L161 291 L161 290 L161 289 L161 288 L160 288 L159 287 L158 287 L158 288 L157 288 L156 288 L155 287 L154 287 L153 287 L152 287 L151 288 L151 289 L150 290 L149 290 L148 290 L148 291 L147 291 L146 291 L146 292 L146 293 L145 294 L144 294 L143 294 L142 294 L141 294 L140 295 L137 295 L137 294 L136 293 L135 293 L134 293 L133 293 L132 293 L131 293 L131 292 L130 292 L130 293 L129 293 L129 294 L128 294 L128 293 L127 293 L125 293 L124 293 L123 292 L122 292 L121 292 L120 292 L120 291 L119 292 L118 292 L118 293 L117 294 L119 295 L117 295 L117 296 L115 297 L114 297 L113 298 L114 298 L113 299 L114 299 L113 300 L113 301 L112 301 L111 303 L111 304 L110 306 L111 306 L110 307 L109 307 L108 307 L106 307 L105 307 L104 307 L103 308 L102 308 L101 308 L100 308 L99 308 L98 308 L97 308 L98 309 L97 309 L97 310 L96 310 L96 311 L96 312 L95 312 L94 313 L94 312 L93 313 L91 313 L91 314 L93 315 L92 316 L93 316 L93 317 L93 318 L93 319 L92 320 L92 321 L93 321 L93 322 L94 323 L94 324 L95 324 L96 325 L97 326 L98 327 L99 328 L99 329 L99 331 L100 331 L101 332 L100 333 L101 333 L100 334 L101 334 L102 335 L101 336 L102 337 L101 338 L101 339 L100 339 L99 339 L99 340 L98 341 L97 341 L96 342 L95 341 L95 340 L94 340 L93 339 L93 338 L93 337 L93 336 L92 336 L91 337 L90 337 L89 337 L89 338 L87 338 L88 339 L88 340 L88 341 L88 342 L89 342 L88 343 L88 344 L88 345 L89 345 L90 346 L90 347 L92 347 L93 348 L93 349 L91 349 L91 350 L92 351 L93 352 L94 352 L94 353 L94 354 L93 354 L93 355 L92 355 L93 355 L93 356 L93 357 L93 358 L95 358 L95 359 L96 359 L96 360 L97 361 L96 361 L97 362 L98 363 L100 363 L100 364 L102 364 L102 363 L103 363 L103 362 L104 362 L104 363 L105 363 L106 364 L107 364 L108 363 L109 364 L110 366 L111 365 L112 366 L111 366 L112 367 L112 368 L113 369 L114 370 L115 370 L116 370 L117 370 L118 370 L119 371 L120 371 L121 371 L122 372 L123 372 L124 373 L125 373 L126 374 L128 374 L128 375 L129 375 L130 375 L130 376 L130 377 L130 378 L131 378 L131 379 L133 379 L134 378 L133 377 L134 377 L135 376 L135 375 L136 375 L136 374 L135 374 L136 373 L136 372 L136 373 L137 373 L138 373 L138 372 L139 373 L139 372 L141 373 L143 373 L144 374 L144 373 L145 374 L146 374 L147 374 L147 375 L147 376 L148 376 L149 377 L148 377 L148 378 L149 378 L150 379 L151 379 L152 379 L153 380 L154 380 L155 381 L156 381 L155 382 L157 382 L156 383 L157 383 L158 384 L159 384 L160 384 L161 385 L163 386 L163 385 L164 385 L164 386 L165 386 L166 386 L166 387 L167 387 L167 389 L168 389 L168 390 L169 390 L169 391 L170 392 L171 392 L171 393 L172 393 L172 392 L173 391 L174 391 L175 391 L176 390 L177 390 L177 391 L178 391 L179 391 L180 392 L181 392 L180 392 L180 393 L181 393 L181 394 L181 395 L181 396 L181 397 L182 397 L183 398 L184 398 L185 399 L185 400 L186 399 L187 400 L188 400 L188 401 L189 401 L190 402 L191 402 L192 402 L193 402 L194 401 L196 401 L197 401 L197 402 L197 403 L196 404 L195 404 L196 405 L195 406 L196 406 L197 406 L198 407 L199 407 L200 407 L200 406 L201 406 L202 406 L203 407 L204 407 L205 405 L205 406 L206 408 L207 409 L208 410 L208 411 L209 412 L209 413 L210 413 L211 413 L212 413 L211 411 L211 410 L212 410 L213 409 L213 410 L213 412 L214 412 L215 412 L216 413 L217 413 L217 412 L218 412 L218 411 L219 411 L219 410 L220 410 L221 410 L222 410 L222 411 L223 411 L224 411 L224 412 L225 412 L226 412 L227 413 L228 414 L229 414 L229 415 L230 414 L231 414 L232 414 L233 414 L235 414 L235 415 L237 414 L237 415 L238 415 L238 414 L238 413 L239 413 L241 413 L242 413 L243 413 L244 414 L244 413 L244 412 L245 412 L246 412 L248 412 L249 411 L250 411 L251 411 L251 410 L252 410 L253 410 L254 410 L255 411 L256 411 L256 413 L256 414 L256 415 L256 416 L256 417 L255 417 L255 418 L254 419 L255 419 L255 420 L255 421 L255 422 L256 421 L256 422 L257 422 L257 423 L258 424 L259 424 L259 423 L261 423 L261 422 L260 421 L260 420 L260 419 L261 418 L260 418 L260 417 L261 417 L262 415 L263 414 L264 414 L265 412 L266 411 L266 410 L267 410 L268 409 L270 409 L271 408 L272 408 L273 409 L274 408 L274 409 L275 409 L276 409 L276 408 L277 408 L277 409 L278 409 L279 409 L280 410 L280 411 L281 410 L282 411 L283 411 L284 411 L286 410 L286 411 L287 411 L288 412 L289 412 L290 412 L290 413 L291 414 L292 414 L293 413 L293 412 L294 412 L295 411 L298 411 L298 412 L298 413 L299 413 L300 413 L300 414 L299 414 L300 414 L301 415 L300 416 L300 417 L299 418 L300 418 L299 418 L300 419 L301 419 L302 420 L304 420 L306 420 L307 420 L307 421 L308 423 L308 424 L307 425 L307 426 L307 427 L308 427 L308 428 L308 430 L310 430 L311 429 L313 429 L314 429 L315 429 L317 428 L319 429 L321 429 L323 430 L324 430 L326 429 L332 429 L333 428 L335 427 L336 427 L336 425 L338 423 L340 422 L341 420 L342 419 L343 418 L344 418 L345 418 L346 418 L347 418 L349 417 L350 417 L351 416 L352 416 L353 416 L354 415 L355 414 L356 414 L359 412 L360 411 L361 411 L361 410 L361 409 L362 409 L363 409 L366 407 L367 407 L368 407 L369 407 L369 408 L370 408 L371 408 L372 408 L373 408 L374 408 L375 408 L376 409 L377 410 L377 409 L378 409 L379 410 L380 410 L381 411 L381 412 L382 412 L384 413 L385 414 L386 413 L387 414 L387 415 L388 415 L388 416 L389 416 L389 415 L390 415 L391 413 L392 413 L393 413 L393 412 L394 411 L393 411 L392 411 L392 410 L393 410 L392 409 L393 409 L393 408 L394 408 L394 407 L395 407 L395 406 L395 405 L396 404 L395 404 L396 404 L396 403 L397 403 L398 403 L399 404 L399 405 L400 405 L400 406 L401 406 L402 406 L404 407 L403 408 L404 408 L405 408 L405 409 L406 409 L406 408 L407 408 L408 408 L407 406 L408 405 L408 406 L409 407 L409 408 L409 409 L410 409 L410 410 L411 409 L412 409 L413 409 L414 408 L415 408 L415 407 L415 406 L414 405 L414 404 L413 404 L413 403 L414 403 L413 401 L414 400 L414 398 L414 397 L413 396 L414 396 L415 396 L415 395 L416 395 L416 397 L417 398 L417 399 L418 399 L418 398 L419 398 L418 397 L418 396 L420 395 L419 394 L419 393 L419 392 L420 392 L421 392 L421 391 L421 390 L420 389 L420 387 L420 386 L419 384 L420 383 L420 382 L420 380 L420 378 L419 377 L419 376 L419 375 L419 374 L419 372 L418 371 L418 370 L418 369 L418 368 L419 367 L418 367 L417 366 L416 365 L416 364 L416 363 L415 362 L415 361 L414 361 L413 360 L413 359 L413 358 L414 358 L416 359 L416 358 L418 357 L417 356 L415 355 L414 354 L413 354 L412 352 L411 351 L411 350 L410 350 L410 349 L410 348 L410 347 L410 346 L409 346 L408 345 L407 344 L407 343 L407 342 L407 341 L405 340 L405 341 L405 340 L402 339 L401 339 L400 339 L399 338 L398 338 L398 339 L396 338 L395 338 L394 337 L394 338 L393 338 L392 338 L392 339 L393 339 L393 340 L394 342 L393 343 L392 342 L391 344 L391 345 L392 345 L392 346 L391 346 L391 345 L390 346 L391 346 L390 346 L389 346 L388 346 L387 346 L386 346 L387 347 L386 347 L385 347 L385 348 L384 347 L383 347 L383 348 L384 349 L383 349 L383 350 L384 350 L385 351 L384 352 L383 352 L382 351 L382 352 L381 351 L380 352 L379 351 L378 350 L378 349 L377 348 L376 348 L375 348 L374 349 L374 350 L374 351 L375 351 L375 352 L375 353 L374 353 L373 353 L373 352 L372 351 L371 350 L369 350 L368 351 L369 352 L368 352 L367 351 L365 350 L364 351 L363 351 L363 350 L362 350 L361 349 L361 348 L361 347 L362 347 L362 346 L362 344 L361 344 L361 345 L360 345 L359 344 L359 342 L358 342 L357 343 L356 342 L358 342 L359 341 L358 341 L357 341 L356 341 L355 340 L354 340 L353 340 L353 339 L352 339 L351 339 L351 338 L351 337 L349 337 L349 336 L348 337 L347 337 L346 337 L346 338 L345 337 L345 338 L344 338 L343 339 L342 339 L342 340 L341 340 L340 339 L339 340 L338 340 L338 339 L337 339 L336 339 L336 338 L335 338 L334 338 L333 338 L333 339 L331 339 L330 339 L330 338 L329 338 L328 338 L327 337 L326 336 L325 336 L325 337 L324 337 L323 336 L323 335 L322 335 L320 336 L320 335 L319 335 L318 335 L317 335 L316 335 L314 335 L313 335 L312 335 L311 335 L310 335 L310 334 L310 333 L309 333 L308 333 L307 333 L307 334 L306 334 L305 332 L304 332 L303 332 L302 331 L301 331 L300 330 L299 330 L299 329 L298 329 L297 330 L296 329 L295 329 L294 329 L293 329 L293 330 L291 329 L290 329 L289 329 L288 329 L287 329 L286 329 L284 328 L283 327 L282 327 L281 327 L280 326 L278 324 L276 323 L276 322 L274 322 L274 321 L274 320 L274 319 L273 319 L273 318 L272 317 L271 317 L270 316 L269 315 L268 314 L269 314 L269 313 L270 313 L270 312 L271 312 L272 310 L271 310 L272 309 L271 309 L271 308 L271 307 L271 306 L271 305 L270 304 L270 303 L271 303 L271 302 L272 302 L272 301 L271 301 L271 300 L270 300 L269 300 L267 300 L268 298 L268 297 L267 297 L266 296 L266 295 L265 295 L266 294 L267 294 L266 294 L266 293 L268 292 L269 292 L270 291 L270 290 L269 290 L270 289 L270 288 L270 286 L271 286 L270 286 L271 285 L269 285 L268 285 L267 285 L267 284 L266 284 L265 284 L265 283 L265 282 L266 282 L268 282 L269 281 L270 281 Z","cx":248.2,"cy":354},{"n":"陕西省","d":"M603 305 L602 305 L601 305 L600 304 L601 303 L601 302 L600 300 L601 299 L602 298 L603 296 L603 295 L603 294 L604 293 L604 292 L605 290 L606 290 L606 289 L607 288 L606 287 L606 286 L606 285 L606 284 L605 284 L605 283 L605 282 L604 281 L604 280 L604 279 L604 278 L604 277 L605 276 L605 275 L604 275 L605 275 L605 273 L604 272 L603 271 L604 271 L603 270 L604 269 L603 269 L604 269 L603 268 L604 267 L603 266 L604 266 L605 265 L605 264 L606 263 L607 262 L608 262 L608 261 L607 260 L607 259 L609 259 L609 258 L610 257 L609 257 L609 256 L610 256 L609 255 L608 255 L609 254 L608 254 L606 251 L605 251 L605 250 L605 249 L605 248 L605 247 L606 247 L606 245 L607 245 L608 244 L609 244 L609 243 L610 243 L611 243 L611 242 L612 241 L611 241 L611 240 L612 239 L612 238 L613 236 L613 235 L613 234 L614 234 L615 233 L615 232 L616 232 L616 230 L617 229 L616 229 L616 228 L615 229 L615 228 L614 228 L614 227 L615 226 L615 225 L613 225 L612 226 L611 226 L609 228 L609 229 L608 230 L607 230 L606 229 L606 228 L605 228 L604 228 L603 229 L601 227 L599 227 L599 228 L600 228 L600 229 L599 230 L597 231 L596 231 L595 230 L596 231 L595 232 L596 232 L595 232 L594 232 L593 233 L592 234 L591 234 L592 235 L591 235 L591 236 L590 237 L589 237 L588 238 L587 239 L586 239 L587 240 L586 240 L585 240 L584 241 L583 242 L582 243 L581 244 L580 246 L580 247 L580 248 L582 249 L581 249 L582 250 L581 250 L581 251 L580 251 L579 250 L578 249 L577 249 L578 250 L577 251 L577 252 L577 254 L577 255 L576 255 L575 256 L573 255 L572 255 L571 256 L569 256 L568 256 L567 256 L565 256 L565 255 L564 254 L563 253 L562 253 L560 253 L559 252 L559 253 L558 254 L556 254 L556 255 L555 255 L555 256 L554 256 L553 256 L554 257 L554 258 L553 259 L553 261 L553 262 L553 263 L554 263 L554 264 L553 265 L553 264 L553 265 L553 266 L553 267 L553 268 L554 267 L554 268 L556 268 L557 268 L557 269 L558 269 L559 269 L560 269 L561 270 L562 270 L563 270 L563 271 L564 271 L564 272 L565 271 L565 272 L565 273 L566 273 L567 273 L568 272 L568 273 L569 274 L570 273 L570 274 L571 274 L571 275 L572 276 L573 276 L573 275 L574 275 L575 276 L575 277 L575 278 L576 280 L576 281 L576 282 L575 283 L574 283 L574 284 L573 284 L573 285 L573 287 L573 289 L574 290 L575 290 L574 290 L575 292 L574 293 L574 294 L573 294 L572 294 L570 294 L569 294 L568 294 L567 294 L566 294 L565 294 L564 295 L564 294 L562 294 L560 294 L559 294 L559 295 L560 296 L560 297 L561 298 L562 298 L562 299 L560 299 L559 299 L559 300 L558 299 L557 299 L557 300 L556 300 L555 300 L554 300 L553 300 L552 300 L551 300 L551 299 L550 299 L550 298 L549 298 L548 297 L547 297 L546 297 L544 297 L542 297 L541 297 L541 298 L540 298 L540 299 L541 301 L542 302 L541 303 L540 303 L539 304 L540 304 L539 304 L537 305 L538 306 L540 306 L541 306 L541 307 L542 307 L543 308 L544 309 L543 309 L544 310 L543 311 L542 310 L542 311 L542 310 L541 310 L540 311 L541 311 L542 312 L541 313 L540 313 L540 314 L540 315 L539 316 L539 317 L540 317 L540 318 L540 319 L541 320 L542 321 L542 322 L541 323 L540 322 L539 321 L538 321 L537 321 L536 322 L535 322 L534 322 L534 321 L533 321 L532 321 L531 322 L530 323 L530 324 L529 325 L528 325 L528 326 L529 326 L529 327 L530 327 L531 327 L532 328 L531 328 L531 329 L531 330 L531 331 L530 332 L529 332 L528 332 L527 333 L526 333 L525 332 L524 332 L524 333 L525 333 L525 334 L525 335 L526 335 L526 336 L527 335 L528 335 L529 335 L529 334 L530 334 L531 333 L531 334 L532 333 L532 334 L533 333 L533 334 L534 334 L533 335 L534 335 L535 336 L536 336 L537 336 L538 336 L539 337 L540 336 L541 336 L542 336 L543 336 L544 335 L545 335 L546 336 L546 335 L547 335 L547 336 L549 335 L549 336 L550 336 L550 337 L550 338 L550 339 L551 339 L552 340 L553 340 L553 339 L554 339 L555 338 L555 339 L556 340 L557 341 L558 340 L559 340 L559 341 L560 342 L561 342 L561 343 L562 344 L563 344 L564 345 L565 344 L566 343 L567 343 L568 343 L570 343 L571 343 L572 343 L573 343 L573 344 L574 344 L575 345 L576 345 L577 346 L578 346 L579 347 L580 347 L582 348 L583 349 L584 349 L584 350 L585 350 L585 351 L585 352 L587 352 L588 351 L589 352 L590 351 L590 350 L591 350 L590 349 L591 348 L590 347 L590 346 L591 345 L590 344 L590 343 L589 343 L589 342 L589 341 L589 340 L590 339 L591 338 L591 337 L592 337 L593 337 L594 338 L595 337 L596 338 L597 338 L598 338 L598 337 L599 337 L600 337 L599 336 L599 335 L599 334 L598 334 L598 333 L597 333 L596 333 L595 332 L594 332 L594 333 L593 333 L593 332 L593 331 L593 330 L592 329 L590 329 L589 329 L588 329 L588 328 L589 327 L590 327 L591 326 L591 327 L592 327 L594 327 L595 327 L596 328 L597 327 L597 328 L599 327 L600 328 L601 328 L602 328 L603 328 L604 328 L606 327 L606 328 L607 329 L607 328 L608 329 L609 328 L610 328 L611 327 L612 328 L612 327 L613 327 L613 325 L613 324 L613 323 L613 322 L613 321 L612 321 L611 321 L610 320 L610 319 L609 318 L608 317 L607 317 L606 317 L607 316 L608 316 L608 315 L607 314 L606 314 L606 313 L607 313 L607 312 L606 312 L606 311 L605 311 L604 311 L604 310 L605 309 L604 308 L603 308 L603 306 L603 305 Z","cx":578.8,"cy":294.3},{"n":"甘肃省","d":"M540 287 L539 287 L540 288 L540 289 L539 290 L540 291 L540 292 L540 293 L540 294 L539 294 L538 294 L538 295 L537 294 L536 293 L536 292 L535 292 L535 291 L534 292 L534 293 L534 292 L533 292 L533 291 L532 291 L531 292 L531 291 L533 291 L533 290 L531 290 L530 290 L530 291 L529 289 L528 289 L528 288 L527 287 L528 287 L527 287 L527 286 L526 287 L524 287 L524 286 L523 286 L523 285 L522 286 L522 285 L523 285 L522 284 L521 283 L522 282 L523 281 L524 281 L524 280 L524 279 L524 278 L523 277 L523 276 L523 275 L522 275 L522 274 L521 274 L520 273 L521 273 L520 273 L520 272 L519 271 L520 271 L521 270 L522 270 L522 269 L521 269 L521 268 L520 268 L519 268 L519 267 L519 266 L518 266 L517 266 L516 266 L515 266 L515 265 L514 264 L514 263 L513 262 L512 263 L510 263 L510 262 L510 261 L511 262 L511 261 L512 261 L511 260 L508 259 L507 259 L506 260 L505 260 L505 259 L504 260 L503 260 L501 259 L499 257 L498 257 L497 256 L495 254 L494 253 L490 252 L490 250 L490 249 L492 248 L492 246 L491 244 L498 240 L500 236 L501 236 L503 235 L503 234 L503 233 L503 231 L501 229 L501 228 L501 227 L499 227 L498 227 L496 227 L493 228 L491 228 L489 229 L488 230 L487 231 L486 231 L484 232 L482 232 L478 231 L477 231 L475 230 L473 230 L472 231 L469 232 L468 232 L466 232 L465 233 L467 234 L468 236 L469 236 L467 237 L466 238 L464 239 L462 239 L461 240 L461 239 L458 238 L457 238 L457 237 L457 236 L456 236 L455 235 L455 234 L454 234 L451 235 L451 234 L450 234 L449 234 L449 233 L449 232 L449 231 L449 227 L447 227 L445 228 L444 228 L444 226 L443 226 L441 226 L440 225 L441 224 L440 223 L438 223 L436 222 L435 222 L434 221 L433 220 L430 220 L427 220 L426 220 L427 220 L428 220 L431 218 L433 218 L434 217 L435 215 L436 215 L438 213 L438 209 L439 208 L439 206 L437 204 L436 203 L435 203 L430 203 L428 204 L422 204 L422 206 L421 206 L421 207 L420 207 L419 205 L416 206 L416 207 L416 208 L415 207 L414 207 L414 205 L412 206 L413 207 L409 209 L409 203 L407 203 L406 202 L403 200 L402 199 L397 195 L397 194 L401 191 L398 186 L395 182 L393 178 L390 173 L387 173 L383 173 L377 174 L374 176 L373 176 L372 176 L371 177 L371 178 L371 179 L372 179 L372 180 L374 182 L372 183 L373 185 L373 186 L372 187 L371 187 L369 188 L368 188 L367 188 L365 188 L364 189 L362 190 L361 191 L360 191 L360 193 L359 192 L358 191 L358 190 L357 190 L357 189 L355 190 L354 190 L353 191 L352 192 L351 193 L347 194 L342 197 L339 200 L337 202 L336 204 L336 205 L335 207 L331 207 L321 209 L321 212 L321 213 L319 215 L318 220 L318 223 L317 226 L315 228 L313 230 L312 230 L312 232 L312 233 L313 233 L314 233 L314 232 L315 232 L317 232 L319 232 L320 232 L321 231 L322 231 L322 232 L323 232 L324 231 L325 231 L325 232 L325 233 L326 233 L325 235 L326 235 L327 236 L330 235 L334 235 L336 236 L337 236 L337 237 L335 237 L335 238 L337 239 L338 239 L338 238 L343 238 L345 238 L347 243 L347 244 L348 244 L350 244 L352 244 L353 244 L353 243 L354 243 L356 243 L356 244 L357 243 L357 244 L358 244 L358 245 L359 245 L360 245 L361 245 L362 245 L363 245 L364 245 L365 245 L366 244 L367 244 L368 245 L369 245 L370 246 L371 247 L372 247 L373 247 L375 248 L375 247 L375 248 L376 248 L376 247 L376 246 L377 246 L378 246 L382 246 L382 245 L381 245 L381 244 L382 243 L382 242 L384 242 L383 241 L384 241 L384 240 L385 240 L385 241 L386 241 L388 241 L388 240 L388 239 L387 239 L387 238 L387 237 L387 236 L386 235 L387 234 L386 233 L387 232 L386 231 L387 231 L388 231 L389 231 L391 231 L392 231 L393 231 L393 232 L394 232 L395 233 L396 233 L398 234 L398 235 L400 235 L401 236 L403 236 L404 237 L405 237 L406 237 L407 236 L407 235 L408 235 L408 234 L408 233 L409 234 L410 234 L411 235 L412 235 L413 235 L413 234 L414 234 L415 233 L416 233 L418 233 L418 234 L419 234 L420 234 L421 235 L420 236 L422 236 L423 237 L424 238 L425 239 L426 239 L427 240 L428 241 L429 242 L430 242 L430 243 L431 243 L432 244 L433 244 L435 245 L436 245 L436 246 L437 246 L438 246 L438 247 L438 245 L437 244 L436 243 L436 242 L437 242 L438 243 L439 243 L440 244 L441 245 L442 245 L442 246 L443 246 L443 245 L444 246 L445 246 L447 246 L448 246 L449 248 L450 247 L451 248 L450 248 L450 249 L450 250 L451 250 L453 251 L454 252 L455 253 L456 253 L457 254 L458 253 L459 252 L461 253 L462 254 L464 255 L465 256 L466 255 L467 255 L468 255 L469 256 L468 256 L469 257 L470 257 L469 258 L470 258 L471 259 L473 260 L474 261 L475 261 L475 262 L476 263 L477 263 L478 265 L477 265 L476 265 L476 266 L475 267 L476 267 L477 268 L478 269 L479 270 L478 271 L477 271 L478 272 L479 272 L479 273 L480 273 L480 274 L481 274 L480 275 L481 277 L482 277 L483 278 L484 278 L484 279 L485 279 L484 279 L483 280 L483 281 L482 281 L483 282 L483 284 L483 285 L482 285 L481 285 L480 285 L479 285 L479 286 L479 287 L480 288 L480 289 L481 290 L480 290 L480 291 L479 290 L477 290 L476 289 L476 290 L475 291 L474 292 L473 292 L472 292 L472 293 L473 293 L472 294 L473 294 L474 294 L474 295 L474 296 L473 296 L473 297 L472 298 L471 298 L470 298 L469 299 L469 300 L468 300 L466 301 L467 301 L466 303 L466 305 L467 305 L467 306 L468 306 L469 306 L470 307 L471 308 L472 309 L471 309 L470 310 L469 310 L469 311 L468 311 L468 312 L467 312 L467 313 L466 313 L465 312 L465 313 L464 313 L463 313 L462 313 L462 312 L460 311 L460 312 L459 311 L458 311 L457 311 L457 310 L456 310 L455 310 L455 309 L454 310 L453 309 L452 309 L451 309 L451 308 L450 309 L449 309 L449 310 L448 310 L449 311 L448 312 L449 313 L450 313 L450 314 L451 315 L450 315 L451 316 L452 316 L452 317 L454 317 L454 318 L455 318 L455 319 L454 319 L454 320 L455 320 L456 320 L458 320 L459 320 L460 319 L461 320 L462 321 L461 322 L462 323 L463 323 L464 323 L464 322 L465 322 L465 321 L466 321 L466 322 L466 323 L467 324 L466 324 L466 325 L466 326 L464 326 L464 327 L465 327 L465 328 L465 329 L466 329 L466 328 L467 328 L468 328 L469 328 L469 327 L470 326 L470 327 L471 327 L471 325 L472 324 L473 324 L474 324 L475 323 L475 324 L475 323 L475 322 L473 321 L473 320 L473 319 L472 319 L473 319 L473 318 L472 318 L472 317 L470 315 L471 315 L472 315 L473 315 L474 315 L474 314 L475 313 L475 314 L476 313 L478 313 L477 312 L478 312 L479 311 L480 311 L481 310 L482 310 L483 310 L484 311 L483 311 L484 312 L485 312 L486 312 L486 313 L487 313 L486 314 L486 315 L486 316 L487 316 L486 318 L487 318 L488 318 L490 319 L491 319 L491 318 L492 318 L493 319 L492 320 L493 320 L493 319 L494 319 L495 320 L496 320 L498 320 L500 320 L501 320 L502 320 L503 321 L503 322 L503 323 L503 324 L504 324 L504 325 L505 325 L506 325 L507 326 L506 326 L505 326 L505 327 L506 328 L506 329 L505 330 L506 330 L507 331 L506 331 L506 332 L505 332 L504 332 L505 333 L506 334 L507 335 L508 335 L509 335 L510 336 L511 336 L512 337 L513 337 L513 336 L514 336 L514 337 L515 337 L517 336 L517 337 L518 337 L519 337 L520 337 L520 336 L521 336 L522 336 L522 335 L523 335 L523 334 L523 333 L522 333 L523 333 L523 332 L524 332 L525 332 L526 333 L527 333 L528 332 L529 332 L530 332 L531 331 L531 330 L531 329 L531 328 L532 328 L531 327 L530 327 L529 327 L529 326 L528 326 L528 325 L529 325 L530 324 L530 323 L531 322 L532 321 L533 321 L534 321 L534 322 L535 322 L536 322 L537 321 L538 321 L539 321 L540 322 L541 323 L542 322 L542 321 L541 320 L540 319 L540 318 L540 317 L539 317 L539 316 L540 315 L540 314 L540 313 L541 313 L542 312 L541 311 L540 311 L541 310 L542 310 L542 311 L542 310 L543 311 L544 310 L543 309 L544 309 L543 308 L542 307 L541 307 L541 306 L540 306 L538 306 L537 305 L539 304 L540 304 L539 304 L540 303 L541 303 L542 302 L541 301 L540 299 L540 298 L541 298 L541 297 L542 297 L544 297 L546 297 L547 297 L548 297 L549 298 L550 298 L550 299 L551 299 L551 300 L552 300 L553 300 L554 300 L555 300 L556 300 L557 300 L557 299 L558 299 L559 300 L559 299 L560 299 L562 299 L562 298 L561 298 L560 297 L560 296 L559 295 L559 294 L560 294 L562 294 L564 294 L564 295 L565 294 L566 294 L567 294 L568 294 L569 294 L570 294 L572 294 L573 294 L574 294 L574 293 L575 292 L574 290 L575 290 L574 290 L573 289 L573 287 L573 285 L573 284 L574 284 L574 283 L575 283 L576 282 L576 281 L576 280 L575 278 L575 277 L575 276 L574 275 L573 275 L573 276 L572 276 L571 275 L571 274 L570 274 L570 273 L569 274 L568 273 L568 272 L567 273 L566 273 L565 273 L565 272 L565 271 L564 272 L564 271 L563 271 L563 270 L562 270 L561 270 L560 269 L559 269 L558 269 L557 269 L557 268 L556 268 L554 268 L554 267 L553 268 L553 267 L553 266 L553 265 L552 265 L551 264 L550 264 L549 264 L549 265 L548 265 L547 264 L547 265 L545 264 L544 265 L544 264 L543 264 L542 264 L543 265 L543 266 L543 267 L542 267 L541 267 L542 268 L543 268 L543 269 L542 270 L543 271 L542 270 L541 271 L540 271 L540 272 L539 272 L540 273 L539 273 L538 273 L538 274 L539 274 L540 274 L541 275 L540 276 L540 277 L540 278 L541 278 L543 278 L544 278 L544 279 L545 279 L546 279 L546 280 L547 280 L547 281 L548 281 L547 281 L547 282 L548 283 L547 283 L547 284 L546 284 L547 285 L547 286 L546 286 L546 287 L545 287 L544 287 L543 287 L542 287 L541 287 L540 287 Z","cx":497.2,"cy":281.5},{"n":"青海省","d":"M481 277 L480 275 L481 274 L480 274 L480 273 L479 273 L479 272 L478 272 L477 271 L478 271 L479 270 L478 269 L477 268 L476 267 L475 267 L476 266 L476 265 L477 265 L478 265 L477 263 L476 263 L475 262 L475 261 L474 261 L473 260 L471 259 L470 258 L469 258 L470 257 L469 257 L468 256 L469 256 L468 255 L467 255 L466 255 L465 256 L464 255 L462 254 L461 253 L459 252 L458 253 L457 254 L456 253 L455 253 L454 252 L453 251 L451 250 L450 250 L450 249 L450 248 L451 248 L450 247 L449 248 L448 246 L447 246 L445 246 L444 246 L443 245 L443 246 L442 246 L442 245 L441 245 L440 244 L439 243 L438 243 L437 242 L436 242 L436 243 L437 244 L438 245 L438 247 L438 246 L437 246 L436 246 L436 245 L435 245 L433 244 L432 244 L431 243 L430 243 L430 242 L429 242 L428 241 L427 240 L426 239 L425 239 L424 238 L423 237 L422 236 L420 236 L421 235 L420 234 L419 234 L418 234 L418 233 L416 233 L415 233 L414 234 L413 234 L413 235 L412 235 L411 235 L410 234 L409 234 L408 233 L408 234 L408 235 L407 235 L407 236 L406 237 L405 237 L404 237 L403 236 L401 236 L400 235 L398 235 L398 234 L396 233 L395 233 L394 232 L393 232 L393 231 L392 231 L391 231 L389 231 L388 231 L387 231 L386 231 L387 232 L386 233 L387 234 L386 235 L387 236 L387 237 L387 238 L387 239 L388 239 L388 240 L388 241 L386 241 L385 241 L385 240 L384 240 L384 241 L383 241 L384 242 L382 242 L382 243 L381 244 L381 245 L382 245 L382 246 L378 246 L377 246 L376 246 L376 247 L376 248 L375 248 L375 247 L375 248 L373 247 L372 247 L371 247 L370 246 L369 245 L368 245 L367 244 L366 244 L365 245 L364 245 L363 245 L362 245 L361 245 L360 245 L359 245 L358 245 L358 244 L357 244 L357 243 L356 244 L356 243 L354 243 L353 243 L353 244 L352 244 L350 244 L348 244 L347 244 L347 243 L345 238 L343 238 L338 238 L338 239 L337 239 L335 238 L335 237 L337 237 L337 236 L336 236 L334 235 L330 235 L327 236 L326 235 L325 235 L326 233 L325 233 L325 232 L325 231 L324 231 L323 232 L322 232 L322 231 L321 231 L320 232 L319 232 L317 232 L315 232 L314 232 L314 233 L313 233 L313 234 L311 234 L310 234 L309 235 L308 235 L306 235 L305 236 L303 236 L302 236 L301 236 L298 237 L295 238 L294 238 L293 238 L290 239 L289 239 L286 240 L285 239 L284 239 L285 240 L284 240 L284 241 L283 241 L282 241 L282 242 L281 242 L280 242 L279 242 L278 242 L276 242 L276 243 L276 244 L277 244 L276 245 L279 246 L280 246 L280 245 L281 245 L283 245 L283 247 L283 254 L284 255 L285 255 L287 256 L288 257 L288 258 L289 258 L290 259 L291 258 L292 259 L292 260 L293 261 L292 261 L293 262 L293 263 L295 264 L295 265 L295 266 L294 266 L293 266 L292 266 L292 267 L291 267 L290 268 L289 268 L288 268 L286 269 L286 270 L286 271 L286 272 L286 273 L287 273 L288 273 L289 273 L291 274 L291 275 L291 277 L291 278 L291 279 L292 279 L292 280 L292 281 L290 281 L289 282 L288 282 L287 282 L287 281 L285 280 L284 280 L283 280 L282 280 L281 280 L279 280 L278 280 L277 279 L276 279 L277 279 L275 278 L274 278 L275 278 L275 279 L274 280 L273 280 L273 281 L271 281 L270 281 L269 281 L268 282 L266 282 L265 282 L265 283 L265 284 L266 284 L267 284 L267 285 L268 285 L269 285 L271 285 L270 286 L271 286 L270 286 L270 288 L270 289 L269 290 L270 290 L270 291 L269 292 L268 292 L266 293 L266 294 L267 294 L266 294 L265 295 L266 295 L266 296 L267 297 L268 297 L268 298 L267 300 L269 300 L270 300 L271 300 L271 301 L272 301 L272 302 L271 302 L271 303 L270 303 L270 304 L271 305 L271 306 L271 307 L271 308 L271 309 L272 309 L271 310 L272 310 L271 312 L270 312 L270 313 L269 313 L269 314 L268 314 L269 315 L270 316 L271 317 L272 317 L273 318 L273 319 L274 319 L274 320 L274 321 L274 322 L276 322 L276 323 L278 324 L280 326 L281 327 L282 327 L283 327 L284 328 L286 329 L287 329 L288 329 L289 329 L290 329 L291 329 L293 330 L293 329 L294 329 L295 329 L296 329 L297 330 L298 329 L299 329 L299 330 L300 330 L301 331 L302 331 L303 332 L304 332 L305 332 L306 334 L307 334 L307 333 L308 333 L309 333 L310 333 L310 334 L310 335 L311 335 L312 335 L313 335 L314 335 L316 335 L317 335 L318 335 L319 335 L320 335 L320 336 L322 335 L323 335 L323 336 L324 337 L325 337 L325 336 L326 336 L327 337 L328 338 L329 338 L330 338 L330 339 L331 339 L333 339 L333 338 L334 338 L335 338 L336 338 L336 339 L337 339 L338 339 L338 340 L339 340 L340 339 L341 340 L342 340 L342 339 L343 339 L344 338 L345 338 L345 337 L346 338 L346 337 L347 337 L348 337 L349 336 L349 337 L351 337 L351 338 L351 339 L352 339 L353 339 L353 340 L354 340 L355 340 L356 341 L357 341 L358 341 L359 341 L358 342 L356 342 L357 343 L358 342 L359 342 L359 344 L360 345 L361 345 L361 344 L362 344 L362 346 L362 347 L361 347 L361 348 L361 349 L362 350 L363 350 L363 351 L364 351 L365 350 L367 351 L368 352 L369 352 L368 351 L369 350 L371 350 L372 351 L373 352 L373 353 L374 353 L375 353 L375 352 L375 351 L374 351 L374 350 L374 349 L375 348 L376 348 L377 348 L378 349 L378 350 L379 351 L380 352 L381 351 L382 352 L382 351 L383 352 L384 352 L385 351 L384 350 L383 350 L383 349 L384 349 L383 348 L383 347 L384 347 L385 348 L385 347 L386 347 L387 347 L386 346 L387 346 L388 346 L389 346 L390 346 L391 346 L390 346 L391 345 L391 346 L392 346 L392 345 L391 345 L391 344 L392 342 L393 343 L394 342 L393 340 L393 339 L392 339 L392 338 L393 338 L394 338 L394 337 L395 338 L396 338 L398 339 L398 338 L399 338 L398 338 L397 338 L397 337 L396 337 L395 336 L394 336 L394 335 L393 334 L393 333 L393 332 L394 331 L396 331 L395 331 L396 330 L395 329 L395 328 L396 328 L397 327 L397 325 L398 325 L399 324 L398 324 L397 323 L396 323 L395 322 L396 322 L394 321 L394 320 L394 319 L394 318 L393 318 L393 317 L394 317 L393 316 L395 317 L395 316 L396 316 L397 316 L398 315 L398 314 L398 313 L399 312 L400 312 L400 311 L402 311 L402 312 L404 313 L405 313 L406 313 L407 313 L409 313 L410 313 L410 314 L410 315 L410 316 L410 317 L411 317 L411 318 L412 318 L412 319 L413 319 L413 320 L414 320 L413 321 L414 321 L414 322 L415 323 L415 324 L416 325 L415 326 L416 326 L416 327 L417 328 L418 329 L419 329 L420 330 L420 329 L421 330 L423 330 L423 331 L423 332 L424 333 L425 333 L425 332 L427 333 L428 333 L429 334 L430 334 L431 335 L432 335 L432 334 L432 333 L432 332 L433 332 L434 331 L434 330 L435 331 L435 332 L436 332 L436 333 L437 333 L437 334 L438 335 L437 336 L437 337 L439 337 L439 336 L440 335 L441 335 L442 335 L442 336 L442 335 L443 336 L444 337 L444 338 L445 338 L446 338 L446 337 L447 337 L447 336 L448 337 L449 336 L450 337 L451 337 L452 337 L452 336 L453 336 L454 336 L455 335 L455 334 L455 333 L454 333 L454 332 L454 331 L455 331 L454 331 L455 330 L454 330 L454 329 L453 328 L454 327 L455 326 L455 327 L456 327 L458 328 L458 327 L459 327 L460 328 L461 328 L462 329 L462 328 L463 327 L463 326 L462 326 L462 325 L463 324 L464 323 L464 322 L464 323 L463 323 L462 323 L461 322 L462 321 L461 320 L460 319 L459 320 L458 320 L456 320 L455 320 L454 320 L454 319 L455 319 L455 318 L454 318 L454 317 L452 317 L452 316 L451 316 L450 315 L451 315 L450 314 L450 313 L449 313 L448 312 L449 311 L448 310 L449 310 L449 309 L450 309 L451 308 L451 309 L452 309 L453 309 L454 310 L455 309 L455 310 L456 310 L457 310 L457 311 L458 311 L459 311 L460 312 L460 311 L462 312 L462 313 L463 313 L464 313 L465 313 L465 312 L466 313 L467 313 L467 312 L468 312 L468 311 L469 311 L469 310 L470 310 L471 309 L472 309 L471 308 L470 307 L469 306 L468 306 L467 306 L467 305 L466 305 L466 303 L467 301 L466 301 L468 300 L469 300 L469 299 L470 298 L471 298 L472 298 L473 297 L473 296 L474 296 L474 295 L474 294 L473 294 L472 294 L473 293 L472 293 L472 292 L473 292 L474 292 L475 291 L476 290 L476 289 L477 290 L479 290 L480 291 L480 290 L481 290 L480 289 L480 288 L479 287 L479 286 L479 285 L480 285 L481 285 L482 285 L483 285 L483 284 L483 282 L482 281 L483 281 L483 280 L484 279 L485 279 L484 279 L484 278 L483 278 L482 277 L481 277 Z","cx":371.7,"cy":286.8},{"n":"宁夏回族自治区","d":"M553 265 L553 264 L553 265 L554 264 L554 263 L553 263 L553 262 L553 261 L553 259 L554 258 L554 257 L553 256 L554 256 L555 256 L555 255 L556 255 L556 254 L558 254 L559 253 L559 252 L557 252 L556 251 L555 251 L555 250 L554 249 L552 248 L551 248 L550 248 L549 248 L547 248 L546 248 L545 247 L544 247 L543 246 L542 246 L541 246 L540 245 L542 244 L543 243 L543 240 L544 239 L544 238 L546 236 L548 235 L548 234 L548 233 L547 233 L546 233 L546 232 L546 231 L545 231 L545 230 L545 229 L545 228 L544 228 L543 228 L542 228 L541 229 L541 230 L539 229 L537 230 L537 231 L537 232 L536 232 L535 232 L535 231 L535 232 L534 233 L534 234 L533 235 L532 235 L532 236 L531 237 L531 238 L530 239 L531 239 L530 240 L530 241 L530 242 L530 243 L529 243 L530 244 L529 244 L530 245 L530 246 L529 247 L529 248 L529 249 L530 250 L529 251 L529 252 L528 253 L527 254 L526 254 L526 255 L524 255 L523 255 L521 255 L520 255 L519 256 L518 256 L517 257 L514 257 L513 258 L510 258 L507 258 L507 259 L505 259 L505 260 L506 260 L507 259 L508 259 L511 260 L512 261 L511 261 L511 262 L510 261 L510 262 L510 263 L512 263 L513 262 L514 263 L514 264 L515 265 L515 266 L516 266 L517 266 L518 266 L519 266 L519 267 L519 268 L520 268 L521 268 L521 269 L522 269 L522 270 L521 270 L520 271 L519 271 L520 272 L520 273 L521 273 L520 273 L521 274 L522 274 L522 275 L523 275 L523 276 L523 277 L524 278 L524 279 L524 280 L524 281 L523 281 L522 282 L521 283 L522 284 L523 285 L522 285 L522 286 L523 285 L523 286 L524 286 L524 287 L526 287 L527 286 L527 287 L528 287 L527 287 L528 288 L528 289 L529 289 L530 291 L530 290 L531 290 L533 290 L533 291 L534 290 L533 291 L534 292 L534 293 L534 292 L535 291 L535 292 L536 292 L536 293 L537 294 L538 295 L538 294 L539 294 L540 294 L540 293 L540 292 L540 291 L539 290 L540 289 L540 288 L539 287 L540 287 L541 287 L542 287 L543 287 L544 287 L545 287 L546 287 L546 286 L547 286 L547 285 L546 284 L547 284 L547 283 L548 283 L547 282 L547 281 L548 281 L547 281 L547 280 L546 280 L546 279 L545 279 L544 279 L544 278 L543 278 L541 278 L540 278 L540 277 L540 276 L541 275 L540 274 L539 274 L538 274 L538 273 L539 273 L540 273 L539 272 L540 272 L540 271 L541 271 L542 270 L543 271 L542 270 L543 269 L543 268 L542 268 L541 267 L542 267 L543 267 L543 266 L543 265 L542 264 L543 264 L544 264 L544 265 L545 264 L547 265 L547 264 L548 265 L549 265 L549 264 L550 264 L551 264 L552 265 L553 265 Z","cx":535,"cy":261.6},{"n":"新疆维吾尔自治区","d":"M377 174 L377 171 L370 166 L369 165 L369 163 L367 160 L366 159 L365 157 L365 156 L363 153 L362 153 L361 153 L360 153 L361 152 L361 151 L361 150 L361 149 L362 149 L362 148 L359 149 L357 149 L355 149 L354 149 L352 148 L351 148 L350 148 L350 147 L348 146 L346 145 L345 145 L344 144 L343 144 L342 143 L341 142 L340 141 L334 139 L332 138 L331 138 L330 138 L329 137 L328 137 L327 137 L325 137 L324 137 L323 137 L321 137 L321 136 L320 137 L319 136 L317 137 L315 137 L313 137 L312 137 L310 137 L308 136 L307 136 L305 136 L303 136 L302 136 L299 136 L298 135 L297 135 L296 135 L294 135 L293 135 L293 134 L292 134 L291 134 L290 134 L288 134 L289 133 L288 133 L288 132 L287 132 L287 131 L287 130 L286 130 L285 129 L285 128 L286 125 L287 124 L289 122 L291 121 L291 120 L291 119 L290 118 L289 117 L290 117 L289 116 L290 115 L290 114 L291 114 L291 113 L292 112 L291 112 L291 110 L291 109 L290 109 L290 108 L289 108 L290 107 L289 107 L289 106 L288 105 L287 105 L285 104 L285 103 L284 102 L283 102 L283 100 L282 100 L283 99 L282 98 L282 97 L281 96 L280 95 L280 94 L278 94 L277 93 L276 93 L275 92 L276 91 L275 91 L274 91 L272 91 L270 91 L270 90 L269 90 L268 90 L268 89 L267 88 L266 88 L264 88 L263 88 L263 89 L262 89 L261 89 L259 89 L259 88 L257 87 L255 87 L254 86 L253 86 L252 86 L252 85 L251 84 L252 83 L251 83 L250 82 L249 82 L248 82 L248 81 L247 81 L246 81 L245 81 L244 80 L243 80 L242 79 L241 79 L242 79 L242 78 L243 78 L243 77 L242 77 L241 76 L241 77 L240 76 L239 76 L239 75 L238 75 L238 74 L239 74 L240 73 L241 73 L240 73 L240 72 L239 72 L240 71 L239 71 L240 71 L239 70 L238 70 L237 70 L236 70 L235 70 L234 70 L234 71 L233 71 L232 71 L231 71 L230 71 L229 70 L228 70 L227 70 L226 70 L225 71 L224 70 L223 71 L223 72 L222 72 L221 73 L222 74 L223 75 L222 76 L222 77 L221 78 L220 79 L219 79 L219 80 L216 81 L215 81 L214 81 L213 82 L211 82 L208 82 L206 82 L205 83 L205 84 L204 84 L204 85 L203 86 L202 87 L202 88 L202 89 L204 96 L203 97 L205 98 L205 99 L204 100 L205 100 L205 101 L204 102 L203 103 L202 103 L202 104 L201 104 L199 104 L198 104 L197 104 L196 105 L195 105 L195 106 L193 106 L193 107 L192 107 L191 106 L190 105 L189 105 L188 105 L187 105 L186 105 L184 105 L183 105 L182 105 L181 105 L180 105 L179 105 L178 105 L177 105 L176 105 L174 104 L173 105 L173 104 L171 104 L170 104 L169 103 L168 103 L167 102 L166 102 L165 102 L165 101 L164 101 L163 101 L162 101 L162 102 L161 104 L160 105 L160 106 L159 108 L159 109 L158 110 L158 111 L157 113 L155 116 L154 119 L153 121 L152 121 L151 122 L151 123 L151 124 L151 125 L150 126 L150 127 L149 127 L150 128 L152 130 L154 130 L155 132 L155 134 L154 134 L153 134 L151 134 L150 133 L148 133 L147 134 L147 133 L146 133 L145 133 L144 133 L143 133 L142 132 L142 131 L140 131 L139 131 L138 132 L138 133 L136 133 L135 133 L134 133 L133 133 L132 133 L132 134 L131 134 L130 134 L129 135 L128 134 L128 135 L127 135 L126 135 L125 135 L124 135 L123 135 L121 135 L120 136 L119 136 L119 137 L118 136 L117 137 L116 137 L115 136 L115 137 L115 136 L114 137 L113 138 L112 138 L111 139 L112 139 L112 140 L113 140 L113 141 L114 140 L115 140 L116 140 L116 141 L117 142 L118 142 L119 143 L120 144 L119 145 L119 147 L119 148 L120 149 L119 150 L119 151 L120 152 L120 153 L120 154 L121 154 L121 155 L121 156 L125 161 L125 162 L125 163 L124 164 L125 164 L125 165 L126 166 L126 167 L125 167 L124 167 L123 167 L122 167 L122 168 L121 168 L120 169 L119 169 L121 170 L122 171 L123 171 L121 171 L120 172 L119 172 L118 172 L117 172 L117 173 L117 174 L116 175 L116 176 L116 177 L117 177 L117 178 L116 179 L117 179 L117 180 L117 181 L118 181 L118 182 L117 182 L116 182 L116 183 L115 183 L116 184 L115 185 L114 185 L112 185 L111 185 L111 186 L110 186 L109 187 L108 187 L107 187 L107 188 L106 188 L105 188 L104 188 L103 188 L103 189 L102 189 L101 189 L100 190 L99 190 L97 191 L96 191 L95 192 L94 193 L93 193 L92 193 L92 194 L91 194 L90 194 L89 195 L88 195 L87 195 L86 195 L86 196 L84 195 L83 196 L83 197 L83 198 L82 198 L80 199 L79 199 L78 199 L78 200 L78 201 L77 201 L76 201 L76 202 L75 201 L74 202 L73 202 L72 202 L72 201 L71 201 L70 201 L69 202 L68 201 L67 202 L66 201 L65 201 L64 201 L63 201 L62 202 L61 202 L60 203 L60 205 L59 206 L59 207 L59 208 L58 208 L58 209 L57 209 L57 210 L57 211 L56 211 L56 212 L55 212 L54 212 L53 211 L52 211 L51 212 L50 211 L49 212 L48 212 L47 212 L47 213 L46 213 L45 213 L44 213 L43 212 L43 211 L44 211 L44 210 L43 210 L42 209 L42 208 L43 208 L42 207 L41 207 L40 208 L39 209 L38 209 L37 210 L36 211 L34 210 L34 211 L33 211 L33 210 L32 211 L32 210 L31 210 L30 209 L29 210 L29 211 L31 212 L30 213 L29 212 L27 212 L27 213 L26 213 L25 214 L25 215 L24 215 L23 216 L22 216 L21 216 L20 216 L18 216 L17 216 L16 217 L15 218 L16 218 L15 219 L15 220 L14 221 L14 222 L15 222 L15 224 L15 225 L14 225 L14 226 L13 226 L12 227 L10 226 L10 227 L8 228 L9 228 L9 229 L9 230 L10 230 L11 231 L12 232 L12 233 L12 234 L13 234 L13 233 L14 234 L14 235 L13 235 L12 235 L11 236 L12 237 L12 238 L12 239 L13 240 L14 241 L15 241 L16 242 L17 241 L18 241 L17 241 L18 240 L19 239 L20 240 L22 240 L23 240 L24 240 L25 240 L26 241 L26 240 L28 241 L29 241 L29 242 L30 242 L30 244 L29 245 L29 246 L29 247 L29 248 L30 250 L31 250 L31 251 L31 252 L31 253 L32 253 L32 254 L31 255 L31 257 L32 258 L33 258 L34 258 L34 259 L35 260 L34 260 L35 261 L34 261 L33 262 L31 262 L31 263 L29 263 L29 262 L28 262 L27 262 L26 262 L25 263 L25 262 L24 262 L24 263 L24 264 L24 265 L25 265 L25 266 L26 266 L26 265 L28 265 L28 266 L29 266 L29 265 L30 265 L30 266 L31 267 L32 266 L33 266 L35 266 L36 267 L37 267 L38 267 L39 267 L39 268 L39 269 L39 270 L40 271 L40 270 L41 271 L41 270 L42 270 L44 270 L45 271 L46 272 L48 273 L47 273 L48 274 L49 276 L48 277 L49 278 L49 279 L49 280 L48 280 L47 280 L48 281 L48 282 L49 282 L50 282 L50 283 L51 284 L51 285 L52 285 L53 285 L54 285 L55 285 L56 284 L57 284 L58 284 L58 285 L58 286 L60 286 L61 288 L62 288 L63 289 L64 289 L66 289 L68 290 L69 290 L70 290 L70 291 L71 291 L72 291 L73 291 L74 291 L75 291 L76 291 L77 291 L78 290 L78 291 L79 291 L80 291 L81 291 L83 291 L82 291 L81 292 L81 293 L81 295 L82 296 L82 297 L83 297 L83 298 L83 299 L84 299 L84 300 L84 302 L84 303 L85 303 L85 304 L85 305 L86 305 L87 305 L88 305 L88 306 L89 305 L90 306 L90 307 L91 306 L92 306 L92 307 L93 307 L94 308 L95 308 L95 309 L96 308 L96 309 L97 309 L98 309 L97 308 L98 308 L99 308 L100 308 L101 308 L102 308 L103 308 L104 307 L105 307 L106 307 L108 307 L109 307 L110 307 L111 306 L110 306 L111 304 L111 303 L112 301 L113 301 L113 300 L114 299 L113 299 L114 298 L113 298 L114 297 L115 297 L117 296 L117 295 L119 295 L117 294 L118 293 L118 292 L119 292 L120 291 L120 292 L121 292 L122 292 L123 292 L124 293 L125 293 L127 293 L128 293 L128 294 L129 294 L129 293 L130 293 L130 292 L131 292 L131 293 L132 293 L133 293 L134 293 L135 293 L136 293 L137 294 L137 295 L140 295 L141 294 L142 294 L143 294 L144 294 L145 294 L146 293 L146 292 L146 291 L147 291 L148 291 L148 290 L149 290 L150 290 L151 289 L151 288 L152 287 L153 287 L154 287 L155 287 L156 288 L157 288 L158 288 L158 287 L159 287 L160 288 L161 288 L161 289 L161 290 L161 291 L162 291 L163 292 L164 292 L165 292 L166 292 L167 292 L168 292 L169 292 L169 293 L170 293 L171 293 L172 293 L174 293 L176 293 L176 292 L178 292 L179 292 L179 293 L180 292 L180 293 L181 292 L182 292 L183 292 L184 291 L185 291 L185 290 L186 289 L187 289 L188 289 L189 289 L190 288 L192 287 L193 287 L194 286 L196 287 L198 286 L199 286 L200 287 L202 288 L203 288 L204 287 L205 286 L207 286 L208 286 L209 286 L210 285 L211 285 L211 284 L212 283 L212 282 L213 282 L213 281 L213 280 L214 280 L215 280 L216 279 L217 279 L218 279 L219 279 L221 278 L222 278 L223 278 L224 278 L225 278 L226 277 L227 278 L227 277 L228 278 L228 277 L229 277 L231 277 L231 276 L232 276 L233 276 L233 277 L235 277 L236 277 L238 276 L239 276 L241 276 L242 275 L243 275 L244 276 L245 275 L246 275 L248 275 L249 275 L250 275 L251 275 L252 276 L253 276 L254 278 L255 278 L255 277 L256 277 L257 277 L258 277 L259 278 L260 278 L261 278 L262 278 L263 279 L264 279 L266 280 L268 280 L268 281 L270 281 L271 281 L273 281 L273 280 L274 280 L275 279 L275 278 L274 278 L275 278 L277 279 L276 279 L277 279 L278 280 L279 280 L281 280 L282 280 L283 280 L284 280 L285 280 L287 281 L287 282 L288 282 L289 282 L290 281 L292 281 L292 280 L292 279 L291 279 L291 278 L291 277 L291 275 L291 274 L289 273 L288 273 L287 273 L286 273 L286 272 L286 271 L286 270 L286 269 L288 268 L289 268 L290 268 L291 267 L292 267 L292 266 L293 266 L294 266 L295 266 L295 265 L295 264 L293 263 L293 262 L292 261 L293 261 L292 260 L292 259 L291 258 L290 259 L289 258 L288 258 L288 257 L287 256 L285 255 L284 255 L283 254 L283 247 L283 245 L281 245 L280 245 L280 246 L279 246 L276 245 L277 244 L276 244 L276 243 L276 242 L278 242 L279 242 L280 242 L281 242 L282 242 L282 241 L283 241 L284 241 L284 240 L285 240 L284 239 L285 239 L286 240 L289 239 L290 239 L293 238 L294 238 L295 238 L298 237 L301 236 L302 236 L303 236 L305 236 L306 235 L308 235 L309 235 L310 234 L311 234 L313 234 L313 233 L312 233 L312 232 L312 230 L313 230 L315 228 L317 226 L318 223 L318 220 L319 215 L321 213 L321 212 L321 209 L331 207 L335 207 L336 205 L336 204 L337 202 L339 200 L342 197 L347 194 L351 193 L352 192 L353 191 L354 190 L355 190 L357 189 L357 190 L358 190 L358 191 L359 192 L360 193 L360 191 L361 191 L362 190 L364 189 L365 188 L367 188 L368 188 L369 188 L371 187 L372 187 L373 186 L373 185 L372 183 L374 182 L372 180 L372 179 L371 179 L371 178 L371 177 L372 176 L373 176 L374 176 L377 174 Z","cx":198.3,"cy":195.7},{"n":"台湾省","d":"M765 501 L766 502 L767 503 L768 504 L769 506 L769 507 L769 508 L769 509 L769 510 L770 510 L771 510 L772 510 L772 509 L773 508 L773 507 L773 506 L773 503 L774 500 L774 499 L775 498 L777 497 L778 496 L778 495 L779 494 L779 493 L780 492 L780 491 L781 491 L781 490 L781 489 L781 488 L782 487 L782 485 L783 484 L784 480 L784 477 L785 476 L785 475 L785 474 L785 473 L787 471 L788 469 L788 468 L789 466 L788 465 L788 464 L788 463 L789 461 L791 460 L790 459 L789 459 L789 458 L788 458 L787 457 L786 457 L785 456 L784 455 L783 455 L781 456 L780 457 L779 458 L778 458 L776 459 L775 459 L774 460 L774 461 L773 462 L772 464 L771 465 L770 465 L769 466 L768 468 L768 469 L767 470 L766 471 L766 472 L765 473 L764 474 L763 476 L763 477 L762 479 L761 479 L760 481 L760 483 L760 484 L760 487 L759 487 L758 491 L759 491 L760 492 L760 494 L761 497 L762 499 L763 500 L765 501 Z","cx":773.7,"cy":480.1}];
function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// 自绘简化世界地图（等距投影 viewBox 1000×500）；不依赖任何境外地图服务
const WORLD_LAND = [
  "M150,70 L210,52 L262,50 L300,60 L320,78 L308,96 L322,108 L300,124 L286,150 L268,150 L255,168 L240,176 L228,160 L216,140 L202,134 L188,114 L165,110 L150,92 L142,78 Z", // 北美
  "M348,38 L392,34 L402,58 L382,76 L360,70 L348,54 Z", // 格陵兰
  "M300,212 L330,206 L350,220 L346,246 L332,270 L322,300 L306,322 L294,316 L298,290 L284,266 L290,238 L296,220 Z", // 南美
  "M468,96 L520,84 L560,90 L576,104 L560,118 L576,128 L556,140 L536,134 L516,148 L500,140 L486,150 L478,128 L468,118 L470,104 Z", // 欧洲
  "M480,160 L540,150 L576,158 L590,180 L586,210 L566,246 L546,280 L526,300 L512,288 L508,256 L494,226 L482,196 L478,176 Z", // 非洲
  "M584,96 L650,80 L720,72 L800,78 L872,86 L906,102 L916,122 L892,136 L862,142 L840,150 L820,148 L800,160 L770,162 L746,156 L722,166 L700,150 L680,158 L660,146 L640,152 L620,138 L600,140 L590,120 L582,108 Z", // 亚洲
  "M876,142 L884,140 L888,150 L882,160 L876,156 Z M892,132 L898,131 L900,140 L894,146 Z", // 日本
  "M833,179 L839,177 L841,186 L836,191 L832,186 Z", // 台湾（中国一部分）
  "M820,256 L882,248 L906,262 L914,290 L896,310 L860,314 L834,302 L822,280 L818,264 Z", // 澳大利亚
  "M936,322 L942,320 L946,332 L940,340 L934,334 Z M944,340 L950,338 L952,348 L946,352 Z", // 新西兰
  "M0,492 L1000,492 L1000,500 L0,500 Z" // 南极
];

function getPlace(id){
  let p=TRAVEL_PLACES.find(x=>x.id===id);
  if(p) return {p, custom:false};
  p=(S.customPlaces||[]).find(x=>x.id===id);
  if(p) return {p, custom:true};
  return null;
}
function renderMap(){
  const mapEl=document.getElementById('worldmap'); if(!mapEl) return;
  renderMapTabs();
  const tab = MAP_TABS.find(t=>t.id===S.mapTab) || MAP_TABS[0];
  const addingCls = _adding ? ' adding':'';
  const mk=(p)=>{
    const st=(S.travel[p.id]&&S.travel[p.id].visited)?'visited':'locked';
    const label=escapeHtml(p.name)+(p.sub?('·'+escapeHtml(p.sub)):'');
    let x,y;
    if(tab.id==='cn'){ x=Math.round(chX(p.lng)); y=Math.round(chY(p.lat)); }
    else { x=parseFloat(projX(p.lng)); y=parseFloat(projY(p.lat)); }
    return `<g class="pin ${st}" onclick="openPlaceEditor('${p.id}')">
      <circle class="hit" cx="${x}" cy="${y}" r="${tab.id==='cn'?13:14}"/>
      <circle class="dot" cx="${x}" cy="${y}" r="5"/>
      <text class="plabel" x="${x}" y="${(y+13).toFixed(1)}" text-anchor="middle">${label}</text>
    </g>`;
  };
  let svg;
  if(tab.id==='cn'){
    svg = `<svg class="worldmap chinamap${addingCls}" viewBox="0 0 ${CH_W} ${CH_H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" onclick="onMapClick(event)">`;
    svg += `<rect x="0" y="0" width="${CH_W}" height="${CH_H}" fill="#0c1d30"/>`;
    svg += '<g class="grat">';
    for(let lng=80; lng<=130; lng+=10){ const x=Math.round(chX(lng)); svg+=`<line x1="${x}" y1="0" x2="${x}" y2="${CH_H}"/>`; }
    for(let lat=15; lat<=50; lat+=10){ const y=Math.round(chY(lat)); svg+=`<line x1="0" y1="${y}" x2="${CH_W}" y2="${y}"/>`; }
    svg += '</g>';
    CHINA_PROV.forEach(p=>{ svg += `<path class="cn-prov" d="${p.d}"/>`; });
    const dash=[[122,21],[121,16],[119,13],[116.5,11],[114,10],[111,9.5],[108.5,8.5],[106,8],[104,8]];
    svg += `<path class="scs" d="M${dash.map(([lng,lat])=>Math.round(chX(lng))+' '+Math.round(chY(lat))).join(' L')}"/>`;
    svg += `<text class="cn-pl" x="${Math.round(chX(112.5))}" y="${Math.round(chY(7))}" font-size="9">南海诸岛</text>`;
    CHINA_PROV.forEach(p=>{
      const sn=p.n.replace(/(省|市|自治区|特别行政区|壮族|回族|维吾尔)/g,'');
      svg += `<text class="cn-pl" x="${p.cx}" y="${p.cy}" text-anchor="middle">${sn}</text>`;
    });
    placesInZone('cn').forEach(p=>{ svg+=mk(p); });
    svg += `</svg>`;
  } else {
    let vb;
    if(tab.pole){
      vb = (tab.pole==='N') ? [300,0,400,210] : [0,430,1000,70];
    } else {
      const [lngR,latR]=tab.bounds;
      const x1=parseFloat(projX(lngR[0])), x2=parseFloat(projX(lngR[1]));
      const y1=parseFloat(projY(latR[1])), y2=parseFloat(projY(latR[0]));
      const padX=(x2-x1)*0.18+25, padY=(y2-y1)*0.18+18;
      vb=[x1-padX, y1-padY, (x2-x1)+2*padX, (y2-y1)+2*padY];
    }
    { let [vx,vy,vw,vh]=vb;
      if(vw/vh < 2){ const nw=vh*2; vx-=(nw-vw)/2; vw=nw; }
      else { const nh=vw/2; vy-=(nh-vh)/2; vh=nh; }
      vb=[vx,vy,vw,vh];
    }
    svg=`<svg class="worldmap${addingCls}" viewBox="${vb.map(v=>v.toFixed(1)).join(' ')}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" onclick="onMapClick(event)">`;
    svg+='<g class="grat">';
    const lngR = tab.pole ? [-180,180] : tab.bounds[0];
    const latR = tab.pole ? (tab.pole==='N'?[55,90]:[-90,-50]) : tab.bounds[1];
    for(let lng=Math.ceil(lngR[0]/15)*15; lng<=lngR[1]; lng+=15){ const x=projX(lng); svg+=`<line x1="${x}" y1="0" x2="${x}" y2="500"/>`; }
    for(let lat=Math.ceil(latR[0]/15)*15; lat<=latR[1]; lat+=15){ const y=projY(lat); svg+=`<line x1="0" y1="${y}" x2="1000" y2="${y}"/>`; }
    svg+='</g>';
    svg += WORLD_LAND.map(d=>`<path class="land" d="${d}"/>`).join('');
    const places = placesInZone(tab.id);
    if(!places.length){
      svg += `<text x="500" y="250" text-anchor="middle" fill="#9bb6cc" font-size="15" font-family="inherit">本区暂无规划地点（点「＋新增地点」输入地名自动定位）</text>`;
    } else {
      places.forEach(p=>{ svg+=mk(p); });
    }
    svg += `</svg>`;
  }
  mapEl.innerHTML = svg;

  // 统计（合并预设 + 自定义）
  const all = TRAVEL_PLACES.concat(S.customPlaces||[]);
  const total=all.length;
  const visited=all.filter(p=>S.travel[p.id]&&S.travel[p.id].visited).length;
  const pct=total?Math.round(visited/total*100):0;
  const fc=document.getElementById('fpCount'), ft=document.getElementById('fpTotal'), fp=document.getElementById('fpPct');
  if(fc)fc.textContent=visited; if(ft)ft.textContent=total; if(fp)fp.textContent=pct+'%';

  // 足迹卡片（合并）
  const fpEl=document.getElementById('footprints');
  if(fpEl){
    const list=all.filter(p=>S.travel[p.id]&&S.travel[p.id].visited);
    if(!list.length){ fpEl.innerHTML='<div style="color:var(--dim);font-size:13px">还没有到访记录。点击地图上的圆点，标记「我去过了」开始你的足迹；也可以点「＋新增地点」输入地名自动加进来。</div>'; }
    else fpEl.innerHTML=list.map(p=>{
      const d=S.travel[p.id]; const stars='★'.repeat(d.rating||0)+'☆'.repeat(5-(d.rating||0));
      return `<div class="fp" onclick="openPlaceEditor('${p.id}')">
        <div class="fp-h"><span class="fp-name">${escapeHtml(p.name)}</span><span class="fp-sub">${p.sub||(p.region==='自定义'?'自定义':'')}</span></div>
        <div class="fp-stars">${stars}</div>
        ${d.refl?`<div class="fp-refl">${escapeHtml(d.refl)}</div>`:''}
        ${d.date?`<div class="fp-date">📅 ${d.date}</div>`:''}
      </div>`;
    }).join('');
  }
  renderTravelGoals();
}

function placesInZone(zone){ return TRAVEL_PLACES.filter(p=>p.zone===zone).concat((S.customPlaces||[]).filter(p=>p.zone===zone)); }
function renderMapTabs(){
  const el=document.getElementById('mapTabs'); if(!el) return;
  el.innerHTML = MAP_TABS.map(t=>{
    const n=placesInZone(t.id).length;
    const active = S.mapTab===t.id ? ' active':'';
    return `<button class="maptab${active}" onclick="setMapTab('${t.id}')">${t.name}${n?` <span class="mt-n">${n}</span>`:''}</button>`;
  }).join('') + `<button class="maptab add" onclick="openAddSearch()">＋ 新增地点</button>`;
}
function setMapTab(id){ if(S.mapTab===id) return; S.mapTab=id; save(); renderMap(); }

// ===== 新增地点：输入地名 → 自动在地图对应位置点亮 =====
let _cands=[];
function openAddSearch(){
  _cands=[];
  const si=document.getElementById('citySearch'); if(si) si.value='';
  const cc=document.getElementById('cityCands'); if(cc) cc.innerHTML='';
  const fb=document.getElementById('cityFallback'); if(fb) fb.style.display='none';
  const m=document.getElementById('addSearchModal'); if(m) m.style.display='flex';
  setTimeout(()=>{ const i=document.getElementById('citySearch'); if(i) i.focus(); },60);
}
function closeAddSearch(){ const m=document.getElementById('addSearchModal'); if(m) m.style.display='none'; }
function renderCityCands(){
  const q=(document.getElementById('citySearch').value||'').trim();
  const box=document.getElementById('cityCands'); if(!box) return;
  const fb=document.getElementById('cityFallback');
  if(!q){ box.innerHTML=''; if(fb) fb.style.display='none'; return; }
  const list=findCoord(q); _cands=list;
  if(!list.length){
    box.innerHTML='<div class="hint" style="padding:10px 2px">库里没有这个地名。可换个说法，或在地图上手动点选位置。</div>';
    if(fb) fb.style.display='block';
    return;
  }
  if(fb) fb.style.display='none';
  box.innerHTML=list.map((c,i)=>`<div class="city-cand" onclick="pickCity(${i})">
    <span class="cc-name">${escapeHtml(c.n)}</span>
    <span class="cc-region">${escapeHtml(c.region||'')}</span>
    <span class="cc-coord">${c.lng.toFixed(1)}°E, ${c.lat.toFixed(1)}°N · ${zoneName(c.zone)}</span>
  </div>`).join('');
}
function pickCity(i){
  const c=_cands[i]; if(!c) return;
  if(!S.customPlaces) S.customPlaces=[];
  const id='c_'+Date.now();
  S.customPlaces.push({id,name:c.n,sub:c.region||'',region:'自定义',zone:c.zone,lng:c.lng,lat:c.lat,wish:false});
  S.mapTab=c.zone;
  save();
  closeAddSearch();
  openCustomModal(id,null);
}

function renderTravelGoals(){
  const gy=document.getElementById('goalYear'), gm=document.getElementById('goalMonth');
  if(!gy||!gm) return;
  const opt='<option value="">— 未设定 —</option>'
    + TRAVEL_PLACES.map(p=>`<option value="${p.id}">${p.name}${p.sub?('（'+p.sub+'）'):''}</option>`).join('')
    + (S.customPlaces||[]).map(p=>`<option value="${p.id}">${escapeHtml(p.name)}${p.sub?('（'+p.sub+'）'):''}（自定义）</option>`).join('');
  if(gy.innerHTML!==opt) gy.innerHTML=opt;
  if(gm.innerHTML!==opt) gm.innerHTML=opt;
  gy.value=(S.travelGoals&&S.travelGoals.year)||'';
  gm.value=(S.travelGoals&&S.travelGoals.month)||'';
  const ay=document.getElementById('goalYearAch'), am=document.getElementById('goalMonthAch');
  if(ay) ay.innerHTML=achText('year');
  if(am) am.innerHTML=achText('month');
}
function achText(period){
  const id=S.travelGoals&&S.travelGoals[period];
  if(!id) return '';
  const done=S.travel[id]&&S.travel[id].visited;
  return done?'<span class="ok">✅ 已达成</span>':'<span class="no">🔒 待解锁</span>';
}
function setTravelGoal(period,val){
  if(!S.travelGoals) S.travelGoals={year:null,month:null};
  S.travelGoals[period]=val||null;
  save(); renderTravelGoals();
}

let _pmId=null, _pmRating=0, _pmCustom=false, _adding=false, _cmId=null, _cmRating=0, _cmPreset=null;
function openPlaceEditor(id){
  const g=getPlace(id); if(!g) return;
  const p=g.p;
  _pmId=id; _pmCustom=g.custom;
  const d=S.travel[id]||{};
  document.getElementById('pmName').textContent=p.name+(p.sub?(' · '+p.sub):'');
  document.getElementById('pmRegion').textContent='所属：'+p.region+(p.wish?' · 人生愿望目的地':'')+(g.custom?' · 自定义地点':'');
  const toggle=document.getElementById('pmToggle'), detail=document.getElementById('pmDetail');
  const del=document.getElementById('pmDelete'); if(del) del.style.display = g.custom?'inline-block':'none';
  if(d.visited){
    toggle.textContent='↩️ 撤销「我去过了」'; toggle.className='btn sm';
    detail.style.display='block';
    document.getElementById('pmDate').value=d.date||'';
    _pmRating=d.rating||0;
    document.getElementById('pmRefl').value=d.refl||'';
  } else {
    toggle.textContent='✅ 我去过了'; toggle.className='btn sm primary';
    detail.style.display='none';
  }
  renderStars();
  document.getElementById('placeModal').style.display='flex';
}
function toggleVisitedFromModal(){
  const id=_pmId; if(!id) return;
  const d=S.travel[id]||{};
  d.visited=!d.visited;
  if(d.visited && !d.date) d.date=todayStr();
  S.travel[id]=d; save();
  openPlaceEditor(id); renderMap();
}
function renderStars(){
  const el=document.getElementById('pmStars'); if(!el) return;
  el.innerHTML=[1,2,3,4,5].map(n=>`<span class="${n<=_pmRating?'on':''}" onclick="setRating(${n})">★</span>`).join('');
}
function setRating(n){ _pmRating=n; renderStars(); }
function savePlace(){
  const id=_pmId; if(!id) return;
  const d=S.travel[id]||{};
  d.visited=!!d.visited;
  d.date=document.getElementById('pmDate').value||d.date||'';
  d.rating=_pmRating;
  d.refl=document.getElementById('pmRefl').value||'';
  S.travel[id]=d; save();
  closePlaceEditor(); renderMap();
}
function closePlaceEditor(){ _pmId=null; const m=document.getElementById('placeModal'); if(m) m.style.display='none'; }

function manualAddMode(){
  closeAddSearch();
  _adding=true;
  const tip=document.getElementById('addTip'); if(tip) tip.style.display='block';
  renderMapTabs(); renderMap();
}
function onMapClick(evt){
  if(evt.target.closest && evt.target.closest('.pin')) return;   // 点到已有地点不新增
  if(!_adding) return;
  const svg=evt.currentTarget;
  let sp;
  if(svg.createSVGPoint){
    const pt=svg.createSVGPoint(); pt.x=evt.clientX; pt.y=evt.clientY;
    sp=pt.matrixTransform(svg.getScreenCTM().inverse());
  } else {
    const ctm=svg.getScreenCTM().inverse();
    sp={x:ctm.a*evt.clientX+ctm.c*evt.clientY+ctm.e, y:ctm.b*evt.clientX+ctm.d*evt.clientY+ctm.f};
  }
  const tab=MAP_TABS.find(t=>t.id===S.mapTab)||MAP_TABS[0];
  let lng,lat,zone;
  if(tab.id==='cn'){
    lng = sp.x/CH_W*(CH_LNG1-CH_LNG0)+CH_LNG0;
    lat = CH_LAT1 - sp.y/CH_H*(CH_LAT1-CH_LAT0);
    zone='cn';
  } else {
    lng = sp.x/1000*360-180;
    lat = 90 - sp.y/500*180;
    zone=tab.id;
  }
  _adding=false;
  const tip=document.getElementById('addTip'); if(tip) tip.style.display='none';
  renderMapTabs();
  openCustomModal(null,{lng,lat,zone});
}
function openCustomModal(id, preset){
  _cmId=id||null; _cmPreset=preset||null;
  const ex = id? (S.customPlaces||[]).find(p=>p.id===id):null;
  const p = ex || {name:'',sub:'',zone:(preset&&preset.zone)||'cn',lng:(preset&&preset.lng)||0,lat:(preset&&preset.lat)||0};
  document.getElementById('cmTitle').textContent = ex?'编辑自定义地点':'新增地点';
  document.getElementById('cmName').value=p.name||'';
  document.getElementById('cmSub').value=p.sub||'';
  const zsel=document.getElementById('cmZone');
  zsel.innerHTML=MAP_TABS.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
  zsel.value=p.zone||'cn';
  const hasCoord=(p.lng||p.lat);
  document.getElementById('cmCoord').textContent = hasCoord ? `📌 位置：经 ${p.lng.toFixed(2)}°，纬 ${p.lat.toFixed(2)}°` : '（未设定坐标）';
  const d=S.travel[p.id]||{};
  const vis = ex ? (!!d.visited) : (preset&&preset.visited);
  const visEl=document.getElementById('cmVisited'); visEl.checked=!!vis;
  document.getElementById('cmDate').value=d.date||'';
  _cmRating=d.rating||0;
  document.getElementById('cmRefl').value=d.refl||'';
  document.getElementById('cmDetail').style.display = vis?'block':'none';
  document.getElementById('cmDelete').style.display = ex?'inline-block':'none';
  renderCmStars();
  document.getElementById('customModal').style.display='flex';
}
function renderCmStars(){
  const el=document.getElementById('cmStars'); if(!el) return;
  el.innerHTML=[1,2,3,4,5].map(n=>`<span class="${n<=_cmRating?'on':''}" onclick="setCmRating(${n})">★</span>`).join('');
}
function setCmRating(n){ _cmRating=n; renderCmStars(); }
function saveCustomPlace(){
  const name=document.getElementById('cmName').value.trim();
  if(!name){ alert('请填写地点名称'); return; }
  const sub=document.getElementById('cmSub').value.trim();
  const zone=document.getElementById('cmZone').value;
  const visited=document.getElementById('cmVisited').checked;
  const date=document.getElementById('cmDate').value||'';
  const refl=document.getElementById('cmRefl').value||'';
  if(!S.customPlaces) S.customPlaces=[];
  let id=_cmId;
  if(id){
    const ex=S.customPlaces.find(p=>p.id===id);
    if(ex){ ex.name=name; ex.sub=sub; ex.zone=zone; }
  } else {
    id='c_'+Date.now();
    const lng=_cmPreset?_cmPreset.lng:0;
    const lat=_cmPreset?_cmPreset.lat:0;
    S.customPlaces.push({id,name,sub,region:'自定义',zone,lng,lat,wish:false});
  }
  if(visited){
    const d=S.travel[id]||{};
    d.visited=true; d.date=date||d.date||todayStr(); d.rating=_cmRating; d.refl=refl;
    S.travel[id]=d;
  } else if(S.travel[id]){
    S.travel[id].visited=false;
  }
  save(); closeCustomModal(); renderMap();
}
function deleteCustomPlace(){
  const id=_cmId||_pmId;
  if(!id || !(''+id).startsWith('c_')) return;
  if(!confirm('确定删除这个自定义地点？足迹记录也会一并清除。')) return;
  S.customPlaces=(S.customPlaces||[]).filter(p=>p.id!==id);
  delete S.travel[id];
  save(); closeCustomModal(); closePlaceEditor(); renderMap();
}
function closeCustomModal(){ _cmId=null; _cmPreset=null; const m=document.getElementById('customModal'); if(m) m.style.display='none'; }

/* ---------- 通用 checklist 渲染（年/月/周主线共用） ---------- */
let yearOpen = new Set();
function yearDone(i){ const c=S.year[i]; if(!c) return false; if(Array.isArray(c.items) && c.items.length>0) return c.items.every(x=>isDoneEver(x)); return !!c.done; }
function toggleYearOpen(i){ if(yearOpen.has(i))yearOpen.delete(i); else yearOpen.add(i); render(); }
function toggleYearDone(i){
  const c=S.year[i]; if(!c) return;
  c.done = !c.done;
  if(c.done) touchActivity(REC_DATE);
  addHist((c.done?'✔ ':'✘ ')+'[year]'+c.t, 0, REC_DATE);
  save(); checkAch(); render();
}
function checklistBlock(c,i,kind){
  const paused = !!c.paused && kind==='year';   // 仅年主线支持休眠折叠
  const d=REC_DATE||todayStr();
  const items = c.items||[];
  const doneEv = items.filter(x=>isDoneEver(x)).length;
  const total = items.length;
  const pct = total? doneEv/total*100 : 0;
  const collapsed = paused && !yearOpen.has(i);
  const isSimpleYear = kind==='year' && items.length===0;
  const head = paused
    ? `<span class="qt" onclick="toggleYearOpen(${i})">${c.t}<span class="ptag">⏸ 休眠</span></span>`
    : (isSimpleYear
        ? `<span style="display:inline-flex;align-items:center;cursor:pointer" onclick="toggleYearDone(${i})"><span style="display:inline-block;width:18px;height:18px;border:2px solid var(--line);border-radius:5px;text-align:center;line-height:15px;margin-right:8px">${c.done?'✔':''}</span><span class="qt">${c.t}</span></span>`
        : `<span class="qt" onclick="renameQuest('${kind}',${i})">${c.t}</span>`);
  const prog = paused?'—':(total?doneEv+'/'+total+' 项':(isSimpleYear?(c.done?'✅ 完成':'目标'):'暂无'));

  if(collapsed){
    return `<div class="qblock paused">
      <div class="qbtop">${head}<span class="qbp">${prog}</span></div>
      <div class="qbstep"><span class="note" onclick="toggleYearOpen(${i})">▶ 展开（休眠中 · 不计入当前进度，随时可复活）</span></div>
    </div>`;
  }
  if(items.length) items.sort((a,b)=>(isDone(a,d)?1:0)-(isDone(b,d)?1:0)); // 已完成（当前查看日期）排末尾（原地排序，保证 ii 与 c.items 对齐）
  const list=(total?items.map((x,ii)=>{
    const done=isDone(x,d);
    if(x.mode==='time'){
      const am=done?((x.mins&&x.mins[d])||x.min||0):0;
      const predMin=(!done&&x.mode==='time')?(x.rec||x.min||0):0;
      const predW=predMin*RATE*(S.weights[safeAttr(x.a)]||1);
      const mins=(x.mins&&x.mins[d])||'';
      return `<div class="qitem ${done?'done':''}" id="qi_${x.id}">
        <div class="chk"></div>
        <div class="qt">${x.t}</div>
        <div class="qmeta">
          ${recText(x)}
          <input type="number" id="min_${kind}_${i}_${ii}" value="${done?mins:''}" placeholder="${done?'再填则叠加':'分钟'}" min="1" style="width:58px">
          ${done?`<span class="qxp">+${am*RATE} XP（${ATTRS[safeAttr(x.a)].name}）</span><span class="qadd" onclick="addChecklistMin('${kind}',${i},${ii})" title="点一次：输入框有数字则按该值叠加；为空则按推荐 ${x.rec||x.min||10} min 叠加">+${x.rec||x.min||10}min</span>`:`<span class="qxp dim">预计 +${predW.toFixed(0)} 加权</span>`}
          <span style="color:${ATTRS[safeAttr(x.a)].color}">${ATTRS[safeAttr(x.a)].name}</span>
          ${done?`<span class="qdate">📅 ${fmtMD(lastDoneDate(x))}</span>`:''}
        </div>
        <button class="btn ghost sm" onclick="toggleChecklistItem('${kind}',${i},${ii})">${done?'撤销':'完成'}</button>
        <div class="qdel" onclick="delChecklistItem('${kind}',${i},${ii})" title="删除">×</div>
      </div>`;
    }
    return `<div class="qitem ${done?'done':''}" id="qi_${x.id}">
      <div class="chk" onclick="toggleChecklistItem('${kind}',${i},${ii})">${done?'✔':''}</div>
      <div class="qt">${x.t}</div>
      <div class="qmeta">
        <span class="qxp">+${x.xp} XP</span>
        ${x.min?`<span class="qmin">${x.min}min</span>`:''}
        ${recText(x)}
        <span style="color:${ATTRS[safeAttr(x.a)].color}">${ATTRS[safeAttr(x.a)].name}</span>
        ${done?`<span class="qdate">📅 ${fmtMD(lastDoneDate(x))}</span>`:''}
      </div>
      <div class="qdel" onclick="delChecklistItem('${kind}',${i},${ii})" title="删除">×</div>
    </div>`;
  }).join('') : '<div style="color:var(--dim);font-size:13px">暂无步骤，下面加一个。</div>');
  const add=`<div class="addrow">
    <input type="text" id="${kind}Text${i}" placeholder="新步骤…" style="flex:1 1 140px">
    <select id="${kind}Attr${i}">${optAttrs('CAREER')}</select>
    <select id="${kind}Mode${i}"><option value="time">时间驱动</option><option value="fixed">固定XP</option></select>
    <input type="number" id="${kind}Min${i}" value="30" min="0" title="分钟(时间驱动)" style="width:60px">
    <input type="number" id="${kind}Xp${i}" value="50" min="1" title="XP(固定)" style="width:60px">
    <button class="btn sm" onclick="addChecklistItem('${kind}',${i})">+ 步骤</button>
  </div>`;
  return `<div class="qblock ${paused?'paused':''}">
    <div class="qbtop">${head}<span class="qbp">${prog}</span></div>
    <div class="qbbar"><div class="qbf" style="width:${pct}%"></div></div>
    <div style="margin-top:8px">${list}</div>
    ${add}
  </div>`;
}
function toggleChecklistItem(kind,i,ii){
  const list = kind==='year'?S.year:(kind==='month'?S.month:S.week);
  const c = kind==='year'?list[i]:list; if(!c||!c.items||!c.items[ii])return;
  const x=c.items[ii]; const d=REC_DATE||todayStr();
  const was=isDone(x,d);
  if(x.mode==='time' && !was){
    const mv=parseInt(document.getElementById('min_'+kind+'_'+i+'_'+ii)?.value)||0;
    if(mv<=0){ alert('先填这次的时长（分钟）'); return; }
    x.mins=x.mins||{}; x.mins[d]=mv;
  }
  setDone(x,d,!was);
  const nowDone=!was;
  if(nowDone && !c.paused) touchActivity(d);
  const xp=itemXpAt(x,d);
  if(!c.paused){
    grant(x.a, xp, !nowDone);
  }
  addHist((nowDone?'✔ ':'✘ ')+'['+kind+']'+x.t+(c.paused?'（休眠·不计入进度）':'')+(x.mode==='time'&&x.mins&&x.mins[d]?(' '+h(x.mins[d])):''), c.paused?0:(nowDone?xp:-xp), d);
  if(nowDone && !c.paused){ newlyDone.push(x.id); floatXP('+'+weightedXpAt(x,d)+' XP','qi_'+x.id); const _cm=findCelebrate(x.t,x.a); if(_cm) celebrateTask(_cm);
    if(Math.random()<0.20){ const drp=dropReward(Math.random()<0.35?'big':'medium','完成大项：'+x.t); if(drp) setTimeout(()=>celebrateTask('🎁 嘉奖掉落：'+findReward(drp.rewardId).name),120); }
  }
  save();checkAch();render();
}
function addChecklistItem(kind,i){
  const t=document.getElementById(kind+'Text'+i).value.trim(); if(!t)return;
  const a=document.getElementById(kind+'Attr'+i).value;
  const mode=document.getElementById(kind+'Mode'+i).value;
  const min=parseInt(document.getElementById(kind+'Min'+i)?.value)||0;
  const xp=parseInt(document.getElementById(kind+'Xp'+i).value)||0;
  const list = kind==='year'?S.year:(kind==='month'?S.month:S.week);
  const c = kind==='year'?list[i]:list;
  if(!c.items) c.items=[];
  c.items.push({id:id(),t,a,xp:mode==='fixed'?xp:0,min:mode==='time'?min:0,mode,donedates:[],mins:{}});
  document.getElementById(kind+'Text'+i).value=''; save();render();
}
function delChecklistItem(kind,i,ii){
  const list = kind==='year'?S.year:(kind==='month'?S.month:S.week);
  const c = kind==='year'?list[i]:list;
  if(c&&c.items) c.items.splice(ii,1);
  save();render();
}

// chapterText() 已升级为 v5.17 章·卷制（见下方 VOLUMES / curVolume / chapterText）

function mondayOf(s){
  let [y,m,d]=s.split('-').map(Number);
  const dt=new Date(y, m-1, d);
  const day=(dt.getDay()+6)%7;          // 周一 = 0
  dt.setDate(dt.getDate()-day);
  const yy=dt.getFullYear(), mm=String(dt.getMonth()+1).padStart(2,'0'), dd=String(dt.getDate()).padStart(2,'0');
  return `${yy}-${mm}-${dd}`;
}
function isThisWeek(d){
  const today=todayStr();
  return d>=mondayOf(today) && d<=today;
}
function weeklyAttrMinutes(a){
  let m=0;
  [...S.daily,...S.weekly,...S.supps].forEach(q=>{
    if(safeAttr(q.a)!==a) return;
    if(!q.donedates) return;
    q.donedates.forEach(dd=>{ if(isThisWeek(dd)) m += (q.mins&&q.mins[dd])||0; });
  });
  return m;
}
function todayAttrStatus(a){
  const items=[...S.daily,...S.weekly].filter(q=>safeAttr(q.a)===a);
  const total=items.length;
  const done=items.filter(q=>isDone(q, todayStr())).length;
  return {total,done};
}
function renderLongterm(){
  const dpEl=document.getElementById('decadePlan');
  if(dpEl) dpEl.innerHTML=DECADE_PLAN.map(p=>`
    <div class="decade-row">
      <div class="decade-y">${p.y}</div>
      <div class="decade-t">${p.t}</div>
      <span class="decade-tag ${p.open?'open':''}">${p.open?'进行中':'待开启'}</span>
    </div>`).join('');

  const ylEl=document.getElementById('yearListLong');
  if(ylEl) ylEl.innerHTML=S.year.map((c,i)=>checklistBlock(c,i,'year')).join('')||'<div class="hint">还没有设定今年大道。</div>';
  try{ renderMonthPlanEdit(); }catch(e){ console.warn('monthPlanEdit',e); }
  try{ renderDayunNote(); }catch(e){ console.warn('dayunNote',e); }
}
function switchLtTab(tab){
  const order=['month','year','decade'];
  order.forEach(t=>{
    const p=document.getElementById('lt'+t.charAt(0).toUpperCase()+t.slice(1));
    if(p) p.style.display=(t===tab)?'block':'none';
  });
  // tab on-state：先清全部，再给当前加；避免累积选择
  const tabs=document.querySelectorAll('#ltTabs .tab');
  tabs.forEach(b=>b.classList.remove('on'));
  const idx=order.indexOf(tab);
  if(idx>=0 && tabs[idx]) tabs[idx].classList.add('on');
  try{ renderMonthPlanEdit(); }catch(e){}
}
function renderMonthPlanEdit(){
  const el=document.getElementById('monthPlanEdit'); if(!el) return;
  const yk = String(new Date().getFullYear());
  const yrPlans = (S.monthPlansByYear && S.monthPlansByYear[yk]) || {};
  const mk = thisMonth();
  const nowMM = parseInt(mk.slice(5,7),10);
  const selFor=(v,r)=>'<option value="'+v+'"'+(r.status===v?' selected':'')+'>'+v+'</option>';
  const monthLabel=['一','二','三','四','五','六','七','八','九','十','十一','十二'];
  const statusChip=(st)=>{
    if(st==='done')return'<span class="mp-chip mp-done">✔ 达成</span>';
    if(st==='part')return'<span class="mp-chip mp-part">◐ 部分</span>';
    if(st==='miss')return'<span class="mp-chip mp-miss">✘ 未达</span>';
    return'<span class="mp-chip mp-todo">— 待评</span>';
  };
  let html='<div class="lt-hint">12 个月日历 · 当前月高亮，过去月置灰，未来月可预先填「预期主线」。月底集中回填「实际」与「复盘」。</div>';
  html+='<div class="mp-year">'+yk+' 年</div>';
  html+='<div class="mp-grid">';
  for(let m=1;m<=12;m++){
    const k = yk+'-'+(m<10?'0'+m:m);
    const r = yrPlans[k] || {plan:'',actual:'',status:'',reason:''};
    const past = m<nowMM;
    const cur = m===nowMM;
    const future = m>nowMM;
    const cls = 'mp-cell'+(past?' mp-past':'')+(cur?' mp-cur':'')+(future?' mp-future':'')+((r.plan||r.actual||r.reason)?' mp-has':'');
    const head = '<div class="mp-head"><span class="mp-label">'+monthLabel[m-1]+'月</span>'+statusChip(r.status)+'</div>';
    let body;
    if(past){
      // 过去月：折叠显示。有 plan/actual/reason 任意一行才展开
      const has = r.plan||r.actual||r.reason;
      body = has
        ? ('<div class="mp-past-detail">'
          +(r.plan?'<div class="mp-past-line"><b>预期</b>'+escHtml(r.plan)+'</div>':'')
          +(r.actual?'<div class="mp-past-line"><b>实际</b>'+escHtml(r.actual)+'</div>':'')
          +(r.reason?'<div class="mp-past-line"><b>复盘</b>'+escHtml(r.reason)+'</div>':'')
          +'</div>')
        : '<div class="mp-empty">— 未填 —</div>';
    } else if (cur) {
      body = '<div class="mp-form">'
        + '<label class="lt-lab">预期主线</label>'
        + '<textarea class="lt-ta" id="mPlan" placeholder="本月想推进什么（一句话）">'+escHtml(r.plan)+'</textarea>'
        + '<label class="lt-lab">实际推进</label>'
        + '<textarea class="lt-ta" id="mActual" placeholder="月底回填">'+escHtml(r.actual)+'</textarea>'
        + '<label class="lt-lab">达成情况</label>'
        + '<select class="lt-sel" id="mStatus">'+selFor('',r)+selFor('done',r)+selFor('part',r)+selFor('miss',r)+'</select>'
        + '<label class="lt-lab">原因 / 复盘</label>'
        + '<textarea class="lt-ta" id="mReason" placeholder="为什么达成 / 没达成？下月怎么调">'+escHtml(r.reason)+'</textarea>'
        + '<div class="mp-actions"><button class="btn sm" onclick="saveMonthPlan()">💾 保存本月复盘</button></div>'
        + '</div>';
    } else {
      // 未来月：只填预期
      body = '<div class="mp-future-form">'
        + '<label class="lt-lab">预期主线</label>'
        + '<textarea class="lt-ta" id="mPlan_'+k+'" placeholder="提前写下个月想推进什么">'+escHtml(r.plan)+'</textarea>'
        + '<div class="mp-actions"><button class="btn sm" onclick="saveMonthPlanKey(\''+k+'\')">💾 保存</button></div>'
        + '<div class="mp-mute">实际 / 复盘 到 '+monthLabel[m-1]+' 月再看</div>'
        + '</div>';
    }
    html += '<div class="'+cls+'" data-mp="'+k+'">'+head+body+'</div>';
  }
  html += '</div>';
  el.innerHTML = html;
}
function saveMonthPlan(){
  // 当前月快捷保存（与未来月 saveMonthPlanKey 复用同一存储）
  saveMonthPlanKey(thisMonth());
}
function saveMonthPlanKey(key){
  if(!key) return;
  const yk = key.slice(0,4);
  if(!S.monthPlansByYear) S.monthPlansByYear = {};
  if(!S.monthPlansByYear[yk]) S.monthPlansByYear[yk] = {};
  const mkKey = key.slice(5,7);
  const prefix = (key===thisMonth()) ? 'm' : 'mPlan_'+key;
  const getEl = id => document.getElementById(id);
  const cur = S.monthPlansByYear[yk][key] || (S.monthPlansByYear[yk][key]={plan:'',actual:'',status:'',reason:''});
  const planEl = getEl('mPlan_'+key) || getEl('mPlan');
  if(planEl) cur.plan = planEl.value;
  if(key===thisMonth()){
    const aEl = getEl('mActual'); if(aEl) cur.actual = aEl.value;
    const sEl = getEl('mStatus'); if(sEl) cur.status = sEl.value;
    const rEl = getEl('mReason'); if(rEl) cur.reason = rEl.value;
  }
  save(); render();
}
function renderDayunNote(){
  const el=document.getElementById('dayunNote'); if(!el) return;
  const y=new Date().getFullYear();
  const cur=DAYUN.find(d=>y>=d.y0 && y<d.y1);
  if(!cur){ el.innerHTML=''; return; }
  el.innerHTML='<b>当前 '+cur.n+'运（'+cur.y0+'–'+cur.y1+'）</b><br>'+escHtml(cur.note)
    +'<br><span class="dy-yi">宜 · '+escHtml(cur.yi)+'</span> ｜ <span class="dy-ji">忌 · '+escHtml(cur.ji)+'</span>';
}
function escHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ---------- v5.22 今日驾驶舱：一个主线、三张命运签、状态自适应 ---------- */
const TODAY_WEATHERS=[
  {ic:'🌊',n:'灵感潮汐',d:'心流行动更容易进入状态，先做一点喜欢的。',attr:'MIND'},
  {ic:'⚔️',n:'破局之日',d:'把最抗拒的事缩小后开始，行动本身就是胜利。',attr:'CAREER'},
  {ic:'🌿',n:'回春细雨',d:'恢复优先；拉伸、散步和早睡同样算推进。',attr:'BODY'},
  {ic:'🏸',n:'风羽相助',d:'身体记得每一次练习，今天适合碰一碰球。',attr:'BADMINTON'},
  {ic:'🕯️',n:'灯火平稳',d:'不求爆发，只求让最重要的事向前一寸。',attr:''},
  {ic:'☁️',n:'云深路缓',d:'允许减量。完成保底版，便算安然过关。',attr:'BODY'},
  {ic:'✨',n:'星落有声',d:'留意偶然出现的人、念头和小机会。',attr:'MIND'},
];
function seededIndex(key,len){ let h=2166136261>>>0; for(let i=0;i<key.length;i++) h=Math.imul(h^key.charCodeAt(i),16777619)>>>0; return h%len; }
function ensureTodayPlan(){
  const d=todayStr();
  if(!S.todayPlan || typeof S.todayPlan!=='object' || S.todayPlan.date!==d) S.todayPlan={date:d,focusId:'',mode:'normal',fateChoice:'',settled:[]};
  if(!Array.isArray(S.todayPlan.settled)) S.todayPlan.settled=[];
  return S.todayPlan;
}
function cockpitCandidates(){
  const d=todayStr(), out=[];
  (S.daily||[]).forEach(x=>out.push({id:x.id,t:x.t,a:safeAttr(x.a),done:isDone(x,d),min:x.rec||x.min||0,src:'固定'}));
  (S.sideDaily||[]).forEach(x=>out.push({id:x.id,t:x.t,a:safeAttr(x.a),done:!!x.done,min:x.min||0,src:'随机'}));
  (((S.npc||{}).active)||[]).forEach(x=>out.push({id:x.id,t:x.t,a:safeAttr(x.a),done:!!x.done,min:x.min||0,src:'委托'}));
  return out;
}
function ensureTaskView(){if(!S.taskView||S.taskView.date!==todayStr())S.taskView={date:todayStr(),compact:false};return S.taskView;}
function adaptivePicks(){
  const all=cockpitCandidates().filter(x=>!x.done),focus=cockpitFocus(),e=energyState(),out=[];
  const add=x=>{if(x&&!out.some(y=>y.id===x.id))out.push(x);}; add(focus);
  if(e.v<50)add(all.find(x=>x.a==='BODY'));
  add(all.find(x=>x.a!==(focus&&focus.a))); all.forEach(add); return out.slice(0,3);
}
function lowFollowTask(){
  const ds=[];for(let i=0;i<14;i++)ds.push(shiftDate(todayStr(),-i));
  return (S.daily||[]).filter(x=>x.mode==='time'||x.min||x.rec).map(x=>({x,n:ds.filter(d=>isDone(x,d)).length})).sort((a,b)=>a.n-b.n)[0]||null;
}
function toggleCompactTaskView(){const v=ensureTaskView();v.compact=!v.compact;save();renderLoadAdvisor();}
function shrinkDailyTask(idv){
  const x=(S.daily||[]).find(q=>q.id===idv);if(!x)return;const old=parseInt(x.rec||x.min||10),next=Math.max(5,Math.round(old/2/5)*5);x.rec=next;if(x.min)x.min=next;addHist('🪶 减负：'+x.t+' 调整为 '+next+' 分钟');save();render();celebrateTask('🪶 已把任务缩小到 '+next+' 分钟');
}
function renderLoadAdvisor(){
  const el=document.getElementById('loadAdvisorBox');if(!el)return;const v=ensureTaskView(),all=cockpitCandidates().filter(x=>!x.done),picks=adaptivePicks(),allowed=new Set(picks.map(x=>x.id)),e=energyState(),mins=all.reduce((s,x)=>s+(parseInt(x.min)||15),0),low=lowFollowTask();
  const reason=e.v<50?'精力偏低，今天优先保留恢复任务。':(mins>180?'待办预计较多，先收束到三件即可。':'当前负荷尚可，仍可随时切换到三件模式。');
  el.innerHTML='<div class="load-head"><div><div class="load-title">🪶 今日减负官</div><div class="load-summary">待办 '+all.length+' 项 · 预计约 '+h(mins)+' · '+reason+'</div></div><button class="btn sm '+(v.compact?'primary':'ghost')+'" onclick="toggleCompactTaskView()">'+(v.compact?'退出三件模式':'只看今日三件')+'</button></div>'
    +'<div class="load-picks">'+(picks.length?picks.map((x,i)=>'<span class="load-pick">'+(i===0?'主线':'支线')+' · '+escHtml(x.t)+'</span>').join(''):'<span class="load-pick">今天已经没有待办，可以收工。</span>')+'</div>'
    +(low&&low.n<=2?'<div class="load-tip">连续 14 天里，「'+escHtml(low.x.t)+'」只完成了 '+low.n+' 次。也许不是你不自律，而是任务太大。'+((low.x.mode==='time'||low.x.min||low.x.rec)?' <button class="btn xs ghost" onclick="shrinkDailyTask(\''+low.x.id+'\')">缩小为一半</button>':'')+'</div>':'')
    +(v.compact?'<div class="load-quiet">安静模式已开启：其余任务只是暂时隐藏，随时可以恢复，不会删除或暂停。</div>':'');
  ['dailyList','sideDailyList','npcBox'].forEach(idv=>{const box=document.getElementById(idv);if(!box||!box.querySelectorAll)return;box.querySelectorAll('.qitem,.npcq').forEach(row=>row.classList.toggle('load-hidden',v.compact&&!allowed.has((row.id||'').replace(/^qi_/,''))));});
}
function cockpitFocus(){
  const p=ensureTodayPlan(), items=cockpitCandidates();
  let q=items.find(x=>x.id===p.focusId && !x.done);
  if(!q){
    const e=energyState();
    const preferred=e.v<50?'BODY':'CAREER';
    q=items.find(x=>!x.done&&x.a===preferred) || items.find(x=>!x.done&&x.id===S.mainQ) || items.find(x=>!x.done) || null;
    p.focusId=q?q.id:'';
  }
  return q;
}
function setTodayFocus(fid){ const p=ensureTodayPlan(); p.focusId=fid||''; save(); renderTodayCockpit(); }
function setTodayMode(mode){ const p=ensureTodayPlan(); p.mode=mode==='minimum'?'minimum':'normal'; save(); renderTodayCockpit(); }
function chooseTodayFate(key){
  const p=ensureTodayPlan(); p.fateChoice=(p.fateChoice===key?'':key);
  S.story=S.story||{lastDate:'',lastFate:'',history:[]}; S.story.lastDate=todayStr(); S.story.lastFate=p.fateChoice;
  if(p.fateChoice){ S.story.history=S.story.history||[]; S.story.history.push({d:todayStr(),f:p.fateChoice}); if(S.story.history.length>60) S.story.history=S.story.history.slice(-60); }
  save(); renderTodayCockpit();
}
const FATE_ECHOES={
  break:{ic:'⚔️',n:'昨日余波 · 剑已出鞘',d:'昨天你选择了破局。今天不必再猛烈，只要确认那道口子仍然开着。'},
  repair:{ic:'🧵',n:'昨日余波 · 裂隙已补',d:'昨天你修补了一处生活。留意今天是否因此少了一点隐形阻力。'},
  wander:{ic:'🎐',n:'昨日余波 · 风仍在吹',d:'昨天你把时间还给了喜欢。那不是绕路，而是在提醒自己为何出发。'},
};
function fateEcho(){
  const s=S.story||{}, d=s.lastDate; if(!d||!s.lastFate||d>=todayStr()) return null;
  const gap=Math.round((new Date(todayStr()+'T00:00:00')-new Date(d+'T00:00:00'))/86400000);
  return gap===1?FATE_ECHOES[s.lastFate]:null;
}
function cycleTodayFocus(){
  const p=ensureTodayPlan(), items=cockpitCandidates().filter(x=>!x.done); if(!items.length) return;
  const i=items.findIndex(x=>x.id===p.focusId); p.focusId=items[(i+1)%items.length].id; save(); renderTodayCockpit();
}
function renderTodayCockpit(){
  const el=document.getElementById('todayCockpit'); if(!el) return;
  const p=ensureTodayPlan(), e=energyState(), q=cockpitFocus();
  const weather=TODAY_WEATHERS[seededIndex(todayStr(),TODAY_WEATHERS.length)];
  const echo=fateEcho();
  if(e.v<30 && p.mode!=='minimum') p.mode='minimum';
  const minimum=p.mode==='minimum';
  const baseMin=q?(parseInt(q.min)||25):0;
  const suggested=q?(minimum?Math.max(5,Math.min(15,baseMin||15)):(e.v<50?Math.max(10,Math.min(25,baseMin||25)):(baseMin||30))):0;
  const fates=[
    {k:'break',ic:'⚔️',n:'破局',d:'处理一件抗拒的小事 15 分钟'},
    {k:'repair',ic:'🧹',n:'修补',d:'解决一个拖延已久的小问题'},
    {k:'wander',ic:'🎐',n:'游心',d:'做一件纯粹因为喜欢的事'},
  ];
  el.innerHTML='<div class="tc-head"><div><div class="tc-kicker">TODAY · 今日一局</div><div class="tc-title">'+(minimum?'保底修行':'今日驾驶舱')+'</div><div class="tc-date">'+fmtFull(new Date())+'</div></div>'
    +'<div class="tc-energy '+e.cls+'"><span>精力 · '+e.label+'</span><b>'+e.v+'</b></div></div>'
    +'<div class="tc-world"><div class="tc-world-ic">'+weather.ic+'</div><div><b>'+weather.n+'</b><span>'+weather.d+'</span></div></div>'
    +(echo?'<div class="tc-echo"><div>'+echo.ic+'</div><div><b>'+echo.n+'</b><span>'+echo.d+'</span></div></div>':'')
    +momentumHtml()
    +'<div class="tc-focus"><div class="tc-focus-top"><span class="tc-label">'+(q?'今日唯一主线 · '+q.src:'今日已无待办主线')+'</span>'+(q?'<button class="btn ghost xs" onclick="cycleTodayFocus()">换一条</button>':'')+'</div>'
    +'<div class="tc-main">'+(q?escHtml(q.t):'灯火已安，余下时间归你自己。')+'</div>'
    +'<div class="tc-meta">'+(q?(minimum?'保底版 · 只做 '+suggested+' 分钟，不必补齐清单':('建议投入 '+suggested+' 分钟 · '+ATTRS[q.a].icon+' '+ATTRS[q.a].name)):'今天可以直接结算或安心休息')+'</div>'
    +'<div class="tc-actions">'+(q?'<button class="btn sm" onclick="showPage(\'current\')">▶ 开始主线</button>':'<button class="btn sm" onclick="showBrief(todayStr())">查看今日战报</button>')
    +'<button class="btn ghost sm" onclick="setTodayMode(\''+(minimum?'normal':'minimum')+'\')">'+(minimum?'恢复普通模式':'今天只保底')+'</button></div></div>'
    +'<div class="tc-fates-label">命运之签 · 可选一张，也可以一张都不选</div><div class="tc-fates">'
    +fates.map(x=>'<button class="tc-fate '+(p.fateChoice===x.k?'on':'')+'" onclick="chooseTodayFate(\''+x.k+'\')"><b>'+x.ic+' '+x.n+(p.fateChoice===x.k?' · 已选':'')+'</b><span>'+x.d+'</span></button>').join('')+'</div>'
    +'<div class="tc-foot">系统会记住今天的选择；明天自动翻开新的一局。</div>';
}

const SETTLE_STORIES={
  BADMINTON:['拍线轻响，身体又记住了一点。真正的进步往往发生在没人鼓掌的时候。','风从球网两侧穿过。今天的这一拍，会留在下一次更从容的移动里。'],
  CAREER:['局面并没有突然改变，但你已经不是停在原地的那个人。','门未必立刻打开。可你今天确实走到了门前，并敲了一次。'],
  BODY:['身体收到了你的照顾。恢复不是退场，而是在为下一次出发蓄力。','你没有把身体当作工具，而是当作同行者。这本身就是修行。'],
  MIND:['这一小段时间没有用于证明什么，却让内心重新有了回声。','世界安静了一会儿，你又听见了自己的声音。'],
};
const FATE_NAMES={break:'⚔️ 破局之签',repair:'🧹 修补之签',wander:'🎐 游心之签'};
function settlementStory(attr,idv){ const pool=SETTLE_STORIES[attr]||SETTLE_STORIES.MIND; return pool[seededIndex(todayStr()+idv,pool.length)]; }
const MOMENTUM_STEPS=[{n:'起势',v:3,xp:5},{n:'入流',v:5,xp:10},{n:'成章',v:8,xp:20}];
function ensureDayRun(){
  if(!S.dayRun||S.dayRun.date!==todayStr()) S.dayRun={date:todayStr(),ids:[],milestones:[],epilogue:''};
  S.dayRun.ids=S.dayRun.ids||[]; S.dayRun.milestones=S.dayRun.milestones||[]; return S.dayRun;
}
function recordDailyMomentum(info){
  const r=ensureDayRun(); if(!info||!info.id||r.ids.includes(info.id))return;
  r.ids.push(info.id);
  MOMENTUM_STEPS.forEach(s=>{if(r.ids.length>=s.v&&!r.milestones.includes(s.v)){r.milestones.push(s.v);S.bonusXP=(S.bonusXP||0)+s.xp;addHist('🔥 今日连携「'+s.n+'」 · '+s.v+' 项不同的行动 +'+s.xp+' XP',s.xp);setTimeout(()=>celebrateTask('🔥 '+s.v+' 连携 · '+s.n+'！'),260);}});
  save(); try{renderTodayCockpit();}catch(e){}
}
function dayEpilogueText(){
  const r=ensureDayRun(), n=r.ids.length, fate=ensureTodayPlan().fateChoice;
  const pools={break:['你没有等局面松动，而是亲手推开了一小段路。','今日的锋芒不在声势，而在一次次真正落地。'],repair:['你拾起散落的小事，把生活重新缝得结实了一点。','今天没有惊天动地，却有许多东西回到了应在的位置。'],wander:['你为好奇心留了门，今日因此有了意料之外的风。','你没有把每一步都拿去交换结果，于是听见了生活本身。'],none:['你做完一件，再做一件，普通的一天因此有了章法。','灯火没有骤然变亮，但你让它稳稳地燃了一整段路。']};
  const a=pools[fate||'none']; return a[seededIndex(todayStr()+n,a.length)]+'（今日 '+n+' 连携）';
}
function sealDayEpilogue(){
  const r=ensureDayRun(); if(r.ids.length<3||r.epilogue)return; r.epilogue=dayEpilogueText(); S.bonusXP=(S.bonusXP||0)+10; addHist('📖 封存今日篇章：'+r.epilogue,10); save(); render(); celebrateTask('📖 今日已成一章 · +10 XP');
}
function momentumHtml(){
  const r=ensureDayRun(), n=r.ids.length;
  return '<div class="tc-momentum"><div class="tc-mom-head"><b>🔥 今日连携 · '+n+'</b><span>'+(n<3?'再完成 '+(3-n)+' 项不同的行动即可起势':n<5?'连携已起势':n<8?'行动正在入流':'今日已成章')+'</span></div><div class="tc-mom-track">'+MOMENTUM_STEPS.map(s=>'<i class="tc-mom-node '+(n>=s.v?'on':'')+'"></i>').join('')+'</div><div class="tc-mom-labels">'+MOMENTUM_STEPS.map(s=>'<span>'+s.v+' · '+s.n+'</span>').join('')+'</div>'+(r.epilogue?'<div class="tc-epilogue">📖 '+r.epilogue+'</div>':(n>=3?'<div class="tc-mom-action"><button class="btn ghost xs" onclick="sealDayEpilogue()">封存今日篇章 · +10 XP</button></div>':''))+'</div>';
}
function showQuestSettlement(info){
  if(!info||!info.id) return;
  recordDailyMomentum(info);
  const p=ensureTodayPlan();
  const important=info.force || p.focusId===info.id || p.settled.length===0;
  if(!important || p.settled.includes(info.id)) return;
  p.settled.push(info.id); save();
  const body=document.getElementById('settleBody'), mask=document.getElementById('settleMask'); if(!body||!mask) return;
  const attr=safeAttr(info.attr), a=ATTRS[attr], mins=Math.max(0,Math.round(info.mins||0)), xp=Math.max(0,Math.round(info.xp||0));
  const focusDone=!!info.focusDone || p.focusId===info.id;
  body.innerHTML='<div class="st-kicker">QUEST CLEAR · 行动结算</div><div class="st-title">'+(focusDone?'今日主线推进':'一程已落定')+'</div>'
    +'<div class="st-quest">'+a.icon+' '+escHtml(info.text||'今日行动')+'</div>'
    +'<div class="st-stats"><div class="st-stat"><b>'+(mins?mins:'—')+'</b><span>投入分钟</span></div><div class="st-stat"><b>+'+xp+'</b><span>获得经验</span></div><div class="st-stat"><b>'+energyState().v+'</b><span>当前精力</span></div></div>'
    +'<div class="st-story">'+settlementStory(attr,info.id)+'</div>'
    +(p.fateChoice?'<div class="st-fate">今日同行：'+FATE_NAMES[p.fateChoice]+'</div>':'')
    +'<div class="st-actions"><button class="btn ghost sm" onclick="closeQuestSettlement();showPage(\'dashboard\')">回到今日</button><button class="btn sm" onclick="closeQuestSettlement()">收下成果</button></div>';
  mask.style.display='flex';
}
function closeQuestSettlement(){ const m=document.getElementById('settleMask'); if(m) m.style.display='none'; }

function render(){
  // 兜底：旧存档缺 hobbies / wishes 字段时补默认
  if(!Array.isArray(S.hobbies) || !S.hobbies.length) S.hobbies = defaultHobbies();
  if(!Array.isArray(S.wishes) || !S.wishes.length) S.wishes = defaultWishes();
  if(!Array.isArray(S.trend)) S.trend=[];
  // header
  const gxp=overallXP();
  const gL=lvlOf(gxp);
  if(gL>lastLevel){
    const up=gL; setTimeout(()=>celebrate(up),80);
    const span=gL-lastLevel;
    const drp=dropReward(span>=3?'big':(span>=2?'medium':'small'), '境界突破 Lv.'+up);
    if(drp) renderLoot();
  }
  lastLevel=gL;
  document.getElementById('lvlNum').textContent='Lv.'+gL;
  document.getElementById('realmLvl').textContent='Lv.'+gL;
  document.getElementById('chapterText').textContent=chapterText();
  const gi=xpInLvl(gxp);
  document.getElementById('xpFill').style.width=gi.pct+'%';
  document.getElementById('xpText').textContent=`${gi.xp} / ${gi.need} 加权经验`;
  const _td=new Date().toISOString().slice(0,10);
  const _y=new Date(Date.now()-86400000).toISOString().slice(0,10);
  document.getElementById('streakNum').textContent=computeStreak();
  const recLabel = REC_DATE ? `<span class="recbadge">补录 ${fmtMD(REC_DATE)}</span>` : '';
  document.getElementById('todayDate').innerHTML=`<div class="d">${fmtFull(new Date())}</div><div class="w">${_td}</div>${recLabel}`;
  document.getElementById('nextPerk').textContent=`升级特权：Lv.${gL+1}`;
  if(!SAVE_OK) document.getElementById('saveWarn').style.display='block';
  const inh=inheritedXP();
  const _hi=document.getElementById('histInherit'); if(_hi) _hi.innerHTML='含历史继承底分 ≈ <b style="color:var(--gold)">'+inh.toFixed(0)+'</b> 加权XP（iHour 终身 4234h 折算 · 羽毛球 '+HISTORY_HOURS.BADMINTON+'h / 职业 '+HISTORY_HOURS.CAREER+'h / 身体健康 '+HISTORY_HOURS.BODY+'h / 精神享受 '+HISTORY_HOURS.MIND+'h）。每日打卡在此基础上继续累加。';
  const _wh=document.getElementById('weightHint'); if(_wh) _wh.innerHTML='整体等级 = 四大领域活跃经验（按权重汇总）+ 历史继承底分：'+Object.keys(ATTRS).map(k=>`${ATTRS[k].name} ×${S.weights[k]}`).join(' ＞ ')+'。优先做高权重版块升得更快；历史底分来自你已投入的 4234 小时，不随每日打卡变化。';

  // 成长页顶部等级条（与 dashboard 等级条同源，写到 growth 页专属 id）
  try{ renderGrowthLevel(); }catch(e){ console.warn('growth level',e); }

  // dashboard 摘要卡片
  try{ renderTodayCockpit(); }catch(e){ console.warn('today cockpit',e); }
  const mq=[...S.daily,...S.weekly].find(x=>x.id===S.mainQ);
  const d=todayStr();
  const wk=S.week.items||[], wkDone=wk.filter(x=>isDoneEver(x)).length;
  const mo=S.month.items||[], moDone=mo.filter(x=>isDoneEver(x)).length;
  let yearTotal=0, yearDoneCount=0;
  S.year.forEach((c,i)=>{ if(!c.paused){ yearTotal++; if(yearDone(i)) yearDoneCount++; } });

  // 今日行动摘要（固定日常 + 随机日行 + 四方委托，混合、未完成优先）
  const dashDaily = [
    ...S.daily.map(x=>({tag:'固定',t:x.t,done:isDone(x,d),xp:itemXpAt(x,d)})),
    ...S.sideDaily.map(x=>({tag:'随机',t:x.t,done:x.done,mand:x.mandatory})),
    ...(S.npc.active||[]).map(x=>({tag:'委托',t:x.t,done:x.done,xp:x.xp})),
  ].sort((a,b)=>(a.done?1:0)-(b.done?1:0)).slice(0,6);
  document.getElementById('dashDaily').innerHTML = dashDaily.length
    ? dashDaily.map(x=>`<div class="dash-row ${x.done?'done':''}"><span>${x.done?'✔ ':''}<b class="dtag dtag-${x.tag==='固定'?'fix':x.tag==='随机'?'rnd':'npc'}">${x.tag}</b>${x.t}</span><span class="dr-xp">${x.mand?'🔴':(x.xp?('+'+x.xp):'')}</span></div>`).join('')
    : '<div class="dash-empty">今日暂无安排</div>';

  // 本周任务摘要（随机周游 + 手动周目标）
  const dashWeekly = [
    ...S.sideWeekly.map(x=>({tag:'随机',t:x.t,done:x.done,mand:x.mandatory})),
    ...S.weekly.map(x=>({tag:'目标',t:x.t,done:isDoneEver(x)})),
  ].sort((a,b)=>(a.done?1:0)-(b.done?1:0)).slice(0,6);
  document.getElementById('dashWeekly').innerHTML = dashWeekly.length
    ? dashWeekly.map(x=>`<div class="dash-row ${x.done?'done':''}"><span>${x.done?'✔ ':''}<b class="dtag dtag-${x.tag==='随机'?'rnd':'goal'}">${x.tag}</b>${x.t}</span><span class="dr-xp">${x.mand?'🔴':''}</span></div>`).join('')
    : '<div class="dash-empty">本周暂无安排</div>';

  // （江湖轶事已改为纯任务生成器，dashSide 面板已移除）

  // 月 / 年主线摘要
  document.getElementById('dashMonth').innerHTML = `<div class="dash-row"><span>${S.month.t}</span><span class="dr-xp">${moDone}/${mo.length}</span></div>
    <div class="dash-mini">${S.month.items.slice(0,4).map(x=>`<span class="${isDoneEver(x)?'on':''}">${isDoneEver(x)?'✔ ':''}${x.t}</span>`).join('')}</div>`;
  document.getElementById('dashYear').innerHTML = S.year.length
    ? `<div class="dash-row"><span>今年大道 · ${yearDoneCount}/${yearTotal} 完成</span></div>
       <div class="dash-mini">${S.year.filter(c=>!c.paused).slice(0,4).map((c,i)=>`<span class="${yearDone(i)?'on':''}">${yearDone(i)?'✔ ':''}${c.t}</span>`).join('')}</div>`
    : '<div class="dash-empty">还没有设定今年大道</div>';

  // 徽章摘要 + 人生愿望 + 兴趣爱好
  const unlocked = S.ach.filter(a=>a.un);
  const hobActive = (S.hobbies||[]).filter(x=>x.st==='active').map(x=>x.n);
  const wishesOn = (S.wishes||[]).filter(w=>w.un).map(w=>w.t);
  let badgesHtml = unlocked.length
    ? `<div class="dash-mini">${unlocked.slice(0,8).map(a=>`<span class="on">${a.ic} ${a.n}</span>`).join('')}${unlocked.length>8?'<span>+'+(unlocked.length-8)+'</span>':''}</div>`
    : '<div class="dash-empty">还没有点亮徽章</div>';
  if(wishesOn.length){
    badgesHtml += `<div class="dash-row" style="margin-top:8px;font-size:12px;color:var(--dim)"><span>🌟 愿望</span><span style="color:var(--grw);font-weight:600">${wishesOn.slice(0,6).join(' · ')}${wishesOn.length>6?' · +'+(wishesOn.length-6):''}</span></div>`;
  }
  badgesHtml += hobActive.length
    ? `<div class="dash-row" style="margin-top:6px;font-size:12px;color:var(--dim)"><span>兴趣</span><span style="color:var(--txt)">${hobActive.join(' · ')}</span></div>`
    : '';
  document.getElementById('dashBadges').innerHTML = badgesHtml;

  // 资金摘要：当前家产（净资产）+ 今年利润
  const year=new Date().getFullYear().toString();
  const A=S.assets||ASSETS_TEMPLATE;
  const _ha=!!S.assets;
  const yearIncome=S.ledger.filter(x=>x.type==='income'&&x.date&&x.date.startsWith(year)).reduce((s,x)=>s+x.amount,0);
  const yearExpense=S.ledger.filter(x=>x.type==='expense'&&x.date&&x.date.startsWith(year)).reduce((s,x)=>s+x.amount,0);
  const yearProfit=yearIncome-yearExpense;
  const _B=LEDGER_BASELINE; const _yB=_B.byYear[year]||{income:0,expense:0}; const _yp=_yB.income-_yB.expense;
  const _netTxt=_ha?('¥'+A.net.toFixed(2)):'未录入';
  if(S.ledger.length){
    document.getElementById('dashLedger').innerHTML = `<div class="dash-row"><span>当前家产</span><span style="color:var(--grw)">${_netTxt}</span></div>
       <div class="dash-row"><span>今年利润</span><span style="color:${yearProfit>=0?'var(--grw)':'var(--warn)'}">${yearProfit>=0?'+':''}¥${yearProfit.toFixed(2)}</span></div>`;
  } else if(typeof LEDGER_BASELINE!=='undefined'){
    document.getElementById('dashLedger').innerHTML = `<div class="dash-row"><span>当前家产</span><span style="color:var(--grw)">${_netTxt}</span></div>
       <div class="dash-row"><span>${year} 利润</span><span style="color:${_yp>=0?'var(--grw)':'var(--warn)'}">${_yp>=0?'+':''}¥${_yp.toFixed(2)}</span></div>
       <div class="hint" style="margin-top:6px">账户快照 ${_ha?A.date:'未录入'} · 历史基线 ${_B.range}</div>`;
  } else {
    document.getElementById('dashLedger').innerHTML = `<div class="dash-empty">暂无账本数据</div><div class="hint" style="margin-top:6px">进入钱庄导入随手记 xlsx</div>`;
  }

  // 四系当前状态（仪表盘）
  document.getElementById('catStatus').innerHTML=Object.keys(ATTRS).map(k=>{
    const L=lvlOf(S.attrs[k]); const r=xpInLvl(S.attrs[k]);
    const wkMin=weeklyAttrMinutes(k);
    const ts=todayAttrStatus(k);
    const doneToday = ts.done>0;
    const chip = doneToday? '今日精进' : (ts.total>0?'待修':'待启');
    const chipCls = doneToday?'cat-on':(ts.total>0?'cat-wait':'cat-idle');
    return `<div class="cat">
      <div class="cat-head"><span class="cat-ic">${ATTRS[k].icon}</span><span class="cat-name">${ATTRS[k].name}</span><span class="cat-lv">Lv.${L}</span><span class="cat-chip ${chipCls}">${chip}</span></div>
      <div class="cat-bar"><div class="cat-bf" style="width:${r.pct}%;background:${ATTRS[k].color}"></div></div>
      <div class="cat-meta">本周 <b>${h(wkMin)}</b> · 今日 <b>${ts.done}/${ts.total}</b> 项</div>
      <div class="cat-desc">${ATTRS[k].desc}</div>
    </div>`;
  }).join('');

  // 人生地图
  renderMap();
  // 战利品（装备 / 嘉奖）
  renderLoot();

  // lists: 日常 / 补剂 / 手动周目标 / 随机日行 / 随机周游 / 月行 / 账本
  document.getElementById('dailyList').innerHTML=listHtml(S.daily,'daily');
  document.getElementById('suppList').innerHTML=listHtml(S.supps,'supps');
  const wgEl=document.getElementById('weeklyGoalList'); if(wgEl) wgEl.innerHTML=listHtml(S.weekly,'weekly');
  renderWeeklyReview();
  document.getElementById('dAttr').innerHTML=optAttrs('BODY');
  document.getElementById('wAttr').innerHTML=optAttrs('CAREER');
  document.getElementById('sAttr').innerHTML=optAttrs('BODY');
  const sdEl=document.getElementById('sideDailyList'); if(sdEl) sdEl.innerHTML=sideListHtml(S.sideDaily,'daily');
  const swEl=document.getElementById('sideWeeklyList'); if(swEl) swEl.innerHTML=sideListHtml(S.sideWeekly,'weekly');
  const smEl=document.getElementById('sideMonthlyList'); if(smEl) smEl.innerHTML=sideListHtml(S.sideMonthly,'monthly');
  const sdAttr=document.getElementById('sdAttr'); if(sdAttr) sdAttr.innerHTML=optAttrs('MIND');
  const swAttr=document.getElementById('swAttr'); if(swAttr) swAttr.innerHTML=optAttrs('BODY');
  ledgerHtml();
  const lDate=document.getElementById('lDate'); if(lDate && !lDate.value) lDate.value=todayStr();

  // badminton
  const bL=bmLevel(BADMINTON_LIFETIME_HOURS);
  const bP=bmXpInLvl(BADMINTON_LIFETIME_HOURS);
  document.getElementById('bmLvl').textContent=bL;
  document.getElementById('bmHours').textContent=BADMINTON_LIFETIME_HOURS;
  document.getElementById('bmFill').style.width=bP.pct+'%';
  document.getElementById('bmWeek').textContent=`${h(bmWeekHours())} / 15h`;

  // goals
  document.getElementById('goalsBox').innerHTML=S.goals.map((g,i)=>{
    const pct=Math.min(100,g.cur/g.total*100);
    const ms=g.milestones.map((m,mi)=>{
      const reached=m.skill?(m.auto?!!m.auto():!!m.reached):(g.cur>=m.thr);
      const tag=m.skill?(m.auto?'随年目标自动达成':'技能'):m.thr+'h';
      const clk=(m.skill&&!m.auto&&!reached)?`onclick="claimMilestone(${i},${mi})"`:'';
      const cls='ms '+(m.skill&&!m.auto?'skill ':'')+(reached?'reached':'');
      return `<span class="${cls}" ${clk} title="${tag}">${reached?'✔ ':''}${m.label}</span>`;
    }).join('');
    return `<div class="goal ${g.paused?'paused':''}">
      <div class="gtop"><span class="gic">${g.ic}</span><span class="gn">${g.n}${g.paused?'<span class="ptag">⏸ 休眠</span>':''}</span>
        <span class="gcur" onclick="editGoalTotal(${i})" title="点此修改总目标">${g.cur} / ${g.total}h · ${pct.toFixed(1)}%</span></div>
      <div class="gbar"><div class="gbf" style="width:${pct}%"></div></div>
      <div class="gms">${ms}</div>
      <div class="gacts">
        <button class="btn ghost sm" onclick="recordHours(${i},15)">+15min</button>
        <button class="btn ghost sm" onclick="recordHours(${i},60)">+1h</button>
        <button class="btn ghost sm" onclick="recordHours(${i},-60)">-1h</button>
      </div>
    </div>`;
  }).join('');

  // achievements - 拆分已解锁 / 待解锁
  const _achCard=(a,i)=>`<div class="ach ${a.un?'un':''} ${((!a.un)&&(a.next||a.lv))?'featured':''}">
      <div class="ic">${a.ic}</div>
      <div class="an">${a.n}${a.lv?`<span class="lvtag">Lv.${a.lv}</span>`:''}</div>
      <div class="ad">${a.d}</div>
      ${a.next?`<div class="next">↳ 下一阶 ${a.lv?'':'：'}${a.next}</div>`:''}
      ${a.un?'<div class="claim ok">✔ 已解锁</div>':(a.auto?'<div class="claim wait">自动判定中</div>':'<button class="btn ghost sm claim" onclick="claimAch('+i+')">认领解锁</button>')}
    </div>`;
  const _un=S.ach.map((a,i)=>a.un?_achCard(a,i):null).filter(Boolean);
  const _lk=S.ach.map((a,i)=>!a.un?_achCard(a,i):null).filter(Boolean);
  document.getElementById('achsUnlocked').innerHTML=_un.join('')||'<div class="hint">尚无解锁的印记，开始修行吧。</div>';
  document.getElementById('achsLocked').innerHTML=_lk.join('')||'<div class="hint">皆已点亮 ✨</div>';
  document.getElementById('pushToken').value=S.pushToken||'';
  const hb=document.getElementById('histBox');
  if(S.history.length){
    hb.innerHTML=S.history.slice(-50).reverse().map(e=>`<div class="hist"><span class="ts">${e.ts}</span><span class="ht">${e.text}</span>${e.xp?'<span class="xp">'+(e.xp>0?'+':'')+e.xp+'XP</span>':''}</div>`).join('');
  } else { hb.innerHTML='<div style="color:var(--dim);font-size:13px">还没有记录，打卡后这里会显示历史。</div>'; }
  renderHobbies();
  renderLongterm();
  renderEnergyPage();
  renderWishes();
  renderTrendCard();
  // v5.17
  try{ checkVolume(); seasonCheck(); }catch(e){}
  try{ renderEnergy(); renderSaga(); renderLiunian(); renderDayun(); renderNpc(); renderSkillTree(); renderSeason(); renderWorn(); }catch(e){ console.warn('v5.17 render',e); }
  try{ renderLoadAdvisor(); }catch(e){ console.warn('load advisor',e); }
  try{ renderQuietMode(); }catch(e){}
  try{ renderSaveSafety(); }catch(e){}
  try{ renderQuote(); }catch(e){ console.warn('v5.18 render',e); }
  try{ renderLifeBanner(); }catch(e){ console.warn('life banner render',e); }
  // v5.19 互动版块渲染
  try{ renderDraw(); renderLetters(); renderEncounter(); renderBonds(); }catch(e){ console.warn('v5.19 render',e); }
  // v5.20 通知中心
  try{ renderNotifications(); renderNavBadges(); renderBioAge(); }catch(e){ console.warn('v5.20+ render',e); }
  newlyDone.forEach(idv=>{ const el=document.getElementById('qi_'+idv); if(el) el.classList.add('flash'); });
  newlyDone=[];
}

function renderHobbies(){
  const el=document.getElementById('hobbyList');
  if(!el) return;
  if(!Array.isArray(S.hobbies)||!S.hobbies.length) S.hobbies=defaultHobbies();
  const clsOf=st=> st==='active'?'on':(st==='paused'?'paused':'');
  el.innerHTML=S.hobbies.map((h,i)=>`<span class="hobby ${clsOf(h.st)}" onclick="toggleHobby(${i})" title="点击切换：在玩 / 偶尔 / 暂歇">${h.ic} ${h.n}</span>`).join('');
}

function renderWishes(){
  const el=document.getElementById('wishGroups');
  if(!el) return;
  if(!Array.isArray(S.wishes)||!S.wishes.length) S.wishes=defaultWishes();
  // 按组聚合，保留原始顺序
  const groups=[];
  S.wishes.forEach((w,i)=>{
    let g=groups.find(x=>x.g===w.g);
    if(!g){ g={g:w.g,items:[]}; groups.push(g); }
    g.items.push({w,i});
  });
  el.innerHTML=groups.map(g=>`<div class="wishgroup"><div class="wish-title">${g.g} <span style="color:var(--dim);font-weight:400">${g.items.filter(x=>x.w.un).length}/${g.items.length}</span></div><div class="wishlist">${g.items.map(({w,i})=>`<span class="wish ${w.un?'reached':''}" onclick="toggleWish(${i})" title="点击点亮 / 取消">${w.un?'<span class="ck">✔</span>':''}${w.t}</span>`).join('')}</div></div>`).join('');
}

function toggleWish(i){
  if(!S.wishes[i]) return;
  const lightingUp=!S.wishes[i].un;
  S.wishes[i].un=!S.wishes[i].un;
  save();
  renderWishes();
  if(lightingUp){ const drp=dropReward('medium','点亮人生愿望：'+S.wishes[i].t); if(drp) setTimeout(()=>celebrateTask('🎁 嘉奖掉落：'+findReward(drp.rewardId).name),120); }
  if(typeof render==='function') render(); // 同步仪表盘徽章卡
}
function toggleHobby(i){
  const sts=['active','sometimes','paused'];
  const cur=S.hobbies[i].st;
  S.hobbies[i].st=sts[(sts.indexOf(cur)+1)%sts.length];
  save();render();
}

/* ---------- 战利品页：装备库 + 嘉奖箱 ---------- */
function xpLedgerFor(d){
  const rows=(S.history||[]).filter(x=>x.ts&&x.ts.slice(0,10)===d&&Number(x.xp)!==0),cats={action:0,momentum:0,story:0,bonus:0};let pos=0,neg=0;
  rows.forEach(x=>{const v=Number(x.xp)||0;if(v>0)pos+=v;else neg+=Math.abs(v);const t=x.text||'';if(/连携|起势|入流|成章/.test(t))cats.momentum+=v;else if(/复盘|篇章|NPC|故人|专属事件|信物/.test(t))cats.story+=v;else if(/嘉奖|境界|掉落|全清|称号/.test(t))cats.bonus+=v;else cats.action+=v;});
  Object.keys(cats).forEach(k=>cats[k]=Math.max(0,Math.round(cats[k])));return {rows,pos:Math.round(pos),neg:Math.round(neg),net:Math.round(pos-neg),cats};
}
function renderXpLedger(){
  const el=document.getElementById('xpLedgerBox');if(!el)return;const d=todayStr(),x=xpLedgerFor(d),target=180,pct=Math.min(100,Math.max(0,x.pos/360*100));
  let note=x.pos===0?'今天还没有经验入账。无需为了填满刻度专门找任务。':x.pos<80?'今天已经开始积累，按自己的节奏继续即可。':x.pos<=220?'今天的修为已经很充足，完成主线后便可以安心收工。':'今天的奖励十分丰盛。后续经验仍会正常入账，但不必为了升级继续加码。';
  const labs={action:['⚔️','行动'],momentum:['🔥','连携'],story:['📖','剧情'],bonus:['🎁','额外']},days=[];for(let i=6;i>=0;i--){const dd=shiftDate(d,-i),v=xpLedgerFor(dd).pos;days.push({d:dd,v});}const mx=Math.max(1,...days.map(q=>q.v));
  el.innerHTML='<div class="xpl-head"><div><div class="xpl-title">⚖️ 修为账本</div><div class="hint">看清奖励来自哪里 · 节奏线不是上限</div></div><div class="xpl-total"><b>+'+x.pos+'</b><br><span>今日入账 XP'+(x.neg?' · 撤销 '+x.neg:'')+'</span></div></div>'
    +'<div class="xpl-meter"><i style="width:'+pct+'%"></i></div><div class="xpl-scale"><span>0 · 起步</span><span>180 · 充足</span><span>360 · 丰盛</span></div>'
    +'<div class="xpl-cats">'+Object.keys(labs).map(k=>'<div class="xpl-cat"><b>'+labs[k][0]+' '+x.cats[k]+'</b><span>'+labs[k][1]+'</span></div>').join('')+'</div><div class="xpl-note">'+note+'</div>'
    +'<div class="xpl-week"><svg class="xpl-chart" viewBox="0 0 280 40" preserveAspectRatio="none" style="width:100%;height:40px;display:block;margin-bottom:6px;"><polyline points="'+days.map((q,i)=>{const x=6+i*(280-12)/6; const y=40-6-Math.max(2,Math.round(q.v/mx*(40-12))); return x+','+y;}).join(' ')+'" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'+days.map((q,i)=>{const x=6+i*(280-12)/6; const y=40-6-Math.max(2,Math.round(q.v/mx*(40-12))); return '<circle cx="'+x+'" cy="'+y+'" r="3" fill="var(--gold)"/>';}).join('')+'</svg><div class="xpl-day">'+days.map(q=>'<span>'+q.d.slice(5)+'</span>').join('')+'</div></div>';
}
function renderLoot(){
  const el=document.getElementById('equipList'); if(!el) return;  // 页面未渲染则跳过
  const active = S.lootTab || 'equips';
  document.querySelectorAll('.loot-tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===active));
  const eq=document.getElementById('lootEquips'); if(eq) eq.style.display = active==='equips'?'block':'none';
  const rw=document.getElementById('lootRewards'); if(rw) rw.style.display = active==='rewards'?'block':'none';
  renderEquips();
  renderRewards();
  renderNpcRelics();
  renderXpLedger();
}
function setLootTab(t){ S.lootTab=t; save(); renderLoot(); }
function rarityCls(r){ return 'r-'+(r||'普通'); }
function renderEquips(){
  const el=document.getElementById('equipList'); if(!el) return;
  const all=[...EQUIPS, ...(S.customEquips||[])];
  // 当前加成汇总（按领域）
  const sum={};
  (S.equips.equipped||[]).forEach(eid=>{ const e=findEquip(eid); if(e){ sum[e.attr]=(sum[e.attr]||0)+(e.bonus||0); } });
  el.innerHTML = all.map(e=>{
    const owned=(S.equips.owned||[]).includes(e.id);
    const on=(S.equips.equipped||[]).includes(e.id);
    const conflict=(S.equips.equipped||[]).find(o=>{ const oe=findEquip(o); return oe && oe.attr===e.attr && oe.id!==e.id; });
    const attrName = e.attr==='ALL'?'全领域':(ATTRS[e.attr]?ATTRS[e.attr].name:e.attr);
    return `<div class="equip ${on?'on':''} ${rarityCls(e.rarity)}">
      <div class="eq-ic">${e.icon}</div>
      <div class="eq-main">
        <div class="eq-name">${e.name}<span class="eq-rar">${e.rarity}</span></div>
        <div class="eq-desc">${e.desc}</div>
        <div class="eq-meta">领域：${attrName} · 加成 +${Math.round(e.bonus*100)}%</div>
      </div>
      <div class="eq-act">
        ${on
          ? '<button class="btn sm" onclick="unequipItem(\''+e.id+'\')">卸下</button>'
          : '<button class="btn sm primary" onclick="equipItem(\''+e.id+'\')" '+(owned?'':'disabled title="先获取"')+'>'+(owned?'装备':'未拥有')+'</button>'}
        ${e.custom?'<button class="btn sm ghost" onclick="delEquip(\''+e.id+'\')">删除</button>':''}
      </div>
    </div>`;
  }).join('');
  const se=document.getElementById('equipSummary');
  if(se){
    const parts=Object.keys(sum).map(a=>{
      const n=a==='ALL'?'全领域':(ATTRS[a]?ATTRS[a].name:a);
      return `${n} +${Math.round(sum[a]*100)}%`;
    });
    se.innerHTML = parts.length ? ('当前生效加成：'+parts.join(' · ')) : '尚未装备任何装备（穿上后对应领域练功更快）';
  }
}
function equipItem(eid){
  const e=findEquip(eid); if(!e) return;
  S.equips.owned=S.equips.owned||[];
  if(!S.equips.owned.includes(eid)) S.equips.owned.push(eid);
  const conflict=(S.equips.equipped||[]).find(o=>{ const oe=findEquip(o); return oe && oe.attr===e.attr; });
  if(conflict && conflict!==eid){ alert('该领域已装备「'+(findEquip(conflict).name)+'」，请先卸下再装备'); return; }
  if(!(S.equips.equipped||[]).includes(eid)) S.equips.equipped.push(eid);
  save(); renderLoot();
}
function unequipItem(eid){
  S.equips.equipped=(S.equips.equipped||[]).filter(x=>x!==eid);
  save(); renderLoot();
}
function addEquip(){
  const name=document.getElementById('eqName').value.trim();
  const attr=document.getElementById('eqAttr').value;
  const bonus=parseFloat(document.getElementById('eqBonus').value)||0;
  const desc=document.getElementById('eqDesc').value.trim()||('修行经验 +'+Math.round(bonus*100)+'%');
  if(!name||bonus<=0) return;
  const e={id:'ceq_'+id(), name, attr, bonus:bonus/100, rarity:'自制', desc, custom:true};
  S.customEquips=S.customEquips||[]; S.customEquips.push(e);
  S.equips.owned=S.equips.owned||[]; S.equips.owned.push(e.id);
  document.getElementById('eqName').value=''; document.getElementById('eqBonus').value=''; document.getElementById('eqDesc').value='';
  save(); renderLoot();
}
function delEquip(eid){
  S.customEquips=(S.customEquips||[]).filter(e=>e.id!==eid);
  S.equips.owned=(S.equips.owned||[]).filter(x=>x!==eid);
  S.equips.equipped=(S.equips.equipped||[]).filter(x=>x!==eid);
  save(); renderLoot();
}
function renderRewards(){
  const el=document.getElementById('rewardList'); if(!el) return;
  const drops=S.rewards.drops||[];
  if(!drops.length){ el.innerHTML='<div class="hint">还没有掉落嘉奖。完成日常任务、点亮人生愿望、突破境界时，会随机掉落自助奖励（小成就小奖励、大成就大奖励）。</div>'; return; }
  const sorted=drops.map((d,idx)=>({d,idx})).sort((a,b)=>(a.d.claimed?1:0)-(b.d.claimed?1:0));
  el.innerHTML=sorted.map(({d,idx})=>{
    const r=findReward(d.rewardId)||{name:'未知奖励',icon:'🎁',tier:'micro',money:0,time:0,desc:''};
    const tierName={micro:'微',small:'小',medium:'中',big:'大'}[r.tier]||'';
    return `<div class="reward ${d.claimed?'claimed':''} t-${r.tier}">
      <div class="rw-ic">${r.icon}</div>
      <div class="rw-main">
        <div class="rw-name">${r.name}<span class="rw-tier">${tierName}奖</span></div>
        <div class="rw-desc">${r.desc} · 约 ¥${r.money} / ${r.time}h</div>
        <div class="rw-meta">📅 ${d.ts}${d.reason?' · '+escapeHtml(d.reason):''}${d.claimed?(' · ✅ 已享用 '+d.claimedAt):''}</div>
      </div>
      <div class="rw-act">
        ${d.claimed?'':`<button class="btn sm primary" onclick="claimReward(${idx})">我享用啦</button>`}
      </div>
    </div>`;
  }).join('');
}

/* ---------- 动效函数：飘字 + 升级庆祝 ---------- */
function floatXP(text, anchorId){
  const fx=document.getElementById('fxLayer'); if(!fx)return;
  const a=document.getElementById(anchorId);
  const r=a?a.getBoundingClientRect():{right:innerWidth/2,top:120};
  const el=document.createElement('div'); el.className='floatxp'; el.textContent=text;
  el.style.left=(r.right+8)+'px'; el.style.top=(r.top+4)+'px';
  fx.appendChild(el); setTimeout(()=>el.remove(),1250);
}
function celebrate(level){
  const fx=document.getElementById('fxLayer'); if(!fx)return;
  const ov=document.createElement('div'); ov.className='levelup-overlay';
  ov.innerHTML='<div class="lu-card"><div class="big">境界突破！</div><div class="big">Lv.'+level+'</div><div class="sub">修为更进一层</div></div>';
  fx.appendChild(ov);
  const cx=innerWidth/2, cy=innerHeight/2;
  const colors=['#7c9cff','#9b8cff','#5fd0a0','#ffb15e','#ff7a7a','#6cc5ff','#f3c969'];
  for(let i=0;i<36;i++){
    const p=document.createElement('div'); p.className='lu-particle';
    const ang=Math.random()*Math.PI*2, dist=110+Math.random()*230;
    p.style.left=cx+'px'; p.style.top=cy+'px';
    p.style.background=colors[i%colors.length];
    p.style.setProperty('--dx',(Math.cos(ang)*dist).toFixed(0)+'px');
    p.style.setProperty('--dy',(Math.sin(ang)*dist).toFixed(0)+'px');
    p.style.setProperty('--rot',(Math.random()*720-360).toFixed(0)+'deg');
    fx.appendChild(p); setTimeout(()=>p.remove(),950);
  }
  setTimeout(()=>ov.remove(),2000);
  const ln=document.getElementById('lvlNum'); if(ln){ ln.style.animation='none'; void ln.offsetWidth; ln.style.animation='pop .5s ease-out'; }
}

/* ---------- 勾选庆祝文案：按任务名精确匹配优先，属性/分类兜底 ---------- */
const SUPP_MSG = {
  '维生素D':'☀️ 阳光维生素到位，骨骼和情绪都被照拂',
  '镁':'🛡️ 镁已补充，神经放松，今晚睡得更稳',
  '鱼油':'🐟 Omega-3 上线，脑子更润、炎症更低',
  '维生素C':'🍊 维C 打卡，免疫小盾牌 +1',
  '氨糖':'🦴 氨糖补上，关节被温柔对待',
  '姜黄饮':'🧡 今天抗炎 +1，姜黄饮已就位',
  '姜黄奶':'🥛 黄金奶下肚，抗炎助眠双 buff',
  '羽衣甘蓝粉':'🥬 绿色抗氧化，身体轻盈 +1',
  '奇亚籽':'🌱 奇亚籽，Omega 与纤维补给到位',
  '甜菜根粉':'🟣 甜菜根，血氧与耐力小助攻',
  '电解质粉':'⚡ 电解质充分补充，今天运动表现稳了'
};
const CAT_MSG = {
  '社交':'💬 关系被点亮，你值得被好好对待',
  '创作':'🎨 表达欲落地，生命被自己点亮',
  '美丽':'💄 认真打扮，是给自己的仪式感',
  '疗愈':'🌿 慢下来一会儿，能量回血',
  '灵宠':'🐱 被毛孩子治愈，今日份柔软',
  '养生':'🍵 养生一小步，身体记着你的好',
  '灵感':'✨ 灵感入库，生活更有滋味'
};
const ATTR_MSG = {
  'BODY':'💪 身体又记下一笔，掌控感 +1',
  'STUDY':'📚 又积累一点，复利在悄悄发生',
  'MIND':'🧠 心绪被照顾到，稳定是你的底牌',
  'MONEY':'💰 财富自由的齿轮又转了一下',
  'HEART':'❤️ 关系被点亮，你值得被好好对待',
  'SPIRIT':'✨ 精神又充盈一点，灯火不灭'
};
function findCelebrate(t, key){
  if(!t) return null;
  const norm = String(t).replace(/(粉|饮|奶|片|胶囊|液|膏)$/,'');
  if(SUPP_MSG[t]) return SUPP_MSG[t];
  if(SUPP_MSG[norm]) return SUPP_MSG[norm];
  if(CAT_MSG[key]) return CAT_MSG[key];
  if(ATTR_MSG[key]) return ATTR_MSG[key];
  return '✔ 又完成一项，今日修行 +1';
}
let rewardQueue=[],rewardQueueTimer=null;
function celebrateTask(msg){
  if(!msg||((S.uiPrefs||{}).quiet))return;rewardQueue.push(String(msg));
  if(rewardQueueTimer)return;rewardQueueTimer=setTimeout(flushRewardQueue,520);
}
function flushRewardQueue(){
  rewardQueueTimer=null;const fx=document.getElementById('fxLayer'),items=rewardQueue.splice(0);if(!fx||!items.length)return;
  const el=document.createElement('div');el.className='task-celebrate batch';const uniq=[...new Set(items)],show=uniq.slice(0,3);
  el.innerHTML='<div class="tc-batch-title">✦ 本轮收获'+(uniq.length>1?' · '+uniq.length+' 项':'')+'</div>'+show.map(x=>'<div class="tc-batch-line">'+escHtml(x)+'</div>').join('')+(uniq.length>3?'<div class="tc-batch-more">另有 '+(uniq.length-3)+' 项已合并</div>':'');
  fx.appendChild(el);setTimeout(()=>el.remove(),2600);
}
function toggleQuietMode(){S.uiPrefs=S.uiPrefs||{quiet:false};S.uiPrefs.quiet=!S.uiPrefs.quiet;if(S.uiPrefs.quiet){rewardQueue=[];rewardQueueTimer=null;}save();renderQuietMode();}
function renderQuietMode(){const b=document.getElementById('quietModeBtn'),t=document.getElementById('quietModeText'),on=!!((S.uiPrefs||{}).quiet);if(b){b.textContent=on?'关闭安静模式':'开启安静模式';b.classList.toggle('primary',on);}if(t)t.textContent=on?'当前：普通奖励提示已静音':'当前：同一轮奖励自动合并';}

// 多页路由：切换 page 显示 + 导航高亮 + 同步 hash（刷新/分享不丢当前页）
function showPage(p){
  if(p==='energy') renderEnergyPage();
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  const t=document.getElementById('page-'+p);
  if(t) t.classList.add('active');
  document.querySelectorAll('.navitem').forEach(n=>n.classList.toggle('cur', n.dataset.page===p));
  if(p==='current'||p==='dashboard'){ markSideSeen(); }
  if(p==='growth'){ markBondsSeen(); }
  if(p==='data'){ try{ fillProfileInputs(); }catch(e){} }
  if(location.hash!=='#'+p){ try{ history.replaceState(null,'','#'+p); }catch(e){} }
  try{ renderNotifications(); renderNavBadges(); }catch(e){}
}

// ===== 仪表盘拖拽排序 =====
let dashSorting=false;
function initDashDrag(){
  const grid=document.getElementById('page-dashboard');
  if(!grid) return;
  const cards=()=>[...grid.querySelectorAll('.panel[data-dash-id]')];
  let dragEl=null;
  cards().forEach(p=>{
    p.addEventListener('dragstart',e=>{
      if(!dashSorting) return;
      dragEl=p; p.classList.add('dragging');
      e.dataTransfer.effectAllowed='move';
      try{e.dataTransfer.setData('text/plain',p.dataset.dashId);}catch(_){}
    });
    p.addEventListener('dragend',()=>{
      if(dragEl){dragEl.classList.remove('dragging');dragEl=null;}
      cards().forEach(x=>x.classList.remove('drag-over'));
      if(dashSorting) saveDashOrder();
    });
    p.addEventListener('dragover',e=>{
      if(!dashSorting||!dragEl||p===dragEl) return;
      e.preventDefault();
      e.dataTransfer.dropEffect='move';
      p.classList.add('drag-over');
    });
    p.addEventListener('dragleave',()=>p.classList.remove('drag-over'));
    p.addEventListener('drop',e=>{
      if(!dashSorting||!dragEl||p===dragEl) return;
      e.preventDefault();
      p.classList.remove('drag-over');
      const all=cards();
      const di=all.indexOf(dragEl), pi=all.indexOf(p);
      if(di<pi) p.after(dragEl); else p.before(dragEl);
    });
  });
}
function saveDashOrder(){
  const grid=document.getElementById('page-dashboard');
  if(!grid) return;
  const order=[...grid.querySelectorAll('.panel[data-dash-id]')].map(p=>p.dataset.dashId);
  try{ localStorage.setItem('lifeRPG.dashOrder', JSON.stringify(order)); }catch(_){}
}
function applyDashOrder(){
  let order;
  try{ order=JSON.parse(localStorage.getItem('lifeRPG.dashOrder')||'null'); }catch(_){ order=null; }
  if(!order||!Array.isArray(order)) return;
  const grid=document.getElementById('page-dashboard');
  if(!grid) return;
  order.forEach(id=>{
    const el=grid.querySelector('.panel[data-dash-id="'+id+'"]');
    if(el) grid.appendChild(el);
  });
}
function resetDashOrder(){
  try{ localStorage.removeItem('lifeRPG.dashOrder'); }catch(_){}
  location.reload();
}
function toggleDashSort(){
  dashSorting=!dashSorting;
  const grid=document.getElementById('page-dashboard');
  const btn=document.getElementById('dashSortBtn');
  grid.classList.toggle('sorting',dashSorting);
  if(btn) btn.textContent=dashSorting?'✅ 完成排序':'🔧 拖拽排序';
  grid.querySelectorAll('.panel[data-dash-id]').forEach(p=>{
    if(dashSorting){
      if(p.hasAttribute('onclick')){ p.dataset.jump=p.getAttribute('onclick'); p.removeAttribute('onclick'); }
      p.setAttribute('draggable','true');
    }else{
      if(p.dataset.jump){
        p.setAttribute('onclick',p.dataset.jump); delete p.dataset.jump;
      }
      p.setAttribute('draggable','false');
    }
  });
  if(!dashSorting) saveDashOrder();
}

// ===== v5.17 精力条 / 章卷制 / 丁火流年 / NPC委托 / 技能树 / 赛季称号 / 今日战报 =====

/* ---------- 全部任务清单（统一遍历） ---------- */
function allTaskLists(){
  const L=[];
  if(Array.isArray(S.daily)) L.push(S.daily);
  if(Array.isArray(S.weekly)) L.push(S.weekly);
  if(Array.isArray(S.supps)) L.push(S.supps);
  if(S.week&&Array.isArray(S.week.items)) L.push(S.week.items);
  if(S.month&&Array.isArray(S.month.items)) L.push(S.month.items);
  (S.year||[]).forEach(c=>{ if(Array.isArray(c.items)) L.push(c.items); });
  return L;
}
function minutesOn(dateStr){
  let m=0;
  allTaskLists().forEach(list=>list.forEach(x=>{ if(x.mins&&x.mins[dateStr]) m+=x.mins[dateStr]; }));
  return m;
}
function doneCountOn(dateStr){
  let n=0;
  allTaskLists().forEach(list=>list.forEach(x=>{ if(Array.isArray(x.donedates)&&x.donedates.includes(dateStr)) n++; }));
  return n;
}
function attrMinutesOn(dateStr){
  const o={BADMINTON:0,CAREER:0,BODY:0,MIND:0};
  allTaskLists().forEach(list=>list.forEach(x=>{ if(x.mins&&x.mins[dateStr]) o[safeAttr(x.a)]+=x.mins[dateStr]; }));
  return o;
}
function shiftDate(dateStr,n){ const d=new Date(dateStr+'T00:00:00'); d.setDate(d.getDate()+n); const p=v=>String(v).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }

/* ---------- v5.26 每周复盘：真实投入 → 一条下周重点 ---------- */
function weeklyReviewStats(wk){
  wk=wk||monday(); const dates=[]; for(let i=0;i<7;i++)dates.push(shiftDate(wk,i));
  const valid=dates.filter(d=>d<=todayStr()), attr={BADMINTON:0,CAREER:0,BODY:0,MIND:0}; let total=0,done=0,best={d:'',m:-1},energy=0;
  valid.forEach(d=>{const m=minutesOn(d),a=attrMinutesOn(d);total+=m;done+=doneCountOn(d);energy+=energyStateForDate(d).v;if(m>best.m)best={d,m};Object.keys(attr).forEach(k=>attr[k]+=a[k]||0);});
  const active=valid.filter(d=>minutesOn(d)>0||doneCountOn(d)>0).length;
  return {wk,end:shiftDate(wk,6),dates:valid,attr,total,done,active,best,energy:valid.length?Math.round(energy/valid.length):100};
}
function recommendWeekFocus(st){
  if(st.energy<45)return {a:'BODY',why:'本周平均精力偏低，下一周先把恢复和身体放回中心。'};
  const vals=Object.keys(st.attr).map(a=>({a,v:st.attr[a]})).sort((x,y)=>x.v-y.v),top=vals[vals.length-1];
  if(st.total>0&&top.v/st.total>.58){const x=vals[0];return {a:x.a,why:'本周投入明显集中在'+ATTRS[top.a].name+'，下一周用一个重点为'+ATTRS[x.a].name+'补回平衡。'};}
  if(st.total===0)return {a:'BODY',why:'本周记录较少，下一周从最容易启动的身体照顾开始。'};
  return {a:top.a,why:'本周在'+ATTRS[top.a].name+'最有行动势能，下一周只沿着这条线再推进一步。'};
}
function chooseWeekFocus(a){if(!ATTRS[a])return;const wk=monday();S.weekReview.focus[wk]=a;save();renderWeeklyReview();}
function weeklyReviewLine(st,a){const best=st.best.m>0?(st.best.d.slice(5)+' 是投入最深的一天。'):'这一周还没有记录明确投入。';return '这一周完成 '+st.done+' 项行动，留下 '+h(st.total)+' 的真实投入；'+best+' 下周不铺开战线，只守住「'+ATTRS[a].name+'」。';}
function sealWeeklyReview(){
  const wk=monday();if(S.weekReview.sealed[wk])return;const st=weeklyReviewStats(wk),rec=recommendWeekFocus(st),a=S.weekReview.focus[wk]||rec.a;
  S.weekReview.focus[wk]=a;S.weekReview.sealed[wk]={ts:new Date().toISOString().slice(0,16).replace('T',' '),focus:a,total:st.total,done:st.done,active:st.active,energy:st.energy,line:weeklyReviewLine(st,a)};
  S.bonusXP=(S.bonusXP||0)+15;addHist('📜 本周复盘已封存 · 下周唯一重点：'+ATTRS[a].name+' +15 XP',15);save();render();celebrateTask('📜 本周成卷 · '+ATTRS[a].icon+' '+ATTRS[a].name);
}
function renderWeeklyReview(){
  const el=document.getElementById('weeklyReviewBox');if(!el)return;const wk=monday(),st=weeklyReviewStats(wk),rec=recommendWeekFocus(st),sealed=S.weekReview.sealed[wk],focus=(sealed&&sealed.focus)||S.weekReview.focus[wk]||rec.a,max=Math.max(1,...Object.values(st.attr));
  el.innerHTML='<div class="wr-head"><div><div class="wr-kicker">WEEKLY CHRONICLE · 本周卷册</div><div class="wr-title">这一周，时间去了哪里</div></div><div class="wr-range">'+wk+' ～ '+st.end+'</div></div>'
    +'<div class="wr-stats"><div class="wr-stat"><b>'+st.done+'</b><span>完成行动</span></div><div class="wr-stat"><b>'+h(st.total)+'</b><span>记录投入</span></div><div class="wr-stat"><b>'+st.active+'/7</b><span>有行动的日子</span></div><div class="wr-stat"><b>'+st.energy+'</b><span>平均精力</span></div></div>'
    +'<div class="wr-bars">'+Object.keys(ATTRS).map(a=>'<div class="wr-bar"><span>'+ATTRS[a].icon+' '+ATTRS[a].name+'</span><span class="wr-track"><i style="width:'+Math.round(st.attr[a]/max*100)+'%;background:'+ATTRS[a].color+'"></i></span><b>'+h(st.attr[a])+'</b></div>').join('')+'</div>'
    +'<div class="wr-focus"><div class="wr-focus-title">🧭 下周唯一重点 · '+ATTRS[focus].icon+' '+ATTRS[focus].name+'</div><div class="wr-reason">'+(focus===rec.a?rec.why:'这是你手动选择的重点。系统建议为 '+ATTRS[rec.a].name+'：'+rec.why)+'</div>'
    +(sealed?'':'<div class="wr-choices">'+Object.keys(ATTRS).map(a=>'<button class="btn xs ghost '+(focus===a?'on':'')+'" onclick="chooseWeekFocus(\''+a+'\')">'+ATTRS[a].icon+' '+ATTRS[a].name+'</button>').join('')+'</div>')+'</div>'
    +(sealed?'<div class="wr-sealed">📖 '+sealed.line+'<br><span class="note">封存于 '+sealed.ts+' · 重点一经封存，本周不再改动</span></div>':'<div class="wr-actions"><button class="btn sm primary" onclick="sealWeeklyReview()">封存本周复盘 · +15 XP</button></div><div class="wr-empty">可以随时预览；建议周日或周一封存。封存只记录总结，不会修改任务。</div>');
}

/* ---------- ① 精力条：负荷 vs 恢复 ---------- */
// 设计取向：不催你做更多。过载时系统主动劝休息。
// 可回算到任意历史日 d 的精力状态（精力页趋势复用）
function energyStateForDate(d){
  // 近 3 日投入分钟 → 负荷（3 日 540 分钟 ≈ 满负荷）
  let m3=0; for(let i=0;i<3;i++) m3+=minutesOn(shiftDate(d,-i));
  const load=Math.min(100, m3/5.4);
  // 恢复项
  let rest=0;
  const sleepOk=(S.daily||[]).some(x=>/睡觉|早睡/.test(x.t||'')&&isDone(x,d));
  const stretchOk=(S.daily||[]).some(x=>/拉伸/.test(x.t||'')&&isDone(x,d));
  if(sleepOk) rest+=18;
  if(stretchOk) rest+=8;
  // 近 7 日做过疗愈（头疗/按摩/理疗）—— 读组日志，不受任务对象每周重抽影响
  if(lfHealedWithin(d,7)) rest+=14;
  // 当天未记录投入分钟 → 视为在休整
  if(minutesOn(d)===0) rest+=10;
  const v=Math.max(0,Math.min(100, Math.round(100-load+rest)));
  let label,tip,cls;
  if(v>=75){ label='充盈'; cls='e-good'; tip='状态很好，可以放手做想做的事。'; }
  else if(v>=50){ label='平稳'; cls='e-ok'; tip='节奏合适，保持就好。'; }
  else if(v>=30){ label='偏低'; cls='e-low'; tip='连日投入偏多了，今天可以只做一两件，或提前睡。'; }
  else { label='透支'; cls='e-bad'; tip='身体在提醒你停一停。今天建议休息 / 拉伸 / 早睡，不必勉强补齐清单。'; }
  return {v,label,tip,cls,load:Math.round(load),rest:Math.round(rest),m3:Math.round(m3)};
}
function energyState(){ return energyStateForDate(todayStr()); }

// ===== 精力·恢复页：趋势回算 + 迷你柱图 + 参考建议 =====
function isStretchOn(d){ return (S.daily||[]).some(x=>/拉伸/.test(x.t||'')&&isDone(x,d)); }
function isHealedOn(d){ return lfHealedWithin(d,7); }
function sleepHoursOn(d){ return (S.bioAge&&S.bioAge.sleepLog&&S.bioAge.sleepLog[d]!=null)?S.bioAge.sleepLog[d]:null; }
// 生成 days 天的历史序列 [{d, v}]，v 可能为 null（无记录）
function energyTrendSeries(days, valFn){
  const today=todayStr(); const out=[];
  for(let i=days-1;i>=0;i--){ const d=shiftDate(today,-i); out.push({d, v:valFn(d)}); }
  return out;
}
// 紧凑迷你柱图
function miniBars(series, opt){
  opt=opt||{}; const maxV=opt.max||100; const n=series.length;
  const bw = n<=7? '30px' : (n<=31? '9px' : '4px');
  const html=series.map(s=>{
    const tip=(s.d.slice(5))+(s.v==null?'：无记录':('：'+(opt.fmtVal?opt.fmtVal(s.v):s.v)));
    if(s.v==null) return '<div class="mb" style="width:'+bw+';flex:0 0 auto" title="'+tip+'"><i class="mb-miss"></i></div>';
    const pct=Math.max(2,Math.min(100, s.v/maxV*100));
    const col=opt.colorFn?opt.colorFn(s.v):'var(--gold)';
    return '<div class="mb" style="width:'+bw+';flex:0 0 auto" title="'+tip+'"><i style="height:'+pct+'%;background:'+col+'"></i></div>';
  }).join('');
  return '<div class="mini-bars">'+html+'</div>';
}
function switchEnergyRange(btn, days){
  const card=btn.closest('.energy-card'); if(!card) return;
  card.querySelectorAll('.enk-range-btn').forEach(b=>b.classList.toggle('on', b.dataset.days===String(days)));
  card.querySelectorAll('.enk-range-pane').forEach(p=>p.style.display=(p.dataset.days===String(days))?'block':'none');
}
function energyCard(title, sub, cur, valFn, opt, ranges){
  const panes=ranges.map(days=>{
    const series=energyTrendSeries(days, valFn);
    const has=series.filter(s=>s.v!=null).length;
    return '<div class="enk-range-pane" data-days="'+days+'" style="'+(days===7?'display:block':'display:none')+'">'
      +'<div class="enk-range-sub">近 '+days+' 天 · 有记录 '+has+' 天</div>'
      +miniBars(series, opt)+'</div>';
  }).join('');
  const btns=ranges.map(days=>'<button class="enk-range-btn'+(days===7?' on':'')+'" data-days="'+days+'" onclick="switchEnergyRange(this,'+days+')">'+days+'天</button>').join('');
  return '<div class="panel energy-card">'
    +'<div class="enk-head"><div><div class="enk-title">'+title+'</div><div class="enk-sub">'+sub+'</div></div>'
    +'<div class="enk-cur">'+cur+'</div></div>'
    +'<div class="enk-range-btns">'+btns+'</div>'+panes+'</div>';
}
function energyCardBio(){
  const b=computeBioAge();
  return '<div class="panel energy-card">'
    +'<div class="enk-head"><div><div class="enk-title">🧬 生物年龄</div><div class="enk-sub">体龄 · 脑龄（手动计算，非日频）</div></div></div>'
    +bioAgeSummaryHtml(b)
    +bioAgeFactorsHtml(b)
    +'<div class="ba-manual"><button class="btn sm ghost" onclick="showBioAgeInput()">\u270F\uFE0F 录入健康数据（睡眠/步数/心率）</button></div>'
    +'<div class="enk-bio-hint">体龄/脑龄不画每日柱图。更新健康数据后点「计算体龄」即记一条；最近更新：'+(S.bioAge.lastCompute||'—')+'</div>'
    +'</div>';
}
function energyAdvice(){
  const e=energyState(); const tips=[]; const d=todayStr();
  if(e.v<50) tips.push('状态'+e.label+'（'+e.v+'/100），今天别硬撑，清单只挑 1–2 件重要的做。');
  else if(e.v>=75) tips.push('状态'+e.label+'，可以放手做想做的事。');
  else tips.push('状态'+e.label+'，保持当下节奏即可。');
  const sh=S.bioAge.sleepHours;
  const sleptEarly=(S.daily||[]).some(x=>/睡觉|早睡/.test(x.t||'')&&isDone(x,d));
  const dailyTxt=(S.daily||[]).map(x=>x.t||'').join(' ');
  if(sh!=null && sh<6) tips.push('昨晚只睡 '+sh+'h，偏少，今晚尽量 23:00 前躺下。');
  else if(!sleptEarly && !/睡觉|早睡/.test(dailyTxt)) tips.push('今天还没标记「早睡/睡觉」，记得睡前打卡。');
  if(!isStretchOn(d)){
    if(!/拉伸/.test(dailyTxt)) tips.push('今天没安排拉伸，可加一条「拉伸10分」护腰颈。');
    else tips.push('拉伸还没做，睡前 5 分钟就够。');
  }
  if(!isHealedOn(d)){
    const last=lastHealDate();
    if(last) tips.push('距上次疗愈已 '+Math.round((new Date(d+'T00:00:00')-new Date(last+'T00:00:00'))/86400000)+' 天，该约一次头疗/按摩了。');
  }
  return tips;
}
function renderEnergyPage(){
  const root=document.getElementById('energyPageRoot'); if(!root) return;
  const e=energyState(); const advice=energyAdvice(); const ranges=[7,30,90];
  let h='<div class="energy-advice '+e.cls+'">'
    +'<div class="ea-score"><span class="ea-lab '+e.cls+'">'+e.label+'</span><b>'+e.v+'</b><span class="ea-unit">/100</span></div>'
    +'<div class="ea-body"><div class="ea-tip-top">'+e.tip+'</div>'
    +'<ul class="ea-list">'+advice.map(a=>'<li>'+a+'</li>').join('')+'</ul></div></div>';
  h+='<div class="energy-cards">';
  h+=energyCard('⚡ 精力值', '负荷 vs 恢复的综合分', e.v+' / 100 · '+e.label,
      (d)=>energyStateForDate(d).v, {max:100, colorFn:(v)=>v>=75?'#3fae74':(v>=50?'#5b8fd6':(v>=30?'#e0a94a':'#d9534f')), fmtVal:(v)=>v}, ranges);
  h+=energyCard('💤 睡眠', '每晚睡眠时长（小时）', (S.bioAge.sleepHours!=null?S.bioAge.sleepHours+'h':'未录入'),
      (d)=>sleepHoursOn(d), {max:12, colorFn:(v)=>v>=7.5?'#3fae74':(v>=6?'#5b8fd6':'#d9534f'), fmtVal:(v)=>v+'h'}, ranges);
  h+=energyCard('🤸 身体恢复', '拉伸 / 疗愈完成标记', '',
      (d)=>(isStretchOn(d)?1:0)+(isHealedOn(d)?1:0), {max:2, colorFn:(v)=>v>=2?'#3fae74':(v>=1?'#5b8fd6':'#888'), fmtVal:(v)=>['无','部分','完成'][v]||v}, ranges);
  h+=energyCardBio();
  h+='</div>';
  root.innerHTML=h;
}

/* ---------- ② 章·卷制 ---------- */
const VOLUMES=[
  {n:1,t:'寻锚',sub:'北城漂泊，未得托付之基',
   open:'灯火虽亮，尚无归处。此卷之事，是替自己找一块能落脚的地。',
   close:'锚已落定。你不再是随时被风吹走的人。',
   cond:()=>!!(S.year[0]&&yearDone(0)),
   prog:()=>{ const c=S.year[0]; if(!c||!c.items||!c.items.length) return {a:0,b:1}; return {a:c.items.filter(x=>isDoneEver(x)).length,b:c.items.length}; }},
  {n:2,t:'立基',sub:'锚点已立，灯火有归处',
   open:'有了托付之基，接下来是把身体和手艺练扎实——羽道 3.5，体魄成型。',
   close:'根基已稳。身法与体魄都跟得上你的野心了。',
   cond:()=>!!(S.year[1]&&yearDone(1)),
   prog:()=>{ const c=S.year[1]; if(!c||!c.items||!c.items.length) return {a:0,b:1}; return {a:c.items.filter(x=>isDoneEver(x)).length,b:c.items.length}; }},
  {n:3,t:'云水',sub:'走向云水之乡',
   open:'丁火喜金水。北城的燥热该换一换了——去云南住满一个月，试试那里的气场合不合你。',
   close:'云水之乡已试过。你知道自己想住在哪里了。',
   cond:()=>!!(S.year[2]&&yearDone(2)),
   prog:()=>{ const c=S.year[2]; if(!c||!c.items||!c.items.length) return {a:0,b:1}; return {a:c.items.filter(x=>isDoneEver(x)).length,b:c.items.length}; }},
  {n:4,t:'自在',sub:'高薪 · 体面 · 自由 · 生活',
   open:'最后一段，是把「靠平台活着」换成「靠自己也能活着」。副业跑通，收入不再只有一条腿。',
   close:'你已不必为谁的时间表活着。',
   cond:()=>!!(S.year[3]&&!S.year[3].paused&&yearDone(3)),
   prog:()=>{ const c=S.year[3]; if(!c||!c.items||!c.items.length) return {a:0,b:1}; return {a:c.items.filter(x=>isDoneEver(x)).length,b:c.items.length}; }},
];
function curVolume(){
  for(const v of VOLUMES){ if(!v.cond()) return v; }
  return VOLUMES[VOLUMES.length-1];
}
function checkVolume(){
  // 达成新卷时记一笔历史 + 掉落
  VOLUMES.forEach(v=>{
    if(v.cond() && !S.saga.done.includes(v.n)){
      S.saga.done.push(v.n);
      addHist('📖 卷'+v.n+'·'+v.t+' 已终章：'+v.close, 0);
      try{ dropReward('big','完成 卷'+v.n+'·'+v.t); }catch(e){}
    }
  });
  S.saga.vol=curVolume().n;
}
function chapterText(){
  const v=curVolume();
  const p=v.prog();
  const yunnan=(S.goals||[]).find(g=>g.n&&g.n.indexOf('云南')>=0);
  let s='第'+['一','二','三','四','五'][v.n-1]+'卷 · '+v.t+'：'+v.sub+'（'+p.a+'/'+p.b+'）';
  if(yunnan&&yunnan.cur>0) s+=' ｜ 云南实地 '+yunnan.cur+' 天';
  return s;
}

/* ---------- ③ 丁火流年：节气 + 五行当令 ---------- */
// 节气近似日期表（平年通用，误差 ±1 天，够用）
const JIEQI=[[1,5,'小寒','水'],[1,20,'大寒','水'],[2,4,'立春','木'],[2,19,'雨水','木'],[3,5,'惊蛰','木'],[3,20,'春分','木'],
  [4,5,'清明','木'],[4,20,'谷雨','土'],[5,5,'立夏','火'],[5,21,'小满','火'],[6,6,'芒种','火'],[6,21,'夏至','火'],
  [7,7,'小暑','火'],[7,23,'大暑','土'],[8,7,'立秋','金'],[8,23,'处暑','金'],[9,7,'白露','金'],[9,23,'秋分','金'],
  [10,8,'寒露','金'],[10,23,'霜降','土'],[11,7,'立冬','水'],[11,22,'小雪','水'],[12,7,'大雪','水'],[12,22,'冬至','水']];
function curJieqi(){
  const now=new Date(), m=now.getMonth()+1, d=now.getDate();
  let cur=JIEQI[JIEQI.length-1], next=JIEQI[0];
  for(let i=0;i<JIEQI.length;i++){
    const [jm,jd]=JIEQI[i];
    if(m>jm || (m===jm && d>=jd)){ cur=JIEQI[i]; next=JIEQI[(i+1)%JIEQI.length]; }
  }
  // 距下个节气天数
  const ny=next[0]<cur[0]?now.getFullYear()+1:now.getFullYear();
  const nd=new Date(ny,next[0]-1,next[1]);
  const left=Math.max(0,Math.round((nd-new Date(now.getFullYear(),m-1,d))/86400000));
  return {name:cur[2],el:cur[3],next:next[2],left};
}
// 丁火日主：喜金水（清凉、流动），忌火土过旺（燥烈、壅塞）
const WUXING_ADVICE={
  '金':{lv:'旺相',c:'#6cc5ff',t:'金水当令，丁火最舒服的时节。',adv:'适合推进需要清醒判断的事：投递、面谈、复盘、理财规划。身体也耐练，可加量。'},
  '水':{lv:'旺相',c:'#5aa9e6',t:'水行当令，滋养有余，丁火不燥。',adv:'适合沉潜积累：读书、练琴、写复盘、系统学习。别急着做大决策，等春天再动。'},
  '木':{lv:'平',c:'#5fd0a0',t:'木生火，气机升发，人容易兴奋也容易急。',adv:'适合起新事、见新人。注意别一口气揽太多，给自己留缓冲。'},
  '火':{lv:'过旺',c:'#ff8a5e',t:'火旺之时，丁火易燥、易累、易上头。',adv:'降速。多水多凉：游泳、早睡、清淡饮食、少熬夜。别在这段做重大决定或高压谈判。'},
  '土':{lv:'泄',c:'#c9a86a',t:'土旺泄火，容易疲、容易钝、提不起劲。',adv:'不是你懒，是气机滞。以恢复为主：拉伸、按摩、散步、见让你放松的人。清单减半没关系。'},
};
function dingHuoNow(){
  const j=curJieqi();
  const a=WUXING_ADVICE[j.el]||WUXING_ADVICE['木'];
  return {jieqi:j.name,el:j.el,next:j.next,left:j.left,lv:a.lv,c:a.c,t:a.t,adv:a.adv};
}
// 流年建议任务（点一下入江湖轶事库）
function jieqiSuggest(){
  const el=dingHuoNow().el;
  const M={
    '金':[{t:'趁头脑清明，投一份想去的岗位',x:'weekly'},{t:'做一次深度复盘并写下来',x:'weekly'},{t:'加练一次力量或多球',x:'daily'}],
    '水':[{t:'读一本一直想读的书 30 分钟',x:'daily'},{t:'练一首新曲子',x:'weekly'},{t:'泡个澡或泡脚，早睡一次',x:'daily'}],
    '木':[{t:'约一个久未联系的人喝茶',x:'weekly'},{t:'去一个没去过的地方走走',x:'weekly'},{t:'把一个想法写成半页计划',x:'daily'}],
    '火':[{t:'今天只做最重要的一件事，其余放过',x:'daily'},{t:'23:00 前上床',x:'daily'},{t:'安排一次按摩或头疗（注意 21 天间隔）',x:'monthly'}],
    '土':[{t:'拉伸 15 分钟，什么都不想',x:'daily'},{t:'散步半小时，不带耳机',x:'daily'},{t:'见一个让你放松的人',x:'weekly'}],
  };
  return M[el]||M['木'];
}
function addJieqiIdea(t,type){
  const xp=type==='daily'?8:(type==='weekly'?25:60);
  S.sideBank.push({id:id(),t:t,cat:'流年',type:type,xp:xp,src:'user',w:1.5});
  addHist('流年建议入库：'+t); save(); render();
  alert('已加入江湖轶事任务库，之后会随机抽到。');
}

/* ---------- ④ NPC 委托 ---------- */
const NPCS=[
  {id:'lin',n:'林教头',ic:'🏸',d:'羽球馆的老教头，话不多，眼很毒。',a:'BADMINTON',
   qs:['去把反手高远练三十球，我看着。','这周找个比你强的打一场，输了也来找我复盘。','录一段自己的杀球，回来一起看毛病。','步法练二十分钟，别偷懒。']},
  {id:'shen',n:'沈掌柜',ic:'💼',d:'城南商行的掌柜，最信「动作」不信「打算」。',a:'CAREER',
   qs:['别再看了，投出去一份再说。','把你的简历给我看看，改到能见人为止。','找一个在里面做事的人聊半小时。','把你想去的三个地方列出来，写清楚为什么。']},
  {id:'yun',n:'云娘',ic:'🌿',d:'药庐的主人，专治「硬撑」这种病。',a:'BODY',
   qs:['今晚十一点前躺下，我明天问你。','拉伸十五分钟，别嫌慢。','喝够水，走一万步，就这两件。','这周给自己安排一次真正的休息，什么都不做。']},
  {id:'bailu',n:'白鹭先生',ic:'🎹',d:'旧书铺的琴师，认为人得有一样只为自己做的事。',a:'MIND',
   qs:['弹一首完整的，不求好，求完整。','读三十页，不许查手机。','唱一首你最近总在心里哼的歌。','写点什么，给自己看就行。']},
];
const NPC_REL_STEPS=[{n:'初识',v:0},{n:'相识',v:1},{n:'熟识',v:3},{n:'知交',v:6},{n:'莫逆',v:10}];
const NPC_EVENTS={
  lin:{title:'球馆熄灯以后',scene:'散场后，林教头把你那段并不漂亮的练习录像又放了一遍。他没挑动作，只问：你想把哪一种自己留在球场上？',relic:{id:'relic_lin',ic:'🏸',name:'缠过三次的旧手胶'},choices:[{t:'留下那段失误',d:'承认狼狈也是训练的一部分。',story:'你没有删掉失误。手胶提醒你：真正的进步都有不体面的开头。'},{t:'再打最后十球',d:'用行动回应不甘心。',story:'你们默默打完最后十球。手胶记得那晚球馆熄灯前的声音。'}]},
  shen:{title:'一封没有把握的邀约',scene:'沈掌柜收到一个并不稳妥的机会，顺手推到你面前：好处说得清，风险也是真的。你会怎么答？',relic:{id:'relic_shen',ic:'🧾',name:'掌柜的旧账签'},choices:[{t:'先问清最坏结果',d:'谨慎不是退缩，是看清代价。',story:'你列清风险后仍保留选择。旧账签写着：胆量从来不是不算账。'},{t:'给自己一次冒险',d:'有些门要走近了才看得见。',story:'你决定先迈一步再修正。旧账签背面，是掌柜写的四个字：做了再说。'}]},
  yun:{title:'药庐里的一天空白',scene:'云娘替你留了一整天空白，没有任务，没有改善计划。她只问：如果今天不用证明自己，你想怎样过？',relic:{id:'relic_yun',ic:'🌿',name:'药庐安神香囊'},choices:[{t:'安静地睡一场',d:'把休息当作正事。',story:'你睡到自然醒，没有补偿，也没有内疚。香囊记得身体终于被允许停下。'},{t:'漫无目的地出门',d:'让好奇心替你带路。',story:'你走了一条没有收益的路。香囊里留着那天风吹过草木的味道。'}]},
  bailu:{title:'没有观众的那一曲',scene:'白鹭先生合上旧谱，说今晚不讲技巧。只弹一首你怕弹坏、却一直想弹的曲子。',relic:{id:'relic_bailu',ic:'🎼',name:'写着指法的旧谱页'},choices:[{t:'从头弹到尾',d:'不因瑕疵中断表达。',story:'错音没有毁掉那一曲。旧谱页提醒你：完整有时比正确更接近真心。'},{t:'只弹最喜欢的一段',d:'不必每次都追求完整。',story:'你反复弹那几小节，直到它真正属于你。谱页保存了一小段自由。'}]}
};
const NPC_ADV_EVENTS={
  lin:{6:{title:'替你守住的一局',mark:'旧木记分牌',scene:'林教头第一次没有站在场边指点，而是坐下来替你记分。最后一球落地，他问你更想赢下比分，还是赢回自己的节奏？',choices:[{t:'先把节奏找回来',d:'稳定比逞强更长久。'},{t:'再争最后一分',d:'有些时刻值得全力。'}]},10:{title:'教头不再喊停',mark:'球馆备用钥匙',scene:'那天训练结束，他把备用钥匙递给你：以后不用等我开门。你已经知道该练什么，也知道什么时候该停。',choices:[{t:'收下钥匙',d:'成为能为自己负责的人。'},{t:'约他再打一局',d:'身份变了，球还可以继续。'}]}},
  shen:{6:{title:'只对你摊开的账本',mark:'红线账页',scene:'沈掌柜把一本从不示人的旧账摊开，里面既有得意，也有判断失误。你会先看哪一页？',choices:[{t:'看那次最大的亏损',d:'失败更接近真实能力。'},{t:'看他第一次赚钱',d:'起点里藏着最初的胆量。'}]},10:{title:'柜台后面的座位',mark:'黄铜算盘珠',scene:'掌柜把柜台后的座位让给你半日，不再替你做判断。来客递来一桩模糊的生意，你如何回应？',choices:[{t:'先拒绝模糊条件',d:'边界也是一种信用。'},{t:'提出一个小范围试做',d:'让风险在可控处发生。'}]}},
  yun:{6:{title:'替照顾者熬的一剂药',mark:'青瓷药匙',scene:'云娘今天看起来很累，却仍在替别人配药。她问你：照顾别人的人，累了应该怎么办？',choices:[{t:'替她守半日药庐',d:'照顾可以相互流动。'},{t:'劝她今天关门',d:'休息不需要先被谁批准。'}]},10:{title:'不必再问的脉象',mark:'药庐灯芯',scene:'她搭过你的脉，却没有开方，只说你已经能听见身体的声音了。临别前，她让你替药庐留一句话。',choices:[{t:'慢一点，也算前进',d:'把温柔写进规矩。'},{t:'身体永远不是代价',d:'把边界留给未来的自己。'}]}},
  bailu:{6:{title:'旧书铺的第二把椅子',mark:'墨色书签',scene:'白鹭先生在琴旁放了第二把椅子。今晚没有老师和学生，只有两个愿意把沉默留给音乐的人。',choices:[{t:'合奏一首旧曲',d:'熟悉的旋律也能重新相遇。'},{t:'各弹各的',d:'陪伴不必总做同一件事。'}]},10:{title:'留白的最后一页',mark:'无字谱纸',scene:'旧谱只剩最后一页空白。先生说，这页不该由他写。你准备留下些什么？',choices:[{t:'写下自己的旋律',d:'表达终于不再借别人的声音。'},{t:'让它继续空着',d:'留白也是完整的一部分。'}]}}
};
const NPC_JOINT_EVENT={title:'四盏灯同桌',scene:'一个雨夜，四位故人竟在旧书铺碰了面。有人谈行动，有人谈休息，有人谈胜负，有人只顾拨弦。他们把最后一个问题留给你：这一程，你最想守住什么？',choices:[{t:'守住继续出发的勇气',d:'路会改变，但行动仍在。'},{t:'守住不必证明的自己',d:'成长不必以失去自己为代价。'}]};
function npcRel(pid){ if(!S.npcRel) S.npcRel={}; if(!S.npcRel[pid]) S.npcRel[pid]={xp:0,done:0}; return S.npcRel[pid]; }
function npcRelInfo(pid){
  const r=npcRel(pid), xp=Math.max(0,r.xp||0); let i=0; for(let j=0;j<NPC_REL_STEPS.length;j++) if(xp>=NPC_REL_STEPS[j].v)i=j;
  const cur=NPC_REL_STEPS[i], next=NPC_REL_STEPS[Math.min(i+1,NPC_REL_STEPS.length-1)];
  const pct=i===NPC_REL_STEPS.length-1?100:Math.round((xp-cur.v)/(next.v-cur.v)*100);
  return {xp,level:i,name:cur.n,next:next.n,pct};
}
function npcMemory(p,ri){
  const lines={
    lin:['他还在观察你的脚步。','他记住了你肯练，也肯复盘。','他说你的球开始有自己的样子。','他不再只把你当学生。'],
    shen:['掌柜先看行动，再看人。','他开始相信你说过的话会落地。','有些门路，他愿意替你多问一句。','他把你当成了可以共事的人。'],
    yun:['她提醒你别总把累藏起来。','她知道你正在学着不再硬撑。','你没说出口的疲惫，她也能看见。','药庐总为你留着一盏灯。'],
    bailu:['先生还不知道你会留下什么声音。','他开始认得你常弹、常唱的调子。','他愿意把压箱底的旧谱拿给你。','有些沉默，你们已经不必解释。'],
  };
  const a=lines[p.id]||['故人记得你来过。']; return a[Math.min(ri.level,a.length-1)];
}
function openNpcEvent(pid){
  const p=NPCS.find(n=>n.id===pid), e=NPC_EVENTS[pid], mask=document.getElementById('npcEventMask'), body=document.getElementById('npcEventBody');
  if(!p||!e||!mask||!body||npcRelInfo(pid).xp<3||S.npcEvents[pid]) return;
  body.innerHTML='<div class="st-kicker">'+p.ic+' '+p.n+' · 专属事件</div><div class="st-title">'+e.title+'</div><div class="ne-scene">'+e.scene+'</div><div class="ne-choices">'+e.choices.map((c,i)=>'<button class="ne-choice" onclick="resolveNpcEvent(\''+pid+'\','+i+')"><b>'+c.t+'</b><span>'+c.d+'</span></button>').join('')+'</div><div class="st-actions"><button class="btn sm ghost" onclick="closeNpcEvent()">以后再说</button></div>';
  mask.style.display='flex';
}
function closeNpcEvent(){ const m=document.getElementById('npcEventMask'); if(m)m.style.display='none'; }
function resolveNpcEvent(pid,choice){
  const p=NPCS.find(n=>n.id===pid), e=NPC_EVENTS[pid], c=e&&e.choices[choice]; if(!p||!e||!c||S.npcEvents[pid]) return;
  S.npcEvents[pid]={choice,ts:new Date().toISOString().slice(0,16).replace('T',' ')};
  if(!S.npcRelics.includes(e.relic.id)) S.npcRelics.push(e.relic.id);
  const rel=npcRel(pid); rel.xp=(rel.xp||0)+1; rel.done=(rel.done||0)+1;
  S.bonusXP=(S.bonusXP||0)+20; addHist('🧿【'+p.n+'】'+e.title+'：'+c.t+' · 获得「'+e.relic.name+'」 +20 XP',20);
  closeNpcEvent(); save(); render(); celebrateTask(e.relic.ic+' 获得故人信物：'+e.relic.name);
}
function nextAdvancedNpcEvent(pid,xp){for(const lv of [6,10])if(xp>=lv&&!S.npcEvents[pid+'_'+lv])return {lv,e:NPC_ADV_EVENTS[pid]&&NPC_ADV_EVENTS[pid][lv]};return null;}
function openAdvancedNpcEvent(pid,lv){
  const p=NPCS.find(n=>n.id===pid),e=NPC_ADV_EVENTS[pid]&&NPC_ADV_EVENTS[pid][lv],mask=document.getElementById('npcEventMask'),body=document.getElementById('npcEventBody');if(!p||!e||!mask||!body||npcRelInfo(pid).xp<lv||S.npcEvents[pid+'_'+lv])return;
  body.innerHTML='<div class="st-kicker">'+p.ic+' '+p.n+' · '+(lv===6?'知交':'莫逆')+'事件</div><div class="st-title">'+e.title+'</div><div class="ne-scene">'+e.scene+'</div><div class="ne-choices">'+e.choices.map((c,i)=>'<button class="ne-choice" onclick="resolveAdvancedNpcEvent(\''+pid+'\','+lv+','+i+')"><b>'+c.t+'</b><span>'+c.d+'</span></button>').join('')+'</div><div class="st-actions"><button class="btn sm ghost" onclick="closeNpcEvent()">以后再说</button></div>';mask.style.display='flex';
}
function resolveAdvancedNpcEvent(pid,lv,choice){
  const p=NPCS.find(n=>n.id===pid),e=NPC_ADV_EVENTS[pid]&&NPC_ADV_EVENTS[pid][lv],c=e&&e.choices[choice],key=pid+'_'+lv;if(!p||!e||!c||S.npcEvents[key])return;
  S.npcEvents[key]={choice,ts:new Date().toISOString().slice(0,16).replace('T',' '),mark:e.mark};const xp=lv===10?40:25;S.bonusXP=(S.bonusXP||0)+xp;addHist('📖【'+p.n+'】'+e.title+'：'+c.t+' · 留念「'+e.mark+'」 +'+xp+' XP',xp);closeNpcEvent();save();render();celebrateTask(p.ic+' '+(lv===10?'莫逆':'知交')+'留念：'+e.mark);
}
function openJointNpcEvent(){
  if(S.npcEvents.joint_four||!NPCS.every(p=>S.npcEvents[p.id]))return;const body=document.getElementById('npcEventBody'),mask=document.getElementById('npcEventMask'),e=NPC_JOINT_EVENT;if(!body||!mask)return;body.innerHTML='<div class="st-kicker">🏮 四方故人 · 联动事件</div><div class="st-title">'+e.title+'</div><div class="ne-scene">'+e.scene+'</div><div class="ne-choices">'+e.choices.map((c,i)=>'<button class="ne-choice" onclick="resolveJointNpcEvent('+i+')"><b>'+c.t+'</b><span>'+c.d+'</span></button>').join('')+'</div>';mask.style.display='flex';
}
function resolveJointNpcEvent(choice){const e=NPC_JOINT_EVENT,c=e.choices[choice];if(!c||S.npcEvents.joint_four)return;S.npcEvents.joint_four={choice,ts:new Date().toISOString().slice(0,16).replace('T',' ')};S.bonusXP=(S.bonusXP||0)+35;addHist('🏮【四方故人】'+e.title+'：'+c.t+' +35 XP',35);closeNpcEvent();save();render();celebrateTask('🏮 四盏灯，照见同一段路');}
function renderNpcRelics(){
  const el=document.getElementById('npcRelicBox'); if(!el)return; const owned=S.npcRelics||[];
  const rows=NPCS.map(p=>({p,e:NPC_EVENTS[p.id]})).filter(x=>owned.includes(x.e.relic.id));
  if(!rows.length){el.innerHTML='<div class="relic-empty">与故人的关系达到「熟识」并完成专属事件后，纪念物会留在这里。</div>';return;}
  el.innerHTML=rows.map(x=>{const rec=S.npcEvents[x.p.id], c=x.e.choices[rec?rec.choice:0];return '<div class="relic-card"><div class="relic-ic">'+x.e.relic.ic+'</div><div class="relic-name">'+x.e.relic.name+'</div><div class="relic-from">来自 '+x.p.n+' · '+x.e.title+'</div><div class="relic-story">'+c.story+'</div></div>';}).join('');
}
function npcRoll(force){
  const wk=monday();
  if(!force && S.npc.week===wk && S.npc.active.length) return;
  S.npc.week=wk;
  S.npc.seenWeek='';
  S.npc.active=NPCS.map(p=>({
    npc:p.id, id:id(),
    t:p.qs[Math.floor(Math.random()*p.qs.length)],
    a:p.a, xp:30, done:false
  }));
  addHist('📜 本周委托已刷新（四位故人各留一言）');
}
function npcDone(qid){
  const q=S.npc.active.find(x=>x.id===qid); if(!q) return;
  const wasTodayFocus=ensureTodayPlan().focusId===qid;
  q.done=!q.done;
  const p=NPCS.find(n=>n.id===q.npc);
  if(q.done){
    S.bonusXP=(S.bonusXP||0)+q.xp;
    touchActivity(todayStr());
    addHist('✔【委托】'+(p?p.n:'')+'：'+q.t+' +'+q.xp+' XP', q.xp);
    if(p){ const before=npcRelInfo(p.id).level, rel=npcRel(p.id); rel.xp=(rel.xp||0)+1; rel.done=(rel.done||0)+1; const after=npcRelInfo(p.id); if(after.level>before) setTimeout(()=>celebrateTask(p.ic+' 与'+p.n+'的关系升为「'+after.name+'」'),420); if(before<2&&after.level>=2&&!S.npcEvents[p.id]) setTimeout(()=>celebrateTask('📜 '+p.n+'的专属事件已解锁'),800); }
    celebrateTask((p?p.ic+' '+p.n+'点了点头。':'✔ 委托达成'));
    setTimeout(()=>showQuestSettlement({id:q.id,text:q.t,attr:q.a,mins:q.min||0,xp:q.xp||0,focusDone:wasTodayFocus}),180);
    // 四人全清 → 额外嘉奖
    if(S.npc.active.every(x=>x.done)){
      addHist('🏮 本周四方委托全清');
      try{ const drp=dropReward('medium','本周委托全清'); if(drp) setTimeout(()=>celebrateTask('🎁 四方尽欢：'+findReward(drp.rewardId).name),200); }catch(e){}
    }
  } else {
    S.bonusXP=Math.max(0,(S.bonusXP||0)-q.xp);
    addHist('✘【委托】'+(p?p.n:'')+'：'+q.t, -q.xp);
    if(p){ const rel=npcRel(p.id); rel.xp=Math.max(0,(rel.xp||0)-1); rel.done=Math.max(0,(rel.done||0)-1); }
  }
  save(); checkAch(); render();
}

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
function seasonCheck(){
  const key=curSeasonKey();
  if(!S.season.cur){ S.season.cur=key; return; }
  if(S.season.cur===key) return;
  // 赛季切换：结算上季
  const old=S.season.cur;
  const st=seasonStats(old);
  const got=TITLES.filter(t=>t.cond(st)).map(t=>t.id);
  got.forEach(tid=>{ if(!S.season.titles.some(x=>x.id===tid&&x.season===old)) S.season.titles.push({id:tid,season:old}); });
  addHist('🏁 '+old+' 赛季结算：完成 '+st.done+' 项 · 最长连击 '+st.maxStreak+' 日 · 获称号 '+(got.length||0)+' 个');
  if(got.length) try{ dropReward('medium', old+' 赛季结算'); }catch(e){}
  S.season.cur=key;
}
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
     '<div class="en-top"><span class="en-lab '+e.cls+'">'+e.label+'</span><b class="en-num">'+e.v+'</b><span class="en-unit">/100</span></div>'
    +'<div class="en-bar"><i class="'+e.cls+'" style="width:'+e.v+'%"></i></div>'
    +'<div class="en-tip">'+e.tip+' <a class="en-more" onclick="showPage(\'energy\')">看详情 ›</a></div>';
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
  const remDays=Math.max(0, totalDays-livedDays);

  // 每日 seed（YYYY-MM-DD 哈希 → 伪随机），保证当日稳定、次日换
  const todayKey=now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate();
  let h=2166136261>>>0;
  for(let i=0;i<todayKey.length;i++){ h=((h^(todayKey.charCodeAt(i)))*16777619)>>>0; }
  function rng(){ h=((h+0x6D2B79F5)*0x9E3779B1)>>>0; return (h>>>0)/4294967296; }

  // 主题池：日出/日落/春樱 必含，其余每日抽 1
  const pool=[
    {icon:'🌅', name:'日出', past:livedDays,                  total:totalDays},
    {icon:'🌇', name:'日落', past:livedDays,                  total:totalDays},
    {icon:'🌸', name:'春樱', past:Math.floor(livedYears),     total:le},
    {icon:'🌕', name:'月圆', past:Math.floor(livedDays/29.53),total:Math.floor(totalDays/29.53)},
    {icon:'❄️', name:'初雪', past:Math.floor(livedYears),     total:le},
    {icon:'🌧', name:'夏雨', past:Math.floor(livedDays*0.25), total:Math.floor(totalDays*0.25)},
    {icon:'🍂', name:'秋叶', past:Math.floor(livedYears),     total:le},
    {icon:'🛌', name:'周末', past:Math.floor(livedDays/7),    total:Math.floor(totalDays/7)},
  ];
  const must=pool.slice(0,3);
  const extra=pool.slice(3);
  const pick=extra[Math.floor(rng()*extra.length)];
  const all=[must[0], must[1], must[2], pick];
  // 随机排序
  for(let i=all.length-1;i>0;i--){
    const j=Math.floor(rng()*(i+1));
    [all[i],all[j]]=[all[j],all[i]];
  }

  const cards=all.map(p=>{
    const rem=Math.max(0, p.total-p.past);
    return '<div class="lb-card">'
         +   '<div class="lb-icon">'+p.icon+'</div>'
         +   '<div class="lb-poem">'
         +     '已看过 <b class="lb-num">'+p.past.toLocaleString()+'</b> 次<span class="lb-name">'+p.name+'</span>，'
         +     '<br>还剩 <b class="lb-num">'+rem.toLocaleString()+'</b> 次'
         +   '</div>'
         + '</div>';
  }).join('');

  el.innerHTML=
     '<div class="lb-top">☀️ 今天，是你余下生命里<b>最年轻</b>的一天。</div>'
    +'<div class="lb-poem-grid">'+cards+'</div>'
    +'<div class="lb-bar-wrap">'
    +   '<div class="lb-bar"><i style="width:'+livedPct+'%"></i></div>'
    +   '<div class="lb-bar-label">人生这条路，已走过 '+livedPct+'% · 余下 '+Math.round(100-livedPct)+'%</div>'
    +'</div>';
}
function renderSaga(){
  const el=document.getElementById('sagaBox'); if(!el) return;
  const cur=curVolume();
  el.innerHTML=VOLUMES.map(v=>{
    const p=v.prog();
    const done=S.saga.done.includes(v.n);
    const isCur=(v.n===cur.n)&&!done;
    const pct=p.b?Math.min(100,Math.round(p.a/p.b*100)):0;
    return '<div class="vol '+(done?'vol-done':(isCur?'vol-cur':'vol-lock'))+'">'
      +'<div class="vol-h"><span class="vol-n">卷 '+v.n+'</span><span class="vol-t">'+v.t+'</span>'
      +'<span class="vol-s">'+(done?'✔ 已终章':(isCur?'进行中':'未启'))+'</span></div>'
      +'<div class="vol-sub">'+v.sub+'</div>'
      +'<div class="vol-bar"><i style="width:'+pct+'%"></i></div>'
      +'<div class="vol-p">'+p.a+' / '+p.b+'</div>'
      +'<div class="vol-txt">'+(done?v.close:v.open)+'</div>'
      +'</div>';
  }).join('');
}
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
function renderNpc(){
  const el=document.getElementById('npcBox'); if(!el) return;
  if(!S.npc.active.length){ el.innerHTML='<div class="dash-empty">本周委托待刷新</div>'; return; }
  el.innerHTML=S.npc.active.map(q=>{
    const p=NPCS.find(n=>n.id===q.npc)||{n:'?',ic:'❓',d:''};
    const ri=npcRelInfo(p.id);
    const adv=nextAdvancedNpcEvent(p.id,ri.xp),marks=[6,10].map(lv=>S.npcEvents[p.id+'_'+lv]).filter(Boolean).map(x=>x.mark);
    return '<div class="npcq '+(q.done?'done':'')+'" id="qi_'+q.id+'">'
      +'<div class="npc-ic">'+p.ic+'</div>'
      +'<div class="npc-body"><div class="npc-n">'+p.n+' <span class="npc-d">'+p.d+'</span></div>'
      +'<div class="npc-t">「'+q.t+'」</div>'
      +'<div class="npc-rel"><span class="npc-rel-lv">'+ri.name+' · '+ri.xp+'</span><span class="npc-rel-bar"><i style="width:'+ri.pct+'%"></i></span></div>'
      +'<div class="npc-memory">'+npcMemory(p,ri)+'</div>'
      +(S.npcEvents[p.id]?'<span class="npc-event-done">🧿 '+NPC_EVENTS[p.id].relic.name+(marks.length?' · '+marks.join(' · '):'')+'</span>':(ri.xp>=3?'<div><button class="btn sm ghost npc-event-btn" onclick="openNpcEvent(\''+p.id+'\')">📜 专属事件 · 熟识</button></div>':''))
      +(adv?'<div><button class="btn sm ghost npc-event-btn" onclick="openAdvancedNpcEvent(\''+p.id+'\','+adv.lv+')">📖 '+(adv.lv===6?'知交':'莫逆')+'事件 · '+adv.e.title+'</button></div>':'')+'</div>'
      +'<div class="npc-r"><span class="npc-xp">+'+q.xp+'</span>'
      +'<button class="btn sm '+(q.done?'ghost':'primary')+'" onclick="npcDone(\''+q.id+'\')">'+(q.done?'撤销':'交差')+'</button></div>'
      +'</div>';
  }).join('')
  +(NPCS.every(p=>S.npcEvents[p.id])&&!S.npcEvents.joint_four?'<div class="npcq"><div class="npc-ic">🏮</div><div class="npc-body"><div class="npc-n">四方故人 · 联动事件</div><div class="npc-t">「雨夜里，四盏灯恰好照到了一张桌上。」</div></div><button class="btn sm primary" onclick="openJointNpcEvent()">赴约</button></div>':'')
  +'<div class="hint">每周一自动刷新四方委托。交差会积累关系：初识 → 相识 → 熟识 → 知交 → 莫逆；撤销会同步回退。四人全清额外掉落一份嘉奖。</div>';
}
function renderSkillTree(){
  const el=document.getElementById('skillBox'); if(!el) return;
  const left=skillPointsLeft(), tot=skillPointsTotal();
  const head='<div class="sk-head">修行点 <b>'+left+'</b> / '+tot+' <span class="note">（每提升 1 级得 1 点；已投入 '+skillPointsSpent()+' 点）</span></div>';
  const body=Object.keys(SKILL_TREE).map(k=>{
    const A=ATTRS[k];
    const bonus=Math.round(skillBonusFor(k)*100);
    const nodes=SKILL_TREE[k].map(nd=>{
      const un=S.skill.un.includes(nd.id);
      const c=canUnlock(k,nd.id);
      const cls=un?'sk-un':(c.ok?'sk-ok':'sk-no');
      return '<div class="sknode '+cls+'" onclick="'+(un||!c.ok?'':'unlockSkill(\''+k+'\',\''+nd.id+'\')')+'">'
        +'<div class="sk-n">'+(un?'🌿 ':'')+nd.n+'</div>'
        +'<div class="sk-d">'+nd.d+'</div>'
        +'<div class="sk-f"><span class="sk-b">+'+Math.round(nd.b*100)+'%</span><span class="sk-c">'+(un?'已开枝':(nd.cost+' 点'))+'</span></div>'
        +'</div>';
    }).join('<div class="sk-link"></div>');
    return '<div class="sktree"><div class="sk-th"><span>'+A.icon+' '+A.name+'</span><span class="sk-tb">当前加成 +'+bonus+'%</span></div>'
      +'<div class="sk-row">'+nodes+'</div></div>';
  }).join('');
  el.innerHTML=head+body+'<div class="hint">解锁后永久生效：该领域每次打卡获得的经验 ×(1+装备加成+天赋加成)。点数不可退，慢慢种。</div>';
}
function renderSeason(){
  const el=document.getElementById('seasonBox'); if(!el) return;
  const key=curSeasonKey(), st=seasonStats(key), pv=seasonPreview();
  const owned={}; (S.season.titles||[]).forEach(t=>{ owned[t.id]=t.season; });
  const cards=pv.map(t=>{
    const has=!!owned[t.id];
    const cls=has?'ti-own':(t.hit?'ti-hit':'ti-no');
    const worn=S.season.worn===t.id;
    return '<div class="title '+cls+(worn?' ti-worn':'')+'">'
      +'<div class="ti-ic">'+t.ic+'</div>'
      +'<div class="ti-n">'+t.n+'</div>'
      +'<div class="ti-d">'+t.d+'</div>'
      +'<div class="ti-s">'+(has?('已获 · '+owned[t.id]):(t.hit?'本季达标 ✓ 季末入账':'未达标'))+'</div>'
      +(has?'<button class="btn sm '+(worn?'primary':'ghost')+'" onclick="wearTitle(\''+t.id+'\')">'+(worn?'佩戴中':'佩戴')+'</button>':'')
      +'</div>';
  }).join('');
  el.innerHTML=
     '<div class="se-head">当前赛季 <b>'+key+'</b> <span class="note">'+st.start+' ~ '+st.end+'</span></div>'
    +'<div class="se-stat">完成 <b>'+st.done+'</b> 项 ｜ 最长连击 <b>'+st.maxStreak+'</b> 日 ｜ 新到访 <b>'+st.places+'</b> 处 ｜ '
    +Object.keys(ATTRS).map(k=>ATTRS[k].icon+h(st.attr[k]||0)).join(' ')+'</div>'
    +'<div class="titles">'+cards+'</div>'
    +'<div class="hint">季度切换时自动结算，达标的称号入账并可佩戴（显示在角色名旁）。未结算前显示实时进度。</div>';
}
function renderWorn(){
  const el=document.getElementById('wornTitle'); if(!el) return;
  const t=wornTitleObj();
  el.innerHTML = t ? ('<span class="worn">'+t.ic+' '+t.n+'</span>') : '';
}

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
// 确定性按日取一句：优先当令节气专属，否则按日期种子轮换；_qoff 为当日换一句偏移
let _qoff=0, _qLoaded=false;
function _loadQoff(){ try{ _qoff=parseInt(localStorage.getItem('qoff_'+todayStr())||'0',10)||0; }catch(e){ _qoff=0; } _qLoaded=true; }
function dailyQuote(off){
  const j=curJieqi();
  const themed=QUOTES.filter(q=>q.j && q.j.indexOf(j.name)>=0);
  const seed=[...todayStr()].reduce((a,c)=>a+c.charCodeAt(0),0);
  const o=off||0;
  if(themed.length>0 && o===0) return themed[seed % themed.length]; // 基线优先当令（带「当令」标）
  if(themed.length>1) return themed[(seed + o) % themed.length];    // 换一句且当令≥2条：当令池内轮换
  const gen=QUOTES.filter(q=>!q.j);                                 // 当令≤1条：落入通库，保证「换一句」有变化
  return gen[(seed + o) % gen.length];
}
function renderQuote(){
  const el=document.getElementById('quoteBanner'); if(!el) return;
  if(!_qLoaded) _loadQoff();
  const q=dailyQuote(_qoff);
  const j=curJieqi();
  const tag=(q.j && q.j.indexOf(j.name)>=0)?(' · 当令 '+j.name):'';
  const d=todayStr()||'';
  const pm=(d.length>=10)? d.slice(5).replace('-','·') : d;
  el.innerHTML='<div class="pc-inner">'
    +'<div class="pc-main"><div class="pc-text">'+q.t+'</div><div class="pc-src">—— '+q.s+tag+'</div></div>'
    +'<div class="pc-divider"></div>'
    +'<div class="pc-side">'
    +'<div class="pc-postmark">'+pm+'</div>'
    +'<button class="pc-shuffle" onclick="shuffleQuote()">换一句 ›</button>'
    +'</div></div>';
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
const LETTERS={
  yunnan:[
    {t:'昆明 · 第一封信', b:'这里的云是低的，低到像要落进翠湖里。你先前说想找个凉爽近水的地方，昆明八月不过二十多度，风一过就凉。我在滇池边坐了一下午，什么也没做，难得地，不觉得浪费。', task:{t:'给云南写一句你想对它说的话', xp:15}},
    {t:'大理 · 风的形状', b:'洱海的水是安静的蓝，苍山在背后沉默地绿着。古城里随便一家小院都种着花。你说不想一直在北京——这里的人不急，连卖花的老太太都慢。也许你可以先来住满一个月，看看是不是真的合。', task:{t:'列三个你最想在大理做的事', xp:15}},
    {t:'丽江 · 雪山与慢', b:'玉龙雪山远远白着，古城的溪水从脚边流过。夜里四方街有歌，有人弹吉他唱老歌。你喜水，这里处处是水。我替你把窗打开了，风进来，丁火也就凉了半分。', task:null},
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
function letterTotal(){ let n=0; LETTERS_ORDER.forEach(p=>{ n+=(LETTERS[p]||[]).length; }); return n; }
function letterCheck(force){
  if(!S.letters) S.letters={unlocked:[],pointer:0};
  const hasUnread=(S.letters.unlocked||[]).some(l=>!l.read);
  if(hasUnread && !force) return;
  if(S.letters.pointer>=letterTotal()) return;
  let rem=S.letters.pointer, target=null;
  for(const p of LETTERS_ORDER){ const arr=LETTERS[p]||[]; if(rem<arr.length){ target={place:p,idx:rem}; break; } rem-=arr.length; }
  if(!target) return;
  const meta=LETTERS[target.place][target.idx];
  S.letters.unlocked.push({place:target.place, idx:target.idx, read:false, date:todayStr(), title:meta.t, body:meta.b, task:meta.task?{...meta.task,done:false}:null});
  S.letters.pointer++;
  addHist('✉️ 远方来信：'+meta.t); save();
}
function letterUnread(){ return (S.letters.unlocked||[]).filter(l=>!l.read).length; }
function renderLetters(){
  const el=document.getElementById('letterBox'); if(!el) return;
  const list=S.letters.unlocked||[];
  let h='<h2>✉️ 远方来信 <span class="note">按你心里的地图，慢慢寄到</span>';
  const un=letterUnread(); if(un) h+=' <span class="badge-new">'+un+' 封未读</span>';
  h+='</h2>';
  if(!list.length){ h+='<div class="hint">还没有来信。先在旅行地图上点亮你心里的目的地，信会一封封寄来——先把北京安放好，远方自会抵达。</div>'; el.innerHTML=h; return; }
  h+='<div class="letter-list">';
  list.forEach((l,i)=>{
    const placeName=(TRAVEL_PLACES.find(p=>p.id===l.place)||{}).name||l.place;
    h+='<div class="letter-item'+(l.read?' read':'')+'" onclick="openLetter('+i+')">'
      +'<span class="lt">'+l.title+'</span><span class="lp">'+placeName+'</span>'
      +'<span class="ls">'+(l.read?'已读':'未读')+'</span></div>';
  });
  h+='</div>'; el.innerHTML=h;
}
function openLetter(i){
  const l=(S.letters.unlocked||[])[i]; if(!l) return;
  l.read=true; save(); renderLetters();
  const placeName=(TRAVEL_PLACES.find(p=>p.id===l.place)||{}).name||l.place;
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

// —— ⑤ 成就羁绊 ——
const BONDS=[
  {id:'b_body', name:'强健之契', npc:'云娘', title:'守拙·体道', ids:['body1','s7','s30'],
   line:'云娘抚了抚你的肩：「身子是修行之本。你肯规律、肯不硬撑，这契，算立下了。」'},
  {id:'b_bm', name:'羽道之契', npc:'林教头', title:'穿林·羽道', ids:['bm1k'],
   line:'林教头难得笑了笑：「拍子没白拿。羽道这一契，你早就该立。」'},
  {id:'b_mind', name:'灵台之契', npc:'白鹭先生', title:'清音·灵台', ids:['piano1','mindGuard','mindBound'],
   line:'白鹭先生拨了下琴弦：「心里有这一样只为自己做的事，灵台就乱不了。契成。」'},
  {id:'b_career', name:'立基之契', npc:'沈掌柜', title:'安身·业道', ids:['ashore','careerCrown','coachOpen'],
   line:'沈掌柜拍板：「安身立命，先有可立之处。你一步一步在走，这契，掌柜认了。」'},
  {id:'b_yun', name:'云水之契', npc:'白鹭先生', title:'清凉·云水', ids:['yunnan'],
   line:'白鹭先生指了指远方的水：「丁火喜金水清凉，云南那汪水，你迟早要去。这契，先替你备着。」'},
];
function achUn(id){ const a=(S.ach||[]).find(x=>x.id===id); return !!(a&&a.un); }
function bondDone(b){ return b.ids.every(id=>achUn(id)); }
function grantBond(b){
  if(S.bonds.awarded.indexOf(b.id)>=0) return;
  S.bonds.awarded.push(b.id);
  if((S.season.titles||[]).indexOf(b.title)<0) S.season.titles.push(b.title);
  addHist('🔗 成就羁绊达成：'+b.name+' → 称号「'+b.title+'」'); save();
}
function renderBonds(){
  const el=document.getElementById('bondBox'); if(!el) return;
  let h='<h2>🔗 成就羁绊 <span class="note">集齐一系，故人赠你一句 · 一枚称号</span></h2><div class="bond-list">';
  BONDS.forEach(b=>{
    const done=bondDone(b);
    const lit=b.ids.filter(id=>achUn(id)).length;
    const awarded=S.bonds.awarded.indexOf(b.id)>=0;
    h+='<div class="bond'+(done?' bond-done':'')+'" onclick="openBond(\''+b.id+'\')">'
      +'<div class="bond-h"><span class="bond-n">'+b.name+'</span><span class="bond-c">'+lit+'/'+b.ids.length+'</span></div>'
      +'<div class="bond-npc">'+b.npc+' · 称号「'+b.title+'」</div>'
      +'<div class="bond-state">'+(done?(awarded?'已授称号':'可领取称号'):'修行中')+'</div></div>';
  });
  h+='</div>'; el.innerHTML=h;
  BONDS.forEach(b=>{ if(bondDone(b) && S.bonds.awarded.indexOf(b.id)<0) grantBond(b); });
}

// —— 通知中心：仪表盘小喇叭 + 左侧导航红点 ——
function notifList(){
  const arr=[];
  if(S.enc && S.enc.cur && !S.enc.seen)
    arr.push({page:'dashboard', ic:'🪄', t:'江湖偶遇待回应', d:(S.enc.cur.who||'故人')+'在等你', key:'enc'});
  if(S.npc && S.npc.week && S.npc.week!==S.npc.seenWeek && S.npc.active && S.npc.active.length)
    arr.push({page:'current', ic:'📜', t:'本周委托已刷新', d:'四位故人各留一言', key:'npc'});
  const lu=letterUnread();
  if(lu>0)
    arr.push({page:'map', ic:'✉️', t:lu+' 封远方来信未读', d:'点开看看', key:'letter'});
  if(S.draw && S.draw.date===todayStr() && !S.draw.claimed)
    arr.push({page:'dashboard', ic:'🎴', t:'今日宜忌可承接', d:'承气运 +20 XP', key:'draw', scroll:'drawBox'});
  return arr;
}
function notifGo(el){
  const p=el.dataset.page, s=el.dataset.scroll;
  if(s){ const t=document.getElementById(s); if(t) t.scrollIntoView({behavior:'smooth'}); }
  else if(p){ showPage(p); }
}
function renderNotifications(){
  const el=document.getElementById('notifBox'); if(!el) return;
  const list=notifList();
  if(!list.length){ el.style.display='none'; el.innerHTML=''; return; }
  el.style.display='';
  let h='<div class="notif-h">🔔 待你回应 <span class="notif-cnt">'+list.length+'</span></div><div class="notif-rows">';
  list.forEach(n=>{
    h+='<div class="notif-row" data-page="'+n.page+'" data-scroll="'+(n.scroll||'')+'" onclick="notifGo(this)">'
      +'<span class="notif-ic">'+n.ic+'</span>'
      +'<span class="notif-t">'+n.t+'</span>'
      +'<span class="notif-d">'+n.d+'</span>'
      +'<span class="notif-go">前往 ›</span></div>';
  });
  h+='</div>';
  el.innerHTML=h;
}
function navBadgeCount(page){
  if(page==='current'){
    let c=0;
    if(S.npc && S.npc.week && S.npc.week!==S.npc.seenWeek && S.npc.active && S.npc.active.length) c++;
    return c;
  }
  if(page==='map') return letterUnread();
  if(page==='growth') return (S.bonds.awarded||[]).filter(id=>(S.bonds.viewed||[]).indexOf(id)<0).length;
  return 0;
}
function renderNavBadges(){
  ['current','map','growth'].forEach(p=>{
    const sp=document.getElementById('navBadge-'+p); if(!sp) return;
    const c=navBadgeCount(p);
    sp.textContent = c>0 ? (c>99?'99+':String(c)) : '';
    sp.style.display = c>0 ? 'inline-block' : 'none';
  });
}
function markSideSeen(){
  let ch=false;
  if(S.enc && S.enc.cur && !S.enc.seen){ S.enc.seen=true; ch=true; }
  if(S.npc && S.npc.week && S.npc.seenWeek!==S.npc.week){ S.npc.seenWeek=S.npc.week; ch=true; }
  if(ch){ try{ save(); }catch(e){} }
}
function markBondsSeen(){
  if(!S.bonds) return;
  const aw=S.bonds.awarded||[];
  if(aw.length){ S.bonds.viewed=aw.slice(); try{ save(); }catch(e){} }
}
function openBond(id){
  const b=BONDS.find(x=>x.id===id); if(!b) return;
  const done=bondDone(b);
  const lit=b.ids.filter(x=>achUn(x)).length;
  let body='<div class="letter-head">'+b.name+'</div>'
    +'<div class="bond-sub">'+b.npc+' · 称号「'+b.title+'」 · 进度 '+lit+'/'+b.ids.length+'</div>'
    +'<div class="letter-body">'+b.line+'</div>'
    +'<div class="hint">集齐 '+b.ids.length+' 枚相关徽章即可缔结此契，获赠称号与故人评语。</div>';
  if(done && S.bonds.awarded.indexOf(b.id)>=0){
    body+='<button class="btn sm" style="margin-top:8px" onclick="shareBond(\''+b.id+'\')">🖼 生成名帖分享图</button>';
  } else if(done){
    grantBond(b); body+='<div class="letter-done">✦ 称号已授予「'+b.title+'」</div>';
  }
  showModal('bondModal', body);
}
function wrapText(c, text, x, y, maxW, lh){
  const chars=(text||'').split(''); let line='', yy=y;
  for(let i=0;i<chars.length;i++){ const t=line+chars[i]; if(c.measureText(t).width>maxW && line){ c.fillText(line,x,yy); line=chars[i]; yy+=lh; } else line=t; }
  if(line) c.fillText(line,x,yy);
}
function shareBond(id){
  const b=BONDS.find(x=>x.id===id); if(!b) return;
  const c=document.createElement('canvas'); c.width=600; c.height=360;
  const x=c.getContext('2d');
  x.fillStyle='#0f1a26'; x.fillRect(0,0,600,360);
  x.fillStyle='#d4a84b'; x.font='bold 24px serif'; x.fillText('江湖名帖 · 成就羁绊', 40, 52);
  x.fillStyle='#ffffff'; x.font='bold 40px serif'; x.fillText(b.name, 40, 124);
  x.fillStyle='#9fc7e0'; x.font='19px serif'; x.fillText(b.npc+' 赠言', 40, 170);
  x.fillStyle='#e8e8e8'; x.font='17px serif'; wrapText(x, b.line, 40, 205, 520, 27);
  x.fillStyle='#d4a84b'; x.font='bold 20px serif'; x.fillText('称号「'+b.title+'」', 40, 322);
  try{
    const a=document.createElement('a'); a.href=c.toDataURL('image/png'); a.download='名帖-'+b.name+'.png'; a.click();
    addHist('🖼 生成名帖分享图：'+b.name);
  }catch(e){ alert('分享图生成失败：'+e.message); }
}

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
  const lines=[];
  lines.push('📊 '+(kind==='week'?'周报':'月报')+'（'+start+' ~ '+end+'）');
  lines.push('🔥 灯火不熄：'+computeStreak()+' 日');
  lines.push('⚔️ 完成行动：日常 '+daily.count+' · 周常 '+weekly.count+' · 轶事 '+(sd.count+sw.count+sm.count));
  lines.push('🧭 四系投入：'+Object.keys(ATTRS).map(k=>ATTRS[k].name+' '+(hrs[k]/60).toFixed(1)+'h').join(' · ')+'（合计 '+(totalMin/60).toFixed(1)+'h）');
  if(monthDone.length) lines.push('🌕 本月主线推进：'+monthDone.join('、'));
  if(yearDoneList.length) lines.push('🗺️ 今年大道完成：'+yearDoneList.join('、'));
  if(newVisits.length) lines.push('🌍 新到访：'+newVisits.join('、'));
  if(drops.length) lines.push('🛡️ 嘉奖掉落：'+drops.join(' · '));
  if(ups.length) lines.push('⭐ 突破：'+ups.join('；'));
  lines.push('📈 当前 Lv.'+gL+'（加权经验 '+Math.round(gxp)+'）');
  lines.push('💡 一句话：这'+(kind==='week'?'周':'月')+'把节奏稳住，'+ (totalMin>0?'有在持续投入。':'可以再往前推一步。'));
  return { title:(kind==='week'?'周报':'月报')+' · Lv.'+gL, text:lines.join('\n') };
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
  const box=document.getElementById('reportOut');
  if(box){ box.style.display='block'; box.textContent=rep.text; }
  if(push) pushText(rep.title, rep.text);
}

(async ()=>{
try{
  await load();
  applyTheme();                   // 应用上次选择的命理主题皮肤
  newDay();                       // 日期变化时自动结算连击、重置日常/周/月
  REC_DATE='';                   // 默认记今天
  const _ri=document.getElementById('recDate'); if(_ri) _ri.value=todayStr();
  lastLevel = lvlOf(overallXP());
  try{ npcRoll(); seasonCheck(); checkVolume(); letterCheck(); if(!S.enc.cur) encounterRoll(true); }catch(e){ console.warn('v5.19 init',e); }
  checkAch();
  render();
  applyDashOrder();
  initDashDrag();
  const _ip=(location.hash||'#dashboard').slice(1);
  showPage(['dashboard','journey','current','longterm','growth','map','ledger','loot','data'].indexOf(_ip)>=0?_ip:'dashboard');
  try{ maybeShowBrief(); }catch(e){}
  fillGhInputs();
  renderAssetEditor();
  const lDate=document.getElementById('lDate'); if(lDate) lDate.value=todayStr();
  const _w=document.getElementById('weightInput'); if(_w && S.weight) _w.value=S.weight;
  if(FS_AVAILABLE && !saveFileHandle){
    const b=document.getElementById('fsBanner'); if(b) b.style.display='block';
  }
  const _pc=document.getElementById('pwdCur'); if(_pc) _pc.textContent = ((store.get(PWD_KEY)||'').trim()!=='')? '当前：自定义口令' : '当前：默认口令';
  setupPwdGate();
  startAutoBackup();
}catch(e){
  document.body.insertAdjacentHTML('afterbegin','<div style="color:var(--warn);padding:12px">初始化出错：'+e.message+'</div>');
}
})();
