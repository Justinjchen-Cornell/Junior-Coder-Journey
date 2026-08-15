# 参考实现（官方版，来自 grokking_algorithms/01_introduction_to_algorithms）

def binary_search(arr, item, steps_counter=None):
    """在有序数组 arr 中查找 item，返回索引；未找到返回 None"""
    low = 0
    high = len(arr) - 1
    while low <= high:
        if steps_counter is not None:
            steps_counter[0] += 1
        mid = (low + high) // 2
        guess = arr[mid]
        if guess == item:
            return mid
        if guess > item:
            high = mid - 1
        else:
            low = mid + 1
    return None


# 中文版抄写错误版（mid 缺了 //2）——用来做对照组
def buggy_binary_search(arr, item, steps_counter=None):
    low = 0
    high = len(arr) - 1
    while low <= high:
        if steps_counter is not None:
            steps_counter[0] += 1
        mid = (low + high)          # ❌ 缺 // 2
        guess = arr[mid]
        if guess == item:
            return mid
        if guess > item:
            high = mid - 1
        else:
            low = mid + 1
    return None
