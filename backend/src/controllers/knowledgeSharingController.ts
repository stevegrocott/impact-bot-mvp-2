import { Request, Response } from 'express';
import knowledgeSharingService from '../services/knowledgeSharingService';
import { transformToCamelCase } from '../utils/caseTransform';

/**
 * Knowledge Sharing Controller
 * Handles best practices, method templates, collaboration spaces, and community knowledge
 */
class KnowledgeSharingController {

  /**
   * Search knowledge base
   * GET /api/v1/knowledge-sharing/search
   */
  async searchKnowledge(req: Request, res: Response): Promise<void> {
    try {
      const { 
        q: query, 
        category, 
        sector, 
        organizationSize, 
        validationStatus, 
        minRating 
      } = req.query;

      if (!query) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameter: q (search query)'
        });
        return;
      }

      const filters: {
        category?: string[];
        sector?: string[];
        organizationSize?: string[];
        validationStatus?: string[];
        rating?: number;
      } = {};

      if (category) {
        filters.category = Array.isArray(category) 
          ? category.map(c => String(c)) 
          : [String(category)];
      }
      if (sector) {
        filters.sector = Array.isArray(sector) 
          ? sector.map(s => String(s)) 
          : [String(sector)];
      }
      if (organizationSize) {
        filters.organizationSize = Array.isArray(organizationSize) 
          ? organizationSize.map(o => String(o)) 
          : [String(organizationSize)];
      }
      if (validationStatus) {
        filters.validationStatus = Array.isArray(validationStatus) 
          ? validationStatus.map(v => String(v)) 
          : [String(validationStatus)];
      }
      if (minRating) {
        filters.rating = parseFloat(String(minRating));
      }

      const results = await knowledgeSharingService.searchKnowledge(String(query), filters);

      res.json({
        success: true,
        data: {
          results: transformToCamelCase(results),
          query: query as string,
          filters: transformToCamelCase(filters),
          searchMetadata: {
            totalResults: results.totalResults,
            resultTypes: {
              bestPractices: results.bestPractices.length,
              methodTemplates: results.methodTemplates.length,
              collaborationSpaces: results.collaborationSpaces.length
            }
          }
        },
        message: `Found ${results.totalResults} results for "${query}"`
      });
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search knowledge base',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get best practices
   * GET /api/v1/knowledge-sharing/best-practices
   */
  async getBestPractices(req: Request, res: Response): Promise<void> {
    try {
      const { category, sector, validationStatus, page = '1', limit = '10' } = req.query;

      const filters = {
        ...(category && { category }),
        ...(sector && { sector }),
        ...(validationStatus && { validationStatus })
      };

      const practices = await knowledgeSharingService.getBestPractices(filters);
      
      // Implement pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedPractices = practices.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          practices: transformToCamelCase(paginatedPractices),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: practices.length,
            totalPages: Math.ceil(practices.length / limitNum)
          },
          categories: this.extractCategories(practices),
          topRated: this.getTopRated(practices, 3)
        },
        message: `Retrieved ${paginatedPractices.length} best practices`
      });
    } catch (error) {
      console.error('Error fetching best practices:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch best practices',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get method templates
   * GET /api/v1/knowledge-sharing/method-templates
   */
  async getMethodTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { category, page = '1', limit = '10' } = req.query;

      const filters = {
        ...(category && { category })
      };

      const templates = await knowledgeSharingService.getMethodTemplates(filters);
      
      // Implement pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedTemplates = templates.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          templates: transformToCamelCase(paginatedTemplates),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: templates.length,
            totalPages: Math.ceil(templates.length / limitNum)
          },
          categories: this.extractTemplateCategories(templates),
          mostUsed: this.getMostUsedTemplates(templates, 3)
        },
        message: `Retrieved ${paginatedTemplates.length} method templates`
      });
    } catch (error) {
      console.error('Error fetching method templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch method templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get active collaboration spaces
   * GET /api/v1/knowledge-sharing/collaboration-spaces
   */
  async getCollaborationSpaces(req: Request, res: Response): Promise<void> {
    try {
      const spaces = await knowledgeSharingService.getActiveCollaborationSpaces();

      res.json({
        success: true,
        data: {
          spaces: transformToCamelCase(spaces),
          totalSpaces: spaces.length,
          spaceTypes: this.analyzeSpaceTypes(spaces),
          participationStats: this.calculateParticipationStats(spaces)
        },
        message: `Found ${spaces.length} active collaboration spaces`
      });
    } catch (error) {
      console.error('Error fetching collaboration spaces:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch collaboration spaces',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Submit a new best practice
   * POST /api/v1/knowledge-sharing/best-practices
   */
  async submitBestPractice(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const organizationId = req.user?.organizationId;

      if (!userId || !organizationId) {
        res.status(401).json({ success: false, error: 'User authentication and organization context required' });
        return;
      }

      const practiceData = req.body;

      // Validate required fields
      if (!practiceData.title || !practiceData.category || !practiceData.description) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: title, category, description'
        });
        return;
      }

      const result = await knowledgeSharingService.submitBestPractice(
        userId,
        organizationId,
        practiceData
      );

      res.status(201).json({
        success: true,
        data: transformToCamelCase(result),
        message: 'Best practice submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting best practice:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit best practice',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create a collaboration space
   * POST /api/v1/knowledge-sharing/collaboration-spaces
   */
  async createCollaborationSpace(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const organizationId = req.user?.organizationId;

      if (!userId || !organizationId) {
        res.status(401).json({ success: false, error: 'User authentication and organization context required' });
        return;
      }

      const { name, description, type, objectives, timeline } = req.body;

      if (!name || !description || !type || !objectives || !timeline) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: name, description, type, objectives, timeline'
        });
        return;
      }

      const space = await knowledgeSharingService.createCollaborationSpace(
        userId,
        organizationId,
        { name, description, type, objectives, timeline }
      );

      res.status(201).json({
        success: true,
        data: transformToCamelCase(space),
        message: 'Collaboration space created successfully'
      });
    } catch (error) {
      console.error('Error creating collaboration space:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create collaboration space',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get contributor statistics
   * GET /api/v1/knowledge-sharing/contributor-stats
   */
  async getContributorStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, error: 'User authentication required' });
        return;
      }

      const stats = await knowledgeSharingService.getContributorStats(userId);

      res.json({
        success: true,
        data: transformToCamelCase(stats),
        message: 'Contributor statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching contributor stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch contributor statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Rate a best practice
   * POST /api/v1/knowledge-sharing/best-practices/:practiceId/rate
   */
  async rateBestPractice(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { practiceId } = req.params;
      const { rating, feedback } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'User authentication required' });
        return;
      }

      if (!practiceId) {
        res.status(400).json({ success: false, error: 'Practice ID is required' });
        return;
      }

      if (rating === undefined || rating < 1 || rating > 5) {
        res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5'
        });
        return;
      }

      const result = await knowledgeSharingService.rateBestPractice(
        userId,
        practiceId,
        rating,
        feedback
      );

      res.json({
        success: true,
        data: transformToCamelCase(result),
        message: 'Rating submitted successfully'
      });
    } catch (error) {
      console.error('Error rating best practice:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to rate best practice',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Join a collaboration space
   * POST /api/v1/knowledge-sharing/collaboration-spaces/:spaceId/join
   */
  async joinCollaborationSpace(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const organizationId = req.user?.organizationId;
      const { spaceId } = req.params;
      const { expertise } = req.body;

      if (!userId || !organizationId) {
        res.status(401).json({ success: false, error: 'User authentication and organization context required' });
        return;
      }

      if (!spaceId) {
        res.status(400).json({ success: false, error: 'Space ID is required' });
        return;
      }

      const result = await knowledgeSharingService.joinCollaborationSpace(
        userId,
        organizationId,
        spaceId,
        expertise || []
      );

      res.json({
        success: true,
        data: transformToCamelCase(result),
        message: 'Successfully joined collaboration space'
      });
    } catch (error) {
      console.error('Error joining collaboration space:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to join collaboration space',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get trending content
   * GET /api/v1/knowledge-sharing/trending
   */
  async getTrendingContent(req: Request, res: Response): Promise<void> {
    try {
      const trending = await knowledgeSharingService.getTrendingContent();

      res.json({
        success: true,
        data: transformToCamelCase(trending),
        message: 'Trending content retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching trending content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch trending content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get specific best practice by ID
   * GET /api/v1/knowledge-sharing/best-practices/:practiceId
   */
  async getBestPracticeById(req: Request, res: Response): Promise<void> {
    try {
      const { practiceId } = req.params;

      if (!practiceId) {
        res.status(400).json({ success: false, error: 'Practice ID is required' });
        return;
      }

      const practices = await knowledgeSharingService.getBestPractices();
      const practice = practices.find(p => p.id === practiceId);

      if (!practice) {
        res.status(404).json({ success: false, error: 'Best practice not found' });
        return;
      }

      // Add related practices
      const relatedPractices = practices
        .filter(p => p.id !== practiceId && p.category === practice.category)
        .slice(0, 3);

      res.json({
        success: true,
        data: {
          practice: transformToCamelCase(practice),
          relatedPractices: transformToCamelCase(relatedPractices),
          implementationReadiness: this.assessImplementationReadiness(practice)
        },
        message: `Retrieved best practice: ${practice.title}`
      });
    } catch (error) {
      console.error('Error fetching best practice by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch best practice',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get method template by ID
   * GET /api/v1/knowledge-sharing/method-templates/:templateId
   */
  async getMethodTemplateById(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;

      if (!templateId) {
        res.status(400).json({ success: false, error: 'Template ID is required' });
        return;
      }

      const templates = await knowledgeSharingService.getMethodTemplates();
      const template = templates.find(t => t.id === templateId);

      if (!template) {
        res.status(404).json({ success: false, error: 'Method template not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          template: transformToCamelCase(template),
          applicationExamples: this.generateApplicationExamples(template)
        },
        message: `Retrieved method template: ${template.name}`
      });
    } catch (error) {
      console.error('Error fetching method template by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch method template',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Helper methods

  private extractCategories(practices: any[]): string[] {
    return [...new Set(practices.map(p => p.category))];
  }

  private getTopRated(practices: any[], count: number): any[] {
    return practices
      .sort((a, b) => b.rating - a.rating)
      .slice(0, count)
      .map(p => ({ id: p.id, title: p.title, rating: p.rating }));
  }

  private extractTemplateCategories(templates: any[]): string[] {
    return [...new Set(templates.map(t => t.category))];
  }

  private getMostUsedTemplates(templates: any[], count: number): any[] {
    return templates
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, count)
      .map(t => ({ id: t.id, name: t.name, usageCount: t.usageCount }));
  }

  private analyzeSpaceTypes(spaces: any[]): Record<string, number> {
    const types: Record<string, number> = {};
    spaces.forEach(space => {
      types[space.type] = (types[space.type] || 0) + 1;
    });
    return types;
  }

  private calculateParticipationStats(spaces: any[]): any {
    const totalParticipants = spaces.reduce((sum, space) => sum + space.participants.length, 0);
    const averageParticipants = spaces.length > 0 ? totalParticipants / spaces.length : 0;
    
    return {
      totalParticipants,
      averageParticipantsPerSpace: Math.round(averageParticipants),
      activeSpaces: spaces.filter(s => s.status === 'active').length,
      completedSpaces: spaces.filter(s => s.status === 'completed').length
    };
  }

  private assessImplementationReadiness(practice: any): any {
    const readinessFactors = {
      resourceAvailability: practice.implementation.resourceRequirements.filter((r: any) => !r.optional).length,
      complexity: practice.context.complexityLevel,
      timeRequired: practice.implementation.timeEstimate,
      expertiseNeeded: practice.implementation.expertiseRequired.length
    };

    const readinessScore = this.calculateReadinessScore(readinessFactors);

    return {
      score: readinessScore,
      level: readinessScore > 75 ? 'high' : readinessScore > 50 ? 'medium' : 'low',
      factors: readinessFactors,
      recommendations: this.generateReadinessRecommendations(readinessFactors)
    };
  }

  private calculateReadinessScore(factors: any): number {
    let score = 100;
    
    // Deduct points for resource requirements
    score -= factors.resourceAvailability * 5;
    
    // Deduct points for complexity
    if (factors.complexity === 'complex') score -= 20;
    else if (factors.complexity === 'moderate') score -= 10;
    
    // Deduct points for expertise needed
    score -= factors.expertiseNeeded * 5;
    
    return Math.max(0, score);
  }

  private generateReadinessRecommendations(factors: any): string[] {
    const recommendations = [];
    
    if (factors.resourceAvailability > 3) {
      recommendations.push('Consider phased implementation to manage resource requirements');
    }
    
    if (factors.complexity === 'complex') {
      recommendations.push('Seek expert consultation or mentorship for complex aspects');
    }
    
    if (factors.expertiseNeeded > 2) {
      recommendations.push('Invest in team training or bring in external expertise');
    }
    
    return recommendations;
  }

  private generateApplicationExamples(template: any): any[] {
    // Generate contextual examples based on template type
    return [
      {
        context: 'Small nonprofit',
        adaptation: 'Simplified version focusing on core elements',
        timeframe: 'Extended timeline with resource constraints',
        expectedOutcomes: 'Gradual implementation with iterative improvement'
      },
      {
        context: 'Large organization',
        adaptation: 'Full implementation with dedicated team',
        timeframe: 'Accelerated timeline with parallel workstreams',
        expectedOutcomes: 'Comprehensive rollout with systematic tracking'
      }
    ];
  }
}

export default new KnowledgeSharingController();