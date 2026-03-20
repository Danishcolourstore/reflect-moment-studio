/**
 * VSCO Recipe Card Style Primitives
 * Rows float over full-screen photo: [icon] Label ——————— +value
 * Thin separator lines. No slider tracks visible in default view.
 * Tap a row to expand inline slider.
 */
import { useState } from 'react';

/* ─── Recipe Row (tap to adjust) ─── */
interface RecipeRowProps {
  icon?: React.ReactNode;
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
  unit?: string;
  formatValue?: (v: number) => string;
}

export function RecipeRow({
  icon, label, value, min = 0, max = 100, step = 1,
  onChange, onCommit, unit = '',
  formatValue,
}: RecipeRowProps) {
  const [expanded, setExpanded] = useState(false);
  const displayVal = formatValue
    ? formatValue(value)
    : value > 0 ? `+${value}${unit ? '.' + unit : ''}` : `${value}${unit ? '.' + unit : ''}`;

  // Format like VSCO: +12.0
  const vscoVal = formatValue
    ? formatValue(value)
    : (value >= 0 ? '+' : '') + Number(value).toFixed(1);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="recipe-row"
        style={{ width: '100%' }}
      >
        <span className="recipe-icon">{icon}</span>
        <span className="recipe-label">{label}</span>
        <span className="recipe-value">{vscoVal}</span>
      </button>
      {expanded && (
        <div className="recipe-slider-row">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            onPointerUp={() => { onCommit?.(); }}
            onTouchEnd={() => { onCommit?.(); }}
            className="recipe-slider"
          />
        </div>
      )}
    </div>
  );
}

/* ─── Recipe Toggle Row ─── */
interface ToggleProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
}

export function ToolToggle({ label, active, onToggle, icon }: ToggleProps) {
  return (
    <button onClick={onToggle} className="recipe-row" style={{ width: '100%' }}>
      {icon && <span className="recipe-icon">{icon}</span>}
      <span className="recipe-label">{label}</span>
      <span className="recipe-value" style={{ color: active ? '#c9a96e' : 'rgba(240,237,232,0.3)' }}>
        {active ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}

/* ─── Segment (inline pill group) ─── */
interface SegmentProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

export function ToolSegment({ options, value, onChange }: SegmentProps) {
  return (
    <div className="recipe-segment-row">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className="recipe-segment-btn"
          style={{
            color: value === opt ? '#c9a96e' : 'rgba(240,237,232,0.3)',
            borderBottom: value === opt ? '1px solid #c9a96e' : '1px solid transparent',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ─── Panel Wrapper ─── */
interface ToolPanelWrapperProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  badge?: string;
}

export function ToolPanelWrapper({ title, children, onClose, badge }: ToolPanelWrapperProps) {
  return (
    <div className="recipe-panel">
      {/* Title row — same style as VSCO preset badge */}
      <div className="recipe-title-row">
        {badge && <span className="recipe-badge">{badge}</span>}
        <span className="recipe-title">{title}</span>
        <span className="recipe-title-value" onClick={onClose}>✓</span>
      </div>
      {/* Recipe rows */}
      {children}
    </div>
  );
}

/* ─── Backward compat aliases ─── */
export const ToolSlider = RecipeRow;
