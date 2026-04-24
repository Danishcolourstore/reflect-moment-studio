import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  type BotLanguage,
  getBotLanguage,
  setBotLanguage,
} from './LanguageSelector';

const QUICK_LANGUAGES: { code: BotLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' },
  { code: 'bn', label: 'Bengali' },
];

interface LanguageChipsProps {
  onChange?: (code: BotLanguage) => void;
}

/**
 * Inline language chip row for Daan chat. Sits directly above the input.
 * Active chip uses hsl(var(--primary)) gold. Persists via LanguageSelector
 * storage key so the change is immediately picked up by use-entiran-chat.
 */
export function LanguageChips({ onChange }: LanguageChipsProps) {
  const [active, setActive] = useState<BotLanguage>(() => getBotLanguage());

  // Stay in sync with full LanguageSelector changes
  useEffect(() => {
    const handler = () => setActive(getBotLanguage());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleSelect = (code: BotLanguage) => {
    setBotLanguage(code);
    setActive(code);
    onChange?.(code);
  };

  return (
    <div
      className="flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-hide"
      role="radiogroup"
      aria-label="Conversation language"
      style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
    >
      {QUICK_LANGUAGES.map((lang) => {
        const isActive = lang.code === active;
        return (
          <button
            key={lang.code}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => handleSelect(lang.code)}
            className="shrink-0"
          >
            <Badge
              variant="outline"
              className="cursor-pointer select-none whitespace-nowrap transition-colors"
              style={{
                borderRadius: 0,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.02em',
                padding: '4px 10px',
                background: isActive ? 'hsl(var(--primary))' : 'transparent',
                borderColor: isActive
                  ? 'hsl(var(--primary))'
                  : 'hsl(var(--primary) / 0.25)',
                color: isActive
                  ? 'hsl(var(--primary-foreground))'
                  : 'hsl(var(--primary) / 0.7)',
              }}
            >
              {lang.label}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
