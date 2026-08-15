"""测速：① 构造贪心翻车实例 ② NP 爆炸：2^n 暴力 vs n 贪心"""
import random, time
from itertools import combinations
from solution import greedy_set_cover

print("=== 实验1：构造贪心翻车实例（贪心=2 组，最优=1 组）===")
universe = {1, 2, 3, 4}
sets = {
    "A": {1, 2, 3},   # 贪心先选它（覆盖 3 个）
    "B": {2, 3, 4},
    "C": {1, 4},      # 但 C 一个就全包了！
    "D": {1},
    "E": {4},
}
g = greedy_set_cover(universe, sets)
b = ["C"]   # 暴力最优：{C} = 1 个
print(f"贪心: {g}（{len(g)} 组）  ← 每一步局部最优")
print(f"最优: {b}（{len(b)} 组）  ← 全局最优")
print("结论: 贪心只顾眼前，可能错过全局最优；集合覆盖是 NP 完全，大实例只能近似\n")

print("=== 实验2：NP 爆炸 —— 为什么集合覆盖「难」（暴力 2^n vs 贪心 n）===")
def brute_set_cover(universe, sets):
    names = list(sets.keys())
    for k in range(1, len(names) + 1):
        for combo in combinations(names, k):
            if set().union(*[sets[c] for c in combo]) >= universe:
                return combo
    return None

for n_sets in [12, 16, 20]:
    universe = set(range(10))
    sets = {f"S{i}": set(random.sample(list(universe), 4)) for i in range(n_sets)}
    while set().union(*sets.values()) != universe:
        sets = {f"S{i}": set(random.sample(list(universe), 4)) for i in range(n_sets)}

    t0 = time.perf_counter()
    b = brute_set_cover(universe, sets)
    t_brute = time.perf_counter() - t0

    t0 = time.perf_counter()
    g = greedy_set_cover(universe, sets)
    t_greedy = time.perf_counter() - t0

    print(f"候选 {n_sets:2d} 组: 暴力枚举 2^{n_sets}={1<<n_sets:,} 种组合 "
          f"→ {t_brute*1000:8.1f} ms | 贪心 {n_sets} 步 → {t_greedy*1000:6.2f} ms | 近似比 {len(g)/len(b):.2f}x")

print("""
观察:
- 候选每加 1 个，暴力工作量翻倍（2^n）；贪心只线性加 1 步
- n=30 时暴力要 10 亿种组合（几分钟~几小时），贪心依然毫秒
- 这就是 NP 完全问题：没有已知的快速最优解，工程上只能近似
""")
