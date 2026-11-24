(function () {
  'use strict';
  var T = window.SugarTown, $ = function (id) { return document.getElementById(id); };
  var APPROACH = 2300;                       // 링이 좁혀오는 시간(ms)
  var WINDOW = { perfect: 150, good: 330 };
  var SONG = 'stage', LEAD = 60;

  var CUES = [
    { i: 0, pose: 'plie' }, { i: 2, pose: 'tendu' }, { i: 3, pose: 'releve' }, { i: 4, pose: 'arabesque' },
    { i: 6, pose: 'plie' }, { i: 8, pose: 'arabesque' }, { i: 9, pose: 'releve' }, { i: 11, pose: 'tendu' },
    { i: 17, pose: 'arabesque' }, { i: 18, pose: 'plie' }, { i: 19, pose: 'releve' }, { i: 21, pose: 'arabesque' },
    { i: 23, pose: 'tendu' }, { i: 25, pose: 'releve' }, { i: 27, pose: 'arabesque' }, { i: 29, pose: 'curtsy' }
  ];
  var LINES = {
    plie: '무릎을 살며시, 여기서부터 무대가 시작돼요.',
    tendu: '발끝으로 바닥을 길게 밀어 봐요.',
    releve: '뒤꿈치가 들리면 객석의 촛불도 같이 떠올라요.',
    arabesque: '뒤로 뻗은 선이 무대 끝까지 이어져요.',
    curtsy: '마지막 인사, 르베랑스. 객석이 박수로 답해요.'
  };
  function idleParts() {
    var n = T.nick();
    return [
      { pose: 'plie', name: '플리에', line: '에튜가 고개를 끄덕여요. ' + n + '님이 첫 박자에 맞춰 무릎을 부드럽게 굽혀요.' },
      { pose: 'releve', name: '를르베', line: '피루의 손짓을 따라 ' + n + '님의 뒤꿈치가 떠올라요. 잠든 궁전 창에 불이 켜져요.' },
      { pose: 'arabesque', name: '아라베스크', line: '아라가 가리킨 숲을 향해 손을 내밀어요. 뒤로 뻗은 발끝까지 달빛이 닿아요.' },
      { pose: 'curtsy', name: '르베랑스', line: n + '님이 인사를 건네자 객석에 앉은 다섯 정령이 힘껏 박수를 쳐요.' }
    ];
  }

  var index = -1, savingDebut = false;
  var actx = null, master = null, band = null, show = null, posterUrl = null, lastInfo = null;

  /* ---------- 소리 ---------- */
  function audio() {
    if (actx) { if (actx.state === 'suspended') actx.resume(); return actx; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { actx = new AC(); } catch (e) { actx = null; return null; }
    master = actx.createGain(); master.gain.value = 0.9; master.connect(actx.destination);
    band = window.SugarMusic.create(actx, master);
    return actx;
  }
  function chime(freqs, when, dur, vol) {
    if (!actx) return;
    var at = actx.currentTime + (when || 0);
    freqs.forEach(function (f, i) {
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, at + i * 0.05);
      g.gain.exponentialRampToValueAtTime(vol || 0.12, at + i * 0.05 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + i * 0.05 + (dur || 0.4));
      o.connect(g); g.connect(master);
      o.start(at + i * 0.05); o.stop(at + i * 0.05 + (dur || 0.4) + 0.05);
    });
  }

  /* ---------- 정령의 응원 ---------- */
  function renderCheer() {
    var top = T.topBonds(2);
    $('cheerRow').innerHTML = top.map(function (bond) {
      var spirit = T.SPIRITS[bond.id];
      return '<figure class="cheer-spirit" style="--tint:' + spirit.color + '">' +
        '<span class="cheer-face"><img src="' + T.spiritArt(bond.id, true) + '" alt=""></span>' +
        '<figcaption>' + spirit.name + T.heartsHTML(bond.level, 'cheer-hearts') + '</figcaption></figure>';
    }).join('');
    var lead = top[0];
    $('cheerLine').textContent = lead && lead.points
      ? '가장 가까운 ' + lead.name + '가 무대 옆에서 말해요. “' + lead.line + '”'
      : '아직 무대를 지켜보는 정령이 없어요. 포션을 주문하거나 분식집에서 마음을 나눠 보세요.';
  }
  function cheerLead() { return T.topBonds(1)[0]; }

  /* ---------- 대기 화면 ---------- */
  function refresh() {
    var s = T.get(), ready = T.stageReady(), debut = s.kingdom.debutOutfit, who = T.nick();
    var parts = idleParts(), crown = T.prima();
    if (!ready) index = -1;
    var part = parts[index], last = index === parts.length - 1;
    var title = crown ? '👑 ' + who + '님의 프리마 갈라' : '잠자는 숲속의 ' + who;
    $('showTitle').textContent = title;
    $('cTitle').textContent = title;
    $('castTitle').textContent = T.josa(who, '과', '와') + ' 함께하는 정령들';
    T.showDancer($('stageDancer'), s.worn, part ? part.pose : 'ready');
    $('costume').textContent = T.dressOf(s.worn).name;
    $('scene').dataset.beat = String(index);
    $('startShow').hidden = !ready;
    $('startShow').disabled = savingDebut;
    $('debutLook').hidden = !debut || (part && !last);
    if (debut) $('debutLook').textContent = '첫 무대 의상 · ' + T.dressOf(debut).name;
    $('toClass').hidden = ready;
    $('beats').hidden = !ready;
    Array.from($('beats').children).forEach(function (dot, i) { dot.classList.toggle('filled', i <= index); });
    var fame = $('fameLine');
    fame.hidden = !ready;
    if (ready) {
      fame.textContent = '왕국 명성 ' + T.fmt(s.fame || 0) + (s.show ? ' · 지난 공연 ' + s.show.grade + '등급 ' + T.fmt(s.show.score) + '점' : ' · 아직 첫 공연 전이에요') + ' · 연습 효과 +' + T.stagePower(s).good + 'ms';
    }
    if (!ready) {
      $('count').textContent = '출석 도장 ' + s.classes + ' / ' + T.STAGE_CLASSES;
      $('cueTitle').textContent = '초대장까지 도장 ' + T.stageLeft() + '개';
      $('cueText').textContent = '수업 두 번을 마치면 ' + who + '님이 이 무대에 올라요.';
      $('toClass').href = '../studio/?v=' + T.V + (s.lesson ? '#lesson' : '#first-bar');
      $('toClass').textContent = s.lesson ? '수업 이어 하기' : '도장 모으러 가기';
      $('billNote').textContent = '도장 ' + s.classes + ' / ' + T.STAGE_CLASSES + ' · 초대장을 기다리는 중';
    } else if (!part) {
      $('count').textContent = '왕립 극장 초대 완료';
      $('cueTitle').textContent = debut ? who + '님의 앙코르 무대' : crown ? '👑 프리마 피날레, ' + who + '님 무대로!' : who + '님, 무대로 나와 주세요!';
      $('cueText').textContent = debut
        ? '오늘의 의상으로 한 번 더. 왈츠가 시작되면 링이 겹치는 순간을 탭해요.'
        : '왈츠가 시작되면 링이 겹치는 순간을 탭해요. 열여섯 장면을 지나면 커튼콜과 공연 포스터가 기다려요.';
      $('startShow').textContent = debut ? '다시 공연하기' : '공연 시작';
      $('billNote').textContent = crown ? '프리마 갈라 · 3/4 왈츠 · 16장면' : '3/4 왈츠 · 16장면 · 약 30초';
    } else {
      $('count').textContent = last ? '리허설 완주 · 4 / 4' : '리허설 · ' + (index + 1) + ' / 4';
      $('cueTitle').textContent = last ? '마지막 인사, 르베랑스' : part.name;
      $('cueText').textContent = part.line;
    }
    T.syncUI();
    renderCheer();
  }

  /* ---------- 공연 ---------- */
  function cueTimes() {
    var song = window.SugarMusic.SONGS[SONG];
    var beat = 60000 / song.bpm;
    return CUES.map(function (c) {
      var m = song.melody[c.i];
      return Math.round((m ? m[0] : 0) * beat);
    });
  }

  function startShow() {
    if (!T.stageReady() || show) return;
    var ctx = audio();
    var s = T.get(), times = cueTimes(), power = T.stagePower(s);
    var meal = s.kingdom.meal && s.kingdom.meal.buff ? s.kingdom.meal.buff : {};
    WINDOW = { perfect: 150 + power.perfect + Math.round((meal.all || 0) / 2), good: 330 + power.good + (meal.all || 0) };
    show = {
      runId: 'debut-'+Date.now()+'-'+Math.random().toString(36).slice(2), times: times, at: 0, judged: 0, perfect: 0, good: 0, miss: 0, combo: 0, maxCombo: 0,
      p0: performance.now() + LEAD, done: false, sending: false, raf: 0, pose: null
    };
    $('sStep').textContent = '장면 0 / ' + CUES.length;
    $('sScore').textContent = 'PERFECT 0 · GOOD 0 · MISS 0';
    $('sJudge').textContent = '';
    $('sJudge').className = 'show-judge';
    $('sBubble').className = 'show-bubble';
    $('sHearts').replaceChildren();
    $('sFill').style.width = '0%';
    T.showDancer($('sDancer'), s.worn, 'ready');
    Object.keys(T.POSES).forEach(function(pose){var img=new Image();img.src=T.dancerArt(s.worn,pose);});
    $('sMove').textContent = '준비 자세';
    $('sCue').textContent = '연습 효과 · 판정 여유 +' + power.good + 'ms' + (s.kingdom.meal ? ' · ' + s.kingdom.meal.name + ' 기운' : '') + '. 링이 겹치는 순간을 탭!';
    var begin = function () { if (band && show) band.start(SONG, Math.max(0, performance.now() - show.p0)); };
    if (ctx && ctx.state === 'suspended') ctx.resume().then(begin).catch(begin);
    else begin();
    if (!$('show').open) $('show').showModal();
    chime([523.25, 659.25], 0.05, 0.5, 0.09);
    var lead = cheerLead();
    if (lead && lead.points) setTimeout(function () { bubble(lead.name + ' · “' + lead.line + '”'); }, 520);
    show.raf = requestAnimationFrame(loop);
  }

  function nowMs() { return performance.now() - show.p0; }

  function loop() {
    if (!show || show.done) return;
    var t = nowMs(), i = show.at;
    if (i < show.times.length) {
      var ct = show.times[i];
      if (t > ct + WINDOW.good) { judgeMiss('late-' + i); }
      else {
        var p = 1 - (ct - t) / APPROACH;
        $('sFill').style.width = Math.max(0, Math.min(1, p)) * 100 + '%';
        setPoseFor(i, p);
      }
    }
    if (show.at >= show.times.length) {
      if (!show.ending) show.ending = performance.now();
      if (performance.now() - show.ending > 1150) { finishShow(); return; }
    }
    show.raf = requestAnimationFrame(loop);
  }

  function setPoseFor(i, p) {
    var cue = CUES[i];
    if (show.pose !== cue.pose && p > -0.1) {
      show.pose = cue.pose;
      // Show the cue first; the dancer changes pose only on a successful tap.
      $('sMove').textContent = T.POSES[cue.pose];
      $('sCue').textContent = LINES[cue.pose] || '';
    }
    $('sRing').style.transform = 'translate(-50%,-50%) scale(' + (1.6 - 0.6 * Math.max(0, Math.min(1.06, p))).toFixed(3) + ')';
    $('sRing').classList.toggle('near', Math.abs(p - 1) < 0.09);
  }

  function judge(text, kind) {
    var el = $('sJudge');
    el.textContent = text;
    el.className = 'show-judge';
    void el.offsetWidth;
    el.className = 'show-judge ' + kind;
  }
  function hearts(n) {
    var layer = $('sHearts');
    for (var i = 0; i < n; i++) {
      var h = document.createElement('span');
      h.textContent = ['💗', '💖', '✨', '🌸'][Math.floor(Math.random() * 4)];
      h.style.left = (26 + Math.random() * 48).toFixed(1) + '%';
      h.style.setProperty('--dx', (Math.random() * 40 - 20).toFixed(0) + 'px');
      h.style.animationDelay = (i * 60) + 'ms';
      layer.appendChild(h);
      (function (node) { setTimeout(function () { node.remove(); }, 1600); })(h);
    }
  }
  function bubble(text) { var el = $('sBubble'); el.textContent = text; el.className = 'show-bubble on'; setTimeout(function () { el.className = 'show-bubble'; }, 1300); }

  function judgeHit() {
    if (!show || show.done || show.at >= show.times.length) return;
    var dt = nowMs() - show.times[show.at], abs = Math.abs(dt);
    if (abs <= WINDOW.perfect) {
      show.perfect++; show.combo++; if (show.combo > show.maxCombo) show.maxCombo = show.combo;
      judge('PERFECT!', 'perfect'); hearts(3); chime([1046.5, 1318.5, 1568], 0, 0.45, 0.13); bubble('딱! 무대가 반짝 ✨');
    } else if (abs <= WINDOW.good) {
      show.good++; show.combo++; if (show.combo > show.maxCombo) show.maxCombo = show.combo;
      judge('GOOD!', 'good'); hearts(1); chime([784, 1046.5], 0, 0.35, 0.1);
    } else {
      if (dt < -WINDOW.good) { judge('조금만 기다려요', 'good'); return; }
      judgeMiss('wrong');
      return;
    }
    T.showDancer($('sDancer'), T.get().worn, CUES[show.at].pose);
    $('sDancer').classList.remove('stage-miss','stage-hit'); void $('sDancer').offsetWidth; $('sDancer').classList.add('stage-hit');
    advance();
  }
  function judgeMiss(reason) {
    show.miss++; show.combo = 0;
    T.showDancer($('sDancer'), T.get().worn, 'ready');
    $('sDancer').classList.remove('stage-hit','stage-miss'); void $('sDancer').offsetWidth; $('sDancer').classList.add('stage-miss');
    judge('삐끗!', 'miss');
    chime([196, 174.6], 0, 0.3, 0.11);
    bubble(reason === 'wrong' ? '손이 반 박자 빨랐어요 😅' : '음악이 먼저 지나갔어요 🎵');
    advance();
  }
  function advance() {
    show.at++;
    $('sStep').textContent = '장면 ' + Math.min(show.at, CUES.length) + ' / ' + CUES.length;
    $('sScore').textContent = 'PERFECT ' + show.perfect + ' · GOOD ' + show.good + ' · MISS ' + show.miss;
    $('sFill').style.width = '0%';
    show.pose = null;
    if (show.at >= show.times.length) { $('sMove').textContent = '커튼콜'; $('sCue').textContent = '객석에서 박수가 쏟아져요!'; }
  }

  async function finishShow() {
    if (!show || show.done) return;
    show.done = true;
    if (show.raf) cancelAnimationFrame(show.raf);
    if (band) band.stop();
    var sc = show.perfect * 100 + show.good * 60 + show.maxCombo * 10;
    var max = show.times.length * 100 + show.times.length * 10;
    var ratio = max ? sc / max : 0;
    var grade = ratio >= 0.9 ? 'S' : ratio >= 0.72 ? 'A' : ratio >= 0.5 ? 'B' : 'C';
    var info = { work:'debut', runId:show.runId, grade: grade, score: sc, perfect: show.perfect, good: show.good, miss: show.miss, notes: show.times.length, maxCombo: show.maxCombo };
    var record = null;
    try {
      record = await T.finishShow(info);
    } catch (e) { /* 지갑이 잠겨 있어도 공연 기록은 보여 준다. */ }
    show = null;
    if (actx) window.SugarMusic.applause(actx, master, 2.2);
    $('show').close();
    refresh();
    renderCurtain(info, record);
    hearts(10);
    applauseScene();
  }

  function applauseScene() {
    var scene = $('scene');
    scene.classList.remove('applause');
    void scene.offsetWidth;
    scene.classList.add('applause');
    setTimeout(function () { scene.classList.remove('applause'); }, 2600);
  }

  /* ---------- 커튼콜 카드 ---------- */
  var GRADE_LINE = {
    S: '',
    A: '다섯 정령이 브라보를 외쳤어요. 아주 좋은 무대였어요.',
    B: '박수는 넉넉했어요. 다음 공연은 더 반짝일 거예요.',
    C: '무대는 끝까지 이어졌어요! 한 번 더 추면 더 좋아질 거예요.'
  };
  function gradeLine(grade) {
    return grade === 'S'
      ? '객석이 다 같이 일어났어요. 오늘의 주역은 ' + T.nick() + '님이에요!'
      : GRADE_LINE[grade] || GRADE_LINE.B;
  }
  function renderCurtain(info, record) {
    lastInfo = info;
    $('cKicker').textContent = (T.prima() ? '👑 프리마 갈라 · ' : '막이 내렸어요 · ') + T.fmt(new Date().getMonth() + 1) + '월 ' + new Date().getDate() + '일 공연';
    $('cGrade').textContent = info.grade;
    $('cGrade').className = 'grade ' + info.grade;
    $('cLine').textContent = gradeLine(info.grade);
    var lead = cheerLead(), cheerEl = $('cCheer');
    cheerEl.hidden = !(lead && lead.points);
    if (lead && lead.points) {
      cheerEl.textContent = lead.name + '가 무대 옆에서 “' +
        (info.grade === 'C' ? '괜찮아요. 무대는 끝까지 이어졌어요. 다음엔 제가 더 가까이 있을게요.' : lead.line) +
        '” 하고 말했어요.';
    }
    $('cScore').textContent = T.fmt(info.score) + '점';
    $('cPerfect').textContent = String(info.perfect);
    $('cCoins').textContent = record ? '+' + T.fmt(record.coins) : '–';
    $('cFame').hidden = !record;
    if (record) $('cFame').textContent = '왕국 명성 +' + record.fame + ' · 객석의 박수가 명성으로 쌓였어요';
    $('posterFrame').hidden = true;
    $('posterBtns').hidden = true;
    $('makePoster').hidden = false;
    $('makePoster').textContent = '공연 포스터 만들기';
    if (!$('curtain').open) $('curtain').showModal();
    $('cAnnounce').textContent = info.grade + '등급, ' + info.perfect + '개의 퍼펙트로 공연을 마쳤어요.';
  }

  /* ---------- 포스터 ---------- */
  function korDate(d) {
    var w = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0') + ' (' + w + ')';
  }

  function drawPoster(info) {
    return new Promise(function (resolve) {
      var cv = $('poster'), ctx = cv.getContext('2d');
      var W = cv.width, H = cv.height;
      var s = T.get(), worn = T.dressOf(s.worn);
      var who = T.nick(), crown = T.prima();
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2b1730'); g.addColorStop(0.55, '#3d2640'); g.addColorStop(1, '#513049');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // 무대 조명
      var sg = ctx.createRadialGradient(W / 2, 300, 30, W / 2, 380, 720);
      sg.addColorStop(0, 'rgba(255,240,201,.42)'); sg.addColorStop(0.5, 'rgba(255,224,170,.12)'); sg.addColorStop(1, 'rgba(255,224,170,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
      // 커튼
      for (var i = 0; i < 26; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(70,36,58,.55)' : 'rgba(46,22,40,.45)';
        var cw = W / 26;
        ctx.fillRect(i * cw, 0, cw, H * 0.2);
      }
      // 금빛 테두리
      ctx.strokeStyle = 'rgba(226,192,128,.75)'; ctx.lineWidth = 4;
      ctx.strokeRect(46, 46, W - 92, H - 92);
      ctx.strokeStyle = 'rgba(226,192,128,.34)'; ctx.lineWidth = 2;
      ctx.strokeRect(66, 66, W - 132, H - 132);
      // 아치
      ctx.strokeStyle = 'rgba(226,192,128,.5)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(196, 900); ctx.lineTo(196, 470); ctx.bezierCurveTo(196, 250, 884, 250, 884, 470); ctx.lineTo(884, 900); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,246,222,.16)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(214, 900); ctx.lineTo(214, 480); ctx.bezierCurveTo(214, 274, 866, 274, 866, 480); ctx.lineTo(866, 900); ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#e6cda2';
      ctx.font = '600 30px "Nanum Myeongjo","Noto Serif KR",serif';
      ctx.fillText('왕 립  발 레 단', W / 2, 152);
      ctx.font = '400 20px "Nanum Myeongjo","Noto Serif KR",serif';
      ctx.fillStyle = 'rgba(230,205,162,.7)';
      ctx.fillText('ROYAL BALLET THEATRE', W / 2, 186);
      if (crown) {
        ctx.font = '600 24px "Nanum Myeongjo","Noto Serif KR",serif';
        ctx.fillStyle = '#f4d99f';
        ctx.fillText('👑  P R I M A   B A L L E R I N A', W / 2, 240);
      }

      var img = new Image();
      img.onload = function () {
        var box = { x: 250, y: 330, w: 580, h: 600 };
        var r = Math.min(box.w / img.width, box.h / img.height);
        var dw = img.width * r, dh = img.height * r;
        ctx.save();
        ctx.shadowColor = 'rgba(255,236,190,.35)'; ctx.shadowBlur = 40;
        ctx.drawImage(img, box.x + (box.w - dw) / 2, 930 - dh, dw, dh);
        ctx.restore();

        var heading = crown ? who + '님의 프리마 갈라' : '잠자는 숲속의 ' + who;
        var hsize = 70;
        ctx.fillStyle = '#fff4de';
        ctx.font = '700 ' + hsize + 'px "Nanum Myeongjo","Noto Serif KR",serif';
        while (hsize > 38 && ctx.measureText(heading).width > 800) {
          hsize -= 4;
          ctx.font = '700 ' + hsize + 'px "Nanum Myeongjo","Noto Serif KR",serif';
        }
        ctx.fillText(heading, W / 2, 1000);
        ctx.font = '400 26px "Nanum Myeongjo","Noto Serif KR",serif';
        ctx.fillStyle = 'rgba(255,240,215,.78)';
        ctx.fillText(crown ? '👑 프리마 발레리나 · 왕립 발레단' : '왕립 발레단 · 3/4 왈츠', W / 2, 1040);

        // 등급 배지
        ctx.beginPath(); ctx.arc(200, 1114, 52, 0, Math.PI * 2);
        var bg = ctx.createLinearGradient(148, 1062, 252, 1166);
        bg.addColorStop(0, '#f7dfa8'); bg.addColorStop(1, '#d5a44f');
        ctx.fillStyle = bg; ctx.fill();
        ctx.fillStyle = '#4a2f16'; ctx.font = '800 60px "Nanum Myeongjo",serif';
        ctx.fillText(info.grade, 200, 1135);
        ctx.fillStyle = 'rgba(240,220,180,.72)'; ctx.font = '600 22px "Nanum Myeongjo",serif';
        ctx.fillText('등급', 200, 1194);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffeecd'; ctx.font = '700 34px "Nanum Myeongjo","Noto Serif KR",serif';
        ctx.fillText(T.fmt(info.score) + '점', 292, 1112);
        ctx.fillStyle = 'rgba(255,238,205,.72)'; ctx.font = '400 24px "Nanum Myeongjo","Noto Serif KR",serif';
        ctx.fillText('PERFECT ' + info.perfect + ' · GOOD ' + info.good + ' · MISS ' + info.miss, 292, 1150);
        ctx.fillText('오늘의 의상 · ' + worn.name, 292, 1188);

        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255,238,205,.8)'; ctx.font = '400 24px "Nanum Myeongjo","Noto Serif KR",serif';
        ctx.fillText(korDate(new Date()), W - 110, 1112);

        // 구분선과 서명
        ctx.strokeStyle = 'rgba(226,192,128,.32)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(140, 1222); ctx.lineTo(W - 140, 1222); ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(230,205,162,.85)';
        ctx.font = '600 26px "Nanum Myeongjo","Noto Serif KR",serif';
        ctx.fillText('슈가의 발레왕국', W / 2, 1256);
        ctx.fillStyle = 'rgba(230,205,162,.42)'; ctx.font = '400 17px Georgia,serif';
        ctx.fillText('SUGAR’S BALLET KINGDOM', W / 2, 1278);
        resolve(cv);
      };
      img.onerror = function () { resolve(cv); };
      img.src = T.dancerArt(s.worn, 'curtsy');
    });
  }

  async function makePoster() {
    if (!lastInfo) return;
    var cv = await drawPoster(lastInfo);
    $('posterFrame').hidden = false;
    $('posterBtns').hidden = false;
    $('makePoster').hidden = true;
    if (posterUrl) URL.revokeObjectURL(posterUrl);
    cv.toBlob(function (blob) {
      if (!blob) return;
      posterUrl = URL.createObjectURL(blob);
      $('downloadPoster').href = posterUrl;
      $('posterFrame').scrollIntoView({ block: 'nearest' });
    }, 'image/png');
  }

  function sharePoster() {
    if (!lastInfo) return;
    var cv = $('poster');
    cv.toBlob(async function (blob) {
      if (!blob) return;
      var file = new File([blob], 'sugar-royal-theater.png', { type: 'image/png' });
      var text = '오늘의 왕립 극장 · ' + (T.prima() ? T.nick() + '님의 프리마 갈라' : '잠자는 숲속의 ' + T.nick()) + ' (' + lastInfo.grade + '등급)';
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: text, title: '왕립 극장 공연 포스터' });
          $('cAnnounce').textContent = '공연 포스터를 공유했어요.';
          return;
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
      if (!posterUrl) posterUrl = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = posterUrl; a.download = 'sugar-royal-theater.png';
      document.body.appendChild(a); a.click(); a.remove();
      $('cAnnounce').textContent = '이미지로 저장했어요. 사진첩이나 파일에서 확인해 주세요.';
    }, 'image/png');
  }

  /* ---------- 이벤트 ---------- */
  $('startShow').addEventListener('click', function () {
    audio();
    startShow();
  });
  $('sTap').addEventListener('click', judgeHit);
  $('sScene').addEventListener('pointerdown', function (e) { e.preventDefault(); judgeHit(); });
  document.addEventListener('keydown', function (e) {
    if (!$('show').open) return;
    if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); judgeHit(); }
  });
  $('sQuit').addEventListener('click', function () {
    if (show) { show.done = true; if (show.raf) cancelAnimationFrame(show.raf); }
    show = null;
    if (band) band.stop();
    $('show').close();
    refresh();
  });
  $('show').addEventListener('cancel', function (e) { e.preventDefault(); $('sQuit').click(); });
  $('makePoster').addEventListener('click', makePoster);
  $('sharePoster').addEventListener('click', sharePoster);
  $('againShow').addEventListener('click', function () {
    $('curtain').close();
    refresh();
    startShow();
  });
  $('curtain').addEventListener('cancel', function (e) { e.preventDefault(); $('curtain').close(); });

  Object.keys(T.STAFF).forEach(function (id) {
    var spirit = T.SPIRITS[id], figure = document.createElement('figure');
    var img = document.createElement('img'), caption = document.createElement('figcaption');
    img.src = T.spiritArt(id, true); img.alt = ''; img.loading = 'lazy';
    var name = document.createElement('b'), role = document.createElement('span');
    name.textContent = spirit.name; role.textContent = spirit.role.split(' · ').pop();
    caption.append(name, role); figure.append(img, caption); $('castRow').appendChild(figure);
  });
  window.addEventListener('sugartown:refresh', refresh);

  // 검증 도구가 읽는 상태 (읽기 전용).
  window.__stage = {
    ready: function () { return T.stageReady(); },
    show: function () { return show ? { at: show.at, perfect: show.perfect, good: show.good, miss: show.miss, times: show.times, now: show.done ? null : nowMs() } : null; },
    tap: judgeHit,
    info: function () { return lastInfo; },
    poster: function () { return { shown: !$('posterFrame').hidden, url: !!posterUrl, dialog: $('curtain').open }; }
  };

  refresh();
})();
