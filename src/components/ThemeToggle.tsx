import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'mirrorai-theme';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem(STORAGE_KEY) as Theme) || 'light';
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
      className="w-full flex items-center gap-4 bg-card border border-border rounded px-5 py-4 active:scale-[0.98] transition-all hover:border-primary/30"
    >
      <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center">
        {isDark ? (
          <Sun className="h-5 w-5 text-foreground" strokeWidth={1.5} />
        ) : (
          <Moon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
        )}
      </div>
      <span
        className="text-[14px] text-foreground font-medium flex-1 text-left"
        style={{ fontFamily: 'var(--editorial-body)' }}
      >
        {isDark ? 'Light theme' : 'Dark theme'}
      </span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          isDark ? 'bg-primary' : 'bg-input'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-background shadow transition-transform ${
            isDark ? 'translate-x-[22px]' : 'translate-x-[2px]'
          }`}
        />
      </span>
    </button>
  );
}
