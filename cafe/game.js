/* ===== ☕ 슈가 발레 카페 타이쿤 ===== */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const ROUND = 60;

  /* ---------------- 재료 ---------------- */
  const ING = {
    ice:       { n: '얼음',        s: '얼음',   i: '🧊', c: '#d3ecfa', fill: 26 },
    espresso:  { n: '에스프레소',  s: '에스프레소', i: '☕', c: '#4a2a1a', fill: 30 },
    milk:      { n: '스팀밀크',    s: '스팀밀크', i: '🥛', c: '#fbf5ec', fill: 40, foam: true },
    matcha:    { n: '말차 샷',     s: '말차',   i: '🍵', c: '#7fa650', fill: 30 },
    lavender:  { n: '라벤더 시럽', s: '라벤더', i: '💜', c: '#a98bd0', fill: 14 },
    protein:   { n: '프로틴 파우더', s: '프로틴', i: '💪', c: '#e4d5bf', fill: 12 },
    caramel:   { n: '카라멜 드리즐', s: '카라멜', i: '🍯', c: '#c98a36', fill: 7, topping: true },
    arabesque: { n: '아라베스크 아트', s: '아라베스크', i: '🩰', c: '#cbb4e8', fill: 5, topping: true },
    cinnamon:  { n: '턴아웃 시나몬 아트', s: '시나몬', i: '🍂', c: '#b0793f', fill: 5, topping: true }
  };
  const TRAY = ['ice', 'espresso', 'milk', 'matcha', 'lavender', 'protein', 'caramel', 'arabesque', 'cinnamon'];
  const CAPACITY = 96;

  /* ---------------- 메뉴 ---------------- */
  const DRINKS = [
    {
      id: 'americano', name: '아이스 아메리카노', price: 4500,
      img: 'assets/drink-americano.webp', recipe: ['ice', 'espresso'],
      lines: [
        '선생님 눈치 보느라 기 빨렸어요… 아이스 아메리카노 급해요!',
        '바에서 5분 서 있었더니 목말라요ㅠ 아아 하나 주세요!',
        '그랑 바뜨망 32번 하고 왔어요. 얼음 가득 아메리카노!'
      ]
    },
    {
      id: 'arabesque', name: '아라베스크 밀크', price: 6000,
      img: 'assets/drink-arabesque.webp', recipe: ['milk', 'lavender', 'arabesque'],
      lines: [
        '아라베스크 연습하다 팔이 안 올라가요… 라벤더 향으로 힐링할래요',
        '오늘은 발레보다 향이 필요해요. 아라베스크 밀크 주세요!',
        '무대 조명 아래서도 라벤더 향은 필수죠. 하나 부탁해요!'
      ]
    },
    {
      id: 'battement', name: '바뜨망 프로틴 라떼', price: 6500,
      img: 'assets/drink-battement.webp', recipe: ['espresso', 'protein', 'milk'],
      lines: [
        '근손실 방지 차원에서 바뜨망 프로틴 라떼요!',
        '바뜨망 100개 하고 왔어요. 단백질 충전이 필요해요!',
        '선생님이 근육 얘기만 하셔서… 프로틴 라떼 하나요!'
      ]
    },
    {
      id: 'turnout', name: '턴아웃 라떼', price: 5500,
      img: 'assets/drink-turnout.webp', recipe: ['espresso', 'milk', 'cinnamon'],
      lines: [
        '턴아웃이 안 돼서 속상해요. 시나몬 향으로 달래주세요',
        '오늘 턴아웃 180도 성공! 턴아웃 라떼로 자축할래요',
        '골반이 안 열려요… 턴아웃 라떼로 마음의 턴아웃을!'
      ]
    },
    {
      id: 'pirouette', name: '피루엣 라떼', price: 6000,
      img: null, fill: '#b97c3c', top: '#f2ddc4', recipe: ['espresso', 'caramel', 'milk'],
      lines: [
        '피루엣 3회전 하다 어질어질… 카라멜 달콤한 거 주세요',
        '무대에서 피루엣 성공했어요! 피루엣 라떼 주세요!',
        '피루엣 돌다가 커피가 생각났어요. 피루엣 라떼 하나요!'
      ]
    },
    {
      id: 'pointe', name: '포인 말차 라떼', price: 6500,
      img: null, fill: '#7fa650', top: '#eaf3da', recipe: ['matcha', 'milk', 'ice'],
      lines: [
        '포인 슈즈 새로 샀어요! 말차로 기념하고 싶어요',
        '발끝이 아파요… 포인 말차 라떼로 위로받을래요',
        '오늘은 초록색이 당겨요. 포인 말차 라떼 하나요!'
      ]
    }
  ];

  const CUSTOMERS = [
    { emoji: '🩰', role: '발레 3년차', name: '지수' },
    { emoji: '🦢', role: '취발러', name: '민서' },
    { emoji: '👑', role: '발레리나', name: '은서' },
    { emoji: '🎀', role: '입시생', name: '하윤' },
    { emoji: '🌷', role: '발레 선생님', name: '소연' },
    { emoji: '✨', role: '관객', name: '예린' },
    { emoji: '🧚', role: '유치부 엄마', name: '다인' },
    { emoji: '🐰', role: '발레 6개월차', name: '유나' }
  ];

  /* ---------------- 소리 ---------------- */
  const SFX = (() => {
    let ctx = null;
    let muted = false;
    try { muted = localStorage.getItem('sugarcafe.mute') === '1'; } catch (e) {}

    function ensure() {
      if (muted) return null;
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function tone(freq, dur, type, vol, slideTo, delay) {
      const c = ensure();
      if (!c) return;
      const t = c.currentTime + (delay || 0);
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol || 0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + dur + 0.03);
    }
    return {
      get muted() { return muted; },
      set muted(v) {
        muted = v;
        try { localStorage.setItem('sugarcafe.mute', v ? '1' : '0'); } catch (e) {}
      },
      warm() { ensure(); },
      add(n) { tone(500 + n * 60, 0.09, 'sine', 0.10); },
      clear() { tone(440, 0.16, 'triangle', 0.09, 200); },
      serve() {
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'triangle', 0.10, null, i * 0.065));
      },
      fail() {
        tone(210, 0.2, 'sawtooth', 0.075, 120);
        tone(150, 0.26, 'sine', 0.07, 90, 0.06);
      },
      combo() {
        [880, 1175, 1568].forEach((f, i) => tone(f, 0.1, 'square', 0.05, null, i * 0.06));
      },
      tick() { tone(1250, 0.045, 'sine', 0.05); },
      end() {
        [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, 'triangle', 0.085, null, i * 0.12));
      }
    };
  })();

  /* ---------------- 상태 ---------------- */
  const S = {
    phase: 'start', time: ROUND, revenue: 0, served: 0, miss: 0,
    combo: 0, maxCombo: 0, sold: {}, cup: [], order: null, upcoming: [],
    locked: false, raf: 0, last: 0, lastTick: -1
  };

  /* ---------------- DOM ---------------- */
  const el = {
    start: $('#s-start'), play: $('#s-play'), end: $('#s-end'),
    clock: $('#clock'), timeBar: $('#timeBar'), money: $('#money'), comboChip: $('#comboChip'),
    order: $('#order'), thumb: $('#orderThumb'), cusName: $('#cusName'),
    cusDrink: $('#cusDrink'), cusLine: $('#cusLine'), recipe: $('#recipe'),
    patience: $('#patienceBar'), queue: $('#queue'),
    layers: $('#layers'), cup: $('#cup'), cupTag: $('#cupTag'),
    tray: $('#tray'), actor: $('#actor'), actorCap: $('#actorCap'), flash: $('#serveFlash'),
    floaters: $('#floaters'), comboPop: $('#comboPop'), toast: $('#toast'),
    stage: $('.stage')
  };

  /* ---------------- 헬퍼 ---------------- */
  function won(n) { return '₩' + Math.round(n).toLocaleString('ko-KR'); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function sameBag(a, b) {
    if (a.length !== b.length) return false;
    const m = {};
    a.forEach(k => { m[k] = (m[k] || 0) + 1; });
    b.forEach(k => { if (!m[k]) { m[k] = -1; } else { m[k]--; } });
    return Object.values(m).every(v => v === 0);
  }
  function countOf(k) { return S.cup.filter(x => x === k).length; }

  let toastTimer = 0;
  function toast(msg, kind) {
    el.toast.textContent = msg;
    el.toast.className = 'toast on' + (kind ? ' ' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.className = 'toast'; }, 1300);
  }

  /* ---------------- 트레이 ---------------- */
  function buildTray() {
    el.tray.innerHTML = '';
    TRAY.forEach(key => {
      const ing = ING[key];
      const b = document.createElement('button');
      b.className = 'ing';
      b.type = 'button';
      b.dataset.k = key;
      b.innerHTML = '<span class="ico">' + ing.i + '</span><span class="nm">' + ing.n + '</span><span class="cnt">0</span>';
      b.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        addIng(key, b);
      }, { passive: false });
      el.tray.appendChild(b);
    });
  }

  function refreshTray() {
    [...el.tray.children].forEach(b => {
      const n = countOf(b.dataset.k);
      b.classList.toggle('has', n > 0);
      b.querySelector('.cnt').textContent = n > 0 ? '×' + n : '0';
    });
  }

  /* ---------------- 컵 ---------------- */
  function glassHeight() { return $('.cup-glass').clientHeight || 120; }

  // 컵 안에서의 시각적 순서(아래 → 위): 밀크가 가장 아래, 얼음이 위, 아트가 맨 위
  const RANK = { milk: 0, espresso: 1, matcha: 1, protein: 2, lavender: 3, ice: 4, caramel: 5, arabesque: 6, cinnamon: 6 };

  function renderCup() {
    el.cup.classList.toggle('is-empty', S.cup.length === 0);
    const H = glassHeight();
    const lastKey = S.cup[S.cup.length - 1];
    const visual = S.cup.slice().sort((a, b) => RANK[a] - RANK[b]);

    const liquids = visual.filter(k => !ING[k].topping);
    const liquidSum = liquids.reduce((s, k) => s + ING[k].fill, 0) || 1;
    // 한 잔을 다 만든 느낌이 나도록 액체는 컵의 86%까지 채운다
    const liquidH = H * 0.86 * Math.min(1, liquidSum / 62);

    el.layers.innerHTML = '';
    visual.forEach((k, i) => {
      const ing = ING[k];
      const node = document.createElement('div');
      node.className = 'layer' + (ing.topping ? ' topping' : '') + (ing.foam ? ' foam' : '');
      node.style.background = 'linear-gradient(180deg,' + ing.c + ',' + shade(ing.c, -14) + ')';
      const h = ing.topping ? 5 : Math.max(8, (ing.fill / liquidSum) * liquidH);
      node.style.height = h.toFixed(1) + 'px';
      if (i === visual.length - 1 && S.cup.length > 0) node.style.animation = 'pourIn .26s cubic-bezier(.3,.9,.3,1)';
      el.layers.appendChild(node);
    });

    el.cup.classList.remove('pop');
    void el.cup.offsetWidth;
    el.cup.classList.add('pop');
    refreshTray();
    updateCupTag();
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + amt));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    const b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function updateCupTag() {
    if (!S.order) return;
    if (S.cup.length === 0) {
      el.cupTag.textContent = '재료를 톡톡 담아 주세요';
      el.cupTag.classList.remove('ready');
    } else if (sameBag(S.cup, S.order.drink.recipe)) {
      el.cupTag.textContent = '레시피 완성! 서빙하세요 ✨';
      el.cupTag.classList.add('ready');
    } else {
      el.cupTag.textContent = S.cup.length + '개 담음 · 레시피와 비교해 보세요';
      el.cupTag.classList.remove('ready');
    }
  }

  function steamOn(on) {
    let st = $('.steam');
    if (!st) {
      st = document.createElement('div');
      st.className = 'steam';
      st.innerHTML = '<b></b><b></b><b></b>';
      el.cup.insertBefore(st, $('.cup-glass'));
    }
    st.classList.toggle('on', !!on);
  }

  function buzz(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
  }

  function addIng(key, btn) {
    if (S.phase !== 'play' || S.locked) return;
    if (S.cup.length >= 6) { toast('컵이 가득 찼어요! 비우고 다시 담아요'); return; }
    S.cup.push(key);
    SFX.add(S.cup.length);
    buzz(8);
    if (btn) {
      btn.classList.remove('flash');
      void btn.offsetWidth;
      btn.classList.add('flash');
    }
    renderCup();
    updateChips();
    steamOn(S.cup.some(k => k === 'milk' || k === 'espresso'));
  }

  function clearCup(silent) {
    if (S.phase !== 'play' || S.locked) return;
    if (!S.cup.length) { toast('컵이 이미 비어 있어요'); return; }
    S.cup = [];
    if (!silent) SFX.clear();
    el.layers.innerHTML = '';
    el.cup.classList.add('is-empty');
    refreshTray();
    updateChips();
    updateCupTag();
    steamOn(false);
  }

  /* ---------------- 주문 ---------------- */
  function makeOrder() {
    const pool = S.served < 1 ? [DRINKS[0]] : DRINKS;
    const d = pick(pool);
    const c = pick(CUSTOMERS);
    const extra = (d.recipe.length - 2) * 1.6;
    const patience = Math.max(8.5, 14.0 + extra - S.served * 0.4);
    return {
      drink: d, customer: c, line: pick(d.lines),
      patience: patience, max: patience
    };
  }

  function thumbMarkup(d) {
    if (d.img) return '<img src="' + d.img + '" alt="' + d.name + '">';
    return '<div class="mini" style="--fill:' + d.fill + ';--top:' + d.top + '"></div>';
  }

  function fillOrder() {
    const o = S.order;
    el.thumb.innerHTML = thumbMarkup(o.drink);
    el.thumb.classList.toggle('css-cup', !o.drink.img);
    el.cusName.textContent = o.customer.role + ' ' + o.customer.name;
    el.cusDrink.textContent = o.drink.name;
    el.cusLine.textContent = o.line;
    el.recipe.innerHTML = o.drink.recipe.map(k =>
      '<span class="chip" data-k="' + k + '"><i>' + ING[k].i + '</i>' + ING[k].s + '</span>'
    ).join('');
    el.patience.style.width = '100%';
    el.patience.classList.remove('low');
    el.order.style.animation = 'none';
    void el.order.offsetWidth;
    el.order.style.animation = '';
    updateChips();
    renderQueue();
  }

  function updateChips() {
    if (!S.order) return;
    const used = {};
    [...el.recipe.children].forEach(chip => {
      const k = chip.dataset.k;
      used[k] = (used[k] || 0) + 1;
      chip.classList.toggle('done', countOf(k) >= used[k]);
    });
  }

  function renderQueue() {
    el.queue.innerHTML = '<span class="qlabel">다음 손님</span>' +
      S.upcoming.map(o => '<div class="q">' + o.customer.emoji + '</div>').join('');
  }

  function nextOrder() {
    S.locked = true;
    el.order.classList.add('out');
    setTimeout(() => {
      el.order.classList.remove('out');
      S.order = S.upcoming.shift();
      if (!S.order) S.order = makeOrder();
      S.upcoming.push(makeOrder());
      S.cup = [];
      el.layers.innerHTML = '';
      refreshTray();
      steamOn(false);
      fillOrder();
      S.locked = false;
    }, 210);
  }

  /* ---------------- 점수 ---------------- */
  function multiplier() {
    if (S.combo >= 5) return 2.2;
    if (S.combo >= 4) return 2.0;
    if (S.combo >= 3) return 1.5;
    if (S.combo >= 2) return 1.2;
    return 1;
  }

  function floatText(txt) {
    const s = document.createElement('span');
    s.className = 'float';
    s.textContent = txt;
    el.floaters.appendChild(s);
    setTimeout(() => s.remove(), 1100);
  }

  function serve() {
    if (S.phase !== 'play' || S.locked) return;
    if (!S.cup.length) { toast('아직 컵이 비었어요! 재료를 담아 주세요'); return; }
    if (sameBag(S.cup, S.order.drink.recipe)) success();
    else fail();
  }

  function success() {
    S.locked = true;
    const o = S.order;
    S.combo++;
    S.maxCombo = Math.max(S.maxCombo, S.combo);
    const mult = multiplier();
    const fast = o.patience / o.max;
    const tip = Math.round(o.drink.price * (0.12 + 0.30 * fast) / 100) * 100;
    const amount = Math.round((o.drink.price * mult + tip) / 100) * 100;
    S.revenue += amount;
    S.served++;
    S.sold[o.drink.id] = (S.sold[o.drink.id] || 0) + 1;

    SFX.serve();
    buzz(26);
    floatText('+' + won(amount));
    el.money.textContent = won(S.revenue);
    el.money.classList.remove('bump');
    void el.money.offsetWidth;
    el.money.classList.add('bump');

    el.flash.classList.add('on');
    setTimeout(() => { el.flash.classList.remove('on'); }, 1200);

    if (S.combo >= 2) {
      el.comboChip.innerHTML = '<b>×' + S.combo + '</b> COMBO';
      el.comboChip.classList.add('on');
    }
    if (S.combo >= 2) {
      el.comboPop.textContent = 'COMBO ×' + S.combo + (mult > 1 ? '  ×' + mult : '');
      el.comboPop.classList.remove('on');
      void el.comboPop.offsetWidth;
      el.comboPop.classList.add('on');
      SFX.combo();
    }
    if (S.combo % 5 === 0) {
      S.time = Math.min(99, S.time + 3);
      toast('콤보 보너스! 영업 시간 +3초 ⏱', 'good');
    }
    setTimeout(() => {
      S.cup = [];
      el.layers.innerHTML = '';
      refreshTray();
      updateChips();
      updateCupTag();
      steamOn(false);
    }, 600);
    setTimeout(nextOrder, 1000);
  }

  function fail() {
    S.locked = true;
    SFX.fail();
    el.cup.classList.remove('bad');
    void el.cup.offsetWidth;
    el.cup.classList.add('bad');
    el.stage.classList.remove('shake');
    void el.stage.offsetWidth;
    el.stage.classList.add('shake');
    toast('레시피가 달라요 😳 콤보가 끊겼어요');
    S.combo = 0;
    el.comboChip.classList.remove('on');
    S.miss++;
    S.cup = [];
    el.layers.innerHTML = '';
    refreshTray();
    updateChips();
    steamOn(false);
    setTimeout(nextOrder, 750);
  }

  function timeoutCustomer() {
    S.locked = true;
    SFX.fail();
    toast('손님이 기다리다 가버렸어요 😢');
    S.combo = 0;
    el.comboChip.classList.remove('on');
    S.miss++;
    S.cup = [];
    el.layers.innerHTML = '';
    refreshTray();
    steamOn(false);
    setTimeout(nextOrder, 600);
  }

  /* ---------------- 타이머 ---------------- */
  function updateHud() {
    el.clock.textContent = Math.ceil(S.time);
    const pct = Math.max(0, S.time / ROUND) * 100;
    el.timeBar.style.width = pct + '%';
    el.timeBar.classList.toggle('low', S.time <= 10);

    const sec = Math.ceil(S.time);
    if (sec <= 5 && sec !== S.lastTick && sec > 0) {
      S.lastTick = sec;
      SFX.tick();
    }
  }

  function updatePatience(dt) {
    const o = S.order;
    if (!o) return;
    o.patience -= dt;
    if (o.patience <= 0) {
      o.patience = 0;
      el.patience.style.width = '0%';
      el.patience.classList.add('low');
      if (!S.locked) timeoutCustomer();
      return;
    }
    const p = o.patience / o.max;
    el.patience.style.width = (p * 100).toFixed(1) + '%';
    el.patience.classList.toggle('low', p < 0.33);
  }

  function loop(t) {
    if (S.phase !== 'play') return;
    if (!S.last) S.last = t;
    let dt = (t - S.last) / 1000;
    S.last = t;
    if (dt > 0.5) dt = 0.5;

    S.time -= dt;
    updatePatience(dt);
    updateHud();
    if (S.time <= 0) { S.time = 0; updateHud(); endGame(); return; }
    S.raf = requestAnimationFrame(loop);
  }

  /* ---------------- 화면 전환 ---------------- */
  function show(screen) {
    [el.start, el.play, el.end].forEach(s => s.classList.remove('on'));
    screen.classList.add('on');
  }

  function startGame() {
    SFX.warm();
    S.phase = 'play';
    S.time = ROUND; S.revenue = 0; S.served = 0; S.miss = 0;
    S.combo = 0; S.maxCombo = 0; S.sold = {}; S.cup = []; S.locked = false;
    S.last = 0; S.lastTick = -1;
    S.order = makeOrder();
    S.upcoming = [makeOrder(), makeOrder()];
    S.order = S.served < 1 ? S.order : S.order;
    el.money.textContent = won(0);
    el.comboChip.classList.remove('on');
    el.layers.innerHTML = '';
    refreshTray();
    steamOn(false);
    fillOrder();
    updateHud();
    el.flash.classList.remove('on');
    show(el.play);
    setTimeout(() => toast('레시피 칩을 보고 재료를 톡톡! 순서는 상관없어요'), 450);
    cancelAnimationFrame(S.raf);
    S.raf = requestAnimationFrame(loop);
  }

  const GRADES = [
    { min: 0,      name: '새싹 바리스타 🌱', msg: '첫 영업 완료! 내일은 더 잘할 거예요.' },
    { min: 90000,  name: '견습 바리스타 ☕', msg: '손이 조금씩 풀리고 있어요. 콤보를 노려 봐요!' },
    { min: 180000, name: '정식 바리스타 🎀', msg: '레시피가 손에 익었네요. 오늘 카페가 따뜻했어요.' },
    { min: 270000, name: '시니어 바리스타 👑', msg: '손님들이 줄을 서도 끄떡없는 솜씨예요!' },
    { min: 360000, name: '슈가 발레 카페 점장 🩰', msg: '완벽해요. 오늘 카페는 당신의 무대였어요!' }
  ];

  function endGame() {
    S.phase = 'end';
    cancelAnimationFrame(S.raf);
    SFX.end();

    let grade = GRADES[0];
    GRADES.forEach(g => { if (S.revenue >= g.min) grade = g; });
    $('#gradeName').textContent = grade.name;
    $('#gradeMsg').textContent = grade.msg;
    $('#rRevenue').textContent = won(S.revenue);
    $('#rServed').textContent = S.served + '잔';
    $('#rCombo').textContent = '×' + S.maxCombo;
    $('#rMiss').textContent = S.miss + '건';

    let bestId = null, bestN = 0;
    Object.keys(S.sold).forEach(k => { if (S.sold[k] > bestN) { bestN = S.sold[k]; bestId = k; } });
    const bestDrink = bestId ? DRINKS.find(d => d.id === bestId) : null;
    $('#rBest').textContent = bestDrink ? bestDrink.name + ' ' + bestN + '잔' : '—';

    let best = 0;
    try { best = parseInt(localStorage.getItem('sugarcafe.best') || '0', 10) || 0; } catch (e) {}
    const isNew = S.revenue > best;
    if (isNew) { try { localStorage.setItem('sugarcafe.best', String(S.revenue)); } catch (e) {} }
    const bestRow = $('#bestRow');
    bestRow.textContent = isNew ? '🎉 최고 매출 갱신! ' + won(S.revenue) : '최고 매출 ' + won(best || S.revenue);
    bestRow.classList.toggle('new', isNew);

    refreshBestLabel();
    show(el.end);
  }

  function refreshBestLabel() {
    let best = 0;
    try { best = parseInt(localStorage.getItem('sugarcafe.best') || '0', 10) || 0; } catch (e) {}
    $('#bestStart').textContent = best ? '최고 매출 ' + won(best) : '최고 매출 —';
  }

  /* ---------------- 소리 토글 ---------------- */
  function paintMute() {
    const txt = SFX.muted ? '🔇 소리 꺼짐' : '🔊 소리 켜짐';
    $('#muteStart').textContent = txt;
    $('#mutePlay').textContent = SFX.muted ? '🔇' : '🔊';
  }
  function toggleMute() {
    SFX.muted = !SFX.muted;
    if (!SFX.muted) SFX.warm();
    paintMute();
  }

  /* ---------------- 이벤트 ---------------- */
  $('#startBtn').addEventListener('click', startGame);
  $('#againBtn').addEventListener('click', startGame);
  $('#homeBtn').addEventListener('click', () => {
    S.phase = 'start';
    cancelAnimationFrame(S.raf);
    refreshBestLabel();
    show(el.start);
  });
  $('#muteStart').addEventListener('click', toggleMute);
  $('#mutePlay').addEventListener('click', toggleMute);
  $('#serveBtn').addEventListener('click', serve);
  $('#clearBtn').addEventListener('click', () => clearCup(false));

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && S.phase === 'play') serve();
    if (e.key === 'Backspace' && S.phase === 'play') { e.preventDefault(); clearCup(false); }
    if (e.key === '1' && S.phase === 'play') serve();
  });

  window.addEventListener('resize', () => { if (S.phase === 'play') renderCup(); });

  /* ---------------- 초기화 ---------------- */
  buildTray();
  paintMute();
  refreshBestLabel();
  presetPreview();

  // 시작 화면 뒤로 보이는 미리보기용 컵 (첫 화면엔 보이지 않지만 초기화 안전)
  function presetPreview() {}

  // 테스트용 상태 노출 (?debug 붙였을 때만)
  if (location.search.indexOf('debug') >= 0) window.__cafe = { S, serve: serve, clear: clearCup, makeOrder: makeOrder, fillOrder: fillOrder, DRINKS };
})();
