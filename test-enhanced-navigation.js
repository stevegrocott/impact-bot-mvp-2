/**
 * Enhanced Frontend Navigation Test
 * Tests the current UI navigation, routing, and port configurations
 * Detects environment mismatches between dev and production setups
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function checkPort(port, service) {
  try {
    const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/health 2>/dev/null || echo "000"`);
    const status = stdout.trim();
    return {
      port,
      service,
      status: status === '200' ? 'healthy' : status === '000' ? 'unreachable' : `error-${status}`,
      accessible: status === '200'
    };
  } catch (error) {
    return {
      port,
      service,
      status: 'unreachable',
      accessible: false,
      error: error.message
    };
  }
}

async function testPortConfiguration() {
  console.log('🔍 Port Configuration Analysis...\n');

  // Check expected ports
  const portChecks = await Promise.all([
    checkPort(3000, 'Frontend (React)'),
    checkPort(3001, 'Backend (Docker/Production)'),
    checkPort(3003, 'Backend (Local/Development)'),
    checkPort(5434, 'Database (Docker)'),
    checkPort(6380, 'Redis Cache (Docker)')
  ]);

  console.log('📋 Port Status Report:');
  portChecks.forEach(({ port, service, status, accessible }) => {
    const icon = accessible ? '✅' : status === 'unreachable' ? '❌' : '⚠️';
    console.log(`${icon} Port ${port}: ${service} - ${status}`);
  });

  // Analyze configuration
  console.log('\n🔧 Environment Analysis:');
  const frontendRunning = portChecks.find(p => p.port === 3000)?.accessible;
  const backendProd = portChecks.find(p => p.port === 3001)?.accessible;
  const backendDev = portChecks.find(p => p.port === 3003)?.accessible;

  if (frontendRunning && backendDev && !backendProd) {
    console.log('✅ Development Environment: Frontend + Backend running locally');
    console.log('ℹ️  Note: Port 3001 not used in local development (uses 3003)');
  } else if (frontendRunning && backendProd && !backendDev) {
    console.log('✅ Production Environment: Docker containers running');
  } else if (frontendRunning && !backendDev && !backendProd) {
    console.log('❌ Issue: Frontend running but no backend accessible');
  } else {
    console.log('⚠️ Mixed/Unknown Environment Configuration');
  }

  return { portChecks, frontendRunning, backendDev, backendProd };
}

async function testRoutes(backendPort) {
  console.log('\n🧭 Testing Frontend Routes...');
  
  const routes = [
    { path: '/', name: 'Foundation Dashboard' },
    { path: '/login', name: 'Login Page' },
    { path: '/organization', name: 'Organization Dashboard' },
    { path: '/chat', name: 'Chat Interface' },
    { path: '/indicators', name: 'Indicator Selection' },
    { path: '/reports', name: 'Reports Module' },
    { path: '/approvals', name: 'Approvals Module' }
  ];

  for (const route of routes) {
    try {
      const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000${route.path}`);
      const status = stdout.trim();
      const icon = status === '200' ? '✅' : '❌';
      console.log(`${icon} ${route.path} → ${route.name} (${status})`);
    } catch (error) {
      console.log(`❌ ${route.path} → ${route.name} (failed)`);
    }
  }
}

async function testAPIEndpoints(backendPort) {
  console.log('\n🔌 Testing Backend API Endpoints...');
  
  const endpoints = [
    '/health',
    '/api/v1/auth/me',
    '/api/v1/foundation/status',
    '/api/v1/organizations',
    '/api/v1/conversations'
  ];

  for (const endpoint of endpoints) {
    try {
      const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${backendPort}${endpoint}`);
      const status = stdout.trim();
      let icon = '❌';
      let note = '';
      
      if (endpoint === '/health' && status === '200') {
        icon = '✅';
        note = ' (healthy)';
      } else if (endpoint !== '/health' && status === '401') {
        icon = '✅';
        note = ' (protected - requires auth)';
      } else if (status === '200') {
        icon = '⚠️';
        note = ' (unexpected - should be protected)';
      }
      
      console.log(`${icon} ${endpoint} → Status ${status}${note}`);
    } catch (error) {
      console.log(`❌ ${endpoint} → Failed: ${error.message}`);
    }
  }
}

async function testFrontendAPIConfiguration() {
  console.log('\n🔗 Testing Frontend API Configuration...');
  
  try {
    // Test if frontend can actually reach the backend
    console.log('Testing actual frontend-to-backend connectivity...');
    
    // This simulates what the frontend would do for a login attempt
    const testEndpoints = [3001, 3003];
    for (const port of testEndpoints) {
      try {
        const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' http://localhost:${port}/api/v1/auth/login`);
        const status = stdout.trim();
        
        if (status === '400' || status === '401' || status === '422') {
          console.log(`✅ Port ${port}: API responds to auth requests (${status} - expected for invalid credentials)`);
        } else if (status === '200') {
          console.log(`⚠️ Port ${port}: API responds but accepts invalid credentials (${status})`);
        } else if (status === '000') {
          console.log(`❌ Port ${port}: Not accessible`);
        } else {
          console.log(`⚠️ Port ${port}: Unexpected response (${status})`);
        }
      } catch (error) {
        console.log(`❌ Port ${port}: Connection failed`);
      }
    }
    
  } catch (error) {
    console.log('⚠️ Could not test frontend API configuration');
  }
}

async function checkEnvironmentFiles() {
  console.log('\n📁 Environment Configuration Check...');
  
  try {
    // Check backend .env
    const { stdout: backendEnv } = await execAsync(`grep -E "PORT|3001|3003" /Users/shinytrap/projects/impact-bot-mvp-2/backend/.env 2>/dev/null || echo "No .env file"`);
    console.log('🔧 Backend .env PORT configuration:');
    console.log(`   ${backendEnv.trim()}`);
    
    // Check Docker configuration
    const { stdout: dockerPort } = await execAsync(`grep -A5 -B5 "PORT.*3001" /Users/shinytrap/projects/impact-bot-mvp-2/docker-compose.yml 2>/dev/null || echo "No Docker port config found"`);
    if (dockerPort.trim() !== "No Docker port config found") {
      console.log('🐳 Docker configuration expects backend on port 3001');
    }
    
    // Check for frontend API URL configuration
    const { stdout: frontendApi } = await execAsync(`grep -r "3001\\|3003" /Users/shinytrap/projects/impact-bot-mvp-2/frontend/src/ 2>/dev/null | head -3 || echo "No hardcoded API URLs found"`);
    if (frontendApi.trim() !== "No hardcoded API URLs found") {
      console.log('🎯 Frontend API URL references:');
      console.log(`   ${frontendApi.trim().replace(/\n/g, '\n   ')}`);
    }
    
  } catch (error) {
    console.log('⚠️ Could not read environment files');
  }
}

async function testJavaScriptErrors() {
  console.log('\n🔍 Testing for Common JavaScript Errors...');
  
  try {
    // Test organization route for specific errors
    const { stdout: orgContent } = await execAsync(`curl -s http://localhost:3000/organization | head -20`);
    
    if (orgContent.includes('<!DOCTYPE html>')) {
      console.log('✅ Organization route serves HTML content');
    } else {
      console.log('⚠️ Organization route may have issues');
    }
    
    // Check for common undefined/null errors in browser console
    console.log('📝 Common error checks:');
    console.log('   - If you see "Cannot read properties of undefined (reading \'includes\')" error:');
    console.log('     This has been fixed in useAuth.ts hasPermission function');
    console.log('   - Refresh the browser after restarting the backend');
    console.log('   - Check browser console (F12) for any remaining errors');
    
  } catch (error) {
    console.log('⚠️ Could not test for JavaScript errors');
  }
}

async function generateRecommendations(portChecks, frontendRunning, backendDev, backendProd) {
  console.log('\n💡 Recommendations:');
  
  if (frontendRunning && backendDev && !backendProd) {
    console.log('✅ Current setup is correct for development');
    console.log('   - Frontend: http://localhost:3000');
    console.log('   - Backend API: http://localhost:3003');
    console.log('   - Development mode working as expected');
  }
  
  if (!frontendRunning) {
    console.log('🚨 Frontend not running:');
    console.log('   - Run: cd frontend && npm start');
  }
  
  if (!backendDev && !backendProd) {
    console.log('🚨 Backend not running:');
    console.log('   - Development: cd backend && npm run dev');
    console.log('   - Production: docker-compose up');
  }
  
  console.log('\n📋 Pre-Testing Checklist for Future Work:');
  console.log('1. ✅ Check frontend accessible (port 3000)');
  console.log('2. ✅ Check backend API healthy (port 3003 for dev, 3001 for prod)');
  console.log('3. ✅ Verify route accessibility');
  console.log('4. ✅ Test API authentication endpoints');
  console.log('5. ✅ Confirm port configuration matches environment');
  console.log('6. ✅ Check for JavaScript errors in browser console');
}

async function runEnhancedNavigationTest() {
  console.log('🧪 Enhanced Navigation & Port Configuration Test\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Port Analysis
    const { portChecks, frontendRunning, backendDev, backendProd } = await testPortConfiguration();
    
    // Step 2: Environment Files Check
    await checkEnvironmentFiles();
    
    // Determine which backend port to use for testing
    const backendPort = backendDev ? 3003 : backendProd ? 3001 : null;
    
    if (frontendRunning) {
      // Step 3: Frontend Routes
      await testRoutes();
    } else {
      console.log('\n⚠️ Skipping route tests - frontend not accessible');
    }
    
    if (backendPort) {
      // Step 4: Backend APIs
      await testAPIEndpoints(backendPort);
      
      // Step 5: Frontend API Configuration
      await testFrontendAPIConfiguration();
    } else {
      console.log('\n⚠️ Skipping API tests - no backend accessible');
    }
    
    // Step 6: JavaScript Error Testing
    if (frontendRunning) {
      await testJavaScriptErrors();
    }
    
    // Step 7: Recommendations
    await generateRecommendations(portChecks, frontendRunning, backendDev, backendProd);
    
    console.log('\n='.repeat(60));
    console.log('🎉 Enhanced Navigation Test Complete!');
    
    // Summary
    const summary = {
      frontend: frontendRunning ? 'healthy' : 'down',
      backend: backendDev ? 'dev-healthy' : backendProd ? 'prod-healthy' : 'down',
      environment: backendDev ? 'development' : backendProd ? 'production' : 'unknown',
      allSystemsGo: frontendRunning && (backendDev || backendProd)
    };
    
    console.log('\n📊 System Status Summary:');
    console.log(`   Frontend: ${summary.frontend}`);
    console.log(`   Backend: ${summary.backend}`);
    console.log(`   Environment: ${summary.environment}`);
    console.log(`   Ready for testing: ${summary.allSystemsGo ? 'YES ✅' : 'NO ❌'}`);
    
  } catch (error) {
    console.error('❌ Enhanced navigation test failed:', error.message);
  }
}

// Run the test
runEnhancedNavigationTest();