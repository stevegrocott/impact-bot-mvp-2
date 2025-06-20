/**
 * Enhanced Indicator Selection Component
 * Sophisticated ML-powered indicator selection with adaptive recommendations and IRIS+ integration
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  Check,
  AlertTriangle,
  Info,
  BarChart3,
  Target,
  TrendingUp,
  Activity,
  Brain,
  Users,
  Lightbulb,
  Zap,
  Shield,
  BookOpen,
  Settings,
  ChevronDown,
  ChevronUp,
  Star,
  Sparkles,
  Eye,
  Map,
  Layers,
  RefreshCw,
  Wand2
} from 'lucide-react';

import { useHybridSearch } from '../shared/hooks/useHybridSearch';
import { useAdaptiveRecommendations } from '../modules/indicators/hooks/useAdaptiveRecommendations';
import { usePortfolioAnalysis } from '../modules/indicators/hooks/usePortfolioAnalysis';
import PitfallWarningSystem from '../modules/indicators/components/PitfallWarningSystem';
import RecommendationCard from '../modules/conversational-ai/components/RecommendationCard';
import PortfolioVisualization from '../modules/indicators/components/PortfolioVisualization';
import DecisionMappingWidget from '../modules/indicators/components/DecisionMappingWidget';
import CustomIndicatorBuilder from '../modules/indicators/components/CustomIndicatorBuilder';

import {
  EnhancedIrisIndicator,
  AdaptiveRecommendation,
  AISearchContext,
  FilterState,
  RecommendationType
} from '../modules/indicators/types/enhancedTypes';

// Enhanced Component Props
interface EnhancedIndicatorSelectionProps {
  initialIndicators?: EnhancedIrisIndicator[];
  onSelectionChange?: (indicators: EnhancedIrisIndicator[]) => void;
  onRecommendationAction?: (recommendation: AdaptiveRecommendation) => void;
  contextOverride?: Partial<AISearchContext>;
  enableAIPersonality?: boolean;
  showPortfolioAnalysis?: boolean;
  showDecisionMapping?: boolean;
  allowCustomIndicators?: boolean;
  className?: string;
}

// Mock enhanced indicators for demonstration
const mockEnhancedIndicators: EnhancedIrisIndicator[] = [
  {
    id: 'iris_1',
    name: 'Number of individuals trained',
    description: 'Total count of unique individuals who completed training programs',
    category: 'Employment',
    theme: 'Workforce Development',
    type: 'output',
    unit: 'Count',
    tags: ['participants', 'training', 'completion'],
    irisCode: 'OI7297',
    irisVersion: '5.1',
    sdgAlignment: ['SDG 4', 'SDG 8'],
    goalAlignment: [
      {
        goalId: 'employment_1',
        goalName: 'Improve workforce readiness',
        alignmentStrength: 0.85,
        outcomeContribution: 'Direct contribution to skill development'
      }
    ],
    aiRecommendationScore: 0.78,
    contextualRelevance: 0.82,
    implementationComplexity: 'low',
    dataCollectionDifficulty: 'easy',
    stakeholderRelevance: [
      {
        stakeholderType: 'beneficiaries',
        relevanceScore: 0.9,
        specificInterests: ['skill development', 'capacity building']
      },
      {
        stakeholderType: 'funders',
        relevanceScore: 0.7,
        specificInterests: ['reach', 'participation rates']
      }
    ],
    peerUsageFrequency: 0.85,
    sectorPopularity: [
      {
        sector: 'workforce_development',
        usagePercentage: 0.92,
        averageSuccessRate: 0.78
      }
    ],
    bestPracticeExamples: [
      {
        organizationType: 'Training NGO',
        contextDescription: 'Vocational skills program in urban setting',
        implementationApproach: 'Digital tracking with completion certificates',
        keySuccessFactors: ['Clear completion criteria', 'Regular progress tracking'],
        measuredOutcomes: ['High completion rates', 'Improved employment outcomes']
      }
    ],
    measurementGuidance: {
      dataSourceSuggestions: ['Training attendance records', 'Certificate databases'],
      collectionMethodology: ['Automated tracking', 'Manual verification'],
      frequencyRecommendations: 'Monthly aggregation with real-time tracking',
      qualityCheckpoints: ['Completion verification', 'Duplicate detection'],
      commonPitfalls: ['Double counting', 'Incomplete records'],
      mitigationStrategies: ['Unique participant IDs', 'Regular data audits']
    },
    pitfallWarnings: ['Risk of measuring participation without learning'],
    qualityIndicators: [
      {
        dimension: 'relevance',
        score: 0.85,
        explanation: 'Highly relevant for workforce development programs',
        improvementSuggestions: ['Add skill assessment component']
      }
    ],
    alternativeFormulations: [
      {
        variant: 'Number of training completions (including repeat participants)',
        useCase: 'When individuals can take multiple courses',
        advantages: ['Captures full program engagement'],
        tradeoffs: ['May inflate numbers, harder to track unique impact']
      }
    ],
    organizationalFit: 0.88,
    customizationSuggestions: [
      {
        context: 'Skills-focused programs',
        modification: 'Add skill category breakdown',
        reasoning: 'Better alignment with program objectives',
        implementationGuidance: 'Create subcategories for technical, soft, and sector-specific skills'
      }
    ]
  },
  {
    id: 'iris_2',
    name: 'Percentage of trainees demonstrating improved skills',
    description: 'Proportion of participants showing measurable skill improvement after training',
    category: 'Employment',
    theme: 'Workforce Development',
    type: 'outcome',
    unit: 'Percentage',
    tags: ['skills', 'improvement', 'assessment'],
    irisCode: 'OI1234',
    irisVersion: '5.1',
    sdgAlignment: ['SDG 4', 'SDG 8'],
    goalAlignment: [
      {
        goalId: 'employment_1',
        goalName: 'Improve workforce readiness',
        alignmentStrength: 0.95,
        outcomeContribution: 'Measures actual skill development outcomes'
      }
    ],
    aiRecommendationScore: 0.92,
    contextualRelevance: 0.88,
    implementationComplexity: 'medium',
    dataCollectionDifficulty: 'moderate',
    stakeholderRelevance: [
      {
        stakeholderType: 'beneficiaries',
        relevanceScore: 0.95,
        specificInterests: ['actual learning', 'skill validation']
      },
      {
        stakeholderType: 'funders',
        relevanceScore: 0.85,
        specificInterests: ['program effectiveness', 'impact measurement']
      }
    ],
    peerUsageFrequency: 0.65,
    sectorPopularity: [
      {
        sector: 'workforce_development',
        usagePercentage: 0.68,
        averageSuccessRate: 0.82
      }
    ],
    bestPracticeExamples: [
      {
        organizationType: 'Skills Training Institute',
        contextDescription: 'Technical skills certification program',
        implementationApproach: 'Pre/post assessments with standardized tests',
        keySuccessFactors: ['Valid assessment tools', 'Skilled assessors'],
        measuredOutcomes: ['Documented skill improvements', 'Higher employment rates']
      }
    ],
    measurementGuidance: {
      dataSourceSuggestions: ['Skills assessments', 'Competency evaluations'],
      collectionMethodology: ['Pre/post testing', 'Portfolio assessment'],
      frequencyRecommendations: 'Before and after training, with 3-month follow-up',
      qualityCheckpoints: ['Assessment validity', 'Evaluator reliability'],
      commonPitfalls: ['Subjective assessment', 'Teaching to the test'],
      mitigationStrategies: ['Standardized assessments', 'Multiple evaluation methods']
    },
    pitfallWarnings: ['Ensure assessments measure real-world applicable skills'],
    qualityIndicators: [
      {
        dimension: 'validity',
        score: 0.78,
        explanation: 'Strong validity when properly implemented',
        improvementSuggestions: ['Use industry-recognized assessment standards']
      }
    ],
    alternativeFormulations: [
      {
        variant: 'Average skill improvement score',
        useCase: 'When using quantitative skill assessments',
        advantages: ['More granular measurement'],
        tradeoffs: ['More complex to communicate']
      }
    ],
    organizationalFit: 0.85,
    customizationSuggestions: [
      {
        context: 'Multi-skill programs',
        modification: 'Break down by skill category',
        reasoning: 'Better program optimization insights',
        implementationGuidance: 'Track improvement rates for technical vs soft skills separately'
      }
    ]
  }
];

// Main Component
export const EnhancedIndicatorSelection: React.FC<EnhancedIndicatorSelectionProps> = ({
  initialIndicators = [],
  onSelectionChange,
  onRecommendationAction,
  contextOverride,
  enableAIPersonality = true,
  showPortfolioAnalysis = true,
  showDecisionMapping = true,
  allowCustomIndicators = true,
  className = ""
}) => {
  const navigate = useNavigate();
  // State
  const [selectedIndicators, setSelectedIndicators] = useState<EnhancedIrisIndicator[]>(initialIndicators);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'search' | 'portfolio' | 'builder' | 'insights'>('search');
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    complexityLevels: [],
    sectors: [],
    stakeholders: [],
    implementationDifficulty: [],
    aiRecommendationThreshold: 0.5
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  // Custom hooks
  const { 
    search: hybridSearch, 
    results: searchResults, 
    isLoading: isSearching,
    error: searchError 
  } = useHybridSearch({
    enableCache: true,
    debounceMs: 300,
    minQueryLength: 2
  });

  const {
    recommendations,
    isLoading: isLoadingRecs,
    generateRecommendations,
    getContextualRecommendations,
    recordRecommendationFeedback,
    organizationalLearning,
    recommendationAccuracy
  } = useAdaptiveRecommendations({
    enableRealTimeUpdates: true,
    maxRecommendations: 8,
    confidenceThreshold: 0.6
  });

  const {
    portfolio,
    portfolioMetrics,
    isAnalyzing,
    analyzePortfolio,
    balanceScore,
    criticalImbalances,
    quickWins
  } = usePortfolioAnalysis({
    enableRealTimeAnalysis: true,
    enableBenchmarking: true,
    optimizationLevel: 'advanced'
  });

  // AI Search Context
  const searchContext: AISearchContext = useMemo(() => ({
    organizationType: 'nonprofit',
    sector: 'workforce_development',
    foundationLevel: 'intermediate',
    currentGoals: ['improve_employment_outcomes', 'skill_development'],
    stakeholderPriorities: ['funders', 'beneficiaries'],
    resourceConstraints: ['limited_staff', 'moderate_budget'],
    previousIndicators: selectedIndicators.map(i => i.id),
    userBehaviorPatterns: [],
    organizationalPreferences: [],
    successPatterns: [],
    ...contextOverride
  }), [selectedIndicators, contextOverride]);

  // Handle indicator selection
  const handleIndicatorToggle = useCallback((indicator: EnhancedIrisIndicator) => {
    const newSelection = selectedIndicators.find(i => i.id === indicator.id)
      ? selectedIndicators.filter(i => i.id !== indicator.id)
      : [...selectedIndicators, indicator];
    
    setSelectedIndicators(newSelection);
    onSelectionChange?.(newSelection);

    // Trigger custom event for real-time updates
    document.dispatchEvent(new CustomEvent('indicator_selection_changed', {
      detail: { selectedIndicators: newSelection }
    }));
  }, [selectedIndicators, onSelectionChange]);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    try {
      await hybridSearch(query, 'indicator_discovery', {
        ...searchContext,
        currentSelection: selectedIndicators.map(i => i.name)
      });
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [hybridSearch, searchContext, selectedIndicators]);

  // Handle recommendation feedback
  const handleRecommendationFeedback = useCallback(async (
    id: string,
    feedback: 'helpful' | 'not_helpful' | 'irrelevant',
    notes?: string
  ) => {
    await recordRecommendationFeedback(id, {
      rating: feedback === 'helpful' ? 5 : feedback === 'not_helpful' ? 2 : 1,
      usefulness: feedback === 'helpful' ? 'very_useful' : 'not_useful',
      followedRecommendation: feedback === 'helpful',
      comments: notes,
      improvementSuggestions: feedback !== 'helpful' ? [notes || 'Improve relevance'] : undefined
    });
  }, [recordRecommendationFeedback]);

  // Handle recommendation action
  const handleRecommendationAction = useCallback((type: string, itemId: string) => {
    const recommendation = recommendations.find(r => r.id === itemId);
    if (recommendation) {
      onRecommendationAction?.(recommendation);
      
      if (recommendation.indicator && type === 'indicator_suggestion') {
        handleIndicatorToggle(recommendation.indicator);
      }
    }
  }, [recommendations, onRecommendationAction, handleIndicatorToggle]);

  // Get filtered indicators
  const filteredIndicators = useMemo(() => {
    let results = mockEnhancedIndicators;

    // Apply search filter
    if (searchQuery) {
      results = results.filter(indicator =>
        indicator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        indicator.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        indicator.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply type filters
    if (filters.types.length > 0) {
      results = results.filter(indicator => filters.types.includes(indicator.type));
    }

    // Apply complexity filters
    if (filters.complexityLevels.length > 0) {
      results = results.filter(indicator => 
        filters.complexityLevels.includes(indicator.implementationComplexity)
      );
    }

    // Apply AI recommendation threshold
    results = results.filter(indicator => 
      indicator.aiRecommendationScore >= filters.aiRecommendationThreshold
    );

    // Sort by AI recommendation score
    return results.sort((a, b) => b.aiRecommendationScore - a.aiRecommendationScore);
  }, [searchQuery, filters]);

  // Generate contextual recommendations when selection changes
  useEffect(() => {
    if (selectedIndicators.length > 0) {
      getContextualRecommendations(selectedIndicators, searchContext);
    }
  }, [selectedIndicators, searchContext, getContextualRecommendations]);

  // Search effect
  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  }, [searchQuery, handleSearch]);

  // Get indicator type styling
  const getTypeStyle = useCallback((type: string) => {
    const styles = {
      output: {
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-800',
        borderColor: 'border-purple-200',
        icon: <Activity className="w-4 h-4" />
      },
      outcome: {
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        icon: <Target className="w-4 h-4" />
      },
      impact: {
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200',
        icon: <TrendingUp className="w-4 h-4" />
      }
    };
    return styles[type as keyof typeof styles] || styles.output;
  }, []);

  // Get AI confidence styling
  const getConfidenceStyle = useCallback((score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  }, []);

  return (
    <div className={`max-w-7xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header with AI Personality Indicator */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
            <Brain className="w-4 h-4 mr-2" />
            AI-Powered Selection
            <Sparkles className="w-4 h-4 ml-2" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Enhanced Indicator Selection
        </h1>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto">
          Discover IRIS+ indicators with ML-powered recommendations, contextual guidance, 
          and real-time portfolio optimization. Like having an expert impact measurement consultant 
          who knows your organization intimately.
        </p>
        
        {/* AI Learning Indicator */}
        {organizationalLearning.length > 0 && (
          <div className="mt-4 inline-flex items-center bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <Zap className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">
              AI has learned {organizationalLearning.length} patterns from your organization
            </span>
            <div className="ml-2 text-xs text-blue-600">
              Accuracy: {Math.round(recommendationAccuracy * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg p-2">
        <div className="flex space-x-1">
          {[
            { id: 'search', label: 'AI Search', icon: <Search className="w-4 h-4" /> },
            { id: 'portfolio', label: 'Portfolio Analysis', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'insights', label: 'AI Insights', icon: <Eye className="w-4 h-4" /> },
            { id: 'builder', label: 'Custom Builder', icon: <Plus className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search View */}
      {activeView === 'search' && (
        <div className="space-y-6">
          {/* Enhanced Search Interface */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search indicators with AI-powered understanding..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {showAdvancedFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Indicator Types
                    </label>
                    <div className="space-y-2">
                      {['output', 'outcome', 'impact'].map(type => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.types.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters(prev => ({ ...prev, types: [...prev.types, type] }));
                              } else {
                                setFilters(prev => ({ ...prev, types: prev.types.filter(t => t !== type) }));
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Complexity Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Implementation Complexity
                    </label>
                    <div className="space-y-2">
                      {['low', 'medium', 'high'].map(level => (
                        <label key={level} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.complexityLevels.includes(level)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters(prev => ({ ...prev, complexityLevels: [...prev.complexityLevels, level] }));
                              } else {
                                setFilters(prev => ({ ...prev, complexityLevels: prev.complexityLevels.filter(l => l !== level) }));
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* AI Recommendation Threshold */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI Recommendation Threshold
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={filters.aiRecommendationThreshold}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        aiRecommendationThreshold: parseFloat(e.target.value) 
                      }))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round(filters.aiRecommendationThreshold * 100)}% minimum confidence
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Selected indicators summary */}
            {selectedIndicators.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900 flex items-center">
                      <Layers className="w-4 h-4 mr-2" />
                      {selectedIndicators.length} Indicators Selected
                    </h3>
                    <p className="text-sm text-blue-700">
                      {selectedIndicators.filter(i => i.type === 'output').length} outputs, {' '}
                      {selectedIndicators.filter(i => i.type === 'outcome').length} outcomes, {' '}
                      {selectedIndicators.filter(i => i.type === 'impact').length} impacts
                    </p>
                    {balanceScore > 0 && (
                      <div className="mt-2 flex items-center">
                        <Shield className="w-4 h-4 mr-1 text-green-600" />
                        <span className="text-sm text-green-700">
                          Portfolio Balance: {Math.round(balanceScore * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                  {isAnalyzing && (
                    <div className="flex items-center">
                      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin mr-2" />
                      <span className="text-sm text-blue-700">Analyzing portfolio...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI Recommendations Panel */}
          {recommendations.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-blue-600" />
                  AI Recommendations
                </h2>
                <div className="text-sm text-gray-500">
                  Based on organizational learning
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {recommendations.slice(0, 4).map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={{
                      id: recommendation.id,
                      type: recommendation.type,
                      itemId: recommendation.indicator?.id || '',
                      itemType: 'indicator',
                      confidenceScore: recommendation.confidenceScore,
                      reasoning: recommendation.reasoning,
                      metadata: {
                        indicator: recommendation.indicator,
                        contextFactors: recommendation.contextFactors,
                        implementationComplexity: recommendation.implementationComplexity
                      }
                    }}
                    onFeedback={handleRecommendationFeedback}
                    onAction={handleRecommendationAction}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pitfall Warning System */}
          {selectedIndicators.length > 0 && (
            <PitfallWarningSystem
              warnings={[]}
              shouldBlock={false}
              allowContinue={true}
              contextualGuidance="Your selection looks balanced. Consider the AI recommendations above for optimization."
              onWarningAction={(id, action) => console.log('Warning action:', id, action)}
              onContinue={() => navigate('/measurement-planning')}
            />
          )}

          {/* Indicator Grid */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              IRIS+ Indicators
              <div className="ml-auto text-sm text-gray-500">
                {filteredIndicators.length} indicators
              </div>
            </h2>
            
            <div className="grid gap-4">
              {filteredIndicators.map((indicator) => {
                const isSelected = selectedIndicators.find(i => i.id === indicator.id);
                const typeStyle = getTypeStyle(indicator.type);
                const confidenceStyle = getConfidenceStyle(indicator.aiRecommendationScore);
                
                return (
                  <div
                    key={indicator.id}
                    onClick={() => handleIndicatorToggle(indicator)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all relative ${
                      isSelected 
                        ? 'border-blue-300 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                    }`}
                  >
                    {/* AI Confidence Badge */}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium border ${confidenceStyle}`}>
                      <Star className="w-3 h-3 inline mr-1" />
                      {Math.round(indicator.aiRecommendationScore * 100)}% AI Match
                    </div>

                    <div className="flex items-start justify-between pr-16">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {indicator.name}
                          </h3>
                          
                          <div className={`ml-3 px-2 py-1 rounded-full border text-xs font-medium flex items-center ${typeStyle.bgColor} ${typeStyle.textColor} ${typeStyle.borderColor}`}>
                            {typeStyle.icon}
                            <span className="ml-1 capitalize">{indicator.type}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-3">
                          {indicator.description}
                        </p>
                        
                        {/* Enhanced metadata */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span>IRIS: {indicator.irisCode}</span>
                          <span>Category: {indicator.category}</span>
                          <span>Theme: {indicator.theme}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            indicator.implementationComplexity === 'low' ? 'bg-green-100 text-green-800' :
                            indicator.implementationComplexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {indicator.implementationComplexity} complexity
                          </span>
                        </div>

                        {/* AI Insights */}
                        <div className="flex items-center space-x-4 text-sm mb-3">
                          <div className="flex items-center text-blue-600">
                            <Users className="w-4 h-4 mr-1" />
                            {Math.round(indicator.peerUsageFrequency * 100)}% peer usage
                          </div>
                          <div className="flex items-center text-green-600">
                            <Target className="w-4 h-4 mr-1" />
                            {Math.round(indicator.contextualRelevance * 100)}% contextual fit
                          </div>
                          <div className="flex items-center text-purple-600">
                            <Settings className="w-4 h-4 mr-1" />
                            {Math.round(indicator.organizationalFit * 100)}% org fit
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          {indicator.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Expandable AI Insights */}
                        {indicator.customizationSuggestions.length > 0 || indicator.bestPracticeExamples.length > 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedInsights(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(indicator.id)) {
                                  newSet.delete(indicator.id);
                                } else {
                                  newSet.add(indicator.id);
                                }
                                return newSet;
                              });
                            }}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <Lightbulb className="w-4 h-4 mr-1" />
                            View AI insights
                            {expandedInsights.has(indicator.id) ? 
                              <ChevronUp className="w-4 h-4 ml-1" /> : 
                              <ChevronDown className="w-4 h-4 ml-1" />
                            }
                          </button>
                        ) : null}

                        {/* Expanded Insights */}
                        {expandedInsights.has(indicator.id) && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            {indicator.customizationSuggestions.length > 0 && (
                              <div className="mb-3">
                                <h4 className="text-sm font-medium text-blue-900 mb-2">Customization Suggestions:</h4>
                                {indicator.customizationSuggestions.map((suggestion, idx) => (
                                  <div key={idx} className="text-sm text-blue-800 mb-1">
                                    • {suggestion.modification} - {suggestion.reasoning}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {indicator.bestPracticeExamples.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-blue-900 mb-2">Best Practice Example:</h4>
                                <div className="text-sm text-blue-800">
                                  <div className="font-medium">{indicator.bestPracticeExamples[0].organizationType}</div>
                                  <div>{indicator.bestPracticeExamples[0].contextDescription}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        {isSelected ? (
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                            <Plus className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredIndicators.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No indicators found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or filters to find relevant indicators.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portfolio Analysis View */}
      {activeView === 'portfolio' && selectedIndicators.length > 0 && (
        <div className="space-y-6">
          <PortfolioVisualization
            indicators={selectedIndicators}
            portfolio={portfolio}
            balanceAssessment={portfolio?.balanceAssessment}
            showOptimizationSuggestions={true}
            showStakeholderAnalysis={true}
          />
          
          {showDecisionMapping && (
            <DecisionMappingWidget
              indicators={selectedIndicators}
              onDecisionSelect={(decisionType) => console.log('Decision selected:', decisionType)}
              showDetailedMapping={true}
            />
          )}
        </div>
      )}

      {/* Empty Portfolio State */}
      {activeView === 'portfolio' && selectedIndicators.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center py-8">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Indicators Selected
            </h3>
            <p className="text-gray-600 mb-4">
              Select some indicators to see portfolio analysis and optimization suggestions.
            </p>
            <button
              onClick={() => setActiveView('search')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Indicators
            </button>
          </div>
        </div>
      )}

      {/* AI Insights View */}
      {activeView === 'insights' && (
        <div className="space-y-6">
          {/* Organizational Learning Insights */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              Organizational Learning Insights
            </h2>
            
            {organizationalLearning.length > 0 ? (
              <div className="space-y-4">
                {organizationalLearning.slice(0, 3).map((learning, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-blue-900">{learning.pattern}</div>
                        <div className="text-sm text-blue-700 mt-1">
                          Success Rate: {Math.round(learning.successRate * 100)}% • 
                          Frequency: {learning.frequency} • 
                          Confidence: {Math.round(learning.confidence * 100)}%
                        </div>
                        <div className="text-sm text-blue-600 mt-2">{learning.applicability}</div>
                      </div>
                      <div className="flex items-center text-blue-600">
                        <Zap className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    AI Accuracy: {Math.round(recommendationAccuracy * 100)}% • 
                    Learning from {organizationalLearning.length} patterns
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>AI is learning from your organization's patterns...</p>
                <p className="text-sm mt-2">Insights will appear as you make more selections and provide feedback.</p>
              </div>
            )}
          </div>

          {/* Advanced Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Advanced AI Recommendations
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {recommendations.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={{
                      id: recommendation.id,
                      type: recommendation.type,
                      itemId: recommendation.indicator?.id || '',
                      itemType: 'indicator',
                      confidenceScore: recommendation.confidenceScore,
                      reasoning: recommendation.reasoning,
                      metadata: {
                        contextFactors: recommendation.contextFactors,
                        peerInsights: recommendation.peerInsights,
                        organizationalLearning: recommendation.organizationalLearning
                      }
                    }}
                    onFeedback={handleRecommendationFeedback}
                    onAction={handleRecommendationAction}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Decision Mapping for Insights */}
          {selectedIndicators.length > 0 && showDecisionMapping && (
            <DecisionMappingWidget
              indicators={selectedIndicators}
              onDecisionSelect={(decisionType) => console.log('Decision selected:', decisionType)}
              showDetailedMapping={false}
            />
          )}
        </div>
      )}

      {/* Custom Builder View */}
      {activeView === 'builder' && allowCustomIndicators && !showCustomBuilder && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Custom Indicator Builder
            </h2>
            <div className="text-center py-8">
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Wand2 className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Create Custom Indicators with AI
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Build tailored indicators that perfectly fit your organization's needs. 
                Our AI provides IRIS+ gap analysis, validation assistance, and optimization suggestions.
              </p>
              <div className="grid gap-4 md:grid-cols-3 max-w-3xl mx-auto mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Search className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-medium text-blue-900">IRIS+ Gap Analysis</div>
                  <div className="text-sm text-blue-700">Identify alignment opportunities</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="font-medium text-purple-900">AI Enhancement</div>
                  <div className="text-sm text-purple-700">Smart suggestions for improvement</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="font-medium text-green-900">Quality Validation</div>
                  <div className="text-sm text-green-700">Ensure measurement excellence</div>
                </div>
              </div>
              <button
                onClick={() => setShowCustomBuilder(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 flex items-center mx-auto"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start Building Custom Indicator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Builder Modal */}
      {showCustomBuilder && allowCustomIndicators && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-screen overflow-y-auto">
            <CustomIndicatorBuilder
              existingIndicators={selectedIndicators}
              onIndicatorCreated={(indicator) => {
                console.log('Created indicator:', indicator);
                setShowCustomBuilder(false);
                // Could add the created indicator to mock data
              }}
              onCancel={() => setShowCustomBuilder(false)}
            />
          </div>
        </div>
      )}

      {/* Action Footer */}
      {selectedIndicators.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Ready to Continue?
              </h3>
              <p className="text-gray-600">
                Your indicator selection has been optimized with AI recommendations.
              </p>
              {balanceScore > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  Portfolio balance score: {Math.round(balanceScore * 100)}%
                </p>
              )}
            </div>
            <div className="space-x-3">
              <button 
                onClick={() => setActiveView('portfolio')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Analyze Portfolio
              </button>
              <button 
                onClick={() => navigate('/measurement-planning')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 flex items-center"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Proceed to Planning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedIndicatorSelection;