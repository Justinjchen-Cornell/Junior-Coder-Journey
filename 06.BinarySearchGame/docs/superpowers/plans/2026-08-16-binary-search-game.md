# 《猜猜小动物在哪里》实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做一个给小宥宥玩的二分法网页游戏——宝宝模式（1-10 树洞）+ 挑战模式（1-100 区间可视化），故事化包装，可部署 GitHub Pages。

**Architecture:** 零依赖纯静态三件套。`js/game.js` 是纯逻辑状态机（可 Node 单测），`js/ui.js` 是 DOM 渲染层，`index.html` 挂载。测试用 Node 内置 `node --test`。

**Tech Stack:** 原生 HTML/CSS/JS（ES Modules 或经典 script 按序加载）、Node.js ≥18（仅测试用）、Web Audio API（音效）、localStorage（纪录）。

## Global Constraints

- 零外部依赖：无 CDN、无框架、无构建工具（音效用 Web Audio 合成）
- 全中文 UI，界面文字简洁，按钮 ≥64px
- 文件名与目录结构严格按设计文档 4.1
- game.js 必须是纯逻辑：不碰 `document`/`window`（除导出对象），保证 Node 可测
- 每次任务结束：跑测试 + `git commit`（短提交信息，中文可）
- 游戏逻辑：二分判定 + 区间计算 + 步数；星级：≤7=⭐⭐⭐ / ≤10=⭐⭐ / 其他=⭐（挑战模式）

---

### Task 1: game.js 核心逻辑（TDD 先行）

**Files:**
- Create: `js/game.js`
- Test: `test/game.test.js`

**Interfaces:**
- Consumes: 无（首个任务）
- Produces:
  - `createGame(mode)` → `{ min, max, target, guessCount, done, guess(number), getRange(), reset() }`
  - `guess(n)` → `{ result: 'low'|'high'|'hit', guessCount, range: {lo, hi}, done }`
  - `getRange()` → `{lo, hi}`；`reset()` → 清空步数并重设 target

- [ ] **Step 1: 写失败测试** `test/game.test.js`（node:test + assert）
  - createGame('baby')：min=1, max=10, target∈[1,10], guessCount=0
  - createGame('challenge')：max=100
  - guess 命中：result='hit', done=true, guessCount=1
  - guess 低了/高了：result='low'/'high', done=false
  - 边界：猜 1 和 100 不越界
  - 区间正确性：target=50 猜 30 → range.lo=31；猜 80 → range.hi=49（砍半验证）
  - 二分最优性：连续二分猜，命中时 guessCount ≤ ceil(log2(max-min+1))
  - reset() 后 guessCount=0，target 重新生成（可再次游玩）
- [ ] **Step 2: 运行测试确认失败**（node --test 或 node test/game.test.js）
- [ ] **Step 3: 实现 game.js**（闭合区间 [lo,hi]，guess 更新区间与步数）
- [ ] **Step 4: 跑测试全部通过**
- [ ] **Step 5: commit** `feat(game): game.js 核心逻辑 + 单元测试`

---

### Task 2: index.html 骨架 + style.css 基础

**Files:**
- Create: `index.html`, `css/style.css`
- Test: 无自动测试（手动浏览器检查）

**Interfaces:**
- Consumes: Task 1 的 game.js
- Produces: 页面容器（`#mode-select`、`#game-screen`、`#board`、`#feedback`、`#steps`、`#stars`），style.css 全量视觉

- [ ] **Step 1: index.html**——头部（标题+动物选择）、模式选择（宝宝/挑战）、游戏区（board/反馈/步数/星级/重玩按钮）、按序引入 js/game.js、js/ui.js
- [ ] **Step 2: style.css**——卡通圆角、深底亮字、按钮≥64px、响应式（手机竖屏 5 列/10 列自适应）、高亮/变灰样式类（`.active`、`.excluded`、`.hit`、`.celebrate`）
- [ ] **Step 3: 浏览器打开确认骨架可见、样式生效**
- [ ] **Step 4: commit** `feat(game): 页面骨架与基础样式`

---

### Task 3: ui.js —— 宝宝模式（树洞游戏）

**Files:**
- Create: `js/ui.js`（本任务实现宝宝模式部分）
- Test: 手动验证（逻辑已由 Task 1 保证）

