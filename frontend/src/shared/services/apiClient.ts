import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface SearchResult {
  id: string;
  type: string;
  name: string;
  description: string;
  relevanceScore: number;
  explanation: string;
  contentMarkdown?: string;
  metadata?: Record<string, any>;
}

export interface HybridSearchParams {
  query: string;
  userContext?: {
    complexity_preference?: number;
    focus_areas?: string[];
    organization_type?: string;
  };
  searchIntent?: string;
  limit?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: `${baseURL}/api/v1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - clear token and redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.request(config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'API request failed');
    }
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<ApiResponse<{
    user: any;
    organization: any;
    token: string;
    permissions: string[];
  }>> {
    return this.request({
      method: 'POST',
      url: '/auth/login',
      data: { email, password },
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request({
      method: 'POST',
      url: '/auth/logout',
    });
  }

  async getCurrentUser(): Promise<ApiResponse<{
    user: any;
    organization: any;
    permissions: string[];
  }>> {
    return this.request({
      method: 'GET',
      url: '/auth/me',
    });
  }

  // Hybrid search endpoints
  async hybridSearch(params: HybridSearchParams): Promise<ApiResponse<SearchResult[]>> {
    return this.request({
      method: 'POST',
      url: '/search/hybrid',
      data: params,
    });
  }

  async getSearchSuggestions(query: string): Promise<ApiResponse<string[]>> {
    return this.request({
      method: 'GET',
      url: `/search/suggestions?q=${encodeURIComponent(query)}`,
    });
  }

  // Conversation endpoints
  async createConversation(type: string, initialContext?: Record<string, any>): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/conversations',
      data: { type, contextData: initialContext },
    });
  }

  async sendMessage(conversationId: string, content: string, messageType: string = 'user'): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: `/conversations/${conversationId}/messages`,
      data: { content, messageType },
    });
  }

  async getConversation(conversationId: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: `/conversations/${conversationId}`,
    });
  }

  async getConversations(limit?: number): Promise<ApiResponse<any[]>> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request({
      method: 'GET',
      url: `/conversations${params}`,
    });
  }

  // IRIS+ endpoints
  async searchIrisIndicators(query: string, filters?: Record<string, any>): Promise<ApiResponse<any[]>> {
    return this.request({
      method: 'POST',
      url: '/iris/indicators/search',
      data: { query, filters },
    });
  }

  async getIrisCategories(): Promise<ApiResponse<any[]>> {
    return this.request({
      method: 'GET',
      url: '/iris/categories',
    });
  }

  async getIrisThemes(categoryId?: string): Promise<ApiResponse<any[]>> {
    const params = categoryId ? `?categoryId=${categoryId}` : '';
    return this.request({
      method: 'GET',
      url: `/iris/themes${params}`,
    });
  }

  async getIrisGoals(themeId?: string): Promise<ApiResponse<any[]>> {
    const params = themeId ? `?themeId=${themeId}` : '';
    return this.request({
      method: 'GET',
      url: `/iris/goals${params}`,
    });
  }

  // Custom indicators endpoints
  async createCustomIndicator(data: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/indicators/custom',
      data,
    });
  }

  async getCustomIndicators(): Promise<ApiResponse<any[]>> {
    return this.request({
      method: 'GET',
      url: '/indicators/custom',
    });
  }

  async updateCustomIndicator(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'PUT',
      url: `/indicators/custom/${id}`,
      data,
    });
  }

  async deleteCustomIndicator(id: string): Promise<ApiResponse> {
    return this.request({
      method: 'DELETE',
      url: `/indicators/custom/${id}`,
    });
  }

  // Measurements endpoints
  async createMeasurement(data: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/measurements',
      data,
    });
  }

  async getMeasurements(indicatorId?: string): Promise<ApiResponse<any[]>> {
    const params = indicatorId ? `?indicatorId=${indicatorId}` : '';
    return this.request({
      method: 'GET',
      url: `/measurements${params}`,
    });
  }

  async updateMeasurement(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'PUT',
      url: `/measurements/${id}`,
      data,
    });
  }

  // Reports endpoints
  async createReport(data: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/reports',
      data,
    });
  }

  async getReports(): Promise<ApiResponse<any[]>> {
    return this.request({
      method: 'GET',
      url: '/reports',
    });
  }

  async getReport(id: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: `/reports/${id}`,
    });
  }

  async exportReport(id: string, format: string): Promise<Blob> {
    const response = await this.client.get(`/reports/${id}/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Vector search specific endpoints
  async vectorSimilaritySearch(embedding: number[], limit?: number): Promise<ApiResponse<SearchResult[]>> {
    return this.request({
      method: 'POST',
      url: '/search/vector-similarity',
      data: { embedding, limit },
    });
  }

  async generateEmbedding(text: string): Promise<ApiResponse<{ embedding: number[] }>> {
    return this.request({
      method: 'POST',
      url: '/search/generate-embedding',
      data: { text },
    });
  }

  async getContentQualityScore(contentId: string): Promise<ApiResponse<{
    qualityScore: number;
    completenessScore: number;
    clarityScore: number;
    actionabilityScore: number;
  }>> {
    return this.request({
      method: 'GET',
      url: `/content/${contentId}/quality-score`,
    });
  }

