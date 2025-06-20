/**
 * Enhanced Types for Sophisticated Indicator Selection Interface
 * Supports adaptive recommendations, IRIS+ integration, and ML-powered insights
 */

import { AIPersonality } from '../../../shared/types/aiPersonality';

// Enhanced IRIS+ Indicator with AI-powered metadata
export interface EnhancedIrisIndicator {
  id: string;
  name: string;
  description: string;
  category: string;
  theme: string;
  type: 'output' | 'outcome' | 'impact';
  unit: string;
  tags: string[];
  
  // IRIS+ specific fields
  irisCode: string;
  irisVersion: string;
  sdgAlignment: string[];
  goalAlignment: IrisGoalAlignment[];
  
  // AI-powered enhancements
  aiRecommendationScore: number;
  contextualRelevance: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  dataCollectionDifficulty: 'easy' | 'moderate' | 'challenging';
  stakeholderRelevance: StakeholderRelevance[];
  
  // Peer benchmarking
  peerUsageFrequency: number;
  sectorPopularity: SectorPopularity[];
  bestPracticeExamples: BestPracticeExample[];
  
  // Advanced metadata
  measurementGuidance: MeasurementGuidance;
  pitfallWarnings: string[];
  qualityIndicators: QualityIndicator[];
  alternativeFormulations: AlternativeFormulation[];
  
  // Learning and adaptation
  organizationalFit: number;
  historicalPerformance?: HistoricalPerformance;
  customizationSuggestions: CustomizationSuggestion[];
}

export interface IrisGoalAlignment {
  goalId: string;
  goalName: string;
  alignmentStrength: number;
  outcomeContribution: string;
}

export interface StakeholderRelevance {
  stakeholderType: string;
  relevanceScore: number;
  specificInterests: string[];
}

export interface SectorPopularity {
  sector: string;
  usagePercentage: number;
  averageSuccessRate: number;
}

export interface BestPracticeExample {
  organizationType: string;
  contextDescription: string;
  implementationApproach: string;
  keySuccessFactors: string[];
  measuredOutcomes: string[];
}

export interface MeasurementGuidance {
  dataSourceSuggestions: string[];
  collectionMethodology: string[];
  frequencyRecommendations: string;
  qualityCheckpoints: string[];
  commonPitfalls: string[];
  mitigationStrategies: string[];
}

export interface QualityIndicator {
  dimension: 'relevance' | 'reliability' | 'validity' | 'timeliness' | 'accessibility';
  score: number;
  explanation: string;
  improvementSuggestions: string[];
}

export interface AlternativeFormulation {
  variant: string;
  useCase: string;
  advantages: string[];
  tradeoffs: string[];
}

export interface HistoricalPerformance {
  organizationId: string;
  previousUsage: boolean;
  successRate: number;
  challengesFaced: string[];
  lessonsLearned: string[];
}

export interface CustomizationSuggestion {
  context: string;
  modification: string;
  reasoning: string;
  implementationGuidance: string;
}

// Adaptive Recommendation System
export interface AdaptiveRecommendation {
  id: string;
  type: RecommendationType;
  indicator?: EnhancedIrisIndicator;
  confidenceScore: number;
  reasoning: string;
  aiPersonality: AIPersonality;
  
  // Context awareness
  contextFactors: ContextFactor[];
  organizationalLearning: OrganizationalLearning[];
  peerInsights: PeerInsight[];
  
  // Decision support
  decisionMapping: DecisionMapping[];
  riskAssessment: RiskAssessment;
  implementationComplexity: ImplementationComplexity;
  
  // Progressive enhancement
  adaptationSuggestions: AdaptationSuggestion[];
  learningOpportunities: LearningOpportunity[];
  
  // User interaction
  userFeedback?: RecommendationFeedback;
  effectivenessTracking: EffectivenessTracking;
}

export type RecommendationType = 
  | 'primary_indicator'
  | 'complementary_indicator'
  | 'portfolio_balance'
  | 'decision_alignment'
  | 'peer_benchmark'
  | 'foundation_gap'
  | 'custom_creation'
  | 'measurement_optimization'
  | 'stakeholder_alignment';

export interface ContextFactor {
  factor: string;
  value: any;
  weight: number;
  influence: 'positive' | 'negative' | 'neutral';
  explanation: string;
}

export interface OrganizationalLearning {
  pattern: string;
  frequency: number;
  successRate: number;
  applicability: string;
  confidence: number;
}

export interface PeerInsight {
  peerType: string;
  insight: string;
  relevanceScore: number;
  sourceReliability: number;
  applicabilityContext: string;
}

export interface DecisionMapping {
  decisionType: string;
  informationNeed: string;
  indicatorContribution: number;
  stakeholderImportance: number;
  timeliness: string;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
  alternativeApproaches: string[];
}

export interface RiskFactor {
  factor: string;
  probability: number;
  impact: number;
  description: string;
}

export interface ImplementationComplexity {
  overall: 'low' | 'medium' | 'high';
  dimensions: ComplexityDimension[];
  prerequisites: string[];
  resourceRequirements: ResourceRequirement[];
}

export interface ComplexityDimension {
  dimension: string;
  level: 'low' | 'medium' | 'high';
  explanation: string;
  supportNeeded: string[];
}

export interface ResourceRequirement {
  resourceType: string;
  amount: string;
  timing: string;
  criticality: 'low' | 'medium' | 'high';
}

export interface AdaptationSuggestion {
  adaptation: string;
  trigger: string;
  benefit: string;
  implementationGuidance: string;
}

export interface LearningOpportunity {
  opportunity: string;
  skillsNeeded: string[];
  resources: string[];
  timeInvestment: string;
  expectedBenefit: string;
}

export interface RecommendationFeedback {
  rating: number;
  usefulness: 'very_useful' | 'useful' | 'somewhat_useful' | 'not_useful';
  followedRecommendation: boolean;
  comments: string;
  improvementSuggestions: string[];
}

export interface EffectivenessTracking {
  adoptionRate: number;
  successRate: number;
  userSatisfaction: number;
  outcomeImprovement: number;
  learningContribution: number;
}

// Portfolio Analysis and Balance
export interface IndicatorPortfolio {
  indicators: EnhancedIrisIndicator[];
  analysis: PortfolioAnalysis;
  balanceAssessment: BalanceAssessment;
  optimization: PortfolioOptimization;
  benchmarking: PortfolioBenchmarking;
}

export interface PortfolioAnalysis {
  totalIndicators: number;
  typeDistribution: TypeDistribution;
  complexityDistribution: ComplexityDistribution;
  stakeholderCoverage: StakeholderCoverage[];
  decisionCoverage: DecisionCoverage[];
  gapAnalysis: GapAnalysis[];
}

export interface TypeDistribution {
  output: number;
  outcome: number;
  impact: number;
  balance: 'poor' | 'fair' | 'good' | 'excellent';
  recommendations: string[];
}

export interface ComplexityDistribution {
  low: number;
  medium: number;
  high: number;
  overallComplexity: 'manageable' | 'challenging' | 'overwhelming';
  recommendations: string[];
}

export interface StakeholderCoverage {
  stakeholder: string;
  coverage: number;
  gaps: string[];
  priorities: string[];
}

export interface DecisionCoverage {
  decisionType: string;
  coverage: number;
  informationGaps: string[];
  criticalityLevel: 'low' | 'medium' | 'high';
}

export interface GapAnalysis {
  gapType: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  recommendations: string[];
  priority: number;
}

export interface BalanceAssessment {
  overallBalance: number;
  balanceDimensions: BalanceDimension[];
  imbalanceWarnings: ImbalanceWarning[];
  improvementSuggestions: ImprovementSuggestion[];
}

export interface BalanceDimension {
  dimension: string;
  score: number;
  target: number;
  status: 'under' | 'optimal' | 'over';
  impact: string;
}

