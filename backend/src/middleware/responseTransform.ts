/**
 * Response Transformation Middleware
 * Automatically transforms database responses to camelCase for API consistency
 */

import { Request, Response, NextFunction } from 'express';
import { transformToCamelCase } from '@/utils/caseTransform';
import { logger } from '@/utils/logger';

/**
 * Middleware to automatically transform response data from snake_case to camelCase
 * Should be applied after database operations but before sending responses
 */
export function transformResponse(req: Request, res: Response, next: NextFunction): void {
  // Store original json method
  const originalJson = res.json;

  // Override json method to transform data
  res.json = function(data: any) {
    try {
      // Only transform successful responses with data
      if (data && typeof data === 'object' && data.success !== false) {
        const transformed = transformToCamelCase(data);
        
        // Log transformation in development
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Response transformed to camelCase', {
            path: req.path,
            originalKeys: data.data ? Object.keys(data.data) : [],
            transformedKeys: transformed.data ? Object.keys(transformed.data) : []
          });
        }
        
        return originalJson.call(this, transformed);
      } else {
        // Don't transform error responses or non-object data
        return originalJson.call(this, data);
      }
    } catch (error) {
      logger.error('Response transformation failed', {
        error,
        path: req.path,
        data: typeof data
      });
      
      // Fallback to original data if transformation fails
      return originalJson.call(this, data);
    }
  };

  next();
}

/**
 * Selective response transformation for specific routes
 * Use this when you only want to transform certain endpoints
 */
export function transformResponseForRoutes(routes: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const shouldTransform = routes.some(route => 
      req.path.includes(route) || req.path.match(new RegExp(route))
    );

    if (shouldTransform) {
      transformResponse(req, res, next);
    } else {
      next();
    }
  };
}