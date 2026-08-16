// 《猜猜它是谁》核心逻辑测试（KNN）
const test = require('node:test');
const assert = require('node:assert');
const { createKnnGame } = require('../js/game.1.0.js');

test('三关结构：动物数/族类正确', () => {
  const spec = { 1: [8, 2], 2: [9, 2], 3: [12, 3] };
  for (const lv of [1, 2, 3]) {
    const g = createKnnGame(lv);
    assert.strictEqual(g.animals.length, spec[lv][0], '第 ' + lv + ' 关动物数');
    assert.strictEqual(g.classes.length, spec[lv][1], '第 ' + lv + ' 关族数');
    assert.strictEqual(g.k, lv === 3 ? 3 : 3);
  }
});

test('距离计算：欧氏距离正确', () => {
  const g = createKnnGame(1);
  const d = g.distanceTo({ x: 0, y: 0 });
  const a = g.animals[0];
  const expect = Math.hypot(a.x, a.y);
  assert.ok(Math.abs(d(a.id) - expect) < 1e-6);
});

test('真最近 K 个：距离排序正确', () => {
  const g = createKnnGame(1);
  const trueK = g.trueNearest(3);
  assert.strictEqual(trueK.length, 3);
  // 逐个验证：第 i 个的距离 ≤ 第 i+1 个
  for (let i = 0; i < trueK.length - 1; i++) {
    assert.ok(g.distanceTo({ x: g.target.x, y: g.target.y })(trueK[i]) <=
              g.distanceTo({ x: g.target.x, y: g.target.y })(trueK[i + 1]));
  }
});

test('邻居选择：选/取消切换，最多 K 个', () => {
  const g = createKnnGame(1);
  assert.strictEqual(g.toggleNeighbor(g.animals[0].id), true);
  assert.strictEqual(g.neighborCount, 1);
  assert.strictEqual(g.toggleNeighbor(g.animals[0].id), true);  // 取消
  assert.strictEqual(g.neighborCount, 0);
  // 选满 K 个后不能再多选
  const ids = g.animals.map(a => a.id);
  ids.forEach(id => g.toggleNeighbor(id));
  assert.ok(g.neighborCount <= g.k);
});

test('第 2 关陷阱：K=1 的多数 ≠ K=3 的多数（噪声邻居）', () => {
  const g = createKnnGame(2);
  const n1 = g.voteResultFor(1);
  const n3 = g.voteResultFor(3);
  assert.notStrictEqual(n1, n3, 'K=1 与 K=3 应不同');
  // 真最近 1 个是噪声（错误类），真最近 3 个多数是正确类
  assert.notStrictEqual(n1, g.trueClass);
  assert.strictEqual(n3, g.trueClass);
});

test('第 3 关：K 可调 1/3/5，K=1 易错', () => {
  const g = createKnnGame(3);
  assert.strictEqual(g.setK(1), true);
  assert.strictEqual(g.k, 1);
  assert.strictEqual(g.setK(5), true);
  assert.strictEqual(g.k, 5);
});

test('投票：邻居选对（真最近K）且投对 = 正确', () => {
  const g = createKnnGame(1);
  g.trueNearest(g.k).forEach(id => g.toggleNeighbor(id));
  const correctClass = g.voteResultFor(g.k);
  assert.strictEqual(g.vote(correctClass), true);
  assert.ok(g.voteCorrect);
});

test('投票错：返回 false', () => {
  const g = createKnnGame(1);
  const wrong = g.classes.find(c => c !== g.trueClass);
  g.trueNearest(g.k).forEach(id => g.toggleNeighbor(id));
  assert.strictEqual(g.vote(wrong), false);
  assert.ok(!g.voteCorrect);
});

test('星级：双对 3 / 单对 2 / 其他 1', () => {
  const g = createKnnGame(1);
  assert.strictEqual(g.starsFor(true, true), 3);
  assert.strictEqual(g.starsFor(true, false), 2);
  assert.strictEqual(g.starsFor(false, true), 2);
  assert.strictEqual(g.starsFor(false, false), 1);
});

test('getStats：邻居/投票/星级正确', () => {
  const g = createKnnGame(2);
  // 选真最近 3 个，投 K=3 的多数
  g.trueNearest(3).forEach(id => g.toggleNeighbor(id));
  const correct = g.voteResultFor(3);
  g.vote(correct);
  const s = g.getStats();
  assert.strictEqual(s.stars, 3);
  assert.ok(s.neighborsOk);
  assert.ok(s.voteCorrect);
});

test('reset：清空选择', () => {
  const g = createKnnGame(1);
  g.trueNearest(3).forEach(id => g.toggleNeighbor(id));
  g.vote(g.classes[0]);
  g.reset();
  assert.strictEqual(g.neighborCount, 0);
  assert.strictEqual(g.voted, false);
});
