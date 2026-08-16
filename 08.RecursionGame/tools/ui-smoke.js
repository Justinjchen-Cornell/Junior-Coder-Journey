// 《套娃拆拆乐》v2 UI 冒烟（Edge）
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
  check('标题', await page.title() === '套娃拆拆乐 🪆');

  // --- 宝宝模式：拆到底 → 回溯气泡 → 答层数 ---
  await page.click('[data-animal="🐰"]');
  await page.click('.mode-btn.baby');
  let guard = 0;
  while (guard++ < 20) {
    const hint = await page.$eval('#hint', el => el.textContent);
    if (hint.includes('基线')) break;
    const openBtn = await page.$('#btn-open');
    if (!openBtn || !await openBtn.isVisible()) break;
    await page.click('#btn-open');
  }
  check('宝宝拆到底（基线空盒）', await page.$eval('#hint', el => el.textContent.includes('基线')));
  check('嵌套盒视觉出现', await page.$('.inner-box.base') !== null);
  await page.waitForSelector('[data-ans]', { timeout: 20000 });
  const opts = await page.$$eval('[data-ans]', els => els.map(e => Number(e.dataset.ans)));
  await page.click('[data-ans="' + opts[1] + '"]');   // 中间 = 正确答案（n-1, n, n+1）
  check('宝宝答对层数胜利', await page.$eval('#hint', el => el.textContent.includes('拆完啦')));
  check('结算页出现', await page.isVisible('#screen-stats'));

  // --- 挑战模式：拆到底 → 递归追踪（算加法） ---
  await page.click('#btn-stats-home');
  await page.click('.mode-btn.challenge');
  guard = 0;
  while (guard++ < 20) {
    const hint = await page.$eval('#hint', el => el.textContent);
    if (hint.includes('基线')) break;
    const openBtn = await page.$('#btn-open');
    if (!openBtn || !await openBtn.isVisible()) break;
    await page.click('#btn-open');
  }
  check('挑战拆到底', await page.$eval('#hint', el => el.textContent.includes('基线')));
  await page.waitForSelector('[data-opt]', { timeout: 5000 });
  // 追踪：读"里面传来 X + 盒子上的 N"，算正确选项点击
  guard = 0;
  while (guard++ < 30) {
    const done = await page.$eval('#hint', el => el.textContent.includes('拆完啦'));
    if (done) break;
    const trace = await page.$eval('.trace-card', el => el.textContent);
    const m = trace.match(/里面传来\s*(\d+)/);
    const n2 = trace.match(/盒子上的\s*(\d+)/);
    if (!m || !n2) break;
    const answer = Number(m[1]) + Number(n2[1]);
    const btn = await page.$('[data-opt="' + answer + '"]');
    if (!btn) break;
    await page.click('[data-opt="' + answer + '"]');
  }
  check('挑战递归追踪完成（胜利）', await page.$eval('#hint', el => el.textContent.includes('拆完啦')));
  const statsText = await page.$eval('#stats-box', el => el.textContent);
  check('结算含递归小秘密', statsText.includes('递归'));

  console.log(log.join('\n'));
  await browser.close();
  console.log(process.exitCode ? '\n有失败项 ❌' : '\n套娃 v2 冒烟全部通过 🎉');
})();
