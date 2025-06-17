import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, History, Search, Filter } from 'lucide-react';
import { RootState } from '../shared/store/store';
import { addConversation, setActiveConversation } from '../shared/store/conversationSlice';
import { apiClient } from '../shared/services/apiClient';
import { useAuth } from '../shared/hooks/useAuth';
import ChatInterface from '../modules/conversational-ai/components/ChatInterface';

const Chat: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, getOrganizationContext } = useAuth();
  
  const conversations = useSelector((state: RootState) => state.conversation.conversations);
  const activeConversationId = useSelector((state: RootState) => state.conversation.activeConversationId);
  
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversationFilter, setConversationFilter] = useState<string>('all');

  // Set active conversation from URL parameter
  useEffect(() => {
    if (conversationId && conversations[conversationId]) {
      dispatch(setActiveConversation(conversationId));
    } else if (conversationId && !conversations[conversationId]) {
      // Try to load conversation from API
      loadConversation(conversationId);
    }
  }, [conversationId, conversations, dispatch]);

  // Load conversation from API
  const loadConversation = async (id: string) => {
    try {
      const response = await apiClient.getConversation(id);
      if (response.success) {
        dispatch(addConversation(response.data));
        dispatch(setActiveConversation(id));
      } else {
        // Conversation not found, redirect to chat home
        navigate('/chat');
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      navigate('/chat');
    }
  };

  // Create new conversation
  const createNewConversation = async (type: string = 'discovery', initialContext?: Record<string, any>) => {
    setIsCreatingConversation(true);
    
    try {
      const context = {
        ...getOrganizationContext(),
        ...initialContext,
      };
      
      const response = await apiClient.createConversation(type, context);
      
      if (response.success) {
        const conversation = response.data;
        dispatch(addConversation(conversation));
        dispatch(setActiveConversation(conversation.id));
        navigate(`/chat/${conversation.id}`);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  // Filter conversations based on search and type
  const filteredConversations = Object.values(conversations).filter(conversation => {
    const matchesSearch = !searchQuery || 
      conversation.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.messages.some(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesFilter = conversationFilter === 'all' || 
      conversation.type === conversationFilter;
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Quick start options
  const quickStartOptions = [
    {
      title: 'Getting Started',
      description: 'Learn about IRIS+ and impact measurement basics',
      type: 'onboarding',
      context: { intent: 'onboarding' },
    },
    {
      title: 'Find Indicators',
      description: 'Discover IRIS+ indicators for your organization',
      type: 'indicator_discovery',
      context: { intent: 'indicator_search' },
    },
    {
      title: 'Measurement Help',
      description: 'Get guidance on data collection and calculation',
      type: 'measurement_guidance',
      context: { intent: 'measurement_help' },
    },
    {
      title: 'SDG Alignment',
      description: 'Align your work with Sustainable Development Goals',
      type: 'sdg_alignment',
      context: { intent: 'sdg_mapping' },
    },
  ];

  const conversationTypes = [
    { value: 'all', label: 'All Conversations' },
    { value: 'discovery', label: 'Discovery' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'indicator_discovery', label: 'Indicator Search' },
    { value: 'measurement_guidance', label: 'Measurement Help' },
    { value: 'sdg_alignment', label: 'SDG Alignment' },
  ];

  const formatConversationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // If no active conversation, show conversation list
  if (!activeConversationId || !conversations[activeConversationId]) {
    return (
      <div className="h-full flex">
        {/* Sidebar - Conversation List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold text-gray-900">Conversations</h1>
              <button
                onClick={() => createNewConversation()}
                disabled={isCreatingConversation}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Chat
              </button>
            </div>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={conversationFilter}
                onChange={(e) => setConversationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                {conversationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length > 0 ? (
              <div className="p-2 space-y-1">
                {filteredConversations.map(conversation => {
                  const lastMessage = conversation.messages[conversation.messages.length - 1];
                  
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => navigate(`/chat/${conversation.id}`)}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {conversation.title || 'New Conversation'}
                          </h3>
                          {lastMessage && (
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {lastMessage.content}
                            </p>
                          )}
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <span>{formatConversationTime(conversation.updatedAt)}</span>
                            <span className="mx-2">•</span>
                            <span>{conversation.messages.length} messages</span>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <div className={`
                            w-2 h-2 rounded-full
                            ${conversation.isActive ? 'bg-green-400' : 'bg-gray-300'}
                          `} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <History className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No conversations found</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Quick Start */}
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="max-w-2xl mx-auto p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <History className="w-8 h-8 text-blue-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Impact Bot Chat
            </h2>
            
            <p className="text-gray-600 mb-8">
              Get personalized guidance on impact measurement, discover IRIS+ indicators, 
              and learn best practices for your organization.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {quickStartOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => createNewConversation(option.type, option.context)}
                  disabled={isCreatingConversation}
                  className="p-4 bg-white border border-gray-200 rounded-lg text-left hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>

            <button
              onClick={() => createNewConversation()}
              disabled={isCreatingConversation}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              {isCreatingConversation ? 'Creating...' : 'Start New Conversation'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show chat interface for active conversation
  return (
    <div className="h-full flex">
      {/* Sidebar - Conversation List (collapsed) */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Conversations</h2>
            <button
              onClick={() => createNewConversation()}
              disabled={isCreatingConversation}
              className="flex items-center px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {Object.values(conversations).slice(0, 10).map(conversation => (
            <button
              key={conversation.id}
              onClick={() => navigate(`/chat/${conversation.id}`)}
              className={`
                w-full text-left p-2 rounded text-sm transition-colors
                ${conversation.id === activeConversationId 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'hover:bg-gray-50'
                }
              `}
            >
              <div className="font-medium truncate">
                {conversation.title || 'New Conversation'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatConversationTime(conversation.updatedAt)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col">
        <ChatInterface
          conversationId={activeConversationId}
          showRecommendations={true}
          className="h-full"
        />
      </div>
    </div>
  );
};

export default Chat;