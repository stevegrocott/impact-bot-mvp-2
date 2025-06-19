import { PrismaClient } from '@prisma/client';
import { transformToCamelCase, transformToSnakeCase } from '../utils/caseTransform';

const prisma = new PrismaClient();

export interface StakeholderProfile {
  id: string;
  name: string;
  role: 'funder' | 'board_member' | 'beneficiary' | 'government' | 'partner' | 'internal_team' | 'media' | 'evaluator';
  organization?: string;
  contactInfo: ContactInfo;
  reportingPreferences: ReportingPreferences;
  accessLevel: 'public' | 'summary' | 'detailed' | 'full_access';
  tags: string[];
  customFields: Record<string, any>;
}

export interface ContactInfo {
  email: string;
  phone?: string;
  address?: string;
  preferredLanguage: string;
  timezone: string;
  communicationPreference: 'email' | 'portal' | 'print' | 'presentation';
}

export interface ReportingPreferences {
  frequency: 'real_time' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'on_demand';
  format: 'executive_summary' | 'detailed_report' | 'dashboard' | 'infographic' | 'presentation' | 'data_export';
  focusAreas: string[];
  metricsOfInterest: string[];
  narrativeStyle: 'concise' | 'detailed' | 'visual' | 'technical';
  includeMethodology: boolean;
  includeRawData: boolean;
  customSections: CustomSection[];
  dataPreference?: 'visual' | 'narrative' | 'quantitative' | 'mixed';
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
  position: number;
  conditional?: string; // Condition for showing this section
}

export interface StakeholderReport {
  id: string;
  stakeholderId: string;
  templateId: string;
  title: string;
  reportType: 'progress' | 'impact' | 'financial' | 'compliance' | 'evaluation' | 'annual';
  generatedAt: Date;
  reportingPeriod: {
    startDate: Date;
    endDate: Date;
  };
  content: ReportContent;
  deliveryStatus: 'draft' | 'pending_review' | 'approved' | 'delivered' | 'viewed';
  deliveryMethod: 'email' | 'portal_access' | 'download' | 'presentation';
  viewingStats: ViewingStats;
  feedback: StakeholderFeedback[];
}

export interface ReportContent {
  executiveSummary: string;
  keyFindings: KeyFinding[];
  metrics: ReportMetric[];
  narratives: ReportNarrative[];
  visualizations: ReportVisualization[];
  methodology?: string;
  appendices?: ReportAppendix[];
  customSections: CustomSection[];
}

export interface KeyFinding {
  id: string;
  title: string;
  description: string;
  significance: 'high' | 'medium' | 'low';
  supportingData: any[];
  implications: string;
  recommendations?: string[];
}

export interface ReportMetric {
  indicatorId: string;
  name: string;
  value: number | string;
  target?: number | string;
  baseline?: number | string;
  trend: 'improving' | 'stable' | 'declining' | 'mixed';
  contextualNote?: string;
  benchmarkComparison?: BenchmarkComparison;
}

export interface BenchmarkComparison {
  benchmarkValue: number | string;
  benchmarkSource: string;
  performance: 'above' | 'at' | 'below' | 'mixed';
  analysis: string;
}

export interface ReportNarrative {
  id: string;
  section: string;
  title: string;
  content: string;
  tone: 'analytical' | 'celebratory' | 'cautionary' | 'neutral';
  audienceLevel: 'executive' | 'technical' | 'general';
  supportingEvidence: string[];
}

export interface ReportVisualization {
  id: string;
  type: 'chart' | 'infographic' | 'map' | 'timeline' | 'comparison' | 'dashboard';
  title: string;
  description: string;
  config: VisualizationConfig;
  dataSource: string;
  accessibilityDescription: string;
}

export interface VisualizationConfig {
  chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'combo';
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  filters?: Record<string, any>;
  styling?: Record<string, any>;
  annotations?: Annotation[];
}

export interface Annotation {
  type: 'callout' | 'trend_line' | 'target_line' | 'benchmark';
  position: string;
  text: string;
  style?: Record<string, any>;
}

export interface ReportAppendix {
  id: string;
  title: string;
  type: 'methodology' | 'raw_data' | 'references' | 'glossary' | 'additional_analysis';
  content: any;
  accessLevel: 'all' | 'detailed' | 'full_access';
}

