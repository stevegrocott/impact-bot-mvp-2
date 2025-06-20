/**
 * Foundation Readiness Assessment Card
 * Shows readiness scoring and unlocked capabilities
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Star,
  TrendingUp,
  Lightbulb,
  Shield,
  Target,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

interface FoundationReadiness {
  completenessScore: number;
  readinessLevel: 'insufficient' | 'basic' | 'good' | 'excellent';
  missingElements: string[];
  strengthAreas: string[];
  recommendations: string[];
  allowsBasicAccess: boolean;
  allowsIntermediateAccess: boolean;
  allowsAdvancedAccess: boolean;
}

interface FoundationReadinessCardProps {
  readiness: FoundationReadiness;
}

export const FoundationReadinessCard: React.FC<FoundationReadinessCardProps> = ({ 
  readiness 
}) => {
  const navigate = useNavigate();

  // Smart navigation based on recommendation content
  const getRecommendationAction = (recommendation: string) => {
    const lowerRec = recommendation.toLowerCase();
    
    if (lowerRec.includes('theory of change') || lowerRec.includes('target population') || lowerRec.includes('problem')) {
      return {
        label: 'Complete Theory of Change',
        action: () => navigate('/foundation/theory-of-change'),
        icon: <ArrowRight className="w-4 h-4" />
      };
    } else if (lowerRec.includes('decision mapping') || lowerRec.includes('strategic')) {
      return {
        label: 'Start Decision Mapping',
        action: () => navigate('/foundation/decisions'),
        icon: <ArrowRight className="w-4 h-4" />
      };
    } else if (lowerRec.includes('indicator') || lowerRec.includes('measurement')) {
      return {
        label: 'Browse Indicators',
        action: () => navigate('/indicators'),
        icon: <ArrowRight className="w-4 h-4" />
      };
    } else if (lowerRec.includes('stakeholder') || lowerRec.includes('feedback')) {
      return {
        label: 'Review Theory',
        action: () => navigate('/foundation/theory-of-change'),
        icon: <ArrowRight className="w-4 h-4" />
      };
    } else if (lowerRec.includes('comprehensive') || lowerRec.includes('ready')) {
      return {
        label: 'Start Measurement Planning',
        action: () => navigate('/measurement-planning'),
        icon: <ArrowRight className="w-4 h-4" />
      };
    }
    
    // Default action
    return {
      label: 'Continue Setup',
      action: () => navigate('/foundation'),
      icon: <ArrowRight className="w-4 h-4" />
    };
  };

  // Get next step actions based on readiness level
  const getNextStepActions = () => {
    if (readiness.allowsAdvancedAccess) {
      return [
        {
          label: 'Start Indicator Selection',
          action: () => navigate('/indicators'),
          primary: true,
          description: 'Access the full IRIS+ library and create custom indicators'
        },
        {
          label: 'Advanced Analytics',
          action: () => navigate('/analytics'),
          primary: false,
          description: 'View comprehensive measurement analytics'
        }
      ];
    } else if (readiness.allowsIntermediateAccess) {
      return [
        {
          label: 'Start Measurement Planning',
          action: () => navigate('/measurement-planning'),
          primary: true,
          description: 'Create data collection plans and measurement strategies'
        },
        {
          label: 'Decision Mapping',
          action: () => navigate('/foundation/decisions'),
          primary: false,
          description: 'Map key strategic decisions to improve foundation'
        }
      ];
    } else if (readiness.allowsBasicAccess) {
      return [
        {
          label: 'Browse IRIS+ Indicators',
          action: () => navigate('/indicators'),
          primary: true,
          description: 'Explore measurement indicators and best practices'
        },
        {
          label: 'Complete Theory of Change',
          action: () => navigate('/foundation/theory-of-change'),
          primary: false,
          description: 'Add missing elements to unlock more features'
        }
      ];
    } else {
      return [
        {
          label: 'Complete Foundation Setup',
          action: () => navigate('/foundation/theory-of-change'),
          primary: true,
          description: 'Build your theory of change and unlock platform features'
        }
      ];
    }
  };

  const nextStepActions = getNextStepActions();
  // Get readiness level styling
  const getReadinessStyle = () => {
    switch (readiness.readinessLevel) {
      case 'excellent':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          barColor: 'bg-green-500'
        };
      case 'good':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          barColor: 'bg-blue-500'
        };
      case 'basic':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          barColor: 'bg-yellow-500'
        };
      default:
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          barColor: 'bg-red-500'
        };
    }
  };

  const style = getReadinessStyle();

  // Define access levels and what they unlock
  const accessLevels = [
    {
      name: 'Basic Access',
      enabled: readiness.allowsBasicAccess,
      icon: <Shield className="w-4 h-4" />,
      features: [
        'Browse IRIS+ indicators',
        'View basic recommendations',
        'Access measurement guides'
      ]
    },
    {
      name: 'Intermediate Access',
      enabled: readiness.allowsIntermediateAccess,
      icon: <Target className="w-4 h-4" />,
      features: [
        'Create measurement plans',
        'Receive pitfall warnings',
        'Access decision mapping tools'
      ]
    },
    {
      name: 'Advanced Access',
      enabled: readiness.allowsAdvancedAccess,
      icon: <Star className="w-4 h-4" />,
      features: [
        'Full indicator selection',
        'Custom indicator development',
        'Advanced analytics dashboard'
      ]
    }
  ];

  // Get readiness level title
  const getReadinessTitle = () => {
    switch (readiness.readinessLevel) {
      case 'excellent':
        return 'Excellent Foundation';
      case 'good':
        return 'Good Foundation';
      case 'basic':
        return 'Basic Foundation';
      default:
        return 'Foundation Needs Work';
    }
  };

  // Get readiness description
  const getReadinessDescription = () => {
    switch (readiness.readinessLevel) {
      case 'excellent':
        return 'Your theory of change is comprehensive and well-structured. You have full access to all platform features.';
      case 'good':
        return 'Your foundation is solid with room for enhancement. Most features are available to you.';
      case 'basic':
        return 'You have the essential elements in place. Some advanced features require foundation improvements.';
      default:
        return 'Your foundation needs strengthening before accessing measurement tools. Complete the missing elements first.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main readiness score */}
      <div className={`${style.bgColor} ${style.borderColor} border rounded-lg p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`${style.iconColor} mr-3`}>
              {readiness.readinessLevel === 'excellent' ? <CheckCircle className="w-6 h-6" /> :
               readiness.readinessLevel === 'insufficient' ? <AlertTriangle className="w-6 h-6" /> :
               <TrendingUp className="w-6 h-6" />}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${style.textColor}`}>
                {getReadinessTitle()}
              </h3>
              <p className="text-sm text-gray-600">
                Foundation Completeness
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${style.textColor}`}>
              {readiness.completenessScore}%
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${style.barColor}`}
            style={{ width: `${readiness.completenessScore}%` }}
          />
        </div>

        <p className={`text-sm ${style.textColor}`}>
          {getReadinessDescription()}
        </p>
      </div>

      {/* Access levels */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Platform Access Levels
        </h4>
        
        <div className="space-y-4">
          {accessLevels.map((level, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                {level.enabled ? (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Unlock className="w-4 h-4 text-green-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center">
                  {level.icon}
                  <h5 className={`ml-2 font-medium ${level.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                    {level.name}
                  </h5>
                  {level.enabled && (
                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Unlocked
                    </span>
                  )}
                </div>
                
                <ul className="mt-2 space-y-1">
                  {level.features.map((feature, featureIndex) => (
                    <li 
                      key={featureIndex} 
                      className={`text-sm flex items-center ${level.enabled ? 'text-gray-600' : 'text-gray-400'}`}
                    >
                      <span className="mr-2">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths and improvements */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Strengths */}
        {readiness.strengthAreas.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <h4 className="font-medium text-green-800">Strengths</h4>
            </div>
            <ul className="space-y-1">
              {readiness.strengthAreas.map((strength, index) => (
                <li key={index} className="text-sm text-green-700 flex items-start">
                  <span className="mr-2">✓</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing elements */}
        {readiness.missingElements.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              <h4 className="font-medium text-orange-800">Missing Elements</h4>
            </div>
            <ul className="space-y-1">
              {readiness.missingElements.map((missing, index) => (
                <li key={index} className="text-sm text-orange-700 flex items-start">
                  <span className="mr-2">!</span>
                  {missing}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {readiness.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
            <h4 className="font-medium text-blue-800">Recommendations</h4>
          </div>
          <div className="space-y-3">
            {readiness.recommendations.map((recommendation, index) => {
              const action = getRecommendationAction(recommendation);
              return (
                <div key={index} className="flex items-start justify-between p-3 bg-white rounded-lg border border-blue-100">
                  <div className="flex-1">
                    <div className="flex items-start">
                      <span className="mr-2 mt-0.5">💡</span>
                      <span className="text-sm text-blue-700">{recommendation}</span>
                    </div>
                  </div>
                  <button
                    onClick={action.action}
                    className="ml-3 flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex-shrink-0"
                  >
                    {action.label}
                    {action.icon && <span className="ml-1">{action.icon}</span>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Next steps */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Next Steps</h4>
        
        <div className="space-y-3">
          {readiness.allowsAdvancedAccess && (
            <p className="text-sm text-gray-700">
              🎉 Excellent! You have full access to all platform features.
            </p>
          )}
          {readiness.allowsIntermediateAccess && !readiness.allowsAdvancedAccess && (
            <p className="text-sm text-gray-700">
              You can start with measurement planning. Complete missing elements to unlock advanced features.
            </p>
          )}
          {readiness.allowsBasicAccess && !readiness.allowsIntermediateAccess && (
            <p className="text-sm text-gray-700">
              You can browse indicators and guides. Complete your foundation to unlock measurement tools.
            </p>
          )}
          {!readiness.allowsBasicAccess && (
            <p className="text-sm text-gray-700">
              Complete the missing foundation elements to access measurement features.
            </p>
          )}
          
          <div className="space-y-2">
            {nextStepActions.map((stepAction, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{stepAction.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{stepAction.description}</div>
                </div>
                <button
                  onClick={stepAction.action}
                  className={`flex items-center px-4 py-2 text-sm rounded-md transition-colors ml-3 ${
                    stepAction.primary
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {stepAction.label}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoundationReadinessCard;