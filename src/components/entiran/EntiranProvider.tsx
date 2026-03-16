import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { EntiranButton } from './EntiranButton';
import { useStudioBrain } from '@/hooks/use-studio-brain';

const EntiranPanel = lazy(() =>
  import('./EntiranPanel').then(m => ({ default: m.EntiranPanel }))
);

export function EntiranProvider() {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useStudioBrain();
  const [hintShown, setHintShown] = useState(() => localStorage.getItem('mirrorai_shortcut_hint_shown') === 'true');
  const [showHint, setShowHint] = useState(false);

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
        <div className="relative" onMouseEnter={handleButtonHover}>
          <EntiranButton onClick={() => setOpen(true)} unreadCount={unreadCount} />
          {showHint && (
            <div
              className="fixed z-50 text-[10px] px-2.5 py-1.5 rounded-lg shadow-md whitespace-nowrap motion-safe:animate-in motion-safe:fade-in"
              style={{ bottom: 86, right: 24, backgroundColor: '#1A1A1A', color: 'white' }}
            >
              Tip: Ctrl+Shift+E to open
            </div>
          )}
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
    </>
  );
}