export interface ViewingStats {
  viewCount: number;
  lastViewed?: Date;
  avgTimeSpent?: number; // seconds
  sectionsViewed: string[];
  downloadCount: number;
  shareCount: number;
}

export interface StakeholderFeedback {
  id: string;
  stakeholderId: string;
  reportId: string;
  rating: number; // 1-5 scale
  comments: string;
  suggestedImprovements: string[];
  submittedAt: Date;
  followUpRequired: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  targetAudience: string[];
  reportType: string;
  sections: TemplateSection[];
  defaultStyling: StylingConfig;
  variables: TemplateVariable[];
}

export interface TemplateSection {
  id: string;
  name: string;
  title: string;
  description: string;
  required: boolean;
  order: number;
  contentType: 'text' | 'metrics' | 'chart' | 'table' | 'narrative' | 'custom';
  template: string;
  conditions?: string[];
}

export interface StylingConfig {
  colorScheme: string;
  fontFamily: string;
  logoUrl?: string;
  headerStyle: Record<string, any>;
  bodyStyle: Record<string, any>;
  chartStyle: Record<string, any>;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  defaultValue?: any;
  description: string;
  required: boolean;
}

export interface AudienceSegmentation {
  segmentId: string;
  name: string;
  description: string;
  criteria: SegmentationCriteria;
  stakeholders: string[];
  reportingStrategy: ReportingStrategy;
}

export interface SegmentationCriteria {
  roles: string[];
  interests: string[];
  technicalLevel: 'basic' | 'intermediate' | 'advanced';
  decisionMakingPower: 'high' | 'medium' | 'low';
  timeConstraints: 'very_limited' | 'limited' | 'flexible';
  dataPreference: 'visual' | 'narrative' | 'quantitative' | 'mixed';
}

export interface ReportingStrategy {
  primaryFormat: string;
  secondaryFormats: string[];
  frequency: string;
  deliveryTiming: string;
  keyMessages: string[];
  callToAction?: string;
}

class StakeholderReportingService {

  /**
   * Get stakeholder profiles for organization
   */
  async getStakeholderProfiles(organizationId: string): Promise<StakeholderProfile[]> {
    // Mock implementation - would query actual stakeholder data
    return [
      {
        id: 'stakeholder_funder_001',
        name: 'Global Impact Foundation',
        role: 'funder',
        organization: 'Global Impact Foundation',
        contactInfo: {
          email: 'program.officer@globalimpact.org',
          phone: '+1-555-0123',
          preferredLanguage: 'en',
          timezone: 'America/New_York',
          communicationPreference: 'email'
        },
        reportingPreferences: {
          frequency: 'quarterly',
          format: 'executive_summary',
          focusAreas: ['impact_outcomes', 'financial_efficiency', 'sustainability'],
          metricsOfInterest: ['beneficiaries_reached', 'cost_per_outcome', 'leverage_ratio'],
          narrativeStyle: 'concise',
          includeMethodology: false,
          includeRawData: false,
          customSections: []
        },
        accessLevel: 'summary',
        tags: ['major_funder', 'quarterly_reporting', 'impact_focused'],
        customFields: {
          grantAmount: 500000,
          programOfficer: 'Sarah Johnson',
          reportingDeadline: '15th of each quarter'
        }
      },
      {
        id: 'stakeholder_board_001',
        name: 'Board of Directors',
        role: 'board_member',
        contactInfo: {
          email: 'board@organization.org',
          preferredLanguage: 'en',
          timezone: 'America/Los_Angeles',
          communicationPreference: 'presentation'
        },
        reportingPreferences: {
          frequency: 'monthly',
          format: 'presentation',
          focusAreas: ['strategic_progress', 'financial_health', 'organizational_development'],
          metricsOfInterest: ['strategic_objectives', 'financial_position', 'risk_indicators'],
          narrativeStyle: 'detailed',
          includeMethodology: true,
          includeRawData: false,
          customSections: [
            {
              id: 'governance_metrics',
              title: 'Governance & Compliance',
              content: 'Board-specific governance and compliance updates',
              position: 2
            }
          ]
        },
        accessLevel: 'full_access',
        tags: ['governance', 'strategic_oversight', 'monthly_meetings'],
        customFields: {
          meetingSchedule: 'Third Tuesday of each month',
          chairperson: 'Dr. Michael Chen'
        }
      },
      {
        id: 'stakeholder_gov_001',
        name: 'Department of Education',
        role: 'government',
        organization: 'State Department of Education',
        contactInfo: {
          email: 'partnerships@education.state.gov',
          preferredLanguage: 'en',
          timezone: 'America/Chicago',
          communicationPreference: 'portal'
        },
        reportingPreferences: {
          frequency: 'annually',
          format: 'detailed_report',
          focusAreas: ['policy_compliance', 'educational_outcomes', 'public_accountability'],
          metricsOfInterest: ['student_outcomes', 'program_reach', 'compliance_metrics'],
          narrativeStyle: 'technical',
          includeMethodology: true,
          includeRawData: true,
          customSections: []
        },
        accessLevel: 'detailed',
        tags: ['regulatory_compliance', 'policy_alignment', 'public_sector'],
        customFields: {
          regulatoryFramework: 'State Education Code Section 12345',
          complianceOfficer: 'Jennifer Martinez'
        }
      },
      {
        id: 'stakeholder_beneficiary_001',
        name: 'Student Representatives',
        role: 'beneficiary',
        contactInfo: {
          email: 'student.council@program.org',
          preferredLanguage: 'en',
          timezone: 'America/Los_Angeles',
          communicationPreference: 'portal'
        },
        reportingPreferences: {
          frequency: 'monthly',
          format: 'infographic',
          focusAreas: ['program_impact', 'student_experience', 'community_engagement'],
          metricsOfInterest: ['satisfaction_scores', 'skill_development', 'career_outcomes'],
          narrativeStyle: 'visual',
          includeMethodology: false,
          includeRawData: false,
          customSections: [
            {
              id: 'student_stories',
              title: 'Student Success Stories',
              content: 'Personalized impact narratives and testimonials',
              position: 1
            }
          ]
        },
        accessLevel: 'public',
        tags: ['beneficiary_voice', 'community_engagement', 'visual_reports'],
        customFields: {
          representativeCount: 12,
          feedbackMechanism: 'monthly_forums'
        }
      }
    ];
  }

