# 《套娃拆拆乐》实现计划

**Goal:** 递归思维游戏——拆（压栈）+ 数回来（弹栈）+ 基线空娃娃。
**Architecture:** 06/07 同构：game.js 纯逻辑 TDD + ui.js DOM + 零依赖。

## Global Constraints
- 零依赖；全中文；大按钮；响应式；game.js 不碰 DOM
- 层数：宝宝 5-7 / 挑战 8-10；挑战层值为乱序数字 1..n
- 星级：0 错=3 / ≤2 错=2 / 其他=1

### Task 1: game.js（TDD）
- `createNestGame(mode)` → `{ layers, openedCount, isBaseReached, openNext(), answer(n), submitNext(v), getStats(), reset(), isDone }`
- 测试：openNext 顺序（外层→内层→空娃娃基线）/ openedCount / 宝宝 answer / 挑战 submitNext 顺序与错误 / 星级 / reset / stats
- commit

### Task 2: index.html + style.css（套娃视觉：大套娃→小套娃堆叠、拆开动画、✨基线、回溯区）
- commit

### Task 3: ui.js 宝宝模式（拆+动画+数回来+3选1答层数）
- Edge 冒烟宝宝流程 → commit

### Task 4: ui.js 挑战模式（数字牌+按序回溯+错误提示）
- Edge 冒烟挑战流程 → commit

### Task 5: 纪录+音效+庆祝（沿用系列套件）
- commit

### Task 6: README + 主仓库更新 + 推送 + Pages 验证
- commit + push + 线上验证
