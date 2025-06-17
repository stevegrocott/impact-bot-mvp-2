/**
 * Environment Configuration
 * Centralized configuration management with validation
 */

import { config as loadEnv } from 'dotenv';
import Joi from 'joi';

// Load environment variables
loadEnv();

// Configuration schema for validation
const configSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number()
    .integer()
    .min(1)
    .max(65535)
    .default(3001),
  
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .default('redis://localhost:6379'),
  
  JWT_SECRET: Joi.string()
    .min(32)
    .required(),
  
  JWT_EXPIRES_IN: Joi.string()
    .default('7d'),
  
  AIRTABLE_TOKEN: Joi.string()
    .pattern(/^pat[a-zA-Z0-9]{14}\.[a-zA-Z0-9]{64}$/)
    .required(),
  
  AIRTABLE_BASE_ID: Joi.string()
    .pattern(/^app[a-zA-Z0-9]{14}$/)
    .required(),
  
  ANTHROPIC_API_KEY: Joi.string()
    .pattern(/^sk-ant-/)
    .required(),
  
  CORS_ORIGINS: Joi.string()
    .default('http://localhost:3000'),
  
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  
  CACHE_TTL_DEFAULT: Joi.number()
    .integer()
    .min(0)
    .default(3600), // 1 hour
  
  CACHE_TTL_IRIS_DATA: Joi.number()
    .integer()
    .min(0)
    .default(86400), // 24 hours
  
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .min(1000)
    .default(900000), // 15 minutes
  
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .integer()
    .min(1)
    .default(100),
  
  MAX_FILE_SIZE_MB: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10),
  
  ENABLE_METRICS: Joi.boolean()
    .default(false),
  
  ENABLE_TRACING: Joi.boolean()
    .default(false),
  
  SYNC_SCHEDULE_CRON: Joi.string()
    .default('0 2 * * *'), // Daily at 2 AM
  
  LLM_MAX_TOKENS: Joi.number()
    .integer()
    .min(100)
    .max(100000)
    .default(4000),
  
  LLM_TEMPERATURE: Joi.number()
    .min(0)
    .max(2)
    .default(0.1),
  
  CONVERSATION_CONTEXT_LIMIT: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
});

// Validate and extract configuration
const { error, value: envVars } = configSchema.validate(process.env, {
  allowUnknown: true,
  abortEarly: false
});

if (error) {
  throw new Error(`Configuration validation error: ${error.message}`);
}

// Export typed configuration
export const config = {
  // Application
  NODE_ENV: envVars.NODE_ENV as 'development' | 'staging' | 'production' | 'test',
  PORT: envVars.PORT as number,
  LOG_LEVEL: envVars.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug',

  // Database
  DATABASE_URL: envVars.DATABASE_URL as string,
  
  // Cache/Redis
  REDIS_URL: envVars.REDIS_URL as string,
  CACHE_TTL_DEFAULT: envVars.CACHE_TTL_DEFAULT as number,
  CACHE_TTL_IRIS_DATA: envVars.CACHE_TTL_IRIS_DATA as number,

  // Authentication
  JWT_SECRET: envVars.JWT_SECRET as string,
  JWT_EXPIRES_IN: envVars.JWT_EXPIRES_IN as string,

  // External APIs
  AIRTABLE_TOKEN: envVars.AIRTABLE_TOKEN as string,
  AIRTABLE_BASE_ID: envVars.AIRTABLE_BASE_ID as string,
  ANTHROPIC_API_KEY: envVars.ANTHROPIC_API_KEY as string,

  // Security
  CORS_ORIGINS: envVars.CORS_ORIGINS.split(',').map((origin: string) => origin.trim()),
  RATE_LIMIT_WINDOW_MS: envVars.RATE_LIMIT_WINDOW_MS as number,
  RATE_LIMIT_MAX_REQUESTS: envVars.RATE_LIMIT_MAX_REQUESTS as number,
  MAX_FILE_SIZE_MB: envVars.MAX_FILE_SIZE_MB as number,

  // Features
  ENABLE_METRICS: envVars.ENABLE_METRICS as boolean,
  ENABLE_TRACING: envVars.ENABLE_TRACING as boolean,
  SYNC_SCHEDULE_CRON: envVars.SYNC_SCHEDULE_CRON as string,

  // LLM Configuration
  LLM_MAX_TOKENS: envVars.LLM_MAX_TOKENS as number,
  LLM_TEMPERATURE: envVars.LLM_TEMPERATURE as number,
  CONVERSATION_CONTEXT_LIMIT: envVars.CONVERSATION_CONTEXT_LIMIT as number,

  // Computed values
  IS_PRODUCTION: envVars.NODE_ENV === 'production',
  IS_DEVELOPMENT: envVars.NODE_ENV === 'development',
  IS_TEST: envVars.NODE_ENV === 'test'
} as const;

// Log configuration on startup (without secrets)
if (config.NODE_ENV !== 'test') {
  console.log('🔧 Configuration loaded:', {
    environment: config.NODE_ENV,
    port: config.PORT,
    logLevel: config.LOG_LEVEL,
    corsOrigins: config.CORS_ORIGINS,
    enableMetrics: config.ENABLE_METRICS,
    enableTracing: config.ENABLE_TRACING,
    cacheConfig: {
      defaultTtl: config.CACHE_TTL_DEFAULT,
      irisTtl: config.CACHE_TTL_IRIS_DATA
    },
    llmConfig: {
      maxTokens: config.LLM_MAX_TOKENS,
      temperature: config.LLM_TEMPERATURE,
      contextLimit: config.CONVERSATION_CONTEXT_LIMIT
    }
  });
}