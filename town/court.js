(function () {
  'use strict';
  var T = window.SugarTown;
  var $ = function (id) { return document.getElementById(id); };
  var courseNames = { bar: '바 연습', center: '센터 연습', piece: '작품 연습' };
  var nickMode = 'welcome';

  function nick() { return T.nick(); }

  /* ---------- 프리마 승급 로드맵 ---------- */
  function stepRow(rank, lv) {
    var state = rank.n < lv.n ? 'done' : rank.n === lv.n ? 'now' : 'locked';
    var mark = rank.crown ? '👑' : state === 'done' ? '✓' : rank.n;
    return '<li class="road-step ' + state + '"' + (rank.n === lv.n ? ' aria-current="step"' : '') + '>' +
      '<span class="rs-mark" aria-hidden="true">' + mark + '</span>' +
      '<b>' + rank.short + '</b>' +
      '<small>' + rank.tag + '</small></li>';
  }

  function recommend(lv, s) {
    var next = lv.next;
    if (!next) return { href: 'stage/?v=' + T.V, label: '👑 프리마 피날레 무대 열기' };
    var open = lv.steps.filter(function (row) { return !row.done; });
    var classes = open.filter(function (row) { return row.key === 'classes'; })[0];
    var stat = open.filter(function (row) { return row.key === 'stat'; })[0];
    var shows = open.filter(function (row) { return row.key === 'shows'; })[0];
    if (classes) {
      return {
        href: 'studio/?v=' + T.V + (s.lesson ? '#lesson' : s.classes ? '' : '#first-bar'),
        label: '스튜디오에서 ' + courseNames[s.lesson ? s.lesson.kind : 'bar'] + (s.lesson ? ' 이어 하기' : ' ' + classes.left + '번 더')
      };
    }
    if (stat) return { href: 'snack/?v=' + T.V, label: '분식집에서 능력치 ' + stat.left + ' 채우기' };
    if (shows) {
      if (T.stageReady()) return { href: 'stage/?v=' + T.V, label: '왕립 극장에서 공연 ' + shows.left + '회 더' };
      return { href: 'studio/?v=' + T.V, label: '극장 초대장까지 수업 ' + T.stageLeft() + '번' };
    }
    return { href: 'studio/?v=' + T.V, label: '스튜디오에서 한 곡 더' };
  }

  function renderRoadmap(lv, s) {
    $('roadTitle').textContent = 'Lv.' + lv.n + ' ' + lv.name;
    $('rankChip').textContent = lv.next ? '다음 승급까지' : '👑 프리마 달성';
    $('rankChip').className = 'rank-chip' + (lv.crown ? ' crown' : '');
    $('roadSteps').innerHTML = T.RANKS.map(function (rank) { return stepRow(rank, lv); }).join('');
    if (!lv.next) {
      $('roadNext').textContent = '👑 ' + nick() + '님이 프리마 발레리나가 되었어요.';
      $('roadNeeds').innerHTML = '<li class="need-row done"><span>왕립 발레단의 별</span><b>' + T.fmt(s.classes) + '회 수료 · 공연 ' + T.fmt(s.shows || 0) + '회</b></li>';
      var cta = $('roadCta');
      cta.href = 'stage/?v=' + T.V;
      cta.textContent = '왕립 극장 피날레 무대로';
      $('roadNote').textContent = '황금 포스터와 피날레 무대가 열렸어요.';
      return;
    }
    $('roadNext').textContent = '다음은 Lv.' + lv.next.n + ' ' + lv.next.name + '.';
    $('roadNeeds').innerHTML = lv.steps.map(function (row) {
      return '<li class="need-row' + (row.done ? ' done' : '') + '">' +
        '<span>' + row.label + '</span>' +
        '<b>' + T.fmt(row.have) + ' / ' + T.fmt(row.need) + row.unit + '</b>' +
        '<i aria-hidden="true"><em style="width:' + row.pct + '%"></em></i></li>';
    }).join('');
    var pick = recommend(lv, s);
    $('roadCta').href = pick.href;
    $('roadCta').textContent = pick.label;
    $('roadNote').textContent = lv.crown
      ? '프리마의 무대는 계속 열려 있어요. 앙코르 공연으로 명성을 더 쌓을 수 있어요.'
      : s.levelUp ? '🎁 새 승급 보상이 도착했어요. 스튜디오에 들어가면 축하 카드가 열려요.'
      : '한 단계 오를 때마다 옷장과 무대가 열려요.';
  }

  /* ---------- 오늘의 초대장 ---------- */
  function refresh() {
    var s = T.get(), k = s.kingdom, dose = k.prepared, lesson = s.lesson;
    var level = T.level(), reward = T.rewardFor(lesson ? lesson.kind : 'bar', dose);
    var first = !s.classes && !lesson;
    var who = nick();
    $('nextTitle').textContent = lesson ? courseNames[lesson.kind] + ' 이어서' : first ? '첫 바 연습' : '오늘의 바 연습';
    $('nextGoal').textContent = lesson ? '연습 중이던 노래를 처음부터 다시 틀어 드려요.'
      : '에튜 선생님과 3/4 왈츠에 맞춰 박자를 타요.';
    $('nextReward').innerHTML = '노트 완주 <b>+' + T.fmt(reward.coins) + '코인</b>';
    $('nextAction').href = lesson ? 'studio/?v=' + T.V + '#lesson' : 'studio/?v=' + T.V + '#first-bar';
    $('nextAction').firstChild.textContent = lesson ? '연습 이어 하기 ' : dose ? '포션 들고 바 연습하기 ' : first ? '첫 바 연습 시작 ' : '바 연습 시작 ';
    var target = T.nextDress();
    if (!s.classes && !T.isOwned('lilac')) $('ticketNote').textContent = '첫 수업 선물 · 라일락 쉬폰 스커트';
    else if (dose) $('ticketNote').textContent = T.STAFF[dose.id].name + ' 포션 준비 · ' + T.effectFor(dose.id, dose.level).label;
    else if (target) $('ticketNote').textContent = s.coins >= target.price ? '드레스룸에서 구매 가능 · ' + target.name : '다음 의상 · ' + target.name + '까지 ' + T.fmt(target.price - s.coins) + '코인';
    else $('ticketNote').textContent = '이번 연습복 · ' + T.dressOf(s.worn).name;
    $('stageShortcut').hidden = !T.stageReady();
    $('stageShortcut').textContent = T.prima() ? '프리마 피날레 무대 열기 →' : k.debutOutfit ? '오늘의 의상으로 앙코르 공연 →' : '첫 리허설 초대장 열기 →';
    $('staffIntro').textContent = dose ? T.SPIRITS[dose.id].name + '의 포션이 준비됐어요. ' + who + '님이 연습을 마치면 효과가 발동해요.'
      : !s.classes && !Object.values(k.orders).some(Boolean) ? '첫 지원금은 ' + T.GRANT + '코인이에요. 포션 한 잔을 ' + T.POTION_PRICE + '코인에 주문하면 생명력 1이 담당 정령에게 전해져요.'
      : '다음 연습을 도와줄 정령을 골라요. 주문할 때마다 그 정령에게 생명력이 전해져요.';
    $('staffRoster').innerHTML = Object.keys(T.STAFF).map(function (id) {
      var spirit = T.SPIRITS[id];
      return '<a class="staff-link" href="potions/?v=' + T.V + '#' + id + '" style="--tint:' + spirit.color + '"><span class="cameo"><img src="' + T.spiritArt(id, true) + '" alt=""></span><b>' + spirit.name + '</b><small>Lv.' + T.staffLevel(k.orders[id]) + '</small></a>';
    }).join('');
    $('idRank').textContent = 'Lv.' + level.n + ' ' + level.name;
    $('lvName').textContent = 'Lv.' + level.n + ' ' + level.name;
    $('lvBar').style.width = level.pct + '%';
    $('recordTitle').textContent = who + '의 연습 기록';
    var open = level.steps.filter(function (row) { return !row.done; });
    $('lvNote').textContent = level.next
      ? '누적 수료 ' + s.classes + '회 · ' + level.next.name + '까지 ' + open.map(function (row) { return row.label + ' ' + (row.need - row.have) + row.unit; }).join(' · ')
      : '누적 수료 ' + s.classes + '회 · 공연 ' + (s.shows || 0) + '회 · 👑 프리마 발레리나';
    $('stageLine').textContent = T.prima() ? '프리마 피날레 무대가 열려 있어요'
      : T.stageReady() ? (k.debutOutfit ? '앙코르 무대에 오르기' : '오늘의 의상으로 첫 리허설') : '첫 리허설 초대장까지 도장 ' + T.stageLeft() + '개';
    var best = T.cafeBest();
    if (best) $('cafeBest').textContent = '최고 매출 ' + T.fmt(best) + '원';
    renderRoadmap(level, s);
    T.syncUI();
  }

  /* ---------- 닉네임 ---------- */
  function openNick(mode) {
    nickMode = mode || (T.named() ? 'edit' : 'welcome');
    var welcome = nickMode === 'welcome';
    $('nickKicker').textContent = welcome ? '발레 왕국 입장' : '닉네임 바꾸기';
    $('nickTitle').textContent = welcome ? '어떤 이름으로 부를까요?' : '새 이름으로 부를까요?';
    $('nickLead').textContent = welcome
      ? '이 이름이 인사말, 정령의 대사, 왕립 극장 공연 포스터에 들어가요.'
      : '바꾸면 인사말과 포스터에 바로 새 이름이 쓰여요.';
    $('nickSkip').textContent = welcome ? '나중에 정하기' : '취소';
    $('nickSave').textContent = welcome ? '이 이름으로 시작' : '저장';
    $('nickHint').textContent = '한글·영문 2~8자. 비워 두면 슈가로 시작해요.';
    $('nickHint').className = 'nick-hint';
    $('nickInput').value = T.get().nick || '';
    if (!$('nickDialog').open) $('nickDialog').showModal();
    setTimeout(function () { $('nickInput').focus({ preventScroll: true }); $('nickInput').select(); }, 60);
  }

  function saveNick(event) {
    if (event) event.preventDefault();
    var raw = $('nickInput').value, clean = String(raw).replace(/\s+/g, ' ').trim();
    if (clean.length > T.NICK_MAX) {
      $('nickHint').textContent = '닉네임은 ' + T.NICK_MAX + '자까지 쓸 수 있어요.';
      $('nickHint').className = 'nick-hint warn';
      return;
    }
    $('nickSave').disabled = true;
    T.setNick(clean).then(function () {
      $('nickSave').disabled = false;
      $('nickDialog').close();
      refresh();
      T.toast(clean ? clean + '님, 반가워요!' : '슈가로 시작할게요!');
    }).catch(function () { $('nickSave').disabled = false; });
  }

  function skipNick() {
    if (nickMode === 'edit') { $('nickDialog').close(); return; }
    T.setNick('').then(function () {
      $('nickDialog').close();
      refresh();
    });
  }

  $('nickForm').addEventListener('submit', saveNick);
  $('nickSkip').addEventListener('click', skipNick);
  $('nickEdit').addEventListener('click', function () { openNick('edit'); });
  $('nickDialog').addEventListener('cancel', function (e) {
    if (nickMode === 'welcome') { e.preventDefault(); skipNick(); }
  });

  window.addEventListener('sugartown:refresh', refresh);
  refresh();
  if (!T.named()) setTimeout(function () { openNick('welcome'); }, 220);
})();
