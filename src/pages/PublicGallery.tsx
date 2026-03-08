import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCachedPhotos, setCachedPhotos, invalidatePhotoCache } from '@/lib/photo-cache';
import { useInfinitePhotos } from '@/hooks/use-infinite-photos';
import { ProgressiveImage } from '@/components/ProgressiveImage';
import { MinimalPortfolioLayout } from '@/components/MinimalPortfolioLayout';
import { StoryBookLayout } from '@/components/StoryBookLayout';
import { supabase } from '@/integrations/supabase/client';
import { useGuestFavorites } from '@/hooks/use-guest-favorites';
import { useGuestSession } from '@/hooks/use-guest-session';
import { useGoogleFonts } from '@/hooks/use-google-fonts';
import { useAnalytics } from '@/hooks/use-analytics';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Heart, Download, FolderDown, Loader2, PackageOpen, Share2, Camera,
  Link2, Search, X, ChevronDown, Grid3X3, Lock, MessageCircle, Mail,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PhotoShareSheet } from '@/components/PhotoShareSheet';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import { PhotoSlideshow } from '@/components/PhotoSlideshow';
import { OtpInput } from '@/components/OtpInput';
import { Checkbox } from '@/components/ui/checkbox';
import { GalleryPasswordGate } from '@/components/GalleryPasswordGate';
import { SendFavoritesDialog } from '@/components/SendFavoritesDialog';
import { FindMyPhotosModal } from '@/components/FindMyPhotosModal';
import { GalleryTextBlockRenderer, type TextBlock } from '@/components/GalleryTextBlock';
import { TimelessWeddingHero } from '@/components/TimelessWeddingHero';
import { AndhakarHero } from '@/components/AndhakarHero';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { WebsiteAbout } from '@/components/website/WebsiteAbout';
import { WebsiteContact } from '@/components/website/WebsiteContact';
import { getTemplate } from '@/lib/website-templates';

/* ── Interfaces ── */
interface Photo {
  id: string;
  url: string;
  file_name: string | null;
  section: string | null;
  created_at: string;
}

interface EventData {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  cover_url: string | null;
  gallery_pin: string | null;
  downloads_enabled: boolean;
  download_resolution: string;
  watermark_enabled: boolean;
  face_recognition_enabled: boolean;
  user_id: string;
  gallery_layout: string;
  gallery_style?: string;
  is_published: boolean;
  download_requires_password: boolean;
  download_password: string | null;
  selection_mode_enabled: boolean;
  gallery_password: string | null;
  hero_couple_name?: string | null;
  hero_subtitle?: string | null;
  hero_button_label?: string | null;
}

interface StudioProfile {
  studio_name: string;
  studio_logo_url: string | null;
  studio_accent_color: string | null;
}

interface StudioExtended {
  bio: string | null;
  display_name: string | null;
  instagram: string | null;
  website: string | null;
  whatsapp: string | null;
  footer_text: string | null;
  cover_url: string | null;
  font_style: string | null;
  username: string | null;
  heading_font: string | null;
  body_font: string | null;
}

/* ── Ken Burns keyframe (scoped, injected once) ── */
const kenBurnsStyle = `
@keyframes kenBurns {
  0% { transform: scale(1); }
  100% { transform: scale(1.08); }
}
`;

