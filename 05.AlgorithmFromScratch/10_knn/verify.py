"""验证：在合成数据上测 KNN 的分类/回归能力 + 加权版 + 平票边界"""
import random
from solution import (euclidean, knn_classify, knn_regress,
                      knn_classify_weighted)

random.seed(42)

# ---- ① 合成分类：左半区=A，右半区=B（用 x 坐标一刀切）----
train = []
for _ in range(200):
    x = random.uniform(0, 10)
    y = random.uniform(0, 10)
    label = "A" if x < 5 else "B"
    train.append(([x, y], label))

# 测试 200 个新点，KNN 应该几乎全对（边缘附近的点可能错）
correct = 0
test = []
for _ in range(200):
    x, y = random.uniform(0, 10), random.uniform(0, 10)
    truth = "A" if x < 5 else "B"
    pred, _ = knn_classify(train, [x, y], 5)
    test.append(([x, y], truth))
    correct += (pred == truth)
acc = correct / 200
print(f"分类准确率（k=5，边界一刀切数据）: {acc*100:.1f}%")
assert acc >= 0.95, f"准确率过低: {acc}"
print("✅ 合成分类测试通过")

# ---- ② 合成回归：y = 2x + 噪声，KNN 预测应接近真值 ----
train_r = []
for _ in range(300):
    x = random.uniform(0, 10)
    train_r.append(([x], 2 * x + random.gauss(0, 0.3)))
errs = []
for _ in range(100):
    x = random.uniform(0, 10)
    pred = knn_regress(train_r, [x], 5)
    errs.append(abs(pred - 2 * x))
mae = sum(errs) / len(errs)
print(f"回归平均绝对误差: {mae:.3f}（真值 2x，噪声 0.3）→ 误差≈{mae/0.3:.1f} 倍噪声")
assert mae < 0.5
print("✅ 合成回归测试通过")

# ---- ③ 加权 vs 普通投票：数据分布不均时加权更稳 ----
# A 类密集（10 个点挤在附近），B 类稀疏（1 个点但更近）
data = [([1, 0], "A"), ([1.1, 0], "A"), ([0.9, 0], "A"), ([1.05, 0.1], "A"),
        ([0.95, 0.1], "A"), ([1, 0.2], "A"), ([1.1, 0.2], "A"), ([0.9, 0.2], "A"),
        ([1, 0.3], "A"), ([1.05, 0.3], "A"), ([0, 0], "B")]
plain, _ = knn_classify(data, [0.05, 0], 3)          # 3 个最近：B(0.05), A(1.0), A(1.05) → A 赢
weighted = knn_classify_weighted(data, [0.05, 0], 3) # 但 B 距离近得多，加权后 B 赢
print(f"近处孤立点: 普通投票={plain}  加权投票={weighted}（B 距离 0.05，A 距离 1.0，加权更合理）")
assert plain == "A" and weighted == "B"
print("✅ 加权投票边界测试通过")

# ---- ④ 距离为 0（完全相同的样本）→ 加权不死 ----
data0 = [([1, 1], "X"), ([0, 0], "Y"), ([2, 2], "Z")]
assert knn_classify_weighted(data0, [1, 1], 3) == "X"
print("✅ 零距离样本处理通过")
print("全部验证通过 🎉")
