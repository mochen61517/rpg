/* Everyday actions and their archives share the existing save format. */
let memoryEntryKind='fragment';
function selectMemoryEntry(kind){
  memoryEntryKind=kind;
  document.querySelectorAll('[data-memory-form]').forEach(n=>n.hidden=n.dataset.memoryForm!==kind);
}
function setupMemoryEntry(){
  const pane=document.getElementById('jr-memory-pane');if(!pane)return;
  let editor=document.getElementById('memoryEntry');
  if(!editor){
    editor=document.createElement('section');editor.id='memoryEntry';editor.className='panel memory-entry';
    editor.innerHTML='<div class="memory-entry-head"><h2>留下一笔</h2><label>记录种类 <select id="memoryEntryKind" onchange="selectMemoryEntry(this.value)"><option value="fragment">今日碎片记录</option><option value="useful">今日有用感记录</option><option value="letter">写给未来的信</option></select></label></div><div data-memory-form="fragment"></div><div data-memory-form="useful" hidden></div><div data-memory-form="letter" hidden></div>';
  }
  pane.prepend(editor);
  [['#lifeBlendBox .lc-memory-input','fragment'],['#capsuleBox .cap-future','letter'],['#usefulLogBox .useful-compose','useful']].forEach(([selector,kind])=>{
    const form=document.querySelector(selector);if(form){
      const slot=editor.querySelector('[data-memory-form="'+kind+'"]');
      const drafts=Array.from(slot.querySelectorAll('input:not([type=file]),textarea,select')).filter(e=>e.id).map(e=>({id:e.id,value:e.value}));
      slot.replaceChildren(form);
      drafts.forEach(d=>{const field=Array.from(slot.querySelectorAll('[id]')).find(e=>e.id===d.id);if(field)field.value=d.value;});
    }
  });
  const useful=document.querySelector('#jpFragments .lc-useful');
  if(useful){useful.id='usefulArchive';pane.append(useful);useful.classList.add('clarity-fold-host');useful.querySelector('summary').textContent='今日有用感 · 查看记录';}
  clarityWrap(document.getElementById('jpFragments'),'今日碎片 · 查看记录','jpFragments');
  selectMemoryEntry(memoryEntryKind);
}
function petBirthdayImage(name){
  const normalized=String(name||'').trim().toLocaleLowerCase();
  const pet=(S.pets||[]).find(p=>String(p.name||'').trim().toLocaleLowerCase()===normalized);
  const custom=pet&&(pet.avatar||pet.image||pet.img);
  if(custom&&isValidDataUrl(custom))return custom;
  if(pet?.photo==='assets/pet-mudan.jpg')return pet.photo;
  return Array.from(document.querySelectorAll('#jpProfile .pet img')).find(img=>String(img.alt||'').trim().toLocaleLowerCase()===normalized)?.getAttribute('src')||'';
}
function setupRefinement(){
  setupMemoryEntry();
  const pets=document.querySelector('#jpProfile .pets');
  const mudan=(S.pets||[]).find(p=>p.id==='pet-mudan'||p.name==='牡丹');
  if(pets&&mudan&&!pets.querySelector('[data-pet="mudan"]')){
    const card=document.createElement('div');card.className='pet';card.dataset.pet='mudan';
    card.innerHTML='<img src="assets/pet-mudan.jpg" alt="牡丹"><div><div class="pet-name">牡丹</div><div class="pet-meta">母猫 · 英短 · 约 '+petAgeInfo(mudan).catYears+' 岁</div></div>';pets.append(card);
  }
  const energy=document.getElementById('page-energy'),growth=document.getElementById('page-growth');
  if(energy&&growth){
    let section=document.getElementById('growthSubjectivity');
    if(!section){section=document.createElement('section');section.id='growthSubjectivity';growth.querySelector('.lvl-bar')?.after(section);}
    section.innerHTML=subjectivityCard();
  }
  const ach=document.getElementById('achsUnlocked')?.closest('.panel');
  if(ach){ach.classList.add('compact-achievements');const title=ach.querySelector('h2');if(title)title.textContent='已解锁成就';}
  const tasks=document.querySelector('#st-action-pane .today-task-panel');if(tasks)document.getElementById('st-action-pane').append(tasks);
  document.getElementById('activeCommissions')?.remove();
}
const PRACTICAL_NPC_TASKS={
  lin:['练习 10 分钟羽毛球步法','练 20 次发球，记录落点是否稳定','看一段自己的打球录像，写下一个改进点'],
  shen:['收藏一个合适的岗位，写下匹配理由','修改简历中的一条项目经历','花 15 分钟准备一个面试问题'],
  yun:['做 10 分钟舒缓拉伸','到户外散步 15 分钟','睡前留出 15 分钟不看手机'],
  bailu:['弹琴 10 分钟，慢练一小段','阅读 10 页，记下一句有感触的话','完整唱一首喜欢的歌']
};
function ensurePracticalNpcTasks(){
  if(S.npc.active.some(q=>q.practical))return;
  NPCS.forEach(p=>{
    (PRACTICAL_NPC_TASKS[p.id]||[]).forEach(t=>S.npc.active.push({npc:p.id,id:id(),t,a:p.a,xp:30,done:false,practical:true}));
  });
  save();
}
