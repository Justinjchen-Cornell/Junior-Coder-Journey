// 《小松鼠装松果》核心逻辑（纯逻辑，Node 可测）
// 0/1 背包游戏化：试装（放/取）+ DP 最优 + 贪心对比

function createAcornGame(level) {
  const lv = level || 1;

  // ---------- 三关手工结构 ----------
  let capacity = 4, items = [];
  if (lv === 1) {
    capacity = 4;
    items = [
      { id: 0, name: '🌰', w: 1, v: 8 },   // 小栗子
      { id: 1, name: '🍄', w: 2, v: 15 },  // 蘑菇
      { id: 2, name: '🍂', w: 3, v: 20 },  // 大松果
    ];   // 最优：🌰+🍄 = 23 或 🍂+🌰 = 28? 1+3=4 → 8+20=28 → 最优 28（大件+小件）
  } else if (lv === 2) {
    capacity = 5;
    items = [
      { id: 0, name: '🍄', w: 3, v: 30 },  // 大蘑菇（贪心陷阱：先拿它）
      { id: 1, name: '🌰', w: 2, v: 20 },  // 中栗子
      { id: 2, name: '🍒', w: 2, v: 20 },  // 中樱桃
      { id: 3, name: '🌰', w: 1, v: 5 },   // 小栗子
    ];   // 最优：🌰+🍒 = 40 > 大蘑菇 30（贪心按价值先拿 🍄30 → 剩 2 格装小栗子 → 35）
  } else {
    capacity = 7;
    items = [
      { id: 0, name: '🍄', w: 4, v: 45 },  // 大蘑菇
      { id: 1, name: '🌰', w: 3, v: 30 },  // 栗子
      { id: 2, name: '🍒', w: 2, v: 22 },  // 樱桃
      { id: 3, name: '🍓', w: 2, v: 20 },  // 草莓
      { id: 4, name: '🫐', w: 1, v: 12 },  // 蓝莓
      { id: 5, name: '🍑', w: 3, v: 18 },  // 桃子（诱饵：重但价值密度低）
    ];   // 最优：45+22+12 = 79? 4+2+1=7 ✓；或 30+22+20+12=84? 3+2+2+1=8 > 7 ✗；
         // 30+22+12+... 3+2+1=6 剩1 → +12 已加 → 64；45+20+12=77；最优由 DP 算
  }

  // ---------- 背包状态 ----------
  let chosen = new Set();
  let finished = false;

  function currentW() {
    let w = 0;
    chosen.forEach(id => { w += items.find(i => i.id === id).w; });
    return w;
  }

  function currentV() {
    let v = 0;
    chosen.forEach(id => { v += items.find(i => i.id === id).v; });
    return v;
  }

  // ---------- DP 最优（0/1 背包） ----------
  function dpOptimal() {
    const n = items.length;
    const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));
    for (let i = 1; i <= n; i++) {
      const { w, v } = items[i - 1];
      for (let c = 1; c <= capacity; c++) {
        if (w > c) dp[i][c] = dp[i - 1][c];
        else dp[i][c] = Math.max(dp[i - 1][c], dp[i - 1][c - w] + v);
      }
    }
    // 回溯
    const set = [];
    let c = capacity;
    for (let i = n; i > 0; i--) {
      if (dp[i][c] !== dp[i - 1][c]) {
        set.push(items[i - 1].id);
        c -= items[i - 1].w;
      }
    }
    return { v: dp[n][capacity], set, table: dp };
  }

  // ---------- 贪心模拟（价值密度，对比用） ----------
  function greedySim() {
    const order = items.slice().sort((a, b) => b.v / b.w - a.v / a.w);
    let w = 0, v = 0;
    const set = [];
    order.forEach(it => {
      if (w + it.w <= capacity) { w += it.w; v += it.v; set.push(it.id); }
    });
    return { v, set };
  }

  // ---------- 接口 ----------
  function toggleItem(id) {
    if (finished) return false;
    if (chosen.has(id)) {
      chosen.delete(id);
      return true;
    }
    const it = items.find(i => i.id === id);
    if (currentW() + it.w > capacity) return false;   // 超重
    chosen.add(id);
    return true;
  }

  function finish() { finished = true; return true; }

  function isIn(id) { return chosen.has(id); }

  function starsFor(v) {
    const opt = dpOptimal().v;
    if (v === opt) return 3;
    if (v >= Math.floor(opt * 0.9)) return 2;
    return 1;
  }

  function getStats() {
    const opt = dpOptimal();
    const greedy = greedySim();
    return {
      level: lv, capacity,
      totalW: currentW(), totalV: currentV(),
      optimalV: opt.v, optimalSet: opt.set, dpTable: opt.table,
      greedyV: greedy.v, greedySet: greedy.set,
      stars: starsFor(currentV()),
    };
  }

  function reset() {
    chosen = new Set();
    finished = false;
  }

  return {
    level: lv, capacity, items,
    get currentW() { return currentW(); },
    get currentV() { return currentV(); },
    get toggledCount() { return chosen.size; },
    get isFinished() { return finished; },
    toggleItem, finish, isIn, starsFor, getStats, reset,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createAcornGame };
}
