import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../services/apiClient';
import {
  AIPersonality,
  PersonalitySelection,
  PersonalityResponse,
  PersonalityRecommendation,
  PersonalityAnalytics,
  AIPersonalityUIState,
  ConversationContext,
  PersonalityInteractionState
} from '../types/aiPersonality';

// Async thunks for API calls
export const fetchAvailablePersonalities = createAsyncThunk(
  'aiPersonality/fetchAvailablePersonalities',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getAvailablePersonalities();
      return (response.data as any)?.personalities || response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const selectPersonalityForContext = createAsyncThunk(
  'aiPersonality/selectPersonalityForContext',
  async (context: Partial<ConversationContext>, { rejectWithValue }) => {
    try {
      const response = await apiClient.selectPersonalityForContext(context as any);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const generatePersonalityResponse = createAsyncThunk(
  'aiPersonality/generatePersonalityResponse',
  async (
    params: { personalityId: string; userMessage: string; context: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.generatePersonalityResponse(
        params.personalityId,
        params.userMessage,
        params.context
      );
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPersonalityRecommendations = createAsyncThunk(
  'aiPersonality/fetchPersonalityRecommendations',
  async (
    params: { phase?: string; foundationReadiness?: number; taskContext?: string } | void,
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.getPersonalityRecommendations(params || {});
      return response.data.recommendations || response.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPersonalityAnalytics = createAsyncThunk(
  'aiPersonality/fetchPersonalityAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getPersonalityAnalytics();
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const recordPersonalityFeedback = createAsyncThunk(
  'aiPersonality/recordPersonalityFeedback',
  async (
    feedbackData: {
      personalityId: string;
      interactionId: string;
      rating: number;
      feedback?: string;
      effectiveness?: number;
      context?: any;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.recordPersonalityFeedback(feedbackData);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const initialInteractionState: PersonalityInteractionState = {
  currentPersonality: null,
  isSelecting: false,
  isGenerating: false,
  contextualAwareness: {
    learningPatterns: [],
    adaptationInsights: [],
    confidenceLevel: 0.5,
    userBehaviorPatterns: []
  },
  realTimeGuidance: {
    activeGuidance: [],
    preventionWarnings: [],
    opportunityAlerts: []
  },
  interactionMetrics: {
    responseTime: 0,
    userEngagement: 0,
    taskCompletion: 0,
    satisfactionScore: 0
  }
};

const initialState: AIPersonalityUIState = {
  availablePersonalities: [],
  selectedPersonality: null,
  personalitySelection: null,
  recommendations: [],
  analytics: null,
  isLoading: false,
  isGenerating: false,
  error: null,
  interactionState: initialInteractionState,
  visualState: {
    showPersonalitySwitch: false,
    showAnalytics: false,
    showRecommendations: true,
    activeVisualization: 'chat'
  }
};

const aiPersonalitySlice = createSlice({
  name: 'aiPersonality',
  initialState,
  reducers: {
    setSelectedPersonality: (state, action: PayloadAction<AIPersonality>) => {
      state.selectedPersonality = action.payload;
      state.interactionState.currentPersonality = action.payload;
    },
    clearPersonalitySelection: (state) => {
      state.personalitySelection = null;
      state.selectedPersonality = null;
      state.interactionState.currentPersonality = null;
    },
    updateInteractionMetrics: (state, action: PayloadAction<Partial<PersonalityInteractionState['interactionMetrics']>>) => {
      state.interactionState.interactionMetrics = {
        ...state.interactionState.interactionMetrics,
        ...action.payload
      };
    },
    addLearningPattern: (state, action: PayloadAction<string>) => {
      if (!state.interactionState.contextualAwareness.learningPatterns.includes(action.payload)) {
        state.interactionState.contextualAwareness.learningPatterns.push(action.payload);
      }
    },
    addAdaptationInsight: (state, action: PayloadAction<string>) => {
      if (!state.interactionState.contextualAwareness.adaptationInsights.includes(action.payload)) {
        state.interactionState.contextualAwareness.adaptationInsights.push(action.payload);
      }
    },
    updateConfidenceLevel: (state, action: PayloadAction<number>) => {
      state.interactionState.contextualAwareness.confidenceLevel = action.payload;
    },
    addRealTimeGuidance: (state, action: PayloadAction<{ type: 'guidance' | 'warning' | 'opportunity'; message: string }>) => {
      const { type, message } = action.payload;
      switch (type) {
        case 'guidance':
          if (!state.interactionState.realTimeGuidance.activeGuidance.includes(message)) {
            state.interactionState.realTimeGuidance.activeGuidance.push(message);
          }
          break;
        case 'warning':
          if (!state.interactionState.realTimeGuidance.preventionWarnings.includes(message)) {
            state.interactionState.realTimeGuidance.preventionWarnings.push(message);
          }
          break;
        case 'opportunity':
          if (!state.interactionState.realTimeGuidance.opportunityAlerts.includes(message)) {
            state.interactionState.realTimeGuidance.opportunityAlerts.push(message);
          }
          break;
      }
    },
    clearRealTimeGuidance: (state, action: PayloadAction<'guidance' | 'warning' | 'opportunity'>) => {
      switch (action.payload) {
        case 'guidance':
          state.interactionState.realTimeGuidance.activeGuidance = [];
          break;
        case 'warning':
          state.interactionState.realTimeGuidance.preventionWarnings = [];
          break;
        case 'opportunity':
          state.interactionState.realTimeGuidance.opportunityAlerts = [];
          break;
      }
    },
    setVisualState: (state, action: PayloadAction<Partial<AIPersonalityUIState['visualState']>>) => {
      state.visualState = {
        ...state.visualState,
        ...action.payload
      };
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    startPersonalitySelection: (state) => {
      state.interactionState.isSelecting = true;
    },
    stopPersonalitySelection: (state) => {
      state.interactionState.isSelecting = false;
    },
    startResponseGeneration: (state) => {
      state.isGenerating = true;
      state.interactionState.isGenerating = true;
    },
    stopResponseGeneration: (state) => {
      state.isGenerating = false;
      state.interactionState.isGenerating = false;
    },
    addUserBehaviorPattern: (state, action: PayloadAction<string>) => {
      if (!state.interactionState.contextualAwareness.userBehaviorPatterns.includes(action.payload)) {
        state.interactionState.contextualAwareness.userBehaviorPatterns.push(action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch available personalities
    builder
      .addCase(fetchAvailablePersonalities.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailablePersonalities.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availablePersonalities = action.payload;
      })
      .addCase(fetchAvailablePersonalities.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Select personality for context
    builder
      .addCase(selectPersonalityForContext.pending, (state) => {
        state.interactionState.isSelecting = true;
        state.error = null;
      })
      .addCase(selectPersonalityForContext.fulfilled, (state, action) => {
        state.interactionState.isSelecting = false;
        state.personalitySelection = action.payload;
        state.selectedPersonality = action.payload.selectedPersonality;
        state.interactionState.currentPersonality = action.payload.selectedPersonality;
        state.interactionState.contextualAwareness.confidenceLevel = action.payload.confidence;
      })
      .addCase(selectPersonalityForContext.rejected, (state, action) => {
        state.interactionState.isSelecting = false;
        state.error = action.payload as string;
      });

    // Generate personality response
    builder
      .addCase(generatePersonalityResponse.pending, (state) => {
        state.isGenerating = true;
        state.interactionState.isGenerating = true;
        state.error = null;
      })
      .addCase(generatePersonalityResponse.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.interactionState.isGenerating = false;
        const response = action.payload as PersonalityResponse;
        
        // Update contextual awareness based on response
        if (response.adaptationNotes) {
          response.adaptationNotes.forEach(note => {
            if (!state.interactionState.contextualAwareness.adaptationInsights.includes(note)) {
              state.interactionState.contextualAwareness.adaptationInsights.push(note);
            }
          });
        }
        
        // Update confidence level
        state.interactionState.contextualAwareness.confidenceLevel = response.confidenceLevel;
        
        // Add real-time guidance
        if (response.pitfallWarnings) {
          response.pitfallWarnings.forEach(warning => {
            if (!state.interactionState.realTimeGuidance.preventionWarnings.includes(warning)) {
              state.interactionState.realTimeGuidance.preventionWarnings.push(warning);
            }
          });
        }
        
        if (response.contextualHelp) {
          response.contextualHelp.forEach(help => {
            if (!state.interactionState.realTimeGuidance.activeGuidance.includes(help)) {
              state.interactionState.realTimeGuidance.activeGuidance.push(help);
            }
          });
        }
      })
      .addCase(generatePersonalityResponse.rejected, (state, action) => {
        state.isGenerating = false;
        state.interactionState.isGenerating = false;
        state.error = action.payload as string;
      });

    // Fetch personality recommendations
    builder
      .addCase(fetchPersonalityRecommendations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPersonalityRecommendations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recommendations = action.payload;
      })
      .addCase(fetchPersonalityRecommendations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch personality analytics
    builder
      .addCase(fetchPersonalityAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPersonalityAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchPersonalityAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Record personality feedback
    builder
      .addCase(recordPersonalityFeedback.fulfilled, (state, action) => {
        // Update interaction metrics based on feedback
        const feedback = action.payload;
        if (feedback.rating !== undefined) {
          state.interactionState.interactionMetrics.satisfactionScore = feedback.rating;
        }
        if (feedback.effectiveness !== undefined) {
          state.interactionState.interactionMetrics.userEngagement = feedback.effectiveness;
        }
      });
  }
});

export const {
  setSelectedPersonality,
  clearPersonalitySelection,
  updateInteractionMetrics,
  addLearningPattern,
  addAdaptationInsight,
  updateConfidenceLevel,
  addRealTimeGuidance,
  clearRealTimeGuidance,
  setVisualState,
  setError,
  startPersonalitySelection,
  stopPersonalitySelection,
  startResponseGeneration,
  stopResponseGeneration,
  addUserBehaviorPattern
} = aiPersonalitySlice.actions;

export default aiPersonalitySlice.reducer;