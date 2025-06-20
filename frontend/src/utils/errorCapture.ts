/**
 * Comprehensive Error Capture System
 * Catches and reports all runtime errors with detailed stack traces and context
 */

import React from 'react';

interface ErrorReport {
  timestamp: string;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  context: {
    url: string;
    userAgent: string;
    component?: string;
    props?: any;
    state?: any;
  };
  breadcrumbs: Array<{
    timestamp: string;
    category: string;
    message: string;
    data?: any;
  }>;
}

class ErrorCaptureService {
  private breadcrumbs: ErrorReport['breadcrumbs'] = [];
  private maxBreadcrumbs = 20;

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        source: 'global',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        source: 'promise',
        reason: event.reason
      });
    });

    // Override console.error to capture additional context
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.addBreadcrumb('console', 'Console Error', { args });
      originalConsoleError.apply(console, args);
    };
  }

  addBreadcrumb(category: string, message: string, data?: any) {
    this.breadcrumbs.push({
      timestamp: new Date().toISOString(),
      category,
      message,
      data
    });

    // Keep only the latest breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  captureError(error: Error, context: any = {}) {
    const report: ErrorReport = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context
      },
      breadcrumbs: [...this.breadcrumbs]
    };

    // Log to console with enhanced formatting
    console.group('🚨 Runtime Error Detected');
    console.error('Error:', error);
    console.log('Full Report:', report);
    console.groupEnd();

    // Store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('error_reports') || '[]');
      existingErrors.push(report);
      // Keep only last 10 errors
      localStorage.setItem('error_reports', JSON.stringify(existingErrors.slice(-10)));
    } catch (e) {
      console.warn('Failed to store error report:', e);
    }

    // Send to backend if available
    this.sendErrorReport(report);

    return report;
  }

  private async sendErrorReport(report: ErrorReport) {
    try {
      // Try to send to backend error logging endpoint
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });
    } catch (e) {
      // Backend not available, error already logged locally
    }
  }

  // Method to manually check and report on critical components
  testCriticalComponents() {
    console.group('🔍 Testing Critical Components');
    
    const tests = [
      {
        name: 'Redux Store',
        test: () => {
          const { store } = require('../shared/store/store');
          const state = store.getState();
          this.addBreadcrumb('test', 'Redux Store Test', { hasAuth: !!state.auth, hasUI: !!state.ui });
          return { success: true, state: Object.keys(state) };
        }
      },
      {
        name: 'Auth Hook',
        test: () => {
          // This will be called from within a component context
          this.addBreadcrumb('test', 'Auth Hook Test - Skipped (requires component context)');
          return { success: true, note: 'Requires component context' };
        }
      },
      {
        name: 'API Client',
        test: () => {
          const { apiClient } = require('../shared/services/apiClient');
          this.addBreadcrumb('test', 'API Client Test', { hasApiClient: !!apiClient });
          return { success: true, hasApiClient: !!apiClient };
        }
      },
      {
        name: 'Router',
        test: () => {
          this.addBreadcrumb('test', 'Router Test', { pathname: window.location.pathname });
          return { success: true, pathname: window.location.pathname };
        }
      }
    ];

    const results = tests.map(({ name, test }) => {
      try {
        const result = test();
        console.log(`✅ ${name}:`, result);
        return { name, success: true, result };
      } catch (error) {
        console.error(`❌ ${name}:`, error);
        this.captureError(error as Error, { component: name, source: 'critical_test' });
        return { name, success: false, error: (error as Error).message };
      }
    });

    console.groupEnd();
    return results;
  }

  // Get all stored error reports
  getStoredErrors(): ErrorReport[] {
    try {
      return JSON.parse(localStorage.getItem('error_reports') || '[]');
    } catch {
      return [];
    }
  }

  // Clear stored errors
  clearStoredErrors() {
    localStorage.removeItem('error_reports');
  }
}

// Global instance
export const errorCapture = new ErrorCaptureService();

// React Error Boundary Helper
export class ErrorBoundaryWithCapture extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    errorCapture.captureError(error, {
      component: 'ErrorBoundary',
      errorInfo,
      source: 'react_boundary'
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || React.createElement('div', {
        style: { 
          padding: '20px', 
          border: '1px solid red', 
          borderRadius: '8px', 
          backgroundColor: '#fff5f5',
          margin: '20px'
        }
      }, [
        React.createElement('h2', { 
          key: 'title',
          style: { color: '#dc2626' } 
        }, 'Something went wrong'),
        React.createElement('p', { 
          key: 'description' 
        }, 'An error occurred in this component. Check the console for details.'),
        React.createElement('details', { 
          key: 'details',
          style: { marginTop: '10px' } 
        }, [
          React.createElement('summary', { key: 'summary' }, 'Error Details'),
          React.createElement('pre', { 
            key: 'stack',
            style: { fontSize: '12px', overflow: 'auto' } 
          }, this.state.error?.stack)
        ]),
        React.createElement('button', {
          key: 'retry',
          onClick: () => this.setState({ hasError: false }),
          style: { 
            padding: '8px 16px', 
            marginTop: '10px', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, 'Try Again')
      ]);
    }

    return this.props.children;
  }
}

// Development helper to show errors in dev mode
export const ErrorReporter: React.FC = () => {
  const [errors, setErrors] = React.useState<ErrorReport[]>([]);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const updateErrors = () => setErrors(errorCapture.getStoredErrors());
    updateErrors();
    
    // Update every 5 seconds
    const interval = setInterval(updateErrors, 5000);
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development' || errors.length === 0) {
    return null;
  }

  return React.createElement('div', {
    style: { 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      zIndex: 9999,
      fontFamily: 'monospace'
    }
  }, [
    React.createElement('button', {
      key: 'toggle',
      onClick: () => setIsVisible(!isVisible),
      style: {
        backgroundColor: '#dc2626',
        color: 'white',
        border: 'none',
        borderRadius: '20px',
        padding: '10px 15px',
        cursor: 'pointer',
        fontSize: '12px'
      }
    }, `🚨 ${errors.length} Error${errors.length !== 1 ? 's' : ''}`),
    
    isVisible && React.createElement('div', {
      key: 'popup',
      style: {
        position: 'absolute',
        bottom: '50px',
        right: '0',
        width: '400px',
        maxHeight: '300px',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '10px',
        overflow: 'auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }
    }, [
      React.createElement('div', {
        key: 'header',
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }
      }, [
        React.createElement('h3', { 
          key: 'title',
          style: { margin: 0, fontSize: '14px' } 
        }, 'Recent Errors'),
        React.createElement('button', {
          key: 'clear',
          onClick: () => {
            errorCapture.clearStoredErrors();
            setErrors([]);
          },
          style: { fontSize: '12px', padding: '4px 8px' }
        }, 'Clear')
      ]),
      ...errors.slice(-5).map((error, index) => 
        React.createElement('div', {
          key: index,
          style: { 
            marginBottom: '10px', 
            padding: '8px', 
            backgroundColor: '#fee', 
            borderRadius: '4px',
            fontSize: '11px'
          }
        }, [
          React.createElement('div', { 
            key: 'name',
            style: { fontWeight: 'bold' } 
          }, `${error.error.name}: ${error.error.message}`),
          React.createElement('div', { 
            key: 'meta',
            style: { color: '#666', marginTop: '4px' } 
          }, `${new Date(error.timestamp).toLocaleTimeString()}${error.context.component ? ` • ${error.context.component}` : ''}`)
        ])
      )
    ])
  ]);
};