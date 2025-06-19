import { Request, Response } from 'express';
import stakeholderReportingService from '../services/stakeholderReportingService';
import { transformToCamelCase } from '../utils/caseTransform';

/**
 * Stakeholder Reporting Controller
 * Handles stakeholder-specific report generation, audience targeting, and engagement analytics
 */
class StakeholderReportingController {

  /**
   * Get stakeholder profiles for organization
   * GET /api/v1/stakeholder-reporting/stakeholders
   */
  async getStakeholderProfiles(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const stakeholders = await stakeholderReportingService.getStakeholderProfiles(organizationId);

      res.json({
        success: true,
        data: {
          stakeholders: transformToCamelCase(stakeholders),
          totalCount: stakeholders.length,
          roleBreakdown: this.generateRoleBreakdown(stakeholders)
        },
        message: `Found ${stakeholders.length} stakeholder profiles`
      });
    } catch (error) {
      console.error('Error fetching stakeholder profiles:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stakeholder profiles',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate targeted report for specific stakeholder
   * POST /api/v1/stakeholder-reporting/reports/generate
   */
  async generateStakeholderReport(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const { 
        stakeholderId, 
        reportType, 
        reportingPeriod, 
        includeIndicators, 
        customSections, 
        overrideTemplate 
      } = req.body;

      if (!stakeholderId || !reportType || !reportingPeriod) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: stakeholderId, reportType, reportingPeriod'
        });
        return;
      }

      // Validate reportingPeriod structure
      if (!reportingPeriod.startDate || !reportingPeriod.endDate) {
        res.status(400).json({
          success: false,
          error: 'reportingPeriod must include startDate and endDate'
        });
        return;
      }

      const reportConfig = {
        reportType,
        reportingPeriod: {
          startDate: new Date(reportingPeriod.startDate),
          endDate: new Date(reportingPeriod.endDate)
        },
        ...(includeIndicators && { includeIndicators }),
        ...(customSections && { customSections }),
        ...(overrideTemplate && { overrideTemplate })
      };

      const report = await stakeholderReportingService.generateStakeholderReport(
        organizationId,
        stakeholderId,
        reportConfig
      );

