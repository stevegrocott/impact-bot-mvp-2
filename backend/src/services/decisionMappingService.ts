/**
 * Decision Mapping Service
 * "What decisions will this data inform?" - Core methodology for preventing over-engineering
 * and ensuring measurement utility
 */

import { Organization, Conversation, ConversationMessage } from '@prisma/client';
import { prisma } from '@/config/database';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { llmService } from './llm';
import { theoryOfChangeService } from './theoryOfChangeService';

// Decision mapping core structures
export interface DecisionQuestion {
  id: string;
  question: string;
  decisionType: 'strategic' | 'operational' | 'tactical' | 'adaptive';
  stakeholders: string[];
  frequency: 'ongoing' | 'quarterly' | 'annually' | 'one-time';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  evidenceNeeds: EvidenceRequirement[];
  currentDataSources: string[];
  dataGaps: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EvidenceRequirement {
  type: 'quantitative' | 'qualitative' | 'mixed';
  description: string;
  acceptableProxies: string[];
  minimumQuality: 'rough' | 'good' | 'rigorous';
  collectionMethod: string[];
  frequency: string;
}

// Decision evolution tracking
export interface DecisionEvolution {
  id: string;
  decisionQuestionId: string;
  changeType: 'question_refined' | 'evidence_added' | 'data_source_changed' | 'decision_resolved';
  previousState: any;
  newState: any;
  changeReason: string;
  changedBy: string;
  changedAt: Date;
  impact: 'low' | 'medium' | 'high';
}

// Measurement utility assessment
export interface MeasurementUtility {
  indicatorId: string;
  decisionQuestions: string[];
  utilityScore: number; // 0-100
  directlyInforms: number; // Count of decisions directly informed
  indirectlySupports: number; // Count of decisions supported indirectly
  redundancyRisk: number; // 0-100, higher = more redundant
  dataQualityNeeds: {
    precision: 'low' | 'medium' | 'high';
    frequency: string;
    timeliness: string;
  };
  costBenefitRatio: number;
  recommendations: string[];
}

// Minimum viable measurement recommendations
export interface MinimumViableMeasurement {
  decisionQuestions: DecisionQuestion[];
  essentialIndicators: string[];
  optionalIndicators: string[];
  customIndicatorsNeeded: string[];
  measurementBurden: {
    totalIndicators: number;
    estimatedHoursPerCycle: number;
    complexity: 'low' | 'medium' | 'high';
    riskOfOverengineering: number; // 0-100
  };
  phaseApproach: {
    phase1: string[]; // Essential for immediate decisions
    phase2: string[]; // Valuable for refinement
    phase3: string[]; // Nice to have for optimization
  };
  warningFlags: string[];
}

class DecisionMappingService {
  
  /**
   * Guide organization through decision mapping process
   */
  async startDecisionMapping(
    organizationId: string,
    userId: string,
    context?: { existingDecisions?: Partial<DecisionQuestion>[] }
  ): Promise<{
    conversationId: string;
    initialQuestions: string[];
    suggestedDecisionCategories: string[];
    methodology: string;
  }> {
    try {
      // Get theory of change to inform decision mapping
      const theory = await theoryOfChangeService.getTheoryOfChange(organizationId);
      
      if (!theory) {
        throw new AppError('Theory of change required before decision mapping', 400);
      }

      // Create guided conversation for decision mapping
      const conversation = await prisma.conversation.create({
        data: {
          userId,
          organizationId,
          title: 'Decision Mapping - What will this data inform?',
          conversationType: 'decision_mapping_guided',
          contextData: {
            theoryOfChange: theory,
            existingDecisions: context?.existingDecisions || [],
            startedAt: new Date().toISOString()
          },
          currentStep: '1_strategic_decisions',
          completionPercentage: 0
        }
      });

      // Generate contextual decision questions based on theory of change
      const suggestedQuestions = await this.generateDecisionQuestions(theory);
      
      // Identify decision categories relevant to their work
      const decisionCategories = this.identifyRelevantDecisionCategories(theory);

      // Create initial guidance message
      const initialMessage = this.generateDecisionMappingGuidance(suggestedQuestions);
      
      await prisma.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          messageType: 'assistant',
          content: initialMessage,
          metadata: {
            step: '1_strategic_decisions',
            suggestedQuestions,
            decisionCategories,
            guidance: 'decision_mapping_introduction'
          }
        }
      });

      logger.info(`Decision mapping started for organization ${organizationId}`);

