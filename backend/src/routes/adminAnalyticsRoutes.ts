/**
 * Admin Analytics API Routes
 * Comprehensive behavior analytics for learning and optimization
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types';
import { requireAuth } from '@/middleware/requireAuth';
import { validateRequestBody } from '@/middleware/validateRequestBody';
import { userBehaviorAnalyticsService } from '@/services/userBehaviorAnalyticsService';
import { prisma } from '@/config/database';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { ensureAuthenticated } from '@/utils/routeHelpers';

const router = Router();

// All admin analytics routes require authentication and admin role
router.use(requireAuth);

// Admin role check middleware
router.use((req: Request, res: Response, next) => {
  const user = ensureAuthenticated(req);
  const userRole = user.currentOrganization?.role.name;
  
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    throw new AppError('Admin access required', 403, 'INSUFFICIENT_PERMISSIONS');
  }
  next();
});

/**
 * GET /api/v1/admin/analytics/overview
 * Get high-level analytics overview
 */
router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { timeRange = 'month' } = req.query;

    // Get key metrics in parallel
    const [
      totalUsers,
      activeOrganizations,
      foundationAnalytics,
      pitfallAnalytics,
      recentInsights
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.organization.count({ where: { isActive: true } }),
      userBehaviorAnalyticsService.getFoundationPathwayAnalytics(timeRange as any),
      userBehaviorAnalyticsService.getPitfallPreventionEffectiveness(timeRange as any),
      userBehaviorAnalyticsService.generateBehaviorInsights(undefined, timeRange as any)
    ]);

    const overview = {
      summary: {
        totalUsers,
        activeOrganizations,
        foundationCompletionRate: foundationAnalytics.completionRates.overall,
        pitfallEffectivenessScore: pitfallAnalytics.effectivenessScore
      },
      foundationPathways: foundationAnalytics,
      pitfallPrevention: pitfallAnalytics,
      topInsights: recentInsights.slice(0, 5),
      generatedAt: new Date()
    };

    res.json({
      success: true,
      data: overview,
      message: `Analytics overview for ${timeRange}`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/analytics/foundation-pathways
 * Detailed foundation pathway analytics
 */
router.get('/foundation-pathways', async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { timeRange = 'month', organizationId } = req.query;

    const analytics = await userBehaviorAnalyticsService.getFoundationPathwayAnalytics(timeRange as any);
    
    // Get additional pathway details
    const pathwayDetails = await prisma.userBehaviorEvent.groupBy({
      by: ['eventData'],
      where: {
        eventType: 'foundation_pathway_selected',
        ...(organizationId && { organizationId: organizationId as string }),
        timestamp: getTimeFilter(timeRange as string)
      },
      _count: true
    });

    res.json({
      success: true,
      data: {
        ...analytics,
        pathwayDetails,
        optimizationScore: calculateOptimizationScore(analytics)
      },
      message: 'Foundation pathway analytics retrieved'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/analytics/pitfall-effectiveness
 * Pitfall prevention effectiveness metrics
 */
router.get('/pitfall-effectiveness', async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { timeRange = 'month', warningType } = req.query;

    const effectiveness = await userBehaviorAnalyticsService.getPitfallPreventionEffectiveness(timeRange as any);
    
    // Get warning trend data
    const warningTrends = await prisma.pitfallWarningEvent.groupBy({
      by: ['warningType', 'userAction'],
      where: {
        ...(warningType && { warningType: warningType as string }),
        triggeredAt: getTimeFilter(timeRange as string)
      },
      _count: true
    });

    // Calculate improvement metrics
    const improvementMetrics = await calculateImprovementMetrics(timeRange as string);

    res.json({
      success: true,
      data: {
        ...effectiveness,
        warningTrends,
        improvementMetrics,
        benchmarks: getPitfallBenchmarks()
      },
      message: 'Pitfall prevention effectiveness retrieved'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/analytics/user-journey
 * User journey flow analysis
 */
router.get('/user-journey', async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { timeRange = 'month', organizationId } = req.query;

    const journeyAnalysis = await userBehaviorAnalyticsService.getUserJourneyFlow(
      organizationId as string,
      timeRange as any
    );

    // Get session metrics from behavior events aggregated by sessionId
    const sessionMetrics = await prisma.userBehaviorEvent.groupBy({
      by: ['sessionId'],
      where: {
        ...(organizationId && { organizationId: organizationId as string }),
        timestamp: getTimeFilter(timeRange as string)
      },
      _count: {
        id: true
      }
    });

    res.json({
      success: true,
      data: {
        ...journeyAnalysis,
        sessionQuality: sessionMetrics,
        engagementScore: calculateEngagementScore(sessionMetrics)
      },
      message: 'User journey analysis retrieved'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/analytics/behavior-insights
 * Generated behavior insights and recommendations
 */
router.get('/behavior-insights', async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { timeRange = 'month', organizationId, insightType } = req.query;

    const insights = await userBehaviorAnalyticsService.generateBehaviorInsights(
      organizationId as string,
      timeRange as any
    );

    // Filter by insight type if specified
    const filteredInsights = insightType 
      ? insights.filter(insight => insight.type === insightType)
      : insights;

    // Get insight implementation status
    const implementationStatus = await prisma.behaviorInsight.groupBy({
      by: ['status'],
      where: {
        ...(organizationId && { organizationId: organizationId as string })
      },
      _count: true
    });

    res.json({
      success: true,
      data: {
        insights: filteredInsights,
        implementationStatus,
        totalInsights: filteredInsights.length,
        highImpactInsights: filteredInsights.filter(i => i.impact === 'high').length
      },
      message: `${filteredInsights.length} behavior insights retrieved`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/admin/analytics/track-event
 * Manually track analytics event (for testing/debugging)
 */
router.post('/track-event',
  validateRequestBody({
    type: 'object',
    properties: {
      organizationId: { type: 'string' },
      userId: { type: 'string' },
      sessionId: { type: 'string' },
      eventType: { type: 'string' },
      eventData: { type: 'object' },
      contextData: { type: 'object' }
    },
    required: ['organizationId', 'userId', 'sessionId', 'eventType']
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { organizationId, userId, sessionId, eventType, eventData = {}, contextData = {} } = req.body;

      await userBehaviorAnalyticsService.trackEvent(
        organizationId,
        userId,
        sessionId,
        eventType,
        eventData,
        { ...contextData, adminTracked: true, trackedBy: authReq.user.id }
      );

      res.json({
        success: true,
        message: 'Event tracked successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/analytics/organizations/:id
 * Organization-specific analytics deep dive
 */
router.get('/organizations/:id', async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { id } = req.params;
    const { timeRange = 'month' } = req.query;

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: id! },
      include: {
        theoryOfChange: true,
        decisionQuestions: true
      }
    });

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    // Get comprehensive analytics for this organization
    const [
      foundationAnalytics,
      journeyAnalysis,
      pitfallEffectiveness,
      insights,
      eventSummary
    ] = await Promise.all([
      userBehaviorAnalyticsService.getFoundationPathwayAnalytics(timeRange as any),
      userBehaviorAnalyticsService.getUserJourneyFlow(id, timeRange as any),
      userBehaviorAnalyticsService.getPitfallPreventionEffectiveness(timeRange as any),
      userBehaviorAnalyticsService.generateBehaviorInsights(id, timeRange as any),
      getEventSummary(id!, timeRange as string)
    ]);

    const organizationAnalytics = {
      organization: {
        id: organization.id,
        name: organization.name,
        hasTheoryOfChange: !!(organization as any).theoryOfChange,
        decisionCount: (organization as any).decisionQuestions?.length || 0
      },
      foundationAnalytics,
      journeyAnalysis,
      pitfallEffectiveness,
      insights,
      eventSummary,
      recommendations: generateOrganizationRecommendations(insights, eventSummary)
    };

    res.json({
      success: true,
      data: organizationAnalytics,
      message: `Analytics for ${organization?.name}`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/analytics/realtime
 * Real-time analytics dashboard data
 */
router.get('/realtime', async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    // Get real-time metrics
    const [
      activeUsers,
      recentEvents,
      warningsShown,
      foundationStarts
    ] = await Promise.all([
      // Count active users in the last hour (unique session IDs)
      prisma.userBehaviorEvent.groupBy({
        by: ['sessionId'],
        where: {
          timestamp: { gte: lastHour }
        }
      }).then(sessions => sessions.length),
      prisma.userBehaviorEvent.count({
        where: { timestamp: { gte: lastHour } }
      }),
      prisma.pitfallWarningEvent.count({
        where: { triggeredAt: { gte: lastHour } }
      }),
      prisma.userBehaviorEvent.count({
        where: {
          eventType: 'theory_of_change_started',
          timestamp: { gte: lastHour }
        }
      })
    ]);

    const realTimeData = {
      activeUsers,
      recentEvents,
      warningsShown,
      foundationStarts,
      conversionRate: foundationStarts > 0 ? (activeUsers / foundationStarts) * 100 : 0,
      lastUpdated: now
    };

    res.json({
      success: true,
      data: realTimeData,
      message: 'Real-time analytics retrieved'
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions

function getTimeFilter(timeRange: string): any {
  const now = new Date();
  switch (timeRange) {
    case 'hour':
      return { gte: new Date(now.getTime() - 60 * 60 * 1000) };
    case 'day':
      return { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
    case 'week':
      return { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    case 'month':
      return { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    case 'quarter':
      return { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
    default:
      return {};
  }
}

function calculateOptimizationScore(analytics: any): number {
  const completionRate = analytics.completionRates.overall;
  const pathwayValues = analytics.pathwayDistribution ? Object.values(analytics.pathwayDistribution).filter((v): v is number => typeof v === 'number') : [];
  const balancedPathways = pathwayValues.length > 0 && Math.min(...pathwayValues) > 0;
  const lowAbandonment = analytics.abandonmentPoints.every((point: any) => point.abandonmentRate < 0.25);
  
  let score = completionRate;
  if (balancedPathways) score += 10;
  if (lowAbandonment) score += 15;
  
  return Math.min(100, score);
}

async function calculateImprovementMetrics(timeRange: string): Promise<any> {
  // Mock implementation - would calculate real improvement metrics
  return {
    indicatorQualityImprovement: 34,
    portfolioBalanceImprovement: 28,
    proxyReductionRate: 45,
    overallEffectivenessGrowth: 23
  };
}

function getPitfallBenchmarks(): any {
  return {
    actionRateBenchmark: 0.65,
    dismissalRateBenchmark: 0.30,
    effectivenessScoreBenchmark: 75,
    industryAverage: {
      actionRate: 0.58,
      effectivenessScore: 68
    }
  };
}

function calculateEngagementScore(sessionMetrics: any): number {
  // Since sessionMetrics is now grouped by sessionId, calculate based on session count and events
  const uniqueSessions = sessionMetrics.length || 0;
  const totalEvents = sessionMetrics.reduce((sum: number, session: any) => sum + (session._count?.id || 0), 0);
  const avgEventsPerSession = uniqueSessions > 0 ? totalEvents / uniqueSessions : 0;
  
  // Weighted engagement score based on session activity
  return Math.min(100, (uniqueSessions * 5) + (avgEventsPerSession * 2));
}

async function getEventSummary(organizationId: string, timeRange: string): Promise<any> {
  const eventCounts = await prisma.userBehaviorEvent.groupBy({
    by: ['eventType'],
    where: {
      organizationId,
      timestamp: getTimeFilter(timeRange)
    },
    _count: true
  });

  return eventCounts.reduce((summary, event) => {
    summary[event.eventType] = event._count;
    return summary;
  }, {} as Record<string, number>);
}

function generateOrganizationRecommendations(insights: any[], eventSummary: any): string[] {
  const recommendations = [];
  
  // High-impact insights drive recommendations
  const highImpactInsights = insights.filter(insight => insight.impact === 'high');
  if (highImpactInsights.length > 0) {
    recommendations.push(`Address ${highImpactInsights.length} high-impact optimization opportunities`);
  }
  
  // Event patterns drive recommendations
  if (eventSummary.theory_of_change_abandoned > eventSummary.theory_of_change_completed) {
    recommendations.push('Focus on reducing theory of change abandonment');
  }
  
  if (eventSummary.pitfall_warning_dismissed > eventSummary.pitfall_warning_acted_upon) {
    recommendations.push('Improve pitfall warning effectiveness');
  }
  
  return recommendations;
}

export { router as adminAnalyticsRoutes };