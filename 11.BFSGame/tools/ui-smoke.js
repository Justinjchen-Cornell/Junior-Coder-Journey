// 《小猴子找朋友》UI 冒烟（Edge）
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
  check('标题', (await page.title()) === '小猴子找朋友 🐒');
  await page.click('[data-animal="🐰"]');
  await page.click('.mode-btn.baby');

  // 宝宝模式：UI 接线 + 钩子通关
  check('森林图渲染', await page.$('.forest svg') !== null);
  check('目标❓标记可见', await page.$('.target-badge') !== null);
  check('任务横幅显示', await page.$('#mission') !== null);
  check('起点已亮', await page.$('[data-node="0"].found') !== null);
  check('起点标记在节点上方', await page.$('[data-node="0"] .start-badge') !== null);
  check('预言三选一出现', (await page.$$('.predict-opt')).length === 3);
  // 提交预言（读正确选项）
  await page.evaluate(() => {
    const po = window.__game.predictionOptions();
    document.querySelector('[data-pred="' + po.correct + '"]').click();
  });
  check('预言后扩散按钮出现', await page.$('#btn-expand') !== null);

  const baby = await page.evaluate(() => {
    const g = window.__game;
    let guard = 0;
    while (!g.isDone && guard++ < 20) g.expand();
    return { done: g.isDone, steps: g.getStats().steps, found: g.foundLevel };
  });
  check('宝宝钩子通关', baby.done);
  check('圈数 = 最短步数', baby.steps === baby.found);
  // 真实 UI 流：重开一局（先预言再扩散）→ 验证最短路径金线
  await page.click('#btn-reset');
  await page.evaluate(() => {
    const po = window.__game.predictionOptions();
    document.querySelector('[data-pred="' + po.correct + '"]').click();
  });
  for (let i = 0; i < 20; i++) {
    const hint = await page.$eval('#hint', el => el.textContent);
    if (hint.includes('找到啦')) break;
    const btn = await page.$('#btn-expand');
    if (!btn || !await btn.isVisible()) break;
    await page.click('#btn-expand');
  }
  await page.waitForTimeout(400);
  const hint2 = await page.$eval('#hint', el => el.textContent);
  check('UI 按钮流找到目标', hint2.includes('找到啦'));
  check('预言成真提示', await page.$eval('#feedback', el => el.textContent).then(t => t.includes('预言成真')));
  check('最短路径金线出现', (await page.$$('.forest .path-line')).length >= 1);
  check('目标揭晓为小动物', await page.$('.node.found .target-badge') !== null);

  // 挑战模式：猜目标 + 布局越界检查
  await page.click('#btn-home');
  await page.click('.mode-btn.challenge');
  check('挑战节点 ≥12', (await page.$$('.forest .node')).length >= 12);
  const bounds = await page.evaluate(() => {
    const svg = document.querySelector('.forest svg');
    const vb = svg.viewBox.baseVal;
    const out = [];
    document.querySelectorAll('.forest .node').forEach(g => {
      const t = g.getAttribute('transform');
      const m = t.match(/translate\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?)\)/);
      if (m) {
        const x = Number(m[1]), y = Number(m[2]);
        if (x < 0 || y < 0 || x > vb.width || y > vb.height) out.push(x + ',' + y);
      }
    });
    return { out, vb: vb.width + 'x' + vb.height };
  });
  check('挑战布局无越界（' + bounds.vb + '）', bounds.out.length === 0);
  const ch = await page.evaluate(() => {
    const g = window.__game;
    const ok = g.guess(g.target);
    return { ok, done: g.isDone };
  });
  check('挑战猜目标成功', ch.ok && ch.done);

  console.log(log.join('\n'));
  await browser.close();
  console.log(process.exitCode ? '\n有失败项 ❌' : '\n小猴子找朋友冒烟全部通过 🎉');
})();
