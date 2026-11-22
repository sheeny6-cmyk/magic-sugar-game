/* 꿈의 드레스룸 · 발레 매치3 프로토타입 (town/garden) */
(function(){
'use strict';

const $=(s,r=document)=>r.querySelector(s);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const KEY='sugar-dream-dressing-v1';

/* ================= 1. 상태 ================= */
const DEFAULT={stars:1,coins:0,step:0,floor:null,vanity:null,dress:null,cleared:{},sound:true,prologueSeen:false};

function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(!raw) return {...DEFAULT,cleared:{}};
    const p=JSON.parse(raw);
    return {...DEFAULT,...p,cleared:p.cleared||{}};
  }catch(e){ return {...DEFAULT,cleared:{}} }
}
let S=load();
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(S)) }catch(e){} }

/* ================= 2. 사운드 ================= */
let actx=null;
function ac(){
  if(!S.sound) return null;
  try{
    if(!actx) actx=new (window.AudioContext||window.webkitAudioContext)();
    if(actx.state==='suspended') actx.resume();
    return actx;
  }catch(e){ return null }
}
function tone(freq,dur=.18,type='sine',gain=.05,delay=0,slideTo=0){
  const c=ac(); if(!c) return;
  const t0=c.currentTime+delay;
  const o=c.createOscillator(), g=c.createGain();
  o.type=type; o.frequency.setValueAtTime(freq,t0);
  if(slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(60,slideTo),t0+dur);
  g.gain.setValueAtTime(.0001,t0);
  g.gain.exponentialRampToValueAtTime(gain,t0+.014);
  g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
  o.connect(g).connect(c.destination);
  o.start(t0); o.stop(t0+dur+.03);
}
const sfx={
  tap(){ tone(560,.07,'triangle',.04) },
  swap(){ tone(470,.09,'sine',.04); tone(660,.08,'sine',.03,.045) },
  bad(){ tone(320,.14,'sine',.035,0,240) },
  match(ci){ const b=523.25*Math.pow(1.09,Math.min(ci-1,6)); [0,4,7].forEach((s,i)=>tone(b*Math.pow(2,s/12),.22,'sine',.045,i*.05)) },
  special(){ [0,4,7,12,16].forEach((s,i)=>tone(659.25*Math.pow(2,s/12),.26,'triangle',.045,i*.055)) },
  repair(){ [0,5,9,12].forEach((s,i)=>tone(440*Math.pow(2,s/12),.55,'triangle',.05,i*.1)) },
  win(){ [0,4,7,12,16,19].forEach((s,i)=>tone(523.25*Math.pow(2,s/12),.6,'sine',.055,i*.11)) },
  lose(){ [0,-3,-7].forEach((s,i)=>tone(392*Math.pow(2,s/12),.4,'sine',.04,i*.12)) }
};

/* ================= 3. 수리 단계 정의 ================= */
const STEPS=[
  {key:'floor',tag:'바닥',icon:'🧹',title:'먼지 낀 바닥 쓸고 마루 깔기',sub:'바닥 스타일 3가지',
   ask:'바닥을 골라 주세요',desc:'쓸고 닦은 마루 위에 어떤 빛을 깔까요? 고르는 순간 분장실 바닥이 바뀌어요.',
   options:[
     {id:'oak',name:'따뜻한 오크 마루',desc:'햇살 머금은 호박빛 나무 마루. 포근한 분장실.',say:'바닥이 포근한 호박빛이 됐어요. 발끝이 따뜻해요!'},
     {id:'lilac',name:'로맨틱 라일락 마루',desc:'라일락 꽃잎을 닮은 연보라 마루. 왕국다운 로맨틱.',say:'라일락 마루라니… 여기서 돌면 꽃잎이 흩날릴 것 같아요!'},
     {id:'star',name:'별빛 화이트 마루',desc:'달빛을 닦은 듯한 흰 마루. 맨발로 서고 싶은 반짝임.',say:'발밑에 별이 반짝여요. 무대보다 더 설레요!'}
   ]},
  {key:'vanity',tag:'거울·조명',icon:'🪞',title:'금빛 전신 거울 & 조명 화장대 놓기',sub:'거울·조명 3가지',
   ask:'거울과 조명을 골라 주세요',desc:'먼지를 털어 낸 거울 앞에 화장대를 놓아요. 어떤 빛으로 얼굴을 비출까요?',
   options:[
     {id:'gold',name:'금빛 고전 거울',desc:'왕립 극장의 오래된 금빛 프레임. 고전적이고 우아해요.',say:'오래된 금빛이 살아났어요. 주인공이 된 기분이에요!'},
     {id:'crystal',name:'라일락 크리스털 거울',desc:'라일락 빛이 번지는 크리스털 조명. 꿈처럼 반짝여요.',say:'크리스털에 라일락 빛이 번져요. 눈부셔서 못 보겠어요!'},
     {id:'silver',name:'별빛 은빛 거울',desc:'별가루를 입힌 은빛 프레임과 달빛 조명.',say:'은빛 거울에 별이 내려앉았어요. 오늘은 유난히 예뻐 보여요.'}
   ]},
  {key:'dress',tag:'커튼·드레스',icon:'👗',title:'화려한 드레스 랙 & 커튼 채우기',sub:'커튼·샹들리에·드레스 3가지',
   ask:'커튼과 드레스를 골라 주세요',desc:'마지막이에요! 커튼과 드레스 테마를 고르면 슈가의 의상도 함께 변신해요.',
   options:[
     {id:'tutu',name:'라일락 벨벳 & 튜튜',desc:'보랏빛 벨벳 커튼에 라일락 튜튜. 왕국의 주인공.',say:'라일락 벨벳에 이 튜튜라니… 무대에 서도 손색없죠?'},
     {id:'swan',name:'아이보리 스완 드레스',desc:'상아빛 커튼과 백조의 무도회 드레스. 맑고 우아해요.',say:'백조처럼 가볍게. 이 드레스 입으면 왈츠가 떠올라요!'},
     {id:'noir',name:'별빛 누아르 드레스',desc:'자두빛 벨벳과 검은 튜튜. 밤의 발레리나.',say:'밤처럼 깊은 색… 별빛 아래 춤추는 기분이에요.'}
   ]}
];
const THEMES={
  none:{cur:'#b18ad4',curL:'#d8c1ea',curD:'#7a559f',d1:'#cdb2e0',d2:'#e9c7d8',d3:'#b9c7ea',chand:'#f6e7c4',light:'#ffe9b0'},
  tutu:{cur:'#b18ad4',curL:'#ddc8ee',curD:'#77539c',d1:'#d9bde9',d2:'#f2d5e3',d3:'#c4cdf0',chand:'#f6e7c4',light:'#ffe9b0'},
  swan:{cur:'#e6d8b8',curL:'#f8eeda',curD:'#bda574',d1:'#fdf7ea',d2:'#f0e3cc',d3:'#e2d2b4',chand:'#f8ecc9',light:'#fff3c9'},
  noir:{cur:'#4d3660',curL:'#7a5486',curD:'#2c1d36',d1:'#3b2b4a',d2:'#6b4767',d3:'#2a2438',chand:'#e6dcff',light:'#d9d2ff'}
};
const OUTFIT={tutu:'lilac',swan:'swan',noir:'black'};

