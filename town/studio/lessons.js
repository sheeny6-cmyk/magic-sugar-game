/* 수업 노트. 세로줄 자리에 학생이 고른 용어가 들어간다. */
(function () {
  'use strict';

  var classes = {
    bar: {
      name: '바 워크', kick: 'BARRE WORK', icon: '🩰', grad: 'linear-gradient(140deg,#f3e6ff,#fce9f4)',
      stats: { flex: 8, axis: 4 }, desc: '바를 잡고 무릎과 발끝을 쓰는 기본 동작을 배워요.',
      terms: ['plie', 'tendu', 'releve', 'rond', 'fondu', 'grandBattement']
    },
    center: {
      name: '센터 워크', kick: 'CENTER WORK', icon: '⚖️', grad: 'linear-gradient(140deg,#fdeaf3,#fff2e7)',
      stats: { axis: 8, turn: 4 }, desc: '바에서 손을 떼고 균형, 회전, 팔의 움직임을 익혀요.',
      terms: ['arabesque', 'attitude', 'pirouette', 'adagio', 'portDeBras', 'balance']
    },
    piece: {
      name: '작품반', kick: 'REPERTOIRE', icon: '🎭', grad: 'linear-gradient(140deg,#efe7ff,#ffe7ee)',
      stats: { turn: 8, stam: 5, flex: 3 }, desc: '점프를 연결하고 마지막 인사까지 무대 위 한 장면을 완성해요.',
      terms: ['glissade', 'grandJete', 'assemble', 'changement', 'pasDeDeux', 'reverence']
    }
  };

  var terms = {
    plie: { ko: '플리에', fr: 'Plié', cue: '두 발은 1번. | 두 번, 무릎을 부드럽게 굽혔다 펴 볼까요?', note: '프랑스어로 ‘구부린’이라는 뜻이에요.' },
    tendu: { ko: '텐듀', fr: 'Battement tendu', cue: '이번엔 |. 발끝이 바닥을 스치며 길게 뻗었다가 제자리로 돌아와요.', note: '발끝까지 팽팽하게 뻗되 바닥에 닿아 있어요.' },
    releve: { ko: '를르베', fr: 'Relevé', cue: '두 발 그대로 |! 뒤꿈치를 들어 데미포인 위에서 잠깐 멈춰요.', note: '몸을 위로 끌어올려 발앞쪽이나 포인 위에 서는 동작이에요.' },
    rond: { ko: '롱 드 잠 아 테르', fr: 'Rond de jambe à terre', cue: '발끝으로 바닥에 반원을 그려요. 앞에서 옆을 지나 뒤까지 |.', note: '프랑스어로 rond는 ‘원’, à terre는 ‘바닥에서’라는 뜻이에요.' },
    fondu: { ko: '퐁뒤', fr: 'Battement fondu', cue: '한 발을 반대쪽 발목에 대고 지지하는 무릎을 굽혀요. 두 다리를 함께 펴며 |.', note: '치즈가 녹듯이 한 다리로 부드럽게 가라앉는 느낌이에요.' },
    grandBattement: { ko: '그랑 바뜨망', fr: 'Grand battement', cue: '다리는 곧게, 옆으로 힘차게 높이 차올려요. | 네 번 갈게요.', note: 'grand는 ‘큰’이라는 뜻이에요. 다리를 크게 차올렸다 내려요.' },
    arabesque: { ko: '아라베스크', fr: 'Arabesque', cue: '한 다리로 서서 다른 다리는 곧게 뒤로 뻗어요. 그 | 라인을 그대로 보여 주세요.', note: '뒤로 든 다리의 무릎을 펴서 길게 이어지는 선을 만들어요.' },
    attitude: { ko: '아티튜드', fr: 'Attitude', cue: '이번엔 뒤로 든 다리의 무릎을 굽혀서 |. 그 모양으로 한 박자 머물러요.', note: '들어 올린 다리의 무릎을 굽히는 포즈예요.' },
    pirouette: { ko: '피루엣', fr: 'Pirouette', cue: '한 발을 축으로 제자리에서 한 바퀴. | 끝에 선생님 얼굴이 다시 보이나요?', note: '제자리에서 한쪽 다리를 축으로 도는 회전이에요.' },
    adagio: { ko: '아다지오', fr: 'Adagio', cue: '느린 음악이 들리죠? | 조합이에요. 포즈 하나하나를 길게 이어 주세요.', note: '느린 템포에서 다리를 조절하며 균형과 선을 보여 주는 조합이에요.' },
    portDeBras: { ko: '포르 드 브라', fr: 'Port de bras', cue: '발은 제자리에 두고 팔만 연습해요. 아래에서 머리 위까지 |, 시선도 손끝을 따라가요.', note: 'bras는 ‘팔’이에요. 팔을 한 위치에서 다음 위치로 옮겨요.' },
    balance: { ko: '발랑세', fr: 'Balancé', cue: '왈츠에 맞춰 하나 둘 셋, 하나 둘 셋. 좌우로 체중을 옮기는 |로 이어 갈게요.', note: '세 박자에 맞춰 몸이 흔들리듯 체중을 옮기는 스텝이에요.' },
    glissade: { ko: '글리사드', fr: 'Glissade', cue: '큰 점프 직전, 옆으로 낮게 미끄러져 발을 모아요. 연결 스텝 |부터 맞춰 볼까요?', note: '바닥을 스치듯 이동해서 두 발을 닫는 연결 스텝이에요.' },
    grandJete: { ko: '그랑 제떼', fr: 'Grand jeté', cue: '대각선을 향해 |! 한 발에서 다른 발로 크게 도약하며 공중에서 다리를 앞뒤로 펼쳐요.', note: '한쪽 다리를 던지듯 뻗으며 크게 이동하는 점프예요.' },
    assemble: { ko: '앙상블레', fr: 'Assemblé', cue: '한 발을 쓸어 올려 뛰고 공중에서 두 다리를 모아 함께 착지해요. 이 점프가 |.', note: '프랑스어로 ‘모은’이라는 뜻이에요. 두 발이 공중에서 만나요.' },
    changement: { ko: '샹주망', fr: 'Changement de pieds', cue: '5번에서 두 발로 뛰고, 앞발과 뒷발의 자리를 바꿔 5번으로 내려와요. 작은 | 네 번!', note: 'changement은 ‘바꿈’이에요. 뛸 때마다 앞에 오는 발이 바뀌어요.' },
    pasDeDeux: { ko: '파 드 되', fr: 'Pas de deux', cue: '이번 장면은 두 무용수가 함께 추는 |. 파트너와 눈을 맞추고 첫 박을 기다려요.', note: 'deux는 ‘둘’이에요. 두 사람이 함께 추는 춤을 가리켜요.' },
    reverence: { ko: '르베랑스', fr: 'Révérence', cue: '음악이 끝났어요. 마지막 |로 관객에게 감사의 인사를 건네요.', note: '공연이나 수업 끝에 감사를 담아 하는 인사예요.' }
  };

  function shuffled(values) {
    var result = values.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = result[i]; result[i] = result[j]; result[j] = temp;
    }
    return result;
  }

  function makeLesson(kind, state) {
    var pool = classes[kind].terms;
    var last = state.lastLessons[kind] || [];
    var fresh = shuffled(pool.filter(function (id) { return !last.includes(id); }));
    var deck = fresh.concat(shuffled(pool.filter(function (id) { return last.includes(id); })));
    if (kind === 'bar' && state.stamps.bar === 0) deck = ['plie'].concat(deck.filter(function (id) { return id !== 'plie'; }));
    var rounds = deck.slice(0, 3).map(function (key) {
      var others = shuffled(pool.filter(function (id) { return id !== key; })).slice(0, 2);
      return { key: key, choices: shuffled([key].concat(others)), picks: [], hint: false };
    });
    return { id: Date.now().toString(36) + Math.random().toString(36).slice(2), kind: kind, index: 0, rounds: rounds };
  }

  window.SugarLessons = { classes: classes, terms: terms, makeLesson: makeLesson };
})();
