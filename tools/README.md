# tools · 自动化管线

## new_week.py — 周模板生成（每周 15 分钟记录的唯一入口）

```bash
python tools/new_week.py "主题"        # 本周
python tools/new_week.py --next "主题" # 下周
```

- 自动计算周数 + 周一~周日日期范围
- 同名文件不覆盖（防误删）
- 只依赖标准库

## 防死机制（.github/workflows/weekly-reminder.yml）

- 每周一 09:00（北京时间）自动开一个 Issue 提醒
- 手动触发兜底：Actions → Weekly Reminder → Run workflow
- 允许断更 4 周，但"忘记记录"不允许——Action 永远记得

## 未来的管线（儿子 7-8 岁启用）

- 儿子独立 GitHub 账号，自己 commit，爸爸 review
- 届时把 `git log --author` 作为"独立里程碑"记录进 03.milestones
