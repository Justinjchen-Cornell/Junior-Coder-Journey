// 《套娃拆拆乐》v2 UI（嵌套盒视觉 + 开盒动画 + 回溯传递动画 + 追踪玩法）
(function () {
  'use strict';

  const ANIMALS = ['🐰', '🐻', '🦊', '🐱', '🐸'];
  const SURPRISES = ['✨', '🌸', '🍀', '⭐', '🍬', '🎈'];
  const state = { mode: 'baby', animal: '🐿️', game: null, surprises: [] };

  // ---------- 音效 ----------
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
    state.surprises = [];
    document.getElementById('animal-face').textContent = state.animal;
    showScreen('screen-game');
    renderOuter();
    setHint('小松鼠的礼物塔！点「打开」，看看里面藏着什么');
    setFeedback('', '');
    document.getElementById('record').textContent = '';
    document.getElementById('steps').textContent = '';
    document.getElementById('backtrack-zone').innerHTML = '';
    document.getElementById('btn-open').style.display = 'inline-block';
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // ---------- 嵌套盒视觉 ----------
  function renderOuter() {
    // 最外层大盒（尚未拆开：看不到里面的）
    const zone = document.getElementById('nest-zone');
    zone.innerHTML =
      '<div class="box-wrap reveal">' +
      '<div class="box box1"><div class="box-face">🎁</div><div class="box-lid"></div></div>' +
      '</div>';
  }

  function renderNested(opened, myValue, surprise) {
    // 拆开第 opened 层：显示"盒子里还有更小的盒子"的嵌套视觉
    const zone = document.getElementById('nest-zone');
    let inner = '';
    for (let i = 0; i < opened; i++) inner += '<div class="ring ring' + ((i % 3) + 1) + '"></div>';
    zone.innerHTML =
      '<div class="box-wrap">' +
      '<div class="box box1"><div class="box-face">🎁</div></div>' +
      '<div class="box box2"><div class="box-face">🎁</div></div>' +
      inner +
      '<div class="inner-box reveal">' +
      '<div class="inner-face">' + (surprise ? surprise : '🪆') + '</div>' +
      '<div class="layer-tag">+ ' + myValue + '</div>' +
      '</div>' +
      '</div>';
    if (surprise) playSound('pop');
  }

  function renderEmpty() {
    // 空盒（基线）：最小最里面——什么也没有
    const zone = document.getElementById('nest-zone');
    zone.innerHTML =
      '<div class="box-wrap">' +
      '<div class="box box1"></div><div class="box box2"></div><div class="box box3"></div>' +
      '<div class="inner-box base reveal"><div class="inner-face">✨</div>' +
      '<div class="layer-tag">空的！返回 0</div></div>' +
      '</div>';
  }

  // ---------- 拆（递归下降） ----------
  function onOpen() {
    const g = state.game;
    if (g.isBaseReached) return;
    const r = g.openNext();
    if (r.isBase) {
      renderEmpty();
      setHint('✨ 空的！最小的盒子什么也没有——这就是「基线」，它返回 0');
      playSound('correct');
      document.getElementById('btn-open').style.display = 'none';
      setTimeout(() => {
        if (state.mode === 'baby') babyBacktrack();
        else challengeTrace();
      }, 900);
    } else {
      // 30% 概率本层藏惊喜
      const surprise = Math.random() < 0.3 ? SURPRISES[Math.floor(Math.random() * SURPRISES.length)] : null;
      if (surprise) {
        state.surprises.push(surprise);
        setHint('第 ' + r.layer + ' 层！哇，藏着一个 ' + surprise + '！继续开～');
      } else {
        setHint('第 ' + r.layer + ' 层！里面好像还有……继续开～');
      }
      renderNested(r.layer, r.myValue, surprise);
      playSound('pop');
      updateStatus();
    }
  }

  // ---------- 宝宝模式：回溯动画（答案从里往外传） ----------
  function babyBacktrack() {
    const g = state.game;
    setHint('数回来！空盒说「0」，一层层往外传……');
    let running = 0;
    const zone = document.getElementById('nest-zone');
    const timer = setInterval(() => {
      running += 1;   // 每层 +1（宝宝模式）
      if (running > g.layers) {
        clearInterval(timer);
        askBabyTotal();
        return;
      }
      // 数字气泡从里往外传
      zone.innerHTML =
        '<div class="box-wrap">' +
        '<div class="bubble travel reveal">' + running + '</div>' +
        '</div>';
      playSound('correct');
    }, 650);
  }

  function askBabyTotal() {
    const n = state.game.layers;
    const options = [n - 1, n, n + 1];
    document.getElementById('backtrack-zone').innerHTML =
      '<div class="hint">一共几个盒子？</div>' +
      options.map(v => '<button class="num-btn" data-ans="' + v + '">' + v + '</button>').join('');
    document.querySelectorAll('[data-ans]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.game.answer(Number(btn.dataset.ans))) { playSound('win'); onWin(); }
        else { playSound('wrong'); setFeedback('再数数看？', 'no'); }
      });
    });
  }

  // ---------- 挑战模式：递归追踪（亲手执行返回值传递） ----------
  function challengeTrace() {
    setHint('现在算回来！空盒返回 0，一层层往外加……');
    renderTraceStep();
  }

  function renderTraceStep() {
    const g = state.game;
    const step = g.getCurrentStep();
    if (!step) return;
    const zone = document.getElementById('nest-zone');
    zone.innerHTML =
      '<div class="box-wrap">' +
      '<div class="trace-card reveal">' +
      '<div class="trace-in">里面传来 <b>' + step.innerResult + '</b></div>' +
      '<div class="trace-plus">＋ 这个盒子上的 <b class="trace-num">' + step.myValue + '</b></div>' +
      '<div class="trace-eq">= ？</div>' +
      '</div>' +
      '</div>';
    document.getElementById('backtrack-zone').innerHTML =
      step.options.map(v => '<button class="num-btn" data-opt="' + v + '">' + v + '</button>').join('');
    document.querySelectorAll('[data-opt]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (g.isDone) return;
        if (g.submitTrace(Number(btn.dataset.opt))) {
          playSound('correct');
          if (g.isDone) { playSound('win'); onWin(); }
          else renderTraceStep();
        } else {
          playSound('wrong');
          setFeedback('再算算？里面传来 ' + step.innerResult + '，加上 ' + step.myValue + ' 是多少？', 'no');
        }
      });
    });
  }

  // ---------- 结算 ----------
  function onWin() {
    const stats = state.game.getStats();
    setHint('🎉 拆完啦！' + '⭐'.repeat(stats.stars) +
      (state.surprises.length ? ' 收集了 ' + state.surprises.join('') : ''));
    document.getElementById('animal-face').classList.add('celebrate');
    setTimeout(() => document.getElementById('animal-face').classList.remove('celebrate'), 700);
    showRecord(stats.stars, stats.mistakes);
    showStatsPage(stats);
  }

  function showStatsPage(stats) {
    showScreen('screen-stats');
    document.getElementById('stats-title').textContent = '拆完啦！' + '⭐'.repeat(stats.stars);
    document.getElementById('stats-box').innerHTML =
      '<div class="big">一共 ' + stats.layers + ' 层盒子，答案 ' + stats.finalResult + '</div>' +
      '<div>错误：' + stats.mistakes + ' 次</div>' +
      (state.surprises.length ? '<div>惊喜收集：' + state.surprises.join(' ') + '</div>' : '') +
      '<div>🐻 递归小秘密：</div>' +
      '<div>拆 = 一路往下问；空盒 = 基线（返回 0）；</div>' +
      '<div>数回来 = 答案一层层往外传（这就是递归！）</div>';
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
    document.getElementById('steps').textContent =
      '拆开 ' + state.game.openedCount + '/' + state.game.layers + ' 层';
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
