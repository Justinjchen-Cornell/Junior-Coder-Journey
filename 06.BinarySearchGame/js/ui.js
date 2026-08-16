// 《猜猜小动物在哪里》UI 层（DOM 渲染 + 交互 + 音效）
(function () {
  'use strict';

  const ANIMALS = ['🐰', '🐻', '🦊', '🐱', '🐸'];
  const state = { mode: 'baby', animal: '🐰', game: null };

  // ---------- 音效（Web Audio 合成，零外部资源） ----------
  let audioCtx = null;
  function playSound(type) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx;
      const notes = {
        wrong: [[220, 0.12, 'sine']],
        correct: [[523, 0.12, 'sine'], [659, 0.15, 'sine']],
        win: [[523, 0.1, 'sine'], [659, 0.1, 'sine'], [784, 0.1, 'sine'], [1047, 0.3, 'sine']],
      }[type] || [];
      notes.forEach(([freq, dur, wave]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = wave; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + dur);
      });
    } catch (e) { /* 音效失败不影响游戏 */ }
  }

  // ---------- 开场：选动物 + 模式 ----------
  function initUI() {
    const picker = document.getElementById('animal-picker');
    picker.innerHTML = ANIMALS.map(a =>
      `<button data-animal="${a}" aria-label="选 ${a}">${a}</button>`).join('');
    picker.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => selectAnimal(btn));
    });
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => startGame(state.animal, btn.dataset.mode));
    });
    document.getElementById('btn-reset').addEventListener('click', () => resetGame());
    document.getElementById('btn-home').addEventListener('click', () => goHome());
  }

  function selectAnimal(btn) {
    // 只选中动物（高亮），等爸爸/小宥宥再选模式
    state.animal = btn.dataset.animal;
    document.querySelectorAll('.animal-picker button').forEach(b => {
      b.style.borderColor = b === btn ? '#ff7043' : '';
    });
  }

  function startGame(animal, mode) {
    state.animal = animal || '🐰';
    state.mode = mode || 'baby';
    state.game = createGame(state.mode);
    document.getElementById('animal-face').textContent = state.animal;
    showScreen('screen-game');
    renderBoard();
    updateHeader('小宥宥，猜猜我躲在哪？', '');
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function goHome() { showScreen('screen-animal'); }

  // ---------- 数字板 ----------
  function renderBoard() {
    const board = document.getElementById('board');
    const { min, max } = state.game;
    const cells = [];
    for (let n = min; n <= max; n++) {
      cells.push(`<button class="cell" data-n="${n}">${n}</button>`);
    }
    board.className = 'board' + (state.mode === 'challenge' ? ' challenge' : '');
    board.innerHTML = cells.join('');
    board.querySelectorAll('.cell').forEach(cell => {
      cell.addEventListener('click', () => onGuess(Number(cell.dataset.n)));
    });
  }

  function onGuess(n) {
    if (state.game.done) return;
    const r = state.game.guess(n);
    renderRange(r);
    updateFeedback(r);
    updateSteps(r.guessCount);
    if (r.done) { onWin(r.guessCount); }
  }

  // 区间高亮：区间内发光，区间外变暗（二分可视化）
  function renderRange(r) {
    document.querySelectorAll('.cell').forEach(cell => {
      const n = Number(cell.dataset.n);
      cell.classList.remove('in-range', 'hit', 'excluded');
      if (n < r.range.lo || n > r.range.hi) cell.classList.add('excluded');
      else if (r.result === 'hit' && n === r.range.lo) cell.classList.add('hit');
      else cell.classList.add('in-range');
    });
  }

  // ---------- 反馈 ----------
  const MSG = {
    low: '不是这个……它在更高一点的树洞哦！',
    high: '不是这个……它在更低一点的树洞哦！',
    hit: '找到啦！我在这里！',
  };
  function updateFeedback(r) {
    const el = document.getElementById('feedback');
    el.className = 'feedback ' + r.result;
    el.textContent = MSG[r.result];
    playSound(r.result === 'hit' ? 'correct' : 'wrong');
  }

  function updateSteps(n) {
    document.getElementById('steps').textContent =
      state.mode === 'challenge' ? `第 ${n} 次尝试` : `猜了 ${n} 次`;
  }

  function onWin(steps) {
    document.getElementById('stars').textContent = '⭐'.repeat(starsFor(steps));
    document.getElementById('hint').textContent =
      state.mode === 'challenge'
        ? (steps <= 7 ? '🎉 太棒了！二分法最快 7 次，你做到了！' : '找到啦！试试每次都猜中间，可以更快哦！')
        : '🎉 找到小动物啦！';
    document.getElementById('animal-face').classList.add('celebrate');
    setTimeout(() => document.getElementById('animal-face').classList.remove('celebrate'), 700);
    playSound('win');
  }

  function starsFor(steps) {
    if (state.mode === 'baby') return 3;
    if (steps <= 7) return 3;
    if (steps <= 10) return 2;
    return 1;
  }

  function resetGame() {
    state.game.reset();
    renderBoard();
    updateHeader('小宥宥，猜猜我躲在哪？', '');
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
  }

  function updateHeader(hint, stars) {
    document.getElementById('hint').textContent = hint;
    document.getElementById('stars').textContent = stars;
    document.getElementById('steps').textContent = '';
  }

  document.addEventListener('DOMContentLoaded', initUI);
})();
