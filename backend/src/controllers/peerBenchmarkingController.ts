import { Request, Response } from 'express';
import { z } from 'zod';
import { getUserContext } from '../utils/routeHelpers';
import peerBenchmarkingService from '../services/peerBenchmarkingService';
import { transformToCamelCase } from '../utils/caseTransform';

// Validation schemas
const findPeerGroupSchema = z.object({
  sector: z.string().optional(),
  organizationSize: z.string().optional(),
  geography: z.string().optional(),
  programTypes: z.array(z.string()).optional(),
  similarityThreshold: z.number().min(0).max(100).optional()
});

const benchmarkComparisonSchema = z.object({
  peerGroupId: z.string().optional(),
  metrics: z.array(z.string()).optional()
});

/**
 * Find peer group for organization
 */
export const findPeerGroup = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    // Build criteria object with proper typing
    const criteriaData: Record<string, any> = {};
    if (req.query.sector) criteriaData.sector = String(req.query.sector);
    if (req.query.organizationSize) criteriaData.organizationSize = String(req.query.organizationSize);
    if (req.query.geography) criteriaData.geography = String(req.query.geography);
    if (req.query.programTypes) {
      criteriaData.programTypes = Array.isArray(req.query.programTypes) 
        ? req.query.programTypes.map(String) 
        : [String(req.query.programTypes)];
    }
    if (req.query.similarityThreshold) criteriaData.similarityThreshold = Number(req.query.similarityThreshold);

    const validatedCriteria = findPeerGroupSchema.parse(criteriaData);

    // Build criteria object with only defined values
    const criteriaOptions: Record<string, any> = {};
    if (validatedCriteria.sector) criteriaOptions.sector = validatedCriteria.sector;
    if (validatedCriteria.organizationSize) criteriaOptions.organizationSize = validatedCriteria.organizationSize;
    if (validatedCriteria.geography) criteriaOptions.geography = validatedCriteria.geography;
    if (validatedCriteria.programTypes) criteriaOptions.programTypes = validatedCriteria.programTypes;
    if (validatedCriteria.similarityThreshold) criteriaOptions.similarityThreshold = validatedCriteria.similarityThreshold;

    const peerGroup = await peerBenchmarkingService.findPeerGroup(
      userContext.organizationId,
      Object.keys(criteriaOptions).length > 0 ? criteriaOptions : undefined
    );

    const transformedPeerGroup = transformToCamelCase(peerGroup);

    return res.status(200).json({
      success: true,
      message: 'Peer group identified successfully',
      data: {
        peerGroup: transformedPeerGroup,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error finding peer group:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid criteria parameters',
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to find peer group'
    });
  }
};

/**
 * Perform benchmark comparison
 */
export const performBenchmarkComparison = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    // Build request data with proper typing
    const requestData: Record<string, any> = {};
    if (req.query.peerGroupId) requestData.peerGroupId = String(req.query.peerGroupId);
    if (req.query.metrics) {
      requestData.metrics = Array.isArray(req.query.metrics) 
        ? req.query.metrics.map(String) 
        : [String(req.query.metrics)];
    }

    const validatedRequest = benchmarkComparisonSchema.parse(requestData);

    const comparison = await peerBenchmarkingService.performBenchmarkComparison(
      userContext.organizationId,
      validatedRequest.peerGroupId,
      validatedRequest.metrics
    );

    const transformedComparison = transformToCamelCase(comparison);

    return res.status(200).json({
      success: true,
      message: 'Benchmark comparison completed successfully',
      data: {
        comparison: transformedComparison
      }
    });

  } catch (error: any) {
    console.error('Error performing benchmark comparison:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid comparison parameters',
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to perform benchmark comparison'
    });
  }
};

/**
 * Analyze best performers in peer group
 */
export const analyzeBestPerformers = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    const { peerGroupId } = req.params;
    if (!peerGroupId) {
      return res.status(400).json({
        success: false,
        error: 'Peer group ID is required'
      });
    }

    const analysis = await peerBenchmarkingService.analyzeBestPerformers(peerGroupId);

    const transformedAnalysis = transformToCamelCase(analysis);

    return res.status(200).json({
      success: true,
      message: 'Best performer analysis completed successfully',
      data: {
        analysis: transformedAnalysis,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error analyzing best performers:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze best performers'
    });
  }
};

/**
 * Perform performance gap analysis
 */
export const performGapAnalysis = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    const gapAnalysis = await peerBenchmarkingService.performGapAnalysis(
      userContext.organizationId
    );

    const transformedAnalysis = transformToCamelCase(gapAnalysis);

    return res.status(200).json({
      success: true,
      message: 'Performance gap analysis completed successfully',
      data: {
        gapAnalysis: transformedAnalysis
      }
    });

  } catch (error: any) {
    console.error('Error performing gap analysis:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to perform gap analysis'
    });
  }
};

/**
 * Get peer group performance metrics
 */
