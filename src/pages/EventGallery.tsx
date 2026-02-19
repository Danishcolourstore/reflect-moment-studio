import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ShareModal } from '@/components/ShareModal';
import { UploadProgressPanel } from '@/components/UploadProgressPanel';
import { Button } from '@/components/ui/button';
import {
  Heart, Download, Trash2, Share2, Upload,
  PackageOpen, Loader2, FolderDown, Settings,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useGuestFavorites } from '@/hooks/use-guest-favorites';
import { usePhotoUpload } from '@/hooks/use-photo-upload';
import { EventSettingsModal } from '@/components/EventSettingsModal';
import { EditorialCollageGrid } from '@/components/EditorialCollageGrid';
import { PixiesetEditorialGrid, CinematicMasonryGrid, HighlightMosaicGrid } from '@/components/PremiumGridLayouts';
import { format } from 'date-fns';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PhotoShareSheet } from '@/components/PhotoShareSheet';

interface Photo {
  id: string;
  storage_path: string;
  filename: string | null;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  date: string;
  location: string | null;
  cover_photo_url: string | null;
  gallery_password: string | null;
  photographer_id: string;
  downloads_enabled: boolean;
  download_resolution: string;
  watermark_enabled: boolean;
  layout: string;
  is_published: boolean;
}

type GalleryFilter = 'all' | 'favorites';

/* ── Layout grid class helpers ── */
const GRID_CLASSES: Record<string, string> = {
  classic: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[3px]',
  masonry: 'columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-[3px]',
  justified: 'flex flex-wrap gap-[3px]',
  editorial: 'columns-1 sm:columns-2 lg:columns-3 gap-4',
};

// Adapt Photo to the shape grid components expect
function toGridPhoto(p: Photo, isFav: boolean) {
  return { id: p.id, url: p.storage_path, is_favorite: isFav, file_name: p.filename };
}

