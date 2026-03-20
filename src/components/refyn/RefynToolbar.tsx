import { motion } from 'framer-motion';
import type { RefynToolId } from './refyn-types';

interface ToolDef {
  id: RefynToolId;
  label: string;
  icon: React.ReactNode;
}

const TOOLS: ToolDef[] = [
  {
    id: 'frequency', label: 'Skin',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="8" cy="10" r="6" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
        <circle cx="12" cy="10" r="6" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: 'lumina', label: 'Glow',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="5" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="10" cy="10" r="2.5" fill="currentColor" opacity="0.3" />
        <line x1="10" y1="1" x2="10" y2="3.5" stroke="currentColor" strokeWidth="1" />
        <line x1="10" y1="16.5" x2="10" y2="19" stroke="currentColor" strokeWidth="1" />
        <line x1="1" y1="10" x2="3.5" y2="10" stroke="currentColor" strokeWidth="1" />
        <line x1="16.5" y1="10" x2="19" y2="10" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
  },
  {
    id: 'sculpt', label: 'Sculpt',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <ellipse cx="10" cy="9" rx="5" ry="7" stroke="currentColor" strokeWidth="1.2" />
        <line x1="10" y1="4" x2="10" y2="14" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
        <line x1="7" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'ghostLight', label: 'Eyes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <ellipse cx="10" cy="10" rx="8" ry="5" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1" />
        <circle cx="11" cy="9" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'grain', label: 'Grain',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="7" cy="7" r="0.8" fill="currentColor" opacity="0.5" />
        <circle cx="13" cy="8" r="0.6" fill="currentColor" opacity="0.4" />
        <circle cx="9" cy="12" r="0.7" fill="currentColor" opacity="0.5" />
        <circle cx="14" cy="13" r="0.5" fill="currentColor" opacity="0.3" />
        <circle cx="6" cy="14" r="0.6" fill="currentColor" opacity="0.4" />
        <circle cx="11" cy="6" r="0.5" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'layer', label: 'Layer',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="4" y="6" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="6" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      </svg>
    ),
  },
];

interface Props {
  activeTool: RefynToolId | null;
  onToolTap: (id: RefynToolId) => void;
}

export default function RefynToolbar({ activeTool, onToolTap }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, type: 'spring', damping: 25, stiffness: 300 }}
      className="flex items-center justify-center gap-1"
    >
      {TOOLS.map((tool) => {
        const active = activeTool === tool.id;
        return (
          <motion.button
            key={tool.id}
            whileTap={{ scale: 0.93 }}
            onClick={() => onToolTap(tool.id)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300"
            style={{
              backgroundColor: active ? 'rgba(232,201,122,0.1)' : 'transparent',
              color: active ? '#E8C97A' : '#6B6B6B',
            }}
          >
            {tool.icon}
            <span
              className="text-[8px] tracking-widest uppercase"
              style={{ fontFamily: '"DM Sans", sans-serif' }}
            >
              {tool.label}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
