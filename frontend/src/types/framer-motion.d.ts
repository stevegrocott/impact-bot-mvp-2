/**
 * Type declarations for framer-motion
 * This ensures TypeScript can properly resolve the module
 */

declare module 'framer-motion' {
  import { ComponentType, ReactNode, CSSProperties } from 'react';

  export interface AnimationProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    whileHover?: any;
    whileTap?: any;
    whileFocus?: any;
    whileDrag?: any;
    whileInView?: any;
    drag?: boolean | 'x' | 'y';
    dragConstraints?: any;
    dragElastic?: any;
    dragMomentum?: any;
    layout?: boolean | 'position' | 'size';
    layoutId?: string;
    style?: CSSProperties;
    className?: string;
    children?: ReactNode;
    onAnimationStart?: () => void;
    onAnimationComplete?: () => void;
    [key: string]: any;
  }

  export interface MotionComponents {
    div: ComponentType<AnimationProps>;
    span: ComponentType<AnimationProps>;
    button: ComponentType<AnimationProps>;
    a: ComponentType<AnimationProps>;
    section: ComponentType<AnimationProps>;
    article: ComponentType<AnimationProps>;
    header: ComponentType<AnimationProps>;
    footer: ComponentType<AnimationProps>;
    main: ComponentType<AnimationProps>;
    nav: ComponentType<AnimationProps>;
    aside: ComponentType<AnimationProps>;
    form: ComponentType<AnimationProps>;
    input: ComponentType<AnimationProps>;
    textarea: ComponentType<AnimationProps>;
    select: ComponentType<AnimationProps>;
    option: ComponentType<AnimationProps>;
    img: ComponentType<AnimationProps>;
    svg: ComponentType<AnimationProps>;
    p: ComponentType<AnimationProps>;
    h1: ComponentType<AnimationProps>;
    h2: ComponentType<AnimationProps>;
    h3: ComponentType<AnimationProps>;
    h4: ComponentType<AnimationProps>;
    h5: ComponentType<AnimationProps>;
    h6: ComponentType<AnimationProps>;
    ul: ComponentType<AnimationProps>;
    ol: ComponentType<AnimationProps>;
    li: ComponentType<AnimationProps>;
    [key: string]: ComponentType<AnimationProps>;
  }

  export const motion: MotionComponents;

  export interface AnimatePresenceProps {
    children?: ReactNode;
    initial?: boolean;
    mode?: 'sync' | 'wait' | 'popLayout';
    onExitComplete?: () => void;
    exitBeforeEnter?: boolean;
    presenceAffectsLayout?: boolean;
  }

  export const AnimatePresence: ComponentType<AnimatePresenceProps>;

  export function useMotionValue<T = any>(initial: T): MotionValue<T>;
  export function useTransform<T = any>(value: MotionValue, transform: (v: any) => T): MotionValue<T>;
  export function useSpring(value: MotionValue, config?: any): MotionValue;
  export function useScroll(options?: any): { scrollX: MotionValue; scrollY: MotionValue; scrollXProgress: MotionValue; scrollYProgress: MotionValue };
  export function useAnimation(): AnimationControls;
  export function useInView(ref: any, options?: any): boolean;

  export interface MotionValue<T = any> {
    get(): T;
    set(v: T): void;
    subscribe(callback: (v: T) => void): () => void;
  }

  export interface AnimationControls {
    start(definition: any, transitionOverride?: any): Promise<any>;
    stop(): void;
    set(definition: any): void;
  }

  export interface Variants {
    [key: string]: any;
  }

  export const MotionConfig: ComponentType<{ children: ReactNode; transition?: any }>;
  export const LazyMotion: ComponentType<{ children: ReactNode; features: any }>;
  export const domAnimation: any;
  export const domMax: any;
  export const m: MotionComponents;
}