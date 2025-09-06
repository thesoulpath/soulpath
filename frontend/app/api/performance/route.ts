import { NextResponse } from 'next/server';
import { performanceMonitor, cacheMetrics } from '@/lib/performance';
import { apiCache } from '@/lib/cache';

export async function GET() {
  try {
    const metrics = performanceMonitor.getAllMetrics();
    const cacheStats = apiCache.getStats();
    const cacheDetails = cacheMetrics.getStats();

    return NextResponse.json({
      success: true,
      performance: {
        metrics,
        cache: {
          ...cacheStats,
          ...cacheDetails
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Clear all performance metrics
    performanceMonitor.clearMetrics();
    cacheMetrics.reset();

    return NextResponse.json({
      success: true,
      message: 'Performance metrics cleared'
    });
  } catch (error) {
    console.error('Error clearing performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to clear performance metrics' },
      { status: 500 }
    );
  }
}