      return {
        conversationId: conversation.id,
        initialQuestions: suggestedQuestions,
        suggestedDecisionCategories: decisionCategories,
        methodology: 'Start with strategic decisions, then operational, then tactical. Focus on decisions that require evidence.'
      };

    } catch (error) {
      logger.error('Error starting decision mapping:', error);
      throw new AppError('Failed to start decision mapping process', 500);
    }
  }

  /**
   * Process user input and continue decision mapping conversation
   */
  async continueDecisionMapping(
    conversationId: string,
    userResponse: string
  ): Promise<{
    nextMessage: string;
    isComplete: boolean;
    extractedDecisions: Partial<DecisionQuestion>[];
    suggestions: string[];
    nextStep: string;
  }> {
    try {
      // Get conversation state
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 5 } }
      });

      if (!conversation) {
        throw new AppError('Conversation not found', 404);
      }

      // Store user response
      await prisma.conversationMessage.create({
        data: {
          conversationId,
          messageType: 'user',
          content: userResponse,
          metadata: {
            step: conversation.currentStep,
            timestamp: new Date().toISOString()
          }
        }
      });

      // Process response to extract decision information
      const extractedDecisions = await this.extractDecisionsFromResponse(
        userResponse,
        conversation.currentStep!,
        conversation.contextData as any
      );

      // Determine next step in decision mapping
      const nextStep = this.getNextDecisionMappingStep(conversation.currentStep!, extractedDecisions);
      const isComplete = nextStep === 'complete';

      let nextMessage: string;
      let suggestions: string[] = [];

      if (isComplete) {
        // Complete decision mapping and generate minimum viable measurement
        const decisions = await this.finalizeDecisionMapping(conversation.organizationId, extractedDecisions);
        const minimumViableMeasurement = await this.generateMinimumViableMeasurement(decisions);
        
        nextMessage = this.generateCompletionMessage(decisions, minimumViableMeasurement);
      } else {
        // Continue with next step
        suggestions = await this.generateNextStepSuggestions(nextStep, extractedDecisions);
        nextMessage = this.generateNextStepMessage(nextStep, suggestions);
      }

      // Update conversation
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          currentStep: nextStep,
          completionPercentage: this.calculateDecisionMappingProgress(nextStep),
          contextData: {
            ...(conversation.contextData as any),
            extractedDecisions,
            lastUpdated: new Date().toISOString()
          }
        }
      });

      // Store assistant response
      await prisma.conversationMessage.create({
        data: {
          conversationId,
          messageType: 'assistant',
          content: nextMessage,
          metadata: {
            step: nextStep,
            isComplete,
            extractedDecisions: extractedDecisions.length,
            suggestions
          }
        }
      });

      return {
        nextMessage,
        isComplete,
        extractedDecisions,
        suggestions,
        nextStep
      };

    } catch (error) {
      logger.error('Error continuing decision mapping:', error);
      throw new AppError('Failed to continue decision mapping', 500);
    }
  }

  /**
   * Analyze indicator utility against mapped decisions
   */
  async assessIndicatorUtility(
    indicatorIds: string[],
    decisionQuestions: DecisionQuestion[]
  ): Promise<MeasurementUtility[]> {
    try {
      const indicators = await prisma.irisKeyIndicator.findMany({
        where: { id: { in: indicatorIds } }
      });

      const utilities = await Promise.all(
        indicators.map(indicator => this.analyzeIndicatorDecisionFit(indicator, decisionQuestions))
      );

      return utilities;

    } catch (error) {
      logger.error('Error assessing indicator utility:', error);
      throw new AppError('Failed to assess indicator utility', 500);
    }
  }

  /**
   * Generate minimum viable measurement recommendations
   */
  async generateMinimumViableMeasurement(
    decisionQuestions: DecisionQuestion[]
  ): Promise<MinimumViableMeasurement> {
    try {
      // Analyze decision complexity and evidence needs
      const evidenceNeeds = this.analyzeEvidenceNeeds(decisionQuestions);
      
      // Find IRIS+ indicators that match evidence needs
      const indicatorMatches = await this.findIndicatorsForDecisions(decisionQuestions);
      
      // Calculate measurement burden
      const measurementBurden = this.calculateMeasurementBurden(indicatorMatches);
      
      // Prioritize indicators by decision impact
      const prioritized = this.prioritizeIndicatorsByDecisionImpact(indicatorMatches, decisionQuestions);
      
      // Phase the measurement approach
      const phaseApproach = this.createPhasedMeasurementApproach(prioritized, decisionQuestions);
      
      // Generate warning flags
      const warningFlags = this.generateOverengineeringWarnings(measurementBurden, decisionQuestions);

      return {
        decisionQuestions,
        essentialIndicators: phaseApproach.phase1,
        optionalIndicators: [...phaseApproach.phase2, ...phaseApproach.phase3],
        customIndicatorsNeeded: evidenceNeeds.customIndicatorsNeeded,
        measurementBurden,
        phaseApproach,
        warningFlags
      };

    } catch (error) {
      logger.error('Error generating minimum viable measurement:', error);
      throw new AppError('Failed to generate measurement recommendations', 500);
    }
  }

  /**
   * Track decision evolution over time
   */
  async trackDecisionEvolution(
    decisionQuestionId: string,
    changeType: DecisionEvolution['changeType'],
    previousState: any,
    newState: any,
    changeReason: string,
    changedBy: string
  ): Promise<void> {
    try {
      await prisma.decisionEvolution.create({
        data: {
          decisionQuestionId,
          changeType,
          previousState,
          newState,
          changeReason,
          changedBy,
          impact: this.assessChangeImpact(changeType, previousState, newState)
        }
      });

      logger.info(`Decision evolution tracked: ${changeType} for decision ${decisionQuestionId}`);
    } catch (error) {
      logger.error('Error tracking decision evolution:', error);
      throw new AppError('Failed to track decision evolution', 500);
    }
  }

  // Private helper methods

  private async generateDecisionQuestions(theory: any): Promise<string[]> {
    const prompt = `
      Based on this theory of change, suggest key decisions that will need data:

      Target Population: ${theory.targetPopulation}
      Problem: ${theory.problemDefinition}
      Activities: ${theory.activities?.join(', ')}
      Short-term Outcomes: ${theory.shortTermOutcomes?.join(', ')}
      Long-term Outcomes: ${theory.longTermOutcomes?.join(', ')}
      
      Generate 5-8 specific decision questions that would require evidence. Focus on:
      1. Strategic decisions (program direction, scale, sustainability)
      2. Operational decisions (resource allocation, implementation adjustments)
      3. Adaptive decisions (what's working, what needs change)
      
      Format each as a clear decision question starting with "Should we..." or "How should we..."
    `;

    const response = await llmService.sendMessage([
      { role: 'user', content: prompt }
    ], 'You are an expert in evidence-based decision making and program evaluation.');

    return this.parseDecisionQuestions(response.content);
  }

  private identifyRelevantDecisionCategories(theory: any): string[] {
    const categories = [];
    
    if (theory.activities?.length > 3) categories.push('Activity Optimization');
    if (theory.shortTermOutcomes?.length > 2) categories.push('Outcome Achievement');
    if (theory.impacts?.length > 0) categories.push('Impact Assessment');
    if (theory.targetPopulation?.includes('diverse') || theory.targetPopulation?.includes('multiple')) {
      categories.push('Targeting & Reach');
    }
    
    categories.push('Resource Allocation', 'Quality Improvement', 'Scale & Sustainability');
    
    return categories;
  }

  private generateDecisionMappingGuidance(suggestedQuestions: string[]): string {
    return `Let's map out the key decisions your data will inform. This prevents over-engineering and ensures every indicator serves a purpose.

**Starting with Strategic Decisions:**

I've identified some potential decisions based on your theory of change:

${suggestedQuestions.slice(0, 4).map((q, i) => `${i + 1}. ${q}`).join('\n')}

**Please tell me:**
1. Which of these decisions resonates most with your current priorities?
2. What other major decisions will you need to make in the next 12-18 months?
3. For each decision, who needs to be convinced or informed?

Remember: If you can't clearly articulate what decision the data will inform, you probably don't need to measure it.`;
  }

  private async extractDecisionsFromResponse(
    response: string,
    currentStep: string,
    contextData: any
  ): Promise<Partial<DecisionQuestion>[]> {
    const extractionPrompt = `
      Extract decision questions and requirements from this user response:
      
      "${response}"
      
      Current step: ${currentStep}
      
      Return JSON array of decision objects with:
      {
        "question": "Clear decision question",
        "decisionType": "strategic|operational|tactical|adaptive", 
        "stakeholders": ["who needs this"],
        "frequency": "how often decided",
        "urgency": "low|medium|high|critical",
        "evidenceNeeds": [{"type": "quantitative|qualitative", "description": "what evidence"}]
      }
    `;

    const response_ai = await llmService.sendMessage([
      { role: 'user', content: extractionPrompt }
    ], 'You are an expert at extracting structured decision information.');

    return this.parseDecisionExtractionResponse(response_ai.content);
  }

  private getNextDecisionMappingStep(currentStep: string, extractedDecisions: Partial<DecisionQuestion>[]): string {
    const steps = [
      '1_strategic_decisions',
      '2_operational_decisions', 
      '3_evidence_requirements',
      '4_data_gaps_assessment',
      '5_measurement_prioritization'
    ];
    
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      return steps[currentIndex + 1];
    }
    return 'complete';
  }

  private async finalizeDecisionMapping(
    organizationId: string,
    extractedDecisions: Partial<DecisionQuestion>[]
  ): Promise<DecisionQuestion[]> {
    // Store decision questions in database
    const decisions = await Promise.all(
      extractedDecisions.map(async (decision) => {
        const created = await prisma.decisionQuestion.create({
          data: {
            organizationId,
            question: decision.question!,
            decisionType: decision.decisionType || 'operational',
            stakeholders: decision.stakeholders || [],
            frequency: decision.frequency || 'quarterly',
            urgency: decision.urgency || 'medium',
            evidenceNeeds: decision.evidenceNeeds || [],
            currentDataSources: [],
            dataGaps: []
          }
        });
        return created as DecisionQuestion;
      })
    );

    return decisions;
  }

  private generateCompletionMessage(
    decisions: DecisionQuestion[],
    minimumViable: MinimumViableMeasurement
  ): string {
    return `🎯 **Excellent! Your decision mapping is complete.**

**${decisions.length} Key Decisions Identified:**
${decisions.map((d, i) => `${i + 1}. ${d.question}`).join('\n')}

**Minimum Viable Measurement Approach:**
- **Phase 1 (Essential):** ${minimumViable.phaseApproach.phase1.length} indicators
- **Phase 2 (Valuable):** ${minimumViable.phaseApproach.phase2.length} indicators  
- **Phase 3 (Optimization):** ${minimumViable.phaseApproach.phase3.length} indicators

**Measurement Burden:** ${minimumViable.measurementBurden.complexity} complexity, ~${minimumViable.measurementBurden.estimatedHoursPerCycle} hours per cycle

${minimumViable.warningFlags.length > 0 ? 
  `**⚠️ Warning Flags:**\n${minimumViable.warningFlags.map(w => `- ${w}`).join('\n')}` : 
  '**✅ Good balance - no over-engineering detected**'
}

Ready to start selecting indicators that directly inform these decisions!`;
  }

  private generateNextStepMessage(step: string, suggestions: string[]): string {
    const messages = {
      '2_operational_decisions': "Great! Now let's think about **operational decisions** - day-to-day choices about implementation, resource allocation, and program delivery.",
      '3_evidence_requirements': "Perfect! Now let's get specific about **evidence requirements** - what type and quality of data do you need for each decision?",
      '4_data_gaps_assessment': "Excellent! Let's assess **current data gaps** - what evidence do you already have vs. what you need?",
      '5_measurement_prioritization': "Almost done! Let's **prioritize measurement** - which decisions are most urgent and need data first?"
    };
    
    const baseMessage = messages[step] || "Let's continue mapping your decisions.";
    const suggestionText = suggestions.length > 0 ? 
      `\n\n**Suggestions:**\n${suggestions.map(s => `- ${s}`).join('\n')}` : '';
    
    return baseMessage + suggestionText;
  }

  private async generateNextStepSuggestions(step: string, decisions: Partial<DecisionQuestion>[]): Promise<string[]> {
    // Generate contextual suggestions based on step and current decisions
    return [
      'Consider both short-term and long-term decisions',
      'Think about decisions that require stakeholder buy-in',
      'Include decisions about resource allocation and priorities'
    ];
  }

  private calculateDecisionMappingProgress(step: string): number {
    const stepProgress = {
      '1_strategic_decisions': 20,
      '2_operational_decisions': 40,
      '3_evidence_requirements': 60,
      '4_data_gaps_assessment': 80,
      '5_measurement_prioritization': 95,
      'complete': 100
    };
    
    return stepProgress[step] || 0;
  }

  private async analyzeIndicatorDecisionFit(
    indicator: any,
    decisions: DecisionQuestion[]
  ): Promise<MeasurementUtility> {
    // Analyze how well this indicator informs the mapped decisions
    const prompt = `
      Analyze how this IRIS+ indicator relates to these decision questions:
      
      Indicator: "${indicator.name}"
      Description: "${indicator.description}"
      
      Decisions:
      ${decisions.map((d, i) => `${i + 1}. ${d.question}`).join('\n')}
      
      Rate utility 0-100 and identify which decisions this indicator directly/indirectly informs.
    `;

    const response = await llmService.sendMessage([
      { role: 'user', content: prompt }
    ], 'You are an expert in measurement utility analysis.');

    return this.parseUtilityAnalysis(response.content, indicator.id, decisions);
  }

  private analyzeEvidenceNeeds(decisions: DecisionQuestion[]): any {
    // Analyze what types of evidence the decisions require
    return {
      quantitativeNeeds: decisions.filter(d => 
        d.evidenceNeeds.some(e => e.type === 'quantitative' || e.type === 'mixed')
      ).length,
      qualitativeNeeds: decisions.filter(d => 
        d.evidenceNeeds.some(e => e.type === 'qualitative' || e.type === 'mixed')
      ).length,
      customIndicatorsNeeded: []
    };
  }

  private async findIndicatorsForDecisions(decisions: DecisionQuestion[]): Promise<any[]> {
    // Find IRIS+ indicators that match decision evidence needs
    return [];
  }

  private calculateMeasurementBurden(indicators: any[]): any {
    return {
      totalIndicators: indicators.length,
      estimatedHoursPerCycle: indicators.length * 2, // Rough estimate
      complexity: indicators.length > 15 ? 'high' : indicators.length > 8 ? 'medium' : 'low',
      riskOfOverengineering: Math.min(100, indicators.length * 6)
    };
  }

  private prioritizeIndicatorsByDecisionImpact(indicators: any[], decisions: DecisionQuestion[]): any[] {
    // Prioritize indicators by how many high-priority decisions they inform
    return indicators;
  }

  private createPhasedMeasurementApproach(indicators: any[], decisions: DecisionQuestion[]): any {
    // Create phased approach based on decision urgency and indicator utility
    const totalIndicators = indicators.length;
    const phase1Count = Math.max(3, Math.floor(totalIndicators * 0.4));
    const phase2Count = Math.floor(totalIndicators * 0.4);
    
    return {
      phase1: indicators.slice(0, phase1Count).map(i => i.id),
      phase2: indicators.slice(phase1Count, phase1Count + phase2Count).map(i => i.id),
      phase3: indicators.slice(phase1Count + phase2Count).map(i => i.id)
    };
  }

  private generateOverengineeringWarnings(burden: any, decisions: DecisionQuestion[]): string[] {
    const warnings = [];
    
    if (burden.riskOfOverengineering > 70) {
      warnings.push('High risk of over-engineering - consider reducing indicators');
    }
    
    if (burden.totalIndicators > decisions.length * 3) {
      warnings.push('More than 3 indicators per decision - may be excessive');
    }
    
    if (burden.complexity === 'high') {
      warnings.push('High complexity measurement system - ensure you have capacity');
    }
    
    return warnings;
  }

  private assessChangeImpact(
    changeType: DecisionEvolution['changeType'],
    previousState: any,
    newState: any
  ): 'low' | 'medium' | 'high' {
    if (changeType === 'question_refined') return 'medium';
    if (changeType === 'data_source_changed') return 'high';
    if (changeType === 'decision_resolved') return 'low';
    return 'medium';
  }

  // Parsing helper methods
  private parseDecisionQuestions(content: string): string[] {
    try {
      // Try to extract structured questions from LLM response
      const lines = content.split('\n').filter(line => 
        line.includes('Should we') || line.includes('How should we') || line.includes('?')
      );
      return lines.slice(0, 8).map(line => line.trim().replace(/^\d+\.\s*/, ''));
    } catch {
      return [
        'Should we continue, modify, or scale this program?',
        'How should we allocate resources across different activities?',
        'Should we adjust our approach based on early results?'
      ];
    }
  }

  private parseDecisionExtractionResponse(content: string): Partial<DecisionQuestion>[] {
    try {
      return JSON.parse(content) || [];
    } catch {
      return [];
    }
  }

  private parseUtilityAnalysis(content: string, indicatorId: string, decisions: DecisionQuestion[]): MeasurementUtility {
    // Parse LLM analysis of indicator utility
    return {
      indicatorId,
      decisionQuestions: decisions.map(d => d.id),
      utilityScore: 75, // Default
      directlyInforms: 1,
      indirectlySupports: 2,
      redundancyRisk: 30,
      dataQualityNeeds: {
        precision: 'medium',
        frequency: 'quarterly',
        timeliness: 'within 30 days'
      },
      costBenefitRatio: 3.2,
      recommendations: ['Consider collecting quarterly', 'Good fit for key decisions']
    };
  }
}

export const decisionMappingService = new DecisionMappingService();