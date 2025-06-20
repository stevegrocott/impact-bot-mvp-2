/**
 * Portfolio Analysis Hook
 * Advanced analysis of indicator portfolios with balance checking and optimization
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { apiClient } from '../../../shared/services/apiClient';
import { useAuth } from '../../../shared/hooks/useAuth';
import {
  EnhancedIrisIndicator,
  IndicatorPortfolio,
  PortfolioAnalysis,
  BalanceAssessment,
  PortfolioOptimization,
  PortfolioBenchmarking,
  OptimizationSuggestion,
  ImbalanceWarning
} from '../types/enhancedTypes';

interface UsePortfolioAnalysisOptions {
  enableRealTimeAnalysis?: boolean;
  enableBenchmarking?: boolean;
  optimizationLevel?: 'basic' | 'advanced' | 'expert';
  autoOptimization?: boolean;
}

interface PortfolioAnalysisState {
  portfolio: IndicatorPortfolio | null;
  isAnalyzing: boolean;
  isOptimizing: boolean;
  error: string | null;
  lastAnalysis: Date | null;
  
  // Analysis results
  balanceScore: number;
  complexityScore: number;
  stakeholderCoverage: number;
  decisionCoverage: number;
  
  // Optimization insights
  optimizationPotential: number;
  criticalImbalances: ImbalanceWarning[];
  quickWins: OptimizationSuggestion[];
}

export const usePortfolioAnalysis = (options: UsePortfolioAnalysisOptions = {}) => {
  const {
    enableRealTimeAnalysis = true,
    enableBenchmarking = true,
    optimizationLevel = 'advanced',
    autoOptimization = false
  } = options;

  const { getOrganizationContext, user } = useAuth();
  
  const [state, setState] = useState<PortfolioAnalysisState>({
    portfolio: null,
    isAnalyzing: false,
    isOptimizing: false,
    error: null,
    lastAnalysis: null,
    balanceScore: 0,
    complexityScore: 0,
    stakeholderCoverage: 0,
    decisionCoverage: 0,
    optimizationPotential: 0,
    criticalImbalances: [],
    quickWins: []
  });

  // Analyze indicator portfolio
  const analyzePortfolio = useCallback(async (
    indicators: EnhancedIrisIndicator[]
  ): Promise<IndicatorPortfolio | null> => {
    if (indicators.length === 0) {
      setState(prev => ({ 
        ...prev, 
        portfolio: null, 
        balanceScore: 0,
        complexityScore: 0,
        stakeholderCoverage: 0,
        decisionCoverage: 0
      }));
      return null;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const response = await apiClient.request({
        method: 'POST',
        url: '/indicators/portfolio-analysis',
        data: {
          indicators,
          organizationContext: getOrganizationContext(),
          analysisOptions: {
            enableBenchmarking,
            optimizationLevel,
            includeRecommendations: true
          }
        }
      });

      if (response.success) {
        const responseData = response.data as any;
        const portfolio = responseData?.portfolio;
        const metrics = responseData?.metrics || {};

        setState(prev => ({
          ...prev,
          portfolio,
          balanceScore: metrics.balanceScore || 0,
          complexityScore: metrics.complexityScore || 0,
          stakeholderCoverage: metrics.stakeholderCoverage || 0,
          decisionCoverage: metrics.decisionCoverage || 0,
          optimizationPotential: metrics.optimizationPotential || 0,
          criticalImbalances: portfolio.balanceAssessment?.imbalanceWarnings || [],
          quickWins: portfolio.optimization?.optimizationSuggestions?.filter(
            (s: OptimizationSuggestion) => s.implementationEffort === 'low'
          ) || [],
          lastAnalysis: new Date(),
          isAnalyzing: false
        }));

        return portfolio;
      } else {
        throw new Error(response.message || 'Portfolio analysis failed');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Portfolio analysis failed',
        isAnalyzing: false
      }));
      return null;
    }
  }, [getOrganizationContext, enableBenchmarking, optimizationLevel]);

  // Get balance assessment
  const getBalanceAssessment = useCallback((
    indicators: EnhancedIrisIndicator[]
  ): BalanceAssessment => {
    if (indicators.length === 0) {
      return {
        overallBalance: 0,
        balanceDimensions: [],
        imbalanceWarnings: [],
        improvementSuggestions: []
      };
    }

    // Calculate type distribution
    const typeDistribution = indicators.reduce((acc, indicator) => {
      acc[indicator.type] = (acc[indicator.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = indicators.length;
    const outputRatio = (typeDistribution.output || 0) / total;
    const outcomeRatio = (typeDistribution.outcome || 0) / total;
    const impactRatio = (typeDistribution.impact || 0) / total;

    // Calculate complexity distribution
    const complexityDistribution = indicators.reduce((acc, indicator) => {
      acc[indicator.implementationComplexity] = (acc[indicator.implementationComplexity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const highComplexityRatio = (complexityDistribution.high || 0) / total;

    // Calculate balance dimensions
    const balanceDimensions = [
      {
        dimension: 'Type Balance',
        score: calculateTypeBalance(outputRatio, outcomeRatio, impactRatio),
        target: 0.8,
        status: (calculateTypeBalance(outputRatio, outcomeRatio, impactRatio) >= 0.6 ? 'optimal' : 'under') as 'under' | 'optimal' | 'over',
        impact: 'Affects measurement comprehensiveness'
      },
      {
        dimension: 'Complexity Balance',
        score: highComplexityRatio > 0.7 ? 0.3 : highComplexityRatio < 0.3 ? 0.8 : 0.9,
        target: 0.8,
        status: (highComplexityRatio > 0.7 ? 'over' : highComplexityRatio < 0.3 ? 'under' : 'optimal') as 'under' | 'optimal' | 'over',
        impact: 'Affects implementation feasibility'
      }
    ];

    // Generate imbalance warnings
    const imbalanceWarnings: ImbalanceWarning[] = [];
    
    if (outputRatio > 0.7) {
      imbalanceWarnings.push({
        warning: 'Portfolio heavily weighted toward output indicators',
        severity: 'high',
        consequences: [
          'Limited insight into actual impact',
          'Difficulty demonstrating value creation',
          'Potential stakeholder skepticism'
        ],
        correctiveActions: [
          'Add outcome indicators to measure changes',
          'Include impact indicators for long-term results',
          'Balance activity measurement with result measurement'
        ]
      });
    }

    if (highComplexityRatio > 0.7) {
      imbalanceWarnings.push({
        warning: 'Portfolio has too many high-complexity indicators',
        severity: 'medium',
        consequences: [
          'Implementation challenges',
          'Resource strain',
          'Reduced data quality'
        ],
        correctiveActions: [
          'Replace some complex indicators with simpler alternatives',
          'Phase implementation of complex indicators',
          'Ensure adequate resources for complex measurements'
        ]
      });
    }

    // Calculate overall balance
    const overallBalance = balanceDimensions.reduce((acc, dim) => acc + dim.score, 0) / balanceDimensions.length;

    return {
      overallBalance,
      balanceDimensions,
      imbalanceWarnings,
      improvementSuggestions: generateImprovementSuggestions(balanceDimensions, imbalanceWarnings)
    };
  }, []);

  // Calculate type balance score
  const calculateTypeBalance = useCallback((
    outputRatio: number,
    outcomeRatio: number,
    impactRatio: number
  ): number => {
    // Ideal ratios: outputs 30-40%, outcomes 40-50%, impacts 15-25%
    const outputScore = outputRatio >= 0.3 && outputRatio <= 0.4 ? 1 : Math.max(0, 1 - Math.abs(outputRatio - 0.35) * 2);
    const outcomeScore = outcomeRatio >= 0.4 && outcomeRatio <= 0.5 ? 1 : Math.max(0, 1 - Math.abs(outcomeRatio - 0.45) * 2);
    const impactScore = impactRatio >= 0.15 && impactRatio <= 0.25 ? 1 : Math.max(0, 1 - Math.abs(impactRatio - 0.2) * 3);
    
    return (outputScore + outcomeScore + impactScore) / 3;
  }, []);

  // Generate improvement suggestions
  const generateImprovementSuggestions = useCallback((
    balanceDimensions: any[],
    imbalanceWarnings: ImbalanceWarning[]
  ) => {
    const suggestions: any[] = [];

    balanceDimensions.forEach(dimension => {
      if (dimension.score < 0.6) {
        suggestions.push({
          suggestion: `Improve ${dimension.dimension.toLowerCase()}`,
          benefit: `Enhanced ${dimension.impact.toLowerCase()}`,
          effort: 'medium',
          priority: dimension.score < 0.3 ? 3 : 2,
          implementationSteps: [
            `Analyze current ${dimension.dimension.toLowerCase()}`,
            'Identify gaps and opportunities',
            'Select appropriate indicators to address gaps',
            'Implement and monitor changes'
          ]
        });
      }
    });

    return suggestions;
  }, []);

  // Get optimization suggestions
  const getOptimizationSuggestions = useCallback(async (
    indicators: EnhancedIrisIndicator[]
  ): Promise<OptimizationSuggestion[]> => {
    setState(prev => ({ ...prev, isOptimizing: true }));

    try {
      const response = await apiClient.request({
        method: 'POST',
        url: '/indicators/optimization-suggestions',
        data: {
          indicators,
          organizationContext: getOrganizationContext(),
          optimizationLevel
        }
      });

      if (response.success) {
        const responseData = response.data as any;
        const suggestions = responseData?.suggestions || [];
        
        setState(prev => ({
          ...prev,
          quickWins: suggestions.filter((s: OptimizationSuggestion) => s.implementationEffort === 'low'),
          isOptimizing: false
        }));

        return suggestions;
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Optimization failed',
        isOptimizing: false
      }));
    }

    return [];
  }, [getOrganizationContext, optimizationLevel]);

  // Benchmark against peers
  const benchmarkPortfolio = useCallback(async (
    indicators: EnhancedIrisIndicator[]
  ): Promise<PortfolioBenchmarking | null> => {
    if (!enableBenchmarking) return null;

    try {
      const response = await apiClient.request({
        method: 'POST',
        url: '/indicators/portfolio-benchmarking',
        data: {
          indicators,
          organizationProfile: {
            type: 'nonprofit',
            sector: 'general',
            size: 'medium',
            geography: 'global'
          }
        }
      });

      if (response.success) {
        const responseData = response.data as any;
        return responseData?.benchmarking;
      }
    } catch (error: any) {
      console.warn('Benchmarking failed:', error);
    }

    return null;
  }, [enableBenchmarking, user?.organizationId]);

  // Auto-optimize portfolio
  const autoOptimizePortfolio = useCallback(async (
    indicators: EnhancedIrisIndicator[]
  ): Promise<EnhancedIrisIndicator[]> => {
    if (!autoOptimization) return indicators;

    const suggestions = await getOptimizationSuggestions(indicators);
    
    // Apply low-effort optimizations automatically
    const lowEffortSuggestions = suggestions.filter(s => 
      s.implementationEffort === 'low' && s.expectedImpact > 0.7
    );

    let optimizedIndicators = [...indicators];

    lowEffortSuggestions.forEach(suggestion => {
      if (suggestion.action === 'add' && suggestion.target) {
        // Add suggested indicator (would need to fetch full indicator data)
        console.log('Auto-optimization would add:', suggestion.target);
      } else if (suggestion.action === 'remove' && suggestion.target) {
        // Remove indicator
        optimizedIndicators = optimizedIndicators.filter(
          ind => ind.id !== suggestion.target
        );
      }
    });

    return optimizedIndicators;
  }, [autoOptimization, getOptimizationSuggestions]);

  // Memoized calculations for performance
  const portfolioMetrics = useMemo(() => {
    if (!state.portfolio) return null;

    const analysis = state.portfolio.analysis;
    return {
      totalIndicators: analysis.totalIndicators,
      typeBalance: analysis.typeDistribution.balance,
      complexityLevel: analysis.complexityDistribution.overallComplexity,
      stakeholderCoverageScore: state.stakeholderCoverage,
      decisionCoverageScore: state.decisionCoverage,
      overallScore: (state.balanceScore + state.stakeholderCoverage + state.decisionCoverage) / 3
    };
  }, [state.portfolio, state.balanceScore, state.stakeholderCoverage, state.decisionCoverage]);

  // Real-time analysis trigger
  useEffect(() => {
    if (enableRealTimeAnalysis) {
      const handleIndicatorChange = (event: CustomEvent) => {
        const { selectedIndicators } = event.detail;
        if (selectedIndicators?.length > 0) {
          analyzePortfolio(selectedIndicators);
        }
      };

      document.addEventListener('indicator_selection_changed', handleIndicatorChange as EventListener);

      return () => {
        document.removeEventListener('indicator_selection_changed', handleIndicatorChange as EventListener);
      };
    }
  }, [enableRealTimeAnalysis, analyzePortfolio]);

  return {
    // State
    portfolio: state.portfolio,
    portfolioMetrics,
    isAnalyzing: state.isAnalyzing,
    isOptimizing: state.isOptimizing,
    error: state.error,
    lastAnalysis: state.lastAnalysis,
    
    // Metrics
    balanceScore: state.balanceScore,
    complexityScore: state.complexityScore,
    stakeholderCoverage: state.stakeholderCoverage,
    decisionCoverage: state.decisionCoverage,
    optimizationPotential: state.optimizationPotential,
    
    // Analysis results
    criticalImbalances: state.criticalImbalances,
    quickWins: state.quickWins,
    
    // Actions
    analyzePortfolio,
    getBalanceAssessment,
    getOptimizationSuggestions,
    benchmarkPortfolio,
    autoOptimizePortfolio,
    
    // Utilities
    clearAnalysis: () => setState(prev => ({ 
      ...prev, 
      portfolio: null,
      error: null,
      balanceScore: 0,
      complexityScore: 0,
      stakeholderCoverage: 0,
      decisionCoverage: 0
    })),
    
    refreshAnalysis: (indicators: EnhancedIrisIndicator[]) => {
      analyzePortfolio(indicators);
    }
  };
};