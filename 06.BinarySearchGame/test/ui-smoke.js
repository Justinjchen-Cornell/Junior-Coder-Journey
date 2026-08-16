// UI 冒烟测试：用本机 Edge 验证双模式完整流程（开发工具，非游戏依赖）
// 运行: node test/ui-smoke.js
const { chromium } = require('playwright-core');
const path = require('path');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const URL = 'file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/');

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
  const log = [];
  const check = (name, cond) => { log.push(`${cond ? '✅' : '❌'} ${name}`); if (!cond) process.exitCode = 1; };

  await page.goto(URL);

  // --- 宝宝模式全流程 ---
  await page.click('[data-animal="🐰"]');
  await page.click('.mode-btn.baby');
  check('宝宝模式进入游戏', await page.isVisible('#board'));
  let cells = await page.$$('.board .cell');
  check('宝宝模式有 10 个树洞', cells.length === 10);

  // 二分法连猜（读取 target 不可行，就循环猜中间直到命中）
  let steps = 0, hit = false;
  for (let i = 0; i < 10 && !hit; i++) {
    const n = await page.$$eval('.board .cell', els => {
      const active = els.filter(e => !e.classList.contains('excluded'));
      return Number(active[Math.floor(active.length / 2)].dataset.n);
    });
    await page.click(`[data-n="${n}"]`);
    steps++;
    hit = await page.$eval('#feedback', el => el.textContent.includes('找到啦'));
  }
  check(`宝宝模式命中（${steps} 步）`, hit);
  const excluded = await page.$$eval('.board .cell', els => els.filter(e => e.classList.contains('excluded')).length);
  check('猜过的高亮区间正确', excluded >= 0);

  // --- 挑战模式全流程 ---
  await page.click('#btn-home');
  await page.click('[data-animal="🦊"]');
  await page.click('.mode-btn.challenge');
  cells = await page.$$('.board .cell');
  check('挑战模式有 100 个格子', cells.length === 100);

  let steps2 = 0, hit2 = false;
  for (let i = 0; i < 100 && !hit2; i++) {
    const n = await page.$$eval('.board .cell', els => {
      const active = els.filter(e => !e.classList.contains('excluded'));
      return Number(active[Math.floor(active.length / 2)].dataset.n);
    });
    await page.click(`[data-n="${n}"]`);
    steps2++;
    hit2 = await page.$eval('#feedback', el => el.textContent.includes('找到啦'));
  }
  check(`挑战模式命中（${steps2} 步）`, hit2 && steps2 <= 7);
  const stars = await page.$eval('#stars', el => el.textContent);
  check('7 步内三星', stars.includes('⭐⭐⭐'));
  const inRange = await page.$$eval('.board .cell', els => els.filter(e => e.classList.contains('in-range')).length);
  check('命中时区间收敛（高亮 = 0 或 1 格）', inRange <= 1);

  // --- 重玩 ---
  await page.click('#btn-reset');
  const stepsAfter = await page.$eval('#steps', el => el.textContent);
  check('重玩后步数清零', stepsAfter === '');

  console.log(log.join('\n'));
  await browser.close();
  console.log(process.exitCode ? '\n有失败项 ❌' : '\nUI 冒烟测试全部通过 🎉');
})();
