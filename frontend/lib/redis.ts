import { createClient, RedisClientType } from 'redis';
import { env } from './env';

// Redis client configuration
class RedisManager {
  private static instance: RedisManager;
  private client: RedisClientType | null = null;
  private isConnected = false;

  private constructor() {}

  static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  async connect(): Promise<RedisClientType> {
    if (this.client && this.isConnected) {
      return this.client;
    }

    try {
      // Create Redis client with environment-based configuration
      const redisUrl = env.REDIS_URL ?? process.env.REDISCLOUD_URL ?? 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 60000,
        }
      });

      // Handle connection events
      this.client.on('error', (err) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Redis Client Error:', err);
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Connected to Redis');
        }
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('❌ Disconnected from Redis');
        }
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
      return this.client;

    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Fallback to in-memory cache if Redis fails
      console.log('⚠️  Falling back to in-memory cache');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  getClient(): RedisClientType | null {
    return this.client;
  }

  isRedisConnected(): boolean {
    return this.isConnected;
  }

  // Utility methods for common Redis operations
  async set(key: string, value: string, ttl?: number): Promise<string | null> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Redis client not connected');
      }

      if (ttl) {
        return await this.client.setEx(key, ttl, value);
      } else {
        return await this.client.set(key, value);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Redis client not connected');
      }

      return await this.client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Redis client not connected');
      }

      return await this.client.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
      throw error;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Redis client not connected');
      }

      return await this.client.exists(key);
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      throw error;
    }
  }

  async expire(key: string, ttl: number): Promise<number> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Redis client not connected');
      }

      return await this.client.expire(key, ttl);
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
      throw error;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Redis client not connected');
      }

      return await this.client.ttl(key);
    } catch (error) {
      console.error('Redis TTL error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const redisManager = RedisManager.getInstance();

// Initialize Redis connection (call this in your app)
export async function initRedis(): Promise<RedisClientType | null> {
  try {
    return await redisManager.connect();
  } catch (_error) {
    console.warn('Redis initialization failed, using fallback cache');
    return null;
  }
}

// Graceful shutdown
export async function closeRedis(): Promise<void> {
  await redisManager.disconnect();
}

// Performance monitoring for Redis
export class RedisMonitor {
  private static operations = new Map<string, { count: number; totalTime: number }>();

  static recordOperation(operation: string, duration: number): void {
    const current = RedisMonitor.operations.get(operation) || { count: 0, totalTime: 0 };
    current.count++;
    current.totalTime += duration;
    RedisMonitor.operations.set(operation, current);
  }

  static getStats(): Array<{ operation: string; count: number; avgTime: number }> {
    return Array.from(RedisMonitor.operations.entries()).map(([operation, data]) => ({
      operation,
      count: data.count,
      avgTime: Math.round(data.totalTime / data.count)
    }));
  }
}