/* ================= 4. 공통 UI ================= */
const scene=$('#scene'), bubble=$('#bubble'), bubbleText=$('#bubbleText');
let bubbleTimer=null;
function say(text){
  bubbleText.textContent=text;
  bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
  clearTimeout(bubbleTimer);
}
function toast(msg,ms=1900){
  const el=$('#toast');
  el.textContent=msg; el.classList.add('show');
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),ms);
}
function burst(n=16,cx=50,cy=40){
  const layer=$('#sparkLayer');
  if(!layer) return;
  for(let i=0;i<n;i++){
    const s=document.createElement('span');
    s.className='spark';
    const a=Math.random()*Math.PI*2, d=22+Math.random()*46;
    s.style.left=`calc(${cx}% + ${(Math.random()*8-4)}%)`;
    s.style.top=`calc(${cy}% + ${(Math.random()*8-4)}%)`;
    s.style.setProperty('--dx',Math.cos(a)*d+'px');
    s.style.setProperty('--dy',Math.sin(a)*d+'px');
    s.style.animationDelay=(Math.random()*.18).toFixed(2)+'s';
    layer.appendChild(s);
    setTimeout(()=>s.remove(),1300);
  }
}
function updatePurse(){
  $('#starCount').textContent=S.stars;
  $('#coinCount').textContent=S.coins;
  const b=$('#soundBtn');
  b.textContent=S.sound?'🔊':'🔇';
  b.classList.toggle('off',!S.sound);
  b.setAttribute('aria-label',S.sound?'소리 끄기':'소리 켜기');
}

/* ================= 5. 장면 ================= */
const sugarImg=$('#sugar');
let cheerTimer=null;
function sugarSrc(){
  if(S.step>=3 && S.dress) return `../assets/dancers/${OUTFIT[S.dress]||'lilac'}-curtsy.webp`;
  if(S.step===2) return '../assets/dancers/basic-releve.webp';
  if(S.step===1) return '../assets/dancers/basic-releve.webp';
  return '../assets/dancers/basic-ready.webp';
}
function renderSugar(cheer=false){
  const src=cheer
    ? (S.step>=3&&S.dress ? `../assets/dancers/${OUTFIT[S.dress]}-arabesque.webp` : '../assets/dancers/basic-arabesque.webp')
    : sugarSrc();
  if(sugarImg.getAttribute('src')===src) return;
  sugarImg.classList.add('swap');
  setTimeout(()=>{
    sugarImg.src=src;
    sugarImg.classList.remove('swap');
  },160);
}
function cheer(){
  const wrap=$('.sugar-wrap');
  wrap.classList.remove('cheer'); void wrap.offsetWidth; wrap.classList.add('cheer');
  clearTimeout(cheerTimer);
  renderSugar(true);
  cheerTimer=setTimeout(()=>{
    wrap.classList.remove('cheer');
    renderSugar(false);
  },2200);
}
function applyTheme(){
  const t=THEMES[S.dress]||THEMES.none;
  scene.style.setProperty('--cur',t.cur);
  scene.style.setProperty('--cur-l',t.curL);
  scene.style.setProperty('--cur-d',t.curD);
  scene.style.setProperty('--d1',t.d1);
  scene.style.setProperty('--d2',t.d2);
  scene.style.setProperty('--d3',t.d3);
  scene.style.setProperty('--chand-crystal',t.chand);
  scene.style.setProperty('--chand-light',t.light);
}
function renderScene(){
  scene.dataset.step=String(S.step);
  scene.dataset.floor=S.floor||'none';
  scene.dataset.vanity=S.vanity||'none';
  scene.dataset.dress=S.dress||'none';
  applyTheme();
  renderSugar(false);
  $('#finaleRibbon').hidden=S.step<3;
}

