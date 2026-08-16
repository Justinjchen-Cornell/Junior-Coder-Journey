// 《蚂蚁找食物》核心逻辑（纯逻辑，Node 可测）
// Dijkstra 游戏化：点亮点指挥蚂蚁（贪心+松弛+定案），莽撞蚂蚁同场竞速（BFS 最少跳）

function createAntGame(level) {
  const lv = level || 1;

  // ---------- 三关手工核心结构（保证教学） + 随机装饰 ----------
  // 节点：0 = 蚁穴（起点），最后一个 = 西瓜（终点）
  const sizes = { 1: 4, 2: 6, 3: 8 };
  const ends = { 1: 3, 2: 4, 3: 7 };     // 终点索引按关卡设计（装饰节点不是终点）
  const n = sizes[lv];
  const start = 0, end = ends[lv];
  const edges = [];
  const addE = (a, b, w) => {
    if (edges.some(e => (e.a === a && e.b === b) || (e.a === b && e.b === a))) return;
    edges.push({ a, b, w });
  };
  const w2 = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

  if (lv === 1) {
    // 两条 2 跳路线（无陷阱）：0-1-3(2+3=5) 与 0-2-3(4+1=5)
    addE(0, 1, w2(1, 3)); addE(1, 3, w2(2, 4));
    addE(0, 2, w2(3, 5)); addE(2, 3, 1);
  } else if (lv === 2) {
    // 陷阱：0-1-4 = 2 跳大权值(11)；0-2-3-4 = 3 跳小权值(5)
    addE(0, 1, 5); addE(1, 4, 6);            // 莽撞候选（2 跳 11 步）
    addE(0, 2, 2); addE(2, 3, 1); addE(3, 4, 2);  // 最优路（3 跳 5 步，固定）
    // 装饰路线 0-5-4：2 跳但保证 8-10 步（比最优 5 差，莽撞蚂蚁会选它 → 输）
    addE(0, 5, w2(4, 5)); addE(5, 4, w2(4, 5));
  } else {
    // 陷阱更狠 + "接近但不赢"的第二路线
    addE(0, 1, 6); addE(1, 2, 5); addE(2, 7, 6);       // 3 跳 17 步（莽撞候选）
    addE(0, 3, 1); addE(3, 4, 2); addE(4, 5, 1); addE(5, 7, 2);  // 4 跳 6 步（最优，固定）
    addE(0, 6, 3); addE(6, 5, 4);                       // 3 跳 7 步（接近最优但不赢）
    addE(1, 3, w2(3, 4));                               // 装饰边
  }

  // ---------- Dijkstra 状态 ----------
  const costs = new Map([[start, 0]]);
  const parents = new Map([[start, null]]);
  const processed = new Set();
  let antPos = start;
  let mistakes = 0;
  let done = false;

  function panelMin() {
    let best = null;
    for (let i = 0; i < n; i++) {
      if (processed.has(i)) continue;
      const c = costs.get(i);
      if (c === undefined) continue;
      if (best === null || c < best.cost) best = { id: i, cost: c };
    }
    return best;
  }

  function relax(node) {
    edges.filter(e => e.a === node || e.b === node).forEach(e => {
      const nb = e.a === node ? e.b : e.a;
      const nc = costs.get(node) + e.w;
      if (nc < (costs.get(nb) ?? Infinity)) {
        costs.set(nb, nc);
        parents.set(nb, node);
      }
    });
  }

  function getLight() {
    // 亮点 = 当前已知最近的未处理路口（贪心）
    const m = panelMin();
    return m ? m.id : null;
  }

  function moveTo(id) {
    if (done) return false;
    const light = getLight();
    if (light === null) return false;
    if (id !== light) {
      mistakes++;
      return false;
    }
    processed.add(id);
    antPos = id;
    if (id === end) { done = true; return true; }
    relax(id);
    return true;
  }

  // ---------- 莽撞蚂蚁：BFS 最少跳，并列取总步数小 ----------
  function rashPathOf() {
    const dist = new Map([[start, 0]]);
    const q = [start];
    while (q.length) {
      const c = q.shift();
      edges.filter(e => e.a === c || e.b === c).forEach(e => {
        const nb = e.a === c ? e.b : e.a;
        if (!dist.has(nb)) { dist.set(nb, dist.get(c) + 1); q.push(nb); }
      });
    }
    // 从 end 回溯跳数最少的路径（并列取总步数小 → 在 BFS 层内选）
    const hop = dist.get(end);
    // 枚举所有 hop 跳路径取最小权值
    let bestPath = null, bestCost = Infinity;
    function dfs(cur, visited, path, total) {
      if (path.length - 1 > hop) return;
      if (cur === end) {
        if (path.length - 1 === hop && total < bestCost) {
          bestCost = total;
          bestPath = path.slice();
        }
        return;
      }
      edges.filter(e => e.a === cur || e.b === cur).forEach(e => {
        const nb = e.a === cur ? e.b : e.a;
        if (!visited.has(nb) && path.length - 1 < hop) {
          visited.add(nb);
          path.push(nb);
          dfs(nb, visited, path, total + e.w);
          path.pop();
          visited.delete(nb);
        }
      });
    }
    dfs(start, new Set([start]), [start], 0);
    return { path: bestPath, hops: hop, cost: bestCost };
  }

  function dijkstraOptimal() {
    // 独立重算最优（结算对比用）
    const c = new Map([[start, 0]]);
    const p = new Map([[start, null]]);
    const doneSet = new Set();
    while (doneSet.size < n) {
      let best = null;
      for (let i = 0; i < n; i++) {
        if (doneSet.has(i)) continue;
        const cc = c.get(i);
        if (cc === undefined) continue;
        if (best === null || cc < best.cost) best = { id: i, cost: cc };
      }
      if (!best) break;
      doneSet.add(best.id);
      edges.filter(e => e.a === best.id || e.b === best.id).forEach(e => {
        const nb = e.a === best.id ? e.b : e.a;
        const nc = best.cost + e.w;
        if (nc < (c.get(nb) ?? Infinity)) { c.set(nb, nc); p.set(nb, best.id); }
      });
    }
    const path = [];
    let cur = end;
    while (cur !== null && cur !== undefined) { path.push(cur); cur = p.get(cur); }
    return { cost: c.get(end), path: path.reverse() };
  }

  function starsFor(errs) {
    if (errs === 0) return 3;
    if (errs <= 2) return 2;
    return 1;
  }

  function getStats() {
    const rash = rashPathOf();
    const opt = dijkstraOptimal();
    return {
      level: lv, totalCost: costs.get(end) ?? Infinity,
      optimalCost: opt.cost, optimalPath: opt.path, optimalHops: opt.path.length - 1,
      rashCost: rash.cost, rashHops: rash.hops, rashPath: rash.path,
      mistakes, stars: starsFor(mistakes),
    };
  }

  function reset() {
    costs.clear(); costs.set(start, 0);
    parents.clear(); parents.set(start, null);
    processed.clear();
    antPos = start;
    mistakes = 0;
    done = false;
  }

  return {
    level: lv, nodes: [...Array(n).keys()], edges, start, end,
    get antPos() { return antPos; },
    get isDone() { return done; },
    get mistakes() { return mistakes; },
    get rashPath() { return rashPathOf().path; },
    getLight, moveTo, getPanel: () => {
      const panel = [];
      for (let i = 0; i < n; i++) {
        panel.push({ cost: costs.has(i) ? costs.get(i) : Infinity, processed: processed.has(i) });
      }
      return panel;
    },
    starsFor, getStats, reset,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createAntGame };
}
