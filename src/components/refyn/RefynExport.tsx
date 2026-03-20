import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Props {
  photoUrl: string;
  onBack: () => void;
  onReset: () => void;
}

export default function RefynExport({ photoUrl, onBack, onReset }: Props) {
  const [watermark, setWatermark] = useState(true);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = useCallback((quality: 'instagram' | 'full') => {
    // In a real app, this would apply edits and export at the right resolution
    const a = document.createElement('a');
    a.href = photoUrl;
    a.download = `refyn-${quality}-${Date.now()}.jpg`;
    a.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }, [photoUrl]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6 gap-8"
    >
      {/* Preview */}
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden">
        <img
          src={photoUrl}
          alt="Export preview"
          className="w-full aspect-[4/3] object-cover"
          style={{ filter: 'brightness(1.08) contrast(1.12) saturate(1.15)' }}
        />
        {watermark && (
          <div className="absolute bottom-3 right-3">
            <span
              className="text-[9px] tracking-[0.25em] uppercase text-white/20"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              Refyn
            </span>
          </div>
        )}
      </div>

      {/* Export options */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handleDownload('instagram')}
          className="w-full py-4 rounded-2xl bg-[#141414] border border-[rgba(240,237,232,0.06)] flex flex-col items-center gap-1 transition-all duration-300 hover:border-[rgba(232,201,122,0.15)] active:bg-[#1a1a1a]"
        >
          <span className="text-[12px] font-medium text-[#F0EDE8]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            Instagram Quality
          </span>
          <span className="text-[10px] text-[#6B6B6B]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            1080 × 1350 · Optimized
          </span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handleDownload('full')}
          className="w-full py-4 rounded-2xl bg-[#E8C97A] flex flex-col items-center gap-1 transition-all duration-300 active:bg-[#d4b968]"
        >
          <span className="text-[12px] font-medium text-[#0A0A0A]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            Full Quality
          </span>
          <span className="text-[10px] text-[#0A0A0A]/50" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            Original resolution · Lossless
          </span>
        </motion.button>
      </div>

      {/* Watermark toggle */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] tracking-wider text-[#6B6B6B]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
          "Edited with Refyn" watermark
        </span>
        <button
          onClick={() => setWatermark(!watermark)}
          className="w-10 h-5 rounded-full relative transition-colors duration-300"
          style={{ backgroundColor: watermark ? '#E8C97A' : '#333' }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-[#0A0A0A] transition-transform duration-300"
            style={{ left: watermark ? '22px' : '2px' }}
          />
        </button>
      </div>

      {/* Download confirmation */}
      <AnimatePresence>
        {downloaded && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[11px] text-[#E8C97A] tracking-wider"
            style={{ fontFamily: '"DM Sans", sans-serif' }}
          >
            ✓ Saved
          </motion.p>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center gap-6">
        <button
          onClick={onBack}
          className="text-[10px] tracking-wider uppercase text-[#6B6B6B] hover:text-[#F0EDE8]/70 transition-colors duration-300"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          ← Back to editor
        </button>
        <button
          onClick={onReset}
          className="text-[10px] tracking-wider uppercase text-[#6B6B6B] hover:text-[#F0EDE8]/70 transition-colors duration-300"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          New photo
        </button>
      </div>
    </motion.div>
  );
}

// Need AnimatePresence import at top
import { AnimatePresence } from 'framer-motion';
