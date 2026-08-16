// 《猜猜小动物在哪里》核心逻辑（纯逻辑，零 DOM 依赖，Node 可测）
// 二分查找的游戏化封装：闭合区间 [lo, hi]，每次猜测砍掉一半

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const MODES = {
  baby: { min: 1, max: 10 },
  challenge: { min: 1, max: 100 },
};

function createGame(mode, forcedTarget) {
  const { min, max } = MODES[mode] || MODES.baby;
  let target = forcedTarget !== undefined ? forcedTarget : randomInt(min, max);
  let guessCount = 0;
  let lo = min;
  let hi = max;

  function guess(n) {
    guessCount++;
    let result;
    if (n === target) {
      result = 'hit';
      lo = hi = n;                      // 命中：区间收敛（UI 高亮最终效果）
    } else if (n < target) {
      result = 'low';
      lo = Math.max(lo, n + 1);         // 排除左边：收缩下界
    } else {
      result = 'high';
      hi = Math.min(hi, n - 1);         // 排除右边：收缩上界
    }
    return { result, guessCount, range: { lo, hi }, done: result === 'hit' };
  }

  function getRange() {
    return { lo, hi };
  }

  function reset() {
    target = forcedTarget !== undefined ? forcedTarget : randomInt(min, max);
    guessCount = 0;
    lo = min;
    hi = max;
  }

  return {
    min, max,
    get target() { return target; },
    get guessCount() { return guessCount; },
    guess, getRange, reset,
  };
}

// 支持 CommonJS（Node 测试）与浏览器 script 加载
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createGame };
}
