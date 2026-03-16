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
      className="fixed rounded-full shadow-lg flex items-center justify-center"
      style={{
        bottom: isMobile ? 88 : 24,
        right: isMobile ? 16 : 24,
        width: 56,
        height: 56,
        backgroundColor: '#C9A96E',
        zIndex: 10001,
      }}
      aria-label="Open Entiran AI Assistant"
    >
      <Sparkles className="h-6 w-6 text-white" />
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
              bottom: isMobile ? 156 : 84,
              right: isMobile ? 16 : 24,
              backgroundColor: 'hsl(var(--popover))',
              color: 'hsl(var(--popover-foreground))',
              zIndex: 9999,
            }}
          >
            Ask Entiran
          </div>
          {showHint && (
            <div
              className="fixed text-[10px] px-2.5 py-1.5 rounded-lg shadow-md whitespace-nowrap motion-safe:animate-in motion-safe:fade-in"
              style={{
                bottom: isMobile ? 156 : 86,
                right: isMobile ? 16 : 24,
                backgroundColor: '#1A1A1A',
                color: 'white',
                zIndex: 9999,
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
