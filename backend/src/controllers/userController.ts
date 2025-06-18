/**
 * User Controller
 * Handles user profile management and user-related operations
 */

import { Request, Response } from 'express';
import { AppError, ValidationError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { validatePassword } from '@/utils/validation';
import { prisma } from '@/config/database';
import bcrypt from 'bcryptjs';

export class UserController {
  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    try {
      // Get full user profile with organizations and preferences
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          userOrganizations: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  isActive: true
                }
              },
              role: {
                select: {
                  id: true,
                  name: true,
                  permissions: true
                }
              }
            }
          },
          // userPreferences will be accessed via preferences field
        }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const profile = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        jobTitle: user.jobTitle,
        // Email verification status managed externally
        isEmailVerified: true, // Simplified for current schema
        emailVerifiedAt: user.createdAt,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        organizations: user.userOrganizations.map((uo: any) => ({
          id: uo.organization.id,
          name: uo.organization.name,
          description: uo.organization.description,
          role: uo.role?.name,
          permissions: uo.role?.permissions || [],
          isPrimary: uo.isPrimary,
          isActive: uo.organization.isActive
        })),
        preferences: user.preferences || {}
      };

      logger.info('Retrieved user profile', { userId: req.user.id });

      res.json({
        success: true,
        data: { user: profile }
      });
    } catch (error) {
      logger.error('Error retrieving user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { firstName, lastName, jobTitle } = req.body;
    const userId = req.user.id;

    try {
      // Validate input
      if (firstName && (typeof firstName !== 'string' || firstName.trim().length < 1)) {
        throw new ValidationError('First name must be a non-empty string');
      }
      if (lastName && (typeof lastName !== 'string' || lastName.trim().length < 1)) {
        throw new ValidationError('Last name must be a non-empty string');
      }
      if (jobTitle && typeof jobTitle !== 'string') {
        throw new ValidationError('Job title must be a string');
      }

      // Prepare update data
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName.trim();
      if (lastName !== undefined) updateData.lastName = lastName.trim();
      if (jobTitle !== undefined) updateData.jobTitle = jobTitle.trim() || null;

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          jobTitle: true,
          updatedAt: true
        }
      });

      logger.info('Updated user profile', { 
        userId, 
        updates: Object.keys(updateData),
        success: true 
      });

      res.json({
        success: true,
        data: {
          user: updatedUser,
          message: 'Profile updated successfully'
        }
      });
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new ValidationError('Current password, new password, and confirmation are required');
    }

    if (newPassword !== confirmPassword) {
      throw new ValidationError('New password and confirmation do not match');
    }

    if (!validatePassword(newPassword)) {
      throw new ValidationError('Password must be at least 8 characters with uppercase, lowercase, number and special character');
    }

    try {
      // Get current user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          passwordHash: true
        }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      if (!user.passwordHash) {
        throw new ValidationError('User has no password set - cannot change password');
      }
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new ValidationError('Current password is incorrect');
      }

      // Check if new password is different from current
      const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
      if (isSamePassword) {
        throw new ValidationError('New password must be different from current password');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: hashedNewPassword,
          updatedAt: new Date()
        }
      });

      logger.info('User password changed successfully', { userId });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Error changing user password:', error);
      throw error;
    }
  }

  /**
   * Get user organizations
   */
  async getUserOrganizations(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const userId = req.user.id;

    // TODO: Implement user organizations retrieval logic
    logger.info('Getting user organizations', { userId });

    res.json({
      success: true,
      data: {
        organizations: req.user.organizations || [],
        message: 'User organizations functionality not yet implemented'
      }
    });
  }

  /**
   * Set primary organization
   */
  async setPrimaryOrganization(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { organizationId } = req.params;
    const userId = req.user.id;

    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    // TODO: Implement primary organization setting logic
    logger.info('Setting primary organization', { userId, organizationId });

    res.json({
      success: true,
      data: {
        organizationId,
        message: 'Set primary organization not yet implemented'
      }
    });
  }

  /**
   * Get user preferences
   */
  async getPreferences(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const userId = req.user.id;

    // TODO: Implement preferences retrieval logic
    logger.info('Getting user preferences', { userId });

    res.json({
      success: true,
      data: {
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en',
          timezone: 'UTC'
        },
        message: 'User preferences functionality not yet implemented'
      }
    });
  }

  /**
   * Update user preferences
   */
  async updatePreferences(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const preferences = req.body;
    const userId = req.user.id;

    // TODO: Implement preferences update logic
    logger.info('Updating user preferences', { userId, preferences });

    res.json({
      success: true,
      data: {
        preferences,
        message: 'User preferences update not yet implemented'
      }
    });
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { password, reason } = req.body;
    const userId = req.user.id;

    if (!password) {
      throw new ValidationError('Password confirmation is required to deactivate account');
    }

    // TODO: Implement account deactivation logic
    logger.info('Deactivating user account', { userId, reason });

    res.json({
      success: true,
      message: 'Account deactivation not yet implemented'
    });
  }
}

// Create controller instance
export const userController = new UserController();