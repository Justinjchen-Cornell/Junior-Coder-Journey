// 《小动物储物柜》核心逻辑（纯逻辑，Node 可测）
// 哈希表游戏化：号码表 = 哈希函数；开柜 O(1)；冲突 = 链式寻址

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ITEM_FACES = ['🧢', '🧦', '🧤', '🥕', '🍎', '🎈', '🚗', '🐚', '🍪', '🎨'];

function createLockerGame(mode) {
  const baby = mode !== 'challenge';
  const count = baby ? 4 + Math.floor(Math.random() * 2) : 8 + Math.floor(Math.random() * 3);
  const lockerMax = baby ? 5 : 10;

  // 生成物品与柜号
  let lockers = [];
  if (baby) {
    // 无冲突：随机分配不同柜号
    lockers = shuffle([...Array(count)].map((_, i) => i + 1));
  } else {
    // 挑战：2 对冲突 + 其余独立
    const ids = [];
    for (let i = 0; i < count; i++) ids.push(i + 1);
    // 冲突柜号：随机挑 2 个不同柜号，各挂 2 件
    const collisionL1 = 1 + Math.floor(Math.random() * 5);
    let collisionL2 = 1 + Math.floor(Math.random() * 5);
    while (collisionL2 === collisionL1) collisionL2 = 1 + Math.floor(Math.random() * 5);
    const assigned = [];
    // 先安排冲突对
    lockers = [collisionL1, collisionL1, collisionL2, collisionL2];
    for (let i = 4; i < count; i++) {
      let l = 1 + Math.floor(Math.random() * lockerMax);
      while (l === collisionL1 || l === collisionL2 || assigned.includes(l)) {
        l = 1 + Math.floor(Math.random() * lockerMax);
      }
      assigned.push(l);
      lockers.push(l);
    }
    lockers = shuffle(lockers);
  }

  const items = lockers.map((locker, i) => ({
    id: i, name: ITEM_FACES[i % ITEM_FACES.length], locker,
  }));

  let queue = shuffle(items.map(i => i.id));   // 取物顺序
  let queueIdx = 0;
  let mistakes = 0;
  let collisionFinds = 0;
  let openCount = 0;             // 总开柜次数
  let found = 0;
  let collisionOpen = null;      // 当前打开的链柜（items）

  function currentTarget() {
    return queueIdx < queue.length ? items.find(i => i.id === queue[queueIdx]) : null;
  }

  function openLocker(n) {
    if (done() || collisionOpen) return { ok: false };
    const target = currentTarget();
    if (!target) return { ok: false };
    openCount++;
    const lockerItems = items.filter(i => i.locker === n);
    if (target.locker === n) {
      if (lockerItems.length === 1) {
        found++;
        queueIdx++;
        return { ok: true, found: true };
      }
      // 冲突柜：先看到链，确认目标
      collisionOpen = lockerItems;
      return { ok: true, found: false, collision: true, items: lockerItems };
    }
    mistakes++;
    return { ok: false };
  }

  function confirmTarget(id) {
    if (!collisionOpen) return false;
    const target = currentTarget();
    if (id === target.id) {
      collisionFinds++;
      found++;
      queueIdx++;
      collisionOpen = null;
      return true;
    }
    mistakes++;
    return false;
  }

  const done = () => queueIdx >= queue.length;

  function starsFor(errs) {
    if (errs === 0) return 3;
    if (errs <= 2) return 2;
    return 1;
  }

  function getStats() {
    return { total: items.length, found, mistakes, collisionFinds, openCount, stars: starsFor(mistakes) };
  }

  function reset() {
    queue = shuffle(items.map(i => i.id));
    queueIdx = 0;
    mistakes = 0;
    collisionFinds = 0;
    openCount = 0;
    found = 0;
    collisionOpen = null;
  }

  return {
    mode, items,
    get currentTarget() { return currentTarget(); },
    get isDone() { return done(); },
    get mistakes() { return mistakes; },
    get collisionFinds() { return collisionFinds; },
    openLocker, confirmTarget, starsFor, getStats, reset,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createLockerGame };
}
