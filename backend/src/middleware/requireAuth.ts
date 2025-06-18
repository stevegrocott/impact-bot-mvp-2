/**
 * Authentication Requirement Middleware
 * Ensures user is authenticated before accessing protected routes
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config/environment';
import { prisma } from '@/config/database';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

export interface AuthenticatedUser {
  userId: string;
  organizationId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authorization token required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Get user details from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { 
        userOrganizations: {
          include: {
            organization: true,
            role: true
          }
        }
      }
    });

    if (!user || !user.userOrganizations || user.userOrganizations.length === 0) {
      throw new AppError('User or organization not found', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('User account is deactivated', 401);
    }

    // Get primary organization or first organization
    const primaryUserOrg = user.userOrganizations.find(uo => uo.isPrimary) || user.userOrganizations[0];

    // Attach user info to request
    req.user = {
      userId: user.id,
      organizationId: primaryUserOrg.organizationId,
      email: user.email,
      role: primaryUserOrg.role.name
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error('Authentication error', { error, path: req.path });
      next(new AppError('Authentication failed', 401));
    }
  }
}