/* ================= 6. 수리 노트 ================= */
function optOf(stepKey,id){
  const st=STEPS.find(s=>s.key===stepKey);
  const o=st&&st.options.find(o=>o.id===id);
  return o?o.name:'';
}
function renderTasks(){
  const list=$('#taskList');
  list.innerHTML='';
  STEPS.forEach((st,i)=>{
    const done=S.step>i, cur=S.step===i;
    const state=done?'done':(cur?(S.stars>=1?'ready':'poor'):'locked');
    const li=document.createElement('li');
    const btn=document.createElement('button');
    btn.type='button'; btn.className='task'; btn.dataset.state=state;
    const cost=done?'✓ 완료':(cur?'⭐️1':'🔒');
    btn.innerHTML=`<span class="t-num">${i+1}</span>
      <span class="t-ico" aria-hidden="true">${st.icon}</span>
      <span class="t-copy"><b>${st.title}</b><small>${done?optOf(st.key,S[st.key]):st.sub}</small></span>
      <span class="t-cost">${cost}</span>`;
    btn.addEventListener('click',()=>onTask(i));
    li.appendChild(btn);
    list.appendChild(li);
  });
  $('#taskProgress').textContent=`${Math.min(S.step,3)} / 3`;
  renderStylebook();
  const next=nextStageNo();
  $('#ctaHint').textContent=S.step>=3?'보너스 별·코인':`스테이지 ${Math.min(S.step+1,3)}`;
}
function onTask(i){
  if(i<S.step){ toast('이미 완성한 단계예요 ✨️'); return; }
  if(i>S.step){ toast('앞 단계부터 차근차근 해요!'); return; }
  sfx.tap();
  if(S.stars<1){
    toast('별이 모자라요! 퍼즐에서 모아 올게요');
    setTimeout(()=>openPuzzle(),650);
    return;
  }
  openStyleModal(i);
}
function renderStylebook(){
  const ul=$('#sbList'); if(!ul) return;
  ul.innerHTML='';
  STEPS.forEach(st=>{
    const id=S[st.key];
    const li=document.createElement('li');
    li.innerHTML=`<span class="sw sb-sw ${id||'empty'}"></span><span><small>${st.tag}</small><b>${id?optOf(st.key,id):'아직'}</b></span>`;
    ul.appendChild(li);
  });
}
function nextStageNo(){
  for(let n=1;n<=3;n++){ if(!S.cleared[n]) return n; }
  return 3;
}

/* ================= 7. 스타일 선택 모달 ================= */
let modalStep=-1, picked=null;
function openStyleModal(i){
  modalStep=i; picked=null;
  const st=STEPS[i];
  $('#smKicker').textContent=`STEP ${i+1} · ${i+1} / 3`;
  $('#smTitle').textContent=st.ask;
  $('#smDesc').textContent=st.desc;
  const wrap=$('#smOptions');
  wrap.innerHTML='';
  st.options.forEach(o=>{
    const b=document.createElement('button');
    b.type='button'; b.className='opt'; b.setAttribute('role','radio'); b.setAttribute('aria-checked','false');
    b.dataset.id=o.id;
    b.innerHTML=`<span class="sw ${o.id}" aria-hidden="true"></span>
      <span class="o-copy"><b>${o.name}</b><span>${o.desc}</span></span>
      <span class="o-check" aria-hidden="true">✓</span>`;
    b.addEventListener('click',()=>{
      picked=o.id;
      [...wrap.children].forEach(c=>c.setAttribute('aria-checked',String(c===b)));
      $('#smApply').disabled=false;
      sfx.tap();
    });
    wrap.appendChild(b);
  });
  const apply=$('#smApply');
  apply.disabled=true;
  apply.textContent=`⭐️1 · 이 스타일로 꾸미기`;
  $('#styleModal').hidden=false;
}
function closeStyleModal(){ $('#styleModal').hidden=true; }
function applyStyle(){
  if(modalStep<0||!picked) return;
  if(S.stars<1){ closeStyleModal(); toast('별이 모자라요!'); return; }
  const st=STEPS[modalStep];
  const opt=st.options.find(o=>o.id===picked);
  S.stars-=1;
  S[st.key]=picked;
  S.step=Math.max(S.step,modalStep+1);
  save();
  closeStyleModal();
  updatePurse();
  renderScene();
  renderTasks();
  sfx.repair();
  cheer();
  burst(22,45,36);
  say(opt.say);
  if(S.step>=3){
    setTimeout(()=>{
      burst(34,50,30);
      sfx.win();
      say('완성! 이제 여기서 분장하고 무대에 올라가요. 꿈의 드레스룸에 온 걸 환영해요 🎀');
    },900);
  }
}

