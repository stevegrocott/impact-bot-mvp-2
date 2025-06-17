/**
 * Organization Routes
 * API endpoints for organization management
 */

import { Router } from 'express';
import { requireOrganization, requirePermission } from '@/middleware/auth';
import { organizationController } from '@/controllers/organizationController';
import { asyncHandler } from '@/utils/errors';

const router = Router();

// Create new organization
router.post(
  '/',
  requirePermission('org:create'),
  asyncHandler(organizationController.createOrganization)
);

// Get organization details
router.get(
  '/:organizationId',
  requirePermission('org:read'),
  asyncHandler(organizationController.getOrganization)
);

// Update organization
router.patch(
  '/:organizationId',
  requirePermission('org:update'),
  asyncHandler(organizationController.updateOrganization)
);

// Get organization members
router.get(
  '/:organizationId/members',
  requirePermission('org:read'),
  asyncHandler(organizationController.getMembers)
);

// Invite user to organization
router.post(
  '/:organizationId/members/invite',
  requirePermission('org:invite'),
  asyncHandler(organizationController.inviteMember)
);

// Update member role
router.patch(
  '/:organizationId/members/:userId/role',
  requirePermission('org:manage_members'),
  asyncHandler(organizationController.updateMemberRole)
);

// Remove member from organization
router.delete(
  '/:organizationId/members/:userId',
  requirePermission('org:manage_members'),
  asyncHandler(organizationController.removeMember)
);

// Get organization settings
router.get(
  '/:organizationId/settings',
  requirePermission('org:read'),
  asyncHandler(organizationController.getSettings)
);

// Update organization settings
router.patch(
  '/:organizationId/settings',
  requirePermission('org:update'),
  asyncHandler(organizationController.updateSettings)
);

export default router;