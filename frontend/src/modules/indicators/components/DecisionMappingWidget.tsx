/**
 * Decision Mapping Widget
 * Visualizes how indicators inform key organizational decisions
 */

import React, { useState, useMemo } from 'react';
import {
  Map,
  Target,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Eye,
  Brain,
  Lightbulb,
  Settings
} from 'lucide-react';

import {
  EnhancedIrisIndicator,
  DecisionMapping,
  DecisionCoverage
} from '../types/enhancedTypes';

interface DecisionMappingWidgetProps {
  indicators: EnhancedIrisIndicator[];
  onDecisionSelect?: (decisionType: string) => void;
  showDetailedMapping?: boolean;
  className?: string;
}

interface DecisionType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  importance: 'critical' | 'high' | 'medium' | 'low';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  stakeholders: string[];
  typicalQuestions: string[];
}

interface MappingAnalysis {
  decisionType: DecisionType;
  coverage: number;
  mappedIndicators: EnhancedIrisIndicator[];
  informationGaps: string[];
  strengthAreas: string[];
  recommendations: string[];
}

const decisionTypes: DecisionType[] = [
  {
    id: 'program_optimization',
    name: 'Program Optimization',
    description: 'Decisions about improving program effectiveness and efficiency',
    icon: <Settings className="w-5 h-5" />,
    importance: 'critical',
    frequency: 'monthly',
    stakeholders: ['program_managers', 'beneficiaries'],
    typicalQuestions: [
      'Which program components are most effective?',
      'Where should we focus our improvement efforts?',
      'What changes would increase participant outcomes?'
    ]
  },
  {
    id: 'resource_allocation',
    name: 'Resource Allocation',
    description: 'Decisions about budget, staff, and resource distribution',
    icon: <DollarSign className="w-5 h-5" />,
    importance: 'critical',
    frequency: 'quarterly',
    stakeholders: ['leadership', 'funders', 'board'],
    typicalQuestions: [
      'Where should we invest additional resources?',
      'Which programs provide the best return on investment?',
      'How should we prioritize funding requests?'
    ]
  },
  {
    id: 'stakeholder_communication',
    name: 'Stakeholder Communication',
    description: 'Decisions about what and how to communicate impact',
    icon: <Users className="w-5 h-5" />,
    importance: 'high',
    frequency: 'monthly',
    stakeholders: ['funders', 'board', 'community', 'media'],
    typicalQuestions: [
      'What impact stories should we highlight?',
      'How do we demonstrate value to funders?',
      'What evidence do we need for reporting?'
    ]
  },
  {
    id: 'strategic_planning',
    name: 'Strategic Planning',
    description: 'Long-term organizational direction and goal setting',
    icon: <Map className="w-5 h-5" />,
    importance: 'critical',
    frequency: 'annually',
    stakeholders: ['leadership', 'board', 'staff'],
    typicalQuestions: [
      'Are we achieving our long-term goals?',
      'Where should we expand our work?',
      'What should our priorities be for next year?'
    ]
  },
  {
    id: 'continuous_improvement',
    name: 'Continuous Improvement',
    description: 'Day-to-day operational improvements and adjustments',
    icon: <TrendingUp className="w-5 h-5" />,
    importance: 'medium',
    frequency: 'weekly',
    stakeholders: ['staff', 'program_managers'],
    typicalQuestions: [
      'What operational adjustments should we make?',
      'How can we improve service delivery?',
      'What processes need refinement?'
    ]
  },
  {
    id: 'risk_management',
    name: 'Risk Management',
    description: 'Identifying and responding to program and organizational risks',
    icon: <AlertCircle className="w-5 h-5" />,
    importance: 'high',
    frequency: 'monthly',
    stakeholders: ['leadership', 'board', 'funders'],
    typicalQuestions: [
      'What risks are emerging in our programs?',
      'Are we maintaining quality standards?',
      'How should we respond to concerning trends?'
    ]
  }
];

