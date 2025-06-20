/**
 * AI Personality Interaction Interface
 * Revolutionary component showcasing sophisticated AI personality capabilities
 * Features: Dynamic personality switching, contextual awareness, real-time guidance
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../shared/store/store';
import { 
  Brain, 
  Zap, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  Activity,
  Eye,
  Settings,
  BarChart3,
  MessageCircle,
  Users,
  Cpu,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Star
} from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
import { useFramerMotionSafe } from '../hooks/useSafeDependencies';
import { RootState } from '../shared/store/store';
import {
  fetchAvailablePersonalities,
  selectPersonalityForContext,
  generatePersonalityResponse,
  fetchPersonalityRecommendations,
  fetchPersonalityAnalytics,
  recordPersonalityFeedback,
  setSelectedPersonality,
  addRealTimeGuidance,
  updateInteractionMetrics,
  addLearningPattern,
  setVisualState,
  startResponseGeneration,
  stopResponseGeneration
} from '../shared/store/aiPersonalitySlice';
import { useAuth } from '../shared/hooks/useAuth';

interface AIPersonalityInterfaceProps {
  conversationId?: string;
  initialContext?: any;
  mode?: 'chat' | 'selection' | 'analytics';
  className?: string;
}

const AIPersonalityInterface: React.FC<AIPersonalityInterfaceProps> = ({
  conversationId,
  initialContext,
  mode = 'chat',
  className = ''
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, getOrganizationContext } = useAuth();
  const { motion, AnimatePresence, isAvailable: motionAvailable } = useFramerMotionSafe();
  
  const {
    availablePersonalities,
    selectedPersonality,
    personalitySelection,
    recommendations,
    analytics,
    isLoading,
    isGenerating,
    error,
    interactionState,
    visualState
  } = useSelector((state: RootState) => state.aiPersonality);

  const [inputMessage, setInputMessage] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [contextualRecommendations, setContextualRecommendations] = useState<any[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const responseTimeRef = useRef<number>(0);

  // Initialize component
  useEffect(() => {
    dispatch(fetchAvailablePersonalities());
    if (user) {
      const context = {
        userRole: user?.currentOrganization?.role?.name || 'impact_analyst',
        currentPhase: 'foundation',
        foundationReadiness: 50,
        conversationHistory: [],
        currentTask: 'general_assistance',
        urgencyLevel: 'medium' as const,
        complexityLevel: 'intermediate' as const,
        previousInteractions: []
      };
      dispatch(selectPersonalityForContext(context));
      dispatch(fetchPersonalityRecommendations());
    }
  }, [dispatch, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, currentResponse]);

  // Simulate typing effect for AI responses
  const typeResponse = useCallback((response: string, callback?: () => void) => {
    setIsTyping(true);
    setCurrentResponse('');
    
    let index = 0;
    const typeInterval = setInterval(() => {
      setCurrentResponse(prev => prev + response[index]);
      index++;
      
      if (index >= response.length) {
        clearInterval(typeInterval);
        setIsTyping(false);
        callback && callback();
      }
    }, 20);
    
    return () => clearInterval(typeInterval);
  }, []);

  // Handle message sending
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating || !selectedPersonality) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      speaker: 'user' as const,
      content: inputMessage.trim(),
      timestamp: new Date(),
      sentiment: 'neutral' as const
    };

    setConversationHistory(prev => [...prev, userMessage]);
    setInputMessage('');
    
    const startTime = Date.now();
    responseTimeRef.current = startTime;
    
    dispatch(startResponseGeneration());

    try {
      const context = {
        userId: user?.id || '',
        organizationId: user?.organizationId || user?.currentOrganization?.id || '',
        userRole: user?.currentOrganization?.role?.name || 'impact_analyst',
        currentPhase: 'conversation',
        foundationReadiness: 75,
        conversationHistory,
        currentTask: 'interactive_guidance',
        urgencyLevel: 'medium' as const,
        complexityLevel: 'intermediate' as const,
        previousInteractions: []
      };

      const response = await dispatch(generatePersonalityResponse({
        personalityId: selectedPersonality.id,
        userMessage: inputMessage.trim(),
        context
      })) as any;

      const responseTime = Date.now() - startTime;
      
      // Update metrics
      dispatch(updateInteractionMetrics({
        responseTime,
        userEngagement: 0.8,
        taskCompletion: 0.6
      }));

      // Add learning pattern
      dispatch(addLearningPattern(`User asked about: ${inputMessage.substring(0, 50)}`));

      // Simulate typing effect
      typeResponse(response.response, () => {
        const aiMessage = {
          id: `msg-${Date.now()}`,
          speaker: 'ai' as const,
          content: response.response,
          timestamp: new Date(),
          personalityId: selectedPersonality.id,
          sentiment: 'positive' as const,
          metadata: {
            followUpSuggestions: response.followUpSuggestions,
            contextualHelp: response.contextualHelp,
            nextSteps: response.nextSteps,
            confidenceLevel: response.confidenceLevel
          }
        };

        setConversationHistory(prev => [...prev, aiMessage]);
        
        // Add contextual recommendations
        if (response.followUpSuggestions) {
          setContextualRecommendations(response.followUpSuggestions.map((suggestion: string, index: number) => ({
            id: `rec-${Date.now()}-${index}`,
            type: 'follow_up',
            content: suggestion,
            confidence: response.confidenceLevel
          })));
        }
      });

    } catch (error: any) {
      console.error('Failed to generate response:', error);
      dispatch(addRealTimeGuidance({
        type: 'warning',
        message: 'Unable to generate response. Please try again.'
      }));
    } finally {
      dispatch(stopResponseGeneration());
    }
  };

  // Handle personality switching
  const handlePersonalitySwitch = async (personality: any) => {
    dispatch(setSelectedPersonality(personality));
    
    // Add guidance about the switch
    dispatch(addRealTimeGuidance({
      type: 'guidance',
      message: `Switched to ${personality.displayName} - ${personality.description}`
    }));

    // Add to conversation history
    const switchMessage = {
      id: `switch-${Date.now()}`,
      speaker: 'system' as const,
      content: `AI personality switched to ${personality.displayName}`,
      timestamp: new Date(),
      sentiment: 'neutral' as const
    };
    setConversationHistory(prev => [...prev, switchMessage]);
  };

  // Handle feedback
  const handleFeedback = async (rating: number, feedback?: string) => {
    if (selectedPersonality) {
      await dispatch(recordPersonalityFeedback({
        personalityId: selectedPersonality.id,
        interactionId: `interaction-${Date.now()}`,
        rating,
        feedback,
        effectiveness: rating / 5,
        context: { conversationLength: conversationHistory.length }
      }));
    }
  };

  // Personality avatar component
  const PersonalityAvatar: React.FC<{ personality: any; isActive?: boolean; onClick?: () => void }> = ({ 
    personality, 
    isActive = false, 
    onClick 
  }) => {
    const getPersonalityIcon = (role: string) => {
      switch (role) {
        case 'coach': return <MessageCircle className="w-6 h-6" />;
        case 'advisor': return <Users className="w-6 h-6" />;
        case 'analyst': return <BarChart3 className="w-6 h-6" />;
        default: return <Brain className="w-6 h-6" />;
      }
    };

    const getPersonalityColor = (role: string) => {
      switch (role) {
        case 'coach': return 'from-green-400 to-blue-500';
        case 'advisor': return 'from-blue-400 to-purple-500';
        case 'analyst': return 'from-purple-400 to-pink-500';
        default: return 'from-gray-400 to-gray-600';
      }
    };

    // Safe motion components
    const MotionDiv = React.useMemo(() => {
      if (motionAvailable && motion && motion.div) {
        return motion.div;
      }
      return 'div';
    }, [motionAvailable, motion]);

    return (
      <MotionDiv
        className={`
          relative cursor-pointer rounded-full p-1 transition-all duration-300
          ${isActive ? 'ring-4 ring-blue-400 ring-opacity-50' : 'hover:ring-2 hover:ring-gray-300'}
        `}
        onClick={onClick}
        {...(motionAvailable && motion && motion.div ? {
          whileHover: { scale: 1.05 },
          whileTap: { scale: 0.95 }
        } : {})}
      >
        <div className={`
          w-12 h-12 rounded-full bg-gradient-to-br ${getPersonalityColor(personality.role)}
          flex items-center justify-center text-white shadow-lg
        `}>
          {getPersonalityIcon(personality.role)}
        </div>
        
        {/* Active indicator */}
        {isActive && (
          <MotionDiv
            className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
            {...(motionAvailable && motion && motion.div ? {
              initial: { scale: 0 },
              animate: { scale: 1 },
              transition: { type: "spring", stiffness: 500, damping: 30 }
            } : {})}
          />
        )}
        
        {/* Confidence level indicator */}
        {isActive && interactionState.contextualAwareness.confidenceLevel > 0 && (
          <MotionDiv
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
            {...(motionAvailable && motion && motion.div ? {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 }
            } : {})}
          >
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map(level => (
                <div
                  key={level}
                  className={`
                    w-1 h-3 rounded-full transition-all duration-300
                    ${level <= (interactionState.contextualAwareness.confidenceLevel * 5) 
                      ? 'bg-green-400' 
                      : 'bg-gray-300'
                    }
                  `}
                />
              ))}
            </div>
          </MotionDiv>
        )}
      </MotionDiv>
    );
  };

  // Real-time guidance panel
  const RealTimeGuidancePanel: React.FC = () => {
    // Safe motion components
    const SafeAnimatePresence = React.useMemo(() => {
      if (motionAvailable && AnimatePresence) {
        return AnimatePresence;
      }
      return React.Fragment;
    }, [motionAvailable, AnimatePresence]);

    const MotionDiv = React.useMemo(() => {
      if (motionAvailable && motion && motion.div) {
        return motion.div;
      }
      return 'div';
    }, [motionAvailable, motion]);

    return (
      <SafeAnimatePresence>
        {(interactionState.realTimeGuidance.activeGuidance.length > 0 || 
          interactionState.realTimeGuidance.preventionWarnings.length > 0 || 
          interactionState.realTimeGuidance.opportunityAlerts.length > 0) && (
          <MotionDiv
            {...(motionAvailable && motion && motion.div ? {
              initial: { opacity: 0, x: 300 },
              animate: { opacity: 1, x: 0 },
              exit: { opacity: 0, x: 300 }
            } : {})}
            className="fixed right-4 top-20 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Eye className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-gray-900">AI Insights</h3>
              </div>
              <button
                onClick={() => dispatch(setVisualState({ showRecommendations: false }))}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Active Guidance */}
            {interactionState.realTimeGuidance.activeGuidance.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Guidance</span>
                </div>
                {interactionState.realTimeGuidance.activeGuidance.map((guidance, index) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                    <p className="text-sm text-yellow-800">{guidance}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Prevention Warnings */}
            {interactionState.realTimeGuidance.preventionWarnings.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Warnings</span>
                </div>
                {interactionState.realTimeGuidance.preventionWarnings.map((warning, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                    <p className="text-sm text-red-800">{warning}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Opportunity Alerts */}
            {interactionState.realTimeGuidance.opportunityAlerts.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <Target className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Opportunities</span>
                </div>
                {interactionState.realTimeGuidance.opportunityAlerts.map((alert, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                    <p className="text-sm text-green-800">{alert}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </MotionDiv>
      )}
    </SafeAnimatePresence>
    );
  };

  // Contextual recommendations
  const ContextualRecommendations: React.FC = () => {
    // Safe motion components
    const SafeAnimatePresence = React.useMemo(() => {
      if (motionAvailable && AnimatePresence) {
        return AnimatePresence;
      }
      return React.Fragment;
    }, [motionAvailable, AnimatePresence]);

    const MotionDiv = React.useMemo(() => {
      if (motionAvailable && motion && motion.div) {
        return motion.div;
      }
      return 'div';
    }, [motionAvailable, motion]);

    return (
      <SafeAnimatePresence>
        {contextualRecommendations.length > 0 && (
          <MotionDiv
            {...(motionAvailable && motion && motion.div ? {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: 20 }
            } : {})}
            className="border-t border-gray-200 bg-gray-50 p-4"
          >
          <div className="flex items-center mb-3">
            <Sparkles className="w-4 h-4 text-purple-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Smart Suggestions</span>
          </div>
          <div className="space-y-2">
            {contextualRecommendations.map((rec) => (
              <button
                key={rec.id}
                onClick={() => {
                  setInputMessage(rec.content);
                  setContextualRecommendations([]);
                }}
                className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-800">{rec.content}</span>
                  <div className="flex items-center">
                    <div className="flex items-center mr-2">
                      {[1, 2, 3, 4, 5].map(level => (
                        <Star
                          key={level}
                          className={`w-3 h-3 ${
                            level <= (rec.confidence * 5) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </MotionDiv>
      )}
    </SafeAnimatePresence>
    );
  };

  // Main interface render
  return (
    <div className={`h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 ${className}`}>
      {/* Header with personality switching */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI Personality Engine</h2>
                <p className="text-sm text-gray-600">Revolutionary contextual AI guidance</p>
              </div>
            </div>
            
            {/* AI Intelligence Indicators */}
            <div className="flex items-center space-x-4 ml-8">
              <div className="flex items-center">
                <Activity className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-xs text-gray-600">Live</span>
              </div>
              <div className="flex items-center">
                <Cpu className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-xs text-gray-600">
                  {Math.round(interactionState.contextualAwareness.confidenceLevel * 100)}% Confidence
                </span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-purple-500 mr-1" />
                <span className="text-xs text-gray-600">
                  {interactionState.contextualAwareness.learningPatterns.length} Patterns
                </span>
              </div>
            </div>
          </div>

          {/* Personality Switcher */}
          <div className="flex items-center space-x-2">
            {availablePersonalities.map(personality => (
              <PersonalityAvatar
                key={personality.id}
                personality={personality}
                isActive={selectedPersonality?.id === personality.id}
                onClick={() => handlePersonalitySwitch(personality)}
              />
            ))}
            
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="ml-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Personality Info */}
        {selectedPersonality && (
          <div
            className="mt-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex items-center mr-4">
                  <PersonalityAvatar personality={selectedPersonality} isActive={false} />
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">{selectedPersonality.displayName}</h3>
                    <p className="text-sm text-gray-600">{selectedPersonality.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Tone: {selectedPersonality.communicationStyle?.tone}</span>
                  <span>Depth: {selectedPersonality.contextualGuidance?.technicalDepth}</span>
                  <span>Expertise: {selectedPersonality.expertise?.slice(0, 2).join(', ')}</span>
                </div>
              </div>
              
              {isGenerating && (
                <div className="flex items-center text-blue-600">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main conversation area */}
      <div className="flex-1 flex">
        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {conversationHistory.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-2xl rounded-lg p-4 shadow-sm
                  ${message.speaker === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : message.speaker === 'system'
                    ? 'bg-gray-100 text-gray-700 border-l-4 border-blue-400'
                    : 'bg-white text-gray-900 border border-gray-200'
                  }
                `}>
                  {message.speaker === 'ai' && selectedPersonality && (
                    <div className="flex items-center mb-2">
                      <PersonalityAvatar personality={selectedPersonality} isActive={false} />
                      <span className="ml-2 text-sm font-medium text-gray-600">
                        {selectedPersonality.displayName}
                      </span>
                      {message.metadata?.confidenceLevel && (
                        <div className="ml-auto flex items-center">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map(level => (
                              <Star
                                key={level}
                                className={`w-3 h-3 ${
                                  level <= (message.metadata.confidenceLevel * 5) 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {message.metadata?.followUpSuggestions && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-600 mb-2">Follow-up suggestions:</p>
                      <div className="space-y-1">
                        {message.metadata.followUpSuggestions.map((suggestion: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => setInputMessage(suggestion)}
                            className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            • {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing indicator for current response */}
            {(isTyping || currentResponse) && (
              <div
                className="flex justify-start"
              >
                <div className="max-w-2xl bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  {selectedPersonality && (
                    <div className="flex items-center mb-2">
                      <PersonalityAvatar personality={selectedPersonality} isActive={false} />
                      <span className="ml-2 text-sm font-medium text-gray-600">
                        {selectedPersonality.displayName}
                      </span>
                      {isTyping && (
                        <div className="ml-auto flex items-center text-blue-600">
                          <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                          <span className="text-xs">Typing...</span>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{currentResponse}</p>
                  {isTyping && (
                    <div className="mt-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Contextual Recommendations */}
          <ContextualRecommendations />

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Ask ${selectedPersonality?.displayName || 'AI'} anything about impact measurement...`}
                  className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
                  rows={1}
                  disabled={isGenerating || !selectedPersonality}
                />
              </div>
              
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isGenerating || !selectedPersonality}
                className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
              </button>
            </div>
            
            {/* Quick feedback */}
            {conversationHistory.length > 0 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">How helpful was this response?</span>
                  <button
                    onClick={() => handleFeedback(5, 'helpful')}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFeedback(2, 'not helpful')}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="text-xs text-gray-500">
                  {conversationHistory.length} messages • Response time: {responseTimeRef.current}ms
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Guidance Panel */}
      <RealTimeGuidancePanel />
    </div>
  );
};

export default AIPersonalityInterface;