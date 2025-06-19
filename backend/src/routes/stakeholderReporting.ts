import { Router } from 'express';
import stakeholderReportingController from '../controllers/stakeholderReportingController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply authentication to all stakeholder reporting routes
router.use(authMiddleware);

/**
 * Stakeholder Management Routes
 */

// Get stakeholder profiles for organization
// GET /api/v1/stakeholder-reporting/stakeholders
router.get('/stakeholders', stakeholderReportingController.getStakeholderProfiles);

// Get stakeholder-specific reporting recommendations
// GET /api/v1/stakeholder-reporting/stakeholders/:stakeholderId/recommendations
router.get('/stakeholders/:stakeholderId/recommendations', 
  stakeholderReportingController.getStakeholderRecommendations
);

/**
 * Report Generation Routes
 */

// Generate targeted report for specific stakeholder
// POST /api/v1/stakeholder-reporting/reports/generate
// Requires: impact_analyst, impact_manager, org_admin
router.post('/reports/generate', 
  requireRole(['impact_analyst', 'impact_manager', 'org_admin']),
  stakeholderReportingController.generateStakeholderReport
);

// Deliver report to stakeholder
// POST /api/v1/stakeholder-reporting/reports/:reportId/deliver
// Requires: impact_analyst, impact_manager, org_admin
router.post('/reports/:reportId/deliver', 
  requireRole(['impact_analyst', 'impact_manager', 'org_admin']),
  stakeholderReportingController.deliverReport
);

/**
 * Template & Configuration Routes
 */

// Get available report templates
// GET /api/v1/stakeholder-reporting/templates
// Query params: ?role=funder&reportType=progress
router.get('/templates', stakeholderReportingController.getReportTemplates);

// Get audience segmentation analysis
// GET /api/v1/stakeholder-reporting/audience-segmentation
router.get('/audience-segmentation', 
  stakeholderReportingController.getAudienceSegmentation
);

/**
 * Analytics & Monitoring Routes
 */

// Get report engagement analytics
// GET /api/v1/stakeholder-reporting/analytics
// Query params: ?startDate=2025-01-01&endDate=2025-01-31
// Requires: impact_manager, org_admin
router.get('/analytics', 
  requireRole(['impact_manager', 'org_admin']),
  stakeholderReportingController.getReportAnalytics
);

export default router;