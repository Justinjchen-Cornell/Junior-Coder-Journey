// 《小猪省钱路》核心逻辑测试（Dijkstra）
const test = require('node:test');
const assert = require('node:assert');
const { createPigGame } = require('../js/game.1.6.js');

test('初始化：图连通、边权 1-9、终点 ≠ 起点', () => {
  const g = createPigGame('challenge');
  assert.ok(g.nodeCount >= 5 && g.nodeCount <= 8);
  assert.notStrictEqual(g.end, g.start);
  // 连通性
  const visited = new Set([g.start]);
  const q = [g.start];
  while (q.length) {
    const cur = q.shift();
    g.edges.filter(e => e.a === cur || e.b === cur).forEach(e => {
      const nb = e.a === cur ? e.b : e.a;
      if (!visited.has(nb)) { visited.add(nb); q.push(nb); }
    });
  }
  assert.strictEqual(visited.size, g.nodeCount);
  g.edges.forEach(e => assert.ok(e.w >= 1 && e.w <= 9));
});

test('面板初始：起点 0，其他站 ∞', () => {
  const g = createPigGame('challenge');
  const panel = g.getPanel();
  assert.strictEqual(panel[g.start].cost, 0);
  panel.forEach((p, i) => { if (i !== g.start) assert.strictEqual(p.cost, Infinity); });
});

test('挑战 pickStation：必须选面板最小的未定案站', () => {
  const g = createPigGame('challenge');
  // 起点是最小（0）→ 先处理起点
  assert.strictEqual(g.pickStation(g.start), true);
  assert.ok(g.getPanel()[g.start].processed);
  // 面板更新后，若存在"严格更贵"的未定案站，选它必须报错（并列合法）
  const panel = g.getPanel();
  const cands = [];
  panel.forEach((p, id) => { if (!p.processed && p.cost < Infinity) cands.push({ id, cost: p.cost }); });
  const maxCost = Math.max(...cands.map(c => c.cost));
  const minCost = Math.min(...cands.map(c => c.cost));
  if (maxCost > minCost) {
    const expensive = cands.find(c => c.cost === maxCost);
    assert.strictEqual(g.pickStation(expensive.id), false);
    assert.strictEqual(g.mistakes, 1);
  }
});

test('松弛正确性：处理一站后邻居面板 = min(旧值, 新站价+边权)', () => {
  const g = createPigGame('challenge');
  g.pickStation(g.start);
  const panel = g.getPanel();
  // 起点的直接邻居：cost 应该 = 边权
  g.edges.filter(e => e.a === g.start || e.b === g.start).forEach(e => {
    const nb = e.a === g.start ? e.b : e.a;
    assert.strictEqual(panel[nb].cost, e.w);
  });
});

test('完整 Dijkstra：终点定案 → 总价 = 最短路径代价（暴力对拍）', () => {
  for (let trial = 0; trial < 30; trial++) {
    const g = createPigGame('challenge');
    let guard = 0;
    while (!g.isDone && guard++ < 200) {
      // 贪心：选面板最小的未定案站
      const panel = g.getPanel();
      let best = null;
      panel.forEach((p, id) => {
        if (!p.processed && (best === null || p.cost < best.cost)) best = { id, cost: p.cost };
      });
      if (best === null || best.cost === Infinity) break;
      g.pickStation(best.id);
    }
    assert.ok(g.isDone, '第 ' + trial + ' 次未完成');
    // 暴力对拍：枚举所有简单路径（小图）找最小总价
    const brute = bruteMin(g);
    assert.strictEqual(g.getStats().totalCost, brute, '第 ' + trial + ' 次 Dijkstra=' + g.getStats().totalCost + ' 暴力=' + brute);
  }
});

function bruteMin(g) {
  // 枚举所有简单路径（DFS），取最小总价
  let best = Infinity;
  function dfs(cur, visited, total) {
    if (cur === g.end) { best = Math.min(best, total); return; }
    g.edges.filter(e => e.a === cur || e.b === cur).forEach(e => {
      const nb = e.a === cur ? e.b : e.a;
      if (!visited.has(nb)) {
        visited.add(nb);
        dfs(nb, visited, total + e.w);
        visited.delete(nb);
      }
    });
  }
  dfs(g.start, new Set([g.start]), 0);
  return best;
}

test('最短路径：从终点回溯，路径代价 = 总价', () => {
  const g = createPigGame('challenge');
  let guard = 0;
  while (!g.isDone && guard++ < 200) {
    const panel = g.getPanel();
    let best = null;
    panel.forEach((p, id) => {
      if (!p.processed && (best === null || p.cost < best.cost)) best = { id, cost: p.cost };
    });
    if (best === null || best.cost === Infinity) break;
    g.pickStation(best.id);
  }
  const path = g.getShortestPath();
  assert.strictEqual(path[0], g.start);
  assert.strictEqual(path[path.length - 1], g.end);
  // 路径代价 = 边权和 = 总价
  let sum = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const e = g.edges.find(e => (e.a === path[i] && e.b === path[i+1]) || (e.a === path[i+1] && e.b === path[i]));
    assert.ok(e, '路径边存在');
    sum += e.w;
  }
  assert.strictEqual(sum, g.getStats().totalCost);
});

