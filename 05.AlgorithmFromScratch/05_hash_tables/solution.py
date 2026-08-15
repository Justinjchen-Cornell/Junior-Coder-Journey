# 从零实现：哈希表（链式寻址 + 动态扩容）
#
# 直觉：图书馆按索书号上架——每本书有唯一编号，扫一眼编号就能走到书架前，
#       不用把全馆的书翻一遍。哈希函数 = 给每个"键"发一个储物柜号。
#
# 三个零件：
#   ① 哈希函数：键 → 数字（理想：均匀散开）
#   ② 数组（桶）：按数字放东西
#   ③ 冲突解决：两个键撞到同一格 → 格子里挂一条链（链表）


class HashTable:
    def __init__(self, size=8):
        self.size = size
        self.buckets = [[] for _ in range(size)]  # 每个桶是一条链（用列表当链表）
        self.count = 0                            # 已存键值对数量
        self.LOAD_LIMIT = 0.75                    # 负载因子上限

    # ---- ① 哈希函数：FNV-1a（从零写，不用内置 hash()）----
    def _hash(self, key):
        h = 2166136261
        for byte in str(key).encode("utf-8"):
            h ^= byte
            h = (h * 16777619) & 0xFFFFFFFF        # 32 位回绕
        return h % self.size

    def _load_factor(self):
        return self.count / self.size

    # ---- ② 核心操作 ----
    def put(self, key, value):
        idx = self._hash(key)
        bucket = self.buckets[idx]
        for i, (k, v) in enumerate(bucket):        # 键已存在 → 覆盖（更新）
            if k == key:
                bucket[i] = (key, value)
                return
        bucket.append((key, value))                # 新键 → 挂到链尾
        self.count += 1
        if self._load_factor() > self.LOAD_LIMIT:  # ③ 太挤了 → 扩容
            self._resize()

    def get(self, key):
        idx = self._hash(key)
        for k, v in self.buckets[idx]:             # 只在一条链里找
            if k == key:
                return v
        raise KeyError(key)

    def delete(self, key):
        idx = self._hash(key)
        bucket = self.buckets[idx]
        for i, (k, v) in enumerate(bucket):
            if k == key:
                bucket.pop(i)
                self.count -= 1
                return
        raise KeyError(key)

    def __contains__(self, key):
        try:
            self.get(key)
            return True
        except KeyError:
            return False

    # ---- ③ 扩容：翻倍 + 全部重哈希（rehash）----
    def _resize(self):
        old_buckets = self.buckets
        self.size *= 2
        self.buckets = [[] for _ in range(self.size)]
        self.count = 0
        for bucket in old_buckets:
            for k, v in bucket:
                self.put(k, v)                     # 用新 size 重新散列


if __name__ == "__main__":
    ht = HashTable()
    ht.put("apple", 0.67)
    ht.put("milk", 1.49)
    assert ht.get("apple") == 0.67
    assert ht.get("milk") == 1.49
    ht.put("apple", 0.99)          # 覆盖更新
    assert ht.get("apple") == 0.99
    ht.delete("milk")
    assert "milk" not in ht
    try:
        ht.get("banana")
        assert False
    except KeyError:
        pass
    print("冒烟测试通过 ✅")
