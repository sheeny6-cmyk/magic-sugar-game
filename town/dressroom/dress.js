(function () {
  'use strict';
  var T = window.SugarTown;
  var $ = function (id) { return document.getElementById(id); };
  var requested = location.hash.slice(1);
  var selected = T.DRESS.some(function (d) { return d.id === requested; }) ? requested : T.get().worn;
  var busy = false, previewPose = 'ready';
  var SPIRIT = {
    basic: { name: '알레', line: '처음 입은 연습복에는 첫 박자의 설렘이 담겨 있어요. 하나, 둘, 셋!' },
    lilac: { name: '아라', line: '라일락 스커트가 살랑이면 손끝도 조금 더 길게 뻗어 보세요.' },
    swan: { name: '에튜', line: '하얀 튜튜를 입고 천천히 중심을 잡아 봐요. 한 박자 더 머물러도 좋아요.' },
    black: { name: '피루', line: '블랙 스완이라면 역시 회전이죠! 오늘은 한 바퀴부터 멋지게 돌아 봐요.' },
    sugar: { name: '샹즈', line: '드디어 마법 드레스! 가장 멋진 순간은 두 발로 무대에 서는 순간이에요.' }
  };

  function lvNow() { return T.level().n; }
  function courseLink(state) {
    return '../studio/?v=' + T.V + (state.lesson ? '#lesson' : '#first-bar');
  }
  function refresh() {
    var state = T.get(), lv = lvNow(), d = T.dressOf(selected);
    var owned = T.isOwned(d.id), wearing = state.worn === d.id;
    var missing = Math.max(0, d.price - state.coins), unlocked = !!d.levelAt && lv >= d.levelAt;
    $('lookStatus').textContent = wearing ? '현재 착용 중' : '미리 입어보는 중';
    $('outfitState').textContent = wearing ? '착용 중' : owned ? '보유 의상' : d.giftAt ? '첫 수업 선물' : unlocked ? '무료 수령 가능' : '미보유';
    T.showDancer($('lookDancer'), d.id, previewPose);
    $('fittingPoses').querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.pose === previewPose));
    });
    $('lookName').textContent = d.name;
    $('lookDesc').textContent = d.desc;
    if (wearing) $('lookCost').textContent = '지금 이 옷을 입고 있어요.';
    else if (owned) $('lookCost').textContent = '내 옷장에 있는 의상이에요. 바로 갈아입을 수 있어요.';
    else if (d.giftAt) $('lookCost').textContent = '첫 수업 1회를 마치면 무료로 받아요.';
    else if (unlocked) $('lookCost').textContent = 'Lv.' + d.levelAt + ' 달성 보상 · 지금 무료로 받을 수 있어요.';
    else if (d.levelAt) $('lookCost').textContent = '지금 ' + T.fmt(d.price) + '코인 구매 또는 Lv.' + d.levelAt + ' 달성 시 무료 보상';
    else $('lookCost').textContent = T.fmt(d.price) + '코인으로 구매할 수 있어요.';

    var action = $('lookAction');
    action.hidden = wearing;
    action.disabled = busy || (!owned && (d.giftAt || (!unlocked && missing > 0)));
    action.textContent = owned ? '이 의상으로 갈아입기' :
      d.giftAt ? '첫 수업 완료 후 선물 받기' :
      unlocked ? '레벨 보상 무료로 받기' :
      missing ? T.fmt(missing) + '코인 더 필요해요' :
      T.fmt(d.price) + '코인으로 구매하고 입기';

    $('lookGo').href = courseLink(state);
    $('lookGo').textContent = state.lesson ? '진행 중인 수업 이어 하기' :
      wearing ? '이 옷 입고 연습하기' :
      owned ? '현재 착용한 옷으로 연습하기' :
      d.giftAt ? '첫 수업 하러 가기' : '현재 착용한 옷으로 연습하기';
    $('wearTip').textContent = wearing ?
      '선택한 의상이 연습실에서도 적용돼요.' :
      owned ? '지금은 미리보기 상태예요. 위 버튼을 눌러 갈아입어 주세요.' :
      '미리 입어본 모습이에요. 구매하거나 선물로 받아야 실제로 착용할 수 있어요.';
    $('ownCount').textContent = '보유 ' + state.owned.length + ' / ' + T.DRESS.length + '벌';
    $('previewHelp').textContent = '의상을 고르면 ' + T.nick() + '님이 거울에서 먼저 입어 보여줘요.';
    $('spiritName').textContent = SPIRIT[d.id].name + '의 한마디';
    $('spiritLine').textContent = SPIRIT[d.id].line;

    $('shop').querySelectorAll('button').forEach(function (button) {
      var item = T.dressOf(button.dataset.preview);
      var open = !!item.levelAt && lv >= item.levelAt;
      var worn = item.id === state.worn, mine = T.isOwned(item.id);
      button.setAttribute('aria-pressed', String(item.id === d.id));
      button.classList.toggle('locked', !!item.levelAt && !open && !mine);
      button.querySelector('small').textContent = worn ? '착용 중' : mine ? '보유 중 · 갈아입기' :
        item.giftAt ? '첫 수업 후 무료' :
        open ? '레벨 보상 · 무료 수령' :
        item.levelAt ? T.fmt(item.price) + '코인 / Lv.' + item.levelAt + ' 무료' : T.fmt(item.price) + '코인';
      var badge = button.querySelector('.lv-badge');
      if (!mine && (item.levelAt || item.giftAt)) {
        if (!badge) {
          badge = document.createElement('em');
          badge.className = 'lv-badge';
          button.querySelector('.sample').appendChild(badge);
        }
        badge.textContent = item.giftAt ? '수업 선물' : open ? '무료 수령' : 'Lv.' + item.levelAt + ' 보상';
        badge.className = 'lv-badge' + (open ? ' on' : '');
        badge.hidden = false;
      } else if (badge) badge.hidden = true;
    });
    T.syncUI();
  }

  $('fittingPoses').addEventListener('click', function (e) {
    var b = e.target.closest('[data-pose]');
    if (b) { previewPose = b.dataset.pose; refresh(); }
  });
  T.DRESS.forEach(function (d) {
    var b = document.createElement('button');
    b.className = 'outfit-card'; b.type = 'button'; b.dataset.preview = d.id;
    b.innerHTML = '<span class="sample"><img loading="lazy" alt=""></span><strong></strong><small></small>';
    b.querySelector('img').src = T.dancerArt(d.id, 'ready');
    b.querySelector('img').alt = d.name;
    b.querySelector('strong').textContent = d.name;
    b.style.setProperty('--cloth', d.sk);
    b.addEventListener('click', function () {
      selected = d.id;
      history.replaceState(history.state, '', location.pathname + location.search + '#' + d.id);
      $('lookMessage').textContent = '';
      refresh();
      if ($('fitting').getBoundingClientRect().top < -35) $('fitting').scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    $('shop').appendChild(b);
  });
  $('lookAction').addEventListener('click', async function () {
    if (busy) return;
    var id = selected, wasOwned = T.isOwned(id);
    busy = true;
    $('lookAction').disabled = true;
    try {
      var result = await T.updateWallet(function () { return wasOwned ? T.wear(id) : T.buy(id); });
      if (!result || !result.ok) $('lookMessage').textContent = '옷장과 코인을 다시 확인해 주세요.';
      else if (result.free) $('lookMessage').textContent = result.item.name + '을(를) 레벨 보상으로 받았어요! 이제 착용 중이에요.';
      else $('lookMessage').textContent = result.item.name + ' 착용 완료! 연습실에서도 이 모습으로 등장해요.';
    } catch (e) {
      $('lookMessage').textContent = '잠시 문제가 생겼어요. 다시 시도해 주세요.';
    } finally {
      busy = false;
      refresh();
    }
  });
  window.addEventListener('sugartown:refresh', refresh);
  refresh();
})();
