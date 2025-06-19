import { Request, Response } from 'express';
import { z } from 'zod';
import { getUserContext } from '../utils/routeHelpers';
import advancedPitfallPreventionService from '../services/advancedPitfallPreventionService';
import { transformToCamelCase } from '../utils/caseTransform';

// Validation schemas
const getSectorWarningsSchema = z.object({
  sector: z.string().min(1, 'Sector is required'),
  currentIndicators: z.array(z.string()).optional(),
  programType: z.string().optional(),
  stakeholderTypes: z.array(z.string()).optional(),
  developmentPhase: z.string().optional()
});

const threeLensValidationSchema = z.object({
  indicators: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    category: z.string()
  })),
  methodology: z.string().min(1, 'Methodology is required'),
  dataCollection: z.object({
    methods: z.array(z.string()),
    frequency: z.string(),
    sources: z.array(z.string())
  }),
  stakeholders: z.array(z.string())
});

const interventionRecommendationsSchema = z.object({
  indicatorChoices: z.array(z.string()),
  measurementApproaches: z.array(z.string()),
  pitfallHistory: z.array(z.string())
});

/**
 * Get sector-specific warnings
 */
export const getSectorSpecificWarnings = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    // Build context object with proper typing
    const contextData: Record<string, any> = {};
    if (req.query.sector) contextData.sector = String(req.query.sector);
    if (req.query.currentIndicators) {
      contextData.currentIndicators = Array.isArray(req.query.currentIndicators) 
        ? req.query.currentIndicators.map(String) 
        : [String(req.query.currentIndicators)];
    }
    if (req.query.programType) contextData.programType = String(req.query.programType);
    if (req.query.stakeholderTypes) {
      contextData.stakeholderTypes = Array.isArray(req.query.stakeholderTypes) 
        ? req.query.stakeholderTypes.map(String) 
        : [String(req.query.stakeholderTypes)];
    }
    if (req.query.developmentPhase) contextData.developmentPhase = String(req.query.developmentPhase);

    const validatedContext = getSectorWarningsSchema.parse(contextData);

    // Build context object with only defined values
    const contextOptions: Record<string, any> = {};
    if (validatedContext.currentIndicators) contextOptions.currentIndicators = validatedContext.currentIndicators;
    if (validatedContext.programType) contextOptions.programType = validatedContext.programType;
    if (validatedContext.stakeholderTypes) contextOptions.stakeholderTypes = validatedContext.stakeholderTypes;
    if (validatedContext.developmentPhase) contextOptions.developmentPhase = validatedContext.developmentPhase;

    const warnings = await advancedPitfallPreventionService.getSectorSpecificWarnings(
      userContext.organizationId,
      validatedContext.sector,
      Object.keys(contextOptions).length > 0 ? contextOptions : undefined
    );

    const transformedWarnings = transformToCamelCase(warnings);

    return res.status(200).json({
      success: true,
      message: 'Sector-specific warnings retrieved successfully',
      data: {
        warnings: transformedWarnings,
        totalCount: warnings.length,
        sector: validatedContext.sector,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error getting sector-specific warnings:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve sector-specific warnings'
    });
  }
};

/**
 * Perform three-lens validation
 */
export const performThreeLensValidation = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    const validatedBody = threeLensValidationSchema.parse(req.body);

    const validation = await advancedPitfallPreventionService.performThreeLensValidation(
      userContext.organizationId,
      validatedBody
    );

    const transformedValidation = transformToCamelCase(validation);

    return res.status(200).json({
      success: true,
      message: 'Three-lens validation completed successfully',
      data: {
        validation: transformedValidation,
        validatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error performing three-lens validation:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid measurement plan data',
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to perform three-lens validation'
    });
  }
};

/**
 * Assess pitfall risk for organization
 */
export const assessPitfallRisk = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    const riskAssessment = await advancedPitfallPreventionService.assessPitfallRisk(
      userContext.organizationId
    );

    const transformedAssessment = transformToCamelCase(riskAssessment);

    return res.status(200).json({
      success: true,
      message: 'Pitfall risk assessment completed successfully',
      data: {
        riskAssessment: transformedAssessment
      }
    });

  } catch (error: any) {
    console.error('Error assessing pitfall risk:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to assess pitfall risk'
    });
  }
};

