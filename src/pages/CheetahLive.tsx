import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useCheetah, type CheetahPhoto } from '@/hooks/use-cheetah';
import { useFolderWatcher } from '@/hooks/use-folder-watcher';
import {
  Zap, Plus, Upload, Star, X as XIcon, Heart, ArrowLeft, ArrowRight,
  Eye, Camera, Activity, Loader2, ChevronDown, Sparkles, Image,
  FolderOpen, FolderSync, Square, Radio, Wifi, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import CheetahCameraUpload from '@/components/cheetah/CheetahCameraUpload';

type FilterMode = 'all' | 'pick' | 'reject' | 'favorite' | 'unreviewed';

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color =
    score >= 85 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
    score >= 60 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
    'bg-red-500/20 text-red-400 border-red-500/30';
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${color}`}>
      {score}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-muted-foreground/40 animate-pulse',
    processing: 'bg-yellow-400 animate-pulse',
    completed: 'bg-green-400',
    failed: 'bg-red-400',
  };
  return <span className={`h-2.5 w-2.5 rounded-full ${colors[status] || colors.pending}`} />;
}

function CullBadge({ status }: { status: string }) {
  if (status === 'unreviewed') return null;
  const cfg: Record<string, { icon: typeof Star; color: string; label: string }> = {
    pick: { icon: Star, color: 'bg-green-500/20 text-green-400', label: 'Pick' },
    reject: { icon: XIcon, color: 'bg-red-500/20 text-red-400', label: 'Reject' },
    favorite: { icon: Heart, color: 'bg-purple-500/20 text-purple-400', label: 'Fav' },
  };
  const c = cfg[status];
  if (!c) return null;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-lg ${c.color}`}>
      <c.icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}

function PhotoCard({
  photo, isSelected, onSelect, onCull,
}: {
  photo: CheetahPhoto; isSelected: boolean;
  onSelect: () => void; onCull: (status: 'pick' | 'reject' | 'favorite') => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`relative rounded-xl overflow-hidden border transition-all cursor-pointer ${
        isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border active:border-primary/30'
      }`}
    >
      <div className="aspect-square bg-muted">
        <img
          src={photo.thumbnail_url || photo.original_url}
          alt={photo.file_name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
        <StatusDot status={photo.ai_status} />
        <ScoreBadge score={photo.ai_score} />
      </div>

      {photo.is_best_in_burst && (
        <div className="absolute top-1.5 right-1.5">
          <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-lg bg-accent/20 text-accent border border-accent/30">
            <Sparkles className="h-3 w-3" /> Best
          </span>
        </div>
      )}

      <div className="absolute bottom-1.5 left-1.5">
        <CullBadge status={photo.cull_status} />
      </div>

      {/* Quick cull — visible on touch (no hover needed) */}
      <div className="absolute bottom-1.5 right-1.5 flex gap-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); onCull('pick'); }}
          className="h-8 w-8 rounded-full bg-green-500/80 flex items-center justify-center text-white active:bg-green-600"
          aria-label="Pick"
        >
          <Star className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onCull('reject'); }}
          className="h-8 w-8 rounded-full bg-red-500/80 flex items-center justify-center text-white active:bg-red-600"
          aria-label="Reject"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function PhotoDetail({
  photo, onClose, onCull, onPrev, onNext, hasPrev, hasNext, isMobile,
}: {
  photo: CheetahPhoto; onClose: () => void;
  onCull: (status: 'pick' | 'reject' | 'favorite' | 'unreviewed') => void;
  onPrev: () => void; onNext: () => void; hasPrev: boolean; hasNext: boolean;
  isMobile: boolean;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'Escape') onClose();
      if (e.key === 'p' || e.key === 'P') onCull('pick');
      if (e.key === 'x' || e.key === 'X') onCull('reject');
      if (e.key === 'f' || e.key === 'F') onCull('favorite');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onPrev, onNext, onClose, onCull]);

  // Lock body scroll
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = orig; };
  }, []);

  // Swipe gestures for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx > 0 && hasPrev) onPrev();
      if (dx < 0 && hasNext) onNext();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/98 backdrop-blur flex flex-col">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-3 sm:px-4 shrink-0"
        style={{
          height: 52,
          paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0,
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full active:bg-muted">
          <XIcon className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <StatusDot status={photo.ai_status} />
          <span className="text-xs text-muted-foreground truncate max-w-[150px]">{photo.file_name}</span>
        </div>
        <div className="flex items-center gap-1">
          {!isMobile && (
            <>
              <button onClick={onPrev} disabled={!hasPrev} className="h-10 w-10 flex items-center justify-center disabled:opacity-20">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button onClick={onNext} disabled={!hasNext} className="h-10 w-10 flex items-center justify-center disabled:opacity-20">
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
          {isMobile && (
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="h-10 w-10 flex items-center justify-center rounded-full active:bg-muted"
            >
              {showInfo ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronUp className="h-5 w-5 text-muted-foreground" />}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {/* Image */}
        <div className="flex-1 flex items-center justify-center p-3 sm:p-4 min-w-0">
          <img
            src={photo.preview_url || photo.original_url}
            alt={photo.file_name}
            className="max-w-full max-h-full object-contain rounded-lg select-none"
            draggable={false}
          />
        </div>

        {/* Desktop sidebar */}
        {!isMobile && (
          <div className="w-72 border-l border-border p-4 overflow-y-auto space-y-5">
            <AIAnalysisPanel photo={photo} />
            <CullActionsPanel photo={photo} onCull={onCull} />
          </div>
        )}
      </div>

      {/* Mobile bottom sheet for info */}
      {isMobile && showInfo && (
        <div
          className="shrink-0 border-t border-border bg-card overflow-y-auto"
          style={{ maxHeight: '45vh', paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
        >
          <div className="p-4 space-y-4">
            <AIAnalysisPanel photo={photo} />
            <CullActionsPanel photo={photo} onCull={onCull} />
          </div>
        </div>
      )}

      {/* Mobile bottom cull bar (always visible) */}
      {isMobile && !showInfo && (
        <div
          className="shrink-0 flex items-center justify-center gap-4 px-4 py-3 border-t border-border bg-card"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
        >
          <button
            onClick={() => onCull(photo.cull_status === 'reject' ? 'unreviewed' : 'reject')}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              photo.cull_status === 'reject' ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'
            }`}
            aria-label="Reject"
          >
            <XIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onCull(photo.cull_status === 'pick' ? 'unreviewed' : 'pick')}
            className={`h-14 w-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              photo.cull_status === 'pick' ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'
            }`}
            aria-label="Pick"
          >
            <Star className="h-6 w-6" />
          </button>
          <button
            onClick={() => onCull(photo.cull_status === 'favorite' ? 'unreviewed' : 'favorite')}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              photo.cull_status === 'favorite' ? 'bg-purple-500 text-white' : 'bg-muted text-muted-foreground'
            }`}
            aria-label="Favorite"
          >
            <Heart className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Swipe hint on mobile */}
      {isMobile && (
        <div className="absolute top-1/2 left-2 right-2 flex justify-between pointer-events-none opacity-30">
          {hasPrev && <ArrowLeft className="h-8 w-8 text-foreground" />}
          {!hasPrev && <div />}
          {hasNext && <ArrowRight className="h-8 w-8 text-foreground" />}
        </div>
      )}
    </div>
  );
}

function AIAnalysisPanel({ photo }: { photo: CheetahPhoto }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">AI Analysis</p>
      {photo.ai_status === 'completed' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall</span>
            <span className="text-2xl font-bold text-foreground">{photo.ai_score}</span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Sharpness', value: photo.sharpness },
              { label: 'Composition', value: photo.composition },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                  <span>{label}</span><span>{value ?? '–'}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${value || 0}%` }} />
                </div>
              </div>
            ))}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Exposure</span>
              <span className="text-foreground">{photo.exposure || '–'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Eyes</span>
              <span className="text-foreground">{photo.eyes_open === null ? '–' : photo.eyes_open ? 'Open' : 'Closed'}</span>
            </div>
          </div>
          {photo.ai_recommendation && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 leading-relaxed">
              💡 {photo.ai_recommendation}
            </p>
          )}
        </div>
      ) : photo.ai_status === 'processing' ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
        </div>
      ) : photo.ai_status === 'failed' ? (
        <p className="text-xs text-destructive">Analysis failed</p>
      ) : (
        <p className="text-xs text-muted-foreground">Queued for analysis</p>
      )}
    </div>
  );
}

function CullActionsPanel({ photo, onCull }: { photo: CheetahPhoto; onCull: (s: 'pick' | 'reject' | 'favorite' | 'unreviewed') => void }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Quick Cull</p>
      <div className="grid grid-cols-3 gap-2">
        <Button
          size="sm"
          variant={photo.cull_status === 'pick' ? 'default' : 'outline'}
          className="text-xs gap-1 min-h-[44px]"
          onClick={() => onCull(photo.cull_status === 'pick' ? 'unreviewed' : 'pick')}
        >
          <Star className="h-3.5 w-3.5" /> Pick
        </Button>
        <Button
          size="sm"
          variant={photo.cull_status === 'reject' ? 'destructive' : 'outline'}
          className="text-xs gap-1 min-h-[44px]"
          onClick={() => onCull(photo.cull_status === 'reject' ? 'unreviewed' : 'reject')}
        >
          <XIcon className="h-3.5 w-3.5" /> Reject
        </Button>
        <Button
          size="sm"
          variant={photo.cull_status === 'favorite' ? 'default' : 'outline'}
          className="text-xs gap-1 min-h-[44px]"
          onClick={() => onCull(photo.cull_status === 'favorite' ? 'unreviewed' : 'favorite')}
        >
          <Heart className="h-3.5 w-3.5" /> Fav
        </Button>
      </div>
      <p className="text-[9px] text-muted-foreground/50 mt-1.5">
        Keyboard: P = Pick · X = Reject · F = Fav · ←→ Navigate
      </p>
    </div>
  );
}

export default function CheetahLive() {
  const {
    sessions, activeSessionId, setActiveSessionId, photos,
    loading, uploading, uploadProgress, createSession, uploadPhotos, setCullStatus,
  } = useCheetah();

  const folderWatcher = useFolderWatcher(activeSessionId);
  const isMobile = useIsMobile();

  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [showNewSession, setShowNewSession] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [mainTab, setMainTab] = useState<'ingest' | 'camera'>('ingest');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const filteredPhotos = photos.filter((p) => {
    if (filter === 'all') return true;
    return p.cull_status === filter;
  });

  const selectedPhoto = selectedPhotoId ? photos.find((p) => p.id === selectedPhotoId) : null;
  const selectedIdx = selectedPhoto ? filteredPhotos.findIndex((p) => p.id === selectedPhoto.id) : -1;

  const handleCreateSession = async () => {
    if (!newTitle.trim()) return;
    await createSession(newTitle.trim());
    setNewTitle('');
    setShowNewSession(false);
  };

  const handleFiles = (files: FileList | File[]) => {
    const validExtensions = new Set(['jpg', 'jpeg', 'png', 'heif', 'heic']);
    const validFiles = Array.from(files).filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      return validExtensions.has(ext) || ['image/jpeg', 'image/png', 'image/heif', 'image/heic'].includes(f.type);
    });
    if (validFiles.length === 0) {
      toast.error('No valid image files');
      return;
    }
    uploadPhotos(validFiles);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const totalPhotos = photos.length;
  const analyzed = photos.filter((p) => p.ai_status === 'completed').length;
  const picks = photos.filter((p) => p.cull_status === 'pick').length;
  const rejects = photos.filter((p) => p.cull_status === 'reject').length;
  const avgScore = analyzed > 0
    ? Math.round(photos.filter((p) => p.ai_score !== null).reduce((s, p) => s + (p.ai_score || 0), 0) / analyzed)
    : 0;

  return (
    <DashboardLayout>
      {/* Detail overlay */}
      {selectedPhoto && (
        <PhotoDetail
          photo={selectedPhoto}
          onClose={() => setSelectedPhotoId(null)}
          onCull={(status) => setCullStatus(selectedPhoto.id, status)}
          onPrev={() => { if (selectedIdx > 0) setSelectedPhotoId(filteredPhotos[selectedIdx - 1].id); }}
          onNext={() => { if (selectedIdx < filteredPhotos.length - 1) setSelectedPhotoId(filteredPhotos[selectedIdx + 1].id); }}
          hasPrev={selectedIdx > 0}
          hasNext={selectedIdx < filteredPhotos.length - 1}
          isMobile={!!isMobile}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-accent" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent" />
          </div>
          <div className="min-w-0">
            <h1 className="text-foreground text-base sm:text-lg font-semibold truncate">Cheetah Live</h1>
            <p className="text-muted-foreground text-[10px] truncate">Real-time AI ingest & culling</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button size="sm" variant="outline" onClick={() => setShowNewSession(true)} className="gap-1 text-xs min-h-[40px] px-2.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Session</span>
          </Button>
          {activeSessionId && (
            <Button size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1 text-xs min-h-[40px] px-2.5" disabled={uploading}>
              {uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {uploadProgress.done}/{uploadProgress.total}</>
              ) : (
                <><Upload className="h-4 w-4" /> <span className="hidden sm:inline">Ingest</span></>
              )}
            </Button>
          )}
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" multiple onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 mb-4">
        {([
          { key: 'ingest' as const, label: 'Photo Ingest', icon: Upload },
          { key: 'camera' as const, label: 'Camera Upload', icon: Wifi },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMainTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-[11px] font-medium tracking-wide transition-all min-h-[44px] ${
              mainTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground active:bg-card/50'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Camera Upload Tab */}
      {mainTab === 'camera' && <CheetahCameraUpload />}

      {/* Folder Watcher */}
      {mainTab === 'ingest' && activeSessionId && folderWatcher.isSupported && (
        <div className="mb-3 p-3 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {folderWatcher.isWatching ? (
                <div className="relative shrink-0">
                  <FolderSync className="h-4 w-4 text-accent" />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent animate-ping" />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent" />
                </div>
              ) : (
                <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {folderWatcher.isWatching ? `Watching: ${folderWatcher.folderName}` : 'Auto-Upload from Folder'}
                </p>
                {folderWatcher.isWatching && (
                  <p className="text-[10px] text-muted-foreground truncate">
                    {folderWatcher.filesDetected} found · {folderWatcher.filesUploaded} uploaded
                    {folderWatcher.filesQueued > 0 && ` · ${folderWatcher.filesQueued} left`}
                  </p>
                )}
                {!folderWatcher.isWatching && (
                  <p className="text-[10px] text-muted-foreground">Select folder for auto-upload</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {folderWatcher.isWatching && folderWatcher.filesDetected > 0 && folderWatcher.filesUploaded < folderWatcher.filesDetected && (
                <div className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin text-accent" />
                  <span className="text-[10px] text-accent font-medium">
                    {Math.round((folderWatcher.filesUploaded / folderWatcher.filesDetected) * 100)}%
                  </span>
                </div>
              )}
              {folderWatcher.isWatching ? (
                <Button size="sm" variant="outline" onClick={folderWatcher.stopWatching} className="gap-1 text-xs h-9 min-h-[36px]">
                  <Square className="h-3 w-3" /> Stop
                </Button>
              ) : (
                <Button size="sm" onClick={folderWatcher.startWatching} className="gap-1 text-xs h-9 min-h-[36px]">
                  <Radio className="h-3 w-3" /> Watch
                </Button>
              )}
            </div>
          </div>
          {folderWatcher.isWatching && folderWatcher.filesDetected > 0 && (
            <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${(folderWatcher.filesUploaded / folderWatcher.filesDetected) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {mainTab === 'ingest' && <>
      {/* New session */}
      {showNewSession && (
        <div className="mb-3 p-3 rounded-xl border border-border bg-card">
          <p className="text-sm font-medium text-foreground mb-2">Create Live Session</p>
          <div className="flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Session name…"
              className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
              autoFocus
              enterKeyHint="done"
            />
            <Button size="sm" onClick={handleCreateSession} className="min-h-[40px]">Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNewSession(false)} className="min-h-[40px]">Cancel</Button>
          </div>
        </div>
      )}

      {/* Session pills — scrollable */}
      {sessions.length > 1 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {sessions.map((s) => {
            const displayTitle = s.title?.trim()
              ? s.title
              : new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' Session';
            return (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-colors min-h-[36px] active:scale-95 ${
                  s.id === activeSessionId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {displayTitle} ({s.total_photos})
              </button>
            );
          })}
        </div>
      )}

      {/* Stats — 2x2 on mobile, 5-col on desktop */}
      {activeSessionId && photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
          {[
            { label: 'Total', value: totalPhotos, icon: Image },
            { label: 'Analyzed', value: `${analyzed}/${totalPhotos}`, icon: Activity },
            { label: 'Avg Score', value: avgScore || '–', icon: Sparkles },
            { label: 'Picks', value: picks, icon: Star },
            { label: 'Rejects', value: rejects, icon: XIcon },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-2.5 text-center">
              <Icon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
              <p className="text-foreground text-sm font-bold">{value}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs — scrollable */}
      {activeSessionId && photos.length > 0 && (
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {(['all', 'unreviewed', 'pick', 'reject', 'favorite'] as FilterMode[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3 py-2 rounded-full text-[11px] uppercase tracking-wider font-semibold transition-colors min-h-[36px] active:scale-95 ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground'
              }`}
            >
              {f} ({f === 'all' ? photos.length : photos.filter((p) => p.cull_status === f).length})
            </button>
          ))}
        </div>
      )}

      {/* Grid — 2 cols mobile, scales up */}
      <div
        ref={dropRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative min-h-[200px] rounded-2xl transition-colors ${isDragging ? 'bg-primary/5 border-2 border-dashed border-primary/40' : ''}`}
      >
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !activeSessionId ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <Camera className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-foreground font-medium">No active session</p>
            <p className="text-muted-foreground text-sm mt-1">Create a session to start</p>
            <Button size="sm" className="mt-4 gap-1.5 min-h-[44px]" onClick={() => setShowNewSession(true)}>
              <Plus className="h-4 w-4" /> New Session
            </Button>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <Upload className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-foreground font-medium">
              {filter !== 'all' ? `No ${filter} photos` : 'Drop photos here'}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {filter !== 'all' ? 'Try a different filter' : 'Drag & drop or tap "Ingest"'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filteredPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isSelected={photo.id === selectedPhotoId}
                onSelect={() => setSelectedPhotoId(photo.id)}
                onCull={(status) => setCullStatus(photo.id, status)}
              />
            ))}
          </div>
        )}

        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/5 rounded-2xl pointer-events-none">
            <div className="text-center">
              <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-primary font-semibold text-sm">Drop photos to ingest</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload progress */}
      {uploading && (
        <div
          className="fixed left-4 right-4 z-40 bg-card border border-border rounded-xl p-3 shadow-lg"
          style={{ bottom: isMobile ? 'calc(72px + env(safe-area-inset-bottom, 0px))' : 20 }}
        >
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
            <div className="flex-1">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.done / uploadProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {uploadProgress.done}/{uploadProgress.total}
            </span>
          </div>
        </div>
      )}
      </>}
    </DashboardLayout>
  );
}
