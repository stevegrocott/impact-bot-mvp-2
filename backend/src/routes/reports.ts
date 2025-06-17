/**
 * Report Routes
 * API endpoints for impact report generation
 */

import { Router } from 'express';
import { requireOrganization, requirePermission } from '@/middleware/auth';
import { reportController } from '@/controllers/reportController';
import { asyncHandler } from '@/utils/errors';

const router = Router();

// All report routes require organization context
router.use(requireOrganization);

// Get reports for organization
router.get(
  '/',
  requirePermission('report:read'),
  asyncHandler(reportController.getReports)
);

// Create new report
router.post(
  '/',
  requirePermission('report:create'),
  asyncHandler(reportController.createReport)
);

// Get specific report
router.get(
  '/:reportId',
  requirePermission('report:read'),
  asyncHandler(reportController.getReport)
);

// Update report
router.patch(
  '/:reportId',
  requirePermission('report:update'),
  asyncHandler(reportController.updateReport)
);

// Delete report
router.delete(
  '/:reportId',
  requirePermission('report:delete'),
  asyncHandler(reportController.deleteReport)
);

// Generate report content
router.post(
  '/:reportId/generate',
  requirePermission('report:create'),
  asyncHandler(reportController.generateReport)
);

// Export report
router.post(
  '/:reportId/export',
  requirePermission('report:read'),
  asyncHandler(reportController.exportReport)
);

// Share report
router.post(
  '/:reportId/share',
  requirePermission('report:share'),
  asyncHandler(reportController.shareReport)
);

export default router;