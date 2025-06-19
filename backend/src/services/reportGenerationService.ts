/**
 * Report Generation Service
 * Multi-format report generation (PDF, Excel, Dashboard) for impact measurement data
 */

import { PrismaClient } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import puppeteer from 'puppeteer';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';
import { transformToCamelCase } from '@/utils/caseTransform';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

export interface ReportData {
  organizationId: string;
  reportId: string;
  title: string;
  reportType: 'impact_summary' | 'indicator_progress' | 'stakeholder_update' | 'grant_report';
  periodStart: Date;
  periodEnd: Date;
  metrics: MetricData[];
  theoryOfChange?: TheoryOfChangeData | undefined;
  stakeholders?: StakeholderData[];
}

export interface MetricData {
  indicatorId: string;
  indicatorName: string;
  targetValue?: number | undefined;
  currentValue: number;
  unit: string;
  progress: number; // percentage
  trend: 'improving' | 'declining' | 'stable';
  collectionDate: Date;
  dataSource: string;
}

export interface TheoryOfChangeData {
  targetPopulation: string;
  problemDefinition: string;
  activities: string[];
  outputs: string[];
  shortTermOutcomes: string[];
  longTermOutcomes: string[];
}

export interface StakeholderData {
  name: string;
  type: 'beneficiary' | 'funder' | 'partner' | 'community';
  engagement: string;
  feedback?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'dashboard';
  includeCharts: boolean;
  includeRawData: boolean;
  stakeholderAudience: 'internal' | 'funder' | 'public';
}

export class ReportGenerationService {
  /**
   * Generate comprehensive report in specified format
   */
  async generateReport(reportData: ReportData, options: ExportOptions): Promise<{
    filePath?: string;
    dashboardConfig?: any;
    metadata: {
      format: string;
      generatedAt: Date;
      fileSize?: number;
      pages?: number;
    };
  }> {
    try {
      logger.info('Starting report generation', { 
        reportId: reportData.reportId, 
        format: options.format 
      });

      switch (options.format) {
        case 'pdf':
          return await this.generatePdfReport(reportData, options);
        case 'excel':
          return await this.generateExcelReport(reportData, options);
        case 'dashboard':
          return await this.generateDashboardConfig(reportData, options);
        default:
          throw new AppError(`Unsupported format: ${options.format}`, 400, 'INVALID_FORMAT');
      }
    } catch (error) {
      logger.error('Report generation failed', { 
        reportId: reportData.reportId, 
        format: options.format, 
        error 
      });
      throw error;
    }
  }

