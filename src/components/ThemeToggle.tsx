import { useState, useCallback, useRef, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const overlayRef = useRef<HTMLDivElement>(null);
  const [iconKey, setIconKey] = useState(0);

  const toggle = useCallback(() => {
    const next = !dark;

    // Add transition class for smooth morphing
    document.documentElement.classList.add('theme-transitioning');

    // Flash overlay
    const overlay = overlayRef.current;
    if (overlay) {
      overlay.style.background = next
        ? 'radial-gradient(circle at 50% 0%, hsl(30 18% 4%) 0%, hsl(30 18% 4%) 100%)'
        : 'radial-gradient(circle at 50% 0%, hsl(30 25% 95%) 0%, hsl(30 25% 95%) 100%)';
      overlay.classList.add('active');

      setTimeout(() => {
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('andhakaar-mode', next ? 'on' : 'off');
        localStorage.setItem('theme', next ? 'dark' : 'light');
        setDark(next);
        setIconKey(k => k + 1);

        setTimeout(() => {
          overlay.classList.remove('active');
          setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
          }, 400);
        }, 150);
      }, 150);
    } else {
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('andhakaar-mode', next ? 'on' : 'off');
      localStorage.setItem('theme', next ? 'dark' : 'light');
      setDark(next);
      setIconKey(k => k + 1);
    }
  }, [dark]);

  return (
    <>
      {/* Theme transition overlay */}
      <div ref={overlayRef} className="theme-transition-overlay" />

      {/* Pill toggle */}
      <button
        onClick={toggle}
        className="relative flex items-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        style={{
          width: '56px',
          height: '28px',
          backgroundColor: dark ? 'hsl(34, 35%, 64%)' : 'hsl(30, 26%, 89%)',
          boxShadow: dark
            ? '0 0 12px rgba(196,168,130,0.5)'
            : '0 2px 8px rgba(196,168,130,0.15)',
        }}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <div
          className="absolute flex items-center justify-center rounded-full transition-all"
          style={{
            width: '22px',
            height: '22px',
            top: '3px',
            left: dark ? '31px' : '3px',
            backgroundColor: dark ? 'hsl(22, 18%, 10%)' : 'hsl(0, 0%, 100%)',
            boxShadow: dark
              ? '0 0 8px rgba(196,168,130,0.4)'
              : '0 2px 6px rgba(196,168,130,0.3)',
            transition: 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease, box-shadow 0.3s ease',
          }}
        >
          <div key={iconKey} className="toggle-icon-animate flex items-center justify-center">
            {dark ? (
              <Moon className="h-[14px] w-[14px] text-primary" strokeWidth={2} />
            ) : (
              <Sun className="h-[14px] w-[14px] text-primary" strokeWidth={2} />
            )}
          </div>
        </div>
      </button>
    </>
  );
}
