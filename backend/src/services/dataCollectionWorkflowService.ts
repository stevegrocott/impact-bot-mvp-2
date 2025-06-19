import { PrismaClient } from '@prisma/client';
import { transformToCamelCase, transformToSnakeCase } from '../utils/caseTransform';

const prisma = new PrismaClient();

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  methodType: 'survey' | 'interview' | 'focus_group' | 'observation' | 'document_review' | 'automated_data';
  estimatedDuration: string;
  teamRoles: string[];
  steps: WorkflowStep[];
  resources: WorkflowResource[];
  qualityChecks: QualityCheck[];
  sector?: string;
  indicatorTypes: string[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  requiredRole: string;
  dependencies: string[];
  deliverables: string[];
  qualityGates: string[];
}

export interface WorkflowResource {
  type: 'tool' | 'template' | 'guide' | 'software';
  name: string;
  description: string;
  url?: string;
  required: boolean;
  cost?: number;
}

export interface QualityCheck {
  id: string;
  name: string;
  description: string;
  criteria: string[];
  approverRole: string;
  automated: boolean;
}

export interface WorkflowSchedule {
  workflowId: string;
  startDate: Date;
  endDate: Date;
  milestones: WorkflowMilestone[];
  teamAssignments: TeamAssignment[];
  progressTracking: ProgressMetrics;
}

export interface WorkflowMilestone {
  id: string;
  name: string;
  dueDate: Date;
  dependencies: string[];
  deliverables: string[];
  completionCriteria: string[];
}

export interface TeamAssignment {
  stepId: string;
  userId: string;
  role: string;
  estimatedHours: number;
  startDate: Date;
  endDate: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
}

export interface ProgressMetrics {
  overallCompletion: number;
  stepsCompleted: number;
  totalSteps: number;
  hoursSpent: number;
  estimatedHours: number;
  qualityScore: number;
  blockers: WorkflowBlocker[];
}

export interface WorkflowBlocker {
  id: string;
  stepId: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string;
  reportedAt: Date;
  status: 'open' | 'in_progress' | 'resolved';
  resolution?: string;
}

export interface WorkflowPreferences {
  teamSize: 'small' | 'medium' | 'large';
  timeline: 'urgent' | 'normal' | 'extended';
  budget: 'low' | 'medium' | 'high';
  expertise: 'beginner' | 'intermediate' | 'expert';
  dataVolume: 'small' | 'medium' | 'large';
  qualityLevel: 'basic' | 'standard' | 'rigorous';
}

class DataCollectionWorkflowService {

  /**
   * Get workflow templates based on method type and context
   */
  async getWorkflowTemplates(
    methodType?: string,
    sector?: string,
    indicatorType?: string
  ): Promise<WorkflowTemplate[]> {
    // Comprehensive workflow templates for different data collection methods
    const templates: WorkflowTemplate[] = [
      {
        id: 'survey-digital-basic',
        name: 'Digital Survey Collection',
        description: 'Streamlined digital survey workflow for quantitative data collection',
        methodType: 'survey',
        estimatedDuration: '4-6 weeks',
        teamRoles: ['Data Analyst', 'Survey Designer', 'Quality Reviewer'],
        steps: [
          {
            id: 'design',
            name: 'Survey Design & Testing',
            description: 'Create survey instrument with pilot testing',
            estimatedHours: 16,
            requiredRole: 'Survey Designer',
            dependencies: [],
            deliverables: ['Survey instrument', 'Pilot test results'],
            qualityGates: ['Methodology review', 'Pilot validation']
          },
          {
            id: 'deployment',
            name: 'Survey Deployment',
            description: 'Deploy survey and manage data collection',
            estimatedHours: 8,
            requiredRole: 'Data Analyst',
            dependencies: ['design'],
            deliverables: ['Live survey link', 'Collection monitoring'],
            qualityGates: ['Technical validation', 'Response rate monitoring']
          },
          {
            id: 'collection',
            name: 'Data Collection Monitoring',
            description: 'Monitor response rates and data quality',
            estimatedHours: 12,
            requiredRole: 'Data Analyst',
            dependencies: ['deployment'],
            deliverables: ['Collection progress reports', 'Quality assessments'],
            qualityGates: ['Response rate targets', 'Data completeness checks']
          },
          {
            id: 'validation',
            name: 'Data Validation & Cleaning',
            description: 'Clean and validate collected data',
            estimatedHours: 20,
            requiredRole: 'Data Analyst',
            dependencies: ['collection'],
            deliverables: ['Clean dataset', 'Validation report'],
            qualityGates: ['Data quality approval', 'Statistical validation']
          }
        ],
        resources: [
          {
            type: 'software',
            name: 'KoboToolbox',
            description: 'Digital survey platform',
            url: 'https://www.kobotoolbox.org/',
            required: true,
            cost: 0
          },
          {
            type: 'template',
            name: 'Survey Design Template',
            description: 'Best practice survey structure',
            required: true
          }
        ],
        qualityChecks: [
          {
            id: 'methodology-review',
            name: 'Methodology Review',
            description: 'Review survey methodology for bias and completeness',
            criteria: ['Representative sampling', 'Unbiased questions', 'Appropriate length'],
            approverRole: 'Impact Manager',
            automated: false
          },
          {
            id: 'data-quality',
            name: 'Data Quality Check',
            description: 'Automated data quality validation',
            criteria: ['Completeness >85%', 'Logical consistency', 'Range validation'],
            approverRole: 'Data Analyst',
            automated: true
          }
        ],
        indicatorTypes: ['quantitative', 'outcome', 'output']
      },
      {
        id: 'interview-qualitative-deep',
        name: 'Qualitative Interview Study',
        description: 'In-depth qualitative interviews for outcome understanding',
        methodType: 'interview',
        estimatedDuration: '6-8 weeks',
        teamRoles: ['Researcher', 'Interview Facilitator', 'Data Analyst', 'Quality Reviewer'],
        steps: [
          {
            id: 'preparation',
            name: 'Interview Preparation',
            description: 'Develop interview guides and recruit participants',
            estimatedHours: 24,
            requiredRole: 'Researcher',
            dependencies: [],
            deliverables: ['Interview guide', 'Participant list', 'Consent forms'],
            qualityGates: ['Guide validation', 'Ethics approval']
          },
          {
            id: 'conduct',
            name: 'Conduct Interviews',
            description: 'Execute interviews with quality recording',
            estimatedHours: 40,
            requiredRole: 'Interview Facilitator',
            dependencies: ['preparation'],
            deliverables: ['Interview recordings', 'Interview notes'],
            qualityGates: ['Recording quality', 'Note completeness']
          },
          {
            id: 'transcription',
            name: 'Transcription & Coding',
            description: 'Transcribe and code interview data',
            estimatedHours: 60,
            requiredRole: 'Data Analyst',
            dependencies: ['conduct'],
            deliverables: ['Transcripts', 'Coding framework', 'Coded data'],
            qualityGates: ['Transcription accuracy', 'Coding consistency']
          },
          {
            id: 'analysis',
            name: 'Thematic Analysis',
            description: 'Analyze themes and develop insights',
            estimatedHours: 32,
            requiredRole: 'Researcher',
            dependencies: ['transcription'],
            deliverables: ['Thematic analysis', 'Key insights', 'Recommendations'],
            qualityGates: ['Analytical rigor', 'Insight validation']
          }
        ],
        resources: [
          {
            type: 'software',
            name: 'Zoom/Teams',
            description: 'Video interview platform',
            required: true,
            cost: 15
          },
          {
            type: 'software',
            name: 'NVivo/Atlas.ti',
            description: 'Qualitative analysis software',
            required: false,
            cost: 200
          },
          {
            type: 'template',
            name: 'Interview Guide Template',
            description: 'Structured interview framework',
            required: true
          }
        ],
        qualityChecks: [
          {
            id: 'ethics-review',
            name: 'Ethics Review',
            description: 'Ensure ethical interview practices',
            criteria: ['Informed consent', 'Confidentiality', 'Voluntary participation'],
            approverRole: 'Impact Manager',
            automated: false
          },
          {
            id: 'saturation-check',
            name: 'Data Saturation Check',
            description: 'Verify sufficient data collection',
            criteria: ['Theme saturation', 'Adequate sample size', 'Diverse perspectives'],
            approverRole: 'Researcher',
            automated: false
          }
        ],
        indicatorTypes: ['qualitative', 'outcome', 'impact']
      },
      {
        id: 'mixed-methods-comprehensive',
        name: 'Mixed Methods Study',
        description: 'Comprehensive mixed methods approach for complex indicators',
        methodType: 'survey',
        estimatedDuration: '10-12 weeks',
        teamRoles: ['Lead Researcher', 'Survey Designer', 'Interview Facilitator', 'Data Analyst', 'Quality Reviewer'],
        steps: [
          {
            id: 'design-phase',
            name: 'Mixed Methods Design',
            description: 'Design integrated quantitative and qualitative approach',
            estimatedHours: 32,
            requiredRole: 'Lead Researcher',
            dependencies: [],
            deliverables: ['Research design', 'Integration plan', 'Timeline'],
            qualityGates: ['Methodology validation', 'Integration clarity']
          },
          {
            id: 'quantitative-phase',
            name: 'Quantitative Data Collection',
            description: 'Execute survey or quantitative measurement',
            estimatedHours: 48,
            requiredRole: 'Data Analyst',
            dependencies: ['design-phase'],
            deliverables: ['Quantitative dataset', 'Statistical analysis'],
            qualityGates: ['Sample adequacy', 'Statistical validity']
          },
          {
            id: 'qualitative-phase',
            name: 'Qualitative Data Collection',
            description: 'Execute interviews or qualitative measurement',
            estimatedHours: 56,
            requiredRole: 'Interview Facilitator',
            dependencies: ['quantitative-phase'],
            deliverables: ['Qualitative dataset', 'Thematic analysis'],
            qualityGates: ['Data saturation', 'Analytical depth']
          },
          {
            id: 'integration',
            name: 'Data Integration & Synthesis',
            description: 'Integrate findings from both methods',
            estimatedHours: 40,
            requiredRole: 'Lead Researcher',
            dependencies: ['quantitative-phase', 'qualitative-phase'],
            deliverables: ['Integrated findings', 'Synthesis report'],
            qualityGates: ['Integration quality', 'Triangulation validity']
          }
        ],
        resources: [
          {
            type: 'software',
            name: 'SPSS/R',
            description: 'Statistical analysis software',
            required: true,
            cost: 150
          },
          {
            type: 'software',
            name: 'NVivo',
            description: 'Qualitative analysis software',
            required: true,
            cost: 200
          },
          {
            type: 'guide',
            name: 'Mixed Methods Integration Guide',
            description: 'Best practices for data integration',
            required: true
          }
        ],
        qualityChecks: [
          {
            id: 'triangulation-check',
            name: 'Triangulation Validation',
            description: 'Ensure proper data triangulation',
            criteria: ['Method convergence', 'Finding consistency', 'Explanation adequacy'],
            approverRole: 'Lead Researcher',
            automated: false
          }
        ],
        indicatorTypes: ['quantitative', 'qualitative', 'outcome', 'impact']
      },
      {
        id: 'automated-integration',
        name: 'Automated Data Integration',
        description: 'Streamlined workflow for automated data collection from APIs',
        methodType: 'automated_data',
        estimatedDuration: '2-3 weeks',
        teamRoles: ['Data Engineer', 'Data Analyst', 'Quality Reviewer'],
        steps: [
          {
            id: 'api-setup',
            name: 'API Integration Setup',
            description: 'Configure automated data collection from external systems',
            estimatedHours: 16,
            requiredRole: 'Data Engineer',
            dependencies: [],
            deliverables: ['API configurations', 'Data pipeline', 'Error handling'],
            qualityGates: ['Connection validation', 'Data mapping accuracy']
          },
          {
            id: 'validation',
            name: 'Automated Validation',
            description: 'Set up data quality checks and validation rules',
            estimatedHours: 12,
            requiredRole: 'Data Analyst',
            dependencies: ['api-setup'],
            deliverables: ['Validation rules', 'Quality dashboard', 'Alert system'],
            qualityGates: ['Rule completeness', 'Alert accuracy']
          },
          {
            id: 'monitoring',
            name: 'Ongoing Monitoring',
            description: 'Monitor data collection and quality over time',
            estimatedHours: 8,
            requiredRole: 'Data Analyst',
            dependencies: ['validation'],
            deliverables: ['Monitoring dashboard', 'Quality reports'],
            qualityGates: ['System reliability', 'Data consistency']
          }
        ],
        resources: [
          {
            type: 'software',
            name: 'Zapier/Power Automate',
            description: 'Automation platform',
            required: false,
            cost: 20
          },
          {
            type: 'tool',
            name: 'API Documentation',
            description: 'Source system API guides',
            required: true
          }
        ],
        qualityChecks: [
          {
            id: 'data-consistency',
            name: 'Data Consistency Check',
            description: 'Automated data consistency validation',
            criteria: ['Format consistency', 'Value ranges', 'Update frequency'],
            approverRole: 'Data Analyst',
            automated: true
          }
        ],
        indicatorTypes: ['quantitative', 'output', 'automated']
      }
    ];

    // Filter templates based on criteria
    let filteredTemplates = templates;

    if (methodType) {
      filteredTemplates = filteredTemplates.filter(t => t.methodType === methodType);
    }

    if (sector) {
      filteredTemplates = filteredTemplates.filter(t => !t.sector || t.sector === sector);
    }

    if (indicatorType) {
      filteredTemplates = filteredTemplates.filter(t => 
        t.indicatorTypes.includes(indicatorType)
      );
    }

    return filteredTemplates;
  }

  /**
   * Create custom workflow from template with preferences
   */
  async createWorkflowFromTemplate(
    organizationId: string,
    templateId: string,
    customIndicatorId: string,
    preferences: WorkflowPreferences,
    customizations?: Partial<WorkflowTemplate>
  ): Promise<{ workflow: any; schedule: WorkflowSchedule }> {
    const templates = await this.getWorkflowTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error(`Workflow template not found: ${templateId}`);
    }

    // Adjust workflow based on preferences
    const adjustedTemplate = this.adjustWorkflowForPreferences(template, preferences);
    
    // Apply customizations
    const finalTemplate = { ...adjustedTemplate, ...customizations };

    // Create workflow record
    const workflowData = transformToSnakeCase({
      organizationId,
      customIndicatorId,
      templateId,
      name: finalTemplate.name,
      description: finalTemplate.description,
      methodType: finalTemplate.methodType,
      estimatedDuration: finalTemplate.estimatedDuration,
      teamRoles: finalTemplate.teamRoles,
      steps: finalTemplate.steps,
      resources: finalTemplate.resources,
      qualityChecks: finalTemplate.qualityChecks,
      preferences,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // For now, return mock data since we don't have the workflow table
    const workflow = {
      id: `workflow_${Date.now()}`,
      ...workflowData
    };

    // Generate schedule
    const schedule = this.generateWorkflowSchedule(finalTemplate, preferences);

    return transformToCamelCase({ workflow, schedule });
  }

  /**
   * Adjust workflow template based on user preferences
   */
  private adjustWorkflowForPreferences(
    template: WorkflowTemplate,
    preferences: WorkflowPreferences
  ): WorkflowTemplate {
    const adjusted = { ...template };

    // Adjust timeline based on urgency
    if (preferences.timeline === 'urgent') {
      adjusted.steps = adjusted.steps.map(step => ({
        ...step,
        estimatedHours: Math.ceil(step.estimatedHours * 0.8) // 20% reduction for urgent
      }));
    } else if (preferences.timeline === 'extended') {
      adjusted.steps = adjusted.steps.map(step => ({
        ...step,
        estimatedHours: Math.ceil(step.estimatedHours * 1.3) // 30% increase for thorough work
      }));
    }

    // Adjust quality level
    if (preferences.qualityLevel === 'basic') {
      // Remove optional quality checks
      adjusted.qualityChecks = adjusted.qualityChecks.filter(qc => 
        qc.criteria.some(c => c.includes('required') || c.includes('essential'))
      );
    } else if (preferences.qualityLevel === 'rigorous') {
      // Add additional quality steps
      adjusted.qualityChecks.push({
        id: 'peer-review',
        name: 'Peer Review',
        description: 'Independent peer review of methodology and findings',
        criteria: ['Methodology validation', 'Finding verification', 'Bias assessment'],
        approverRole: 'External Reviewer',
        automated: false
      });
    }

    // Adjust team size requirements
    if (preferences.teamSize === 'small') {
      // Combine roles where possible
      adjusted.steps = adjusted.steps.map(step => ({
        ...step,
        requiredRole: step.requiredRole === 'Quality Reviewer' ? 'Data Analyst' : step.requiredRole
      }));
    }

    return adjusted;
  }

  /**
   * Generate workflow schedule with milestones and assignments
   */
  private generateWorkflowSchedule(
    template: WorkflowTemplate,
    preferences: WorkflowPreferences
  ): WorkflowSchedule {
    const now = new Date();
    const totalHours = template.steps.reduce((sum, step) => sum + step.estimatedHours, 0);
    
    // Calculate duration based on team size and preferences
    let workDaysPerWeek = preferences.teamSize === 'large' ? 30 : 
                         preferences.teamSize === 'medium' ? 20 : 10;
    
    if (preferences.timeline === 'urgent') {
      workDaysPerWeek *= 1.5; // More intensive work
    }

    const totalDays = Math.ceil(totalHours / (workDaysPerWeek / 5)); // Convert to calendar days
    const endDate = new Date(now.getTime() + totalDays * 24 * 60 * 60 * 1000);

    // Generate milestones
    const milestones: WorkflowMilestone[] = template.steps.map((step, index) => {
      const stepDays = Math.ceil(step.estimatedHours / (workDaysPerWeek / 5));
      const previousMilestoneDays = template.steps.slice(0, index)
        .reduce((sum, s) => sum + Math.ceil(s.estimatedHours / (workDaysPerWeek / 5)), 0);
      
      const dueDate = new Date(now.getTime() + (previousMilestoneDays + stepDays) * 24 * 60 * 60 * 1000);

      return {
        id: `milestone_${step.id}`,
        name: `Complete ${step.name}`,
        dueDate,
        dependencies: step.dependencies,
        deliverables: step.deliverables,
        completionCriteria: step.qualityGates
      };
    });

    // Generate team assignments (mock data for now)
    const teamAssignments: TeamAssignment[] = template.steps.map(step => ({
      stepId: step.id,
      userId: `user_${step.requiredRole.toLowerCase().replace(' ', '_')}`,
      role: step.requiredRole,
      estimatedHours: step.estimatedHours,
      startDate: now, // Would calculate based on dependencies
      endDate: new Date(now.getTime() + step.estimatedHours * 60 * 60 * 1000), // Simplified
      status: 'not_started' as const
    }));

    return {
      workflowId: `workflow_${Date.now()}`,
      startDate: now,
      endDate,
      milestones,
      teamAssignments,
      progressTracking: {
        overallCompletion: 0,
        stepsCompleted: 0,
        totalSteps: template.steps.length,
        hoursSpent: 0,
        estimatedHours: totalHours,
        qualityScore: 0,
        blockers: []
      }
    };
  }

  /**
   * Get workflow progress tracking
   */
  async getWorkflowProgress(workflowId: string): Promise<ProgressMetrics> {
    // Mock implementation - would query actual workflow data
    return {
      overallCompletion: 0,
      stepsCompleted: 0,
      totalSteps: 4,
      hoursSpent: 0,
      estimatedHours: 96,
      qualityScore: 0,
      blockers: []
    };
  }

  /**
   * Update workflow step status
   */
  async updateStepStatus(
    workflowId: string,
    stepId: string,
    status: 'not_started' | 'in_progress' | 'completed' | 'blocked',
    hoursSpent?: number,
    notes?: string
  ): Promise<void> {
    // Mock implementation - would update actual step status
    console.log(`Updating step ${stepId} in workflow ${workflowId} to status: ${status}`);
    
    if (hoursSpent) {
      console.log(`Hours spent: ${hoursSpent}`);
    }
    
    if (notes) {
      console.log(`Notes: ${notes}`);
    }
  }

  /**
   * Add workflow blocker
   */
  async addWorkflowBlocker(
    workflowId: string,
    stepId: string,
    description: string,
    impact: 'low' | 'medium' | 'high' | 'critical',
    reportedBy: string
  ): Promise<WorkflowBlocker> {
    const blocker: WorkflowBlocker = {
      id: `blocker_${Date.now()}`,
      stepId,
      description,
      impact,
      reportedBy,
      reportedAt: new Date(),
      status: 'open'
    };

    // Mock implementation - would save to database
    console.log('Adding workflow blocker:', blocker);
    
    return blocker;
  }

  /**
   * Get team workload analysis
   */
  async getTeamWorkloadAnalysis(organizationId: string): Promise<{
    teamMembers: any[];
    totalWorkload: number;
    capacityUtilization: number;
    upcomingDeadlines: any[];
    recommendations: string[];
  }> {
    // Mock implementation - would analyze actual team data
    return {
      teamMembers: [
        {
          userId: 'user_data_analyst',
          name: 'Data Analyst',
          currentWorkload: 32,
          capacity: 40,
          utilizationRate: 0.8,
          upcomingTasks: 3
        },
        {
          userId: 'user_researcher',
          name: 'Researcher',
          currentWorkload: 28,
          capacity: 40,
          utilizationRate: 0.7,
          upcomingTasks: 2
        }
      ],
      totalWorkload: 60,
      capacityUtilization: 0.75,
      upcomingDeadlines: [
        {
          workflowId: 'workflow_123',
          stepName: 'Survey Design',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          assignee: 'Data Analyst'
        }
      ],
      recommendations: [
        'Current team capacity allows for 1 additional workflow',
        'Consider extending timeline for survey-based workflows by 1 week',
        'Data Analyst approaching capacity - consider task redistribution'
      ]
    };
  }

  /**
   * Generate workflow recommendations based on indicator and context
   */
  async getWorkflowRecommendations(
    organizationId: string,
    customIndicatorId: string,
    context: {
      sector?: string;
      indicatorType: string;
      targetOutcome: string;
      dataAvailability: 'none' | 'partial' | 'complete';
      timeline: string;
      budget: string;
    }
  ): Promise<{
    recommendedTemplates: WorkflowTemplate[];
    reasoning: string;
    estimatedEffort: {
      hours: number;
      weeks: number;
      teamSize: number;
    };
    riskFactors: string[];
    successFactors: string[];
  }> {
    const templates = await this.getWorkflowTemplates(
      undefined,
      context.sector,
      context.indicatorType
    );

    // Intelligent template recommendation logic
    let recommendedTemplates = templates;

    if (context.dataAvailability === 'complete') {
      recommendedTemplates = templates.filter(t => t.methodType === 'automated_data');
    } else if (context.indicatorType === 'qualitative') {
      recommendedTemplates = templates.filter(t => 
        t.methodType === 'interview' || t.methodType === 'focus_group'
      );
    } else if (context.budget === 'low') {
      recommendedTemplates = templates.filter(t => 
        t.methodType === 'survey' || t.methodType === 'automated_data'
      );
    }

    // If no specific matches, default to mixed methods for comprehensive outcomes
    if (recommendedTemplates.length === 0 && context.indicatorType === 'outcome') {
      recommendedTemplates = templates.filter(t => t.id === 'mixed-methods-comprehensive');
    }

    // If still no matches, return the most basic template
    if (recommendedTemplates.length === 0) {
      recommendedTemplates = templates.filter(t => t.id === 'survey-digital-basic');
    }

    const primaryTemplate = recommendedTemplates[0]!;
    const totalHours = primaryTemplate.steps.reduce((sum, step) => sum + step.estimatedHours, 0);

    return {
      recommendedTemplates: recommendedTemplates.slice(0, 3), // Top 3 recommendations
      reasoning: this.generateRecommendationReasoning(context, primaryTemplate),
      estimatedEffort: {
        hours: totalHours,
        weeks: Math.ceil(totalHours / 40), // Assuming 40 hours per week
        teamSize: primaryTemplate.teamRoles.length
      },
      riskFactors: this.identifyRiskFactors(context, primaryTemplate),
      successFactors: this.identifySuccessFactors(context, primaryTemplate)
    };
  }

  private generateRecommendationReasoning(
    context: any,
    template: WorkflowTemplate
  ): string {
    const reasons = [];

    if (template.methodType === 'automated_data') {
      reasons.push('Automated data collection recommended due to existing data availability');
    } else if (template.methodType === 'survey') {
      reasons.push('Digital survey approach balances cost-effectiveness with data quality');
    } else if (template.methodType === 'interview') {
      reasons.push('Qualitative interviews provide deep insights for outcome measurement');
    }

    if (context.budget === 'low') {
      reasons.push('Cost-effective approach suitable for limited budget');
    }

    if (context.timeline === 'urgent') {
      reasons.push('Streamlined workflow to meet tight timeline requirements');
    }

    return reasons.join('. ') + '.';
  }

  private identifyRiskFactors(context: any, template: WorkflowTemplate): string[] {
    const risks = [];

    if (context.timeline === 'urgent' && template.estimatedDuration.includes('8-10')) {
      risks.push('Tight timeline may compromise data quality');
    }

    if (context.budget === 'low' && template.resources.some(r => r.cost && r.cost > 100)) {
      risks.push('Budget constraints may limit access to recommended tools');
    }

    if (context.dataAvailability === 'none' && template.methodType === 'automated_data') {
      risks.push('No existing data sources identified for automated collection');
    }

    if (template.teamRoles.length > 3 && context.budget === 'low') {
      risks.push('Large team requirements may exceed available resources');
    }

    return risks;
  }

  private identifySuccessFactors(context: any, template: WorkflowTemplate): string[] {
    const factors = [];

    if (template.qualityChecks.length > 2) {
      factors.push('Comprehensive quality assurance framework');
    }

    if (template.methodType === 'survey' && context.indicatorType === 'quantitative') {
      factors.push('Method well-suited to indicator type');
    }

    if (context.dataAvailability === 'partial' && template.methodType === 'interview') {
      factors.push('Qualitative approach can fill data gaps effectively');
    }

    factors.push('Proven workflow template with clear milestones');
    factors.push('Built-in quality gates ensure reliable results');

    return factors;
  }
}

export default new DataCollectionWorkflowService();