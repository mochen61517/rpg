

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
// 运行期错误兜底：任何未捕获 JS 错误显示在页面顶部红条，便于定位（不阻断使用）
window.onerror=function(msg,src,line,col,err){
  try{
    const bar=document.getElementById('__runtimeErrBar');
    const m=(err&&err.message)||msg||'未知错误';
    if(bar){ bar.textContent='⚠ 运行错误：'+m+'（如影响使用请截图反馈）'; bar.style.display='block'; }
    else{
      const b=document.createElement('div'); b.id='__runtimeErrBar';
      b.style.cssText='position:fixed;left:8px;right:8px;top:8px;z-index:99999;background:#7a2222;color:#fff;padding:10px 12px;border-radius:8px;font-size:13px;box-shadow:0 4px 16px rgba(0,0,0,.4)';
      b.textContent='⚠ 运行错误：'+m+'（如影响使用请截图反馈）';
      document.body.appendChild(b);
    }
  }catch(_){}
  return false;
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
// v5.49 羽毛球按「打球 / 基本功」拆分历史 1649h：26 年前约一周基本功 2h、其余打球（用户口述），按 2/3 · 1/3 拆。
// 旧复合轨道日志(key='badminton')归入打球；基本功历史基数按比例预填，可在卡片上双击改。
const BM_PLAY_BASE = Math.round(BADMINTON_LIFETIME_HOURS*2/3*60);
const BM_BASIC_BASE = BADMINTON_LIFETIME_HOURS*60 - BM_PLAY_BASE;
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
// 当前「记录于」日期：补录入口（REC_DATE）生效时返回那天，否则返回今天。
// 今日行动页的复利轨道 / 今日主线都用它判定「该显示/记录哪一天」，从而切到过去日期能看到那天已点亮的图标。
function recordDateStr(){ return REC_DATE || todayStr(); }
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
// cd = 冷却天数（控制每月掉落频率）：纯K唱歌≈2次/月、电影≈2-3次/月、短途≈1次/月、其余错开
const REWARDS = [
  {id:'r_cake',    name:'一块蛋糕',        icon:'🍰', tier:'micro',  money:30,   time:0.5, desc:'小确幸',       cd:21},
  {id:'r_milktea', name:'一杯奶茶',        icon:'🧋', tier:'micro',  money:25,   time:0.3, desc:'小确幸',       cd:21},
  {id:'r_book',    name:'一本想要的书',    icon:'📚', tier:'micro',  money:60,   time:0.5, desc:'精神食粮',     cd:21},
  {id:'r_meal',    name:'一顿喜欢的大餐',  icon:'🍲', tier:'small',  money:200,  time:2,   desc:'犒劳胃',       cd:20},
  {id:'r_movie',   name:'一场电影',        icon:'🎬', tier:'small',  money:80,   time:3,   desc:'放松一下',     cd:12},
  {id:'r_spa',     name:'一次按摩SPA',     icon:'💆', tier:'medium', money:600,  time:2,   desc:'身体回血',     cd:25},
  {id:'r_gear',    name:'一件心仪的数码',  icon:'🎧', tier:'medium', money:800,  time:2,   desc:'心动物件',     cd:25},
  {id:'r_sneaker', name:'一双喜欢的球鞋',  icon:'👟', tier:'big',    money:1200, time:3,   desc:'运动装备升级', cd:30},
  {id:'r_ktv',     name:'一次纯K唱歌',     icon:'🎤', tier:'medium', money:300,  time:3,   desc:'开嗓放松',     cd:15},
  {id:'r_trip',    name:'一次周末短途旅行',icon:'🚆', tier:'big',    money:1500, time:48,  desc:'换个环境充能', cd:30},
];
function findReward(rid){ return REWARDS.find(r=>r.id===rid) || (S.customRewards||[]).find(r=>r.id===rid); }
// 全球每周冷却：保持「一周一个嘉奖」的新鲜感（太多就没意思了）
const REWARD_GLOBAL_CD_DAYS = 7;
function dropReward(tier, reason){
  const pool0=REWARDS.filter(r=>r.tier===tier);
  if(!pool0.length) return null;
  const DAY=86400000, now=Date.now();
  // 全球每周最多 1 个：一周内已有掉落则跳过
  const lastAny=S.rewards.lastDropTs ? new Date(S.rewards.lastDropTs.replace(' ','T')).getTime() : 0;
  if(now-lastAny < REWARD_GLOBAL_CD_DAYS*DAY) return null;
  // 单奖励冷却：实现「电影≈2-3次/月、纯K≈2次/月、短途≈1次/月」的错落频率
  const lb=S.rewards.lastByReward||{};
  const pool=pool0.filter(function(r){
    const ld=lb[r.id]; if(!ld) return true;
    const cd=r.cd||0; if(!cd) return true;
    return (now - new Date(ld.replace(' ','T')).getTime()) >= cd*DAY;
  });
  if(!pool.length) return null;
  const r=pool[Math.floor(Math.random()*pool.length)];
  const drop={rewardId:r.id, ts:new Date().toISOString().slice(0,16).replace('T',' '), tier, reason:reason||''};
  S.rewards.drops.push(drop);
  S.rewards.lastDropTs=drop.ts;
  S.rewards.lastByReward=S.rewards.lastByReward||{};
  S.rewards.lastByReward[r.id]=drop.ts;
  return drop;
}
function claimReward(idx){
  const drop=S.rewards.drops[idx];
  if(!drop || drop.claimed) return;
  drop.claimed=true;
  drop.claimedAt=new Date().toISOString().slice(0,16).replace('T',' ');
  save();
  render();   // 立即重绘：置灰 + 已享用按钮 + 移到列表底部
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
    avatar:'',                                // 用户上传头像（base64 dataURL）；空则使用 HTML 默认头像
    lfLog:{},        // 低频疗愈组冷却日志：{heal:[日期...], eye:[...]}，跨任务对象持久
    migLf211:false,  // 必须为 false：load() 用 Object.assign(defaultState(), 老存档)，若默认 true 会覆盖掉老存档的缺失值，迁移将永不执行
    weights:{BADMINTON:1.3,CAREER:1.5,BODY:1.1,MIND:1.0},
    attrs:{BADMINTON:0,CAREER:0,BODY:0,MIND:0},
    // v5.39 计时型日课全部搬进「复利轨道」（羽毛球/力量/拉伸/精神充电/职业行动），
    // 那边可直接填分钟并标记完成，此处只留没有时长、纯打勾的小习惯，避免同一件事记两遍。
    daily:[
      {id:id(),t:'今天喝够水',a:'BODY',xp:5,min:0,mode:'fixed',done:false,rec:'每日'},
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
      makeSingYear(),
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
      {id:'sing1',ic:'🎶',n:'歌艺修行',lv:'0',d:'进行中 · K歌从 80+ 冲击 90+',next:'1.0：单首稳定破 90（年道认领）',un:false,auto:q=>{var i=(S.year||[]).findIndex(function(c){return c.id==='yg_sing90';});return i>=0&&yearDone(i);}},
    ],
    goals: defaultGoals(),
    mainQ:null,
    lastDaily:d, lastWeekly:monday(), lastMonth:thisMonth(),
    sideBank: defaultSideBank(),
    sideDaily: [],
    sideWeekly: [],
    sideMonthly: [],
    sideMeta: {dailyDate:'',weeklyKey:'',monthlyKey:''},
    myJianghu: [],
    assets: null,   // 资产快照：null=未录入（首次在设置页录入，仅存本机）
    ledger: [],
    coin: { target:0, initial:0, labor:[] },  // 金币人生：目标金币 / 初始金币 / 搬砖时长打卡（labor:[{id,date,hours,link}]）
    hobbies: defaultHobbies(),
    wishes: defaultWishes(),
    trips: [],                    // 旅行脚印：[{id, name, sub, date, rating, refl, wish, createdAt}] —— v5.43 替代自绘世界地图
    travel: {},                 // 旅行地图：{ [placeId]: {visited,date,rating,refl} }  // v5.43 起由 trips 接管，保留字段以兼容旧数据
    travelGoals: {year:null, month:null},  // 年/月旅行目标（地点 id）
    equips: { owned:['eq_racket','eq_handbook','eq_whey','eq_vinyl','eq_ring','eq_cloak'], equipped:[] }, // 装备库：owned=已拥有 equipped=已装备
    customEquips: [],             // 用户自制装备
    rewards: { drops:[], dailyCount:0, dailyDate:'' }, // 嘉奖箱：drops=掉落记录 dailyCount=每日掉落计数
    customRewards: [],            // 用户自制奖励
    lootTab: 'equips',            // 战利品页当前 tab
    trend: [],                    // 趋势曲线时序快照：{d,xp,net,w}
    weight: null,                 // 最新体重（kg），仅用于趋势
    theme: 'light',               // 命理主题皮肤：light / bing(丁火清凉) / dark(命理·夜)
    hiddenPages: ['ledger'],      // 默认隐藏的板块（导航与页面入口）；目前仅钱庄，可设置页恢复
    brief: { last:'' },           // 今日战报：最近展示日期
    npc: { active:[], week:'', seenWeek:'' },  // NPC 委托：本周在办委托 + 所属周 + 已读周
    npcRel: {},                                 // v5.23 NPC 关系：{npcId:{xp,done}}
    npcEvents: {},                              // v5.24 NPC 专属事件：{npcId:{choice,ts}}
    npcRelics: [],                              // v5.24 故人信物 id 列表（叙事收藏，不加数值）
    weekReview: {focus:{},sealed:{}},                 // v5.26 每周复盘与下周唯一重点
    taskView: {date:'',compact:false},                // v5.27 智能减负：今日三件模式
    uiPrefs: {quiet:false},                           // v5.29 奖励通知合并 / 安静模式
    story: {lastDate:'',lastFate:'',history:[]}, // v5.23 命运签跨日余波
    skill: { spent:{}, un:[] },   // 技能树：各系已花点数 + 已解锁节点 id
    season: { cur:'', titles:[], worn:'' }, // 赛季：当前赛季 / 已获称号 / 佩戴中
    draw: { date:'', yi:'', ji:'', claimed:false }, // 每日宜忌抽签：当日签文 + 是否已承接气运
    letters: { unlocked:[], pointer:0 },             // 远方来信：已解锁信件队列
    enc: { cur:null, done:[], seen:false },          // 江湖偶遇：当前偶遇 + 已完成记录 + 已读标记
    bonds: { blessRead:'' },                        // 故人·我们的链接：今日祝福信是否已读
    bioAge: {                                   // 身体年龄 / 心理年龄系统
      sleepHours:null, steps:null, restingHR:null, // 可选手动录入健康数据
      lastCompute:'', bodyAge:0, mentalAge:0,     // 缓存：上次计算日期 / 结果
      factors:{},                                // 各因素明细（供展示）
      sleepLog:{}, ageLog:{}                     // 每日睡眠时长 / 体龄脑龄快照（精力页趋势用）
    },
    todayPlan: {date:'', focusId:'', mode:'normal', main:[], settled:[]}, // v5.44 今日主线：main=当天手动选中的复利轨道 key
    jianghu: {date:'', seed:0, list:[]},                                   // v5.44 江湖任务日榜：每日按难度分层抽取，越靠上越难
    reports: [],                    // 周报/月报历史：{kind,ts,title,html,text}
    garden: {growing:[], harvested:[], maxGrowing:3}, // v6.0.39 灵圃（多项目盲盒栽种 · 我的植物）；v6.0.45 同时生长上限默认 3
    capsules: [],                  // v6.0.32 时间胶囊：{id,text,sealedOn,unlockOn,opened}
    demons: {                     // v6.0.36 心魔挑战（温和：削弱而非击败）
      procrast:{name:'拖延',icon:'🐌',intensity:60,acts:['列今日三件要事','先啃最硬的那块','关掉干扰 25 分钟']},
      anxiety:{name:'焦虑',icon:'🌫',intensity:60,acts:['闭眼呼吸 3 分钟','写下最担心的 1 件事','到户外走 10 分钟']},
      overthink:{name:'内耗',icon:'🌀',intensity:60,acts:['写一句话给未来的自己','复盘本周得失','只做不想']}
    },
    pets: [                        // 灵宠（可交互猫角色，可多只）
      { name:'土豆', birthday:'2021-02-24', adopted:'',
        breed:'中华田园（狸花橘）', color:'橘黄虎斑', emoji:'🐱',
        personality:['黏人','爱蹭人','爱撒娇','认主','被摸下巴会眯眼呼噜'],
        notes:'', lastGreet:'', birthdayShown:'', remindKey:'' },
      { name:'pepper', birthday:'2022-06-25', adopted:'',
        breed:'', color:'', emoji:'🐱',
        personality:['黏人','爱撒娇','护食','半夜跑酷'],
        notes:'', lastGreet:'', birthdayShown:'', remindKey:'' }
    ],
    birthdays: [                   // 重要日子·生日提醒（灵宠见 pets；此处为人）
      {name:'我自己', rel:'自己', date:'06-15', lunar:false, note:'给自己放个假，写一句今年的生日愿望', remindKey:''},
      {name:'我爸',  rel:'父亲', date:'12-05', lunar:false, note:'打个电话 / 发消息说声生日快乐', remindKey:''},
      {name:'我妈',  rel:'母亲', date:'03-16', lunar:true,  note:'做顿饭 / 买束花 / 视频通话', remindKey:''},
      {name:'鹿茸',  rel:'好友', date:'10-28', lunar:true,  note:'发一句生日祝福，约个见面', remindKey:''}
    ],
    birthdayReminders: [],        // 生日来信：临近时生成的提醒信 {id,forName,rel,type,solarDate,daysLeft,body,year,read,questId}
    birthdayQuests: [],           // 生日江湖委托：{id,icon,forName,rel,type,title,a,xp,due,done,year,bdayLabel}
    // v6.0.53 主体性（武侠境界 · 心理主权）：量「代理行为」而非「动机」——揭榜守诺、立心、菲式历练皆喂养之；不解释、不分类、不衰减惩罚。
    subjectivity: 0,               // 0–100，当前主体性强弱
    subjectivityLog: [],           // 分值变化记录：{d,delta,reason,score}
    openerMode: 'mindful',         // 今日一句风格：mindful(正念) | faye(菲式)
    feiTrials: {},                 // 王菲·菲式历练完成标记：trialId -> true
  };
}

