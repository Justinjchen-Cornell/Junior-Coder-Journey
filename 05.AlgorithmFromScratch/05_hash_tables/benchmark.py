"""测速：① 哈希表 vs 线性查找 ② 坏哈希函数的灾难"""
import random, time
from solution import HashTable

N = 100_000
KEYS = [f"user_{i}" for i in range(N)]

print("=== 实验1：O(1) vs O(n)——100,000 个键里查找 ===")
# 哈希表（自己的实现）
ht = HashTable()
for k in KEYS:
    ht.put(k, random.randint(0, 10**9))
t0 = time.perf_counter()
for _ in range(1000):
    ht.get(KEYS[random.randrange(N)])
ht_time = (time.perf_counter() - t0) * 1000

# 朴素列表线性查找（无序，只能从头扫）
pairs = list(zip(KEYS, [random.randint(0, 10**9) for _ in range(N)]))
def linear_search(pairs, key):
    for k, v in pairs:
        if k == key:
            return v
    return None
t0 = time.perf_counter()
for _ in range(1000):
    linear_search(pairs, KEYS[random.randrange(N)])
ls_time = (time.perf_counter() - t0) * 1000

print(f"哈希表 1000 次查找: {ht_time:8.2f} ms")
print(f"线性查找 1000 次查找: {ls_time:8.2f} ms")
print(f"差距: {ls_time/ht_time:,.0f}x —— 平均 5 万次比较 vs 1 次跳转\n")

print("=== 实验2：坏哈希函数的灾难（按 key 长度散列 → 全部撞一个桶）===")
print("注意：坏哈希插入 O(n) 单次 → 10 万个键是 100 亿次操作（刚才实测直接卡死 2 分钟）")
print("本身就是灾难证明。这里降到 n=2000 演示：")
N2 = 2000
KEYS2 = [f"user_{i}" for i in range(N2)]

class BadHashTable(HashTable):
    def _hash(self, key):
        return len(str(key)) % self.size      # 所有同长度键 → 同一桶

# 对照组：同样 n=2000，好哈希
good2 = HashTable()
t0 = time.perf_counter()
for k in KEYS2:
    good2.put(k, 1)
good_fill = (time.perf_counter() - t0) * 1000
t0 = time.perf_counter()
for _ in range(1000):
    good2.get(KEYS2[random.randrange(N2)])
good_time = (time.perf_counter() - t0) * 1000

bad = BadHashTable()
t0 = time.perf_counter()
for k in KEYS2:                                # 全部撞同一桶！
    bad.put(k, 1)
bad_fill = (time.perf_counter() - t0) * 1000
t0 = time.perf_counter()
for _ in range(1000):
    bad.get(KEYS2[random.randrange(N2)])
bad_time = (time.perf_counter() - t0) * 1000

print(f"好哈希(n=2000): 插入 {good_fill:6.1f} ms  查找 {good_time:6.2f} ms")
print(f"坏哈希(n=2000): 插入 {bad_fill:6.1f} ms  查找 {bad_time:6.2f} ms  ← 每桶链长 2000")
print(f"查找退化: {bad_time/good_time:,.0f}x（n 越大差距越离谱，10 万键直接卡死）")
print("""
结论：
- 哈希函数的质量决定一切：均匀散开 → O(1)；全撞一起 → O(n)
- 负载因子 > 0.75 触发扩容 = 保持"链短"的工程手段（本实现已内置）
""")
