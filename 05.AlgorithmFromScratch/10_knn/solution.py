# 从零实现：KNN（K 最近邻）—— 机器学习的第一课
#
# 直觉：物以类聚——想知道新东西是什么，看看和它"最像"的 K 个老东西是什么。
#       "像" = 距离近（特征空间里的直线距离）。
#
# 三个零件：
#   ① 距离函数：欧几里得距离（n 维）
#   ② 找 K 个最近邻居
#   ③ 用邻居"投票"（分类）/ "平均"（回归）
#
# 机器学习视角：KNN 是"懒惰学习"——没有训练过程，预测时才现算。
#   优点：零训练、可解释（"因为它最像这 3 个")
#   缺点：预测慢（每次查全库）、高维诅咒


def euclidean(a, b):
    """n 维欧几里得距离：sqrt(Σ(xi-yi)²)——勾股定理的 n 维推广"""
    return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5


def _k_nearest(data, point, k):
    """data: [(特征向量, 标签), ...] → 按距离排序取前 k 个"""
    return sorted(data, key=lambda d: euclidean(d[0], point))[:k]


# ---- 分类：K 个邻居投票，票多者胜 ----
def knn_classify(data, point, k=3):
    """返回 (预测标签, 最近邻居列表)"""
    neighbors = _k_nearest(data, point, k)
    votes = {}
    for _, label in neighbors:
        votes[label] = votes.get(label, 0) + 1
    # 平票时取距离最近的那个（排序保证稳定）
    return max(votes.items(), key=lambda v: v[1])[0], neighbors


# ---- 回归：K 个邻居的平均值（预测数值而非类别）----
def knn_regress(data, point, k=3):
    """data: [(特征向量, 数值标签), ...] → 返回邻居标签的平均"""
    neighbors = _k_nearest(data, point, k)
    return sum(label for _, label in neighbors) / k


# ---- 升级：按距离加权投票（近的说话更算数）----
def knn_classify_weighted(data, point, k=3):
    """加权分类：票 = 1/距离，距离为 0 直接命中"""
    neighbors = _k_nearest(data, point, k)
    weights = {}
    for feat, label in neighbors:
        d = euclidean(feat, point)
        w = 1.0 / d if d > 0 else float("inf")      # 距离为 0 = 一模一样的样本
        weights[label] = weights.get(label, 0) + w
    return max(weights.items(), key=lambda v: v[1])[0]


if __name__ == "__main__":
    # 书中水果示例
    fruits = [
        ([140, 0.3], "橙子"), ([150, 0.4], "橙子"), ([130, 0.2], "橙子"),
        ([300, 0.8], "柚子"), ([280, 0.9], "柚子"), ([320, 0.7], "柚子"),
    ]
    label, neighbors = knn_classify(fruits, [245, 0.5], 3)
    assert label == "柚子", label
    print(f"245克/颜色0.5 → 最近3邻: {[n[1] for n in neighbors]} → 投票: {label} ✅")

    # 回归示例：房价预测（面积 → 价格）
    houses = [([50], 200), ([80], 320), ([60], 250), ([120], 500)]
    price = knn_regress(houses, [65], 3)
    assert 200 <= price <= 320
    print(f"65㎡ 房价预测 ≈ {price:.0f} 万（3 邻居均价）✅")
