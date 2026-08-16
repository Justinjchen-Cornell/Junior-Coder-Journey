// 《小猴子找朋友》核心逻辑测试（BFS）
const test = require('node:test');
const assert = require('node:assert');
const { createBFSGame } = require('../js/game.1.2.js');

test('初始化：宝宝 6-8 节点，目标不在起点，图连通', () => {
  const g = createBFSGame('baby');
  assert.ok(g.nodeCount >= 6 && g.nodeCount <= 8);
  assert.notStrictEqual(g.target, g.start);
  // 连通性：BFS 可达全部节点
  const visited = new Set([g.start]);
  const q = [g.start];
  while (q.length) {
    const cur = q.shift();
    g.graph[cur].forEach(nb => {
      if (!visited.has(nb)) { visited.add(nb); q.push(nb); }
    });
  }
  assert.strictEqual(visited.size, g.nodeCount);
});

test('初始化：挑战 12-16 节点', () => {
  const g = createBFSGame('challenge');
  assert.ok(g.nodeCount >= 12 && g.nodeCount <= 16);
});

test('expand 第一圈 = 起点的邻居（不含起点）', () => {
  const g = createBFSGame('baby');
  const r = g.expand();
  assert.strictEqual(r.level, 1);
  assert.ok(!r.nodes.includes(g.start));
  r.nodes.forEach(n => assert.ok(g.graph[g.start].includes(n)));
});

test('expand 层级：每圈节点不重复（visited）', () => {
  const g = createBFSGame('baby');
  const seen = new Set([g.start]);
  let level = 0;
  while (!g.isDone && level < 10) {
    const r = g.expand();
    level = r.level;
    r.nodes.forEach(n => assert.ok(!seen.has(n), '重复节点!'));
    r.nodes.forEach(n => seen.add(n));
  }
  assert.strictEqual(seen.size, g.nodeCount);
});

test('目标在第 k 圈被揭示：foundLevel = k（最短步数）', () => {
  const g = createBFSGame('baby');
  const target = g.target;
  let found = false;
  let guard = 0;
  while (!g.isDone && guard++ < 10) {
    const r = g.expand();
    if (r.nodes.includes(target)) { found = true; break; }
  }
  assert.ok(found);
  assert.strictEqual(g.foundLevel, g.bfsLevelOf(target));
  while (!g.isDone) g.expand();   // 找到后继续扩散到全部完成
  assert.ok(g.isDone);
});

test('挑战模式 guess：猜对=提前胜利，猜错=mistakes+1', () => {
  const g = createBFSGame('challenge');
  // 猜错
  const wrong = g.graph[g.start][0];
  assert.strictEqual(g.guess(wrong), false);
  assert.strictEqual(g.mistakes, 1);
  // 猜对（未完成时）
  assert.strictEqual(g.guess(g.target), true);
  assert.ok(g.isDone);
});

test('完成后 expand/guess 无效', () => {
  const g = createBFSGame('baby');
  let guard = 0;
  while (!g.isDone && guard++ < 10) g.expand();
  assert.ok(g.isDone);
  assert.strictEqual(g.expand(), null);
});

test('星级：0 错=3 / ≤2 错=2 / 3+ 错=1', () => {
  const g = createBFSGame('baby');
  assert.strictEqual(g.starsFor(0), 3);
  assert.strictEqual(g.starsFor(2), 2);
  assert.strictEqual(g.starsFor(3), 1);
});

test('getStats：圈数/错误正确', () => {
  const g = createBFSGame('baby');
  while (!g.isDone) g.expand();
  const s = g.getStats();
  assert.strictEqual(s.steps, g.foundLevel);
  assert.strictEqual(s.mistakes, 0);
  assert.ok(s.steps >= 1);
});

test('reset：恢复初始', () => {
  const g = createBFSGame('baby');
  g.expand();
  g.reset();
  assert.strictEqual(g.getStats().steps, 0);
  assert.ok(!g.isDone);
});
test('最短路径：起点到目标，相邻节点有边，长度 = 圈数', () => {
  const g = createBFSGame('baby');
  while (!g.isDone) g.expand();
  const path = g.getShortestPath();
  assert.ok(path !== null);
  assert.strictEqual(path[0], g.start);
  assert.strictEqual(path[path.length - 1], g.target);
  // 相邻节点必须有边
  for (let i = 0; i < path.length - 1; i++) {
    assert.ok(g.graph[path[i]].includes(path[i + 1]));
  }
  // 路径边数 = 圈数（最短步数）
  assert.strictEqual(path.length - 1, g.foundLevel);
});

test('猜中后也能拿到最短路径', () => {
  const g = createBFSGame('challenge');
  g.guess(g.target);
  const path = g.getShortestPath();
  assert.ok(path !== null && path[path.length - 1] === g.target);
});
test('预言：选项含正确答案，提交正确 = predictionCorrect', () => {
  const g = createBFSGame('baby');
  const po = g.predictionOptions();
  assert.strictEqual(po.options.length, 3);
  assert.ok(po.options.includes(po.correct));
  assert.strictEqual(g.submitPrediction(po.correct), true);
  assert.ok(g.predictionCorrect);
  assert.strictEqual(g.predicted, po.correct);
});

test('预言：提交错误 → predictionCorrect=false，仍可继续游戏', () => {
  const g = createBFSGame('baby');
  const po = g.predictionOptions();
  const wrong = po.options.find(o => o !== po.correct);
  assert.strictEqual(g.submitPrediction(wrong), false);
  assert.ok(!g.predictionCorrect);
  // 仍然可以扩散找到目标
  while (!g.isDone) g.expand();
  assert.ok(g.isDone);
  assert.strictEqual(g.getStats().stars, 2);   // 预言错 = 2 星
});

test('预言：正确 → 3 星', () => {
  const g = createBFSGame('baby');
  const po = g.predictionOptions();
  g.submitPrediction(po.correct);
  while (!g.isDone) g.expand();
  assert.strictEqual(g.getStats().stars, 3);
});

test('预言：只能提交一次', () => {
  const g = createBFSGame('baby');
  const po = g.predictionOptions();
  g.submitPrediction(po.correct);
  assert.strictEqual(g.submitPrediction(po.correct), false);
});
