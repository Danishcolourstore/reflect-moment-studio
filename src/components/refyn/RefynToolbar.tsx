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
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="3" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.2"/><line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2"/><path d="M5 8Q8 5 11 8T17 8" stroke="currentColor" strokeWidth="1" opacity="0.6"/><path d="M5 14Q8 17 11 14T17 14" stroke="currentColor" strokeWidth="1" opacity="0.6"/></svg>,
  },
  {
    id: 'skinSmooth', label: 'Skin',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="9" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 17C7 14 9 12 11 12S15 14 15 17" stroke="currentColor" strokeWidth="1.2"/></svg>,
  },
  {
    id: 'dodgeBurn', label: 'D&B',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="8" cy="11" r="5" stroke="currentColor" strokeWidth="1.2"/><circle cx="14" cy="11" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 6V16" stroke="currentColor" strokeWidth="0.6" opacity="0.4"/><path d="M14 6V16" stroke="currentColor" strokeWidth="0.6" opacity="0.4"/></svg>,
  },
  {
    id: 'blemish', label: 'Heal',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.2"/><line x1="11" y1="7" x2="11" y2="15" stroke="currentColor" strokeWidth="1.2"/><line x1="7" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1.2"/></svg>,
  },
  {
    id: 'liquify', label: 'Liquify',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M8 4C6 8 6 14 8 18" stroke="currentColor" strokeWidth="1.2"/><path d="M14 4C16 8 16 14 14 18" stroke="currentColor" strokeWidth="1.2"/><path d="M4 8C8 6 14 6 18 8" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/><path d="M4 14C8 16 14 16 18 14" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/></svg>,
  },
  {
    id: 'sharpen', label: 'Sharpen',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><polygon points="11,3 19,19 3,19" stroke="currentColor" strokeWidth="1.2" fill="none"/><line x1="11" y1="9" x2="11" y2="15" stroke="currentColor" strokeWidth="1"/></svg>,
  },
  {
    id: 'hairCleanup', label: 'Hair',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M7 18C7 12 8 6 11 4C14 6 15 12 15 18" stroke="currentColor" strokeWidth="1.2"/><path d="M9 17C9 13 9.5 8 11 6C12.5 8 13 13 13 17" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/></svg>,
  },
  {
    id: 'eyeEnhance', label: 'Eyes',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><ellipse cx="11" cy="11" rx="8" ry="5" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="1"/><circle cx="11" cy="11" r="1.2" fill="currentColor"/></svg>,
  },
  {
    id: 'teethWhiten', label: 'Teeth',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 10C5 10 7 7 11 7S17 10 17 10" stroke="currentColor" strokeWidth="1.2"/><path d="M5 10C5 10 7 15 11 15S17 10 17 10" stroke="currentColor" strokeWidth="1.2"/><line x1="9" y1="7.5" x2="9" y2="14.5" stroke="currentColor" strokeWidth="0.6" opacity="0.3"/><line x1="11" y1="7" x2="11" y2="15" stroke="currentColor" strokeWidth="0.6" opacity="0.3"/><line x1="13" y1="7.5" x2="13" y2="14.5" stroke="currentColor" strokeWidth="0.6" opacity="0.3"/></svg>,
  },
  {
    id: 'bgCleanup', label: 'BG Fix',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="3" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M3 15L8 10L12 14L15 11L19 15" stroke="currentColor" strokeWidth="1" opacity="0.5"/><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/></svg>,
  },
];

interface Props {
  activeTool: RetouchToolId | null;
  onToolTap: (id: RetouchToolId) => void;
}

export default function RefynToolbar({ activeTool, onToolTap }: Props) {
  return (
    <div
      className="flex items-center gap-0.5 overflow-x-auto px-2 py-1"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      {TOOLS.map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <motion.button
            key={tool.id}
            whileTap={{ scale: 0.93 }}
            onClick={() => onToolTap(tool.id)}
            className="flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl transition-all duration-200 flex-shrink-0 min-w-[48px]"
            style={{
              backgroundColor: isActive ? 'rgba(201,169,110,0.12)' : 'transparent',
              color: isActive ? '#c9a96e' : '#6a6470',
            }}
          >
            {tool.icon}
            <span
              className="text-[7px] tracking-wider uppercase whitespace-nowrap"
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
