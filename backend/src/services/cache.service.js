/**
 * Multi-Tier In-Memory Cache Service (SRS Section 24 - Database Design & Caching)
 * Provides high-speed sub-millisecond data retrieval, tag-based invalidation, and hit/miss analytics.
 */

class CacheService {
  constructor(defaultTtlSeconds = 300) {
    this.store = new Map(); // key -> { value, expiresAt, tags: Set }
    this.tagIndex = new Map(); // tag -> Set of keys
    this.defaultTtlSeconds = defaultTtlSeconds;

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      invalidations: 0,
    };

    // Garbage collect expired items every 60 seconds
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  set(key, value, ttlSeconds = this.defaultTtlSeconds, tags = []) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    const tagSet = new Set(tags);

    // Save key entry
    this.store.set(key, { value, expiresAt, tags: tagSet });
    this.stats.sets++;

    // Index tags
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag).add(key);
    }
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  delete(key) {
    const entry = this.store.get(key);
    if (entry) {
      for (const tag of entry.tags) {
        const tagSet = this.tagIndex.get(tag);
        if (tagSet) {
          tagSet.delete(key);
          if (tagSet.size === 0) this.tagIndex.delete(tag);
        }
      }
      this.store.delete(key);
    }
  }

  /**
   * Invalidate all keys matching a specific tag (e.g. 'policies', 'quotes', 'user:123')
   */
  invalidateTag(tag) {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let count = 0;
    for (const key of Array.from(keys)) {
      this.delete(key);
      count++;
    }
    this.stats.invalidations += count;
    return count;
  }

  /**
   * Helper pattern: retrieve from cache or execute async fetchFn and cache result
   */
  async getOrSet(key, fetchFn, ttlSeconds = this.defaultTtlSeconds, tags = []) {
    const cached = this.get(key);
    if (cached !== null) {
      return { data: cached, fromCache: true };
    }

    const freshData = await fetchFn();
    this.set(key, freshData, ttlSeconds, tags);
    return { data: freshData, fromCache: false };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
        this.stats.evictions++;
      }
    }
  }

  clear() {
    this.store.clear();
    this.tagIndex.clear();
  }

  getMetrics() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? ((this.stats.hits / totalRequests) * 100).toFixed(1) : 0;

    return {
      size: this.store.size,
      tagsActive: this.tagIndex.size,
      hitRatePercent: parseFloat(hitRate),
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      evictions: this.stats.evictions,
      invalidations: this.stats.invalidations,
    };
  }
}

const cacheService = new CacheService();
module.exports = cacheService;
