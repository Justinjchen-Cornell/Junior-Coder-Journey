// 《猜猜它是谁》UI 层（SVG 特征图 + 距离线 + K 选择 + 投票 + 结算对比 + 音效 + 纪录）
(function () {
  'use strict';

  const state = { level: 1, game: null };
  const CLASS_FACES = ['🐰', '🐢', '🦊'];
  const CLASS_COLORS = ['#7cb342', '#5c9cff', '#ff8a50'];

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
    document.getElementById('btn-reset').addEventListener('click', () => resetGame());
    document.getElementById('btn-home').addEventListener('click', () => showScreen('screen-start'));
    document.getElementById('btn-stats-reset').addEventListener('click', () => resetGame());
    document.getElementById('btn-stats-home').addEventListener('click', () => showScreen('screen-start'));
    document.getElementById('btn-next').addEventListener('click', () => nextLevel());
    showRecordLine();
  }

  function startGame(level) {
    state.level = level;
    state.game = createKnnGame(level);
    window.__game = state.game;
    showScreen('screen-game');
    renderPlot();
    renderKZone();
    renderVoteZone();
    updateStatus();
    setFeedback('', '');
    document.getElementById('record').textContent = '';
    document.getElementById('hint').textContent = '点已知动物当邻居（最多 K 个），再投票！';
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // ---------- 特征图 ----------
  function renderPlot() {
    const g = state.game;
    const W = 720, H = 330;
    const px = x => 60 + (x / 100) * (W - 120);
    const py = y => H - 40 - (y / 100) * (H - 80);

    let known = '';
    g.animals.forEach(a => {
      known += '<g class="known-animal" data-animal="' + a.id + '" transform="translate(' +
        px(a.x).toFixed(1) + ',' + py(a.y).toFixed(1) + ')">' +
        '<circle r="22" fill="#fff" stroke="' + CLASS_COLORS[a.cls % CLASS_COLORS.length] + '"></circle>' +
        '<text>' + CLASS_FACES[a.cls % CLASS_FACES.length] + '</text>' +
        '</g>';
    });
    const t = g.target;
    known += '<g class="target-animal" transform="translate(' + px(t.x).toFixed(1) + ',' + py(t.y).toFixed(1) + ')">' +
      '<circle r="26"></circle><text>❓</text></g>';
    document.getElementById('plot').innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '">' + known + '</svg>';
    bindPlot();
  }

  function bindPlot() {
    document.querySelectorAll('.known-animal').forEach(el => {
      el.addEventListener('click', () => onAnimalClick(Number(el.dataset.animal)));
    });
  }

  function renderLines() {
    const g = state.game;
    const W = 720, H = 330;
    const px = x => 60 + (x / 100) * (W - 120);
    const py = y => H - 40 - (y / 100) * (H - 80);
    const svg = document.querySelector('.plot svg');
    if (!svg) return;
    document.querySelectorAll('.knn-line, .knn-dist').forEach(e => e.remove());
    g.neighbors.forEach(id => {
      const a = g.animals.find(x => x.id === id);
      const d = Math.hypot(a.x - g.target.x, a.y - g.target.y).toFixed(1);
      const midX = (px(a.x) + px(g.target.x)) / 2;
      const midY = (py(a.y) + py(g.target.y)) / 2;
      svg.insertAdjacentHTML('beforeend',
        '<line class="knn-line" x1="' + px(g.target.x) + '" y1="' + py(g.target.y) +
        '" x2="' + px(a.x) + '" y2="' + py(a.y) + '"></line>' +
        '<text class="knn-dist" x="' + midX + '" y="' + midY + '">' + d + '</text>');
    });
    document.querySelectorAll('.known-animal').forEach(el => {
      const id = Number(el.dataset.animal);
      el.classList.toggle('selected', g.neighbors.includes(id));
    });
  }

  function onAnimalClick(id) {
    const g = state.game;
    if (g.voted) return;
    if (g.toggleNeighbor(id)) {
      playSound('pop');
    } else {
      playSound('wrong');
      setFeedback('邻居最多 ' + g.k + ' 个哦！先取消一个再选～', 'no');
      return;
    }
    renderLines();
    updateStatus();
    setFeedback('已选 ' + g.neighborCount + '/' + g.k + ' 个邻居', 'ok');
  }

  // ---------- K 选择（第 3 关） ----------
  function renderKZone() {
    const g = state.game;
    const zone = document.getElementById('k-zone');
    if (g.level !== 3) { zone.innerHTML = '<span class="k-label">邻居数 K = ' + g.k + '</span>'; return; }
    zone.innerHTML = [1, 3, 5].map(kk =>
      '<button class="k-btn' + (g.k === kk ? ' active' : '') + '" data-k="' + kk + '">K=' + kk + '</button>').join('');
    zone.querySelectorAll('.k-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        g.setK(Number(btn.dataset.k));
        playSound('pop');
        renderKZone();
        renderLines();
        updateStatus();
        setFeedback('K=' + g.k + '：选最近的 ' + g.k + ' 个邻居', 'ok');
      });
    });
  }

  // ---------- 投票 ----------
  function renderVoteZone() {
    const g = state.game;
    const zone = document.getElementById('vote-zone');
    zone.innerHTML = g.classes.map((face, i) =>
      '<button class="vote-btn" data-vote="' + i + '">它可能是 ' + face + '</button>').join('');
    zone.querySelectorAll('.vote-btn').forEach(btn => {
      btn.addEventListener('click', () => onVote(Number(btn.dataset.vote)));
    });
  }

  function onVote(cls) {
    const g = state.game;
    if (g.voted) return;
    if (g.neighborCount < g.k) {
      playSound('wrong');
      setFeedback('先选满 ' + g.k + ' 个邻居再投票哦！', 'no');
      return;
    }
    const ok = g.vote(cls);
    playSound(ok ? 'win' : 'wrong');
    if (ok) setFeedback('🎉 猜对啦！它是 ' + CLASS_FACES[g.trueClass] + ' 蹦蹦族！', 'ok');
    else setFeedback('咦？它是 ' + CLASS_FACES[g.trueClass] + '……看看邻居投票？', 'no');
    setTimeout(finishWin, 800);
  }

  // ---------- 结算 ----------
  function finishWin() {
    const g = state.game;
    const s = g.getStats();
    document.getElementById('animal-face').classList.add('celebrate');
    setTimeout(() => document.getElementById('animal-face').classList.remove('celebrate'), 700);
    showRecord(s.stars, s.neighborsOk && s.voteCorrect ? 0 : 1);
    showStatsPage(s);
  }

  function showStatsPage(s) {
    showScreen('screen-stats');
    document.getElementById('stats-title').textContent = '猜完啦！' + '⭐'.repeat(s.stars);
    // ===== 奖励评价 =====
    const rewardEl = document.getElementById('stats-reward');
    if (rewardEl) {
      const praise = { 3: '🏆 太棒了！你是算法小天才！', 2: '🎖️ 好厉害！再来一次，冲击三星！', 1: '💪 很棒！多玩几次会更好！' }[s.stars] || '🎉 完成啦！';
      rewardEl.style.display = 'block';
      rewardEl.innerHTML = '<div class="confetti"><span>🎉</span><span>⭐</span><span>✨</span><span>🎊</span><span>🌟</span></div>' +
        '<div class="reward-text">' + praise + '</div>';
    }
    const yourNb = state.game.neighbors.map(id => CLASS_FACES[state.game.animals.find(a => a.id === id).cls]).join('');
    const trueNb = s.trueNearestIds.map(id => CLASS_FACES[state.game.animals.find(a => a.id === id).cls]).join('');
    const kMsg = state.level === 3
      ? '<div>💡 K=1 听噪声 / K=3 刚刚好 / K=5 抹边界——试试不同 K！</div>'
      : (state.level === 2
        ? '<div>💡 最近的 1 个可能是噪声！看 K 个邻居投票才稳！</div>'
        : '<div>💡 物以类聚——最近的邻居们就是答案！</div>');
    document.getElementById('race-card').innerHTML =
      '<div class="big">答案是 ' + CLASS_FACES[s.trueClass] + ' 蹦蹦族！</div>' +
      '<div>🟢 你选的邻居：' + yourNb + '（投票 → ' + CLASS_FACES[s.voteResult] + '）</div>' +
      '<div>🟡 真·最近 ' + s.k + ' 个：' + trueNb + '（投票 → ' + CLASS_FACES[s.voteResult] + '）</div>' +
      kMsg;
    document.getElementById('stats-box').innerHTML =
      '<div>🐻 小秘密：距离近 = 长得像（物以类聚）。K 个最近邻居投票 = KNN！</div>' +
      '<div>这是机器学习的入门第一招——推荐系统、猜你喜欢都是它！</div>';
    const btnNext = document.getElementById('btn-next');
    btnNext.style.display = state.level < 3 ? 'block' : 'none';
    if (state.level >= 3) {
      document.getElementById('stats-title').textContent = '🎉 三关全通！' + '⭐'.repeat(s.stars);
    }
  }

  function nextLevel() {
    if (state.level < 3) startGame(state.level + 1);
  }

  function recordKey() { return 'knn-best-l' + state.level; }

  function showRecord(stars, err) {
    const el = document.getElementById('record');
    const key = recordKey();
    const prev = Number(localStorage.getItem(key) || 0);
    if (prev === 0 || err < prev) {
      localStorage.setItem(key, String(err));
      el.textContent = '🏆 新纪录！' + (err === 0 ? '全对' : '错 1 次');
      el.style.color = '#ff7043';
    } else {
      el.textContent = '最佳 ' + (prev === 0 ? '全对' : '错 ' + prev + ' 次');
      el.style.color = '#8a7a5f';
    }
    showRecordLine();
  }

  function showRecordLine() {
    const el = document.getElementById('record-line');
    if (!el) return;
    const parts = [];
    for (let lv = 1; lv <= 3; lv++) {
      const v = localStorage.getItem('knn-best-l' + lv);
      parts.push('第 ' + lv + ' 关：' + (v === null ? '未通关' : (v === '0' ? '全对' : '错 ' + v + ' 次')));
    }
    el.textContent = '🏅 ' + parts.join(' ｜ ');
  }

  function updateStatus() {
    const g = state.game;
    document.getElementById('steps').textContent = '邻居 ' + g.neighborCount + '/' + g.k;
  }

  function setFeedback(msg, cls) {
    const el = document.getElementById('feedback');
    el.className = 'feedback ' + cls;
    el.textContent = msg;
  }

  function resetGame() { startGame(state.level); }

  document.addEventListener('DOMContentLoaded', initUI);
})();