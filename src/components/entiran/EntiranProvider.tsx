import { useState, useEffect, lazy, Suspense, useCallback, Component, ReactNode } from 'react';
import { EntiranButton } from './EntiranButton';
import { useStudioBrain } from '@/hooks/use-studio-brain';
import { useIsMobile } from '@/hooks/use-mobile';

const EntiranPanel = lazy(() =>
  import('./EntiranPanel').then(m => ({ default: m.EntiranPanel }))
);

class DaanErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: Error) {
    console.error('Daan AI failed to initialize.', err);
  }
  render() {
    if (this.state.hasError) return <FallbackButton />;
    return this.props.children;
  }
}

function FallbackButton() {
  const isMobile = useIsMobile();
  return (
    <button
      onClick={() => window.location.reload()}
      className="fixed rounded-full flex items-center justify-center"
      style={{
        bottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom, 0px))' : 28,
        right: isMobile ? 16 : 28,
        width: isMobile ? 54 : 58,
        height: isMobile ? 54 : 58,
        zIndex: 10001,
        background: '#0A0A0A',
        boxShadow: '0 0 0 2px #D4AF37',
      }}
      aria-label="Open Daan AI Assistant"
    >
      <span style={{ color: '#D4AF37', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em' }}>D</span>
    </button>
  );
}

function DaanInner() {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useStudioBrain();
  const isMobile = useIsMobile();
  const [showSignature, setShowSignature] = useState(false);

  useEffect(() => {
    console.log('Daan AI initialized successfully.');
  }, []);

  // Keyboard shortcut: Ctrl+Shift+E to toggle
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
    <>
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
              style={{ width: 60, background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }}
            />
          </div>
        </div>
      )}

      {!open && !showSignature && (
        <EntiranButton onClick={handleOpen} unreadCount={unreadCount} />
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
    </>
  );
}

export function EntiranProvider() {
  return (
    <DaanErrorBoundary>
      <DaanInner />
    </DaanErrorBoundary>
  );
}
