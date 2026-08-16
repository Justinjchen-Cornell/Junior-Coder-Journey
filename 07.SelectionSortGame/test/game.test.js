// 《排队买冰淇淋》核心逻辑测试（node --test）
const test = require('node:test');
const assert = require('node:assert');
const { createQueueGame } = require('../js/game.js');

test('初始化：宝宝模式 5~8 张牌，值为 1..n 完整排列', () => {
  const g = createQueueGame('baby');
  const values = g.cards.map(c => c.value).sort((a, b) => a - b);
  assert.deepStrictEqual(values, [...Array(g.cards.length)].map((_, i) => i + 1));
  assert.ok(g.cards.length >= 5 && g.cards.length <= 8);
  assert.ok(!g.isDone);
});

test('初始化：挑战模式 8~12 张牌', () => {
  const g = createQueueGame('challenge');
  assert.ok(g.cards.length >= 8 && g.cards.length <= 12);
  assert.strictEqual(g.sortedCount, 0);
});

test('shuffle：两次游戏牌序大概率不同（Fisher-Yates 生效）', () => {
  const orders = new Set();
  for (let i = 0; i < 30; i++) {
    orders.add(createQueueGame('baby').cards.map(c => c.value).join(','));
  }
  assert.ok(orders.size >= 10, `仅 ${orders.size} 种排列，shuffle 可能没生效`);
});

test('checkMin：点最小 = ok，牌进队伍', () => {
  const g = createQueueGame('baby');
  const minId = g.currentMinId;
  const r = g.checkMin(minId);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(g.sortedCount, 1);
  assert.notStrictEqual(g.currentMinId, minId);   // 最小已换
});

test('checkMin：点错 = 温柔失败，队伍不动', () => {
  const g = createQueueGame('baby');
  const wrongId = g.cards.find(c => c.id !== g.currentMinId).id;
  const r = g.checkMin(wrongId);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(g.sortedCount, 0);
  assert.strictEqual(g.mistakes, 1);
});

test('👀 扫描计数：完成 n 张牌后总扫描 = n(n+1)/2', () => {
  const g = createQueueGame('baby');
  const n = g.cards.length;
  while (!g.isDone) g.checkMin(g.currentMinId);
  assert.strictEqual(g.getStats().scans, n * (n + 1) / 2);
  assert.strictEqual(g.getStats().theoretical, n * (n + 1) / 2);
});

test('挑战模式：flip 翻牌计数递增，可重复翻同一张', () => {
  const g = createQueueGame('challenge');
  const id = g.cards[0].id;
  g.flip(id);
  g.flip(id);
  assert.strictEqual(g.flipCount, 2);
});

test('挑战模式：confirm 正确 → 进队伍；错误 → mistakes+1', () => {
  const g = createQueueGame('challenge');
  const ok = g.confirm(g.currentMinId);
  assert.strictEqual(ok, true);
  assert.strictEqual(g.sortedCount, 1);
  const wrongId = g.cards.find(c => c.id !== g.currentMinId).id;
  const bad = g.confirm(wrongId);
  assert.strictEqual(bad, false);
  assert.strictEqual(g.mistakes, 1);
  assert.strictEqual(g.sortedCount, 1);
});

test('星级（宝宝模式）：0错=3星 / 1-2错=2星 / 3+错=1星', () => {
  assert.strictEqual(createQueueGame('baby').starsFor(0), 3);
  assert.strictEqual(createQueueGame('baby').starsFor(1), 2);
  assert.strictEqual(createQueueGame('baby').starsFor(2), 2);
  assert.strictEqual(createQueueGame('baby').starsFor(3), 1);
});

test('星级（挑战模式）：翻牌 ≤理论×1.2=3星 / ≤×1.5=2星 / 其他=1星', () => {
  const g = createQueueGame('challenge');
  const theo = g.getStats().theoretical;
  assert.strictEqual(g.starsFor(Math.floor(theo * 1.2)), 3);
  assert.strictEqual(g.starsFor(Math.floor(theo * 1.5)), 2);
  assert.strictEqual(g.starsFor(Math.floor(theo * 1.5) + 1), 1);
});

test('游戏结束：全部进队伍 → isDone', () => {
  const g = createQueueGame('baby');
  let guard = 0;
  while (!g.isDone && guard++ < 100) g.checkMin(g.currentMinId);
  assert.ok(g.isDone);
});

test('reset：恢复初始状态', () => {
  const g = createQueueGame('baby');
  g.checkMin(g.currentMinId);
  g.reset();
  assert.strictEqual(g.sortedCount, 0);
  assert.strictEqual(g.mistakes, 0);
  assert.strictEqual(g.flipCount, 0);
  assert.ok(!g.isDone);
});
