class CacheManager {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 минут
    }

    async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
        const cached = this.get(key);
        if (cached) return cached;

        const data = await fetchFn();
        this.set(key, data, ttl);
        return data;
    }

    set(key, data, ttl) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { data, expiry });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.data;
    }
}