  /**
   * Create targeted report for specific stakeholder
   */
  async generateStakeholderReport(
    organizationId: string,
    stakeholderId: string,
    reportConfig: {
      reportType: string;
      reportingPeriod: { startDate: Date; endDate: Date };
      includeIndicators?: string[];
      customSections?: CustomSection[];
      overrideTemplate?: string;
    }
  ): Promise<StakeholderReport> {
    const stakeholder = await this.getStakeholderById(stakeholderId);
    if (!stakeholder) {
      throw new Error(`Stakeholder not found: ${stakeholderId}`);
    }

    // Select appropriate template based on stakeholder preferences
    const template = await this.selectOptimalTemplate(stakeholder, reportConfig.reportType, reportConfig.overrideTemplate);
    
    // Generate content tailored to stakeholder
    const content = await this.generateTailoredContent(
      organizationId,
      stakeholder,
      template,
      reportConfig
    );

    const report: StakeholderReport = {
      id: `report_${Date.now()}_${stakeholderId}`,
      stakeholderId,
      templateId: template.id,
      title: this.generateReportTitle(stakeholder, reportConfig),
      reportType: reportConfig.reportType as any,
      generatedAt: new Date(),
      reportingPeriod: reportConfig.reportingPeriod,
      content,
      deliveryStatus: 'draft',
      deliveryMethod: stakeholder.contactInfo.communicationPreference as any,
      viewingStats: {
        viewCount: 0,
        sectionsViewed: [],
        downloadCount: 0,
        shareCount: 0
      },
      feedback: []
    };

    return report;
  }

  private async getStakeholderById(stakeholderId: string): Promise<StakeholderProfile | null> {
    const stakeholders = await this.getStakeholderProfiles('org_123'); // Mock org ID
    return stakeholders.find(s => s.id === stakeholderId) || null;
  }

  private async selectOptimalTemplate(
    stakeholder: StakeholderProfile,
    reportType: string,
    overrideTemplate?: string
  ): Promise<ReportTemplate> {
    if (overrideTemplate) {
      const template = await this.getTemplateById(overrideTemplate);
      if (template) return template;
    }

    // Select template based on stakeholder role and preferences
    const templates = await this.getReportTemplates();
    
    // Priority matching: role > format > narrative style
    let bestTemplate = templates.find(t => 
      t.targetAudience.includes(stakeholder.role) &&
      t.reportType === reportType
    );

    if (!bestTemplate) {
      bestTemplate = templates.find(t => t.targetAudience.includes(stakeholder.role));
    }

    if (!bestTemplate) {
      bestTemplate = templates.find(t => t.reportType === reportType);
    }

    return bestTemplate || templates[0]!; // Fallback to first template
  }

