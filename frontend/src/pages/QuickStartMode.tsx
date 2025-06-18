/**
 * Quick Start Mode
 * Optimized for time-pressed founders - 10-minute foundation completion
 * Context: Get credible impact plan fast, enhance later
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Target,
  Settings,
  Lightbulb,
  AlertCircle,
  Brain,
  FileText,
  Download,
  TrendingUp
} from 'lucide-react';
import { completeWelcome } from '../shared/store/uiSlice';

interface QuickStartStep {
  id: string;
  title: string;
  description: string;
  timeEstimate: string;
  completed: boolean;
  component?: React.ReactNode;
}

interface TheoryOfChangeData {
  problem: string;
  targetPopulation: string;
  activities: string[];
  outputs: string[];
  outcomes: string[];
  impact: string;
  assumptions: string[];
}

interface DecisionMapping {
  decision: string;
  informationNeeded: string;
  measurementApproach: string;
}

interface GeneratedIndicator {
  id: string;
  name: string;
  definition: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
}

const QuickStartMode: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [organizationType, setOrganizationType] = useState<string>('');
  const [foundationData, setFoundationData] = useState({
    targetPopulation: '',
    problemDefinition: '',
    activities: [] as string[],
    outcomes: [] as string[],
    keyDecisions: [] as string[]
  });
  const [theoryOfChange, setTheoryOfChange] = useState<TheoryOfChangeData | null>(null);
  const [decisionMappings, setDecisionMappings] = useState<DecisionMapping[]>([]);
  const [suggestedIndicators, setSuggestedIndicators] = useState<GeneratedIndicator[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Quick Start steps optimized for founders
  const steps: QuickStartStep[] = [
    {
      id: 'context',
      title: 'Organization Context',
      description: 'Quick questions about your organization',
      timeEstimate: '2 min',
      completed: false
    },
    {
      id: 'theory',
      title: 'Theory of Change',
      description: 'AI generates draft from your context',
      timeEstimate: '3 min', 
      completed: false
    },
    {
      id: 'decisions',
      title: 'Key Decisions',
      description: 'What decisions will this measurement inform?',
      timeEstimate: '2 min',
      completed: false
    },
    {
      id: 'indicators',
      title: 'Essential Indicators',
      description: 'AI suggests 3-5 core metrics',
      timeEstimate: '2 min',
      completed: false
    },
    {
      id: 'export',
      title: 'Export Your Plan',
      description: 'Download credible impact plan',
      timeEstimate: '1 min',
      completed: false
    }
  ];

  // Timer for tracking time investment
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStepComplete = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      
      // Trigger AI generation for theory step
      if (steps[currentStep + 1]?.id === 'theory') {
        await generateTheoryOfChange();
      }
      // Trigger decision mapping for decisions step
      else if (steps[currentStep + 1]?.id === 'decisions') {
        await generateDecisionMappings();
      }
      // Trigger indicator suggestions for indicators step
      else if (steps[currentStep + 1]?.id === 'indicators') {
        await generateIndicatorSuggestions();
      }
    } else {
      // Complete Quick Start
      dispatch(completeWelcome());
      navigate('/foundation');
    }
  };

  const generateTheoryOfChange = async () => {
    setIsGenerating(true);
    setGenerationStatus('Analyzing your organization context...');
    
    try {
      // Call theory of change generation API
      const response = await fetch('/api/v1/theory-of-change/guided-conversation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationType,
          problemDefinition: foundationData.problemDefinition,
          targetPopulation: foundationData.targetPopulation,
          quickStartMode: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setGenerationStatus('Generating theory of change...');
        
        // Generate comprehensive theory
        const theoryResponse = await fetch('/api/v1/theory-of-change/guided-conversation/continue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: data.data.conversationId,
            response: 'Generate complete theory of change for quick start',
            autoComplete: true
          })
        });
        
        if (theoryResponse.ok) {
          const theoryData = await theoryResponse.json();
          setTheoryOfChange(theoryData.data.theoryOfChange);
          setGenerationStatus('Theory of change generated successfully!');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setGenerationStatus(`Generation failed: ${errorMessage}`);
      setHasError(true);
      setErrorMessage(errorMessage);
      setIsGenerating(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDecisionMappings = async () => {
    setIsGenerating(true);
    setGenerationStatus('Mapping key decisions...');
    
    try {
      const response = await fetch('/api/v1/decision-mapping/guided-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theoryOfChange,
          organizationType,
          quickStartMode: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setDecisionMappings(data.data.mappings || []);
        setGenerationStatus('Decision mapping complete!');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setGenerationStatus(`Decision mapping failed: ${errorMessage}`);
      setHasError(true);
      setErrorMessage(errorMessage);
      setIsGenerating(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateIndicatorSuggestions = async () => {
    setIsGenerating(true);
    setGenerationStatus('Suggesting essential indicators...');
    
    try {
      const response = await fetch('/api/conversations/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationType,
          theoryOfChange,
          decisionMappings,
          maxRecommendations: 5,
          prioritizeFoundational: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestedIndicators(data.data.indicators || []);
        setGenerationStatus('Essential indicators identified!');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setGenerationStatus(`Indicator generation failed: ${errorMessage}`);
      setHasError(true);
      setErrorMessage(errorMessage);
      setIsGenerating(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // Remove fallback functions - these should be handled by proper error states

  const handleSkipToVisual = () => {
    navigate('/visual');
  };

  const StepIndicator: React.FC = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Quick Start - Get Your Impact Plan
        </h1>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>Time: {formatTime(timeElapsed)}</span>
          </div>
          <div className="flex items-center">
            <Target className="w-4 h-4 mr-1" />
            <span>Step {currentStep + 1} of {steps.length}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index <= currentStep 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {index < currentStep ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            <div className="text-xs text-gray-600 mt-2 text-center max-w-16">
              {step.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const OrganizationContextStep: React.FC = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Tell us about your organization
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization Type
          </label>
          <select 
            value={organizationType}
            onChange={(e) => setOrganizationType(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select your organization type...</option>
            <option value="education_startup">Education Startup</option>
            <option value="health_startup">Health/Medical Startup</option>
            <option value="nonprofit">Nonprofit Organization</option>
            <option value="social_enterprise">Social Enterprise</option>
            <option value="corporate_social_impact">Corporate Social Impact</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What's the main problem you're solving? (One sentence)
          </label>
          <textarea
            value={foundationData.problemDefinition}
            onChange={(e) => setFoundationData(prev => ({ ...prev, problemDefinition: e.target.value }))}
            placeholder="e.g., Students in rural areas lack access to quality math education..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Who do you primarily serve? (Target population)
          </label>
          <input
            type="text"
            value={foundationData.targetPopulation}
            onChange={(e) => setFoundationData(prev => ({ ...prev, targetPopulation: e.target.value }))}
            placeholder="e.g., Middle school students in rural Kenya"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => navigate('/welcome')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to Welcome
        </button>
        <button
          onClick={handleStepComplete}
          disabled={!organizationType || !foundationData.problemDefinition || !foundationData.targetPopulation}
          className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
            organizationType && foundationData.problemDefinition && foundationData.targetPopulation
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const TheoryOfChangeStep: React.FC = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {isGenerating ? 'AI is generating your Theory of Change...' : 'Review Your Theory of Change'}
      </h3>
      
      {isGenerating ? (
        <div className="text-center p-8">
          <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <div className="text-sm text-gray-600 mb-2">{generationStatus}</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      ) : theoryOfChange ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-medium text-green-800">
                Theory of Change generated successfully!
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Problem</label>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{theoryOfChange.problem}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Population</label>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{theoryOfChange.targetPopulation}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activities</label>
                <ul className="text-sm text-gray-600 bg-gray-50 p-2 rounded space-y-1">
                  {theoryOfChange.activities?.map((activity, idx) => (
                    <li key={idx}>• {activity}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outputs</label>
                <ul className="text-sm text-gray-600 bg-gray-50 p-2 rounded space-y-1">
                  {theoryOfChange.outputs?.map((output, idx) => (
                    <li key={idx}>• {output}</li>
                  ))}
                </ul>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outcomes</label>
                <ul className="text-sm text-gray-600 bg-gray-50 p-2 rounded space-y-1">
                  {theoryOfChange.outcomes?.map((outcome, idx) => (
                    <li key={idx}>• {outcome}</li>
                  ))}
                </ul>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{theoryOfChange.impact}</p>
              </div>
            </div>
          </div>
        </div>
      ) : hasError ? (
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-red-900 mb-2">Generation Failed</h4>
          <p className="text-red-700 mb-4">{errorMessage}</p>
          <button
            onClick={() => {
              setHasError(false);
              setErrorMessage('');
              generateTheoryOfChange();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Theory of change will be generated from your organization context.</p>
        </div>
      )}
      
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setCurrentStep(prev => prev - 1)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={handleStepComplete}
          disabled={isGenerating}
          className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
            isGenerating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const DecisionMappingStep: React.FC = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Key Decisions This Measurement Will Inform
      </h3>
      
      {isGenerating ? (
        <div className="text-center p-8">
          <Target className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <div className="text-sm text-gray-600 mb-2">{generationStatus}</div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Foundation principle:</strong> Measure only what informs decisions. Here are the key decisions your measurement system will support:
            </p>
          </div>
          
          {decisionMappings.map((mapping, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{mapping.decision}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Information needed:</span>
                  <p className="text-gray-700">{mapping.informationNeeded}</p>
                </div>
                <div>
                  <span className="text-gray-500">Measurement approach:</span>
                  <p className="text-gray-700">{mapping.measurementApproach}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setCurrentStep(prev => prev - 1)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={handleStepComplete}
          disabled={isGenerating}
          className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
            isGenerating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const IndicatorSelectionStep: React.FC = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Essential Indicators (AI-Recommended)
      </h3>
      
      {isGenerating ? (
        <div className="text-center p-8">
          <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <div className="text-sm text-gray-600 mb-2">{generationStatus}</div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800">
              <strong>Foundation-ready indicators:</strong> These 3-5 indicators provide maximum decision-making value with minimal measurement overhead.
            </p>
          </div>
          
          {suggestedIndicators.map((indicator) => (
            <div key={indicator.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900">{indicator.name}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  indicator.priority === 'high' ? 'bg-red-100 text-red-700' :
                  indicator.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {indicator.priority} priority
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{indicator.definition}</p>
              <div className="text-xs text-gray-500">
                <strong>Category:</strong> {indicator.category} | <strong>Why this matters:</strong> {indicator.rationale}
              </div>
            </div>
          ))}
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Next step:</strong> These indicators will be integrated into your measurement framework. You can refine and add more indicators later in the full dashboard.
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setCurrentStep(prev => prev - 1)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={handleStepComplete}
          disabled={isGenerating}
          className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
            isGenerating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const ExportPlanStep: React.FC = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Your Impact Plan is Ready!
      </h3>
      
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-medium text-green-800">
              Foundation complete in {formatTime(timeElapsed)}
            </span>
          </div>
          <p className="text-sm text-green-700">
            You now have a credible impact measurement foundation that can inform decisions and demonstrate impact to stakeholders.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <FileText className="w-8 h-8 text-blue-600 mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Impact Plan Summary</h4>
            <p className="text-sm text-gray-600 mb-3">One-page executive summary perfect for investors and stakeholders.</p>
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <Settings className="w-8 h-8 text-indigo-600 mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Enhanced Dashboard</h4>
            <p className="text-sm text-gray-600 mb-3">Continue building with advanced tools and team collaboration.</p>
            <button 
              onClick={() => navigate('/foundation')}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Continue Building
            </button>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">What you've accomplished:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Theory of Change mapped</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Key decisions identified</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Essential indicators selected</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Foundation readiness achieved</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setCurrentStep(prev => prev - 1)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={handleStepComplete}
          className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center font-medium"
        >
          Complete Quick Start
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const CurrentStepComponent: React.FC = () => {
    switch (steps[currentStep]?.id) {
      case 'context':
        return <OrganizationContextStep />;
      case 'theory':
        return <TheoryOfChangeStep />;
      case 'decisions':
        return <DecisionMappingStep />;
      case 'indicators':
        return <IndicatorSelectionStep />;
      case 'export':
        return <ExportPlanStep />;
      default:
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {steps[currentStep]?.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {steps[currentStep]?.description}
            </p>
            <button 
              onClick={handleStepComplete}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <StepIndicator />
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main step content */}
          <div className="lg:col-span-2">
            <CurrentStepComponent />
          </div>

          {/* Sidebar with tips and options */}
          <div className="space-y-6">
            {/* Time tracker */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Clock className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">Time Goal: 10 minutes</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(timeElapsed)}
              </div>
              <div className="text-sm text-blue-700">
                You're {timeElapsed < 600 ? 'on track!' : 'taking your time - that\'s okay!'}
              </div>
            </div>

            {/* Value proposition reminder */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <Lightbulb className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-900 mb-1">
                    Why Quick Start?
                  </h4>
                  <p className="text-sm text-green-700">
                    Get a credible foundation fast, then enhance it later with our full tools.
                  </p>
                </div>
              </div>
            </div>

            {/* Enhancement option */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Want more comprehensive tools?
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Switch to Visual Dashboard for advanced features and detailed customization.
              </p>
              <button
                onClick={handleSkipToVisual}
                className="w-full px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Switch to Visual Mode
              </button>
            </div>

            {/* Progress preservation guarantee */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">
                    Your progress is saved
                  </h4>
                  <p className="text-sm text-amber-700">
                    You can pause anytime and your work will be preserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStartMode;