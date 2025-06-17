/**
 * Phase Gate Middleware
 * Enforces foundation-first approach by preventing access to advanced features 
 * without proper theory of change and decision mapping completion
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { theoryOfChangeService } from '@/services/theoryOfChangeService';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

export interface PhaseGateConfig {
  requiredFoundationLevel: 'basic' | 'intermediate' | 'advanced';
  allowBypass?: boolean;
  blockMessage?: string;
}

export interface FoundationStatus {
  hasTheoryOfChange: boolean;
  foundationReadiness: any;
  hasDecisionMapping: boolean;
  decisionCount: number;
  allowsBasicAccess: boolean;
  allowsIntermediateAccess: boolean;
  allowsAdvancedAccess: boolean;
  blockingReasons: string[];
}

/**
 * Create phase gate middleware with specific requirements
 */
export function createPhaseGate(config: PhaseGateConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { organizationId } = req.user;
      
      // Check foundation status
      const foundationStatus = await checkFoundationStatus(organizationId);
      
      // Determine if access should be granted
      const accessGranted = shouldGrantAccess(foundationStatus, config.requiredFoundationLevel);
      
      if (!accessGranted && !config.allowBypass) {
        // Log phase gate block for analytics
        logger.info('Phase gate blocked access', {
          organizationId,
          requiredLevel: config.requiredFoundationLevel,
          foundationStatus,
          endpoint: req.path,
          method: req.method
        });

        const blockMessage = config.blockMessage || generateBlockMessage(
          config.requiredFoundationLevel,
          foundationStatus
        );

        return res.status(403).json({
          success: false,
          error: 'Foundation requirements not met',
          message: blockMessage,
          foundationStatus,
          nextSteps: generateNextSteps(foundationStatus),
          requiredLevel: config.requiredFoundationLevel
        });
      }

      // Access granted - attach foundation status to request for use in handlers
      req.foundationStatus = foundationStatus;
      
      // Log successful phase gate passage for analytics
      if (foundationStatus.allowsAdvancedAccess) {
        logger.info('Phase gate: Advanced access granted', {
          organizationId,
          endpoint: req.path
        });
      }
      
      next();
    } catch (error) {
      logger.error('Phase gate middleware error:', error);
      next(error);
    }
  };
}

/**
 * Specific phase gate configurations for common use cases
 */
export const phaseGates = {
  
  /**
   * Require basic foundation (theory of change completed)
   */
  requireBasicFoundation: createPhaseGate({
    requiredFoundationLevel: 'basic',
    blockMessage: 'Please complete your theory of change before accessing indicators'
  }),

  /**
   * Require intermediate foundation (theory + some decision mapping)
   */
  requireIntermediateFoundation: createPhaseGate({
    requiredFoundationLevel: 'intermediate',
    blockMessage: 'Please complete decision mapping before accessing advanced measurement features'
  }),

  /**
   * Require advanced foundation (comprehensive theory + decision mapping)
   */
  requireAdvancedFoundation: createPhaseGate({
    requiredFoundationLevel: 'advanced',
    blockMessage: 'Advanced features require comprehensive foundation and decision mapping'
  }),

  /**
   * Soft gate - warn but allow access (for analytics tracking)
   */
  warnFoundationIncomplete: createPhaseGate({
    requiredFoundationLevel: 'basic',
    allowBypass: true
  }),

  /**
   * Admin gate - require advanced foundation for admin features
   */
  requireAdminFoundation: createPhaseGate({
    requiredFoundationLevel: 'advanced',
    blockMessage: 'Administrative features require complete foundation setup'
  })
};

/**
 * Check comprehensive foundation status for organization
 */
