/**
 * Theory of Change Capture Component
 * Foundation-first measurement design - prevents "jumping to metrics without context"
 * Supports flexible pathways: upload OR guided creation OR hybrid
 */

import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  MessageCircle, 
  FileText, 
  AlertTriangle, 
  ArrowRight,
  Info,
  Lightbulb,
  Target,
  Users,
  Activity,
  TrendingUp,
  Layers
} from 'lucide-react';

// Component imports
import { GuidedStepInput } from './GuidedStepInput';
import { TheoryOfChangePreview } from './TheoryOfChangePreview';
import { FoundationReadinessCard } from './FoundationReadinessCard';
import { apiClient } from '../../../shared/services/apiClient';

// Types
interface TheoryOfChangeStructure {
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

interface PathwayOption {
  id: 'upload' | 'guided' | 'hybrid';
  title: string;
  description: string;
  icon: React.ReactNode;
  timeEstimate: string;
  suitableFor: string[];
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
export const TheoryOfChangeCapture: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'pathway' | 'upload' | 'guided' | 'review'>('pathway');
  const [selectedPathway, setSelectedPathway] = useState<'upload' | 'guided' | 'hybrid' | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extractedContent, setExtractedContent] = useState<Partial<TheoryOfChangeStructure> | null>(null);
  const [currentGuidedStep, setCurrentGuidedStep] = useState(0);
  const [theoryData, setTheoryData] = useState<Partial<TheoryOfChangeStructure>>({});
  const [foundationReadiness, setFoundationReadiness] = useState<FoundationReadiness | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local foundation readiness calculation
  const calculateLocalFoundationReadiness = (theory: Partial<TheoryOfChangeStructure>): FoundationReadiness => {
    const requiredFields = [
      'targetPopulation', 'problemDefinition', 'activities', 'outputs', 
      'shortTermOutcomes', 'longTermOutcomes', 'impacts'
    ];
    
    let completedFields = 0;
    const missingElements: string[] = [];
    const strengthAreas: string[] = [];
    
    requiredFields.forEach(field => {
      const value = theory[field as keyof TheoryOfChangeStructure];
      if (value) {
        if (typeof value === 'string' && value.trim().length > 0) {
          completedFields++;
          strengthAreas.push(field.replace(/([A-Z])/g, ' $1').toLowerCase());
        } else if (Array.isArray(value) && value.length > 0) {
          completedFields++;
          strengthAreas.push(field.replace(/([A-Z])/g, ' $1').toLowerCase());
        } else if (typeof value === 'object' && value !== null) {
          completedFields++;
          strengthAreas.push(field.replace(/([A-Z])/g, ' $1').toLowerCase());
        }
      } else {
        missingElements.push(field.replace(/([A-Z])/g, ' $1').toLowerCase());
      }
    });
    
    const completenessScore = Math.round((completedFields / requiredFields.length) * 100);
    
    let readinessLevel: 'insufficient' | 'basic' | 'good' | 'excellent';
    let recommendations: string[] = [];
    
    if (completenessScore < 30) {
      readinessLevel = 'insufficient';
      recommendations = [
        'Start with defining your target population',
        'Clearly articulate the problem you\'re addressing',
        'List your key activities and expected outputs'
      ];
    } else if (completenessScore < 60) {
      readinessLevel = 'basic';
      recommendations = [
        'Complete the outcomes section (short-term and long-term)',
        'Define your intended impacts',
        'Add assumptions and external factors'
      ];
    } else if (completenessScore < 85) {
      readinessLevel = 'good';
      recommendations = [
        'Refine your theory of change with more detail',
        'Consider stakeholder feedback',
        'Begin decision mapping for key strategic choices'
      ];
    } else {
      readinessLevel = 'excellent';
      recommendations = [
        'Your theory of change is comprehensive',
        'Ready to begin indicator selection',
        'Consider advanced measurement planning'
      ];
    }
    
    return {
      completenessScore,
      readinessLevel,
      missingElements,
      strengthAreas,
      recommendations,
      allowsBasicAccess: completenessScore >= 40,
      allowsIntermediateAccess: completenessScore >= 70,
      allowsAdvancedAccess: completenessScore >= 85
    };
  };

