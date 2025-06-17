/**
 * Real-Time Warning Service
 * Provides immediate pitfall warnings during user interactions
 * Integrates with pitfall detection service for contextual alerts
 */

import { pitfallDetectionService } from './pitfallDetectionService';
import { userBehaviorAnalyticsService } from './userBehaviorAnalyticsService';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';

export interface RealTimeWarning {
  id: string;
  type: 'activity_vs_impact' | 'proxy_metric' | 'over_engineering' | 'portfolio_imbalance' | 'foundation_gap';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  explanation: string;
  recommendations: string[];
  actionRequired: boolean;
  dismissible: boolean;
  metadata: Record<string, any>;
  expiresAt?: Date;
}

export interface WarningContext {
  organizationId: string;
  userId: string;
  sessionId: string;
  currentStep: string;
  indicators?: any[];
  theoryOfChange?: any;
  decisionQuestions?: any[];
  foundationLevel?: string;
}

export interface WarningResponse {
  warnings: RealTimeWarning[];
  shouldBlock: boolean;
  allowContinue: boolean;
  nextStepRecommendation?: string;
  contextualGuidance?: string;
}

class RealTimeWarningService {
  
  /**
   * Generate real-time warnings based on current context
   */
  async generateWarnings(
    context: WarningContext,
    triggerAction: string,
    actionData: any = {}
  ): Promise<WarningResponse> {
    try {
      const warnings: RealTimeWarning[] = [];
      let shouldBlock = false;
      let allowContinue = true;

      // Check for foundation-related warnings
      const foundationWarnings = await this.checkFoundationWarnings(context);
      warnings.push(...foundationWarnings);

      // Check for indicator-specific warnings
      if (context.indicators && context.indicators.length > 0) {
        const indicatorWarnings = await this.checkIndicatorWarnings(context, actionData);
        warnings.push(...indicatorWarnings);
      }

      // Check for portfolio balance warnings
      if (triggerAction === 'indicator_selection' && context.indicators) {
        const portfolioWarnings = await this.checkPortfolioWarnings(context);
        warnings.push(...portfolioWarnings);
      }

      // Check for over-engineering warnings
      if (context.indicators && context.indicators.length > 5) {
        const engineeringWarnings = await this.checkOverEngineeringWarnings(context);
        warnings.push(...engineeringWarnings);
      }

      // Determine if we should block progression
      const criticalWarnings = warnings.filter(w => w.severity === 'critical');
      const blockingWarnings = warnings.filter(w => w.actionRequired && !w.dismissible);
      
      shouldBlock = criticalWarnings.length > 0 || blockingWarnings.length > 0;
      allowContinue = !shouldBlock;

      // Generate contextual guidance
      const contextualGuidance = this.generateContextualGuidance(warnings, context);
      const nextStepRecommendation = this.generateNextStepRecommendation(warnings, context);

      // Track warning generation
      await this.trackWarningGeneration(context, warnings, triggerAction);

      return {
        warnings,
        shouldBlock,
        allowContinue,
        nextStepRecommendation,
        contextualGuidance
      };

    } catch (error) {
      logger.error('Error generating real-time warnings:', error);
      throw new AppError('Failed to generate warnings', 500);
    }
  }

  /**
   * Check for foundation-related warnings
   */
  private async checkFoundationWarnings(context: WarningContext): Promise<RealTimeWarning[]> {
    const warnings: RealTimeWarning[] = [];

    // Check if theory of change is missing or incomplete
    if (!context.theoryOfChange || !context.theoryOfChange.targetPopulation) {
      warnings.push({
        id: `foundation-missing-${Date.now()}`,
        type: 'foundation_gap',
        severity: 'critical',
        title: 'Foundation Required',
        message: 'Complete your theory of change before selecting indicators',
        explanation: 'Without a clear theory of change, you risk selecting indicators that don\'t align with your actual impact logic.',
        recommendations: [
          'Complete your theory of change through our guided process',
          'Upload your existing theory of change document',
          'Schedule a foundation consultation with our team'
        ],
        actionRequired: true,
        dismissible: false,
        metadata: {
          foundationLevel: context.foundationLevel,
          missingElements: this.identifyMissingFoundationElements(context.theoryOfChange)
        }
      });
    }

    // Check if decision questions are missing
    if (!context.decisionQuestions || context.decisionQuestions.length === 0) {
      warnings.push({
        id: `decisions-missing-${Date.now()}`,
        type: 'foundation_gap',
        severity: 'high',
        title: 'Decision Questions Missing',
        message: 'Define what decisions this data will inform',
        explanation: 'Without clear decision questions, you may over-engineer your measurement system.',
        recommendations: [
          'Complete the decision mapping exercise',
          'Identify 3-5 key decisions this data will support',
          'Link each indicator to a specific decision need'
        ],
        actionRequired: true,
        dismissible: true,
        metadata: {
          suggestedDecisions: this.generateSuggestedDecisions(context.theoryOfChange)
        }
      });
    }

    return warnings;
  }

