(function () {
  'use strict';
  var T = window.SugarTown;
  var $ = function (id) { return document.getElementById(id); };
  var selected, ordering = false, justOrdered = null;
  var roles = { etu: '균형의 정령', ara: '아라베스크의 정령', piru: '회전의 정령', shangz: '점프의 정령', alle: '리듬의 정령' };
  function chooseFromUrl() {
    var id = location.hash.slice(1), held = T.get().kingdom.prepared;
    selected = Object.hasOwn(T.STAFF, id) ? id : held ? held.id : 'etu';
    render();
  }
  Object.keys(T.STAFF).forEach(function (id) {
    var spirit = T.SPIRITS[id], button = document.createElement('button');
    button.type = 'button'; button.className = 'staff-link'; button.dataset.staff = id;
    button.style.setProperty('--tint', spirit.color);
    button.innerHTML = '<span class="cameo"><img src="' + T.spiritArt(id, true) + '" alt=""></span><b>' + spirit.name + '</b>';
    button.addEventListener('click', function () {
      history.replaceState(history.state, '', location.pathname + location.search + '#' + id);
      selected = id; render();
    });
    $('shopRoster').appendChild(button);
  });
  function render() {
    var s = T.get(), k = s.kingdom, spirit = T.SPIRITS[selected], recipe = T.STAFF[selected];
    var count = k.orders[selected], level = T.staffLevel(count), nextLevel = T.staffLevel(count + 1);
    var progress = count % T.ORDERS_PER_LEVEL, left = T.ORDERS_PER_LEVEL - progress;
    var held = k.prepared, needCoins = Math.max(0, T.POTION_PRICE - s.coins), needLife = k.life < 1;
    var canOrder = !held && !needCoins && !needLife;
    $('shopRoster').querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.staff === selected)); });
    var art = T.spiritArt(selected, false);
    if ($('staffFigure').src !== art) $('staffFigure').src = art;
    $('staffFigure').alt = spirit.name;
    $('figureName').textContent = spirit.name;
    $('figureRole').textContent = roles[selected];
    $('shopWindow').dataset.spirit = selected;
    $('potionTitle').textContent = recipe.name + ' 포션';
    $('brewLevel').textContent = '조제 Lv.' + level;
    $('staffLine').textContent = '“' + T.staffLine(selected) + '”';
    var bond = T.bondOf(selected);
    $('bondHearts').innerHTML = T.heartsHTML(bond.level, 'bond-big');
    $('bondText').textContent = '친밀도 Lv.' + bond.level + ' / ' + bond.max +
      (bond.next == null ? ' · 가장 가까운 사이예요' : ' · 주문할 때마다 한 걸음 (다음 하트까지 ' + bond.left + '번)');
    var brewedLevel = held && held.id === selected ? held.level : nextLevel;
    $('effect').textContent = T.effectFor(selected, brewedLevel).label;
    $('progressName').textContent = spirit.name + '의 조제 경험';
    $('orderCount').textContent = '누적 ' + count + '잔';
    $('orderBar').style.width = (progress / T.ORDERS_PER_LEVEL * 100) + '%';
    $('growthNote').textContent = left === 1 ? '다음 한 잔부터 Lv.' + nextLevel + ' 효과로 만들어요.' : '앞으로 ' + left + '잔 주문하면 조제 레벨이 ' + (level + 1) + '로 올라요.';
    $('orderButton').hidden = !canOrder;
    $('orderButton').disabled = ordering;
    $('orderButton').textContent = T.POTION_PRICE + '코인으로 주문하기';
    $('orderNote').hidden = !!held;
    $('orderNote').textContent = canOrder ? '주문하면 왕국 생명력 1이 ' + spirit.name + '에게 전해져요.' :
      '주문에 ' + [needCoins ? needCoins + '코인' : '', needLife ? '생명력 1' : ''].filter(Boolean).join('과 ') + '이 더 필요해요. 바 연습 한 번이면 충분해요.';
    var status = '';
    if (held) {
      status = T.SPIRITS[held.id].name + '의 ' + T.STAFF[held.id].name + ' 포션을 준비했어요. 다음 연습을 마치면 ' + T.effectFor(held.id, held.level).label + '!';
      if (justOrdered && justOrdered.id === held.id) {
        status = '생명력 1 전달' + (justOrdered.leveled ? ' · 조제 Lv.' + held.level + ' 달성!' : '!') +
          (justOrdered.bond && justOrdered.bond.levels.length ? ' ♥ 친밀도 Lv.' + justOrdered.bond.level + '로 올랐어요.' : '') + ' ' + status;
      }
    }
    $('orderStatus').textContent = status;
    $('shopPractice').hidden = canOrder;
    $('shopPractice').href = s.lesson ? '../studio/?v=' + T.V + '#lesson' : '../studio/?v=' + T.V + '#first-bar';
    $('shopPractice').firstChild.textContent = s.lesson ? '연습 이어 하기 ' : held ? '포션 들고 바 연습하기 ' : '무료 바 연습하기 ';
    T.syncUI();
  }
  $('orderButton').addEventListener('click', async function () {
    if (ordering) return;
    var id = selected;
    ordering = true; $('orderButton').disabled = true;
    try {
      var brewed = await T.orderPotion(id);
      justOrdered = brewed ? { id: id, leveled: brewed.leveled, bond: brewed.bond } : null;
      if (brewed) {
        var flight = $('shopWindow').querySelector('.life-flight');
        flight.classList.remove('delivered');
        void flight.offsetWidth;
        flight.classList.add('delivered');
      }
    } finally { ordering = false; render(); }
    if (!$('shopPractice').hidden) $('shopPractice').focus({ preventScroll: true });
  });
  window.addEventListener('sugartown:refresh', render);
  window.addEventListener('hashchange', chooseFromUrl);
  chooseFromUrl();
})();
