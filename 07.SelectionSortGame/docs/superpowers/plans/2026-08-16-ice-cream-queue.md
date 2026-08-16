# 《排队买冰淇淋》实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 选择排序网页游戏——宝宝模式（选最小+👀扫描动画）与挑战模式（翻牌记忆），让孩子体感 O(n²)。

**Architecture:** 与第一章《猜猜小动物在哪里》同构：`js/game.js` 纯逻辑状态机（Node 可测），`js/ui.js` DOM 渲染，零依赖静态三件套。

**Tech Stack:** 原生 HTML/CSS/JS、Node ≥18（测试）、Web Audio（音效）、localStorage（纪录）、Edge 冒烟（playwright-core 仅开发用）。

## Global Constraints

- 零外部依赖（运行时）；全中文；按钮 ≥64px；响应式
- game.js 纯逻辑不碰 DOM/window（除 module.exports）
- 世界观：小动物排队买冰淇淋；动物高矮 = 数字大小
- 宝宝模式理论扫描 👀 = n(n+1)/2；挑战模式理论翻牌 = n(n+1)/2
- 星级纯函数：宝宝 0错=3 / ≤2错=2 / 其他=1；挑战 flips≤理论×1.2=3 / ×1.5=2 / 其他=1
- 每任务结束：跑测试 + git commit

---

### Task 1: game.js 纯逻辑（TDD）

**Files:** Create `js/game.js`；Test `test/game.test.js`
**Produces:** `createQueueGame(mode)` → `{ cards:[{id,value}], checkMin(id), flip(id), confirm(id), getStats(), reset(), isDone, currentMinId, mistakes, flipCount, sortedCount, mode }`
- 宝宝模式：`checkMin(id)` → `{ok, moved?}`；挑战模式：`flip(id)`→翻转计数、`confirm(id)`→确认最小
- `getStats()` → `{ scans(👀), flips, theoretical, stars }`

- [ ] **Step 1:** 失败测试（shuffle 完整性 / checkMin / flip / confirm / 星级边界 / stats 数学 / done / reset）
- [ ] **Step 2:** 跑测试确认失败
- [ ] **Step 3:** 实现 game.js（Fisher-Yates、每轮找最小、👀 计数、星级纯函数）
- [ ] **Step 4:** 全绿 + commit

### Task 2: index.html + style.css 排队场景

**Files:** Create `index.html`、`css/style.css`
- [ ] **Step 1:** 页面结构：选动物&模式（复用第一章样式）→ 排队区（已排序队伍）→ 牌区（剩余）→ 👀 计数徽章 → 反馈 → 统计页
- [ ] **Step 2:** 样式：队伍卡片（动物+身高数字）、翻牌背面（问号卡片）、👀 徽章动画、扫描光效（CSS 动画）
- [ ] **Step 3:** commit

### Task 3: ui.js 宝宝模式（选最小 + 扫描动画）

- [ ] **Step 1:** 渲染牌区（动物+数字），每轮点牌 → checkMin → 对/错反馈
- [ ] **Step 2:** 选中后扫描动画：光扫过剩余牌，每张冒 👀（跨轮累积，显示"看了 N 次"角标）
- [ ] **Step 3:** 队伍飞入动画 + 进度 + 星级 + 音效
- [ ] **Step 4:** Edge 冒烟（宝宝模式全流程）+ commit

### Task 4: ui.js 挑战模式（翻牌记忆 + 统计页）

- [ ] **Step 1:** 背面牌渲染，flip 翻看→翻回，confirm 确认
- [ ] **Step 2:** 统计页：总翻牌 vs 理论、每张牌被看次数条形图、"数字爆炸"表（5/8/12 → 10/28/66）
- [ ] **Step 3:** 教学彩蛋文案："原来排队这么累！"
- [ ] **Step 4:** Edge 冒烟（挑战全流程）+ commit

### Task 5: 纪录 + 庆祝 + 音效强化

- [ ] **Step 1:** localStorage 最佳纪录（key `ssq-best-<mode>-<animal>`）
- [ ] **Step 2:** 庆祝动画强化（彩带/星星弹出）+ 破纪录 🏆
- [ ] **Step 3:** commit

### Task 6: README + 全量回归 + 主仓库 + 部署

- [ ] **Step 1:** README.md（可爱版玩法说明）
- [ ] **Step 2:** node --test 全绿 + Edge 冒烟双模式全绿
- [ ] **Step 3:** 主仓库 README 加 07 行 + 亲子课堂索引更新（02 章"扑克牌排队"升级为网页版）
- [ ] **Step 4:** push + Pages 验证 + 汇报

## 验收
- [ ] 单元测试全绿（≥12 个）
- [ ] Edge 冒烟双模式全绿
- [ ] Pages: .../07.SelectionSortGame/ HTTP 200 + 真机通关