  private async generateTailoredContent(
    organizationId: string,
    stakeholder: StakeholderProfile,
    template: ReportTemplate,
    reportConfig: any
  ): Promise<ReportContent> {
    const prefs = stakeholder.reportingPreferences;

    // Generate executive summary tailored to stakeholder
    const executiveSummary = this.generateExecutiveSummary(stakeholder, reportConfig);

    // Generate key findings based on stakeholder interests
    const keyFindings = await this.generateKeyFindings(stakeholder, reportConfig);

    // Generate metrics relevant to stakeholder
    const metrics = await this.generateRelevantMetrics(stakeholder, reportConfig);

    // Generate narratives in preferred style
    const narratives = await this.generateNarratives(stakeholder, template, reportConfig);

    // Generate visualizations appropriate for audience
    const visualizations = await this.generateVisualizations(stakeholder, reportConfig);

    // Include methodology if requested
    const methodology = prefs.includeMethodology ? 
      await this.generateMethodologySection(stakeholder) : undefined;

    // Generate appendices based on access level
    const appendices = await this.generateAppendices(stakeholder, reportConfig);

    // Merge custom sections
    const customSections = [
      ...prefs.customSections,
      ...(reportConfig.customSections || [])
    ];

    return {
      executiveSummary,
      keyFindings,
      metrics,
      narratives,
      visualizations,
      ...(methodology && { methodology }),
      ...(appendices && { appendices }),
      customSections
    };
  }

  private generateExecutiveSummary(stakeholder: StakeholderProfile, reportConfig: any): string {
    const prefs = stakeholder.reportingPreferences;
    
    // Tailor summary length and focus based on stakeholder
    switch (stakeholder.role) {
      case 'funder':
        return `This quarterly report demonstrates significant progress toward our shared impact goals. Key achievements include reaching 1,247 beneficiaries (24% above target), maintaining a 92% satisfaction rate, and achieving a cost-per-outcome of $127 (15% below budget). Our partnership continues to generate measurable social return while building sustainable program capacity.`;
      
      case 'board_member':
        return `Strategic implementation remains on track with strong performance across all organizational pillars. Financial health is robust with 94% budget efficiency, program delivery exceeded targets by 18%, and stakeholder satisfaction scored 4.6/5. Risk mitigation protocols are effective, and we're well-positioned for sustainable growth in the coming quarter.`;
      
      case 'government':
        return `Annual compliance report confirms full adherence to regulatory requirements under State Education Code Section 12345. Program outcomes demonstrate measurable public benefit with 89% participant completion rates and documented skill improvements. All reporting deadlines were met, and audit recommendations have been implemented.`;
      
      case 'beneficiary':
        return `Amazing progress this month! Our community achieved incredible milestones together. 94% of participants reported feeling more confident in their skills, and we celebrated 23 major achievements. Your feedback shaped 5 program improvements, and next month brings exciting new opportunities for growth and connection.`;
      
      default:
        return `This report provides a comprehensive overview of program performance and impact during the specified reporting period. Key metrics demonstrate positive trends across multiple indicators, with significant achievements in outcome delivery and stakeholder satisfaction.`;
    }
  }

  private async generateKeyFindings(stakeholder: StakeholderProfile, reportConfig: any): Promise<KeyFinding[]> {
    const findings: KeyFinding[] = [];

    // Generate findings relevant to stakeholder interests
    if (stakeholder.reportingPreferences.focusAreas.includes('impact_outcomes')) {
      findings.push({
        id: 'finding_impact_001',
        title: 'Significant Outcome Achievement',
        description: 'Program participants demonstrated 34% improvement in key competency assessments compared to baseline',
        significance: 'high',
        supportingData: [
          { metric: 'baseline_score', value: 67 },
          { metric: 'current_score', value: 90 },
          { metric: 'sample_size', value: 156 }
        ],
        implications: 'Strong evidence of program effectiveness validates continued investment and scaling potential',
        recommendations: [
          'Expand successful intervention components to additional cohorts',
          'Document methodology for replication in similar contexts'
        ]
      });
    }

    if (stakeholder.reportingPreferences.focusAreas.includes('financial_efficiency')) {
      findings.push({
        id: 'finding_efficiency_001',
        title: 'Cost Efficiency Improvement',
        description: 'Cost per successful outcome decreased by 18% through process optimization and technology integration',
        significance: 'high',
        supportingData: [
          { metric: 'previous_cost_per_outcome', value: 155 },
          { metric: 'current_cost_per_outcome', value: 127 },
          { metric: 'efficiency_gain', value: 0.18 }
        ],
        implications: 'Demonstrates sustainable path to greater impact within existing resource constraints',
        recommendations: [
          'Scale technology solutions to additional program components',
          'Share efficiency model with partner organizations'
        ]
      });
    }

    return findings;
  }

