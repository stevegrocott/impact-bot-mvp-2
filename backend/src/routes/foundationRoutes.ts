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

    const foundationStatus = await getFoundationStatus(organizationId);
    
    // Get additional context
    const recentActivity = await prisma.conversation.findMany({
      where: { 
        organizationId,
        conversationType: { in: ['theory_of_change_guided', 'decision_mapping_guided'] }
      },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        conversationType: true,
        completionPercentage: true,
        updatedAt: true
      }
    });

    const statusWithContext = {
      ...foundationStatus,
      recentActivity,
      recommendations: generateFoundationRecommendations(foundationStatus),
      progressSummary: generateProgressSummary(foundationStatus)
    };

    res.json({
      success: true,
      data: statusWithContext,
      message: `Foundation status: ${getFoundationLevelDescription(foundationStatus)}`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/foundation/access-check/:feature
 * Check if user can access specific feature
 */
router.get('/access-check/:feature', async (req, res, next) => {
  try {
    const { feature } = req.params;
    const { organizationId } = req.user!;

    const foundationStatus = await getFoundationStatus(organizationId);
    
    // Define feature requirements
    const featureRequirements = {
      'basic-indicators': 'basic',
      'advanced-indicators': 'intermediate', 
      'custom-indicators': 'advanced',
      'portfolio-analysis': 'intermediate',
      'measurement-planning': 'advanced',
      'admin-analytics': 'advanced',
      'bulk-operations': 'intermediate'
    };

    const requiredLevel = featureRequirements[feature];
    if (!requiredLevel) {
      throw new AppError(`Unknown feature: ${feature}`, 400);
    }

    const hasAccess = checkFeatureAccess(foundationStatus, requiredLevel);
    
    res.json({
      success: true,
      data: {
        feature,
        hasAccess,
        requiredLevel,
        currentLevel: getCurrentFoundationLevel(foundationStatus),
        blockingReasons: hasAccess ? [] : foundationStatus.blockingReasons,
        nextSteps: hasAccess ? [] : generateNextStepsForFeature(foundationStatus, feature)
      },
      message: hasAccess ? `Access granted to ${feature}` : `Access blocked for ${feature}`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/foundation/start-guided-setup
 * Start comprehensive guided foundation setup
 */
router.post('/start-guided-setup',
  validateRequestBody({
    type: 'object',
    properties: {
      startWith: { 
        type: 'string', 
        enum: ['theory-of-change', 'decision-mapping', 'comprehensive']
      },
      hasExistingDocuments: { type: 'boolean' },
      organizationContext: {
        type: 'object',
        properties: {
          sector: { type: 'string' },
          interventionType: { type: 'string' },
          organizationSize: { type: 'string' }
        }
      }
    },
    required: ['startWith']
  }),
  async (req, res, next) => {
    try {
      const { organizationId, userId } = req.user!;
      const { startWith, hasExistingDocuments, organizationContext } = req.body;

      logger.info(`Starting guided foundation setup: ${startWith}`, {
        organizationId,
        hasExistingDocuments,
        organizationContext
      });

      let setupSession;

      switch (startWith) {
        case 'theory-of-change':
          // Use existing theory of change service
          const pathway = await theoryOfChangeService.assessPathway(
            organizationId,
            hasExistingDocuments || false,
            false
          );
          setupSession = {
            type: 'theory-of-change',
            pathway,
            nextStep: 'Start theory of change development'
          };
          break;

        case 'decision-mapping':
          // Check if theory of change exists first
          const theory = await theoryOfChangeService.getTheoryOfChange(organizationId);
          if (!theory) {
            throw new AppError('Theory of change required before decision mapping', 400);
          }
          
          setupSession = {
            type: 'decision-mapping',
            prerequisitesMet: true,
            nextStep: 'Start decision mapping process'
          };
          break;

        case 'comprehensive':
          // Create comprehensive setup workflow
          const foundationStatus = await getFoundationStatus(organizationId);
          setupSession = await createComprehensiveSetup(foundationStatus, organizationContext);
          break;

        default:
          throw new AppError(`Invalid setup type: ${startWith}`, 400);
      }

      res.json({
        success: true,
        data: setupSession,
        message: `Guided foundation setup started: ${startWith}`
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/foundation/progress
 * Get detailed foundation progress metrics
 */
router.get('/progress', async (req, res, next) => {
  try {
    const { organizationId } = req.user!;

    const foundationStatus = await getFoundationStatus(organizationId);
    
    // Calculate detailed progress metrics
    const progress = {
      overall: calculateOverallProgress(foundationStatus),
      theoryOfChange: {
        completed: foundationStatus.hasTheoryOfChange,
        completeness: foundationStatus.foundationReadiness?.completenessScore || 0,
        readinessLevel: foundationStatus.foundationReadiness?.readinessLevel || 'insufficient',
        missingElements: foundationStatus.foundationReadiness?.missingElements || []
      },
      decisionMapping: {
        started: foundationStatus.hasDecisionMapping,
        decisionCount: foundationStatus.decisionCount,
        targetCount: 3, // Minimum for advanced access
        completionPercentage: Math.min(100, (foundationStatus.decisionCount / 3) * 100)
      },
      accessLevels: {
        basic: foundationStatus.allowsBasicAccess,
        intermediate: foundationStatus.allowsIntermediateAccess,
        advanced: foundationStatus.allowsAdvancedAccess
      },
      nextMilestones: generateNextMilestones(foundationStatus)
    };

    res.json({
      success: true,
      data: progress,
      message: `Foundation progress: ${progress.overall}% complete`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/foundation/bypass-request
 * Request temporary bypass of foundation requirements (with justification)
 */
router.post('/bypass-request',
  validateRequestBody({
    type: 'object',
    properties: {
      feature: { type: 'string' },
      justification: { type: 'string', minLength: 10 },
      urgency: { type: 'string', enum: ['low', 'medium', 'high'] },
      temporaryUse: { type: 'boolean' }
    },
    required: ['feature', 'justification']
  }),
  async (req, res, next) => {
    try {
      const { organizationId, userId } = req.user!;
      const { feature, justification, urgency = 'medium', temporaryUse = true } = req.body;

      // Log bypass request for admin review
      logger.warn('Foundation bypass requested', {
        organizationId,
        userId,
        feature,
        justification,
        urgency,
        temporaryUse
      });

      // Store bypass request for tracking
      await prisma.foundationBypassRequest.create({
        data: {
          organizationId,
          requestedBy: userId,
          feature,
          justification,
          urgency,
          temporaryUse,
          status: 'pending'
        }
      });

      // For now, auto-approve low urgency temporary requests
      const autoApprove = urgency === 'low' && temporaryUse;
      
      res.json({
        success: true,
        data: {
          requestId: 'pending-review',
          autoApproved: autoApprove,
          status: autoApprove ? 'approved' : 'pending',
          message: autoApprove 
            ? 'Temporary bypass granted for low-risk feature'
            : 'Bypass request submitted for admin review'
        },
        message: autoApprove 
          ? 'Bypass approved - remember to complete foundation setup'
          : 'Bypass request submitted for review'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/foundation/recommendations
 * Get personalized foundation improvement recommendations
 */
router.get('/recommendations', async (req, res, next) => {
  try {
    const { organizationId } = req.user!;

    const foundationStatus = await getFoundationStatus(organizationId);
    
    const recommendations = {
      priority: generatePriorityRecommendations(foundationStatus),
      quickWins: generateQuickWinRecommendations(foundationStatus),
      longTerm: generateLongTermRecommendations(foundationStatus),
      estimatedTimeToCompletion: estimateCompletionTime(foundationStatus)
    };

    res.json({
      success: true,
      data: recommendations,
      message: `${recommendations.priority.length} priority recommendations available`
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions

function checkFeatureAccess(status: any, requiredLevel: string): boolean {
  switch (requiredLevel) {
    case 'basic': return status.allowsBasicAccess;
    case 'intermediate': return status.allowsIntermediateAccess;
    case 'advanced': return status.allowsAdvancedAccess;
    default: return false;
  }
}

function getCurrentFoundationLevel(status: any): string {
  if (status.allowsAdvancedAccess) return 'advanced';
  if (status.allowsIntermediateAccess) return 'intermediate';
  if (status.allowsBasicAccess) return 'basic';
  return 'insufficient';
}

function getFoundationLevelDescription(status: any): string {
  const level = getCurrentFoundationLevel(status);
  const descriptions = {
    insufficient: 'Foundation setup required',
    basic: 'Basic foundation ready',
    intermediate: 'Good foundation with decision mapping',
    advanced: 'Comprehensive foundation complete'
  };
  return descriptions[level] || 'Unknown';
}

function generateFoundationRecommendations(status: any): string[] {
  const recommendations = [];
  
  if (!status.hasTheoryOfChange) {
    recommendations.push('Complete theory of change (highest priority)');
  } else if (status.foundationReadiness?.readinessLevel === 'basic') {
    recommendations.push('Strengthen theory of change elements');
  }
  
  if (!status.hasDecisionMapping) {
    recommendations.push('Start decision mapping process');
  } else if (status.decisionCount < 3) {
    recommendations.push('Map additional key decisions');
  }
  
  return recommendations;
}

function generateProgressSummary(status: any): string {
  const progress = calculateOverallProgress(status);
  if (progress >= 90) return 'Excellent foundation - ready for advanced features';
  if (progress >= 70) return 'Strong foundation - ready for most features';
  if (progress >= 40) return 'Good progress - complete decision mapping for full access';
  return 'Foundation setup needed - start with theory of change';
}

function calculateOverallProgress(status: any): number {
  let progress = 0;
  
  // Theory of change contribution (60% of total)
  if (status.hasTheoryOfChange) {
    progress += 30;
    if (status.foundationReadiness?.completenessScore) {
      progress += (status.foundationReadiness.completenessScore / 100) * 30;
    }
  }
  
  // Decision mapping contribution (40% of total)
  if (status.hasDecisionMapping) {
    progress += 20;
    progress += Math.min(20, (status.decisionCount / 3) * 20);
  }
  
  return Math.round(progress);
}

function generateNextStepsForFeature(status: any, feature: string): string[] {
  const steps = [];
  
  if (!status.allowsBasicAccess) {
    steps.push('Complete theory of change foundation');
  }
  
  if (feature.includes('advanced') || feature.includes('planning')) {
    if (!status.allowsIntermediateAccess) {
      steps.push('Complete decision mapping (minimum 1 decision)');
    }
    if (!status.allowsAdvancedAccess) {
      steps.push('Map at least 3 key decisions for advanced access');
    }
  }
  
  return steps;
}

async function createComprehensiveSetup(status: any, context: any): Promise<any> {
  const phases = [];
  
  if (!status.hasTheoryOfChange) {
    phases.push({
      phase: 1,
      title: 'Theory of Change Development',
      estimatedTime: '15-20 minutes',
      description: 'Establish your impact framework'
    });
  }
  
  if (!status.hasDecisionMapping) {
    phases.push({
      phase: status.hasTheoryOfChange ? 1 : 2,
      title: 'Decision Mapping',
      estimatedTime: '10-15 minutes',
      description: 'Map key decisions that need data'
    });
  }
  
  return {
    type: 'comprehensive',
    phases,
    estimatedTotalTime: phases.length * 15,
    context,
    nextStep: phases[0]?.title || 'Foundation setup complete'
  };
}

function generateNextMilestones(status: any): string[] {
  const milestones = [];
  
  if (!status.allowsBasicAccess) {
    milestones.push('Unlock basic indicator access');
  }
  if (!status.allowsIntermediateAccess) {
    milestones.push('Unlock portfolio analysis features');
  }
  if (!status.allowsAdvancedAccess) {
    milestones.push('Unlock advanced measurement planning');
  }
  
  return milestones;
}

function generatePriorityRecommendations(status: any): string[] {
  const priority = [];
  
  if (!status.hasTheoryOfChange) {
    priority.push('Complete theory of change (blocks all access)');
  }
  
  if (status.foundationReadiness?.readinessLevel === 'insufficient') {
    priority.push('Fill missing theory of change elements');
  }
  
  return priority;
}

function generateQuickWinRecommendations(status: any): string[] {
  return [
    'Review and update organization context',
    'Add stakeholder information to decisions',
    'Clarify evidence requirements for key decisions'
  ];
}

function generateLongTermRecommendations(status: any): string[] {
  return [
    'Build measurement capacity within team',
    'Establish regular foundation review schedule',
    'Develop custom indicators for unique context'
  ];
}

function estimateCompletionTime(status: any): string {
  if (status.allowsAdvancedAccess) return 'Foundation complete';
  
  let minutes = 0;
  if (!status.hasTheoryOfChange) minutes += 20;
  if (!status.hasDecisionMapping) minutes += 15;
  if (status.decisionCount < 3) minutes += (3 - status.decisionCount) * 5;
  
  return `${minutes} minutes estimated`;
}

export { router as foundationRoutes };