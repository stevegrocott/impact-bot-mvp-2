/**
 * Authentication Requirement Middleware
 * Ensures user is authenticated before accessing protected routes
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '@/config/environment';
import { prisma } from '@/config/database';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { AuthenticatedUser, UserOrganization } from '@/types';
import { JsonValue } from '@prisma/client/runtime/library';

/**
 * Convert JsonValue to string array safely
 */
function convertJsonArrayToStringArray(jsonValue: JsonValue): string[] {
  if (Array.isArray(jsonValue)) {
    return jsonValue.filter((item): item is string => typeof item === 'string');
  }
  return [];
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

    if (!primaryUserOrg) {
      throw new AppError('No organization found for user', 401);
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      organizationId: primaryUserOrg.organizationId,
      ...(user.firstName && { firstName: user.firstName }),
      ...(user.lastName && { lastName: user.lastName }),
      isActive: user.isActive,
      organizations: user.userOrganizations.map(uo => ({
        id: uo.organization.id,
        name: uo.organization.name,
        isPrimary: uo.isPrimary,
        role: {
          id: uo.role.id,
          name: uo.role.name,
          permissions: convertJsonArrayToStringArray(uo.role.permissions)
        }
      })),
      currentOrganization: {
        id: primaryUserOrg.organization.id,
        name: primaryUserOrg.organization.name,
        isPrimary: primaryUserOrg.isPrimary,
        role: {
          id: primaryUserOrg.role.id,
          name: primaryUserOrg.role.name,
          permissions: convertJsonArrayToStringArray(primaryUserOrg.role.permissions)
        }
      }
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