let S = defaultState();
let lastLevel = 0;     // 上次渲染时的总等级，用于检测升级并触发庆祝
let newlyDone = [];    // 本帧刚完成的任务 id，用于触发闪光动效
function makeSingYear(){
  return {id:'yg_sing90', t:'声乐精进：K歌从 80+ 冲击 90+（2026）', paused:false, done:false, items:[
    {id:id(), t:'建立每日 30 分钟训练习惯（哼鸣热身 + 长音强弱推拉 + 舒适区曲目）', a:'MIND', xp:0, min:30, mode:'time', done:false},
    {id:id(), t:'锁定舒适区：柔润气声抒情 ballad（梁静茹/刘若英/郁可唯/王菲气声曲），先不碰爆发型', a:'MIND', xp:0, min:30, mode:'time', done:false},
    {id:id(), t:'稳定性雷达拉到 88+（重拍亮起、音量不再「轻到听不见」）', a:'MIND', xp:0, min:0, mode:'fixed', done:false},
    {id:id(), t:'完整跑舒适区曲目，稳定站上 85+（用进度区记每次 K 歌分数）', a:'MIND', xp:0, min:60, mode:'time', done:false},
    {id:id(), t:'单首突破 90（选 空白格 / 痴心换情深 / 水中花 其一）', a:'MIND', xp:120, min:0, mode:'fixed', done:false},
  ]};
}

