"""测速：本章高潮——快排 vs 选择排序 vs 内置 sorted"""
import os, random, time, sys
from solution import quicksort          # 先导入本目录的快排
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "02_selection_sort"))
from reference import selection_sort

print("=== 三方对决（同一份随机数据）===")
for n in [1000, 2000, 4000]:
    arr = random.sample(range(n * 10), n)

    t0 = time.perf_counter(); selection_sort(arr.copy()); ss = (time.perf_counter()-t0)*1000
    t0 = time.perf_counter(); quicksort(arr.copy()); qs = (time.perf_counter()-t0)*1000
    t0 = time.perf_counter(); sorted(arr); bi = (time.perf_counter()-t0)*1000

    print(f"n={n:5d}  选择排序={ss:9.1f} ms  快排={qs:8.2f} ms  内置sorted={bi:6.2f} ms  快排是选择的 {ss/qs:5.1f}x")

print("""
=== 反直觉实验：快排的"最坏情况"（选第一个元素做 pivot，输入已排序）===
""")
def bad_quicksort(arr):
    """故意用第一个元素做 pivot（教科书最坏情况）"""
    if len(arr) < 2: return arr
    pivot = arr[0]
    return bad_quicksort([x for x in arr[1:] if x <= pivot]) + [pivot] + bad_quicksort([x for x in arr[1:] if x > pivot])

n = 2000
try:
    t0 = time.perf_counter(); bad_quicksort(list(range(n))); dt = (time.perf_counter()-t0)*1000
    print(f"已排序输入 + 首元素pivot: {dt:.1f} ms（而随机输入同样 n 只要几十 ms）")
except RecursionError:
    print(f"已排序输入 + 首元素pivot(n={n}) → RecursionError 爆栈！")
    print("原因：每次只切掉 1 个元素，递归深度 = n 而不是 log n")
    print("对策：随机 pivot / 中间 pivot（solution.py 就是这么写的）→ 见上方正常对决")