  private async generateRelevantMetrics(stakeholder: StakeholderProfile, reportConfig: any): Promise<ReportMetric[]> {
    const metrics: ReportMetric[] = [];
    const prefs = stakeholder.reportingPreferences;

    // Generate metrics based on stakeholder interests
    if (prefs.metricsOfInterest.includes('beneficiaries_reached')) {
      metrics.push({
        indicatorId: 'beneficiaries_reached',
        name: 'Beneficiaries Reached',
        value: 1247,
        target: 1000,
        baseline: 850,
        trend: 'improving',
        contextualNote: 'Exceeded target by 24% through expanded outreach efforts',
        benchmarkComparison: {
          benchmarkValue: 980,
          benchmarkSource: 'Similar programs in region',
          performance: 'above',
          analysis: 'Outperforming regional average by 27%'
        }
      });
    }

    if (prefs.metricsOfInterest.includes('satisfaction_scores')) {
      metrics.push({
        indicatorId: 'satisfaction_score',
        name: 'Participant Satisfaction',
        value: 4.6,
        target: 4.0,
        baseline: 3.8,
        trend: 'improving',
        contextualNote: 'Highest satisfaction scores in program history'
      });
    }

    if (prefs.metricsOfInterest.includes('cost_per_outcome')) {
      metrics.push({
        indicatorId: 'cost_per_outcome',
        name: 'Cost per Successful Outcome',
        value: '$127',
        target: '$150',
        baseline: '$180',
        trend: 'improving',
        contextualNote: 'Achieved through process optimization and technology integration'
      });
    }

    return metrics;
  }

  private async generateNarratives(stakeholder: StakeholderProfile, template: ReportTemplate, reportConfig: any): Promise<ReportNarrative[]> {
    const narratives: ReportNarrative[] = [];
    const style = stakeholder.reportingPreferences.narrativeStyle;

    // Tailor narrative style to stakeholder preferences
    switch (style) {
      case 'concise':
        narratives.push({
          id: 'narrative_impact',
          section: 'impact_results',
          title: 'Impact Results',
          content: 'Program delivery exceeded expectations across all key metrics. Participants achieved significant skill improvements while maintaining high engagement levels. Financial efficiency targets were surpassed through strategic optimization initiatives.',
          tone: 'analytical',
          audienceLevel: 'executive',
          supportingEvidence: ['metric_achievements', 'participant_feedback', 'efficiency_data']
        });
        break;
      
      case 'detailed':
        narratives.push({
          id: 'narrative_comprehensive',
          section: 'detailed_analysis',
          title: 'Comprehensive Performance Analysis',
          content: 'The reporting period demonstrated exceptional program performance across multiple dimensions. Quantitative assessments revealed a 34% improvement in participant competency scores, representing the highest gains observed since program inception. This achievement resulted from systematic implementation of evidence-based interventions, enhanced participant support mechanisms, and continuous quality improvement processes. Financial analysis indicates a cost-per-outcome reduction of 18%, achieved through strategic technology integration and process optimization initiatives that maintained service quality while improving operational efficiency.',
          tone: 'analytical',
          audienceLevel: 'technical',
          supportingEvidence: ['detailed_metrics', 'methodology_documentation', 'process_improvements']
        });
        break;
      
      case 'visual':
        narratives.push({
          id: 'narrative_visual',
          section: 'success_stories',
          title: 'Success in Action',
          content: 'Every number tells a story of transformation. From Maria, who gained the confidence to start her own business, to James, who discovered his passion for technology - our community is thriving. These achievements represent more than statistics; they embody hope, growth, and the power of collective support.',
          tone: 'celebratory',
          audienceLevel: 'general',
          supportingEvidence: ['success_stories', 'participant_testimonials', 'visual_evidence']
        });
        break;
    }

    return narratives;
  }

