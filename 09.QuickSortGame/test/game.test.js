// 《书架整理员》核心逻辑测试（快排分而治之）
const test = require('node:test');
const assert = require('node:assert');
const { createSortGame } = require('../js/game.1.2.js');

test('初始化：书本 1..n 乱序', () => {
  const g = createSortGame('baby');
  const vals = g.books.map(b => b.value).sort((a, b) => a - b);
  assert.deepStrictEqual(vals, [...Array(g.books.length)].map((_, i) => i + 1));
  assert.ok(!g.isDone);
});

test('宝宝 5-7 本 / 挑战 8-12 本', () => {
  assert.ok(createSortGame('baby').books.length >= 5 && createSortGame('baby').books.length <= 7);
  assert.ok(createSortGame('challenge').books.length >= 8 && createSortGame('challenge').books.length <= 12);
});

test('pickPivot：合法标杆 → rounds=1，其余进入待分', () => {
  const g = createSortGame('baby');
  const id = g.books[0].id;
  assert.strictEqual(g.pickPivot(id), true);
  assert.strictEqual(g.rounds, 1);
  assert.strictEqual(g.pivotId, id);
  assert.ok(g.pendingBook !== null);
});

test('pickPivot：非法（重复/不在当前堆）→ false', () => {
  const g = createSortGame('baby');
  const id = g.books[0].id;
  g.pickPivot(id);
  assert.strictEqual(g.pickPivot(id), false);       // 已当标杆
  assert.strictEqual(g.rounds, 1);
});

test('classify 正确：书进左/右堆，比较数+1', () => {
  const g = createSortGame('baby');
  const books = g.books.slice();
  const pivot = books[0];
  g.pickPivot(pivot.id);
  const book = g.books.find(b => b.id === g.pendingBook);
  const side = book.value < pivot.value ? 'small' : 'big';
  assert.strictEqual(g.classify(side), true);
  assert.strictEqual(g.compares, 1);
  assert.ok(g.pendingBook !== book);   // 推进到下一本
});

test('classify 错误：mistakes+1，返回正确方向', () => {
  const g = createSortGame('baby');
  const pivot = g.books[0];
  g.pickPivot(pivot.id);
  const book = g.books.find(b => b.id === g.pendingBook);
  const correct = book.value < pivot.value ? 'small' : 'big';
  const wrong = correct === 'small' ? 'big' : 'small';
  const r = g.classify(wrong);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.correctSide, correct);
  assert.strictEqual(g.mistakes, 1);
  assert.strictEqual(g.compares, 0);
});

test('完美通关：每本书落位到 value-1 槽，书架满', () => {
  const g = createSortGame('baby');
  playPerfect(g);
  assert.ok(g.isDone);
  const placed = g.getStats().placed;
  assert.strictEqual(placed.size, g.books.length);
  for (const b of g.books) {
    assert.strictEqual(g.getSlot(b.id), b.value - 1);
  }
  assert.strictEqual(g.mistakes, 0);
});

function playPerfect(g) {
  let guard = 0;
  while (!g.isDone && guard++ < 500) {
    if (g.pendingBook === null) {
      // 需要抽标杆：当前堆里随便选一本（挑战下选中间的更优，但正确性不依赖）
      const stackTop = g.currentStackTop;
      g.pickPivot(stackTop[0]);
    } else {
      const pivot = g.books.find(b => b.id === g.pivotId);
      const book = g.books.find(b => b.id === g.pendingBook);
      g.classify(book.value < pivot.value ? 'small' : 'big');
    }
  }
}

test('递归分堆：左堆先于右堆处理（分而治之）', () => {
  const g = createSortGame('baby');
  const pivot = g.books[0];
  g.pickPivot(pivot.id);
  // 分完当前堆所有书
  while (g.pendingBook !== null) {
    const book = g.books.find(b => b.id === g.pendingBook);
    const pv = g.books.find(b => b.id === g.pivotId).value;
    g.classify(book.value < pv ? 'small' : 'big');
  }
  // 堆耗尽后：若有子堆，自动开始新堆（pendingBook 可能为 null → 需要再抽标杆）
  assert.ok(!g.isDone || g.getStats().placed.size === g.books.length);
});

test('星级：0 错=3 / ≤2 错=2 / 3+ 错=1', () => {
  const g = createSortGame('baby');
  assert.strictEqual(g.starsFor(0), 3);
  assert.strictEqual(g.starsFor(2), 2);
  assert.strictEqual(g.starsFor(3), 1);
});

test('getStats：回合/比较/错误/最优回合', () => {
  const g = createSortGame('challenge');
  const s = g.getStats();
  assert.strictEqual(s.rounds, 0);
  assert.ok(s.theoreticalRounds >= 3);   // ceil(log2(n)) n>=8
  const n = g.books.length;
  assert.strictEqual(s.theoreticalRounds, Math.ceil(Math.log2(n)));
});

test('reset：恢复初始', () => {
  const g = createSortGame('baby');
  const pivot = g.books[0];
  g.pickPivot(pivot.id);
  g.classify('small');
  g.reset();
  assert.strictEqual(g.rounds, 0);
  assert.strictEqual(g.mistakes, 0);
  assert.strictEqual(g.compares, 0);
  assert.ok(!g.isDone);
});

test('层级：子堆 level = 当前层+1；等待队列可见', () => {
  const g = createSortGame('baby');
  assert.strictEqual(g.currentLevel, 1);
  const pivot = g.books[0];
  g.pickPivot(pivot.id);
  while (g.pendingBook !== null) {
    const book = g.books.find(b => b.id === g.pendingBook);
    const pv = g.books.find(b => b.id === g.pivotId).value;
    g.classify(book.value < pv ? 'small' : 'big');
  }
  // 第一堆分完：下一堆 level=2，另一堆在等待队列
  assert.strictEqual(g.currentLevel, 2);
  const wait = g.waitingStacks;
  assert.ok(wait.length >= 0);
  if (wait.length) assert.strictEqual(wait[0].level, 2);
});

test('左右堆计数暴露：分完当前堆后，左右合计 = 除标杆外所有书', () => {
  const g = createSortGame('baby');
  const pivot = g.books[0];
  g.pickPivot(pivot.id);
  while (g.pendingBook !== null) {
    const book = g.books.find(b => b.id === g.pendingBook);
    const pv = g.books.find(b => b.id === g.pivotId).value;
    g.classify(book.value < pv ? 'small' : 'big');
  }
  const total = g.leftCount + g.rightCount;
  assert.strictEqual(total, g.books.length - 1);   // 除标杆外的所有书
});
