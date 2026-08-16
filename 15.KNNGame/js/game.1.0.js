// 《猜猜它是谁》核心逻辑（纯逻辑，Node 可测）
// KNN 游戏化：特征图上选 K 个最近邻居 → 投票猜族；噪声陷阱 + K 可调

function createKnnGame(level) {
  const lv = level || 1;

  // ---------- 三关手工数据（坐标：x=大小 0-100, y=毛茸茸 0-100） ----------
  // 族：0=🐰蹦蹦族(小+毛茸茸) 1=🐢慢慢族(大+光溜溜) 2=🦊跑跑族(大+毛茸茸)
  const classes = lv === 3 ? ['🐰', '🐢', '🦊'] : ['🐰', '🐢'];
  let animals = [], target = { x: 0, y: 0 };

  if (lv === 1) {
    // 兔族 4 只（小+毛），龟族 4 只（大+光），目标深在兔族
    animals = [
      { id: 0, x: 15, y: 80, cls: 0 },
      { id: 1, x: 22, y: 72, cls: 0 },
      { id: 2, x: 12, y: 65, cls: 0 },
      { id: 3, x: 28, y: 85, cls: 0 },
      { id: 4, x: 80, y: 15, cls: 1 },
      { id: 5, x: 88, y: 22, cls: 1 },
      { id: 6, x: 75, y: 28, cls: 1 },
      { id: 7, x: 92, y: 12, cls: 1 },
    ];
    target = { x: 25, y: 78 };   // 最近 3 个全是兔族
  } else if (lv === 2) {
    // 兔族 4 只 + 龟族 4 只 + 1 只噪声龟离目标最近！
    animals = [
      { id: 0, x: 15, y: 80, cls: 0 },
      { id: 1, x: 22, y: 72, cls: 0 },
      { id: 2, x: 12, y: 65, cls: 0 },
      { id: 3, x: 28, y: 85, cls: 0 },
      { id: 4, x: 80, y: 15, cls: 1 },
      { id: 5, x: 88, y: 22, cls: 1 },
      { id: 6, x: 75, y: 28, cls: 1 },
      { id: 7, x: 92, y: 12, cls: 1 },
      { id: 8, x: 30, y: 70, cls: 1 },   // 噪声龟：离目标(32,72)最近！
    ];
    target = { x: 32, y: 72 };
    // 验证：距离噪声 8 ≈ sqrt(4+4)=2.8；兔族最近 id1(22,72) ≈ 10 → K=1=龟，K=3=兔×2+龟 → 兔
  } else {
    // 3 族：兔 4 + 龟 4 + 狐 4（大+毛）；目标在兔族旁 + 噪声龟很近
    animals = [
      { id: 0, x: 15, y: 80, cls: 0 },
      { id: 1, x: 22, y: 72, cls: 0 },
      { id: 2, x: 12, y: 65, cls: 0 },
      { id: 3, x: 28, y: 85, cls: 0 },
      { id: 4, x: 80, y: 15, cls: 1 },
      { id: 5, x: 88, y: 22, cls: 1 },
      { id: 6, x: 75, y: 28, cls: 1 },
      { id: 7, x: 92, y: 12, cls: 1 },
      { id: 8, x: 70, y: 82, cls: 2 },
      { id: 9, x: 78, y: 75, cls: 2 },
      { id: 10, x: 85, y: 88, cls: 2 },
      { id: 11, x: 33, y: 70, cls: 1 },  // 噪声龟：离目标(35,74)很近
    ];
    target = { x: 35, y: 74 };
  }
  const trueClass = 0;   // 目标真相 = 兔族（所有关）

  // ---------- 状态 ----------
  let k = 3;
  let neighbors = new Set();
  let voted = false;
  let voteCorrect = false;
  let neighborsOk = false;

  function dist(ax, ay) {
    return Math.hypot(ax - target.x, ay - target.y);
  }

  function distanceTo(pt) {
    return (id) => {
      const a = animals.find(x => x.id === id);
      return Math.hypot(a.x - pt.x, a.y - pt.y);
    };
  }

  function trueNearest(kk) {
    return animals.slice().sort((a, b) => dist(a.x, a.y) - dist(b.x, b.y))
      .slice(0, kk).map(a => a.id);
  }

  function voteResultFor(kk) {
    const ids = trueNearest(kk);
    const votes = {};
    ids.forEach(id => {
      const c = animals.find(a => a.id === id).cls;
      votes[c] = (votes[c] || 0) + 1;
    });
    let best = null, bestN = -1;
    Object.keys(votes).forEach(c => {
      if (votes[c] > bestN) { bestN = votes[c]; best = Number(c); }
    });
    return best;
  }

  function toggleNeighbor(id) {
    if (voted) return false;
    if (neighbors.has(id)) {
      neighbors.delete(id);
      return true;
    }
    if (neighbors.size >= k) return false;
    neighbors.add(id);
    return true;
  }

  function setK(kk) {
    if (voted) return false;
    if (kk !== 1 && kk !== 3 && kk !== 5) return false;
    k = kk;
    // 超出新 K 的多余选择移除
    while (neighbors.size > k) {
      const first = neighbors.values().next().value;
      neighbors.delete(first);
    }
    return true;
  }

  function vote(cls) {
    if (voted) return false;
    voted = true;
    // 邻居是否 = 真最近 K 集合
    const trueSet = new Set(trueNearest(k));
    const mySet = new Set(neighbors);
    neighborsOk = mySet.size === trueSet.size &&
      [...mySet].every(id => trueSet.has(id));
    voteCorrect = cls === trueClass;
    return voteCorrect;
  }

  function starsFor(nbOk, vOk) {
    if (nbOk && vOk) return 3;
    if (nbOk || vOk) return 2;
    return 1;
  }

  function getStats() {
    return {
      level: lv, k,
      neighborCount: neighbors.size,
      neighborsOk, voteCorrect,
      trueClass,
      voteResult: voteResultFor(k),
      trueNearestIds: trueNearest(k),
      stars: starsFor(neighborsOk, voteCorrect),
    };
  }

  function reset() {
    neighbors = new Set();
    voted = false;
    voteCorrect = false;
    neighborsOk = false;
  }

  return {
    level: lv, animals, classes, target,
    get k() { return k; },
    get neighborCount() { return neighbors.size; },
    get neighbors() { return [...neighbors]; },
    get voted() { return voted; },
    get voteCorrect() { return voteCorrect; },
    get trueClass() { return trueClass; },
    distanceTo, trueNearest, voteResultFor,
    toggleNeighbor, setK, vote, starsFor, getStats, reset,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createKnnGame };
}
