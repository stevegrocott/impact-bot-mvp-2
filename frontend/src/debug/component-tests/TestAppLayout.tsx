
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../../shared/store/store';
import { errorCapture } from '../../utils/errorCapture';

// Import the component we're testing
let Component: any;
try {
  Component = require('../../layouts/AppLayout').default || require('../../layouts/AppLayout');
} catch (error: any) {
  console.error('Failed to import AppLayout:', error);
  Component = () => <div>Failed to import AppLayout: {error?.message}</div>;
}

const TestAppLayout = () => {
  React.useEffect(() => {
    errorCapture.addBreadcrumb('test', 'Testing AppLayout');
    console.log('🧪 Testing AppLayout');
    
    // Test critical functions if available
    try {
      if (typeof window !== 'undefined') {
        console.log('Window object available');
        console.log('Redux store state:', store.getState());
      }
    } catch (error: any) {
      console.error('Error in test setup:', error);
      errorCapture.captureError(error as Error, { component: 'AppLayout', phase: 'test_setup' });
    }
  }, []);

  try {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <div style={{ padding: '20px', border: '2px solid green', margin: '10px' }}>
            <h2>Testing: AppLayout</h2>
            <Component />
          </div>
        </BrowserRouter>
      </Provider>
    );
  } catch (error: any) {
    console.error('Error rendering AppLayout:', error);
    errorCapture.captureError(error as Error, { component: 'AppLayout', phase: 'render' });
    return (
      <div style={{ padding: '20px', border: '2px solid red', margin: '10px' }}>
        <h2>❌ AppLayout Failed</h2>
        <p>Error: {error?.message}</p>
        <pre style={{ fontSize: '10px', overflow: 'auto' }}>{error?.stack}</pre>
      </div>
    );
  }
};

export default TestAppLayout;
