/* ===== 슈가의 발레왕국 · 무대 음악 =====
   발레 스튜디오와 왕립 극장이 함께 쓰는 3/4 왈츠 편곡과 피아노 연주기.
   선율은 차이콥스키의 공개 악곡(「호두까기인형」 꽃의 왈츠 · 「백조의 호수」 1막 왈츠)을
   게임에 맞게 짧게 편곡한 것이다. */
(function () {
  'use strict';

  // 왈츠 반주 voicing: 낮은 베이스 + 중간 음역의 세 성부 화음
  var CHORDS = {
    D:  { bass: 38, tones: [57, 62, 66] },
    D7: { bass: 38, tones: [57, 60, 66] },
    G:  { bass: 43, tones: [59, 62, 67] },
    A:  { bass: 45, tones: [57, 61, 64] },
    A7: { bass: 45, tones: [61, 64, 67] },
    E:  { bass: 40, tones: [59, 64, 68] },
    E7: { bass: 40, tones: [59, 62, 68] },
    B7: { bass: 47, tones: [59, 63, 66] },
    Cm: { bass: 37, tones: [56, 61, 64] },
    Fm: { bass: 42, tones: [57, 61, 64] },
    Bm: { bass: 47, tones: [59, 62, 66] }
  };

  /* melody: [beat, midi, durBeats] · chords: [beat, chordName] · length: 마지막 마디 끝(beat) */
  var SONGS = {
    bar: {
      bpm: 76, meter: 3, length: 21,
      name: '꽃의 왈츠 · 호른 선율', credit: '차이콥스키 「호두까기인형」',
      melody: [
        [0, 57, 1], [1, 62, 1], [2, 66, 1], [3, 67, 2], [5, 66, 1], [6, 66, 3], [9, 66, 3],
        [12, 57, 1], [13, 62, 1], [14, 66, 1], [15, 67, 1], [16, 66, 1.75], [17.75, 64, 0.25],
        [18, 67, 0.5], [18.5, 66, 0.5], [19, 64, 0.5], [19.5, 62, 1.5]
      ],
      chords: [[0, 'D'], [3, 'D7'], [6, 'D'], [9, 'D'], [12, 'D'], [15, 'D7'], [18, 'D']]
    },
    center: {
      bpm: 104, meter: 3, length: 24,
      name: '1막 왈츠', credit: '차이콥스키 「백조의 호수」',
      melody: [
        [0, 76, 0.75], [0.75, 76, 0.25], [1, 76, 0.5], [1.5, 75, 0.5], [2, 78, 0.25], [2.25, 76, 0.25], [2.5, 75, 0.25], [2.75, 76, 0.25],
        [3, 71, 0.75], [3.75, 71, 0.25], [4, 71, 0.5], [4.5, 70, 0.5], [5, 73, 0.25], [5.25, 71, 0.25], [5.5, 70, 0.25], [5.75, 71, 0.25],
        [6, 67, 0.5], [6.5, 68, 0.5], [7, 67, 0.5], [7.5, 68, 0.5],
        [8, 73, 0.25], [8.25, 71, 0.25], [8.5, 69, 0.25], [8.75, 68, 0.25], [9, 69, 0.25], [9.25, 61, 0.25], [9.5, 63, 0.25], [9.75, 65, 0.25], [10, 66, 0.25], [10.25, 68, 0.25], [10.5, 69, 0.25], [10.75, 71, 0.25], [11, 73, 0.25], [11.25, 75, 0.25], [11.5, 77, 0.25], [11.75, 78, 0.25],
        [12, 80, 0.75], [12.75, 80, 0.25], [13, 80, 0.5], [13.5, 78, 0.5], [14, 80, 0.5], [14.5, 78, 0.5], [15, 80, 0.5], [15.5, 75, 0.5],
        [16, 78, 0.25], [16.25, 76, 0.25], [16.5, 75, 0.25], [16.75, 73, 0.25], [17, 71, 0.5], [17.5, 73, 0.5],
        [18, 76, 0.5], [18.5, 75, 0.5], [19, 76, 0.5], [19.5, 73, 0.5],
        [20, 75, 0.25], [20.25, 73, 0.25], [20.5, 71, 0.25], [20.75, 73, 0.25], [21, 75, 0.75], [21.75, 73, 0.25], [22, 71, 0.5]
      ],
      chords: [[0, 'E'], [3, 'B7'], [6, 'E'], [9, 'A'], [12, 'E'], [15, 'E'], [18, 'B7'], [21, 'E']]
    },
    piece: {
      bpm: 132, meter: 3, length: 36,
      name: '꽃의 왈츠 · 바이올린 선율', credit: '차이콥스키 「호두까기인형」',
      melody: [
        [0, 79, 2], [2, 74, 1], [3, 78, 2], [5, 73, 1], [6, 76, 2], [8, 71, 1],
        [9, 74, 2], [11, 67, 1], [12, 78, 2], [14, 73, 1], [15, 76, 2], [17, 71, 1],
        [18, 74, 2], [20, 67, 1], [21, 79, 2], [23, 74, 1], [24, 79, 2], [26, 75, 1],
        [27, 79, 2], [29, 76, 1], [30, 81, 2], [32, 78, 1], [33, 79, 2], [35, 74, 1]
      ],
      chords: [[0, 'G'], [3, 'D'], [6, 'A'], [9, 'G'], [12, 'D'], [15, 'A'], [18, 'D'], [21, 'G'], [24, 'E7'], [27, 'A'], [30, 'D'], [33, 'G']]
    },
    stage: {
      bpm: 96, meter: 3, length: 42,
      name: '왕립 극장 그랜드 왈츠', credit: '차이콥스키 「호두까기인형」 꽃의 왈츠',
      melody: [
        [0, 57, 1], [1, 62, 1], [2, 66, 1], [3, 67, 2], [5, 66, 1], [6, 66, 3], [9, 66, 3],
        [12, 57, 1], [13, 62, 1], [14, 66, 1], [15, 67, 1], [16, 66, 1.75], [17.75, 64, 0.25],
        [18, 67, 0.5], [18.5, 66, 0.5], [19, 64, 0.5], [19.5, 62, 1.5],
        [21, 79, 2], [23, 74, 1], [24, 78, 2], [26, 73, 1], [27, 76, 2], [29, 71, 1],
        [30, 74, 2], [32, 67, 1], [33, 78, 2], [35, 73, 1], [36, 76, 2], [38, 71, 1],
        [39, 74, 2], [41, 67, 1], [42, 79, 3]
      ],
      chords: [
        [0, 'D'], [3, 'D7'], [6, 'D'], [9, 'D'], [12, 'D'], [15, 'D7'], [18, 'D'],
        [21, 'G'], [24, 'D'], [27, 'A'], [30, 'G'], [33, 'D'], [36, 'A'], [39, 'D'], [42, 'D']
      ]
    }
  };

  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // 곡이 시작되기 전에 왈츠 반주 세 박자를 먼저 들려준다 (첫 노트 전 준비 시간).
  function withIntro(song, beats) {
    song.melody = song.melody.map(function (n) { return [n[0] + beats, n[1], n[2]]; });
    var first = song.chords[0][1];
    song.chords = [[0, first]].concat(song.chords.map(function (c) { return [c[0] + beats, c[1]]; }));
    song.length += beats;
    song.intro = beats;
    return song;
  }
  ['bar', 'center', 'piece', 'stage'].forEach(function (id) { withIntro(SONGS[id], 3); });

  function events(song) {
    var beat = 60000 / song.bpm, ev = [];
    song.melody.forEach(function (n) {
      var d = Math.max(0.26, n[2] * beat / 1000 * 0.92);
      ev.push({ t: n[0] * beat, f: [hz(n[1])], d: d, v: 0.17, voice: 'lead' });
    });
    song.chords.forEach(function (c, i) {
      var ch = CHORDS[c[1]] || CHORDS.D;
      var next = i + 1 < song.chords.length ? song.chords[i + 1][0] : song.length;
      var span = Math.max(1, next - c[0]);
      ev.push({ t: c[0] * beat, f: [hz(ch.bass)], d: Math.min(1.5, beat / 1000 * Math.min(3, span) * 0.8), v: 0.125, voice: 'bass' });
      for (var k = 1; k <= 2 && k < span; k++) {
        ev.push({ t: (c[0] + k) * beat, f: ch.tones.map(hz), d: beat / 1000 * 0.5, v: k === 1 ? 0.072 : 0.056, voice: 'chord' });
      }
    });
    ev.sort(function (a, b) { return a.t - b.t; });
    return ev;
  }

  function total(song) { return song.length * 60000 / song.bpm; }

  /* ---------- 연주 ---------- */
  function piano(ctx, dest, freq, at, dur, vol, voice) {
    if (!ctx || !(freq > 0)) return;
    var lead = ctx.createOscillator(), top = ctx.createOscillator();
    var g = ctx.createGain(), topGain = ctx.createGain(), filter = ctx.createBiquadFilter();
    lead.type = 'triangle'; lead.frequency.value = freq;
    top.type = 'sine'; top.frequency.value = freq * 2.004;
    topGain.gain.value = voice === 'lead' ? 0.2 : 0.12;
    filter.type = 'lowpass';
    filter.frequency.value = voice === 'bass' ? 1200 : voice === 'chord' ? 1900 : 3000;
    filter.Q.value = 0.55;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0006, vol), at + (voice === 'lead' ? 0.012 : 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    lead.connect(filter); top.connect(topGain); topGain.connect(filter); filter.connect(g); g.connect(dest);
    lead.start(at); top.start(at);
    lead.stop(at + dur + 0.05); top.stop(at + dur + 0.05);
  }

  function create(ctx, dest) {
    if (!ctx) return null;
    var cache = {}, timer = null, base = 0, cur = null, at = 0, playing = false, id = null;

    function pump() {
      if (!playing || !cur) return;
      var until = (ctx.currentTime - base) * 1000 + 320;
      while (at < cur.ev.length && cur.ev[at].t <= until) {
        var e = cur.ev[at++], t0 = base + e.t / 1000;
        for (var i = 0; i < e.f.length; i++) piano(ctx, dest, e.f[i], t0 + i * 0.008, e.d, e.v, e.voice);
      }
      if (at >= cur.ev.length && (ctx.currentTime - base) * 1000 > cur.len + 1400) stop();
    }
    function start(songId, offsetMs) {
      var song = SONGS[songId];
      if (!song || !ctx) return false;
      stop();
      if (!cache[songId]) cache[songId] = { ev: events(song), len: total(song) };
      cur = cache[songId]; id = songId;
      base = ctx.currentTime - Math.max(0, offsetMs || 0) / 1000;
      at = 0;
      var from = Math.max(0, offsetMs || 0) - 40;
      while (at < cur.ev.length && cur.ev[at].t < from) at++;
      playing = true;
      if (timer) clearInterval(timer);
      timer = setInterval(pump, 50);
      pump();
      return true;
    }
    function stop() {
      playing = false;
      if (timer) { clearInterval(timer); timer = null; }
      cur = null; at = 0; id = null;
    }
    function info() {
      return cur ? { started: playing, song: id, scheduled: at, total: cur.ev.length, length: cur.len } : null;
    }
    function elapsed() { return playing ? (ctx.currentTime - base) * 1000 : 0; }
    /* 실제로 곡 0ms가 스케줄된 오디오 시각. 게임 판정 시계를 이 값에 맞춘다. */
    function startedAt() { return playing ? base : null; }
    return { start: start, stop: stop, info: info, elapsed: elapsed, startedAt: startedAt };
  }

  /* 박수: 짧은 노이즈 버스트를 여러 번 겹쳐 만든다. */
  function applause(ctx, dest, seconds) {
    if (!ctx) return;
    var dur = Math.min(2.6, Math.max(0.8, seconds || 1.6));
    var rate = ctx.sampleRate, len = Math.floor(rate * dur);
    var buf = ctx.createBuffer(1, len, rate), data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      var t = i / rate;
      var env = Math.min(1, t / 0.05) * Math.pow(1 - t / dur, 1.6);
      var clap = (Math.random() * 2 - 1) * 0.5;
      data[i] = clap * env * (0.25 + 0.75 * Math.abs(Math.sin(t * 26 + Math.random() * 0.3)));
    }
    var src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf;
    bp.type = 'bandpass'; bp.frequency.value = 2100; bp.Q.value = 0.6;
    g.gain.value = 0.5;
    src.connect(bp); bp.connect(g); g.connect(dest || ctx.destination);
    src.start();
  }

  window.SugarMusic = { SONGS: SONGS, hz: hz, create: create, events: events, applause: applause };
})();
