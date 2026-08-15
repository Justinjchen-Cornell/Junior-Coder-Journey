# 从零实现：递归（不看参考）
#
# 直觉：俄罗斯套娃——打开最外层，里面是"稍小的同一个问题"。
#       递归 = 函数调用自己 + 一个保证会停下来的"出口"（基线条件）。

def factorial(n):
    """n! = n × (n-1) × ... × 1。递归版：把 n! 变成 n × (n-1)!"""
    if n <= 1:          # 基线条件：1! = 0! = 1（出口，保证递归停止）
        return 1
    return n * factorial(n - 1)   # 递归条件：n! = n × (n-1)!


def countdown(n):
    """倒计时：递归版（基线=数到 0 停）"""
    if n < 0:
        return
    print(n)
    countdown(n - 1)


def sum_list(lst):
    """列表求和（第 4 章分治的前置练习）：空列表 = 0，否则 = 首元素 + 剩余和"""
    if not lst:                # 基线条件
        return 0
    return lst[0] + sum_list(lst[1:])   # 递归条件：把问题缩小一格


if __name__ == "__main__":
    assert factorial(5) == 120
    assert factorial(1) == 1
    assert factorial(0) == 1
    assert sum_list([1, 2, 3, 4, 5]) == 15
    assert sum_list([]) == 0
    print("冒烟测试通过 ✅")
