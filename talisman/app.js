/* ═════════════════════════════════════════════════════════════
   ✨ 마법 슈가의 오늘의 소원 카드 — app.js
   · 하루 3장 무료 뽑기 + 무료 소진 후 리워드 광고(모의)로 한 장 더
   · 카드 3D 플립 + 반짝이 파티클 + 빛줄기
   · 1080×1920 인스타 스토리 PNG 저장 (Canvas)
   ═════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var TALISMANS = window.TALISMANS || [];
  var STORE_KEY = 'sugar-wishcard-v1';
  var LEGACY_KEY = 'sugar-talisman-v1';   // 예전 이름으로 저장된 값도 이어받는다
  var FREE_PER_DAY = 3;          // 하루 무료 뽑기 장수
  var pad = function (n) { return String(n).padStart(2, '0'); };

  var $ = function (id) { return document.getElementById(id); };
  var scene = $('scene');
  var wishlist = $('wishlist');
  var randomBtn = $('randomBtn');
  var quotaEl = $('quota');
  var sheet = $('sheet');
  var card = $('card');
  var cardImg = $('cardImg');
  var cardVideo = $('cardVideo');
  var cDate = $('cDate');
  var cTitle = $('cTitle');
  var cDance = $('cDance');
  var cWish = $('cWish');
  var cStars = $('cStars');
  var saveBtn = $('saveBtn');
  var adBtn = $('adBtn');
  var sheetQuotaEl = $('sheetQuota');
  var closeBtn = $('closeBtn');
  var adEl = $('ad');
  var adBar = $('adBar');
  var adCount = $('adCount');
  var toastEl = $('toast');
  var helpEl = $('help');

  var current = null;
  var busy = false;

  /* ── 오늘 날짜 / 저장 상태 ─────────────────────────────── */
  function ymd(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function ymdDot(d) {
    d = d || new Date();
    return d.getFullYear() + '. ' + (d.getMonth() + 1) + '. ' + d.getDate() + '.';
  }
  function weekdayKR(d) {
    return ['일', '월', '화', '수', '목', '금', '토'][(d || new Date()).getDay()] + '요일';
  }
  function loadState() {
    var today = ymd();
    var s = null;
    try { s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { s = null; }
    if (!s) { try { s = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null'); } catch (e) { s = null; } }
    if (!s || s.date !== today) {
      // 날짜가 바뀌면(자정 리셋) 무료 3장이 다시 채워진다
      s = { date: today, freeDrawn: 0, adCredits: 0, last: null, count: 0 };
    } else {
      // 예전 버전(하루 1장 · freeUsed true/false)의 저장값을 그대로 이어받는다
      if (typeof s.freeDrawn !== 'number') {
        s.freeDrawn = s.freeUsed ? 1 : 0;
        delete s.freeUsed;
      }
      s.adCredits = s.adCredits || 0;
      s.count = s.count || 0;
    }
    return s;
  }

  // 오늘 남은 무료 뽑기 장수
  function freeLeft() {
    return Math.max(0, FREE_PER_DAY - (state.freeDrawn || 0));
  }
  function saveState(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* 사생활 보호 모드 등 */ }
  }
  var state = loadState();

  /* ── 밤하늘 별 ─────────────────────────────────────────── */
  (function makeStars() {
    var box = $('stars');
    var html = '';
    for (var i = 0; i < 74; i++) {
      var size = Math.random() < 0.82 ? (Math.random() * 1.6 + 0.8) : (Math.random() * 2.2 + 2);
      html += '<i style="left:' + (Math.random() * 100).toFixed(2) + '%;top:' + (Math.random() * 100).toFixed(2) +
        '%;width:' + size.toFixed(1) + 'px;height:' + size.toFixed(1) + 'px;--d:' + (2.2 + Math.random() * 3.4).toFixed(1) +
        's;--delay:' + (Math.random() * 4).toFixed(1) + 's;--o:' + (0.35 + Math.random() * 0.5).toFixed(2) + '"></i>';
    }
    box.innerHTML = html;
  })();

  /* ── 소원 목록 ─────────────────────────────────────────── */
  TALISMANS.forEach(function (t, i) {
    var b = document.createElement('button');
    b.className = 'tile' + (i === TALISMANS.length - 1 && TALISMANS.length % 2 ? ' wide' : '');
    b.type = 'button';
    b.setAttribute('aria-label', t.title + ' 소원 카드 뽑기');
    b.innerHTML =
      '<span class="thumb"><img src="' + t.img + '" alt="" loading="eager" /></span>' +
      '<span class="meta"><span class="t-name"><span class="t-emoji">' + t.emoji + '</span> ' + t.title + '</span>' +
      '<span class="t-dance">' + t.dance + ' · ' + t.danceFr + '</span></span>';
    b.addEventListener('click', function () { requestDraw(t); });
    wishlist.appendChild(b);
  });

  /* ── 슈가의 한마디 (날짜별 한 줄) ──────────────────────── */
  (function dailyTip() {
    var lines = [
      '오늘은 작은 용기가 통하는 날이에요.',
      '잘 안 풀리는 일은 내일의 나에게 넘겨도 돼요.',
      '오늘의 나, 생각보다 꽤 반짝이고 있어요.',
      '한 번 쉬어 가도 괜찮아요. 그래도 소원 카드는 챙기고요.',
      '오늘 마주치는 사람은 다 착한 사람일 거예요.',
      '좋은 일은 조용히, 갑자기 찾아와요.',
      '오늘 하루도 무사히 — 그거면 충분해요.'
    ];
    var d = new Date();
    var start = new Date(d.getFullYear(), 0, 0);
    var day = Math.floor((d - start) / 86400000);
    var el = $('tipText');
    if (el) el.textContent = lines[day % lines.length];
  })();

  /* ── 남은 뽑기 표시 ────────────────────────────────────── */
  function refreshQuota() {
    var left = freeLeft();
    if (left > 0) {
      quotaEl.textContent = '오늘 무료 뽑기 ' + left + '장 남음 · ' + FREE_PER_DAY + '장 다 쓰면 광고 보면 한 장 더';
    } else if (state.adCredits > 0) {
      quotaEl.textContent = '광고 카드 ' + state.adCredits + '장 남음';
    } else {
      quotaEl.textContent = '오늘 무료 ' + FREE_PER_DAY + '장을 다 뽑았어요 · 광고 보면 한 장 더';
    }
  }

  // 결과 화면: 무료가 남았으면 광고 없이 한 장 더, 다 썼으면 광고 버튼
  function refreshSheetQuota() {
    if (!sheetQuotaEl) return;
    var left = freeLeft();
    if (left > 0) {
      sheetQuotaEl.textContent = '오늘 무료 ' + FREE_PER_DAY + '장 중 ' + state.freeDrawn + '장 사용 · ' + left + '장 남았어요';
      adBtn.innerHTML = '<span>✨</span> 무료로 한 장 더 (' + left + '장 남음)';
    } else {
      sheetQuotaEl.textContent = '오늘 무료 ' + FREE_PER_DAY + '장을 다 뽑았어요 · 광고 보면 한 장 더';
      adBtn.innerHTML = '<span>🎬</span> 광고 보고 한 장 더';
    }
  }

  /* ── 뽑기 요청 (무료 → 광고 → 추가) ───────────────────── */
  function requestDraw(t) {
    if (busy) return;
    if (freeLeft() > 0) {
      state.freeDrawn = (state.freeDrawn || 0) + 1;
      saveState(state);
      reveal(t);
      return;
    }
    if (state.adCredits > 0) {
      state.adCredits -= 1;
      saveState(state);
      reveal(t);
      return;
    }
    // 오늘 무료 3장을 다 쓴 경우 → 광고 모의를 거쳐 한 장 더
    playAd(function () {
      reveal(t);
    });
  }

  /* ── 결과 카드 채우기 + 플립 ───────────────────────────── */
  function reveal(t) {
    busy = true;
    current = t;
    state.last = t.id;
    state.count = (state.count || 0) + 1;
    saveState(state);
    refreshQuota();
    refreshSheetQuota();

    cardImg.src = t.img;
    cardImg.alt = '마법 슈가 ' + t.dance + ' 일러스트';

    // Google Flow 루프 영상이 준비되면 data.js의 video 값만 채우면 됩니다.
    if (t.video) {
      cardVideo.hidden = false;
      cardImg.style.display = 'none';
      cardVideo.src = t.video;
      cardVideo.play().catch(function () { /* 자동재생 차단 시 일러스트 유지 */ });
    } else {
      cardVideo.hidden = true;
      cardVideo.removeAttribute('src');
      cardImg.style.display = '';
    }

    cDate.textContent = ymdDot() + ' ' + weekdayKR();
    cTitle.textContent = t.emoji + ' ' + t.title;
    cDance.textContent = t.dance + ' · ' + t.danceFr;
    cWish.textContent = '“' + t.wish + '”';
    $('cEffect').textContent = t.effect;
    cStars.textContent = '★★★★★'.slice(0, t.stars) + '☆☆☆☆☆'.slice(0, 5 - t.stars);
    cWish.title = t.effect + ' ' + t.note;

    // 카드 뒷면에서 시작 → 앞면으로 플립
    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
    card.classList.remove('revealed');
    saveBtn.disabled = true;
    adBtn.disabled = true;

    startParticles();
    setTimeout(function () {
      card.classList.add('revealed');
      burst(46);
    }, 430);
    setTimeout(function () {
      busy = false;
      saveBtn.disabled = false;
      adBtn.disabled = false;
    }, 1250);
  }

  // 같은 카드가 연달아 나오지 않도록, 직전 카드는 빼고 뽑는다
  function pickRandom(excludeId) {
    var pool = TALISMANS.filter(function (x) { return x.id !== excludeId; });
    if (!pool.length) pool = TALISMANS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function closeSheet() {
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    stopParticles();
  }

  closeBtn.addEventListener('click', closeSheet);
  sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });

  randomBtn.addEventListener('click', function () {
    requestDraw(pickRandom(current && current.id));
  });

  adBtn.addEventListener('click', function () {
    if (busy) return;
    if (freeLeft() > 0) {                              // 아직 무료가 남았으면 광고 없이 한 장 더
      requestDraw(pickRandom(current && current.id));
      return;
    }
    playAd(function () {
      reveal(pickRandom(current && current.id));       // 무료를 다 쓴 뒤엔 광고 보고 한 장 더
      toast('광고 카드 도착! 한 장 더 뽑았어요 ✨');
    });
  });

  /* ── 광고 모의 (2초) ───────────────────────────────────── */
  function playAd(done) {
    busy = true;
    adEl.classList.add('open');
    adBar.style.width = '0%';
    adCount.textContent = '2';
    var start = performance.now();
    var dur = 2000;
    var raf = requestAnimationFrame(function step(now) {
      var p = Math.min(1, (now - start) / dur);
      adBar.style.width = (p * 100).toFixed(1) + '%';
      adCount.textContent = String(Math.max(0, Math.ceil((1 - p) * 2)));
      if (p < 1) requestAnimationFrame(step);
      else {
        adEl.classList.remove('open');
        busy = false;
        done();
      }
    });
  }

  /* ── 반짝이 파티클 ─────────────────────────────────────── */
  var pc = $('particles');
  var pctx = pc.getContext('2d');
  var parts = [], rafId = null, lastT = 0, spawnAcc = 0;

  function sizeParticles() {
    var r = pc.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    pc.width = Math.max(1, Math.round(r.width * dpr));
    pc.height = Math.max(1, Math.round(r.height * dpr));
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: r.width, h: r.height };
  }

  function addParticle(w, h, burstMode) {
    var colors = ['#ffe7b8', '#ffc9e2', '#ffffff', '#d9c4ff'];
    var cx = w / 2, cy = h * 0.42;
    var p = burstMode
      ? {
          x: cx + (Math.random() - 0.5) * 60,
          y: cy + (Math.random() - 0.5) * 90,
          vx: (Math.random() - 0.5) * 130,
          vy: (Math.random() - 0.5) * 130 - 30,
          life: 0,
          max: 1.4 + Math.random() * 1.1,
          r: 1.2 + Math.random() * 2.2,
          c: colors[(Math.random() * colors.length) | 0]
        }
      : {
          x: Math.random() * w,
          y: h + 20,
          vx: (Math.random() - 0.5) * 14,
          vy: -(10 + Math.random() * 26),
          life: 0,
          max: 3.4 + Math.random() * 3,
          r: 0.8 + Math.random() * 1.8,
          c: colors[(Math.random() * colors.length) | 0]
        };
    parts.push(p);
  }

  function sparkle(x, y, r, color, alpha) {
    pctx.save();
    pctx.translate(x, y);
    pctx.globalAlpha = alpha;
    pctx.fillStyle = color;
    pctx.beginPath();
    pctx.moveTo(0, -r * 2.1);
    pctx.quadraticCurveTo(r * 0.28, -r * 0.28, r * 2.1, 0);
    pctx.quadraticCurveTo(r * 0.28, r * 0.28, 0, r * 2.1);
    pctx.quadraticCurveTo(-r * 0.28, r * 0.28, -r * 2.1, 0);
    pctx.quadraticCurveTo(-r * 0.28, -r * 0.28, 0, -r * 2.1);
    pctx.fill();
    pctx.restore();
  }

  function startParticles() {
    var s = sizeParticles();
    parts = [];
    for (var i = 0; i < 26; i++) {
      addParticle(s.w, s.h, false);
      parts[parts.length - 1].y = Math.random() * s.h;
      parts[parts.length - 1].life = Math.random() * 2;
    }
    lastT = performance.now();
    if (!rafId) rafId = requestAnimationFrame(tick);
  }
  function stopParticles() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    parts = [];
    pctx.clearRect(0, 0, pc.width, pc.height);
  }
  function burst(n) {
    var s = sizeParticles();
    for (var i = 0; i < n; i++) addParticle(s.w, s.h, true);
  }

  function tick(now) {
    var s = { w: pc.width / Math.min(window.devicePixelRatio || 1, 2), h: pc.height / Math.min(window.devicePixelRatio || 1, 2) };
    var dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    pctx.clearRect(0, 0, s.w, s.h);

    spawnAcc += dt;
    if (spawnAcc > 0.16 && parts.length < 90) {
      addParticle(s.w, s.h, false);
      spawnAcc = 0;
    }

    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life += dt;
      if (p.life > p.max || p.y < -40 || p.x < -60 || p.x > s.w + 60) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.992;
      p.vy *= 0.992;
      var k = 1 - p.life / p.max;
      var a = Math.min(1, k * 1.7) * (0.65 + 0.35 * Math.sin(p.life * 7 + p.r * 9));
      sparkle(p.x, p.y, p.r, p.c, Math.max(0, a));
    }
    rafId = requestAnimationFrame(tick);
  }

  /* ── 이미지 · 텍스트 유틸 ──────────────────────────────── */
  function loadImage(src) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = rej;
      im.src = src;
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 자간을 직접 계산해 그리는 텍스트 (캔버스 letterSpacing 미지원 브라우저 대비)
  function tracked(ctx, text, cx, y, tracking, align) {
    var chars = Array.from(text);
    var widths = chars.map(function (c) { return ctx.measureText(c).width; });
    var total = widths.reduce(function (a, b) { return a + b; }, 0) + tracking * (chars.length - 1);
    var x = align === 'left' ? cx : cx - total / 2;
    var prevAlign = ctx.textAlign;
    ctx.textAlign = 'left';
    chars.forEach(function (c, i) {
      if (c !== ' ') ctx.fillText(c, x, y);   // 공백은 자리만 넘긴다
      x += widths[i] + tracking;
    });
    ctx.textAlign = prevAlign;
    return total;
  }

  function wrapLines(ctx, text, maxW) {
    var words = text.split(' ');
    var lines = [], cur = '';
    words.forEach(function (w) {
      var test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = test;
    });
    if (cur) lines.push(cur);
    // 한 단어가 너무 길면 글자 단위로 쪼갬
    var out = [];
    lines.forEach(function (line) {
      if (ctx.measureText(line).width <= maxW) { out.push(line); return; }
      var buf = '';
      Array.from(line).forEach(function (ch) {
        if (ctx.measureText(buf + ch).width > maxW && buf) { out.push(buf); buf = ch; }
        else buf += ch;
      });
      if (buf) out.push(buf);
    });
    return out;
  }

  // 두 줄로 나눌 때 가장 고르게 나뉘는 지점을 찾는다 (문장이 어색하게 끊기지 않도록)
  function balancedLines(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return [text];
    var words = text.split(' ');
    if (words.length < 2) return wrapLines(ctx, text, maxW);
    var best = null;
    for (var i = 1; i < words.length; i++) {
      var a = words.slice(0, i).join(' ');
      var b = words.slice(i).join(' ');
      var wa = ctx.measureText(a).width, wb = ctx.measureText(b).width;
      if (wa <= maxW && wb <= maxW) {
        var score = Math.abs(wa - wb);
        if (!best || score < best.score) best = { lines: [a, b], score: score };
      }
    }
    return best ? best.lines : wrapLines(ctx, text, maxW);
  }

  function drawStars(ctx, W, H, n, seed, skip) {
    var s = seed || 7;
    var rnd = function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (var i = 0; i < n; i++) {
      var x = rnd() * W, y = rnd() * H, r = rnd() * 1.9 + 0.5, a = 0.22 + rnd() * 0.6;
      // 글자 위에 별이 겹쳐 오타처럼 보이지 않도록 텍스트 영역은 비워 둔다
      var blocked = (skip || []).some(function (b) {
        return x > b[0] - 30 && x < b[2] + 30 && y > b[1] - 30 && y < b[3] + 30;
      });
      if (blocked) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      if (r > 1.8) {
        ctx.globalAlpha = a * 0.55;
        ctx.beginPath();
        ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ── 1080×1920 소원 카드 이미지 만들기 ────────────────── */
  async function buildShareImage(t) {
    var W = 1080, H = 1920;
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var ctx = c.getContext('2d');

    // 1) 밤하늘 배경
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1a1132');
    bg.addColorStop(0.34, '#2c1a4c');
    bg.addColorStop(0.72, '#3a2357');
    bg.addColorStop(1, '#1d1334');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 2) 빛무리
    var glow = ctx.createRadialGradient(540, 300, 0, 540, 300, 760);
    glow.addColorStop(0, 'rgba(255,186,224,.30)');
    glow.addColorStop(0.5, 'rgba(180,140,255,.12)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    var glow2 = ctx.createRadialGradient(540, 1560, 0, 540, 1560, 640);
    glow2.addColorStop(0, 'rgba(255,214,170,.16)');
    glow2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    drawStars(ctx, W, H, 150, 11, [[180, 1780, 900, 1870], [120, 60, 960, 320]]);

    // 3) 헤더
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'center';
    ctx.font = '500 32px "Noto Sans KR","Noto Sans CJK KR",sans-serif';
    ctx.fillStyle = 'rgba(226,206,255,.85)';
    tracked(ctx, '마법 슈가의', 540, 126, 12);

    var titleGrad = ctx.createLinearGradient(240, 0, 840, 0);
    titleGrad.addColorStop(0, '#ffe6bd');
    titleGrad.addColorStop(0.5, '#ffb9d6');
    titleGrad.addColorStop(1, '#d6c4ff');
    // 제목은 폭에 맞춰 글자 크기를 줄여 한 줄로 그린다
    var titleText = '오늘의 소원 카드';
    var titleSize = 96;
    do {
      ctx.font = '800 ' + titleSize + 'px "Noto Serif KR","Noto Serif CJK KR",serif';
      if (ctx.measureText(titleText).width <= 900) break;
      titleSize -= 4;
    } while (titleSize > 56);
    ctx.fillStyle = titleGrad;
    ctx.fillText(titleText, 540, 244);

    ctx.font = '500 30px "Noto Sans KR","Noto Sans CJK KR",sans-serif';
    ctx.fillStyle = 'rgba(206,186,236,.9)';
    tracked(ctx, ymdDot() + ' ' + weekdayKR(), 540, 300, 3);

    // 4) 소원 카드
    var card = { x: 90, y: 348, w: 900, h: 1360, r: 46 };
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.5)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 26;
    ctx.fillStyle = '#fdf6ee';
    roundRect(ctx, card.x, card.y, card.w, card.h, card.r);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,232,196,.95)';
    ctx.lineWidth = 3;
    roundRect(ctx, card.x + 1.5, card.y + 1.5, card.w - 3, card.h - 3, card.r);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(212,175,124,.55)';
    ctx.lineWidth = 2;
    roundRect(ctx, card.x + 16, card.y + 16, card.w - 32, card.h - 32, card.r - 12);
    ctx.stroke();

    // 5) 일러스트 (비율 유지 · 잘림 없음 · 패널이 87:100 이라 여백 없이 꽉 참)
    var art = { x: card.x + 36, y: card.y + 36, w: card.w - 72, h: 952 };
    var img = await loadImage(t.img);
    var scale = Math.min(art.w / img.width, art.h / img.height);
    var iw = img.width * scale, ih = img.height * scale;
    var ix = art.x + (art.w - iw) / 2, iy = art.y + (art.h - ih) / 2;
    ctx.save();
    roundRect(ctx, art.x, art.y, art.w, art.h, 24);
    ctx.clip();
    ctx.fillStyle = '#fdf6ee';
    ctx.fillRect(art.x, art.y, art.w, art.h);
    ctx.drawImage(img, ix, iy, iw, ih);
    ctx.restore();

    // 6) 텍스트 블록
    var cx = 540;
    var textTop = art.y + art.h;        // 1336

    ctx.font = '600 30px "Noto Sans KR","Noto Sans CJK KR",sans-serif';
    ctx.fillStyle = '#9a7fb0';
    tracked(ctx, t.dance + ' · ' + t.danceFr.toUpperCase(), cx, textTop + 52, 2);

    ctx.font = '800 60px "Noto Sans KR","Noto Sans CJK KR",sans-serif';
    ctx.fillStyle = '#33223f';
    ctx.fillText(t.emoji + ' ' + t.title, cx, textTop + 120);

    // 소원 문장: 최대 2줄, 넘치면 글씨를 줄여서 맞춤
    var wishMax = 790, size = 40, lines = [];
    do {
      ctx.font = '400 ' + size + 'px "Noto Serif KR","Noto Serif CJK KR",serif';
      lines = balancedLines(ctx, '“' + t.wish + '”', wishMax);
      if (lines.length <= 2) break;
      size -= 2;
    } while (size > 26);
    ctx.fillStyle = '#4c3a58';
    var lineH = Math.round(size * 1.5);
    var wy = textTop + 190;
    lines.forEach(function (ln, i) { ctx.fillText(ln, cx, wy + i * lineH); });

    // 7) 도장
    ctx.save();
    ctx.translate(card.x + card.w - 146, 1626);
    ctx.rotate(-0.14);
    ctx.strokeStyle = 'rgba(190,62,96,.7)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,62,96,.32)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(190,62,96,.88)';
    ctx.font = '800 24px "Noto Sans KR","Noto Sans CJK KR",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('마법', 0, -3);
    ctx.fillText('슈가', 0, 25);
    ctx.restore();

    // 8) 응원 파워 · 유효기간
    ctx.textAlign = 'left';
    ctx.font = '600 26px "Noto Sans KR","Noto Sans CJK KR",sans-serif';
    ctx.fillStyle = '#d9a441';
    ctx.fillText('★'.repeat(t.stars) + '☆'.repeat(5 - t.stars) + '  응원 파워', card.x + 56, 1640);
    ctx.font = '500 26px "Noto Sans KR","Noto Sans CJK KR",sans-serif';
    ctx.fillStyle = '#b7a6c8';
    ctx.fillText('오늘 자정까지 유효', card.x + 56, 1676);
    ctx.textAlign = 'center';

    // 9) 푸터
    ctx.font = '600 30px "Noto Sans KR","Noto Sans CJK KR",sans-serif';
    ctx.fillStyle = 'rgba(214,196,240,.92)';
    tracked(ctx, '✨ 마법 슈가 · @sugarballet0506', 540, 1804, 2);
    ctx.font = '400 26px "Noto Sans KR","Noto Sans CJK KR",sans-serif';
    ctx.fillStyle = 'rgba(200,182,230,.65)';
    ctx.fillText('오늘 하루도, 소원과 함께 ✨', 540, 1850);

    return c;
  }

  /* ── 저장 ──────────────────────────────────────────────── */
  saveBtn.addEventListener('click', async function () {
    if (!current || saveBtn.disabled) return;
    var label = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>🖼️</span> 카드 그리는 중…';
    try {
      if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
      var canvas = await buildShareImage(current);
      var url = canvas.toDataURL('image/png');
      var name = 'sugar-wish-card-' + ymd().replace(/-/g, '') + '.png';
      var a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast('소원 카드를 저장했어요 · 스토리에 붙여 보세요 📸');
    } catch (err) {
      toast('저장에 실패했어요. 다시 한 번 눌러 주세요.');
    } finally {
      saveBtn.innerHTML = label;
      saveBtn.disabled = false;
    }
  });

  /* ── 토스트 ────────────────────────────────────────────── */
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }

  /* ── 사용법 ────────────────────────────────────────────── */
  $('helpBtn').addEventListener('click', function () { helpEl.classList.add('open'); helpEl.setAttribute('aria-hidden', 'false'); });
  $('helpClose').addEventListener('click', function () { helpEl.classList.remove('open'); helpEl.setAttribute('aria-hidden', 'true'); });
  helpEl.addEventListener('click', function (e) { if (e.target === helpEl) { helpEl.classList.remove('open'); helpEl.setAttribute('aria-hidden', 'true'); } });

  /* ── 초기화 ────────────────────────────────────────────── */
  refreshQuota();
  window.addEventListener('resize', function () { if (rafId) sizeParticles(); });

  // 오늘 이미 뽑은 카드가 있으면 살짝 안내
  if (state.last && state.count) {
    var lastT = TALISMANS.filter(function (t) { return t.id === state.last; })[0];
    if (lastT) setTimeout(function () { toast('오늘 뽑은 카드: ' + lastT.emoji + ' ' + lastT.title); }, 900);
  }
})();
