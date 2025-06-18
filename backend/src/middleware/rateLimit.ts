/**
 * Rate Limiting Middleware
 * Configurable rate limiting with Redis backing and user-based keys
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '@/utils/errors';
import { cacheService } from '@/services/cache';
import { logger } from '@/utils/logger';
import { AuthenticatedUser } from '@/types';

interface RequestWithOptionalUser extends Request {
  user?: AuthenticatedUser;
}

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  keyGenerator?: 'ip' | 'user' | 'organization' | ((req: Request) => string);
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}


/**
 * Create rate limiting middleware
 */
export function rateLimitMiddleware(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    keyGenerator = 'ip',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Too many requests, please try again later.'
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Generate rate limit key
      const key = generateKey(req as RequestWithOptionalUser, keyGenerator);
      const cacheKey = `rate_limit:${key}`;

      // Get current count
      const current = await cacheService.get<number>(cacheKey) || 0;

      // Check if limit exceeded
      if (current >= max) {
        // Since getTTL is not available on cacheService, estimate retry time
        const retryAfter = Math.ceil(windowMs / 1000);

        logger.warn('Rate limit exceeded', {
          key,
          current,
          max,
          windowMs,
          retryAfter,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          path: req.path
        });

        throw new RateLimitError(message, retryAfter);
      }

      // Set response headers
      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': Math.max(0, max - current - 1).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
      });

      // Track response to decide whether to increment
      const originalSend = res.json;
      let shouldIncrement = true;

      res.json = function(body: any) {
        const statusCode = res.statusCode;
        
        // Skip incrementing based on configuration
        if (skipSuccessfulRequests && statusCode < 400) {
          shouldIncrement = false;
        }
        if (skipFailedRequests && statusCode >= 400) {
          shouldIncrement = false;
        }

        // Increment counter if needed
        if (shouldIncrement) {
          incrementCounter(cacheKey, windowMs).catch(error => {
            logger.error('Failed to increment rate limit counter', { key, error });
          });
        }

        return originalSend.call(this, body);
      };

      next();

    } catch (error) {
      if (error instanceof RateLimitError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
          retryAfter: error.retryAfter
        });
      } else {
        logger.error('Rate limit middleware error', { error });
        next(error);
      }
    }
  };
}

/**
 * Generate rate limit key based on strategy
 */
function generateKey(
  req: RequestWithOptionalUser, 
  keyGenerator: RateLimitOptions['keyGenerator']
): string {
  if (typeof keyGenerator === 'function') {
    return keyGenerator(req);
  }

  switch (keyGenerator) {
    case 'user':
      return req.user?.id || req.ip || 'anonymous';
    case 'organization':
      return req.user?.organizationId || req.ip || 'anonymous';
    case 'ip':
    default:
      return req.ip || 'unknown';
  }
}

/**
 * Increment rate limit counter
 */
async function incrementCounter(cacheKey: string, windowMs: number): Promise<void> {
  try {
    const current = await cacheService.get<number>(cacheKey) || 0;
    const ttl = windowMs / 1000; // Convert to seconds
    
    await cacheService.set(cacheKey, current + 1, ttl, { tags: ['rate_limit'] });
  } catch (error) {
    logger.error('Failed to increment rate limit counter', { cacheKey, error });
    throw error;
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // Standard API rate limit
  api: rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    keyGenerator: 'user'
  }),

  // Strict rate limit for authentication endpoints
  auth: rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    keyGenerator: 'ip',
    skipSuccessfulRequests: true
  }),

  // LLM endpoint rate limiting (expensive operations)
  llm: rateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    keyGenerator: 'user',
    skipFailedRequests: true
  }),

  // Recommendations endpoint (very expensive)
  recommendations: rateLimitMiddleware({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    keyGenerator: 'user',
    skipFailedRequests: true
  })
};

export default rateLimitMiddleware;