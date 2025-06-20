/**
 * AI Personality Analytics Component
 * Showcases sophisticated analytics and learning insights from AI personality interactions
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../shared/store/store';
import { 
  BarChart3, 
  TrendingUp, 
  Brain,
  Users,
  Target,
  Zap,
  Eye,
  Settings,
  Activity,
  Star,
  Clock,
  MessageCircle,
  ThumbsUp,
  Award,
  Lightbulb
} from 'lucide-react';
// import { motion } from 'framer-motion';
import { useFramerMotionSafe } from '../hooks/useSafeDependencies';
import { RootState } from '../shared/store/store';
import { fetchPersonalityAnalytics } from '../shared/store/aiPersonalitySlice';

interface AIPersonalityAnalyticsProps {
  className?: string;
}

const AIPersonalityAnalytics: React.FC<AIPersonalityAnalyticsProps> = ({ className = '' }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { analytics, isLoading, availablePersonalities } = useSelector((state: RootState) => state.aiPersonality);
  const [selectedMetric, setSelectedMetric] = useState<'usage' | 'effectiveness' | 'satisfaction'>('usage');
  const { motion, isAvailable: motionAvailable } = useFramerMotionSafe();

  useEffect(() => {
    dispatch(fetchPersonalityAnalytics());
  }, [dispatch]);

  const getPersonalityIcon = (personalityId: string) => {
    if (personalityId.includes('coach')) return <MessageCircle className="w-5 h-5" />;
    if (personalityId.includes('advisor')) return <Users className="w-5 h-5" />;
    if (personalityId.includes('analyst')) return <BarChart3 className="w-5 h-5" />;
    return <Brain className="w-5 h-5" />;
  };

  const getPersonalityColor = (personalityId: string) => {
    if (personalityId.includes('coach')) return 'from-green-400 to-blue-500';
    if (personalityId.includes('advisor')) return 'from-blue-400 to-purple-500';
    if (personalityId.includes('analyst')) return 'from-purple-400 to-pink-500';
    return 'from-gray-400 to-gray-600';
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
    trend?: 'up' | 'down' | 'stable';
  }> = ({ title, value, icon, color, subtitle, trend }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
          <div className="text-white">{icon}</div>
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <TrendingUp className={`w-4 h-4 mr-1 ${
            trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'
          }`} />
          <span className={`text-sm ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
          </span>
        </div>
      )}
    </motion.div>
  );

  const PersonalityUsageChart: React.FC = () => {
    if (!analytics?.personalityUsage) return null;

    const maxUsage = Math.max(...analytics.personalityUsage.map(p => p.usageCount));

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Personality Usage</h3>
          <div className="flex space-x-2">
            {(['usage', 'effectiveness', 'satisfaction'] as const).map(metric => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedMetric === metric
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {analytics.personalityUsage.map((personality, index) => {
            const percentage = selectedMetric === 'usage' 
              ? (personality.usageCount / maxUsage) * 100
              : selectedMetric === 'effectiveness'
              ? personality.averageEffectiveness
              : (personality.userSatisfaction / 5) * 100;

            return (
              <motion.div
                key={personality.personalityId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${getPersonalityColor(personality.personalityId)} mr-3`}>
                      <div className="text-white">
                        {getPersonalityIcon(personality.personalityId)}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{personality.personalityName}</p>
                      <p className="text-sm text-gray-600">
                        {personality.commonContexts.slice(0, 2).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {selectedMetric === 'usage' 
                        ? personality.usageCount
                        : selectedMetric === 'effectiveness'
                        ? `${personality.averageEffectiveness.toFixed(1)}%`
                        : `${personality.userSatisfaction.toFixed(1)}/5`
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedMetric === 'usage' ? 'interactions' : selectedMetric}
                    </p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className={`h-2 rounded-full bg-gradient-to-r ${getPersonalityColor(personality.personalityId)}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const ContextualEffectivenessChart: React.FC = () => {
    if (!analytics?.contextualEffectiveness) return null;

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Contextual Effectiveness</h3>
        
        <div className="space-y-4">
          {analytics.contextualEffectiveness.map((context, index) => (
            <motion.div
              key={context.context}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">
                    {context.context.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Best match: {context.bestPersonality.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-semibold text-gray-900">
                      {context.effectivenessScore.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {context.userFeedback.toFixed(1)}/5 satisfaction
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium">Effectiveness Score</p>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${context.effectivenessScore}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="h-2 rounded-full bg-blue-500"
                    />
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-xs text-yellow-600 font-medium">User Satisfaction</p>
                  <div className="w-full bg-yellow-200 rounded-full h-2 mt-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(context.userFeedback / 5) * 100}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="h-2 rounded-full bg-yellow-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const AdaptationInsightsPanel: React.FC = () => {
    if (!analytics?.adaptationInsights) return null;

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center mb-6">
          <Lightbulb className="w-6 h-6 text-yellow-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">AI Learning Insights</h3>
        </div>
        
        <div className="space-y-4">
          {analytics.adaptationInsights.map((insight, index) => (
            <motion.div
              key={insight.personalityId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border-l-4 border-purple-400 bg-purple-50 p-4 rounded-r-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${getPersonalityColor(insight.personalityId)} mr-3`}>
                    <div className="text-white">
                      {getPersonalityIcon(insight.personalityId)}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {insight.personalityId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-purple-600 capitalize">
                      {insight.adaptationPattern.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <Award className="w-4 h-4 text-green-500 mr-1" />
                    <span className="font-semibold text-gray-900">
                      {insight.successRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-3">{insight.recommendation}</p>
              
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Adaptation Success Rate</span>
                  <span className="font-medium">{insight.successRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${insight.successRate}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="flex items-center space-x-2">
          <Activity className="w-6 h-6 text-blue-600 animate-pulse" />
          <span className="text-gray-600">Loading AI analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Interactions"
          value={analytics.personalityUsage.reduce((sum, p) => sum + p.usageCount, 0).toLocaleString()}
          icon={<MessageCircle className="w-6 h-6" />}
          color="from-blue-400 to-blue-600"
          trend="up"
        />
        
        <MetricCard
          title="Average Effectiveness"
          value={`${(analytics.personalityUsage.reduce((sum, p) => sum + p.averageEffectiveness, 0) / analytics.personalityUsage.length).toFixed(1)}%`}
          icon={<Target className="w-6 h-6" />}
          color="from-green-400 to-green-600"
          trend="up"
        />
        
        <MetricCard
          title="User Satisfaction"
          value={`${(analytics.personalityUsage.reduce((sum, p) => sum + p.userSatisfaction, 0) / analytics.personalityUsage.length).toFixed(1)}/5`}
          icon={<ThumbsUp className="w-6 h-6" />}
          color="from-yellow-400 to-yellow-600"
          trend="stable"
        />
        
        <MetricCard
          title="Active Personalities"
          value={availablePersonalities.length}
          icon={<Users className="w-6 h-6" />}
          color="from-purple-400 to-purple-600"
          subtitle="AI personas available"
        />
      </div>

      {/* Charts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PersonalityUsageChart />
        <ContextualEffectivenessChart />
      </div>

      {/* Adaptation Insights */}
      <AdaptationInsightsPanel />
    </div>
  );
};

export default AIPersonalityAnalytics;