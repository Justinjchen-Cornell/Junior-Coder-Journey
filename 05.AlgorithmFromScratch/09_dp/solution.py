# 从零实现：动态规划（0/1 背包 + 最长公共子序列）
#
# 直觉：数独填格子——每个格子填"当前条件下的最佳答案"，
#       后一个格子永远站在前面格子的肩膀上（子问题答案复用）。
#
# 三个心法：
#   ① 网格 = 决策表：行 = 前 i 个物品，列 = 容量 j
#   ② 递推公式：cell[i][j] = max(不放，放) —— 就两个选择！
#   ③ 回溯：从右下角倒推，还原"选了什么"
#
# 与贪心的关系：贪心是近似（第 8 章翻过车），DP 是**精确最优**——用空间换时间


# ---- 问题1：0/1 背包 ----
def knapsack(items, capacity):
    """items: [(名称, 重量, 价值), ...]
    返回 (最大价值, 选中的物品名列表)"""
    n = len(items)
    # ① 网格：dp[i][j] = 前 i 件物品、容量 j 的最大价值
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]

    # ② 递推填格
    for i in range(1, n + 1):
        name, w, v = items[i - 1]
        for cap in range(1, capacity + 1):
            if w > cap:
                dp[i][cap] = dp[i - 1][cap]            # 放不下 → 只能不放
            else:
                dp[i][cap] = max(
                    dp[i - 1][cap],                    # 不放（沿用上一行的答案）
                    dp[i - 1][cap - w] + v,            # 放（腾出 w 磅 + 新价值）
                )

    # ③ 回溯选了什么
    chosen, cap = [], capacity
    for i in range(n, 0, -1):
        if dp[i][cap] != dp[i - 1][cap]:               # 这格用了物品 i → 选了它
            chosen.append(items[i - 1][0])
            cap -= items[i - 1][1]
    return dp[n][capacity], list(reversed(chosen))


# ---- 问题2：最长公共子序列 LCS ----
def lcs(a, b):
    """返回 (LCS 长度, 子序列字符串)——字符顺序一致但不要求连续"""
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1        # 相同 → 斜对角 +1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])  # 不同 → 取较大

    # 回溯
    seq = []
    i, j = m, n
    while i > 0 and j > 0:
        if a[i - 1] == b[j - 1]:
            seq.append(a[i - 1]); i -= 1; j -= 1
        elif dp[i - 1][j] >= dp[i][j - 1]:
            i -= 1
        else:
            j -= 1
    return dp[m][n], "".join(reversed(seq))


if __name__ == "__main__":
    # 书中背包示例：吉他+笔记本 = $3500
    items = [("吉他", 1, 1500), ("音响", 4, 3000), ("笔记本", 3, 2000)]
    value, chosen = knapsack(items, 4)
    assert value == 3500 and set(chosen) == {"吉他", "笔记本"}, (value, chosen)
    print(f"书中示例: 4磅背包 → ${value}（{chosen}）✅ 不是贪心选的音响 $3000")

    # LCS 示例
    length, seq = lcs("fish", "fosh")
    assert length == 3 and seq == "fsh", (length, seq)
    print(f"LCS 示例: fish vs fosh → 长度 {length}（{seq}）✅")
