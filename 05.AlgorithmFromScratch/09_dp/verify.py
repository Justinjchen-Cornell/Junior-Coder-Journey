"""验证：DP（背包+LCS）vs 暴力穷举 —— DP 必须和穷举完全一致（精确最优）"""
import random
from itertools import combinations
from solution import knapsack, lcs

random.seed(42)

# ---- ① 0/1 背包：暴力枚举所有子集 vs DP ----
def brute_knapsack(items, capacity):
    n = len(items)
    best_v, best_set = 0, []
    for mask in range(1 << n):
        total_w = total_v = 0
        sel = []
        for i in range(n):
            if mask >> i & 1:
                total_w += items[i][1]; total_v += items[i][2]; sel.append(items[i][0])
        if total_w <= capacity and total_v > best_v:
            best_v, best_set = total_v, sel
    return best_v, best_set

for trial in range(200):
    n = random.randint(1, 10)
    items = [(f"i{k}", random.randint(1, 8), random.randint(1, 50))
             for k in range(n)]
    cap = random.randint(3, 20)
    v_dp, sel_dp = knapsack(items, cap)
    v_br, sel_br = brute_knapsack(items, cap)
    assert v_dp == v_br, f"背包不一致: {items} cap={cap}: DP={v_dp}({sel_dp}) 暴力={v_br}({sel_br})"
print("背包: 200 组随机 × 2^n 暴力穷举, DP==最优 全部一致 ✅（DP 是精确解，不是近似）")

# ---- ② LCS：暴力（枚举短串的所有子序列）vs DP ----
def is_subseq(sub, s):
    """真·子序列检查：sub 的字符能否按顺序在 s 中找到（不要求连续）"""
    it = iter(s)
    return all(c in it for c in sub)          # 每次从上次停下的位置往后找

def brute_lcs(a, b):
    short, long = (a, b) if len(a) <= len(b) else (b, a)
    for k in range(len(short), 0, -1):
        for idxs in combinations(range(len(short)), k):
            sub = "".join(short[i] for i in idxs)
            if is_subseq(sub, long):           # 真子序列检查（旧版 `in` 误判为连续子串）
                return k, sub                  # 从长到短，第一个找到的就是最长
    return 0, ""

for trial in range(100):
    a = "".join(random.choice("abc") for _ in range(random.randint(1, 7)))
    b = "".join(random.choice("abc") for _ in range(random.randint(1, 7)))
    l_dp, s_dp = lcs(a, b)
    l_br, s_br = brute_lcs(a, b)
    assert l_dp == l_br, f"LCS 不一致: {a} vs {b}: DP={l_dp}({s_dp}) 暴力={l_br}({s_br})"
print("LCS: 100 组随机 × 子序列穷举, DP==最优 全部一致 ✅")

# ---- ③ 边界 ----
assert knapsack([("a", 5, 10)], 4)[0] == 0           # 装不下
assert knapsack([], 10) == (0, [])                     # 空物品
assert lcs("", "abc") == (0, "")
assert lcs("abc", "abc") == (3, "abc")                 # 完全相同
print("边界: 装不下/空/全同 ✅")
print("全部验证通过 🎉")