export const DecisionMappingWidget: React.FC<DecisionMappingWidgetProps> = ({
  indicators,
  onDecisionSelect,
  showDetailedMapping = false,
  className = ""
}) => {
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  // Analyze decision coverage for each indicator
  const mappingAnalysis = useMemo((): MappingAnalysis[] => {
    return decisionTypes.map(decisionType => {
      const relevantIndicators = indicators.filter(indicator => {
        // Simple heuristic to determine if indicator informs this decision type
        const relevanceScore = calculateDecisionRelevance(indicator, decisionType);
        return relevanceScore > 0.6;
      });

      const coverage = relevantIndicators.length > 0 ? 
        Math.min(relevantIndicators.length / getIdealIndicatorCount(decisionType), 1) : 0;

      const informationGaps = identifyInformationGaps(decisionType, relevantIndicators);
      const strengthAreas = identifyStrengthAreas(decisionType, relevantIndicators);
      const recommendations = generateRecommendations(decisionType, relevantIndicators, informationGaps);

      return {
        decisionType,
        coverage,
        mappedIndicators: relevantIndicators,
        informationGaps,
        strengthAreas,
        recommendations
      };
    });
  }, [indicators]);

  // Calculate how well an indicator informs a decision type
  const calculateDecisionRelevance = (indicator: EnhancedIrisIndicator, decisionType: DecisionType): number => {
    let relevance = 0;

    // Base relevance by indicator type
    if (decisionType.id === 'strategic_planning' && indicator.type === 'impact') relevance += 0.4;
    if (decisionType.id === 'program_optimization' && indicator.type === 'outcome') relevance += 0.4;
    if (decisionType.id === 'continuous_improvement' && indicator.type === 'output') relevance += 0.3;
    if (decisionType.id === 'stakeholder_communication' && indicator.type !== 'output') relevance += 0.3;

    // Relevance by contextual fit
    relevance += indicator.contextualRelevance * 0.3;

    // Relevance by stakeholder alignment
    const stakeholderAlignment = indicator.stakeholderRelevance.some(sr => 
      decisionType.stakeholders.some(ds => ds.includes(sr.stakeholderType))
    );
    if (stakeholderAlignment) relevance += 0.2;

    // Relevance by complexity vs decision frequency
    if (decisionType.frequency === 'daily' && indicator.implementationComplexity === 'low') relevance += 0.1;
    if (decisionType.frequency === 'annually' && indicator.implementationComplexity === 'high') relevance += 0.1;

    return Math.min(relevance, 1);
  };

  // Get ideal number of indicators for a decision type
  const getIdealIndicatorCount = (decisionType: DecisionType): number => {
    const counts: Record<string, number> = {
      'strategic_planning': 5,
      'program_optimization': 4,
      'resource_allocation': 4,
      'stakeholder_communication': 3,
      'continuous_improvement': 3,
      'risk_management': 3
    };
    return counts[decisionType.id] || 3;
  };

  // Identify information gaps for a decision type
  const identifyInformationGaps = (decisionType: DecisionType, mappedIndicators: EnhancedIrisIndicator[]): string[] => {
    const gaps: string[] = [];

    // Check for type coverage
    const hasOutput = mappedIndicators.some(i => i.type === 'output');
    const hasOutcome = mappedIndicators.some(i => i.type === 'outcome');
    const hasImpact = mappedIndicators.some(i => i.type === 'impact');

    if (decisionType.importance === 'critical') {
      if (!hasOutcome) gaps.push('Missing outcome indicators for impact assessment');
      if (!hasImpact && decisionType.id === 'strategic_planning') gaps.push('Missing long-term impact indicators');
    }

    if (decisionType.id === 'continuous_improvement' && !hasOutput) {
      gaps.push('Missing operational indicators for day-to-day decisions');
    }

    // Check for stakeholder coverage
    const stakeholderCoverage = decisionType.stakeholders.filter(stakeholder =>
      mappedIndicators.some(i => 
        i.stakeholderRelevance.some(sr => sr.stakeholderType.includes(stakeholder))
      )
    );

    if (stakeholderCoverage.length < decisionType.stakeholders.length) {
      gaps.push(`Limited coverage for key stakeholders: ${decisionType.stakeholders.filter(s => !stakeholderCoverage.includes(s)).join(', ')}`);
    }

    return gaps;
  };

  // Identify strength areas
  const identifyStrengthAreas = (decisionType: DecisionType, mappedIndicators: EnhancedIrisIndicator[]): string[] => {
    const strengths: string[] = [];

    if (mappedIndicators.length > getIdealIndicatorCount(decisionType)) {
      strengths.push('Comprehensive indicator coverage');
    }

    const highQualityCount = mappedIndicators.filter(i => i.aiRecommendationScore > 0.8).length;
    if (highQualityCount > 0) {
      strengths.push(`${highQualityCount} high-quality indicators available`);
    }

    const realTimeCapable = mappedIndicators.filter(i => 
      i.dataCollectionDifficulty === 'easy' && i.implementationComplexity === 'low'
    ).length;
    if (realTimeCapable > 0) {
      strengths.push('Real-time decision support possible');
    }

    return strengths;
  };

  // Generate recommendations
  const generateRecommendations = (
    decisionType: DecisionType, 
    mappedIndicators: EnhancedIrisIndicator[], 
    gaps: string[]
  ): string[] => {
    const recommendations: string[] = [];

    if (mappedIndicators.length === 0) {
      recommendations.push(`Add indicators specifically designed to inform ${decisionType.name.toLowerCase()}`);
    } else if (mappedIndicators.length < getIdealIndicatorCount(decisionType)) {
      recommendations.push('Consider adding complementary indicators for comprehensive coverage');
    }

    if (gaps.some(gap => gap.includes('outcome'))) {
      recommendations.push('Add outcome indicators to measure actual changes and improvements');
    }

    if (gaps.some(gap => gap.includes('stakeholder'))) {
      recommendations.push('Include indicators that address all key stakeholder information needs');
    }

    if (decisionType.frequency === 'daily' || decisionType.frequency === 'weekly') {
      const complexCount = mappedIndicators.filter(i => i.implementationComplexity === 'high').length;
      if (complexCount > mappedIndicators.length / 2) {
        recommendations.push('Consider simpler indicators for more frequent decision-making');
      }
    }

    return recommendations;
  };

  // Get coverage color
  const getCoverageColor = (coverage: number): string => {
    if (coverage >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (coverage >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Get importance color
  const getImportanceColor = (importance: string): string => {
    const colors: Record<string, string> = {
      critical: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-yellow-600',
      low: 'text-gray-600'
    };
    return colors[importance] || 'text-gray-600';
  };

  const handleDecisionClick = (decisionId: string) => {
    setSelectedDecision(selectedDecision === decisionId ? null : decisionId);
    onDecisionSelect?.(decisionId);
  };

  const selectedAnalysis = selectedDecision ? 
    mappingAnalysis.find(a => a.decisionType.id === selectedDecision) : null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Map className="w-5 h-5 mr-2" />
            Decision Mapping
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            How your indicators inform key organizational decisions
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'overview' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'detailed' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Detailed
          </button>
        </div>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mappingAnalysis.map((analysis) => {
            const { decisionType, coverage, mappedIndicators, informationGaps } = analysis;
            
            return (
              <div
                key={decisionType.id}
                onClick={() => handleDecisionClick(decisionType.id)}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedDecision === decisionType.id 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="text-gray-600 mr-3">
                      {decisionType.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{decisionType.name}</h4>
                      <div className={`text-xs font-medium ${getImportanceColor(decisionType.importance)}`}>
                        {decisionType.importance.toUpperCase()} • {decisionType.frequency}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`px-2 py-1 rounded text-xs font-medium border ${getCoverageColor(coverage)}`}>
                    {Math.round(coverage * 100)}%
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{decisionType.description}</p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-blue-600">
                    <Target className="w-4 h-4 mr-1" />
                    {mappedIndicators.length} indicators
                  </div>
                  
                  {informationGaps.length > 0 && (
                    <div className="flex items-center text-orange-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {informationGaps.length} gaps
                    </div>
                  )}
                </div>

                {/* Coverage bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        coverage >= 0.8 ? 'bg-green-500' :
                        coverage >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${coverage * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Analysis for Selected Decision */}
      {selectedAnalysis && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              {selectedAnalysis.decisionType.icon}
              <span className="ml-2">{selectedAnalysis.decisionType.name}</span>
            </h4>
            <div className={`px-3 py-1 rounded text-sm font-medium border ${getCoverageColor(selectedAnalysis.coverage)}`}>
              {Math.round(selectedAnalysis.coverage * 100)}% Coverage
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Mapped Indicators */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                Mapped Indicators ({selectedAnalysis.mappedIndicators.length})
              </h5>
              <div className="space-y-2">
                {selectedAnalysis.mappedIndicators.map((indicator, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium text-sm text-gray-900">{indicator.name}</div>
                    <div className="text-xs text-gray-600 flex items-center mt-1">
                      <span className={`px-1 py-0.5 rounded text-xs mr-2 ${
                        indicator.type === 'output' ? 'bg-purple-100 text-purple-800' :
                        indicator.type === 'outcome' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {indicator.type}
                      </span>
                      AI Match: {Math.round(indicator.aiRecommendationScore * 100)}%
                    </div>
                  </div>
                ))}
                {selectedAnalysis.mappedIndicators.length === 0 && (
                  <div className="text-sm text-gray-500 italic">
                    No indicators currently mapped to this decision type
                  </div>
                )}
              </div>
            </div>

            {/* Information Gaps & Recommendations */}
            <div className="space-y-4">
              {/* Information Gaps */}
              {selectedAnalysis.informationGaps.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-orange-600" />
                    Information Gaps
                  </h5>
                  <div className="space-y-2">
                    {selectedAnalysis.informationGaps.map((gap, index) => (
                      <div key={index} className="p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                        {gap}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedAnalysis.recommendations.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Lightbulb className="w-4 h-4 mr-2 text-blue-600" />
                    Recommendations
                  </h5>
                  <div className="space-y-2">
                    {selectedAnalysis.recommendations.map((rec, index) => (
                      <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Typical Questions */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Brain className="w-4 h-4 mr-2 text-purple-600" />
                  Typical Questions
                </h5>
                <div className="space-y-2">
                  {selectedAnalysis.decisionType.typicalQuestions.map((question, index) => (
                    <div key={index} className="p-2 bg-purple-50 border border-purple-200 rounded text-sm text-purple-800">
                      {question}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <Eye className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-medium text-blue-900">Decision Support Insights</span>
        </div>
        <div className="grid gap-2 md:grid-cols-3 text-sm">
          <div className="text-blue-800">
            <span className="font-medium">
              {Math.round(mappingAnalysis.reduce((sum, a) => sum + a.coverage, 0) / mappingAnalysis.length * 100)}%
            </span> average decision coverage
          </div>
          <div className="text-blue-800">
            <span className="font-medium">
              {mappingAnalysis.filter(a => a.coverage >= 0.8).length}
            </span> well-covered decisions
          </div>
          <div className="text-blue-800">
            <span className="font-medium">
              {mappingAnalysis.reduce((sum, a) => sum + a.informationGaps.length, 0)}
            </span> total information gaps identified
          </div>
        </div>
      </div>
    </div>
  );
};

export default DecisionMappingWidget;