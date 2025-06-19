import { Router } from 'express';
import crossOrgLearningController from '../controllers/crossOrgLearningController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply authentication to all cross-org learning routes
router.use(authMiddleware);

/**
 * Learning Insights Routes
 */

// Get learning insights with optional context filtering
// GET /api/v1/cross-org-learning/insights
// Query params: ?sector=education&organizationSize=medium&geography=north_america
router.get('/insights', crossOrgLearningController.getLearningInsights);

// Get specific insight by ID with detailed analysis
// GET /api/v1/cross-org-learning/insights/:insightId
router.get('/insights/:insightId', crossOrgLearningController.getInsightById);

/**
 * Benchmarking & Comparison Routes
 */

// Get benchmarking data for organization
// GET /api/v1/cross-org-learning/benchmarks
// Query params: ?metrics=foundation_readiness,stakeholder_satisfaction,measurement_quality
router.get('/benchmarks', crossOrgLearningController.getBenchmarkingData);

// Get peer comparison analysis
// GET /api/v1/cross-org-learning/peer-comparison
// Query params: ?metrics=foundation_readiness,stakeholder_satisfaction&peerCriteria=sector,size
router.get('/peer-comparison', crossOrgLearningController.getPeerComparison);

/**
 * Pattern Analysis Routes
 */

// Extract and analyze organization patterns
// POST /api/v1/cross-org-learning/extract-patterns
// Requires: impact_analyst, impact_manager, org_admin
router.post('/extract-patterns', 
  requireRole(['impact_analyst', 'impact_manager', 'org_admin']),
  crossOrgLearningController.extractOrganizationPatterns
);

/**
 * Recommendation Routes
 */

// Get personalized recommendations based on learning patterns
// POST /api/v1/cross-org-learning/recommendations
router.post('/recommendations', crossOrgLearningController.getPersonalizedRecommendations);

/**
 * Innovation & Contribution Routes
 */

// Submit innovation for community validation
// POST /api/v1/cross-org-learning/submit-innovation
// Requires: impact_analyst, impact_manager, org_admin
router.post('/submit-innovation', 
  requireRole(['impact_analyst', 'impact_manager', 'org_admin']),
  crossOrgLearningController.submitInnovation
);

/**
 * Analytics & Platform Insights Routes
 */

// Get cross-organizational analytics and platform insights
// GET /api/v1/cross-org-learning/analytics
// Requires: impact_manager, org_admin
router.get('/analytics', 
  requireRole(['impact_manager', 'org_admin']),
  crossOrgLearningController.getCrossOrgAnalytics
);

export default router;