/* ================= 8. 퍼즐 ================= */
const N=6;
const TYPES=['shoe','ribbon','crown','lilac','star'];
const ICONS={shoe:'🩰',ribbon:'🎀',crown:'👑',lilac:'🪻',star:'⭐️'};
const NAMES={shoe:'토슈즈',ribbon:'리본',crown:'티아라',lilac:'라일락',star:'별빛'};
const STAGES=[
  {no:1,name:'첫 박자',moves:17,targets:[{type:'shoe',need:10}],coin:50},
  {no:2,name:'리본의 왈츠',moves:20,targets:[{type:'ribbon',need:10},{type:'lilac',need:8}],coin:70},
  {no:3,name:'별빛 피날레',moves:23,targets:[{type:'star',need:12},{type:'crown',need:8}],coin:100}
];

const boardEl=$('#board');
let grid=[], busy=false, sel=null, uid=0, movesLeft=0, curStage=null, targetsDone=false;

function idx(r,c){ return r*N+c }
function at(i){ return grid[(i/N)|0][i%N] }
function rndType(){ return TYPES[(Math.random()*TYPES.length)|0] }
function newTile(type,special=null){ return {id:++uid,type,special,el:null,r:0,c:0} }
function makeEl(t){
  const d=document.createElement('div');
  d.className='tile'; d.dataset.type=t.type;
  d.innerHTML='<div class="tchip"><span class="ico">'+ICONS[t.type]+'</span></div>';
  d.style.setProperty('--r',t.r); d.style.setProperty('--c',t.c);
  boardEl.appendChild(d);
  t.el=d;
  return d;
}
function paint(t){
  if(!t.el) makeEl(t);
  t.el.dataset.type=t.type;
  t.el.classList.toggle('line',t.special==='line');
  t.el.classList.toggle('rainbow',t.special==='rainbow');
}
function syncPos(t){ if(t.el){ t.el.style.setProperty('--r',t.r); t.el.style.setProperty('--c',t.c) } }

function buildBoard(){
  boardEl.innerHTML='';
  grid=[]; uid=0;
  for(let r=0;r<N;r++){
    grid[r]=[];
    for(let c=0;c<N;c++){
      let type, guard=0;
      do{ type=rndType(); guard++ } while(guard<60 && makesMatch(r,c,type));
      const t=newTile(type); t.r=r; t.c=c;
      grid[r][c]=t; makeEl(t);
    }
  }
  if(!hasMove()) buildBoard();
}
function makesMatch(r,c,type){
  const g=(rr,cc)=> (rr>=0&&cc>=0&&grid[rr]&&grid[rr][cc])?grid[rr][cc].type:null;
  if(g(r,c-1)===type&&g(r,c-2)===type) return true;
  if(g(r-1,c)===type&&g(r-2,c)===type) return true;
  return false;
}
function findRuns(){
  const runs=[];
  for(let r=0;r<N;r++){
    let c=0;
    while(c<N){
      const t=grid[r][c];
      if(!t){ c++; continue }
      let e=c+1;
      while(e<N && grid[r][e] && grid[r][e].type===t.type) e++;
      if(e-c>=3){ const cells=[]; for(let k=c;k<e;k++) cells.push([r,k]); runs.push({dir:'h',type:t.type,cells,len:e-c}) }
      c=e;
    }
  }
  for(let c=0;c<N;c++){
    let r=0;
    while(r<N){
      const t=grid[r][c];
      if(!t){ r++; continue }
      let e=r+1;
      while(e<N && grid[e][c] && grid[e][c].type===t.type) e++;
      if(e-r>=3){ const cells=[]; for(let k=r;k<e;k++) cells.push([k,c]); runs.push({dir:'v',type:t.type,cells,len:e-r}) }
      r=e;
    }
  }
  return runs;
}
function hasMove(){
  const swap=(a,b)=>{ const t=grid[a.r][a.c]; grid[a.r][a.c]=grid[b.r][b.c]; grid[b.r][b.c]=t };
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    if(c+1<N){
      swap({r,c},{r,c:c+1});
      const ok=findRuns().length>0;
      swap({r,c},{r,c:c+1});
      if(ok) return true;
    }
    if(r+1<N){
      swap({r,c},{r:r+1,c});
      const ok=findRuns().length>0;
      swap({r,c},{r:r+1,c});
      if(ok) return true;
    }
  }
  return false;
}
function mostCommon(){
  const cnt={}; TYPES.forEach(t=>cnt[t]=0);
  grid.forEach(row=>row.forEach(t=>{ if(t) cnt[t.type]++ }));
  return TYPES.slice().sort((a,b)=>cnt[b]-cnt[a])[0];
}

