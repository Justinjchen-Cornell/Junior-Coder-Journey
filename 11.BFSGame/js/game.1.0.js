// 《小猴子找朋友》核心逻辑（纯逻辑，Node 可测）
// BFS 游戏化：波纹扩散——一圈圈展开，目标在第几圈出现 = 几步（先到先得 = 最短）

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createBFSGame(mode) {
  const baby = mode !== 'challenge';
  const n = baby ? 6 + Math.floor(Math.random() * 3) : 12 + Math.floor(Math.random() * 5);
  const targetLevel = baby ? 2 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 3);

  // ---- 生成连通图（BFS 树 + 随机额外边）----
  const graph = Array.from({ length: n }, () => []);
  const start = 0;
  // 分层生成：level 0 = [start]
  const levels = [[start]];
  const assigned = new Set([start]);
  const parents = new Map();   // node -> parent（画线用）
  let lv = 0;
  while (assigned.size < n) {
    const cur = [];
    const nodes = levels[lv];
    for (const p of nodes) {
      // 每节点生 1-2 个孩子
      const kids = 1 + Math.floor(Math.random() * 2);
      for (let k = 0; k < kids && assigned.size < n; k++) {
        const id = assigned.size;
        assigned.add(id);
        graph[p].push(id);
        graph[id].push(p);
        parents.set(id, p);
        cur.push(id);
      }
    }
    if (!cur.length) break;   // 安全兜底
    levels.push(cur);
    lv++;
  }
  // 随机额外边（增加非树结构，但保持 BFS 层不变或变小）
  const extra = baby ? 2 : 4;
  for (let e = 0; e < extra; e++) {
    const a = Math.floor(Math.random() * n);
    const b = Math.floor(Math.random() * n);
    if (a !== b && !graph[a].includes(b)) {
      graph[a].push(b);
      graph[b].push(a);
    }
  }

  // 计算每节点 BFS 层（从 start）
  const bfsLevel = new Map([[start, 0]]);
  const q = [start];
  while (q.length) {
    const cur = q.shift();
    for (const nb of graph[cur]) {
      if (!bfsLevel.has(nb)) {
        bfsLevel.set(nb, bfsLevel.get(cur) + 1);
        q.push(nb);
      }
    }
  }

  // 目标：取 targetLevel 层的节点（确保存在；层数可能因额外边变小 → 取可用最大层附近）
  let target = null;
  for (let l = targetLevel; l >= 1 && target === null; l--) {
    const candidates = [...bfsLevel.entries()].filter(([id, lev]) => lev === l && id !== start);
    if (candidates.length) {
      target = candidates[Math.floor(Math.random() * candidates.length)][0];
    }
  }
  if (target === null) {
    target = [...bfsLevel.entries()].filter(([id]) => id !== start)[0][0];
  }

  // ---- 游戏状态 ----
  let visited = new Set([start]);
  let queue = [start];
  let currentLevel = 0;
  let foundLevel = null;
  let mistakes = 0;
  let guessed = false;

  function expand() {
    if (isDone()) return null;
    currentLevel++;
    // 本圈 = 当前队列的邻居中未访问的（按队列顺序 = BFS）
    const next = [];
    const nextQ = [];
    for (const cur of queue) {
      for (const nb of graph[cur]) {
        if (!visited.has(nb)) {
          visited.add(nb);
          next.push(nb);
          nextQ.push(nb);
          if (nb === target) foundLevel = currentLevel;
        }
      }
    }
    queue = nextQ;
    return { level: currentLevel, nodes: next };
  }

  function guess(id) {
    if (isDone()) return false;
    if (id === target) {
      guessed = true;
      return true;
    }
    mistakes++;
    return false;
  }

  function isDone() {
    return guessed || (foundLevel !== null && visited.size === n) || (foundLevel !== null && queue.length === 0);
  }

  function bfsLevelOf(id) { return bfsLevel.get(id); }

  function starsFor(errs) {
    if (errs === 0) return 3;
    if (errs <= 2) return 2;
    return 1;
  }

  function getStats() {
    return {
      steps: foundLevel === null ? currentLevel : foundLevel,
      mistakes, stars: starsFor(mistakes),
      target, nodeCount: n,
    };
  }

  function reset() {
    visited = new Set([start]);
    queue = [start];
    currentLevel = 0;
    foundLevel = null;
    mistakes = 0;
    guessed = false;
  }

  return {
    mode, nodeCount: n, start, target, graph, levels: [...bfsLevel.entries()].map(([id, lev]) => ({ id, level: lev })),
    get isDone() { return isDone(); },
    get foundLevel() { return foundLevel; },
    get mistakes() { return mistakes; },
    expand, guess, bfsLevelOf, starsFor, getStats, reset,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createBFSGame };
}