test('宝宝模式：只能走邻居，累计总价，到终点结束', () => {
  const g = createPigGame('baby');
  assert.ok(g.nodeCount >= 4 && g.nodeCount <= 6);
  // 非法：直接跳终点（如果不是邻居）
  const eToEnd = g.edges.find(e => (e.a === g.start && e.b === g.end) || (e.a === g.end && e.b === g.start));
  if (!eToEnd) {
    assert.strictEqual(g.travelTo(g.end), false);
  }
  // 合法走法：走第一条边
  const e = g.edges.find(e => e.a === g.start || e.b === g.start);
  const nb = e.a === g.start ? e.b : e.a;
  assert.strictEqual(g.travelTo(nb), true);
  assert.strictEqual(g.currentTotal, e.w);
});

test('宝宝模式：完整走完 → 结算含最优对比', () => {
  const g = createPigGame('baby');
  // BFS 距离引导：每步走向"离终点最近"的邻居（保证到达终点）
  const distToEnd = bfsDist(g, g.end);
  let guard = 0;
  while (!g.isDone && guard++ < 50) {
    const cur = g.currentNode;
    const nbs = g.edges.filter(e => e.a === cur || e.b === cur).map(e => e.a === cur ? e.b : e.a);
    if (!nbs.length) break;
    // 选 distToEnd 最小的邻居（优先=end 本身）
    const next = nbs.sort((x, y) => distToEnd.get(x) - distToEnd.get(y))[0];
    g.travelTo(next);
  }
  assert.ok(g.isDone, '宝宝模式应到达终点');
  const stats = g.getStats();
  assert.ok(stats.optimal >= 0);
  assert.ok(stats.totalCost >= stats.optimal);
});

function bfsDist(g, target) {
  const dist = new Map([[target, 0]]);
  const q = [target];
  while (q.length) {
    const cur = q.shift();
    g.edges.filter(e => e.a === cur || e.b === cur).forEach(e => {
      const nb = e.a === cur ? e.b : e.a;
      if (!dist.has(nb)) { dist.set(nb, dist.get(cur) + 1); q.push(nb); }
    });
  }
  return dist;
}

test('星级：宝宝按总价对比 / 挑战按错误', () => {
  const g = createPigGame('baby');
  const opt = g.getStats().optimal;
  assert.strictEqual(g.starsFor(opt, 0), 3);        // 总价=最优
  assert.strictEqual(g.starsFor(opt + 2, 0), 2);    // 总价=最优+2
  assert.strictEqual(g.starsFor(opt + 5, 0), 1);
  const g2 = createPigGame('challenge');
  assert.strictEqual(g2.starsFor(0, 0), 3);
  assert.strictEqual(g2.starsFor(0, 2), 2);
  assert.strictEqual(g2.starsFor(0, 3), 1);
});

test('reset：恢复初始', () => {
  const g = createPigGame('baby');
  const e = g.edges.find(e => e.a === g.start || e.b === g.start);
  const nb = e.a === g.start ? e.b : e.a;
  g.travelTo(nb);
  g.reset();
  assert.strictEqual(g.currentTotal, 0);
  assert.strictEqual(g.currentNode, g.start);
  assert.ok(!g.isDone);
});
test('至少 2 条不同路径（孩子有得选！）——宝宝模式', () => {
  for (let t = 0; t < 20; t++) {
    const g = createPigGame('baby');
    assert.ok(countPathsMin(g) >= 2, '第 ' + t + ' 次只有 ' + countPathsMin(g) + ' 条路');
  }
});

test('至少 2 条不同路径——挑战模式', () => {
  for (let t = 0; t < 20; t++) {
    const g = createPigGame('challenge');
    assert.ok(countPathsMin(g) >= 2, '第 ' + t + ' 次只有 ' + countPathsMin(g) + ' 条路');
  }
});

function countPathsMin(g) {
  let count = 0;
  function dfs(cur, visited) {
    if (count >= 2) return;
    if (cur === g.end) { count++; return; }
    g.edges.filter(e => e.a === cur || e.b === cur).forEach(e => {
      const nb = e.a === cur ? e.b : e.a;
      if (!visited.has(nb)) {
        visited.add(nb);
        dfs(nb, visited);
        visited.delete(nb);
      }
    });
  }
  dfs(g.start, new Set([g.start]));
  return count;
}
test('本子（优先队列）：未定案已发现基地按公里数升序，第一行 = 面板最小', () => {
  const g = createPigGame('challenge');
  g.pickStation(g.start);
  const nb = g.getNotebook();
  assert.ok(nb.length >= 1);
  for (let i = 1; i < nb.length; i++) {
    assert.ok(nb[i].cost >= nb[i - 1].cost, '本子应按公里数升序');
  }
  const panel = g.getPanel();
  let minId = null, minCost = Infinity;
  panel.forEach((p, id) => {
    if (!p.processed && p.cost < Infinity && p.cost < minCost) { minCost = p.cost; minId = id; }
  });
  assert.strictEqual(nb[0].id, minId, '第一行 = 当前最近');
});

test('本子：定案后该站从本子消失', () => {
  const g = createPigGame('challenge');
  g.pickStation(g.start);
  const before = g.getNotebook();
  assert.ok(before.some(r => r.id === g.start) === false, '起点已定案不在本子');
});
