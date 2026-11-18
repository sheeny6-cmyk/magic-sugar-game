/* =============================================================
   취발러의 엔딩은 죽음뿐 — BALLET KINGDOM
   ============================================================= */
(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------------- data ---------------- */
const POSES = [
  { id: 'arabesque', name: '아라베스크', en: 'Arabesque', img: 'assets/sugar_arabesque.webp', big: 'assets/sugar_arabesque@2x.webp' },
  { id: 'attitude',  name: '아티튜드',   en: 'Attitude',  img: 'assets/sugar_attitude.webp',  big: 'assets/sugar_attitude@2x.webp' },
  { id: 'releve',    name: '를레베',     en: 'Relevé',    img: 'assets/sugar_releve.webp',    big: 'assets/sugar_releve@2x.webp' },
  { id: 'curtsy',    name: '커티시',     en: 'Curtsy',    img: 'assets/sugar_curtsy.webp',    big: 'assets/sugar_curtsy@2x.webp' }
];
const IDLE_BIG = 'assets/sugar_front@2x.webp';

const STAT_LABEL = { flex: '유연성', knowledge: '발레 지식', stamina: '체력', strength: '근력', direction: '방향감각' };

const SHOP = [
  { id: 'latte', ico: '🥛', name: '턴아웃 라떼', price: 500, tag: '오답 1회 자동 보정',
    desc: '센터 미션에서 오답 1회를 자동으로 고쳐 줘요. 입력 제한 +0.45초. 미션 중 상단에 턴아웃 버프 배지가 떠요.' },
  { id: 'ribs', ico: '🍵', name: '갈비뼈 닫히는 라떼', price: 600, tag: '즉사 1회 방어',
    desc: '작품반 오디션에서 죽음 1회를 막아 줘요(실드). 동작 표시 +0.13초, 입력 +0.25초. 상단에 상체 정렬 버프 배지.' },
  { id: 'poca', ico: '🧃', name: '포카리 포션', price: 300, tag: 'HP +30 · 수분 충전',
    desc: '지금 바로 HP 30 회복. 다음 미션을 시작할 때 물이 차오르는 “수분 충전” 연출과 함께 HP +10.' },
  { id: 'smoothie', ico: '🥤', name: '근력 스무디', price: 500, tag: '골드 2배',
    desc: '근력 +10. 다음 워터파크 훈련에서 골드 2배 + 판정 존 확대. 상단에 근력 버프 배지.' }
];

/* 발레 분식집 (체력·스탯 분식) */
const SNACK = [
  { id: 'sundae', ico: '🥟', name: '체력 만배 순대', price: 400, tag: 'HP 완전 회복 · 체력 +5',
    desc: '한 줄이면 센터 한 바퀴. HP를 가득 채우고 체력 스탯이 영구히 +5 올라요.' },
  { id: 'tteok', ico: '🍲', name: '유연성 떡볶이', price: 450, tag: '유연성 +10 · 표시 +0.5초',
    desc: '매콤한데 다리가 풀려요. 유연성 +10, 다음 미션 동작 표시 시간 +0.5초.' },
  { id: 'eomuk', ico: '🍢', name: '집중력 어묵 꼬치', price: 350, tag: '발레 지식 +8 · 오답 힌트',
    desc: '국물까지 마시면 머리가 맑아져요. 발레 지식 +8, 다음 미션 오답 1회는 힌트로.' },
  { id: 'twigim', ico: '🍤', name: '방향감각 모둠튀김', price: 400, tag: '방향감각 +5',
    desc: '튀김 기름 덕인지 몸이 어디로 가는지 알겠어요. 방향감각 +5.' }
];

const SNACK_SAY = {
  sundae: '순대는 체력이야. 한 줄 먹고 센터 들어가면 다리가 안 떨려. 진짜야.',
  tteok: '떡볶이는 유연성. 매운데 다리가 풀리는 기분, 알지? 다음 미션은 동작이 더 오래 보여.',
  eomuk: '어묵 국물은 집중력. 하나 물고 들어가면 틀려도 한 번은 정답을 알려 줄게.',
  twigim: '모둠튀김은 방향감각! 어디서 도는지 몰랐던 네가 달라질 거야.',
  poor: '골드가 모자라? 워터파크에서 물장구 치고 다시 와. 국물은 남겨 둘게.'
};

function renderSnack() {
  const list = $('#snackList');
  if (!list) return;
  let rec;
  if (S.hp < maxHp() * 0.7) rec = 'sundae';
  else if (S.stats.flex < 40) rec = 'tteok';
  else if (S.bossUnlocked && !S.cleared) rec = 'eomuk';
  else rec = 'twigim';
  const recItem = SNACK.find(i => i.id === rec);
  const next = $('#snackNext');
  if (next) next.innerHTML = `<span>에튜 추천</span><b>${recItem.ico} ${recItem.name}</b><i>${recItem.tag}</i>`;
  list.innerHTML = '';
  SNACK.forEach(it => {
    const el = document.createElement('div');
    el.className = 'item' + (it.id === rec ? ' rec' : '');
    el.innerHTML = `
      <div class="item-ico">${it.ico}</div>
      <div class="item-body">
        ${it.id === rec ? '<i class="rec-tag">추천</i>' : ''}
        <b>${it.name} <span style="color:#ffd88a;font-size:10px">${it.tag}</span></b>
        <small>${it.desc}</small>
      </div>
      <button class="item-buy" ${S.gold < it.price ? 'disabled' : ''}>${it.price}G</button>`;
    el.querySelector('.item-buy').onclick = () => buySnack(it, el);
    list.appendChild(el);
  });
  const say = $('#snackSay');
  if (say) say.textContent = S.hp < maxHp() * 0.7
    ? '얼굴이 파래. 순대부터 한 줄 먹고 가.'
    : '먹고 추면 된다. 오늘은 뭐로 채울래?';
  renderHud();
}

function buySnack(it, el) {
  if (S.gold < it.price) { toast('골드가 부족해요', true); return; }
  S.gold -= it.price;
  if (it.id === 'sundae') { S.stats.stamina += 5; S.hp = maxHp(); }
  if (it.id === 'tteok') { S.stats.flex += 10; S.buffs.stretch = true; }
  if (it.id === 'eomuk') { S.stats.knowledge += 8; S.buffs.hint = true; }
  if (it.id === 'twigim') { S.stats.direction += 5; }
  sfx('gold');
  save(); renderSnack(); renderMapTags();
  $('#snackSay').textContent = SNACK_SAY[it.id] || '';
  toast(`${it.name} 완료 · ${it.tag}`);
  el.animate([{ transform: 'scale(.98)' }, { transform: 'none' }], { duration: 260 });
}

const DEATH_REASONS = {
  stage: [
    '센터에서 발을 헛디뎠습니다',
    '음악을 놓치고 혼자 8카운트를 세고 있었습니다',
    '턴아웃을 열다가 무릎이 먼저 포기했습니다',
    '뒤에 있던 사람과 정면으로 부딪혔습니다',
    '선생님과 눈이 마주쳤습니다',
    '바닥에 떨어진 머리핀을 밟았습니다',
    '아라베스크에서 방향을 잃고 관객석으로 걸어갔습니다'
  ],
  timing: [
    '박자를 놓쳤습니다',
    '음악이 이미 다음 소절로 넘어갔습니다',
    '손은 기억하는데 발이 거부했습니다'
  ],
  boss: [
    '오디션에서 실수 1회 — 심사위원이 조용히 고개를 저었습니다',
    '작품반 앞에서 턴아웃이 무너졌습니다',
    '심사위원석에서 한숨이 들렸습니다'
  ]
};

/* ---------------- persistence ---------------- */
const KEY = 'ballet-kingdom-v2';
const DEFAULT = {
  lv: 0, hp: 100, gold: 800,
  stats: { flex: 15, knowledge: 10, stamina: 20, strength: 10, direction: 3 },
  buffs: { turnout: false, align: false, poca: false, power: false, stretch: false, hint: false },
  poolSessions: 0,
  round: 0, stageClear: false, bossUnlocked: false, cleared: false,
  deaths: 0, attempts: 0
};
let S = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const d = JSON.parse(raw);
    const merged = Object.assign(structuredClone(DEFAULT), d, { stats: Object.assign({}, DEFAULT.stats, d.stats || {}) });
    merged.buffs = Object.assign({ turnout: false, align: false, poca: false, power: false, stretch: false, hint: false }, d.buffs || {});
    return merged;
  } catch (e) { return structuredClone(DEFAULT); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ---------------- 년차(레벨) ---------------- */
const yearTxt = v => (v <= 0 ? '0년차' : v + '년차');
const ticketNo = () => 'NO. ' + String(S.lv).padStart(2, '0') + '-0001';

/* ---------------- derived ---------------- */
const maxHp     = () => 60 + S.stats.stamina * 2;
const showMs    = () => (0.52 + S.stats.knowledge * 0.004 + (S.buffs.align ? 0.13 : 0) + (S.buffs.stretch ? 0.5 : 0)) * 1000;
const windowMs  = () => (1.45 + S.stats.direction * 0.05 + (S.buffs.turnout ? 0.45 : 0) + (S.buffs.align ? 0.25 : 0)) * 1000;
const goldMult  = () => 1 + S.stats.strength * 0.01;

/* ---------------- audio ---------------- */
let AC = null, gestureOk = false;
addEventListener('pointerdown', () => {
  gestureOk = true;
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  else if (AC.state === 'suspended') { AC.resume().catch(() => {}); }
}, { passive: true });
function sfx(kind) {
  if (!gestureOk) return;
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume().catch(() => {});
    const t = AC.currentTime;
    const o = AC.createOscillator(), g = AC.createGain();
    o.connect(g); g.connect(AC.destination);
    const map = {
      tick: [880, 'sine', .05, .05], ok: [1180, 'triangle', .05, .12],
      err: [140, 'sawtooth', .05, .22], gold: [1560, 'sine', .04, .14],
      dead: [90, 'sawtooth', .06, .5], lvl: [1320, 'sine', .05, .3]
    };
    const [f, type, vol, dur] = map[kind] || map.tick;
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (kind === 'err') o.frequency.exponentialRampToValueAtTime(60, t + dur);
    if (kind === 'lvl') o.frequency.exponentialRampToValueAtTime(1980, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.start(t); o.stop(t + dur + .02);
  } catch (e) {}
}

/* ---------------- ui helpers ---------------- */
let toastT = 0;
function toast(msg, bad) {
  const el = $('#toast');
  el.textContent = msg; el.hidden = false;
  el.classList.toggle('bad', !!bad);
  clearTimeout(toastT);
  toastT = setTimeout(() => el.hidden = true, 2100);
}

function dialog({ name, role, face, text, buttons }) {
  const d = $('#dialog');
  $('#dlgName').textContent = name || 'SYSTEM';
  $('#dlgRole').textContent = role || 'ballet kingdom';
  const f = $('#dlgFace');
  if (face) { f.src = face; f.style.display = ''; } else f.style.display = 'none';
  $('#dlgText').innerHTML = text;
  const bx = $('#dlgBtns'); bx.innerHTML = '';
  (buttons || [{ label: '확인' }]).forEach(b => {
    const el = document.createElement('button');
    el.className = 'btn ' + (b.ghost ? 'ghost' : 'primary');
    el.textContent = b.label;
    el.onclick = () => { d.hidden = true; b.onClick && b.onClick(); };
    bx.appendChild(el);
  });
  d.hidden = false;
}

function flashGold() {
  const el = $('#hudGold');
  if (!el || !el.animate) return;
  el.animate([{ color: '#fffbe0', transform: 'scale(1.2)' }, { color: '#ffd88a', transform: 'scale(1)' }],
    { duration: 650, easing: 'ease-out' });
}

function levelUpFx(to) {
  const el = $('#levelup');
  $('#levelupTo').textContent = 'Lv.' + to;
  const y = $('#levelupYear');
  if (y) y.textContent = yearTxt(to) + ' · 성장!'; 
  el.hidden = false;
  sfx('lvl');
  setTimeout(() => { el.hidden = true; }, 1500);
}

/* 스탯 성장 + 레벨업을 한 번에 */
function grow(up, lvUp, note) {
  const add = [];
  Object.keys(up || {}).forEach(k => {
    if (S.stats[k] == null) return;
    S.stats[k] += up[k];
    add.push(`${STAT_LABEL[k]} +${up[k]}`);
  });
  if (lvUp) {
    S.lv += lvUp;
    S.hp = maxHp();
    levelUpFx(S.lv);
    add.push(`Lv.${S.lv} (${yearTxt(S.lv)})`);
  }
  save(); renderHud();
  if (add.length) toast((note ? note + ' · ' : '성장 · ') + add.join(' · '));
}

/* 물약·버프 배지 ------------------------------------------------ */
const BUFF_TXT = {
  turnout: { ico: '🥛', title: '턴아웃 버프 발동 중', sub: '오답 1회 자동 보정' },
  align:   { ico: '🍵', title: '상체 정렬 버프 발동 중', sub: '즉사 1회 방어(실드)' },
  poca:    { ico: '🧃', title: '수분 충전 완료', sub: 'HP 회복' },
  power:   { ico: '🥤', title: '근력 버프 발동 중', sub: '골드 2배 · 판정 존 확대' },
  stretch: { ico: '🍲', title: '유연성 떡볶이 발동 중', sub: '동작 표시 +0.5초' },
  hint:    { ico: '🍢', title: '집중력 어묵 발동 중', sub: '오답 1회 힌트' }
};
function renderBuffs(el, list) {
  if (!el) return;
  if (!list.length) { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  el.innerHTML = list.map(([k, used]) => {
    const b = BUFF_TXT[k];
    return `<span class="buff-chip${used ? ' used' : ''}"><i>${b.ico}</i><b>${b.title}</b><small>${used ? '사용 완료' : b.sub}</small></span>`;
  }).join('');
}
function missionBuffList() {
  const m = M; if (!m) return [];
  const out = [];
  if (m.buffs.turnout) out.push(['turnout', !m.guard.turnout]);
  if (m.buffs.align) out.push(['align', !m.guard.align]);
  if (m.buffs.stretch) out.push(['stretch', false]);
  if (m.buffs.hint) out.push(['hint', !m.guard.hint]);
  if (m.buffs.poca) out.push(['poca', false]);
  return out;
}
function refreshMissionBuffs() {
  if (!M) return;
  renderBuffs($(M.cfg.boss ? '#auditionBuff' : '#stageBuff'), missionBuffList());
}
function splash(text) {
  const el = $('#splash');
  if (!el) return;
  $('#splashText').textContent = text;
  el.hidden = false;
  el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  clearTimeout(splash._t);
  splash._t = setTimeout(() => { el.hidden = true; }, 1300);
}

function renderHud() {
  const mh = maxHp();
  $('#hudLv').textContent = S.lv;
  const hy = $('#hudYear');
  if (hy) hy.textContent = yearTxt(S.lv);
  $('#hudGold').textContent = S.gold.toLocaleString();
  const pct = clamp(S.hp / mh * 100, 0, 100);
  $('#hpFill').style.width = pct + '%';
  $('#hpText').textContent = Math.round(S.hp) + ' / ' + mh;
  $('.hpbar').classList.toggle('low', pct <= 30);
}

function renderMapTags() {
  $('#tagStage').textContent = S.stageClear ? 'CLEAR' : `ROUND ${clamp(S.round + 1, 1, 3)}`;
  $('#tagBoss').textContent = S.cleared ? 'CLEAR' : (S.bossUnlocked ? '도전 가능' : '잠김');
  $('#tagBoss').classList.toggle('lock', !S.bossUnlocked && !S.cleared);
  $('.area.boss').classList.toggle('locked', !S.bossUnlocked && !S.cleared);
  $('#tagPool').textContent = S.poolSessions >= 3 ? '훈련 완료' : '골드 파밍';
  const ts = $('#tagSnack');
  if (ts) ts.textContent = S.hp < maxHp() * 0.7 ? 'HP 보충' : '스탯 보충';

  const mt = $('#mapTitle');
  if (mt) mt.innerHTML = '어디로 갈까요,<br />' + (S.lv <= 0 ? '입문 취발러님?' : `${S.lv}년차 취발러님?`);

  const q = !S.bossUnlocked ? ['메인 스테이지 3라운드 클리어', '안무 선생님 앞에서 5동작을 기억해 내면 최종 던전이 열려요.']
    : (!S.cleared ? ['최종 던전 — 작품반 오디션', '실수 허용 0회. 통과하면 발레 백화점 자유이용권이 손에 들어옵니다.']
      : ['로그아웃 해제 완료', '자유이용권을 얻었습니다. 이제 진짜로 나갈 수 있어요. …정말요?']);
  $('#questTitle').textContent = q[0];
  $('#questDesc').textContent = q[1];

  const st = $('#statStrip');
  st.innerHTML = Object.keys(STAT_LABEL).map(k =>
    `<span class="stat-chip"><span>${STAT_LABEL[k]}</span><b>${S.stats[k]}</b></span>`).join('');
}

/* ---------------- navigation ---------------- */
let current = 'boot';
function go(name, opts = {}) {
  if (current === 'stage' || current === 'audition') { cancelMission(); refreshMissionBuffs(); }
  if (name === 'pool') stopRhythm();
  if (current === 'pool' && name !== 'pool') renderBuffs($('#poolBuff'), []);
  $$('.screen').forEach(s => s.classList.toggle('on', s.id === 's-' + name));
  current = name;
  $('#hud').hidden = (name === 'boot' || name === 'death' || name === 'ending');
  renderHud();
  if (name === 'map') renderMapTags();
  if (name === 'shop') renderShop();
  if (name === 'snack') renderSnack();
  if (name === 'stage') { $('#stageRound').textContent = 'ROUND ' + clamp(S.round + 1, 1, 3); beginStage(); }
  if (name === 'audition') { beginAudition(); }
  if (name === 'pool') { resetPool(); }
  if (name === 'ending') prepareEnding();
  if (name === 'death') renderDeath(opts.reason, opts.sub);
}

$$('[data-go]').forEach(b => b.onclick = () => {
  const t = b.dataset.go;
  if (t === 'audition' && !S.bossUnlocked && !S.cleared) {
    dialog({ name: 'SYSTEM', role: '최종 던전', face: 'assets/av_ara.webp',
      text: '[SYSTEM] <b>최종 던전이 잠겨 있습니다.</b>\n메인 스테이지를 3라운드까지 클리어하면 열립니다.\n\n아라: 서두르지 않아도 돼요. 이어지는 것부터.',
      buttons: [{ label: '알겠어요' }] });
    return;
  }
  go(t);
});

$('#lvBtn').onclick = showStats;
function showStats() {
  $('#statLv').textContent = S.lv;
  const sy = $('#statYear'); if (sy) sy.textContent = yearTxt(S.lv);
  $('#statList').innerHTML = Object.keys(STAT_LABEL).map(k => {
    const v = S.stats[k], pct = clamp((v / (k === 'flex' ? 120 : 80)) * 100, 3, 100);
    return `<div class="srow"><span>${STAT_LABEL[k]}</span><div class="sbar"><i style="width:${pct}%"></i></div><b>${v}</b></div>`;
  }).join('');
  $('#statNote').innerHTML =
    `최대 HP <b>${maxHp()}</b> (체력 ${S.stats.stamina}) · 동작 표시 <b>${(showMs() / 1000).toFixed(2)}초</b><br>` +
    `입력 제한 <b>${(windowMs() / 1000).toFixed(2)}초</b> (방향감각 ${S.stats.direction}) · 골드 <b>×${goldMult().toFixed(2)}</b>`;
  $('#statDlg').hidden = false;
}
$$('[data-close]').forEach(b => b.onclick = () => { $('#' + b.dataset.close).hidden = true; });

$('#resetBtn').onclick = () => {
  if (!confirm('게임 기록을 지우고 Lv.0 (입문)부터 다시 시작할까요?')) return;
  try { localStorage.removeItem(KEY); } catch (e) {}
  location.reload();
};

$('#logoutBtn').onclick = () => {
  if (S.cleared) {
    dialog({ name: 'SYSTEM', role: '로그아웃', text: '[SYSTEM] 클리어 기록 확인.\n로그아웃이 허용되었습니다.\n\n수고하셨습니다, 취발러님. 내일도 센터에서 봐요.',
      buttons: [{ label: '로그아웃', onClick: () => { toast('다음 게임에서 만나요 🩰'); } }, { label: '더 놀기', ghost: true }] });
  } else {
    dialog({ name: 'SYSTEM', role: '로그아웃 거부', text: '[SYSTEM] 로그아웃 요청이 <b>거부</b>되었습니다.\n사유: 게임 미클리어\n\n“취발러는 발레 백화점 자유이용권을 얻을 때까지 이곳을 떠날 수 없습니다.”',
      buttons: [{ label: '…알겠습니다' }] });
    sfx('err');
  }
};

/* =============================================================
   BOOT
   ============================================================= */
const BOOT_LINES = [
  ['[SYSTEM] 접속 중…', ''],
  ['[SYSTEM] 플레이어 확인 · <b>취발러</b>', ''],
  ['[SYSTEM] 신규 취발러 등록 확인 · <b>Lv.0 (0년차)</b>', 'hl'],
  ['[SYSTEM] 오늘부터 발레 왕국에서 <b>레벨</b>을 쌓습니다.', ''],
  ['[SYSTEM] 로그아웃 조건: <b>게임 클리어</b>', 'warn'],
  ['[SYSTEM] ※ 클리어 전까지 로그아웃할 수 없습니다.', 'warn'],
  ['[SYSTEM] 최종 보상: <b>발레 백화점 자유이용권 🎫</b>', 'hl']
];

let bootDone = false;
async function runBoot() {
  const log = $('#bootLog');
  log.innerHTML = '';
  for (let i = 0; i < BOOT_LINES.length; i++) {
    const [template, cls] = BOOT_LINES[i];
    const el = document.createElement('span');
    el.className = 'l ' + cls;
    log.appendChild(el);
    // split into segments so <b> survives the typewriter
    const segs = template.split(/(<b>[\s\S]*?<\/b>)/g).filter(Boolean).map(part =>
      part.startsWith('<b>')
        ? { bold: true, text: part.slice(3, -4) }
        : { bold: false, text: part });
    let shown = 0;
    const total = segs.reduce((n, s) => n + s.text.length, 0);
    for (; shown <= total; shown++) {
      let left = shown, html = '';
      for (const s of segs) {
        const take = Math.min(left, s.text.length);
        if (take > 0) html += s.bold ? `<b>${s.text.slice(0, take)}</b>` : s.text.slice(0, take);
        left -= take;
        if (left <= 0) break;
      }
      el.innerHTML = html + (shown < total ? '<span style="opacity:.6">▌</span>' : '');
      await sleep(shown === 0 ? 0 : 13);
    }
    el.innerHTML = template;
    if (i === 2 || i === 4) sfx('tick');
    await sleep(190);
  }
  bootDone = true;
  $('#bootStart').hidden = false;
  $('#bootFoot').hidden = false;
  $('#bootStart').animate([{ transform: 'scale(.96)', opacity: .6 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'ease-out' });
}

$('#bootStart').onclick = () => { sfx('ok'); go('map'); };

/* =============================================================
   SHOP
   ============================================================= */
const SHOP_SAY = {
  enter: ['도아가는 리듬이 빛나는 너! 어서 와, 오늘 뭐 마실래?', '회전은 마음가짐부터! 근데 배는 채워야지~', '오늘 라떼 거품 진짜 예뻐. 한 잔 어때?'],
  latte: '턴아웃 라떼 나왔어! 이거 마시면 센터에서 오답 한 번은 자동으로 고쳐 줄게. 진짜야!',
  ribs: '갈비뼈 닫히는 라떼~ 오디션에서 한 번 죽는 걸 막아 줄 거야. 숨은 조금 불편해!',
  poca: '포카리 포션! 이온 충전 완료. 다음 미션 시작할 때 물도 한 번 더 채워 줄게!',
  smoothie: '근력 스무디! 바나나 듬뿍. 워터파크 가면 골드가 두 배로 떠내려와!',
  poor: '어라, 골드가 모자라네? 워터파크에서 물장구 치면 금방 모여!'
};

/* 다음 미션 + 피루 추천 */
function nextMissionInfo() {
  if (!S.bossUnlocked) return { key: 'stage', label: `메인 스테이지 · ROUND ${clamp(S.round + 1, 1, 3)}` };
  if (!S.cleared) return { key: 'audition', label: '최종 던전 · 작품반 오디션' };
  return { key: 'pool', label: '발레 워터파크 · 자유 훈련' };
}
function pickDrink() {
  const m = nextMissionInfo();
  if (S.hp <= maxHp() * 0.45) return { id: 'poca',
    say: '얼굴이 파래… 포카리 포션부터 마셔! HP부터 채우고, 미션 시작하면 물도 한 번 더 충전해 줄게.' };
  if (m.key === 'audition') return { id: 'ribs',
    say: '다음은 작품반 오디션! 거긴 실수하면 즉사니까 갈비뼈 닫히는 라떼 챙겨. 한 번은 살려 줄 거야.' };
  if (m.key === 'stage') return { id: 'latte',
    say: '센터 순서 외우기 힘들면 턴아웃 라떼 한 잔 하고 가! 오답 한 번은 자동으로 고쳐 줄게.' };
  return { id: 'smoothie',
    say: '물장구로 골드를 벌 생각이면 근력 스무디! 골드가 두 배로 떠내려와.' };
}

function renderShop() {
  const list = $('#shopList');
  const m = nextMissionInfo();
  const rec = pickDrink();
  const recItem = SHOP.find(s => s.id === rec.id);
  const next = $('#shopNext');
  if (next) next.innerHTML = `<span>다음 미션</span><b>${m.label}</b><i>피루 추천 · ${recItem.ico} ${recItem.name}</i>`;
  list.innerHTML = '';
  SHOP.forEach(it => {
    const owned = (it.id === 'latte' && S.buffs.turnout) || (it.id === 'ribs' && S.buffs.align) || (it.id === 'poca' && S.buffs.poca);
    const el = document.createElement('div');
    el.className = 'item' + (owned ? ' owned' : '') + (it.id === rec.id ? ' rec' : '');
    el.innerHTML = `
      <div class="item-ico">${it.ico}</div>
      <div class="item-body">
        ${it.id === rec.id ? '<i class="rec-tag">추천</i>' : ''}
        <b>${it.name} <span style="color:#ffd88a;font-size:10px">${it.tag}</span></b>
        <small>${it.desc}</small>
      </div>
      <button class="item-buy" ${S.gold < it.price || owned ? 'disabled' : ''}>${owned ? '적용됨' : it.price + 'G'}</button>`;
    el.querySelector('.item-buy').onclick = () => buy(it, el);
    list.appendChild(el);
  });
  const say = $('#shopSay');
  if (say) say.textContent = rec.say;
  renderHud();
}

function buy(it, el) {
  if (S.gold < it.price) { toast('골드가 부족해요', true); return; }
  S.gold -= it.price;
  if (it.id === 'latte') { S.buffs.turnout = true; S.stats.knowledge += 1; }
  if (it.id === 'ribs') { S.buffs.align = true; S.stats.knowledge += 1; }
  if (it.id === 'poca') { S.hp = Math.min(S.hp + 30, maxHp() + 30); S.buffs.poca = true; }
  if (it.id === 'smoothie') { S.stats.strength += 10; S.buffs.power = true; }
  sfx('gold');
  save(); renderShop();
  $('#shopSay').textContent = SHOP_SAY[it.id] || '';
  toast(`${it.name} 구매 완료 · ${it.tag}`);
  el.animate([{ transform: 'scale(.98)' }, { transform: 'none' }], { duration: 260 });
}

/* =============================================================
   MISSION ENGINE (stage + audition)
   ============================================================= */
let M = null;
function cancelMission() {
  if (!M) return;
  M.canceled = true; M.timerOn = false;
  M = null;
}

function buildPads(grid, handler) {
  grid.innerHTML = '';
  POSES.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'pad';
    b.innerHTML = `<img src="${p.img}" alt="${p.name}" /><span>${p.name}</span><i class="pad-num">0${i + 1}</i>`;
    b.onclick = () => handler(i, b);
    grid.appendChild(b);
  });
}

function missionUI(cfg) {
  return {
    grid: cfg.grid, img: cfg.img, tag: cfg.tag, msg: cfg.msg, timer: cfg.timer,
    pads: [...cfg.grid.children]
  };
}

const MOODS = { focus: 'assets/sugar_face1.webp', happy: 'assets/sugar_face2.webp',
               tense: 'assets/sugar_face3.webp', upset: 'assets/sugar_face4.webp' };
function setMood(k) {
  const el = $('#moodImg');
  if (el && MOODS[k] && current === 'stage') el.src = MOODS[k];
}

function showPose(ui, i) {
  ui.img.classList.remove('idle');
  ui.img.src = POSES[i].big;
  ui.img.alt = POSES[i].name;
  ui.img.classList.add('show');
  ui.tag.textContent = POSES[i].name;
  ui.tag.classList.add('show');
  ui.pads.forEach((p, k) => p.classList.toggle('lit', k === i));
  ui.img.classList.remove('pop');
  void ui.img.offsetWidth;
  ui.img.classList.add('pop');
}
function hidePose(ui) {
  ui.img.classList.remove('show');
  ui.img.classList.add('idle');
  ui.img.src = IDLE_BIG;
  ui.img.alt = '대기 중인 취발러';
  ui.tag.classList.remove('show');
  ui.pads.forEach(p => p.classList.remove('lit'));
}

function idlePose(ui) {
  ui.img.classList.add('idle', 'show');
  ui.img.src = IDLE_BIG;
  ui.tag.classList.remove('show');
}

function makeSeq(len) {
  const s = [];
  for (let i = 0; i < len; i++) {
    let v;
    do { v = Math.floor(Math.random() * 4); } while (s.length >= 2 && v === s[s.length - 1] && v === s[s.length - 2]);
    s.push(v);
  }
  return s;
}

async function startMission(cfg) {
  cancelMission();
  const ui = missionUI(cfg);
  const sp = cfg.speed || 1;
  const b = { ...S.buffs };
  const show0 = showMs(), win0 = windowMs();
  M = {
    cfg, ui, roundIdx: 0, seq: [], inputIdx: 0, locked: true,
    canceled: false, timerOn: false, timerGen: 0,
    buffs: b,
    guard: { turnout: !!b.turnout, align: !!b.align, hint: !!b.hint }
  };
  if (b.poca) {
    S.hp = Math.min(maxHp(), S.hp + 10);
    splash('💧 수분 충전 완료!');
    toast('포카리 포션 · HP +10');
  }
  // 음료·분식 버프는 이 미션 1회분으로 소모
  S.buffs.turnout = false; S.buffs.align = false; S.buffs.poca = false;
  S.buffs.stretch = false; S.buffs.hint = false;
  save(); renderHud();
  refreshMissionBuffs();
  idlePose(ui);
  M.showMs = Math.max(360, show0 * sp);
  M.windowMs = Math.max(1000, win0 * sp);
  await playRound();
}

async function playRound() {
  const c = M.cfg.rounds[M.roundIdx];
  const m = M;
  M.seq = makeSeq(c.len);
  M.inputIdx = 0;
  M.locked = true;
  M.timerOn = false;
  m.ui.timer.classList.remove('on');
  m.ui.msg.classList.remove('bad');
  m.ui.msg.innerHTML = c.intro || `동작 <b>${c.len}개</b>를 외우세요.`;
  const goal = $('#stageGoal');
  if (goal) goal.textContent = c.len + '동작';
  hidePose(m.ui);
  await sleep(560);
  if (m.canceled) return;
  for (const i of m.seq) {
    if (m.canceled) return;
    showPose(m.ui, i);
    setMood('focus');
    sfx('tick');
    await sleep(m.showMs);
    if (m.canceled) return;
    hidePose(m.ui);
    await sleep(110);
  }
  if (m.canceled) return;
  m.ui.msg.innerHTML = '<b>지금!</b> 순서대로 따라하세요.';
  setMood('tense');
  m.locked = false;
  tickTimer();
}

function tickTimer() {
  const m = M;
  if (!m || m.canceled) return;
  const gen = (m.timerGen = (m.timerGen || 0) + 1);
  const dur = m.windowMs * (1 - clamp(m.inputIdx, 0, 8) * 0.012);
  const t0 = performance.now();
  m.timerOn = true;
  m.ui.timer.classList.add('on');
  const fill = m.ui.timer.querySelector('i');
  const step = t => {
    // a newer timer (or a cleared one) owns the bar now — this loop must stop
    if (!m || m.canceled || gen !== m.timerGen || !m.timerOn) return;
    const p = 1 - (t - t0) / dur;
    fill.style.transform = `scaleX(${clamp(p, 0, 1)})`;
    if (p <= 0) { m.timerGen++; m.timerOn = false; fail('timeout'); return; }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function tapPad(i, btn) {
  const m = M;
  if (!m || m.canceled || m.locked || !m.timerOn) return;
  if (i === m.seq[m.inputIdx]) {
    m.inputIdx++;
    setMood('happy');
    m.timerOn = false;
    btn.classList.add('lit');
    sfx('ok');
    setTimeout(() => btn.classList.remove('lit'), 180);
    if (m.inputIdx >= m.seq.length) {
      m.locked = true;
      m.ui.timer.classList.remove('on');
      m.ui.msg.innerHTML = '<b>좋아요!</b> 다음 동작 준비…';
      sfx('gold');
      setTimeout(() => nextRound(), 520);
    } else {
      tickTimer();
    }
  } else {
    fail('wrong', i);
  }
}

function fail(kind, idx) {
  const m = M;
  if (!m || m.canceled) return;

  /* 🥛 턴아웃 라떼 — 오답 1회 자동 보정 */
  if (kind === 'wrong' && m.guard.turnout) {
    m.guard.turnout = false;
    m.timerOn = false;
    const right = m.seq[m.inputIdx];
    const pad = m.ui.pads[right];
    if (pad) {
      pad.classList.add('lit', 'fixed');
      setTimeout(() => pad.classList.remove('lit', 'fixed'), 560);
    }
    sfx('ok');
    setMood('happy');
    m.inputIdx++;
    m.ui.msg.classList.remove('bad');
    m.ui.msg.innerHTML = '<b>턴아웃 버프!</b> 오답을 자동으로 보정했어요 <span style="opacity:.65">(1회 사용)</span>';
    refreshMissionBuffs();
    if (m.inputIdx >= m.seq.length) {
      m.locked = true;
      m.ui.timer.classList.remove('on');
      setTimeout(() => nextRound(), 640);
    } else {
      m.locked = false;
      tickTimer();
    }
    return;
  }

  /* 🍢 어묵 꼬치 — 오답 1회 힌트 (피해 없이 정답 공개) */
  if (kind === 'wrong' && m.guard.hint) {
    m.guard.hint = false;
    m.timerOn = false; m.locked = true;
    m.ui.timer.classList.remove('on');
    const right = m.seq[m.inputIdx];
    const pad = m.ui.pads[right];
    if (pad) {
      pad.classList.add('lit', 'fixed');
      setTimeout(() => pad.classList.remove('lit', 'fixed'), 1100);
    }
    sfx('ok');
    m.ui.msg.classList.remove('bad');
    m.ui.msg.innerHTML = `<b>어묵 꼬치 힌트!</b> 정답은 <b>${POSES[right].name}</b> — 이번엔 피해 없음 <span style="opacity:.65">(1회 사용)</span>`;
    refreshMissionBuffs();
    setTimeout(() => {
      if (M === m) { m.ui.msg.classList.remove('bad'); playRound(); }
    }, 1250);
    return;
  }

  const dmg0 = m.cfg.dmg || 18;
  const wouldDie = m.cfg.boss || S.hp - dmg0 <= 0;

  /* 🍵 갈비뼈 라떼 — 즉사 1회 방어 */
  if (m.guard.align && wouldDie) {
    m.guard.align = false;
    m.timerOn = false; m.locked = true;
    m.ui.timer.classList.remove('on');
    S.hp = Math.max(1, Math.round(maxHp() * 0.5));
    renderHud();
    m.ui.msg.classList.add('bad');
    m.ui.msg.innerHTML = '<b>갈비뼈 라떼 덕에 1회 생존!</b> HP 50%로 버텼어요 <span style="opacity:.65">(실드 사용)</span>';
    sfx('lvl');
    refreshMissionBuffs();
    setTimeout(() => {
      if (M === m) { m.ui.msg.classList.remove('bad'); playRound(); }
    }, 1150);
    return;
  }

  m.timerOn = false; m.locked = true;
  m.ui.timer.classList.remove('on');
  if (idx != null && m.ui.pads[idx]) {
    m.ui.pads[idx].classList.add('err');
    setTimeout(() => m.ui.pads && m.ui.pads[idx] && m.ui.pads[idx].classList.remove('err'), 500);
  }
  m.ui.msg.classList.add('bad');
  setMood('upset');
  sfx('err');
  const dmg = m.cfg.dmg || 18;
  S.hp = Math.max(0, S.hp - dmg);
  renderHud();
  const reason = pick(kind === 'timeout' ? DEATH_REASONS.timing : m.cfg.reasons);
  if (S.hp <= 0) {
    m.ui.msg.innerHTML = `<b>-${dmg} HP</b> · ${reason}`;
    setTimeout(() => { if (M === m) { const r = reason; cancelMission(); die(r, m.cfg); } }, 700);
    return;
  }
  m.ui.msg.innerHTML = `<b>-${dmg} HP</b> · ${reason} <span style="opacity:.7">— 한 번 더!</span>`;
  if (m.cfg.boss) {
    setTimeout(() => { if (M === m) { S.hp = 0; renderHud(); const r = reason; cancelMission(); die(r, m.cfg); } }, 900);
    return;
  }
  setTimeout(() => { if (M === m) { m.ui.msg.classList.remove('bad'); playRound(); } }, 1250);
}

function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

function nextRound() {
  const m = M;
  if (!m || m.canceled) return;
  m.roundIdx++;
  if (m.roundIdx >= m.cfg.rounds.length) {
    const f = m.cfg.onClear;
    cancelMission();
    f && f();
    return;
  }
  m.cfg.onRound && m.cfg.onRound(m.roundIdx);
  playRound();
}

/* ---------------- stage ---------------- */
function beginStage() {
  buildPads($('#padGrid'), (i, b) => tapPad(i, b));
  const rounds = [
    { len: 3, intro: '<b>ROUND 1</b> · 기본 3동작. 할 수 있어요.', label: '기본' },
    { len: 4, intro: '<b>ROUND 2</b> · 4동작. 호흡을 기억하세요.', label: '응용' },
    { len: 5, intro: '<b>ROUND 3</b> · 5동작. 선생님이 웃고 있어요.', label: '완성' }
  ];
  const startIdx = clamp(S.round, 0, 2);
  startMission({
    grid: $('#padGrid'), img: $('#poseShowImg'), tag: $('#poseShowName'),
    msg: $('#stageMsg'), timer: $('#timerBar'),
    rounds: rounds.slice(startIdx),
    dmg: 18,
    reasons: DEATH_REASONS.stage,
    onRound: idx => {
      S.gold += 90;
      flashGold();
      grow({ flex: 2, knowledge: 1, stamina: 1, direction: 1 }, 1,
        'ROUND ' + clamp(startIdx + idx, 1, 3) + ' 클리어 · +90G');
      $('#stageRound').textContent = 'ROUND ' + clamp(startIdx + idx + 1, 1, 3);
    },
    onClear: stageClear
  });
}

function stageClear() {
  S.gold += 260;
  S.round = 3;
  S.stageClear = true;
  S.bossUnlocked = true;
  grow({ flex: 3, knowledge: 2, stamina: 3, direction: 2 }, 2, '메인 스테이지 클리어 · +260G');
  setTimeout(() => {
    dialog({
      name: '에튜', role: 'Attitude · 에튜', face: 'assets/av_etu.webp',
      text: '센터는 배신하지 않아. …오늘은 네가 배신하지 않았네.\n\n<b>[SYSTEM] 메인 스테이지 클리어</b>\n+260G · Lv.' + S.lv + ' (' + yearTxt(S.lv) + ') 달성\n유연성 +3 / 발레 지식 +2 / 체력 +3 / 방향감각 +2\n\n최종 던전 <b>작품반 오디션</b>이 열렸습니다.',
      buttons: [{ label: '지도로', onClick: () => go('map') }]
    });
  }, 900);
}

/* ---------------- audition ---------------- */
function beginAudition() {
  buildPads($('#padGrid2'), (i, b) => tapPad(i, b));
  $('#auditionPhase').textContent = 'PHASE 1';
  const rounds = [
    { len: 6, intro: '<b>PHASE 1</b> · 6동작. 실수는 없습니다.' },
    { len: 7, intro: '<b>PHASE 2</b> · 7동작. 심사위원이 몸을 앞으로 숙였습니다.' }
  ];
  startMission({
    grid: $('#padGrid2'), img: $('#poseShowImg2'), tag: $('#poseShowName2'),
    msg: $('#auditionMsg'), timer: $('#timerBar'),
    rounds, dmg: maxHp(), boss: true,
    reasons: DEATH_REASONS.boss,
    onRound: () => { $('#auditionPhase').textContent = 'PHASE 2'; },
    onClear: auditionClear,
    speed: 0.84
  });
}

function auditionClear() {
  S.cleared = true;
  S.gold += 1000;
  grow({ flex: 4, direction: 3, strength: 2, knowledge: 3 }, 3, '작품반 오디션 통과 · +1000G');
  sfx('lvl');
  setTimeout(() => go('ending'), 1300);
}

/* ---------------- death ---------------- */
let lastDeath = { reason: '사유: 알 수 없는 이유로', cfg: null };
function die(reason, cfg) {
  S.deaths++;
  S.attempts++;
  S.hp = Math.max(1, Math.round(maxHp() * 0.5));
  save();
  lastDeath = { reason, cfg };
  sfx('dead');
  try { navigator.vibrate && navigator.vibrate([30, 60, 90]); } catch (e) {}
  go('death', { reason, sub: `도전 ${S.attempts}회차 · HP 50%로 복구되었습니다.` });
}

function renderDeath(reason, sub) {
  $('#deathReason').textContent = '사유: ' + (reason || pick(DEATH_REASONS.stage));
  $('#deathSub').textContent = sub || '로그아웃은 허용되지 않습니다.';
  const art = $('.death-art img');
  art.src = 'assets/sugar_rest@2x.webp';
}

$('#retryBtn').onclick = () => {
  sfx('ok');
  if (lastDeath.cfg && lastDeath.cfg.boss) go('audition');
  else if (lastDeath.cfg) go('stage');
  else go('map');
};
$('#quitBtn').onclick = () => {
  sfx('err');
  dialog({ name: 'SYSTEM', role: '나가기', text: '[SYSTEM] 나가기가 <b>거부</b>되었습니다.\n\n“죽었다고 끝나는 게임이 아닙니다.\n로그아웃 조건은 여전히 <b>게임 클리어</b>입니다.”',
    buttons: [{ label: '…다시 도전', onClick: () => $('#retryBtn').click() }, { label: '지도 구경', ghost: true, onClick: () => go('map') }] });
};

/* =============================================================
   POOL — rhythm training
   ============================================================= */
const pool = { running: false, pos: 0, dir: 1, speed: 0, left: 10, perfect: 0, raf: 0, last: 0, gold: 0, power: false };
function applyPoolPower() {
  const z = $('#zone'), zc = $('#zoneCore');
  if (z && zc) {
    if (pool.power) {
      z.style.left = '30%'; z.style.width = '40%';
      zc.style.left = '42%'; zc.style.width = '16%';
    } else {
      z.style.left = ''; z.style.width = '';
      zc.style.left = ''; zc.style.width = '';
    }
  }
  renderBuffs($('#poolBuff'), pool.power ? [['power', false]] : []);
}
function resetPool() {
  pool.running = false; pool.left = 10; pool.perfect = 0; pool.gold = 0;
  pool.power = !!S.buffs.power;
  $('#poolLeft').textContent = 10;
  $('#poolPerfect').textContent = 0;
  $('#poolMsg').textContent = pool.power ? '근력 버프! 초록 존이 넓고 골드 2배 ✨' : '초록 존에 들어오면 터치!';
  $('#poolTap').textContent = '물장구 🏊';
  $('#poolTap').onclick = poolTap;
  applyPoolPower();
  startRhythm();
}
function startRhythm() {
  stopRhythm();
  pool.running = true; pool.pos = 8; pool.dir = 1;
  pool.speed = 0.55 + Math.random() * 0.18;
  pool.last = performance.now();
  const loop = t => {
    if (!pool.running) return;
    const dt = Math.min(64, t - pool.last); pool.last = t;
    pool.pos += pool.dir * pool.speed * dt / 10;
    if (pool.pos > 96) { pool.pos = 96; pool.dir = -1; }
    if (pool.pos < 4) { pool.pos = 4; pool.dir = 1; }
    $('#marker').style.left = pool.pos + '%';
    pool.raf = requestAnimationFrame(loop);
  };
  pool.raf = requestAnimationFrame(loop);
}
function stopRhythm() {
  pool.running = false;
  cancelAnimationFrame(pool.raf);
}

function poolTap() {
  if (!pool.running || pool.left <= 0) return;
  const p = pool.pos;
  const pw = pool.power;
  let gain = 0, msg = '';
  if (p >= (pw ? 42 : 46) && p <= (pw ? 58 : 54)) {
    gain = Math.round((pw ? 110 : 55) * goldMult()); pool.perfect++;
    msg = 'PERFECT! 물보라가 반짝 ✨' + (pw ? ' ×2' : ''); sfx('gold');
  } else if (p >= (pw ? 30 : 38) && p <= (pw ? 70 : 62)) {
    gain = Math.round((pw ? 60 : 30) * goldMult());
    msg = 'GOOD — 리듬 탔어요' + (pw ? ' ×2' : ''); sfx('ok');
  } else { gain = 0; msg = '빗나감… 물만 튀었어요'; sfx('err'); }
  pool.left--;
  if (gain) { S.gold += gain; pool.gold += gain; }
  renderHud();
  $('#poolLeft').textContent = pool.left;
  $('#poolPerfect').textContent = pool.perfect;
  $('#poolMsg').textContent = gain ? `${msg}  +${gain}G` : msg;
  const btn = $('#poolTap');
  btn.classList.remove('hit'); void btn.offsetWidth; btn.classList.add('hit');
  const art = $('#poolArt');
  if (art) { art.classList.remove('splash'); void art.offsetWidth; art.classList.add('splash'); }
  if (gain) flashGold();
  if (pool.left <= 0) endPool();
}

function endPool() {
  stopRhythm();
  S.poolSessions = (S.poolSessions || 0) + 1;
  const first = S.poolSessions <= 3;
  const boosted = pool.power;
  if (boosted) { S.buffs.power = false; pool.power = false; }
  S.hp = maxHp();
  save(); renderHud();
  grow(first ? { stamina: 2, strength: 2, flex: 1 } : { stamina: 1 }, first ? 1 : 0);
  $('#poolMsg').innerHTML = `<b>훈련 종료</b> · 오늘 +${pool.gold}G`;
  $('#poolTap').textContent = '한 번 더 🏊';
  $('#poolTap').onclick = () => resetPool();
  applyPoolPower();
  dialog({
    name: '샹즈', role: 'Changement · 샹즈', face: 'assets/av_shangz.webp',
    text: `오늘도 반짝이는 걸 찾으러 왔구나! 물장구 10번 중 PERFECT ${pool.perfect}번!${boosted ? '\n근력 스무디 버프로 골드 2배 적용!' : ''}\n\n<b>[SYSTEM] 훈련 완료</b>\n+${pool.gold}G\nLv.${S.lv} (${yearTxt(S.lv)})${first ? '\n체력 +2 · 근력 +2 · 유연성 +1' : ''}\n\n${first ? '체력이 오르면 최대 HP가 늘어납니다.' : '스탯 보너스는 하루 3회까지만!'}`,
    buttons: [{ label: '또 훈련', onClick: () => resetPool() }, { label: '지도로', ghost: true, onClick: () => go('map') }]
  });
  sfx('gold');
}

/* =============================================================
   ENDING
   ============================================================= */
function prepareEnding() {
  const tries = S.attempts > 0 ? `도전 ${S.attempts}회차` : '무사망 클리어';
  $('#endingSub').textContent = `취발러 Lv.${S.lv} (${yearTxt(S.lv)}) · ${tries} · 로그아웃 해제`;
  const tn = $('#ticketNo');
  if (tn) tn.textContent = ticketNo().replace('NO. ', 'NO. ') + ' · 무제한';
  $('#logoutNow').onclick = () => $('#logoutBtn').click();
}

/* =============================================================
   RESULT IMAGE  (1080 × 1920)
   ============================================================= */
function loadImg(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = rej; i.src = src;
  });
}

async function buildResult(type, reason) {
  const W = 1080, H = 1920;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');

  const clear = type === 'clear';
  // background
  const g = x.createLinearGradient(0, 0, 0, H);
  if (clear) { g.addColorStop(0, '#241636'); g.addColorStop(.45, '#3b2352'); g.addColorStop(1, '#1b1130'); }
  else { g.addColorStop(0, '#0b0509'); g.addColorStop(.5, '#1e0a14'); g.addColorStop(1, '#0a0308'); }
  x.fillStyle = g; x.fillRect(0, 0, W, H);

  // glow
  const rg = x.createRadialGradient(W / 2, H * .40, 40, W / 2, H * .40, W * .85);
  rg.addColorStop(0, clear ? 'rgba(255,216,138,.30)' : 'rgba(255,70,100,.24)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = rg; x.fillRect(0, 0, W, H);

  // stars
  for (let i = 0; i < 130; i++) {
    const sx = Math.random() * W, sy = Math.random() * H, r = Math.random() * 2.4 + .6;
    x.fillStyle = `rgba(255,255,255,${Math.random() * .55 + .12})`;
    x.beginPath(); x.arc(sx, sy, r, 0, 7); x.fill();
  }

  // character
  try {
    const src = clear ? 'assets/sugar_arabesque@2x.webp' : 'assets/sugar_rest@2x.webp';
    const im = await loadImg(src);
    const maxH = 720, ratio = im.width / im.height;
    let h = maxH, w = h * ratio;
    if (w > W * .80) { w = W * .80; h = w / ratio; }
    const cy = 940;
    x.save();
    x.globalAlpha = .97;
    if (!clear) x.filter = 'saturate(.8) brightness(.95)';
    x.drawImage(im, (W - w) / 2, cy - h / 2, w, h);
    x.restore();
  } catch (e) {}

  // header
  x.textAlign = 'center';
  x.fillStyle = clear ? 'rgba(255,236,190,.9)' : 'rgba(255,180,196,.85)';
  x.font = '600 30px "Pretendard Variable", sans-serif';
  x.letterSpacing = '10px';
  x.fillText('BALLET KINGDOM', W / 2, 132);
  x.letterSpacing = '0px';

  // title
  if (clear) {
    x.font = '800 88px "Nanum Myeongjo", serif';
    x.fillStyle = '#fff2cf';
    x.shadowColor = 'rgba(255,216,138,.65)'; x.shadowBlur = 40;
    x.fillText('발레 백화점', W / 2, 282);
    x.fillText('자유이용권 🎫', W / 2, 386);
    x.shadowBlur = 0;
  } else {
    x.font = '800 92px "Nanum Myeongjo", serif';
    x.fillStyle = '#ff8fa8';
    x.shadowColor = 'rgba(255,60,90,.75)'; x.shadowBlur = 46;
    x.fillText('💀 사망했습니다 💀', W / 2, 300);
    x.shadowBlur = 0;
  }

  // reason / subtitle
  x.font = '400 38px "Pretendard Variable", sans-serif';
  x.fillStyle = clear ? 'rgba(240,225,255,.92)' : 'rgba(240,205,214,.94)';
  const line = clear ? '취발러 · ' + S.lv + '년차의 플레이가 완성되었습니다'
                     : `사유: ${reason || '센터에서 발을 헛디뎠습니다'}`;
  const yLine = clear ? 468 : 384;
  wrapText(x, line, W / 2, yLine, W - 170, 50);

  x.font = '400 30px "Pretendard Variable", sans-serif';
  x.fillStyle = clear ? 'rgba(210,196,235,.85)' : 'rgba(190,140,155,.9)';
  x.fillText(clear ? `Lv.${S.lv} (${yearTxt(S.lv)}) · 자유이용권 ${ticketNo()}`
                   : (S.attempts > 0 ? `Lv.${S.lv} (${yearTxt(S.lv)}) · 도전 ${S.attempts}회차 · 로그아웃 불가` : `Lv.${S.lv} (${yearTxt(S.lv)}) · 첫 도전 · 로그아웃 불가`), W / 2, yLine + 58);

  // stat cards
  const stats = [
    ['유연성', S.stats.flex], ['발레 지식', S.stats.knowledge],
    ['체력', S.stats.stamina], ['근력', S.stats.strength], ['방향감각', S.stats.direction]
  ];
  const cw = 176, gap = 16, total = stats.length * cw + (stats.length - 1) * gap;
  let sx0 = (W - total) / 2;
  const sy = 1432;
  stats.forEach(([k, v], i) => {
    const cx = sx0 + i * (cw + gap);
    x.fillStyle = clear ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.07)';
    roundRect(x, cx, sy, cw, 150, 24); x.fill();
    x.strokeStyle = clear ? 'rgba(255,216,138,.35)' : 'rgba(255,140,165,.28)';
    x.lineWidth = 2; roundRect(x, cx, sy, cw, 150, 24); x.stroke();
    x.fillStyle = 'rgba(220,205,235,.75)';
    x.font = '400 22px "Pretendard Variable", sans-serif';
    x.fillText(k, cx + cw / 2, sy + 48);
    x.fillStyle = '#fff';
    x.font = '800 52px "Nanum Myeongjo", serif';
    x.fillText(String(v), cx + cw / 2, sy + 112);
  });

  // footer
  x.fillStyle = 'rgba(255,255,255,.45)';
  x.font = '400 26px "Pretendard Variable", sans-serif';
  x.fillText('취발러의 엔딩은 죽음뿐 · @sugarballet0506', W / 2, 1680);
  x.fillStyle = clear ? 'rgba(255,216,138,.95)' : 'rgba(255,150,175,.9)';
  x.font = '700 36px "Pretendard Variable", sans-serif';
  x.fillText(clear ? 'Lv.' + S.lv + ' (' + yearTxt(S.lv) + ') · GAME CLEAR'
                   : 'Lv.' + S.lv + ' (' + yearTxt(S.lv) + ') · TRY AGAIN', W / 2, 1746);
  x.fillStyle = 'rgba(255,255,255,.3)';
  x.font = '400 24px "Pretendard Variable", sans-serif';
  x.fillText('sheeny6-cmyk.github.io/magic-sugar-game/kingdom/', W / 2, 1806);

  return c;
}

function roundRect(x, X, Y, w, h, r) {
  x.beginPath();
  x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r);
  x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r);
  x.arcTo(X, Y, X + w, Y, r); x.closePath();
}
function wrapText(x, text, cx, y, maxW, lh) {
  const words = String(text).split(' ');
  let l = '', lines = [];
  words.forEach(w => {
    const t = l ? l + ' ' + w : w;
    if (x.measureText(t).width > maxW && l) { lines.push(l); l = w; } else l = t;
  });
  if (l) lines.push(l);
  lines.forEach((ln, i) => x.fillText(ln, cx, y + i * lh));
}

