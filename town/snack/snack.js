/* ===== 🍢 발레 분식집 · 플레이 ===== */
(function () {
  'use strict';
  var T = window.SugarTown;
  var $ = function (id) { return document.getElementById(id); };
  var A = T.asset;

  /* ---------- 손님 ---------- */
  var CUST = [
    {
      id: 'ara', name: '아라', role: '아라베스크 · 선 정령', img: A('assets/chars/ara.webp'), color: '#7d9ad8',
      line: '아라베스크 라인이 더 길어지고 싶어요… 발끝이 자꾸 짧아져요.',
      tags: ['라인', '유연성'], need: ['skewer'], alt: [['tteokbokki']],
      react: '라인이 쭉 이어져요… 아라베스크가 길어졌어요!'
    },
    {
      id: 'alle', name: '알레', role: '음악 · 리듬 정령', img: A('assets/chars/alle.webp'), color: '#77c2a7',
      line: '점프할 때 발이 너무 무거워요! 착지도 자꾸 흔들리고요.',
      tags: ['점프', '체력'], need: ['fried'],
      react: '발이 깃털처럼 가벼워요! 점프가 두 배!'
    },
    {
      id: 'etu', name: '에튜', role: '아티튜드 · 균형 정령', img: A('assets/chars/etu.webp'), color: '#ab8fdb',
      line: '밸런스 잡을 때마다 중심축이 흔들려요… 자꾸 발이 붙어요.',
      tags: ['중심축'], need: ['jjolmyeon'],
      react: '축이… 안 흔들려요! 이제 아티튜드도 붙어요!'
    },
    {
      id: 'shangz', name: '샹즈', role: '샹주망 · 도약 정령', img: A('assets/chars/shangz.webp'), color: '#e0b465',
      line: '오늘 연속 도약하느라 체력이 완전 방전됐어요!',
      tags: ['체력'], need: ['sundae'], alt: [['fried']],
      react: '체력이 무한 충전됐어요! 한 번 더 뛸 수 있어요!'
    },
    {
      id: 'piru', name: '피루', role: '피루엣 · 회전 정령', img: A('assets/chars/piru.webp'), color: '#e5899f',
      line: '피루엣 3바퀴가 너무 느리게 돌아가요! 뱅크도 자꾸 흔들리고요.',
      tags: ['회전', '턴아웃'], need: ['cola'],
      react: '턴이 빨라졌어요! 3바퀴가 순식간!'
    },
    {
      id: 'sugar', name: T.nick(), role: '발레 왕국의 주인공', img: A('assets/chars/sugar.webp'), color: '#b98fd8',
      line: '오늘 연습 끝나고 다 같이 먹을래요! 전메뉴 주세요~',
      tags: ['올스탯'], need: ['fullset'], royal: true,
      react: '전메뉴 클리어! 오늘 발레는 무조건 잘 돼요!'
    },
    {
      id: 'minji', name: '민지', role: '발레 3년차 · 초급반', emoji: '🩰', color: '#c3a4d8',
      line: '오늘 너무 피곤해서 바도 못 잡겠어요…',
      tags: ['체력'], need: ['sundae']
    },
    {
      id: 'yuna', name: '유나', role: '입시반 · 스플릿 연습', emoji: '🩰', color: '#dba8be',
      line: '다리가 180도로 안 찢어져서 서러워요!',
      tags: ['유연성'], need: ['tteokbokki']
    },
    {
      id: 'hana', name: '하나', role: '피루엣 연습생', emoji: '🩰', color: '#a9b1d8',
      line: '축도 흔들리고 턴도 느려요… 둘 다 잡고 싶어요.',
      tags: ['중심축', '턴아웃'], need: ['jjolmyeon', 'cola']
    },
    {
      id: 'somi', name: '소미', role: '초급반 · 첫 달', emoji: '🩰', color: '#e8c08f',
      line: '뭐가 뭔지 모르겠고 이것저것 다 맛보고 싶어요!',
      tags: ['골고루'], need: ['orderset']
    }
  ];

  var state = {
    queue: [], round: 0, total: 6, served: 0, streak: 0, bestStreak: 0,
    earned: 0, pick: [], order: null, busy: false, gained: {}, miss: 0
  };

  function shuffle(a) {
    var r = a.slice();
    for (var i = r.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = r[i]; r[i] = r[j]; r[j] = t;
    }
    return r;
  }
  function buildQueue() {
    var spirits = CUST.filter(function (c) { return c.img; });
    var others = CUST.filter(function (c) { return !c.img; });
    var pick = shuffle(spirits).slice(0, 4).concat(shuffle(others).slice(0, 2));
    return shuffle(pick).slice(0, 6);
  }

  /* ---------- 화면 ---------- */
  function show(id) {
    Array.prototype.forEach.call(document.querySelectorAll('.screen'), function (s) { s.classList.remove('on'); });
    $(id).classList.add('on');
    var ip = document.getElementById(id);
    var sc = ip.querySelector('.start-scroll,.end-scroll,.play-body');
    if (sc) sc.scrollTop = 0;
  }

  function start() {
    state = { queue: buildQueue(), round: 0, total: 6, served: 0, streak: 0, bestStreak: 0,
      earned: 0, pick: [], order: null, busy: false, gained: {}, miss: 0 };
    show('scPlay');
    renderRound();
  }

  function renderRound() {
    state.pick = [];
    state.order = state.queue[state.round];
    var o = state.order;

    $('stepTxt').textContent = (state.round + 1) + ' / ' + state.total;
    var st = $('streakTxt');
    st.textContent = '연속 ' + state.streak;
    st.className = 'streak' + (state.streak >= 2 ? ' hot' : '');

    var ava = $('custAva');
    if (o.img) ava.innerHTML = '<img src="' + o.img + '" alt="' + o.name + '">';
    else { ava.innerHTML = ''; ava.textContent = o.emoji || '🩰'; }
    $('custName').textContent = o.name;
    $('custRole').textContent = o.role;
    $('custLine').textContent = '“' + o.line + '”';

    var tags = (o.tags || []).map(function (t) { return '<span class="tag">#' + t + '</span>'; });
    if (o.need.length > 1) tags.push('<span class="tag time">2가지 담기</span>');
    $('custTags').innerHTML = tags.join('');

    $('pickCount').textContent = '0 / ' + o.need.length;
    $('hintTxt').textContent = o.need.length > 1
      ? '이 손님은 두 가지를 원해요. 메뉴 2개까지 담을 수 있어요.'
      : '사진을 눌러 담고, 아래 서빙 버튼을 눌러요.';

    renderTray();
    updateServe();

    var tips = [
      '손님 말 속 #태그가 원하는 스탯 힌트예요.',
      '콜라는 턴아웃, 쫄면은 중심축! 둘 다 필요하면 2개까지 담아요.',
      '전메뉴 풀세트는 네 스탯을 한 번에 올려 줘요.',
      '주문서 세트는 골고루, 라인 떡꼬치는 아라베스크 라인에 딱.',
      '같은 손님을 연속으로 맞히면 코인이 점점 커져요.'
    ];
    var tipEl = $('tipTxt');
    if (tipEl) tipEl.textContent = tips[state.round % tips.length];
  }

  function renderTray() {
    var max = state.order ? state.order.need.length : 1;
    $('tray').innerHTML = T.MENU.map(function (m) {
      var sel = state.pick.indexOf(m.id) >= 0;
      var full = !sel && state.pick.length >= max;
      return '<button class="mcard' + (sel ? ' sel' : '') + (full ? ' full' : '') + '" data-id="' + m.id + '" type="button" aria-pressed="' + sel + '">' +
        '<img src="' + m.thumb + '" alt="' + m.name + '" loading="lazy">' +
        '<b>' + m.name + '</b><i>' + m.effect + '</i></button>';
    }).join('');
  }

  function togglePick(id) {
    if (state.busy) return;
    var max = state.order.need.length;
    var i = state.pick.indexOf(id);
    if (i >= 0) state.pick.splice(i, 1);
    else {
      if (state.pick.length >= max) state.pick = max === 1 ? [id] : state.pick.slice(1).concat(id);
      else state.pick.push(id);
    }
    renderTray();
    $('pickCount').textContent = state.pick.length + ' / ' + max;
    updateServe();
  }

  function updateServe() {
    $('serveBtn').disabled = state.pick.length === 0 || state.busy;
  }

  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    var x = a.slice().sort().join('|'), y = b.slice().sort().join('|');
    return x === y;
  }
  function judge(order, pick) {
    if (sameSet(pick, order.need)) return true;
    var alts = order.alt || [];
    for (var i = 0; i < alts.length; i++) if (sameSet(pick, alts[i])) return true;
    return false;
  }
  function menuOf(id) { return T.MENU.filter(function (m) { return m.id === id; })[0]; }

  async function serve() {
    if (state.busy || !state.pick.length) return;
    state.busy = true;
    var order = state.order;
    var pick = state.pick.slice();
    var ok = judge(order, pick);
    var earned = 0;
    var gained = {};

    if (ok) {
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      state.served += 1;
      var base = 22 + Math.min(4, state.streak - 1) * 6;
      if (order.need.length > 1) base += 12;
      if (order.need[0] === 'fullset') base += 8;
      earned = base;
      pick.forEach(function (id) {
        var m = menuOf(id);
        Object.keys(m.stats).forEach(function (k) {
          gained[k] = (gained[k] || 0) + m.stats[k];
          state.gained[k] = (state.gained[k] || 0) + m.stats[k];
        });
      });
      state.earned += earned;
    } else {
      state.streak = 0;
      state.miss += 1;
    }

    await T.updateWallet(function (s) {
      pick.forEach(function (id) { T.seeMenu(id); });
      if (ok) {
        s.served += 1;
        T.addStats(gained);
        T.addCoins(earned);
      }
    });
    showReact(ok, order, pick, earned, gained);
  }

  /* ---------- 반응 카드 ---------- */
  function showReact(ok, order, pick, earned, gained) {
    var first = menuOf(pick[0]);
    var names = pick.map(function (id) { return menuOf(id).name; }).join(' + ');
    var card = $('rcard'), react = $('react');
    react.classList.toggle('miss', !ok);

    $('rImg').src = first.img;
    $('rImg').alt = first.name;
    $('rTag').textContent = ok ? '마법 발동 ✨' : '앗, 이건…';
    $('rWho').textContent = order.name + ' · ' + order.role;
    $('rDish').textContent = names;
    $('rLine').innerHTML = ok
      ? '“' + (order.react || first.magic) + '”'
      : '손님이 고개를 갸웃했어요. 원하는 건 <b>' + needNames(order) + '</b>이었어요.';
    var chips = Object.keys(gained).map(function (k) {
      return '<span class="gain">' + T.STATS[k].icon + ' ' + T.STATS[k].label + ' +' + gained[k] + '</span>';
    });
    $('rGains').innerHTML = chips.join('');
    $('rCoin').innerHTML = '<span>' + (ok ? '서빙 성공 · 지갑에 쏙' : '이번엔 코인 없음') + '</span><b>' +
      (ok ? '+' + earned + ' 🪙' : '0 🪙') + '</b>';
    $('rNext').textContent = state.round + 1 >= state.total ? '영업 마감 보기 →' : '다음 손님 →';
    $('rNext').disabled = false;

    react.classList.add('on');
    react.setAttribute('aria-hidden', 'false');
    card.scrollTop = 0;

    if (ok) {
      var sp = document.createElement('div');
      sp.className = 'sparkles';
      for (var i = 0; i < 10; i++) {
        var s = document.createElement('i');
        s.style.left = (10 + Math.random() * 80) + '%';
        s.style.top = (30 + Math.random() * 55) + '%';
        s.style.animationDelay = (Math.random() * 0.5) + 's';
        sp.appendChild(s);
      }
      var old = card.querySelector('.sparkles');
      if (old) old.remove();
      card.querySelector('.rphoto').appendChild(sp);
    }
  }

  function needNames(order) {
    return order.need.map(function (id) { return menuOf(id).name; }).join(' + ');
  }

  function next() {
    $('react').classList.remove('on');
    $('react').setAttribute('aria-hidden', 'true');
    state.busy = false;
    if (state.round + 1 >= state.total) { finish(); return; }
    state.round += 1;
    renderRound();
  }

  async function finish() {
    await T.updateWallet(function (s) {
      s.best = Math.max(s.best, state.earned);
      s.bestRound = Math.max(s.bestRound, state.served);
    });

    $('endCoins').textContent = '+' + T.fmt(state.earned) + ' 🪙';
    $('endSolved').textContent = state.served + ' / ' + state.total;
    $('endStreak').textContent = state.bestStreak + '연속';
    $('endWallet').textContent = T.fmt(T.get().coins) + ' 🪙';
    var st = Object.keys(state.gained).map(function (k) {
      return T.STATS[k].label + ' +' + state.gained[k];
    });
    $('endStats').textContent = st.length ? st.join(' · ') : '—';

    var msg;
    if (state.served >= 6) msg = '완벽한 영업! 손님 6명 모두 만족했어요.';
    else if (state.served >= 4) msg = '좋아요. 코인이 차곡차곡 쌓였어요.';
    else msg = '오늘은 헷갈리는 손님이 많았어요. 도감 보고 다시 도전!';
    $('endMsg').textContent = msg;

    show('scEnd');
  }

  /* ---------- 도감 ---------- */
  var dexBuilt = false;
  function buildDex() {
    if (dexBuilt) return;
    dexBuilt = true;
    $('dexGrid').innerHTML = T.MENU.map(function (m) {
      return '<button class="dcard" data-id="' + m.id + '" type="button">' +
        '<img src="' + m.thumb + '" alt="' + m.name + '" loading="lazy">' +
        '<span class="cap"><b>' + m.name + '</b><span>' + m.effect + '</span></span></button>';
    }).join('');
  }
  function openDex() {
    buildDex();
    $('dex').classList.add('on');
    $('dex').setAttribute('aria-hidden', 'false');
  }
  function closeDex() {
    $('dex').classList.remove('on');
    $('dex').setAttribute('aria-hidden', 'true');
    closeLight();
  }

  var light = null;
  function openLight(id) {
    var m = menuOf(id);
    if (!light) {
      light = document.createElement('div');
      light.className = 'light';
      light.innerHTML = '<div class="light-card"><img alt=""><div class="lb"><h3></h3><p></p><span class="lg"></span></div></div>';
      light.addEventListener('click', function (e) {
        if (e.target === light || e.target.tagName === 'IMG' || e.target.className === 'lb') closeLight();
      });
      document.body.appendChild(light);
    }
    light.querySelector('img').src = m.img;
    light.querySelector('img').alt = m.name;
    light.querySelector('h3').textContent = m.name;
    light.querySelector('p').textContent = m.desc;
    light.querySelector('.lg').textContent = m.effect;
    light.classList.add('on');
  }
  function closeLight() { if (light) light.classList.remove('on'); }

  /* ---------- 이벤트 ---------- */
  $('startBtn').addEventListener('click', start);
  $('againBtn').addEventListener('click', start);
  $('dexBtn').addEventListener('click', openDex);
  $('dexBtn2').addEventListener('click', openDex);
  $('dexClose').addEventListener('click', closeDex);
  $('dex').addEventListener('click', function (e) { if (e.target.id === 'dex') closeDex(); });
  $('dexGrid').addEventListener('click', function (e) {
    var b = e.target.closest('.dcard');
    if (b) openLight(b.dataset.id);
  });
  $('tray').addEventListener('click', function (e) {
    var b = e.target.closest('.mcard');
    if (b) togglePick(b.dataset.id);
  });
  $('serveBtn').addEventListener('click', serve);
  $('clearBtn').addEventListener('click', function () {
    state.pick = [];
    renderTray();
    $('pickCount').textContent = '0 / ' + (state.order ? state.order.need.length : 1);
    updateServe();
  });
  $('rNext').addEventListener('click', next);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeDex(); }
  });

  /* 검증용 훅 (카페 게임과 같은 방식) */
  window.__snack = {
    CUST: CUST, start: start, serve: serve, next: next, renderRound: renderRound,
    togglePick: togglePick,
    get state() { return state; }
  };

  /* 지갑 표시 */
  T.syncUI();
  $('ownerName').textContent = T.nick() + ' 사장님';
  $('ownerFace').alt = T.nick() + ' 사장님';
  buildDex();
})();
