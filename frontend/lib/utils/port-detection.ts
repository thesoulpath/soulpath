/**
 * Simple utility functions for URL generation
 */

/**
 * Get the base URL for the Next.js application
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

/**
 * Get the current server port from environment
 */
export function getCurrentPort(): number {
  if (process.env.PORT) {
    return parseInt(process.env.PORT);
  }

  return 3000; // Default fallback
}

/**
 * Check if we're running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if we're running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}
