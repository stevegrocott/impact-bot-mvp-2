/**
 * Theory of Change Service
 * Core foundation capture service supporting upload OR guided creation OR hybrid approach
 * Prevents "jumping to metrics without context" pitfall
 */

import { Organization, Conversation, ConversationMessage } from '@prisma/client';
import { prisma } from '@/config/database';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { llmService } from './llm';

// Theory of Change structure
export interface TheoryOfChangeStructure {
  targetPopulation: string;
  problemDefinition: string;
  activities: string[];
  outputs: string[];
  shortTermOutcomes: string[];
  longTermOutcomes: string[];
  impacts: string[];
  assumptions: string[];
  externalFactors: string[];
  interventionType: string;
  sector: string;
  geographicScope: string;
}

// Foundation readiness assessment
export interface FoundationReadiness {
  completenessScore: number; // 0-100
  readinessLevel: 'insufficient' | 'basic' | 'good' | 'excellent';
  missingElements: string[];
  strengthAreas: string[];
  recommendations: string[];
  allowsBasicAccess: boolean;
  allowsIntermediateAccess: boolean;
  allowsAdvancedAccess: boolean;
}

// Document parsing result
export interface DocumentParseResult {
  extractedContent: Partial<TheoryOfChangeStructure>;
  confidence: number;
  needsGuidedCompletion: boolean;
  identifiedGaps: string[];
  suggestedQuestions: string[];
}

// Guided conversation state
export interface GuidedConversationState {
  currentStep: number;
  totalSteps: number;
  completedElements: string[];
  pendingElements: string[];
  conversationId: string;
  partialTheory: Partial<TheoryOfChangeStructure>;
}

class TheoryOfChangeService {
  /**
   * Entry point: Determine pathway based on user input
   */
  async assessPathway(
    organizationId: string, 
    hasDocuments: boolean, 
    hasPartialTheory: boolean
  ): Promise<{
    recommendedPathway: 'upload' | 'guided' | 'hybrid';
    message: string;
    options: string[];
  }> {
    try {
      // Check if organization already has a theory of change
      const existingTheory = await this.getTheoryOfChange(organizationId);
      
      if (existingTheory) {
        return {
          recommendedPathway: 'hybrid',
          message: "I see you already have a theory of change. Would you like to update it or start fresh?",
          options: ['Update existing theory', 'Upload new documents', 'Start guided creation', 'Continue with current theory']
        };
      }

      if (hasDocuments) {
        return {
          recommendedPathway: 'upload',
          message: "Great! I can extract your theory of change from your documents. Upload your strategy documents, logic models, or theory of change files.",
          options: ['Upload documents (PDF, Word, PowerPoint)', 'I prefer guided conversation instead', 'I have both documents and want guidance']
        };
      }

      if (hasPartialTheory) {
        return {
          recommendedPathway: 'hybrid',
          message: "Perfect! I'll help you build on what you have. We can combine your existing thinking with guided development.",
          options: ['Tell me what you have so far', 'Upload partial documents', 'Start structured conversation']
        };
      }

      return {
        recommendedPathway: 'guided',
        message: "No problem! I'll guide you through creating a theory of change in about 15-20 minutes. This foundation is essential for effective measurement.",
        options: ['Start guided conversation', 'I actually do have some documents', 'Learn why this matters first']
      };

    } catch (error) {
      logger.error('Error assessing pathway:', error);
      throw new AppError('Failed to assess theory of change pathway', 500);
    }
  }

