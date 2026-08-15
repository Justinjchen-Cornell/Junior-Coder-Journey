# 从零实现：二分查找（不看参考，凭"猜数字游戏"直觉写的）
#
# 直觉：猜 1~100 的数字，每次猜中间，对方说"大了/小了"，7 次内必中。
#       有序数组 = 数字游戏，每次把搜索范围砍半。

def binary_search(arr, item, steps_counter=None):
    lo, hi = 0, len(arr) - 1          # 当前搜索范围 [lo, hi]
    while lo <= hi:                    # 范围还没空
        if steps_counter is not None:
            steps_counter[0] += 1
        mid = (lo + hi) // 2           # 猜中间（注意：// 整数除法，就是"砍半"）
        if arr[mid] == item:
            return mid                 # 猜中了
        if arr[mid] < item:
            lo = mid + 1               # 猜小了 → 只找右半边（mid 左边全排除）
        else:
            hi = mid - 1               # 猜大了 → 只找左半边
    return None                        # 范围空了还没找到 → 不存在


if __name__ == "__main__":
    # 手动冒烟测试
    assert binary_search([1, 3, 5, 7, 9], 3) == 1
    assert binary_search([1, 3, 5, 7, 9], -1) is None
    assert binary_search([], 1) is None
    assert binary_search([5], 5) == 0
    print("冒烟测试通过 ✅")
