import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitRedis } from '../rate-limit';

// Performance monitoring middleware
export class PerformanceMiddleware {
  private static instance: PerformanceMiddleware;
  private metrics = new Map<string, {
    count: number;
    totalTime: number;
    avgTime: number;
    lastAccessed: number;
  }>();

  static getInstance(): PerformanceMiddleware {
    if (!PerformanceMiddleware.instance) {
      PerformanceMiddleware.instance = new PerformanceMiddleware();
    }
    return PerformanceMiddleware.instance;
  }

  // Response compression middleware
  static async compressResponse(response: NextResponse): Promise<NextResponse> {
    const acceptEncoding = response.headers.get('accept-encoding') || '';

    if (acceptEncoding.includes('gzip')) {
      response.headers.set('content-encoding', 'gzip');
    } else if (acceptEncoding.includes('deflate')) {
      response.headers.set('content-encoding', 'deflate');
    }

    return response;
  }

  // Cache control middleware
  static setCacheHeaders(response: NextResponse, ttl: number = 300): NextResponse {
    response.headers.set('cache-control', `public, max-age=${ttl}`);
    response.headers.set('x-cache-ttl', ttl.toString());
    return response;
  }

  // Rate limiting (simple in-memory implementation)
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  static checkRateLimit(
    request: NextRequest,
    limit: number = 100,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    const key = `${ip}-${request.nextUrl.pathname}`;
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;

    const current = PerformanceMiddleware.rateLimitStore.get(key);

    if (!current || current.resetTime < now) {
      // Reset window
      PerformanceMiddleware.rateLimitStore.set(key, {
        count: 1,
        resetTime: windowStart + windowMs
      });
      return { allowed: true, remaining: limit - 1, resetTime: windowStart + windowMs };
    }

    if (current.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: current.resetTime };
    }

    current.count++;
    PerformanceMiddleware.rateLimitStore.set(key, current);

    return {
      allowed: true,
      remaining: limit - current.count,
      resetTime: current.resetTime
    };
  }

  // API response optimization
  static async optimizeApiResponse(
    request: NextRequest,
    response: NextResponse,
    options: {
      cache?: boolean;
      cacheTTL?: number;
      compress?: boolean;
      rateLimit?: boolean;
      rateLimitMax?: number;
    } = {}
  ): Promise<NextResponse> {
    const {
      cache = false,
      cacheTTL = 300,
      compress = true,
      rateLimit = false,
      rateLimitMax = 100
    } = options;

    // Apply rate limiting
    if (rateLimit) {
      const ip = request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 'unknown';
      const key = `${ip}-${request.nextUrl.pathname}`;
      const windowSeconds = Math.floor((15 * 60 * 1000) / 1000);

      // Try Redis-backed rate limit first
      const redisResult = await checkRateLimitRedis(key, rateLimitMax, windowSeconds);
      const rateLimitResult = redisResult ?? PerformanceMiddleware.checkRateLimit(request, rateLimitMax);

      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          },
          {
            status: 429,
            headers: {
              'x-ratelimit-remaining': rateLimitResult.remaining.toString(),
              'x-ratelimit-reset': rateLimitResult.resetTime.toString(),
              'retry-after': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
            }
          }
        );
      }

      response.headers.set('x-ratelimit-remaining', rateLimitResult.remaining.toString());
      response.headers.set('x-ratelimit-reset', rateLimitResult.resetTime.toString());
    }

    // Apply caching
    if (cache) {
      response = PerformanceMiddleware.setCacheHeaders(response, cacheTTL);
    }

    // Apply compression
    if (compress) {
      response = await PerformanceMiddleware.compressResponse(response);
    }

    // Add performance headers
    response.headers.set('x-response-time', Date.now().toString());
    response.headers.set('x-powered-by', 'SOULPATH-API');

    return response;
  }

  // Performance monitoring
  static recordApiCall(
    path: string,
    method: string,
    duration: number,
    _statusCode: number
  ): void {
    const key = `${method}:${path}`;
    const instance = PerformanceMiddleware.getInstance();

    const current = instance.metrics.get(key) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      lastAccessed: Date.now()
    };

    current.count++;
    current.totalTime += duration;
    current.avgTime = current.totalTime / current.count;
    current.lastAccessed = Date.now();

    instance.metrics.set(key, current);

    // Log slow requests
    if (duration > 1000) {
      console.warn(`🐌 Slow API call: ${key} took ${duration}ms`);
    }
  }

  static getMetrics(): Array<{
    path: string;
    method: string;
    count: number;
    avgTime: number;
    totalTime: number;
  }> {
    const instance = PerformanceMiddleware.getInstance();
    return Array.from(instance.metrics.entries()).map(([key, data]) => {
      const [method, path] = key.split(':');
      return {
        path,
        method,
        count: data.count,
        avgTime: Math.round(data.avgTime),
        totalTime: Math.round(data.totalTime)
      };
    });
  }
}

// API optimization wrapper
export function withApiOptimization(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    cache?: boolean;
    cacheTTL?: number;
    compress?: boolean;
    rateLimit?: boolean;
    rateLimitMax?: number;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();

    try {
      const response = await handler(request);

      // Record performance metrics
      const duration = Date.now() - startTime;
      PerformanceMiddleware.recordApiCall(
        request.nextUrl.pathname,
        request.method,
        duration,
        response.status
      );

      // Apply optimizations
      return await PerformanceMiddleware.optimizeApiResponse(request, response, options);

    } catch (error) {
      const duration = Date.now() - startTime;
      PerformanceMiddleware.recordApiCall(
        request.nextUrl.pathname,
        request.method,
        duration,
        500
      );

      console.error('API Error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