/* ── PIN Gate Component ── */
function PinGate({ event, studioProfile, onUnlock }: {
  event: EventData;
  studioProfile: StudioProfile | null;
  onUnlock: () => void;
}) {
  const [error, setError] = useState(false);

  const handleComplete = (otp: string) => {
    if (otp === event.gallery_pin) {
      localStorage.setItem(`mirrorai_pin_${event.id}`, otp);
      onUnlock();
    } else {
      setError(true);
      sonnerToast.error('Wrong PIN. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-8 text-center space-y-6 shadow-lg">
        {studioProfile?.studio_logo_url ? (
          <img src={studioProfile.studio_logo_url} alt="" className="h-12 mx-auto object-contain" />
        ) : (
          <h2 className="font-display text-xl italic text-foreground">MirrorAI</h2>
        )}
        <h1 className="font-serif text-2xl font-semibold text-foreground">{event.name}</h1>
        <p className="text-sm text-muted-foreground">Enter the 4-digit PIN to view this gallery.</p>
        <OtpInput length={4} onComplete={handleComplete} />
        {error && <p className="text-xs text-destructive">Incorrect PIN</p>}
        <Button onClick={() => {}} className="w-full" disabled>
          Enter Gallery
        </Button>
      </div>
    </div>
  );
}

/* ── Photo Card Component ── */
function PhotoCard({
  photo, layout, isFav, onToggleFavorite, onOpenLightbox, showWatermark,
  watermarkText, accentColor, selectionMode, isSelected, onToggleSelect,
  commentCount,
}: {
  photo: Photo;
  layout: string;
  isFav: boolean;
  onToggleFavorite: () => void;
  onOpenLightbox: () => void;
  showWatermark: boolean;
  watermarkText: string | null;
  accentColor: string | null;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  commentCount: number;
}) {
  const aspectClass = layout === 'classic' ? 'aspect-[3/2]' :
    layout === 'editorial-hero' ? 'aspect-[16/9]' :
    layout === 'cinematic-wide' ? 'aspect-[21/9]' :
    layout === 'cinematic-cell' ? 'aspect-[4/3]' : '';

  const isMasonry = layout === 'masonry' || layout === 'editorial-item' || layout === 'timeline';
  const heartColor = accentColor ? accentColor : 'hsl(var(--primary))';

  return (
    <div
      className={`group relative cursor-pointer overflow-hidden rounded-lg ${aspectClass} ${isMasonry ? 'break-inside-avoid' : ''} transition-all duration-300 hover:shadow-lg hover:shadow-black/8`}
      style={{ marginBottom: isMasonry ? '8px' : undefined }}
      onClick={onOpenLightbox}
    >
      <ProgressiveImage
        src={photo.url}
        alt=""
        className={`${aspectClass ? 'h-full w-full object-cover' : 'w-full h-auto object-cover block'} transition-transform duration-500 group-hover:scale-[1.03]`}
        draggable={false}
      />

      {/* Hover overlay — subtle gradient from bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Heart button — top right */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        className="absolute top-3 right-3 z-10 min-w-[44px] min-h-[44px] rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/40 active:scale-90"
        style={isFav ? { opacity: 1 } : undefined}
      >
        <Heart
          className="h-5 w-5 transition-all duration-300"
          style={isFav ? { color: heartColor, fill: heartColor, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' } : { color: 'white', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
        />
      </button>

      {/* Selection checkbox — top left */}
      {selectionMode && (
        <div
          className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
          style={isSelected ? { opacity: 1 } : undefined}
        >
          <Checkbox
            checked={isSelected}
            className="h-5 w-5 border-white/80 data-[state=checked]:border-transparent shadow-sm"
            style={isSelected && accentColor ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
          />
        </div>
      )}

      {/* Comment badge — bottom left */}
      {commentCount > 0 && (
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-md text-foreground text-[10px] font-medium px-2.5 py-1 rounded-full shadow-sm">
          <MessageCircle className="h-3 w-3" />
          {commentCount}
        </div>
      )}

      {/* Watermark */}
      {showWatermark && watermarkText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="font-serif text-white/20 text-lg sm:text-2xl whitespace-nowrap tracking-[0.15em]">
            {watermarkText}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */
const PublicGallery = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [event, setEvent] = useState<EventData | null>(null);
  const [studioProfile, setStudioProfile] = useState<StudioProfile | null>(null);
  const [studioExtended, setStudioExtended] = useState<StudioExtended | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pinLocked, setPinLocked] = useState(false);
  const [passwordLocked, setPasswordLocked] = useState(false);
  const [sendFavOpen, setSendFavOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [sectionFilter, setSectionFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest' | 'sneakpeek'>('latest');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [zipPercent, setZipPercent] = useState(0);
  const [downloadUnlocked, setDownloadUnlocked] = useState(false);
  const [downloadPwPrompt, setDownloadPwPrompt] = useState(false);
  const [downloadPwInput, setDownloadPwInput] = useState('');
  const [downloadPwError, setDownloadPwError] = useState(false);
  const [pendingDownloadAction, setPendingDownloadAction] = useState<(() => void) | null>(null);

  const [sharePhoto, setSharePhoto] = useState<Photo | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [slideshowOpen, setSlideshowOpen] = useState(false);

  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [stickyVisible, setStickyVisible] = useState(false);
  const [findMyPhotosOpen, setFindMyPhotosOpen] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const { sessionId } = useGuestSession(event?.id);
  const { favoriteCount, toggleFavorite: rawToggleFavorite, isFavorite, clearFavorites } = useGuestFavorites(event?.id, sessionId);
  const { trackView, trackFavoriteChange, trackDownload } = useAnalytics(event?.id);

  const toggleFavorite = useCallback((photoId: string) => {
    const wasFav = isFavorite(photoId);
    rawToggleFavorite(photoId);
    if (!wasFav) sonnerToast.success('Added to favorites');
    else sonnerToast('Removed from favorites');
    setTimeout(() => trackFavoriteChange(), 500);
  }, [rawToggleFavorite, isFavorite, trackFavoriteChange]);

  /* ── Data fetching ── */
  const fetchGallery = useCallback(async () => {
    if (!slug) return;

    const { data } = await (supabase.from('events').select('*') as any)
      .eq('slug', slug).eq('is_published', true).maybeSingle();

    if (!data) { setNotFound(true); setLoading(false); return; }

    const ev = data as unknown as EventData;
    setEvent(ev);
    document.title = `${ev.name} — MirrorAI`;

    // Check PIN gate
    if (ev.gallery_pin) {
      const storedPin = localStorage.getItem(`mirrorai_pin_${ev.id}`);
      if (storedPin !== ev.gallery_pin) {
        setPinLocked(true);
      }
    }

    // Check password gate
    if ((ev as any).gallery_password) {
      const storedPw = localStorage.getItem(`mirrorai_gallery_password_${ev.id}`);
      if (storedPw !== (ev as any).gallery_password) {
        setPasswordLocked(true);
      }
    }

    // Fetch studio profile
    const { data: profile } = await (supabase.from('profiles')
      .select('studio_name, studio_logo_url, studio_accent_color, email') as any)
      .eq('user_id', ev.user_id).maybeSingle();
    if (profile) setStudioProfile(profile as unknown as StudioProfile);

    // Fetch extended studio profile
    const { data: studioExt } = await (supabase.from('studio_profiles')
      .select('bio, display_name, instagram, website, whatsapp, footer_text, cover_url, font_style, username, heading_font, body_font') as any)
      .eq('user_id', ev.user_id).maybeSingle();
    if (studioExt) setStudioExtended(studioExt as unknown as StudioExtended);

    // Fetch photos — use session cache, paginate past 1000-row limit
    const cached = getCachedPhotos<Photo[]>(ev.id);
    if (cached) {
      setPhotos(cached);
    } else {
      let allPhotos: Photo[] = [];
      let from = 0;
      const PAGE = 1000;
      while (true) {
        const { data: photoData } = await (supabase.from('photos').select('id, url, file_name, section, created_at') as any)
          .eq('event_id', ev.id).order('sort_order', { ascending: true, nullsFirst: false })
          .range(from, from + PAGE - 1);
        if (!photoData || photoData.length === 0) break;
        allPhotos = allPhotos.concat(photoData as unknown as Photo[]);
        if (photoData.length < PAGE) break;
        from += PAGE;
      }
      setPhotos(allPhotos);
      if (allPhotos.length > 0) setCachedPhotos(ev.id, allPhotos);
    }

    // Fetch text blocks
    const { data: tbData } = await (supabase.from('gallery_text_blocks' as any)
      .select('*').eq('event_id', ev.id).order('sort_order', { ascending: true }) as any);
    if (tbData) setTextBlocks(tbData as unknown as TextBlock[]);

    // Fetch comment counts (paginated to avoid 1000-row limit)
    let allComments: any[] = [];
    let cFrom = 0;
    while (true) {
      const { data: comments } = await (supabase.from('photo_comments').select('photo_id') as any)
        .eq('event_id', ev.id).range(cFrom, cFrom + 999);
      if (!comments || comments.length === 0) break;
      allComments = allComments.concat(comments);
      if (comments.length < 1000) break;
      cFrom += 1000;
    }
    if (allComments.length > 0) {
      const counts: Record<string, number> = {};
      allComments.forEach((c: any) => {
        counts[c.photo_id] = (counts[c.photo_id] || 0) + 1;
      });
      setCommentCounts(counts);
    }

    setLoading(false);
  }, [slug]);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);
  useEffect(() => { if (event?.id) trackView(); }, [event?.id, trackView]);

  /* ── Sticky navbar observer ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    const el = heroRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [loading, pinLocked]);

  /* ── Download helpers ── */
  const handleDownloadPhoto = async (photo: Photo) => {
    if (!event?.downloads_enabled) return;
    try {
      const res = await fetch(photo.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl; a.download = photo.file_name ?? 'photo.jpg';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      trackDownload();
    } catch { toast({ title: 'Download failed' }); }
  };

  const buildZip = async (targetPhotos: Photo[], label: string) => {
    if (targetPhotos.length === 0) { toast({ title: 'No photos to download' }); return; }
    if (!event?.downloads_enabled) return;
    setDownloading(true); setZipPercent(0);
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
        setZipPercent(Math.round((completed / targetPhotos.length) * 100));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${event?.name ?? label}.zip`);
      toast({ title: `${targetPhotos.length} photos downloaded` });
    } catch { toast({ title: 'Download failed' }); }
    finally { setDownloading(false); setDownloadProgress(''); setZipPercent(0); }
  };

  const guardedDownload = (action: () => void) => {
    if (!event?.downloads_enabled) return;
    if (event.download_requires_password && !downloadUnlocked) {
      setPendingDownloadAction(() => action);
      setDownloadPwPrompt(true);
      return;
    }
    action();
  };

  const handleDownloadPwSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (downloadPwInput === event?.download_password) {
      setDownloadUnlocked(true); setDownloadPwPrompt(false);
      setDownloadPwError(false); setDownloadPwInput('');
      if (pendingDownloadAction) { pendingDownloadAction(); setPendingDownloadAction(null); }
    } else { setDownloadPwError(true); }
  };

  /* ── Derived data ── */
  const availableSections = useMemo(() => {
    const secs = new Set(photos.map(p => p.section).filter(Boolean) as string[]);
    return Array.from(secs);
  }, [photos]);

  const displayPhotos = useMemo(() => {
    let filtered = filter === 'favorites' ? photos.filter(p => isFavorite(p.id)) : photos;
    if (sectionFilter) filtered = filtered.filter(p => p.section === sectionFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        (p.file_name?.toLowerCase().includes(q)) ||
        (p.section?.toLowerCase().includes(q))
      );
    }
    if (sortOrder === 'latest') filtered = [...filtered].reverse();
    return filtered;
  }, [photos, filter, sectionFilter, searchQuery, sortOrder, isFavorite]);

  const openLightbox = (photoId: string) => {
    const idx = displayPhotos.findIndex(p => p.id === photoId);
    if (idx >= 0) { setLightboxIndex(idx); setLightboxOpen(true); }
  };

  // Infinite scroll pagination
  const { visiblePhotos, hasMore, sentinelRef } = useInfinitePhotos(displayPhotos);

  const toggleSelect = (photoId: string) => {
    setSelectedPhotos(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId); else next.add(photoId);
      return next;
    });
  };

  const accentColor = studioProfile?.studio_accent_color || null;
  const canDownload = event?.downloads_enabled ?? false;
  const showWatermark = event?.watermark_enabled ?? false;
  const layout = event?.gallery_layout || 'masonry';
  const galleryStyle = (event as any)?.gallery_style || 'vogue-editorial';
  const isTimeless = galleryStyle === 'timeless-wedding';
  const isAndhakar = galleryStyle === 'andhakar';
  const websiteTemplate = (event as any)?.website_template || 'editorial-studio';
  const wt = getTemplate(websiteTemplate);

  // Dynamically load studio heading/body fonts from Google Fonts
  useGoogleFonts(studioExtended?.heading_font, studioExtended?.body_font);

  // Build combined branding object for website components
  const combinedBranding = studioProfile ? {
    ...studioProfile,
    bio: studioExtended?.bio || null,
    display_name: studioExtended?.display_name || null,
    instagram: studioExtended?.instagram || null,
    website: studioExtended?.website || null,
    whatsapp: studioExtended?.whatsapp || null,
    footer_text: studioExtended?.footer_text || null,
    cover_url: studioExtended?.cover_url || null,
    email: (studioProfile as any)?.email || null,
  } : null;

  const hasAbout = !!studioExtended?.bio;
  const hasContact = !!(studioExtended?.whatsapp || studioExtended?.website || (studioProfile as any)?.email);

  const aboutRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const scrollToAbout = hasAbout ? () => aboutRef.current?.scrollIntoView({ behavior: 'smooth' }) : undefined;
  const scrollToContact = hasContact ? () => contactRef.current?.scrollIntoView({ behavior: 'smooth' }) : undefined;

  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background">
        {/* Hero skeleton */}
        <Skeleton className="h-[70vh] w-full rounded-none" />
        {/* Gallery skeleton grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center gap-3 mb-8">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="rounded-lg" style={{ height: `${180 + (i % 3) * 60}px` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 text-center">
        <h1 className="font-serif text-4xl font-semibold text-primary mb-2">Gallery Not Found</h1>
        <p className="text-xs text-muted-foreground/50">This gallery link is invalid or has been removed.</p>
      </div>
    );
  }

  if (!event) return null;

  /* ── PIN Gate ── */
  if (pinLocked) {
    return (
      <PinGate
        event={event}
        studioProfile={studioProfile}
        onUnlock={() => setPinLocked(false)}
      />
    );
  }

  /* ── Password Gate ── */
  if (passwordLocked && (event as any).gallery_password) {
    return (
      <GalleryPasswordGate
        eventId={event.id}
        eventTitle={event.name}
        galleryPassword={(event as any).gallery_password}
        studioLogoUrl={studioProfile?.studio_logo_url}
        onUnlock={() => setPasswordLocked(false)}
      />
    );
  }

  /* ── Render helpers for layouts ── */
  const renderPhotoCard = (photo: Photo, layoutType?: string) => (
    <PhotoCard
      key={photo.id}
      photo={photo}
      layout={layoutType || layout}
      isFav={isFavorite(photo.id)}
      onToggleFavorite={() => toggleFavorite(photo.id)}
      onOpenLightbox={() => openLightbox(photo.id)}
      showWatermark={showWatermark}
      watermarkText={studioProfile?.studio_name ?? null}
      accentColor={accentColor}
      selectionMode={event.selection_mode_enabled}
      isSelected={selectedPhotos.has(photo.id)}
      onToggleSelect={() => toggleSelect(photo.id)}
      commentCount={commentCounts[photo.id] || 0}
    />
  );

  const renderGallery = () => {
    if (displayPhotos.length === 0 && filter === 'favorites') {
      return (
        <div className="py-32 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/40 mb-5">
            <Heart className="h-7 w-7 text-muted-foreground/25" />
          </div>
          <p className="font-serif text-lg text-muted-foreground/60">No favorites yet</p>
          <p className="mt-2 text-sm text-muted-foreground/40 max-w-xs mx-auto">Tap the heart icon on any photo to save it to your favorites</p>
        </div>
      );
    }
    if (displayPhotos.length === 0 && photos.length === 0) {
      return (
        <div className="py-32 text-center">
          <Camera className="mx-auto h-10 w-10 text-muted-foreground/15" />
          <p className="mt-4 font-display text-xl text-muted-foreground/50 italic">Photos coming soon</p>
          <p className="mt-1.5 text-[11px] text-muted-foreground/35 tracking-wide">Check back shortly</p>
        </div>
      );
    }
    if (displayPhotos.length === 0) {
      return (
        <div className="py-24 text-center">
          <p className="font-serif text-sm text-muted-foreground/50">No photos match this filter</p>
        </div>
      );
    }

    const infiniteSentinel = (
      <>
        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
          </div>
        )}
        {!hasMore && visiblePhotos.length < displayPhotos.length === false && visiblePhotos.length > 50 && (
          <p className="text-center text-[10px] text-muted-foreground/30 py-6 uppercase tracking-widest">All {displayPhotos.length} photos loaded</p>
        )}
      </>
    );

    switch (layout) {
      case 'classic':
        return (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {visiblePhotos.map(p => renderPhotoCard(p, 'classic'))}
            </div>
            {infiniteSentinel}
          </>
        );

      case 'masonry':
        return (
          <>
            <div style={{
              columns: isTimeless ? '4 200px' : '3 260px',
              columnGap: isTimeless ? '4px' : '12px',
            }}>
              {visiblePhotos.map(p => renderPhotoCard(p, 'masonry'))}
            </div>
            {infiniteSentinel}
          </>
        );

      case 'justified':
        return (
          <>
            <div className="space-y-2">
              {chunkArray(visiblePhotos, 4).map((row, ri) => (
                <div key={ri} className="flex flex-row gap-2" style={{ height: window.innerWidth < 768 ? '160px' : '240px' }}>
                  {row.map(p => (
                    <div key={p.id} className="relative flex-1 min-w-0 overflow-hidden rounded-xl cursor-pointer group"
                      onClick={() => openLightbox(p.id)}>
                      <ProgressiveImage src={p.url} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 pointer-events-none" />
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
                        className="absolute top-2 right-2 z-10 min-w-[40px] min-h-[40px] rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                        style={isFavorite(p.id) ? { opacity: 1 } : undefined}>
                        <Heart className="h-4 w-4" style={isFavorite(p.id) ? { color: accentColor || 'hsl(var(--primary))', fill: accentColor || 'hsl(var(--primary))' } : { color: 'white' }} />
                      </button>
                      {showWatermark && studioProfile?.studio_name && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                          <span className="font-serif text-white/30 text-lg whitespace-nowrap tracking-[0.15em]">{studioProfile.studio_name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {infiniteSentinel}
          </>
        );

      case 'editorial':
      case 'editorial-collage':
        return (
          <>
            <div className="space-y-2">
              {visiblePhotos.length > 0 && (
                <div>{renderPhotoCard(visiblePhotos[0], 'editorial-hero')}</div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {visiblePhotos.slice(1).map(p => renderPhotoCard(p, 'classic'))}
              </div>
            </div>
            {infiniteSentinel}
          </>
        );

      case 'cinematic':
        return (
          <>
            <div className="space-y-2">
              {visiblePhotos.map((p, i) => {
                const rowIndex = Math.floor(i / 4);
                const posInGroup = i % 4;
                if (posInGroup === 0) {
                  return <div key={p.id}>{renderPhotoCard(p, 'cinematic-wide')}</div>;
                }
                if (posInGroup === 1) {
                  const group = visiblePhotos.slice(i, i + 3);
                  return (
                    <div key={`row-${rowIndex}`} className="grid grid-cols-3 gap-2">
                      {group.map(gp => renderPhotoCard(gp, 'cinematic-cell'))}
                    </div>
                  );
                }
                return null;
              })}
            </div>
            {infiniteSentinel}
          </>
        );

      case 'collage':
      case 'mosaic':
        const first5 = visiblePhotos.slice(0, 5);
        const rest = visiblePhotos.slice(5);
        const positions = [
          { left: '0%', top: '0%', width: '60%', height: '60%' },
          { left: '62%', top: '0%', width: '38%', height: '38%' },
          { left: '62%', top: '40%', width: '38%', height: '60%' },
          { left: '0%', top: '62%', width: '38%', height: '38%' },
          { left: '40%', top: '62%', width: '20%', height: '38%' },
        ];
        return (
          <>
            <div className="space-y-4">
              <div className="relative w-full" style={{ height: window.innerWidth < 768 ? '400px' : '600px' }}>
                {first5.map((p, i) => (
                  <div key={p.id} className="absolute overflow-hidden rounded-xl cursor-pointer group"
                    style={{ ...positions[i] }}
                    onClick={() => openLightbox(p.id)}>
                    <ProgressiveImage src={p.url} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 pointer-events-none" />
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
                      className="absolute top-2 right-2 z-10 min-w-[40px] min-h-[40px] rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                      style={isFavorite(p.id) ? { opacity: 1 } : undefined}>
                      <Heart className="h-4 w-4" style={isFavorite(p.id) ? { color: accentColor || 'hsl(var(--primary))', fill: accentColor || 'hsl(var(--primary))' } : { color: 'white' }} />
                    </button>
                  </div>
                ))}
              </div>
              {rest.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {rest.map(p => renderPhotoCard(p, 'classic'))}
                </div>
              )}
            </div>
            {infiniteSentinel}
          </>
        );

      case 'timeline':
        const grouped = groupByDate(visiblePhotos);
        return (
          <>
            <div className="space-y-8">
              {grouped.map(([date, datePhotos]) => (
                <div key={date}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="font-serif text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(date), 'MMMM d, yyyy')}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {datePhotos.map(p => renderPhotoCard(p, 'masonry'))}
                  </div>
                </div>
              ))}
            </div>
            {infiniteSentinel}
          </>
        );

      case 'story':
        return (
          <div>
            {visiblePhotos.map((p, i) => (
              <div key={p.id} className="relative h-screen w-full overflow-hidden cursor-pointer"
                onClick={() => openLightbox(p.id)}>
                <ProgressiveImage src={p.url} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 right-6 text-white/50 text-sm font-sans">
                  {i + 1} / {displayPhotos.length}
                </div>
                {p.section && (
                  <div className="absolute bottom-6 left-6 text-white/70 font-serif text-lg">
                    {p.section}
                  </div>
                )}
                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
                  className="absolute top-6 right-6 z-10 min-w-[44px] min-h-[44px] rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
                  style={isFavorite(p.id) ? { opacity: 1 } : undefined}>
                  <Heart className="h-5 w-5" style={isFavorite(p.id) ? { color: accentColor || 'hsl(var(--primary))', fill: accentColor || 'hsl(var(--primary))' } : { color: 'white' }} />
                </button>
              </div>
            ))}
            {infiniteSentinel}
          </div>
        );

      case 'minimal-portfolio':
        return (
          <>
            <MinimalPortfolioLayout
              photos={visiblePhotos.map(p => ({ ...p, is_favorite: isFavorite(p.id) }))}
              eventName={event.name}
              isFavorite={isFavorite}
              toggleFavorite={toggleFavorite}
              canDownload={canDownload}
              onOpenLightbox={openLightbox}
              watermarkText={showWatermark ? (studioProfile?.studio_name ?? null) : null}
            />
            {infiniteSentinel}
          </>
        );

      case 'storybook':
        return (
          <>
            <StoryBookLayout
              photos={visiblePhotos.map(p => ({ ...p, is_favorite: isFavorite(p.id) }))}
              eventName={event.name}
              eventDate={event.event_date}
              isFavorite={isFavorite}
              toggleFavorite={toggleFavorite}
              canDownload={canDownload}
              onOpenLightbox={openLightbox}
              watermarkText={showWatermark ? (studioProfile?.studio_name ?? null) : null}
            />
            {infiniteSentinel}
          </>
        );

      default:
        return (
          <>
            <div style={{
              columns: isTimeless ? '4 200px' : '3 260px',
              columnGap: isTimeless ? '4px' : '12px',
            }}>
              {visiblePhotos.map(p => renderPhotoCard(p, 'masonry'))}
            </div>
            {infiniteSentinel}
          </>
        );
    }
  };

  const isStoryLayout = layout === 'story';

  return (
    <div
      className="min-h-[100dvh]"
      style={{
        ...(accentColor ? { '--studio-accent': accentColor } as React.CSSProperties : {}),
        backgroundColor: isAndhakar ? '#0D0D0D' : isTimeless ? '#F4F1EC' : wt.bg,
        color: isAndhakar ? '#C8C8C8' : isTimeless ? '#2B2B2B' : wt.text,
        fontFamily: wt.uiFontFamily,
      }}
    >
      <style>{kenBurnsStyle}</style>

      {/* ── WEBSITE HEADER ── */}
      <WebsiteHeader
        template={websiteTemplate}
        branding={combinedBranding}
        eventName={event.name}
        onScrollToGallery={scrollToGallery}
        onScrollToAbout={scrollToAbout}
        onScrollToContact={scrollToContact}
      />

      {/* ── HERO ── */}
      {isAndhakar ? (
        <div ref={heroRef}>
          <AndhakarHero
            coverUrl={event.cover_url}
            coupleName={(event as any).hero_couple_name || event.name}
            eventDate={event.event_date}
            subtitle={(event as any).hero_subtitle}
            buttonLabel={(event as any).hero_button_label}
            onScrollToGallery={scrollToGallery}
          />
        </div>
      ) : isTimeless ? (
        <div ref={heroRef}>
          <TimelessWeddingHero
            coverUrl={event.cover_url}
            coupleName={(event as any).hero_couple_name || event.name}
            eventDate={event.event_date}
            subtitle={(event as any).hero_subtitle}
            buttonLabel={(event as any).hero_button_label}
            onScrollToGallery={scrollToGallery}
            studioLogoUrl={studioProfile?.studio_logo_url}
            studioName={studioProfile?.studio_name}
          />
        </div>
      ) : (
        <div ref={heroRef} className="relative h-screen overflow-hidden">
          {event.cover_url ? (
            <img
              src={event.cover_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ animation: 'kenBurns 12s ease-in-out alternate infinite' }}
            />
          ) : (
            <div className="absolute inset-0 bg-foreground/90" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

          <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 px-6 text-center">
            {studioProfile?.studio_logo_url ? (
              <img src={studioProfile.studio_logo_url} alt="" className="h-12 object-contain mb-6 opacity-80" />
            ) : studioProfile?.studio_name ? (
              <p className="font-display text-sm italic text-white/60 mb-6 tracking-wider">{studioProfile.studio_name}</p>
            ) : null}

            <h1 className="font-serif text-4xl md:text-6xl font-bold text-white leading-tight">{event.name}</h1>
            <p className="text-muted-foreground text-sm mt-3 tracking-wide">
              {format(new Date(event.event_date), 'MMMM d, yyyy')}
            </p>
          </div>

          <button
            onClick={scrollToGallery}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/40 hover:text-white/70 transition"
          >
            <ChevronDown className="h-8 w-8" />
          </button>
        </div>
      )}

      {/* ── STICKY NAVBAR ── */}
      <div
        className={`sticky top-0 z-50 transition-all duration-300 ${
          stickyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
        style={{
          backgroundColor: isAndhakar ? 'rgba(13, 13, 13, 0.92)' : isTimeless ? '#FFFFFF' : wt.navBg,
          backdropFilter: isTimeless ? 'none' : 'blur(12px)',
          borderBottom: `1px solid ${isAndhakar ? 'rgba(200,200,200,0.1)' : isTimeless ? '#E7E2DA' : wt.navBorder}`,
          maxHeight: isTimeless ? '44px' : undefined,
        }}
      >
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between ${isTimeless ? 'h-11' : 'h-14'}`}>
          {/* Left: logo or name */}
          <div className="flex items-center gap-3 min-w-0">
            {studioProfile?.studio_logo_url ? (
              <img src={studioProfile.studio_logo_url} alt="" className="h-8 object-contain" />
            ) : (
              <span className="text-xs font-medium text-foreground truncate">{studioProfile?.studio_name}</span>
            )}
          </div>

          {/* Center: event name */}
          <span className="hidden sm:block font-serif text-sm text-foreground truncate max-w-[200px]">{event.name}</span>

          {/* Right: actions */}
          <div className="flex items-center gap-1">
            {event.face_recognition_enabled && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 text-[11px] hidden sm:flex"
                onClick={() => setFindMyPhotosOpen(true)}
              >
                <Camera className="h-3.5 w-3.5" /> Find My Photos
              </Button>
            )}
            {event.face_recognition_enabled && (
              <Button variant="ghost" size="icon" className="h-9 w-9 sm:hidden" onClick={() => setFindMyPhotosOpen(true)}>
                <Camera className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSearchOpen(v => !v)}>
              <Search className="h-4 w-4" />
            </Button>
            {favoriteCount > 0 && (
              <Button variant="outline" size="sm" className="h-9 text-[11px] hidden sm:flex" onClick={() => setSendFavOpen(true)}>
                <Mail className="h-3.5 w-3.5 mr-1" /> Send Favorites
              </Button>
            )}
            {favoriteCount > 0 && (
              <Button variant="ghost" size="icon" className="h-9 w-9 sm:hidden" onClick={() => setSendFavOpen(true)}>
                <Mail className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-9 w-9 relative" onClick={() => setFilter(f => f === 'favorites' ? 'all' : 'favorites')}>
              <Heart className="h-4 w-4" style={filter === 'favorites' ? { color: accentColor || 'hsl(var(--primary))', fill: accentColor || 'hsl(var(--primary))' } : undefined} />
              {favoriteCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  {favoriteCount}
                </span>
              )}
            </Button>
            {canDownload && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" disabled={downloading}>
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => guardedDownload(() => buildZip(photos, 'gallery'))} className="text-xs gap-2">
                    <PackageOpen className="h-3.5 w-3.5" /> All Photos ({photos.length})
                  </DropdownMenuItem>
                  {favoriteCount > 0 && (
                    <DropdownMenuItem onClick={() => guardedDownload(() => buildZip(photos.filter(p => isFavorite(p.id)), 'favorites'))} className="text-xs gap-2">
                      <Heart className="h-3.5 w-3.5" /> Favorites ({favoriteCount})
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button variant="ghost" size="icon" className="h-9 w-9"
              onClick={() => { navigator.clipboard.writeText(window.location.href); sonnerToast.success('Link copied'); }}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── GALLERY SECTION ── */}
      <div ref={galleryRef} className={`max-w-7xl mx-auto ${isStoryLayout ? '' : isTimeless ? 'px-2 sm:px-4 py-8' : 'px-4 sm:px-8 py-10 sm:py-14'}`}>

        {/* Filter / Sort bar */}
        {!isStoryLayout && (
          <div className="mb-8 sm:mb-10 space-y-4">
            <div className="flex items-center justify-between gap-4">
              {/* Filter pills */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-hide min-w-0">
                <FilterPill active={filter === 'all' && !sectionFilter} onClick={() => { setFilter('all'); setSectionFilter(null); }} accent={accentColor}>
                  All Photos
                </FilterPill>
                {availableSections.map(s => (
                  <FilterPill key={s} active={sectionFilter === s} onClick={() => { setFilter('all'); setSectionFilter(sectionFilter === s ? null : s); }} accent={accentColor}>
                    {s}
                  </FilterPill>
                ))}
                <FilterPill active={filter === 'favorites'} onClick={() => { setFilter(f => f === 'favorites' ? 'all' : 'favorites'); setSectionFilter(null); }} accent={accentColor}>
                  <Heart className="h-3.5 w-3.5 mr-1.5" /> Favorites {favoriteCount > 0 && `(${favoriteCount})`}
                </FilterPill>
              </div>

              {/* Sort */}
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
                <SelectTrigger className="h-9 w-[140px] text-xs border-border/40 rounded-full bg-transparent shrink-0 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest" className="text-xs">Latest First</SelectItem>
                  <SelectItem value="oldest" className="text-xs">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search bar */}
            {searchOpen && (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search photos by name or section…"
                  className="pl-10 pr-10 bg-background/60 backdrop-blur-sm border-border/40 rounded-full h-11 shadow-none"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ZIP Progress */}
        {downloading && (
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Preparing download…</span>
              <span>{downloadProgress}</span>
            </div>
            <Progress value={zipPercent} className="h-1.5" />
          </div>
        )}

        {/* Text blocks before gallery */}
        {textBlocks.filter(b => b.sort_order < 0).map(block => (
          <GalleryTextBlockRenderer key={block.id} block={block} />
        ))}

        {/* Gallery grid */}
        {renderGallery()}

        {/* Text blocks after gallery */}
        {textBlocks.filter(b => b.sort_order >= 0).map(block => (
          <GalleryTextBlockRenderer key={block.id} block={block} />
        ))}

      </div>

      {/* ── ABOUT SECTION ── */}
      {hasAbout && (
        <div ref={aboutRef}>
          <WebsiteAbout template={websiteTemplate} branding={combinedBranding} id="about" />
        </div>
      )}

      {/* ── CONTACT SECTION ── */}
      {hasContact && (
        <div ref={contactRef}>
          <WebsiteContact template={websiteTemplate} branding={combinedBranding} id="contact" />
        </div>
      )}

      {/* ── WEBSITE FOOTER ── */}
      <WebsiteFooter template={websiteTemplate} branding={combinedBranding} photographerUsername={studioExtended?.username} />

      {/* ── Floating Favorites Bar ── */}
      {favoriteCount > 0 && !lightboxOpen && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl shadow-black/20 border border-white/10 backdrop-blur-xl animate-in slide-in-from-bottom-4 fade-in duration-300"
          style={{ backgroundColor: accentColor ? `${accentColor}ee` : 'hsl(var(--primary) / 0.93)' }}
        >
          <div className="flex items-center gap-2">
            <Heart className="h-4.5 w-4.5 text-white" fill="white" />
            <span className="text-white text-sm font-semibold">{favoriteCount}</span>
            <span className="text-white/70 text-sm hidden sm:inline">
              {favoriteCount === 1 ? 'favorite' : 'favorites'}
            </span>
          </div>

          <div className="w-px h-5 bg-white/25" />

          <button
            onClick={() => setFilter(f => f === 'favorites' ? 'all' : 'favorites')}
            className="text-white/90 hover:text-white text-sm font-medium transition-colors px-1"
          >
            {filter === 'favorites' ? 'Show All' : 'View'}
          </button>

          {canDownload && (
            <>
              <div className="w-px h-5 bg-white/25" />
              <button
                onClick={() => guardedDownload(() => buildZip(photos.filter(p => isFavorite(p.id)), 'favorites'))}
                disabled={downloading}
                className="flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium transition-colors px-1 disabled:opacity-50"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span className="hidden sm:inline">Download</span>
              </button>
            </>
          )}

          <button
            onClick={() => setSendFavOpen(true)}
            className="flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium transition-colors px-1"
          >
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </button>

          <button
            onClick={() => { photos.forEach(p => { if (isFavorite(p.id)) rawToggleFavorite(p.id); }); }}
            className="text-white/50 hover:text-white/80 transition-colors ml-1"
            title="Clear all favorites"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Lightbox ── */}
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
        eventTitle={event.name}
      />

      {/* Send Favorites Dialog */}
      <SendFavoritesDialog
        open={sendFavOpen}
        onOpenChange={setSendFavOpen}
        eventId={event.id}
        eventTitle={event.name}
        favoritePhotoIds={photos.filter(p => isFavorite(p.id)).map(p => p.id)}
        favoritePhotos={photos.filter(p => isFavorite(p.id)).map(p => ({ id: p.id, url: p.url }))}
        sessionId={sessionId}
      />

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
          <div className="w-full max-w-xs bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-lg font-semibold text-foreground text-center">Download Password</h3>
            <p className="text-[11px] text-muted-foreground/60 text-center">Enter the password to download photos.</p>
            <form onSubmit={handleDownloadPwSubmit} className="space-y-3">
              <Input value={downloadPwInput} onChange={(e) => { setDownloadPwInput(e.target.value); setDownloadPwError(false); }}
                placeholder="Enter password" className="bg-background border-border h-10 text-center" autoFocus />
              {downloadPwError && <p className="text-[10px] text-destructive text-center">Incorrect password.</p>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1 h-10" onClick={() => { setDownloadPwPrompt(false); setDownloadPwInput(''); setDownloadPwError(false); setPendingDownloadAction(null); }}>Cancel</Button>
                <Button type="submit" className="flex-1 h-10">Confirm</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Find My Photos Modal */}
      <FindMyPhotosModal
        open={findMyPhotosOpen}
        onOpenChange={setFindMyPhotosOpen}
        eventId={event.id}
        eventName={event.name}
        accentColor={accentColor}
        onOpenLightbox={openLightbox}
        isFavorite={isFavorite}
        toggleFavorite={toggleFavorite}
        canDownload={canDownload}
        onDownloadPhoto={canDownload ? (p) => guardedDownload(() => handleDownloadPhoto(p as Photo)) : undefined}
      />
    </div>
  );
};

/* ── Filter Pill sub-component ── */
function FilterPill({ active, onClick, accent, children }: {
  active: boolean; onClick: () => void; accent: string | null; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex items-center px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 border whitespace-nowrap ${
        active
          ? 'text-white border-transparent shadow-md'
          : 'bg-transparent text-muted-foreground border-border/50 hover:border-foreground/30 hover:text-foreground/80 hover:bg-muted/30'
      }`}
      style={active ? { backgroundColor: accent || 'hsl(var(--primary))' } : undefined}
    >
      {children}
    </button>
  );
}

/* ── Helpers ── */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function groupByDate(photos: Photo[]): [string, Photo[]][] {
  const map = new Map<string, Photo[]>();
  photos.forEach(p => {
    const date = p.created_at.split('T')[0];
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(p);
  });
  return Array.from(map.entries());
}

export default PublicGallery;
