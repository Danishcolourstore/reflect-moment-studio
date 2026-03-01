import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DarkModeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('mirrorai_theme') === 'dark';
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mirrorai_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mirrorai_theme', 'light');
    }
  }, [dark]);

  return (
    <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}
      className={`h-8 w-8 rounded-full ${className ?? ''}`}>
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
