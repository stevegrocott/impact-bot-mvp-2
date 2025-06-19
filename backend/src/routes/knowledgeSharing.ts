import { Router } from 'express';
import knowledgeSharingController from '../controllers/knowledgeSharingController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply authentication to all knowledge sharing routes
router.use(authMiddleware);

/**
 * Discovery & Search Routes
 */

// Search knowledge base for best practices, methods, and collaborations
// GET /api/v1/knowledge-sharing/search
// Query params: ?q=stakeholder+mapping&category=methodology&sector=education&minRating=4
router.get('/search', knowledgeSharingController.searchKnowledge);

// Get trending content and hot topics
// GET /api/v1/knowledge-sharing/trending
router.get('/trending', knowledgeSharingController.getTrendingContent);

/**
 * Best Practices Routes
 */

// Get best practices with filtering and pagination
// GET /api/v1/knowledge-sharing/best-practices
// Query params: ?category=stakeholder_engagement&sector=education&page=1&limit=10
router.get('/best-practices', knowledgeSharingController.getBestPractices);

// Get specific best practice by ID
// GET /api/v1/knowledge-sharing/best-practices/:practiceId
router.get('/best-practices/:practiceId', knowledgeSharingController.getBestPracticeById);

// Submit a new best practice
// POST /api/v1/knowledge-sharing/best-practices
// Requires: impact_analyst, impact_manager, org_admin
router.post('/best-practices', 
  requireRole(['impact_analyst', 'impact_manager', 'org_admin']),
  knowledgeSharingController.submitBestPractice
);

// Rate a best practice
// POST /api/v1/knowledge-sharing/best-practices/:practiceId/rate
router.post('/best-practices/:practiceId/rate', knowledgeSharingController.rateBestPractice);

/**
 * Method Templates Routes
 */

// Get method templates with filtering and pagination
// GET /api/v1/knowledge-sharing/method-templates
// Query params: ?category=evaluation&page=1&limit=10
router.get('/method-templates', knowledgeSharingController.getMethodTemplates);

// Get specific method template by ID
// GET /api/v1/knowledge-sharing/method-templates/:templateId
router.get('/method-templates/:templateId', knowledgeSharingController.getMethodTemplateById);

/**
 * Collaboration Space Routes
 */

// Get active collaboration spaces
// GET /api/v1/knowledge-sharing/collaboration-spaces
router.get('/collaboration-spaces', knowledgeSharingController.getCollaborationSpaces);

// Create a new collaboration space
// POST /api/v1/knowledge-sharing/collaboration-spaces
// Requires: impact_analyst, impact_manager, org_admin
router.post('/collaboration-spaces', 
  requireRole(['impact_analyst', 'impact_manager', 'org_admin']),
  knowledgeSharingController.createCollaborationSpace
);

// Join a collaboration space
// POST /api/v1/knowledge-sharing/collaboration-spaces/:spaceId/join
router.post('/collaboration-spaces/:spaceId/join', 
  knowledgeSharingController.joinCollaborationSpace
);

/**
 * Contributor Routes
 */

// Get contributor statistics for current user
// GET /api/v1/knowledge-sharing/contributor-stats
router.get('/contributor-stats', knowledgeSharingController.getContributorStats);

export default router;