export interface ImbalanceWarning {
  warning: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  consequences: string[];
  correctiveActions: string[];
}

export interface ImprovementSuggestion {
  suggestion: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
  priority: number;
  implementationSteps: string[];
}

export interface PortfolioOptimization {
  currentScore: number;
  potentialScore: number;
  optimizationSuggestions: OptimizationSuggestion[];
  tradeoffAnalysis: TradeoffAnalysis[];
}

export interface OptimizationSuggestion {
  action: 'add' | 'remove' | 'modify' | 'replace';
  target: string;
  reasoning: string;
  expectedImpact: number;
  implementationEffort: 'low' | 'medium' | 'high';
}

export interface TradeoffAnalysis {
  decision: string;
  options: TradeoffOption[];
  recommendation: string;
  reasoning: string;
}

export interface TradeoffOption {
  option: string;
  pros: string[];
  cons: string[];
  score: number;
}

export interface PortfolioBenchmarking {
  peerComparison: PeerComparison[];
  industryBenchmarks: IndustryBenchmark[];
  bestPracticeAlignment: BestPracticeAlignment[];
}

export interface PeerComparison {
  peerType: string;
  comparisonMetric: string;
  ourScore: number;
  peerAverage: number;
  percentile: number;
  insights: string[];
}

export interface IndustryBenchmark {
  metric: string;
  ourValue: number;
  industryAverage: number;
  topQuartile: number;
  positioning: string;
  improvementOpportunities: string[];
}

export interface BestPracticeAlignment {
  practice: string;
  alignmentScore: number;
  gaps: string[];
  implementationGuidance: string[];
}

// AI-Powered Search and Discovery
export interface AISearchContext {
  organizationType: string;
  sector: string;
  foundationLevel: string;
  currentGoals: string[];
  stakeholderPriorities: string[];
  resourceConstraints: string[];
  previousIndicators: string[];
  
  // Learning context  
  userBehaviorPatterns: UserBehaviorPattern[];
  organizationalPreferences: OrganizationalPreference[];
  successPatterns: SuccessPattern[];
}

export interface UserBehaviorPattern {
  pattern: string;
  frequency: number;
  context: string;
  outcome: string;
}

export interface OrganizationalPreference {
  preference: string;
  strength: number;
  context: string;
  reasoning: string;
}

export interface SuccessPattern {
  pattern: string;
  successRate: number;
  context: string;
  keyFactors: string[];
}

export interface AISearchResult {
  indicator: EnhancedIrisIndicator;
  relevanceScore: number;
  matchReasons: MatchReason[];
  contextualFit: ContextualFit;
  implementationInsights: ImplementationInsight[];
  aiPersonalityGuidance: AIPersonalityGuidance;
}

export interface MatchReason {
  reason: string;
  confidence: number;
  evidence: string[];
  weight: number;
}

export interface ContextualFit {
  overallFit: number;
  fitDimensions: FitDimension[];
  adaptationNeeded: boolean;
  adaptationSuggestions: string[];
}

export interface FitDimension {
  dimension: string;
  score: number;
  explanation: string;
  improvementPotential: string;
}

export interface ImplementationInsight {
  insight: string;
  source: 'peer' | 'ai' | 'historical' | 'expert';
  confidence: number;
  applicability: string;
}

export interface AIPersonalityGuidance {
  personalityId: string;
  guidance: string;
  tone: string;
  nextSteps: string[];
  warnings: string[];
  encouragement: string[];
}

// Custom Indicator Creation
export interface CustomIndicatorBuilder {
  template: CustomIndicatorTemplate;
  wizardState: WizardState;
  irisGapAnalysis: IrisGapAnalysis;
  validationResults: ValidationResults;
  aiSuggestions: AISuggestion[];
}

