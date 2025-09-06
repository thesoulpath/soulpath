#!/usr/bin/env node

/**
 * Database Performance Optimization Script
 * This script applies performance optimizations to the PostgreSQL database
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function optimizeDatabase() {
  console.log('🚀 Starting database performance optimization...\n');

  try {
    // Check if .env file exists
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      throw new Error('❌ .env file not found. Please create one with DATABASE_URL.');
    }

    // Read database URL from .env
    const envContent = fs.readFileSync(envPath, 'utf8');
    const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
    if (!dbUrlMatch) {
      throw new Error('❌ DATABASE_URL not found in .env file.');
    }

    const databaseUrl = dbUrlMatch[1].replace(/['"]/g, '');
    console.log('✅ Found database configuration');

    // Create optimized Prisma client configuration
    console.log('📝 Updating Prisma configuration...');
    const prismaConfigPath = path.join(process.cwd(), 'lib', 'prisma.ts');

    if (fs.existsSync(prismaConfigPath)) {
      let prismaContent = fs.readFileSync(prismaConfigPath, 'utf8');

      // Add performance optimizations to Prisma client
      if (!prismaContent.includes('connection:')) {
        prismaContent = prismaContent.replace(
          '  log: process.env.NODE_ENV === \'development\' ? [\'query\', \'error\', \'warn\'] : [\'error\'],',
          `  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Performance optimizations
  connection: {
    maxIdleTime: 30000,
    maxLifetime: 600000,
  },`
        );

        fs.writeFileSync(prismaConfigPath, prismaContent);
        console.log('✅ Updated Prisma configuration with performance optimizations');
      }
    }

    // Generate Prisma client with optimizations
    console.log('🔄 Generating optimized Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Apply database optimizations
    console.log('⚡ Applying database optimizations...');

    const sqlPath = path.join(process.cwd(), 'scripts', 'optimize-database.sql');
    if (fs.existsSync(sqlPath)) {
      console.log('📊 Running database optimization queries...');

      // Use psql to execute the SQL file
      const psqlCommand = `psql "${databaseUrl}" -f "${sqlPath}"`;

      try {
        execSync(psqlCommand, { stdio: 'inherit' });
        console.log('✅ Database optimizations applied successfully');
      } catch (error) {
        console.warn('⚠️  Some database optimizations may require manual execution');
        console.log('📋 Please run the following command manually:');
        console.log(`psql "${databaseUrl.replace(/:[^:]+@/, ':***@')}" -f "${sqlPath}"`);
      }
    }

    // Create performance monitoring API endpoint
    console.log('📊 Creating performance monitoring API...');
    const performanceApiPath = path.join(process.cwd(), 'app', 'api', 'performance', 'route.ts');

    if (!fs.existsSync(path.dirname(performanceApiPath))) {
      fs.mkdirSync(path.dirname(performanceApiPath), { recursive: true });
    }

    const performanceApiContent = `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const cacheKey = 'performance-stats';

    return await apiCache.getOrSet(cacheKey, async () => {
      // Get database performance metrics
      const [connectionCount, dbSize, slowQueries, cacheStats] = await Promise.all([
        prisma.$queryRaw\`SELECT count(*) as connections FROM pg_stat_activity WHERE state = 'active'\`,
        prisma.$queryRaw\`SELECT pg_size_pretty(pg_database_size(current_database())) as size\`,
        prisma.$queryRaw\`SELECT count(*) as slow_queries FROM pg_stat_statements WHERE mean_time > 1000\`,
        prisma.$queryRaw\`SELECT
          ROUND((sum(blks_hit) * 100.0 / (sum(blks_hit) + sum(blks_read)))::numeric, 2) as cache_hit_ratio
          FROM pg_stat_database\`
      ]);

      const stats = {
        connections: connectionCount[0]?.connections || 0,
        databaseSize: dbSize[0]?.size || 'Unknown',
        slowQueries: slowQueries[0]?.slow_queries || 0,
        cacheHitRatio: cacheStats[0]?.cache_hit_ratio || 0,
        apiCache: apiCache.getStats(),
        timestamp: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        data: stats
      });
    }, 30000); // Cache for 30 seconds

  } catch (error) {
    console.error('Performance monitoring error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}`;

    fs.writeFileSync(performanceApiPath, performanceApiContent);
    console.log('✅ Created performance monitoring API endpoint');

    // Update package.json scripts
    console.log('📦 Updating package.json scripts...');
    const packagePath = path.join(process.cwd(), 'package.json');

    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts['db:optimize'] = 'node scripts/optimize-database.js';
      packageJson.scripts['perf:monitor'] = 'curl http://localhost:3000/api/performance';

      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Added database optimization scripts to package.json');
    }

    console.log('\n🎉 Database performance optimization completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run db:optimize');
    console.log('2. Monitor performance: npm run perf:monitor');
    console.log('3. Check API cache: http://localhost:3000/api/performance');

  } catch (error) {
    console.error('❌ Database optimization failed:', error.message);
    process.exit(1);
  }
}

// Run the optimization if this script is executed directly
if (require.main === module) {
  optimizeDatabase();
}

module.exports = { optimizeDatabase };
