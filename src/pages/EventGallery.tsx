import { useEffect, useState, useCallback, useRef } from 'react';
import { getCachedPhotos, setCachedPhotos, invalidatePhotoCache } from '@/lib/photo-cache';
import { useInfinitePhotos } from '@/hooks/use-infinite-photos';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ShareModal } from '@/components/ShareModal';
import { UploadProgressPanel } from '@/components/UploadProgressPanel';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Heart, Download, Trash2, Share2, Upload, X,
  PackageOpen, Loader2, FolderDown, Settings, FileArchive,
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
import { useZipUpload } from '@/hooks/use-zip-upload';
import { EditorialCollageGrid } from '@/components/EditorialCollageGrid';
import { ProgressiveImage } from '@/components/ProgressiveImage';
import { PixiesetEditorialGrid, CinematicMasonryGrid, HighlightMosaicGrid } from '@/components/PremiumGridLayouts';
import { MinimalPortfolioLayout } from '@/components/MinimalPortfolioLayout';
import { StoryBookLayout } from '@/components/StoryBookLayout';
import { format } from 'date-fns';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PhotoShareSheet } from '@/components/PhotoShareSheet';
import { GuestSelectionsViewer } from '@/components/GuestSelectionsViewer';
import { GuestFavoritesTab } from '@/components/GuestFavoritesTab';
import { PhotoSectionSelect } from '@/components/PhotoSectionSelect';
import { SelectionsViewer } from '@/components/SelectionsViewer';
import { CommentsViewer } from '@/components/CommentsViewer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GripVertical, MessageCircle, CheckSquare, Type } from 'lucide-react';
import { TextBlockEditor, TextBlockManager, type TextBlock } from '@/components/GalleryTextBlock';

interface Photo {
  id: string;
  url: string;
  file_name: string | null;
  section: string | null;
}

interface Event {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  location: string | null;
  cover_url: string | null;
  gallery_pin: string | null;
  user_id: string;
  downloads_enabled: boolean;
  download_resolution: string;
  watermark_enabled: boolean;
  gallery_layout: string;
  gallery_style: string;
  is_published: boolean;
  selection_mode_enabled: boolean;
  hero_couple_name: string | null;
  hero_subtitle: string | null;
  hero_button_label: string | null;
  website_template: string | null;
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
  return { id: p.id, url: p.url, is_favorite: isFav, file_name: p.file_name };
}

