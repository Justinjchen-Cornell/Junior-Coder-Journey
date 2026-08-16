// 《猜猜它是谁》UI 冒烟（Edge）
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
  check('标题', (await page.title()) === '猜猜它是谁 🔮');
  check('三关按钮', (await page.$$('.level-btn')).length === 3);

  // 第 1 关：选真最近 3 个 + 投票正确
  await page.click('[data-level="1"]');
  check('特征图渲染', await page.$('.plot svg') !== null);
  check('目标❓出现', await page.$('.target-animal') !== null);
  const nb1 = await page.evaluate(() => window.__game.trueNearest(3));
  for (const id of nb1) {
    await page.click('[data-animal="' + id + '"]');
  }
  check('距离线画出', (await page.$$('.knn-line')).length === 3);
  const correct1 = await page.evaluate(() => window.__game.voteResultFor(3));
  await page.click('[data-vote="' + correct1 + '"]');
  await page.waitForSelector('#screen-stats.active', { timeout: 5000 });
  check('第 1 关猜对通关', await page.isVisible('#screen-stats'));
  check('结算含 KNN 彩蛋', (await page.$eval('#stats-box', el => el.textContent)).includes('KNN'));

  // 第 2 关：K=1 与 K=3 结果不同（噪声陷阱）
  await page.click('#btn-stats-home');
  await page.click('[data-level="2"]');
  const trap = await page.evaluate(() => {
    const g = window.__game;
    return { k1: g.voteResultFor(1), k3: g.voteResultFor(3), truth: g.trueClass };
  });
  check('第 2 关噪声陷阱（K1=' + trap.k1 + ' K3=' + trap.k3 + ' 真=' + trap.truth + '）',
    trap.k1 !== trap.k3 && trap.k3 === trap.truth);

  // 第 3 关：K 可调
  await page.click('#btn-home');
  await page.click('[data-level="3"]');
  check('K 选择按钮出现', (await page.$$('.k-btn')).length === 3);
  await page.click('[data-k="1"]');
  check('K 切换生效', (await page.$eval('#steps', el => el.textContent)).includes('0/1'));

  console.log(log.join('\n'));
  await browser.close();
  console.log(process.exitCode ? '\n有失败项 ❌' : '\n猜猜它是谁冒烟全部通过 🎉');
})();
