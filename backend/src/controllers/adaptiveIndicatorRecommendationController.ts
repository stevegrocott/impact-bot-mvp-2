import { Request, Response } from 'express';
import { z } from 'zod';
import { getUserContext } from '../utils/routeHelpers';
import adaptiveIndicatorRecommendationService from '../services/adaptiveIndicatorRecommendationService';
import { transformToCamelCase } from '../utils/caseTransform';

// Validation schemas
const getRecommendationsSchema = z.object({
  phase: z.string().optional(),
  focus: z.array(z.string()).optional(),
  timeframe: z.string().optional(),
  constraints: z.array(z.string()).optional()
});

const acceptRecommendationSchema = z.object({
  implementationNotes: z.string().optional()
});

const rejectRecommendationSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
  feedback: z.string().optional()
});

const trackProgressSchema = z.object({
  stepCompleted: z.number().optional(),
  statusUpdate: z.string().optional(),
  challenges: z.array(z.string()).optional(),
  earlyResults: z.any().optional()
});

/**
 * Generate adaptive indicator recommendations
 */
export const generateRecommendations = async (req: Request, res: Response) => {
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
    if (req.query.phase) contextData.phase = String(req.query.phase);
    if (req.query.focus) {
      contextData.focus = Array.isArray(req.query.focus) 
        ? req.query.focus.map(String) 
        : [String(req.query.focus)];
    }
    if (req.query.timeframe) contextData.timeframe = String(req.query.timeframe);
    if (req.query.constraints) {
      contextData.constraints = Array.isArray(req.query.constraints) 
        ? req.query.constraints.map(String) 
        : [String(req.query.constraints)];
    }

    // Validate the context
    const context = getRecommendationsSchema.parse(contextData);

    const recommendations = await adaptiveIndicatorRecommendationService.generateRecommendations(
      userContext.organizationId,
      Object.keys(context).length > 0 ? context : undefined
    );

    const transformedRecommendations = transformToCamelCase(recommendations);

    return res.status(200).json({
      success: true,
      message: 'Adaptive recommendations generated successfully',
      data: {
        recommendations: transformedRecommendations,
        totalCount: recommendations.length,
        context,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error generating adaptive recommendations:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to generate adaptive recommendations'
    });
  }
};

/**
 * Get organizational learning profile
 */
export const getLearningProfile = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    const profile = await adaptiveIndicatorRecommendationService.getOrganizationalLearningProfile(
      userContext.organizationId
    );

    const transformedProfile = transformToCamelCase(profile);

    return res.status(200).json({
      success: true,
      message: 'Learning profile retrieved successfully',
      data: {
        profile: transformedProfile
      }
    });

  } catch (error: any) {
    console.error('Error getting learning profile:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve learning profile'
    });
  }
};

/**
 * Get recommendation details
 */
export const getRecommendationDetails = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    const { recommendationId } = req.params;
    if (!recommendationId) {
      return res.status(400).json({
        success: false,
        error: 'Recommendation ID is required'
      });
    }

    const recommendation = await adaptiveIndicatorRecommendationService.getRecommendationDetails(
      recommendationId
    );

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: 'Recommendation not found'
      });
    }

    const transformedRecommendation = transformToCamelCase(recommendation);

    return res.status(200).json({
      success: true,
      message: 'Recommendation details retrieved successfully',
      data: {
        recommendation: transformedRecommendation
      }
    });

  } catch (error: any) {
    console.error('Error getting recommendation details:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve recommendation details'
    });
  }
};

/**
 * Accept a recommendation
 */
export const acceptRecommendation = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { recommendationId } = req.params;
    if (!recommendationId) {
      return res.status(400).json({
        success: false,
        error: 'Recommendation ID is required'
      });
    }

    const validatedBody = acceptRecommendationSchema.parse(req.body);

    const result = await adaptiveIndicatorRecommendationService.acceptRecommendation(
      recommendationId,
      userContext.userId,
      validatedBody.implementationNotes
    );

    const transformedResult = transformToCamelCase(result);

    return res.status(200).json({
      success: true,
      message: 'Recommendation accepted successfully',
      data: transformedResult
    });

  } catch (error: any) {
    console.error('Error accepting recommendation:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to accept recommendation'
    });
  }
};

/**
 * Reject a recommendation
 */
export const rejectRecommendation = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { recommendationId } = req.params;
    if (!recommendationId) {
      return res.status(400).json({
        success: false,
        error: 'Recommendation ID is required'
      });
    }

    const validatedBody = rejectRecommendationSchema.parse(req.body);

    const result = await adaptiveIndicatorRecommendationService.rejectRecommendation(
      recommendationId,
      userContext.userId,
      validatedBody.reason,
      validatedBody.feedback
    );

    const transformedResult = transformToCamelCase(result);

    return res.status(200).json({
      success: true,
      message: 'Recommendation rejected successfully',
      data: transformedResult
    });

  } catch (error: any) {
    console.error('Error rejecting recommendation:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to reject recommendation'
    });
  }
};

/**
 * Track implementation progress
 */
export const trackImplementationProgress = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { trackingId } = req.params;
    if (!trackingId) {
      return res.status(400).json({
        success: false,
        error: 'Tracking ID is required'
      });
    }

    // Build progress data with proper typing
    const progressData: Record<string, any> = {};
    if (req.body.stepCompleted !== undefined) progressData.stepCompleted = Number(req.body.stepCompleted);
    if (req.body.statusUpdate) progressData.statusUpdate = String(req.body.statusUpdate);
    if (req.body.challenges) {
      progressData.challenges = Array.isArray(req.body.challenges) 
        ? req.body.challenges.map(String) 
        : [String(req.body.challenges)];
    }
    if (req.body.earlyResults !== undefined) progressData.earlyResults = req.body.earlyResults;

    const validatedBody = trackProgressSchema.parse(progressData);

    const result = await adaptiveIndicatorRecommendationService.trackImplementationProgress(
      trackingId,
      validatedBody
    );

    const transformedResult = transformToCamelCase(result);

    return res.status(200).json({
      success: true,
      message: 'Implementation progress tracked successfully',
      data: transformedResult
    });

  } catch (error: any) {
    console.error('Error tracking implementation progress:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to track implementation progress'
    });
  }
};

/**
 * Get recommendation analytics
 */
export const getRecommendationAnalytics = async (req: Request, res: Response) => {
  try {
    const userContext = getUserContext(req);
    if (!userContext?.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization context required'
      });
    }

    const analytics = await adaptiveIndicatorRecommendationService.getRecommendationAnalytics(
      userContext.organizationId
    );

    const transformedAnalytics = transformToCamelCase(analytics);

    return res.status(200).json({
      success: true,
      message: 'Recommendation analytics retrieved successfully',
      data: {
        analytics: transformedAnalytics,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error getting recommendation analytics:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve recommendation analytics'
    });
  }
};