/* --- 목표 --- */
function renderGoals(){
  const card=$('#goalCard');
  card.innerHTML='';
  curStage.targets.forEach((tg,i)=>{
    const row=document.createElement('div');
    row.className='goal-row'; row.dataset.type=tg.type;
    row.innerHTML=`<span class="g-emoji">${ICONS[tg.type]}</span><span class="g-name">${NAMES[tg.type]} 모으기</span><span class="g-num">0 / ${tg.need}</span>`;
    const bar=document.createElement('div'); bar.className='goal-bar';
    bar.innerHTML='<i></i>';
    card.appendChild(row); card.appendChild(bar);
  });
}
function updateGoals(counts){
  let allDone=true;
  curStage.targets.forEach((tg,i)=>{
    if(counts[tg.type]) tg.got=Math.min(tg.need,(tg.got||0)+counts[tg.type]);
    const row=$(`.goal-row[data-type="${tg.type}"]`);
    if(row){
      row.querySelector('.g-num').textContent=`${tg.got||0} / ${tg.need}`;
      row.classList.toggle('done',(tg.got||0)>=tg.need);
      const bar=row.nextElementSibling;
      if(bar&&bar.classList.contains('goal-bar')) bar.firstElementChild.style.width=Math.min(100,((tg.got||0)/tg.need)*100)+'%';
    }
    if((tg.got||0)<tg.need) allDone=false;
  });
  targetsDone=allDone;
}
function updateMoves(){
  const el=$('#pzMoves');
  el.textContent=movesLeft;
  el.parentElement.classList.toggle('low',movesLeft<=3);
}

/* --- 이펙트 --- */
function cellCenter(t){
  const b=boardEl.getBoundingClientRect();
  const fx=$('#pzFx').getBoundingClientRect();
  return { x:(t.c+.5)*(b.width/N)+ (b.left-fx.left), y:(t.r+.5)*(b.height/N)+(b.top-fx.top) };
}
function sparkAt(t,type){
  const fx=$('#pzFx'); const p=cellCenter(t);
  for(let i=0;i<4;i++){
    const s=document.createElement('span');
    s.className='pop-spark';
    s.style.left=(p.x-6)+'px'; s.style.top=(p.y-6)+'px';
    const a=Math.random()*Math.PI*2,d=12+Math.random()*26;
    s.style.setProperty('--dx',Math.cos(a)*d+'px');
    s.style.setProperty('--dy',Math.sin(a)*d+'px');
    fx.appendChild(s);
    setTimeout(()=>s.remove(),700);
  }
}
function floatText(t,txt){
  const fx=$('#pzFx'); const p=cellCenter(t);
  const d=document.createElement('div');
  d.className='float-txt'; d.textContent=txt;
  d.style.left=p.x+'px'; d.style.top=p.y+'px';
  fx.appendChild(d); setTimeout(()=>d.remove(),850);
}
function comboText(txt){
  const fx=$('#pzFx');
  const d=document.createElement('div');
  d.className='combo-txt'; d.textContent=txt;
  fx.appendChild(d); setTimeout(()=>d.remove(),1050);
}

/* --- 교환/해소 --- */
function swapData(a,b){
  const t=grid[a.r][a.c];
  grid[a.r][a.c]=grid[b.r][b.c];
  grid[b.r][b.c]=t;
  const ta=grid[a.r][a.c], tb=grid[b.r][b.c];
  if(ta){ ta.r=a.r; ta.c=a.c }
  if(tb){ tb.r=b.r; tb.c=b.c }
}
function clearSel(){ if(sel){ const t=grid[sel.r][sel.c]; if(t&&t.el) t.el.classList.remove('sel') } sel=null }
function selectCell(cell){
  clearSel();
  sel=cell;
  const t=grid[cell.r][cell.c];
  if(t&&t.el) t.el.classList.add('sel');
  sfx.tap();
}

async function popCells(indices,ci){
  const counts={};
  const list=[];
  indices.forEach(i=>{
    const t=at(i);
    if(!t) return;
    counts[t.type]=(counts[t.type]||0)+1;
    list.push(t);
  });
  if(!list.length) return counts;
  const score=list.length*10*Math.max(1,ci);
  updateGoals(counts);
  list.forEach(t=>{ if(t.el) t.el.classList.add('pop'); sparkAt(t,'') });
  if(ci===1) sfx.match(ci); else sfx.match(ci);
  if(list.length>=8) sfx.special();
  const first=list[0];
  if(score) floatText(first,'+'+score);
  await sleep(230);
  list.forEach(t=>{
    if(t.el) t.el.remove();
    if(grid[t.r]&&grid[t.r][t.c]===t) grid[t.r][t.c]=null;
  });
  return counts;
}

function expandSpecials(base){
  const seen=new Set(base);
  const extra=new Set();
  const queue=[...base];
  while(queue.length){
    const i=queue.pop(); const t=at(i);
    if(!t||!t.special) continue;
    const r=(i/N)|0,c=i%N;
    const add=cells=>cells.forEach(([rr,cc])=>{
      const j=rr*N+cc;
      if(!at(j)) return;
      if(!seen.has(j)){ seen.add(j); extra.add(j); queue.push(j) }
    });
    if(t.special==='line'){
      const cells=[];
      for(let cc=0;cc<N;cc++) cells.push([r,cc]);
      for(let rr=0;rr<N;rr++) cells.push([rr,c]);
      add(cells);
    }else if(t.special==='rainbow'){
      const tg=mostCommon();
      const cells=[];
      for(let rr=0;rr<N;rr++)for(let cc=0;cc<N;cc++) if(grid[rr][cc]&&grid[rr][cc].type===tg) cells.push([rr,cc]);
      add(cells);
    }
  }
  return {extra,seen};
}

