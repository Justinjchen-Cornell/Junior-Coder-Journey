"""测速：O(n²) vs O(n log n)，感受平方爆炸"""
import random, time
from reference import selection_sort

for n in [1000, 2000, 4000, 8000]:
    arr = random.sample(range(n * 10), n)
    t0 = time.perf_counter()
    selection_sort(arr.copy())
    ours = (time.perf_counter() - t0) * 1000

    t0 = time.perf_counter()
    sorted(arr.copy())   # Python 内置 TimSort ≈ O(n log n)
    builtin = (time.perf_counter() - t0) * 1000

    print(f"n={n:5d}  选择排序={ours:8.1f} ms  内置sorted={builtin:6.2f} ms  差距≈{ours/builtin:6.0f}x")

print("\n观察: n 翻倍 → 选择排序时间约×4（平方），内置排序约×2（线性对数）")
print("这就是 O(n²) vs O(n log n) 的差别：数据越大，差距越离谱")
