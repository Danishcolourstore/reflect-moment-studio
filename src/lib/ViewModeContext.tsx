import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type ViewMode = 'auto' | 'desktop' | 'mobile';

interface ViewModeContextValue {
  /** Raw user preference */
  viewMode: ViewMode;
  /** Resolved: should we render desktop UI right now? */
  isDesktop: boolean;
  /** Resolved: should we render mobile UI right now? */
  isMobile: boolean;
  /** Set explicit mode */
  setViewMode: (mode: ViewMode) => void;
  /** Cycle: auto → desktop → mobile → auto */
  cycleViewMode: () => void;
}

const STORAGE_KEY = 'mirrorai-view-mode';
const MOBILE_BREAKPOINT = 768;

const ViewModeContext = createContext<ViewModeContextValue>({
  viewMode: 'auto',
  isDesktop: true,
  isMobile: false,
  setViewMode: () => {},
  cycleViewMode: () => {},
});

function resolveIsDesktop(mode: ViewMode, screenWidth: number): boolean {
  if (mode === 'desktop') return true;
  if (mode === 'mobile') return false;
  // auto — use screen width
  return screenWidth >= MOBILE_BREAKPOINT;
}

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    if (saved === 'desktop' || saved === 'mobile' || saved === 'auto') return saved;
    return 'auto';
  });

  const [screenWidth, setScreenWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  // Listen for resize (only matters in auto mode, but keep it updated)
  useEffect(() => {
    const onResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    setViewModeState(mode);
  }, []);

  const cycleViewMode = useCallback(() => {
    setViewModeState((prev) => {
      const order: ViewMode[] = ['auto', 'desktop', 'mobile'];
      const next = order[(order.indexOf(prev) + 1) % order.length];
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const isDesktop = resolveIsDesktop(viewMode, screenWidth);

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        isDesktop,
        isMobile: !isDesktop,
        setViewMode,
        cycleViewMode,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  return useContext(ViewModeContext);
}
