/**
 * Module Resolver Utility
 * Provides safe module loading with proper TypeScript support
 */

import React, { ComponentType } from 'react';

export interface ModuleLoadResult<T = any> {
  success: boolean;
  module?: T;
  error?: Error;
  fallback?: T;
}

export interface SafeImportOptions {
  retries?: number;
  timeout?: number;
  fallback?: any;
  suppressWarnings?: boolean;
}

/**
 * Safely imports a module with proper error handling and fallbacks
 */
export async function safeImportModule<T = any>(
  moduleName: string,
  options: SafeImportOptions = {}
): Promise<ModuleLoadResult<T>> {
  const {
    retries = 1,
    timeout = 5000,
    fallback,
    suppressWarnings = false
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Use dynamic import with timeout
      const modulePromise = import(moduleName);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Import timeout for ${moduleName}`)), timeout)
      );

      const module = await Promise.race([modulePromise, timeoutPromise]);
      
      return {
        success: true,
        module: module as T
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (!suppressWarnings && attempt === retries - 1) {
        console.warn(`Failed to import ${moduleName}:`, lastError.message);
      }
      
      // Wait before retry
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }
  }

  return {
    success: false,
    error: lastError,
    fallback
  };
}

/**
 * Check if a module is available without importing it
 */
export async function checkModuleAvailability(moduleName: string): Promise<boolean> {
  try {
    // Use require.resolve in Node-like environments
    if (typeof require !== 'undefined' && require.resolve) {
      require.resolve(moduleName);
      return true;
    }
    
    // Fallback to dynamic import check
    await import(moduleName);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a fallback component for missing UI libraries
 */
export function createFallbackComponent(
  displayName: string,
  fallbackBehavior: 'hide' | 'placeholder' | 'basic' = 'basic'
): ComponentType<any> {
  const FallbackComponent = (props: any) => {
    const { children, className = '', style = {}, ...otherProps } = props;

    switch (fallbackBehavior) {
      case 'hide':
        return null;
      
      case 'placeholder':
        return React.createElement('div', {
          className: `fallback-placeholder ${className}`,
          style: { 
            ...style, 
            border: '1px dashed #ccc', 
            padding: '8px',
            textAlign: 'center',
            color: '#666'
          },
          ...otherProps
        }, `[${displayName} not available]`, children);
      
      case 'basic':
      default:
        return React.createElement('div', {
          className,
          style,
          ...otherProps
        }, children);
    }
  };

  FallbackComponent.displayName = `Fallback${displayName}`;
  return FallbackComponent;
}

/**
 * Framer Motion specific loader with comprehensive fallbacks
 */
export async function loadFramerMotion(): Promise<ModuleLoadResult> {
  const result = await safeImportModule('framer-motion', {
    retries: 2,
    timeout: 10000,
    suppressWarnings: false
  });

  if (result.success && result.module) {
    return {
      success: true,
      module: {
        motion: result.module.motion,
        AnimatePresence: result.module.AnimatePresence,
        useMotionValue: result.module.useMotionValue,
        useAnimation: result.module.useAnimation,
        useTransform: result.module.useTransform
      }
    };
  }

  // Create comprehensive fallbacks
  const fallbackMotion = new Proxy({} as any, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        return createFallbackComponent(`motion.${prop}`, 'basic');
      }
      return undefined;
    }
  });

  const fallbackAnimatePresence = createFallbackComponent('AnimatePresence', 'basic');

  const fallbackModule = {
    motion: fallbackMotion,
    AnimatePresence: fallbackAnimatePresence,
    useMotionValue: (initial: any) => ({ get: () => initial, set: () => {}, subscribe: () => () => {} }),
    useAnimation: () => ({ start: () => Promise.resolve(), stop: () => {}, set: () => {} }),
    useTransform: (value: any, transform: any) => ({ get: () => transform(value.get()), set: () => {}, subscribe: () => () => {} })
  };

  return {
    success: false,
    error: result.error,
    fallback: fallbackModule,
    module: fallbackModule
  };
}

/**
 * Global module cache to prevent repeated loading
 */
const moduleCache = new Map<string, ModuleLoadResult>();

export async function getCachedModule<T = any>(
  moduleName: string,
  loader?: () => Promise<ModuleLoadResult<T>>
): Promise<ModuleLoadResult<T>> {
  if (moduleCache.has(moduleName)) {
    return moduleCache.get(moduleName) as ModuleLoadResult<T>;
  }

  const result = loader ? await loader() : await safeImportModule<T>(moduleName);
  moduleCache.set(moduleName, result);
  
  return result;
}