# 参考实现（官方版）

def find_smallest(arr):
    smallest = arr[0]
    smallest_index = 0
    for i in range(1, len(arr)):
        if arr[i] < smallest:
            smallest = arr[i]
            smallest_index = i
    return smallest_index


def selection_sort(arr):
    new_arr = []
    for _ in range(len(arr)):          # 挑 n 次
        smallest = find_smallest(arr)  # 每次扫描剩余全部 → n 次
        new_arr.append(arr.pop(smallest))
    return new_arr
