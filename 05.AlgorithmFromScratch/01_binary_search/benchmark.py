"""测速：1,000,000 个元素的有序数组，查找目标在第 50 位"""
import random, time
from reference import binary_search, buggy_binary_search

N = 1_000_000
arr = list(range(N))
target = arr[50]

for name, fn in [("官方版 O(log n)", binary_search), ("中文版缺//2", buggy_binary_search)]:
    steps = [0]
    t0 = time.perf_counter()
    result = fn(arr, target, steps)
    dt = (time.perf_counter() - t0) * 1000
    print(f"{name:16s} 结果={result}  步骤={steps[0]:>8,}  耗时={dt:.2f} ms")

import math
print(f"\n理论值: ceil(log2({N})) = {math.ceil(math.log2(N))} 步")
print(f"结论: 二分查找把 100 万次查找压缩到 ~20 次 —— 这就是 O(log n) 的意义")
