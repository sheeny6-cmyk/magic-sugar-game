(function () {
  'use strict';
  var T = window.SugarTown, book = window.SugarLessons;
  var classes = book.classes, MOVES = book.MOVES;
  var $ = function (id) { return document.getElementById(id); };
  var teachers = { bar: 'etu', center: 'piru', piece: 'ara' };
  var dialogs = ['confirm', 'lesson', 'result'];
  var APPROACH = 1700;              // 노트가 트랙을 건너오는 시간(ms)
  var busy = false, lastReceipt = null, ses = null, p0 = 0;

  /* ================= 소리 ================= */
  var soundOn = readSound();
  var actx = null, master = null, musicBus = null, sfxBus = null;

  function readSound() { try { return localStorage.getItem('sugartown.sound') !== '0'; } catch (e) { return true; } }
  function saveSound() { try { localStorage.setItem('sugartown.sound', soundOn ? '1' : '0'); } catch (e) { /* 소리 설정은 남지 않아도 돼요. */ } }
  function audio() {
    if (actx) { if (actx.state === 'suspended') actx.resume(); return actx; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { actx = new AC(); } catch (e) { actx = null; return null; }
    master = actx.createGain(); master.gain.value = 0.9; master.connect(actx.destination);
    musicBus = actx.createGain(); musicBus.gain.value = soundOn ? 0.42 : 0; musicBus.connect(master);
    sfxBus = actx.createGain(); sfxBus.gain.value = soundOn ? 0.5 : 0; sfxBus.connect(master);
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function hz(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  // 피아노 한 음: 부드러운 삼각파 + 한 옥타브 위 사인, 짧은 어택과 긴 감쇠.
  function piano(freq, at, dur, vol, bus) {
    if (!actx || !(freq > 0)) return;
    var lead = actx.createOscillator(), top = actx.createOscillator();
    var g = actx.createGain(), topGain = actx.createGain(), filter = actx.createBiquadFilter();
    lead.type = 'triangle'; lead.frequency.value = freq;
    top.type = 'sine'; top.frequency.value = freq * 2.004;
    topGain.gain.value = 0.18;
    filter.type = 'lowpass'; filter.frequency.value = 2800; filter.Q.value = 0.55;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0006, vol), at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    lead.connect(filter); top.connect(topGain); topGain.connect(filter); filter.connect(g);
    g.connect(bus || musicBus);
    lead.start(at); top.start(at); lead.stop(at + dur + 0.05); top.stop(at + dur + 0.05);
  }
  function tone(kind) {
    if (!actx || !soundOn) return;
    var at = actx.currentTime + 0.005;
    if (kind === 'perfect') { [1046.5, 1318.5, 1568].forEach(function (f, i) { piano(f, at + i * 0.055, 0.5, 0.16, sfxBus); }); }
    else if (kind === 'good') { [784, 1046.5].forEach(function (f, i) { piano(f, at + i * 0.045, 0.42, 0.13, sfxBus); }); }
    else if (kind === 'miss') { piano(196, at, 0.32, 0.14, sfxBus); piano(174.6, at + 0.07, 0.28, 0.1, sfxBus); }
    else { piano(660, at, 0.16, 0.05, sfxBus); }
  }

  var PROG_SONG = { bar: 'bar', center: 'center', piece: 'piece' };

  /* 음악은 assets/music.js 의 왈츠 편곡이 맡는다. 노트는 그 선율 박자에 맞춰 놓인다. */
  var band = null;
  function startMusic(chart, elapsed) {
    var ctx = audio();
    if (!ctx || ctx.state !== 'running') return false;
    if (!band) band = window.SugarMusic.create(ctx, musicBus);
    if (!band) return false;
    return band.start(chart.song || PROG_SONG[ses.kind] || 'bar', elapsed);
  }
  function stopMusic() { if (band) band.stop(); }
  function applySound() {
    var b = $('lSound');
    b.textContent = soundOn ? '🔊 소리' : '🔇 무음';
    b.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    if (musicBus) musicBus.gain.value = soundOn ? 0.42 : 0;
    if (sfxBus) sfxBus.gain.value = soundOn ? 0.5 : 0;
  }

  /* ================= 수업 목록 ================= */
  function refresh() {
    var s = T.get(), lv = T.level(), potion = s.kingdom.prepared;
    $('lvName').textContent = 'Lv.' + lv.n + ' ' + lv.name;
    $('lvClasses').textContent = '수료 ' + s.classes + '회';
    $('lvBar').style.width = lv.pct + '%';
    var openSteps = lv.steps.filter(function (row) { return !row.done; });
    $('lvNote').textContent = lv.next
      ? '다음 승급까지 ' + (openSteps.length ? openSteps : lv.steps).map(function (row) { return row.label + ' ' + row.have + '/' + row.need + row.unit; }).join(' · ')
      : '👑 프리마 발레리나 · 왕립 극장 피날레가 열려 있어요';
    $('stamps').textContent = '출석 도장 · 바 ' + s.stamps.bar + ' · 센터 ' + s.stamps.center + ' · 작품 ' + s.stamps.piece;
    $('stageLink').textContent = T.stageReady() ? '오늘의 의상으로 리허설 하기 →' : '왕립 극장까지 도장 ' + T.stageLeft() + '개 →';
    $('practiceKit').textContent = potion ? T.STAFF[potion.id].name + ' 포션 · ' + T.effectFor(potion.id, potion.level).label : '정령에게 연습 포션 주문하기';
    $('resumeLesson').hidden = !s.lesson;
    if (s.lesson) $('resumeLesson').textContent = classes[s.lesson.kind].name + ' 이어 하기 · 노트 ' + (s.lesson.chart ? s.lesson.chart.notes.length : 3) + '개';
    $('courseNote').textContent = s.lesson
      ? classes[s.lesson.kind].name + ' 연습 중이에요. 노래를 끝까지 타면 코인이 들어와요.'
      : '수업은 모두 무료예요. 음악이 끝날 때까지 박자를 타면 코인이 쌓여요.';
    $('classes').innerHTML = Object.keys(classes).map(function (kind) {
      var c = classes[kind], sp = teachers[kind];
      var waiting = s.lesson && kind !== s.lesson.kind;
      var prize = T.rewardFor(kind, waiting ? null : potion).coins;
      return '<button class="cls" data-cls="' + kind + '" type="button"' + (waiting ? ' disabled' : '') + '>' +
        '<img src="' + T.spiritArt(sp, true) + '" alt=""><span class="course-info"><strong>' + c.name + '</strong>' +
        '<small>' + T.SPIRITS[sp].name + ' 선생님 · ' + c.count + '노트</small></span>' +
        '<b class="course-prize">+' + T.fmt(prize) + '코인</b><span aria-hidden="true">›</span></button>';
    }).join('');
    T.syncUI();
  }

  function routeTo(hash, replace) {
    var url = location.pathname + location.search + hash;
    if (location.hash !== hash) {
      if (replace) history.replaceState(history.state, '', url);
      else history.pushState({ studioDialog: true }, '', url);
    }
    renderRoute();
  }
  function closeToStudio() {
    stopSession();
    if (history.state && history.state.studioDialog) history.back();
    else routeTo('', true);
  }
  function showDialog(id) {
    dialogs.forEach(function (key) {
      var dialog = $(key);
      if (key !== id && dialog.open) dialog.close();
    });
    if (id && !$(id).open) $(id).showModal();
  }
  function confirmCourse(kind) {
    var c = classes[kind], s = T.get(), potion = s.kingdom.prepared;
    var song = window.SugarMusic && window.SugarMusic.SONGS ? window.SugarMusic.SONGS[kind] : null;
    $('cKicker').textContent = '무료 수업 · ' + c.count + '노트' + (song ? ' · ' + song.name : ' · ' + c.mood);
    $('cName').textContent = c.name;
    $('cDesc').textContent = c.desc;
    $('cReward').textContent = '+' + T.fmt(T.rewardFor(kind, potion).coins) + '코인';
    $('cNote').textContent = !T.isOwned('lilac') ? '첫 수업 선물 · 라일락 쉬폰 스커트' :
      potion ? T.STAFF[potion.id].name + ' 포션을 들고 타요. ' + T.effectFor(potion.id, potion.level).label : '노트가 판정 원에 닿을 때 버튼을 누르면 돼요.';
    showDialog('confirm');
  }
  async function enroll(kind) {
    if (busy || !Object.hasOwn(classes, kind)) return;
    busy = true;
    try {
      await T.updateWallet(function (s) {
        if (s.lesson) return;
        s.lesson = book.makeLesson(kind, s);
        s.lesson.paidFee = 0;
      });
    } finally { busy = false; }
    refresh();
    routeTo('#lesson', true);
  }
  async function migrateLegacy(run) {
    if (busy) return;
    busy = true;
    try {
      await T.updateWallet(function (s) {
        if (!s.lesson || !s.lesson.rounds) return;
        var next = book.makeLesson(run.kind, s);
        next.id = run.id;
        next.paidFee = Number.isSafeInteger(run.paidFee) ? run.paidFee : 0;
        s.lesson = next;
      });
    } finally { busy = false; }
    refresh(); renderRoute();
  }

  /* ================= 포션 효과 ================= */
  function buffFor(potion, kind) {
    var base = classes[kind].window;
    var out = { window: { perfect: base.perfect, good: base.good }, comboRate: 1, noteCoins: 0, shields: 0, line: '' };
    if (!potion) return out;
    var strong = potion.level > 1;
    if (potion.id === 'etu') {
      var mul = strong ? 1.45 : 1.25;
      out.window = { perfect: Math.round(base.perfect * mul), good: Math.round(base.good * mul) };
      out.line = '✨ 에튜 포션 적용 · 판정 여유 +' + Math.round((mul - 1) * 100) + '%';
    } else if (potion.id === 'ara') {
      out.comboRate = strong ? 2 : 1.5;
      out.line = '✨ 아라 포션 적용 · 콤보 코인 ×' + (strong ? '2' : '1.5');
    } else if (potion.id === 'alle') {
      out.noteCoins = strong ? 2 : 1;
      out.line = '✨ 알레 포션 적용 · 성공한 박자마다 코인 +' + out.noteCoins;
    } else if (potion.id === 'piru') {
      out.shields = strong ? 2 : 1;
      out.line = '✨ 피루 포션 적용 · 삐끗 ' + out.shields + '번은 회전으로 넘겨요';
    } else if (potion.id === 'shangz') {
      out.shields = strong ? 2 : 1;
      out.line = '✨ 샹즈 포션 적용 · 삐끗 ' + out.shields + '번은 도약으로 넘겨요';
    }
    return out;
  }

  /* ================= 리듬 수업 ================= */
  function startSession(run) {
    stopSession();
    var chart = run.chart && run.chart.notes && run.chart.notes.length ? run.chart : book.buildChart(run.kind, 0);
    var s = T.get(), kind = run.kind, c = classes[kind], buffs = buffFor(s.kingdom.prepared, kind);
    var lane = $('lane');
    lane.replaceChildren();
    var props = $('lProps');
    props.replaceChildren();
    var notes = chart.notes.map(function (n, i) {
      var el = document.createElement('span');
      el.className = 'note ' + n.type;
      el.textContent = MOVES[n.type].note;
      el.setAttribute('aria-hidden', 'true');
      el.style.display = 'none';
      lane.appendChild(el);
      var prop = null;
      if (n.type !== 'beat') {
        prop = document.createElement('span');
        prop.className = 'prop ' + n.type;
        prop.setAttribute('aria-hidden', 'true');
        prop.innerHTML = '<i>' + (n.type === 'cat' ? '🐱' : '🚧') + '</i>';
        prop.style.display = 'none';
        props.appendChild(prop);
      }
      return { t: n.t, type: n.type, index: i, judged: false, result: null, el: el, prop: prop };
    });
    $('lDots').innerHTML = notes.map(function () { return '<i></i>'; }).join('');
    $('lSparks').replaceChildren();
    $('lScene').classList.add('playing');
    $('lBubble').className = 'bubble';
    $('lBubble').textContent = '';
    $('lDancer').className = 'practice-dancer';
    $('lJudge').textContent = '';
    $('lJudge').className = 'judge-flash';
    $('lCombo').hidden = true;
    $('lCombo').querySelector('b').textContent = '0';
    $('lBuff').hidden = !buffs.line;
    $('lBuff').textContent = buffs.line;
    $('lTitle').textContent = c.name;
    $('lPose').textContent = '준비 자세';
    $('lPrize').textContent = '완주 +' + T.fmt(T.rewardFor(kind, s.kingdom.prepared).coins) + '코인';
    $('lPortrait').src = T.spiritArt(teachers[kind], true);
    $('lTeacher').textContent = T.SPIRITS[teachers[kind]].name + ' 선생님';
    T.showDancer($('lDancer'), s.worn, 'ready');
    $('lDancer').classList.remove('snap', 'wobble');
    $('lFeedback').textContent = kind === 'bar'
      ? '노래에 맞춰 노트가 판정 원에 닿을 때 🩰 박자를 눌러요! 고양이는 🐾, 장애물은 🦋.'
      : '노트가 판정 원에 닿는 순간, 노트와 같은 동작을 눌러요!';
    ses = {
      run: run, id: run.id, kind: kind, chart: chart, notes: notes,
      judged: 0, combo: 0, maxCombo: 0, perfect: 0, good: 0, miss: 0,
      shields: buffs.shields, comboRate: buffs.comboRate, noteCoins: buffs.noteCoins, window: buffs.window,
      poses: c.poses, poseIdx: -1, finished: false, sending: false,
      musicStarted: false, raf: 0, interrupted: false
    };
    paintDots();
    paintCount();
    applySound();
    p0 = performance.now() + 140;
    showDialog('lesson');
    ses.musicStarted = startMusic(chart, 0);
    ses.raf = requestAnimationFrame(loop);
  }

  function stopSession() {
    var scene = $('lScene');
    if (scene) scene.classList.remove('playing');
    if (ses) {
      ses.finished = true;
      if (ses.raf) cancelAnimationFrame(ses.raf);
    }
    stopMusic();
    ses = null;
  }

  function nowMs() { return performance.now() - p0; }

  function loop() {
    if (!ses || ses.finished) return;
    var t = nowMs(), lane = $('lane'), laneW = lane.clientWidth || 280;
    var targetX = 39, startX = Math.max(targetX + 150, laneW - 46);
    for (var i = 0; i < ses.notes.length; i++) {
      var n = ses.notes[i];
      if (n.judged) {
        if (n.el.style.display !== 'none') n.el.style.display = 'none';
        if (n.prop && n.prop.dataset.done !== '1') { n.prop.dataset.done = '1'; n.prop.style.display = 'none'; }
        continue;
      }
      if (t - n.t > ses.window.good) { missNote(n, 'late'); continue; }
      var p = 1 - (n.t - t) / APPROACH;
      if (p < -0.02) {
        if (n.el.style.display !== 'none') n.el.style.display = 'none';
        if (n.prop) n.prop.style.display = 'none';
        continue;
      }
      if (n.el.style.display !== 'grid') n.el.style.display = 'grid';
      var x = startX + (targetX - startX) * p;
      n.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      n.el.style.opacity = p > 1 ? Math.max(0, 1 - (p - 1) / 0.32).toFixed(2) : Math.min(1, Math.max(0, p / 0.12 + 0.25)).toFixed(2);
      n.el.classList.toggle('near', Math.abs(p - 1) < 0.085);
      if (n.prop && n.prop.dataset.done !== '1') paintProp(n.prop, n.type, p);
    }
    if (t > ses.chart.total) { finishSession(); return; }
    ses.raf = requestAnimationFrame(loop);
  }

  // 무대 위 고양이·장애물: 오른쪽에서 슈가 발치까지 걸어온다.
  function paintProp(prop, type, p) {
    if (p < 0 || p > 1.06) { if (prop.style.display !== 'none') prop.style.display = 'none'; return; }
    if (prop.style.display !== 'block') prop.style.display = 'block';
    var from = 104, to = 52;                       // scene 기준 % (슈가는 가운데)
    var left = from + (to - from) * Math.min(1, p);
    var size = 0.72 + 0.38 * Math.min(1, p);
    var bob = type === 'cat' ? Math.sin(p * 16) * 2.4 : 0;
    prop.style.left = left.toFixed(1) + '%';
    prop.style.transform = 'translate(-50%,' + bob.toFixed(1) + 'px) scale(' + size.toFixed(3) + ')';
    prop.style.opacity = p > 1 ? Math.max(0, (1.06 - p) / 0.06).toFixed(2) : '1';
    prop.classList.toggle('near', p > 0.88);
  }

  function paintDots() {
    if (!ses) return;
    var dots = $('lDots').children, firstOpen = -1;
    for (var i = 0; i < ses.notes.length; i++) { if (!ses.notes[i].judged) { firstOpen = i; break; } }
    for (var d = 0; d < dots.length; d++) {
      dots[d].className = ses.notes[d] && ses.notes[d].judged ? 'done' : d === firstOpen ? 'current' : '';
    }
  }
  function paintCount() {
    if (!ses) return;
    $('lCount').textContent = '노트 ' + ses.judged + ' / ' + ses.notes.length + (ses.combo >= 2 ? ' · 콤보 ' + ses.combo : '');
  }

  function flashJudge(text, kind) {
    var el = $('lJudge');
    el.textContent = text;
    el.className = 'judge-flash';
    void el.offsetWidth;
    el.className = 'judge-flash ' + kind;
    var target = $('target');
    target.className = 'target-zone ' + kind;
    setTimeout(function () { if (target.className !== 'target-zone') target.className = 'target-zone'; }, 240);
  }
  function sparkle(count, kind) {
    var layer = $('lSparks');
    for (var i = 0; i < count; i++) {
      var s = document.createElement('span');
      var ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      var dist = 46 + Math.random() * 52;
      s.className = 'spark' + (kind === 'mint' ? ' mint' : '');
      s.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(1) + 'px');
      s.style.setProperty('--dy', (Math.sin(ang) * dist * 0.75).toFixed(1) + 'px');
      layer.appendChild(s);
      (function (node) { setTimeout(function () { node.remove(); }, 700); })(s);
    }
  }
  function setPose(pose, snap) {
    T.showDancer($('lDancer'), T.get().worn, pose);
    $('lPose').textContent = T.POSES[pose];
    var img = $('lDancer');
    if (snap) { img.classList.remove('snap', 'wobble', 'hop', 'leap'); void img.offsetWidth; img.classList.add('snap'); }
  }
  function wobble() {
    var img = $('lDancer');
    img.classList.remove('wobble', 'snap', 'hop', 'leap'); void img.offsetWidth; img.classList.add('wobble');
    $('lPose').textContent = '휘청!';
  }
  // 고양이는 사뿐히 폴짝, 장애물은 크게 도약.
  function hopOver(kind) {
    var img = $('lDancer');
    img.classList.remove('snap', 'wobble', 'hop', 'leap'); void img.offsetWidth;
    img.classList.add(kind === 'jump' ? 'leap' : 'hop');
  }
  var bubbleTimer = 0;
  function bubble(text, kind) {
    var el = $('lBubble');
    el.textContent = text;
    el.className = 'bubble on' + (kind ? ' ' + kind : '');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { el.className = 'bubble'; }, 1500);
  }
  function cue(text) { $('lFeedback').textContent = text; }
  function comboBump() {
    var badge = $('lCombo');
    if (ses.combo < 2) { badge.hidden = true; return; }
    badge.hidden = false;
    badge.querySelector('b').textContent = ses.combo;
    badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop');
  }
  function advancePose(over) {
    ses.poseIdx = (ses.poseIdx + 1) % ses.poses.length;
    setPose(ses.poses[ses.poseIdx], !over);
    if (over) hopOver(over);
  }

  function clearProp(n) {
    if (!n.prop || n.prop.dataset.done === '1') return;
    n.prop.dataset.done = '1';
    n.prop.classList.add('clear');
    setTimeout(function () { if (n.prop) n.prop.style.display = 'none'; }, 420);
  }
  function bonkProp(n) {
    if (!n.prop || n.prop.dataset.done === '1') return;
    n.prop.dataset.done = '1';
    n.prop.classList.add('bonk');
    setTimeout(function () { if (n.prop) n.prop.style.display = 'none'; }, 520);
  }

  function hitNote(n, verdict) {
    n.judged = true; n.result = verdict; ses.judged++;
    if (verdict === 'perfect') ses.perfect++; else ses.good++;
    ses.combo++;
    if (ses.combo > ses.maxCombo) ses.maxCombo = ses.combo;
    if (n.type !== 'beat') clearProp(n);
    advancePose(n.type === 'beat' ? '' : n.type);
    if (verdict === 'perfect') {
      flashJudge('PERFECT!', 'perfect'); sparkle(10, 'gold'); tone('perfect');
      if (n.type === 'cat') bubble('야옹! 같이 폴짝 🐱', 'happy');
      else if (n.type === 'jump') bubble('장애물 위로 붕! 🦋', 'happy');
      cue(book.pickLine('perfect', n.type));
    } else {
      flashJudge('GOOD!', 'good'); sparkle(5, 'mint'); tone('good');
      cue(book.pickLine('good', n.type));
    }
    comboBump(); paintDots(); paintCount();
  }
  function missNote(n, why) {
    n.judged = true; n.result = 'miss'; ses.judged++;
    if (ses.shields > 0) {
      ses.shields--;
      ses.good++; ses.combo++;
      if (ses.combo > ses.maxCombo) ses.maxCombo = ses.combo;
      if (n.type !== 'beat') clearProp(n);
      advancePose(n.type === 'beat' ? '' : n.type);
      flashJudge('살짝 구했어요!', 'good'); sparkle(4, 'mint'); tone('good');
      cue(book.pickLine('shield', n.type));
      comboBump(); paintDots(); paintCount();
      return;
    }
    ses.miss++; ses.combo = 0;
    if (n.type !== 'beat') bonkProp(n);
    wobble(); flashJudge('삐끗!', 'miss'); tone('miss');
    var jokes = n.type === 'cat'
      ? ['야웅… 고양이가 밟고 갔어요 🐱', '고양이가 ' + T.nick() + '님 리본을 물었어요 🎀', '고양이 앞에서 중심을 잃었어요 😹']
      : n.type === 'jump'
        ? ['튜튜가 장애물에 걸렸어요! 🚧', '도약은 했는데 장애물이 더 높았어요 😵', '장애물이 오늘따라 커 보여요 🧱']
        : ['발끝이 잠깐 미끄러졌어요 😅', '음악이 살짝 모르는 척했어요 🎵'];
    bubble(jokes[Math.floor(Math.random() * jokes.length)], 'sad');
    cue(why === 'wrong' ? book.pickLine('wrong', n.type) : book.pickLine('late', n.type));
    comboBump(); paintDots(); paintCount();
  }

  function pressMove(move, soft) {
    if (!ses || ses.finished) return;
    var btn = $('pad').querySelector('[data-move="' + move + '"]');
    if (btn) { btn.classList.remove('on'); void btn.offsetWidth; btn.classList.add('on'); setTimeout(function () { btn.classList.remove('on'); }, 120); }
    if (!ses.musicStarted) ses.musicStarted = startMusic(ses.chart, performance.now() - p0);
    var t = nowMs(), best = null, bestAbs = Infinity, upcoming = null;
    for (var i = 0; i < ses.notes.length; i++) {
      var n = ses.notes[i];
      if (n.judged) continue;
      var dt = t - n.t;
      if (dt < -ses.window.good) { upcoming = n; break; }
      if (dt > ses.window.good) continue;
      var abs = Math.abs(dt);
      if (abs < bestAbs) { best = n; bestAbs = abs; }
    }
    if (best) {
      if (best.type === move) hitNote(best, bestAbs <= ses.window.perfect ? 'perfect' : 'good');
      else if (soft) tone('tap');          // 트랙을 살짝 누른 건 벌하지 않아요.
      else missNote(best, 'wrong');
      return;
    }
    if (upcoming && upcoming.type === move && upcoming.t - t < ses.window.good * 2) {
      cue(book.pickLine('early', move));
      $('lPose').textContent = '한 박자 기다려요';
      return;
    }
    tone('tap');
  }

  async function finishSession() {
    if (!ses || ses.sending) return;
    ses.sending = true;
    var run = ses.run;
    var score = {
      perfect: ses.perfect, good: ses.good, miss: ses.miss, maxCombo: ses.maxCombo, notes: ses.notes.length,
      comboCoins: Math.floor(ses.maxCombo / 4) * 2 * ses.comboRate,
      noteCoins: ses.noteCoins * (ses.perfect + ses.good)
    };
    ses.finished = true;
    if (ses.raf) cancelAnimationFrame(ses.raf);
    stopMusic();
    var receipt = null, stats = classes[ses.kind].stats;
    busy = true;
    try {
      receipt = await T.updateWallet(function (s) { return T.finishRhythm(s, stats, score); });
    } finally { busy = false; }
    ses = null;
    refresh();
    if (receipt && receipt.levelUp) {
      dialogs.forEach(function (id) { if ($(id).open) $(id).close(); });
      showLevelUp(receipt.levelUp, function () { routeTo('#completed', true); });
      return;
    }
    if (receipt) { routeTo('#completed', true); return; }
    renderRoute();
  }

  /* ================= 레벨업 보상 카드 ================= */
  var levelBusy = false;
  function showLevelUp(info, done) {
    var spirit = T.SPIRITS[teachers[info.level === 2 ? 'bar' : info.level === 3 ? 'center' : 'piece']];
    var who = T.nick();
    var lines = {
      2: '두 번의 수업으로 견습 발레리나가 됐어요. 무대가 조금 더 가까워졌어요!',
      3: '군무를 지나 ' + who + '님이 코르 드 발레로 무대에 서요. 조명이 한 줄 더 켜졌어요.',
      4: '솔리스트! 이제 단독 무대의 조명이 ' + who + '님을 비춰요.',
      5: '👑 프리마 발레리나! 왕립 발레단의 별이 ' + who + '님의 이름을 불렀어요. 스튜디오 기록이 가득 찼어요.'
    };
    $('gTitle').textContent = 'Lv.' + info.level + ' ' + info.name;
    $('gKicker').textContent = info.level >= 5 ? '👑 프리마 승급 · ' + T.fmt(T.get().classes) + '번째 수업'
      : info.levels && info.levels.length > 1 ? '밀린 승급 보상' : '승급 · ' + T.fmt(T.get().classes) + '번째 수업을 마쳤어요';
    $('gLine').textContent = (lines[info.level] || '새로운 레벨이에요!') + ' ' + spirit.name + '가 축하 인사를 건네요.';
    $('gCoins').textContent = '+' + T.fmt(info.coins) + ' 코인';
    var dress = info.dress ? T.dressOf(info.dress) : null;
    $('gOutfit').hidden = !dress;
    if (dress) {
      T.showDancer($('gDancer'), dress.id, 'curtsy');
      $('gOutfitName').textContent = dress.name;
      $('gOutfitNote').textContent = 'Lv.' + info.level + ' 승급 해금 · 드레스룸에서 바로 입을 수 있어요.';
      $('gDress').href = '../dressroom/?v=' + T.V + '#' + dress.id;
      $('gDress').textContent = '입어 보기';
    } else if (info.gift === 'coins') {
      $('gOutfit').hidden = true;
    }
    $('gTier').textContent = info.level >= 5 ? '👑' : new Array(info.level + 1).join('★');
    $('levelup').classList.toggle('prima', info.level >= 5);
    if (!$('levelup').open) $('levelup').showModal();
    var button = $('gGo');
    levelBusy = false;
    button.onclick = async function () {
      if (levelBusy) return;
      levelBusy = true;
      button.disabled = true;
      try { await T.ackLevelUp(); } finally { levelBusy = false; button.disabled = false; }
      $('levelup').close();
      refresh();
      if (done) done();
      else renderRoute();
    };
  }

  /* ================= 결과 카드 ================= */
  function renderResult(r) {
    var s = T.get(), lv = T.level(), c = classes[r.kind], goal = T.nextDress();
    var key = r.lessonId || 'receipt';
    if (lastReceipt !== key) { $('rDetails').open = false; $('rAnnounce').textContent = ''; lastReceipt = key; }
    $('rCourse').textContent = c.name + ' 수료';
    $('rTitle').textContent = '+' + T.fmt(r.coins) + '코인 적립';
    $('rBalance').textContent = Number.isFinite(r.before) && Number.isFinite(r.after)
      ? '수료 당시 지갑 ' + T.fmt(r.before) + ' → ' + T.fmt(r.after) + '코인' : '현재 지갑 ' + T.fmt(s.coins) + '코인';
    var parts = [];
    if (Number.isFinite(r.baseCoins)) parts.push('기본 ' + r.baseCoins);
    if (r.comboCoins) parts.push('콤보 ' + r.comboCoins);
    if (r.noteCoins) parts.push('알레 ' + r.noteCoins);
    $('rCoinsDetail').hidden = parts.length < 2;
    $('rCoinsDetail').textContent = parts.join(' + ') + '코인';
    $('rPerfect').textContent = r.perfect || 0;
    $('rGood').textContent = r.good || 0;
    $('rMiss').textContent = r.miss || 0;
    $('rCombo').textContent = r.maxCombo || 0;
    T.showDancer($('rDancer'), s.worn, s.kingdom.prepared ? 'arabesque' : (r.miss > 0 ? 'releve' : 'curtsy'));
    var gift = r.gift && T.dressOf(r.gift);
    $('rWear').dataset.gift = gift ? gift.id : '';
    $('rWear').hidden = true; $('rGoalLink').hidden = true; $('rTrack').hidden = true;
    if (gift) {
      var wearing = s.worn === gift.id;
      $('rMilestone').textContent = '첫 수업 선물';
      $('rGoalName').textContent = gift.name;
      $('rGoalNote').textContent = wearing ? T.nick() + '님이 새 스커트로 갈아입었어요.' : '옷장에 도착했어요. ' + T.nick() + '님께 입혀 볼까요?';
      $('rWear').hidden = wearing;
    } else if (r.classesAfter === 5 || !goal && T.stageReady()) {
      $('rMilestone').textContent = '왕립 극장 초대장';
      $('rGoalName').textContent = '잠자는 숲속의 ' + T.nick();
      $('rGoalNote').textContent = '오늘 입은 의상으로 리허설 무대에 올라요.';
      $('rGoalLink').textContent = '리허설 무대로'; $('rGoalLink').href = '../stage/?v=' + T.V + '#rehearsal'; $('rGoalLink').hidden = false;
    } else if (goal) {
      var left = Math.max(0, goal.price - s.coins);
      $('rMilestone').textContent = '다음 의상';
      $('rGoalName').textContent = goal.name;
      $('rGoalNote').textContent = left ? T.fmt(left) + '코인 더 모으면 입을 수 있어요.' : '모은 코인으로 지금 살 수 있어요.';
      $('rTrack').hidden = false; $('rTrackFill').style.width = Math.min(100, s.coins / goal.price * 100) + '%';
      $('rGoalLink').textContent = left ? '미리 입어보기' : '드레스룸에서 입기';
      $('rGoalLink').href = '../dressroom/?v=' + T.V + '#' + goal.id; $('rGoalLink').hidden = false;
    } else {
      $('rMilestone').textContent = T.nick() + '의 연습 기록';
      $('rGoalName').textContent = lv.name; $('rGoalNote').textContent = '지금까지 수업 ' + s.classes + '회 수료';
    }
    $('rRecord').textContent = '출석 도장 +1 · 왕국 생명력 +' + r.life + ' · ' + lv.name + (lv.next ? ' (다음 레벨까지 ' + (lv.need - lv.have) + '번)' : '');
    $('rStamp').textContent = '도장 · 바 ' + s.stamps.bar + ' · 센터 ' + s.stamps.center + ' · 작품 ' + s.stamps.piece +
      (T.stageReady() ? '' : ' · 왕립 극장까지 ' + T.stageLeft() + '개');
    $('rGains').textContent = Object.keys(r.stats || {}).map(function (k) { return T.STATS[k].label + ' +' + r.stats[k]; }).join(' · ');
    $('rPotion').hidden = !r.potion;
    if (r.potion) $('rPotion').textContent = '사용한 포션 · ' + T.STAFF[r.potion.id].name + ' · ' + T.effectFor(r.potion.id, r.potion.level).label;
    $('rRefund').hidden = !r.refund;
    if (r.refund) $('rRefund').textContent = '이전에 맡긴 예약금 ' + r.refund + '코인도 돌려받았어요.';
    $('rStage').textContent = T.stageReady() ? '왕립 극장 가기' : '왕립 극장 · 도장 ' + T.stageLeft() + '개';
    showDialog('result');
  }

  /* ================= 라우트 ================= */
  function renderRoute() {
    var hash = location.hash, s = T.get(), run = s.lesson, receipt = s.kingdom.receipt;
    if (hash === '#first-bar') { enroll('bar'); return; }
    if (hash === '#lesson' && run) {
      if (run.rounds) { migrateLegacy(run); return; }
      if (!ses || ses.id !== run.id) startSession(run);
      else if (!$('lesson').open) showDialog('lesson');
      return;
    }
    if (hash === '#lesson' && receipt && receipt.lessonId && lastReceipt && receipt.lessonId === lastReceipt) { routeTo('#completed', true); return; }
    if (hash.startsWith('#class-')) {
      if (run) { routeTo('#lesson', true); return; }
      var kind = hash.slice(7);
      if (Object.hasOwn(classes, kind)) { confirmCourse(kind); return; }
    }
    if (hash === '#completed' && receipt) { renderResult(receipt); return; }
    stopSession();
    showDialog(null);
  }

  $('classes').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cls]');
    if (b) routeTo(T.get().lesson ? '#lesson' : '#class-' + b.dataset.cls);
  });
  $('resumeLesson').addEventListener('click', function () { routeTo('#lesson'); });
  $('cGo').addEventListener('click', function () { audio(); applySound(); enroll(location.hash.slice(7)); });
  $('cCancel').addEventListener('click', closeToStudio);
  $('lPause').addEventListener('click', closeToStudio);
  $('lSound').addEventListener('click', function () {
    soundOn = !soundOn; saveSound(); audio(); applySound();
    if (ses && !ses.musicStarted) ses.musicStarted = startMusic(ses.chart, performance.now() - p0);
  });
  $('pad').addEventListener('click', function (e) {
    var b = e.target.closest('[data-move]');
    if (b) pressMove(b.dataset.move);
  });
  $('track').addEventListener('pointerdown', function (e) { e.preventDefault(); pressMove('beat', true); });
  document.addEventListener('keydown', function (e) {
    if (!$('lesson').open || !ses) return;
    if (e.code === 'Space' || e.key === '1') { e.preventDefault(); pressMove('beat'); }
    else if (e.key === '2') { e.preventDefault(); pressMove('cat'); }
    else if (e.key === '3') { e.preventDefault(); pressMove('jump'); }
  });
  $('rAgain').addEventListener('click', function () { enroll(T.get().kingdom.receipt.kind); });
  $('rWear').addEventListener('click', async function () {
    if (busy) return;
    var gift = $('rWear').dataset.gift;
    if (!gift) return;
    busy = true;
    var worn;
    try { worn = await T.updateWallet(function () { return T.wear(gift); }); } finally { busy = false; }
    if (worn.ok) $('rAnnounce').textContent = T.nick() + '님이 ' + worn.item.name + ' 차림으로 갈아입었어요.';
    refresh(); renderRoute();
    $('rAgain').focus({ preventScroll: true });
  });
  dialogs.forEach(function (id) {
    $(id).addEventListener('cancel', function (e) { e.preventDefault(); closeToStudio(); });
    $(id).addEventListener('click', function (e) { if (e.target === $(id)) closeToStudio(); });
  });
  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('sugartown:refresh', function () { refresh(); renderRoute(); });
  document.addEventListener('visibilitychange', function () {
    if (!ses) return;
    if (document.visibilityState === 'hidden') ses.interrupted = true;
    else if (ses.interrupted) { ses.interrupted = false; var run = ses.run; startSession(run); }
  });

  // 검증 도구가 읽는 공개 상태 (읽기 전용).
  window.__rhythm = {
    now: nowMs,
    notes: function () { return ses ? ses.notes.map(function (n) { return { t: n.t, type: n.type, judged: n.judged, result: n.result }; }) : []; },
    score: function () { return ses ? { perfect: ses.perfect, good: ses.good, miss: ses.miss, maxCombo: ses.maxCombo, window: ses.window, shields: ses.shields } : null; },
    audio: function () { return actx ? { state: actx.state, time: actx.currentTime, sound: soundOn } : null; },
    music: function () {
      var m = band && band.info();
      return ses ? { started: ses.musicStarted, scheduled: m ? m.scheduled : 0, total: m ? m.total : 0, song: ses.chart.song || ses.kind } : null;
    },
    props: function () {
      return ses ? ses.notes.filter(function (n) { return n.prop; }).map(function (n) {
        return { type: n.type, judged: n.judged, left: n.prop.style.left, shown: n.prop.style.display !== 'none' };
      }) : null;
    }
  };

  refresh(); renderRoute();
  // 지난번에 받지 못한 레벨업 보상이 있으면 한 번만 보여 준다.
  (function () {
    var pending = T.get().levelUp;
    if (!pending || location.hash) return;
    setTimeout(function () { if (!ses && !$('result').open && !$('lesson').open) showLevelUp(pending); }, 350);
  })();
})();
