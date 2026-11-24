/* 수업 노트. 세 수업의 리듬 악보와 판정 기준을 담는다.
   beat = 보통 박자 · cat = 길고양이(파드샤) · jump = 연습실 장애물(그랑제떼)
   beam = 균형대(아라베스크) · turn = 회전 구간(피루엣)
   노트는 왈츠의 '쿵-짝-짝' 마디 첫 박에만 놓아, 간격이 일정하고 다음 동작을 미리 볼 수 있다. */
(function () {
  'use strict';

  var MIN_NOTE_GAP = 1500;   // 노트 사이는 최소 이만큼. 마디가 짧으면 두 마디 간격으로 둔다.
  var START_MIN = 2300;      // 첫 노트는 최소 이만큼 뒤의 마디 첫 박에서 시작한다.

  var classes = {
    bar: {
      name: '바 워크', kick: 'BARRE WORK', icon: '🩰', grad: 'linear-gradient(140deg,#f3e6ff,#fce9f4)',
      stats: { flex: 8, axis: 4 }, desc: '한 마디에 한 번, 고양이·장애물·균형대·회전 동작을 구분해 눌러요.',
      teacher: 'etu', bpm: 76, lead: 2500, window: { perfect: 190, good: 460 },
      moves: ['cat', 'jump', 'beam', 'turn', 'cat', 'jump', 'beam', 'turn'],
      mood: '호른이 노래하는 느린 왈츠', energy: '느긋하게 한 박자씩'
    },
    center: {
      name: '센터 워크', kick: 'CENTER WORK', icon: '⚖️', grad: 'linear-gradient(140deg,#fdeaf3,#f2e7fd)',
      stats: { axis: 8, turn: 4 }, desc: '파드샤·그랑제떼·아라베스크·피루엣, 네 동작을 마디 첫 박에 맞춰요.',
      teacher: 'piru', bpm: 104, lead: 2300, window: { perfect: 190, good: 460 },
      moves: ['cat', 'jump', 'beam', 'turn', 'jump', 'beam', 'cat', 'turn'],
      mood: '백조의 호수 1막 왈츠', energy: '발끝으로 통통'
    },
    piece: {
      name: '작품반', kick: 'REPERTOIRE', icon: '🎭', grad: 'linear-gradient(140deg,#efe7ff,#ffe7ee)',
      stats: { turn: 8, stam: 5, flex: 3 }, desc: '네 동작을 음악에 맞춰 끊김 없이 이어 가는 심화 연습이에요.',
      teacher: 'ara', bpm: 132, lead: 2200, window: { perfect: 190, good: 460 },
      moves: ['cat', 'jump', 'beam', 'turn', 'cat', 'turn', 'jump', 'beam'],
      mood: '꽃의 왈츠 바이올린 선율', energy: '무대 위 한 장면처럼'
    }
  };

  var MOVES = {
    beat: { key: 'beat', label: '박자', icon: '🩰', note: '♪', pose: 'plie', anim: '', kind: '음악이 흘러요' },
    cat: { key: 'cat', label: '파드샤', icon: '🐾', note: '🐈', pose: 'pasdechat', anim: 'pas-de-chat', kind: '길고양이 등장!' },
    jump: { key: 'jump', label: '그랑제떼', icon: '🦋', note: '', pose: 'grandjete', anim: 'grand-jete', kind: '연습실 장애물!' },
    beam: { key: 'beam', label: '아라베스크', icon: '═', note: '', pose: 'arabesque', anim: 'balance-arabesque', kind: '균형대가 놓였어요!' },
    turn: { key: 'turn', label: '피루엣', icon: '↻', note: '↻', pose: 'pirouette', anim: 'pirouette', kind: '회전 구간!' }
  };

  /* 정령마다 무대에서 실제로 도와주는 능력. 함께 연습하면 이 힘이 발동한다. */
  var ABILITY = {
    etu: '모든 판정 여유가 넓어져요',
    alle: 'Perfect 판정과 박자를 세어 줘요',
    ara: '성공할 때마다 콤보 코인이 더 쌓여요',
    piru: '삐끗한 한 번을 회전으로 넘겨 줘요',
    shangz: '성공한 박자마다 코인을 더 줘요'
  };

  var LINES = {
    perfect: {
      beat: ['딱 맞았어요! 발끝까지 반짝 ✨', '한 박자에 쏙! 음악이 웃었어요 🎵', '박자가 몸에 붙었어요!'],
      cat: ['고양이랑 파드샤 완벽 호흡! 🐱✨', '고양이가 같이 폴짝! 파드샤 성공 🐾', '살금살금, 고양이도 감탄했어요 🐱'],
      jump: ['장애물 쓱 넘은 그랑제떼! 🦋', '공중에서 다리가 예쁘게 펼쳐졌어요 🦋', '장애물은 발밑으로! 완벽한 도약 ✨'],
      beam: ['균형대 위에서도 중심이 딱! ═', '아라베스크 선이 무대 끝까지 이어져요 ✨', '흔들림 없이, 아름답게! ═'],
      turn: ['피루엣이 바람처럼! ↻', '두 바퀴 반짝, 중심은 제자리! ↻', '돌아도 예쁜 그 자세! 💫']
    },
    good: {
      beat: ['좋아요! 살짝만 더 박자에 붙여 봐요.', '발은 맞았어요. 한 톨만 여유를!', '거의 다 왔어요, 호흡을 이어 봐요.'],
      cat: ['고양이가 살짝 비켜줬어요 🐱', '파드샤! 조금만 더 가볍게 🐾', '고양이랑 눈은 맞았어요 🐱'],
      jump: ['장애물을 넘긴 했어요! 조금 더 높이 🦋', '그랑제떼, 착지는 가볍게!', '도약 성공, 박자는 반 발짝!'],
      beam: ['균형을 잡았어요. 조금만 더 길게!', '아라베스크, 선이 살아 있어요.', '균형대를 지나갔어요 ═'],
      turn: ['한 바퀴 돌았어요. 중심은 그대로!', '피루엣, 조금만 더 가볍게!', '회전 성공, 착지는 살짝!']
    },
    wrong: {
      cat: ['고양이한테 발이 엉켰어요! 🐱', '고양이가 파드샤를 기다렸는데 박자를 눌렀어요 🐾'],
      jump: ['장애물에 튜튀 걸릴 뻔! 🚧', '여긴 점프 자리였어요! 그랑제떼 🦋'],
      beam: ['균형대가 앞에 있어요! 아라베스크 ═', '여긴 균형대 자리였어요 ═'],
      turn: ['회전 구간이에요! 피루엣 ↻', '빙글 도는 자리였어요 ↻'],
      beat: ['지금은 그냥 박자였어요 🎵', '리본이 살짝 엉켰어요 🎀']
    },
    late: ['어라, 중심축이 잠깐 외출했어요!', '턴아웃이 반 박자 늦었어요!', '리본이 엉킬 뻔!', '한 박자 놓쳤어요, 다시 이어져요!'],
    early: ['너무 빨랐어요! 음악이 아직 기다려요 🎵', '한 박자 앞서갔어요, 숨 고르고!'],
    shield: ['🛡️ 피루가 회전으로 살짝 잡아줬어요!', '🛡️ 샹즈가 착지까지 받아줬어요!']
  };

  function songOf(kind) {
    var music = window.SugarMusic;
    return music && music.SONGS ? music.SONGS[kind] : null;
  }

  /* 왈츠의 마디 첫 박(베이스 '쿵')만 노트로 삼는다. 선율의 잇단음표·꾸밈음은 무시해
     박자 간격이 일정하고, 다음 동작이 충분히 미리 보이게 한다. */
  function buildChart(kind, variant) {
    var c = classes[kind];
    if (!c) return null;
    var song = songOf(kind);
    var bpm = song ? song.bpm : c.bpm;
    var meter = (song && song.meter) || 3;
    var beat = 60000 / bpm, bar = beat * meter;
    var totalBeats = song ? song.length : 24;
    var stepBars = Math.max(1, Math.ceil(MIN_NOTE_GAP / bar));
    var lastBar = Math.floor((totalBeats * beat - 1) / bar);
    var picks = [];
    for (var b = 0; b <= lastBar; b++) {
      if (b % stepBars) continue;
      var t = Math.round(b * bar);
      if (t < START_MIN) continue;
      picks.push(t);
    }
    if (!picks.length) picks = [Math.round(bar), Math.round(bar * 2)];
    var shift = Math.abs(variant || 0) % c.moves.length;
    var notes = picks.map(function (t, i) {
      return { t: t, type: c.moves[(i + shift) % c.moves.length] };
    });
    var last = notes[notes.length - 1];
    var tail = song ? Math.round(song.length * beat) : last.t + 1900;
    return { song: kind, bpm: bpm, gap: Math.round(bar), notes: notes, total: Math.max(last.t + 1800, tail) };
  }

  function makeLesson(kind, state) {
    var c = classes[kind];
    if (!c) return null;
    var variant = state && state.stamps ? state.stamps[kind] || 0 : 0;
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      kind: kind, mode: 'rhythm', index: 0, paidFee: 0, chart: buildChart(kind, variant)
    };
  }

  function pickLine(group, type) {
    var byType = LINES[group];
    if (!byType) return '';
    var list = Array.isArray(byType) ? byType : (byType[type] || byType.beat);
    if (!list || !list.length) return '';
    return list[Math.floor(Math.random() * list.length)];
  }

  window.SugarLessons = {
    classes: classes, MOVES: MOVES, LINE_GROUPS: LINES, ABILITY: ABILITY,
    buildChart: buildChart, makeLesson: makeLesson, pickLine: pickLine
  };
})();
