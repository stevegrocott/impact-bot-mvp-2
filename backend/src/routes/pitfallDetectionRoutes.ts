/**
 * Pitfall Detection API Routes  
 * AI-powered real-time prevention of measurement pitfalls
 */

import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth';
import { validateRequestBody } from '@/middleware/validateRequestBody';
import { pitfallDetectionService } from '@/services/pitfallDetectionService';
import { prisma } from '@/config/database';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

const router = Router();

// All pitfall detection routes require authentication
router.use(requireAuth);

/**
 * POST /api/v1/pitfall-detection/classify-indicator
 * Classify single indicator impact level (Output vs Outcome vs Impact)
 */
router.post('/classify-indicator',
  validateRequestBody({
    type: 'object', 
    properties: {
      indicatorId: { type: 'string' }
    },
    required: ['indicatorId']
  }),
  async (req, res, next) => {
    try {
      const { indicatorId } = req.body;

      // Get indicator from database
      const indicator = await prisma.irisKeyIndicator.findUnique({
        where: { id: indicatorId }
      });

      if (!indicator) {
        throw new AppError('Indicator not found', 404);
      }

      const classification = await pitfallDetectionService.classifyImpactLevel(indicator);

      res.json({
        success: true,
        data: {
          indicatorId,
          indicatorName: indicator.name,
          classification
        },
        message: `Indicator classified as ${classification.level} with ${Math.round(classification.confidence * 100)}% confidence`
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/pitfall-detection/analyze-portfolio
 * Analyze portfolio balance and generate warnings for indicator selection
 */
router.post('/analyze-portfolio',
  validateRequestBody({
    type: 'object',
    properties: {
      indicatorIds: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1
      }
    },
    required: ['indicatorIds']
  }),
  async (req, res, next) => {
    try {
      const { indicatorIds } = req.body;

      logger.info(`Analyzing portfolio balance for ${indicatorIds.length} indicators`);

      const portfolioAnalysis = await pitfallDetectionService.analyzePortfolioBalance(indicatorIds);

      // Track pitfall warning for analytics
      if (portfolioAnalysis.warnings.length > 0) {
        logger.info('Portfolio warnings generated', {
          organizationId: req.user!.organizationId,
          warningCount: portfolioAnalysis.warnings.length,
          warningTypes: portfolioAnalysis.warnings.map(w => w.type)
        });
      }

      res.json({
        success: true,
        data: portfolioAnalysis,
        message: portfolioAnalysis.warnings.length > 0 
          ? `Portfolio analysis complete with ${portfolioAnalysis.warnings.length} warnings`
          : 'Portfolio analysis complete - good balance detected'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/pitfall-detection/detect-proxy
 * Detect if indicator is a proxy metric and suggest alternatives
 */
router.post('/detect-proxy',
  validateRequestBody({
    type: 'object',
    properties: {
      indicatorId: { type: 'string' }
    },
    required: ['indicatorId']
  }),
  async (req, res, next) => {
    try {
      const { indicatorId } = req.body;

      // Get indicator from database
      const indicator = await prisma.irisKeyIndicator.findUnique({
        where: { id: indicatorId }
      });

      if (!indicator) {
        throw new AppError('Indicator not found', 404);
      }

      const proxyDetectionResult = await pitfallDetectionService.detectProxyMetrics([indicator]);
      const proxyDetection = proxyDetectionResult.proxyIndicators[0] || { isProxy: false, confidence: 0, proxyFor: '', explanation: '', directAlternatives: [], triangulationOptions: [] };

      // Track proxy detection for analytics
      if (proxyDetection.isProxy) {
        logger.info('Proxy metric detected', {
          organizationId: req.user!.organizationId,
          indicatorId,
          proxyFor: proxyDetection.proxyFor,
          confidence: proxyDetection.confidence
        });
      }

      res.json({
        success: true,
        data: {
          indicatorId,
          indicatorName: indicator.name,
          proxyDetection
        },
        message: proxyDetection.isProxy 
          ? `Proxy metric detected: this measures ${proxyDetection.proxyFor}`
          : 'No proxy patterns detected'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/pitfall-detection/assess-over-engineering  
 * Assess measurement burden and suggest consolidation
 */
router.post('/assess-over-engineering',
  validateRequestBody({
    type: 'object',
    properties: {
      indicatorIds: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1
      },
      decisionMappings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            evidence: { type: 'array', items: { type: 'string' } }
          },
          required: ['question', 'evidence']
        }
      }
    },
    required: ['indicatorIds', 'decisionMappings']
  }),
  async (req, res, next) => {
    try {
      const { indicatorIds, decisionMappings } = req.body;

      const overEngineeringAssessment = await pitfallDetectionService.assessOverEngineering(
        indicatorIds,
        decisionMappings
      );

      // Track over-engineering warning for analytics
      if (overEngineeringAssessment.isOverEngineered) {
        logger.info('Over-engineering detected', {
          organizationId: req.user!.organizationId,
          indicatorCount: indicatorIds.length,
          burdenScore: overEngineeringAssessment.burdenScore,
          redundantCount: overEngineeringAssessment.redundantIndicators.length
        });
      }

      res.json({
        success: true,
        data: overEngineeringAssessment,
        message: overEngineeringAssessment.isOverEngineered
          ? `Over-engineering detected - consider reducing ${overEngineeringAssessment.redundantIndicators.length} indicators`
          : 'Measurement approach looks appropriately sized'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/pitfall-detection/generate-outcome-alternatives
 * Generate outcome alternatives for output indicators
 */
router.post('/generate-outcome-alternatives',
  validateRequestBody({
    type: 'object',
    properties: {
      indicatorId: { type: 'string' }
    },
    required: ['indicatorId']
  }),
  async (req, res, next) => {
    try {
      const { indicatorId } = req.body;

      // Get indicator from database
      const indicator = await prisma.irisKeyIndicator.findUnique({
        where: { id: indicatorId }
      });

      if (!indicator) {
        throw new AppError('Indicator not found', 404);
      }

      // First classify to ensure it's an output
      const classification = await pitfallDetectionService.classifyImpactLevel(indicator);
      
      if (classification.level !== 'output') {
        res.json({
          success: true,
          data: {
            indicatorId,
            alternatives: [],
            reason: `This indicator is classified as ${classification.level}, not output`
          },
          message: 'No alternatives needed - indicator is not an output measure'
        });
        return;
      }

      const alternatives = await pitfallDetectionService.generateOutcomeAlternatives(indicator);

      res.json({
        success: true,
        data: {
          indicatorId,
          indicatorName: indicator.name,
          classification,
          alternatives
        },
        message: `Generated ${alternatives.length} outcome alternatives for this output indicator`
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/pitfall-detection/bulk-analysis
 * Comprehensive pitfall analysis for entire indicator set
 */
router.post('/bulk-analysis',
  validateRequestBody({
    type: 'object',
    properties: {
      indicatorIds: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1
      },
      decisionMappings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            evidence: { type: 'array', items: { type: 'string' } }
          },
          required: ['question', 'evidence']
        }
      }
    },
    required: ['indicatorIds']
  }),
  async (req, res, next) => {
    try {
      const { indicatorIds, decisionMappings = [] } = req.body;

      logger.info(`Running bulk pitfall analysis for ${indicatorIds.length} indicators`);

      // Get all indicators
      const indicators = await prisma.irisKeyIndicator.findMany({
        where: { id: { in: indicatorIds } }
      });

      // Run all analyses in parallel for performance
      const [
        portfolioAnalysis,
        overEngineeringAssessment,
        ...individualClassifications
      ] = await Promise.all([
        pitfallDetectionService.analyzePortfolioBalance(indicatorIds),
        pitfallDetectionService.assessOverEngineering(indicatorIds, decisionMappings),
        ...indicators.map(indicator => 
          pitfallDetectionService.classifyImpactLevel(indicator)
        )
      ]);

      // Detect proxies for each indicator
      const proxyDetectionResult = await pitfallDetectionService.detectProxyMetrics(indicators);
      const proxyDetections = proxyDetectionResult.proxyIndicators;

      // Combine all analysis results
      const bulkAnalysis = {
        portfolioAnalysis,
        overEngineeringAssessment,
        indicators: indicators.map((indicator, index) => ({
          id: indicator.id,
          name: indicator.name,
          classification: individualClassifications[index],
          proxyDetection: proxyDetections[index]
        })),
        summary: {
          totalIndicators: indicators.length,
          outputCount: individualClassifications.filter(c => c.level === 'output').length,
          outcomeCount: individualClassifications.filter(c => c.level === 'outcome').length,
          impactCount: individualClassifications.filter(c => c.level === 'impact').length,
          proxyCount: proxyDetections.length,
          warningCount: portfolioAnalysis.warnings.length,
          isOverEngineered: overEngineeringAssessment.isOverEngineered
        }
      };

      // Track comprehensive analysis for analytics
      logger.info('Bulk pitfall analysis completed', {
        organizationId: req.user!.organizationId,
        ...bulkAnalysis.summary
      });

      res.json({
        success: true,
        data: bulkAnalysis,
        message: `Comprehensive pitfall analysis complete for ${indicators.length} indicators`
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as pitfallDetectionRoutes };