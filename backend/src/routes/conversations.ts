/**
 * Conversation Routes
 * API endpoints for chat interactions and hybrid content assembly
 */

import { Router } from 'express';
import * as conversationController from '@/controllers/conversationController';
import { authMiddleware } from '@/middleware/auth';
import { rateLimitMiddleware } from '@/middleware/rateLimit';
import { validateRequest } from '@/middleware/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const chatSchema = Joi.object({
  message: Joi.string().min(1).max(2000).required(),
  conversationId: Joi.string().uuid().optional(),
  intent: Joi.string().valid(
    'find_indicators', 
    'start_measurement', 
    'get_recommendations', 
    'ask_question', 
    'create_custom', 
    'view_reports', 
    'compare_options'
  ).optional(),
  complexity: Joi.string().valid('basic', 'intermediate', 'advanced').optional(),
  focusAreas: Joi.array().items(Joi.string().max(100)).max(10).optional()
});

const recommendationSchema = Joi.object({
  organizationDescription: Joi.string().min(10).max(2000).required(),
  industry: Joi.string().max(100).optional(),
  impactAreas: Joi.array().items(Joi.string().max(100)).max(10).optional(),
  existingMetrics: Joi.array().items(Joi.string().max(200)).max(20).optional(),
  constraints: Joi.object({
    complexity: Joi.string().valid('basic', 'intermediate', 'advanced').optional(),
    timeline: Joi.string().max(100).optional(),
    budget: Joi.string().max(100).optional(),
    teamSize: Joi.number().integer().min(1).max(1000).optional()
  }).optional()
});

const conversationQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

const messageQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0)
});

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route POST /api/conversations/chat
 * @desc Send a message to start or continue a conversation
 * @access Private
 * @rateLimit 30 requests per minute per user
 */
router.post(
  '/chat',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 30, keyGenerator: 'user' }),
  validateRequest(chatSchema),
  conversationController.chat
);

/**
 * @route GET /api/conversations
 * @desc Get user's conversation list
 * @access Private
 */
router.get(
  '/',
  validateRequest(conversationQuerySchema, 'query'),
  conversationController.getUserConversations
);

/**
 * @route GET /api/conversations/:conversationId/messages
 * @desc Get conversation message history
 * @access Private
 */
router.get(
  '/:conversationId/messages',
  validateRequest(messageQuerySchema, 'query'),
  conversationController.getConversationHistory
);

/**
 * @route POST /api/conversations/recommendations
 * @desc Generate IRIS+ recommendations for an organization
 * @access Private
 * @rateLimit 10 requests per hour per user (resource intensive)
 */
router.post(
  '/recommendations',
  rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 10, keyGenerator: 'user' }),
  validateRequest(recommendationSchema),
  conversationController.generateRecommendations
);

/**
 * @route DELETE /api/conversations/:conversationId
 * @desc Delete a conversation and all its messages
 * @access Private
 */
router.delete(
  '/:conversationId',
  conversationController.deleteConversation
);

/**
 * @route PUT /api/conversations/:conversationId/rename
 * @desc Rename a conversation
 * @access Private
 */
router.put(
  '/:conversationId/rename',
  validateRequest(Joi.object({
    title: Joi.string().min(1).max(200).required()
  })),
  conversationController.renameConversation
);

/**
 * @route POST /api/conversations/:conversationId/generate-title
 * @desc Auto-generate conversation title based on content
 * @access Private
 * @rateLimit 5 requests per hour per user
 */
router.post(
  '/:conversationId/generate-title',
  rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 5, keyGenerator: 'user' }),
  conversationController.generateConversationTitle
);

/**
 * @route POST /api/conversations
 * @desc Create a new conversation
 * @access Private
 */
router.post(
  '/',
  validateRequest(Joi.object({
    type: Joi.string().default('general'),
    contextData: Joi.object().optional()
  })),
  conversationController.createConversation
);

/**
 * @route GET /api/conversations/:conversationId
 * @desc Get a specific conversation
 * @access Private
 */
router.get(
  '/:conversationId',
  conversationController.getConversation
);

/**
 * @route POST /api/conversations/:conversationId/messages
 * @desc Send a message to a conversation
 * @access Private
 * @rateLimit 30 requests per minute per user
 */
router.post(
  '/:conversationId/messages',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 30, keyGenerator: 'user' }),
  validateRequest(Joi.object({
    message: Joi.string().min(1).max(5000).required(),
    messageType: Joi.string().valid('user', 'assistant', 'system').optional()
  })),
  conversationController.sendMessage
);

export default router;