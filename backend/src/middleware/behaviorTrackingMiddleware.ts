/**
 * Behavior Tracking Middleware
 * Automatically track user behavior events for analytics and optimization
 */

import { Request, Response, NextFunction } from 'express';
import { userBehaviorAnalyticsService, EventType } from '@/services/userBehaviorAnalyticsService';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface TrackingConfig {
  eventType?: EventType;
  trackRequest?: boolean;
  trackResponse?: boolean;
  includeBody?: boolean;
  customData?: (req: Request, res: Response) => Record<string, any>;
}

/**
 * Generate or retrieve session ID from request
 */
function getSessionId(req: Request): string {
  // Try to get session ID from various sources
  let sessionId = req.headers['x-session-id'] as string ||
                 req.cookies?.sessionId ||
                 req.session?.id;

  if (!sessionId) {
    // Generate new session ID
    sessionId = uuidv4();
    
    // Store in request for this request cycle
    req.sessionId = sessionId;
  }

  return sessionId;
}

/**
 * Extract relevant context data from request
 */
function extractContextData(req: Request, res?: Response): Record<string, any> {
  return {
    route: req.route?.path || req.path,
    method: req.method,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    ip: req.ip,
    foundationLevel: req.foundationStatus ? 
      (req.foundationStatus.allowsAdvancedAccess ? 'advanced' :
       req.foundationStatus.allowsIntermediateAccess ? 'intermediate' :
       req.foundationStatus.allowsBasicAccess ? 'basic' : 'insufficient') : undefined,
    timestamp: new Date().toISOString(),
    responseTime: res ? Date.now() - req.startTime : undefined
  };
}

/**
 * Generic behavior tracking middleware
 */
export function trackBehavior(config: TrackingConfig = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        // Skip tracking for unauthenticated requests
        return next();
      }

      const startTime = Date.now();
      req.startTime = startTime;

      const sessionId = getSessionId(req);
      const { organizationId, userId } = req.user;

      // Track request if configured
      if (config.trackRequest && config.eventType) {
        const eventData = {
          ...(config.includeBody ? { requestBody: req.body } : {}),
          ...(config.customData ? config.customData(req, res) : {})
        };

        const contextData = extractContextData(req);

        await userBehaviorAnalyticsService.trackEvent(
          organizationId,
          userId,
          sessionId,
          config.eventType,
          eventData,
          contextData
        );
      }

      // Override res.json to track response if configured
      if (config.trackResponse) {
        const originalJson = res.json;
        res.json = function(body) {
          const responseTime = Date.now() - startTime;
          
          // Track response asynchronously
          setImmediate(async () => {
            try {
              const eventData = {
                responseTime,
                statusCode: res.statusCode,
                success: res.statusCode < 400,
                ...(config.customData ? config.customData(req, res) : {})
              };

              const contextData = extractContextData(req, res);

              // Determine event type for response
              const responseEventType = determineResponseEventType(req, res, config.eventType);
              
              if (responseEventType) {
                await userBehaviorAnalyticsService.trackEvent(
                  organizationId,
                  userId,
                  sessionId,
                  responseEventType,
                  eventData,
                  contextData
                );
              }
            } catch (error) {
              logger.error('Error tracking response behavior:', error);
            }
          });

          return originalJson.call(this, body);
        };
      }

      next();
    } catch (error) {
      logger.error('Error in behavior tracking middleware:', error);
      // Don't block request if tracking fails
      next();
    }
  };
}

/**
 * Specific tracking middleware for common events
 */
