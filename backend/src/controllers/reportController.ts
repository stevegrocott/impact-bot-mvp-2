/**
 * Report Controller
 * Handles impact report generation and management
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, ValidationError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { reportGenerationService, ExportOptions } from '@/services/reportGenerationService';
import { transformToCamelCase } from '@/utils/caseTransform';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

export class ReportController {
  /**
   * Get reports for organization
   */
  async getReports(req: Request, res: Response): Promise<void> {
    const organizationId = req.organization?.id;
    
    if (!organizationId) {
      throw new AppError('Organization context required', 400, 'NO_ORGANIZATION');
    }

    const { page = 1, limit = 10, type, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { organizationId };
    if (type) where.reportType = type;
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      prisma.userReport.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.userReport.count({ where })
    ]);

    logger.info('Retrieved reports for organization', { 
      organizationId, 
      total, 
      page, 
      limit 
    });

    res.json({
      success: true,
      data: {
        reports: transformToCamelCase(reports),
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  }

  /**
   * Create new report
   */
  async createReport(req: Request, res: Response): Promise<void> {
    const organizationId = req.organization?.id;
    const userId = req.user?.id;
    const { title, description, reportType, periodStart, periodEnd, templateId } = req.body;
    
    if (!organizationId) {
      throw new AppError('Organization context required', 400, 'NO_ORGANIZATION');
    }
    
    if (!userId) {
      throw new AppError('User context required', 400, 'NO_USER');
    }

    if (!title) {
      throw new ValidationError('Report title is required');
    }

    if (!reportType) {
      throw new ValidationError('Report type is required');
    }

    const validTypes = ['impact_summary', 'indicator_progress', 'stakeholder_update', 'grant_report'];
    if (!validTypes.includes(reportType)) {
      throw new ValidationError(`Invalid report type. Must be one of: ${validTypes.join(', ')}`);
    }

    const report = await prisma.userReport.create({
      data: {
        title,
        description,
        reportType,
        periodStart: periodStart ? new Date(periodStart) : null,
        periodEnd: periodEnd ? new Date(periodEnd) : null,
        templateId,
        organizationId,
        createdBy: userId,
        status: 'draft',
        content: {},
        sharedWith: [],
        exportFormats: []
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    logger.info('Created report', { 
      reportId: report.id, 
      organizationId, 
      title, 
      reportType 
    });

    res.status(201).json({
      success: true,
      data: transformToCamelCase(report)
    });
  }

  /**
   * Get specific report
   */
  async getReport(req: Request, res: Response): Promise<void> {
    const { reportId } = req.params;
    const organizationId = req.organization?.id;
    
    if (!organizationId) {
      throw new AppError('Organization context required', 400, 'NO_ORGANIZATION');
    }

    if (!reportId) {
      throw new AppError('Report ID required', 400, 'NO_REPORT_ID');
    }

    const report = await prisma.userReport.findFirst({
      where: {
        id: reportId,
        organizationId: organizationId
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    if (!report) {
      throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
    }

    logger.info('Retrieved report', { reportId, organizationId });

    res.json({
      success: true,
      data: transformToCamelCase(report)
    });
  }

  /**
   * Update report
   */
  async updateReport(req: Request, res: Response): Promise<void> {
    const { reportId } = req.params;
    const organizationId = req.organization?.id;
    const { title, description, reportType, periodStart, periodEnd, status } = req.body;
    
    if (!organizationId) {
      throw new AppError('Organization context required', 400, 'NO_ORGANIZATION');
    }

    if (!reportId) {
      throw new AppError('Report ID required', 400, 'NO_REPORT_ID');
    }

    // Build update data, only including defined fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (reportType !== undefined) updateData.reportType = reportType;
    if (periodStart !== undefined) updateData.periodStart = new Date(periodStart);
    if (periodEnd !== undefined) updateData.periodEnd = new Date(periodEnd);
    if (status !== undefined) updateData.status = status;
    
    const updatedReport = await prisma.userReport.update({
      where: {
        id: reportId,
        organizationId: organizationId
      },
      data: updateData,
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    logger.info('Updated report', { reportId, organizationId, updates: updateData });

    res.json({
      success: true,
      data: transformToCamelCase(updatedReport)
    });
  }

  /**
   * Delete report
   */
  async deleteReport(req: Request, res: Response): Promise<void> {
    const { reportId } = req.params;
    const organizationId = req.organization?.id;
    
    if (!organizationId) {
      throw new AppError('Organization context required', 400, 'NO_ORGANIZATION');
    }

    if (!reportId) {
      throw new AppError('Report ID required', 400, 'NO_REPORT_ID');
    }

    // Check if report exists and belongs to organization
    const report = await prisma.userReport.findFirst({
      where: {
        id: reportId,
        organizationId: organizationId
      }
    });

    if (!report) {
      throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
    }

    // Delete the report
    await prisma.userReport.delete({
      where: {
        id: reportId
      }
    });

    logger.info('Deleted report', { reportId, organizationId });

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  }

  /**
   * Generate report content
   */
  async generateReport(req: Request, res: Response): Promise<void> {
    const { reportId } = req.params;
    const organizationId = req.organization?.id;
    
    if (!organizationId) {
      throw new AppError('Organization context required', 400, 'NO_ORGANIZATION');
    }

    if (!reportId) {
      throw new AppError('Report ID required', 400, 'NO_REPORT_ID');
    }

    // Update report status
    await prisma.userReport.update({
      where: { 
        id: reportId,
        organizationId: organizationId
      },
      data: { status: 'generating' }
    });

    try {
      // Get report data
      const reportData = await reportGenerationService.getReportData(reportId, organizationId);
      
      // Generate content structure
      const generatedContent = {
        summary: {
          totalMetrics: reportData.metrics.length,
          avgProgress: reportData.metrics.reduce((acc, m) => acc + m.progress, 0) / reportData.metrics.length,
          topPerforming: reportData.metrics
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 3)
            .map(m => ({ name: m.indicatorName, progress: m.progress }))
        },
        insights: this.generateInsights(reportData.metrics),
        recommendations: this.generateRecommendations(reportData.metrics),
        dataQuality: this.assessDataQuality(reportData.metrics)
      };

      // Update report with generated content
      const updatedReport = await prisma.userReport.update({
        where: { 
          id: reportId,
          organizationId: organizationId
        },
        data: {
          status: 'ready',
          content: generatedContent
        }
      });

      logger.info('Generated report content', { reportId, organizationId });

      res.json({
        success: true,
        data: {
          id: reportId,
          status: 'ready',
          content: generatedContent,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      // Update status to failed
      await prisma.userReport.update({
        where: { 
          id: reportId,
          organizationId: organizationId
        },
        data: { status: 'failed' }
      });
      throw error;
    }
  }

  /**
   * Export report
   */
  async exportReport(req: Request, res: Response): Promise<void> {
    const { reportId } = req.params;
    const organizationId = req.organization?.id;
    const { 
      format = 'pdf', 
      includeCharts = true, 
      includeRawData = false, 
      stakeholderAudience = 'internal' 
    } = req.body;
    
    if (!organizationId) {
      throw new AppError('Organization context required', 400, 'NO_ORGANIZATION');
    }

    if (!reportId) {
      throw new AppError('Report ID required', 400, 'NO_REPORT_ID');
    }

    const validFormats = ['pdf', 'excel', 'dashboard'];
    if (!validFormats.includes(format)) {
      throw new ValidationError(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
    }

    const validAudiences = ['internal', 'funder', 'public'];
    if (!validAudiences.includes(stakeholderAudience)) {
      throw new ValidationError(`Invalid audience. Must be one of: ${validAudiences.join(', ')}`);
    }

    try {
      // Get report data
      const reportData = await reportGenerationService.getReportData(reportId, organizationId);
      
      // Configure export options
      const exportOptions: ExportOptions = {
        format: format as 'pdf' | 'excel' | 'dashboard',
        includeCharts,
        includeRawData,
        stakeholderAudience: stakeholderAudience as 'internal' | 'funder' | 'public'
      };

      // Generate report
      const result = await reportGenerationService.generateReport(reportData, exportOptions);

      // Get current export formats and append new one
      const currentReport = await prisma.userReport.findUnique({
        where: { id: reportId },
        select: { exportFormats: true }
      });
      
      const currentFormats = Array.isArray(currentReport?.exportFormats) ? currentReport.exportFormats : [];
      const newExport = {
        format,
        exportedAt: new Date().toISOString(),
        stakeholderAudience,
        options: {
          format: exportOptions.format,
          includeCharts: exportOptions.includeCharts,
          includeRawData: exportOptions.includeRawData,
          stakeholderAudience: exportOptions.stakeholderAudience
        }
      };
      
      // Update export history
      await prisma.userReport.update({
        where: { 
          id: reportId,
          organizationId: organizationId
        },
        data: {
          exportFormats: [...currentFormats, newExport]
        }
      });

      logger.info('Exported report', { 
        reportId, 
        organizationId, 
        format, 
        stakeholderAudience 
      });

      if (format === 'dashboard') {
        res.json({
          success: true,
          data: {
            id: reportId,
            format,
            dashboardConfig: result.dashboardConfig,
            metadata: result.metadata
          }
        });
      } else {
        // For PDF/Excel, provide download information
        res.json({
          success: true,
          data: {
            id: reportId,
            format,
            downloadUrl: `/api/v1/reports/${reportId}/download/${path.basename(result.filePath!)}`,
            fileName: path.basename(result.filePath!),
            metadata: result.metadata
          }
        });
      }
    } catch (error) {
      logger.error('Report export failed', { reportId, organizationId, format, error });
      throw error;
    }
  }

  /**
   * Share report
   */
  async shareReport(req: Request, res: Response): Promise<void> {
    const { reportId } = req.params;
    const organizationId = req.organization?.id;
    const { recipients, accessLevel } = req.body;
    
    if (!organizationId) {
      throw new AppError('Organization context required', 400, 'NO_ORGANIZATION');
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new ValidationError('Recipients are required');
    }

    // TODO: Implement report sharing logic
    logger.info('Sharing report', { reportId, organizationId, recipients, accessLevel });

    res.json({
      success: true,
      data: {
        id: reportId,
        sharedWith: recipients,
        accessLevel,
        message: 'Report sharing not yet implemented'
      }
    });
  }

  /**
   * Download generated report file
   */
  async downloadReport(req: Request, res: Response): Promise<void> {
    const { reportId, fileName } = req.params;
    const organizationId = req.organization?.id;
    
    if (!organizationId) {
      throw new AppError('Organization context required', 400, 'NO_ORGANIZATION');
    }

    if (!reportId) {
      throw new AppError('Report ID required', 400, 'NO_REPORT_ID');
    }

    // Verify report belongs to organization
    const report = await prisma.userReport.findFirst({
      where: { 
        id: reportId, 
        organizationId: organizationId 
      }
    });

    if (!report) {
      throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
    }

    if (!fileName) {
      throw new AppError('File name required', 400, 'NO_FILE_NAME');
    }

    const filePath = path.join(process.cwd(), 'temp', fileName);
    
    try {
      await fs.access(filePath);
      
      // Set appropriate headers
      const ext = path.extname(fileName).toLowerCase();
      const contentType = ext === '.pdf' ? 'application/pdf' : 
                         ext === '.xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                         'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Stream file
      const fileStream = await fs.readFile(filePath);
      res.send(fileStream);
      
      logger.info('Downloaded report file', { reportId, fileName, organizationId });
    } catch (error) {
      logger.error('Report download failed', { reportId, fileName, error });
      throw new AppError('File not found or expired', 404, 'FILE_NOT_FOUND');
    }
  }

  /**
   * Generate insights from metrics data
   */
  private generateInsights(metrics: any[]): string[] {
    const insights: string[] = [];
    
    const avgProgress = metrics.reduce((acc, m) => acc + m.progress, 0) / metrics.length;
    
    if (avgProgress > 80) {
      insights.push('Excellent overall performance with most indicators exceeding targets');
    } else if (avgProgress > 60) {
      insights.push('Good progress with room for improvement in some areas');
    } else {
      insights.push('Significant gaps identified - focus needed on underperforming indicators');
    }

    const improvingCount = metrics.filter(m => m.trend === 'improving').length;
    const decliningCount = metrics.filter(m => m.trend === 'declining').length;
    
    if (improvingCount > decliningCount) {
      insights.push(`Positive trend: ${improvingCount} indicators improving vs ${decliningCount} declining`);
    } else if (decliningCount > improvingCount) {
      insights.push(`Concerning trend: ${decliningCount} indicators declining vs ${improvingCount} improving`);
    }

    return insights;
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(metrics: any[]): string[] {
    const recommendations: string[] = [];
    
    const underperforming = metrics.filter(m => m.progress < 50);
    if (underperforming.length > 0) {
      recommendations.push(`Priority focus needed on ${underperforming.length} underperforming indicators`);
      recommendations.push('Consider reviewing data collection methods and target setting');
    }

    const declining = metrics.filter(m => m.trend === 'declining');
    if (declining.length > 0) {
      recommendations.push(`Investigate root causes for ${declining.length} declining indicators`);
    }

    if (metrics.length < 5) {
      recommendations.push('Consider expanding measurement to additional key indicators for comprehensive impact assessment');
    }

    return recommendations;
  }

  /**
   * Assess data quality
   */
  private assessDataQuality(metrics: any[]): any {
    const totalMetrics = metrics.length;
    const withTargets = metrics.filter(m => m.targetValue).length;
    const recentData = metrics.filter(m => {
      const daysSinceCollection = (Date.now() - new Date(m.collectionDate).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCollection <= 30;
    }).length;

    return {
      completeness: totalMetrics > 0 ? (withTargets / totalMetrics) * 100 : 0,
      recency: totalMetrics > 0 ? (recentData / totalMetrics) * 100 : 0,
      totalIndicators: totalMetrics,
      withTargets,
      recentlyUpdated: recentData,
      recommendation: totalMetrics === 0 ? 'No data available' :
                     withTargets / totalMetrics < 0.5 ? 'Set targets for more indicators' :
                     recentData / totalMetrics < 0.7 ? 'Update data collection frequency' :
                     'Good data quality'
    };
  }
}

// Create controller instance
export const reportController = new ReportController();