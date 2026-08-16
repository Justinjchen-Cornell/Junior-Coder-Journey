// UI 冒烟测试：用本机 Edge 验证双模式完整流程
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
  check('标题', await page.title() === '排队买冰淇淋 🍦');

  // --- 宝宝模式 ---
  await page.click('[data-animal="🐰"]');
  await page.click('.mode-btn.baby');
  let cards = await page.$$('.board .card');
  check('宝宝模式 5~8 张牌', cards.length >= 5 && cards.length <= 8);
  const n = cards.length;

  // 循环点最小（宝宝模式点对会进队；点错会提示）
  let guard = 0;
  while (guard++ < 30) {
    const done = await page.$eval('#hint', el => el.textContent.includes('排队成功'));
    if (done) break;
    // 找最小：读所有可见牌的数值
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
  const won = await page.$eval('#hint', el => el.textContent.includes('排队成功'));
  check('宝宝模式排完（胜利）', won);
  const badges = await page.$$eval('.eyes-badge', els => els.length);
  check('👀 扫描角标出现', badges > 0);
  const queueCount = await page.$$eval('#queue .q-card', els => els.length);
  check('队伍满员', queueCount === n);

  // --- 挑战模式（简化版：同样选最小，更多牌 + 统计页） ---
  await page.click('#btn-home');
  await page.click('.mode-btn.challenge');
  cards = await page.$$('.board .card');
  check('挑战模式 8~12 张', cards.length >= 8 && cards.length <= 12);
  const n2 = cards.length;
  guard = 0;
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
  const won2 = await page.$eval('#hint', el => el.textContent.includes('排队成功'));
  check('挑战模式排完', won2);
  const statsVisible = await page.isVisible('#screen-stats');
  check('挑战模式统计页出现', statsVisible);
  if (statsVisible) {
    const box = await page.$eval('#stats-box', el => el.textContent);
    check('统计含数字爆炸彩蛋', box.includes('数字爆炸'));
  }

  console.log(log.join('\n'));
  await browser.close();
  console.log(process.exitCode ? '\n有失败项 ❌' : '\n排队游戏 UI 冒烟全部通过 🎉');
})();
