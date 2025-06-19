import express from 'express';
import { authMiddleware } from '../middleware/auth';
import * as peerBenchmarkingController from '../controllers/peerBenchmarkingController';

const router = express.Router();

/**
 * @route GET /api/v1/peer-benchmarking/find-peer-group
 * @desc Find peer organizations for benchmarking based on similarity criteria
 * @access Private
 * @queryParams {string} [sector] - Organization sector (education, healthcare, community_development, etc.)
 * @queryParams {string} [organizationSize] - Organization size (small, medium, large)
 * @queryParams {string} [geography] - Geographic region or location
 * @queryParams {string[]} [programTypes] - Types of programs offered
 * @queryParams {number} [similarityThreshold] - Minimum similarity threshold (0-100)
 */
router.get('/find-peer-group', authMiddleware, peerBenchmarkingController.findPeerGroup);

/**
 * @route GET /api/v1/peer-benchmarking/comparison
 * @desc Perform comprehensive benchmark comparison against peer group
 * @access Private
 * @queryParams {string} [peerGroupId] - Specific peer group ID to compare against
 * @queryParams {string[]} [metrics] - Specific metrics to include in comparison
 */
router.get('/comparison', authMiddleware, peerBenchmarkingController.performBenchmarkComparison);

/**
 * @route GET /api/v1/peer-benchmarking/best-performers/:peerGroupId
 * @desc Analyze best performing organizations in peer group
 * @access Private
 */
router.get('/best-performers/:peerGroupId', authMiddleware, peerBenchmarkingController.analyzeBestPerformers);

/**
 * @route GET /api/v1/peer-benchmarking/gap-analysis
 * @desc Perform performance gap analysis with improvement planning
 * @access Private
 */
router.get('/gap-analysis', authMiddleware, peerBenchmarkingController.performGapAnalysis);

/**
 * @route GET /api/v1/peer-benchmarking/peer-groups/:peerGroupId/metrics
 * @desc Get detailed performance metrics for a specific peer group
 * @access Private
 */
router.get('/peer-groups/:peerGroupId/metrics', authMiddleware, peerBenchmarkingController.getPeerGroupMetrics);

/**
 * @route GET /api/v1/peer-benchmarking/insights
 * @desc Get comprehensive benchmarking insights and recommendations
 * @access Private
 */
router.get('/insights', authMiddleware, peerBenchmarkingController.getBenchmarkingInsights);

/**
 * @route GET /api/v1/peer-benchmarking/history
 * @desc Get historical benchmark comparison data and trends
 * @access Private
 */
router.get('/history', authMiddleware, peerBenchmarkingController.getBenchmarkHistory);

export default router;