/**
 * Request Body Validation Middleware
 * JSON schema-based validation for API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export interface ValidationSchema {
  type: 'object';
  properties: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

export function validateRequestBody(schema: ValidationSchema) {
  const validate = ajv.compile(schema);

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const isValid = validate(req.body);
      
      if (!isValid) {
        const errors = validate.errors?.map(error => {
          const field = error.instancePath.replace('/', '') || error.schemaPath.split('/').pop();
          return `${field}: ${error.message}`;
        }).join(', ');

        logger.warn('Request validation failed', {
          path: req.path,
          method: req.method,
          errors: validate.errors,
          body: req.body
        });

        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQueryParams(schema: ValidationSchema) {
  const validate = ajv.compile(schema);

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const isValid = validate(req.query);
      
      if (!isValid) {
        const errors = validate.errors?.map(error => {
          const field = error.instancePath.replace('/', '') || error.schemaPath.split('/').pop();
          return `${field}: ${error.message}`;
        }).join(', ');

        logger.warn('Query validation failed', {
          path: req.path,
          method: req.method,
          errors: validate.errors,
          query: req.query
        });

        throw new AppError(`Query validation failed: ${errors}`, 400);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}