      res.status(201).json({
        success: true,
        data: transformToCamelCase(report),
        message: 'Stakeholder report generated successfully'
      });
    } catch (error) {
      console.error('Error generating stakeholder report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate stakeholder report',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get available report templates
   * GET /api/v1/stakeholder-reporting/templates
   */
  async getReportTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { role, reportType } = req.query;

      const templates = await stakeholderReportingService.getReportTemplates();
      
      // Filter templates based on query parameters
      let filteredTemplates = templates;
      
      if (role) {
        filteredTemplates = filteredTemplates.filter(t => 
          t.targetAudience.includes(role as string)
        );
      }

      if (reportType) {
        filteredTemplates = filteredTemplates.filter(t => 
          t.reportType === reportType
        );
      }

      res.json({
        success: true,
        data: {
          templates: transformToCamelCase(filteredTemplates),
          totalCount: filteredTemplates.length,
          availableRoles: this.getAvailableRoles(templates),
          availableReportTypes: this.getAvailableReportTypes(templates)
        },
        message: `Found ${filteredTemplates.length} report templates`
      });
    } catch (error) {
      console.error('Error fetching report templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch report templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get audience segmentation analysis
   * GET /api/v1/stakeholder-reporting/audience-segmentation
   */
  async getAudienceSegmentation(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const segmentation = await stakeholderReportingService.getAudienceSegmentation(organizationId);

      res.json({
        success: true,
        data: {
          segments: transformToCamelCase(segmentation),
          totalSegments: segmentation.length,
          segmentSummary: this.generateSegmentSummary(segmentation)
        },
        message: `Found ${segmentation.length} audience segments`
      });
    } catch (error) {
      console.error('Error fetching audience segmentation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audience segmentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Deliver report to stakeholder
   * POST /api/v1/stakeholder-reporting/reports/:reportId/deliver
   */
  async deliverReport(req: Request, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const { customMessage, deliveryDate, reminderSchedule } = req.body;

      if (!reportId) {
        res.status(400).json({ success: false, error: 'Report ID is required' });
        return;
      }

      const deliveryOptions = {
        ...(customMessage && { customMessage }),
        ...(deliveryDate && { deliveryDate: new Date(deliveryDate) }),
        ...(reminderSchedule && { reminderSchedule })
      };

      const deliveryResult = await stakeholderReportingService.deliverReport(
        reportId,
        Object.keys(deliveryOptions).length > 0 ? deliveryOptions : undefined
      );

      res.json({
        success: true,
        data: transformToCamelCase(deliveryResult),
        message: 'Report delivery initiated successfully'
      });
    } catch (error) {
      console.error('Error delivering report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to deliver report',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get report engagement analytics
   * GET /api/v1/stakeholder-reporting/analytics
   */
  async getReportAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const { startDate, endDate } = req.query;

      let timeRange;
      if (startDate && endDate) {
        timeRange = {
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string)
        };
      }

      const analytics = await stakeholderReportingService.getReportAnalytics(
        organizationId,
        timeRange
      );

      res.json({
        success: true,
        data: transformToCamelCase(analytics),
        message: 'Report analytics retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching report analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch report analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get stakeholder-specific reporting recommendations
   * GET /api/v1/stakeholder-reporting/stakeholders/:stakeholderId/recommendations
   */
  async getStakeholderRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { stakeholderId } = req.params;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      if (!stakeholderId) {
        res.status(400).json({ success: false, error: 'Stakeholder ID is required' });
        return;
      }

      // Get stakeholder profiles to find the specific stakeholder
      const stakeholders = await stakeholderReportingService.getStakeholderProfiles(organizationId);
      const stakeholder = stakeholders.find(s => s.id === stakeholderId);

      if (!stakeholder) {
        res.status(404).json({ success: false, error: 'Stakeholder not found' });
        return;
      }

      // Generate recommendations based on stakeholder profile
      const recommendations = this.generateReportingRecommendations(stakeholder);

      res.json({
        success: true,
        data: {
          stakeholderId,
          stakeholderName: stakeholder.name,
          stakeholderRole: stakeholder.role,
          recommendations: transformToCamelCase(recommendations)
        },
        message: `Generated ${recommendations.length} reporting recommendations`
      });
    } catch (error) {
      console.error('Error generating stakeholder recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate stakeholder recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Helper methods

  private generateRoleBreakdown(stakeholders: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    stakeholders.forEach(stakeholder => {
      breakdown[stakeholder.role] = (breakdown[stakeholder.role] || 0) + 1;
    });
    return breakdown;
  }

  private getAvailableRoles(templates: any[]): string[] {
    const roles = new Set<string>();
    templates.forEach(template => {
      template.targetAudience.forEach((role: string) => roles.add(role));
    });
    return Array.from(roles);
  }

  private getAvailableReportTypes(templates: any[]): string[] {
    const types = new Set<string>();
    templates.forEach(template => {
      types.add(template.reportType);
    });
    return Array.from(types);
  }

  private generateSegmentSummary(segments: any[]): any {
    return {
      totalStakeholders: segments.reduce((sum, segment) => sum + segment.stakeholders.length, 0),
      primaryFormats: segments.map(s => s.reportingStrategy.primaryFormat),
      commonFrequencies: segments.map(s => s.reportingStrategy.frequency),
      technicalLevels: segments.map(s => s.criteria.technicalLevel)
    };
  }

  private generateReportingRecommendations(stakeholder: any): any[] {
    const recommendations = [];

    // Frequency recommendations
    if (stakeholder.reportingPreferences.frequency === 'real_time') {
      recommendations.push({
        type: 'frequency',
        priority: 'medium',
        title: 'Consider Dashboard Access',
        description: 'Real-time frequency preference suggests stakeholder would benefit from dashboard access',
        actionItems: ['Set up dashboard access', 'Configure real-time notifications', 'Provide mobile access']
      });
    }

    // Format recommendations
    if (stakeholder.reportingPreferences.format === 'infographic') {
      recommendations.push({
        type: 'format',
        priority: 'high',
        title: 'Visual Communication Priority',
        description: 'Stakeholder prefers visual formats - prioritize infographics and visual storytelling',
        actionItems: ['Create visual templates', 'Use data visualization tools', 'Include success story graphics']
      });
    }

    // Access level recommendations
    if (stakeholder.accessLevel === 'public' && stakeholder.role === 'beneficiary') {
      recommendations.push({
        type: 'engagement',
        priority: 'high',
        title: 'Community Engagement Opportunity',
        description: 'Beneficiary stakeholder with public access - excellent for community engagement',
        actionItems: ['Include in public showcases', 'Gather testimonials', 'Enable feedback mechanisms']
      });
    }

    // Content recommendations
    if (stakeholder.reportingPreferences.includeMethodology === true) {
      recommendations.push({
        type: 'content',
        priority: 'medium',
        title: 'Technical Detail Interest',
        description: 'Stakeholder values methodological rigor - include detailed analysis sections',
        actionItems: ['Provide methodology appendices', 'Include statistical details', 'Reference academic standards']
      });
    }

    return recommendations;
  }
}

export default new StakeholderReportingController();