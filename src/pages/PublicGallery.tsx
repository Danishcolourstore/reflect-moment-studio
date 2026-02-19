import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGuestFavorites } from '@/hooks/use-guest-favorites';
import { useGuestSession } from '@/hooks/use-guest-session';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Heart, Download, FolderDown, Loader2, PackageOpen, Share2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  cover_photo_url: string | null;
  gallery_password: string | null;
  downloads_enabled: boolean;
  layout: string;
  is_published: boolean;
}

function toGridPhoto(p: Photo, isFav: boolean) {
  return { id: p.id, url: p.storage_path, is_favorite: isFav, file_name: p.filename };
}

const GRID_CLASSES: Record<string, string> = {
  classic: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[3px]',
  masonry: 'columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-[3px]',
  justified: 'flex flex-wrap gap-[3px]',
  editorial: 'columns-1 sm:columns-2 lg:columns-3 gap-4',
};

type GalleryFilter = 'all' | 'favorites';

const PublicGallery = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [sharePhoto, setSharePhoto] = useState<Photo | null>(null);

  const { favoriteCount, toggleFavorite, isFavorite } = useGuestFavorites(event?.id);
  useGuestSession(event?.id);

  const fetchGallery = useCallback(async () => {
    if (!slug) return;

    const { data } = await (supabase
      .from('events')
      .select('*') as any)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const ev = data as unknown as Event;

    // Re-check password unlock
    if (ev.gallery_password) {
      const unlocked = sessionStorage.getItem(`unlocked_${ev.id}`);
      if (unlocked !== 'true') {
        // Send back to cover page for password entry
        navigate(`/gallery/${ev.slug}`, { replace: true });
        return;
      }
    }

    setEvent(ev);

    const { data: photoData } = await (supabase.from('photos').select('*') as any)
      .eq('event_id', ev.id)
      .order('sort_order', { ascending: true });
    if (photoData) setPhotos(photoData as unknown as Photo[]);
    setLoading(false);
  }, [slug, navigate]);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  const buildZip = async (targetPhotos: Photo[], label: string) => {
    if (targetPhotos.length === 0) { toast({ title: 'No photos to download' }); return; }
    setDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(event?.title ?? label);
      for (let i = 0; i < targetPhotos.length; i++) {
        setDownloadProgress(`${i + 1} / ${targetPhotos.length}`);
        const res = await fetch(targetPhotos[i].storage_path);
        const blob = await res.blob();
        folder?.file(targetPhotos[i].filename ?? `photo-${i + 1}.jpg`, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${event?.title ?? label}.zip`);
      toast({ title: `${targetPhotos.length} photos downloaded` });
    } catch (_err) { toast({ title: 'Download failed' }); }
    finally { setDownloading(false); setDownloadProgress(''); }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <p className="text-[11px] text-muted-foreground/50 uppercase tracking-widest">Loading gallery…</p>
      </div>
    );
  }

  /* ── Not Found ── */
  if (notFound) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 text-center">
        <h1 className="font-serif text-4xl font-semibold text-primary mb-2">Gallery Not Found</h1>
        <p className="text-[12px] text-muted-foreground/50">This gallery link is invalid or has been removed.</p>
      </div>
    );
  }

  if (!event) return null;

  const canDownloadAll = event.downloads_enabled;
  const canDownloadAnything = canDownloadAll;
  const displayPhotos = filter === 'favorites' ? photos.filter((p) => isFavorite(p.id)) : photos;
  const layout = event.layout || 'classic';
  const gridClass = GRID_CLASSES[layout] ?? GRID_CLASSES.masonry;
  const gridPhotos = displayPhotos.map(p => toGridPhoto(p, isFavorite(p.id)));

  const getItemClass = (l: string) => {
    switch (l) {
      case 'classic': return 'relative aspect-square overflow-hidden';
      case 'justified': return 'relative h-[200px] sm:h-[240px] flex-grow';
      case 'editorial': return 'relative mb-4 break-inside-avoid';
      default: return 'relative mb-[3px] break-inside-avoid';
    }
  };
  const getImgClass = (l: string) => {
    switch (l) {
      case 'classic': return 'h-full w-full object-cover';
      case 'justified': return 'h-full w-auto object-cover';
      case 'editorial': return 'w-full block';
      default: return 'w-full block';
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Cover */}
      {event.cover_photo_url && (
        <div className="relative h-40 sm:h-56 overflow-hidden">
          <img src={event.cover_photo_url} alt={event.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-5 gap-2">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight">{event.title}</h1>
            <p className="text-[11px] text-muted-foreground/60 tracking-wide mt-1">
              {format(new Date(event.date), 'MMMM d, yyyy')} · {photos.length} photos
            </p>
          </div>
          {favoriteCount > 0 && (
            <div className="flex items-center gap-1.5 text-[12px] text-primary font-medium">
              <Heart className="h-3.5 w-3.5" fill="hsl(var(--primary))" />
              <span>{favoriteCount} Selected</span>
            </div>
          )}
        </div>

        {/* Utility bar */}
        <div className="flex items-center justify-between mb-4 border-b border-border">
          <div className="flex items-center">
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
                  <DropdownMenuItem onClick={() => buildZip(photos, 'gallery')} className="text-[12px] gap-2">
                    <PackageOpen className="h-3.5 w-3.5" /> All Photos ({photos.length})
                  </DropdownMenuItem>
                )}
                {favoriteCount > 0 && (
                  <DropdownMenuItem onClick={() => buildZip(photos.filter(p => isFavorite(p.id)), 'favorites')} className="text-[12px] gap-2">
                    <Heart className="h-3.5 w-3.5" /> Favorites ({favoriteCount})
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Photo grid */}
        {displayPhotos.length === 0 && photos.length > 0 && filter === 'favorites' ? (
          <div className="py-24 text-center">
            <Heart className="mx-auto h-8 w-8 text-muted-foreground/12" />
            <p className="mt-2 font-serif text-sm text-muted-foreground/50">No favorites yet</p>
            <p className="mt-1 text-[11px] text-muted-foreground/40">Click the heart icon on any photo</p>
          </div>
        ) : displayPhotos.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-sm text-muted-foreground/50">No photos in this gallery yet</p>
          </div>
        ) : ['editorial-collage', 'pixieset', 'cinematic', 'mosaic'].includes(layout) ? (
          layout === 'editorial-collage' ? (
            <EditorialCollageGrid photos={gridPhotos} eventName={event.title} isFavorite={isFavorite} toggleFavorite={toggleFavorite} canDownload={canDownloadAnything} onShare={(p) => { const orig = photos.find(ph => ph.id === p.id); if (orig) setSharePhoto(orig); }} />
          ) : layout === 'pixieset' ? (
            <PixiesetEditorialGrid photos={gridPhotos} eventName={event.title} isFavorite={isFavorite} toggleFavorite={toggleFavorite} canDownload={canDownloadAnything} onShare={(p) => { const orig = photos.find(ph => ph.id === p.id); if (orig) setSharePhoto(orig); }} />
          ) : layout === 'cinematic' ? (
            <CinematicMasonryGrid photos={gridPhotos} isFavorite={isFavorite} toggleFavorite={toggleFavorite} canDownload={canDownloadAnything} onShare={(p) => { const orig = photos.find(ph => ph.id === p.id); if (orig) setSharePhoto(orig); }} />
          ) : (
            <HighlightMosaicGrid photos={gridPhotos} eventName={event.title} isFavorite={isFavorite} toggleFavorite={toggleFavorite} canDownload={canDownloadAnything} onShare={(p) => { const orig = photos.find(ph => ph.id === p.id); if (orig) setSharePhoto(orig); }} />
          )
        ) : (
          <div className={gridClass}>
            {displayPhotos.map(photo => {
              const fav = isFavorite(photo.id);
              return (
                <div key={photo.id} className={`group ${getItemClass(layout)}`}>
                  <img src={photo.storage_path} alt="" className={getImgClass(layout)} loading="lazy" />
                  <button onClick={() => { toggleFavorite(photo.id); if (!fav) toast({ title: 'Added to Favorites', description: 'Photo saved to your selections.' }); }}
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
                      <a href={photo.storage_path} download={photo.filename ?? true}
                        className="rounded-full bg-card/70 backdrop-blur-sm p-1 text-foreground/80 hover:bg-card/90 transition">
                        <Download className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer branding */}
        <div className="mt-12 pb-8 text-center">
          <p className="text-[9px] text-muted-foreground/30 tracking-[0.15em] uppercase">Powered by MirrorAI</p>
        </div>

        {sharePhoto && (
          <PhotoShareSheet open={!!sharePhoto} onOpenChange={() => setSharePhoto(null)}
            photoUrl={sharePhoto.storage_path} photoName={sharePhoto.filename} eventName={event.title} canDownload={canDownloadAnything} />
        )}
      </div>
    </div>
  );
};

export default PublicGallery;
