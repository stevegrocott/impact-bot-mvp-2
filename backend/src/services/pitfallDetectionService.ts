/**
 * Pitfall Detection Service
 * Real-time AI-powered prevention of measurement pitfalls
 * Core functionality: Activity vs Impact classification, Proxy detection, Over-engineering prevention
 */

import { IrisKeyIndicator } from '@prisma/client';
import { prisma } from '@/config/database';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { llmService } from './llm';

// Impact level classification
export interface ImpactLevelClassification {
  level: 'output' | 'outcome' | 'impact';
  confidence: number; // 0-1
  reasoning: string;
  isActivityMeasure: boolean;
  changeDescription: string;
}

// Portfolio balance analysis
export interface PortfolioBalance {
  outputCount: number;
  outcomeCount: number;
  impactCount: number;
  outputPercentage: number;
  outcomePercentage: number;
  impactPercentage: number;
  balanceScore: number; // 0-100
  warnings: PortfolioWarning[];
  recommendations: string[];
}

// Pitfall warnings
export interface PortfolioWarning {
  type: 'output_heavy' | 'missing_outcomes' | 'missing_impacts' | 'activity_focus';
  severity: 'low' | 'medium' | 'high';
  message: string;
  affectedIndicators: string[];
  suggestions: string[];
}

// Proxy detection
export interface ProxyDetection {
  isProxy: boolean;
  confidence: number;
  proxyFor: string;
  explanation: string;
  directAlternatives: IndicatorSuggestion[];
  triangulationOptions: string[];
}

// Indicator suggestions
export interface IndicatorSuggestion {
  indicatorId: string;
  name: string;
  description: string;
  reasoning: string;
  relevanceScore: number;
}

// Over-engineering assessment
export interface OverEngineeringAssessment {
  burdenScore: number; // 0-100
  isOverEngineered: boolean;
  redundantIndicators: string[];
  consolidationOpportunities: ConsolidationOpportunity[];
  recommendedReductions: string[];
  minimumViableSet: string[];
}

export interface ConsolidationOpportunity {
  groupedIndicators: string[];
  consolidatedName: string;
  reasoning: string;
  estimatedReduction: number;
}

class PitfallDetectionService {
  
  /**
   * Classify indicator impact level (Output vs Outcome vs Impact)
   */
  async classifyImpactLevel(indicator: IrisKeyIndicator): Promise<ImpactLevelClassification> {
    try {
      // Use LLM to classify based on indicator name and description
      const classificationPrompt = `
        Analyze this IRIS+ indicator and classify its impact level:

        Name: "${indicator.name}"
        Description: "${indicator.description || 'No description available'}"
        
        Classification criteria:
        - OUTPUT: Direct products of activities (# people trained, # workshops held, # materials distributed)
        - OUTCOME: Changes in people/systems (knowledge gained, behavior changed, policies adopted)
        - IMPACT: Long-term effects on the world (lives saved, poverty reduced, environment improved)

        Determine:
        1. Is this measuring what the organization DOES (activity/output) or what CHANGES (outcome/impact)?
        2. Does it measure a direct product of work or a change in people/systems/world?
        3. Is this something that happens immediately or over time?

        Return JSON with:
        {
          "level": "output|outcome|impact",
          "confidence": 0.0-1.0,
          "reasoning": "Clear explanation of classification",
          "isActivityMeasure": true/false,
          "changeDescription": "What change this measures or 'No change measured'"
        }

        Be conservative - when in doubt, classify as the more direct level (output over outcome, outcome over impact).
      `;

      const response = await llmService.sendMessage([
        { role: 'user', content: classificationPrompt }
      ], 'You are an expert in impact measurement and theory of change analysis.');

      // Parse response
      const classification = this.parseClassificationResponse(response.content);
      
      // Store classification for future reference
      await this.storeClassification(indicator.id, classification);

      return classification;

    } catch (error) {
      logger.error(`Error classifying indicator ${indicator.id}:`, error);
      
      // Fallback classification based on keywords
      return this.fallbackClassification(indicator);
    }
  }

