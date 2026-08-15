# 参考实现（书中背包示例 + 官方仓库 LCS）

# ---- 书中示例：4 磅背包，三件物品 ----
# 吉他 1磅 $1500 / 音响 4磅 $3000 / 笔记本 3磅 $2000
# DP 网格答案：吉他+笔记本 = 4 磅 = $3500（不是贪心认为的音响 $3000）
items = [("吉他", 1, 1500), ("音响", 4, 3000), ("笔记本", 3, 2000)]
CAPACITY = 4
# 网格 cell[i][j] = 前 i 件物品、容量 j 磅的最大价值
# 公式: cell[i][j] = max(cell[i-1][j], 物品价值 + cell[i-1][j-物品重量])


# ---- 官方仓库代码：最长公共子序列 LCS ----
def longest_common_subsequence(a, b):
    """返回 a、b 的最长公共子序列的长度"""
    # 网格: dp[i][j] = a 前 i 个字符与 b 前 j 个字符的 LCS 长度
    dp = [[0 for j in range(len(b) + 1)] for i in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:                       # 字符相同
                dp[i][j] = dp[i - 1][j - 1] + 1            # 斜对角 +1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]) # 取上面/左边较大
    return dp[len(a)][len(b)]
