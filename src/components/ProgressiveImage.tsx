import { useState, useRef, useEffect, memo } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt?: string;
  className?: string;
  draggable?: boolean;
  onClick?: () => void;
}

/**
 * Progressive image with blur-up placeholder.
 * Shows a CSS blur placeholder → loads thumbnail → reveals full image.
 */
export const ProgressiveImage = memo(function ProgressiveImage({
  src, alt = '', className = '', draggable = false, onClick,
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} onClick={onClick}>
      {/* Blur placeholder background */}
      <div
        className="absolute inset-0 bg-muted/30 transition-opacity duration-500"
        style={{ opacity: loaded ? 0 : 1 }}
      />

      {inView && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-all duration-500 ${loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'}`}
          draggable={draggable}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  );
});
