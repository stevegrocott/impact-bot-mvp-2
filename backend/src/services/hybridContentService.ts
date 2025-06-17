/**
 * Hybrid Content Assembly Service
 * Combines vector search with structured IRIS+ relationships for optimal LLM context
 */

import { prisma } from '@/config/database';
import { cacheService } from './cache';
import { logger, PerformanceLogger } from '@/utils/logger';
import { AppError } from '@/utils/errors';

interface ContentQuery {
  query: string;
  intent: string;
  userContext: {
    userId: string;
    organizationId: string;
    complexity?: 'basic' | 'intermediate' | 'advanced';
    focusAreas?: string[];
    industry?: string;
  };
  maxResults?: number;
}

interface ContentChunk {
  id: string;
  type: string;
  content: string;
  relevanceScore: number;
  explanation: string;
  metadata: {
    sourceEntity?: {
      id: string;
      type: string;
      name: string;
    };
    complexity: number;
    completeness: number;
    clarity: number;
    actionability: number;
  };
}

interface AssembledContext {
  query: string;
  contentChunks: ContentChunk[];
  structuredContent: {
    categories: any[];
    themes: any[];
    goals: any[];
    indicators: any[];
    dataRequirements: any[];
  };
  recommendations: {
    topGoals: any[];
    suggestedIndicators: any[];
    implementationGuidance: string[];
  };
  contextSummary: string;
  totalRelevanceScore: number;
}

export class HybridContentService {
  private readonly CACHE_TTL_CONTENT = 1800; // 30 minutes
  private readonly MAX_CONTENT_CHUNKS = 15;
  private readonly MIN_RELEVANCE_SCORE = 0.3;