async function resolveRuns(runs,origin,ci){
  const base=new Set();
  const creations=[];
  runs.forEach(run=>{
    run.cells.forEach(([r,c])=>base.add(r*N+c));
    if(run.len>=4){
      let pivot=run.cells[Math.floor(run.cells.length/2)];
      if(origin){
        const hit=run.cells.find(([r,c])=>
          (r===origin.a.r&&c===origin.a.c)||(r===origin.b.r&&c===origin.b.c));
        if(hit) pivot=hit;
      }
      creations.push({i:pivot[0]*N+pivot[1],type:run.type,special:run.len>=5?'rainbow':'line'});
    }
  });
  const {extra}=expandSpecials(base);
  extra.forEach(i=>base.add(i));
  const counts=await popCells(base,ci);
  creations.forEach(cr=>{
    const r=(cr.i/N)|0,c=cr.i%N;
    const t=newTile(cr.type,cr.special); t.r=r; t.c=c;
    grid[r][c]=t;
    makeEl(t); paint(t);
    t.el.classList.add('dropin');
    if(cr.special==='rainbow') comboText('🌈 튜튜 폭탄!');
    else comboText('✨️ 줄 클리어!');
  });
  if(creations.length) sfx.special();
  return counts;
}

async function collapseAndRefill(){
  const spawned=[];
  for(let c=0;c<N;c++){
    let write=N-1;
    for(let r=N-1;r>=0;r--){
      const t=grid[r][c];
      if(!t) continue;
      if(write!==r){
        grid[write][c]=t; grid[r][c]=null;
        t.r=write; t.c=c; syncPos(t);
      }
      write--;
    }
    let above=-1;
    for(let r=write;r>=0;r--){
      const t=newTile(rndType()); t.r=r; t.c=c;
      grid[r][c]=t;
      makeEl(t);
      t.el.style.setProperty('--r',above--);
      spawned.push(t);
    }
  }
  if(spawned.length){
    void boardEl.offsetHeight;
    spawned.forEach(t=>{ t.el.style.setProperty('--r',t.r) });
  }
  await sleep(spawned.length?300:220);
}

async function resolve(origin){
  let ci=0;
  while(true){
    const runs=findRuns();
    if(!runs.length) break;
    ci++;
    if(ci>1) comboText(`콤보 ×${ci}`);
    await resolveRuns(runs,origin,ci);
    await collapseAndRefill();
    origin=null;
  }
  return ci;
}

async function activateRainbow(a,b){
  const t1=grid[a.r][a.c], t2=grid[b.r][b.c];
  const rainbowTile=(t1&&t1.special==='rainbow')?t1:t2;
  const other=(rainbowTile===t1)?t2:t1;
  const target=(other&&other.special==='rainbow')?mostCommon():(other?other.type:mostCommon());
  const base=new Set();
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const t=grid[r][c];
    if(t&&(t.type===target||t===rainbowTile)) base.add(r*N+c);
  }
  movesLeft--; updateMoves();
  comboText('🌈 무지개 튜튜!');
  sfx.special();
  const {extra}=expandSpecials(base);
  extra.forEach(i=>base.add(i));
  await popCells(base,1);
  await collapseAndRefill();
  await resolve(null);
}

async function attemptSwap(a,b){
  if(busy) return;
  const t1=grid[a.r][a.c], t2=grid[b.r][b.c];
  if(!t1||!t2) return;
  busy=true;
  boardEl.dataset.busy='true';
  try{
    if(t1.special==='rainbow'||t2.special==='rainbow'){
      await activateRainbow(a,b);
    }else{
      swapData(a,b); syncPos(t1); syncPos(t2); sfx.swap();
      await sleep(210);
      if(!findRuns().length){
        swapData(a,b); syncPos(t1); syncPos(t2); sfx.bad();
        t1.el.classList.add('bump'); t2.el.classList.add('bump');
        setTimeout(()=>{ t1.el&&t1.el.classList.remove('bump'); t2.el&&t2.el.classList.remove('bump') },320);
        await sleep(210);
        busy=false; return;
      }
      movesLeft--; updateMoves();
      await resolve({a,b});
    }
    if(!hasMove()){ await sleep(200); shuffleBoard(); }
  }finally{
    busy=false;
    boardEl.dataset.busy='false';
  }
  checkEnd();
}

function shuffleBoard(){
  const pool=[];
  grid.forEach(row=>row.forEach(t=>{ if(t) pool.push(t) }));
  let guard=0;
  do{
    const types=pool.map(()=>rndType());
    // assign avoiding immediate matches
    pool.forEach((t,i)=>{ t.type=types[i] });
    guard++;
  }while(guard<30 && (findRuns().length>0 || !hasMove()));
  pool.forEach(t=>{ paint(t); if(t.el){ t.el.classList.add('bump'); setTimeout(()=>t.el&&t.el.classList.remove('bump'),330) } });
  toast('움직일 수 있는 타일이 없어 판을 섞었어요');
}