**Interfaces:**
- Consumes: `createGame('baby')`、DOM 容器
- Produces: `initUI()`（入口）、`renderBoard(mode)`、`onGuess(n)`、`showFeedback(result, target)`、`celebrate(animal)`

- [ ] **Step 1: 动物选择开场**——🐰🐻🦊🐱🐸 五个大按钮，点击进入游戏
- [ ] **Step 2: 渲染 10 棵树洞**——大按钮 1-10，点击即猜
- [ ] **Step 3: 反馈大字**——"不是 5 号洞……它在**更高**的树洞里哦 🐿️"（低/高/命中三种），猜过的树洞变灰
- [ ] **Step 4: 命中庆祝**——动物 emoji 跳出 + 彩带（CSS 动画）+ 正确音效（Web Audio）
- [ ] **Step 5: 重玩按钮**——回到选动物
- [ ] **Step 6: 手动玩 3 局验证 + commit** `feat(game): 宝宝模式树洞游戏`

---

### Task 4: ui.js —— 挑战模式（区间可视化）

**Files:**
- Modify: `js/ui.js`（挑战模式部分）、`css/style.css`（格子样式）
- Test: 手动验证

**Interfaces:**
- Consumes: `createGame('challenge')`、`getRange()`、`guess()`
- Produces: `renderBoard('challenge')`、`renderRange(range)`、`updateStars(guessCount)`

- [ ] **Step 1: 渲染 100 格数字板**（10×10 网格，手机可滚/自适应）
- [ ] **Step 2: 区间高亮**——每次猜完调用 `getRange()`，区间内发光、区间外变暗（二分可视化）
- [ ] **Step 3: 步数显示**"第 N 次尝试" + 星级（≤7 ⭐⭐⭐ / ≤10 ⭐⭐ / 其他 ⭐）
- [ ] **Step 4: 命中后显示"猜中间，最多 7 次！"教学彩蛋**（呼应亲子课堂）
- [ ] **Step 5: 手动验证：二分 7 次内必中，区间每次减半正确**
- [ ] **Step 6: commit** `feat(game): 挑战模式区间可视化`

---

### Task 5: 纪录 + 音效 + 庆祝

**Files:**
- Modify: `js/ui.js`、`css/style.css`
- Test: 手动验证

**Interfaces:**
- Consumes: localStorage、Web Audio API
- Produces: `playSound(type)`（'correct'|'wrong'|'win'）、`saveRecord(mode, steps)`、`showRecord(mode)`

- [ ] **Step 1: localStorage 纪录**——key `bsg-best-<mode>-<animal>` 存最少步数；破纪录显示"新纪录！🏆"
- [ ] **Step 2: Web Audio 合成音效**——猜错（低音嘟）、猜对（高音叮）、庆祝（上行琶音）
- [ ] **Step 3: 庆祝动画强化**——动物跳动 + emoji 彩带 + 星星逐一弹出
- [ ] **Step 4: 手动验证 + commit** `feat(game): 纪录/音效/庆祝`

---

### Task 6: README + 全量验证 + 部署准备

**Files:**
- Create: `06.BinarySearchGame/README.md`
- Test: 全量回归（node --test + 双模式手动全流程）

**Interfaces:**
- Consumes: 全部
- Produces: 部署说明

- [ ] **Step 1: README.md**（可爱版：怎么玩/两个模式/给爸爸的话）
- [ ] **Step 2: 全量测试回归**（node --test 全过）
- [ ] **Step 3: 双模式手动全流程**（手机尺寸检查 + 桌面检查）
- [ ] **Step 4: 更新父仓库 README 目录表**（06.BinarySearchGame 一行）
- [ ] **Step 5: commit + push**，汇报 GitHub Pages 开启步骤

---

## 验收标准（全部完成 = 计划完成）

- [ ] node --test 全部通过（Task 1 测试集）
- [ ] 宝宝模式：3 岁半可独立操作（大按钮/图/音效）
- [ ] 挑战模式：区间高亮 + ≤7 步三星 + 教学彩蛋
- [ ] 纪录/音效/庆祝全部工作
- [ ] GitHub 推送完成，Pages 可开（告知开启步骤）
