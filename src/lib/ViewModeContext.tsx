import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ViewMode = 'portrait' | 'landscape';

interface ViewModeContextValue {
  viewMode: ViewMode;
  isLandscape: boolean;
  toggleViewMode: () => void;
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextValue>({
  viewMode: 'portrait',
  isLandscape: false,
  toggleViewMode: () => {},
  setViewMode: () => {},
});

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('mirrorai-view-mode') as ViewMode) || 'portrait';
  });

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next = prev === 'portrait' ? 'landscape' : 'portrait';
      localStorage.setItem('mirrorai-view-mode', next);
      return next;
    });
  }, []);

  const setMode = useCallback((mode: ViewMode) => {
    localStorage.setItem('mirrorai-view-mode', mode);
    setViewMode(mode);
  }, []);

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        isLandscape: viewMode === 'landscape',
        toggleViewMode,
        setViewMode: setMode,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  return useContext(ViewModeContext);
}
