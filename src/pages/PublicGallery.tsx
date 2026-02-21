import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGuestFavorites } from '@/hooks/use-guest-favorites';
import { useGuestSession } from '@/hooks/use-guest-session';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Heart, Download, FolderDown, Loader2, PackageOpen, Share2, Play } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditorialCollageGrid } from '@/components/EditorialCollageGrid';
import { PixiesetEditorialGrid, CinematicMasonryGrid, HighlightMosaicGrid } from '@/components/PremiumGridLayouts';
import { format } from 'date-fns';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PhotoShareSheet } from '@/components/PhotoShareSheet';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import { PhotoSlideshow } from '@/components/PhotoSlideshow';

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
  cover_url: string | null;
  gallery_pin: string | null;
  downloads_enabled: boolean;
  download_resolution: string;
  watermark_enabled: boolean;
  user_id: string;
  gallery_layout: string;
  is_published: boolean;
  download_requires_password: boolean;
  download_password: string | null;
  selection_mode_enabled: boolean;
}

function toGridPhoto(p: Photo, isFav: boolean) {
  return { id: p.id, url: p.url, is_favorite: isFav, file_name: p.file_name };
}

const GRID_CLASSES: Record<string, string> = {
  classic: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[3px]',
  masonry: 'columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-[3px]',
  justified: 'flex flex-wrap gap-[3px]',
  editorial: 'columns-1 sm:columns-2 lg:columns-3 gap-4',
};

