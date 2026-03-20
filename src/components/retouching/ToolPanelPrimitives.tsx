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
  icon?: React.ReactNode;
}

export function ToolSlider({ label, value, min = 0, max = 100, step = 1, onChange, onCommit, unit = '', icon }: SliderProps) {
  return (
    <div
      className="flex items-center gap-3 px-4"
      style={{
        height: '44px',
        background: 'rgba(0,0,0,0.25)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {icon && <span className="flex-shrink-0 opacity-60">{icon}</span>}
      <span
        className="min-w-[80px] text-left"
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '12px',
          letterSpacing: '0.02em',
          color: 'rgba(240,237,232,0.8)',
          fontWeight: 400,
        }}
      >
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
      <span
        className="min-w-[36px] text-right"
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '12px',
          color: 'rgba(240,237,232,0.5)',
          fontWeight: 400,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value > 0 ? `+${value}` : value}{unit}
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
      className="px-3 rounded-md transition-all"
      style={{
        height: '28px',
        background: active ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.05)',
        border: active ? '1px solid rgba(201,169,110,0.3)' : '1px solid rgba(255,255,255,0.1)',
        color: active ? '#c9a96e' : 'rgba(240,237,232,0.5)',
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '10px',
        letterSpacing: '0.06em',
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
      className="inline-flex rounded-lg overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.1)', width: 'fit-content' }}
    >
      {options.map((opt, i) => (
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
            background: value === opt ? 'rgba(201,169,110,0.9)' : 'transparent',
            color: value === opt ? '#111' : 'rgba(240,237,232,0.4)',
            border: 'none',
            borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
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
    <div>
      {/* Tool header row — same glass style as sliders */}
      <div
        className="flex items-center justify-between px-4"
        style={{
          height: '40px',
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#c9a96e',
            fontWeight: 500,
          }}
        >
          {title}
        </span>
        <button
          onClick={onClose}
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '11px',
            color: '#c9a96e',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.04em',
            fontWeight: 500,
          }}
        >
          Done
        </button>
      </div>
      {/* Slider rows — each is its own glass row */}
      <div>
        {children}
      </div>
      {/* Extra controls row if any toggle/segment children need it */}
    </div>
  );
}
