// 《排队买冰淇淋》核心逻辑（纯逻辑，零 DOM，Node 可测）
// 选择排序的游戏化封装：每轮找最小 → 进队伍 → 扫描计数（👀 = n(n+1)/2）

function shuffle(arr) {
  // Fisher-Yates 洗牌
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const MODES = {
  baby: { minCards: 5, maxCards: 8 },
  challenge: { minCards: 8, maxCards: 12 },
};

function createQueueGame(mode) {
  const cfg = MODES[mode] || MODES.baby;
  const n = cfg.minCards + Math.floor(Math.random() * (cfg.maxCards - cfg.minCards + 1));
  let cards = shuffle([...Array(n)].map((_, i) => ({ id: i, value: i + 1 })));
  let sortedIds = [];       // 已进队伍的 id（顺序 = 排序结果）
  let mistakes = 0;
  let flipCount = 0;        // 挑战模式翻牌次数
  let scans = 0;            // 宝宝模式 👀 计数（每轮 = 剩余张数）

  const sortedSet = () => new Set(sortedIds);
  const remaining = () => cards.filter(c => !sortedSet().has(c.id));

  function currentMinId() {
    const rem = remaining();
    return rem.reduce((min, c) => c.value < min.value ? c : min).id;
  }

  function placeMin(id) {
    sortedIds.push(id);
  }

  function checkMin(id) {
    // 宝宝模式：点一张牌，判断是否当前最小
    if (isDone()) return { ok: false };
    const nRemain = remaining().length;
    scans += nRemain;                       // 本轮"扫过"剩余所有牌（👀）
    if (id === currentMinId()) {
      placeMin(id);
      return { ok: true };
    }
    mistakes++;
    return { ok: false };
  }

  function flip(id) {
    // 挑战模式：翻开一张牌（计数）
    flipCount++;
    return { id, value: cards.find(c => c.id === id).value };
  }

  function confirm(id) {
    // 挑战模式：确认"这张是最小"
    if (isDone()) return false;
    if (id === currentMinId()) {
      placeMin(id);
      return true;
    }
    mistakes++;
    return false;
  }

  function starsFor(input) {
    // 宝宝模式输入 = mistakes；挑战模式输入 = flips
    if (mode === 'baby') {
      if (input === 0) return 3;
      if (input <= 2) return 2;
      return 1;
    }
    const theo = n * (n + 1) / 2;
    if (input <= theo * 1.2) return 3;
    if (input <= theo * 1.5) return 2;
    return 1;
  }

  function getStats() {
    const theoretical = n * (n + 1) / 2;
    return {
      scans, flips: flipCount, mistakes,
      theoretical,
      stars: starsFor(mode === 'baby' ? mistakes : flipCount),
    };
  }

  function reset() {
    cards = shuffle([...Array(n)].map((_, i) => ({ id: i, value: i + 1 })));
    sortedIds = [];
    mistakes = 0;
    flipCount = 0;
    scans = 0;
  }

  const isDone = () => sortedIds.length === cards.length;

  return {
    mode, cards,
    get currentMinId() { return currentMinId(); },
    get sortedCount() { return sortedIds.length; },
    get mistakes() { return mistakes; },
    get flipCount() { return flipCount; },
    get isDone() { return isDone(); },
    checkMin, flip, confirm, getStats, starsFor, reset,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createQueueGame };
}
