// 《小动物储物柜》核心逻辑测试（哈希表）
const test = require('node:test');
const assert = require('node:assert');
const { createLockerGame } = require('../js/game.1.0.js');

test('初始化：宝宝模式 4-5 件物品，柜号不冲突', () => {
  const g = createLockerGame('baby');
  assert.ok(g.items.length >= 4 && g.items.length <= 5);
  const lockers = g.items.map(i => i.locker);
  assert.strictEqual(new Set(lockers).size, lockers.length);   // 无重复柜号
  assert.ok(g.currentTarget !== null);
});

test('初始化：挑战模式 8-10 件物品，恰有 2 对冲突', () => {
  const g = createLockerGame('challenge');
  assert.ok(g.items.length >= 8 && g.items.length <= 10);
  const count = {};
  g.items.forEach(i => { count[i.locker] = (count[i.locker] || 0) + 1; });
  const collisionPairs = Object.values(count).filter(c => c === 2).length;
  assert.strictEqual(collisionPairs, 2);
});

test('openLocker 正确柜号：找到目标', () => {
  const g = createLockerGame('baby');
  const target = g.currentTarget;
  const r = g.openLocker(target.locker);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.found, true);
  assert.strictEqual(g.mistakes, 0);
});

test('openLocker 错误柜号：mistakes+1', () => {
  const g = createLockerGame('baby');
  const wrong = g.items.find(i => i.id !== g.currentTarget.id).locker;
  const r = g.openLocker(wrong);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(g.mistakes, 1);
});

test('挑战模式冲突柜：开柜先看到链（collision），确认目标才找到', () => {
  const g = createLockerGame('challenge');
  // 找一个冲突柜号（两件同号）
  const count = {};
  g.items.forEach(i => { count[i.locker] = (count[i.locker] || 0) + 1; });
  const collisionLocker = Number(Object.keys(count).find(k => count[k] === 2));
  // 找到含目标的冲突柜：若目标在冲突柜 → 开柜=碰撞；否则开其他柜
  const target = g.currentTarget;
  let r;
  if (target.locker === collisionLocker) {
    r = g.openLocker(collisionLocker);
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.found, false);
    assert.ok(r.collision);
    assert.ok(r.items.length === 2);   // 链上有 2 件
    // 点错链上另一件
    const other = r.items.find(i => i.id !== target.id);
    assert.strictEqual(g.confirmTarget(other.id), false);
    assert.strictEqual(g.mistakes, 1);
    // 点对目标
    assert.strictEqual(g.confirmTarget(target.id), true);
    assert.strictEqual(g.collisionFinds, 1);
  } else {
    // 目标不在冲突柜：正常开中
    r = g.openLocker(target.locker);
    assert.strictEqual(r.found, true);
  }
});

test('完整流程：全部物品取完 → isDone', () => {
  const g = createLockerGame('baby');
  let guard = 0;
  while (!g.isDone && guard++ < 100) {
    const t = g.currentTarget;
    const r = g.openLocker(t.locker);
    assert.strictEqual(r.ok, true);
  }
  assert.ok(g.isDone);
  assert.strictEqual(g.getStats().found, g.items.length);
});

test('星级：0 错=3 / ≤2 错=2 / 3+ 错=1', () => {
  const g = createLockerGame('baby');
  assert.strictEqual(g.starsFor(0), 3);
  assert.strictEqual(g.starsFor(2), 2);
  assert.strictEqual(g.starsFor(3), 1);
});

test('getStats：找到数/错误/链上翻找数', () => {
  const g = createLockerGame('challenge');
  const s = g.getStats();
  assert.strictEqual(s.found, 0);
  assert.strictEqual(s.collisionFinds, 0);
  assert.ok(s.total === g.items.length);
});

test('reset：恢复初始', () => {
  const g = createLockerGame('baby');
  g.openLocker(g.currentTarget.locker);
  g.reset();
  assert.strictEqual(g.mistakes, 0);
  assert.strictEqual(g.getStats().found, 0);
  assert.ok(!g.isDone);
});
