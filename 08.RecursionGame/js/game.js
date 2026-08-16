// 《套娃拆拆乐》v2 核心逻辑（纯逻辑，Node 可测）
// 递归的游戏化封装：
//   拆（递归下降/压栈）→ 空盒（基线，返回 0）
//   → 回溯（返回值一层层往外传）：f(盒) = 里面传来的结果 + 盒子上的数

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const MODES = {
  baby: { min: 5, max: 7 },
  challenge: { min: 6, max: 8 },
};

function createNestGame(mode) {
  const cfg = MODES[mode] || MODES.baby;
  const total = cfg.min + Math.floor(Math.random() * (cfg.max - cfg.min + 1));
  // 宝宝：每层 +1（数盒子）；挑战：每层随机 +2~+9（加法追踪）
  const addends = mode === 'baby'
    ? [...Array(total)].fill(1)
    : [...Array(total)].map(() => 2 + Math.floor(Math.random() * 8));

  let openedCount = 0;
  let baseReached = false;
  let mistakes = 0;
  let done = false;
  let traceIdx = 0;          // 回溯已推进的层数（从最里往外）

  // 预计算回溯步骤：从最里层开始，running = 内层结果 + 本层加数
  const traceSteps = [];
  {
    let running = 0;                          // 空盒返回 0（基线！）
    for (let i = total - 1; i >= 0; i--) {    // 从内到外
      const myValue = addends[i];
      const innerResult = running;
      running += myValue;
      traceSteps.push({ myValue, innerResult, result: running });
    }
  }

  function openNext() {
    if (baseReached) return { isBase: true };
    if (openedCount < total) {
      openedCount++;
      return { isBase: false, layer: openedCount, myValue: addends[openedCount - 1] };
    }
    baseReached = true;
    return { isBase: true };
  }

  function getCurrentStep() {
    // 当前回溯步骤 + 3 个选项（含正确答案）
    if (traceIdx >= traceSteps.length) return null;
    const s = traceSteps[traceIdx];
    const opts = [s.result, s.result + 1, s.result - 1];
    shuffle(opts);
    return { myValue: s.myValue, innerResult: s.innerResult, correct: s.result, options: opts };
  }

  function submitTrace(choice) {
    // 挑战模式：选择"里面传来的数 + 我的数"的正确结果
    if (done || traceIdx >= traceSteps.length) return false;
    const s = traceSteps[traceIdx];
    if (choice === s.result) {
      traceIdx++;
      if (traceIdx === traceSteps.length) done = true;
      return true;
    }
    mistakes++;
    return false;
  }

  function answer(n) {
    // 宝宝模式：答"一共几个盒子"
    if (done) return false;
    if (n === total) { done = true; return true; }
    mistakes++;
    return false;
  }

  function starsFor(errs) {
    if (errs === 0) return 3;
    if (errs <= 2) return 2;
    return 1;
  }

  function getStats() {
    return { layers: total, mistakes, stars: starsFor(mistakes), finalResult: traceSteps[traceSteps.length - 1].result };
  }

  function reset() {
    openedCount = 0;
    baseReached = false;
    mistakes = 0;
    done = false;
    traceIdx = 0;
  }

  return {
    mode, layers: total, addends,
    get openedCount() { return openedCount; },
    get isBaseReached() { return baseReached; },
    get isDone() { return done; },
    get mistakes() { return mistakes; },
    openNext, getCurrentStep, submitTrace, answer, starsFor, getStats, reset,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createNestGame };
}
