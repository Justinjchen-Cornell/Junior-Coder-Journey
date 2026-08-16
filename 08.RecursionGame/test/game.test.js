// 《套娃拆拆乐》v2 核心逻辑测试
const test = require('node:test');
const assert = require('node:assert');
const { createNestGame } = require('../js/game.2.2.js');

test('初始化：宝宝模式 5-7 层，全部 +1', () => {
  const g = createNestGame('baby');
  assert.ok(g.layers >= 5 && g.layers <= 7);
  assert.ok(g.addends.every(v => v === 1));
});

test('初始化：挑战模式 6-8 层，加数 2-9', () => {
  const g = createNestGame('challenge');
  assert.ok(g.layers >= 6 && g.layers <= 8);
  assert.ok(g.addends.every(v => v >= 2 && v <= 9));
});

test('openNext：拆到空盒（基线）', () => {
  const g = createNestGame('baby');
  for (let i = 0; i < g.layers; i++) {
    const r = g.openNext();
    assert.strictEqual(r.isBase, false);
    assert.strictEqual(r.layer, i + 1);
  }
  assert.strictEqual(g.openNext().isBase, true);
  assert.ok(g.isBaseReached);
});

test('回溯步骤：从里到外，running = 内层结果 + 本层加数（递归公式！）', () => {
  const g = createNestGame('challenge');
  for (let i = 0; i <= g.layers; i++) g.openNext();   // 拆到底
  // 验证所有步骤的公式：result = innerResult + myValue
  let idx = 0;
  let step;
  while ((step = g.getCurrentStep())) {
    assert.strictEqual(step.correct, step.innerResult + step.myValue);
    assert.ok(step.options.includes(step.correct));
    assert.ok(g.submitTrace(step.correct));           // 答对推进
    idx++;
  }
  assert.strictEqual(idx, g.layers);
  assert.ok(g.isDone);
});

test('挑战模式：答错 = mistakes+1，不推进', () => {
  const g = createNestGame('challenge');
  for (let i = 0; i <= g.layers; i++) g.openNext();
  const s = g.getCurrentStep();
  const wrong = s.options.find(o => o !== s.correct);
  assert.strictEqual(g.submitTrace(wrong), false);
  assert.strictEqual(g.mistakes, 1);
  assert.strictEqual(g.getCurrentStep().correct, s.correct);  // 还在原步
});

test('宝宝模式 answer：对/错', () => {
  const g = createNestGame('baby');
  for (let i = 0; i <= g.layers; i++) g.openNext();
  assert.strictEqual(g.answer(g.layers), true);
  assert.ok(g.isDone);
  const g2 = createNestGame('baby');
  for (let i = 0; i <= g2.layers; i++) g2.openNext();
  assert.strictEqual(g2.answer(g2.layers + 3), false);
  assert.strictEqual(g2.mistakes, 1);
});

test('最终结果 = 所有加数之和（递归返回的总答案）', () => {
  const g = createNestGame('challenge');
  for (let i = 0; i <= g.layers; i++) g.openNext();
  let step;
  while ((step = g.getCurrentStep())) g.submitTrace(step.correct);
  assert.strictEqual(g.getStats().finalResult, g.addends.reduce((a, b) => a + b, 0));
});

test('星级：0 错=3 / 1-2 错=2 / 3+ 错=1', () => {
  const g = createNestGame('baby');
  assert.strictEqual(g.starsFor(0), 3);
  assert.strictEqual(g.starsFor(2), 2);
  assert.strictEqual(g.starsFor(3), 1);
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
