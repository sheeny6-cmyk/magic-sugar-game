const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
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

function finish({ wallet, book }) {
  return wallet.updateWallet(state => {
    const run = state.lesson;
    if (!run) return wallet.finishPractice(state, {});
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
    const receipt = await finish(player);
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

test('free practice restores buying power even at zero and advanced deposits are fully returned', async () => {
  const game = savedGame(), player = game.tab(), { wallet } = player;
  for (const [coins, life] of [[0,1],[30,0]]) {
    await wallet.updateWallet(s => { s.coins = coins; s.kingdom.life = life; });
    assert.equal(await wallet.orderPotion('alle'), null);
    assert.equal(game.state().coins, coins);
    assert.equal(game.state().kingdom.life, life);
  }
  await wallet.updateWallet(s => { s.coins = 0; });
  await enroll(player, 'bar');
  await finish(player);
  assert.ok(await wallet.orderPotion('ara'));
  await wallet.updateWallet(s => { s.coins = 300; });
  for (const [kind, fee, reward, life] of [['center',150,80,2],['piece',250,120,3]]) {
    const before = game.state();
    await enroll(player, kind);
    assert.equal(game.state().coins, before.coins - fee);
    const receipt = await finish(player);
    assert.equal(receipt.refund, fee);
    assert.equal(game.state().coins, before.coins + reward);
    assert.equal(game.state().kingdom.life, before.kingdom.life + life);
  }
});