/**
 * Get smart warning system
 */
export const getSmartWarningSystem = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    const warningSystem = await advancedPitfallPreventionService.getSmartWarningSystem(
      userContext.organizationId
    );

    const transformedSystem = transformToCamelCase(warningSystem);

    return res.status(200).json({
      success: true,
      message: 'Smart warning system retrieved successfully',
      data: {
        warningSystem: transformedSystem,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error getting smart warning system:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve smart warning system'
    });
  }
};

/**
 * Get intervention recommendations
 */
export const getInterventionRecommendations = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    const validatedBody = interventionRecommendationsSchema.parse(req.body);

    const recommendations = await advancedPitfallPreventionService.getInterventionRecommendations(
      userContext.organizationId,
      validatedBody
    );

    const transformedRecommendations = transformToCamelCase(recommendations);

    return res.status(200).json({
      success: true,
      message: 'Intervention recommendations generated successfully',
      data: {
        recommendations: transformedRecommendations,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error getting intervention recommendations:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user behavior data',
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to generate intervention recommendations'
    });
  }
};

/**
 * Get warning by ID
 */
export const getWarningById = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    const { warningId } = req.params;
    if (!warningId) {
      return res.status(400).json({
        success: false,
        error: 'Warning ID is required'
      });
    }

    // In production, this would fetch specific warning details from database
    // For now, return mock detailed warning data
    const warningDetails = {
      id: warningId,
      title: 'Detailed Warning Information',
      description: 'Comprehensive warning details with sector-specific guidance',
      severity: 'high',
      sector: 'education',
      guidance: {
        overview: 'Detailed guidance for addressing this specific pitfall',
        steps: [
          'Immediate action required',
          'Medium-term improvements',
          'Long-term strategy adjustments'
        ],
        resources: [
          'Implementation toolkit',
          'Best practice examples',
          'Expert consultation options'
        ]
      },
      lastUpdated: new Date().toISOString()
    };

    const transformedDetails = transformToCamelCase(warningDetails);

    return res.status(200).json({
      success: true,
      message: 'Warning details retrieved successfully',
      data: {
        warning: transformedDetails
      }
    });

  } catch (error: any) {
    console.error('Error getting warning details:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve warning details'
    });
  }
};

/**
 * Dismiss a warning
 */
export const dismissWarning = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { warningId } = req.params;
    if (!warningId) {
      return res.status(400).json({
        success: false,
        error: 'Warning ID is required'
      });
    }

    const { reason, feedback } = req.body;

    // In production, this would update the warning status in database
    console.log('Dismissing warning:', { warningId, userId: userContext.userId, reason, feedback });

    return res.status(200).json({
      success: true,
      message: 'Warning dismissed successfully',
      data: {
        warningId,
        dismissedAt: new Date().toISOString(),
        learningCaptured: !!feedback
      }
    });

  } catch (error: any) {
    console.error('Error dismissing warning:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to dismiss warning'
    });
  }
};

/**
 * Get pitfall prevention analytics
 */
export const getPitfallPreventionAnalytics = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    // Mock analytics data - would calculate from actual usage in production
    const analytics = {
      preventionEffectiveness: {
        warningsShown: 45,
        warningsHeeded: 34,
        pitfallsAvoided: 28,
        effectivenessRate: 76
      },
      riskReduction: {
        currentRiskScore: 35,
        initialRiskScore: 65,
        riskReduction: 46,
        improvementAreas: [
          'Outcome indicator selection',
          'Stakeholder engagement measurement',
          'Attribution vs contribution understanding'
        ]
      },
      behaviorChange: {
        indicatorSelectionImprovement: 68,
        measurementQualityImprovement: 52,
        pitfallAwarenessIncrease: 78
      },
      sectorBenchmarks: {
        sector: 'education',
        organizationPerformance: 72,
        sectorAverage: 58,
        topQuartile: 85
      }
    };

    const transformedAnalytics = transformToCamelCase(analytics);

    return res.status(200).json({
      success: true,
      message: 'Pitfall prevention analytics retrieved successfully',
      data: {
        analytics: transformedAnalytics,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error getting pitfall prevention analytics:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve pitfall prevention analytics'
    });
  }
};