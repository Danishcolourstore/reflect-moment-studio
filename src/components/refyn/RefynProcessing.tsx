import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  photoUrl: string;
}

export default function RefynProcessing({ photoUrl }: Props) {
  const [stage, setStage] = useState(0);
  const labels = ['Reading your photo...', 'Preparing editor...'];

  useEffect(() => {
    const t = setTimeout(() => setStage(1), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.6 }}
      className="h-[100dvh] w-full relative flex items-center justify-center"
      style={{ background: '#111' }}
    >
      {/* Full-width image — no rounded corners, no padding */}
      <img
        src={photoUrl}
        alt="Processing"
        className="w-full h-full object-contain"
        style={{ filter: 'brightness(0.7) saturate(0.85)', borderRadius: 0 }}
        draggable={false}
      />

      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'linear-gradient(135deg, rgba(26,26,26,0.3) 0%, rgba(34,34,34,0.1) 50%, rgba(26,26,26,0.3) 100%)',
            'linear-gradient(135deg, rgba(34,34,34,0.1) 0%, rgba(26,26,26,0.3) 50%, rgba(34,34,34,0.1) 100%)',
            'linear-gradient(135deg, rgba(26,26,26,0.3) 0%, rgba(34,34,34,0.1) 50%, rgba(26,26,26,0.3) 100%)',
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Centered loading indicator on top of image */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
        <div className="w-6 h-6 border-2 border-[#c9a96e]/30 border-t-[#c9a96e] rounded-full animate-spin" />
        <AnimatePresence mode="wait">
          <motion.p
            key={stage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            className="text-[11px] tracking-wider text-[#999]"
            style={{ fontFamily: '"DM Sans", sans-serif' }}
          >
            {labels[stage]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Thin gold progress bar at bottom */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px] z-10"
        style={{ background: '#c9a96e' }}
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}
