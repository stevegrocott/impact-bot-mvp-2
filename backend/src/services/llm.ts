/**
 * LLM Service
 * Anthropic Claude integration with conversation management and caching
 */

import Anthropic from 'anthropic';
import { config } from '@/config/environment';
import { cacheService } from './cache';
import { logger, LLMLogger, PerformanceLogger } from '@/utils/logger';
import { LLMError, ExternalServiceError } from '@/utils/errors';

interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

interface LLMResponse {
  content: string;
  tokensUsed: number;
  processingTime: number;
  model: string;
  finishReason: string;
  metadata?: Record<string, any>;
}

interface ConversationContext {
  conversationId: string;
  userId: string;
  organizationId: string;
  messages: LLMMessage[];
  contextData?: Record<string, any>;
}

interface RecommendationRequest {
  organizationDescription: string;
  industry?: string;
  impactAreas?: string[];
  existingMetrics?: string[];
  constraints?: {
    complexity?: 'basic' | 'intermediate' | 'advanced';
    timeline?: string;
    budget?: string;
    teamSize?: number;
  };
}

export class LLMService {
  private client: Anthropic;
  private readonly model = 'claude-3-sonnet-20240229';
  private readonly maxTokens = config.LLM_MAX_TOKENS;
  private readonly temperature = config.LLM_TEMPERATURE;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Send a message to Claude with conversation context
   */
  async sendMessage(
    messages: LLMMessage[],
    systemPrompt?: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      stopSequences?: string[];
    }
  ): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      // Format messages for Anthropic API
      const anthropicMessages = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));

      // Create request
      const request: Anthropic.MessageCreateParams = {
        model: this.model,
        max_tokens: options?.maxTokens || this.maxTokens,
        temperature: options?.temperature || this.temperature,
        messages: anthropicMessages,
        system: systemPrompt,
        stop_sequences: options?.stopSequences
      };

      // Log request (without full content for privacy)
      logger.debug('LLM request initiated', {
        model: this.model,
        messageCount: anthropicMessages.length,
        maxTokens: request.max_tokens,
        temperature: request.temperature,
        hasSystemPrompt: !!systemPrompt
      });

      // Make API call
      const response = await this.client.messages.create(request);

      const processingTime = Date.now() - startTime;
      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';

      // Prepare response
      const llmResponse: LLMResponse = {
        content,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        processingTime,
        model: response.model,
        finishReason: response.stop_reason || 'unknown',
        metadata: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          requestId: response.id
        }
      };

      // Log performance metrics
      LLMLogger.logPerformance(
        'message_completion',
        llmResponse.tokensUsed,
        processingTime,
        this.model
      );

      return llmResponse;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      if (error instanceof Anthropic.APIError) {
        logger.error('Anthropic API error', {
          status: error.status,
          message: error.message,
          type: error.type,
          processingTime
        });
        
        throw new LLMError(
          `Anthropic API error: ${error.message}`,
          'anthropic',
          0
        );
      }
      
      logger.error('LLM service error', { error, processingTime });
      throw new ExternalServiceError(
        'LLM service unavailable',
        'anthropic',
        error as Error
      );
    }
  }

  /**
   * Generate IRIS+ recommendations based on organization description
   */
  async generateIrisRecommendations(
    request: RecommendationRequest,
    irisContext: string
  ): Promise<{
    recommendations: any[];
    reasoning: string;
    confidence: number;
  }> {
    const systemPrompt = `You are an expert in impact measurement using the IRIS+ framework. Your role is to analyze organizations and recommend the most appropriate strategic goals, indicators, and data requirements.

## IRIS+ Framework Context:
${irisContext}

## Your Task:
1. Analyze the organization description and context
2. Recommend 3-5 most relevant strategic goals from the IRIS+ framework
3. For each goal, suggest 2-3 key indicators
4. Provide implementation guidance based on constraints
5. Explain your reasoning and assign confidence scores

## Response Format:
Provide a JSON response with this structure:
{
  "recommendations": [
    {
      "strategicGoal": "Goal name from IRIS+",
      "goalId": "ID if known",
      "relevanceScore": 0.85,
      "indicators": [
        {
          "name": "Indicator name",
          "indicatorId": "ID if known", 
          "priority": "high|medium|low",
          "complexity": "basic|intermediate|advanced",
          "dataRequirements": ["list", "of", "data", "needed"]
        }
      ],
      "implementationNotes": "Specific guidance for this organization"
    }
  ],
  "reasoning": "Detailed explanation of why these recommendations fit",
  "overallConfidence": 0.82,
  "implementationPriority": ["goal1", "goal2", "goal3"],
  "nextSteps": "Actionable next steps for the organization"
}

Be specific, practical, and ensure all recommendations come from the actual IRIS+ framework provided.`;

    const userMessage = `Please analyze this organization and provide IRIS+ recommendations:

**Organization Description:** ${request.organizationDescription}

**Additional Context:**
- Industry: ${request.industry || 'Not specified'}
- Impact Areas of Interest: ${request.impactAreas?.join(', ') || 'Not specified'}
- Existing Metrics: ${request.existingMetrics?.join(', ') || 'None specified'}

**Constraints:**
- Complexity Level: ${request.constraints?.complexity || 'intermediate'}
- Timeline: ${request.constraints?.timeline || 'Not specified'}
- Team Size: ${request.constraints?.teamSize || 'Not specified'}

Please provide specific IRIS+ recommendations with implementation guidance.`;

    const messages: LLMMessage[] = [
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await this.sendMessage(messages, systemPrompt, {
        maxTokens: 4000,
        temperature: 0.1 // Lower temperature for more consistent recommendations
      });

      // Parse JSON response
      let parsedResponse;
      try {
        // Extract JSON from response if it's wrapped in text
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : response.content;
        parsedResponse = JSON.parse(jsonString);
      } catch (parseError) {
        logger.warn('Failed to parse LLM JSON response, using fallback', {
          content: response.content.substring(0, 500)
        });
        
        // Fallback response structure
        parsedResponse = {
          recommendations: [],
          reasoning: response.content,
          overallConfidence: 0.5
        };
      }

      return {
        recommendations: parsedResponse.recommendations || [],
        reasoning: parsedResponse.reasoning || response.content,
        confidence: parsedResponse.overallConfidence || 0.5
      };

    } catch (error) {
      logger.error('Failed to generate IRIS+ recommendations', { error, request });
      throw error;
    }
  }

  /**
   * Continue a conversation with context awareness
   */
  async continueConversation(
    context: ConversationContext,
    newMessage: string
  ): Promise<LLMResponse> {
    try {
      // Build conversation history
      const messages: LLMMessage[] = [
        ...context.messages,
        { role: 'user', content: newMessage }
      ];

      // Truncate messages if too long (keep context limit)
      const truncatedMessages = this.truncateConversation(messages, config.CONVERSATION_CONTEXT_LIMIT);

      // Create system prompt with organization context
      const systemPrompt = this.buildConversationSystemPrompt(context);

      // Cache key for conversation context
      const cacheKey = `conversation:${context.conversationId}:context`;
      
      // Get response
      const response = await this.sendMessage(truncatedMessages, systemPrompt);

      // Log conversation message
      LLMLogger.logConversation(
        context.conversationId,
        'user',
        newMessage
      );
      
      LLMLogger.logConversation(
        context.conversationId,
        'assistant',
        response.content,
        { tokensUsed: response.tokensUsed, processingTime: response.processingTime }
      );

      // Update cached conversation context
      const updatedMessages = [
        ...truncatedMessages,
        { role: 'assistant' as const, content: response.content }
      ];
      
      await cacheService.set(cacheKey, {
        ...context,
        messages: updatedMessages
      }, 3600); // 1 hour cache

      return response;

    } catch (error) {
      logger.error('Failed to continue conversation', {
        conversationId: context.conversationId,
        error
      });
      throw error;
    }
  }

  /**
   * Analyze user query intent for routing
   */
  async analyzeIntent(
    query: string,
    context?: Record<string, any>
  ): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, any>;
    suggestedActions: string[];
  }> {
    const systemPrompt = `Analyze the user's query to understand their intent and extract relevant entities for an impact measurement platform.

## Possible Intents:
- "find_indicators": Looking for specific impact indicators
- "start_measurement": Want to begin measuring impact
- "get_recommendations": Seeking general recommendations
- "ask_question": General question about impact measurement
- "create_custom": Want to create custom indicators
- "view_reports": Looking to see reports or results
- "compare_options": Comparing different measurement approaches

## Response Format:
Return a JSON object:
{
  "intent": "primary_intent",
  "confidence": 0.85,
  "entities": {
    "impactArea": "education",
    "complexity": "basic",
    "timeframe": "quarterly"
  },
  "suggestedActions": ["action1", "action2"],
  "keywords": ["key", "words", "extracted"]
}`;

    const userMessage = `Analyze this query: "${query}"
    
${context ? `Additional context: ${JSON.stringify(context)}` : ''}`;

    try {
      const response = await this.sendMessage(
        [{ role: 'user', content: userMessage }],
        systemPrompt,
        { maxTokens: 1000, temperature: 0.1 }
      );

      // Parse response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : '{}';
      const parsed = JSON.parse(jsonString);

      return {
        intent: parsed.intent || 'ask_question',
        confidence: parsed.confidence || 0.5,
        entities: parsed.entities || {},
        suggestedActions: parsed.suggestedActions || []
      };

    } catch (error) {
      logger.error('Failed to analyze intent', { query, error });
      
      // Fallback intent analysis
      return {
        intent: 'ask_question',
        confidence: 0.3,
        entities: {},
        suggestedActions: ['Try rephrasing your question']
      };
    }
  }

  /**
   * Build system prompt for conversation context
   */
  private buildConversationSystemPrompt(context: ConversationContext): string {
    return `You are an expert assistant for impact measurement using the IRIS+ framework. You're helping a user from an organization measure and track their social and environmental impact.

## Conversation Context:
- User ID: ${context.userId}
- Organization ID: ${context.organizationId}
- Conversation ID: ${context.conversationId}

## Your Role:
1. Help users discover relevant IRIS+ indicators for their organization
2. Guide them through impact measurement setup
3. Provide practical implementation advice
4. Answer questions about impact measurement best practices
5. Maintain conversation context and remember previous exchanges

## Guidelines:
- Be helpful, knowledgeable, and encouraging
- Ask clarifying questions when needed
- Provide specific, actionable recommendations
- Reference IRIS+ framework when appropriate
- Keep responses concise but comprehensive
- Maintain professional but friendly tone

## Organization Context:
${context.contextData ? JSON.stringify(context.contextData, null, 2) : 'No additional context available'}

Continue the conversation naturally while helping the user achieve their impact measurement goals.`;
  }

  /**
   * Truncate conversation to fit context limits
   */
  private truncateConversation(messages: LLMMessage[], maxMessages: number): LLMMessage[] {
    if (messages.length <= maxMessages) {
      return messages;
    }

    // Keep the most recent messages, but ensure we start with user message
    const recentMessages = messages.slice(-maxMessages);
    
    // If first message is assistant response, remove it to maintain user/assistant flow
    if (recentMessages[0]?.role === 'assistant') {
      return recentMessages.slice(1);
    }
    
    return recentMessages;
  }

  /**
   * Health check for LLM service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.sendMessage(
        [{ role: 'user', content: 'Hello, please respond with "OK"' }],
        'You are a health check assistant. Respond only with "OK".',
        { maxTokens: 10 }
      );
      
      return response.content.trim().toLowerCase().includes('ok');
    } catch (error) {
      logger.error('LLM health check failed', { error });
      return false;
    }
  }
}

// Create and export singleton instance
export const llmService = new LLMService();
export { LLMService };