import { usePageContext } from '@/hooks/use-page-context';
import { getBotLanguageLabel } from './LanguageSelector';
import { Globe } from 'lucide-react';

const CHIPS: Record<string, string[]> = {
  dashboard: [
    'Create new event',
    'Best camera for Indian weddings?',
    'Tips for low-light mandap photography',
    'What can you do?',
  ],
  album_builder: [
    'Fix empty frames',
    'Suggest better layout',
    'Album design composition tips',
    'Export this album',
    'Report a bug',
  ],
  event_gallery: [
    'Share this gallery',
    'View client favorites',
    'How to shoot a baraat in harsh sunlight?',
    'Report a bug',
  ],
  gallery_delivery: [
    'Share this gallery',
    'Color grading for warm tones',
    'Report a bug',
    'What can you do?',
  ],
  settings: [
    'Connect custom domain',
    'Update branding',
    'Help with settings',
    'What can you do?',
  ],
  domains: [
    'Connect custom domain',
    'Help with DNS setup',
    'Report a bug',
    'What can you do?',
  ],
  other: [
    'What is Mirror AI?',
    'History of Indian wedding photography',
    'Best lens for portraits?',
    'Report a bug',
  ],
};

const CREATIVE_PROMPTS = [
  'Explain the zone system by Ansel Adams',
  'How does back-button focus work?',
  'Best off-camera flash setup for receptions',
  'Difference between CCD and CMOS sensors',
  'How to shoot a cinematic pre-wedding',
  'Explain golden hour vs blue hour lighting',
  'Who was Raghu Rai?',
  'How to price wedding photography in India',
  'Tips for candid couple portraits',
  'Explain frequency separation retouching',
  'What is hyperfocal distance?',
  'How to build a photography portfolio',
];

interface SuggestionChipsProps {
  onChipClick: (text: string) => void;
  onLanguageClick?: () => void;
}

export function SuggestionChips({ onChipClick, onLanguageClick }: SuggestionChipsProps) {
  const { page } = usePageContext();
  const baseChips = CHIPS[page] || CHIPS.other;
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 4)) % CREATIVE_PROMPTS.length;
  const creativeChip = CREATIVE_PROMPTS[dayIndex];
  const chips = [...baseChips, creativeChip];

  const langLabel = getBotLanguageLabel();

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 px-1 scrollbar-hide">
      {/* Language chip — always first */}
      <button
        onClick={onLanguageClick}
        className="flex-shrink-0 text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-200 flex items-center gap-1"
        style={{
          border: '1px solid rgba(212,175,55,0.25)',
          color: 'rgba(212,175,55,0.7)',
          background: 'rgba(212,175,55,0.04)',
        }}
        aria-label="Choose language"
      >
        <Globe size={12} strokeWidth={1.5} /> {langLabel}
      </button>

      {chips.map(chip => (
        <button
          key={chip}
          onClick={() => onChipClick(chip)}
          className="flex-shrink-0 text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-200"
          style={{
            border: '1px solid rgba(212,175,55,0.12)',
            color: 'rgba(244,241,234,0.4)',
            background: 'transparent',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(212,175,55,0.06)';
            e.currentTarget.style.color = 'rgba(212,175,55,0.7)';
            e.currentTarget.style.borderColor = 'rgba(212,175,55,0.25)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(244,241,234,0.4)';
            e.currentTarget.style.borderColor = 'rgba(212,175,55,0.12)';
          }}
          aria-label={`Quick action: ${chip}`}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
