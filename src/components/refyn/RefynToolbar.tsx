import { motion } from 'framer-motion';

export type RetouchToolId =
  | 'freqSep' | 'skinSmooth' | 'dodgeBurn' | 'blemish'
  | 'liquify' | 'sharpen' | 'hairCleanup' | 'eyeEnhance'
  | 'teethWhiten' | 'bgCleanup';

interface ToolDef {
  id: RetouchToolId;
  label: string;
  icon: React.ReactNode;
}

const TOOLS: ToolDef[] = [
  {
    id: 'freqSep', label: 'Freq Sep',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2"/>
        <path d="M5 7Q8 4 10 7T15 7" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
        <path d="M5 13Q8 16 10 13T15 13" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
      </svg>
    ),
  },
  {
    id: 'skinSmooth', label: 'Skin',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M6.5 16C6.5 13 8 11 10 11S13.5 13 13.5 16" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    id: 'dodgeBurn', label: 'D&B',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="7.5" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="12.5" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    id: 'blemish', label: 'Heal',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="10" y1="6" x2="10" y2="14" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    id: 'liquify', label: 'Liquify',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M7 4C5 8 5 12 7 16" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M13 4C15 8 15 12 13 16" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    id: 'sharpen', label: 'Sharp',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <polygon points="10,3 17,17 3,17" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <line x1="10" y1="9" x2="10" y2="14" stroke="currentColor" strokeWidth="1"/>
      </svg>
    ),
  },
  {
    id: 'hairCleanup', label: 'Hair',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M7 16C7 11 8 5 10 3.5C12 5 13 11 13 16" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M8.5 15C8.5 12 9 7 10 5.5C11 7 11.5 12 11.5 15" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: 'eyeEnhance', label: 'Eyes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <ellipse cx="10" cy="10" rx="7" ry="4.5" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1"/>
        <circle cx="10" cy="10" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 'teethWhiten', label: 'Teeth',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4.5 9C4.5 9 6.5 6.5 10 6.5S15.5 9 15.5 9" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M4.5 9C4.5 9 6.5 13.5 10 13.5S15.5 9 15.5 9" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    id: 'bgCleanup', label: 'BG',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M3 13L7 9L11 13L13.5 10.5L17 14" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        <circle cx="6.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
      </svg>
    ),
  },
];

interface Props {
  activeTool: RetouchToolId | null;
  onToolTap: (id: RetouchToolId) => void;
}

export default function RefynToolbar({ activeTool, onToolTap }: Props) {
  return (
    <div
      className="flex items-center gap-1 overflow-x-auto px-3 py-2"
      style={{
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none',
      }}
    >
      {TOOLS.map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <motion.button
            key={tool.id}
            whileTap={{ scale: 0.93 }}
            onClick={() => onToolTap(tool.id)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 flex-shrink-0 min-w-[52px]"
            style={{
              backgroundColor: isActive ? 'rgba(201,169,110,0.12)' : 'transparent',
              color: isActive ? '#c9a96e' : '#6a6470',
            }}
          >
            {tool.icon}
            <span
              className="text-[8px] tracking-wider uppercase whitespace-nowrap font-medium"
              style={{ fontFamily: '"DM Sans", sans-serif' }}
            >
              {tool.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