export interface CustomIndicatorTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'output' | 'outcome' | 'impact';
  unit: string;
  
  // Custom fields
  purpose: string;
  audience: string[];
  dataSource: string;
  collectionMethod: string;
  frequency: string;
  
  // IRIS+ alignment
  potentialIrisAlignment: PotentialIrisAlignment[];
  gapIdentification: string[];
  
  // Quality assessment
  qualityScore: number;
  validationChecks: ValidationCheck[];
  improvementAreas: string[];
}

export interface WizardState {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  stepValidation: StepValidation[];
  canProceed: boolean;
}

export interface StepValidation {
  step: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface IrisGapAnalysis {
  existingCoverage: ExistingCoverage[];
  identifiedGaps: IdentifiedGap[];
  customizationOpportunities: CustomizationOpportunity[];
  alignmentPotential: AlignmentPotential[];
}

export interface ExistingCoverage {
  area: string;
  coverage: number;
  existingIndicators: string[];
  strengths: string[];
  limitations: string[];
}

export interface IdentifiedGap {
  gap: string;
  impact: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
  fillingStrategy: string[];
  customIndicatorPotential: number;
}

export interface CustomizationOpportunity {
  opportunity: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  implementation: string[];
}

export interface AlignmentPotential {
  irisIndicator: string;
  alignmentScore: number;
  modificationNeeded: string[];
  benefits: string[];
  challenges: string[];
}

export interface ValidationResults {
  overallScore: number;
  validationDimensions: ValidationDimension[];
  criticalIssues: CriticalIssue[];
  recommendations: ValidationRecommendation[];
}

export interface ValidationDimension {
  dimension: string;
  score: number;
  status: 'pass' | 'warning' | 'fail';
  details: string;
  improvements: string[];
}

export interface CriticalIssue {
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  resolution: string[];
  blocksProceed: boolean;
}

export interface ValidationRecommendation {
  recommendation: string;
  rationale: string;
  priority: number;
  implementationSteps: string[];
}

export interface AISuggestion {
  type: 'improvement' | 'alternative' | 'enhancement' | 'warning';
  suggestion: string;
  reasoning: string;
  confidence: number;
  implementation: string;
}

export interface PotentialIrisAlignment {
  irisIndicatorId: string;
  irisIndicatorName: string;
  alignmentScore: number;
  alignmentAspects: string[];
  differences: string[];
  harmonizationSteps: string[];
}

export interface ValidationCheck {
  check: string;
  passed: boolean;
  details: string;
  recommendation?: string;
}

// State Management Interfaces
export interface EnhancedIndicatorState {
  // Current selection
  selectedIndicators: EnhancedIrisIndicator[];
  portfolio: IndicatorPortfolio | null;
  
  // Search and discovery
  searchResults: AISearchResult[];
  searchContext: AISearchContext | null;
  activeRecommendations: AdaptiveRecommendation[];
  
  // UI state
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  
  // AI interactions
  activePersonality: AIPersonality | null;
  conversationContext: any;
  guidanceHistory: string[];
  
  // Learning and adaptation
  userPreferences: UserPreference[];
  organizationalLearning: OrganizationalLearning[];
  adaptationInsights: AdaptationInsight[];
  
  // Visual state
  viewMode: 'search' | 'portfolio' | 'builder' | 'analysis';
  filtersActive: FilterState;
  sortingPreferences: SortingPreference;
}

export interface UserPreference {
  preferenceType: string;
  value: any;
  confidence: number;
  lastUpdated: Date;
  context: string;
}

export interface AdaptationInsight {
  insight: string;
  evidenceStrength: number;
  applicabilityScore: number;
  implementationGuidance: string;
  lastValidated: Date;
}

export interface FilterState {
  types: string[];
  complexityLevels: string[];
  sectors: string[];
  stakeholders: string[];
  implementationDifficulty: string[];
  aiRecommendationThreshold: number;
}

export interface SortingPreference {
  primarySort: string;
  secondarySort: string;
  direction: 'asc' | 'desc';
  grouping: string | null;
}