import { useState } from 'react';
import { Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' },
  { code: 'bn', label: 'Bengali' },
] as const;

export type BotLanguage = (typeof LANGUAGES)[number]['code'];

const STORAGE_KEY = 'daan_language';

export function getBotLanguage(): BotLanguage {
  return (localStorage.getItem(STORAGE_KEY) as BotLanguage) || 'en';
}

export function setBotLanguage(code: BotLanguage) {
  localStorage.setItem(STORAGE_KEY, code);
}

export function getBotLanguageLabel(code?: string): string {
  const lang = LANGUAGES.find(l => l.code === (code || getBotLanguage()));
  return lang?.label || 'English';
}

interface LanguageSelectorProps {
  onSelect: (code: BotLanguage) => void;
  onClose: () => void;
}

export function LanguageSelector({ onSelect, onClose }: LanguageSelectorProps) {
  const [selected, setSelected] = useState<BotLanguage>(getBotLanguage());

  const handleSelect = (code: BotLanguage) => {
    setSelected(code);
    setBotLanguage(code);
    onSelect(code);
  };

  return (
    <div className="absolute inset-0 flex flex-col" style={{ zIndex: 1, background: '#0A0A0A' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 shrink-0"
        style={{ height: 52, borderBottom: '1px solid rgba(212,175,55,0.08)' }}
      >
        <h3
          className="text-xs font-semibold tracking-wide"
          style={{ color: '#F4F1EA', letterSpacing: '0.08em' }}
        >
          Choose Language
        </h3>
        <button
          onClick={onClose}
          className="text-[10px] px-3 py-1.5 rounded-lg font-medium tracking-wide"
          style={{ color: 'rgba(244,241,234,0.4)' }}
        >
          CANCEL
        </button>
      </div>

      {/* Language list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {LANGUAGES.map(lang => {
          const isActive = lang.code === selected;
          return (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200"
              style={{
                background: isActive ? 'rgba(212,175,55,0.08)' : 'transparent',
                border: isActive
                  ? '1px solid rgba(212,175,55,0.2)'
                  : '1px solid rgba(244,241,234,0.04)',
              }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: isActive ? '#D4AF37' : 'rgba(244,241,234,0.7)' }}
              >
                {lang.label}
              </span>
              {isActive && <Check className="h-4 w-4" style={{ color: '#D4AF37' }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
