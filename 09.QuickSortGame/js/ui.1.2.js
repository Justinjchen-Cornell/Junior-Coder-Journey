// 《书架整理员》UI 层（书架 + 书堆 + 标杆 + 分堆 + 音效 + 纪录）
(function () {
  'use strict';

  const ANIMALS = ['🐰', '🐻', '🦊', '🐱', '🐸'];
  const BOOK_FACES = ['📕', '📗', '📘', '📙', '📔', '📒', '📓'];
  const state = { mode: 'baby', animal: '📚', game: null };

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

  function bookHtml(book, cls, opts) {
    opts = opts || {};
    const h = opts.h || (30 + book.value * 10);
    return '<div class="book ' + (cls || '') + '" data-id="' + book.id +
      '" style="--h:' + h + 'px' + (opts.w ? ';width:' + opts.w : '') + '">' +
      '<span class="b-animal">' + BOOK_FACES[(book.value - 1) % BOOK_FACES.length] + '</span>' +
      '<span class="b-num">' + book.value + '</span></div>';
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
    state.animal = animal || '📚';
    state.mode = mode || 'baby';
    state.game = createSortGame(state.mode);
    document.getElementById('animal-face').textContent = state.animal;
    showScreen('screen-game');
    renderShelf();
    renderPile();
    setHint('抽一本当标杆！随便选哪本都行～');
    setFeedback('', '');
    document.getElementById('record').textContent = '';
    window.__game = state.game;   // 测试钩子
    updateStatus();
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function renderShelf() {
    const shelf = document.getElementById('shelf');
    shelf.innerHTML = state.game.books.map(() => '<div class="slot"></div>').join('');
  }

  function renderPile() {
    const g = state.game;
    const ids = g.currentStackTop;
    const zone = document.getElementById('pending-zone');
    zone.className = 'pending-zone';
    // 层级徽章：让孩子看到"分而治之"进行到第几层
    const badge = g.currentLevel > 1
      ? '<div class="level-badge">🔍 第 ' + g.currentLevel + ' 层分堆 · 正在分这一堆</div>'
      : '<div class="level-badge">📚 第一层：先分这一大堆</div>';
    zone.innerHTML = badge + '<div class="book-pile">' +
      ids.map(id => bookHtml(g.books.find(b => b.id === id), 'pickable')).join('') +
      '</div>';
    zone.querySelectorAll('.book').forEach(bk => {
      bk.addEventListener('click', () => onPick(Number(bk.dataset.id)));
    });
    document.getElementById('classify-zone').innerHTML = '';
    document.getElementById('pivot-zone').innerHTML = '';
    renderWaiting();
  }

  // 等待队列：还没分的堆（递归"右边等着"可视化）
  function renderWaiting() {
    const g = state.game;
    const waiting = g.waitingStacks;
    const el = document.getElementById('waiting-zone');
    if (!el) return;
    if (!waiting.length) { el.innerHTML = ''; return; }
    el.innerHTML = '<div class="waiting-label">⏳ 还有 ' + waiting.length + ' 堆等着分（先分完这一堆）</div>' +
      waiting.map(w =>
        '<span class="waiting-chip">' + w.count + ' 本 · 第 ' + w.level + ' 层</span>').join('');
  }

  function onPick(id) {
    if (!state.game.pickPivot(id)) return;
    const g = state.game;
    const pivot = g.books.find(b => b.id === g.pivotId);
    document.getElementById('pivot-zone').innerHTML =
      '<div class="pivot-label">📏 标杆</div>' + bookHtml(pivot, '');
    document.getElementById('pending-zone').innerHTML = '';
    setHint('比标杆 ' + pivot.value + ' 小的放左边，大的放右边！');
    playSound('pop');
    renderClassify();
    updateStatus();
  }

  function renderClassify() {
    const g = state.game;
    const book = g.pendingBook === null ? null : g.books.find(b => b.id === g.pendingBook);
    const zone = document.getElementById('pending-zone');
    if (!book) { zone.innerHTML = ''; return; }
    zone.innerHTML = bookHtml(book, '');
    document.getElementById('classify-zone').innerHTML =
      '<button class="side-btn small" data-side="small">📖 更小<br><small>放左边</small></button>' +
      '<button class="side-btn big" data-side="big">📖 更大<br><small>放右边</small></button>';
    document.querySelectorAll('.side-btn').forEach(btn => {
      btn.addEventListener('click', () => onClassify(btn.dataset.side));
    });
  }

  function onClassify(side) {
    const g = state.game;
    const r = g.classify(side);
    if (r === true) {
      playSound('correct');
      setFeedback('放对啦！', 'ok');
      if (g.isDone) { finishWin(); return; }
      if (g.pendingBook === null) {
        placePivot();
        setTimeout(() => {
          setHint(g.isDone ? '' : '这堆分完啦！下一堆继续～');
          renderPile();
        }, 400);
      } else {
        renderClassify();
      }
    } else {
      playSound('wrong');
      setFeedback('想一想：这本书和标杆比' + (r.correctSide === 'small' ? '更小' : '更大') + '，应该放' +
        (r.correctSide === 'small' ? '左边' : '右边'), 'no');
    }
    updateStatus();
  }

  function placePivot() {
    const g = state.game;
    const placed = g.getStats().placed;
    placed.forEach((slot, id) => {
      const bk = g.books.find(b => b.id === id);
      const slotEl = document.querySelectorAll('.shelf .slot')[slot];
      if (slotEl && !slotEl.querySelector('.sbook')) {
        slotEl.innerHTML = '<div class="sbook book" style="--h:' + (30 + bk.value * 8) + 'px">' +
          '<span class="b-animal">' + BOOK_FACES[(bk.value - 1) % BOOK_FACES.length] + '</span>' +
          '<span class="b-num">' + bk.value + '</span></div>';
      }
    });
  }

  function finishWin() {
    placePivot();
    mergeCascade();   // 合并动画：1→n 依次点亮（合并结果）
    const stats = state.game.getStats();
    playSound('win');
    setHint('🎉 书架排好啦！' + '⭐'.repeat(stats.stars));
    document.getElementById('animal-face').classList.add('celebrate');
    setTimeout(() => document.getElementById('animal-face').classList.remove('celebrate'), 700);
    showRecord(stats.stars, stats.mistakes);
    showStatsPage(stats);
  }

  function mergeCascade() {
    // 第 3 步：合并——书架上的书按 1→n 依次发光（"排好了！"）
    const shelf = document.querySelectorAll('.shelf .slot');
    const g = state.game;
    let i = 0;
    const timer = setInterval(() => {
      if (i >= shelf.length) { clearInterval(timer); return; }
      const bk = shelf[i].querySelector('.sbook');
      if (bk) {
        bk.classList.add('merge-glow');
        playSound('correct');
      }
      i++;
    }, 180);
  }

  function showStatsPage(stats) {
    showScreen('screen-stats');
    const lt = document.getElementById('life-task');
    if (lt) lt.textContent = '🏠 回家试试：整理书架试试「分两堆再分两堆」！';
    document.getElementById('stats-title').textContent = '书架排好啦！' + '⭐'.repeat(stats.stars);

    // ===== 奖励评价 =====
    const rewardEl = document.getElementById('stats-reward');
    if (rewardEl) {
      const praise = { 3: '🏆 太棒了！你是算法小天才！', 2: '🎖️ 好厉害！再来一次，冲击三星！', 1: '💪 很棒！多玩几次会更好！' }[stats] || '🎉 完成啦！';
      rewardEl.style.display = 'block';
      rewardEl.innerHTML = '<div class="confetti"><span>🎉</span><span>⭐</span><span>✨</span><span>🎊</span><span>🌟</span></div>' +
        '<div class="reward-text">' + praise + '</div>';
    }

    const roundMsg = state.mode === 'challenge'
      ? '<div class="big">你抽了 ' + stats.rounds + ' 次标杆</div>' +
        '<div>最厉害只要 ' + stats.theoreticalRounds + ' 次（每次都挑中间的书！）</div>' +
        (stats.rounds > stats.theoreticalRounds
          ? '<div>💡 下次试试：挑「不高不矮」的那本当标杆，分得最快！</div>'
          : '<div>🏆 你就是标杆大师！</div>')
      : '<div class="big">分堆 ' + stats.compares + ' 次，全部排好！</div>';
    document.getElementById('stats-box').innerHTML =
      roundMsg +
      '<div>错误：' + stats.mistakes + ' 次</div>' +
      '<div>🐻 小秘密：把书分成两堆、每堆再分——这就是电脑排序的魔法（分而治之）！</div>' +
      '<div>标杆选得好（中间），堆分得均匀，就最快！</div>';
  }

  function recordKey() { return 'book-best-' + state.mode + '-' + state.animal; }

  function showRecord(stars, score) {
    if (stars === 3) localStorage.setItem('forest-badge-09', '1');
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
    document.getElementById('steps').textContent = '书架 ' + g.getStats().placed.size + '/' + g.books.length;
    document.getElementById('rounds').textContent =
      state.mode === 'challenge' ? '标杆 ' + g.rounds + ' 次' : '';
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