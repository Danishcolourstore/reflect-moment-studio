/**
 * Professional typography controls toolbar for Grid Builder.
 * Features: FontPicker, full weight/size/spacing controls,
 * text styling (underline, stroke, highlight, gradient), shadow, alignment.
 */

import { useState } from 'react';
import {
  Type, AlignLeft, AlignCenter, AlignRight, Plus, ChevronDown, ChevronUp,
  Bold, Italic, Underline, Paintbrush,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TEXT_PRESETS,
  createTextLayer,
  type TextLayer,
} from './text-overlay-types';
import { FONT_LIBRARY } from './font-library';
import FontPicker from './FontPicker';

interface Props {
  layers: TextLayer[];
  selectedId: string | null;
  onAddLayer: (layer: TextLayer) => void;
  onUpdateLayer: (id: string, patch: Partial<TextLayer>) => void;
}

type Panel = 'presets' | 'font' | 'style' | 'advanced' | null;

export default function TextToolbar({ layers, selectedId, onAddLayer, onUpdateLayer }: Props) {
  const [panel, setPanel] = useState<Panel>('presets');
  const selected = layers.find((l) => l.id === selectedId);

  const togglePanel = (p: Panel) => setPanel((prev) => (prev === p ? null : p));

  const applyPreset = (preset: typeof TEXT_PRESETS[number]) => {
    onAddLayer(createTextLayer(preset.layer));
  };

  const update = (patch: Partial<TextLayer>) => {
    if (selectedId) onUpdateLayer(selectedId, patch);
  };

  return (
    <div className="flex flex-col gap-0 bg-card border-t border-border">
      {/* Tab bar */}
      <div className="flex border-b border-border">
        {([
          { key: 'presets' as const, icon: <Plus className="h-3.5 w-3.5" />, label: 'Presets', always: true },
          { key: 'font' as const, icon: <Type className="h-3.5 w-3.5" />, label: 'Font', always: false },
          { key: 'style' as const, icon: <Paintbrush className="h-3.5 w-3.5" />, label: 'Style', always: false },
          { key: 'advanced' as const, icon: <Bold className="h-3.5 w-3.5" />, label: 'Advanced', always: false },
        ]).map(({ key, icon, label, always }) => (
          <button
            key={key}
            onClick={() => togglePanel(key)}
            className={cn(
              'flex-1 py-2.5 text-[10px] tracking-widest uppercase font-medium flex items-center justify-center gap-1.5 transition-colors',
              panel === key ? 'text-foreground bg-muted/30' : 'text-muted-foreground',
              !always && !selected && 'opacity-40 pointer-events-none'
            )}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      {panel && (
        <div className="max-h-[320px] overflow-y-auto px-4 py-3">
          {panel === 'presets' && <PresetsPanel onApply={applyPreset} />}
          {panel === 'font' && selected && <FontPanel layer={selected} onUpdate={update} />}
          {panel === 'style' && selected && <StylePanel layer={selected} onUpdate={update} />}
          {panel === 'advanced' && selected && <AdvancedPanel layer={selected} onUpdate={update} />}
        </div>
      )}
    </div>
  );
}

// ─── Presets Panel ──────────────────────────────

function PresetsPanel({ onApply }: { onApply: (p: typeof TEXT_PRESETS[number]) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {TEXT_PRESETS.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onApply(preset)}
          className="text-left p-3 rounded-xl border border-border hover:border-foreground/20 bg-background transition-all active:scale-95"
        >
          <p
            className="text-foreground truncate mb-1"
            style={{
              fontFamily: `'${(preset.layer.fontFamily || 'serif')}', serif`,
              fontSize: '14px',
              fontWeight: preset.layer.fontWeight || 400,
              fontStyle: preset.layer.fontStyle || 'normal',
              letterSpacing: `${Math.min(preset.layer.letterSpacing || 0, 4)}px`,
            }}
          >
            {preset.preview}
          </p>
          <p className="text-[9px] tracking-wider uppercase text-muted-foreground">{preset.label}</p>
        </button>
      ))}

      <button
        onClick={() => onApply({ id: 'blank', label: 'Blank', description: '', preview: '', layer: {} })}
        className="text-left p-3 rounded-xl border border-dashed border-border hover:border-foreground/20 bg-background transition-all active:scale-95 flex flex-col items-center justify-center gap-1"
      >
        <Plus className="h-5 w-5 text-muted-foreground" />
        <p className="text-[9px] tracking-wider uppercase text-muted-foreground">Blank Text</p>
      </button>
    </div>
  );
}

// ─── Font Panel ─────────────────────────────────

