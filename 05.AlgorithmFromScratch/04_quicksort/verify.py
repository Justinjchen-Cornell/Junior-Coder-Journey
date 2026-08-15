"""验证：随机对拍（含重复、负数、空、逆序）"""
import random
from solution import quicksort as mine
from reference import quicksort as ref

random.seed(42)
for _ in range(1000):
    n = random.randint(0, 100)
    arr = [random.randint(-50, 50) for _ in range(n)]  # 故意留重复
    assert mine(arr) == sorted(arr), f"不一致: {arr}"
print("与内置 sorted() 对拍 1000 组（含重复/负数）✅")

for _ in range(200):
    arr = [random.randint(0, 1000) for _ in range(random.randint(0, 50))]
    assert mine(arr) == ref(arr)
print("与参考实现（首元素 pivot）对拍 200 组 ✅")

# 特殊序列
assert mine(list(range(500))) == list(range(500))          # 已升序
assert mine(list(range(500, 0, -1))) == list(range(1, 501)) # 已降序
print("升序/降序极限输入 ✅")
print("全部验证通过 🎉")
