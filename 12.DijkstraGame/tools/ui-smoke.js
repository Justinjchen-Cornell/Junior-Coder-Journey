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

  console.log(log.join('\n'));
  await browser.close();
  console.log(process.exitCode ? '\n有失败项 ❌' : '\n小猪省钱路冒烟全部通过 🎉');
})();
