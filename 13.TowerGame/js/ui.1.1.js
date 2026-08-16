// 《盖广播塔》UI 层（村庄地图 + 塔按钮 + 贪心引导 + 悔棋 + 结算对比 + 音效 + 纪录）
(function () {
  'use strict';

  const VILLAGE_FACES = ['🏠', '🏡', '🏘️', '🛖', '🏚️', '🏠', '🏡', '🏘️', '🛖', '🏚️', '🏠', '🏡'];
  const state = { level: 1, game: null, chosenFlash: null };

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
    document.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', () => startGame(Number(btn.dataset.level)));
    });
    document.getElementById('btn-undo').addEventListener('click', onUndo);
    document.getElementById('btn-reset').addEventListener('click', () => resetGame());
    document.getElementById('btn-home').addEventListener('click', () => showScreen('screen-start'));
    document.getElementById('btn-stats-reset').addEventListener('click', () => resetGame());
    document.getElementById('btn-stats-home').addEventListener('click', () => showScreen('screen-start'));
    document.getElementById('btn-next').addEventListener('click', () => nextLevel());
    showRecordLine();
  }

  function startGame(level) {
    state.level = level;
    state.game = createTowerGame(level);
    window.__game = state.game;
    showScreen('screen-game');
    renderVillages();
    renderTowers();
    updateStatus();
    setFeedback('', '');
    document.getElementById('record').textContent = '';
    document.getElementById('hint').textContent = '点一座塔盖下去！每次选"还能盖最多村"的塔试试～';
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // ---------- 村庄地图 ----------
  function renderVillages() {
    const g = state.game;
    const map = document.getElementById('village-map');
    map.innerHTML = g.villages.map(v =>
      '<div class="village" data-village="' + v + '">' + VILLAGE_FACES[v % VILLAGE_FACES.length] + '</div>').join('');
  }

  function updateVillages() {
    const g = state.game;
    const covered = g.covered;
    document.querySelectorAll('.village').forEach(el => {
      const v = Number(el.dataset.village);
      const was = el.classList.contains('covered');
      el.classList.toggle('covered', covered.has(v));
      if (!was && covered.has(v)) {
        el.classList.remove('flash');
        void el.offsetWidth;
        el.classList.add('flash');
      }
    });
  }

  // ---------- 塔按钮 ----------
  function renderTowers() {
    const g = state.game;
    const zone = document.getElementById('tower-zone');
    zone.innerHTML = g.towers.map(t => {
      const built = g.chosen.includes(t.id);
      const remaining = t.covers.filter(v => !g.covered.has(v)).length;
      return '<button class="tower-btn' + (built ? ' built' : '') + '" data-tower="' + t.id + '">' +
        '<span class="tower-face">' + (built ? '✅' : '🗼') + '</span>' +
        (built ? '已盖' : '盖它！') +
        '<span class="tower-badge">还能盖 ' + remaining + ' 村</span></button>';
    }).join('');
    zone.querySelectorAll('.tower-btn').forEach(btn => {
      btn.addEventListener('click', () => onTowerClick(Number(btn.dataset.tower)));
    });
  }

  function onTowerClick(id) {
    const g = state.game;
    if (g.isDone) return;
    if (g.chosen.includes(id)) {
      playSound('wrong');
      setFeedback('这座已经盖过啦！', 'no');
      return;
    }
    g.chooseTower(id);
    playSound('pop');
    const t = g.towers.find(x => x.id === id);
    setFeedback('📡 塔盖好了！覆盖了 ' + t.covers.length + ' 个村庄！', 'ok');
    updateVillages();
    renderTowers();
    updateStatus();
    if (g.isDone) {
      setTimeout(finishWin, 700);
    }
  }

  function onUndo() {
    const g = state.game;
    if (!g.undo()) {
      playSound('wrong');
      setFeedback('还没有盖塔呢！', 'no');
      return;
    }
    playSound('correct');
    setFeedback('↩️ 拆掉了上一座塔', 'ok');
    updateVillages();
    renderTowers();
    updateStatus();
  }

  function updateStatus() {
    const g = state.game;
    const remaining = g.villages.length - g.coveredCount;
    document.getElementById('steps').textContent =
      '已盖 ' + g.towersUsed + ' 座 · 还剩 ' + remaining + ' 村没信号';
  }

  // ---------- 结算 ----------
  function finishWin() {
    const g = state.game;
    const s = g.getStats();
    playSound('win');
    document.getElementById('animal-face').classList.add('celebrate');
    setTimeout(() => document.getElementById('animal-face').classList.remove('celebrate'), 700);
    showRecord(s.stars, s.towersUsed);
    showStatsPage(s);
  }

  function showStatsPage(s) {
    showScreen('screen-stats');
    const isOpt = s.towersUsed === s.optimalCount;
    document.getElementById('stats-title').textContent = '信号全覆盖！' + '⭐'.repeat(s.stars);
    // ===== 奖励评价 =====
    const rewardEl = document.getElementById('stats-reward');
    if (rewardEl) {
      const praise = { 3: '🏆 太棒了！你是算法小天才！', 2: '🎖️ 好厉害！再来一次，冲击三星！', 1: '💪 很棒！多玩几次会更好！' }[s.stars] || '🎉 完成啦！';
      rewardEl.style.display = 'block';
      rewardEl.innerHTML = '<div class="confetti"><span>🎉</span><span>⭐</span><span>✨</span><span>🎊</span><span>🌟</span></div>' +
        '<div class="reward-text">' + praise + '</div>';
    }
    // 三重对比（始终显示三行：你的 / 贪心 / 最优）
    const trapMsg =
      '<div class="big">🟢 你用了 ' + s.towersUsed + ' 座塔</div>' +
      '<div class="greedy-line">🟠 贪心（每次都选最多的）会用 ' + s.greedyCount + ' 座</div>' +
      '<div class="opt-line">🟡 最优只要 ' + s.optimalCount + ' 座</div>' +
      (isOpt
        ? '<div class="big">🌟 你就是最优解！</div>'
        : (s.greedyCount > s.optimalCount
          ? '<div>💡 先盖大塔反而吃亏——贪心被骗啦！看下面的金圈！</div>'
          : '<div>💡 差一点！看看金圈里的最优组合～</div>'));
    document.getElementById('race-card').innerHTML = trapMsg;
    document.getElementById('stats-box').innerHTML =
      '<div>🐻 小秘密：每次都选"覆盖最多"的塔 = 贪心——大多数时候刚好最优，但第 2/3 关它会翻车！</div>' +
      '<div>这就是为什么有些问题（NP 完全）连电脑也只能"差不多"——工程上接受近似！</div>';
    renderMiniMap(s);
    const btnNext = document.getElementById('btn-next');
    btnNext.style.display = state.level < 3 ? 'block' : 'none';
    if (state.level >= 3) {
      document.getElementById('stats-title').textContent = '🎉 三关全通！' + '⭐'.repeat(s.stars);
    }
  }

  // 结算迷你地图：你的塔（绿）/ 贪心塔（橙虚线）/ 最优塔（金圈）同屏可见
  function renderMiniMap(s) {
    const g = state.game;
    const el = document.getElementById('mini-map');
    if (!el) return;
    const villages = g.villages.map(v =>
      '<div class="mm-village' + (g.covered.has(v) ? ' covered' : '') + '">' +
      VILLAGE_FACES[v % VILLAGE_FACES.length] + '</div>').join('');
    const towers = g.towers.map(t => {
      let cls = 'mm-tower';
      if (s.optimalTowers.includes(t.id)) cls += ' optimal';
      if (s.greedyTowers.includes(t.id)) cls += ' greedy';
      if (g.chosen.includes(t.id)) cls += ' mine';
      return '<div class="' + cls + '">🗼 塔' + (t.id + 1) + '<br><small>' + t.covers.length + ' 村</small></div>';
    }).join('');
    el.innerHTML =
      '<div class="mm-villages">' + villages + '</div>' +
      '<div class="mm-towers">' + towers + '</div>' +
      '<div class="mm-legend">🟢 你盖的 ｜ 🟠 贪心会盖的 ｜ 🟡 最优（金圈）</div>';
  }

  function nextLevel() {
    if (state.level < 3) startGame(state.level + 1);
  }

  function recordKey() { return 'tower-best-l' + state.level; }

  function showRecord(stars, towersUsed) {
    const el = document.getElementById('record');
    const key = recordKey();
    const prev = Number(localStorage.getItem(key) || 0);
    if (prev === 0 || towersUsed < prev) {
      localStorage.setItem(key, String(towersUsed));
      el.textContent = '🏆 新纪录！' + towersUsed + ' 座塔';
      el.style.color = '#ff7043';
    } else {
      el.textContent = '最佳 ' + prev + ' 座塔';
      el.style.color = '#8a7a5f';
    }
    showRecordLine();
  }

  function showRecordLine() {
    const el = document.getElementById('record-line');
    if (!el) return;
    const parts = [];
    for (let lv = 1; lv <= 3; lv++) {
      const v = localStorage.getItem('tower-best-l' + lv);
      parts.push('第 ' + lv + ' 关：' + (v === null ? '未通关' : v + ' 座'));
    }
    el.textContent = '🏅 ' + parts.join(' ｜ ');
  }

  function setFeedback(msg, cls) {
    const el = document.getElementById('feedback');
    el.className = 'feedback ' + cls;
    el.textContent = msg;
  }

  function resetGame() { startGame(state.level); }

  document.addEventListener('DOMContentLoaded', initUI);
})();