const SECTIONS = ['Highlights', 'Ceremony', 'Reception', 'Family', 'Getting Ready'] as const;

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
  const [sectionFilter, setSectionFilter] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [zipPercent, setZipPercent] = useState(0);
  const [sharePhoto, setSharePhoto] = useState<Photo | null>(null);
  const [watermarkText, setWatermarkText] = useState<string | null>(null);
  const [downloadUnlocked, setDownloadUnlocked] = useState(false);
  const [downloadPwPrompt, setDownloadPwPrompt] = useState(false);
  const [downloadPwInput, setDownloadPwInput] = useState('');
  const [downloadPwError, setDownloadPwError] = useState(false);
  const [pendingDownloadAction, setPendingDownloadAction] = useState<(() => void) | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [slideshowOpen, setSlideshowOpen] = useState(false);

  const { sessionId } = useGuestSession(event?.id);
  const { favoriteCount, toggleFavorite, isFavorite } = useGuestFavorites(event?.id, sessionId);

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

    if (ev.gallery_pin) {
      const unlocked = sessionStorage.getItem(`unlocked_${ev.id}`);
      if (unlocked !== 'true') {
        navigate(`/event/${ev.slug}`, { replace: true });
        return;
      }
    }

    setEvent(ev);

    if (ev.watermark_enabled && ev.user_id) {
      const { data: profile } = await (supabase
        .from('profiles')
        .select('studio_name') as any)
        .eq('user_id', ev.user_id)
        .maybeSingle();
      if (profile) setWatermarkText((profile as any).studio_name);
    }

    const { data: photoData } = await (supabase.from('photos').select('*') as any)
      .eq('event_id', ev.id)
      .order('sort_order', { ascending: true, nullsFirst: false });
    if (photoData) setPhotos(photoData as unknown as Photo[]);
    setLoading(false);
  }, [slug, navigate]);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  const handleDownloadPhoto = async (photo: Photo) => {
    if (!event?.downloads_enabled) return;
    try {
      const { data, error } = await supabase.storage
        .from('gallery-photos')
        .createSignedUrl(photo.url, 60);
      if (error || !data?.signedUrl) {
        toast({ title: 'Download failed', description: 'Could not generate download link.' });
        return;
      }
      const res = await fetch(data.signedUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = photo.file_name ?? 'photo.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast({ title: 'Download failed', description: 'Could not download photo.' });
    }
  };

  const buildZip = async (targetPhotos: Photo[], label: string) => {
    if (targetPhotos.length === 0) { toast({ title: 'No photos to download' }); return; }
    if (!event?.downloads_enabled) return;
    setDownloading(true);
    setZipPercent(0);
    try {
      const zip = new JSZip();
      const folder = zip.folder(event?.name ?? label);
      for (let i = 0; i < targetPhotos.length; i++) {
        const pct = Math.round(((i + 1) / targetPhotos.length) * 100);
        setDownloadProgress(`${i + 1} / ${targetPhotos.length}`);
        setZipPercent(pct);
        const p = targetPhotos[i];
        const { data: signed } = await supabase.storage.from('gallery-photos').createSignedUrl(p.url, 120);
        if (!signed?.signedUrl) continue;
        const res = await fetch(signed.signedUrl);
        const blob = await res.blob();
        folder?.file(p.file_name ?? `photo-${i + 1}.jpg`, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${event?.name ?? label}.zip`);
      toast({ title: `${targetPhotos.length} photos downloaded` });
    } catch (_err) { toast({ title: 'Download failed' }); }
    finally { setDownloading(false); setDownloadProgress(''); setZipPercent(0); }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <p className="text-[11px] text-muted-foreground/50 uppercase tracking-widest">Loading gallery…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 text-center">
        <h1 className="font-serif text-4xl font-semibold text-primary mb-2">Gallery Not Found</h1>
        <p className="text-[12px] text-muted-foreground/50">This gallery link is invalid or has been removed.</p>
      </div>
    );
  }

  if (!event) return null;

  const canDownload = event.downloads_enabled;

  const guardedDownload = (action: () => void) => {
    if (!canDownload) return;
    if (event.download_requires_password && !downloadUnlocked) {
      setPendingDownloadAction(() => action);
      setDownloadPwPrompt(true);
      return;
    }
    action();
  };

  const handleDownloadPwSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (downloadPwInput === event.download_password) {
      setDownloadUnlocked(true);
      setDownloadPwPrompt(false);
      setDownloadPwError(false);
      setDownloadPwInput('');
      if (pendingDownloadAction) { pendingDownloadAction(); setPendingDownloadAction(null); }
    } else {
      setDownloadPwError(true);
    }
  };

  // Apply filters
  let filteredPhotos = filter === 'favorites' ? photos.filter((p) => isFavorite(p.id)) : photos;
  if (sectionFilter) {
    filteredPhotos = filteredPhotos.filter(p => p.section === sectionFilter);
  }
  const displayPhotos = filteredPhotos;

  const layout = event.gallery_layout || 'classic';
  const gridClass = GRID_CLASSES[layout] ?? GRID_CLASSES.masonry;
  const gridPhotos = displayPhotos.map(p => toGridPhoto(p, isFavorite(p.id)));
  const showWatermark = event.watermark_enabled && !!watermarkText;

  // Determine which sections exist in photos
  const availableSections = SECTIONS.filter(s => photos.some(p => p.section === s));

  const openLightbox = (photoId: string) => {
    const idx = displayPhotos.findIndex(p => p.id === photoId);
    if (idx >= 0) {
      setLightboxIndex(idx);
      setLightboxOpen(true);
    }
  };

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
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-5 gap-2">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight">{event.name}</h1>
            <p className="text-[11px] text-muted-foreground/60 tracking-wide mt-1">
              {format(new Date(event.event_date), 'MMMM d, yyyy')} · {photos.length} photos
            </p>
          </div>
          <div className="flex items-center gap-2">
            {favoriteCount > 0 && (
              <div className="flex items-center gap-1.5 text-[12px] text-primary font-medium">
                <Heart className="h-3.5 w-3.5" fill="hsl(var(--primary))" />
                <span>{favoriteCount} Selected</span>
              </div>
            )}
            {photos.length > 1 && (
              <Button variant="outline" size="sm" onClick={() => setSlideshowOpen(true)}
                className="min-h-[44px] sm:min-h-0 sm:h-7 px-3 text-[10px] uppercase tracking-[0.06em] border-border">
                <Play className="mr-1 h-3 w-3" /> Slideshow
              </Button>
            )}
          </div>
        </div>

        {/* Section pills */}
        {availableSections.length > 0 && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => setSectionFilter(null)}
              className={`shrink-0 min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-full text-[11px] tracking-wide transition-colors border ${
                !sectionFilter
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-muted-foreground border-border hover:border-foreground/30'
              }`}>All</button>
            {availableSections.map(s => (
              <button key={s} onClick={() => setSectionFilter(s === sectionFilter ? null : s)}
                className={`shrink-0 min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-full text-[11px] tracking-wide transition-colors border ${
                  sectionFilter === s
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent text-muted-foreground border-border hover:border-foreground/30'
                }`}>{s}</button>
            ))}
          </div>
        )}

        {/* Utility bar */}
        <div className="flex items-center justify-between mb-4 border-b border-border">
          <div className="flex items-center">
            <button onClick={() => { setFilter('all'); }}
              className={`min-h-[44px] px-3 py-2 text-[11px] uppercase tracking-[0.08em] border-b-2 transition-colors ${
                filter === 'all' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
              }`}>All Photos</button>
            <button onClick={() => { setFilter('favorites'); }}
              className={`min-h-[44px] px-3 py-2 text-[11px] uppercase tracking-[0.08em] border-b-2 transition-colors flex items-center gap-1.5 ${
                filter === 'favorites' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
              }`}>
              <Heart className="h-3 w-3" /> Favorites
              {favoriteCount > 0 && (
                <span className="text-[10px] bg-foreground/10 text-foreground/70 rounded-full px-1.5 py-px leading-none">{favoriteCount}</span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1">
            {canDownload && photos.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={downloading}
                    className="min-h-[44px] sm:min-h-0 text-primary hover:bg-primary/10 text-[10px] sm:h-7 px-2.5 uppercase tracking-[0.06em] mb-px">
                    {downloading ? (<><Loader2 className="mr-1 h-3 w-3 animate-spin" />{downloadProgress}</>) : (<><FolderDown className="mr-1 h-3 w-3" />Download</>)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  <DropdownMenuItem onClick={() => guardedDownload(() => buildZip(photos, 'gallery'))} className="text-[12px] gap-2 min-h-[44px]">
                    <PackageOpen className="h-3.5 w-3.5" /> All Photos ({photos.length})
                  </DropdownMenuItem>
                  {favoriteCount > 0 && (
                    <DropdownMenuItem onClick={() => guardedDownload(() => buildZip(photos.filter(p => isFavorite(p.id)), 'favorites'))} className="text-[12px] gap-2 min-h-[44px]">
                      <Heart className="h-3.5 w-3.5" /> Favorites ({favoriteCount})
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* ZIP Progress bar */}
        {downloading && (
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Preparing download…</span>
              <span>{downloadProgress}</span>
            </div>
            <Progress value={zipPercent} className="h-1.5" />
          </div>
        )}

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
            <EditorialCollageGrid photos={gridPhotos} eventName={event.name} isFavorite={isFavorite} toggleFavorite={toggleFavorite} canDownload={canDownload} onDownload={canDownload ? (p) => { const orig = photos.find(ph => ph.id === p.id); if (orig) guardedDownload(() => handleDownloadPhoto(orig)); } : undefined} watermarkText={showWatermark ? watermarkText : undefined} onShare={(p) => { const orig = photos.find(ph => ph.id === p.id); if (orig) setSharePhoto(orig); }} />
          ) : layout === 'pixieset' ? (
            <PixiesetEditorialGrid photos={gridPhotos} eventName={event.name} isFavorite={isFavorite} toggleFavorite={toggleFavorite} canDownload={canDownload} onDownload={canDownload ? (p) => { const orig = photos.find(ph => ph.id === p.id); if (orig) guardedDownload(() => handleDownloadPhoto(orig)); } : undefined} watermarkText={showWatermark ? watermarkText : undefined} onShare={(p) => { const orig = photos.find(ph => ph.id === p.id); if (orig) setSharePhoto(orig); }} />
          ) : layout === 'cinematic' ? (
            <CinematicMasonryGrid photos={gridPhotos} isFavorite={isFavorite} toggleFavorite={toggleFavorite} canDownload={canDownload} onDownload={canDownload ? (p) => { const orig = photos.find(ph => ph.id === p.id); if (orig) guardedDownload(() => handleDownloadPhoto(orig)); } : undefined} watermarkText={showWatermark ? watermarkText : undefined} onShare={(p) => { const orig = photos.find(ph => ph.id === p.id); if (orig) setSharePhoto(orig); }} />
          ) : (
            <HighlightMosaicGrid photos={gridPhotos} eventName={event.name} isFavorite={isFavorite} toggleFavorite={toggleFavorite} canDownload={canDownload} onDownload={canDownload ? (p) => { const orig = photos.find(ph => ph.id === p.id); if (orig) guardedDownload(() => handleDownloadPhoto(orig)); } : undefined} watermarkText={showWatermark ? watermarkText : undefined} onShare={(p) => { const orig = photos.find(ph => ph.id === p.id); if (orig) setSharePhoto(orig); }} />
          )
        ) : (
          <div className={gridClass}>
            {displayPhotos.map((photo) => {
              const fav = isFavorite(photo.id);
              return (
                <div key={photo.id} className={`group cursor-pointer ${getItemClass(layout)}`}
                  onClick={() => openLightbox(photo.id)}>
                  <img src={photo.url} alt="" className={getImgClass(layout)} loading="lazy" />
                  {showWatermark && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                      <span className="font-serif text-foreground/10 text-lg sm:text-2xl rotate-[-25deg] whitespace-nowrap tracking-[0.15em]">
                        {watermarkText}
                      </span>
                    </div>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.id); if (!fav) toast({ title: 'Added to Favorites', description: 'Photo saved to your selections.' }); }}
                    className="absolute top-1.5 right-1.5 z-10 min-w-[44px] min-h-[44px] rounded-full bg-card/60 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-card/80 active:scale-125">
                    <Heart className={`h-4 w-4 transition-all duration-200 ${fav ? 'text-primary scale-110' : 'text-foreground/50 hover:text-foreground/70'}`}
                      fill={fav ? 'hsl(var(--primary))' : 'none'} />
                  </button>
                  <div className="absolute inset-0 transition-colors duration-200 group-hover:bg-foreground/10 pointer-events-none" />
                  <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); setSharePhoto(photo); }}
                      className="min-w-[36px] min-h-[36px] rounded-full bg-card/70 backdrop-blur-sm flex items-center justify-center text-foreground/80 hover:bg-card/90 transition">
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                    {canDownload && (
                      <button onClick={(e) => { e.stopPropagation(); guardedDownload(() => handleDownloadPhoto(photo)); }}
                        className="min-w-[36px] min-h-[36px] rounded-full bg-card/70 backdrop-blur-sm flex items-center justify-center text-foreground/80 hover:bg-card/90 transition">
                        <Download className="h-3.5 w-3.5" />
                      </button>
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

        {/* Lightbox */}
        <PhotoLightbox
          photos={displayPhotos}
          currentIndex={lightboxIndex}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setLightboxIndex}
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
          canDownload={canDownload}
          onDownload={canDownload ? (p) => guardedDownload(() => handleDownloadPhoto(p as Photo)) : undefined}
          onShare={(p) => setSharePhoto(p as Photo)}
        />

        {/* Slideshow */}
        <PhotoSlideshow
          photos={displayPhotos}
          open={slideshowOpen}
          onClose={() => setSlideshowOpen(false)}
        />

        {sharePhoto && (
          <PhotoShareSheet open={!!sharePhoto} onOpenChange={() => setSharePhoto(null)}
            photoUrl={sharePhoto.url} photoName={sharePhoto.file_name} eventName={event.name} canDownload={canDownload} />
        )}

        {/* Download password prompt */}
        {downloadPwPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
            <div className="w-full max-w-xs bg-card border border-border p-6 space-y-4">
              <h3 className="font-serif text-lg font-semibold text-foreground text-center">Download Password</h3>
              <p className="text-[11px] text-muted-foreground/60 text-center">Enter the password to download photos.</p>
              <form onSubmit={handleDownloadPwSubmit} className="space-y-3">
                <Input value={downloadPwInput} onChange={(e) => { setDownloadPwInput(e.target.value); setDownloadPwError(false); }}
                  placeholder="Enter password" className="bg-background border-border h-10 text-center text-[14px]" autoFocus />
                {downloadPwError && <p className="text-[10px] text-destructive text-center">Incorrect password.</p>}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1 h-10 min-h-[44px] text-[11px]" onClick={() => { setDownloadPwPrompt(false); setDownloadPwInput(''); setDownloadPwError(false); setPendingDownloadAction(null); }}>Cancel</Button>
                  <Button type="submit" className="flex-1 h-10 min-h-[44px] text-[11px] bg-primary text-primary-foreground">Confirm</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicGallery;
