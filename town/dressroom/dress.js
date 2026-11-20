/* ===== 👗 드레스룸 · 상점 & 옷장 ===== */
(function () {
  'use strict';
  var T = window.SugarTown, $ = function (id) { return document.getElementById(id); };

  function renderLook() {
    var s = T.get(), d = T.dressOf(s.worn);
    $('lookFig').innerHTML = T.dressHTML(d.id, 'lg');
    $('lookName').textContent = d.name;
    $('lookDesc').textContent = d.desc;
    $('lookTag').textContent = '“' + d.tag + '”';
  }

  function renderShop() {
    var s = T.get();
    $('ownCount').textContent = '보유 ' + s.owned.length + ' / ' + T.DRESS.length;
    $('shop').innerHTML = T.DRESS.map(function (d) {
      var owned = s.owned.indexOf(d.id) >= 0;
      var wearing = s.worn === d.id;
      var state = wearing ? '<span class="state on">착용중</span>' : (owned ? '<span class="state">보유</span>' : '');
      var price = d.price === 0
        ? '<div class="price free">기본 지급</div>'
        : (owned
          ? '<div class="price free">내 옷장에 있음</div>'
          : '<div class="price"><span class="ic">🪙</span>' + T.fmt(d.price) + '</div>');
      var btn;
      if (wearing) btn = '<button class="btn ghost" disabled>입고 있어요</button>';
      else if (owned) btn = '<button class="btn ghost" data-wear="' + d.id + '">입기</button>';
      else btn = '<button class="btn gold" data-buy="' + d.id + '">구매하기</button>';
      return '<article class="item' + (wearing ? ' wearing' : '') + (owned ? ' owned' : '') + '" data-card="' + d.id + '">' +
        state +
        (owned ? '' : '<span class="lock">🔒</span>') +
        T.dressHTML(d.id, '') +
        '<h3>' + d.name + '</h3>' +
        '<span class="tagsm">' + d.tag + '</span>' +
        price + btn +
        '</article>';
    }).join('');
  }

  function refresh() {
    renderLook();
    renderShop();
    T.syncUI();
  }

  $('shop').addEventListener('click', function (e) {
    var buy = e.target.closest('[data-buy]');
    var wear = e.target.closest('[data-wear]');
    if (buy) {
      var id = buy.getAttribute('data-buy');
      var d = T.dressOf(id);
      var r = T.buy(id);
      if (r.ok) {
        T.toast(d.name + ' 구매 완료! 바로 입었어요 ✨');
        refresh();
      } else if (r.reason === 'coins') {
        var card = document.querySelector('[data-card="' + id + '"]');
        if (card) { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); }
        T.toast('코인이 ' + T.fmt(r.need) + '개 부족해요. 분식집에서 손님 고민을 해결해 볼까요? 🍢');
      }
    }
    if (wear) {
      var wr = T.wear(wear.getAttribute('data-wear'));
      if (wr.ok) {
        T.toast(wr.item.name + '으로 갈아입었어요 👗');
        refresh();
      }
    }
  });

  refresh();
})();
