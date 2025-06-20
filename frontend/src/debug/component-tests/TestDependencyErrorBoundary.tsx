
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../../shared/store/store';
import { errorCapture } from '../../utils/errorCapture';

// Import the component we're testing
let Component: any;
try {
  Component = require('../../components/DependencyErrorBoundary').default || require('../../components/DependencyErrorBoundary');
} catch (error: any) {
  console.error('Failed to import DependencyErrorBoundary:', error);
  Component = () => <div>Failed to import DependencyErrorBoundary: {error?.message}</div>;
}

const TestDependencyErrorBoundary = () => {
  React.useEffect(() => {
    errorCapture.addBreadcrumb('test', 'Testing DependencyErrorBoundary');
    console.log('🧪 Testing DependencyErrorBoundary');
    
    // Test critical functions if available
    try {
      if (typeof window !== 'undefined') {
        console.log('Window object available');
        console.log('Redux store state:', store.getState());
      }
    } catch (error: any) {
      console.error('Error in test setup:', error);
      errorCapture.captureError(error as Error, { component: 'DependencyErrorBoundary', phase: 'test_setup' });
    }
  }, []);

  try {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <div style={{ padding: '20px', border: '2px solid green', margin: '10px' }}>
            <h2>Testing: DependencyErrorBoundary</h2>
            <Component />
          </div>
        </BrowserRouter>
      </Provider>
    );
  } catch (error: any) {
    console.error('Error rendering DependencyErrorBoundary:', error);
    errorCapture.captureError(error as Error, { component: 'DependencyErrorBoundary', phase: 'render' });
    return (
      <div style={{ padding: '20px', border: '2px solid red', margin: '10px' }}>
        <h2>❌ DependencyErrorBoundary Failed</h2>
        <p>Error: {error?.message}</p>
        <pre style={{ fontSize: '10px', overflow: 'auto' }}>{error?.stack}</pre>
      </div>
    );
  }
};

export default TestDependencyErrorBoundary;
