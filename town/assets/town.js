/* ===== 발레 왕국 마을 · 공용 지갑/스탯/옷장 ===== */
(function () {
  'use strict';

  var KEY = 'sugartown.v1';
  var COURT_BACKUP = KEY + '.court';
  var V = '20261121c';
  var PRACTICE = {
    bar: { fee: 0, coins: 50, life: 1 },
    center: { fee: 150, coins: 80, life: 2 },
    piece: { fee: 250, coins: 120, life: 3 }
  };
  var GRANT = 60, POTION_PRICE = 30, ORDERS_PER_LEVEL = 3;

  /* town/ 루트 경로 (assets/town.js 위치 기준) — 하위 페이지에서도 사진 경로가 맞도록 */
  var ROOT = (function () {
    var src = (document.currentScript && document.currentScript.src) || '';
    src = src.split('?')[0];
    var i = src.indexOf('/assets/town.js');
    return i >= 0 ? src.slice(0, i + 1) : 'assets/';
  })();
  function A(p) { return ROOT + p; }

  var STATS = {
    flex: { key: 'flex', label: '유연성', icon: '💫' },
    stam: { key: 'stam', label: '체력', icon: '🔥' },
    axis: { key: 'axis', label: '중심축', icon: '⚖️' },
    turn: { key: 'turn', label: '턴아웃', icon: '🌀' }
  };

  var SUP = 'assets/chars/';

  var SPIRITS = {
    ara:    { id: 'ara',    name: '아라', role: '아라베스크 · 선',        color: '#7d9ad8', img: A(SUP + 'ara.webp') },
    alle:   { id: 'alle',   name: '알레', role: '음악 · 리듬',        color: '#77c2a7', img: A(SUP + 'alle.webp') },
    etu:    { id: 'etu',    name: '에튜', role: '에티튜드 · 균형',        color: '#ab8fdb', img: A(SUP + 'etu.webp') },
    shangz: { id: 'shangz', name: '샹즈', role: '샹주망 · 도약',          color: '#e0b465', img: A(SUP + 'shangz.webp') },
    piru:   { id: 'piru',   name: '피루', role: '피루엣 · 회전',          color: '#e5899f', img: A(SUP + 'piru.webp') },
    sugar:  { id: 'sugar',  name: '슈가 공주', role: '발레 왕국의 주인공', color: '#b98fd8', img: A(SUP + 'sugar.webp') }
  };

  var STAFF = {
    etu: { name: '에티튜드 밸런스', gift: 'axis', unit: 4, line: '음악이 멈춰도 한 박자 더 머물 수 있게, 중심을 한 방울 담았어.' },
    ara: { name: '아라베스크 이슬', gift: 'flex', unit: 4, line: '손끝에서 발끝까지, 슈가의 선이 길게 이어지길.' },
    piru: { name: '피루엣 스파이럴', gift: 'coins', unit: 12, line: '한 바퀴 돌고 제자리! 슈가의 연습 보상에 코인을 더할게.' },
    shangz: { name: '그랑 제떼 구름', gift: 'stam', unit: 4, line: '마지막 점프까지 가볍게! 구름 한 조각을 녹였어.' },
    alle: { name: '세 박자 왈츠', gift: 'life', unit: 1, line: '하나, 둘, 셋. 슈가의 박자에 왕국의 생명력도 차올라.' }
  };

  function staffLevel(orders) { return 1 + Math.floor(orders / ORDERS_PER_LEVEL); }
  function effectFor(id, level) {
    var staff = STAFF[id], amount = staff.unit * level;
    var label = staff.gift === 'coins' ? '연습 코인' : staff.gift === 'life' ? '왕국 생명력' : STATS[staff.gift].label;
    return { key: staff.gift, amount: amount, label: label + ' +' + amount };
  }
  function spiritArt(id, portrait) {
    return A('../kingdom/assets/' + (portrait ? 'av_' + id : id + '_hero') + '.webp');
  }

  /* ---------- 마법 분식 메뉴 8종 ---------- */
  var MENU = [
    {
      id: 'tteokbokki', name: '다리 쫙 떡볶이', short: '다리 쫙 떡볶이', emoji: '🥘',
      img: A('assets/full/tteokbokki.webp'), thumb: A('assets/thumbs/tteokbokki.webp'),
      stats: { flex: 10 }, effect: '유연성 +10', tags: ['유연성'],
      desc: '180도 스플릿처럼 다리가 쫙!',
      magic: '다리가… 쫙! 180도가 됐어요!! 🦵✨'
    },
    {
      id: 'fried', name: '점프력 튀김', short: '점프력 튀김', emoji: '🍤',
      img: A('assets/full/fried.webp'), thumb: A('assets/thumbs/fried.webp'),
      stats: { stam: 10 }, effect: '체력 +10', tags: ['점프', '체력'],
      desc: '가볍게 정프리, 착지까지 탄탄!',
      magic: '발이 깃털처럼 가벼워요. 점프가 두 배로!'
    },
    {
      id: 'sundae', name: '체력 무한 순대', short: '체력 무한 순대', emoji: '🍥',
      img: A('assets/full/sundae.webp'), thumb: A('assets/thumbs/sundae.webp'),
      stats: { stam: 10 }, effect: '체력 +10', tags: ['체력'],
      desc: '끝없는 체력, 무한한 힘!',
      magic: '체력이 무한 충전됐어요. 한 번 더 돌 수 있어요!'
    },
    {
      id: 'jjolmyeon', name: '축 안 흔들리는 쫄면', short: '축 안 흔들리는 쫄면', emoji: '🍝',
      img: A('assets/full/jjolmyeon.webp'), thumb: A('assets/thumbs/jjolmyeon.webp'),
      stats: { axis: 10 }, effect: '중심축 +10', tags: ['중심축'],
      desc: '쫄깃한 면발처럼 흔들림 없는 탄탄한 중심축',
      magic: '축이… 안 흔들려요! 피루엣이 붙어요!'
    },
    {
      id: 'skewer', name: '라인 떡꼬치', short: '라인 떡꼬치', emoji: '🍡',
      img: A('assets/full/skewer.webp'), thumb: A('assets/thumbs/skewer.webp'),
      stats: { flex: 10 }, effect: '유연성 +10', tags: ['라인'],
      desc: '아라베스크 라인처럼 길게, 예쁘게!',
      magic: '라인이 쭉 이어져요… 아라베스크가 길어졌어요!'
    },
    {
      id: 'cola', name: '턴 빨라지는 콜라', short: '턴 빨라지는 콜라', emoji: '🥤',
      img: A('assets/full/cola.webp'), thumb: A('assets/thumbs/cola.webp'),
      stats: { turn: 10 }, effect: '턴아웃 +10', tags: ['회전', '턴아웃'],
      desc: '탄산처럼 가볍게, 턴은 더 빠르게!',
      magic: '턴이 빨라졌어요! 3바퀴가 순식간!'
    },
    {
      id: 'orderset', name: '주문서 세트', short: '주문서 세트', emoji: '📋',
      img: A('assets/full/orderset.webp'), thumb: A('assets/thumbs/orderset.webp'),
      stats: { flex: 6, stam: 6, axis: 4, turn: 4 }, effect: '올스탯 조금씩', tags: ['골고루'],
      desc: '떡볶이·김밥·튀김·순대 1인분씩',
      magic: '한 입씩 다 먹었더니 몸이 골고루 가벼워요!'
    },
    {
      id: 'fullset', name: '전메뉴 풀세트', short: '전메뉴 풀세트', emoji: '🍱',
      img: A('assets/full/fullset.webp'), thumb: A('assets/thumbs/fullset.webp'),
      stats: { flex: 15, stam: 15, axis: 15, turn: 15 }, effect: '올스탯 +15', tags: ['올스탯'],
      desc: '오늘의 주문, 전메뉴 한 상!',
      magic: '전메뉴 클리어! 오늘 발레는 무조건 잘 돼요!'
    }
  ];

  /* ---------- 드레스룸 아이템 ---------- */
  var DRESS = [
    {
      id: 'basic', name: '기본 핑크 레오타드', price: 0, base: true,
      bo: '#F5B3CB', bo2: '#FCE1EB', sk: '#FBE2EC', sk2: '#FFF4F8',
      tag: '첫 수업의 설렘', desc: '발레를 처음 시작한 날의 핑크 레오타드.'
    },
    {
      id: 'lilac', name: '라일락 쉬폰 스커트', price: 150,
      bo: '#C7AEE4', bo2: '#E5D6F6', sk: '#E7D8F8', sk2: '#F7EFFF',
      tag: '바에서도 사뿐사뿐', desc: '바 워크할 때 스커트가 살랑, 라일락 향이 나요.'
    },
    {
      id: 'swan', name: '백조 화이트 튜튜', price: 300,
      bo: '#FFFDF7', bo2: '#FFFFFF', sk: '#FFFFFF', sk2: '#FBF5EC',
      tag: '지젤 2막의 그 느낌', desc: '하얀 튜튜를 입으면 왠지 발끝이 가벼워져요.'
    },
    {
      id: 'black', name: '블랙 스완 레오타드', price: 600,
      bo: '#332B40', bo2: '#4C3F5E', sk: '#3A3048', sk2: '#5A4B6E',
      tag: '오디르의 32 바퀴', desc: '어두운 무대 위에서 더 빛나는 검은 깃털.'
    },
    {
      id: 'sugar', name: '마법 슈가 드레스', price: 1000, hi: true,
      bo: '#B78CD8', bo2: '#F2C4DE', sk: '#E9C9F2', sk2: '#FDE8F3',
      tag: '슈가의 마지막 드레스', desc: '발레 왕국에서 가장 반짝이는 드레스. 무대 위 최고의 날.'
    }
  ];

  var DEFAULT = {
    v: 1, coins: GRANT,
    kingdom: { charter: 1, life: 1, orders: { etu: 0, ara: 0, piru: 0, shangz: 0, alle: 0 }, prepared: null, receipt: null },
    stats: { flex: 0, stam: 0, axis: 0, turn: 0 },
    owned: ['basic'], worn: 'basic',
    stamps: { bar: 0, center: 0, piece: 0 },
    classes: 0, served: 0, best: 0, bestRound: 0, seen: [],
    lastServe: null, createdAt: 0, lesson: null, lastLessons: {}
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function normalize(raw) {
    var s = clone(DEFAULT);
    if (!raw || typeof raw !== 'object') return s;
    if (typeof raw.coins === 'number' && isFinite(raw.coins)) s.coins = Math.max(0, Math.round(raw.coins));
    var kingdom = raw.kingdom;
    if (kingdom && kingdom.charter === 1) {
      if (Number.isSafeInteger(kingdom.life)) s.kingdom.life = Math.max(0, kingdom.life);
      Object.keys(STAFF).forEach(function (id) {
        var n = kingdom.orders && kingdom.orders[id];
        if (Number.isSafeInteger(n) && n >= 0) s.kingdom.orders[id] = n;
      });
      var potion = kingdom.prepared;
      if (potion && Object.hasOwn(STAFF, potion.id) && Number.isSafeInteger(potion.level) && potion.level > 0) {
        s.kingdom.prepared = { id: potion.id, level: potion.level };
      }
      var receipt = kingdom.receipt;
      if (receipt && Object.hasOwn(PRACTICE, receipt.kind) && Array.isArray(receipt.keys) && receipt.keys.length === 3) {
        s.kingdom.receipt = receipt;
      }
    } else {
      s.coins = (typeof raw.coins === 'number' && isFinite(raw.coins) ? s.coins : 0) + GRANT;
    }
    if (raw.stats && typeof raw.stats === 'object') {
      Object.keys(s.stats).forEach(function (k) {
        var n = raw.stats[k];
        if (typeof n === 'number' && isFinite(n)) s.stats[k] = Math.max(0, Math.round(n));
      });
    }
    if (Array.isArray(raw.owned)) {
      s.owned = raw.owned.filter(function (id) { return DRESS.some(function (d) { return d.id === id; }); });
      if (s.owned.indexOf('basic') < 0) s.owned.unshift('basic');
    }
    if (typeof raw.worn === 'string' && s.owned.indexOf(raw.worn) >= 0) s.worn = raw.worn;
    if (raw.stamps && typeof raw.stamps === 'object') {
      ['bar', 'center', 'piece'].forEach(function (k) {
        var n = raw.stamps[k];
        if (typeof n === 'number' && isFinite(n)) s.stamps[k] = Math.max(0, Math.round(n));
      });
    }
    ['classes', 'served', 'best', 'bestRound'].forEach(function (k) {
      if (typeof raw[k] === 'number' && isFinite(raw[k])) s[k] = Math.max(0, Math.round(raw[k]));
    });
    if (Array.isArray(raw.seen)) s.seen = raw.seen.filter(function (id) { return typeof id === 'string'; });
    if (raw.lastServe && typeof raw.lastServe === 'object') s.lastServe = raw.lastServe;
    var lesson = raw.lesson;
    if (lesson && Object.hasOwn(PRACTICE, lesson.kind) && typeof lesson.id === 'string' &&
        Array.isArray(lesson.rounds) && lesson.rounds.length === 3 &&
        Number.isInteger(lesson.index) && lesson.index >= 0 && lesson.index < lesson.rounds.length &&
        lesson.rounds.every(function (r) { return r && typeof r.key === 'string' && Array.isArray(r.choices) && Array.isArray(r.picks); })) {
      s.lesson = lesson;
    }
    Object.keys(PRACTICE).forEach(function (kind) {
      if (raw.lastLessons && Array.isArray(raw.lastLessons[kind])) s.lastLessons[kind] = raw.lastLessons[kind];
    });
    if (typeof raw.createdAt === 'number') s.createdAt = raw.createdAt;
    return s;
  }

  var S = null, memoryOnly = false, inTransaction = false, needsCharter = false;
  function load() {
    if (memoryOnly && S) return S;
    try {
      var raw = localStorage.getItem(KEY);
      var saved = raw ? JSON.parse(raw) : null;
      needsCharter = !saved || !saved.kingdom || saved.kingdom.charter !== 1;
      // A still-open older town page writes only the original wallet fields.
      if (needsCharter && saved && saved.createdAt) {
        try {
          var previous = JSON.parse(localStorage.getItem(COURT_BACKUP) || 'null');
          if (previous && previous.createdAt === saved.createdAt) saved.kingdom = previous.kingdom;
        } catch (e) { /* The primary wallet remains usable. */ }
      }
      S = normalize(saved);
    } catch (e) {
      memoryOnly = true;
      S = S || normalize(null);
    }
    if (!S.createdAt) S.createdAt = Date.now();
    return S;
  }
  function persist() {
    if (inTransaction || memoryOnly) return;
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { memoryOnly = true; return; }
    try { localStorage.setItem(COURT_BACKUP, JSON.stringify({ createdAt: S.createdAt, kingdom: S.kingdom })); } catch (e) { /* Optional compatibility copy. */ }
  }
  function get() { if (!S) load(); return S; }

  // Each visit can have its own tab. Settle against the latest wallet in one write.
  function updateWallet(change) {
    function apply() {
      var s = load(), result;
      inTransaction = true;
      try { result = change(s); } finally { inTransaction = false; }
      persist();
      syncUI();
      return result;
    }
    if (navigator.locks && navigator.locks.request) return navigator.locks.request(KEY, apply);
    return Promise.resolve(apply());
  }

  function classFee(kind) {
    return PRACTICE[kind].fee;
  }

  function orderPotion(id) {
    return updateWallet(function (s) {
      var k = s.kingdom;
      if (!Object.hasOwn(STAFF, id) || k.prepared || s.coins < POTION_PRICE || k.life < 1) return null;
      var oldLevel = staffLevel(k.orders[id]);
      s.coins -= POTION_PRICE;
      k.life -= 1;
      k.orders[id] += 1;
      var level = staffLevel(k.orders[id]);
      k.prepared = { id: id, level: level };
      return { level: level, leveled: level > oldLevel };
    });
  }

  // Called inside the lesson transaction after the final answer is verified.
  function finishPractice(s, classStats) {
    var run = s.lesson;
    if (!run || run.index !== run.rounds.length - 1 || !run.rounds.every(function (r) { return r.picks.includes(r.key); })) return null;
    var rules = PRACTICE[run.kind], k = s.kingdom, potion = k.prepared;
    var stats = Object.assign({}, classStats), coins = rules.coins, life = rules.life;
    if (potion) {
      var effect = effectFor(potion.id, potion.level);
      if (effect.key === 'coins') coins += effect.amount;
      else if (effect.key === 'life') life += effect.amount;
      else stats[effect.key] = (stats[effect.key] || 0) + effect.amount;
    }
    // Old bookings charged a tuition fee without recording it on the lesson.
    var legacyFee = run.kind === 'bar' ? (s.stamps.bar ? 100 : 0) : rules.fee;
    var refund = Number.isSafeInteger(run.paidFee) ? run.paidFee : legacyFee;
    var receipt = {
      kind: run.kind, keys: run.rounds.map(function (r) { return r.key; }),
      first: run.rounds.filter(function (r) { return r.picks.length === 1; }).length,
      levelBefore: level().n, coins: coins, life: life, refund: refund, stats: stats, potion: potion
    };
    s.coins += coins + refund;
    k.life += life;
    k.prepared = null;
    Object.keys(stats).forEach(function (key) { s.stats[key] += stats[key]; });
    s.classes += 1;
    s.stamps[run.kind] += 1;
    s.lastLessons[run.kind] = receipt.keys;
    k.receipt = receipt;
    s.lesson = null;
    return receipt;
  }

  /* ---------- 레벨 ---------- */
  var LEVELS = [
    { n: 1, at: 0, name: '입문 발레리나' },
    { n: 2, at: 2, name: '견습 발레리나' },
    { n: 3, at: 5, name: '주역 발레리나' },
    { n: 4, at: 9, name: '프리마 발레리나' },
    { n: 5, at: 14, name: '발레 왕국 스타' }
  ];
  function level() {
    var c = get().classes, cur = LEVELS[0], next = null;
    for (var i = 0; i < LEVELS.length; i++) {
      if (c >= LEVELS[i].at) cur = LEVELS[i];
      else { next = LEVELS[i]; break; }
    }
    var have = c - cur.at;
    var need = next ? next.at - cur.at : 0;
    var pct = next ? Math.min(100, Math.round((c / next.at) * 100)) : 100;
    return { n: cur.n, name: cur.name, have: have, need: need, next: next, classes: c, pct: pct };
  }
  function stampsTotal() {
    var s = get().stamps;
    return s.bar + s.center + s.piece;
  }
  function stageReady() { return get().classes >= 5; }
  function stageLeft() { return Math.max(0, 5 - get().classes); }

  /* ---------- 코인/스탯 ---------- */
  function syncUI(root) {
    var r = root || document;
    var s = get();
    Array.prototype.forEach.call(r.querySelectorAll('[data-coin]'), function (el) { el.textContent = fmt(s.coins); });
    Array.prototype.forEach.call(r.querySelectorAll('[data-life]'), function (el) { el.textContent = fmt(s.kingdom.life); });
    Object.keys(STATS).forEach(function (k) {
      Array.prototype.forEach.call(r.querySelectorAll('[data-stat="' + k + '"]'), function (el) { el.textContent = s.stats[k]; });
      Array.prototype.forEach.call(r.querySelectorAll('[data-bar="' + k + '"]'), function (el) {
        el.style.width = Math.min(100, s.stats[k]) + '%';
      });
    });
    var dressEls = r.querySelectorAll('[data-worn-name]');
    if (dressEls.length) {
      var d = dressOf(s.worn);
      Array.prototype.forEach.call(dressEls, function (el) { el.textContent = d.name; });
    }
    return s;
  }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function addCoins(n) {
    var s = get();
    n = Math.round(n);
    s.coins = Math.max(0, s.coins + n);
    persist(); syncUI();
    if (n !== 0) popCoin();
    return s.coins;
  }
  function popCoin() {
    Array.prototype.forEach.call(document.querySelectorAll('.coin'), function (el) {
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    });
  }
  function spend(n) {
    var s = get();
    if (s.coins < n) return false;
    s.coins -= n; persist(); syncUI(); popCoin();
    return true;
  }
  function addStats(obj) {
    var s = get();
    Object.keys(obj).forEach(function (k) {
      if (!s.stats.hasOwnProperty(k)) return;
      s.stats[k] = Math.max(0, Math.round(s.stats[k] + obj[k]));
    });
    persist(); syncUI();
    return obj;
  }

  /* ---------- 옷 ---------- */
  function dressOf(id) {
    return DRESS.filter(function (d) { return d.id === id; })[0] || DRESS[0];
  }
  function isOwned(id) { return get().owned.indexOf(id) >= 0; }
  function buy(id) {
    var s = get(), d = dressOf(id);
    if (isOwned(id)) return { ok: false, reason: 'owned' };
    if (s.coins < d.price) return { ok: false, reason: 'coins', need: d.price - s.coins };
    s.coins -= d.price;
    s.owned.push(id);
    s.worn = id;
    persist(); syncUI(); popCoin();
    return { ok: true, item: d };
  }
  function wear(id) {
    var s = get();
    if (!isOwned(id)) return { ok: false, reason: 'locked' };
    s.worn = id; persist(); syncUI();
    return { ok: true, item: dressOf(id) };
  }

  /* ---------- 수업 ---------- */
  function addClass(kind) {
    var s = get();
    s.classes += 1;
    if (s.stamps.hasOwnProperty(kind)) s.stamps[kind] += 1;
    persist(); syncUI();
    return level();
  }

  /* ---------- 도감 ---------- */
  function seeMenu(id) {
    var s = get();
    if (s.seen.indexOf(id) < 0) { s.seen.push(id); persist(); }
  }
  function seenCount() { return get().seen.filter(function (id) { return MENU.some(function (m) { return m.id === id; }); }).length; }

  /* ---------- 카페 기록 ---------- */
  function cafeBest() {
    try {
      var v = parseInt(localStorage.getItem('sugarcafe.best') || '0', 10);
      return isFinite(v) && v > 0 ? v : 0;
    } catch (e) { return 0; }
  }

  /* ---------- 드레스 도형 (SVG) ---------- */
  function dressHTML(id, cls) {
    var d = dressOf(id);
    var style = '--bo:' + d.bo + ';--bo2:' + d.bo2 + ';--sk:' + d.sk + ';--sk2:' + d.sk2;
    var svg =
      '<svg viewBox="0 0 100 112" role="img" aria-label="' + d.name + '">' +
        '<path d="M50 55 C36 55 21 63 14 82 C11 90 14 96 21 95 C28 94 34 100 40 98 C44 97 47 100 50 99 C53 100 56 97 60 98 C66 100 72 94 79 95 C86 96 89 90 86 82 C79 63 64 55 50 55 Z" fill="' + d.sk + '" stroke="rgba(90,55,110,.09)" stroke-width=".8"/>' +
        '<path d="M50 58 C38 58 26 65 21 82 C19 88 22 93 27 92 C33 91 38 96 43 94 C47 93 49 96 50 95 C51 96 53 93 57 94 C62 96 67 91 73 92 C78 93 81 88 79 82 C74 65 62 58 50 58 Z" fill="' + d.sk2 + '" opacity=".95"/>' +
        '<path d="M50 60 C41 60 34 67 32 79 C31 85 35 88 40 87 C45 86 48 89 50 88 C52 89 55 86 60 87 C65 88 69 85 68 79 C66 67 59 60 50 60 Z" fill="#ffffff" opacity=".34"/>' +
        '<path d="M50 57 L50 92 M38 60 L31 90 M62 60 L69 90 M44 59 L41 93 M56 59 L59 93" stroke="rgba(255,255,255,.30)" stroke-width="1" fill="none"/>' +
        '<path d="M29 21 C35 25.5 65 25.5 71 21 L65 56 C58.5 60 41.5 60 35 56 Z" fill="' + d.bo2 + '"/>' +
        '<path d="M50 22.6 C56 22.6 61 21.6 65 20.2 L65 56 C60 58.5 55 59.5 50 59.5 Z" fill="' + d.bo + '" opacity=".28"/>' +
        '<path d="M35 23.5 C39 27 61 27 65 23.5" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.3"/>' +
        '<rect x="34.5" y="53" width="31" height="5" rx="2.5" fill="' + d.bo + '"/>' +
        '<path d="M50 56 C46 52 41 52 40 55 C39 58 45 59 50 56 Z" fill="' + d.bo + '" opacity=".85"/>' +
        '<path d="M50 56 C54 52 59 52 60 55 C61 58 55 59 50 56 Z" fill="' + d.bo + '" opacity=".85"/>' +
        '<circle cx="50" cy="56" r="2" fill="' + d.bo + '"/>' +
        '<path d="M50 4 C50 1.2 54.5 1.2 54.5 4 C54.5 6.6 50 6 50 10" fill="none" stroke="#c9a15f" stroke-width="2" stroke-linecap="round" opacity=".9"/>' +
        '<path d="M50 10 L25 20 L75 20 Z" fill="none" stroke="#c9a15f" stroke-width="2" stroke-linejoin="round" opacity=".9"/>' +
      '</svg>';
    return '<span class="fig ' + (cls || '') + (d.hi ? ' hi' : '') + '" style="' + style + '">' + svg + '<i class="spark">✦</i></span>';
  }

  /* ---------- 토스트 ---------- */
  var toastTimer = null;
  function toast(msg, ms) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast'; el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('on'); }, ms || 2300);
  }

  var API = {
    KEY: KEY, V: V, ROOT: ROOT, asset: A, STATS: STATS, SPIRITS: SPIRITS, MENU: MENU, DRESS: DRESS,
    load: load, get: get, save: persist, reset: function () { S = clone(DEFAULT); S.createdAt = Date.now(); persist(); syncUI(); },
    syncUI: syncUI, fmt: fmt, addCoins: addCoins, spend: spend, addStats: addStats,
    updateWallet: updateWallet, classFee: classFee, PRACTICE: PRACTICE, STAFF: STAFF,
    GRANT: GRANT, POTION_PRICE: POTION_PRICE, ORDERS_PER_LEVEL: ORDERS_PER_LEVEL,
    staffLevel: staffLevel, effectFor: effectFor, spiritArt: spiritArt, orderPotion: orderPotion, finishPractice: finishPractice,
    level: level, LEVELS: LEVELS, stampsTotal: stampsTotal, stageReady: stageReady, stageLeft: stageLeft, addClass: addClass,
    dressOf: dressOf, dressHTML: dressHTML, isOwned: isOwned, buy: buy, wear: wear,
    seeMenu: seeMenu, seenCount: seenCount, cafeBest: cafeBest, toast: toast
  };
  window.SugarTown = API;
  load();

  /* 여러 탭/뒤로가기에서 지갑 동기화 */
  function refreshFromStorage() {
    load(); syncUI();
    window.dispatchEvent(new Event('sugartown:refresh'));
  }
  if (needsCharter) updateWallet(function () {}).then(refreshFromStorage);
  window.addEventListener('pageshow', refreshFromStorage);
  window.addEventListener('storage', function (e) { if (e.key === KEY || e.key === null || e.key === 'sugarcafe.best') refreshFromStorage(); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') refreshFromStorage();
  });
})();
