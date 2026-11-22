/* ===== 왈츠 무대 · 3/4 왈츠 편곡과 연주기 (town/waltz-stage 전용) =====
   · 96 BPM · 3/4박 · 28마디(약 54초) 단일 코스
   · 박자표: 모든 사건은 '박(beat)' 단위로 적고, 재생 시각 = 곡 시작 시각(t0) + 박 × 0.625초
   · 게임은 이 연주기가 돌려주는 t0 하나만 시계로 쓴다(단일 마스터 클록).
   구조: 0~4마디 도입(단선율) · 5~15마디 전개(왈츠 반주+선율) · 16~27마디 절정(피루엣·화음 확장)

   선율은 차이콥스키의 공개 악곡(「호두까기인형」 꽃의 왈츠 / 「백조의 호수」)의 리듬 결을 참고해
   이 게임 길이에 맞게 새로 쓴 32마디 상당의 짧은 왈츠다. */
(function () {
  'use strict';

  var BPM = 96;
  var BEAT = 60 / BPM;          // 0.625초
  var LEAD = 3;                 // 곡 시작 전 카운트인 3박
  var BARS = 28;
  var END_BEAT = BARS * 3;      // 84박

  var CHORDS = {
    D:   { bass: 38, tones: [57, 62, 66] },
    D7:  { bass: 38, tones: [57, 60, 66] },
    G:   { bass: 43, tones: [55, 59, 62] },
    A:   { bass: 45, tones: [57, 61, 64] },
    A7:  { bass: 45, tones: [57, 61, 67] },
    Bm:  { bass: 47, tones: [54, 59, 62] },
    Fsm: { bass: 42, tones: [57, 61, 66] }
  };

  /* 마디별 선율: [마디 안 박, MIDI, 길이(박)] — 게임 노트가 떨어지는 박에 반드시 선율 음이 있다. */
  var MEL = {
    0:  [[0, 66, 2], [2, 69, 1]],
    1:  [[0, 74, 3]],
    2:  [[0, 71, 1], [1, 69, 1], [2, 66, 1]],
    3:  [[0, 64, 2], [2, 66, 1]],
    4:  [[0, 69, 1], [1, 71, 1], [2, 73, 1]],
    5:  [[0, 74, 1], [1, 76, 1], [2, 78, 1]],
    6:  [[0, 74, 2], [2, 73, 1]],
    7:  [[0, 71, 1], [1, 73, 1], [2, 74, 1]],
    8:  [[0, 78, 1.5], [1.5, 76, 0.5], [2, 74, 1]],
    9:  [[0, 73, 1], [1, 71, 1], [2, 69, 1]],
    10: [[0, 74, 2], [2, 71, 1]],
    11: [[0, 73, 1], [1, 74, 1], [2, 76, 1]],
    12: [[0, 78, 1], [1, 76, 1], [2, 74, 1]],
    13: [[0, 73, 1.5], [1.5, 71, 0.5], [2, 69, 1]],
    14: [[0, 71, 1], [1, 73, 1], [2, 74, 1]],
    15: [[0, 76, 2], [2, 78, 1]],
    16: [[0, 81, 1], [1, 79, 1], [2, 78, 1]],
    17: [[0, 79, 1], [1, 78, 1], [2, 76, 1]],
    18: [[0, 74, 1], [1, 76, 1], [2, 78, 1]],
    19: [[0, 81, 1.5], [1.5, 79, 0.5], [2, 78, 1]],
    20: [[0, 74, 1], [1, 76, 1], [2, 78, 1]],
    21: [[0, 81, 2], [2, 79, 1]],
    22: [[0, 78, 1], [1, 76, 1], [2, 74, 1]],
    23: [[0, 73, 1], [1, 74, 1], [2, 76, 1]],
    24: [[0, 78, 1], [1, 79, 1], [2, 81, 1]],
    25: [[0, 83, 1], [1, 81, 1], [2, 78, 1]],
    26: [[0, 81, 2], [2, 78, 1]],
    27: [[0, 74, 3]]
  };

  /* 마디별 화음 */
  var HARM = [
    'D', 'D', 'D', 'A', 'G',
    'D', 'D7', 'Bm', 'G', 'A', 'D', 'Bm', 'G', 'A', 'D', 'A7',
    'D', 'A', 'Bm', 'G', 'D', 'A7', 'D', 'Bm', 'G', 'A', 'A7', 'D'
  ];

  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function tOf(beat) { return (LEAD + beat) * BEAT; }  // 곡 시작(t0) 기준 초

  /* 마디 → 구간 */
  function sectionOfBar(bar) { return bar < 5 ? 'intro' : bar < 16 ? 'build' : 'peak'; }

  function buildEvents() {
    var ev = [];
    var bar;
    for (bar = 0; bar < BARS; bar++) {
      var sec = sectionOfBar(bar);
      var secGain = sec === 'intro' ? 0.9 : sec === 'build' ? 1.0 : 1.12;
      var swell = sec === 'peak' ? 1 + (bar - 16) * 0.012 : 1;
      var g = secGain * swell;
      var base = bar * 3;

      /* 선율 */
      (MEL[bar] || []).forEach(function (n) {
        var dur = Math.max(0.22, n[2] * BEAT * 0.94);
        var vol = (sec === 'intro' ? 0.12 : sec === 'build' ? 0.155 : 0.175) * g;
        ev.push({ t: tOf(base + n[0]), f: hz(n[1]), d: dur, v: vol, voice: sec === 'intro' ? 'box' : 'lead' });
        if (sec === 'peak') {
          /* 절정 구간은 옥타브 위로 살짝 겹쳐 밝게 */
          ev.push({ t: tOf(base + n[0]), f: hz(n[1] + 12), d: dur * 0.8, v: vol * 0.3, voice: 'shimmer' });
        }
      });

      /* 반주 */
      var ch = CHORDS[HARM[bar]] || CHORDS.D;
      if (bar >= 2) {
        var bassVol = (sec === 'intro' ? 0.055 : sec === 'build' ? 0.105 : 0.13) * g;
        ev.push({ t: tOf(base), f: hz(ch.bass), d: BEAT * 2.7, v: bassVol, voice: 'bass' });
      }
      if (bar >= 5) {
        var cVol = (sec === 'build' ? 0.052 : 0.068) * g;
        [1, 2].forEach(function (k) {
          ch.tones.forEach(function (m, i) {
            ev.push({ t: tOf(base + k), f: hz(m), d: BEAT * 0.52, v: cVol * (i === 0 ? 1 : 0.78), voice: 'chord' });
          });
        });
        /* 왈츠 강박 나무 소리 — 박자를 귀로 잡게 해 준다 */
        ev.push({ t: tOf(base), f: 1568, d: 0.05, v: (sec === 'peak' ? 0.05 : 0.035) * g, voice: 'tick' });
      }

      /* 마지막 두 마디: 상승 아르페지오 */
      if (bar >= 25) {
        var arp = bar === 25 ? [62, 66, 69, 74, 78, 81] : [67, 71, 74, 79, 83, 86];
        arp.forEach(function (m, i) {
          ev.push({ t: tOf(base + i * 0.5), f: hz(m), d: BEAT * 0.4, v: 0.05 * g, voice: 'chord' });
        });
      }
    }

    /* 마지막 화음 */
    [38, 50, 57, 62, 66, 74].forEach(function (m, i) {
      ev.push({ t: tOf(END_BEAT), f: hz(m), d: BEAT * 4.2, v: (i === 0 ? 0.11 : 0.07), voice: i === 0 ? 'bass' : 'lead' });
    });

    /* 카운트인 3박 — 곡 시작(t0)보다 앞선 시각에 울린다 */
    [0, 1, 2].forEach(function (i) {
      ev.push({ t: (i - LEAD) * BEAT, f: 1046 + i * 180, d: 0.12, v: 0.055 + i * 0.012, voice: 'tick' });
    });

    ev.sort(function (a, b) { return a.t - b.t; });
    return ev;
  }

  var EVENTS = null;

  /* ---------- 음색 ---------- */
  function piano(ctx, dest, freq, at, dur, vol, voice, sink) {
    if (!ctx || !(freq > 0)) return;
    var lead = ctx.createOscillator(), top = ctx.createOscillator();
    var g = ctx.createGain(), topGain = ctx.createGain(), filter = ctx.createBiquadFilter();
    lead.type = voice === 'box' || voice === 'shimmer' ? 'sine' : voice === 'bass' ? 'sine' : 'triangle';
    lead.frequency.value = freq;
    top.type = 'sine';
    top.frequency.value = freq * (voice === 'box' ? 3.002 : 2.004);
    topGain.gain.value = voice === 'box' ? 0.12 : voice === 'bass' ? 0.06 : 0.16;
    filter.type = 'lowpass';
    filter.frequency.value = voice === 'bass' ? 1100 : voice === 'chord' ? 2000 : 3200;
    filter.Q.value = 0.5;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0008, vol), at + (voice === 'bass' ? 0.03 : 0.012));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    lead.connect(filter); top.connect(topGain); topGain.connect(filter); filter.connect(g); g.connect(dest);
    lead.start(at); top.start(at);
    lead.stop(at + dur + 0.06); top.stop(at + dur + 0.06);
    if (sink) sink.push(lead, top);
  }

  function tick(ctx, dest, freq, at, vol, sink) {
    if (!ctx) return;
    var o = ctx.createOscillator(), g = ctx.createGain(), bp = ctx.createBiquadFilter();
    o.type = 'square'; o.frequency.value = freq;
    bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 6;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
    o.connect(bp); bp.connect(g); g.connect(dest);
    o.start(at); o.stop(at + 0.08);
    if (sink) sink.push(o);
  }

  /* ---------- 재생기 ----------
     start()는 '곡 0박이 울릴 오디오 시각(t0)'을 돌려준다. 게임의 모든 화면·판정은
     (ctx.currentTime - t0) 하나로 계산한다. 오디오는 전부 미리 예약하므로 드리프트가 없다. */
  function create(ctx, dest) {
    var sink = [], t0 = null;

    function start(preLead) {
      if (!ctx) return null;
      stop();
      if (!EVENTS) EVENTS = buildEvents();
      var pre = (preLead == null ? 0.28 : preLead);
      t0 = ctx.currentTime + pre + LEAD * BEAT;
      var i;
      for (i = 0; i < EVENTS.length; i++) {
        var e = EVENTS[i], at = t0 + e.t;
        if (e.voice === 'tick') tick(ctx, dest, e.f, at, e.v, sink);
        else piano(ctx, dest, e.f, at, e.d, e.v, e.voice, sink);
      }
      return t0;
    }
    function stop() {
      var now = ctx ? ctx.currentTime : 0;
      sink.forEach(function (n) { try { n.stop(now); } catch (err) { /* already stopped */ } });
      sink = [];
      t0 = null;
    }
    function startedAt() { return t0; }
    return { start: start, stop: stop, startedAt: startedAt };
  }

  /* 짧은 효과음(판정 피드백) — 곡 시계와 무관하게 누른 순간 울린다. */
  function chime(ctx, dest, notes, when, vol) {
    if (!ctx) return;
    var at = ctx.currentTime + (when || 0);
    notes.forEach(function (m, i) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = hz(m);
      var t = at + i * 0.045;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.09, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.36);
    });
  }
  function thud(ctx, dest) {
    if (!ctx) return;
    var at = ctx.currentTime, len = Math.floor(ctx.sampleRate * 0.16);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      var t = i / ctx.sampleRate;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / 0.16, 2.4) * 0.5;
    }
    var src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; lp.type = 'lowpass'; lp.frequency.value = 420; g.gain.value = 0.5;
    src.connect(lp); lp.connect(g); g.connect(dest); src.start(at);
  }

  window.WaltzMusic = {
    BPM: BPM, BEAT: BEAT, LEAD: LEAD, BARS: BARS, END_BEAT: END_BEAT,
    hz: hz, create: create, chime: chime, thud: thud, buildEvents: buildEvents
  };
})();