function FontPanel({ layer, onUpdate }: { layer: TextLayer; onUpdate: (p: Partial<TextLayer>) => void }) {
  const fontDef = FONT_LIBRARY.find(f => f.family === layer.fontFamily);
  const weights = fontDef?.weights || [400];

  return (
    <div className="flex flex-col gap-4">
      {/* Font picker */}
      <div>
        <label className="text-[9px] tracking-wider uppercase text-muted-foreground font-medium mb-1.5 block">Font Family</label>
        <FontPicker value={layer.fontFamily} onChange={(f) => onUpdate({ fontFamily: f })} />
      </div>

      {/* Weight selector */}
      {weights.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] tracking-wider uppercase text-muted-foreground">Weight</label>
          <div className="flex gap-1 flex-wrap">
            {weights.map((w) => (
              <button
                key={w}
                onClick={() => onUpdate({ fontWeight: w })}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] transition-all',
                  layer.fontWeight === w
                    ? 'bg-foreground text-background'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                )}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick toggles */}
      <div className="flex items-center gap-1.5">
        {fontDef?.hasItalic && (
          <button
            onClick={() => onUpdate({ fontStyle: layer.fontStyle === 'italic' ? 'normal' : 'italic' })}
            className={cn(
              'h-8 w-8 rounded-lg flex items-center justify-center transition-all',
              layer.fontStyle === 'italic' ? 'bg-foreground text-background' : 'bg-muted/50 text-muted-foreground'
            )}
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => onUpdate({ underline: !layer.underline })}
          className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center transition-all',
            layer.underline ? 'bg-foreground text-background' : 'bg-muted/50 text-muted-foreground'
          )}
        >
          <Underline className="h-3.5 w-3.5" />
        </button>
        {(['none', 'uppercase', 'lowercase'] as const).map(t => (
          <button
            key={t}
            onClick={() => onUpdate({ textTransform: t })}
            className={cn(
              'px-2 py-1.5 rounded-lg text-[10px] tracking-wider font-medium transition-all',
              layer.textTransform === t ? 'bg-foreground text-background' : 'bg-muted/50 text-muted-foreground'
            )}
          >
            {t === 'none' ? 'Aa' : t === 'uppercase' ? 'AA' : 'aa'}
          </button>
        ))}
      </div>

      {/* Font size */}
      <SliderRow label="Size" value={layer.fontSize} min={8} max={200} step={1} onChange={(v) => onUpdate({ fontSize: v })} suffix="px" />
    </div>
  );
}

// ─── Style Panel ────────────────────────────────

