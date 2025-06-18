/**
 * Visual Dashboard Mode Entry Point
 * Professional-grade measurement tools with AI intelligence
 * Context: M&E professionals and comprehensive measurement systems
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  BarChart3, 
  Users,
  Settings,
  ArrowRight,
  CheckCircle,
  Layers,
  Target,
  TrendingUp
} from 'lucide-react';
import { completeWelcome } from '../shared/store/uiSlice';

const VisualDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleStartDashboard = () => {
    dispatch(completeWelcome());
    navigate('/foundation');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <BarChart3 className="w-20 h-20 text-indigo-600 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Professional Dashboard
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Comprehensive measurement tools with AI intelligence
          </p>
          
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-indigo-600 mr-2" />
              <span className="font-medium text-indigo-800">
                Advanced tools for M&E professionals and complex programs
              </span>
            </div>
            <p className="text-indigo-700 text-sm">
              Build comprehensive measurement frameworks with team collaboration
            </p>
          </div>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Layers className="w-8 h-8 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Multi-Program Management
            </h3>
            <p className="text-gray-600">
              Manage multiple programs and portfolios with unified measurement frameworks
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Users className="w-8 h-8 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Team Collaboration
            </h3>
            <p className="text-gray-600">
              Real-time collaboration with role-based permissions and approval workflows
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Target className="w-8 h-8 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Advanced Analytics
            </h3>
            <p className="text-gray-600">
              Statistical analysis, trend detection, and automated insights generation
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <TrendingUp className="w-8 h-8 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Custom Dashboards
            </h3>
            <p className="text-gray-600">
              Build custom visualization dashboards for different stakeholder needs
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Settings className="w-8 h-8 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Integration Engine
            </h3>
            <p className="text-gray-600">
              Connect with existing data systems and automated reporting tools
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <CheckCircle className="w-8 h-8 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Quality Assurance
            </h3>
            <p className="text-gray-600">
              Automated data validation and measurement methodology compliance
            </p>
          </div>
        </div>

        {/* Getting Started Path */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Your Professional Setup Path
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                1
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Foundation Setup</h4>
              <p className="text-sm text-gray-600">Build comprehensive theory of change and decision framework</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                2
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Indicator Framework</h4>
              <p className="text-sm text-gray-600">Design measurement framework with validated indicators</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                3
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Data Integration</h4>
              <p className="text-sm text-gray-600">Connect data sources and setup collection workflows</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                4
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Team Onboarding</h4>
              <p className="text-sm text-gray-600">Setup collaboration and reporting workflows</p>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">
              <strong>Estimated setup time:</strong> 35-45 minutes for comprehensive framework
            </p>
            <p className="text-sm text-gray-500">
              Progress is auto-saved. You can pause and resume anytime.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/welcome')}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Welcome
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/quickstart')}
              className="px-6 py-3 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Switch to Quick Start
            </button>
            
            <button
              onClick={handleStartDashboard}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center font-medium"
            >
              Start Professional Setup
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualDashboard;