import { Router } from 'express';
import aiPersonalityController from '../controllers/aiPersonalityController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply authentication to all AI personality routes
router.use(authMiddleware);

/**
 * Personality Discovery Routes
 */

// Get all available AI personalities
// GET /api/v1/ai-personalities/personalities
router.get('/personalities', aiPersonalityController.getAvailablePersonalities);

// Get specific personality by ID
// GET /api/v1/ai-personalities/personalities/:personalityId
router.get('/personalities/:personalityId', aiPersonalityController.getPersonalityById);

// Get personality recommendations for current user
// GET /api/v1/ai-personalities/recommendations
// Query params: ?phase=foundation&foundationReadiness=45&taskContext=theory_development
router.get('/recommendations', aiPersonalityController.getPersonalityRecommendations);

/**
 * Personality Selection & Interaction Routes
 */

// Select optimal personality for conversation context
// POST /api/v1/ai-personalities/select-personality
router.post('/select-personality', aiPersonalityController.selectPersonalityForContext);

// Generate personality-specific response
// POST /api/v1/ai-personalities/generate-response
router.post('/generate-response', aiPersonalityController.generatePersonalityResponse);

// Record interaction feedback
// POST /api/v1/ai-personalities/feedback
router.post('/feedback', aiPersonalityController.recordInteractionFeedback);

/**
 * Analytics & Monitoring Routes
 */

// Get personality interaction analytics
// GET /api/v1/ai-personalities/analytics
// Requires: impact_manager, org_admin
router.get('/analytics', 
  requireRole(['impact_manager', 'org_admin']),
  aiPersonalityController.getPersonalityAnalytics
);

/**
 * Testing & Development Routes
 */

// Test personality responses for different contexts
// POST /api/v1/ai-personalities/test-responses
// Requires: impact_manager, org_admin (for testing and optimization)
router.post('/test-responses', 
  requireRole(['impact_manager', 'org_admin']),
  aiPersonalityController.testPersonalityResponses
);

export default router;