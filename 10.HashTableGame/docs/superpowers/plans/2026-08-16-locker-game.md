# 《小动物储物柜》实现计划

**Goal:** 哈希表游戏——查号开柜 O(1) + 冲突链柜体验。
**Architecture:** 系列同构：game.1.0.js 纯逻辑 TDD + ui.1.0.js DOM + 版本化资源名。

## Global Constraints
- 零依赖；全中文；大按钮；版本化文件名（style.1.0.css）
- 宝宝 5 柜 4-5 件无冲突；挑战 10 柜 8-10 件含 2 对冲突
- 星级：0 错=3 / ≤2 错=2 / 其他=1

### Task 1: game.js（TDD）
- API：`createLockerGame(mode)` → `{ items, currentTarget, openLocker(n), confirmTarget(id), getStats(), reset(), isDone }`
- 测试：初始化（数量/无冲突/冲突对数）/ openLocker 正确与错误 / 冲突柜流程（collision→confirm）/ 完成 / 星级 / reset
- commit

### Task 2: index.html + style.css（柜子墙+号码表+目标区+链柜；版本化文件名）
- commit

### Task 3: ui.js 宝宝模式（查表开柜全流程 + 动画音效）
- Edge 冒烟 → commit

### Task 4: ui.js 挑战模式（冲突链柜 + 结算对比彩蛋）
- Edge 冒烟 → commit

### Task 5: README + 门户点亮 + 推送 + Pages 验证
- commit + push + 线上验证
