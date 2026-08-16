// 《蚂蚁找食物》UI 层（SVG 路线图 + 亮点呼吸 + 蚂蚁爬行 + 竞速结算 + 音效 + 纪录）
(function () {
  'use strict';

  const FACE_EMOJI = ['🐜', '🐞', '🐝', '🦗', '🦋', '🐌', '🐛', '🦟'];
  const state = { level: 1, game: null, pos: null, prevCosts: null };

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
    state.game = createAntGame(level);
    window.__game = state.game;
    state.pos = null;
    state.prevCosts = null;
    showScreen('screen-game');
    renderMap();
    updateUI();
    setFeedback('', '');
    document.getElementById('record').textContent = '';
    document.getElementById('hint').textContent = '点亮点（金色呼吸光）指挥蚂蚁！';
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // ---------- SVG 路线图（分层布局 + 防重叠 + 标签避让） ----------
  function renderMap() {
    const g = state.game;
    const W = 820, H0 = 400;
    const n = g.nodes.length;
    // 各节点到起点的跳数深度（分层布局）
    const depth = bfsDepth(g);
    const maxDepth = Math.max(...Object.values(depth));
    const midMinX = 210, midMaxX = W - 210;
    const groups = {};
    g.nodes.forEach(id => {
      if (id === g.start || id === g.end) return;
      (groups[depth[id]] = groups[depth[id]] || []).push(id);
    });
    const maxCount = Math.max(1, ...Object.values(groups).map(a => a.length));
    const yStep = Math.min(96, (H0 - 110) / Math.max(maxCount, 1));
    const H = Math.max(H0, 140 + maxCount * yStep);
    const pos = {};
    Object.keys(groups).forEach(d => {
      const ids = groups[d];
      ids.forEach((id, i) => {
        pos[id] = {
          x: midMinX + (Number(d) / Math.max(maxDepth, 1)) * (midMaxX - midMinX),
          y: H / 2 + (i - (ids.length - 1) / 2) * yStep,
        };
      });
    });
    pos[g.start] = { x: 100, y: H / 2 };
    pos[g.end] = { x: W - 100, y: H / 2 };
    // 松弛防重叠
    const ids = Object.keys(pos).map(Number);
    for (let it = 0; it < 12; it++) {
      let moved = false;
      for (let i = 0; i < ids.length && !moved; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = pos[ids[i]], b = pos[ids[j]];
          if (Math.hypot(a.x - b.x, a.y - b.y) < 70) {
            const push = (70 - Math.hypot(a.x - b.x, a.y - b.y)) / 2 + 6;
            const dir = a.y <= b.y ? -1 : 1;
            b.y = Math.min(H - 50, Math.max(50, b.y + push * dir));
            a.y = Math.min(H - 50, Math.max(50, a.y - push * dir));
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
    state.pos = pos;

    // 边 + 木牌标签（垂直偏移 + 碰撞避让）
    let lines = '';
    const drawn = new Set();
    const drawnEdges = [];
    const nodePosList = Object.values(pos);
    const placedLabels = [];
    function pointSegDist(px, py, x1, y1, x2, y2) {
      const dx = x2 - x1, dy = y2 - y1;
      const len2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
      return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    }
    g.edges.forEach((e, idx) => {
      const key = Math.min(e.a, e.b) + '-' + Math.max(e.a, e.b);
      if (drawn.has(key)) return;
      drawn.add(key);
      const a = pos[e.a], b = pos[e.b];
      lines += '<line class="map-line" data-edge="' + e.a + '-' + e.b + '" x1="' + a.x + '" y1="' + a.y +
        '" x2="' + b.x + '" y2="' + b.y + '"></line>';
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const px = -dy / len, py = dx / len;
      let off = 18 * (idx % 2 === 0 ? 1 : -1);
      let lx = (a.x + b.x) / 2 + px * off, ly = (a.y + b.y) / 2 + py * off;
      for (let g2 = 0; g2 < 10; g2++) {
        const nearNode = nodePosList.some(p => Math.hypot(lx - p.x, ly - p.y) < 36);
        const nearLabel = placedLabels.some(l => Math.hypot(lx - l.x, ly - l.y) < 36);
        const onEdge = drawnEdges.some(e2 => {
          const p1 = pos[e2.a], p2 = pos[e2.b];
          return pointSegDist(lx, ly, p1.x, p1.y, p2.x, p2.y) < 20;
        });
        if (!nearNode && !nearLabel && !onEdge) break;
        off += 16 * (off >= 0 ? 1 : -1);
        lx = (a.x + b.x) / 2 + px * off;
        ly = (a.y + b.y) / 2 + py * off;
      }
      placedLabels.push({ x: lx, y: ly });
      drawnEdges.push(e);
      lines += '<text class="edge-label" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '">' + e.w + '步</text>';
    });

    // 节点（终点最后绘制 → 最上层）
    let nodes = '';
    const order = [g.start].concat(g.nodes.filter(i => i !== g.start && i !== g.end), [g.end]);
    order.forEach(i => {
      const p = pos[i];
      const face = i === g.start ? '🐜' : (i === g.end ? '🍉' : FACE_EMOJI[i % FACE_EMOJI.length]);
      nodes += '<g class="node" data-node="' + i + '" transform="translate(' + p.x + ',' + p.y + ')">' +
        '<circle r="' + (i === g.end ? 32 : 28) + '"></circle>' +
        '<text class="face" y="-1">' + face + '</text>' +
        '<text class="sign" y="44">∞</text>' +
        '</g>';
    });
    document.getElementById('map').innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '">' + lines + nodes + '</svg>';
    bindNodes();
  }

  function bfsDepth(g) {
    const d = { [g.start]: 0 };
    const q = [g.start];
    while (q.length) {
      const c = q.shift();
      g.edges.filter(e => e.a === c || e.b === c).forEach(e => {
        const nb = e.a === c ? e.b : e.a;
        if (d[nb] === undefined) { d[nb] = d[c] + 1; q.push(nb); }
      });
    }
    return d;
  }

  function bindNodes() {
    document.querySelectorAll('.node').forEach(nd => {
      nd.addEventListener('click', () => onNodeClick(Number(nd.dataset.node)));
    });
  }

  // ---------- 状态更新 ----------
  function updateUI() {
    const g = state.game;
    const panel = g.getPanel();
    const light = g.getLight();
    const prev = state.prevCosts || {};
    document.querySelectorAll('.node').forEach(nd => {
      const id = Number(nd.dataset.node);
      const p = panel[id];
      const sign = nd.querySelector('.sign');
      const costText = p.cost === Infinity ? '∞' : p.cost + '步';
      const flashed = prev[id] !== undefined && prev[id] > p.cost ? ' flash' : '';
      sign.textContent = costText;
      sign.setAttribute('class', 'sign' + flashed);
      nd.classList.toggle('done', p.processed);
      nd.classList.toggle('light', id === light && !p.processed);
    });
    state.prevCosts = {};
    panel.forEach((p, id) => { state.prevCosts[id] = p.cost; });
    document.getElementById('steps').textContent =
      '蚂蚁已走 ' + (panel[g.end].cost === Infinity ? '?' : panel[g.end].cost) + ' 步';
  }

  // ---------- 点击节点 ----------
  function onNodeClick(id) {
    const g = state.game;
    if (g.isDone) return;
    const light = g.getLight();
    if (id !== light) {
      playSound('wrong');
      setFeedback('看亮点！金色呼吸光的路口才是最近的！', 'no');
      return;
    }
    const ok = g.moveTo(id);
    if (!ok) return;
    playSound('correct');
    if (g.isDone) {
      setFeedback('🐜 到西瓜啦！', 'ok');
      finishWin();
    } else {
      setFeedback('✅ ' + faceOf(id) + ' 定案！看看数字牌刷新～', 'ok');
      updateUI();
    }
  }

  function faceOf(id) {
    const g = state.game;
    return id === g.start ? '🐜' : (id === g.end ? '🍉' : FACE_EMOJI[id % FACE_EMOJI.length]);
  }

  // ---------- 结算：竞速对比 ----------
  function finishWin() {
    const g = state.game;
    const s = g.getStats();
    playSound('win');
    document.getElementById('animal-face').classList.add('celebrate');
    setTimeout(() => document.getElementById('animal-face').classList.remove('celebrate'), 700);
    drawRoutes(s);
    showRecord(s.stars, s.mistakes);
    showStatsPage(s);
  }

  function drawRoutes(s) {
    // 莽撞灰虚线 + 最优金线
    const svg = document.querySelector('.map svg');
    if (!svg) return;
    let pl = '';
    for (let i = 0; i < s.rashPath.length - 1; i++) {
      const a = state.pos[s.rashPath[i]], b = state.pos[s.rashPath[i + 1]];
      pl += '<line class="map-line rash" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"></line>';
    }
    for (let i = 0; i < s.optimalPath.length - 1; i++) {
      const a = state.pos[s.optimalPath[i]], b = state.pos[s.optimalPath[i + 1]];
      pl += '<line class="map-line opt" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"></line>';
    }
    svg.insertAdjacentHTML('beforeend', pl);
  }

  function showStatsPage(s) {
    showScreen('screen-stats');
    document.getElementById('stats-title').textContent = '到西瓜啦！' + '⭐'.repeat(s.stars);
    // ===== 奖励评价 =====
    const rewardEl = document.getElementById('stats-reward');
    if (rewardEl) {
      const praise = { 3: '🏆 太棒了！你是算法小天才！', 2: '🎖️ 好厉害！再来一次，冲击三星！', 1: '💪 很棒！多玩几次会更好！' }[s.stars] || '🎉 完成啦！';
      rewardEl.style.display = 'block';
      rewardEl.innerHTML = '<div class="confetti"><span>🎉</span><span>⭐</span><span>✨</span><span>🎊</span><span>🌟</span></div>' +
        '<div class="reward-text">' + praise + '</div>';
    }
    const rashWin = s.rashCost <= s.optimalCost;
    document.getElementById('race-card').innerHTML =
      '<div class="rash">🐜 莽撞蚂蚁：走了 ' + s.rashHops + ' 个路口，' + s.rashCost + ' 步</div>' +
      '<div class="smart">🐜 聪明蚂蚁：走了 ' + s.optimalHops + ' 个路口，' + s.optimalCost + ' 步</div>' +
      (rashWin
        ? '<div>🤔 这次莽撞的居然没输……</div>'
        : '<div class="big">🌟 岔路少 ≠ 步数少！聪明蚂蚁赢啦！</div>');
    document.getElementById('stats-box').innerHTML =
      '<div class="big">聪明蚂蚁 ' + s.optimalCost + ' 步（最优！）</div>' +
      '<div>错误：' + s.mistakes + ' 次</div>' +
      '<div>🐻 小秘密：金色亮点 = 当前最近的岔路口，每次处理它（贪心），数字牌就会刷新（松弛）——这就是 Dijkstra！</div>';
    const btnNext = document.getElementById('btn-next');
    btnNext.style.display = state.level < 3 ? 'block' : 'none';
    if (state.level >= 3) {
      document.getElementById('stats-title').textContent = '🎉 三关全通！' + '⭐'.repeat(s.stars);
    }
  }

  function nextLevel() {
    if (state.level < 3) startGame(state.level + 1);
  }

  function recordKey() { return 'ant-best-l' + state.level; }

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
    showRecordLine();
  }

  function showRecordLine() {
    const el = document.getElementById('record-line');
    if (!el) return;
    const parts = [];
    for (let lv = 1; lv <= 3; lv++) {
      const v = localStorage.getItem('ant-best-l' + lv);
      parts.push('第 ' + lv + ' 关：' + (v === null ? '未通关' : '错误 ' + v + ' 次'));
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