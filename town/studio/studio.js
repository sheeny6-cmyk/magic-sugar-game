(function () {
  'use strict';
  var T = window.SugarTown, book = window.SugarLessons;
  var courses = book.classes, terms = book.terms;
  var $ = function (id) { return document.getElementById(id); };
  var teachers = { bar: 'etu', center: 'piru', piece: 'ara' };
  var demonstrations = { plie: 'plie', tendu: 'tendu', releve: 'releve', arabesque: 'arabesque', reverence: 'curtsy' };
  var dialogs = ['confirm', 'lesson', 'result'];
  var busy = false, shown = null, lastReceipt = null;

  function refresh() {
    var s = T.get(), lv = T.level(), potion = s.kingdom.prepared;
    $('lvName').textContent = 'Lv.' + lv.n + ' ' + lv.name;
    $('lvClasses').textContent = '수료 ' + s.classes + '회';
    $('lvBar').style.width = lv.pct + '%';
    $('lvNote').textContent = lv.next ? '다음 레벨까지 수업 ' + (lv.need - lv.have) + '번' : '발레 왕국 스타';
    $('stamps').textContent = '출석 도장 · 바 ' + s.stamps.bar + ' · 센터 ' + s.stamps.center + ' · 작품 ' + s.stamps.piece;
    $('stageLink').textContent = T.stageReady() ? '오늘의 의상으로 리허설 하기 →' : '왕립 극장까지 도장 ' + T.stageLeft() + '개 →';
    $('practiceKit').textContent = potion ? T.STAFF[potion.id].name + ' 포션 · ' + T.effectFor(potion.id, potion.level).label : '정령에게 연습 포션 주문하기';
    $('resumeLesson').hidden = !s.lesson;
    if (s.lesson) $('resumeLesson').textContent = courses[s.lesson.kind].name + ' 이어 하기 · ' + (s.lesson.index + 1) + ' / 3';
    $('courseNote').textContent = s.lesson
      ? courses[s.lesson.kind].name + ' 진행 중이에요. 마치면 새 수업을 고를 수 있어요.'
      : '수업은 모두 무료예요. 빈칸 세 개를 맞히면 코인이 자동으로 들어와요.';
    $('classes').innerHTML = Object.keys(courses).map(function (kind) {
      var c = courses[kind], sp = teachers[kind];
      var waiting = s.lesson && kind !== s.lesson.kind;
      var prize = T.rewardFor(kind, waiting ? null : potion).coins;
      return '<button class="cls" data-cls="' + kind + '" type="button"' + (waiting ? ' disabled' : '') + '><img src="' + T.spiritArt(sp, true) + '" alt=""><span class="course-info"><strong>' + c.name + '</strong><small>' + T.SPIRITS[sp].name + ' 선생님</small></span><b class="course-prize">+' + T.fmt(prize) + '코인</b><span aria-hidden="true">›</span></button>';
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
    var c = courses[kind], s = T.get(), potion = s.kingdom.prepared;
    $('cName').textContent = c.name;
    $('cDesc').textContent = c.desc;
    $('cReward').textContent = '+' + T.fmt(T.rewardFor(kind, potion).coins) + '코인';
    $('cNote').textContent = !T.isOwned('lilac') ? '첫 수업 선물 · 라일락 쉬폰 스커트' : potion ? '이번 연습에 ' + T.STAFF[potion.id].name + ' 포션을 써요.' : '중간에 쉬어도 풀던 문제에서 이어져요.';
    showDialog('confirm');
  }
  async function enroll(kind) {
    if (busy || !Object.hasOwn(courses, kind)) return;
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

  function renderQuestion() {
    var s = T.get(), run = s.lesson, row = run.rounds[run.index], term = terms[row.key];
    var solved = row.picks.includes(row.key), hinted = !solved && (row.hint || row.picks.length > 0);
    var newQuestion = !shown || shown.id !== run.id || shown.index !== run.index;
    var justSolved = solved && (!shown || !shown.solved);
    shown = { id: run.id, index: run.index, solved: solved };
    var pose = 'ready', poseLabel = '준비 자세';
    var demo = demonstrations[row.key];
    if (demo && (solved || hinted)) {
      pose = demo;
      poseLabel = hinted ? '동작 힌트' : '동작 · ' + T.POSES[pose];
    } else if (solved) {
      poseLabel = '다음 동작 준비';
    } else if (run.index > 0 && demonstrations[run.rounds[run.index - 1].key]) {
      pose = demonstrations[run.rounds[run.index - 1].key];
      poseLabel = '이전 포즈 · ' + T.POSES[pose];
    }
    if (newQuestion && demo && pose !== demo) {
      var rehearsalImage = new Image();
      rehearsalImage.src = T.dancerArt(s.worn, demo);
    }
    T.showDancer($('lDancer'), s.worn, pose);
    $('lPose').textContent = poseLabel;
    $('lPrize').textContent = '완주 +' + T.fmt(T.rewardFor(run.kind, s.kingdom.prepared).coins) + '코인';
    if (newQuestion) $('lScene').classList.remove('landed');
    if (justSolved) { $('lScene').classList.remove('landed'); void $('lScene').offsetWidth; $('lScene').classList.add('landed'); }
    $('lCount').textContent = '빈칸 ' + (run.index + 1) + ' / ' + run.rounds.length;
    $('lTitle').textContent = courses[run.kind].name;
    $('lPortrait').src = T.spiritArt(teachers[run.kind], true);
    $('lTeacher').textContent = T.SPIRITS[teachers[run.kind]].name + ' 선생님';
    Array.from($('lDots').children).forEach(function (dot, i) { dot.className = i < run.index || (i === run.index && solved) ? 'done' : i === run.index ? 'current' : ''; });
    var cue = term.cue.split('|'), blank = document.createElement('span');
    blank.className = 'term-blank' + (solved ? ' filled' : '');
    blank.textContent = solved ? term.ko : '···';
    if (!solved) blank.setAttribute('aria-label', '빈칸');
    $('lCue').replaceChildren(cue[0], blank, cue[1]);
    $('lChoices').replaceChildren();
    row.choices.forEach(function (key) {
      var b = document.createElement('button'), chosen = row.picks.includes(key);
      b.type = 'button'; b.className = 'term-choice'; b.dataset.key = key;
      b.textContent = terms[key].ko; b.disabled = solved || chosen;
      if (chosen) {
        b.classList.add(key === row.key ? 'correct' : 'wrong');
        var mark = document.createElement('small');
        mark.textContent = key === row.key ? '✓ 정답' : '다시 생각해요'; b.appendChild(mark);
      }
      $('lChoices').appendChild(b);
    });
    var feedback = $('lFeedback');
    feedback.replaceChildren();
    if (solved) {
      var correct = document.createElement('b'); correct.textContent = term.ko + ' · ' + term.fr;
      feedback.append(correct, term.note);
    } else if (hinted) {
      feedback.textContent = (row.picks.length ? '한 번 더 골라 볼까요? ' : '') + '첫 글자가 ‘' + term.ko[0] + '’인 동작이에요. ' + term.note;
    }
    $('lHint').textContent = demonstrations[row.key] ? '동작 힌트' : '힌트 보기';
    $('lHint').hidden = solved || !!hinted;
    $('lNext').hidden = !solved;
    $('lNext').textContent = run.index === run.rounds.length - 1 ? '수업 마치기' : '다음 문제';
    showDialog('lesson');
    if (newQuestion) { $('lesson').querySelector('.lcard').scrollTop = 0; $('lCue').focus({ preventScroll: true }); }
  }

  async function play(action, choice) {
    if (busy || !shown || !$('lesson').open) return;
    var view = shown, completed;
    busy = true;
    try {
      completed = await T.updateWallet(function (s) {
        var run = s.lesson;
        if (!run || run.id !== view.id || run.index !== view.index) return;
        var row = run.rounds[run.index];
        var solved = row.picks.includes(row.key);
        if (action === 'hint' && !solved) row.hint = true;
        if (action === 'answer' && !solved && row.choices.includes(choice) && !row.picks.includes(choice)) {
          row.picks.push(choice);
          if (choice === row.key && run.index === run.rounds.length - 1) return T.finishPractice(s, courses[run.kind].stats);
        }
        if (action !== 'next' || !solved) return;
        if (run.index < run.rounds.length - 1) { run.index++; return; }
        return T.finishPractice(s, courses[run.kind].stats);
      });
    } finally { busy = false; }
    if (completed) { refresh(); routeTo('#completed', true); return; }
    renderRoute();
    if (action === 'answer' && $('lesson').open) {
      var target = $('lNext').hidden ? $('lChoices').querySelector('button:enabled') : $('lNext');
      if (target) target.focus({ preventScroll: true });
    }
  }

  function renderResult(r) {
    var s = T.get(), lv = T.level(), c = courses[r.kind], goal = T.nextDress();
    var key = r.lessonId || r.keys.join(',');
    if (lastReceipt !== key) { $('rDetails').open = false; $('rAnnounce').textContent = ''; lastReceipt = key; }
    $('rCourse').textContent = c.name + ' 수료';
    $('rTitle').textContent = '+' + T.fmt(r.coins) + '코인 적립';
    $('rBalance').textContent = Number.isFinite(r.before) && Number.isFinite(r.after)
      ? '수료 당시 지갑 ' + T.fmt(r.before) + ' → ' + T.fmt(r.after) + '코인' : '현재 지갑 ' + T.fmt(s.coins) + '코인';
    var extra = r.coins - T.PRACTICE[r.kind].coins;
    $('rCoinsDetail').hidden = extra <= 0;
    $('rCoinsDetail').textContent = '기본 ' + T.PRACTICE[r.kind].coins + ' + 포션 ' + extra + '코인';
    var last = terms[r.keys[r.keys.length - 1]];
    $('rLast').textContent = last ? '마지막 정답 · ' + last.ko + ' (' + last.fr + ')' : '';
    T.showDancer($('rDancer'), s.worn, demonstrations[r.keys[r.keys.length - 1]] || 'curtsy');
    var gift = r.gift && T.dressOf(r.gift);
    $('rWear').dataset.gift = gift ? gift.id : '';
    $('rWear').hidden = true; $('rGoalLink').hidden = true; $('rTrack').hidden = true;
    if (gift) {
      var wearing = s.worn === gift.id;
      $('rMilestone').textContent = '첫 수업 선물';
      $('rGoalName').textContent = gift.name;
      $('rGoalNote').textContent = wearing ? '슈가가 새 스커트로 갈아입었어요.' : '옷장에 도착했어요. 슈가에게 입혀 볼까요?';
      $('rWear').hidden = wearing;
    } else if (r.classesAfter === 5 || !goal && T.stageReady()) {
      $('rMilestone').textContent = '왕립 극장 초대장';
      $('rGoalName').textContent = '잠자는 숲속의 슈가';
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
      $('rMilestone').textContent = '슈가의 연습 기록';
      $('rGoalName').textContent = lv.name; $('rGoalNote').textContent = '지금까지 수업 ' + s.classes + '회 수료';
    }
    $('rTerms').textContent = r.keys.map(function (k) { return terms[k] ? terms[k].ko : ''; }).join(' · ') + ' · 첫 시도 정답 ' + r.first + '/3';
    $('rRecord').textContent = '출석 도장 +1 · 왕국 생명력 +' + r.life + ' · ' + lv.name;
    $('rGains').textContent = Object.keys(r.stats || {}).map(function (k) { return T.STATS[k].label + ' +' + r.stats[k]; }).join(' · ');
    $('rPotion').hidden = !r.potion;
    if (r.potion) $('rPotion').textContent = '사용한 포션 · ' + T.STAFF[r.potion.id].name + ' · ' + T.effectFor(r.potion.id, r.potion.level).label;
    $('rRefund').hidden = !r.refund;
    if (r.refund) $('rRefund').textContent = '이전에 맡긴 예약금 ' + r.refund + '코인도 돌려받았어요.';
    $('rStage').hidden = !T.stageReady();
    showDialog('result');
  }

  function renderRoute() {
    var hash = location.hash, s = T.get(), run = s.lesson, receipt = s.kingdom.receipt;
    if (hash === '#first-bar') { enroll('bar'); return; }
    if (hash === '#lesson' && run) {
      renderQuestion();
      if (shown.solved && run.index === run.rounds.length - 1 && !busy) play('next');
      return;
    }
    if (hash === '#lesson' && shown && receipt && receipt.lessonId === shown.id) { routeTo('#completed', true); return; }
    if (hash.startsWith('#class-')) {
      if (run) { routeTo('#lesson', true); return; }
      var kind = hash.slice(7);
      if (Object.hasOwn(courses, kind)) { confirmCourse(kind); return; }
    }
    if (hash === '#completed' && receipt) { renderResult(receipt); return; }
    shown = null; showDialog(null);
  }
  $('classes').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cls]');
    if (b) routeTo(T.get().lesson ? '#lesson' : '#class-' + b.dataset.cls);
  });
  $('resumeLesson').addEventListener('click', function () { routeTo('#lesson'); });
  $('cGo').addEventListener('click', function () { enroll(location.hash.slice(7)); });
  $('cCancel').addEventListener('click', closeToStudio); $('lPause').addEventListener('click', closeToStudio);
  $('lChoices').addEventListener('click', function (e) { var b = e.target.closest('[data-key]'); if (b && !b.disabled) play('answer', b.dataset.key); });
  $('lHint').addEventListener('click', function () { play('hint'); }); $('lNext').addEventListener('click', function () { play('next'); });
  $('rAgain').addEventListener('click', function () { enroll(T.get().kingdom.receipt.kind); });
  $('rWear').addEventListener('click', async function () {
    if (busy) return;
    var gift = $('rWear').dataset.gift;
    if (!gift) return;
    busy = true;
    var worn;
    try { worn = await T.updateWallet(function () { return T.wear(gift); }); } finally { busy = false; }
    if (worn.ok) $('rAnnounce').textContent = '슈가가 ' + worn.item.name + ' 차림으로 갈아입었어요.';
    refresh(); renderRoute();
    $('rAgain').focus({ preventScroll: true });
  });
  dialogs.forEach(function (id) {
    $(id).addEventListener('cancel', function (e) { e.preventDefault(); closeToStudio(); });
    $(id).addEventListener('click', function (e) { if (e.target === $(id)) closeToStudio(); });
  });
  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('sugartown:refresh', function () { refresh(); renderRoute(); });
  refresh(); renderRoute();
})();
