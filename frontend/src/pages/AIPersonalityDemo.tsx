/**
 * AI Personality Demo Page
 * Showcases the revolutionary AI personality interaction interface
 */

import React, { useState } from 'react';
import { 
  Brain, 
  BarChart3, 
  MessageSquare, 
  Settings,
  Sparkles,
  Zap
} from 'lucide-react';
import AIPersonalityInterface from '../components/AIPersonalityInterface';
import AIPersonalityAnalytics from '../components/AIPersonalityAnalytics';

const AIPersonalityDemo: React.FC = () => {
  const [activeView, setActiveView] = useState<'interface' | 'analytics'>('interface');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Brain className="w-16 h-16 mr-4" />
              <Sparkles className="w-8 h-8 text-yellow-300" />
            </div>
            
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              AI Personality Engine
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Experience the future of AI-assisted impact measurement with revolutionary personality-driven interactions, 
              contextual awareness, and adaptive learning capabilities.
            </p>
            
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-300" />
                <span>Real-time Contextual Guidance</span>
              </div>
              <div className="flex items-center">
                <Brain className="w-5 h-5 mr-2 text-green-300" />
                <span>Adaptive AI Learning</span>
              </div>
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-300" />
                <span>Sophisticated Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <Brain className="w-8 h-8 text-blue-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">AI Personality Demo</span>
              </div>
              
              <nav className="flex space-x-1">
                <button
                  onClick={() => setActiveView('interface')}
                  className={`
                    flex items-center px-4 py-2 rounded-lg transition-colors
                    ${activeView === 'interface' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Interactive Chat
                </button>
                
                <button
                  onClick={() => setActiveView('analytics')}
                  className={`
                    flex items-center px-4 py-2 rounded-lg transition-colors
                    ${activeView === 'analytics' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  AI Analytics
                </button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>AI Engine Live</span>
              </div>
              
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeView === 'interface' && (
          <div>
            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Brain className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">Contextual AI</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  AI personalities that adapt to your context, role, and organizational stage with sophisticated understanding.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">Real-time Guidance</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Live pitfall prevention, opportunity detection, and contextual recommendations as you interact.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">Learning Analytics</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Advanced analytics showing AI learning patterns, adaptation insights, and interaction effectiveness.
                </p>
              </div>
            </div>

            {/* AI Personality Interface */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <AIPersonalityInterface 
                mode="chat"
                className="h-[70vh]"
              />
            </div>
          </div>
        )}

        {activeView === 'analytics' && (
          <div>
            {/* Analytics Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Learning & Performance Analytics</h2>
              <p className="text-gray-600 max-w-2xl">
                Explore sophisticated insights into AI personality performance, learning patterns, 
                and adaptation strategies that demonstrate the groundbreaking intelligence of our system.
              </p>
            </div>

            {/* Analytics Component */}
            <AIPersonalityAnalytics />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 mr-2" />
              <span className="text-xl font-bold">AI Personality Engine</span>
            </div>
            <p className="text-gray-400 mb-6">
              Revolutionizing impact measurement through sophisticated AI personality interactions
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div>
                <h4 className="font-semibold mb-2">Key Features</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Dynamic personality switching</li>
                  <li>• Contextual awareness</li>
                  <li>• Real-time guidance</li>
                  <li>• Adaptive learning</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">AI Capabilities</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Machine learning patterns</li>
                  <li>• Behavioral adaptation</li>
                  <li>• Confidence scoring</li>
                  <li>• Performance analytics</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Impact Areas</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Foundation building</li>
                  <li>• Methodology design</li>
                  <li>• Data analysis</li>
                  <li>• Strategic guidance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPersonalityDemo;