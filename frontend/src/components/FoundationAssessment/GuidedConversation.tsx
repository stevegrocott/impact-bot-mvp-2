import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { apiClient } from '../../shared/services/apiClient';
import { TheoryOfChangeStructure, FoundationReadiness } from './FoundationAssessment';

interface GuidedConversationProps {
  organizationId: string;
  existingTheory: TheoryOfChangeStructure | null;
  conversationId: string | null;
  onConversationStarted: (conversationId: string) => void;
  onComplete: () => void;
  onBack: () => void;
}

interface ConversationState {
  currentStep: number;
  totalSteps: number;
  completedElements: string[];
  pendingElements: string[];
  conversationId: string;
  partialTheory: Partial<TheoryOfChangeStructure>;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isComplete?: boolean;
  foundationReadiness?: FoundationReadiness;
}

export const GuidedConversation: React.FC<GuidedConversationProps> = ({
  organizationId,
  existingTheory,
  conversationId,
  onConversationStarted,
  onComplete,
  onBack,
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      // Load existing conversation
      // For now, we'll start a fresh conversation
      startConversation();
    } else {
      startConversation();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startConversation = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.startTheoryOfChangeConversation(
        organizationId,
        existingTheory || undefined
      );
      
      if (response.success) {
        const state = response.data;
        setConversationState(state);
        onConversationStarted(state.conversationId);
        
        // Add initial assistant message
        setMessages([{
          role: 'assistant',
          content: getInitialMessage(state),
          timestamp: new Date()
        }]);
      } else {
        setError(response.message || 'Failed to start conversation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  const getInitialMessage = (state: ConversationState): string => {
    if (state.completedElements.length > 0) {
      return `I see you already have some elements of your theory of change. Let's build on that and fill in the gaps. We'll start with your impact vision - what change do you want to see in the world?`;
    }
    
    return `Let's build your theory of change together! This will take about 15-20 minutes and is essential for effective measurement. We'll start with the end in mind.

**What change do you want to see in the world?** What would success look like in 5-10 years if your work is completely successful?`;
  };

  const sendMessage = async () => {
    if (!currentInput.trim() || !conversationState) return;
    
    const userMessage: ConversationMessage = {
      role: 'user',
      content: currentInput.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setLoading(true);
    
    try {
      const response = await apiClient.continueTheoryOfChangeConversation(
        conversationState.conversationId,
        userMessage.content
      );
      
      if (response.success) {
        const result = response.data;
        
        // Update conversation state
        setConversationState(result.updatedState);
        
        // Add assistant response
        const assistantMessage: ConversationMessage = {
          role: 'assistant',
          content: result.nextMessage,
          timestamp: new Date(),
          isComplete: result.isComplete,
          foundationReadiness: result.foundationReadiness
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // If conversation is complete
        if (result.isComplete) {
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
      } else {
        setError(response.message || 'Failed to send message');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStepName = (step: number): string => {
    const stepNames = [
      'Impact Vision',
      'Target Population',
      'Problem Definition',
      'Activities',
      'Outputs',
      'Short-term Outcomes',
      'Long-term Outcomes',
      'Assumptions',
      'External Factors'
    ];
    return stepNames[step - 1] || 'Unknown Step';
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pathway Selection
        </button>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={startConversation}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pathway Selection
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Guided Theory of Change Development
            </h2>
            <p className="text-gray-600">
              Let's build your theory of change step by step
            </p>
          </div>
          
          {conversationState && (
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Step {conversationState.currentStep} of {conversationState.totalSteps}
              </div>
              <div className="text-sm font-medium text-gray-900">
                {getStepName(conversationState.currentStep)}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {conversationState && (
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(conversationState.currentStep / conversationState.totalSteps) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {message.isComplete && message.foundationReadiness && (
                <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">
                      Theory of Change Complete!
                    </span>
                  </div>
                  <div className="text-sm text-green-700">
                    Foundation Score: {message.foundationReadiness.completenessScore}% 
                    ({message.foundationReadiness.readinessLevel})
                  </div>
                </div>
              )}
              
              <div className="text-xs opacity-75 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-gray-200">
        <div className="flex space-x-4">
          <div className="flex-1">
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              disabled={loading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!currentInput.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};