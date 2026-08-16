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
const TOOL_FACES = ['🔧', '🔨', '🪛', '📏', '🔩', '🪚', '🧰', '🔦', '🪓', '🛠️'];

function createLockerGame(mode) {
  const baby = mode === 'baby';
  const team = mode === 'team';
  const count = baby ? 4 + Math.floor(Math.random() * 2)
    : 8 + Math.floor(Math.random() * 3);

  // 生成物品与格子号
  let items;
  if (baby) {
    // 无冲突：5 柜各一件（查号码表开柜）
    const lockers = shuffle([...Array(count)].map((_, i) => i + 1));
    items = lockers.map((locker, i) => ({
      id: i, name: ITEM_FACES[i % ITEM_FACES.length], locker, realId: locker,
    }));
  } else if (team) {
    // 工程队：工具贴大编号，格子号 = 编号 % 100（取后两位）
    // 2 对冲突：同后两位的编号（如 37 与 137）
    const c1 = 10 + Math.floor(Math.random() * 80);   // 冲突对 1 的尾数
    let c2 = 10 + Math.floor(Math.random() * 80);
    while (Math.abs(c2 - c1) < 5) c2 = 10 + Math.floor(Math.random() * 80);
    const pairs = [
      { base: c1, extra: 100 + c1 },
      { base: c2, extra: 100 + c2 },
    ];
    const realIds = [];
    pairs.forEach(pair => realIds.push(pair.base, pair.extra));
    // 其余独立工具：编号 1-99（不与冲突尾数重复）
    const usedTails = [c1, c2];
    while (realIds.length < count) {
      let n = 1 + Math.floor(Math.random() * 99);
      if (!usedTails.includes(n % 100) && !realIds.includes(n)) {
        realIds.push(n);
      }
    }
    realIds.sort(() => Math.random() - 0.5);
    items = realIds.map((realId, i) => ({
      id: i, name: TOOL_FACES[i % TOOL_FACES.length], locker: realId % 100, realId,
    }));
  } else {
    // 挑战：10 柜 2 对冲突（链柜体验）
    const collisionL1 = 1 + Math.floor(Math.random() * 5);
    let collisionL2 = 1 + Math.floor(Math.random() * 5);
    while (collisionL2 === collisionL1) collisionL2 = 1 + Math.floor(Math.random() * 5);
    const assigned = [];
    const lockers = [collisionL1, collisionL1, collisionL2, collisionL2];
    for (let i = 4; i < count; i++) {
      let l = 1 + Math.floor(Math.random() * 10);
      while (l === collisionL1 || l === collisionL2 || assigned.includes(l)) {
        l = 1 + Math.floor(Math.random() * 10);
      }
      assigned.push(l);
      lockers.push(l);
    }
    items = shuffle(lockers).map((locker, i) => ({
      id: i, name: ITEM_FACES[i % ITEM_FACES.length], locker, realId: locker,
    }));
  }

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

  function hashOptions(realId) {
    // 工程队：给出"格子号"3 个选项（正确 = realId % 100）
    const correct = realId % 100;
    const opts = [correct];
    // 干扰项：原编号（陷阱！）、尾数±1
    const traps = [realId, correct + 1, correct - 1, correct + 10, correct - 10]
      .filter(v => v >= 1 && v <= 99 && !opts.includes(v));
    while (opts.length < 3 && traps.length) {
      opts.push(traps.splice(Math.floor(Math.random() * traps.length), 1)[0]);
    }
    shuffle(opts);
    return { correct, options: opts };
  }

  function submitHash(chosenLocker) {
    // 工程队：先验证"算出来的格子号"，对了才开格
    const target = currentTarget();
    if (!target) return false;
    if (chosenLocker !== target.locker) {
      mistakes++;
      return false;
    }
    return openLocker(chosenLocker);   // 开格（可能 found 或 collision）
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
    openLocker, confirmTarget, hashOptions, submitHash, starsFor, getStats, reset,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createLockerGame };
}