/* --- 입력 --- */
let down=null, dragged=false;
function cellAt(ev){
  const b=boardEl.getBoundingClientRect();
  const x=ev.clientX-b.left, y=ev.clientY-b.top;
  if(x<0||y<0||x>=b.width||y>=b.height) return null;
  return {r:Math.max(0,Math.min(N-1,Math.floor(y/(b.height/N)))),c:Math.max(0,Math.min(N-1,Math.floor(x/(b.width/N))))};
}
const adjacent=(a,b)=>Math.abs(a.r-b.r)+Math.abs(a.c-b.c)===1;
boardEl.addEventListener('pointerdown',ev=>{
  if(busy) return;
  const cell=cellAt(ev); if(!cell) return;
  down={cell,x:ev.clientX,y:ev.clientY,swapped:false};
  dragged=false;
  try{ boardEl.setPointerCapture(ev.pointerId) }catch(e){}
});
boardEl.addEventListener('pointermove',ev=>{
  if(!down||busy||down.swapped) return;
  const dx=ev.clientX-down.x, dy=ev.clientY-down.y;
  const unit=boardEl.getBoundingClientRect().width/N;
  if(Math.hypot(dx,dy)<unit*.38) return;
  const tgt=cellAt(ev);
  if(!tgt||!adjacent(down.cell,tgt)) return;
  down.swapped=true; dragged=true;
  const from=down.cell;
  down=null; clearSel();
  attemptSwap(from,tgt);
});
boardEl.addEventListener('pointerup',ev=>{
  if(!down||busy){ down=null; return }
  const cell=down.cell; down=null;
  if(dragged){ dragged=false; return }
  if(sel){
    if(sel.r===cell.r&&sel.c===cell.c){ clearSel(); return }
    if(adjacent(sel,cell)){ const from=sel; clearSel(); attemptSwap(from,cell); return }
  }
  selectCell(cell);
});
boardEl.addEventListener('pointercancel',()=>{ down=null });

/* --- 진행 --- */
function startStage(no){
  curStage=STAGES.find(s=>s.no===no)||STAGES[0];
  curStage.targets.forEach(t=>{ t.got=0 });
  targetsDone=false; movesLeft=curStage.moves;
  sel=null; busy=false; down=null;
  $('#pzKicker').textContent=`STAGE ${curStage.no}`;
  $('#pzName').textContent=curStage.name;
  $('#pzMoves').parentElement.classList.remove('low');
  $('#pzReward').innerHTML=`<span>⭐️ +1</span><span>🪙 +${curStage.coin}</span><em>클리어 보상</em>`;
  updateMoves();
  renderGoals();
  buildBoard();
  $('#pzHelp').textContent='타일을 톡톡 눌러 바꾸거나, 옆으로 살짝 밀어 보세요.';
  boardEl.dataset.busy='false';
}
function checkEnd(){
  if(!curStage) return;
  if(targetsDone){ finishWin(); return }
  if(movesLeft<=0){ finishLose() }
}
function finishWin(){
  busy=true;
  const reward=curStage.coin;
  S.stars+=1; S.coins+=reward;
  S.cleared[curStage.no]=(S.cleared[curStage.no]||0)+1;
  save(); updatePurse();
  sfx.win();
  showResult({
    badge:'🌸', title:'스테이지 클리어!',
    text:`${curStage.name} 완료! 별을 하나 받았어요.`,
    rewards:[`⭐️ +1`,`🪙 +${reward}`],
    primary:'분장실로 돌아가기', secondary:'한 번 더 도전'
  });
}
function finishLose(){
  busy=true;
  sfx.lose();
  const left=curStage.targets.map(t=>`${NAMES[t.type]} ${(t.got||0)}/${t.need}`).join(' · ');
  showResult({
    badge:'🕯️', title:'조금만 더!',
    text:`수를 다 썼어요. (${left}) 다시 도전해 볼까요?`,
    rewards:[], primary:'다시 도전', secondary:'분장실로 돌아가기', retry:true
  });
}
let resultMode='win';
function showResult(o){
  resultMode=o.retry?'lose':'win';
  $('#rsBadge').textContent=o.badge;
  $('#rsTitle').textContent=o.title;
  $('#rsText').textContent=o.text;
  const rw=$('#rsRewards');
  rw.innerHTML=(o.rewards||[]).map(r=>`<span>${r}</span>`).join('');
  rw.hidden=!(o.rewards&&o.rewards.length);
  $('#rsPrimary').textContent=o.primary;
  $('#rsSecondary').textContent=o.secondary;
  $('#rsSecondary').hidden=!o.secondary;
  $('#resultModal').hidden=false;
}

/* ================= 9. 화면 이동 ================= */
function openPuzzle(){
  const no=nextStageNo();
  $('#studioScreen').hidden=true;
  $('#puzzleScreen').hidden=false;
  startStage(no);
}
let returnMessage=null;
function backToStudio(){
  $('#resultModal').hidden=true;
  $('#puzzleScreen').hidden=true;
  $('#studioScreen').hidden=false;
  busy=true;
  renderTasks(); updatePurse();
  if(returnMessage){ say(returnMessage); returnMessage=null }
}
function afterWin(){
  const msg = S.step>=3
    ? '또 반짝이는 별이 생겼어요! 코인도 차곡차곡 모여요.'
    : S.stars>=1
      ? (S.step===0?'별이 생겼어요! 이제 바닥을 깔 수 있어요.'
        :S.step===1?'별이 생겼어요! 이제 거울과 화장대를 놓아 봐요.'
        :'별이 생겼어요! 이제 커튼과 드레스 랙을 채워요.')
      : '별이 생겼어요!';
  returnMessage=msg;
  backToStudio();
}

