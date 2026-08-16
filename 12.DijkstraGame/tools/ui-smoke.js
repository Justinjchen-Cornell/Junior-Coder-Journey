// 《小猪省钱路》UI 冒烟（Edge）
const { chromium } = require('playwright-core');
const path = require('path');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const URL = 'file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/') + '?fast=1';

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
  const log = [];
  const check = (name, cond) => { log.push(`${cond ? '✅' : '❌'} ${name}`); if (!cond) process.exitCode = 1; };

  await page.goto(URL);
  check('标题', (await page.title()) === '小猪省钱路 🐷');
  await page.click('[data-animal="🐰"]');
  await page.click('.mode-btn.baby');

  // 宝宝模式：地图 + 走邻居到终点
  check('地图渲染', await page.$('.map svg') !== null);
  check('起点🏠/终点🏫标记', await page.$('.station.end') !== null);
  // 布局检查：节点在画布内 + 边权标签互不重叠
  const layout = await page.evaluate(() => {
    const svg = document.querySelector('.map svg');
    const vb = svg.viewBox.baseVal;
    const out = [];
    document.querySelectorAll('.station').forEach(g => {
      const t = g.getAttribute('transform');
      const m = t.match(/translate\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?)\)/);
      if (m) {
        const x = Number(m[1]), y = Number(m[2]);
        if (x < 0 || y < 0 || x > vb.width || y > vb.height) out.push('node ' + x + ',' + y);
      }
    });
    const labels = [];
    document.querySelectorAll('.edge-label').forEach(t => {
      labels.push({ x: Number(t.getAttribute('x')), y: Number(t.getAttribute('y')) });
    });
    let close = 0;
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        const d = Math.hypot(labels[i].x - labels[j].x, labels[i].y - labels[j].y);
        if (d < 24) close++;
      }
    }
    return { out, close, labels: labels.length, vb: vb.width + 'x' + vb.height };
  });
  check('节点无越界（' + layout.vb + '）', layout.out.length === 0);
  check('标签互不重叠（' + layout.labels + ' 个标签）', layout.close === 0);
  // 节点两两距离检查（≥55，终点不与中间节点覆盖）
  const spacing = await page.evaluate(() => {
    const pts = [];
    document.querySelectorAll('.station').forEach(g => {
      const t = g.getAttribute('transform');
      const m = t.match(/translate\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?)\)/);
      if (m) pts.push({ x: Number(m[1]), y: Number(m[2]) });
    });
    let min = Infinity;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        min = Math.min(min, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
      }
    }
    return min;
  });
  check('节点最小间距 ' + spacing.toFixed(0) + ' ≥55', spacing >= 55);
  // 近道可见 + 终点在最上层
  const vis = await page.evaluate(() => {
    const alts = document.querySelectorAll('.map-line.alt').length;
    const sts = document.querySelectorAll('.station');
    const last = sts[sts.length - 1];
    return { alts, lastIsEnd: last.getAttribute('data-station') === String(window.__game.end) };
  });
  check('存在近道虚线（替代路线可见）', vis.alts >= 1);
  check('终点绘制在最上层', vis.lastIsEnd);
  // 多条路线保证：边数 > 节点数-1（存在环 → 有选择）
  const topo = await page.evaluate(() => {
    const g = window.__game;
    return { edges: g.edges.length, nodes: g.nodeCount };
  });
  check('存在替代路线（边 ' + topo.edges + ' > 树 ' + (topo.nodes - 1) + '）', topo.edges > topo.nodes - 1);
  const baby = await page.evaluate(() => {
    const g = window.__game;
    // 用 BFS 距离引导走向终点
    const dist = new Map([[g.end, 0]]);
    const q = [g.end];
    while (q.length) {
      const c = q.shift();
      g.edges.filter(e => e.a === c || e.b === c).forEach(e => {
        const nb = e.a === c ? e.b : e.a;
        if (!dist.has(nb)) { dist.set(nb, dist.get(c) + 1); q.push(nb); }
      });
    }
    let guard = 0;
    while (!g.isDone && guard++ < 30) {
      const cur = g.currentNode;
      const nbs = g.edges.filter(e => e.a === cur || e.b === cur).map(e => e.a === cur ? e.b : e.a);
      const next = nbs.sort((x, y) => dist.get(x) - dist.get(y))[0];
      g.travelTo(next);
    }
    return { done: g.isDone, total: g.currentTotal, optimal: g.getStats().optimal };
  });
  check('宝宝走到终点', baby.done);
  check('总价 ≥ 最优', baby.total >= baby.optimal);

  // 挑战模式：完整 Dijkstra 操作
  await page.click('#btn-home');
  await page.click('.mode-btn.challenge');
  check('挑战面板初始（起点0 其他∞）', await page.$eval('[data-station="0"] .coin-label', el => el.textContent) === '0');
  const ch = await page.evaluate(() => {
    const g = window.__game;
    let guard = 0;
    while (!g.isDone && guard++ < 200) {
      const panel = g.getPanel();
      let best = null;
      panel.forEach((p, id) => {
        if (!p.processed && p.cost < Infinity && (best === null || p.cost < best.cost)) best = { id, cost: p.cost };
      });
      if (best === null) break;
      g.pickStation(best.id);
    }
    return { done: g.isDone, total: g.getStats().totalCost, optimal: g.getStats().optimal, mistakes: g.mistakes };
  });
  check('挑战 Dijkstra 完成', ch.done);
  check('总价 = 最优（非负权保证）', ch.total === ch.optimal);
  check('零错误', ch.mistakes === 0);

  // --- 🚜 工程队送货模式（神奇的本子） ---
  await page.click('#btn-home');
  await page.click('.mode-btn.team');
  check('工程队任务横幅', (await page.$eval('#mission', el => el.textContent)).includes('工地'));
  check('神奇的本子出现', await page.$('#notebook') !== null);
  const team = await page.evaluate(() => {
    const g = window.__game;
    let guard = 0;
    while (!g.isDone && guard++ < 200) {
      const nb = g.getNotebook();
      if (!nb.length) break;
      g.pickStation(nb[0].id);
    }
    return { done: g.isDone, total: g.getStats().totalCost, optimal: g.getStats().optimal };
  });
  check('工程队本子驱动通关', team.done);
  check('工程队总价 = 最优', team.total === team.optimal);

  console.log(log.join('\n'));
  await browser.close();
  console.log(process.exitCode ? '\n有失败项 ❌' : '\n小猪省钱路冒烟全部通过 🎉');
})();
