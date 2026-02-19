import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ShareModal } from '@/components/ShareModal';
import { UploadProgressPanel } from '@/components/UploadProgressPanel';
import { Button } from '@/components/ui/button';
import {
  Heart, Download, Trash2, Share2, Upload, Search,
  Image as ImageIcon, PackageOpen, Loader2, FolderDown,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useGuestFavorites } from '@/hooks/use-guest-favorites';
import { usePhotoUpload } from '@/hooks/use-photo-upload';
import { format } from 'date-fns';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Photo {
  id: string;
  url: string;
  is_favorite: boolean;
  file_name: string | null;
}

interface Event {
  id: string;
  name: string;
  event_date: string;
  cover_url: string | null;
  photo_count: number;
  gallery_pin: string | null;
  user_id: string;
  allow_full_download: boolean;
  allow_favorites_download: boolean;
  gallery_layout: string;
}

type GalleryFilter = 'all' | 'favorites';

/* ── Layout grid class helpers ── */
const GRID_CLASSES: Record<string, string> = {
  classic: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[3px]',
  masonry: 'columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-[3px]',
  justified: 'flex flex-wrap gap-[3px]',
  editorial: 'columns-1 sm:columns-2 lg:columns-3 gap-4',
};

const EventGallery = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { favoriteCount, toggleFavorite: toggleGuestFavorite, isFavorite } = useGuestFavorites(id);
  const upload = usePhotoUpload(id, user?.id);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from('events').select('*').eq('id', id).single();
    if (data) setEvent(data as unknown as Event);
  }, [id]);

  const fetchPhotos = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from('photos').select('*').eq('event_id', id).order('created_at', { ascending: false });
    if (data) setPhotos(data as Photo[]);
  }, [id]);

  useEffect(() => { fetchEvent(); fetchPhotos(); }, [fetchEvent, fetchPhotos]);

  // Refresh photos when upload completes
  useEffect(() => {
    if (upload.isDone) {
      fetchPhotos();
      fetchEvent();
    }
  }, [upload.isDone, fetchPhotos, fetchEvent]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (arr.length > 0) upload.uploadFiles(arr);
  }, [upload]);

  /* ── Drag & Drop ── */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const deletePhoto = async (photo: Photo) => {
    await supabase.from('photos').delete().eq('id', photo.id);
    const { count } = await supabase.from('photos').select('*', { count: 'exact', head: true }).eq('event_id', id);
    if (count !== null && id) {
      await supabase.from('events').update({ photo_count: count }).eq('id', id);
    }
    fetchPhotos();
    fetchEvent();
  };

  /* ── ZIP helpers ── */
  const buildZip = async (targetPhotos: Photo[], label: string) => {
    if (targetPhotos.length === 0) {
      toast({ title: 'No photos to download' });
      return;
    }
    setDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(event?.name ?? label);
      for (let i = 0; i < targetPhotos.length; i++) {
        setDownloadProgress(`${i + 1} / ${targetPhotos.length}`);
        const p = targetPhotos[i];
        const res = await fetch(p.url);
        const blob = await res.blob();
        const fileName = p.file_name ?? `photo-${i + 1}.jpg`;
        folder?.file(fileName, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${event?.name ?? label}.zip`);
      toast({ title: `${targetPhotos.length} photos downloaded` });
    } catch {
      toast({ title: 'Download failed', description: 'Please try again.' });
    } finally {
      setDownloading(false);
      setDownloadProgress('');
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

  const isOwner = user?.id === event.user_id;
  const canDownloadAll = isOwner || event.allow_full_download;
  const canDownloadFavs = isOwner || event.allow_favorites_download;
  const canDownloadAnything = canDownloadAll || canDownloadFavs;

  const displayPhotos = filter === 'favorites'
    ? photos.filter((p) => isFavorite(p.id))
    : photos;

  const layout = event.gallery_layout || 'masonry';
  const gridClass = GRID_CLASSES[layout] ?? GRID_CLASSES.masonry;

  /* Per-layout item classes */
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

  return (
    <DashboardLayout>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Cover banner */}
      {event.cover_url && (
        <div className="relative -mx-5 -mt-6 mb-5 h-32 sm:h-40 overflow-hidden sm:-mx-8 lg:-mx-10">
          <img src={event.cover_url} alt={event.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        </div>
      )}

      {/* Header with persistent Upload button */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-5 gap-2">
        <div>
          <h1 className="font-serif text-xl sm:text-[22px] font-semibold text-foreground leading-tight">{event.name}</h1>
          <p className="text-[11px] text-muted-foreground/60 tracking-wide mt-0.5">
            {format(new Date(event.event_date), 'MMMM d, yyyy')} · {event.photo_count} photos
          </p>
        </div>
        <div className="flex items-center gap-1">
          {isOwner && (
            <>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={upload.isUploading}
                variant="ghost"
                size="sm"
                className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]"
              >
                <Upload className="mr-1 h-3 w-3" />Upload
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShareOpen(true)} className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]">
                <Share2 className="mr-1 h-3 w-3" />Share
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Upload Progress Panel */}
      <UploadProgressPanel
        {...upload}
        onRetry={upload.retry}
        onDismiss={upload.dismiss}
      />

      {/* Gallery utility bar */}
      <div className="flex items-center justify-between mb-4 border-b border-border">
        <div className="flex items-center gap-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 text-[11px] uppercase tracking-[0.08em] border-b-2 transition-colors ${
              filter === 'all'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
            }`}
          >
            All Photos
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`px-3 py-2 text-[11px] uppercase tracking-[0.08em] border-b-2 transition-colors flex items-center gap-1.5 ${
              filter === 'favorites'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
            }`}
          >
            <Heart className="h-3 w-3" />
            Favorites
            {favoriteCount > 0 && (
              <span className="text-[10px] bg-foreground/10 text-foreground/70 rounded-full px-1.5 py-px leading-none">
                {favoriteCount}
              </span>
            )}
          </button>
        </div>

        {canDownloadAnything && photos.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={downloading}
                className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em] mb-px"
              >
                {downloading ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    {downloadProgress}
                  </>
                ) : (
                  <>
                    <FolderDown className="mr-1 h-3 w-3" />
                    Download
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {canDownloadAll && (
                <DropdownMenuItem onClick={downloadAll} className="text-[12px] gap-2">
                  <PackageOpen className="h-3.5 w-3.5" />
                  All Photos ({photos.length})
                </DropdownMenuItem>
              )}
              {canDownloadFavs && favoriteCount > 0 && (
                <DropdownMenuItem onClick={downloadFavorites} className="text-[12px] gap-2">
                  <Heart className="h-3.5 w-3.5" />
                  Favorites ({favoriteCount})
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Drag & Drop upload zone (owner only, when no photos or explicit) */}
      {isOwner && photos.length === 0 && !upload.isUploading && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-5 flex flex-col items-center justify-center border border-dashed py-16 transition-colors cursor-pointer ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-6 w-6 text-muted-foreground/25 mb-3" />
          <p className="text-[12px] text-muted-foreground/50 font-medium">Drop photos here to upload</p>
          <p className="mt-1 text-[10px] text-muted-foreground/35">or</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2.5 text-[10px] h-7 px-4 uppercase tracking-[0.08em] border-border"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            Select Photos
          </Button>
        </div>
      )}

      {/* Inline drop zone when photos exist */}
      {isOwner && photos.length > 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-5 flex items-center justify-center gap-2 border border-dashed py-3 px-5 transition-colors cursor-pointer ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
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
        <div className={gridClass}>
          {displayPhotos.map(photo => {
            const fav = isFavorite(photo.id);
            return (
              <div key={photo.id} className={`group ${getItemClass(layout)}`}>
                <img src={photo.url} alt="" className={getImgClass(layout)} loading="lazy" />

                {/* Persistent heart badge when favorited */}
                {fav && (
                  <button
                    onClick={() => toggleGuestFavorite(photo.id)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-destructive/80 text-destructive-foreground p-1 backdrop-blur-sm transition hover:bg-destructive/90 z-10"
                  >
                    <Heart className="h-3 w-3" fill="currentColor" />
                  </button>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 transition-colors duration-200 group-hover:bg-foreground/15">
                  <div className="absolute bottom-1.5 right-1.5 flex gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {!fav && (
                      <button
                        onClick={() => toggleGuestFavorite(photo.id)}
                        className="rounded-full bg-card/70 text-foreground/80 hover:bg-card/90 backdrop-blur-sm p-1 transition"
                      >
                        <Heart className="h-3 w-3" />
                      </button>
                    )}
                    {canDownloadAnything && (
                      <a href={photo.url} download={photo.file_name ?? true} className="rounded-full bg-card/70 backdrop-blur-sm p-1 text-foreground/80 hover:bg-card/90 transition">
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
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Mobile sticky upload button */}
      {isOwner && !upload.isUploading && !upload.isDone && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="fixed bottom-20 right-4 z-40 sm:hidden bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Upload className="h-5 w-5" />
        </button>
      )}

      {event && (
        <ShareModal open={shareOpen} onOpenChange={setShareOpen} eventId={event.id} eventName={event.name} pin={event.gallery_pin} />
      )}
    </DashboardLayout>
  );
};

export default EventGallery;