  // Pathway options
  const pathwayOptions: PathwayOption[] = [
    {
      id: 'upload',
      title: 'Upload Existing Documents',
      description: 'I have theory of change, strategy, or logic model documents',
      icon: <Upload className="w-6 h-6" />,
      timeEstimate: '5-10 minutes',
      suitableFor: ['Organizations with existing strategies', 'Completed logic models', 'Strategic plans']
    },
    {
      id: 'guided',
      title: 'Guided Creation',
      description: 'Help me create a theory of change from scratch',
      icon: <MessageCircle className="w-6 h-6" />,
      timeEstimate: '15-20 minutes',
      suitableFor: ['New programs', 'Strategy refresh', 'Want structured guidance']
    },
    {
      id: 'hybrid',
      title: 'Hybrid Approach',
      description: 'I have some pieces - let\'s combine upload with guided development',
      icon: <Layers className="w-6 h-6" />,
      timeEstimate: '10-15 minutes',
      suitableFor: ['Partial documentation', 'Need to fill gaps', 'Want to improve existing']
    }
  ];

  // Guided conversation steps
  const guidedSteps = [
    {
      title: 'Target Population',
      question: 'Who does your organization serve?',
      icon: <Users className="w-5 h-5" />,
      field: 'targetPopulation' as keyof TheoryOfChangeStructure,
      guidance: 'Be specific about demographics, geography, and key characteristics'
    },
    {
      title: 'Problem Definition',
      question: 'What specific problem are you addressing?',
      icon: <AlertTriangle className="w-5 h-5" />,
      field: 'problemDefinition' as keyof TheoryOfChangeStructure,
      guidance: 'Focus on the root cause, not just symptoms'
    },
    {
      title: 'Activities',
      question: 'What does your organization do? (Activities)',
      icon: <Activity className="w-5 h-5" />,
      field: 'activities' as keyof TheoryOfChangeStructure,
      guidance: 'List the specific actions, services, or interventions you provide'
    },
    {
      title: 'Outputs',
      question: 'What are the direct products of your work?',
      icon: <FileText className="w-5 h-5" />,
      field: 'outputs' as keyof TheoryOfChangeStructure,
      guidance: 'These are what you produce: reports, training sessions, services delivered'
    },
    {
      title: 'Short-term Outcomes',
      question: 'What changes happen first for your beneficiaries?',
      icon: <Target className="w-5 h-5" />,
      field: 'shortTermOutcomes' as keyof TheoryOfChangeStructure,
      guidance: 'Changes in knowledge, attitudes, skills, or behaviors (3-12 months)'
    },
    {
      title: 'Long-term Outcomes',
      question: 'What bigger changes follow from the short-term outcomes?',
      icon: <TrendingUp className="w-5 h-5" />,
      field: 'longTermOutcomes' as keyof TheoryOfChangeStructure,
      guidance: 'Sustained changes in conditions, status, or well-being (1-3 years)'
    }
  ];

  // Handle pathway selection
  const handlePathwaySelect = (pathway: 'upload' | 'guided' | 'hybrid') => {
    setSelectedPathway(pathway);
    setCurrentStep(pathway === 'upload' ? 'upload' : 'guided');
  };

  // Helper function to read file as base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        
        if (file.type === 'application/pdf') {
          // For PDF files, read as base64 and let backend handle extraction
          if (typeof result === 'string') {
            resolve(result);
          } else if (result instanceof ArrayBuffer) {
            // Convert ArrayBuffer to base64
            const bytes = new Uint8Array(result);
            const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
            const base64 = btoa(binary);
            resolve(base64);
          } else {
            reject(new Error('Unexpected file format'));
          }
        } else {
          // For text files, read as text
          if (typeof result === 'string') {
            resolve(result);
          } else {
            reject(new Error('Failed to read file as text'));
          }
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type === 'application/pdf') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const fileArray = Array.from(files);
      setUploadedFiles(fileArray);

      // Convert files to documents format expected by apiClient
      const documents = await Promise.all(
        fileArray.map(async (file) => {
          const content = await readFileAsBase64(file);
          return {
            filename: file.name,
            content,
            type: file.type
          };
        })
      );

