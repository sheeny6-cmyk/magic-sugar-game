const { test } = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const walletSource = readFileSync(join(__dirname, '../assets/town.js'), 'utf8');
const lessonSource = readFileSync(join(__dirname, '../studio/lessons.js'), 'utf8');
const key = 'sugartown.v1';

function savedGame(legacy) {
  const records = new Map(legacy ? [[key, JSON.stringify(legacy)]] : []);
  let writes = Promise.resolve();
  function tab() {
    const window = new EventTarget();
    const context = vm.createContext({
      window, Event,
      document: { querySelectorAll: () => [], addEventListener() {}, currentScript: { src: 'https://game/town/assets/town.js' } },
      localStorage: { getItem: id => records.get(id) ?? null, setItem: (id, data) => records.set(id, data) },
      navigator: { locks: { request: (_, action) => (writes = writes.then(action)) } }
    });
    vm.runInContext(walletSource, context);
    vm.runInContext(lessonSource, context);
    return { wallet: window.SugarTown, book: window.SugarLessons };
  }
  return { records, tab, state: () => JSON.parse(records.get(key)) };
}

function enroll({ wallet, book }, kind) {
  return wallet.updateWallet(state => {
    const run = book.makeLesson(kind, state);
    run.paidFee = wallet.classFee(kind);
    assert.ok(state.coins >= run.paidFee);
    state.coins -= run.paidFee;
    state.lesson = run;
  });
}

function finish({ wallet, book }, score) {
  return wallet.updateWallet(state => {
    const run = state.lesson;
    if (!run) return wallet.finishRhythm(state, {}, score);
    const total = run.chart.notes.length;
    return wallet.finishRhythm(state, book.classes[run.kind].stats, score ||
      { perfect: total, good: 0, miss: 0, maxCombo: total, notes: total, comboCoins: 0, noteCoins: 0 });
  });
}

function finishLegacy({ wallet, book }) {
  return wallet.updateWallet(state => {
    const run = state.lesson;
    for (const round of run.rounds) round.picks.push(round.key);
    run.index = run.rounds.length - 1;
    return wallet.finishPractice(state, book.classes[run.kind].stats);
  });
}

test('two tabs share one grant, one purchased potion, and one reward', async () => {
  const game = savedGame(), a = game.tab(), b = game.tab();
  const bought = await Promise.all([a.wallet.orderPotion('piru'), b.wallet.orderPotion('ara')]);
  assert.equal(bought.filter(Boolean).length, 1);
  assert.equal(game.state().coins, 30);
  assert.equal(game.state().kingdom.life, 0);
  await enroll(a, 'bar');
  assert.equal(await b.wallet.updateWallet(s => b.wallet.finishPractice(s, {})), null);
  assert.equal(game.state().kingdom.prepared.id, 'piru');
  const paid = await Promise.all([finish(a), finish(b)]);
  assert.equal(paid.filter(Boolean).length, 1);
  const s = game.state();
  assert.equal(s.coins, 92);
  assert.equal(s.kingdom.life, 1);
  assert.equal(s.stamps.bar, 1);
  assert.equal(s.kingdom.prepared, null);
  assert.equal(s.kingdom.receipt.coins, 62);
  assert.equal(s.kingdom.receipt.gift, 'lilac');
  assert.deepEqual(s.owned, ['basic', 'lilac']);
  assert.equal(s.kingdom.receipt.before, 30);
  assert.equal(s.kingdom.receipt.after, 92);
  assert.deepEqual(s.kingdom.orders, { etu: 0, ara: 0, piru: 1, shangz: 0, alle: 0 });
});

