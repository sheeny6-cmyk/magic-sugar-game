/* =========================================================
   마법 슈가 — 2D 관절 리깅 엔진 (rig.js)
   캔버스 2D · 계층형 본/관절 · 3D 방향 벡터 + 원근 투영
   - 의상 테마 3종, 표정, 머리카락/튜튀 2차 흔들림
   - 동작 클립(준비→수행→정점 홀드→복귀)과 무대 안무 타임라인
   ========================================================= */
(function (global) {
  'use strict';

  /* ================= 수학 ================= */
  const TAU = Math.PI * 2, PI = Math.PI;
  const clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  const lerp = function (a, b, t) { return a + (b - a) * t; };
  const ease = {
    inOut: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    outQuint: function (t) { return 1 - Math.pow(1 - t, 5); },
    in: function (t) { return t * t * t; },
    smooth: function (t) { return t * t * (3 - 2 * t); }
  };
  const V = {
    m: function (x, y, z) { return { x: x || 0, y: y || 0, z: z || 0 }; },
    add: function (a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; },
    sub: function (a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; },
    mul: function (a, s) { return { x: a.x * s, y: a.y * s, z: a.z * s }; },
    len: function (a) { return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z); },
    norm: function (a) { const l = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) || 1; return { x: a.x / l, y: a.y / l, z: a.z / l }; },
    lerp: function (a, b, t) { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) }; },
    dot: function (a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; },
    cross: function (a, b) { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
  };

  /* ================= 색 ================= */
  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mixc(a, b, t) {
    const x = hex2rgb(a), y = hex2rgb(b);
    return 'rgb(' + Math.round(lerp(x[0], y[0], t)) + ',' + Math.round(lerp(x[1], y[1], t)) + ',' + Math.round(lerp(x[2], y[2], t)) + ')';
  }
  function rgba(h, a) { const c = hex2rgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  /* ================= 비율 상수 ================= */
  const HIP_X = 17, HIP_Y = -5;
  const SH_X = 27, SH_Y = 78;
  const NECK_Y = 94, NECK_LEN = 8, HEAD_R = 30, HEAD_CY = NECK_Y + NECK_LEN + HEAD_R;
  const THIGH = 82, SHIN = 80, FOOT = 26;
  const UPPER = 54, FORE = 50;
  const PELVIS_Y = 177;
  const BODY_TOP = PELVIS_Y + HEAD_CY + HEAD_R + 12;   // 바닥~머리끝
  const FIG_H = BODY_TOP;

  /* ================= 의상 테마 ================= */
  const THEMES = {
    opal: {
      id: 'opal', ko: '오팔 핑크',
      skin: ['#fff1e9', '#fbdfd2', '#f0c2b1', '#dfa48f'],
      skinDeep: '#e0a892',
      hair: ['#8a5a34', '#6b4225', '#4a2b16', '#b98a5e'],
      bodice: ['#f9cfe4', '#d8eef6', '#e2d4fb'],
      bodiceDeep: '#e7a9c6',
      trim: '#fffdfd',
      skirt: ['#ffd9ec', '#d6f1f6', '#e4d8fd', '#ffeaf6'],
      shoe: ['#ffd7e5', '#f6aecb', '#fff1f7', '#d97fa2'],
      ribbon: '#f59fc0',
      bead: '#fff4fb',
      glow: 'rgba(255,214,238,'
    },
    swan: {
      id: 'swan', ko: '백조 화이트',
      skin: ['#fff3ec', '#fbe2d6', '#f2c8b8', '#e3ab97'],
      skinDeep: '#e2ac97',
      hair: ['#7d5433', '#5f3c22', '#402414', '#ac8259'],
      bodice: ['#ffffff', '#f4f6ff', '#e9eefc'],
      bodiceDeep: '#cfd8ef',
      trim: '#ffffff',
      skirt: ['#ffffff', '#f2f6ff', '#fdf4fb', '#eaf1ff'],
      shoe: ['#ffe6ee', '#f7c2d2', '#fffafb', '#dda5b6'],
      ribbon: '#f3c6d6',
      bead: '#ffffff',
      glow: 'rgba(240,246,255,'
    },
    midnight: {
      id: 'midnight', ko: '미드나잇 블루',
      skin: ['#fff1ea', '#fadfd4', '#f0c3b3', '#dfa793'],
      skinDeep: '#dfa793',
      hair: ['#5a3a2c', '#432818', '#2b170c', '#8a6247'],
      bodice: ['#8fa4e8', '#6f7fd6', '#b9c6f3'],
      bodiceDeep: '#4d5bb0',
      trim: '#eef2ff',
      skirt: ['#c7d0f5', '#a9b6ea', '#e2e7ff', '#9fb0ef'],
      shoe: ['#e9d9f0', '#c7a9d8', '#f8f2ff', '#a483bd'],
      ribbon: '#b7a2d8',
      bead: '#eef1ff',
      glow: 'rgba(180,196,244,'
    }
  };

  /* ================= 포즈 ================= */
  function arm(x, y, z, pole, hand) {
    return { x: x, y: y, z: z, pole: pole || [1, -0.35, -0.5], hand: hand || 'soft' };
  }
  function leg(x, y, z, pole, foot) {
    return { x: x, y: y, z: z, pole: pole || [1, 0, 0.35], foot: foot || null };
  }
  function mv(a, s) { return [a[0] * s, a[1], a[2] * s]; }

  const NEUTRAL = {
    facing: 0,
    pelvis: { x: 0, y: PELVIS_Y, z: 0 },
    spine: { lean: 0.02, side: 0, twist: 0 },
    head: { yaw: 0, pitch: 0, roll: 0, spot: 0 },
    armA: arm(19, -57, 13),
    armB: arm(-19, -57, 13),
    legA: leg(8, 14, 5, [1, 0, 0.4], [0.62, -0.42, 0.52]),
    legB: leg(-8, 14, -5, [-1, 0, 0.4], [-0.62, -0.42, -0.52]),
    expr: 'smile',
    breath: 0,
    scaleY: 1
  };

  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function merge(dst, src) {
    for (const k in src) {
      if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
      const s = src[k];
      if (isObj(s)) { dst[k] = merge(isObj(dst[k]) ? dst[k] : {}, s); }
      else if (Array.isArray(s)) { dst[k] = s.slice(); }
      else dst[k] = s;
    }
    return dst;
  }
  function P(over) { return merge(merge({}, NEUTRAL), over || {}); }

  function blendPose(a, b, t) {
    const out = {};
    for (const k in a) {
      const va = a[k], vb = b[k];
      if (typeof va === 'number' && typeof vb === 'number') out[k] = lerp(va, vb, t);
      else if (typeof va === 'string') out[k] = t < 0.5 ? va : vb;
      else if (Array.isArray(va)) {
        const arr = [];
        for (let i = 0; i < va.length; i++) arr.push(lerp(va[i], vb[i], t));
        if (k === 'foot') { const n = V.norm(V.m(arr[0], arr[1], arr[2])); out[k] = [n.x, n.y, n.z]; }
        else out[k] = arr;
      } else if (isObj(va)) out[k] = blendPose(va, vb, t);
      else out[k] = t < 0.5 ? va : vb;
    }
    return out;
  }
  // 시선 고정(spotting): 몸이 도는 동안 머리는 앞을 붙잡는다
  function applySpot(p) {
    if (!p.head.spot) return p;
    const out = merge({}, p);
    out.head.yaw = p.head.yaw + clamp(-p.facing, -1.15, 1.15) * p.head.spot;
    return out;
  }

  /* ---------- 동작 클립 ---------- */
  // key: t(0~1), p: pose
  function key(t, p) { return { t: t, p: p }; }

  const CLIPS = {
    /* 1) 플리에 — 1번 · 2번 */
    plie: {
      dur: 4600, ko: '플리에',
      keys: [
        key(0.00, P({})),
        key(0.10, P({
          pelvis: { y: 174 }, armA: arm(-14, -20, 48, [0.6, 0.1, -0.7]), armB: arm(14, -20, 48, [-0.6, 0.1, -0.7]),
          legA: leg(9, 14, 3, [1, 0, 0.28], [0.7, -0.42, 0.55]), legB: leg(-9, 14, 3, [-1, 0, 0.28], [-0.7, -0.42, 0.55])
        })),
        key(0.24, P({
          pelvis: { y: 150 }, spine: { lean: 0.03 },
          armA: arm(92, -8, 6, [1, 0.1, -0.25]), armB: arm(-92, -8, 6, [-1, 0.1, -0.25]),
          legA: leg(12, 14, 3, [1, 0, 0.28], [0.72, -0.45, 0.5]), legB: leg(-12, 14, 3, [-1, 0, 0.28], [-0.72, -0.45, -0.5]),
          expr: 'soft'
        })),
        key(0.34, P({
          pelvis: { y: 156 }, spine: { lean: 0.03 },
          armA: arm(94, -6, 6, [1, 0.1, -0.25]), armB: arm(-94, -6, 6, [-1, 0.1, -0.25]),
          legA: leg(12, 14, 3, [1, 0, 0.28], [0.72, -0.45, 0.5]), legB: leg(-12, 14, 3, [-1, 0, 0.28], [-0.72, -0.45, -0.5])
        })),
        key(0.46, P({
          pelvis: { y: 172 },
          armA: arm(70, -26, 14, [1, 0, -0.35]), armB: arm(-70, -26, 14, [-1, 0, -0.35]),
          legA: leg(26, 14, 2, [1, 0, 0.5], [0.85, -0.32, 0.35]), legB: leg(-26, 14, 2, [-1, 0, 0.5], [-0.85, -0.32, -0.35])
        })),
        key(0.60, P({
          pelvis: { y: 168 }, spine: { lean: 0.03 },
          armA: arm(52, -38, 20, [1, -0.1, -0.45]), armB: arm(-52, -38, 20, [-1, -0.1, -0.45]),
          legA: leg(30, 14, 2, [1, 0, 0.5], [0.85, -0.32, 0.35]), legB: leg(-30, 14, 2, [-1, 0, 0.5], [-0.85, -0.32, -0.35])
        })),
        key(0.72, P({
          pelvis: { y: 143 }, spine: { lean: 0.04 },
          armA: arm(96, -16, 2, [1, 0.1, -0.2]), armB: arm(-96, -16, 2, [-1, 0.1, -0.2]),
          legA: leg(44, 14, 2, [1, 0, 0.5], [1, -0.05, 0.12]), legB: leg(-44, 14, 2, [-1, 0, 0.5], [-1, -0.05, -0.12]),
          expr: 'soft'
        })),
        key(0.82, P({
          pelvis: { y: 149 }, spine: { lean: 0.04 },
          armA: arm(98, -14, 2, [1, 0.1, -0.2]), armB: arm(-98, -14, 2, [-1, 0.1, -0.2]),
          legA: leg(44, 14, 2, [1, 0, 0.5], [1, -0.05, 0.12]), legB: leg(-44, 14, 2, [-1, 0, 0.5], [-1, -0.05, -0.12])
        })),
        key(0.93, P({ pelvis: { y: 172 }, armA: arm(36, -46, 20), armB: arm(-36, -46, 20) })),
        key(1.00, P({}))
      ]
    },

    /* 2) 탄듀 — 옆으로 */
    tendu: {
      dur: 3600, ko: '탄듀',
      keys: [
        key(0.00, P({})),
        key(0.12, P({
          pelvis: { y: 175 }, spine: { side: 0.02 },
          armA: arm(56, -30, 12, [1, 0, -0.35]), armB: arm(-56, -30, 12, [-1, 0, -0.35]),
          legA: leg(12, 14, 4, [1, 0, 0.45], [0.72, -0.4, 0.5]), legB: leg(-9, 14, -4, [-1, 0, 0.45], [-0.65, -0.4, -0.5])
        })),
        key(0.34, P({
          pelvis: { y: 176, x: -3 }, spine: { side: -0.05 },
          armA: arm(92, -12, 4, [1, 0, -0.25]), armB: arm(-84, -34, 12, [-1, 0, -0.35]),
          legA: leg(74, 21, 4, [1, 0.05, 0.35], [0.8, -0.62, 0.05]),
          legB: leg(-10, 14, -4, [-1, 0, 0.4], [-0.62, -0.42, -0.5]),
          expr: 'focus'
        })),
        key(0.52, P({
          pelvis: { y: 176, x: -3 }, spine: { side: -0.05 },
          armA: arm(94, -10, 4, [1, 0, -0.25]), armB: arm(-84, -34, 12, [-1, 0, -0.35]),
          legA: leg(74, 21, 4, [1, 0.05, 0.35], [0.8, -0.62, 0.05]),
          legB: leg(-10, 14, -4, [-1, 0, 0.4], [-0.62, -0.42, -0.5]),
          expr: 'focus'
        })),
        key(0.72, P({
          pelvis: { y: 175 },
          armA: arm(44, -46, 16), armB: arm(-62, -30, 12, [-1, 0, -0.35]),
          legA: leg(16, 14, 4, [1, 0, 0.45], [0.75, -0.5, 0.35]),
          legB: leg(-9, 14, -4, [-1, 0, 0.4], [-0.62, -0.42, -0.5])
        })),
        key(0.88, P({
          pelvis: { y: 178, x: 1 }, spine: { side: 0.03 },
          armA: arm(30, -56, 18), armB: arm(-30, -56, 18),
          legA: leg(34, 16, 2, [1, 0, 0.45], [0.9, -0.2, 0.22])
        })),
        key(1.00, P({}))
      ]
    },

    /* 3) 파세 */
    passe: {
      dur: 3800, ko: '파세',
      keys: [
        key(0.00, P({})),
        key(0.12, P({
          pelvis: { y: 170 }, armA: arm(-12, -26, 44, [0.6, 0, -0.7]), armB: arm(12, -26, 44, [-0.6, 0, -0.7])
        })),
        key(0.30, P({
          pelvis: { y: 172 },
          armA: arm(-8, -12, 46, [0.7, 0.1, -0.7]), armB: arm(8, -12, 46, [-0.7, 0.1, -0.7]),
          legA: leg(10, 118, 8, [1, 0.35, 0.3], [0, -1, 0.05]),
          legB: leg(-9, 14, -4, [-1, 0, 0.4], [-0.62, -0.42, -0.5]),
          expr: 'focus'
        })),
        key(0.44, P({
          pelvis: { y: 184, x: -2 },
          armA: arm(-4, -6, 44, [0.8, 0.2, -0.7]), armB: arm(4, -6, 44, [-0.8, 0.2, -0.7]),
          legA: leg(8, 120, 8, [1, 0.4, 0.3], [0, -1, 0.05]),
          legB: leg(-6, 20, -4, [-1, 0, 0.4], [-0.12, -1, -0.04]),
          expr: 'focus'
        })),
        key(0.62, P({
          pelvis: { y: 185, x: -2 },
          armA: arm(-2, -4, 44, [0.8, 0.2, -0.7]), armB: arm(2, -4, 44, [-0.8, 0.2, -0.7]),
          legA: leg(8, 121, 8, [1, 0.4, 0.3], [0, -1, 0.05]),
          legB: leg(-6, 20, -4, [-1, 0, 0.4], [-0.12, -1, -0.04]),
          expr: 'focus'
        })),
        key(0.80, P({
          pelvis: { y: 176 },
          armA: arm(30, -50, 18), armB: arm(-30, -50, 18),
          legA: leg(26, 16, 4, [1, 0.1, 0.4], [0.75, -0.55, 0.3]),
          legB: leg(-9, 14, -4, [-1, 0, 0.4], [-0.62, -0.42, -0.5])
        })),
        key(1.00, P({}))
      ]
    },

    /* 4) 아라베스크 — 프로필 전환 */
    arabesque: {
      dur: 4200, ko: '아라베스크',
      keys: [
        key(0.00, P({})),
        key(0.12, P({
          pelvis: { y: 172, x: 0 }, facing: 0.5,
          spine: { lean: 0.06, twist: -0.1 },
          armA: arm(10, -34, 34), armB: arm(-50, -24, 10, [-1, 0, -0.4]),
          legA: leg(8, 14, 4, [1, 0, 0.4], [0.62, -0.42, 0.52])
        })),
        key(0.30, P({
          pelvis: { y: 181, x: 0 }, facing: 1.45,
          spine: { lean: 0.09, twist: -0.15 },
          armA: arm(30, 30, 112, [0.4, 0.2, -0.9], 'point'),
          armB: arm(-18, 0, -108, [-0.4, 0, -0.9], 'point'),
          legA: leg(4, 12, 4, [0.3, 0, 0.9], [0, -0.35, 0.94]),
          legB: leg(22, 130, -92, [0, -0.4, -0.95], [0, 0.15, -1]),
          head: { yaw: -0.1, pitch: 0.06 },
          expr: 'focus'
        })),
        key(0.46, P({
          pelvis: { y: 184, x: 0 }, facing: 1.57,
          spine: { lean: 0.1, twist: -0.18 },
          armA: arm(32, 38, 116, [0.4, 0.2, -0.9], 'point'),
          armB: arm(-18, 4, -112, [-0.4, 0, -0.9], 'point'),
          legA: leg(4, 12, 4, [0.3, 0, 0.9], [0, -0.35, 0.94]),
          legB: leg(30, 192, -162, [0, -0.3, -0.95], [0, 0.08, -1]),
          head: { yaw: -0.12, pitch: 0.08 },
          expr: 'focus'
        })),
        key(0.66, P({
          pelvis: { y: 185, x: 0 }, facing: 1.57,
          spine: { lean: 0.11, twist: -0.18 },
          armA: arm(32, 46, 118, [0.4, 0.2, -0.9], 'point'),
          armB: arm(-16, 8, -114, [-0.4, 0, -0.9], 'point'),
          legA: leg(4, 12, 4, [0.3, 0, 0.9], [0, -0.35, 0.94]),
          legB: leg(30, 194, -164, [0, -0.3, -0.95], [0, 0.08, -1]),
          head: { yaw: -0.12, pitch: 0.08 },
          expr: 'soft'
        })),
        key(0.82, P({
          pelvis: { y: 176 }, facing: 1.0,
          spine: { lean: 0.04, twist: -0.1 },
          armA: arm(28, 6, 100, [0.4, 0, -0.9]), armB: arm(-20, -2, -96, [-0.4, 0, -0.9]),
          legA: leg(8, 14, 4, [1, 0, 0.4], [0.62, -0.42, 0.52]),
          legB: leg(-8, 26, -20, [-1, 0, 0.4], [-0.4, -0.9, -0.2])
        })),
        key(0.93, P({ facing: 0.35, pelvis: { y: 178 } })),
        key(1.00, P({}))
      ]
    },

    /* 5) 아티튜드 */
    attitude: {
      dur: 4200, ko: '아티튜드',
      keys: [
        key(0.00, P({})),
        key(0.12, P({
          pelvis: { y: 172 }, facing: 0.5,
          armA: arm(8, -32, 34), armB: arm(-46, -22, 12)
        })),
        key(0.30, P({
          pelvis: { y: 181 }, facing: 1.4,
          spine: { lean: 0.06, twist: -0.1, side: 0.04 },
          armA: arm(6, 70, -6, [1, 0.5, -0.4], 'soft'),
          armB: arm(14, 6, 92, [0.4, 0, -0.9], 'soft'),
          legA: leg(7, 22, 4, [1, 0, 0.4], [0.2, -1, 0]),
          legB: leg(-6, 128, -72, [0, 1, -0.1], [0, 0.25, -1]),
          head: { yaw: -0.45, pitch: 0.06 },
          expr: 'smile'
        })),
        key(0.46, P({
          pelvis: { y: 184 }, facing: 1.57,
          spine: { lean: 0.07, twist: -0.12, side: 0.05 },
          armA: arm(4, 80, -10, [1, 0.5, -0.4], 'soft'),
          armB: arm(16, 12, 96, [0.4, 0, -0.9], 'soft'),
          legA: leg(6, 26, 4, [1, 0, 0.4], [0.18, -1, 0]),
          legB: leg(-4, 186, -96, [0, 1, -0.1], [0, 0.3, -1]),
          head: { yaw: -0.5, pitch: 0.08, roll: 0.06 },
          expr: 'smile'
        })),
        key(0.66, P({
          pelvis: { y: 185 }, facing: 1.57,
          spine: { lean: 0.08, twist: -0.12, side: 0.05 },
          armA: arm(4, 82, -10, [1, 0.5, -0.4], 'soft'),
          armB: arm(16, 14, 96, [0.4, 0, -0.9], 'soft'),
          legA: leg(6, 26, 4, [1, 0, 0.4], [0.18, -1, 0]),
          legB: leg(-4, 188, -98, [0, 1, -0.1], [0, 0.3, -1]),
          head: { yaw: -0.5, pitch: 0.08, roll: 0.06 },
          expr: 'wink'
        })),
        key(0.82, P({
          pelvis: { y: 176 }, facing: 0.9,
          armA: arm(34, 4, 26), armB: arm(-34, -32, 10),
          legA: leg(8, 14, 4, [1, 0, 0.4], [0.62, -0.42, 0.52]),
          legB: leg(-10, 30, -16, [-1, 0, 0.4], [-0.4, -0.9, -0.15])
        })),
        key(0.93, P({ facing: 0.3, pelvis: { y: 178 } })),
        key(1.00, P({}))
      ]
    },

    /* 6) 피루엣 — 실제 360도 회전 */
    pirouette: {
      dur: 4600, ko: '피루엣',
      keys: [
        key(0.00, P({})),
        key(0.12, P({
          pelvis: { y: 165 }, spine: { lean: 0.02 },
          armA: arm(30, -40, 24), armB: arm(-40, -24, 24),
          legA: leg(16, 14, 8, [1, 0, 0.5], [0.6, -0.4, 0.65]),
          legB: leg(-14, 14, -8, [-1, 0, 0.5], [-0.6, -0.4, -0.65]),
          expr: 'focus'
        })),
        key(0.22, P({
          facing: 0.2, pelvis: { y: 183 },
          armA: arm(-8, -14, 44, [0.5, -0.6, -0.6]), armB: arm(8, -14, 44, [-0.5, -0.6, -0.6]),
          legA: leg(10, 116, 8, [1, 0.4, 0.3], [0, -1, 0.05]),
          legB: leg(-6, 20, -4, [-1, 0, 0.4], [-0.12, -1, -0.04]),
          head: { spot: 1 }, expr: 'focus'
        })),
        key(0.34, P({
          facing: 1.35, pelvis: { y: 186 },
          armA: arm(-6, -8, 44, [0.5, -0.6, -0.6]), armB: arm(6, -8, 44, [-0.5, -0.6, -0.6]),
          legA: leg(9, 118, 8, [1, 0.4, 0.3], [0, -1, 0.05]),
          legB: leg(-6, 20, -4, [-1, 0, 0.4], [-0.12, -1, -0.04]),
          head: { spot: 1 }, expr: 'focus'
        })),
        key(0.46, P({
          facing: 2.75, pelvis: { y: 187 },
          armA: arm(-6, -6, 44, [0.8, 0.2, -0.7]), armB: arm(6, -6, 44, [-0.8, 0.2, -0.7]),
          legA: leg(9, 118, 8, [1, 0.4, 0.3], [0, -1, 0.05]),
          legB: leg(-6, 20, -4, [-1, 0, 0.4], [-0.12, -1, -0.04]),
          head: { spot: 1 }, expr: 'focus'
        })),
        key(0.58, P({
          facing: 4.2, pelvis: { y: 187 },
          armA: arm(-6, -6, 44, [0.8, 0.2, -0.7]), armB: arm(6, -6, 44, [-0.8, 0.2, -0.7]),
          legA: leg(9, 118, 8, [1, 0.4, 0.3], [0, -1, 0.05]),
          legB: leg(-6, 20, -4, [-1, 0, 0.4], [-0.12, -1, -0.04]),
          head: { spot: 1 }, expr: 'focus'
        })),
        key(0.70, P({
          facing: 5.6, pelvis: { y: 186 },
          armA: arm(-6, -6, 44, [0.8, 0.2, -0.7]), armB: arm(6, -6, 44, [-0.8, 0.2, -0.7]),
          legA: leg(9, 118, 8, [1, 0.4, 0.3], [0, -1, 0.05]),
          legB: leg(-6, 20, -4, [-1, 0, 0.4], [-0.12, -1, -0.04]),
          head: { spot: 1 }, expr: 'focus'
        })),
        key(0.80, P({
          facing: 6.283, pelvis: { y: 178 },
          armA: arm(26, -28, 30), armB: arm(-26, -28, 30),
          legA: leg(12, 20, 6, [1, 0, 0.45], [0.5, -0.8, 0.2]),
          legB: leg(-9, 16, -6, [-1, 0, 0.4], [-0.45, -0.8, -0.3]),
          head: { spot: 0.4 }, expr: 'smile'
        })),
        key(0.88, P({
          facing: 6.283, pelvis: { y: 160 },
          armA: arm(50, -34, 14), armB: arm(-50, -34, 14),
          legA: leg(12, 14, 5, [1, 0, 0.45], [0.62, -0.42, 0.52]),
          legB: leg(-10, 14, -5, [-1, 0, 0.45], [-0.62, -0.42, -0.52])
        })),
        key(1.00, P({ facing: 6.283, pelvis: { y: PELVIS_Y } }))
      ]
    },

    /* 7) 파드샤 — 고양이 점프 (비대칭) */
    pasdechat: {
      dur: 3800, ko: '파드샤',
      keys: [
        key(0.00, P({})),
        key(0.10, P({
          pelvis: { y: 165 }, spine: { lean: 0.03 },
          armA: arm(40, -40, 20), armB: arm(-40, -40, 20),
          legA: leg(10, 14, 4, [1, 0, 0.45], [0.7, -0.42, 0.55]),
          legB: leg(-10, 14, -4, [-1, 0, 0.45], [-0.7, -0.42, -0.55]),
          expr: 'focus'
        })),
        key(0.20, P({
          pelvis: { y: 158 }, spine: { lean: 0.06 },
          armA: arm(58, -26, 16), armB: arm(-58, -26, 16),
          legA: leg(11, 14, 4, [1, 0, 0.5], [0.7, -0.42, 0.55]),
          legB: leg(-11, 14, -4, [-1, 0, 0.5], [-0.7, -0.42, -0.55]),
          expr: 'focus'
        })),
        key(0.32, P({
          pelvis: { y: 214 }, spine: { lean: 0.05 },
          armA: arm(40, 44, 24, [1, 0.3, -0.3]), armB: arm(-36, 34, 20, [-1, 0.3, -0.3]),
          legA: leg(4, 104, 16, [1, 0.5, 0.3], [0, -1, 0.1]),
          legB: leg(-14, 40, -8, [-1, 0, 0.4], [-0.4, -0.9, -0.2]),
          head: { pitch: 0.05 }, expr: 'smile'
        })),
        key(0.42, P({
          pelvis: { y: 238 }, spine: { lean: 0.03 },
          armA: arm(30, 56, 22, [1, 0.4, -0.3]), armB: arm(-30, 44, 16, [-1, 0.4, -0.3]),
          legA: leg(-2, 136, 18, [1, 0.6, 0.3], [0, -1, 0.1]),
          legB: leg(-30, 98, -12, [-1, 0.3, 0.2], [-0.3, -0.9, -0.2]),
          head: { pitch: 0.03 }, expr: 'smile'
        })),
        key(0.52, P({
          pelvis: { y: 228 }, spine: { lean: 0.03 },
          armA: arm(44, 24, 22), armB: arm(-44, 16, 16),
          legA: leg(2, 112, 14, [1, 0.5, 0.3], [0.1, -1, 0.05]),
          legB: leg(-26, 62, -14, [-1, 0.2, 0.2], [-0.4, -0.9, -0.2]),
          expr: 'smile'
        })),
        key(0.64, P({
          pelvis: { y: 172 }, spine: { lean: 0.05 },
          armA: arm(60, -18, 14), armB: arm(-60, -18, 14),
          legA: leg(12, 24, 6, [1, 0, 0.4], [0.5, -0.85, 0.2]),
          legB: leg(-12, 26, -6, [-1, 0, 0.4], [-0.5, -0.85, -0.2])
        })),
        key(0.76, P({
          pelvis: { y: 156 }, spine: { lean: 0.05 },
          armA: arm(50, -32, 16), armB: arm(-50, -32, 16),
          legA: leg(12, 14, 4, [1, 0, 0.45], [0.62, -0.42, 0.52]),
          legB: leg(-12, 14, -4, [-1, 0, 0.45], [-0.62, -0.42, -0.52])
        })),
        key(1.00, P({}))
      ]
    },

    /* 8) 그랑 주테 — 측면 도약 180도 */
    grandjete: {
      dur: 4000, ko: '그랑 주테',
      keys: [
        key(0.00, P({})),
        key(0.10, P({
          pelvis: { y: 166 }, facing: 0.45, spine: { lean: 0.06 },
          armA: arm(34, -40, 18), armB: arm(-46, -26, 14),
          legA: leg(20, 14, 4, [1, 0, 0.5], [0.75, -0.35, 0.45]),
          legB: leg(-22, 14, -2, [-1, 0, 0.5], [-0.8, -0.35, 0.3]),
          expr: 'focus'
        })),
        key(0.20, P({
          pelvis: { y: 155 }, facing: 1.2, spine: { lean: 0.1 },
          armA: arm(18, -40, 30), armB: arm(-52, -20, 8),
          legA: leg(26, 14, 10, [1, 0, 0.6], [0.8, -0.4, 0.4]),
          legB: leg(-26, 14, -12, [-1, 0, 0.6], [-0.8, -0.4, -0.4]),
          expr: 'focus'
        })),
        key(0.34, P({
          pelvis: { y: 232 }, facing: 1.57, spine: { lean: 0.05 },
          armA: arm(16, 26, 116, [0.3, 0.2, -0.9], 'point'),
          armB: arm(-10, 10, -110, [-0.3, 0, -0.9], 'point'),
          legA: leg(4, 214, 156, [0, 0.1, 1], [0, 0.2, 1]),
          legB: leg(-4, 214, -156, [0, 0.1, -1], [0, 0.2, -1]),
          head: { yaw: -0.6, pitch: 0.1 }, expr: 'smile'
        })),
        key(0.44, P({
          pelvis: { y: 246 }, facing: 1.57, spine: { lean: 0.03 },
          armA: arm(18, 40, 120, [0.3, 0.25, -0.9], 'point'),
          armB: arm(-10, 16, -118, [-0.3, 0, -0.9], 'point'),
          legA: leg(4, 210, 150, [0, 0.1, 1], [0, 0.25, 1]),
          legB: leg(-4, 210, -150, [0, 0.1, -1], [0, 0.25, -1]),
          head: { yaw: -0.65, pitch: 0.12 }, expr: 'smile'
        })),
        key(0.56, P({
          pelvis: { y: 208 }, facing: 1.57, spine: { lean: 0.05 },
          armA: arm(16, 20, 98), armB: arm(-14, 12, -92),
          legA: leg(4, 160, 118, [0, 0.15, 1], [0.05, -0.3, 1]),
          legB: leg(-4, 160, -110, [0, 0.15, -1], [-0.05, -0.3, -1]),
          head: { yaw: -0.5 }, expr: 'smile'
        })),
        key(0.68, P({
          pelvis: { y: 158 }, facing: 1.57, spine: { lean: 0.08 },
          armA: arm(52, -20, 20), armB: arm(-46, -24, 6),
          legA: leg(18, 14, 22, [1, 0, 0.5], [0.7, -0.45, 0.4]),
          legB: leg(-20, 14, -16, [-1, 0, 0.5], [-0.7, -0.45, -0.4]),
          head: { yaw: -0.4 }, expr: 'smile'
        })),
        key(0.82, P({
          pelvis: { y: 170 }, facing: 1.2,
          armA: arm(40, -34, 18), armB: arm(-40, -34, 18),
          legA: leg(12, 14, 6, [1, 0, 0.45], [0.65, -0.42, 0.5]),
          legB: leg(-12, 14, -6, [-1, 0, 0.45], [-0.65, -0.42, -0.5])
        })),
        key(0.93, P({ facing: 0.4, pelvis: { y: 177 } })),
        key(1.00, P({ facing: 0 }))
      ]
    },

    /* 9) 에샤페 */
    echappe: {
      dur: 3800, ko: '에샤페',
      keys: [
        key(0.00, P({})),
        key(0.12, P({
          pelvis: { y: 160 }, spine: { lean: 0.03 },
          armA: arm(-10, -24, 44), armB: arm(10, -24, 44),
          legA: leg(9, 14, 5, [1, 0, 0.5], [0.62, -0.42, 0.52]),
          legB: leg(-9, 14, -5, [-1, 0, 0.5], [-0.62, -0.42, -0.52]),
          expr: 'focus'
        })),
        key(0.26, P({
          pelvis: { y: 206 }, spine: { lean: 0.02 },
          armA: arm(80, -12, 8, [1, 0.1, -0.3]), armB: arm(-80, -12, 8, [-1, 0.1, -0.3]),
          legA: leg(30, 26, 2, [1, 0, 0.5], [0.5, -0.85, 0.15]),
          legB: leg(-30, 26, 2, [-1, 0, 0.5], [-0.5, -0.85, -0.15]),
          expr: 'smile'
        })),
        key(0.40, P({
          pelvis: { y: 197 }, spine: { lean: 0.02 },
          armA: arm(92, -6, 6, [1, 0.1, -0.3]), armB: arm(-92, -6, 6, [-1, 0.1, -0.3]),
          legA: leg(46, 26, 2, [1, 0, 0.5], [0.6, -0.8, 0.1]),
          legB: leg(-46, 26, 2, [-1, 0, 0.5], [-0.6, -0.8, -0.1]),
          expr: 'smile'
        })),
        key(0.56, P({
          pelvis: { y: 193 }, spine: { lean: 0.02 },
          armA: arm(94, -4, 6, [1, 0.1, -0.3]), armB: arm(-94, -4, 6, [-1, 0.1, -0.3]),
          legA: leg(46, 26, 2, [1, 0, 0.5], [0.6, -0.8, 0.1]),
          legB: leg(-46, 26, 2, [-1, 0, 0.5], [-0.6, -0.8, -0.1]),
          expr: 'smile'
        })),
        key(0.70, P({
          pelvis: { y: 168 }, spine: { lean: 0.03 },
          armA: arm(44, -36, 16), armB: arm(-44, -36, 16),
          legA: leg(12, 16, 4, [1, 0, 0.45], [0.62, -0.42, 0.52]),
          legB: leg(-12, 16, 4, [-1, 0, 0.45], [-0.62, -0.42, -0.52])
        })),
        key(0.84, P({
          pelvis: { y: 156 }, spine: { lean: 0.03 },
          armA: arm(-12, -30, 42), armB: arm(12, -30, 42),
          legA: leg(9, 14, 5, [1, 0, 0.5], [0.62, -0.42, 0.52]),
          legB: leg(-9, 14, -5, [-1, 0, 0.5], [-0.62, -0.42, -0.52])
        })),
        key(1.00, P({}))
      ]
    },

    /* 피날레 — 레베랑스 */
    reverence: {
      dur: 3800, ko: '레베랑스',
      keys: [
        key(0.00, P({})),
        key(0.14, P({
          pelvis: { y: 174, z: 0 }, spine: { lean: 0.02 },
          armA: arm(72, -28, 16, [1, 0, -0.3]), armB: arm(-72, -28, 16, [-1, 0, -0.3]),
          legA: leg(12, 14, 6, [1, 0, 0.45], [0.62, -0.42, 0.52]),
          legB: leg(-14, 14, -22, [-1, 0, 0.4], [-0.6, -0.42, -0.5]),
          expr: 'smile'
        })),
        key(0.36, P({
          pelvis: { y: 162, z: 0 }, spine: { lean: 0.14 },
          armA: arm(26, -66, 30, [1, -0.25, -0.5]), armB: arm(-26, -66, 30, [-1, -0.25, -0.5]),
          legA: leg(14, 14, 6, [1, 0, 0.45], [0.62, -0.42, 0.52]),
          legB: leg(-12, 14, -30, [-1, 0, 0.4], [-0.55, -0.45, -0.45]),
          head: { pitch: 0.12 }, expr: 'soft'
        })),
        key(0.50, P({
          pelvis: { y: 156, z: 0 }, spine: { lean: 0.16 },
          armA: arm(22, -74, 34, [1, -0.28, -0.5]), armB: arm(-22, -74, 34, [-1, -0.28, -0.5]),
          legA: leg(14, 14, 6, [1, 0, 0.45], [0.62, -0.42, 0.52]),
          legB: leg(-12, 14, -30, [-1, 0, 0.4], [-0.55, -0.45, -0.45]),
          head: { pitch: 0.14 }, expr: 'soft'
        })),
        key(0.66, P({
          pelvis: { y: 174, z: 0 }, spine: { lean: 0.08 },
          armA: arm(-6, -26, 40, [1, 0, -0.5]), armB: arm(-56, -26, 18, [-1, 0, -0.4]),
          legA: leg(12, 14, 6, [1, 0, 0.45], [0.62, -0.42, 0.52]),
          legB: leg(-12, 14, -20, [-1, 0, 0.4], [-0.58, -0.42, -0.48]),
          head: { pitch: 0.02, yaw: 0.12 }, expr: 'smile'
        })),
        key(0.82, P({
          pelvis: { y: 177, z: 0 }, spine: { lean: 0.02 },
          armA: arm(-10, -20, 38, [1, 0, -0.5]), armB: arm(-42, -32, 16, [-1, 0, -0.4]),
          legA: leg(10, 14, 6, [1, 0, 0.45], [0.62, -0.42, 0.52]),
          legB: leg(-12, 14, -14, [-1, 0, 0.4], [-0.6, -0.42, -0.5]),
          head: { yaw: 0.14 }, expr: 'wink'
        })),
        key(1.00, P({
          armA: arm(-10, -20, 38, [1, 0, -0.5]), armB: arm(-42, -32, 16, [-1, 0, -0.4]),
          legB: leg(-12, 14, -14, [-1, 0, 0.4], [-0.6, -0.42, -0.5]),
          head: { yaw: 0.14 }, expr: 'smile'
        }))
      ]
    }
  };

  /* ---------- 클립 샘플 ---------- */
  function sampleClip(clip, u) {
    const keys = clip.keys;
    if (u <= keys[0].t) return keys[0].p;
    for (let i = 1; i < keys.length; i++) {
      if (u <= keys[i].t) {
        const a = keys[i - 1], b = keys[i];
        const k = (u - a.t) / (b.t - a.t || 1);
        const w = ease.inOut(clamp(k, 0, 1));
        const p = blendPose(a.p, b.p, w);
        // 360도 턴 등 순환 각도: 키풉에 큰 점프가 있으면 짧은 쪽으로 보간
        if (typeof a.p.facing === 'number' && typeof b.p.facing === 'number' && Math.abs(b.p.facing - a.p.facing) > 3.15) {
          p.facing = a.p.facing + (b.p.facing - a.p.facing) * w;
        }
        return p;
      }
    }
    return keys[keys.length - 1].p;
  }

  /* ================= 골격 ================= */
  function basis(twist, lean, side) {
    const ct = Math.cos(twist), st = Math.sin(twist);
    const ex = V.m(ct, 0, -st);
    const ez = V.m(st, 0, ct);
    const ey = V.m(0, 1, 0);
    const cl = Math.cos(lean), sl = Math.sin(lean);
    const ey2 = V.add(V.mul(ey, cl), V.mul(ez, sl));
    const ez2 = V.add(V.mul(ez, cl), V.mul(ey, -sl));
    const cs = Math.cos(side), ss = Math.sin(side);
    const ey3 = V.add(V.mul(ey2, cs), V.mul(ex, ss));
    const ex3 = V.add(V.mul(ex, cs), V.mul(ey2, -ss));
    return { ex: V.norm(ex3), ey: V.norm(ey3), ez: V.norm(ez2) };
  }

  function ik(root, target, l1, l2, pole) {
    let d = V.sub(target, root);
    let dist = V.len(d);
    const maxd = (l1 + l2) * 0.998;
    let tgt = target;
    if (dist > maxd) { tgt = V.add(root, V.mul(V.norm(d), maxd)); dist = maxd; }
    if (dist < 1e-3) dist = 1e-3;
    const u = V.norm(V.sub(tgt, root));
    const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
    const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    let pv = V.m(pole[0], pole[1], pole[2]);
    let p = V.sub(pv, V.mul(u, V.dot(pv, u)));
    if (V.len(p) < 1e-4) p = V.m(0, 0, 1);
    p = V.norm(p);
    return { mid: V.add(V.add(root, V.mul(u, a)), V.mul(p, h)), end: tgt };
  }

  function footDir(lp, hip, knee, ankle) {
    if (lp.foot) {
      const n = V.norm(V.m(lp.foot[0], lp.foot[1], lp.foot[2]));
      return n;
    }
    return V.norm(V.sub(ankle, knee));
  }

  function solve(pose) {
    const p = pose;
    const B = basis(p.spine.twist, p.spine.lean, p.spine.side);
    const pel = V.m(p.pelvis.x, p.pelvis.y, p.pelvis.z);
    const hipA = V.add(pel, V.add(V.add(V.mul(B.ex, HIP_X), V.mul(B.ey, HIP_Y)), V.mul(B.ez, 6)));
    const hipB = V.add(pel, V.add(V.add(V.mul(B.ex, -HIP_X), V.mul(B.ey, HIP_Y)), V.mul(B.ez, -6)));
    const waist = V.add(pel, V.mul(B.ey, 32));
    const chest = V.add(pel, V.mul(B.ey, 54));
    const shoulderA = V.add(pel, V.add(V.add(V.mul(B.ey, SH_Y), V.mul(B.ex, SH_X)), V.mul(B.ez, 9)));
    const shoulderB = V.add(pel, V.add(V.add(V.mul(B.ey, SH_Y), V.mul(B.ex, -SH_X)), V.mul(B.ez, -9)));
    const neckBase = V.add(pel, V.add(V.mul(B.ey, NECK_Y), V.mul(B.ez, 2)));

    // 머리 프레임
    const hy = PI / 2 - 0.0;
    const hp = p.head.pitch, hr = p.head.roll;
    let hyaw = p.head.yaw + (p.head.spot ? clamp(-p.facing, -1.15, 1.15) * p.head.spot : 0);
    const hUp = V.norm(V.add(V.add(V.mul(B.ey, Math.cos(hp)), V.mul(B.ez, Math.sin(hp))), V.mul(B.ex, Math.sin(hr) * 0.8)));
    const hFwd0 = V.norm(V.sub(V.mul(B.ez, Math.cos(hp)), V.mul(B.ey, Math.sin(hp))));
    const hx = V.norm(V.cross(hUp, hFwd0));
    const hFwd = V.norm(V.cross(hx, hUp));
    // 머리 좌우 회전
    const cy = Math.cos(hyaw), sy = Math.sin(hyaw);
    const hF = V.norm(V.add(V.mul(hFwd, cy), V.mul(hx, sy)));
    const hX = V.norm(V.add(V.mul(hx, cy), V.mul(hFwd, -sy)));
    const headC = V.add(neckBase, V.mul(B.ey, NECK_LEN + HEAD_R));

    const arms = {};
    ['A', 'B'].forEach(function (s) {
      const AP = p['arm' + s];
      const sh = s === 'A' ? shoulderA : shoulderB;
      const wr = V.add(sh, V.m(V.mul(B.ex, AP.x).x + V.mul(B.ey, AP.y).x + V.mul(B.ez, AP.z).x,
        V.mul(B.ex, AP.x).y + V.mul(B.ey, AP.y).y + V.mul(B.ez, AP.z).y,
        V.mul(B.ex, AP.x).z + V.mul(B.ey, AP.y).z + V.mul(B.ez, AP.z).z));
      const pole = V.add(V.add(V.mul(B.ex, AP.pole[0]), V.mul(B.ey, AP.pole[1])), V.mul(B.ez, AP.pole[2]));
      const sol = ik(sh, wr, UPPER, FORE, [pole.x, pole.y, pole.z]);
      arms[s] = { shoulder: sh, elbow: sol.mid, wrist: sol.end, hand: AP.hand, dir: V.norm(V.sub(sol.end, sol.mid)) };
    });

    const legs = {};
    ['A', 'B'].forEach(function (s) {
      const LP = p['leg' + s];
      const hip = s === 'A' ? hipA : hipB;
      const ankle = V.m(LP.x, LP.y, LP.z);
      const pole = V.add(V.add(V.mul(B.ex, LP.pole[0]), V.mul(B.ey, LP.pole[1])), V.mul(B.ez, LP.pole[2]));
      const sol = ik(hip, ankle, THIGH, SHIN, [pole.x, pole.y, pole.z]);
      const fd = footDir(LP, hip, sol.mid, sol.end);
      legs[s] = { hip: hip, knee: sol.mid, ankle: sol.end, footDir: fd, toe: V.add(sol.end, V.mul(fd, FOOT)) };
    });

    return {
      pose: p, B: B, pelvis: pel, hipA: hipA, hipB: hipB, waist: waist, chest: chest,
      shoulderA: shoulderA, shoulderB: shoulderB, neckBase: neckBase,
      head: { c: headC, up: hUp, fwd: hF, side: hX, r: HEAD_R, yaw: hyaw },
      arms: arms, legs: legs
    };
  }

  /* ================= 내보내기 (1/2) ================= */
  global.SugarRigCore = {
    V: V, TAU: TAU, PI: PI, clamp: clamp, lerp: lerp, ease: ease,
    mixc: mixc, rgba: rgba, THEMES: THEMES, CLIPS: CLIPS, NEUTRAL: NEUTRAL,
    P: P, blendPose: blendPose, sampleClip: sampleClip, solve: solve,
    constants: { FIG_H: FIG_H, HEAD_R: HEAD_R, BODY_TOP: BODY_TOP, PELVIS_Y: PELVIS_Y }
  };
})(typeof window !== 'undefined' ? window : this);
/* =========================================================
   인스턴스 · 타이밍 · 무대 안무
   ========================================================= */
