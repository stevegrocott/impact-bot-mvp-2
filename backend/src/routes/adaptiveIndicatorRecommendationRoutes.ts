import express from 'express';
import { authMiddleware } from '../middleware/auth';
import * as adaptiveController from '../controllers/adaptiveIndicatorRecommendationController';

const router = express.Router();

/**
 * @route GET /api/v1/adaptive-recommendations
 * @desc Generate adaptive indicator recommendations for organization
 * @access Private
 * @queryParams {string} [phase] - Current phase (foundation, indicator_selection, data_collection, reporting)
 * @queryParams {string[]} [focus] - Areas of focus (data_quality, stakeholder_engagement, outcome_measurement)
 * @queryParams {string} [timeframe] - Implementation timeframe (immediate, short_term, long_term)
 * @queryParams {string[]} [constraints] - Implementation constraints (budget, time, capacity, expertise)
 */
router.get('/', authMiddleware, adaptiveController.generateRecommendations);

/**
 * @route GET /api/v1/adaptive-recommendations/learning-profile
 * @desc Get organizational learning profile
 * @access Private
 */
router.get('/learning-profile', authMiddleware, adaptiveController.getLearningProfile);

/**
 * @route GET /api/v1/adaptive-recommendations/:recommendationId
 * @desc Get detailed information about a specific recommendation
 * @access Private
 */
router.get('/:recommendationId', authMiddleware, adaptiveController.getRecommendationDetails);

/**
 * @route POST /api/v1/adaptive-recommendations/:recommendationId/accept
 * @desc Accept a recommendation and create implementation plan
 * @access Private
 * @body {string} [implementationNotes] - Additional notes for implementation
 */
router.post('/:recommendationId/accept', authMiddleware, adaptiveController.acceptRecommendation);

/**
 * @route POST /api/v1/adaptive-recommendations/:recommendationId/reject
 * @desc Reject a recommendation with feedback
 * @access Private
 * @body {string} reason - Required reason for rejection
 * @body {string} [feedback] - Optional detailed feedback
 */
router.post('/:recommendationId/reject', authMiddleware, adaptiveController.rejectRecommendation);

/**
 * @route PUT /api/v1/adaptive-recommendations/implementation/:trackingId/progress
 * @desc Track implementation progress for an accepted recommendation
 * @access Private
 * @body {number} [stepCompleted] - Number of completed implementation steps
 * @body {string} [statusUpdate] - Current status update
 * @body {string[]} [challenges] - Current implementation challenges
 * @body {any} [earlyResults] - Early results or outcomes observed
 */
router.put('/implementation/:trackingId/progress', authMiddleware, adaptiveController.trackImplementationProgress);

/**
 * @route GET /api/v1/adaptive-recommendations/analytics
 * @desc Get recommendation performance analytics for organization
 * @access Private
 */
router.get('/analytics', authMiddleware, adaptiveController.getRecommendationAnalytics);

export default router;