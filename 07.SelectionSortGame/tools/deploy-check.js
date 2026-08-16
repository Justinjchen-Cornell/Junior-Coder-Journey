// 部署版验证：线上《排队买冰淇淋》完整通关
const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
  const log = [];
  const check = (n, c) => { log.push(`${c ? 'OK' : 'FAIL'} ${n}`); if (!c) process.exitCode = 1; };

  const url = 'https://justinjchen-cornell.github.io/Junior-Coder-Journey/07.SelectionSortGame/';
  await page.goto(url, { waitUntil: 'networkidle' });
  check('页面加载', (await page.title()) === '排队买冰淇淋 🍦');

  await page.click('[data-animal="🐰"]');
  await page.click('.mode-btn.baby');
  let guard = 0;
  while (guard++ < 50) {
    const done = await page.$eval('#hint', el => el.textContent.includes('排队成功'));
    if (done) break;
    const minCard = await page.$$eval('.board .card:not(.sorted)', els => {
      let best = null;
      els.forEach(e => {
        const v = Number(e.querySelector('.num').textContent);
        if (!best || v < best.v) best = { v, id: e.dataset.id };
      });
      return best ? best.id : null;
    });
    if (minCard === null) break;
    await page.click(`[data-id="${minCard}"]`);
  }
  check('线上宝宝模式通关', await page.$eval('#hint', el => el.textContent.includes('排队成功')));
  const eyes = await page.$eval('#eyes', el => el.textContent);
  check(`👀 统计显示（${eyes}）`, eyes.includes('👀'));

  console.log(log.join('\n'));
  await browser.close();
  console.log(process.exitCode ? '\n部署验证有失败' : '\n线上排队游戏正常 🎮');
})();
