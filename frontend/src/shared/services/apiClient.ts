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
  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
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
}

// Export singleton instance
export const apiClient = new ApiClient();
export default ApiClient;