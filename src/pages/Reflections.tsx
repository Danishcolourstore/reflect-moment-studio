import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { HamburgerButton, DrawerMenu, useDrawerMenu } from '@/components/GlobalDrawerMenu';
import { X } from 'lucide-react';

const ease = [0.16, 1, 0.3, 1];
const cormorant = '"Cormorant Garamond", serif';
const dm = '"DM Sans", sans-serif';

interface ReflectionPhoto {
  id: string;
  image_url: string;
}

function FilmGrain() {
  return (
    <svg className="pointer-events-none fixed inset-0 w-full h-full z-[60] opacity-[0.02]">
      <filter id="ref-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#ref-grain)" />
    </svg>
  );
}

/* ─── Scroll-reveal photo card ─── */
function PhotoCard({ photo, index, onTap }: { photo: ReflectionPhoto; index: number; onTap: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: '80px', threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full px-4 md:px-0">
      <motion.div
        className="w-full overflow-hidden rounded-lg cursor-pointer"
        style={{ willChange: 'transform, opacity, filter' }}
        initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
        animate={visible ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
        transition={{ duration: 0.7, delay: Math.min(index * 0.06, 0.3), ease }}
        onClick={onTap}
        whileTap={{ scale: 0.985 }}
      >
        <img
          src={photo.image_url}
          alt=""
          className="w-full h-auto block"
          loading={index < 3 ? 'eager' : 'lazy'}
          style={{ display: 'block' }}
        />
      </motion.div>
    </div>
  );
}

/* ─── Fullscreen Lightbox ─── */
function Lightbox({ photo, onClose }: { photo: ReflectionPhoto | null; onClose: () => void }) {
  useEffect(() => {
    if (!photo) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handler); };
  }, [photo, onClose]);

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: '#030303' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease }}
          onClick={onClose}
        >
          {/* Close */}
          <button
            className="absolute top-5 right-5 z-[101] p-2 rounded-full transition-colors"
            style={{ color: 'rgba(240,237,232,0.3)' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>

          <motion.img
            src={photo.image_url}
            alt=""
            className="max-w-[95vw] max-h-[92vh] object-contain"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.5, ease }}
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main Reflections Page ─── */
export default function Reflections() {
  const drawer = useDrawerMenu();
  const [photos, setPhotos] = useState<ReflectionPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState<ReflectionPhoto | null>(null);

  // Infinite scroll
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPhotos = useCallback(async (pageNum: number) => {
    const from = (pageNum - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await (supabase.from('reflections_posts' as any).select('id, image_url') as any)
      .eq('is_published', true)
      .eq('is_active', true)
      .not('image_url', 'is', null)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    const items: ReflectionPhoto[] = (data || []).filter((p: any) => p.image_url);
    if (items.length < PAGE_SIZE) setHasMore(false);
    setPhotos(prev => pageNum === 1 ? items : [...prev, ...items]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPhotos(1); }, [fetchPhotos]);

  useEffect(() => {
    if (page === 1) return;
    fetchPhotos(page);
  }, [page, fetchPhotos]);

  // Sentinel observer for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setPage(p => p + 1); },
      { rootMargin: '600px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, page]);

  return (
    <div className="min-h-[100dvh] relative" style={{ background: '#080808' }}>
      <FilmGrain />
      <DrawerMenu open={drawer.open} onClose={drawer.close} />
      <Lightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-1" style={{ height: 48 }}>
        <HamburgerButton onClick={drawer.toggle} />
      </div>

      {/* Hero */}
      <div className="pt-[48px] pb-12 px-6 flex flex-col items-center justify-center" style={{ minHeight: '35vh' }}>
        <motion.p
          className="uppercase text-center"
          style={{ fontFamily: dm, fontSize: 9, color: '#2A2A2A', letterSpacing: '0.45em' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          Mirror AI · Curated
        </motion.p>
        <motion.h1
          className="mt-5 text-center"
          style={{
            fontFamily: cormorant,
            fontSize: 'clamp(36px, 10vw, 64px)',
            fontWeight: 300,
            color: '#F0EDE8',
            lineHeight: 1.05,
            letterSpacing: '-0.01em',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease }}
        >
          Reflections
        </motion.h1>
        <motion.div
          className="mt-6"
          style={{ width: 32, height: 1, background: 'rgba(232,201,122,0.4)' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.6, ease }}
        />
        <motion.p
          className="mt-5 text-center"
          style={{ fontFamily: dm, fontSize: 11, color: '#2A2A2A', letterSpacing: '0.08em', maxWidth: 260 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          A gallery of images chosen by Mirror AI. No algorithm. No feed. Just photographs.
        </motion.p>
      </div>

      {/* Photo Grid */}
      {loading && photos.length === 0 ? (
        <div className="px-4 space-y-4 pb-12">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full rounded-lg skeleton-block" style={{ height: 280, background: '#0C0C0C' }} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center px-8 pb-20" style={{ minHeight: '30vh' }}>
          <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12 mb-6" style={{ opacity: 0.08 }}>
            <rect x="4" y="4" width="40" height="40" rx="8" stroke="#F0EDE8" strokeWidth="1" />
            <circle cx="16" cy="18" r="3" stroke="#F0EDE8" strokeWidth="1" />
            <path d="M4 34L16 22L28 34L36 26L44 34" stroke="#F0EDE8" strokeWidth="1" />
          </svg>
          <p
            className="text-center"
            style={{ fontFamily: cormorant, fontSize: 22, fontWeight: 300, color: '#F0EDE8', lineHeight: 1.4 }}
          >
            The gallery is being prepared.
          </p>
          <p className="mt-3 text-center" style={{ fontFamily: dm, fontSize: 11, color: '#2A2A2A', maxWidth: 220 }}>
            Mirror AI is curating photographs for you. They will appear here soon.
          </p>
        </div>
      ) : (
        <div className="max-w-[540px] mx-auto space-y-5 pb-16 md:px-0">
          {photos.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={i}
              onTap={() => setLightboxPhoto(photo)}
            />
          ))}
          {hasMore && <div ref={sentinelRef} className="h-4" />}
        </div>
      )}

      {/* Bottom breathing space */}
      <div className="h-8" />
    </div>
  );
}