  /**
   * Analyze portfolio balance and generate warnings
   */
  async analyzePortfolioBalance(indicatorIds: string[]): Promise<PortfolioBalance> {
    try {
      // Get indicators
      const indicators = await prisma.irisKeyIndicator.findMany({
        where: { id: { in: indicatorIds } }
      });

      // Classify each indicator
      const classifications = await Promise.all(
        indicators.map(indicator => this.classifyImpactLevel(indicator))
      );

      // Count by level
      const outputCount = classifications.filter(c => c.level === 'output').length;
      const outcomeCount = classifications.filter(c => c.level === 'outcome').length;
      const impactCount = classifications.filter(c => c.level === 'impact').length;
      const total = classifications.length;

      // Calculate percentages
      const outputPercentage = Math.round((outputCount / total) * 100);
      const outcomePercentage = Math.round((outcomeCount / total) * 100);
      const impactPercentage = Math.round((impactCount / total) * 100);

      // Calculate balance score (higher is better balanced)
      const balanceScore = this.calculateBalanceScore(outputPercentage, outcomePercentage, impactPercentage);

      // Generate warnings
      const warnings = this.generatePortfolioWarnings(
        outputPercentage, 
        outcomePercentage, 
        impactPercentage,
        indicators,
        classifications
      );

      // Generate recommendations
      const recommendations = this.generateBalanceRecommendations(warnings, total);

      return {
        outputCount,
        outcomeCount,
        impactCount,
        outputPercentage,
        outcomePercentage,
        impactPercentage,
        balanceScore,
        warnings,
        recommendations
      };

    } catch (error) {
      logger.error('Error analyzing portfolio balance:', error);
      throw new AppError('Failed to analyze portfolio balance', 500);
    }
  }

  /**
   * Detect proxy metrics
   */
  async detectProxyMetric(indicator: IrisKeyIndicator): Promise<ProxyDetection> {
    try {
      const proxyDetectionPrompt = `
        Analyze if this indicator is a proxy metric:

        Name: "${indicator.name}"
        Description: "${indicator.description || 'No description available'}"

        A proxy metric measures something that stands in for what we really want to measure.
        
        Common proxy patterns:
        - Attendance as proxy for engagement
        - Satisfaction as proxy for behavior change
        - Knowledge as proxy for application
        - Participation as proxy for impact
        - Completion as proxy for learning

        Determine:
        1. Is this measuring what we really want to know, or something that represents it?
        2. What is the actual outcome this proxy represents?
        3. Could this be measured more directly?

        Return JSON with:
        {
          "isProxy": true/false,
          "confidence": 0.0-1.0,
          "proxyFor": "What this is a proxy for, or null",
          "explanation": "Why this is/isn't a proxy",
          "directMeasurementOptions": ["Alternative 1", "Alternative 2"],
          "triangulationNeeded": ["Additional data point 1", "Additional data point 2"]
        }
      `;

      const response = await llmService.sendMessage([
        { role: 'user', content: proxyDetectionPrompt }
      ], 'You are an expert in measurement methodology and proxy detection.');

      const detection = this.parseProxyResponse(response.content);

      // Get direct alternatives from IRIS+ if proxy detected
      if (detection.isProxy) {
        detection.directAlternatives = await this.findDirectAlternatives(indicator, detection.proxyFor);
      }

      return detection;

    } catch (error) {
      logger.error(`Error detecting proxy for indicator ${indicator.id}:`, error);
      
      // Fallback proxy detection
      return this.fallbackProxyDetection(indicator);
    }
  }

