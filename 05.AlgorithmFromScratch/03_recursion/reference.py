# 参考实现（官方版：countdown / greet / factorial）

def countdown(i):
    print(i)
    if i <= 0:          # 基线条件：停止递归的"刹车"
        return
    else:
        countdown(i - 1)  # 递归条件：调用自己

def greet(name):
    print(f"hello, {name}!")
    greet2(name)
    print("getting ready to say bye...")
    bye()

def greet2(name):
    print(f"how are you, {name}?")

def bye():
    print("ok bye!")

def factorial(x):
    if x == 1:          # 基线条件
        return 1
    else:
        return x * factorial(x - 1)  # 递归条件