test('every third order strengthens only that employee and affects that very potion', async () => {
  const game = savedGame(), player = game.tab(), { wallet } = player;
  const expected = { etu: ['axis',4], ara: ['flex',4], piru: ['coins',12], shangz: ['stam',4], alle: ['life',1] };
  for (const [id, [gift, units]] of Object.entries(expected)) {
    for (let order = 1; order <= 3; order++) {
      const brewed = await wallet.orderPotion(id);
      const strength = order === 3 ? 2 : 1;
      assert.equal(brewed.level, strength);
      assert.equal(brewed.leveled, order === 3);
      await enroll(player, 'bar');
      const reward = await finish(player);
      assert.equal(reward.coins, 50 + (gift === 'coins' ? units * strength : 0));
      assert.equal(reward.life, 1 + (gift === 'life' ? units * strength : 0));
      if (gift !== 'life' && gift !== 'coins') assert.equal(reward.stats[gift], (player.book.classes.bar.stats[gift] || 0) + units * strength);
    }
    assert.equal(game.state().kingdom.orders[id], 3);
  }
});

test('a returning player keeps their balance, costume and lesson, including legacy paid bookings', async () => {
  for (const [kind, fee, reward] of [['bar',100,50],['center',150,80],['piece',250,120]]) {
    const game = savedGame({ coins: 450, createdAt: 12, classes: 4, stamps: { bar: 2, center: 1, piece: 1 },
      owned: ['basic','lilac'], worn: 'lilac', lesson: { kind, id: 'old', index: 0,
        rounds: ['one','two','three'].map(key => ({ key, choices: [key], picks: [] })) } });
    const player = game.tab();
    const receipt = await finishLegacy(player);
    assert.equal(receipt.refund, fee);
    assert.equal(receipt.coins, reward);
    assert.equal(game.state().coins, 510 + fee + reward);
    assert.equal(game.state().worn, 'lilac');
    assert.equal(game.state().classes, 5);
    await player.wallet.orderPotion('etu');
    // An old tab rewrites its known fields after a café shift.
    const oldTab = game.state(); delete oldTab.kingdom; oldTab.coins += 10;
    game.records.set(key, JSON.stringify(oldTab));
    const refreshed = game.tab();
    await refreshed.wallet.updateWallet(() => {});
    assert.equal(game.state().coins, oldTab.coins);
    assert.equal(game.state().kingdom.orders.etu, 1);
    assert.equal(game.state().kingdom.prepared.id, 'etu');
  }
});

test('all three classes can start at zero coins and award exactly their previewed amounts', async () => {
  const game = savedGame(), player = game.tab(), { wallet } = player;
  for (const [coins, life] of [[0,1],[30,0]]) {
    await wallet.updateWallet(s => { s.coins = coins; s.kingdom.life = life; });
    assert.equal(await wallet.orderPotion('alle'), null);
    assert.equal(game.state().coins, coins);
    assert.equal(game.state().kingdom.life, life);
  }
  for (const [kind, coins, life] of [['bar',50,1],['center',80,2],['piece',120,3]]) {
    await wallet.updateWallet(s => { s.coins = 0; });
    const before = game.state(), preview = wallet.rewardFor(kind, before.kingdom.prepared);
    await enroll(player, kind);
    assert.equal(game.state().coins, 0);
    const receipt = await finish(player);
    assert.equal(receipt.refund, 0);
    assert.equal(preview.coins, coins);
    assert.equal(receipt.coins, preview.coins);
    assert.equal(receipt.gift, kind === 'bar' ? 'lilac' : null);
    assert.equal(game.state().coins, coins);
    assert.equal(game.state().kingdom.life, before.kingdom.life + life);
  }
});

test('previous bookings refund their recorded fee, even after the new free admission', async () => {
  for (const [kind, paid] of [['bar',0],['center',150],['piece',250]]) {
    const game = savedGame(), player = game.tab();
    await enroll(player, kind);
    await player.wallet.updateWallet(s => { s.coins = 12; s.lesson.paidFee = paid; });
    const after = await finish(player);
    assert.equal(after.refund, paid);
    assert.equal(after.after, 12 + paid + after.coins);
    assert.equal(await finish(player), null);
  }
});

