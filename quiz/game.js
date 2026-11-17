/* =========================================================
   마법 슈가의 미니 발레 — game.js
   3-in-1: 용어 퀴즈 · 순서 외우기 · 카드 도감 + 작품 무대
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- 데이터 ---------------- */
  const POSES = [
    {
      id: 'arabesque', ko: '아라베스크', fr: 'Arabesque', starter: true,
      desc: '한 발로 서서 다른 다리를 뒤로 길게 뻗고, 팔로 하늘과 땅을 잇는 대표적인 균형 동작이에요.',
      tip: '시선은 앞으로 뻗은 손끝 너머로. 등과 목을 길게 늘여야 다리가 더 길어 보여요.',
      hint: '한 발로 서서 뒤로 다리를 뻗은, 날개를 편 새 같은 자세'
    },
    {
      id: 'passe', ko: '파세', fr: 'Passé', starter: true,
      desc: '한 다리의 발끝을 서 있는 다리의 무릎에 대고 세우는 동작이에요. 턴을 준비할 때 자주 써요.',
      tip: '발끝은 무릎 앞이나 옆에 살짝. 골반이 옆으로 빠지지 않게 배에 힘을 주세요.',
      hint: '발끝을 반대쪽 무릎에 콕, 하고 붙이고 서는 자세'
    },
    {
      id: 'plie', ko: '플리에', fr: 'Plié', starter: true,
      desc: '무릎을 굽혀 몸을 낮추는 동작이에요. 모든 점프와 턴의 시작이 되는 기본 중의 기본이에요.',
      tip: '뒤꿈치는 바닥에 붙인 채, 무릎은 발끝이 향하는 방향으로 밀어내듯 굽혀요.',
      hint: '무릎을 굽혀 몸을 낮추는, 점프 전의 준비 동작'
    },
    {
      id: 'tendu', ko: '탄듀', fr: 'Tendu',
      desc: '발을 바닥에 붙인 채 발끝으로 미끄러지듯 쭉 뻗는 동작이에요. 다리 힘을 기르는 기본 동작이에요.',
      tip: '발끝까지 에너지를 보내되, 발은 끝까지 바닥을 떠나지 않게. 다리는 밖으로 돌린 채로요.',
      hint: '발을 바닥에 끈 채 발끝으로 미끄러지듯 뻗는 동작'
    },
    {
      id: 'attitude', ko: '아티튜드', fr: 'Attitude',
      desc: '한 발로 서서 반대 다리를 뒤로 굽혀 들어 올린, 우아함의 대명사 같은 자세예요.',
      tip: '들어 올린 무릎은 옆으로 열고, 버티는 다리는 길게. 가슴은 살짝 들어 올려요.',
      hint: '한 발로 서서 뒤로 다리를 굽혀 들어 올린 자세'
    },
    {
      id: 'grandjete', ko: '그랑 주테', fr: 'Grand Jeté',
      desc: '공중에서 앞뒤 다리를 180도로 쭉 찢으며 나는, 발레에서 가장 화려한 점프예요.',
      tip: '점프의 정점에서 다리를 찢고, 그 순간 잠깐 공중에 떠 있는 느낌을 만들어요.',
      hint: '공중에서 두 다리를 일직선으로 찢는 큰 점프'
    },
    {
      id: 'cambre', ko: '캄브레', fr: 'Cambré',
      desc: '허리를 축으로 상체를 뒤나 옆으로 부드럽게 젖히는 동작이에요. 숨을 쉬는 느낌으로 해요.',
      tip: '허리만 꺾지 말고 머리 끝까지 하나의 곡선을 그린다는 생각으로 젖혀요.',
      hint: '상체를 뒤나 옆으로 부드럽게 젖히는 동작'
    },
    {
      id: 'echappe', ko: '에샤페', fr: 'Échappé',
      desc: '두 발로 바닥을 밀어 양옆으로 벌려 서는 동작이에요. 다섯 번째 자리에서 두 번째 자리로 이동해요.',
      tip: '벌어질 때 두 다리가 동시에, 같은 속도로. 착지는 조용하게, 무릎으로 충격을 받아요.',
      hint: '두 발로 밀어 양옆으로 벌려 서는, "escape"라는 뜻의 동작'
    },
    {
      id: 'pasdechat', ko: '파드샤', fr: 'Pas de chat',
      desc: '고양이가 폴짝 뛰어오르듯, 두 발을 차례로 들어 올리며 나는 점프예요.',
      tip: '발이 하나씩 빠르게 지나가야 고양이처럼 가벼워 보여요. 팔은 오체로 살짝 들어요.',
      hint: '고양이처럼 두 발을 차례로 들며 뛰는 점프'
    }
  ];
  const POSE = {};
  POSES.forEach(function (p) { POSE[p.id] = p; });

  const THEMES = [
    { id: 'opal', ko: '오팔 핑크', free: true },
    { id: 'swan', ko: '백조 화이트' },
    { id: 'midnight', ko: '미드나잇 블루' }
  ];
  const BGS = [
    { id: 'theater', ko: '클래식 극장' },
    { id: 'night', ko: '별빛 밤' },
    { id: 'studio', ko: '연습실' }
  ];

  const SAVE_KEY = 'magicSugar.v1';

  /* ---------------- 상태 ---------------- */
  let state = {
    owned: ['arabesque', 'passe', 'plie'],
    themes: ['opal'],
    muted: false,
    clears: { quiz: 0, order: 0 }
  };

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (Array.isArray(s.owned)) state.owned = s.owned.filter(function (id) { return POSE[id]; });
      if (!state.owned.length) state.owned = ['arabesque', 'passe', 'plie'];
      if (Array.isArray(s.themes)) state.themes = s.themes.filter(function (id) { return typeof id === 'string'; });
      if (state.themes.indexOf('opal') < 0) state.themes.unshift('opal');
      state.muted = !!s.muted;
      state.clears = s.clears || state.clears;
    } catch (e) { /* 저장값이 깨져도 기본값으로 시작 */ }
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { }
  }

  /* ---------------- 유틸 ---------------- */
  const $ = function (sel) { return document.querySelector(sel); };
  const $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  function shuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = r[i]; r[i] = r[j]; r[j] = t; }
    return r;
  }
  function sleep(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { } }

  let toastTimer = null;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('on'); }, 1900);
  }

  function openSheet(html) {
    const sheet = $('#sheet');
    const inner = $('#sheetInner');
    inner.innerHTML = html;
    inner.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        const act = b.dataset.act;
        if (act === 'close') closeSheet();
        else if (act === 'restartQuiz') { closeSheet(); startQuiz(); }
        else if (act === 'restartOrder') { closeSheet(); startOrder(); }
        else if (act === 'toStage') { closeSheet(); go('stage'); }
      });
    });
    sheet.classList.add('on');
    sheet.onclick = function (e) { if (e.target === sheet) closeSheet(); };
  }
  function closeSheet() { $('#sheet').classList.remove('on'); }

  /* ---------------- 이미지 프리로드 ---------------- */
  const IMG = {};
  const imgReady = {};
  POSES.forEach(function (p) {
    const img = new Image();
    img.decoding = 'async';
    imgReady[p.id] = new Promise(function (res) {
      img.onload = function () { res(img); };
      img.onerror = function () { res(null); };
    });
    img.src = 'assets/' + p.id + '.webp';
    IMG[p.id] = img;
  });
  function whenImages(ids) { return Promise.all(ids.map(function (id) { return imgReady[id]; })); }

  /* ---------------- 화면 이동 ---------------- */
  const SCREENS = ['home', 'quiz', 'order', 'dex', 'stage', 'show'];
  let current = 'home';
  function go(name) {
    if (SCREENS.indexOf(name) < 0) name = 'home';
    current = name;
    SCREENS.forEach(function (n) { $('#s-' + n).classList.toggle('on', n === name); });
    $$('.tab').forEach(function (t) { t.classList.toggle('on', t.dataset.go === name); });
    $('.tabbar').style.display = name === 'show' ? 'none' : '';
    const scr = $('#s-' + name);
    if (scr) scr.scrollTop = 0;
    if (name === 'home') renderHome();
    if (name === 'dex') renderDex();
    if (name === 'stage') renderStage();
    if (name !== 'quiz' && quiz.locked) quiz.locked = false;
  }
  $$('[data-go]').forEach(function (b) {
    if (b.classList.contains('tab') || b.classList.contains('menu-card')) return;
    b.addEventListener('click', function () { go(b.dataset.go); });
  });

  /* ---------------- 홈 ---------------- */
  function renderHome() {
    $('#homeCount').textContent = state.owned.length;
    $('#homeBar').style.width = (state.owned.length / POSES.length * 100) + '%';
    $('#homeThemes').textContent = '의상 ' + state.themes.length + '/3';
    $('#soundBtn').textContent = state.muted ? '🔕' : '🔔';
    $('#soundBtn').onclick = function () {
      state.muted = !state.muted; save();
      $('#soundBtn').textContent = state.muted ? '🔕' : '🔔';
      if (masterGain) masterGain.gain.value = state.muted ? 0 : 0.9;
      toast(state.muted ? '소리를 껐어요' : '소리를 켰어요');
    };
  }

  /* ---------------- 공통: 하트 ---------------- */
  function heartsHTML(n, total) {
    let s = '';
    for (let i = 0; i < (total || 3); i++) s += '<span class="h ' + (i < n ? '' : 'off') + '">♥</span>';
    return s;
  }

  /* =========================================================
     용어 퀴즈
     ========================================================= */
  const quiz = { q: [], i: 0, hp: 3, wand: false, locked: false };

  function startQuiz() {
    const pool = shuffle(POSES);
    quiz.q = pool.slice(0, 5).map(function (p) {
      const others = shuffle(POSES.filter(function (o) { return o.id !== p.id; })).slice(0, 3);
      return { p: p, opts: shuffle([p].concat(others)) };
    });
    quiz.i = 0; quiz.hp = 3; quiz.wand = false; quiz.locked = false;
    go('quiz');
    $('#wandBtn').disabled = false;
    renderQuestion();
  }

  function renderHearts(target, hp) {
    target.innerHTML = heartsHTML(hp, 3);
  }

  function renderQuestion() {
    const item = quiz.q[quiz.i];
    const p = item.p;
    quiz.locked = false;
    $('#quizRound').textContent = (quiz.i + 1) + ' / ' + quiz.q.length;
    renderHearts($('#quizHearts'), quiz.hp);
    $('#quizImg').src = 'assets/' + p.id + '.webp';
    $('#quizImg').alt = '발레 동작 카드';
    $('#quizTip').innerHTML = '';
    const box = $('#quizAnswers');
    box.innerHTML = '';
    item.opts.forEach(function (o) {
      const b = document.createElement('button');
      b.className = 'answer';
      b.innerHTML = '<span>' + o.ko + '<span class="fr">' + o.fr + '</span></span>';
      b.dataset.id = o.id;
      b.addEventListener('click', function () { answer(o, b); });
      box.appendChild(b);
    });
    $('#wandBtn').disabled = quiz.wand;
    $('#wandBtn').innerHTML = quiz.wand
      ? '<span>🪄</span> 사용 완료'
      : '<span>🪄</span> 토슈즈 마법봉 <em>1회</em>';
  }

  function answer(choice, btn) {
    if (quiz.locked) return;
    const item = quiz.q[quiz.i];
    const p = item.p;
    if (choice.id === p.id) {
      quiz.locked = true;
      btn.classList.add('correct');
      $$('#quizAnswers .answer').forEach(function (b) { b.disabled = true; });
      const h = $('#quizHearts').children[quiz.hp - 1];
      if (h) { h.classList.add('pop'); setTimeout(function () { h.classList.remove('pop'); }, 420); }
      playFx('ok');
      $('#quizTip').innerHTML = '💡 ' + p.tip;
      setTimeout(function () { nextQuestion(); }, 950);
    } else {
      quiz.hp = Math.max(0, quiz.hp - 1);
      btn.classList.add('wrong');
      btn.disabled = true;
      renderHearts($('#quizHearts'), quiz.hp);
      buzz(40); playFx('bad');
      const correctBtn = $$('#quizAnswers .answer').filter(function (b) { return b.dataset.id === p.id; })[0];
      if (correctBtn) correctBtn.classList.add('correct');
      $$('#quizAnswers .answer').forEach(function (b) { b.disabled = true; });
      quiz.locked = true;
      $('#quizTip').innerHTML = (quiz.hp > 0 ? '정답은 <b>' + p.ko + '</b>! ' : '') + p.tip;
      setTimeout(function () {
        if (quiz.hp <= 0) failQuiz();
        else nextQuestion();
      }, 1300);
    }
  }

  function nextQuestion() {
    quiz.i++;
    if (quiz.i >= quiz.q.length) clearQuiz();
    else renderQuestion();
  }

  function useWand() {
    if (quiz.wand || quiz.locked) return;
    quiz.wand = true;
    const healed = quiz.hp < 3;
    quiz.hp = Math.min(3, quiz.hp + 1);
    renderHearts($('#quizHearts'), quiz.hp);
    const item = quiz.q[quiz.i];
    const wrongs = $$('#quizAnswers .answer').filter(function (b) { return b.dataset.id !== item.p.id; });
    shuffle(wrongs).slice(0, 2).forEach(function (b) { b.classList.add('gone'); b.disabled = true; });
    $('#wandBtn').disabled = true;
    $('#wandBtn').innerHTML = '<span>🪄</span> 사용 완료';
    playFx('magic');
    toast(healed ? '토슈즈 마법봉! 하트 회복 + 오답 두 개를 지웠어요' : '토슈즈 마법봉! 오답 두 개를 지웠어요');
  }

  function clearQuiz() {
    playFx('win');
    state.clears.quiz++;
    const got = unlockSomething('pose');
    save();
    renderHome();
    let html = '<div class="unlock-badge">ROUND CLEAR</div><h2>퀴즈 클리어! 🎉</h2>' +
      '<p>5문제를 모두 풀었어요.<br />노력한 만큼 카드가 한 장 늘었어요.</p>';
    if (got && got.type === 'pose') {
      html += '<div class="sheet-img"><img src="assets/' + got.pose.id + '.webp" alt="' + got.pose.ko + '" /></div>' +
        '<div class="name">' + got.pose.ko + '</div><div class="fr">' + got.pose.fr + '</div>' +
        '<div class="tip">' + got.pose.desc + '</div>';
    } else if (got && got.type === 'theme') {
      html += '<div class="tip"><b>' + got.theme.ko + '</b> 의상 필터를 열었어요. 작품 무대에서 골라 보세요.</div>';
    } else {
      html += '<div class="tip">이미 모든 카드와 의상을 모았어요. 대단해요! 🩰</div>';
    }
    html += '<button class="btn-main" data-act="close">좋아요</button>';
    openSheet(html);
  }

  function failQuiz() {
    playFx('bad');
    openSheet('<div class="unlock-badge">TRY AGAIN</div><h2>하트를 다 잃었어요 🥲</h2>' +
      '<p>괜찮아요, 발레도 매일 조금씩 늘어요.<br />마법봉을 아껴 쓰면 한 번 더 기회가 생겨요.</p>' +
      '<div class="row2"><button class="btn-sub" data-act="close">도감 보기</button>' +
      '<button class="btn-main" style="margin-top:0" data-act="restartQuiz">다시 도전</button></div>');
  }

  /* 해금: 카드 → 의상 순서로 하나씩 */
  function unlockSomething(prefer) {
    const lockedPoses = POSES.filter(function (p) { return state.owned.indexOf(p.id) < 0; });
    const lockedThemes = THEMES.filter(function (t) { return state.themes.indexOf(t.id) < 0; });
    if (prefer === 'theme' && lockedThemes.length) {
      state.themes.push(lockedThemes[0].id);
      return { type: 'theme', theme: lockedThemes[0] };
    }
    if (lockedPoses.length) {
      const pick = lockedPoses[Math.floor(Math.random() * lockedPoses.length)];
      state.owned.push(pick.id);
      return { type: 'pose', pose: pick };
    }
    if (lockedThemes.length) {
      state.themes.push(lockedThemes[0].id);
      return { type: 'theme', theme: lockedThemes[0] };
    }
    return null;
  }

  /* =========================================================
     순서 외우기 (앙셰느망)
     ========================================================= */
  const order = { seq: [], tiles: [], hp: 3, step: 0, phase: 'idle', busy: false };

  function startOrder() {
    const owned = POSES.filter(function (p) { return state.owned.indexOf(p.id) >= 0; });
    if (owned.length < 3) { toast('카드가 3장 이상 필요해요'); return; }
    const len = owned.length >= 4 ? 4 : 3;
    order.seq = shuffle(owned).slice(0, len);
    const rest = shuffle(POSES.filter(function (p) { return order.seq.indexOf(p) < 0; })).slice(0, 2);
    order.tiles = shuffle(order.seq.concat(rest));
    order.hp = 3; order.step = 0; order.phase = 'demo'; order.busy = false;
    $('#orderRound').textContent = len + '개 동작';
    $('#orderLead').textContent = '카드가 반짝이는 순서를 잘 보고 기억해요.';
    renderHearts($('#orderHearts'), order.hp);
    renderSeqDots();
    $('#orderGrid').innerHTML = '';
    $('#replayBtn').style.visibility = 'hidden';
    go('order');
    runDemo();
  }

  function renderSeqDots() {
    let s = '';
    for (let i = 0; i < order.seq.length; i++) {
      s += '<i class="' + (i < order.step ? 'done' : (order.phase === 'demo' && i === order.step ? 'cur' : '')) + '"></i>';
    }
    $('#seqDots').innerHTML = s;
  }

  async function runDemo() {
    if (order.busy) return;
    order.busy = true;
    order.phase = 'demo';
    order.step = 0;
    renderSeqDots();
    $('#orderGrid').innerHTML = '';
    $('#replayBtn').style.visibility = 'hidden';
    $('#orderLead').textContent = '잘 보고 있어요… 이 순서대로 기억해요!';
    const demo = $('#demoStage');
    demo.classList.remove('dim');
    for (let i = 0; i < order.seq.length; i++) {
      const p = order.seq[i];
      $('#demoImg').src = 'assets/' + p.id + '.webp';
      $('#demoName').textContent = (i + 1) + '. ' + p.ko;
      $('#demoName').classList.add('on');
      demo.classList.remove('flash');
      void demo.offsetWidth;
      demo.classList.add('flash');
      order.step = i;
      renderSeqDots();
      playFx('blip');
      await sleep(760);
      $('#demoName').classList.remove('on');
      await sleep(210);
    }
    order.step = 0;
    order.phase = 'input';
    renderSeqDots();
    $('#demoStage').classList.add('dim');
    $('#demoName').textContent = '기억한 순서대로 눌러 보세요';
    $('#demoName').classList.add('on');
    $('#orderLead').textContent = '이제 순서대로 눌러 보세요!';
    renderOrderGrid();
    order.busy = false;
    $('#replayBtn').style.visibility = 'visible';
  }

  function renderOrderGrid() {
    const box = $('#orderGrid');
    box.innerHTML = '';
    order.tiles.forEach(function (p) {
      const b = document.createElement('button');
      b.className = 'order-card';
      b.dataset.id = p.id;
      b.innerHTML = '<img src="assets/' + p.id + '.webp" alt="' + p.ko + '" /><span>' + p.ko + '</span><i class="ord">1</i>';
      b.addEventListener('click', function () { tapOrder(p, b); });
      box.appendChild(b);
    });
  }

  function tapOrder(p, btn) {
    if (order.phase !== 'input' || order.busy) return;
    if (btn.classList.contains('done')) return;
    const want = order.seq[order.step];
    if (p.id === want.id) {
      btn.classList.add('done');
      btn.querySelector('.ord').textContent = String(order.step + 1);
      order.step++;
      playFx('blip');
      renderSeqDots();
      renderHearts($('#orderHearts'), order.hp);
      if (order.step >= order.seq.length) orderClear();
    } else {
      order.hp = Math.max(0, order.hp - 1);
      renderHearts($('#orderHearts'), order.hp);
      btn.classList.add('shake');
      setTimeout(function () { btn.classList.remove('shake'); }, 420);
      buzz(40); playFx('bad');
      if (order.hp <= 0) orderFail();
    }
  }

  function orderClear() {
    order.phase = 'done';
    playFx('win');
    state.clears.order++;
    const got = unlockSomething('theme');
    save(); renderHome();
    let html = '<div class="unlock-badge">MEMORY CLEAR</div><h2>앙셰느망 완성! ✨</h2>' +
      '<p>동작 ' + order.seq.length + '개를 순서대로 이어 붙였어요.<br />이제 이 동작들을 무대에 올릴 수 있어요.</p>';
    html += '<div class="tip"><b>앙셰느망(enchaînement)</b>은 여러 동작을 음악에 맞춰 이어 붙인 하나의 흐름을 말해요. 무대에서 제일 멋있어 보이는 순간이 바로 이 연결이에요.</div>';
    if (got && got.type === 'theme') {
      html += '<div class="tip">🎀 <b>' + got.theme.ko + '</b> 의상 필터를 열었어요!</div>';
    } else if (got && got.type === 'pose') {
      html += '<div class="sheet-img"><img src="assets/' + got.pose.id + '.webp" alt="' + got.pose.ko + '" /></div>' +
        '<div class="name">' + got.pose.ko + '</div>';
    } else {
      html += '<div class="tip">모든 카드와 의상을 모았어요. 이제 무대만 남았네요! 🎭</div>';
    }
    html += '<div class="row2"><button class="btn-sub" data-act="close">좋아요</button>' +
      '<button class="btn-main" style="margin-top:0" data-act="toStage">무대 만들기</button></div>';
    openSheet(html);
  }

  function orderFail() {
    order.phase = 'fail';
    playFx('bad');
    openSheet('<div class="unlock-badge">TRY AGAIN</div><h2>순서가 조금 엇갈렸어요</h2>' +
      '<p>다시 보기를 누르면 순서를 한 번 더 보여 줘요.<br />그때는 카드 이름까지 같이 기억해 보세요.</p>' +
      '<button class="btn-main" data-act="restartOrder">다시 도전</button>');
  }

  /* =========================================================
     도감
     ========================================================= */
  function renderDex() {
    $('#dexCount').textContent = state.owned.length + ' / ' + POSES.length;
    const box = $('#dexGrid');
    box.innerHTML = '';
    POSES.forEach(function (p) {
      const has = state.owned.indexOf(p.id) >= 0;
      const b = document.createElement('button');
      b.className = 'dex-card' + (has ? '' : ' locked');
      b.innerHTML = has
        ? '<img src="assets/' + p.id + '.webp" alt="' + p.ko + '" /><div class="dc-name">' + p.ko + '</div>'
        : '<div class="lock-face">🔒</div><div class="dc-name">???</div>';
      b.addEventListener('click', function () {
        if (has) showPoseSheet(p);
        else openSheet('<div class="unlock-badge">LOCKED</div><h2>아직 모르는 동작</h2>' +
          '<p>용어 퀴즈나 순서 외우기를 클리어하면<br />이 자리에 새 카드가 열려요.</p>' +
          '<button class="btn-main" data-act="close">알겠어요</button>');
      });
      box.appendChild(b);
    });
  }

  function showPoseSheet(p) {
    openSheet('<div class="unlock-badge">' + p.fr.toUpperCase() + '</div>' +
      '<div class="sheet-img"><img src="assets/' + p.id + '.webp" alt="' + p.ko + '" /></div>' +
      '<div class="name">' + p.ko + '</div><div class="fr">' + p.fr + '</div>' +
      '<div class="tip">' + p.desc + '</div>' +
      '<div class="tip"><b>🩰 팁</b> · ' + p.tip + '</div>' +
      '<button class="btn-main" data-act="close">닫기</button>');
  }

  /* =========================================================
     작품 무대 — 준비 화면
     ========================================================= */
  const stageSel = { slots: [], bg: 'theater', theme: 'opal' };

  function renderStage() {
    // 슬롯
    const slots = $('#slots');
    slots.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const p = stageSel.slots[i] ? POSE[stageSel.slots[i]] : null;
      const d = document.createElement('button');
      d.className = 'slot' + (p ? ' filled' : '');
      if (p) {
        d.innerHTML = '<img src="assets/' + p.id + '.webp" alt="' + p.ko + '" /><i class="idx">' + (i + 1) + '</i>';
        d.addEventListener('click', function () {
          stageSel.slots.splice(i, 1);
          playFx('blip');
          renderStage();
        });
      } else {
        d.innerHTML = '<span>' + (i + 1) + '</span>';
      }
      slots.appendChild(d);
    }
    $('#stageCount').textContent = stageSel.slots.length + ' / 4';
    $('#slotHint').textContent = stageSel.slots.length >= 3
      ? '좋아요! 이제 배경과 의상을 고르고 공연을 시작해요.'
      : '아래 카드를 순서대로 눌러 무대에 올려 보세요. (3개 이상)';

    // 보유 카드
    const own = $('#stageOwn');
    own.innerHTML = '';
    POSES.filter(function (p) { return state.owned.indexOf(p.id) >= 0; }).forEach(function (p) {
      const used = stageSel.slots.indexOf(p.id) >= 0;
      const b = document.createElement('button');
      b.className = 'own-card' + (used ? ' used' : '');
      b.innerHTML = '<img src="assets/' + p.id + '.webp" alt="' + p.ko + '" /><span>' + p.ko + '</span>';
      b.addEventListener('click', function () {
        if (used) return;
        if (stageSel.slots.length >= 4) { toast('네 개까지 올릴 수 있어요'); return; }
        stageSel.slots.push(p.id);
        playFx('blip');
        renderStage();
      });
      own.appendChild(b);
    });

    // 배경
    $$('#bgRow .opt').forEach(function (b) {
      b.classList.toggle('sel', b.dataset.bg === stageSel.bg);
      b.onclick = function () { stageSel.bg = b.dataset.bg; playFx('blip'); renderStage(); };
    });

    // 의상
    $$('#themeRow .opt').forEach(function (b) {
      const id = b.dataset.theme;
      const unlocked = state.themes.indexOf(id) >= 0;
      b.classList.toggle('locked', !unlocked);
      b.classList.toggle('sel', id === stageSel.theme);
      b.onclick = function () {
        if (!unlocked) { toast('순서 외우기를 클리어하면 열려요'); return; }
        stageSel.theme = id; playFx('blip'); renderStage();
      };
    });
    if (state.themes.indexOf(stageSel.theme) < 0) stageSel.theme = 'opal';

    $('#startShow').disabled = stageSel.slots.length < 3;
    $('#startShow').onclick = function () {
      if (stageSel.slots.length < 3) return;
      openShow();
    };
  }

  /* =========================================================
     무대 엔진 (canvas)
     ========================================================= */
  const CV = { W: 390, H: 560, dpr: 1 };
  let cvs = null, ctx = null;
  const tintCache = {};
  let masterGain = null, AC = null;

  function audio() {
    if (AC) return AC;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    AC = new C();
    masterGain = AC.createGain();
    masterGain.gain.value = state.muted ? 0 : 0.9;
    masterGain.connect(AC.destination);
    return AC;
  }

  function tone(freq, at, dur, vol, type) {
    const c = audio();
    if (!c || state.muted) return;
    const t0 = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.16, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(masterGain);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  const CHORDS = [
    [261.63, 329.63, 392.00, 523.25],
    [220.00, 261.63, 329.63, 440.00],
    [174.61, 220.00, 261.63, 349.23],
    [196.00, 246.94, 293.66, 392.00]
  ];

  function playWaltz(segCount, startAt) {
    const bar = 1.7;
    for (let s = 0; s < segCount; s++) {
      const ch = CHORDS[s % CHORDS.length];
      const t = (startAt || 0) + s * bar;
      tone(ch[0] / 2, t, 0.55, 0.13, 'sine');
      const pattern = [ch[1], ch[2], ch[3], ch[2], ch[3] * 1.5, ch[2], ch[1] * 2, ch[3]];
      pattern.forEach(function (f, i) {
        tone(f, t + i * (bar / 8), 0.34, i % 2 ? 0.075 : 0.105, 'triangle');
      });
      tone(ch[3] * 2, t + bar * 0.5, 0.7, 0.05, 'sine');
    }
  }

  function playFx(kind) {
    const c = audio();
    if (!c || state.muted) return;
    if (c.state === 'suspended') c.resume();
    if (kind === 'ok') { tone(783.99, 0, 0.18, 0.12, 'sine'); tone(1046.5, 0.08, 0.24, 0.1, 'sine'); }
    if (kind === 'bad') { tone(220, 0, 0.16, 0.1, 'sine'); tone(174.61, 0.1, 0.22, 0.09, 'sine'); }
    if (kind === 'blip') { tone(1046.5, 0, 0.12, 0.07, 'sine'); }
    if (kind === 'magic') { [1318.5, 1567.98, 2093].forEach(function (f, i) { tone(f, i * 0.07, 0.3, 0.08, 'sine'); }); }
    if (kind === 'win') { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone(f, i * 0.11, 0.4, 0.1, 'triangle'); }); }
  }

  // 채도 기반 마스크: 배경(아이보리)은 0, 드레스·머리·피부는 1에 가깝게
  const satMaskCache = {};
  function satMask(id) {
    if (satMaskCache[id]) return satMaskCache[id];
    const img = IMG[id];
    if (!img || !img.naturalWidth) return null;
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height);
    const a = d.data;
    for (let i = 0; i < a.length; i += 4) {
      const r = a[i], gg = a[i + 1], bb = a[i + 2];
      const mx = Math.max(r, gg, bb), mn = Math.min(r, gg, bb);
      const sat = mx ? (mx - mn) / mx : 0;
      let t = (sat - 0.028) / (0.085 - 0.028);
      t = t < 0 ? 0 : (t > 1 ? 1 : t);
      a[i + 3] = Math.round(t * 235);
    }
    x.putImageData(d, 0, 0);
    satMaskCache[id] = c;
    return c;
  }

  // 의상 필터: 원본 위에 캐릭터에만 색을 입힌 레이어를 얹은 캔버스를 돌려준다
  function tinted(id, theme) {
    const key = id + '|' + theme;
    if (tintCache[key]) return tintCache[key];
    const img = IMG[id];
    if (!img || !img.naturalWidth) return img;
    if (theme === 'opal') { tintCache[key] = img; return img; }

    const w = img.naturalWidth, h = img.naturalHeight;
    const mask = satMask(id);

    const over = document.createElement('canvas');
    over.width = w; over.height = h;
    const ox = over.getContext('2d');
    let filter = 'none';
    if (theme === 'swan') filter = 'saturate(.22) brightness(1.12) contrast(1.04)';
    else if (theme === 'midnight') filter = 'saturate(.95) brightness(.93)';
    try { ox.filter = filter; } catch (e) { }
    ox.drawImage(img, 0, 0);
    if (theme === 'swan') {
      ox.globalCompositeOperation = 'source-atop';
      ox.globalAlpha = 0.58;
      ox.fillStyle = '#ffffff';
      ox.fillRect(0, 0, w, h);
      ox.globalAlpha = 1;
      ox.globalCompositeOperation = 'source-over';
    }
    if (theme === 'midnight') {
      ox.globalCompositeOperation = 'color';
      ox.globalAlpha = 0.8;
      ox.fillStyle = '#3348c4';
      ox.fillRect(0, 0, w, h);
      ox.globalAlpha = 1;
      ox.globalCompositeOperation = 'source-over';
    }
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    // 원본의 부드러운 가장자리 알파를 그대로 따라가며 색만 입힌다
    x.globalCompositeOperation = 'source-atop';
    x.drawImage(over, 0, 0);
    x.globalCompositeOperation = 'source-over';
    tintCache[key] = c;
    return c;
  }

  function setupCanvas() {
    cvs = $('#stageCanvas');
    CV.dpr = Math.min(2, window.devicePixelRatio || 1);
    cvs.width = Math.round(CV.W * CV.dpr);
    cvs.height = Math.round(CV.H * CV.dpr);
    ctx = cvs.getContext('2d');
    ctx.setTransform(CV.dpr, 0, 0, CV.dpr, 0, 0);
  }

  const stars = (function () {
    const out = [];
    for (let i = 0; i < 70; i++) {
      out.push({ x: Math.random() * CV.W, y: Math.random() * CV.H * 0.8, r: 0.6 + Math.random() * 1.6, p: Math.random() * 6.28, s: 0.6 + Math.random() * 1.6 });
    }
    return out;
  })();

  const sparkles = [];
  function spawnSparkle() {
    sparkles.push({
      x: 20 + Math.random() * (CV.W - 40),
      y: 60 + Math.random() * (CV.H - 180),
      r: 1.5 + Math.random() * 3.2,
      life: 1,
      vy: -0.18 - Math.random() * 0.35,
      p: Math.random() * 6.28
    });
  }

  function drawBackdrop(kind, t) {
    const W = CV.W, H = CV.H;
    if (kind === 'night') {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#070a24'); g.addColorStop(0.55, '#1a2456'); g.addColorStop(1, '#2b1f4c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const mg = ctx.createRadialGradient(W * 0.78, H * 0.16, 4, W * 0.78, H * 0.16, 90);
      mg.addColorStop(0, 'rgba(255,246,214,.95)'); mg.addColorStop(0.25, 'rgba(255,235,190,.35)'); mg.addColorStop(1, 'rgba(255,235,190,0)');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.16, 90, 0, 6.3); ctx.fill();
      stars.forEach(function (s) {
        const a = 0.35 + 0.55 * Math.abs(Math.sin(t / 900 * s.s + s.p));
        ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.3); ctx.fill();
      });
      const fg = ctx.createLinearGradient(0, H * 0.72, 0, H);
      fg.addColorStop(0, 'rgba(120,150,255,0)'); fg.addColorStop(1, 'rgba(150,170,255,.22)');
      ctx.fillStyle = fg; ctx.fillRect(0, H * 0.72, W, H * 0.28);
    } else if (kind === 'studio') {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#fdf1f5'); g.addColorStop(0.6, '#f6dcd8'); g.addColorStop(1, '#e9c3b7');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // 거울
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      roundRect(28, 34, W - 56, H * 0.52, 16); ctx.fill();
      const mgr = ctx.createLinearGradient(28, 34, W - 28, H * 0.52 + 34);
      mgr.addColorStop(0, 'rgba(226,240,255,.85)'); mgr.addColorStop(0.5, 'rgba(255,246,250,.55)'); mgr.addColorStop(1, 'rgba(232,219,240,.8)');
      ctx.fillStyle = mgr; roundRect(34, 40, W - 68, H * 0.52 - 12, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 6; roundRect(34, 40, W - 68, H * 0.52 - 12, 14); ctx.stroke();
      ctx.restore();
      // 바레
      ctx.strokeStyle = '#c9a08c'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(40, H * 0.62); ctx.lineTo(W - 40, H * 0.62); ctx.stroke();
      [64, W - 64].forEach(function (x) {
        ctx.beginPath(); ctx.moveTo(x, H * 0.62); ctx.lineTo(x, H * 0.72); ctx.stroke();
      });
      // 바닥
      const fg = ctx.createLinearGradient(0, H * 0.7, 0, H);
      fg.addColorStop(0, 'rgba(214,170,150,.25)'); fg.addColorStop(1, 'rgba(186,138,120,.5)');
      ctx.fillStyle = fg; ctx.fillRect(0, H * 0.72, W, H * 0.28);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2b0f24'); g.addColorStop(0.45, '#571f3c'); g.addColorStop(1, '#1c0a17');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const sp = ctx.createRadialGradient(W / 2, H * 0.36, 10, W / 2, H * 0.36, H * 0.58);
      sp.addColorStop(0, 'rgba(255,231,203,.38)'); sp.addColorStop(0.5, 'rgba(255,196,214,.14)'); sp.addColorStop(1, 'rgba(255,196,214,0)');
      ctx.fillStyle = sp; ctx.fillRect(0, 0, W, H);
      // 무대 바닥
      const fg = ctx.createLinearGradient(0, H * 0.74, 0, H);
      fg.addColorStop(0, 'rgba(255,214,229,.10)'); fg.addColorStop(1, 'rgba(255,214,229,.26)');
      ctx.fillStyle = fg; ctx.fillRect(0, H * 0.74, W, H * 0.26);
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCurtains(open) {
    const W = CV.W, H = CV.H;
    const panelW = W * 0.56 * (1 - open);
    ['left', 'right'].forEach(function (side) {
      if (panelW <= 0.5) return;
      const x0 = side === 'left' ? 0 : W - panelW;
      const g = ctx.createLinearGradient(x0, 0, x0 + panelW, 0);
      if (side === 'left') {
        g.addColorStop(0, '#480f24'); g.addColorStop(0.55, '#8f2444'); g.addColorStop(0.85, '#b23456'); g.addColorStop(1, '#6d1730');
      } else {
        g.addColorStop(0, '#6d1730'); g.addColorStop(0.15, '#b23456'); g.addColorStop(0.45, '#8f2444'); g.addColorStop(1, '#480f24');
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0 + panelW, 0);
      // 물결 커튼 끝
      const steps = 12;
      for (let i = 0; i <= steps; i++) {
        const yy = H * i / steps;
        const wave = Math.sin(i * 1.1) * 4;
        ctx.lineTo(x0 + panelW + (side === 'left' ? wave : -wave), yy);
      }
      ctx.lineTo(x0, H);
      ctx.closePath();
      ctx.fill();
      // 골드 트림
      ctx.strokeStyle = 'rgba(232,196,128,.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const yy = H * i / steps;
        const wave = Math.sin(i * 1.1) * 4;
        const xx = x0 + panelW + (side === 'left' ? wave : -wave);
        if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    });
    // 상단 발란스(가리개)
    const tg = ctx.createLinearGradient(0, 0, 0, 46);
    tg.addColorStop(0, '#7d1c39'); tg.addColorStop(1, 'rgba(125,28,57,.0)');
    ctx.fillStyle = tg; ctx.fillRect(0, 0, W, 46);
  }

  function drawPerformer(id, alpha, zoom, yOff) {
    const img = tinted(id, stageTheme);
    if (!img || !img.width) return;
    const targetH = CV.H * 0.66 * zoom;
    const ratio = img.width / img.height;
    const w = targetH * ratio, h = targetH;
    const x = (CV.W - w) / 2;
    const y = CV.H * 0.84 - h + (yOff || 0);
    // 받침 그림자
    ctx.save();
    ctx.globalAlpha = 0.22 * alpha;
    const sg = ctx.createRadialGradient(CV.W / 2, CV.H * 0.84, 6, CV.W / 2, CV.H * 0.84, 90);
    sg.addColorStop(0, 'rgba(0,0,0,.5)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.ellipse(CV.W / 2, CV.H * 0.845, 92, 16, 0, 0, 6.3); ctx.fill();
    ctx.restore();
    // 인물 뒤 스포트라이트 번짐
    ctx.save();
    ctx.globalAlpha = 0.34 * alpha;
    const lg = ctx.createRadialGradient(CV.W / 2, y + h * 0.42, 10, CV.W / 2, y + h * 0.42, h * 0.62);
    lg.addColorStop(0, 'rgba(255,246,232,.7)');
    lg.addColorStop(0.55, 'rgba(255,226,230,.35)');
    lg.addColorStop(1, 'rgba(255,226,230,0)');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(CV.W / 2, y + h * 0.42, h * 0.62, 0, 6.3); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }

  function drawSparkles() {
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i];
      s.life -= 0.012;
      s.y += s.vy;
      s.p += 0.08;
      if (s.life <= 0) { sparkles.splice(i, 1); continue; }
      const a = Math.max(0, s.life) * (0.55 + 0.45 * Math.sin(s.p));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(255,248,222,1)';
      ctx.translate(s.x, s.y);
      const r = s.r * (0.7 + 0.3 * Math.sin(s.p * 1.7));
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        const ang = k * Math.PI / 2;
        ctx.lineTo(Math.cos(ang) * r * 2.2, Math.sin(ang) * r * 2.2);
        ctx.lineTo(Math.cos(ang + Math.PI / 4) * r * 0.6, Math.sin(ang + Math.PI / 4) * r * 0.6);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function caption(title, sub) {
    const W = CV.W, H = CV.H;
    ctx.save();
    const g = ctx.createLinearGradient(0, H - 86, 0, H);
    g.addColorStop(0, 'rgba(20,8,20,0)'); g.addColorStop(1, 'rgba(20,8,20,.55)');
    ctx.fillStyle = g; ctx.fillRect(0, H - 86, W, 86);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,.72)';
    ctx.font = '600 10px Pretendard, sans-serif';
    ctx.fillText(title, W / 2, H - 34);
    ctx.fillStyle = '#fff';
    ctx.font = '800 19px Pretendard, sans-serif';
    ctx.fillText(sub, W / 2, H - 14);
    ctx.restore();
  }

  /* 무대 상태 */
  let show = null;
  let stageTheme = 'opal';
  let showRAF = 0;

  const T_OPEN = 750, T_END = 900, SEG = 1700;

  function totalMs() { return T_OPEN + show.poses.length * SEG + T_END; }

  function frameAt(t) {
    if (t < T_OPEN) {
      return { open: Math.min(1, t / T_OPEN), seg: 0, local: 0, phase: 'open' };
    }
    const perf = t - T_OPEN;
    const total = show.poses.length * SEG;
    if (perf < total) {
      const i = Math.floor(perf / SEG);
      return { open: 1, seg: i, local: perf - i * SEG, phase: 'dance' };
    }
    const tail = perf - total;
    // 커튼 콜: 완전히 닫지 않고 살짝만 닫아 마지막 자세를 남긴다
    return { open: Math.max(0.62, 1 - (tail / T_END) * 0.38), seg: show.poses.length - 1, local: SEG, phase: 'close' };
  }

  function drawShow(t) {
    const W = CV.W, H = CV.H;
    ctx.clearRect(0, 0, W, H);
    drawBackdrop(show.bg, t);

    if (show.phase === 'dance' || show.phase === 'close' || t >= T_OPEN) {
      // 커튼 열린 상태의 무대 조명
      if (t >= T_OPEN) {
        const gl = ctx.createRadialGradient(W / 2, H * 0.34, 20, W / 2, H * 0.34, H * 0.6);
        gl.addColorStop(0, 'rgba(255,246,226,.20)'); gl.addColorStop(1, 'rgba(255,246,226,0)');
        ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
      }
    }

    // 퍼포머
    if (t >= T_OPEN - 50) {
      const st = frameAt(Math.max(T_OPEN, t));
      const list = show.poses;
      if (st.phase !== 'close') {
        const i = st.seg;
        const local = st.local;
        const fadeIn = Math.min(1, local / 420);
        const fadeOut = Math.min(1, (SEG - local) / 420);
        const alpha = Math.max(0, Math.min(fadeIn, fadeOut));
        const zoom = 1 + 0.05 * (local / SEG);
        // 이전 동작은 아직 그대로 남아 있다가 흐려짐
        if (i > 0 && local < 420) {
          const prevAlpha = 1 - local / 420;
          drawPerformer(list[i - 1], prevAlpha * 0.55, 1.05, 0);
        }
        drawPerformer(list[i], alpha, zoom, Math.sin(t / 480) * 1.6);
      } else {
        drawPerformer(list[list.length - 1], 1, 1.05, 0);
      }
    }

    drawSparkles();

    // 동작이 바뀔 때 스포트라이트가 한 번 번쩍인다
    if (t >= T_OPEN) {
      const perf = t - T_OPEN;
      const total = show.poses.length * SEG;
      if (perf < total) {
        const local = perf % SEG;
        if (local < 300) {
          const k = 1 - local / 300;
          const fl = ctx.createRadialGradient(CV.W / 2, CV.H * 0.42, 10, CV.W / 2, CV.H * 0.42, CV.H * 0.55);
          fl.addColorStop(0, 'rgba(255,252,244,' + (0.55 * k).toFixed(3) + ')');
          fl.addColorStop(1, 'rgba(255,252,244,0)');
          ctx.fillStyle = fl;
          ctx.fillRect(0, 0, CV.W, CV.H);
        }
      }
    }

    drawCurtains(frameAt(t).open);

    // 자막
    if (t >= T_OPEN) {
      const st = frameAt(Math.min(t, T_OPEN + show.poses.length * SEG - 1));
      const name = POSE[show.poses[st.seg]].ko;
      const ending = t > T_OPEN + show.poses.length * SEG - 260;
      caption(ending ? 'THE END' : '마법 슈가의 미니 발레', name);
    }
  }

  function loop() {
    const t = performance.now() - show.t0;
    drawShow(t);
    if (t < totalMs()) showRAF = requestAnimationFrame(loop);
    else {
      drawShow(totalMs());
      if (show.onEnd) show.onEnd();
    }
  }

  function playShow() {
    cancelAnimationFrame(showRAF);
    setupCanvas();
    show.t0 = performance.now();
    sparkles.length = 0;
    const audioCtx = audio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    playWaltz(show.poses.length, 0.55);
    const sparkTimer = setInterval(function () { spawnSparkle(); }, 130);
    show.onEnd = function () { clearInterval(sparkTimer); };
    loop();
    if (show.record) startRecorder();
  }

  /* ------------ 공연 화면 열기 ------------ */
  let recorder = null, recChunks = [], pendingRecord = false;

  function openShow() {
    go('show');
    stageTheme = stageSel.theme;
    show = {
      poses: stageSel.slots.slice(),
      bg: stageSel.bg,
      record: false,
      onEnd: null
    };
    $('#showChip').textContent = BGS.filter(function (b) { return b.id === stageSel.bg; })[0].ko;
    const bgName = BGS.filter(function (b) { return b.id === stageSel.bg; })[0].ko;
    const thName = THEMES.filter(function (t) { return t.id === stageSel.theme; })[0].ko;
    const meta = $('#showMeta');
    meta.innerHTML = '<span class="chip">' + bgName + '</span><span class="chip">' + thName + '</span>' +
      show.poses.map(function (id, i) { return '<span class="chip pose">' + (i + 1) + '. ' + POSE[id].ko + '</span>'; }).join('');
    $('#recordBtn').disabled = false;
    $('#showActions').style.opacity = 0;
    whenImages(show.poses).then(function () {
      playShow();
      setTimeout(function () { $('#showActions').style.opacity = 1; }, 400);
    });
  }

  /* ------------ 영상 저장 ------------ */
  function pickMime() {
    if (!window.MediaRecorder) return '';
    const cands = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    for (let i = 0; i < cands.length; i++) {
      try { if (MediaRecorder.isTypeSupported(cands[i])) return cands[i]; } catch (e) { }
    }
    return '';
  }

  function canRecord() {
    return !!(window.MediaRecorder && cvs && cvs.captureStream);
  }

  function startRecorder() {
    const mime = pickMime();
    const stream = cvs.captureStream(30);
    try {
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 }) : new MediaRecorder(stream);
    } catch (e) {
      recorder = null;
      return;
    }
    recChunks = [];
    recorder.ondataavailable = function (e) { if (e.data && e.data.size) recChunks.push(e.data); };
    recorder.onstop = function () {
      const type = recorder.mimeType || mime || 'video/webm';
      const blob = new Blob(recChunks, { type: type });
      const ext = type.indexOf('mp4') >= 0 ? 'mp4' : 'webm';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'magic-sugar-ballet-' + stamp() + '.' + ext;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      $('#recOverlay').classList.remove('on');
      $('#recordBtn').disabled = false;
      $('#recordBtn').textContent = '🎬 내 작품 영상 저장';
      toast('영상이 저장됐어요! 인스타에 올려 보세요 🎀');
    };
    recorder.start(120);
  }

  function stamp() {
    const d = new Date();
    const p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  function recordShow() {
    if (!canRecord()) {
      $('#recNote').textContent = '이 브라우저는 영상 저장을 지원하지 않아요. 포스터 저장을 이용해 주세요.';
      toast('영상 저장을 지원하지 않는 브라우저예요');
      return;
    }
    $('#recordBtn').disabled = true;
    $('#recordBtn').textContent = '● 저장 중…';
    $('#recMsg').textContent = '영상 저장 중… (약 8초)';
    $('#recOverlay').classList.add('on');
    show.record = true;
    show.onEnd = null;
    cancelAnimationFrame(showRAF);
    const runRecording = function () {
      // 화면에 보이는 그대로 다시 한 번 공연하고 녹화
      show.t0 = performance.now();
      sparkles.length = 0;
      playWaltz(show.poses.length, 0.55);
      const sparkTimer = setInterval(function () { spawnSparkle(); }, 130);
      startRecorder();
      const tick = function () {
        const t = performance.now() - show.t0;
        drawShow(t);
        if (t < totalMs()) showRAF = requestAnimationFrame(tick);
        else {
          drawShow(totalMs());
          clearInterval(sparkTimer);
          setTimeout(function () { if (recorder && recorder.state !== 'inactive') recorder.stop(); }, 220);
        }
      };
      tick();
    };
    whenImages(show.poses).then(runRecording);
  }

  /* ------------ 포스터 저장 ------------ */
  function savePoster() {
    const W = 1080, H = 1350;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    const bg = x.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#fff6fb'); bg.addColorStop(0.55, '#fde8f3'); bg.addColorStop(1, '#efe6ff');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);

    // 배경 별가루
    for (let i = 0; i < 40; i++) {
      const sx = Math.random() * W, sy = Math.random() * H;
      x.globalAlpha = 0.15 + Math.random() * 0.35;
      x.fillStyle = '#ffffff';
      x.beginPath(); x.arc(sx, sy, 1 + Math.random() * 2.4, 0, 6.3); x.fill();
    }
    x.globalAlpha = 1;

    x.textAlign = 'center';
    x.fillStyle = '#d95f92';
    x.font = '800 28px Pretendard, sans-serif';
    x.fillText('MAGIC SUGAR BALLET', W / 2, 112);
    x.fillStyle = '#573f4f';
    x.font = '800 64px Pretendard, sans-serif';
    x.fillText('마법 슈가의 미니 발레', W / 2, 196);
    x.fillStyle = '#96707f';
    x.font = '600 25px Pretendard, sans-serif';
    x.fillText('나만의 작품 · ' + new Date().toLocaleDateString('ko-KR'), W / 2, 242);

    // 무대 패널
    const pTop = 282, pBot = H - 108;
    x.save();
    x.shadowColor = 'rgba(206,120,160,.14)'; x.shadowBlur = 30; x.shadowOffsetY = 10;
    x.fillStyle = 'rgba(255,255,255,.55)';
    roundRectPath(x, 34, pTop, W - 68, pBot - pTop, 44);
    x.fill();
    x.restore();
    x.save();
    roundRectPath(x, 34, pTop, W - 68, pBot - pTop, 44);
    x.clip();
    const spod = x.createRadialGradient(W / 2, pTop + 90, 20, W / 2, pTop + 90, (pBot - pTop) * 0.9);
    spod.addColorStop(0, 'rgba(255,246,236,.85)');
    spod.addColorStop(1, 'rgba(255,246,236,0)');
    x.fillStyle = spod;
    x.fillRect(34, pTop, W - 68, pBot - pTop);
    x.restore();

    const poses = show.poses.slice(0, 4);
    const cols = poses.length >= 4 ? 2 : poses.length;
    const rows = Math.ceil(poses.length / cols);
    const padX = 48, gapX = 24, gapY = 26, captionH = 58;
    const gridTop = pTop + 34, gridBottom = pBot - 24;
    const cellW = (W - padX * 2 - gapX * (cols - 1)) / cols;
    const rowH = (gridBottom - gridTop - gapY * (rows - 1)) / rows;
    const cellH = Math.max(200, Math.min(rowH - captionH, cellW * 1.48));
    const blockH = rows * (cellH + captionH) + gapY * (rows - 1);
    const startY = gridTop + Math.max(0, (gridBottom - gridTop - blockH) / 2) + 8;

    poses.forEach(function (id, i) {
      const col = i % cols;
      const cx = padX + col * (cellW + gapX) + (cols === poses.length ? 0 : 0);
      const cy = startY + Math.floor(i / cols) * (cellH + captionH + gapY);
      x.save();
      x.shadowColor = 'rgba(206,120,160,.22)';
      x.shadowBlur = 24;
      x.shadowOffsetY = 8;
      x.fillStyle = '#fffdfa';
      roundRectPath(x, cx, cy, cellW, cellH, 26);
      x.fill();
      x.restore();
      x.save();
      roundRectPath(x, cx, cy, cellW, cellH, 26);
      x.clip();
      const t = tinted(id, stageTheme);
      if (t && t.width) {
        const sc = Math.min(cellW / t.width, cellH / t.height);
        x.drawImage(t, cx + (cellW - t.width * sc) / 2, cy + (cellH - t.height * sc) / 2, t.width * sc, t.height * sc);
      }
      x.restore();
      x.fillStyle = '#573f4f';
      x.font = '800 28px Pretendard, sans-serif';
      x.fillText(POSE[id].ko, cx + cellW / 2, cy + cellH + 40);
    });

    // 안무 목록
    const lineY = Math.min(H - 150, startY + blockH + 76);
    x.fillStyle = '#b07f95';
    x.font = '800 30px Pretendard, sans-serif';
    x.fillText(poses.map(function (id) { return POSE[id].ko; }).join('   ·   '), W / 2, lineY);

    x.fillStyle = '#d95f92';
    x.font = '700 24px Pretendard, sans-serif';
    x.fillText('sheeny6-cmyk.github.io/magic-sugar-game/quiz', W / 2, H - 46);

    c.toBlob(function (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'magic-sugar-poster-' + stamp() + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      toast('포스터를 저장했어요 🖼');
    }, 'image/png');
  }

  function roundRectPath(x, cx, cy, w, h, r) {
    x.beginPath();
    x.moveTo(cx + r, cy);
    x.arcTo(cx + w, cy, cx + w, cy + h, r);
    x.arcTo(cx + w, cy + h, cx, cy + h, r);
    x.arcTo(cx, cy + h, cx, cy, r);
    x.arcTo(cx, cy, cx + w, cy, r);
    x.closePath();
  }

  /* =========================================================
     이벤트 바인딩
     ========================================================= */
  $('#wandBtn').addEventListener('click', useWand);
  $('#replayBtn').addEventListener('click', function () { if (order.phase === 'input' || order.phase === 'demo') runDemo(); });
  $('#recordBtn').addEventListener('click', recordShow);
  $('#posterBtn').addEventListener('click', function () { if (show) savePoster(); });
  $('#againBtn').addEventListener('click', function () { if (show) { show.record = false; playShow(); } });
  $('#showBack').addEventListener('click', function () { cancelAnimationFrame(showRAF); go('stage'); });

  // 홈 메뉴 진입점
  document.querySelectorAll('.menu-card').forEach(function (b) {
    b.addEventListener('click', function () {
      const target = b.dataset.go;
      if (target === 'quiz') startQuiz();
      else if (target === 'order') startOrder();
      else go(target);
    });
  });
  document.querySelectorAll('.tab').forEach(function (b) {
    b.addEventListener('click', function () {
      const target = b.dataset.go;
      if (target === 'quiz') startQuiz();
      else if (target === 'order') startOrder();
      else go(target);
    });
  });

  // 브라우저가 뒤로 갈 때 캔버스 루프 정지
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancelAnimationFrame(showRAF);
  });

  /* ---------------- 시작 ---------------- */
  load();
  renderHome();
  setupCanvas();
  whenImages(POSES.map(function (p) { return p.id; })).then(function () {
    // 첫 화면 준비 완료
    document.body.dataset.ready = '1';
  });
})();
