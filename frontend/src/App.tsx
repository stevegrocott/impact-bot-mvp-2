import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DependencyErrorBoundary from './components/DependencyErrorBoundary';
import { store } from './shared/store/store';
import { useAuth } from './shared/hooks/useAuth';
import AppLayout from './layouts/AppLayout';
import SimpleChat from './pages/SimpleChat';
import FoundationDashboard from './pages/FoundationDashboard';
import IndicatorSelection from './pages/IndicatorSelection';
import WelcomeScreen from './pages/WelcomeScreen';
import QuickStartMode from './pages/QuickStartMode';
import PersonalitySelection from './pages/PersonalitySelection';
import VisualDashboard from './pages/VisualDashboard';
import { TheoryOfChangeCapture } from './modules/onboarding/components/TheoryOfChangeCapture';
import { LoginPage } from './components/LoginPage';
import { OrganizationDashboard } from './components/OrganizationDashboard';
import AIPersonalityDemo from './pages/AIPersonalityDemo';
import AdvancedFoundationDemo from './pages/AdvancedFoundationDemo';
import { errorCapture, ErrorBoundaryWithCapture, ErrorReporter } from './utils/errorCapture';
import ComponentTestSuite from './debug/component-tests/ComponentTestSuite';
import PeerBenchmarkingDashboard from './components/PeerBenchmarkingDashboard';
import KnowledgeSharingHub from './components/KnowledgeSharingHub';
import './App.css';

// Auth wrapper component
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { checkAuth } = useAuth();

  useEffect(() => {
    // Add breadcrumb for auth initialization
    errorCapture.addBreadcrumb('auth', 'Auth initialization started');
    
    checkAuth().then(() => {
      errorCapture.addBreadcrumb('auth', 'Auth check completed successfully');
    }).catch((error) => {
      errorCapture.captureError(error, { component: 'AuthWrapper', action: 'checkAuth' });
    });
  }, [checkAuth]);

  return <>{children}</>;
};

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main app routes
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Welcome/Onboarding routes */}
      <Route 
        path="/welcome" 
        element={
          <ProtectedRoute>
            <WelcomeScreen />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/quickstart" 
        element={
          <ProtectedRoute>
            <QuickStartMode />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/onboarding/personality" 
        element={
          <ProtectedRoute>
            <PersonalitySelection />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/visual" 
        element={
          <ProtectedRoute>
            <VisualDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FoundationDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SimpleChat />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/chat/:conversationId"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SimpleChat />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Foundation and onboarding routes */}
      <Route
        path="/foundation"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FoundationDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/foundation/theory-of-change"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TheoryOfChangeCapture />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/foundation/readiness"
        element={
          <ProtectedRoute>
            <AppLayout>
              <div>Foundation Readiness Dashboard (TODO)</div>
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/foundation/decisions"
        element={
          <ProtectedRoute>
            <AppLayout>
              <div>Decision Mapping (TODO)</div>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Organization Management routes */}
      <Route
        path="/organization"
        element={
          <ProtectedRoute>
            <AppLayout>
              <OrganizationDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* AI Personality Demo route */}
      <Route
        path="/ai-personality-demo"
        element={
          <ProtectedRoute>
            <AIPersonalityDemo />
          </ProtectedRoute>
        }
      />

      {/* Advanced Foundation Demo route */}
      <Route
        path="/advanced-foundation-demo"
        element={
          <ProtectedRoute>
            <AdvancedFoundationDemo />
          </ProtectedRoute>
        }
      />

      {/* Indicators module routes */}
      <Route
        path="/indicators"
        element={
          <ProtectedRoute>
            <AppLayout>
              <IndicatorSelection />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Reports module routes */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppLayout>
              <div>Reports Module (TODO)</div>
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Peer Benchmarking Dashboard */}
      <Route
        path="/benchmarking"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PeerBenchmarkingDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Knowledge Sharing Hub */}
      <Route
        path="/knowledge"
        element={
          <ProtectedRoute>
            <AppLayout>
              <KnowledgeSharingHub />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Approvals module routes */}
      <Route
        path="/approvals"
        element={
          <ProtectedRoute>
            <AppLayout>
              <div>Approvals Module (TODO)</div>
            </AppLayout>
          </ProtectedRoute>
        }
      />
      

      {/* Component Test Suite - Debug Route */}
      <Route path="/debug/component-test" element={<ComponentTestSuite />} />
      {/* Debug route for testing */}
      <Route path="/debug" element={
        <div>
          {React.createElement(require('./debug/homepage-test').default)}
        </div>
      } />
      
      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App component
const App: React.FC = () => {
  // Initialize error capture on app startup
  useEffect(() => {
    errorCapture.addBreadcrumb('app', 'Application started');
    
    // Test critical components immediately
    setTimeout(() => {
      try {
        const results = errorCapture.testCriticalComponents();
        console.log('🔍 Critical components test results:', results);
      } catch (error) {
        errorCapture.captureError(error as Error, { component: 'App', action: 'testCriticalComponents' });
      }
    }, 1000);
  }, []);

  return (
    <ErrorBoundaryWithCapture fallback={
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>🚨 Application Error Detected</h1>
        <p>A critical error occurred. Please check the console for detailed information.</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Reload Application
        </button>
      </div>
    }>
      <DependencyErrorBoundary>
        <Provider store={store}>
          <Router>
            <div className="App">
              <AuthWrapper>
                <AppRoutes />
              </AuthWrapper>
              <ErrorReporter />
            </div>
          </Router>
        </Provider>
      </DependencyErrorBoundary>
    </ErrorBoundaryWithCapture>
  );
};

export default App;