/**
 * Foundation Dashboard
 * Central hub for foundation-first measurement design
 * Shows progress, provides access to theory of change, and displays readiness
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight,
  Target,
  Users,
  FileText,
  MessageCircle,
  Star,
  BarChart3,
  Lightbulb,
  TrendingUp
} from 'lucide-react';
import PhaseGatedWorkflow from '../components/PhaseGatedWorkflow';
import FoundationReadinessCard from '../modules/onboarding/components/FoundationReadinessCard';

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

// Component
export const FoundationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [foundationStatus, setFoundationStatus] = useState<PhaseGateStatus | null>(null);
  const [foundationReadiness, setFoundationReadiness] = useState<FoundationReadiness | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('foundation');

  // Load foundation status
  useEffect(() => {
    const loadFoundationStatus = async () => {
      setIsLoading(true);
      try {
        // Load foundation status
        const statusResponse = await fetch('/api/v1/foundation/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (!statusResponse.ok) {
          throw new Error('Failed to load foundation status');
        }

        const statusData = await statusResponse.json();
        setFoundationStatus(statusData.data);

        // Load readiness assessment if foundation exists
        if (statusData.data.hasTheoryOfChange) {
          const readinessResponse = await fetch('/api/v1/foundation/assess-readiness', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });

          if (readinessResponse.ok) {
            const readinessData = await readinessResponse.json();
            setFoundationReadiness(readinessData.data);
          }
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load foundation data');
      } finally {
        setIsLoading(false);
      }
    };

    loadFoundationStatus();
  }, []);

  // Handle phase selection
  const handlePhaseSelect = (phaseId: string) => {
    setCurrentPhase(phaseId);
    
    // Navigate to appropriate page based on phase
    switch (phaseId) {
      case 'foundation':
        if (!foundationStatus?.hasTheoryOfChange) {
          navigate('/foundation/theory-of-change');
        }
        break;
      case 'discovery':
        navigate('/indicators');
        break;
      case 'planning':
        navigate('/indicators/planning');
        break;
      case 'guidance':
        navigate('/chat');
        break;
      case 'advanced':
        navigate('/admin');
        break;
      case 'implementation':
        navigate('/reports');
        break;
      default:
        break;
    }
  };

  // Quick action cards
  const getQuickActions = () => {
    if (!foundationStatus) return [];

    const actions = [];

    if (!foundationStatus.hasTheoryOfChange) {
      actions.push({
        title: 'Create Theory of Change',
        description: 'Start with foundation-first measurement design',
        icon: <Shield className="w-6 h-6" />,
        color: 'bg-blue-600',
        action: () => navigate('/foundation/theory-of-change')
      });
    }

    if (!foundationStatus.hasDecisionMapping) {
      actions.push({
        title: 'Map Your Decisions',
        description: 'Define what decisions your data will inform',
        icon: <Target className="w-6 h-6" />,
        color: 'bg-purple-600',
        action: () => navigate('/foundation/decisions')
      });
    }

    if (foundationStatus.allowsBasicAccess) {
      actions.push({
        title: 'Explore Indicators',
        description: 'Discover relevant IRIS+ indicators',
        icon: <BarChart3 className="w-6 h-6" />,
        color: 'bg-green-600',
        action: () => navigate('/indicators')
      });
    }

    if (foundationStatus.allowsIntermediateAccess) {
      actions.push({
        title: 'Get AI Guidance',
        description: 'Receive personalized measurement coaching',
        icon: <MessageCircle className="w-6 h-6" />,
        color: 'bg-indigo-600',
        action: () => navigate('/chat')
      });
    }

    return actions.slice(0, 4); // Limit to 4 actions
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Foundation</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const quickActions = getQuickActions();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Foundation Dashboard
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Complete your measurement foundation to unlock advanced features. 
          This prevents expensive measurement failures through foundation-first design.
        </p>
      </div>

      {/* Foundation status overview */}
      {foundationStatus && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Foundation Status
            </h2>
            
            {foundationReadiness && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Completeness:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {foundationReadiness.completenessScore}%
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Theory of Change Status */}
            <div className={`p-4 rounded-lg border ${
              foundationStatus.hasTheoryOfChange 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  {foundationStatus.hasTheoryOfChange ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  )}
                  <h3 className="font-medium text-gray-900">Theory of Change</h3>
                </div>
              </div>
              
              <p className={`text-sm ${
                foundationStatus.hasTheoryOfChange ? 'text-green-700' : 'text-red-700'
              }`}>
                {foundationStatus.hasTheoryOfChange 
                  ? 'Complete and validated'
                  : 'Required for measurement features'
                }
              </p>
              
              {!foundationStatus.hasTheoryOfChange && (
                <button
                  onClick={() => navigate('/foundation/theory-of-change')}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Create Theory of Change →
                </button>
              )}
            </div>

            {/* Decision Mapping Status */}
            <div className={`p-4 rounded-lg border ${
              foundationStatus.hasDecisionMapping 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  {foundationStatus.hasDecisionMapping ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <Target className="w-5 h-5 text-yellow-600 mr-2" />
                  )}
                  <h3 className="font-medium text-gray-900">Decision Mapping</h3>
                </div>
              </div>
              
              <p className={`text-sm ${
                foundationStatus.hasDecisionMapping ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {foundationStatus.decisionCount} decisions mapped
              </p>
              
              <button
                onClick={() => navigate('/foundation/decisions')}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {foundationStatus.hasDecisionMapping ? 'Review decisions' : 'Map decisions'} →
              </button>
            </div>

            {/* Access Level */}
            <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-gray-900">Access Level</h3>
                </div>
              </div>
              
              <p className="text-sm text-blue-700 mb-2">
                {foundationStatus.allowsAdvancedAccess ? 'Advanced Access' :
                 foundationStatus.allowsIntermediateAccess ? 'Intermediate Access' :
                 foundationStatus.allowsBasicAccess ? 'Basic Access' : 'Foundation Required'}
              </p>
              
              <div className="text-xs text-blue-600">
                {foundationStatus.allowsAdvancedAccess ? 'All features unlocked' :
                 foundationStatus.allowsIntermediateAccess ? 'Most features available' :
                 foundationStatus.allowsBasicAccess ? 'Browse and explore only' : 'Complete foundation first'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Recommended Next Steps
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white mb-3`}>
                  {action.icon}
                </div>
                
                <h3 className="font-medium text-gray-900 mb-2">
                  {action.title}
                </h3>
                
                <p className="text-sm text-gray-600">
                  {action.description}
                </p>
                
                <div className="flex items-center mt-3 text-blue-600">
                  <span className="text-sm font-medium">Get started</span>
                  <ArrowRight className="ml-1 w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Phase-gated workflow */}
        <div>
          {foundationStatus && (
            <PhaseGatedWorkflow
              foundationStatus={foundationStatus}
              currentPhase={currentPhase}
              onPhaseSelect={handlePhaseSelect}
            />
          )}
        </div>

        {/* Foundation readiness assessment */}
        <div>
          {foundationReadiness ? (
            <FoundationReadinessCard readiness={foundationReadiness} />
          ) : foundationStatus?.hasTheoryOfChange ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Assessing foundation readiness...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Foundation Assessment
                </h3>
                <p className="text-gray-600 mb-4">
                  Complete your theory of change to receive a foundation readiness assessment.
                </p>
                <button
                  onClick={() => navigate('/foundation/theory-of-change')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  Start Foundation Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pitfall prevention info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <Lightbulb className="w-6 h-6 text-blue-600 mt-1 mr-4 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Why Foundation First?
            </h3>
            <p className="text-blue-800 mb-4">
              Organizations that jump straight to indicator selection often fall into expensive measurement pitfalls:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-blue-700">Measuring activities instead of impact</span>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-blue-700">Over-engineering measurement systems</span>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-blue-700">Using proxy metrics instead of direct measures</span>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-blue-700">Building systems that don't inform decisions</span>
              </div>
            </div>
            <p className="text-blue-800 mt-4 font-medium">
              Our foundation-first approach prevents these costly mistakes through technical enforcement of proven methodology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoundationDashboard;