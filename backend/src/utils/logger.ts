/**
 * Structured Logging Service
 * Winston-based logging with structured output and performance monitoring
 */

import winston from 'winston';
import { config } from '@/config/environment';

// Custom log format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta,
      environment: config.NODE_ENV,
      service: 'impact-bot-v2-backend'
    });
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}] ${message} ${metaStr}`;
  })
);

// Create transports
const transports: winston.transport[] = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    level: config.LOG_LEVEL,
    format: config.IS_PRODUCTION ? logFormat : consoleFormat,
    handleExceptions: true,
    handleRejections: true
  })
);

// File transports for production
if (config.IS_PRODUCTION) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  transports,
  exitOnError: false,
  silent: config.IS_TEST
});

// Performance monitoring utilities
export class PerformanceLogger {
  private static timers = new Map<string, number>();

  /**
   * Start a performance timer
   */
  static start(timerName: string): void {
    this.timers.set(timerName, Date.now());
  }

  /**
   * End a performance timer and log the duration
   */
  static end(timerName: string, context?: Record<string, any>): number {
    const startTime = this.timers.get(timerName);
    if (!startTime) {
      logger.warn('Performance timer not found', { timerName });
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(timerName);

    logger.info('Performance measurement', {
      timer: timerName,
      duration,
      ...context
    });

    return duration;
  }

  /**
   * Measure async function execution time
   */
  static async measure<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      logger.info('Async operation completed', {
        operation: name,
        duration,
        success: true,
        ...context
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Async operation failed', {
        operation: name,
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        ...context
      });
      
      throw error;
    }
  }

  /**
   * Create a performance decorator for methods
   */
  static decorator(operationName?: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;
      const name = operationName || `${target.constructor.name}.${propertyName}`;

      descriptor.value = async function (...args: any[]) {
        return PerformanceLogger.measure(name, () => method.apply(this, args));
      };
    };
  }
}

// Database query logger
export class QueryLogger {
  static logSlowQuery(query: string, duration: number, params?: any): void {
    if (duration > 1000) { // Log queries slower than 1 second
      logger.warn('Slow database query detected', {
        query: query.length > 200 ? query.substring(0, 200) + '...' : query,
        duration,
        params: params ? JSON.stringify(params).substring(0, 500) : undefined,
        type: 'slow_query'
      });
    }
  }

  static logQueryError(query: string, error: Error, params?: any): void {
    logger.error('Database query failed', {
      query: query.length > 200 ? query.substring(0, 200) + '...' : query,
      error: error.message,
      params: params ? JSON.stringify(params).substring(0, 500) : undefined,
      type: 'query_error'
    });
  }
}

// Request logger utilities
export class RequestLogger {
  static logRequest(req: any, res: any, duration: number): void {
    const { method, url, ip, headers } = req;
    const { statusCode } = res;
    
    const logData = {
      method,
      url,
      statusCode,
      duration,
      ip,
      userAgent: headers['user-agent'],
      contentLength: res.get('content-length'),
      referrer: headers.referer,
      type: 'http_request'
    };

    // Add user context if available
    if (req.user) {
      (logData as any).userId = req.user.id;
      (logData as any).organizationId = req.user.organizationId;
    }

    // Log level based on status code
    if (statusCode >= 500) {
      logger.error('HTTP request failed', logData);
    } else if (statusCode >= 400) {
      logger.warn('HTTP request error', logData);
    } else if (duration > 5000) { // Slow requests
      logger.warn('Slow HTTP request', logData);
    } else {
      logger.info('HTTP request', logData);
    }
  }

  static logApiError(req: any, error: Error): void {
    logger.error('API error occurred', {
      method: req.method,
      url: req.url,
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      body: req.body ? JSON.stringify(req.body).substring(0, 1000) : undefined,
      type: 'api_error'
    });
  }
}

// LLM interaction logger
export class LLMLogger {
  static logConversation(
    conversationId: string,
    messageType: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>
  ): void {
    logger.info('LLM conversation message', {
      conversationId,
      messageType,
      contentLength: content.length,
      contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      ...metadata,
      type: 'llm_conversation'
    });
  }

  static logRecommendation(
    conversationId: string,
    recommendationType: string,
    confidenceScore: number,
    reasoning?: string
  ): void {
    logger.info('LLM recommendation generated', {
      conversationId,
      recommendationType,
      confidenceScore,
      hasReasoning: !!reasoning,
      type: 'llm_recommendation'
    });
  }

  static logPerformance(
    operation: string,
    tokensUsed: number,
    processingTime: number,
    model?: string
  ): void {
    logger.info('LLM performance metrics', {
      operation,
      tokensUsed,
      processingTime,
      model,
      tokensPerSecond: Math.round(tokensUsed / (processingTime / 1000)),
      type: 'llm_performance'
    });
  }
}

// Security logger
export class SecurityLogger {
  static logAuthAttempt(
    email: string,
    success: boolean,
    ip: string,
    userAgent?: string,
    reason?: string
  ): void {
    const logLevel = success ? 'info' : 'warn';
    logger[logLevel]('Authentication attempt', {
      email,
      success,
      ip,
      userAgent,
      reason,
      type: 'auth_attempt'
    });
  }

  static logUserRegistration(
    userId: string,
    email: string,
    ip: string,
    userAgent?: string
  ): void {
    logger.info('User registration completed', {
      userId,
      email,
      ip,
      userAgent,
      type: 'user_registration'
    });
  }

  static logSuspiciousActivity(
    description: string,
    ip: string,
    userId?: string,
    context?: Record<string, any>
  ): void {
    logger.warn('Suspicious activity detected', {
      description,
      ip,
      userId,
      ...context,
      type: 'security_alert'
    });
  }

  static logPermissionDenied(
    userId: string,
    resource: string,
    action: string,
    reason?: string
  ): void {
    logger.warn('Permission denied', {
      userId,
      resource,
      action,
      reason,
      type: 'permission_denied'
    });
  }

  static logDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    organizationId?: string
  ): void {
    logger.info('Data access logged', {
      userId,
      resourceType,
      resourceId,
      action,
      organizationId,
      type: 'data_access'
    });
  }

  static logSecurityEvent(
    eventType: string,
    description: string,
    userId?: string,
    ip?: string,
    context?: Record<string, any>
  ): void {
    logger.warn('Security event', {
      eventType,
      description,
      userId,
      ip,
      ...context,
      type: 'security_event'
    });
  }
}

// Logger classes are already exported above individually