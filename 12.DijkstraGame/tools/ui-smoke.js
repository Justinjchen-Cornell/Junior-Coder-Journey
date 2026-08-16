// 《蚂蚁找食物》UI 冒烟（Edge）
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
  check('标题', (await page.title()) === '蚂蚁找食物 🐜');
  check('三关按钮', (await page.$$('.level-btn')).length === 3);

  // 第 1 关：点亮点真实通关
  await page.click('[data-level="1"]');
  check('地图渲染', await page.$('.map svg') !== null);
  check('亮点出现', await page.$('.node.light') !== null);
  let guard = 0;
  while (guard++ < 30) {
    const onStats = await page.isVisible('#screen-stats');
    if (onStats) break;
    const best = await page.evaluate(() => {
      const cands = window.__game.getCandidates();
      return cands.length ? cands[0].id : null;
    });
    if (best === null) break;
    await page.evaluate((id) => {
      document.querySelector('[data-node="' + id + '"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }, best);
  }
  check('第 1 关点亮点通关', await page.isVisible('#screen-stats'));
  check('竞速对比卡出现', (await page.$eval('#race-card', el => el.textContent)).includes('莽撞蚂蚁'));
  check('三关全通文案未显示', !(await page.$eval('#stats-title', el => el.textContent)).includes('三关全通'));

  // 第 2 关：陷阱验证（莽撞 > 聪明）钩子检查
  await page.click('#btn-stats-home');
  await page.click('[data-level="2"]');
  const trap = await page.evaluate(() => {
    const s = window.__game.getStats();
    return { rash: s.rashCost, opt: s.optimalCost };
  });
  check('第 2 关陷阱存在（莽撞 ' + trap.rash + ' > 聪明 ' + trap.opt + '）', trap.rash > trap.opt);

  // 布局检查：节点无越界 + 间距 + 标签不重叠
  const layout = await page.evaluate(() => {
    const svg = document.querySelector('.map svg');
    const vb = svg.viewBox.baseVal;
    const pts = [];
    const out = [];
    document.querySelectorAll('.node').forEach(g => {
      const t = g.getAttribute('transform');
      const m = t.match(/translate\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?)\)/);
      if (m) {
        const x = Number(m[1]), y = Number(m[2]);
        pts.push({ x, y });
        if (x < 0 || y < 0 || x > vb.width || y > vb.height) out.push('node');
      }
    });
    let min = Infinity;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        min = Math.min(min, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
      }
    }
    const labels = [];
    document.querySelectorAll('.edge-label').forEach(t => {
      labels.push({ x: Number(t.getAttribute('x')), y: Number(t.getAttribute('y')) });
    });
    let close = 0;
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        if (Math.hypot(labels[i].x - labels[j].x, labels[i].y - labels[j].y) < 24) close++;
      }
    }
    return { out, min, close, vb: vb.width + 'x' + vb.height };
  });
  check('布局无越界（' + layout.vb + '）', layout.out.length === 0);
  check('节点间距 ' + layout.min.toFixed(0) + ' ≥60', layout.min >= 60);
  check('标签零重叠', layout.close === 0);

  // 第 3 关：全通文案（第 2 关未玩完 → 用游戏页的返回按钮）
  await page.click('#btn-home');
  await page.click('[data-level="3"]');
  guard = 0;
  while (guard++ < 40) {
    const onStats = await page.isVisible('#screen-stats');
    if (onStats) break;
    const best = await page.evaluate(() => {
      const cands = window.__game.getCandidates();
      return cands.length ? cands[0].id : null;
    });
    if (best === null) break;
    await page.evaluate((id) => {
      document.querySelector('[data-node="' + id + '"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }, best);
  }
  check('第 3 关通关', await page.isVisible('#screen-stats'));
  check('三关全通庆祝', (await page.$eval('#stats-title', el => el.textContent)).includes('三关全通'));

  console.log(log.join('\n'));
  await browser.close();
  console.log(process.exitCode ? '\n有失败项 ❌' : '\n蚂蚁找食物冒烟全部通过 🎉');
})();
