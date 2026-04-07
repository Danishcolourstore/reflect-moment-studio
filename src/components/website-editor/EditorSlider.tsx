import { useRef, useCallback, useState, useEffect } from 'react';

interface EditorSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  accentColor?: string;
  onChange: (value: number) => void;
}

/**
 * LR-style slider — label left, value right, gradient track, fat draggable thumb.
 * Live updates on drag (not on release).
 */
export function EditorSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  accentColor = '#0A84FF',
  onChange,
}: EditorSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;

  const calcValue = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return value;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = min + ratio * (max - min);
      return Math.round(raw / step) * step;
    },
    [min, max, step, value],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
      onChange(calcValue(e.clientX));
    },
    [calcValue, onChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      onChange(calcValue(e.clientX));
    },
    [dragging, calcValue, onChange],
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  return (
    <div className="flex flex-col gap-1.5 py-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#999] font-medium tracking-wide uppercase select-none">
          {label}
        </span>
        <span className="text-[13px] text-white font-mono tabular-nums select-none">
          {value}{unit}
        </span>
      </div>
      <div
        ref={trackRef}
        className="relative h-[6px] rounded-full cursor-pointer"
        style={{ backgroundColor: '#2c2c2e' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Filled track */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: accentColor,
          }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white transition-transform"
          style={{
            left: `${pct}%`,
            width: 28,
            height: 28,
            backgroundColor: accentColor,
            transform: `translate(-50%, -50%) scale(${dragging ? 1.15 : 1})`,
            boxShadow: dragging ? `0 0 12px ${accentColor}60` : 'none',
          }}
        />
      </div>
    </div>
  );
}
