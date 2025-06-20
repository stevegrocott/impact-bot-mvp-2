/**
 * Dependency Error Boundary
 * Catches and handles dependency-related errors gracefully
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Package } from 'lucide-react';
import { errorCapture } from '../utils/errorCapture';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  isDependencyError: boolean;
}

class DependencyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isDependencyError: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if error is dependency-related
    const isDependencyError = error.message.includes('Cannot find module') ||
                             error.message.includes('framer-motion') ||
                             error.message.includes('Module not found');

    return {
      hasError: true,
      error,
      isDependencyError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dependency Error Boundary caught an error:', error, errorInfo);
    
    // Capture error with enhanced context using our error capture system
    errorCapture.captureError(error, {
      component: 'DependencyErrorBoundary',
      componentStack: errorInfo.componentStack,
      isDependencyError: this.state.isDependencyError,
      source: 'error_boundary'
    });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Enhanced error logging with debugging information
    console.group('🚨 Error Boundary Details');
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Type:', error.constructor.name);
    console.error('Is Dependency Error:', this.state.isDependencyError);
    
    // Log additional debugging info
    if (typeof window !== 'undefined') {
      console.error('Current URL:', window.location.href);
      console.error('User Agent:', navigator.userAgent);
    }
    
    // Try to identify specific issues
    if (error.message.includes('Cannot find module')) {
      console.error('🔍 Module Resolution Issue Detected');
      console.error('Suggestion: Check if all dependencies are properly installed');
      errorCapture.addBreadcrumb('diagnosis', 'Module resolution issue detected');
    } else if (error.message.includes('is not defined')) {
      console.error('🔍 Variable/Function Not Defined Issue Detected');
      console.error('Suggestion: Check imports and variable declarations');
      errorCapture.addBreadcrumb('diagnosis', 'Variable/function not defined issue detected');
    } else if (error.message.includes('Cannot read propert')) {
      console.error('🔍 Property Access Issue Detected');
      console.error('Suggestion: Check for null/undefined values before property access');
      errorCapture.addBreadcrumb('diagnosis', 'Property access issue detected');
    }
    
    console.groupEnd();
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, isDependencyError: false });
  };

  handleInstallDependencies = () => {
    console.info('Attempting to install missing dependencies...');
    // In a real app, this might trigger a service worker or show instructions
    window.alert('Please run "npm install" to install missing dependencies, then refresh the page.');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Dependency-specific error UI
      if (this.state.isDependencyError) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Package className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Missing Dependencies
              </h1>
              
              <p className="text-gray-600 mb-6">
                Some required packages are missing or not properly installed. 
                This is typically resolved by running the installation command.
              </p>
              
              <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
                <code className="text-sm text-gray-800">npm install</code>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={this.handleInstallDependencies}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Install Dependencies
                </button>
                
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </button>
              </div>
              
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Technical Details
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
          </div>
        );
      }

      // Generic error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            
            <button
              onClick={this.handleRetry}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DependencyErrorBoundary;