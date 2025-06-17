/**
 * Measurement Routes
 * API endpoints for impact measurement tracking
 */

import { Router } from 'express';
import { requireOrganization, requirePermission } from '@/middleware/auth';
import { measurementController } from '@/controllers/measurementController';
import { asyncHandler } from '@/utils/errors';

const router = Router();

// All measurement routes require organization context
router.use(requireOrganization);

// Get measurements for organization
router.get(
  '/',
  requirePermission('measurement:read'),
  asyncHandler(measurementController.getMeasurements)
);

// Create new measurement
router.post(
  '/',
  requirePermission('measurement:create'),
  asyncHandler(measurementController.createMeasurement)
);

// Get specific measurement
router.get(
  '/:measurementId',
  requirePermission('measurement:read'),
  asyncHandler(measurementController.getMeasurement)
);

// Update measurement
router.patch(
  '/:measurementId',
  requirePermission('measurement:update'),
  asyncHandler(measurementController.updateMeasurement)
);

// Delete measurement
router.delete(
  '/:measurementId',
  requirePermission('measurement:delete'),
  asyncHandler(measurementController.deleteMeasurement)
);

// Verify measurement
router.post(
  '/:measurementId/verify',
  requirePermission('measurement:verify'),
  asyncHandler(measurementController.verifyMeasurement)
);

// Get measurement analytics
router.get(
  '/analytics/overview',
  requirePermission('measurement:read'),
  asyncHandler(measurementController.getAnalytics)
);

// Export measurements
router.post(
  '/export',
  requirePermission('measurement:read'),
  asyncHandler(measurementController.exportMeasurements)
);

export default router;