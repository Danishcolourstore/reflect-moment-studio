import { useState, useEffect, lazy, Suspense, useCallback, Component, ReactNode } from 'react';
import { EntiranButton } from './EntiranButton';
import { useStudioBrain } from '@/hooks/use-studio-brain';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sparkles } from 'lucide-react';

const EntiranPanel = lazy(() =>
  import('./EntiranPanel').then(m => ({ default: m.EntiranPanel }))
);

// Error boundary fallback
class EntiranErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: Error) {
    console.error('Entiran AI failed to initialize.', err);
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
      className="fixed rounded-2xl shadow-lg flex items-center justify-center bg-primary text-primary-foreground"
      style={{
        bottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom, 0px))' : 24,
        right: isMobile ? 16 : 24,
        width: isMobile ? 52 : 56,
        height: isMobile ? 52 : 56,
        zIndex: 10001,
      }}
      aria-label="Open Daan AI Assistant"
    >
      <Sparkles className="h-5 w-5" />
    </button>
  );
}

function EntiranInner() {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useStudioBrain();
  const isMobile = useIsMobile();
  const [hintShown, setHintShown] = useState(() => localStorage.getItem('mirrorai_shortcut_hint_shown') === 'true');
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    console.log('Entiran AI initialized successfully.');
  }, []);

  // Keyboard shortcut: Ctrl+Shift+E to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleButtonHover = useCallback(() => {
    if (!hintShown) {
      setShowHint(true);
      localStorage.setItem('mirrorai_shortcut_hint_shown', 'true');
      setHintShown(true);
      setTimeout(() => setShowHint(false), 3000);
    }
  }, [hintShown]);

  return (
    <>
      {!open && (
        <>
          <div onMouseEnter={handleButtonHover}>
            <EntiranButton onClick={() => setOpen(true)} unreadCount={unreadCount} />
          </div>
          {/* Tooltip label */}
          <div
            className="fixed text-[10px] px-2 py-1 rounded-md shadow-sm pointer-events-none opacity-0 hover-parent-visible"
            style={{
              bottom: isMobile ? 148 : 84,
              right: isMobile ? 16 : 24,
              backgroundColor: 'hsl(var(--popover))',
              color: 'hsl(var(--popover-foreground))',
              zIndex: 10001,
            }}
          >
            Ask Entiran
          </div>
          {showHint && (
            <div
              className="fixed text-[10px] px-2.5 py-1.5 rounded-lg shadow-md whitespace-nowrap motion-safe:animate-in motion-safe:fade-in"
              style={{
                bottom: isMobile ? 148 : 86,
                right: isMobile ? 16 : 24,
                backgroundColor: '#1A1A1A',
                color: 'white',
                zIndex: 10001,
              }}
            >
              Tip: Ctrl+Shift+E to open
            </div>
          )}
        </>
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
    <EntiranErrorBoundary>
      <EntiranInner />
    </EntiranErrorBoundary>
  );
}
