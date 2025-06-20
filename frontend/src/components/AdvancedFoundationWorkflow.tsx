/**
 * Advanced Foundation Workflow Component
 * Revolutionary foundation-first interface with sophisticated pitfall prevention
 * Showcases sector-specific guidance and three-lens validation framework
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  MessageSquare,
  Target,
  Lightbulb,
  Activity,
  TrendingUp,
  Users,
  BookOpen,
  Heart,
  Building,
  Briefcase,
  TreePine,
  Globe,
  Brain,
  Eye,
  Scale,
  Zap,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Lock,
  Unlock,
  Award,
  BarChart3,
  PieChart,
  Timer,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Download,
  Share2,
  Settings,
  HelpCircle,
  CheckSquare,
  XCircle,
  Loader2
} from 'lucide-react';
import { apiClient } from '../shared/services/apiClient';
import { useAuth } from '../shared/hooks/useAuth';
import { PitfallWarningSystem } from '../modules/indicators/components/PitfallWarningSystem';
import AIPersonalityWidget from './AIPersonalityWidget';

// Types
interface TheoryOfChangeData {
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

interface ValidationResult {
  lens: 'contribution' | 'comparability' | 'credibility';
  score: number;
  issues: string[];
  recommendations: string[];
  strengths: string[];
}

interface DecisionMapping {
  id: string;
  question: string;
  dataNeeded: string[];
  frequency: string;
  stakeholders: string[];
  importance: 'critical' | 'high' | 'medium' | 'low';
  category: 'strategic' | 'operational' | 'tactical' | 'reporting';
}

interface PitfallWarning {
  id: string;
  type: 'activity_vs_impact' | 'proxy_metric' | 'over_engineering' | 'portfolio_imbalance' | 'foundation_gap';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  explanation: string;
  recommendations: string[];
  actionRequired: boolean;
  dismissible: boolean;
  metadata: Record<string, any>;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'locked' | 'available' | 'in-progress' | 'completed' | 'warning';
  estimatedTime: string;
  requiredFor: string[];
}

type WorkflowMode = 'overview' | 'theory-upload' | 'theory-guided' | 'decision-mapping' | 'validation' | 'recommendations';

// Sector configurations
const SECTOR_CONFIGS = {
  education: {
    icon: <BookOpen className="w-5 h-5" />,
    name: 'Education',
    commonPitfalls: [
      'Measuring activities instead of learning outcomes',
      'Ignoring context-specific factors affecting education',
      'Over-relying on standardized test scores'
    ],
    suggestedIndicators: [
      'Literacy rate improvement',
      'Student retention rate',
      'Learning outcome achievement'
    ]
  },
  healthcare: {
    icon: <Heart className="w-5 h-5" />,
    name: 'Healthcare',
    commonPitfalls: [
      'Focusing on service delivery over health outcomes',
      'Missing patient experience metrics',
      'Ignoring social determinants of health'
    ],
    suggestedIndicators: [
      'Patient health improvement',
      'Healthcare accessibility',
      'Treatment adherence rate'
    ]
  },
  environment: {
    icon: <TreePine className="w-5 h-5" />,
    name: 'Environment',
    commonPitfalls: [
      'Short-term metrics missing long-term impact',
      'Activity counting vs ecosystem health',
      'Ignoring community engagement metrics'
    ],
    suggestedIndicators: [
      'Carbon footprint reduction',
      'Biodiversity improvement',
      'Community environmental awareness'
    ]
  },
  economic: {
    icon: <Briefcase className="w-5 h-5" />,
    name: 'Economic Development',
    commonPitfalls: [
      'Job creation without quality assessment',
      'Missing income sustainability metrics',
      'Ignoring market system changes'
    ],
    suggestedIndicators: [
      'Sustainable income increase',
      'Business survival rate',
      'Market access improvement'
    ]
  }
};

// Component
export const AdvancedFoundationWorkflow: React.FC = () => {
  const { organization } = useAuth();
  const [currentMode, setCurrentMode] = useState<WorkflowMode>('overview');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Theory of Change state
  const [theoryData, setTheoryData] = useState<Partial<TheoryOfChangeData>>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Validation state
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [overallReadiness, setOverallReadiness] = useState(0);
  
  // Decision mapping state
  const [decisions, setDecisions] = useState<DecisionMapping[]>([]);
  const [currentDecision, setCurrentDecision] = useState<Partial<DecisionMapping>>({});
  
  // Warnings and recommendations
  const [activeWarnings, setActiveWarnings] = useState<PitfallWarning[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  
  // UI state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [showAiAssistant, setShowAiAssistant] = useState(true);
  const [animatingElements, setAnimatingElements] = useState<Set<string>>(new Set());

  // Calculate workflow steps
  const workflowSteps: WorkflowStep[] = [
    {
      id: 'theory',
      title: 'Theory of Change',
      description: 'Define your program logic and impact pathway',
      icon: <FileText className="w-5 h-5" />,
      status: theoryData.targetPopulation ? 'completed' : 'available',
      estimatedTime: '30-45 min',
      requiredFor: ['indicators', 'reporting']
    },
    {
      id: 'decisions',
      title: 'Decision Mapping',
      description: 'Identify what decisions your data will inform',
      icon: <Target className="w-5 h-5" />,
      status: decisions.length > 0 ? 'completed' : theoryData.targetPopulation ? 'available' : 'locked',
      estimatedTime: '20-30 min',
      requiredFor: ['advanced-features']
    },
    {
      id: 'validation',
      title: 'Three-Lens Validation',
      description: 'Validate contribution, comparability, and credibility',
      icon: <Eye className="w-5 h-5" />,
      status: validationResults.length > 0 ? 'completed' : decisions.length > 0 ? 'available' : 'locked',
      estimatedTime: '15-20 min',
      requiredFor: ['quality-assurance']
    },
    {
      id: 'recommendations',
      title: 'AI Recommendations',
      description: 'Receive personalized measurement guidance',
      icon: <Brain className="w-5 h-5" />,
      status: overallReadiness >= 70 ? 'available' : 'locked',
      estimatedTime: '10-15 min',
      requiredFor: ['implementation']
    }
  ];

  // Load existing foundation data
  useEffect(() => {
    loadFoundationData();
  }, [organization?.id]);

  const loadFoundationData = async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      const [theoryResponse, readinessResponse] = await Promise.all([
        apiClient.getTheoryOfChange(organization.id),
        apiClient.getFoundationReadiness(organization.id)
      ]);
      
      if (theoryResponse.success && theoryResponse.data) {
        setTheoryData(theoryResponse.data);
      }
      
      if (readinessResponse.success && readinessResponse.data) {
        setOverallReadiness(readinessResponse.data.completenessScore || 0);
      }
    } catch (error) {
      console.error('Error loading foundation data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check for pitfalls in real-time
  const checkForPitfalls = useCallback(async (context: any) => {
    try {
      const response = await apiClient.getWarningPreview('foundation_update', {
        ...context,
        sector: theoryData.sector,
        currentStep: currentMode
      });
      
      if (response.success && response.data) {
        // Convert API warnings to proper format
        const convertedWarnings: PitfallWarning[] = (response.data.warnings || []).map((warning: any) => ({
          ...warning,
          type: warning.type === 'activity_vs_impact' || warning.type === 'proxy_metric' || 
                warning.type === 'over_engineering' || warning.type === 'portfolio_imbalance' || 
                warning.type === 'foundation_gap' 
                ? warning.type 
                : 'foundation_gap' // Default fallback
        }));
        setActiveWarnings(convertedWarnings);
      }
    } catch (error) {
      console.error('Error checking pitfalls:', error);
      // Set mock warnings for development
      setActiveWarnings([
        {
          id: 'sample-warning',
          type: 'foundation_gap',
          severity: 'medium',
          title: 'Foundation Development Needed',
          message: 'Complete your theory of change before proceeding to measurement design.',
          explanation: 'A solid foundation prevents 80% of measurement failures.',
          recommendations: ['Upload your theory of change document', 'Complete the guided creation process'],
          actionRequired: false,
          dismissible: true,
          metadata: { source: 'foundation_workflow' }
        }
      ]);
    }
  }, [theoryData.sector, currentMode]);

  // Validate with three-lens framework
  const performThreeLensValidation = async () => {
    setLoading(true);
    try {
      const response = await apiClient.validateTheoryOfChange({ theory: theoryData });
      
      if (response.success && response.data) {
        const validations: ValidationResult[] = [
          {
            lens: 'contribution',
            score: response.data.contributionScore || 0,
            issues: response.data.contributionIssues || [],
            recommendations: response.data.contributionRecommendations || [],
            strengths: response.data.contributionStrengths || []
          },
          {
            lens: 'comparability',
            score: response.data.comparabilityScore || 0,
            issues: response.data.comparabilityIssues || [],
            recommendations: response.data.comparabilityRecommendations || [],
            strengths: response.data.comparabilityStrengths || []
          },
          {
            lens: 'credibility',
            score: response.data.credibilityScore || 0,
            issues: response.data.credibilityIssues || [],
            recommendations: response.data.credibilityRecommendations || [],
            strengths: response.data.credibilityStrengths || []
          }
        ];
        
        setValidationResults(validations);
        setCurrentMode('validation');
      }
    } catch (error) {
      console.error('Error validating theory:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    setUploadedDocuments(prev => [...prev, ...fileArray]);
    
    // Trigger AI analysis
    setLoading(true);
    try {
      const documents = await Promise.all(
        fileArray.map(async (file) => ({
          filename: file.name,
          content: await file.text(),
          type: file.type
        }))
      );
      
      const response = await apiClient.uploadTheoryOfChangeDocuments(
        organization?.id || '',
        documents
      );
      
      if (response.success && response.data) {
        setTheoryData(response.data.extractedTheory || {});
        await checkForPitfalls({ uploadedDocuments: documents });
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle decision mapping
  const addDecision = () => {
    if (currentDecision.question && currentDecision.dataNeeded) {
      const newDecision: DecisionMapping = {
        id: `decision-${Date.now()}`,
        question: currentDecision.question || '',
        dataNeeded: currentDecision.dataNeeded || [],
        frequency: currentDecision.frequency || 'quarterly',
        stakeholders: currentDecision.stakeholders || [],
        importance: currentDecision.importance || 'medium',
        category: currentDecision.category || 'operational'
      };
      
      setDecisions(prev => [...prev, newDecision]);
      setCurrentDecision({});
      checkForPitfalls({ decisions: [...decisions, newDecision] });
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Render sector selection
  const renderSectorSelection = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Select Your Sector
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Choose your primary sector for specialized guidance and common pitfall prevention
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(SECTOR_CONFIGS).map(([key, config]) => (
          <button
            key={key}
            onClick={() => {
              setTheoryData(prev => ({ ...prev, sector: key }));
              checkForPitfalls({ sector: key });
            }}
            className={`p-4 rounded-lg border-2 transition-all ${
              theoryData.sector === key
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                theoryData.sector === key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {config.icon}
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">{config.name}</div>
                <div className="text-xs text-gray-500">Click to select</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {theoryData.sector && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-amber-900 mb-2">
                Common {SECTOR_CONFIGS[theoryData.sector as keyof typeof SECTOR_CONFIGS].name} Pitfalls
              </h4>
              <ul className="text-sm text-amber-800 space-y-1">
                {SECTOR_CONFIGS[theoryData.sector as keyof typeof SECTOR_CONFIGS].commonPitfalls.map((pitfall, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">•</span>
                    {pitfall}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render overview
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-3">
              Foundation-First Impact Measurement
            </h1>
            <p className="text-blue-100 text-lg mb-6">
              Build a rock-solid foundation with AI-powered pitfall prevention
            </p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                <span className="text-sm">Pitfall Prevention Active</span>
              </div>
              <div className="flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                <span className="text-sm">AI Guidance Enabled</span>
              </div>
              <div className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                <span className="text-sm">IRIS+ Validated</span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">{overallReadiness}%</div>
            <div className="text-blue-100">Foundation Ready</div>
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Your Foundation Journey
        </h2>
        
        <div className="space-y-4">
          {workflowSteps.map((step, index) => (
            <div
              key={step.id}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                step.status === 'completed' ? 'border-green-500 bg-green-50' :
                step.status === 'in-progress' ? 'border-blue-500 bg-blue-50' :
                step.status === 'available' ? 'border-gray-300 hover:border-blue-400' :
                'border-gray-200 bg-gray-50'
              }`}
              onClick={() => {
                if (step.status !== 'locked') {
                  if (step.id === 'theory') setCurrentMode('theory-upload');
                  else if (step.id === 'decisions') setCurrentMode('decision-mapping');
                  else if (step.id === 'validation') performThreeLensValidation();
                  else if (step.id === 'recommendations') setCurrentMode('recommendations');
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${
                    step.status === 'completed' ? 'bg-green-100 text-green-600' :
                    step.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                    step.status === 'available' ? 'bg-gray-100 text-gray-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {step.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : step.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 flex items-center">
                      {step.title}
                      {step.status === 'locked' && (
                        <Lock className="w-4 h-4 ml-2 text-gray-400" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Timer className="w-3 h-3 mr-1" />
                        {step.estimatedTime}
                      </span>
                      {step.requiredFor.length > 0 && (
                        <span>Required for: {step.requiredFor.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {step.status !== 'locked' && (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sector Selection */}
      {!theoryData.sector && renderSectorSelection()}

      {/* Active Warnings */}
      {activeWarnings.length > 0 && (
        <PitfallWarningSystem
          warnings={activeWarnings}
          shouldBlock={activeWarnings.some(w => w.severity === 'critical')}
          allowContinue={!activeWarnings.some(w => w.actionRequired)}
          contextualGuidance="Building a strong foundation prevents 80% of measurement failures"
          onWarningAction={(warningId, action) => {
            console.log('Warning action:', warningId, action);
          }}
        />
      )}
    </div>
  );

  // Render theory upload mode
  const renderTheoryUpload = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Theory of Change Setup
          </h2>
          <button
            onClick={() => setCurrentMode('overview')}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Upload Option */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Upload Documents</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload existing strategy documents, grant proposals, or theory of change
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => e.target.files && handleDocumentUpload(e.target.files)}
              className="hidden"
              id="doc-upload"
            />
            <label
              htmlFor="doc-upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Choose Files
            </label>
          </div>

          {/* Guided Option */}
          <div className="border-2 border-gray-200 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Guided Creation</h3>
            <p className="text-sm text-gray-600 mb-4">
              Build your theory of change through a conversational process
            </p>
            <button
              onClick={() => setCurrentMode('theory-guided')}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Start Conversation
            </button>
          </div>
        </div>

        {/* Uploaded documents */}
        {uploadedDocuments.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">Uploaded Documents</h3>
            <div className="space-y-2">
              {uploadedDocuments.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="text-sm text-gray-700">{doc.name}</span>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Analysis Results */}
      {theoryData.targetPopulation && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4">
            Extracted Theory of Change
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Population
              </label>
              <p className="text-gray-900">{theoryData.targetPopulation}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Problem Definition
              </label>
              <p className="text-gray-900">{theoryData.problemDefinition}</p>
            </div>
            {/* Add more fields as needed */}
          </div>
          
          <button
            onClick={() => setCurrentMode('decision-mapping')}
            className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            Continue to Decision Mapping
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      )}
    </div>
  );

  // Render decision mapping
  const renderDecisionMapping = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Decision Mapping
            </h2>
            <p className="text-gray-600 mt-1">
              What decisions will your impact data inform?
            </p>
          </div>
          <button
            onClick={() => setCurrentMode('overview')}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Decision input form */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Add a Decision</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Decision Question
              </label>
              <input
                type="text"
                value={currentDecision.question || ''}
                onChange={(e) => setCurrentDecision(prev => ({ ...prev, question: e.target.value }))}
                placeholder="e.g., Should we expand this program to new regions?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Decision Type
                </label>
                <select
                  value={currentDecision.category || 'operational'}
                  onChange={(e) => setCurrentDecision(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="strategic">Strategic</option>
                  <option value="operational">Operational</option>
                  <option value="tactical">Tactical</option>
                  <option value="reporting">Reporting</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importance
                </label>
                <select
                  value={currentDecision.importance || 'medium'}
                  onChange={(e) => setCurrentDecision(prev => ({ ...prev, importance: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={addDecision}
              disabled={!currentDecision.question}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              Add Decision
            </button>
          </div>
        </div>

        {/* Decision list */}
        {decisions.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Your Decision Framework</h3>
            {decisions.map((decision) => (
              <div key={decision.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{decision.question}</h4>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {decision.category}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        decision.importance === 'critical' ? 'bg-red-100 text-red-700' :
                        decision.importance === 'high' ? 'bg-orange-100 text-orange-700' :
                        decision.importance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {decision.importance} priority
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDecisions(prev => prev.filter(d => d.id !== decision.id))}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {decisions.length >= 3 && (
          <button
            onClick={() => performThreeLensValidation()}
            className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center"
          >
            Validate Foundation
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        )}
      </div>
    </div>
  );

  // Render three-lens validation
  const renderValidation = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Three-Lens Validation
            </h2>
            <p className="text-gray-600 mt-1">
              Ensuring measurement quality through contribution, comparability, and credibility
            </p>
          </div>
          <button
            onClick={() => setCurrentMode('overview')}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {validationResults.map((result) => (
            <div key={result.lens} className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${
                result.score >= 80 ? 'border-green-500 bg-green-50' :
                result.score >= 60 ? 'border-yellow-500 bg-yellow-50' :
                'border-red-500 bg-red-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 capitalize">
                    {result.lens}
                  </h3>
                  <div className={`text-2xl font-bold ${
                    result.score >= 80 ? 'text-green-600' :
                    result.score >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {result.score}%
                  </div>
                </div>
                
                {result.strengths.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Strengths</h4>
                    {result.strengths.map((strength, idx) => (
                      <div key={idx} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                        {strength}
                      </div>
                    ))}
                  </div>
                )}
                
                {result.issues.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <h4 className="text-sm font-medium text-gray-700">Issues</h4>
                    {result.issues.map((issue, idx) => (
                      <div key={idx} className="flex items-start text-sm text-gray-600">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 mt-0.5" />
                        {issue}
                      </div>
                    ))}
                  </div>
                )}
                
                {result.recommendations.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <h4 className="text-sm font-medium text-gray-700">Recommendations</h4>
                    {result.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start text-sm text-gray-600">
                        <Lightbulb className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                        {rec}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Info className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <h4 className="font-medium text-blue-900">Overall Foundation Score</h4>
              <p className="text-sm text-blue-800 mt-1">
                Your foundation is {overallReadiness}% ready. 
                {overallReadiness >= 70 ? ' You can now access advanced features!' : ' Complete recommended improvements to unlock more features.'}
              </p>
            </div>
          </div>
        </div>

        {overallReadiness >= 70 && (
          <button
            onClick={() => setCurrentMode('recommendations')}
            className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center"
          >
            Get AI Recommendations
            <Sparkles className="w-5 h-5 ml-2" />
          </button>
        )}
      </div>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {currentMode === 'overview' && renderOverview()}
            {currentMode === 'theory-upload' && renderTheoryUpload()}
            {currentMode === 'decision-mapping' && renderDecisionMapping()}
            {currentMode === 'validation' && renderValidation()}
            
            {loading && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-gray-900">Processing your foundation...</span>
                </div>
              </div>
            )}
          </div>

          {/* AI Assistant Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <AIPersonalityWidget
                position="top-right"
                defaultExpanded={false}
              />
              
              {/* Quick Actions */}
              <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Export Foundation Report
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share with Team
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    View Tutorial
                  </button>
                </div>
              </div>
              
              {/* Progress Overview */}
              <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-3">Your Progress</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Theory of Change</span>
                      <span className="text-gray-900">{theoryData.targetPopulation ? '100%' : '0%'}</span>
                    </div>
                    <div className="mt-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: theoryData.targetPopulation ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Decision Mapping</span>
                      <span className="text-gray-900">{Math.min(decisions.length * 33, 100)}%</span>
                    </div>
                    <div className="mt-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(decisions.length * 33, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Validation</span>
                      <span className="text-gray-900">{validationResults.length > 0 ? '100%' : '0%'}</span>
                    </div>
                    <div className="mt-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: validationResults.length > 0 ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFoundationWorkflow;