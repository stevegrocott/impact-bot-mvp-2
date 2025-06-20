import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Users, 
  Target, 
  Activity, 
  Package, 
  TrendingUp, 
  Zap,
  ExternalLink,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { TheoryOfChangeStructure, FoundationReadiness } from './FoundationAssessment';

interface TheoryOfChangeReviewProps {
  theory: TheoryOfChangeStructure | null;
  readiness: FoundationReadiness | null;
  onEdit: () => void;
  onBack: () => void;
}

export const TheoryOfChangeReview: React.FC<TheoryOfChangeReviewProps> = ({
  theory,
  readiness,
  onEdit,
  onBack,
}) => {
  const navigate = useNavigate();

  if (!theory) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Overview
        </button>
        
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Theory of Change Found
          </h2>
          <p className="text-gray-600 mb-6">
            You haven't created your theory of change yet. Let's build one together.
          </p>
          <button
            onClick={onEdit}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Create Theory of Change
          </button>
        </div>
      </div>
    );
  }

  const theoryElements = [
    {
      key: 'targetPopulation',
      title: 'Target Population',
      icon: Users,
      value: theory.targetPopulation,
      description: 'Who you aim to help or serve'
    },
    {
      key: 'problemDefinition',
      title: 'Problem Definition',
      icon: AlertTriangle,
      value: theory.problemDefinition,
      description: 'The core problem you\'re addressing'
    },
    {
      key: 'activities',
      title: 'Activities',
      icon: Activity,
      value: theory.activities,
      description: 'What you do to address the problem'
    },
    {
      key: 'outputs',
      title: 'Outputs',
      icon: Package,
      value: theory.outputs,
      description: 'Direct products or services from your activities'
    },
    {
      key: 'shortTermOutcomes',
      title: 'Short-term Outcomes',
      icon: TrendingUp,
      value: theory.shortTermOutcomes,
      description: 'Changes expected in 1-2 years'
    },
    {
      key: 'longTermOutcomes',
      title: 'Long-term Outcomes',
      icon: Target,
      value: theory.longTermOutcomes,
      description: 'Changes expected in 3-5 years'
    },
    {
      key: 'impacts',
      title: 'Impacts',
      icon: Zap,
      value: theory.impacts,
      description: 'Ultimate change you want to see in the world'
    },
    {
      key: 'assumptions',
      title: 'Assumptions',
      icon: ExternalLink,
      value: theory.assumptions,
      description: 'What needs to be true for your theory to work'
    },
    {
      key: 'externalFactors',
      title: 'External Factors',
      icon: ExternalLink,
      value: theory.externalFactors,
      description: 'Outside factors that could affect success'
    }
  ];

  const contextElements = [
    { label: 'Intervention Type', value: theory.interventionType },
    { label: 'Sector', value: theory.sector },
    { label: 'Geographic Scope', value: theory.geographicScope }
  ];

  const renderValue = (value: string | string[] | undefined) => {
    if (!value) return <span className="text-gray-400 italic">Not specified</span>;
    
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-gray-400 italic">Not specified</span>;
      return (
        <ul className="space-y-1">
          {value.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }
    
    return <span>{value}</span>;
  };

  const isElementComplete = (value: string | string[] | undefined): boolean => {
    if (!value) return false;
    if (Array.isArray(value)) return value.length > 0;
    return value.trim().length > 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Overview
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Theory of Change Review
            </h2>
            <p className="text-gray-600">
              Review and refine your theory of change
            </p>
          </div>
          
          <button
            onClick={onEdit}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Theory
          </button>
        </div>

        {/* Readiness Score */}
        {readiness && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Foundation Readiness</div>
                <div className={`text-lg font-semibold ${
                  readiness.completenessScore >= 90 ? 'text-green-600' :
                  readiness.completenessScore >= 70 ? 'text-blue-600' :
                  readiness.completenessScore >= 50 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {readiness.completenessScore}% ({readiness.readinessLevel})
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Access Level</div>
                <div className="text-sm font-medium">
                  {readiness.allowsAdvancedAccess ? 'Advanced' :
                   readiness.allowsIntermediateAccess ? 'Intermediate' :
                   readiness.allowsBasicAccess ? 'Basic' : 'Blocked'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Theory Elements */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {theoryElements.map((element) => {
            const Icon = element.icon;
            const isComplete = isElementComplete(element.value);
            
            return (
              <div
                key={element.key}
                className={`border rounded-lg p-4 transition-all ${
                  isComplete ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <Icon className={`w-5 h-5 mr-2 ${
                      isComplete ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <h3 className="font-medium text-gray-900">{element.title}</h3>
                  </div>
                  {isComplete ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{element.description}</p>
                
                <div className="text-sm text-gray-900">
                  {renderValue(element.value)}
                </div>
                
                {!isComplete && (
                  <button
                    onClick={onEdit}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Add {element.title.toLowerCase()}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Context Information */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-medium text-gray-900 mb-4">Context Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contextElements.map((element, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {element.label}
                </div>
                <div className="text-sm text-gray-900">
                  {element.value || <span className="text-gray-400 italic">Not specified</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {readiness && readiness.recommendations.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium text-gray-900 mb-4">Recommendations</h3>
            
            <div className="space-y-2">
              {readiness.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Target className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-blue-800">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back to Overview
            </button>
            
            <div className="space-x-3">
              <button
                onClick={onEdit}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
              >
                Edit Theory
              </button>
              
              {readiness && readiness.allowsBasicAccess && (
                <button
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  onClick={() => navigate('/indicators')}
                >
                  Continue to Indicator Selection
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};