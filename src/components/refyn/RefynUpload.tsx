import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Props {
  onUpload: (file: File) => void;
}

export default function RefynUpload({ onUpload }: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (file.type.startsWith('image/')) onUpload(file);
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  }, [handleFile]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-[100dvh] flex items-center justify-center px-6"
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />

      <motion.button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="relative w-full max-w-lg aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-500 group"
        style={{
          borderColor: dragOver ? '#E8C97A' : 'rgba(240,237,232,0.08)',
          backgroundColor: dragOver ? 'rgba(232,201,122,0.03)' : 'transparent',
        }}
      >
        {/* Soft glow on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            boxShadow: '0 0 80px 20px rgba(232,201,122,0.04), inset 0 0 60px 10px rgba(232,201,122,0.02)',
          }}
        />

        {/* Upload icon */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-10 h-10 rounded-full border border-[rgba(240,237,232,0.12)] flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#F0EDE8]/40">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </motion.div>

        <p
          className="text-[22px] sm:text-[28px] font-light tracking-wide text-[#F0EDE8]/70"
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          Drop your photo.
        </p>

        <p className="text-[11px] tracking-wider uppercase text-[#6B6B6B]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
          or tap to browse
        </p>
      </motion.button>
    </motion.div>
  );
}
