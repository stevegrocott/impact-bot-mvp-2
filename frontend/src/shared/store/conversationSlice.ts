import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Message {
  id: string;
  conversationId: string;
  messageType: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  relevanceScore?: number;
  explanation?: string;
  tokensUsed?: number;
  processingTimeMs?: number;
  createdAt: string;
}

interface Recommendation {
  id: string;
  type: string;
  itemId: string;
  itemType: string;
  confidenceScore: number;
  reasoning: string;
  userFeedback?: 'helpful' | 'not_helpful' | 'irrelevant';
  feedbackNotes?: string;
}

interface Conversation {
  id: string;
  title?: string;
  type: string;
  contextData: Record<string, any>;
  currentStep?: string;
  completionPercentage: number;
  isActive: boolean;
  messages: Message[];
  recommendations: Recommendation[];
  createdAt: string;
  updatedAt: string;
}

interface ConversationState {
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  contextCache: Record<string, any>;
}

const initialState: ConversationState = {
  conversations: {},
  activeConversationId: null,
  isLoading: false,
  isTyping: false,
  error: null,
  contextCache: {},
};

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string>) => {
      state.activeConversationId = action.payload;
    },
    addConversation: (state, action: PayloadAction<Conversation>) => {
      state.conversations[action.payload.id] = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const conversationId = action.payload.conversationId;
      if (state.conversations[conversationId]) {
        state.conversations[conversationId].messages.push(action.payload);
        state.conversations[conversationId].updatedAt = new Date().toISOString();
      }
    },
    updateMessage: (state, action: PayloadAction<{ id: string; updates: Partial<Message> }>) => {
      const { id, updates } = action.payload;
      Object.values(state.conversations).forEach(conversation => {
        const messageIndex = conversation.messages.findIndex(m => m.id === id);
        if (messageIndex !== -1) {
          conversation.messages[messageIndex] = { ...conversation.messages[messageIndex], ...updates };
        }
      });
    },
    addRecommendation: (state, action: PayloadAction<{ conversationId: string; recommendation: Recommendation }>) => {
      const { conversationId, recommendation } = action.payload;
      if (state.conversations[conversationId]) {
        state.conversations[conversationId].recommendations.push(recommendation);
      }
    },
    updateRecommendationFeedback: (state, action: PayloadAction<{
      recommendationId: string;
      feedback: 'helpful' | 'not_helpful' | 'irrelevant';
      notes?: string;
    }>) => {
      const { recommendationId, feedback, notes } = action.payload;
      Object.values(state.conversations).forEach(conversation => {
        const recommendation = conversation.recommendations.find(r => r.id === recommendationId);
        if (recommendation) {
          recommendation.userFeedback = feedback;
          recommendation.feedbackNotes = notes;
        }
      });
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateContextCache: (state, action: PayloadAction<Record<string, any>>) => {
      state.contextCache = { ...state.contextCache, ...action.payload };
    },
    clearContextCache: (state) => {
      state.contextCache = {};
    },
  },
});

export const {
  setActiveConversation,
  addConversation,
  addMessage,
  updateMessage,
  addRecommendation,
  updateRecommendationFeedback,
  setTyping,
  setLoading,
  setError,
  updateContextCache,
  clearContextCache,
} = conversationSlice.actions;

export default conversationSlice.reducer;