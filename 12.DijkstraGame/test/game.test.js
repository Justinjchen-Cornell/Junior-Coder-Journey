// 《蚂蚁找食物》核心逻辑测试（Dijkstra 重做版）
const test = require('node:test');
const assert = require('node:assert');
const { createAntGame } = require('../js/game.1.1.js');

test('三关结构：4/6/8 路口，连通，起点≠终点', () => {
  const sizes = { 1: 4, 2: 6, 3: 8 };
  for (const lv of [1, 2, 3]) {
    const g = createAntGame(lv);
    assert.strictEqual(g.nodes.length, sizes[lv], '第 ' + lv + ' 关路口数');
    assert.notStrictEqual(g.end, g.start);
    // 连通
    const visited = new Set([g.start]);
    const q = [g.start];
    while (q.length) {
      const c = q.shift();
      g.edges.filter(e => e.a === c || e.b === c).forEach(e => {
        const nb = e.a === c ? e.b : e.a;
        if (!visited.has(nb)) { visited.add(nb); q.push(nb); }
      });
    }
    assert.strictEqual(visited.size, g.nodes.length, '第 ' + lv + ' 关连通');
  }
});

test('每关 ≥2 条路径（有岔路！）', () => {
  for (const lv of [1, 2, 3]) {
    const g = createAntGame(lv);
    assert.ok(countPaths(g) >= 2, '第 ' + lv + ' 关应有岔路');
  }
});

test('第 2/3 关有莽撞陷阱：莽撞蚂蚁步数 > 最优步数', () => {
  for (const lv of [2, 3]) {
    const g = createAntGame(lv);
    const s = g.getStats();
    assert.ok(s.rashCost > s.optimalCost,
      '第 ' + lv + ' 关陷阱缺失: 莽撞=' + s.rashCost + ' 最优=' + s.optimalCost);
    assert.ok(s.rashHops <= s.optimalHops, '莽撞跳数应 ≤ 最优跳数（它只看岔路）');
  }
});

test('莽撞路线合法：起点到终点、相邻有边、跳数最少', () => {
  const g = createAntGame(2);
  const path = g.rashPath;
  assert.strictEqual(path[0], g.start);
  assert.strictEqual(path[path.length - 1], g.end);
  for (let i = 0; i < path.length - 1; i++) {
    assert.ok(g.edges.some(e => (e.a === path[i] && e.b === path[i+1]) || (e.a === path[i+1] && e.b === path[i])));
  }
  // 跳数 = 最少（BFS 宽度）
  assert.strictEqual(path.length - 1, bfsHops(g));
});

test('亮点顺序：每步 getLight = 面板最小未处理路口（moveTo 只接受亮点）', () => {
  for (const lv of [1, 2, 3]) {
    const g = createAntGame(lv);
    const seq = [];
    let guard = 0;
    while (!g.isDone && guard++ < 50) {
      const light = g.getLight();
      seq.push(light);
      assert.strictEqual(g.moveTo(light), true, '亮点必须可点');
    }
    assert.ok(g.isDone, '第 ' + lv + ' 关完成');
    assert.strictEqual(g.mistakes, 0, '第 ' + lv + ' 关零错误');
    // 终点已定案且代价 = 最优
    assert.strictEqual(g.getPanel()[g.end].processed, true);
    assert.strictEqual(g.getStats().totalCost, g.getStats().optimalCost);
  }
});

test('moveTo：点亮点 → 蚂蚁移动 + 松弛；点非亮点 → 错误', () => {
  const g = createAntGame(1);
  const light = g.getLight();
  assert.strictEqual(g.moveTo(light), true);
  assert.strictEqual(g.antPos, light);
  // 找"非亮点且非当前位置"的路口（当前亮点可能已变化）
  const other = g.nodes.find(n => n !== g.antPos && n !== g.getLight());
  if (other !== undefined) {
    assert.strictEqual(g.moveTo(other), false);
    assert.strictEqual(g.mistakes, 1);
  }
});

test('最优路径与总步数 = 暴力对拍', () => {
  for (const lv of [1, 2, 3]) {
    const g = createAntGame(lv);
    const s = g.getStats();
    const brute = bruteMin(g);
    assert.strictEqual(s.optimalCost, brute, '第 ' + lv + ' 关 Dijkstra=' + s.optimalCost + ' 暴力=' + brute);
    // 最优路径总步数一致
    const path = s.optimalPath;
    let sum = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const e = g.edges.find(e => (e.a === path[i] && e.b === path[i+1]) || (e.a === path[i+1] && e.b === path[i]));
      sum += e.w;
    }
    assert.strictEqual(sum, s.optimalCost);
  }
});

test('完整游玩：跟着亮点走到终点，总步数 = 最优', () => {
  for (const lv of [1, 2, 3]) {
    const g = createAntGame(lv);
    let guard = 0;
    while (!g.isDone && guard++ < 50) g.moveTo(g.getLight());
    assert.ok(g.isDone, '第 ' + lv + ' 关完成');
    const s = g.getStats();
    assert.strictEqual(s.totalCost, s.optimalCost);
    assert.strictEqual(s.mistakes, 0);
  }
});

test('星级：0 错 3 / ≤2 错 2 / 其他 1', () => {
  const g = createAntGame(1);
  assert.strictEqual(g.starsFor(0), 3);
  assert.strictEqual(g.starsFor(2), 2);
  assert.strictEqual(g.starsFor(3), 1);
});

test('reset：恢复初始', () => {
  const g = createAntGame(1);
  g.moveTo(g.getLight());
  g.reset();
  assert.strictEqual(g.mistakes, 0);
  assert.ok(!g.isDone);
  assert.strictEqual(g.antPos, g.start);
});

function countPaths(g) {
  let count = 0;
  function dfs(cur, visited) {
    if (count >= 2) return;
    if (cur === g.end) { count++; return; }
    g.edges.filter(e => e.a === cur || e.b === cur).forEach(e => {
      const nb = e.a === cur ? e.b : e.a;
      if (!visited.has(nb)) { visited.add(nb); dfs(nb, visited); visited.delete(nb); }
    });
  }
  dfs(g.start, new Set([g.start]));
  return count;
}

function bfsHops(g) {
  const dist = new Map([[g.start, 0]]);
  const q = [g.start];
  while (q.length) {
    const c = q.shift();
    g.edges.filter(e => e.a === c || e.b === c).forEach(e => {
      const nb = e.a === c ? e.b : e.a;
      if (!dist.has(nb)) { dist.set(nb, dist.get(c) + 1); q.push(nb); }
    });
  }
  return dist.get(g.end);
}

function bruteMin(g) {
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
test('候选路口：已发现未处理，按步数升序', () => {
  const g = createAntGame(1);
  const cands = g.getCandidates();
  assert.ok(cands.length >= 1);
  assert.ok(cands[0].cost === 0 && cands[0].id === g.start);   // 起点 0 步最先
  for (let i = 1; i < cands.length; i++) {
    assert.ok(cands[i].cost >= cands[i - 1].cost);
  }
});

test('候选路口：处理后就消失', () => {
  const g = createAntGame(1);
  g.moveTo(g.getLight());
  const cands = g.getCandidates();
  assert.ok(!cands.some(c => c.id === g.start));
});
