#!/usr/bin/env node

/**
 * Runtime Error Detection Script
 * Identifies specific components causing runtime errors
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

// Check for common problematic patterns
function analyzeComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const fileName = path.basename(filePath);

  // Check for framer-motion imports without safe wrappers
  if (content.includes('framer-motion') && !content.includes('useFramerMotionSafe')) {
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('framer-motion') && !line.includes('useFramerMotionSafe')) {
        issues.push({
          type: 'unsafe_framer_motion',
          line: index + 1,
          content: line.trim(),
          suggestion: 'Use useFramerMotionSafe hook instead of direct framer-motion imports'
        });
      }
    });
  }

  // Check for potential null/undefined access issues
  const nullAccessPatterns = [
    /\w+\.\w+\.\w+(?!\?)/g,  // obj.prop.subprop without optional chaining
    /\w+\[\w+\]\.\w+(?!\?)/g  // obj[key].prop without optional chaining
  ];

  nullAccessPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (!match.includes('?.') && !match.includes('console.') && !match.includes('window.')) {
          const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length;
          issues.push({
            type: 'potential_null_access',
            line: lineNumber,
            content: match,
            suggestion: 'Consider using optional chaining (?.) to prevent null/undefined errors'
          });
        }
      });
    }
  });

  // Check for missing error boundaries around dynamic content
  if (content.includes('useEffect') && !content.includes('try') && !content.includes('catch')) {
    issues.push({
      type: 'missing_error_handling',
      line: 'multiple',
      content: 'useEffect without error handling',
      suggestion: 'Add try-catch blocks around async operations in useEffect'
    });
  }

  // Check for missing imports
  const importLines = content.split('\n').filter(line => line.includes('import'));
  const usagePatterns = [
    { pattern: /React\./g, import: 'React' },
    { pattern: /useState|useEffect|useCallback|useMemo/g, import: 'React hooks' },
    { pattern: /useSelector|useDispatch/g, import: 'react-redux' },
    { pattern: /useNavigate|useLocation|Link/g, import: 'react-router-dom' }
  ];

  usagePatterns.forEach(({ pattern, import: requiredImport }) => {
    if (content.match(pattern)) {
      const hasImport = importLines.some(line => 
        line.includes(requiredImport.toLowerCase().replace(' ', '-')) ||
        line.includes(requiredImport.toLowerCase().replace(' ', ''))
      );
      if (!hasImport && requiredImport !== 'React hooks') {
        issues.push({
          type: 'missing_import',
          line: 1,
          content: `Usage of ${requiredImport} without import`,
          suggestion: `Add import for ${requiredImport}`
        });
      }
    }
  });

  return issues.length > 0 ? { file: fileName, issues } : null;
}

// Analyze critical path components
function analyzeCriticalPath() {
  log.info('🔍 Analyzing critical path components for runtime errors...');
  
  const criticalComponents = [
    'src/App.tsx',
    'src/pages/FoundationDashboard.tsx',
    'src/layouts/AppLayout.tsx',
    'src/components/FoundationReadinessWidget.tsx',
    'src/components/CollaborativeFoundationBuilder.tsx',
    'src/shared/hooks/useAuth.ts',
    'src/shared/store/store.ts',
    'src/shared/store/authSlice.ts'
  ];

  const problems = [];

  criticalComponents.forEach(componentPath => {
    const fullPath = path.join(__dirname, '../', componentPath.replace(/^src\//, ''));
    if (fs.existsSync(fullPath)) {
      const analysis = analyzeComponent(fullPath);
      if (analysis) {
        problems.push(analysis);
      }
    } else {
      problems.push({
        file: componentPath,
        issues: [{
          type: 'missing_file',
          line: 'N/A',
          content: 'File does not exist',
          suggestion: 'Ensure file exists and path is correct'
        }]
      });
    }
  });

  return problems;
}

// Check for specific error patterns in logs
function checkForKnownErrorPatterns() {
  log.info('🔍 Checking for known error patterns...');
  
  const knownIssues = [];

  // Check if dependency error boundary is properly set up
  const appPath = path.join(__dirname, '../App.tsx');
  if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf8');
    if (!appContent.includes('DependencyErrorBoundary')) {
      knownIssues.push({
        type: 'missing_error_boundary',
        description: 'App.tsx missing DependencyErrorBoundary wrapper',
        fix: 'Wrap your app content with DependencyErrorBoundary'
      });
    }
  }

  // Check for homepage configuration issues
  const packageJsonPath = path.join(__dirname, '../../package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.homepage && packageJson.homepage !== '/') {
      knownIssues.push({
        type: 'homepage_config',
        description: `Homepage is set to '${packageJson.homepage}' which may cause routing issues`,
        fix: 'Remove homepage field or set it to "/"'
      });
    }
  }

  return knownIssues;
}

// Generate fix suggestions
function generateFixSuggestions(problems) {
  log.info('💡 Generating fix suggestions...');
  
  const fixes = [];

  problems.forEach(problem => {
    problem.issues.forEach(issue => {
      switch (issue.type) {
        case 'unsafe_framer_motion':
          fixes.push({
            file: problem.file,
            fix: `Replace framer-motion import with useFramerMotionSafe hook in ${problem.file}:${issue.line}`,
            priority: 'high',
            code: `
// Replace this:
import { motion } from 'framer-motion';

// With this:
import { useFramerMotionSafe } from '../hooks/useSafeDependencies';
const { motion } = useFramerMotionSafe();
`
          });
          break;
          
        case 'potential_null_access':
          fixes.push({
            file: problem.file,
            fix: `Add optional chaining in ${problem.file}:${issue.line}`,
            priority: 'medium',
            code: `
// Replace: ${issue.content}
// With: ${issue.content.replace(/\./g, '?.')}
`
          });
          break;
          
        case 'missing_error_handling':
          fixes.push({
            file: problem.file,
            fix: `Add error handling to useEffect in ${problem.file}`,
            priority: 'high',
            code: `
useEffect(() => {
  const loadData = async () => {
    try {
      // your async code here
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };
  loadData();
}, []);
`
          });
          break;
      }
    });
  });

  return fixes;
}

// Main function
function detectRuntimeErrors() {
  console.log(`${colors.magenta}🐛 Runtime Error Detection${colors.reset}`);
  console.log('');

  const problems = analyzeCriticalPath();
  const knownIssues = checkForKnownErrorPatterns();
  const fixes = generateFixSuggestions(problems);

  if (problems.length === 0 && knownIssues.length === 0) {
    log.success('🎉 No runtime errors detected in critical path!');
    return true;
  }

  if (problems.length > 0) {
    log.error(`Found ${problems.length} components with potential issues:`);
    console.log('');

    problems.forEach(problem => {
      console.log(`${colors.cyan}📁 ${problem.file}${colors.reset}`);
      problem.issues.forEach(issue => {
        console.log(`  ${colors.red}✗${colors.reset} Line ${issue.line}: ${issue.type}`);
        console.log(`    ${colors.yellow}Found:${colors.reset} ${issue.content}`);
        console.log(`    ${colors.green}Suggestion:${colors.reset} ${issue.suggestion}`);
        console.log('');
      });
    });
  }

  if (knownIssues.length > 0) {
    log.error('Known configuration issues:');
    knownIssues.forEach(issue => {
      console.log(`  ${colors.red}✗${colors.reset} ${issue.type}: ${issue.description}`);
      console.log(`    ${colors.green}Fix:${colors.reset} ${issue.fix}`);
      console.log('');
    });
  }

  if (fixes.length > 0) {
    log.info('🔧 Recommended fixes:');
    fixes.slice(0, 5).forEach((fix, index) => {
      console.log(`${index + 1}. ${fix.fix} (${fix.priority} priority)`);
      if (fix.code) {
        console.log(`${colors.blue}${fix.code}${colors.reset}`);
      }
      console.log('');
    });
  }

  return false;
}

// Run if called directly
if (require.main === module) {
  detectRuntimeErrors().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Error detection failed:', error);
    process.exit(1);
  });
}

module.exports = {
  detectRuntimeErrors,
  analyzeComponent,
  analyzeCriticalPath
};