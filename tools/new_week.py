#!/usr/bin/env python3
"""
new_week.py — 生成下周 episode 模板（每周 ≤15 分钟记录的唯一入口）

用法:
    python tools/new_week.py                  # 生成本周条目，主题待填
    python tools/new_week.py "机器人游戏"      # 生成本周条目，主题=机器人游戏
    python tools/new_week.py --next "乌龟棋"   # 生成下周条目

规则:
    - 已存在同名文件则不覆盖
    - 只依赖标准库，任何机器可运行
"""
import argparse
import datetime
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
EPISODES = ROOT / "01.episodes"

TEMPLATE = """# {week} · {monday} ~ {sunday} · {theme}

## 玩了什么
- 游戏/工具/绘本：

## 孩子的反应
- 亮点（眼睛发亮的时刻）：
- 卡点（走神/拒绝的时刻）：
- 语录（原话，不加修饰）：

## 我的观察
- 一句话洞察：

## 下周调整
- 1-2 条行动：

## 开心指数
⭐⭐⭐☆☆
"""


def week_range(d: datetime.date) -> tuple[datetime.date, datetime.date]:
    """返回 d 所在周的周一 ~ 周日"""
    monday = d - datetime.timedelta(days=d.weekday())
    sunday = monday + datetime.timedelta(days=6)
    return monday, sunday


def main() -> int:
    parser = argparse.ArgumentParser(description="生成 episode 周记录模板")
    parser.add_argument("theme", nargs="?", default="待填主题",
                        help="本周主题（默认：待填主题）")
    parser.add_argument("--next", action="store_true",
                        help="生成下周而非本周")
    args = parser.parse_args()

    today = datetime.date.today()
    target = today + datetime.timedelta(days=7) if args.next else today
    monday, sunday = week_range(target)
    week = target.isocalendar().week

    EPISODES.mkdir(exist_ok=True)
    filename = f"{target.year}-W{week:02d}_{args.theme}.md"
    out = EPISODES / filename

    if out.exists():
        print(f"[跳过] 已存在: {out.relative_to(ROOT)}")
        return 1

    out.write_text(
        TEMPLATE.format(
            week=f"{target.year}-W{week:02d}",
            monday=monday.strftime("%m-%d"),
            sunday=sunday.strftime("%m-%d"),
            theme=args.theme,
        ),
        encoding="utf-8",
    )
    print(f"[OK] {out.relative_to(ROOT)}")
    print(f"     填空 ≤15 分钟后 commit: git add -A && git commit -m \"episode: W{week:02d} {args.theme}\"")
    return 0


if __name__ == "__main__":
    sys.exit(main())
