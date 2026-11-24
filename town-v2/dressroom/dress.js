(function () {
  'use strict';
  var T = window.SugarTown;
  var $ = function (id) { return document.getElementById(id); };
  /* 같은 파일이 두 역할을 맡는다: 기본은 👗 내 옷장, ?mode=shop은 🛍️ 의상 상점. */
  var MODE = /[?&]mode=shop(&|$)/.test(location.search) ? 'shop' : 'wardrobe';
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
  var COPY = {
    wardrobe: {
      title: '👗 내 옷장', small: 'MY WARDROBE', doc: '내 옷장 · 슈가의 발레왕국',
      intro: '오늘은 어떤 모습으로 춤출까요?',
      lead: '내가 가진 의상을 골라 갈아입고, 마음에 드는 모습으로 수업에 가요.',
      list: '내가 가진 발레 의상', help: '가진 옷을 누르면 거울에서 먼저 입어 볼 수 있어요. 아직 없는 옷은 의상 상점에서 만나요.',
      guide: '첫 수업을 마치면 라일락 의상을 선물 받아요. 백조·블랙 스완·마법 드레스는 레벨을 올리면 무료 보상으로 받고, 기다리기 싫으면 의상 상점에서 코인으로 먼저 살 수 있어요.'
    },
    shop: {
      title: '🛍️ 의상 상점', small: 'OUTFIT SHOP', doc: '의상 상점 · 슈가의 발레왕국',
      intro: '새 발레 의상을 만나 볼까요?',
      lead: '연습과 공연으로 모은 코인으로 사거나, 레벨 보상으로 받아요. 산 의상은 내 옷장에 들어가요.',
      list: '상점 의상 목록', help: '가격과 해금 레벨을 보고 골라요. 이미 가진 옷은 내 옷장에서 갈아입을 수 있어요.',
      guide: '코인은 연습·공연을 마치면 쌓여요. 레벨 보상 의상은 해당 레벨에 도달하면 코인 없이 받을 수 있어요.'
    }
  };

  function lvNow() { return T.level().n; }
  function courseLink(state) {
    return '../studio/?v=' + T.V + (state.lesson ? '#lesson' : '#first-bar');
  }
  function modeLink(mode, hash) {
    return './?v=' + T.V + (mode === 'shop' ? '&mode=shop' : '') + (hash ? '#' + hash : '');
  }
  /* 내 옷장에서는 가진 의상부터, 상점에서는 진열 순서대로 보여 준다. */
  function orderedDress() {
    if (MODE !== 'wardrobe') return T.DRESS.slice();
    var own = [], rest = [];
    T.DRESS.forEach(function (d) { (T.isOwned(d.id) ? own : rest).push(d); });
    return own.concat(rest);
  }
  function paintMode() {
    var c = COPY[MODE];
    document.title = c.doc;
    $('pageTitle').innerHTML = c.title + '<small>' + c.small + '</small>';
    $('introTitle').textContent = c.intro;
    $('introLead').textContent = c.lead;
    $('clothesTitle').textContent = c.list;
    $('previewHelp').textContent = c.help;
    $('rewardText').textContent = c.guide;
    $('modeWardrobe').href = modeLink('wardrobe');
    $('modeShop').href = modeLink('shop');
    $('modeWardrobe').classList.toggle('on', MODE === 'wardrobe');
    $('modeShop').classList.toggle('on', MODE === 'shop');
    $('modeWardrobe').setAttribute('aria-current', MODE === 'wardrobe' ? 'page' : 'false');
    $('modeShop').setAttribute('aria-current', MODE === 'shop' ? 'page' : 'false');
  }

  function refresh() {
    var state = T.get(), lv = lvNow(), d = T.dressOf(selected);
    var owned = T.isOwned(d.id), wearing = state.worn === d.id;
    var missing = Math.max(0, d.price - state.coins), unlocked = !!d.levelAt && lv >= d.levelAt;
    var buyable = !owned && !d.giftAt;
    $('lookStatus').textContent = wearing ? '현재 착용 중' : '미리 입어보는 중';
    $('outfitState').textContent = wearing ? '착용 중' : owned ? (MODE === 'shop' ? '보유 중' : '보유 의상') :
      d.giftAt ? '첫 수업 선물' : unlocked ? '무료 수령 가능' : MODE === 'shop' ? '구매 가능' : '상점에서 구매';
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
    else if (d.levelAt) $('lookCost').textContent = MODE === 'shop'
      ? T.fmt(d.price) + '코인으로 사거나 Lv.' + d.levelAt + ' 달성하면 무료 보상'
      : T.fmt(d.price) + '코인 · Lv.' + d.levelAt + ' 달성 보상 (의상 상점에서 구매)';
    else $('lookCost').textContent = T.fmt(d.price) + '코인으로 ' + (MODE === 'shop' ? '구매할 수 있어요.' : '의상 상점에서 살 수 있어요.');

    var action = $('lookAction');
    action.hidden = wearing;
    /* 내 옷장에서는 아직 없는 옷을 여기서 결제하지 않고 상점으로 넘긴다. */
    var sendToShop = MODE === 'wardrobe' && buyable && !unlocked;
    action.disabled = busy || (!owned && (!!d.giftAt || (!unlocked && !sendToShop && missing > 0)));
    action.textContent = owned ? '이 의상으로 갈아입기' :
      d.giftAt ? '첫 수업 완료 후 선물 받기' :
      unlocked ? '레벨 보상 무료로 받기' :
      sendToShop ? '🛍️ 의상 상점에서 보기' :
      missing ? T.fmt(missing) + '코인 더 필요해요' :
      T.fmt(d.price) + '코인으로 구매하고 입기';
    action.dataset.mode = owned ? 'wear' : sendToShop ? 'shop' : 'buy';

    $('lookGo').href = courseLink(state);
    $('lookGo').textContent = state.lesson ? '진행 중인 수업 이어 하기' :
      wearing ? '이 옷 입고 연습하기' :
      owned ? '현재 착용한 옷으로 연습하기' :
      d.giftAt ? '첫 수업 하러 가기' : '현재 착용한 옷으로 연습하기';
    $('wearTip').textContent = wearing ?
      '이 의상이 연습실·왈츠 무대에도 그대로 적용돼요.' :
      owned ? '지금은 미리보기 상태예요. 위 버튼을 눌러 갈아입어 주세요.' :
      MODE === 'wardrobe' ? '아직 내 옷장에 없는 의상이에요. 의상 상점에서 살 수 있어요.' :
      '미리 입어본 모습이에요. 구매하거나 선물로 받아야 실제로 착용할 수 있어요.';
    $('ownCount').textContent = '보유 ' + state.owned.length + ' / ' + T.DRESS.length + '벌';
    $('spiritName').textContent = SPIRIT[d.id].name + '의 한마디';
    $('spiritLine').textContent = SPIRIT[d.id].line;

    $('shop').querySelectorAll('button').forEach(function (button) {
      var item = T.dressOf(button.dataset.preview);
      var open = !!item.levelAt && lv >= item.levelAt;
      var worn = item.id === state.worn, mine = T.isOwned(item.id);
      button.setAttribute('aria-pressed', String(item.id === d.id));
      button.classList.toggle('locked', !!item.levelAt && !open && !mine);
      button.classList.toggle('shop', MODE === 'wardrobe' && !mine && !open && !item.giftAt);
      button.querySelector('small').textContent = worn ? '착용 중' : mine ? '보유 중 · 갈아입기' :
        item.giftAt ? '첫 수업 후 무료' :
        open ? '레벨 보상 · 무료 수령' :
        MODE === 'wardrobe' ? '의상 상점에서 보기' :
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

  paintMode();
  $('fittingPoses').addEventListener('click', function (e) {
    var b = e.target.closest('[data-pose]');
    if (b) { previewPose = b.dataset.pose; refresh(); }
  });
  orderedDress().forEach(function (d) {
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
    if ($('lookAction').dataset.mode === 'shop' && !wasOwned) {
      location.href = modeLink('shop', id);
      return;
    }
    busy = true;
    $('lookAction').disabled = true;
    try {
      var result = await T.updateWallet(function () { return wasOwned ? T.wear(id) : T.buy(id); });
      if (!result || !result.ok) $('lookMessage').textContent = '옷장과 코인을 다시 확인해 주세요.';
      else if (result.free) $('lookMessage').textContent = result.item.name + '을(를) 레벨 보상으로 받았어요! 이제 착용 중이에요.';
      else $('lookMessage').textContent = result.item.name + ' 착용 완료! 연습실과 왈츠 무대에서도 이 모습으로 등장해요.';
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
