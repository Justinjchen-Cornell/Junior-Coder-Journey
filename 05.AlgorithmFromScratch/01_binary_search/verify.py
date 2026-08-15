"""步骤 4 验证：随机属性测试 + 对拍 + 步骤计数"""
import random, math
from solution import binary_search as mine
from reference import binary_search as ref

random.seed(42)

# 1) 随机属性测试：1000 组随机数组×随机目标
for _ in range(1000):
    n = random.randint(0, 200)
    arr = sorted(random.sample(range(10000), n))
    target = random.choice(arr) if arr else -1
    expect = ref(arr, target)
    assert mine(arr, target) == expect, f"不一致: {arr}, {target}"
print("随机对拍 1000 组: 全部一致 ✅")

# 2) 边界测试
assert mine([], 1) is None
assert mine([1], 1) == 0
assert mine([1, 2], 2) == 1
assert mine([1, 2, 3], 2) == 1
assert mine([1, 2, 3], 4) is None
print("边界测试: 空数组/单元素/首尾/不存在 ✅")

# 3) 步骤计数：100 万元素应 ≈ 20 步
arr = list(range(1_000_000))
steps = [0]
mine(arr, 500_000, steps)
assert steps[0] <= math.ceil(math.log2(len(arr))) + 1
print(f"步骤计数: {steps[0]} 步 ≤ 理论值 ceil(log2(1M))={math.ceil(math.log2(1_000_000))} ✅")
print("\n全部验证通过 🎉")