export const getPeerGroupMetrics = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    const { peerGroupId } = req.params;
    if (!peerGroupId) {
      return res.status(400).json({
        success: false,
        error: 'Peer group ID is required'
      });
    }

    // In production, this would fetch actual peer group metrics
    // For now, return mock detailed metrics data
    const metrics = {
      peerGroupId,
      totalOrganizations: 24,
      metricsOverview: {
        foundationReadiness: {
          average: 72,
          median: 74,
          standardDeviation: 12,
          range: { min: 45, max: 92 },
          distribution: {
            excellent: 8,
            good: 10,
            fair: 4,
            needs_improvement: 2
          }
        },
        measurementSophistication: {
          average: 68,
          median: 70,
          standardDeviation: 15,
          range: { min: 35, max: 88 },
          distribution: {
            excellent: 6,
            good: 8,
            fair: 7,
            needs_improvement: 3
          }
        }
      },
      trends: {
        lastQuarter: {
          foundationReadiness: 3.2,
          measurementSophistication: 1.8,
          stakeholderEngagement: 2.5
        },
        yearOverYear: {
          foundationReadiness: 8.5,
          measurementSophistication: 12.3,
          stakeholderEngagement: 6.8
        }
      },
      lastUpdated: new Date().toISOString()
    };

    const transformedMetrics = transformToCamelCase(metrics);

    return res.status(200).json({
      success: true,
      message: 'Peer group metrics retrieved successfully',
      data: {
        metrics: transformedMetrics
      }
    });

  } catch (error: any) {
    console.error('Error getting peer group metrics:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve peer group metrics'
    });
  }
};

/**
 * Get benchmarking insights and recommendations
 */
export const getBenchmarkingInsights = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    // Get comprehensive benchmarking data and generate insights
    const comparison = await peerBenchmarkingService.performBenchmarkComparison(
      userContext.organizationId
    );

    const insights = {
      performanceSummary: {
        overallRanking: 12,
        totalPeers: 24,
        percentileRank: 67,
        tier: 'above_average',
        trendDirection: 'improving'
      },
      keyStrengths: comparison.insights
        .filter(i => i.type === 'strength')
        .slice(0, 3),
      improvementOpportunities: comparison.insights
        .filter(i => i.type === 'opportunity')
        .slice(0, 3),
      priorityRecommendations: comparison.recommendations
        .filter(r => r.priority === 'critical' || r.priority === 'high')
        .slice(0, 5),
      peerLearningOpportunities: [
        {
          area: 'Stakeholder engagement',
          peerExample: 'Regional education nonprofit',
          approach: 'Community advisory board model',
          potentialImpact: 'High',
          implementationDifficulty: 'Moderate'
        },
        {
          area: 'Outcome measurement',
          peerExample: 'Similar workforce development org',
          approach: 'Systematic outcome tracking system',
          potentialImpact: 'High',
          implementationDifficulty: 'Easy'
        }
      ],
      nextSteps: [
        'Schedule gap analysis discussion with leadership',
        'Identify top 3 improvement priorities',
        'Connect with high-performing peer organizations',
        'Develop 90-day improvement plan'
      ]
    };

    const transformedInsights = transformToCamelCase(insights);

    return res.status(200).json({
      success: true,
      message: 'Benchmarking insights generated successfully',
      data: {
        insights: transformedInsights,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error getting benchmarking insights:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to generate benchmarking insights'
    });
  }
};

/**
 * Get benchmark comparison history
 */
export const getBenchmarkHistory = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    // Mock historical benchmarking data - would query actual history in production
    const history = {
      organizationId: userContext.organizationId,
      benchmarks: [
        {
          date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          overallRank: 15,
          totalPeers: 22,
          percentileRank: 59,
          keyMetrics: {
            foundationReadiness: 72,
            measurementSophistication: 58,
            stakeholderEngagement: 78
          }
        },
        {
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          overallRank: 13,
          totalPeers: 23,
          percentileRank: 63,
          keyMetrics: {
            foundationReadiness: 75,
            measurementSophistication: 62,
            stakeholderEngagement: 80
          }
        },
        {
          date: new Date(),
          overallRank: 12,
          totalPeers: 24,
          percentileRank: 67,
          keyMetrics: {
            foundationReadiness: 78,
            measurementSophistication: 65,
            stakeholderEngagement: 82
          }
        }
      ],
      trends: {
        rankingTrend: 'improving',
        rankingChange: 3,
        percentileGain: 8,
        topImprovementArea: 'foundation_readiness',
        consistentStrength: 'stakeholder_engagement'
      },
      milestones: [
        {
          date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          achievement: 'Moved to above-average tier',
          impact: 'Significant improvement in peer standing'
        }
      ]
    };

    const transformedHistory = transformToCamelCase(history);

    return res.status(200).json({
      success: true,
      message: 'Benchmark history retrieved successfully',
      data: {
        history: transformedHistory
      }
    });

  } catch (error: any) {
    console.error('Error getting benchmark history:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve benchmark history'
    });
  }
};