/* ================= 10. 프롤로그 컷신 ================= */
const PL=Array.from({length:9},(_,i)=>`assets/story/${String(i+1).padStart(2,'0')}.webp`);
let plIndex=0, plDownX=null;
function openPrologue(){
  plIndex=0; renderCut();
  $('#prologue').hidden=false;
}
function renderCut(){
  const img=$('#plImg');
  img.style.animation='none'; void img.offsetWidth; img.style.animation='';
  img.src=PL[plIndex];
  $('#plBg').style.backgroundImage=`url("${PL[plIndex]}")`;
  $('#plCount').textContent=`${plIndex+1} / ${PL.length}`;
  $('#plBar').style.width=((plIndex+1)/PL.length*100)+'%';
  const last=plIndex===PL.length-1;
  $('#plCta').hidden=!last;
  $('#plAgain').hidden=!last;
  $('#plHint').hidden=last;
  if(plIndex+1<PL.length){ const n=new Image(); n.src=PL[plIndex+1] }
}
function plGo(d){
  const n=plIndex+d;
  if(n<0||n>=PL.length) return;
  plIndex=n; sfx.swap(); renderCut();
}
function closePrologue(){
  $('#prologue').hidden=true;
  S.prologueSeen=true; save();
  say('휴... 하마터면 진짜 탈락할 뻰했어요! 평생 FREE PASS를 따려면 먼저 이 낡은 드레스룸부터 고치고 퍼즐로 실력을 되찾아요!');
  burst(18,45,38);
}

/* ================= 11. 이벤트 / 부팅 ================= */
function bind(){
  $('#soundBtn').addEventListener('click',()=>{
    S.sound=!S.sound; save(); updatePurse();
    if(S.sound) sfx.tap();
    toast(S.sound?'소리를 켰어요 🔊':'소리를 껐어요 🔇',1200);
  });
  $('#puzzleCta').addEventListener('click',()=>{ sfx.tap(); openPuzzle() });
  $('#pzBack').addEventListener('click',()=>{ sfx.tap(); backToStudio() });
  $('#smCancel').addEventListener('click',()=>{ sfx.tap(); closeStyleModal() });
  $('#smApply').addEventListener('click',applyStyle);
  $('#styleModal').addEventListener('click',e=>{ if(e.target.id==='styleModal') closeStyleModal() });
  $('#rsPrimary').addEventListener('click',()=>{
    if(resultMode==='lose'){ $('#resultModal').hidden=true; startStage(curStage.no) }
    else afterWin();
  });
  $('#rsSecondary').addEventListener('click',()=>{
    if(resultMode==='lose'){ afterWin() }
    else { $('#resultModal').hidden=true; startStage(curStage.no) }
  });
  $('#resetBtn').addEventListener('click',()=>{
    if(!confirm('꾸민 드레스룸과 별을 처음 상태로 되돌릴까요?')) return;
    S={...DEFAULT,cleared:{},prologueSeen:true};
    save(); applyAll(); toast('처음부터 다시 시작해요'); say('여긴 왕립 극장의 오래된 분장실이에요. 같이 반짝이는 드레스룸으로 바꿔 봐요!');
  });
  $('#prologueBtn').addEventListener('click',()=>{ sfx.tap(); openPrologue() });
  $('#plSkip').addEventListener('click',e=>{ e.stopPropagation(); sfx.tap(); closePrologue() });
  $('#plCta').addEventListener('click',e=>{ e.stopPropagation(); sfx.repair(); closePrologue() });
  $('#plAgain').addEventListener('click',e=>{ e.stopPropagation(); plIndex=0; sfx.tap(); renderCut() });
  const stage=$('#plStage');
  stage.addEventListener('click',e=>{
    if(e.target.closest('button')) return;
    if(plIndex<PL.length-1) plGo(1);
  });
  stage.addEventListener('pointerdown',e=>{ plDownX=e.clientX });
  stage.addEventListener('pointerup',e=>{
    if(plDownX===null) return;
    const dx=e.clientX-plDownX; plDownX=null;
    if(Math.abs(dx)<45) return;
    if(e.target.closest('button')) return;
    plGo(dx<0?1:-1);
  });
  document.addEventListener('keydown',e=>{
    if($('#prologue').hidden) return;
    if(e.key==='ArrowRight') plGo(1);
    if(e.key==='ArrowLeft') plGo(-1);
    if(e.key==='Escape') closePrologue();
  });
  window.addEventListener('resize',()=>{ if(!$('#puzzleScreen').hidden){ grid.flat().forEach(t=>{ if(t&&t.el) { t.el.style.setProperty('--r',t.r); t.el.style.setProperty('--c',t.c) } }) } });
}
function openingLine(){
  if(S.step>=3) return '꿈의 드레스룸 완성! 오늘은 어떤 드레스로 무대에 올라갈까요?';
  if(S.step===2) return '거울이 반짝여요! 이제 커튼과 드레스 랙만 채우면 완성이에요.';
  if(S.step===1) return '바닥이 살아났어요! 이제 거울과 화장대를 놓아 봐요.';
  return '여긴 왕립 극장의 오래된 분장실이에요. 같이 반짝이는 드레스룸으로 바꿔 봐요!';
}
function applyAll(){
  renderScene(); renderTasks(); updatePurse();
  say(openingLine());
}
function boot(){
  bind();
  applyAll();
  if(!S.prologueSeen) openPrologue();
}
boot();
})();
