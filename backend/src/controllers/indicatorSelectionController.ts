/**
 * Indicator Selection Controller
 * Handles user selection of recommended indicators and data collection setup
 */

import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { cacheService } from '@/services/cache';
import { logger } from '@/utils/logger';
import { AppError, ValidationError, Assert, asyncHandler } from '@/utils/errors';
import { v4 as uuidv4 } from 'uuid';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    organizationId: string;
  };
}

interface IndicatorSelection {
  indicatorId: string;
  indicatorName: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
  dataCollectionFrequency?: string;
  targetValue?: number;
  notes?: string;
}

interface DataCollectionSetup {
  indicatorId: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  startDate: Date;
  targetValue?: number;
  dataSource: string;
  responsibleTeam?: string;
  notes?: string;
}

export class IndicatorSelectionController {
  /**
   * Save selected indicators from bot recommendations
   */
  async saveSelectedIndicators(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { selections, conversationId }: { 
      selections: IndicatorSelection[], 
      conversationId?: string 
    } = req.body;

    Assert.validInput(Array.isArray(selections) && selections.length > 0, 'Selections array is required');
    Assert.validInput(selections.length <= 20, 'Maximum 20 indicators can be selected at once');

    try {
      // Validate indicator existence and get details
      const indicatorIds = selections.map(s => s.indicatorId);
      const existingIndicators = await prisma.irisKeyIndicator.findMany({
        where: { id: { in: indicatorIds } },
        select: { 
          id: true, 
          name: true, 
          complexityLevel: true,
          dataCollectionFrequency: true,
          calculationGuidance: true
        }
      });

      Assert.validInput(
        existingIndicators.length === indicatorIds.length, 
        'Some indicators not found in IRIS+ database'
      );

      // Save user selections
      const savedSelections = await Promise.all(
        selections.map(async (selection) => {
          const indicator = existingIndicators.find(i => i.id === selection.indicatorId)!;
          
          // Check if already selected by user
          const existing = await prisma.userMeasurement.findFirst({
            where: {
              userId: authReq.user.id,
              organizationId: authReq.user.organizationId,
              indicatorId: selection.indicatorId,
              status: 'selected' // Not yet set up for data collection
            }
          });

          if (existing) {
            return existing;
          }

          // Create new selection
          return await prisma.userMeasurement.create({
            data: {
              id: uuidv4(),
              userId: authReq.user.id,
              organizationId: authReq.user.organizationId,
              indicatorId: selection.indicatorId,
              indicatorName: selection.indicatorName || indicator.name,
              status: 'selected',
              complexity: selection.complexity || indicator.complexityLevel,
              targetValue: selection.targetValue,
              notes: selection.notes,
              metadata: {
                selectedAt: new Date().toISOString(),
                selectedFromConversation: conversationId,
                originalRecommendation: true,
                dataCollectionFrequency: selection.dataCollectionFrequency || indicator.dataCollectionFrequency
              }
            }
          });
        })
      );

      // Link to conversation if provided
      if (conversationId) {
        await this.linkSelectionsToConversation(conversationId, savedSelections.map(s => s.id));
      }

      // Invalidate user cache
      await cacheService.invalidateByTags([`user:${authReq.user.id}`, 'indicators']);

      // Log selection activity
      logger.info('User selected indicators', {
        userId: authReq.user.id,
        organizationId: authReq.user.organizationId,
        indicatorCount: selections.length,
        conversationId,
        indicatorIds: indicatorIds
      });

      res.status(201).json({
        message: 'Indicators selected successfully',
        selections: savedSelections.map(s => ({
          id: s.id,
          indicatorId: s.indicatorId,
          indicatorName: s.indicatorName,
          status: s.status,
          complexity: s.complexity,
          targetValue: s.targetValue,
          selectedAt: s.createdAt
        })),
        nextSteps: {
          setupDataCollection: `/api/indicators/selected/${savedSelections[0].id}/setup-data-collection`,
          viewSelected: '/api/indicators/selected'
        }
      });

    } catch (error) {
      logger.error('Failed to save selected indicators', {
        userId: authReq.user.id,
        selections: selections.map(s => s.indicatorId),
        error
      });
      throw error;
    }
  }

