/**
 * Authentication and Authorization Middleware
 * JWT-based authentication with RBAC and organization context
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '@/config/environment';
import { prisma } from '@/config/database';
import { cacheService } from '@/services/cache';
import { logger, SecurityLogger } from '@/utils/logger';
import { AppError } from '@/utils/errors';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      organization?: UserOrganization;
      sessionId?: string;
      foundationStatus?: {
        hasTheoryOfChange: boolean;
        foundationReadiness: any;
        hasDecisionMapping: boolean;
        decisionCount: number;
        allowsBasicAccess: boolean;
        allowsIntermediateAccess: boolean;
        allowsAdvancedAccess: boolean;
        blockingReasons: string[];
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  organizationId?: string;
  roleId?: string;
  iat: number;
  exp: number;
}

interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  organizations: UserOrganization[];
  currentOrganization?: UserOrganization;
}

interface UserOrganization {
  id: string;
  name: string;
  role: {
    id: string;
    name: string;
    permissions: string[];
  };
  isPrimary: boolean;
}

export class AuthService {
  private static readonly CACHE_TTL_USER = 900; // 15 minutes
  private static readonly CACHE_TTL_PERMISSIONS = 3600; // 1 hour

  /**
   * Generate JWT token for user
   */
  static generateToken(
    userId: string, 
    email: string, 
    organizationId?: string,
    roleId?: string
  ): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId,
      email,
      ...(organizationId && { organizationId }),
      ...(roleId && { roleId })
    };

    const secret = config.JWT_SECRET;
    
    return jwt.sign(payload, secret, {
      expiresIn: config.JWT_EXPIRES_IN || '24h',
      issuer: 'impact-bot-v2',
      audience: 'impact-bot-users'
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.JWT_SECRET, {
        issuer: 'impact-bot-v2',
        audience: 'impact-bot-users'
      }) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
      }
      throw new AppError('Token verification failed', 401, 'TOKEN_VERIFICATION_FAILED');
    }
  }

  /**
   * Get user with organizations from cache or database
   */
  static async getUserWithOrganizations(userId: string): Promise<AuthenticatedUser | null> {
    const cacheKey = `user:${userId}:organizations`;
    
    // Try cache first
    const cached = await cacheService.get<AuthenticatedUser>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userOrganizations: {
          include: {
            organization: true,
            role: true
          },
          where: {
            organization: {
              isActive: true
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return null;
    }

    // Find primary organization or use first one
    const primaryOrg = user.userOrganizations.find(uo => uo.isPrimary) || user.userOrganizations[0];
    
    // Transform to AuthenticatedUser format
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      organizationId: primaryOrg?.organization.id || '',
      ...(user.firstName && { firstName: user.firstName }),
      ...(user.lastName && { lastName: user.lastName }),
      isActive: user.isActive,
      organizations: user.userOrganizations.map(uo => ({
        id: uo.organization.id,
        name: uo.organization.name,
        role: {
          id: uo.role.id,
          name: uo.role.name,
          permissions: uo.role.permissions as string[]
        },
        isPrimary: uo.isPrimary
      }))
    };

    // Cache for future requests
    await cacheService.set(cacheKey, authenticatedUser, this.CACHE_TTL_USER, {
      tags: ['user', `user:${userId}`]
    });

    return authenticatedUser;
  }

  /**
   * Check if user has permission for a specific action
   */
  static async hasPermission(
    userId: string,
    organizationId: string,
    permission: string
  ): Promise<boolean> {
    const cacheKey = `permissions:${userId}:${organizationId}`;
    
    // Try cache first
    let permissions = await cacheService.get<string[]>(cacheKey);
    
    if (!permissions) {
      // Fetch from database
      const userOrg = await prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId
          }
        },
        include: {
          role: true
        }
      });

      if (!userOrg) {
        return false;
      }

      permissions = userOrg.role.permissions as string[];
      
      // Cache permissions
      await cacheService.set(cacheKey, permissions, this.CACHE_TTL_PERMISSIONS, {
        tags: ['permissions', `user:${userId}`]
      });
    }

    // Check permission
    return permissions.includes('*') || // Admin wildcard
           permissions.includes(permission) ||
           permissions.some(p => p.endsWith('*') && permission.startsWith(p.slice(0, -1)));
  }

  /**
   * Invalidate user cache on changes
   */
  static async invalidateUserCache(userId: string): Promise<void> {
    await cacheService.invalidateByTags([`user:${userId}`]);
  }

  /**
   * Refresh user's last login timestamp
   */
  static async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });
  }
}

/**
 * Authentication middleware
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Skip auth for health check and public endpoints
    if (req.path === '/health' || req.path.startsWith('/api/public/')) {
      return next();
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authorization token required', 401, 'MISSING_TOKEN');
    }

    const token = authHeader.substring(7);

    // Verify token
    const payload = AuthService.verifyToken(token);

    // Get user with organizations
    const user = await AuthService.getUserWithOrganizations(payload.userId);
    if (!user) {
      throw new AppError('User not found or inactive', 401, 'USER_NOT_FOUND');
    }

    // Set current organization context
    if (payload.organizationId) {
      const currentOrg = user.organizations.find(org => org.id === payload.organizationId);
      if (currentOrg) {
        user.currentOrganization = currentOrg;
        req.organization = currentOrg;
      }
    } else if (user.organizations.length > 0) {
      // Use primary organization or first available
      const primaryOrg = user.organizations.find(org => org.isPrimary) || user.organizations[0];
      if (primaryOrg) {
        user.currentOrganization = primaryOrg;
        req.organization = primaryOrg;
      }
    }

    // Attach user to request
    req.user = user;

    // Log successful authentication
    SecurityLogger.logAuthAttempt(
      user.email,
      true,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown'
    );

    next();
  } catch (error) {
    if (error instanceof AppError) {
      // Log failed authentication
      SecurityLogger.logAuthAttempt(
        'unknown',
        false,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );
      
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    } else {
      logger.error('Authentication middleware error', { error });
      res.status(500).json({
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  }
}

/**
 * Organization context middleware
 */
export function requireOrganization(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.organization) {
    res.status(400).json({
      error: 'Organization context required',
      code: 'MISSING_ORGANIZATION'
    });
    return;
  }
  next();
}

/**
 * Permission check middleware factory
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentication and organization context required', 401, 'MISSING_CONTEXT');
      }

      const hasPermission = await AuthService.hasPermission(
        req.user.id,
        req.organization.id,
        permission
      );

      if (!hasPermission) {
        SecurityLogger.logPermissionDenied(
          req.user.id,
          req.path,
          permission,
          'Insufficient permissions'
        );
        
        throw new AppError('Insufficient permissions', 403, 'PERMISSION_DENIED');
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code
        });
      } else {
        logger.error('Permission check error', { error, permission });
        res.status(500).json({
          error: 'Permission check failed',
          code: 'PERMISSION_ERROR'
        });
      }
    }
  };
}

/**
 * Role-based access control middleware
 */
export function requireRole(roleName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.organization) {
      res.status(401).json({
        error: 'Authentication and organization context required',
        code: 'MISSING_CONTEXT'
      });
      return;
    }

    if (req.organization.role.name !== roleName && req.organization.role.name !== 'admin') {
      SecurityLogger.logPermissionDenied(
        req.user.id,
        req.path,
        `role:${roleName}`,
        `User has role: ${req.organization.role.name}`
      );

      res.status(403).json({
        error: `Role '${roleName}' required`,
        code: 'ROLE_REQUIRED'
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication middleware (for public endpoints with optional user context)
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user context
    }

    const token = authHeader.substring(7);
    const payload = AuthService.verifyToken(token);
    const user = await AuthService.getUserWithOrganizations(payload.userId);
    
    if (user) {
      req.user = user;
      
      // Set organization context if available
      if (payload.organizationId) {
        const currentOrg = user.organizations.find(org => org.id === payload.organizationId);
        if (currentOrg) {
          user.currentOrganization = currentOrg;
          req.organization = currentOrg;
        }
      }
    }

    next();
  } catch (error) {
    // For optional auth, continue without user context if token is invalid
    next();
  }
}

