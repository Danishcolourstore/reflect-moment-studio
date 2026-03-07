/**
 * Draggable, rotatable, resizable text layer rendered on the grid canvas.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { RotateCw, Move, Pencil, Trash2 } from 'lucide-react';
import type { TextLayer } from './text-overlay-types';

interface Props {
  layer: TextLayer;
  selected: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (patch: Partial<TextLayer>) => void;
  onSelect: () => void;
  onDelete: () => void;
}

export default function TextOverlay({ layer, selected, containerRef, onUpdate, onSelect, onDelete }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [dragState, setDragState] = useState<{ type: 'move' | 'rotate'; startX: number; startY: number; origX: number; origY: number; origRot: number } | null>(null);

  // ─── Drag to move ─────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
    if (editing) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({ type: 'move', startX: e.clientX, startY: e.clientY, origX: layer.x, origY: layer.y, origRot: layer.rotation });
  }, [layer.x, layer.y, layer.rotation, onSelect, editing]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (dragState.type === 'move') {
      const dx = ((e.clientX - dragState.startX) / rect.width) * 100;
      const dy = ((e.clientY - dragState.startY) / rect.height) * 100;
      onUpdate({ x: Math.max(0, Math.min(100, dragState.origX + dx)), y: Math.max(0, Math.min(100, dragState.origY + dy)) });
    } else if (dragState.type === 'rotate') {
      const cx = rect.left + (layer.x / 100) * rect.width;
      const cy = rect.top + (layer.y / 100) * rect.height;
      const startAngle = Math.atan2(dragState.startY - cy, dragState.startX - cx);
      const curAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
      const deg = ((curAngle - startAngle) * 180) / Math.PI;
      onUpdate({ rotation: dragState.origRot + deg });
    }
  }, [dragState, containerRef, onUpdate, layer.x, layer.y]);

  const onPointerUp = useCallback(() => setDragState(null), []);

  // ─── Rotation handle ──────────────────────────
  const onRotateDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({ type: 'rotate', startX: e.clientX, startY: e.clientY, origX: layer.x, origY: layer.y, origRot: layer.rotation });
  }, [layer.x, layer.y, layer.rotation]);

  // ─── Inline edit ──────────────────────────────
  const startEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setEditing(true);
  }, [onSelect]);

  const handleBlur = useCallback(() => {
    setEditing(false);
  }, []);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    onUpdate({ text: (e.target as HTMLDivElement).textContent || '' });
  }, [onUpdate]);

  // Focus when entering edit mode
  useEffect(() => {
    if (editing && elRef.current) {
      const el = elRef.current.querySelector('[contenteditable]') as HTMLElement;
      if (el) {
        el.focus();
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [editing]);

  const textStyle: React.CSSProperties = {
    fontFamily: `'${layer.fontFamily}', serif`,
    fontSize: `${layer.fontSize}px`,
    fontWeight: layer.fontWeight,
    fontStyle: layer.fontStyle,
    letterSpacing: `${layer.letterSpacing}px`,
    lineHeight: layer.lineHeight,
    color: layer.color,
    opacity: layer.opacity,
    textAlign: layer.alignment,
    textTransform: layer.textTransform,
    textShadow: layer.shadow
      ? `${layer.shadow.x}px ${layer.shadow.y}px ${layer.shadow.blur}px ${layer.shadow.color}`
      : 'none',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    WebkitTapHighlightColor: 'transparent',
    userSelect: editing ? 'text' : 'none',
  };

  return (
    <div
      ref={elRef}
      className="absolute"
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale})`,
        zIndex: selected ? 30 : 20,
        cursor: editing ? 'text' : 'grab',
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Selection border */}
      {selected && (
        <div className="absolute -inset-3 border border-white/60 rounded-lg pointer-events-none" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.2)' }} />
      )}

      {/* Text content */}
      {editing ? (
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur}
          onInput={handleInput}
          style={{ ...textStyle, outline: 'none', minWidth: '40px', padding: '2px 4px' }}
        >
          {layer.text}
        </div>
      ) : (
        <div
          style={textStyle}
          onDoubleClick={startEdit}
        >
          {layer.text}
        </div>
      )}

      {/* Controls — visible when selected */}
      {selected && !editing && (
        <>
          {/* Edit button */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={startEdit}
            className="absolute -top-10 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-white"
          >
            <Pencil className="h-3 w-3" />
          </button>

          {/* Delete button */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute -top-10 left-1/2 translate-x-3 h-7 w-7 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-red-400"
          >
            <Trash2 className="h-3 w-3" />
          </button>

          {/* Rotate handle */}
          <div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-white cursor-grab active:cursor-grabbing"
            onPointerDown={onRotateDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <RotateCw className="h-3 w-3" />
          </div>
        </>
      )}
    </div>
  );
}
