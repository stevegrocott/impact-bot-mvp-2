import { PrismaClient } from '@prisma/client';
import { transformToCamelCase, transformToSnakeCase } from '../utils/caseTransform';

const prisma = new PrismaClient();

export interface AIPersonality {
  id: string;
  name: string;
  role: 'coach' | 'advisor' | 'analyst';
  displayName: string;
  avatar: string;
  description: string;
  expertise: string[];
  communicationStyle: CommunicationStyle;
  contextualGuidance: ContextualGuidance;
  interactionPatterns: InteractionPattern[];
  triggers: PersonalityTrigger[];
  responseTemplates: ResponseTemplate[];
}

export interface CommunicationStyle {
  tone: 'encouraging' | 'professional' | 'analytical' | 'friendly' | 'authoritative';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  verbosity: 'concise' | 'detailed' | 'comprehensive';
  language: string[];
  emotional_intelligence: 'high' | 'medium' | 'low';
  question_approach: 'leading' | 'open_ended' | 'structured' | 'socratic';
}

export interface ContextualGuidance {
  phase_specialization: string[];
  methodology_focus: string[];
  pitfall_prevention: string[];
  decision_support: string[];
  stakeholder_communication: string[];
  technical_depth: 'high' | 'medium' | 'low';
}

export interface InteractionPattern {
  trigger_context: string;
  response_style: string;
  follow_up_questions: string[];
  examples: string[];
  success_indicators: string[];
}

export interface PersonalityTrigger {
  context: string;
  user_role: string[];
  organization_stage: string[];
  confidence_threshold: number;
  priority: 'high' | 'medium' | 'low';
  activation_conditions: string[];
}

export interface ResponseTemplate {
  scenario: string;
  template: string;
  variables: string[];
  adaptation_rules: string[];
  follow_up_options: string[];
}

export interface PersonalitySelection {
  selectedPersonality: AIPersonality;
  confidence: number;
  reasoning: string;
  alternativePersonalities: Array<{
    personality: AIPersonality;
    suitability: number;
    context: string;
  }>;
  contextualFactors: string[];
}

export interface ConversationContext {
  userId: string;
  organizationId: string;
  userRole: string;
  currentPhase: string;
  foundationReadiness: number;
  conversationHistory: ConversationMessage[];
  currentTask: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  complexityLevel: 'beginner' | 'intermediate' | 'advanced';
  previousInteractions: PreviousInteraction[];
}

export interface ConversationMessage {
  id: string;
  timestamp: Date;
  speaker: 'user' | 'ai';
  personalityId?: string;
  content: string;
  intent: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated' | 'excited';
  confidence: number;
}

export interface PreviousInteraction {
  date: Date;
  personalityUsed: string;
  taskContext: string;
  userSatisfaction: number;
  effectivenessScore: number;
  adaptationLearned: string;
}

export interface PersonalityResponse {
  personalityId: string;
  personalityName: string;
  response: string;
  tone: string;
  followUpSuggestions: string[];
  contextualHelp: string[];
  nextSteps: string[];
  pitfallWarnings?: string[];
  resourceRecommendations?: string[];
  confidenceLevel: number;
  adaptationNotes: string[];
}

class AIPersonalityService {