function migrate(){
  // v6.0.53 主体性 / 今日一句风格 / 菲式历练：兼容旧存档
  if(typeof S.subjectivity!=='number' || isNaN(S.subjectivity)) S.subjectivity=0;
  if(!Array.isArray(S.subjectivityLog)) S.subjectivityLog=[];
  if(typeof S.openerMode!=='string' || (S.openerMode!=='mindful'&&S.openerMode!=='faye')) S.openerMode='mindful';
  if(typeof S.feiTrials!=='object' || !S.feiTrials) S.feiTrials={};
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
  // v5.50 年主线新增「声乐精进：K歌 80→90」+ 歌艺成就（兼容旧存档注入）
  if(!S.yearSingGoal_v1){
    if(!((S.year||[]).some(function(c){ return /唱歌|声乐|歌艺|K歌|从\s*80|80\s*\+/.test(c.t||''); }))){
      S.year=S.year||[];
      S.year.push(makeSingYear());
      if(Array.isArray(S.history)) S.history.push({ts:new Date().toISOString().slice(0,16).replace('T',' '),text:'年主线新增「声乐精进：K歌从 80+ 冲击 90+」并接入声音画像进度区',xp:0});
    }
    if(!((S.ach||[]).some(function(a){ return a.id==='sing1'; }))){
      S.ach=S.ach||[];
      S.ach.push({id:'sing1',ic:'🎶',n:'歌艺修行',lv:'0',d:'进行中 · K歌从 80+ 冲击 90+',next:'1.0：单首稳定破 90（年道认领）',un:false,auto:function(q){ var i=(S.year||[]).findIndex(function(c){return c.id==='yg_sing90';}); return i>=0 && yearDone(i); }});
    }
    S.yearSingGoal_v1=true;
  }
  // v6.0.35 隐藏成就注入（旧档兼容；解锁前不显示在待解锁列表）
  if(S.ach && !S.ach.some(function(a){ return a.id==='h_known'; })){
    var _yr=new Date().getFullYear();
    var _hd=new Set((S.hist||[]).map(function(h){return h.d;}).filter(Boolean));
    var _jq=[]; if(typeof JIEQI!=='undefined'){ JIEQI.forEach(function(q){ var ds=_yr+'-'+String(q[0]).padStart(2,'0')+'-'+String(q[1]).padStart(2,'0'); if(_hd.has(ds)) _jq.push(q[2]); }); }
    S.ach.push(
      {id:'h_known', ic:'🔍', n:'自知者明', d:'记录精力满 30 天 · 看清自己的节律', hidden:true, un:false, auto:function(){ return Object.keys(S.energy||{}).length>=30; }},
      {id:'h_travel',ic:'🔍', n:'行走山河', d:'记过 5 处「去过」的旅行脚印', hidden:true, un:false, auto:function(){ return (S.trips||[]).filter(function(t){return !t.wish;}).length>=5; }},
      {id:'h_wish', ic:'🔍', n:'愿力可观', d:'点亮 8 枚人生愿望', hidden:true, un:false, auto:function(){ return (S.wishes||[]).filter(function(w){return w.un;}).length>=8; }},
      {id:'h_season',ic:'🔍', n:'与时偕行', d:'当年在 8 个节气当天留下记录', hidden:true, un:false, auto:function(){ return _jq.length>=8; }},
      {id:'h_xp',    ic:'🔍', n:'修为初成', d:'累计加权经验突破 8000', hidden:true, un:false, auto:function(){ return overallXP()>=8000; }}
    );
  }
  // v5.51.17 清理重复的歌唱年主线：保留 makeSingYear() 生成的「声乐精进：K歌从 80+ 冲击 90+」，删掉用户误新增的类似目标（如「纯K有6首歌可以达到90分+」）。
  if(!S.yearSingDupClean_v1){
    const singIdx=(S.year||[]).findIndex(function(c){return c.id==='yg_sing90';});
    if(singIdx>=0){
      const before=S.year.length;
      const dupRe=/唱歌|声乐|K歌|90分|90\+|歌艺|纯K|6首歌/;
      S.year=S.year.filter(function(c,i){ return !(i!==singIdx && dupRe.test(c.t||'')); });
      const removed=before-S.year.length;
      if(removed>0 && Array.isArray(S.history)) S.history.push({ts:new Date().toISOString().slice(0,16).replace('T',' '),text:'清理重复的歌唱年主线 ×'+removed+' 条',xp:0});
    }
    S.yearSingDupClean_v1=true;
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
  if(!Array.isArray(S.trips)) S.trips = [];

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
  if(typeof S.rewards.lastDropTs!=='string') S.rewards.lastDropTs='';
  if(!S.rewards.lastByReward || typeof S.rewards.lastByReward!=='object') S.rewards.lastByReward={};
  // v6.0.46 嘉奖箱未兑换清理：只保留最新 3 个未享用，其余移除（太多没新鲜感）；claimed 历史全留
  if(Array.isArray(S.rewards.drops)){
    const claimed=S.rewards.drops.filter(function(d){return d.claimed;});
    let unclaimed=S.rewards.drops.filter(function(d){return !d.claimed;});
    unclaimed.sort(function(a,b){return (a.ts||'').localeCompare(b.ts||'');});
    const keep=unclaimed.slice(-3);
    S.rewards.drops=claimed.concat(keep);
  }
  if(!Array.isArray(S.customRewards)) S.customRewards=[];
  if(!S.lootTab) S.lootTab='equips';
  // v5.17 新字段兜底
  if(!S.brief || typeof S.brief!=='object') S.brief={last:''};
  if(typeof S.avatar!=='string') S.avatar='';
  if(!S.npc || typeof S.npc!=='object') S.npc={active:[],week:'',seenWeek:''};
  if(!Array.isArray(S.npc.active)) S.npc.active=[];
  if(typeof S.npc.seenWeek!=='string') S.npc.seenWeek='';
  if(!S.npcRel || typeof S.npcRel!=='object') S.npcRel={};
  if(!S.npcEvents || typeof S.npcEvents!=='object') S.npcEvents={};
  if(!Array.isArray(S.npcRelics)) S.npcRelics=[];
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
  // 灵宠 pets（v6.0.9 由单只 S.pet 升级为多只数组）
  if(!Array.isArray(S.pets)){
    const _old=S.pet;
    S.pets = (_old && typeof _old==='object') ? [_old] : [];
  }
  if(!S.pets.length) S.pets=[{name:'土豆',birthday:'2021-02-24',adopted:'',breed:'中华田园（狸花橘）',color:'橘黄虎斑',emoji:'🐱',personality:['黏人','爱蹭人','爱撒娇','认主','被摸下巴会眯眼呼噜'],notes:'',lastGreet:'',birthdayShown:'',remindKey:''}];
  S.pets.forEach(function(p){
    if(typeof p.name!=='string'||!p.name) p.name='猫';
    if(typeof p.birthday!=='string') p.birthday='2021-02-24';
    if(typeof p.adopted!=='string') p.adopted='';
    if(!Array.isArray(p.personality)) p.personality=['黏人','爱蹭人','爱撒娇','认主'];
    if(typeof p.emoji!=='string'||!p.emoji) p.emoji='🐱';
    if(typeof p.lastGreet!=='string') p.lastGreet='';
    if(typeof p.birthdayShown!=='string') p.birthdayShown='';
    if(typeof p.remindKey!=='string') p.remindKey='';
  });
  if(!Array.isArray(S.birthdays)) S.birthdays=[
    {name:'我自己',rel:'自己',date:'06-15',lunar:false,note:'给自己放个假，写一句今年的生日愿望',remindKey:''},
    {name:'我爸',rel:'父亲',date:'12-05',lunar:false,note:'打个电话 / 发消息说声生日快乐',remindKey:''},
    {name:'我妈',rel:'母亲',date:'03-16',lunar:true,note:'做顿饭 / 买束花 / 视频通话',remindKey:''},
    {name:'鹿茸',rel:'好友',date:'10-28',lunar:true,note:'发一句生日祝福，约个见面',remindKey:''}
  ];
  S.birthdays.forEach(function(b){ if(typeof b.remindKey!=='string') b.remindKey=''; if(typeof b.note!=='string') b.note=''; if(typeof b.lunar!=='boolean') b.lunar=false; });
  if(!Array.isArray(S.birthdayReminders)) S.birthdayReminders=[];
  if(!Array.isArray(S.birthdayQuests)) S.birthdayQuests=[];
  delete S.pet;   // 旧单只字段已并入 S.pets
  // v6.0.36 板块显隐默认：钱庄默认隐藏（仅旧档首次运行生效，用户清空后不覆盖）
  if(!Array.isArray(S.hiddenPages)) S.hiddenPages=['ledger'];
  // v6.0.39 灵圃：旧单株结构 → 多项目结构（growing / harvested）
  if(!S.garden || typeof S.garden!=='object') S.garden={growing:[],harvested:[]};
  if(!Array.isArray(S.garden.growing)) S.garden.growing=[];
  if(!Array.isArray(S.garden.harvested)) S.garden.harvested=[];
  if(typeof S.garden.maxGrowing!=='number' || S.garden.maxGrowing<1) S.garden.maxGrowing=3; // v6.0.45 同时生长上限兜底
  // 旧版 planted/species/history 的数据尽量保留：已收获的转 harvested，正在种的丢弃（结构不兼容）
  if(S.garden.history && Array.isArray(S.garden.history)){
    S.garden.history.forEach(function(h){ S.garden.harvested.push({proj:'', species:h.species||'pine', plantedAt:'', bloomedOn:h.bloomedOn||'', cycleH:0}); });
    delete S.garden.history;
  }
  if(!Array.isArray(S.capsules)) S.capsules=[]; // v6.0.32 时间胶囊兜底
  if(!S.demons || typeof S.demons!=='object'){ // v6.0.36 心魔兜底
    S.demons={procrast:{name:'拖延',icon:'🐌',intensity:60,acts:['列今日三件要事','先啃最硬的那块','关掉干扰 25 分钟']},
      anxiety:{name:'焦虑',icon:'🌫',intensity:60,acts:['闭眼呼吸 3 分钟','写下最担心的 1 件事','到户外走 10 分钟']},
      overthink:{name:'内耗',icon:'🌀',intensity:60,acts:['写一句话给未来的自己','复盘本周得失','只做不想']}};
  }
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
      if(typeof showPage==='function') showPage('dashboard'); // 登录成功默认进入仪表盘
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

// 手机访问：复制 GitHub Pages 链接（数据设置页「📱 手机访问」面板用）
function copyPhoneUrl(){
  const u = 'https://mochen61517.github.io/rpg/';
  const el = document.getElementById('phoneUrl'); if(el) el.value = u;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(u).then(()=>alert('📋 已复制手机访问链接')).catch(()=>_fallbackCopy(u));
  } else { _fallbackCopy(u); }
}
function _fallbackCopy(t){
  const ta=document.createElement('textarea'); ta.value=t; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); alert('📋 已复制手机访问链接'); }
  catch(e){ alert('复制失败，请手动复制：\n'+t); }
  document.body.removeChild(ta);
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
// ===== v6.0.53 主体性：武侠境界阶梯（量「代理行为」，不量动机纯度）=====
// 0–9 蒙尘之镜 / 10–24 认识自己 / 25–44 主体初立 / 45–64 我心为舵
// 65–79 我意已决 / 80–89 不惑于外 / 90–99 自在无羁 / 100 本心通明
function subjLevel(x){
  const t=Math.max(0,Math.min(100,Math.round(x||0)));
  const L=[
    {min:0,name:'蒙尘之镜'},{min:10,name:'认识自己'},{min:25,name:'主体初立'},
    {min:45,name:'我心为舵'},{min:65,name:'我意已决'},{min:80,name:'不惑于外'},
    {min:90,name:'自在无羁'},{min:100,name:'本心通明'}
  ];
  let r=L[0]; for(const s of L) if(t>=s.min) r=s;
  return r.name;
}
// 增减主体性：clamp 0–100，写变化日志（不衰减惩罚，只记录净额）。save() 由调用方决定是否再 render。
function addSubjectivity(delta, reason){
  if(typeof delta!=='number' || !isFinite(delta)) return;
  if(typeof S.subjectivity!=='number' || isNaN(S.subjectivity)) S.subjectivity=0;
  if(!Array.isArray(S.subjectivityLog)) S.subjectivityLog=[];
  const before=S.subjectivity;
  let v=before+delta; if(v<0)v=0; if(v>100)v=100;
  S.subjectivity=v;
  const real=Math.round(v-before);
  if(real!==0){
    S.subjectivityLog.push({d:todayStr(), delta:real, reason:reason||'', score:v});
    if(S.subjectivityLog.length>200) S.subjectivityLog=S.subjectivityLog.slice(-200);
  }
  try{ save(); }catch(e){}
}