  /**
   * Get user's selected indicators
   */
  async getSelectedIndicators(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { status, includeSetup = false } = req.query;

    try {
      const whereClause = {
        userId: authReq.user.id,
        organizationId: authReq.user.organizationId,
        ...(status && { status: status as string })
      };

      const selectedIndicators = await prisma.userMeasurement.findMany({
        where: whereClause,
        include: {
          indicator: {
            select: {
              id: true,
              name: true,
              description: true,
              complexityLevel: true,
              calculationGuidance: true,
              whyImportant: true,
              dataCollectionFrequency: true
            }
          },
          ...(includeSetup === 'true' && {
            measurementValues: {
              take: 5,
              orderBy: { recordedAt: 'desc' },
              select: {
                id: true,
                value: true,
                recordedAt: true,
                status: true
              }
            }
          })
        },
        orderBy: { createdAt: 'desc' }
      });

      // Group by status for better organization
      const groupedSelections = selectedIndicators.reduce((groups, selection) => {
        const status = selection.status || 'selected';
        if (!groups[status]) groups[status] = [];
        groups[status].push({
          id: selection.id,
          indicatorId: selection.indicatorId,
          indicatorName: selection.indicatorName,
          status: selection.status,
          complexity: selection.complexity,
          targetValue: selection.targetValue,
          notes: selection.notes,
          selectedAt: selection.createdAt,
          lastUpdated: selection.updatedAt,
          indicator: selection.indicator,
          ...(includeSetup === 'true' && {
            recentMeasurements: selection.measurementValues || []
          })
        });
        return groups;
      }, {} as Record<string, any[]>);

      res.json({
        selectedIndicators: groupedSelections,
        summary: {
          total: selectedIndicators.length,
          byStatus: Object.keys(groupedSelections).reduce((summary, status) => {
            summary[status] = groupedSelections[status].length;
            return summary;
          }, {} as Record<string, number>)
        }
      });

    } catch (error) {
      logger.error('Failed to get selected indicators', {
        userId: authReq.user.id,
        error
      });
      throw error;
    }
  }

  /**
   * Setup data collection for selected indicator
   */
  async setupDataCollection(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { selectionId } = req.params;
    const setupData: DataCollectionSetup = req.body;

    Assert.validInput(!!selectionId, 'Selection ID is required');
    Assert.validInput(!!setupData.frequency, 'Data collection frequency is required');
    Assert.validInput(!!setupData.dataSource, 'Data source is required');

    try {
      // Verify selection ownership and get details
      const selection = await prisma.userMeasurement.findFirst({
        where: {
          id: selectionId,
          userId: authReq.user.id,
          organizationId: authReq.user.organizationId
        },
        include: {
          indicator: {
            select: {
              id: true,
              name: true,
              calculationGuidance: true,
              whyImportant: true
            }
          }
        }
      });

      Assert.exists(selection, 'Selected indicator not found');

      // Update selection with data collection setup
      const updatedSelection = await prisma.userMeasurement.update({
        where: { id: selectionId },
        data: {
          status: 'active', // Now actively collecting data
          dataCollectionFrequency: setupData.frequency,
          targetValue: setupData.targetValue || selection.targetValue,
          responsibleTeam: setupData.responsibleTeam,
          notes: setupData.notes ? `${selection.notes || ''}\n\nData Collection Setup:\n${setupData.notes}` : selection.notes,
          metadata: {
            ...selection.metadata as any,
            dataCollectionSetup: {
              setupAt: new Date().toISOString(),
              frequency: setupData.frequency,
              startDate: setupData.startDate,
              dataSource: setupData.dataSource,
              responsibleTeam: setupData.responsibleTeam
            }
          }
        }
      });

      // Create initial measurement schedule/reminders (optional enhancement)
      await this.createMeasurementSchedule(selectionId, setupData);

      // Invalidate caches
      await cacheService.invalidateByTags([
        `user:${authReq.user.id}`, 
        `selection:${selectionId}`,
        'indicators'
      ]);

      logger.info('Data collection setup completed', {
        userId: authReq.user.id,
        selectionId,
        indicatorId: selection.indicatorId,
        frequency: setupData.frequency,
        dataSource: setupData.dataSource
      });

      res.json({
        message: 'Data collection setup completed successfully',
        selection: {
          id: updatedSelection.id,
          indicatorId: updatedSelection.indicatorId,
          indicatorName: updatedSelection.indicatorName,
          status: updatedSelection.status,
          frequency: setupData.frequency,
          startDate: setupData.startDate,
          dataSource: setupData.dataSource
        },
        nextSteps: {
          enterData: `/api/measurements/${selectionId}/record`,
          viewProgress: `/api/measurements/${selectionId}/progress`,
          setupReminders: `/api/measurements/${selectionId}/reminders`
        },
        guidance: {
          indicator: selection.indicator,
          setupDetails: setupData
        }
      });

    } catch (error) {
      logger.error('Failed to setup data collection', {
        userId: authReq.user.id,
        selectionId,
        setupData,
        error
      });
      throw error;
    }
  }

