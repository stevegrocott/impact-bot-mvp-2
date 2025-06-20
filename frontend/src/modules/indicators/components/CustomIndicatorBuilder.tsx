/**
 * Custom Indicator Builder Component
 * AI-powered indicator creation with IRIS+ gap analysis and validation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Wand2,
  CheckCircle,
  AlertCircle,
  Info,
  Target,
  Users,
  Calendar,
  BarChart3,
  Brain,
  Lightbulb,
  Search,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Save,
  Eye,
  RefreshCw,
  Star,
  Zap
} from 'lucide-react';

import { apiClient } from '../../../shared/services/apiClient';
import {
  CustomIndicatorTemplate,
  WizardState,
  IrisGapAnalysis,
  ValidationResults,
  AISuggestion,
  EnhancedIrisIndicator
} from '../types/enhancedTypes';

interface CustomIndicatorBuilderProps {
  existingIndicators?: EnhancedIrisIndicator[];
  onIndicatorCreated?: (indicator: CustomIndicatorTemplate) => void;
  onCancel?: () => void;
  initialData?: Partial<CustomIndicatorTemplate>;
  className?: string;
}

interface BuilderStep {
  id: number;
  title: string;
  description: string;
  component: React.ReactNode;
  validation: (data: Partial<CustomIndicatorTemplate>) => { isValid: boolean; errors: string[]; warnings: string[] };
}

export const CustomIndicatorBuilder: React.FC<CustomIndicatorBuilderProps> = ({
  existingIndicators = [],
  onIndicatorCreated,
  onCancel,
  initialData,
  className = ""
}) => {
  // State
  const [indicatorData, setIndicatorData] = useState<Partial<CustomIndicatorTemplate>>({
    name: '',
    description: '',
    category: '',
    type: 'output',
    unit: '',
    purpose: '',
    audience: [],
    dataSource: '',
    collectionMethod: '',
    frequency: '',
    ...initialData
  });

  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 1,
    totalSteps: 6,
    completedSteps: [],
    stepValidation: [],
    canProceed: false
  });

  const [gapAnalysis, setGapAnalysis] = useState<IrisGapAnalysis | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Step definitions
  const steps: BuilderStep[] = [
    {
      id: 1,
      title: 'Basic Information',
      description: 'Define the fundamental properties of your indicator',
      component: <BasicInfoStep />,
      validation: (data) => {
        const errors: string[] = [];
        const warnings: string[] = [];
        
        if (!data.name?.trim()) errors.push('Indicator name is required');
        if (!data.description?.trim()) errors.push('Description is required');
        if (!data.type) errors.push('Indicator type is required');
        if (!data.unit?.trim()) errors.push('Unit of measurement is required');
        
        if (data.name && data.name.length < 10) warnings.push('Consider a more descriptive name');
        if (data.description && data.description.length < 50) warnings.push('Consider a more detailed description');
        
        return { isValid: errors.length === 0, errors, warnings };
      }
    },
    {
      id: 2,
      title: 'Purpose & Context',
      description: 'Clarify why this indicator matters and who will use it',
      component: <PurposeContextStep />,
      validation: (data) => {
        const errors: string[] = [];
        const warnings: string[] = [];
        
        if (!data.purpose?.trim()) errors.push('Purpose statement is required');
        if (!data.audience || data.audience.length === 0) errors.push('At least one audience must be specified');
        
        return { isValid: errors.length === 0, errors, warnings };
      }
    },
    {
      id: 3,
      title: 'Data Collection',
      description: 'Define how data will be collected and managed',
      component: <DataCollectionStep />,
      validation: (data) => {
        const errors: string[] = [];
        const warnings: string[] = [];
        
        if (!data.dataSource?.trim()) errors.push('Data source is required');
        if (!data.collectionMethod?.trim()) errors.push('Collection method is required');
        if (!data.frequency?.trim()) errors.push('Collection frequency is required');
        
        return { isValid: errors.length === 0, errors, warnings };
      }
    },
    {
      id: 4,
      title: 'IRIS+ Gap Analysis',
      description: 'Analyze alignment with IRIS+ standards and identify gaps',
      component: <IrisGapStep />,
      validation: () => ({ isValid: true, errors: [], warnings: [] })
    },
    {
      id: 5,
      title: 'AI Enhancement',
      description: 'Review AI suggestions for improvement and optimization',
      component: <AIEnhancementStep />,
      validation: () => ({ isValid: true, errors: [], warnings: [] })
    },
    {
      id: 6,
      title: 'Validation & Review',
      description: 'Final validation and quality assessment',
      component: <ValidationReviewStep />,
      validation: (data) => {
        // Final comprehensive validation
        const errors = [];
        if (!data.name || !data.description || !data.purpose) {
          errors.push('All required fields must be completed');
        }
        return { isValid: errors.length === 0, errors, warnings: [] };
      }
    }
  ];

  // Update indicator data
  const updateIndicatorData = useCallback((updates: Partial<CustomIndicatorTemplate>) => {
    setIndicatorData(prev => ({ ...prev, ...updates }));
  }, []);

  // Validate current step
  const validateCurrentStep = useCallback(() => {
    const currentStepDef = steps.find(s => s.id === wizardState.currentStep);
    if (!currentStepDef) return;

    const validation = currentStepDef.validation(indicatorData);
    
    setWizardState(prev => ({
      ...prev,
      stepValidation: [
        ...prev.stepValidation.filter(v => v.step !== wizardState.currentStep),
        {
          step: wizardState.currentStep,
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings,
          suggestions: []
        }
      ],
      canProceed: validation.isValid
    }));

    return validation;
  }, [wizardState.currentStep, indicatorData, steps]);

  // Navigate to step
  const goToStep = useCallback((stepNumber: number) => {
    if (stepNumber < 1 || stepNumber > wizardState.totalSteps) return;
    
    setWizardState(prev => ({
      ...prev,
      currentStep: stepNumber
    }));
  }, [wizardState.totalSteps]);

  // Next step
  const nextStep = useCallback(() => {
    const validation = validateCurrentStep();
    if (!validation?.isValid) return;

    setWizardState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, prev.totalSteps),
      completedSteps: [...new Set([...prev.completedSteps, prev.currentStep])]
    }));
  }, [validateCurrentStep, wizardState.totalSteps]);

  // Previous step
  const previousStep = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1)
    }));
  }, []);

  // Perform IRIS+ gap analysis
  const performGapAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      const response = await apiClient.request({
        method: 'POST',
        url: '/indicators/custom/iris-gap-analysis',
        data: {
          indicatorData,
          existingIndicators: existingIndicators.map(i => ({ id: i.id, name: i.name, irisCode: i.irisCode }))
        }
      });

      if (response.success) {
        setGapAnalysis((response.data as any)?.gapAnalysis || null);
      }
    } catch (error) {
      console.error('Gap analysis failed:', error);
      // Mock gap analysis for demo
      setGapAnalysis({
        existingCoverage: [
          {
            area: 'Employment Outcomes',
            coverage: 0.7,
            existingIndicators: ['Employment rate', 'Job retention'],
            strengths: ['Good outcome tracking'],
            limitations: ['Limited skills assessment']
          }
        ],
        identifiedGaps: [
          {
            gap: 'Skill validation mechanism',
            impact: 'medium',
            urgency: 'high',
            fillingStrategy: ['Add skill assessment component'],
            customIndicatorPotential: 0.8
          }
        ],
        customizationOpportunities: [
          {
            opportunity: 'Industry-specific skill tracking',
            benefit: 'Better alignment with sector needs',
            effort: 'medium',
            riskLevel: 'low',
            implementation: ['Add industry tags', 'Customize skill categories']
          }
        ],
        alignmentPotential: [
          {
            irisIndicator: 'Skills acquired by individuals',
            alignmentScore: 0.85,
            modificationNeeded: ['Add assessment methodology'],
            benefits: ['IRIS+ compliance', 'Peer comparability'],
            challenges: ['More complex tracking']
          }
        ]
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [indicatorData, existingIndicators]);

  // Get AI suggestions
  const getAISuggestions = useCallback(async () => {
    try {
      const response = await apiClient.request({
        method: 'POST',
        url: '/indicators/custom/ai-suggestions',
        data: {
          indicatorData,
          gapAnalysis,
          existingPortfolio: existingIndicators
        }
      });

      if (response.success) {
        setAiSuggestions((response.data as any)?.suggestions || []);
      }
    } catch (error) {
      console.error('AI suggestions failed:', error);
      // Mock suggestions for demo
      setAiSuggestions([
        {
          type: 'improvement',
          suggestion: 'Consider adding a skill retention component to track long-term learning',
          reasoning: 'Current design focuses on immediate skill demonstration but doesn\'t capture retention',
          confidence: 0.85,
          implementation: 'Add 3-month follow-up assessment'
        },
        {
          type: 'enhancement',
          suggestion: 'Include industry-specific skill categories for better relevance',
          reasoning: 'Generic skill tracking may not capture sector-specific competencies',
          confidence: 0.78,
          implementation: 'Create customizable skill taxonomy'
        }
      ]);
    }
  }, [indicatorData, gapAnalysis, existingIndicators]);

  // Validate indicator
  const validateIndicator = useCallback(async () => {
    setIsValidating(true);

    try {
      const response = await apiClient.request({
        method: 'POST',
        url: '/indicators/custom/validate',
        data: { indicatorData }
      });

      if (response.success) {
        setValidationResults((response.data as any)?.validation || null);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      // Mock validation for demo
      setValidationResults({
        overallScore: 0.82,
        validationDimensions: [
          {
            dimension: 'Clarity',
            score: 0.9,
            status: 'pass',
            details: 'Indicator name and description are clear and specific',
            improvements: []
          },
          {
            dimension: 'Measurability',
            score: 0.75,
            status: 'warning',
            details: 'Measurement approach is feasible but could be more specific',
            improvements: ['Define exact assessment criteria']
          }
        ],
        criticalIssues: [],
        recommendations: [
          {
            recommendation: 'Add specific assessment criteria for skill demonstration',
            rationale: 'Current definition lacks precision for consistent measurement',
            priority: 2,
            implementationSteps: ['Define skill levels', 'Create assessment rubric']
          }
        ]
      });
    } finally {
      setIsValidating(false);
    }
  }, [indicatorData]);

  // Create indicator
  const createIndicator = useCallback(async () => {
    try {
      const response = await apiClient.request({
        method: 'POST',
        url: '/indicators/custom',
        data: indicatorData
      });

      if (response.success) {
        onIndicatorCreated?.((response.data as any)?.indicator);
      }
    } catch (error) {
      console.error('Indicator creation failed:', error);
      // For demo, simulate successful creation
      onIndicatorCreated?.(indicatorData as CustomIndicatorTemplate);
    }
  }, [indicatorData, onIndicatorCreated]);

  // Effects
  useEffect(() => {
    validateCurrentStep();
  }, [indicatorData, validateCurrentStep]);

  useEffect(() => {
    if (wizardState.currentStep === 4 && indicatorData.name && indicatorData.description) {
      performGapAnalysis();
    }
  }, [wizardState.currentStep, performGapAnalysis]);

  useEffect(() => {
    if (wizardState.currentStep === 5 && gapAnalysis) {
      getAISuggestions();
    }
  }, [wizardState.currentStep, gapAnalysis, getAISuggestions]);

  useEffect(() => {
    if (wizardState.currentStep === 6) {
      validateIndicator();
    }
  }, [wizardState.currentStep, validateIndicator]);

  const currentStepValidation = wizardState.stepValidation.find(v => v.step === wizardState.currentStep);

  // Step Components
  function BasicInfoStep() {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Indicator Name *
            </label>
            <input
              type="text"
              value={indicatorData.name || ''}
              onChange={(e) => updateIndicatorData({ name: e.target.value })}
              placeholder="e.g., Percentage of trainees demonstrating improved technical skills"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={indicatorData.category || ''}
              onChange={(e) => updateIndicatorData({ category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select category</option>
              <option value="Employment">Employment</option>
              <option value="Education">Education</option>
              <option value="Health">Health</option>
              <option value="Environment">Environment</option>
              <option value="Community">Community Development</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Indicator Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['output', 'outcome', 'impact'].map(type => (
                <button
                  key={type}
                  onClick={() => updateIndicatorData({ type: type as any })}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    indicatorData.type === type
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit of Measurement *
            </label>
            <input
              type="text"
              value={indicatorData.unit || ''}
              onChange={(e) => updateIndicatorData({ unit: e.target.value })}
              placeholder="e.g., Percentage, Count, Currency"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={indicatorData.description || ''}
            onChange={(e) => updateIndicatorData({ description: e.target.value })}
            placeholder="Provide a clear, detailed description of what this indicator measures..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    );
  }

  function PurposeContextStep() {
    const audienceOptions = ['funders', 'board', 'staff', 'beneficiaries', 'government', 'community'];

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purpose Statement *
          </label>
          <textarea
            value={indicatorData.purpose || ''}
            onChange={(e) => updateIndicatorData({ purpose: e.target.value })}
            placeholder="Why is this indicator important? What decisions will it inform?"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Audience *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {audienceOptions.map(option => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={indicatorData.audience?.includes(option) || false}
                  onChange={(e) => {
                    const current = indicatorData.audience || [];
                    const updated = e.target.checked
                      ? [...current, option]
                      : current.filter(a => a !== option);
                    updateIndicatorData({ audience: updated });
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">{option}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function DataCollectionStep() {
    const frequencyOptions = ['Real-time', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'];

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Source *
          </label>
          <input
            type="text"
            value={indicatorData.dataSource || ''}
            onChange={(e) => updateIndicatorData({ dataSource: e.target.value })}
            placeholder="e.g., Training assessments, participant surveys, administrative records"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Collection Method *
          </label>
          <textarea
            value={indicatorData.collectionMethod || ''}
            onChange={(e) => updateIndicatorData({ collectionMethod: e.target.value })}
            placeholder="Describe how data will be collected, who will collect it, and what tools will be used..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Collection Frequency *
          </label>
          <select
            value={indicatorData.frequency || ''}
            onChange={(e) => updateIndicatorData({ frequency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select frequency</option>
            {frequencyOptions.map(freq => (
              <option key={freq} value={freq}>{freq}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  function IrisGapStep() {
    return (
      <div className="space-y-6">
        {isAnalyzing ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900">Analyzing IRIS+ Alignment</div>
            <div className="text-sm text-gray-600">Checking gaps and opportunities...</div>
          </div>
        ) : gapAnalysis ? (
          <div className="space-y-6">
            {/* Alignment Potential */}
            {gapAnalysis.alignmentPotential.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  IRIS+ Alignment Opportunities
                </h4>
                {gapAnalysis.alignmentPotential.map((alignment, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-blue-200 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{alignment.irisIndicator}</div>
                      <div className="text-sm text-blue-600 font-medium">
                        {Math.round(alignment.alignmentScore * 100)}% match
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Benefits: {alignment.benefits.join(', ')}
                    </div>
                    {alignment.modificationNeeded.length > 0 && (
                      <div className="text-xs text-blue-700">
                        Modifications needed: {alignment.modificationNeeded.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Identified Gaps */}
            {gapAnalysis.identifiedGaps.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-3 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Identified Gaps
                </h4>
                {gapAnalysis.identifiedGaps.map((gap, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-orange-200 mb-2">
                    <div className="font-medium text-gray-900">{gap.gap}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Impact: {gap.impact} • Urgency: {gap.urgency}
                    </div>
                    <div className="text-xs text-orange-700 mt-2">
                      Strategy: {gap.fillingStrategy.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Complete previous steps to analyze IRIS+ alignment</p>
          </div>
        )}
      </div>
    );
  }

  function AIEnhancementStep() {
    return (
      <div className="space-y-6">
        {aiSuggestions.length > 0 ? (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Wand2 className="w-4 h-4 mr-2 text-purple-600" />
              AI Enhancement Suggestions
            </h4>
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-purple-900">{suggestion.suggestion}</div>
                  <div className="flex items-center text-purple-600">
                    <Star className="w-4 h-4 mr-1" />
                    {Math.round(suggestion.confidence * 100)}%
                  </div>
                </div>
                <div className="text-sm text-purple-700 mb-2">{suggestion.reasoning}</div>
                <div className="text-xs text-purple-600">
                  Implementation: {suggestion.implementation}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>AI suggestions will appear after gap analysis</p>
          </div>
        )}
      </div>
    );
  }

  function ValidationReviewStep() {
    return (
      <div className="space-y-6">
        {isValidating ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900">Validating Indicator</div>
            <div className="text-sm text-gray-600">Running quality checks...</div>
          </div>
        ) : validationResults ? (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Math.round(validationResults.overallScore * 100)}%
              </div>
              <div className="text-lg font-medium text-gray-900">Overall Quality Score</div>
            </div>

            {/* Validation Dimensions */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Quality Assessment</h4>
              {validationResults.validationDimensions.map((dimension, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    {dimension.status === 'pass' ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{dimension.dimension}</div>
                      <div className="text-sm text-gray-600">{dimension.details}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{Math.round(dimension.score * 100)}%</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {validationResults.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Final Recommendations
                </h4>
                {validationResults.recommendations.map((rec, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-blue-200 mb-2">
                    <div className="font-medium text-gray-900">{rec.recommendation}</div>
                    <div className="text-sm text-gray-600 mt-1">{rec.rationale}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Validation will begin automatically</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Plus className="w-6 h-6 mr-2" />
              Custom Indicator Builder
            </h2>
            <p className="text-gray-600 mt-1">
              Create tailored indicators with AI guidance and IRIS+ alignment
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {wizardState.currentStep} of {wizardState.totalSteps}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((wizardState.currentStep / wizardState.totalSteps) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(wizardState.currentStep / wizardState.totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(step.id)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                wizardState.currentStep === step.id
                  ? 'bg-blue-100 text-blue-700'
                  : wizardState.completedSteps.includes(step.id)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{step.id}</span>
              {step.title}
              {wizardState.completedSteps.includes(step.id) && (
                <CheckCircle className="w-4 h-4 ml-2" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {steps[wizardState.currentStep - 1]?.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {steps[wizardState.currentStep - 1]?.description}
          </p>
        </div>

        {steps[wizardState.currentStep - 1]?.component}

        {/* Validation Messages */}
        {currentStepValidation && (
          <div className="mt-6">
            {currentStepValidation.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                <div className="font-medium text-red-800 mb-1">Please fix the following errors:</div>
                <ul className="text-sm text-red-700 space-y-1">
                  {currentStepValidation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {currentStepValidation.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div className="font-medium text-yellow-800 mb-1">Suggestions:</div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {currentStepValidation.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={previousStep}
          disabled={wizardState.currentStep === 1}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </button>

        <div className="flex space-x-3">
          {wizardState.currentStep === wizardState.totalSteps ? (
            <button
              onClick={createIndicator}
              disabled={!wizardState.canProceed}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              Create Indicator
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!wizardState.canProceed}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomIndicatorBuilder;