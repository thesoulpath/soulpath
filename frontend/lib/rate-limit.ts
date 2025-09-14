import { redisManager } from './redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export async function checkRateLimitRedis(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult | null> {
  try {
    const client = await redisManager.connect();
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `${key}:${Math.floor(now / windowSeconds)}`;

    // Increment the counter and set expiry if first hit
    const count = await client.incr(windowKey);
    if (count === 1) {
      await client.expire(windowKey, windowSeconds);
    }

    const ttl = await client.ttl(windowKey);
    const remaining = Math.max(0, limit - count);
    return {
      allowed: count <= limit,
      remaining,
      resetTime: (now + (ttl > 0 ? ttl : windowSeconds)) * 1000,
    };
  } catch (_err) {
    return null;
  }
}

