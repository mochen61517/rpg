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
// 故人视角的祝福/鼓励（用于「我们的链接」面板，每日一封；点「换一封」可轮换）。
// 主题：享受当下、好好对待自己、不必硬撑、慢慢来。
const NPC_BLESSINGS={
  lin:[
    '你不必每场都赢。能把拍子握稳、把脚步踩实，今天的你就已经在变好。',
    '球路上的进步从来不是直线。允许自己有打不出来的那天，明天再来就行。',
    '我看过你从生疏到有了自己的节奏。别急，你的球会越来越像你自己。',
    '累了就歇一场，不丢人。会休息的人，才打得久。',
    '今天不为比分，只为你站上场地时心里那点高兴——那东西最贵。'
  ],
  shen:[
    '你总怕步子不够稳。可我认识的你，是说了就会去做的人，这就够用了。',
    '别把「还没成」当成「不行」。你投出去的每一份都算数，只是回报有时晚一点。',
    '今天的你不用向谁证明什么。把眼前这件小事做完，路自己会亮。',
    '我替你留着门。想清楚要进哪扇，比急着进门更重要。',
    '稳一点没关系。够大够稳的地方，值得你多花点时间找。'
  ],
  yun:[
    '今天别硬撑。把「我没事」换成「我累了」，身体会谢谢你的。',
    '你值得被好好对待，尤其是被你自己。今晚早点睡，算我说的。',
    '休息不是后退。你停下来喘口气的那会儿，也是在往前。',
    '别总把照顾别人放在前面。今天，先把温柔留一点给自己。',
    '身体给你的信号，比任何计划都诚实。听见了，就依它一回。'
  ],
  bailu:[
    '你不必弹得多好，弹得完整就好。错几个音，曲子还是你的。',
    '留一点什么都不赶的时间。发呆、哼歌、看云，这些也是正经事。',
    '我听见你最近心里常哼的调子了。那是你自己的声音，别弄丢。',
    '今天不为任何人表演。只做一件纯粹让自己高兴的小事。',
    '慢下来不是浪费。你认真过的每一天，最后都会变成你自己的东西。'
  ]
};
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
function npcRel(pid){ if(!S.npcRel) S.npcRel={}; if(!S.npcRel[pid]) S.npcRel[pid]={xp:0,done:0,know:0}; return S.npcRel[pid]; }
function npcRelInfo(pid){
  const r=npcRel(pid), xp=Math.max(0,r.xp||0); let i=0; for(let j=0;j<NPC_REL_STEPS.length;j++) if(xp>=NPC_REL_STEPS[j].v)i=j;
  const cur=NPC_REL_STEPS[i], next=NPC_REL_STEPS[Math.min(i+1,NPC_REL_STEPS.length-1)];
  const pct=i===NPC_REL_STEPS.length-1?100:Math.round((xp-cur.v)/(next.v-cur.v)*100);
  return {xp,level:i,name:cur.n,next:next.n,pct,know:r.know||0};
}
function npcMemory(p,ri){
  const lines={
    lin:['他还在观察你的脚步。','他记住了你肯练，也肯复盘。','他说你的球开始有自己的样子。','他不再只把你当学生。'],
    shen:['掌柜先看行动，再看人。','他开始相信你说过的话会落地。','有些门路，他愿意替你多问一句。','他把你当成了可以共事的人。'],
    yun:['她提醒你别总把累藏起来。','她知道你正在学着不再硬撑。','你没说出口的疲惫，她也能看见。','药庐总为你留着一盏灯。'],
    bailu:['先生还不知道你会留下什么声音。','他开始认得你常弹、常唱的调子。','他愿意把压箱底的旧谱拿给你。','有些沉默，你们已经不必解释。'],
  };
  const a=lines[p.id]||['故人记得你来过。']; let s=a[Math.min(ri.level,a.length-1)]; if(ri.know) s+=' 你们断断续续聊过 '+ri.know+' 回，他记下了你的一些小事。'; return s;
}
// ===== v5.48 江湖委托 · 对话回应（故人按性格 + 关键词生成回应）=====
const NPC_CHAT_TOPICS={
  music:['琴','曲','谱','指法','音','歌','唱','弹','旋律','调','箫','笛','古筝','练琴','弹琴','哼','曲子','段落'],
  sport:['球','拍','步法','杀球','高远','羽','比赛','挥拍','发球','接杀','练球'],
  career:['投','简历','面试','工作','职','offer','岗位','公司','薪','规划','方向','求职'],
  body:['累','困','睡','休息','身体','拉伸','喝','走','步','作息','肩','腰','舒服'],
  struggle:['卡','难','不会','挫败','烦','焦虑','迷茫','怕','担心','压力','崩','卡住'],
  good:['顺','好','进','开心','喜欢','享受','稳','放松','棒','成','顺畅'],
  calm:['慢','耐心','静','留白','发呆','不赶','节奏']
};
function npcChatTopics(text){ const t=text||''; const hit=[]; for(const k in NPC_CHAT_TOPICS){ if(NPC_CHAT_TOPICS[k].some(function(w){return t.indexOf(w)>=0;})) hit.push(k); } return hit; }
const NPC_CHAT_OPEN={
  lin:['（林教头把毛巾搭在肩上，看你一眼。）','林教头擦了擦拍子，把旁边的矮凳挪了挪。'],
  shen:['（沈掌柜从账本里抬起头。）','沈掌柜把算盘往旁边一推。'],
  yun:['（云娘放下药杵，淡淡看你。）','云娘给你倒了杯温的。'],
  bailu:['（白鹭先生没抬头，指尖还停在弦上。）','白鹭先生把谱子合上一半。']
};
const NPC_CHAT_BYATTR={
  BADMINTON:{music:['球馆旁边那家琴行我常去。你弹的是哪首？下次带来，我替你数着拍子听。','动作和旋律一样，重复到身体记住就顺了。你这首练到第几遍了？'],
    sport:['球不骗人。你这周摸了几回拍子，身体比嘴诚实。哪一下最让你来劲？','步法这东西，慢就是快。你今天卡在哪一个动作？'],
    career:['球和你找工作其实一理：先站上场，比想清楚更重要。投出去没？','你总在我这儿谈球，回去也该给自己投几份。动了吗？'],
    body:['练球别忘了喝水。你今天喝够没？','别硬撑。累了就歇一场，不丢人。'],
    struggle:['卡住很正常，我带过的没有一个不卡过。你卡的是手，还是心里？','烦的时候去打两拍，比坐着烦有用。'],
    good:['顺就好。顺的时候多记几下身体的感觉，以后卡了拿出来想。','你今天这股劲，留着，下周还用得上。'],
    calm:['慢点好。球路是急不出来的。','你愿意慢，说明开始懂这项运动了。']},
  CAREER:{music:['你还有这一面。弹琴的时候，是不是反而最不想那些事？','我听人弹过。你弹的那首，是最近总在心里转的调子吗？'],
    sport:['身体得动。你这周动过没？别光坐着改简历。','球我是外行，但我知道：上场前想太多，反而打不出来。'],
    career:['你做的每一小步我都记着。别急着要结果，先动。','简历改到第几版了？拿给我，我替你挑刺。','投出去没？投了才算数，改一百版不投等于零。'],
    body:['忙归忙，别把身体当了代价。你今晚几点睡？','你总替别人操心，自己的作息先顾上。'],
    struggle:['迷茫我见过太多。先别想清楚「一生」，先把这周那一步落了。','怕是正常的。怕着怕着，事情也就做了。'],
    good:['顺就趁热打铁，把那一步落了。','你这股劲头，掌柜的认。'],
    calm:['慢点没关系。够大够稳的地方，值得多花点时间找。','你愿意慢，反而让我放心。']},
  BODY:{music:['弹琴也算休息的一种。你弹的时候，脑子里那些事是不是轻了点？','我虽不懂琴，但知道让你舒服的事得留着。'],
    sport:['动一动比躺着想强。你今天走够一万步没？','球我陪不了，但你的身子我管。今天拉伸了没？'],
    career:['外面的事再急，也先把自己安顿好。你今天睡够没？','你总为先别的事累。今晚十一点前躺下，算我说的。'],
    body:['听见你照顾自己，比什么都好。今天哪一下让你松了口气？','别硬撑。累了就说累，身体最诚实。'],
    struggle:['撑不住就说。药庐的门，你随时能进。','你这一阵太紧了。今天能不能只做一件让自己舒服的小事？'],
    good:['舒服就好。把这种感觉留住，明天还来。','你今天对自己好了一点，我看见了。'],
    calm:['慢下来不是浪费。你认真过的每一天，最后都是你自己的。','留白也是正经事。']},
  MIND:{music:['你弹的那首，我猜是最近常在你心里转的调子。下次弹给我听听？','弹得完整就好，错几个音，曲子还是你的。你这周练的是哪首？','旋律这种东西，自己听得进去最重要。你弹的时候，是想起了什么，还是只想让手指动起来？'],
    sport:['身体是乐器的底色。你这周动过没？','我不太懂球，但我知道重复到顺，和练琴是一个理。'],
    career:['外面的事放一放，先给自己留点只为自己做的事。','你总在替别人打算。今天能不能只做一件让自己高兴的？'],
    body:['弦会紧，人也会。你今天松了哪一根弦？','累了就去睡，别等弦崩了才歇。'],
    struggle:['卡住就先停。错音不毁一曲，卡住也不毁你。你卡的是哪一段？','你愿意说，我就愿意听。慢慢来。'],
    good:['享受就好。这种时刻不用分给任何人。','你今天这股松快，留着，它会变成你自己的东西。'],
    calm:['留白最贵。你今天发呆了吗？','慢一点，旋律才会自己长出来。']}
};
const NPC_CHAT_GENERIC={
  music:'你说的是哪一首？下次带来，我替你听着。',
  sport:'动起来就好。你这周动了几回？',
  career:'你做的每一步都算数。先动，再谈别的。',
  body:'照顾好自己，别的才谈得上。',
  struggle:'卡住很正常。你不是第一个，也不会是最后一个。',
  good:'顺就趁热。把这一步落了。',
  calm:'慢点好。急不出来的。'
};
const NPC_CHAT_CLOSE=['你接着说，我听着。','下次想聊什么，随时来。','这事你打算怎么接着做？','你心里其实已经有答案了吧？','这周还想跟我念叨点什么？'];
function npcReply(pid, q, text){
  const p=NPCS.find(function(n){return n.id===pid;})||{n:'故人',a:'MIND'};
  const ri=npcRelInfo(pid);
  const open=(NPC_CHAT_OPEN[pid]||['（故人看了你一眼。）'])[ri.level>=2?1:0];
  const topics=npcChatTopics(text);
  let body;
  if(!topics.length){ body='我在听。你愿意多说两句吗？'; }
  else {
    const primary=topics[0];
    const bank=NPC_CHAT_BYATTR[p.a]&&NPC_CHAT_BYATTR[p.a][primary];
    const pool=(bank&&bank.length)?bank:[NPC_CHAT_GENERIC[primary]];
    body=pool[(ri.know+text.length)%pool.length];
    if(topics.length>1){ const t2=topics[1]; const b2=NPC_CHAT_BYATTR[p.a]&&NPC_CHAT_BYATTR[p.a][t2]; if(b2&&b2.length) body+=' '+b2[(ri.know+1)%b2.length]; }
  }
  let close='';
  if(Math.random()<0.6) close=' '+NPC_CHAT_CLOSE[(ri.know+text.length)%NPC_CHAT_CLOSE.length];
  return open+' '+body+close;
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
  addHist('📜 本周江湖委托已刷新（四位故人各留一言）');
}
function npcDone(qid){
  const q=S.npc.active.find(x=>x.id===qid); if(!q) return;
  const wasTodayFocus=ensureTodayPlan().focusId===qid;
  q.done=!q.done;
  const p=NPCS.find(n=>n.id===q.npc);
  if(q.done){
    S.bonusXP=(S.bonusXP||0)+q.xp;
    touchActivity(todayStr());
    addHist('✔【江湖委托】'+(p?p.n:'')+'：'+q.t+' +'+q.xp+' XP', q.xp);
    if(p){ const before=npcRelInfo(p.id).level, rel=npcRel(p.id); rel.xp=(rel.xp||0)+1; rel.done=(rel.done||0)+1; const after=npcRelInfo(p.id); if(after.level>before) setTimeout(()=>celebrateTask(p.ic+' 与'+p.n+'的关系升为「'+after.name+'」'),420); if(before<2&&after.level>=2&&!S.npcEvents[p.id]) setTimeout(()=>celebrateTask('📜 '+p.n+'的专属事件已解锁'),800); }
    celebrateTask((p?p.ic+' '+p.n+'点了点头。':'✔ 江湖委托达成'));
    setTimeout(()=>showQuestSettlement({id:q.id,text:q.t,attr:q.a,mins:q.min||0,xp:q.xp||0,focusDone:wasTodayFocus}),180);
    // 四人全清 → 额外嘉奖
    if(S.npc.active.every(x=>x.done)){
      addHist('🏮 本周江湖委托全清');
      try{ const drp=dropReward('medium','本周江湖委托全清'); if(drp) setTimeout(()=>celebrateTask('🎁 四方尽欢：'+findReward(drp.rewardId).name),200); }catch(e){}
    }
  } else {
    S.bonusXP=Math.max(0,(S.bonusXP||0)-q.xp);
    addHist('✘【江湖委托】'+(p?p.n:'')+'：'+q.t, -q.xp);
    if(p){ const rel=npcRel(p.id); rel.xp=Math.max(0,(rel.xp||0)-1); rel.done=Math.max(0,(rel.done||0)-1); }
  }
  save(); checkAch(); render();
}

