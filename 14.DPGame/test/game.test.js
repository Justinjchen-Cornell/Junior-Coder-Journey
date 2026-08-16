// 《小松鼠装松果》核心逻辑测试（0/1 背包 / DP）
const test = require('node:test');
const assert = require('node:assert');
const { createAcornGame } = require('../js/game.1.1.js');

test('三关结构：容量/物品数正确', () => {
  const spec = { 1: [4, 3], 2: [5, 4], 3: [7, 6] };
  for (const lv of [1, 2, 3]) {
    const g = createAcornGame(lv);
    assert.strictEqual(g.capacity, spec[lv][0], '第 ' + lv + ' 关容量');
    assert.strictEqual(g.items.length, spec[lv][1], '第 ' + lv + ' 关物品数');
    g.items.forEach(i => { assert.ok(i.w >= 1 && i.v >= 1); });
  }
});

test('toggleItem：放/取切换，重量价值正确累计', () => {
  const g = createAcornGame(1);
  const it = g.items[0];
  assert.strictEqual(g.toggleItem(it.id), true);
  assert.strictEqual(g.currentW, it.w);
  assert.strictEqual(g.currentV, it.v);
  assert.ok(g.isIn(it.id));
  assert.strictEqual(g.toggleItem(it.id), true);   // 取出
  assert.strictEqual(g.currentW, 0);
  assert.strictEqual(g.currentV, 0);
  assert.ok(!g.isIn(it.id));
});

test('超重：放不下返回 false，不改变状态', () => {
  const g = createAcornGame(1);
  // 找一个超重组合：先把大件放满
  const big = g.items.slice().sort((a, b) => b.w - a.w)[0];
  g.toggleItem(big.id);
  const small = g.items.find(i => i.id !== big.id && i.w + big.w <= g.capacity);
  const over = g.items.find(i => i.id !== big.id && i.w + big.w > g.capacity);
  if (over) {
    const wBefore = g.currentW, vBefore = g.currentV;
    assert.strictEqual(g.toggleItem(over.id), false);
    assert.strictEqual(g.currentW, wBefore);
    assert.strictEqual(g.currentV, vBefore);
  }
});

test('DP 最优 = 暴力对拍（三关 × 多轮）', () => {
  for (const lv of [1, 2, 3]) {
    for (let t = 0; t < 20; t++) {
      const g = createAcornGame(lv);
      const brute = bruteKnapsack(g);
      assert.strictEqual(g.getStats().optimalV, brute, '第 ' + lv + ' 关第 ' + t + ' 次');
    }
  }
});

function bruteKnapsack(g) {
  const n = g.items.length;
  let best = 0;
  for (let mask = 0; mask < (1 << n); mask++) {
    let w = 0, v = 0;
    for (let i = 0; i < n; i++) {
      if (mask >> i & 1) { w += g.items[i].w; v += g.items[i].v; }
    }
    if (w <= g.capacity && v > best) best = v;
  }
  return best;
}

test('第 2/3 关贪心陷阱：贪心（密度）价值 < 最优', () => {
  for (const lv of [2, 3]) {
    const g = createAcornGame(lv);
    const s = g.getStats();
    assert.ok(s.greedyV < s.optimalV,
      '第 ' + lv + ' 关陷阱缺失: 贪心=' + s.greedyV + ' 最优=' + s.optimalV);
  }
});

test('最优组合：回溯集合合法且价值 = 最优', () => {
  for (const lv of [1, 2, 3]) {
    const g = createAcornGame(lv);
    const s = g.getStats();
    let w = 0, v = 0;
    s.optimalSet.forEach(id => {
      const it = g.items.find(x => x.id === id);
      w += it.w; v += it.v;
    });
    assert.ok(w <= g.capacity);
    assert.strictEqual(v, s.optimalV);
  }
});

test('finish：结算统计正确（装的价值/最优/星级）', () => {
  const g = createAcornGame(1);
  const opt = g.getStats().optimalSet;
  opt.forEach(id => g.toggleItem(id));
  const s = g.getStats();
  assert.strictEqual(s.totalV, s.optimalV);
  assert.strictEqual(s.stars, 3);
});

test('星级：=最优 3 / ≥90% 2 / 其他 1', () => {
  const g = createAcornGame(1);
  const opt = g.getStats().optimalV;
  assert.strictEqual(g.starsFor(opt), 3);
  assert.strictEqual(g.starsFor(Math.floor(opt * 0.9)), 2);
  assert.strictEqual(g.starsFor(Math.floor(opt * 0.5)), 1);
});

test('reset：清空篮子', () => {
  const g = createAcornGame(1);
  g.toggleItem(g.items[0].id);
  g.reset();
  assert.strictEqual(g.currentW, 0);
  assert.strictEqual(g.currentV, 0);
  assert.strictEqual(g.toggledCount, 0);
});
test('剩余容量最优提示：装一部分后，剩余最优 + 已装 = 全局最优（子问题）', () => {
  for (const lv of [1, 2, 3]) {
    const g = createAcornGame(lv);
    const opt = g.getStats().optimalV;
    // 先装"最优组合去掉一件"的部分
    const optSet = g.getStats().optimalSet.slice();
    if (optSet.length >= 2) {
      optSet.slice(0, optSet.length - 1).forEach(id => g.toggleItem(id));
      const rb = g.getRemainingBest();
      assert.strictEqual(g.currentV + rb.v, opt, '第 ' + lv + ' 关: 已装+剩余最优 = 全局最优');
      assert.ok(rb.v >= 0);
    }
  }
});
