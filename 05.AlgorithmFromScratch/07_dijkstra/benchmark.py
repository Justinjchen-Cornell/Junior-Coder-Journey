"""测速：① BFS 在带权图会翻车 ② 负权值让 Dijkstra 失效（两版都翻） ③ 堆 vs 表格性能"""
import random, time
from solution import dijkstra_table, dijkstra_heap

print("=== 实验1：BFS 只数「段数」，带权图会选错路 ===")
# 1 段路要 100 块钱，2 段路只要 4 块钱 —— BFS 会选 1 段那条
g = {"家": {"学校": 100, "便利店": 1}, "便利店": {"学校": 3}, "学校": {}}
import importlib.util, os
spec = importlib.util.spec_from_file_location(
    "bfs_solution", os.path.join(os.path.dirname(__file__), "..", "06_bfs", "solution.py"))
bfs_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bfs_mod)
bfs_shortest_path = bfs_mod.bfs_shortest_path

bfs_path = bfs_shortest_path(g, "家", "学校")
d_cost, d_path = dijkstra_table(g, "家", "学校")
print(f"BFS:       {bfs_path}（1 段，但代价 {g['家']['学校']} 块）")
print(f"Dijkstra:  {d_path}（2 段，总代价 {d_cost} 块）← 正确")
print("结论: BFS 求「段数最少」，Dijkstra 求「总价最低」，带权图必须用后者\n")

print("=== 实验2：负权值 —— Dijkstra 的命门（两版各翻一次车）===")
print("场景A: 负边指向「已定案」的节点（表格法贪心定案后回不了头）")
g2a = {"start": {"a": 0, "b": 2}, "a": {"fin": 1}, "b": {"a": -3}, "fin": {}}
d_cost, d_path = dijkstra_table(g2a, "start", "fin")   # a 先被定案为 0
print(f"  表格法: {d_cost}（路径 {d_path}） ← 错")
print(f"  真实:   0（start→b→a→fin = 2-3+1）")

print("场景B: 负边直达终点（堆版提前退出，来不及看到更便宜的路）")
g2b = {"start": {"end": 1, "b": 2}, "b": {"end": -10}, "end": {}}
d_cost, d_path = dijkstra_heap(g2b, "start", "end")    # end 以 1 弹出即 break
print(f"  堆版:   {d_cost}（路径 {d_path}） ← 错")
print(f"  真实:   -8（start→b→end = 2-10）")
print("结论: 无论哪版，负权都不保证正确 → 必须 Bellman-Ford（外汇套利检测负环同款算法）\n")

print("=== 实验3：堆优化 vs 表格法 —— 5000 节点随机图 ===")
N = 5000
random.seed(7)
g3 = {}
for i in range(N):
    g3[i] = {j: random.randint(1, 100)
             for j in random.sample([k for k in range(N) if k != i], 8)}

t0 = time.perf_counter(); c1, p1 = dijkstra_table(g3, 0, N-1); t1 = time.perf_counter() - t0
t0 = time.perf_counter(); c2, p2 = dijkstra_heap(g3, 0, N-1); t2 = time.perf_counter() - t0
print(f"表格法 O(V^2): {t1*1000:8.1f} ms   堆优化 O((V+E)logV): {t2*1000:6.1f} ms")
print(f"堆优化快 {t1/t2:.1f} 倍；两版代价一致: {c1 == c2} ✅")
print(f"路径长度: {len(p2)} 站；E≈{N*8:,}  vs  V^2={N*N:,} —— 图越大差距越离谱")