async function openResult(type, reason) {
  try { await document.fonts.ready; } catch (e) {}
  const c = await buildResult(type, reason);
  const url = c.toDataURL('image/png');
  $('#resultImg').src = url;
  $('#resultImg').dataset.url = url;
  const a = $('#resultSave');
  a.href = url;
  a.setAttribute('download', type === 'clear' ? 'ballet-kingdom-clear.png' : 'ballet-kingdom-death.png');
  $('#resultTip').textContent = '이미지를 길게 눌러 저장하거나, [저장]을 눌러 주세요. 인스타 스토리에 딱 맞는 1080×1920이에요.';
  $('#resultDlg').hidden = false;
  $('#resultDlg').dataset.type = type;
}

$('#shareDeath').onclick = () => openResult('death', $('#deathReason').textContent.replace(/^사유:\s*/, ''));
$('#shareClear').onclick = () => openResult('clear');

/* =============================================================
   keyboard (desktop convenience)
   ============================================================= */
addEventListener('keydown', e => {
  const i = { '1': 0, '2': 1, '3': 2, '4': 3 }[e.key];
  if (i != null) {
    if (current === 'stage') tapPad(i, $('#padGrid').children[i]);
    if (current === 'audition') tapPad(i, $('#padGrid2').children[i]);
  }
  if (e.key === ' ' && current === 'pool') { e.preventDefault(); poolTap(); }
});

/* =============================================================
   init
   ============================================================= */
renderHud();
renderMapTags();
runBoot();

// test hook — only with ?debug=1
if (location.search.includes('debug')) {
  window.__bk = {
    S: () => S, go, die: r => die(r, { boss: false }),
    result: (t, r) => openResult(t, r), tap: (g, i) => tapPad(i, $(g).children[i]),
    mission: () => M
  };
}

// first-visit vs returning
if (S.stageClear || S.cleared) {
  $('#bootStart').textContent = '이어하기';
}
})();