  /**
   * Assess over-engineering and suggest consolidation
   */
  async assessOverEngineering(
    indicatorIds: string[],
    decisionMappings: Array<{ question: string; evidence: string[] }>
  ): Promise<OverEngineeringAssessment> {
    try {
      // Get indicators
      const indicators = await prisma.irisKeyIndicator.findMany({
        where: { id: { in: indicatorIds } }
      });

      // Calculate burden score
      const burdenScore = this.calculateBurdenScore(indicators.length, decisionMappings.length);

      // Identify redundant indicators
      const redundantIndicators = await this.findRedundantIndicators(indicators);

      // Find consolidation opportunities
      const consolidationOpportunities = await this.findConsolidationOpportunities(indicators);

      // Determine minimum viable set based on decisions
      const minimumViableSet = await this.determineMinimumViableSet(indicators, decisionMappings);

      const isOverEngineered = burdenScore > 70 || redundantIndicators.length > 2;

      const recommendedReductions = this.generateReductionRecommendations(
        burdenScore,
        redundantIndicators,
        consolidationOpportunities
      );

      return {
        burdenScore,
        isOverEngineered,
        redundantIndicators,
        consolidationOpportunities,
        recommendedReductions,
        minimumViableSet
      };

    } catch (error) {
      logger.error('Error assessing over-engineering:', error);
      throw new AppError('Failed to assess over-engineering', 500);
    }
  }

  /**
   * Generate outcome alternatives for output indicators
   */
  async generateOutcomeAlternatives(outputIndicator: IrisKeyIndicator): Promise<IndicatorSuggestion[]> {
    try {
      const alternativePrompt = `
        This indicator measures an output (what we do). Suggest outcome alternatives (what changes):

        Output Indicator: "${outputIndicator.name}"
        Description: "${outputIndicator.description || 'No description available'}"

        For each output, think about what change it should lead to:
        - If we do this activity, what should change in people/systems?
        - What behavior change, knowledge application, or system improvement should result?
        - How would we know if this output is actually working?

        Suggest 3-5 outcome indicators that would measure whether this output is creating change.
        Focus on changes in:
        - Knowledge application (not just knowledge gained)
        - Behavior adoption (not just awareness)
        - System improvements (not just system creation)
        - Capacity utilization (not just capacity building)

        Return JSON array with:
        [{
          "name": "Outcome indicator name",
          "description": "What this measures and why it matters",
          "reasoning": "How this connects to the output indicator",
          "measurementApproach": "How this could be measured"
        }]
      `;

      const response = await llmService.sendMessage([
        { role: 'user', content: alternativePrompt }
      ], 'You are an expert in theory of change and measurement design.');

      const alternatives = this.parseAlternativesResponse(response.content);

      // Try to match with existing IRIS+ indicators
      const suggestions = await this.matchWithIrisIndicators(alternatives);

      return suggestions;

    } catch (error) {
      logger.error(`Error generating outcome alternatives for ${outputIndicator.id}:`, error);
      return [];
    }
  }

  // Private helper methods

  private parseClassificationResponse(content: string): ImpactLevelClassification {
    try {
      const parsed = JSON.parse(content);
      return {
        level: parsed.level || 'output',
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
        reasoning: parsed.reasoning || 'Classification based on indicator analysis',
        isActivityMeasure: parsed.isActivityMeasure || false,
        changeDescription: parsed.changeDescription || 'Change type not specified'
      };
    } catch {
      return this.fallbackClassification();
    }
  }

  private fallbackClassification(indicator?: IrisKeyIndicator): ImpactLevelClassification {
    const name = indicator?.name.toLowerCase() || '';
    
    // Simple keyword-based fallback
    if (name.includes('number of') || name.includes('amount of') || name.includes('volume of')) {
      return {
        level: 'output',
        confidence: 0.6,
        reasoning: 'Likely output based on counting/volume language',
        isActivityMeasure: true,
        changeDescription: 'Measures quantity of activities or products'
      };
    }
    
    if (name.includes('change in') || name.includes('improvement in') || name.includes('increase in')) {
      return {
        level: 'outcome',
        confidence: 0.7,
        reasoning: 'Likely outcome based on change language',
        isActivityMeasure: false,
        changeDescription: 'Measures change or improvement'
      };
    }

    return {
      level: 'output',
      confidence: 0.3,
      reasoning: 'Default classification - manual review recommended',
      isActivityMeasure: false,
      changeDescription: 'Classification uncertain'
    };
  }

