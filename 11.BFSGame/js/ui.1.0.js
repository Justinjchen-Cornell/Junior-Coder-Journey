// 《小猴子找朋友》UI 层（SVG 森林图 + 波纹扩散 + 揭示 + 音效 + 纪录）
(function () {
  'use strict';

  const ANIMALS = ['🐰', '🐻', '🦊', '🐱', '🐸'];
  const FOREST_FACES = ['🐰', '🐻', '🦊', '🐱', '🐸', '🐼', '🦉', '🦌', '🐿️', '🦔', '🐢', '🦋', '🐝', '🐨', '🦜', '🐹'];
  const state = { mode: 'baby', animal: '🐒', game: null };

  let audioCtx = null;
  function playSound(type) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx;
      const notes = {
        wrong: [[220, 0.12, 'sine']],
        correct: [[523, 0.12, 'sine'], [659, 0.15, 'sine']],
        pop: [[440, 0.08, 'triangle'], [660, 0.1, 'triangle']],
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
    document.getElementById('btn-expand').addEventListener('click', onExpand);
    document.getElementById('btn-guess').addEventListener('click', onGuess);
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
    state.animal = animal || '🐒';
    state.mode = mode || 'baby';
    state.game = createBFSGame(state.mode);
    window.__game = state.game;
    document.getElementById('animal-face').textContent = state.animal;
    showScreen('screen-game');
    renderForest();
    setHint('按「扩散」按钮，一圈圈找会做冰淇淋的朋友！');
    setFeedback('', '');
    document.getElementById('record').textContent = '';
    updateStatus();
    document.getElementById('btn-expand').style.display = 'inline-block';
    document.getElementById('btn-guess').style.display = state.mode === 'challenge' ? 'inline-block' : 'none';
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // ---------- SVG 森林图 ----------
  function renderForest() {
    const g = state.game;
    const W = 720, H = 340;
    const levels = g.levels;   // [{id, level}]
    const maxLevel = Math.max(...levels.map(l => l.level));
    const pos = {};
    // 分层布局：x = 80 + level*130，y 均匀散布
    const levelGroups = {};
    levels.forEach(l => {
      (levelGroups[l.level] = levelGroups[l.level] || []).push(l.id);
    });
    Object.keys(levelGroups).forEach(lv => {
      const ids = levelGroups[lv];
      ids.forEach((id, i) => {
        const y = H / 2 + (i - (ids.length - 1) / 2) * 72;
        pos[id] = { x: 80 + Number(lv) * 130, y };
      });
    });
    // 连线（BFS 树边 + 其他边）
    let lines = '';
    const drawn = new Set();
    for (let a = 0; a < g.nodeCount; a++) {
      for (const b of g.graph[a]) {
        const key = Math.min(a, b) + '-' + Math.max(a, b);
        if (drawn.has(key)) continue;
        drawn.add(key);
        lines += '<line class="node-line" x1="' + pos[a].x + '" y1="' + pos[a].y +
          '" x2="' + pos[b].x + '" y2="' + pos[b].y + '"></line>';
      }
    }
    // 节点
    let nodes = '';
    for (let i = 0; i < g.nodeCount; i++) {
      const p = pos[i];
      nodes += '<g class="node hidden" data-node="' + i + '" transform="translate(' + p.x + ',' + p.y + ')">' +
        '<circle r="26"></circle>' +
        '<text class="face" y="-2">' + FOREST_FACES[i % FOREST_FACES.length] + '</text>' +
        '</g>';
    }
    document.getElementById('forest').innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '">' + lines + nodes + '</svg>' +
      '<div class="ring-badge" id="ring-badge">🌊 第 0 圈（起点）</div>';
    // 起点亮起
    revealNode(g.start, true);
  }

  function revealNode(id, isStart) {
    const el = document.querySelector('[data-node="' + id + '"]');
    if (!el) return;
    el.classList.remove('hidden');
    el.classList.add(isStart ? 'found' : 'wave');
  }

  function revealWave(nodes, level) {
    nodes.forEach(id => revealNode(id));
    const badge = document.getElementById('ring-badge');
    if (badge) badge.textContent = '🌊 第 ' + level + ' 圈';
    playSound('pop');
  }

  // ---------- 扩散 ----------
  function onExpand() {
    const g = state.game;
    if (g.isDone) return;
    const r = g.expand();
    if (!r) return;
    revealWave(r.nodes, r.level);
    setHint('第 ' + r.level + ' 圈亮了！看看谁在发光～');
    playSound('correct');
    updateStatus();
    if (r.nodes.includes(g.target)) {
      revealTarget();
    }
  }

  function revealTarget() {
    const g = state.game;
    const el = document.querySelector('[data-node="' + g.target + '"]');
    if (el) {
      el.classList.add('found');
      el.classList.remove('wave');
      el.innerHTML = '<circle r="30"></circle>' +
        '<text class="face" y="-2">🍨</text>';
    }
    playSound('win');
    setHint('🎉 第 ' + g.foundLevel + ' 圈找到它了！= ' + g.foundLevel + ' 步（最短！）');
    document.getElementById('btn-expand').style.display = 'none';
    document.getElementById('btn-guess').style.display = 'none';
    setTimeout(finishWin, 900);
  }

  // ---------- 挑战：猜目标 ----------
  function onGuess() {
    const g = state.game;
    if (g.isDone) return;
    if (g.guess(g.target)) {
      revealTarget();
    } else {
      playSound('wrong');
      setFeedback('还没亮到它哦——再扩散一圈看看！', 'no');
      updateStatus();
    }
  }

  // ---------- 结算 ----------
  function finishWin() {
    const stats = state.game.getStats();
    document.getElementById('animal-face').classList.add('celebrate');
    setTimeout(() => document.getElementById('animal-face').classList.remove('celebrate'), 700);
    showRecord(stats.stars, stats.steps);
    showStatsPage(stats);
  }

  function showStatsPage(stats) {
    showScreen('screen-stats');
    document.getElementById('stats-title').textContent = '找到啦！' + '⭐'.repeat(stats.stars);
    // ===== 奖励评价 =====
    const rewardEl = document.getElementById('stats-reward');
    if (rewardEl) {
      const praise = { 3: '🏆 太棒了！你是算法小天才！', 2: '🎖️ 好厉害！再来一次，冲击三星！', 1: '💪 很棒！多玩几次会更好！' }[stats.stars] || '🎉 完成啦！';
      rewardEl.style.display = 'block';
      rewardEl.innerHTML = '<div class="confetti"><span>🎉</span><span>⭐</span><span>✨</span><span>🎊</span><span>🌟</span></div>' +
        '<div class="reward-text">' + praise + '</div>';
    }
    document.getElementById('stats-box').innerHTML =
      '<div class="big">第 ' + stats.steps + ' 圈找到 = ' + stats.steps + ' 步！</div>' +
      '<div>错误：' + stats.mistakes + ' 次</div>' +
      '<div>🐻 小秘密：一圈一圈先碰到谁，谁就是最近的——这就是 BFS！</div>' +
      '<div>如果一条路走到黑（DFS），可能会绕远路哦！</div>';
  }

  function recordKey() { return 'bfs-best-' + state.mode + '-' + state.animal; }

  function showRecord(stars, score) {
    const el = document.getElementById('record');
    const key = recordKey();
    const prev = Number(localStorage.getItem(key) || 0);
    if (prev === 0 || score < prev) {
      localStorage.setItem(key, String(score));
      el.textContent = '🏆 新纪录！' + score + ' 圈';
      el.style.color = '#ff7043';
    } else {
      el.textContent = '最佳 ' + prev + ' 圈';
      el.style.color = '#8a7a5f';
    }
  }

  function updateStatus() {
    const g = state.game;
    document.getElementById('steps').textContent = '已扩散 ' + (g.getStats().steps) + ' 圈';
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