  /**
   * Get all available AI personalities
   */
  getAvailablePersonalities(): AIPersonality[] {
    return [
      {
        id: 'coach_riley',
        name: 'Riley',
        role: 'coach',
        displayName: 'Coach Riley',
        avatar: '/avatars/riley-coach.png',
        description: 'Enthusiastic foundation coach who helps organizations build strong measurement foundations',
        expertise: [
          'theory_of_change_development',
          'foundation_building',
          'stakeholder_engagement',
          'change_management',
          'motivation_building'
        ],
        communicationStyle: {
          tone: 'encouraging',
          complexity: 'beginner',
          verbosity: 'detailed',
          language: ['en'],
          emotional_intelligence: 'high',
          question_approach: 'leading'
        },
        contextualGuidance: {
          phase_specialization: ['foundation', 'theory_development', 'stakeholder_mapping'],
          methodology_focus: ['participatory_approach', 'stakeholder_engagement', 'change_theory'],
          pitfall_prevention: ['activity_vs_impact', 'stakeholder_alignment', 'theory_gaps'],
          decision_support: ['foundational_decisions', 'stakeholder_buy_in', 'resource_allocation'],
          stakeholder_communication: ['board_preparation', 'team_alignment', 'funder_communication'],
          technical_depth: 'medium'
        },
        interactionPatterns: [
          {
            trigger_context: 'foundation_assessment',
            response_style: 'encouraging_and_structured',
            follow_up_questions: [
              'What aspects of your theory of change feel most solid to you?',
              'Where do you think your stakeholders might have different perspectives?',
              'What excites you most about your intended impact?'
            ],
            examples: [
              'Think of your theory of change like a roadmap - where are you trying to go, and what route makes the most sense?',
              'Every strong foundation starts with clarity about the change you want to see'
            ],
            success_indicators: ['increased_confidence', 'stakeholder_engagement', 'foundation_completion']
          }
        ],
        triggers: [
          {
            context: 'new_user_onboarding',
            user_role: ['impact_analyst', 'impact_manager'],
            organization_stage: ['foundation', 'early_stage'],
            confidence_threshold: 0.8,
            priority: 'high',
            activation_conditions: ['foundation_readiness < 50', 'first_time_user', 'theory_incomplete']
          }
        ],
        responseTemplates: [
          {
            scenario: 'foundation_encouragement',
            template: 'Great work on getting started! Building a strong foundation is like {{analogy}} - it takes time but creates lasting impact. Let\'s focus on {{priority_area}} to move forward.',
            variables: ['analogy', 'priority_area', 'user_name'],
            adaptation_rules: ['match_user_energy', 'acknowledge_progress', 'provide_specific_next_step'],
            follow_up_options: ['schedule_check_in', 'provide_resources', 'connect_with_peers']
          }
        ]
      },
      {
        id: 'advisor_morgan',
        name: 'Morgan',
        role: 'advisor',
        displayName: 'Advisor Morgan',
        avatar: '/avatars/morgan-advisor.png',
        description: 'Strategic advisor with deep expertise in impact measurement methodology and best practices',
        expertise: [
          'iris_plus_methodology',
          'indicator_selection',
          'measurement_design',
          'evaluation_frameworks',
          'strategic_planning'
        ],
        communicationStyle: {
          tone: 'professional',
          complexity: 'intermediate',
          verbosity: 'comprehensive',
          language: ['en'],
          emotional_intelligence: 'medium',
          question_approach: 'structured'
        },
        contextualGuidance: {
          phase_specialization: ['indicator_selection', 'measurement_design', 'evaluation_planning'],
          methodology_focus: ['iris_plus', 'outcome_measurement', 'impact_evaluation', 'data_quality'],
          pitfall_prevention: ['over_engineering', 'proxy_metrics', 'attribution_vs_contribution'],
          decision_support: ['indicator_prioritization', 'methodology_selection', 'resource_optimization'],
          stakeholder_communication: ['technical_reporting', 'methodology_explanation', 'evaluation_planning'],
          technical_depth: 'high'
        },
        interactionPatterns: [
          {
            trigger_context: 'indicator_selection',
            response_style: 'methodical_and_comprehensive',
            follow_up_questions: [
              'How do these indicators align with your theory of change?',
              'What decisions will this data help you make?',
              'Have you considered the data collection burden for each indicator?'
            ],
            examples: [
              'The IRIS+ framework provides tested indicators, but the key is selecting ones that truly measure your intended outcomes',
              'Remember: better to measure fewer things well than many things poorly'
            ],
            success_indicators: ['methodological_rigor', 'decision_alignment', 'indicator_quality']
          }
        ],
        triggers: [
          {
            context: 'indicator_selection_phase',
            user_role: ['impact_manager', 'impact_analyst', 'evaluator'],
            organization_stage: ['measurement_design', 'implementation'],
            confidence_threshold: 0.85,
            priority: 'high',
            activation_conditions: ['foundation_readiness > 70', 'iris_exploration', 'custom_indicators']
          }
        ],
        responseTemplates: [
          {
            scenario: 'methodology_guidance',
            template: 'Based on your {{context}}, I recommend focusing on {{methodology_area}}. This approach will help you {{expected_outcome}} while avoiding {{common_pitfall}}.',
            variables: ['context', 'methodology_area', 'expected_outcome', 'common_pitfall'],
            adaptation_rules: ['provide_evidence_base', 'reference_best_practices', 'offer_alternatives'],
            follow_up_options: ['deep_dive_session', 'methodology_resources', 'peer_examples']
          }
        ]
      },
      {
        id: 'analyst_alex',
        name: 'Alex',
        role: 'analyst',
        displayName: 'Analyst Alex',
        avatar: '/avatars/alex-analyst.png',
        description: 'Data-focused analyst who excels at measurement system optimization and quality improvement',
        expertise: [
          'data_analysis',
          'measurement_optimization',
          'quality_assurance',
          'reporting_systems',
          'performance_tracking'
        ],
        communicationStyle: {
          tone: 'analytical',
          complexity: 'advanced',
          verbosity: 'concise',
          language: ['en'],
          emotional_intelligence: 'medium',
          question_approach: 'socratic'
        },
        contextualGuidance: {
          phase_specialization: ['data_collection', 'analysis', 'reporting', 'optimization'],
          methodology_focus: ['data_quality', 'statistical_analysis', 'trend_analysis', 'benchmarking'],
          pitfall_prevention: ['data_quality_issues', 'statistical_misinterpretation', 'reporting_bias'],
          decision_support: ['data_interpretation', 'system_optimization', 'quality_improvement'],
          stakeholder_communication: ['technical_documentation', 'data_visualization', 'analytical_insights'],
          technical_depth: 'high'
        },
        interactionPatterns: [
          {
            trigger_context: 'data_analysis',
            response_style: 'precise_and_insightful',
            follow_up_questions: [
              'What patterns do you see in this data?',
              'How confident are you in the data quality?',
              'What additional context might explain these results?'
            ],
            examples: [
              'This data suggests a trend, but let\'s examine the underlying factors',
              'The correlation is interesting - let\'s explore potential causation'
            ],
            success_indicators: ['analytical_accuracy', 'insight_generation', 'quality_improvement']
          }
        ],
        triggers: [
          {
            context: 'data_analysis_phase',
            user_role: ['impact_analyst', 'evaluator', 'impact_manager'],
            organization_stage: ['data_collection', 'analysis', 'reporting'],
            confidence_threshold: 0.9,
            priority: 'medium',
            activation_conditions: ['data_available', 'analysis_needed', 'quality_concerns']
          }
        ],
        responseTemplates: [
          {
            scenario: 'data_insight',
            template: 'The data shows {{key_finding}}. This {{trend_direction}} indicates {{interpretation}}. I recommend {{action_item}} to {{expected_result}}.',
            variables: ['key_finding', 'trend_direction', 'interpretation', 'action_item', 'expected_result'],
            adaptation_rules: ['focus_on_actionable_insights', 'provide_statistical_context', 'suggest_follow_up_analysis'],
            follow_up_options: ['detailed_analysis', 'comparative_benchmarking', 'methodology_review']
          }
        ]
      }
    ];
  }

