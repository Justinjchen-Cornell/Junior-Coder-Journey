// 《套娃拆拆乐》核心逻辑（纯逻辑，零 DOM，Node 可测）
// 递归的游戏化封装：拆（递归下降/压栈）+ 数回来（回溯/弹栈）+ 空娃娃（基线）

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const MODES = {
  baby: { min: 5, max: 7 },
  challenge: { min: 8, max: 10 },
};

function createNestGame(mode) {
  const cfg = MODES[mode] || MODES.baby;
  const total = cfg.min + Math.floor(Math.random() * (cfg.max - cfg.min + 1));
  // layerValues：外层→内层的值（宝宝=1..n 顺序；挑战=乱序）
  const layerValues = mode === 'baby'
    ? [...Array(total)].map((_, i) => i + 1)
    : shuffle([...Array(total)].map((_, i) => i + 1));

  let stack = [];        // 已拆开看到的层（压栈顺序 = 外层→内层）
  let openedCount = 0;
  let baseReached = false;
  let mistakes = 0;
  let done = false;
  let submittedCount = 0;

  function openNext() {
    if (baseReached) return { isBase: true };
    if (openedCount < total) {
      const value = layerValues[openedCount];
      stack.push(value);            // 压栈：记住这一层
      openedCount++;
      return { isBase: false, value, layer: openedCount };
    }
    baseReached = true;             // 拆完所有层 → 空娃娃（基线）
    return { isBase: true, base: true };
  }

  function answer(n) {
    // 宝宝模式：答"一共几层"
    if (done) return false;
    if (n === total) { done = true; return true; }
    mistakes++;
    return false;
  }

  function submitNext(v) {
    // 挑战模式：回溯按"从里到外"（栈弹出顺序 = 最后压入的先交）
    if (done) return false;
    const expect = stack[stack.length - 1 - submittedCount];
    if (v === expect) {
      submittedCount++;
      if (submittedCount === total) done = true;
      return true;
    }
    mistakes++;
    return false;
  }

  function starsFor(errs) {
    if (errs === 0) return 3;
    if (errs <= 2) return 2;
    return 1;
  }

  function getStats() {
    return { layers: total, mistakes, stars: starsFor(mistakes) };
  }

  function reset() {
    stack = [];
    openedCount = 0;
    baseReached = false;
    mistakes = 0;
    done = false;
    submittedCount = 0;
  }

  return {
    mode, layers: total, layerValues,
    get openedCount() { return openedCount; },
    get isBaseReached() { return baseReached; },
    get isDone() { return done; },
    get mistakes() { return mistakes; },
    openNext, answer, submitNext, starsFor, getStats, reset,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createNestGame };
}
