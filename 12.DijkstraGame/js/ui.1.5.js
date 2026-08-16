// 《小猪省钱路》UI 层（SVG 地图 + 价格面板 + 松弛动画 + 金线 + 音效 + 纪录）
(function () {
  'use strict';

  const ANIMALS = ['🐰', '🐻', '🦊', '🐱', '🐸'];
  const PIG_FACES = ['🏠', '🐭', '🐰', '🦊', '🐻', '🐨', '🐷', '🏫'];
  const TEAM_FACES = ['🚜', '🚧', '🏭', '🏢', '⛽', '📦', '🏗️', '🛠️'];
  function isTeam() { return state.mode === 'team'; }
  function unitName() { return isTeam() ? '公里' : '硬币'; }
  function startFace() { return isTeam() ? '🚜' : '🏠'; }
  function endFace() { return isTeam() ? '🏗️' : '🏫'; }
  function stationFace(id) {
    const g = state.game;
    if (id === g.start) return startFace();
    if (id === g.end) return endFace();
    return (isTeam() ? TEAM_FACES : PIG_FACES)[id % 8];
  }
  const state = { mode: 'baby', animal: '🐷', game: null, pos: null };

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
    state.animal = animal || '🐷';
    state.mode = mode || 'baby';
    state.game = createPigGame(state.mode);
    window.__game = state.game;
    document.getElementById('animal-face').textContent = isTeam() ? '🚜' : '🐷';
    document.getElementById('mission').textContent = isTeam()
      ? '🎯 从 🚜 基地 到 🏗️ 工地，公里数最少！'
      : '🎯 从 🏠 家 到 🏫 学校，硬币最少！';
    showScreen('screen-game');
    renderMap();
    updateUI();
    setFeedback('', '');
    document.getElementById('record').textContent = '';
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // ---------- SVG 地图（分层布局：起点左、终点右、中间按深度分列） ----------
  function renderMap() {
    const g = state.game;
    const W = 820, H0 = 400;
    const n = g.nodeCount;
    const maxDepth = Math.max(...g.depth.map(d => d.d));
    // 中间节点布局：x 只在中间区域 [midMinX, midMaxX]，起点/终点独立锚定（绝不重叠）
    const midMinX = 200, midMaxX = W - 200;
    const groups = {};
    g.depth.forEach(({ id, d }) => {
      if (id === g.start || id === g.end) return;   // 起点/终点不参与分层
      (groups[d] = groups[d] || []).push(id);
    });
    const maxCount = Math.max(1, ...Object.values(groups).map(a => a.length));
    const yStep = Math.min(96, (H0 - 110) / Math.max(maxCount, 1));
    const H = Math.max(H0, 140 + maxCount * yStep);
    const pos = {};
    Object.keys(groups).forEach(d => {
      const ids = groups[d];
      ids.forEach((id, i) => {
        const x = midMinX + (Number(d) / Math.max(maxDepth, 1)) * (midMaxX - midMinX);
        const y = H / 2 + (i - (ids.length - 1) / 2) * yStep;
        pos[id] = { x, y };
      });
    });
    // 起点/终点锚定（故事锚点，左右两端，远离中间节点区）
    pos[g.start] = { x: 95, y: H / 2 };
    pos[g.end] = { x: W - 95, y: H / 2 };
    // 松弛防重叠：任意两节点距离 < 68 → 沿 y 推开（限制在画布内）
    const ids = Object.keys(pos).map(Number);
    for (let it = 0; it < 12; it++) {
      let moved = false;
      for (let i = 0; i < ids.length && !moved; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = pos[ids[i]], b = pos[ids[j]];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 68) {
            const push = (68 - d) / 2 + 6;
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

    let lines = '';
    const drawn = new Set();
    const drawnEdges = [];                 // 已画边（标签避让检查用）
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
      // 边权标签：中点 + 垂直方向偏移 + 碰撞避免（自动推远）
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const px = -dy / len, py = dx / len;          // 边的垂直方向
      let off = 18 * (idx % 2 === 0 ? 1 : -1);
      let lx = mx0(a, b) + px * off, ly = my0(a, b) + py * off;
      for (let g2 = 0; g2 < 10; g2++) {
        const nearNode = nodePosList.some(p => Math.hypot(lx - p.x, ly - p.y) < 36);
        const nearLabel = placedLabels.some(l => Math.hypot(lx - l.x, ly - l.y) < 36);
        // 压在别的边线上？点到所有边的距离 < 20
        const onEdge = drawnEdges.some(e2 => {
          const p1 = pos[e2.a], p2 = pos[e2.b];
          return pointSegDist(lx, ly, p1.x, p1.y, p2.x, p2.y) < 20;
        });
        if (!nearNode && !nearLabel && !onEdge) break;
        off += 16 * (off >= 0 ? 1 : -1);
        lx = mx0(a, b) + px * off;
        ly = my0(a, b) + py * off;
      }
      placedLabels.push({ x: lx, y: ly });
      drawnEdges.push(e);
      lines += '<text class="edge-label" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '">' +
        e.w + (isTeam() ? 'km' : '💰') + '</text>';
    });
    function mx0(a, b) { return (a.x + b.x) / 2; }
    function my0(a, b) { return (a.y + b.y) / 2; }

    let stations = '';
    for (let i = 0; i < n; i++) {
      const p = pos[i];
      const face = stationFace(i);
      stations += '<g class="station" data-station="' + i + '" transform="translate(' + p.x + ',' + p.y + ')">' +
        '<circle r="28"></circle>' +
        '<text class="face" y="-1">' + face + '</text>' +
        '<text class="coin-label" y="44">∞</text>' +
        '</g>';
    }
    document.getElementById('map').innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '">' + lines + stations + '</svg>';
    bindStations();
  }

  function bindStations() {
    document.querySelectorAll('.station').forEach(st => {
      st.addEventListener('click', () => onStationClick(Number(st.dataset.station)));
    });
  }

  // ---------- 面板/状态更新 ----------
  function updateUI() {
    const g = state.game;
    const panel = g.getPanel();
    document.querySelectorAll('.station').forEach(st => {
      const id = Number(st.dataset.station);
      const p = panel[id];
      const label = st.querySelector('.coin-label');
      label.textContent = p.processed ? '✅' + (p.cost === Infinity ? '' : p.cost) : (p.cost === Infinity ? '∞' : p.cost);
      st.classList.toggle('processed', p.processed);
      st.classList.toggle('cur', state.mode === 'baby' && id === g.currentNode);
      st.classList.toggle('end', id === g.end);
    });
    const steps = document.getElementById('steps');
    steps.textContent = state.mode === 'baby'
      ? '已花 ' + g.currentTotal + ' ' + unitName()
      : '已定案 ' + panel.filter(p => p.processed).length + ' 站';
    if (isTeam()) renderNotebook();
  }

  // 神奇的本子：未定案已发现基地，按公里数升序，第一行高亮
  function renderNotebook() {
    const g = state.game;
    const rows = g.getNotebook();
    const panel = g.getPanel();
    const el = document.getElementById('notebook-rows');
    if (!el) return;
    if (!rows.length) {
      el.innerHTML = '<div class="nb-row top"><span class="nb-face">🏗️</span>工地就在眼前！<span class="nb-km">' +
        (panel[g.end].cost === Infinity ? '∞' : panel[g.end].cost) + ' 公里</span></div>';
      return;
    }
    // 比较旧公里数 → 更新过的行加闪光
    const prevKms = state.nbKms || {};
    state.nbKms = {};
    rows.forEach(r => { state.nbKms[r.id] = r.cost; });
    el.innerHTML = rows.map((r, i) => {
      const flashed = prevKms[r.id] !== undefined && prevKms[r.id] > r.cost ? ' flash' : '';
      return '<div class="nb-row' + (i === 0 ? ' top' : '') + '" data-nbid="' + r.id + '">' +
        '<span class="nb-face">' + faceOf(r.id) + '</span>' +
        '<span>' + r.id + ' 号基地</span>' +
        '<span class="nb-km' + flashed + '">' + r.cost + ' 公里</span></div>';
    }).join('');
  }

  function setHint(msg) { document.getElementById('hint').textContent = msg; }

  function setFeedback(msg, cls) {
    const el = document.getElementById('feedback');
    el.className = 'feedback ' + cls;
    el.textContent = msg;
  }

  // ---------- 点击站 ----------
  function onStationClick(id) {
    const g = state.game;
    if (g.isDone) return;
    if (state.mode === 'baby') {
      // 宝宝：从当前站沿边走
      const ok = g.travelTo(id);
      if (ok) {
        playSound('correct');
        const e = g.edges.find(e => (e.a === g.currentNode && e.b === id) || (e.a === id && e.b === g.currentNode));
        setFeedback((isTeam() ? '走了 ' : '花了 ') + (e ? e.w : '?') + ' ' + unitName() + '！', 'ok');
        if (g.isDone) finishWin();
        else updateUI();
      } else {
        playSound('wrong');
        setFeedback('小猪现在在别的地方哦，只能走相邻的路！', 'no');
      }
    } else {
      // 挑战：Dijkstra 选站
      if (g.pickStation(id)) {
        playSound('correct');
        if (g.isDone) { finishWin(); return; }
        setFeedback('✅ ' + faceOf(id) + ' 站定案了！看看价格面板刷新！', 'ok');
        updateUI();
      } else {
        playSound('wrong');
        if (isTeam()) {
          const nb = g.getNotebook();
          const top = nb.length ? nb[0] : null;
          setFeedback(top
            ? '翻开本子看看？' + faceOf(top.id) + '（' + top.cost + ' ' + unitName() + '）最近，先处理它！'
            : '本子上还没有基地，先处理别的站！', 'no');
        } else {
          setFeedback('要选"价格最小"的站哦！看看哪个数字最小？', 'no');
        }
      }
    }
  }

  function faceOf(id) { return stationFace(id); }

  // ---------- 结算 ----------
  function finishWin() {
    const g = state.game;
    const stats = g.getStats();
    playSound('win');
    document.getElementById('animal-face').classList.add('celebrate');
    setTimeout(() => document.getElementById('animal-face').classList.remove('celebrate'), 700);
    if (state.mode === 'challenge') drawShortestPath();
    setHint(isTeam()
      ? '🎉 材料送到工地！总路程 ' + stats.totalCost + ' 公里！'
      : '🎉 到学校啦！花了 ' + stats.totalCost + ' 个硬币！');
    showRecord(stats.stars, state.mode === 'baby' ? stats.totalCost : stats.mistakes);
    showStatsPage(stats);
  }

  function drawShortestPath() {
    const g = state.game;
    const path = g.getShortestPath();
    if (!path || !state.pos) return;
    let pl = '';
    for (let i = 0; i < path.length - 1; i++) {
      const a = state.pos[path[i]], b = state.pos[path[i + 1]];
      pl += '<line class="path-line" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"></line>';
    }
    const svg = document.querySelector('.map svg');
    if (svg) svg.insertAdjacentHTML('beforeend', pl);
  }

  function showStatsPage(stats) {
    showScreen('screen-stats');
    const isOpt = stats.totalCost === stats.optimal;
    document.getElementById('stats-title').textContent = '到学校啦！' + '⭐'.repeat(stats.stars);
    // ===== 奖励评价 =====
    const rewardEl = document.getElementById('stats-reward');
    if (rewardEl) {
      const praise = { 3: '🏆 太棒了！你是算法小天才！', 2: '🎖️ 好厉害！再来一次，冲击三星！', 1: '💪 很棒！多玩几次会更好！' }[stats.stars] || '🎉 完成啦！';
      rewardEl.style.display = 'block';
      rewardEl.innerHTML = '<div class="confetti"><span>🎉</span><span>⭐</span><span>✨</span><span>🎊</span><span>🌟</span></div>' +
        '<div class="reward-text">' + praise + '</div>';
    }
    const modeMsg = state.mode === 'challenge'
      ? '<div>🐻 小秘密：每次都去"最便宜的一站"（贪心），到了就更新邻居的价格（松弛）——这就是 Dijkstra！</div>' +
        '<div>💡 如果有一条路"倒贴' + unitName() + '"（负权），这个方法会失灵——现实世界没有这种路！</div>'
      : (isTeam()
        ? '<div>🐻 本子把最近的基地排最前（优先队列），处理第一行 + 松弛重排 = Dijkstra！</div>' +
          '<div>最优路线只要 ' + stats.optimal + ' 公里' + (isOpt ? '——你找到啦！🌟' : '（你走了 ' + stats.totalCost + '）——金线画出来啦！') + '</div>'
        : '<div>🐻 最优路线只要 ' + stats.optimal + ' 个硬币' + (isOpt ? '——你找到啦！🌟' : '（你花了 ' + stats.totalCost + '）——金线画出来啦，下次走这条！') + '</div>');
    document.getElementById('stats-box').innerHTML =
      '<div class="big">' + (isTeam() ? '走了 ' : '花了 ') + stats.totalCost + ' ' + unitName() + (isOpt ? '（最优！🌟）' : '') + '</div>' +
      '<div>最优只要：' + stats.optimal + ' ' + unitName() + '</div>' +
      (state.mode === 'challenge' ? '<div>错误：' + stats.mistakes + ' 次</div>' : '') +
      modeMsg;
  }

  function recordKey() { return 'pig-best-' + state.mode + '-' + state.animal; }

  function showRecord(stars, score) {
    const el = document.getElementById('record');
    const key = recordKey();
    const prev = Number(localStorage.getItem(key) || 0);
    if (prev === 0 || score < prev) {
      localStorage.setItem(key, String(score));
      el.textContent = '🏆 新纪录！' + score + (state.mode === 'baby' ? ' ' + unitName() : ' 错误');
      el.style.color = '#ff7043';
    } else {
      el.textContent = '最佳 ' + prev;
      el.style.color = '#8a7a5f';
    }
  }

  function resetGame() { startGame(state.animal, state.mode); }

  document.addEventListener('DOMContentLoaded', initUI);
})();