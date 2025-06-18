/**
 * IRIS+ Service
 * Optimized services for IRIS+ framework data retrieval and recommendations
 */

import { prisma } from '@/config/database';
import { cacheService, IrisCacheService } from './cache';
import { logger, PerformanceLogger } from '@/utils/logger';
import { config } from '@/config/environment';
import { DatabaseError, AppError } from '@/utils/errors';

interface CategoryWithStats {
  id: string;
  name: string;
  description?: string | undefined;
  themeCount: number;
  goalCount: number;
  indicatorCount: number;
  themes: ThemeWithGoals[];
}

interface ThemeWithGoals {
  id: string;
  name: string;
  description?: string | undefined;
  goalCount: number;
  goals: StrategicGoalWithIndicators[];
}

interface StrategicGoalWithIndicators {
  id: string;
  name: string;
  description?: string | undefined;
  definition?: string | undefined;
  indicatorCount: number;
  sdgs: SDGReference[];
  keyDimensions: KeyDimensionReference[];
  indicators?: IndicatorWithData[];
}

interface IndicatorWithData {
  id: string;
  name: string;
  description?: string | undefined;
  calculationGuidance?: string | undefined;
  whyImportant?: string | undefined;
  complexityLevel: string;
  dataCollectionFrequency?: string | undefined;
  dataRequirements: DataRequirement[];
}

interface DataRequirement {
  id: string;
  name: string;
  description?: string | undefined;
  definition?: string | undefined;
  calculation?: string | undefined;
  dataType?: string | undefined;
  unitOfMeasurement?: string | undefined;
  isRequired: boolean;
  calculationWeight: number;
}

interface SDGReference {
  id: string;
  sdgNumber: number;
  name: string;
  colorHex?: string | undefined;
}

interface KeyDimensionReference {
  id: string;
  name: string;
  description?: string | undefined;
}

interface SearchFilters {
  categories?: string[];
  themes?: string[];
  sdgs?: number[];
  complexityLevels?: string[];
  query?: string;
  limit?: number;
  offset?: number;
}

interface SearchResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  facets?: {
    categories: { name: string; count: number }[];
    themes: { name: string; count: number }[];
    sdgs: { number: number; name: string; count: number }[];
    complexityLevels: { level: string; count: number }[];
  };
}

export class IrisService {
  
