import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import './App.css';

// Auth wrapper component
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
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
      
      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <AuthWrapper>
            <AppRoutes />
          </AuthWrapper>
        </div>
      </Router>
    </Provider>
  );
};

export default App;