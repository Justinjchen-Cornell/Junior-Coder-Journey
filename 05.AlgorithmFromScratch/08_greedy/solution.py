# 从零实现：贪心算法（两题：集合覆盖=近似 / 活动选择=精确最优）
#
# 直觉：分糖果——每次都先拿"眼下最大的一把"，不回头。
#       贪心 = 每步局部最优，期望整体最优。
#       关键问题：什么时候贪心真的最优？什么时候只是"够好"？
#
# 本题结构：
#   问题1 集合覆盖（广播台）：贪心 ≈ 最优（近似比 ≤ ln n），NP 完全
#   问题2 活动选择（会议室）：贪心 == 最优（可证明），经典"贪心正确"案例


# ---- 问题1：集合覆盖（贪心近似）----
def greedy_set_cover(universe, sets):
    """universe: 要覆盖的元素集合
       sets: {名字: 覆盖的元素集合}
       返回: 选中的名字列表（贪心近似，不保证最小）"""
    remaining = set(universe)              # 还没覆盖的
    chosen = []
    while remaining:                       # 还有没覆盖的就继续
        best_name, best_cover = None, set()
        for name, s in sets.items():       # 扫描：谁覆盖的"未覆盖元素"最多
            cover = s & remaining
            if len(cover) > len(best_cover):
                best_name, best_cover = name, cover
        chosen.append(best_name)
        remaining -= best_cover            # 标记已覆盖
    return chosen


# ---- 问题2：活动选择（贪心精确最优）----
def greedy_activity_select(activities):
    """activities: [(开始, 结束), ...]
       选最多的互不冲突活动（会议室一次只能开一个会）
       贪心正确性：按结束时间排序，永远先选"结束最早"的（给后面留最多时间）"""
    chosen = []
    last_end = float("-inf")
    for start, end in sorted(activities, key=lambda a: a[1]):  # 按结束排序
        if start >= last_end:              # 与已选的不冲突
            chosen.append((start, end))
            last_end = end                 # 更新"最新空闲时刻"
    return chosen


if __name__ == "__main__":
    # 书中广播台示例
    universe = {"mt", "wa", "or", "id", "nv", "ut", "ca", "az"}
    stations = {
        "kone": {"id", "nv", "ut"},
        "ktwo": {"wa", "id", "mt"},
        "kthree": {"or", "nv", "ca"},
        "kfour": {"nv", "ut"},
        "kfive": {"ca", "az"},
    }
    result = greedy_set_cover(universe, stations)
    assert set(result) == {"kone", "ktwo", "kthree", "kfive"}
    # 覆盖完整性检查
    covered = set().union(*[stations[s] for s in result])
    assert covered >= universe
    print("书中广播台示例: 4 个台，覆盖全部州 ✅")

    # 活动选择示例：7 个会最多能开 5 个（9-10, 10-11, 11-12, 12-14, 14-15 互不冲突）
    acts = [(9, 10), (9, 12), (10, 11), (11, 12), (12, 14), (13, 15), (14, 15)]
    result = greedy_activity_select(acts)
    assert len(result) == 5, result
    print(f"活动选择示例: 7 个会最多选 {len(result)} 个 → {result} ✅")
