/* 수업 노트. 세 수업의 리듬 악보와 판정 기준을 담는다.
   beat = 보통 박자 · cat = 길고양이 등장(파드샤) · jump = 연습실 장애물(그랑제떼) */
(function () {
  'use strict';

  var classes = {
    bar: {
      name: '바 워크', kick: 'BARRE WORK', icon: '🩰', grad: 'linear-gradient(140deg,#f3e6ff,#fce9f4)',
      stats: { flex: 8, axis: 4 }, desc: '바를 잡고 3/4 왈츠에 맞춰 무릎과 발끝을 차례로 눌러요.',
      teacher: 'etu', bpm: 84, lead: 2500, gap: 1.5, window: { perfect: 130, good: 300 },
      poses: ['plie', 'tendu', 'releve', 'arabesque'],
      mood: '여유로운 3/4 왈츠', energy: '느긋하게 한 박자씩',
      patterns: [
        ['beat', 'beat', 'beat', 'cat', 'beat', 'beat', 'jump', 'beat'],
        ['beat', 'beat', 'cat', 'beat', 'beat', 'jump', 'beat', 'beat']
      ]
    },
    center: {
      name: '센터 워크', kick: 'CENTER WORK', icon: '⚖️', grad: 'linear-gradient(140deg,#fdeaf3,#fff2e7)',
      stats: { axis: 8, turn: 4 }, desc: '바에서 손을 떼고 경쾌한 박자에 균형과 회전을 얹어요.',
      teacher: 'piru', bpm: 108, lead: 2300, gap: 1.25, window: { perfect: 110, good: 270 },
      poses: ['arabesque', 'releve', 'arabesque', 'curtsy'],
      mood: '경쾌한 왈츠', energy: '발끝으로 통통',
      patterns: [
        ['beat', 'beat', 'cat', 'beat', 'jump', 'beat', 'beat', 'cat', 'beat', 'jump', 'cat', 'beat'],
        ['beat', 'cat', 'beat', 'jump', 'beat', 'beat', 'cat', 'beat', 'jump', 'beat', 'cat', 'beat']
      ]
    },
    piece: {
      name: '작품반', kick: 'REPERTOIRE', icon: '🎭', grad: 'linear-gradient(140deg,#efe7ff,#ffe7ee)',
      stats: { turn: 8, stam: 5, flex: 3 }, desc: '빠르고 화려한 무대. 점프와 고양이까지 한 번에 넘겨요.',
      teacher: 'ara', bpm: 132, lead: 2200, gap: 1.25, window: { perfect: 95, good: 235 },
      poses: ['arabesque', 'releve', 'curtsy', 'arabesque'],
      mood: '빠르고 화려한 무대', energy: '무대 위 한 장면처럼',
      patterns: [
        ['beat', 'cat', 'beat', 'jump', 'beat', 'beat', 'cat', 'jump', 'beat', 'cat', 'beat', 'jump', 'beat', 'cat', 'jump', 'beat'],
        ['cat', 'beat', 'jump', 'beat', 'beat', 'cat', 'jump', 'beat', 'beat', 'cat', 'beat', 'jump', 'cat', 'beat', 'jump', 'beat']
      ]
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
    shield: ['🛡️ 피루 포션이 살짝 잡아줬어요!', '🛡️ 샹즈 포션이 착지까지 받아줬어요!']
  };

  function buildChart(kind, variant) {
    var c = classes[kind];
    if (!c) return null;
    var patterns = c.patterns, pick = patterns[Math.abs(variant || 0) % patterns.length];
    var gapMs = Math.round(60000 / c.bpm * c.gap);
    var notes = pick.map(function (type, i) { return { t: Math.round(c.lead + i * gapMs), type: type }; });
    return { bpm: c.bpm, gap: gapMs, total: notes[notes.length - 1].t + 1900, notes: notes };
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
