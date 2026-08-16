// 《盖广播塔》核心逻辑（纯逻辑，Node 可测）
// 贪心（集合覆盖）游戏化：点塔盖村庄；陷阱关看贪心翻车；最优 = 暴力枚举

function createTowerGame(level) {
  const lv = level || 1;

  // ---------- 三关手工结构（保证教学） ----------
  let villages = [], towers = [];
  if (lv === 1) {
    // 贪心 = 最优 = 2：大塔互补覆盖，贪心直觉正确
    villages = [0, 1, 2, 3, 4];
    towers = [
      { id: 0, covers: [0, 1, 2] },   // 贪心先选它（3 村）
      { id: 1, covers: [2, 3, 4] },   // 再选它 → 全盖 → 2 座
      { id: 2, covers: [0, 1] },
      { id: 3, covers: [3, 4] },
    ];
  } else if (lv === 2) {
    // 经典反例（≥8 元素才存在）：大塔 G 盖 6 村骗贪心；最优 = 两座塔互补
    villages = [0, 1, 2, 3, 4, 5, 6, 7];
    towers = [
      { id: 0, covers: [0, 1, 2, 3, 4, 5] },   // 大塔 G（贪心先选它 → 被骗）
      { id: 1, covers: [0, 1, 2, 3, 4, 6] },   // 最优之一 O1（与 G 并列 6 村，但 id 在后）
      { id: 2, covers: [5, 7] },               // 最优之二 O2
      { id: 3, covers: [6] },                  // 单村塔（贪心后续会被逼着多盖）
      { id: 4, covers: [7] },                  // 单村塔
      { id: 5, covers: [1, 2] },               // 诱饵
    ];   // 贪心 3（G+O1+O2） vs 最优 2（O1+O2）
  } else {
    // 大陷阱（12 村 8 塔）：贪心被大塔骗 3 座，最优 2 座
    villages = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    towers = [
      { id: 0, covers: [0, 1, 2, 3, 4, 5, 6, 7, 8] },  // 大塔 G（9 村，贪心先选）
      { id: 1, covers: [0, 1, 2, 3, 4, 5, 6, 7, 9] },  // 最优之一 O1（并列 9 村，id 在后）
      { id: 2, covers: [8, 10, 11] },                  // 最优之二 O2
      { id: 3, covers: [9] },                          // 单村塔
      { id: 4, covers: [10] },                         // 单村塔
      { id: 5, covers: [11] },                         // 单村塔
      { id: 6, covers: [0, 1] },                       // 诱饵
      { id: 7, covers: [7, 8] },                       // 诱饵
    ];   // 贪心 3（G+O2+O1） vs 最优 2（O1+O2）
  }

  // ---------- 游戏状态 ----------
  let chosen = [];            // 已盖塔（顺序 = 盖的顺序）
  let covered = new Set();    // 已覆盖村庄
  let done = false;

  function recalc() {
    covered = new Set();
    chosen.forEach(id => {
      const t = towers.find(x => x.id === id);
      t.covers.forEach(v => covered.add(v));
    });
    done = covered.size === villages.length;
  }

  function chooseTower(id) {
    if (chosen.includes(id)) return false;
    chosen.push(id);
    recalc();
    return true;
  }

  function undo() {
    if (!chosen.length) return false;
    chosen.pop();
    recalc();
    return true;
  }

  // ---------- 贪心模拟（对比用） ----------
  function simulateGreedy() {
    const sel = [];
    const cov = new Set();
    while (cov.size < villages.length && sel.length <= towers.length) {
      let best = null, bestCnt = -1;
      towers.forEach(t => {
        if (sel.includes(t.id)) return;
        const cnt = t.covers.filter(v => !cov.has(v)).length;
        if (cnt > bestCnt) { bestCnt = cnt; best = t.id; }
      });
      if (best === null || bestCnt === 0) break;
      sel.push(best);
      towers.find(t => t.id === best).covers.forEach(v => cov.add(v));
    }
    return sel;
  }

  // ---------- 暴力最优（小规模枚举） ----------
  function bruteMin() {
    const n = towers.length;
    let best = n + 1;
    for (let mask = 1; mask < (1 << n); mask++) {
      const cov = new Set();
      let cnt = 0;
      for (let i = 0; i < n; i++) {
        if (mask >> i & 1) {
          cnt++;
          if (cnt >= best) break;
          towers[i].covers.forEach(v => cov.add(v));
        }
      }
      if (cnt < best && villages.every(v => cov.has(v))) best = cnt;
    }
    return best;
  }

  function starsFor(towerCount) {
    const opt = bruteMin();
    if (towerCount === opt) return 3;
    if (towerCount <= opt + 1) return 2;
    return 1;
  }

  function getStats() {
    const greedy = simulateGreedy();
    const opt = bruteMin();
    return {
      level: lv, villages: villages.length,
      towersUsed: chosen.length,
      optimalCount: opt,
      greedyCount: greedy.length,
      greedyTowers: greedy,
      optimalTowers: optimalTowerSet(),
      stars: starsFor(chosen.length),
      mistakes: chosen.length,   // 塔数本身 = 成绩
    };
  }

  function optimalTowerSet() {
    // 暴力找最优塔集合（结算金圈用）
    const n = towers.length;
    let bestMask = 0, bestCnt = n + 1;
    for (let mask = 1; mask < (1 << n); mask++) {
      const cov = new Set();
      let cnt = 0;
      for (let i = 0; i < n; i++) {
        if (mask >> i & 1) {
          cnt++;
          towers[i].covers.forEach(v => cov.add(v));
        }
      }
      if (cnt < bestCnt && villages.every(v => cov.has(v))) { bestCnt = cnt; bestMask = mask; }
    }
    const ids = [];
    for (let i = 0; i < n; i++) if (bestMask >> i & 1) ids.push(i);
    return ids;
  }

  function getHintTower() {
    // 提示：返回一座还没盖的"最优组合里的塔"（每关 1 次）
    const opt = optimalTowerSet();
    return opt.find(id => !chosen.includes(id)) ?? null;
  }

  function reset() {
    chosen = [];
    covered = new Set();
    done = false;
  }

  return {
    level: lv, villages, towers,
    get chosen() { return chosen.slice(); },
    get covered() { return new Set(covered); },
    get coveredCount() { return covered.size; },
    get towersUsed() { return chosen.length; },
    get isDone() { return done; },
    chooseTower, undo, simulateGreedy, getHintTower, starsFor, getStats, reset,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createTowerGame };
}
