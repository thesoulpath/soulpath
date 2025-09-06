import { createClient } from "redis";
import { NextResponse } from "next/server";

// Create and connect Redis client
let redis: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL || process.env.REDISCLOUD_URL || 'redis://localhost:6379'
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redis.on('connect', () => {
      console.log('Connected to Redis');
    });

    await redis.connect();
  }
  return redis;
}

export async function GET() {
  try {
    const redisClient = await getRedisClient();
    const value = await redisClient.get("myKey");

    return NextResponse.json({ value });
  } catch (error) {
    console.error('Redis GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get value from Redis' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const redisClient = await getRedisClient();
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    await redisClient.set(key, String(value));

    return NextResponse.json({
      success: true,
      key,
      value
    });
  } catch (error) {
    console.error('Redis SET error:', error);
    return NextResponse.json(
      { error: 'Failed to set value in Redis' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const redisClient = await getRedisClient();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }

    const result = await redisClient.del(key);

    return NextResponse.json({
      success: true,
      key,
      deleted: result > 0
    });
  } catch (error) {
    console.error('Redis DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete key from Redis' },
      { status: 500 }
    );
  }
}
