(function () {
  'use strict';
  var T = window.SugarTown;
  var $ = function (id) { return document.getElementById(id); };
  var choreography = [
    { pose: 'plie', name: '플리에', line: '에튜가 고개를 끄덕여요. 슈가가 첫 박자에 맞춰 무릎을 부드럽게 굽혀요.' },
    { pose: 'releve', name: '를르베', line: '피루의 손짓을 따라 슈가의 뒤꿈치가 떠올라요. 잠든 궁전 창에 불이 켜져요.' },
    { pose: 'arabesque', name: '아라베스크', line: '아라가 가리킨 숲을 향해 손을 내밀어요. 뒤로 뻗은 발끝까지 달빛이 닿아요.' },
    { pose: 'curtsy', name: '르베랑스', line: '슈가가 인사를 건네자 객석에 앉은 다섯 정령이 힘껏 박수를 쳐요.' }
  ];
  var index = -1, savingDebut = false;
  function refresh() {
    var s = T.get(), ready = T.stageReady(), debut = s.kingdom.debutOutfit;
    if (!ready) index = -1;
    var part = choreography[index], last = index === choreography.length - 1;
    T.showDancer($('stageDancer'), s.worn, part ? part.pose : 'ready');
    $('costume').textContent = T.dressOf(s.worn).name;
    $('scene').dataset.beat = String(index);
    $('nextBeat').hidden = !ready;
    $('nextBeat').disabled = savingDebut;
    $('debutLook').hidden = !debut || (part && !last);
    if (debut) $('debutLook').textContent = '첫 리허설 의상 · ' + T.dressOf(debut).name;
    $('toClass').hidden = ready;
    $('beats').hidden = !ready;
    Array.from($('beats').children).forEach(function (dot, i) { dot.classList.toggle('filled', i <= index); });
    if (!ready) {
      $('count').textContent = '출석 도장 ' + s.classes + ' / 5';
      $('cueTitle').textContent = '초대장까지 도장 ' + T.stageLeft() + '개';
      $('cueText').textContent = '수업 하나에 도장 하나. 다섯 번째 도장을 찍으면 슈가가 이 무대에 올라요.';
      $('toClass').href = '../studio/?v=' + T.V + (s.lesson ? '#lesson' : '#first-bar');
      $('toClass').textContent = s.lesson ? '수업 이어 하기' : '도장 모으러 가기';
    } else if (!part) {
      $('count').textContent = '출석 도장 5 / 5';
      $('cueTitle').textContent = debut ? '슈가의 앙코르 무대' : '슈가 공주님, 무대로 나와 주세요!';
      $('cueText').textContent = debut ? '다섯 정령이 다시 객석에 모였어요. 오늘의 의상으로 한 번 더 춰 볼까요?' : '막이 오르면 슈가의 동작을 하나씩 이어 주세요. 마지막 인사까지 네 동작이에요.';
      $('nextBeat').textContent = debut ? '다시 공연하기' : '리허설 시작';
    } else {
      $('count').textContent = last ? '리허설 완주 · 4 / 4' : '리허설 · ' + (index + 1) + ' / 4';
      $('cueTitle').textContent = last ? '마지막 인사, 르베랑스' : part.name;
      $('cueText').textContent = part.line;
      $('nextBeat').textContent = last ? '다시 공연하기' : choreography[index + 1].name + '로 잇기';
    }
    T.syncUI();
  }
  $('nextBeat').addEventListener('click', async function () {
    if (savingDebut || !T.stageReady()) return;
    index = (index + 1) % choreography.length;
    refresh();
    if (index !== choreography.length - 1 || T.get().kingdom.debutOutfit) return;
    var costume = $('stageDancer').dataset.outfit;
    savingDebut = true;
    $('nextBeat').disabled = true;
    try {
      await T.updateWallet(function (s) {
        if (s.classes >= 5 && !s.kingdom.debutOutfit) s.kingdom.debutOutfit = costume;
      });
    } finally { savingDebut = false; refresh(); }
  });
  Object.keys(T.STAFF).forEach(function (id) {
    var spirit = T.SPIRITS[id], figure = document.createElement('figure');
    var img = document.createElement('img'), caption = document.createElement('figcaption');
    img.src = T.spiritArt(id, true); img.alt = ''; img.loading = 'lazy';
    var name = document.createElement('b'), role = document.createElement('span');
    name.textContent = spirit.name; role.textContent = spirit.role.split(' · ').pop();
    caption.append(name, role); figure.append(img, caption); $('castRow').appendChild(figure);
  });
  window.addEventListener('sugartown:refresh', refresh);
  refresh();
})();