  /**
   * Upload and parse documents to extract theory of change
   */
  async parseDocuments(
    organizationId: string,
    documents: { filename: string; content: string; type: string }[]
  ): Promise<DocumentParseResult> {
    try {
      logger.info(`Parsing ${documents.length} documents for organization ${organizationId}`);

      // Combine all document content
      const combinedContent = documents.map(doc => 
        `--- ${doc.filename} ---\n${doc.content}`
      ).join('\n\n');

      // LLM prompt for theory of change extraction
      const extractionPrompt = `
        Analyze these documents and extract the theory of change elements:

        ${combinedContent}

        Extract and structure the following elements:
        1. Target Population: Who does this work aim to help?
        2. Problem Definition: What problem is being addressed?
        3. Activities: What activities/interventions are planned?
        4. Outputs: What direct products/services result from activities?
        5. Short-term Outcomes: What changes happen in 1-2 years?
        6. Long-term Outcomes: What changes happen in 3-5 years?
        7. Impacts: What ultimate changes in the world?
        8. Assumptions: What assumptions underlie this theory?
        9. External Factors: What external factors could affect success?
        10. Intervention Type: What type of intervention is this?
        11. Sector: What sector does this work in?
        12. Geographic Scope: What geographic area does this cover?

        Return a JSON response with:
        - extracted: object with the elements above
        - confidence: number 0-1 indicating extraction confidence
        - gaps: array of missing or unclear elements
        - questions: array of clarifying questions for gaps

        Be thorough but honest about what you can and cannot extract clearly.
      `;

      const response = await llmService.sendMessage([
        { role: 'user', content: extractionPrompt }
      ], 'You are an expert in theory of change analysis and document extraction.');

      // Parse LLM response
      const parsed = this.parseLLMResponse(response.content);
      
      // Calculate completeness and determine next steps
      const completenessScore = this.calculateCompleteness(parsed.extracted);
      const needsGuidedCompletion = completenessScore < 70 || parsed.gaps.length > 3;

      // Store preliminary theory
      if (completenessScore > 30) {
        // Note: In a real implementation, we'd get userId from the authenticated user
        // For now, we'll handle this in the API layer
        logger.info('Preliminary theory ready for storage - will be saved via API endpoint');
      }

      return {
        extractedContent: parsed.extracted,
        confidence: parsed.confidence,
        needsGuidedCompletion,
        identifiedGaps: parsed.gaps,
        suggestedQuestions: parsed.questions
      };

    } catch (error) {
      logger.error('Error parsing documents:', error);
      throw new AppError('Failed to parse theory of change documents', 500);
    }
  }

  /**
   * Start guided theory of change conversation
   */
  async startGuidedConversation(
    organizationId: string,
    userId: string,
    partialTheory?: Partial<TheoryOfChangeStructure>
  ): Promise<GuidedConversationState> {
    try {
      // Create conversation for guided theory development
      const conversation = await prisma.conversation.create({
        data: {
          userId,
          organizationId,
          title: 'Theory of Change Development',
          conversationType: 'theory_of_change_guided',
          contextData: {
            pathway: 'guided',
            partialTheory: partialTheory || {},
            startedAt: new Date().toISOString()
          },
          currentStep: '1_impact_vision',
          completionPercentage: 0
        }
      });

      // Determine starting point based on partial theory
      const completedElements = this.identifyCompletedElements(partialTheory);
      const pendingElements = this.identifyPendingElements(completedElements);

      // Send initial message
      const initialMessage = this.generateInitialMessage(completedElements);
      
      await prisma.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          messageType: 'assistant',
          content: initialMessage,
          metadata: {
            step: '1_impact_vision',
            elements: pendingElements,
            guidance: 'theory_of_change_introduction'
          }
        }
      });

      return {
        currentStep: 1,
        totalSteps: 9,
        completedElements,
        pendingElements,
        conversationId: conversation.id,
        partialTheory: partialTheory || {}
      };

    } catch (error) {
      logger.error('Error starting guided conversation:', error);
      throw new AppError('Failed to start guided theory of change conversation', 500);
    }
  }

  /**
   * Continue guided conversation with user response
   */
  async continueGuidedConversation(
    conversationId: string,
    userResponse: string
  ): Promise<{
    nextMessage: string;
    isComplete: boolean;
    updatedState: GuidedConversationState;
    foundationReadiness?: FoundationReadiness;
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

      // Process response and update theory
      const updatedTheory = await this.processGuidedResponse(
        conversation.contextData as any,
        conversation.currentStep!,
        userResponse
      );

      // Determine next step
      const nextStep = this.getNextStep(conversation.currentStep!, updatedTheory);
      const isComplete = nextStep === 'complete';

      let nextMessage: string;
      let foundationReadiness: FoundationReadiness | undefined;

      if (isComplete) {
        // Save completed theory and assess readiness
        await this.storeTheoryOfChange(conversation.organizationId, updatedTheory, 'complete', conversation.userId);
        foundationReadiness = await this.assessFoundationReadiness(conversation.organizationId);
        
        nextMessage = this.generateCompletionMessage(foundationReadiness);
      } else {
        nextMessage = this.generateNextStepMessage(nextStep, updatedTheory);
      }

      // Update conversation
      const updatedConversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          currentStep: nextStep,
          completionPercentage: this.calculateProgress(nextStep),
          contextData: {
            ...(conversation.contextData as any),
            partialTheory: updatedTheory,
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
            guidance: isComplete ? 'theory_completion' : `theory_step_${nextStep}`
          }
        }
      });

      return {
        nextMessage,
        isComplete,
        updatedState: {
          currentStep: this.getStepNumber(nextStep),
          totalSteps: 9,
          completedElements: this.identifyCompletedElements(updatedTheory),
          pendingElements: this.identifyPendingElements(this.identifyCompletedElements(updatedTheory)),
          conversationId,
          partialTheory: updatedTheory
        },
        foundationReadiness
      };

    } catch (error) {
      logger.error('Error continuing guided conversation:', error);
      throw new AppError('Failed to continue guided conversation', 500);
    }
  }

  /**
   * Assess foundation readiness for phase-gated access
   */
  async assessFoundationReadiness(organizationId: string): Promise<FoundationReadiness> {
    try {
      const theory = await this.getTheoryOfChange(organizationId);
      
      if (!theory) {
        return {
          completenessScore: 0,
          readinessLevel: 'insufficient',
          missingElements: ['Complete theory of change required'],
          strengthAreas: [],
          recommendations: ['Complete theory of change development to access measurement features'],
          allowsBasicAccess: false,
          allowsIntermediateAccess: false,
          allowsAdvancedAccess: false
        };
      }

      // Assess completeness of each element
      const elements = {
        targetPopulation: theory.targetPopulation ? 20 : 0,
        problemDefinition: theory.problemDefinition ? 15 : 0,
        activities: theory.activities?.length > 0 ? 15 : 0,
        outputs: theory.outputs?.length > 0 ? 10 : 0,
        shortTermOutcomes: theory.shortTermOutcomes?.length > 0 ? 15 : 0,
        longTermOutcomes: theory.longTermOutcomes?.length > 0 ? 15 : 0,
        impacts: theory.impacts?.length > 0 ? 10 : 0
      };

      const completenessScore = Object.values(elements).reduce((sum, score) => sum + score, 0);

      // Determine readiness level and access permissions
      let readinessLevel: FoundationReadiness['readinessLevel'];
      let allowsBasicAccess = false;
      let allowsIntermediateAccess = false;
      let allowsAdvancedAccess = false;

      if (completenessScore >= 90) {
        readinessLevel = 'excellent';
        allowsBasicAccess = allowsIntermediateAccess = allowsAdvancedAccess = true;
      } else if (completenessScore >= 70) {
        readinessLevel = 'good';
        allowsBasicAccess = allowsIntermediateAccess = true;
      } else if (completenessScore >= 50) {
        readinessLevel = 'basic';
        allowsBasicAccess = true;
      } else {
        readinessLevel = 'insufficient';
      }

      // Identify missing elements and strengths
      const missingElements = Object.entries(elements)
        .filter(([_, score]) => score === 0)
        .map(([element, _]) => element);

      const strengthAreas = Object.entries(elements)
        .filter(([_, score]) => score > 0)
        .map(([element, _]) => element);

      const recommendations = this.generateRecommendations(missingElements, readinessLevel);

      return {
        completenessScore,
        readinessLevel,
        missingElements,
        strengthAreas,
        recommendations,
        allowsBasicAccess,
        allowsIntermediateAccess,
        allowsAdvancedAccess
      };

    } catch (error) {
      logger.error('Error assessing foundation readiness:', error);
      throw new AppError('Failed to assess foundation readiness', 500);
    }
  }

  /**
   * Get existing theory of change for organization
   */
  async getTheoryOfChange(organizationId: string): Promise<TheoryOfChangeStructure | null> {
    try {
      const theory = await prisma.organizationTheoryOfChange.findUnique({
        where: { organizationId },
        include: { foundationReadiness: true }
      });

      if (!theory) return null;

      return {
        targetPopulation: theory.targetPopulation || '',
        problemDefinition: theory.problemDefinition || '',
        activities: Array.isArray(theory.activities) ? theory.activities as string[] : [],
        outputs: Array.isArray(theory.outputs) ? theory.outputs as string[] : [],
        shortTermOutcomes: Array.isArray(theory.shortTermOutcomes) ? theory.shortTermOutcomes as string[] : [],
        longTermOutcomes: Array.isArray(theory.longTermOutcomes) ? theory.longTermOutcomes as string[] : [],
        impacts: Array.isArray(theory.impacts) ? theory.impacts as string[] : [],
        assumptions: Array.isArray(theory.assumptions) ? theory.assumptions as string[] : [],
        externalFactors: Array.isArray(theory.externalFactors) ? theory.externalFactors as string[] : [],
        interventionType: theory.interventionType || '',
        sector: theory.sector || '',
        geographicScope: theory.geographicScope || ''
      };
    } catch (error) {
      logger.error('Error getting theory of change:', error);
      throw new AppError('Failed to retrieve theory of change', 500);
    }
  }

  /**
   * Store theory of change
   */
  private async storeTheoryOfChange(
    organizationId: string,
    theory: Partial<TheoryOfChangeStructure>,
    status: 'draft' | 'complete',
    userId?: string
  ): Promise<void> {
    try {
      // Check if theory already exists
      const existing = await prisma.organizationTheoryOfChange.findUnique({
        where: { organizationId }
      });

      const theoryData = {
        targetPopulation: theory.targetPopulation,
        problemDefinition: theory.problemDefinition,
        activities: theory.activities || [],
        outputs: theory.outputs || [],
        shortTermOutcomes: theory.shortTermOutcomes || [],
        longTermOutcomes: theory.longTermOutcomes || [],
        impacts: theory.impacts || [],
        assumptions: theory.assumptions || [],
        externalFactors: theory.externalFactors || [],
        interventionType: theory.interventionType,
        sector: theory.sector,
        geographicScope: theory.geographicScope,
        status
      };

      let theoryRecord;

      if (existing) {
        // Update existing theory
        theoryRecord = await prisma.organizationTheoryOfChange.update({
          where: { organizationId },
          data: {
            ...theoryData,
            version: existing.version + 1
          }
        });
      } else {
        // Create new theory
        if (!userId) {
          throw new AppError('User ID required for creating new theory of change', 400);
        }

        theoryRecord = await prisma.organizationTheoryOfChange.create({
          data: {
            organizationId,
            createdBy: userId,
            ...theoryData
          }
        });
      }

      // Update foundation readiness if theory is complete
      if (status === 'complete') {
        const readiness = await this.calculateFoundationReadiness(theory);
        
        await prisma.foundationReadiness.upsert({
          where: { theoryOfChangeId: theoryRecord.id },
          create: {
            theoryOfChangeId: theoryRecord.id,
            ...readiness
          },
          update: {
            ...readiness,
            lastAssessedAt: new Date()
          }
        });
      }

      logger.info(`Successfully stored theory of change for organization ${organizationId} with status ${status}`);
    } catch (error) {
      logger.error('Error storing theory of change:', error);
      throw new AppError('Failed to store theory of change', 500);
    }
  }

  /**
   * Calculate foundation readiness from theory structure
   */
  private calculateFoundationReadiness(theory: Partial<TheoryOfChangeStructure>): {
    completenessScore: number;
    readinessLevel: string;
    missingElements: string[];
    strengthAreas: string[];
    recommendations: string[];
    allowsBasicAccess: boolean;
    allowsIntermediateAccess: boolean;
    allowsAdvancedAccess: boolean;
  } {
    // Assess completeness of each element (weights based on importance)
    const elements = {
      targetPopulation: theory.targetPopulation ? 20 : 0,
      problemDefinition: theory.problemDefinition ? 15 : 0,
      activities: (theory.activities?.length || 0) > 0 ? 15 : 0,
      outputs: (theory.outputs?.length || 0) > 0 ? 10 : 0,
      shortTermOutcomes: (theory.shortTermOutcomes?.length || 0) > 0 ? 15 : 0,
      longTermOutcomes: (theory.longTermOutcomes?.length || 0) > 0 ? 15 : 0,
      impacts: (theory.impacts?.length || 0) > 0 ? 10 : 0
    };

    const completenessScore = Object.values(elements).reduce((sum, score) => sum + score, 0);

    // Determine readiness level and access permissions
    let readinessLevel: string;
    let allowsBasicAccess = false;
    let allowsIntermediateAccess = false;
    let allowsAdvancedAccess = false;

    if (completenessScore >= 90) {
      readinessLevel = 'excellent';
      allowsBasicAccess = allowsIntermediateAccess = allowsAdvancedAccess = true;
    } else if (completenessScore >= 70) {
      readinessLevel = 'good';
      allowsBasicAccess = allowsIntermediateAccess = true;
    } else if (completenessScore >= 50) {
      readinessLevel = 'basic';
      allowsBasicAccess = true;
    } else {
      readinessLevel = 'insufficient';
    }

    // Identify missing elements and strengths
    const missingElements = Object.entries(elements)
      .filter(([_, score]) => score === 0)
      .map(([element, _]) => element);

    const strengthAreas = Object.entries(elements)
      .filter(([_, score]) => score > 0)
      .map(([element, _]) => element);

    const recommendations = this.generateRecommendations(missingElements, readinessLevel);

    return {
      completenessScore,
      readinessLevel,
      missingElements,
      strengthAreas,
      recommendations,
      allowsBasicAccess,
      allowsIntermediateAccess,
      allowsAdvancedAccess
    };
  }

  // Helper methods for guided conversation flow
  private identifyCompletedElements(theory?: Partial<TheoryOfChangeStructure>): string[] {
    if (!theory) return [];
    
    const elements = [];
    if (theory.targetPopulation) elements.push('targetPopulation');
    if (theory.problemDefinition) elements.push('problemDefinition');
    if (theory.activities?.length) elements.push('activities');
    if (theory.outputs?.length) elements.push('outputs');
    if (theory.shortTermOutcomes?.length) elements.push('shortTermOutcomes');
    if (theory.longTermOutcomes?.length) elements.push('longTermOutcomes');
    if (theory.impacts?.length) elements.push('impacts');
    if (theory.assumptions?.length) elements.push('assumptions');
    if (theory.externalFactors?.length) elements.push('externalFactors');
    
    return elements;
  }

  private identifyPendingElements(completedElements: string[]): string[] {
    const allElements = [
      'targetPopulation', 'problemDefinition', 'activities', 'outputs',
      'shortTermOutcomes', 'longTermOutcomes', 'impacts', 'assumptions', 'externalFactors'
    ];
    
    return allElements.filter(element => !completedElements.includes(element));
  }

  private generateInitialMessage(completedElements: string[]): string {
    if (completedElements.length > 0) {
      return `I see you already have some elements of your theory of change. Let's build on that and fill in the gaps. We'll start with your impact vision - what change do you want to see in the world?`;
    }
    
    return `Let's build your theory of change together! This will take about 15-20 minutes and is essential for effective measurement. We'll start with the end in mind.

**What change do you want to see in the world?** What would success look like in 5-10 years if your work is completely successful?`;
  }

  private async processGuidedResponse(
    contextData: any,
    currentStep: string,
    userResponse: string
  ): Promise<Partial<TheoryOfChangeStructure>> {
    // Process user response based on current step
    const updatedTheory = { ...(contextData.partialTheory || {}) };
    
    switch (currentStep) {
      case '1_impact_vision':
        updatedTheory.impacts = [userResponse];
        break;
      case '2_target_population':
        updatedTheory.targetPopulation = userResponse;
        break;
      case '3_problem_definition':
        updatedTheory.problemDefinition = userResponse;
        break;
      case '4_activities':
        updatedTheory.activities = userResponse.split('\n').filter(a => a.trim());
        break;
      case '5_outputs':
        updatedTheory.outputs = userResponse.split('\n').filter(o => o.trim());
        break;
      case '6_short_term_outcomes':
        updatedTheory.shortTermOutcomes = userResponse.split('\n').filter(o => o.trim());
        break;
      case '7_long_term_outcomes':
        updatedTheory.longTermOutcomes = userResponse.split('\n').filter(o => o.trim());
        break;
      case '8_assumptions':
        updatedTheory.assumptions = userResponse.split('\n').filter(a => a.trim());
        break;
      case '9_external_factors':
        updatedTheory.externalFactors = userResponse.split('\n').filter(f => f.trim());
        break;
    }
    
    return updatedTheory;
  }

  private getNextStep(currentStep: string, theory: Partial<TheoryOfChangeStructure>): string {
    const steps = [
      '1_impact_vision', '2_target_population', '3_problem_definition',
      '4_activities', '5_outputs', '6_short_term_outcomes',
      '7_long_term_outcomes', '8_assumptions', '9_external_factors'
    ];
    
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      return steps[currentIndex + 1];
    }
    return 'complete';
  }

  private generateNextStepMessage(step: string, theory: Partial<TheoryOfChangeStructure>): string {
    const messages = {
      '2_target_population': "Great! Now, **who specifically are you trying to help?** Can you describe your target population or beneficiaries?",
      '3_problem_definition': "Perfect! **What's the root problem you're addressing?** What's preventing your target population from achieving the change you described?",
      '4_activities': "Excellent! **What do you do to address this problem?** What are your main activities or interventions? (List each on a new line)",
      '5_outputs': "Great work! **What are the direct products or services that result from your activities?** What do you deliver? (List each on a new line)",
      '6_short_term_outcomes': "Perfect! **What changes happen in the first 1-2 years?** What do you see changing in your target population? (List each on a new line)",
      '7_long_term_outcomes': "Excellent! **What bigger changes happen over 3-5 years?** What are the longer-term effects of your work? (List each on a new line)",
      '8_assumptions': "Great! **What assumptions are you making?** What needs to be true for your theory to work? (List each on a new line)",
      '9_external_factors': "Almost done! **What external factors could affect this?** What's outside your control but could impact success? (List each on a new line)"
    };
    
    return messages[step] || "Please provide your response.";
  }

  private generateCompletionMessage(readiness: FoundationReadiness): string {
    return `🎉 **Excellent! Your theory of change is complete.**

**Foundation Readiness Score: ${readiness.completenessScore}/100 (${readiness.readinessLevel})**

${readiness.allowsAdvancedAccess ? 
  "You have a comprehensive theory of change! You now have access to all measurement features." :
  readiness.allowsIntermediateAccess ?
  "Great foundation! You can access basic and intermediate measurement features." :
  readiness.allowsBasicAccess ?
  "Good start! You can access basic measurement features. Consider strengthening your theory for more advanced tools." :
  "Your theory needs a bit more development before accessing measurement features."
}

**Next steps:**
- Review and refine your theory of change anytime
- Begin exploring relevant IRIS+ indicators
- Set up decision mapping for your measurement approach

Ready to start measuring your impact effectively!`;
  }

  private calculateProgress(step: string): number {
    const stepNumbers = {
      '1_impact_vision': 11,
      '2_target_population': 22,
      '3_problem_definition': 33,
      '4_activities': 44,
      '5_outputs': 55,
      '6_short_term_outcomes': 66,
      '7_long_term_outcomes': 77,
      '8_assumptions': 88,
      '9_external_factors': 99,
      'complete': 100
    };
    
    return stepNumbers[step] || 0;
  }

  private getStepNumber(step: string): number {
    const stepNumbers = {
      '1_impact_vision': 1,
      '2_target_population': 2,
      '3_problem_definition': 3,
      '4_activities': 4,
      '5_outputs': 5,
      '6_short_term_outcomes': 6,
      '7_long_term_outcomes': 7,
      '8_assumptions': 8,
      '9_external_factors': 9,
      'complete': 9
    };
    
    return stepNumbers[step] || 1;
  }

  private parseLLMResponse(content: string): {
    extracted: Partial<TheoryOfChangeStructure>;
    confidence: number;
    gaps: string[];
    questions: string[];
  } {
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(content);
      return {
        extracted: parsed.extracted || {},
        confidence: parsed.confidence || 0.5,
        gaps: parsed.gaps || [],
        questions: parsed.questions || []
      };
    } catch {
      // Fallback: basic text parsing
      return {
        extracted: {},
        confidence: 0.3,
        gaps: ['Document parsing needs manual review'],
        questions: ['Could you clarify your target population?', 'What are your main activities?']
      };
    }
  }

  private calculateCompleteness(theory: Partial<TheoryOfChangeStructure>): number {
    const elements = [
      theory.targetPopulation,
      theory.problemDefinition,
      theory.activities?.length,
      theory.outputs?.length,
      theory.shortTermOutcomes?.length,
      theory.longTermOutcomes?.length,
      theory.impacts?.length
    ];
    
    const completed = elements.filter(e => e).length;
    return Math.round((completed / elements.length) * 100);
  }

  private generateRecommendations(missingElements: string[], readinessLevel: string): string[] {
    const recommendations = [];
    
    if (missingElements.includes('targetPopulation')) {
      recommendations.push('Define your target population more specifically');
    }
    if (missingElements.includes('shortTermOutcomes')) {
      recommendations.push('Clarify what changes you expect to see in 1-2 years');
    }
    if (missingElements.includes('longTermOutcomes')) {
      recommendations.push('Describe the longer-term changes your work will create');
    }
    
    if (readinessLevel === 'insufficient') {
      recommendations.push('Complete the guided theory of change development');
    }
    
    return recommendations;
  }
}

export const theoryOfChangeService = new TheoryOfChangeService();