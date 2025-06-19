import express from 'express';
import { authMiddleware } from '../middleware/auth';
import * as advancedPitfallController from '../controllers/advancedPitfallPreventionController';

const router = express.Router();

/**
 * @route GET /api/v1/advanced-pitfall-prevention/sector-warnings
 * @desc Get sector-specific warnings for organization
 * @access Private
 * @queryParams {string} sector - Sector/industry (education, healthcare, community_development, etc.)
 * @queryParams {string[]} [currentIndicators] - Current indicators being used
 * @queryParams {string} [programType] - Type of program (training, service_delivery, capacity_building, etc.)
 * @queryParams {string[]} [stakeholderTypes] - Types of stakeholders involved
 * @queryParams {string} [developmentPhase] - Current development phase (planning, implementation, evaluation, etc.)
 */
router.get('/sector-warnings', authMiddleware, advancedPitfallController.getSectorSpecificWarnings);

/**
 * @route POST /api/v1/advanced-pitfall-prevention/three-lens-validation
 * @desc Perform three-lens validation (contribution, comparability, credibility) on measurement plan
 * @access Private
 * @body {object[]} indicators - Array of indicator objects with id, name, type, category
 * @body {string} methodology - Measurement methodology description
 * @body {object} dataCollection - Data collection approach (methods, frequency, sources)
 * @body {string[]} stakeholders - List of stakeholders involved
 */
router.post('/three-lens-validation', authMiddleware, advancedPitfallController.performThreeLensValidation);

/**
 * @route GET /api/v1/advanced-pitfall-prevention/risk-assessment
 * @desc Assess pitfall risk for organization based on current practices and context
 * @access Private
 */
router.get('/risk-assessment', authMiddleware, advancedPitfallController.assessPitfallRisk);

/**
 * @route GET /api/v1/advanced-pitfall-prevention/smart-warnings
 * @desc Get smart warning system with contextual alerts and proactive guidance
 * @access Private
 */
router.get('/smart-warnings', authMiddleware, advancedPitfallController.getSmartWarningSystem);

/**
 * @route POST /api/v1/advanced-pitfall-prevention/intervention-recommendations
 * @desc Get intervention recommendations based on user behavior patterns
 * @access Private
 * @body {string[]} indicatorChoices - Recent indicator selection choices
 * @body {string[]} measurementApproaches - Measurement approaches being used
 * @body {string[]} pitfallHistory - Historical pitfalls encountered
 */
router.post('/intervention-recommendations', authMiddleware, advancedPitfallController.getInterventionRecommendations);

/**
 * @route GET /api/v1/advanced-pitfall-prevention/warnings/:warningId
 * @desc Get detailed information about a specific warning
 * @access Private
 */
router.get('/warnings/:warningId', authMiddleware, advancedPitfallController.getWarningById);

/**
 * @route POST /api/v1/advanced-pitfall-prevention/warnings/:warningId/dismiss
 * @desc Dismiss a warning with optional feedback for system learning
 * @access Private
 * @body {string} [reason] - Reason for dismissing the warning
 * @body {string} [feedback] - Optional feedback for improving warnings
 */
router.post('/warnings/:warningId/dismiss', authMiddleware, advancedPitfallController.dismissWarning);

/**
 * @route GET /api/v1/advanced-pitfall-prevention/analytics
 * @desc Get pitfall prevention analytics and effectiveness metrics
 * @access Private
 */
router.get('/analytics', authMiddleware, advancedPitfallController.getPitfallPreventionAnalytics);

export default router;