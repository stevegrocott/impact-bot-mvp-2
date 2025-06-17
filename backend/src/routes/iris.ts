/**
 * IRIS+ Framework Routes
 * API endpoints for IRIS+ data retrieval and search
 */

import { Router } from 'express';
import { requirePermission } from '@/middleware/auth';
import { irisController } from '@/controllers/irisController';
import { asyncHandler } from '@/utils/errors';

const router = Router();

// Get IRIS+ statistics
router.get(
  '/statistics',
  requirePermission('iris:read'),
  asyncHandler(irisController.getStatistics)
);

// Get all impact categories with hierarchy
router.get(
  '/categories',
  requirePermission('iris:read'),
  asyncHandler(irisController.getCategories)
);

// Get strategic goals by category
router.get(
  '/categories/:categoryId/goals',
  requirePermission('iris:read'),
  asyncHandler(irisController.getGoalsByCategory)
);

// Get indicators by strategic goal
router.get(
  '/goals/:goalId/indicators',
  requirePermission('iris:read'),
  asyncHandler(irisController.getIndicatorsByGoal)
);

// Search across IRIS+ framework
router.post(
  '/search',
  requirePermission('iris:read'),
  asyncHandler(irisController.search)
);

// Get recommendations for organization
router.post(
  '/recommendations',
  requirePermission('iris:read'),
  asyncHandler(irisController.getRecommendations)
);

// Get specific indicator details
router.get(
  '/indicators/:indicatorId',
  requirePermission('iris:read'),
  asyncHandler(irisController.getIndicatorDetails)
);

// Get data requirements for indicator
router.get(
  '/indicators/:indicatorId/data-requirements',
  requirePermission('iris:read'),
  asyncHandler(irisController.getDataRequirements)
);

// Get SDGs and targets
router.get(
  '/sdgs',
  requirePermission('iris:read'),
  asyncHandler(irisController.getSDGs)
);

// Get SDG indicators
router.get(
  '/sdgs/:sdgId/indicators',
  requirePermission('iris:read'),
  asyncHandler(irisController.getSDGIndicators)
);

export default router;