# 参考实现（官方版：卖芒果的人 —— 朋友的圈子里有没有卖芒果的？）
from collections import deque

# 图 = 你的朋友关系网络（有向图：key 认识 value 们）
graph = {}
graph["you"] = ["alice", "bob", "claire"]
graph["bob"] = ["anuj", "peggy"]
graph["alice"] = ["peggy"]
graph["claire"] = ["thom", "jonny"]
graph["anuj"] = []
graph["peggy"] = []
graph["thom"] = []
graph["jonny"] = []

def person_is_seller(name):
    return name[-1] == 'm'    # 名字以 m 结尾 = 卖芒果的（书中设定）

def search(name):
    """BFS：先查一圈朋友，再查朋友的朋友……最近的人先查"""
    search_queue = deque()                # ① 队列（FIFO）：先来先查
    search_queue += graph[name]
    searched = set()                      # ② 查过的记号（防死循环）
    while search_queue:
        person = search_queue.popleft()   # ③ 队头出队 = 离"你"最近的人
        if person not in searched:
            if person_is_seller(person):
                print(f"{person} 是卖芒果的！")
                return True
            else:
                search_queue += graph[person]   # ④ 朋友的朋友入队（排到队尾）
                searched.add(person)
    return False

search("you")   # thom 是卖芒果的
