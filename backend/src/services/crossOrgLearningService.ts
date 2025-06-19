import { PrismaClient } from '@prisma/client';
import { transformToCamelCase, transformToSnakeCase } from '../utils/caseTransform';

const prisma = new PrismaClient();

export interface OrganizationPattern {
  id: string;
  organizationId: string;
  patternType: 'theory_development' | 'indicator_selection' | 'measurement_approach' | 'stakeholder_engagement' | 'data_collection' | 'reporting';
  description: string;
  context: PatternContext;
  metrics: PatternMetrics;
  outcomes: PatternOutcome[];
  extractedAt: Date;
  validatedBy: string[];
  confidenceScore: number;
  anonymized: boolean;
}

export interface PatternContext {
  sector: string;
  organizationSize: 'small' | 'medium' | 'large';
  geography: string;
  foundationReadiness: number;
  teamExperience: 'novice' | 'intermediate' | 'expert';
  resourceLevel: 'low' | 'medium' | 'high';
  stakeholderComplexity: 'simple' | 'moderate' | 'complex';
  timeConstraints: 'tight' | 'moderate' | 'flexible';
}

export interface PatternMetrics {
  timeToCompletion: number; // days
  qualityScore: number; // 0-100
  stakeholderSatisfaction: number; // 0-100
  adoptionRate: number; // 0-100
  sustainabilityScore: number; // 0-100
  costEfficiency: number; // 0-100
  errorRate: number; // 0-100
  revisionCount: number;
}

export interface PatternOutcome {
  metric: string;
  value: number;
  improvement: number;
  timeframe: string;
  confidence: number;
  source: string;
}

export interface LearningInsight {
  id: string;
  title: string;
  category: 'best_practice' | 'pitfall_prevention' | 'optimization' | 'innovation';
  description: string;
  evidence: Evidence[];
  applicability: ApplicabilityRule[];
  recommendations: string[];
  successFactors: string[];
  riskFactors: string[];
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  adoptionComplexity: 'simple' | 'moderate' | 'complex';
  resourceRequirement: 'low' | 'medium' | 'high';
}

export interface Evidence {
  organizationCount: number;
  successRate: number;
  averageImprovement: number;
  statisticalSignificance: number;
  contextVariations: string[];
  outliers: string[];
}

export interface ApplicabilityRule {
  condition: string;
  applicabilityScore: number;
  contextRequirements: string[];
  adaptationNotes: string[];
}

export interface BenchmarkData {
  metric: string;
  organizationValue: number;
  peerAverage: number;
  topQuartile: number;
  bottomQuartile: number;
  organizationPercentile: number;
  trendDirection: 'improving' | 'stable' | 'declining';
  peerGroup: PeerGroup;
  recommendedTargets: RecommendedTarget[];
}

export interface PeerGroup {
  id: string;
  name: string;
  description: string;
  criteria: string[];
  organizationCount: number;
  averagePerformance: Record<string, number>;
}

export interface RecommendedTarget {
  timeframe: string;
  target: number;
  confidence: number;
  requiredActions: string[];
  successProbability: number;
}

export interface PatternRecommendation {
  id: string;
  organizationId: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  rationale: string;
  evidenceBase: LearningInsight[];
  implementationSteps: ImplementationStep[];
  expectedOutcomes: ExpectedOutcome[];
  riskAssessment: RiskAssessment;
  resourceRequirements: ResourceRequirement[];
  successIndicators: string[];
  timeframe: string;
  confidence: number;
}

export interface ImplementationStep {
  order: number;
  title: string;
  description: string;
  duration: string;
  dependencies: string[];
  resources: string[];
  risks: string[];
  successCriteria: string[];
}

export interface ExpectedOutcome {
  metric: string;
  baseline: number;
  target: number;
  timeframe: string;
  confidence: number;
  assumptions: string[];
}

export interface RiskAssessment {
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigationStrategies: string[];
  contingencyPlans: string[];
}

export interface ResourceRequirement {
  type: 'time' | 'budget' | 'expertise' | 'technology' | 'stakeholder_engagement';
  amount: string;
  description: string;
  alternatives: string[];
}

