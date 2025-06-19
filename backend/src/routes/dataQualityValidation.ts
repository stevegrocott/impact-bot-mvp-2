import { Router } from 'express';
import dataQualityValidationController from '../controllers/dataQualityValidationController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply authentication to all validation routes
router.use(authMiddleware);

/**
 * Validation Rule Set Routes
 */

// Get available validation rule sets
// GET /api/v1/validation/rule-sets
router.get('/rule-sets', dataQualityValidationController.getValidationRuleSets);

/**
 * Data Validation Routes
 */

// Validate data against rule set
// POST /api/v1/validation/validate
// Requires: impact_analyst, impact_manager, org_admin
router.post('/validate', 
  requireRole(['impact_analyst', 'impact_manager', 'org_admin']),
  dataQualityValidationController.validateData
);

// Test validation rules with sample data
// POST /api/v1/validation/test-rules
// Requires: impact_analyst, impact_manager, org_admin
router.post('/test-rules', 
  requireRole(['impact_analyst', 'impact_manager', 'org_admin']),
  dataQualityValidationController.testValidationRules
);

/**
 * Quality Assurance Workflow Routes
 */

// Get quality assurance workflows
// GET /api/v1/validation/workflows
// Requires: impact_manager, org_admin
router.get('/workflows', 
  requireRole(['impact_manager', 'org_admin']),
  dataQualityValidationController.getQualityAssuranceWorkflows
);

/**
 * Quality Profile & Reporting Routes
 */

// Get data quality profiles for organization
// GET /api/v1/validation/quality-profiles
router.get('/quality-profiles', dataQualityValidationController.getDataQualityProfiles);

// Generate comprehensive quality report
// POST /api/v1/validation/quality-report
// Requires: impact_manager, org_admin
router.post('/quality-report', 
  requireRole(['impact_manager', 'org_admin']),
  dataQualityValidationController.generateQualityReport
);

// Get quality metrics dashboard
// GET /api/v1/validation/dashboard
router.get('/dashboard', dataQualityValidationController.getQualityDashboard);

/**
 * Recommendation & Improvement Routes
 */

// Get validation recommendations for specific indicator
// GET /api/v1/validation/recommendations/:indicatorId
router.get('/recommendations/:indicatorId', 
  dataQualityValidationController.getValidationRecommendations
);

export default router;