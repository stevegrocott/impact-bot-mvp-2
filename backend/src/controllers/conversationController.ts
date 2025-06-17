/**
 * Conversation Controller
 * Handles chat interactions using LLM and hybrid content services
 */

import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { llmService } from '@/services/llm';
import { hybridContentService } from '@/services/hybridContentService';
import { cacheService } from '@/services/cache';
import { logger, LLMLogger } from '@/utils/logger';
import { AppError, ValidationError, Assert, asyncHandler } from '@/utils/errors';
import { v4 as uuidv4 } from 'uuid';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    organizationId: string;
  };
}

interface ChatRequest {
  message: string;
  conversationId?: string;
  intent?: string;
  complexity?: 'basic' | 'intermediate' | 'advanced';
  focusAreas?: string[];
}

interface ConversationContext {
  conversationId: string;
  userId: string;
  organizationId: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  contextData?: Record<string, any>;
}

export class ConversationController {
  /**
   * Start a new conversation or continue existing one
   */
  async chat(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { message, conversationId, intent, complexity, focusAreas }: ChatRequest = req.body;

    // Validate input
    Assert.validInput(!!message?.trim(), 'Message is required');
    Assert.validInput(message.length <= 2000, 'Message too long (max 2000 characters)');

    try {
      // Get or create conversation
      const conversation = conversationId 
        ? await this.getConversation(conversationId, authReq.user.id)
        : await this.createConversation(authReq.user.id, authReq.user.organizationId, undefined, message);

      // Analyze user intent if not provided
      const analyzedIntent = intent || await this.analyzeUserIntent(message, conversation);

      // Assemble hybrid content based on query and context
      const contentQuery = {
        query: message,
        intent: analyzedIntent,
        userContext: {
          userId: authReq.user.id,
          organizationId: authReq.user.organizationId,
          complexity: complexity || 'intermediate',
          focusAreas: focusAreas || []
        },
        maxResults: 12
      };

      const assembledContext = await hybridContentService.assembleContext(contentQuery);

      // Format context for LLM
      const formattedContext = hybridContentService.formatForLLM(assembledContext);

      // Build conversation context
      const conversationContext: ConversationContext = {
        conversationId: conversation.id,
        userId: authReq.user.id,
        organizationId: authReq.user.organizationId,
        messages: conversation.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          timestamp: msg.createdAt
        })),
        contextData: {
          organization: conversation.organization,
          assembledContext: {
            totalRelevanceScore: assembledContext.totalRelevanceScore,
            contentTypes: assembledContext.contentChunks.map(c => c.type),
            recommendationCount: assembledContext.recommendations.topGoals.length
          }
        }
      };

      // Create system prompt with IRIS+ context
      const systemPrompt = this.buildSystemPrompt(formattedContext, conversationContext);

      // Get LLM response
      const llmResponse = await llmService.continueConversation(conversationContext, message);

      // Save conversation messages
      await this.saveConversationMessages(conversation.id, [
        {
          role: 'user',
          content: message,
          metadata: {
            intent: analyzedIntent,
            complexity,
            focusAreas,
            contextRelevance: assembledContext.totalRelevanceScore
          }
        },
        {
          role: 'assistant',
          content: llmResponse.content,
          metadata: {
            tokensUsed: llmResponse.tokensUsed,
            processingTime: llmResponse.processingTime,
            model: llmResponse.model,
            contentSources: assembledContext.contentChunks.length,
            recommendations: assembledContext.recommendations.topGoals.length
          }
        }
      ]);

      // Log conversation metrics
      LLMLogger.logConversation(
        conversation.id,
        'interaction',
        `User: ${message.substring(0, 100)}...`,
        {
          tokensUsed: llmResponse.tokensUsed,
          processingTime: llmResponse.processingTime,
          contentRelevance: assembledContext.totalRelevanceScore,
          recommendationCount: assembledContext.recommendations.topGoals.length
        }
      );

      // Prepare response
      res.json({
        conversationId: conversation.id,
        response: llmResponse.content,
        metadata: {
          tokensUsed: llmResponse.tokensUsed,
          processingTime: llmResponse.processingTime,
          contentRelevance: assembledContext.totalRelevanceScore,
          recommendations: {
            goals: assembledContext.recommendations.topGoals.slice(0, 3),
            indicators: assembledContext.recommendations.suggestedIndicators.slice(0, 3)
          },
          contextSummary: assembledContext.contextSummary
        }
      });

    } catch (error) {
      logger.error('Chat interaction failed', {
        userId: authReq.user.id,
        organizationId: authReq.user.organizationId,
        message: message.substring(0, 100),
        error
      });
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    Assert.validInput(!!conversationId, 'Conversation ID is required');

    try {
      const conversation = await this.getConversation(conversationId, authReq.user.id);

      const messages = await prisma.conversationMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        skip: Number(offset),
        take: Number(limit),
        select: {
          id: true,
          role: true,
          content: true,
          metadata: true,
          createdAt: true
        }
      });

      res.json({
        conversationId,
        messages,
        totalMessages: conversation._count?.messages || 0,
        hasMore: messages.length === Number(limit)
      });

    } catch (error) {
      logger.error('Failed to get conversation history', {
        conversationId,
        userId: authReq.user.id,
        error
      });
      throw error;
    }
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { limit = 20, offset = 0 } = req.query;

    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          userId: authReq.user.id,
          organizationId: authReq.user.organizationId
        },
        orderBy: { updatedAt: 'desc' },
        skip: Number(offset),
        take: Number(limit),
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { messages: true }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              content: true,
              role: true,
              createdAt: true
            }
          }
        }
      });

      const formattedConversations = conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        messageCount: conv._count.messages,
        lastMessage: conv.messages[0] || null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      }));

      res.json({
        conversations: formattedConversations,
        hasMore: conversations.length === Number(limit)
      });

    } catch (error) {
      logger.error('Failed to get user conversations', {
        userId: authReq.user.id,
        error
      });
      throw error;
    }
  }

  /**
   * Get specific conversation with messages
   */
  async getConversation(req: Request, res: Response): Promise<void> {
    const conversationId = req.params.conversationId;
    const includeMessages = req.query.includeMessages === 'true';

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: req.user!.id,
        organizationId: req.organization!.id
      },
      include: {
        messages: includeMessages ? {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            messageType: true,
            content: true,
            metadata: true,
            createdAt: true
          }
        } : false,
        recommendations: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    Assert.exists(conversation, 'Conversation not found');

    res.json({
      id: conversation.id,
      title: conversation.title,
      conversationType: conversation.conversationType,
      contextData: conversation.contextData,
      currentStep: conversation.currentStep,
      completionPercentage: conversation.completionPercentage,
      isActive: conversation.isActive,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      ...(includeMessages && { messages: conversation.messages }),
      recentRecommendations: conversation.recommendations
    });
  }

  /**
   * Send message to conversation
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    const conversationId = req.params.conversationId;
    const { error, value } = sendMessageSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');

    const { content } = value;

    // Verify conversation ownership
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: req.user!.id,
        organizationId: req.organization!.id
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20 // Last 20 messages for context
        }
      }
    });

    Assert.exists(conversation, 'Conversation not found');

    const result = await db.executeTransaction(async (tx) => {
      // Add user message
      const userMessage = await tx.conversationMessage.create({
        data: {
          conversationId,
          messageType: 'user',
          content
        }
      });

      // Build conversation context for LLM
      const conversationContext = {
        conversationId,
        userId: req.user!.id,
        organizationId: req.organization!.id,
        messages: [
          ...conversation.messages.map(m => ({
            role: m.messageType as 'user' | 'assistant' | 'system',
            content: m.content
          })),
          { role: 'user' as const, content }
        ],
        contextData: conversation.contextData
      };

      // Get LLM response
      const response = await llmService.continueConversation(conversationContext, content);

      // Add assistant message
      const assistantMessage = await tx.conversationMessage.create({
        data: {
          conversationId,
          messageType: 'assistant',
          content: response.content,
          tokensUsed: response.tokensUsed,
          processingTimeMs: response.processingTime,
          metadata: response.metadata
        }
      });

      // Update conversation
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
          isActive: true
        }
      });

      return { userMessage, assistantMessage, response };
    });

    // Log conversation
    LLMLogger.logConversation(conversationId, 'user', content);
    LLMLogger.logConversation(conversationId, 'assistant', result.response.content, {
      tokensUsed: result.response.tokensUsed,
      processingTime: result.response.processingTime
    });

    res.json({
      userMessage: {
        id: result.userMessage.id,
        content: result.userMessage.content,
        createdAt: result.userMessage.createdAt
      },
      assistantMessage: {
        id: result.assistantMessage.id,
        content: result.assistantMessage.content,
        createdAt: result.assistantMessage.createdAt
      },
      tokensUsed: result.response.tokensUsed,
      processingTime: result.response.processingTime
    });
  }

  /**
   * Get conversation messages with pagination
   */
  async getMessages(req: Request, res: Response): Promise<void> {
    const conversationId = req.params.conversationId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    // Verify conversation ownership
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: req.user!.id,
        organizationId: req.organization!.id
      }
    });

    Assert.exists(conversation, 'Conversation not found');

    const result = await db.paginate(prisma.conversationMessage, {
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        messageType: true,
        content: true,
        tokensUsed: true,
        processingTimeMs: true,
        createdAt: true
      },
      page,
      limit
    });

    res.json({
      messages: result.data,
      pagination: result.meta
    });
  }

  /**
   * Generate IRIS+ recommendations
   */
  async generateRecommendations(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const {
      organizationDescription,
      industry,
      impactAreas = [],
      existingMetrics = [],
      constraints = {}
    } = req.body;

    Assert.validInput(!!organizationDescription?.trim(), 'Organization description is required');

    try {
      // Get hybrid content for recommendations
      const contentQuery = {
        query: `${organizationDescription} ${industry || ''} ${impactAreas.join(' ')}`,
        intent: 'get_recommendations',
        userContext: {
          userId: authReq.user.id,
          organizationId: authReq.user.organizationId,
          complexity: constraints.complexity || 'intermediate',
          focusAreas: impactAreas,
          industry
        },
        maxResults: 20
      };

      const assembledContext = await hybridContentService.assembleContext(contentQuery);
      const formattedContext = hybridContentService.formatForLLM(assembledContext);

      // Generate recommendations using LLM
      const recommendations = await llmService.generateIrisRecommendations(
        {
          organizationDescription,
          industry,
          impactAreas,
          existingMetrics,
          constraints
        },
        formattedContext
      );

      // Save recommendations to database
      const conversation = await this.createConversation(
        authReq.user.id,
        authReq.user.organizationId,
        'IRIS+ Recommendations Generated'
      );

      await this.saveConversationMessages(conversation.id, [
        {
          role: 'system',
          content: `Generated IRIS+ recommendations for: ${organizationDescription}`,
          metadata: {
            type: 'recommendations',
            industry,
            impactAreas,
            constraints,
            confidence: recommendations.confidence
          }
        },
        {
          role: 'assistant',
          content: recommendations.reasoning,
          metadata: {
            recommendations: recommendations.recommendations,
            confidence: recommendations.confidence
          }
        }
      ]);

      res.json({
        conversationId: conversation.id,
        recommendations: recommendations.recommendations,
        reasoning: recommendations.reasoning,
        confidence: recommendations.confidence,
        contextMetadata: {
          relevanceScore: assembledContext.totalRelevanceScore,
          contentSources: assembledContext.contentChunks.length,
          structuredData: {
            categories: assembledContext.structuredContent.categories.length,
            themes: assembledContext.structuredContent.themes.length,
            indicators: assembledContext.structuredContent.indicators.length
          }
        }
      });

    } catch (error) {
      logger.error('Failed to generate recommendations', {
        userId: authReq.user.id,
        organizationDescription: organizationDescription.substring(0, 100),
        error
      });
      throw error;
    }
  }

  /**
   * Analyze query intent
   */
  async analyzeIntent(req: Request, res: Response): Promise<void> {
    const { error, value } = analyzeIntentSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');

    const { query, context } = value;

    try {
      const analysis = await llmService.analyzeIntent(query, context);

      res.json({
        query,
        intent: analysis.intent,
        confidence: analysis.confidence,
        entities: analysis.entities,
        suggestedActions: analysis.suggestedActions,
        analyzedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to analyze intent', { error, query });
      throw new AppError('Failed to analyze intent', 500, 'INTENT_ANALYSIS_ERROR');
    }
  }

  /**
   * Update conversation
   */
  async updateConversation(req: Request, res: Response): Promise<void> {
    const conversationId = req.params.conversationId;
    const updates = req.body;

    const allowedUpdates = ['title', 'contextData', 'currentStep'];
    const updateData: any = {};

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    const conversation = await prisma.conversation.updateMany({
      where: {
        id: conversationId,
        userId: req.user!.id,
        organizationId: req.organization!.id
      },
      data: updateData
    });

    Assert.isTrue(conversation.count > 0, 'Conversation not found or access denied');

    res.json({
      message: 'Conversation updated successfully',
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Delete conversation
   */
  async deleteConversation(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { conversationId } = req.params;

    Assert.validInput(!!conversationId, 'Conversation ID is required');

    try {
      // Verify ownership
      const conversation = await this.getConversation(conversationId, authReq.user.id);

      // Delete conversation and all messages (cascade)
      await prisma.conversation.delete({
        where: { id: conversationId }
      });

      // Invalidate related cache
      await cacheService.invalidateByTags([`conversation:${conversationId}`]);

      res.json({ success: true });

    } catch (error) {
      logger.error('Failed to delete conversation', {
        conversationId,
        userId: authReq.user.id,
        error
      });
      throw error;
    }
  }

  /**
   * Get conversation recommendations
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    const conversationId = req.params.conversationId;

    const recommendations = await prisma.conversationRecommendation.findMany({
      where: {
        conversationId,
        conversation: {
          userId: req.user!.id,
          organizationId: req.organization!.id
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({
      recommendations: recommendations.map(rec => ({
        id: rec.id,
        type: rec.recommendationType,
        itemId: rec.recommendedItemId,
        itemType: rec.recommendedItemType,
        confidence: rec.confidenceScore,
        reasoning: rec.reasoning,
        feedback: rec.userFeedback,
        createdAt: rec.createdAt
      }))
    });
  }

  /**
   * Provide feedback on recommendation
   */
  async provideFeedback(req: Request, res: Response): Promise<void> {
    const { conversationId, recommendationId } = req.params;
    const { error, value } = feedbackSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');

    const { feedback, notes } = value;

    const recommendation = await prisma.conversationRecommendation.updateMany({
      where: {
        id: recommendationId,
        conversationId,
        conversation: {
          userId: req.user!.id,
          organizationId: req.organization!.id
        }
      },
      data: {
        userFeedback: feedback,
        feedbackNotes: notes
      }
    });

    Assert.isTrue(recommendation.count > 0, 'Recommendation not found or access denied');

    res.json({
      message: 'Feedback recorded successfully'
    });
  }

  // ================================
  // Private Helper Methods
  // ================================

  /**
   * Get conversation with authorization check
   */
  private async getConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: userId
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20 // Last 20 messages for context
        },
        organization: {
          select: {
            id: true,
            name: true,
            industry: true
          }
        },
        _count: {
          select: { messages: true }
        }
      }
    });

    Assert.exists(conversation, 'Conversation not found');
    return conversation;
  }

  /**
   * Rename conversation
   */
  async renameConversation(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { conversationId } = req.params;
    const { title } = req.body;

    Assert.validInput(!!conversationId, 'Conversation ID is required');
    Assert.validInput(!!title?.trim(), 'Title is required');
    Assert.validInput(title.length <= 200, 'Title too long (max 200 characters)');

    try {
      // Verify ownership
      const conversation = await this.getConversation(conversationId, authReq.user.id);

      // Update title
      const updatedConversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: { 
          title: title.trim(),
          updatedAt: new Date()
        }
      });

      // Invalidate cache
      await cacheService.invalidateByTags([`conversation:${conversationId}`, `user:${authReq.user.id}`]);

      logger.info('Conversation renamed', {
        userId: authReq.user.id,
        conversationId,
        oldTitle: conversation.title,
        newTitle: title
      });

      res.json({
        id: updatedConversation.id,
        title: updatedConversation.title,
        updatedAt: updatedConversation.updatedAt
      });

    } catch (error) {
      logger.error('Failed to rename conversation', {
        userId: authReq.user.id,
        conversationId,
        title,
        error
      });
      throw error;
    }
  }

  /**
   * Generate smart conversation title based on content
   */
  async generateConversationTitle(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { conversationId } = req.params;

    Assert.validInput(!!conversationId, 'Conversation ID is required');

    try {
      const conversation = await this.getConversation(conversationId, authReq.user.id);
      
      // Get first few messages for context
      const messages = await prisma.conversationMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: 5,
        select: {
          role: true,
          content: true
        }
      });

      if (messages.length === 0) {
        throw new ValidationError('No messages found to generate title from');
      }

      // Generate title using LLM
      const titlePrompt = this.buildTitleGenerationPrompt(messages);
      const llmResponse = await llmService.sendMessage(
        [{ role: 'user', content: titlePrompt }],
        'You are a helpful assistant that creates concise, descriptive titles for conversations. Generate a title that captures the main topic and intent.',
        { maxTokens: 50, temperature: 0.3 }
      );

      const generatedTitle = this.extractTitleFromResponse(llmResponse.content);

      // Update conversation with generated title
      const updatedConversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: { 
          title: generatedTitle,
          updatedAt: new Date()
        }
      });

      // Invalidate cache
      await cacheService.invalidateByTags([`conversation:${conversationId}`, `user:${authReq.user.id}`]);

      logger.info('Conversation title generated', {
        userId: authReq.user.id,
        conversationId,
        generatedTitle,
        messageCount: messages.length
      });

      res.json({
        id: updatedConversation.id,
        title: updatedConversation.title,
        generatedTitle,
        updatedAt: updatedConversation.updatedAt
      });

    } catch (error) {
      logger.error('Failed to generate conversation title', {
        userId: authReq.user.id,
        conversationId,
        error
      });
      throw error;
    }
  }

  /**
   * Create new conversation with auto-naming
   */
  private async createConversation(userId: string, organizationId: string, title?: string, firstMessage?: string) {
    const conversation = await prisma.conversation.create({
      data: {
        id: uuidv4(),
        userId,
        organizationId,
        title: title || 'New Conversation',
        status: 'active'
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            industry: true
          }
        },
        messages: true
      }
    });

    // Auto-generate title if first message provided and no explicit title
    if (!title && firstMessage && firstMessage.trim().length > 10) {
      try {
        const autoTitle = await this.generateTitleFromMessage(firstMessage);
        if (autoTitle && autoTitle !== 'New Conversation') {
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { title: autoTitle }
          });
          conversation.title = autoTitle;
        }
      } catch (error) {
        logger.warn('Failed to auto-generate conversation title', { 
          conversationId: conversation.id, 
          error 
        });
        // Continue with default title if auto-generation fails
      }
    }

    return conversation;
  }

  /**
   * Save conversation messages
   */
  private async saveConversationMessages(
    conversationId: string,
    messages: Array<{
      role: string;
      content: string;
      metadata?: Record<string, any>;
    }>
  ) {
    const messageData = messages.map(msg => ({
      id: uuidv4(),
      conversationId,
      role: msg.role,
      content: msg.content,
      metadata: msg.metadata || {}
    }));

    await prisma.conversationMessage.createMany({
      data: messageData
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });
  }

  /**
   * Analyze user intent using LLM
   */
  private async analyzeUserIntent(message: string, conversation: any): Promise<string> {
    try {
      const context = {
        conversationLength: conversation.messages?.length || 0,
        organizationIndustry: conversation.organization?.industry,
        hasExistingMeasurements: false // TODO: Check if org has measurements
      };

      const intentAnalysis = await llmService.analyzeIntent(message, context);
      return intentAnalysis.intent;

    } catch (error) {
      logger.warn('Intent analysis failed, using default', { message: message.substring(0, 100), error });
      return 'ask_question';
    }
  }

  /**
   * Build comprehensive system prompt
   */
  private buildSystemPrompt(irisContext: string, conversationContext: ConversationContext): string {
    return `You are an expert impact measurement assistant specializing in the IRIS+ framework. You help organizations measure and track their social and environmental impact effectively.

## Your Role & Capabilities:
1. **IRIS+ Expert**: Deep knowledge of indicators, strategic goals, and data requirements
2. **Practical Guide**: Provide actionable, implementation-focused advice
3. **Context-Aware**: Use conversation history and organizational context
4. **Recommendation Engine**: Suggest relevant indicators and measurement approaches

## Current Context:
${irisContext}

## Conversation Context:
- Organization: ${conversationContext.contextData?.organization?.name || 'Unknown'}
- Industry: ${conversationContext.contextData?.organization?.industry || 'Not specified'}
- Messages in conversation: ${conversationContext.messages.length}
- Content relevance score: ${conversationContext.contextData?.assembledContext?.totalRelevanceScore || 'N/A'}

## Response Guidelines:
1. **Be Specific**: Reference actual IRIS+ indicators, goals, and data requirements
2. **Be Practical**: Focus on implementation, not just theory
3. **Be Contextual**: Consider the organization's industry and previous conversation
4. **Be Encouraging**: Support users in their impact measurement journey
5. **Be Concise**: Provide clear, actionable responses without overwhelming detail

## Response Format:
- Start with a direct answer to the user's question
- Provide 2-3 specific recommendations when relevant
- Include implementation guidance
- Suggest next steps or follow-up questions
- Reference specific IRIS+ elements when applicable

Continue the conversation naturally while helping achieve their impact measurement goals.`;
  }

  /**
   * Generate title from first message
   */
  private async generateTitleFromMessage(message: string): Promise<string> {
    try {
      const titlePrompt = `Generate a brief, descriptive title (3-8 words) for a conversation that starts with: "${message.substring(0, 200)}..."

The title should capture the main topic or intent. Focus on impact measurement, IRIS+ indicators, or the specific area they're asking about.

Examples:
- "Education Impact Metrics Setup"
- "Healthcare Indicator Recommendations"
- "Environmental Measurement Strategy"
- "Custom Indicator Development"

Just return the title, nothing else.`;

      const llmResponse = await llmService.sendMessage(
        [{ role: 'user', content: titlePrompt }],
        'You create concise, descriptive conversation titles.',
        { maxTokens: 30, temperature: 0.2 }
      );

      return this.extractTitleFromResponse(llmResponse.content);
    } catch (error) {
      logger.warn('Failed to generate title from message', { message: message.substring(0, 100), error });
      return 'New Conversation';
    }
  }

  /**
   * Build title generation prompt from conversation messages
   */
  private buildTitleGenerationPrompt(messages: Array<{ role: string; content: string }>): string {
    const conversationContent = messages
      .slice(0, 3) // Use first 3 messages
      .map(msg => `${msg.role}: ${msg.content.substring(0, 150)}...`)
      .join('\n\n');

    return `Based on this conversation start, generate a brief, descriptive title (3-8 words):

${conversationContent}

The title should capture the main topic or intent related to impact measurement and IRIS+. Just return the title, nothing else.`;
  }

  /**
   * Extract clean title from LLM response
   */
  private extractTitleFromResponse(response: string): string {
    // Clean up the response
    const cleaned = response
      .replace(/["']/g, '') // Remove quotes
      .replace(/^(Title|Conversation Title|Topic):\s*/i, '') // Remove prefixes
      .trim();

    // Validate and sanitize
    if (cleaned.length < 3 || cleaned.length > 100) {
      return 'New Conversation';
    }

    // Capitalize first letter of each word
    return cleaned
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Build system prompt for conversation type
   */
  private buildSystemPrompt(conversationType: string, contextData?: any): string {
    const basePrompt = `You are an expert assistant for impact measurement using the IRIS+ framework.`;
    
    const typeSpecificPrompts = {
      discovery: `Help the user discover relevant IRIS+ indicators and strategic goals for their organization. Ask clarifying questions and provide recommendations based on their description.`,
      measurement: `Guide the user through setting up impact measurements, including data collection requirements and implementation timelines.`,
      reporting: `Assist with impact reporting, including selecting appropriate indicators, analyzing results, and creating compelling impact narratives.`,
      general: `Answer general questions about impact measurement, IRIS+ framework, and best practices.`
    };

    return `${basePrompt}\n\n${typeSpecificPrompts[conversationType as keyof typeof typeSpecificPrompts] || typeSpecificPrompts.general}`;
  }

}

// Create controller instance with bound methods
const conversationController = new ConversationController();

// Export bound methods for route handlers
export const chat = asyncHandler(conversationController.chat.bind(conversationController));
export const getConversationHistory = asyncHandler(conversationController.getConversationHistory.bind(conversationController));
export const getUserConversations = asyncHandler(conversationController.getUserConversations.bind(conversationController));
export const generateRecommendations = asyncHandler(conversationController.generateRecommendations.bind(conversationController));
export const deleteConversation = asyncHandler(conversationController.deleteConversation.bind(conversationController));
export const renameConversation = asyncHandler(conversationController.renameConversation.bind(conversationController));
export const generateConversationTitle = asyncHandler(conversationController.generateConversationTitle.bind(conversationController));