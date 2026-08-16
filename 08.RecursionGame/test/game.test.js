// 《套娃拆拆乐》核心逻辑测试
const test = require('node:test');
const assert = require('node:assert');
const { createNestGame } = require('../js/game.js');

test('初始化：宝宝模式 5-7 层', () => {
  const g = createNestGame('baby');
  assert.ok(g.layers >= 5 && g.layers <= 7);
  assert.strictEqual(g.openedCount, 0);
  assert.ok(!g.isBaseReached);
});

test('初始化：挑战模式 8-10 层，值为 1..n 乱序', () => {
  const g = createNestGame('challenge');
  assert.ok(g.layers >= 8 && g.layers <= 10);
  const vals = g.layerValues.slice().sort((a, b) => a - b);
  assert.deepStrictEqual(vals, [...Array(g.layers)].map((_, i) => i + 1));
});

test('openNext：从外层拆到内层，最后是空娃娃（基线）', () => {
  const g = createNestGame('baby');
  const n = g.layers;
  let first = null;
  for (let i = 0; i < n; i++) {
    const r = g.openNext();
    if (i === 0) first = r;
    assert.strictEqual(r.isBase, false, `第 ${i + 1} 层不应是基线`);
    assert.strictEqual(g.openedCount, i + 1);
  }
  const base = g.openNext();          // 第 n+1 次 = 空娃娃
  assert.strictEqual(base.isBase, true);
  assert.ok(g.isBaseReached);
});

test('宝宝模式 answer：答对 true / 答错 false + mistakes', () => {
  const g = createNestGame('baby');
  const n = g.layers;
  for (let i = 0; i <= n; i++) g.openNext();   // 拆到底
  assert.ok(g.isBaseReached);
  assert.strictEqual(g.answer(n), true);
  assert.strictEqual(g.isDone, true);
  const g2 = createNestGame('baby');
  for (let i = 0; i <= g2.layers; i++) g2.openNext();
  assert.strictEqual(g2.answer(g2.layers + 5), false);
  assert.strictEqual(g2.mistakes, 1);
});

test('挑战模式：回溯必须按"从里到外"顺序提交（栈顺序）', () => {
  const g = createNestGame('challenge');
  const n = g.layers;
  // 拆：记录看到的顺序（外层→内层）
  const seen = [];
  for (let i = 0; i < n; i++) seen.push(g.openNext().value);
  g.openNext();  // 空娃娃
  // 回溯：从内到外 = seen 逆序
  const innerFirst = seen.slice().reverse();
  for (const v of innerFirst) {
    assert.strictEqual(g.submitNext(v), true);
  }
  assert.ok(g.isDone);
});

test('挑战模式：回溯顺序错 = mistakes+1，不推进', () => {
  const g = createNestGame('challenge');
  const n = g.layers;
  const seen = [];
  for (let i = 0; i < n; i++) seen.push(g.openNext().value);
  g.openNext();
  const wrong = g.submitNext(seen[0]);   // 先交了最外层的（顺序反了）
  assert.strictEqual(wrong, false);
  assert.strictEqual(g.mistakes, 1);
  assert.strictEqual(g.isDone, false);
  // 正确的还能继续
  const innerFirst = seen.slice().reverse();
  for (const v of innerFirst) assert.strictEqual(g.submitNext(v), true);
  assert.ok(g.isDone);
});

test('挑战模式：重复提交同一个值 = 错误', () => {
  const g = createNestGame('challenge');
  const n = g.layers;
  const seen = [];
  for (let i = 0; i < n; i++) seen.push(g.openNext().value);
  g.openNext();
  const innerFirst = seen.slice().reverse();
  g.submitNext(innerFirst[0]);
  assert.strictEqual(g.submitNext(innerFirst[0]), false);   // 重复
  assert.strictEqual(g.mistakes, 1);
});

test('星级：0 错=3 / 1-2 错=2 / 3+ 错=1', () => {
  const g = createNestGame('baby');
  assert.strictEqual(g.starsFor(0), 3);
  assert.strictEqual(g.starsFor(1), 2);
  assert.strictEqual(g.starsFor(2), 2);
  assert.strictEqual(g.starsFor(3), 1);
});

test('getStats：层数/错误数正确', () => {
  const g = createNestGame('baby');
  const n = g.layers;
  for (let i = 0; i <= n; i++) g.openNext();
  g.answer(n + 1);   // 错一次
  const s = g.getStats();
  assert.strictEqual(s.layers, n);
  assert.strictEqual(s.mistakes, 1);
});

test('reset：恢复初始', () => {
  const g = createNestGame('baby');
  for (let i = 0; i <= g.layers; i++) g.openNext();
  g.answer(1);
  g.reset();
  assert.strictEqual(g.openedCount, 0);
  assert.ok(!g.isBaseReached);
  assert.strictEqual(g.mistakes, 0);
  assert.ok(!g.isDone);
});
