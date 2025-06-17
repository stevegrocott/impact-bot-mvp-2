/**
 * Request Logging Middleware
 * Express middleware for structured request/response logging
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestLogger } from '@/utils/logger';

// Extend Request interface to include timing
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      requestId?: string;
    }
  }
}

/**
 * Request logger middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);

  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any): Response {
    const duration = Date.now() - (req.startTime || 0);
    
    // Log the request
    RequestLogger.logRequest(req, res, duration);
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
}