export const behaviorTrackers = {
  
  /**
   * Track foundation-related events
   */
  foundation: trackBehavior({
    eventType: 'foundation_status_checked',
    trackRequest: true,
    trackResponse: true,
    customData: (req, res) => ({
      foundationAction: req.path.split('/').pop(),
      foundationLevel: req.foundationStatus?.allowsAdvancedAccess ? 'advanced' :
                      req.foundationStatus?.allowsIntermediateAccess ? 'intermediate' :
                      req.foundationStatus?.allowsBasicAccess ? 'basic' : 'insufficient'
    })
  }),

  /**
   * Track phase gate interactions
   */
  phaseGate: (feature: string) => trackBehavior({
    trackRequest: true,
    trackResponse: true,
    customData: (req, res) => ({
      feature,
      blocked: res.statusCode === 403,
      blockingReasons: res.statusCode === 403 ? req.foundationStatus?.blockingReasons : undefined
    })
  }),

  /**
   * Track indicator selection events
   */
  indicatorSelection: trackBehavior({
    eventType: 'indicator_selected',
    trackRequest: true,
    trackResponse: true,
    includeBody: true,
    customData: (req, res) => ({
      indicatorCount: Array.isArray(req.body?.selections) ? req.body.selections.length : 0,
      selectionSuccess: res.statusCode < 400
    })
  }),

  /**
   * Track conversation events
   */
  conversation: trackBehavior({
    trackRequest: true,
    trackResponse: true,
    customData: (req, res) => ({
      conversationType: req.body?.conversationType || 'unknown',
      messageLength: req.body?.message?.length || 0,
      step: req.body?.step || req.query?.step
    })
  }),

  /**
   * Track help and support requests
   */
  helpRequest: trackBehavior({
    eventType: 'help_requested',
    trackRequest: true,
    customData: (req, res) => ({
      helpTopic: req.query?.topic || req.path.split('/').pop(),
      context: req.query?.context
    })
  }),

  /**
   * Track error events
   */
  errorTracking: (req: Request, res: Response, error: any) => {
    if (!req.user) return;

    const sessionId = getSessionId(req);
    const { organizationId, userId } = req.user;

    userBehaviorAnalyticsService.trackEvent(
      organizationId,
      userId,
      sessionId,
      'error_encountered',
      {
        errorType: error.constructor.name,
        errorMessage: error.message,
        statusCode: res.statusCode,
        stack: error.stack?.split('\n').slice(0, 3) // First 3 lines only
      },
      extractContextData(req, res)
    ).catch(trackingError => {
      logger.error('Error tracking error event:', trackingError);
    });
  }
};

/**
 * Session tracking middleware - track session start/end
 */
export function trackSession(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next();
  }

  const sessionId = getSessionId(req);
  const { organizationId, userId } = req.user;

  // Track session start (debounced to avoid spam)
  const sessionKey = `session_${sessionId}`;
  if (!req.app.locals[sessionKey]) {
    req.app.locals[sessionKey] = true;
    
    userBehaviorAnalyticsService.trackEvent(
      organizationId,
      userId,
      sessionId,
      'session_started',
      {},
      extractContextData(req)
    ).catch(error => {
      logger.error('Error tracking session start:', error);
    });

    // Clean up session tracking after 30 minutes
    setTimeout(() => {
      delete req.app.locals[sessionKey];
    }, 30 * 60 * 1000);
  }

  next();
}

/**
 * Feature access tracking
 */
export function trackFeatureAccess(featureName: string) {
  return trackBehavior({
    eventType: 'feature_accessed',
    trackRequest: true,
    customData: (req, res) => ({
      feature: featureName,
      accessGranted: res.statusCode < 400,
      foundationLevel: req.foundationStatus ? 
        (req.foundationStatus.allowsAdvancedAccess ? 'advanced' :
         req.foundationStatus.allowsIntermediateAccess ? 'intermediate' :
         req.foundationStatus.allowsBasicAccess ? 'basic' : 'insufficient') : undefined
    })
  });
}

/**
 * Determine appropriate event type for response tracking
 */
function determineResponseEventType(req: Request, res: Response, baseEventType?: EventType): EventType | null {
  if (res.statusCode >= 400) {
    return 'error_encountered';
  }

  // Map routes to specific event types
  const routeEventMap: Record<string, EventType> = {
    '/theory-of-change': 'theory_of_change_completed',
    '/decision-mapping': 'decision_mapping_completed',
    '/indicators/select': 'indicator_selected',
    '/foundation/status': 'foundation_status_checked'
  };

  const routePattern = Object.keys(routeEventMap).find(pattern => 
    req.path.includes(pattern)
  );

  if (routePattern && res.statusCode < 300) {
    return routeEventMap[routePattern];
  }

  return baseEventType || null;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      startTime?: number;
    }
  }
}