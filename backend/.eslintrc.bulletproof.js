/**
 * Bulletproof ESLint Configuration
 * Prevents TypeScript errors through strict linting rules
 * Enforces the coding standards established in TYPESCRIPT_CODING_STANDARDS.md
 */

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'security',
    'promise',
    'node'
  ],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:security/recommended',
    'plugin:promise/recommended',
    'plugin:node/recommended'
  ],
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      }
    }
  },
  rules: {
    // === TypeScript Error Prevention ===
    
    // Strict Type Safety
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    
    // Null/Undefined Safety
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-unnecessary-condition': 'error',
    
    // Interface and Type Completeness
    '@typescript-eslint/no-empty-interface': 'error',
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/consistent-type-exports': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
    
    // Promise and Async Safety
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/require-await': 'error',
    'promise/catch-or-return': 'error',
    'promise/no-nesting': 'error',
    'promise/no-return-wrap': 'error',
    
    // Code Quality
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/prefer-readonly-parameter-types': 'off', // Too strict for Express
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/no-redundant-type-constituents': 'error',
    
    // === Express/Node.js Specific ===
    
    // Import Safety
    'import/no-unresolved': 'error',
    'import/no-duplicates': 'error',
    'import/order': [
      'error',
      {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }
    ],
    
    // Security
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-object-injection': 'error',
    'security/detect-possible-timing-attacks': 'error',
    
    // === Project-Specific Rules ===
    
    // Custom rules for our patterns
    'no-console': ['error', { allow: ['warn', 'error'] }],
    
    // Prisma Safety
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }
    ],
    
    // === Overrides for Specific Cases ===
    
    // Allow require in config files
    'node/no-unpublished-require': 'off',
    'node/no-missing-import': 'off', // Handled by TypeScript
    
    // Express middleware patterns
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        'checksVoidReturn': false // Express middleware can return promises
      }
    ]
  },
  
  overrides: [
    {
      // Configuration files
      files: ['*.config.js', '*.config.ts', '.eslintrc.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'node/no-unpublished-require': 'off'
      }
    },
    {
      // Test files
      files: ['**/*.test.ts', '**/*.spec.ts', '**/test/**/*.ts'],
      env: {
        jest: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Tests may need any for mocking
        '@typescript-eslint/no-non-null-assertion': 'off', // Tests can be more liberal
        'security/detect-object-injection': 'off' // Test data may trigger false positives
      }
    },
    {
      // Migration and seed files
      files: ['**/migrations/**/*.ts', '**/seeds/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'security/detect-object-injection': 'off'
      }
    }
  ],
  
  // Custom rule definitions for our patterns
  globals: {
    NodeJS: true,
    Express: true
  }
};