  private async generateVisualizations(stakeholder: StakeholderProfile, reportConfig: any): Promise<ReportVisualization[]> {
    const visualizations: ReportVisualization[] = [];
    const prefs = stakeholder.reportingPreferences;

    // Generate visualizations appropriate for stakeholder
    if (prefs.dataPreference === 'visual' || prefs.format === 'infographic') {
      visualizations.push({
        id: 'viz_progress_overview',
        type: 'infographic',
        title: 'Progress at a Glance',
        description: 'Visual summary of key achievements and metrics',
        config: {
          chartType: 'combo',
          styling: {
            colorScheme: 'impact_theme',
            iconSet: 'celebration',
            layout: 'vertical_flow'
          }
        },
        dataSource: 'aggregated_metrics',
        accessibilityDescription: 'Infographic showing 24% increase in beneficiaries reached, 92% satisfaction rate, and 18% cost efficiency improvement'
      });
    }

    if (prefs.format === 'dashboard') {
      visualizations.push({
        id: 'viz_dashboard',
        type: 'dashboard',
        title: 'Interactive Performance Dashboard',
        description: 'Real-time view of key performance indicators',
        config: {
          filters: {
            time_period: 'selectable',
            program_component: 'multi_select',
            demographic_breakdown: 'toggle'
          },
          styling: {
            layout: 'grid_3x2',
            theme: 'professional'
          }
        },
        dataSource: 'live_metrics',
        accessibilityDescription: 'Interactive dashboard with 6 key metric tiles and filtering capabilities'
      });
    }

    return visualizations;
  }

  private async generateMethodologySection(stakeholder: StakeholderProfile): Promise<string> {
    // Tailor methodology detail to stakeholder technical level and role
    if (stakeholder.role === 'government' || stakeholder.role === 'evaluator') {
      return `Methodology follows randomized controlled trial principles with baseline and endline measurements. Sample size (n=156) provides 80% power to detect 0.3 effect size differences. Data collection employed validated instruments with Cronbach's alpha >0.85. Analysis utilized intention-to-treat principles with multiple imputation for missing data. Quality assurance included double data entry and systematic outlier detection.`;
    } else if (stakeholder.role === 'funder') {
      return `Evaluation employs rigorous outcome measurement with pre-post comparison design. Participant tracking ensures comprehensive data capture with 94% retention rate. External evaluation consultant validated methodology alignment with best practices. Results undergo statistical significance testing and practical significance assessment.`;
    } else {
      return `We use proven measurement approaches to track progress and ensure quality. Our evaluation includes participant surveys, skill assessments, and outcome tracking over time. Independent verification confirms data accuracy and reliability.`;
    }
  }

  private async generateAppendices(stakeholder: StakeholderProfile, reportConfig: any): Promise<ReportAppendix[]> {
    const appendices: ReportAppendix[] = [];

    // Include appendices based on access level and preferences
    if (stakeholder.reportingPreferences.includeRawData && stakeholder.accessLevel === 'full_access') {
      appendices.push({
        id: 'appendix_raw_data',
        title: 'Raw Data Tables',
        type: 'raw_data',
        content: {
          dataDescription: 'Complete dataset with individual participant records',
          fileFormat: 'CSV',
          downloadUrl: '/api/reports/data-export/raw',
          dataPoints: 1247,
          variables: 23
        },
        accessLevel: 'full_access'
      });
    }

    if (stakeholder.reportingPreferences.includeMethodology) {
      appendices.push({
        id: 'appendix_methodology',
        title: 'Detailed Methodology',
        type: 'methodology',
        content: {
          evaluationDesign: 'Pre-post comparison with control group',
          sampleSize: 156,
          dataCollection: 'Mixed methods with validated instruments',
          analysisApproach: 'Intention-to-treat with multiple imputation',
          qualityAssurance: 'Double data entry and statistical verification'
        },
        accessLevel: 'detailed'
      });
    }

    return appendices;
  }

  private generateReportTitle(stakeholder: StakeholderProfile, reportConfig: any): string {
    const period = reportConfig.reportingPeriod;
    const periodStr = this.formatReportingPeriod(period.startDate, period.endDate);
    
    switch (stakeholder.role) {
      case 'funder':
        return `Impact Progress Report - ${periodStr}`;
      case 'board_member':
        return `Board Report: Strategic Performance - ${periodStr}`;
      case 'government':
        return `Compliance & Outcomes Report - ${periodStr}`;
      case 'beneficiary':
        return `Community Impact Update - ${periodStr}`;
      default:
        return `Progress Report - ${periodStr}`;
    }
  }

