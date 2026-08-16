# 《小松鼠装松果》实现计划

**Goal:** 动态规划（0/1 背包）游戏——试装 + DP 网格动画 + 贪心陷阱。
**Architecture:** 系列同构：game.1.0.js 纯逻辑 TDD + ui.1.0.js + 版本化文件名。

## Global Constraints
- 零依赖；全中文；大按钮；版本化文件名（style.1.0.css）
- 三关：4格3件 / 5格4件(陷阱) / 7格6件
- 最优 = DP + 暴力对拍；贪心 = 密度模拟；L2/L3 贪心 < 最优
- 星级：价值=最优 3 / ≥90% 2 / 其他 1

### Task 1: game.js（TDD）
- API：`createAcornGame(level)` → `{ toggleItem(id), finish(), getStats(), reset(), currentW, currentV, isFinished }`
- 测试：三关结构/放取/超重/DP最优=暴力对拍/贪心陷阱/回溯组合/星级/reset
- commit

### Task 2: index.html + style.css（物品卡+篮子格条+飞入动画+DP网格）
- commit

### Task 3: ui.js（试装+超重提示+结算网格动画+三关推进）
- Edge 冒烟 → commit

### Task 4: README + 门户点亮 + 推送 + Pages 验证
- commit + push + 线上验证
