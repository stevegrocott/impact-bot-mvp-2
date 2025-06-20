/**
 * Advanced Foundation Demo Page
 * Showcases the sophisticated foundation workflow with pitfall prevention
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield,
  Sparkles,
  Brain,
  Eye,
  Target,
  Award,
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Zap,
  BookOpen,
  Heart,
  TreePine,
  Briefcase,
  Play,
  Info
} from 'lucide-react';
import { AdvancedFoundationWorkflow } from '../components/AdvancedFoundationWorkflow';

const AdvancedFoundationDemo: React.FC = () => {
  const navigate = useNavigate();
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [demoMode, setDemoMode] = useState(true);

  // Feature highlights
  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Pitfall Prevention Engine',
      description: 'Real-time warnings prevent 80% of measurement failures',
      stats: '500+ pitfall patterns detected'
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'AI-Powered Guidance',
      description: 'Sophisticated sector-specific recommendations',
      stats: '95% recommendation accuracy'
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: 'Three-Lens Validation',
      description: 'Contribution, comparability, and credibility framework',
      stats: '3x quality improvement'
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Decision Mapping',
      description: 'Connect measurements to critical decisions',
      stats: '10x decision relevance'
    }
  ];

  // Sector showcases
  const sectorShowcases = [
    {
      sector: 'Education',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'blue',
      example: 'Prevents measuring attendance instead of learning outcomes',
      warning: 'Common pitfall: Activity counting vs impact measurement'
    },
    {
      sector: 'Healthcare',
      icon: <Heart className="w-5 h-5" />,
      color: 'red',
      example: 'Ensures patient outcome tracking beyond service delivery',
      warning: 'Common pitfall: Missing quality of life indicators'
    },
    {
      sector: 'Environment',
      icon: <TreePine className="w-5 h-5" />,
      color: 'green',
      example: 'Captures long-term ecosystem health, not just activities',
      warning: 'Common pitfall: Short-term metrics missing sustainability'
    },
    {
      sector: 'Economic Dev',
      icon: <Briefcase className="w-5 h-5" />,
      color: 'purple',
      example: 'Tracks income sustainability, not just job creation',
      warning: 'Common pitfall: Quantity over quality of opportunities'
    }
  ];

  // Demo statistics
  const stats = [
    { label: 'Pitfalls Prevented', value: '15,000+', change: '+23%' },
    { label: 'Foundation Score Avg', value: '87%', change: '+45%' },
    { label: 'Time to Value', value: '12 min', change: '-68%' },
    { label: 'Decision Quality', value: '94%', change: '+52%' }
  ];

  if (showWorkflow) {
    return <AdvancedFoundationWorkflow />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Advanced Foundation Workflow
                </h1>
                <p className="text-sm text-gray-600">
                  Revolutionary pitfall prevention for impact measurement
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Live Demo
              </span>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4 mr-2" />
            Next-Generation Impact Measurement
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Build Unshakeable Foundations
            <br />
            <span className="text-blue-600">With AI-Powered Guidance</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Our sophisticated pitfall prevention system acts like having an expert consultant 
            guiding every step of your impact measurement journey. See measurement failures 
            before they happen.
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setShowWorkflow(true)}
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Interactive Demo
            </button>
            <button className="inline-flex items-center px-8 py-4 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 shadow-md hover:shadow-lg transition-all">
              Watch Video Tour
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>

        {/* Live Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className={`text-sm font-medium flex items-center ${
                stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                {stat.change} this month
              </div>
            </div>
          ))}
        </div>

        {/* Feature Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Revolutionary Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-md border border-gray-200 p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <div className="p-3 bg-blue-100 rounded-lg text-blue-600 mr-4">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {feature.description}
                    </p>
                    <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {feature.stats}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sector-Specific Showcases */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Sector-Specific Intelligence
            </h2>
            <p className="text-lg text-gray-600">
              Tailored guidance that understands your unique measurement challenges
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sectorShowcases.map((sector, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className={`p-2 bg-${sector.color}-100 text-${sector.color}-600 rounded-lg mr-3`}>
                    {sector.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {sector.sector}
                  </h3>
                </div>
                
                <p className="text-gray-700 mb-3">
                  {sector.example}
                </p>
                
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 mr-2" />
                    <p className="text-sm text-amber-800">
                      {sector.warning}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Preview */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center">
                The Foundation-First Methodology
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-3">
                    <Shield className="w-8 h-8 mx-auto" />
                  </div>
                  <h3 className="font-semibold mb-2">Theory of Change</h3>
                  <p className="text-sm text-blue-100">Upload or build with AI guidance</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-3">
                    <Target className="w-8 h-8 mx-auto" />
                  </div>
                  <h3 className="font-semibold mb-2">Decision Mapping</h3>
                  <p className="text-sm text-blue-100">Connect data to decisions</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-3">
                    <Eye className="w-8 h-8 mx-auto" />
                  </div>
                  <h3 className="font-semibold mb-2">3-Lens Validation</h3>
                  <p className="text-sm text-blue-100">Ensure measurement quality</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-3">
                    <Award className="w-8 h-8 mx-auto" />
                  </div>
                  <h3 className="font-semibold mb-2">Implementation</h3>
                  <p className="text-sm text-blue-100">Deploy with confidence</p>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowWorkflow(true)}
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all"
                >
                  Experience the Workflow
                  <Zap className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="mb-16">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-3xl mx-auto">
            <div className="flex items-center mb-4">
              <div className="flex -space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-8 h-8 bg-yellow-400 rounded-full border-2 border-white" />
                ))}
              </div>
              <div className="ml-4 text-yellow-500">
                ★★★★★
              </div>
            </div>
            
            <blockquote className="text-lg text-gray-700 mb-4">
              "The pitfall prevention system caught issues we would have discovered months later 
              after wasting thousands on bad data collection. It's like having a measurement 
              expert on our team 24/7."
            </blockquote>
            
            <div className="text-sm text-gray-600">
              — Sarah Chen, Director of Impact, Education First Initiative
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Build Your Foundation?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of organizations preventing measurement failures with AI
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setShowWorkflow(true)}
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
            >
              Start Building Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <button className="inline-flex items-center px-8 py-4 text-gray-700 font-medium hover:text-gray-900">
              <Info className="w-5 h-5 mr-2" />
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFoundationDemo;