import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Send, Loader2, RotateCcw, ThumbsUp, ThumbsDown, Info } from 'lucide-react';
import { RootState } from '../../../shared/store/store';
import {
  addMessage,
  setTyping,
  setLoading,
  addRecommendation,
  updateRecommendationFeedback,
} from '../../../shared/store/conversationSlice';
import { apiClient } from '../../../shared/services/apiClient';
import { useAuth } from '../../../shared/hooks/useAuth';
import MessageBubble from './MessageBubble';
import RecommendationCard from './RecommendationCard';

interface ChatInterfaceProps {
  conversationId: string;
  placeholder?: string;
  showRecommendations?: boolean;
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  placeholder = "Ask about impact measurement, IRIS+ indicators, or how to get started...",
  showRecommendations = true,
  className = "",
}) => {
  const dispatch = useDispatch();
  const { user, getOrganizationContext } = useAuth();
  
  const conversation = useSelector((state: RootState) => 
    state.conversation.conversations[conversationId]
  );
  const isTyping = useSelector((state: RootState) => state.conversation.isTyping);
  const isLoading = useSelector((state: RootState) => state.conversation.isLoading);
  
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionTimer = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Get suggestions on input change
  useEffect(() => {
    if (suggestionTimer.current) {
      clearTimeout(suggestionTimer.current);
    }

    if (inputValue.length >= 2) {
      suggestionTimer.current = setTimeout(async () => {
        try {
          const response = await apiClient.getSearchSuggestions(inputValue);
          if (response.success) {
            setSuggestions(response.data.slice(0, 5));
            setShowSuggestions(true);
          }
        } catch (error) {
          console.warn('Failed to get suggestions:', error);
        }
      }, 300);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }

    return () => {
      if (suggestionTimer.current) {
        clearTimeout(suggestionTimer.current);
      }
    };
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || isTyping) return;

    const messageContent = inputValue.trim();
    setInputValue('');
    setShowSuggestions(false);

    try {
      dispatch(setLoading(true));

      // Add user message to conversation
      const userMessage = {
        id: `msg-${Date.now()}`,
        conversationId,
        messageType: 'user' as const,
        content: messageContent,
        metadata: {
          userContext: getOrganizationContext(),
          timestamp: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      };

      dispatch(addMessage(userMessage));

      // Send message to API
      const response = await apiClient.sendMessage(conversationId, messageContent);

      if (response.success) {
        const { message, recommendations } = response.data;

        // Add assistant response
        dispatch(addMessage({
          ...message,
          relevanceScore: message.relevanceScore,
          explanation: message.explanation,
        }));

        // Add any recommendations
        if (recommendations && recommendations.length > 0) {
          recommendations.forEach((rec: any) => {
            dispatch(addRecommendation({
              conversationId,
              recommendation: rec,
            }));
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // Add error message
      dispatch(addMessage({
        id: `error-${Date.now()}`,
        conversationId,
        messageType: 'system' as const,
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        metadata: { error: true },
        createdAt: new Date().toISOString(),
      }));
    } finally {
      dispatch(setLoading(false));
      dispatch(setTyping(false));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRecommendationFeedback = (
    recommendationId: string,
    feedback: 'helpful' | 'not_helpful' | 'irrelevant',
    notes?: string
  ) => {
    dispatch(updateRecommendationFeedback({
      recommendationId,
      feedback,
      notes,
    }));
  };

  const retryLastMessage = () => {
    if (conversation?.messages.length > 0) {
      const lastUserMessage = [...conversation.messages]
        .reverse()
        .find(msg => msg.messageType === 'user');
      
      if (lastUserMessage) {
        setInputValue(lastUserMessage.content);
        inputRef.current?.focus();
      }
    }
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading conversation...
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            showMetadata={true}
          />
        ))}
        
        {/* Recommendations */}
        {showRecommendations && conversation.recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600 font-medium">
              <Info className="w-4 h-4 mr-1" />
              Recommendations
            </div>
            {conversation.recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onFeedback={handleRecommendationFeedback}
              />
            ))}
          </div>
        )}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="text-sm">Assistant is thinking...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-gray-50 p-4">
        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mb-3 space-y-1">
            <div className="text-xs text-gray-500 mb-1">Suggestions:</div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="block w-full text-left text-sm bg-white hover:bg-blue-50 border border-gray-200 rounded px-3 py-2 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        
        {/* Input Row */}
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
              rows={1}
              style={{
                minHeight: '40px',
                height: 'auto',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
              disabled={isLoading || isTyping}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || isTyping}
            className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
          
          {conversation.messages.length > 0 && (
            <button
              onClick={retryLastMessage}
              className="flex items-center justify-center w-10 h-10 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
              title="Retry last message"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Status */}
        {conversation.messages.length > 0 && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            {conversation.messages.length} messages • {conversation.recommendations.length} recommendations
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;