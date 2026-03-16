import { usePageContext } from '@/hooks/use-page-context';

const CHIPS: Record<string, string[]> = {
  dashboard: ['Create new event', 'View recent activity', 'Check client selections', 'What can you do?'],
  album_builder: ['Fix empty frames', 'Suggest better layout', 'Export this album', 'Report a bug', 'What can you do?'],
  event_gallery: ['Share this gallery', 'View client favorites', 'Send selection reminder', 'Report a bug', 'What can you do?'],
  gallery_delivery: ['Share this gallery', 'View client favorites', 'Report a bug', 'What can you do?'],
  settings: ['Connect custom domain', 'Update branding', 'Help with settings', 'What can you do?'],
  domains: ['Connect custom domain', 'Help with DNS setup', 'Report a bug', 'What can you do?'],
  other: ['What is Mirror AI?', 'Report a bug', 'What can you do?'],
};

interface SuggestionChipsProps {
  onChipClick: (text: string) => void;
}

export function SuggestionChips({ onChipClick }: SuggestionChipsProps) {
  const { page } = usePageContext();
  const chips = CHIPS[page] || CHIPS.other;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-hide">
      {chips.map(chip => (
        <button
          key={chip}
          onClick={() => onChipClick(chip)}
          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-[#C9A96E]/10 whitespace-nowrap"
          style={{ borderColor: '#E8E0D4', color: '#1A1A1A' }}
          aria-label={`Quick action: ${chip}`}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
