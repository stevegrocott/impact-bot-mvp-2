/**
 * Portfolio Visualization Component
 * Advanced visualization of indicator portfolios with balance analysis and optimization insights
 */

import React, { useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Activity,
  Users,
  Zap,
  Shield,
  Eye,
  Info
} from 'lucide-react';

import {
  EnhancedIrisIndicator,
  IndicatorPortfolio,
  BalanceAssessment,
  ImbalanceWarning,
  OptimizationSuggestion
} from '../types/enhancedTypes';

interface PortfolioVisualizationProps {
  indicators: EnhancedIrisIndicator[];
  portfolio?: IndicatorPortfolio | null;
  balanceAssessment?: BalanceAssessment;
  showOptimizationSuggestions?: boolean;
  showStakeholderAnalysis?: boolean;
  className?: string;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

export const PortfolioVisualization: React.FC<PortfolioVisualizationProps> = ({
  indicators,
  portfolio,
  balanceAssessment,
  showOptimizationSuggestions = true,
  showStakeholderAnalysis = true,
  className = ""
}) => {

  // Calculate distribution data
  const distributionData = useMemo(() => {
    if (indicators.length === 0) return { types: [], complexity: [], stakeholders: [] };

    // Type distribution
    const typeCount = indicators.reduce((acc, ind) => {
      acc[ind.type] = (acc[ind.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const types: ChartData[] = [
      { 
        label: 'Output', 
        value: typeCount.output || 0, 
        color: 'rgb(147, 51, 234)', 
        percentage: ((typeCount.output || 0) / indicators.length) * 100 
      },
      { 
        label: 'Outcome', 
        value: typeCount.outcome || 0, 
        color: 'rgb(34, 197, 94)', 
        percentage: ((typeCount.outcome || 0) / indicators.length) * 100 
      },
      { 
        label: 'Impact', 
        value: typeCount.impact || 0, 
        color: 'rgb(59, 130, 246)', 
        percentage: ((typeCount.impact || 0) / indicators.length) * 100 
      }
    ];

    // Complexity distribution
    const complexityCount = indicators.reduce((acc, ind) => {
      acc[ind.implementationComplexity] = (acc[ind.implementationComplexity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const complexity: ChartData[] = [
      { 
        label: 'Low', 
        value: complexityCount.low || 0, 
        color: 'rgb(34, 197, 94)', 
        percentage: ((complexityCount.low || 0) / indicators.length) * 100 
      },
      { 
        label: 'Medium', 
        value: complexityCount.medium || 0, 
        color: 'rgb(251, 191, 36)', 
        percentage: ((complexityCount.medium || 0) / indicators.length) * 100 
      },
      { 
        label: 'High', 
        value: complexityCount.high || 0, 
        color: 'rgb(239, 68, 68)', 
        percentage: ((complexityCount.high || 0) / indicators.length) * 100 
      }
    ];

    // Stakeholder relevance analysis
    const stakeholderRelevance = indicators.reduce((acc, ind) => {
      ind.stakeholderRelevance.forEach(sr => {
        if (!acc[sr.stakeholderType]) {
          acc[sr.stakeholderType] = { total: 0, count: 0 };
        }
        acc[sr.stakeholderType].total += sr.relevanceScore;
        acc[sr.stakeholderType].count += 1;
      });
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const stakeholders: ChartData[] = Object.entries(stakeholderRelevance).map(([type, data]) => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: data.total / data.count,
      color: getStakeholderColor(type),
      percentage: (data.total / data.count) * 100
    }));

    return { types, complexity, stakeholders };
  }, [indicators]);

  // Balance score calculation
  const balanceScore = useMemo(() => {
    if (!balanceAssessment) return 0;
    return balanceAssessment.overallBalance * 100;
  }, [balanceAssessment]);

  // Get stakeholder color
  const getStakeholderColor = (stakeholderType: string): string => {
    const colors: Record<string, string> = {
      beneficiaries: 'rgb(34, 197, 94)',
      funders: 'rgb(59, 130, 246)',
      partners: 'rgb(147, 51, 234)',
      staff: 'rgb(251, 191, 36)',
      community: 'rgb(239, 68, 68)',
      government: 'rgb(156, 163, 175)'
    };
    return colors[stakeholderType] || 'rgb(156, 163, 175)';
  };

  // Get balance status color
  const getBalanceStatusColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Render donut chart
  const renderDonutChart = (data: ChartData[], title: string, centerValue?: string) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return null;

    let cumulativePercentage = 0;
    const radius = 60;
    const strokeWidth = 20;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className="text-center">
        <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
        <div className="relative inline-block">
          <svg width="160" height="160" className="transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth={strokeWidth}
            />
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
              
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={index}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
          {centerValue && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{centerValue}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 space-y-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700">{item.label}</span>
              </div>
              <div className="text-gray-900 font-medium">
                {item.value} ({Math.round(item.percentage)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render balance meter
  const renderBalanceMeter = () => {
    const score = balanceScore;
    const rotation = (score / 100) * 180 - 90;

    return (
      <div className="text-center">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Portfolio Balance</h4>
        <div className="relative inline-block">
          <svg width="160" height="100" className="overflow-visible">
            {/* Background arc */}
            <path
              d="M 20 80 A 60 60 0 0 1 140 80"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="20"
              strokeLinecap="round"
            />
            {/* Colored arcs for different ranges */}
            <path
              d="M 20 80 A 60 60 0 0 1 80 20"
              fill="none"
              stroke="#ef4444"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.3"
            />
            <path
              d="M 80 20 A 60 60 0 0 1 140 80"
              fill="none"
              stroke="#22c55e"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* Indicator needle */}
            <line
              x1="80"
              y1="80"
              x2="80"
              y2="30"
              stroke="#374151"
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${rotation} 80 80)`}
              className="transition-transform duration-500"
            />
            <circle cx="80" cy="80" r="4" fill="#374151" />
          </svg>
          <div className="absolute inset-0 flex items-end justify-center pb-2">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getBalanceStatusColor(score)}`}>
                {Math.round(score)}%
              </div>
              <div className="text-xs text-gray-500">Balance Score</div>
            </div>
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Poor</span>
          <span>Good</span>
          <span>Excellent</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-900">{indicators.length}</div>
              <div className="text-sm text-blue-700">Total Indicators</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className={`text-2xl font-bold ${getBalanceStatusColor(balanceScore)}`}>
                {Math.round(balanceScore)}%
              </div>
              <div className="text-sm text-green-700">Balance Score</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-purple-900">
                {Math.round(indicators.reduce((sum, ind) => sum + ind.contextualRelevance, 0) / indicators.length * 100)}%
              </div>
              <div className="text-sm text-purple-700">Avg Relevance</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-900">
                {indicators.filter(ind => ind.implementationComplexity === 'low').length}
              </div>
              <div className="text-sm text-yellow-700">Quick Wins</div>
            </div>
          </div>
        </div>
      </div>

      {/* Visualization Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Type Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {renderDonutChart(distributionData.types, "Indicator Types", indicators.length.toString())}
        </div>

        {/* Balance Meter */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {renderBalanceMeter()}
        </div>

        {/* Complexity Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {renderDonutChart(distributionData.complexity, "Implementation Complexity", indicators.length.toString())}
        </div>
      </div>

      {/* Stakeholder Analysis */}
      {showStakeholderAnalysis && distributionData.stakeholders.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Stakeholder Relevance Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {distributionData.stakeholders.map((stakeholder, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{stakeholder.label}</span>
                  <span className="text-sm text-gray-900 font-bold">
                    {Math.round(stakeholder.percentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${stakeholder.percentage}%`,
                      backgroundColor: stakeholder.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Balance Assessment Details */}
      {balanceAssessment && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Balance Assessment Details
          </h3>
          
          <div className="space-y-4">
            {balanceAssessment.balanceDimensions.map((dimension, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{dimension.dimension}</div>
                  <div className="text-sm text-gray-600">{dimension.impact}</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {Math.round(dimension.score * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      Target: {Math.round(dimension.target * 100)}%
                    </div>
                  </div>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        dimension.score >= dimension.target ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min(dimension.score / dimension.target * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center">
                    {dimension.status === 'optimal' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Imbalance Warnings */}
      {balanceAssessment?.imbalanceWarnings && balanceAssessment.imbalanceWarnings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-orange-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Portfolio Imbalances
          </h3>
          
          <div className="space-y-4">
            {balanceAssessment.imbalanceWarnings.map((warning, index) => (
              <div key={index} className="bg-white border border-orange-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className={`w-5 h-5 mr-3 mt-0.5 ${
                    warning.severity === 'critical' ? 'text-red-500' :
                    warning.severity === 'high' ? 'text-orange-500' :
                    'text-yellow-500'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{warning.warning}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Consequences: {warning.consequences.join(', ')}
                    </div>
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Recommended Actions:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {warning.correctiveActions.map((action, actionIndex) => (
                          <li key={actionIndex} className="flex items-start">
                            <span className="mr-2">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvement Suggestions */}
      {balanceAssessment?.improvementSuggestions && balanceAssessment.improvementSuggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Improvement Opportunities
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            {balanceAssessment.improvementSuggestions.map((suggestion, index) => (
              <div key={index} className="bg-white border border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-blue-900">{suggestion.suggestion}</div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    suggestion.effort === 'low' ? 'bg-green-100 text-green-800' :
                    suggestion.effort === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {suggestion.effort} effort
                  </div>
                </div>
                <div className="text-sm text-blue-700 mb-3">{suggestion.benefit}</div>
                <div className="text-xs text-blue-600">
                  Priority: {suggestion.priority}/5
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioVisualization;