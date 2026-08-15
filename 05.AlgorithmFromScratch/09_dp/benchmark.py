"""测速：① 贪心在背包问题上翻车，DP 精确 ② 网格规模 = 空间复杂度 ③ LCS 应用演示"""
import random, time
from solution import knapsack, lcs

print("=== 实验1：背包问题 —— 贪心(第8章) vs DP(本章) ===")
# 贪心策略：按"价值密度"(价值/重量) 从大到小装
def greedy_knapsack(items, capacity):
    order = sorted(items, key=lambda x: x[2] / x[1], reverse=True)
    total_w = total_v = 0
    chosen = []
    for name, w, v in order:
        if total_w + w <= capacity:
            total_w += w; total_v += v; chosen.append(name)
    return total_v, chosen

# 反直觉例：贪心按"价值密度"先装 30 块的大箱，装不下两个 20 块中箱
items = [("大箱", 3, 30), ("中箱A", 2, 20), ("中箱B", 2, 20)]
g_v, g_c = greedy_knapsack(items, 4)
d_v, d_c = knapsack(items, 4)
print(f"4格背包: 贪心 ${g_v}（{g_c}）  DP ${d_v}（{d_c}） ← DP 多 ${d_v-g_v}（贪心被「大箱」骗了）")

# 随机 500 组：贪心 vs DP 差距统计
random.seed(42)
gaps = []
for _ in range(500):
    n = random.randint(3, 8)
    it = [(f"i{k}", random.randint(1, 6), random.randint(5, 100)) for k in range(n)]
    cap = random.randint(5, 15)
    gv, _ = greedy_knapsack(it, cap)
    dv, _ = knapsack(it, cap)
    if dv > 0:
        gaps.append((dv - gv) / dv)
print(f"随机 500 组: 贪心平均少赚 {sum(gaps)/len(gaps)*100:.1f}%，最多少赚 {max(gaps)*100:.0f}%")
print("结论: 贪心≈快但会亏，DP 精确但吃内存——这就是「近似 vs 最优」的 trade-off\n")

print("=== 实验2：DP 的空间账 —— 网格 n×容量 ===")
for n, cap in [(10, 20), (50, 100), (200, 1000), (1000, 10000)]:
    items = [(f"i{k}", random.randint(1, cap // 2), random.randint(1, 500)) for k in range(n)]
    t0 = time.perf_counter(); v, _ = knapsack(items, cap); dt = time.perf_counter() - t0
    print(f"物品 {n:5d} × 容量 {cap:6d} = 网格 {n*cap:>10,} 格 → {dt*1000:8.1f} ms")
print("观察: 容量翻倍 → 工作量翻倍。这叫「伪多项式」——背包不是真 NP，是容量吃空间\n")

print("=== 实验3：LCS 真实应用 —— 文本相似度（diff 的祖宗）===")
a = "GATTACA"      # 生物课：DNA 序列
b = "GCATGCU"
length, seq = lcs(a, b)
print(f"DNA 序列 {a} vs {b}: 最长公共子序列 = {seq}（长度 {length}）")
print("→ 基因比对、文件 diff、拼写纠错、git 合并算法都是 LCS 家族")
