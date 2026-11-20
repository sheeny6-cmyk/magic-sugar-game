/* ===== 🩰 발레 스튜디오 · 수업 ===== */
(function () {
  'use strict';
  var T = window.SugarTown, $ = function (id) { return document.getElementById(id); };

  var CLASSES = [
    {
      id: 'bar', name: '바 워크', kick: 'BARRE WORK', fee: 100, icon: '🩰',
      grad: 'linear-gradient(140deg,#f3e6ff,#fce9f4)', stats: { flex: 8, axis: 4 },
      desc: '바를 잡고 플리에·랑드망으로 다리와 중심을 데워요.',
      steps: [
        ['바 잡기', '등을 곧게, 어깨는 내리고 숨을 고르세요.'],
        ['플리에', '무릎을 부드럽게 굽히고 발바닥으로 바닥을 밀어요.'],
        ['랑드망', '다리를 옆으로, 발끝까지 쭉 이어서.'],
        ['르베랑스', '숨을 내쉬며 인사. 오늘도 수고했어요!']
      ]
    },
    {
      id: 'center', name: '센터 워크', kick: 'CENTER WORK', fee: 150, icon: '⚖️',
      grad: 'linear-gradient(140deg,#fdeaf3,#fff2e7)', stats: { axis: 8, turn: 4 },
      desc: '바 없이 중앙에서 아티튜드·아라베스크로 균형을 잡아요.',
      steps: [
        ['센터로', '바에서 손을 떼고 중앙으로 걸어 나가요.'],
        ['아티튜드', '한 다리로 서서 무릎을 들어 올리고 중심을 잡아요.'],
        ['아라베스크', '등을 길게, 손끝과 발끝을 멀리 보내요.'],
        ['르베랑스', '흔들리지 않고 인사까지. 균형 성공!']
      ]
    },
    {
      id: 'piece', name: '작품반', kick: 'REPERTOIRE', fee: 250, icon: '🎭',
      grad: 'linear-gradient(140deg,#efe7ff,#ffe7ee)', stats: { turn: 8, stam: 5, flex: 3 },
      desc: '작품 안무를 처음부터 끝까지. 무대를 위한 수업이에요.',
      steps: [
        ['음악 듣기', '첫 소절을 세며 호흡을 맞춰요.'],
        ['1막 안무', '왼쪽에서 오른쪽으로, 물처럼 흐르듯이.'],
        ['피루엣', '시선은 한 점에 고정하고 세 바퀴.'],
        ['커튼콜', '관객에게 인사! 오늘의 주인공은 나예요.']
      ]
    }
  ];

  var current = null, L = { cls: null, i: 0, timer: null, before: null, done: false };

  /* ---------- 화면 ---------- */
  function refresh() {
    var s = T.get(), lv = T.level(), d = T.dressOf(s.worn);
    $('wornName').textContent = d.name;
    $('wornFig').innerHTML = T.dressHTML(d.id, '');
    $('lvName').textContent = 'Lv.' + lv.n + ' ' + lv.name;
    $('lvClasses').textContent = '수업 ' + s.classes + '번';
    $('lvBar').style.width = lv.pct + '%';
    $('lvNote').textContent = lv.next
      ? '수업 ' + (lv.need - lv.have) + '번 더 들으면 Lv.' + lv.next.n + ' ' + lv.next.name + '이에요.'
      : '발레 왕국 스타! 이제 무대만 남았어요.';

    var slots = '';
    for (var i = 0; i < 5; i++) slots += '<span class="stamp' + (i < Math.min(5, s.classes) ? ' on' : '') + '">🩰</span>';
    slots += '<span class="stamp-count">바 ' + s.stamps.bar + ' · 센터 ' + s.stamps.center + ' · 작품 ' + s.stamps.piece + '</span>';
    $('stamps').innerHTML = slots;

    $('classes').innerHTML = CLASSES.map(function (c) {
      var no = s.coins < c.fee;
      var eff = Object.keys(c.stats).map(function (k) {
        return '<span>' + T.STATS[k].label + ' +' + c.stats[k] + '</span>';
      }).join('');
      return '<button class="cls' + (no ? ' no' : '') + '" data-cls="' + c.id + '" type="button">' +
        '<span class="tile" style="background:' + c.grad + '">' + c.icon + '</span>' +
        '<span class="info"><h3>' + c.name + '</h3><div class="sub">' + c.desc + '</div><div class="eff">' + eff + '</div></span>' +
        '<span class="fee"><b>' + T.fmt(c.fee) + ' 🪙</b><span>수강료</span></span>' +
        '</button>';
    }).join('');

    if (T.stageReady()) {
      $('stageTitle').textContent = '무대가 열렸어요!';
      $('stageSub').textContent = '첫 공연 리허설 초대장이 도착했어요.';
    } else {
      $('stageTitle').textContent = '무대까지 수업 ' + T.stageLeft() + '번';
      $('stageSub').textContent = '도장을 모으면 첫 공연 리허설이 열려요.';
    }
    T.syncUI();
  }

  /* ---------- 수강 확인 ---------- */
  function openConfirm(cls) {
    var s = T.get();
    current = cls;
    $('cKicker').textContent = cls.kick;
    $('cName').textContent = cls.name;
    $('cDesc').textContent = cls.desc;
    $('cFee').textContent = T.fmt(cls.fee) + ' 🪙';
    $('cGain').innerHTML = Object.keys(cls.stats).map(function (k) {
      return '<span>' + T.STATS[k].icon + ' ' + T.STATS[k].label + ' +' + cls.stats[k] + '</span>';
    }).join('');
    var lack = s.coins < cls.fee;
    $('cGo').textContent = lack ? (T.fmt(cls.fee - s.coins) + '코인 부족') : '수강하기';
    $('cGo').disabled = lack;
    $('confirm').classList.add('on');
    $('confirm').setAttribute('aria-hidden', 'false');
  }
  function closeConfirm() {
    $('confirm').classList.remove('on');
    $('confirm').setAttribute('aria-hidden', 'true');
  }

  /* ---------- 수업 진행 ---------- */
  function startLesson() {
    if (!current) return;
    if (!T.spend(current.fee)) { T.toast('코인이 부족해요.'); return; }
    L = { cls: current, i: 0, timer: null, before: T.level(), done: false };
    $('lKicker').textContent = current.kick;
    $('lTitle').textContent = current.name;
    $('lIcon').textContent = current.icon;
    $('lDots').innerHTML = current.steps.map(function () { return '<i></i>'; }).join('');
    $('lBar').style.width = '0%';
    $('lesson').classList.add('on');
    $('lesson').setAttribute('aria-hidden', 'false');
    closeConfirm();
    refresh();
    step();
  }

  function step() {
    var cls = L.cls;
    if (!cls || L.done) return;
    if (L.i >= cls.steps.length) { finishLesson(); return; }
    var st = cls.steps[L.i];
    $('lStep').textContent = st[0];
    $('lLine').textContent = st[1];
    $('lIcon').textContent = cls.icon;
    Array.prototype.forEach.call($('lDots').children, function (d, i) {
      d.className = i <= L.i ? 'on' : '';
    });
    $('lBar').style.width = Math.round(((L.i + 1) / cls.steps.length) * 100) + '%';
    L.i += 1;
    clearTimeout(L.timer);
    L.timer = setTimeout(step, 1400);
  }

  function finishLesson() {
    if (L.done) return;
    L.done = true;
    clearTimeout(L.timer);
    var cls = L.cls;
    var before = L.before || T.level();
    var gains = {};
    Object.keys(cls.stats).forEach(function (k) { gains[k] = cls.stats[k]; });
    T.addStats(gains);
    var after = T.addClass(cls.id);

    $('lesson').classList.remove('on');
    $('lesson').setAttribute('aria-hidden', 'true');

    var leveled = after.n > before.n;
    $('rTitle').textContent = leveled ? 'Lv.' + after.n + ' ' + after.name + '!' : '출석 도장 +1';
    var sub;
    if (T.stageReady() && before.classes < 5) sub = '수업 5번을 채웠어요. 드디어 무대가 열렸어요!';
    else if (leveled) sub = cls.name + ' 수업 완료. 한 단계 올라갔어요.';
    else sub = cls.name + ' 수업 완료. 오늘도 바를 놓지 않았어요.';
    $('rSub').textContent = sub;
    $('rStamp').textContent = cls.icon;
    $('rGains').innerHTML = Object.keys(gains).map(function (k) {
      return '<span>' + T.STATS[k].icon + ' ' + T.STATS[k].label + ' +' + gains[k] + '</span>';
    }).join('');
    $('rLv').textContent = 'Lv.' + after.n + ' ' + after.name;
    $('rBar').style.width = (T.stageReady() ? 100 : after.pct) + '%';
    $('rLvNote').textContent = T.stageReady()
      ? '무대 열림 · 수업 ' + T.get().classes + '번'
      : '무대까지 ' + T.stageLeft() + '번';
    $('rStage').textContent = T.stageReady() ? '🎭 무대 목표 보기' : '🎭 무대까지 ' + T.stageLeft() + '번';

    $('result').classList.add('on');
    $('result').setAttribute('aria-hidden', 'false');
    refresh();
  }

  function closeResult() {
    $('result').classList.remove('on');
    $('result').setAttribute('aria-hidden', 'true');
    refresh();
  }

  /* ---------- 이벤트 ---------- */
  $('classes').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cls]');
    if (!b) return;
    var cls = CLASSES.filter(function (c) { return c.id === b.getAttribute('data-cls'); })[0];
    if (!cls) return;
    var s = T.get();
    if (s.coins < cls.fee) {
      b.classList.remove('shake'); void b.offsetWidth;
      T.toast('수강료가 ' + T.fmt(cls.fee - s.coins) + '코인 부족해요. 분식집에서 벌어 올까요? 🍢');
      return;
    }
    openConfirm(cls);
  });
  $('cCancel').addEventListener('click', closeConfirm);
  $('cGo').addEventListener('click', startLesson);
  $('confirm').addEventListener('click', function (e) { if (e.target.id === 'confirm') closeConfirm(); });
  $('lNext').addEventListener('click', function () { clearTimeout(L.timer); step(); });
  $('rAgain').addEventListener('click', function () {
    closeResult();
    if (!L.cls) { T.toast('수업을 골라 주세요.'); return; }
    if (T.get().coins < L.cls.fee) { T.toast('코인이 부족해요. 분식집에서 더 벌어 와요 🍢'); return; }
    openConfirm(L.cls);
  });
  $('result').addEventListener('click', function (e) { if (e.target.id === 'result') closeResult(); });

  refresh();
})();
