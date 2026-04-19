import { useState, useRef, useEffect, memo } from 'react';
import { getOptimizedUrl, getImageSrcSet, getImageSizes } from '@/lib/image-utils';

interface ProgressiveImageProps {
  src: string;
  alt?: string;
  className?: string;
  draggable?: boolean;
  onClick?: () => void;
  /** Use 'grid' for gallery thumbnails, 'lightbox' for full viewer, 'hero' for hero/cover */
  context?: 'grid' | 'lightbox' | 'hero';
}

/**
 * Progressive image with blur-up placeholder and responsive sizing.
 *
 * Phase 1: Neutral muted placeholder (instant)
 * Phase 2: Tiny thumbnail loads with blur (fast, ~15KB)
 * Phase 3: Thumbnail sharpens into view
 *
 * In grid context, only loads 400px-wide thumbnails.
 * srcSet allows browser to pick optimal size based on viewport.
 */
export const ProgressiveImage = memo(function ProgressiveImage({
  src, alt = '', className = '', draggable = false, onClick,
  context = 'grid',
}: ProgressiveImageProps) {
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Determine the display URL based on context
  const displayUrl = context === 'lightbox' ? src : getOptimizedUrl(src, context === 'hero' ? 'medium' : 'thumbnail');
  const srcSet = context === 'lightbox' ? undefined : getImageSrcSet(src);
  const sizes = getImageSizes(context);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { rootMargin: '300px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Reset loaded state when src changes
  useEffect(() => {
    setThumbLoaded(false);
  }, [src]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} onClick={onClick}>
      {/* Phase 1: Elegant shimmer placeholder */}
      <div
        className="absolute inset-0 bg-muted/20 transition-opacity duration-700"
        style={{ opacity: thumbLoaded ? 0 : 1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-block" />
      </div>

      {inView && (
        <img
          src={displayUrl}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          className={`${className} transition-all duration-700 ease-out ${thumbLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-[1.02]'}`}
          draggable={draggable}
          loading="lazy"
          decoding="async"
          onLoad={() => setThumbLoaded(true)}
        />
      )}
    </div>
  );
});
