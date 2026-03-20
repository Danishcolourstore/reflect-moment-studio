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
    <div className="flex items-center gap-3 h-[28px]">
      <span className="text-[9px] tracking-[0.08em] uppercase text-[#999] min-w-[56px] font-medium" style={{ fontFamily: '"DM Sans", sans-serif' }}>
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
      <span className="text-[10px] tabular-nums text-[#f5f0eb] min-w-[28px] text-right font-medium" style={{ fontFamily: '"DM Sans", sans-serif' }}>
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
      className="px-3 py-0 rounded-md transition-all"
      style={{
        height: '28px',
        background: active ? 'rgba(201,169,110,0.12)' : 'transparent',
        border: active ? '1px solid rgba(201,169,110,0.3)' : '1px solid #444',
        color: active ? '#c9a96e' : '#999',
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '9px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
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
    <div
      className="inline-flex gap-0 rounded-lg overflow-hidden"
      style={{ border: '1px solid #444', width: 'fit-content' }}
    >
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className="transition-all"
          style={{
            padding: '0 12px',
            height: '28px',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '9px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            fontWeight: 500,
            background: value === opt ? '#c9a96e' : 'transparent',
            color: value === opt ? '#111' : '#999',
            border: 'none',
            borderLeft: opt !== options[0] ? '1px solid #444' : 'none',
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="px-4 pb-2 pt-1"
    >
      {/* Drag handle */}
      <div className="flex justify-center py-1.5">
        <div className="w-10 h-1 rounded-full" style={{ background: '#444' }} />
      </div>
      {/* Header: title left, Done right — same line */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] tracking-[0.12em] uppercase font-medium" style={{ fontFamily: '"DM Sans", sans-serif', color: '#c9a96e' }}>
          {title}
        </h3>
        <button
          onClick={onClose}
          className="text-[11px] font-medium tracking-wider"
          style={{ fontFamily: '"DM Sans", sans-serif', color: '#c9a96e', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Done
        </button>
      </div>
      <div className="space-y-0">
        {children}
      </div>
    </motion.div>
  );
}
