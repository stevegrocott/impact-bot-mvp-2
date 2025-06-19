/**
 * Data Collection Planning Routes
 * API endpoints for comprehensive data collection planning for custom indicators
 */

import { Router } from 'express';
import { requireOrganization, requirePermission } from '@/middleware/auth';
import { dataCollectionPlanningController } from '@/controllers/dataCollectionPlanningController';
import { asyncHandler } from '@/utils/errors';

const router = Router();

// All data collection planning routes require organization context
router.use(requireOrganization);

// Get available data collection methods with filtering
router.get(
  '/methods',
  requirePermission('indicator:read'),
  asyncHandler(dataCollectionPlanningController.getDataCollectionMethods.bind(dataCollectionPlanningController))
);

// Get saved data collection plans for organization
router.get(
  '/plans',
  requirePermission('indicator:read'),
  asyncHandler(dataCollectionPlanningController.getSavedPlans.bind(dataCollectionPlanningController))
);

// Generate comprehensive data collection plan for custom indicator
router.post(
  '/indicators/:customIndicatorId/plan',
  requirePermission('indicator:create'),
  asyncHandler(dataCollectionPlanningController.generateCollectionPlan.bind(dataCollectionPlanningController))
);

// Update existing data collection plan
router.patch(
  '/indicators/:customIndicatorId/plan',
  requirePermission('indicator:update'),
  asyncHandler(dataCollectionPlanningController.updateCollectionPlan.bind(dataCollectionPlanningController))
);

// Delete data collection plan
router.delete(
  '/indicators/:customIndicatorId/plan',
  requirePermission('indicator:delete'),
  asyncHandler(dataCollectionPlanningController.deleteCollectionPlan.bind(dataCollectionPlanningController))
);

export default router;