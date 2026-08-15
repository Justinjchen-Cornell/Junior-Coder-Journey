# 从零实现：Dijkstra 最便宜路径（两版：书式表格法 + 工程堆优化）
#
# 直觉：打车回家，车上有块"最低价面板"。每次到站，问自己：
#       "从这站出发，能不能让面板上的某个数字变得更小？能就更新。"
#       永远先处理面板上最便宜的那一站——因为边权非负，走它不会绕远。
#
# 贪心核心（非负权值才成立）：
#       每次选"当前最便宜未处理"的节点，它到 start 的代价就是最终答案。
#       负权值会打破这一点（见 benchmark 负权演示）→ 需 Bellman-Ford。


def _trace_back(parents, end):
    if end not in parents:
        return None                        # 不可达
    path, cur = [], end
    while cur is not None:
        path.append(cur)
        cur = parents[cur]
    return list(reversed(path))


# ---- 版本 A：书式表格法（O(V²)，思路最直白）----
def dijkstra_table(graph, start, end):
    costs = {start: 0}                     # 已知最低代价表
    parents = {start: None}                # 路径回溯表
    processed = set()                      # 已确定最终代价的节点

    while True:
        # 找"代价最小且未处理"的节点（面板上最便宜的一站）
        node = None
        best = float("inf")
        for n, c in costs.items():
            if n not in processed and c < best:
                best, node = c, n
        if node is None:                   # 全处理完 / 不可达区域
            break
        cost = best
        for nb, w in graph.get(node, {}).items():
            new_cost = cost + w
            if new_cost < costs.get(nb, float("inf")):
                costs[nb] = new_cost       # 更新面板（发现更便宜的路）
                parents[nb] = node
        processed.add(node)                # 该站定案
    return costs.get(end, float("inf")), _trace_back(parents, end)


# ---- 版本 B：堆优化（O((V+E)logV)，工程版）----
import heapq

def dijkstra_heap(graph, start, end):
    pq = [(0, start)]                      # 优先队列：小根堆
    costs = {start: 0}
    parents = {start: None}

    while pq:
        cost, node = heapq.heappop(pq)
        if cost > costs.get(node, float("inf")):
            continue                       # 过期条目（已被更优路径覆盖）
        if node == end:
            break                          # 首次弹出 end = 已定案
        for nb, w in graph.get(node, {}).items():
            new_cost = cost + w
            if new_cost < costs.get(nb, float("inf")):
                costs[nb] = new_cost
                parents[nb] = node
                heapq.heappush(pq, (new_cost, nb))   # 入堆（旧的留着，自然过期）
    return costs.get(end, float("inf")), _trace_back(parents, end)


if __name__ == "__main__":
    # 书中示例：start→fin 最便宜 = start→b→a→fin = 6
    g = {
        "start": {"a": 6, "b": 2},
        "a": {"fin": 1},
        "b": {"a": 3, "fin": 5},
        "fin": {},
    }
    for fn in (dijkstra_table, dijkstra_heap):
        cost, path = fn(g, "start", "fin")
        assert cost == 6 and path == ["start", "b", "a", "fin"], (fn.__name__, cost, path)
    print("书中示例: start→b→a→fin = 2+3+1 = 6 ✅（两版一致）")
