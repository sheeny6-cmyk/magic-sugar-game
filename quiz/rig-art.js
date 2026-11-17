/* =========================================================
   마법 슈가 — 파츠 렌더러 (rig-art.js)
   Canvas 2D · 부드러운 선 · 피부 음영 · 오팔 튜튀 · 표정
   ========================================================= */
(function (global) {
  'use strict';
  const C = global.SugarRigCore;
  const V = C.V, TAU = C.TAU, PI = C.PI, clamp = C.clamp, lerp = C.lerp;
  const THEMES = C.THEMES, HEAD_R = C.constants.HEAD_R;

  function makeProj(facing) {
    const c = Math.cos(facing), s = Math.sin(facing);
    return function (p) {
      return { x: p.x * c + p.z * s, y: p.y, d: -p.x * s + p.z * c };
    };
  }
  function ell(ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, TAU);
  }
  function star4(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = i * PI / 2;
      ctx.lineTo(x + Math.cos(a) * r * 2.1, y + Math.sin(a) * r * 2.1);
      ctx.lineTo(x + Math.cos(a + PI / 4) * r * 0.6, y + Math.sin(a + PI / 4) * r * 0.6);
    }
    ctx.closePath();
    ctx.fill();
  }
  function bez(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
    };
  }
  function bezD(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return {
      x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
      y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y)
    };
  }

  /* ---------- 띠(머리카락 한 가닥) ---------- */
  function ribbon(ctx, p0, p1, p2, p3, w0, wm, w1, fill, edge) {
    const N = 18, left = [], right = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const pt = bez(p0, p1, p2, p3, t);
      const d = bezD(p0, p1, p2, p3, t);
      const L = Math.hypot(d.x, d.y) || 1;
      const nx = -d.y / L, ny = d.x / L;
      const w = t < 0.5 ? lerp(w0, wm, t * 2) : lerp(wm, w1, (t - 0.5) * 2);
      left.push({ x: pt.x + nx * w / 2, y: pt.y + ny * w / 2 });
      right.push({ x: pt.x - nx * w / 2, y: pt.y - ny * w / 2 });
    }
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (let i = 1; i <= N; i++) ctx.lineTo(left[i].x, left[i].y);
    for (let i = N; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = 0.8; ctx.stroke(); }
  }

  /* ---------- 팔다리 관 ---------- */
  function tubePath(ctx, a, b, w0, w1, bulge) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const L = Math.hypot(dx, dy) || 1;
    const tx = dx / L, ty = dy / L;
    const nx = -ty, ny = tx;
    const r0 = w0 / 2, r1 = w1 / 2;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const bm = bulge || 0;
    ctx.beginPath();
    ctx.moveTo(a.x + nx * r0, a.y + ny * r0);
    ctx.quadraticCurveTo(mx + nx * ((r0 + r1) / 2 + bm) + tx * bm * 0.4, my + ny * ((r0 + r1) / 2 + bm) + ty * bm * 0.4, b.x + nx * r1, b.y + ny * r1);
    ctx.quadraticCurveTo(b.x + tx * r1 * 1.15, b.y + ty * r1 * 1.15, b.x - nx * r1, b.y - ny * r1);
    ctx.quadraticCurveTo(mx - nx * ((r0 + r1) / 2 + bm) + tx * bm * 0.4, my - ny * ((r0 + r1) / 2 + bm) + ty * bm * 0.4, a.x - nx * r0, a.y - ny * r0);
    ctx.quadraticCurveTo(a.x - tx * r0 * 1.15, a.y - ty * r0 * 1.15, a.x + nx * r0, a.y + ny * r0);
    ctx.closePath();
    return { nx: nx, ny: ny, tx: tx, ty: ty, L: L };
  }

  function tube(ctx, a, b, w0, w1, col, opts) {
    opts = opts || {};
    const g = tubePath(ctx, a, b, w0, w1, opts.bulge || 0);
    const side = (g.nx * -0.62 + g.ny * 0.78) >= 0 ? 1 : -1;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const w = Math.max(w0, w1) * 0.6;
    const grd = ctx.createLinearGradient(mx + g.nx * w * side, my + g.ny * w * side, mx - g.nx * w * side, my - g.ny * w * side);
    grd.addColorStop(0, col[0]);
    grd.addColorStop(0.3, col[1]);
    grd.addColorStop(0.78, col[2]);
    grd.addColorStop(1, col[3] || col[2]);
    ctx.fillStyle = grd;
    ctx.fill();
    if (opts.outline !== false) {
      ctx.strokeStyle = opts.outlineColor || 'rgba(198,138,120,.30)';
      ctx.lineWidth = opts.outlineW || 0.9;
      ctx.stroke();
    }
    return g;
  }

  function joint(ctx, p, r, col, light, dark) {
    const grd = ctx.createRadialGradient(p.x - r * 0.3, p.y + r * 0.36, r * 0.08, p.x, p.y, r * 1.02);
    grd.addColorStop(0, light || col[0]);
    grd.addColorStop(0.55, col[1]);
    grd.addColorStop(1, dark || col[2]);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, TAU);
    ctx.fill();
  }

  /* ---------- 손 ---------- */
  function drawHand(ctx, wr, dir, kind, th) {
    const ang = Math.atan2(dir.y, dir.x);
    const len = kind === 'point' ? 16 : 13;
    const wid = kind === 'open' ? 9.6 : 8.2;
    ctx.save();
    ctx.translate(wr.x, wr.y);
    ctx.rotate(ang);
    const grd = ctx.createLinearGradient(0, -wid, 0, wid * 0.9);
    grd.addColorStop(0, th.skin[0]);
    grd.addColorStop(0.4, th.skin[1]);
    grd.addColorStop(1, th.skin[2]);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(-2.5, -wid * 0.46);
    ctx.quadraticCurveTo(len * 0.5, -wid * 0.6, len * 0.86, -wid * 0.34);
    if (kind === 'point') {
      ctx.quadraticCurveTo(len * 1.06, -wid * 0.06, len, wid * 0.14);
      ctx.quadraticCurveTo(len * 0.88, wid * 0.34, len * 0.6, wid * 0.42);
    } else if (kind === 'open') {
      ctx.quadraticCurveTo(len * 1.1, wid * 0.12, len * 0.98, wid * 0.5);
      ctx.quadraticCurveTo(len * 0.7, wid * 0.78, len * 0.3, wid * 0.6);
    } else {
      ctx.quadraticCurveTo(len * 1.0, wid * 0.3, len * 0.82, wid * 0.56);
      ctx.quadraticCurveTo(len * 0.5, wid * 0.72, -2.5, wid * 0.48);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(198,138,120,.28)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // 손가락 결
    ctx.strokeStyle = 'rgba(206,146,126,.2)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(len * 0.46, -wid * 0.32); ctx.lineTo(len * 0.52, wid * 0.42);
    ctx.moveTo(len * 0.7, -wid * 0.24); ctx.lineTo(len * 0.74, wid * 0.34);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- 발레 슈즈 ---------- */
  function drawShoe(ctx, ankle, toe, th) {
    const dx = toe.x - ankle.x, dy = toe.y - ankle.y;
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const w0 = 13.5, w1 = 8.2;
    ctx.beginPath();
    ctx.moveTo(ankle.x + nx * w0 * 0.5, ankle.y + ny * w0 * 0.5 + 1.2);
    ctx.quadraticCurveTo(ankle.x + dx * 0.56 + nx * w1 * 0.62, ankle.y + dy * 0.56 + ny * w1 * 0.62,
      toe.x + nx * w1 * 0.44, toe.y + ny * w1 * 0.44);
    ctx.quadraticCurveTo(toe.x + dx * 0.2, toe.y + dy * 0.2, toe.x - nx * w1 * 0.46, toe.y - ny * w1 * 0.46);
    ctx.quadraticCurveTo(ankle.x + dx * 0.56 - nx * w1 * 0.68, ankle.y + dy * 0.56 - ny * w1 * 0.68,
      ankle.x - nx * w0 * 0.5, ankle.y - ny * w0 * 0.5 + 1.2);
    ctx.closePath();
    const mx = (ankle.x + toe.x) / 2, my = (ankle.y + toe.y) / 2;
    const grd = ctx.createLinearGradient(mx + nx * 8, my + ny * 8, mx - nx * 8, my - ny * 8);
    grd.addColorStop(0, th.shoe[2]);
    grd.addColorStop(0.3, th.shoe[0]);
    grd.addColorStop(0.8, th.shoe[1]);
    grd.addColorStop(1, th.shoe[3]);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = C.rgba(th.shoe[3], 0.42);
    ctx.lineWidth = 0.7;
    ctx.stroke();
    // 토 캡
    ctx.fillStyle = C.rgba(th.shoe[3], 0.3);
    ell(ctx, toe.x - dx * 0.05, toe.y - dy * 0.05, 2.8, 2.4, Math.atan2(dy, dx));
    ctx.fill();
    // 발등 리본
    ctx.strokeStyle = C.rgba(th.ribbon, 0.9);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(lerp(ankle.x, toe.x, 0.12) + nx * 6.4, lerp(ankle.y, toe.y, 0.12) + ny * 6.4);
    ctx.lineTo(lerp(ankle.x, toe.x, 0.12) - nx * 6.4, lerp(ankle.y, toe.y, 0.12) - ny * 6.4);
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(lerp(ankle.x, toe.x, 0.38) + nx * 5.6, lerp(ankle.y, toe.y, 0.38) + ny * 5.6);
    ctx.lineTo(lerp(ankle.x, toe.x, 0.42) - nx * 5.6, lerp(ankle.y, toe.y, 0.42) - ny * 5.6);
    ctx.stroke();
    // 발목 리본 매듭
    ctx.fillStyle = C.rgba(th.ribbon, 0.95);
    ell(ctx, lerp(ankle.x, toe.x, 0.06) + nx * 5, lerp(ankle.y, toe.y, 0.06) + ny * 5, 2.2, 1.6, 0.4);
    ctx.fill();
  }

  /* ---------- 다리 ---------- */
  function drawLeg(ctx, L, pr, th) {
    const hip = pr(L.hip), knee = pr(L.knee), ankle = pr(L.ankle), toe = pr(L.toe);
    // 허벅지
    tube(ctx, hip, knee, 22, 15, th.skin, { bulge: 1.4 });
    joint(ctx, knee, 6.6, th.skin, th.skin[0]);
    // 종아리 (살짝 볼록)
    tube(ctx, knee, ankle, 14, 8.6, th.skin, { bulge: 1.2 });
    // 발등
    tube(ctx, ankle, toe, 8.6, 5, th.skin);
    drawShoe(ctx, ankle, toe, th);
    // 무릎 하이라이트
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = 'rgba(255,255,255,.6)';
    ctx.lineWidth = 1.6;
    const mx = lerp(hip.x, knee.x, 0.72), my = lerp(hip.y, knee.y, 0.72);
    ctx.beginPath();
    ctx.moveTo(mx - 3, my - 1);
    ctx.quadraticCurveTo(mx - 1, my - 5, mx + 3, my - 3);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- 팔 ---------- */
  function drawArm(ctx, A, pr, th) {
    const sh = pr(A.shoulder), el = pr(A.elbow), wr = pr(A.wrist);
    const dirP = { x: wr.x - el.x, y: wr.y - el.y };
    const dl = Math.hypot(dirP.x, dirP.y) || 1;
    const shIn = { x: sh.x + (el.x - sh.x) * -0.14, y: sh.y + (el.y - sh.y) * -0.14 };
    tube(ctx, shIn, el, 15.5, 10.4, th.skin, { bulge: 0.8 });
    joint(ctx, el, 5.4, th.skin, th.skin[0]);
    tube(ctx, el, wr, 10.2, 7.6, th.skin, { bulge: 0.5 });
    drawHand(ctx, wr, { x: dirP.x / dl, y: dirP.y / dl }, A.hand, th);
  }

  /* ---------- 몸통 ---------- */
  function torsoPath(ctx, S, pr) {
    const hp = pr(S.pelvis);
    const ezv = S.B.ez;
    const dW = 0.55 + 0.45 * Math.abs(Math.cos(S.pose.facing));
    const hipA0 = pr(V.add(S.hipA, V.mul(ezv, 7)));
    const hipB0 = pr(V.add(S.hipB, V.mul(ezv, -7)));
    const shA0 = pr(V.add(S.shoulderA, V.mul(ezv, 10)));
    const shB0 = pr(V.add(S.shoulderB, V.mul(ezv, -10)));
    const wK = 1;
    const hipA = { x: hp.x + (hipA0.x - hp.x) * wK + 0, y: hipA0.y };
    const hipB = { x: hp.x + (hipB0.x - hp.x) * wK, y: hipB0.y };
    const shA = { x: hp.x + (shA0.x - hp.x) * wK, y: shA0.y };
    const shB = { x: hp.x + (shB0.x - hp.x) * wK, y: shB0.y };
    const nbA = pr(V.add(S.neckBase, V.mul(S.B.ex, 7)));
    const nbB = pr(V.add(S.neckBase, V.mul(S.B.ex, -7)));
    const nA = { x: lerp(hipA.x, shA.x, 0.46), y: lerp(hipA.y, shA.y, 0.46) };
    const nB = { x: lerp(hipB.x, shB.x, 0.46), y: lerp(hipB.y, shB.y, 0.46) };
    nA.x += (0 - nA.x) * 0.22; nB.x += (0 - nB.x) * 0.22;
    ctx.beginPath();
    ctx.moveTo(hipA.x, hipA.y - 12);
    ctx.quadraticCurveTo(hipA.x - 4, hipA.y + 12, nA.x - 1, nA.y);
    ctx.quadraticCurveTo(nA.x + 2, lerp(nA.y, shA.y, 0.62), shA.x - 7, shA.y + 1);
    ctx.quadraticCurveTo(shA.x + 3, shA.y + 7, shA.x + 9, shA.y + 3);
    ctx.lineTo(nbA.x, nbA.y - 4);
    ctx.lineTo(nbB.x, nbB.y - 4);
    ctx.lineTo(shB.x - 9, shB.y + 3);
    ctx.quadraticCurveTo(shB.x - 3, shB.y + 7, shB.x + 7, shB.y + 1);
    ctx.quadraticCurveTo(nB.x - 2, lerp(nB.y, shB.y, 0.62), nB.x + 1, nB.y);
    ctx.quadraticCurveTo(hipB.x + 4, hipB.y + 12, hipB.x, hipB.y - 12);
    ctx.quadraticCurveTo(0, Math.min(hipA.y, hipB.y) - 22, hipA.x, hipA.y - 12);
    ctx.closePath();
  }

  function drawTorso(ctx, S, pr, th, env) {
    const hipA = pr(S.hipA), hipB = pr(S.hipB);
    const ch = pr(S.chest);
    torsoPath(ctx, S, pr);
    const g = ctx.createLinearGradient(hipA.x - 26, hipA.y, hipB.x + 26, ch.y);
    g.addColorStop(0, th.skin[1]);
    g.addColorStop(0.4, th.skin[0]);
    g.addColorStop(1, th.skin[2]);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(198,138,120,.26)';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    ctx.save();
    torsoPath(ctx, S, pr);
    ctx.clip();
    // 레오타드
    const nb = pr(V.add(S.neckBase, V.mul(S.B.ey, -4)));
    const topY = ch.y + 7;
    const xL = -60, xR = 60;
    const bodyG = ctx.createLinearGradient(0, hipA.y - 14, 0, topY);
    bodyG.addColorStop(0, th.bodice[0]);
    bodyG.addColorStop(0.5, th.bodice[2]);
    bodyG.addColorStop(1, th.bodice[1]);
    ctx.beginPath();
    ctx.moveTo(xL, topY - 26);
    ctx.quadraticCurveTo(xL * 0.55, topY + 8, -13, topY + 1);
    ctx.quadraticCurveTo(0, topY - 9, 13, topY + 1);
    ctx.quadraticCurveTo(xR * 0.55, topY + 8, xR, topY - 26);
    ctx.lineTo(xR, topY - 160);
    ctx.lineTo(xL, topY - 160);
    ctx.closePath();
    ctx.fillStyle = bodyG;
    ctx.fill();
    // 가슴 결
    ctx.strokeStyle = C.rgba(th.bodiceDeep, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-20, topY - 12);
    ctx.quadraticCurveTo(-13, topY - 4, -4, topY - 12);
    ctx.moveTo(20, topY - 12);
    ctx.quadraticCurveTo(13, topY - 4, 4, topY - 12);
    ctx.stroke();
    // 옆선 음영
    const sideG = ctx.createLinearGradient(hipA.x - 12, 0, hipA.x + 22, 0);
    sideG.addColorStop(0, C.rgba(th.bodiceDeep, 0.24));
    sideG.addColorStop(1, C.rgba(th.bodiceDeep, 0));
    ctx.fillStyle = sideG;
    ctx.fillRect(hipA.x - 26, hipA.y - 30, 44, nb.y - hipA.y + 40);
    const sideG2 = ctx.createLinearGradient(hipB.x + 12, 0, hipB.x - 22, 0);
    sideG2.addColorStop(0, C.rgba(th.bodiceDeep, 0.24));
    sideG2.addColorStop(1, C.rgba(th.bodiceDeep, 0));
    ctx.fillStyle = sideG2;
    ctx.fillRect(hipB.x - 18, hipA.y - 30, 44, nb.y - hipA.y + 40);
    // 은은한 하이라이트
    const hl = ctx.createLinearGradient(0, topY - 80, 0, topY - 10);
    hl.addColorStop(0, 'rgba(255,255,255,0)');
    hl.addColorStop(1, 'rgba(255,255,255,.5)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.moveTo(-26, topY - 8);
    ctx.quadraticCurveTo(0, topY + 2, 26, topY - 8);
    ctx.lineTo(20, topY - 30);
    ctx.quadraticCurveTo(0, topY - 18, -20, topY - 30);
    ctx.closePath();
    ctx.fill();
    // 목선 테두리
    ctx.strokeStyle = C.rgba(th.trim, 0.85);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xL, topY - 26);
    ctx.quadraticCurveTo(xL * 0.55, topY + 8, -13, topY + 1);
    ctx.quadraticCurveTo(0, topY - 9, 13, topY + 1);
    ctx.quadraticCurveTo(xR * 0.55, topY + 8, xR, topY - 26);
    ctx.stroke();
    // 오팔 보석
    const spots = [[-9, topY - 6, 2.4], [0, topY + 0.5, 2.7], [9, topY - 6, 2.4], [-4, topY - 20, 1.8], [5, topY - 22, 1.8], [0, topY - 40, 1.5], [-7, topY - 56, 1.3]];
    ctx.fillStyle = C.rgba(th.bead, 0.95);
    for (let i = 0; i < spots.length; i++) star4(ctx, spots[i][0], spots[i][1], spots[i][2]);
    ctx.restore();

    // 어깨끈
    ctx.strokeStyle = C.rgba(th.trim, 0.95);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const sA = pr(V.add(S.shoulderA, V.mul(S.B.ey, 5)));
    const sB = pr(V.add(S.shoulderB, V.mul(S.B.ey, 5)));
    ctx.beginPath();
    ctx.moveTo(sA.x, sA.y); ctx.lineTo(-13, topY + 1);
    ctx.moveTo(sB.x, sB.y); ctx.lineTo(13, topY + 1);
    ctx.stroke();

    // 허리 장식
    const waist = pr(V.add(S.pelvis, V.mul(S.B.ey, 4)));
    ctx.strokeStyle = C.rgba(th.trim, 0.55);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(waist.x - 18, waist.y + 3);
    ctx.quadraticCurveTo(waist.x, waist.y - 2, waist.x + 18, waist.y + 3);
    ctx.stroke();
  }

  /* ---------- 튜튀 ---------- */
  function drawTutu(ctx, S, pr, th, env) {
    const pel = S.pelvis;
    const ex = S.B.ex, ez = S.B.ez;
    const t = env.time || 0;
    const layers = [
      { r: 90, yo: 0, hangF: 14, hangB: 50, a: 0.46, col: 0, petal: 7, wa: 30 },
      { r: 82, yo: 3, hangF: 12, hangB: 42, a: 0.46, col: 1, petal: 8, wa: 29 },
      { r: 73, yo: 6, hangF: 10, hangB: 35, a: 0.5, col: 2, petal: 7, wa: 28 },
      { r: 62, yo: 8, hangF: 8, hangB: 27, a: 0.52, col: 3, petal: 8, wa: 27 },
      { r: 51, yo: 10, hangF: 6, hangB: 20, a: 0.5, col: 0, petal: 6, wa: 26 }
    ];
    const sway = env.tutuSway || 0;
    const lift = env.tutuLift || 0;
    const camDir = V.m(-Math.sin(S.pose.facing), 0, Math.cos(S.pose.facing));
    const light = V.norm(V.m(-0.45, 0.75, 0.55));

    for (let li = layers.length - 1; li >= 0; li--) {
      const Ly = layers[li];
      const N = 44;
      const quads = [];
      for (let i = 0; i < N; i++) {
        const a = i / N * TAU;
        const a2 = (i + 1) / N * TAU;
        const petalOf = function (x) { return 1 + 0.075 * Math.pow(Math.abs(Math.sin(x * Ly.petal / 2 + 0.4)), 0.7); };
        const wob = petalOf(a), wob2 = petalOf(a2);
        const flut = Math.sin(a * 4 + t * 3.0) * 1.9 + sway * Math.sin(a) * 0.9;
        const flut2 = Math.sin(a2 * 4 + t * 3.0) * 1.9 + sway * Math.sin(a2) * 0.9;
        const hang = Ly.hangF + Ly.hangB * (0.5 - 0.5 * Math.cos(a)) + 9 * Math.abs(Math.sin(a));
        const hang2 = Ly.hangF + Ly.hangB * (0.5 - 0.5 * Math.cos(a2)) + 9 * Math.abs(Math.sin(a2));
        const wl = function (ang, rr, yy) {
          return V.add(pel, V.add(V.mul(ex, rr * Math.sin(ang)), V.add(V.mul(ez, rr * Math.cos(ang)), V.m(0, yy, 0))));
        };
        const w1 = wl(a, Ly.wa, 12);
        const w2 = wl(a2, Ly.wa, 12);
        const r1 = wl(a, Ly.r * wob, Ly.yo - hang + flut + lift * (0.5 + 0.5 * Math.sin(a)));
        const r2 = wl(a2, Ly.r * wob2, Ly.yo - hang2 + flut2 + lift * (0.5 + 0.5 * Math.sin(a2)));
        const depth = (pr(w1).d + pr(w2).d + pr(r1).d + pr(r2).d) / 4;
        quads.push({ d: depth, w1: pr(w1), w2: pr(w2), r1: pr(r1), r2: pr(r2), a: (a + a2) / 2 });
      }
      quads.sort(function (p, q) { return p.d - q.d; });
      for (let q = 0; q < quads.length; q++) {
        const Q = quads[q];
        const midA = Q.a;
        // 법선 근사: 원통 바깥 방향
        const nx = Math.sin(midA) * Math.cos(S.pose.facing) + Math.cos(midA) * Math.sin(S.pose.facing) * 0;
        const shade = 0.5 + 0.5 * Math.sin(midA) * -0.5;
        const base = th.skirt[Ly.col];
        ctx.beginPath();
        ctx.moveTo(Q.w1.x, Q.w1.y);
        ctx.lineTo(Q.r1.x, Q.r1.y);
        ctx.lineTo(Q.r2.x, Q.r2.y);
        ctx.lineTo(Q.w2.x, Q.w2.y);
        ctx.closePath();
        const g = ctx.createLinearGradient(Q.w1.x, Q.w1.y, Q.r1.x, Q.r1.y);
        g.addColorStop(0, C.rgba(base, Ly.a * 0.55));
        g.addColorStop(0.45, C.rgba(base, Ly.a));
        g.addColorStop(1, C.rgba(base, Ly.a * 0.72));
        ctx.fillStyle = g;
        ctx.fill();
        if (q % 2 === 0) {
          ctx.strokeStyle = 'rgba(255,255,255,.16)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
      // 밑단 라인
      ctx.beginPath();
      let first = true;
      for (let i = 0; i <= N; i++) {
        const a = i / N * TAU;
        const petalOf = 1 + 0.075 * Math.pow(Math.abs(Math.sin(a * Ly.petal / 2 + 0.4)), 0.7);
        const flut = Math.sin(a * 4 + t * 3.0) * 1.9 + sway * Math.sin(a) * 0.9;
        const hang = Ly.hangF + Ly.hangB * (0.5 - 0.5 * Math.cos(a)) + 9 * Math.abs(Math.sin(a));
        const p3 = V.add(pel, V.add(V.mul(ex, Ly.r * petalOf * Math.sin(a)), V.add(V.mul(ez, Ly.r * petalOf * Math.cos(a)), V.m(0, Ly.yo - hang + flut + lift * (0.5 + 0.5 * Math.sin(a)), 0))));
        const p2 = pr(p3);
        if (first) { ctx.moveTo(p2.x, p2.y); first = false; } else ctx.lineTo(p2.x, p2.y);
      }
      ctx.strokeStyle = 'rgba(255,255,255,.42)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
    // 허리 요크
    const hip = pr(pel);
    const wy = pr(V.add(pel, V.m(0, 14, 0)));
    const wf = 0.8 + 0.2 * Math.abs(Math.cos(S.pose.facing));
    ctx.beginPath();
    ctx.ellipse(hip.x, wy.y - 3, 33 * wf, 11, 0, 0, TAU);
    const yg = ctx.createLinearGradient(0, wy.y - 14, 0, wy.y + 8);
    yg.addColorStop(0, C.rgba(th.bodice[0], 0.96));
    yg.addColorStop(1, C.rgba(th.bodice[0], 0.3));
    ctx.fillStyle = yg;
    ctx.fill();
    // 반짝이
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    for (let k = 0; k < 14; k++) {
      const a = k * 2.39996;
      const r = 32 + (k * 9) % 44;
      const p = pr(V.add(pel, V.add(V.mul(ex, r * Math.sin(a) * wf), V.add(V.mul(ez, r * Math.cos(a)), V.m(0, -20 - (k % 4) * 10, 0)))));
      ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(t * 2 + k));
      star4(ctx, p.x, p.y, 1.4);
    }
    ctx.restore();
  }

  /* ---------- 머리카락 ---------- */
  function hairColor(th, i) { return th.hair[clamp(i, 0, 3)]; }

  function hairBack(ctx, S, pr, th, env) {
    const hc = S.head.c;
    const hp = pr(hc);
    const r = HEAD_R;
    const camDir = V.m(-Math.sin(S.pose.facing), 0, Math.cos(S.pose.facing));
    const faceDepth = V.dot(S.head.fwd, camDir);
    const backP = pr(V.sub(hc, V.mul(S.head.fwd, 24)));
    const sway = env.hairSway || 0;
    const t = env.time || 0;
    const cx = hp.x + (backP.x - hp.x) * 0.62;
    const top = hp.y + r * 1.06;
    const bottom = Math.min(S.chest.y + 8, hp.y + r * 3.6);
    const spread = 1.0 + 0.12 * Math.abs(faceDepth);
    const wave = Math.sin(t * 1.2) * 2.6 + sway;
    const w = r * 0.96 * spread;

    // 뒤쪽 큰 덩어리
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.28, top + 2);
    ctx.bezierCurveTo(cx - w * 0.92, top - r * 0.16, cx - w * 1.0, top - r * 0.95, cx - w * 1.0, top - r * 1.5);
    ctx.bezierCurveTo(cx - w * 1.42, top - r * 2.0, cx - w * 1.34 + wave * 0.5, bottom + 30, cx - w * 1.18 + wave, bottom + 16);
    ctx.quadraticCurveTo(cx - w * 0.86 + wave, bottom + 8, cx - w * 0.62 + wave * 0.7, bottom + 6);
    ctx.quadraticCurveTo(cx - w * 0.15 + wave * 0.3, bottom + 18, cx + w * 0.24 + wave * 0.3, bottom + 12);
    ctx.quadraticCurveTo(cx + w * 0.62 + wave * 0.7, bottom + 2, cx + w * 0.88 + wave, bottom + 14);
    ctx.quadraticCurveTo(cx + w * 1.18 + wave, bottom + 26, cx + w * 1.34 + wave * 0.5, bottom + 2);
    ctx.bezierCurveTo(cx + w * 1.42, top - r * 2.0, cx + w * 1.0, top - r * 0.95, cx + w * 1.02, top - r * 0.5);
    ctx.bezierCurveTo(cx + w * 0.92, top - r * 0.16, cx + w * 0.28, top + 2, cx, top + 4);
    ctx.closePath();
    const g = ctx.createLinearGradient(cx - w, top, cx + w * 0.6, bottom);
    g.addColorStop(0, th.hair[1]);
    g.addColorStop(0.3, th.hair[0]);
    g.addColorStop(0.65, th.hair[1]);
    g.addColorStop(1, th.hair[2]);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = C.rgba(th.hair[2], 0.3);
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 흐르는 결 (가닥)
    const locks = [
      { x0: -0.62, y0: 0.92, x1: -1.22, x2: -1.38, x3: -1.1, w: 0.42, tone: 0 },
      { x0: -0.15, y0: 1.0, x1: -0.72, x2: -0.95, x3: -0.72, w: 0.5, tone: 1 },
      { x0: 0.3, y0: 0.98, x1: 0.35, x2: 0.28, x3: 0.1, w: 0.55, tone: 0 },
      { x0: 0.68, y0: 0.86, x1: 1.05, x2: 1.25, x3: 1.02, w: 0.44, tone: 1 },
      { x0: -0.9, y0: 0.3, x1: -1.3, x2: -1.42, x3: -1.18, w: 0.38, tone: 2 }
    ];
    for (let i = 0; i < locks.length; i++) {
      const L = locks[i];
      const p0 = { x: cx + L.x0 * w, y: top - r * (1.0 - L.y0) - r * 0.1 };
      const p1 = { x: cx + L.x1 * w, y: top - r * 1.5 };
      const p2 = { x: cx + L.x2 * w + sway * 0.6, y: (top + bottom) / 2 };
      const p3 = { x: cx + L.x3 * w + sway, y: bottom + 24 };
      const col = i % 2 === 0 ? th.hair[3] : th.hair[0];
      ctx.save();
      ctx.globalAlpha = i % 2 === 0 ? 0.32 : 0.28;
      ribbon(ctx, p0, p1, p2, p3, w * L.w, w * L.w * 0.9, 2, col);
      ctx.restore();
    }
    // 하이라이트 결
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.strokeStyle = th.hair[3];
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.moveTo(cx + i * w * 0.5, top - r * 0.6);
      ctx.bezierCurveTo(cx + i * w * 0.86, top - r * 2.2, cx + i * w * 0.9 + sway * 0.5, bottom + 60, cx + i * w * 0.8 + sway, bottom + 20);
      ctx.stroke();
    }
    ctx.restore();
  }

  function bangs(ctx, S, pr, th, env) {
    const hp0 = pr(S.head.c);
    const r = HEAD_R;
    const t = env.time || 0;
    const hf = pr(S.head.fwd);
    const camDir = V.m(-Math.sin(S.pose.facing), 0, Math.cos(S.pose.facing));
    const fd = V.dot(S.head.fwd, camDir);
    const hp = { x: hp0.x + (hf.x - hp0.x) * 0.55, y: hp0.y };
    // 이마를 덮는 앞머리 (옆으로 넘긴 가르마)
    ctx.beginPath();
    ctx.moveTo(hp.x - r * 1.0, hp.y + r * 0.12);
    ctx.bezierCurveTo(hp.x - r * 1.05, hp.y + r * 0.72, hp.x - r * 0.72, hp.y + r * 1.1, hp.x - r * 0.18, hp.y + r * 1.12);
    ctx.bezierCurveTo(hp.x + r * 0.42, hp.y + r * 1.14, hp.x + r * 0.92, hp.y + r * 0.86, hp.x + r * 1.0, hp.y + r * 0.3);
    // 오른쪽 가장자리
    ctx.bezierCurveTo(hp.x + r * 0.96, hp.y + r * 0.18, hp.x + r * 0.86, hp.y + r * 0.14, hp.x + r * 0.8, hp.y + r * 0.2);
    // 가르마에서 흘러내리는 결
    ctx.bezierCurveTo(hp.x + r * 0.66, hp.y + r * 0.52, hp.x + r * 0.5, hp.y + r * 0.62, hp.x + r * 0.3, hp.y + r * 0.5);
    ctx.bezierCurveTo(hp.x + r * 0.34, hp.y + r * 0.34, hp.x + r * 0.3, hp.y + r * 0.2, hp.x + r * 0.18, hp.y + r * 0.16);
    ctx.bezierCurveTo(hp.x + r * 0.02, hp.y + r * 0.36, hp.x - r * 0.2, hp.y + r * 0.44, hp.x - r * 0.36, hp.y + r * 0.3);
    ctx.bezierCurveTo(hp.x - r * 0.44, hp.y + r * 0.52, hp.x - r * 0.66, hp.y + r * 0.56, hp.x - r * 0.78, hp.y + r * 0.36);
    ctx.bezierCurveTo(hp.x - r * 0.9, hp.y + r * 0.5, hp.x - r * 0.98, hp.y + r * 0.36, hp.x - r * 1.0, hp.y + r * 0.12);
    ctx.closePath();
    const g = ctx.createLinearGradient(hp.x - r, hp.y + r * 0.9, hp.x + r * 0.8, hp.y - r * 0.1);
    g.addColorStop(0, th.hair[1]);
    g.addColorStop(0.35, th.hair[0]);
    g.addColorStop(0.7, th.hair[3]);
    g.addColorStop(1, th.hair[1]);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = C.rgba(th.hair[2], 0.35);
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // 정수리 광택
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#ffe6cf';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(hp.x + r * 0.1, hp.y + r * 0.8, r * 0.46, r * 0.2, -0.3, PI * 0.1, PI * 0.92);
    ctx.stroke();
    ctx.restore();
    // 양옆으로 흐르는 머리 (얼굴 테두리)
    for (let s = -1; s <= 1; s += 2) {
      ctx.beginPath();
      ctx.moveTo(hp.x + s * r * 0.98, hp.y + r * 0.24);
      ctx.bezierCurveTo(hp.x + s * r * 1.1, hp.y - r * 0.1, hp.x + s * r * 1.14, hp.y - r * 0.65, hp.x + s * r * 0.98, hp.y - r * 1.02);
      ctx.bezierCurveTo(hp.x + s * r * 0.9, hp.y - r * 0.55, hp.x + s * r * 0.88, hp.y - r * 0.1, hp.x + s * r * 0.78, hp.y + r * 0.2);
      ctx.closePath();
      const sg = ctx.createLinearGradient(hp.x + s * r * 0.8, hp.y, hp.x + s * r * 1.15, hp.y - r);
      sg.addColorStop(0, th.hair[1]);
      sg.addColorStop(1, th.hair[3]);
      ctx.fillStyle = sg;
      ctx.fill();
    }
    // 얼굴 앞으로 흘러내리는 긴 머리 (어깨 위)
    for (let s = -1; s <= 1; s += 2) {
      const p0 = { x: hp.x + s * r * 0.95, y: hp.y + r * 0.05 };
      const p1 = { x: hp.x + s * r * 1.22, y: hp.y - r * 1.1 };
      const p2 = { x: hp.x + s * r * 1.3 + Math.sin(t + s) * 1.2, y: hp.y - r * 2.0 };
      const p3 = { x: hp.x + s * r * 1.12, y: hp.y - r * 2.7 };
      ctx.save();
      ctx.globalAlpha = 0.96;
      ribbon(ctx, p0, p1, p2, p3, r * 0.3, r * 0.34, 1.5, th.hair[1], C.rgba(th.hair[2], 0.25));
      ctx.restore();
    }
  }

  function braidAndPins(ctx, S, pr, th, env) {
    const hp = pr(S.head.c);
    const r = HEAD_R;
    const t = env.time || 0;
    const sway = (env.hairSway || 0) * 0.4 + Math.sin(t * 1.1) * 1.2;
    // 땋은 머리 — 왼쪽 관자놀이에서 아래로
    const sx = hp.x - r * 0.95, sy = hp.y + r * 0.34;
    for (let i = 0; i < 9; i++) {
      const k = i / 8;
      const x = sx - k * r * 0.3 - Math.sin(k * 2.2) * r * 0.06 + sway * k * 0.6;
      const y = sy - k * r * 1.95;
      const rr = r * 0.155 * (1 - k * 0.35);
      const ang = 0.5 - k * 0.5;
      ctx.fillStyle = i % 2 ? th.hair[1] : th.hair[0];
      ell(ctx, x, y, rr * 1.05, rr * 0.78, ang);
      ctx.fill();
      ctx.strokeStyle = C.rgba(th.hair[3], 0.32);
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.strokeStyle = C.rgba(th.hair[2], 0.22);
      ctx.beginPath();
      ctx.arc(x, y, rr * 0.9, 0.4, 2.2);
      ctx.stroke();
    }
    ctx.fillStyle = C.rgba(th.ribbon, 0.92);
    ell(ctx, sx - r * 0.3 + sway * 0.8, sy - r * 1.98, 2.4, 1.6, 0.5);
    ctx.fill();
    // 달 · 별 핀 (오른쪽)
    const pinY = hp.y + r * 0.62;
    const pinX = hp.x + r * 0.5;
    const pinG = ctx.createLinearGradient(pinX - 10, pinY + 10, pinX + 12, pinY - 12);
    pinG.addColorStop(0, '#ffe3f2');
    pinG.addColorStop(0.5, '#d9f2f7');
    pinG.addColorStop(1, '#e7dcff');
    ctx.fillStyle = pinG;
    ctx.beginPath();
    ctx.arc(pinX, pinY, 7.4, PI * 0.34, PI * 1.66, true);
    ctx.arc(pinX + 2.4, pinY + 0.6, 5.6, PI * 1.5, PI * 0.5, false);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    const stars = [[pinX + 10, pinY - 9, 2.3], [pinX + 16, pinY - 2, 1.6], [pinX + 7, pinY - 15, 1.3], [pinX + 19, pinY - 11, 1.2]];
    for (let i = 0; i < stars.length; i++) star4(ctx, stars[i][0], stars[i][1], stars[i][2]);
  }

  /* ---------- 얼굴 ---------- */
  function drawFace(ctx, S, pr, th, env) {
    const hc = S.head.c;
    const hp = pr(hc);
    const r = HEAD_R;
    const camDir = V.m(-Math.sin(S.pose.facing), 0, Math.cos(S.pose.facing));
    const faceDepth = V.dot(S.head.fwd, camDir);
    if (faceDepth <= 0.02) return;
    const fs = clamp(faceDepth, 0.1, 1);
    const ex = S.head.side, up = S.head.up, fw = S.head.fwd;
    const F = function (fx, fy, fz) {
      return pr(V.add(hc, V.add(V.mul(ex, fx * r), V.add(V.mul(up, fy * r), V.mul(fw, fz * r)))));
    };
    const blink = env.blink || 0;
    const expr = S.pose.expr;
    const single = faceDepth < 0.55;
    const eyeX = 0.38, eyeY = -0.03, eyeZ = 0.9;
    const eL = F(-eyeX, eyeY, eyeZ), eR = F(eyeX, eyeY, eyeZ);
    const wEye = r * 0.30 * (0.5 + 0.5 * fs);
    const hEye = r * 0.33;
    // 프로필 방향 단위벡터 (2D)
    const hfP = pr(V.add(hc, V.mul(fw, r)));
    let dir2 = { x: hfP.x - hp.x, y: hfP.y - hp.y };
    const dl2 = Math.hypot(dir2.x, dir2.y) || 1;
    dir2 = { x: dir2.x / dl2, y: dir2.y / dl2 };
    if (single) {
      const k = 1 - fs;
      const mx = lerp((eL.x + eR.x) / 2, hp.x + dir2.x * r * 0.52, k * 0.9);
      const my = lerp((eL.y + eR.y) / 2, hp.y + dir2.y * r * 0.2, k * 0.9);
      drawEye(ctx, mx, my, wEye * 1.3 * (0.75 + 0.25 * fs), hEye * (0.9 + 0.1 * fs), th, expr, blink, dir2.x >= 0 ? 1 : -1, true);
    } else {
      drawEye(ctx, eL.x, eL.y, wEye, hEye, th, expr, expr === 'wink' ? 1 : blink, -1, false);
      drawEye(ctx, eR.x, eR.y, wEye, hEye, th, expr, blink, 1, false);
    }
    // 눈썹
    ctx.strokeStyle = C.rgba(th.hair[2], 0.8);
    ctx.lineWidth = Math.max(1.1, r * 0.05);
    ctx.lineCap = 'round';
    [-1, 1].forEach(function (s) {
      const b0 = F(s * (eyeX - 0.16), 0.32, eyeZ - 0.03);
      const b1 = F(s * (eyeX + 0.14), 0.36, eyeZ - 0.05);
      if (single && ((dir2.x >= 0 && s < 0) || (dir2.x < 0 && s > 0))) return;
      ctx.beginPath();
      ctx.moveTo(b0.x, b0.y);
      ctx.quadraticCurveTo((b0.x + b1.x) / 2, b1.y + r * 0.07, b1.x, b1.y);
      ctx.stroke();
    });
    // 볼터치
    [-1, 1].forEach(function (s) {
      if (single && ((dir2.x >= 0 && s < 0) || (dir2.x < 0 && s > 0))) return;
      const p = F(s * 0.6, -0.26, 0.6);
      const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, r * 0.3);
      g.addColorStop(0, 'rgba(255,132,168,.5)');
      g.addColorStop(1, 'rgba(255,132,168,0)');
      ctx.fillStyle = g;
      const bk = single ? 0.6 : 1;
      ell(ctx, p.x, p.y, r * 0.34 * bk, r * 0.2 * bk, -0.15);
      ctx.fill();
    });
    // 코
    const nose = F(0.03, -0.24, 0.97);
    ctx.strokeStyle = 'rgba(214,150,132,.55)';
    ctx.lineWidth = Math.max(0.9, r * 0.035);
    ctx.beginPath();
    ctx.moveTo(nose.x - r * 0.05, nose.y + r * 0.02);
    ctx.quadraticCurveTo(nose.x, nose.y - r * 0.035, nose.x + r * 0.04, nose.y + r * 0.005);
    ctx.stroke();
    // 입
    const mouth = single
      ? { x: lerp(F(0, -0.52, 0.84).x, hp.x + dir2.x * r * 0.34, (1 - fs) * 0.9), y: lerp(F(0, -0.52, 0.84).y, hp.y + dir2.y * r * 0.34 + r * 0.38, (1 - fs) * 0.9) }
      : F(0, -0.52, 0.84);
    const mw = r * 0.17;
    ctx.strokeStyle = 'rgba(198,96,112,.9)';
    ctx.lineWidth = Math.max(1, r * (single ? 0.035 : 0.045));
    ctx.beginPath();
    if (expr === 'smile') {
      const mw2 = single ? mw * 0.72 : mw;
      ctx.moveTo(mouth.x - mw2, mouth.y + r * 0.035);
      ctx.quadraticCurveTo(mouth.x, mouth.y - r * 0.12, mouth.x + mw2, mouth.y + r * 0.035);
      ctx.stroke();
      ctx.fillStyle = 'rgba(214,116,130,' + (single ? '0.3' : '0.5') + ')';
      ctx.beginPath();
      ctx.moveTo(mouth.x - mw * 0.6, mouth.y + r * 0.012);
      ctx.quadraticCurveTo(mouth.x, mouth.y - r * 0.085, mouth.x + mw * 0.6, mouth.y + r * 0.012);
      ctx.quadraticCurveTo(mouth.x, mouth.y + r * 0.07, mouth.x - mw * 0.6, mouth.y + r * 0.012);
      ctx.fill();
    } else if (expr === 'focus') {
      ctx.moveTo(mouth.x - mw * 0.62, mouth.y);
      ctx.quadraticCurveTo(mouth.x, mouth.y - r * 0.03, mouth.x + mw * 0.62, mouth.y);
      ctx.stroke();
    } else {
      ctx.moveTo(mouth.x - mw * 0.75, mouth.y + r * 0.02);
      ctx.quadraticCurveTo(mouth.x, mouth.y - r * 0.04, mouth.x + mw * 0.75, mouth.y + r * 0.02);
      ctx.stroke();
    }
  }

  function drawEye(ctx, cx, cy, w, h, th, expr, closeK, dir, profile) {
    const lash = 'rgba(74,42,28,.95)';
    if (closeK > 0.55) {
      ctx.strokeStyle = lash;
      ctx.lineWidth = Math.max(1.2, w * 0.17);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.8, cy + h * 0.12);
      ctx.quadraticCurveTo(cx, cy - h * 0.38, cx + w * 0.8, cy + h * 0.12);
      ctx.stroke();
      // 속눈썹
      ctx.lineWidth = Math.max(0.9, w * 0.07);
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.5, cy - h * 0.08);
      ctx.lineTo(cx - w * 0.62, cy - h * 0.22);
      ctx.moveTo(cx + w * 0.2, cy - h * 0.2);
      ctx.lineTo(cx + w * 0.3, cy - h * 0.36);
      ctx.stroke();
      return;
    }
    const k = 1 - closeK * 0.8;
    ctx.save();
    // 흰자
    ctx.beginPath();
    ctx.moveTo(cx - w, cy + h * 0.05);
    ctx.bezierCurveTo(cx - w * 0.85, cy + h * 1.02 * k, cx + w * 0.85, cy + h * 1.02 * k, cx + w, cy + h * 0.05);
    ctx.bezierCurveTo(cx + w * 0.82, cy - h * 0.9 * k, cx - w * 0.82, cy - h * 0.9 * k, cx - w, cy + h * 0.05);
    ctx.closePath();
    ctx.fillStyle = '#fffbfd';
    ctx.fill();
    ctx.save();
    ctx.clip();
    // 홍채
    const ig = ctx.createRadialGradient(cx - w * 0.18, cy + h * 0.2, w * 0.08, cx, cy + h * 0.05, w * 1.02);
    ig.addColorStop(0, '#b98248');
    ig.addColorStop(0.5, '#8a5326');
    ig.addColorStop(1, '#4e2c14');
    ctx.fillStyle = ig;
    ell(ctx, cx + dir * w * 0.05, cy + h * 0.02, w * 0.9, h * 1.0 * k);
    ctx.fill();
    // 동공
    ctx.fillStyle = 'rgba(46,26,14,.92)';
    ell(ctx, cx + dir * w * 0.05, cy + h * 0.02, w * 0.42, h * 0.5 * k);
    ctx.fill();
    // 홍채 테두리
    ctx.strokeStyle = 'rgba(58,34,18,.5)';
    ctx.lineWidth = Math.max(0.7, w * 0.05);
    ell(ctx, cx + dir * w * 0.05, cy + h * 0.02, w * 0.88, h * 0.98 * k);
    ctx.stroke();
    // 하이라이트
    ctx.fillStyle = 'rgba(255,255,255,.97)';
    ell(ctx, cx - w * 0.32, cy + h * 0.42 * k, w * 0.3, h * 0.26);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.72)';
    ell(ctx, cx + w * 0.42, cy - h * 0.34 * k, w * 0.15, h * 0.14);
    ctx.fill();
    // 아래 반사
    ctx.fillStyle = 'rgba(255,206,226,.55)';
    ell(ctx, cx - w * 0.05, cy - h * 0.55 * k, w * 0.45, h * 0.2);
    ctx.fill();
    ctx.restore();
    // 윗 눈꺼풀
    ctx.strokeStyle = lash;
    ctx.lineWidth = Math.max(1.5, w * 0.22);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - w * 1.02, cy + h * 0.1);
    ctx.quadraticCurveTo(cx - w * 0.3, cy + h * 1.22 * k, cx + w * 1.02, cy + h * 0.12);
    ctx.stroke();
    // 속눈썹 끝
    ctx.lineWidth = Math.max(1.1, w * 0.13);
    ctx.beginPath();
    ctx.moveTo(cx + dir * w * 0.98, cy + h * 0.12);
    ctx.quadraticCurveTo(cx + dir * w * 1.2, cy + h * 0.3, cx + dir * w * 1.26, cy + h * 0.06);
    ctx.stroke();
    // 아래 눈꺼풀
    ctx.strokeStyle = 'rgba(160,100,78,.38)';
    ctx.lineWidth = Math.max(0.7, w * 0.07);
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.72, cy - h * 0.9 * k);
    ctx.quadraticCurveTo(cx, cy - h * 1.04 * k, cx + w * 0.72, cy - h * 0.86 * k);
    ctx.stroke();
    // 쌍꺼풀
    ctx.strokeStyle = 'rgba(190,130,110,.3)';
    ctx.lineWidth = Math.max(0.6, w * 0.06);
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.7, cy + h * 1.2 * k);
    ctx.quadraticCurveTo(cx, cy + h * 1.7 * k, cx + w * 0.85, cy + h * 1.15 * k);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- 머리 ---------- */
  function drawHead(ctx, S, pr, th, env) {
    const hc = S.head.c;
    const hp = pr(hc);
    const r = HEAD_R;
    // 목
    const nb = pr(S.neckBase);
    const neckTop = { x: hp.x, y: hp.y - r * 0.74 };
    tube(ctx, { x: nb.x, y: nb.y + 1 }, neckTop, 17, 15, th.skin, { outlineColor: 'rgba(198,138,120,.22)' });
    // 목 그늘
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = th.skin[3];
    ell(ctx, hp.x, hp.y - r * 0.82, r * 0.42, r * 0.15, 0);
    ctx.fill();
    ctx.restore();
    // 얼굴형
    const hf = pr(S.head.fwd);
    const fdx = (hf.x - hp.x) * 0.16, fdy = 0;
    const fx = hp.x + fdx, fy = hp.y + fdy;
    ctx.beginPath();
    ctx.moveTo(fx, fy + r * 1.02);
    ctx.bezierCurveTo(fx + r * 0.62, fy + r * 1.0, fx + r * 0.99, fy + r * 0.5, fx + r * 0.98, fy + r * 0.04);
    ctx.bezierCurveTo(fx + r * 0.96, fy - r * 0.42, fx + r * 0.75, fy - r * 0.76, fx + r * 0.5, fy - r * 0.88);
    ctx.bezierCurveTo(fx + r * 0.3, fy - r * 0.97, fx + r * 0.14, fy - r * 1.0, fx, fy - r * 1.0);
    ctx.bezierCurveTo(fx - r * 0.14, fy - r * 1.0, fx - r * 0.3, fy - r * 0.97, fx - r * 0.5, fy - r * 0.88);
    ctx.bezierCurveTo(fx - r * 0.75, fy - r * 0.76, fx - r * 0.96, fy - r * 0.42, fx - r * 0.98, fy + r * 0.04);
    ctx.bezierCurveTo(fx - r * 0.99, fy + r * 0.5, fx - r * 0.62, fy + r * 1.0, fx, fy + r * 1.02);
    ctx.closePath();
    const g = ctx.createLinearGradient(fx - r, fy + r, fx + r * 0.55, fy - r);
    g.addColorStop(0, th.skin[0]);
    g.addColorStop(0.45, th.skin[1]);
    g.addColorStop(1, th.skin[2]);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(198,138,120,.3)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    // 귀
    const camD = V.m(-Math.sin(S.pose.facing), 0, Math.cos(S.pose.facing));
    const fdEar = V.dot(S.head.fwd, camD);
    [-1, 1].forEach(function (s) {
      if (fdEar < 0.2) return;
      const sideW = V.dot(S.head.side, camD) * s;
      if (sideW < -0.25) return;
      const p = pr(V.add(hc, V.add(V.mul(S.head.side, s * r * 0.94), V.mul(S.head.up, -r * 0.08))));
      ell(ctx, p.x + s * 1.4, p.y, r * 0.16, r * 0.23, s * 0.12);
      ctx.fillStyle = th.skin[1];
      ctx.fill();
      ctx.strokeStyle = 'rgba(198,138,120,.26)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ell(ctx, p.x + s * 1.4, p.y, r * 0.08, r * 0.12, s * 0.12);
      ctx.fillStyle = 'rgba(226,164,146,.5)';
      ctx.fill();
    });
    bangs(ctx, S, pr, th, env);
    drawFace(ctx, S, pr, th, env);
    braidAndPins(ctx, S, pr, th, env);
  }

  /* ---------- 전체 ---------- */
  function paint(ctx, S, env) {
    const th = THEMES[env.theme] || THEMES.opal;
    const pr = makeProj(S.pose.facing);
    const jobs = [];
    const camDir = V.m(-Math.sin(S.pose.facing), 0, Math.cos(S.pose.facing));
    const faceDepth = V.dot(S.head.fwd, camDir);

    jobs.push({
      d: pr(V.sub(S.head.c, V.mul(S.head.fwd, 22))).d - 2,
      fn: function () { hairBack(ctx, S, pr, th, env); }
    });
    ['A', 'B'].forEach(function (s) {
      const A = S.arms[s];
      const d = pr(A.wrist).d * 0.72 + pr(A.elbow).d * 0.28;
      jobs.push({ d: d, fn: function () { drawArm(ctx, A, pr, th); } });
    });
    // 뒤/앞 다리 판정: 카메라 기준 깊이(d)가 작으면 뒤 → 튜튀 뒤에, 크면 앞 → 튜튀 앞에
    ['A', 'B'].forEach(function (s) {
      const L = S.legs[s];
      const d = pr(L.ankle).d * 0.7 + pr(L.knee).d * 0.3;
      const front = d > 0.25;
      jobs.push({ d: front ? 0.8 : -0.6, fn: function () { drawLeg(ctx, L, pr, th); } });
    });
    jobs.push({ d: 0.2, fn: function () { drawTorso(ctx, S, pr, th, env); } });
    jobs.push({ d: 0.5, fn: function () { drawTutu(ctx, S, pr, th, env); } });
    jobs.push({ d: 999, fn: function () { drawHead(ctx, S, pr, th, env); } });

    jobs.sort(function (a, b) { return a.d - b.d; });
    for (let i = 0; i < jobs.length; i++) jobs[i].fn();
    if (env.debug) drawBones(ctx, S, pr);
  }

  function drawBones(ctx, S, pr) {
    const pts = [S.pelvis, S.chest, S.neckBase, S.head.c,
      S.shoulderA, S.arms.A.elbow, S.arms.A.wrist,
      S.shoulderB, S.arms.B.elbow, S.arms.B.wrist,
      S.hipA, S.legs.A.knee, S.legs.A.ankle, S.legs.A.toe,
      S.hipB, S.legs.B.knee, S.legs.B.ankle, S.legs.B.toe];
    ctx.save();
    ctx.strokeStyle = 'rgba(255,0,120,.55)';
    ctx.lineWidth = 1.2;
    const line = function (a, b) { const p = pr(a), q = pr(b); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); };
    line(S.pelvis, S.chest); line(S.chest, S.neckBase); line(S.neckBase, S.head.c);
    line(S.shoulderA, S.arms.A.elbow); line(S.arms.A.elbow, S.arms.A.wrist);
    line(S.shoulderB, S.arms.B.elbow); line(S.arms.B.elbow, S.arms.B.wrist);
    line(S.hipA, S.legs.A.knee); line(S.legs.A.knee, S.legs.A.ankle); line(S.legs.A.ankle, S.legs.A.toe);
    line(S.hipB, S.legs.B.knee); line(S.legs.B.knee, S.legs.B.ankle); line(S.legs.B.ankle, S.legs.B.toe);
    ctx.fillStyle = 'rgba(0,140,255,.9)';
    for (let i = 0; i < pts.length; i++) { const p = pr(pts[i]); ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  global.SugarRigPaint = { paint: paint, makeProj: makeProj };
})(typeof window !== 'undefined' ? window : this);
