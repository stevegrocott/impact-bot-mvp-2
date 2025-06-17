/**
 * Authentication Controller
 * Handles user registration, login, and authentication flows
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '@/middleware/auth';
import { prisma } from '@/config/database';
import { cacheService } from '@/services/cache';
import { logger, SecurityLogger } from '@/utils/logger';
import { AppError, ValidationError } from '@/utils/errors';
import { validateEmail, validatePassword, validateName } from '@/utils/validation';

interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  jobTitle?: string;
}

interface LoginRequest {
  email: string;
  password: string;
  organizationId?: string;
}

export class AuthController {
  /**
   * Register new user
   */
  async register(req: Request, res: Response): Promise<void> {
    const {
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      organizationName,
      jobTitle
    }: RegisterRequest = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      throw new ValidationError('Missing required fields: email, password, firstName, lastName');
    }

    if (!validateEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    if (!validatePassword(password)) {
      throw new ValidationError('Password must be at least 8 characters with uppercase, lowercase, number and special character');
    }

    if (password !== confirmPassword) {
      throw new ValidationError('Passwords do not match');
    }

    if (!validateName(firstName) || !validateName(lastName)) {
      throw new ValidationError('Names must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    try {
      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            id: uuidv4(),
            email: email.toLowerCase(),
            passwordHash,
            firstName,
            lastName,
            jobTitle: jobTitle || null,
            isActive: true,
            preferences: {}
          }
        });

        // Create or find organization
        let organization;
        if (organizationName && organizationName.trim()) {
          organization = await tx.organization.create({
            data: {
              id: uuidv4(),
              name: organizationName.trim(),
              isActive: true,
              settings: {}
            }
          });
        } else {
          // Find or create default organization
          organization = await tx.organization.upsert({
            where: { name: 'Personal Workspace' },
            create: {
              id: uuidv4(),
              name: 'Personal Workspace',
              description: 'Default personal workspace for individual users',
              isActive: true,
              settings: {}
            },
            update: {}
          });
        }

        // Get or create user role
        const userRole = await tx.role.upsert({
          where: { name: 'user' },
          create: {
            id: uuidv4(),
            name: 'user',
            description: 'Standard user access',
            permissions: ['measurement:read', 'measurement:create', 'report:read', 'conversation:*']
          },
          update: {}
        });

        // Create user-organization relationship
        await tx.userOrganization.create({
          data: {
            id: uuidv4(),
            userId: user.id,
            organizationId: organization.id,
            roleId: userRole.id,
            isPrimary: true
          }
        });

        return { user, organization, role: userRole };
      });

      // Generate JWT token
      const token = AuthService.generateToken(
        result.user.id,
        result.user.email,
        result.organization.id,
        result.role.id
      );

      // Update last login
      await AuthService.updateLastLogin(result.user.id);

      // Log successful registration
      SecurityLogger.logUserRegistration(
        result.user.id,
        result.user.email,
        req.ip,
        req.headers['user-agent']
      );

      logger.info('User registered successfully', {
        userId: result.user.id,
        email: result.user.email,
        organizationId: result.organization.id
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            jobTitle: result.user.jobTitle
          },
          organization: {
            id: result.organization.id,
            name: result.organization.name
          },
          token,
          expiresIn: '24h'
        }
      });

    } catch (error) {
      logger.error('Registration failed', { error, email });
      throw new AppError('Registration failed', 500, 'REGISTRATION_FAILED');
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response): Promise<void> {
    const { email, password, organizationId }: LoginRequest = req.body;

    // Validation
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    if (!validateEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Find user with organizations
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
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
      SecurityLogger.logAuthAttempt(
        email,
        false,
        req.ip,
        req.headers['user-agent'],
        'User not found or inactive'
      );
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash || '');
    if (!isValidPassword) {
      SecurityLogger.logAuthAttempt(
        email,
        false,
        req.ip,
        req.headers['user-agent'],
        'Invalid password'
      );
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Check if user has any organizations
    if (user.userOrganizations.length === 0) {
      throw new AppError('User has no active organizations', 403, 'NO_ORGANIZATIONS');
    }

    // Select organization
    let selectedOrganization = user.userOrganizations[0];
    if (organizationId) {
      const requestedOrg = user.userOrganizations.find(
        uo => uo.organization.id === organizationId
      );
      if (requestedOrg) {
        selectedOrganization = requestedOrg;
      }
    } else {
      // Use primary organization if available
      const primaryOrg = user.userOrganizations.find(uo => uo.isPrimary);
      if (primaryOrg) {
        selectedOrganization = primaryOrg;
      }
    }

    // Generate JWT token
    const token = AuthService.generateToken(
      user.id,
      user.email,
      selectedOrganization.organization.id,
      selectedOrganization.role.id
    );

    // Update last login
    await AuthService.updateLastLogin(user.id);

    // Log successful login
    SecurityLogger.logAuthAttempt(
      email,
      true,
      req.ip,
      req.headers['user-agent']
    );

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      organizationId: selectedOrganization.organization.id
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          jobTitle: user.jobTitle
        },
        organization: {
          id: selectedOrganization.organization.id,
          name: selectedOrganization.organization.name,
          role: {
            id: selectedOrganization.role.id,
            name: selectedOrganization.role.name,
            permissions: selectedOrganization.role.permissions
          }
        },
        organizations: user.userOrganizations.map(uo => ({
          id: uo.organization.id,
          name: uo.organization.name,
          isPrimary: uo.isPrimary,
          role: {
            id: uo.role.id,
            name: uo.role.name
          }
        })),
        token,
        expiresIn: '24h'
      }
    });
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    const { token } = req.body;

    if (!token) {
      throw new ValidationError('Refresh token is required');
    }

    try {
      // Verify current token (even if expired)
      const payload = AuthService.verifyToken(token);
      
      // Get fresh user data
      const user = await AuthService.getUserWithOrganizations(payload.userId);
      if (!user) {
        throw new AppError('User not found', 401, 'USER_NOT_FOUND');
      }

      // Generate new token
      const newToken = AuthService.generateToken(
        payload.userId,
        payload.email,
        payload.organizationId,
        payload.roleId
      );

      res.json({
        success: true,
        data: {
          token: newToken,
          expiresIn: '24h'
        }
      });

    } catch (error) {
      if (error instanceof AppError && error.code === 'TOKEN_EXPIRED') {
        // For refresh, we allow expired tokens but verify other aspects
        try {
          const decoded = AuthService.verifyToken(token);
          const newToken = AuthService.generateToken(
            decoded.userId,
            decoded.email,
            decoded.organizationId,
            decoded.roleId
          );

          res.json({
            success: true,
            data: {
              token: newToken,
              expiresIn: '24h'
            }
          });
          return;
        } catch (refreshError) {
          throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
        }
      }
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response): Promise<void> {
    if (req.user) {
      // Invalidate user cache
      await AuthService.invalidateUserCache(req.user.id);
      
      logger.info('User logged out', {
        userId: req.user.id,
        email: req.user.email
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName
        },
        organization: req.organization ? {
          id: req.organization.id,
          name: req.organization.name,
          role: req.organization.role
        } : null,
        organizations: req.user.organizations.map(org => ({
          id: org.id,
          name: org.name,
          isPrimary: org.isPrimary,
          role: {
            id: org.role.id,
            name: org.role.name
          }
        }))
      }
    });
  }

  /**
   * Verify email (placeholder for email verification flow)
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    const { token } = req.body;

    if (!token) {
      throw new ValidationError('Verification token is required');
    }

    // TODO: Implement email verification logic
    res.json({
      success: true,
      message: 'Email verification not yet implemented'
    });
  }

  /**
   * Request password reset (placeholder)
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      throw new ValidationError('Valid email is required');
    }

    // TODO: Implement password reset email logic
    res.json({
      success: true,
      message: 'Password reset not yet implemented'
    });
  }

  /**
   * Reset password (placeholder)
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new ValidationError('Reset token and new password are required');
    }

    if (!validatePassword(newPassword)) {
      throw new ValidationError('Password must be at least 8 characters with uppercase, lowercase, number and special character');
    }

    // TODO: Implement password reset logic
    res.json({
      success: true,
      message: 'Password reset not yet implemented'
    });
  }
}

// Create controller instance
export const authController = new AuthController();