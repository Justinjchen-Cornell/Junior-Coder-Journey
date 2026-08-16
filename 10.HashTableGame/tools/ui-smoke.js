// 《小动物储物柜》UI 冒烟（Edge）
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
  check('标题', (await page.title()) === '小动物储物柜 🔐');
  await page.click('[data-animal="🐰"]');
  await page.click('.mode-btn.baby');

  // --- 宝宝模式：UI 接线 + 钩子通关 ---
  check('柜子墙渲染 4-5 个', (await page.$$('.locker')).length >= 4 && (await page.$$('.locker')).length <= 5);
  check('号码表出现', await page.$('.hash-table .ht-item') !== null);
  check('目标物品出现', await page.$('.target-item') !== null);

  const babyResult = await page.evaluate(() => {
    const g = window.__game;
    let guard = 0;
    while (!g.isDone && guard++ < 200) {
      const t = g.currentTarget;
      g.openLocker(t.locker);
    }
    return { done: g.isDone, found: g.getStats().found, total: g.items.length, mistakes: g.mistakes };
  });
  check('宝宝钩子通关（无错误）', babyResult.done && babyResult.found === babyResult.total && babyResult.mistakes === 0);

  // --- 挑战模式：冲突链柜体验 ---
  await page.click('#btn-home');
  await page.click('.mode-btn.challenge');
  check('挑战柜子 6-10 个', (await page.$$('.locker')).length >= 6 && (await page.$$('.locker')).length <= 10);
  // 钩子驱动到冲突柜，验证碰撞流程
  const chResult = await page.evaluate(() => {
    const g = window.__game;
    let guard = 0;
    while (!g.isDone && guard++ < 300) {
      const t = g.currentTarget;
      const r = g.openLocker(t.locker);
      if (r.ok && r.collision) {
        g.confirmTarget(t.id);   // 直接确认目标（完美记忆）
      }
    }
    return { done: g.isDone, collisionFinds: g.collisionFinds, total: g.items.length };
  });
  check('挑战钩子通关', chResult.done);
  check('冲突链柜体验发生', chResult.collisionFinds >= 1);

  console.log(log.join('\n'));
  await browser.close();
  console.log(process.exitCode ? '\n有失败项 ❌' : '\n小动物储物柜冒烟全部通过 🎉');
})();