  private calculateBalanceScore(output: number, outcome: number, impact: number): number {
    // Ideal balance: 30% outputs, 50% outcomes, 20% impacts
    const idealOutput = 30;
    const idealOutcome = 50;
    const idealImpact = 20;

    const outputDeviation = Math.abs(output - idealOutput);
    const outcomeDeviation = Math.abs(outcome - idealOutcome);
    const impactDeviation = Math.abs(impact - idealImpact);

    const totalDeviation = outputDeviation + outcomeDeviation + impactDeviation;
    const maxDeviation = 200; // Maximum possible deviation

    return Math.max(0, 100 - (totalDeviation / maxDeviation) * 100);
  }

  private generatePortfolioWarnings(
    outputPct: number,
    outcomePct: number,
    impactPct: number,
    indicators: IrisKeyIndicator[],
    classifications: ImpactLevelClassification[]
  ): PortfolioWarning[] {
    const warnings: PortfolioWarning[] = [];

    // Output-heavy warning
    if (outputPct > 60) {
      warnings.push({
        type: 'output_heavy',
        severity: outputPct > 80 ? 'high' : 'medium',
        message: `${outputPct}% of indicators measure outputs (activities). This focuses on what you do, not what changes.`,
        affectedIndicators: indicators
          .filter((_, i) => classifications[i].level === 'output')
          .map(ind => ind.id),
        suggestions: [
          'Add outcome indicators that measure changes in people or systems',
          'Consider what changes should result from your activities',
          'Focus on measuring impact, not just activity volume'
        ]
      });
    }

    // Missing outcomes warning
    if (outcomePct < 30) {
      warnings.push({
        type: 'missing_outcomes',
        severity: outcomePct < 10 ? 'high' : 'medium',
        message: `Only ${outcomePct}% of indicators measure outcomes. You need more indicators that measure change.`,
        affectedIndicators: [],
        suggestions: [
          'Add indicators that measure behavior change',
          'Include measures of knowledge application',
          'Track system improvements and capacity utilization'
        ]
      });
    }

    // Activity focus warning
    const activityCount = classifications.filter(c => c.isActivityMeasure).length;
    if (activityCount > indicators.length * 0.5) {
      warnings.push({
        type: 'activity_focus',
        severity: 'high',
        message: 'Many indicators focus on activities rather than results. This is the #1 measurement pitfall.',
        affectedIndicators: indicators
          .filter((_, i) => classifications[i].isActivityMeasure)
          .map(ind => ind.id),
        suggestions: [
          'Shift focus from "what we do" to "what changes"',
          'Ask: "If this activity works, what would be different?"',
          'Measure the change, not just the activity'
        ]
      });
    }

    return warnings;
  }

  private generateBalanceRecommendations(warnings: PortfolioWarning[], totalIndicators: number): string[] {
    const recommendations = [];

    if (warnings.some(w => w.type === 'output_heavy')) {
      recommendations.push('Focus on outcomes: For every output indicator, ask "What change should this create?"');
      recommendations.push('Add behavior change indicators that show your activities are working');
    }

    if (warnings.some(w => w.type === 'missing_outcomes')) {
      recommendations.push('Measure what changes, not just what you deliver');
      recommendations.push('Include indicators that show progress toward your theory of change outcomes');
    }

    if (warnings.some(w => w.type === 'activity_focus')) {
      recommendations.push('This is the #1 measurement pitfall: measuring activity instead of impact');
      recommendations.push('Shift from counting activities to measuring change in people and systems');
    }

    if (totalIndicators > 15) {
      recommendations.push('Consider if you have too many indicators - more is not always better');
    }

    return recommendations;
  }

  private async storeClassification(indicatorId: string, classification: ImpactLevelClassification): Promise<void> {
    // This would store classification results for future reference and analytics
    // Implementation depends on analytics schema
    logger.info(`Classified indicator ${indicatorId} as ${classification.level}`);
  }

