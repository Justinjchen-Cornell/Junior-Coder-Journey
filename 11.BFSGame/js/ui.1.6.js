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
    state.waveGuessed = false;
    document.getElementById('animal-face').textContent = state.animal;
    showScreen('screen-game');
    renderForest();
    setMission();
    renderPrediction();
    setHint('🔍 观察森林：从 🐒 到 ❓ 最少要走几步？预言一下！');
    document.getElementById('btn-expand').style.display = 'none';
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
    const W = 760, H0 = 360;
    const levels = g.levels;   // [{id, level}]
    const maxLevel = Math.max(...levels.map(l => l.level));
    const levelGroups = {};
    levels.forEach(l => {
      (levelGroups[l.level] = levelGroups[l.level] || []).push(l.id);
    });
    const maxCount = Math.max(...Object.values(levelGroups).map(a => a.length));
    // 动态间距：按层级数和每层最多节点数自适应（保证不出画布）
    const xStep = Math.min(150, (W - 150) / Math.max(maxLevel, 1));
    const yStep = Math.min(80, (H0 - 70) / Math.max(maxCount, 1));
    const H = Math.max(H0, 100 + maxCount * yStep);
    const pos = {};
    Object.keys(levelGroups).forEach(lv => {
      const ids = levelGroups[lv];
      ids.forEach((id, i) => {
        const y = H / 2 + (i - (ids.length - 1) / 2) * yStep;
        pos[id] = { x: 75 + Number(lv) * xStep, y };
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
    // 节点：全部可见！目标是 ❓（会做冰淇淋的神秘朋友）；起点是 🐒（第 0 圈）
    let nodes = '';
    for (let i = 0; i < g.nodeCount; i++) {
      const p = pos[i];
      const isTarget = i === g.target;
      const isStart = i === g.start;
      nodes += '<g class="node' + (isStart ? ' start-node' : '') + '" data-node="' + i + '" transform="translate(' + p.x + ',' + p.y + ')">' +
        '<circle r="26"></circle>' +
        '<text class="face" y="-2">' + (isTarget ? '❓' : (isStart ? '🐒' : FOREST_FACES[i % FOREST_FACES.length])) + '</text>' +
        (isTarget ? '<text class="target-badge" y="-38">🍨</text>' : '') +
        (isStart ? '<text class="start-badge" y="-38">第 0 圈 · 起点</text>' : '') +
        '</g>';
    }
    document.getElementById('forest').innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '">' + lines + nodes + '</svg>';
    state.pos = pos;   // 记录坐标（画最短路径用）
    const badge = document.getElementById('ring-badge');
    if (badge) badge.textContent = '🌊 还没扩散';
    // 起点亮起
    revealNode(g.start, true);
  }

  function renderPrediction() {
    const g = state.game;
    const po = g.predictionOptions();
    document.getElementById('guess-zone').innerHTML =
      '<div class="predict-hint">🧐 你觉得第几圈能找到 ❓？（数一数最短的路）</div>' +
      '<div class="chain-items">' +
      po.options.map(o => '<div class="predict-opt" data-pred="' + o + '">第 ' + o + ' 圈！</div>').join('') +
      '</div>';
    document.querySelectorAll('.predict-opt').forEach(opt => {
      opt.addEventListener('click', () => onPredict(Number(opt.dataset.pred)));
    });
  }

  function onPredict(level) {
    const g = state.game;
    g.submitPrediction(level);
    playSound('pop');
    document.getElementById('guess-zone').innerHTML =
      '<div class="predict-result">📣 预言：第 ' + level + ' 圈！扩散验证吧！</div>';
    document.getElementById('btn-expand').style.display = 'inline-block';
    setHint('按「扩散」，看你的预言准不准！');
  }

  function setMission() {
    const g = state.game;
    document.getElementById('mission').textContent =
      '🎯 目标：❓ 会做冰淇淋的朋友（🍨）！找到它，小猴就能吃到冰淇淋！';
  }

  function revealNode(id, isStart) {
    const el = document.querySelector('[data-node="' + id + '"]');
    if (!el) return;
    el.classList.add(isStart ? 'found' : 'wave');
  }

  function revealWave(nodes, level) {
    nodes.forEach(id => revealNode(id));
    const badge = document.getElementById('ring-badge');
    if (badge) badge.textContent = '🌊 第 ' + level + ' 圈';
    playSound('pop');
  }

  function updateRing() {
    const g = state.game;
    const badge = document.getElementById('ring-badge');
    if (badge) badge.textContent = '🌊 已扩散 ' + g.getStats().steps + ' 圈';
  }

  // ---------- 扩散（先猜再扩：每圈一个决策） ----------
  function onExpand() {
    const g = state.game;
    if (g.isDone) return;
    if (!state.waveGuessed) {
      renderWaveGuess();   // 先猜"这圈几个新朋友"
      return;
    }
    doExpand();
  }

  // 每圈预言：猜"这圈会亮几个新朋友"
  function renderWaveGuess() {
    const g = state.game;
    if (state.waveGuessed || g.isDone) return;
    const wo = g.getWaveOptions();
    if (!wo) return;
    document.getElementById('guess-zone').innerHTML =
      '<div class="predict-hint">🧐 猜猜：这一圈会亮几个新朋友？</div>' +
      '<div class="chain-items">' +
      wo.options.map(o => '<div class="predict-opt" data-wg="' + o + '">' + o + ' 个！</div>').join('') +
      '</div>';
    document.querySelectorAll('[data-wg]').forEach(opt => {
      opt.addEventListener('click', () => {
        const n = Number(opt.dataset.wg);
        const ok = g.submitWaveGuess(n);
        state.waveGuessed = true;
        playSound(ok ? 'correct' : 'pop');
        document.getElementById('guess-zone').innerHTML =
          '<div class="predict-result">📣 预言 ' + n + ' 个' + (ok ? '（对啦！🌟）' : '……看结果！') + '</div>';
        doExpand();
      });
    });
  }

  function doExpand() {
    const g = state.game;
    if (g.isDone) return;
    const r = g.expand();
    if (!r) return;
    revealWave(r.nodes, r.level);
    if (r.nodes.includes(g.target)) {
      setHint('🌟 第 ' + r.level + ' 圈亮到 ❓ 了！');
      revealTarget();
      return;
    }
    const st = g.getStats();
    setHint('第 ' + r.level + ' 圈亮了 ' + r.nodes.length + ' 个新朋友！' +
      (st.waveCorrect > 0 ? ' 🌟预言+' + st.waveCorrect : '') + ' 继续猜～');
    playSound('correct');
    updateStatus();
    state.waveGuessed = false;
  }

  function revealTarget() {
    const g = state.game;
    const el = document.querySelector('[data-node="' + g.target + '"]');
    if (el) {
      el.classList.add('found');
      el.classList.remove('wave');
      el.innerHTML = '<circle r="30"></circle>' +
        '<text class="face" y="-2">' + FOREST_FACES[g.target % FOREST_FACES.length] + '</text>' +
        '<text class="target-badge" y="-38">🍨</text>';
    }
    playSound('win');
    drawShortestPath();
    const predMsg = g.predictionCorrect
      ? '🌟 预言成真！你数对了！'
      : '你预言第 ' + g.predicted + ' 圈……BFS 找到第 ' + g.foundLevel + ' 圈（看金线数一数？）';
    setHint('🎉 找到啦！它' + FOREST_FACES[g.target % FOREST_FACES.length] + '会做冰淇淋！' +
      '第 ' + g.foundLevel + ' 圈 = ' + g.foundLevel + ' 步（最短！）');
    setFeedback(predMsg, g.predictionCorrect ? 'ok' : 'no');
    document.getElementById('mission').textContent =
      '✅ 找到 ❓ = ' + FOREST_FACES[g.target % FOREST_FACES.length] + '！小猴吃到冰淇淋啦！🎉';
    document.getElementById('btn-expand').style.display = 'none';
    document.getElementById('btn-guess').style.display = 'none';
    setTimeout(finishWin, 1200);
  }

  function drawShortestPath() {
    // 最短路径金线：从起点连到目标（虚线流动动画）
    const g = state.game;
    const path = g.getShortestPath();
    if (!path || !state.pos) return;
    let pl = '';
    for (let i = 0; i < path.length - 1; i++) {
      const a = state.pos[path[i]];
      const b = state.pos[path[i + 1]];
      pl += '<line class="path-line" x1="' + a.x + '" y1="' + a.y +
        '" x2="' + b.x + '" y2="' + b.y + '"></line>';
    }
    const svg = document.querySelector('.forest svg');
    if (svg) svg.insertAdjacentHTML('beforeend', pl);
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
    const lt = document.getElementById('life-task');
    if (lt) lt.textContent = '🏠 回家试试：帮妈妈传话：从你到小区门口，最少经过几个认识的人？';
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
      '<div>🔮 预言：第 ' + (stats.predicted || '-') + ' 圈 → ' +
      (stats.predictionCorrect ? '🌟 成真！你是路径侦探！' : '❌ 落空（数一数金线就知道啦）') + '</div>' +
      '<div>错误：' + stats.mistakes + ' 次</div>' +
      '<div>🐻 小秘密：一圈一圈先碰到谁，谁就是最近的——这就是 BFS！</div>' +
      '<div>如果一条路走到黑（DFS），可能会绕远路哦！</div>';
  }

  function recordKey() { return 'bfs-best-' + state.mode + '-' + state.animal; }

  function showRecord(stars, score) {
    if (stars === 3) localStorage.setItem('forest-badge-11', '1');
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