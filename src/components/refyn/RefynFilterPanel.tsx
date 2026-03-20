import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { USER_FILTERS, FILTER_CATEGORIES, type RefynFilter } from './refyn-filters';

interface Props {
  activeFilterId: string | null;
  onApply: (filter: RefynFilter) => void;
  onClose: () => void;
  photoUrl: string;
}

export default function RefynFilterPanel({ activeFilterId, onApply, onClose, photoUrl }: Props) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleFilterTap = useCallback((filter: RefynFilter) => {
    onApply(filter);
  }, [onApply]);

  const toggleCategory = useCallback((id: string) => {
    setExpandedCategory(prev => prev === id ? null : id);
  }, []);

  const renderFilterChip = (filter: RefynFilter) => {
    const isActive = activeFilterId === filter.id;
    return (
      <motion.button
        key={filter.id}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleFilterTap(filter)}
        className="flex-shrink-0 px-4 py-2 rounded-full transition-all duration-300"
        style={{
          background: isActive ? 'rgba(232,201,122,0.12)' : 'rgba(240,237,232,0.03)',
          border: isActive ? '1px solid rgba(232,201,122,0.4)' : '1px solid rgba(240,237,232,0.06)',
          color: isActive ? '#E8C97A' : 'rgba(240,237,232,0.5)',
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '10px',
          letterSpacing: '0.12em',
        }}
      >
        {filter.name}
      </motion.button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#080808' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div>
          <p
            className="text-[9px] tracking-[0.35em] uppercase mb-1"
            style={{ fontFamily: '"DM Sans", sans-serif', color: '#3A3A3A' }}
          >
            Entiran AI
          </p>
          <h2
            className="text-[22px] tracking-[0.04em]"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300, color: '#F0EDE8' }}
          >
            Filter Collection
          </h2>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ border: '1px solid rgba(240,237,232,0.08)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <line x1="2" y1="2" x2="12" y2="12" stroke="#6B6B6B" strokeWidth="1.2" />
            <line x1="12" y1="2" x2="2" y2="12" stroke="#6B6B6B" strokeWidth="1.2" />
          </svg>
        </motion.button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-8" style={{ scrollbarWidth: 'none' }}>

        {/* Your Filters */}
        <div className="mb-6">
          <p
            className="text-[9px] tracking-[0.3em] uppercase mb-3"
            style={{ fontFamily: '"DM Sans", sans-serif', color: '#E8C97A' }}
          >
            Your Filters
          </p>
          <div className="flex flex-wrap gap-2">
            {USER_FILTERS.map(renderFilterChip)}
          </div>
        </div>

        {/* Separator */}
        <div className="h-px mb-6" style={{ background: 'rgba(232,201,122,0.08)' }} />

        {/* Suggested Additions */}
        <p
          className="text-[9px] tracking-[0.3em] uppercase mb-4"
          style={{ fontFamily: '"DM Sans", sans-serif', color: '#3A3A3A' }}
        >
          Suggested Additions
        </p>

        {FILTER_CATEGORIES.map((cat) => {
          const isExpanded = expandedCategory === cat.id;
          return (
            <div key={cat.id} className="mb-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between py-3"
              >
                <span
                  className="text-[13px] tracking-[0.04em]"
                  style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 400, color: isExpanded ? '#F0EDE8' : 'rgba(240,237,232,0.4)' }}
                >
                  {cat.label}
                </span>
                <motion.svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <path d="M3 4.5L6 7.5L9 4.5" stroke={isExpanded ? '#E8C97A' : '#3A3A3A'} strokeWidth="1" />
                </motion.svg>
              </motion.button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-2 pb-3">
                      {cat.filters.map(renderFilterChip)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="h-px" style={{ background: 'rgba(240,237,232,0.04)' }} />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
