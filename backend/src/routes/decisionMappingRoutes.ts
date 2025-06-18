/**
 * Decision Mapping API Routes
 * "What decisions will this data inform?" - Prevent over-engineering and ensure measurement utility
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '@/middleware/requireAuth';
import { validateRequestBody } from '@/middleware/validateRequestBody';
import { decisionMappingService } from '@/services/decisionMappingService';
import { prisma } from '@/config/database';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { getUserContext } from '@/utils/routeHelpers';

const router = Router();

// All decision mapping routes require authentication
router.use(requireAuth);

/**
 * POST /api/v1/decision-mapping/start
 * Start guided decision mapping process
 */
router.post('/start', 
  validateRequestBody({
    type: 'object',
    properties: {
      organizationContext: { type: 'object' },
      existingDecisions: { type: 'array' }
    },
    required: []
  }),
  async (req, res, next) => {
    try {
      const { organizationId } = getUserContext(req);
      const { organizationContext, existingDecisions = [] } = req.body;

      const guidanceSession = await decisionMappingService.startDecisionMapping(
        organizationId,
        req.user!.id,
        { existingDecisions }
      );

      res.json({
        success: true,
        data: guidanceSession,
        message: 'Decision mapping session started'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/decision-mapping/continue
 * Continue guided decision mapping conversation
 */
router.post('/continue',
  validateRequestBody({
    type: 'object',
    properties: {
      sessionId: { type: 'string' },
      userResponse: { type: 'string' },
      context: { type: 'object' }
    },
    required: ['sessionId', 'userResponse']
  }),
  async (req, res, next) => {
    try {
      const { organizationId } = getUserContext(req);
      const { sessionId, userResponse, context } = req.body;

      const nextStep = await decisionMappingService.continueDecisionMapping(
        sessionId,
        userResponse
      );

      res.json({
        success: true,
        data: nextStep,
        message: 'Decision mapping step processed'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/decision-mapping/decisions
 * Get all mapped decisions for organization
 */
router.get('/decisions', async (req, res, next) => {
  try {
    const { organizationId } = getUserContext(req);

    const decisions = await prisma.decisionQuestion.findMany({
      where: { organizationId },
      include: {
        evolution: {
          orderBy: { changedAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: decisions,
      message: `Retrieved ${decisions.length} mapped decisions`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/decision-mapping/assess-utility
 * Assess how well indicators inform mapped decisions
 */
router.post('/assess-utility',
  validateRequestBody({
    type: 'object',
    properties: {
      indicatorIds: { type: 'array', items: { type: 'string' } },
      decisionQuestionIds: { type: 'array', items: { type: 'string' } }
    },
    required: ['indicatorIds', 'decisionQuestionIds']
  }),
  async (req, res, next) => {
    try {
      const { indicatorIds, decisionQuestionIds } = req.body;
      const { organizationId } = getUserContext(req);

      // Get decision questions
      const decisions = await prisma.decisionQuestion.findMany({
        where: { 
          id: { in: decisionQuestionIds },
          organizationId // Ensure decisions belong to user's org
        }
      });

      if (decisions.length !== decisionQuestionIds.length) {
        throw new AppError('Some decision questions not found or not accessible', 404);
      }

      logger.info(`Assessing utility of ${indicatorIds.length} indicators against ${decisions.length} decisions`);

      const utilityAssessment = await decisionMappingService.assessIndicatorUtility(
        indicatorIds,
        decisions as any
      );

      res.json({
        success: true,
        data: utilityAssessment,
        message: 'Indicator utility assessment completed'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/decision-mapping/minimum-viable-measurement
 * Generate minimum viable measurement plan
 */
router.post('/minimum-viable-measurement',
  validateRequestBody({
    type: 'object',
    properties: {
      decisionQuestionIds: { type: 'array', items: { type: 'string' } },
      resourceConstraints: { type: 'object' }
    },
    required: ['decisionQuestionIds']
  }),
  async (req, res, next) => {
    try {
      const { decisionQuestionIds, resourceConstraints } = req.body;
      const { organizationId } = getUserContext(req);

      // Get decision questions
      const decisions = await prisma.decisionQuestion.findMany({
        where: { 
          id: { in: decisionQuestionIds },
          organizationId
        }
      });

      if (decisions.length === 0) {
        throw new AppError('No valid decision questions found', 404);
      }

      logger.info(`Generating minimum viable measurement for ${decisions.length} decisions`);

      const minimumViable = await decisionMappingService.generateMinimumViableMeasurement(decisions as any);

      res.json({
        success: true,
        data: minimumViable,
        message: 'Minimum viable measurement plan generated'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/decision-mapping/analytics
 * Get decision mapping analytics and insights
 */
router.get('/analytics', async (req, res, next) => {
  try {
    const { organizationId } = getUserContext(req);

    const analytics = await prisma.decisionQuestion.groupBy({
      by: ['decisionType', 'status'],
      where: { organizationId },
      _count: true
    });

    const summary = {
      totalDecisions: await prisma.decisionQuestion.count({ where: { organizationId } }),
      byType: analytics.reduce((acc: any, item) => {
        acc[item.decisionType] = (acc[item.decisionType] || 0) + item._count;
        return acc;
      }, {}),
      byStatus: analytics.reduce((acc: any, item) => {
        acc[item.status] = (acc[item.status] || 0) + item._count;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: summary,
      message: 'Decision mapping analytics retrieved'
    });
  } catch (error) {
    next(error);
  }
});

export { router as decisionMappingRoutes };