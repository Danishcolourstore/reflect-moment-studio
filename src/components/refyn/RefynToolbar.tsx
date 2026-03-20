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
    id: 'sharpen', label: 'Sharpen',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <polygon points="10,3 17,17 3,17" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      </svg>
    ),
  },
  {
    id: 'hairCleanup', label: 'Hair',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M7 16C7 11 8 5 10 3.5C12 5 13 11 13 16" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    id: 'eyeEnhance', label: 'Eyes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <ellipse cx="10" cy="10" rx="7" ry="4.5" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1"/>
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
      className="flex items-end overflow-x-auto"
      style={{
        height: '48px',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none',
        padding: '0 4px',
      }}
    >
      {TOOLS.map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onToolTap(tool.id)}
            className="flex flex-col items-center justify-center flex-shrink-0 relative"
            style={{
              width: '48px',
              height: '44px',
              color: isActive ? '#c9a96e' : 'rgba(240,237,232,0.35)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 150ms',
              gap: '2px',
            }}
          >
            {tool.icon}
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '8px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              {tool.label}
            </span>
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  width: '3px',
                  height: '3px',
                  borderRadius: '50%',
                  background: '#c9a96e',
                  boxShadow: '0 0 6px rgba(201,169,110,0.6)',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