  private formatReportingPeriod(startDate: Date, endDate: Date): string {
    const start = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const end = endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return start === end ? start : `${start} - ${end}`;
  }

  /**
   * Get available report templates
   */
  async getReportTemplates(): Promise<ReportTemplate[]> {
    return [
      {
        id: 'template_funder_quarterly',
        name: 'Funder Quarterly Report',
        description: 'Concise quarterly report for funders focusing on outcomes and efficiency',
        targetAudience: ['funder'],
        reportType: 'progress',
        sections: [
          {
            id: 'executive_summary',
            name: 'Executive Summary',
            title: 'Executive Summary',
            description: 'High-level overview of progress and achievements',
            required: true,
            order: 1,
            contentType: 'text',
            template: 'executive_summary_funder'
          },
          {
            id: 'key_metrics',
            name: 'Key Performance Metrics',
            title: 'Key Performance Metrics',
            description: 'Core metrics relevant to funder interests',
            required: true,
            order: 2,
            contentType: 'metrics',
            template: 'metrics_summary'
          },
          {
            id: 'financial_summary',
            name: 'Financial Summary',
            title: 'Financial Performance',
            description: 'Budget utilization and cost efficiency',
            required: true,
            order: 3,
            contentType: 'metrics',
            template: 'financial_summary'
          }
        ],
        defaultStyling: {
          colorScheme: 'professional_blue',
          fontFamily: 'Arial',
          headerStyle: { fontSize: '18px', fontWeight: 'bold' },
          bodyStyle: { fontSize: '12px', lineHeight: '1.4' },
          chartStyle: { theme: 'professional' }
        },
        variables: [
          { name: 'reporting_period', type: 'string', defaultValue: 'Q1 2025', description: 'Reporting period', required: true },
          { name: 'program_name', type: 'string', defaultValue: '', description: 'Program name', required: true }
        ]
      },
      {
        id: 'template_board_monthly',
        name: 'Board Monthly Report',
        description: 'Comprehensive monthly report for board governance',
        targetAudience: ['board_member'],
        reportType: 'progress',
        sections: [
          {
            id: 'strategic_overview',
            name: 'Strategic Overview',
            title: 'Strategic Performance Overview',
            description: 'Progress against strategic objectives',
            required: true,
            order: 1,
            contentType: 'narrative',
            template: 'strategic_overview'
          },
          {
            id: 'operational_metrics',
            name: 'Operational Metrics',
            title: 'Operational Performance',
            description: 'Detailed operational performance metrics',
            required: true,
            order: 2,
            contentType: 'metrics',
            template: 'operational_dashboard'
          },
          {
            id: 'risk_management',
            name: 'Risk Management',
            title: 'Risk Assessment & Mitigation',
            description: 'Current risks and mitigation strategies',
            required: true,
            order: 3,
            contentType: 'narrative',
            template: 'risk_assessment'
          }
        ],
        defaultStyling: {
          colorScheme: 'executive_navy',
          fontFamily: 'Times New Roman',
          headerStyle: { fontSize: '20px', fontWeight: 'bold' },
          bodyStyle: { fontSize: '11px', lineHeight: '1.5' },
          chartStyle: { theme: 'executive' }
        },
        variables: [
          { name: 'board_meeting_date', type: 'date', description: 'Board meeting date', required: true },
          { name: 'strategic_priorities', type: 'array', description: 'Current strategic priorities', required: true }
        ]
      }
    ];
  }

