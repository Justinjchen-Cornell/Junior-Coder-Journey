# 🍦 排队买冰淇淋

> 给小宥宥的选择排序思维游戏——**排一次队，就懂"为什么排序这么累"**。

## 怎么玩

1. 选一批小动物（它们乱糟糟的想买冰淇淋）
2. 小动物身上有数字（数字越大个子越高）
3. **谁最矮？点它！** 点对就跳进队伍 🎉
4. 一直点到队伍整整齐齐——就排好啦！

两个模式：

- 🍼 **宝宝模式**：5~8 只，点错也没关系，提示"再看看"
- 🚀 **挑战模式**：8~12 只，排完看统计："你一共看了 👀 多少次" + 数字爆炸彩蛋

## 给爸爸的话（教学点）

- 每点对一只，一道光会扫过所有剩下的牌，每张牌头上多一个 👀
- **同一张牌会被看一遍又一遍**——这就是选择排序"慢"的秘密（n²/2）
- 排完看统计页的"数字爆炸"：5 只=10 次 / 8 只=28 次 / 12 只=66 次
- 问孩子："为什么人越多，要看的次数越来越多？"——他自己会回答

## 本地运行

双击 `index.html` 即可（零依赖、可离线）。

## 开发

```bash
node --test                # 单元测试（12 个）
node tools/ui-smoke.js     # Edge 冒烟（需先 npm i --no-save playwright-core）
```

## 在线玩

GitHub Pages：`https://justinjchen-cornell.github.io/Junior-Coder-Journey/07.SelectionSortGame/`

## 文件结构

```
07.SelectionSortGame/
├── index.html
├── css/style.css
├── js/game.js     # 纯逻辑（选择排序状态机，可单测）
├── js/ui.js       # DOM + 👀 扫描动画 + 音效 + 纪录
├── tools/ui-smoke.js
└── test/game.test.js
```
