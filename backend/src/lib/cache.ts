/**
 * Redis Cache Utility with In-Memory Fallback
 *
 * Provides a unified caching interface that uses Redis when available
 * and falls back to an in-memory store when Redis is unavailable.
 *
 * Usage:
 *
 *   import { cache, withCache, invalidateCache } from "@/lib/cache";
 *
 *   // Direct cache operations
 *   await cache.set("user:123", userData, 3600);
 *   const user = await cache.get<User>("user:123");
 *   await cache.delete("user:123");
 *
 *   // Cache wrapper with automatic fetch on miss
 *   const result = await withCache("products", 300, async () => {
 *     return await fetchProductsFromDB();
 *   });
 *
 *   // Invalidate by pattern
 *   await invalidateCache("user:*");
 */

type RedisClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: "EX", ttl?: number): Promise<"OK" | null>;
  del(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushall(): Promise<"OK">;
  quit(): Promise<void>;
  on(event: string, handler: (...args: unknown[]) => void): void;
};

type MemoryEntry = {
  value: unknown;
  expiresAt: number | null;
};

/**
 * In-memory cache store used as fallback when Redis is unavailable.
 * Uses TTL-based expiration checked on read.
 */
class MemoryStore {
  private store = new Map<string, MemoryEntry>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set(key: string, value: unknown, ttlSeconds?: number): void {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deletePattern(pattern: string): void {
    const regex = this.patternToRegex(pattern);
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    return new RegExp(`^${escaped}$`);
  }
}

/**
 * Redis-backed cache with in-memory fallback.
 *
 * Automatically detects Redis availability and falls back to
 * an in-memory store if the connection fails.
 */
export class Cache {
  private redis: RedisClient | null = null;
  private memory = new MemoryStore();
  private connected = false;

  /**
   * Creates a new Cache instance.
   *
   * @param redisUrl - Redis connection URL. Falls back to REDIS_URL env var,
   *                   then to in-memory store if neither is available.
   */
  constructor(redisUrl?: string) {
    const url = redisUrl ?? process.env.REDIS_URL;
    if (!url) return;

    try {
      // Use dynamic require to prevent Webpack from statically analyzing
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Redis = eval("require")("ioredis");
      this.redis = new Redis(url, {
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        lazyConnect: false,
      });

      this.redis.on("connect", () => {
        this.connected = true;
      });

      this.redis.on("error", () => {
        this.connected = false;
      });
    } catch {
      // ioredis not installed - use in-memory fallback
      this.redis = null;
    }
  }

  /**
   * Retrieves a value from cache.
   *
   * @param key - Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.connected && this.redis) {
      try {
        const data = await this.redis.get(key);
        if (data === null) return null;
        return JSON.parse(data) as T;
      } catch {
        // Redis error - fall through to memory
      }
    }
    return this.memory.get<T>(key);
  }

  /**
   * Stores a value in cache.
   *
   * @param key - Cache key
   * @param value - Value to cache (will be JSON serialized)
   * @param ttlSeconds - Optional time-to-live in seconds
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.connected && this.redis) {
      try {
        if (ttlSeconds) {
          await this.redis.set(key, serialized, "EX", ttlSeconds);
        } else {
          await this.redis.set(key, serialized);
        }
        return;
      } catch {
        // Redis error - fall through to memory
      }
    }
    this.memory.set(key, value, ttlSeconds);
  }

  /**
   * Removes a key from cache.
   *
   * @param key - Cache key to remove
   */
  async delete(key: string): Promise<void> {
    if (this.connected && this.redis) {
      try {
        await this.redis.del(key);
      } catch {
        // Redis error - fall through to memory
      }
    }
    this.memory.delete(key);
  }

  /**
   * Removes all keys matching a glob pattern.
   *
   * @param pattern - Glob pattern (e.g. "user:*", "session:?")
   */
  async deletePattern(pattern: string): Promise<void> {
    if (this.connected && this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await Promise.all(keys.map((k) => this.redis!.del(k)));
        }
        return;
      } catch {
        // Redis error - fall through to memory
      }
    }
    this.memory.deletePattern(pattern);
  }

  /**
   * Clears all cached data.
   */
  async clear(): Promise<void> {
    if (this.connected && this.redis) {
      try {
        await this.redis.flushall();
        return;
      } catch {
        // Redis error - fall through to memory
      }
    }
    this.memory.clear();
  }

  /**
   * Closes the Redis connection gracefully.
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {
        // Ignore disconnect errors
      }
    }
    this.connected = false;
  }
}

/**
 * Global cache singleton instance.
 *
 * Uses REDIS_URL environment variable if set, otherwise falls back to in-memory.
 */
export const cache = new Cache();

/**
 * Cache wrapper that executes a function on cache miss.
 *
 * Retrieves the value from cache. If not found, executes the provided
 * function, caches the result, and returns it.
 *
 * @param key - Cache key
 * @param ttlSeconds - Time-to-live in seconds for cached result
 * @param fn - Async function to execute on cache miss
 * @returns Cached or freshly-computed value
 *
 * @example
 *   const products = await withCache("products:list", 300, async () => {
 *     return await db.product.findMany();
 *   });
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== null) return cached;

  const result = await fn();
  await cache.set(key, result, ttlSeconds);
  return result;
}

/**
 * Invalidates all cache entries matching a pattern.
 *
 * @param pattern - Glob pattern to match cache keys (e.g. "user:*")
 *
 * @example
 *   await invalidateCache("user:123:*");
 *   await invalidateCache("session:*");
 */
export async function invalidateCache(pattern: string): Promise<void> {
  await cache.deletePattern(pattern);
}