  // Foundation endpoints
  async getFoundationStatus(): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/foundation/status',
    });
  }


  async checkFeatureAccess(feature: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: `/foundation/access-check/${feature}`,
    });
  }

  async startGuidedFoundationSetup(data: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/foundation/start-guided-setup',
      data,
    });
  }

  async getFoundationProgress(): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/foundation/progress',
    });
  }

  async getFoundationRecommendations(): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/foundation/recommendations',
    });
  }

  // Organization management endpoints
  async createOrganization(data: {
    name: string;
    description?: string;
    industry?: string;
    website?: string;
  }): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/organizations',
      data,
    });
  }

  async getOrganization(organizationId: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: `/organizations/${organizationId}`,
    });
  }

  async updateOrganization(organizationId: string, data: {
    name?: string;
    description?: string;
    industry?: string;
    website?: string;
  }): Promise<ApiResponse<any>> {
    return this.request({
      method: 'PATCH',
      url: `/organizations/${organizationId}`,
      data,
    });
  }

  async getOrganizationMembers(organizationId: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: `/organizations/${organizationId}/members`,
    });
  }

  async inviteOrganizationMember(organizationId: string, data: {
    email: string;
    roleId: string;
    message?: string;
  }): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: `/organizations/${organizationId}/members/invite`,
      data,
    });
  }

  async updateMemberRole(organizationId: string, userId: string, data: {
    roleId: string;
  }): Promise<ApiResponse<any>> {
    return this.request({
      method: 'PATCH',
      url: `/organizations/${organizationId}/members/${userId}/role`,
      data,
    });
  }

  async removeMember(organizationId: string, userId: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'DELETE',
      url: `/organizations/${organizationId}/members/${userId}`,
    });
  }

  async getOrganizationSettings(organizationId: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: `/organizations/${organizationId}/settings`,
    });
  }

  async updateOrganizationSettings(organizationId: string, data: {
    allowPublicReports?: boolean;
    notificationPreferences?: Record<string, any>;
  }): Promise<ApiResponse<any>> {
    return this.request({
      method: 'PATCH',
      url: `/organizations/${organizationId}/settings`,
      data,
    });
  }

  // Theory of Change endpoints
  async getTheoryOfChangePathwayAssessment(hasDocuments: boolean, hasPartialTheory: boolean): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: `/theory-of-change/pathway-assessment?hasDocuments=${hasDocuments}&hasPartialTheory=${hasPartialTheory}`,
    });
  }

  async getTheoryOfChange(organizationId: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/theory-of-change',
    });
  }

  async uploadTheoryOfChangeDocuments(organizationId: string, documents: Array<{
    filename: string;
    content: string;
    type: string;
  }>): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/theory-of-change/upload-documents',
      data: { documents },
    });
  }

  async startTheoryOfChangeConversation(organizationId: string, partialTheory?: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/theory-of-change/guided-conversation/start',
      data: { partialTheory },
    });
  }

  async continueTheoryOfChangeConversation(conversationId: string, userResponse: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/theory-of-change/guided-conversation/continue',
      data: { conversationId, userResponse },
    });
  }

  async getFoundationReadiness(organizationId: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/theory-of-change/foundation-readiness',
    });
  }

  async updateTheoryOfChange(organizationId: string, theoryData: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'PUT',
      url: '/theory-of-change/update',
      data: theoryData,
    });
  }

  async validateTheoryOfChange(data: { theory: any }): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/theory-of-change/validate',
      data,
    });
  }

  async assessFoundationReadiness(): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/theory-of-change/foundation-readiness',
    });
  }

  // Warning system endpoints
  async getWarningPreview(triggerAction: string, context: Record<string, any>): Promise<ApiResponse<{
    warnings: any[];
    shouldBlock: boolean;
    allowContinue: boolean;
    contextualGuidance: string;
  }>> {
    return this.request({
      method: 'POST',
      url: '/warnings/preview',
      data: { triggerAction, context },
    });
  }

  async recordWarningInteraction(warningId: string, action: string): Promise<ApiResponse<void>> {
    return this.request({
      method: 'POST',
      url: `/warnings/${warningId}/interact`,
      data: { action },
    });
  }

  // AI Personality endpoints
  async getAvailablePersonalities(): Promise<ApiResponse<any[]>> {
    return this.request({
      method: 'GET',
      url: '/ai-personalities/personalities',
    });
  }

  async selectPersonalityForContext(context: {
    userRole: string;
    currentPhase: string;
    foundationReadiness: number;
    conversationHistory?: any[];
    currentTask?: string;
    urgencyLevel?: 'low' | 'medium' | 'high';
    complexityLevel?: 'beginner' | 'intermediate' | 'advanced';
    previousInteractions?: any[];
  }): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/ai-personalities/select-personality',
      data: context,
    });
  }

  async generatePersonalityResponse(
    personalityId: string,
    userMessage: string,
    context: any
  ): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/ai-personalities/generate-response',
      data: { personalityId, userMessage, context },
    });
  }

  async getPersonalityById(personalityId: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: `/ai-personalities/personalities/${personalityId}`,
    });
  }

  async getPersonalityRecommendations(params?: {
    phase?: string;
    foundationReadiness?: number;
    taskContext?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.phase) queryParams.append('phase', params.phase);
    if (params?.foundationReadiness !== undefined) queryParams.append('foundationReadiness', params.foundationReadiness.toString());
    if (params?.taskContext) queryParams.append('taskContext', params.taskContext);

    return this.request({
      method: 'GET',
      url: `/ai-personalities/recommendations${queryParams.toString() ? `?${  queryParams.toString()}` : ''}`,
    });
  }

  async getPersonalityAnalytics(): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/ai-personalities/analytics',
    });
  }

  async recordPersonalityFeedback(data: {
    personalityId: string;
    interactionId: string;
    rating: number;
    feedback?: string;
    effectiveness?: number;
    context?: any;
  }): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/ai-personalities/feedback',
      data,
    });
  }

  async testPersonalityResponses(testScenarios: any[]): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/ai-personalities/test-responses',
      data: { testScenarios },
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default ApiClient;