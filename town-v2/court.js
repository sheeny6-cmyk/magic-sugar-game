(function () {
  'use strict';
  var T = window.SugarTown;
  var $ = function (id) { return document.getElementById(id); };
  var courseNames = { bar: '바 연습', center: '센터 연습', piece: '작품 연습' };
  var nickMode = 'welcome';

  function nick() { return T.nick(); }

  /* ---------- 정령 다섯과의 교감 ---------- */
  function renderRoster(s) {
    $('staffRoster').innerHTML = Object.keys(T.STAFF).map(function (id) {
      var spirit = T.SPIRITS[id], bond = T.bondOf(id), unread = T.unreadLetters(id);
      return '<button class="staff-link" type="button" data-spirit="' + id + '" style="--tint:' + spirit.color + '" aria-label="' + spirit.name + '와 교감하기 · 친밀도 ' + bond.level + '">' +
        '<span class="cameo"><img src="' + T.spiritArt(id, true) + '" alt=""></span>' +
        '<b>' + spirit.name + '</b>' +
        T.heartsHTML(bond.level, 'bond-mini') +
        '<span class="bond-dot' + (unread ? ' on' : '') + '" aria-hidden="true">' + (unread || '') + '</span></button>';
    }).join('');
  }

  var bondId = null;
  function lettersCountText(id) {
    var letters = T.lettersFor(id);
    var open = letters.filter(function (row) { return row.unlocked; }).length;
    var unread = letters.filter(function (row) { return row.unlocked && !row.read; }).length;
    return open + '통 열림' + (unread ? ' · 새 편지 ' + unread : ' · 모두 읽음');
  }
  function renderBond() {
    if (!bondId) return;
    var id = bondId, spirit = T.SPIRITS[id], bond = T.bondOf(id);
    $('bondFace').src = T.spiritArt(id, true);
    $('bondFace').alt = spirit.name;
    $('bondRole').textContent = spirit.role;
    $('bondName').textContent = spirit.name;
    $('bondNature').textContent = spirit.nature;
    $('bondHearts').innerHTML = T.heartsHTML(bond.level, 'bond-big');
    $('bondNote').textContent = '친밀도 Lv.' + bond.level + ' / ' + bond.max + ' · ' +
      (bond.next == null ? '가장 가까운 사이예요' : '다음 하트까지 ' + bond.left + '번 더');
    $('bondLine').textContent = '“' + bond.line + '”';
    $('bondLettersCount').textContent = lettersCountText(id);
    $('bondLetters').innerHTML = T.lettersFor(id).map(function (letter) {
      if (!letter.unlocked) {
        return '<div class="letter locked"><span class="letter-mark" aria-hidden="true">♡</span>' +
          '<span class="letter-title">친밀도 Lv.' + letter.at + '에 열리는 편지</span></div>';
      }
      return '<details class="letter' + (letter.read ? ' read' : '') + '" data-key="' + letter.id + '">' +
        '<summary><span class="letter-mark' + (letter.read ? ' read' : '') + '" aria-hidden="true">♥</span>' +
        '<span class="letter-title">' + letter.title + '</span>' +
        '<span class="letter-at">Lv.' + letter.at + '</span></summary><p>' + letter.body + '</p></details>';
    }).join('');
    $('bondPotion').href = 'potions/?v=' + T.V + '#' + id;
    $('bondPractice').dataset.spirit = id;
    var preview = Object.assign({}, T.get(), { practiceWith: id });
    $('bondFoot').textContent = '동료 능력 · ' + T.practicePower('bar', preview).label + ' · 수료할 때 친밀도 +1';
  }
  function openBond(id) {
    if (!Object.hasOwn(T.STAFF, id)) return;
    bondId = id;
    renderBond();
    if (!$('bondDialog').open) $('bondDialog').showModal();
  }

  /* ---------- 한눈에 보이는 첫 보상 ---------- */
  function renderFirstGift(s) {
    var kicker, title, detail, outfit;
    if (!s.classes) {
      kicker = '첫 연습 완주 선물';
      title = '라일락 쉬폰 스커트';
      detail = '첫 곡을 마치면 바로 옷장에 들어와요.';
      outfit = 'lilac';
    } else if (!s.shows && !T.stageReady()) {
      kicker = '다음은 첫 무대';
      title = '한 번 더 연습하면 공연 초대장!';
      detail = '오늘 입은 의상으로 첫 공연에 오를 수 있어요.';
      outfit = s.worn;
    } else if (!s.shows) {
      kicker = '첫 공연 보상';
      title = '내 이름이 들어간 공연 포스터';
      detail = '왕립 극장에서 공연을 마치고 포스터를 남겨요.';
      outfit = s.worn;
    } else {
      var target = T.nextDress();
      kicker = target ? '다음에 만날 의상' : '다음 무대를 향해';
      title = target ? target.name : '나만의 앙코르 무대';
      detail = target
        ? (s.coins >= target.price ? '코인으로 지금 살 수 있어요.' : T.fmt(target.price - s.coins) + '코인 더 모으면 옷장에 들어와요.')
        : '원하는 의상으로 새로운 기록에 도전해요.';
      outfit = target ? target.id : s.worn;
    }
    $('firstGiftKicker').textContent = kicker;
    $('firstGiftTitle').textContent = title;
    $('firstGiftText').textContent = detail;
    $('firstGiftImg').src = T.dancerArt(outfit, 'curtsy');
    $('firstGiftImg').alt = T.dressOf(outfit).name + ' 차림의 발레리나';
  }

  /* ---------- 지금 걸린 효과 배지 ---------- */
  function renderBuffs() {
    var host = $('buffStrip');
    if (!host) return;
    var list = T.activeBuffs();
    host.hidden = !list.length;
    host.innerHTML = list.length
      ? '<span class="buff-strip-lead">지금 걸린 기운</span>' + list.map(function (b) {
        return '<span class="buff-chip ' + b.kind + '"><i aria-hidden="true">' + b.icon + '</i><b>' + b.name + '</b><small>' + b.chips.join(' · ') + '</small></span>';
      }).join('')
      : '';
  }

  function renderJourney(s) {
    var player = T.playerLevel(s), rank = T.level();
    $('playerLevel').textContent = 'Lv.' + player.n;
    $('xpText').textContent = player.n === 100 ? '최고 성장 레벨 · 공연 기록은 계속 쌓여요' : '경험치 ' + T.fmt(player.have) + ' / ' + T.fmt(player.need) + ' · 다음 레벨까지 ' + T.fmt(player.need-player.have);
    $('xpFill').style.width = player.pct + '%';
    $('xpTrack').setAttribute('aria-valuenow', player.pct);
    $('rankGoal').textContent = '직급 · ' + rank.name + (rank.next ? ' → ' + rank.next.name + ' · ' + rank.steps.filter(function(r){return !r.done;}).map(function(r){return r.label+' '+r.have+'/'+r.need+r.unit;}).join(' · ') : ' · 프리마 달성!');
    var links = {debut:'stage/',waltz:'waltz-stage/'}, poses={debut:'curtsy',waltz:'pasdechat'};
    $('performanceAlbum').innerHTML = Object.keys(T.WORKS).map(function(key){
      var p=s.journey.performances[key], status=T.workStatus(key,s), ready=status.ready;
      var w=T.WORKS[key], href=T.journeyUrl('performance',key).replace('&','&amp;');
      return '<a class="album-card'+(ready?'':' locked')+'" href="'+href+'"><img alt="" src="'+(w.spirit?T.spiritArt(w.spirit,true):T.dancerArt(p?p.outfit:s.worn,poses[key]))+'"><span><b>'+w.name+'</b><small>'+(p?'최고 '+p.grade+' · '+p.count+'회 공연':ready?'첫 공연 가능':'해금 · '+status.reason)+'</small>'+(p?'<small>최고 콤보 '+p.combo+' · 정확도 '+p.accuracy+'%</small>':'')+'</span></a>';
    }).join('');
    var labels={beat:'기본 박자',cat:'파드샤',jump:'그랑제떼',beam:'아라베스크',turn:'피루엣'};
    $('masteryList').innerHTML=Object.keys(labels).map(function(key){var m=T.masteryOf(key,s);return '<div><span>'+labels[key]+'</span><b>Lv.'+m.n+'</b><small>'+m.points+' / '+m.next+'</small></div>';}).join('');
    var life=s.kingdom.life;
    $('lifeStory').textContent='왕국 생명력 '+T.fmt(life)+' · '+(life>=30?'왕국에 활기가 가득해요':life>=10?'광장에 작은 꽃이 피기 시작해요':'다섯 정령과 첫 춤을 준비하고 있어요');
    document.body.dataset.kingdomLife=life>=30?'bloom':life>=10?'sprout':'seed';
  }

  /* ---------- 오늘의 초대장 ---------- */
  function refresh() {
    var s = T.get(), k = s.kingdom, dose = k.prepared, lesson = s.lesson;
    var level = T.level(), reward = T.rewardFor(lesson ? lesson.kind : 'bar', dose);
    var first = !s.classes && !lesson;
    var who = nick();
    $('nextTitle').textContent = lesson ? courseNames[lesson.kind] + ' 이어서' : first ? '첫 무대를 향한 바 연습' : '오늘의 바 연습';
    $('nextGoal').textContent = lesson ? '연습 중이던 노래를 처음부터 다시 틀어 드려요.'
      : '에튜 선생님과 3/4 왈츠에 맞춰 박자를 타요.';
    $('nextReward').innerHTML = '노트 완주 <b>+' + T.fmt(reward.coins) + '코인</b>';
    renderFirstGift(s);
    $('nextAction').href = lesson ? 'studio/?v=' + T.V + '#lesson' : 'studio/?v=' + T.V + '#first-bar';
    $('nextAction').firstChild.textContent = lesson ? '연습 이어 하기 ' : dose ? '포션 들고 바 연습하기 ' : first ? '첫 바 연습 시작 ' : '바 연습 시작 ';
    var target = T.nextDress();
    if (!s.classes && !T.isOwned('lilac')) $('ticketNote').textContent = '첫 수업은 무료 · 선물은 자동으로 지급돼요';
    else if (target) {
      var timing = T.practicePower('bar', s).timing;
      $('ticketNote').textContent = '연습복 · ' + T.dressOf(s.worn).name + (timing ? ' · 판정 여유 +' + timing + 'ms' : '');
    }
    else $('ticketNote').textContent = '이번 연습복 · ' + T.dressOf(s.worn).name;
    if (!lesson && !s.shows) {
      $('nextTitle').textContent = T.stageReady() ? '첫 공연 초대장이 도착했어요' : !s.classes ? '첫 바 연습으로 출발!' : '첫 공연까지 딱 한 수업!';
      $('nextGoal').textContent = T.stageReady() ? '연습한 동작을 무대에서 보여주고 나만의 공연 포스터를 남겨요.'
        : !s.classes ? '에튜 정령과 첫 곡을 완주하고 라일락 쉬폰 스커트를 받아요.'
        : '한 번 더 연습하면 왕립 극장에서 첫 무대를 열 수 있어요.';
      if (T.stageReady()) {
        $('nextReward').textContent = '공연 보상 · 코인과 첫 공연 포스터';
        $('nextAction').href = 'stage/?v=' + T.V;
        $('nextAction').firstChild.textContent = '첫 공연 시작 ';
        $('ticketNote').textContent = '현재 의상 그대로 무대에 올라요';
      }
    } else if (!lesson) {
      var power = T.practicePower('bar', s);
      $('nextGoal').textContent = '오늘도 한 걸음 · 연습으로 판정 여유 +' + power.timing + 'ms';
    }
    /* 이 초대장은 '지금 할 일 하나'만 보여 준다. 나머지 장소는 아래 산책길에서 고른다. */
    var toStage = !lesson && T.stageReady() && !s.shows;
    $('todayKicker').textContent = lesson ? '오늘의 한 걸음 · 이어서 하는 연습'
      : toStage ? '오늘의 한 걸음 · 왕립 극장'
      : '오늘의 한 걸음 · 왕립 발레 스튜디오';
    $('actionHint').textContent = lesson ? '연습 중이던 곡을 처음부터 다시 틀어 드려요'
      : toStage ? '연습한 동작 그대로 무대에 올라 공연 포스터를 남겨요'
      : '노트가 빛나는 링에 닿는 순간, 같은 동작을 눌러요';
    $('walkStudio').textContent = s.classes
      ? s.classes + '회 수업 · ' + (T.stageReady() ? '무대 열림' : '무대까지 ' + T.stageLeft() + '회')
      : '바 · 센터 · 작품 3코스';
    $('walkShop').textContent = '코인 ' + T.fmt(s.coins) + ' · 도감 ' + T.tastedTotal() + '/' + (T.dexSize('cafe') + T.dexSize('snack'));
    renderBuffs();
    var steps = [{label:'첫 연습',done:s.classes>=1},{label:'무대 준비',done:s.classes>=2},{label:'첫 공연',done:s.shows>=1}];
    $('journeySteps').innerHTML = steps.map(function(x,i){return '<span class="'+(x.done?'done':steps.slice(0,i).every(function(y){return y.done;})?'active':'')+'">'+(x.done?'✓ ':'')+x.label+'</span>';}).join('');
    document.querySelectorAll('.kingdom-map .venue').forEach(function(a){a.classList.remove('is-next');});
    $('staffIntro').textContent = dose ? T.SPIRITS[dose.id].name + '의 포션이 준비됐어요. ' + who + '님이 연습을 마치면 효과가 발동해요.'
      : !s.classes && !Object.values(k.orders).some(Boolean) ? '첫 지원금은 ' + T.GRANT + '코인이에요. 정령에게 포션을 한 잔 주문하면 생명력 1이 전해져요.'
      : '카드를 누르면 정령의 성격과 편지를 읽을 수 있어요. 함께 연습하고 포션을 주문할수록 하트가 늘어나요.';
    renderRoster(s);
    $('idRank').textContent = 'Lv.' + T.playerLevel(s).n + ' · ' + level.name;
    renderJourney(s);
    $('stageLine').textContent = T.prima() ? '프리마 피날레 무대가 열려 있어요'
      : T.stageReady() ? (k.debutOutfit ? '앙코르 무대에 오르기' : '오늘의 의상으로 첫 리허설') : '첫 리허설 초대장까지 도장 ' + T.stageLeft() + '개';
    if (!lesson && s.classes) {
      var nextKind = !s.stamps.center ? 'center' : !s.stamps.piece ? 'piece' : ['bar','center','piece'].sort(function(a,b){return s.stamps[a]-s.stamps[b];})[0];
      var work = Object.keys(T.WORKS).find(function(key){return T.workStatus(key,s).ready&&!s.journey.performances[key];});
      if (work) {
        $('nextTitle').textContent = T.WORKS[work].name+'에 도전해요';
        $('nextGoal').textContent = work==='debut'?'오늘의 의상으로 무대에 올라 첫 공연 포스터를 남겨요.':(T.WORKS[work].desc||'강·약·약, 세 박에 맞춰 네 가지 발레 동작을 연결해요.');
        $('nextAction').href=(work==='debut'?'stage/':'waltz-stage/')+'?v='+T.V+(T.WORKS[work].spirit?'&work='+work:'');
        $('nextAction').firstChild.textContent='공연 시작 ';
        $('todayKicker').textContent='오늘의 한 걸음 · 왕립 극장';
        $('actionHint').textContent='공연 앨범에 새로운 작품을 기록해요';
        $('nextReward').textContent='공연 보상 · 코인과 경험치';
      } else {
        $('nextTitle').textContent=courseNames[nextKind]+'에 도전해요';
        $('nextGoal').textContent=!s.stamps[nextKind]?'새로운 수업으로 발레 동작을 익혀요.':'고르게 연습하며 숙련도와 경험치를 쌓아요.';
        $('nextAction').href='studio/?v='+T.V+'#class-'+nextKind;
        $('nextAction').firstChild.textContent=courseNames[nextKind]+' 시작 ';
        $('todayKicker').textContent='오늘의 한 걸음 · 왕립 발레 스튜디오';
        $('nextReward').textContent='수료 보상 · '+T.rewardFor(nextKind,dose).coins+'코인 + 경험치';
        $('actionHint').textContent='원하는 다른 수업이나 공연을 선택해도 좋아요';
      }
    }
    var chapter=T.nextChapter(s);
    $('nextTitle').textContent=chapter.name;
    $('nextGoal').textContent=chapter.desc;
    $('nextAction').href=chapter.url;
    $('nextAction').firstChild.textContent=chapter.kind==='practice'?'발레 연습 시작 ':'무대에 오르기 ';
    $('todayKicker').textContent=chapter.kind==='practice'?'발레 여정 · 수업':'발레 여정 · 공연';
    $('nextReward').textContent=chapter.kind==='practice'?'완주 · 코인과 경험치':'완주 · 코인과 공연 기록';
    var route=document.getElementById('journeyPath');
    if(route){var steps=[s.classes>=1,s.classes>=2,!!s.journey.performances.debut,!!s.journey.performances.waltz];route.innerHTML=['첫걸음','동작 연결','첫 공연','왈츠'].map(function(name,n){return '<span class="'+(steps[n]?'done':steps.slice(0,n).every(Boolean)?'current':'')+'">'+(steps[n]?'✓ ':'')+name+'</span>';}).join('');}
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

  /* ---------- 정령 교감 · 성장 일기 ---------- */
  $('staffRoster').addEventListener('click', function (e) {
    var b = e.target.closest('[data-spirit]');
    if (b) openBond(b.dataset.spirit);
  });
  $('bondClose').addEventListener('click', function () { $('bondDialog').close(); });
  $('bondDialog').addEventListener('click', function (e) { if (e.target === $('bondDialog')) $('bondDialog').close(); });
  $('bondDialog').addEventListener('cancel', function () { bondId = null; });
  $('bondLetters').addEventListener('toggle', function (e) {
    var d = e.target;
    if (!d || !d.open || !d.dataset || !d.dataset.key) return;
    T.readLetter(d.dataset.key).then(function () {
      d.classList.add('read');
      $('bondLettersCount').textContent = lettersCountText(bondId);
      renderRoster(T.get());
    });
  }, true);
  $('bondPractice').addEventListener('click', function () {
    var id = bondId;
    if (!id) return;
    $('bondPractice').disabled = true;
    T.setPracticeWith(id).then(function () {
      $('bondPractice').disabled = false;
      $('bondDialog').close();
      location.href = 'studio/?v=' + T.V;
    }).catch(function () { $('bondPractice').disabled = false; });
  });
  /* ---------- 처음부터 다시하기 ---------- */
  var resetBtn = $('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    var ok = window.confirm('왕국의 연습 기록 · 코인 · 모은 의상이 모두 사라지고\nLv.1 입문 발레리나로 돌아가요.\n\n정말 처음부터 다시 시작할까요?');
    if (!ok) return;
    try {
      localStorage.removeItem(T.KEY);
      localStorage.removeItem(T.KEY + '.court');
      localStorage.removeItem('sugarcafe.preview.best');
    } catch (e) { /* 저장소를 못 지우면 새로 고침만 한다 */ }
    location.replace('./?v=' + T.V);
  });

  window.addEventListener('sugartown:refresh', refresh);
  refresh();
  if (!T.named()) setTimeout(function () { openNick('welcome'); }, 220);
})();

document.querySelectorAll('[data-open-panel]').forEach(function(link){link.addEventListener('click',function(e){var panel=document.getElementById(link.dataset.openPanel);if(!panel)return;e.preventDefault();panel.open=true;panel.scrollIntoView({block:'start',behavior:'smooth'});});});
