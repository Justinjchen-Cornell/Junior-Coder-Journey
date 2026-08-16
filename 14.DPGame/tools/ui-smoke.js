// 《小松鼠装松果》UI 冒烟（Edge）
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
  check('标题', (await page.title()) === '小松鼠装松果 🐿️');
  check('三关按钮', (await page.$$('.level-btn')).length === 3);

  // 第 1 关：真实点击装最优组合
  await page.click('[data-level="1"]');
  check('物品卡渲染', (await page.$$('.item-card')).length === 3);
  check('篮子格条渲染', (await page.$$('.b-slot')).length === 4);
  const opt1 = await page.evaluate(() => window.__game.getStats().optimalSet);
  for (const id of opt1) {
    await page.click('[data-item="' + id + '"]');
  }
  await page.click('#btn-finish');
  await page.waitForSelector('#screen-stats.active', { timeout: 5000 });
  check('第 1 关装最优通关', await page.isVisible('#screen-stats'));
  check('三重对比显示', (await page.$eval('#race-card', el => el.textContent)).includes('最优'));
  check('DP 网格出现', await page.$('#dp-grid table') !== null);

  // 超重测试：第 2 关先装大件再装中件 → 超重提示
  await page.click('#btn-stats-home');
  await page.click('[data-level="2"]');
  await page.click('[data-item="0"]');   // 大蘑菇 4 格
  await page.click('[data-item="1"]');   // 中栗子 2 格 → 超重
  check('超重后状态未变（1 件在篮）', (await page.$$('.item-card.in-basket')).length === 1);
  check('篮子晃动提示', await page.$('.basket.overload') !== null);

  // 第 2 关贪心陷阱数据验证
  const trap = await page.evaluate(() => {
    const s = window.__game.getStats();
    return { greedy: s.greedyV, opt: s.optimalV };
  });
  check('第 2 关陷阱（贪心 ' + trap.greedy + ' < 最优 ' + trap.opt + '）', trap.greedy < trap.opt);

  // 第 3 关通关（最优组合）
  await page.click('#btn-home');
  await page.click('[data-level="3"]');
  const opt3 = await page.evaluate(() => window.__game.getStats().optimalSet);
  for (const id of opt3) {
    await page.click('[data-item="' + id + '"]');
  }
  await page.click('#btn-finish');
  await page.waitForSelector('#screen-stats.active', { timeout: 5000 });
  check('第 3 关通关', await page.isVisible('#screen-stats'));
  check('三关全通庆祝', (await page.$eval('#stats-title', el => el.textContent)).includes('三关全通'));

  console.log(log.join('\n'));
  await browser.close();
  console.log(process.exitCode ? '\n有失败项 ❌' : '\n小松鼠装松果冒烟全部通过 🎉');
})();
