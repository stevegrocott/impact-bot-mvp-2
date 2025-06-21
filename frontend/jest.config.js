module.exports = {
  preset: 'react-scripts',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  
  // Module name mapping for path resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^../store/slices/(.*)$': '<rootDir>/src/shared/store/$1',
    '^../../store/slices/(.*)$': '<rootDir>/src/shared/store/$1',
    '^../shared/(.*)$': '<rootDir>/src/shared/$1',
    '^../../shared/(.*)$': '<rootDir>/src/shared/$1',
    '^../components/(.*)$': '<rootDir>/src/components/$1',
    '^../../components/(.*)$': '<rootDir>/src/components/$1',
    '^../layouts/(.*)$': '<rootDir>/src/layouts/$1',
    '^../../layouts/(.*)$': '<rootDir>/src/layouts/$1'
  },
  
  // Transform ignore patterns for ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(axios|@testing-library|framer-motion|lucide-react)/)'
  ],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/setupTests.ts',
    '!src/react-app-env.d.ts',
    '!src/debug/**/*',
    '!src/test-scripts/**/*',
    '!src/scripts/**/*'
  ],
  
  // Timeout for tests
  testTimeout: 10000
};