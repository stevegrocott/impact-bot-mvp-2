import { Router } from 'express';
import dataCollectionWorkflowController from '../controllers/dataCollectionWorkflowController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply authentication to all workflow routes
router.use(authMiddleware);

/**
 * Workflow Template Routes
 */

// Get available workflow templates
// GET /api/v1/workflows/templates
router.get('/templates', dataCollectionWorkflowController.getWorkflowTemplates);

// Get specific workflow template details
// GET /api/v1/workflows/templates/:templateId
router.get('/templates/:templateId', dataCollectionWorkflowController.getWorkflowTemplateDetails);

/**
 * Workflow Management Routes
 */

// Get workflow recommendations for an indicator
// POST /api/v1/workflows/recommendations
// Requires: impact_analyst, impact_manager, org_admin
router.post('/recommendations', 
  requireRole(['impact_analyst', 'impact_manager', 'org_admin']),
  dataCollectionWorkflowController.getWorkflowRecommendations
);

// Create a new workflow from template
// POST /api/v1/workflows
// Requires: impact_analyst, impact_manager, org_admin
router.post('/', 
  requireRole(['impact_analyst', 'impact_manager', 'org_admin']),
  dataCollectionWorkflowController.createWorkflow
);

// Get workflow progress
// GET /api/v1/workflows/:workflowId/progress
router.get('/:workflowId/progress', dataCollectionWorkflowController.getWorkflowProgress);

/**
 * Workflow Step Management Routes
 */

// Update workflow step status
// PUT /api/v1/workflows/:workflowId/steps/:stepId
// Requires: impact_analyst, impact_manager
router.put('/:workflowId/steps/:stepId', 
  requireRole(['impact_analyst', 'impact_manager']),
  dataCollectionWorkflowController.updateStepStatus
);

// Add workflow blocker
// POST /api/v1/workflows/:workflowId/blockers
// Requires: impact_analyst, impact_manager
router.post('/:workflowId/blockers', 
  requireRole(['impact_analyst', 'impact_manager']),
  dataCollectionWorkflowController.addWorkflowBlocker
);

/**
 * Team Management & Analytics Routes
 */

// Get team workload analysis
// GET /api/v1/workflows/team/workload
// Requires: impact_manager, org_admin
router.get('/team/workload', 
  requireRole(['impact_manager', 'org_admin']),
  dataCollectionWorkflowController.getTeamWorkloadAnalysis
);

// Get workflow analytics for organization
// GET /api/v1/workflows/analytics
// Requires: impact_manager, org_admin
router.get('/analytics', 
  requireRole(['impact_manager', 'org_admin']),
  dataCollectionWorkflowController.getWorkflowAnalytics
);

export default router;