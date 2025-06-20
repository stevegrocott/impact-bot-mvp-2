
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../../shared/store/store';
import { errorCapture } from '../../utils/errorCapture';

// Import the component we're testing
let Component: any;
try {
  Component = require('../../components/FoundationReadinessWidget').default || require('../../components/FoundationReadinessWidget');
} catch (error: any) {
  console.error('Failed to import FoundationReadinessWidget:', error);
  Component = () => <div>Failed to import FoundationReadinessWidget: {error?.message}</div>;
}

const TestFoundationReadinessWidget = () => {
  React.useEffect(() => {
    errorCapture.addBreadcrumb('test', 'Testing FoundationReadinessWidget');
    console.log('🧪 Testing FoundationReadinessWidget');
    
    // Test critical functions if available
    try {
      if (typeof window !== 'undefined') {
        console.log('Window object available');
        console.log('Redux store state:', store.getState());
      }
    } catch (error: any) {
      console.error('Error in test setup:', error);
      errorCapture.captureError(error as Error, { component: 'FoundationReadinessWidget', phase: 'test_setup' });
    }
  }, []);

  try {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <div style={{ padding: '20px', border: '2px solid green', margin: '10px' }}>
            <h2>Testing: FoundationReadinessWidget</h2>
            <Component />
          </div>
        </BrowserRouter>
      </Provider>
    );
  } catch (error: any) {
    console.error('Error rendering FoundationReadinessWidget:', error);
    errorCapture.captureError(error as Error, { component: 'FoundationReadinessWidget', phase: 'render' });
    return (
      <div style={{ padding: '20px', border: '2px solid red', margin: '10px' }}>
        <h2>❌ FoundationReadinessWidget Failed</h2>
        <p>Error: {error?.message}</p>
        <pre style={{ fontSize: '10px', overflow: 'auto' }}>{error?.stack}</pre>
      </div>
    );
  }
};

export default TestFoundationReadinessWidget;
