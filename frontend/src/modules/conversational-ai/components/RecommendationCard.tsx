import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, X, ExternalLink, Target, TrendingUp, FileText, MessageSquare } from 'lucide-react';

interface Recommendation {
  id: string;
  type: string;
  itemId: string;
  itemType: string;
  confidenceScore: number;
  reasoning: string;
  userFeedback?: 'helpful' | 'not_helpful' | 'irrelevant';
  feedbackNotes?: string;
  metadata?: Record<string, any>;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onFeedback: (id: string, feedback: 'helpful' | 'not_helpful' | 'irrelevant', notes?: string) => void;
  onDismiss?: (id: string) => void;
  onAction?: (type: string, itemId: string) => void;
  className?: string;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onFeedback,
  onDismiss,
  onAction,
  className = "",
}) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'indicator_suggestion':
        return <Target className="w-4 h-4" />;
      case 'goal_alignment':
        return <TrendingUp className="w-4 h-4" />;
      case 'template_suggestion':
        return <FileText className="w-4 h-4" />;
      case 'conversation_suggestion':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'indicator_suggestion':
        return 'Indicator Suggestion';
      case 'goal_alignment':
        return 'Goal Alignment';
      case 'template_suggestion':
        return 'Template Suggestion';
      case 'conversation_suggestion':
        return 'Conversation Suggestion';
      default:
        return 'Recommendation';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return 'High Confidence';
    if (score >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const handleFeedback = (feedback: 'helpful' | 'not_helpful' | 'irrelevant') => {
    if (feedback === 'not_helpful' || feedback === 'irrelevant') {
      setShowFeedbackForm(true);
    } else {
      onFeedback(recommendation.id, feedback);
    }
  };

  const submitFeedback = (feedback: 'helpful' | 'not_helpful' | 'irrelevant') => {
    onFeedback(recommendation.id, feedback, feedbackNotes.trim() || undefined);
    setShowFeedbackForm(false);
    setFeedbackNotes('');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.(recommendation.id);
  };

  const handleAction = () => {
    onAction?.(recommendation.type, recommendation.itemId);
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="text-blue-600">
            {getTypeIcon(recommendation.type)}
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900">
              {getTypeLabel(recommendation.type)}
            </h4>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(recommendation.confidenceScore)}`}>
              {getConfidenceLabel(recommendation.confidenceScore)} ({Math.round(recommendation.confidenceScore * 100)}%)
            </div>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Dismiss recommendation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          {recommendation.reasoning}
        </p>
        
        {recommendation.metadata?.description && (
          <p className="text-xs text-gray-600 mt-2">
            {recommendation.metadata.description}
          </p>
        )}
      </div>

      {/* Action Button */}
      {onAction && (
        <div className="mb-3">
          <button
            onClick={handleAction}
            className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>
              {recommendation.type === 'indicator_suggestion' && 'View Indicator'}
              {recommendation.type === 'goal_alignment' && 'View Goal'}
              {recommendation.type === 'template_suggestion' && 'Use Template'}
              {recommendation.type === 'conversation_suggestion' && 'Continue Chat'}
              {!['indicator_suggestion', 'goal_alignment', 'template_suggestion', 'conversation_suggestion'].includes(recommendation.type) && 'Take Action'}
            </span>
          </button>
        </div>
      )}

      {/* Feedback Section */}
      {!recommendation.userFeedback && !showFeedbackForm && (
        <div className="border-t border-blue-200 pt-3">
          <div className="text-xs text-gray-600 mb-2">Was this recommendation helpful?</div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleFeedback('helpful')}
              className="inline-flex items-center space-x-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              <ThumbsUp className="w-3 h-3" />
              <span>Helpful</span>
            </button>
            
            <button
              onClick={() => handleFeedback('not_helpful')}
              className="inline-flex items-center space-x-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
            >
              <ThumbsDown className="w-3 h-3" />
              <span>Not Helpful</span>
            </button>
            
            <button
              onClick={() => handleFeedback('irrelevant')}
              className="inline-flex items-center space-x-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Irrelevant</span>
            </button>
          </div>
        </div>
      )}

      {/* Feedback Form */}
      {showFeedbackForm && (
        <div className="border-t border-blue-200 pt-3">
          <div className="text-xs text-gray-600 mb-2">
            Help us improve by telling us why this wasn't helpful:
          </div>
          <textarea
            value={feedbackNotes}
            onChange={(e) => setFeedbackNotes(e.target.value)}
            placeholder="Optional: Tell us more about why this recommendation wasn't helpful..."
            className="w-full p-2 text-xs border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => setShowFeedbackForm(false)}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => submitFeedback('not_helpful')}
              className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Feedback Status */}
      {recommendation.userFeedback && (
        <div className="border-t border-blue-200 pt-3">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-gray-600">Feedback:</span>
            <span className={`font-medium ${
              recommendation.userFeedback === 'helpful' ? 'text-green-600' :
              recommendation.userFeedback === 'not_helpful' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {recommendation.userFeedback === 'helpful' && 'Marked as helpful'}
              {recommendation.userFeedback === 'not_helpful' && 'Marked as not helpful'}
              {recommendation.userFeedback === 'irrelevant' && 'Marked as irrelevant'}
            </span>
          </div>
          {recommendation.feedbackNotes && (
            <div className="text-xs text-gray-600 mt-1">
              Notes: {recommendation.feedbackNotes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;