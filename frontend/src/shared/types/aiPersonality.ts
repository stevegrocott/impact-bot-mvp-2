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
  emotionalIntelligence: 'high' | 'medium' | 'low';
  questionApproach: 'leading' | 'open_ended' | 'structured' | 'socratic';
}

export interface ContextualGuidance {
  phaseSpecialization: string[];
  methodologyFocus: string[];
  pitfallPrevention: string[];
  decisionSupport: string[];
  stakeholderCommunication: string[];
  technicalDepth: 'high' | 'medium' | 'low';
}

export interface InteractionPattern {
  triggerContext: string;
  responseStyle: string;
  followUpQuestions: string[];
  examples: string[];
  successIndicators: string[];
}

export interface PersonalityTrigger {
  context: string;
  userRole: string[];
  organizationStage: string[];
  confidenceThreshold: number;
  priority: 'high' | 'medium' | 'low';
  activationConditions: string[];
}

export interface ResponseTemplate {
  scenario: string;
  template: string;
  variables: string[];
  adaptationRules: string[];
  followUpOptions: string[];
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

export interface PersonalityAnalytics {
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
}

export interface PersonalityRecommendation {
  personalityId: string;
  personalityName: string;
  reason: string;
  confidence: number;
  context: string;
}

export interface PersonalityInteractionState {
  currentPersonality: AIPersonality | null;
  isSelecting: boolean;
  isGenerating: boolean;
  contextualAwareness: {
    learningPatterns: string[];
    adaptationInsights: string[];
    confidenceLevel: number;
    userBehaviorPatterns: string[];
  };
  realTimeGuidance: {
    activeGuidance: string[];
    preventionWarnings: string[];
    opportunityAlerts: string[];
  };
  interactionMetrics: {
    responseTime: number;
    userEngagement: number;
    taskCompletion: number;
    satisfactionScore: number;
  };
}

export interface AIPersonalityUIState {
  availablePersonalities: AIPersonality[];
  selectedPersonality: AIPersonality | null;
  personalitySelection: PersonalitySelection | null;
  recommendations: PersonalityRecommendation[];
  analytics: PersonalityAnalytics | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  interactionState: PersonalityInteractionState;
  visualState: {
    showPersonalitySwitch: boolean;
    showAnalytics: boolean;
    showRecommendations: boolean;
    activeVisualization: 'chat' | 'analytics' | 'selection';
  };
}