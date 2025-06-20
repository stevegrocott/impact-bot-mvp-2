/**
 * Immediate Error Capture - Catches errors as early as possible
 * This script runs immediately when loaded to catch even the earliest errors
 */

// Store errors before React even loads
window.__EARLY_ERRORS__ = [];
window.__ERROR_BREADCRUMBS__ = [];

// Add timestamp function
const timestamp = () => new Date().toISOString();

// Enhanced console override
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = function(...args) {
  window.__EARLY_ERRORS__.push({
    type: 'console.error',
    timestamp: timestamp(),
    args: args.map(arg => String(arg)),
    stack: new Error().stack
  });
  originalConsoleError.apply(console, args);
};

console.warn = function(...args) {
  window.__ERROR_BREADCRUMBS__.push({
    type: 'console.warn',
    timestamp: timestamp(),
    message: args.map(arg => String(arg)).join(' ')
  });
  originalConsoleWarn.apply(console, args);
};

// Override global error handler immediately
window.addEventListener('error', function(event) {
  const errorInfo = {
    type: 'global_error',
    timestamp: timestamp(),
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error ? {
      name: event.error.name,
      message: event.error.message,
      stack: event.error.stack
    } : null,
    stack: event.error?.stack || 'No stack available'
  };
  
  window.__EARLY_ERRORS__.push(errorInfo);
  
  console.group('🚨 IMMEDIATE ERROR DETECTED');
  console.error('Error Info:', errorInfo);
  console.error('All Early Errors:', window.__EARLY_ERRORS__);
  console.error('Breadcrumbs:', window.__ERROR_BREADCRUMBS__);
  console.groupEnd();
  
  // Try to show an alert if nothing else is working
  if (window.__EARLY_ERRORS__.length === 1) {
    setTimeout(() => {
      alert(`CRITICAL ERROR DETECTED:\n${event.message}\nFile: ${event.filename}:${event.lineno}\nCheck console for details.`);
    }, 100);
  }
}, true);

// Override promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
  const errorInfo = {
    type: 'unhandled_rejection',
    timestamp: timestamp(),
    reason: String(event.reason),
    stack: event.reason?.stack || 'No stack available'
  };
  
  window.__EARLY_ERRORS__.push(errorInfo);
  
  console.group('🚨 UNHANDLED PROMISE REJECTION');
  console.error('Rejection Info:', errorInfo);
  console.error('All Early Errors:', window.__EARLY_ERRORS__);
  console.groupEnd();
});

// Monitor React error boundaries
let originalReactErrorBoundary = null;
if (window.React && window.React.Component) {
  originalReactErrorBoundary = window.React.Component.prototype.componentDidCatch;
  window.React.Component.prototype.componentDidCatch = function(error, errorInfo) {
    window.__EARLY_ERRORS__.push({
      type: 'react_error_boundary',
      timestamp: timestamp(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      componentStack: errorInfo.componentStack
    });
    
    console.group('🚨 REACT ERROR BOUNDARY TRIGGERED');
    console.error('React Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('All Early Errors:', window.__EARLY_ERRORS__);
    console.groupEnd();
    
    if (originalReactErrorBoundary) {
      return originalReactErrorBoundary.call(this, error, errorInfo);
    }
  };
}

// Add breadcrumb function
window.addErrorBreadcrumb = function(category, message, data) {
  window.__ERROR_BREADCRUMBS__.push({
    timestamp: timestamp(),
    category,
    message,
    data
  });
  
  // Keep only last 50 breadcrumbs
  if (window.__ERROR_BREADCRUMBS__.length > 50) {
    window.__ERROR_BREADCRUMBS__ = window.__ERROR_BREADCRUMBS__.slice(-50);
  }
};

// Test critical imports immediately
window.addErrorBreadcrumb('startup', 'Immediate error capture loaded');

setTimeout(() => {
  try {
    window.addErrorBreadcrumb('startup', 'Testing critical imports');
    
    // Test if React is available
    if (typeof React === 'undefined') {
      throw new Error('React is not defined');
    }
    window.addErrorBreadcrumb('startup', 'React is available');
    
    // Test if ReactDOM is available
    if (typeof ReactDOM === 'undefined') {
      throw new Error('ReactDOM is not defined');
    }
    window.addErrorBreadcrumb('startup', 'ReactDOM is available');
    
  } catch (error) {
    window.__EARLY_ERRORS__.push({
      type: 'import_test',
      timestamp: timestamp(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
    console.error('🚨 Critical import test failed:', error);
  }
}, 100);

// Expose debug functions globally
window.showAllErrors = function() {
  console.group('🔍 ALL CAPTURED ERRORS');
  console.log('Early Errors:', window.__EARLY_ERRORS__);
  console.log('Breadcrumbs:', window.__ERROR_BREADCRUMBS__);
  console.groupEnd();
  
  return {
    errors: window.__EARLY_ERRORS__,
    breadcrumbs: window.__ERROR_BREADCRUMBS__
  };
};

window.clearAllErrors = function() {
  window.__EARLY_ERRORS__ = [];
  window.__ERROR_BREADCRUMBS__ = [];
  console.log('✓ All errors cleared');
};

console.log('🛡️ Immediate error capture system loaded');
console.log('Run window.showAllErrors() to see all captured errors');
console.log('Run window.clearAllErrors() to clear error history');