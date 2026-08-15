# 从零实现：BFS 广度优先搜索 + 最短路径
#
# 直觉：水波纹——往池塘扔石头，波纹一圈圈向外扩散。
#       先到的波纹（近的人）一定先碰到岸（目标），所以 BFS 找到的路径最短。
#       关键道具：队列（FIFO 先来先查）——和栈（LIFO 后来先查）相反。
#
# 三步组装：
#   ① 队列：先来先查的"排队机制"（BFS 与 DFS 唯一的区别就在这）
#   ② 去重：查过的人记下来，防死循环（图可能有环！）
#   ③ 记路径：每个节点记录"我从哪来的"（parent），回溯拼出最短路径


# ---- ① 从零写一个 FIFO 队列 ----
class Queue:
    """环形队列：head 指针前移，避免 pop(0) 的 O(n) 开销
    （Python 工程上直接用 collections.deque，这里展示原理）"""
    def __init__(self):
        self._data = []
        self._head = 0

    def push(self, item):
        self._data.append(item)

    def pop(self):
        if self._head >= len(self._data):
            raise IndexError("空队列")
        item = self._data[self._head]
        self._head += 1
        return item

    def __len__(self):
        return len(self._data) - self._head

    def __bool__(self):
        return len(self) > 0


# ---- ② BFS：查是否存在目标 ----
def bfs_has_target(graph, start, is_target):
    q = Queue()
    q.push(start)
    visited = set()
    while q:
        node = q.pop()                 # 队头 = 距离起点最近的一批
        if node in visited:
            continue
        visited.add(node)
        if is_target(node):
            return True, node
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                q.push(neighbor)       # 邻居入队（波纹向外一圈）
    return False, None


# ---- ③ BFS 最短路径：parent 回溯 ----
def bfs_shortest_path(graph, start, target):
    """返回从 start 到 target 的最短路径（节点列表）；不可达返回 None"""
    if start == target:
        return [start]
    q = Queue()
    q.push(start)
    visited = {start}
    parent = {start: None}             # 记录"谁带我进来的"——回溯的依据

    while q:
        node = q.pop()
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                parent[neighbor] = node
                if neighbor == target:
                    return _trace_back(parent, target)
                q.push(neighbor)
    return None


def _trace_back(parent, target):
    path = []
    cur = target
    while cur is not None:
        path.append(cur)
        cur = parent[cur]
    return list(reversed(path))


# ---- 顺便：DFS（对比用，递归版=第 3 章的栈）----
def dfs_shortest_path(graph, start, target, path=None):
    """DFS 找到的"第一条"路径——通常不是最短的（走到底再回头）"""
    if path is None:
        path = [start]
    if start == target:
        return path
    for neighbor in graph.get(start, []):
        if neighbor not in path:       # 防环
            result = dfs_shortest_path(graph, neighbor, target, path + [neighbor])
            if result:
                return result
    return None


if __name__ == "__main__":
    # 书中示例图：thom 是卖芒果的
    graph = {
        "you": ["alice", "bob", "claire"],
        "bob": ["anuj", "peggy"],
        "alice": ["peggy"],
        "claire": ["thom", "jonny"],
        "anuj": [], "peggy": [], "thom": [], "jonny": [],
    }
    found, who = bfs_has_target(graph, "you", lambda n: n[-1] == "m")
    assert found and who == "thom"
    assert bfs_shortest_path(graph, "you", "thom") == ["you", "claire", "thom"]
    assert bfs_shortest_path(graph, "you", "anuj") == ["you", "bob", "anuj"]
    assert bfs_shortest_path(graph, "you", "jonny") == ["you", "claire", "jonny"]
    assert bfs_shortest_path(graph, "you", "nobody") is None      # 不可达
    assert bfs_shortest_path(graph, "you", "you") == ["you"]      # 原地
    print("冒烟测试通过 ✅")
