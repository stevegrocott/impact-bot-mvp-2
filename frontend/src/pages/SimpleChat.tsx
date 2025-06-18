/**
 * Simple Chat Interface - Working with actual backend API
 * Simplified version that works with the conversation endpoints we have
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageSquare, Plus } from 'lucide-react';
import { useAuth } from '../shared/hooks/useAuth';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

interface Conversation {
  id: string;
  title?: string;
  messages: Message[];
  updatedAt: string;
}

const SimpleChat: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversation history when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadConversationHistory(activeConversationId);
    }
  }, [activeConversationId]);

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadConversationHistory = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      content: userMessage,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/conversations/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: activeConversationId,
          intent: 'ask_question'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update messages with actual response
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempUserMessage.id),
          {
            id: data.data.userMessage.id,
            content: data.data.userMessage.content,
            role: 'user',
            timestamp: data.data.userMessage.timestamp
          },
          {
            id: data.data.assistantMessage.id,
            content: data.data.assistantMessage.content,
            role: 'assistant',
            timestamp: data.data.assistantMessage.timestamp
          }
        ]);

        // Update conversations list
        if (data.data.conversation) {
          const newConversation = data.data.conversation;
          setConversations(prev => {
            const existing = prev.find(c => c.id === newConversation.id);
            if (existing) {
              return prev.map(c => c.id === newConversation.id ? newConversation : c);
            } else {
              setActiveConversationId(newConversation.id);
              return [newConversation, ...prev];
            }
          });
        }
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
        console.error('Failed to send message:', response.statusText);
      }
    } catch (error) {
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar - Conversations */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-gray-900">Conversations</h1>
            <button
              onClick={startNewConversation}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Chat
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="p-4 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Loading conversations...</p>
            </div>
          ) : conversations.length > 0 ? (
            <div className="p-2 space-y-1">
              {conversations.map(conversation => (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    conversation.id === activeConversationId
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-medium text-gray-900 truncate">
                    {conversation.title || 'New Conversation'}
                  </h3>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(conversation.updatedAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No conversations yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeConversationId ? 'Chat' : 'Welcome to Impact Bot'}
          </h2>
          <p className="text-sm text-gray-600">
            {activeConversationId ? 'Continue your conversation' : 'Start a new conversation about impact measurement'}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeConversationId && messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome to Impact Bot Chat
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get personalized guidance on impact measurement, discover IRIS+ indicators, 
                and learn best practices for your organization.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {[
                  'How do I start measuring impact?',
                  'What IRIS+ indicators should I use?',
                  'Help me choose metrics for education',
                  'What is a theory of change?'
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInputValue(suggestion)}
                    className="p-3 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-3">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about impact measurement, IRIS+ indicators, or how to get started..."
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleChat;