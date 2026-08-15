# 参考实现（官方版：广播台覆盖全美州问题——集合覆盖的贪心近似）

states_needed = {"mt", "wa", "or", "id", "nv", "ut", "ca", "az"}   # 要覆盖的州

stations = {}                                # 候选广播台 → 覆盖哪些州
stations["kone"] = {"id", "nv", "ut"}
stations["ktwo"] = {"wa", "id", "mt"}
stations["kthree"] = {"or", "nv", "ca"}
stations["kfour"] = {"nv", "ut"}
stations["kfive"] = {"ca", "az"}

final_stations = set()
while states_needed:
    best_station = None
    states_covered = set()
    for station, states_for_station in stations.items():
        covered = states_needed & states_for_station      # 与"还没覆盖的州"求交集
        if len(covered) > len(states_covered):            # 谁覆盖的最多选谁
            best_station = station
            states_covered = covered
    states_needed -= states_covered
    final_stations.add(best_station)

# 结果: 4 个台（贪心近似——最优解也是 4，但贪心不保证）
