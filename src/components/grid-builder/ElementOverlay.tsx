/**
 * Draggable, rotatable design element overlay for Grid Builder.
 */

import { useCallback, useState } from 'react';
import { RotateCw, Trash2 } from 'lucide-react';
import type { DesignElement } from './element-types';

interface Props {
  element: DesignElement;
  selected: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (patch: Partial<DesignElement>) => void;
  onSelect: () => void;
  onDelete: () => void;
}

export default function ElementOverlay({ element, selected, containerRef, onUpdate, onSelect, onDelete }: Props) {
  const [dragState, setDragState] = useState<{
    type: 'move' | 'rotate' | 'resize';
    startX: number; startY: number;
    origX: number; origY: number; origRot: number;
    origW: number; origH: number;
  } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({
      type: 'move', startX: e.clientX, startY: e.clientY,
      origX: element.x, origY: element.y, origRot: element.rotation,
      origW: element.width, origH: element.height,
    });
  }, [element, onSelect]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (dragState.type === 'move') {
      const dx = ((e.clientX - dragState.startX) / rect.width) * 100;
      const dy = ((e.clientY - dragState.startY) / rect.height) * 100;
      onUpdate({
        x: Math.max(0, Math.min(100, dragState.origX + dx)),
        y: Math.max(0, Math.min(100, dragState.origY + dy)),
      });
    } else if (dragState.type === 'rotate') {
      const cx = rect.left + (element.x / 100) * rect.width;
      const cy = rect.top + (element.y / 100) * rect.height;
      const startAngle = Math.atan2(dragState.startY - cy, dragState.startX - cx);
      const curAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
      onUpdate({ rotation: dragState.origRot + ((curAngle - startAngle) * 180) / Math.PI });
    } else if (dragState.type === 'resize') {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      onUpdate({
        width: Math.max(10, dragState.origW + dx),
        height: Math.max(2, dragState.origH + dy),
      });
    }
  }, [dragState, containerRef, onUpdate, element.x, element.y]);

  const onPointerUp = useCallback(() => setDragState(null), []);

  const onRotateDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({
      type: 'rotate', startX: e.clientX, startY: e.clientY,
      origX: element.x, origY: element.y, origRot: element.rotation,
      origW: element.width, origH: element.height,
    });
  }, [element]);

  const onResizeDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({
      type: 'resize', startX: e.clientX, startY: e.clientY,
      origX: element.x, origY: element.y, origRot: element.rotation,
      origW: element.width, origH: element.height,
    });
  }, [element]);

  const shapeStyle: React.CSSProperties = {
    width: `${element.width}px`,
    height: `${element.height}px`,
    backgroundColor: element.filled ? element.color : 'transparent',
    opacity: element.opacity,
    borderRadius: element.type === 'circle' ? '50%' : `${element.borderRadius}px`,
    border: element.borderWidth ? `${element.borderWidth}px solid ${element.borderColor}` : 'none',
  };

  return (
    <div
      className="absolute"
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
        zIndex: selected ? 25 : 15,
        cursor: 'grab',
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {selected && (
        <div className="absolute -inset-2 border border-white/60 rounded pointer-events-none" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.2)' }} />
      )}

      <div style={shapeStyle} />

      {selected && (
        <>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-red-400"
          >
            <Trash2 className="h-3 w-3" />
          </button>

          <div
            className="absolute -bottom-7 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-white cursor-grab active:cursor-grabbing"
            onPointerDown={onRotateDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <RotateCw className="h-3 w-3" />
          </div>

          <div
            className="absolute -right-2 -bottom-2 h-4 w-4 rounded-full bg-white border-2 border-foreground cursor-se-resize"
            onPointerDown={onResizeDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        </>
      )}
    </div>
  );
}
