import React from 'react';
import { 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  ArrowRight,
  TrendingUp,
  Lock,
  Unlock
} from 'lucide-react';
import { TheoryOfChangeStructure, FoundationReadiness } from './FoundationAssessment';

interface ReadinessOverviewProps {
  readiness: FoundationReadiness | null;
  theory: TheoryOfChangeStructure | null;
  onStartAssessment: () => void;
  onReviewTheory: () => void;
}

export const ReadinessOverview: React.FC<ReadinessOverviewProps> = ({
  readiness,
  theory,
  onStartAssessment,
  onReviewTheory,
}) => {
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number): string => {
    if (score >= 90) return 'bg-green-100 border-green-200';
    if (score >= 70) return 'bg-blue-100 border-blue-200';
    if (score >= 50) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const getReadinessLevelInfo = (level: string) => {
    switch (level) {
      case 'excellent':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          description: 'Your foundation is comprehensive and ready for advanced measurement',
          capabilities: ['Full IRIS+ access', 'Custom indicators', 'Advanced reporting', 'Multi-stakeholder dashboards']
        };
      case 'good':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          description: 'Strong foundation ready for intermediate measurement features',
          capabilities: ['Basic IRIS+ access', 'Standard indicators', 'Core reporting', 'Team collaboration']
        };
      case 'basic':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          description: 'Foundation established, suitable for basic measurement',
          capabilities: ['Limited IRIS+ access', 'Basic indicators', 'Simple reporting']
        };
      default:
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          description: 'Foundation needs development before accessing measurement features',
          capabilities: ['Theory of change required', 'Assessment blocked', 'No measurement access']
        };
    }
  };

  if (!theory && !readiness) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Target className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Welcome to Foundation Assessment
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Build a strong foundation for effective impact measurement. We'll help you create 
            your theory of change and establish decision mapping to ensure your measurement 
            approach is purposeful and practical.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-3">
              Why is foundation important?
            </h3>
            <div className="text-left text-blue-800 space-y-2">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Prevents over-engineering:</strong> Avoid measuring everything and focus on what matters for decisions
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Enables phase-gated access:</strong> Build measurement complexity gradually as your foundation strengthens
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Improves stakeholder buy-in:</strong> Clear theory of change helps everyone understand the measurement logic
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={onStartAssessment}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Foundation Assessment
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  if (!readiness) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Clock className="w-16 h-16 text-yellow-600 mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Assessing Your Foundation
          </h2>
          <p className="text-gray-600 mb-8">
            We're analyzing your theory of change to determine your foundation readiness...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  const levelInfo = getReadinessLevelInfo(readiness.readinessLevel);

  return (
    <div className="space-y-6">
      {/* Foundation Score */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Foundation Readiness</h2>
            <p className="text-gray-600">Your impact measurement foundation strength</p>
          </div>
          <TrendingUp className="w-6 h-6 text-blue-600" />
        </div>

        <div className={`rounded-lg border-2 p-6 mb-6 ${getScoreBackground(readiness.completenessScore)}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-4xl font-bold ${getScoreColor(readiness.completenessScore)} mb-2`}>
                {readiness.completenessScore}%
              </div>
              <div className="text-lg font-semibold text-gray-800 capitalize">
                {readiness.readinessLevel} Level
              </div>
            </div>
            <Target className={`w-16 h-16 ${getScoreColor(readiness.completenessScore)}`} />
          </div>
        </div>

        <div className={`rounded-lg p-4 ${levelInfo.bgColor} border`}>
          <p className={`${levelInfo.color} font-medium mb-3`}>
            {levelInfo.description}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {levelInfo.capabilities.map((capability, index) => (
              <div key={index} className="flex items-center">
                {readiness.readinessLevel === 'insufficient' ? (
                  <Lock className="w-4 h-4 text-red-500 mr-2" />
                ) : (
                  <Unlock className="w-4 h-4 text-green-500 mr-2" />
                )}
                <span className="text-sm text-gray-700">{capability}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Foundation Elements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Foundation Elements</h3>
        
        <div className="space-y-4">
          {/* Theory of Change */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {theory ? (
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              )}
              <div>
                <div className="font-medium text-gray-900">Theory of Change</div>
                <div className="text-sm text-gray-600">
                  {theory ? 'Complete and ready' : 'Not yet created'}
                </div>
              </div>
            </div>
            {theory && (
              <button
                onClick={onReviewTheory}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Review
              </button>
            )}
          </div>

          {/* Strength Areas */}
          {readiness.strengthAreas.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Strength Areas</h4>
              <div className="flex flex-wrap gap-2">
                {readiness.strengthAreas.map((area, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                  >
                    {area.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Elements */}
          {readiness.missingElements.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-900 mb-2">Areas for Improvement</h4>
              <div className="flex flex-wrap gap-2">
                {readiness.missingElements.map((element, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full"
                  >
                    {element.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {readiness.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
          
          <div className="space-y-3">
            {readiness.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start p-3 border border-gray-200 rounded-lg">
                <ArrowRight className="w-4 h-4 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-4">
        {!theory && (
          <button
            onClick={onStartAssessment}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Theory of Change
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        )}
        
        {theory && readiness.readinessLevel === 'insufficient' && (
          <button
            onClick={onReviewTheory}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            Improve Foundation
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        )}
        
        {theory && (
          <button
            onClick={onReviewTheory}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Review Theory of Change
          </button>
        )}
      </div>
    </div>
  );
};