export interface CrossOrgAnalytics {
  platformInsights: {
    totalOrganizations: number;
    activePatterns: number;
    averageImprovementRate: number;
    topPerformingSectors: string[];
    emergingTrends: string[];
  };
  learningEffectiveness: {
    patternAdoptionRate: number;
    averageImplementationTime: number;
    successRate: number;
    userSatisfaction: number;
    knowledgeRetention: number;
  };
  benchmarkingMetrics: {
    participatingOrganizations: number;
    benchmarkCategories: number;
    averagePerformanceGap: number;
    improvementTrajectory: number;
  };
  innovationTracking: {
    noviceApproaches: number;
    validatedInnovations: number;
    scaledPractices: number;
    failedExperiments: number;
  };
}

class CrossOrgLearningService {

  /**
   * Extract patterns from organization data
   */
  async extractOrganizationPatterns(organizationId: string): Promise<OrganizationPattern[]> {
    // This would analyze the organization's actual data to extract patterns
    // For now, returning mock patterns based on different aspects
    
    const mockPatterns: OrganizationPattern[] = [
      {
        id: `pattern_${organizationId}_theory`,
        organizationId,
        patternType: 'theory_development',
        description: 'Iterative theory of change development with stakeholder validation',
        context: {
          sector: 'education',
          organizationSize: 'medium',
          geography: 'north_america',
          foundationReadiness: 75,
          teamExperience: 'intermediate',
          resourceLevel: 'medium',
          stakeholderComplexity: 'moderate',
          timeConstraints: 'moderate'
        },
        metrics: {
          timeToCompletion: 14,
          qualityScore: 87,
          stakeholderSatisfaction: 91,
          adoptionRate: 89,
          sustainabilityScore: 83,
          costEfficiency: 76,
          errorRate: 12,
          revisionCount: 3
        },
        outcomes: [
          {
            metric: 'foundation_readiness',
            value: 87,
            improvement: 32,
            timeframe: '2_weeks',
            confidence: 95,
            source: 'foundation_assessment'
          },
          {
            metric: 'stakeholder_alignment',
            value: 91,
            improvement: 28,
            timeframe: '2_weeks',
            confidence: 88,
            source: 'stakeholder_survey'
          }
        ],
        extractedAt: new Date(),
        validatedBy: ['system_analysis', 'peer_review'],
        confidenceScore: 92,
        anonymized: true
      },
      {
        id: `pattern_${organizationId}_indicators`,
        organizationId,
        patternType: 'indicator_selection',
        description: 'IRIS+ aligned indicator selection with custom outcome metrics',
        context: {
          sector: 'education',
          organizationSize: 'medium',
          geography: 'north_america',
          foundationReadiness: 87,
          teamExperience: 'intermediate',
          resourceLevel: 'medium',
          stakeholderComplexity: 'moderate',
          timeConstraints: 'moderate'
        },
        metrics: {
          timeToCompletion: 8,
          qualityScore: 94,
          stakeholderSatisfaction: 88,
          adoptionRate: 92,
          sustainabilityScore: 89,
          costEfficiency: 82,
          errorRate: 8,
          revisionCount: 2
        },
        outcomes: [
          {
            metric: 'measurement_quality',
            value: 94,
            improvement: 25,
            timeframe: '1_week',
            confidence: 92,
            source: 'quality_assessment'
          }
        ],
        extractedAt: new Date(),
        validatedBy: ['methodology_review', 'outcome_tracking'],
        confidenceScore: 89,
        anonymized: true
      }
    ];

    return mockPatterns;
  }

  /**
   * Generate learning insights from cross-organizational patterns
   */
  async generateLearningInsights(
    context?: {
      sector?: string;
      organizationSize?: string;
      geography?: string;
    }
  ): Promise<LearningInsight[]> {
    // This would analyze patterns across organizations to extract insights
    // For now, returning curated insights based on common patterns
    
    const insights: LearningInsight[] = [
      {
        id: 'insight_stakeholder_early_engagement',
        title: 'Early Stakeholder Engagement Accelerates Foundation Development',
        category: 'best_practice',
        description: 'Organizations that engage stakeholders in theory validation within the first week show 40% faster foundation completion and 28% higher stakeholder satisfaction.',
        evidence: [
          {
            organizationCount: 47,
            successRate: 89,
            averageImprovement: 32,
            statisticalSignificance: 0.02,
            contextVariations: ['education', 'healthcare', 'community_development'],
            outliers: ['highly_technical_sectors', 'regulatory_constrained']
          }
        ],
        applicability: [
          {
            condition: 'foundation_readiness < 60',
            applicabilityScore: 95,
            contextRequirements: ['stakeholder_availability', 'team_capacity'],
            adaptationNotes: ['Schedule initial stakeholder sessions within first week', 'Use structured validation frameworks']
          },
          {
            condition: 'stakeholder_complexity = moderate OR complex',
            applicabilityScore: 87,
            contextRequirements: ['facilitation_expertise', 'clear_communication_strategy'],
            adaptationNotes: ['Consider phased engagement approach', 'Prepare stakeholder-specific materials']
          }
        ],
        recommendations: [
          'Schedule stakeholder validation sessions within first week of theory development',
          'Use structured validation frameworks to maximize feedback quality',
          'Document and address stakeholder concerns immediately',
          'Create stakeholder-specific communication materials'
        ],
        successFactors: [
          'Clear communication of theory purpose and process',
          'Structured feedback collection mechanisms',
          'Quick response to stakeholder input',
          'Regular progress updates to stakeholders'
        ],
        riskFactors: [
          'Stakeholder availability constraints',
          'Conflicting stakeholder priorities',
          'Communication complexity',
          'Resource allocation challenges'
        ],
        confidence: 89,
        impact: 'high',
        adoptionComplexity: 'simple',
        resourceRequirement: 'low'
      },
      {
        id: 'insight_iris_custom_balance',
        title: 'Balanced IRIS+ and Custom Indicator Approach Optimizes Measurement Quality',
        category: 'best_practice',
        description: 'Organizations using 70% IRIS+ indicators and 30% custom indicators achieve optimal balance of comparability and context relevance.',
        evidence: [
          {
            organizationCount: 34,
            successRate: 92,
            averageImprovement: 25,
            statisticalSignificance: 0.01,
            contextVariations: ['multiple_sectors'],
            outliers: ['highly_standardized_programs']
          }
        ],
        applicability: [
          {
            condition: 'theory_of_change_complete = true',
            applicabilityScore: 93,
            contextRequirements: ['IRIS+ familiarity', 'outcome_clarity'],
            adaptationNotes: ['Start with IRIS+ baseline', 'Add custom indicators for unique outcomes']
          }
        ],
        recommendations: [
          'Begin indicator selection with relevant IRIS+ indicators',
          'Identify gaps not covered by IRIS+ framework',
          'Develop custom indicators for unique contextual outcomes',
          'Maintain balance between comparability and specificity'
        ],
        successFactors: [
          'Strong theory of change foundation',
          'Clear outcome definitions',
          'IRIS+ methodology understanding',
          'Stakeholder input on unique contexts'
        ],
        riskFactors: [
          'Over-reliance on custom indicators',
          'Insufficient IRIS+ exploration',
          'Measurement burden escalation',
          'Comparability loss'
        ],
        confidence: 87,
        impact: 'high',
        adoptionComplexity: 'moderate',
        resourceRequirement: 'medium'
      },
      {
        id: 'insight_iterative_refinement',
        title: 'Iterative Measurement Refinement Prevents Over-Engineering',
        category: 'pitfall_prevention',
        description: 'Organizations implementing 3-month measurement review cycles reduce over-engineering by 60% while maintaining quality.',
        evidence: [
          {
            organizationCount: 28,
            successRate: 84,
            averageImprovement: 45,
            statisticalSignificance: 0.03,
            contextVariations: ['various_sectors'],
            outliers: ['crisis_response_organizations']
          }
        ],
        applicability: [
          {
            condition: 'measurement_system_active = true',
            applicabilityScore: 91,
            contextRequirements: ['review_capacity', 'data_availability'],
            adaptationNotes: ['Schedule quarterly reviews', 'Focus on utilization metrics']
          }
        ],
        recommendations: [
          'Implement quarterly measurement system reviews',
          'Track indicator utilization and decision impact',
          'Remove unused or low-impact indicators',
          'Streamline data collection processes regularly'
        ],
        successFactors: [
          'Regular review discipline',
          'Data utilization tracking',
          'Decision maker engagement',
          'Continuous improvement mindset'
        ],
        riskFactors: [
          'Review neglect',
          'Resistance to change',
          'Data attachment bias',
          'Resource constraints'
        ],
        confidence: 84,
        impact: 'medium',
        adoptionComplexity: 'simple',
        resourceRequirement: 'low'
      }
    ];

    // Filter by context if provided
    if (context?.sector || context?.organizationSize || context?.geography) {
      return insights.filter(insight => 
        insight.evidence.some(evidence => 
          !context.sector || evidence.contextVariations.includes(context.sector)
        )
      );
    }

    return insights;
  }

  /**
   * Get benchmarking data for organization
   */
  async getBenchmarkingData(
    organizationId: string,
    metrics: string[]
  ): Promise<BenchmarkData[]> {
    // This would calculate real benchmarks from anonymized organizational data
    // For now, returning mock benchmark data
    
    const benchmarkData: BenchmarkData[] = metrics.map(metric => {
      const mockData = this.generateMockBenchmarkData(metric, organizationId);
      return mockData;
    });

    return benchmarkData;
  }

  private generateMockBenchmarkData(metric: string, organizationId: string): BenchmarkData {
    // Generate realistic benchmark data based on metric type
    const mockValues: Record<string, any> = {
      foundation_readiness: {
        organizationValue: 78,
        peerAverage: 65,
        topQuartile: 85,
        bottomQuartile: 45,
        organizationPercentile: 73
      },
      stakeholder_satisfaction: {
        organizationValue: 88,
        peerAverage: 72,
        topQuartile: 90,
        bottomQuartile: 55,
        organizationPercentile: 82
      },
      measurement_quality: {
        organizationValue: 85,
        peerAverage: 71,
        topQuartile: 88,
        bottomQuartile: 58,
        organizationPercentile: 79
      },
      time_to_completion: {
        organizationValue: 14,
        peerAverage: 21,
        topQuartile: 12,
        bottomQuartile: 35,
        organizationPercentile: 76
      }
    };

    const values = mockValues[metric] || mockValues.foundation_readiness;

    return {
      metric,
      organizationValue: values.organizationValue,
      peerAverage: values.peerAverage,
      topQuartile: values.topQuartile,
      bottomQuartile: values.bottomQuartile,
      organizationPercentile: values.organizationPercentile,
      trendDirection: values.organizationValue > values.peerAverage ? 'improving' : 'stable',
      peerGroup: {
        id: 'peer_education_medium',
        name: 'Medium Education Organizations',
        description: 'Education sector organizations with 50-200 staff',
        criteria: ['sector:education', 'size:medium', 'geography:north_america'],
        organizationCount: 23,
        averagePerformance: {
          foundation_readiness: 65,
          stakeholder_satisfaction: 72,
          measurement_quality: 71
        }
      },
      recommendedTargets: [
        {
          timeframe: '3_months',
          target: Math.min(values.organizationValue + 8, values.topQuartile),
          confidence: 85,
          requiredActions: [
            'Implement stakeholder feedback loop',
            'Enhance measurement system documentation',
            'Conduct quarterly review sessions'
          ],
          successProbability: 78
        },
        {
          timeframe: '6_months',
          target: Math.min(values.organizationValue + 15, 95),
          confidence: 72,
          requiredActions: [
            'Advanced training for team members',
            'Peer learning network participation',
            'Technology platform optimization'
          ],
          successProbability: 65
        }
      ]
    };
  }