      // Call API to parse documents using apiClient
      const result = await apiClient.uploadTheoryOfChangeDocuments('', documents);
      setExtractedContent(result.data.extractedContent);
      setTheoryData(result.data.extractedContent);
      
      // If gaps identified, suggest hybrid approach
      if (result.data.needsGuidedCompletion) {
        setSelectedPathway('hybrid');
        setCurrentGuidedStep(result.data.identifiedGaps.length > 0 ? 0 : guidedSteps.length);
      } else {
        setCurrentStep('review');
      }
      
    } catch (err) {
      console.warn('Theory of change parsing failed, using fallback demo:', err);
      
      // Show fallback demo data when API is unavailable
      const fallbackTheoryData = {
        targetPopulation: "Your target population (extracted from uploaded documents)",
        problemDefinition: "The problem your organization addresses (AI analysis would appear here)",
        activities: [
          "Key activities mentioned in your documents",
          "Additional activities identified by AI",
          "Strategic interventions from your materials"
        ],
        outputs: [
          "Direct outputs from your activities",
          "Deliverables and services provided", 
          "Measurable products of your work"
        ],
        shortTermOutcomes: [
          "Early changes in your beneficiaries",
          "Skills and knowledge improvements",
          "Behavior changes (6-12 months)"
        ],
        longTermOutcomes: [
          "Sustained improvements in conditions",
          "Systemic changes in beneficiary lives",
          "Long-term wellbeing improvements"
        ],
        impacts: [
          "Ultimate community-level changes",
          "Systemic transformation goals"
        ],
        assumptions: [
          "Key assumptions identified from your documents",
          "Critical success factors"
        ],
        externalFactors: [
          "External conditions affecting success",
          "Environmental factors beyond control"
        ],
        interventionType: "Type of intervention (from document analysis)",
        sector: "Sector (identified from materials)",
        geographicScope: "Geographic scope (extracted from documents)"
      };

      setExtractedContent(fallbackTheoryData);
      setTheoryData(fallbackTheoryData);
      setCurrentStep('review');
      
      setError(
        'AI document analysis is currently unavailable. Showing demo of what you would see with your extracted theory of change. ' +
        'In the full version, AI would analyze your specific documents and extract your actual theory elements.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle guided conversation progress
  const handleGuidedStepComplete = (stepData: any) => {
    const currentField = guidedSteps[currentGuidedStep].field;
    
    setTheoryData(prev => ({
      ...prev,
      [currentField]: stepData
    }));

    if (currentGuidedStep < guidedSteps.length - 1) {
      setCurrentGuidedStep(prev => prev + 1);
      // Progress is calculated inline based on currentGuidedStep
    } else {
      setCurrentStep('review');
    }
  };

  // Assess foundation readiness based on current theory data
  const assessFoundationReadiness = async () => {
    if (!theoryData || Object.keys(theoryData).length === 0) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Use the validate endpoint to assess the current theory
      const result = await apiClient.validateTheoryOfChange({ theory: theoryData });
      
      // Transform the validation result to match FoundationReadiness interface
      const readinessData: FoundationReadiness = {
        completenessScore: result.data.completenessScore || 0,
        readinessLevel: result.data.readinessLevel || 'insufficient',
        missingElements: result.data.gaps || [],
        strengthAreas: result.data.strengthAreas || [],
        recommendations: result.data.recommendations || [],
        allowsBasicAccess: result.data.isValid || false,
        allowsIntermediateAccess: (result.data.completenessScore || 0) >= 70,
        allowsAdvancedAccess: (result.data.completenessScore || 0) >= 85
      };
      
      setFoundationReadiness(readinessData);
      
    } catch (err) {
      console.warn('Foundation assessment failed, using local calculation:', err);
      
      // Fallback to local calculation
      const localAssessment = calculateLocalFoundationReadiness(theoryData);
      setFoundationReadiness(localAssessment);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save theory of change
  const handleSaveTheoryOfChange = async () => {
    setIsProcessing(true);
    
    try {
      await apiClient.updateTheoryOfChange('', {
        theoryOfChange: theoryData,
        pathway: selectedPathway,
        uploadedDocuments: uploadedFiles.map(f => f.name)
      });

      // Success - redirect to next step or dashboard
      window.location.href = '/foundation/readiness';
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save theory of change');
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-assess when theory data changes
  useEffect(() => {
    if (currentStep === 'review' && theoryData && Object.keys(theoryData).length > 0) {
      assessFoundationReadiness();
    }
  }, [currentStep, theoryData]);

  // Render pathway selection
  if (currentStep === 'pathway') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Foundation First: Theory of Change
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Before selecting indicators, let's establish your impact logic. This prevents the #1 
            measurement pitfall: jumping to metrics without context.
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
          <div className="flex">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Why Foundation First?</h3>
              <p className="text-sm text-blue-700 mt-1">
                Organizations that start with indicators often end up measuring activities instead of impact, 
                creating expensive measurement systems that don't inform decisions.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pathwayOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => handlePathwaySelect(option.id)}
              className="cursor-pointer border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                {option.icon}
                <span className="text-sm font-medium text-blue-600">{option.timeEstimate}</span>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {option.title}
              </h3>
              
              <p className="text-gray-600 mb-4">
                {option.description}
              </p>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Suitable for:</p>
                {option.suitableFor.map((item, index) => (
                  <p key={index} className="text-sm text-gray-600">• {item}</p>
                ))}
              </div>
              
              <div className="mt-4 flex items-center text-blue-600">
                <span className="text-sm font-medium">Choose this pathway</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render upload interface
  if (currentStep === 'upload') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Upload Your Theory of Change
          </h1>
          <p className="text-gray-600">
            Upload strategy documents, logic models, or theory of change materials. 
            Our AI will extract and structure the content.
          </p>
        </div>

        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="text-lg font-medium text-gray-900">
              Click to upload files
            </span>
            <p className="text-gray-500 mt-2">
              PDF, Word, PowerPoint, or image files
            </p>
          </label>
          
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Uploaded Files:</h3>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">{file.name}</span>
                  <span className="text-sm text-gray-500 ml-auto">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600">Processing documents...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render guided conversation
  if (currentStep === 'guided') {
    const currentStepData = guidedSteps[currentGuidedStep];
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Guided Theory of Change Creation
            </h1>
            <span className="text-sm text-gray-500">
              Step {currentGuidedStep + 1} of {guidedSteps.length}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentGuidedStep / guidedSteps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            {currentStepData.icon}
            <h2 className="text-xl font-semibold text-gray-900 ml-3">
              {currentStepData.title}
            </h2>
          </div>
          
          <p className="text-lg text-gray-700 mb-4">
            {currentStepData.question}
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
            <div className="flex">
              <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5 mr-2" />
              <p className="text-sm text-blue-700">{currentStepData.guidance}</p>
            </div>
          </div>
          
          <GuidedStepInput
            stepData={currentStepData}
            onComplete={handleGuidedStepComplete}
            existingData={theoryData[currentStepData.field]}
          />
        </div>
      </div>
    );
  }

  // Render review and assessment
  if (currentStep === 'review') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Theory of Change Review
          </h1>
          <p className="text-gray-600">
            Review your theory of change and see your foundation readiness assessment.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Theory of Change Content */}
          <div className="space-y-6">
            <TheoryOfChangePreview theoryData={theoryData} />
          </div>

          {/* Foundation Readiness Assessment */}
          <div className="space-y-6">
            {foundationReadiness ? (
              <FoundationReadinessCard readiness={foundationReadiness} />
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Assessing foundation readiness...</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSaveTheoryOfChange}
            disabled={isProcessing}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Saving...' : 'Save Theory of Change'}
          </button>
        </div>

        {error && (
          <div className={`mt-6 border rounded-md p-4 ${
            error.includes('demo') || error.includes('unavailable') 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start">
              {error.includes('demo') || error.includes('unavailable') ? (
                <Info className="h-5 w-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
              )}
              <div className={error.includes('demo') || error.includes('unavailable') ? 'text-blue-700' : 'text-red-700'}>
                {error.includes('demo') || error.includes('unavailable') ? (
                  <div>
                    <p className="font-medium text-blue-800 mb-2">Demo Mode Active</p>
                    <p className="text-sm">{error}</p>
                  </div>
                ) : (
                  <span>{error}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

// Supporting components would be defined here...
// GuidedStepInput, TheoryOfChangePreview, FoundationReadinessCard

export default TheoryOfChangeCapture;