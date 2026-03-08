import { useState } from 'react';
import { ArrowLeft, Undo2, Redo2, ZoomIn, ZoomOut, Maximize, Eye, Download, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  albumName: string;
  onNameChange: (name: string) => void;
  onBack: () => void;
  spreadView: boolean;
  onToggleSpread: () => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
}

export default function AlbumEditorToolbar({
  albumName, onNameChange, onBack, spreadView, onToggleSpread,
  zoom, onZoomChange, onUndo, onRedo, canUndo, canRedo, saveStatus,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(albumName);

  return (
    <header className="h-12 flex items-center justify-between px-3 bg-card/95 backdrop-blur-xl border-b border-border/60 z-50 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-2 min-w-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { onNameChange(draft); setEditing(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onNameChange(draft); setEditing(false); } }}
            className="h-7 text-sm font-medium w-48"
          />
        ) : (
          <button onClick={() => { setDraft(albumName); setEditing(true); }} className="text-sm font-medium truncate max-w-[200px] hover:text-primary transition-colors">
            {albumName}
          </button>
        )}
        <span className={cn(
          'text-[10px] px-2 py-0.5 rounded-full tracking-wide uppercase font-medium',
          saveStatus === 'saved' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' :
          saveStatus === 'saving' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' :
          'text-muted-foreground bg-muted'
        )}>
          {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving…' : 'Unsaved'}
        </span>
      </div>

      {/* Center */}
      <div className="flex items-center gap-1">
        <div className="flex bg-muted/50 rounded-lg p-0.5">
          <button
            onClick={() => spreadView && onToggleSpread()}
            className={cn('px-3 py-1 rounded-md text-xs font-medium transition-all', !spreadView ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            Single Page
          </button>
          <button
            onClick={() => !spreadView && onToggleSpread()}
            className={cn('px-3 py-1 rounded-md text-xs font-medium transition-all', spreadView ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            Spread View
          </button>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
        <div className="h-5 w-px bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onZoomChange(Math.max(25, zoom - 25))}>
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">{zoom}%</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onZoomChange(Math.min(200, zoom + 25))}>
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onZoomChange(100)} title="Fit">
          <Maximize className="h-3.5 w-3.5" />
        </Button>
        <div className="h-5 w-px bg-border mx-1" />
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
          <Eye className="h-3.5 w-3.5" /> Preview
        </Button>
        <Button size="sm" className="h-8 text-xs gap-1.5">
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>
    </header>
  );
}
