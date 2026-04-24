import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'mirrorai_pwa_install_dismissed';
const VISIT_COUNT_KEY = 'mirrorai_visit_count';

/**
 * Dismissible PWA install banner.
 * Shows on the user's second mobile visit, gold border, no illustration,
 * DM Sans typography. Dismissal persists in localStorage.
 */
export function PWAInstallBanner() {
  const isMobile = useIsMobile();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [eligible, setEligible] = useState(false);

  // Track visit count once per session
  useEffect(() => {
    try {
      if (sessionStorage.getItem('mirrorai_visit_counted')) return;
      const count = Number(localStorage.getItem(VISIT_COUNT_KEY) ?? '0') + 1;
      localStorage.setItem(VISIT_COUNT_KEY, String(count));
      sessionStorage.setItem('mirrorai_visit_counted', '1');
      if (count >= 2) setEligible(true);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY) === 'true') setDismissed(true);
    } catch {}

    // Already installed — never show
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => setDeferredPrompt(null);

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {}
  };

  if (!isMobile || dismissed || !eligible || !deferredPrompt) return null;

  return (
    <div
      className="fixed left-3 right-3 z-[120]"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)',
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}
      role="dialog"
      aria-label="Install MirrorAI"
    >
      <div
        className="relative flex items-center gap-3 bg-background px-4 py-3"
        style={{
          border: '1px solid hsl(var(--primary))',
          borderRadius: 0,
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center"
          style={{
            border: '1px solid hsl(var(--primary) / 0.4)',
            color: 'hsl(var(--primary))',
          }}
        >
          <Download className="h-4 w-4" strokeWidth={1.5} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="text-foreground"
            style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.01em' }}
          >
            Install MirrorAI
          </p>
          <p
            className="text-muted-foreground"
            style={{ fontSize: 11, lineHeight: 1.4, marginTop: 2 }}
          >
            Add to your home screen for a faster experience.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleInstall}
          className="shrink-0"
          style={{
            borderRadius: 0,
            height: 32,
            paddingInline: 14,
            fontSize: 12,
            fontWeight: 500,
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
          }}
        >
          Install
        </Button>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss install banner"
          className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
