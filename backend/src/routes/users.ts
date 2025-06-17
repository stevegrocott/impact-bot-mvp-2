/**
 * User Routes
 * API endpoints for user management
 */

import { Router } from 'express';
import { requirePermission } from '@/middleware/auth';
import { userController } from '@/controllers/userController';
import { asyncHandler } from '@/utils/errors';

const router = Router();

// Get current user profile
router.get(
  '/profile',
  asyncHandler(userController.getProfile)
);

// Update user profile
router.patch(
  '/profile',
  asyncHandler(userController.updateProfile)
);

// Change password
router.post(
  '/change-password',
  asyncHandler(userController.changePassword)
);

// Get user organizations
router.get(
  '/organizations',
  asyncHandler(userController.getUserOrganizations)
);

// Switch primary organization
router.post(
  '/organizations/:organizationId/set-primary',
  asyncHandler(userController.setPrimaryOrganization)
);

// Get user preferences
router.get(
  '/preferences',
  asyncHandler(userController.getPreferences)
);

// Update user preferences
router.patch(
  '/preferences',
  asyncHandler(userController.updatePreferences)
);

// Deactivate account
router.post(
  '/deactivate',
  asyncHandler(userController.deactivateAccount)
);

export default router;