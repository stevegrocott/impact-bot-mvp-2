
import React, { useState } from 'react';
import { errorCapture } from '../../utils/errorCapture';
import TestApp from './TestApp';
import TestFoundationDashboard from './TestFoundationDashboard';
import TestAppLayout from './TestAppLayout';
import TestFoundationReadinessWidget from './TestFoundationReadinessWidget';
import TestCollaborativeFoundationBuilder from './TestCollaborativeFoundationBuilder';
import TestAIPersonalityWidget from './TestAIPersonalityWidget';
import TestDependencyErrorBoundary from './TestDependencyErrorBoundary';

const ComponentTestSuite = () => {
  const [currentTest, setCurrentTest] = useState(0);
  const [testResults, setTestResults] = useState([]);
  
  const tests = [
    { name: 'App', component: TestApp },
    { name: 'FoundationDashboard', component: TestFoundationDashboard },
    { name: 'AppLayout', component: TestAppLayout },
    { name: 'FoundationReadinessWidget', component: TestFoundationReadinessWidget },
    { name: 'CollaborativeFoundationBuilder', component: TestCollaborativeFoundationBuilder },
    { name: 'AIPersonalityWidget', component: TestAIPersonalityWidget },
    { name: 'DependencyErrorBoundary', component: TestDependencyErrorBoundary }
  ];

  React.useEffect(() => {
    console.log('🧪 Starting Component Test Suite');
    errorCapture.addBreadcrumb('test_suite', 'Component test suite started');
    
    // Test critical functions
    try {
      const testResults = errorCapture.testCriticalComponents();
      console.log('Critical component test results:', testResults);
    } catch (error) {
      console.error('Critical component test failed:', error);
    }
  }, []);

  const runIndividualTest = (index: number) => {
    setCurrentTest(index);
    errorCapture.addBreadcrumb('test_suite', `Testing component: ${tests[index].name}`);
  };

  const CurrentTestComponent = tests[currentTest]?.component;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Component Test Suite</h1>
      <p>Testing each critical component individually to identify issues.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Controls:</h3>
        {tests.map((test, index) => (
          <button
            key={test.name}
            onClick={() => runIndividualTest(index)}
            style={{
              margin: '5px',
              padding: '8px 12px',
              backgroundColor: currentTest === index ? '#3b82f6' : '#e5e7eb',
              color: currentTest === index ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test {test.name}
          </button>
        ))}
      </div>

      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px' }}>
        <h3>Current Test: {tests[currentTest]?.name}</h3>
        {CurrentTestComponent && <CurrentTestComponent />}
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h4>Debug Information:</h4>
        <p><strong>Current URL:</strong> {window.location.href}</p>
        <p><strong>Errors captured:</strong> {errorCapture.getStoredErrors().length}</p>
        <button 
          onClick={() => console.log('Stored errors:', errorCapture.getStoredErrors())}
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          Log All Errors to Console
        </button>
      </div>
    </div>
  );
};

export default ComponentTestSuite;
