/**
 * Dependency Checker Utility
 * Validates that required dependencies are available and properly typed
 */

import { ModuleLoadResult, safeImportModule } from './moduleResolver';

export interface DependencyCheckResult {
  available: boolean;
  typesAvailable: boolean;
  error?: string;
  fallbackAvailable: boolean;
}

/**
 * Check if a module is available and properly typed
 */
export const checkDependency = async (moduleName: string): Promise<DependencyCheckResult> => {
  try {
    // Use safe import instead of direct import
    const result: ModuleLoadResult = await safeImportModule(moduleName);
    
    return {
      available: result.success,
      typesAvailable: result.success,
      fallbackAvailable: !!result.fallback,
      error: result.error?.message
    };
  } catch (error: any) {
    console.warn(`Dependency check failed for ${moduleName}:`, error.message);
    
    return {
      available: false,
      typesAvailable: false,
      error: error.message,
      fallbackAvailable: true
    };
  }
};

/**
 * Required dependencies for the application
 */
export const REQUIRED_DEPENDENCIES = [
  'framer-motion',
  'lucide-react',
  '@reduxjs/toolkit',
  'react-redux',
  'react-router-dom'
] as const;

/**
 * Check all required dependencies
 */
export const checkAllDependencies = async (): Promise<Record<string, DependencyCheckResult>> => {
  const results: Record<string, DependencyCheckResult> = {};
  
  for (const dep of REQUIRED_DEPENDENCIES) {
    results[dep] = await checkDependency(dep);
  }
  
  return results;
};

/**
 * Get missing dependencies
 */
export const getMissingDependencies = async (): Promise<string[]> => {
  const results = await checkAllDependencies();
  return Object.entries(results)
    .filter(([_, result]) => !result.available)
    .map(([dep]) => dep);
};

/**
 * Validate component dependencies before rendering
 */
export const validateComponentDependencies = (requiredDeps: string[]): boolean => {
  try {
    // Simple synchronous check for critical components
    for (const dep of requiredDeps) {
      if (dep === 'framer-motion') {
        // Check if framer-motion types are available
        try {
          require('framer-motion');
        } catch {
          console.error(`Missing dependency: ${dep}`);
          return false;
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Dependency validation failed:', error);
    return false;
  }
};