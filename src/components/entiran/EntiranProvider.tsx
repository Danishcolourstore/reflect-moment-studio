import { useState, lazy, Suspense } from 'react';
import { EntiranButton } from './EntiranButton';
import { useStudioBrain } from '@/hooks/use-studio-brain';

const EntiranPanel = lazy(() =>
  import('./EntiranPanel').then(m => ({ default: m.EntiranPanel }))
);

export function EntiranProvider() {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useStudioBrain();

  return (
    <>
      {!open && (
        <EntiranButton onClick={() => setOpen(true)} unreadCount={unreadCount} />
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
