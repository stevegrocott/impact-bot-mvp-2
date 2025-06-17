/**
 * Phase-Gated Workflow Component
 * Visual representation of foundation-first progressive access
 * Prevents "jumping to metrics without context" through UI enforcement
 */

import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Info,
  ArrowRight,
  Star,
  Shield,
  Target,
  FileText,
  MessageCircle,
  BarChart3,
  Settings
} from 'lucide-react';

// Types
interface PhaseGateStatus {
  hasTheoryOfChange: boolean;
  foundationReadiness: any;
  hasDecisionMapping: boolean;
  decisionCount: number;
  allowsBasicAccess: boolean;
  allowsIntermediateAccess: boolean;
  allowsAdvancedAccess: boolean;
  blockingReasons: string[];
}

interface WorkflowPhase {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  requiredLevel: 'basic' | 'intermediate' | 'advanced';
  features: string[];
  estimatedTime?: string;
}

interface PhaseGatedWorkflowProps {
  foundationStatus: PhaseGateStatus;
  currentPhase?: string;
  onPhaseSelect: (phaseId: string) => void;
}

// Component
export const PhaseGatedWorkflow: React.FC<PhaseGatedWorkflowProps> = ({
  foundationStatus,
  currentPhase,
  onPhaseSelect
}) => {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  // Define workflow phases
  const workflowPhases: WorkflowPhase[] = [
    {
      id: 'foundation',
      title: 'Foundation Setup',
      description: 'Establish your theory of change and decision framework',
      icon: <Shield className="w-6 h-6" />,
      requiredLevel: 'basic',
      features: [
        'Theory of change capture',
        'Decision mapping',
        'Organizational context',
        'Foundation readiness assessment'
      ],
      estimatedTime: '20-30 minutes'
    },
    {
      id: 'discovery',
      title: 'Indicator Discovery',
      description: 'Explore and discover relevant IRIS+ indicators',
      icon: <Target className="w-6 h-6" />,
      requiredLevel: 'basic',
      features: [
        'Browse IRIS+ framework',
        'Search by keywords',
        'View indicator details',
        'Basic pitfall warnings'
      ],
      estimatedTime: '15-25 minutes'
    },
    {
      id: 'planning',
      title: 'Measurement Planning',
      description: 'Create measurement plans with pitfall prevention',
      icon: <FileText className="w-6 h-6" />,
      requiredLevel: 'intermediate',
      features: [
        'Indicator selection',
        'Real-time pitfall warnings',
        'Portfolio balance analysis',
        'Measurement burden assessment'
      ],
      estimatedTime: '30-45 minutes'
    },
    {
      id: 'guidance',
      title: 'AI Guidance',
      description: 'Receive personalized measurement guidance',
      icon: <MessageCircle className="w-6 h-6" />,
      requiredLevel: 'intermediate',
      features: [
        'Conversational recommendations',
        'Context-aware suggestions',
        'Alternative indicator proposals',
        'Methodology coaching'
      ],
      estimatedTime: '10-20 minutes'
    },
    {
      id: 'advanced',
      title: 'Advanced Features',
      description: 'Full platform capabilities and customization',
      icon: <Star className="w-6 h-6" />,
      requiredLevel: 'advanced',
      features: [
        'Custom indicator development',
        'Advanced analytics',
        'Cross-program insights',
        'Admin dashboard access'
      ],
      estimatedTime: '20-40 minutes'
    },
    {
      id: 'implementation',
      title: 'Implementation',
      description: 'Deploy measurement systems and track progress',
      icon: <BarChart3 className="w-6 h-6" />,
      requiredLevel: 'advanced',
      features: [
        'Data collection setup',
        'Progress monitoring',
        'Report generation',
        'Continuous improvement'
      ],
      estimatedTime: 'Ongoing'
    }
  ];

  // Determine if phase is accessible
  const isPhaseAccessible = (phase: WorkflowPhase): boolean => {
    switch (phase.requiredLevel) {
      case 'basic':
        return foundationStatus.allowsBasicAccess;
      case 'intermediate':
        return foundationStatus.allowsIntermediateAccess;
      case 'advanced':
        return foundationStatus.allowsAdvancedAccess;
      default:
        return false;
    }
  };

  // Get phase status
  const getPhaseStatus = (phase: WorkflowPhase): 'locked' | 'available' | 'current' | 'completed' => {
    if (!isPhaseAccessible(phase)) return 'locked';
    if (currentPhase === phase.id) return 'current';
    
    // Simple completion logic - you'd implement based on actual progress
    if (phase.id === 'foundation' && foundationStatus.hasTheoryOfChange) return 'completed';
    
    return 'available';
  };

  // Get styling for phase status
  const getPhaseStyle = (status: string) => {
    switch (status) {
      case 'locked':
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-400',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-400'
        };
      case 'available':
        return {
          bgColor: 'bg-white',
          borderColor: 'border-blue-200',
          textColor: 'text-gray-900',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
      case 'current':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          textColor: 'text-gray-900',
          iconBg: 'bg-blue-200',
          iconColor: 'text-blue-700'
        };
      case 'completed':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-gray-900',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600'
        };
      default:
        return {
          bgColor: 'bg-white',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-900',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600'
        };
    }
  };

  // Handle phase selection
  const handlePhaseClick = (phase: WorkflowPhase) => {
    const status = getPhaseStatus(phase);
    
    if (status === 'locked') {
      // Show why it's locked
      setExpandedPhase(expandedPhase === phase.id ? null : phase.id);
      return;
    }
    
    onPhaseSelect(phase.id);
  };

  // Get next available phase
  const getNextPhase = (): WorkflowPhase | null => {
    return workflowPhases.find(phase => getPhaseStatus(phase) === 'available') || null;
  };

  const nextPhase = getNextPhase();

  return (
    <div className="space-y-6">
      {/* Progress summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Foundation-First Workflow
          </h2>
          <div className="flex items-center space-x-2">
            {foundationStatus.allowsAdvancedAccess ? (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Full Access
              </span>
            ) : foundationStatus.allowsIntermediateAccess ? (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Intermediate Access
              </span>
            ) : foundationStatus.allowsBasicAccess ? (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                Basic Access
              </span>
            ) : (
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                Foundation Required
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-600 mb-4">
          Complete your foundation to unlock measurement features. This prevents the #1 pitfall: 
          jumping to metrics without context.
        </p>

        {/* Foundation status summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className={`p-3 rounded-lg ${foundationStatus.hasTheoryOfChange ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center">
              {foundationStatus.hasTheoryOfChange ? (
                <Check className="w-4 h-4 text-green-600 mr-2" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
              )}
              <span className={`text-sm font-medium ${foundationStatus.hasTheoryOfChange ? 'text-green-800' : 'text-red-800'}`}>
                Theory of Change
              </span>
            </div>
          </div>

          <div className={`p-3 rounded-lg ${foundationStatus.hasDecisionMapping ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center">
              {foundationStatus.hasDecisionMapping ? (
                <Check className="w-4 h-4 text-green-600 mr-2" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
              )}
              <span className={`text-sm font-medium ${foundationStatus.hasDecisionMapping ? 'text-green-800' : 'text-red-800'}`}>
                Decision Mapping
              </span>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <Info className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">
                {foundationStatus.decisionCount} Decisions Mapped
              </span>
            </div>
          </div>
        </div>

        {/* Next step recommendation */}
        {nextPhase && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex items-center">
              <Info className="w-5 h-5 text-blue-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Recommended Next Step</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Continue to <strong>{nextPhase.title}</strong> - {nextPhase.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Phase cards */}
      <div className="grid gap-4">
        {workflowPhases.map((phase, index) => {
          const status = getPhaseStatus(phase);
          const style = getPhaseStyle(status);
          const isExpanded = expandedPhase === phase.id;

          return (
            <div key={phase.id} className="space-y-0">
              <div
                onClick={() => handlePhaseClick(phase)}
                className={`${style.bgColor} ${style.borderColor} border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    {/* Phase number and icon */}
                    <div className="flex items-center mr-4">
                      <div className={`w-8 h-8 rounded-full ${style.iconBg} flex items-center justify-center mr-3`}>
                        {status === 'completed' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : status === 'locked' ? (
                          <Lock className="w-4 h-4 text-gray-400" />
                        ) : (
                          <span className={`text-sm font-bold ${style.iconColor}`}>
                            {index + 1}
                          </span>
                        )}
                      </div>
                      
                      <div className={`${style.iconColor}`}>
                        {phase.icon}
                      </div>
                    </div>

                    {/* Phase content */}
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className={`text-lg font-medium ${style.textColor}`}>
                          {phase.title}
                        </h3>
                        
                        {phase.estimatedTime && (
                          <span className="ml-3 text-sm text-gray-500">
                            {phase.estimatedTime}
                          </span>
                        )}

                        {status === 'current' && (
                          <span className="ml-3 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            Current
                          </span>
                        )}
                      </div>
                      
                      <p className={`text-sm mt-1 ${status === 'locked' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {phase.description}
                      </p>
                    </div>
                  </div>

                  {/* Access indicator */}
                  <div className="flex items-center ml-4">
                    {status === 'completed' && (
                      <div className="bg-green-100 p-2 rounded-full">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                    
                    {status === 'available' && (
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Unlock className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    
                    {status === 'current' && (
                      <div className="bg-blue-200 p-2 rounded-full">
                        <ArrowRight className="w-4 h-4 text-blue-700" />
                      </div>
                    )}
                    
                    {status === 'locked' && (
                      <div className="bg-gray-100 p-2 rounded-full">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Features preview */}
                {!isExpanded && phase.features.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {phase.features.slice(0, 3).map((feature, featureIndex) => (
                      <span
                        key={featureIndex}
                        className={`text-xs px-2 py-1 rounded ${
                          status === 'locked' ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {feature}
                      </span>
                    ))}
                    {phase.features.length > 3 && (
                      <span className={`text-xs px-2 py-1 rounded ${status === 'locked' ? 'text-gray-400' : 'text-gray-600'}`}>
                        +{phase.features.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="bg-gray-50 border border-gray-200 border-t-0 rounded-b-lg p-4">
                  {status === 'locked' && (
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded">
                      <div className="flex items-center mb-2">
                        <Lock className="w-4 h-4 text-orange-600 mr-2" />
                        <h4 className="text-sm font-medium text-orange-800">
                          Foundation Required
                        </h4>
                      </div>
                      
                      {foundationStatus.blockingReasons.length > 0 && (
                        <ul className="text-sm text-orange-700 space-y-1">
                          {foundationStatus.blockingReasons.map((reason, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Available Features:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {phase.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center text-sm text-gray-700">
                        <Check className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhaseGatedWorkflow;