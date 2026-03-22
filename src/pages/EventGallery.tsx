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
  PackageOpen, Loader2, FolderDown, Settings, FileArchive, LayoutGrid, Image,
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
import { GuestFavoritesTab } from '@/components/GuestFavoritesTab';
import { PhotoSectionSelect } from '@/components/PhotoSectionSelect';
import { SelectionsViewer } from '@/components/SelectionsViewer';
import { CommentsViewer } from '@/components/CommentsViewer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageCircle, CheckSquare, Type } from 'lucide-react';
import { TextBlockEditor, TextBlockManager, type TextBlock } from '@/components/GalleryTextBlock';
import { usePortfolioPhotos } from '@/hooks/use-portfolio-photos';

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
  classic: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-[3px]',
  masonry: 'columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-[3px]',
  justified: 'flex flex-wrap gap-[3px]',
  editorial: 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4',
};

const PREMIUM_LAYOUTS = ['editorial-collage', 'pixieset', 'cinematic', 'mosaic', 'minimal-portfolio', 'storybook'];

const LAYOUT_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'justified', label: 'Justified' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'editorial-collage', label: 'Collage' },
  { value: 'pixieset', label: 'Pixieset' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'mosaic', label: 'Mosaic' },
  { value: 'minimal-portfolio', label: 'Portfolio' },
  { value: 'storybook', label: 'Story Book' },
];

function toGridPhoto(p: Photo, isFav: boolean) {
  return { id: p.id, url: p.url, is_favorite: isFav, file_name: p.file_name };
}

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

/* ─────────────── Premium Grid Renderer (shared) ─────────────── */
function PremiumGridRenderer({
  layout, gridPhotos, event, isFavorite, toggleFavorite, canDownload, isOwner, photos, setSharePhoto, deletePhoto,
}: {
  layout: string;
  gridPhotos: ReturnType<typeof toGridPhoto>[];
  event: Event;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  canDownload: boolean;
  isOwner: boolean;
  photos: Photo[];
  setSharePhoto: (p: Photo | null) => void;
  deletePhoto: (p: Photo) => void;
}) {
  const findOrig = (gp: { id: string }) => photos.find(p => p.id === gp.id);
  const onDelete = (gp: { id: string }) => { const o = findOrig(gp); if (o) deletePhoto(o); };
  const onShare = (gp: { id: string }) => { const o = findOrig(gp); if (o) setSharePhoto(o); };

  const common = { photos: gridPhotos, isFavorite, toggleFavorite, canDownload, isOwner, onDelete, onShare };

  switch (layout) {
    case 'editorial-collage':
      return <EditorialCollageGrid {...common} eventName={event.name} />;
    case 'pixieset':
      return <PixiesetEditorialGrid {...common} eventName={event.name} />;
    case 'cinematic':
      return <CinematicMasonryGrid {...common} />;
    case 'minimal-portfolio':
      return <MinimalPortfolioLayout {...common} eventName={event.name} />;
    case 'storybook':
      return <StoryBookLayout {...common} eventName={event.name} eventDate={event.event_date} />;
    default:
      return <HighlightMosaicGrid {...common} eventName={event.name} />;
  }
}

