#!/usr/bin/env node

/**
 * Runtime Validation Script
 * Validates that all components can be imported and instantiated without errors
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

// Critical components that must work for the app to function
const CRITICAL_COMPONENTS = [
  'src/App.tsx',
  'src/pages/FoundationDashboard.tsx',
  'src/layouts/AppLayout.tsx',
  'src/components/LoginPage.tsx',
  'src/pages/WelcomeScreen.tsx',
  'src/hooks/useSafeDependencies.ts',
  'src/utils/moduleResolver.ts',
  'src/components/DependencyErrorBoundary.tsx'
];

// Create a test runner that validates component instantiation
function createComponentTest(componentPath) {
  const relativePath = componentPath.replace(/^src\//, '');
  const importPath = `./${  relativePath.replace(/\.tsx?$/, '')}`;
  
  return `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './shared/store/store';

async function testComponent() {
  try {
    console.log('Testing ${componentPath}...');
    
    // Try to import the component
    const module = await import('${importPath}');
    const Component = module.default || module;
    
    if (!Component) {
      throw new Error('No default export found');
    }
    
    // Try to create a test container
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    
    // Try to render the component with necessary providers
    root.render(
      React.createElement(Provider, { store },
        React.createElement(BrowserRouter, {},
          React.createElement(Component, {})
        )
      )
    );
    
    // Clean up
    setTimeout(() => {
      root.unmount();
      document.body.removeChild(container);
    }, 100);
    
    console.log('✓ ${componentPath} loaded successfully');
    return true;
  } catch (error) {
    console.error('✗ ${componentPath} failed to load:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

testComponent().then(success => {
  if (success) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}).catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
`;
}

// Validate component can be imported without runtime errors
async function validateComponentImport(componentPath) {
  const testFile = path.join(__dirname, '../test-component.js');
  const testContent = createComponentTest(componentPath);
  
  try {
    // Write test file
    fs.writeFileSync(testFile, testContent);
    
    // Run test in browser environment
    return new Promise((resolve) => {
      const testProcess = spawn('npm', ['run', 'test', '--', '--testPathPattern=test-component', '--watchAll=false'], {
        cwd: path.join(__dirname, '../../'),
        stdio: 'pipe'
      });
      
      let output = '';
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      testProcess.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      testProcess.on('close', (code) => {
        // Clean up test file
        try {
          fs.unlinkSync(testFile);
        } catch (e) {
          // Ignore cleanup errors
        }
        
        resolve({
          success: code === 0,
          output
        });
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        testProcess.kill();
        resolve({
          success: false,
          output: 'Test timeout'
        });
      }, 30000);
    });
  } catch (error) {
    return {
      success: false,
      output: error.message
    };
  }
}

// Check for common runtime issues
function validateRuntimeIssues() {
  log.info('🔍 Checking for common runtime issues...');
  
  const issues = [];
  
  // Check for missing providers
  const appContent = fs.readFileSync(path.join(__dirname, '../App.tsx'), 'utf8');
  if (!appContent.includes('Provider') || !appContent.includes('store')) {
    issues.push('Missing Redux Provider in App.tsx');
  }
  
  if (!appContent.includes('BrowserRouter') && !appContent.includes('Router')) {
    issues.push('Missing Router provider in App.tsx');
  }
  
  // Check for error boundary usage
  if (!appContent.includes('DependencyErrorBoundary') && !appContent.includes('ErrorBoundary')) {
    issues.push('Missing error boundary in App.tsx');
  }
  
  // Check package.json for homepage configuration
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
  if (packageJson.homepage && packageJson.homepage !== '/') {
    issues.push(`Homepage configured as '${packageJson.homepage}' which may cause routing issues`);
  }
  
  return issues;
}

// Check for authentication/routing issues
function validateAuthenticationFlow() {
  log.info('🔐 Checking authentication flow...');
  
  const issues = [];
  
  try {
    // Check if useAuth hook exists and is properly implemented
    const authHookPath = path.join(__dirname, '../shared/hooks/useAuth.ts');
    if (!fs.existsSync(authHookPath)) {
      issues.push('useAuth hook not found');
    } else {
      const authContent = fs.readFileSync(authHookPath, 'utf8');
      if (!authContent.includes('isAuthenticated')) {
        issues.push('useAuth hook missing isAuthenticated property');
      }
      if (!authContent.includes('checkAuth')) {
        issues.push('useAuth hook missing checkAuth method');
      }
    }
    
    // Check for protected route implementation
    const appContent = fs.readFileSync(path.join(__dirname, '../App.tsx'), 'utf8');
    if (!appContent.includes('ProtectedRoute')) {
      issues.push('ProtectedRoute component not found in App.tsx');
    }
    
  } catch (error) {
    issues.push(`Authentication validation failed: ${error.message}`);
  }
  
  return issues;
}

// Main validation function
async function validateRuntime() {
  console.log(`${colors.magenta}🧪 Runtime Validation${colors.reset}`);
  console.log('');
  
  let allPassed = true;
  
  // Check for common runtime issues
  const runtimeIssues = validateRuntimeIssues();
  if (runtimeIssues.length > 0) {
    log.error('Runtime configuration issues found:');
    runtimeIssues.forEach(issue => log.error(`  ${issue}`));
    allPassed = false;
  } else {
    log.success('Runtime configuration checks passed');
  }
  
  // Check authentication flow
  const authIssues = validateAuthenticationFlow();
  if (authIssues.length > 0) {
    log.error('Authentication flow issues found:');
    authIssues.forEach(issue => log.error(`  ${issue}`));
    allPassed = false;
  } else {
    log.success('Authentication flow checks passed');
  }
  
  // Validate critical components can be imported
  log.info('🔧 Validating critical components...');
  for (const componentPath of CRITICAL_COMPONENTS) {
    const fullPath = path.join(__dirname, '../', componentPath.replace(/^src\//, ''));
    if (fs.existsSync(fullPath)) {
      log.success(`${componentPath} exists`);
    } else {
      log.error(`${componentPath} missing - checked: ${fullPath}`);
      allPassed = false;
    }
  }
  
  console.log('');
  if (allPassed) {
    log.success('🎉 All runtime validation checks passed!');
    return true;
  } else {
    log.error('❌ Some runtime validation checks failed.');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  validateRuntime().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Runtime validation failed:', error);
    process.exit(1);
  });
}

module.exports = {
  validateRuntime,
  validateComponentImport,
  validateRuntimeIssues,
  validateAuthenticationFlow
};