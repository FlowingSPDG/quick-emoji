import { Hono } from 'hono';
import type { MiddlewareHandler } from 'hono';

// In-memory rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function createRateLimitMiddleware(
  maxRequests: number,
  windowMs: number,
  keyGenerator?: (c: any) => string
): MiddlewareHandler {
  return async (c, next) => {
    const now = Date.now();
    const key = keyGenerator ? keyGenerator(c) : getClientIP(c);

    const windowKey = `${key}_${Math.floor(now / windowMs)}`;
    const current = rateLimitStore.get(windowKey) || { count: 0, resetTime: now + windowMs };

    // Clean up expired entries periodically
    if (rateLimitStore.size > 10000) {
      cleanupExpiredEntries(now);
    }

    if (now > current.resetTime) {
      // Reset window
      rateLimitStore.set(windowKey, { count: 1, resetTime: now + windowMs });
    } else if (current.count >= maxRequests) {
      // Rate limit exceeded
      return c.json({
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      }, 429, {
        'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': current.resetTime.toString()
      });
    } else {
      // Increment counter
      current.count++;
      rateLimitStore.set(windowKey, current);
    }

    await next();
  };
}

function getClientIP(c: any): string {
  return c.req.header('CF-Connecting-IP') ||
         c.req.header('X-Forwarded-For') ||
         c.req.header('X-Real-IP') ||
         'unknown';
}

function cleanupExpiredEntries(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Pre-configured middleware for different endpoints
export const globalRateLimit = createRateLimitMiddleware(100, 60000); // 100 requests per minute
export const sessionRateLimit = createRateLimitMiddleware(10, 60000); // 10 session operations per minute
export const answerRateLimit = createRateLimitMiddleware(1, 1000); // 1 answer per second