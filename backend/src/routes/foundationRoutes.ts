/**
 * Foundation Readiness API Routes
 * Phase-gated access control and foundation status management
 */

import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth';
import { validateRequestBody } from '@/middleware/validateRequestBody';
import { getFoundationStatus, phaseGates } from '@/middleware/phaseGateMiddleware';
import { theoryOfChangeService } from '@/services/theoryOfChangeService';
import { prisma } from '@/config/database';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

const router = Router();

// All foundation routes require authentication
router.use(requireAuth);

/**
 * GET /api/v1/foundation/status
 * Get comprehensive foundation readiness status
 */
router.get('/status', async (req, res, next) => {
  try {
    const { organizationId } = req.user!;

    // For now, return a default foundation status until database is properly set up
    logger.info('Getting foundation status for organization', { organizationId });

    // Return default status for development
    const foundationStatus = {
      hasTheoryOfChange: false,
      foundationReadiness: null,
      hasDecisionMapping: false,
      decisionCount: 0,
      allowsBasicAccess: false,
      allowsIntermediateAccess: false,
      allowsAdvancedAccess: false,
      blockingReasons: ['Theory of change not yet created']
    };

    res.json({
      success: true,
      data: foundationStatus
    });

  } catch (error) {
    logger.error('Error getting foundation status:', { error: error.message, organizationId: req.user?.organizationId });
    next(new AppError('Failed to get foundation status', 500, 'FOUNDATION_STATUS_ERROR'));
  }
});

/**
 * GET /api/v1/foundation/readiness
 * Get detailed readiness assessment
 */
router.get('/readiness', async (req, res, next) => {
  try {
    const { organizationId } = req.user!;

    // Return default readiness for development
    const readiness = {
      completenessScore: 15,
      readinessLevel: 'insufficient',
      missingElements: [
        'Theory of change',
        'Key decision mapping',
        'Initial indicator selection'
      ],
      strengthAreas: [],
      recommendations: [
        'Start by creating a theory of change',
        'Map your key strategic decisions',
        'Choose foundational indicators'
      ],
      allowsBasicAccess: false,
      allowsIntermediateAccess: false,
      allowsAdvancedAccess: false
    };

    res.json({
      success: true,
      data: readiness
    });

  } catch (error) {
    logger.error('Error getting foundation readiness:', { error: error.message, organizationId: req.user?.organizationId });
    next(new AppError('Failed to get foundation readiness', 500, 'FOUNDATION_READINESS_ERROR'));
  }
});

/**
 * POST /api/v1/foundation/assess
 * Trigger foundation readiness assessment
 */
router.post('/assess', async (req, res, next) => {
  try {
    const { organizationId } = req.user!;

    logger.info('Triggering foundation assessment', { organizationId });

    // Return mock assessment results
    const assessment = {
      completenessScore: 25,
      readinessLevel: 'basic',
      missingElements: [
        'Detailed outcome metrics',
        'Impact measurement framework'
      ],
      strengthAreas: [
        'Clear problem definition',
        'Defined target population'
      ],
      recommendations: [
        'Expand your theory of change with specific outcomes',
        'Add measurement indicators for each outcome',
        'Create a data collection plan'
      ],
      allowsBasicAccess: true,
      allowsIntermediateAccess: false,
      allowsAdvancedAccess: false,
      assessmentDate: new Date().toISOString()
    };

    res.json({
      success: true,
      data: assessment,
      message: 'Foundation assessment completed'
    });

  } catch (error) {
    logger.error('Error assessing foundation:', { error: error.message, organizationId: req.user?.organizationId });
    next(new AppError('Failed to assess foundation', 500, 'FOUNDATION_ASSESS_ERROR'));
  }
});

export default router;