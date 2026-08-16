// 部署版验证：确认线上游戏完整可用
const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
  const log = [];
  const check = (n, c) => { log.push(`${c ? 'OK' : 'FAIL'} ${n}`); if (!c) process.exitCode = 1; };

  const url = 'https://justinjchen-cornell.github.io/Junior-Coder-Journey/06.BinarySearchGame/';
  await page.goto(url, { waitUntil: 'networkidle' });
  check('页面加载', await page.title() === '猜猜小动物在哪里 🐿️');
  check('选动物按钮(5个)', (await page.$$('.animal-picker button')).length === 5);
  check('双模式按钮', (await page.$$('.mode-btn')).length === 2);

  await page.click('[data-animal="🐻"]');
  await page.click('.mode-btn.challenge');
  check('挑战模式 100 格', (await page.$$('.board .cell')).length === 100);

  let steps = 0, hit = false;
  for (let i = 0; i < 100 && !hit; i++) {
    const n = await page.$$eval('.board .cell', els => {
      const active = els.filter(e => !e.classList.contains('excluded'));
      return Number(active[Math.floor(active.length / 2)].dataset.n);
    });
    await page.click(`[data-n="${n}"]`);
    steps++;
    hit = await page.$eval('#feedback', el => el.textContent.includes('找到啦'));
  }
  check(`线上二分通关（${steps} 步 ≤7）`, hit && steps <= 7);
  check('三星', (await page.$eval('#stars', el => el.textContent)).includes('⭐⭐⭐'));

  console.log(log.join('\n'));
  await browser.close();
  console.log(process.exitCode ? '\n部署验证有失败' : '\n线上游戏全部正常 🎮');
})();
