import { useState, useCallback, useRef } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const overlayRef = useRef<HTMLDivElement>(null);
  const [iconKey, setIconKey] = useState(0);

  const toggle = useCallback(() => {
    const next = !dark;

    document.documentElement.classList.add('theme-transitioning');

    const overlay = overlayRef.current;
    if (overlay) {
      overlay.style.background = next
        ? 'radial-gradient(circle at 50% 0%, hsl(26 68% 10%) 0%, hsl(26 68% 10%) 100%)'
        : 'radial-gradient(circle at 50% 0%, hsl(36 52% 84%) 0%, hsl(36 52% 84%) 100%)';
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
      <div ref={overlayRef} className="theme-transition-overlay" />

      <button
        onClick={toggle}
        className="relative flex items-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        style={{
          width: '56px',
          height: '28px',
          backgroundColor: dark ? 'hsl(24, 48%, 24%)' : 'hsl(41, 50%, 72%)',
          boxShadow: dark
            ? '0 0 12px hsla(37, 51%, 76%, 0.3)'
            : '0 2px 8px hsla(24, 48%, 24%, 0.15)',
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
            backgroundColor: dark ? 'hsl(26, 68%, 10%)' : 'hsl(36, 56%, 90%)',
            boxShadow: dark
              ? '0 0 8px hsla(37, 51%, 76%, 0.3)'
              : '0 2px 6px hsla(24, 48%, 24%, 0.2)',
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
