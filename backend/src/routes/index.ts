/**
 * API Routes Index
 * Central routing configuration for all API endpoints
 */

import { Router } from 'express';
import authRoutes from './auth';
import irisRoutes from './iris';
import conversationRoutes from './conversations';
import indicatorRoutes from './indicators';
import measurementRoutes from './measurements';
import reportRoutes from './reports';
import userRoutes from './users';
import organizationRoutes from './organizations';
import adminRoutes from './admin';
import { theoryOfChangeRoutes } from './theoryOfChangeRoutes';
import { pitfallDetectionRoutes } from './pitfallDetectionRoutes';
import { decisionMappingRoutes } from './decisionMappingRoutes';
import foundationRoutes from './foundationRoutes';
import { adminAnalyticsRoutes } from './adminAnalyticsRoutes';
import { realTimeWarningRoutes } from './realTimeWarningRoutes';
import dataCollectionPlanningRoutes from './dataCollectionPlanning';

const router = Router();

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'impact-bot-v2-api',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Authentication routes (no auth required for login/register)
router.use('/auth', authRoutes);

// IRIS+ framework routes
router.use('/iris', irisRoutes);

// Conversation and recommendation routes
router.use('/conversations', conversationRoutes);

// Indicator selection and management routes
router.use('/indicators', indicatorRoutes);

// User management routes
router.use('/users', userRoutes);

// Organization management routes
router.use('/organizations', organizationRoutes);

// Measurement tracking routes
router.use('/measurements', measurementRoutes);

// Report generation routes
router.use('/reports', reportRoutes);

// Admin routes (restricted access)
router.use('/admin', adminRoutes);

// Theory of Change routes (foundation-first measurement design)
router.use('/theory-of-change', theoryOfChangeRoutes);

// Pitfall Detection routes (AI-powered prevention)
router.use('/pitfall-detection', pitfallDetectionRoutes);

// Decision Mapping routes (what decisions will this data inform?)
router.use('/decision-mapping', decisionMappingRoutes);

// Foundation readiness routes (phase-gated access control)
router.use('/foundation', foundationRoutes);

// Admin analytics routes (behavior tracking and insights)
router.use('/admin/analytics', adminAnalyticsRoutes);

// Real-time warning routes (pitfall prevention during interactions)
router.use('/warnings', realTimeWarningRoutes);

// Data collection planning routes (comprehensive planning for custom indicators)
router.use('/data-collection', dataCollectionPlanningRoutes);

// Data collection workflow routes (workflow templates, scheduling, and progress tracking)
import dataCollectionWorkflowRoutes from './dataCollectionWorkflow';
router.use('/workflows', dataCollectionWorkflowRoutes);

// Data quality validation routes (validation rules, quality assurance, and quality reporting)
import dataQualityValidationRoutes from './dataQualityValidation';
router.use('/validation', dataQualityValidationRoutes);

// Data source integration routes (external data sources, field mapping, and synchronization)
import dataSourceIntegrationRoutes from './dataSourceIntegration';
router.use('/integration', dataSourceIntegrationRoutes);

// Stakeholder reporting routes (audience targeting, tailored reports, and engagement analytics)
import stakeholderReportingRoutes from './stakeholderReporting';
router.use('/stakeholder-reporting', stakeholderReportingRoutes);

// AI personality routes (Coach Riley, Advisor Morgan, Analyst Alex - contextual AI guidance)
import aiPersonalityRoutes from './aiPersonalities';
router.use('/ai-personalities', aiPersonalityRoutes);

// Cross-organizational learning routes (pattern analysis, benchmarking, and learning insights)
import crossOrgLearningRoutes from './crossOrgLearning';
router.use('/cross-org-learning', crossOrgLearningRoutes);

// Knowledge sharing routes (best practices, method templates, and collaboration spaces)
import knowledgeSharingRoutes from './knowledgeSharing';
router.use('/knowledge-sharing', knowledgeSharingRoutes);

// Adaptive indicator recommendation routes (ML-powered indicator recommendations based on organizational learning)
import adaptiveIndicatorRecommendationRoutes from './adaptiveIndicatorRecommendationRoutes';
router.use('/adaptive-recommendations', adaptiveIndicatorRecommendationRoutes);

// Advanced pitfall prevention routes (sector-specific guidance, three-lens validation, smart warnings)
import advancedPitfallPreventionRoutes from './advancedPitfallPreventionRoutes';
router.use('/advanced-pitfall-prevention', advancedPitfallPreventionRoutes);

// Peer benchmarking routes (peer comparison, performance analysis, best practice identification)
import peerBenchmarkingRoutes from './peerBenchmarkingRoutes';
router.use('/peer-benchmarking', peerBenchmarkingRoutes);

export default router;