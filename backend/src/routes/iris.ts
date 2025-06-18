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
  asyncHandler(irisController.getStrategicGoals)
);

// Get indicators by strategic goal
router.get(
  '/goals/:goalId/indicators',
  requirePermission('iris:read'),
  asyncHandler(irisController.getKeyIndicators)
);

// Search across IRIS+ framework
router.post(
  '/search',
  requirePermission('iris:read'),
  asyncHandler(irisController.searchIndicators)
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
  asyncHandler(irisController.getIndicatorById)
);

// Get data requirements for indicator
router.get(
  '/indicators/:indicatorId/data-requirements',
  requirePermission('iris:read'),
  asyncHandler(irisController.getIndicatorById)
);

// Get SDGs and targets
router.get(
  '/sdgs',
  requirePermission('iris:read'),
  asyncHandler(irisController.getCategories)
);

// Get SDG indicators
router.get(
  '/sdgs/:sdgId/indicators',
  requirePermission('iris:read'),
  asyncHandler(irisController.getKeyIndicators)
);

export default router;