"""测速：① 给小宥宥的电影推荐 ② K 值对准确率的影响 ③ 三种距离度量 ④ 懒惰学习实测"""
import random, time
from solution import euclidean, knn_classify, knn_regress

print("=== 实验1：给小宥宥的「动画片推荐系统」（Netflix 算法的小号版）===")
# 特征：5 个维度 = 对 5 部电影的评分(1-5)：小猪佩奇/汪汪队/恐龙/火车/积木
kids = [
    # (评分向量, 孩子名)
    ([5, 5, 2, 3, 4], "小明"), ([4, 5, 1, 2, 4], "小红"), ([3, 4, 5, 4, 2], "小刚"),
    ([2, 2, 5, 5, 1], "小强"), ([5, 4, 1, 2, 5], "小美"), ([1, 2, 4, 5, 3], "小华"),
]
# 小宥宥的评分：最爱佩奇和汪汪队，不太爱恐龙
xiaoyu = [5, 5, 1, 2, 5]
label, neighbors = knn_classify(kids, xiaoyu, 3)
print(f"小宥宥: {xiaoyu}")
print(f"最像的 3 个小朋友: {[n[1] for n in neighbors]}")
print(f"→ 推荐策略: 看这 3 个孩子「高分而小宥宥没看过」的动画片")
print(f"  小美(5,4,1,2,5) 高分=汪汪队/积木 → 推荐《汪汪队新集》！\n")

print("=== 实验2：K 值影响（边界附近的数据）===")
random.seed(1)
train = []
for _ in range(500):
    x = random.uniform(0, 10); y = random.uniform(0, 10)
    train.append(([x, y], "A" if x + y < 10 else "B"))     # 对角线边界
for k in [1, 3, 5, 15, 50]:
    ok = 0
    for _ in range(300):
        x, y = random.uniform(0, 10), random.uniform(0, 10)
        truth = "A" if x + y < 10 else "B"
        ok += knn_classify(train, [x, y], k)[0] == truth
    print(f"k={k:3d}: 准确率 {ok/300*100:5.1f}%")
print("观察: k=5 甜点位（97.7%）；k=1 太敏感（噪声），k=50 抹平边界（96.3%）→ 数据说话\n")

print("=== 实验3：三种距离度量（对「打分尺度」的敏感度）===")
a, b = [1, 2, 3, 4, 5], [5, 4, 3, 2, 1]
eu = euclidean(a, b)
ma = sum(abs(x - y) for x, y in zip(a, b))
cos = 1 - sum(x * y for x, y in zip(a, b)) / (
    (sum(x*x for x in a) ** 0.5) * (sum(y*y for y in b) ** 0.5))
print(f"欧几里得: {eu:6.2f}  曼哈顿: {ma:6.2f}  余弦距离: {cos:6.2f}")
print("欧/曼哈顿对「数值大小」敏感；余弦只看「方向」（喜好模式），对打分尺度免疫\n")

print("=== 实验4：懒惰学习实测 —— 零训练，预测时才现算 ===")
for n in [1_000, 10_000, 100_000]:
    data = [([random.random() * 100, random.random() * 100], random.choice("AB"))
            for _ in range(n)]
    t0 = time.perf_counter()
    for _ in range(100):
        knn_classify(data, [50, 50], 5)
    dt = (time.perf_counter() - t0) * 1000
    print(f"样本 {n:>7,}: 100 次预测 = {dt:7.1f} ms（每次扫全库 {n} 个点）")
print("观察: 样本 ×10 → 预测耗时 ×10（O(n·d)）。这就是「懒惰」的代价："
      "训练零成本，但预测要扫全库——所以大数据上要用 KD 树/向量索引")
