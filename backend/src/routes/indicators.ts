/**
 * Indicator Selection and Management Routes
 * API endpoints for selecting recommended indicators and setting up data collection
 */

import { Router } from 'express';
import * as indicatorSelectionController from '@/controllers/indicatorSelectionController';
import { authMiddleware } from '@/middleware/auth';
import { rateLimitMiddleware } from '@/middleware/rateLimit';
import { validateRequest } from '@/middleware/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const indicatorSelectionSchema = Joi.object({
  selections: Joi.array().items(
    Joi.object({
      indicatorId: Joi.string().uuid().required(),
      indicatorName: Joi.string().max(500).required(),
      complexity: Joi.string().valid('basic', 'intermediate', 'advanced').required(),
      dataCollectionFrequency: Joi.string().valid(
        'real_time', 'daily', 'weekly', 'monthly', 
        'quarterly', 'semi_annually', 'annually'
      ).optional(),
      targetValue: Joi.number().positive().optional(),
      notes: Joi.string().max(1000).optional()
    })
  ).min(1).max(20).required(),
  conversationId: Joi.string().uuid().optional()
});

const dataCollectionSetupSchema = Joi.object({
  frequency: Joi.string().valid('weekly', 'monthly', 'quarterly', 'annually').required(),
  startDate: Joi.date().min('now').required(),
  targetValue: Joi.number().positive().optional(),
  dataSource: Joi.string().min(3).max(200).required(),
  responsibleTeam: Joi.string().max(100).optional(),
  notes: Joi.string().max(1000).optional()
});

const selectedIndicatorsQuerySchema = Joi.object({
  status: Joi.string().valid('selected', 'active', 'paused', 'archived').optional(),
  includeSetup: Joi.boolean().default(false)
});

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route POST /api/indicators/select
 * @desc Save selected indicators from bot recommendations
 * @access Private
 * @rateLimit 20 requests per hour per user
 */
router.post(
  '/select',
  rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 20, keyGenerator: 'user' }),
  validateRequest(indicatorSelectionSchema),
  indicatorSelectionController.saveSelectedIndicators
);

/**
 * @route GET /api/indicators/selected
 * @desc Get user's selected indicators with optional filtering
 * @access Private
 */
router.get(
  '/selected',
  validateRequest(selectedIndicatorsQuerySchema, 'query'),
  indicatorSelectionController.getSelectedIndicators
);

/**
 * @route POST /api/indicators/selected/:selectionId/setup-data-collection
 * @desc Setup data collection for a selected indicator
 * @access Private
 * @rateLimit 10 requests per hour per user
 */
router.post(
  '/selected/:selectionId/setup-data-collection',
  rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 10, keyGenerator: 'user' }),
  validateRequest(dataCollectionSetupSchema),
  indicatorSelectionController.setupDataCollection
);

/**
 * @route DELETE /api/indicators/selected/:selectionId
 * @desc Remove a selected indicator (archive if has data, delete if no data)
 * @access Private
 */
router.delete(
  '/selected/:selectionId',
  indicatorSelectionController.removeSelectedIndicator
);

/**
 * @route GET /api/indicators/health
 * @desc Health check for indicator selection service
 * @access Private
 */
router.get('/health', async (req, res) => {
  try {
    // Test database connectivity
    const { prisma } = await import('@/config/database');
    await prisma.irisKeyIndicator.count();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        indicators: 'available'
      }
    });

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

export default router;