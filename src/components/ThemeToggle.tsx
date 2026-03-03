import { useState, useCallback, useRef } from 'react';
import { Moon, Sun, Square } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'blanc';

function getInitialTheme(): ThemeMode {
  const stored = localStorage.getItem('mirrorai_theme') as ThemeMode | null;
  if (stored === 'light' || stored === 'dark' || stored === 'blanc') return stored;
  if (document.documentElement.classList.contains('dark')) return 'dark';
  if (document.documentElement.getAttribute('data-theme') === 'blanc') return 'blanc';
  return 'light';
}

function applyTheme(theme: ThemeMode) {
  const html = document.documentElement;
  html.classList.remove('dark');
  html.removeAttribute('data-theme');
  if (theme === 'dark') {
    html.classList.add('dark');
  } else if (theme === 'blanc') {
    html.setAttribute('data-theme', 'blanc');
  }
  localStorage.setItem('mirrorai_theme', theme);
  localStorage.setItem('andhakaar-mode', theme === 'dark' ? 'on' : 'off');
  localStorage.setItem('theme', theme);
}

const CYCLE: ThemeMode[] = ['light', 'dark', 'blanc'];

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [iconKey, setIconKey] = useState(0);

  const toggle = useCallback(() => {
    const idx = CYCLE.indexOf(theme);
    const next = CYCLE[(idx + 1) % CYCLE.length];

    document.documentElement.classList.add('theme-transitioning');

    const overlay = overlayRef.current;
    if (overlay) {
      const overlayColors: Record<ThemeMode, string> = {
        light: 'radial-gradient(circle at 50% 0%, hsl(20 68% 11%) 0%, hsl(20 68% 11%) 100%)',
        dark: 'radial-gradient(circle at 50% 0%, hsl(26 68% 10%) 0%, hsl(26 68% 10%) 100%)',
        blanc: 'radial-gradient(circle at 50% 0%, hsl(0 0% 96%) 0%, hsl(0 0% 96%) 100%)',
      };
      overlay.style.background = overlayColors[next];
      overlay.classList.add('active');

      setTimeout(() => {
        applyTheme(next);
        setTheme(next);
        setIconKey(k => k + 1);

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
      setIconKey(k => k + 1);
    }
  }, [theme]);

  // Visual config per theme
  const pillBg = theme === 'dark'
    ? 'hsl(24, 48%, 24%)'
    : theme === 'blanc'
      ? 'hsl(0, 0%, 82%)'
      : 'hsl(24, 48%, 24%)';

  const circleBg = theme === 'dark'
    ? 'hsl(26, 68%, 10%)'
    : theme === 'blanc'
      ? 'hsl(0, 0%, 100%)'
      : 'hsl(36, 56%, 90%)';

  const circlePos = theme === 'light' ? '3px' : theme === 'dark' ? '22px' : '41px';

  const pillShadow = theme === 'dark'
    ? '0 0 12px hsla(37, 51%, 76%, 0.3)'
    : theme === 'blanc'
      ? '0 1px 6px rgba(0,0,0,0.12)'
      : '0 2px 8px hsla(24, 48%, 24%, 0.15)';

  const circleShadow = theme === 'dark'
    ? '0 0 8px hsla(37, 51%, 76%, 0.3)'
    : theme === 'blanc'
      ? '0 1px 4px rgba(0,0,0,0.15)'
      : '0 2px 6px hsla(24, 48%, 24%, 0.2)';

  const labels: Record<ThemeMode, string> = {
    light: 'Switch to dark mode',
    dark: 'Switch to blanc mode',
    blanc: 'Switch to light mode',
  };

  const Icon = theme === 'dark' ? Moon : theme === 'blanc' ? Square : Sun;

  return (
    <>
      <div ref={overlayRef} className="theme-transition-overlay" />

      <button
        onClick={toggle}
        className="relative flex items-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        style={{
          width: '66px',
          height: '28px',
          backgroundColor: pillBg,
          boxShadow: pillShadow,
        }}
        aria-label={labels[theme]}
      >
        <div
          className="absolute flex items-center justify-center rounded-full"
          style={{
            width: '22px',
            height: '22px',
            top: '3px',
            left: circlePos,
            backgroundColor: circleBg,
            boxShadow: circleShadow,
            transition: 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease, box-shadow 0.3s ease',
          }}
        >
          <div key={iconKey} className="toggle-icon-animate flex items-center justify-center">
            <Icon className="h-[14px] w-[14px] text-primary" strokeWidth={2} />
          </div>
        </div>

        {/* 3 dot indicators */}
        <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 flex gap-1">
          {CYCLE.map(t => (
            <div
              key={t}
              className="rounded-full transition-all duration-300"
              style={{
                width: t === theme ? '6px' : '3px',
                height: '3px',
                backgroundColor: t === theme
                  ? (theme === 'blanc' ? 'hsl(0,0%,4%)' : 'hsl(37,51%,76%)')
                  : (theme === 'blanc' ? 'hsl(0,0%,78%)' : 'hsla(37,51%,76%,0.3)'),
              }}
            />
          ))}
        </div>
      </button>
    </>
  );
}
