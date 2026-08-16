// 《套娃拆拆乐》UI 层（DOM + 拆开动画 + 回溯 + 音效 + 纪录）
(function () {
  'use strict';

  const ANIMALS = ['🐰', '🐻', '🦊', '🐱', '🐸'];
  const state = { mode: 'baby', animal: '🐿️', game: null, phase: 'open', seen: [] };

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
    document.getElementById('btn-open').addEventListener('click', onOpen);
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
    state.animal = animal || '🐿️';
    state.mode = mode || 'baby';
    state.game = createNestGame(state.mode);
    state.phase = 'open';
    state.seen = [];
    document.getElementById('animal-face').textContent = state.animal;
    showScreen('screen-game');
    renderDoll('🪆', '');
    setHint('点「打开」，看看里面是什么');
    setFeedback('', '');
    document.getElementById('record').textContent = '';
    document.getElementById('steps').textContent = '';
    document.getElementById('backtrack-zone').innerHTML = '';
    document.getElementById('btn-open').style.display = 'inline-block';
    updateStatus();
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // ---------- 拆（递归下降） ----------
  function onOpen() {
    const g = state.game;
    if (g.isBaseReached) return;
    const r = g.openNext();
    if (r.isBase) {
      // 空娃娃（基线）
      renderDoll('✨', '空的！最小的娃娃里面什么也没有——到底啦！');
      setHint('到底啦！最小的娃娃是空的（这就是"基线"）');
      playSound('correct');
      state.phase = 'backtrack';
      document.getElementById('btn-open').style.display = 'none';
      setTimeout(startBacktrack, 800);
    } else {
      state.seen.push(r.value);
      const sizes = ['big', 'small', 'tiny', 'micro', 'micro', 'micro', 'micro'];
      renderDoll('🪆', r.value, sizes[Math.min(r.layer - 1, sizes.length - 1)]);
      setHint('第 ' + r.layer + ' 层！继续打开看看～');
      playSound('correct');
      updateStatus();
    }
  }

  function renderDoll(face, tagText, sizeClass) {
    const zone = document.getElementById('nest-zone');
    zone.innerHTML = '<div class="doll reveal ' + (sizeClass || '') + '">' + face + '</div>' +
      (tagText ? '<div class="layer-tag">' + tagText + '</div>' : '');
  }

  // ---------- 回溯（递归上升） ----------
  function startBacktrack() {
    const g = state.game;
    if (state.mode === 'baby') {
      babyBacktrack();
    } else {
      challengeBacktrack();
    }
  }

  function babyBacktrack() {
    // 系统从里往外数回来（弹栈动画）
    const inner = state.seen.slice().reverse();
    let i = 0;
    setHint('现在数回来！从最小的开始……');
    const timer = setInterval(() => {
      if (i < inner.length) {
        renderDoll('🪆', inner[i], 'micro');
        i++;
      } else {
        clearInterval(timer);
        askBabyTotal();
      }
    }, 600);
  }

  function askBabyTotal() {
    const n = state.game.layers;
    const options = [n - 1, n, n + 1];
    document.getElementById('backtrack-zone').innerHTML =
      '<div class="hint" style="text-align:center;margin-bottom:8px">一共几层套娃？</div>' +
      options.map(v => '<button class="num-btn" data-ans="' + v + '">' + v + '</button>').join('');
    document.querySelectorAll('[data-ans]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ok = state.game.answer(Number(btn.dataset.ans));
        if (ok) {
          playSound('win');
          onWin();
        } else {
          playSound('wrong');
          setFeedback('再数数看？', 'no');
        }
      });
    });
  }

  function challengeBacktrack() {
    // 数字牌按键：按"从里到外"顺序点
    const g = state.game;
    const values = g.layerValues.slice().sort((a, b) => a - b);
    setHint('按"从里到外"的顺序点数字！');
    document.getElementById('backtrack-zone').innerHTML =
      values.map(v => '<button class="num-btn" data-v="' + v + '">' + v + '</button>').join('');
    document.querySelectorAll('[data-v]').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = Number(btn.dataset.v);
        if (g.isDone) return;
        if (g.submitNext(v)) {
          btn.classList.add('used');
          playSound('correct');
          if (g.isDone) { playSound('win'); onWin(); }
        } else {
          playSound('wrong');
          setFeedback('顺序不对哦，想想谁是最里面的？', 'no');
        }
      });
    });
  }

  // ---------- 结算 ----------
  function onWin() {
    const stats = state.game.getStats();
    setHint('🎉 拆完啦！' + '⭐'.repeat(stats.stars));
    document.getElementById('animal-face').classList.add('celebrate');
    setTimeout(() => document.getElementById('animal-face').classList.remove('celebrate'), 700);
    showRecord(stats.stars, stats.mistakes);
    showStatsPage(stats);
  }

  function showStatsPage(stats) {
    showScreen('screen-stats');
    document.getElementById('stats-title').textContent = '拆完啦！' + '⭐'.repeat(stats.stars);
    document.getElementById('stats-box').innerHTML =
      '<div class="big">一共 ' + stats.layers + ' 层套娃</div>' +
      '<div>错误：' + stats.mistakes + ' 次</div>' +
      '<div>🐻 小秘密：拆的时候一层层记住（压栈），数回来的时候从最里面开始（弹栈）——这就是递归！</div>' +
      '<div>最小的空娃娃 = 基线：没有它，套娃就永远拆不完。</div>';
  }

  function recordKey() { return 'nest-best-' + state.mode + '-' + state.animal; }

  function showRecord(stars, score) {
    const el = document.getElementById('record');
    const key = recordKey();
    const prev = Number(localStorage.getItem(key) || 0);
    if (prev === 0 || score < prev) {
      localStorage.setItem(key, String(score));
      el.textContent = '🏆 新纪录！错误 ' + score + ' 次';
      el.style.color = '#ff7043';
    } else {
      el.textContent = '最佳 错误 ' + prev + ' 次';
      el.style.color = '#8a7a5f';
    }
  }

  function updateStatus() {
    const g = state.game;
    document.getElementById('steps').textContent = '拆开 ' + g.openedCount + '/' + g.layers + ' 层';
  }

  function setFeedback(msg, cls) {
    const el = document.getElementById('feedback');
    el.className = 'feedback ' + cls;
    el.textContent = msg;
  }

  function setHint(msg) { document.getElementById('hint').textContent = msg; }

  function resetGame() { startGame(state.animal, state.mode); }

  document.addEventListener('DOMContentLoaded', initUI);
})();
