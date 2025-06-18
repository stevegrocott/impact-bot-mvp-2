/**
 * Global Error Handler Middleware
 * Centralized error handling with structured logging and appropriate responses
 */

import { Request, Response, NextFunction } from 'express';
import { logger, RequestLogger } from '@/utils/logger';
import { AppError, ValidationError } from '@/utils/errors';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  RequestLogger.logApiError(req, error);

  // Handle known error types
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      ...(error.statusCode === 400 && error instanceof ValidationError && error.field ? { field: error.field, value: error.value } : {})
    });
    return;
  }

  if (error instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: error.message,
      code: 'VALIDATION_ERROR',
      field: error.field
    });
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        res.status(409).json({
          success: false,
          error: 'A record with this value already exists',
          code: 'DUPLICATE_RECORD',
          field: prismaError.meta?.target?.[0]
        });
        return;

      case 'P2025': // Record not found
        res.status(404).json({
          success: false,
          error: 'Record not found',
          code: 'RECORD_NOT_FOUND'
        });
        return;

      case 'P2003': // Foreign key constraint violation
        res.status(400).json({
          success: false,
          error: 'Invalid reference to related record',
          code: 'INVALID_REFERENCE'
        });
        return;

      default:
        logger.error('Unhandled Prisma error', {
          code: prismaError.code,
          meta: prismaError.meta,
          error: prismaError.message
        });
        break;
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
      code: 'INVALID_TOKEN'
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Authentication token has expired',
      code: 'TOKEN_EXPIRED'
    });
    return;
  }

  // Handle multer errors (file upload)
  if (error.name === 'MulterError') {
    const multerError = error as any;
    
    switch (multerError.code) {
      case 'LIMIT_FILE_SIZE':
        res.status(413).json({
          success: false,
          error: 'File size too large',
          code: 'FILE_TOO_LARGE'
        });
        return;

      case 'LIMIT_UNEXPECTED_FILE':
        res.status(400).json({
          success: false,
          error: 'Unexpected file field',
          code: 'UNEXPECTED_FILE'
        });
        return;

      default:
        res.status(400).json({
          success: false,
          error: 'File upload error',
          code: 'UPLOAD_ERROR'
        });
        return;
    }
  }

  // Handle syntax errors (malformed JSON)
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    });
    return;
  }

  // Handle validation errors from Joi or similar
  if (error.name === 'ValidationError' && 'details' in error) {
    const validationError = error as any;
    const details = validationError.details?.map((detail: any) => ({
      field: detail.path?.join('.'),
      message: detail.message
    }));

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details
    });
    return;
  }

  // Handle rate limiting errors
  if (error.message && error.message.includes('Too many requests')) {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMITED'
    });
    return;
  }

  // Default to 500 server error
  logger.error('Unhandled server error', {
    error: error.message,
    stack: error.stack,
    name: error.name,
    url: req.url,
    method: req.method,
    userId: 'user' in req && req.user ? (req.user as any).id : undefined,
    organizationId: 'user' in req && req.user ? (req.user as any).organizationId : undefined
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' ? { 
      details: error.message,
      stack: error.stack 
    } : {})
  });
}

// 404 Not Found handler
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
}

// Async error wrapper utility
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): Promise<any> => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}