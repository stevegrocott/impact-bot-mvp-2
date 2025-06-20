
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../../shared/store/store';
import { errorCapture } from '../../utils/errorCapture';

// Import the component we're testing
let Component: any;
try {
  Component = require('../../components/AIPersonalityWidget').default || require('../../components/AIPersonalityWidget');
} catch (error: any) {
  console.error('Failed to import AIPersonalityWidget:', error);
  Component = () => <div>Failed to import AIPersonalityWidget: {error?.message}</div>;
}

const TestAIPersonalityWidget = () => {
  React.useEffect(() => {
    errorCapture.addBreadcrumb('test', 'Testing AIPersonalityWidget');
    console.log('🧪 Testing AIPersonalityWidget');
    
    // Test critical functions if available
    try {
      if (typeof window !== 'undefined') {
        console.log('Window object available');
        console.log('Redux store state:', store.getState());
      }
    } catch (error: any) {
      console.error('Error in test setup:', error);
      errorCapture.captureError(error as Error, { component: 'AIPersonalityWidget', phase: 'test_setup' });
    }
  }, []);

  try {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <div style={{ padding: '20px', border: '2px solid green', margin: '10px' }}>
            <h2>Testing: AIPersonalityWidget</h2>
            <Component />
          </div>
        </BrowserRouter>
      </Provider>
    );
  } catch (error: any) {
    console.error('Error rendering AIPersonalityWidget:', error);
    errorCapture.captureError(error as Error, { component: 'AIPersonalityWidget', phase: 'render' });
    return (
      <div style={{ padding: '20px', border: '2px solid red', margin: '10px' }}>
        <h2>❌ AIPersonalityWidget Failed</h2>
        <p>Error: {(error as any)?.message}</p>
        <pre style={{ fontSize: '10px', overflow: 'auto' }}>{(error as any)?.stack}</pre>
      </div>
    );
  }
};

export default TestAIPersonalityWidget;
