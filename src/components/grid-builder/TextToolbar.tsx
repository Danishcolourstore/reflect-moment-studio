/**
 * Text controls toolbar for Grid Builder text overlays.
 * Provides font selection, presets, and fine-grained typography controls.
 */

import { useState } from 'react';
import { Type, AlignLeft, AlignCenter, AlignRight, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FONTS, FONT_GROUPS, TEXT_PRESETS,
  createTextLayer,
  type TextLayer, type FontOption,
} from './text-overlay-types';

interface Props {
  layers: TextLayer[];
  selectedId: string | null;
  onAddLayer: (layer: TextLayer) => void;
  onUpdateLayer: (id: string, patch: Partial<TextLayer>) => void;
}

type Panel = 'presets' | 'font' | 'style' | null;

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
        <button
          onClick={() => togglePanel('presets')}
          className={cn(
            'flex-1 py-2.5 text-[10px] tracking-widest uppercase font-medium flex items-center justify-center gap-1.5 transition-colors',
            panel === 'presets' ? 'text-foreground bg-muted/30' : 'text-muted-foreground'
          )}
        >
          <Plus className="h-3.5 w-3.5" /> Presets
        </button>
        <button
          onClick={() => togglePanel('font')}
          className={cn(
            'flex-1 py-2.5 text-[10px] tracking-widest uppercase font-medium flex items-center justify-center gap-1.5 transition-colors',
            panel === 'font' ? 'text-foreground bg-muted/30' : 'text-muted-foreground',
            !selected && 'opacity-40 pointer-events-none'
          )}
        >
          <Type className="h-3.5 w-3.5" /> Font
        </button>
        <button
          onClick={() => togglePanel('style')}
          className={cn(
            'flex-1 py-2.5 text-[10px] tracking-widest uppercase font-medium flex items-center justify-center gap-1.5 transition-colors',
            panel === 'style' ? 'text-foreground bg-muted/30' : 'text-muted-foreground',
            !selected && 'opacity-40 pointer-events-none'
          )}
        >
          Style
        </button>
      </div>

      {/* Panel content */}
      {panel && (
        <div className="max-h-[280px] overflow-y-auto px-4 py-3">
          {panel === 'presets' && <PresetsPanel onApply={applyPreset} />}
          {panel === 'font' && selected && <FontPanel layer={selected} onUpdate={update} />}
          {panel === 'style' && selected && <StylePanel layer={selected} onUpdate={update} />}
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

      {/* Blank text */}
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
  const [group, setGroup] = useState<'serif' | 'sans' | 'script'>('serif');
  const filtered = FONTS.filter((f) => f.group === group);

  return (
    <div className="flex flex-col gap-3">
      {/* Group tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-full p-1">
        {FONT_GROUPS.map((g) => (
          <button
            key={g.key}
            onClick={() => setGroup(g.key)}
            className={cn(
              'flex-1 text-[9px] tracking-wider uppercase font-medium py-1.5 rounded-full transition-all',
              group === g.key ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground'
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Font list */}
      <div className="flex flex-col gap-1">
        {filtered.map((font) => (
          <button
            key={font.family}
            onClick={() => onUpdate({ fontFamily: font.family })}
            className={cn(
              'w-full text-left px-3 py-2.5 rounded-lg transition-all active:scale-[0.98]',
              layer.fontFamily === font.family
                ? 'bg-foreground/10 border border-foreground/20'
                : 'hover:bg-muted/50'
            )}
          >
            <span
              style={{ fontFamily: `'${font.family}', serif`, fontSize: '16px' }}
              className="text-foreground"
            >
              {font.label}
            </span>
          </button>
        ))}
      </div>

      {/* Weight selector */}
      {(() => {
        const currentFont = FONTS.find((f) => f.family === layer.fontFamily);
        if (!currentFont || currentFont.weights.length <= 1) return null;
        return (
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] tracking-wider uppercase text-muted-foreground">Weight</label>
            <div className="flex gap-1 flex-wrap">
              {currentFont.weights.map((w) => (
                <button
                  key={w}
                  onClick={() => onUpdate({ fontWeight: w })}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs transition-all',
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
        );
      })()}

      {/* Italic toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdate({ fontStyle: layer.fontStyle === 'italic' ? 'normal' : 'italic' })}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs transition-all',
            layer.fontStyle === 'italic'
              ? 'bg-foreground text-background'
              : 'bg-muted/50 text-muted-foreground'
          )}
        >
          <em>Italic</em>
        </button>
        <button
          onClick={() => onUpdate({ textTransform: layer.textTransform === 'uppercase' ? 'none' : 'uppercase' })}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs tracking-wider transition-all',
            layer.textTransform === 'uppercase'
              ? 'bg-foreground text-background'
              : 'bg-muted/50 text-muted-foreground'
          )}
        >
          AA
        </button>
      </div>
    </div>
  );
}

// ─── Style Panel ────────────────────────────────

function StylePanel({ layer, onUpdate }: { layer: TextLayer; onUpdate: (p: Partial<TextLayer>) => void }) {
  const [showShadow, setShowShadow] = useState(!!layer.shadow);

  return (
    <div className="flex flex-col gap-4">
      {/* Font size */}
      <SliderRow label="Size" value={layer.fontSize} min={8} max={72} step={1} onChange={(v) => onUpdate({ fontSize: v })} suffix="px" />

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
        <div className="flex gap-2 items-center">
          {['#ffffff', '#000000', '#D4AF37', '#F3EFE9', '#2B2A28', '#B7AA98'].map((c) => (
            <button
              key={c}
              onClick={() => onUpdate({ color: c })}
              className={cn(
                'h-8 w-8 rounded-full border-2 transition-all active:scale-90',
                layer.color === c ? 'border-foreground scale-110' : 'border-border'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="h-8 w-8 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden relative">
            <span className="text-[8px] text-muted-foreground">+</span>
            <input
              type="color"
              value={layer.color}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Shadow toggle + controls */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            if (showShadow) {
              onUpdate({ shadow: null });
              setShowShadow(false);
            } else {
              onUpdate({ shadow: { x: 0, y: 2, blur: 8, color: 'rgba(0,0,0,0.5)' } });
              setShowShadow(true);
            }
          }}
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all',
            showShadow ? 'bg-foreground/10 text-foreground' : 'bg-muted/50 text-muted-foreground'
          )}
        >
          <span className="tracking-wider uppercase text-[9px] font-medium">Shadow</span>
          {showShadow ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showShadow && layer.shadow && (
          <div className="pl-2 flex flex-col gap-2">
            <SliderRow label="Blur" value={layer.shadow.blur} min={0} max={30} step={1} onChange={(v) => onUpdate({ shadow: { ...layer.shadow!, blur: v } })} suffix="px" />
            <SliderRow label="Y" value={layer.shadow.y} min={-10} max={10} step={1} onChange={(v) => onUpdate({ shadow: { ...layer.shadow!, y: v } })} suffix="px" />
          </div>
        )}
      </div>
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
