#!/usr/bin/env node

/**
 * Homepage Error Debug Script
 * Systematically tests each component that loads on the homepage to identify the source of errors
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`)
};

// Create a minimal test component for each critical component
function createTestComponent(componentName, importPath) {
  return `
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../shared/store/store';
import { errorCapture } from '../utils/errorCapture';

// Import the component we're testing
let Component;
try {
  Component = require('${importPath}').default || require('${importPath}');
} catch (error) {
  console.error('Failed to import ${componentName}:', error);
  Component = () => <div>Failed to import ${componentName}: {error.message}</div>;
}

const Test${componentName.replace(/[^a-zA-Z]/g, '')} = () => {
  React.useEffect(() => {
    errorCapture.addBreadcrumb('test', 'Testing ${componentName}');
    console.log('🧪 Testing ${componentName}');
    
    // Test critical functions if available
    try {
      if (typeof window !== 'undefined') {
        console.log('Window object available');
        console.log('Redux store state:', store.getState());
      }
    } catch (error) {
      console.error('Error in test setup:', error);
      errorCapture.captureError(error, { component: '${componentName}', phase: 'test_setup' });
    }
  }, []);

  try {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <div style={{ padding: '20px', border: '2px solid green', margin: '10px' }}>
            <h2>Testing: ${componentName}</h2>
            <Component />
          </div>
        </BrowserRouter>
      </Provider>
    );
  } catch (error) {
    console.error('Error rendering ${componentName}:', error);
    errorCapture.captureError(error, { component: '${componentName}', phase: 'render' });
    return (
      <div style={{ padding: '20px', border: '2px solid red', margin: '10px' }}>
        <h2>❌ ${componentName} Failed</h2>
        <p>Error: {error.message}</p>
        <pre style={{ fontSize: '10px', overflow: 'auto' }}>{error.stack}</pre>
      </div>
    );
  }
};

export default Test${componentName.replace(/[^a-zA-Z]/g, '')};
`;
}

// Critical components that are likely loaded on homepage
const criticalComponents = [
  { name: 'App', path: '../App' },
  { name: 'FoundationDashboard', path: '../pages/FoundationDashboard' },
  { name: 'AppLayout', path: '../layouts/AppLayout' },
  { name: 'FoundationReadinessWidget', path: '../components/FoundationReadinessWidget' },
  { name: 'CollaborativeFoundationBuilder', path: '../components/CollaborativeFoundationBuilder' },
  { name: 'AIPersonalityWidget', path: '../components/AIPersonalityWidget' },
  { name: 'DependencyErrorBoundary', path: '../components/DependencyErrorBoundary' }
];

// Create test files for each component
async function createTestFiles() {
  log.info('Creating individual component test files...');
  
  const testDir = path.join(__dirname, '../debug/component-tests');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  for (const component of criticalComponents) {
    const testContent = createTestComponent(component.name, component.path);
    const testFilePath = path.join(testDir, `Test${component.name}.tsx`);
    fs.writeFileSync(testFilePath, testContent);
    log.success(`Created test for ${component.name}`);
  }

  // Create a master test component that tests all components
  const masterTestContent = `
import React, { useState } from 'react';
import { errorCapture } from '../../utils/errorCapture';
${criticalComponents.map(c => `import Test${c.name.replace(/[^a-zA-Z]/g, '')} from './Test${c.name}';`).join('\n')}

const ComponentTestSuite = () => {
  const [currentTest, setCurrentTest] = useState(0);
  const [testResults, setTestResults] = useState([]);
  
  const tests = [
${criticalComponents.map(c => `    { name: '${c.name}', component: Test${c.name.replace(/[^a-zA-Z]/g, '')} }`).join(',\n')}
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

  const runIndividualTest = (index) => {
    setCurrentTest(index);
    errorCapture.addBreadcrumb('test_suite', \`Testing component: \${tests[index].name}\`);
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
`;

  const masterTestPath = path.join(testDir, 'ComponentTestSuite.tsx');
  fs.writeFileSync(masterTestPath, masterTestContent);
  log.success('Created master test suite');

  return testDir;
}

// Add a debug route to App.tsx to access the test suite
async function addDebugRoute() {
  const appPath = path.join(__dirname, '../App.tsx');
  let appContent = fs.readFileSync(appPath, 'utf8');
  
  // Check if debug route already exists
  if (appContent.includes('/debug/component-test')) {
    log.info('Debug route already exists');
    return;
  }
  
  // Add import for test suite
  const importLine = "import ComponentTestSuite from './debug/component-tests/ComponentTestSuite';";
  if (!appContent.includes(importLine)) {
    const importInsertPoint = appContent.indexOf("import './App.css';");
    if (importInsertPoint !== -1) {
      appContent = `${appContent.slice(0, importInsertPoint) + 
                   importLine  }\n${  
                   appContent.slice(importInsertPoint)}`;
    }
  }
  
  // Add route
  const routeToAdd = `
      {/* Component Test Suite - Debug Route */}
      <Route path="/debug/component-test" element={<ComponentTestSuite />} />
`;
  
  const routeInsertPoint = appContent.indexOf('      {/* Debug route for testing */}');
  if (routeInsertPoint !== -1) {
    appContent = appContent.slice(0, routeInsertPoint) + 
                 routeToAdd + 
                 appContent.slice(routeInsertPoint);
  }
  
  fs.writeFileSync(appPath, appContent);
  log.success('Added debug route to App.tsx');
}

// Main function
async function debugHomepageErrors() {
  console.log(`${colors.magenta}🔍 Homepage Error Debug Tool${colors.reset}`);
  console.log('');
  
  try {
    // Create test files
    const testDir = await createTestFiles();
    
    // Add debug route
    await addDebugRoute();
    
    log.success('Debug setup completed!');
    console.log('');
    log.info('Next steps:');
    console.log('1. Start your React app: npm start');
    console.log('2. Navigate to: http://localhost:3000/debug/component-test');
    console.log('3. Click through each component test to identify the failing component');
    console.log('4. Check the browser console for detailed error information');
    console.log('5. Review the ErrorReporter widget in the bottom-right corner');
    console.log('');
    log.info('The test suite will:');
    console.log('- Test each critical component individually');
    console.log('- Capture detailed error information');
    console.log('- Show exactly which component is causing "Something went wrong"');
    console.log('- Provide stack traces and context for debugging');
    
  } catch (error) {
    log.error('Failed to set up debug environment:');
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  debugHomepageErrors();
}

module.exports = {
  debugHomepageErrors,
  createTestFiles,
  addDebugRoute
};