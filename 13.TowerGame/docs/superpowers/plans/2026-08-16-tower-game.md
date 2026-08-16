# 《盖广播塔》实现计划

**Goal:** 贪心（集合覆盖）游戏——点塔盖村庄，陷阱关看贪心翻车。
**Architecture:** 系列同构：game.1.0.js 纯逻辑 TDD + ui.1.0.js SVG + 版本化文件名。

## Global Constraints
- 零依赖；全中文；大按钮；版本化文件名（style.1.0.css）
- 三关：5村4塔 / 4村4塔(陷阱) / 8村6塔(大陷阱)
- 最优 = 暴力枚举；贪心 = 标准模拟；星级按塔数对比
- L2 陷阱保证：贪心数 > 最优数

### Task 1: game.js（TDD）
- API：`createTowerGame(level)` → `{ chooseTower(id), undo(), getStats(), reset(), isDone, coveredCount }`
- 测试：三关结构/覆盖完整性/贪心模拟/暴力最优/陷阱(贪心>最优)/undo/星级/reset
- commit

### Task 2: index.html + style.css（草原地图+信号圈+塔角标+波纹动画+结算金圈）
- commit

### Task 3: ui.js（点塔盖村庄+悔棋+贪心提示+结算对比+三关推进）
- Edge 冒烟 → commit

### Task 4: README + 门户点亮 + 推送 + Pages 验证
- commit + push + 线上验证
