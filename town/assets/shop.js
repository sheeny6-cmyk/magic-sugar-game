/* 상점 주문대: 분식집과 카페에서 코인으로 메뉴를 골라 주문하고,
   주문한 바로 그 메뉴의 사진과 정령의 한마디가 담긴 카드를 띄운다. */
(function () {
  'use strict';
  var T = window.SugarTown;
  if (!T) return;
  var $ = function (id) { return document.getElementById(id); };

  var box = document.querySelector('[data-shop]');
  if (!box) return;
  var kind = box.getAttribute('data-shop');
  var list = kind === 'cafe' ? T.CAFE : T.MENU;
  var grid = box.querySelector('.menu-grid');
  /* 고른 메뉴의 주문 버튼은 화면 아래에 떠서 언제든 누를 수 있게 한다. */
  var cta = document.createElement('button');
  cta.type = 'button';
  cta.className = 'order-cta shop-fab';
  cta.hidden = true;
  document.body.appendChild(cta);
  var selected = null;
  var dialog = document.querySelector('.order-card');

  function coin(n) { return T.fmt(n) + '코인'; }

  function cardHTML(m) {
    var img = kind === 'cafe' ? m.img : m.thumb;
    var chips = T.buffChips(m.buff);
    return '<button class="menu-card" type="button" data-id="' + m.id + '" aria-pressed="false">' +
      '<span class="pic"><img src="' + img + '" alt="' + m.name + '" loading="lazy">' +
      '<span class="coin">' + m.price + ' 🪙</span></span>' +
      '<b>' + m.name + '</b>' +
      '<span class="desc">' + (m.desc || '') + '</span>' +
      '<span class="chips">' + chips.slice(0, 2).map(function (c) { return '<i>' + c + '</i>'; }).join('') + '</span>' +
      '</button>';
  }

  function render() {
    grid.innerHTML = list.map(cardHTML).join('');
    var meal = T.get().kingdom.meal;
    box.querySelector('.now-meal').textContent = meal
      ? '지금 걸린 기운 · ' + meal.name + ' (' + T.buffChips(meal.buff).join(' · ') + ')'
      : '주문한 메뉴의 기운은 다음 연습·공연 한 번에 걸려요.';
    paintCta();
  }
  function paintCta() {
    if (!selected) {
      cta.hidden = true;
      cta.disabled = true;
      cta.textContent = '메뉴를 골라 주세요';
      return;
    }
    cta.hidden = false;
    var m = T.mealOf(kind, selected);
    var left = T.get().coins;
    cta.disabled = left < m.price;
    cta.textContent = left < m.price
      ? '코인이 ' + T.fmt(m.price - left) + '개 모자라요'
      : m.name + ' 주문하기 · ' + m.price + '코인';
  }

  grid.addEventListener('click', function (e) {
    var b = e.target.closest('[data-id]');
    if (!b) return;
    selected = b.dataset.id;
    Array.prototype.forEach.call(grid.querySelectorAll('.menu-card'), function (card) {
      var on = card === b;
      card.classList.toggle('active', on);
      card.setAttribute('aria-pressed', String(on));
    });
    paintCta();
  });

  cta.addEventListener('click', function () {
    if (!selected) return;
    T.orderMeal(kind, selected).then(function (r) {
      if (!r || !r.ok) {
        T.toast(r && r.reason === 'coins' ? '코인이 조금 더 필요해요' : '지금은 주문할 수 없어요');
        return;
      }
      showCard(r);
      render();
      T.syncUI();
    });
  });

  function speaker() {
    var s = T.get();
    if (s.practiceWith) return T.SPIRITS[s.practiceWith];
    return T.SPIRITS[kind === 'cafe' ? 'ara' : 'etu'];
  }

  function showCard(r) {
    var m = r.menu, sp = speaker();
    dialog.querySelector('.oc-photo img').src = kind === 'cafe' ? m.img : m.img;
    dialog.querySelector('.oc-photo img').alt = m.name + ' 사진';
    dialog.querySelector('.oc-tag').textContent = kind === 'cafe' ? '방금 내렸어요' : '방금 나왔어요';
    dialog.querySelector('.oc-name').textContent = m.name;
    dialog.querySelector('.oc-face img').src = T.spiritArt(sp.id, true);
    dialog.querySelector('.oc-who').textContent = sp.name;
    dialog.querySelector('.oc-line').textContent = '“' + (m.line || m.magic || '') + '”';
    dialog.querySelector('.oc-buffs').innerHTML = T.buffChips(m.buff).map(function (c) {
      return '<li>' + c + '</li>';
    }).join('');
    dialog.querySelector('.oc-coins').textContent = '🪙 -' + T.fmt(r.price) + ' · 남은 코인 ' + T.fmt(r.coins);
    dialog.querySelector('.oc-note').textContent = kind === 'cafe'
      ? '카페의 온기가 다음 연습 한 번에 남아 있어요.'
      : '분식집의 기운이 다음 연습 한 번에 남아 있어요.';
    if (!dialog.open) dialog.showModal();
  }

  dialog.querySelector('.oc-ok').addEventListener('click', function () {
    if (dialog.open) dialog.close();
  });
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) dialog.close();
  });

  window.addEventListener('sugartown:refresh', render);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) render(); });
  render();
})();