  /**
   * Check for indicator-specific warnings
   */
  private async checkIndicatorWarnings(context: WarningContext, actionData: any): Promise<RealTimeWarning[]> {
    const warnings: RealTimeWarning[] = [];

    for (const indicator of context.indicators || []) {
      // Check activity vs impact
      const classification = await pitfallDetectionService.classifyImpactLevel(indicator);
      if (classification.level === 'output' && classification.confidence > 0.7) {
        warnings.push({
          id: `activity-${indicator.id}-${Date.now()}`,
          type: 'activity_vs_impact',
          severity: 'high',
          title: 'Activity vs Impact Warning',
          message: `"${indicator.name}" measures what you do, not what changes`,
          explanation: 'This indicator tracks activities/outputs rather than outcomes or impacts. While important for monitoring, it won\'t tell you if you\'re making a difference.',
          recommendations: [
            'Consider adding outcome indicators that measure changes in your target population',
            'Use this as a process indicator alongside impact measures',
            'Ask: "If this number improved, how would beneficiaries be different?"'
          ],
          actionRequired: false,
          dismissible: true,
          metadata: {
            indicatorId: indicator.id,
            classification: classification,
            suggestedOutcomes: classification.suggestedOutcomes || []
          }
        });
      }

      // Check for proxy metrics
      const proxyAnalysis = await pitfallDetectionService.detectProxyMetrics([indicator]);
      if (proxyAnalysis.proxyIndicators.length > 0) {
        const proxyIndicator = proxyAnalysis.proxyIndicators[0];
        warnings.push({
          id: `proxy-${indicator.id}-${Date.now()}`,
          type: 'proxy_metric',
          severity: 'medium',
          title: 'Proxy Metric Detected',
          message: `"${indicator.name}" may be a proxy for what you really want to measure`,
          explanation: proxyIndicator.explanation,
          recommendations: proxyIndicator.alternatives.map(alt => alt.reasoning),
          actionRequired: false,
          dismissible: true,
          metadata: {
            indicatorId: indicator.id,
            proxyAnalysis: proxyIndicator,
            directAlternatives: proxyIndicator.alternatives
          }
        });
      }
    }

    return warnings;
  }

  /**
   * Check for portfolio balance warnings
   */
  private async checkPortfolioWarnings(context: WarningContext): Promise<RealTimeWarning[]> {
    const warnings: RealTimeWarning[] = [];

    if (!context.indicators || context.indicators.length === 0) {
      return warnings;
    }

    const portfolioAnalysis = await pitfallDetectionService.analyzePortfolioBalance(context.indicators);
    
    if (portfolioAnalysis.imbalanceScore > 0.7) {
      warnings.push({
        id: `portfolio-imbalance-${Date.now()}`,
        type: 'portfolio_imbalance',
        severity: 'medium',
        title: 'Portfolio Imbalance Detected',
        message: 'Your indicators are heavily weighted toward outputs',
        explanation: `${portfolioAnalysis.outputPercentage}% of your indicators measure activities/outputs. A balanced portfolio includes outcomes and impacts.`,
        recommendations: [
          'Add outcome indicators that measure changes in your target population',
          'Consider long-term impact indicators if appropriate',
          'Include qualitative measures to complement quantitative data',
          'Ask: "What changes because of our work?"'
        ],
        actionRequired: false,
        dismissible: true,
        metadata: {
          portfolioAnalysis,
          suggestedOutcomes: portfolioAnalysis.suggestedOutcomes || []
        }
      });
    }

    return warnings;
  }

  /**
   * Check for over-engineering warnings
   */
  private async checkOverEngineeringWarnings(context: WarningContext): Promise<RealTimeWarning[]> {
    const warnings: RealTimeWarning[] = [];

    const indicatorCount = context.indicators?.length || 0;
    const decisionCount = context.decisionQuestions?.length || 0;

    // Check indicator-to-decision ratio
    if (decisionCount > 0 && indicatorCount > (decisionCount * 3)) {
      warnings.push({
        id: `over-engineering-${Date.now()}`,
        type: 'over_engineering',
        severity: 'medium',
        title: 'Over-Engineering Warning',
        message: `${indicatorCount} indicators for ${decisionCount} decisions may be too many`,
        explanation: 'Having too many indicators can lead to measurement burden and reduced data quality. Focus on the most critical measures.',
        recommendations: [
          'Prioritize indicators that directly inform your key decisions',
          'Consider consolidating similar indicators',
          'Ask: "What would happen if we didn\'t measure this?"',
          'Start with 3-5 core indicators and expand gradually'
        ],
        actionRequired: false,
        dismissible: true,
        metadata: {
          indicatorCount,
          decisionCount,
          ratio: indicatorCount / decisionCount,
          consolidationOpportunities: await this.identifyConsolidationOpportunities(context.indicators || [])
        }
      });
    }

    return warnings;
  }

  /**
   * Track warning interactions
   */
  async trackWarningInteraction(
    context: WarningContext,
    warningId: string,
    action: 'shown' | 'dismissed' | 'acted_upon' | 'ignored'
  ): Promise<void> {
    try {
      // Store warning event in database
      await prisma.pitfallWarningEvent.create({
        data: {
          id: warningId,
          organizationId: context.organizationId,
          userId: context.userId,
          sessionId: context.sessionId,
          warningType: this.extractWarningType(warningId),
          shownAt: new Date(),
          userAction: action,
          contextData: {
            currentStep: context.currentStep,
            foundationLevel: context.foundationLevel,
            indicatorCount: context.indicators?.length || 0
          }
        }
      });

      // Track in behavior analytics
      await userBehaviorAnalyticsService.trackEvent(
        context.organizationId,
        context.userId,
        context.sessionId,
        action === 'shown' ? 'pitfall_warning_shown' : 
        action === 'acted_upon' ? 'pitfall_warning_acted_upon' : 'pitfall_warning_dismissed',
        {
          warningId,
          warningType: this.extractWarningType(warningId),
          action
        },
        {
          currentStep: context.currentStep,
          foundationLevel: context.foundationLevel
        }
      );

    } catch (error) {
      logger.error('Error tracking warning interaction:', error);
    }
  }

  /**
   * Get warning effectiveness metrics
   */
  async getWarningEffectiveness(
    organizationId: string,
    timeRange: '24h' | '7d' | '30d' = '7d'
  ): Promise<any> {
    try {
      const timeFilter = this.getTimeFilter(timeRange);

      const warningStats = await prisma.pitfallWarningEvent.groupBy({
        by: ['warningType', 'userAction'],
        where: {
          organizationId,
          shownAt: timeFilter
        },
        _count: true
      });

      const effectiveness = {
        totalWarnings: warningStats.reduce((sum, stat) => sum + stat._count, 0),
        actionRate: 0,
        dismissalRate: 0,
        byType: {} as Record<string, any>
      };

      // Calculate rates by warning type
      const typeStats = warningStats.reduce((acc, stat) => {
        if (!acc[stat.warningType]) {
          acc[stat.warningType] = { shown: 0, acted: 0, dismissed: 0 };
        }
        acc[stat.warningType][stat.userAction] = stat._count;
        return acc;
      }, {} as Record<string, any>);

      Object.keys(typeStats).forEach(type => {
        const stats = typeStats[type];
        const total = stats.shown + stats.acted + stats.dismissed;
        effectiveness.byType[type] = {
          total,
          actionRate: total > 0 ? (stats.acted / total) : 0,
          dismissalRate: total > 0 ? (stats.dismissed / total) : 0
        };
      });

      // Overall rates
      const totalShown = Object.values(effectiveness.byType).reduce((sum: number, type: any) => sum + type.total, 0);
      const totalActed = Object.values(effectiveness.byType).reduce((sum: number, type: any) => sum + (type.total * type.actionRate), 0);
      const totalDismissed = Object.values(effectiveness.byType).reduce((sum: number, type: any) => sum + (type.total * type.dismissalRate), 0);

      effectiveness.actionRate = totalShown > 0 ? (totalActed / totalShown) : 0;
      effectiveness.dismissalRate = totalShown > 0 ? (totalDismissed / totalShown) : 0;

      return effectiveness;

    } catch (error) {
      logger.error('Error getting warning effectiveness:', error);
      throw new AppError('Failed to get warning effectiveness', 500);
    }
  }

