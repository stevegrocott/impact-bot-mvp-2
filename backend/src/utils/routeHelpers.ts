/**
 * Route Helper Utilities
 * Type-safe helpers for Express routes to prevent TypeScript errors
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';
import { isAuthenticatedRequest, AuthenticatedUser } from '@/types';

/**
 * Ensure request is authenticated and return user info
 */
export function ensureAuthenticated(req: Request): AuthenticatedUser {
  if (!isAuthenticatedRequest(req)) {
    throw new AppError('Authentication required', 401, 'NOT_AUTHENTICATED');
  }
  return req.user;
}

/**
 * Get user context from authenticated request
 */
export function getUserContext(req: Request): { organizationId: string; userId: string } {
  const user = ensureAuthenticated(req);
  return {
    organizationId: user.organizationId,
    userId: user.id
  };
}

/**
 * Type-safe async route handler wrapper
 */
export function asyncRoute<T extends Request = Request>(
  handler: (req: T, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

/**
 * Type guard for checking if error is AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Safe error response handler
 */
export function sendErrorResponse(res: Response, error: unknown) {
  if (isAppError(error)) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code
    });
  } else {
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}