/**
 * Adaptive Recommendations Hook
 * ML-powered indicator recommendations with organizational learning and context awareness
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../shared/store/store';
import { apiClient } from '../../../shared/services/apiClient';
import { useAuth } from '../../../shared/hooks/useAuth';
import {
  AdaptiveRecommendation,
  EnhancedIrisIndicator,
  AISearchContext,
  OrganizationalLearning,
  ContextFactor,
  RecommendationType
} from '../types/enhancedTypes';

interface UseAdaptiveRecommendationsOptions {
  enableRealTimeUpdates?: boolean;
  maxRecommendations?: number;
  confidenceThreshold?: number;
  learningEnabled?: boolean;
  contextAwareness?: boolean;
}

interface RecommendationState {
  recommendations: AdaptiveRecommendation[];
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  lastUpdate: Date | null;
  
  // Learning and adaptation
  organizationalLearning: OrganizationalLearning[];
  contextFactors: ContextFactor[];
  adaptationInsights: string[];
  
  // Performance metrics
  recommendationAccuracy: number;
  userSatisfaction: number;
  adoptionRate: number;
}

interface RecommendationRequest {
  selectedIndicators: EnhancedIrisIndicator[];
  searchContext: AISearchContext;
  userIntent: string;
  priorityTypes: RecommendationType[];
  excludeTypes?: RecommendationType[];
}

export const useAdaptiveRecommendations = (options: UseAdaptiveRecommendationsOptions = {}) => {
  const {
    enableRealTimeUpdates = true,
    maxRecommendations = 10,
    confidenceThreshold = 0.6,
    learningEnabled = true,
    contextAwareness = true
  } = options;

  const dispatch = useDispatch();
  const { getOrganizationContext, user } = useAuth();
  
  const [state, setState] = useState<RecommendationState>({
    recommendations: [],
    isLoading: false,
    isAnalyzing: false,
    error: null,
    lastUpdate: null,
    organizationalLearning: [],
    contextFactors: [],
    adaptationInsights: [],
    recommendationAccuracy: 0,
    userSatisfaction: 0,
    adoptionRate: 0
  });

  const learningHistory = useRef<Map<string, any>>(new Map());
  const feedbackHistory = useRef<Map<string, any>>(new Map());
  const contextCache = useRef<Map<string, any>>(new Map());

  // Generate adaptive recommendations
  const generateRecommendations = useCallback(async (
    request: RecommendationRequest
  ): Promise<AdaptiveRecommendation[]> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Prepare enhanced context with organizational learning
      const enhancedContext = {
        ...request.searchContext,
        organizationalContext: getOrganizationContext(),
        learningHistory: Array.from(learningHistory.current.values()),
        feedbackHistory: Array.from(feedbackHistory.current.values()),
        userPreferences: getUserPreferences(),
        adaptationInsights: state.adaptationInsights
      };

      // Call adaptive recommendation API
      const response = await apiClient.request({
        method: 'POST',
        url: '/indicators/adaptive-recommendations',
        data: {
          selectedIndicators: request.selectedIndicators,
          searchContext: enhancedContext,
          userIntent: request.userIntent,
          priorityTypes: request.priorityTypes,
          excludeTypes: request.excludeTypes,
          options: {
            maxRecommendations,
            confidenceThreshold,
            enableLearning: learningEnabled,
            enableContextAwareness: contextAwareness
          }
        }
      });

      if (response.success) {
        const responseData = response.data as any;
        const recommendations = responseData?.recommendations || [];
        const learningInsights = responseData?.learningInsights || [];
        const contextFactors = responseData?.contextFactors || [];

        setState(prev => ({
          ...prev,
          recommendations: recommendations.filter((r: AdaptiveRecommendation) => 
            r.confidenceScore >= confidenceThreshold
          ),
          organizationalLearning: responseData?.organizationalLearning || prev.organizationalLearning,
          contextFactors,
          adaptationInsights: learningInsights,
          lastUpdate: new Date(),
          isLoading: false
        }));

        // Cache learning insights
        if (learningEnabled && learningInsights.length > 0) {
          learningInsights.forEach((insight: any) => {
            learningHistory.current.set(insight.id, insight);
          });
        }

        return recommendations;
      } else {
        throw new Error(response.message || 'Failed to generate recommendations');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to generate recommendations',
        isLoading: false
      }));
      throw error;
    }
  }, [getOrganizationContext, maxRecommendations, confidenceThreshold, learningEnabled, contextAwareness, state.adaptationInsights]);

  // Get contextual recommendations based on current portfolio
  const getContextualRecommendations = useCallback(async (
    selectedIndicators: EnhancedIrisIndicator[],
    currentContext?: Partial<AISearchContext>
  ) => {
    const baseContext: AISearchContext = {
      organizationType: 'nonprofit',
      sector: 'general',
      foundationLevel: 'intermediate',
      currentGoals: [],
      stakeholderPriorities: [],
      resourceConstraints: [],
      previousIndicators: selectedIndicators.map(i => i.id),
      userBehaviorPatterns: [],
      organizationalPreferences: [],
      successPatterns: [],
      ...currentContext
    };

    const request: RecommendationRequest = {
      selectedIndicators,
      searchContext: baseContext,
      userIntent: 'portfolio_optimization',
      priorityTypes: ['portfolio_balance', 'decision_alignment', 'peer_benchmark']
    };

    return generateRecommendations(request);
  }, [generateRecommendations, user]);

  // Get IRIS+ gap recommendations
  const getIrisGapRecommendations = useCallback(async (
    selectedIndicators: EnhancedIrisIndicator[]
  ) => {
    setState(prev => ({ ...prev, isAnalyzing: true }));

    try {
      const response = await apiClient.request({
        method: 'POST',
        url: '/indicators/iris-gap-analysis',
        data: {
          selectedIndicators,
          organizationContext: getOrganizationContext()
        }
      });

      if (response.success) {
        const responseData = response.data as any;
        const gapRecommendations = responseData?.gapRecommendations || [];
        
        setState(prev => ({
          ...prev,
          recommendations: [
            ...prev.recommendations.filter(r => r.type !== 'foundation_gap'),
            ...gapRecommendations
          ],
          isAnalyzing: false
        }));

        return gapRecommendations;
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to analyze IRIS+ gaps',
        isAnalyzing: false
      }));
    }

    return [];
  }, [getOrganizationContext]);

  // Get peer benchmarking recommendations
  const getPeerBenchmarkingRecommendations = useCallback(async (
    selectedIndicators: EnhancedIrisIndicator[]
  ) => {
    try {
      const response = await apiClient.request({
        method: 'POST',
        url: '/indicators/peer-benchmarking',
        data: {
          selectedIndicators,
          organizationProfile: {
            type: 'nonprofit',
            sector: 'general',
            size: 'medium',
            geography: 'global'
          }
        }
      });

      if (response.success) {
        const responseData = response.data as any;
        const peerRecommendations = responseData?.recommendations || [];
        
        setState(prev => ({
          ...prev,
          recommendations: [
            ...prev.recommendations.filter(r => r.type !== 'peer_benchmark'),
            ...peerRecommendations
          ]
        }));

        return peerRecommendations;
      }
    } catch (error: any) {
      console.warn('Peer benchmarking failed:', error);
    }

    return [];
  }, [user?.organizationId]);

  // Record recommendation feedback for learning
  const recordRecommendationFeedback = useCallback(async (
    recommendationId: string,
    feedback: {
      rating: number;
      usefulness: 'very_useful' | 'useful' | 'somewhat_useful' | 'not_useful';
      followedRecommendation: boolean;
      comments?: string;
      improvementSuggestions?: string[];
    }
  ) => {
    try {
      // Store feedback locally for immediate learning
      feedbackHistory.current.set(recommendationId, {
        ...feedback,
        timestamp: new Date(),
        userId: user?.id,
        organizationId: user?.organizationId
      });

      // Send to API for broader learning
      await apiClient.request({
        method: 'POST',
        url: `/indicators/recommendations/${recommendationId}/feedback`,
        data: feedback
      });

      // Update local state
      setState(prev => ({
        ...prev,
        recommendations: prev.recommendations.map(rec => 
          rec.id === recommendationId 
            ? { 
                ...rec, 
                userFeedback: {
                  ...feedback,
                  comments: feedback.comments || '',
                  improvementSuggestions: feedback.improvementSuggestions || []
                }
              }
            : rec
        )
      }));

      // Trigger learning adaptation
      if (learningEnabled) {
        await triggerLearningAdaptation();
      }
    } catch (error: any) {
      console.warn('Failed to record feedback:', error);
    }
  }, [user, learningEnabled]);

  // Trigger learning adaptation based on feedback
  const triggerLearningAdaptation = useCallback(async () => {
    if (!learningEnabled) return;

    try {
      const response = await apiClient.request({
        method: 'POST',
        url: '/indicators/learning-adaptation',
        data: {
          feedbackHistory: Array.from(feedbackHistory.current.values()),
          organizationContext: getOrganizationContext(),
          userContext: {
            userId: user?.id,
            role: 'admin', // Default role
            experienceLevel: 'intermediate' // Default experience level
          }
        }
      });

      if (response.success) {
        const responseData = response.data as any;
        const adaptationInsights = responseData?.adaptationInsights || [];
        const organizationalLearning = responseData?.organizationalLearning || [];

        setState(prev => ({
          ...prev,
          adaptationInsights,
          organizationalLearning: [
            ...prev.organizationalLearning,
            ...organizationalLearning
          ],
          recommendationAccuracy: responseData?.metrics?.accuracy || prev.recommendationAccuracy,
          userSatisfaction: responseData?.metrics?.satisfaction || prev.userSatisfaction,
          adoptionRate: responseData?.metrics?.adoptionRate || prev.adoptionRate
        }));
      }
    } catch (error: any) {
      console.warn('Learning adaptation failed:', error);
    }
  }, [learningEnabled, getOrganizationContext, user]);

  // Get user preferences from interaction history
  const getUserPreferences = useCallback(() => {
    const preferences: any = {};
    
    // Analyze feedback history for patterns
    Array.from(feedbackHistory.current.values()).forEach((feedback: any) => {
      if (feedback.followedRecommendation && feedback.usefulness === 'very_useful') {
        // Extract preference patterns
        const recommendationType = feedback.recommendationType;
        if (!preferences[recommendationType]) {
          preferences[recommendationType] = { count: 0, satisfaction: 0 };
        }
        preferences[recommendationType].count++;
        preferences[recommendationType].satisfaction += feedback.rating;
      }
    });

    // Calculate preference strengths
    Object.keys(preferences).forEach(type => {
      preferences[type].strength = preferences[type].satisfaction / preferences[type].count;
    });

    return preferences;
  }, []);

  // Real-time updates based on user interactions
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    const handleUserInteraction = (event: CustomEvent) => {
      const { type, data } = event.detail;
      
      if (type === 'indicator_selected' || type === 'indicator_deselected') {
        // Trigger contextual recommendations update
        const selectedIndicators = data.selectedIndicators || [];
        getContextualRecommendations(selectedIndicators);
      }
    };

    document.addEventListener('indicator_interaction', handleUserInteraction as EventListener);

    return () => {
      document.removeEventListener('indicator_interaction', handleUserInteraction as EventListener);
    };
  }, [enableRealTimeUpdates, getContextualRecommendations]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Save learning history to localStorage for persistence
      if (learningEnabled && learningHistory.current.size > 0) {
        try {
          localStorage.setItem(
            `indicator_learning_${user?.organizationId || 'default'}`,
            JSON.stringify(Array.from(learningHistory.current.entries()))
          );
        } catch (error) {
          console.warn('Failed to save learning history:', error);
        }
      }
    };
  }, [learningEnabled, user?.organizationId]);

  // Load learning history from localStorage
  useEffect(() => {
    if (learningEnabled && user?.organizationId) {
      try {
        const savedLearning = localStorage.getItem(`indicator_learning_${user.organizationId}`);
        if (savedLearning) {
          const entries = JSON.parse(savedLearning);
          learningHistory.current = new Map(entries);
        }
      } catch (error) {
        console.warn('Failed to load learning history:', error);
      }
    }
  }, [learningEnabled, user?.organizationId]);

  return {
    // State
    recommendations: state.recommendations,
    isLoading: state.isLoading,
    isAnalyzing: state.isAnalyzing,
    error: state.error,
    lastUpdate: state.lastUpdate,
    
    // Learning insights
    organizationalLearning: state.organizationalLearning,
    contextFactors: state.contextFactors,
    adaptationInsights: state.adaptationInsights,
    
    // Performance metrics
    recommendationAccuracy: state.recommendationAccuracy,
    userSatisfaction: state.userSatisfaction,
    adoptionRate: state.adoptionRate,
    
    // Actions
    generateRecommendations,
    getContextualRecommendations,
    getIrisGapRecommendations,
    getPeerBenchmarkingRecommendations,
    recordRecommendationFeedback,
    triggerLearningAdaptation,
    
    // Utilities
    clearRecommendations: () => setState(prev => ({ 
      ...prev, 
      recommendations: [],
      error: null 
    })),
    refreshRecommendations: () => {
      if (state.recommendations.length > 0) {
        // Re-generate with current context
        const lastContext = contextCache.current.get('last_context');
        if (lastContext) {
          generateRecommendations(lastContext);
        }
      }
    }
  };
};