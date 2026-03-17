import { useState } from 'react';
import { Check, ArrowLeft } from 'lucide-react';

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
    <div className="absolute inset-0 flex flex-col" style={{ zIndex: 1, background: '#111111' }}>
      <div className="flex items-center gap-3 px-4 shrink-0" style={{ height: 48, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>Language</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {LANGUAGES.map(lang => {
          const isActive = lang.code === selected;
          return (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-150"
              style={{ background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent' }}
            >
              <span className="text-sm" style={{ color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)' }}>
                {lang.label}
              </span>
              {isActive && <Check className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.5)' }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
