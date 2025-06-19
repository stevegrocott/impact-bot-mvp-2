import { Request, Response } from 'express';
import aiPersonalityService from '../services/aiPersonalityService';
import { transformToCamelCase } from '../utils/caseTransform';

/**
 * AI Personality Controller
 * Handles AI personality selection, conversation management, and analytics
 */
class AIPersonalityController {

  /**
   * Get all available AI personalities
   * GET /api/v1/ai-personalities/personalities
   */
  async getAvailablePersonalities(req: Request, res: Response): Promise<void> {
    try {
      const personalities = aiPersonalityService.getAvailablePersonalities();

      res.json({
        success: true,
        data: {
          personalities: transformToCamelCase(personalities),
          totalCount: personalities.length,
          roleBreakdown: this.generateRoleBreakdown(personalities)
        },
        message: `Found ${personalities.length} AI personalities`
      });
    } catch (error) {
      console.error('Error fetching AI personalities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch AI personalities',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Select optimal personality for conversation context
   * POST /api/v1/ai-personalities/select-personality
   */
  async selectPersonalityForContext(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const organizationId = req.user?.organizationId;

      if (!userId || !organizationId) {
        res.status(401).json({ success: false, error: 'User authentication and organization context required' });
        return;
      }

      const {
        userRole,
        currentPhase,
        foundationReadiness,
        conversationHistory,
        currentTask,
        urgencyLevel,
        complexityLevel,
        previousInteractions
      } = req.body;

      if (!userRole || !currentPhase || foundationReadiness === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: userRole, currentPhase, foundationReadiness'
        });
        return;
      }

      const context = {
        userId,
        organizationId,
        userRole,
        currentPhase,
        foundationReadiness,
        conversationHistory: conversationHistory || [],
        currentTask: currentTask || 'general_assistance',
        urgencyLevel: urgencyLevel || 'medium',
        complexityLevel: complexityLevel || 'intermediate',
        previousInteractions: previousInteractions || []
      };

      const selection = await aiPersonalityService.selectPersonalityForContext(context);

      res.json({
        success: true,
        data: transformToCamelCase(selection),
        message: `Selected ${selection.selectedPersonality.displayName} with ${Math.round(selection.confidence * 100)}% confidence`
      });
    } catch (error) {
      console.error('Error selecting personality for context:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to select personality',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate personality-specific response
   * POST /api/v1/ai-personalities/generate-response
   */
  async generatePersonalityResponse(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const organizationId = req.user?.organizationId;

      if (!userId || !organizationId) {
        res.status(401).json({ success: false, error: 'User authentication and organization context required' });
        return;
      }

      const {
        personalityId,
        userMessage,
        context
      } = req.body;

      if (!personalityId || !userMessage || !context) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: personalityId, userMessage, context'
        });
        return;
      }

      // Add user context to the conversation context
      const fullContext = {
        ...context,
        userId,
        organizationId
      };

      const response = await aiPersonalityService.generatePersonalityResponse(
        personalityId,
        userMessage,
        fullContext
      );

      res.json({
        success: true,
        data: transformToCamelCase(response),
        message: 'Generated personality response successfully'
      });
    } catch (error) {
      console.error('Error generating personality response:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate personality response',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get personality by ID
   * GET /api/v1/ai-personalities/personalities/:personalityId
   */
  async getPersonalityById(req: Request, res: Response): Promise<void> {
    try {
      const { personalityId } = req.params;

      if (!personalityId) {
        res.status(400).json({ success: false, error: 'Personality ID is required' });
        return;
      }

      const personalities = aiPersonalityService.getAvailablePersonalities();
      const personality = personalities.find(p => p.id === personalityId);

      if (!personality) {
        res.status(404).json({ success: false, error: 'Personality not found' });
        return;
      }

      res.json({
        success: true,
        data: transformToCamelCase(personality),
        message: `Retrieved ${personality.displayName} personality`
      });
    } catch (error) {
      console.error('Error fetching personality by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch personality',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get personality recommendations for user
   * GET /api/v1/ai-personalities/recommendations
   */
  async getPersonalityRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.currentOrganization?.role?.name;

      if (!userId || !userRole) {
        res.status(401).json({ success: false, error: 'User authentication and role required' });
        return;
      }

      const { phase, foundationReadiness, taskContext } = req.query;

      // Generate recommendations based on user context
      const recommendations = this.generateUserRecommendations(
        userRole,
        phase as string,
        foundationReadiness ? parseFloat(foundationReadiness as string) : undefined,
        taskContext as string
      );

      res.json({
        success: true,
        data: {
          recommendations: transformToCamelCase(recommendations),
          userContext: {
            role: userRole,
            phase: phase || 'unknown',
            foundationReadiness: foundationReadiness || 'unknown',
            taskContext: taskContext || 'general'
          }
        },
        message: `Generated ${recommendations.length} personality recommendations`
      });
    } catch (error) {
      console.error('Error generating personality recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get personality interaction analytics
   * GET /api/v1/ai-personalities/analytics
   */
  async getPersonalityAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const analytics = await aiPersonalityService.getPersonalityAnalytics(organizationId);

      res.json({
        success: true,
        data: transformToCamelCase(analytics),
        message: 'Personality analytics retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching personality analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch personality analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Record personality interaction feedback
   * POST /api/v1/ai-personalities/feedback
   */
  async recordInteractionFeedback(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const organizationId = req.user?.organizationId;

      if (!userId || !organizationId) {
        res.status(401).json({ success: false, error: 'User authentication and organization context required' });
        return;
      }

      const {
        personalityId,
        interactionId,
        rating,
        feedback,
        effectiveness,
        context
      } = req.body;

      if (!personalityId || !interactionId || rating === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: personalityId, interactionId, rating'
        });
        return;
      }

      // In a real implementation, this would save feedback to database
      const feedbackRecord = {
        id: `feedback_${Date.now()}`,
        userId,
        organizationId,
        personalityId,
        interactionId,
        rating,
        feedback: feedback || '',
        effectiveness: effectiveness || null,
        context: context || {},
        submittedAt: new Date()
      };

      console.log('Feedback recorded:', feedbackRecord);

      res.json({
        success: true,
        data: transformToCamelCase(feedbackRecord),
        message: 'Interaction feedback recorded successfully'
      });
    } catch (error) {
      console.error('Error recording interaction feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Test personality responses for different contexts
   * POST /api/v1/ai-personalities/test-responses
   */
  async testPersonalityResponses(req: Request, res: Response): Promise<void> {
    try {
      const { testScenarios } = req.body;

      if (!testScenarios || !Array.isArray(testScenarios)) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: testScenarios (array)'
        });
        return;
      }

      const testResults = [];

      for (const scenario of testScenarios) {
        const { personalityId, userMessage, context } = scenario;
        
        try {
          const response = await aiPersonalityService.generatePersonalityResponse(
            personalityId,
            userMessage,
            context
          );
          
          testResults.push({
            scenario: scenario.name || `Test ${testResults.length + 1}`,
            personalityId,
            success: true,
            response: transformToCamelCase(response)
          });
        } catch (error) {
          testResults.push({
            scenario: scenario.name || `Test ${testResults.length + 1}`,
            personalityId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        data: {
          testResults,
          totalTests: testScenarios.length,
          successCount: testResults.filter(r => r.success).length,
          failureCount: testResults.filter(r => !r.success).length
        },
        message: `Completed ${testScenarios.length} personality response tests`
      });
    } catch (error) {
      console.error('Error testing personality responses:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test personality responses',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Helper methods

  private generateRoleBreakdown(personalities: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    personalities.forEach(personality => {
      breakdown[personality.role] = (breakdown[personality.role] || 0) + 1;
    });
    return breakdown;
  }

  private generateUserRecommendations(
    userRole: string,
    phase?: string,
    foundationReadiness?: number,
    taskContext?: string
  ): any[] {
    const recommendations = [];

    // Foundation building recommendations
    if (foundationReadiness !== undefined && foundationReadiness < 50) {
      recommendations.push({
        personalityId: 'coach_riley',
        personalityName: 'Coach Riley',
        reason: 'Ideal for foundation building and early-stage guidance',
        confidence: 0.9,
        context: 'foundation_building'
      });
    }

    // Methodology and indicator selection recommendations
    if (phase?.includes('indicator') || taskContext?.includes('methodology')) {
      recommendations.push({
        personalityId: 'advisor_morgan',
        personalityName: 'Advisor Morgan',
        reason: 'Expert in methodology design and IRIS+ indicators',
        confidence: 0.85,
        context: 'methodology_design'
      });
    }

    // Data analysis recommendations
    if (phase?.includes('analysis') || taskContext?.includes('data')) {
      recommendations.push({
        personalityId: 'analyst_alex',
        personalityName: 'Analyst Alex',
        reason: 'Specialized in data analysis and optimization',
        confidence: 0.88,
        context: 'data_analysis'
      });
    }

    // Role-based recommendations
    if (userRole === 'impact_analyst' || userRole === 'evaluator') {
      if (!recommendations.find(r => r.personalityId === 'advisor_morgan')) {
        recommendations.push({
          personalityId: 'advisor_morgan',
          personalityName: 'Advisor Morgan',
          reason: 'Strong match for analytical and evaluation roles',
          confidence: 0.8,
          context: 'role_alignment'
        });
      }
    }

    // Default recommendation if none found
    if (recommendations.length === 0) {
      recommendations.push({
        personalityId: 'coach_riley',
        personalityName: 'Coach Riley',
        reason: 'Versatile coach suitable for general guidance',
        confidence: 0.7,
        context: 'general_purpose'
      });
    }

    return recommendations;
  }
}

export default new AIPersonalityController();