import { useState, useEffect, useCallback } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'laptop' | 'desktop';

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
} as const;

/**
 * Get current breakpoint based on window width
 */
function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.laptop) return 'laptop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
}

/**
 * Hook to detect current responsive breakpoint
 */
export function useResponsive() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'mobile';
    return getBreakpoint(window.innerWidth);
  });
  
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return 375;
    return window.innerWidth;
  });

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWidth(newWidth);
      setBreakpoint(getBreakpoint(newWidth));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isLaptop = breakpoint === 'laptop';
  const isDesktop = breakpoint === 'desktop';
  const isMobileOrTablet = isMobile || isTablet;
  const isLaptopOrDesktop = isLaptop || isDesktop;

  return {
    breakpoint,
    width,
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,
    isMobileOrTablet,
    isLaptopOrDesktop,
  };
}

/**
 * Get responsive grid columns based on breakpoint
 */
export function useResponsiveGrid(config?: {
  mobile?: number;
  tablet?: number;
  laptop?: number;
  desktop?: number;
}) {
  const { breakpoint } = useResponsive();
  
  const defaults = {
    mobile: 1,
    tablet: 2,
    laptop: 3,
    desktop: 4,
    ...config,
  };

  return defaults[breakpoint];
}

/**
 * Hook for responsive values
 */
export function useResponsiveValue<T>(values: {
  mobile: T;
  tablet?: T;
  laptop?: T;
  desktop?: T;
}): T {
  const { breakpoint } = useResponsive();
  
  // Fallback chain: desktop -> laptop -> tablet -> mobile
  if (breakpoint === 'desktop') {
    return values.desktop ?? values.laptop ?? values.tablet ?? values.mobile;
  }
  if (breakpoint === 'laptop') {
    return values.laptop ?? values.tablet ?? values.mobile;
  }
  if (breakpoint === 'tablet') {
    return values.tablet ?? values.mobile;
  }
  return values.mobile;
}
