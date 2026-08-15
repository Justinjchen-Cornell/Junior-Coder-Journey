"""验证：① 活动选择 贪心==暴力（可证明最优） ② 集合覆盖 贪心≈暴力（近似）"""
import random
from itertools import combinations
from solution import greedy_activity_select, greedy_set_cover

random.seed(42)

# ---- ① 活动选择：贪心必须与暴力穷举完全一致（它是"正确"的贪心）----
def brute_activity(acts):
    """暴力：枚举所有子集找最多互不冲突的"""
    n = len(acts)
    best = []
    for mask in range(1 << n):
        chosen = [acts[i] for i in range(n) if mask >> i & 1]
        chosen.sort(key=lambda a: a[1])
        ok = all(chosen[i][1] <= chosen[i+1][0] for i in range(len(chosen)-1))
        if ok and len(chosen) > len(best):
            best = chosen
    return best

for trial in range(100):
    n = random.randint(1, 12)
    acts = []
    for _ in range(n):
        s = random.randint(0, 20)
        acts.append((s, s + random.randint(1, 5)))
    g = greedy_activity_select(acts)
    b = brute_activity(acts)
    assert len(g) == len(b), f"贪心 {len(g)} vs 暴力 {len(b)}: {acts}"
print("活动选择: 100 组随机 × 暴力穷举, 贪心==最优 全部一致 ✅（贪心在此问题可证明最优）")

# ---- ② 集合覆盖：贪心是"近似"，统计近似比 ----
def brute_set_cover(universe, sets):
    """暴力：枚举所有子集组合，找能全覆盖的最小集合"""
    names = list(sets.keys())
    for k in range(1, len(names) + 1):
        for combo in combinations(names, k):
            if set().union(*[sets[c] for c in combo]) >= universe:
                return combo
    return None

ratios = []
for trial in range(50):
    universe = set(range(random.randint(5, 12)))
    sets = {}
    for i in range(random.randint(4, 8)):
        n_cover = random.randint(1, len(universe))
        sets[f"S{i}"] = set(random.sample(list(universe), n_cover))
    # 保证实例有解：重新生成直到自然覆盖（不掺"全包"集合，测诚实近似比）
    while set().union(*sets.values()) != universe:
        sets = {}
        for i in range(random.randint(4, 8)):
            n_cover = random.randint(1, len(universe))
            sets[f"S{i}"] = set(random.sample(list(universe), n_cover))
    g = greedy_set_cover(universe, sets)
    b = brute_set_cover(universe, sets)
    assert b is not None                     # 暴力能找到（集合覆盖完备）
    covered = set().union(*[sets[s] for s in g])
    assert covered >= universe               # 贪心必须全覆盖（合法性）
    ratios.append(len(g) / len(b))

avg_ratio = sum(ratios) / len(ratios)
print(f"集合覆盖: 50 组随机实例, 贪心合法全覆盖 ✅")
print(f"近似比统计: 平均 {avg_ratio:.3f}x（最优为 1.0；贪心通常很接近，最坏可达 ln n）")
print("全部验证通过 🎉")
