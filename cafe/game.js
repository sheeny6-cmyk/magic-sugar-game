/* ===== ☕ 슈가 발레 카페 타이쿤 · v2 (섞기 손맛 · 손님 반응 · 다시 해볼 이유) ===== */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);

  /* 섞는 손맛이 더해져 영업 시간을 60초 → 75초로 넉넉하게 */
  const ROUND = 75;
  const STIR_DIST = 700;   // 컵 위를 이만큼(px) 문지르면 100% (약 0.6~0.8초의 경쾌한 스와이프)
  const STIR_HOLD = 30;    // 꾹 누르고만 있어도 1초에 차오르는 %
  const SERVE_MS = 1200;   // 반응 카드 노출 (탭하면 바로 스킵)

  /* ---------------- 재료 ---------------- */
  // 이름은 주문 카드 칩과 트레이 버튼에 똑같이 쓰는 하나의 값(n)만 둡니다.
  // 두 곳에 다른 이름을 쓰면 찾기 어려워지므로 절대 따로 적지 마세요.
  const ING = {
    ice:       { n: '얼음',       i: '🧊', c: '#d3ecfa', fill: 26 },
    espresso:  { n: '에스프레소', i: '☕', c: '#4a2a1a', fill: 30 },
    milk:      { n: '스팀밀크',   i: '🥛', c: '#fbf5ec', fill: 40, foam: true },
    matcha:    { n: '말차',       i: '🍵', c: '#7fa650', fill: 30 },
    lavender:  { n: '라벤더',     i: '💜', c: '#a98bd0', fill: 14 },
    protein:   { n: '프로틴',     i: '💪', c: '#e4d5bf', fill: 12 },
    caramel:   { n: '카라멜',     i: '🍯', c: '#c98a36', fill: 7, topping: true },
    arabesque: { n: '아라베스크', i: '🩰', c: '#cbb4e8', fill: 5, topping: true },
    cinnamon:  { n: '시나몬',     i: '🍂', c: '#b0793f', fill: 5, topping: true }
  };
  const TRAY = ['ice', 'espresso', 'milk', 'matcha', 'lavender', 'protein', 'caramel', 'arabesque', 'cinnamon'];

  /* ---------------- 메뉴 ---------------- */
  // react = 손님이 그 음료를 마신 뒤 벌어지는 마법 반응(성공 카드에 크게 표시)
  const DRINKS = [
    {
      id: 'americano', name: '아이스 아메리카노', price: 4500,
      img: 'assets/drink-americano.webp', recipe: ['ice', 'espresso'],
      react: '눈 번쩍! 선생님 잔소리 방어막 생성 완료!',
      lines: [
        '선생님 눈치 보느라 기 빨렸어요… 아이스 아메리카노 급해요!',
        '바에서 5분 서 있었더니 목말라요ㅠ 아아 하나 주세요!',
        '그랑 바뜨망 32번 하고 왔어요. 얼음 가득 아메리카노!',
        '연습 끝나고 머리 식히는 건 역시 아아죠. 하나만요!'
      ]
    },
    {
      id: 'arabesque', name: '아라베스크 밀크', price: 6000,
      img: 'assets/drink-arabesque.webp', recipe: ['milk', 'lavender', 'arabesque'],
      react: '라벤더 향 맡자마자 팔이 하늘까지 올라가요~',
      lines: [
        '아라베스크 연습하다 팔이 안 올라가요… 라벤더 향으로 힐링할래요',
        '오늘은 발레보다 향이 필요해요. 아라베스크 밀크 주세요!',
        '무대 조명 아래서도 라벤더 향은 필수죠. 하나 부탁해요!',
        '어깨가 굳었어요… 라벤더 향으로 녹여 주세요'
      ]
    },
    {
      id: 'battement', name: '바뜨망 프로틴 라떼', price: 6500,
      img: 'assets/drink-battement.webp', recipe: ['espresso', 'protein', 'milk'],
      react: '근손실 제로! 팔근육 뿜뿜하며 그랑 바뜨망 100개 가능!!',
      lines: [
        '근손실 방지 차원에서 바뜨망 프로틴 라떼요!',
        '바뜨망 100개 하고 왔어요. 단백질 충전이 필요해요!',
        '선생님이 근육 얘기만 하셔서… 프로틴 라떼 하나요!',
        '내일 발표회라 근손실은 절대 안 돼요. 프로틴으로!'
      ]
    },
    {
      id: 'turnout', name: '턴아웃 라떼', price: 5500,
      img: 'assets/drink-turnout.webp', recipe: ['espresso', 'milk', 'cinnamon'],
      react: '어?! 갑자기 다리가 180도로 쫙 벌어졌어요!! 🦵✨',
      lines: [
        '턴아웃이 안 돼서 속상해요. 시나몬 향으로 달래주세요',
        '오늘 턴아웃 180도 성공! 턴아웃 라떼로 자축할래요',
        '골반이 안 열려요… 턴아웃 라떼로 마음의 턴아웃을!',
        '선생님이 제 턴아웃 보고 한숨 쉬셨어요… 위로가 필요해요'
      ]
    },
    {
      id: 'pirouette', name: '피루엣 라떼', price: 6000,
      img: null, fill: '#b97c3c', top: '#f2ddc4', garnish: '🍯', recipe: ['espresso', 'caramel', 'milk'],
      react: '어질어질… 저 지금 제자리에서 3회전 도는 중이에요!! 🌪️',
      lines: [
        '피루엣 3회전 하다 어질어질… 카라멜 달콤한 거 주세요',
        '무대에서 피루엣 성공했어요! 피루엣 라떼 주세요!',
        '피루엣 돌다가 커피가 생각났어요. 피루엣 라떼 하나요!',
        '카라멜 향만 맡아도 기분이 돌아요… 한 잔 부탁해요'
      ]
    },
    {
      id: 'pointe', name: '포인 말차 라떼', price: 6500,
      img: null, fill: '#7fa650', top: '#eaf3da', garnish: '🍃', recipe: ['matcha', 'milk', 'ice'],
      react: '발끝 포인에 힘 꽉! 토슈즈 위에서 10초 버텼어요!',
      lines: [
        '포인 슈즈 새로 샀어요! 말차로 기념하고 싶어요',
        '발끝이 아파요… 포인 말차 라떼로 위로받을래요',
        '오늘은 초록색이 당겨요. 포인 말차 라떼 하나요!',
        '토슈즈 첫 주라 발이 난리예요. 말차로 달래 주세요'
      ]
    }
  ];

  /* ---------------- 손님 ---------------- */
  const CUSTOMERS = [
    { emoji: '🩰', role: '발레 3년차', name: '지수' },
    { emoji: '🦢', role: '취발러', name: '민서' },
    { emoji: '👑', role: '발레리나', name: '은서' },
    { emoji: '🎀', role: '입시생', name: '하윤' },
    { emoji: '🌷', role: '발레 선생님', name: '소연' },
    { emoji: '✨', role: '관객', name: '예린' },
    { emoji: '🧚', role: '유치부 엄마', name: '다인' },
    { emoji: '🐰', role: '발레 6개월차', name: '유나' },
    { emoji: '🎬', role: '발레 유튜버', name: '소미' },
    { emoji: '🍼', role: '막내 발레리나', name: '하린' },
    { emoji: '🕺', role: '발레 아빠', name: '정우' }
  ];

  // 깜짝 손님: 가끔 등장해 특별 대사 + 보너스를 준다(인내심 계수로 난이도가 갈린다)
  const SURPRISE = [
    {
      emoji: '🧐', role: '깜짝 손님', name: '엄격한 원장님', surprise: true, bonus: 2500, patience: 0.82,
      lines: [
        '오늘은 내가 직접 맛을 보겠네. 자네 실력을 보여 주게.',
        '발표회 앞두고 카페 풍경이 궁금해서 왔어. 서두르지 말고.'
      ],
      react: '음… 나쁘지 않군. 다음 주 발표회 솔로는 자네가 맡게.'
    },
    {
      emoji: '🩰', role: '깜짝 손님', name: '공연 5분 전 주역', surprise: true, bonus: 3000, patience: 0.7,
      lines: [
        '공연 5분 전이에요!! 목 축이고 싶어요, 빨리요!',
        '무대 대기 중인데 손이 떨려요… 딱 한 잔만요!'
      ],
      react: '마셨더니 다리 떨림이 사라졌어요! 무대 위에서 32바뜨망 갑니다!'
    },
    {
      emoji: '🎀', role: '깜짝 손님', name: '토슈즈 첫날 취발러', surprise: true, bonus: 1800, patience: 1.15,
      lines: [
        '오늘 토슈즈 처음 신었어요! 기념으로 뭐 마실래요?',
        '발끝은 아프지만 기분은 좋아요! 달콤한 거 주세요'
      ],
      react: '토슈즈 첫날에 이런 맛이라니… 평생 기억할 것 같아요!'
    }
  ];

  /* ---------------- 엉뚱한 음료 사고 반응 ---------------- */
  const ACCIDENT_RANDOM = [
    '이건 발레가 아니라 마법약인데요?! 😵‍💫',
    '다리는 안 벌어지고 눈만 커졌어요… 👀',
    '발레복이 거꾸로 입혀진 기분이에요… 🩰',
    '이 맛은 아라베스크가 아니라 아라베스코예요… 🤔',
    '선생님, 제 컵이 아니라 마법 지팡이가 됐어요 🪄'
  ];

  function accidentFor(cup, order) {
    const has = k => cup.indexOf(k) >= 0;
    const cnt = k => cup.filter(x => x === k).length;
    if (has('matcha') && has('protein')) {
      return { key: 'matchaProtein', text: '초록 괴물 파워가 솟아올라요… 선생님 도망쳐요! 🤢💪' };
    }
    if (cnt('espresso') >= 2 || (cup.length === 1 && has('espresso'))) {
      return { key: 'espresso', text: '심장이 파드샤 속도로 뛰기 시작했어요!! 💓⚡' };
    }
    if (order && order.drink.id === 'americano' && !has('ice')) {
      return { key: 'noIce', text: '앗 뜨거!! 웜업 10분치 한 번에 끝났어요 🔥' };
    }
    if (has('lavender') && has('cinnamon')) {
      return { key: 'potion', text: '신비의 마법 포션… 공중부양할 것 같아요 🪄' };
    }
    return { key: 'random', text: pick(ACCIDENT_RANDOM) };
  }

  /* ---------------- 소리 ---------------- */
  const SFX = (() => {
    let ctx = null;
    let noise = null;
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
    // 부드러운 "쓱쓱" 섞기 소리: 짧은 노이즈를 밴드패스로 걸러 물소리처럼
    function swish(c) {
      if (!noise) {
        noise = c.createBuffer(1, Math.floor(c.sampleRate * 0.22), c.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      const t = c.currentTime;
      const s = c.createBufferSource();
      s.buffer = noise;
      const f = c.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(900 + Math.random() * 700, t);
      f.Q.value = 1.1;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.025);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
      s.connect(f); f.connect(g); g.connect(c.destination);
      s.start(t); s.stop(t + 0.2);
    }
    return {
      get muted() { return muted; },
      set muted(v) {
        muted = v;
        try { localStorage.setItem('sugarcafe.mute', v ? '1' : '0'); } catch (e) {}
      },
      warm() { ensure(); },
      add(n) { tone(500 + n * 60, 0.09, 'sine', 0.10); },
      stir() { const c = ensure(); if (!c) return; swish(c); },
      ready() { [1047, 1319, 1568].forEach((f, i) => tone(f, 0.12, 'triangle', 0.075, null, i * 0.055)); },
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
    locked: false, raf: 0, last: 0, lastTick: -1,
    stir: 0, stirHintShown: false,
    stats: { accidents: {}, surprise: 0 }
  };

  /* ---------------- DOM ---------------- */
  const el = {
    start: $('#s-start'), play: $('#s-play'), end: $('#s-end'),
    clock: $('#clock'), timeBar: $('#timeBar'), money: $('#money'), comboChip: $('#comboChip'),
    order: $('#order'), thumb: $('#orderThumb'), cusName: $('#cusName'), guestBadge: $('#guestBadge'),
    cusDrink: $('#cusDrink'), cusLine: $('#cusLine'), recipe: $('#recipe'),
    patience: $('#patienceBar'), queue: $('#queue'),
    layers: $('#layers'), cup: $('#cup'), cupArea: $('#cupArea'), cupTag: $('#cupTag'),
    stir: $('#stir'), stirFill: $('#stirFill'), stirTxt: $('#stirTxt'),
    tray: $('#tray'), serveBtn: $('#serveBtn'), clearBtn: $('#clearBtn'),
    flash: $('#serveFlash'), serveCard: $('#serveCard'), servePic: $('#servePic'),
    serveTag: $('#serveTag'), serveDrinkName: $('#serveDrinkName'), serveWho: $('#serveWho'),
    serveLine: $('#serveLine'), serveBonus: $('#serveBonus'),
    floaters: $('#floaters'), comboPop: $('#comboPop'), toast: $('#toast'),
    shareBtn: $('#shareBtn'),
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
  function hex(n) { return ('000000' + n.toString(16)).slice(-6); }
  function blend(cols) {
    if (!cols.length) return '#cbb4e8';
    let r = 0, g = 0, b = 0;
    cols.forEach(h => {
      const n = parseInt(h.slice(1), 16);
      r += n >> 16; g += (n >> 8) & 255; b += n & 255;
    });
    const ch = v => Math.max(0, Math.min(255, Math.round(v / cols.length)));
    return '#' + hex((ch(r) << 16) + (ch(g) << 8) + ch(b));
  }

  let toastTimer = 0;
  function toast(msg, kind) {
    el.toast.textContent = msg;
    el.toast.className = 'toast on' + (kind ? ' ' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.className = 'toast'; }, 1300);
  }

  function buzz(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
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
    const H = glassHeight();
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
    paintStirButtons();
  }

  function shade(hexc, amt) {
    const n = parseInt(hexc.slice(1), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + amt));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    const b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + hex((r << 16) + (g << 8) + b);
  }

  function updateCupTag() {
    if (!S.order) return;
    const has = S.cup.length > 0;
    const match = has && sameBag(S.cup, S.order.drink.recipe);
    if (!has) {
      el.cupTag.textContent = '재료를 톡톡 담아 주세요';
      el.cupTag.classList.remove('ready');
    } else if (match && S.stir >= 100) {
      el.cupTag.textContent = '완성! 서빙하세요 ✨';
      el.cupTag.classList.add('ready');
    } else if (match) {
      el.cupTag.textContent = '레시피 OK · 쓱쓱 섞어 주세요';
      el.cupTag.classList.remove('ready');
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

  /* ---------------- 섞기(손맛) ---------------- */
  const stirPtr = { on: false, x: 0, y: 0, last: 0, raf: 0, snd: 0, buzzT: 0 };
  let lastStirPct = -1;

  function paintStirButtons() {
    const has = S.cup.length > 0;
    const full = has && S.stir >= 100;
    el.serveBtn.classList.toggle('wait', has && !full);
    el.serveBtn.classList.toggle('ready', full);
    el.serveBtn.textContent = has && !full ? '컵을 섞어 주세요' : '서빙하기';
    el.serveBtn.setAttribute('aria-disabled', (has && !full) ? 'true' : 'false');
  }

  function paintStir(force) {
    const e = S.stir / 100;
    el.cup.style.setProperty('--e', e.toFixed(3));
    el.stirFill.style.width = (e * 100).toFixed(1) + '%';
    const has = S.cup.length > 0;
    const full = has && S.stir >= 100;
    el.stir.classList.toggle('full', full);
    el.cup.classList.toggle('ready', full);
    el.cup.classList.toggle('is-empty', !has);
    el.cup.classList.toggle('hint', has && !full && !S.locked && S.phase === 'play');

    const pct = Math.round(S.stir);
    if (force || pct !== lastStirPct) {
      lastStirPct = pct;
      el.stirTxt.textContent = !has ? '재료를 담으면 섞을 수 있어요'
        : !full ? '쓱쓱 문질러 섞기 ' + pct + '%'
        : '섞기 완료! ✨';
      updateCupTag();
    }
    paintStirButtons();
  }

  function resetStir() {
    S.stir = 0;
    lastStirPct = -1;
    el.cup.classList.remove('ready');
    paintStir(true);
  }

  function stirAdd(amount, passive) {
    if (S.phase !== 'play' || S.locked) return;
    if (!S.cup.length || S.stir >= 100) return;
    S.stir = Math.min(100, S.stir + amount);
    const now = performance.now();
    if (now - stirPtr.snd > (passive ? 170 : 110)) { stirPtr.snd = now; SFX.stir(); }
    if (!passive && now - stirPtr.buzzT > 96) { stirPtr.buzzT = now; buzz(6); }
    paintStir(false);
    if (S.stir >= 100) completeStir();
  }

  function completeStir() {
    S.stir = 100;
    stirPtr.on = false;
    if (stirPtr.raf) { cancelAnimationFrame(stirPtr.raf); stirPtr.raf = 0; }
    stirPtr.snd = 0;
    paintStir(true);
    el.cup.classList.remove('ready');
    void el.cup.offsetWidth;
    el.cup.classList.add('ready');
    SFX.ready();
    buzz([14, 45, 24]);
    floatText('완성! ✨');
  }

  function stirHold(t) {
    if (!stirPtr.on) { stirPtr.raf = 0; return; }
    let dt = (t - (stirPtr.last || t)) / 1000;
    stirPtr.last = t;
    if (dt > 0.12) dt = 0.12;
    // 스와이프가 아니어도 꾹 누르고 있으면 서서히 차오른다(오작동·편의 대비)
    stirAdd(STIR_HOLD * dt, true);
    stirPtr.raf = requestAnimationFrame(stirHold);
  }

  function onStirDown(ev) {
    if (S.phase !== 'play' || S.locked) return;
    if (!S.cup.length) { toast('컵에 재료를 먼저 담아 주세요'); return; }
    if (S.stir >= 100) return;
    ev.preventDefault();
    stirPtr.on = true;
    stirPtr.x = ev.clientX; stirPtr.y = ev.clientY;
    stirPtr.last = performance.now();
    try { el.cupArea.setPointerCapture(ev.pointerId); } catch (e) {}
    if (!stirPtr.raf) stirPtr.raf = requestAnimationFrame(stirHold);
  }

  function onStirMove(ev) {
    if (!stirPtr.on) return;
    const dx = ev.clientX - stirPtr.x, dy = ev.clientY - stirPtr.y;
    stirPtr.x = ev.clientX; stirPtr.y = ev.clientY;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 1) stirAdd(d * (100 / STIR_DIST), false);
  }

  function onStirUp() {
    if (!stirPtr.on) return;
    stirPtr.on = false;
    if (stirPtr.raf) { cancelAnimationFrame(stirPtr.raf); stirPtr.raf = 0; }
  }

  /* ---------------- 재료 담기 ---------------- */
  function addIng(key, btn) {
    if (S.phase !== 'play' || S.locked) return;
    if (S.cup.length >= 6) { toast('컵이 가득 찼어요! 비우고 다시 담아요'); return; }
    S.cup.push(key);
    S.stir = 0;
    lastStirPct = -1;
    el.cup.classList.remove('ready');
    SFX.add(S.cup.length);
    buzz(8);
    if (btn) {
      btn.classList.remove('flash');
      void btn.offsetWidth;
      btn.classList.add('flash');
    }
    renderCup();
    paintStir(true);
    updateChips();
    steamOn(S.cup.some(k => k === 'milk' || k === 'espresso'));

    // 첫 재료를 담았을 때만 섞는 법을 알려 준다
    if (!S.stirHintShown) {
      S.stirHintShown = true;
      setTimeout(() => { if (S.phase === 'play') toast('컵을 손가락으로 쓱쓱 문질러 섞어 보세요!'); }, 300);
    }
  }

  function clearCup(silent) {
    if (S.phase !== 'play' || S.locked) return;
    if (!S.cup.length) { toast('컵이 이미 비어 있어요'); return; }
    S.cup = [];
    if (!silent) SFX.clear();
    el.layers.innerHTML = '';
    refreshTray();
    updateChips();
    resetStir();
    steamOn(false);
  }

  /* ---------------- 주문 ---------------- */
  // 셔플 백: 6종을 한 바퀴씩 골고루. 새 바구니를 섞을 때도 직전 메뉴가 맨 앞에 오지 않게 한다.
  let bag = [];
  let lastDrinkId = null;

  function refillBag() {
    bag = DRINKS.map(d => d.id);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = bag[i]; bag[i] = bag[j]; bag[j] = t;
    }
    if (bag[0] === lastDrinkId && bag.length > 1) {
      const j = 1 + Math.floor(Math.random() * (bag.length - 1));
      const t = bag[0]; bag[0] = bag[j]; bag[j] = t;
    }
  }

  function nextDrink() {
    if (!bag.length) refillBag();
    const id = bag.shift();
    lastDrinkId = id;
    return DRINKS.filter(d => d.id === id)[0];
  }

  function makeOrder() {
    const d = nextDrink();
    const surprise = S.served >= 2 && Math.random() < 0.24;
    const c = surprise ? pick(SURPRISE) : pick(CUSTOMERS);
    const extra = (d.recipe.length - 2) * 1.6;
    let patience = Math.max(8.5, 14.0 + extra - S.served * 0.4);
    if (c.patience) patience *= c.patience;
    patience = Math.max(7.5, patience);
    return {
      drink: d, customer: c,
      line: c.lines ? pick(c.lines) : pick(d.lines),
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
    el.cusName.textContent = o.customer.surprise ? o.customer.name : o.customer.role + ' ' + o.customer.name;
    el.cusDrink.textContent = o.drink.name;
    el.cusLine.textContent = o.line;
    el.order.classList.toggle('is-guest', !!o.customer.surprise);
    el.recipe.innerHTML = o.drink.recipe.map(k =>
      '<span class="chip" data-k="' + k + '"><i>' + ING[k].i + '</i>' + ING[k].n + '</span>'
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
      S.upcoming.map(o =>
        '<div class="q' + (o.customer.surprise ? ' sur' : '') + '">' + o.customer.emoji + '</div>'
      ).join('');
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
      resetStir();
      fillOrder();
      S.locked = false;
      paintStir(true);
    }, 210);
  }

  /* ---------------- 반응 카드 ---------------- */
  let serveHideT = 0, nextT = 0;

  function serveMarkup(d) {
    if (d.img) return '<img src="' + d.img + '" alt="' + d.name + '">';
    return '<div class="bigcup" style="--fill:' + d.fill + ';--top:' + d.top + '">' +
      '<span class="bigcup-steam"><b></b><b></b></span>' +
      '<div class="bigcup-glass"><div class="bigcup-art"></div><div class="bigcup-shine"></div></div>' +
      '<div class="bigcup-plate"></div>' +
      '<span class="bigcup-garnish">' + (d.garnish || '🩰') + '</span></div>';
  }

  // 실제로 만든(엉뚱한) 컵: 재료 색을 섞어 마법약처럼 보여 준다
  function potionMarkup(cup) {
    const base = blend(cup.map(k => ING[k].c));
    return '<div class="bigcup" style="--fill:' + base + ';--top:' + shade(base, 26) + '">' +
      '<span class="bigcup-steam"><b></b><b></b></span>' +
      '<div class="bigcup-glass"><div class="bigcup-art weird">?</div><div class="bigcup-shine"></div></div>' +
      '<div class="bigcup-plate"></div>' +
      '<span class="bigcup-garnish">🧪</span></div>';
  }

  function cupName(cup) {
    const uniq = [];
    cup.forEach(k => { if (uniq.indexOf(k) < 0) uniq.push(k); });
    return uniq.slice(0, 3).map(k => ING[k].n).join('·') + (uniq.length > 3 ? ' 외' : '') + ' 컵';
  }

  // 문장 끝 이모지가 줄바꿈으로 따로 떨어지지 않게 마지막 띄어쓰기를 묶는다
  function glueEmoji(s) {
    return String(s).replace(/ (\S*[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}][^\s]*)$/u, '\u00A0$1');
  }

  function showServe(d) {
    el.serveTag.textContent = d.kind === 'accident' ? '💥 엉뚱 사고'
      : d.kind === 'surprise' ? '🎁 깜짝 손님 성공' : '성공 ✨';
    el.servePic.innerHTML = d.pic;
    el.servePic.classList.toggle('css', d.css !== false);
    el.serveDrinkName.textContent = d.drinkName;
    el.serveWho.textContent = d.who;
    el.serveLine.textContent = '“' + glueEmoji(d.line) + '”';
    el.serveBonus.textContent = d.bonus || '';
    el.flash.classList.remove('accident', 'surprise');
    if (d.kind === 'accident') el.flash.classList.add('accident');
    if (d.kind === 'surprise') el.flash.classList.add('surprise');
    el.flash.classList.add('on');
    clearTimeout(serveHideT);
    serveHideT = setTimeout(hideServe, SERVE_MS);
  }

  function hideServe() {
    clearTimeout(serveHideT); serveHideT = 0;
    el.flash.classList.remove('on');
  }

  function skipServe() {
    // 카드를 탭하면 다음 손님으로: 예약된 전환을 취소하고 바로 넘긴다(한 번만).
    if (!nextT) return;
    clearTimeout(nextT); nextT = 0;
    hideServe();
    nextOrder();
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
    if (S.stir < 100) {
      toast('컵을 쓱쓱 문질러 섞어 주세요!');
      el.cup.classList.remove('hint');
      void el.cup.offsetWidth;
      el.cup.classList.add('hint');
      return;
    }
    if (sameBag(S.cup, S.order.drink.recipe)) success(); else fail();
  }

  function success() {
    S.locked = true;
    const o = S.order;
    const surprise = !!o.customer.surprise;
    S.combo++;
    S.maxCombo = Math.max(S.maxCombo, S.combo);
    const mult = multiplier();
    const fast = o.patience / o.max;
    const tip = Math.round(o.drink.price * (0.12 + 0.30 * fast) / 100) * 100;
    let amount = Math.round((o.drink.price * mult + tip) / 100) * 100;
    if (surprise) { amount += o.customer.bonus || 0; S.stats.surprise++; }
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

    clearTimeout(nextT);
    nextT = setTimeout(() => { nextT = 0; hideServe(); nextOrder(); }, SERVE_MS);
    showServe({
      kind: surprise ? 'surprise' : 'success',
      pic: serveMarkup(o.drink),
      css: !o.drink.img,
      drinkName: o.drink.name,
      who: (o.customer.surprise ? '깜짝 손님 · ' : o.customer.role + ' ') + o.customer.name,
      line: surprise ? o.customer.react : o.drink.react,
      bonus: surprise ? '🎁 깜짝 보너스 +' + won(o.customer.bonus || 0) : ''
    });

    if (S.combo >= 2) {
      el.comboChip.innerHTML = '<b>×' + S.combo + '</b> COMBO';
      el.comboChip.classList.add('on');
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
      resetStir();
      steamOn(false);
    }, 600);
  }

  function fail() {
    S.locked = true;
    const o = S.order;
    const acc = accidentFor(S.cup, o);
    const madeName = cupName(S.cup);
    const pic = potionMarkup(S.cup);
    S.stats.accidents[acc.key] = (S.stats.accidents[acc.key] || 0) + 1;

    SFX.fail();
    buzz([18, 50, 18]);
    el.cup.classList.remove('bad');
    void el.cup.offsetWidth;
    el.cup.classList.add('bad');
    el.stage.classList.remove('shake');
    void el.stage.offsetWidth;
    el.stage.classList.add('shake');
    S.combo = 0;
    el.comboChip.classList.remove('on');
    S.miss++;

    clearTimeout(nextT);
    nextT = setTimeout(() => { nextT = 0; hideServe(); nextOrder(); }, SERVE_MS);
    showServe({
      kind: 'accident',
      pic: pic,
      css: true,
      drinkName: madeName,
      who: '주문은 ‘' + o.drink.name + '’였는데…',
      line: acc.text,
      bonus: '콤보 끊김 · 매출 0'
    });

    S.cup = [];
    el.layers.innerHTML = '';
    refreshTray();
    updateChips();
    resetStir();
    steamOn(false);
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
    resetStir();
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
    S.stir = 0; S.stirHintShown = false;
    S.stats = { accidents: {}, surprise: 0 };
    lastStirPct = -1;
    bag = []; lastDrinkId = null;
    lastResult = null; resultBlob = null;
    S.order = makeOrder();
    S.upcoming = [makeOrder(), makeOrder()];
    el.money.textContent = won(0);
    el.comboChip.classList.remove('on');
    el.layers.innerHTML = '';
    refreshTray();
    steamOn(false);
    fillOrder();
    resetStir();
    updateHud();
    clearTimeout(nextT); nextT = 0;
    hideServe();
    show(el.play);
    setTimeout(() => toast('레시피 칩을 보고 재료를 톡톡! 순서는 상관없어요'), 450);
    cancelAnimationFrame(S.raf);
    S.raf = requestAnimationFrame(loop);
  }

  /* ---------------- 결과 카드 이미지(공유·저장) ---------------- */
  const SHARE_URL = 'sheeny6-cmyk.github.io/magic-sugar-game/cafe';
  let lastResult = null;
  let resultBlob = null;

  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function glow(c, x, y, r, rgba) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }

  function star(c, x, y, s, color) {
    c.save();
    c.translate(x, y);
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, -s);
    c.quadraticCurveTo(s * 0.16, -s * 0.16, s, 0);
    c.quadraticCurveTo(s * 0.16, s * 0.16, 0, s);
    c.quadraticCurveTo(-s * 0.16, s * 0.16, -s, 0);
    c.quadraticCurveTo(-s * 0.16, -s * 0.16, 0, -s);
    c.fill();
    c.restore();
  }

  // 한글은 띄어쓰기 단위로, 너무 긴 덩어리는 글자 단위로 접는다.
  function wrapText(c, text, x, y, maxW, lh) {
    const tokens = String(text).split(' ');
    let line = '', yy = y;
    const push = () => { if (line) { c.fillText(line, x, yy); yy += lh; line = ''; } };
    tokens.forEach(tok => {
      let word = tok;
      while (c.measureText(word).width > maxW) {
        let cut = word.length - 1;
        while (cut > 1 && c.measureText(word.slice(0, cut)).width > maxW) cut--;
        if (line) push();
        c.fillText(word.slice(0, cut), x, yy);
        yy += lh;
        word = word.slice(cut);
      }
      const test = line ? line + ' ' + word : word;
      if (c.measureText(test).width > maxW && line) { push(); line = word; }
      else line = test;
    });
    if (line) { c.fillText(line, x, yy); yy += lh; }
    return yy;
  }

  function paintCard(canvas, d, img) {
    const c = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const F = () => '"Pretendard Variable",Pretendard,"Apple SD Gothic Neo","Noto Sans KR",sans-serif';

    // 배경: 라벤더 → 핑크
    const bg = c.createLinearGradient(0, 0, W * 0.35, H);
    bg.addColorStop(0, '#F8F2FD');
    bg.addColorStop(0.5, '#F1E6FA');
    bg.addColorStop(1, '#F8E8F2');
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);
    glow(c, 120, 120, 460, 'rgba(190,150,225,.55)');
    glow(c, 980, 240, 420, 'rgba(244,194,215,.6)');
    glow(c, 540, 1300, 620, 'rgba(255,255,255,.85)');

    // 위쪽 태그
    c.font = '800 21px ' + F();
    try { c.letterSpacing = '6px'; } catch (e) {}
    const tag = 'SUGAR  BALLET  CAFÉ';
    const tw = c.measureText(tag).width;
    c.fillStyle = 'rgba(139,107,174,.10)';
    rr(c, (W - tw) / 2 - 34, 62, tw + 68, 48, 24);
    c.fill();
    c.strokeStyle = 'rgba(139,107,174,.35)';
    c.lineWidth = 1.5;
    c.stroke();
    c.fillStyle = '#8B6BAE';
    c.textBaseline = 'middle';
    c.fillText(tag, (W - tw) / 2, 87);
    try { c.letterSpacing = '0px'; } catch (e) {}

    // 캐릭터 (사진은 원본 그대로 잘라 쓴다)
    const cx = 884, cy = 300, cr = 132;
    c.save();
    c.shadowColor = 'rgba(110,74,142,.35)';
    c.shadowBlur = 34;
    c.shadowOffsetY = 10;
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(cx, cy, cr + 12, 0, Math.PI * 2); c.fill();
    c.restore();
    if (img) {
      c.save();
      c.beginPath(); c.arc(cx, cy, cr, 0, Math.PI * 2); c.clip();
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
      c.drawImage(img, sx, sy, side, side, cx - cr, cy - cr, cr * 2, cr * 2);
      c.restore();
    }
    c.strokeStyle = 'rgba(255,255,255,.95)';
    c.lineWidth = 8;
    c.beginPath(); c.arc(cx, cy, cr, 0, Math.PI * 2); c.stroke();

    // 칭호
    c.textBaseline = 'top';
    c.fillStyle = '#B394CC';
    c.font = '800 24px ' + F();
    c.fillText('오늘의 영업 마감', 88, 168);

    c.fillStyle = '#4A3556';
    c.font = '800 58px ' + F();
    let y = wrapText(c, d.title || '오늘의 마법 바리스타', 88, 212, 620, 70);

    c.fillStyle = '#8A769C';
    c.font = '500 27px ' + F();
    y = wrapText(c, d.msg || '', 88, y + 18, 620, 38);

    // 영수증 카드
    const rx = 80, ry = 470, rw = 920, rh = 372;
    c.save();
    c.shadowColor = 'rgba(110,74,142,.22)';
    c.shadowBlur = 40;
    c.shadowOffsetY = 14;
    c.fillStyle = '#fffdfa';
    rr(c, rx, ry, rw, rh, 36);
    c.fill();
    c.restore();
    c.strokeStyle = '#E3D3F2';
    c.lineWidth = 2.5;
    c.setLineDash([14, 10]);
    rr(c, rx, ry, rw, rh, 36);
    c.stroke();
    c.setLineDash([]);

    c.textBaseline = 'middle';
    c.fillStyle = '#6D4E90';
    c.font = '800 30px ' + F();
    c.fillText('오늘의 매출', rx + 40, ry + 74);
    c.fillStyle = '#8B6BAE';
    c.font = '800 64px ' + F();
    c.textAlign = 'right';
    c.fillText(won(d.revenue || 0), rx + rw - 40, ry + 76);
    c.textAlign = 'left';

    c.strokeStyle = '#EADFF5';
    c.lineWidth = 2;
    c.setLineDash([8, 8]);
    c.beginPath(); c.moveTo(rx + 40, ry + 118); c.lineTo(rx + rw - 40, ry + 118); c.stroke();
    c.setLineDash([]);

    const rows = [
      ['서빙한 잔', (d.served || 0) + '잔'],
      ['최고 콤보', '×' + (d.combo || 0)],
      ['놓친 주문', (d.miss || 0) + '건'],
      ['오늘의 인기 메뉴', d.best || '—']
    ];
    rows.forEach((row, i) => {
      const ry2 = ry + 168 + i * 54;
      c.fillStyle = '#7A6688';
      c.font = '500 27px ' + F();
      c.fillText(row[0], rx + 40, ry2);
      c.fillStyle = '#4A3556';
      c.font = '800 28px ' + F();
      c.textAlign = 'right';
      c.fillText(row[1], rx + rw - 40, ry2);
      c.textAlign = 'left';
    });

    // 오늘의 카페 일지
    c.fillStyle = '#F1E6FA';
    rr(c, 80, 880, 920, 236, 32);
    c.fill();
    c.fillStyle = '#B394CC';
    c.font = '800 22px ' + F();
    try { c.letterSpacing = '2px'; } catch (e) {}
    c.fillText('오늘의 카페 일지', 118, 920);
    try { c.letterSpacing = '0px'; } catch (e) {}
    c.fillStyle = '#6D5878';
    c.font = '700 28px ' + F();
    wrapText(c, d.journal || '', 118, 962, 844, 40);

    // 아래 브랜드 + 주소
    c.textAlign = 'center';
    c.fillStyle = '#A181BD';
    c.font = '800 26px ' + F();
    c.fillText(SHARE_URL, W / 2, 1196);
    c.fillStyle = '#B394CC';
    c.font = '500 21px ' + F();
    c.fillText('☕ 슈가 발레 카페 타이쿤 · 매일 75초 영업', W / 2, 1244);
    c.textAlign = 'left';

    star(c, 132, 430, 16, 'rgba(201,161,95,.75)');
    star(c, 992, 512, 12, 'rgba(217,168,198,.8)');
    star(c, 76, 1160, 13, 'rgba(178,140,214,.7)');
    star(c, 1010, 1146, 18, 'rgba(201,161,95,.6)');
  }

  function makeResultImage() {
    return new Promise((resolve, reject) => {
      const build = img => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 1080; canvas.height = 1350;
          paintCard(canvas, lastResult || {}, img);
          canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob 실패'))), 'image/png');
        } catch (e) { reject(e); }
      };
      const im = new Image();
      im.onload = () => build(im);
      im.onerror = () => build(null);
      im.src = 'assets/serve-sq.webp';
    });
  }

  function downloadBlob(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dt = new Date();
    const pad = n => (n < 10 ? '0' + n : '' + n);
    a.href = url;
    a.download = 'sugar-ballet-cafe-' + dt.getFullYear() + pad(dt.getMonth() + 1) + pad(dt.getDate()) + '.png';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 4000);
  }

  let shareT = 0;
  function shareNote(msg) {
    if (!el.shareBtn) return;
    el.shareBtn.textContent = msg;
    clearTimeout(shareT);
    shareT = setTimeout(() => {
      el.shareBtn.textContent = '📸 결과 공유 / 이미지 저장';
    }, 1900);
  }

  function resultText() {
    if (!lastResult) return '';
    return '☕ 슈가 발레 카페 타이쿤\n' + lastResult.title +
      '\n매출 ' + won(lastResult.revenue) + ' · ' + lastResult.served + '잔 · 최고 콤보 ×' + lastResult.combo +
      '\n' + lastResult.journal + '\n' + SHARE_URL;
  }

  async function shareResult() {
    if (!lastResult || !el.shareBtn) return;
    const text = resultText();
    let blob = resultBlob;
    if (!blob) {
      shareNote('카드 만드는 중…');
      try { blob = await makeResultImage(); } catch (e) { blob = null; }
    }

    if (blob) {
      const file = new File([blob], 'sugar-ballet-cafe.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: '☕ 슈가 발레 카페 타이쿤', text: text });
          shareNote('공유 창을 열었어요 📸');
          return;
        } catch (e) {
          if (e && e.name === 'AbortError') { shareNote('📸 결과 공유 / 이미지 저장'); return; }
        }
      }
      // 공유 미지원·실패 → PNG 저장 + 문구 복사
      try { downloadBlob(blob); } catch (e) {}
      try {
        await navigator.clipboard.writeText(text);
        shareNote('이미지 저장 + 문구 복사 📸');
      } catch (e) {
        shareNote('이미지 저장 완료 📸');
      }
      return;
    }

    // 이미지 생성이 안 되면 문구라도 공유/복사
    try {
      if (navigator.share) {
        await navigator.share({ title: '☕ 슈가 발레 카페 타이쿤', text: text });
        shareNote('공유 창을 열었어요 📸');
      } else {
        await navigator.clipboard.writeText(text);
        shareNote('결과 문구를 복사했어요 📸');
      }
    } catch (e) { shareNote('📸 결과 공유 / 이미지 저장'); }
  }

  /* ---------------- 결과: 오늘의 마법 바리스타 ---------------- */
  function accidentTotal() {
    const a = S.stats.accidents;
    return (a.matchaProtein || 0) + (a.espresso || 0) + (a.noIce || 0) + (a.potion || 0) + (a.random || 0);
  }

  // 플레이 기록으로 칭호가 갈린다(놓친 주문·콤보·사고 횟수)
  function titleFor() {
    const a = S.stats.accidents;
    if (S.served === 0) {
      return { name: '🫥 오늘은 휴업한 마법사', msg: '컵도 손님도 그대로였어요. 한 번 더 영업해 볼까요?' };
    }
    if (S.miss === 0 && S.served >= 5) {
      return { name: '✨ 오늘의 마법 바리스타', msg: '놓친 주문 없이 완벽한 영업! 오늘 카페의 주인공이에요.' };
    }
    if (S.maxCombo >= 7) {
      return { name: '🌪️ 3회전 스핀 마스터', msg: '콤보가 피루엣처럼 이어졌어요. 손님들이 다 어질어질!' };
    }
    if ((a.matchaProtein || 0) >= 2) {
      return { name: '🧪 괴짜 발레 연금술사', msg: '초록 괴물이 ' + a.matchaProtein + '번 나타났지만… 그게 또 재미였죠?' };
    }
    if (S.served >= 5) {
      return { name: '🦵 180도 턴아웃 전도사', msg: '오늘 온 손님들 다리가 180도로 활짝 열린 하루!' };
    }
    if (S.maxCombo >= 4) {
      return { name: '💪 근손실 철벽 수비수', msg: '콤보를 끝까지 지켜 내며 근손실 없이 매출을 쌓았어요.' };
    }
    return { name: '☕ 견습 마법 바리스타', msg: '오늘의 마법은 여기까지! 내일은 더 반짝일 거예요.' };
  }

  function journalFor() {
    const a = S.stats.accidents;
    const acc = accidentTotal();
    if (S.served === 0 && S.miss === 0) {
      return '오늘은 손님 없이 조용했어요. 내일은 컵을 먼저 데워 두고 시작해 봐요 ☕';
    }
    if (S.served === 0) {
      return '손님 ' + S.miss + '명을 그냥 보내 버렸어요… 내일은 재료부터 손에 익혀 둘게요 🩰';
    }
    const base = '손님 ' + S.served + '명 · 매출 ' + won(S.revenue);
    if ((a.matchaProtein || 0) >= 2) {
      return base + '. 초록 괴물 컵 ' + a.matchaProtein + '잔은 웃음으로 넘어갔지만, 내일은 말차와 프로틴을 조금 멀리 둘게요 🧪';
    }
    if (S.stats.surprise > 0 && S.miss === 0) {
      return base + '. 깜짝 손님 ' + S.stats.surprise + '명까지 만족하고 갔어요. 오늘 카페는 완벽한 무대였어요 🎀';
    }
    if (acc >= 3) {
      return base + '. 엉뚱한 컵 ' + acc + '잔이 나왔지만 다들 웃고 갔어요. 내일은 레시피 칩을 한 번 더 볼게요 😵‍💫';
    }
    if (S.miss === 0) {
      return base + '. 놓친 주문 0건! 컵마다 마법이 제대로 통했어요 ✨';
    }
    if (S.maxCombo >= 5) {
      return base + '. 콤보 ×' + S.maxCombo + '까지 달렸어요. 내일은 3회전처럼 더 길게 이어 봐요 🌪️';
    }
    return base + '. 들쭉날쭉했지만 손님들은 다 웃으면서 갔어요. 내일은 한 잔 더 침착하게 🩰';
  }

  function endGame() {
    S.phase = 'end';
    cancelAnimationFrame(S.raf);
    clearTimeout(nextT); nextT = 0;
    hideServe();
    onStirUp();
    SFX.end();

    const t = titleFor();
    const journal = journalFor();
    $('#gradeName').textContent = t.name;
    $('#gradeMsg').textContent = t.msg;
    $('#journalLine').textContent = journal;
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

    lastResult = {
      title: t.name, msg: t.msg, journal: journal,
      revenue: S.revenue, served: S.served, combo: S.maxCombo, miss: S.miss,
      best: bestDrink ? bestDrink.name + ' ' + bestN + '잔' : '—'
    };
    // 공유 버튼을 누르는 순간 바로 공유창을 열 수 있도록 미리 카드를 만들어 둔다.
    resultBlob = null;
    if (el.shareBtn) el.shareBtn.textContent = '📸 결과 공유 / 이미지 저장';
    const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => makeResultImage()).then(b => { resultBlob = b; }).catch(() => {});

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
  el.serveBtn.addEventListener('click', serve);
  el.clearBtn.addEventListener('click', () => clearCup(false));
  if (el.shareBtn) el.shareBtn.addEventListener('click', shareResult);

  // 컵 위 문지르기(포인터 캡처로 컵 밖으로 나가도 이어짐)
  el.cupArea.addEventListener('pointerdown', onStirDown, { passive: false });
  window.addEventListener('pointermove', onStirMove, { passive: true });
  window.addEventListener('pointerup', onStirUp, { passive: true });
  window.addEventListener('pointercancel', onStirUp, { passive: true });
  window.addEventListener('blur', onStirUp);

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && S.phase === 'play') {
      if (el.flash.classList.contains('on')) skipServe(); else serve();
    }
    if (e.key === 'Backspace' && S.phase === 'play') { e.preventDefault(); clearCup(false); }
    if (e.key === '1' && S.phase === 'play') serve();
  });

  el.serveCard.addEventListener('pointerdown', ev => { ev.preventDefault(); skipServe(); });

  window.addEventListener('resize', () => { if (S.phase === 'play') renderCup(); });

  /* ---------------- 초기화 ---------------- */
  buildTray();
  paintMute();
  refreshBestLabel();
  resetStir();

  // 테스트용 상태 노출 (?debug 붙였을 때만)
  if (location.search.indexOf('debug') >= 0) {
    window.__cafe = {
      S, serve, clear: clearCup, makeOrder, fillOrder, DRINKS, SURPRISE, accidentFor,
      stirAdd, resetStir, cupName, titleFor, journalFor, endGame, startGame
    };
  }
})();
