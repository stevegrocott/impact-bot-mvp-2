/**
 * Real-Time Pitfall Warning System
 * Displays AI-powered warnings during indicator selection to prevent measurement mistakes
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Info, 
  X, 
  CheckCircle, 
  ExternalLink,
  Lightbulb,
  Shield,
  TrendingDown,
  Target,
  Activity,
  AlertCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

// Types
interface RealTimeWarning {
  id: string;
  type: 'activity_vs_impact' | 'proxy_metric' | 'over_engineering' | 'portfolio_imbalance' | 'foundation_gap';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  explanation: string;
  recommendations: string[];
  actionRequired: boolean;
  dismissible: boolean;
  metadata: Record<string, any>;
  expiresAt?: Date;
}

interface WarningSystemProps {
  warnings: RealTimeWarning[];
  shouldBlock: boolean;
  allowContinue: boolean;
  contextualGuidance?: string;
  nextStepRecommendation?: string;
  onWarningAction: (warningId: string, action: 'dismissed' | 'acted_upon' | 'ignored') => void;
  onContinue?: () => void;
}

// Component
export const PitfallWarningSystem: React.FC<WarningSystemProps> = ({
  warnings,
  shouldBlock,
  allowContinue,
  contextualGuidance,
  nextStepRecommendation,
  onWarningAction,
  onContinue
}) => {
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  const [expandedWarnings, setExpandedWarnings] = useState<Set<string>>(new Set());
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  // Get warning styling based on type and severity
  const getWarningStyle = (warning: RealTimeWarning) => {
    const baseStyles = {
      activity_vs_impact: {
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        iconColor: 'text-orange-600',
        icon: <Activity className="w-5 h-5" />
      },
      proxy_metric: {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-600',
        icon: <Target className="w-5 h-5" />
      },
      over_engineering: {
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        iconColor: 'text-purple-600',
        icon: <TrendingDown className="w-5 h-5" />
      },
      portfolio_imbalance: {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-600',
        icon: <Shield className="w-5 h-5" />
      },
      foundation_gap: {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        icon: <AlertCircle className="w-5 h-5" />
      }
    };

    const severityOverrides = {
      critical: {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        iconColor: 'text-red-700'
      },
      high: {
        borderColor: 'border-orange-300'
      }
    };

    const base = baseStyles[warning.type];
    const severity = warning.severity === 'critical' || warning.severity === 'high' 
      ? severityOverrides[warning.severity] || {} 
      : {};

    return { ...base, ...severity };
  };

  // Handle warning dismissal
  const handleDismiss = (warningId: string) => {
    setDismissedWarnings(prev => new Set([...prev, warningId]));
    onWarningAction(warningId, 'dismissed');
  };

  // Handle warning expansion
  const toggleExpansion = (warningId: string) => {
    setExpandedWarnings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(warningId)) {
        newSet.delete(warningId);
      } else {
        newSet.add(warningId);
      }
      return newSet;
    });
  };

  // Handle feedback
  const handleFeedback = (warningId: string, helpful: boolean) => {
    setFeedbackGiven(prev => new Set([...prev, warningId]));
    onWarningAction(warningId, helpful ? 'acted_upon' : 'ignored');
  };

  // Filter active warnings
  const activeWarnings = warnings.filter(w => !dismissedWarnings.has(w.id));
  const criticalWarnings = activeWarnings.filter(w => w.severity === 'critical');
  const highWarnings = activeWarnings.filter(w => w.severity === 'high');

  // If no warnings, show positive confirmation
  if (warnings.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-green-800">
              No Pitfalls Detected
            </h3>
            <p className="text-sm text-green-700 mt-1">
              Your measurement approach looks good! Continue with your indicator selection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Critical blocking message */}
      {shouldBlock && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">
                Critical Issues Detected
              </h3>
              <p className="text-sm text-red-700">
                Address these measurement pitfalls before continuing
              </p>
            </div>
          </div>
          
          {nextStepRecommendation && (
            <div className="bg-white border border-red-200 rounded p-3 mt-4">
              <p className="text-sm text-red-800 font-medium">
                Recommended next step: {nextStepRecommendation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Warning summary */}
      {activeWarnings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">
              Measurement Guidance
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {criticalWarnings.length > 0 && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  {criticalWarnings.length} Critical
                </span>
              )}
              {highWarnings.length > 0 && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                  {highWarnings.length} High Priority
                </span>
              )}
            </div>
          </div>
          
          {contextualGuidance && (
            <p className="text-sm text-gray-700 mb-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              {contextualGuidance}
            </p>
          )}
        </div>
      )}

      {/* Individual warnings */}
      <div className="space-y-3">
        {activeWarnings.map((warning) => {
          const style = getWarningStyle(warning);
          const isExpanded = expandedWarnings.has(warning.id);
          const hasFeedback = feedbackGiven.has(warning.id);

          return (
            <div
              key={warning.id}
              className={`${style.bgColor} ${style.borderColor} border rounded-lg p-4`}
            >
              {/* Warning header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className={`${style.iconColor} mt-0.5 mr-3`}>
                    {style.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {warning.title}
                      </h4>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        warning.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        warning.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        warning.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {warning.severity}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mt-1">
                      {warning.message}
                    </p>
                    
                    {!isExpanded && warning.recommendations.length > 0 && (
                      <button
                        onClick={() => toggleExpansion(warning.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium"
                      >
                        See recommendations →
                      </button>
                    )}
                  </div>
                </div>
                
                {warning.dismissible && (
                  <button
                    onClick={() => handleDismiss(warning.id)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="mt-4 pl-8 space-y-4">
                  {/* Explanation */}
                  <div className="bg-white bg-opacity-60 rounded p-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      Why this matters:
                    </h5>
                    <p className="text-sm text-gray-700">
                      {warning.explanation}
                    </p>
                  </div>

                  {/* Recommendations */}
                  {warning.recommendations.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-1" />
                        Recommendations:
                      </h5>
                      <ul className="space-y-2">
                        {warning.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="mr-2 text-blue-600">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Alternative indicators */}
                  {warning.metadata.suggestedOutcomes && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        Suggested outcome indicators:
                      </h5>
                      <div className="space-y-1">
                        {warning.metadata.suggestedOutcomes.map((outcome: any, index: number) => (
                          <div key={index} className="text-sm bg-white bg-opacity-60 rounded p-2">
                            <div className="font-medium text-gray-900">{outcome.name}</div>
                            <div className="text-gray-600 text-xs">{outcome.reasoning}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback buttons */}
                  {!hasFeedback && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-600">Was this guidance helpful?</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFeedback(warning.id, true)}
                          className="flex items-center text-xs text-green-600 hover:text-green-800"
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          Yes
                        </button>
                        <button
                          onClick={() => handleFeedback(warning.id, false)}
                          className="flex items-center text-xs text-gray-600 hover:text-gray-800"
                        >
                          <ThumbsDown className="w-3 h-3 mr-1" />
                          No
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Collapse button */}
                  <button
                    onClick={() => toggleExpansion(warning.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ← Hide details
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Continue/block actions */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          {shouldBlock ? (
            <div className="flex items-center text-red-700">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">
                Address critical issues to continue
              </span>
            </div>
          ) : (
            <div className="flex items-center text-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">
                You can continue with your selection
              </span>
            </div>
          )}
        </div>
        
        {onContinue && allowContinue && (
          <button
            onClick={onContinue}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Continue Selection
          </button>
        )}
      </div>
    </div>
  );
};

export default PitfallWarningSystem;