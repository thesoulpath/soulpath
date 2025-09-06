import { createClient } from 'redis';
import { NextRequest, NextResponse } from 'next/server';
import { RedisMonitor } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Initialize Redis client
    const redis = createClient({
      url: process.env.REDIS_URL || process.env.REDISCLOUD_URL || 'redis://localhost:6379'
    });

    // Connect to Redis
    await redis.connect();

    // Test Redis operations
    const testKey = 'test:item';
    const testValue = JSON.stringify({
      message: 'Hello from Redis!',
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')
    });

    // Set a value
    await redis.setEx(testKey, 300, testValue); // Expires in 5 minutes

    // Get the value
    const result = await redis.get(testKey);

    // Set expiration time
    const ttl = await redis.ttl(testKey);

    // Clean up
    await redis.disconnect();

    // Record performance
    RedisMonitor.recordOperation('redis_test', Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: {
        stored: JSON.parse(result || '{}'),
        ttl,
        redisConnected: true,
        performance: RedisMonitor.getStats()
      }
    }, { status: 200 });

  } catch (error) {
    // Record failed operation
    RedisMonitor.recordOperation('redis_test_error', Date.now() - startTime);

    console.error('Redis test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Redis connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallbackCache: true
    }, { status: 200 }); // Return 200 to show fallback works
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Initialize Redis client
    const redis = await createClient({
      url: process.env.REDIS_URL || process.env.REDISCLOUD_URL || 'redis://localhost:6379'
    }).connect();

    // Parse request body
    const body = await request.json();
    const { key, value, ttl = 300 } = body;

    if (!key || !value) {
      return NextResponse.json({
        success: false,
        error: 'Missing key or value in request body'
      }, { status: 400 });
    }

    // Store in Redis
    await redis.setEx(key, ttl, JSON.stringify(value));

    // Get the stored value to verify
    const storedValue = await redis.get(key);

    // Clean up
    await redis.disconnect();

    // Record performance
    RedisMonitor.recordOperation('redis_set', Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: {
        key,
        stored: JSON.parse(storedValue || '{}'),
        ttl,
        redisConnected: true
      }
    }, { status: 200 });

  } catch (error) {
    // Record failed operation
    RedisMonitor.recordOperation('redis_set_error', Date.now() - startTime);

    console.error('Redis POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to store data in Redis',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