  /**
   * Generate personalized recommendations based on learning insights
   */
  async generatePersonalizedRecommendations(
    organizationId: string,
    context: {
      foundationReadiness: number;
      currentPhase: string;
      teamExperience: string;
      resourceLevel: string;
      priorities: string[];
    }
  ): Promise<PatternRecommendation[]> {
    const insights = await this.generateLearningInsights();
    const benchmarks = await this.getBenchmarkingData(organizationId, [
      'foundation_readiness',
      'stakeholder_satisfaction',
      'measurement_quality'
    ]);

    const recommendations: PatternRecommendation[] = [];

    // Generate recommendations based on context and benchmarks
    if (context.foundationReadiness < 60) {
      const earlyEngagementInsight = insights.find(i => i.id === 'insight_stakeholder_early_engagement');
      if (earlyEngagementInsight) {
        recommendations.push({
          id: `rec_${organizationId}_early_engagement`,
          organizationId,
          title: 'Accelerate Foundation Development with Early Stakeholder Engagement',
          category: 'foundation_building',
          priority: 'high',
          description: 'Implement early stakeholder engagement to accelerate foundation development and increase satisfaction.',
          rationale: 'Your foundation readiness (58%) is below peer average (65%). Organizations with early stakeholder engagement show 40% faster completion.',
          evidenceBase: [earlyEngagementInsight],
          implementationSteps: [
            {
              order: 1,
              title: 'Schedule Stakeholder Validation Sessions',
              description: 'Organize validation sessions with key stakeholders within the next week',
              duration: '3-5 days',
              dependencies: [],
              resources: ['stakeholder_contact_list', 'facilitator', 'meeting_space'],
              risks: ['stakeholder_availability'],
              successCriteria: ['All key stakeholders engaged', 'Structured feedback collected']
            },
            {
              order: 2,
              title: 'Implement Feedback Loop',
              description: 'Create systematic process for incorporating stakeholder feedback',
              duration: '1 week',
              dependencies: ['stakeholder_sessions_complete'],
              resources: ['feedback_framework', 'documentation_system'],
              risks: ['conflicting_feedback'],
              successCriteria: ['Feedback integration process defined', 'Stakeholder concerns addressed']
            }
          ],
          expectedOutcomes: [
            {
              metric: 'foundation_readiness',
              baseline: 58,
              target: 78,
              timeframe: '2_weeks',
              confidence: 89,
              assumptions: ['Stakeholder availability', 'Team engagement']
            },
            {
              metric: 'stakeholder_satisfaction',
              baseline: 65,
              target: 85,
              timeframe: '2_weeks',
              confidence: 85,
              assumptions: ['Effective facilitation', 'Clear communication']
            }
          ],
          riskAssessment: {
            likelihood: 'low',
            impact: 'medium',
            mitigationStrategies: [
              'Flexible scheduling for stakeholder availability',
              'Clear communication of process and benefits',
              'Preparation of backup engagement methods'
            ],
            contingencyPlans: [
              'Virtual engagement if in-person not possible',
              'Phased engagement if full group unavailable',
              'Individual consultations as fallback'
            ]
          },
          resourceRequirements: [
            {
              type: 'time',
              amount: '10-15 hours over 2 weeks',
              description: 'Facilitation and documentation time',
              alternatives: ['External facilitator', 'Structured templates']
            },
            {
              type: 'stakeholder_engagement',
              amount: '2-3 hours per stakeholder',
              description: 'Stakeholder participation time',
              alternatives: ['Shorter focused sessions', 'Survey-based feedback']
            }
          ],
          successIndicators: [
            'Foundation readiness improvement > 15 points',
            'Stakeholder satisfaction > 80%',
            'Theory validation completion',
            'Stakeholder buy-in achievement'
          ],
          timeframe: '2_weeks',
          confidence: 87
        });
      }
    }

    // Add more recommendations based on other insights and context
    if (context.currentPhase.includes('indicator') && context.priorities.includes('measurement_quality')) {
      const balanceInsight = insights.find(i => i.id === 'insight_iris_custom_balance');
      if (balanceInsight) {
        recommendations.push({
          id: `rec_${organizationId}_indicator_balance`,
          organizationId,
          title: 'Optimize Measurement Quality with Balanced Indicator Approach',
          category: 'measurement_design',
          priority: 'medium',
          description: 'Implement 70/30 IRIS+ to custom indicator ratio for optimal measurement quality.',
          rationale: 'Balanced approach achieves 25% higher measurement quality while maintaining comparability.',
          evidenceBase: [balanceInsight],
          implementationSteps: [
            {
              order: 1,
              title: 'IRIS+ Indicator Assessment',
              description: 'Review and select relevant IRIS+ indicators for your theory of change',
              duration: '1 week',
              dependencies: ['theory_of_change_complete'],
              resources: ['IRIS+ database', 'methodology_expertise'],
              risks: ['indicator_misalignment'],
              successCriteria: ['70% of indicators from IRIS+', 'Theory alignment confirmed']
            }
          ],
          expectedOutcomes: [
            {
              metric: 'measurement_quality',
              baseline: 65,
              target: 85,
              timeframe: '2_weeks',
              confidence: 85,
              assumptions: ['Theory clarity', 'IRIS+ applicability']
            }
          ],
          riskAssessment: {
            likelihood: 'low',
            impact: 'low',
            mitigationStrategies: ['Expert consultation', 'Pilot testing'],
            contingencyPlans: ['Adjust ratio if needed', 'Seek peer examples']
          },
          resourceRequirements: [
            {
              type: 'expertise',
              amount: 'IRIS+ methodology knowledge',
              description: 'Understanding of IRIS+ framework and application',
              alternatives: ['Training session', 'Expert consultation']
            }
          ],
          successIndicators: [
            'Balanced indicator portfolio achieved',
            'Measurement quality score > 80%',
            'Stakeholder acceptance of indicators'
          ],
          timeframe: '2_weeks',
          confidence: 82
        });
      }
    }

    return recommendations;
  }

