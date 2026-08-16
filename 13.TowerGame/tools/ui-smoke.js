// 《盖广播塔》UI 冒烟（Edge）
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
  check('标题', (await page.title()) === '盖广播塔 📡');
  check('三关按钮', (await page.$$('.level-btn')).length === 3);

  // 第 1 关：真实点击塔通关（贪心：每次选"还能盖最多"的）
  await page.click('[data-level="1"]');
  check('村庄渲染', (await page.$$('.village')).length === 5);
  check('塔按钮渲染', (await page.$$('.tower-btn')).length === 4);
  check('塔角标（贪心引导）', await page.$('.tower-badge') !== null);

  let guard = 0;
  while (guard++ < 20) {
    const onStats = await page.isVisible('#screen-stats');
    if (onStats) break;
    const done = await page.evaluate(() => window.__game.isDone);
    if (done) break;
    const best = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('.tower-btn:not(.built)')];
      let b = null, n = -1;
      btns.forEach(x => {
        const v = Number(x.querySelector('.tower-badge').textContent.replace(/[^0-9]/g, ''));
        if (v > n) { n = v; b = x; }
      });
      return b ? Number(b.dataset.tower) : null;
    });
    if (best === null) break;
    await page.click('[data-tower="' + best + '"]', { force: true });
    await page.waitForTimeout(100);
  }
  await page.waitForSelector('#screen-stats.active', { timeout: 8000 }).catch(() => {});
  check('第 1 关贪心通关', await page.isVisible('#screen-stats'));
  // 三重对比：你的/贪心/最优 三行 + 迷你地图金圈
  const raceTxt = await page.$eval('#race-card', el => el.textContent);
  check('三重对比显示（你的/贪心/最优）', raceTxt.includes('你用了') && raceTxt.includes('贪心') && raceTxt.includes('最优'));
  check('迷你地图出现', await page.$('#mini-map') !== null);
  check('最优塔金圈标记', (await page.$$('.mm-tower.optimal')).length >= 1);
  check('你的塔绿标记', (await page.$$('.mm-tower.mine')).length >= 1);

  // 第 2 关：陷阱验证 + 最优塔高亮（第 1 关已通关 → 用结算页返回）
  await page.click('#btn-stats-home');
  await page.click('[data-level="2"]');
  const trap = await page.evaluate(() => {
    const s = window.__game.getStats();
    return { greedy: s.greedyCount, opt: s.optimalCount };
  });
  check('第 2 关陷阱（贪心 ' + trap.greedy + ' > 最优 ' + trap.opt + '）', trap.greedy > trap.opt);

  // 悔棋功能
  await page.click('[data-tower="0"]');
  const before = await page.$eval('#steps', el => el.textContent);
  await page.click('#btn-undo');
  const after = await page.$eval('#steps', el => el.textContent);
  check('悔棋生效', before !== after);

  // 第 3 关通关
  await page.click('#btn-home');
  await page.click('[data-level="3"]');
  guard = 0;
  while (guard++ < 30) {
    const onStats = await page.isVisible('#screen-stats');
    if (onStats) break;
    const done2 = await page.evaluate(() => window.__game.isDone);
    if (done2) break;
    const best = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('.tower-btn:not(.built)')];
      let b = null, n = -1;
      btns.forEach(x => {
        const v = Number(x.querySelector('.tower-badge').textContent.replace(/[^0-9]/g, ''));
        if (v > n) { n = v; b = x; }
      });
      return b ? Number(b.dataset.tower) : null;
    });
    if (best === null) break;
    await page.click('[data-tower="' + best + '"]', { force: true });
    await page.waitForTimeout(100);
  }
  await page.waitForSelector('#screen-stats.active', { timeout: 8000 }).catch(() => {});
  check('第 3 关通关', await page.isVisible('#screen-stats'));
  check('三关全通庆祝', (await page.$eval('#stats-title', el => el.textContent)).includes('三关全通'));

  console.log(log.join('\n'));
  await browser.close();
  console.log(process.exitCode ? '\n有失败项 ❌' : '\n盖广播塔冒烟全部通过 🎉');
})();
