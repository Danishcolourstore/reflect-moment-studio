import { useState, useEffect } from "react";
import {
  ArrowLeft, Undo2, Redo2, ZoomIn, ZoomOut, Maximize, Eye, Download, Wand2,
  Grid3X3, Ruler, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AlbumStatus } from "./types";

const STATUS_BADGE: Record<AlbumStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  review: { label: "In Review", className: "bg-amber-100 text-amber-800 " },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800 " },
  print: { label: "Sent to Print", className: "bg-primary/10 text-primary" },
};

const STATUS_ACTIONS: Partial<Record<AlbumStatus, { label: string; next: AlbumStatus }>> = {
  draft: { label: "Send for Review", next: "review" },
  review: { label: "Mark Approved", next: "approved" },
  approved: { label: "Send to Print", next: "print" },
};

interface Props {
  albumName: string;
  onNameChange: (name: string) => void;
  onBack: () => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: "saved" | "saving" | "unsaved";
  albumStatus: AlbumStatus;
  onStatusChange: (status: AlbumStatus) => void;
  onAutoLayout: () => void;
  onPreview: () => void;
  onExport: () => void;
  showBleed: boolean;
  showGrid: boolean;
  onToggleBleed: () => void;
  onToggleGrid: () => void;
}

export default function AlbumEditorToolbar({
  albumName, onNameChange, onBack, zoom, onZoomChange,
  onUndo, onRedo, canUndo, canRedo, saveStatus,
  albumStatus, onStatusChange, onAutoLayout, onPreview, onExport,
  showBleed, showGrid, onToggleBleed, onToggleGrid,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(albumName);
  const badge = STATUS_BADGE[albumStatus];
  const action = STATUS_ACTIONS[albumStatus];

  useEffect(() => { setDraft(albumName); }, [albumName]);

  const saveName = () => {
    if (draft.trim() && draft !== albumName) onNameChange(draft.trim());
    setEditing(false);
  };

  return (
    <header className="bg-card/95 backdrop-blur-xl border-b border-border/60 z-50 shrink-0">
      <div className="h-11 flex items-center justify-between px-2 gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {editing ? (
            <Input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
              onBlur={saveName} onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setDraft(albumName); setEditing(false); } }}
              className="h-7 text-sm font-medium w-32 md:w-48" />
          ) : (
            <button onClick={() => setEditing(true)} className="text-sm font-medium truncate max-w-[100px] md:max-w-[200px] hover:text-primary transition-colors">
              {albumName}
            </button>
          )}
          <Badge variant="secondary" className={cn("text-[10px] shrink-0 hidden sm:inline-flex", badge.className)}>{badge.label}</Badge>
          <div className={cn(
            "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full tracking-wide uppercase font-medium shrink-0",
            saveStatus === "saved" ? "text-emerald-600 bg-emerald-50 "
              : saveStatus === "saving" ? "text-amber-600 bg-amber-50 "
                : "text-muted-foreground bg-muted"
          )}>
            {saveStatus === "saved" ? (
              <span className="inline-flex items-center gap-1"><Check size={12} strokeWidth={1.5} /> Saved</span>
            ) : saveStatus === "saving" ? "Saving…" : "Unsaved"}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex" onClick={onUndo} disabled={!canUndo}>
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex" onClick={onRedo} disabled={!canRedo}>
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
          {action && (
            <Button variant="outline" size="sm" className="h-8 text-xs hidden md:flex" onClick={() => onStatusChange(action.next)}>
              {action.label}
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1 hidden sm:flex" onClick={onPreview}>
            <Eye className="h-3.5 w-3.5" /><span className="hidden md:inline">Preview</span>
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={onExport}>
            <Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      <div className="h-9 flex items-center px-2 gap-2 border-t border-border/40 overflow-x-auto scrollbar-none">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={onAutoLayout}>
          <Wand2 className="h-3 w-3" /> Create Automatically
        </Button>

        <div className="h-4 w-px bg-border shrink-0" />

        <Button variant={showBleed ? "default" : "ghost"} size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={onToggleBleed}>
          <Ruler className="h-3 w-3" /> Bleed
        </Button>
        <Button variant={showGrid ? "default" : "ghost"} size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={onToggleGrid}>
          <Grid3X3 className="h-3 w-3" /> Grid
        </Button>

        <div className="h-4 w-px bg-border shrink-0" />

        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onZoomChange(Math.max(25, zoom - 25))}>
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground w-9 text-center tabular-nums">{zoom}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onZoomChange(Math.min(300, zoom + 25))}>
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onZoomChange(100)}>
            <Maximize className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center gap-1 sm:hidden shrink-0 ml-auto">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onUndo} disabled={!canUndo}>
            <Undo2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRedo} disabled={!canRedo}>
            <Redo2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </header>
  );
}
