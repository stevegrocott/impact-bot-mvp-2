#!/usr/bin/env node

/**
 * React Hooks Validation Script
 * Detects conditional hook usage and other React Hooks violations
 */

const fs = require('fs');
const path = require('path');

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

// Pattern definitions for hook violations
const HOOK_PATTERNS = {
  // Detect hook calls inside conditionals
  conditionalHooks: {
    pattern: /(if\s*\([^)]+\)\s*{[^}]*use[A-Z][a-zA-Z]*\s*\(|try\s*{[^}]*use[A-Z][a-zA-Z]*\s*\(|use[A-Z][a-zA-Z]*\s*\([^)]*\)\s*;?\s*}\s*catch)/g,
    description: 'Hook called conditionally (inside if, try-catch, etc.)'
  },
  
  // Detect hooks called after early returns
  hooksAfterReturn: {
    pattern: /(return\s+[^;]+;[\s\S]*use[A-Z][a-zA-Z]*\s*\()/g,
    description: 'Hook called after return statement'
  },
  
  // Detect hooks in loops
  hooksInLoops: {
    pattern: /(for\s*\([^)]*\)\s*{[^}]*use[A-Z][a-zA-Z]*\s*\(|while\s*\([^)]+\)\s*{[^}]*use[A-Z][a-zA-Z]*\s*\(|\.map\s*\([^)]*use[A-Z][a-zA-Z]*)/g,
    description: 'Hook called inside loop'
  },
  
  // Detect hooks inside nested functions
  hooksInNestedFunctions: {
    pattern: /(function\s+\w+\s*\([^)]*\)\s*{[^}]*use[A-Z][a-zA-Z]*\s*\(|const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{[^}]*use[A-Z][a-zA-Z]*\s*\()/g,
    description: 'Hook called inside nested function'
  },

  // Detect require() with hooks - specific to our debug file issue
  requireWithHooks: {
    pattern: /(require\s*\([^)]*\)[^;]*;[\s\S]*?use[A-Z][a-zA-Z]*\s*\()/g,
    description: 'Hook called after conditional require() - use proper imports instead'
  }
};

function analyzeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const violations = [];

  // Skip files that don't contain React components
  if (!content.includes('React') && !content.includes('use')) {
    return null;
  }

  Object.entries(HOOK_PATTERNS).forEach(([violationType, { pattern, description }]) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Find line number
        const beforeMatch = content.substring(0, content.indexOf(match));
        const lineNumber = beforeMatch.split('\n').length;
        
        violations.push({
          type: violationType,
          line: lineNumber,
          description,
          code: match.trim().substring(0, 100) + (match.length > 100 ? '...' : ''),
          severity: violationType === 'conditionalHooks' || violationType === 'requireWithHooks' ? 'error' : 'warning'
        });
      });
    }
  });

  return violations.length > 0 ? { file: fileName, path: filePath, violations } : null;
}

function analyzeDirectory(dirPath, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const results = [];
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and build directories
        if (!['node_modules', 'build', 'dist', '.git'].includes(item)) {
          walkDir(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        const analysis = analyzeFile(fullPath);
        if (analysis) {
          results.push(analysis);
        }
      }
    }
  }
  
  walkDir(dirPath);
  return results;
}

function generateFixSuggestions(violations) {
  const fixes = [];
  
  violations.forEach(violation => {
    violation.violations.forEach(v => {
      switch (v.type) {
        case 'conditionalHooks':
        case 'requireWithHooks':
          fixes.push({
            file: violation.file,
            line: v.line,
            issue: v.description,
            solution: 'Move hook calls to the top level of the component. Use proper imports instead of require().',
            example: `
// ❌ Wrong:
export const Component = () => {
  try {
    const { useHook } = require('./hooks');
    const data = useHook();
    return <div>{data}</div>;
  } catch (error) {
    return <div>Error</div>;
  }
};

// ✅ Correct:
import { useHook } from './hooks';

const ComponentInner = () => {
  const data = useHook();
  return <div>{data}</div>;
};

export const Component = () => {
  try {
    return <ComponentInner />;
  } catch (error) {
    return <div>Error</div>;
  }
};`
          });
          break;
          
        case 'hooksAfterReturn':
          fixes.push({
            file: violation.file,
            line: v.line,
            issue: v.description,
            solution: 'Move all hook calls to the top of the component, before any early returns.',
            example: `
// ❌ Wrong:
if (condition) return <div>Early return</div>;
const data = useHook(); // This will never be reached

// ✅ Correct:
const data = useHook();
if (condition) return <div>Early return</div>;`
          });
          break;
          
        case 'hooksInLoops':
          fixes.push({
            file: violation.file,
            line: v.line,
            issue: v.description,
            solution: 'Move hook calls outside of loops. Use arrays and multiple hook calls if needed.',
            example: `
// ❌ Wrong:
items.map(item => {
  const data = useHook(item.id);
  return <div>{data}</div>;
});

// ✅ Correct:
const allData = items.map(item => item.id).map(id => useHook(id));
return items.map((item, index) => <div>{allData[index]}</div>);`
          });
          break;
      }
    });
  });
  
  return fixes;
}

function validateReactHooks() {
  console.log(`${colors.magenta}⚛️  React Hooks Validation${colors.reset}`);
  console.log('');
  
  const srcPath = path.join(__dirname, '../');
  const violations = analyzeDirectory(srcPath);
  
  if (violations.length === 0) {
    log.success('🎉 No React Hooks violations found!');
    return true;
  }
  
  log.error(`Found ${violations.length} files with React Hooks violations:`);
  console.log('');
  
  let totalErrors = 0;
  let totalWarnings = 0;
  
  violations.forEach(violation => {
    console.log(`${colors.cyan}📁 ${violation.file}${colors.reset} (${violation.path})`);
    
    violation.violations.forEach(v => {
      const icon = v.severity === 'error' ? '❌' : '⚠️';
      const color = v.severity === 'error' ? colors.red : colors.yellow;
      
      console.log(`  ${icon} Line ${v.line}: ${color}${v.type}${colors.reset}`);
      console.log(`    ${colors.yellow}Issue:${colors.reset} ${v.description}`);
      console.log(`    ${colors.blue}Code:${colors.reset} ${v.code}`);
      console.log('');
      
      if (v.severity === 'error') totalErrors++;
      else totalWarnings++;
    });
  });
  
  // Generate and display fix suggestions
  const fixes = generateFixSuggestions(violations);
  if (fixes.length > 0) {
    log.info('🔧 Fix suggestions:');
    console.log('');
    
    fixes.slice(0, 3).forEach((fix, index) => {
      console.log(`${index + 1}. ${fix.file}:${fix.line} - ${fix.issue}`);
      console.log(`   ${colors.green}Solution:${colors.reset} ${fix.solution}`);
      if (fix.example) {
        console.log(`${colors.blue}${fix.example}${colors.reset}`);
      }
      console.log('');
    });
  }
  
  console.log(`${colors.red}Errors: ${totalErrors}${colors.reset}, ${colors.yellow}Warnings: ${totalWarnings}${colors.reset}`);
  console.log('');
  log.error('❌ React Hooks validation failed. Please fix the violations above.');
  
  return false;
}

// Run if called directly
if (require.main === module) {
  const success = validateReactHooks();
  process.exit(success ? 0 : 1);
}

module.exports = {
  validateReactHooks,
  analyzeFile,
  analyzeDirectory
};