test('the first costume is a gift, a returning player retains their outfit, and ownership survives refresh', async () => {
  const game = savedGame(), a = game.tab();
  await a.wallet.updateWallet(() => {});
  assert.equal((await a.wallet.updateWallet(() => a.wallet.buy('lilac'))).reason, 'lesson');
  await enroll(a, 'bar');
  const receipt = await finish(a);
  assert.equal(receipt.gift, 'lilac');
  assert.equal(receipt.before, 60);
  assert.equal(receipt.after, 110);
  await a.wallet.updateWallet(() => a.wallet.wear('lilac'));
  assert.equal(game.tab().wallet.get().worn, 'lilac');
  const old = game.state();
  old.coins = 325; old.owned = ['basic','swan']; old.worn = 'swan'; old.classes = 5;
  game.records.set(key, JSON.stringify(old));
  const restored = game.tab();
  await restored.wallet.updateWallet(() => {});
  assert.equal(game.state().coins, 325);
  assert.deepEqual(game.state().owned, ['basic','swan','lilac']);
  assert.equal(game.state().worn, 'swan');
  assert.equal(restored.wallet.stageReady(), true);
});

test('each outfit has distinct on-disk art for all six poses', () => {
  const { wallet } = savedGame().tab();
  const art = new Set();
  for (const dress of wallet.DRESS) {
    for (const pose of Object.keys(wallet.POSES)) {
      const url = wallet.dancerArt(dress.id, pose);
      assert.ok(existsSync(join(__dirname, '../..', new URL(url).pathname)), url);
      art.add(url);
    }
  }
  assert.equal(art.size, 30);
});

test('each class lays out its own note chart with ballet cues in time order', () => {
  const { wallet, book } = savedGame().tab();
  const sizes = { bar: 8, center: 12, piece: 16 };
  for (const [kind, size] of Object.entries(sizes)) {
    const chart = book.buildChart(kind, 0);
    assert.equal(chart.notes.length, size);
    assert.ok(chart.notes.every((note, i) => i === 0 || note.t > chart.notes[i - 1].t));
    assert.ok(chart.notes[chart.notes.length - 1].t + 1000 < chart.total);
    assert.ok(chart.notes.every(note => ['beat', 'cat', 'jump'].includes(note.type)));
    const cues = chart.notes.filter(note => note.type !== 'beat');
    assert.ok(cues.length >= 2, kind + ' needs cat and obstacle cues');
    assert.ok(chart.notes[0].type === 'beat' && chart.notes[1].type === 'beat', 'a beat settles the player first');
  }
  assert.equal(book.buildChart('bar', 0).notes.filter(n => n.type === 'beat').length, 6);
  const again = book.buildChart('bar', 1).notes.map(n => n.type).join(',');
  assert.notEqual(again, book.buildChart('bar', 0).notes.map(n => n.type).join(','));
});

test('a rhythm lesson is saved with its chart and scores combo and potion coins on completion', async () => {
  const game = savedGame(), player = game.tab(), { wallet, book } = player;
  await wallet.orderPotion('ara');
  await enroll(player, 'piece');
  const saved = game.state().lesson;
  assert.equal(saved.mode, 'rhythm');
  assert.equal(saved.chart.notes.length, 16);
  const reread = game.tab();
  assert.equal(reread.wallet.get().lesson.chart.notes.length, 16);
  const receipt = await finish(player, { perfect: 12, good: 3, miss: 1, maxCombo: 12, notes: 16, comboCoins: 9, noteCoins: 0 });
  assert.equal(receipt.comboCoins, 9);
  assert.equal(receipt.baseCoins, 120);
  assert.equal(receipt.coins, 129);
  assert.equal(receipt.perfect, 12);
  assert.equal(receipt.maxCombo, 12);
  assert.equal(receipt.stats.flex, 3 + 4);
  assert.equal(game.state().stamps.piece, 1);
  assert.equal(game.state().kingdom.prepared, null);
  assert.equal(game.tab().wallet.get().kingdom.receipt.notes, 16);
});
