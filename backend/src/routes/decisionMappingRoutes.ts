/**
 * Decision Mapping API Routes
 * "What decisions will this data inform?" - Prevent over-engineering and ensure measurement utility
 */

import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth';
import { validateRequestBody } from '@/middleware/validateRequestBody';
import { decisionMappingService } from '@/services/decisionMappingService';
import { prisma } from '@/config/database';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

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
      existingDecisions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            decisionType: { type: 'string', enum: ['strategic', 'operational', 'tactical', 'adaptive'] },
            stakeholders: { type: 'array', items: { type: 'string' } },
            urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
          }
        }
      }
    }
  }),
  async (req, res, next) => {
    try {
      const { organizationId, userId } = req.user!;
      const { existingDecisions } = req.body;

      logger.info(`Starting decision mapping for organization ${organizationId}`);

      const mappingSession = await decisionMappingService.startDecisionMapping(
        organizationId,
        userId,
        { existingDecisions }
      );

      res.json({
        success: true,
        data: mappingSession,
        message: 'Decision mapping process started successfully'
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
      conversationId: { type: 'string' },
      userResponse: { type: 'string', minLength: 1 }
    },
    required: ['conversationId', 'userResponse']
  }),
  async (req, res, next) => {
    try {
      const { conversationId, userResponse } = req.body;

      const result = await decisionMappingService.continueDecisionMapping(
        conversationId,
        userResponse
      );

      res.json({
        success: true,
        data: result,
        message: result.isComplete 
          ? 'Decision mapping completed successfully!'
          : 'Decision mapping continued'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/decision-mapping/decisions
 * Get mapped decisions for organization
 */
router.get('/decisions', async (req, res, next) => {
  try {
    const { organizationId } = req.user!;

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
      indicatorIds: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1
      },
      decisionQuestionIds: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1
      }
    },
    required: ['indicatorIds', 'decisionQuestionIds']
  }),
  async (req, res, next) => {
    try {
      const { indicatorIds, decisionQuestionIds } = req.body;
      const { organizationId } = req.user!;

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

      const utilities = await decisionMappingService.assessIndicatorUtility(indicatorIds, decisions as any);

      res.json({
        success: true,
        data: utilities,
        message: `Utility assessment complete for ${indicatorIds.length} indicators`
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/decision-mapping/minimum-viable-measurement
 * Generate minimum viable measurement recommendations
 */
router.post('/minimum-viable-measurement',
  validateRequestBody({
    type: 'object',
    properties: {
      decisionQuestionIds: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1
      }
    },
    required: ['decisionQuestionIds']
  }),
  async (req, res, next) => {
    try {
      const { decisionQuestionIds } = req.body;
      const { organizationId } = req.user!;

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
        message: 'Minimum viable measurement recommendations generated'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/decision-mapping/decisions/:id
 * Update a decision question
 */
router.put('/decisions/:id',
  validateRequestBody({
    type: 'object',
    properties: {
      question: { type: 'string' },
      decisionType: { type: 'string', enum: ['strategic', 'operational', 'tactical', 'adaptive'] },
      stakeholders: { type: 'array', items: { type: 'string' } },
      frequency: { type: 'string', enum: ['ongoing', 'quarterly', 'annually', 'one-time'] },
      urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      evidenceNeeds: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['quantitative', 'qualitative', 'mixed'] },
            description: { type: 'string' },
            minimumQuality: { type: 'string', enum: ['rough', 'good', 'rigorous'] }
          }
        }
      },
      changeReason: { type: 'string' }
    },
    required: ['changeReason']
  }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { organizationId, userId } = req.user!;
      const { changeReason, ...updateData } = req.body;

      // Get existing decision
      const existingDecision = await prisma.decisionQuestion.findFirst({
        where: { id, organizationId }
      });

      if (!existingDecision) {
        throw new AppError('Decision question not found', 404);
      }

      // Update decision
      const updatedDecision = await prisma.decisionQuestion.update({
        where: { id },
        data: updateData
      });

      // Track evolution
      await decisionMappingService.trackDecisionEvolution(
        id,
        'question_refined',
        existingDecision,
        updatedDecision,
        changeReason,
        userId
      );

      res.json({
        success: true,
        data: updatedDecision,
        message: 'Decision question updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/decision-mapping/decisions/:id/evolution
 * Get evolution history for a decision question
 */
router.get('/decisions/:id/evolution', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    // Verify decision belongs to organization
    const decision = await prisma.decisionQuestion.findFirst({
      where: { id, organizationId }
    });

    if (!decision) {
      throw new AppError('Decision question not found', 404);
    }

    const evolution = await prisma.decisionEvolution.findMany({
      where: { decisionQuestionId: id },
      orderBy: { changedAt: 'desc' },
      include: {
        changedByUser: {
          select: { email: true, firstName: true, lastName: true }
        }
      }
    });

    res.json({
      success: true,
      data: evolution,
      message: `Retrieved ${evolution.length} evolution events`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/decision-mapping/decisions/:id
 * Mark a decision question as resolved
 */
router.delete('/decisions/:id',
  validateRequestBody({
    type: 'object',
    properties: {
      resolutionReason: { type: 'string', minLength: 1 }
    },
    required: ['resolutionReason']
  }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { organizationId, userId } = req.user!;
      const { resolutionReason } = req.body;

      // Get decision
      const decision = await prisma.decisionQuestion.findFirst({
        where: { id, organizationId }
      });

      if (!decision) {
        throw new AppError('Decision question not found', 404);
      }

      // Track resolution
      await decisionMappingService.trackDecisionEvolution(
        id,
        'decision_resolved',
        decision,
        { resolved: true, resolutionReason },
        resolutionReason,
        userId
      );

      // Soft delete by updating status
      await prisma.decisionQuestion.update({
        where: { id },
        data: { 
          status: 'resolved',
          resolvedAt: new Date(),
          resolutionReason
        }
      });

      res.json({
        success: true,
        message: 'Decision question marked as resolved'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/decision-mapping/analytics
 * Get decision mapping analytics for organization
 */
router.get('/analytics', async (req, res, next) => {
  try {
    const { organizationId } = req.user!;

    const analytics = await prisma.decisionQuestion.groupBy({
      by: ['decisionType', 'urgency'],
      where: { organizationId },
      _count: true
    });

    const evolutionStats = await prisma.decisionEvolution.groupBy({
      by: ['changeType'],
      where: {
        decisionQuestion: { organizationId }
      },
      _count: true
    });

    const summary = {
      totalDecisions: await prisma.decisionQuestion.count({ where: { organizationId } }),
      byType: analytics.reduce((acc: any, item) => {
        acc[item.decisionType] = (acc[item.decisionType] || 0) + item._count;
        return acc;
      }, {}),
      byUrgency: analytics.reduce((acc: any, item) => {
        acc[item.urgency] = (acc[item.urgency] || 0) + item._count;
        return acc;
      }, {}),
      evolutionActivity: evolutionStats.reduce((acc: any, item) => {
        acc[item.changeType] = item._count;
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