  // Helper methods

  private async trackWarningGeneration(
    context: WarningContext,
    warnings: RealTimeWarning[],
    triggerAction: string
  ): Promise<void> {
    try {
      for (const warning of warnings) {
        await this.trackWarningInteraction(context, warning.id, 'shown');
      }
    } catch (error) {
      logger.error('Error tracking warning generation:', error);
    }
  }

  private generateContextualGuidance(warnings: RealTimeWarning[], context: WarningContext): string {
    if (warnings.length === 0) {
      return 'Your measurement approach looks good! Continue with your indicator selection.';
    }

    const criticalWarnings = warnings.filter(w => w.severity === 'critical');
    const highWarnings = warnings.filter(w => w.severity === 'high');

    if (criticalWarnings.length > 0) {
      return 'Critical foundation elements are missing. Complete these before proceeding with indicators.';
    }

    if (highWarnings.length > 0) {
      return 'Several measurement pitfalls detected. Address these warnings to improve your approach.';
    }

    return 'Minor optimization opportunities identified. Consider the suggestions to strengthen your measurement.';
  }

  private generateNextStepRecommendation(warnings: RealTimeWarning[], context: WarningContext): string {
    const criticalWarnings = warnings.filter(w => w.severity === 'critical');
    
    if (criticalWarnings.length > 0) {
      return 'Complete your theory of change foundation before selecting indicators';
    }

    const foundationWarnings = warnings.filter(w => w.type === 'foundation_gap');
    if (foundationWarnings.length > 0) {
      return 'Address foundation gaps in decision mapping';
    }

    const activityWarnings = warnings.filter(w => w.type === 'activity_vs_impact');
    if (activityWarnings.length > 0) {
      return 'Add outcome indicators to balance your portfolio';
    }

    return 'Continue with your current measurement approach';
  }

  private identifyMissingFoundationElements(theoryOfChange: any): string[] {
    const missing = [];
    if (!theoryOfChange?.targetPopulation) missing.push('target population');
    if (!theoryOfChange?.problemDefinition) missing.push('problem definition');
    if (!theoryOfChange?.activities?.length) missing.push('activities');
    if (!theoryOfChange?.shortTermOutcomes?.length) missing.push('short-term outcomes');
    if (!theoryOfChange?.longTermOutcomes?.length) missing.push('long-term outcomes');
    return missing;
  }

  private generateSuggestedDecisions(theoryOfChange: any): string[] {
    const suggestions = [
      'Should we continue this program?',
      'How can we improve our approach?',
      'Are we reaching the right people?',
      'What adaptations are needed?'
    ];

    // Could enhance with AI-generated suggestions based on theory of change
    return suggestions;
  }

  private async identifyConsolidationOpportunities(indicators: any[]): Promise<string[]> {
    // Simplified implementation - could use AI for more sophisticated analysis
    const opportunities = [];
    
    // Look for similar indicators
    const names = indicators.map(i => i.name.toLowerCase());
    const duplicatePatterns = ['participation', 'attendance', 'completion', 'satisfaction'];
    
    for (const pattern of duplicatePatterns) {
      const matches = names.filter(name => name.includes(pattern));
      if (matches.length > 1) {
        opportunities.push(`Consider consolidating ${matches.length} ${pattern}-related indicators`);
      }
    }

    return opportunities;
  }

  private extractWarningType(warningId: string): string {
    if (warningId.includes('foundation')) return 'foundation_gap';
    if (warningId.includes('activity')) return 'activity_vs_impact';
    if (warningId.includes('proxy')) return 'proxy_metric';
    if (warningId.includes('portfolio')) return 'portfolio_imbalance';
    if (warningId.includes('over-engineering')) return 'over_engineering';
    return 'unknown';
  }

  private getTimeFilter(timeRange: string): any {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
      case '7d':
        return { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
      case '30d':
        return { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      default:
        return {};
    }
  }
}

export const realTimeWarningService = new RealTimeWarningService();