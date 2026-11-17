/* ===== 마법 슈가 · 발레쌤 눈 피하기 ===== */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const SPR = {
    good: 'assets/sugar-good.webp',
    sneak: 'assets/sugar-sneak.webp',
    caught: 'assets/sugar-caught.webp',
    tback: 'assets/teacher-back.webp',
    tglare: 'assets/teacher-glare.webp'
  };

  const TOTAL = 30; // 초

  const ANTICS = [
    '몰래 거울 셀카 📸',
    '스트레칭 땡땡이 🦵',
    '아이스아메리카노 한 모금 🥤',
    '에어팟 몰래 듣기 🎧',
    '릴스 몰래 보기 📱',
    '바에 턱 괴고 멍때리기 😑',
    '거울에 하트 그리기 💗'
  ];

  const NAGS = [
    '어깨 내려!!',
    '갈비뼈 닫아!!',
    '배에 힘 줘!!',
    '거울 보지 말고 바 잡아!!',
    '턴아웃 풀렸잖아!!',
    '발끝! 발끝!!',
    '음악 들어!!',
    '웃지 마!!'
  ];

  const RANKS = [
    { min: 3200, icon: '🥇', title: '프로 눈치 100단 취발러', sub: '쌤이 한 번도 못 잡았어요. 혹시 쌤이랑 한 몸?' },
    { min: 2100, icon: '🕵️‍♀️', title: '몰래몰래 딴짓 장인', sub: '쌤이 고개 돌리는 순간만 골라 딴짓했네요.' },
    { min: 1300, icon: '🍬', title: '눈치 빠른 발레 연습생', sub: '아슬아슬한 순간이 꽤 있었어요.' },
    { min: 600, icon: '🌱', title: '이제 눈치를 배우는 중', sub: '다음엔 손 떼는 타이밍만 조금 더 빠르게!' },
    { min: 0, icon: '🎯', title: '발레쌤 집중 마크 대상', sub: '오늘 쌤이 화가 많이 나셨어요...' }
  ];

  // ---------- DOM ----------
  const el = {
    sStart: $('s-start'), sPlay: $('s-play'), sEnd: $('s-end'),
    startBtn: $('startBtn'), againBtn: $('againBtn'), homeBtn: $('homeBtn'), saveBtn: $('saveBtn'),
    hearts: $('hearts'), score: $('score'), combo: $('combo'), clock: $('clock'), timeBar: $('timeBar'),
    happyBar: $('happyBar'),
    studio: $('studio'), sugar: $('sugar'), sugarImg: $('sugarImg'),
    teacher: $('teacher'), teacherImg: $('teacherImg'),
    nagBubble: $('nagBubble'), nagText: $('nagText'),
    sugarSay: $('sugarSay'), sayText: $('sayText'),
    warnBanner: $('warnBanner'), warnBar: $('warnBar'),
    vignette: $('vignette'), catchFlash: $('catchFlash'), popLayer: $('popLayer'),
    pad: $('pad'), padTxt: $('padTxt'), padIcon: $('padIcon'),
    endTitle: $('endTitle'), rankBadge: $('rankBadge'), rankTitle: $('rankTitle'), rankSub: $('rankSub'),
    endScore: $('endScore'), endCombo: $('endCombo'), endHearts: $('endHearts'),
    nagList: $('nagList'), nagCount: $('nagCount'), endFoot: $('endFoot'), endTip: $('endTip'),
    toast: $('toast'), rcv: $('resultCanvas'),
    soundBtns: [$('soundBtn'), $('soundBtnStart'), $('soundBtnEnd')]
  };

  // ---------- 상태 ----------
  const G = {
    playing: false, timeLeft: TOTAL, score: 0, hearts: 3, combo: 0, bestCombo: 0,
    holding: false, needRelease: false, sneaking: false,
    phase: 'safe', phaseT: 0, safeDur: 1.6, warnDur: 0.8, lookDur: 1.1, isFake: false,
    lockT: 0, happy: 0, nagLog: {}, nagTotal: 0, anticsT: 0, anticsIdx: -1,
    tickT: 0, last: 0, raf: 0, sound: true, actx: null, overPending: null, caughtCount: 0,
    msgTimer: 0
  };
  window.__G = G; // 검증용

  // ---------- 소리 ----------
  function ac() {
    if (!G.actx) {
      try { G.actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { G.actx = null; }
    }
    if (G.actx && G.actx.state === 'suspended') G.actx.resume();
    return G.actx;
  }
  function tone(freq, dur, type, vol, slideTo, delay) {
    if (!G.sound) return;
    const ctx = ac();
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.1, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  const sfx = {
    tick(n) { tone(560 + Math.min(n, 10) * 26, 0.05, 'triangle', 0.05); },
    sneak() { tone(660, 0.06, 'triangle', 0.07); },
    warn() { tone(880, 0.08, 'square', 0.06); tone(1040, 0.09, 'square', 0.055, null, 0.1); },
    look() { tone(300, 0.16, 'sawtooth', 0.07, 420); },
    catch() {
      tone(320, 0.34, 'sawtooth', 0.12, 110);
      tone(150, 0.22, 'square', 0.08, 90, 0.04);
    },
    dodge() { tone(740, 0.07, 'sine', 0.09); tone(988, 0.07, 'sine', 0.08, null, 0.07); tone(1245, 0.1, 'sine', 0.07, null, 0.14); },
    bonus() { tone(1046, 0.07, 'sine', 0.09); tone(1568, 0.1, 'sine', 0.07, null, 0.06); },
    over() { tone(520, 0.16, 'sine', 0.1, 380); tone(390, 0.2, 'sine', 0.09, 240, 0.16); tone(260, 0.32, 'sine', 0.08, 170, 0.34); }
  };

  // ---------- 화면 ----------
  function show(id) {
    [el.sStart, el.sPlay, el.sEnd].forEach((s) => s.classList.toggle('on', s.id === id));
    if (id === 's-end') el.sEnd.scrollTop = 0;
    G.screen = id;
  }
  let toastT = 0;
  function toast(msg, ms) {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.toast.classList.remove('show'), ms || 1900);
  }

  // ---------- HUD ----------
  function paintHearts() {
    let html = '';
    for (let i = 0; i < 3; i++) html += `<span class="h${i < G.hearts ? '' : ' gone'}">❤️</span>`;
    el.hearts.innerHTML = html;
    el.hearts.setAttribute('aria-label', '남은 하트 ' + G.hearts + '개');
  }
  function paintHud() {
    el.score.textContent = Math.floor(G.score).toLocaleString('ko-KR');
  }
  function paintTime() {
    const t = Math.max(0, Math.ceil(G.timeLeft));
    el.clock.textContent = t;
    el.clock.classList.toggle('low', G.timeLeft <= 7);
    el.timeBar.style.width = (G.timeLeft / TOTAL * 100).toFixed(1) + '%';
  }

  // ---------- 연출 ----------
  function popup(text, x, y, cls) {
    const d = document.createElement('div');
    d.className = 'pop ' + (cls || 'plus');
    d.textContent = text;
    d.style.left = x + '%';
    d.style.top = y + '%';
    el.popLayer.appendChild(d);
    setTimeout(() => d.remove(), 850);
  }
  let sayT = 0;
  function say(msg, ms) {
    el.sayText.textContent = msg;
    el.sugarSay.classList.add('show');
    clearTimeout(sayT);
    sayT = setTimeout(() => el.sugarSay.classList.remove('show'), ms || 1100);
  }
  let nagT = 0;
  function nag(msg) {
    el.nagText.textContent = msg;
    el.nagBubble.classList.add('show');
    clearTimeout(nagT);
    nagT = setTimeout(() => el.nagBubble.classList.remove('show'), 1500);
  }
  function shakeStage() {
    el.studio.classList.remove('shake');
    void el.studio.offsetWidth;
    el.studio.classList.add('shake');
    setTimeout(() => el.studio.classList.remove('shake'), 460);
  }
  function flash() {
    el.catchFlash.classList.remove('on');
    void el.catchFlash.offsetWidth;
    el.catchFlash.classList.add('on');
  }

  // ---------- 게임 상태 ----------
  function reset() {
    G.timeLeft = TOTAL; G.score = 0; G.hearts = 3; G.combo = 0; G.bestCombo = 0;
    G.holding = false; G.needRelease = false; G.sneaking = false;
    G.phase = 'safe'; G.phaseT = 0; G.safeDur = 1.5; G.warnDur = 0.8; G.lookDur = 1.1; G.isFake = false;
    G.lockT = 0; G.happy = 0; G.nagLog = {}; G.nagTotal = 0; G.anticsT = 0; G.anticsIdx = -1;
    G.tickT = 0; G.overPending = null; G.caughtCount = 0;
    el.sugarImg.src = SPR.good;
    el.sugar.className = 'actor sugar';
    el.teacher.className = 'actor teacher';
    el.teacherImg.src = SPR.tback;
    el.vignette.classList.remove('on');
    el.warnBanner.classList.remove('show');
    el.nagBubble.classList.remove('show');
    el.sugarSay.classList.remove('show');
    el.pad.className = 'pad';
    el.padTxt.innerHTML = '<b>화면을 꾹 누르고 있어요</b><span>쌤이 돌아보기 전에 손을 떼세요!</span>';
    el.padIcon.textContent = '👆';
    el.happyBar.style.width = '0%';
    el.combo.innerHTML = '콤보 <b>0</b>';
    el.combo.classList.remove('hot');
    paintHearts(); paintHud(); paintTime();
  }

  function setSafe() {
    G.phase = 'safe'; G.phaseT = 0;
    const p = 1 - G.timeLeft / TOTAL;              // 0 → 1 (후반으로 갈수록 짧아짐)
    G.safeDur = clamp(rand(1.35, 2.15) - p * 0.55, 0.75, 2.2);
    el.teacher.classList.remove('warn', 'glare');
    if (el.teacherImg.getAttribute('src').indexOf('teacher-back') === -1) el.teacherImg.src = SPR.tback;
    el.vignette.classList.remove('on');
    el.warnBanner.classList.remove('show');
  }

  function startWarn() {
    const p = 1 - G.timeLeft / TOTAL;
    G.phase = 'warn'; G.phaseT = 0;
    G.warnDur = clamp(rand(0.62, 0.92) - p * 0.18, 0.44, 0.95); // 전조 0.6~0.9초, 후반엔 더 짧게
    G.isFake = Math.random() < (0.10 + p * 0.30);                // 후반엔 '돌아볼 듯 말 듯' 페이크
    el.teacher.classList.add('warn');
    el.warnBanner.classList.add('show');
    el.warnBar.style.transform = 'scaleX(1)';
    sfx.warn();
  }

  function startLook() {
    G.phase = 'look'; G.phaseT = 0;
    G.lookDur = clamp(rand(0.95, 1.4) - (1 - G.timeLeft / TOTAL) * 0.15, 0.8, 1.4);
    el.teacher.classList.remove('warn');
    el.teacher.classList.add('glare');
    el.teacherImg.src = SPR.tglare;
    el.warnBanner.classList.remove('show');
    el.vignette.classList.add('on');
    sfx.look();
    if (G.holding) catchNow();
  }

  function startSneak() {
    if (G.sneaking) return;
    G.sneaking = true;
    G.holdT = 0;
    el.sugarImg.src = SPR.sneak;
    el.sugar.classList.remove('catch');
    el.sugar.classList.add('sneak');
    el.pad.classList.add('on', 'sneak');
    el.padTxt.innerHTML = '<b>몰래 딴짓 중… 🤫</b><span>⚠️ 경고가 뜨면 바로 손 떼기!</span>';
    el.padIcon.textContent = '🤫';
    if (!el.sugarSay.classList.contains('show')) sayAntic();
    sfx.sneak();
  }

  function stopSneak() {
    if (!G.sneaking) return;
    G.sneaking = false;
    el.sugar.classList.remove('sneak');
    el.pad.classList.remove('on', 'sneak');
    el.padTxt.innerHTML = '<b>화면을 꾹 누르고 있어요</b><span>쌤이 돌아보기 전에 손을 떼세요!</span>';
    if (el.padIcon) el.padIcon.textContent = '👆';
  }

  function sayAntic() {
    let i = Math.floor(Math.random() * ANTICS.length);
    if (i === G.anticsIdx) i = (i + 1) % ANTICS.length;
    G.anticsIdx = i;
    say(ANTICS[i], 1000);
  }

  function catchNow() {
    if (G.lockT > 0 || !G.playing) return;
    G.hearts = Math.max(0, G.hearts - 1);
    G.caughtCount++;
    G.combo = 0;
    G.sneaking = false;
    G.holding = false;
    G.needRelease = true;
    G.lockT = 1.15;
    const line = pick(NAGS);
    G.nagLog[line] = (G.nagLog[line] || 0) + 1;
    G.nagTotal++;
    nag(line);
    el.sugarImg.src = SPR.caught;
    el.sugar.className = 'actor sugar catch';
    el.pad.classList.remove('on', 'sneak');
    el.pad.className = 'pad';
    el.padTxt.innerHTML = '<b>들켰다!! 😱</b><span>손을 떼고 다시 시작해요</span>';
    el.padIcon.textContent = '😱';
    el.sugarSay.classList.remove('show');
    sfx.catch();
    flash(); shakeStage();
    popup('-1 ❤️', 30, 46, 'minus');
    paintHearts(); paintHud();
    if (G.hearts <= 0) G.overPending = 'caught';
  }

  function swapToGood() {
    el.sugarImg.src = SPR.good;
    el.sugar.className = 'actor sugar';
  }

  // ---------- 입력 ----------
  function onDown(e) {
    if (!G.playing) return;
    if (e && e.cancelable) e.preventDefault();
    ac();
    if (G.needRelease || G.lockT > 0) return;
    G.holding = true;
    if (G.phase === 'look') { catchNow(); return; }
    startSneak();
  }

  function onUp() {
    if (!G.playing) return;
    const wasSneaking = G.sneaking;
    G.holding = false;
    G.needRelease = false;
    el.pad.classList.remove('on');
    if (!wasSneaking) { el.sugar.classList.remove('sneak'); return; }
    stopSneak();
    swapToGood();
    if (G.lockT > 0) return;

    // 시치미 성공 보너스
    let bonus = 50;
    let msg = '완벽한 시치미! ✨';
    if (G.phase === 'warn') {
      const left = clamp(1 - G.phaseT / G.warnDur, 0, 1);
      if (left <= 0.3) { bonus = 150; msg = '스릴 보너스 +150점! 😳'; }
      else bonus = Math.round(50 + (1 - left) * 110);
    }
    G.score += bonus;
    G.combo++;
    if (G.combo > G.bestCombo) G.bestCombo = G.combo;
    popup('+' + bonus, 26, 40, 'plus');
    say(msg, 1000);
    sfx.dodge();
    paintHud();
    if (G.combo >= 3) {
      el.combo.classList.add('hot');
      el.combo.innerHTML = '콤보 <b>' + G.combo + '</b>';
    }
  }

  // ---------- 루프 ----------
  function update(dt) {
    G.timeLeft -= dt;
    paintTime();
    if (G.timeLeft <= 0) { G.timeLeft = 0; paintTime(); endGame('clear'); return; }

    if (G.lockT > 0) {
      G.lockT -= dt;
      if (G.lockT <= 0) {
        G.lockT = 0;
        if (G.overPending) { endGame(G.overPending); return; }
        setSafe();
        swapToGood();
        if (G.holding) startSneak();     // 계속 누르고 있었으면 다시 딴짓
      }
      paintHud();
      return;
    }

    G.phaseT += dt;
    if (G.phase === 'safe') {
      if (G.phaseT >= G.safeDur) startWarn();
    } else if (G.phase === 'warn') {
      const k = clamp(1 - G.phaseT / G.warnDur, 0, 1);
      el.warnBar.style.transform = 'scaleX(' + k.toFixed(3) + ')';
      if (G.phaseT >= G.warnDur) {
        if (G.isFake) { setSafe(); popup('…? 👀', 72, 20, 'plus'); }   // 돌아볼 듯 말 듯
        else startLook();
      }
    } else if (G.phase === 'look') {
      if (G.holding) catchNow();
      else if (G.phaseT >= G.lookDur) setSafe();
    }

    if (G.sneaking && G.phase !== 'look') {
      const mult = 1 + Math.min(G.combo, 10) * 0.1;
      G.score += 62 * mult * dt;
      G.happy += 26 * dt;
      G.anticsT += dt;
      G.tickT += dt;
      if (G.tickT >= 0.16) { G.tickT = 0; sfx.tick(G.combo); }
      if (G.anticsT >= 1.25) { G.anticsT = 0; sayAntic(); }
      if (G.happy >= 100) {
        G.happy = 0;
        G.score += 120;
        popup('행복 게이지 MAX +120 💗', 18, 56, 'plus');
        sfx.bonus();
      }
      el.happyBar.style.width = clamp(G.happy, 0, 100).toFixed(0) + '%';
    }
    paintHud();
    if (G.combo > 0) el.combo.innerHTML = '콤보 <b>' + G.combo + '</b>';
    else el.combo.innerHTML = '콤보 <b>0</b>';
  }

  function loop(ts) {
    if (!G.playing) return;
    if (!G.last) G.last = ts;
    let dt = (ts - G.last) / 1000;
    G.last = ts;
    if (dt > 0.1) dt = 0.1;
    update(dt);
    if (G.playing) G.raf = requestAnimationFrame(loop);
  }

  function startGame() {
    reset();
    show('s-play');
    G.playing = true;
    G.last = 0;
    setSafe();
    ac();
    cancelAnimationFrame(G.raf);
    G.raf = requestAnimationFrame(loop);
  }

  // ---------- 결과 ----------
  function rankFor(score) {
    for (const r of RANKS) if (score >= r.min) return r;
    return RANKS[RANKS.length - 1];
  }

  function endGame(reason) {
    if (!G.playing && G.screen === 's-end') return;
    G.playing = false;
    G.holding = false; G.sneaking = false;
    cancelAnimationFrame(G.raf);
    el.vignette.classList.remove('on');
    el.warnBanner.classList.remove('show');
    sfx.over();

    const rank = rankFor(G.score);
    G.lastRank = rank;
    G.lastReason = reason;
    el.endTitle.textContent = reason === 'clear' ? '30초 생존 완료! 🎉' : '발레쌤한테 찍혔어요 😱';
    el.rankBadge.textContent = rank.icon;
    el.rankTitle.textContent = rank.title;
    el.rankSub.textContent = rank.sub;
    el.endScore.textContent = Math.floor(G.score).toLocaleString('ko-KR');
    el.endCombo.textContent = G.bestCombo;
    el.endHearts.textContent = G.hearts;
    el.nagCount.textContent = G.nagTotal;

    const rows = Object.entries(G.nagLog).sort((a, b) => b[1] - a[1]);
    if (!rows.length) {
      el.nagList.innerHTML = '<li class="none">오늘은 잔소리 한 번도 안 들었어요! 완벽한 시치미 👏</li>';
    } else {
      el.nagList.innerHTML = rows
        .map((r, i) => `<li><i>${i + 1}</i><span>“${r[0]}”</span><b>×${r[1]}</b></li>`)
        .join('');
    }
    G.lastNags = rows.slice(0, 4);
    el.endTip.textContent = G.caughtCount === 0
      ? '완벽해요. 이대로만 하면 쌤은 영원히 못 잡아요!'
      : (G.bestCombo >= 5
        ? '콤보가 잘 붙었어요. 경고가 뜨는 순간 바로 손을 떼면 더 올라가요.'
        : '손 떼는 타이밍이 전부예요. 경고 배너가 뜨면 0.5초 안에 떼면 세이프!');
    el.endFoot.textContent = '인스타 스토리에 올리면 딱 좋아요 (1080×1920)';
    show('s-end');
  }

  // ---------- 결과 이미지 ----------
  const imgCache = {};
  function loadImg(src) {
    if (imgCache[src]) return Promise.resolve(imgCache[src]);
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => { imgCache[src] = im; res(im); };
      im.onerror = rej;
      im.src = src;
    });
  }

  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  async function drawResult() {
    const c = el.rcv;
    const W = c.width, H = c.height;
    const ctx = c.getContext('2d');
    const rank = G.lastRank || rankFor(G.score);

    const bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
    bg.addColorStop(0, '#fffafd');
    bg.addColorStop(0.32, '#ffe4f1');
    bg.addColorStop(0.72, '#f7dcec');
    bg.addColorStop(1, '#ecdaf6');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 배경 장식 (텍스트를 피해서)
    ctx.fillStyle = 'rgba(255,255,255,.42)';
    [[70, 150, 34], [1010, 200, 40], [1010, 700, 26], [60, 760, 22], [540, 60, 26]].forEach(([x, y, r]) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#b17a9c';
    ctx.font = '700 26px Pretendard, "Apple SD Gothic Neo", sans-serif';
    ctx.fillText('MAGIC SUGAR BALLET', W / 2, 118);
    ctx.fillStyle = '#8e3f75';
    ctx.font = '900 64px Pretendard, "Apple SD Gothic Neo", sans-serif';
    ctx.fillText('발레쌤 눈 피하기', W / 2, 198);

    // 연습실 패널 (거울 + 바 + 바닥)
    const px = 56, py = 226, pw = W - 112, ph = 640;
    ctx.save();
    rr(ctx, px, py, pw, ph, 44);
    const panel = ctx.createLinearGradient(0, py, 0, py + ph);
    panel.addColorStop(0, 'rgba(255,255,255,.80)');
    panel.addColorStop(0.55, 'rgba(250,235,247,.72)');
    panel.addColorStop(0.63, 'rgba(255,236,222,.66)');
    panel.addColorStop(1, 'rgba(245,214,190,.62)');
    ctx.fillStyle = panel;
    ctx.fill();
    ctx.clip();
    // 바닥 경계
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(px, py + ph * 0.63, pw, 3);
    // 발레바
    ctx.strokeStyle = '#e0a978';
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(px + 20, py + ph * 0.60); ctx.lineTo(px + pw - 20, py + ph * 0.60); ctx.stroke();
    ctx.lineWidth = 6;
    [0.18, 0.82].forEach((k) => {
      ctx.beginPath(); ctx.moveTo(px + pw * k, py + ph * 0.60); ctx.lineTo(px + pw * k, py + ph * 0.99); ctx.stroke();
    });
    ctx.restore();
    rr(ctx, px, py, pw, ph, 44);
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 5;
    ctx.stroke();

    // 캐릭터
    try {
      const [tImg, sImg] = await Promise.all([loadImg(SPR.tglare), loadImg(G.hearts > 0 ? SPR.sneak : SPR.caught)]);
      const th = 430, tw = th * tImg.width / tImg.height;
      ctx.drawImage(tImg, px + pw - tw - 34, py + ph - th - 4, tw, th);
      const sh = 540, sw = sh * sImg.width / sImg.height;
      ctx.drawImage(sImg, px + 26, py + ph - sh + 6, sw, sh);
    } catch (e) { /* 이미지가 없어도 나머지는 그린다 */ }

    // 반짝이
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    [[300, 300, 13], [800, 330, 15], [520, 262, 9], [205, 700, 10]].forEach(([x, y, sz]) => {
      ctx.beginPath();
      ctx.moveTo(x, y - sz); ctx.lineTo(x + sz * 0.28, y - sz * 0.28); ctx.lineTo(x + sz, y);
      ctx.lineTo(x + sz * 0.28, y + sz * 0.28); ctx.lineTo(x, y + sz); ctx.lineTo(x - sz * 0.28, y + sz * 0.28);
      ctx.lineTo(x - sz, y); ctx.lineTo(x - sz * 0.28, y - sz * 0.28); ctx.closePath(); ctx.fill();
    });

    // 등급 카드
    const cardX = 80, cardY = 906, cardW = W - 160, cardH = 258;
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    rr(ctx, cardX, cardY, cardW, cardH, 40); ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9a0b9';
    ctx.font = '800 24px Pretendard, sans-serif';
    ctx.fillText('너의 등급', W / 2, cardY + 46);
    ctx.fillStyle = '#e0538f';
    ctx.font = '900 48px Pretendard, "Apple SD Gothic Neo", sans-serif';
    ctx.fillText(rank.title, W / 2, cardY + 112);
    ctx.fillStyle = '#8a6b85';
    ctx.font = '600 26px Pretendard, sans-serif';
    ctx.fillText(rank.sub, W / 2, cardY + 158);
    ctx.fillStyle = '#8e3f75';
    ctx.font = '900 62px Pretendard, sans-serif';
    ctx.fillText(Math.floor(G.score).toLocaleString('ko-KR') + '점', W / 2, cardY + 230);

    // 스탯
    const stats = [['최고 콤보', G.bestCombo + '회'], ['남은 하트', G.hearts + ' / 3'], ['들킨 횟수', G.caughtCount + '회']];
    const colW = (W - 160) / 3;
    stats.forEach((s, i) => {
      const x = 80 + i * colW;
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      rr(ctx, x + 7, 1196, colW - 16, 148, 26); ctx.fill();
      ctx.fillStyle = '#b08ca4'; ctx.font = '700 22px Pretendard, sans-serif';
      ctx.fillText(s[0], x + colW / 2 - 1, 1238);
      ctx.fillStyle = '#8e3f75'; ctx.font = '900 34px Pretendard, sans-serif';
      ctx.fillText(s[1], x + colW / 2 - 1, 1288);
    });

    // 잔소리
    ctx.textAlign = 'left';
    ctx.fillStyle = '#a06a8d';
    ctx.font = '900 30px Pretendard, sans-serif';
    ctx.fillText('오늘 들은 잔소리', 100, 1432);
    const lines = (G.lastNags && G.lastNags.length) ? G.lastNags.slice(0, 4) : [];
    if (!lines.length) {
      ctx.fillStyle = '#a98ba0';
      ctx.font = '700 28px Pretendard, "Apple SD Gothic Neo", sans-serif';
      ctx.fillText('잔소리 없이 완벽한 시치미! 👏', 100, 1490);
    } else {
      ctx.fillStyle = '#8a5f7c';
      ctx.font = '700 28px Pretendard, "Apple SD Gothic Neo", sans-serif';
      lines.forEach((l, i) => {
        ctx.fillStyle = '#8a5f7c';
        ctx.fillText('“' + l[0] + '”', 118, 1488 + i * 54);
        ctx.fillStyle = '#d1346f';
        ctx.textAlign = 'right';
        ctx.fillText('×' + l[1], W - 118, 1488 + i * 54);
        ctx.textAlign = 'left';
      });
    }

    // 푸터
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(142,63,117,.5)';
    ctx.font = '700 23px Pretendard, sans-serif';
    ctx.fillText('sheeny6-cmyk.github.io/magic-sugar-game/teacher', W / 2, 1838);
    ctx.fillStyle = 'rgba(142,63,117,.78)';
    ctx.font = '800 26px Pretendard, sans-serif';
    ctx.fillText('마법 슈가 · ' + (G.lastReason === 'clear' ? '30초 생존' : '오늘도 들켰다'), W / 2, 1882);
  }

  async function saveResult() {
    try {
      await drawResult();
      const blob = await new Promise((res) => el.rcv.toBlob(res, 'image/png'));
      if (!blob) throw new Error('no blob');
      const d = new Date();
      const name = 'sugar-teacher-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '.png';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      toast('결과 이미지를 저장했어요 📸', 2200);
      el.endFoot.textContent = '저장 완료 · 인스타 스토리에 올려 보세요!';
    } catch (e) {
      toast('이미지를 저장하지 못했어요 😢', 2200);
    }
  }

  // ---------- 사운드 토글 ----------
  function toggleSound() {
    G.sound = !G.sound;
    el.soundBtns.forEach((b) => { if (b) { b.textContent = G.sound ? '🔔' : '🔕'; b.classList.toggle('muted', !G.sound); } });
    if (G.sound) sfx.bonus();
    toast(G.sound ? '소리 켜짐 🔔' : '소리 꺼짐 🔕', 1200);
  }

  // ---------- 이벤트 ----------
  el.startBtn.addEventListener('click', startGame);
  el.againBtn.addEventListener('click', startGame);
  el.homeBtn.addEventListener('click', () => { G.playing = false; cancelAnimationFrame(G.raf); show('s-start'); });
  el.saveBtn.addEventListener('click', saveResult);
  el.soundBtns.forEach((b) => { if (b) b.addEventListener('click', (e) => { e.stopPropagation(); toggleSound(); }); });

  const play = el.sPlay;
  play.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.icon-btn')) return;
    onDown(e);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) =>
    window.addEventListener(ev, (e) => { if (ev !== 'pointerleave' || G.holding) onUp(e); }, { passive: false }));
  play.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('blur', () => { if (G.holding) onUp(); });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && G.playing && !e.repeat) { e.preventDefault(); onDown(); }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && G.playing) { e.preventDefault(); onUp(); }
  });
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  // 미리 로딩
  [SPR.sneak, SPR.caught, SPR.tglare].forEach((s) => loadImg(s).catch(() => {}));
  paintHearts();
  window.__saveResult = saveResult; // 검증용
})();
