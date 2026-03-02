import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function DesktopBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('mirrorai_pc_banner_dismissed');
    if (dismissed) return;

    const isPC = !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) && window.innerWidth >= 768;
    if (isPC) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-4 py-3"
      style={{
        background: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      <span className="flex items-center gap-2">
        <span>📱</span>
        <span>MirrorAI is best experienced on mobile. Our PC website is coming in a week — stay tuned!</span>
      </span>
      <button
        onClick={() => {
          sessionStorage.setItem('mirrorai_pc_banner_dismissed', 'true');
          setVisible(false);
        }}
        className="shrink-0 ml-3 p-1 rounded hover:opacity-70 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