  /**
   * Select optimal personality for conversation context
   */
  async selectPersonalityForContext(context: ConversationContext): Promise<PersonalitySelection> {
    const personalities = this.getAvailablePersonalities();
    const scores = personalities.map(personality => ({
      personality,
      score: this.calculatePersonalitySuitability(personality, context),
      reasoning: this.generateSelectionReasoning(personality, context)
    }));

    // Sort by score and get the best match
    scores.sort((a, b) => b.score - a.score);
    const bestMatch = scores[0]!;
    const alternatives = scores.slice(1, 3);

    return {
      selectedPersonality: bestMatch.personality,
      confidence: bestMatch.score,
      reasoning: bestMatch.reasoning,
      alternativePersonalities: alternatives.map(alt => ({
        personality: alt.personality,
        suitability: alt.score,
        context: alt.reasoning
      })),
      contextualFactors: this.extractContextualFactors(context)
    };
  }

  private calculatePersonalitySuitability(personality: AIPersonality, context: ConversationContext): number {
    let score = 0;

    // Phase alignment (40% of score)
    if (personality.contextualGuidance.phase_specialization.includes(context.currentPhase)) {
      score += 0.4;
    }

    // User role compatibility (25% of score)
    const roleCompatibility = this.calculateRoleCompatibility(personality, context.userRole);
    score += roleCompatibility * 0.25;

    // Foundation readiness alignment (20% of score)
    const readinessAlignment = this.calculateReadinessAlignment(personality, context.foundationReadiness);
    score += readinessAlignment * 0.20;

    // Task context relevance (10% of score)
    const taskRelevance = this.calculateTaskRelevance(personality, context.currentTask);
    score += taskRelevance * 0.10;

    // Previous interaction success (5% of score)
    const previousSuccess = this.calculatePreviousSuccess(personality, context.previousInteractions);
    score += previousSuccess * 0.05;

    return Math.min(score, 1.0); // Cap at 1.0
  }

