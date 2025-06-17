/**
 * Error Handling Utilities
 * Custom error classes and error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger, RequestLogger } from './logger';
import { config } from '@/config/environment';

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
    this.value = value;
  }
}

/**
 * Database error class
 */
export class DatabaseError extends AppError {
  public readonly operation?: string;
  public readonly table?: string;

  constructor(message: string, operation?: string, table?: string) {
    super(message, 500, 'DATABASE_ERROR');
    this.operation = operation;
    this.table = table;
  }
}

/**
 * External service error class
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;
  public readonly originalError?: Error;

  constructor(message: string, service: string, originalError?: Error) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
    this.originalError = originalError;
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

/**
 * LLM service error class
 */
export class LLMError extends AppError {
  public readonly provider: string;
  public readonly tokensUsed?: number;

  constructor(message: string, provider: string, tokensUsed?: number) {
    super(message, 503, 'LLM_SERVICE_ERROR');
    this.provider = provider;
    this.tokensUsed = tokensUsed;
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  error: string;
  code: string;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
  details?: any;
  stack?: string;
}

/**
 * Convert Prisma errors to AppError
 */
export function handlePrismaError(error: any): AppError {
  const { code, message, meta } = error;

  switch (code) {
    case 'P2002':
      return new ValidationError(
        `Unique constraint violation: ${meta?.target || 'field'} already exists`,
        meta?.target?.[0],
        meta?.target
      );
    
    case 'P2025':
      return new AppError('Record not found', 404, 'RECORD_NOT_FOUND');
    
    case 'P2003':
      return new ValidationError(
        'Foreign key constraint violation',
        meta?.field_name,
        meta?.target
      );
    
    case 'P2014':
      return new ValidationError(
        'Invalid relation',
        meta?.relation_name
      );
    
    case 'P1008':
      return new DatabaseError('Database connection timeout', 'connect');
    
    case 'P1002':
      return new DatabaseError('Database connection refused', 'connect');
    
    default:
      return new DatabaseError(
        message || 'Database operation failed',
        meta?.operation,
        meta?.table
      );
  }
}

/**
 * Convert Joi validation errors to ValidationError
 */
export function handleJoiError(error: any): ValidationError {
  const details = error.details?.[0];
  return new ValidationError(
    details?.message || 'Validation failed',
    details?.path?.join('.'),
    details?.context?.value
  );
}

/**
 * Main error handler middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let appError: AppError;

  // Convert known error types to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error.name === 'PrismaClientKnownRequestError') {
    appError = handlePrismaError(error);
  } else if (error.name === 'ValidationError' && (error as any).isJoi) {
    appError = handleJoiError(error);
  } else if (error.name === 'JsonWebTokenError') {
    appError = new AppError('Invalid authentication token', 401, 'INVALID_TOKEN');
  } else if (error.name === 'TokenExpiredError') {
    appError = new AppError('Authentication token expired', 401, 'TOKEN_EXPIRED');
  } else if (error.name === 'MulterError') {
    const multerError = error as any;
    if (multerError.code === 'LIMIT_FILE_SIZE') {
      appError = new ValidationError('File size too large');
    } else {
      appError = new ValidationError('File upload error');
    }
  } else {
    // Unknown error - treat as internal server error
    appError = new AppError(
      config.IS_PRODUCTION ? 'Internal server error' : error.message,
      500,
      'INTERNAL_ERROR',
      false
    );
  }

  // Log error
  if (appError.statusCode >= 500) {
    RequestLogger.logApiError(req, appError);
  } else {
    logger.warn('Client error', {
      error: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      organizationId: req.organization?.id
    });
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: appError.message,
    code: appError.code,
    timestamp: appError.timestamp,
    path: req.path,
    method: req.method,
    requestId: req.headers['x-request-id'] as string
  };

  // Add additional details for specific error types
  if (appError instanceof ValidationError) {
    errorResponse.details = {
      field: appError.field,
      value: appError.value
    };
  } else if (appError instanceof DatabaseError) {
    errorResponse.details = {
      operation: appError.operation,
      table: appError.table
    };
  } else if (appError instanceof ExternalServiceError) {
    errorResponse.details = {
      service: appError.service
    };
  } else if (appError instanceof RateLimitError && appError.retryAfter) {
    res.set('Retry-After', appError.retryAfter.toString());
    errorResponse.details = {
      retryAfter: appError.retryAfter
    };
  } else if (appError instanceof LLMError) {
    errorResponse.details = {
      provider: appError.provider,
      tokensUsed: appError.tokensUsed
    };
  }

  // Include stack trace in development
  if (config.IS_DEVELOPMENT && !appError.isOperational) {
    errorResponse.stack = appError.stack;
  }

  // Send error response
  res.status(appError.statusCode).json(errorResponse);
}

/**
 * 404 handler middleware
 */
export function notFoundHandler(req: Request, res: Response): void {
  const error = new AppError(
    `Endpoint ${req.method} ${req.path} not found`,
    404,
    'ENDPOINT_NOT_FOUND'
  );

  res.status(404).json({
    error: error.message,
    code: error.code,
    timestamp: error.timestamp,
    path: req.path,
    method: req.method
  });
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error assertion utilities
 */
export class Assert {
  static exists<T>(value: T | null | undefined, message: string = 'Resource not found'): asserts value is T {
    if (value === null || value === undefined) {
      throw new AppError(message, 404, 'RESOURCE_NOT_FOUND');
    }
  }

  static isTrue(condition: boolean, message: string = 'Assertion failed', statusCode: number = 400): void {
    if (!condition) {
      throw new AppError(message, statusCode, 'ASSERTION_FAILED');
    }
  }

  static hasPermission(hasPermission: boolean, action: string = 'perform this action'): void {
    if (!hasPermission) {
      throw new AppError(`Insufficient permissions to ${action}`, 403, 'PERMISSION_DENIED');
    }
  }

  static validInput(isValid: boolean, message: string = 'Invalid input'): void {
    if (!isValid) {
      throw new ValidationError(message);
    }
  }
}

// Export all error classes and utilities
export {
  AppError as default,
  ValidationError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  LLMError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  Assert,
  handlePrismaError,
  handleJoiError
};