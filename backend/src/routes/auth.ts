/**
 * Authentication Routes
 * Login, registration, and token management endpoints
 */

import { Router } from 'express';
import { optionalAuth } from '@/middleware/auth';
import { authController } from '@/controllers/authController';
import { asyncHandler } from '@/utils/errors';

const router = Router();

// Register new user
router.post('/register', asyncHandler(authController.register.bind(authController)));

// Login user
router.post('/login', asyncHandler(authController.login.bind(authController)));

// Refresh token
router.post('/refresh', asyncHandler(authController.refreshToken.bind(authController)));

// Logout
router.post('/logout', optionalAuth, asyncHandler(authController.logout.bind(authController)));

// Get current user profile
router.get('/me', optionalAuth, asyncHandler(authController.getCurrentUser.bind(authController)));

// Email verification endpoints
router.post('/email/send-verification', optionalAuth, asyncHandler(authController.sendEmailVerification.bind(authController)));
router.post('/email/verify', asyncHandler(authController.verifyEmail.bind(authController)));
router.post('/email/resend-verification', asyncHandler(authController.resendEmailVerification.bind(authController)));

// Password reset endpoints
router.post('/password-reset/request', asyncHandler(authController.requestPasswordReset.bind(authController)));
router.post('/password-reset/confirm', asyncHandler(authController.resetPassword.bind(authController)));
router.get('/password-reset/validate/:token', asyncHandler(authController.validatePasswordResetToken.bind(authController)));

// Enhanced authentication endpoints
router.post('/logout-all', optionalAuth, asyncHandler(authController.logoutFromAllDevices.bind(authController)));
router.post('/password-strength', asyncHandler(authController.checkPasswordStrength.bind(authController)));

// Legacy endpoints (keep for backward compatibility)
router.post('/verify-email', asyncHandler(authController.verifyEmail.bind(authController)));
router.post('/forgot-password', asyncHandler(authController.requestPasswordReset.bind(authController)));
router.post('/reset-password', asyncHandler(authController.resetPassword.bind(authController)));

export default router;