"""验证：BFS 最短路径 vs 暴力枚举所有路径（小图上穷举）"""
import random
from itertools import permutations
from solution import bfs_shortest_path

random.seed(42)

def brute_shortest(graph, start, target):
    """暴力法：穷举所有不超过 N 步的路径（保证找到最短），小图专用"""
    nodes = list(graph.keys())
    if start == target:
        return [start]
    # 逐步加深：从 1 步到 n-1 步的所有简单路径
    for length in range(1, len(nodes)):
        for seq in permutations([n for n in nodes if n != start], length):
            path = [start] + list(seq)
            if path[-1] == target:
                if all(path[i+1] in graph.get(path[i], []) for i in range(len(path)-1)):
                    return path
    return None

# 随机生成 100 个小型有向图（含环/双向边），BFS vs 暴力对拍
for trial in range(100):
    n = random.randint(2, 7)
    nodes = list(range(n))
    graph = {}
    for node in nodes:
        graph[node] = [nb for nb in nodes
                       if nb != node and random.random() < 0.35]   # 随机边（可能成环）
    s, t = random.sample(nodes, 2)
    mine = bfs_shortest_path(graph, s, t)
    truth = brute_shortest(graph, s, t)
    assert mine == truth, f"图 {graph} 从 {s} 到 {t}: BFS={mine} 暴力={truth}"
print("随机有向图 100 组 × 暴力穷举对拍: 全部一致 ✅")

# 环测试：死循环安全性（一个环 + 一个目标）
graph = {0: [1], 1: [2], 2: [0, 3], 3: []}
assert bfs_shortest_path(graph, 0, 3) == [0, 1, 2, 3]
print("环上 BFS: 不死循环且找到正确路径 ✅")

# 双向（无向）图测试
graph = {0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2]}
assert bfs_shortest_path(graph, 0, 3) in ([0, 1, 3], [0, 2, 3])
print("无向图: 两条等长最短路径均可 ✅")
print("全部验证通过 🎉")
