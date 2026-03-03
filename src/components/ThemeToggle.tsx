import { useState, useCallback, useRef } from 'react';
import { Moon, Sun, Circle } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'blanc';

function getInitialTheme(): ThemeMode {
  const stored = localStorage.getItem('mirrorai_theme') as ThemeMode | null;
  if (stored === 'light' || stored === 'dark' || stored === 'blanc') return stored;
  return 'light';
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('mirrorai_theme', theme);
  localStorage.setItem('andhakaar-mode', theme === 'dark' ? 'on' : 'off');
  localStorage.setItem('theme', theme);
}

const MODES: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Light mode' },
  { mode: 'dark', icon: Moon, label: 'Dark mode' },
  { mode: 'blanc', icon: Circle, label: 'Blanc mode' },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const overlayRef = useRef<HTMLDivElement>(null);

  const switchTo = useCallback((next: ThemeMode) => {
    if (next === theme) return;

    document.documentElement.classList.add('theme-transitioning');

    const overlay = overlayRef.current;
    if (overlay) {
      const overlayColors: Record<ThemeMode, string> = {
        light: 'radial-gradient(circle at 50% 0%, hsl(30 25% 92%) 0%, hsl(30 25% 92%) 100%)',
        dark: 'radial-gradient(circle at 50% 0%, hsl(26 68% 10%) 0%, hsl(26 68% 10%) 100%)',
        blanc: 'radial-gradient(circle at 50% 0%, hsl(0 0% 96%) 0%, hsl(0 0% 96%) 100%)',
      };
      overlay.style.background = overlayColors[next];
      overlay.classList.add('active');

      setTimeout(() => {
        applyTheme(next);
        setTheme(next);

        setTimeout(() => {
          overlay.classList.remove('active');
          setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
          }, 400);
        }, 150);
      }, 150);
    } else {
      applyTheme(next);
      setTheme(next);
    }
  }, [theme]);

  return (
    <>
      <div ref={overlayRef} className="theme-transition-overlay" />

      <div
        className="flex items-center rounded-full border border-border p-[3px] gap-[2px]"
      >
        {MODES.map(({ mode, icon: Icon, label }) => {
          const isActive = theme === mode;
          return (
            <button
              key={mode}
              onClick={() => switchTo(mode)}
              className="flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: isActive ? 'hsl(var(--card))' : 'transparent',
                boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
              aria-label={label}
            >
              <Icon
                className="transition-colors duration-300"
                size={16}
                strokeWidth={2}
                style={{
                  color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                }}
              />
            </button>
          );
        })}
      </div>
    </>
  );
}
