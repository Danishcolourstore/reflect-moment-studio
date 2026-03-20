import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

interface Props {
  value: number;
  onChange: (v: number) => void;
  onChangeEnd?: () => void;
  label: string;
}

export default function RefynVerticalSlider({ value, onChange, label }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const updateFromY = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const pct = Math.round(Math.max(0, Math.min(100, ((rect.bottom - clientY) / rect.height) * 100)));
    onChange(pct);
  }, [onChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateFromY(e.clientY);
  }, [updateFromY]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    updateFromY(e.clientY);
  }, [dragging, updateFromY]);

  const handlePointerUp = useCallback(() => setDragging(false), []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2"
      style={{ touchAction: 'none' }}
    >
      {/* Percentage */}
      <span
        className="text-[10px] tabular-nums"
        style={{ fontFamily: '"DM Sans", sans-serif', color: '#E8C97A' }}
      >
        {value}
      </span>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative w-5 h-44 flex items-center justify-center cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Background track */}
        <div className="absolute w-[2px] h-full rounded-full bg-[#333]" />
        {/* Filled track */}
        <div
          className="absolute bottom-0 w-[2px] rounded-full"
          style={{
            height: `${value}%`,
            background: 'linear-gradient(to top, #E8C97A, #d4b968)',
          }}
        />
        {/* Thumb */}
        <div
          className="absolute w-5 h-5 rounded-full flex items-center justify-center"
          style={{
            bottom: `calc(${value}% - 10px)`,
            background: '#E8C97A',
            boxShadow: dragging
              ? '0 0 24px 8px rgba(232,201,122,0.45)'
              : '0 0 16px 4px rgba(232,201,122,0.3)',
            transition: dragging ? 'none' : 'box-shadow 0.3s ease',
          }}
        >
          <div className="w-2 h-2 rounded-full bg-[#0A0A0A]" />
        </div>
      </div>

      {/* Label */}
      <span
        className="text-[9px] tracking-widest uppercase text-[#6B6B6B]"
        style={{ fontFamily: '"DM Sans", sans-serif' }}
      >
        {label}
      </span>
    </motion.div>
  );
}
