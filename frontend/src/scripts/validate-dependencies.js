#!/usr/bin/env node

/**
 * Pre-build Dependency Validation Script
 * Runs before builds to ensure all required dependencies are available
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`)
};

// Required dependencies with their minimum versions
const REQUIRED_DEPENDENCIES = {
  'framer-motion': '^12.0.0',
  'lucide-react': '^0.400.0',
  '@reduxjs/toolkit': '^2.0.0',
  'react-redux': '^9.0.0',
  'react-router-dom': '^7.0.0'
};

// Optional dependencies that should have fallbacks
const OPTIONAL_DEPENDENCIES = {
  'recharts': '^2.0.0'
};

/**
 * Check if a package is installed
 */
function isPackageInstalled(packageName) {
  try {
    const packagePath = path.join(process.cwd(), 'node_modules', packageName, 'package.json');
    return fs.existsSync(packagePath);
  } catch (error) {
    return false;
  }
}

/**
 * Get installed package version
 */
function getPackageVersion(packageName) {
  try {
    const packagePath = path.join(process.cwd(), 'node_modules', packageName, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    return null;
  }
}

/**
 * Check if TypeScript definitions are available
 */
function hasTypeDefinitions(packageName) {
  try {
    // Check if package has built-in types
    const packagePath = path.join(process.cwd(), 'node_modules', packageName, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (packageJson.types || packageJson.typings) {
      return { hasTypes: true, source: 'built-in' };
    }
    
    // Check for @types package
    const typesPackagePath = path.join(process.cwd(), 'node_modules', `@types/${packageName}`, 'package.json');
    if (fs.existsSync(typesPackagePath)) {
      return { hasTypes: true, source: '@types' };
    }
    
    return { hasTypes: false, source: null };
  } catch (error) {
    return { hasTypes: false, source: null };
  }
}

/**
 * Validate dependencies
 */
async function validateDependencies() {
  log.info('🔍 Validating dependencies...');
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check required dependencies
  log.info('\n📋 Checking required dependencies:');
  for (const [packageName, version] of Object.entries(REQUIRED_DEPENDENCIES)) {
    const isInstalled = isPackageInstalled(packageName);
    const installedVersion = getPackageVersion(packageName);
    const typeInfo = hasTypeDefinitions(packageName);
    
    if (!isInstalled) {
      log.error(`${packageName} is not installed`);
      hasErrors = true;
    } else {
      log.success(`${packageName}@${installedVersion}`);
      
      if (!typeInfo.hasTypes) {
        log.warning(`  No TypeScript definitions found for ${packageName}`);
        hasWarnings = true;
      } else {
        log.info(`  TypeScript definitions: ${typeInfo.source}`);
      }
    }
  }
  
  // Check optional dependencies
  log.info('\n📦 Checking optional dependencies:');
  for (const [packageName, version] of Object.entries(OPTIONAL_DEPENDENCIES)) {
    const isInstalled = isPackageInstalled(packageName);
    const installedVersion = getPackageVersion(packageName);
    
    if (!isInstalled) {
      log.warning(`${packageName} is not installed (optional)`);
    } else {
      log.success(`${packageName}@${installedVersion}`);
    }
  }
  
  // Check for framer-motion specifically (common issue)
  log.info('\n🎭 Special check for framer-motion:');
  if (isPackageInstalled('framer-motion')) {
    const version = getPackageVersion('framer-motion');
    log.success(`framer-motion@${version} is properly installed`);
    
    // Check if the types are working
    try {
      const framerPath = path.join(process.cwd(), 'node_modules', 'framer-motion', 'dist', 'index.d.ts');
      if (fs.existsSync(framerPath)) {
        log.success('framer-motion TypeScript definitions are available');
      } else {
        log.warning('framer-motion types may not be properly configured');
        hasWarnings = true;
      }
    } catch (error) {
      log.warning('Could not verify framer-motion type definitions');
      hasWarnings = true;
    }
  } else {
    log.error('framer-motion is not installed - this will cause compilation errors');
    hasErrors = true;
  }
  
  // Summary
  log.info('\n📊 Validation Summary:');
  if (hasErrors) {
    log.error('❌ Some required dependencies are missing');
    log.info('   Run: npm install');
    process.exit(1);
  } else if (hasWarnings) {
    log.warning('⚠️  Some warnings found, but build should succeed');
    log.info('   Consider installing missing type definitions');
  } else {
    log.success('✅ All dependencies are properly configured');
  }
  
  return !hasErrors;
}

/**
 * Install missing dependencies
 */
async function installMissingDependencies() {
  log.info('🔧 Installing missing dependencies...');
  
  const missingDeps = [];
  
  for (const packageName of Object.keys(REQUIRED_DEPENDENCIES)) {
    if (!isPackageInstalled(packageName)) {
      missingDeps.push(packageName);
    }
  }
  
  if (missingDeps.length > 0) {
    const { execSync } = require('child_process');
    
    try {
      log.info(`Installing: ${missingDeps.join(', ')}`);
      execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
      log.success('Dependencies installed successfully');
    } catch (error) {
      log.error('Failed to install dependencies automatically');
      log.info('Please run: npm install');
      process.exit(1);
    }
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--install')) {
    installMissingDependencies().then(() => validateDependencies());
  } else {
    validateDependencies();
  }
}

module.exports = { validateDependencies, installMissingDependencies };