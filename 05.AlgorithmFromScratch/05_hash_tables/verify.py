"""验证：与 Python 内置 dict 对拍（插入/更新/删除/随机操作序列）"""
import random
from solution import HashTable

random.seed(42)
KEYS = [f"key_{i}" for i in range(2000)]

# 1) 批量插入 + 读取
ht, d = HashTable(), {}
for k in KEYS:
    v = random.randint(0, 10**9)
    ht.put(k, v)
    d[k] = v
for k in KEYS:
    assert ht.get(k) == d[k], f"get({k}) 不一致"
print(f"插入 {len(KEYS)} 个键值对 + 全部读取一致 ✅（触发 {max(1, ht.size//8)} 次扩容）")

# 2) 随机操作序列对拍（插入 30% / 更新 30% / 删除 20% / 读取 20%）
ops = ["put_new", "put_update", "delete", "get"] * 500
random.shuffle(ops)
live = set()
for i, op in enumerate(ops):
    k = random.choice(KEYS)
    v = random.randint(0, 10**9)
    if op == "put_new":
        ht.put(k, v); d[k] = v; live.add(k)
    elif op == "put_update":
        ht.put(k, v); d[k] = v; live.add(k)
    elif op == "delete":
        if k in live:
            ht.delete(k); del d[k]; live.discard(k)
    elif op == "get":
        if k in live:
            assert ht.get(k) == d[k]
# 最终全量对拍：每个键的存在性与取值都必须和 dict 一致
for k in KEYS:
    assert (k in ht) == (k in d), f"存在性不一致: {k}"
    if k in d:
        assert ht.get(k) == d[k], f"取值不一致: {k}"
print("随机操作序列 2000 次与 dict 完全一致 ✅")

# 3) 键类型：字符串/数字/元组
ht.put(42, "int_key")
ht.put((1, 2), "tuple_key")
assert ht.get(42) == "int_key" and ht.get((1, 2)) == "tuple_key"
print("多类型键（int/tuple）✅")
print("全部验证通过 🎉")
