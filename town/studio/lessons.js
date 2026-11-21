/* 수업 노트. 세 수업의 리듬 악보와 판정 기준을 담는다.
   beat = 보통 박자 · cat = 길고양이 등장(파드샤) · jump = 연습실 장애물(그랑제떼)
   노트 시각은 assets/music.js 의 실제 왈츠 선율 박자에 맞춰 놓는다. */
(function () {
  'use strict';

  var classes = {
    bar: {
      name: '바 워크', kick: 'BARRE WORK', icon: '🩰', grad: 'linear-gradient(140deg,#f3e6ff,#fce9f4)',
      stats: { flex: 8, axis: 4 }, desc: '바를 잡고 3/4 왈츠에 맞춰 무릎과 발끝을 차례로 눌러요.',
      teacher: 'etu', bpm: 76, lead: 2500, window: { perfect: 140, good: 320 },
      poses: ['plie', 'tendu', 'releve', 'arabesque'],
      mood: '호른이 노래하는 느린 왈츠', energy: '느긋하게 한 박자씩',
      count: 12,
      pick: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13],
      moves: ['beat', 'beat', 'cat', 'beat', 'jump', 'beat', 'beat', 'cat', 'beat', 'beat', 'jump', 'beat']
    },
    center: {
      name: '센터 워크', kick: 'CENTER WORK', icon: '⚖️', grad: 'linear-gradient(140deg,#fdeaf3,#fff2e7)',
      stats: { axis: 8, turn: 4 }, desc: '바에서 손을 떼고 백조의 왈츠에 균형과 회전을 얹어요.',
      teacher: 'piru', bpm: 104, lead: 2300, window: { perfect: 120, good: 290 },
      poses: ['arabesque', 'releve', 'arabesque', 'curtsy'],
      mood: '백조의 호수 1막 왈츠', energy: '발끝으로 통통',
      count: 16,
      pick: [0, 2, 4, 8, 10, 12, 16, 18, 20, 24, 36, 38, 40, 42, 48, 50],
      moves: ['beat', 'cat', 'beat', 'jump', 'beat', 'beat', 'cat', 'beat', 'jump', 'beat', 'beat', 'cat', 'beat', 'jump', 'beat', 'beat']
    },
    piece: {
      name: '작품반', kick: 'REPERTOIRE', icon: '🎭', grad: 'linear-gradient(140deg,#efe7ff,#ffe7ee)',
      stats: { turn: 8, stam: 5, flex: 3 }, desc: '빠르고 화려한 무대. 점프와 고양이까지 한 번에 넘겨요.',
      teacher: 'ara', bpm: 132, lead: 2200, window: { perfect: 105, good: 260 },
      poses: ['arabesque', 'releve', 'curtsy', 'arabesque'],
      mood: '꽃의 왈츠 바이올린 선율', energy: '무대 위 한 장면처럼',
      count: 20,
      pick: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
      moves: ['beat', 'beat', 'cat', 'beat', 'jump', 'beat', 'cat', 'beat', 'beat', 'jump', 'cat', 'beat', 'jump', 'beat', 'cat', 'beat', 'beat', 'jump', 'cat', 'beat']
    }
  };

  var MOVES = {
    beat: { key: 'beat', label: '박자', icon: '🩰', note: '🎵', color: '#f7a8c8', kind: '음악이 흘러요' },
    cat: { key: 'cat', label: '파드샤', icon: '🐾', note: '🐱', color: '#f0bb72', kind: '길고양이 등장!' },
    jump: { key: 'jump', label: '그랑제떼', icon: '🦋', note: '🚧', color: '#b3a0ef', kind: '연습실 장애물!' }
  };

  var LINES = {
    perfect: {
      beat: ['딱 맞았어요! 발끝까지 반짝 ✨', '한 박자에 쏙! 음악이 웃었어요 🎵', '박자가 몸에 붙었어요!'],
      cat: ['고양이랑 파드샤 완벽 호흡! 🐱✨', '고양이가 같이 폴짝! 파드샤 성공 🐾', '살금살금, 고양이도 감탄했어요 🐱'],
      jump: ['장애물 쓱 넘은 그랑제떼! 🦋', '공중에서 다리가 예쁘게 펼쳐졌어요 🦋', '장애물은 발밑으로! 완벽한 도약 ✨']
    },
    good: {
      beat: ['좋아요! 살짝만 더 박자에 붙여 봐요.', '발은 맞았어요. 한 톨만 여유를!', '거의 다 왔어요, 호흡을 이어 봐요.'],
      cat: ['고양이가 살짝 비켜줬어요 🐱', '파드샤! 조금만 더 가볍게 🐾', '고양이랑 눈은 맞았어요 🐱'],
      jump: ['장애물을 넘긴 했어요! 조금 더 높이 🦋', '그랑제떼, 착지는 가볍게!', '도약 성공, 박자는 반 발짝!']
    },
    wrong: {
      cat: ['고양이한테 발이 엉켰어요! 🐱', '고양이가 파드샤를 기다렸는데 박자를 눌렀어요 🐾'],
      jump: ['장애물에 튜튜 걸릴 뻔! 🚧', '여긴 점프 자리였어요! 그랑제떼 🦋'],
      beat: ['지금은 그냥 박자였어요 🎵', '리본이 살짝 엉켰어요 🎀']
    },
    late: ['어라, 중심축이 잠깐 외출했어요!', '턴아웃이 반 박자 늦었어요!', '리본이 엉킬 뻔!', '한 박자 놓쳤어요, 다시 이어져요!'],
    early: ['너무 빨랐어요! 음악이 아직 기다려요 🎵', '한 박자 앞서갔어요, 숨 고르고!'],
    shield: ['🛡️ 피루 포션이 살짝 잡아줘어요!', '🛡️ 샹즈 포션이 착지까지 받아줬어요!']
  };

  function songOf(kind) {
    var music = window.SugarMusic;
    return music && music.SONGS ? music.SONGS[kind] : null;
  }

  function buildChart(kind, variant) {
    var c = classes[kind];
    if (!c) return null;
    var song = songOf(kind);
    var bpm = song ? song.bpm : c.bpm;
    var beatMs = 60000 / bpm;
    var melody = song ? song.melody : null;
    var moveAt = Math.abs(variant || 0) % 2;   // 두 번째 판은 고양이와 장애물이 자리를 바꾼다.
    function typeFor(move) {
      if (!moveAt) return move;
      return move === 'cat' ? 'jump' : move === 'jump' ? 'cat' : move;
    }
    var notes = c.pick.map(function (idx, i) {
      var b = melody && melody[idx] ? melody[idx][0] : c.lead / beatMs + i * 1.5;
      return { t: Math.round(b * beatMs), type: typeFor(c.moves[i] || 'beat') };
    });
    var last = notes[notes.length - 1];
    var tail = song ? Math.round(song.length * beatMs) : last.t + 1900;
    return { song: kind, bpm: bpm, gap: Math.round(beatMs), notes: notes, total: Math.max(last.t + 1800, tail) };
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
    classes: classes, MOVES: MOVES, LINE_GROUPS: LINES,
    buildChart: buildChart, makeLesson: makeLesson, pickLine: pickLine
  };
})();
