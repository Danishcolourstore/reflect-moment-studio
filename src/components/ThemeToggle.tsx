import { useEffect } from 'react';

/**
 * ThemeToggle — MirrorAI is locked to dark luxury mode.
 * This component just ensures the theme attribute is always set.
 * No toggle UI is rendered.
 */
export function ThemeToggle() {
  useEffect(() => {
    // Force dark theme on mount — no switching allowed
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('mirrorai_theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  // No visible toggle — platform is always dark
  return null;
}
