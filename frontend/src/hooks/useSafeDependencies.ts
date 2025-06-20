/**
 * Safe Dependencies Hook
 * Provides safe loading of optional dependencies with proper TypeScript support
 */

import { useState, useEffect } from 'react';
import { loadFramerMotion, getCachedModule, ModuleLoadResult } from '../utils/moduleResolver';
import { checkDependency, DependencyCheckResult } from '../utils/dependencyChecker';

interface UseSafeDependenciesResult {
  isLoading: boolean;
  dependencies: Record<string, DependencyCheckResult>;
  hasAllDependencies: boolean;
  missingDependencies: string[];
}

interface SafeDependencyState {
  isLoading: boolean;
  isAvailable: boolean;
  error: string | null;
}

/**
 * Hook to safely check and handle dependencies
 */
export const useSafeDependencies = (requiredDeps: string[]): UseSafeDependenciesResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [dependencies, setDependencies] = useState<Record<string, DependencyCheckResult>>({});

  useEffect(() => {
    const checkDependencies = async () => {
      setIsLoading(true);
      const results: Record<string, DependencyCheckResult> = {};

      for (const dep of requiredDeps) {
        results[dep] = await checkDependency(dep);
      }

      setDependencies(results);
      setIsLoading(false);
    };

    checkDependencies();
  }, [requiredDeps.join(',')]);

  const hasAllDependencies = Object.values(dependencies).every(dep => dep.available);
  const missingDependencies = Object.entries(dependencies)
    .filter(([_, result]) => !result.available)
    .map(([dep]) => dep);

  return {
    isLoading,
    dependencies,
    hasAllDependencies,
    missingDependencies
  };
};

/**
 * Hook specifically for framer-motion with proper TypeScript support and fallbacks
 */
export const useFramerMotionSafe = () => {
  const [components, setComponents] = useState<any>(null);
  const [state, setState] = useState<SafeDependencyState>({
    isLoading: true,
    isAvailable: false,
    error: null
  });

  useEffect(() => {
    const loadComponents = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const result: ModuleLoadResult = await getCachedModule('framer-motion', loadFramerMotion);
        
        if (result.success && result.module) {
          setComponents(result.module);
          setState({
            isLoading: false,
            isAvailable: true,
            error: null
          });
        } else {
          // Use fallback components
          setComponents(result.fallback || result.module);
          setState({
            isLoading: false,
            isAvailable: false,
            error: result.error?.message || 'Framer Motion not available'
          });
        }
      } catch (error: any) {
        console.error('Unexpected error loading Framer Motion:', error);
        setState({
          isLoading: false,
          isAvailable: false,
          error: error.message
        });
      }
    };

    loadComponents();
  }, []);

  return {
    motion: components?.motion || null,
    AnimatePresence: components?.AnimatePresence || null,
    useMotionValue: components?.useMotionValue || (() => ({ get: () => null, set: () => {}, subscribe: () => () => {} })),
    useAnimation: components?.useAnimation || (() => ({ start: () => Promise.resolve(), stop: () => {}, set: () => {} })),
    useTransform: components?.useTransform || ((value: any, transform: any) => ({ get: () => null, set: () => {}, subscribe: () => () => {} })),
    isLoading: state.isLoading,
    isAvailable: state.isAvailable,
    error: state.error
  };
};