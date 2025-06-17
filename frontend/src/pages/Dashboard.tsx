import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  FileText,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import { RootState } from '../shared/store/store';
import { useAuth } from '../shared/hooks/useAuth';

const Dashboard: React.FC = () => {
  const { user, organization } = useAuth();
  const conversations = useSelector((state: RootState) => state.conversation.conversations);

  // Mock data for demonstration
  const stats = {
    totalIndicators: 12,
    activeMeasurements: 8,
    completedReports: 3,
    pendingApprovals: 2,
  };

  const recentActivity = [
    {
      id: '1',
      type: 'measurement',
      title: 'New measurement recorded for PI5675',
      description: 'Income increase measurement updated',
      timestamp: '2 hours ago',
      status: 'completed',
    },
    {
      id: '2',
      type: 'approval',
      title: 'Custom indicator pending approval',
      description: 'Digital literacy assessment indicator',
      timestamp: '4 hours ago',
      status: 'pending',
    },
    {
      id: '3',
      type: 'conversation',
      title: 'Started chat about SDG alignment',
      description: 'Discussion on mapping indicators to SDG targets',
      timestamp: '1 day ago',
      status: 'completed',
    },
    {
      id: '4',
      type: 'report',
      title: 'Q4 Impact Report generated',
      description: 'Quarterly report with 8 indicators',
      timestamp: '2 days ago',
      status: 'completed',
    },
  ];

  const quickActions = [
    {
      title: 'Start New Conversation',
      description: 'Ask about IRIS+ indicators or impact measurement',
      icon: MessageSquare,
      link: '/chat',
      color: 'blue',
    },
    {
      title: 'Create Custom Indicator',
      description: 'Build a tailored indicator for your organization',
      icon: Target,
      link: '/indicators/create',
      color: 'green',
    },
    {
      title: 'Generate Report',
      description: 'Create an impact report from your measurements',
      icon: FileText,
      link: '/reports/create',
      color: 'purple',
    },
    {
      title: 'Review Approvals',
      description: 'Approve pending indicators and measurements',
      icon: CheckCircle,
      link: '/approvals',
      color: 'orange',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'measurement':
        return <BarChart3 className="w-4 h-4" />;
      case 'approval':
        return <CheckCircle className="w-4 h-4" />;
      case 'conversation':
        return <MessageSquare className="w-4 h-4" />;
      case 'report':
        return <FileText className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! 👋
        </h1>
        <p className="text-gray-600">
          {organization?.name && `Managing impact for ${organization.name}. `}
          Here's what's happening with your impact measurement.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Indicators</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalIndicators}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+2 this month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Measurements</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeMeasurements}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+3 this week</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Reports</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedReports}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>Last: 2 days ago</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          {stats.pendingApprovals > 0 && (
            <div className="mt-4">
              <Link 
                to="/approvals" 
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Review now →
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  to={action.link}
                  className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center
                      ${action.color === 'blue' ? 'bg-blue-50' :
                        action.color === 'green' ? 'bg-green-50' :
                        action.color === 'purple' ? 'bg-purple-50' :
                        'bg-orange-50'
                      }
                    `}>
                      <Icon className={`
                        w-6 h-6
                        ${action.color === 'blue' ? 'text-blue-600' :
                          action.color === 'green' ? 'text-green-600' :
                          action.color === 'purple' ? 'text-purple-600' :
                          'text-orange-600'
                        }
                      `} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${getStatusColor(activity.status)}
                    `}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-3">
              <Link 
                to="/activity" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all activity →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Section (for new users) */}
      {Object.keys(conversations).length === 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                👋 Get started with Impact Bot
              </h3>
              <p className="text-blue-800 mb-4">
                New to impact measurement? Start a conversation with our AI assistant to discover 
                IRIS+ indicators that match your organization's mission and get personalized guidance.
              </p>
              <Link
                to="/chat"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Start Your First Conversation
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;