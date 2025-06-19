/**
 * Data Collection Planning Controller
 * API endpoints for comprehensive data collection planning for custom indicators
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, ValidationError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { dataCollectionPlanningService } from '@/services/dataCollectionPlanningService';
import { transformToCamelCase } from '@/utils/caseTransform';

const prisma = new PrismaClient();

export class DataCollectionPlanningController {
  /**
   * Generate comprehensive data collection plan for custom indicator
   */
  async generateCollectionPlan(req: Request, res: Response): Promise<void> {
    const { customIndicatorId } = req.params;
    const organizationId = req.organization?.id;
    const {
      budget = 'medium',
      timeframe = 'normal',
      precision = 'standard',
      stakeholderEngagement = 'moderate'
    } = req.body;

    if (!organizationId) {
      throw new AppError('Organization context required', 400, 'NO_ORGANIZATION');
    }

    if (!customIndicatorId) {
      throw new AppError('Custom indicator ID required', 400, 'NO_INDICATOR_ID');
    }

    // Validate planning preferences
    const validBudgets = ['low', 'medium', 'high'];
    const validTimeframes = ['urgent', 'normal', 'extended'];
    const validPrecision = ['basic', 'standard', 'high'];
    const validEngagement = ['minimal', 'moderate', 'extensive'];

    if (!validBudgets.includes(budget)) {
      throw new ValidationError(`Budget must be one of: ${validBudgets.join(', ')}`);
    }

    if (!validTimeframes.includes(timeframe)) {
      throw new ValidationError(`Timeframe must be one of: ${validTimeframes.join(', ')}`);
    }

    if (!validPrecision.includes(precision)) {
      throw new ValidationError(`Precision must be one of: ${validPrecision.join(', ')}`);
    }

    if (!validEngagement.includes(stakeholderEngagement)) {
      throw new ValidationError(`Stakeholder engagement must be one of: ${validEngagement.join(', ')}`);
    }

    try {
      // Generate comprehensive plan
      const plan = await dataCollectionPlanningService.generateCollectionPlan(
        organizationId,
        customIndicatorId,
        {
          budget,
          timeframe,
          precision,
          stakeholderEngagement
        }
      );

      // Validate plan feasibility
      const feasibility = await dataCollectionPlanningService.validatePlanFeasibility(
        organizationId,
        plan
      );

      // Generate implementation checklist
      const checklist = await dataCollectionPlanningService.generateImplementationChecklist(plan);

      logger.info('Data collection plan generated', {
        organizationId,
        customIndicatorId,
        budget,
        timeframe,
        precision,
        feasibilityScore: feasibility.feasibilityScore,
        estimatedCost: plan.estimatedCost.total
      });

      res.status(201).json({
        success: true,
        data: {
          plan: transformToCamelCase(plan),
          feasibility: transformToCamelCase(feasibility),
          implementationChecklist: transformToCamelCase(checklist),
          generatedAt: new Date(),
          planVersion: '1.0'
        },
        guidance: {
          nextSteps: feasibility.isValid 
            ? [
                'Review and customize the generated plan',
                'Obtain stakeholder approval',
                'Begin implementation preparation',
                'Set up data collection tools'
              ]
            : [
                'Address feasibility concerns',
                'Consider plan modifications',
                'Reassess resource requirements',
                'Explore alternative approaches'
              ],
          keyConsiderations: [
            'Ensure ethical approval before data collection',
            'Pilot test methods with small sample',
            'Establish data quality monitoring',
            'Plan for data analysis and reporting'
          ]
        }
      });

    } catch (error) {
      logger.error('Failed to generate data collection plan', {
        organizationId,
        customIndicatorId,
        preferences: { budget, timeframe, precision, stakeholderEngagement },
        error
      });
      throw error;
    }
  }

  /**
   * Get available data collection methods with filtering
   */
  async getDataCollectionMethods(req: Request, res: Response): Promise<void> {
    const organizationId = req.organization?.id;
    const {
      complexity,
      cost,
      indicatorType
    } = req.query;

    if (!organizationId) {
      throw new AppError('Organization context required', 400, 'NO_ORGANIZATION');
    }

    try {
      const methods = await dataCollectionPlanningService.getDataCollectionMethods({
        ...(complexity && { complexity: complexity as 'low' | 'medium' | 'high' }),
        ...(cost && { cost: cost as 'low' | 'medium' | 'high' }),
        ...(indicatorType && { indicatorType: indicatorType as string })
      });

      // Add organization-specific recommendations
      const methodsWithRecommendations = methods.map(method => ({
        ...method,
        organizationFit: this.assessOrganizationFit(method, organizationId),
        estimatedSetupTime: this.estimateSetupTime(method),
        recommendedFrequency: this.getRecommendedFrequency(method, indicatorType as string)
      }));

      res.json({
        success: true,
        data: {
          methods: transformToCamelCase(methodsWithRecommendations),
          totalMethods: methods.length,
          filterCriteria: {
            complexity,
            cost,
            indicatorType
          }
        },
        guidance: {
          selectionTips: [
            'Choose methods that match your organizational capacity',
            'Consider mixing quantitative and qualitative approaches',
            'Ensure methods align with indicator type and purpose',
            'Balance cost with data quality requirements'
          ],
          commonCombinations: [
            'Digital survey + follow-up interviews for depth',
            'Administrative data + observation for verification',
            'Focus groups + individual interviews for comprehensive insights'
          ]
        }
      });

    } catch (error) {
      logger.error('Failed to get data collection methods', {
        organizationId,
        filterCriteria: { complexity, cost, indicatorType },
        error
      });
      throw error;
    }
  }

  /**
   * Get saved data collection plans for organization
   */
  async getSavedPlans(req: Request, res: Response): Promise<void> {
    const organizationId = req.organization?.id;
    const {
      status = 'all',
      indicatorId,
      limit = 10,
      offset = 0
    } = req.query;

    if (!organizationId) {
      throw new AppError('Organization context required', 400, 'NO_ORGANIZATION');
    }

    try {
      // Build query filters
      const where: any = {
        organizationId,
        dataCollectionGuidance: {
          not: null
        }
      };

      if (indicatorId) {
        where.id = indicatorId;
      }

      if (status !== 'all') {
        where.approvalStatus = status;
      }

      // Get custom indicators with data collection plans
      const [indicators, total] = await Promise.all([
        prisma.userCustomIndicator.findMany({
          where,
          select: {
            id: true,
            name: true,
            description: true,
            dataCollectionGuidance: true,
            approvalStatus: true,
            frequency: true,
            createdAt: true,
            updatedAt: true,
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: Number(limit),
          skip: Number(offset)
        }),
        prisma.userCustomIndicator.count({ where })
      ]);

      // Extract and format plans
      const plansWithMetadata = indicators.map(indicator => {
        let planData = null;
        let planSummary = null;

        try {
          if (indicator.dataCollectionGuidance) {
            const guidance = JSON.parse(indicator.dataCollectionGuidance as string);
            planData = guidance.plan;
            planSummary = {
              primaryMethod: planData?.primaryMethod?.name,
              estimatedCost: planData?.estimatedCost?.total,
              timeline: planData?.timeline?.totalWeeks,
              sampleSize: planData?.sampleSize,
              feasibilityScore: guidance.feasibilityScore
            };
          }
        } catch (parseError) {
          logger.warn('Failed to parse data collection guidance', {
            indicatorId: indicator.id,
            error: parseError
          });
        }

        return {
          id: indicator.id,
          indicatorName: indicator.name,
          description: indicator.description,
          status: indicator.approvalStatus,
          frequency: indicator.frequency,
          createdAt: indicator.createdAt,
          updatedAt: indicator.updatedAt,
          creator: indicator.creator,
          hasPlan: !!planData,
          planSummary,
          fullPlan: planData
        };
      });

      res.json({
        success: true,
        data: {
          plans: transformToCamelCase(plansWithMetadata),
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: Number(offset) + Number(limit) < total
          },
          summary: {
            totalPlans: plansWithMetadata.filter(p => p.hasPlan).length,
            byStatus: this.groupByStatus(plansWithMetadata),
            avgEstimatedCost: this.calculateAverageCost(plansWithMetadata),
            avgTimeline: this.calculateAverageTimeline(plansWithMetadata)
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get saved data collection plans', {
        organizationId,
        filterCriteria: { status, indicatorId, limit, offset },
        error
      });
      throw error;
    }
  }

  /**
   * Update data collection plan
   */
  async updateCollectionPlan(req: Request, res: Response): Promise<void> {
    const { customIndicatorId } = req.params;
    const organizationId = req.organization?.id;
    const { planUpdates, notes } = req.body;

    if (!organizationId) {
      throw new AppError('Organization context required', 400, 'NO_ORGANIZATION');
    }

    if (!customIndicatorId) {
      throw new AppError('Custom indicator ID required', 400, 'NO_INDICATOR_ID');
    }

    if (!planUpdates || typeof planUpdates !== 'object') {
      throw new ValidationError('Plan updates are required');
    }

    try {
      // Get existing indicator and plan
      const indicator = await prisma.userCustomIndicator.findUnique({
        where: {
          id: customIndicatorId,
          organizationId
        }
      });

      if (!indicator) {
        throw new AppError('Custom indicator not found', 404, 'INDICATOR_NOT_FOUND');
      }

      // Parse existing plan
      let existingPlan = null;
      if (indicator.dataCollectionGuidance) {
        try {
          existingPlan = JSON.parse(indicator.dataCollectionGuidance as string);
        } catch (parseError) {
          logger.warn('Failed to parse existing plan', { customIndicatorId, error: parseError });
        }
      }

      if (!existingPlan) {
        throw new AppError('No existing plan found to update', 404, 'NO_EXISTING_PLAN');
      }

      // Merge updates with existing plan
      const updatedPlan = {
        ...existingPlan.plan,
        ...planUpdates,
        lastUpdated: new Date(),
        updateNotes: notes
      };

      // Re-validate updated plan
      const feasibility = await dataCollectionPlanningService.validatePlanFeasibility(
        organizationId,
        updatedPlan
      );

      // Save updated plan
      const updatedGuidance = {
        ...existingPlan,
        plan: updatedPlan,
        feasibility,
        lastUpdated: new Date(),
        version: existingPlan.version ? parseFloat(existingPlan.version) + 0.1 : 1.1
      };

      await prisma.userCustomIndicator.update({
        where: { id: customIndicatorId },
        data: {
          dataCollectionGuidance: JSON.stringify(updatedGuidance)
        }
      });

      logger.info('Data collection plan updated', {
        organizationId,
        customIndicatorId,
        updatedFields: Object.keys(planUpdates),
        feasibilityScore: feasibility.feasibilityScore
      });

      res.json({
        success: true,
        data: {
          updatedPlan: transformToCamelCase(updatedPlan),
          feasibility: transformToCamelCase(feasibility),
          updatedAt: new Date(),
          version: updatedGuidance.version
        },
        message: 'Data collection plan updated successfully'
      });

    } catch (error) {
      logger.error('Failed to update data collection plan', {
        organizationId,
        customIndicatorId,
        planUpdates,
        error
      });
      throw error;
    }
  }

  /**
   * Delete data collection plan
   */
  async deleteCollectionPlan(req: Request, res: Response): Promise<void> {
    const { customIndicatorId } = req.params;
    const organizationId = req.organization?.id;

    if (!organizationId) {
      throw new AppError('Organization context required', 400, 'NO_ORGANIZATION');
    }

    if (!customIndicatorId) {
      throw new AppError('Custom indicator ID required', 400, 'NO_INDICATOR_ID');
    }

    try {
      // Verify indicator exists and has plan
      const indicator = await prisma.userCustomIndicator.findUnique({
        where: {
          id: customIndicatorId,
          organizationId
        }
      });

      if (!indicator) {
        throw new AppError('Custom indicator not found', 404, 'INDICATOR_NOT_FOUND');
      }

      if (!indicator.dataCollectionGuidance) {
        throw new AppError('No data collection plan found', 404, 'NO_PLAN_FOUND');
      }

      // Remove plan while keeping indicator
      await prisma.userCustomIndicator.update({
        where: { id: customIndicatorId },
        data: {
          dataCollectionGuidance: null
        }
      });

      logger.info('Data collection plan deleted', {
        organizationId,
        customIndicatorId
      });

      res.json({
        success: true,
        message: 'Data collection plan deleted successfully'
      });

    } catch (error) {
      logger.error('Failed to delete data collection plan', {
        organizationId,
        customIndicatorId,
        error
      });
      throw error;
    }
  }

  // ================================
  // Private Helper Methods
  // ================================

  private assessOrganizationFit(method: any, organizationId: string): 'high' | 'medium' | 'low' {
    // This would integrate with organization capacity assessment
    // For now, return a simple assessment based on method complexity
    if (method.complexity === 'low') return 'high';
    if (method.complexity === 'medium') return 'medium';
    return 'low';
  }

  private estimateSetupTime(method: any): string {
    const timeMap = {
      'low': '1-2 weeks',
      'medium': '2-4 weeks',
      'high': '4-6 weeks'
    };
    return timeMap[method.complexity as keyof typeof timeMap] || '2-4 weeks';
  }

  private getRecommendedFrequency(method: any, indicatorType?: string): string[] {
    if (indicatorType === 'outcome') return ['quarterly', 'bi-annually'];
    if (indicatorType === 'output') return ['monthly', 'quarterly'];
    return method.frequencyRecommendation || ['quarterly'];
  }

  private groupByStatus(plans: any[]): Record<string, number> {
    return plans.reduce((groups, plan) => {
      const status = plan.status || 'draft';
      groups[status] = (groups[status] || 0) + 1;
      return groups;
    }, {});
  }

  private calculateAverageCost(plans: any[]): number {
    const plansWithCosts = plans.filter(p => p.planSummary?.estimatedCost);
    if (plansWithCosts.length === 0) return 0;
    
    const totalCost = plansWithCosts.reduce((sum, p) => sum + p.planSummary.estimatedCost, 0);
    return totalCost / plansWithCosts.length;
  }

  private calculateAverageTimeline(plans: any[]): number {
    const plansWithTimeline = plans.filter(p => p.planSummary?.timeline);
    if (plansWithTimeline.length === 0) return 0;
    
    const totalWeeks = plansWithTimeline.reduce((sum, p) => sum + p.planSummary.timeline, 0);
    return totalWeeks / plansWithTimeline.length;
  }
}

// Create controller instance
export const dataCollectionPlanningController = new DataCollectionPlanningController();