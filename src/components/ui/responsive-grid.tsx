import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  /** Columns at each breakpoint */
  cols?: {
    mobile?: 1 | 2;
    tablet?: 1 | 2 | 3;
    laptop?: 2 | 3 | 4;
    desktop?: 3 | 4 | 5 | 6;
  };
  /** Gap size */
  gap?: 'sm' | 'md' | 'lg';
}

const GAP_CLASSES = {
  sm: 'gap-3',
  md: 'gap-4 md:gap-5',
  lg: 'gap-5 md:gap-6 lg:gap-8',
};

const COLUMN_CLASSES = {
  mobile: {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
  },
  tablet: {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
  },
  laptop: {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  },
  desktop: {
    3: 'xl:grid-cols-3',
    4: 'xl:grid-cols-4',
    5: 'xl:grid-cols-5',
    6: 'xl:grid-cols-6',
  },
};

/**
 * Responsive grid component with automatic column adaptation
 */
export function ResponsiveGrid({
  children,
  className,
  cols = { mobile: 1, tablet: 2, laptop: 3, desktop: 4 },
  gap = 'md',
}: ResponsiveGridProps) {
  const mobileCol = cols.mobile ?? 1;
  const tabletCol = cols.tablet ?? 2;
  const laptopCol = cols.laptop ?? 3;
  const desktopCol = cols.desktop ?? 4;

  return (
    <div
      className={cn(
        'grid',
        GAP_CLASSES[gap],
        COLUMN_CLASSES.mobile[mobileCol],
        COLUMN_CLASSES.tablet[tabletCol],
        COLUMN_CLASSES.laptop[laptopCol],
        COLUMN_CLASSES.desktop[desktopCol],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveStackProps {
  children: ReactNode;
  className?: string;
  /** Stack direction on different breakpoints */
  direction?: 'vertical' | 'horizontal' | 'responsive';
  gap?: 'sm' | 'md' | 'lg';
}

/**
 * Responsive stack - vertical on mobile, horizontal on larger screens
 */
export function ResponsiveStack({
  children,
  className,
  direction = 'responsive',
  gap = 'md',
}: ResponsiveStackProps) {
  const directionClass =
    direction === 'vertical'
      ? 'flex-col'
      : direction === 'horizontal'
      ? 'flex-row'
      : 'flex-col md:flex-row';

  return (
    <div className={cn('flex', directionClass, GAP_CLASSES[gap], className)}>
      {children}
    </div>
  );
}

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  /** Max width constraint */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Add padding */
  padded?: boolean;
}

const MAX_WIDTH_CLASSES = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

/**
 * Responsive container with max-width and optional padding
 */
export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'xl',
  padded = true,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        MAX_WIDTH_CLASSES[maxWidth],
        padded && 'px-4 md:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  );
}
