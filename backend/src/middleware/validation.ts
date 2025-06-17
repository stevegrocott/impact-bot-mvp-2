/**
 * Request Validation Middleware
 * Joi-based validation for request body, query, and params
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '@/utils/errors';
import { logger } from '@/utils/logger';

/**
 * Validate request using Joi schema
 */
export function validateRequest(
  schema: Joi.ObjectSchema,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const validationError = new ValidationError(
        `Validation failed: ${error.details.map(d => d.message).join(', ')}`,
        error.details[0]?.path?.join('.'),
        error.details[0]?.context?.value
      );

      logger.warn('Request validation failed', {
        source,
        errors: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
          value: d.context?.value
        })),
        path: req.path,
        method: req.method
      });

      res.status(400).json({
        error: validationError.message,
        code: validationError.code,
        details: {
          field: validationError.field,
          value: validationError.value
        },
        timestamp: validationError.timestamp
      });
      return;
    }

    // Replace request data with validated/sanitized version
    req[source] = value;
    next();
  };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // UUID validation
  uuid: Joi.string().uuid().required(),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0)
  }),

  // Search and filtering
  search: Joi.object({
    q: Joi.string().max(500).optional(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    filters: Joi.object().optional()
  }),

  // Organization context
  organizationId: Joi.string().uuid().required(),

  // User preferences
  userPreferences: Joi.object({
    complexity: Joi.string().valid('basic', 'intermediate', 'advanced').optional(),
    notifications: Joi.boolean().optional(),
    language: Joi.string().valid('en', 'es', 'fr').default('en'),
    timezone: Joi.string().optional()
  })
};

/**
 * Validate multiple sources in one middleware
 */
export function validateMultiple(validations: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate each source
    Object.entries(validations).forEach(([source, schema]) => {
      if (schema) {
        const { error, value } = schema.validate(req[source as keyof Request], {
          abortEarly: false,
          stripUnknown: true,
          convert: true
        });

        if (error) {
          errors.push(...error.details.map(d => `${source}.${d.path.join('.')}: ${d.message}`));
        } else {
          // Replace with validated data
          (req as any)[source] = value;
        }
      }
    });

    if (errors.length > 0) {
      const validationError = new ValidationError(`Validation failed: ${errors.join(', ')}`);

      logger.warn('Multi-source validation failed', {
        errors,
        path: req.path,
        method: req.method
      });

      res.status(400).json({
        error: validationError.message,
        code: validationError.code,
        details: { errors },
        timestamp: validationError.timestamp
      });
      return;
    }

    next();
  };
}

/**
 * Custom validation rules
 */
export const customValidators = {
  // IRIS+ specific validations
  irisComplexity: Joi.string().valid('basic', 'intermediate', 'advanced'),
  
  // Impact measurement validations
  impactArea: Joi.string().valid(
    'education', 'health', 'environment', 'economic_development',
    'financial_inclusion', 'agriculture', 'energy', 'water',
    'gender_equality', 'conflict_resolution'
  ),

  // Measurement frequency
  measurementFrequency: Joi.string().valid(
    'real_time', 'daily', 'weekly', 'monthly', 
    'quarterly', 'semi_annually', 'annually'
  ),

  // Data quality levels
  dataQuality: Joi.string().valid('low', 'medium', 'high', 'verified'),

  // Stakeholder types
  stakeholderType: Joi.string().valid(
    'beneficiary', 'funder', 'partner', 'evaluator',
    'community', 'government', 'other'
  ),

  // Conversation intents
  conversationIntent: Joi.string().valid(
    'find_indicators', 'start_measurement', 'get_recommendations',
    'ask_question', 'create_custom', 'view_reports', 'compare_options'
  )
};

/**
 * Sanitization helpers
 */
export const sanitizers = {
  // Remove HTML tags and dangerous characters
  cleanText: (value: string): string => {
    return value
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>'"&]/g, '') // Remove dangerous characters
      .trim();
  },

  // Normalize email
  normalizeEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },

  // Clean organization name
  cleanOrganizationName: (name: string): string => {
    return name
      .replace(/[^\w\s\-\.]/g, '') // Allow only alphanumeric, spaces, hyphens, dots
      .replace(/\s+/g, ' ') // Normalize multiple spaces
      .trim();
  }
};

/**
 * Advanced validation middleware with custom logic
 */
export function advancedValidation(
  schema: Joi.ObjectSchema,
  customValidation?: (req: Request) => Promise<string | null>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // First run Joi validation
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const validationError = new ValidationError(
          `Schema validation failed: ${error.details.map(d => d.message).join(', ')}`
        );

        res.status(400).json({
          error: validationError.message,
          code: validationError.code,
          timestamp: validationError.timestamp
        });
        return;
      }

      req.body = value;

      // Run custom validation if provided
      if (customValidation) {
        const customError = await customValidation(req);
        if (customError) {
          const validationError = new ValidationError(customError);
          
          res.status(400).json({
            error: validationError.message,
            code: validationError.code,
            timestamp: validationError.timestamp
          });
          return;
        }
      }

      next();

    } catch (error) {
      logger.error('Advanced validation error', { error, path: req.path });
      next(error);
    }
  };
}

export default validateRequest;