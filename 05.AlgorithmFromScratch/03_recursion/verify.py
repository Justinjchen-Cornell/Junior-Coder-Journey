"""验证：递归版 vs 迭代版/标准库 对拍"""
import random, math
from solution import factorial, sum_list

random.seed(42)
# factorial 与 math.factorial 对拍
for _ in range(100):
    n = random.randint(0, 20)
    assert factorial(n) == math.factorial(n), f"factorial({n}) 不一致"
print("factorial 与 math.factorial 对拍 100 组 ✅")

# sum_list 与内置 sum 对拍（含负数/空）
for _ in range(500):
    lst = [random.randint(-100, 100) for _ in range(random.randint(0, 50))]
    assert sum_list(lst) == sum(lst)
print("sum_list 与内置 sum 对拍 500 组 ✅")

# 边界
assert factorial(0) == 1 and factorial(1) == 1
print("边界: factorial(0)=factorial(1)=1 ✅")
print("全部验证通过 🎉")