async function checkFoundationStatus(organizationId: string): Promise<FoundationStatus> {
  try {
    // Check theory of change completion
    const theory = await theoryOfChangeService.getTheoryOfChange(organizationId);
    const hasTheoryOfChange = !!theory;
    
    let foundationReadiness = null;
    if (hasTheoryOfChange) {
      foundationReadiness = await theoryOfChangeService.assessFoundationReadiness(organizationId);
    }
    
    // Check decision mapping completion
    const decisionCount = await prisma.decisionQuestion.count({
      where: { 
        organizationId,
        status: 'active'
      }
    });
    const hasDecisionMapping = decisionCount > 0;

    // Determine access levels
    const allowsBasicAccess = foundationReadiness?.allowsBasicAccess || false;
    const allowsIntermediateAccess = foundationReadiness?.allowsIntermediateAccess && hasDecisionMapping;
    const allowsAdvancedAccess = foundationReadiness?.allowsAdvancedAccess && decisionCount >= 3;

    // Generate blocking reasons
    const blockingReasons = [];
    if (!hasTheoryOfChange) {
      blockingReasons.push('Theory of change not completed');
    } else if (foundationReadiness?.readinessLevel === 'insufficient') {
      blockingReasons.push('Theory of change needs completion');
    }
    
    if (!hasDecisionMapping) {
      blockingReasons.push('Decision mapping not started');
    } else if (decisionCount < 3) {
      blockingReasons.push('Need at least 3 mapped decisions for advanced access');
    }

    return {
      hasTheoryOfChange,
      foundationReadiness,
      hasDecisionMapping,
      decisionCount,
      allowsBasicAccess,
      allowsIntermediateAccess,
      allowsAdvancedAccess,
      blockingReasons
    };

  } catch (error) {
    logger.error('Error checking foundation status:', error);
    
    // Fail closed - no access if we can't determine status
    return {
      hasTheoryOfChange: false,
      foundationReadiness: null,
      hasDecisionMapping: false,
      decisionCount: 0,
      allowsBasicAccess: false,
      allowsIntermediateAccess: false,
      allowsAdvancedAccess: false,
      blockingReasons: ['Unable to verify foundation status']
    };
  }
}

/**
 * Determine if access should be granted based on requirements
 */
function shouldGrantAccess(
  status: FoundationStatus,
  requiredLevel: 'basic' | 'intermediate' | 'advanced'
): boolean {
  switch (requiredLevel) {
    case 'basic':
      return status.allowsBasicAccess;
    case 'intermediate':
      return status.allowsIntermediateAccess;
    case 'advanced':
      return status.allowsAdvancedAccess;
    default:
      return false;
  }
}

/**
 * Generate helpful block message based on requirements and current status
 */
function generateBlockMessage(
  requiredLevel: string,
  status: FoundationStatus
): string {
  const messages = {
    basic: "🏗️ **Foundation Required**\n\nBefore exploring indicators, let's establish your measurement foundation. This prevents the #1 pitfall: jumping to metrics without context.",
    
    intermediate: "📋 **Decision Mapping Required**\n\nTo access advanced measurement features, please complete decision mapping. This ensures every indicator serves a specific decision need.",
    
    advanced: "🎯 **Comprehensive Foundation Required**\n\nAdvanced features require both complete theory of change and comprehensive decision mapping to prevent measurement pitfalls."
  };

  let baseMessage = messages[requiredLevel] || messages.basic;
  
  if (status.blockingReasons.length > 0) {
    baseMessage += `\n\n**Missing Requirements:**\n${status.blockingReasons.map(r => `• ${r}`).join('\n')}`;
  }

  return baseMessage;
}

/**
 * Generate actionable next steps based on foundation status
 */
function generateNextSteps(status: FoundationStatus): string[] {
  const steps = [];
  
  if (!status.hasTheoryOfChange) {
    steps.push('Complete your theory of change (15-20 minutes guided process)');
  } else if (status.foundationReadiness?.readinessLevel === 'insufficient') {
    steps.push('Strengthen your theory of change by filling in missing elements');
  }
  
  if (!status.hasDecisionMapping) {
    steps.push('Start decision mapping to identify what decisions your data will inform');
  } else if (status.decisionCount < 3) {
    steps.push(`Map ${3 - status.decisionCount} more key decisions for advanced access`);
  }
  
  if (steps.length === 0) {
    steps.push('Foundation looks good! Access should be granted.');
  }
  
  return steps;
}

/**
 * Express middleware to add foundation status to all requests
 */
export async function attachFoundationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.organizationId) {
      req.foundationStatus = await checkFoundationStatus(req.user.organizationId);
    }
    next();
  } catch (error) {
    // Don't block requests if foundation status check fails
    logger.error('Error attaching foundation status:', error);
    next();
  }
}

/**
 * Utility function to check foundation status programmatically
 */
export async function getFoundationStatus(organizationId: string): Promise<FoundationStatus> {
  return await checkFoundationStatus(organizationId);
}

// Extend Express Request type to include foundation status
declare global {
  namespace Express {
    interface Request {
      foundationStatus?: FoundationStatus;
    }
  }
}