  private async getTemplateById(templateId: string): Promise<ReportTemplate | null> {
    const templates = await this.getReportTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  /**
   * Get audience segmentation analysis
   */
  async getAudienceSegmentation(organizationId: string): Promise<AudienceSegmentation[]> {
    return [
      {
        segmentId: 'segment_funders',
        name: 'Grant Funders',
        description: 'Organizations providing financial support with compliance requirements',
        criteria: {
          roles: ['funder'],
          interests: ['impact_outcomes', 'financial_efficiency', 'sustainability'],
          technicalLevel: 'intermediate',
          decisionMakingPower: 'high',
          timeConstraints: 'limited',
          dataPreference: 'quantitative'
        },
        stakeholders: ['stakeholder_funder_001'],
        reportingStrategy: {
          primaryFormat: 'executive_summary',
          secondaryFormats: ['detailed_report'],
          frequency: 'quarterly',
          deliveryTiming: 'first_week_of_quarter',
          keyMessages: [
            'Demonstrate measurable impact and outcomes',
            'Show financial stewardship and efficiency',
            'Highlight sustainability and scaling potential'
          ],
          callToAction: 'Continued partnership and potential expansion'
        }
      },
      {
        segmentId: 'segment_governance',
        name: 'Board & Governance',
        description: 'Board members and governance stakeholders requiring strategic oversight',
        criteria: {
          roles: ['board_member'],
          interests: ['strategic_progress', 'organizational_health', 'risk_management'],
          technicalLevel: 'advanced',
          decisionMakingPower: 'high',
          timeConstraints: 'flexible',
          dataPreference: 'mixed'
        },
        stakeholders: ['stakeholder_board_001'],
        reportingStrategy: {
          primaryFormat: 'presentation',
          secondaryFormats: ['detailed_report', 'dashboard'],
          frequency: 'monthly',
          deliveryTiming: 'board_meeting_preparation',
          keyMessages: [
            'Strategic alignment and progress',
            'Organizational resilience and growth',
            'Stakeholder value creation'
          ]
        }
      }
    ];
  }

  /**
   * Deliver report to stakeholder
   */
  async deliverReport(
    reportId: string,
    deliveryOptions?: {
      customMessage?: string;
      deliveryDate?: Date;
      reminderSchedule?: string[];
    }
  ): Promise<{
    success: boolean;
    deliveryMethod: string;
    trackingId: string;
    estimatedDelivery: Date;
  }> {
    // Mock implementation - would handle actual report delivery
    return {
      success: true,
      deliveryMethod: 'email',
      trackingId: `delivery_${Date.now()}`,
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  /**
   * Track report engagement analytics
   */
  async getReportAnalytics(organizationId: string, timeRange?: { startDate: Date; endDate: Date }): Promise<{
    overview: {
      totalReports: number;
      deliveredReports: number;
      averageViewTime: number;
      stakeholderEngagement: number;
    };
    stakeholderMetrics: Array<{
      stakeholderId: string;
      name: string;
      role: string;
      reportsReceived: number;
      averageViewTime: number;
      lastEngagement: Date;
      preferredFormat: string;
    }>;
    contentPerformance: Array<{
      sectionType: string;
      averageViewTime: number;
      completionRate: number;
      stakeholderRating: number;
    }>;
    formatEffectiveness: Array<{
      format: string;
      engagementScore: number;
      completionRate: number;
      stakeholderSatisfaction: number;
    }>;
  }> {
    // Mock analytics data
    return {
      overview: {
        totalReports: 48,
        deliveredReports: 46,
        averageViewTime: 8.5, // minutes
        stakeholderEngagement: 0.89
      },
      stakeholderMetrics: [
        {
          stakeholderId: 'stakeholder_funder_001',
          name: 'Global Impact Foundation',
          role: 'funder',
          reportsReceived: 4,
          averageViewTime: 12.3,
          lastEngagement: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          preferredFormat: 'executive_summary'
        },
        {
          stakeholderId: 'stakeholder_board_001',
          name: 'Board of Directors',
          role: 'board_member',
          reportsReceived: 12,
          averageViewTime: 18.7,
          lastEngagement: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          preferredFormat: 'presentation'
        }
      ],
      contentPerformance: [
        { sectionType: 'executive_summary', averageViewTime: 3.2, completionRate: 0.94, stakeholderRating: 4.6 },
        { sectionType: 'key_metrics', averageViewTime: 5.8, completionRate: 0.87, stakeholderRating: 4.4 },
        { sectionType: 'detailed_analysis', averageViewTime: 11.2, completionRate: 0.72, stakeholderRating: 4.2 }
      ],
      formatEffectiveness: [
        { format: 'executive_summary', engagementScore: 0.91, completionRate: 0.94, stakeholderSatisfaction: 4.6 },
        { format: 'presentation', engagementScore: 0.88, completionRate: 0.85, stakeholderSatisfaction: 4.5 },
        { format: 'detailed_report', engagementScore: 0.76, completionRate: 0.71, stakeholderSatisfaction: 4.1 }
      ]
    };
  }
}

export default new StakeholderReportingService();