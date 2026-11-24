(function () {
  'use strict';
  var T = window.SugarTown, book = window.SugarLessons;
  var classes = book.classes, MOVES = book.MOVES;
  var $ = function (id) { return document.getElementById(id); };
  var teachers = { bar: 'etu', center: 'piru', piece: 'ara' };
  var dialogs = ['confirm', 'lesson', 'result', 'modes', 'gameover'];
  var APPROACH = 2300;              // 노트가 무대 오른쪽 끝에서 스포트라이트까지 걸어오는 시간(ms)
  var MARK = 50;                    // 판정 지점(무대 폭 %) = 슈가의 발밑 중심
  var IDLE_POSE = 'ready';
  var busy = false, lastReceipt = null, ses = null, p0 = 0;
  var DIFF_KEY = 'sugartown.preview.difficulty';

  /* ================= 난이도 · HP 서바이벌 · 프리패스 =================
     같은 곡이라도 모드에 따라 노트가 다가오는 속도(approach), 판정 창(window 배율),
     한 번 놓칠 때 잃는 HP(damage)가 실제로 달라진다. */
  var MODES = {
    easy: {
      key: 'easy', label: 'HEALING', title: '편안하게 춤추기',
      note: '느린 노트 · 넉넉한 판정 · 실패 없이 끝까지',
      approach: 2900, window: 1.4, damage: 0
    },
    normal: {
      key: 'normal', label: 'NORMAL', title: '정확한 박자에 도전',
      note: '기본 속도 · 기준 판정 · 콤보 중심',
      approach: 2300, window: 1, damage: 0
    },
    hard: {
      key: 'hard', label: 'CHALLENGE', title: '무대 실력에 도전',
      note: '노트가 쏜살같이 · 판정 타이트 · 놓치면 HP -30',
      approach: 1700, window: 0.72, damage: 30
    }
  };
  // 의상마다 체력이 조금 더 버틴다. (기본 100 + 의상 보너스)
  var OUTFIT_HP = { basic: 0, lilac: 6, swan: 12, black: 12, sugar: 20 };
  // BALLET FREE PASS 네 조각: 세 코스 + 왕립 극장 공연
  var PASS_PIECES = [
    { key: 'bar', label: '레슨 바 워크', seal: '①', done: function (s) { return (s.stamps.bar || 0) > 0; } },
    { key: 'center', label: '발레웨어 센터 워크', seal: '②', done: function (s) { return (s.stamps.center || 0) > 0; } },
    { key: 'piece', label: '발레슈즈 작품반', seal: '③', done: function (s) { return (s.stamps.piece || 0) > 0; } },
    { key: 'show', label: '공연 왕립 극장', seal: '④', done: function (s) { return (s.shows || 0) > 0; } }
  ];
  var KIND_PIECE = { bar: '레슨 바 워크', center: '발레웨어 센터 워크', piece: '발레슈즈 작품반' };
  var pendingKind = null, deadMode = false, lastSurvived = null;

  function readMode() {
    try { var id = localStorage.getItem(DIFF_KEY); return MODES[id] ? id : 'normal'; } catch (e) { return 'normal'; }
  }
  function saveMode(id) {
    try { localStorage.setItem(DIFF_KEY, MODES[id] ? id : 'normal'); } catch (e) { /* 기억하지 못해도 이번 수업은 진행돼요. */ }
  }

  /* ================= 소리 ================= */
  var soundOn = readSound();
  var actx = null, master = null, musicBus = null, sfxBus = null;

  function readSound() { try { return localStorage.getItem('sugartown.preview.sound') !== '0'; } catch (e) { return true; } }
  function saveSound() { try { localStorage.setItem('sugartown.preview.sound', soundOn ? '1' : '0'); } catch (e) { /* 소리 설정은 남지 않아도 돼요. */ } }
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
    else if (kind === 'great') { [880, 1108.7, 1318.5].forEach(function (f, i) { piano(f, at + i * 0.05, 0.46, 0.15, sfxBus); }); }
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
    var started = band.start(chart.song || PROG_SONG[ses.kind] || 'bar', Math.max(0, elapsed || 0));
    if (started && ses) ses.audioZero = band.startedAt();
    return started;
  }
  function stopMusic() { if (band) band.stop(); }
  function applySound() {
    var b = $('lSound');
    b.textContent = soundOn ? '🔊 음악' : '🔇 무음';
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
      var chart = book.buildChart(kind, s.stamps[kind] || 0);
      var count = chart && chart.notes ? chart.notes.length : 0;
      return '<button class="cls" data-cls="' + kind + '" type="button"' + (waiting ? ' disabled' : '') + '>' +
        '<img src="' + T.spiritArt(sp, true) + '" alt=""><span class="course-info"><strong>' + c.name + '</strong>' +
        '<small>' + T.SPIRITS[sp].name + ' 선생님 · ' + count + '노트 · ' + Object.keys(c.stats).map(function (k) { return T.STATS[k].label; }).join('·') + '</small></span>' +
        '<b class="course-prize">+' + T.fmt(prize) + '코인</b><span aria-hidden="true">›</span></button>';
    }).join('');
    renderMates(s);
    renderPass(s);
    renderBuffs();
    T.syncUI();
  }

  /* ================= 지금 걸린 효과 배지 ================= */
  function renderBuffs() {
    var host = $('buffStrip');
    if (!host) return;
    var list = T.activeBuffs();
    host.hidden = !list.length;
    host.innerHTML = list.length
      ? '<span class="buff-strip-lead">지금 걸린 기운</span>' + list.map(function (b) {
        return '<span class="buff-chip ' + b.kind + '"><i aria-hidden="true">' + b.icon + '</i><b>' + b.name + '</b><small>' + b.chips.join(' · ') + '</small></span>';
      }).join('')
      : '';
  }

  /* ================= BALLET FREE PASS 4조각 ================= */
  function passPieces(s) {
    s = s || T.get();
    return PASS_PIECES.map(function (p) {
      return { key: p.key, label: p.label, seal: p.seal, done: !!p.done(s) };
    });
  }
  function passChip(p) {
    return '<li class="pass-piece' + (p.done ? ' done' : '') + '"><span class="pass-seal">' + (p.done ? '✓' : p.seal) +
      '</span><span class="pass-text"><b>' + p.label + '</b><small>' + (p.done ? '조각 획득' : '아직 비어 있음') + '</small></span></li>';
  }
  function passCountOf(pieces) { return pieces.filter(function (p) { return p.done; }).length; }
  function renderPass(s) {
    var pieces = passPieces(s), got = passCountOf(pieces);
    $('passCount').textContent = got + ' / 4';
    $('passBar').style.width = (got / 4 * 100) + '%';
    $('passList').innerHTML = pieces.map(passChip).join('');
    var next = pieces.filter(function (p) { return !p.done; })[0];
    $('passNote').textContent = got >= 4
      ? '네 조각 완성! 왕립 극장 발레 프리패스가 열렸어요 🎟️'
      : '조각 ' + (4 - got) + '개 남았어요. ' + (next ? '‘' + next.label + '’ 완주로 한 조각이 채워져요.' : '');
  }

  /* ================= 난이도 선택 ================= */
  function askMode(kind) {
    if (!Object.hasOwn(classes, kind)) { closeToStudio(); return; }
    pendingKind = kind;
    var got = passCountOf(passPieces());
    $('mCourse').textContent = classes[kind].name;
    $('mPass').innerHTML = '지금 모은 프리패스 조각 <b>' + got + ' / 4</b>' +
      (got >= 4 ? ' · 이미 네 조각을 다 모았어요!' : '');
    var picked = readMode();
    Array.prototype.forEach.call($('mOptions').children, function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.mode === picked ? 'true' : 'false');
    });
    showDialog('modes');
  }
  function pickMode(id) {
    if (!MODES[id] || busy) return;
    saveMode(id);
    var kind = pendingKind;
    pendingKind = null;
    deadMode = false;
    if (!kind) { closeToStudio(); return; }
    enroll(kind);
  }

  /* ================= HP 100 서바이벌 ================= */
  function maxHPFor(s) {
    s = s || T.get();
    return 100 + (OUTFIT_HP[s.worn] || 0);
  }
  function paintHP() {
    if (!ses) return;
    var pct = Math.max(0, Math.min(100, ses.hp / ses.maxHP * 100));
    $('lHpBar').style.width = pct.toFixed(1) + '%';
    $('lHpText').textContent = Math.max(0, Math.round(ses.hp)) + ' / ' + ses.maxHP;
    var danger = ses.hp <= 25;
    $('lHpRow').classList.toggle('danger', danger);
    $('lVignette').classList.toggle('on', danger);
    $('lHpAlert').hidden = !danger;
    $('lHpMode').textContent = (MODES[ses.mode] || MODES.normal).label;
    var sh = $('lHpShield');
    sh.hidden = !(ses.shields > 0);
    if (ses.shields > 0) sh.textContent = '🛡 ' + ses.shields;
  }
  function warn(text, loss) {
    var el = $('lWarn');
    if (!el) return;
    el.innerHTML = '<b>' + text + '</b>' + (loss ? '<small>HP -' + loss + '</small>' : '');
    el.className = 'warn-bubble';
    void el.offsetWidth;
    el.className = 'warn-bubble on';
  }
  function hurtHP(loss, text) {
    if (!ses || ses.dead || loss <= 0) return;
    ses.hp = Math.max(0, ses.hp - loss);
    paintHP();
    warn(text, loss);
    var row = $('lHpRow');
    row.classList.remove('hurt'); void row.offsetWidth; row.classList.add('hurt');
    var scene = $('lScene');
    if (scene) { scene.classList.remove('hurt'); void scene.offsetWidth; scene.classList.add('hurt'); }
    if (ses.hp <= 0) gameOver();
  }

  /* ================= HP 0 · YOU DIED ================= */
  function gameOver() {
    if (!ses || ses.dead) return;
    ses.dead = true;
    ses.finished = true;
    if (ses.raf) { cancelAnimationFrame(ses.raf); ses.raf = 0; }
    stopMusic();
    var info = {
      kind: ses.kind, mode: ses.mode, damage: ses.damage,
      judged: ses.judged, notes: ses.notes.length
    };
    if ($('lScene')) $('lScene').classList.remove('playing');
    warn('💀 체력이 바닥났어요!');
    deadMode = true;
    renderGameover(info);
    setTimeout(function () {
      if (!deadMode) return;
      stopSession();
      showDialog('gameover');
    }, 420);
  }
  function renderGameover(info) {
    var m = MODES[info.mode] || MODES.normal;
    $('goSub').textContent = classes[info.kind].name + ' · ' + m.label + ' 모드 (놓칠 때마다 HP -' + info.damage + ')' +
      ' · 노트 ' + info.judged + ' / ' + info.notes;
    $('goPass').textContent = 'BALLET FREE PASS ' + passCountOf(passPieces()) + ' / 4';
  }

  /* ================= 함께 연습할 정령 ================= */
  function renderMates(s) {
    var mate = s.practiceWith;
    $('mates').innerHTML = T.BOND_IDS.map(function (id) {
      var spirit = T.SPIRITS[id], bond = T.bondOf(id);
      return '<button class="mate" type="button" data-mate="' + id + '" aria-pressed="' + (mate === id) + '" style="--tint:' + spirit.color + '" aria-label="' + spirit.name + '와 함께 연습하기">' +
        '<span class="mate-face"><img src="' + T.spiritArt(id, true) + '" alt=""></span>' +
        '<b>' + spirit.name + '</b>' + T.heartsHTML(bond.level, 'mate-hearts') + '</button>';
    }).join('');
    $('mateNote').textContent = mate
      ? T.SPIRITS[mate].name + '와 함께 · ' + T.practicePower('bar', s).label
      : '완주하면 선생님과 친밀도 +1';
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
    deadMode = false;
    pendingKind = null;
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
    var chart = book.buildChart(kind, s.stamps[kind] || 0);
    $('cKicker').textContent = '무료 수업 · ' + (chart ? chart.notes.length : 0) + '노트' + (song ? ' · ' + song.name : ' · ' + c.mood);
    $('cName').textContent = c.name;
    $('cDesc').textContent = c.desc;
    $('cReward').textContent = '+' + T.fmt(T.rewardFor(kind, potion).coins) + '코인';
    $('cNote').textContent = (!T.isOwned('lilac') ? '첫 수업 선물 · 라일락 쉬폰 스커트' :
      potion ? T.STAFF[potion.id].name + ' 포션을 들고 타요. ' + T.effectFor(potion.id, potion.level).label : '노트가 판정 원에 닿을 때 버튼을 누르면 돼요.') +
      ' 완주하면 ' + T.SPIRITS[teachers[kind]].name +
      (s.practiceWith && s.practiceWith !== teachers[kind] ? '와 ' + T.SPIRITS[s.practiceWith].name : '') + '와 더 가까워져요.';
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

  /* 정령마다 무대에서 도와주는 능력. 함께 연습할 정령을 고르면 이 힘이 실제로 발동한다. */
  function mateAbility(id) {
    if (!id || !T.SPIRITS[id]) return '';
    var sp = T.SPIRITS[id], text = (book.ABILITY && book.ABILITY[id]) || '';
    return sp.name + ' 능력 · ' + text;
  }
  function noteWindow(n) {
    var meal = (ses && ses.meal) || {};
    return ses.window.good + (meal.all || 0) + (meal[n.type] || 0);
  }
  function notePerfectWindow(n) {
    var meal = (ses && ses.meal) || {};
    return ses.window.perfect + Math.round(((meal.all || 0) + (meal[n.type] || 0)) / 2);
  }

  /* ================= 리듬 수업 ================= */
  function startSession(run) {
    stopSession();
    var chart = run.chart && run.chart.notes && run.chart.notes.length ? run.chart : book.buildChart(run.kind, 0);
    var s = T.get(), kind = run.kind, c = classes[kind], buffs = buffFor(s.kingdom.prepared, kind);
    var mode = MODES[readMode()] || MODES.normal;
    buffs.window.perfect = Math.round(buffs.window.perfect * mode.window);
    buffs.window.good = Math.round(buffs.window.good * mode.window);
    var power = T.practicePower(kind, s);
    buffs.window.good += power.timing;
    buffs.window.perfect = Math.min(buffs.window.good - 30, buffs.window.perfect + Math.floor(power.timing / 2) + power.perfect);
    buffs.comboRate *= power.combo;
    buffs.noteCoins += power.notes;
    buffs.shields += power.shields;
    var growth = [];
    if (power.timing) growth.push('성장 판정 +' + power.timing + 'ms');
    if (power.label) growth.push(power.label);
    if (buffs.line) growth.push(buffs.line);
    buffs.line = growth.join(' · ');
    /* 분식집·카페에서 주문한 메뉴의 버프. 다음 수업 한 번에 발동하고 사라진다. */
    var meal = s.kingdom.meal && s.kingdom.meal.buff ? s.kingdom.meal : null;
    var mealLine = '';
    if (meal) {
      buffs.comboRate += meal.buff.combo || 0;
      buffs.shields += meal.buff.shield || 0;
      var parts = [];
      var all = meal.buff.all || 0;
      if (all) parts.push('판정 +' + all + 'ms');
      ['cat', 'jump', 'beam', 'turn', 'beat'].forEach(function (k) {
        if (meal.buff[k]) parts.push((MOVES[k].label || '박자') + ' +' + meal.buff[k] + 'ms');
      });
      if (meal.buff.shield) parts.push('삐끗 ' + meal.buff.shield + '회 보호');
      if (meal.buff.combo) parts.push('콤보 +' + meal.buff.combo);
      if (meal.buff.heal) parts.push('HP +' + meal.buff.heal);
      if (meal.buff.coins) parts.push('코인 +' + meal.buff.coins);
      mealLine = (meal.kind === 'cafe' ? '☕ ' : '🍢 ') + meal.name + ' · ' + parts.join(' · ');
    }
    var ability = mateAbility(s.practiceWith);
    var lane = $('lProps');
    lane.replaceChildren();
    var notes = chart.notes.map(function (n, i) {
      var el = document.createElement('span');
      el.className = 'course-event ' + n.type;
      var mv = MOVES[n.type] || MOVES.beat;
      if (n.type === 'cat') el.textContent = '🐈';
      else if (n.type === 'turn') el.textContent = '↻';
      else if (n.type === 'beat') el.textContent = '♪';
      el.setAttribute('aria-hidden', 'true');
      el.dataset.label = mv.label;
      el.style.display = 'none';
      lane.appendChild(el);
      return { t: n.t, type: n.type, index: i, judged: false, result: null, el: el, prop: null };
    });
    $('lBar').style.width = '0%';
    $('lSparks').replaceChildren();
    $('lScene').classList.add('playing');
    $('lBubble').className = 'bubble';
    $('lBubble').textContent = '';
    $('lDancer').className = 'practice-dancer';
    if ($('lFx')) $('lFx').className = 'motion-fx';
    $('lJudge').textContent = '';
    $('lJudge').className = 'judge';
    $('lCombo').textContent = '콤보 0';
    $('lCombo').className = 'combo';
    $('lWarn').className = 'warn-bubble';
    $('lWarn').replaceChildren();
    $('lHpRow').classList.remove('hurt', 'danger');
    $('lVignette').classList.remove('on');
    $('lHpAlert').hidden = true;
    $('lBuff').hidden = !(buffs.line || mealLine || ability);
    $('lBuff').innerHTML = [ability ? '<b class="ability">' + ability + '</b>' : '', mealLine, buffs.line].filter(Boolean).join('<span class="buff-sep"> · </span>');
    $('lTitle').textContent = c.name;
    $('lPose').textContent = '준비 자세';
    var mate = s.practiceWith;
    var coachId = mate || teachers[kind];
    var face = $('lCoachFace'), coach = $('lCoach');
    if (face) {
      face.style.setProperty('--tint', T.SPIRITS[coachId].color);
      face.dataset.initial = T.SPIRITS[coachId].name.slice(0, 1);
    }
    if (coach) {
      var want = T.spiritArt(coachId, true);
      coach.classList.remove('ready');
      coach.alt = T.SPIRITS[coachId].name + ' 정령';
      coach.onload = function () { coach.classList.add('ready'); };
      coach.onerror = function () { coach.classList.remove('ready'); };
      if (coach.getAttribute('src') === want && coach.complete && coach.naturalWidth) coach.classList.add('ready');
      else coach.src = want;
    }
    Object.keys(T.POSES).forEach(function(pose){var img=new Image();img.src=T.dancerArt(s.worn,pose);});
    T.showDancer($('lDancer'), s.worn, IDLE_POSE);
    $('lDancer').className = 'practice-dancer';
    $('lJudgeLine').className = 'judge-line';
    $('lCue').className = 'now-cue';
    $('lScene').classList.toggle('stage-mode', !!c.stageMode);
    $('lFeedback').textContent = '노트가 빛나는 링에 닿는 순간, 노트와 같은 동작을 눌러요!';
    var hpMax = maxHPFor(s) + (meal && meal.buff.heal ? meal.buff.heal : 0);
    ses = {
      run: run, id: run.id, kind: kind, chart: chart, notes: notes,
      mode: mode.key, approach: mode.approach, damage: mode.damage,
      hp: hpMax, maxHP: hpMax, dead: false,
      judged: 0, combo: 0, maxCombo: 0, perfect: 0, great: 0, good: 0, miss: 0,
      shields: buffs.shields, comboRate: buffs.comboRate, noteCoins: buffs.noteCoins, window: buffs.window,
      meal: meal ? meal.buff : {}, moveAt: -1, beatPose: 'plie', finished: false, sending: false,
      musicStarted: false, raf: 0, interrupted: false
    };
    paintDots();
    paintCount();
    $('lHpRow').hidden = mode.key !== 'hard';
    paintHP();
    applySound();
    var greet = T.SPIRITS[mate || teachers[kind]];
    if (greet && greet.cheer && greet.cheer.length) {
      var mine = ses, hello = String(greet.cheer[0]).replace(/\{n\}/g, T.nick());
      setTimeout(function () { if (ses === mine) bubble(hello, 'happy'); }, 600);
    }
    p0 = performance.now();
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

  function nowMs() { return ses && actx && Number.isFinite(ses.audioZero) ? (actx.currentTime - ses.audioZero)*1000 : performance.now() - p0; }

  function loop() {
    if (!ses || ses.finished) return;
    if (!ses.musicStarted && actx && actx.state === 'running') ses.musicStarted = startMusic(ses.chart, Math.max(0, nowMs()));
    var t = nowMs();
    var hot = false, pre = false, hotNote = null, hotDelta = Infinity;
    for (var i = 0; i < ses.notes.length; i++) {
      var n = ses.notes[i];
      var p = 1 - (n.t - t) / ses.approach;
      if (n.judged) {
        if (n.el.style.display !== 'none' && !n.el.classList.contains('popped')) n.el.style.display = 'none';
        continue;
      }
      if (t - n.t > noteWindow(n) + 20) { missNote(n, 'late'); continue; }
      if (p < -0.04) {
        if (n.el.style.display !== 'none') n.el.style.display = 'none';
        continue;
      }
      if (n.el.style.display !== 'grid') n.el.style.display = 'grid';
      /* 아이콘은 무대 오른쪽 끝에서 슈가 발밑 스포트라이트까지 같은 속도로 다가온다. */
      var left = 115 + (MARK - 115) * Math.min(p, 1.7);
      n.el.style.left = left.toFixed(1) + '%';
      n.el.style.opacity = Math.min(1, Math.max(0, 0.45 + p * 2)).toFixed(2);
      var w = noteWindow(n), delta = Math.abs(n.t - t);
      if (p > 0 && delta <= w) {
        hot = true;
        if (delta < hotDelta) { hotDelta = delta; hotNote = n; }
      }
      if (p > 0 && delta <= w + 300 && delta > w) pre = true;
    }
    ses.notes.forEach(function (n) { if (n.el) n.el.classList.toggle('hot', !n.judged && n === hotNote); });
    var line = $('lJudgeLine');
    line.classList.toggle('hot', hot);
    line.classList.toggle('pre', !hot && pre);
    line.classList.toggle('great', hot && ses.combo >= 5);
    var cue = $('lCue');
    if (hot && hotNote) {
      if (ses.moveAt !== hotNote.index) {
        ses.moveAt = hotNote.index;
        cue.textContent = (MOVES[hotNote.type].label || '박자') + '!';
      }
      cue.classList.add('on');
    } else {
      ses.moveAt = -1;
      cue.classList.remove('on');
    }
    var next = null;
    for (var k = 0; k < ses.notes.length; k++) { if (!ses.notes[k].judged) { next = ses.notes[k]; break; } }
    if (next && !hot) {
      var left2 = next.t - t;
      if (left2 < ses.approach - 80 && left2 > noteWindow(next)) {
        $('lFeedback').textContent = (MOVES[next.type].kind || '') + ' ' + nextTypeLabel(next.type) + ' 준비';
      }
    } else if (!next && !hot) {
      $('lFeedback').textContent = '마지막 동작까지 왔어요. 마무리 자세를 지켜요.';
    }
    if (ses.finished) return;
    if (t > ses.chart.total) { finishSession(); return; }
    ses.raf = requestAnimationFrame(loop);
  }

  function nextTypeLabel(type) {
    var mv = MOVES[type] || MOVES.beat;
    return mv.label + ' ' + (type === 'beat' ? '♪' : mv.icon);
  }

  /* 예전 무대 소품(고양이·장애물)은 코스 이벤트가 그 역할을 이어받았다. */
  function paintProp() {}

  function paintDots() {
    if (!ses) return;
    $('lBar').style.width = (100 * ses.judged / ses.notes.length).toFixed(1) + '%';
  }
  function paintCount() {
    if (!ses) return;
    $('lCount').textContent = '노트 ' + ses.judged + ' / ' + ses.notes.length;
  }

  function flashJudge(text, kind) {
    var el = $('lJudge');
    el.textContent = text;
    el.className = 'judge';
    void el.offsetWidth;
    el.className = 'judge ' + kind + ' pop';
    var line = $('lJudgeLine');
    line.classList.add(kind);
    setTimeout(function () { if (line && !line.classList.contains('hot')) line.classList.remove(kind); }, 260);
  }
  /* 판정 링에서 바깥으로 번지는 빛의 파동 */
  function ringWave(kind) {
    if (!$('lScene')) return;
    var rounds = kind === 'perfect' ? 2 : 1;
    for (var i = 0; i < rounds; i++) {
      (function (delay) {
        setTimeout(function () {
          var scene = $('lScene');
          if (!scene || !ses || ses.finished) return;
          var w = document.createElement('span');
          w.className = 'judge-wave ' + kind;
          w.setAttribute('aria-hidden', 'true');
          scene.appendChild(w);
          setTimeout(function () { if (w.parentNode) w.remove(); }, 700);
        }, delay);
      })(i * 100);
    }
  }
  /* 무대가 살짝 숨을 들이쉬는 박동 (타격감) */
  function scenePop(kind) {
    var scene = $('lScene');
    if (!scene) return;
    scene.classList.remove('pop');
    void scene.offsetWidth;
    scene.classList.add('pop');
    setTimeout(function () { if (scene) scene.classList.remove('pop'); }, 260);
  }
  /* 콤보 5·10·15…마다 무대 위에 잠깐 뜨는 배너 */
  function comboBanner(n) {
    var scene = $('lScene');
    if (!scene) return;
    var words = n >= 20 ? '무대가 전부 ' + T.nick() + '님 편이에요!' : n >= 15 ? '멈출 수 없어요!' : n >= 10 ? '무대가 뜨거워져요!' : '완벽한 흐름!';
    var old = scene.querySelector('.combo-banner');
    if (old) old.remove();
    var el = document.createElement('div');
    el.className = 'combo-banner' + (n >= 10 ? ' hot' : '');
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<b>' + n + ' COMBO</b><small>' + words + '</small>';
    scene.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1050);
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
  function setPose(pose, snap, anim, type) {
    T.showDancer($('lDancer'), T.get().worn, pose);
    var mv = (type && MOVES[type]) || null;
    var poseName = T.POSES[pose] || '';
    /* 동작 이름과 그림 이름이 같으면(파드샤 · 파드샤) 한 번만 쓴다. */
    $('lPose').textContent = mv && mv.label !== poseName ? mv.label + ' · ' + poseName : poseName;
    var img = $('lDancer');
    img.className = 'practice-dancer';
    if (snap) {
      void img.offsetWidth;
      /* 동작 모션이 있으면 그림만 갈아 끼우지 않고 그 동작대로 몸이 실제로 움직인다. */
      if (anim) { img.classList.add(anim); playMotion(anim); }
      else img.classList.add('snap');
    }
  }
  /* 발밑 빛 궤적·금빛 아우라·착지 먼지·도약 잔상. 캐릭터 이미지는 그대로 두고 무대 위에만 얹는다. */
  var fxTimer = 0;
  function playMotion(anim) {
    var fx = $('lFx'), scene = $('lScene');
    if (!scene) return;
    if (fx) {
      fx.className = 'motion-fx ' + anim;
      void fx.offsetWidth;
      clearTimeout(fxTimer);
      fxTimer = setTimeout(function () { if ($('lFx')) $('lFx').className = 'motion-fx'; }, 1150);
    }
    if (anim === 'grand-jete') {
      leapGhosts();
      leapSparkles();
    }
  }
  /* 그랑제떼: 공중에 남는 반짝이 잔상 두 장 */
  function leapGhosts() {
    var img = $('lDancer'), scene = $('lScene');
    if (!img || !scene || !img.src) return;
    [1, 2].forEach(function (i) {
      setTimeout(function () {
        if (!$('lScene')) return;
        var g = document.createElement('img');
        g.className = 'dancer-ghost ghost-' + i;
        g.src = img.src;
        g.alt = '';
        g.setAttribute('aria-hidden', 'true');
        scene.appendChild(g);
        setTimeout(function () { if (g.parentNode) g.remove(); }, 560);
      }, i * 110);
    });
  }
  function leapSparkles() {
    var layer = $('lSparks');
    if (!layer) return;
    for (var i = 0; i < 7; i++) {
      var s = document.createElement('span');
      s.className = 'spark rise';
      var ang = -0.9 + Math.random() * 1.8;
      var dist = 26 + Math.random() * 58;
      s.style.setProperty('--dx', (Math.sin(ang) * dist).toFixed(1) + 'px');
      s.style.setProperty('--dy', (-28 - Math.random() * 44).toFixed(1) + 'px');
      layer.appendChild(s);
      (function (node) { setTimeout(function () { node.remove(); }, 760); })(s);
    }
  }
  function wobble() {
    var img = $('lDancer');
    img.className = 'practice-dancer';
    void img.offsetWidth;
    img.classList.add('wobble');
    $('lPose').textContent = '휘청!';
    var mine = ses;
    clearTimeout(poseTimer);
    poseTimer = setTimeout(function () {
      if (ses !== mine || !ses) return;
      T.showDancer($('lDancer'), T.get().worn, IDLE_POSE);
      $('lDancer').className = 'practice-dancer';
      if ($('lFx')) $('lFx').className = 'motion-fx';
      $('lPose').textContent = '준비 자세';
    }, 760);
  }
  /* 판정된 노트 아이콘은 링 위에서 반짝하며 사라진다. */
  function popNote(n) {
    if (!n.el || n.el.dataset.done === '1') return;
    n.el.dataset.done = '1';
    n.el.classList.add('cleared', 'popped');
    setTimeout(function () { if (n.el) n.el.style.display = 'none'; }, 320);
  }
  function bonkNote(n) {
    if (!n.el || n.el.dataset.done === '1') return;
    n.el.dataset.done = '1';
    n.el.classList.add('bonked');
    setTimeout(function () { if (n.el) n.el.style.display = 'none'; }, 380);
  }
  /* 함께 연습하는 정령의 응원 한마디 */
  function spCheer(group, type) {
    var mate = T.get().practiceWith;
    if (!mate || !T.SPIRITS[mate] || !T.SPIRITS[mate].cheer) return;
    var lines = T.SPIRITS[mate].cheer, n = T.nick();
    var text = String(lines[(ses.perfect + ses.good + ses.miss) % lines.length]).replace(/\{n\}/g, n);
    bubble(text, group === 'miss' ? 'sad' : 'happy');
  }
  var bubbleTimer = 0;
  function bubble(text, kind) {
    var el = $('lBubble');
    el.textContent = text;
    el.className = 'bubble on' + (kind ? ' ' + kind : '');
    var buddy = $('lBuddy');
    buddy.classList.remove('cheer'); void buddy.offsetWidth; buddy.classList.add('cheer');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { el.className = 'bubble'; }, 1900);
  }
  function cue(text) { $('lFeedback').textContent = text; }
  function comboBump() {
    var chip = $('lCombo');
    chip.textContent = '콤보 ' + ses.combo;
    chip.classList.toggle('hot', ses.combo >= 3);
    chip.classList.toggle('blaze', ses.combo >= 10);
    chip.classList.remove('pop'); void chip.offsetWidth; chip.classList.add('pop');
    if (ses.combo > 0 && ses.combo % 5 === 0) comboBanner(ses.combo);
  }
  function advancePose(over) {
    /* 평소에는 ready 포즈로 우아하게 서 있고, 판정된 순간에만 그 동작 포즈로 바뀌었다가 돌아온다. */
    var type = over || 'beat';
    var mv = MOVES[type] || MOVES.beat;
    var pose = type === 'beat' ? (ses.beatPose === 'plie' ? 'tendu' : 'plie') : mv.pose;
    if (type === 'beat') ses.beatPose = pose;
    setPose(pose, true, mv.anim, type);
    var mine = ses;
    clearTimeout(poseTimer);
    poseTimer = setTimeout(function () {
      if (ses !== mine || !ses) return;
      T.showDancer($('lDancer'), T.get().worn, IDLE_POSE);
      $('lDancer').className = 'practice-dancer';
      if ($('lFx')) $('lFx').className = 'motion-fx';
      $('lPose').textContent = '준비 자세';
    }, 1180);
  }
  var poseTimer = 0;

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
    if (verdict === 'perfect') ses.perfect++; else if (verdict === 'great') ses.great++; else ses.good++;
    ses.combo++;
    if (ses.combo > ses.maxCombo) ses.maxCombo = ses.combo;
    popNote(n);
    advancePose(n.type);
    if (verdict === 'perfect') {
      flashJudge('PERFECT!', 'perfect'); sparkle(14, 'gold'); ringWave('perfect'); scenePop('perfect'); tone('perfect');
      bubble('정확해요!', 'happy');
      cue(book.pickLine('perfect', n.type));
    } else if (verdict === 'great') {
      flashJudge('GREAT!', 'great'); sparkle(9, 'mint'); ringWave('great'); tone('great');
      cue(book.pickLine('perfect', n.type));
    } else {
      flashJudge('GOOD!', 'good'); sparkle(5, 'mint'); ringWave('good'); tone('good');
      cue(book.pickLine('good', n.type));
    }
    if (ses.combo % 3 === 0) spCheer('hit', n.type);
    comboBump(); paintDots(); paintCount();
  }
  function missNote(n, why) {
    n.judged = true; n.result = 'miss'; ses.judged++;
    if (ses.shields > 0) {
      ses.shields--;
      ses.good++; ses.combo++;
      if (ses.combo > ses.maxCombo) ses.maxCombo = ses.combo;
      if (n.type !== 'beat') popNote(n);
      advancePose(n.type);
      flashJudge('살짝 구했어요!', 'good'); sparkle(4, 'mint'); tone('good');
      cue(book.pickLine('shield', n.type));
      comboBump(); paintDots(); paintCount(); paintHP();
      return;
    }
    ses.miss++; ses.combo = 0;
    bonkNote(n);
    wobble(); flashJudge('삐끗!', 'miss'); tone('miss');
    var jokes = n.type === 'cat'
      ? ['야웅… 고양이가 밟고 갔어요 🐱', '고양이가 ' + T.nick() + '님 리본을 물었어요 🎀', '고양이 앞에서 중심을 잃었어요 😹']
      : n.type === 'jump'
        ? ['튜튜가 장애물에 걸렸어요! 🚧', '도약은 했는데 장애물이 더 높았어요 😵', '장애물이 오늘따라 커 보여요 🧱']
        : n.type === 'beam'
          ? ['균형대에서 중심이 살짝 흔들렸어요 ═', '아라베스크 다리가 균형대에 걸렸어요 😅']
          : n.type === 'turn'
            ? ['빙글 돌다가 제자리를 못 찾았어요 ↻', '피루엣이 반 바퀴만 돌았어요 😵‍💫']
            : ['발끝이 잠깐 미끄러졌어요 😅', '음악이 살짝 모르는 척했어요 🎵'];
    bubble(jokes[Math.floor(Math.random() * jokes.length)], 'sad');
    cue(why === 'wrong' ? '노트와 같은 동작을 눌러야 해요. 다음 표시를 봐요.' : '한 박자 놓쳤어요. 음악은 계속돼요.');
    comboBump(); paintDots(); paintCount();
    hurtHP(ses.damage, why === 'wrong' ? '⚠️ 방향 반대로!'
      : n.type === 'jump' ? '⚠️ 점프 타이밍 늦음!' : '⚠️ 순서 놓침!');
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
      var w = noteWindow(n);
      if (dt < -w - 200) { upcoming = n; break; }
      if (dt > w) continue;
      var abs = Math.abs(dt);
      if (abs < bestAbs) { best = n; bestAbs = abs; }
    }
    if (best) {
      if (best.type === move) {
        var pWin = notePerfectWindow(best), gWin = noteWindow(best);
        var greatWin = Math.round(pWin + (gWin - pWin) * 0.42);
        hitNote(best, bestAbs <= pWin ? 'perfect' : bestAbs <= greatWin ? 'great' : 'good');
      }
      else if (soft) tone('tap');          // 화면을 살짝 스친 건 벌하지 않아요.
      else missNote(best, 'wrong');
      return;
    }
    if (upcoming && upcoming.type === move && upcoming.t - t < noteWindow(upcoming) * 2) {
      cue(book.pickLine('early', move));
      return;
    }
    /* 노트가 없을 때도 버튼을 누르면 그 동작을 한 번 보여 준다. */
    advancePose(move);
    tone('tap');
  }

  async function finishSession() {
    if (!ses || ses.sending) return;
    ses.sending = true;
    var run = ses.run;
    var moves = {};
    ses.notes.forEach(function(n){ if (['perfect','great','good'].includes(n.result)) moves[n.type] = (moves[n.type] || 0) + (n.result === 'perfect' ? 2 : 1); });
    var score = {
      lessonId: run.id, moves: moves, perfect: ses.perfect, great: ses.great, good: ses.good, miss: ses.miss, maxCombo: ses.maxCombo, notes: ses.notes.length,
      comboCoins: Math.floor(ses.maxCombo / 4) * 2 * ses.comboRate,
      noteCoins: ses.noteCoins * (ses.perfect + ses.great + ses.good)
    };
    lastSurvived = { lessonId: run.id, hp: Math.round(ses.hp), maxHP: ses.maxHP, mode: ses.mode };
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
  function voiceLine(r) {
    var teacher = T.SPIRITS[teachers[r.kind]], mate = T.get().practiceWith;
    var total = (r.perfect || 0) + (r.good || 0) + (r.miss || 0);
    var line;
    if (!r.miss) line = '오늘은 한 박자도 놓치지 않았어요. 이 순간을 오래 기억할게요.';
    else if (r.perfect >= total / 2) line = '손끝이 참 예뻤어요. 삐끗한 박자도 다음 박자가 감싸 주었어요.';
    else line = '오늘도 끝까지 함께했어요. 잘하려고 애쓰는 마음이 제일 예뻐요.';
    return teacher.name + '가 “' + line + '” 하고 말했어요.' +
      (mate && mate !== teachers[r.kind] ? ' ' + T.SPIRITS[mate].name + '도 옆에서 박수를 보냈어요.' : '');
  }
  function renderResultPass(r) {
    var pieces = passPieces(), got = passCountOf(pieces), gained = KIND_PIECE[r.kind];
    $('rPassCount').textContent = got + ' / 4';
    $('rPassRow').innerHTML = pieces.map(passChip).join('');
    $('rPassNote').textContent = got >= 4
      ? '네 조각 완성! 왕립 극장 발레 프리패스가 열렸어요 🎟️'
      : gained
        ? '이번 수업으로 ‘' + gained + '’ 조각을 받았어요. ' + (4 - got) + '조각 남았어요.'
        : '조각 ' + (4 - got) + '개 남았어요.';
  }
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
    if (r.noteCoins) parts.push('정령 ' + r.noteCoins);
    if (r.mealCoins) parts.push('메뉴 ' + r.mealCoins);
    if (r.techniqueCoins) parts.push('동작 성공 ' + r.techniqueCoins);
    $('rCoinsDetail').hidden = parts.length < 2;
    $('rCoinsDetail').textContent = parts.join(' + ') + '코인';
    $('rPerfect').textContent = r.perfect || 0;
    $('rGreat').textContent = r.great || 0;
    $('rGood').textContent = r.good || 0;
    $('rGrowth').textContent = r.growth ? '경험치 +' + r.growth.xp + ' · 플레이어 Lv.' + r.growth.level + (r.growth.level > r.growth.before ? ' · 레벨업!' : '') : '플레이어 Lv.' + T.playerLevel().n;
    $('rMiss').textContent = r.miss || 0;
    $('rCombo').textContent = r.maxCombo || 0;
    renderResultPass(r);
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
    } else if (T.stageReady() && (!s.shows || !goal)) {
      $('rMilestone').textContent = '왕립 극장 초대장';
      $('rGoalName').textContent = '잠자는 숲속의 ' + T.nick();
      $('rGoalNote').textContent = '첫 공연 준비가 끝났어요. 지금 바로 무대에 올라 포스터를 남겨요.';
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
    var st = Object.keys(r.stats || {}).map(function (k) { return T.STATS[k].label + ' +' + r.stats[k]; }).join(' · ');
    $('rGains').textContent = st + ' · 다음 수업 판정 여유 +' + T.practicePower(r.kind, s).timing + 'ms';
    if (lastSurvived && lastSurvived.lessonId === r.lessonId && lastSurvived.mode === 'hard') {
      $('rSurvive').hidden = false;
      $('rSurvive').textContent = '살아남은 HP ' + lastSurvived.hp + ' / ' + lastSurvived.maxHP +
        ' · ' + (MODES[lastSurvived.mode] || MODES.normal).label + ' 모드';
    } else {
      $('rSurvive').hidden = true;
      $('rSurvive').textContent = '';
    }
    $('rDetails').open = true;
    var bonds = r.bonds || [];
    $('rBonds').hidden = !bonds.length;
    $('rBonds').textContent = bonds.length ? '함께한 정령 · ' + bonds.map(function (b) {
      return b.name + ' ' + (b.levels.length ? '친밀도 Lv.' + b.level + '로 올랐어요' : '친밀도 +1');
    }).join(' · ') : '';
    $('rVoice').textContent = voiceLine(r);
    $('rPotion').hidden = !r.potion;
    if (r.potion) $('rPotion').textContent = '사용한 포션 · ' + T.STAFF[r.potion.id].name + ' · ' + T.effectFor(r.potion.id, r.potion.level).label;
    $('rRefund').hidden = !r.refund;
    if (r.refund) $('rRefund').textContent = '이전에 맡긴 예약금 ' + r.refund + '코인도 돌려받았어요.';
    $('rStage').textContent = T.stageReady() ? '왕립 극장 가기' : '첫 공연까지 수업 ' + T.stageLeft() + '회';
    showDialog('result');
  }

  /* ================= 라우트 ================= */
  function renderRoute() {
    var hash = location.hash, s = T.get(), run = s.lesson, receipt = s.kingdom.receipt;
    if (hash === '#first-bar') { askMode('bar'); return; }
    if (hash === '#lesson' && run) {
      if (deadMode) return;
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
  $('resumeLesson').addEventListener('click', function () { askMode(T.get().lesson.kind); });
  $('mates').addEventListener('click', function (e) {
    var b = e.target.closest('[data-mate]');
    if (!b || busy) return;
    busy = true;
    T.setPracticeWith(b.dataset.mate)
      .then(function (id) {
        busy = false;
        refresh();
        T.toast(id ? T.SPIRITS[id].name + '와 함께 연습할게요' : '혼자 연습할게요');
      })
      .catch(function () { busy = false; });
  });
  $('cGo').addEventListener('click', function () { audio(); applySound(); askMode(location.hash.slice(7)); });
  $('cCancel').addEventListener('click', closeToStudio);
  $('lPause').addEventListener('click', closeToStudio);
  $('lSound').addEventListener('click', function () {
    soundOn = !soundOn; saveSound(); audio(); applySound();
    if (ses && !ses.musicStarted) ses.musicStarted = startMusic(ses.chart, performance.now() - p0);
  });
  $('pad').addEventListener('click', function (e) {
    var b = e.target.closest('[data-move]');
    if (b && e.detail === 0) pressMove(b.dataset.move);   // 키보드로 누른 경우만 (터치는 pointerdown에서 처리)
  });
  $('track') && $('track').addEventListener('pointerdown', function (e) { e.preventDefault(); pressMove('beat', true); });
  $('pad').addEventListener('pointerdown', function (e) {
    var b = e.target.closest('[data-move]');
    if (!b) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.cancelable) e.preventDefault();
    pressMove(b.dataset.move);
  });
  document.addEventListener('keydown', function (e) {
    if (!$('lesson').open || !ses) return;
    var key = { '1': 'cat', '2': 'jump', '3': 'beam', '4': 'turn', 'Numpad1': 'cat', 'Numpad2': 'jump', 'Numpad3': 'beam', 'Numpad4': 'turn' }[e.code] ||
      { '1': 'cat', '2': 'jump', '3': 'beam', '4': 'turn' }[e.key];
    if (key) { e.preventDefault(); pressMove(key); }
  });
  $('rAgain').addEventListener('click', function () { askMode(T.get().kingdom.receipt.kind); });
  $('mOptions').addEventListener('click', function (e) {
    var b = e.target.closest('[data-mode]');
    if (b) pickMode(b.dataset.mode);
  });
  $('goRetry').addEventListener('click', function () {
    var s = T.get();
    deadMode = false;
    if (s.lesson) askMode(s.lesson.kind);
    else closeToStudio();
  });
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
    hp: function () {
      return ses ? { hp: ses.hp, maxHP: ses.maxHP, mode: ses.mode, damage: ses.damage, shields: ses.shields, dead: !!ses.dead } : null;
    },
    mode: function () { return readMode(); },
    pickMode: function (id) { pickMode(id); },
    notes: function () { return ses ? ses.notes.map(function (n) { return { t: n.t, type: n.type, judged: n.judged, result: n.result }; }) : []; },
    score: function () { return ses ? { perfect: ses.perfect, great: ses.great, good: ses.good, miss: ses.miss, maxCombo: ses.maxCombo, window: ses.window, shields: ses.shields } : null; },
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
  /* 무대 위 정령 얼굴은 수업이 시작되기 전에 미리 받아 두어 빈 원이 생기지 않게 한다. */
  ['etu', 'ara', 'piru', 'shangz', 'alle'].forEach(function (id) {
    var pre = new Image();
    pre.src = T.spiritArt(id, true);
  });
  // 지난번에 받지 못한 레벨업 보상이 있으면 한 번만 보여 준다.
  (function () {
    var pending = T.get().levelUp;
    if (!pending || location.hash) return;
    setTimeout(function () { if (!ses && !$('result').open && !$('lesson').open) showLevelUp(pending); }, 350);
  })();
})();
