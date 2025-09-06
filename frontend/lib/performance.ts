// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric(label, duration);
    };
  }

  recordMetric(label: string, duration: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);

    // Keep only last 100 measurements to avoid memory issues
    const measurements = this.metrics.get(label)!;
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  getMetrics(label: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
    last: number;
  } | null {
    const measurements = this.metrics.get(label);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const sum = measurements.reduce((a, b) => a + b, 0);
    return {
      avg: Math.round(sum / measurements.length),
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      count: measurements.length,
      last: measurements[measurements.length - 1]
    };
  }

  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [label] of this.metrics.entries()) {
      result[label] = this.getMetrics(label);
    }
    return result;
  }

  clearMetrics(label?: string): void {
    if (label) {
      this.metrics.delete(label);
    } else {
      this.metrics.clear();
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Middleware to monitor API performance
export function withPerformanceMonitoring<T extends any[]>(
  fn: (...args: T) => Promise<any>,
  label: string
) {
  return async (...args: T) => {
    const endTimer = performanceMonitor.startTimer(label);
    try {
      const result = await fn(...args);
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  };
}

// Cache hit/miss tracking
export class CacheMetrics {
  private static instance: CacheMetrics;
  private hits = 0;
  private misses = 0;

  static getInstance(): CacheMetrics {
    if (!CacheMetrics.instance) {
      CacheMetrics.instance = new CacheMetrics();
    }
    return CacheMetrics.instance;
  }

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  getStats(): { hits: number; misses: number; hitRate: number; total: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
      total
    };
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

export const cacheMetrics = CacheMetrics.getInstance();
