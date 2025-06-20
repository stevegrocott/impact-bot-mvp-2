/**
 * Foundation Readiness Widget
 * Real-time foundation scoring with visual progress and bottleneck detection
 * Context: Help users understand and improve their foundation completeness
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  Target,
  ArrowRight,
  Info,
  Zap
} from 'lucide-react';
import { apiClient } from '../shared/services/apiClient';

interface FoundationReadinessScore {
  overall: number; // 0-100
  categories: {
    theoryOfChange: { score: number; status: 'complete' | 'partial' | 'missing'; blockers?: string[] };
    decisionMapping: { score: number; status: 'complete' | 'partial' | 'missing'; blockers?: string[] };
    indicators: { score: number; status: 'complete' | 'partial' | 'missing'; blockers?: string[] };
    stakeholderAlignment: { score: number; status: 'complete' | 'partial' | 'missing'; blockers?: string[] };
  };
  nextActions: Array<{
    action: string;
    impact: 'high' | 'medium' | 'low';
    timeEstimate: string;
    rationale: string;
  }>;
  confidence: number; // 0-100
  readinessLevel: 'foundation' | 'intermediate' | 'advanced';
}

interface FoundationReadinessWidgetProps {
  organizationId?: string;
  onImprove?: (action: string) => void;
  showDetailedBreakdown?: boolean;
}

const FoundationReadinessWidget: React.FC<FoundationReadinessWidgetProps> = ({
  organizationId,
  onImprove,
  showDetailedBreakdown = true
}) => {
  const [readiness, setReadiness] = useState<FoundationReadinessScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFoundationReadiness();
  }, [organizationId]);

  const loadFoundationReadiness = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getFoundationStatus();
      
      // Transform backend response to expected frontend structure
      const backendData = response.data;
      const transformedData: FoundationReadinessScore = {
        overall: calculateOverallScore(backendData),
        categories: {
          theoryOfChange: {
            score: backendData.hasTheoryOfChange ? 100 : 0,
            status: backendData.hasTheoryOfChange ? 'complete' : 'missing',
            blockers: backendData.hasTheoryOfChange ? [] : ['Theory of change not created']
          },
          decisionMapping: {
            score: backendData.hasDecisionMapping ? 100 : Math.min(backendData.decisionCount * 10, 50),
            status: backendData.hasDecisionMapping ? 'complete' : backendData.decisionCount > 0 ? 'partial' : 'missing',
            blockers: backendData.hasDecisionMapping ? [] : ['Decision mapping incomplete']
          },
          indicators: {
            score: 0,
            status: 'missing',
            blockers: ['Indicators not yet selected']
          },
          stakeholderAlignment: {
            score: 0,
            status: 'missing',
            blockers: ['Stakeholder alignment not established']
          }
        },
        nextActions: generateNextActions(backendData),
        confidence: 85,
        readinessLevel: determineReadinessLevel(backendData)
      };
      
      setReadiness(transformedData);
    } catch (error) {
      console.error('Error loading foundation readiness:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallScore = (data: any): number => {
    let score = 0;
    if (data.hasTheoryOfChange) score += 30;
    if (data.hasDecisionMapping) score += 25;
    else if (data.decisionCount > 0) score += Math.min(data.decisionCount * 3, 15);
    return Math.min(score, 100);
  };

  const determineReadinessLevel = (data: any): 'foundation' | 'intermediate' | 'advanced' => {
    if (data.allowsAdvancedAccess) return 'advanced';
    if (data.allowsIntermediateAccess) return 'intermediate';
    return 'foundation';
  };

  const generateNextActions = (data: any) => {
    const actions = [];
    
    if (!data.hasTheoryOfChange) {
      actions.push({
        action: 'Create your theory of change',
        impact: 'high' as const,
        timeEstimate: '30-45 minutes',
        rationale: 'Essential foundation for all measurement activities'
      });
    }
    
    if (!data.hasDecisionMapping) {
      actions.push({
        action: 'Map key decisions',
        impact: 'high' as const,
        timeEstimate: '20-30 minutes',
        rationale: 'Identify what decisions your data will inform'
      });
    }
    
    actions.push({
      action: 'Select impact indicators',
      impact: 'medium' as const,
      timeEstimate: '45-60 minutes',
      rationale: 'Choose relevant IRIS+ indicators for measurement'
    });
    
    return actions;
  };

  const refreshReadiness = async () => {
    setRefreshing(true);
    await loadFoundationReadiness();
    setRefreshing(false);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number): string => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const getStatusIcon = (status: 'complete' | 'partial' | 'missing') => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'partial':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'missing':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
  };

  const handleActionClick = (action: string) => {
    if (onImprove) {
      onImprove(action);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!readiness) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Foundation Assessment Unavailable
          </h3>
          <p className="text-gray-600 mb-4">
            Unable to load your foundation readiness. Please try again.
          </p>
          <button
            onClick={loadFoundationReadiness}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Foundation Readiness
          </h3>
          <p className="text-sm text-gray-600">
            Your impact measurement foundation strength
          </p>
        </div>
        <button
          onClick={refreshReadiness}
          disabled={refreshing}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh assessment"
        >
          <TrendingUp className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Overall Score */}
      <div className={`rounded-lg border-2 p-4 mb-6 ${getScoreBackground(readiness.overall)}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-3xl font-bold ${getScoreColor(readiness.overall)} mb-1`}>
              {readiness.overall}%
            </div>
            <div className="text-sm font-medium text-gray-700">
              {readiness?.readinessLevel?.charAt(0)?.toUpperCase() + readiness?.readinessLevel?.slice(1)} Level
            </div>
            <div className="text-xs text-gray-600">
              Confidence: {readiness.confidence}%
            </div>
          </div>
          <div className="text-right">
            <Target className={`w-12 h-12 ${getScoreColor(readiness.overall)}`} />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {showDetailedBreakdown && (
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Foundation Components</h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          {Object.entries(readiness.categories).map(([key, category]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(category.status)}
                <div>
                  <div className="font-medium text-gray-900 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  {showDetails && category.blockers && category.blockers?.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      Blockers: {category.blockers?.join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <div className={`text-sm font-medium ${getScoreColor(category.score)}`}>
                {category.score}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Next Actions */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 flex items-center">
          <Zap className="w-4 h-4 mr-2 text-blue-600" />
          Priority Actions
        </h4>
        
        {readiness.nextActions?.slice(0, 3).map((action, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <div className="font-medium text-gray-900 mb-1">{action.action}</div>
              <div className="text-sm text-gray-600">{action.rationale}</div>
              <div className="flex items-center mt-2 space-x-3 text-xs text-gray-500">
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {action.timeEstimate}
                </span>
                <span className={`px-2 py-0.5 rounded-full ${
                  action.impact === 'high' ? 'bg-red-100 text-red-700' :
                  action.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {action.impact} impact
                </span>
              </div>
            </div>
            <button
              onClick={() => handleActionClick(action.action)}
              className="ml-4 p-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}

        {readiness.nextActions?.length > 3 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-sm text-blue-600 hover:text-blue-800 transition-colors py-2"
          >
            View {readiness.nextActions?.length - 3} more actions
          </button>
        )}
      </div>

      {/* Foundation Level Info */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <strong>Foundation Level:</strong> {readiness.readinessLevel === 'foundation' ? 
              'Building your measurement foundation. Focus on theory of change and decision mapping.' :
              readiness.readinessLevel === 'intermediate' ?
              'Foundation established. Ready for indicator selection and stakeholder alignment.' :
              'Advanced foundation. Ready for comprehensive measurement system implementation.'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoundationReadinessWidget;