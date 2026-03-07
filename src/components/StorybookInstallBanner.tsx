import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'storybook_install_dismissed';

export function StorybookInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISSED_KEY) === 'true');
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(DISMISSED_KEY, 'true');
  };

  // Don't show if installed, dismissed, or no prompt available
  if (isInstalled || dismissed || !deferredPrompt) return null;

  return (
    <div className="relative rounded-2xl border border-border bg-card p-5 mb-6 overflow-hidden">
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />

      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="relative flex items-center gap-4">
        <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Download className="h-5 w-5 text-primary" strokeWidth={1.5} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-serif text-foreground text-base" style={{ fontWeight: 500 }}>
            Install Story Book
          </p>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: '12px', lineHeight: '1.4' }}>
            Install the Story Book app for a faster and better experience.
          </p>
        </div>

        <Button
          onClick={handleInstall}
          size="sm"
          className="flex-shrink-0 rounded-xl h-9 px-4"
          style={{ fontSize: '12px', fontWeight: 500 }}
        >
          Install App
        </Button>
      </div>
    </div>
  );
}
