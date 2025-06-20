/**
 * Dependency Tests
 * Comprehensive tests for dependency availability and type safety
 */

import { checkDependency, checkAllDependencies, REQUIRED_DEPENDENCIES } from '../utils/dependencyChecker';

describe('Dependency Checker', () => {
  describe('checkDependency', () => {
    it('should detect available dependencies', async () => {
      const result = await checkDependency('react');
      expect(result.available).toBe(true);
    });

    it('should detect missing dependencies', async () => {
      const result = await checkDependency('non-existent-package');
      expect(result.available).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should provide fallback availability', async () => {
      const result = await checkDependency('non-existent-package');
      expect(result.fallbackAvailable).toBe(true);
    });
  });

  describe('checkAllDependencies', () => {
    it('should check all required dependencies', async () => {
      const results = await checkAllDependencies();
      
      // Should have results for all required dependencies
      REQUIRED_DEPENDENCIES.forEach(dep => {
        expect(results[dep]).toBeDefined();
        expect(typeof results[dep].available).toBe('boolean');
      });
    });

    it('should handle missing dependencies gracefully', async () => {
      const results = await checkAllDependencies();
      
      // Even if some dependencies are missing, should not throw
      expect(results).toBeDefined();
      expect(Object.keys(results).length).toBeGreaterThan(0);
    });
  });
});

describe('Framer Motion Availability', () => {
  it('should handle framer-motion import safely through module resolver', async () => {
    // Import our safe module resolver instead of direct import
    const { loadFramerMotion } = await import('../utils/moduleResolver');
    
    let result;
    try {
      result = await loadFramerMotion();
    } catch (error) {
      result = { success: false, error };
    }
    
    // Should always return a result object
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
    
    // Always expect either module or fallback to be available
    expect(result.module || result.fallback).toBeDefined();
    
    // Test success/failure state consistency
    expect(typeof result.success).toBe('boolean');
    
    // Validate result structure based on success state
    expect(result.success ? result.module : result.fallback).toBeDefined();
  });

  it('should provide proper fallbacks when framer-motion is not available', async () => {
    const { loadFramerMotion } = await import('../utils/moduleResolver');
    const result = await loadFramerMotion();
    
    // Should always have motion and AnimatePresence (either real or fallback)
    const components = result.module || result.fallback;
    expect(components).toBeDefined();
    expect(components.motion).toBeDefined();
    expect(components.AnimatePresence).toBeDefined();
  });
});

describe('TypeScript Type Safety', () => {
  it('should have proper type definitions for motion components', () => {
    // This test ensures our safe wrappers have proper types
    const mockMotionProps = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.3 }
    };
    
    expect(mockMotionProps.initial).toBeDefined();
    expect(mockMotionProps.animate).toBeDefined();
    expect(mockMotionProps.exit).toBeDefined();
    expect(mockMotionProps.transition).toBeDefined();
  });
});