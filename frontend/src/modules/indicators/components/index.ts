/**
 * Enhanced Indicators Module - Component Exports
 */

export { default as EnhancedIndicatorSelection } from '../../../components/EnhancedIndicatorSelection';
export { default as PitfallWarningSystem } from './PitfallWarningSystem';
export { default as PortfolioVisualization } from './PortfolioVisualization';
export { default as DecisionMappingWidget } from './DecisionMappingWidget';
export { default as CustomIndicatorBuilder } from './CustomIndicatorBuilder';

// Export types
export * from '../types/enhancedTypes';

// Export hooks
export { useAdaptiveRecommendations } from '../hooks/useAdaptiveRecommendations';
export { usePortfolioAnalysis } from '../hooks/usePortfolioAnalysis';