/**
 * Safe Animation Wrapper
 * Provides fallback when framer-motion is not available
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { loadFramerMotion, ModuleLoadResult } from '../utils/moduleResolver';

interface SafeAnimationWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  animate?: any;
  initial?: any;
  exit?: any;
  transition?: any;
  className?: string;
}

interface MotionComponents {
  motion: any;
  AnimatePresence: any;
}

/**
 * Safely import framer-motion with proper module resolution
 */
const useFramerMotion = (): MotionComponents | null => {
  const [motionComponents, setMotionComponents] = useState<MotionComponents | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadComponents = async () => {
      try {
        const result: ModuleLoadResult = await loadFramerMotion();
        
        if (result.success && result.module) {
          setMotionComponents({
            motion: result.module.motion,
            AnimatePresence: result.module.AnimatePresence
          });
        } else {
          console.warn('Framer Motion not available, using fallback animations');
          // Use fallback from module resolver or create our own
          const fallbackComponents = result.fallback || {
            motion: createFallbackMotion(),
            AnimatePresence: createFallbackAnimatePresence()
          };
          setMotionComponents(fallbackComponents);
        }
      } catch (error) {
        console.warn('Failed to load module resolver, using basic fallbacks');
        const fallbackMotion = createFallbackMotion();
        const fallbackAnimatePresence = createFallbackAnimatePresence();
        setMotionComponents({ 
          motion: fallbackMotion, 
          AnimatePresence: fallbackAnimatePresence 
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadComponents();
  }, []);

  if (isLoading) return null;
  return motionComponents;
};

/**
 * Create fallback motion component
 */
const createFallbackMotion = () => {
  return new Proxy({} as any, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        return React.forwardRef<HTMLElement, any>((props, ref) => {
          const { children, className, style, ...otherProps } = props;
          const tagName = prop === 'motion' ? 'div' : prop;
          
          return React.createElement(
            tagName,
            {
              ref,
              className: `transition-all duration-300 ${className || ''}`,
              style,
              ...otherProps
            },
            children
          );
        });
      }
      return undefined;
    }
  });
};

/**
 * Create fallback AnimatePresence component
 */
const createFallbackAnimatePresence = () => {
  return ({ children }: { children: ReactNode }) => <>{children}</>;
};

/**
 * Safe wrapper for framer-motion components
 */
const SafeAnimationWrapper: React.FC<SafeAnimationWrapperProps> = ({
  children,
  fallback,
  animate,
  initial,
  exit,
  transition,
  className = ''
}) => {
  const motionComponents = useFramerMotion();

  // If framer-motion is not available or still loading, use fallback
  if (!motionComponents) {
    return (
      <div className={`transition-all duration-300 ${className}`}>
        {fallback || children}
      </div>
    );
  }

  const { motion } = motionComponents;

  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Safe AnimatePresence wrapper
 */
export const SafeAnimatePresence: React.FC<{
  children: ReactNode;
  mode?: 'wait' | 'sync';
}> = ({ children, mode = 'wait' }) => {
  const motionComponents = useFramerMotion();

  if (!motionComponents) {
    return <>{children}</>;
  }

  const { AnimatePresence } = motionComponents;

  return (
    <AnimatePresence mode={mode}>
      {children}
    </AnimatePresence>
  );
};

export default SafeAnimationWrapper;