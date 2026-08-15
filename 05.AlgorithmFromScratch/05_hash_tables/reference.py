# 参考实现（官方版：价格表 + 防止重复投票）

# 案例1：水果价格表 —— 哈希表的经典用途（O(1) 查价）
book = {
    "apple": 0.67,
    "milk": 1.49,
    "avocado": 1.49,
}
# book["apple"] → 0.67，不需要遍历整个表

# 案例2：防止重复投票 —— 用哈希表记住"谁已经投过"
voted = {}
def check_voter(name):
    if voted.get(name):
        print("kick them out!")
    else:
        voted[name] = True
        print("let them vote!")
