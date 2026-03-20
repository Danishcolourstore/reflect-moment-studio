import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RefynToolId } from './refyn-types';

/* ── Main bottom categories (like Lightroom's Actions/Presets/Crop/Edit/Masking/Remove) ── */
type MainCategory = 'retouch' | 'tone' | 'detail' | 'filters' | 'grain' | 'export';

interface SubTool {
  id: RefynToolId;
  label: string;
}

const MAIN_CATEGORIES: { id: MainCategory; label: string; icon: React.ReactNode }[] = [
  {
    id: 'retouch', label: 'Retouch',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="9" cy="11" r="6" stroke="currentColor" strokeWidth="1.2" opacity="0.7"/><circle cx="13" cy="11" r="6" stroke="currentColor" strokeWidth="1.2"/></svg>,
  },
  {
    id: 'tone', label: 'Tone',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="5" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="11" r="2.5" fill="currentColor" opacity="0.3"/><line x1="11" y1="2" x2="11" y2="5" stroke="currentColor" strokeWidth="1"/><line x1="11" y1="17" x2="11" y2="20" stroke="currentColor" strokeWidth="1"/><line x1="2" y1="11" x2="5" y2="11" stroke="currentColor" strokeWidth="1"/><line x1="17" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="1"/></svg>,
  },
  {
    id: 'detail', label: 'Detail',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 7C7 5 9 4 11 4C13 4 15 5 17 7L15 9L17 17H5L7 9L5 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  },
  {
    id: 'filters', label: 'Filters',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/><circle cx="11" cy="11" r="1.5" fill="currentColor" opacity="0.3"/></svg>,
  },
  {
    id: 'grain', label: 'Grain',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="4" y="4" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="0.8" fill="currentColor" opacity="0.5"/><circle cx="14" cy="9" r="0.6" fill="currentColor" opacity="0.4"/><circle cx="10" cy="13" r="0.7" fill="currentColor" opacity="0.5"/></svg>,
  },
  {
    id: 'export', label: 'Export',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 4V14M11 4L7 8M11 4L15 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 14V17H17V14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
];

/* ── Sub-tool tabs per main category (like Lightroom's Auto/Light/Color/Blur/Effects/Detail/Optics) ── */
const SUB_TOOLS: Record<string, SubTool[]> = {
  retouch: [
    { id: 'frequency', label: 'Skin' },
    { id: 'lumina', label: 'Glow' },
    { id: 'sculpt', label: 'Form' },
    { id: 'ghostLight', label: 'Light' },
  ],
  tone: [
    { id: 'outfit', label: 'Outfit' },
    { id: 'jewellery', label: 'Jewel' },
    { id: 'hair', label: 'Hair' },
  ],
  detail: [
    { id: 'layer', label: 'Depth' },
  ],
};

interface Props {
  activeTool: RefynToolId | null;
  onToolTap: (id: RefynToolId) => void;
  onExportTap?: () => void;
  onFiltersTap?: () => void;
  onGrainTap?: () => void;
}

export default function RefynToolbar({ activeTool, onToolTap, onExportTap, onFiltersTap, onGrainTap }: Props) {
  const [activeCategory, setActiveCategory] = useState<MainCategory | null>(null);

  const handleCategoryTap = (cat: MainCategory) => {
    if (cat === 'export') {
      onExportTap?.();
      return;
    }
    if (cat === 'filters') {
      onFiltersTap?.();
      return;
    }
    if (cat === 'grain') {
      onGrainTap?.();
      setActiveCategory(prev => prev === 'grain' ? null : 'grain');
      return;
    }
    setActiveCategory(prev => prev === cat ? null : cat);
  };

  const subTools = activeCategory && SUB_TOOLS[activeCategory] ? SUB_TOOLS[activeCategory] : null;

  return (
    <div>
      {/* ── Sub-tool row (like Light / Color / Blur / Effects) ── */}
      <AnimatePresence>
        {subTools && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-b"
            style={{ borderColor: 'rgba(240,237,232,0.06)' }}
          >
            <div className="flex items-center justify-center gap-1 px-3 py-2.5">
              {subTools.map((sub) => {
                const isActive = activeTool === sub.id;
                return (
                  <motion.button
                    key={sub.id}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => onToolTap(sub.id)}
                    className="px-4 py-1.5 rounded-full transition-all duration-200"
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.05em',
                      background: isActive ? 'rgba(232,201,122,0.12)' : 'transparent',
                      color: isActive ? '#E8C97A' : '#6B6B6B',
                      border: isActive ? '1px solid rgba(232,201,122,0.25)' : '1px solid transparent',
                    }}
                  >
                    {sub.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main category row (like Actions / Presets / Crop / Edit / Masking / Remove) ── */}
      <div
        className="flex items-center justify-around px-2 py-2"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))' }}
      >
        {MAIN_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.93 }}
              onClick={() => handleCategoryTap(cat.id)}
              className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[44px]"
              style={{
                color: isActive ? '#E8C97A' : '#6B6B6B',
              }}
            >
              {cat.icon}
              <span
                className="text-[8px] tracking-widest uppercase"
                style={{ fontFamily: '"DM Sans", sans-serif' }}
              >
                {cat.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