/* ─────────────── Standard Grid Renderer (shared) ─────────────── */
function StandardGridRenderer({
  layout, paginatedPhotos, isFavorite, toggleFavorite, canDownload, isOwner, hasMore, sentinelRef,
  setSharePhoto, deletePhoto, isPortfolioPhoto, togglePortfolioPhoto,
  isArtGallery, toggleArtGallery,
}: {
  layout: string;
  paginatedPhotos: Photo[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  canDownload: boolean;
  isOwner: boolean;
  hasMore: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  setSharePhoto: (p: Photo | null) => void;
  deletePhoto: (p: Photo) => void;
  isPortfolioPhoto?: (id: string) => boolean;
  togglePortfolioPhoto?: (id: string) => void;
  isArtGallery?: (id: string) => boolean;
  toggleArtGallery?: (id: string) => void;
}) {
  const gridClass = GRID_CLASSES[layout] ?? GRID_CLASSES.masonry;
  const { toast } = useToast();

  return (
    <>
      <div className={gridClass}>
        {paginatedPhotos.map(photo => {
          const fav = isFavorite(photo.id);
          return (
            <div key={photo.id} className={`group ${getItemClass(layout)}`}>
              <ProgressiveImage src={photo.url} alt="" className={getImgClass(layout)} context="grid" />

              {/* Favorite */}
              <button
                onClick={() => {
                  toggleFavorite(photo.id);
                  if (!fav) toast({ title: 'Added to Favorites' });
                }}
                className="absolute top-2 right-2 z-10 rounded-full bg-black/40 backdrop-blur-md p-1.5 transition-all duration-200 hover:bg-black/60 active:scale-110"
              >
                <Heart
                  className={`h-3.5 w-3.5 transition-all duration-200 ${fav ? 'text-primary scale-110' : 'text-white/70 hover:text-white'}`}
                  fill={fav ? 'hsl(var(--primary))' : 'none'}
                />
              </button>

              {/* Portfolio (owner only) */}
              {isOwner && isPortfolioPhoto && togglePortfolioPhoto && (
                <button
                  onClick={() => togglePortfolioPhoto(photo.id)}
                  className={`absolute top-2 left-2 z-10 rounded-full backdrop-blur-md p-1.5 transition-all duration-200 ${
                    isPortfolioPhoto(photo.id)
                      ? 'bg-primary/80 hover:bg-primary/90'
                      : 'bg-black/40 opacity-0 group-hover:opacity-100 hover:bg-black/60'
                  }`}
                  title={isPortfolioPhoto(photo.id) ? 'Remove from Portfolio' : 'Set as Portfolio Image'}
                >
                  <Image className={`h-3.5 w-3.5 ${isPortfolioPhoto(photo.id) ? 'text-primary-foreground' : 'text-white/70'}`} />
                </button>
              )}

              {/* Art Gallery toggle (owner only) */}
              {isOwner && isArtGallery && toggleArtGallery && (
                <button
                  onClick={() => toggleArtGallery(photo.id)}
                  className={`absolute top-2 z-10 rounded-full backdrop-blur-md p-1.5 transition-all duration-200 ${
                    isPortfolioPhoto ? 'left-10' : 'left-2'
                  } ${
                    isArtGallery(photo.id)
                      ? 'bg-[#C8A97E]/80 hover:bg-[#C8A97E]/90'
                      : 'bg-black/40 opacity-0 group-hover:opacity-100 hover:bg-black/60'
                  }`}
                  title={isArtGallery(photo.id) ? 'Remove from Art Gallery' : 'Add to Art Gallery'}
                >
                  <Diamond className={`h-3.5 w-3.5 ${isArtGallery(photo.id) ? 'text-white' : 'text-white/70'}`} />
                </button>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 pointer-events-none" />

              {/* Bottom actions — always visible on mobile (no hover) */}
              <div className="absolute bottom-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => setSharePhoto(photo)}
                  className="rounded-full bg-black/50 backdrop-blur-md p-1.5 text-white/80 hover:bg-black/70 hover:text-white transition"
                >
                  <Share2 className="h-3 w-3" />
                </button>
                {canDownload && (
                  <button
                    onClick={() => {
                      fetch(photo.url).then(r => r.blob()).then(blob => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = photo.file_name ?? 'photo.jpg';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      });
                    }}
                    className="rounded-full bg-black/50 backdrop-blur-md p-1.5 text-white/80 hover:bg-black/70 hover:text-white transition"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                )}
                {isOwner && (
                  <button
                    onClick={() => deletePhoto(photo)}
                    className="rounded-full bg-black/50 backdrop-blur-md p-1.5 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Section select (owner) */}
              {isOwner && (
                <div
                  className="absolute bottom-2 left-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PhotoSectionSelect
                    photoId={photo.id}
                    currentSection={photo.section}
                    onUpdate={(s) => {}} // handled via parent refetch
                  />
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
  );
}

/* ─────────────── Filter Bar (shared) ─────────────── */
function FilterBar({
  filter, setFilter, favoriteCount, canDownload, totalPhotos, downloading, downloadProgress, downloadAll, downloadFavorites,
}: {
  filter: GalleryFilter;
  setFilter: (f: GalleryFilter) => void;
  favoriteCount: number;
  canDownload: boolean;
  totalPhotos: number;
  downloading: boolean;
  downloadProgress: string;
  downloadAll: () => void;
  downloadFavorites: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-5 border-b border-border/50">
      <div className="flex items-center">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2.5 text-[11px] uppercase tracking-[0.1em] border-b-2 transition-all duration-200 font-medium ${
            filter === 'all'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground/40 hover:text-muted-foreground/70'
          }`}
        >
          All Photos
        </button>
        <button
          onClick={() => setFilter('favorites')}
          className={`px-4 py-2.5 text-[11px] uppercase tracking-[0.1em] border-b-2 transition-all duration-200 font-medium flex items-center gap-1.5 ${
            filter === 'favorites'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground/40 hover:text-muted-foreground/70'
          }`}
        >
          <Heart className="h-3 w-3" /> Favorites
          {favoriteCount > 0 && (
            <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 leading-none font-semibold">
              {favoriteCount}
            </span>
          )}
        </button>
      </div>

      {canDownload && totalPhotos > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={downloading}
              className="text-primary hover:bg-primary/10 text-[10px] h-8 px-3 uppercase tracking-[0.08em]"
            >
              {downloading ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  {downloadProgress}
                </>
              ) : (
                <>
                  <FolderDown className="mr-1.5 h-3 w-3" />
                  Download
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuItem onClick={downloadAll} className="text-[12px] gap-2">
              <PackageOpen className="h-3.5 w-3.5" /> All Photos ({totalPhotos})
            </DropdownMenuItem>
            {favoriteCount > 0 && (
              <DropdownMenuItem onClick={downloadFavorites} className="text-[12px] gap-2">
                <Heart className="h-3.5 w-3.5" /> Favorites ({favoriteCount})
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/* ─────────────── Empty Favorites State ─────────────── */
function EmptyFavorites() {
  return (
    <div className="py-24 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
        <Heart className="h-7 w-7 text-muted-foreground/20" />
      </div>
      <p className="font-serif text-base text-muted-foreground/50">No favorites yet</p>
      <p className="mt-1.5 text-[11px] text-muted-foreground/35 max-w-[240px] mx-auto">
        Tap the heart icon on any photo to save it to your favorites collection
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
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
  const { isPortfolioPhoto, togglePortfolioPhoto, count: portfolioCount, max: portfolioMax } = usePortfolioPhotos(user?.id);
  const [artGalleryIds, setArtGalleryIds] = useState<Set<string>>(new Set());

  const isArtGalleryPhoto = useCallback((id: string) => artGalleryIds.has(id), [artGalleryIds]);
  const toggleArtGallery = useCallback(async (photoId: string) => {
    const isNow = artGalleryIds.has(photoId);
    const next = new Set(artGalleryIds);
    if (isNow) next.delete(photoId); else next.add(photoId);
    setArtGalleryIds(next);
    await (supabase.from('photos').update({ is_art_gallery: !isNow } as any).eq('id', photoId) as any);
    toast({ title: isNow ? 'Removed from Art Gallery' : 'Added to Art Gallery' });
  }, [artGalleryIds, toast]);

  // Load art gallery flags
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from('photos').select('id').eq('event_id', id).eq('is_art_gallery' as any, true);
      if (data) setArtGalleryIds(new Set(data.map((p: any) => p.id)));
    })();
  }, [id]);

  /* ── Data fetching ── */
  const fetchEvent = useCallback(async () => {
    if (!id || !user) return;
    setEventLoading(true);
    setEventError(null);
    try {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
      if (error) { setEventError('Could not load event. Please try refreshing.'); return; }
      if (!data) { setEventError('Event not found.'); return; }
      if (data) {
        const evt = data as unknown as Event;
        if (evt.user_id !== user.id) { navigate('/dashboard'); return; }
        setEvent(evt);
      }
    } catch (err) {
      console.error('Gallery operation failed:', err);
      setEventError('Could not load event. Please try refreshing.');
    } finally {
      setEventLoading(false);
    }
  }, [id, user, navigate]);

  const fetchPhotos = useCallback(async () => {
    if (!id) return;
    const cached = getCachedPhotos<Photo[]>(id);
    if (cached) { setPhotos(cached); return; }
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
    let allRows: any[] = [];
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data } = await (supabase.from('favorites' as any).select('id, guest_session_id') as any)
        .eq('event_id', id).range(from, from + PAGE - 1);
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

  /* ── Upload effects ── */
  useEffect(() => {
    if (upload.isDone) {
      if (id) invalidatePhotoCache(id);
      fetchPhotos(); fetchEvent();
      if (upload.successCount > 0 && upload.failedFiles.length === 0) {
        toast({ title: 'Upload Complete', description: `${upload.successCount} photo${upload.successCount > 1 ? 's' : ''} added.` });
      }
    }
  }, [upload.isDone, upload.successCount, upload.failedFiles.length, fetchPhotos, fetchEvent, toast, id]);

  useEffect(() => {
    if (zipUpload.isDone) {
      if (id) invalidatePhotoCache(id);
      fetchPhotos(); fetchEvent();
      if (zipUpload.successCount > 0) {
        toast({
          title: zipUpload.failedCount > 0 ? 'ZIP Upload Finished' : 'ZIP Upload Complete',
          description: zipUpload.failedCount > 0
            ? `${zipUpload.successCount} uploaded, ${zipUpload.failedCount} failed.`
            : `Successfully uploaded ${zipUpload.successCount} photos!`,
        });
      }
    }
  }, [zipUpload.isDone, zipUpload.successCount, zipUpload.failedCount, fetchPhotos, fetchEvent, toast, id]);

  useEffect(() => {
    if (zipUpload.error) toast({ title: 'ZIP Upload Error', description: zipUpload.error, variant: 'destructive' });
  }, [zipUpload.error, toast]);

  /* ── Handlers ── */
  const handleFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (arr.length > 0) upload.uploadFiles(arr);
  }, [upload]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const deletePhoto = async (photo: Photo) => {
    // Delete from database
    const { error: dbError } = await supabase.from('photos').delete().eq('id', photo.id);
    if (dbError) {
      toast({ title: 'Failed to delete photo', variant: 'destructive' });
      return;
    }

    // Also delete file from storage to free up quota
    if (photo.url) {
      try {
        // Extract storage path from URL
        // Supabase storage URLs: .../storage/v1/object/public/gallery-photos/userId/fileName
        const match = photo.url.match(/gallery-photos\/(.+)$/);
        if (match?.[1]) {
          await supabase.storage.from('gallery-photos').remove([decodeURIComponent(match[1])]);
        }
      } catch {
        // Storage cleanup is best-effort — DB row is already deleted
        console.error('Storage cleanup failed for:', photo.url);
      }
    }

    if (id) invalidatePhotoCache(id);
    fetchPhotos();
    fetchEvent();
  };

  /* ── ZIP download ── */
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
    } catch (err) {
      console.error('Operation failed:', err);
      toast({ title: 'Download failed', description: 'Please try again.' });
    } finally {
      setDownloading(false); setDownloadProgress('');
    }
  };

  const downloadAll = () => buildZip(photos, 'gallery');
  const downloadFavorites = () => buildZip(photos.filter(p => isFavorite(p.id)), 'favorites');

  const displayPhotos = filter === 'favorites' ? photos.filter(p => isFavorite(p.id)) : photos;
  const { visiblePhotos: paginatedPhotos, hasMore, sentinelRef } = useInfinitePhotos(displayPhotos);

  /* ── Loading / Error states ── */
  if (eventLoading || !event) {
    return (
      <DashboardLayout>
        <div className="py-24 text-center space-y-4">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary/40" />
          <p className="text-[11px] text-muted-foreground/40 uppercase tracking-[0.15em]">Loading gallery…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (eventError) {
    return (
      <DashboardLayout>
        <div className="py-24 text-center space-y-4">
          <p className="text-sm text-destructive">{eventError}</p>
          <Button variant="outline" size="sm" onClick={fetchEvent}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  const isOwner = user?.id === event.user_id;
  const canDownload = isOwner || event.downloads_enabled;
  const layout = event.gallery_layout || 'masonry';
  const gridPhotos = paginatedPhotos.map(p => toGridPhoto(p, isFavorite(p.id)));
  const allGridPhotos = displayPhotos.map(p => toGridPhoto(p, isFavorite(p.id)));

  const updateLayout = async (value: string) => {
    await supabase.from('events').update({ gallery_layout: value } as any).eq('id', event.id);
    setEvent(prev => prev ? { ...prev, gallery_layout: value } : prev);
  };

  /* ── Shared gallery renderer ── */
  const renderGallery = () => {
    if (displayPhotos.length === 0 && photos.length > 0 && filter === 'favorites') {
      return <EmptyFavorites />;
    }

    if (displayPhotos.length === 0) return null;

    if (PREMIUM_LAYOUTS.includes(layout)) {
      return (
        <PremiumGridRenderer
          layout={layout}
          gridPhotos={allGridPhotos}
          event={event}
          isFavorite={isFavorite}
          toggleFavorite={toggleGuestFavorite}
          canDownload={canDownload}
          isOwner={isOwner}
          photos={displayPhotos}
          setSharePhoto={setSharePhoto}
          deletePhoto={deletePhoto}
        />
      );
    }

    return (
      <StandardGridRenderer
        layout={layout}
        paginatedPhotos={paginatedPhotos}
        isFavorite={isFavorite}
        toggleFavorite={toggleGuestFavorite}
        canDownload={canDownload}
        isOwner={isOwner}
        hasMore={hasMore}
        sentinelRef={sentinelRef}
        setSharePhoto={setSharePhoto}
        deletePhoto={deletePhoto}
        isPortfolioPhoto={isPortfolioPhoto}
        togglePortfolioPhoto={togglePortfolioPhoto}
        isArtGallery={isArtGalleryPhoto}
        toggleArtGallery={toggleArtGallery}
      />
    );
  };

  return (
    <DashboardLayout>
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      <input ref={zipInputRef} type="file" accept=".zip" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) zipUpload.uploadZip(f); e.target.value = ''; }} />

      {/* Cover banner */}
      {event.cover_url && (
        <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 mb-6 h-44 sm:h-52 lg:h-64 overflow-hidden rounded-b-2xl">
          <img src={event.cover_url} alt={event.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-4 left-4 sm:left-6 lg:left-8">
            <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold text-white drop-shadow-lg leading-tight">
              {event.name}
            </h1>
            <p className="text-[11px] text-white/60 tracking-wide mt-1 drop-shadow">
              {format(new Date(event.event_date), 'MMMM d, yyyy')}
              {event.location && ` · ${event.location}`}
              {' · '}{photos.length} photos
            </p>
          </div>
        </div>
      )}

      {/* Header (no cover fallback) */}
      {!event.cover_url && (
        <div className="mb-6 lg:mb-8">
          <h1 className="font-serif text-xl sm:text-2xl lg:text-[28px] font-semibold text-foreground leading-tight">
            {event.name}
          </h1>
          <p className="text-[11px] lg:text-xs text-muted-foreground/50 tracking-wide mt-1.5 flex items-center gap-1.5 flex-wrap">
            {format(new Date(event.event_date), 'MMMM d, yyyy')}
            {event.location && <><span className="text-muted-foreground/20">·</span> {event.location}</>}
            <span className="text-muted-foreground/20">·</span> {photos.length} photos
            {favStats.totalFavs > 0 && (
              <>
                <span className="text-muted-foreground/20">·</span>
                <Heart className="inline h-3 w-3 text-primary" fill="hsl(var(--primary))" />
                {favStats.totalFavs} favorites from {favStats.uniqueGuests} guest{favStats.uniqueGuests !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>
      )}

      {/* Owner action bar — horizontally scrollable on mobile */}
      {isOwner && (
        <div className="flex items-center gap-1.5 mb-5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 text-[10px] lg:text-[11px] h-9 px-3 lg:px-4 uppercase tracking-[0.06em] flex-shrink-0 min-w-[44px]">
                <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
                {LAYOUT_OPTIONS.find(o => o.value === layout)?.label || 'Layout'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
              {LAYOUT_OPTIONS.map(opt => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => updateLayout(opt.value)}
                  className={`text-[12px] gap-2 ${layout === opt.value ? 'font-semibold text-primary' : ''}`}
                >
                  {layout === opt.value && <span className="text-primary">●</span>}
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-5 bg-border/30 mx-1 hidden sm:block flex-shrink-0" />

          <Button onClick={() => fileInputRef.current?.click()} disabled={upload.isUploading || zipUpload.isUploading}
            variant="ghost" size="sm" className="text-primary hover:bg-primary/10 text-[10px] lg:text-[11px] h-9 px-3 lg:px-4 uppercase tracking-[0.06em] flex-shrink-0 min-w-[44px]">
            <Upload className="mr-1.5 h-3.5 w-3.5" />Upload
          </Button>
          <Button onClick={() => zipInputRef.current?.click()} disabled={upload.isUploading || zipUpload.isUploading}
            variant="ghost" size="sm" className="text-primary hover:bg-primary/10 text-[10px] lg:text-[11px] h-9 px-3 lg:px-4 uppercase tracking-[0.06em] flex-shrink-0 min-w-[44px]">
            <FileArchive className="mr-1.5 h-3.5 w-3.5" />ZIP
          </Button>

          <div className="w-px h-5 bg-border/30 mx-1 hidden sm:block flex-shrink-0" />

          <Button variant="ghost" size="sm" onClick={() => setShareOpen(true)}
            className="text-primary hover:bg-primary/10 text-[10px] lg:text-[11px] h-9 px-3 lg:px-4 uppercase tracking-[0.06em] flex-shrink-0 min-w-[44px]">
            <Share2 className="mr-1.5 h-3.5 w-3.5" />Share
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setTextEditorOpen(true)}
            className="text-primary hover:bg-primary/10 text-[10px] lg:text-[11px] h-9 px-3 lg:px-4 uppercase tracking-[0.06em] flex-shrink-0 min-w-[44px]">
            <Type className="mr-1.5 h-3.5 w-3.5" />Text
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}
            className="text-primary hover:bg-primary/10 text-[10px] lg:text-[11px] h-9 px-3 lg:px-4 uppercase tracking-[0.06em] flex-shrink-0 min-w-[44px]">
            <Settings className="mr-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Upload progress */}
      <UploadProgressPanel {...upload} onRetry={upload.retry} onRetrySingle={upload.retrySingle} onCancel={upload.cancel} onDismiss={upload.dismiss} />

      {/* ZIP progress */}
      {(zipUpload.isExtracting || zipUpload.isUploading || zipUpload.isDone) && (
        <div className="mb-5">
          <div className="border border-border/40 bg-card/60 backdrop-blur-sm rounded-xl px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              {zipUpload.isExtracting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <p className="text-[12px] text-foreground font-medium">Extracting images from ZIP…</p>
                </div>
              ) : zipUpload.isUploading ? (
                <p className="text-[12px] text-foreground font-medium">
                  Uploading {zipUpload.completedFiles} of {zipUpload.totalFiles} photos…
                  <span className="ml-2 text-muted-foreground/40 font-normal">
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
                <button onClick={zipUpload.dismiss} className="text-muted-foreground/40 hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/30">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {zipUpload.isUploading && <Progress value={zipUpload.percent} className="h-1" />}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      {isOwner ? (
        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="bg-transparent border-b border-border/40 rounded-none w-full justify-start h-auto p-0 gap-0 overflow-x-auto scrollbar-hide">
            {[
              { value: 'photos', label: 'Photos', mobileLabel: 'Photos', icon: null },
              { value: 'favorites', label: 'Guest Favorites', mobileLabel: 'Favs', icon: Heart, badge: favStats.totalFavs },
              { value: 'selections', label: 'Selections', mobileLabel: 'Select', icon: CheckSquare },
              { value: 'comments', label: 'Comments', mobileLabel: 'Chat', icon: MessageCircle },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 py-2.5 text-[10px] sm:text-[11px] uppercase tracking-[0.08em] sm:tracking-[0.1em] text-muted-foreground/40 data-[state=active]:text-foreground font-medium flex items-center gap-1 sm:gap-1.5 transition-colors flex-shrink-0 min-w-[44px]"
              >
                {tab.icon && <tab.icon className="h-3 w-3" />}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.mobileLabel}</span>
                {tab.badge ? (
                  <span className="text-[9px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 leading-none font-semibold">
                    {tab.badge}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="photos" className="mt-5">
            <TextBlockManager eventId={event.id} textBlocks={textBlocks} onRefresh={fetchTextBlocks} />

            <FilterBar
              filter={filter} setFilter={setFilter} favoriteCount={favoriteCount}
              canDownload={canDownload} totalPhotos={photos.length}
              downloading={downloading} downloadProgress={downloadProgress}
              downloadAll={downloadAll} downloadFavorites={downloadFavorites}
            />

            {/* Drop zone – empty */}
            {photos.length === 0 && (
              <div
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                className={`mb-5 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-20 transition-all duration-300 cursor-pointer ${
                  isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/40 hover:border-primary/30'
                } ${upload.isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => !upload.isUploading && fileInputRef.current?.click()}
              >
                <div className="w-14 h-14 rounded-2xl bg-muted/20 flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-muted-foreground/25" />
                </div>
                <p className="text-[13px] text-muted-foreground/50 font-medium">
                  {upload.isUploading ? 'Upload in progress…' : 'Drop photos here to upload'}
                </p>
                {!upload.isUploading && !zipUpload.isUploading && (
                  <>
                    <p className="mt-1.5 text-[10px] text-muted-foreground/30">or</p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm"
                        className="text-[10px] h-8 px-5 uppercase tracking-[0.08em] rounded-lg"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                        Select Photos
                      </Button>
                      <Button variant="outline" size="sm"
                        className="text-[10px] h-8 px-5 uppercase tracking-[0.08em] rounded-lg"
                        onClick={(e) => { e.stopPropagation(); zipInputRef.current?.click(); }}>
                        <FileArchive className="mr-1 h-3 w-3" /> Upload ZIP
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Inline drop zone */}
            {photos.length > 0 && !upload.isUploading && (
              <div
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                className={`mb-5 flex items-center justify-center gap-2 border border-dashed rounded-xl py-3 px-5 transition-all duration-200 cursor-pointer ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-border/30 hover:border-primary/30'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5 text-muted-foreground/25" />
                <p className="text-[11px] text-muted-foreground/35">Drop photos here or click to upload more</p>
              </div>
            )}

            {renderGallery()}
          </TabsContent>

          <TabsContent value="favorites" className="mt-5">
            <GuestFavoritesTab eventId={event.id} eventName={event.name} />
          </TabsContent>

          <TabsContent value="selections" className="mt-5">
            <SelectionsViewer eventId={event.id} />
          </TabsContent>

          <TabsContent value="comments" className="mt-5">
            <CommentsViewer eventId={event.id} />
          </TabsContent>
        </Tabs>
      ) : (
        /* ── Non-owner (guest) view ── */
        <>
          <FilterBar
            filter={filter} setFilter={setFilter} favoriteCount={favoriteCount}
            canDownload={canDownload} totalPhotos={photos.length}
            downloading={downloading} downloadProgress={downloadProgress}
            downloadAll={downloadAll} downloadFavorites={downloadFavorites}
          />
          {renderGallery()}
        </>
      )}

      {/* Mobile sticky upload FAB */}
      {isOwner && !upload.isUploading && !upload.isDone && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="fixed bottom-20 right-4 z-40 sm:hidden bg-primary text-primary-foreground rounded-full w-13 h-13 flex items-center justify-center shadow-xl shadow-primary/20 active:scale-95 transition-transform"
        >
          <Upload className="h-5 w-5" />
        </button>
      )}

      {/* Modals */}
      {event && (
        <>
          <ShareModal open={shareOpen} onOpenChange={setShareOpen} eventSlug={event.slug} eventName={event.name} pin={event.gallery_pin} />
          <EventSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} event={event} onUpdated={() => { fetchEvent(); fetchPhotos(); }} />
          <TextBlockEditor
            open={textEditorOpen} onOpenChange={setTextEditorOpen}
            eventId={event.id}
            nextSortOrder={Math.max(...textBlocks.map(b => b.sort_order), 0) + 1}
            onSaved={fetchTextBlocks}
          />
          {sharePhoto && (
            <PhotoShareSheet open={!!sharePhoto} onOpenChange={() => setSharePhoto(null)}
              photoUrl={sharePhoto.url} photoName={sharePhoto.file_name} eventName={event.name} canDownload={canDownload} />
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default EventGallery;
