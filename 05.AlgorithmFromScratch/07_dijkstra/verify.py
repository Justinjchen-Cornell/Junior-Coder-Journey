"""验证：Dijkstra（两版）vs 暴力穷举全部路径（小带权图上）"""
import random
from itertools import permutations
from solution import dijkstra_table, dijkstra_heap

random.seed(42)

def brute_cheapest(graph, start, end):
    """暴力法：枚举所有简单路径，算每条的总代价，取最小"""
    nodes = list(graph.keys())
    if start == end:
        return 0, [start]
    best_cost, best_path = float("inf"), None
    for length in range(1, len(nodes)):
        for seq in permutations([n for n in nodes if n != start], length):
            path = [start] + list(seq)
            if path[-1] != end:
                continue
            # 校验路径存在并算总代价
            total, ok = 0, True
            for i in range(len(path) - 1):
                w = graph[path[i]].get(path[i + 1])
                if w is None:
                    ok = False
                    break
                total += w
            if ok and total < best_cost:
                best_cost, best_path = total, path
    return (best_cost, best_path) if best_path else (float("inf"), None)

# 100 组随机带权图（非负权）对拍
for trial in range(100):
    n = random.randint(2, 6)
    nodes = [f"N{i}" for i in range(n)]
    graph = {}
    for node in nodes:
        graph[node] = {
            nb: random.randint(1, 9)          # 非负权（1~9）
            for nb in nodes
            if nb != node and random.random() < 0.4
        }
    s, t = random.sample(nodes, 2)
    b_cost, b_path = brute_cheapest(graph, s, t)
    for fn in (dijkstra_table, dijkstra_heap):
        cost, path = fn(graph, s, t)
        assert cost == b_cost, f"{fn.__name__} 图{graph} {s}→{t}: {cost} vs 暴力 {b_cost}"
        if b_path is not None:
            assert path is not None and path[0] == s and path[-1] == t
print("随机带权图 100 组 × 两版 Dijkstra × 暴力穷举: 全部一致 ✅")

# 边界
g = {"a": {"b": 1}, "b": {"c": 2}, "c": {}}
assert dijkstra_table(g, "a", "a")[0] == 0            # 原地
assert dijkstra_heap(g, "a", "x")[0] == float("inf")  # 不可达
assert dijkstra_table(g, "a", "c")[0] == 3
print("边界: 原地=0 / 不可达=inf / 链式 ✅")

# 与 BFS 的关系：所有权值相同(1)时，Dijkstra 应该退化为 BFS 的最短路长度
from solution import dijkstra_table
g2 = {0: {1: 1, 2: 1}, 1: {3: 1}, 2: {3: 1}, 3: {}}
assert dijkstra_table(g2, 0, 3)[0] == 2
print("退化测试: 单位权图 Dijkstra == BFS 最短步数 ✅")
print("全部验证通过 🎉")
