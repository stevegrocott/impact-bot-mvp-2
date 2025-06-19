import { Request, Response } from 'express';
import dataQualityValidationService from '../services/dataQualityValidationService';
import { transformToCamelCase } from '../utils/caseTransform';

/**
 * Data Quality Validation Controller
 * Handles data validation, quality assurance workflows, and quality reporting
 */
class DataQualityValidationController {

  /**
   * Get available validation rule sets
   * GET /api/v1/validation/rule-sets
   */
  async getValidationRuleSets(req: Request, res: Response): Promise<void> {
    try {
      const { indicatorType, dataType } = req.query;

      const ruleSets = await dataQualityValidationService.getValidationRuleSets(
        indicatorType as string,
        dataType as string
      );

      res.json({
        success: true,
        data: {
          ruleSets: transformToCamelCase(ruleSets),
          totalCount: ruleSets.length
        },
        message: `Found ${ruleSets.length} validation rule sets`
      });
    } catch (error) {
      console.error('Error fetching validation rule sets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch validation rule sets',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Validate data against rule set
   * POST /api/v1/validation/validate
   */
  async validateData(req: Request, res: Response): Promise<void> {
    try {
      const { data, ruleSetId, context } = req.body;

      if (!data || !Array.isArray(data) || !ruleSetId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: data (array) and ruleSetId'
        });
        return;
      }

      const validationResult = await dataQualityValidationService.validateData(
        data,
        ruleSetId,
        context
      );

      res.json({
        success: true,
        data: transformToCamelCase(validationResult),
        message: `Validation completed. Quality score: ${validationResult.qualityScore.toFixed(1)}%`
      });
    } catch (error) {
      console.error('Error validating data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get quality assurance workflows
   * GET /api/v1/validation/workflows
   */
  async getQualityAssuranceWorkflows(req: Request, res: Response): Promise<void> {
    try {
      const workflows = await dataQualityValidationService.getQualityAssuranceWorkflows();

      res.json({
        success: true,
        data: {
          workflows: transformToCamelCase(workflows),
          totalCount: workflows.length
        },
        message: `Found ${workflows.length} quality assurance workflows`
      });
    } catch (error) {
      console.error('Error fetching quality assurance workflows:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quality assurance workflows',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get data quality profiles for organization
   * GET /api/v1/validation/quality-profiles
   */
  async getDataQualityProfiles(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const profiles = await dataQualityValidationService.getDataQualityProfiles(organizationId);

      res.json({
        success: true,
        data: {
          profiles: transformToCamelCase(profiles),
          totalCount: profiles.length
        },
        message: `Found ${profiles.length} data quality profiles`
      });
    } catch (error) {
      console.error('Error fetching data quality profiles:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch data quality profiles',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate comprehensive quality report
   * POST /api/v1/validation/quality-report
   */
  async generateQualityReport(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const { indicatorIds, timeRange } = req.body;

      if (!indicatorIds || !Array.isArray(indicatorIds)) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: indicatorIds (array)'
        });
        return;
      }

      // Default time range to last 6 months if not provided
      const defaultTimeRange = {
        startDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      };

      const reportTimeRange = timeRange || defaultTimeRange;

      const qualityReport = await dataQualityValidationService.generateQualityReport(
        organizationId,
        indicatorIds,
        {
          startDate: new Date(reportTimeRange.startDate),
          endDate: new Date(reportTimeRange.endDate)
        }
      );

      res.json({
        success: true,
        data: transformToCamelCase(qualityReport),
        message: 'Quality report generated successfully'
      });
    } catch (error) {
      console.error('Error generating quality report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate quality report',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get validation recommendations for improving data quality
   * GET /api/v1/validation/recommendations/:indicatorId
   */
  async getValidationRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { indicatorId } = req.params;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      // Mock recommendations based on indicator analysis
      const recommendations = [
        {
          type: 'data_improvement',
          title: 'Improve Data Collection Frequency',
          description: 'Current data collection gaps detected. Consider increasing collection frequency.',
          priority: 'medium',
          estimatedImpact: 'Could improve timeliness score by 15-20%',
          implementation: 'Set up automated reminders and collection schedules',
          indicatorId: indicatorId,
          currentScore: 78,
          potentialScore: 93
        },
        {
          type: 'validation_rule',
          title: 'Add Range Validation',
          description: 'Values outside expected ranges detected. Implement range validation.',
          priority: 'high',
          estimatedImpact: 'Could improve accuracy by 10-15%',
          implementation: 'Configure min/max value validation in collection forms',
          indicatorId: indicatorId,
          currentScore: 85,
          potentialScore: 97
        },
        {
          type: 'quality_process',
          title: 'Implement Peer Review Process',
          description: 'Consider adding peer review for critical data points.',
          priority: 'low',
          estimatedImpact: 'Could improve overall quality by 5-10%',
          implementation: 'Set up review workflows for high-value measurements',
          indicatorId: indicatorId,
          currentScore: 88,
          potentialScore: 95
        }
      ];

      res.json({
        success: true,
        data: {
          recommendations: transformToCamelCase(recommendations),
          indicatorId: indicatorId,
          totalRecommendations: recommendations.length
        },
        message: `Found ${recommendations.length} validation recommendations`
      });
    } catch (error) {
      console.error('Error fetching validation recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch validation recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Test validation rules against sample data
   * POST /api/v1/validation/test-rules
   */
  async testValidationRules(req: Request, res: Response): Promise<void> {
    try {
      const { ruleSetId, sampleData, testScenarios } = req.body;

      if (!ruleSetId || !sampleData) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: ruleSetId and sampleData'
        });
        return;
      }

      // Test validation against various scenarios
      const testResults = [];

      // Test with valid data
      const validResult = await dataQualityValidationService.validateData(
        sampleData.valid || [{ value: 100, date: '2025-01-19', source: 'test' }],
        ruleSetId
      );

      testResults.push({
        scenario: 'valid_data',
        name: 'Valid Data Test',
        expected: 'pass',
        result: validResult.isValid ? 'pass' : 'fail',
        qualityScore: validResult.qualityScore,
        errors: validResult.errors.length,
        warnings: validResult.warnings.length
      });

      // Test with invalid data scenarios
      if (testScenarios?.invalid) {
        for (const [scenarioName, invalidData] of Object.entries(testScenarios.invalid)) {
          const invalidResult = await dataQualityValidationService.validateData(
            invalidData as any[],
            ruleSetId
          );

          testResults.push({
            scenario: scenarioName,
            name: `Invalid Data Test: ${scenarioName}`,
            expected: 'fail',
            result: invalidResult.isValid ? 'unexpected_pass' : 'fail',
            qualityScore: invalidResult.qualityScore,
            errors: invalidResult.errors.length,
            warnings: invalidResult.warnings.length,
            errorDetails: invalidResult.errors.map(e => ({
              rule: e.ruleName,
              field: e.field,
              message: e.message
            }))
          });
        }
      }

      // Calculate test summary
      const passedTests = testResults.filter(t => 
        (t.expected === 'pass' && t.result === 'pass') ||
        (t.expected === 'fail' && t.result === 'fail')
      ).length;

      const testSummary = {
        totalTests: testResults.length,
        passedTests,
        failedTests: testResults.length - passedTests,
        successRate: testResults.length > 0 ? (passedTests / testResults.length) * 100 : 0
      };

      res.json({
        success: true,
        data: {
          testSummary: transformToCamelCase(testSummary),
          testResults: transformToCamelCase(testResults),
          ruleSetId
        },
        message: `Validation rule testing completed. ${passedTests}/${testResults.length} tests passed.`
      });
    } catch (error) {
      console.error('Error testing validation rules:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test validation rules',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get quality metrics dashboard data
   * GET /api/v1/validation/dashboard
   */
  async getQualityDashboard(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const { timeRange } = req.query;

      // Mock dashboard data - would be calculated from actual data
      const dashboardData = {
        overview: {
          totalIndicators: 12,
          qualityScore: 87.3,
          trendDirection: 'improving',
          lastUpdated: new Date(),
          criticalIssues: 2,
          warnings: 8,
          validatedRecords: 1247,
          totalRecords: 1389
        },
        qualityTrends: [
          { date: '2025-01-01', overall: 82.1, completeness: 88.5, accuracy: 85.2, consistency: 78.9, timeliness: 91.2 },
          { date: '2025-01-05', overall: 84.3, completeness: 89.1, accuracy: 87.1, consistency: 80.5, timeliness: 91.8 },
          { date: '2025-01-10', overall: 86.7, completeness: 90.2, accuracy: 88.9, consistency: 83.1, timeliness: 92.5 },
          { date: '2025-01-15', overall: 87.3, completeness: 91.1, accuracy: 89.5, consistency: 84.2, timeliness: 93.1 },
          { date: '2025-01-19', overall: 87.3, completeness: 91.5, accuracy: 89.7, consistency: 84.8, timeliness: 93.3 }
        ],
        topIssues: [
          {
            indicatorName: 'Student Satisfaction Score',
            issueType: 'outlier_detection',
            severity: 'warning',
            count: 3,
            impact: 'medium',
            recommendation: 'Review collection methodology'
          },
          {
            indicatorName: 'Program Completion Rate',
            issueType: 'completeness_check',
            severity: 'error',
            count: 2,
            impact: 'high',
            recommendation: 'Implement mandatory field validation'
          }
        ],
        indicatorQuality: [
          { indicatorId: 'satisfaction', name: 'Student Satisfaction', qualityScore: 92, trend: 'stable' },
          { indicatorId: 'completion', name: 'Program Completion', qualityScore: 78, trend: 'improving' },
          { indicatorId: 'engagement', name: 'Student Engagement', qualityScore: 89, trend: 'improving' },
          { indicatorId: 'retention', name: 'Student Retention', qualityScore: 85, trend: 'declining' }
        ],
        recommendations: [
          {
            priority: 'high',
            title: 'Address Completion Rate Data Quality',
            description: 'Focus on improving data completeness for program completion metrics',
            estimatedImpact: 'Could improve overall quality by 8-12%'
          },
          {
            priority: 'medium',
            title: 'Implement Outlier Detection Alerts',
            description: 'Set up automated alerts for statistical outliers to catch data issues early',
            estimatedImpact: 'Could prevent 60-80% of data quality issues'
          }
        ]
      };

      res.json({
        success: true,
        data: transformToCamelCase(dashboardData),
        message: 'Quality dashboard data retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching quality dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quality dashboard',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new DataQualityValidationController();