/**
 * Authentication Controller
 * Handles user registration, login, and authentication flows
 */

import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
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
  confirmPassword?: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  organizationType?: string;
  industry?: string;
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
    console.log('🚨🚨🚨 REGISTRATION REQUEST STARTED 🚨🚨🚨');
    console.log('🔍 Registration request received:', {
      body: req.body,
      hasConfirmPassword: 'confirmPassword' in req.body,
      confirmPasswordValue: req.body.confirmPassword
    });

    const {
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      organizationName,
      organizationType,
      industry,
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

    // Skip password confirmation check for API registration
    // Frontend handles password confirmation validation
    console.log('🔍 Password validation - confirmPassword:', confirmPassword, 'type:', typeof confirmPassword);
    
    // Only validate password confirmation if it's explicitly provided and not empty
    if (confirmPassword && confirmPassword.trim() !== '' && password !== confirmPassword) {
      console.log('❌ Password mismatch detected!');
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
              industry: industry || null,
              sizeCategory: organizationType || null,
              isActive: true,
              settings: {}
            }
          });
        } else {
          // Create personal workspace for the user
          organization = await tx.organization.create({
            data: {
              id: uuidv4(),
              name: `${firstName} ${lastName}'s Workspace`,
              description: `Personal workspace for ${firstName} ${lastName}`,
              isActive: true,
              settings: {}
            }
          });
        }

        // Determine role based on organization creation
        let assignedRole;
        if (organizationName && organizationName.trim()) {
          // User is creating a new organization → they become org_admin
          assignedRole = await tx.role.findUnique({
            where: { name: 'org_admin' }
          });
          
          if (!assignedRole) {
            // Fallback: create org_admin role if it doesn't exist
            assignedRole = await tx.role.create({
              data: {
                id: uuidv4(),
                name: 'org_admin',
                description: 'Organization administrator with full organization management',
                permissions: [
                  'org:*', 'user:*', 'foundation:*', 'measurement:*', 
                  'report:*', 'indicator:*', 'conversation:*', 'theory:*',
                  'member:*', 'settings:*'
                ]
              }
            });
          }
        } else {
          // User is using personal workspace → they become org_admin of their own space
          assignedRole = await tx.role.findUnique({
            where: { name: 'org_admin' }
          });
          
          if (!assignedRole) {
            // Fallback: create org_admin role if it doesn't exist
            assignedRole = await tx.role.create({
              data: {
                id: uuidv4(),
                name: 'org_admin',
                description: 'Organization administrator with full organization management',
                permissions: [
                  'org:*', 'user:*', 'foundation:*', 'measurement:*', 
                  'report:*', 'indicator:*', 'conversation:*', 'theory:*',
                  'member:*', 'settings:*'
                ]
              }
            });
          }
        }

        // Create user-organization relationship
        await tx.userOrganization.create({
          data: {
            id: uuidv4(),
            userId: user.id,
            organizationId: organization.id,
            roleId: assignedRole.id,
            isPrimary: true
          }
        });

        return { user, organization, role: assignedRole };
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
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
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
            name: result.organization.name,
            role: {
              id: result.role.id,
              name: result.role.name,
              permissions: result.role.permissions
            }
          },
          organizations: [{
            id: result.organization.id,
            name: result.organization.name,
            isPrimary: true,
            role: {
              id: result.role.id,
              name: result.role.name
            }
          }],
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
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown',
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
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown',
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

    if (!selectedOrganization) {
      throw new AppError('No organization access found for user', 403, 'NO_ORGANIZATION_ACCESS');
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
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown'
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

    try {
      // Find user with verification token (now supported by schema)
      const user = await prisma.user.findFirst({
        where: {
          emailVerificationToken: token,
          emailVerificationExpires: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        throw new ValidationError('Invalid or expired verification token');
      }

      // Update user as verified
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
          emailVerifiedAt: new Date()
        }
      });

      SecurityLogger.logSecurityEvent('email_verified', 'User email verified successfully', user.id);

      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      logger.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Request password reset (placeholder)
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      throw new ValidationError('Valid email is required');
    }

    try {
      // Check rate limiting
      const rateLimitKey = `password_reset:${email}`;
      const recentRequests = await cacheService.get(rateLimitKey);
      if (recentRequests && parseInt(recentRequests) >= 3) {
        throw new ValidationError('Too many password reset requests. Please wait before trying again.');
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      // Always return success to prevent email enumeration
      if (!user) {
        res.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
        return;
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      // Save reset token to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires
        }
      });

      // Increment rate limit counter
      const currentCount = parseInt(recentRequests || '0') + 1;
      await cacheService.set(rateLimitKey, currentCount.toString(), 3600); // 1 hour TTL

      SecurityLogger.logSecurityEvent('password_reset_requested', 'Password reset requested', user.id);

      // In production, send email here with resetToken
      logger.info('Password reset token generated', {
        userId: user.id,
        email: user.email,
        resetToken // Remove this in production
      });

      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
        // Include token in development mode only
        ...(process.env.NODE_ENV === 'development' && { resetToken })
      });
    } catch (error) {
      logger.error('Password reset request failed:', error);
      throw error;
    }
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

    try {
      // Find user with valid reset token
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpires: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        throw new ValidationError('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          passwordChangedAt: new Date()
        }
      });

      // Invalidate all existing sessions for security
      // await cacheService.delete(`session:${user.id}`); // Simplified cache invalidation

      SecurityLogger.logSecurityEvent('password_reset_completed', 'Password reset completed successfully', user.id);

      res.json({
        success: true,
        message: 'Password reset successfully. Please log in with your new password.'
      });
    } catch (error) {
      logger.error('Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Alias method for requestPasswordReset to match new API structure
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    return await this.forgotPassword(req, res);
  }

  /**
   * Validate password reset token
   */
  async validatePasswordResetToken(req: Request, res: Response): Promise<void> {
    const { token } = req.params;

    if (!token) {
      throw new ValidationError('Reset token is required');
    }

    try {
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpires: {
            gt: new Date()
          }
        },
        select: {
          email: true,
          passwordResetExpires: true
        }
      });

      if (!user) {
        res.json({
          success: true,
          data: {
            valid: false
          }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          valid: true,
          email: user.email,
          expiresAt: user.passwordResetExpires
        }
      });
    } catch (error) {
      logger.error('Password reset token validation failed:', error);
      throw error;
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new ValidationError('Authentication required');
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user) {
        throw new ValidationError('User not found');
      }

      if (user.isEmailVerified) {
        res.json({
          success: true,
          message: 'Email is already verified'
        });
        return;
      }

      // Generate verification token
      const verificationToken = uuidv4();
      const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: verificationToken,
          emailVerificationExpires: expirationTime
        }
      });

      // TODO: Send email with verification link
      // await emailService.sendVerificationEmail(user.email, verificationToken);

      SecurityLogger.logSecurityEvent('email_verification_sent', 'Email verification token sent', user.id);

      res.json({
        success: true,
        message: 'Verification email sent. Please check your inbox.'
      });
    } catch (error) {
      logger.error('Send email verification failed:', error);
      throw error;
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      throw new ValidationError('Valid email is required');
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Don't reveal if email exists for security
        res.json({
          success: true,
          message: 'If an account with this email exists, a verification email will be sent.'
        });
        return;
      }

      if (user.isEmailVerified) {
        res.json({
          success: true,
          message: 'Email is already verified'
        });
        return;
      }

      // Generate new verification token
      const verificationToken = uuidv4();
      const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: verificationToken,
          emailVerificationExpires: expirationTime
        }
      });

      // TODO: Send email with verification link
      // await emailService.sendVerificationEmail(user.email, verificationToken);

      SecurityLogger.logSecurityEvent('email_verification_resent', 'Email verification token resent', user.id);

      res.json({
        success: true,
        message: 'If an account with this email exists, a verification email will be sent.'
      });
    } catch (error) {
      logger.error('Resend email verification failed:', error);
      throw error;
    }
  }

  /**
   * Logout from all devices
   */
  async logoutFromAllDevices(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new ValidationError('Authentication required');
    }

    try {
      // Clear user-specific cache
      await cacheService.invalidateByTags([`user:${req.user.id}`]);

      SecurityLogger.logSecurityEvent('logout_all_devices', 'User logged out from all devices', req.user.id);

      res.json({
        success: true,
        message: 'Logged out from all devices successfully'
      });
    } catch (error) {
      logger.error('Logout from all devices failed:', error);
      throw error;
    }
  }

  /**
   * Check password strength
   */
  async checkPasswordStrength(req: Request, res: Response): Promise<void> {
    const { password } = req.body;

    if (!password) {
      throw new ValidationError('Password is required');
    }

    try {
      const feedback: string[] = [];
      let score = 0;

      // Check length
      if (password.length >= 8) score += 1;
      else feedback.push('Password should be at least 8 characters long');

      // Check for uppercase
      if (/[A-Z]/.test(password)) score += 1;
      else feedback.push('Include at least one uppercase letter');

      // Check for lowercase
      if (/[a-z]/.test(password)) score += 1;
      else feedback.push('Include at least one lowercase letter');

      // Check for numbers
      if (/\d/.test(password)) score += 1;
      else feedback.push('Include at least one number');

      // Check for special characters
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
      else feedback.push('Include at least one special character');

      // Check for common patterns
      if (password.toLowerCase().includes('password')) {
        score -= 1;
        feedback.push('Avoid using the word "password"');
      }

      if (/123|abc|qwerty/i.test(password)) {
        score -= 1;
        feedback.push('Avoid common patterns like "123" or "abc"');
      }

      const isValid = score >= 4 && feedback.length === 0;

      res.json({
        success: true,
        data: {
          score: Math.max(0, Math.min(5, score)),
          feedback,
          isValid
        }
      });
    } catch (error) {
      logger.error('Password strength check failed:', error);
      throw error;
    }
  }
}

// Create controller instance
export const authController = new AuthController();