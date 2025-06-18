#!/usr/bin/env node

/**
 * Frontend Layer Testing Script
 * Tests all frontend layers including auth, theme, routing, and new features
 */

const http = require('http');
const https = require('https');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test configuration
const config = {
  frontend: 'http://localhost:3000',
  backend: 'http://localhost:3003',
  testUser: {
    email: 'demo@impactbot.com',
    password: 'DemoPass123!',
    firstName: 'Demo',
    lastName: 'User',
    organizationName: 'Demo Impact Organization'
  }
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            data: data
          };
          if (res.headers['content-type']?.includes('application/json')) {
            result.json = JSON.parse(data);
          }
          resolve(result);
        } catch (e) {
          resolve({ status: res.statusCode, data, error: e.message });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Test functions
async function testFrontendLoading() {
  console.log(`\n${colors.cyan}Testing Frontend Loading...${colors.reset}`);
  
  try {
    const response = await makeRequest(config.frontend);
    
    if (response.status === 200) {
      console.log(`${colors.green}✓${colors.reset} Frontend is accessible`);
      
      // Check for React app
      if (response.data.includes('root')) {
        console.log(`${colors.green}✓${colors.reset} React root element found`);
      }
      
      // Check title
      const titleMatch = response.data.match(/<title>(.*?)<\/title>/);
      if (titleMatch) {
        console.log(`${colors.green}✓${colors.reset} Page title: ${titleMatch[1]}`);
      }
      
      // Check for theme/styling
      if (response.data.includes('fonts.googleapis.com')) {
        console.log(`${colors.green}✓${colors.reset} Google Fonts loaded`);
      }
      
      return true;
    } else {
      console.log(`${colors.red}✗${colors.reset} Frontend returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Frontend error: ${error.message}`);
    return false;
  }
}

async function testBackendHealth() {
  console.log(`\n${colors.cyan}Testing Backend Health...${colors.reset}`);
  
  try {
    const response = await makeRequest(`${config.backend}/health`);
    
    if (response.status === 200) {
      console.log(`${colors.green}✓${colors.reset} Backend is healthy`);
      if (response.json) {
        console.log(`  Status: ${response.json.status || 'unknown'}`);
        if (response.json.checks) {
          console.log(`  Database: ${response.json.checks.database ? '✓' : '✗'}`);
          console.log(`  Cache: ${response.json.checks.cache ? '✓' : '✗'}`);
        }
      }
      return true;
    } else {
      console.log(`${colors.red}✗${colors.reset} Backend returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Backend error: ${error.message}`);
    return false;
  }
}

async function testAuthentication() {
  console.log(`\n${colors.cyan}Testing Authentication Flow...${colors.reset}`);
  
  // First try to register
  console.log('Attempting user registration...');
  
  const registerData = JSON.stringify({
    email: config.testUser.email,
    password: config.testUser.password,
    confirmPassword: config.testUser.password,
    firstName: config.testUser.firstName,
    lastName: config.testUser.lastName,
    organizationName: config.testUser.organizationName
  });
  
  try {
    const registerResponse = await makeRequest(`${config.backend}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(registerData)
      },
      body: registerData
    });
    
    if (registerResponse.status === 201 || registerResponse.status === 200) {
      console.log(`${colors.green}✓${colors.reset} User registered successfully`);
    } else if (registerResponse.json?.error?.includes('already exists')) {
      console.log(`${colors.yellow}⚠${colors.reset} User already exists (this is fine)`);
    } else {
      console.log(`${colors.red}✗${colors.reset} Registration failed: ${registerResponse.json?.error || registerResponse.data}`);
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Registration error: ${error.message}`);
  }
  
  // Now try to login
  console.log('\nAttempting login...');
  
  const loginData = JSON.stringify({
    email: config.testUser.email,
    password: config.testUser.password
  });
  
  try {
    const loginResponse = await makeRequest(`${config.backend}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      },
      body: loginData
    });
    
    if (loginResponse.status === 200 && loginResponse.json?.success) {
      console.log(`${colors.green}✓${colors.reset} Login successful`);
      console.log(`  Token: ${loginResponse.json.data?.token ? 'Received' : 'Missing'}`);
      console.log(`  User: ${loginResponse.json.data?.user?.email || 'Unknown'}`);
      return loginResponse.json.data?.token;
    } else {
      console.log(`${colors.red}✗${colors.reset} Login failed: ${loginResponse.json?.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Login error: ${error.message}`);
    return null;
  }
}

async function testProtectedRoutes(token) {
  console.log(`\n${colors.cyan}Testing Protected Routes...${colors.reset}`);
  
  if (!token) {
    console.log(`${colors.yellow}⚠${colors.reset} No token available, skipping protected route tests`);
    return;
  }
  
  const endpoints = [
    '/api/v1/auth/me',
    '/api/v1/foundation/status',
    '/api/v1/theory-of-change',
    '/api/v1/iris/categories'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${config.backend}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        console.log(`${colors.green}✓${colors.reset} ${endpoint} - Accessible`);
      } else {
        console.log(`${colors.red}✗${colors.reset} ${endpoint} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} ${endpoint} - Error: ${error.message}`);
    }
  }
}

async function testFrontendRoutes() {
  console.log(`\n${colors.cyan}Testing Frontend Routes...${colors.reset}`);
  
  const routes = [
    { path: '/', name: 'Home' },
    { path: '/login', name: 'Login' },
    { path: '/welcome', name: 'Welcome' },
    { path: '/quickstart', name: 'Quick Start' },
    { path: '/foundation', name: 'Foundation Dashboard' },
    { path: '/chat', name: 'Chat' }
  ];
  
  for (const route of routes) {
    try {
      const response = await makeRequest(`${config.frontend}${route.path}`);
      
      if (response.status === 200) {
        console.log(`${colors.green}✓${colors.reset} ${route.name} (${route.path}) - Accessible`);
      } else {
        console.log(`${colors.yellow}⚠${colors.reset} ${route.name} (${route.path}) - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} ${route.name} (${route.path}) - Error: ${error.message}`);
    }
  }
}

async function testNewFeatures() {
  console.log(`\n${colors.cyan}Testing New UX Features...${colors.reset}`);
  
  const features = [
    'Welcome Screen with mode selection',
    'Quick Start mode (10-minute flow)',
    'Personality selection (Coach/Advisor/Analyst)',
    'Foundation Readiness Widget',
    'Collaborative Foundation Builder',
    'Visual Dashboard entry point'
  ];
  
  console.log('Expected features implemented:');
  features.forEach(feature => {
    console.log(`  ${colors.blue}•${colors.reset} ${feature}`);
  });
  
  console.log('\nTo manually test these features:');
  console.log(`1. Navigate to ${colors.blue}http://localhost:3000/welcome${colors.reset}`);
  console.log(`2. Try the Quick Start mode for rapid foundation building`);
  console.log(`3. Test personality selection at /onboarding/personality`);
  console.log(`4. Check the enhanced Foundation Dashboard`);
}

// Main test runner
async function runTests() {
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}Impact Bot v2 - Frontend Layer Tests${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  
  // Test frontend loading
  const frontendOk = await testFrontendLoading();
  
  // Test backend health
  const backendOk = await testBackendHealth();
  
  // Test authentication
  let token = null;
  if (backendOk) {
    token = await testAuthentication();
  }
  
  // Test protected routes
  if (token) {
    await testProtectedRoutes(token);
  }
  
  // Test frontend routes
  if (frontendOk) {
    await testFrontendRoutes();
  }
  
  // Information about new features
  await testNewFeatures();
  
  // Summary
  console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}Test Summary${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  
  console.log(`\nFrontend: ${frontendOk ? colors.green + '✓ Running' : colors.red + '✗ Not running'} ${colors.reset}`);
  console.log(`Backend: ${backendOk ? colors.green + '✓ Running' : colors.red + '✗ Not running'} ${colors.reset}`);
  console.log(`Authentication: ${token ? colors.green + '✓ Working' : colors.red + '✗ Not working'} ${colors.reset}`);
  
  console.log(`\n${colors.yellow}Note:${colors.reset} Some routes may redirect to login if not authenticated.`);
  console.log(`This is expected behavior for protected routes.\n`);
}

// Run the tests
runTests().catch(console.error);