  private calculateRoleCompatibility(personality: AIPersonality, userRole: string): number {
    const roleCompatibilityMap: Record<string, Record<string, number>> = {
      coach: {
        impact_analyst: 0.9,
        impact_manager: 0.8,
        org_admin: 0.6,
        report_viewer: 0.9,
        evaluator: 0.5
      },
      advisor: {
        impact_analyst: 1.0,
        impact_manager: 0.9,
        org_admin: 0.7,
        report_viewer: 0.4,
        evaluator: 0.9
      },
      analyst: {
        impact_analyst: 1.0,
        impact_manager: 0.8,
        org_admin: 0.5,
        report_viewer: 0.3,
        evaluator: 1.0
      }
    };

    return roleCompatibilityMap[personality.role]?.[userRole] || 0.5;
  }

  private calculateReadinessAlignment(personality: AIPersonality, foundationReadiness: number): number {
    // Coach Riley: Best for low readiness (foundation building)
    if (personality.role === 'coach') {
      return foundationReadiness < 50 ? 1.0 : 0.8 - (foundationReadiness / 100);
    }
    
    // Advisor Morgan: Best for medium to high readiness
    if (personality.role === 'advisor') {
      return foundationReadiness >= 50 ? 1.0 : foundationReadiness / 50;
    }
    
    // Analyst Alex: Best for high readiness with data
    if (personality.role === 'analyst') {
      return foundationReadiness >= 70 ? 1.0 : foundationReadiness / 70;
    }

    return 0.5;
  }

  private calculateTaskRelevance(personality: AIPersonality, currentTask: string): number {
    const taskRelevanceMap: Record<string, string[]> = {
      coach: ['foundation_assessment', 'theory_development', 'stakeholder_mapping', 'team_alignment'],
      advisor: ['indicator_selection', 'methodology_design', 'evaluation_planning', 'iris_exploration'],
      analyst: ['data_analysis', 'reporting', 'quality_review', 'optimization', 'benchmarking']
    };

    const relevantTasks = taskRelevanceMap[personality.role] || [];
    return relevantTasks.some(task => currentTask.includes(task)) ? 1.0 : 0.3;
  }

  private calculatePreviousSuccess(personality: AIPersonality, previousInteractions: PreviousInteraction[]): number {
    const personalityInteractions = previousInteractions.filter(
      interaction => interaction.personalityUsed === personality.id
    );

    if (personalityInteractions.length === 0) return 0.5; // Neutral for no history

    const averageEffectiveness = personalityInteractions.reduce(
      (sum, interaction) => sum + interaction.effectivenessScore, 0
    ) / personalityInteractions.length;

    return averageEffectiveness / 100; // Convert percentage to decimal
  }

