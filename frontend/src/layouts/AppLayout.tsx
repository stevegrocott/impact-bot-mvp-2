import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Target, 
  FileText, 
  CheckSquare, 
  Users, 
  Settings,
  Menu,
  X,
  Bell,
  User,
  Home
} from 'lucide-react';
import { RootState } from '../shared/store/store';
import { toggleSidebar, toggleChatPanel } from '../shared/store/uiSlice';
import { useAuth } from '../shared/hooks/useAuth';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, organization, logout } = useAuth();
  
  const { sidebarOpen, chatPanelOpen } = useSelector((state: RootState) => state.ui);
  const notifications = useSelector((state: RootState) => state.ui.notifications);

  const navigationItems = [
    { path: '/', icon: Home, label: 'Foundation' },
    { path: '/indicators', icon: Target, label: 'Indicators' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/approvals', icon: CheckSquare, label: 'Approvals' },
    { path: '/collaboration', icon: Users, label: 'Collaboration' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className={`
        bg-white shadow-sm border-r border-gray-200 flex flex-col
        ${sidebarOpen ? 'w-64' : 'w-16'}
        transition-all duration-300 ease-in-out
      `}>
        {/* Logo/Brand */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">Impact Bot</h1>
                <p className="text-xs text-gray-500">IRIS+ Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                {sidebarOpen && (
                  <span className="ml-3">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        {sidebarOpen && user && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {organization?.name}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {navigationItems.find(item => isActivePath(item.path))?.label || 'Foundation'}
                </h2>
                {organization && (
                  <p className="text-sm text-gray-500">{organization.name}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Chat Toggle */}
              <button
                onClick={() => dispatch(toggleChatPanel())}
                className={`
                  text-gray-500 hover:text-gray-700 transition-colors
                  ${chatPanelOpen ? 'text-blue-600' : ''}
                `}
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              {/* Settings */}
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <Settings className="w-5 h-5" />
              </button>

              {/* User Menu */}
              {user && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Primary Content */}
          <main className={`
            flex-1 overflow-auto
            ${chatPanelOpen ? 'mr-80' : ''}
            transition-all duration-300 ease-in-out
          `}>
            {children}
          </main>

          {/* Chat Panel */}
          {chatPanelOpen && (
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Impact Assistant</h3>
                <button
                  onClick={() => dispatch(toggleChatPanel())}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 p-4">
                <div className="text-center text-gray-500 text-sm">
                  Chat component will be integrated here
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Toast Container */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.slice(0, 3).map((notification) => (
            <div
              key={notification.id}
              className={`
                p-4 rounded-lg shadow-lg max-w-sm
                ${notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                  notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
                  notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
                  'bg-blue-50 border border-blue-200 text-blue-800'
                }
              `}
            >
              <h4 className="font-medium">{notification.title}</h4>
              <p className="text-sm">{notification.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppLayout;