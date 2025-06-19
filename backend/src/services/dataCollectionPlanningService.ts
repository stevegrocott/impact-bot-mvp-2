/**
 * Data Collection Planning Service
 * Comprehensive planning system for custom indicators with method recommendations,
 * validation rules, and quality controls
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';
import { transformToCamelCase } from '@/utils/caseTransform';

const prisma = new PrismaClient();

export interface DataCollectionMethod {
  id: string;
  name: string;
  description: string;
  complexity: 'low' | 'medium' | 'high';
  costLevel: 'low' | 'medium' | 'high';
  timeRequirement: 'minimal' | 'moderate' | 'substantial';
  sampleSizeRecommendation?: string;
  frequencyRecommendation: string[];
  pros: string[];
  cons: string[];
  bestUseCases: string[];
  requiredSkills: string[];
  toolsNeeded: string[];
  qualityControls: string[];
}

export interface DataCollectionPlan {
  indicatorId: string;
  indicatorName: string;
  targetPopulation: string;
  dataCollectionObjective: string;
  primaryMethod: DataCollectionMethod;
  secondaryMethods: DataCollectionMethod[];
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'bi-annually' | 'annually';
  sampleSize: number;
  samplingStrategy: string;
  dataQualityChecks: QualityCheck[];
  timeline: CollectionTimeline;
  resources: ResourceRequirement[];
  riskMitigation: RiskMitigation[];
  validationRules: ValidationRule[];
  ethicalConsiderations: string[];
  estimatedCost: CostEstimate;
  successCriteria: string[];
}

export interface QualityCheck {
  type: 'completeness' | 'accuracy' | 'consistency' | 'timeliness' | 'validity';
  description: string;
  threshold: number;
  automated: boolean;
  frequency: string;
  correctionAction: string;
}

export interface CollectionTimeline {
  preparationWeeks: number;
  pilotWeeks: number;
  fullCollectionWeeks: number;
  analysisWeeks: number;
  totalWeeks: number;
  keyMilestones: Array<{
    week: number;
    milestone: string;
    deliverable: string;
  }>;
}

export interface ResourceRequirement {
  type: 'human' | 'technology' | 'financial' | 'equipment';
  description: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  isOptional: boolean;
}

export interface RiskMitigation {
  risk: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  contingencyPlan: string;
}

export interface ValidationRule {
  field: string;
  ruleType: 'range' | 'format' | 'required' | 'custom';
  rule: string;
  errorMessage: string;
  severity: 'warning' | 'error' | 'critical';
}

export interface CostEstimate {
  setup: number;
  collection: number;
  analysis: number;
  ongoing: number;
  total: number;
  currency: string;
  confidence: 'low' | 'medium' | 'high';
}

export class DataCollectionPlanningService {
  
  /**
   * Generate comprehensive data collection plan for custom indicator
   */
  async generateCollectionPlan(
    organizationId: string,
    customIndicatorId: string,
    planningPreferences: {
      budget?: 'low' | 'medium' | 'high';
      timeframe?: 'urgent' | 'normal' | 'extended';
      precision?: 'basic' | 'standard' | 'high';
      stakeholderEngagement?: 'minimal' | 'moderate' | 'extensive';
    }
  ): Promise<DataCollectionPlan> {
    
    // Get custom indicator details
    const customIndicator = await prisma.userCustomIndicator.findUnique({
      where: { id: customIndicatorId, organizationId },
      include: {
        organization: true,
        creator: true,
        userMeasurements: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customIndicator) {
      throw new AppError('Custom indicator not found', 404, 'INDICATOR_NOT_FOUND');
    }

    // Get organization context for better recommendations
    const orgContext = await this.getOrganizationContext(organizationId);
    
    // Analyze indicator characteristics
    const indicatorAnalysis = this.analyzeIndicatorCharacteristics(customIndicator);
    
    // Generate method recommendations
    const recommendedMethods = await this.recommendDataCollectionMethods(
      indicatorAnalysis,
      planningPreferences,
      orgContext
    );

    if (recommendedMethods.length === 0) {
      throw new AppError('No suitable data collection methods found', 400, 'NO_METHODS_FOUND');
    }

    const primaryMethod = recommendedMethods[0]!; // Safe after length check
    const secondaryMethods = recommendedMethods.slice(1, 3).filter((method): method is DataCollectionMethod => method !== undefined);

    // Create comprehensive plan
    const plan: DataCollectionPlan = {
      indicatorId: customIndicatorId,
      indicatorName: customIndicator.name,
      targetPopulation: this.extractTargetPopulation(customIndicator, orgContext),
      dataCollectionObjective: this.generateObjectiveStatement(customIndicator),
      primaryMethod,
      secondaryMethods,
      frequency: this.recommendFrequency(indicatorAnalysis, planningPreferences),
      sampleSize: this.calculateSampleSize(indicatorAnalysis, planningPreferences),
      samplingStrategy: this.recommendSamplingStrategy(indicatorAnalysis, planningPreferences),
      dataQualityChecks: this.generateQualityChecks(indicatorAnalysis, primaryMethod),
      timeline: this.generateTimeline(primaryMethod, planningPreferences),
      resources: this.estimateResources(primaryMethod, planningPreferences),
      riskMitigation: this.identifyRisks(primaryMethod, indicatorAnalysis),
      validationRules: this.generateValidationRules(customIndicator),
      ethicalConsiderations: this.identifyEthicalConsiderations(indicatorAnalysis),
      estimatedCost: this.estimateCosts(primaryMethod, planningPreferences),
      successCriteria: this.defineSuccessCriteria(indicatorAnalysis, planningPreferences)
    };

    // Save plan to database
    await this.savePlanToDatabase(organizationId, customIndicatorId, plan);

    logger.info('Data collection plan generated', {
      organizationId,
      customIndicatorId,
      primaryMethod: plan.primaryMethod.name,
      estimatedCost: plan.estimatedCost.total,
      timeline: plan.timeline.totalWeeks
    });

    return transformToCamelCase(plan);
  }

  /**
   * Get available data collection methods with detailed information
   */
  async getDataCollectionMethods(
    filterCriteria?: {
      complexity?: 'low' | 'medium' | 'high';
      cost?: 'low' | 'medium' | 'high';
      indicatorType?: string;
    }
  ): Promise<DataCollectionMethod[]> {
    
    const allMethods: DataCollectionMethod[] = [
      {
        id: 'survey-digital',
        name: 'Digital Survey',
        description: 'Online questionnaires distributed via email, SMS, or web platforms',
        complexity: 'low',
        costLevel: 'low',
        timeRequirement: 'minimal',
        sampleSizeRecommendation: '100-500 responses for reliable results',
        frequencyRecommendation: ['monthly', 'quarterly', 'bi-annually'],
        pros: [
          'Cost-effective for large samples',
          'Quick data collection',
          'Automated data processing',
          'Easy to repeat and scale'
        ],
        cons: [
          'Response bias from digital divide',
          'Lower response rates',
          'Limited depth of responses',
          'Requires digital literacy'
        ],
        bestUseCases: [
          'Satisfaction measurements',
          'Knowledge assessments',
          'Behavior change tracking',
          'Program reach evaluation'
        ],
        requiredSkills: ['Survey design', 'Basic statistics', 'Digital platform management'],
        toolsNeeded: ['Survey platform (SurveyMonkey, Typeform)', 'Email distribution', 'Data analysis software'],
        qualityControls: [
          'Response validation rules',
          'Duplicate detection',
          'Completion rate monitoring',
          'Response time analysis'
        ]
      },
      {
        id: 'interview-structured',
        name: 'Structured Interviews',
        description: 'One-on-one interviews using standardized questions',
        complexity: 'medium',
        costLevel: 'medium',
        timeRequirement: 'moderate',
        sampleSizeRecommendation: '15-30 interviews for qualitative insights',
        frequencyRecommendation: ['quarterly', 'bi-annually', 'annually'],
        pros: [
          'Rich, detailed data',
          'High response quality',
          'Clarification opportunities',
          'Relationship building'
        ],
        cons: [
          'Time-intensive',
          'Interviewer bias risk',
          'Limited sample size',
          'Requires skilled interviewers'
        ],
        bestUseCases: [
          'Impact story collection',
          'Behavior change understanding',
          'Program experience evaluation',
          'Stakeholder perception assessment'
        ],
        requiredSkills: ['Interview techniques', 'Active listening', 'Qualitative analysis'],
        toolsNeeded: ['Recording equipment', 'Interview guides', 'Transcription software'],
        qualityControls: [
          'Interview protocol adherence',
          'Inter-rater reliability',
          'Audio quality checks',
          'Transcription accuracy verification'
        ]
      },
      {
        id: 'focus-groups',
        name: 'Focus Groups',
        description: 'Facilitated group discussions with 6-10 participants',
        complexity: 'medium',
        costLevel: 'medium',
        timeRequirement: 'moderate',
        sampleSizeRecommendation: '3-5 focus groups for comprehensive insights',
        frequencyRecommendation: ['quarterly', 'bi-annually', 'annually'],
        pros: [
          'Group dynamics insights',
          'Cost-effective per participant',
          'Rich discussion data',
          'Multiple perspectives'
        ],
        cons: [
          'Dominant voice risk',
          'Group think potential',
          'Scheduling challenges',
          'Facilitator skill dependent'
        ],
        bestUseCases: [
          'Program design feedback',
          'Community perception studies',
          'Service improvement insights',
          'Cultural context understanding'
        ],
        requiredSkills: ['Group facilitation', 'Conflict resolution', 'Qualitative analysis'],
        toolsNeeded: ['Meeting space', 'Recording equipment', 'Facilitation materials'],
        qualityControls: [
          'Balanced participation monitoring',
          'Discussion guide adherence',
          'Recording quality checks',
          'Facilitator bias assessment'
        ]
      },
      {
        id: 'observation-systematic',
        name: 'Systematic Observation',
        description: 'Structured observation using predefined criteria and checklists',
        complexity: 'medium',
        costLevel: 'low',
        timeRequirement: 'moderate',
        sampleSizeRecommendation: '20-50 observation sessions',
        frequencyRecommendation: ['weekly', 'monthly', 'quarterly'],
        pros: [
          'Objective behavior data',
          'Real-time insights',
          'No response bias',
          'Context-rich information'
        ],
        cons: [
          'Observer bias risk',
          'Hawthorne effect',
          'Limited to observable behaviors',
          'Weather/environment dependent'
        ],
        bestUseCases: [
          'Behavior change verification',
          'Service delivery quality',
          'Facility usage monitoring',
          'Skills demonstration assessment'
        ],
        requiredSkills: ['Observation protocols', 'Data recording', 'Behavioral analysis'],
        toolsNeeded: ['Observation checklists', 'Mobile data collection', 'Timing devices'],
        qualityControls: [
          'Inter-observer reliability',
          'Observation protocol compliance',
          'Data completeness checks',
          'Bias detection methods'
        ]
      },
      {
        id: 'administrative-data',
        name: 'Administrative Data Collection',
        description: 'Systematic collection from existing organizational records',
        complexity: 'low',
        costLevel: 'low',
        timeRequirement: 'minimal',
        sampleSizeRecommendation: 'Complete population data when available',
        frequencyRecommendation: ['weekly', 'monthly', 'quarterly'],
        pros: [
          'No additional data collection burden',
          'High reliability',
          'Cost-effective',
          'Longitudinal tracking possible'
        ],
        cons: [
          'Limited to existing data',
          'Data quality dependent on systems',
          'May lack outcome measures',
          'Privacy considerations'
        ],
        bestUseCases: [
          'Service delivery tracking',
          'Participation monitoring',
          'Financial performance',
          'Operational efficiency'
        ],
        requiredSkills: ['Data management', 'System integration', 'Quality assurance'],
        toolsNeeded: ['Database access', 'Data extraction tools', 'Quality control systems'],
        qualityControls: [
          'Data accuracy verification',
          'Completeness assessment',
          'Consistency checks',
          'Regular system audits'
        ]
      },
      {
        id: 'mobile-data',
        name: 'Mobile Data Collection',
        description: 'Field data collection using mobile devices and apps',
        complexity: 'medium',
        costLevel: 'medium',
        timeRequirement: 'moderate',
        sampleSizeRecommendation: 'Flexible based on coverage area',
        frequencyRecommendation: ['weekly', 'monthly', 'quarterly'],
        pros: [
          'Real-time data capture',
          'GPS location tracking',
          'Multimedia data collection',
          'Offline capability'
        ],
        cons: [
          'Technology requirements',
          'Training needs',
          'Device management',
          'Connectivity dependencies'
        ],
        bestUseCases: [
          'Field monitoring',
          'Community-based data collection',
          'Geographic coverage',
          'Photo/video documentation'
        ],
        requiredSkills: ['Mobile app usage', 'Digital literacy', 'Field coordination'],
        toolsNeeded: ['Mobile devices', 'Data collection apps', 'Cloud storage'],
        qualityControls: [
          'GPS verification',
          'Photo quality standards',
          'Data synchronization checks',
          'Device security protocols'
        ]
      }
    ];

    // Filter methods based on criteria
    let filteredMethods = allMethods;
    
    if (filterCriteria?.complexity) {
      filteredMethods = filteredMethods.filter(m => m.complexity === filterCriteria.complexity);
    }
    
    if (filterCriteria?.cost) {
      filteredMethods = filteredMethods.filter(m => m.costLevel === filterCriteria.cost);
    }

    return filteredMethods;
  }

  /**
   * Validate data collection plan feasibility
   */
  async validatePlanFeasibility(
    organizationId: string,
    plan: DataCollectionPlan
  ): Promise<{
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
    feasibilityScore: number;
  }> {
    
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let feasibilityScore = 100;

    // Get organization capacity
    const orgContext = await this.getOrganizationContext(organizationId);

    // Check budget feasibility
    if (plan.estimatedCost.total > orgContext.estimatedBudget * 0.3) {
      warnings.push('Plan cost exceeds 30% of estimated organizational budget');
      feasibilityScore -= 20;
      recommendations.push('Consider lower-cost methods or phased implementation');
    }

    // Check timeline feasibility
    if (plan.timeline.totalWeeks > 26) {
      warnings.push('Plan timeline exceeds 6 months, may face sustainability challenges');
      feasibilityScore -= 10;
      recommendations.push('Consider breaking into smaller phases');
    }

    // Check sample size vs population
    if (plan.sampleSize > orgContext.estimatedBeneficiaries * 0.5) {
      warnings.push('Sample size is large relative to target population');
      feasibilityScore -= 15;
      recommendations.push('Review sampling strategy for efficiency');
    }

    // Check resource requirements
    const totalStaffHours = plan.resources
      .filter(r => r.type === 'human')
      .reduce((sum, r) => sum + r.quantity, 0);

    if (totalStaffHours > orgContext.availableStaffHours * 0.2) {
      warnings.push('Plan requires significant staff time commitment');
      feasibilityScore -= 15;
      recommendations.push('Consider automation or external support');
    }

    // Check method complexity vs organizational capacity
    if (plan.primaryMethod.complexity === 'high' && orgContext.dataCapacity === 'low') {
      warnings.push('Primary method complexity may exceed organizational capacity');
      feasibilityScore -= 25;
      recommendations.push('Consider simpler methods or capacity building first');
    }

    const isValid = feasibilityScore >= 60;

    return {
      isValid,
      warnings,
      recommendations,
      feasibilityScore
    };
  }

  /**
   * Generate implementation checklist for data collection plan
   */
  async generateImplementationChecklist(
    plan: DataCollectionPlan
  ): Promise<{
    categories: Array<{
      name: string;
      tasks: Array<{
        task: string;
        description: string;
        estimatedHours: number;
        dependencies: string[];
        responsible: string;
        dueWeek: number;
        priority: 'high' | 'medium' | 'low';
      }>;
    }>;
    totalEstimatedHours: number;
  }> {
    
    const checklist = {
      categories: [
        {
          name: 'Planning & Design',
          tasks: [
            {
              task: 'Finalize data collection instruments',
              description: 'Complete surveys, interview guides, or observation checklists',
              estimatedHours: 8,
              dependencies: [],
              responsible: 'M&E Lead',
              dueWeek: 1,
              priority: 'high' as const
            },
            {
              task: 'Obtain ethical approvals',
              description: 'Secure necessary permissions and consent forms',
              estimatedHours: 4,
              dependencies: ['Finalize data collection instruments'],
              responsible: 'Program Manager',
              dueWeek: 2,
              priority: 'high' as const
            },
            {
              task: 'Recruit and train data collectors',
              description: 'Identify, hire, and train data collection team',
              estimatedHours: 16,
              dependencies: ['Obtain ethical approvals'],
              responsible: 'Field Coordinator',
              dueWeek: 3,
              priority: 'high' as const
            }
          ]
        },
        {
          name: 'Technology Setup',
          tasks: [
            {
              task: 'Configure data collection platform',
              description: 'Set up digital tools and test functionality',
              estimatedHours: 6,
              dependencies: [],
              responsible: 'IT Support',
              dueWeek: 2,
              priority: 'medium' as const
            },
            {
              task: 'Create data quality dashboards',
              description: 'Build monitoring tools for real-time quality checks',
              estimatedHours: 10,
              dependencies: ['Configure data collection platform'],
              responsible: 'Data Analyst',
              dueWeek: 4,
              priority: 'medium' as const
            }
          ]
        },
        {
          name: 'Pilot Testing',
          tasks: [
            {
              task: 'Conduct pilot data collection',
              description: 'Test methods with small sample',
              estimatedHours: 12,
              dependencies: ['Recruit and train data collectors', 'Configure data collection platform'],
              responsible: 'Data Collection Team',
              dueWeek: 4,
              priority: 'high' as const
            },
            {
              task: 'Analyze pilot results and refine',
              description: 'Review pilot data and adjust methods',
              estimatedHours: 6,
              dependencies: ['Conduct pilot data collection'],
              responsible: 'M&E Lead',
              dueWeek: 5,
              priority: 'high' as const
            }
          ]
        },
        {
          name: 'Full Implementation',
          tasks: [
            {
              task: 'Launch full data collection',
              description: 'Begin systematic data collection',
              estimatedHours: plan.timeline.fullCollectionWeeks * 4,
              dependencies: ['Analyze pilot results and refine'],
              responsible: 'Data Collection Team',
              dueWeek: 6,
              priority: 'high' as const
            },
            {
              task: 'Monitor data quality continuously',
              description: 'Regular quality checks and corrections',
              estimatedHours: plan.timeline.fullCollectionWeeks * 2,
              dependencies: ['Launch full data collection'],
              responsible: 'Data Analyst',
              dueWeek: 6,
              priority: 'high' as const
            }
          ]
        }
      ],
      totalEstimatedHours: 0
    };

    // Calculate total hours
    checklist.totalEstimatedHours = checklist.categories.reduce((total, category) => {
      return total + category.tasks.reduce((catTotal, task) => catTotal + task.estimatedHours, 0);
    }, 0);

    return checklist;
  }

  // ================================
  // Private Helper Methods
  // ================================

  private async getOrganizationContext(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        userOrganizations: true,
        userCustomIndicators: true,
        userReports: true
      }
    });

    return {
      size: org?.sizeCategory || 'small',
      staffCount: org?.userOrganizations.length || 5,
      dataCapacity: this.assessDataCapacity(org),
      estimatedBudget: this.estimateBudget(org),
      estimatedBeneficiaries: this.estimateBeneficiaries(org),
      availableStaffHours: (org?.userOrganizations.length || 5) * 40 * 0.1 // 10% of staff time
    };
  }

  private analyzeIndicatorCharacteristics(indicator: any) {
    return {
      type: this.classifyIndicatorType(indicator.name, indicator.description),
      complexity: this.assessIndicatorComplexity(indicator),
      dataType: this.inferDataType(indicator),
      stakeholders: this.identifyStakeholders(indicator),
      context: this.extractContext(indicator)
    };
  }

  private async recommendDataCollectionMethods(
    analysis: any,
    preferences: any,
    orgContext: any
  ): Promise<DataCollectionMethod[]> {
    
    const allMethods = await this.getDataCollectionMethods();
    
    // Score methods based on analysis and preferences
    const scoredMethods = allMethods.map(method => ({
      method,
      score: this.scoreMethod(method, analysis, preferences, orgContext)
    }));

    // Sort by score and return top methods
    return scoredMethods
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(sm => sm.method);
  }

  private scoreMethod(method: DataCollectionMethod, analysis: any, preferences: any, orgContext: any): number {
    let score = 50; // Base score

    // Budget alignment
    if (preferences.budget === 'low' && method.costLevel === 'low') score += 20;
    if (preferences.budget === 'high' && method.costLevel === 'high') score += 10;

    // Complexity alignment with org capacity
    if (method.complexity === 'low' && orgContext.dataCapacity === 'low') score += 15;
    if (method.complexity === 'high' && orgContext.dataCapacity === 'high') score += 15;

    // Timeframe alignment
    if (preferences.timeframe === 'urgent' && method.timeRequirement === 'minimal') score += 15;
    if (preferences.timeframe === 'extended' && method.timeRequirement === 'substantial') score += 10;

    return score;
  }

  private recommendFrequency(analysis: any, preferences: any): 'weekly' | 'monthly' | 'quarterly' | 'bi-annually' | 'annually' {
    if (analysis.type === 'outcome') return 'quarterly';
    if (analysis.type === 'output') return 'monthly';
    if (analysis.type === 'impact') return 'annually';
    return 'quarterly';
  }

  private calculateSampleSize(analysis: any, preferences: any): number {
    const baseSize = 100;
    if (preferences.precision === 'high') return baseSize * 2;
    if (preferences.precision === 'basic') return baseSize * 0.5;
    return baseSize;
  }

  private recommendSamplingStrategy(analysis: any, preferences: any): string {
    if (preferences.stakeholderEngagement === 'extensive') {
      return 'Stratified random sampling across all stakeholder groups';
    }
    return 'Simple random sampling from target population';
  }

  private generateQualityChecks(analysis: any, method: DataCollectionMethod): QualityCheck[] {
    return [
      {
        type: 'completeness',
        description: 'Ensure all required fields are completed',
        threshold: 95,
        automated: true,
        frequency: 'daily',
        correctionAction: 'Follow up with incomplete responses'
      },
      {
        type: 'accuracy',
        description: 'Validate data against expected ranges',
        threshold: 90,
        automated: true,
        frequency: 'real-time',
        correctionAction: 'Flag outliers for manual review'
      }
    ];
  }

  private generateTimeline(method: DataCollectionMethod, preferences: any): CollectionTimeline {
    const baseWeeks = method.timeRequirement === 'minimal' ? 8 : 
                     method.timeRequirement === 'moderate' ? 12 : 16;
    
    return {
      preparationWeeks: 2,
      pilotWeeks: 1,
      fullCollectionWeeks: baseWeeks * 0.6,
      analysisWeeks: 2,
      totalWeeks: baseWeeks,
      keyMilestones: [
        { week: 1, milestone: 'Planning Complete', deliverable: 'Data collection plan' },
        { week: 3, milestone: 'Pilot Complete', deliverable: 'Pilot results report' },
        { week: baseWeeks - 2, milestone: 'Collection Complete', deliverable: 'Raw dataset' },
        { week: baseWeeks, milestone: 'Analysis Complete', deliverable: 'Analysis report' }
      ]
    };
  }

  private estimateResources(method: DataCollectionMethod, preferences: any): ResourceRequirement[] {
    return [
      {
        type: 'human',
        description: 'Data collection coordinator',
        quantity: 1,
        unit: 'person',
        estimatedCost: 2000,
        isOptional: false
      },
      {
        type: 'technology',
        description: 'Data collection platform subscription',
        quantity: 1,
        unit: 'license',
        estimatedCost: 500,
        isOptional: false
      }
    ];
  }

  private identifyRisks(method: DataCollectionMethod, analysis: any): RiskMitigation[] {
    return [
      {
        risk: 'Low response rate',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Implement incentive strategy and multiple contact attempts',
        contingencyPlan: 'Expand sample size by 50%'
      },
      {
        risk: 'Data quality issues',
        probability: 'low',
        impact: 'medium',
        mitigation: 'Implement real-time validation checks',
        contingencyPlan: 'Manual data cleaning and verification process'
      }
    ];
  }

  private generateValidationRules(indicator: any): ValidationRule[] {
    return [
      {
        field: 'responseValue',
        ruleType: 'required',
        rule: 'not_empty',
        errorMessage: 'Response value is required',
        severity: 'error'
      },
      {
        field: 'collectionDate',
        ruleType: 'range',
        rule: 'within_last_30_days',
        errorMessage: 'Collection date must be within the last 30 days',
        severity: 'warning'
      }
    ];
  }

  private identifyEthicalConsiderations(analysis: any): string[] {
    return [
      'Obtain informed consent from all participants',
      'Ensure data privacy and confidentiality',
      'Provide option to withdraw from study',
      'Minimize burden on vulnerable populations',
      'Share results with participating communities'
    ];
  }

  private estimateCosts(method: DataCollectionMethod, preferences: any): CostEstimate {
    const baseCost = method.costLevel === 'low' ? 1000 : 
                    method.costLevel === 'medium' ? 3000 : 6000;
    
    return {
      setup: baseCost * 0.3,
      collection: baseCost * 0.5,
      analysis: baseCost * 0.15,
      ongoing: baseCost * 0.05,
      total: baseCost,
      currency: 'USD',
      confidence: 'medium'
    };
  }

  private defineSuccessCriteria(analysis: any, preferences: any): string[] {
    return [
      'Achieve 80% response rate from target population',
      'Maintain data quality score above 90%',
      'Complete data collection within planned timeline',
      'Stay within 110% of estimated budget',
      'Generate actionable insights for program improvement'
    ];
  }

  private async savePlanToDatabase(organizationId: string, indicatorId: string, plan: DataCollectionPlan): Promise<void> {
    // Save plan as JSON in the custom indicator's metadata
    await prisma.userCustomIndicator.update({
      where: { id: indicatorId, organizationId },
      data: {
        dataCollectionGuidance: JSON.stringify({
          plan,
          generatedAt: new Date(),
          version: '1.0'
        })
      }
    });
  }

  // Helper methods for analysis
  private assessDataCapacity(org: any): 'low' | 'medium' | 'high' {
    const reportCount = org?.userReports?.length || 0;
    const indicatorCount = org?.userCustomIndicators?.length || 0;
    
    if (reportCount > 5 || indicatorCount > 10) return 'high';
    if (reportCount > 2 || indicatorCount > 5) return 'medium';
    return 'low';
  }

  private estimateBudget(org: any): number {
    const sizeMap = { 'small': 50000, 'medium': 200000, 'large': 500000 };
    return sizeMap[org?.sizeCategory as keyof typeof sizeMap] || 50000;
  }

  private estimateBeneficiaries(org: any): number {
    const sizeMap = { 'small': 500, 'medium': 2000, 'large': 10000 };
    return sizeMap[org?.sizeCategory as keyof typeof sizeMap] || 500;
  }

  private classifyIndicatorType(name: string, description: string): 'output' | 'outcome' | 'impact' {
    const text = `${name} ${description}`.toLowerCase();
    if (text.includes('impact') || text.includes('change') || text.includes('transformation')) return 'impact';
    if (text.includes('outcome') || text.includes('result') || text.includes('effect')) return 'outcome';
    return 'output';
  }

  private assessIndicatorComplexity(indicator: any): 'low' | 'medium' | 'high' {
    const hasCalculation = !!indicator.calculationMethod;
    const hasGuidance = !!indicator.dataCollectionGuidance;
    const nameLength = indicator.name.length;
    
    if (hasCalculation && hasGuidance && nameLength > 50) return 'high';
    if (hasCalculation || hasGuidance || nameLength > 30) return 'medium';
    return 'low';
  }

  private inferDataType(indicator: any): 'quantitative' | 'qualitative' | 'mixed' {
    const text = `${indicator.name} ${indicator.description || ''}`.toLowerCase();
    const hasNumbers = /\d|number|count|rate|percent|ratio/.test(text);
    const hasQual = /story|experience|satisfaction|perception|quality/.test(text);
    
    if (hasNumbers && hasQual) return 'mixed';
    if (hasNumbers) return 'quantitative';
    return 'qualitative';
  }

  private identifyStakeholders(indicator: any): string[] {
    const text = `${indicator.name} ${indicator.description || ''}`.toLowerCase();
    const stakeholders = [];
    
    if (text.includes('beneficiar') || text.includes('client') || text.includes('participant')) {
      stakeholders.push('beneficiaries');
    }
    if (text.includes('staff') || text.includes('team') || text.includes('employee')) {
      stakeholders.push('staff');
    }
    if (text.includes('partner') || text.includes('community') || text.includes('stakeholder')) {
      stakeholders.push('community');
    }
    
    return stakeholders.length > 0 ? stakeholders : ['beneficiaries'];
  }

  private extractContext(indicator: any): string {
    return indicator.description || `Context for ${indicator.name}`;
  }

  private extractTargetPopulation(indicator: any, orgContext: any): string {
    const stakeholders = this.identifyStakeholders(indicator);
    return `${stakeholders.join(', ')} served by ${orgContext.size} organization`;
  }

  private generateObjectiveStatement(indicator: any): string {
    return `Collect reliable data to measure ${indicator.name} and inform program improvement decisions`;
  }
}

export const dataCollectionPlanningService = new DataCollectionPlanningService();