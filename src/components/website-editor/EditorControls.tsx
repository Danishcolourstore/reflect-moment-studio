import { ReactNode } from 'react';

/* ── Segmented Button Group ── */
interface SegmentedGroupProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}

export function SegmentedGroup({ label, options, value, onChange }: SegmentedGroupProps) {
  return (
    <div className="flex flex-col gap-1.5 py-2">
      <span className="text-[11px] text-[#999] font-medium tracking-wide uppercase select-none">
        {label}
      </span>
      <div className="flex rounded-lg overflow-hidden" style={{ backgroundColor: '#2c2c2e' }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            className="flex-1 min-h-[44px] text-[12px] font-medium tracking-wide transition-colors select-none"
            style={{
              backgroundColor: value === opt.value ? '#0A84FF' : 'transparent',
              color: value === opt.value ? '#fff' : '#999',
            }}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Stepper ── */
interface StepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}

export function Stepper({ label, value, min = 1, max = 12, onChange }: StepperProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[11px] text-[#999] font-medium tracking-wide uppercase select-none">
        {label}
      </span>
      <div className="flex items-center gap-0 rounded-lg overflow-hidden" style={{ backgroundColor: '#2c2c2e' }}>
        <button
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white text-lg font-light"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          style={{ opacity: value <= min ? 0.3 : 1 }}
        >
          −
        </button>
        <span className="min-w-[36px] text-center text-[14px] text-white font-mono tabular-nums select-none">
          {value}
        </span>
        <button
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white text-lg font-light"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          style={{ opacity: value >= max ? 0.3 : 1 }}
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ── Toggle Switch ── */
interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function ToggleSwitch({ label, checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      className="flex items-center justify-between py-2 min-h-[44px] w-full"
      onClick={() => onChange(!checked)}
    >
      <span className="text-[11px] text-[#999] font-medium tracking-wide uppercase select-none">
        {label}
      </span>
      <div
        className="w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-200"
        style={{ backgroundColor: checked ? '#0A84FF' : '#3a3a3c' }}
      >
        <div
          className="w-[27px] h-[27px] rounded-full bg-white transition-transform duration-200"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </div>
    </button>
  );
}

/* ── Color Swatch Row ── */
interface ColorSwatchRowProps {
  label: string;
  value: string;
  presets?: string[];
  onChange: (color: string) => void;
}

const DEFAULT_PRESETS = [
  '#ffffff', '#0a0a0a', '#1e1916', '#C8A97E', '#B8873A',
  '#0A84FF', '#ff3b30', '#34c759', '#faf7f2', '#f5f0e8',
];

export function ColorSwatchRow({ label, value, presets = DEFAULT_PRESETS, onChange }: ColorSwatchRowProps) {
  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#999] font-medium tracking-wide uppercase select-none">
          {label}
        </span>
        <div
          className="w-6 h-6 rounded-full border border-[#3a3a3c]"
          style={{ backgroundColor: value }}
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {presets.map((c) => (
          <button
            key={c}
            className="w-[44px] h-[44px] rounded-lg border-2 transition-all"
            style={{
              backgroundColor: c,
              borderColor: c === value ? '#0A84FF' : '#2c2c2e',
              transform: c === value ? 'scale(1.1)' : 'scale(1)',
            }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Section Divider ── */
export function ControlDivider() {
  return <div className="h-px my-2" style={{ backgroundColor: '#2c2c2e' }} />;
}