function StylePanel({ layer, onUpdate }: { layer: TextLayer; onUpdate: (p: Partial<TextLayer>) => void }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Letter spacing */}
      <SliderRow label="Spacing" value={layer.letterSpacing} min={-2} max={20} step={0.5} onChange={(v) => onUpdate({ letterSpacing: v })} suffix="px" />

      {/* Line height */}
      <SliderRow label="Line H" value={layer.lineHeight} min={0.8} max={3} step={0.1} onChange={(v) => onUpdate({ lineHeight: v })} />

      {/* Opacity */}
      <SliderRow label="Opacity" value={layer.opacity} min={0.1} max={1} step={0.05} onChange={(v) => onUpdate({ opacity: v })} />

      {/* Text alignment */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[9px] tracking-wider uppercase text-muted-foreground">Align</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((a) => {
            const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight;
            return (
              <button
                key={a}
                onClick={() => onUpdate({ alignment: a })}
                className={cn(
                  'flex-1 py-2 rounded-lg flex items-center justify-center transition-all',
                  layer.alignment === a ? 'bg-foreground text-background' : 'bg-muted/50 text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Color */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[9px] tracking-wider uppercase text-muted-foreground">Color</label>
        <div className="flex gap-2 items-center flex-wrap">
          {['#ffffff', '#000000', '#1A1A1A', '#F3EFE9', '#2B2A28', '#B7AA98', '#E74C3C', '#3498DB'].map((c) => (
            <button
              key={c}
              onClick={() => onUpdate({ color: c, gradientColors: null })}
              className={cn(
                'h-7 w-7 rounded-full border-2 transition-all active:scale-90',
                layer.color === c && !layer.gradientColors ? 'border-foreground scale-110' : 'border-border'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="h-7 w-7 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden relative">
            <span className="text-[8px] text-muted-foreground">+</span>
            <input
              type="color"
              value={layer.color}
              onChange={(e) => onUpdate({ color: e.target.value, gradientColors: null })}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

// ─── Advanced Panel ─────────────────────────────

function AdvancedPanel({ layer, onUpdate }: { layer: TextLayer; onUpdate: (p: Partial<TextLayer>) => void }) {
  const [showShadow, setShowShadow] = useState(!!layer.shadow);
  const [showStroke, setShowStroke] = useState(!!layer.stroke);
  const [showHighlight, setShowHighlight] = useState(!!layer.bgHighlight);
  const [showGradient, setShowGradient] = useState(!!layer.gradientColors);

  return (
    <div className="flex flex-col gap-3">
      {/* Drop Shadow */}
      <ToggleSection
        label="Drop Shadow"
        active={showShadow}
        onToggle={() => {
          if (showShadow) {
            onUpdate({ shadow: null });
            setShowShadow(false);
          } else {
            onUpdate({ shadow: { x: 0, y: 2, blur: 8, color: 'rgba(0,0,0,0.5)' } });
            setShowShadow(true);
          }
        }}
      >
        {layer.shadow && (
          <div className="pl-2 flex flex-col gap-2">
            <SliderRow label="Blur" value={layer.shadow.blur} min={0} max={30} step={1} onChange={(v) => onUpdate({ shadow: { ...layer.shadow!, blur: v } })} suffix="px" />
            <SliderRow label="Y" value={layer.shadow.y} min={-10} max={10} step={1} onChange={(v) => onUpdate({ shadow: { ...layer.shadow!, y: v } })} suffix="px" />
            <SliderRow label="X" value={layer.shadow.x} min={-10} max={10} step={1} onChange={(v) => onUpdate({ shadow: { ...layer.shadow!, x: v } })} suffix="px" />
          </div>
        )}
      </ToggleSection>

      {/* Text Stroke */}
      <ToggleSection
        label="Text Outline"
        active={showStroke}
        onToggle={() => {
          if (showStroke) {
            onUpdate({ stroke: null });
            setShowStroke(false);
          } else {
            onUpdate({ stroke: { width: 1, color: '#000000' } });
            setShowStroke(true);
          }
        }}
      >
        {layer.stroke && (
          <div className="pl-2 flex flex-col gap-2">
            <SliderRow label="Width" value={layer.stroke.width} min={0.5} max={5} step={0.5} onChange={(v) => onUpdate({ stroke: { ...layer.stroke!, width: v } })} suffix="px" />
            <div className="flex items-center gap-2">
              <label className="text-[9px] tracking-wider uppercase text-muted-foreground w-12 shrink-0">Color</label>
              <input
                type="color"
                value={layer.stroke.color}
                onChange={(e) => onUpdate({ stroke: { ...layer.stroke!, color: e.target.value } })}
                className="h-6 w-8 rounded border border-border cursor-pointer"
              />
            </div>
          </div>
        )}
      </ToggleSection>

      {/* Background Highlight */}
      <ToggleSection
        label="BG Highlight"
        active={showHighlight}
        onToggle={() => {
          if (showHighlight) {
            onUpdate({ bgHighlight: null });
            setShowHighlight(false);
          } else {
            onUpdate({ bgHighlight: 'rgba(0,0,0,0.5)' });
            setShowHighlight(true);
          }
        }}
      >
        {layer.bgHighlight && (
          <div className="pl-2 flex items-center gap-2">
            <label className="text-[9px] tracking-wider uppercase text-muted-foreground w-12 shrink-0">Color</label>
            <div className="flex gap-1.5">
              {['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.7)'].map(c => (
                <button
                  key={c}
                  onClick={() => onUpdate({ bgHighlight: c })}
                  className={cn(
                    'h-6 w-6 rounded border-2 transition-all',
                    layer.bgHighlight === c ? 'border-foreground' : 'border-border'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}
      </ToggleSection>

      {/* Gradient Text */}
      <ToggleSection
        label="Gradient Text"
        active={showGradient}
        onToggle={() => {
          if (showGradient) {
            onUpdate({ gradientColors: null });
            setShowGradient(false);
          } else {
            onUpdate({ gradientColors: ['#1A1A1A', '#F5E6A3'] });
            setShowGradient(true);
          }
        }}
      >
        {layer.gradientColors && (
          <div className="pl-2 flex items-center gap-2">
            <label className="text-[9px] tracking-wider uppercase text-muted-foreground w-12 shrink-0">From</label>
            <input
              type="color"
              value={layer.gradientColors[0]}
              onChange={(e) => onUpdate({ gradientColors: [e.target.value, layer.gradientColors![1]] })}
              className="h-6 w-8 rounded border border-border cursor-pointer"
            />
            <label className="text-[9px] tracking-wider uppercase text-muted-foreground shrink-0">To</label>
            <input
              type="color"
              value={layer.gradientColors[1]}
              onChange={(e) => onUpdate({ gradientColors: [layer.gradientColors![0], e.target.value] })}
              className="h-6 w-8 rounded border border-border cursor-pointer"
            />
          </div>
        )}
      </ToggleSection>
    </div>
  );
}

// ─── Toggle Section ─────────────────────────────

function ToggleSection({ label, active, onToggle, children }: {
  label: string; active: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all',
          active ? 'bg-foreground/10 text-foreground' : 'bg-muted/50 text-muted-foreground'
        )}
      >
        <span className="tracking-wider uppercase text-[9px] font-medium">{label}</span>
        {active ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {active && children}
    </div>
  );
}

// ─── Slider Row ─────────────────────────────────

function SliderRow({ label, value, min, max, step, onChange, suffix }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-[9px] tracking-wider uppercase text-muted-foreground w-12 shrink-0">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-foreground"
      />
      <span className="text-[10px] text-muted-foreground w-12 text-right tabular-nums">
        {Number.isInteger(value) ? value : value.toFixed(1)}{suffix || ''}
      </span>
    </div>
  );
}
