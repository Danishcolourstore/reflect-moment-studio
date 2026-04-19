/**
 * Toolbar for adding and editing design elements (shapes) in Grid Builder.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SHAPE_PRESETS, createDesignElement, type DesignElement, type ShapeType } from './element-types';

interface Props {
  elements: DesignElement[];
  selectedId: string | null;
  onAddElement: (el: DesignElement) => void;
  onUpdateElement: (id: string, patch: Partial<DesignElement>) => void;
}

export default function ElementToolbar({ elements, selectedId, onAddElement, onUpdateElement }: Props) {
  const selected = elements.find((e) => e.id === selectedId);

  return (
    <div className="bg-card border-t border-border/60">
      {/* Shape selection */}
      <div className="px-4 py-4">
        <label className="text-[9px] tracking-[0.14em] uppercase text-muted-foreground/60 font-medium mb-3 block">Add Shape</label>
        <div className="flex gap-2">
          {SHAPE_PRESETS.map((s) => (
            <button
              key={s.type}
              onClick={() => onAddElement(createDesignElement(s.type))}
              className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg border border-border/60 hover:border-foreground/20 hover:bg-muted/30 bg-background transition-all duration-200 active:scale-95"
            >
              <span className="text-lg text-foreground/80">{s.icon}</span>
              <span className="text-[8px] tracking-wider uppercase text-muted-foreground/50">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Controls for selected element */}
      {selected && (
        <div className="px-4 pb-4 flex flex-col gap-4 border-t border-border/40 pt-4">
          {/* Color */}
          <div className="flex flex-col gap-2">
            <label className="text-[9px] tracking-[0.14em] uppercase text-muted-foreground/60 font-medium">Color</label>
            <div className="flex gap-2 items-center">
              {['#ffffff', '#000000', '#B8953F', '#F3EFE9', '#2B2A28', '#B7AA98'].map((c) => (
                <button
                  key={c}
                  onClick={() => onUpdateElement(selectedId!, { color: c, borderColor: c })}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-all duration-200 active:scale-90',
                    selected.color === c ? 'border-foreground scale-110' : 'border-border/60 hover:border-foreground/30'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <label className="h-7 w-7 rounded-full border-2 border-dashed border-border/60 flex items-center justify-center cursor-pointer relative overflow-hidden hover:border-foreground/30 transition-colors duration-200">
                <span className="text-[8px] text-muted-foreground/40">+</span>
                <input
                  type="color"
                  value={selected.color}
                  onChange={(e) => onUpdateElement(selectedId!, { color: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Opacity */}
          <SliderRow label="Opacity" value={selected.opacity} min={0.05} max={1} step={0.05}
            onChange={(v) => onUpdateElement(selectedId!, { opacity: v })}
            format={(v) => `${(v * 100).toFixed(0)}%`} />

          {/* Size */}
          <SliderRow label="Width" value={selected.width} min={10} max={400} step={2}
            onChange={(v) => onUpdateElement(selectedId!, { width: v })}
            format={(v) => `${v}px`} />
          <SliderRow label="Height" value={selected.height} min={1} max={400} step={2}
            onChange={(v) => onUpdateElement(selectedId!, { height: v })}
            format={(v) => `${v}px`} />

          {/* Fill toggle */}
          {selected.type !== 'line' && selected.type !== 'divider' && (
            <button
              onClick={() => onUpdateElement(selectedId!, { filled: !selected.filled, borderWidth: selected.filled ? 1.5 : 0 })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[10px] tracking-wider uppercase font-medium transition-all duration-200 self-start',
                selected.filled ? 'bg-foreground text-background' : 'bg-muted/40 text-muted-foreground hover:text-foreground'
              )}
            >
              {selected.filled ? 'Filled' : 'Outline'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-[9px] tracking-[0.14em] uppercase text-muted-foreground/60 font-medium w-12 shrink-0">{label}</label>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-foreground" />
      <span className="text-[10px] text-muted-foreground/60 w-12 text-right tabular-nums">{format(value)}</span>
    </div>
  );
}
