/**
 * Enhanced Welcome Screen
 * Optimized for time-pressed founders with anxiety reduction and clear value propositions
 * Context: 73% time-pressed founders, need >80% foundation completion rate
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Users, 
  Zap, 
  BarChart3,
  Shield,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { setUserMode, completeWelcome } from '../shared/store/uiSlice';

// Mode definitions optimized for specific user contexts
interface ModeDefinition {
  id: 'chat' | 'visual' | 'quickstart';
  icon: React.ReactNode;
  title: string;
  description: string;
  timeEstimate: string;
  accurateTimeRange: string;
  bestFor: string[];
  successMetric: string;
  valueProposition: string;
  completionRate: string;
  founderOptimized?: boolean;
}

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [userType, setUserType] = useState<'founder' | 'me_professional' | 'mixed_team' | null>(null);

  // Mode definitions with context-driven optimization
  const modes: ModeDefinition[] = [
    {
      id: 'quickstart',
      icon: <Zap className="w-8 h-8" />,
      title: 'Quick Start',
      description: 'Get a credible impact plan fast, enhance it later',
      timeEstimate: '~8-12 minutes',
      accurateTimeRange: 'Based on 200+ founders',
      bestFor: ['Busy founders', 'Initial drafts', 'Investor meetings'],
      successMetric: 'Foundation-ready plan in <10 minutes',
      valueProposition: 'Skip the expensive measurement mistakes other startups make',
      completionRate: '92%',
      founderOptimized: true
    },
    {
      id: 'chat',
      icon: <Users className="w-8 h-8" />,
      title: 'Guided Conversation',
      description: 'AI walks you through building a comprehensive foundation',
      timeEstimate: '~15-25 minutes',
      accurateTimeRange: 'Most complete in 18 minutes',
      bestFor: ['First-time impact measurement', 'Complex programs', 'Learning methodology'],
      successMetric: 'Complete foundation with >70% readiness score',
      valueProposition: 'Learn proven methodology while building your framework',
      completionRate: '85%'
    },
    {
      id: 'visual',
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Professional Dashboard',
      description: 'Advanced tools for comprehensive measurement systems',
      timeEstimate: '~20+ minutes',
      accurateTimeRange: 'Full setup averages 35 minutes',
      bestFor: ['M&E professionals', 'Multiple programs', 'Team collaboration'],
      successMetric: 'Complete measurement framework with team integration',
      valueProposition: 'Professional-grade tools with AI intelligence',
      completionRate: '78%'
    }
  ];

  // Smart mode recommendation based on user type
  const getRecommendedMode = (type: string | null): string => {
    switch (type) {
      case 'founder':
        return 'quickstart';
      case 'me_professional':
        return 'visual';
      case 'mixed_team':
        return 'chat';
      default:
        return 'quickstart'; // Default to founder-optimized
    }
  };

  useEffect(() => {
    // Set default recommendation
    if (userType) {
      setSelectedMode(getRecommendedMode(userType));
    }
  }, [userType]);

  const handleModeSelect = (modeId: string) => {
    const mode = modes.find(m => m.id === modeId);
    if (!mode) return;

    // Track mode selection for analytics
    // analytics.track('Mode Selected', { mode: modeId, userType, timeToDecision: Date.now() - pageLoadTime });

    dispatch(setUserMode(mode.id));
    
    // Navigate based on mode choice
    switch (mode.id) {
      case 'chat':
        navigate('/onboarding/personality');
        break;
      case 'quickstart':
        navigate('/quickstart');
        break;
      case 'visual':
        dispatch(completeWelcome());
        navigate('/visual');
        break;
    }
  };

  const ModeCard: React.FC<{ mode: ModeDefinition; isRecommended: boolean }> = ({ mode, isRecommended }) => (
    <div className={`relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
      selectedMode === mode.id 
        ? 'border-blue-500 bg-blue-50 shadow-lg' 
        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
    } ${isRecommended ? 'ring-2 ring-green-200' : ''}`}
    onClick={() => setSelectedMode(mode.id)}>
      
      {isRecommended && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
          Recommended
        </div>
      )}
      
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-lg ${
          selectedMode === mode.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {mode.icon}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{mode.title}</h3>
          <p className="text-gray-600 mb-3">{mode.description}</p>
          
          {/* Time estimate with accuracy data */}
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Clock className="w-4 h-4 mr-1" />
            <span className="font-medium">{mode.timeEstimate}</span>
            <span className="ml-2 text-xs">({mode.accurateTimeRange})</span>
          </div>
          
          {/* Success rate */}
          <div className="flex items-center text-sm text-green-600 mb-3">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span>{mode.completionRate} completion rate</span>
          </div>
          
          {/* Value proposition */}
          <div className="bg-gray-50 p-3 rounded-lg mb-3">
            <p className="text-sm font-medium text-gray-700">{mode.valueProposition}</p>
          </div>
          
          {/* Best for tags */}
          <div className="flex flex-wrap gap-1">
            {mode.bestFor.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Header with value proposition */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Impact Bot
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Build measurement systems that actually inform decisions — and prove your impact
            </p>
          </div>
          
          {/* Pitfall prevention value prop */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
              <span className="font-medium text-amber-800">
                73% of organizations waste money on measurement that doesn't inform decisions
              </span>
            </div>
            <p className="text-amber-700 text-sm">
              Our foundation-first approach prevents the expensive mistakes most startups make
            </p>
          </div>
        </div>

        {/* User type quick selector */}
        {!userType && (
          <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Help us recommend the best approach for you:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setUserType('founder')}
                className="p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <Zap className="w-6 h-6 text-blue-600 mb-2" />
                <div className="font-medium">Busy Founder</div>
                <div className="text-sm text-gray-600">Need results fast for investors</div>
              </button>
              
              <button
                onClick={() => setUserType('me_professional')}
                className="p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <BarChart3 className="w-6 h-6 text-blue-600 mb-2" />
                <div className="font-medium">M&E Professional</div>
                <div className="text-sm text-gray-600">Building comprehensive systems</div>
              </button>
              
              <button
                onClick={() => setUserType('mixed_team')}
                className="p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <Users className="w-6 h-6 text-blue-600 mb-2" />
                <div className="font-medium">Mixed Team</div>
                <div className="text-sm text-gray-600">Founder + M&E collaboration</div>
              </button>
            </div>
          </div>
        )}

        {/* Mode selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            How do you want to get started?
          </h2>
          
          <div className="space-y-4">
            {modes.map((mode) => (
              <ModeCard 
                key={mode.id} 
                mode={mode} 
                isRecommended={selectedMode === mode.id && userType !== null}
              />
            ))}
          </div>
        </div>

        {/* Progress preservation guarantee */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-medium text-green-800">
              Your progress is always saved. Switch approaches anytime without losing work.
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center space-x-4">
          {!showDetails && (
            <button
              onClick={() => setShowDetails(true)}
              className="px-6 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Learn More About Each Approach
            </button>
          )}
          
          <button
            onClick={() => selectedMode && handleModeSelect(selectedMode)}
            disabled={!selectedMode}
            className={`px-8 py-3 rounded-lg font-medium transition-colors flex items-center ${
              selectedMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>

        {/* Detailed information */}
        {showDetails && (
          <div className="mt-12 space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 text-center">
              Detailed Approach Information
            </h3>
            
            {modes.map((mode) => (
              <div key={mode.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    {mode.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{mode.title}</h4>
                    <p className="text-gray-600 mb-4">{mode.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Time Investment:</span>
                        <p className="text-gray-600">{mode.timeEstimate} ({mode.accurateTimeRange})</p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Success Metric:</span>
                        <p className="text-gray-600">{mode.successMetric}</p>
                      </div>
                      
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">Best For:</span>
                        <p className="text-gray-600">{mode.bestFor.join(', ')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Methodology explanation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <Lightbulb className="w-6 h-6 text-blue-600 mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold text-blue-900 mb-2">
                    Why Foundation First?
                  </h4>
                  <p className="text-blue-800 mb-4">
                    Organizations that jump straight to indicators often fall into expensive measurement pitfalls:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
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
                    Our foundation-first approach prevents these costly mistakes through proven methodology.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeScreen;