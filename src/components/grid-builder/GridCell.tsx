import { useRef, useState, useCallback } from 'react';
import { Plus, X, RefreshCw } from 'lucide-react';
import type { GridCellData } from './types';

interface Props {
  cell: GridCellData;
  gridArea: string;
  onImageAdd: (file: File) => void;
  onImageRemove: () => void;
  onOffsetChange: (dx: number, dy: number) => void;
}

export default function GridCell({ cell, gridArea, onImageAdd, onImageRemove, onOffsetChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onImageAdd(f);
    e.target.value = '';
  }, [onImageAdd]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!cell.imageUrl) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: cell.offsetX, origY: cell.offsetY };
    setDragging(true);
  }, [cell]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    onOffsetChange(dragRef.current.origX + dx, dragRef.current.origY + dy);
  }, [onOffsetChange]);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  return (
    <div
      className="relative overflow-hidden bg-muted/30 border border-border/50 group"
      style={{ gridArea }}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {cell.imageUrl ? (
        <>
          <img
            src={cell.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover select-none"
            style={{
              transform: `translate(${cell.offsetX}px, ${cell.offsetY}px) scale(${cell.scale})`,
              cursor: dragging ? 'grabbing' : 'grab',
            }}
            draggable={false}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
          {/* Controls overlay */}
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={() => inputRef.current?.click()}
              className="h-7 w-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground/70 hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
            <button
              onClick={onImageRemove}
              className="h-7 w-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-destructive/70 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span className="text-[10px] tracking-wider uppercase">Tap to upload</span>
        </button>
      )}
    </div>
  );
}
