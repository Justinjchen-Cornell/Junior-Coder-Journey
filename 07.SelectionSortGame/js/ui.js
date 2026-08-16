// 《排队买冰淇淋》UI 层（DOM + 扫描动画 + 音效 + 纪录）
(function () {
  'use strict';

  const ANIMALS = ['🐰', '🐻', '🦊', '🐱', '🐸'];
  const state = { mode: 'baby', animal: '🐰', game: null, flippedId: null, eyeCount: {} };

  // ---------- 音效 ----------
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

  // ---------- 开场 ----------
  function initUI() {
    const picker = document.getElementById('animal-picker');
    picker.innerHTML = ANIMALS.map(a =>
      '<button data-animal="' + a + '">' + a + '</button>').join('');
    picker.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => selectAnimal(btn));
    });
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => startGame(state.animal, btn.dataset.mode));
    });
    document.getElementById('btn-reset').addEventListener('click', () => resetGame());
    document.getElementById('btn-home').addEventListener('click', () => showScreen('screen-animal'));
    document.getElementById('btn-stats-reset').addEventListener('click', () => resetGame());
    document.getElementById('btn-stats-home').addEventListener('click', () => showScreen('screen-animal'));
  }

  function selectAnimal(btn) {
    state.animal = btn.dataset.animal;
    document.querySelectorAll('.animal-picker button').forEach(b => {
      b.style.borderColor = b === btn ? '#ff7043' : '';
    });
  }

  function startGame(animal, mode) {
    state.animal = animal || '🐰';
    state.mode = mode || 'baby';
    state.game = createQueueGame(state.mode);
    state.flippedId = null;
    state.eyeCount = {};
    document.getElementById('animal-face').textContent = state.animal;
    showScreen('screen-game');
    renderBoard();
    renderQueue();
    setHint('谁最矮？点它，让它进队！');
    setFeedback('', '');
    document.getElementById('record').textContent = '';
    updateStatus();
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // ---------- 渲染 ----------
  function renderBoard() {
    const board = document.getElementById('board');
    const g = state.game;
    // 只渲染"还没进队"的牌（已进队的只在队伍区出现）
    const remaining = g.cards.filter(c => !queueOrder().some(q => q.id === c.id));
    board.innerHTML = remaining.map(c => {
      const badge = state.eyeCount[c.id] ? '<span class="eyes-badge">👀' + state.eyeCount[c.id] + '</span>' : '';
      return '<button class="card" data-id="' + c.id + '">' +
        '<span class="animal">' + animalFor(c.value) + '</span>' +
        '<span class="num">' + c.value + '</span>' + badge + '</button>';
    }).join('');
    board.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => onCardClick(Number(card.dataset.id)));
    });
  }

  function renderQueue() {
    const q = document.getElementById('queue');
    q.innerHTML = '';
    queueOrder().forEach(c => {
      const el = document.createElement('div');
      el.className = 'q-card card';
      el.style.width = '52px'; el.style.height = '64px';
      el.innerHTML = '<span class="animal">' + animalFor(c.value) + '</span>' +
        '<span class="num">' + c.value + '</span>';
      q.appendChild(el);
    });
  }

  // 已进队伍的顺序 = 升序前 sortedCount 张
  function queueOrder() {
    const g = state.game;
    return g.cards.slice().sort((a, b) => a.value - b.value).slice(0, g.sortedCount);
  }

  function animalFor(value) {
    const faces = ['🐜', '🐭', '🐹', '🐰', '🦊', '🐻', '🐷', '🐨', '🦁', '🐮', '🐘', '🦒'];
    return faces[(value - 1) % faces.length];
  }

  // ---------- 点击逻辑 ----------
  function onCardClick(id) {
    if (state.game.isDone) return;
    babyGuess(id);   // 两种模式同一种玩法：选最小（简单 = 不畏难）
  }

  function babyGuess(id) {
    const g = state.game;
    const r = g.checkMin(id);
    // 扫描动画：剩余牌全部闪一遍 + 👀 +1
    const remaining = g.cards.filter(c => !queueOrder().some(q => q.id === c.id));
    remaining.forEach(c => {
      state.eyeCount[c.id] = (state.eyeCount[c.id] || 0) + 1;
    });
    document.querySelectorAll('.card[data-id]').forEach(cardEl => {
      const cid = Number(cardEl.dataset.id);
      if (state.eyeCount[cid]) {
        let badge = cardEl.querySelector('.eyes-badge');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'eyes-badge';
          cardEl.appendChild(badge);
        }
        badge.textContent = '👀' + state.eyeCount[cid];
        cardEl.classList.remove('scan-flash');
        void cardEl.offsetWidth;
        cardEl.classList.add('scan-flash');
      }
    });
    if (r.ok) {
      playSound('correct');
      setFeedback('进队啦！', 'ok');
      // 进队的牌标记 sorted（淡出且不可点）
      document.querySelectorAll('.card[data-id]').forEach(el => {
        if (Number(el.dataset.id) === id) el.classList.add('sorted');
      });
      renderQueue();
      updateStatus();
      if (state.game.isDone) onWin();
    } else {
      playSound('wrong');
      setFeedback('再看看，还有更矮的哦～', 'no');
    }
  }

  function setFeedback(msg, cls) {
    const el = document.getElementById('feedback');
    el.className = 'feedback ' + cls;
    el.textContent = msg;
  }

  function setHint(msg) { document.getElementById('hint').textContent = msg; }

  function updateStatus() {
    const g = state.game;
    document.getElementById('steps').textContent = '队伍 ' + g.sortedCount + '/' + g.cards.length;
    document.getElementById('eyes').textContent = '👀 ' + g.getStats().scans;
  }

  // ---------- 胜利 + 统计页 ----------
  function onWin() {
    const g = state.game;
    const stats = g.getStats();
    playSound('win');
    document.getElementById('animal-face').classList.add('celebrate');
    setTimeout(() => document.getElementById('animal-face').classList.remove('celebrate'), 700);

    setHint('🎉 排队成功！' + '⭐'.repeat(stats.stars));
    showRecord(stats.stars, stats.scans);
    if (state.mode === 'challenge') showStatsPage(stats);
  }

  function showStatsPage(stats) {
    showScreen('screen-stats');
    const theo = stats.theoretical;
    const stars = stats.stars;
    document.getElementById('stats-title').textContent = '排好啦！' + '⭐'.repeat(stars);
    document.getElementById('stats-box').innerHTML =
      '<div class="big">你一共看了 👀 ' + stats.scans + ' 次！</div>' +
      '<div>小秘密：每张牌都被你看了好几遍——这就是排队累的原因！</div>' +
      '<div>数字爆炸：5 只=10 次 · 8 只=28 次 · 12 只=66 次</div>';
    showRecord(stars, stats.scans);
  }

  function recordKey() { return 'ssq-best-' + state.mode + '-' + state.animal; }

  function showRecord(stars, score) {
    const el = document.getElementById('record');
    const key = recordKey();
    const prev = Number(localStorage.getItem(key) || 0);
    if (prev === 0 || score < prev) {
      localStorage.setItem(key, String(score));
      el.textContent = '🏆 新纪录！' + score + (state.mode === 'challenge' ? ' 次翻牌' : ' 次扫描');
      el.style.color = '#ff7043';
    } else {
      el.textContent = '最佳 ' + prev;
      el.style.color = '#8a7a5f';
    }
  }

  function resetGame() { startGame(state.animal, state.mode); }

  document.addEventListener('DOMContentLoaded', initUI);
})();
