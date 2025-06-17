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
router.post('/register', asyncHandler(authController.register));

// Login user
router.post('/login', asyncHandler(authController.login));

// Refresh token
router.post('/refresh', asyncHandler(authController.refreshToken));

// Logout
router.post('/logout', optionalAuth, asyncHandler(authController.logout));

// Get current user profile
router.get('/me', optionalAuth, asyncHandler(authController.getCurrentUser));

// Verify email
router.post('/verify-email', asyncHandler(authController.verifyEmail));

// Request password reset
router.post('/forgot-password', asyncHandler(authController.forgotPassword));

// Reset password
router.post('/reset-password', asyncHandler(authController.resetPassword));

export default router;