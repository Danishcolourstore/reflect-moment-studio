import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGuestFavorites } from '@/hooks/use-guest-favorites';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Download, FolderDown, Loader2, PackageOpen, Lock } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditorialCollageGrid } from '@/components/EditorialCollageGrid';
import { PixiesetEditorialGrid, CinematicMasonryGrid, HighlightMosaicGrid } from '@/components/PremiumGridLayouts';
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
  allow_full_download: boolean;
  allow_favorites_download: boolean;
  gallery_layout: string;
}

const GRID_CLASSES: Record<string, string> = {
  classic: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[3px]',
  masonry: 'columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-[3px]',
  justified: 'flex flex-wrap gap-[3px]',
  editorial: 'columns-1 sm:columns-2 lg:columns-3 gap-4',
};

type GalleryFilter = 'all' | 'favorites';

const PublicGallery = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pinRequired, setPinRequired] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');

  const { favoriteCount, toggleFavorite, isFavorite } = useGuestFavorites(id);

  const fetchGallery = useCallback(async (pin?: string) => {
    if (!id) return;
    const { data: eventData } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
    if (!eventData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const ev = eventData as unknown as Event;

    // Check PIN
    if (ev.gallery_pin) {
      const providedPin = pin || searchParams.get('pin');
      if (!providedPin || providedPin !== ev.gallery_pin) {
        setPinRequired(true);
        setLoading(false);
        return;
      }
    }

    setPinRequired(false);
    setEvent(ev);

    const { data: photoData } = await supabase.from('photos').select('*').eq('event_id', id).order('created_at', { ascending: false });
    if (photoData) setPhotos(photoData as Photo[]);
    setLoading(false);
  }, [id, searchParams]);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(false);
    setLoading(true);
    // Re-fetch with pin
    (async () => {
      if (!id) return;
      const { data: eventData } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
      if (!eventData) { setNotFound(true); setLoading(false); return; }
      const ev = eventData as unknown as Event;
      if (ev.gallery_pin && pinInput !== ev.gallery_pin) {
        setPinError(true);
        setLoading(false);
        return;
      }
      setPinRequired(false);
      setEvent(ev);
      const { data: photoData } = await supabase.from('photos').select('*').eq('event_id', id).order('created_at', { ascending: false });
      if (photoData) setPhotos(photoData as Photo[]);
      setLoading(false);
    })();
  };

  const buildZip = async (targetPhotos: Photo[], label: string) => {
    if (targetPhotos.length === 0) { toast({ title: 'No photos to download' }); return; }
    setDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(event?.name ?? label);
      for (let i = 0; i < targetPhotos.length; i++) {
        setDownloadProgress(`${i + 1} / ${targetPhotos.length}`);
        const res = await fetch(targetPhotos[i].url);
        const blob = await res.blob();
        folder?.file(targetPhotos[i].file_name ?? `photo-${i + 1}.jpg`, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${event?.name ?? label}.zip`);
      toast({ title: `${targetPhotos.length} photos downloaded` });
    } catch { toast({ title: 'Download failed' }); }
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

  /* ── PIN Gate ── */
  if (pinRequired) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-xs text-center space-y-8">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">Protected Gallery</h1>
            <p className="text-[11px] text-muted-foreground/60">Enter the PIN to view this gallery.</p>
          </div>
          <form onSubmit={handlePinSubmit} className="space-y-3">
            <Input
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
              placeholder="Enter PIN"
              className="bg-background border-border h-10 text-center text-[14px] tracking-[0.2em]"
              autoFocus
            />
            {pinError && (
              <p className="text-[10px] text-destructive">Incorrect PIN. Please try again.</p>
            )}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/85 text-primary-foreground h-10 text-[11px] tracking-[0.12em] uppercase font-medium">
              View Gallery
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const canDownloadAll = event.allow_full_download;
  const canDownloadFavs = event.allow_favorites_download;
  const canDownloadAnything = canDownloadAll || canDownloadFavs;
  const displayPhotos = filter === 'favorites' ? photos.filter((p) => isFavorite(p.id)) : photos;
  const layout = event.gallery_layout || 'masonry';
  const gridClass = GRID_CLASSES[layout] ?? GRID_CLASSES.masonry;

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
      {event.cover_url && (
        <div className="relative h-40 sm:h-56 overflow-hidden">
          <img src={event.cover_url} alt={event.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight">{event.name}</h1>
          <p className="text-[11px] text-muted-foreground/60 tracking-wide mt-1">
            {format(new Date(event.event_date), 'MMMM d, yyyy')} · {event.photo_count} photos
          </p>
        </div>

        {/* Utility bar */}
        <div className="flex items-center justify-between mb-4 border-b border-border">
          <div className="flex items-center">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 text-[11px] uppercase tracking-[0.08em] border-b-2 transition-colors ${
                filter === 'all' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
              }`}
            >All Photos</button>
            <button
              onClick={() => setFilter('favorites')}
              className={`px-3 py-2 text-[11px] uppercase tracking-[0.08em] border-b-2 transition-colors flex items-center gap-1.5 ${
                filter === 'favorites' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
              }`}
            >
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
                {canDownloadFavs && favoriteCount > 0 && (
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
            <EditorialCollageGrid photos={displayPhotos} eventName={event.name} isFavorite={isFavorite} toggleFavorite={toggleFavorite} canDownload={canDownloadAnything} />
          ) : layout === 'pixieset' ? (
            <PixiesetEditorialGrid photos={displayPhotos} eventName={event.name} isFavorite={isFavorite} toggleFavorite={toggleFavorite} canDownload={canDownloadAnything} />
          ) : layout === 'cinematic' ? (
            <CinematicMasonryGrid photos={displayPhotos} isFavorite={isFavorite} toggleFavorite={toggleFavorite} canDownload={canDownloadAnything} />
          ) : (
            <HighlightMosaicGrid photos={displayPhotos} eventName={event.name} isFavorite={isFavorite} toggleFavorite={toggleFavorite} canDownload={canDownloadAnything} />
          )
        ) : (
          <div className={gridClass}>
            {displayPhotos.map(photo => {
              const fav = isFavorite(photo.id);
              return (
                <div key={photo.id} className={`group ${getItemClass(layout)}`}>
                  <img src={photo.url} alt="" className={getImgClass(layout)} loading="lazy" />
                  {fav && (
                    <button onClick={() => toggleFavorite(photo.id)}
                      className="absolute top-1.5 right-1.5 rounded-full bg-destructive/80 text-destructive-foreground p-1 backdrop-blur-sm transition hover:bg-destructive/90 z-10">
                      <Heart className="h-3 w-3" fill="currentColor" />
                    </button>
                  )}
                  <div className="absolute inset-0 transition-colors duration-200 group-hover:bg-foreground/15">
                    <div className="absolute bottom-1.5 right-1.5 flex gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {!fav && (
                        <button onClick={() => toggleFavorite(photo.id)}
                          className="rounded-full bg-card/70 text-foreground/80 hover:bg-card/90 backdrop-blur-sm p-1 transition">
                          <Heart className="h-3 w-3" />
                        </button>
                      )}
                      {canDownloadAnything && (
                        <a href={photo.url} download={photo.file_name ?? true}
                          className="rounded-full bg-card/70 backdrop-blur-sm p-1 text-foreground/80 hover:bg-card/90 transition">
                          <Download className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer branding */}
        <div className="mt-12 pb-8 text-center">
          <p className="text-[9px] text-muted-foreground/30 tracking-[0.15em] uppercase">
            Powered by MirrorAI
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicGallery;
