import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  photoUrl: string;
}

export default function RefynProcessing({ photoUrl }: Props) {
  const [stage, setStage] = useState(0);
  const labels = ['Reading your photo...', 'Almost there...'];

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
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6 gap-8"
    >
      {/* Photo with breathing glow */}
      <motion.div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        animate={{
          boxShadow: [
            '0 0 40px 8px rgba(232,201,122,0.06)',
            '0 0 80px 20px rgba(232,201,122,0.12)',
            '0 0 40px 8px rgba(232,201,122,0.06)',
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img
          src={photoUrl}
          alt="Processing"
          className="w-full aspect-[4/3] object-cover"
          style={{ filter: 'brightness(0.85) saturate(0.9)' }}
        />

        {/* Shimmering overlay */}
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'linear-gradient(135deg, rgba(232,201,122,0.1) 0%, transparent 50%, rgba(232,201,122,0.05) 100%)',
          }}
        />
      </motion.div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={stage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5 }}
          className="text-[13px] tracking-wider text-[#6B6B6B]"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          {labels[stage]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}