  /**
   * Remove selected indicator
   */
  async removeSelectedIndicator(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { selectionId } = req.params;

    Assert.validInput(!!selectionId, 'Selection ID is required');

    try {
      // Verify ownership and check if has data
      const selection = await prisma.userMeasurement.findFirst({
        where: {
          id: selectionId,
          userId: authReq.user.id,
          organizationId: authReq.user.organizationId
        },
        include: {
          _count: {
            select: { measurementValues: true }
          }
        }
      });

      Assert.exists(selection, 'Selected indicator not found');

      // Check if has measurement data
      if (selection._count.measurementValues > 0) {
        // Archive instead of delete to preserve data integrity
        await prisma.userMeasurement.update({
          where: { id: selectionId },
          data: { 
            status: 'archived',
            archivedAt: new Date()
          }
        });

        res.json({
          message: 'Indicator archived (data preserved)',
          action: 'archived'
        });
      } else {
        // Safe to delete as no measurement data exists
        await prisma.userMeasurement.delete({
          where: { id: selectionId }
        });

        res.json({
          message: 'Indicator selection removed',
          action: 'deleted'
        });
      }

      // Invalidate caches
      await cacheService.invalidateByTags([
        `user:${authReq.user.id}`,
        `selection:${selectionId}`,
        'indicators'
      ]);

      logger.info('Indicator selection removed', {
        userId: authReq.user.id,
        selectionId,
        indicatorId: selection.indicatorId,
        hadData: selection._count.measurementValues > 0
      });

    } catch (error) {
      logger.error('Failed to remove selected indicator', {
        userId: authReq.user.id,
        selectionId,
        error
      });
      throw error;
    }
  }

  // ================================
  // Private Helper Methods
  // ================================

  /**
   * Link selections to conversation for tracking
   */
  private async linkSelectionsToConversation(conversationId: string, selectionIds: string[]): Promise<void> {
    try {
      const linkData = selectionIds.map(selectionId => ({
        id: uuidv4(),
        conversationId,
        recommendationType: 'indicator_selection',
        recommendedItemId: selectionId,
        recommendedItemType: 'user_measurement',
        confidenceScore: 0.9, // High confidence for user selections
        reasoning: 'User selected this indicator from conversation recommendations',
        userFeedback: 'accepted'
      }));

      await prisma.conversationRecommendation.createMany({
        data: linkData
      });
    } catch (error) {
      logger.warn('Failed to link selections to conversation', { conversationId, selectionIds, error });
      // Don't fail the main operation if linking fails
    }
  }

  /**
   * Create measurement schedule for regular data collection
   */
  private async createMeasurementSchedule(selectionId: string, setup: DataCollectionSetup): Promise<void> {
    try {
      // This would integrate with a job scheduler for reminders
      // For now, just log the schedule creation
      logger.info('Measurement schedule created', {
        selectionId,
        frequency: setup.frequency,
        startDate: setup.startDate,
        dataSource: setup.dataSource
      });

      // Future enhancement: Create actual scheduled jobs for data collection reminders
      // await scheduleService.createRecurringJob({
      //   type: 'measurement_reminder',
      //   selectionId,
      //   frequency: setup.frequency,
      //   startDate: setup.startDate
      // });

    } catch (error) {
      logger.warn('Failed to create measurement schedule', { selectionId, error });
      // Don't fail the main operation
    }
  }
}

// Create controller instance with bound methods
const indicatorSelectionController = new IndicatorSelectionController();

// Export bound methods for route handlers
export const saveSelectedIndicators = asyncHandler(indicatorSelectionController.saveSelectedIndicators.bind(indicatorSelectionController));
export const getSelectedIndicators = asyncHandler(indicatorSelectionController.getSelectedIndicators.bind(indicatorSelectionController));
export const setupDataCollection = asyncHandler(indicatorSelectionController.setupDataCollection.bind(indicatorSelectionController));
export const removeSelectedIndicator = asyncHandler(indicatorSelectionController.removeSelectedIndicator.bind(indicatorSelectionController));