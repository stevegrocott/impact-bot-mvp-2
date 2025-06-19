import React, { useState, useEffect } from 'react';
import { Upload, MessageCircle, GitMerge, ArrowLeft, Info } from 'lucide-react';
import { apiClient } from '../../shared/services/apiClient';

interface PathwaySelectionProps {
  hasExistingTheory: boolean;
  onPathwaySelected: (pathway: 'upload' | 'guided' | 'hybrid') => void;
  onBack: () => void;
}

interface PathwayRecommendation {
  recommendedPathway: 'upload' | 'guided' | 'hybrid';
  message: string;
  options: string[];
}

export const PathwaySelection: React.FC<PathwaySelectionProps> = ({
  hasExistingTheory,
  onPathwaySelected,
  onBack,
}) => {
  const [recommendation, setRecommendation] = useState<PathwayRecommendation | null>(null);
  const [selectedPathway, setSelectedPathway] = useState<'upload' | 'guided' | 'hybrid' | null>(null);
  const [hasDocuments, setHasDocuments] = useState<boolean | null>(null);
  const [hasPartialTheory, setHasPartialTheory] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasDocuments !== null && hasPartialTheory !== null) {
      getPathwayRecommendation();
    }
  }, [hasDocuments, hasPartialTheory]);

  const getPathwayRecommendation = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getTheoryOfChangePathwayAssessment(
        hasDocuments || false,
        hasPartialTheory || false
      );
      
      if (response.success) {
        setRecommendation(response.data);
        setSelectedPathway(response.data.recommendedPathway);
      }
    } catch (error) {
      console.error('Error getting pathway recommendation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedPathway) {
      onPathwaySelected(selectedPathway);
    }
  };

  if (hasDocuments === null || hasPartialTheory === null) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Overview
        </button>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Let's Find the Right Approach for You
        </h2>
        
        <p className="text-gray-600 mb-8">
          To recommend the best pathway for creating your theory of change, we need to understand your starting point.
        </p>

        {/* Documents Question */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Do you have existing documents about your work?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            This could include strategy documents, logic models, program descriptions, or funding proposals.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => setHasDocuments(true)}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                hasDocuments === true 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Upload className="w-5 h-5 mr-3 text-blue-600" />
                <div>
                  <div className="font-medium">Yes, I have documents</div>
                  <div className="text-sm text-gray-600">
                    I can upload PDFs, Word docs, or other files
                  </div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setHasDocuments(false)}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                hasDocuments === false 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-3 text-green-600" />
                <div>
                  <div className="font-medium">No, I don't have documents</div>
                  <div className="text-sm text-gray-600">
                    I'd prefer to work through this conversationally
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Partial Theory Question */}
        {hasDocuments !== null && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Do you have some thinking about your theory of change already?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Even informal thoughts about your target population, activities, or desired outcomes.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => setHasPartialTheory(true)}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  hasPartialTheory === true 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <GitMerge className="w-5 h-5 mr-3 text-purple-600" />
                  <div>
                    <div className="font-medium">Yes, I have some ideas</div>
                    <div className="text-sm text-gray-600">
                      I'd like to build on what I already know
                    </div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setHasPartialTheory(false)}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  hasPartialTheory === false 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-3 text-green-600" />
                  <div>
                    <div className="font-medium">No, I'm starting fresh</div>
                    <div className="text-sm text-gray-600">
                      I'd like guidance through the whole process
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Overview
      </button>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : recommendation ? (
        <>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recommended Approach
          </h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-blue-800">{recommendation.message}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {/* Upload Pathway */}
            <button
              onClick={() => setSelectedPathway('upload')}
              className={`w-full p-6 border-2 rounded-lg text-left transition-all ${
                selectedPathway === 'upload'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <Upload className="w-6 h-6 mr-4 text-blue-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Upload Documents
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Upload your existing strategy documents, logic models, or program descriptions. 
                    Our AI will extract your theory of change elements and suggest improvements.
                  </p>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Best for:</span> Organizations with existing documentation
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Time needed:</span> 10-15 minutes
                  </div>
                </div>
              </div>
            </button>

            {/* Guided Conversation */}
            <button
              onClick={() => setSelectedPathway('guided')}
              className={`w-full p-6 border-2 rounded-lg text-left transition-all ${
                selectedPathway === 'guided'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <MessageCircle className="w-6 h-6 mr-4 text-green-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Guided Conversation
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Work through a structured conversation that guides you step-by-step through 
                    creating your theory of change. Perfect for building from scratch.
                  </p>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Best for:</span> Starting fresh or wanting structured guidance
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Time needed:</span> 20-30 minutes
                  </div>
                </div>
              </div>
            </button>

            {/* Hybrid Approach */}
            <button
              onClick={() => setSelectedPathway('hybrid')}
              className={`w-full p-6 border-2 rounded-lg text-left transition-all ${
                selectedPathway === 'hybrid'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <GitMerge className="w-6 h-6 mr-4 text-purple-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Hybrid Approach
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Combine document upload with guided conversation. Upload what you have, 
                    then work through gaps and improvements conversationally.
                  </p>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Best for:</span> Partial documentation + wanting to improve
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Time needed:</span> 25-40 minutes
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setHasDocuments(null);
                setHasPartialTheory(null);
                setRecommendation(null);
                setSelectedPathway(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Start Over
            </button>
            <button
              onClick={handleContinue}
              disabled={!selectedPathway}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue with {selectedPathway ? selectedPathway.charAt(0).toUpperCase() + selectedPathway.slice(1) : 'Selected'} Approach
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};