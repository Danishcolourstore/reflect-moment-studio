import { motion } from 'framer-motion';
import type { RefynToolId } from './refyn-types';

interface ToolDef {
  id: RefynToolId;
  label: string;
  icon: React.ReactNode;
  group: 1 | 2;
}

const TOOLS: ToolDef[] = [
  {
    id: 'frequency', label: 'Skin', group: 1,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="8" cy="10" r="6" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
        <circle cx="12" cy="10" r="6" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: 'lumina', label: 'Glow', group: 1,
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
    id: 'sculpt', label: 'Form', group: 1,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <ellipse cx="10" cy="9" rx="5" ry="7" stroke="currentColor" strokeWidth="1.2" />
        <line x1="10" y1="4" x2="10" y2="14" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
        <line x1="7" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'ghostLight', label: 'Light', group: 1,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <ellipse cx="10" cy="10" rx="8" ry="5" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1" />
        <circle cx="11" cy="9" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'layer', label: 'Depth', group: 1,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="4" y="6" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="6" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: 'grain', label: 'Grain', group: 2,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="7" cy="7" r="0.8" fill="currentColor" opacity="0.5" />
        <circle cx="13" cy="8" r="0.6" fill="currentColor" opacity="0.4" />
        <circle cx="9" cy="12" r="0.7" fill="currentColor" opacity="0.5" />
        <circle cx="14" cy="13" r="0.5" fill="currentColor" opacity="0.3" />
        <circle cx="6" cy="14" r="0.6" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: 'outfit', label: 'Outfit', group: 2,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 6C6 4 8 3 10 3C12 3 14 4 16 6L14 8L16 16H4L6 8L4 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M7 10C8.5 11 11.5 11 13 10" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
        <path d="M6.5 13C8.5 14 11.5 14 13.5 13" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'jewellery', label: 'Jewel', group: 2,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <polygon points="10,2 13,8 18,9 14,13 15,18 10,15.5 5,18 6,13 2,9 7,8" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <polygon points="10,5 11.5,8.5 10,7.5 8.5,8.5" fill="currentColor" opacity="0.2" />
      </svg>
    ),
  },
  {
    id: 'hair', label: 'Hair', group: 2,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M6 16C6 10 7 5 10 3C13 5 14 10 14 16" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M8 15C8 11 8.5 7 10 5C11.5 7 12 11 12 15" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
        <path d="M10 4C10 4 9 6 9 9" stroke="currentColor" strokeWidth="0.6" opacity="0.3" />
      </svg>
    ),
  },
];

interface Props {
  activeTool: RefynToolId | null;
  onToolTap: (id: RefynToolId) => void;
}

export default function RefynToolbar({ activeTool, onToolTap }: Props) {
  const group1 = TOOLS.filter(t => t.group === 1);
  const group2 = TOOLS.filter(t => t.group === 2);

  const renderTool = (tool: ToolDef) => {
    const active = activeTool === tool.id;
    return (
      <motion.button
        key={tool.id}
        whileTap={{ scale: 0.93 }}
        onClick={() => onToolTap(tool.id)}
        className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-[40px]"
        style={{
          backgroundColor: active ? 'rgba(232,201,122,0.1)' : 'transparent',
          color: active ? '#E8C97A' : '#6B6B6B',
        }}
      >
        {tool.icon}
        <span
          className="text-[7px] tracking-widest uppercase"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          {tool.label}
        </span>
      </motion.button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, type: 'spring', damping: 25, stiffness: 300 }}
      className="flex items-center justify-center gap-0.5 overflow-x-auto max-w-full px-2"
      style={{ scrollbarWidth: 'none' }}
    >
      {group1.map(renderTool)}
      {/* Separator */}
      <div className="w-px h-8 bg-[#333] mx-1 flex-shrink-0" />
      {group2.map(renderTool)}
    </motion.div>
  );
}
