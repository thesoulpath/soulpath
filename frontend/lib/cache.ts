// Simple in-memory cache for API responses
import { cacheMetrics, performanceMonitor } from './performance';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      cacheMetrics.recordMiss();
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      cacheMetrics.recordMiss();
      return null;
    }

    cacheMetrics.recordHit();
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }

  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: cacheMetrics.getStats().hitRate
    };
  }
}

// Global cache instance
export const apiCache = new Cache();

// Cache wrapper function for API routes
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
  const endTimer = performanceMonitor.startTimer(`cache_${key}`);

  try {
    // Try to get from cache first
    const cached = apiCache.get<T>(key);
    if (cached) {
      endTimer();
      return cached;
    }

    // Fetch fresh data
    const fetchTimer = performanceMonitor.startTimer(`db_fetch_${key}`);
    const data = await fetcher();
    fetchTimer();

    // Cache the result
    apiCache.set(key, data, ttlMs);

    endTimer();
    return data;
  } catch (error) {
    endTimer();
    throw error;
  }
}

// Cache invalidation helpers
export function invalidateCache(pattern: string): void {
  // Simple pattern matching for cache invalidation
  for (const key of apiCache['cache'].keys()) {
    if (key.includes(pattern)) {
      apiCache.delete(key);
    }
  }
}

export function clearAllCache(): void {
  apiCache.clear();
}
