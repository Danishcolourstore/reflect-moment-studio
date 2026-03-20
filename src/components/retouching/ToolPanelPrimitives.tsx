import { motion } from 'framer-motion';

interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
  unit?: string;
}

export function ToolSlider({ label, value, min = 0, max = 100, step = 1, onChange, onCommit, unit = '' }: SliderProps) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-[10px] tracking-wide uppercase text-[#a09890] min-w-[72px] font-medium" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        onTouchEnd={onCommit}
        className="rt-slider flex-1"
      />
      <span className="text-[10px] tabular-nums text-[#c9a96e] min-w-[28px] text-right font-medium" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        {value}{unit}
      </span>
    </div>
  );
}

interface ToggleProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

export function ToolToggle({ label, active, onToggle }: ToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
      style={{
        background: active ? 'rgba(201,169,110,0.12)' : 'rgba(255,255,255,0.03)',
        border: active ? '1px solid rgba(201,169,110,0.3)' : '1px solid rgba(255,255,255,0.06)',
        color: active ? '#c9a96e' : '#a09890',
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '10px',
        letterSpacing: '0.05em',
      }}
    >
      {label}
    </button>
  );
}

interface SegmentProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

export function ToolSegment({ options, value, onChange }: SegmentProps) {
  return (
    <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className="flex-1 px-3 py-1.5 rounded-md transition-all text-[9px] tracking-wide uppercase font-medium"
          style={{
            fontFamily: '"DM Sans", sans-serif',
            background: value === opt ? 'rgba(201,169,110,0.15)' : 'transparent',
            color: value === opt ? '#c9a96e' : '#6a6470',
            border: value === opt ? '1px solid rgba(201,169,110,0.2)' : '1px solid transparent',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

interface ToolPanelWrapperProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function ToolPanelWrapper({ title, children, onClose }: ToolPanelWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="px-4 pb-3"
    >
      {/* Drag handle */}
      <div className="flex justify-center py-2">
        <div className="w-8 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
      </div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] tracking-widest uppercase font-medium" style={{ fontFamily: '"DM Sans", sans-serif', color: '#c9a96e' }}>
          {title}
        </h3>
        <button
          onClick={onClose}
          className="text-[9px] tracking-wider uppercase px-3 py-1.5 rounded-full transition-all"
          style={{ fontFamily: '"DM Sans", sans-serif', color: '#6a6470', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          Done
        </button>
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </motion.div>
  );
}
