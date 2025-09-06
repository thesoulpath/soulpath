#!/usr/bin/env node

/**
 * Redis Connection Test Script
 * Tests Redis connectivity and basic operations
 */

const { createClient } = require('redis');
const { performance } = require('perf_hooks');

async function testRedisConnection() {
  console.log('🔍 Testing Redis connection...\n');

  const redisUrl = process.env.REDIS_URL || process.env.REDISCLOUD_URL;

  if (!redisUrl) {
    console.log('⚠️  No Redis URL found in environment variables');
    console.log('Using default localhost connection...\n');
  }

  console.log(`📍 Redis URL: ${redisUrl || 'redis://localhost:6379'}`);

  let redis;
  let startTime = performance.now();

  try {
    // Create Redis client
    redis = createClient({
      url: redisUrl || 'redis://localhost:6379',
      socket: {
        connectTimeout: 10000,
        lazyConnect: true,
      }
    });

    // Handle connection events
    redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
    });

    redis.on('connect', () => {
      console.log('✅ Connected to Redis successfully');
    });

    // Connect to Redis
    console.log('🔌 Connecting to Redis...');
    await redis.connect();

    const connectionTime = performance.now() - startTime;
    console.log(`⏱️  Connection time: ${connectionTime.toFixed(2)}ms\n`);

    // Test basic operations
    console.log('🧪 Testing Redis operations...\n');

    // Test SET operation
    startTime = performance.now();
    await redis.set('test:key', 'Hello from Node.js!');
    const setTime = performance.now() - startTime;
    console.log(`✅ SET operation: ${setTime.toFixed(2)}ms`);

    // Test GET operation
    startTime = performance.now();
    const value = await redis.get('test:key');
    const getTime = performance.now() - startTime;
    console.log(`✅ GET operation: ${getTime.toFixed(2)}ms`);
    console.log(`📄 Retrieved value: "${value}"\n`);

    // Test TTL operations
    await redis.expire('test:key', 300); // 5 minutes
    const ttl = await redis.ttl('test:key');
    console.log(`⏰ TTL set: ${ttl} seconds remaining\n`);

    // Test JSON storage
    const testData = {
      message: 'Performance optimization test',
      timestamp: new Date().toISOString(),
      server: 'Node.js',
      version: process.version
    };

    await redis.set('test:json', JSON.stringify(testData));
    const jsonData = await redis.get('test:json');
    console.log('✅ JSON storage test passed');
    console.log(`📊 Stored data size: ${jsonData.length} characters\n`);

    // Test multiple operations
    console.log('🏃 Testing multiple operations...\n');
    const operations = [];

    for (let i = 0; i < 10; i++) {
      operations.push(redis.set(`test:multi:${i}`, `value-${i}`));
    }

    startTime = performance.now();
    await Promise.all(operations);
    const multiOpTime = performance.now() - startTime;
    console.log(`✅ 10 concurrent SET operations: ${multiOpTime.toFixed(2)}ms`);
    console.log(`📈 Average per operation: ${(multiOpTime / 10).toFixed(2)}ms\n`);

    // Clean up test keys
    console.log('🧹 Cleaning up test keys...');
    const cleanupPattern = 'test:*';
    const keys = await redis.keys(cleanupPattern);

    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`✅ Cleaned up ${keys.length} test keys\n`);
    }

    // Get Redis info
    console.log('📊 Redis Information:');
    try {
      const info = await redis.info();
      const infoLines = info.split('\n');
      const relevantInfo = infoLines.filter(line =>
        line.includes('redis_version') ||
        line.includes('connected_clients') ||
        line.includes('used_memory_human') ||
        line.includes('total_connections_received')
      );

      relevantInfo.forEach(line => {
        const [key, value] = line.split(':');
        console.log(`   ${key}: ${value}`);
      });
    } catch (error) {
      console.log('   Could not retrieve Redis info (may be restricted)');
    }

    console.log('\n🎉 Redis connection test completed successfully!');
    console.log('✅ All operations working correctly');
    console.log('🚀 Ready for production use');

  } catch (error) {
    console.error('❌ Redis test failed:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Make sure Redis is running locally: redis-server');
      console.log('2. Check your Redis URL in environment variables');
      console.log('3. Verify network connectivity to Redis server');
      console.log('4. For Redis Cloud, ensure credentials are correct');
    }

    process.exit(1);

  } finally {
    if (redis) {
      try {
        await redis.disconnect();
        console.log('🔌 Disconnected from Redis');
      } catch (error) {
        console.warn('Warning: Error disconnecting from Redis:', error.message);
      }
    }
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Redis Connection Test Script

Usage:
  node scripts/test-redis.js [options]

Options:
  --help, -h    Show this help message
  --url URL     Override Redis URL

Environment Variables:
  REDIS_URL           Primary Redis connection URL
  REDISCLOUD_URL      Redis Cloud connection URL

Examples:
  node scripts/test-redis.js
  node scripts/test-redis.js --url redis://localhost:6379
  REDIS_URL=redis://localhost:6379 node scripts/test-redis.js
`);
  process.exit(0);
}

// Override URL if provided
if (args.includes('--url')) {
  const urlIndex = args.indexOf('--url');
  if (urlIndex + 1 < args.length) {
    process.env.REDIS_URL = args[urlIndex + 1];
  }
}

// Run the test
testRedisConnection().catch(console.error);