  /**
   * Generate PDF report using Puppeteer
   */
  private async generatePdfReport(reportData: ReportData, options: ExportOptions): Promise<{
    filePath: string;
    metadata: {
      format: string;
      generatedAt: Date;
      fileSize: number;
      pages: number;
    };
  }> {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();

      // Generate HTML content
      const htmlContent = this.generateHtmlReport(reportData, options);
      
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Configure PDF options
      const pdfOptions = {
        format: 'A4' as const,
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            ${reportData.title} - Generated ${new Date().toLocaleDateString()}
          </div>`,
        footerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          </div>`
      };

      // Generate PDF
      const fileName = `report-${reportData.reportId}-${Date.now()}.pdf`;
      const filePath = path.join(process.cwd(), 'temp', fileName);
      
      // Ensure temp directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      const pdfBuffer = await page.pdf(pdfOptions);
      const buffer = Buffer.from(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.byteLength);
      await fs.writeFile(filePath, buffer);

      // Get file stats
      const stats = await fs.stat(filePath);
      
      return {
        filePath,
        metadata: {
          format: 'pdf',
          generatedAt: new Date(),
          fileSize: stats.size,
          pages: await this.getPdfPageCount(pdfBuffer)
        }
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate Excel report with multiple sheets
   */
  private async generateExcelReport(reportData: ReportData, options: ExportOptions): Promise<{
    filePath: string;
    metadata: {
      format: string;
      generatedAt: Date;
      fileSize: number;
    };
  }> {
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Impact Bot Platform';
    workbook.lastModifiedBy = 'Impact Bot Platform';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Executive Summary Sheet
    const summarySheet = workbook.addWorksheet('Executive Summary');
    await this.populateExecutiveSummary(summarySheet, reportData);

    // Metrics Data Sheet
    const metricsSheet = workbook.addWorksheet('Metrics Data');
    await this.populateMetricsData(metricsSheet, reportData, options);

    // Theory of Change Sheet (if available)
    if (reportData.theoryOfChange) {
      const tocSheet = workbook.addWorksheet('Theory of Change');
      await this.populateTheoryOfChange(tocSheet, reportData.theoryOfChange);
    }

    // Raw Data Sheet (if requested)
    if (options.includeRawData) {
      const rawDataSheet = workbook.addWorksheet('Raw Data');
      await this.populateRawData(rawDataSheet, reportData);
    }

    // Save file
    const fileName = `report-${reportData.reportId}-${Date.now()}.xlsx`;
    const filePath = path.join(process.cwd(), 'temp', fileName);
    
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await workbook.xlsx.writeFile(filePath);

    const stats = await fs.stat(filePath);

    return {
      filePath,
      metadata: {
        format: 'excel',
        generatedAt: new Date(),
        fileSize: stats.size
      }
    };
  }

  /**
   * Generate dashboard configuration for web display
   */
  private async generateDashboardConfig(reportData: ReportData, options: ExportOptions): Promise<{
    dashboardConfig: any;
    metadata: {
      format: string;
      generatedAt: Date;
    };
  }> {
    const dashboardConfig = {
      reportId: reportData.reportId,
      title: reportData.title,
      period: {
        start: reportData.periodStart,
        end: reportData.periodEnd
      },
      layout: {
        sections: [
          {
            type: 'summary',
            title: 'Impact Overview',
            widgets: [
              {
                type: 'metric-cards',
                data: reportData.metrics.map(metric => ({
                  title: metric.indicatorName,
                  value: metric.currentValue,
                  unit: metric.unit,
                  progress: metric.progress,
                  trend: metric.trend
                }))
              }
            ]
          },
          {
            type: 'charts',
            title: 'Progress Visualization',
            widgets: options.includeCharts ? [
              {
                type: 'progress-chart',
                data: this.generateChartData(reportData.metrics)
              },
              {
                type: 'trend-chart',
                data: this.generateTrendData(reportData.metrics)
              }
            ] : []
          }
        ]
      },
      stakeholderView: this.generateStakeholderView(reportData, options.stakeholderAudience),
      theoryOfChange: reportData.theoryOfChange,
      metadata: {
        generatedAt: new Date(),
        audience: options.stakeholderAudience,
        includeCharts: options.includeCharts
      }
    };

    return {
      dashboardConfig,
      metadata: {
        format: 'dashboard',
        generatedAt: new Date()
      }
    };
  }

  /**
   * Generate HTML content for PDF reports
   */
  private generateHtmlReport(reportData: ReportData, options: ExportOptions): string {
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .metric-card { 
          border: 1px solid #ddd; 
          padding: 15px; 
          margin: 10px 0; 
          border-radius: 5px; 
        }
        .metric-value { font-size: 24px; font-weight: bold; color: #2c5aa0; }
        .progress-bar { 
          background: #f0f0f0; 
          height: 10px; 
          border-radius: 5px; 
          overflow: hidden; 
        }
        .progress-fill { 
          background: #4caf50; 
          height: 100%; 
          transition: width 0.3s; 
        }
        .section { margin: 20px 0; }
        .section h2 { color: #2c5aa0; border-bottom: 2px solid #2c5aa0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; }
      </style>
    `;

    const metricsHtml = reportData.metrics.map(metric => `
      <div class="metric-card">
        <h3>${metric.indicatorName}</h3>
        <div class="metric-value">${metric.currentValue} ${metric.unit}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${metric.progress}%"></div>
        </div>
        <p>Progress: ${metric.progress}% | Trend: ${metric.trend}</p>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${reportData.title}</title>
          ${styles}
        </head>
        <body>
          <div class="header">
            <h1>${reportData.title}</h1>
            <p>Report Period: ${reportData.periodStart.toLocaleDateString()} - ${reportData.periodEnd.toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <h2>Impact Metrics</h2>
            ${metricsHtml}
          </div>
          
          ${reportData.theoryOfChange ? `
            <div class="section">
              <h2>Theory of Change</h2>
              <p><strong>Target Population:</strong> ${reportData.theoryOfChange.targetPopulation}</p>
              <p><strong>Problem:</strong> ${reportData.theoryOfChange.problemDefinition}</p>
              <h3>Activities</h3>
              <ul>${reportData.theoryOfChange.activities.map(a => `<li>${a}</li>`).join('')}</ul>
              <h3>Short-term Outcomes</h3>
              <ul>${reportData.theoryOfChange.shortTermOutcomes.map(o => `<li>${o}</li>`).join('')}</ul>
            </div>
          ` : ''}
          
          <div class="section">
            <h2>Detailed Metrics</h2>
            <table>
              <thead>
                <tr>
                  <th>Indicator</th>
                  <th>Current Value</th>
                  <th>Progress</th>
                  <th>Trend</th>
                  <th>Data Source</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.metrics.map(metric => `
                  <tr>
                    <td>${metric.indicatorName}</td>
                    <td>${metric.currentValue} ${metric.unit}</td>
                    <td>${metric.progress}%</td>
                    <td>${metric.trend}</td>
                    <td>${metric.dataSource}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Populate Excel executive summary sheet
   */
  private async populateExecutiveSummary(sheet: ExcelJS.Worksheet, reportData: ReportData): Promise<void> {
    // Header
    sheet.getCell('A1').value = reportData.title;
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A2').value = `Period: ${reportData.periodStart.toLocaleDateString()} - ${reportData.periodEnd.toLocaleDateString()}`;

    // Summary metrics
    sheet.getCell('A4').value = 'Key Performance Indicators';
    sheet.getCell('A4').font = { bold: true, size: 14 };

    let row = 6;
    reportData.metrics.forEach(metric => {
      sheet.getCell(`A${row}`).value = metric.indicatorName;
      sheet.getCell(`B${row}`).value = metric.currentValue;
      sheet.getCell(`C${row}`).value = metric.unit;
      sheet.getCell(`D${row}`).value = `${metric.progress}%`;
      sheet.getCell(`E${row}`).value = metric.trend;
      row++;
    });

    // Apply formatting
    sheet.columns = [
      { width: 30 }, { width: 15 }, { width: 10 }, { width: 15 }, { width: 15 }
    ];
  }

  /**
   * Populate Excel metrics data sheet
   */
  private async populateMetricsData(sheet: ExcelJS.Worksheet, reportData: ReportData, options: ExportOptions): Promise<void> {
    // Headers
    const headers = ['Indicator', 'Current Value', 'Unit', 'Target', 'Progress %', 'Trend', 'Collection Date', 'Source'];
    headers.forEach((header, index) => {
      const cell = sheet.getCell(1, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } };
    });

    // Data rows
    reportData.metrics.forEach((metric, index) => {
      const row = index + 2;
      sheet.getCell(row, 1).value = metric.indicatorName;
      sheet.getCell(row, 2).value = metric.currentValue;
      sheet.getCell(row, 3).value = metric.unit;
      sheet.getCell(row, 4).value = metric.targetValue || 'Not set';
      sheet.getCell(row, 5).value = metric.progress;
      sheet.getCell(row, 6).value = metric.trend;
      sheet.getCell(row, 7).value = metric.collectionDate;
      sheet.getCell(row, 8).value = metric.dataSource;
    });

    // Auto-fit columns
    sheet.columns.forEach(column => {
      column.width = 15;
    });
  }

  /**
   * Populate Theory of Change sheet
   */
  private async populateTheoryOfChange(sheet: ExcelJS.Worksheet, toc: TheoryOfChangeData): Promise<void> {
    sheet.getCell('A1').value = 'Theory of Change';
    sheet.getCell('A1').font = { bold: true, size: 16 };

    let row = 3;
    sheet.getCell(`A${row}`).value = 'Target Population:';
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = toc.targetPopulation;
    row += 2;

    sheet.getCell(`A${row}`).value = 'Problem Definition:';
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = toc.problemDefinition;
    row += 2;

    // Activities
    sheet.getCell(`A${row}`).value = 'Activities:';
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;
    toc.activities.forEach(activity => {
      sheet.getCell(`B${row}`).value = `• ${activity}`;
      row++;
    });
    row++;

    // Outcomes
    sheet.getCell(`A${row}`).value = 'Short-term Outcomes:';
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;
    toc.shortTermOutcomes.forEach(outcome => {
      sheet.getCell(`B${row}`).value = `• ${outcome}`;
      row++;
    });
  }

  /**
   * Populate raw data sheet
   */
  private async populateRawData(sheet: ExcelJS.Worksheet, reportData: ReportData): Promise<void> {
    // This would typically fetch raw measurement data from the database
    sheet.getCell('A1').value = 'Raw Data Export';
    sheet.getCell('A1').font = { bold: true, size: 14 };
    
    sheet.getCell('A3').value = 'Note: Raw data export functionality requires data collection implementation';
  }

  /**
   * Generate chart data for dashboard
   */
  private generateChartData(metrics: MetricData[]): any {
    return {
      labels: metrics.map(m => m.indicatorName),
      datasets: [{
        label: 'Progress %',
        data: metrics.map(m => m.progress),
        backgroundColor: metrics.map(m => 
          m.progress >= 75 ? '#4caf50' : 
          m.progress >= 50 ? '#ff9800' : '#f44336'
        )
      }]
    };
  }

  /**
   * Generate trend data for dashboard
   */
  private generateTrendData(metrics: MetricData[]): any {
    return {
      labels: metrics.map(m => m.indicatorName),
      datasets: [{
        label: 'Current Value',
        data: metrics.map(m => m.currentValue),
        borderColor: '#2c5aa0',
        backgroundColor: 'rgba(44, 90, 160, 0.1)'
      }]
    };
  }

  /**
   * Generate stakeholder-specific view
   */
  private generateStakeholderView(reportData: ReportData, audience: string): any {
    switch (audience) {
      case 'funder':
        return {
          focus: ['financial_efficiency', 'outcome_achievement', 'scale_potential'],
          sections: ['impact_summary', 'financial_metrics', 'sustainability']
        };
      case 'public':
        return {
          focus: ['community_impact', 'transparency', 'beneficiary_stories'],
          sections: ['impact_summary', 'community_outcomes', 'success_stories']
        };
      default:
        return {
          focus: ['operational_efficiency', 'detailed_analytics', 'improvement_areas'],
          sections: ['detailed_metrics', 'operational_data', 'recommendations']
        };
    }
  }

  /**
   * Get PDF page count (approximate)
   */
  private async getPdfPageCount(pdfBuffer: Uint8Array): Promise<number> {
    // Simple estimation - in production you'd use a proper PDF parsing library
    const content = Buffer.from(pdfBuffer).toString();
    const pageMatches = content.match(/\/Type\s*\/Page[^s]/g);
    return pageMatches ? pageMatches.length : 1;
  }

  /**
   * Fetch report data from database
   */
  async getReportData(reportId: string, organizationId: string): Promise<ReportData> {
    const report = await prisma.userReport.findUnique({
      where: { 
        id: reportId,
        organizationId: organizationId
      },
      include: {
        organization: true,
        creator: true
      }
    });

    if (!report) {
      throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
    }

    // Fetch associated metrics data
    const measurements = await prisma.userMeasurement.findMany({
      where: {
        organizationId: organizationId,
        // Add date filtering based on report period
      },
      include: {
        indicator: true
      }
    });

    // Fetch theory of change
    const theoryOfChange = await prisma.organizationTheoryOfChange.findUnique({
      where: { organizationId: organizationId }
    });

    // Transform data
    const reportData: ReportData = {
      organizationId,
      reportId: report.id,
      title: report.title,
      reportType: report.reportType as any,
      periodStart: report.periodStart || new Date(),
      periodEnd: report.periodEnd || new Date(),
      metrics: measurements
        .filter(m => m.indicatorId && m.value !== null)
        .map(m => ({
          indicatorId: m.indicatorId!,
          indicatorName: m.indicator?.name || 'Unknown Indicator',
          targetValue: undefined, // UserMeasurement doesn't have targetValue in schema
          currentValue: Number(m.value!),
          unit: m.unit || '',
          progress: 75, // Default progress - would need separate target tracking
          trend: this.calculateTrend(Number(m.value!)),
          collectionDate: m.measurementPeriodEnd || m.createdAt,
          dataSource: 'Manual entry' // UserMeasurement doesn't have dataSource in schema
        })),
      theoryOfChange: theoryOfChange ? transformToCamelCase(theoryOfChange) : undefined
    };

    return reportData;
  }

  /**
   * Calculate trend based on current value
   */
  private calculateTrend(current: number, target?: number): 'improving' | 'declining' | 'stable' {
    if (!target) return 'stable';
    const ratio = current / target;
    if (ratio > 0.9) return 'improving';
    if (ratio < 0.5) return 'declining';
    return 'stable';
  }
}

export const reportGenerationService = new ReportGenerationService();