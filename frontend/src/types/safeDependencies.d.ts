/**
 * Safe Dependency Type Definitions
 * Provides fallback types when dependencies are missing
 */

declare module 'framer-motion' {
  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    className?: string;
    children?: React.ReactNode;
  }
  
  export interface AnimatePresenceProps {
    mode?: 'wait' | 'sync';
    children?: React.ReactNode;
  }
  
  export const motion: {
    div: React.FC<MotionProps>;
    span: React.FC<MotionProps>;
    button: React.FC<MotionProps>;
    [key: string]: React.FC<MotionProps>;
  };
  
  export const AnimatePresence: React.FC<AnimatePresenceProps>;
}

// Extend global namespace for safe dependency checking
declare global {
  interface Window {
    __DEPENDENCY_CHECKER__?: {
      hasFramerMotion: boolean;
      hasLucideReact: boolean;
      hasReduxToolkit: boolean;
    };
  }
}

export {};