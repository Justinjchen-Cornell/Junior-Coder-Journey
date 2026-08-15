# 参考实现（官方版：换钢琴的最省钱交易链）
# 目标：从 start 到 fin，每条边有"价钱"，找总价最低的路

# 图：邻接表 + 边权（node -> {邻居: 花费}）
graph = {}
graph["start"] = {"a": 6, "b": 2}
graph["a"] = {"fin": 1}
graph["b"] = {"a": 3, "fin": 5}
graph["fin"] = {}

infinity = float("inf")
costs = {"a": 6, "b": 2, "fin": infinity}   # 从 start 到各节点的初始花费
parents = {"a": "start", "b": "start", "fin": None}
processed = []

def find_lowest_cost_node(costs):
    lowest_cost = float("inf")
    lowest_cost_node = None
    for node in costs:
        cost = costs[node]
        if cost < lowest_cost and node not in processed:
            lowest_cost = cost
            lowest_cost_node = node
    return lowest_cost_node

node = find_lowest_cost_node(costs)
while node is not None:
    cost = costs[node]
    neighbors = graph[node]
    for n in neighbors.keys():
        new_cost = cost + neighbors[n]
        if costs[n] > new_cost:              # 发现更便宜的路 → 更新
            costs[n] = new_cost
            parents[n] = node
    processed.append(node)
    node = find_lowest_cost_node(costs)

# start→fin 最便宜: start→b→a→fin = 2+3+1 = 6