  /**
   * Assemble comprehensive context for LLM using hybrid search
   */
  async assembleContext(contentQuery: ContentQuery): Promise<AssembledContext> {
    const startTime = Date.now();
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(contentQuery);
      
      // Try cache first
      const cached = await cacheService.get<AssembledContext>(cacheKey);
      if (cached) {
        logger.debug('Context cache hit', { query: contentQuery.query });
        return cached;
      }

      // Perform parallel content retrieval
      const [
        vectorResults,
        structuredContent,
        userRecommendations
      ] = await Promise.all([
        this.performHybridSearch(contentQuery),
        this.getStructuredContent(contentQuery),
        this.getUserSpecificRecommendations(contentQuery.userContext)
      ]);

      // Assemble final context
      const assembledContext: AssembledContext = {
        query: contentQuery.query,
        contentChunks: vectorResults,
        structuredContent,
        recommendations: userRecommendations,
        contextSummary: this.generateContextSummary(vectorResults, structuredContent),
        totalRelevanceScore: this.calculateTotalRelevance(vectorResults)
      };

      // Cache the assembled context
      await cacheService.set(
        cacheKey,
        assembledContext,
        this.CACHE_TTL_CONTENT,
        { tags: ['content', `user:${contentQuery.userContext.userId}`] }
      );

      // Log performance
      const processingTime = Date.now() - startTime;
      PerformanceLogger.end('hybrid_content_assembly', {
        query: contentQuery.query,
        chunksFound: vectorResults.length,
        processingTime
      });

      return assembledContext;

    } catch (error) {
      logger.error('Failed to assemble hybrid content', {
        query: contentQuery.query,
        error
      });
      throw new AppError('Content assembly failed', 500, 'CONTENT_ASSEMBLY_ERROR');
    }
  }

  /**
   * Perform hybrid vector + structured search
   */
  private async performHybridSearch(contentQuery: ContentQuery): Promise<ContentChunk[]> {
    try {
      // Use the intelligent IRIS search function
      const searchResults = await prisma.$queryRaw<any[]>`
        SELECT * FROM intelligent_iris_search(
          ${contentQuery.query},
          ${JSON.stringify({
            complexity_preference: this.getComplexityLevel(contentQuery.userContext.complexity),
            focus_areas: contentQuery.userContext.focusAreas || []
          })},
          ${contentQuery.intent},
          ${contentQuery.maxResults || this.MAX_CONTENT_CHUNKS}
        )
      `;

      // Transform results to ContentChunk format
      const contentChunks: ContentChunk[] = searchResults
        .filter(result => result.relevance_score >= this.MIN_RELEVANCE_SCORE)
        .map(result => ({
          id: result.content_id,
          type: result.content_type,
          content: result.content_markdown || result.content_description,
          relevanceScore: result.relevance_score,
          explanation: result.explanation,
          metadata: {
            sourceEntity: {
              id: result.content_id,
              type: result.content_type,
              name: result.content_name
            },
            complexity: 2, // Default intermediate
            completeness: 0.8,
            clarity: 0.8,
            actionability: 0.7
          }
        }));

      logger.debug('Hybrid search completed', {
        query: contentQuery.query,
        resultsFound: searchResults.length,
        relevantChunks: contentChunks.length
      });

      return contentChunks;

    } catch (error) {
      logger.error('Hybrid search failed', { query: contentQuery.query, error });
      
      // Fallback to basic search
      return this.performBasicSearch(contentQuery);
    }
  }

  /**
   * Fallback basic search when hybrid search fails
   */
  private async performBasicSearch(contentQuery: ContentQuery): Promise<ContentChunk[]> {
    try {
      // Search IRIS+ goals by text similarity
      const goals = await prisma.irisStrategicGoal.findMany({
        where: {
          OR: [
            { name: { contains: contentQuery.query, mode: 'insensitive' } },
            { description: { contains: contentQuery.query, mode: 'insensitive' } }
          ]
        },
        take: 5,
        orderBy: { sortOrder: 'asc' }
      });

      // Search indicators
      const indicators = await prisma.irisKeyIndicator.findMany({
        where: {
          OR: [
            { name: { contains: contentQuery.query, mode: 'insensitive' } },
            { description: { contains: contentQuery.query, mode: 'insensitive' } }
          ]
        },
        take: 5,
        orderBy: { sortOrder: 'asc' }
      });

      // Convert to content chunks
      const contentChunks: ContentChunk[] = [
        ...goals.map(goal => ({
          id: goal.id,
          type: 'strategic_goal',
          content: `# ${goal.name}\n\n${goal.description || ''}\n\n${goal.definition || ''}`,
          relevanceScore: 0.7, // Default score
          explanation: `Strategic goal matching "${contentQuery.query}"`,
          metadata: {
            sourceEntity: {
              id: goal.id,
              type: 'strategic_goal',
              name: goal.name
            },
            complexity: 2,
            completeness: 0.7,
            clarity: 0.8,
            actionability: 0.6
          }
        })),
        ...indicators.map(indicator => ({
          id: indicator.id,
          type: 'key_indicator',
          content: `# ${indicator.name}\n\n${indicator.description || ''}\n\n## Calculation Guidance\n${indicator.calculationGuidance || ''}\n\n## Why Important\n${indicator.whyImportant || ''}`,
          relevanceScore: 0.6,
          explanation: `Key indicator matching "${contentQuery.query}"`,
          metadata: {
            sourceEntity: {
              id: indicator.id,
              type: 'key_indicator', 
              name: indicator.name
            },
            complexity: this.getComplexityLevel(indicator.complexityLevel as any),
            completeness: 0.8,
            clarity: 0.7,
            actionability: 0.8
          }
        }))
      ];

      return contentChunks.slice(0, contentQuery.maxResults || this.MAX_CONTENT_CHUNKS);

    } catch (error) {
      logger.error('Basic search fallback failed', { error });
      return [];
    }
  }

  /**
   * Get structured IRIS+ content for context
   */
  private async getStructuredContent(contentQuery: ContentQuery): Promise<any> {
    try {
      // Get relevant categories and themes based on query
      const categories = await prisma.irisImpactCategory.findMany({
        include: {
          themes: {
            include: {
              themeGoals: {
                include: {
                  goal: {
                    select: {
                      id: true,
                      name: true,
                      description: true
                    }
                  }
                }
              }
            }
          }
        },
        take: 5
      });

      // Get relevant indicators based on complexity preference
      const complexityFilter = contentQuery.userContext.complexity;
      const indicators = await prisma.irisKeyIndicator.findMany({
        where: complexityFilter ? {
          complexityLevel: complexityFilter
        } : undefined,
        include: {
          indicatorDataRequirements: {
            include: {
              dataRequirement: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  dataType: true,
                  unitOfMeasurement: true
                }
              }
            }
          }
        },
        take: 10,
        orderBy: { sortOrder: 'asc' }
      });

      return {
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          themeCount: cat.themes.length
        })),
        themes: categories.flatMap(cat => 
          cat.themes.map(theme => ({
            id: theme.id,
            name: theme.name,
            description: theme.description,
            categoryName: cat.name,
            goalCount: theme.themeGoals.length
          }))
        ),
        goals: categories.flatMap(cat =>
          cat.themes.flatMap(theme =>
            theme.themeGoals.map(tg => ({
              id: tg.goal.id,
              name: tg.goal.name,
              description: tg.goal.description,
              themeName: theme.name,
              categoryName: cat.name
            }))
          )
        ),
        indicators: indicators.map(ind => ({
          id: ind.id,
          name: ind.name,
          description: ind.description,
          complexityLevel: ind.complexityLevel,
          dataRequirementCount: ind.indicatorDataRequirements.length,
          calculationGuidance: ind.calculationGuidance
        })),
        dataRequirements: indicators.flatMap(ind =>
          ind.indicatorDataRequirements.map(idr => ({
            id: idr.dataRequirement.id,
            name: idr.dataRequirement.name,
            description: idr.dataRequirement.description,
            dataType: idr.dataRequirement.dataType,
            unit: idr.dataRequirement.unitOfMeasurement,
            indicatorName: ind.name
          }))
        )
      };

    } catch (error) {
      logger.error('Failed to get structured content', { error });
      return {
        categories: [],
        themes: [],
        goals: [],
        indicators: [],
        dataRequirements: []
      };
    }
  }

  /**
   * Get user-specific recommendations based on organization context
   */
  private async getUserSpecificRecommendations(userContext: any): Promise<any> {
    try {
      // Get user's organization info
      const organization = await prisma.organization.findUnique({
        where: { id: userContext.organizationId },
        include: {
          userMeasurements: {
            include: {
              indicator: {
                select: { id: true, name: true, complexityLevel: true }
              },
              strategicGoal: {
                select: { id: true, name: true }
              }
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!organization) {
        return { topGoals: [], suggestedIndicators: [], implementationGuidance: [] };
      }

      // Analyze existing measurements to suggest related goals/indicators
      const usedGoalIds = [...new Set(
        organization.userMeasurements
          .filter(m => m.strategicGoalId)
          .map(m => m.strategicGoalId)
      )];

      const usedIndicatorIds = [...new Set(
        organization.userMeasurements
          .filter(m => m.indicatorId)
          .map(m => m.indicatorId)
      )];

      // Get related goals through theme relationships
      const relatedGoals = usedGoalIds.length > 0 
        ? await prisma.irisStrategicGoal.findMany({
            where: {
              id: { notIn: usedGoalIds },
              themeGoals: {
                some: {
                  theme: {
                    themeGoals: {
                      some: {
                        goalId: { in: usedGoalIds }
                      }
                    }
                  }
                }
              }
            },
            take: 5,
            orderBy: { sortOrder: 'asc' }
          })
        : await prisma.irisStrategicGoal.findMany({
            take: 5,
            orderBy: { sortOrder: 'asc' }
          });

      // Get suggested indicators based on complexity preference
      const suggestedIndicators = await prisma.irisKeyIndicator.findMany({
        where: {
          id: { notIn: usedIndicatorIds },
          complexityLevel: userContext.complexity || 'intermediate'
        },
        take: 5,
        orderBy: { sortOrder: 'asc' }
      });

      // Generate implementation guidance
      const implementationGuidance = this.generateImplementationGuidance(
        organization,
        userContext.complexity
      );

      return {
        topGoals: relatedGoals.map(goal => ({
          id: goal.id,
          name: goal.name,
          description: goal.description,
          reason: usedGoalIds.length > 0 
            ? 'Related to your current impact areas' 
            : 'Recommended starting point'
        })),
        suggestedIndicators: suggestedIndicators.map(ind => ({
          id: ind.id,
          name: ind.name,
          description: ind.description,
          complexityLevel: ind.complexityLevel,
          reason: `Matches your ${userContext.complexity || 'intermediate'} complexity preference`
        })),
        implementationGuidance
      };

    } catch (error) {
      logger.error('Failed to get user recommendations', { error });
      return { topGoals: [], suggestedIndicators: [], implementationGuidance: [] };
    }
  }

  /**
   * Generate context summary for LLM
   */
  private generateContextSummary(
    contentChunks: ContentChunk[], 
    structuredContent: any
  ): string {
    const chunkTypes = [...new Set(contentChunks.map(c => c.type))];
    const avgRelevance = contentChunks.length > 0 
      ? contentChunks.reduce((sum, c) => sum + c.relevanceScore, 0) / contentChunks.length 
      : 0;

    return `
## Context Summary
- Found ${contentChunks.length} relevant content chunks (avg relevance: ${avgRelevance.toFixed(2)})
- Content types: ${chunkTypes.join(', ')}
- IRIS+ Categories: ${structuredContent.categories.length}
- Themes: ${structuredContent.themes.length}  
- Strategic Goals: ${structuredContent.goals.length}
- Key Indicators: ${structuredContent.indicators.length}
- Data Requirements: ${structuredContent.dataRequirements.length}

This context provides comprehensive IRIS+ framework information relevant to the user's query.
    `.trim();
  }

  /**
   * Calculate total relevance score
   */
  private calculateTotalRelevance(contentChunks: ContentChunk[]): number {
    if (contentChunks.length === 0) return 0;
    
    const totalScore = contentChunks.reduce((sum, chunk) => sum + chunk.relevanceScore, 0);
    const maxPossibleScore = contentChunks.length * 1.0; // Max relevance is 1.0
    
    return totalScore / maxPossibleScore;
  }

  /**
   * Generate implementation guidance based on organization context
   */
  private generateImplementationGuidance(organization: any, complexity?: string): string[] {
    const guidance: string[] = [];
    
    // Basic guidance based on existing measurements
    if (organization.userMeasurements.length === 0) {
      guidance.push("Start with 1-2 key indicators to establish baseline measurement");
      guidance.push("Focus on data you can realistically collect with your current resources");
    } else {
      guidance.push("Consider expanding measurement to related impact areas");
      guidance.push("Enhance data quality by implementing more rigorous collection methods");
    }

    // Complexity-based guidance
    switch (complexity) {
      case 'basic':
        guidance.push("Begin with simple, easy-to-collect metrics");
        guidance.push("Use existing organizational data where possible");
        break;
      case 'advanced':
        guidance.push("Consider implementing outcome and impact-level indicators");
        guidance.push("Explore third-party verification for key metrics");
        break;
      default:
        guidance.push("Balance measurement rigor with practical implementation");
        guidance.push("Plan for gradual measurement system sophistication");
    }

    // Industry-specific guidance could be added here
    guidance.push("Align measurement timeline with organizational reporting cycles");
    guidance.push("Engage stakeholders in measurement design and validation");

    return guidance;
  }

  /**
   * Convert complexity level to numeric value
   */
  private getComplexityLevel(complexity?: string): number {
    switch (complexity) {
      case 'basic': return 1;
      case 'intermediate': return 2;
      case 'advanced': return 3;
      default: return 2;
    }
  }

  /**
   * Generate cache key for content query
   */
  private generateCacheKey(contentQuery: ContentQuery): string {
    const keyData = {
      query: contentQuery.query.toLowerCase(),
      intent: contentQuery.intent,
      complexity: contentQuery.userContext.complexity,
      focusAreas: contentQuery.userContext.focusAreas?.sort(),
      maxResults: contentQuery.maxResults
    };
    
    const keyString = JSON.stringify(keyData);
    const hash = Buffer.from(keyString).toString('base64').substring(0, 32);
    
    return `hybrid_content:${hash}`;
  }

  /**
   * Format assembled context for LLM consumption
   */
  formatForLLM(assembledContext: AssembledContext): string {
    const { contentChunks, structuredContent, recommendations, contextSummary } = assembledContext;

    let formattedContent = `# IRIS+ Framework Context\n\n${contextSummary}\n\n`;

    // Add relevant content chunks
    if (contentChunks.length > 0) {
      formattedContent += `## Relevant Content\n\n`;
      
      contentChunks.slice(0, 10).forEach((chunk, index) => {
        formattedContent += `### ${index + 1}. ${chunk.metadata.sourceEntity?.name} (${chunk.type})\n`;
        formattedContent += `**Relevance:** ${chunk.relevanceScore.toFixed(2)} - ${chunk.explanation}\n\n`;
        formattedContent += `${chunk.content}\n\n---\n\n`;
      });
    }

    // Add structured recommendations
    if (recommendations.topGoals.length > 0) {
      formattedContent += `## Recommended Strategic Goals\n\n`;
      recommendations.topGoals.forEach(goal => {
        formattedContent += `- **${goal.name}**: ${goal.reason}\n`;
      });
      formattedContent += `\n`;
    }

    if (recommendations.suggestedIndicators.length > 0) {
      formattedContent += `## Suggested Indicators\n\n`;
      recommendations.suggestedIndicators.forEach(indicator => {
        formattedContent += `- **${indicator.name}** (${indicator.complexityLevel}): ${indicator.reason}\n`;
      });
      formattedContent += `\n`;
    }

    if (recommendations.implementationGuidance.length > 0) {
      formattedContent += `## Implementation Guidance\n\n`;
      recommendations.implementationGuidance.forEach(guidance => {
        formattedContent += `- ${guidance}\n`;
      });
      formattedContent += `\n`;
    }

    return formattedContent;
  }

  /**
   * Invalidate content cache for user
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await cacheService.invalidateByTags([`user:${userId}`]);
  }
}

// Create and export singleton instance
export const hybridContentService = new HybridContentService();
export { HybridContentService };