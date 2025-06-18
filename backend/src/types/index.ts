/**
 * Comprehensive Type Definitions for Impact Bot v2
 * Centralized type safety to prevent TypeScript errors
 */

import { Request } from 'express';
import { JsonValue } from '@prisma/client/runtime/library';

// ============================================================================
// AUTH & USER TYPES
// ============================================================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  organizations: UserOrganization[];
  currentOrganization?: UserOrganization;
}

export interface UserOrganization {
  id: string;
  name: string;
  isPrimary: boolean;
  role: {
    id: string;
    name: string;
    permissions: string[];
  };
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  organization?: UserOrganization;
}

// ============================================================================
// CONVERSATION TYPES
// ============================================================================

export interface ConversationWithDetails {
  id: string;
  userId: string;
  organizationId: string;
  title: string | null;
  conversationType: string;
  contextData: JsonValue;
  currentStep: string | null;
  completionPercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  messages: ConversationMessage[];
  organization: {
    id: string;
    name: string;
    industry: string | null;
  };
  _count: {
    messages: number;
  };
  recommendations?: any[];
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  messageType: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: JsonValue;
  timestamp: Date;
  isProcessed: boolean;
  processingTimeMs: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  intent?: string;
  complexity?: 'basic' | 'intermediate' | 'advanced';
  focusAreas?: string[];
}

export interface ConversationContext {
  conversationId: string;
  userId: string;
  organizationId: string;
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }[];
  contextData: Record<string, any>;
}

// ============================================================================
// ANALYTICS & BEHAVIOR TYPES
// ============================================================================

export interface UserBehaviorEvent {
  id: string;
  userId: string;
  organizationId: string;
  eventType: string;
  eventData: JsonValue;
  sessionId: string | null;
  timestamp: Date;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface FoundationPathwayMetrics {
  totalUsers: number;
  pathwayBreakdown: {
    upload: { attempts: number; completions: number; successRate: number; };
    guided: { attempts: number; completions: number; successRate: number; };
    hybrid: { attempts: number; completions: number; successRate: number; };
  };
  averageCompletionTime: {
    upload: number;
    guided: number;
    hybrid: number;
  };
  dropOffPoints: {
    step: string;
    dropOffRate: number;
    userSegment: string;
  }[];
}

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

export interface TypedError {
  message: string;
  code?: string;
  statusCode?: number;
  stack?: string;
  cause?: Error;
}

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: string[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system';

export type Complexity = 'basic' | 'intermediate' | 'advanced';

export type ConversationType = 'onboarding' | 'indicator_selection' | 'theory_development' | 'general';

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  return 'user' in req && 
         typeof req.user === 'object' && 
         req.user !== null &&
         'id' in req.user &&
         'organizationId' in req.user;
}

export function isValidMessageRole(role: string): role is MessageRole {
  return ['user', 'assistant', 'system'].includes(role);
}

export function hasRequiredProperty<T extends object, K extends keyof T>(
  obj: T, 
  key: K
): obj is T & Required<Pick<T, K>> {
  return obj[key] !== undefined && obj[key] !== null;
}

// ============================================================================
// SCHEMA VALIDATION TYPES
// ============================================================================

export interface SendMessageSchema {
  message: string;
  conversationId?: string;
  intent?: string;
  complexity?: Complexity;
  focusAreas?: string[];
}

export const sendMessageSchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: { type: 'string', minLength: 1, maxLength: 5000 },
    conversationId: { type: 'string', format: 'uuid' },
    intent: { type: 'string' },
    complexity: { enum: ['basic', 'intermediate', 'advanced'] },
    focusAreas: { type: 'array', items: { type: 'string' } }
  }
} as const;