const EventGallery = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [favStats, setFavStats] = useState<{ totalFavs: number; uniqueGuests: number }>({ totalFavs: 0, uniqueGuests: 0 });
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [textEditorOpen, setTextEditorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const { favoriteCount, toggleFavorite: toggleGuestFavorite, isFavorite } = useGuestFavorites(id, null);
  const upload = usePhotoUpload(id, user?.id);
  const zipUpload = useZipUpload(id, user?.id);
  const [sharePhoto, setSharePhoto] = useState<Photo | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!id || !user) return;
    setEventLoading(true);
    setEventError(null);
    try {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
      if (error) {
        setEventError('Could not load event settings. Please try refreshing.');
        return;
      }
      if (data) {
        const evt = data as unknown as Event;
        if (evt.user_id !== user.id) {
          navigate('/dashboard');
          return;
        }
        setEvent(evt);
      }
    } catch {
      setEventError('Could not load event settings. Please try refreshing.');
    } finally {
      setEventLoading(false);
    }
  }, [id, user, navigate]);

  const fetchPhotos = useCallback(async () => {
    if (!id) return;
    // Try session cache first
    const cached = getCachedPhotos<Photo[]>(id);
    if (cached) { setPhotos(cached); return; }
    // Paginate to bypass 1000-row limit
    let allPhotos: Photo[] = [];
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data } = await (supabase.from('photos').select('*') as any)
        .eq('event_id', id).order('sort_order', { ascending: true, nullsFirst: false })
        .range(from, from + PAGE - 1);
      if (!data || data.length === 0) break;
      allPhotos = allPhotos.concat(data as unknown as Photo[]);
      if (data.length < PAGE) break;
      from += PAGE;
    }
    setPhotos(allPhotos);
    if (allPhotos.length > 0) setCachedPhotos(id, allPhotos);
  }, [id]);

  const fetchFavStats = useCallback(async () => {
    if (!id) return;
    // Paginate to avoid 1000-row limit on popular events
    let allRows: any[] = [];
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data } = await (supabase
        .from('favorites' as any)
        .select('id, guest_session_id') as any)
        .eq('event_id', id)
        .range(from, from + PAGE - 1);
      if (!data || data.length === 0) break;
      allRows = allRows.concat(data);
      if (data.length < PAGE) break;
      from += PAGE;
    }
    const uniqueGuests = new Set(allRows.map((r: any) => r.guest_session_id)).size;
    setFavStats({ totalFavs: allRows.length, uniqueGuests });
  }, [id]);

  const fetchTextBlocks = useCallback(async () => {
    if (!id) return;
    const { data } = await (supabase.from('gallery_text_blocks' as any)
      .select('*').eq('event_id', id).order('sort_order', { ascending: true }) as any);
    if (data) setTextBlocks(data as unknown as TextBlock[]);
  }, [id]);

  useEffect(() => { fetchEvent(); fetchPhotos(); fetchFavStats(); fetchTextBlocks(); }, [fetchEvent, fetchPhotos, fetchFavStats, fetchTextBlocks]);

  // Refresh photos & show success toast when upload completes
  useEffect(() => {
    if (upload.isDone) {
      if (id) invalidatePhotoCache(id);
      fetchPhotos();
      fetchEvent();
      if (upload.successCount > 0 && upload.failedFiles.length === 0) {
        toast({
          title: 'Upload Complete',
          description: `${upload.successCount} photo${upload.successCount > 1 ? 's' : ''} added to gallery.`,
        });
      }
    }
  }, [upload.isDone, upload.successCount, upload.failedFiles.length, fetchPhotos, fetchEvent, toast, id]);

  // Refresh when ZIP upload completes
  useEffect(() => {
    if (zipUpload.isDone) {
      if (id) invalidatePhotoCache(id);
      fetchPhotos();
      fetchEvent();
      if (zipUpload.successCount > 0) {
        toast({
          title: zipUpload.failedCount > 0 ? 'ZIP Upload Finished' : 'ZIP Upload Complete',
          description: zipUpload.failedCount > 0
            ? `${zipUpload.successCount} photos uploaded, ${zipUpload.failedCount} failed.`
            : `Successfully uploaded ${zipUpload.successCount} photos!`,
        });
      }
    }
  }, [zipUpload.isDone, zipUpload.successCount, zipUpload.failedCount, fetchPhotos, fetchEvent, toast, id]);

  // Show ZIP error toast
  useEffect(() => {
    if (zipUpload.error) {
      toast({ title: 'ZIP Upload Error', description: zipUpload.error, variant: 'destructive' });
    }
  }, [zipUpload.error, toast]);

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
    if (id) invalidatePhotoCache(id);
    fetchPhotos();
    fetchEvent();
  };

  /* ── ZIP helpers (concurrent fetch for speed) ── */
  const buildZip = async (targetPhotos: Photo[], label: string) => {
    if (targetPhotos.length === 0) { toast({ title: 'No photos to download' }); return; }
    setDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(event?.name ?? label);
      const CONCURRENT = 6;
      let completed = 0;

      for (let i = 0; i < targetPhotos.length; i += CONCURRENT) {
        const batch = targetPhotos.slice(i, i + CONCURRENT);
        const blobs = await Promise.all(
          batch.map(async (p) => {
            const res = await fetch(p.url);
            return { blob: await res.blob(), name: p.file_name ?? `photo-${targetPhotos.indexOf(p) + 1}.jpg` };
          })
        );
        blobs.forEach(({ blob, name }) => folder?.file(name, blob));
        completed += batch.length;
        setDownloadProgress(`${completed} / ${targetPhotos.length}`);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${event?.name ?? label}.zip`);
      toast({ title: `${targetPhotos.length} photos downloaded` });
    } catch (_err) {
      toast({ title: 'Download failed', description: 'Please try again.' });
    } finally {
      setDownloading(false); setDownloadProgress('');
    }
  };

  const downloadAll = () => buildZip(photos, 'gallery');
  const downloadFavorites = () => buildZip(photos.filter((p) => isFavorite(p.id)), 'favorites');

  if (eventLoading || !event) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center space-y-3">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground/30" />
          <p className="text-[11px] text-muted-foreground/50 uppercase tracking-widest">Loading gallery...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (eventError) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center space-y-3">
          <p className="text-sm text-destructive">{eventError}</p>
          <Button variant="outline" size="sm" onClick={fetchEvent}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  const isOwner = user?.id === event.user_id;
  const canDownloadAll = isOwner || event.downloads_enabled;
  const canDownloadAnything = canDownloadAll;

  const displayPhotos = filter === 'favorites'
    ? photos.filter((p) => isFavorite(p.id))
    : photos;

  const { visiblePhotos: paginatedPhotos, hasMore, sentinelRef } = useInfinitePhotos(displayPhotos);

  const layout = event.gallery_layout || 'classic';
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
  const gridPhotos = paginatedPhotos.map(p => toGridPhoto(p, isFavorite(p.id)));

  return (
    <DashboardLayout>
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      <input ref={zipInputRef} type="file" accept=".zip" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) zipUpload.uploadZip(f); e.target.value = ''; }} />

      {/* Cover banner */}
      {event.cover_url && (
        <div className="relative -mx-5 -mt-6 mb-5 h-32 sm:h-40 overflow-hidden sm:-mx-8 lg:-mx-10">
          <img src={event.cover_url} alt={event.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-5 gap-2">
        <div>
          <h1 className="font-serif text-xl sm:text-[22px] font-semibold text-foreground leading-tight">{event.name}</h1>
          <p className="text-[11px] text-muted-foreground/60 tracking-wide mt-0.5">
            {format(new Date(event.event_date), 'MMMM d, yyyy')} · {photos.length} photos
            {favStats.totalFavs > 0 && (
              <> · <Heart className="inline h-3 w-3 text-primary" fill="hsl(var(--primary))" /> {favStats.totalFavs} favorites from {favStats.uniqueGuests} guest{favStats.uniqueGuests !== 1 ? 's' : ''}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {isOwner && (
            <>
              <Button onClick={() => fileInputRef.current?.click()} disabled={upload.isUploading || zipUpload.isUploading || zipUpload.isExtracting}
                variant="ghost" size="sm" className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]">
                <Upload className="mr-1 h-3 w-3" />Upload
              </Button>
              <Button onClick={() => zipInputRef.current?.click()} disabled={upload.isUploading || zipUpload.isUploading || zipUpload.isExtracting}
                variant="ghost" size="sm" className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]">
                <FileArchive className="mr-1 h-3 w-3" />Upload ZIP
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShareOpen(true)} className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]">
                <Share2 className="mr-1 h-3 w-3" />Share
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setTextEditorOpen(true)} className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]">
                <Type className="mr-1 h-3 w-3" />Add Text
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)} className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]">
                <Settings className="mr-1 h-3 w-3" />Settings
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Upload Progress Panels */}
      <UploadProgressPanel {...upload} onRetry={upload.retry} onRetrySingle={upload.retrySingle} onCancel={upload.cancel} onDismiss={upload.dismiss} />

      {/* ZIP Upload Progress */}
      {(zipUpload.isExtracting || zipUpload.isUploading || zipUpload.isDone) && (
        <div className="mb-5">
          <div className="border border-border bg-card px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              {zipUpload.isExtracting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <p className="text-[12px] text-foreground font-medium">Extracting images from ZIP…</p>
                </div>
              ) : zipUpload.isUploading ? (
                <p className="text-[12px] text-foreground font-medium">
                  Uploading {zipUpload.completedFiles} of {zipUpload.totalFiles} photos…
                  <span className="ml-2 text-muted-foreground/50 font-normal">
                    {zipUpload.totalFiles - zipUpload.completedFiles} remaining
                  </span>
                </p>
              ) : zipUpload.isDone && zipUpload.failedCount === 0 ? (
                <div className="flex items-center gap-2 text-primary">
                  <FileArchive className="h-4 w-4" />
                  <p className="text-[12px] font-medium">Successfully uploaded {zipUpload.successCount} photos!</p>
                </div>
              ) : zipUpload.isDone && zipUpload.failedCount > 0 ? (
                <p className="text-[12px] text-foreground font-medium">
                  {zipUpload.successCount} uploaded, {zipUpload.failedCount} failed
                </p>
              ) : null}

              {zipUpload.isDone && (
                <button onClick={zipUpload.dismiss} className="text-muted-foreground/40 hover:text-foreground transition-colors p-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {zipUpload.isUploading && (
              <Progress value={zipUpload.percent} className="h-1" />
            )}
          </div>
        </div>
      )}

      {/* Tabs: Photos | Guest Favorites | Selections | Comments */}
      {isOwner ? (
        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 gap-0 flex-wrap">
            <TabsTrigger value="photos"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-muted-foreground/50 data-[state=active]:text-foreground">
              All Photos
            </TabsTrigger>
            <TabsTrigger value="favorites"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-muted-foreground/50 data-[state=active]:text-foreground flex items-center gap-1.5">
              <Heart className="h-3 w-3" /> Guest Favorites
              {favStats.totalFavs > 0 && (
                <span className="text-[10px] bg-foreground/10 text-foreground/70 rounded-full px-1.5 py-px leading-none">{favStats.totalFavs}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="selections"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-muted-foreground/50 data-[state=active]:text-foreground flex items-center gap-1.5">
              <CheckSquare className="h-3 w-3" /> Selections
            </TabsTrigger>
            <TabsTrigger value="comments"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-muted-foreground/50 data-[state=active]:text-foreground flex items-center gap-1.5">
              <MessageCircle className="h-3 w-3" /> Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="mt-4">
            {/* Text Block Manager */}
            <TextBlockManager eventId={event.id} textBlocks={textBlocks} onRefresh={fetchTextBlocks} />

            {/* Owner filter bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-0">
                <button onClick={() => setFilter('all')}
                  className={`px-3 py-2 text-[11px] uppercase tracking-[0.08em] border-b-2 transition-colors ${
                    filter === 'all' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
                  }`}>All</button>
                <button onClick={() => setFilter('favorites')}
                  className={`px-3 py-2 text-[11px] uppercase tracking-[0.08em] border-b-2 transition-colors flex items-center gap-1.5 ${
                    filter === 'favorites' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
                  }`}>
                  <Heart className="h-3 w-3" /> My Favorites
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

            {/* Drag & Drop upload zone (owner only, empty state) */}
            {photos.length === 0 && (
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
                {!upload.isUploading && !zipUpload.isUploading && !zipUpload.isExtracting && (
                  <>
                    <p className="mt-1 text-[10px] text-muted-foreground/35">or</p>
                    <div className="flex gap-2 mt-2.5">
                      <Button variant="outline" size="sm"
                        className="text-[10px] h-7 px-4 uppercase tracking-[0.08em] border-border"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                        Select Photos
                      </Button>
                      <Button variant="outline" size="sm"
                        className="text-[10px] h-7 px-4 uppercase tracking-[0.08em] border-border"
                        onClick={(e) => { e.stopPropagation(); zipInputRef.current?.click(); }}>
                        <FileArchive className="mr-1 h-3 w-3" /> Upload ZIP
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Inline drop zone when photos exist */}
            {photos.length > 0 && !upload.isUploading && (
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                className={`mb-5 flex items-center justify-center gap-2 border border-dashed py-3 px-5 transition-colors cursor-pointer ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
                }`} onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5 text-muted-foreground/30" />
                <p className="text-[11px] text-muted-foreground/40">Drop photos here or click to upload more</p>
              </div>
            )}

            {/* Photo Grid */}
            {displayPhotos.length === 0 && photos.length > 0 && filter === 'favorites' ? (
              <div className="py-24 text-center">
                <Heart className="mx-auto h-8 w-8 text-muted-foreground/12" />
                <p className="mt-2 font-serif text-sm text-muted-foreground/50">No favorites yet</p>
                <p className="mt-1 text-[11px] text-muted-foreground/40">Click the heart icon on any photo to add it here</p>
              </div>
            ) : displayPhotos.length > 0 ? (
              ['editorial-collage', 'pixieset', 'cinematic', 'mosaic', 'minimal-portfolio', 'storybook'].includes(layout) ? (
                layout === 'editorial-collage' ? (
                  <EditorialCollageGrid photos={gridPhotos} eventName={event.name} isFavorite={isFavorite} toggleFavorite={toggleGuestFavorite} canDownload={canDownloadAnything} isOwner={isOwner} onDelete={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) deletePhoto(orig); }} onShare={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) setSharePhoto(orig); }} />
                ) : layout === 'pixieset' ? (
                  <PixiesetEditorialGrid photos={gridPhotos} eventName={event.name} isFavorite={isFavorite} toggleFavorite={toggleGuestFavorite} canDownload={canDownloadAnything} isOwner={isOwner} onDelete={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) deletePhoto(orig); }} onShare={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) setSharePhoto(orig); }} />
                ) : layout === 'cinematic' ? (
                  <CinematicMasonryGrid photos={gridPhotos} isFavorite={isFavorite} toggleFavorite={toggleGuestFavorite} canDownload={canDownloadAnything} isOwner={isOwner} onDelete={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) deletePhoto(orig); }} onShare={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) setSharePhoto(orig); }} />
                ) : layout === 'minimal-portfolio' ? (
                  <MinimalPortfolioLayout photos={gridPhotos} eventName={event.name} isFavorite={isFavorite} toggleFavorite={toggleGuestFavorite} canDownload={canDownloadAnything} isOwner={isOwner} onDelete={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) deletePhoto(orig); }} onShare={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) setSharePhoto(orig); }} />
                ) : layout === 'storybook' ? (
                  <StoryBookLayout photos={gridPhotos} eventName={event.name} eventDate={event.event_date} isFavorite={isFavorite} toggleFavorite={toggleGuestFavorite} canDownload={canDownloadAnything} isOwner={isOwner} onDelete={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) deletePhoto(orig); }} onShare={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) setSharePhoto(orig); }} />
                ) : (
                  <HighlightMosaicGrid photos={gridPhotos} eventName={event.name} isFavorite={isFavorite} toggleFavorite={toggleGuestFavorite} canDownload={canDownloadAnything} isOwner={isOwner} onDelete={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) deletePhoto(orig); }} onShare={(gp) => { const orig = photos.find(p => p.id === gp.id); if (orig) setSharePhoto(orig); }} />
                )
              ) : (
                <>
                <div className={gridClass}>
                  {paginatedPhotos.map(photo => {
                    const fav = isFavorite(photo.id);
                    return (
                      <div key={photo.id} className={`group ${getItemClass(layout)}`}>
                        <ProgressiveImage src={photo.url} alt="" className={getImgClass(layout)} context="grid" />
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
                            <button onClick={() => {
                              fetch(photo.url).then(r => r.blob()).then(blob => {
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url; a.download = photo.file_name ?? 'photo.jpg';
                                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              });
                            }} className="rounded-full bg-card/70 backdrop-blur-sm p-1 text-foreground/80 hover:bg-card/90 transition">
                              <Download className="h-3 w-3" />
                            </button>
                          )}
                          {isOwner && (
                            <button onClick={() => deletePhoto(photo)} className="rounded-full bg-card/70 backdrop-blur-sm p-1 text-destructive hover:bg-card/90 transition">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        {isOwner && (
                          <div className="absolute bottom-1.5 left-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}>
                            <PhotoSectionSelect photoId={photo.id} currentSection={photo.section} onUpdate={(s) => {
                              setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, section: s } : p));
                            }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {hasMore && (
                  <div ref={sentinelRef} className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
                  </div>
                )}
                </>
              )
            ) : null}

            {/* Guest Selections */}
            {event && (
              <div className="mt-8 border-t border-border pt-6">
                <GuestSelectionsViewer eventId={event.id} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            <GuestFavoritesTab eventId={event.id} eventName={event.name} />
          </TabsContent>

          <TabsContent value="selections" className="mt-4">
            <SelectionsViewer eventId={event.id} />
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <CommentsViewer eventId={event.id} />
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {/* Non-owner view: just show the gallery without tabs */}
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

          {displayPhotos.length === 0 && photos.length > 0 && filter === 'favorites' ? (
            <div className="py-24 text-center">
              <Heart className="mx-auto h-8 w-8 text-muted-foreground/12" />
              <p className="mt-2 font-serif text-sm text-muted-foreground/50">No favorites yet</p>
            </div>
          ) : displayPhotos.length > 0 ? (
            <>
            <div className={gridClass}>
              {paginatedPhotos.map(photo => {
                const fav = isFavorite(photo.id);
                return (
                  <div key={photo.id} className={`group ${getItemClass(layout)}`}>
                    <img src={photo.url} alt="" className={getImgClass(layout)} loading="lazy" />
                    <button onClick={() => toggleGuestFavorite(photo.id)}
                      className="absolute top-1.5 right-1.5 z-10 rounded-full bg-card/60 backdrop-blur-sm p-1.5 transition-all duration-200 hover:bg-card/80 active:scale-125">
                      <Heart className={`h-3.5 w-3.5 transition-all duration-200 ${fav ? 'text-primary scale-110' : 'text-foreground/50 hover:text-foreground/70'}`}
                        fill={fav ? 'hsl(var(--primary))' : 'none'} />
                    </button>
                    <div className="absolute inset-0 transition-colors duration-200 group-hover:bg-foreground/10 pointer-events-none" />
                  </div>
                );
              })}
            </div>
            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
              </div>
            )}
            </>
          ) : null}
        </>
      )}

      {/* Mobile sticky upload button */}
      {isOwner && !upload.isUploading && !upload.isDone && (
        <button onClick={() => fileInputRef.current?.click()}
          className="fixed bottom-20 right-4 z-40 sm:hidden bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center shadow-lg active:scale-95 transition-transform">
          <Upload className="h-5 w-5" />
        </button>
      )}

      {event && (
        <>
          <ShareModal open={shareOpen} onOpenChange={setShareOpen} eventSlug={event.slug} eventName={event.name} pin={event.gallery_pin} />
          <EventSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} event={event} onUpdated={() => { fetchEvent(); fetchPhotos(); }} />
          <TextBlockEditor
            open={textEditorOpen}
            onOpenChange={setTextEditorOpen}
            eventId={event.id}
            nextSortOrder={Math.max(...textBlocks.map(b => b.sort_order), 0) + 1}
            onSaved={fetchTextBlocks}
          />
          {sharePhoto && (
            <PhotoShareSheet open={!!sharePhoto} onOpenChange={() => setSharePhoto(null)}
              photoUrl={sharePhoto.url} photoName={sharePhoto.file_name} eventName={event.name} canDownload={canDownloadAnything} />
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default EventGallery;
