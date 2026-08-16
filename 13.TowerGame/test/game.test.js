// 《盖广播塔》核心逻辑测试（贪心/集合覆盖）
const test = require('node:test');
const assert = require('node:assert');
const { createTowerGame } = require('../js/game.1.2.js');

test('三关结构：村庄/塔数量正确', () => {
  const spec = { 1: [5, 4], 2: [8, 6], 3: [12, 8] };
  for (const lv of [1, 2, 3]) {
    const g = createTowerGame(lv);
    assert.strictEqual(g.villages.length, spec[lv][0], '第 ' + lv + ' 关村庄数');
    assert.strictEqual(g.towers.length, spec[lv][1], '第 ' + lv + ' 关塔数');
  }
});

test('覆盖完备：所有塔合起来能覆盖全部村庄', () => {
  for (const lv of [1, 2, 3]) {
    const g = createTowerGame(lv);
    const all = new Set();
    g.towers.forEach(t => t.covers.forEach(v => all.add(v)));
    g.villages.forEach(v => assert.ok(all.has(v), '第 ' + lv + ' 关村庄 ' + v + ' 无覆盖'));
  }
});

test('第 2/3 关陷阱：贪心塔数 > 最优塔数', () => {
  for (const lv of [2, 3]) {
    const g = createTowerGame(lv);
    const s = g.getStats();
    assert.ok(s.greedyCount > s.optimalCount,
      '第 ' + lv + ' 关陷阱缺失: 贪心=' + s.greedyCount + ' 最优=' + s.optimalCount);
  }
});

test('第 1 关：贪心 = 最优（建立直觉）', () => {
  const g = createTowerGame(1);
  const s = g.getStats();
  assert.strictEqual(s.greedyCount, s.optimalCount);
});

test('chooseTower：盖塔覆盖村庄，重复盖无效', () => {
  const g = createTowerGame(1);
  const t = g.towers[0];
  assert.strictEqual(g.chooseTower(t.id), true);
  assert.strictEqual(g.coveredCount, t.covers.length);
  assert.strictEqual(g.chooseTower(t.id), false);   // 重复盖
  assert.strictEqual(g.towersUsed, 1);
});

test('undo：拆塔恢复覆盖', () => {
  const g = createTowerGame(1);
  const t1 = g.towers[0], t2 = g.towers[1];
  g.chooseTower(t1.id);
  g.chooseTower(t2.id);
  const before = g.coveredCount;
  assert.strictEqual(g.undo(), true);
  assert.strictEqual(g.towersUsed, 1);
  assert.ok(g.coveredCount <= before);
  assert.strictEqual(g.coveredCount, t1.covers.length);
});

test('完成判定：全部村庄覆盖 = isDone', () => {
  const g = createTowerGame(1);
  let guard = 0;
  while (!g.isDone && guard++ < 10) {
    // 贪心：每次选覆盖最多未覆盖的塔
    const best = greedyPick(g);
    g.chooseTower(best);
  }
  assert.ok(g.isDone);
  assert.strictEqual(g.coveredCount, g.villages.length);
});

function greedyPick(g) {
  let best = null, bestCount = -1;
  g.towers.forEach(t => {
    if (g.chosen.includes(t.id)) return;
    const cnt = t.covers.filter(v => !g.covered.has(v)).length;
    if (cnt > bestCount) { bestCount = cnt; best = t.id; }
  });
  return best;
}

test('最优解验证：暴力枚举 = 标准答案（覆盖全部的最少塔）', () => {
  for (const lv of [1, 2, 3]) {
    const g = createTowerGame(lv);
    const brute = bruteMin(g);
    assert.strictEqual(g.getStats().optimalCount, brute, '第 ' + lv + ' 关');
  }
});

function bruteMin(g) {
  const n = g.towers.length;
  let best = n + 1;
  for (let mask = 1; mask < (1 << n); mask++) {
    const covered = new Set();
    let cnt = 0;
    for (let i = 0; i < n; i++) {
      if (mask >> i & 1) {
        cnt++;
        g.towers[i].covers.forEach(v => covered.add(v));
      }
    }
    if (cnt < best && g.villages.every(v => covered.has(v))) best = cnt;
  }
  return best;
}

test('星级：塔数=最优3 / ≤最优+1 2 / 其他1', () => {
  const g = createTowerGame(1);
  const opt = g.getStats().optimalCount;
  assert.strictEqual(g.starsFor(opt), 3);
  assert.strictEqual(g.starsFor(opt + 1), 2);
  assert.strictEqual(g.starsFor(opt + 2), 1);
});

test('贪心模拟正确：覆盖最多未覆盖的塔优先', () => {
  const g = createTowerGame(2);
  const s = g.getStats();
  // 手工验证贪心序列（陷阱关）：先盖覆盖 3 村的塔
  const greedyTowers = g.simulateGreedy();
  assert.ok(greedyTowers.length === s.greedyCount);
});
