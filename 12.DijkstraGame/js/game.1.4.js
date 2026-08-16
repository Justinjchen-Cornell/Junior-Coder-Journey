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

  // 各节点到起点的深度（分层布局 + 连边规则用）
  const depth = bfsDepth(start);
  let end = start;
  depth.forEach((d, id) => { if (d > depth.get(end)) end = id; });

  // 额外边：只连"同层或相邻层"的节点 → 形成替代路线，画布不交叉
  const extra = baby ? 2 : 3;
  let added = 0, attempts = 0;
  while (added < extra && attempts < 60) {
    attempts++;
    const a = Math.floor(Math.random() * n);
    const b = Math.floor(Math.random() * n);
    if (a === b) continue;
    if (edges.some(e => (e.a === a && e.b === b) || (e.a === b && e.b === a))) continue;
    if (Math.abs(depth.get(a) - depth.get(b)) > 1) continue;   // 同层/相邻层
    addEdge(a, b);
    added++;
  }

  // 硬保证：起点到终点至少 2 条不同路径（孩子要有得选！）
  // 第一轮：深度差 ≤ 2（画布较整洁）；第二轮：彻底放开（窄图兜底）
  for (const maxDiff of [2, 99]) {
    let guard = 0;
    while (countPaths() < 2 && guard++ < 40) {
      const a = Math.floor(Math.random() * n);
      const b = Math.floor(Math.random() * n);
      if (a === b) continue;
      if (edges.some(e => (e.a === a && e.b === b) || (e.a === b && e.b === a))) continue;
      if (Math.abs(depth.get(a) - depth.get(b)) > maxDiff) continue;
      addEdge(a, b);
    }
    if (countPaths() >= 2) break;
  }

  function bfsDepth(s) {
    const d = new Map([[s, 0]]);
    const q = [s];
    while (q.length) {
      const cur = q.shift();
      edges.filter(e => e.a === cur || e.b === cur).forEach(e => {
        const nb = e.a === cur ? e.b : e.a;
        if (!d.has(nb)) { d.set(nb, d.get(cur) + 1); q.push(nb); }
      });
    }
    return d;
  }

  function countPaths() {
    // 简单路径计数（DFS，最多数到 2 就够）
    let count = 0;
    function dfs(cur, visited) {
      if (count >= 2) return;
      if (cur === end) { count++; return; }
      edges.filter(e => e.a === cur || e.b === cur).forEach(e => {
        const nb = e.a === cur ? e.b : e.a;
        if (!visited.has(nb)) {
          visited.add(nb);
          dfs(nb, visited);
          visited.delete(nb);
        }
      });
    }
    dfs(start, new Set([start]));
    return count;
  }

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

  function getNotebook() {
    // 神奇的本子：未定案的已发现基地，按公里数升序（优先队列！）
    const rows = [];
    for (let i = 0; i < n; i++) {
      if (processed.has(i)) continue;
      const c = costs.get(i);
      if (c === undefined) continue;
      rows.push({ id: i, cost: c });
    }
    rows.sort((a, b) => a.cost - b.cost || a.id - b.id);
    return rows;
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
    mode, nodeCount: n, start, end, edges, depth: [...depth.entries()].map(([id, d]) => ({ id, d })),
    get currentNode() { return babyPos; },
    get currentTotal() { return babyTotal; },
    get isDone() { return done; },
    get mistakes() { return mistakes; },
    pickStation, travelTo, getPanel, getNotebook, getShortestPath, starsFor, getStats, reset,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createPigGame };
}
