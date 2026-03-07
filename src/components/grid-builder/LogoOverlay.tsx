/**
 * Logo/watermark overlay — draggable, resizable, with opacity control.
 */

import { useCallback, useState } from 'react';
import { Trash2, Move } from 'lucide-react';

export interface LogoLayer {
  id: string;
  imageUrl: string;
  file: File;
  x: number;   // %
  y: number;   // %
  width: number;  // px at 440 display
  opacity: number;
  rotation: number;
}

let _logoId = 0;
export function createLogoLayer(file: File): LogoLayer {
  _logoId++;
  return {
    id: `logo-${Date.now()}-${_logoId}`,
    imageUrl: URL.createObjectURL(file),
    file,
    x: 85,
    y: 90,
    width: 60,
    opacity: 0.7,
    rotation: 0,
  };
}

interface Props {
  logo: LogoLayer;
  selected: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (patch: Partial<LogoLayer>) => void;
  onSelect: () => void;
  onDelete: () => void;
}

export default function LogoOverlayComponent({ logo, selected, containerRef, onUpdate, onSelect, onDelete }: Props) {
  const [dragState, setDragState] = useState<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({ startX: e.clientX, startY: e.clientY, origX: logo.x, origY: logo.y });
  }, [logo.x, logo.y, onSelect]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragState.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragState.startY) / rect.height) * 100;
    onUpdate({
      x: Math.max(0, Math.min(100, dragState.origX + dx)),
      y: Math.max(0, Math.min(100, dragState.origY + dy)),
    });
  }, [dragState, containerRef, onUpdate]);

  const onPointerUp = useCallback(() => setDragState(null), []);

  return (
    <div
      className="absolute"
      style={{
        left: `${logo.x}%`,
        top: `${logo.y}%`,
        transform: `translate(-50%, -50%) rotate(${logo.rotation}deg)`,
        zIndex: selected ? 28 : 18,
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

      <img
        src={logo.imageUrl}
        alt="Logo"
        style={{
          width: `${logo.width}px`,
          height: 'auto',
          opacity: logo.opacity,
          pointerEvents: 'none',
        }}
        draggable={false}
      />

      {selected && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-7 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-red-400"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
