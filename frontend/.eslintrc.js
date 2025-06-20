module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Essential safety rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    
    // React specific rules
    'react-hooks/exhaustive-deps': 'warn'
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true
      }
    },
    {
      // Allow looser rules for module resolution utilities
      files: ['**/utils/moduleResolver.ts', '**/hooks/useSafeDependencies.ts', '**/scripts/*.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};