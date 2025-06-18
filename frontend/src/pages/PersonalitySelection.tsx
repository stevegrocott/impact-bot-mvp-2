/**
 * AI Personality Selection
 * Enhanced component with preview conversations and clear value propositions
 * Context: Improve personality selection confidence and completion rates
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Users,
  BarChart3,
  Brain,
  Settings
} from 'lucide-react';
import { setPersonality, completeWelcome } from '../shared/store/uiSlice';

interface PersonalityDefinition {
  id: 'coach' | 'advisor' | 'analyst';
  name: string;
  icon: React.ReactNode;
  description: string;
  tone: string;
  example: string;
  bestFor: string[];
  completionRate: string;
  previewConversation: {
    user: string;
    ai: string;
  }[];
}

const PersonalitySelection: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [selectedPersonality, setSelectedPersonality] = useState<'coach' | 'advisor' | 'analyst'>('coach');
  const [showPreview, setShowPreview] = useState<string | null>(null);

  const personalities: PersonalityDefinition[] = [
    {
      id: 'coach',
      name: 'Coach Riley',
      icon: <MessageCircle className="w-8 h-8" />,
      description: 'Encouraging, casual, startup-friendly',
      tone: 'Supportive & Energetic',
      example: "That's a solid start! Let's think about what success really looks like for your participants.",
      bestFor: ['First-time users', 'Entrepreneurs', 'Small teams'],
      completionRate: '85%',
      previewConversation: [
        {
          user: "I'm not sure if we're measuring the right things.",
          ai: "I love that you're thinking critically about this! That's exactly the right question. Let's start with your theory of change - what specific change are you trying to create? Once we nail that down, the 'right things' to measure will become much clearer."
        },
        {
          user: "We want to improve education outcomes for kids.",
          ai: "That's an amazing mission! Let's get specific so we can build something really powerful. When you say 'education outcomes' - are we talking about reading skills, math confidence, graduation rates, or something else? And which kids specifically? The more precise we are, the better your measurement system will be."
        }
      ]
    },
    {
      id: 'advisor',
      name: 'Advisor Morgan',
      icon: <Users className="w-8 h-8" />,
      description: 'Clear, formal, methodology-focused',
      tone: 'Professional & Structured',
      example: "Your theory of change should clearly articulate the causal pathway from activities to impact.",
      bestFor: ['Established organizations', 'Formal reporting', 'Mixed teams'],
      completionRate: '78%',
      previewConversation: [
        {
          user: "I'm not sure if we're measuring the right things.",
          ai: "That's a fundamental question in impact measurement. Let's approach this systematically. First, we need to establish your theory of change with clear logic models. This will help us identify the appropriate indicators at each level - outputs, outcomes, and impact."
        },
        {
          user: "We want to improve education outcomes for kids.",
          ai: "Education outcomes is a broad impact area. To develop effective measurement, we need to specify: your target population demographics, the specific educational outcomes you're addressing, your intervention logic, and your intended timeframe. This precision will guide us to validated indicators from the IRIS+ framework."
        }
      ]
    },
    {
      id: 'analyst',
      name: 'Analyst Alex',
      icon: <BarChart3 className="w-8 h-8" />,
      description: 'Precise, technical, data-driven',
      tone: 'Technical & Rigorous',
      example: "Consider the validity threats in your measurement approach. Self-reported data may introduce social desirability bias.",
      bestFor: ['M&E professionals', 'Researchers', 'Technical teams'],
      completionRate: '72%',
      previewConversation: [
        {
          user: "I'm not sure if we're measuring the right things.",
          ai: "This question touches on construct validity - whether your indicators actually measure what you intend to measure. We should conduct a measurement framework analysis, examining your indicators against established psychometric properties and considering potential confounding variables."
        },
        {
          user: "We want to improve education outcomes for kids.",
          ai: "Education outcomes encompass multiple constructs with varying measurement challenges. We need to operationalize this into specific, measurable indicators. Consider: are we measuring learning gains (cognitive outcomes), behavioral changes, or systemic impacts? Each requires different methodological approaches and sample size calculations for statistical power."
        }
      ]
    }
  ];

  const handlePersonalitySelect = (personalityId: 'coach' | 'advisor' | 'analyst') => {
    dispatch(setPersonality(personalityId));
    dispatch(completeWelcome());
    navigate('/chat');
  };

  const PersonalityCard: React.FC<{ personality: PersonalityDefinition; isSelected: boolean }> = ({ 
    personality, 
    isSelected 
  }) => (
    <div className={`p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
      isSelected 
        ? 'border-blue-500 bg-blue-50 shadow-lg' 
        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
    }`}
    onClick={() => setSelectedPersonality(personality.id)}>
      
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-lg ${
          isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {personality.icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{personality.name}</h3>
            <span className="text-sm text-green-600 font-medium">
              {personality.completionRate} completion rate
            </span>
          </div>
          
          <p className="text-gray-600 mb-3">{personality.description}</p>
          
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <div className="text-xs text-gray-500 mb-1">Tone: {personality.tone}</div>
            <p className="text-sm italic text-gray-700">"{personality.example}"</p>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {personality.bestFor.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPreview(showPreview === personality.id ? null : personality.id);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            {showPreview === personality.id ? 'Hide' : 'Preview'} Conversation
          </button>
        </div>
      </div>
    </div>
  );

  const ConversationPreview: React.FC<{ personality: PersonalityDefinition }> = ({ personality }) => (
    <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3">
        Conversation Preview with {personality.name}
      </h4>
      
      <div className="space-y-3">
        {personality.previewConversation.map((exchange, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-end">
              <div className="bg-blue-100 text-blue-900 px-3 py-2 rounded-lg max-w-md text-sm">
                {exchange.user}
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg max-w-md text-sm">
                <div className="flex items-center mb-1">
                  {personality.icon}
                  <span className="ml-2 font-medium text-xs">{personality.name}</span>
                </div>
                {exchange.ai}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        This is just a preview - actual conversations will be tailored to your specific needs
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your AI Guide
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Pick a conversation style that feels right for you
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-800">
                You can change this anytime in settings
              </span>
            </div>
            <p className="text-blue-700 text-sm">
              Each guide uses the same proven methodology - only the communication style differs
            </p>
          </div>
        </div>

        {/* Personality Selection */}
        <div className="space-y-6 mb-8">
          {personalities.map((personality) => (
            <div key={personality.id}>
              <PersonalityCard 
                personality={personality}
                isSelected={selectedPersonality === personality.id}
              />
              {showPreview === personality.id && (
                <ConversationPreview personality={personality} />
              )}
            </div>
          ))}
        </div>

        {/* Additional guidance */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-amber-900 mb-2">
            Not sure which to choose?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-amber-800">Choose Coach Riley if:</span>
              <ul className="text-amber-700 mt-1 space-y-1">
                <li>• You're new to impact measurement</li>
                <li>• You prefer encouragement and support</li>
                <li>• You want a friendly, approachable tone</li>
              </ul>
            </div>
            <div>
              <span className="font-medium text-amber-800">Choose Advisor Morgan if:</span>
              <ul className="text-amber-700 mt-1 space-y-1">
                <li>• You want structured, professional guidance</li>
                <li>• You're working with mixed teams</li>
                <li>• You prefer clear, methodical approaches</li>
              </ul>
            </div>
            <div>
              <span className="font-medium text-amber-800">Choose Analyst Alex if:</span>
              <ul className="text-amber-700 mt-1 space-y-1">
                <li>• You have M&E experience</li>
                <li>• You want technical precision</li>
                <li>• You prefer data-driven explanations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/welcome')}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Welcome
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/visual')}
              className="px-6 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
            >
              <Settings className="w-5 h-5 mr-2" />
              Switch to Visual Mode
            </button>
            
            <button
              onClick={() => handlePersonalitySelect(selectedPersonality)}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium"
            >
              Start Conversation with {personalities.find(p => p.id === selectedPersonality)?.name}
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>

        {/* Success metric transparency */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Success rates based on 500+ users completing foundation building. 
            Higher completion rates indicate better personality-user fit.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PersonalitySelection;