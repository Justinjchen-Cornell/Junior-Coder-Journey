"""测速/演示：递归的两个致命坑（这是本章最有价值的实测）"""
import sys
from solution import factorial, countdown

print("=== 坑1：递归深度限制（Python 默认上限 1000）===")
try:
    sys.setrecursionlimit(1000)
    factorial(1500)
except RecursionError:
    print(f"factorial(1500) → RecursionError！默认限制={sys.getrecursionlimit()}")
print(f"但 factorial(900) 没问题: 计算中... {str(factorial(900))[:20]}... (900! 有 {len(str(factorial(900)))} 位数字)\n")

print("=== 坑2：忘了基线条件 = 无限递归（Python 会救你，但 C/JS 会崩栈）===")
def infinite():
    return infinite()
try:
    infinite()
except RecursionError as e:
    print(f"infinite() → RecursionError: {e}")

print("""
结论：
- 递归的代价：每次调用都压栈（存一份局部变量），深度太深会爆栈
- 这是后面快排"最坏情况 O(n²)+爆栈"的伏笔（第 4 章实测）
- 递归的价值：把"把问题缩小一格"的思维表达得最清晰（分治/树/图的地基）
""")
