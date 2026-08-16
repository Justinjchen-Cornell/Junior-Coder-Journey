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
  check('起点已亮', await page.$('[data-node="0"].found') !== null);
  check('扩散按钮', await page.$('#btn-expand') !== null);

  const baby = await page.evaluate(() => {
    const g = window.__game;
    let guard = 0;
    while (!g.isDone && guard++ < 20) g.expand();
    return { done: g.isDone, steps: g.getStats().steps, found: g.foundLevel };
  });
  check('宝宝钩子通关', baby.done);
  check('圈数 = 最短步数', baby.steps === baby.found);

  // 挑战模式：猜目标
  await page.click('#btn-home');
  await page.click('.mode-btn.challenge');
  check('挑战节点 ≥12', (await page.$$('.forest .node')).length >= 12);
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
