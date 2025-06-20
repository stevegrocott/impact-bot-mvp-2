/**
 * AI Personality Widget
 * A compact widget for integrating AI personality features into existing pages
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Brain, MessageCircle, BarChart3, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
import { useFramerMotionSafe } from '../hooks/useSafeDependencies';
import { RootState } from '../shared/store/store';
import AIPersonalityInterface from './AIPersonalityInterface';

interface AIPersonalityWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  defaultExpanded?: boolean;
  className?: string;
}

const AIPersonalityWidget: React.FC<AIPersonalityWidgetProps> = ({
  position = 'bottom-right',
  defaultExpanded = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { selectedPersonality, interactionState } = useSelector((state: RootState) => state.aiPersonality);
  const { motion, AnimatePresence, isAvailable: motionAvailable } = useFramerMotionSafe();

  // Safe motion components - ensure they're always valid React components
  const MotionButton = React.useMemo(() => {
    if (motionAvailable && motion && motion.button) {
      return motion.button;
    }
    return 'button';
  }, [motionAvailable, motion]);

  const MotionDiv = React.useMemo(() => {
    if (motionAvailable && motion && motion.div) {
      return motion.div;
    }
    return 'div';
  }, [motionAvailable, motion]);

  const SafeAnimatePresence = React.useMemo(() => {
    if (motionAvailable && AnimatePresence) {
      return AnimatePresence;
    }
    return React.Fragment;
  }, [motionAvailable, AnimatePresence]);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const getPersonalityIcon = (role?: string) => {
    switch (role) {
      case 'coach': return <MessageCircle className="w-5 h-5" />;
      case 'advisor': return <BarChart3 className="w-5 h-5" />;
      case 'analyst': return <BarChart3 className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getPersonalityColor = (role?: string) => {
    switch (role) {
      case 'coach': return 'from-green-400 to-blue-500';
      case 'advisor': return 'from-blue-400 to-purple-500';
      case 'analyst': return 'from-purple-400 to-pink-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className={`fixed z-50 ${getPositionClasses()} ${className}`}>
      <SafeAnimatePresence>
        {isExpanded && (
          <MotionDiv
            className="mb-4 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
            style={{ width: '420px', height: '600px' }}
            {...(motionAvailable && motion && motion.div ? {
              initial: { opacity: 0, scale: 0.8, y: 20 },
              animate: { opacity: 1, scale: 1, y: 0 },
              exit: { opacity: 0, scale: 0.8, y: 20 },
              transition: { type: "spring", stiffness: 300, damping: 30 }
            } : {})}
          >
            {/* Widget Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Brain className="w-6 h-6 mr-2" />
                  <div>
                    <h3 className="font-semibold">AI Assistant</h3>
                    <p className="text-xs text-blue-100">
                      {selectedPersonality?.displayName || 'Selecting optimal personality...'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                    <span>Live</span>
                  </div>
                  <div className="flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    <span>{Math.round(interactionState.contextualAwareness.confidenceLevel * 100)}%</span>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    <span>{interactionState.contextualAwareness.learningPatterns.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Interface */}
            <div className="h-full">
              <AIPersonalityInterface 
                mode="chat"
                className="h-full"
              />
            </div>
          </MotionDiv>
        )}
      </SafeAnimatePresence>

      {/* Toggle Button */}
      <MotionButton
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          relative w-14 h-14 rounded-full shadow-lg transition-all duration-300
          bg-gradient-to-br ${getPersonalityColor(selectedPersonality?.role)}
          hover:scale-105 active:scale-95
          ${isExpanded ? 'rotate-0' : 'hover:rotate-12'}
        `}
        {...(motionAvailable && motion && motion.button ? {
          whileHover: { scale: 1.05 },
          whileTap: { scale: 0.95 }
        } : {})}
      >
        <div className="flex items-center justify-center text-white">
          {isExpanded ? (
            <ChevronDown className="w-6 h-6" />
          ) : (
            getPersonalityIcon(selectedPersonality?.role)
          )}
        </div>

        {/* Notification badges */}
        {interactionState.realTimeGuidance.preventionWarnings.length > 0 && (
          <MotionDiv
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white"
            {...(motionAvailable && motion && motion.div ? {
              initial: { scale: 0 },
              animate: { scale: 1 }
            } : {})}
          >
            <span className="text-xs text-white font-bold">
              {interactionState.realTimeGuidance.preventionWarnings.length}
            </span>
          </MotionDiv>
        )}

        {interactionState.realTimeGuidance.opportunityAlerts.length > 0 && (
          <MotionDiv
            className="absolute -top-1 -left-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white"
            {...(motionAvailable && motion && motion.div ? {
              initial: { scale: 0 },
              animate: { scale: 1 }
            } : {})}
          >
            <span className="text-xs text-white font-bold">
              {interactionState.realTimeGuidance.opportunityAlerts.length}
            </span>
          </MotionDiv>
        )}

        {/* Confidence level indicator */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map(level => (
              <div
                key={level}
                className={`
                  w-1 h-2 rounded-full transition-all duration-300
                  ${level <= (interactionState.contextualAwareness.confidenceLevel * 5) 
                    ? 'bg-green-400' 
                    : 'bg-gray-300'
                  }
                `}
              />
            ))}
          </div>
        </div>
      </MotionButton>

      {/* Pulsing effect for active guidance */}
      {(interactionState.realTimeGuidance.activeGuidance.length > 0 || 
        interactionState.realTimeGuidance.preventionWarnings.length > 0) && (
        <div className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-20"></div>
      )}
    </div>
  );
};

export default AIPersonalityWidget;