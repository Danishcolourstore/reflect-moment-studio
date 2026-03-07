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
    <div className="flex flex-col gap-0 bg-card border-t border-border">
      {/* Shape selection */}
      <div className="px-4 py-3">
        <label className="text-[9px] tracking-wider uppercase text-muted-foreground mb-2 block">Add Shape</label>
        <div className="flex gap-2">
          {SHAPE_PRESETS.map((s) => (
            <button
              key={s.type}
              onClick={() => onAddElement(createDesignElement(s.type))}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border border-border hover:border-foreground/20 bg-background transition-all active:scale-95"
            >
              <span className="text-lg text-foreground">{s.icon}</span>
              <span className="text-[8px] tracking-wider uppercase text-muted-foreground">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Controls for selected element */}
      {selected && (
        <div className="px-4 pb-3 flex flex-col gap-3 border-t border-border pt-3">
          {/* Color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] tracking-wider uppercase text-muted-foreground">Color</label>
            <div className="flex gap-2 items-center">
              {['#ffffff', '#000000', '#D4AF37', '#F3EFE9', '#2B2A28', '#B7AA98'].map((c) => (
                <button
                  key={c}
                  onClick={() => onUpdateElement(selectedId!, { color: c, borderColor: c })}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-all active:scale-90',
                    selected.color === c ? 'border-foreground scale-110' : 'border-border'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <label className="h-7 w-7 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer relative overflow-hidden">
                <span className="text-[8px] text-muted-foreground">+</span>
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
          <div className="flex items-center gap-3">
            <label className="text-[9px] tracking-wider uppercase text-muted-foreground w-12 shrink-0">Opacity</label>
            <input type="range" min={0.05} max={1} step={0.05} value={selected.opacity}
              onChange={(e) => onUpdateElement(selectedId!, { opacity: parseFloat(e.target.value) })}
              className="flex-1 h-1 accent-foreground" />
            <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{(selected.opacity * 100).toFixed(0)}%</span>
          </div>

          {/* Size */}
          <div className="flex items-center gap-3">
            <label className="text-[9px] tracking-wider uppercase text-muted-foreground w-12 shrink-0">Width</label>
            <input type="range" min={10} max={400} step={2} value={selected.width}
              onChange={(e) => onUpdateElement(selectedId!, { width: parseFloat(e.target.value) })}
              className="flex-1 h-1 accent-foreground" />
            <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{selected.width}px</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[9px] tracking-wider uppercase text-muted-foreground w-12 shrink-0">Height</label>
            <input type="range" min={1} max={400} step={2} value={selected.height}
              onChange={(e) => onUpdateElement(selectedId!, { height: parseFloat(e.target.value) })}
              className="flex-1 h-1 accent-foreground" />
            <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{selected.height}px</span>
          </div>

          {/* Fill toggle */}
          {selected.type !== 'line' && selected.type !== 'divider' && (
            <button
              onClick={() => onUpdateElement(selectedId!, { filled: !selected.filled, borderWidth: selected.filled ? 1.5 : 0 })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs transition-all self-start',
                selected.filled ? 'bg-foreground text-background' : 'bg-muted/50 text-muted-foreground'
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
