/* ===== 발레 왕국 마을 · 공용 지갑/스탯/옷장 ===== */
(function () {
  'use strict';

  var KEY = 'sugartown.v1';
  var COURT_BACKUP = KEY + '.court';
  var V = '20261122p';
  var STAGE_CLASSES = 2;
  var NICK_DEFAULT = '슈가', NICK_MAX = 8;
  var PRACTICE = {
    bar: { fee: 0, coins: 50, life: 1 },
    center: { fee: 0, coins: 80, life: 2 },
    piece: { fee: 0, coins: 120, life: 3 }
  };
  var OLD_TUITION = { bar: 100, center: 150, piece: 250 };
  var GRANT = 60, POTION_PRICE = 30, ORDERS_PER_LEVEL = 3;

  /* 레벨업 보상: 코인 + 옷장 해금 (한 번만) */
  var LEVEL_GIFTS = {
    2: { coins: 100, dress: 'swan' },
    3: { coins: 200, dress: 'black' },
    4: { coins: 300, dress: 'sugar' },
    5: { coins: 500, dress: null }
  };

  /* town/ 루트 경로 (assets/town.js 위치 기준) — 하위 페이지에서도 사진 경로가 맞도록 */
  var ROOT = (function () {
    var src = (document.currentScript && document.currentScript.src) || '';
    src = src.split('?')[0];
    var i = src.indexOf('/assets/town.js');
    return i >= 0 ? src.slice(0, i + 1) : 'assets/';
  })();
  function A(p) { return ROOT + p + (p.indexOf('?') < 0 ? '?v=' + V : ''); }

  var STATS = {
    flex: { key: 'flex', label: '유연성', icon: '💫' },
    stam: { key: 'stam', label: '체력', icon: '🔥' },
    axis: { key: 'axis', label: '중심축', icon: '⚖️' },
    turn: { key: 'turn', label: '턴아웃', icon: '🌀' }
  };

  var SUP = 'assets/chars/';

  var SPIRITS = {
    ara: {
      id: 'ara', name: '아라', role: '아라베스크 · 선', color: '#7d9ad8', img: A(SUP + 'ara.webp'),
      nature: '새벽의 빛을 모아 두는, 조용히 시를 쓰는 정령',
      cheer: [
        '{n}님의 선이 오늘 유난히 길어 보여요.',
        '손끝에서 발끝까지, 무대 끝까지 이어져요.',
        '긴 선은 서두르지 않는 마음에서 나와요. 오늘 그 마음이 보여요.'
      ]
    },
    alle: {
      id: 'alle', name: '알레', role: '음악 · 리듬', color: '#77c2a7', img: A(SUP + 'alle.webp'),
      nature: '늘 흥얼거리며 세 박자를 세는 정령',
      cheer: [
        '하나, 둘, 셋. 이 박자에 {n}님이 있어요.',
        '음악이 {n}님을 기다리고 있어요. 천천히 나가도 돼요.',
        '마지막 박자까지 제가 세어 줄게요. 숨 쉬는 것도 박자예요.'
      ]
    },
    etu: {
      id: 'etu', name: '에튜', role: '에티튜드 · 균형', color: '#ab8fdb', img: A(SUP + 'etu.webp'),
      nature: '말수는 적고, 곁을 오래 지키는 정령',
      cheer: [
        '조용히 옆에 있을게요. 숨 한 번 고르고 시작해요.',
        '중심은 이미 {n}님 안에 있어요. 오늘은 그걸 믿어 봐요.',
        '{n}님의 균형을 제가 지켜보고 있어요. 끝까지 함께할게요.'
      ]
    },
    shangz: {
      id: 'shangz', name: '샹즈', role: '샹주망 · 도약', color: '#e0b465', img: A(SUP + 'shangz.webp'),
      nature: '높은 곳과 구름을 좋아하는, 씩씩한 겁쟁이',
      cheer: [
        '점프는 가볍게, 착지는 다정하게!',
        '무대 위에서 {n}님이 날아오르면 제가 구름을 받아 줄게요.',
        '높이보다 중요한 건 착지예요. 그거, {n}님은 이미 알아요.'
      ]
    },
    piru: {
      id: 'piru', name: '피루', role: '피루엣 · 회전', color: '#e5899f', img: A(SUP + 'piru.webp'),
      nature: '빙글빙글 도는 걸 좋아하는, 밝고 조금 급한 마음',
      cheer: [
        '한 바퀴, 두 바퀴 — {n}님은 제자리로 돌아올 거예요.',
        '돌아도 중심은 그대로! 제가 손끝을 잡아 줄게요.',
        '오늘의 회전은 {n}님 거예요. 마음껏 돌아 봐요!'
      ]
    },
    sugar: { id: 'sugar', name: '슈가 공주', role: '발레 왕국의 주인공', color: '#b98fd8', img: A(SUP + 'sugar.webp') }
  };

  var STAFF = {
    etu: { name: '에티튜드 밸런스', gift: 'axis', unit: 4, line: '음악이 멈춰도 한 박자 더 머물 수 있게, 중심을 한 방울 담았어.' },
    ara: { name: '아라베스크 이슬', gift: 'flex', unit: 4, line: '손끝에서 발끝까지, {n}님의 선이 길게 이어지길.' },
    piru: { name: '피루엣 스파이럴', gift: 'coins', unit: 12, line: '한 바퀴 돌고 제자리! {n}님의 연습 보상에 코인을 더할게.' },
    shangz: { name: '그랑 제떼 구름', gift: 'stam', unit: 4, line: '마지막 점프까지 가볍게! 구름 한 조각을 녹였어.' },
    alle: { name: '세 박자 왈츠', gift: 'life', unit: 1, line: '하나, 둘, 셋. {n}님의 박자에 왕국의 생명력도 차올라.' }
  };
  function staffLine(id) {
    return String((STAFF[id] && STAFF[id].line) || '').replace(/\{n\}/g, nick());
  }

  function staffLevel(orders) { return 1 + Math.floor(orders / ORDERS_PER_LEVEL); }
  function effectFor(id, level) {
    var staff = STAFF[id], amount = staff.unit * level;
    var label = staff.gift === 'coins' ? '연습 코인' : staff.gift === 'life' ? '왕국 생명력' : STATS[staff.gift].label;
    return { key: staff.gift, amount: amount, label: label + ' +' + amount };
  }
  function spiritArt(id, portrait) {
    return A('../kingdom/assets/' + (portrait ? 'av_' + id : id + '_hero') + '.webp');
  }

  /* ---------- 정령 친밀도 (하트 1~5) ---------- */
  // 교감 한 번(포션 주문 · 함께 연습 · 분식 대접)마다 1점. 아래 횟수에 닿으면 하트가 하나 늘어난다.
  var BOND_STEPS = [0, 1, 3, 6, 10];
  var BOND_MAX = BOND_STEPS.length;
  var BOND_IDS = ['etu', 'ara', 'piru', 'shangz', 'alle'];
  var TEACHER = { bar: 'etu', center: 'piru', piece: 'ara' };
  var JOURNAL_MAX = 40;

  function bondLevel(points) {
    var lv = 1;
    for (var i = 1; i < BOND_STEPS.length; i++) if (points >= BOND_STEPS[i]) lv = i + 1;
    return Math.min(BOND_MAX, lv);
  }
  function bondLine(text) { return String(text || '').replace(/\{n\}/g, nick()); }
  function cheerOf(id, level) {
    var list = (SPIRITS[id] && SPIRITS[id].cheer) || [];
    if (!list.length) return '';
    return bondLine(list[level >= 5 ? 2 : level >= 3 ? 1 : 0]);
  }
  function bondOf(id) {
    var s = get(), rec = s.spirits[id] || { bond: 0, met: 0 };
    var level = bondLevel(rec.bond), nextAt = level < BOND_MAX ? BOND_STEPS[level] : null;
    var from = BOND_STEPS[level - 1];
    return {
      id: id, name: SPIRITS[id].name, level: level, points: rec.bond, max: BOND_MAX,
      met: rec.met || 0, next: nextAt, left: nextAt == null ? 0 : Math.max(0, nextAt - rec.bond),
      pct: nextAt == null ? 100 : Math.round((rec.bond - from) / Math.max(1, nextAt - from) * 100),
      line: cheerOf(id, level)
    };
  }
  function bonds() { return BOND_IDS.map(bondOf); }
  function topBonds(n) {
    return bonds().sort(function (a, b) { return b.points - a.points || a.id.localeCompare(b.id); }).slice(0, n || 2);
  }
  function heartsHTML(level, cls) {
    var out = '';
    for (var i = 0; i < BOND_MAX; i++) out += '<span class="hrt' + (i < level ? ' on' : '') + '">♥</span>';
    return '<span class="heart-row' + (cls ? ' ' + cls : '') + '" role="img" aria-label="친밀도 ' + level + ' / ' + BOND_MAX + '">' + out + '</span>';
  }

  /* ---------- 정령의 편지 ---------- */
  var LETTERS = {
    etu: [
      { at: 1, title: '첫 편지 · 한 박자 더', body: '안녕하세요, {n}님. 오늘 바 앞에 서는 걸 저도 조용히 봤어요. 처음엔 누구나 발끝이 떨려요. 저는 그 떨림이 싫지 않아요. 숨을 한 번 고르고, 한 박자만 더 머물러 봐요.' },
      { at: 3, title: '두 번째 편지 · 흔들려도 괜찮아요', body: '{n}님, 요즘 중심이 자주 흔들린다고 했죠. 흔들리는 건 무너지는 게 아니에요. 돌아올 자리를 알고 있다는 뜻이니까요. 오늘은 바를 잠깐 놓고 서 봐요. 제가 옆에서 셀게요.' },
      { at: 5, title: '세 번째 편지 · 우리의 중심', body: '{n}님과 함께한 날을 세어 보면, 처음엔 한 박자였던 게 지금은 한 곡이 되었어요. 다음 무대에 서면 저는 객석이 아니라 무대 옆에 있을게요. {n}님이 돌아올 자리는 언제나 여기예요.' }
    ],
    ara: [
      { at: 1, title: '첫 편지 · 손끝의 선', body: '{n}님, 오늘 손끝이 참 멀리까지 뻗어 있었어요. 선은 힘으로 만드는 게 아니라 기다림으로 길어져요. 제가 새벽에 모은 빛 한 조각을 {n}님 손끝에 얹어 둘게요.' },
      { at: 3, title: '두 번째 편지 · 숲을 닮은 사람', body: '{n}님이 아라베스크를 할 때, 저는 늘 그 뒤로 이어지는 숲을 상상해요. 나무가 바람에 기대듯, {n}님도 조금은 기대도 돼요. 혼자 다 버티지 않아도 괜찮아요.' },
      { at: 5, title: '세 번째 편지 · 긴 선의 끝에서', body: '오늘 {n}님의 선은 무대 끝까지 닿았어요. 저는 그 끝을 오래 바라봤어요. 다음엔 그 너머의 빛까지 그려 볼래요? 천천히, 서두르지 않고 함께요.' }
    ],
    piru: [
      { at: 1, title: '첫 편지 · 한 바퀴만', body: '{n}님! 오늘 회전을 세다가 저만 먼저 어지러웠어요. 한 바퀴만 돌아도 충분해요. 처음엔 그거면 돼요. 내일은 두 바퀴, 그다음엔 세 바퀴 — 제가 옆에서 박수 칠게요!' },
      { at: 3, title: '두 번째 편지 · 제자리를 찾는 법', body: '{n}님은 돌다가 자꾸 바깥을 봐요. 괜찮아요, 저도 그래요. 그런데 한 번만 눈을 감고 돌면 제자리가 발밑에 있다는 걸 알게 돼요. 오늘 한 번만 해 봐요.' },
      { at: 5, title: '세 번째 편지 · 마지막 한 바퀴', body: '{n}님, 이제 저보다 오래 돌 수 있게 됐네요. 조금 서운하고 많이 기뻐요. 다음 무대에서 마지막 한 바퀴는 꼭 같이 돌아요. 약속!' }
    ],
    shangz: [
      { at: 1, title: '첫 편지 · 구름 위에서', body: '{n}님, 오늘 그랑제떼 착지 소리가 아주 가벼웠어요! 저는 구름 위에서 그 소리를 들었어요. 점프는 높이보다 착지가 예쁜 거래요. 그것만 기억해요.' },
      { at: 3, title: '두 번째 편지 · 겁이 나도 뛰는 마음', body: '사실 저도 높은 곳이 무서워요. {n}님 앞에서는 씩씩한 척했지만요. 무서운데도 뛰는 마음이 제일 멋있다고 생각해요. 내일도 같이 뛰어요!' },
      { at: 5, title: '세 번째 편지 · 다시 땅으로', body: '{n}님, 아무리 높이 뛰어도 돌아올 자리가 있어야 해요. 저는 {n}님이 착지할 자리를 늘 준비해 둘게요. 그러니까 마음껏 뛰어요. 받아 줄 사람, 여기 있어요.' }
    ],
    alle: [
      { at: 1, title: '첫 편지 · 세 박자', body: '{n}님, 오늘 첫 박자를 세다가 저도 모르게 흥얼거렸어요. 하나, 둘, 셋. 이 세 박자에 {n}님이 들어와요. 서두르지 않아도 음악은 기다려 줘요.' },
      { at: 3, title: '두 번째 편지 · 쉼표도 음악이에요', body: '{n}님이 삐끗한 날, 저는 음악을 잠깐 멈췄어요. 쉼표도 음악이거든요. 쉬었다 가도 곡은 끝나지 않아요. 이어지는 마음만 있으면 돼요.' },
      { at: 5, title: '세 번째 편지 · 마지막 박자', body: '오늘 {n}님은 마지막 박자까지 흔들리지 않았어요. 저는 그 끝을 오래 기억할 거예요. 다음 곡도 같이 들어요. {n}님 박자에 맞춰서.' }
    ]
  };
  function lettersFor(id) {
    var s = get(), level = bondLevel((s.spirits[id] || {}).bond || 0);
    return (LETTERS[id] || []).map(function (letter, i) {
      return {
        id: id + '-' + i, at: letter.at, title: letter.title, body: bondLine(letter.body),
        unlocked: level >= letter.at, read: s.letters.indexOf(id + '-' + i) >= 0
      };
    });
  }
  function unreadLetters(id) {
    return lettersFor(id).filter(function (letter) { return letter.unlocked && !letter.read; }).length;
  }
  function readLetter(key) {
    return updateWallet(function (s) {
      if (s.letters.indexOf(key) < 0) s.letters.push(key);
    });
  }

  /* ---------- 성장 일기 ---------- */
  function addJournal(s, key, icon, text) {
    if (!s.journal) s.journal = [];
    if (key && s.journal.some(function (row) { return row.key === key; })) return false;
    s.journal.push({ at: Date.now(), key: key || '', icon: icon || '🩰', text: text });
    if (s.journal.length > JOURNAL_MAX) s.journal = s.journal.slice(-JOURNAL_MAX);
    return true;
  }
  // 정령과 조금 더 가까워진다. 오른 하트마다 일기에 한 줄이 남는다.
  function raiseBond(s, id, n) {
    if (!Object.hasOwn(STAFF, id) || !Object.hasOwn(SPIRITS, id)) return null;
    if (!s.spirits[id]) s.spirits[id] = { bond: 0, met: 0 };
    var rec = s.spirits[id], before = bondLevel(rec.bond);
    if (!rec.met) rec.met = Date.now();
    rec.bond = Math.min(BOND_STEPS[BOND_MAX - 1], rec.bond + Math.max(1, Math.round(n || 1)));
    var after = bondLevel(rec.bond), levels = [];
    for (var lv = before + 1; lv <= after; lv++) {
      levels.push(lv);
      addJournal(s, 'bond-' + id + '-' + lv, '♥', josa(SPIRITS[id].name, '과', '와') + ' 친밀도 Lv.' + josa(String(lv), '이', '가') + ' 되었어요. ' + josa(SPIRITS[id].nature, '이라고', '라고') + ' 해요.');
    }
    return { id: id, name: SPIRITS[id].name, before: before, level: after, points: rec.bond, levels: levels };
  }
  function addBond(id, n) { return updateWallet(function (s) { return raiseBond(s, id, n); }); }
  function setPracticeWith(id) {
    return updateWallet(function (s) { s.practiceWith = Object.hasOwn(STAFF, id) ? id : null; return s.practiceWith; });
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
      id: 'lilac', name: '라일락 쉬폰 스커트', price: 0, giftAt: 1,
      bo: '#C7AEE4', bo2: '#E5D6F6', sk: '#E7D8F8', sk2: '#F7EFFF',
      tag: '바에서도 사뿐사뿐', desc: '바 워크할 때 스커트가 살랑, 라일락 향이 나요.'
    },
    {
      id: 'swan', name: '백조 화이트 튜튜', price: 300, levelAt: 2,
      bo: '#FFFDF7', bo2: '#FFFFFF', sk: '#FFFFFF', sk2: '#FBF5EC',
      tag: '지젤 2막의 그 느낌', desc: '하얀 튜튜를 입으면 왠지 발끝이 가벼워져요.'
    },
    {
      id: 'black', name: '블랙 스완 레오타드', price: 600, levelAt: 3,
      bo: '#332B40', bo2: '#4C3F5E', sk: '#3A3048', sk2: '#5A4B6E',
      tag: '오디르의 32 바퀴', desc: '어두운 무대 위에서 더 빛나는 검은 깃털.'
    },
    {
      id: 'sugar', name: '마법 슈가 드레스', price: 1000, levelAt: 4, hi: true,
      bo: '#B78CD8', bo2: '#F2C4DE', sk: '#E9C9F2', sk2: '#FDE8F3',
      tag: '슈가의 마지막 드레스', desc: '발레 왕국에서 가장 반짝이는 드레스. 무대 위 최고의 날.'
    }
  ];

  var DEFAULT = {
    v: 1, coins: GRANT, nick: '', named: false, shows: 0, bestGrade: '',
    kingdom: { charter: 1, life: 1, orders: { etu: 0, ara: 0, piru: 0, shangz: 0, alle: 0 }, prepared: null, meal: null, receipt: null, debutOutfit: null },
    spirits: {
      etu: { bond: 0, met: 0 }, ara: { bond: 0, met: 0 }, piru: { bond: 0, met: 0 },
      shangz: { bond: 0, met: 0 }, alle: { bond: 0, met: 0 }
    },
    journal: [], letters: [], practiceWith: null,
    stats: { flex: 0, stam: 0, axis: 0, turn: 0 },
    owned: ['basic'], worn: 'basic',
    stamps: { bar: 0, center: 0, piece: 0 },
    classes: 0, served: 0, best: 0, bestRound: 0, seen: [],
    gifts: [], levelUp: null, fame: 0, show: null,
    lastServe: null, createdAt: 0, lesson: null, lastLessons: {}
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- 주인공 닉네임 ---------- */
  // 무대 포스터와 대사에 그대로 들어가므로 태그·따옴표는 걷어 내고 여덟 자로 자른다.
  function cleanNick(value) {
    var out = String(value == null ? '' : value).replace(/[<>"'`\\&]/g, '').replace(/\s+/g, ' ').trim();
    return out.slice(0, NICK_MAX);
  }
  function nick() { return get().nick || NICK_DEFAULT; }
  function named() { return !!get().named; }
  function setNick(value) {
    var next = cleanNick(value);
    return updateWallet(function (s) {
      s.nick = next;
      s.named = true;
      addJournal(s, 'arrive', '✉️', (next || NICK_DEFAULT) + '님이 발레왕국에 도착했어요. 오늘부터 한 걸음씩.');
      return next;
    });
  }
  // 받침 유무에 맞춰 조사를 고른다. (루네와 / 하늘과)
  function hasBatchim(word) {
    var text = String(word || ''), code = text.charCodeAt(text.length - 1);
    if (!(code >= 0xAC00 && code <= 0xD7A3)) return false;
    return (code - 0xAC00) % 28 !== 0;
  }
  function josa(word, afterConsonant, afterVowel) {
    return String(word || '') + (hasBatchim(word) ? afterConsonant : afterVowel);
  }

  var NOTE_TYPES = { beat: 1, cat: 1, jump: 1, beam: 1, turn: 1 };

  /* ---------- 상점 메뉴 (기존 사진 그대로 · 가격은 코인) ---------- */
  // 분식집: 기존 메뉴 사진과 이름을 그대로 쓴다.
  var SNACK_PRICE = { tteokbokki: 40, fried: 45, sundae: 35, jjolmyeon: 50, skewer: 30, cola: 25, orderset: 90, fullset: 120 };
  var SNACK_BUFF = {
    tteokbokki: { jump: 60, shield: 1 }, fried: { shield: 1, all: 10 }, sundae: { all: 25 },
    jjolmyeon: { turn: 55, combo: 1 }, skewer: { beam: 55 }, cola: { all: 15 },
    orderset: { all: 35, shield: 1 }, fullset: { all: 45, shield: 1, combo: 1 }
  };
  var SNACK_LINE = {
    tteokbokki: '냠냠, 매콤해! 다리가 쫙 펴졌어요.', fried: '바삭! 넘어져도 다시 일어날 힘이 생겼어요.',
    sundae: '한 입에 든든해요. 이제 침착하게 할 수 있어요.', jjolmyeon: '쫄깃쫄깃, 돌아도 중심이 안 흔들려요.',
    skewer: '호호, 따뜻해요. 균형대가 가볍게 느껴져요.', cola: '탄산 톡! 몸이 가벼워졌어요.',
    orderset: '와, 한 상 가득! 오늘은 뭐든 할 수 있어요.', fullset: '전메뉴 클리어! 오늘 발레는 무조건 잘 돼요.'
  };
  MENU.forEach(function (m) {
    m.price = SNACK_PRICE[m.id] || 40;
    m.buff = SNACK_BUFF[m.id] || { all: 20 };
    m.line = SNACK_LINE[m.id] || m.magic;
  });

  // 카페: 기존 음료 사진(cafe/assets)을 그대로 쓴다. 경로는 /town/cafe/ 기준.
  var CAFE = [
    { id: 'arabesque', name: '아라베스크 밀크', price: 50, img: '../../cafe/assets/drink-arabesque.webp',
      desc: '거품 위에 아라베스크가 그려진 시그니처', buff: { all: 25, beam: 40 }, tag: '선 · 균형',
      line: '홀짝, 거품이 부드러워요. 아라도 기뻐해요!' },
    { id: 'turnout', name: '턴아웃 라떼', price: 45, img: '../../cafe/assets/drink-turnout.webp',
      desc: '턴아웃이 잡히는 진한 라떼', buff: { all: 30 }, tag: '중심 · 턴아웃',
      line: '홀짝, 다리가 밖으로 도는 느낌이 딱 와요.' },
    { id: 'battement', name: '발레 카푸치노', price: 45, img: '../../cafe/assets/drink-battement.webp',
      desc: '거품 위에 발레리나가 그려진 카푸치노', buff: { turn: 45, all: 10 }, tag: '회전',
      line: '홀짝, 거품이 포근해요. 박자가 또렷하게 들려요.' },
    { id: 'americano', name: '아이스 아메리카노', price: 35, img: '../../cafe/assets/drink-americano.webp',
      desc: '차갑게 정신을 깨우고 콤보를 이어요', buff: { combo: 1, all: 15 }, tag: '콤보',
      line: '시원해! 머리가 맑아지고 손이 가벼워요.' }
  ];
  var TURN_LABEL = { cat: '파드샤', jump: '그랑제떼', beam: '아라베스크', turn: '피루엣', beat: '박자' };
  function buffChips(buff) {
    var out = [];
    if (!buff) return out;
    if (buff.all) out.push('판정 여유 +' + buff.all + 'ms');
    ['cat', 'jump', 'beam', 'turn', 'beat'].forEach(function (k) {
      if (buff[k]) out.push(TURN_LABEL[k] + ' +' + buff[k] + 'ms');
    });
    if (buff.shield) out.push('삐끗 ' + buff.shield + '회 보호');
    if (buff.combo) out.push('콤보 +' + buff.combo);
    return out;
  }
  function mealOf(kind, id) {
    var list = kind === 'cafe' ? CAFE : MENU;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  /* 코인으로 메뉴를 주문한다. 다음 연습·공연 한 번에 버프가 걸리고, 끝나면 사라진다. */
  function orderMeal(kind, id) {
    return updateWallet(function (s) {
      var m = mealOf(kind, id);
      if (!m) return { ok: false, reason: 'menu' };
      var price = m.price || 40;
      if (s.coins < price) return { ok: false, reason: 'coins', need: price - s.coins, menu: m };
      s.coins -= price;
      s.kingdom.meal = {
        kind: kind, id: m.id, name: m.name, price: price, tag: m.tag || '',
        buff: m.buff, line: m.line, at: Date.now()
      };
      addJournal(s, 'meal-' + kind + '-' + m.id, kind === 'cafe' ? '☕' : '🍢',
        nick() + '님이 ' + josa(m.name, '을', '를') + ' 주문했어요. 다음 연습에 그 기운이 남아 있어요.');
      return { ok: true, menu: m, price: price, coins: s.coins, meal: clone(s.kingdom.meal) };
    });
  }
  function validChart(chart) {
    return !!chart && Array.isArray(chart.notes) && chart.notes.length >= 4 && chart.notes.length <= 40 &&
      typeof chart.total === 'number' && isFinite(chart.total) && chart.total > 0 && chart.total < 600000 &&
      chart.notes.every(function (n) {
        return n && typeof n.t === 'number' && isFinite(n.t) && n.t >= 0 && Object.hasOwn(NOTE_TYPES, n.type);
      });
  }

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
      if (DRESS.some(function (d) { return d.id === kingdom.debutOutfit; })) s.kingdom.debutOutfit = kingdom.debutOutfit;
      var meal = kingdom.meal;
      if (meal && (meal.kind === 'cafe' || meal.kind === 'snack') && mealOf(meal.kind, meal.id)) {
        var menu = mealOf(meal.kind, meal.id);
        s.kingdom.meal = { kind: meal.kind, id: menu.id, name: menu.name, price: menu.price, tag: menu.tag || '', buff: menu.buff, line: menu.line, at: Number.isFinite(meal.at) ? meal.at : Date.now() };
      }
      var receipt = kingdom.receipt;
      if (receipt && Object.hasOwn(PRACTICE, receipt.kind) && Number.isFinite(receipt.coins) &&
          ((Array.isArray(receipt.keys) && receipt.keys.length === 3) ||
           (Number.isSafeInteger(receipt.notes) && Number.isSafeInteger(receipt.perfect)))) {
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
    if (s.classes >= 1 && !s.owned.includes('lilac')) s.owned.push('lilac');
    if (Array.isArray(raw.gifts)) {
      s.gifts = raw.gifts.filter(function (n) { return Number.isSafeInteger(n) && n >= 2 && n <= LEVELS.length; });
    }
    var pending = raw.levelUp;
    if (pending && Number.isSafeInteger(pending.level) && pending.level > 1 && pending.level <= LEVELS.length &&
        Number.isFinite(pending.coins)) {
      s.levelUp = { level: pending.level, name: String(pending.name || LEVELS[pending.level - 1].name), coins: Math.max(0, Math.round(pending.coins)), dress: DRESS.some(function (d) { return d.id === pending.dress; }) ? pending.dress : null, gift: pending.gift === 'coins' ? 'coins' : null };
    }
    if (raw.named === true) s.named = true;
    if (typeof raw.nick === 'string') {
      var nickname = cleanNick(raw.nick);
      if (nickname) { s.nick = nickname; s.named = true; }
    }
    if (typeof raw.shows === 'number' && isFinite(raw.shows)) s.shows = Math.max(0, Math.round(raw.shows));
    if (typeof raw.bestGrade === 'string' && /^[SABC]/.test(raw.bestGrade)) s.bestGrade = raw.bestGrade.charAt(0);
    if (typeof raw.fame === 'number' && isFinite(raw.fame)) s.fame = Math.max(0, Math.round(raw.fame));
    var show = raw.show;
    if (show && typeof show.grade === 'string' && Number.isFinite(show.score)) {
      s.show = { grade: show.grade.slice(0, 2), score: Math.max(0, Math.round(show.score)), coins: Math.max(0, Math.round(show.coins || 0)), notes: Math.max(0, Math.round(show.notes || 0)), perfect: Math.max(0, Math.round(show.perfect || 0)), at: Number.isFinite(show.at) ? show.at : Date.now(), outfit: DRESS.some(function (d) { return d.id === show.outfit; }) ? show.outfit : null };
      if (!s.kingdom.debutOutfit && s.show.outfit) s.kingdom.debutOutfit = s.show.outfit;
      // 공연 횟수를 세기 전에 저장된 지갑은 마지막 공연 한 번으로 시작한다.
      if (!s.shows) s.shows = 1;
      if (!s.bestGrade) s.bestGrade = s.show.grade;
    }
    if (Array.isArray(raw.seen)) s.seen = raw.seen.filter(function (id) { return typeof id === 'string'; });
    // 정령 친밀도: 새 지갑은 주문 기록(orders)에서 한 번만 이어받는다.
    var spiritSave = raw.spirits, seeded = false;
    if (spiritSave && typeof spiritSave === 'object') {
      Object.keys(STAFF).forEach(function (id) {
        var saved = spiritSave[id];
        if (!saved || typeof saved !== 'object') return;
        seeded = true;
        if (typeof saved.bond === 'number' && isFinite(saved.bond)) {
          s.spirits[id].bond = Math.max(0, Math.min(BOND_STEPS[BOND_MAX - 1], Math.round(saved.bond)));
        }
        if (typeof saved.met === 'number' && isFinite(saved.met)) s.spirits[id].met = saved.met;
      });
    }
    if (!seeded) {
      Object.keys(STAFF).forEach(function (id) {
        var ordered = s.kingdom.orders[id] || 0;
        if (ordered > 0) s.spirits[id].bond = Math.min(BOND_STEPS[BOND_MAX - 1], ordered);
      });
    }
    if (Array.isArray(raw.letters)) {
      s.letters = raw.letters.filter(function (key) {
        return typeof key === 'string' && Object.keys(STAFF).some(function (id) { return key.indexOf(id + '-') === 0; });
      });
    }
    if (raw.practiceWith && Object.hasOwn(STAFF, raw.practiceWith)) s.practiceWith = raw.practiceWith;
    if (Array.isArray(raw.journal)) {
      s.journal = raw.journal.filter(function (row) {
        return row && typeof row.text === 'string' && typeof row.at === 'number';
      }).slice(-JOURNAL_MAX).map(function (row) {
        return { at: row.at, key: typeof row.key === 'string' ? row.key : '', icon: typeof row.icon === 'string' ? row.icon : '🩰', text: row.text };
      });
    }
    if (raw.lastServe && typeof raw.lastServe === 'object') s.lastServe = raw.lastServe;
    var lesson = raw.lesson;
    if (lesson && Object.hasOwn(PRACTICE, lesson.kind) && typeof lesson.id === 'string' && validChart(lesson.chart)) {
      s.lesson = {
        id: lesson.id, kind: lesson.kind, mode: 'rhythm', index: 0,
        paidFee: Number.isSafeInteger(lesson.paidFee) ? Math.max(0, lesson.paidFee) : 0, chart: lesson.chart
      };
    } else if (lesson && Object.hasOwn(PRACTICE, lesson.kind) && typeof lesson.id === 'string' &&
        Array.isArray(lesson.rounds) && lesson.rounds.length === 3 &&
        Number.isInteger(lesson.index) && lesson.index >= 0 && lesson.index < lesson.rounds.length &&
        lesson.rounds.every(function (r) { return r && typeof r.key === 'string' && Array.isArray(r.choices) && Array.isArray(r.picks); })) {
      // An older tab still holds a fill-in-the-blank booking; the studio swaps in that class's rhythm chart.
      s.lesson = lesson;
    }
    Object.keys(PRACTICE).forEach(function (kind) {
      if (raw.lastLessons && Array.isArray(raw.lastLessons[kind])) s.lastLessons[kind] = raw.lastLessons[kind];
    });
    // 이미 수업을 쌓은 지갑은 일기가 비어 있지 않게 한 줄로 이어 준다.
    if (!s.journal.length && s.classes > 0) {
      addJournal(s, 'resume', '📖', '지금까지 수업 ' + s.classes + '회를 마쳤어요. 오늘부터 성장 일기에 한 줄씩 쌓여요.');
    }
    if (typeof raw.createdAt === 'number') s.createdAt = raw.createdAt;
    return s;
  }

  var S = null, memoryOnly = false, inTransaction = false, needsCharter = false, needsGift = false, needsLevelGift = false;
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
      needsGift = !!(saved && saved.classes >= 1 && !(Array.isArray(saved.owned) && saved.owned.includes('lilac')));
      S = normalize(saved);
      // 이미 오른 레벨의 보상을 아직 못 받은 지갑은 한 번만 채워 준다.
      needsLevelGift = false;
      if (!needsCharter) {
        var top = rankOf(S).n;
        for (var n = 2; n <= top; n++) if (S.gifts.indexOf(n) < 0) { needsLevelGift = true; break; }
      }
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
      var bond = raiseBond(s, id, 1);
      addJournal(s, 'first-potion', '🧪', nick() + '님이 처음으로 정령에게 포션을 주문했어요. ' + SPIRITS[id].name + '가 생명력 한 방울을 받았어요.');
      return { level: level, leveled: level > oldLevel, bond: bond };
    });
  }

  function rewardFor(kind, potion) {
    var rules = PRACTICE[kind], coins = rules.coins, life = rules.life;
    var extra = potion && effectFor(potion.id, potion.level);
    if (extra && extra.key === 'coins') coins += extra.amount;
    if (extra && extra.key === 'life') life += extra.amount;
    return { coins: coins, life: life, extra: extra };
  }

  // A finished lesson settles in one wallet write: reward, potion, stamp, stats, gift and receipt.
  function settlePractice(s, run, classStats, score) {
    var k = s.kingdom, potion = k.prepared, reward = rewardFor(run.kind, potion);
    var stats = Object.assign({}, classStats);
    if (reward.extra && Object.hasOwn(STATS, reward.extra.key)) {
      stats[reward.extra.key] = (stats[reward.extra.key] || 0) + reward.extra.amount;
    }
    var bonus = score ? Math.max(0, Math.round(score.comboCoins || 0)) + Math.max(0, Math.round(score.noteCoins || 0)) : 0;
    // Everyone gets attendance credit; successful technique earns more stats and coins.
    if (score && score.notes > 0) {
      var accuracy = Math.min(1, ((score.perfect || 0) + 0.65 * (score.good || 0)) / score.notes);
      Object.keys(classStats).forEach(function (key) {
        var extra = stats[key] - classStats[key];
        stats[key] = Math.max(1, Math.round(classStats[key] * (0.5 + 0.5 * accuracy))) + extra;
      });
      var techniqueCoins = Math.round(30 * accuracy);
      bonus += techniqueCoins;
    }
    var legacyFee = run.kind === 'bar' && !s.stamps.bar ? 0 : OLD_TUITION[run.kind];
    var refund = Number.isSafeInteger(run.paidFee) ? Math.max(0, run.paidFee) : legacyFee;
    var gift = !s.owned.includes('lilac') ? 'lilac' : null;
    var receipt = {
      lessonId: run.id, kind: run.kind, keys: run.rounds ? run.rounds.map(function (r) { return r.key; }) : [],
      first: run.rounds ? run.rounds.filter(function (r) { return r.picks.length === 1; }).length : 0,
      levelBefore: level().n, classesAfter: s.classes + 1,
      coins: reward.coins + bonus, baseCoins: reward.coins, bonusCoins: bonus, life: reward.life,
      before: s.coins, after: s.coins + reward.coins + bonus + refund, refund: refund,
      stats: stats, potion: potion, gift: gift
    };
    if (score) {
      receipt.notes = score.notes || 0; receipt.perfect = score.perfect || 0; receipt.good = score.good || 0;
      receipt.miss = score.miss || 0; receipt.maxCombo = score.maxCombo || 0;
      receipt.comboCoins = Math.max(0, Math.round(score.comboCoins || 0));
      receipt.noteCoins = Math.max(0, Math.round(score.noteCoins || 0));
      receipt.techniqueCoins = techniqueCoins || 0;
    }
    if (gift) s.owned.push(gift);
    s.coins = receipt.after;
    k.life += reward.life;
    k.prepared = null;
    if (k.meal) receipt.meal = clone(k.meal);
    k.meal = null;
    Object.keys(stats).forEach(function (key) { s.stats[key] += stats[key]; });
    s.classes += 1;
    s.stamps[run.kind] += 1;
    s.lastLessons[run.kind] = receipt.keys;
    k.receipt = receipt;
    s.lesson = null;
    if (s.classes === 1) addJournal(s, 'first-class', '🩰', nick() + '님이 첫 수업을 마쳤어요. 바를 잡은 손끝까지 음악이 닿았어요.');
    var bonds = [];
    var teacherBond = raiseBond(s, TEACHER[run.kind], 1);
    if (teacherBond) bonds.push(teacherBond);
    if (s.practiceWith && s.practiceWith !== TEACHER[run.kind]) {
      var mateBond = raiseBond(s, s.practiceWith, 1);
      if (mateBond) bonds.push(mateBond);
    }
    receipt.bonds = bonds;
    var gifts = grantGifts(s);
    if (gifts.length) { receipt.levelUp = clone(s.levelUp); receipt.after = s.coins; }
    return receipt;
  }

  // The last correct answer of an older fill-in-the-blank lesson settles it.
  function finishPractice(s, classStats) {
    var run = s.lesson;
    if (!run || !run.rounds || run.index !== run.rounds.length - 1 || !run.rounds.every(function (r) { return r.picks.includes(r.key); })) return null;
    return settlePractice(s, run, classStats, null);
  }

  // A rhythm lesson settles when the song ends, with its judgement counts as the score.
  function finishRhythm(s, classStats, score) {
    var run = s.lesson;
    if (!run || run.mode !== 'rhythm' || !run.chart) return null;
    return settlePractice(s, run, classStats, score);
  }

  /* ---------- 프리마 발레리나 승급 로드맵 ---------- */
  // 레벨 = 승급 단계. 수료 수업에 더해 능력치와 극장 공연까지 갖춰야 다음 단계로 간다.
  var RANKS = [
    {
      n: 1, at: 0, short: '입문', name: '입문 발레리나', tag: '바에 처음 서는 날', icon: '🩰', need: {},
      voice: '발레는 처음이에요. 그래도 오늘 바 하나는 잡을 수 있을 것 같아요.',
      tease: {
        stage: '바 끝에서 센터로 — 손을 떼고 서는 첫 장면',
        spirit: 'etu', line: '바를 놓아도 괜찮다고, 균형은 이미 네 안에 있다고 말해 줄게요.'
      }
    },
    {
      n: 2, at: 2, short: '견습', name: '견습 발레리나', tag: '두 번의 수업', icon: '🎀', need: {},
      voice: '수업 두 번이면 다리가 조금은 말을 들어요. 내일은 센터에 서 볼래요.',
      tease: {
        stage: '다섯 정령이 나란히 서서 박수를 보내는 군무 무대',
        spirit: 'alle', line: '세 박자만 세면 돼. 하나, 둘, 셋 — 그 사이에 네가 있어.'
      }
    },
    {
      n: 3, at: 5, short: '군무', name: '코르 드 발레', tag: '군무 발레리나', icon: '🌷', need: { stat: 20 },
      voice: '군무 속에서도 제 박자를 찾았어요. 옆에 정령들이 서 있으면 덜 떨려요.',
      tease: {
        stage: '조명이 {n}님 한 사람만 비추는 단독 무대',
        spirit: 'shangz', line: '단독 무대는 무섭지 않아. 내가 뒤에서 도약을 세어 줄게.'
      }
    },
    {
      n: 4, at: 9, short: '솔리스트', name: '솔리스트', tag: '단독 무대', icon: '✨', need: { stat: 40, shows: 1 },
      voice: '솔리스트. 조명이 저 하나만 비춰도 발끝은 아직 떨려요. 괜찮아요, 떨려도 예뻐요.',
      tease: {
        stage: '황금 포스터와 앙코르가 기다리는 프리마 피날레',
        spirit: 'piru', line: '마지막 한 바퀴, 내가 손끝을 잡아 줄게. 돌아도 네 중심은 그대로야.'
      }
    },
    {
      n: 5, at: 14, short: '프리마', name: '프리마 발레리나', tag: '왕립 발레단의 별', icon: '👑', crown: true, need: { stat: 65, shows: 3 },
      voice: '프리마 발레리나가 되었어요. 화려한 건 잠깐이고, 남는 건 끝까지 함께한 마음이에요.',
      tease: null
    }
  ];
  var LEVELS = RANKS;

  function statTotal(s) {
    s = s || get();
    return s.stats.flex + s.stats.stam + s.stats.axis + s.stats.turn;
  }
  // 한 단계의 승급 조건을 진행률까지 담아 돌려준다.
  function rankReq(s, rank, classes) {
    s = s || get();
    var c = typeof classes === 'number' ? classes : s.classes;
    var list = [{ key: 'classes', label: '수료 수업', have: c, need: rank.at, unit: '회' }];
    if (rank.need && rank.need.stat) list.push({ key: 'stat', label: '능력치 합계', have: statTotal(s), need: rank.need.stat, unit: '' });
    if (rank.need && rank.need.shows) list.push({ key: 'shows', label: '극장 공연 완주', have: s.shows || 0, need: rank.need.shows, unit: '회' });
    list.forEach(function (row) {
      row.done = row.have >= row.need;
      row.left = Math.max(0, row.need - row.have);
      row.pct = row.need ? Math.min(100, Math.round(row.have / row.need * 100)) : 100;
    });
    return list;
  }
  function rankOf(s, classes) {
    s = s || get();
    var c = typeof classes === 'number' ? classes : s.classes;
    var cur = RANKS[0];
    for (var i = 1; i < RANKS.length; i++) {
      if (c < RANKS[i].at) break;
      if (rankReq(s, RANKS[i], c).every(function (row) { return row.done; })) cur = RANKS[i];
      else break;
    }
    return cur;
  }
  function levelOf(classes) {
    var c = typeof classes === 'number' ? classes : get().classes;
    var cur = RANKS[0];
    for (var i = 0; i < RANKS.length; i++) if (c >= RANKS[i].at) cur = RANKS[i];
    return cur;
  }
  // 새로 오른 승급의 보상을 한 번만 지급한다. 이미 가진 의상은 코인으로 바꿔 준다.
  function grantGifts(s, beforeClasses) {
    var from = typeof beforeClasses === 'number' ? rankOf(s, beforeClasses).n : 0;
    var to = rankOf(s).n, got = [], total = 0;
    for (var n = from + 1; n <= to; n++) {
      var g = LEVEL_GIFTS[n];
      if (!g || s.gifts.indexOf(n) >= 0) continue;
      s.gifts.push(n);
      var coins = g.coins, dress = null, swapped = false;
      if (g.dress) {
        if (s.owned.indexOf(g.dress) < 0) { s.owned.push(g.dress); dress = g.dress; }
        else { coins += dressOf(g.dress).price; swapped = true; }
      }
      s.coins += coins;
      total += coins;
      got.push({ level: n, coins: coins, dress: dress, swapped: swapped });
      addJournal(s, 'rank-' + n, '🌟', 'Lv.' + n + ' ' + josa(RANKS[n - 1].name, '으로', '로') + ' 승급했어요. ' + RANKS[n - 1].tag + '이 열렸어요.');
    }
    if (got.length) {
      var last = got[got.length - 1];
      s.levelUp = {
        level: last.level, name: RANKS[last.level - 1].name, coins: total,
        dress: last.dress, gift: last.swapped ? 'coins' : null,
        levels: got.map(function (g) { return g.level; })
      };
    }
    return got;
  }
  function ackLevelUp() {
    return updateWallet(function (s) { s.levelUp = null; });
  }
  function level() {
    var s = get(), cur = rankOf(s), idx = RANKS.indexOf(cur), next = RANKS[idx + 1] || null;
    var steps = next ? rankReq(s, next) : [];
    var pct = next ? Math.round(steps.reduce(function (sum, row) {
      return sum + Math.min(1, row.have / Math.max(1, row.need));
    }, 0) / steps.length * 100) : 100;
    return {
      n: cur.n, name: cur.name, short: cur.short, icon: cur.icon, crown: !!cur.crown, tag: cur.tag,
      classes: s.classes, have: Math.max(0, s.classes - cur.at), need: next ? next.at - cur.at : 0,
      next: next, steps: steps, pct: Math.min(100, pct), stat: statTotal(s), shows: s.shows || 0
    };
  }
  function prima() { return !!rankOf(get()).crown; }
  function stampsTotal() {
    var s = get().stamps;
    return s.bar + s.center + s.piece;
  }
  function stageReady() { return get().classes >= STAGE_CLASSES; }
  function stageLeft() { return Math.max(0, STAGE_CLASSES - get().classes); }

  // Training changes the actual timing and companion abilities, not just numbers.
  function practicePower(kind, state) {
    var s = state || get(), st = s.stats;
    var skill = kind === 'bar' ? st.axis + st.flex : kind === 'center' ? st.axis + st.turn : st.stam + st.flex;
    var out = { timing: Math.min(90, Math.floor(skill * 2)), perfect: 0, combo: 1, notes: 0, shields: 0, label: '' };
    var id = s.practiceWith, b = id && s.spirits[id];
    if (!b) return out;
    var lv = bondLevel(b.bond), amount = 1 + Math.floor((lv - 1) / 2);
    if (id === 'etu') { out.timing += 12 * amount; out.label = '균형 · 판정 +' + 12 * amount + 'ms'; }
    if (id === 'alle') { out.perfect += 10 * amount; out.label = '리듬 · Perfect +' + 10 * amount + 'ms'; }
    if (id === 'ara') { out.combo = 1 + amount * 0.25; out.label = '표현력 · 콤보 코인 +' + 25 * amount + '%'; }
    if (id === 'piru') { out.shields = amount; out.label = '회전 · 실수 ' + amount + '회 보조'; }
    if (id === 'shangz') { out.notes = amount; out.label = '도약 · 성공 노트당 +' + amount + '코인'; }
    return out;
  }
  function stagePower(state) {
    var s = state || get(), st = s.stats;
    return { perfect: Math.min(75, Math.floor((st.axis + st.turn) * 1.5)), good: Math.min(130, Math.floor((st.axis + st.turn + st.flex + st.stam) * 2)) };
  }

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
    var call = nick();
    Array.prototype.forEach.call(r.querySelectorAll('[data-nick]'), function (el) { el.textContent = call; });
    Array.prototype.forEach.call(r.querySelectorAll('[data-nick-nim]'), function (el) { el.textContent = call + '님'; });
    r.querySelectorAll('img[data-worn-pose]').forEach(function (img) { showDancer(img, s.worn, img.dataset.wornPose); });
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
    // 분식으로 능력치가 채워져 승급 조건을 넘기면 보상을 여기서 챙긴다.
    grantGifts(s);
    persist(); syncUI();
    return obj;
  }

  /* ---------- 옷 ---------- */
  function dressOf(id) {
    return DRESS.filter(function (d) { return d.id === id; })[0] || DRESS[0];
  }
  var POSES = { ready: '준비 자세', plie: '데미 플리에', tendu: '텐듀', releve: '를르베', arabesque: '아라베스크', curtsy: '무대 인사' };
  var ORIGINAL = { ready: 'front', releve: 'releve', arabesque: 'arabesque', curtsy: 'curtsy' };
  function dancerArt(id, pose) {
    id = dressOf(id).id;
    if (!Object.hasOwn(POSES, pose)) pose = 'ready';
    if (id === 'sugar' && Object.hasOwn(ORIGINAL, pose)) return A('../kingdom/assets/sugar_' + ORIGINAL[pose] + '@2x.webp');
    return A('assets/dancers/' + id + '-' + pose + '.webp');
  }
  function showDancer(img, id, pose) {
    var src = dancerArt(id, pose);
    if (img.getAttribute('src') !== src) img.src = src;
    img.dataset.outfit = id;
    img.dataset.pose = pose;
    img.alt = dressOf(id).name + ' 차림의 ' + nick() + ' 발레리나 · ' + POSES[pose];
  }
  function nextDress() {
    return DRESS.find(function (dress) { return !get().owned.includes(dress.id); });
  }
  function isOwned(id) { return get().owned.indexOf(id) >= 0; }
  function buy(id) {
    var s = get(), d = dressOf(id);
    if (d.id !== id) return { ok: false, reason: 'locked' };
    if (isOwned(id)) return { ok: false, reason: 'owned' };
    if (d.giftAt && s.classes < d.giftAt) return { ok: false, reason: 'lesson' };
    // 레벨을 올렸으면 옷은 코인 없이 받는다.
    if (d.levelAt && level().n >= d.levelAt) {
      s.owned.push(id);
      s.worn = id;
      persist(); syncUI();
      return { ok: true, item: d, free: true, level: d.levelAt };
    }
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

  /* ---------- 왕립 극장 공연 기록 ---------- */
  function finishShow(score) {
    return updateWallet(function (s) {
      var grade = String(score.grade || 'B').slice(0, 1);
      var base = 60, bonus = { S: 140, A: 100, B: 60, C: 30 }[grade] || 40;
      var coins = base + bonus + Math.max(0, Math.round(score.perfect || 0)) * 2;
      var fame = { S: 3, A: 2, B: 1, C: 1 }[grade] || 1;
      var record = {
        grade: grade, score: Math.max(0, Math.round(score.score || 0)), coins: coins, fame: fame,
        notes: Math.max(0, Math.round(score.notes || 0)), perfect: Math.max(0, Math.round(score.perfect || 0)),
        at: Date.now(), outfit: s.worn
      };
      s.coins += coins;
      s.fame += fame;
      s.shows = (s.shows || 0) + 1;
      if (s.shows === 1) addJournal(s, 'first-show', '🎭', nick() + '님이 왕립 극장 첫 무대에 올랐어요. 마지막 인사까지 박수가 이어졌어요.');
      if (!s.bestGrade || 'SABC'.indexOf(grade) < 'SABC'.indexOf(s.bestGrade)) s.bestGrade = grade;
      s.show = record;
      if (s.kingdom.debutOutfit) { /* 이미 데뷔 의상이 있으면 유지한다 */ }
      else s.kingdom.debutOutfit = s.worn;
      if (s.kingdom.meal) record.meal = { name: s.kingdom.meal.name, kind: s.kingdom.meal.kind };
      s.kingdom.meal = null;
      grantGifts(s);
      return record;
    });
  }

  var API = {
    KEY: KEY, V: V, ROOT: ROOT, asset: A, STATS: STATS, SPIRITS: SPIRITS, MENU: MENU, DRESS: DRESS,
    load: load, get: get, save: persist, reset: function () { S = clone(DEFAULT); S.createdAt = Date.now(); persist(); syncUI(); },
    syncUI: syncUI, fmt: fmt, addCoins: addCoins, spend: spend, addStats: addStats,
    updateWallet: updateWallet, classFee: classFee, PRACTICE: PRACTICE, STAFF: STAFF, staffLine: staffLine,
    GRANT: GRANT, POTION_PRICE: POTION_PRICE, ORDERS_PER_LEVEL: ORDERS_PER_LEVEL,
    staffLevel: staffLevel, effectFor: effectFor, spiritArt: spiritArt, orderPotion: orderPotion, rewardFor: rewardFor, finishPractice: finishPractice, finishRhythm: finishRhythm,
    level: level, levelOf: levelOf, LEVELS: LEVELS, RANKS: RANKS, rankOf: rankOf, rankReq: rankReq, statTotal: statTotal, prima: prima,
    LEVEL_GIFTS: LEVEL_GIFTS, ackLevelUp: ackLevelUp, finishShow: finishShow, stampsTotal: stampsTotal, stageReady: stageReady, stageLeft: stageLeft, STAGE_CLASSES: STAGE_CLASSES, practicePower: practicePower, stagePower: stagePower, addClass: addClass,
    nick: nick, named: named, setNick: setNick, NICK_MAX: NICK_MAX, NICK_DEFAULT: NICK_DEFAULT, josa: josa, hasBatchim: hasBatchim,
    dressOf: dressOf, dressHTML: dressHTML, dancerArt: dancerArt, showDancer: showDancer, POSES: POSES, nextDress: nextDress, isOwned: isOwned, buy: buy, wear: wear,
    seeMenu: seeMenu, seenCount: seenCount, cafeBest: cafeBest, toast: toast,
    CAFE: CAFE, orderMeal: orderMeal, mealOf: mealOf, buffChips: buffChips, TURN_LABEL: TURN_LABEL,
    BOND_STEPS: BOND_STEPS, BOND_MAX: BOND_MAX, BOND_IDS: BOND_IDS, TEACHER: TEACHER, LETTERS: LETTERS,
    bondLevel: bondLevel, bondOf: bondOf, bonds: bonds, topBonds: topBonds, heartsHTML: heartsHTML,
    lettersFor: lettersFor, unreadLetters: unreadLetters, readLetter: readLetter, cheerOf: cheerOf,
    raiseBond: raiseBond, addBond: addBond, journal: addJournal, setPracticeWith: setPracticeWith
  };
  window.SugarTown = API;
  load();

  /* 여러 탭/뒤로가기에서 지갑 동기화 */
  function refreshFromStorage() {
    load(); syncUI();
    window.dispatchEvent(new Event('sugartown:refresh'));
  }
  if (needsCharter || needsGift || needsLevelGift) {
    updateWallet(function (s) { if (!needsCharter) grantGifts(s, 1); }).then(refreshFromStorage);
  }
  window.addEventListener('pageshow', refreshFromStorage);
  window.addEventListener('storage', function (e) { if (e.key === KEY || e.key === null || e.key === 'sugarcafe.best') refreshFromStorage(); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') refreshFromStorage();
  });
})();
