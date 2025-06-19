import { Request, Response } from 'express';
import dataCollectionWorkflowService, { 
  WorkflowPreferences, 
  WorkflowTemplate 
} from '../services/dataCollectionWorkflowService';
import { transformToCamelCase } from '../utils/caseTransform';

/**
 * Data Collection Workflow Controller
 * Handles workflow template management, scheduling, and progress tracking
 */
class DataCollectionWorkflowController {

  /**
   * Get available workflow templates
   * GET /api/v1/workflows/templates
   */
  async getWorkflowTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { methodType, sector, indicatorType } = req.query;

      const templates = await dataCollectionWorkflowService.getWorkflowTemplates(
        methodType as string,
        sector as string,
        indicatorType as string
      );

      res.json({
        success: true,
        data: {
          templates: transformToCamelCase(templates),
          totalCount: templates.length
        },
        message: `Found ${templates.length} workflow templates`
      });
    } catch (error) {
      console.error('Error fetching workflow templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch workflow templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get workflow recommendations for an indicator
   * POST /api/v1/workflows/recommendations
   */
  async getWorkflowRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const { 
        customIndicatorId, 
        sector, 
        indicatorType, 
        targetOutcome, 
        dataAvailability, 
        timeline, 
        budget 
      } = req.body;

      if (!customIndicatorId || !indicatorType || !targetOutcome) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: customIndicatorId, indicatorType, targetOutcome'
        });
        return;
      }

      const context = {
        sector,
        indicatorType,
        targetOutcome,
        dataAvailability: dataAvailability || 'none',
        timeline: timeline || 'normal',
        budget: budget || 'medium'
      };

      const recommendations = await dataCollectionWorkflowService.getWorkflowRecommendations(
        organizationId,
        customIndicatorId,
        context
      );

      res.json({
        success: true,
        data: transformToCamelCase(recommendations),
        message: `Generated ${recommendations.recommendedTemplates.length} workflow recommendations`
      });
    } catch (error) {
      console.error('Error generating workflow recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate workflow recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create a new workflow from template
   * POST /api/v1/workflows
   */
  async createWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const { 
        templateId, 
        customIndicatorId, 
        preferences, 
        customizations 
      } = req.body;

      if (!templateId || !customIndicatorId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: templateId, customIndicatorId'
        });
        return;
      }

      // Validate preferences
      const workflowPreferences: WorkflowPreferences = {
        teamSize: preferences?.teamSize || 'medium',
        timeline: preferences?.timeline || 'normal',
        budget: preferences?.budget || 'medium',
        expertise: preferences?.expertise || 'intermediate',
        dataVolume: preferences?.dataVolume || 'medium',
        qualityLevel: preferences?.qualityLevel || 'standard'
      };

      const result = await dataCollectionWorkflowService.createWorkflowFromTemplate(
        organizationId,
        templateId,
        customIndicatorId,
        workflowPreferences,
        customizations
      );

      res.status(201).json({
        success: true,
        data: transformToCamelCase(result),
        message: 'Workflow created successfully'
      });
    } catch (error) {
      console.error('Error creating workflow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get workflow progress
   * GET /api/v1/workflows/:workflowId/progress
   */
  async getWorkflowProgress(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;
      if (!workflowId) {
        res.status(400).json({ success: false, error: 'Workflow ID is required' });
        return;
      }

      const progress = await dataCollectionWorkflowService.getWorkflowProgress(workflowId);

      res.json({
        success: true,
        data: transformToCamelCase(progress),
        message: 'Workflow progress retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching workflow progress:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch workflow progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update workflow step status
   * PUT /api/v1/workflows/:workflowId/steps/:stepId
   */
  async updateStepStatus(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId, stepId } = req.params;
      const { status, hoursSpent, notes } = req.body;

      if (!workflowId || !stepId) {
        res.status(400).json({
          success: false,
          error: 'Workflow ID and Step ID are required'
        });
        return;
      }

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Status is required'
        });
        return;
      }

      const validStatuses = ['not_started', 'in_progress', 'completed', 'blocked'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
        return;
      }

      await dataCollectionWorkflowService.updateStepStatus(
        workflowId,
        stepId,
        status,
        hoursSpent,
        notes
      );

      res.json({
        success: true,
        message: 'Step status updated successfully'
      });
    } catch (error) {
      console.error('Error updating step status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update step status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Add workflow blocker
   * POST /api/v1/workflows/:workflowId/blockers
   */
  async addWorkflowBlocker(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;
      const { stepId, description, impact } = req.body;
      const reportedBy = req.user?.id;
      
      if (!workflowId) {
        res.status(400).json({ success: false, error: 'Workflow ID is required' });
        return;
      }
      
      if (!reportedBy) {
        res.status(401).json({ success: false, error: 'User authentication required' });
        return;
      }

      if (!stepId || !description || !impact) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: stepId, description, impact'
        });
        return;
      }

      const validImpacts = ['low', 'medium', 'high', 'critical'];
      if (!validImpacts.includes(impact)) {
        res.status(400).json({
          success: false,
          error: `Invalid impact level. Must be one of: ${validImpacts.join(', ')}`
        });
        return;
      }

      const blocker = await dataCollectionWorkflowService.addWorkflowBlocker(
        workflowId,
        stepId,
        description,
        impact,
        reportedBy!
      );

      res.status(201).json({
        success: true,
        data: transformToCamelCase(blocker),
        message: 'Workflow blocker added successfully'
      });
    } catch (error) {
      console.error('Error adding workflow blocker:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add workflow blocker',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get team workload analysis
   * GET /api/v1/workflows/team/workload
   */
  async getTeamWorkloadAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const analysis = await dataCollectionWorkflowService.getTeamWorkloadAnalysis(organizationId);

      res.json({
        success: true,
        data: transformToCamelCase(analysis),
        message: 'Team workload analysis retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching team workload analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch team workload analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get workflow template details
   * GET /api/v1/workflows/templates/:templateId
   */
  async getWorkflowTemplateDetails(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;

      const templates = await dataCollectionWorkflowService.getWorkflowTemplates();
      const template = templates.find(t => t.id === templateId);

      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Workflow template not found'
        });
        return;
      }

      res.json({
        success: true,
        data: transformToCamelCase(template),
        message: 'Workflow template details retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching workflow template details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch workflow template details',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get workflow analytics for organization
   * GET /api/v1/workflows/analytics
   */
  async getWorkflowAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      // Mock analytics data - would query actual workflow data
      const analytics = {
        totalWorkflows: 5,
        activeWorkflows: 2,
        completedWorkflows: 3,
        averageCompletionTime: '6.2 weeks',
        methodTypeDistribution: {
          survey: 3,
          interview: 1,
          automated_data: 1
        },
        qualityScoreAverage: 87,
        teamEfficiency: {
          onTimeCompletion: 0.8,
          budgetAdherence: 0.92,
          qualityScore: 0.87
        },
        upcomingDeadlines: [
          {
            workflowId: 'workflow_123',
            workflowName: 'Customer Satisfaction Survey',
            stepName: 'Data Collection',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'in_progress'
          }
        ],
        recentCompletions: [
          {
            workflowId: 'workflow_456',
            workflowName: 'Impact Assessment Interviews',
            completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            finalQualityScore: 92
          }
        ]
      };

      res.json({
        success: true,
        data: transformToCamelCase(analytics),
        message: 'Workflow analytics retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching workflow analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch workflow analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new DataCollectionWorkflowController();