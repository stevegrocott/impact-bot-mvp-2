import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';
import { apiClient } from '../../shared/services/apiClient';
import { PathwaySelection } from './PathwaySelection';
import { GuidedConversation } from './GuidedConversation';
import { DocumentUpload } from './DocumentUpload';
import { ReadinessOverview } from './ReadinessOverview';
import { TheoryOfChangeReview } from './TheoryOfChangeReview';

export interface TheoryOfChangeStructure {
  targetPopulation: string;
  problemDefinition: string;
  activities: string[];
  outputs: string[];
  shortTermOutcomes: string[];
  longTermOutcomes: string[];
  impacts: string[];
  assumptions: string[];
  externalFactors: string[];
  interventionType: string;
  sector: string;
  geographicScope: string;
}

export interface FoundationReadiness {
  completenessScore: number;
  readinessLevel: 'insufficient' | 'basic' | 'good' | 'excellent';
  missingElements: string[];
  strengthAreas: string[];
  recommendations: string[];
  allowsBasicAccess: boolean;
  allowsIntermediateAccess: boolean;
  allowsAdvancedAccess: boolean;
}

type AssessmentView = 'overview' | 'pathway' | 'guided' | 'upload' | 'review';

export const FoundationAssessment: React.FC = () => {
  const { organization } = useAuth();
  const [currentView, setCurrentView] = useState<AssessmentView>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for theory of change and readiness
  const [existingTheory, setExistingTheory] = useState<TheoryOfChangeStructure | null>(null);
  const [foundationReadiness, setFoundationReadiness] = useState<FoundationReadiness | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  useEffect(() => {
    if (organization?.id) {
      loadFoundationData();
    }
  }, [organization?.id]);

  const loadFoundationData = async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Load existing theory of change
      const theoryResponse = await apiClient.getTheoryOfChange(organization.id);
      if (theoryResponse.success && theoryResponse.data) {
        setExistingTheory(theoryResponse.data);
      }
      
      // Load foundation readiness
      const readinessResponse = await apiClient.getFoundationReadiness(organization.id);
      if (readinessResponse.success && readinessResponse.data) {
        setFoundationReadiness(readinessResponse.data);
      }
      
      // Determine initial view based on existing data
      if (!theoryResponse.data) {
        setCurrentView('pathway');
      } else if (readinessResponse.data?.readinessLevel === 'insufficient') {
        setCurrentView('review');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load foundation data');
    } finally {
      setLoading(false);
    }
  };

  const handlePathwaySelected = (pathway: 'upload' | 'guided' | 'hybrid') => {
    if (pathway === 'upload') {
      setCurrentView('upload');
    } else if (pathway === 'guided' || pathway === 'hybrid') {
      setCurrentView('guided');
    }
  };

  const handleTheoryCompleted = async () => {
    // Reload foundation data after completion
    await loadFoundationData();
    setCurrentView('review');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadFoundationData}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Try again
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'overview':
        return (
          <ReadinessOverview
            readiness={foundationReadiness}
            theory={existingTheory}
            onStartAssessment={() => setCurrentView('pathway')}
            onReviewTheory={() => setCurrentView('review')}
          />
        );
        
      case 'pathway':
        return (
          <PathwaySelection
            hasExistingTheory={!!existingTheory}
            onPathwaySelected={handlePathwaySelected}
            onBack={() => setCurrentView('overview')}
          />
        );
        
      case 'guided':
        return (
          <GuidedConversation
            organizationId={organization?.id || ''}
            existingTheory={existingTheory}
            conversationId={conversationId}
            onConversationStarted={setConversationId}
            onComplete={handleTheoryCompleted}
            onBack={() => setCurrentView('pathway')}
          />
        );
        
      case 'upload':
        return (
          <DocumentUpload
            organizationId={organization?.id || ''}
            onComplete={handleTheoryCompleted}
            onSwitchToGuided={() => setCurrentView('guided')}
            onBack={() => setCurrentView('pathway')}
          />
        );
        
      case 'review':
        return (
          <TheoryOfChangeReview
            theory={existingTheory}
            readiness={foundationReadiness}
            onEdit={() => setCurrentView('guided')}
            onBack={() => setCurrentView('overview')}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Foundation Assessment</h1>
        <p className="text-gray-600 mt-2">
          Build a strong foundation for effective impact measurement
        </p>
      </div>

      {/* Progress Indicator */}
      {foundationReadiness && (
        <div className="mb-6">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                foundationReadiness.completenessScore >= 90 ? 'bg-green-500' :
                foundationReadiness.completenessScore >= 70 ? 'bg-blue-500' :
                foundationReadiness.completenessScore >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${foundationReadiness.completenessScore}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Foundation Completeness: {foundationReadiness.completenessScore}%
          </p>
        </div>
      )}

      {renderContent()}
    </div>
  );
};