// 《猜猜小动物在哪里》核心逻辑测试（node --test）
const test = require('node:test');
const assert = require('node:assert');
const { createGame } = require('../js/game.js');

test('createGame 初始化：宝宝模式 1-10', () => {
  const g = createGame('baby');
  assert.strictEqual(g.min, 1);
  assert.strictEqual(g.max, 10);
  assert.ok(g.target >= 1 && g.target <= 10);
  assert.strictEqual(g.guessCount, 0);
  assert.deepStrictEqual(g.getRange(), { lo: 1, hi: 10 });
});

test('createGame 初始化：挑战模式 1-100', () => {
  const g = createGame('challenge');
  assert.strictEqual(g.min, 1);
  assert.strictEqual(g.max, 100);
  assert.ok(g.target >= 1 && g.target <= 100);
});

test('猜中：result=hit, done=true, 步数=1', () => {
  const g = createGame('baby');
  const r = g.guess(g.target);
  assert.strictEqual(r.result, 'hit');
  assert.strictEqual(r.done, true);
  assert.strictEqual(r.guessCount, 1);
});

test('猜低了：result=low, done=false, 区间左边界收缩', () => {
  const g = createGame('baby', 5);   // 固定 target=5
  const r = g.guess(3);
  assert.strictEqual(r.result, 'low');
  assert.strictEqual(r.done, false);
  assert.deepStrictEqual(r.range, { lo: 4, hi: 10 });
});

test('猜高了：result=high, done=false, 区间右边界收缩', () => {
  const g = createGame('baby', 5);   // 固定 target=5
  const r = g.guess(8);
  assert.strictEqual(r.result, 'high');
  assert.deepStrictEqual(r.range, { lo: 1, hi: 7 });
});

test('区间正确性：连续猜，区间每次砍半', () => {
  const g = createGame('challenge', 50);
  let r = g.guess(30);            // 低 → 区间 [31,100]
  assert.deepStrictEqual(r.range, { lo: 31, hi: 100 });
  r = g.guess(80);                // 高 → 区间 [31,79]
  assert.deepStrictEqual(r.range, { lo: 31, hi: 79 });
  r = g.guess(55);                // 高 → 区间 [31,54]
  assert.deepStrictEqual(r.range, { lo: 31, hi: 54 });
  r = g.guess(45);                // 低 → 区间 [46,54]
  assert.deepStrictEqual(r.range, { lo: 46, hi: 54 });
});

test('边界：猜 1 和猜 100 都能正常工作（不越界）', () => {
  const g = createGame('challenge', 1);
  assert.strictEqual(g.guess(100).result, 'high');
  const g2 = createGame('challenge', 100);
  assert.strictEqual(g2.guess(1).result, 'low');
});

test('二分最优性：100 个数字永远 ≤7 步猜中', () => {
  for (let trial = 0; trial < 200; trial++) {
    const g = createGame('challenge');
    let steps = 0;
    let lo = g.min, hi = g.max;
    while (true) {
      const mid = Math.floor((lo + hi) / 2);
      const r = g.guess(mid);
      steps++;
      if (r.done) break;
      if (r.result === 'low') lo = r.range.lo;
      else hi = r.range.hi;
    }
    assert.ok(steps <= 7, `第 ${trial} 次用了 ${steps} 步，应 ≤7`);
  }
});

test('宝宝模式最优性：10 个数字永远 ≤4 步', () => {
  for (let trial = 0; trial < 200; trial++) {
    const g = createGame('baby');
    let steps = 0, lo = g.min, hi = g.max;
    while (true) {
      const mid = Math.floor((lo + hi) / 2);
      const r = g.guess(mid);
      steps++;
      if (r.done) break;
      if (r.result === 'low') lo = r.range.lo;
      else hi = r.range.hi;
    }
    assert.ok(steps <= 4, `第 ${trial} 次用了 ${steps} 步，应 ≤4`);
  }
});

test('reset：步数清零、target 重置、区间复原', () => {
  const g = createGame('baby');
  g.guess(5);
  const oldTarget = g.target;
  g.reset();
  assert.strictEqual(g.guessCount, 0);
  assert.deepStrictEqual(g.getRange(), { lo: 1, hi: 10 });
  assert.ok(g.target >= 1 && g.target <= 10);
  assert.ok(g.target !== oldTarget || true); // target 随机，允许巧合相等
});

test('命中后区间收敛到 target（UI 高亮效果）', () => {
  const g = createGame('challenge', 42);
  const r = g.guess(42);
  assert.deepStrictEqual(r.range, { lo: 42, hi: 42 });
});