  /**
   * Get all impact categories with hierarchical data
   */
  @PerformanceLogger.decorator('iris_get_categories_hierarchy')
  async getCategoriesWithHierarchy(): Promise<CategoryWithStats[]> {
    const cacheKey = IrisCacheService['CACHE_KEYS'].CATEGORIES;
    
    return IrisCacheService.getCachedOrFetch(
      cacheKey,
      async () => {
        const categories = await prisma.irisImpactCategory.findMany({
          include: {
            themes: {
              include: {
                themeGoals: {
                  include: {
                    goal: {
                      include: {
                        goalSdgs: {
                          include: {
                            sdg: true
                          }
                        },
                        goalKeyDimensions: {
                          include: {
                            keyDimension: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            sortOrder: 'asc'
          }
        });

        return categories.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description || undefined,
          themeCount: category.themes.length,
          goalCount: category.themes.reduce((sum, theme) => sum + theme.themeGoals.length, 0),
          indicatorCount: 0, // Will be computed if needed
          themes: category.themes.map(theme => ({
            id: theme.id,
            name: theme.name,
            description: theme.description || undefined,
            goalCount: theme.themeGoals.length,
            goals: theme.themeGoals.map(tg => ({
              id: tg.goal.id,
              name: tg.goal.name,
              description: tg.goal.description || undefined,
              definition: tg.goal.definition || undefined,
              indicatorCount: 0, // Will be computed if needed
              sdgs: tg.goal.goalSdgs.map(gs => ({
                id: gs.sdg.id,
                sdgNumber: gs.sdg.sdgNumber,
                name: gs.sdg.name,
                colorHex: gs.sdg.colorHex || undefined
              })),
              keyDimensions: tg.goal.goalKeyDimensions.map(gkd => ({
                id: gkd.keyDimension.id,
                name: gkd.keyDimension.name,
                description: gkd.keyDimension.description || undefined
              }))
            }))
          }))
        }));
      },
      config.CACHE_TTL_IRIS_DATA,
      ['iris', 'iris:reference', 'iris:categories']
    );
  }

  /**
   * Get strategic goals by category with full context
   */
  @PerformanceLogger.decorator('iris_get_goals_by_category')
  async getStrategicGoalsByCategory(categoryId: string): Promise<StrategicGoalWithIndicators[]> {
    const cacheKey = `iris:goals:category:${categoryId}`;
    
    return IrisCacheService.getCachedOrFetch(
      cacheKey,
      async () => {
        // Use materialized view for optimized query
        const goals = await prisma.$queryRaw<any[]>`
          SELECT DISTINCT
            g.id,
            g.name,
            g.description,
            g.definition,
            COUNT(DISTINCT i.id) as indicator_count
          FROM iris_strategic_goals g
          JOIN iris_theme_goals tg ON tg.goal_id = g.id
          JOIN iris_impact_themes t ON t.id = tg.theme_id
          JOIN iris_impact_categories c ON c.id = t.category_id
          LEFT JOIN iris_goal_key_dimensions gkd ON gkd.goal_id = g.id
          LEFT JOIN iris_key_dimension_core_metric_sets kdcms ON kdcms.key_dimension_id = gkd.key_dimension_id
          LEFT JOIN iris_core_metric_set_indicators cmsi ON cmsi.core_metric_set_id = kdcms.core_metric_set_id
          LEFT JOIN iris_key_indicators i ON i.id = cmsi.indicator_id
          WHERE c.id = ${categoryId}::uuid
          GROUP BY g.id, g.name, g.description, g.definition
          ORDER BY g.sort_order, g.name
        `;

        // Get additional data for each goal
        const enrichedGoals = await Promise.all(
          goals.map(async (goal) => {
            const [sdgs, keyDimensions] = await Promise.all([
              prisma.irisGoalSdg.findMany({
                where: { goalId: goal.id },
                include: { sdg: true }
              }),
              prisma.irisGoalKeyDimension.findMany({
                where: { goalId: goal.id },
                include: { keyDimension: true }
              })
            ]);

            return {
              id: goal.id,
              name: goal.name,
              description: goal.description || undefined,
              definition: goal.definition || undefined,
              indicatorCount: parseInt(goal.indicator_count) || 0,
              sdgs: sdgs.map(gs => ({
                id: gs.sdg.id,
                sdgNumber: gs.sdg.sdgNumber,
                name: gs.sdg.name,
                colorHex: gs.sdg.colorHex || undefined
              })),
              keyDimensions: keyDimensions.map(gkd => ({
                id: gkd.keyDimension.id,
                name: gkd.keyDimension.name,
                description: gkd.keyDimension.description || undefined
              }))
            };
          })
        );

        return enrichedGoals;
      },
      config.CACHE_TTL_IRIS_DATA,
      ['iris', 'iris:goals', `iris:category:${categoryId}`]
    );
  }

  /**
   * Get indicators for a strategic goal with data requirements
   */
  @PerformanceLogger.decorator('iris_get_indicators_by_goal')
  async getIndicatorsByGoal(goalId: string): Promise<IndicatorWithData[]> {
    const cacheKey = `iris:indicators:goal:${goalId}`;
    
    return IrisCacheService.getCachedOrFetch(
      cacheKey,
      async () => {
        // Query indicators through the relationship chain
        const indicators = await prisma.$queryRaw<any[]>`
          SELECT DISTINCT
            i.id,
            i.name,
            i.description,
            i.calculation_guidance,
            i.why_important,
            i.complexity_level,
            i.data_collection_frequency
          FROM iris_key_indicators i
          JOIN iris_core_metric_set_indicators cmsi ON cmsi.indicator_id = i.id
          JOIN iris_key_dimension_core_metric_sets kdcms ON kdcms.core_metric_set_id = cmsi.core_metric_set_id
          JOIN iris_goal_key_dimensions gkd ON gkd.key_dimension_id = kdcms.key_dimension_id
          WHERE gkd.goal_id = ${goalId}::uuid
          ORDER BY cmsi.priority_level, i.sort_order, i.name
        `;

        // Get data requirements for each indicator
        const enrichedIndicators = await Promise.all(
          indicators.map(async (indicator) => {
            const dataRequirements = await prisma.irisIndicatorDataRequirement.findMany({
              where: { indicatorId: indicator.id },
              include: {
                dataRequirement: true
              },
              orderBy: {
                calculationWeight: 'desc'
              }
            });

            return {
              id: indicator.id,
              name: indicator.name,
              description: indicator.description || undefined,
              calculationGuidance: indicator.calculation_guidance || undefined,
              whyImportant: indicator.why_important || undefined,
              complexityLevel: indicator.complexity_level,
              dataCollectionFrequency: indicator.data_collection_frequency || undefined,
              dataRequirements: dataRequirements.map(idr => ({
                id: idr.dataRequirement.id,
                name: idr.dataRequirement.name,
                description: idr.dataRequirement.description || undefined,
                definition: idr.dataRequirement.definition || undefined,
                calculation: idr.dataRequirement.calculation || undefined,
                dataType: idr.dataRequirement.dataType || undefined,
                unitOfMeasurement: idr.dataRequirement.unitOfMeasurement || undefined,
                isRequired: idr.isRequired,
                calculationWeight: parseFloat(idr.calculationWeight.toString())
              }))
            };
          })
        );

        return enrichedIndicators;
      },
      config.CACHE_TTL_IRIS_DATA,
      ['iris', 'iris:indicators', `iris:goal:${goalId}`]
    );
  }

  /**
   * Search across IRIS+ framework with filters and facets
   */
  @PerformanceLogger.decorator('iris_search')
  async search(filters: SearchFilters): Promise<SearchResult<any>> {
    const cacheKey = `iris:search:${Buffer.from(JSON.stringify(filters)).toString('base64')}`;
    
    return IrisCacheService.getCachedOrFetch(
      cacheKey,
      async () => {
        const { query, categories, themes, sdgs, complexityLevels, limit = 20, offset = 0 } = filters;

        // Build search query
        let whereConditions = [];
        let queryParams: any[] = [];
        let paramIndex = 1;

        // Text search
        if (query) {
          whereConditions.push(`
            (i.name ILIKE $${paramIndex} OR 
             i.description ILIKE $${paramIndex} OR
             g.name ILIKE $${paramIndex} OR
             g.description ILIKE $${paramIndex})
          `);
          queryParams.push(`%${query}%`);
          paramIndex++;
        }

        // Category filter
        if (categories && categories.length > 0) {
          whereConditions.push(`c.id = ANY($${paramIndex}::uuid[])`);
          queryParams.push(categories);
          paramIndex++;
        }

        // Theme filter
        if (themes && themes.length > 0) {
          whereConditions.push(`t.id = ANY($${paramIndex}::uuid[])`);
          queryParams.push(themes);
          paramIndex++;
        }

        // SDG filter
        if (sdgs && sdgs.length > 0) {
          whereConditions.push(`sdg.sdg_number = ANY($${paramIndex}::integer[])`);
          queryParams.push(sdgs);
          paramIndex++;
        }

        // Complexity filter
        if (complexityLevels && complexityLevels.length > 0) {
          whereConditions.push(`i.complexity_level = ANY($${paramIndex}::text[])`);
          queryParams.push(complexityLevels);
          paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Main search query
        const searchQuery = `
          SELECT DISTINCT
            i.id,
            i.name,
            i.description,
            i.complexity_level,
            g.id as goal_id,
            g.name as goal_name,
            t.id as theme_id,
            t.name as theme_name,
            c.id as category_id,
            c.name as category_name,
            COUNT(*) OVER() as total_count
          FROM iris_key_indicators i
          JOIN iris_core_metric_set_indicators cmsi ON cmsi.indicator_id = i.id
          JOIN iris_key_dimension_core_metric_sets kdcms ON kdcms.core_metric_set_id = cmsi.core_metric_set_id
          JOIN iris_goal_key_dimensions gkd ON gkd.key_dimension_id = kdcms.key_dimension_id
          JOIN iris_strategic_goals g ON g.id = gkd.goal_id
          JOIN iris_theme_goals tg ON tg.goal_id = g.id
          JOIN iris_impact_themes t ON t.id = tg.theme_id
          JOIN iris_impact_categories c ON c.id = t.category_id
          LEFT JOIN iris_goal_sdgs gs ON gs.goal_id = g.id
          LEFT JOIN sustainable_development_goals sdg ON sdg.id = gs.sdg_id
          ${whereClause}
          ORDER BY i.name
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(limit, offset);

        const results = await prisma.$queryRawUnsafe<any[]>(searchQuery, ...queryParams);

        const total = results.length > 0 ? parseInt(results[0].total_count) : 0;
        const hasMore = offset + limit < total;

        // Generate facets (simplified for performance)
        const facets = await this.generateSearchFacets(filters);

        return {
          items: results.map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            complexityLevel: r.complexity_level,
            goal: {
              id: r.goal_id,
              name: r.goal_name
            },
            theme: {
              id: r.theme_id,
              name: r.theme_name
            },
            category: {
              id: r.category_id,
              name: r.category_name
            }
          })),
          total,
          hasMore,
          facets
        };
      },
      1800, // 30 minutes cache for search results
      ['iris', 'iris:search']
    );
  }

  /**
   * Get recommendations based on organization context
   */
  @PerformanceLogger.decorator('iris_get_recommendations')
  async getRecommendationsForOrganization(context: {
    industry?: string;
    impactAreas?: string[];
    organizationSize?: string;
    existingGoals?: string[];
  }): Promise<{
    recommendedGoals: StrategicGoalWithIndicators[];
    reasoning: string;
    confidence: number;
  }> {
    const cacheKey = `iris:recommendations:${Buffer.from(JSON.stringify(context)).toString('base64')}`;
    
    return IrisCacheService.getCachedOrFetch(
      cacheKey,
      async () => {
        // Use materialized view for fast lookups
        const categoryDataQuery = await prisma.$queryRaw<any[]>`
          SELECT DISTINCT
            category_name,
            goal_names,
            related_goals_count,
            related_indicators_count
          FROM mv_category_to_data_requirements
          ORDER BY related_goals_count DESC, related_indicators_count DESC
          LIMIT 50
        `;

        // Simple recommendation logic based on context
        let recommendedCategories: string[] = [];
        
        if (context.impactAreas) {
          // Map impact areas to categories
          const areaMapping: Record<string, string[]> = {
            'education': ['Education'],
            'health': ['Health'],
            'environment': ['Climate', 'Air', 'Water', 'Biodiversity and Ecosystems'],
            'energy': ['Energy'],
            'finance': ['Financial Services'],
            'agriculture': ['Agriculture'],
            'employment': ['Employment', 'Diversity and Inclusion']
          };

          context.impactAreas.forEach(area => {
            const categories = areaMapping[area.toLowerCase()];
            if (categories) {
              recommendedCategories.push(...categories);
            }
          });
        }

        // Get goals for recommended categories
        const goals = await Promise.all(
          recommendedCategories.slice(0, 3).map(async (categoryName) => {
            const category = await prisma.irisImpactCategory.findFirst({
              where: { name: { contains: categoryName, mode: 'insensitive' } }
            });
            
            if (category) {
              return this.getStrategicGoalsByCategory(category.id);
            }
            return [];
          })
        );

        const flatGoals = goals.flat().slice(0, 5);

        return {
          recommendedGoals: flatGoals,
          reasoning: `Recommendations based on ${context.impactAreas?.join(', ') || 'general impact areas'} and organization context.`,
          confidence: 0.75
        };
      },
      3600, // 1 hour cache
      ['iris', 'iris:recommendations']
    );
  }

  /**
   * Generate search facets for filtering
   */
  private async generateSearchFacets(filters: SearchFilters): Promise<any> {
    // Simplified facet generation - in production, this would be more comprehensive
    const [categories, themes, sdgs] = await Promise.all([
      prisma.irisImpactCategory.findMany({
        select: { name: true },
        orderBy: { name: 'asc' }
      }),
      prisma.irisImpactTheme.findMany({
        select: { name: true },
        orderBy: { name: 'asc' }
      }),
      prisma.sustainableDevelopmentGoal.findMany({
        select: { sdgNumber: true, name: true },
        orderBy: { sdgNumber: 'asc' }
      })
    ]);

    return {
      categories: categories.map(c => ({ name: c.name, count: 0 })),
      themes: themes.map(t => ({ name: t.name, count: 0 })),
      sdgs: sdgs.map(s => ({ number: s.sdgNumber, name: s.name, count: 0 })),
      complexityLevels: [
        { level: 'basic', count: 0 },
        { level: 'intermediate', count: 0 },
        { level: 'advanced', count: 0 }
      ]
    };
  }

  /**
   * Get IRIS+ statistics for dashboard
   */
  async getStatistics(): Promise<{
    totalCategories: number;
    totalThemes: number;
    totalGoals: number;
    totalIndicators: number;
    totalDataRequirements: number;
    relationshipCounts: {
      themeGoals: number;
      goalSdgs: number;
      indicatorDataRequirements: number;
    };
  }> {
    const cacheKey = 'iris:statistics';
    
    return IrisCacheService.getCachedOrFetch(
      cacheKey,
      async () => {
        const [
          categoryCount,
          themeCount,
          goalCount,
          indicatorCount,
          dataReqCount,
          themeGoalCount,
          goalSdgCount,
          indicatorDataCount
        ] = await Promise.all([
          prisma.irisImpactCategory.count(),
          prisma.irisImpactTheme.count(),
          prisma.irisStrategicGoal.count(),
          prisma.irisKeyIndicator.count(),
          prisma.irisDataRequirement.count(),
          prisma.irisThemeGoal.count(),
          prisma.irisGoalSdg.count(),
          prisma.irisIndicatorDataRequirement.count()
        ]);

        return {
          totalCategories: categoryCount,
          totalThemes: themeCount,
          totalGoals: goalCount,
          totalIndicators: indicatorCount,
          totalDataRequirements: dataReqCount,
          relationshipCounts: {
            themeGoals: themeGoalCount,
            goalSdgs: goalSdgCount,
            indicatorDataRequirements: indicatorDataCount
          }
        };
      },
      config.CACHE_TTL_IRIS_DATA,
      ['iris', 'iris:statistics']
    );
  }

  /**
   * Health check for IRIS+ service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const count = await prisma.irisImpactCategory.count();
      return count > 0;
    } catch (error) {
      logger.error('IRIS+ service health check failed', { error });
      return false;
    }
  }


  /**
   * Get all impact categories
   */
  async getCategories(): Promise<CategoryWithStats[]> {
    return this.getCategoriesWithHierarchy();
  }

  /**
   * Get impact themes by category
   */
  async getThemesByCategory(categoryId: string): Promise<ThemeWithGoals[]> {
    const categories = await this.getCategoriesWithHierarchy();
    const category = categories.find(c => c.id === categoryId);
    return category ? category.themes : [];
  }

  /**
   * Get strategic goals
   */
  async getStrategicGoals(): Promise<StrategicGoalWithIndicators[]> {
    const cacheKey = 'strategic_goals_all';
    return IrisCacheService.getCachedOrFetch(
      cacheKey,
      async () => {
        const goals = await prisma.irisStrategicGoal.findMany({
          orderBy: { name: 'asc' },
          include: {
            goalSdgs: {
              include: {
                sdg: true
              }
            },
            goalKeyDimensions: {
              include: {
                keyDimension: true
              }
            }
          }
        });

        return goals.map(goal => ({
          id: goal.id,
          name: goal.name,
          description: goal.description || undefined,
          definition: goal.definition || undefined,
          indicatorCount: 0, // Will be computed if needed via separate query
          sdgs: goal.goalSdgs.map(gs => ({
            id: gs.sdg.id,
            sdgNumber: gs.sdg.sdgNumber,
            name: gs.sdg.name,
            colorHex: gs.sdg.colorHex || undefined
          })),
          keyDimensions: goal.goalKeyDimensions.map(gkd => ({
            id: gkd.keyDimension.id,
            name: gkd.keyDimension.name,
            description: gkd.keyDimension.description || undefined
          }))
        }));
      },
      config.CACHE_TTL_IRIS_DATA,
      ['iris', 'strategic_goals']
    );
  }

  /**
   * Get key indicators with filtering
   */
  async getKeyIndicators(options: {
    category?: string;
    theme?: string;
    goal?: string;
    complexityLevel?: string;
    sector?: string;
    page?: number;
    limit?: number;
  }): Promise<{ indicators: IndicatorWithData[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 20, ...filters } = options;
    const offset = (page - 1) * limit;

    const whereClause: any = {};
    
    if (filters.complexityLevel) {
      whereClause.complexityLevel = filters.complexityLevel;
    }

    // For goal filtering, we need to use a complex query through the relationship chain
    let goalFilter = '';
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (filters.goal) {
      goalFilter = `
        AND EXISTS (
          SELECT 1 FROM iris_core_metric_set_indicators cmsi
          JOIN iris_key_dimension_core_metric_sets kdcms ON kdcms.core_metric_set_id = cmsi.core_metric_set_id
          JOIN iris_goal_key_dimensions gkd ON gkd.key_dimension_id = kdcms.key_dimension_id
          WHERE cmsi.indicator_id = i.id AND gkd.goal_id = $${paramIndex}::uuid
        )
      `;
      queryParams.push(filters.goal);
      paramIndex++;
    }

    const countQuery = `
      SELECT COUNT(DISTINCT i.id) as total
      FROM iris_key_indicators i
      WHERE ($${paramIndex}::text IS NULL OR i.complexity_level = $${paramIndex}::text)
      ${goalFilter}
    `;
    
    const dataQuery = `
      SELECT DISTINCT i.id, i.name, i.description, i.calculation_guidance, 
             i.why_important, i.complexity_level, i.data_collection_frequency
      FROM iris_key_indicators i
      WHERE ($${paramIndex}::text IS NULL OR i.complexity_level = $${paramIndex}::text)
      ${goalFilter}
      ORDER BY i.name
      LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
    `;

    queryParams.push(filters.complexityLevel || null, limit, offset);

    const [totalResult, indicators] = await Promise.all([
      prisma.$queryRawUnsafe<{total: bigint}[]>(countQuery, ...queryParams.slice(0, queryParams.length - 2)),
      prisma.$queryRawUnsafe<any[]>(dataQuery, ...queryParams)
    ]);

    const total = Number(totalResult[0]?.total || 0);

    // Get data requirements for each indicator
    const enrichedIndicators = await Promise.all(
      indicators.map(async (indicator) => {
        const dataRequirements = await prisma.irisIndicatorDataRequirement.findMany({
          where: { indicatorId: indicator.id },
          include: {
            dataRequirement: true
          },
          orderBy: {
            calculationWeight: 'desc'
          }
        });

        return {
          id: indicator.id,
          name: indicator.name,
          description: indicator.description || undefined,
          calculationGuidance: indicator.calculation_guidance || undefined,
          whyImportant: indicator.why_important || undefined,
          complexityLevel: indicator.complexity_level,
          dataCollectionFrequency: indicator.data_collection_frequency || undefined,
          dataRequirements: dataRequirements.map(idr => ({
            id: idr.dataRequirement.id,
            name: idr.dataRequirement.name,
            description: idr.dataRequirement.description || undefined,
            definition: idr.dataRequirement.definition || undefined,
            calculation: idr.dataRequirement.calculation || undefined,
            dataType: idr.dataRequirement.dataType || undefined,
            unitOfMeasurement: idr.dataRequirement.unitOfMeasurement || undefined,
            isRequired: idr.isRequired,
            calculationWeight: parseFloat(idr.calculationWeight.toString())
          }))
        };
      })
    );

    return {
      indicators: enrichedIndicators,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get indicator by ID
   */
  async getIndicatorById(id: string): Promise<IndicatorWithData | null> {
    const indicator = await prisma.irisKeyIndicator.findUnique({
      where: { id },
      include: {
        indicatorDataRequirements: {
          include: {
            dataRequirement: true
          },
          orderBy: {
            calculationWeight: 'desc'
          }
        }
      }
    });

    if (!indicator) return null;

    return {
      id: indicator.id,
      name: indicator.name,
      description: indicator.description || undefined,
      calculationGuidance: indicator.calculationGuidance || undefined,
      whyImportant: indicator.whyImportant || undefined,
      complexityLevel: indicator.complexityLevel,
      dataCollectionFrequency: indicator.dataCollectionFrequency || undefined,
      dataRequirements: indicator.indicatorDataRequirements.map(idr => ({
        id: idr.dataRequirement.id,
        name: idr.dataRequirement.name,
        description: idr.dataRequirement.description || undefined,
        definition: idr.dataRequirement.definition || undefined,
        calculation: idr.dataRequirement.calculation || undefined,
        dataType: idr.dataRequirement.dataType || undefined,
        unitOfMeasurement: idr.dataRequirement.unitOfMeasurement || undefined,
        isRequired: idr.isRequired,
        calculationWeight: parseFloat(idr.calculationWeight.toString())
      }))
    };
  }

  /**
   * Search for similar indicators
   */
  async searchSimilarIndicators(searchTerm: string, options: {
    limit?: number;
    complexityLevels?: string[];
    sectors?: string[];
  } = {}): Promise<IndicatorWithData[]> {
    const { limit = 10, complexityLevels, sectors } = options;
    
    const whereClause: any = {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ]
    };

    if (complexityLevels?.length) {
      whereClause.complexityLevel = { in: complexityLevels };
    }

    const indicators = await prisma.irisKeyIndicator.findMany({
      where: whereClause,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        indicatorDataRequirements: {
          include: {
            dataRequirement: true
          },
          orderBy: {
            calculationWeight: 'desc'
          }
        }
      }
    });

    return indicators.map(ind => ({
      id: ind.id,
      name: ind.name,
      description: ind.description || undefined,
      calculationGuidance: ind.calculationGuidance || undefined,
      whyImportant: ind.whyImportant || undefined,
      complexityLevel: ind.complexityLevel,
      dataCollectionFrequency: ind.dataCollectionFrequency || undefined,
      dataRequirements: ind.indicatorDataRequirements.map(idr => ({
        id: idr.dataRequirement.id,
        name: idr.dataRequirement.name,
        description: idr.dataRequirement.description || undefined,
        definition: idr.dataRequirement.definition || undefined,
        calculation: idr.dataRequirement.calculation || undefined,
        dataType: idr.dataRequirement.dataType || undefined,
        unitOfMeasurement: idr.dataRequirement.unitOfMeasurement || undefined,
        isRequired: idr.isRequired,
        calculationWeight: parseFloat(idr.calculationWeight.toString())
      }))
    }));
  }

  /**
   * Get contextual recommendations
   */
  async getContextualRecommendations(context: {
    organizationType?: string;
    sector?: string;
    stage?: string;
    existingMeasurements?: string[];
  }): Promise<{
    recommended: IndicatorWithData[];
    reasoning: string;
    confidence: number;
  }> {
    // Use existing recommendation logic
    const recommendations = await this.getRecommendationsForOrganization({
      industry: context.sector || 'general',
      impactAreas: context.sector ? [context.sector] : [],
      organizationSize: context.organizationType || 'medium',
      existingGoals: context.existingMeasurements || []
    });

    // Get indicators for recommended goals
    const allIndicators: IndicatorWithData[] = [];
    for (const goal of recommendations.recommendedGoals.slice(0, 3)) {
      const indicators = await this.getIndicatorsByGoal(goal.id);
      allIndicators.push(...indicators.slice(0, 5)); // Limit to 5 indicators per goal
    }

    return {
      recommended: allIndicators.slice(0, 10), // Limit to 10 total recommendations
      reasoning: recommendations.reasoning,
      confidence: recommendations.confidence
    };
  }
}

// Create and export singleton instance
export const irisService = new IrisService();