  private parseProxyResponse(content: string): ProxyDetection {
    try {
      const parsed = JSON.parse(content);
      return {
        isProxy: parsed.isProxy || false,
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
        proxyFor: parsed.proxyFor || '',
        explanation: parsed.explanation || 'Proxy analysis completed',
        directAlternatives: [],
        triangulationOptions: parsed.triangulationNeeded || []
      };
    } catch {
      return this.fallbackProxyDetection();
    }
  }

  private fallbackProxyDetection(indicator?: IrisKeyIndicator): ProxyDetection {
    const name = indicator?.name.toLowerCase() || '';
    
    // Simple proxy detection based on common patterns
    if (name.includes('attendance') || name.includes('participation')) {
      return {
        isProxy: true,
        confidence: 0.8,
        proxyFor: 'engagement or learning',
        explanation: 'Attendance often used as proxy for engagement',
        directAlternatives: [],
        triangulationOptions: ['Engagement surveys', 'Knowledge assessments', 'Behavior observation']
      };
    }

    return {
      isProxy: false,
      confidence: 0.5,
      proxyFor: '',
      explanation: 'No obvious proxy patterns detected',
      directAlternatives: [],
      triangulationOptions: []
    };
  }

  private async findDirectAlternatives(indicator: IrisKeyIndicator, proxyFor: string): Promise<IndicatorSuggestion[]> {
    // Search IRIS+ for indicators that directly measure what this is a proxy for
    // Implementation would use vector search + keyword matching
    return [];
  }

  private calculateBurdenScore(indicatorCount: number, decisionCount: number): number {
    // Calculate measurement burden based on indicator count and decision needs
    const indicatorBurden = Math.min(indicatorCount * 5, 50); // Max 50 for indicators
    const decisionRatio = decisionCount > 0 ? indicatorCount / decisionCount : indicatorCount;
    const efficiencyPenalty = Math.max(0, (decisionRatio - 3) * 10); // Penalty for >3 indicators per decision

    return Math.min(100, indicatorBurden + efficiencyPenalty);
  }

  private async findRedundantIndicators(indicators: IrisKeyIndicator[]): Promise<string[]> {
    // Identify indicators that measure very similar things
    // Implementation would use similarity analysis
    return [];
  }

  private async findConsolidationOpportunities(indicators: IrisKeyIndicator[]): Promise<ConsolidationOpportunity[]> {
    // Find groups of indicators that could be consolidated
    return [];
  }

  private async determineMinimumViableSet(
    indicators: IrisKeyIndicator[],
    decisions: Array<{ question: string; evidence: string[] }>
  ): Promise<string[]> {
    // Determine minimum set of indicators needed to inform all decisions
    return indicators.slice(0, Math.max(3, decisions.length)).map(i => i.id);
  }

  private generateReductionRecommendations(
    burdenScore: number,
    redundant: string[],
    consolidation: ConsolidationOpportunity[]
  ): string[] {
    const recommendations = [];

    if (burdenScore > 70) {
      recommendations.push('Consider reducing the number of indicators - simpler is often better');
    }

    if (redundant.length > 0) {
      recommendations.push(`${redundant.length} indicators appear redundant and could be removed`);
    }

    if (consolidation.length > 0) {
      recommendations.push(`${consolidation.length} opportunities to consolidate similar indicators`);
    }

    return recommendations;
  }

  private parseAlternativesResponse(content: string): any[] {
    try {
      return JSON.parse(content) || [];
    } catch {
      return [];
    }
  }

  private async matchWithIrisIndicators(alternatives: any[]): Promise<IndicatorSuggestion[]> {
    // Match suggested alternatives with existing IRIS+ indicators
    // Implementation would use vector search
    return alternatives.map((alt, i) => ({
      indicatorId: `suggested_${i}`,
      name: alt.name || 'Custom indicator needed',
      description: alt.description || '',
      reasoning: alt.reasoning || '',
      relevanceScore: 0.8
    }));
  }
}

export const pitfallDetectionService = new PitfallDetectionService();