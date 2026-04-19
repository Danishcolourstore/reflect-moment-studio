/**
 * Public live gallery — guests open this on their phone during the event.
 * Photos appear in real-time as the photographer shoots.
 */
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCheetahPublic } from '@/hooks/use-cheetah-public';
import { Camera, Radio, X } from 'lucide-react';
import { cn } from '@/lib/utils';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

export default function CheetahLiveView() {
  const { code } = useParams<{ code: string }>();
  const { session, photos, loading, error } = useCheetahPublic(code);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Flash newly arriving photos
  useEffect(() => {
    if (photos.length === 0) return;
    const newest = photos[0];
    if (!seenIdsRef.current.has(newest.id)) {
      photos.forEach((p) => seenIdsRef.current.add(p.id));
      // only flash after first load
      if (seenIdsRef.current.size > photos.length - 1) return;
    }
    if (seenIdsRef.current.size === 0) {
      photos.forEach((p) => seenIdsRef.current.add(p.id));
      return;
    }
    // mark new ids and flash
    photos.forEach((p) => {
      if (!seenIdsRef.current.has(p.id)) {
        seenIdsRef.current.add(p.id);
        setFlashId(p.id);
        setTimeout(() => setFlashId((cur) => (cur === p.id ? null : cur)), 1500);
      }
    });
  }, [photos]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="text-center">
          <Radio className="mx-auto h-6 w-6 text-accent skeleton-block mb-3" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Connecting…</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-6">
        <div className="text-center max-w-sm">
          <Camera className="mx-auto h-10 w-10 text-muted-foreground/30 mb-4" />
          <h1 className="font-serif text-2xl text-foreground mb-2" style={{ fontWeight: 300 }}>
            Session unavailable
          </h1>
          <p className="text-sm text-muted-foreground">
            {error || 'This live session has ended or the link is invalid.'}
          </p>
        </div>
      </div>
    );
  }

  const openPhoto = openIdx !== null ? photos[openIdx] : null;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Helmet>
        <title>{`${session.title} · Live`}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Header */}
      <header
        className="sticky top-0 z-20 bg-[#FAFAF8]/90 backdrop-blur border-b border-border"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-60" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-700 font-medium">Live Now</p>
              <p className="text-sm font-serif text-foreground truncate" style={{ fontWeight: 400 }}>{session.title}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-serif text-2xl text-foreground tabular-nums" style={{ fontWeight: 300 }}>
              {photos.length}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">photos</p>
          </div>
        </div>
      </header>

      {/* Empty state */}
      {photos.length === 0 ? (
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <Camera className="mx-auto h-10 w-10 text-muted-foreground/30 mb-4" />
          <p className="font-serif text-xl text-foreground mb-2" style={{ fontWeight: 300 }}>
            Waiting for the first shot
          </p>
          <p className="text-sm text-muted-foreground">
            Photos will appear here as soon as the photographer starts shooting.
          </p>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setOpenIdx(i)}
                className={cn(
                  'group relative aspect-square overflow-hidden bg-muted transition-all',
                  flashId === p.id && 'ring-2 ring-accent ring-offset-2 ring-offset-[#FAFAF8]',
                )}
              >
                <img
                  src={p.thumbnail_url || p.preview_url || p.original_url}
                  alt={p.file_name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                {flashId === p.id && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] uppercase tracking-widest font-medium px-1.5 py-0.5 bg-accent text-accent-foreground rounded-sm">
                    New
                  </span>
                )}
                <span className="absolute bottom-1.5 right-1.5 text-[9px] text-white/90 bg-black/40 px-1.5 py-0.5 rounded-sm tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                  {timeAgo(p.created_at)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {openPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setOpenIdx(null)}
        >
          <button
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            style={{ top: 'max(16px, env(safe-area-inset-top, 16px))' }}
            onClick={(e) => { e.stopPropagation(); setOpenIdx(null); }}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={openPhoto.preview_url || openPhoto.original_url}
            alt={openPhoto.file_name}
            className="max-w-full max-h-full object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <footer className="py-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
          Powered by Mirror AI · Cheetah Live
        </p>
      </footer>
    </div>
  );
}
