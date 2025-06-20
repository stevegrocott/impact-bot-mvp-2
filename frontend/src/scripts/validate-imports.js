#!/usr/bin/env node

/**
 * Import Validation Script
 * Validates that all dynamic imports use safe patterns and have proper fallbacks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Patterns to check for unsafe dynamic imports
const UNSAFE_IMPORT_PATTERNS = [
  /await\s+import\s*\(\s*['"`](?!\.\.?\/|@?[a-z])/i,  // Direct module imports without safety
  /import\s*\(\s*['"`]framer-motion['"`]\s*\)/i,      // Direct framer-motion imports
  /import\s*\(\s*['"`]@emotion\/[\w-]+['"`]\s*\)/i,   // Direct emotion imports
  /import\s*\(\s*variable/i                          // Variable-based imports (risky)
];

// Patterns for safe imports (should be present when dynamic imports are used)
const SAFE_IMPORT_PATTERNS = [
  /moduleResolver|safeImportModule|loadFramerMotion/i,
  /try\s*\{[\s\S]*?import\s*\([\s\S]*?\}\s*catch/i,
  /\.then\s*\([\s\S]*?\)\s*\.catch/i
];

// Check if file uses safe import patterns
function checkFileForUnsafeImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // Check for unsafe patterns
  UNSAFE_IMPORT_PATTERNS.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      // Check if there are corresponding safe patterns
      const hasSafePatterns = SAFE_IMPORT_PATTERNS.some(safePattern => 
        content.match(safePattern)
      );

      if (!hasSafePatterns) {
        issues.push({
          type: 'unsafe_import',
          pattern: pattern.toString(),
          match: matches[0],
          line: content.substring(0, content.indexOf(matches[0])).split('\n').length,
          suggestion: 'Use moduleResolver.safeImportModule() or loadFramerMotion() instead'
        });
      }
    }
  });

  // Check for missing type declarations for dynamic imports (only for TypeScript files)
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    if (content.includes('import(') && !content.includes('ModuleLoadResult')) {
      const importMatch = content.match(/import\s*\([^)]+\)/);
      if (importMatch) {
        issues.push({
          type: 'missing_types',
          match: importMatch[0],
          line: content.substring(0, content.indexOf(importMatch[0])).split('\n').length,
          suggestion: 'Import ModuleLoadResult type and use proper typing'
        });
      }
    }
  }

  return issues;
}

// Recursively find all TypeScript/JavaScript files
function findSourceFiles(dir, files = []) {
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules, build, and test directories
      if (!['node_modules', 'build', 'dist', '.git'].includes(entry)) {
        findSourceFiles(fullPath, files);
      }
    } else if (stat.isFile()) {
      // Include TypeScript and JavaScript files, but exclude standard CRA files and tests
      if (/\.(ts|tsx|js|jsx)$/.test(entry) && 
          !entry.includes('.test.') && 
          !entry.includes('.spec.') &&
          !['reportWebVitals.ts', 'setupTests.ts', 'react-app-env.d.ts'].includes(entry)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

// Main validation function
function validateImports() {
  log.info('🔍 Validating dynamic imports and module resolution...');
  
  const srcDir = path.join(__dirname, '../');
  const sourceFiles = findSourceFiles(srcDir);
  
  let totalIssues = 0;
  const fileIssues = {};

  // Check each file
  sourceFiles.forEach(filePath => {
    try {
      const issues = checkFileForUnsafeImports(filePath);
      if (issues.length > 0) {
        const relativePath = path.relative(srcDir, filePath);
        fileIssues[relativePath] = issues;
        totalIssues += issues.length;
      }
    } catch (error) {
      log.warning(`Failed to check ${filePath}: ${error.message}`);
    }
  });

  // Report results
  if (totalIssues === 0) {
    log.success('All dynamic imports are properly handled!');
    return true;
  }

  log.error(`Found ${totalIssues} import-related issues:`);
  console.log('');

  Object.entries(fileIssues).forEach(([file, issues]) => {
    console.log(`${colors.cyan}📁 ${file}${colors.reset}`);
    
    issues.forEach(issue => {
      console.log(`  ${colors.red}✗${colors.reset} Line ${issue.line}: ${issue.type}`);
      console.log(`    ${colors.yellow}Found:${colors.reset} ${issue.match}`);
      console.log(`    ${colors.green}Suggestion:${colors.reset} ${issue.suggestion}`);
      console.log('');
    });
  });

  return false;
}

// Additional checks for TypeScript configuration
function validateTypeScriptConfig() {
  log.info('📋 Checking TypeScript configuration...');
  
  const tsconfigPath = path.join(__dirname, '../../tsconfig.json');
  
  if (!fs.existsSync(tsconfigPath)) {
    log.error('tsconfig.json not found');
    return false;
  }

  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    // Check for proper module resolution
    const compilerOptions = tsconfig.compilerOptions || {};
    
    if (compilerOptions.moduleResolution !== 'node') {
      log.warning('Consider setting moduleResolution to "node" for better compatibility');
    }

    if (!compilerOptions.esModuleInterop) {
      log.warning('Consider enabling esModuleInterop for better module compatibility');
    }

    if (!tsconfig.include || !tsconfig.include.includes('src/types/**/*.d.ts')) {
      log.warning('Type declarations directory should be included in tsconfig.json');
    }

    log.success('TypeScript configuration looks good');
    return true;
  } catch (error) {
    log.error(`Invalid tsconfig.json: ${error.message}`);
    return false;
  }
}

// Check for required dependency resolver files
function validateDependencyInfrastructure() {
  log.info('🔧 Checking dependency resolution infrastructure...');
  
  const requiredFiles = [
    'utils/moduleResolver.ts',
    'hooks/useSafeDependencies.ts',
    'types/framer-motion.d.ts',
    'components/SafeAnimationWrapper.tsx'
  ];

  let allPresent = true;

  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '../', file);
    if (fs.existsSync(filePath)) {
      log.success(`${file} ✓`);
    } else {
      log.error(`Missing: ${file}`);
      allPresent = false;
    }
  });

  return allPresent;
}

// Main execution
function main() {
  console.log(`${colors.magenta}🛡️  Import Safety Validator${colors.reset}`);
  console.log('');

  const results = [
    validateDependencyInfrastructure(),
    validateTypeScriptConfig(),
    validateImports()
  ];

  const allPassed = results.every(result => result);

  console.log('');
  if (allPassed) {
    log.success('🎉 All import validation checks passed!');
    process.exit(0);
  } else {
    log.error('❌ Some validation checks failed. Please fix the issues above.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateImports,
  validateTypeScriptConfig,
  validateDependencyInfrastructure
};