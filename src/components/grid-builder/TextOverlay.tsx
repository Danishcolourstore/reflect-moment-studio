/**
 * Draggable, rotatable, resizable text layer rendered on the grid canvas.
 * Uses a controlled <textarea> for stable input on mobile.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { RotateCw, Pencil, Trash2 } from 'lucide-react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [editing, setEditing] = useState(false);
  const [localText, setLocalText] = useState(layer.text);
  const [dragState, setDragState] = useState<{ type: 'move' | 'rotate'; startX: number; startY: number; origX: number; origY: number; origRot: number } | null>(null);

  // Sync local text when layer text changes externally (not while editing)
  useEffect(() => {
    if (!editing) {
      setLocalText(layer.text);
    }
  }, [layer.text, editing]);

  // ─── Drag to move ─────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Don't start drag if target is textarea or inside editing area
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.closest('[data-text-edit]')) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
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
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({ type: 'rotate', startX: e.clientX, startY: e.clientY, origX: layer.x, origY: layer.y, origRot: layer.rotation });
  }, [layer.x, layer.y, layer.rotation]);

  // ─── Enter edit mode ──────────────────────────
  const startEdit = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    setEditing(true);
  }, [onSelect]);

  // ─── Commit on blur ───────────────────────────
  const handleBlur = useCallback(() => {
    setEditing(false);
    onUpdate({ text: localText });
  }, [localText, onUpdate]);

  // ─── Controlled text change ───────────────────
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalText(e.target.value);
  }, []);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (editing && textareaRef.current) {
      const ta = textareaRef.current;
      ta.focus();
      // Place cursor at end
      const len = ta.value.length;
      ta.setSelectionRange(len, len);
    }
  }, [editing]);

  // Stop all touch/pointer events from bubbling out of the editing textarea
  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

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
        touchAction: editing ? 'auto' : 'none',
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
        <div data-text-edit="true">
          <textarea
            ref={textareaRef}
            value={localText}
            onChange={handleChange}
            onBlur={handleBlur}
            onPointerDown={stopPropagation}
            onTouchStart={stopPropagation}
            onClick={stopPropagation}
            onKeyDown={stopPropagation}
            rows={1}
            style={{
              ...textStyle,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden',
              minWidth: '60px',
              padding: '2px 4px',
              display: 'block',
              width: '100%',
              caretColor: layer.color,
              // Match dimensions to content
              
            }}
          />
        </div>
      ) : (
        <div
          style={textStyle}
          onDoubleClick={startEdit}
          onTouchEnd={(e) => {
            // Single tap on selected text enters edit mode on mobile
            if (selected) {
              startEdit(e);
            }
          }}
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
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onClick={startEdit}
            className="absolute -top-10 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-white"
          >
            <Pencil className="h-3 w-3" />
          </button>

          {/* Delete button */}
          <button
            type="button"
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
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
