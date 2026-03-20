import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  visible: boolean;
}

export default function IntelligenceBar({ visible }: Props) {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 4000);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-40 px-4 py-3 flex flex-col items-center gap-0.5"
          style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.95), transparent)' }}
        >
          <div className="flex items-center gap-2">
            <svg width="14" height="16" viewBox="0 0 28 32" fill="none">
              <path d="M14 1L26.5 8.5V23.5L14 31L1.5 23.5V8.5L14 1Z" stroke="#E8C97A" strokeWidth="1.5" fill="rgba(232,201,122,0.1)" />
            </svg>
            <span
              className="text-[10px] tracking-[0.3em] uppercase text-[#E8C97A]/70"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              Colour Store Intelligence
            </span>
          </div>
          <span
            className="text-[10px] text-[#6B6B6B]"
            style={{ fontFamily: '"DM Sans", sans-serif' }}
          >
            Golden hour · Canon 5D · Style applied
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
