(function () {
  'use strict';
  var T = window.SugarTown, $ = function (id) { return document.getElementById(id); };
  var requested = location.hash.slice(1);
  var selected = T.DRESS.some(function (d) { return d.id === requested; }) ? requested : T.get().worn;
  var busy = false;

  function lvNow() { return T.level().n; }
  function unlockNote(d) {
    if (!d.levelAt) return '';
    return lvNow() >= d.levelAt ? 'Lv.' + d.levelAt + ' 달성 해금' : 'Lv.' + d.levelAt + ' 달성하면 무료';
  }

  function refresh() {
    var state = T.get(), lv = lvNow(), d = T.dressOf(selected), owned = T.isOwned(d.id), wearing = state.worn === d.id;
    var missing = Math.max(0, d.price - state.coins);
    var unlocked = !!d.levelAt && lv >= d.levelAt;
    $('lookStatus').textContent = wearing ? '착용 중' : '미리 입어보기';
    T.showDancer($('lookDancer'), d.id, 'ready');
    $('lookName').textContent = d.name;
    $('lookDesc').textContent = d.desc;
    $('lookCost').textContent = owned ? (wearing ? '현재 연습복' : '내 옷장에 있어요') :
      d.giftAt ? '수업 한 번을 마치면 받는 첫 의상이에요.' :
      unlocked ? 'Lv.' + d.levelAt + ' 달성 해금 의상이에요. 코인 없이 입을 수 있어요.' :
      d.levelAt ? T.fmt(d.price) + '코인 · Lv.' + d.levelAt + ' 달성하면 무료로 받아요.' :
      T.fmt(d.price) + '코인' + (missing ? ' · ' + T.fmt(missing) + '코인 더 모으면 살 수 있어요.' : ' · 지금 살 수 있어요.');
    var action = $('lookAction');
    action.hidden = wearing || (!owned && (d.giftAt || (!unlocked && missing > 0)));
    action.disabled = busy;
    action.textContent = owned ? '이 옷으로 갈아입기' :
      unlocked ? 'Lv.' + d.levelAt + ' 해금 의상 입기' : T.fmt(d.price) + '코인으로 사서 입기';
    $('lookGo').href = '../studio/?v=' + T.V + (state.lesson ? '#lesson' : '#first-bar');
    $('lookGo').textContent = state.lesson ? '수업 이어 하기' : wearing ? '이 옷 입고 연습하기' : !owned && d.giftAt ? '무료 수업에서 선물 받기' : '연습하러 가기';
    $('ownCount').textContent = '보유 ' + state.owned.length + ' / ' + T.DRESS.length;
    $('shop').querySelectorAll('button').forEach(function (button) {
      var item = T.dressOf(button.dataset.preview), open = !!item.levelAt && lv >= item.levelAt;
      var worn = item.id === state.worn, mine = T.isOwned(item.id);
      button.setAttribute('aria-pressed', String(item.id === d.id));
      button.classList.toggle('locked', !!item.levelAt && !mine);
      button.querySelector('small').textContent = worn ? '착용 중' : mine ? '보유' :
        item.giftAt ? '첫 수업 선물' : open ? 'Lv.' + item.levelAt + ' 해금' : T.fmt(item.price) + '코인';
      var badge = button.querySelector('.lv-badge');
      if (item.levelAt) {
        if (!badge) { badge = document.createElement('em'); badge.className = 'lv-badge'; button.querySelector('.sample').appendChild(badge); }
        badge.textContent = open ? 'Lv.' + item.levelAt + ' 해금' : 'Lv.' + item.levelAt;
        badge.className = 'lv-badge' + (open ? ' on' : '');
        badge.hidden = false;
      } else if (badge) badge.hidden = true;
    });
    T.syncUI();
  }

  T.DRESS.forEach(function (d) {
    var b = document.createElement('button');
    b.className = 'outfit-card'; b.type = 'button'; b.dataset.preview = d.id;
    b.innerHTML = '<span class="sample"><img loading="lazy" alt=""></span><strong>' + d.name + '</strong><small></small>';
    b.querySelector('img').src = T.dancerArt(d.id, 'ready');
    b.style.setProperty('--cloth', d.sk);
    b.addEventListener('click', function () {
      selected = d.id;
      history.replaceState(history.state, '', location.pathname + location.search + '#' + d.id);
      $('lookMessage').textContent = '';
      refresh();
      if ($('fitting').getBoundingClientRect().top < -35) $('fitting').scrollIntoView({ block: 'start' });
    });
    $('shop').appendChild(b);
  });
  $('lookAction').addEventListener('click', async function () {
    if (busy) return;
    var id = selected, wasOwned = T.isOwned(id), note = unlockNote(T.dressOf(id));
    busy = true; $('lookAction').disabled = true;
    try {
      var result = await T.updateWallet(function () { return wasOwned ? T.wear(id) : T.buy(id); });
      if (!result || !result.ok) $('lookMessage').textContent = '옷장과 지갑을 다시 확인했어요.';
      else if (result.free) $('lookMessage').textContent = '레벨 보상으로 ' + result.item.name + '을(를) 받았어요. ' + note + '!';
      else $('lookMessage').textContent = result.item.name + ' 착용 완료.';
    } finally { busy = false; refresh(); }
  });
  window.addEventListener('sugartown:refresh', refresh);
  refresh();
})();
