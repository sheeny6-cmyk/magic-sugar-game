/* ===== 3/4 왈츠 리듬 스테이지 · 게임 엔진 =====
   모든 화면·판정·동작은 (AudioContext.currentTime - 곡 시작 시각) 하나의 시계에서만 계산한다.
   노트 위치, 판정, 슈가의 예비-도약-착지, 박자 표시, 스포트라이트가 같은 시간을 읽으므로
   음악과 화면이 구조적으로 어긋날 수 없다. */
(function () {
  'use strict';

  var M = window.WaltzMusic;
  var BEAT = M.BEAT;                 // 0.625초
  var LEAD = M.LEAD;                 // 카운트인 3박
  var bt = function (beat) { return (LEAD + beat) * BEAT; };
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 차트: 박 단위 ---------- */
  var CHART = [
    /* 도입 — 1마디 이상 벌려 두 동작만 익힌다 */
    { b: 6, t: 'cat' }, { b: 12, t: 'jump' },
    /* 전개 — 강박 도약 + 약박 스텝, 균형대 통과 */
    { b: 18, t: 'jump' }, { b: 20, t: 'cat' },
    { b: 24, t: 'jump' }, { b: 26, t: 'cat' },
    { b: 30, t: 'beam' }, { b: 32, t: 'beam' }, { b: 33, t: 'beam' },
    { b: 36, t: 'jump' }, { b: 38, t: 'cat' },
    { b: 42, t: 'jump' }, { b: 44, t: 'cat' },
    { b: 45, t: 'turn' },
    /* 절정 — 연속 피루엣, 이어지는 안무 프레이즈 */
    { b: 48, t: 'turn', turns: 1 }, { b: 50, t: 'cat' },
    { b: 51, t: 'turn', turns: 1 }, { b: 53, t: 'cat' },
    { b: 54, t: 'turn', turns: 2 }, { b: 56, t: 'beam' },
    { b: 57, t: 'turn', turns: 2 },
    { b: 60, t: 'cat' }, { b: 61, t: 'jump' }, { b: 62, t: 'beam' }, { b: 63, t: 'turn', turns: 2 },
    { b: 66, t: 'jump' }, { b: 68, t: 'cat' },
    { b: 69, t: 'turn', turns: 1 }, { b: 71, t: 'beam' },
    { b: 72, t: 'jump' }, { b: 74, t: 'cat' }, { b: 75, t: 'turn', turns: 2 },
    { b: 78, t: 'turn', turns: 2 }, { b: 80, t: 'cat' }
  ];

  var SECTIONS = [
    { id: 'intro', from: 0, to: 18, tag: '도입 · 세 박을 세어요' },
    { id: 'build', from: 18, to: 48, tag: '전개 · 왈츠의 물결' },
    { id: 'peak', from: 48, to: 84, tag: '절정 · 피루엣의 빛' }
  ];
  var PEAK_BEAT = 48;
  var END = bt(M.END_BEAT);          // 54.375초

  var NAMES = { cat: '파드샤', jump: '그랑제떼', beam: '아라베스크', turn: '피루엣' };
  var SUBS = { cat: '고양이', jump: '허들', beam: '균형대', turn: '회전' };
  var LINES = {
    cat: '고양이 머리 위로 — 사뿐히 뛰어넘어요',
    jump: '허들을 크게 — 대각선으로 날아올라요',
    beam: '균형대 위를 — 한 다리로 미끄러져요',
    turn: '스포트라이트 안에서 — 빙글 돌아요'
  };
  var COLORS = { cat: '#f2a7bd', jump: '#f0b489', beam: '#8fceb6', turn: '#b39ce0' };

  /* ---------- 이미지 ---------- */
  /* 지금 내 옷장에서 고른 의상으로 춘다. 전용 그림이 없는 동작·의상은
     assets/town.js의 안전 대체 규칙을 그대로 따라 404 없이 기존 동작으로 보여 준다. */
  function wornOutfit() {
    var T = window.SugarTown;
    try {
      if (T && T.get && T.get().worn) return T.get().worn;
      var raw = localStorage.getItem('sugartown.v1');
      if (raw) { var s = JSON.parse(raw); if (s && s.worn) return s.worn; }
    } catch (e) { /* 저장된 왕국이 없으면 기본 의상 */ }
    return 'basic';
  }
  var WORN = wornOutfit();
  var POSE_KEYS = ['ready', 'plie', 'releve', 'arabesque', 'tendu', 'curtsy', 'pasdechat', 'grandjete', 'pirouette'];
  var LILAC_SRC = {
    ready: '../assets/dancers/lilac-ready.webp',
    plie: '../assets/dancers/lilac-plie.webp',
    releve: '../assets/dancers/lilac-releve.webp',
    arabesque: '../assets/dancers/lilac-arabesque.webp',
    tendu: '../assets/dancers/lilac-tendu.webp',
    curtsy: '../assets/dancers/lilac-curtsy.webp',
    pasdechat: 'assets/lilac-pasdechat.webp',
    grandjete: 'assets/lilac-grandjete.webp',
    pirouette: 'assets/lilac-pirouette.webp'
  };
  var POSE_SRC = {};
  POSE_KEYS.forEach(function (k) {
    var src = null;
    try { if (window.SugarTown) src = window.SugarTown.dancerArt(WORN, k); } catch (e) { src = null; }
    POSE_SRC[k] = src || LILAC_SRC[k];
  });
  /* 지금 어떤 옷으로 추는지 첫 화면에서 바로 알 수 있게 한다. */
  var clothNameEl = document.getElementById('clothName');
  if (clothNameEl) {
    var name = '';
    try { if (window.SugarTown) name = window.SugarTown.dressOf(WORN).name; } catch (e) { name = ''; }
    if (name) clothNameEl.textContent = name;
  }
  /* 포즈마다 그림 틀의 비율이 다르다 (기본 381/500 = 기존 도트 규격) */
  var POSE_FRAME = {
    grandjete: { ar: 640 / 500, hs: 0.85 }
  };
  var IMG = {};
  var spiritImg = new Image(); spiritImg.src = '../../kingdom/assets/av_etu.webp';

  /* ---------- DOM ---------- */
  var canvas = $('stage'), ctx2d = canvas.getContext('2d');
  var judgeEl = $('judge'), comboEl = $('combo'), sectionTag = $('sectionTag');
  var cueName = $('cueName'), cueDetail = $('cueDetail'), cueDot = $('cueDot');
  var beatBars = $('beatBars').children;
  var pad = $('pad'), cover = $('cover'), result = $('result'), tapHint = $('tapHint');
  var moves = {};
  Array.prototype.forEach.call(pad.querySelectorAll('[data-move]'), function (b) { moves[b.dataset.move] = b; });

  /* ---------- 상태 ---------- */
  var W = 390, H = 560, dpr = 1, SPEED = 132, judgeX = 120, groundY = 430, DANCER_H = 240;
  var ctx = null, master = null, band = null, t0 = null, fallback0 = 0, raf = 0;
  var soundOn = true;
  var mode = 'cover';
  var notes = [], parts = [];
  var stats = { perfect: 0, good: 0, miss: 0, combo: 0, maxCombo: 0 };
  var byType = {};
  var lastJudge = 0, nextIdx = -1, lastBeat = -99, lastHint = '', lastSpinSpark = -1;
  var audioWarned = false;

  function clamp01(p) { return p < 0 ? 0 : p > 1 ? 1 : p; }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  function easeIn(p) { return p * p; }

  /* ---------- 시계 ---------- */
  function clock() {
    if (ctx && t0 != null) return ctx.currentTime - t0;
    if (!ctx) return (performance.now() - fallback0) / 1000 - LEAD * BEAT;
    return -99;
  }

  /* ---------- 크기 ---------- */
  function resize() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(240, Math.round(r.width));
    H = Math.max(240, Math.round(r.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    SPEED = W * 0.34;
    judgeX = W * 0.30;
    groundY = H * 0.845;
    DANCER_H = Math.min(H * 0.52, W * 0.64);
    if (mode !== 'play') render(mode === 'cover' ? -1.2 : clock());
  }

  /* ---------- 노트 ---------- */
  function resetNotes() {
    notes = CHART.map(function (c) {
      return { type: c.t, turns: c.turns || 1, beat: c.b, t: bt(c.b), judged: false, verdict: null, crossed: false };
    });
    stats = { perfect: 0, good: 0, miss: 0, combo: 0, maxCombo: 0 };
    byType = { cat: { p: 0, g: 0, m: 0 }, jump: { p: 0, g: 0, m: 0 }, beam: { p: 0, g: 0, m: 0 }, turn: { p: 0, g: 0, m: 0 } };
    parts = [];
    nextIdx = -1;
    lastBeat = -99;
  }

  /* ---------- 오디오 ---------- */
  function ensureAudio() {
    if (!ctx) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = soundOn ? 0.85 : 0;
        master.connect(ctx.destination);
        band = M.create(ctx, master);
      } catch (e) { ctx = null; return false; }
    }
    return true;
  }
  function setSound() {
    if (master) master.gain.value = soundOn ? 0.85 : 0;
    var b = $('sndBtn');
    b.textContent = soundOn ? '♫' : '♪̸';
    b.setAttribute('aria-label', soundOn ? '음악 끄기' : '음악 켜기');
    b.setAttribute('aria-pressed', String(soundOn));
  }

  /* ---------- 시작 ---------- */
  function startRun() {
    resetNotes();
    mode = 'play';
    cover.hidden = true;
    result.hidden = true;
    document.body.classList.remove('resulting');
    tapHint.textContent = '';
    lastHint = '';
    setCue('왈츠의 세 박', '강 · 약 · 약 — 첫 박에 크게 뛰어요');
    if (ensureAudio() && ctx.state !== 'running') {
      var pending = ctx.resume();
      if (pending && pending.then) pending.then(function () { go(); }, function () { go(); });
      else go();
    } else {
      go();
    }
  }
  function go() {
    if (mode !== 'play') return;
    if (band && ctx) {
      t0 = band.start(0.3);
    } else {
      t0 = null;
      fallback0 = performance.now();
      if (!audioWarned) { audioWarned = true; tapHint.textContent = '이 브라우저에서는 음악 없이 박자만으로 진행해요'; }
    }
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  /* ---------- 판정 ---------- */
  var WIN = { perfect: 0.115, good: 0.245 };

  function judgeNote(n, verdict, t) {
    n.judged = true;
    n.verdict = verdict;
    var rec = byType[n.type];
    if (verdict === 'miss') {
      stats.miss++; stats.combo = 0; rec.m++;
      M.thud(ctx, master);
      flash('MISS', 'miss');
      setCue(NAMES[n.type] + ' 놓쳤어요', '다음 박에 다시 — ' + LINES[n.type]);
    } else {
      stats[verdict]++;
      if (verdict === 'perfect') rec.p++; else rec.g++;
      stats.combo++;
      stats.maxCombo = Math.max(stats.maxCombo, stats.combo);
      M.chime(ctx, master, verdict === 'perfect' ? [86, 90] : [81, 86], 0, verdict === 'perfect' ? 0.085 : 0.06);
      flash(verdict === 'perfect' ? 'PERFECT' : 'GOOD', verdict);
      setCue(NAMES[n.type] + ' 성공!', LINES[n.type]);
      hitSpark(n);
      n.hitAt = t;
    }
    updateCombo();
  }

  function press(type) {
    if (mode !== 'play') return;
    var t = clock();
    if (t < -0.4) return;
    var best = null, bestD = 1e9;
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      if (n.judged) continue;
      var d = Math.abs(n.t - t);
      if (d <= WIN.good && d < bestD) { bestD = d; best = n; }
    }
    if (!best) return;
    if (best.type !== type) judgeNote(best, 'miss', t);
    else judgeNote(best, bestD <= WIN.perfect ? 'perfect' : 'good', t);
  }

  function autoMiss(t) {
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      if (!n.judged && t > n.t + WIN.good) judgeNote(n, 'miss', t);
    }
  }

  function flash(text, kind) {
    judgeEl.textContent = text;
    judgeEl.className = 'judge';
    void judgeEl.offsetWidth;
    judgeEl.className = 'judge show ' + kind;
    lastJudge = performance.now();
  }
  function updateCombo() {
    comboEl.innerHTML = '<b>' + stats.combo + '</b>COMBO';
    comboEl.classList.toggle('on', stats.combo >= 3);
  }
  function setCue(name, detail) {
    cueName.textContent = name;
    cueDetail.textContent = detail;
  }

  /* ---------- 파티클 ---------- */
  function push(x, y, n, color, opt) {
    opt = opt || {};
    var t = clock();
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = (opt.spread || 70) * (0.35 + Math.random() * 0.8);
      parts.push({
        x: x, y: y, born: t,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opt.up || 30),
        g: opt.g == null ? 240 : opt.g,
        life: (opt.life || 0.62) * (0.7 + Math.random() * 0.6),
        c: color, r: opt.r || 2.6, ring: !!opt.ring
      });
    }
    if (parts.length > 260) parts.splice(0, parts.length - 260);
  }
  function hitSpark(n) {
    var y = groundY - 30;
    push(judgeX, y, n.verdict === 'perfect' ? 16 : 9, n.verdict === 'perfect' ? '#ffe9ad' : '#d6f2e6', { spread: 110, up: 40, life: 0.7, r: 2.6 });
    if (n.verdict === 'perfect') push(judgeX, y, 1, '#fff6d8', { ring: true, life: 0.45, spread: 0, g: 0 });
  }

  /* ---------- 슈가의 동작 (시계 기반) ---------- */
  function idlePose(t) {
    var amp = 1.5;
    return { pose: 'ready', dx: 0, dy: Math.sin(t * 1.7) * amp, rot: Math.sin(t * 0.9) * 0.7, sx: 1, sy: 1, alpha: 1 };
  }

  function catPose(dt) {
    if (dt < -0.46 || dt > 0.82) return null;
    if (dt < -0.18) {
      var p = clamp01((dt + 0.46) / 0.28);
      return { pose: 'plie', dx: -2 * easeOut(p), dy: 7 * easeOut(p), rot: 0, sx: 1, sy: 1, alpha: 1 };
    }
    if (dt < 0.36) {
      var q = clamp01((dt + 0.18) / 0.54);
      return {
        pose: q > 0.9 ? 'plie' : 'pasdechat',
        dx: -6 + 16 * q, dy: -62 * 4 * q * (1 - q),
        rot: -7 * Math.sin(q * Math.PI), sx: 1, sy: 1, alpha: 1, trail: 3
      };
    }
    if (dt < 0.56) return { pose: 'plie', dx: 8 * (1 - clamp01((dt - 0.36) / 0.2)), dy: 7 * (1 - clamp01((dt - 0.36) / 0.2)), rot: 0, sx: 1, sy: 1, alpha: 1 };
    return { pose: 'ready', dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, alpha: 1 };
  }

  function jumpPose(dt) {
    if (dt < -0.52 || dt > 0.95) return null;
    if (dt < -0.16) {
      var p = clamp01((dt + 0.52) / 0.36);
      return { pose: 'plie', dx: -3 * easeOut(p), dy: 11 * easeOut(p), rot: 2 * p, sx: 1, sy: 1 - 0.05 * p, alpha: 1 };
    }
    if (dt < 0.44) {
      var q = clamp01((dt + 0.16) / 0.6);
      return {
        pose: q > 0.92 ? 'plie' : 'grandjete',
        dx: 32 * Math.sin(Math.PI * q), dy: -108 * 4 * q * (1 - q),
        rot: -11 * Math.sin(q * Math.PI), sx: 1 + 0.06 * Math.sin(q * Math.PI), sy: 1, alpha: 1, trail: 4
      };
    }
    if (dt < 0.66) {
      var r = 1 - clamp01((dt - 0.44) / 0.22);
      return { pose: 'plie', dx: 8 * r, dy: 10 * r, rot: 0, sx: 1, sy: 1, alpha: 1 };
    }
    return { pose: 'ready', dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, alpha: 1 };
  }

  function beamPose(dt) {
    var top = -26;
    if (dt < -0.42 || dt > 1.02) return null;
    if (dt < -0.12) {
      var p = clamp01((dt + 0.42) / 0.3);
      return { pose: 'plie', dx: 0, dy: 6 * easeOut(p), rot: 0, sx: 1, sy: 1, alpha: 1 };
    }
    if (dt < 0.02) {
      var q = clamp01((dt + 0.12) / 0.14);
      return { pose: q > 0.55 ? 'arabesque' : 'releve', dx: 0, dy: 6 + (top - 6) * easeOut(q), rot: 0, sx: 1, sy: 1, alpha: 1 };
    }
    if (dt < 0.68) {
      return { pose: 'arabesque', dx: 0, dy: top + Math.sin(dt * 5.2) * 1.4, rot: 2.4 * Math.sin(dt * 4.4), sx: 1, sy: 1, alpha: 1, trail: 2 };
    }
    var r = 1 - clamp01((dt - 0.68) / 0.28);
    return { pose: 'releve', dx: 0, dy: top * r, rot: 0, sx: 1, sy: 1, alpha: 1 };
  }

  function turnPose(dt, turns) {
    if (dt < -0.38 || dt > 1.0) return null;
    if (dt < -0.1) {
      var p = clamp01((dt + 0.38) / 0.28);
      return { pose: 'plie', dx: 0, dy: 7 * easeOut(p), rot: 0, sx: 1, sy: 1, alpha: 1 };
    }
    if (dt < 0.04) {
      var q = clamp01((dt + 0.1) / 0.14);
      return { pose: 'pirouette', dx: 0, dy: 7 * (1 - easeOut(q)) - 1.5 * q, rot: 0, sx: 1, sy: 1, alpha: 1 };
    }
    if (dt < 0.62) {
      var s = clamp01((dt - 0.04) / 0.58);
      var ang = turns * Math.PI * 2 * s;
      var sx = Math.cos(ang);
      if (Math.abs(sx) < 0.42) sx = (sx < 0 ? -1 : 1) * 0.42;
      return { pose: 'pirouette', dx: 0, dy: -1.5, rot: Math.sin(ang * 2) * 1.8, sx: sx, sy: 1, alpha: 1, trail: 6, spin: ang };
    }
    if (dt < 0.8) {
      var r = 1 - clamp01((dt - 0.62) / 0.18);
      return { pose: 'plie', dx: 0, dy: 6 * r - 1.5 * r, rot: 0, sx: 1, sy: 1, alpha: 1 };
    }
    return { pose: 'ready', dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, alpha: 1 };
  }

  function poseFor(act, t) {
    if (!act) return null;
    var dt = t - act.t;
    if (act.type === 'miss') {
      if (dt < 0 || dt > 0.62) return null;
      var k = Math.exp(-dt * 5.2);
      return { pose: 'plie', dx: Math.sin(dt * 34) * 9 * k, dy: 4 * k, rot: Math.sin(dt * 30) * 7 * k, sx: 1, sy: 1, alpha: 1 };
    }
    if (act.type === 'cat') return catPose(dt);
    if (act.type === 'jump') return jumpPose(dt);
    if (act.type === 'beam') return beamPose(dt);
    return turnPose(dt, act.turns || 1);
  }

  /* 가장 최근의 동작(성공·실패)을 고른다 */
  function activeAction(t) {
    var best = null, i, n, dt;
    for (i = 0; i < notes.length; i++) {
      n = notes[i];
      dt = t - n.t;
      if (n.judged && n.verdict === 'miss') {
        if (dt >= 0 && dt <= 0.62 && (!best || n.t > best.t)) best = { type: 'miss', t: n.t };
      } else if (n.judged) {
        if (dt >= -0.5 && dt <= 1.05 && (!best || n.t > best.t)) best = { type: n.type, t: n.t, turns: n.turns };
      }
    }
    return best;
  }

  /* ---------- 그리기: 배경 ---------- */
  function skyFor(t) {
    var peak = clamp01((t - bt(PEAK_BEAT)) / 3.2);
    var g = ctx2d.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#e6dff5');
    g.addColorStop(0.42, '#f4ebf7');
    g.addColorStop(1, '#e4eee7');
    ctx2d.fillStyle = g;
    ctx2d.fillRect(0, 0, W, H);
    if (peak > 0) {
      var d = ctx2d.createLinearGradient(0, 0, 0, H);
      d.addColorStop(0, '#392e52');
      d.addColorStop(0.42, '#6a5379');
      d.addColorStop(1, '#b0949a');
      ctx2d.globalAlpha = peak;
      ctx2d.fillStyle = d;
      ctx2d.fillRect(0, 0, W, H);
      ctx2d.globalAlpha = 1;
    }
    return peak;
  }

  function drawMoonAndHills(t, peak) {
    var scroll = t * SPEED;
    ctx2d.globalAlpha = 1 - peak;
    /* 달 */
    var mx = W * 0.78, my = H * 0.13;
    var mg = ctx2d.createRadialGradient(mx, my, 4, mx, my, 46);
    mg.addColorStop(0, '#fffdf466');
    mg.addColorStop(0.55, '#fff8e633');
    mg.addColorStop(1, '#fff6dd00');
    ctx2d.fillStyle = mg;
    ctx2d.beginPath(); ctx2d.arc(mx, my, 46, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.fillStyle = '#fffdf1d9';
    ctx2d.beginPath(); ctx2d.arc(mx, my, 15, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.fillStyle = '#f2e7f4b3';
    ctx2d.beginPath(); ctx2d.arc(mx - 7, my - 4, 13, 0, Math.PI * 2); ctx2d.fill();

    /* 구름 */
    var cs2 = (scroll * 0.06) % (W * 2);
    ctx2d.fillStyle = '#ffffff55';
    [[W * 0.12, H * 0.30, 54], [W * 0.58, H * 0.21, 42], [W * 0.86, H * 0.35, 36]].forEach(function (c, i) {
      var cx2 = (c[0] - cs2 + W * 2) % (W * 2) - W * 0.4;
      ctx2d.beginPath();
      ctx2d.ellipse(cx2, c[1], c[2], c[2] * 0.22, 0, 0, Math.PI * 2);
      ctx2d.fill();
    });

    /* 언덕 두 겹 */
    var base = groundY + 8;
    drawHill(base + 6, H * 0.30, '#b9cfca', 0.10, scroll);
    drawHill(base + 18, H * 0.23, '#c6dad0', 0.18, scroll + 120);

    /* 성 */
    var cs = (scroll * 0.24) % (W + 460);
    var cx = W - 30 - cs;
    drawCastle(cx, groundY - 34, Math.min(0.82, W / 520), '#b9a4c8');
    ctx2d.globalAlpha = 1;
  }

  function drawHill(baseY, height, color, par, scroll) {
    var off = (scroll * par) % (W * 1.4);
    ctx2d.fillStyle = color;
    for (var k = -1; k < 3; k++) {
      var x0 = k * W * 1.25 - off;
      ctx2d.beginPath();
      ctx2d.moveTo(x0 - 40, baseY);
      ctx2d.bezierCurveTo(x0 + W * 0.18, baseY - height, x0 + W * 0.42, baseY - height * 0.55, x0 + W * 0.62, baseY);
      ctx2d.lineTo(x0 - 40, baseY);
      ctx2d.fill();
    }
  }

  function drawCastle(x, baseY, scale, color) {
    var s = scale;
    ctx2d.save();
    ctx2d.translate(x, baseY);
    ctx2d.scale(s, s);
    ctx2d.globalAlpha = 0.46;
    ctx2d.fillStyle = color;
    /* 성벽 */
    ctx2d.beginPath(); ctx2d.roundRect(-52, -62, 104, 62, 12); ctx2d.fill();
    /* 탑 둘 */
    [-46, 36].forEach(function (tx, i) {
      ctx2d.beginPath(); ctx2d.roundRect(tx, -96 + i * 10, 20, 96 - i * 10, 6); ctx2d.fill();
      ctx2d.beginPath();
      ctx2d.moveTo(tx - 5, -96 + i * 10);
      ctx2d.lineTo(tx + 10, -122 + i * 10);
      ctx2d.lineTo(tx + 25, -96 + i * 10);
      ctx2d.closePath(); ctx2d.fill();
    });
    /* 중앙 탑 */
    ctx2d.beginPath(); ctx2d.roundRect(-16, -108, 32, 108, 8); ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.moveTo(-22, -108); ctx2d.lineTo(0, -142); ctx2d.lineTo(22, -108);
    ctx2d.closePath(); ctx2d.fill();
    /* 문 */
    ctx2d.globalAlpha *= 0.8;
    ctx2d.fillStyle = '#8c7d9c';
    ctx2d.beginPath(); ctx2d.roundRect(-11, -34, 22, 34, 11); ctx2d.fill();
    ctx2d.restore();
  }

  function drawTheater(t, peak) {
    if (peak <= 0) return;
    ctx2d.save();
    ctx2d.globalAlpha = peak;
    /* 막 */
    var cw = W * 0.19;
    [0, 1].forEach(function (side) {
      var x = side ? W - cw : 0;
      var g = ctx2d.createLinearGradient(x, 0, x + cw, 0);
      if (side) { g.addColorStop(0, '#7d5d79'); g.addColorStop(1, '#5c435c'); }
      else { g.addColorStop(0, '#5c435c'); g.addColorStop(1, '#7d5d79'); }
      ctx2d.fillStyle = g;
      ctx2d.beginPath();
      if (side) {
        ctx2d.moveTo(x, 0); ctx2d.lineTo(W, 0); ctx2d.lineTo(W, H * 0.9);
        ctx2d.quadraticCurveTo(x + cw * 0.5, H * 0.72, x, H * 0.9);
      } else {
        ctx2d.moveTo(x + cw, 0); ctx2d.lineTo(0, 0); ctx2d.lineTo(0, H * 0.9);
        ctx2d.quadraticCurveTo(x + cw * 0.5, H * 0.72, x + cw, H * 0.9);
      }
      ctx2d.closePath(); ctx2d.fill();
      /* 주름 */
      ctx2d.strokeStyle = '#ffffff14';
      ctx2d.lineWidth = 2;
      for (var i = 1; i < 5; i++) {
        var lx = x + (cw / 5) * i;
        ctx2d.beginPath(); ctx2d.moveTo(lx, 0); ctx2d.lineTo(lx, H * 0.82); ctx2d.stroke();
      }
    });
    /* 스포트라이트 기둥 */
    var beamG = ctx2d.createLinearGradient(0, 0, 0, groundY);
    beamG.addColorStop(0, '#fff8dc55');
    beamG.addColorStop(1, '#fff8dc0a');
    ctx2d.fillStyle = beamG;
    ctx2d.beginPath();
    ctx2d.moveTo(judgeX - 26, 0);
    ctx2d.lineTo(judgeX + 26, 0);
    ctx2d.lineTo(judgeX + 92, groundY);
    ctx2d.lineTo(judgeX - 92, groundY);
    ctx2d.closePath(); ctx2d.fill();
    /* 상단 금장 */
    ctx2d.fillStyle = '#c9a46899';
    ctx2d.fillRect(0, 0, W, 5);
    ctx2d.restore();
  }

  function drawGround(t, peak) {
    var top = groundY;
    /* 마루 */
    var g = ctx2d.createLinearGradient(0, top, 0, H);
    if (peak > 0.4) { g.addColorStop(0, '#d9c3a8'); g.addColorStop(0.35, '#c9ad8f'); g.addColorStop(1, '#a98f77'); }
    else { g.addColorStop(0, '#dfe9d3'); g.addColorStop(0.3, '#c8d8c2'); g.addColorStop(1, '#aec5ad'); }
    ctx2d.fillStyle = g;
    ctx2d.fillRect(0, top, W, H - top);

    /* 원경 바닥 결 */
    var scroll = t * SPEED;
    ctx2d.save();
    ctx2d.beginPath(); ctx2d.rect(0, top, W, H - top); ctx2d.clip();
    ctx2d.strokeStyle = '#ffffff26';
    ctx2d.lineWidth = 1;
    var step = 46, off = (scroll * 0.55) % step;
    for (var x = -step; x < W + step; x += step) {
      var xx = x - off;
      ctx2d.beginPath(); ctx2d.moveTo(xx, top + 3); ctx2d.lineTo(xx - 26, H); ctx2d.stroke();
    }
    /* 길: 노트와 같은 속도로 흐르는 널판 */
    var py = top + 12, ph = Math.min(38, (H - top) * 0.30);
    ctx2d.fillStyle = peak > 0.4 ? '#e4cfaecc' : '#efe3c9d0';
    ctx2d.beginPath(); ctx2d.roundRect(-20, py, W + 40, ph, 8); ctx2d.fill();
    ctx2d.strokeStyle = peak > 0.4 ? '#b99a7655' : '#c7b29155';
    ctx2d.lineWidth = 2;
    var pOff = scroll % 56;
    for (var px = -60; px < W + 60; px += 56) {
      ctx2d.beginPath(); ctx2d.moveTo(px - pOff, py); ctx2d.lineTo(px - pOff, py + ph); ctx2d.stroke();
    }
    /* 강박마다 바닥이 살짝 밝아진다 */
    var b = t / BEAT;
    var idx = Math.floor(b);
    var frac = b - idx;
    var down = ((idx - LEAD) % 3 + 3) % 3 === 0 ? 1 : 0.42;
    var pulse = Math.exp(-frac * 5.5) * down;
    if (pulse > 0.02) {
      ctx2d.globalAlpha = pulse * 0.18;
      ctx2d.fillStyle = '#fff8e0';
      ctx2d.fillRect(0, top, W, H - top);
      ctx2d.globalAlpha = 1;
    }
    ctx2d.restore();

    /* 바닥 경계 */
    ctx2d.strokeStyle = '#ffffff88';
    ctx2d.lineWidth = 2;
    ctx2d.beginPath(); ctx2d.moveTo(0, top); ctx2d.lineTo(W, top); ctx2d.stroke();
  }

  /* ---------- 그리기: 링 · 스포트라이트 ---------- */
  function drawRing(t) {
    var b = t / BEAT, frac = b - Math.floor(b);
    var idx = Math.floor(b);
    var isDown = ((idx - LEAD) % 3 + 3) % 3 === 0;
    var pulse = Math.exp(-frac * 6) * (isDown ? 1 : 0.5);
    var rx = Math.min(84, W * 0.22), ry = rx * 0.26;

    /* 발끝 스포트라이트 */
    var lg = ctx2d.createRadialGradient(judgeX, groundY + 4, 2, judgeX, groundY + 4, rx * 1.15);
    lg.addColorStop(0, 'rgba(255,250,226,' + (0.30 + pulse * 0.22) + ')');
    lg.addColorStop(0.55, 'rgba(255,247,214,' + (0.10 + pulse * 0.10) + ')');
    lg.addColorStop(1, 'rgba(255,247,214,0)');
    ctx2d.save();
    ctx2d.translate(judgeX, groundY + 4);
    ctx2d.scale(1, 0.32);
    ctx2d.fillStyle = lg;
    ctx2d.beginPath(); ctx2d.arc(0, 0, rx * 1.15, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.restore();

    /* 판정 링 */
    ctx2d.save();
    ctx2d.translate(judgeX, groundY + 3);
    ctx2d.scale(1, 0.26);
    ctx2d.lineWidth = 2 + pulse * 1.6;
    ctx2d.strokeStyle = 'rgba(255,255,255,' + (0.5 + pulse * 0.4) + ')';
    ctx2d.beginPath(); ctx2d.arc(0, 0, rx, 0, Math.PI * 2); ctx2d.stroke();
    ctx2d.lineWidth = 1;
    ctx2d.strokeStyle = 'rgba(255,248,220,' + (0.35 + pulse * 0.3) + ')';
    ctx2d.beginPath(); ctx2d.arc(0, 0, rx * 1.34, 0, Math.PI * 2); ctx2d.stroke();
    ctx2d.restore();
  }

  /* ---------- 그리기: 장애물 ---------- */
  function drawCat(x, y, s, alpha) {
    ctx2d.save();
    ctx2d.translate(x, y);
    ctx2d.scale(s, s);
    ctx2d.globalAlpha = alpha;
    /* 그림자 */
    ctx2d.fillStyle = 'rgba(90,70,100,0.14)';
    ctx2d.beginPath(); ctx2d.ellipse(0, 2, 24, 6, 0, 0, Math.PI * 2); ctx2d.fill();
    /* 몸통 */
    ctx2d.fillStyle = '#a794bd';
    ctx2d.beginPath(); ctx2d.ellipse(0, -13, 18, 14, 0, 0, Math.PI * 2); ctx2d.fill();
    /* 꼬리 */
    ctx2d.strokeStyle = '#a794bd';
    ctx2d.lineWidth = 5; ctx2d.lineCap = 'round';
    ctx2d.beginPath();
    ctx2d.moveTo(15, -8);
    ctx2d.quadraticCurveTo(30, -12, 26, -30);
    ctx2d.stroke();
    /* 머리 */
    ctx2d.fillStyle = '#b5a3c7';
    ctx2d.beginPath(); ctx2d.arc(-1, -27, 12, 0, Math.PI * 2); ctx2d.fill();
    /* 귀 */
    ctx2d.fillStyle = '#b5a3c7';
    ctx2d.beginPath(); ctx2d.moveTo(-10, -34); ctx2d.lineTo(-7, -46); ctx2d.lineTo(-1, -37); ctx2d.closePath(); ctx2d.fill();
    ctx2d.beginPath(); ctx2d.moveTo(8, -34); ctx2d.lineTo(6, -46); ctx2d.lineTo(0, -37); ctx2d.closePath(); ctx2d.fill();
    ctx2d.fillStyle = '#e9b3c8';
    ctx2d.beginPath(); ctx2d.moveTo(-8, -35); ctx2d.lineTo(-6, -42); ctx2d.lineTo(-3, -36); ctx2d.closePath(); ctx2d.fill();
    ctx2d.beginPath(); ctx2d.moveTo(6, -35); ctx2d.lineTo(5, -42); ctx2d.lineTo(2, -36); ctx2d.closePath(); ctx2d.fill();
    /* 눈 */
    ctx2d.fillStyle = '#4a3b5b';
    ctx2d.beginPath(); ctx2d.arc(-5, -28, 1.7, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.beginPath(); ctx2d.arc(3, -28, 1.7, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.fillStyle = '#e8a9bf';
    ctx2d.beginPath(); ctx2d.arc(0, -23, 1.3, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.restore();
  }

  function drawHurdle(x, y, s, alpha) {
    ctx2d.save();
    ctx2d.translate(x, y);
    ctx2d.scale(s, s);
    ctx2d.globalAlpha = alpha;
    ctx2d.fillStyle = 'rgba(90,70,100,0.14)';
    ctx2d.beginPath(); ctx2d.ellipse(0, 2, 26, 6, 0, 0, Math.PI * 2); ctx2d.fill();
    /* 기둥 */
    ctx2d.fillStyle = '#a9846a';
    ctx2d.fillRect(-22, -46, 5, 46);
    ctx2d.fillRect(17, -46, 5, 46);
    /* 가로대 */
    ctx2d.fillStyle = '#f2ddbc';
    ctx2d.beginPath(); ctx2d.roundRect(-25, -46, 50, 8, 3); ctx2d.fill();
    ctx2d.beginPath(); ctx2d.roundRect(-25, -33, 50, 8, 3); ctx2d.fill();
    /* 줄무늬 */
    ctx2d.fillStyle = '#d9a789';
    for (var i = 0; i < 5; i++) {
      ctx2d.fillRect(-25 + i * 10, -46, 4, 8);
      ctx2d.fillRect(-21 + i * 10, -33, 4, 8);
    }
    ctx2d.restore();
  }

  function drawBeam(x, y, s, alpha) {
    ctx2d.save();
    ctx2d.translate(x, y);
    ctx2d.scale(s, s);
    ctx2d.globalAlpha = alpha;
    var half = 62;
    ctx2d.fillStyle = 'rgba(90,70,100,0.14)';
    ctx2d.beginPath(); ctx2d.ellipse(0, 2, half, 6, 0, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.strokeStyle = '#9c7b66';
    ctx2d.lineWidth = 5; ctx2d.lineCap = 'round';
    [-48, 0, 48].forEach(function (lx) {
      ctx2d.beginPath(); ctx2d.moveTo(lx, -34); ctx2d.lineTo(lx, 0); ctx2d.stroke();
    });
    ctx2d.fillStyle = '#c8a483';
    ctx2d.beginPath(); ctx2d.roundRect(-half, -40, half * 2, 9, 4); ctx2d.fill();
    ctx2d.fillStyle = '#e7cfb3';
    ctx2d.beginPath(); ctx2d.roundRect(-half, -40, half * 2, 3.5, 2); ctx2d.fill();
    ctx2d.restore();
  }

  function drawTurnZone(x, y, s, alpha, t, spin) {
    ctx2d.save();
    ctx2d.translate(x, y);
    ctx2d.scale(s, s);
    ctx2d.globalAlpha = alpha;
    var r = 44;
    /* 바닥 원 */
    ctx2d.save();
    ctx2d.scale(1, 0.34);
    var g = ctx2d.createRadialGradient(0, 0, 4, 0, 0, r);
    g.addColorStop(0, 'rgba(255,247,214,0.55)');
    g.addColorStop(0.7, 'rgba(214,178,240,0.24)');
    g.addColorStop(1, 'rgba(214,178,240,0)');
    ctx2d.fillStyle = g;
    ctx2d.beginPath(); ctx2d.arc(0, 0, r, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.strokeStyle = 'rgba(255,246,222,0.75)';
    ctx2d.lineWidth = 2.4;
    ctx2d.setLineDash([7, 9]);
    ctx2d.lineDashOffset = -(t * 26) % 64;
    ctx2d.beginPath(); ctx2d.arc(0, 0, r * 0.82, 0, Math.PI * 2); ctx2d.stroke();
    ctx2d.setLineDash([]);
    ctx2d.restore();
    /* 회전 표식 */
    ctx2d.save();
    ctx2d.translate(0, -52);
    ctx2d.rotate((spin || t * 1.6));
    ctx2d.strokeStyle = 'rgba(255,250,232,0.85)';
    ctx2d.lineWidth = 2.6; ctx2d.lineCap = 'round';
    ctx2d.beginPath(); ctx2d.arc(0, 0, 11, 0.5, Math.PI * 1.55); ctx2d.stroke();
    ctx2d.beginPath(); ctx2d.moveTo(-2, -12); ctx2d.lineTo(-9, -8); ctx2d.lineTo(-2, -4); ctx2d.stroke();
    ctx2d.restore();
    ctx2d.restore();
  }

  function objectScale() { return Math.min(1.15, Math.max(0.82, W / 390)); }

  function drawObjects(t) {
    var s = objectScale();
    var nextNote = null;
    for (var k = 0; k < notes.length; k++) {
      if (!notes[k].judged && notes[k].t > t - WIN.good) { nextNote = notes[k]; break; }
    }
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      var x = judgeX + (n.t - t) * SPEED;
      if (x < -180 || x > W + 200) continue;
      var alpha = 1;
      if (x > W + 60) alpha = Math.max(0, (W + 200 - x) / 140);
      /* 통과 후 살짝 흐려지되 사라지지 않는다 */
      if (n.crossed) alpha *= 0.82;
      var pass = clamp01((t - n.t + 0.1) / 0.22);
      var glow = n.judged ? (n.verdict === 'miss' ? '#ff9aa8' : '#fff4cf') : null;

      if (glow) {
        ctx2d.save();
        ctx2d.globalAlpha = (1 - pass) * 0.5;
        ctx2d.fillStyle = glow;
        ctx2d.beginPath(); ctx2d.ellipse(x, groundY - 22 * s, 46 * s, 20 * s, 0, 0, Math.PI * 2); ctx2d.fill();
        ctx2d.restore();
      }

      if (n.type === 'cat') drawCat(x, groundY, s, alpha);
      else if (n.type === 'jump') drawHurdle(x, groundY, s, alpha);
      else if (n.type === 'beam') drawBeam(x, groundY, s, alpha);
      else drawTurnZone(x, groundY, s, alpha, t, n.judged ? (t - n.t) * 9 : 0);

      /* 다음 동작 표식: 곧 닥는 장애물에만 작게 */
      if (n === nextNote && x < W + 40) {
        var bx = x, by = groundY - (n.type === 'cat' ? 58 : n.type === 'jump' ? 58 : n.type === 'beam' ? 56 : 86) * s;
        var pulseB = 0.72 + 0.2 * Math.sin(t * 7);
        ctx2d.save();
        ctx2d.globalAlpha = pulseB;
        ctx2d.fillStyle = 'rgba(255,253,246,0.92)';
        ctx2d.beginPath(); ctx2d.arc(bx, by, 9.5, 0, Math.PI * 2); ctx2d.fill();
        ctx2d.strokeStyle = COLORS[n.type];
        ctx2d.lineWidth = 1.6;
        ctx2d.stroke();
        ctx2d.fillStyle = '#5c4a6e';
        ctx2d.font = 'bold 10px system-ui, sans-serif';
        ctx2d.textAlign = 'center'; ctx2d.textBaseline = 'middle';
        ctx2d.fillText(n.type === 'cat' ? '🐈' : n.type === 'jump' ? '🦋' : n.type === 'beam' ? '≡' : '↻', bx, by + 0.5);
        ctx2d.restore();
      }

      /* 통과 순간의 반짝임 (장애물이 사라지는 대신 비켜 가는 표시) */
      if (n.judged && !n.crossed && t >= n.t - 0.02) {
        n.crossed = true;
        if (n.verdict !== 'miss') push(x, groundY - 18 * s, 7, '#fff6d8', { spread: 60, up: 20, life: 0.5, r: 2.2 });
      }
    }
  }

  /* ---------- 그리기: 슈가 ---------- */
  function drawPose(p, t, ghost) {
    var img = IMG[p.pose] || IMG.ready;
    if (!img || !img.complete) return;
    var fr = POSE_FRAME[p.pose];
    var h = DANCER_H * (fr && fr.hs ? fr.hs : 1), w = h * (fr && fr.ar ? fr.ar : (381 / 500));
    var x = judgeX + (p.dx || 0) + (ghost ? ghost.dx : 0);
    var y = groundY + (p.dy || 0) + (ghost ? ghost.dy : 0);
    ctx2d.save();
    ctx2d.globalAlpha = (p.alpha == null ? 1 : p.alpha) * (ghost ? ghost.alpha : 1);
    ctx2d.translate(x, y);
    if (p.rot) ctx2d.rotate(p.rot * Math.PI / 180);
    if (ghost && ghost.rot) ctx2d.rotate(ghost.rot * Math.PI / 180);
    ctx2d.scale((p.sx == null ? 1 : p.sx) * (ghost ? ghost.sx || 1 : 1), (p.sy == null ? 1 : p.sy));
    ctx2d.drawImage(img, -w / 2, -h, w, h);
    ctx2d.restore();
  }

  function drawDancer(t) {
    var act = activeAction(t);
    var p = act ? poseFor(act, t) : null;
    if (!p) p = idlePose(t);
    /* 마지막 마디: 르베랑스로 인사 */
    if (t > bt(83)) { p = { pose: 'curtsy', dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, alpha: 1 }; act = null; }
    var h = -(p.dy || 0);
    var shadowR = 40 * (1 - Math.min(0.72, h / 220));

    /* 그림자 */
    ctx2d.save();
    ctx2d.globalAlpha = 0.20 * (1 - Math.min(0.75, h / 240));
    ctx2d.fillStyle = '#4a3a5c';
    ctx2d.beginPath(); ctx2d.ellipse(judgeX + (p.dx || 0) * 0.5, groundY + 3, shadowR, shadowR * 0.24, 0, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.restore();

    /* 잔상: 같은 시계에서 몇 프레임 전의 자세를 옅게 겹친다 */
    if (p.trail && act) {
      for (var i = p.trail; i >= 1; i--) {
        var back = t - i * 0.032;
        var q = poseFor(act, back);
        if (!q) continue;
        var fan = p.spin != null ? Math.sin((p.spin - (q.spin == null ? p.spin : q.spin)) * 0.5) * 5 : 0;
        drawPose(q, t, { dx: -i * 3.2 + fan, dy: i * 0.6, alpha: 0.10 + 0.022 * i, rot: 0 });
      }
    }

    drawPose(p, t, null);

    /* 피루엣: 허리 높이 회전 궤적 + 발끝 빛 + 반짝임 */
    if (act && act.type === 'turn' && p.spin != null) {
      var waist = groundY + (p.dy || 0) - DANCER_H * 0.50;
      var baseR = DANCER_H * 0.22;
      for (var k = 0; k < 3; k++) {
        var a0 = p.spin * 1.15 + k * 2.0;
        ctx2d.save();
        ctx2d.strokeStyle = 'rgba(255,248,222,' + (0.34 - k * 0.08) + ')';
        ctx2d.lineWidth = 3.4 - k * 0.8;
        ctx2d.beginPath();
        ctx2d.ellipse(judgeX, waist, baseR * (1 + k * 0.28), baseR * 0.34 * (1 + k * 0.28), 0, a0, a0 + 1.75);
        ctx2d.stroke();
        ctx2d.restore();
      }
      ctx2d.save();
      ctx2d.translate(judgeX, groundY + (p.dy || 0) - 2);
      ctx2d.scale(1, 0.3);
      ctx2d.strokeStyle = 'rgba(255,248,214,' + (0.55 - 0.25 * Math.abs(Math.cos(p.spin))) + ')';
      ctx2d.lineWidth = 3;
      for (var q = 0; q < 3; q++) {
        ctx2d.beginPath();
        ctx2d.arc(0, 0, 46 + q * 15, p.spin + q * 1.1, p.spin + q * 1.1 + 1.5);
        ctx2d.stroke();
      }
      ctx2d.restore();
      var spinTick = Math.floor(t * 12);
      if (spinTick !== lastSpinSpark) {
        lastSpinSpark = spinTick;
        push(judgeX + (Math.random() - 0.5) * 74, waist + (Math.random() - 0.5) * 46, 1, '#fff6d8', { spread: 26, up: 14, life: 0.5, r: 1.7, g: 40 });
      }
    }
  }

  /* ---------- 그리기: 파티클 ---------- */
  function drawParts(t) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      var age = t - p.born;
      if (age < 0) continue;
      if (age > p.life) { parts.splice(i, 1); continue; }
      var k = age / p.life;
      var x = p.x + p.vx * age;
      var y = p.y + p.vy * age + 0.5 * p.g * age * age;
      ctx2d.save();
      if (p.ring) {
        ctx2d.globalAlpha = (1 - k) * 0.7;
        ctx2d.strokeStyle = p.c; ctx2d.lineWidth = 2.5;
        ctx2d.beginPath(); ctx2d.arc(p.x, p.y, 8 + k * 46, 0, Math.PI * 2); ctx2d.stroke();
      } else {
        ctx2d.globalAlpha = (1 - k) * 0.92;
        ctx2d.fillStyle = p.c;
        ctx2d.beginPath(); ctx2d.arc(x, y, p.r * (1 - k * 0.6), 0, Math.PI * 2); ctx2d.fill();
      }
      ctx2d.restore();
    }
  }

  /* ---------- 그리기: 박자 스트립 · 카운트인 ---------- */
  function drawStrip(t) {
    var x0 = 16, x1 = W - 16, y = 17, w = x1 - x0, hh = 5;
    ctx2d.save();
    ctx2d.fillStyle = 'rgba(46,36,66,0.30)';
    ctx2d.beginPath(); ctx2d.roundRect(x0, y, w, hh, 3); ctx2d.fill();
    var total = bt(M.END_BEAT);
    var cols = { intro: 'rgba(255,255,255,0.20)', build: 'rgba(206,180,240,0.34)', peak: 'rgba(255,224,166,0.38)' };
    SECTIONS.forEach(function (s) {
      var a = bt(s.from) / total, b = bt(s.to) / total;
      ctx2d.fillStyle = cols[s.id];
      ctx2d.fillRect(x0 + w * a, y, w * (b - a), hh);
    });
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      var nx = x0 + w * (n.t / total);
      ctx2d.fillStyle = n.judged ? (n.verdict === 'miss' ? '#ff9cac' : '#ffeab0') : 'rgba(255,255,255,0.55)';
      ctx2d.fillRect(nx - 0.7, y - 1.5, 1.4, hh + 3);
    }
    var px = x0 + w * clamp01(t / total);
    ctx2d.fillStyle = '#fff';
    ctx2d.fillRect(px - 1, y - 4, 2, hh + 8);
    ctx2d.restore();
  }

  function drawCountIn(t) {
    if (t > 0.06 || t < -LEAD * BEAT) return;
    var b = clamp01((t + LEAD * BEAT) / BEAT / 2.999) * 2.999;
    var n = 3 - Math.floor(b);
    var frac = b - Math.floor(b);
    var cx = W * 0.5, cy = H * 0.27;
    var s = 0.88 + 0.22 * Math.exp(-frac * 5.5);
    ctx2d.save();
    ctx2d.globalAlpha = 0.55 + 0.45 * Math.exp(-frac * 3.2);
    ctx2d.translate(cx, cy);
    ctx2d.scale(s, s);
    ctx2d.fillStyle = 'rgba(255,253,247,0.9)';
    ctx2d.beginPath(); ctx2d.arc(0, 0, 27, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.strokeStyle = '#c9b1dd';
    ctx2d.lineWidth = 1.6;
    ctx2d.stroke();
    ctx2d.fillStyle = '#5f4a74';
    ctx2d.font = '700 30px Georgia, serif';
    ctx2d.textAlign = 'center'; ctx2d.textBaseline = 'middle';
    ctx2d.fillText(String(n), 0, 1);
    ctx2d.restore();
    ctx2d.save();
    ctx2d.globalAlpha *= 0.75;
    ctx2d.textAlign = 'center';
    ctx2d.fillStyle = '#6d567f';
    ctx2d.font = '600 10px system-ui, sans-serif';
    ctx2d.fillText('왈츠 · 세 박', cx, cy + 40);
    ctx2d.restore();
  }

  function drawSpirit(t) {
    if (!spiritImg.complete || !spiritImg.width) return;
    var h = Math.min(58, H * 0.12);
    var w = h * (spiritImg.width / spiritImg.height);
    var cx = W - 32 - w / 2;
    var cy = groundY - H * 0.21 + Math.sin(t * 2.1) * 5;
    var glow = ctx2d.createRadialGradient(cx, cy, 2, cx, cy, w * 1.1);
    glow.addColorStop(0, '#fff4cf66');
    glow.addColorStop(1, '#fff4cf00');
    ctx2d.save();
    ctx2d.fillStyle = glow;
    ctx2d.beginPath(); ctx2d.arc(cx, cy, w * 1.1, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.globalAlpha = 0.94;
    ctx2d.drawImage(spiritImg, cx - w / 2, cy - h / 2, w, h);
    ctx2d.restore();
  }

  function render(t) {
    if (!W) return;
    if (mode === 'cover') { renderCover(); return; }
    ctx2d.clearRect(0, 0, W, H);
    var peak = skyFor(t);
    drawMoonAndHills(t, peak);
    drawTheater(t, peak);
    drawGround(t, peak);
    drawRing(t);
    drawObjects(t);
    drawSpirit(t);
    drawDancer(t);
    drawParts(t);
    if (mode === 'play') { drawStrip(t); drawCountIn(t); }
  }

  /* 커버: 카드 아래에 슈가가 서 있는 포스터 구도 */
  function renderCover() {
    var sr = canvas.getBoundingClientRect();
    var card = cover.querySelector('.cover-card');
    var cardBottom = card ? card.getBoundingClientRect().bottom - sr.top : H * 0.5;
    var h = Math.min(H * 0.34, W * 0.46);
    var g = Math.min(H - 8, cardBottom + 12 + h);
    if (g - h < cardBottom + 4) h = Math.max(80, g - 10 - cardBottom - 4);

    var oj = judgeX, og = groundY, od = DANCER_H;
    ctx2d.clearRect(0, 0, W, H);
    judgeX = W * 0.5; groundY = g; DANCER_H = h;
    skyFor(-1.2);
    drawMoonAndHills(-1.2, 0);
    drawGround(-1.2, 0);
    if (h >= 96) {
      drawRing(-1.2);
      drawDancer(-1.2);
    }
    drawSpirit(-1.2);
    judgeX = oj; groundY = og; DANCER_H = od;
  }

  /* ---------- HUD ---------- */
  function syncHud(t) {
    /* 다음 동작 */
    var next = null;
    for (var i = 0; i < notes.length; i++) {
      if (!notes[i].judged && notes[i].t > t - WIN.good) { next = notes[i]; break; }
    }
    var idx = next ? next.beat : -1;
    if (idx !== nextIdx) {
      nextIdx = idx;
      Object.keys(moves).forEach(function (k) { moves[k].classList.toggle('next', !!next && next.type === k); });
      if (next) {
        var beatToNote = next.t - t;
        if (beatToNote < 2.4) setCue(NAMES[next.type] + ' 준비', LINES[next.type]);
      }
    }
    /* 구간 표시 */
    var sec = SECTIONS[0];
    for (var s = 0; s < SECTIONS.length; s++) if (t >= bt(SECTIONS[s].from)) sec = SECTIONS[s];
    if (sectionTag.dataset.id !== sec.id) {
      sectionTag.dataset.id = sec.id;
      sectionTag.textContent = sec.tag;
    }
    /* 세 박 표시 */
    var b = Math.floor(t / BEAT) - LEAD;
    var cur = ((b % 3) + 3) % 3;
    for (var k = 0; k < 3; k++) beatBars[k].classList.toggle('cur', k === cur && t > -0.2);
    if (t > -0.2 && b !== lastBeat) lastBeat = b;

    /* 첫 10초 온보딩 안내 */
    var hint = '';
    if (t > 0.5 && t < 4.6) hint = '빛나는 링에 닿는 순간 눌러요';
    else if (t >= 4.6 && t < 7.2) hint = '고양이가 와요 — 🐈 파드샤';
    else if (t > 8.4 && t < 11.4) hint = '이번엔 허들 — 🦋 그랑제떼';
    else if (t > 29.4 && t < 33.4) hint = '절정 — 피루엣은 두 바퀴, 더 길게';
    if (hint !== lastHint) { tapHint.textContent = hint; lastHint = hint; }
  }

  /* ---------- 루프 ---------- */
  function frame() {
    if (mode !== 'play') return;
    var t = clock();
    if (t > -0.2) autoMiss(t);
    render(t);
    syncHud(t);
    if (t > END + 0.35) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }

  /* ---------- 결과 ---------- */
  function finish() {
    cancelAnimationFrame(raf);
    mode = 'result';
    var total = notes.length;
    var acc = (stats.perfect + stats.good * 0.6) / total;
    var rank = acc >= 0.93 ? 'S' : acc >= 0.82 ? 'A' : acc >= 0.66 ? 'B' : 'C';
    var lines = {
      S: '와, 왈츠가 슈가의 것이 되었어요. 세 박이 몸에 그대로 새겨졌네요.',
      A: '강-약-약이 아름답게 살아 있었어요. 절정의 피루엣이 특히 반짝였어요.',
      B: '왈츠의 결을 따라갔어요. 약박 스텝만 조금 더 가볍게 밟으면 완벽해요.',
      C: '왈츠는 천천히 배우는 춤이에요. 세 박을 세면서 다시 한 번 불러 볼까요?'
    };
    $('resRank').textContent = rank;
    $('resRank').className = 'rank ' + rank;
    $('resLine').textContent = lines[rank];
    $('resPerfect').textContent = stats.perfect;
    $('resGood').textContent = stats.good;
    $('resMiss').textContent = stats.miss;
    $('resCombo').textContent = stats.maxCombo;
    $('resTitle').textContent = rank === 'S' ? '첫 왈츠를 완벽하게 마쳤어요' : '첫 왈츠를 마쳤어요';
    var rows = '';
    ['cat', 'jump', 'beam', 'turn'].forEach(function (k) {
      var r = byType[k], n = r.p + r.g + r.m;
      var pct = n ? Math.round(((r.p + r.g * 0.6) / n) * 100) : 0;
      rows += '<div class="row"><span>' + NAMES[k] + '</span><span class="bar"><i style="width:' + pct + '%"></i></span><span>' + r.p + '/' + n + '</span></div>';
    });
    $('resMoves').innerHTML = rows;
    $('resStatus').textContent = '정확도 ' + Math.round(acc * 100) + '% · ' + notes.length + '개의 박';
    result.hidden = false;
    document.body.classList.add('resulting');
    if (band) band.stop();
  }

  function resetAll() {
    cancelAnimationFrame(raf);
    if (band) band.stop();
    mode = 'cover';
    document.body.classList.remove('resulting');
    resetNotes();
    result.hidden = true;
    cover.hidden = false;
    setCue('왈츠의 세 박', '강 · 약 · 약, 첫 박에 크게 뛰어요');
    updateCombo();
    sectionTag.textContent = SECTIONS[0].tag;
    sectionTag.dataset.id = '';
    render(-1.2);
  }

  /* ---------- 입력 ---------- */
  pad.addEventListener('pointerdown', function (ev) {
    var btn = ev.target.closest('[data-move]');
    if (!btn) return;
    if (ev.cancelable) ev.preventDefault();
    var k = btn.dataset.move;
    btn.classList.add('down');
    var hitEl = btn.querySelector('.hit');
    hitEl.classList.remove('on'); void hitEl.offsetWidth; hitEl.classList.add('on');
    setTimeout(function () { btn.classList.remove('down'); }, 110);
    press(k);
  }, { passive: false });

  window.addEventListener('keydown', function (ev) {
    if (mode !== 'play' || ev.repeat) return;
    var k = { '1': 'cat', '2': 'jump', '3': 'beam', '4': 'turn' }[ev.key];
    if (!k) return;
    ev.preventDefault();
    moves[k].classList.add('down');
    setTimeout(function () { moves[k].classList.remove('down'); }, 110);
    press(k);
  });

  $('startBtn').addEventListener('click', startRun);
  $('retryBtn').addEventListener('click', function () { result.hidden = true; startRun(); });
  $('sndBtn').addEventListener('click', function () {
    soundOn = !soundOn; setSound();
    if (soundOn && ctx && ctx.state === 'suspended') ctx.resume();
  });

  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.visibilityState === 'hidden') { try { ctx.suspend(); } catch (e) {} }
    else { try { ctx.resume(); } catch (e) {} }
  });
  window.addEventListener('pagehide', function () { if (band) band.stop(); });

  if (window.ResizeObserver) {
    new ResizeObserver(function () { resize(); }).observe(canvas.parentNode);
  } else {
    window.addEventListener('resize', resize);
  }

  /* ---------- 준비 ---------- */
  Object.keys(POSE_SRC).forEach(function (k) {
    var im = new Image();
    im.onload = function () { if (mode === 'cover') render(-1.2); };
    im.src = POSE_SRC[k];
    IMG[k] = im;
  });
  spiritImg.onload = function () { if (mode === 'cover') render(-1.2); };
  resize();
  resetNotes();
  setSound();
  updateCombo();
  render(-1.2);

  /* 검증용 읽기 전용 상태 (테스트가 실제 시간을 읽어 버튼을 누른다) */
  var meterNode = null, meterBuf = null;
  function meter() {
    if (!ctx || !master) return null;
    if (!meterNode) {
      meterNode = ctx.createAnalyser();
      meterNode.fftSize = 1024;
      meterBuf = new Float32Array(meterNode.fftSize);
      master.connect(meterNode);
    }
    meterNode.getFloatTimeDomainData(meterBuf);
    var s = 0;
    for (var i = 0; i < meterBuf.length; i++) s += meterBuf[i] * meterBuf[i];
    return { rms: Math.sqrt(s / meterBuf.length), t: clock(), at: ctx.currentTime, latency: ctx.baseLatency || 0 };
  }

  window.__waltz = {
    time: clock,
    chart: notes.map(function (n) { return { t: n.t, type: n.type, beat: n.beat }; }),
    stats: function () { return JSON.parse(JSON.stringify(stats)); },
    verdicts: function () { return notes.map(function (n) { return n.verdict; }); },
    mode: function () { return mode; },
    end: END,
    meter: meter,
    audio: function () { return { state: ctx ? ctx.state : 'none', startedAt: t0, latency: ctx ? (ctx.baseLatency || 0) : 0, time: clock() }; },
    press: press
  };
})();
