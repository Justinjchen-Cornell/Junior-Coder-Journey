// 《书架整理员》核心逻辑（纯逻辑，Node 可测）
// 快排（分而治之）的游戏化封装：
//   抽标杆（pivot）→ 分两堆（small/big）→ 子堆自动再分 → 每本书落位 value-1 槽

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const MODES = {
  baby: { min: 5, max: 7 },
  challenge: { min: 8, max: 12 },
};

function createSortGame(mode) {
  const cfg = MODES[mode] || MODES.baby;
  const n = cfg.min + Math.floor(Math.random() * (cfg.max - cfg.min + 1));
  let books = shuffle([...Array(n)].map((_, i) => ({ id: i, value: i + 1 })));

  let stacks = [books.map(b => b.id)];  // 待分堆队列（栈式，左堆优先）
  let pivotId = null;
  let left = [];            // 当前堆的小书
  let right = [];           // 当前堆的大书
  let pending = [];         // 当前堆待分类的书（一本本弹出）
  let rounds = 0;           // 抽标杆次数
  let compares = 0;         // 分类次数
  let mistakes = 0;
  let done = false;
  let placed = new Map();   // id -> 槽位（value-1）

  function currentStackTop() {
    return stacks.length ? stacks[stacks.length - 1] : [];
  }

  function pickPivot(id) {
    if (done || pivotId !== null) return false;
    const stack = currentStackTop();
    if (!stack.includes(id)) return false;
    pivotId = id;
    rounds++;
    pending = shuffle(stack.filter(x => x !== id));
    left = [];
    right = [];
    return true;
  }

  function classify(side) {
    if (done || pivotId === null || pending.length === 0) return { ok: false };
    const bookId = pending[0];
    const book = books.find(b => b.id === bookId);
    const pivot = books.find(b => b.id === pivotId);
    const correct = book.value < pivot.value ? 'small' : 'big';
    if (side !== correct) {
      mistakes++;
      return { ok: false, correctSide: correct, bookId };
    }
    compares++;
    (correct === 'small' ? left : right).push(bookId);
    pending.shift();
    if (pending.length === 0) finishStack();
    return true;
  }

  function finishStack() {
    // 当前堆分完：弹出已处理堆，标杆落位，子堆入队（右先进，左先出）
    stacks.pop();
    placed.set(pivotId, books.find(b => b.id === pivotId).value - 1);
    pivotId = null;
    if (right.length > 1) stacks.push(right);
    else if (right.length === 1) placed.set(right[0], books.find(b => b.id === right[0]).value - 1);
    if (left.length > 1) stacks.push(left);
    else if (left.length === 1) placed.set(left[0], books.find(b => b.id === left[0]).value - 1);
    // 弹出下一个待分堆（跳过已完成的）
    while (stacks.length && (stacks[stacks.length - 1].length <= 1)) {
      const s = stacks.pop();
      if (s.length === 1) placed.set(s[0], books.find(b => b.id === s[0]).value - 1);
    }
    if (stacks.length === 0 && pivotId === null) done = true;
  }

  function getSlot(id) { return placed.get(id); }

  function starsFor(errs) {
    if (errs === 0) return 3;
    if (errs <= 2) return 2;
    return 1;
  }

  function getStats() {
    return {
      rounds, compares, mistakes,
      stars: starsFor(mistakes),
      placed,
      theoreticalRounds: Math.ceil(Math.log2(n)),
      totalBooks: n,
    };
  }

  function reset() {
    books = shuffle([...Array(n)].map((_, i) => ({ id: i, value: i + 1 })));
    stacks = [books.map(b => b.id)];
    pivotId = null; left = []; right = []; pending = [];
    rounds = 0; compares = 0; mistakes = 0; done = false;
    placed = new Map();
  }

  return {
    mode, books,
    get isDone() { return done; },
    get pivotId() { return pivotId; },
    get pendingBook() { return pending.length ? pending[0] : null; },
    get rounds() { return rounds; },
    get compares() { return compares; },
    get mistakes() { return mistakes; },
    get currentStackTop() { return currentStackTop(); },
    pickPivot, classify, getSlot, starsFor, getStats, reset,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createSortGame };
}
