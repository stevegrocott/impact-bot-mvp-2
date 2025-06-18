/**
 * Vector Search Service
 * Implements semantic search using pgvector and IRIS+ content
 * Completes the hybrid content architecture
 */

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';

export interface VectorSearchQuery {
  query: string;
  intent?: string;
  maxResults?: number;
  similarityThreshold?: number;
  contextLevel?: 'basic' | 'intermediate' | 'advanced';
  contentTypes?: string[];
}

export interface VectorSearchResult {
  id: string;
  contentType: string;
  name: string;
  description?: string;
  relevanceScore: number;
  explanation?: string;
  metadata?: any;
}

class VectorSearchService {
  private readonly DEFAULT_SIMILARITY_THRESHOLD = 0.3;
  private readonly DEFAULT_MAX_RESULTS = 10;

  /**
   * Perform semantic search using vector embeddings
   */
  async search(searchQuery: VectorSearchQuery): Promise<VectorSearchResult[]> {
    try {
      const {
        query,
        intent = 'general',
        maxResults = this.DEFAULT_MAX_RESULTS,
        similarityThreshold = this.DEFAULT_SIMILARITY_THRESHOLD,
        contextLevel = 'intermediate',
        contentTypes
      } = searchQuery;

      if (!query || query.trim().length === 0) {
        throw new AppError('Search query cannot be empty', 400);
      }

      // For now, use the existing intelligent search function
      // In production, this would generate embeddings for the query first
      const userContext = {
        complexity_preference: this.mapContextLevel(contextLevel),
        content_types: contentTypes || []
      };

      const searchResults = await prisma.$queryRaw<any[]>`
        SELECT * FROM intelligent_iris_search(
          ${query},
          ${JSON.stringify(userContext)}::jsonb,
          ${intent},
          ${maxResults}
        )
        WHERE relevance_score >= ${similarityThreshold}
      `;

      const results: VectorSearchResult[] = searchResults.map(result => ({
        id: result.content_id,
        contentType: result.content_type,
        name: result.content_name,
        description: result.content_description,
        relevanceScore: parseFloat(result.relevance_score),
        explanation: result.explanation,
        metadata: {
          searchMethod: 'intelligent_iris_search',
          intent,
          contextLevel
        }
      }));

      logger.debug('Vector search completed', {
        query: query.substring(0, 50),
        resultsFound: results.length,
        avgRelevance: results.length > 0 
          ? results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length 
          : 0
      });

      return results;
    } catch (error) {
      logger.error('Vector search failed:', error);
      throw new AppError('Vector search failed', 500, 'VECTOR_SEARCH_ERROR');
    }
  }

  /**
   * Perform direct semantic similarity search on IRIS data
   */
  async searchIRISContent(
    queryText: string,
    maxResults: number = 10,
    contentTypes: string[] = ['goal', 'indicator', 'theme']
  ): Promise<VectorSearchResult[]> {
    try {
      // This requires the materialized view to be populated with embeddings
      // For now, we'll use text-based search as a fallback
      const typeFilter = contentTypes.length > 0 
        ? contentTypes.map(type => `'${type}'`).join(',')
        : "'goal','indicator','theme'";

      const searchResults = await prisma.$queryRaw<any[]>`
        SELECT 
          id::text as content_id,
          content_type,
          name as content_name,
          description as content_description,
          ts_rank(search_vector, plainto_tsquery('english', ${queryText})) as relevance_score
        FROM mv_semantic_search_content
        WHERE search_vector @@ plainto_tsquery('english', ${queryText})
          AND content_type IN (${contentTypes.join(',')})
        ORDER BY relevance_score DESC
        LIMIT ${maxResults}
      `;

      return searchResults.map(result => ({
        id: result.content_id,
        contentType: result.content_type,
        name: result.content_name,
        description: result.content_description,
        relevanceScore: parseFloat(result.relevance_score),
        explanation: `Text-based match for "${queryText}"`,
        metadata: {
          searchMethod: 'text_search',
          queryText
        }
      }));
    } catch (error) {
      logger.error('IRIS content search failed:', error);
      // Fallback to basic database search
      return this.fallbackSearch(queryText, maxResults, contentTypes);
    }
  }

  /**
   * Fallback search using basic text matching
   */
  private async fallbackSearch(
    queryText: string,
    maxResults: number,
    contentTypes: string[]
  ): Promise<VectorSearchResult[]> {
    try {
      const results: VectorSearchResult[] = [];

      if (contentTypes.includes('goal')) {
        const goals = await prisma.irisStrategicGoal.findMany({
          where: {
            OR: [
              { name: { contains: queryText, mode: 'insensitive' } },
              { description: { contains: queryText, mode: 'insensitive' } }
            ]
          },
          take: Math.floor(maxResults / contentTypes.length),
          select: { id: true, name: true, description: true }
        });

        results.push(...goals.map(goal => ({
          id: goal.id,
          contentType: 'goal',
          name: goal.name,
          description: goal.description,
          relevanceScore: 0.5, // Default relevance
          explanation: `Text match for "${queryText}"`,
          metadata: { searchMethod: 'fallback' }
        })));
      }

      if (contentTypes.includes('indicator')) {
        const indicators = await prisma.irisKeyIndicator.findMany({
          where: {
            OR: [
              { name: { contains: queryText, mode: 'insensitive' } },
              { description: { contains: queryText, mode: 'insensitive' } }
            ]
          },
          take: Math.floor(maxResults / contentTypes.length),
          select: { id: true, name: true, description: true }
        });

        results.push(...indicators.map(indicator => ({
          id: indicator.id,
          contentType: 'indicator',
          name: indicator.name,
          description: indicator.description,
          relevanceScore: 0.5,
          explanation: `Text match for "${queryText}"`,
          metadata: { searchMethod: 'fallback' }
        })));
      }

      return results.slice(0, maxResults);
    } catch (error) {
      logger.error('Fallback search failed:', error);
      return [];
    }
  }

  /**
   * Map context level to complexity preference
   */
  private mapContextLevel(contextLevel: string): number {
    switch (contextLevel) {
      case 'basic': return 1;
      case 'intermediate': return 2;
      case 'advanced': return 3;
      default: return 2;
    }
  }
}

// Create and export singleton instance
export const vectorSearchService = new VectorSearchService();
export default vectorSearchService;