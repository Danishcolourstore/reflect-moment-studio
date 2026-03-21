import { useState } from 'react';
import { ProgressiveImage } from '@/components/ProgressiveImage';
import { getTemplate } from '@/lib/website-templates';
import { Camera, X } from 'lucide-react';

interface WebsiteLatestWorksProps {
  id?: string;
  template?: string;
  images: string[];
  accent: string;
  title?: string;
  maxImages?: number;
  onLoadMore?: () => void;
}

export function WebsiteLatestWorks({
  id,
  template = 'modern-photography-grid',
  images,
  accent,
  title = 'My Latest Works',
  maxImages = 30,
  onLoadMore,
}: WebsiteLatestWorksProps) {
  const tmpl = getTemplate(template);
  const isModern = template === 'modern-photography-grid';
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  const visibleImages = images.slice(0, visibleCount);
  const hasMore = visibleCount < images.length;

  if (images.length === 0) {
    return (
      <section id={id} className="py-28 text-center" style={{ backgroundColor: isModern ? '#FFFFFF' : tmpl.bg }}>
        <Camera className="mx-auto h-10 w-10 mb-4" style={{ color: tmpl.textSecondary, opacity: 0.3 }} />
        <p className="text-sm" style={{ color: tmpl.textSecondary }}>No works uploaded yet</p>
      </section>
    );
  }

  return (
    <section id={id} style={{ backgroundColor: isModern ? '#FFFFFF' : tmpl.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Section title */}
        <div className="text-center mb-12 sm:mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight"
            style={{
              fontFamily: isModern ? '"DM Sans", sans-serif' : tmpl.fontFamily,
              color: isModern ? '#1A1A1A' : tmpl.text,
            }}
          >
            {title}
          </h2>
          <div className="mt-4 w-12 h-[2px] mx-auto" style={{ backgroundColor: isModern ? '#1A1A1A' : accent }} />
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {visibleImages.map((url, i) => (
            <button
              key={`${url}-${i}`}
              onClick={() => setLightboxIdx(i)}
              className="group relative block overflow-hidden rounded-sm cursor-pointer focus:outline-none"
            >
              <div className="relative w-full" style={{ paddingBottom: '100%', backgroundColor: isModern ? '#F5F5F5' : tmpl.cardBg }}>
                <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                  <ProgressiveImage
                    src={url}
                    alt={`Work ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>
            </button>
          ))}
        </div>

        {/* Load More button */}
        {hasMore && (
          <div className="text-center mt-10 sm:mt-14">
            <button
              onClick={() => setVisibleCount(prev => Math.min(prev + 12, images.length))}
              className="h-12 px-10 text-xs uppercase tracking-[0.2em] border rounded-full transition-all duration-300 hover:bg-black hover:text-white"
              style={{
                borderColor: isModern ? '#1A1A1A' : tmpl.text,
                color: isModern ? '#1A1A1A' : tmpl.text,
              }}
            >
              Load More
            </button>
          </div>
        )}

        {/* Counter */}
        <p className="text-center mt-4 text-[11px] tracking-wider" style={{ color: isModern ? '#999' : tmpl.textSecondary }}>
          {images.length} / {maxImages} images
        </p>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => setLightboxIdx(null)}
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <img
            src={images[lightboxIdx]}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={e => e.stopPropagation()}
          />
          {/* Nav arrows */}
          {lightboxIdx > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white text-lg"
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
            >
              ‹
            </button>
          )}
          {lightboxIdx < images.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white text-lg"
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </section>
  );
}
