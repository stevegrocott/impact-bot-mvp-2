/**
 * Theory of Change API Routes
 * Foundation-first measurement design with flexible capture pathways
 */

import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth';
import { validateRequestBody } from '@/middleware/validateRequestBody';
import { theoryOfChangeService } from '@/services/theoryOfChangeService';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

const router = Router();

// All theory of change routes require authentication
router.use(requireAuth);

/**
 * GET /api/v1/theory-of-change/pathway-assessment
 * Determine recommended pathway based on user input
 */
router.get('/pathway-assessment', async (req, res, next) => {
  try {
    const { organizationId } = req.user!;
    const { hasDocuments, hasPartialTheory } = req.query;

    const assessment = await theoryOfChangeService.assessPathway(
      organizationId,
      hasDocuments === 'true',
      hasPartialTheory === 'true'
    );

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/theory-of-change
 * Get existing theory of change for organization
 */
router.get('/', async (req, res, next) => {
  try {
    const { organizationId } = req.user!;

    const theory = await theoryOfChangeService.getTheoryOfChange(organizationId);

    res.json({
      success: true,
      data: theory
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/theory-of-change/upload-documents
 * Upload and parse documents to extract theory of change
 */
router.post('/upload-documents', 
  validateRequestBody({
    type: 'object',
    properties: {
      documents: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
            content: { type: 'string' },
            type: { type: 'string' }
          },
          required: ['filename', 'content', 'type']
        },
        minItems: 1
      }
    },
    required: ['documents']
  }),
  async (req, res, next) => {
    try {
      const { organizationId } = req.user!;
      const { documents } = req.body;

      logger.info(`Processing document upload for organization ${organizationId}`, {
        documentCount: documents.length,
        filenames: documents.map((d: any) => d.filename)
      });

      const parseResult = await theoryOfChangeService.parseDocuments(organizationId, documents);

      res.json({
        success: true,
        data: parseResult,
        message: parseResult.needsGuidedCompletion 
          ? 'Documents parsed successfully, but some elements need clarification'
          : 'Documents parsed successfully and theory of change extracted'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/theory-of-change/guided-conversation/start
 * Start guided theory of change conversation
 */
router.post('/guided-conversation/start',
  validateRequestBody({
    type: 'object',
    properties: {
      partialTheory: {
        type: 'object',
        properties: {
          targetPopulation: { type: 'string' },
          problemDefinition: { type: 'string' },
          activities: { type: 'array', items: { type: 'string' } },
          outputs: { type: 'array', items: { type: 'string' } },
          shortTermOutcomes: { type: 'array', items: { type: 'string' } },
          longTermOutcomes: { type: 'array', items: { type: 'string' } },
          impacts: { type: 'array', items: { type: 'string' } },
          assumptions: { type: 'array', items: { type: 'string' } },
          externalFactors: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }),
  async (req, res, next) => {
    try {
      const { organizationId, id: userId } = req.user!;
      const { partialTheory } = req.body;

      const conversationState = await theoryOfChangeService.startGuidedConversation(
        organizationId,
        userId,
        partialTheory
      );

      res.json({
        success: true,
        data: conversationState,
        message: 'Guided conversation started successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/theory-of-change/guided-conversation/continue
 * Continue guided theory of change conversation
 */
router.post('/guided-conversation/continue',
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

      const result = await theoryOfChangeService.continueGuidedConversation(
        conversationId,
        userResponse
      );

      res.json({
        success: true,
        data: result,
        message: result.isComplete 
          ? 'Theory of change completed successfully!'
          : 'Conversation continued'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/theory-of-change/foundation-readiness
 * Get foundation readiness assessment for phase-gated access
 */
router.get('/foundation-readiness', async (req, res, next) => {
  try {
    const { organizationId } = req.user!;

    const readiness = await theoryOfChangeService.assessFoundationReadiness(organizationId);

    res.json({
      success: true,
      data: readiness,
      message: `Foundation readiness: ${readiness.readinessLevel} (${readiness.completenessScore}/100)`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/theory-of-change/update
 * Update existing theory of change
 */
router.put('/update',
  validateRequestBody({
    type: 'object',
    properties: {
      targetPopulation: { type: 'string' },
      problemDefinition: { type: 'string' },
      activities: { type: 'array', items: { type: 'string' } },
      outputs: { type: 'array', items: { type: 'string' } },
      shortTermOutcomes: { type: 'array', items: { type: 'string' } },
      longTermOutcomes: { type: 'array', items: { type: 'string' } },
      impacts: { type: 'array', items: { type: 'string' } },
      assumptions: { type: 'array', items: { type: 'string' } },
      externalFactors: { type: 'array', items: { type: 'string' } },
      interventionType: { type: 'string' },
      sector: { type: 'string' },
      geographicScope: { type: 'string' }
    }
  }),
  async (req, res, next) => {
    try {
      const { organizationId, id: userId } = req.user!;
      const theoryUpdate = req.body;

      // Store updated theory
      await (theoryOfChangeService as any).storeTheoryOfChange(
        organizationId,
        theoryUpdate,
        'complete',
        userId
      );

      // Get updated readiness assessment
      const readiness = await theoryOfChangeService.assessFoundationReadiness(organizationId);

      res.json({
        success: true,
        data: {
          theory: theoryUpdate,
          readiness
        },
        message: 'Theory of change updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/theory-of-change/validate
 * Validate theory of change completeness and quality
 */
router.post('/validate',
  validateRequestBody({
    type: 'object',
    properties: {
      theory: {
        type: 'object',
        properties: {
          targetPopulation: { type: 'string' },
          problemDefinition: { type: 'string' },
          activities: { type: 'array', items: { type: 'string' } },
          outputs: { type: 'array', items: { type: 'string' } },
          shortTermOutcomes: { type: 'array', items: { type: 'string' } },
          longTermOutcomes: { type: 'array', items: { type: 'string' } },
          impacts: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    required: ['theory']
  }),
  async (req, res, next) => {
    try {
      const { theory } = req.body;

      // Calculate completeness and readiness
      const completenessScore = (theoryOfChangeService as any).calculateCompleteness(theory);
      const readinessData = (theoryOfChangeService as any).calculateFoundationReadiness(theory);

      // Identify gaps and provide recommendations
      const validation = {
        completenessScore,
        ...readinessData,
        isValid: readinessData.allowsBasicAccess,
        gaps: readinessData.missingElements,
        recommendations: readinessData.recommendations
      };

      res.json({
        success: true,
        data: validation,
        message: validation.isValid 
          ? 'Theory of change is valid for basic measurement access'
          : 'Theory of change needs completion before measurement access'
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as theoryOfChangeRoutes };