  /**
   * Get cross-organizational analytics
   */
  async getCrossOrgAnalytics(): Promise<CrossOrgAnalytics> {
    // This would calculate real analytics from platform data
    // For now, returning mock analytics
    
    return {
      platformInsights: {
        totalOrganizations: 127,
        activePatterns: 342,
        averageImprovementRate: 28.5,
        topPerformingSectors: ['education', 'healthcare', 'community_development'],
        emergingTrends: [
          'Increased stakeholder engagement focus',
          'AI-assisted measurement design',
          'Real-time data collection adoption',
          'Cross-sector collaboration patterns'
        ]
      },
      learningEffectiveness: {
        patternAdoptionRate: 73.2,
        averageImplementationTime: 12.8, // days
        successRate: 84.6,
        userSatisfaction: 4.3,
        knowledgeRetention: 78.9
      },
      benchmarkingMetrics: {
        participatingOrganizations: 89,
        benchmarkCategories: 12,
        averagePerformanceGap: 15.7,
        improvementTrajectory: 2.3 // monthly improvement percentage
      },
      innovationTracking: {
        noviceApproaches: 45,
        validatedInnovations: 12,
        scaledPractices: 8,
        failedExperiments: 23
      }
    };
  }

  /**
   * Submit organization innovation for validation
   */
  async submitInnovation(
    organizationId: string,
    innovation: {
      title: string;
      description: string;
      category: string;
      context: Record<string, any>;
      results: Record<string, any>;
      evidence: string[];
    }
  ): Promise<{
    innovationId: string;
    validationStatus: 'pending' | 'under_review' | 'validated' | 'rejected';
    nextSteps: string[];
    estimatedReviewTime: string;
  }> {
    // In real implementation, this would:
    // 1. Store the innovation
    // 2. Queue for expert review
    // 3. Initiate validation process
    
    const innovationId = `innovation_${Date.now()}_${organizationId}`;
    
    return {
      innovationId,
      validationStatus: 'pending',
      nextSteps: [
        'Expert review assignment (2-3 days)',
        'Peer organization validation (1 week)',
        'Evidence verification (3-5 days)',
        'Community feedback period (1 week)'
      ],
      estimatedReviewTime: '2-3 weeks'
    };
  }
}

export default new CrossOrgLearningService();