const EventGallery = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [favStats, setFavStats] = useState<{ totalFavs: number; uniqueGuests: number }>({ totalFavs: 0, uniqueGuests: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { favoriteCount, toggleFavorite: toggleGuestFavorite, isFavorite } = useGuestFavorites(id, null);
  const upload = usePhotoUpload(id, user?.id);
  const [sharePhoto, setSharePhoto] = useState<Photo | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!id || !user) return;
    const { data } = await supabase.from('events').select('*').eq('id', id).single();
    if (data) {
      const evt = data as unknown as Event;
      if (evt.photographer_id !== user.id) {
        navigate('/dashboard');
        return;
      }
      setEvent(evt);
    }
  }, [id, user, navigate]);

  const fetchPhotos = useCallback(async () => {
    if (!id) return;
    const { data } = await (supabase.from('photos').select('*') as any).eq('event_id', id).order('sort_order', { ascending: true });
    if (data) setPhotos(data as unknown as Photo[]);
  }, [id]);

  const fetchFavStats = useCallback(async () => {
    if (!id) return;
    const { data } = await (supabase
      .from('favorites' as any)
      .select('id, guest_session_id') as any)
      .eq('event_id', id);
    if (data) {
      const rows = data as any[];
      const uniqueGuests = new Set(rows.map((r: any) => r.guest_session_id)).size;
      setFavStats({ totalFavs: rows.length, uniqueGuests });
    }
  }, [id]);

  useEffect(() => { fetchEvent(); fetchPhotos(); fetchFavStats(); }, [fetchEvent, fetchPhotos, fetchFavStats]);

  // Refresh photos & show success toast when upload completes
  useEffect(() => {
    if (upload.isDone) {
      fetchPhotos();
      fetchEvent();
      if (upload.successCount > 0 && upload.failedFiles.length === 0) {
        toast({
          title: 'Upload Complete',
          description: `${upload.successCount} photo${upload.successCount > 1 ? 's' : ''} added to gallery.`,
        });
      }
    }
  }, [upload.isDone, upload.successCount, upload.failedFiles.length, fetchPhotos, fetchEvent, toast]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (arr.length > 0) upload.uploadFiles(arr);
  }, [upload]);

  /* ── Drag & Drop ── */
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const deletePhoto = async (photo: Photo) => {
    await supabase.from('photos').delete().eq('id', photo.id);
    fetchPhotos();
    fetchEvent();
  };

  /* ── ZIP helpers ── */
  const buildZip = async (targetPhotos: Photo[], label: string) => {
    if (targetPhotos.length === 0) { toast({ title: 'No photos to download' }); return; }
    setDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(event?.title ?? label);
      for (let i = 0; i < targetPhotos.length; i++) {
        setDownloadProgress(`${i + 1} / ${targetPhotos.length}`);
        const p = targetPhotos[i];
        const res = await fetch(p.storage_path);
        const blob = await res.blob();
        const fileName = p.filename ?? `photo-${i + 1}.jpg`;
        folder?.file(fileName, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${event?.title ?? label}.zip`);
      toast({ title: `${targetPhotos.length} photos downloaded` });
    } catch (_err) {
      toast({ title: 'Download failed', description: 'Please try again.' });
    } finally {
      setDownloading(false); setDownloadProgress('');
    }
  };

  const downloadAll = () => buildZip(photos, 'gallery');
  const downloadFavorites = () => buildZip(photos.filter((p) => isFavorite(p.id)), 'favorites');

  if (!event) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center">
          <p className="text-[11px] text-muted-foreground/50 uppercase tracking-widest">Loading gallery...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isOwner = user?.id === event.photographer_id;
  const canDownloadAll = isOwner || event.downloads_enabled;
  const canDownloadAnything = canDownloadAll;

  const displayPhotos = filter === 'favorites'
    ? photos.filter((p) => isFavorite(p.id))
    : photos;

  const layout = event.layout || 'classic';
  const gridClass = GRID_CLASSES[layout] ?? GRID_CLASSES.masonry;

  const getItemClass = (layout: string) => {
    switch (layout) {
      case 'classic': return 'relative aspect-square overflow-hidden';
      case 'justified': return 'relative h-[200px] sm:h-[240px] flex-grow';
      case 'editorial': return 'relative mb-4 break-inside-avoid';
      default: return 'relative mb-[3px] break-inside-avoid';
    }
  };

  const getImgClass = (layout: string) => {
    switch (layout) {
      case 'classic': return 'h-full w-full object-cover';
      case 'justified': return 'h-full w-auto object-cover';
      case 'editorial': return 'w-full block';
      default: return 'w-full block';
    }
  };

  // Map photos for grid components that expect the old shape
  const gridPhotos = displayPhotos.map(p => toGridPhoto(p, isFavorite(p.id)));

  return (
    <DashboardLayout>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)} />

      {/* Cover banner */}
      {event.cover_photo_url && (
        <div className="relative -mx-5 -mt-6 mb-5 h-32 sm:h-40 overflow-hidden sm:-mx-8 lg:-mx-10">
          <img src={event.cover_photo_url} alt={event.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-5 gap-2">
        <div>
          <h1 className="font-serif text-xl sm:text-[22px] font-semibold text-foreground leading-tight">{event.title}</h1>
          <p className="text-[11px] text-muted-foreground/60 tracking-wide mt-0.5">
            {format(new Date(event.date), 'MMMM d, yyyy')} · {photos.length} photos
            {favStats.totalFavs > 0 && (
              <> · <Heart className="inline h-3 w-3 text-primary" fill="hsl(var(--primary))" /> {favStats.totalFavs} favorites from {favStats.uniqueGuests} guest{favStats.uniqueGuests !== 1 ? 's' : ''}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {isOwner && (
            <>
              <Button onClick={() => fileInputRef.current?.click()} disabled={upload.isUploading}
                variant="ghost" size="sm" className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]">
                <Upload className="mr-1 h-3 w-3" />Upload
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShareOpen(true)} className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]">
                <Share2 className="mr-1 h-3 w-3" />Share
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)} className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]">
                <Settings className="mr-1 h-3 w-3" />Settings
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Upload Progress Panel */}
      <UploadProgressPanel {...upload} onRetry={upload.retry} onDismiss={upload.dismiss} />

      {/* Gallery utility bar */}
      <div className="flex items-center justify-between mb-4 border-b border-border">
        <div className="flex items-center gap-0">
          <button onClick={() => setFilter('all')}
            className={`px-3 py-2 text-[11px] uppercase tracking-[0.08em] border-b-2 transition-colors ${
              filter === 'all' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
            }`}>All Photos</button>
          <button onClick={() => setFilter('favorites')}
            className={`px-3 py-2 text-[11px] uppercase tracking-[0.08em] border-b-2 transition-colors flex items-center gap-1.5 ${
              filter === 'favorites' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
            }`}>
            <Heart className="h-3 w-3" /> Favorites
            {favoriteCount > 0 && (
              <span className="text-[10px] bg-foreground/10 text-foreground/70 rounded-full px-1.5 py-px leading-none">{favoriteCount}</span>
            )}
          </button>
        </div>

        {canDownloadAnything && photos.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={downloading}
                className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em] mb-px">
                {downloading ? (<><Loader2 className="mr-1 h-3 w-3 animate-spin" />{downloadProgress}</>) : (<><FolderDown className="mr-1 h-3 w-3" />Download</>)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {canDownloadAll && (
                <DropdownMenuItem onClick={downloadAll} className="text-[12px] gap-2">
                  <PackageOpen className="h-3.5 w-3.5" /> All Photos ({photos.length})
                </DropdownMenuItem>
              )}
              {favoriteCount > 0 && (
                <DropdownMenuItem onClick={downloadFavorites} className="text-[12px] gap-2">
                  <Heart className="h-3.5 w-3.5" /> Favorites ({favoriteCount})
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Drag & Drop upload zone (owner only) */}
      {isOwner && photos.length === 0 && (
        <div
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          className={`mb-5 flex flex-col items-center justify-center border border-dashed py-16 transition-colors cursor-pointer ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40'
          } ${upload.isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={() => !upload.isUploading && fileInputRef.current?.click()}>
          <Upload className="h-6 w-6 text-muted-foreground/25 mb-3" />
          <p className="text-[12px] text-muted-foreground/50 font-medium">
            {upload.isUploading ? 'Upload in progress…' : 'Drop photos here to upload'}
          </p>
          {!upload.isUploading && (
            <>
              <p className="mt-1 text-[10px] text-muted-foreground/35">or</p>
              <Button variant="outline" size="sm"
                className="mt-2.5 text-[10px] h-7 px-4 uppercase tracking-[0.08em] border-border"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                Select Photos
              </Button>
            </>
          )}
        </div>
      )}

      {/* Inline drop zone when photos exist */}
      {isOwner && photos.length > 0 && !upload.isUploading && (
        <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          className={`mb-5 flex items-center justify-center gap-2 border border-dashed py-3 px-5 transition-colors cursor-pointer ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
          }`} onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5 text-muted-foreground/30" />
          <p className="text-[11px] text-muted-foreground/40">Drop photos here or click to upload more</p>
        </div>
      )}

      {/* Photo Grid — dynamic layout */}
      {displayPhotos.length === 0 && photos.length > 0 && filter === 'favorites' ? (
        <div className="py-24 text-center">
          <Heart className="mx-auto h-8 w-8 text-muted-foreground/12" />
          <p className="mt-2 font-serif text-sm text-muted-foreground/50">No favorites yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground/40">Click the heart icon on any photo to add it here</p>
        </div>
      ) : displayPhotos.length > 0 ? (
        ['editorial-collage', 'pixieset', 'cinematic', 'mosaic'].includes(layout) ? (
          layout === 'editorial-collage' ? (
            <EditorialCollageGrid photos={gridPhotos} eventName={event.title} isFavorite={isFavorite} toggleFavorite={toggleGuestFavorite} canDownload={canDownloadAnything} isOwner={isOwner} onDelete={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) deletePhoto(orig); }} onShare={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) setSharePhoto(orig); }} />
          ) : layout === 'pixieset' ? (
            <PixiesetEditorialGrid photos={gridPhotos} eventName={event.title} isFavorite={isFavorite} toggleFavorite={toggleGuestFavorite} canDownload={canDownloadAnything} isOwner={isOwner} onDelete={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) deletePhoto(orig); }} onShare={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) setSharePhoto(orig); }} />
          ) : layout === 'cinematic' ? (
            <CinematicMasonryGrid photos={gridPhotos} isFavorite={isFavorite} toggleFavorite={toggleGuestFavorite} canDownload={canDownloadAnything} isOwner={isOwner} onDelete={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) deletePhoto(orig); }} onShare={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) setSharePhoto(orig); }} />
          ) : (
            <HighlightMosaicGrid photos={gridPhotos} eventName={event.title} isFavorite={isFavorite} toggleFavorite={toggleGuestFavorite} canDownload={canDownloadAnything} isOwner={isOwner} onDelete={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) deletePhoto(orig); }} onShare={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) setSharePhoto(orig); }} />
          )
        ) : (
          <div className={gridClass}>
            {displayPhotos.map(photo => {
              const fav = isFavorite(photo.id);
              return (
                <div key={photo.id} className={`group ${getItemClass(layout)}`}>
                  <img src={photo.storage_path} alt="" className={getImgClass(layout)} loading="lazy" />
                  <button onClick={() => { toggleGuestFavorite(photo.id); if (!fav) toast({ title: 'Added to Favorites', description: 'Photo saved to selections.' }); }}
                    className="absolute top-1.5 right-1.5 z-10 rounded-full bg-card/60 backdrop-blur-sm p-1.5 transition-all duration-200 hover:bg-card/80 active:scale-125">
                    <Heart className={`h-3.5 w-3.5 transition-all duration-200 ${fav ? 'text-primary scale-110' : 'text-foreground/50 hover:text-foreground/70'}`}
                      fill={fav ? 'hsl(var(--primary))' : 'none'} />
                  </button>
                  <div className="absolute inset-0 transition-colors duration-200 group-hover:bg-foreground/10 pointer-events-none" />
                  <div className="absolute bottom-1.5 right-1.5 flex gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button onClick={() => setSharePhoto(photo)}
                      className="rounded-full bg-card/70 backdrop-blur-sm p-1 text-foreground/80 hover:bg-card/90 transition">
                      <Share2 className="h-3 w-3" />
                    </button>
                    {canDownloadAnything && (
                      <a href={photo.storage_path} download={photo.filename ?? true} className="rounded-full bg-card/70 backdrop-blur-sm p-1 text-foreground/80 hover:bg-card/90 transition">
                        <Download className="h-3 w-3" />
                      </a>
                    )}
                    {isOwner && (
                      <button onClick={() => deletePhoto(photo)} className="rounded-full bg-card/70 backdrop-blur-sm p-1 text-destructive hover:bg-card/90 transition">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : null}

      {/* Mobile sticky upload button */}
      {isOwner && !upload.isUploading && !upload.isDone && (
        <button onClick={() => fileInputRef.current?.click()}
          className="fixed bottom-20 right-4 z-40 sm:hidden bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center shadow-lg active:scale-95 transition-transform">
          <Upload className="h-5 w-5" />
        </button>
      )}

      {event && (
        <>
          <ShareModal open={shareOpen} onOpenChange={setShareOpen} eventSlug={event.slug} eventName={event.title} pin={event.gallery_password} />
          <EventSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} event={event} onUpdated={() => { fetchEvent(); fetchPhotos(); }} />
          {sharePhoto && (
            <PhotoShareSheet open={!!sharePhoto} onOpenChange={() => setSharePhoto(null)}
              photoUrl={sharePhoto.storage_path} photoName={sharePhoto.filename} eventName={event.title} canDownload={canDownloadAnything} />
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default EventGallery;
