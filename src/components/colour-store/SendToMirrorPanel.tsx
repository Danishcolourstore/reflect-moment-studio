import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onSend: (destination: 'event' | 'album' | 'grid') => void;
}

export default function SendToMirrorPanel({ onSend }: Props) {
  const [sent, setSent] = useState(false);

  const handleSend = (dest: 'event' | 'album' | 'grid') => {
    onSend(dest);
    setSent(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-full max-w-sm rounded-2xl bg-[#1A1A1A] border border-[rgba(240,237,232,0.04)] p-5 flex flex-col items-center gap-4"
    >
      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div key="options" className="flex flex-col items-center gap-4 w-full">
            {/* Header */}
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="1" stroke="#F0EDE8" strokeWidth="1" opacity="0.5" />
                <rect x="11" y="2" width="7" height="7" rx="1" stroke="#F0EDE8" strokeWidth="1" opacity="0.5" />
                <rect x="2" y="11" width="7" height="7" rx="1" stroke="#F0EDE8" strokeWidth="1" opacity="0.5" />
                <rect x="11" y="11" width="7" height="7" rx="1" stroke="#F0EDE8" strokeWidth="1" opacity="0.5" />
              </svg>
              <span className="text-[13px] font-light text-[#F0EDE8]" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                Send to Mirror
              </span>
            </div>

            <p className="text-[10px] text-[#6B6B6B]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
              Add to Event · Build Album · Add to Grid
            </p>

            {/* Destination pills */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { key: 'event' as const, label: '+ Add to Event' },
                { key: 'album' as const, label: '+ Add to Album' },
                { key: 'grid' as const, label: '+ Add to Grid' },
              ].map((opt) => (
                <motion.button
                  key={opt.key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSend(opt.key)}
                  className="px-4 py-2 rounded-full border border-[rgba(240,237,232,0.08)] text-[10px] tracking-wider uppercase text-[#F0EDE8]/70 hover:border-[rgba(232,201,122,0.2)] hover:text-[#E8C97A] transition-all duration-300"
                  style={{ fontFamily: '"DM Sans", sans-serif' }}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 py-2"
          >
            <span className="text-[#E8C97A] text-[11px]">✓</span>
            <span className="text-[12px] text-[#E8C97A]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
              Sent to Mirror
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
