import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useCheetah, type CheetahPhoto } from '@/hooks/use-cheetah';
import { useFolderWatcher } from '@/hooks/use-folder-watcher';
import {
  Zap, Plus, Upload, Star, X as XIcon, Heart, ArrowLeft, ArrowRight,
  Eye, Camera, Activity, Loader2, ChevronDown, Sparkles, Image,
  FolderOpen, FolderSync, Square, Radio, Wifi,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CheetahCameraDemo from '@/components/cheetah/CheetahCameraDemo';
type FilterMode = 'all' | 'pick' | 'reject' | 'favorite' | 'unreviewed';

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color =
    score >= 85 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
    score >= 60 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
    'bg-red-500/20 text-red-400 border-red-500/30';
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${color}`}>
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
  return <span className={`h-2 w-2 rounded-full ${colors[status] || colors.pending}`} />;
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
    <span className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${c.color}`}>
      <c.icon className="h-2.5 w-2.5" />
      {c.label}
    </span>
  );
}

function PhotoCard({
  photo,
  isSelected,
  onSelect,
  onCull,
}: {
  photo: CheetahPhoto;
  isSelected: boolean;
  onSelect: () => void;
  onCull: (status: 'pick' | 'reject' | 'favorite') => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`relative rounded-xl overflow-hidden border transition-all cursor-pointer group ${
        isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/30'
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

      {/* Overlay badges */}
      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
        <StatusDot status={photo.ai_status} />
        <ScoreBadge score={photo.ai_score} />
      </div>

      {photo.is_best_in_burst && (
        <div className="absolute top-1.5 right-1.5">
          <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30">
            <Sparkles className="h-2.5 w-2.5" /> Best
          </span>
        </div>
      )}

      <div className="absolute bottom-1.5 left-1.5">
        <CullBadge status={photo.cull_status} />
      </div>

      {/* Quick actions on hover */}
      <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onCull('pick'); }}
          className="h-6 w-6 rounded-full bg-green-500/80 flex items-center justify-center text-white hover:bg-green-500"
          title="Pick (P)"
        >
          <Star className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onCull('reject'); }}
          className="h-6 w-6 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500"
          title="Reject (X)"
        >
          <XIcon className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onCull('favorite'); }}
          className="h-6 w-6 rounded-full bg-purple-500/80 flex items-center justify-center text-white hover:bg-purple-500"
          title="Favorite (F)"
        >
          <Heart className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function PhotoDetail({
  photo,
  onClose,
  onCull,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  photo: CheetahPhoto;
  onClose: () => void;
  onCull: (status: 'pick' | 'reject' | 'favorite' | 'unreviewed') => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
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

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <XIcon className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <StatusDot status={photo.ai_status} />
          <span className="text-xs text-muted-foreground">{photo.file_name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onPrev} disabled={!hasPrev} className="p-1 disabled:opacity-20">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button onClick={onNext} disabled={!hasNext} className="p-1 disabled:opacity-20">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Image */}
        <div className="flex-1 flex items-center justify-center p-4 min-w-0">
          <img
            src={photo.preview_url || photo.original_url}
            alt={photo.file_name}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>

        {/* Sidebar */}
        <div className="w-72 border-l border-border p-4 overflow-y-auto space-y-5 hidden md:block">
          {/* AI Score */}
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
                        <span>{label}</span>
                        <span>{value ?? '–'}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${value || 0}%` }}
                        />
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

          {/* Burst */}
          {photo.burst_group && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Burst Group</p>
              <p className="text-xs text-foreground">
                {photo.is_best_in_burst ? '⭐ Best in burst' : 'Part of burst sequence'}
              </p>
            </div>
          )}

          {/* Cull actions */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Quick Cull</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant={photo.cull_status === 'pick' ? 'default' : 'outline'}
                className="text-xs gap-1"
                onClick={() => onCull(photo.cull_status === 'pick' ? 'unreviewed' : 'pick')}
              >
                <Star className="h-3 w-3" /> Pick
              </Button>
              <Button
                size="sm"
                variant={photo.cull_status === 'reject' ? 'destructive' : 'outline'}
                className="text-xs gap-1"
                onClick={() => onCull(photo.cull_status === 'reject' ? 'unreviewed' : 'reject')}
              >
                <XIcon className="h-3 w-3" /> Reject
              </Button>
              <Button
                size="sm"
                variant={photo.cull_status === 'favorite' ? 'default' : 'outline'}
                className="text-xs gap-1"
                onClick={() => onCull(photo.cull_status === 'favorite' ? 'unreviewed' : 'favorite')}
              >
                <Heart className="h-3 w-3" /> Fav
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground/50 mt-1.5">
              Keyboard: P = Pick · X = Reject · F = Fav · ←→ Navigate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheetahLive() {
  const {
    sessions, activeSessionId, setActiveSessionId, photos,
    loading, uploading, uploadProgress, createSession, uploadPhotos, setCullStatus,
  } = useCheetah();

  const folderWatcher = useFolderWatcher(activeSessionId);

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
      toast.error('No valid image files (JPG, JPEG, PNG, HEIF, HEIC)');
      return;
    }
    uploadPhotos(validFiles);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  // Stats
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
          onCull={(status) => {
            setCullStatus(selectedPhoto.id, status);
          }}
          onPrev={() => {
            if (selectedIdx > 0) setSelectedPhotoId(filteredPhotos[selectedIdx - 1].id);
          }}
          onNext={() => {
            if (selectedIdx < filteredPhotos.length - 1) setSelectedPhotoId(filteredPhotos[selectedIdx + 1].id);
          }}
          hasPrev={selectedIdx > 0}
          hasNext={selectedIdx < filteredPhotos.length - 1}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-accent" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent" />
          </div>
          <div>
            <h1 className="text-foreground text-lg font-semibold">Cheetah Live</h1>
            <p className="text-muted-foreground text-[11px]">Real-time AI photo ingest & culling</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNewSession(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> New Session
          </Button>
          {activeSessionId && (
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 text-xs"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {uploadProgress.done}/{uploadProgress.total}
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" /> Ingest Photos
                </>
              )}
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/jpg"
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Folder Watcher Panel */}
      {activeSessionId && folderWatcher.isSupported && (
        <div className="mb-4 p-3 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {folderWatcher.isWatching ? (
                <div className="relative">
                  <FolderSync className="h-4 w-4 text-accent" />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent animate-ping" />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent" />
                </div>
              ) : (
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-xs font-medium text-foreground">
                  {folderWatcher.isWatching
                    ? `Watching: ${folderWatcher.folderName}`
                    : 'Auto-Upload from Folder'}
                </p>
              {folderWatcher.isWatching && (
                  <p className="text-[10px] text-muted-foreground">
                    {folderWatcher.filesDetected} detected · {folderWatcher.filesUploaded} uploaded
                    {folderWatcher.filesQueued > 0 && ` · ${folderWatcher.filesQueued} remaining`}
                    {folderWatcher.uploadSpeedMBps !== null && ` · ${folderWatcher.uploadSpeedMBps} MB/s`}
                    {folderWatcher.etaSeconds !== null && folderWatcher.etaSeconds > 0 && ` · ~${folderWatcher.etaSeconds}s remaining`}
                  </p>
                )}
                {!folderWatcher.isWatching && (
                  <p className="text-[10px] text-muted-foreground">
                    Select a folder — new photos auto-upload to Cheetah
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
          {folderWatcher.isWatching && (folderWatcher.filesQueued > 0 || folderWatcher.filesUploaded < folderWatcher.filesDetected) && folderWatcher.filesDetected > 0 && (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin text-accent" />
                  <span className="text-[10px] text-accent font-medium">
                    {Math.round((folderWatcher.filesUploaded / folderWatcher.filesDetected) * 100)}%
                  </span>
                </div>
              )}
              {folderWatcher.isWatching ? (
                <Button size="sm" variant="outline" onClick={folderWatcher.stopWatching} className="gap-1 text-xs h-7">
                  <Square className="h-3 w-3" /> Stop
                </Button>
              ) : (
                <Button size="sm" onClick={folderWatcher.startWatching} className="gap-1 text-xs h-7">
                  <Radio className="h-3 w-3" /> Watch Folder
                </Button>
              )}
            </div>
          </div>
          {folderWatcher.isWatching && folderWatcher.filesDetected > 0 && (
            <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{
                  width: `${folderWatcher.filesDetected > 0
                    ? (folderWatcher.filesUploaded / folderWatcher.filesDetected) * 100
                    : 0}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* New session modal */}
      {showNewSession && (
        <div className="mb-4 p-4 rounded-xl border border-border bg-card">
          <p className="text-sm font-medium text-foreground mb-2">Create Live Session</p>
          <div className="flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Session name (e.g. Wedding Ceremony)"
              className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
              autoFocus
            />
            <Button size="sm" onClick={handleCreateSession}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNewSession(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Session selector */}
      {sessions.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
       {sessions.map((s) => {
            const displayTitle = s.title && s.title.trim()
              ? s.title
              : new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' Session';
            return (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  s.id === activeSessionId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {displayTitle} ({s.total_photos})
              </button>
            );
          })}
        </div>
      )}

      {/* Stats bar */}
      {activeSessionId && photos.length > 0 && (
        <div className="grid grid-cols-5 gap-2 mb-4">
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

      {/* Filter tabs */}
      {activeSessionId && photos.length > 0 && (
        <div className="flex gap-1 mb-4">
          {(['all', 'unreviewed', 'pick', 'reject', 'favorite'] as FilterMode[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {f} ({f === 'all' ? photos.length : photos.filter((p) => p.cull_status === f).length})
            </button>
          ))}
        </div>
      )}

      {/* Drop zone / Photo grid */}
      <div
        ref={dropRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative min-h-[300px] rounded-2xl transition-colors ${
          isDragging ? 'bg-primary/5 border-2 border-dashed border-primary/40' : ''
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center h-60">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !activeSessionId ? (
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <Camera className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-foreground font-medium">No active session</p>
            <p className="text-muted-foreground text-sm mt-1">Create a session to start ingesting photos</p>
            <Button size="sm" className="mt-4 gap-1.5" onClick={() => setShowNewSession(true)}>
              <Plus className="h-3.5 w-3.5" /> New Session
            </Button>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <Upload className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-foreground font-medium">
              {filter !== 'all' ? `No ${filter} photos` : 'Drop photos here'}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {filter !== 'all'
                ? 'Try a different filter'
                : 'Drag and drop images or click "Ingest Photos"'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
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

      {/* Upload progress bar */}
      {uploading && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-card border border-border rounded-xl p-3 shadow-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
            <div className="flex-1">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.done / uploadProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {uploadProgress.done}/{uploadProgress.total}
            </span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
