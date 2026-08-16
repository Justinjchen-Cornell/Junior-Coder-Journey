// 《小松鼠装松果》UI 层（篮子格条 + 物品卡 + 试装 + DP 网格 + 音效 + 纪录）
(function () {
  'use strict';

  const state = { level: 1, game: null };

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
    document.getElementById('btn-finish').addEventListener('click', onFinish);
    document.getElementById('btn-reset').addEventListener('click', () => resetGame());
    document.getElementById('btn-home').addEventListener('click', () => showScreen('screen-start'));
    document.getElementById('btn-stats-reset').addEventListener('click', () => resetGame());
    document.getElementById('btn-stats-home').addEventListener('click', () => showScreen('screen-start'));
    document.getElementById('btn-next').addEventListener('click', () => nextLevel());
    showRecordLine();
  }

  function startGame(level) {
    state.level = level;
    state.game = createAcornGame(level);
    window.__game = state.game;
    showScreen('screen-game');
    document.getElementById('basket-cap').textContent = state.game.capacity;
    document.getElementById('mission').textContent =
      '🎯 篮子 ' + state.game.capacity + ' 格，装出最高的价值！';
    renderItems();
    renderBasket();
    updateStatus();
    setFeedback('', '');
    document.getElementById('record').textContent = '';
    document.getElementById('hint').textContent = '点松果装进篮子，再点拿出来！';
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function renderItems() {
    const g = state.game;
    const zone = document.getElementById('item-zone');
    zone.innerHTML = g.items.map(it => {
      const inBasket = g.isIn(it.id);
      return '<button class="item-card' + (inBasket ? ' in-basket' : '') + '" data-item="' + it.id + '">' +
        '<span class="item-face">' + it.name + '</span>' +
        '<span class="item-meta">⚖️ ' + it.w + ' 格 · ⭐ ' + it.v + ' 松子</span>' +
        (inBasket ? '<br><small>🧺 在篮子里</small>' : '') +
        '</button>';
    }).join('');
    zone.querySelectorAll('.item-card').forEach(card => {
      card.addEventListener('click', () => onItemClick(Number(card.dataset.item)));
    });
  }

  function renderBasket() {
    const g = state.game;
    const basket = document.getElementById('basket');
    const slots = [];
    for (let i = 0; i < g.capacity; i++) {
      slots.push('<div class="b-slot' + (i < g.currentW ? ' filled' : '') + '">' +
        (i < g.currentW ? basketFaceAt(g, i) : '') + '</div>');
    }
    basket.innerHTML = slots.join('');
    document.getElementById('basket-fill').textContent = g.currentW;
  }

  function basketFaceAt(g, slotIdx) {
    // 按装入顺序填格
    let idx = 0;
    let face = '';
    g.items.forEach(it => {
      if (!g.isIn(it.id)) return;
      for (let k = 0; k < it.w; k++) {
        if (idx === slotIdx) face = it.name;
        idx++;
      }
    });
    return face;
  }

  function onItemClick(id) {
    const g = state.game;
    if (g.isFinished) return;
    const it = g.items.find(x => x.id === id);
    if (g.isIn(id)) {
      g.toggleItem(id);
      playSound('correct');
      setFeedback('取出 ' + it.name + '！', 'ok');
    } else {
      const ok = g.toggleItem(id);
      if (ok) {
        playSound('pop');
        setFeedback('装进 ' + it.name + '！⭐+' + it.v, 'ok');
      } else {
        playSound('wrong');
        const basket = document.getElementById('basket');
        basket.classList.remove('overload');
        void basket.offsetWidth;
        basket.classList.add('overload');
        setFeedback('篮子装不下啦！先取出一些吧～', 'no');
      }
    }
    renderItems();
    renderBasket();
    updateStatus();
  }

  function onFinish() {
    const g = state.game;
    if (g.isFinished) return;
    g.finish();
    playSound('win');
    const s = g.getStats();
    document.getElementById('animal-face').classList.add('celebrate');
    setTimeout(() => document.getElementById('animal-face').classList.remove('celebrate'), 700);
    showRecord(s.stars, s.totalV);
    showStatsPage(s);
  }

  function updateStatus() {
    const g = state.game;
    document.getElementById('steps').textContent =
      '价值 ⭐ ' + g.currentV + ' · 占了 ' + g.currentW + '/' + g.capacity + ' 格';
  }

  // ---------- 结算 ----------
  function showStatsPage(s) {
    showScreen('screen-stats');
    const isOpt = s.totalV === s.optimalV;
    document.getElementById('stats-title').textContent = '装好啦！' + '⭐'.repeat(s.stars);
    // ===== 奖励评价 =====
    const rewardEl = document.getElementById('stats-reward');
    if (rewardEl) {
      const praise = { 3: '🏆 太棒了！你是算法小天才！', 2: '🎖️ 好厉害！再来一次，冲击三星！', 1: '💪 很棒！多玩几次会更好！' }[s.stars] || '🎉 完成啦！';
      rewardEl.style.display = 'block';
      rewardEl.innerHTML = '<div class="confetti"><span>🎉</span><span>⭐</span><span>✨</span><span>🎊</span><span>🌟</span></div>' +
        '<div class="reward-text">' + praise + '</div>';
    }
    const optFaces = s.optimalSet.map(id => state.game.items.find(i => i.id === id).name).join(' + ');
    document.getElementById('race-card').innerHTML =
      '<div class="big">🟢 你装了 ⭐ ' + s.totalV + ' 松子</div>' +
      '<div>🟠 贪心（先拿最值钱的）会得 ⭐ ' + s.greedyV + '</div>' +
      '<div>🟡 最优可以装 ⭐ ' + s.optimalV + '（' + optFaces + '）</div>' +
      (isOpt
        ? '<div class="big">🌟 你就是最优！</div>'
        : '<div>💡 光拿最值钱的不够——看看下面格子表的小秘密！</div>');
    renderDpGrid(s);
    document.getElementById('stats-box').innerHTML =
      '<div>🐻 小秘密：一格一格算"这个容量最多装多少"（放 or 不放，取更好的）——这就是动态规划！</div>' +
      '<div>贪心只看眼前，DP 站在前一格的肩膀上！</div>';
    const btnNext = document.getElementById('btn-next');
    btnNext.style.display = state.level < 3 ? 'block' : 'none';
    if (state.level >= 3) {
      document.getElementById('stats-title').textContent = '🎉 三关全通！' + '⭐'.repeat(s.stars);
    }
  }

  function renderDpGrid(s) {
    // DP 表可视化：行=物品，列=容量，最优格高亮
    const el = document.getElementById('dp-grid');
    if (!el) return;
    const table = s.dpTable;
    let html = '<div class="dp-title">🧮 小松鼠的格子表（每个格子 = 该容量最多能装多少）</div><table>';
    html += '<tr><th>容量</th>' + table[0].map((_, c) => '<th>' + c + '</th>').join('') + '</tr>';
    for (let i = 1; i < table.length; i++) {
      const it = state.game.items[i - 1];
      html += '<tr><th>' + it.name + '</th>';
      for (let c = 0; c <= state.game.capacity; c++) {
        const cls = (i === table.length - 1 && c === state.game.capacity) ? ' opt' : '';
        html += '<td class="' + cls + '">' + table[i][c] + '</td>';
      }
      html += '</tr>';
    }
    html += '</table>';
    el.innerHTML = html;
  }

  function recordKey() { return 'acorn-best-l' + state.level; }

  function showRecord(stars, v) {
    const el = document.getElementById('record');
    const key = recordKey();
    const prev = Number(localStorage.getItem(key) || 0);
    if (prev === 0 || v > prev) {
      localStorage.setItem(key, String(v));
      el.textContent = '🏆 新纪录！⭐ ' + v;
      el.style.color = '#ff7043';
    } else {
      el.textContent = '最佳 ⭐ ' + prev;
      el.style.color = '#8a7a5f';
    }
    showRecordLine();
  }

  function showRecordLine() {
    const el = document.getElementById('record-line');
    if (!el) return;
    const parts = [];
    for (let lv = 1; lv <= 3; lv++) {
      const v = localStorage.getItem('acorn-best-l' + lv);
      parts.push('第 ' + lv + ' 关：' + (v === null ? '未通关' : '⭐' + v));
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