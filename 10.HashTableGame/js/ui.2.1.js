// 《小动物储物柜》UI 层（柜子墙 + 号码表 + 开柜 + 链柜 + 音效 + 纪录）
(function () {
  'use strict';

  const ANIMALS = ['🐰', '🐻', '🦊', '🐱', '🐸'];
  const state = { mode: 'baby', animal: '🔐', game: null };

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
    state.animal = animal || '🔐';
    state.mode = mode || 'baby';
    state.game = createLockerGame(state.mode);
    window.__game = state.game;
    document.getElementById('animal-face').textContent = state.animal;
    showScreen('screen-game');
    renderLockers();
    renderTarget();
    renderHashTable();
    setFeedback('', '');
    document.getElementById('record').textContent = '';
    updateStatus();
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // ---------- 渲染 ----------
  function renderLockers() {
    const wall = document.getElementById('locker-wall');
    const lockerNums = [...new Set(state.game.items.map(i => i.locker))];
    wall.innerHTML = lockerNums.map(n =>
      '<div class="locker" data-locker="' + n + '">' +
      '<span class="locker-num">' + n + '</span>' +
      '<span class="locker-handle"></span></div>').join('');
    wall.querySelectorAll('.locker').forEach(lk => {
      lk.addEventListener('click', () => onOpenLocker(Number(lk.dataset.locker)));
    });
  }

  function renderTarget() {
    const t = state.game.currentTarget;
    const el = document.getElementById('target-item');
    if (!t) { el.innerHTML = '🎉 都取完啦！'; return; }
    if (state.mode === 'team') {
      // 工程队：显示工具 + 大编号 → 孩子先算"格子号"
      el.innerHTML = '<div class="reveal">要取：' + t.name + ' <span class="real-id">编号 ' + t.realId + '</span></div>';
      document.getElementById('hint').textContent = '🚜 规则：编号去尾（%100）就是格子号！它该进几号格子？';
      document.getElementById('collision-zone').innerHTML = '';
      renderHashOptions(t);
    } else {
      el.innerHTML = '<div class="reveal">要取：' + t.name + '</div>';
      document.getElementById('hint').textContent = '查号码表，点它所在的柜子！';
    }
  }

  // 工程队：算格子号（3 选 1，陷阱 = 原编号）
  function renderHashOptions(t) {
    const g = state.game;
    const h = g.hashOptions(t.realId);
    document.getElementById('collision-zone').innerHTML =
      '<div class="hash-question">' + t.name + '（编号 ' + t.realId + '）去尾后是几号格子？</div>' +
      '<div class="chain-items">' +
      h.options.map(o => '<div class="hash-option" data-hash="' + o + '">' + o + ' 号</div>').join('') +
      '</div>';
    document.querySelectorAll('.hash-option').forEach(ho => {
      ho.addEventListener('click', () => onHashPick(Number(ho.dataset.hash)));
    });
  }

  function onHashPick(chosen) {
    const g = state.game;
    const r = g.submitHash(chosen);
    if (r && r.ok) {
      // 算对了！开格
      const lk = document.querySelector('[data-locker="' + chosen + '"]');
      if (lk) { lk.classList.add('open'); setTimeout(() => lk.classList.add('checked'), 350); }
      if (r.found) {
        playSound('correct');
        setFeedback('算一次 + 开一次 = 找到！O(1)！', 'ok');
        setTimeout(() => {
          if (g.isDone) finishWin();
          else { renderTarget(); updateStatus(); }
        }, 500);
      } else if (r.collision) {
        playSound('pop');
        setFeedback('这个格子有两件（编号冲突）！篮子里找目标～', 'no');
        document.getElementById('collision-zone').innerHTML =
          '<div class="chain-hint">🧺 篮子里有：</div>' +
          '<div class="chain-items">' +
          r.items.map(i => '<div class="chain-item" data-chain-id="' + i.id + '">' + i.name +
            '<small class="chain-tag">' + i.realId + '</small></div>').join('') +
          '</div>';
        document.querySelectorAll('.chain-item').forEach(ci => {
          ci.addEventListener('click', () => onConfirmChain(Number(ci.dataset.chainId)));
        });
      }
    } else {
      playSound('wrong');
      setFeedback('再看看？' + t.realId + ' 去尾后 = ' + (t.realId % 100) + ' 号', 'no');
    }
  }

  function renderHashTable() {
    const g = state.game;
    if (state.mode === 'team') {
      document.getElementById('hash-table').innerHTML =
        '<div class="ht-title">🚜 工程队规则（哈希函数）</div>' +
        '<div class="ht-row">编号去尾 = 格子号：<b>编号 % 100</b></div>' +
        '<div class="ht-row">例：37 → 37 号格 · 137 → 37 号格（冲突→篮子里）</div>';
      return;
    }
    const rows = g.items.map(i =>
      '<span class="ht-item">' + i.name + '→' + i.locker + ' 号</span>').join('');
    document.getElementById('hash-table').innerHTML =
      '<div class="ht-title">📋 号码表（哈希表）</div>' +
      '<div class="ht-row">' + rows + '</div>';
  }

  // ---------- 开柜 ----------
  function onOpenLocker(n) {
    const g = state.game;
    if (g.isDone) return;
    const r = g.openLocker(n);
    if (r.ok && r.found) {
      // O(1) 直接开中！
      const lk = document.querySelector('[data-locker="' + n + '"]');
      if (lk) { lk.classList.add('open'); setTimeout(() => lk.classList.add('checked'), 350); }
      playSound('correct');
      setFeedback('一下就找到！O(1) 开柜！', 'ok');
      setTimeout(() => {
        if (g.isDone) finishWin();
        else { renderTarget(); updateStatus(); }
      }, 400);
    } else if (r.ok && r.collision) {
      // 冲突柜：链上翻找
      const lk = document.querySelector('[data-locker="' + n + '"]');
      if (lk) lk.classList.add('open');
      playSound('pop');
      setFeedback('柜子里有两件！点你要的那件～', 'no');
      document.getElementById('collision-zone').innerHTML =
        '<div class="chain-hint">🔗 这个柜子挂了链子，里面有两件：</div>' +
        '<div class="chain-items">' +
        r.items.map(i => '<div class="chain-item" data-chain-id="' + i.id + '">' + i.name + '</div>').join('') +
        '</div>';
      document.querySelectorAll('.chain-item').forEach(ci => {
        ci.addEventListener('click', () => onConfirmChain(Number(ci.dataset.chainId)));
      });
    } else {
      playSound('wrong');
      setFeedback('不是这个柜子哦，想一想：号码表上它写的是几号柜？', 'no');
    }
  }

  function onConfirmChain(id) {
    const g = state.game;
    if (g.confirmTarget(id)) {
      playSound('correct');
      setFeedback('找到啦！不过链上翻了好久……', 'no');
      document.getElementById('collision-zone').innerHTML = '';
      setTimeout(() => {
        if (g.isDone) finishWin();
        else { renderTarget(); updateStatus(); }
      }, 400);
    } else {
      playSound('wrong');
      setFeedback('不是这件，再找找？', 'no');
    }
  }

  // ---------- 结算 ----------
  function finishWin() {
    const stats = state.game.getStats();
    playSound('win');
    setHint('🎉 全部取到！' + '⭐'.repeat(stats.stars));
    document.getElementById('animal-face').classList.add('celebrate');
    setTimeout(() => document.getElementById('animal-face').classList.remove('celebrate'), 700);
    showRecord(stats.stars, stats.mistakes);
    showStatsPage(stats);
  }

  function showStatsPage(stats) {
    showScreen('screen-stats');
    const lt = document.getElementById('life-task');
    if (lt) lt.textContent = '🏠 回家试试：给家里的遥控器/水杯贴号码，做个号码表！';
    document.getElementById('stats-title').textContent = '全部取到啦！' + '⭐'.repeat(stats.stars);

    // ===== 奖励评价 =====
    const rewardEl = document.getElementById('stats-reward');
    if (rewardEl) {
      const praise = { 3: '🏆 太棒了！你是算法小天才！', 2: '🎖️ 好厉害！再来一次，冲击三星！', 1: '💪 很棒！多玩几次会更好！' }[stats] || '🎉 完成啦！';
      rewardEl.style.display = 'block';
      rewardEl.innerHTML = '<div class="confetti"><span>🎉</span><span>⭐</span><span>✨</span><span>🎊</span><span>🌟</span></div>' +
        '<div class="reward-text">' + praise + '</div>';
    }

    const teamMsg = state.mode === 'team'
      ? '<div>🧺 冲突篮子里翻了 ' + stats.collisionFinds + ' 次</div>' +
        '<div>💡 每次找工具 = 算一次（去尾）+ 开一次格——这就是 O(1)！</div>' +
        '<div>137 和 37 挤一个格子就要翻篮子——格子多（空间换时间）就不挤！</div>'
      : '';
    const collisionMsg = state.mode === 'challenge'
      ? '<div>链上翻了 ' + stats.collisionFinds + ' 次（冲突柜）</div>' +
        (stats.collisionFinds > 0
          ? '<div>💡 两个东西挤一个柜子就要翻好久——柜号发得好，全都一次开中！</div>'
          : '<div>🏆 你避开了所有冲突柜！</div>')
      : '';
    document.getElementById('stats-box').innerHTML =
      '<div class="big">开了 ' + stats.openCount + ' 次柜，取到 ' + stats.total + ' 件</div>' +
      '<div>错误：' + stats.mistakes + ' 次</div>' +
      (state.mode === 'team' ? teamMsg : collisionMsg) +
      '<div>🐻 小秘密：号码表就是"哈希表"——查号直接开柜 = 一下就找到！</div>' +
      '<div>柜号发得好（哈希函数好），柜子不挤；全挤一起就慢了！</div>';
  }

  function recordKey() { return 'locker-best-' + state.mode + '-' + state.animal; }

  function showRecord(stars, score) {
    if (stars === 3) localStorage.setItem('forest-badge-10', '1');
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
    document.getElementById('steps').textContent =
      '取到 ' + g.getStats().found + '/' + g.items.length + ' 件';
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