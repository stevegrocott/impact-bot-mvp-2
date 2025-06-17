/**
 * Foundation Readiness Assessment Card
 * Shows readiness scoring and unlocked capabilities
 */

import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Star,
  TrendingUp,
  Lightbulb,
  Shield,
  Target
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
          <ul className="space-y-2">
            {readiness.recommendations.map((recommendation, index) => (
              <li key={index} className="text-sm text-blue-700 flex items-start">
                <span className="mr-2">💡</span>
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next steps */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Next Steps</h4>
        
        {readiness.allowsAdvancedAccess ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              🎉 Excellent! You have full access to all platform features.
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              → Proceed to Indicator Selection
            </button>
          </div>
        ) : readiness.allowsIntermediateAccess ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              You can start with measurement planning. Complete missing elements to unlock advanced features.
            </p>
            <div className="flex space-x-4">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                → Start Measurement Planning
              </button>
              <button className="text-sm text-gray-600 hover:text-gray-800 font-medium">
                → Improve Foundation
              </button>
            </div>
          </div>
        ) : readiness.allowsBasicAccess ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              You can browse indicators and guides. Complete your foundation to unlock measurement tools.
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              → Complete Foundation Elements
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Complete the missing foundation elements to access measurement features.
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              → Return to Foundation Setup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoundationReadinessCard;