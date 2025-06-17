/**
 * Real-Time Warning API Routes
 * Expose pitfall prevention warnings during user interactions
 */

import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth';
import { validateRequestBody } from '@/middleware/validateRequestBody';
import { realTimeWarningService, WarningContext } from '@/services/realTimeWarningService';
import { behaviorTrackers } from '@/middleware/behaviorTrackingMiddleware';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * POST /api/v1/warnings/generate
 * Generate real-time warnings for current context
 */
router.post('/generate',
  validateRequestBody({
    type: 'object',
    properties: {
      triggerAction: { type: 'string' },
      context: {
        type: 'object',
        properties: {
          currentStep: { type: 'string' },
          indicators: { type: 'array' },
          theoryOfChange: { type: 'object' },
          decisionQuestions: { type: 'array' },
          foundationLevel: { type: 'string' }
        },
        required: ['currentStep']
      },
      actionData: { type: 'object' }
    },
    required: ['triggerAction', 'context']
  }),
  behaviorTrackers.conversation,
  async (req, res, next) => {
    try {
      const { triggerAction, context, actionData = {} } = req.body;
      const { organizationId, userId } = req.user!;

      // Build warning context
      const warningContext: WarningContext = {
        organizationId,
        userId,
        sessionId: req.sessionId || `session-${Date.now()}`,
        ...context
      };

      // Generate warnings
      const warningResponse = await realTimeWarningService.generateWarnings(
        warningContext,
        triggerAction,
        actionData
      );

      res.json({
        success: true,
        data: warningResponse,
        message: `${warningResponse.warnings.length} warnings generated`
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/warnings/:warningId/interact
 * Track user interaction with a warning
 */
router.post('/:warningId/interact',
  validateRequestBody({
    type: 'object',
    properties: {
      action: { 
        type: 'string',
        enum: ['shown', 'dismissed', 'acted_upon', 'ignored']
      },
      context: {
        type: 'object',
        properties: {
          currentStep: { type: 'string' },
          foundationLevel: { type: 'string' }
        }
      },
      metadata: { type: 'object' }
    },
    required: ['action']
  }),
  async (req, res, next) => {
    try {
      const { warningId } = req.params;
      const { action, context = {}, metadata = {} } = req.body;
      const { organizationId, userId } = req.user!;

      // Build warning context
      const warningContext: WarningContext = {
        organizationId,
        userId,
        sessionId: req.sessionId || `session-${Date.now()}`,
        currentStep: context.currentStep || 'unknown',
        foundationLevel: context.foundationLevel
      };

      // Track interaction
      await realTimeWarningService.trackWarningInteraction(
        warningContext,
        warningId,
        action
      );

      res.json({
        success: true,
        message: `Warning interaction tracked: ${action}`
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/warnings/effectiveness
 * Get warning effectiveness metrics for the organization
 */
router.get('/effectiveness',
  async (req, res, next) => {
    try {
      const { timeRange = '7d' } = req.query;
      const { organizationId } = req.user!;

      // Validate time range
      if (!['24h', '7d', '30d'].includes(timeRange as string)) {
        throw new AppError('Invalid time range. Use 24h, 7d, or 30d', 400);
      }

      const effectiveness = await realTimeWarningService.getWarningEffectiveness(
        organizationId,
        timeRange as '24h' | '7d' | '30d'
      );

      res.json({
        success: true,
        data: effectiveness,
        message: `Warning effectiveness for ${timeRange}`
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/warnings/preview
 * Preview warnings without tracking (for UI development/testing)
 */
router.post('/preview',
  validateRequestBody({
    type: 'object',
    properties: {
      triggerAction: { type: 'string' },
      context: {
        type: 'object',
        properties: {
          currentStep: { type: 'string' },
          indicators: { type: 'array' },
          theoryOfChange: { type: 'object' },
          decisionQuestions: { type: 'array' },
          foundationLevel: { type: 'string' }
        },
        required: ['currentStep']
      },
      actionData: { type: 'object' }
    },
    required: ['triggerAction', 'context']
  }),
  async (req, res, next) => {
    try {
      const { triggerAction, context, actionData = {} } = req.body;
      const { organizationId, userId } = req.user!;

      // Build warning context
      const warningContext: WarningContext = {
        organizationId,
        userId,
        sessionId: `preview-${Date.now()}`,
        ...context
      };

      // Generate warnings without tracking
      const warningResponse = await realTimeWarningService.generateWarnings(
        warningContext,
        triggerAction,
        actionData
      );

      res.json({
        success: true,
        data: {
          ...warningResponse,
          isPreview: true
        },
        message: `Preview: ${warningResponse.warnings.length} warnings would be shown`
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/warnings/types
 * Get available warning types and their descriptions
 */
router.get('/types', (req, res) => {
  const warningTypes = {
    activity_vs_impact: {
      title: 'Activity vs Impact',
      description: 'Warns when indicators measure activities/outputs instead of outcomes/impacts',
      severity_levels: ['medium', 'high'],
      prevention_focus: 'Distinguishing between what you do and what changes'
    },
    proxy_metric: {
      title: 'Proxy Metric Detection',
      description: 'Identifies when indicators are proxies for what you really want to measure',
      severity_levels: ['low', 'medium'],
      prevention_focus: 'Encouraging direct measurement when possible'
    },
    over_engineering: {
      title: 'Over-Engineering Prevention',
      description: 'Warns when measurement system is becoming too complex',
      severity_levels: ['medium', 'high'],
      prevention_focus: 'Maintaining focus on essential indicators'
    },
    portfolio_imbalance: {
      title: 'Portfolio Balance',
      description: 'Identifies imbalanced indicator portfolios (too many outputs, not enough outcomes)',
      severity_levels: ['medium', 'high'],
      prevention_focus: 'Encouraging balanced measurement approaches'
    },
    foundation_gap: {
      title: 'Foundation Gaps',
      description: 'Critical warnings when theory of change or decision questions are missing',
      severity_levels: ['high', 'critical'],
      prevention_focus: 'Foundation-first measurement design'
    }
  };

  res.json({
    success: true,
    data: {
      warningTypes,
      totalTypes: Object.keys(warningTypes).length,
      preventionPhilosophy: 'Real-time guidance to prevent expensive measurement mistakes'
    },
    message: 'Warning types and configuration retrieved'
  });
});

/**
 * POST /api/v1/warnings/bulk-preview
 * Preview warnings for multiple indicator selections at once
 */
router.post('/bulk-preview',
  validateRequestBody({
    type: 'object',
    properties: {
      indicatorSelections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            indicators: { type: 'array' },
            context: { type: 'object' }
          },
          required: ['indicators']
        }
      },
      baseContext: {
        type: 'object',
        properties: {
          theoryOfChange: { type: 'object' },
          decisionQuestions: { type: 'array' },
          foundationLevel: { type: 'string' }
        }
      }
    },
    required: ['indicatorSelections']
  }),
  async (req, res, next) => {
    try {
      const { indicatorSelections, baseContext = {} } = req.body;
      const { organizationId, userId } = req.user!;

      const bulkResults = [];

      for (let i = 0; i < indicatorSelections.length; i++) {
        const selection = indicatorSelections[i];
        
        const warningContext: WarningContext = {
          organizationId,
          userId,
          sessionId: `bulk-preview-${Date.now()}-${i}`,
          currentStep: 'bulk_indicator_selection',
          indicators: selection.indicators,
          ...baseContext,
          ...selection.context
        };

        const warningResponse = await realTimeWarningService.generateWarnings(
          warningContext,
          'bulk_indicator_selection',
          { selectionIndex: i }
        );

        bulkResults.push({
          selectionIndex: i,
          indicatorCount: selection.indicators.length,
          warningCount: warningResponse.warnings.length,
          shouldBlock: warningResponse.shouldBlock,
          warnings: warningResponse.warnings,
          guidance: warningResponse.contextualGuidance
        });
      }

      // Calculate summary metrics
      const summary = {
        totalSelections: indicatorSelections.length,
        selectionsWithWarnings: bulkResults.filter(r => r.warningCount > 0).length,
        selectionsBlocked: bulkResults.filter(r => r.shouldBlock).length,
        averageWarningsPerSelection: bulkResults.reduce((sum, r) => sum + r.warningCount, 0) / bulkResults.length,
        mostCommonWarningType: this.getMostCommonWarningType(bulkResults)
      };

      res.json({
        success: true,
        data: {
          results: bulkResults,
          summary,
          isPreview: true
        },
        message: `Bulk preview completed for ${indicatorSelections.length} selections`
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * Helper method to find most common warning type in bulk results
 */
function getMostCommonWarningType(bulkResults: any[]): string {
  const warningTypeCounts: Record<string, number> = {};
  
  bulkResults.forEach(result => {
    result.warnings.forEach((warning: any) => {
      warningTypeCounts[warning.type] = (warningTypeCounts[warning.type] || 0) + 1;
    });
  });

  return Object.entries(warningTypeCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([type]) => type)[0] || 'none';
}

export { router as realTimeWarningRoutes };