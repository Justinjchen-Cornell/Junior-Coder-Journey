# 《书架整理员》实现计划

**Goal:** 快速排序（分而治之）游戏——抽标杆+分堆+书架落位。
**Architecture:** 系列同构：game.js 纯逻辑 TDD + ui.js DOM + 零依赖 + 版本化资源名（防缓存）。

## Global Constraints
- 零依赖；全中文；大按钮；书高=数值；资源文件名带版本（style.1.0.css）
- 星级：0 错=3 / ≤2 错=2 / 其他=1；回合统计：挑战模式

### Task 1: game.js（TDD）
- API：`createSortGame(mode)` → `{ books, pickPivot(id), classify(side), getStats(), reset(), isDone, pivotId, pendingBook }`
- 测试：初始化/抽标杆合法非法/分堆对错/堆耗尽自动弹栈/落位槽=value-1/全对完成/星级/reset
- commit

### Task 2: index.html + style.css（书架+书堆+分堆区+标杆发光；版本化文件名）
- commit

### Task 3: ui.js 宝宝模式（抽标杆→单本弹出→两个大按钮分堆→书架弹入）
- Edge 冒烟宝宝 → commit

### Task 4: ui.js 挑战模式（回合显示+结算对比彩蛋）
- Edge 冒烟挑战 → commit

### Task 5: 纪录+音效+庆祝
- commit

### Task 6: README + 门户点亮（书架整理员卡片改可玩）+ 推送 + Pages 验证
- commit + push + 线上验证
