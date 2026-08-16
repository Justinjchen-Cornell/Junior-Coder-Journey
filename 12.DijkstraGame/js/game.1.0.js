// 《小猪省钱路》核心逻辑（纯逻辑，Node 可测）
// Dijkstra 游戏化：手动跑"贪心选站 + 松弛面板 + 定案"

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createPigGame(mode) {
  const baby = mode === 'baby';
  const n = baby ? 4 + Math.floor(Math.random() * 3) : 5 + Math.floor(Math.random() * 4);
  const start = 0;
  const maxW = baby ? 6 : 9;

  // ---- 生成连通带权图（随机树 + 额外边）----
  const edges = [];
  const addEdge = (a, b) => {
    if (a === b) return;
    if (edges.some(e => (e.a === a && e.b === b) || (e.a === b && e.b === a))) return;
    edges.push({ a, b, w: 1 + Math.floor(Math.random() * maxW) });
  };
  // 随机树（保证连通）
  for (let i = 1; i < n; i++) {
    addEdge(i, Math.floor(Math.random() * i));
  }
  // 额外边
  const extra = baby ? 1 : 3;
  for (let e = 0; e < extra; e++) {
    addEdge(Math.floor(Math.random() * n), Math.floor(Math.random() * n));
  }

  // 终点 = BFS 最远节点
  const dist = new Map([[start, 0]]);
  const q = [start];
  while (q.length) {
    const cur = q.shift();
    edges.filter(e => e.a === cur || e.b === cur).forEach(e => {
      const nb = e.a === cur ? e.b : e.a;
      if (!dist.has(nb)) { dist.set(nb, dist.get(cur) + 1); q.push(nb); }
    });
  }
  let end = start;
  dist.forEach((d, id) => { if (d > dist.get(end)) end = id; });

  // ---- Dijkstra 状态 ----
  const costs = new Map([[start, 0]]);
  const parents = new Map([[start, null]]);
  const processed = new Set();
  let mistakes = 0;
  let done = false;
  let finalCost = null;

  // ---- 宝宝模式状态 ----
  let babyPos = start;
  let babyTotal = 0;

  function relax(node) {
    const nodeCost = costs.get(node);
    edges.filter(e => e.a === node || e.b === node).forEach(e => {
      const nb = e.a === node ? e.b : e.a;
      const newCost = nodeCost + e.w;
      if (newCost < (costs.get(nb) ?? Infinity)) {
        costs.set(nb, newCost);
        parents.set(nb, node);
      }
    });
  }

  function panelMinUnprocessed() {
    // 按节点序号扫描（与 UI 面板一致），并列时取序号小者——保证 pickStation 判定一致
    let best = null;
    for (let i = 0; i < n; i++) {
      if (processed.has(i)) continue;
      const c = costs.get(i);
      if (c === undefined) continue;
      if (best === null || c < best.cost) best = { id: i, cost: c };
    }
    return best;
  }

  function pickStation(id) {
    // 挑战模式：必须选"面板最小且未定案"的站（贪心）
    if (done) return false;
    if (processed.has(id)) return false;
    const min = panelMinUnprocessed();
    if (!min || id !== min.id) {
      mistakes++;
      return false;
    }
    processed.add(id);
    if (id === end) {
      done = true;
      finalCost = costs.get(id);
      return true;
    }
    relax(id);
    return true;
  }

  function travelTo(id) {
    // 宝宝模式：必须从当前站沿边走
    if (done) return false;
    const e = edges.find(e => (e.a === babyPos && e.b === id) || (e.a === id && e.b === babyPos));
    if (!e) return false;
    babyPos = id;
    babyTotal += e.w;
    if (id === end) { done = true; finalCost = babyTotal; }
    return true;
  }

  function getPanel() {
    const panel = [];
    for (let i = 0; i < n; i++) {
      panel.push({
        cost: costs.has(i) ? costs.get(i) : Infinity,
        processed: processed.has(i),
      });
    }
    return panel;
  }

  function getShortestPath() {
    if (finalCost === null && !done) return null;
    // 挑战模式：parents 回溯；宝宝模式：无法回溯（用 Dijkstra 重算）
    if (mode === 'baby') return null;
    const path = [];
    let cur = end;
    while (cur !== null && cur !== undefined) {
      path.push(cur);
      cur = parents.get(cur);
    }
    return path.reverse();
  }

  function starsFor(totalCost, errs) {
    if (baby) {
      const opt = optimalCost();
      if (totalCost === opt) return 3;
      if (totalCost <= opt + 2) return 2;
      return 1;
    }
    if (errs === 0) return 3;
    if (errs <= 2) return 2;
    return 1;
  }

  function optimalCost() {
    // 用 Dijkstra 算最优（独立重算，宝宝模式结算对比用）
    const c = new Map([[start, 0]]);
    const doneSet = new Set();
    while (doneSet.size < n) {
      let best = null;
      c.forEach((cost, id) => {
        if (!doneSet.has(id) && (best === null || cost < best.cost)) best = { id, cost };
      });
      if (!best) break;
      doneSet.add(best.id);
      edges.filter(e => e.a === best.id || e.b === best.id).forEach(e => {
        const nb = e.a === best.id ? e.b : e.a;
        const nc = best.cost + e.w;
        if (nc < (c.get(nb) ?? Infinity)) c.set(nb, nc);
      });
    }
    return c.get(end);
  }

  function getStats() {
    return {
      nodeCount: n, start, end,
      totalCost: baby ? babyTotal : (finalCost ?? Infinity),
      optimal: optimalCost(),
      mistakes,
      stars: starsFor(baby ? babyTotal : (finalCost ?? Infinity), mistakes),
      edges: edges.length,
    };
  }

  function reset() {
    costs.clear();
    costs.set(start, 0);
    parents.clear();
    parents.set(start, null);
    processed.clear();
    mistakes = 0;
    done = false;
    finalCost = null;
    babyPos = start;
    babyTotal = 0;
  }

  return {
    mode, nodeCount: n, start, end, edges,
    get currentNode() { return babyPos; },
    get currentTotal() { return babyTotal; },
    get isDone() { return done; },
    get mistakes() { return mistakes; },
    pickStation, travelTo, getPanel, getShortestPath, starsFor, getStats, reset,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createPigGame };
}