(function (global) {
  'use strict';
  const C = global.SugarRigCore;
  function Paint() { return global.SugarRigPaint; }
  const V = C.V, clamp = C.clamp, lerp = C.lerp, ease = C.ease, TAU = C.TAU, PI = C.PI;
  const CLIPS = C.CLIPS, FIG_H = C.constants.FIG_H;

  const DESIGN_W = 372, DESIGN_H = 408;

  function Spring(k, d) { this.x = 0; this.v = 0; this.k = k || 70; this.d = d || 10; }
  Spring.prototype.step = function (target, dt) {
    const a = (target - this.x) * this.k - this.v * this.d;
    this.v += a * dt;
    this.x += this.v * dt;
    return this.x;
  };

  /* ---------- 무대 타임라인 ---------- */
  const INTRO = 1600, SEG = 3200, FINALE = 3800;

  function buildShow(ids) {
    const segs = [];
    let t = INTRO;
    for (let i = 0; i < ids.length; i++) {
      const clip = CLIPS[ids[i]];
      const prev = segs.length > 0 ? segs[segs.length - 1] : null;
      segs.push({
        id: ids[i], type: 'pose', start: t, dur: SEG,
        blendFrom: prev ? C.sampleClip(CLIPS[prev.id], 0.72) : null,
        blend: i === 0 ? 520 : 420
      });
      t += SEG;
    }
    const last = segs[segs.length - 1];
    segs.push({
      id: 'reverence', type: 'finale', start: t, dur: FINALE,
      blendFrom: last ? C.sampleClip(CLIPS[last.id], 0.7) : null, blend: 560
    });
    t += FINALE;
    return { segs: segs, total: t };
  }

  function showPoseAt(show, t) {
    const segs = show.segs;
    if (t <= 0) return C.sampleClip(CLIPS[segs[0].id], 0);
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (t < s.start + s.dur) {
        const local = t - s.start;
        let u;
        if (s.type === 'finale') u = clamp(local / s.dur, 0, 1);
        else u = clamp(local / (s.dur * 0.86), 0, 1);
        let pose = C.sampleClip(CLIPS[s.id], u);
        if (s.blendFrom && local < s.blend) {
          const k = ease.inOut(clamp(local / s.blend, 0, 1));
          pose = C.blendPose(s.blendFrom, pose, k);
        }
        return pose;
      }
    }
    const ls = segs[segs.length - 1];
    return C.sampleClip(CLIPS[ls.id], 1);
  }

  /* ---------- 인스턴스 ---------- */
  function Rig(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.poseId = opts.pose || 'arabesque';
    this.theme = opts.theme || 'opal';
    this.mode = opts.mode || 'loop';     // loop | show | manual
    this.speed = opts.speed || 1;
    this.fps = opts.fps || 0;
    this.lastDraw = 0;
    this.fit = opts.fit || 1;
    this.offsetY = opts.offsetY || 0;
    this.shadow = opts.shadow !== false;
    this.autoClear = opts.autoClear !== false;
    this.time = 0;
    this.t0 = 0;
    this.blink = 0;
    this.nextBlink = 1.4 + Math.random() * 3;
    this.blinkPhase = 0;
    this.springs = { hair: new Spring(58, 10), tutuY: new Spring(90, 13), tutuX: new Spring(70, 11) };
    this.prevHead = null;
    this.prevPelvis = null;
    this.show = null;
    this.env = { theme: this.theme, time: 0, blink: 0, hairSway: 0, tutuLift: 0, tutuSway: 0 };
    this.resize();
  }

  Rig.prototype.resize = function () {
    const c = this.canvas;
    const w = c.clientWidth || c.width || 300;
    const h = c.clientHeight || c.height || 300;
    const dpr = Math.min(2, global.devicePixelRatio || 1);
    this.w = w; this.h = h; this.dpr = dpr;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
  };

  Rig.prototype.setPose = function (id) { this.poseId = id; this.t0 = this.time; };
  Rig.prototype.setTheme = function (t) { this.theme = t; this.env.theme = t; };

  Rig.prototype.setShow = function (ids) {
    this.show = buildShow(ids);
    this.t0 = this.time;
    this.prevHead = null; this.prevPelvis = null;
  };
  Rig.prototype.showMs = function () { return this.show ? this.show.total : 0; };

  Rig.prototype.poseAt = function (t) {
    if (this.mode === 'show' && this.show) return showPoseAt(this.show, t);
    const clip = CLIPS[this.poseId] || CLIPS.arabesque;
    let u = (t / clip.dur) % 1;
    if (u < 0) u += 1;
    return C.sampleClip(clip, u);
  };

  Rig.prototype.render = function (t, dt) {
    dt = dt || 0.016;
    this.time = t;
    const ctx = this.ctx;
    const w = this.w, h = this.h, dpr = this.dpr;
    let pose = this.poseAt(t);

    // 숨쉬기 · 미세 흔들림
    const breath = Math.sin(t / 1000 * 1.5) * 0.55;
    pose = Object.assign({}, pose, { pelvis: { x: pose.pelvis.x, y: pose.pelvis.y + breath * 0.7, z: pose.pelvis.z } });

    const S = C.solve(pose);
    const pr = Paint().makeProj(pose.facing);
    const headP = pr(S.head.c), pelP = pr(S.pelvis);

    // 2차 흔들림 스프링
    let hVel = 0, pVelY = 0, pVelX = 0;
    if (this.prevHead && this.prevPelvis) {
      hVel = (headP.x - this.prevHead.x) / Math.max(0.008, dt);
      pVelY = (pelP.y - this.prevPelvis.y) / Math.max(0.008, dt);
      pVelX = (pelP.x - this.prevPelvis.x) / Math.max(0.008, dt);
    }
    this.prevHead = { x: headP.x, y: headP.y };
    this.prevPelvis = { x: pelP.x, y: pelP.y };
    const hairSway = this.springs.hair.step(clamp(-hVel * 0.22, -13, 13), dt);
    const tutuLift = this.springs.tutuY.step(clamp(-pVelY * 0.09, -16, 16), dt);
    const tutuSway = this.springs.tutuX.step(clamp(-pVelX * 0.1, -9, 9), dt);

    // 깜빡임
    this.nextBlink -= dt;
    if (this.nextBlink <= 0 && this.blinkPhase <= 0) { this.blinkPhase = 0.16; this.nextBlink = 2.2 + Math.random() * 3.4; }
    if (this.blinkPhase > 0) {
      this.blinkPhase -= dt;
      const k = 1 - Math.abs(this.blinkPhase / 0.16 - 0.5) * 2;
      this.blink = clamp(k, 0, 1);
    } else this.blink = 0;

    this.env.theme = this.theme;
    this.env.time = t / 1000;
    this.env.blink = this.blink;
    this.env.hairSway = hairSway;
    this.env.tutuLift = tutuLift;
    this.env.tutuSway = tutuSway;

    // 화면 변환
    const s = Math.min(w * 0.96 / DESIGN_W, h * 0.99 / DESIGN_H) * this.fit;
    const cx = w / 2;
    const floor = (h + DESIGN_H * s) / 2 + (this.offsetY * h);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.autoClear) ctx.clearRect(0, 0, w, h);
    ctx.save();
    // 바닥 그림자
    if (this.shadow) {
      const air = clamp((floor - pelP.y) / (240 * s), 0, 1);
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = ctx.createRadialGradient(cx, floor - 2, 2, cx, floor - 2, 74 * s);
      const a0 = 0.20 - 0.13 * air;
      g.addColorStop(0, 'rgba(120,70,100,' + a0.toFixed(3) + ')');
      g.addColorStop(1, 'rgba(120,70,100,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, floor - 2, 78 * s, 11 * s * (1 - air * 0.3), 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.setTransform(dpr * s, 0, 0, -dpr * s, dpr * cx, dpr * floor);
    ctx.lineJoin = 'round';
    Paint().paint(ctx, S, this.env);
    ctx.restore();
    return S;
  };

  /* ---------- 정적 렌더 (포스터·썸네일) ---------- */
  function renderStatic(ctx, w, h, opt) {
    const poseId = opt.pose, theme = opt.theme || 'opal';
    const clip = CLIPS[poseId] || CLIPS.arabesque;
    const u = opt.u == null ? 0.5 : opt.u;
    let pose = C.sampleClip(clip, u);
    if (opt.facing != null) pose = Object.assign({}, pose, { facing: opt.facing });
    const S = C.solve(pose);
    const s = Math.min(w / DESIGN_W, h / DESIGN_H) * (opt.fit || 1);
    const dpr = opt.dpr || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(w / 2, (h + DESIGN_H * s) / 2);
    ctx.scale(s, -s);
    ctx.lineJoin = 'round';
    Paint().paint(ctx, S, { theme: theme, time: opt.time || 0, blink: 0, hairSway: 0, tutuLift: 0, tutuSway: 0, debug: opt.debug });
    ctx.restore();
  }

  /* ---------- RAF ---------- */
  const live = [];
  let raf = 0, lastTs = 0;

  function visible(r) {
    const c = r.canvas;
    if (!c || !c.isConnected) return false;
    const rect = c.getBoundingClientRect();
    return rect.width > 2 && rect.height > 2 && rect.bottom > -80 && rect.top < (global.innerHeight || 900) + 80;
  }

  function tick(ts) {
    raf = 0;
    const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
    lastTs = ts;
    let any = false;
    for (let i = 0; i < live.length; i++) {
      const r = live[i];
      if (r.mode === 'manual' || r.paused) continue;
      if (!r.canvas || !r.canvas.isConnected) { live.splice(i, 1); i--; continue; }
      any = true;
      if (!visible(r)) continue;
      if (r.fps && ts - r.lastDraw < 1000 / r.fps) continue;
      r.lastDraw = ts;
      if (r.w !== r.canvas.clientWidth || r.h !== r.canvas.clientHeight) r.resize();
      r.render(ts - r.t0, dt);
    }
    if (any && !raf) raf = requestAnimationFrame(tick);
  }
  function kick() { if (!raf) { lastTs = 0; raf = requestAnimationFrame(tick); } }

  function create(canvas, opts) {
    const r = new Rig(canvas, opts);
    r.t0 = performance.now();
    live.push(r);
    kick();
    return r;
  }
  function destroy(r) {
    const i = live.indexOf(r);
    if (i >= 0) live.splice(i, 1);
  }
  function refresh() { kick(); }
  function resizeAll() { live.forEach(function (r) { r.resize(); }); }
  global.addEventListener('resize', resizeAll);

  const APEX = {
    plie: 0.24, tendu: 0.42, passe: 0.52, arabesque: 0.56, attitude: 0.56,
    pirouette: 0.27, pasdechat: 0.42, grandjete: 0.44, echappe: 0.48, reverence: 0.5
  };

  global.SugarRig = {
    create: create, destroy: destroy, refresh: refresh,
    renderStatic: renderStatic, buildShow: buildShow, showPoseAt: showPoseAt,
    CLIPS: CLIPS, THEMES: C.THEMES, SEG: SEG, INTRO: INTRO, FINALE: FINALE, APEX: APEX,
    poseTime: function (id) { const c = CLIPS[id]; return c ? c.dur : 3000; }
  };
})(typeof window !== 'undefined' ? window : this);
