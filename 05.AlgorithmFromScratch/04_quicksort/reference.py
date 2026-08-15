# 参考实现（官方版：分而治之 + 快排）

def quicksort(array):
    if len(array) < 2:      # 基线条件：0 或 1 个元素 = 天然有序
        return array
    else:
        pivot = array[0]    # 基准值：随便选（这里选第一个）
        less = [i for i in array[1:] if i <= pivot]    # 小于等于基准的
        greater = [i for i in array[1:] if i > pivot]  # 大于基准的
        return quicksort(less) + [pivot] + quicksort(greater)  # 递归两半


# 书中分治铺垫：递归求 max
def rec_max(arr):
    if len(arr) == 2:
        return arr[0] if arr[0] > arr[1] else arr[1]
    sub_max = rec_max(arr[1:])
    return arr[0] if arr[0] > sub_max else sub_max
