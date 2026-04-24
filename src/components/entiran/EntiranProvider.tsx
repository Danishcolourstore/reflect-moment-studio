import { useState, useEffect, lazy, Suspense, useCallback, Component, ReactNode, createContext, useContext } from 'react';
import { useStudioBrain } from '@/hooks/use-studio-brain';
import { EntiranButton } from './EntiranButton';

const EntiranPanel = lazy(() =>
  import('./EntiranPanel').then(m => ({ default: m.EntiranPanel }))
);

// Context to allow bottom nav to open the bot
const EntiranOpenContext = createContext<{ openBot: () => void }>({ openBot: () => {} });
export const useEntiranOpen = () => useContext(EntiranOpenContext);

class DaanErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: Error) {
    console.error('Daan AI failed to initialize.', err);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function DaanInner({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useStudioBrain();
  const [showSignature, setShowSignature] = useState(false);


  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        handleOpen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleOpen = useCallback(() => {
    if (!localStorage.getItem('daan_opened')) {
      localStorage.setItem('daan_opened', 'true');
      setShowSignature(true);
      setTimeout(() => {
        setShowSignature(false);
        setOpen(true);
      }, 2400);
    } else {
      setOpen(true);
    }
  }, []);

  return (
    <EntiranOpenContext.Provider value={{ openBot: handleOpen }}>
      {children}

      {/* Signature first-open experience */}
      {showSignature && !open && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 10003, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)' }}
        >
          <div className="text-center animate-fade-in">
            <p
              className="text-lg font-light tracking-wide"
              style={{ color: '#F4F1EA', opacity: 0.9, fontFamily: 'var(--editorial-heading, Cormorant Garamond, serif)' }}
            >
              You don't need to guess anymore.
            </p>
            <div
              className="mt-4 h-px mx-auto"
              style={{ width: 60, background: 'linear-gradient(90deg, transparent, #1A1A1A, transparent)' }}
            />
          </div>
        </div>
      )}
      {open && (
        <Suspense fallback={null}>
          <EntiranPanel
            open={open}
            onClose={() => setOpen(false)}
            pendingSuggestionCount={unreadCount}
          />
        </Suspense>
      )}
    </EntiranOpenContext.Provider>
  );
}

export function EntiranProvider({ children }: { children?: ReactNode }) {
  return (
    <DaanErrorBoundary>
      <DaanInner>{children}</DaanInner>
    </DaanErrorBoundary>
  );
}
