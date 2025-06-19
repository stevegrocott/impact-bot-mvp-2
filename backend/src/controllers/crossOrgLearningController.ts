import { Request, Response } from 'express';
import crossOrgLearningService from '../services/crossOrgLearningService';
import { transformToCamelCase } from '../utils/caseTransform';

/**
 * Cross-Organizational Learning Controller
 * Handles pattern analysis, benchmarking, learning insights, and recommendations
 */
class CrossOrgLearningController {

  /**
   * Get learning insights for organization context
   * GET /api/v1/cross-org-learning/insights
   */
  async getLearningInsights(req: Request, res: Response): Promise<void> {
    try {
      const { sector, organizationSize, geography } = req.query;

      const context = {
        ...(sector && { sector: sector as string }),
        ...(organizationSize && { organizationSize: organizationSize as string }),
        ...(geography && { geography: geography as string })
      };

      const insights = await crossOrgLearningService.generateLearningInsights(
        Object.keys(context).length > 0 ? context : undefined
      );

      res.json({
        success: true,
        data: {
          insights: transformToCamelCase(insights),
          totalInsights: insights.length,
          categories: this.categorizeInsights(insights),
          contextFilters: context
        },
        message: `Found ${insights.length} learning insights`
      });
    } catch (error) {
      console.error('Error fetching learning insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch learning insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get benchmarking data for organization
   * GET /api/v1/cross-org-learning/benchmarks
   */
  async getBenchmarkingData(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const { metrics } = req.query;

      if (!metrics) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameter: metrics (comma-separated list)'
        });
        return;
      }

      const metricsList = (metrics as string).split(',').map(m => m.trim());
      
      const benchmarkData = await crossOrgLearningService.getBenchmarkingData(
        organizationId,
        metricsList
      );

      res.json({
        success: true,
        data: {
          benchmarks: transformToCamelCase(benchmarkData),
          organizationId,
          requestedMetrics: metricsList,
          benchmarkSummary: this.generateBenchmarkSummary(benchmarkData)
        },
        message: `Retrieved benchmarks for ${metricsList.length} metrics`
      });
    } catch (error) {
      console.error('Error fetching benchmarking data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch benchmarking data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get personalized recommendations based on learning patterns
   * POST /api/v1/cross-org-learning/recommendations
   */
  async getPersonalizedRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const {
        foundationReadiness,
        currentPhase,
        teamExperience,
        resourceLevel,
        priorities
      } = req.body;

      if (foundationReadiness === undefined || !currentPhase || !teamExperience || !resourceLevel) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: foundationReadiness, currentPhase, teamExperience, resourceLevel'
        });
        return;
      }

      const context = {
        foundationReadiness,
        currentPhase,
        teamExperience,
        resourceLevel,
        priorities: priorities || []
      };

      const recommendations = await crossOrgLearningService.generatePersonalizedRecommendations(
        organizationId,
        context
      );

      res.json({
        success: true,
        data: {
          recommendations: transformToCamelCase(recommendations),
          totalRecommendations: recommendations.length,
          context: transformToCamelCase(context),
          priorityDistribution: this.analyzePriorityDistribution(recommendations)
        },
        message: `Generated ${recommendations.length} personalized recommendations`
      });
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Extract and analyze organization patterns
   * POST /api/v1/cross-org-learning/extract-patterns
   */
  async extractOrganizationPatterns(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const patterns = await crossOrgLearningService.extractOrganizationPatterns(organizationId);

      res.json({
        success: true,
        data: {
          patterns: transformToCamelCase(patterns),
          totalPatterns: patterns.length,
          patternTypes: this.analyzePatternTypes(patterns),
          qualityMetrics: this.calculatePatternQuality(patterns)
        },
        message: `Extracted ${patterns.length} organizational patterns`
      });
    } catch (error) {
      console.error('Error extracting organization patterns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to extract patterns',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get cross-organizational analytics
   * GET /api/v1/cross-org-learning/analytics
   */
  async getCrossOrgAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await crossOrgLearningService.getCrossOrgAnalytics();

      res.json({
        success: true,
        data: transformToCamelCase(analytics),
        message: 'Cross-organizational analytics retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching cross-org analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Submit innovation for community validation
   * POST /api/v1/cross-org-learning/submit-innovation
   */
  async submitInnovation(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const {
        title,
        description,
        category,
        context,
        results,
        evidence
      } = req.body;

      if (!title || !description || !category || !context || !results) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: title, description, category, context, results'
        });
        return;
      }

      const innovation = {
        title,
        description,
        category,
        context,
        results,
        evidence: evidence || []
      };

      const submission = await crossOrgLearningService.submitInnovation(organizationId, innovation);

      res.status(201).json({
        success: true,
        data: transformToCamelCase(submission),
        message: 'Innovation submitted for validation successfully'
      });
    } catch (error) {
      console.error('Error submitting innovation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit innovation',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get insight by ID with detailed analysis
   * GET /api/v1/cross-org-learning/insights/:insightId
   */
  async getInsightById(req: Request, res: Response): Promise<void> {
    try {
      const { insightId } = req.params;

      if (!insightId) {
        res.status(400).json({ success: false, error: 'Insight ID is required' });
        return;
      }

      const insights = await crossOrgLearningService.generateLearningInsights();
      const insight = insights.find(i => i.id === insightId);

      if (!insight) {
        res.status(404).json({ success: false, error: 'Insight not found' });
        return;
      }

      // Generate additional context for the specific insight
      const detailedInsight = {
        ...insight,
        relatedInsights: insights.filter(i => 
          i.id !== insightId && 
          (i.category === insight.category || 
           i.applicability.some(a => insight.applicability.some(ia => ia.condition === a.condition)))
        ).slice(0, 3),
        implementationGuide: this.generateImplementationGuide(insight),
        successStories: this.generateSuccessStories(insight)
      };

      res.json({
        success: true,
        data: transformToCamelCase(detailedInsight),
        message: `Retrieved detailed insight: ${insight.title}`
      });
    } catch (error) {
      console.error('Error fetching insight by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch insight',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get peer comparison for organization
   * GET /api/v1/cross-org-learning/peer-comparison
   */
  async getPeerComparison(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const { metrics, peerCriteria } = req.query;

      const metricsList = metrics ? (metrics as string).split(',').map(m => m.trim()) : [
        'foundation_readiness',
        'stakeholder_satisfaction',
        'measurement_quality'
      ];

      const benchmarkData = await crossOrgLearningService.getBenchmarkingData(
        organizationId,
        metricsList
      );

      const peerComparison = {
        organizationPerformance: benchmarkData.map(b => ({
          metric: b.metric,
          value: b.organizationValue,
          percentile: b.organizationPercentile,
          trend: b.trendDirection
        })),
        peerGroup: benchmarkData[0]?.peerGroup,
        performanceGaps: benchmarkData.map(b => ({
          metric: b.metric,
          gap: b.organizationValue - b.peerAverage,
          gapToTopQuartile: b.topQuartile - b.organizationValue,
          improvementPotential: b.topQuartile - b.organizationValue
        })),
        recommendations: benchmarkData.flatMap(b => b.recommendedTargets.map(t => ({
          metric: b.metric,
          timeframe: t.timeframe,
          target: t.target,
          actions: t.requiredActions
        })))
      };

      res.json({
        success: true,
        data: transformToCamelCase(peerComparison),
        message: 'Peer comparison analysis completed'
      });
    } catch (error) {
      console.error('Error generating peer comparison:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate peer comparison',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Helper methods

  private categorizeInsights(insights: any[]): Record<string, number> {
    const categories: Record<string, number> = {};
    insights.forEach(insight => {
      categories[insight.category] = (categories[insight.category] || 0) + 1;
    });
    return categories;
  }

  private generateBenchmarkSummary(benchmarkData: any[]): any {
    const totalMetrics = benchmarkData.length;
    const aboveAverage = benchmarkData.filter(b => b.organizationValue > b.peerAverage).length;
    const topQuartile = benchmarkData.filter(b => b.organizationPercentile >= 75).length;

    return {
      totalMetrics,
      aboveAverageCount: aboveAverage,
      topQuartileCount: topQuartile,
      averagePercentile: benchmarkData.reduce((sum, b) => sum + b.organizationPercentile, 0) / totalMetrics,
      strongestMetric: benchmarkData.reduce((max, b) => 
        b.organizationPercentile > max.organizationPercentile ? b : max, benchmarkData[0]
      )?.metric,
      improvementOpportunity: benchmarkData.reduce((min, b) => 
        b.organizationPercentile < min.organizationPercentile ? b : min, benchmarkData[0]
      )?.metric
    };
  }

  private analyzePriorityDistribution(recommendations: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    recommendations.forEach(rec => {
      distribution[rec.priority] = (distribution[rec.priority] || 0) + 1;
    });
    return distribution;
  }

  private analyzePatternTypes(patterns: any[]): Record<string, number> {
    const types: Record<string, number> = {};
    patterns.forEach(pattern => {
      types[pattern.patternType] = (types[pattern.patternType] || 0) + 1;
    });
    return types;
  }

  private calculatePatternQuality(patterns: any[]): any {
    if (patterns.length === 0) return { averageQuality: 0, averageConfidence: 0 };

    const avgQuality = patterns.reduce((sum, p) => sum + p.metrics.qualityScore, 0) / patterns.length;
    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidenceScore, 0) / patterns.length;

    return {
      averageQuality: Math.round(avgQuality),
      averageConfidence: Math.round(avgConfidence),
      highQualityCount: patterns.filter(p => p.metrics.qualityScore >= 80).length,
      highConfidenceCount: patterns.filter(p => p.confidenceScore >= 85).length
    };
  }

  private generateImplementationGuide(insight: any): any {
    return {
      overview: `Step-by-step guide to implement ${insight.title}`,
      prerequisites: insight.applicability.flatMap((a: any) => a.contextRequirements),
      phases: [
        {
          phase: 'Preparation',
          duration: '1-2 days',
          activities: ['Assess current state', 'Gather required resources', 'Plan implementation timeline']
        },
        {
          phase: 'Implementation',
          duration: '1-2 weeks',
          activities: insight.recommendations.slice(0, 2)
        },
        {
          phase: 'Validation',
          duration: '1 week',
          activities: ['Monitor success indicators', 'Collect feedback', 'Adjust approach if needed']
        }
      ],
      successMetrics: insight.successFactors,
      commonPitfalls: insight.riskFactors
    };
  }

  private generateSuccessStories(insight: any): any[] {
    // Mock success stories based on insight type
    return [
      {
        organizationType: 'Medium Education Organization',
        challenge: 'Low stakeholder engagement in theory validation',
        implementation: insight.recommendations[0],
        results: 'Increased stakeholder satisfaction by 28% and reduced foundation completion time by 40%',
        timeframe: '2 weeks',
        keyLearning: 'Early engagement prevents later revisions and builds stronger buy-in'
      }
    ];
  }
}

export default new CrossOrgLearningController();