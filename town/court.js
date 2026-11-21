(function () {
  'use strict';
  var T = window.SugarTown;
  var $ = function (id) { return document.getElementById(id); };
  var courseNames = { bar: '바 연습', center: '센터 연습', piece: '작품 연습' };
  function refresh() {
    var s = T.get(), k = s.kingdom, dose = k.prepared, lesson = s.lesson;
    var level = T.level(), reward = T.rewardFor(lesson ? lesson.kind : 'bar', dose);
    var first = !s.classes && !lesson;
    $('nextTitle').textContent = lesson ? courseNames[lesson.kind] + ' 이어서' : first ? '첫 바 연습' : '오늘의 바 연습';
    $('nextGoal').textContent = lesson ? (lesson.index + 1) + '번째 빈칸에서 선생님이 기다리고 있어요.'
      : '에튜의 말을 듣고 빈칸에 들어갈 발레 용어 세 개를 골라요.';
    $('nextReward').innerHTML = '세 문제 완주 <b>+' + T.fmt(reward.coins) + '코인</b>';
    $('nextAction').href = lesson ? 'studio/?v=' + T.V + '#lesson' : 'studio/?v=' + T.V + '#first-bar';
    $('nextAction').firstChild.textContent = lesson ? '연습 이어 하기 ' : dose ? '포션 들고 바 연습하기 ' : first ? '첫 바 연습 시작 ' : '바 연습 시작 ';
    var target = T.nextDress();
    if (!s.classes && !T.isOwned('lilac')) $('ticketNote').textContent = '첫 수업 선물 · 라일락 쉬폰 스커트';
    else if (dose) $('ticketNote').textContent = T.STAFF[dose.id].name + ' 포션 준비 · ' + T.effectFor(dose.id, dose.level).label;
    else if (target) $('ticketNote').textContent = s.coins >= target.price ? '드레스룸에서 구매 가능 · ' + target.name : '다음 의상 · ' + target.name + '까지 ' + T.fmt(target.price - s.coins) + '코인';
    else $('ticketNote').textContent = '이번 연습복 · ' + T.dressOf(s.worn).name;
    $('stageShortcut').hidden = !T.stageReady();
    $('stageShortcut').textContent = k.debutOutfit ? '오늘의 의상으로 앙코르 공연 →' : '첫 리허설 초대장 열기 →';
    $('staffIntro').textContent = dose ? T.SPIRITS[dose.id].name + '의 포션이 준비됐어요. 슈가가 연습을 마치면 효과가 발동해요.'
      : !s.classes && !Object.values(k.orders).some(Boolean) ? '첫 지원금은 ' + T.GRANT + '코인이에요. 포션 한 잔을 ' + T.POTION_PRICE + '코인에 주문하면 생명력 1이 담당 정령에게 전해져요.'
      : '다음 연습을 도와줄 정령을 골라요. 주문할 때마다 그 정령에게 생명력이 전해져요.';
    $('staffRoster').innerHTML = Object.keys(T.STAFF).map(function (id) {
      var spirit = T.SPIRITS[id];
      return '<a class="staff-link" href="potions/?v=' + T.V + '#' + id + '" style="--tint:' + spirit.color + '"><span class="cameo"><img src="' + T.spiritArt(id, true) + '" alt=""></span><b>' + spirit.name + '</b><small>Lv.' + T.staffLevel(k.orders[id]) + '</small></a>';
    }).join('');
    $('lvName').textContent = 'Lv.' + level.n + ' ' + level.name;
    $('lvBar').style.width = level.pct + '%';
    $('lvNote').textContent = '누적 수료 ' + s.classes + '회' + (level.next ? ' · 다음 레벨까지 연습 ' + (level.need - level.have) + '번' : '');
    $('stageLine').textContent = T.stageReady() ? (k.debutOutfit ? '앙코르 무대에 오르기' : '오늘의 의상으로 첫 리허설') : '첫 리허설 초대장까지 도장 ' + T.stageLeft() + '개';
    var best = T.cafeBest();
    if (best) $('cafeBest').textContent = '최고 매출 ' + T.fmt(best) + '원';
    T.syncUI();
  }
  window.addEventListener('sugartown:refresh', refresh);
  refresh();
})();