  private generateSelectionReasoning(personality: AIPersonality, context: ConversationContext): string {
    const reasons = [];

    if (personality.contextualGuidance.phase_specialization.includes(context.currentPhase)) {
      reasons.push(`specializes in ${context.currentPhase} phase`);
    }

    const roleCompatibility = this.calculateRoleCompatibility(personality, context.userRole);
    if (roleCompatibility > 0.8) {
      reasons.push(`excellent match for ${context.userRole} role`);
    }

    if (context.foundationReadiness < 50 && personality.role === 'coach') {
      reasons.push('optimal for foundation building stage');
    }

    if (context.foundationReadiness >= 70 && personality.role === 'analyst') {
      reasons.push('ideal for advanced analysis and optimization');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'general suitability for context';
  }

  private extractContextualFactors(context: ConversationContext): string[] {
    const factors = [];

    factors.push(`User role: ${context.userRole}`);
    factors.push(`Current phase: ${context.currentPhase}`);
    factors.push(`Foundation readiness: ${context.foundationReadiness}%`);
    factors.push(`Task context: ${context.currentTask}`);
    factors.push(`Urgency level: ${context.urgencyLevel}`);
    factors.push(`Complexity level: ${context.complexityLevel}`);

    if (context.conversationHistory.length > 0) {
      factors.push(`Conversation history: ${context.conversationHistory.length} messages`);
    }

    return factors;
  }

  /**
   * Generate personality-specific response
   */
  async generatePersonalityResponse(
    personalityId: string,
    userMessage: string,
    context: ConversationContext
  ): Promise<PersonalityResponse> {
    const personality = this.getAvailablePersonalities().find(p => p.id === personalityId);
    
    if (!personality) {
      throw new Error(`Personality not found: ${personalityId}`);
    }

    // Generate base response based on personality style
    const baseResponse = this.generateBaseResponse(personality, userMessage, context);
    
    // Add personality-specific enhancements
    const enhancedResponse = this.enhanceWithPersonalityTraits(personality, baseResponse, context);
    
    // Generate follow-up suggestions
    const followUpSuggestions = this.generateFollowUpSuggestions(personality, context);
    
    // Generate contextual help
    const contextualHelp = this.generateContextualHelp(personality, context);
    
    // Generate next steps
    const nextSteps = this.generateNextSteps(personality, context);
    
    // Check for pitfall warnings
    const pitfallWarnings = this.generatePitfallWarnings(personality, userMessage, context);
    
    // Generate resource recommendations
    const resourceRecommendations = this.generateResourceRecommendations(personality, context);

    const response: PersonalityResponse = {
      personalityId: personality.id,
      personalityName: personality.displayName,
      response: enhancedResponse,
      tone: personality.communicationStyle.tone,
      followUpSuggestions,
      contextualHelp,
      nextSteps,
      confidenceLevel: 0.85, // Base confidence level
      adaptationNotes: [`Adapted for ${context.userRole}`, `Phase: ${context.currentPhase}`]
    };

    // Add optional properties conditionally
    if (pitfallWarnings.length > 0) {
      response.pitfallWarnings = pitfallWarnings;
    }

    if (resourceRecommendations.length > 0) {
      response.resourceRecommendations = resourceRecommendations;
    }

    return response;
  }

  private generateBaseResponse(personality: AIPersonality, userMessage: string, context: ConversationContext): string {
    // This would integrate with the actual AI service (Anthropic Claude)
    // For now, returning personality-appropriate responses based on role
    
    const responseMap: Record<string, string> = {
      coach: `I'm excited to help you with this! Based on what you've shared, I can see you're making good progress. Let's build on your foundation and address any challenges step by step. What specific area would you like to focus on first?`,
      advisor: `Thank you for that context. Based on best practices in impact measurement, I recommend we approach this systematically. Let me share some methodological considerations that will help ensure robust outcomes.`,
      analyst: `Interesting data point. Let me break down what I'm seeing here and identify the key insights. The patterns suggest several optimization opportunities we should explore.`
    };

    return responseMap[personality.role] || 'How can I help you today?';
  }

  private enhanceWithPersonalityTraits(personality: AIPersonality, baseResponse: string, context: ConversationContext): string {
    // Apply personality-specific enhancements based on communication style
    let enhanced = baseResponse;

    // Apply tone adjustments
    if (personality.communicationStyle.tone === 'encouraging') {
      enhanced = `Great question! ${enhanced} You're on the right track!`;
    } else if (personality.communicationStyle.tone === 'analytical') {
      enhanced = `${enhanced} Let's examine the data to validate this approach.`;
    }

    // Apply complexity level
    if (personality.communicationStyle.complexity === 'beginner' && context.complexityLevel === 'advanced') {
      enhanced += ' Let me break this down into simpler steps to make it more manageable.';
    }

    return enhanced;
  }

  private generateFollowUpSuggestions(personality: AIPersonality, context: ConversationContext): string[] {
    const suggestions: Record<string, string[]> = {
      coach: [
        'Would you like to schedule a foundation readiness check-in?',
        'Should we explore your stakeholder engagement strategy?',
        'How about we work on strengthening your theory of change?'
      ],
      advisor: [
        'Shall we review your indicator selection criteria?',
        'Would you like to explore IRIS+ alignment opportunities?',
        'Should we discuss evaluation methodology options?'
      ],
      analyst: [
        'Would you like me to run a data quality analysis?',
        'Should we examine performance trends and benchmarks?',
        'How about we optimize your measurement system?'
      ]
    };

    return suggestions[personality.role] || ['How else can I assist you?'];
  }

  private generateContextualHelp(personality: AIPersonality, context: ConversationContext): string[] {
    const help = [];
    
    if (context.foundationReadiness < 50) {
      help.push('Foundation building resources and templates');
      help.push('Theory of change development guide');
    }
    
    if (context.currentPhase.includes('indicator')) {
      help.push('IRIS+ indicator explorer');
      help.push('Custom indicator creation wizard');
    }
    
    if (context.currentTask.includes('analysis')) {
      help.push('Data analysis tools and templates');
      help.push('Benchmarking and comparison features');
    }

    return help;
  }

  private generateNextSteps(personality: AIPersonality, context: ConversationContext): string[] {
    const steps: Record<string, string[]> = {
      coach: [
        'Complete your foundation assessment',
        'Engage stakeholders in theory validation',
        'Schedule team alignment session'
      ],
      advisor: [
        'Review indicator alignment with theory',
        'Validate measurement methodology',
        'Plan evaluation framework'
      ],
      analyst: [
        'Conduct data quality review',
        'Generate baseline analysis',
        'Set up monitoring dashboard'
      ]
    };

    return steps[personality.role] || ['Continue with current workflow'];
  }

  private generatePitfallWarnings(personality: AIPersonality, userMessage: string, context: ConversationContext): string[] {
    const warnings = [];

    // Activity vs Impact warning
    if (userMessage.toLowerCase().includes('attendance') || userMessage.toLowerCase().includes('participation')) {
      warnings.push('Consider measuring outcomes beyond attendance - what change are participants experiencing?');
    }

    // Over-engineering warning
    if (userMessage.toLowerCase().includes('kpi') && context.conversationHistory.length > 5) {
      warnings.push('Be mindful of indicator overload - focus on quality over quantity');
    }

    return warnings;
  }

  private generateResourceRecommendations(personality: AIPersonality, context: ConversationContext): string[] {
    const resources = [];

    if (context.foundationReadiness < 50) {
      resources.push('Foundation Building Toolkit');
      resources.push('Theory of Change Templates');
    }

    if (context.currentPhase.includes('indicator')) {
      resources.push('IRIS+ Methodology Guide');
      resources.push('Indicator Selection Checklist');
    }

    return resources;
  }

  /**
   * Get personality interaction analytics
   */
  async getPersonalityAnalytics(organizationId: string): Promise<{
    personalityUsage: Array<{
      personalityId: string;
      personalityName: string;
      usageCount: number;
      averageEffectiveness: number;
      userSatisfaction: number;
      commonContexts: string[];
    }>;
    userPreferences: Array<{
      userId: string;
      preferredPersonality: string;
      interactionPattern: string;
      successRate: number;
    }>;
    contextualEffectiveness: Array<{
      context: string;
      bestPersonality: string;
      effectivenessScore: number;
      userFeedback: number;
    }>;
    adaptationInsights: Array<{
      personalityId: string;
      adaptationPattern: string;
      successRate: number;
      recommendation: string;
    }>;
  }> {
    // Mock analytics data - would be calculated from actual interaction records
    return {
      personalityUsage: [
        {
          personalityId: 'coach_riley',
          personalityName: 'Coach Riley',
          usageCount: 245,
          averageEffectiveness: 87.3,
          userSatisfaction: 4.6,
          commonContexts: ['foundation_assessment', 'theory_development', 'stakeholder_engagement']
        },
        {
          personalityId: 'advisor_morgan',
          personalityName: 'Advisor Morgan',
          usageCount: 189,
          averageEffectiveness: 91.2,
          userSatisfaction: 4.4,
          commonContexts: ['indicator_selection', 'methodology_design', 'evaluation_planning']
        },
        {
          personalityId: 'analyst_alex',
          personalityName: 'Analyst Alex',
          usageCount: 156,
          averageEffectiveness: 89.8,
          userSatisfaction: 4.3,
          commonContexts: ['data_analysis', 'reporting', 'optimization']
        }
      ],
      userPreferences: [
        {
          userId: 'user_123',
          preferredPersonality: 'coach_riley',
          interactionPattern: 'encouragement_seeking',
          successRate: 92.1
        },
        {
          userId: 'user_456',
          preferredPersonality: 'advisor_morgan',
          interactionPattern: 'methodology_focused',
          successRate: 88.7
        }
      ],
      contextualEffectiveness: [
        {
          context: 'foundation_building',
          bestPersonality: 'coach_riley',
          effectivenessScore: 93.2,
          userFeedback: 4.7
        },
        {
          context: 'indicator_selection',
          bestPersonality: 'advisor_morgan',
          effectivenessScore: 94.1,
          userFeedback: 4.5
        },
        {
          context: 'data_analysis',
          bestPersonality: 'analyst_alex',
          effectivenessScore: 91.8,
          userFeedback: 4.4
        }
      ],
      adaptationInsights: [
        {
          personalityId: 'coach_riley',
          adaptationPattern: 'increased_technical_depth_for_analysts',
          successRate: 89.4,
          recommendation: 'Continue adapting technical explanations for analyst users'
        },
        {
          personalityId: 'advisor_morgan',
          adaptationPattern: 'simplified_language_for_beginners',
          successRate: 86.1,
          recommendation: 'Enhance beginner-friendly communication patterns'
        }
      ]
    };
  }
}

export default new AIPersonalityService();