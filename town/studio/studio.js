/* 발레 스튜디오 */
(function () {
  'use strict';
  var T = window.SugarTown, book = window.SugarLessons;
  var courses = book.classes, terms = book.terms;
  var $ = function (id) { return document.getElementById(id); };
  var teachers = { bar: 'etu', center: 'piru', piece: 'ara' };
  var dialogs = ['confirm', 'lesson', 'result'];
  var busy = false, shown = null;

  function gainsHTML(stats) {
    return Object.keys(stats).map(function (k) {
      return '<span>' + T.STATS[k].label + ' +' + stats[k] + '</span>';
    }).join('');
  }
  function refresh() {
    var s = T.get(), lv = T.level(), d = T.dressOf(s.worn);
    $('wornName').textContent = d.name;
    $('wornFig').innerHTML = T.dressHTML(d.id, '');
    $('lvName').textContent = 'Lv.' + lv.n + ' ' + lv.name;
    $('lvClasses').textContent = '수업 ' + s.classes + '번';
    $('lvBar').style.width = lv.pct + '%';
    $('lvNote').textContent = lv.next
      ? '다음 레벨까지 수업 ' + (lv.need - lv.have) + '번 · Lv.' + lv.next.n + ' ' + lv.next.name
      : '발레 왕국 스타! 리허설 초대장을 확인해 보세요.';

    var slots = '';
    for (var i = 0; i < 5; i++) slots += '<span class="stamp' + (i < Math.min(5, s.classes) ? ' on' : '') + '">🩰</span>';
    $('stamps').innerHTML = slots + '<span class="stamp-count">바 ' + s.stamps.bar + ' · 센터 ' + s.stamps.center + ' · 작품 ' + s.stamps.piece + '</span>';

    var potion = s.kingdom.prepared;
    $('practiceKit').textContent = potion ? T.STAFF[potion.id].name + ' 포션 · ' + T.effectFor(potion.id, potion.level).label : '정령에게 연습 포션 주문하기';
    $('resumeLesson').hidden = !s.lesson;
    if (s.lesson) $('resumeLesson').textContent = courses[s.lesson.kind].name + ' 이어서 풀기 · ' + (s.lesson.index + 1) + ' / 3';
    $('classes').innerHTML = Object.keys(courses).map(function (kind) {
      var c = courses[kind], fee = T.classFee(kind);
      return '<button class="cls' + (s.coins < fee ? ' no' : '') + '" data-cls="' + kind + '" type="button">' +
        '<span class="tile" style="background:' + c.grad + '">' + c.icon + '</span>' +
        '<span class="info"><strong>' + c.name + '</strong><span class="sub">' + c.desc + '</span><span class="eff">' + gainsHTML(c.stats) + '</span></span>' +
        '<span class="fee"><b>+' + T.PRACTICE[kind].coins + '코인</b><span>' + (fee ? '예약금 ' + fee : '언제나 무료') + '</span></span></button>';
    }).join('');
    $('stageTitle').textContent = T.stageReady() ? '리허설 초대장 도착' : '초대장까지 수업 ' + T.stageLeft() + '번';
    $('stageSub').textContent = '출석 도장 다섯 개를 모으면 첫 공연 초대장을 받아요.';
    T.syncUI();
  }

  // Hash routes make Android Back and a refreshed lesson return to the expected screen.
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
    var c = courses[kind], fee = T.classFee(kind), lack = Math.max(0, fee - T.get().coins);
    $('cKicker').textContent = c.kick;
    $('cName').textContent = c.name;
    $('cDesc').textContent = c.desc;
    $('cFee').textContent = fee ? T.fmt(fee) + '코인' : '무료';
    $('cGain').innerHTML = gainsHTML(c.stats);
    $('cNote').textContent = lack ? '현재 ' + T.fmt(T.get().coins) + '코인 · ' + T.fmt(lack) + '코인 더 모으면 들을 수 있어요.'
      : '세 문제를 마치면 ' + (fee ? '예약금을 돌려받고 ' : '') + '연습 보상 ' + T.PRACTICE[kind].coins + '코인과 생명력 ' + T.PRACTICE[kind].life + '을 받아요.';
    $('cGo').hidden = !!lack;
    $('cGo').dataset.fee = fee;
    $('cCafe').hidden = !lack;
    $('cGo').textContent = fee ? T.fmt(fee) + '코인 맡기고 시작' : '무료 수업 시작';
    showDialog('confirm');
  }
  async function enroll(kind, quotedFee) {
    if (busy || !courses[kind]) return;
    busy = true;
    var enrolled;
    try {
      enrolled = await T.updateWallet(function (s) {
        if (s.lesson) return true;
        var fee = T.classFee(kind);
        if (fee > s.coins || fee !== quotedFee) return false;
        s.lesson = book.makeLesson(kind, s);
        s.lesson.paidFee = fee;
        s.coins -= fee;
        return true;
      });
    } finally { busy = false; }
    refresh();
    routeTo(enrolled ? '#lesson' : '#class-' + kind, true);
  }

  function renderQuestion() {
    var run = T.get().lesson, c = courses[run.kind], row = run.rounds[run.index];
    var term = terms[row.key], solved = row.picks.includes(row.key);
    var newQuestion = !shown || shown.id !== run.id || shown.index !== run.index;
    shown = { id: run.id, index: run.index };
    var teacher = T.SPIRITS[teachers[run.kind]];
    $('lCount').textContent = '수업 노트 · ' + (run.index + 1) + ' / ' + run.rounds.length;
    $('lTitle').textContent = c.name;
    $('lPortrait').src = T.spiritArt(teacher.id, true);
    $('lTeacher').textContent = teacher.name + '의 한마디';
    Array.from($('lDots').children).forEach(function (dot, i) {
      dot.className = i < run.index || (i === run.index && solved) ? 'done' : i === run.index ? 'current' : '';
    });
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
        mark.textContent = key === row.key ? '✓ 정답' : '다시 생각해요';
        b.appendChild(mark);
      }
      $('lChoices').appendChild(b);
    });
    var feedback = $('lFeedback');
    feedback.replaceChildren();
    if (solved) {
      var correct = document.createElement('b');
      correct.textContent = term.ko + ' · ' + term.fr;
      feedback.append(correct, term.note);
    } else if (row.hint || row.picks.length) {
      feedback.textContent = (row.picks.length ? '한 번 더 골라 볼까요? ' : '') + '‘' + term.ko[0] + '’로 시작해요. ' + term.note;
    }
    $('lHint').hidden = solved || row.hint || row.picks.length > 0;
    $('lNext').hidden = !solved;
    $('lNext').textContent = run.index === run.rounds.length - 1 ? '연습 보상 받기' : '다음 문제';
    showDialog('lesson');
    if (newQuestion) $('lCue').focus({ preventScroll: true });
  }

  async function play(action, choice) {
    if (busy || !shown || !$('lesson').open) return;
    var view = shown;
    busy = true;
    var completed;
    try {
      completed = await T.updateWallet(function (s) {
        var run = s.lesson;
        if (!run || run.id !== view.id || run.index !== view.index) return;
        var row = run.rounds[run.index], solved = row.picks.includes(row.key);
        if (action === 'hint' && !solved) row.hint = true;
        if (action === 'answer' && !solved && row.choices.includes(choice) && !row.picks.includes(choice)) row.picks.push(choice);
        if (action !== 'next' || !solved) return;
        if (run.index + 1 < run.rounds.length) { run.index++; return; }
        return T.finishPractice(s, courses[run.kind].stats);
      });
    } finally { busy = false; }
    if (completed) {
      refresh(); routeTo('#completed', true);
    } else {
      renderRoute();
      if (action === 'answer' && $('lesson').open) {
        var target = $('lNext').hidden ? $('lChoices').querySelector('button:enabled') : $('lNext');
        if (target) target.focus({ preventScroll: true });
      }
    }
  }

  function renderResult(receipt) {
    var c = courses[receipt.kind], after = T.level();
    $('rTitle').textContent = '연습 보상 +' + T.fmt(receipt.coins) + '코인';
    $('rSub').textContent = c.name + ' 수료 · 출석 도장 +1 · 왕국 생명력 +' + receipt.life;
    $('rTerms').textContent = receipt.keys.map(function (key) { return terms[key].ko; }).join(' · ') + ' · 첫 시도 정답 ' + receipt.first + '/3';
    $('rStamp').textContent = c.icon;
    $('rGains').innerHTML = gainsHTML(receipt.stats);
    $('rRefund').hidden = !receipt.refund;
    $('rRefund').textContent = '맡겨 둔 예약금 ' + T.fmt(receipt.refund) + '코인도 돌려받았어요.';
    var potion = receipt.potion;
    $('rPotion').hidden = !potion;
    if (potion) $('rPotion').textContent = T.SPIRITS[potion.id].name + '의 포션 사용 · ' + T.effectFor(potion.id, potion.level).label;
    $('rLv').textContent = 'Lv.' + after.n + ' ' + after.name + (after.n > receipt.levelBefore ? ' 달성!' : '');
    $('rBar').style.width = after.pct + '%';
    $('rLvNote').textContent = T.stageReady() ? '리허설 초대장 도착' : '초대장까지 ' + T.stageLeft() + '번';
    $('rStage').hidden = !T.stageReady();
    showDialog('result');
  }

  function renderRoute() {
    var hash = location.hash, run = T.get().lesson;
    if (hash === '#first-bar') { enroll('bar', 0); return; }
    if (hash === '#lesson' && run) { renderQuestion(); return; }
    if (hash.indexOf('#class-') === 0) {
      if (run) { routeTo('#lesson', true); return; }
      var kind = hash.slice(7);
      if (Object.hasOwn(courses, kind)) { confirmCourse(kind); return; }
    }
    var receipt = T.get().kingdom.receipt;
    if (hash === '#completed' && receipt) { renderResult(receipt); return; }
    shown = null;
    showDialog(null);
  }

  $('classes').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cls]');
    if (b) routeTo(T.get().lesson ? '#lesson' : '#class-' + b.dataset.cls);
  });
  $('resumeLesson').addEventListener('click', function () { routeTo('#lesson'); });
  $('cGo').addEventListener('click', function () { enroll(location.hash.slice(7), Number($('cGo').dataset.fee)); });
  $('cCancel').addEventListener('click', closeToStudio);
  $('lPause').addEventListener('click', closeToStudio);
  $('lChoices').addEventListener('click', function (e) {
    var b = e.target.closest('[data-key]');
    if (b && !b.disabled) play('answer', b.dataset.key);
  });
  $('lHint').addEventListener('click', function () { play('hint'); });
  $('lNext').addEventListener('click', function () { play('next'); });
  $('rAgain').addEventListener('click', function () { routeTo('#class-' + T.get().kingdom.receipt.kind, true); });
  dialogs.forEach(function (id) {
    $(id).addEventListener('cancel', function (e) { e.preventDefault(); closeToStudio(); });
    $(id).addEventListener('click', function (e) { if (e.target === $(id)) closeToStudio(); });
  });
  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('sugartown:refresh', function () { refresh(); renderRoute(); });
  refresh(); renderRoute();
})();
