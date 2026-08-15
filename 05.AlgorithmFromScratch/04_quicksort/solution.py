# 从零实现：快速排序（分而治之 D&C）
#
# 直觉：整理书架——随手拿一本书做"基准"，比它薄的放左边，厚的放右边；
#       然后左右两堆各自再用同样的方法整理。分到只剩 1 本就完成了。
#
# 分而治之三步曲（本算法的心法）：
#   ① 找基线条件（最简单的情况：0 或 1 个元素，天然有序）
#   ② 把问题缩小（选 pivot，分两半——每半都比原问题小）
#   ③ 递归处理两半，拼起来

def quicksort(arr):
    if len(arr) < 2:            # 基线：0/1 个元素，不用排
        return arr
    pivot = arr[len(arr) // 2]  # 选中间作基准（比选第一个更抗"已排序"坏情况）
    less = [x for x in arr if x < pivot]
    equal = [x for x in arr if x == pivot]
    greater = [x for x in arr if x > pivot]
    return quicksort(less) + equal + quicksort(greater)


if __name__ == "__main__":
    assert quicksort([10, 5, 1, 2, 3]) == [1, 2, 3, 5, 10]
    assert quicksort([]) == []
    assert quicksort([1]) == [1]
    assert quicksort([3, 3, 3]) == [3, 3, 3]     # 重复元素
    assert quicksort([5, 4, 3, 2, 1]) == [1, 2, 3, 4, 5]  # 逆序
    print("冒烟测试通过 ✅")
