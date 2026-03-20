import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ProductNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isColourStore = location.pathname.startsWith('/colour-store');
  const currentLabel = isColourStore ? 'Colour Store' : 'Mirror';
  const otherLabel = isColourStore ? 'Mirror' : 'Colour Store';
  const otherPath = isColourStore ? '/dashboard' : '/colour-store';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-4"
      style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.8), transparent)' }}
    >
      {/* Current product */}
      <button
        onClick={() => navigate('/home')}
        className="flex items-center gap-2"
      >
        <svg width="12" height="14" viewBox="0 0 28 32" fill="none">
          <path d="M14 1L26.5 8.5V23.5L14 31L1.5 23.5V8.5L14 1Z" stroke="#E8C97A" strokeWidth="1.5" fill="rgba(232,201,122,0.08)" />
        </svg>
        <span
          className="text-[12px] tracking-[0.25em] uppercase font-light text-[#F0EDE8]/70"
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          {currentLabel}
        </span>
      </button>

      {/* Other product */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate(otherPath)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[rgba(240,237,232,0.06)] hover:border-[rgba(232,201,122,0.15)] transition-all duration-300"
      >
        {isColourStore ? (
          // Grid icon for Mirror
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="7" height="7" rx="1" stroke="#6B6B6B" strokeWidth="1" />
            <rect x="11" y="2" width="7" height="7" rx="1" stroke="#6B6B6B" strokeWidth="1" />
            <rect x="2" y="11" width="7" height="7" rx="1" stroke="#6B6B6B" strokeWidth="1" />
            <rect x="11" y="11" width="7" height="7" rx="1" stroke="#6B6B6B" strokeWidth="1" />
          </svg>
        ) : (
          // Retouch icon for Colour Store
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <circle cx="8" cy="10" r="5" stroke="#6B6B6B" strokeWidth="1" opacity="0.7" />
            <circle cx="12" cy="10" r="5" stroke="#6B6B6B" strokeWidth="1" />
          </svg>
        )}
        <span
          className="text-[9px] tracking-wider uppercase text-[#6B6B6B]"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          {otherLabel}
        </span>
      </motion.button>
    </motion.div>
  );
}
