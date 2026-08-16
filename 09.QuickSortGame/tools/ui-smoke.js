// 《书架整理员》UI 冒烟（Edge）
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
  check('标题', (await page.title()) === '书架整理员 📚');

  // --- 宝宝模式：抽标杆 → 分堆 → 排好 ---
  await page.click('[data-animal="🐰"]');
  await page.click('.mode-btn.baby');
  check('书堆出现', (await page.$$('.book-pile .book')).length >= 5);

  let guard = 0;
  while (guard++ < 300) {
    const done = await page.$eval('#hint', el => el.textContent.includes('书架排好啦'));
    if (done) break;
    const pile = await page.$('.book-pile .book');
    if (pile) {
      await pile.click();   // 抽第一本当标杆（随便选）
      continue;
    }
    const side = await page.$('.side-btn');
    if (!side) break;
    // 读当前书与标杆，选正确方向
    const pendingVal = Number(await page.$eval('.pending-zone .b-num', el => el.textContent));
    const pivotVal = Number(await page.$eval('.pivot-zone .b-num', el => el.textContent));
    const sideBtn = pendingVal < pivotVal ? '.side-btn.small' : '.side-btn.big';
    await page.click(sideBtn);
  }
  check('宝宝模式书架排好（胜利）', await page.$eval('#hint', el => el.textContent.includes('书架排好啦')));
  const shelfCount = await page.$$eval('.shelf .sbook', els => els.length);
  check('书架满员', shelfCount === await page.$$eval('.shelf .slot', els => els.length));
  check('结算页出现', await page.isVisible('#screen-stats'));

  // --- 挑战模式 ---
  await page.click('#btn-stats-home');
  await page.click('.mode-btn.challenge');
  check('挑战模式书堆 ≥8', (await page.$$('.book-pile .book')).length >= 8);
  guard = 0;
  while (guard++ < 400) {
    const done = await page.$eval('#hint', el => el.textContent.includes('书架排好啦'));
    if (done) break;
    const pile = await page.$('.book-pile .book');
    if (pile) { await pile.click(); continue; }
    const side = await page.$('.side-btn');
    if (!side) break;
    const pendingVal = Number(await page.$eval('.pending-zone .b-num', el => el.textContent));
    const pivotVal = Number(await page.$eval('.pivot-zone .b-num', el => el.textContent));
    await page.click(pendingVal < pivotVal ? '.side-btn.small' : '.side-btn.big');
  }
  check('挑战模式排好', await page.$eval('#hint', el => el.textContent.includes('书架排好啦')));
  const statsText = await page.$eval('#stats-box', el => el.textContent);
  check('结算含标杆提示', statsText.includes('标杆'));
  check('结算含分而治之彩蛋', statsText.includes('分而治之'));

  console.log(log.join('\n'));
  await browser.close();
  console.log(process.exitCode ? '\n有失败项 ❌' : '\n书架整理员冒烟全部通过 🎉');
})();
