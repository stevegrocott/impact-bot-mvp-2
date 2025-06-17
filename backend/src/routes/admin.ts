/**
 * Admin Routes
 * API endpoints for system administration
 */

import { Router } from 'express';
import { requireRole, requirePermission } from '@/middleware/auth';
import { adminController } from '@/controllers/adminController';
import { asyncHandler } from '@/utils/errors';

const router = Router();

// All admin routes require admin role
router.use(requireRole('admin'));

// System health and metrics
router.get(
  '/health',
  asyncHandler(adminController.getSystemHealth)
);

router.get(
  '/metrics',
  asyncHandler(adminController.getMetrics)
);

// User management
router.get(
  '/users',
  asyncHandler(adminController.getUsers)
);

router.patch(
  '/users/:userId/status',
  asyncHandler(adminController.updateUserStatus)
);

// Organization management
router.get(
  '/organizations',
  asyncHandler(adminController.getOrganizations)
);

router.patch(
  '/organizations/:organizationId/status',
  asyncHandler(adminController.updateOrganizationStatus)
);

// Data synchronization
router.post(
  '/sync/airtable',
  asyncHandler(adminController.syncAirtableData)
);

router.get(
  '/sync/status',
  asyncHandler(adminController.getSyncStatus)
);

// Cache management
router.post(
  '/cache/clear',
  asyncHandler(adminController.clearCache)
);

router.get(
  '/cache/stats',
  asyncHandler(adminController.getCacheStats)
);

// Database management
router.post(
  '/database/refresh-views',
  asyncHandler(adminController.refreshMaterializedViews)
);

router.get(
  '/database/stats',
  asyncHandler(adminController.getDatabaseStats)
);

// Audit logs
router.get(
  '/audit-logs',
  asyncHandler(adminController.getAuditLogs)
);

export default router;