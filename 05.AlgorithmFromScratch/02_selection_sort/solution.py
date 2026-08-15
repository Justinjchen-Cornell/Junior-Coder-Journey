# 从零实现：选择排序（原地交换版，与参考的 pop 版思路不同）
#
# 直觉：老师按身高排座位——每次从没排好的人里挑最矮的，放到已排序区末尾。
#       挑 n 次，每次扫一遍剩余 n 个 → 总操作 ≈ n²/2

def selection_sort(arr):
    n = len(arr)
    for i in range(n):                    # i = 已排序区的边界
        # 在 [i, n) 里找最小值的下标
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        # 把最小的换到位置 i（原地交换，不需要新数组）
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr


if __name__ == "__main__":
    assert selection_sort([5, 3, 6, 2, 10]) == [2, 3, 5, 6, 10]
    assert selection_sort([]) == []
    assert selection_sort([1]) == [1]
    assert selection_sort([3, 3, 3]) == [3, 3, 3]   # 重复元素
    print("冒烟测试通过 ✅")
