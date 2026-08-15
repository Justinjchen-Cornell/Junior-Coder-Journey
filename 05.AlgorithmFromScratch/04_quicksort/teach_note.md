---
tags: [算法, 分而治之, 排序]
status: 🌿 growing
type: 实现
moc: "[[算法图解-MOC]]"
source: "[[算法图解.pdf]]"
created: 2026-08-15
关联: "[[02_selection_sort]]"
---

# 快速排序 · 教给别人版

## 给 8 岁孩子讲的版本

> 整理书架：随手拿一本书当"标杆"，比它薄的放左边，厚的放右边。
> 然后左边那堆再用同样的办法整理，右边那堆也是。
> 每堆书最后都只剩一本——就全排好了！
> 这个"分成两堆、各自再分"的招，叫**分而治之**，是很多厉害算法的共同心法。

## 给大人讲的版本

- **分而治之（Divide & Conquer）三步曲**：
  1. 找**基线条件**（最简单情形直接解决：0/1 个元素天然有序）
  2. **缩小问题**（选 pivot，把数组分成"小于/等于/大于"三堆）
  3. 递归处理子问题，拼回结果
- **复杂度**：平均 O(n log n)，最坏 O(n²)（pivot 选得差时）
- **实测**（benchmark.py 三方对决，n=4000）：
  - 选择排序 1346 ms ↔ 快排 23 ms（**快 59 倍**）↔ 内置 sorted 0.65 ms
- **反直觉实测**：已排序输入 + 首元素 pivot → **RecursionError 爆栈**（每次只切掉 1 个元素，深度 = n 而非 log n）。对策：中间/随机 pivot

## 代码逐行（solution.py）

```python
def quicksort(arr):
    if len(arr) < 2:            # 基线：0/1 个元素
        return arr
    pivot = arr[len(arr) // 2]  # 选中间做基准（避开最坏情况）
    less = [x for x in arr if x < pivot]
    equal = [x for x in arr if x == pivot]
    greater = [x for x in arr if x > pivot]
    return quicksort(less) + equal + quicksort(greater)
```

## 复杂度速记（本书前 4 章完整链条）

| 算法 | 平均 | 最坏 | 为什么 |
|------|------|------|--------|
| 二分查找 | O(log n) | O(log n) | 有序 + 每次砍半 |
| 选择排序 | O(n²) | O(n²) | 挑 n 次 × 扫 n 个 |
| 快排 | O(n log n) | O(n²) | 分两半递归 log n 层 × 每层 n 次 |
| （内置 sorted） | O(n log n) | O(n log n) | TimSort，工程级调优 |

## 一句话总结

> **快排是"分而治之"的第一次完全体**——把大问题切成小问题，各自解决再合并。理解它 = 理解 O(n log n) 家族（归并、堆排、二叉搜索树）的总钥匙。
