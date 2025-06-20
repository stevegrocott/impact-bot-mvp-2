/**
 * Foundation Dashboard
 * Central hub for foundation-first measurement design
 * Shows progress, provides access to theory of change, and displays readiness
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  ArrowRight,
  Lightbulb,
  Users,
  Target,
  Zap
} from 'lucide-react';
import { apiClient } from '../shared/services/apiClient';
import FoundationReadinessWidget from '../components/FoundationReadinessWidget';
import CollaborativeFoundationBuilder from '../components/CollaborativeFoundationBuilder';
import { logger } from '../utils/logger';

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

  // Load foundation status
  useEffect(() => {
    const loadFoundationStatus = async () => {
      setIsLoading(true);
      try {
        // Load foundation status
        const statusResponse = await apiClient.getFoundationStatus();
        
        if (statusResponse.success) {
          setFoundationStatus(statusResponse.data);

          // Load readiness assessment if foundation exists
          if (statusResponse?.data?.hasTheoryOfChange) {
            try {
              const readinessResponse = await apiClient.request({
                method: 'GET',
                url: '/theory-of-change/foundation-readiness'
              });

              if (readinessResponse.success) {
                setFoundationReadiness(readinessResponse.data as FoundationReadiness);
              }
            } catch (readinessErr) {
              logger.warn('Could not load foundation readiness:', readinessErr);
            }
          }
        } else {
          throw new Error(statusResponse.message || 'Failed to load foundation status');
        }

      } catch (err) {
        logger.error('Foundation status error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load foundation data');
      } finally {
        setIsLoading(false);
      }
    };

    loadFoundationStatus();
  }, []);



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


  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          👋 Welcome back, Demo User!
        </h1>
        <p className="text-gray-600">Continue building your impact measurement foundation</p>
      </div>

      {/* Enhanced Foundation Dashboard - Week 3 Implementation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Foundation Readiness - Enhanced Widget */}
        <div className="lg:col-span-2">
          <FoundationReadinessWidget
            onImprove={(action) => {
              // Navigate to relevant action
              if (action.includes('Theory of Change')) {
                navigate('/foundation/theory-of-change');
              } else if (action.includes('Decision')) {
                navigate('/foundation/decisions');
              } else if (action.includes('Indicator')) {
                navigate('/indicators');
              }
            }}
            showDetailedBreakdown={true}
          />
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          {/* Quick Start Options */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-600" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              {!foundationStatus?.hasTheoryOfChange ? (
                <button
                  onClick={() => navigate('/foundation/theory-of-change')}
                  className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🎯</span>
                    <span className="font-medium text-blue-900 text-sm">Create Theory of Change</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={() => navigate('/foundation/theory-of-change')}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🎯</span>
                    <span className="font-medium text-gray-900 text-sm">Review Theory of Change</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              
              <button
                onClick={() => navigate('/foundation/decisions')}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📋</span>
                  <span className="font-medium text-gray-900 text-sm">Decision Mapping</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => navigate('/indicators')}
                disabled={!foundationStatus?.allowsBasicAccess}
                className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between group ${
                  foundationStatus?.allowsBasicAccess 
                    ? 'bg-gray-50 hover:bg-gray-100 border-gray-200' 
                    : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🔍</span>
                  <span className={`font-medium text-sm ${
                    foundationStatus?.allowsBasicAccess ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    Browse Indicators
                  </span>
                </div>
                <ArrowRight className={`w-4 h-4 ${
                  foundationStatus?.allowsBasicAccess ? 'text-gray-600 group-hover:translate-x-1' : 'text-gray-400'
                } transition-transform`} />
              </button>
              
              <button
                onClick={() => navigate('/chat')}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">💬</span>
                  <span className="font-medium text-gray-900 text-sm">AI Guide Chat</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => navigate('/benchmarking')}
                disabled={!foundationStatus?.allowsBasicAccess}
                className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between group ${
                  foundationStatus?.allowsBasicAccess 
                    ? 'bg-gray-50 hover:bg-gray-100 border-gray-200' 
                    : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📊</span>
                  <span className={`font-medium text-sm ${
                    foundationStatus?.allowsBasicAccess ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    Peer Benchmarking
                  </span>
                </div>
                <ArrowRight className={`w-4 h-4 ${
                  foundationStatus?.allowsBasicAccess ? 'text-gray-600 group-hover:translate-x-1' : 'text-gray-400'
                } transition-transform`} />
              </button>
              
              <button
                onClick={() => navigate('/knowledge')}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📚</span>
                  <span className="font-medium text-gray-900 text-sm">Knowledge Hub</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Foundation Level Progress */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-green-600" />
              Progress Tracker
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Foundation Phase</span>
                <span className="text-sm font-medium text-gray-900">
                  {foundationReadiness?.completenessScore || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${foundationReadiness?.completenessScore || 0}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                {foundationReadiness?.readinessLevel === 'insufficient' ? 
                  'Building foundation fundamentals' :
                  foundationReadiness?.readinessLevel === 'basic' ?
                  'Foundation established, expanding capabilities' :
                  'Advanced foundation ready for comprehensive measurement'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collaborative Foundation Building - Week 3 Feature */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-3 text-blue-600" />
            Team Collaboration
          </h2>
          <p className="text-sm text-gray-600">Work together to build your foundation</p>
        </div>
        
        <CollaborativeFoundationBuilder
          mode="facilitator"
          onCreateSession={async () => {
            // TODO: Add collaboration session endpoints to apiClient
            // For now, just log the intent
            try {
              logger.info('Creating collaboration session (simulated)');
              // const result = await apiClient.createCollaborationSession({
              //   name: 'Foundation Building Session',
              //   type: 'foundation_building'
              // });
              // Handle successful session creation
              // Should update state instead of reload
            } catch (error) {
              logger.error('Failed to create collaboration session:', error);
            }
          }}
        />
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