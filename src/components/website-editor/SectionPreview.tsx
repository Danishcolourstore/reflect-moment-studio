import type { SectionType, SectionSettings } from './section-configs';
import { SECTION_LABELS } from './section-configs';
import { Star } from 'lucide-react';

interface SectionPreviewProps {
  type: SectionType;
  settings: SectionSettings;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Renders a simplified live preview of a section with current settings applied.
 */
export function SectionPreview({ type, settings, selected, onSelect }: SectionPreviewProps) {
  const s = settings;

  return (
    <div
      className="relative transition-all duration-200 cursor-pointer"
      style={{
        paddingTop: s.paddingTop,
        paddingBottom: s.paddingBottom,
        backgroundColor: s.backgroundColor,
        color: s.textColor,
        outline: selected ? '2px solid #0A84FF' : '2px solid transparent',
        outlineOffset: -2,
      }}
      onClick={onSelect}
    >
      {/* Selection badge */}
      {selected && (
        <div
          className="absolute top-2 right-2 z-10 text-[10px] font-medium px-2 py-1 rounded"
          style={{ backgroundColor: '#0A84FF', color: '#fff' }}
        >
          Editing
        </div>
      )}

      {type === 'hero' && <HeroPreview s={s} />}
      {type === 'rich-text' && <RichTextPreview s={s} />}
      {type === 'image-gallery' && <GalleryPreview s={s} />}
      {type === 'testimonials' && <TestimonialsPreview s={s} />}
      {type === 'contact' && <ContactPreview s={s} />}
      {type === 'footer' && <FooterPreview s={s} />}
      {type === 'blog-grid' && <BlogGridPreview s={s} />}
      {type === 'team' && <TeamPreview s={s} />}
      {type === 'faq' && <FAQPreview s={s} />}
    </div>
  );
}

/* ── Individual section previews ── */

function HeroPreview({ s }: { s: SectionSettings }) {
  return (
    <div className="relative min-h-[320px] flex items-center justify-center overflow-hidden">
      {s.heroImageUrl && (
        <img
          src={s.heroImageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
      )}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${(s.overlayOpacity || 0) / 100})` }}
      />
      <div className="relative z-10 px-6" style={{ textAlign: s.textAlign || 'center' }}>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: s.headingSize || 48,
            fontStyle: 'italic',
            lineHeight: 1.1,
            color: s.textColor,
          }}
        >
          {s.heading}
        </h1>
        {s.subtitle && (
          <p
            className="mt-3 tracking-[0.14em] uppercase"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: s.subtitleSize || 14,
              color: s.textColor,
              opacity: 0.85,
            }}
          >
            {s.subtitle}
          </p>
        )}
        {s.ctaVisible && s.ctaText && (
          <button
            className="mt-6 px-6 py-3 text-[12px] uppercase tracking-[0.12em] border border-current"
            style={{ fontFamily: "'DM Sans', sans-serif", color: s.textColor }}
          >
            {s.ctaText}
          </button>
        )}
      </div>
    </div>
  );
}

function RichTextPreview({ s }: { s: SectionSettings }) {
  return (
    <div className="max-w-2xl mx-auto px-6">
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 32,
          fontStyle: 'italic',
        }}
      >
        {s.heading}
      </h2>
      <p
        className="mt-4"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: s.bodySize || 16,
          lineHeight: s.lineHeight || 1.8,
          opacity: 0.75,
        }}
      >
        {s.bodyText}
      </p>
    </div>
  );
}

function GalleryPreview({ s }: { s: SectionSettings }) {
  const cols = s.columns || 3;
  const images = [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=600',
    'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=600',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600',
    'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600',
  ];
  return (
    <div className="px-6">
      {s.heading && (
        <h2
          className="mb-4"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: 'italic' }}
        >
          {s.heading}
        </h2>
      )}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: s.gap || 8,
        }}
      >
        {images.map((src, i) => (
          <div key={i} className="aspect-square overflow-hidden" style={{ borderRadius: s.borderRadius || 4 }}>
            <img src={src} alt="" className="w-full h-full" style={{ objectFit: s.imageFit || 'cover' }} loading="lazy" decoding="async" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialsPreview({ s }: { s: SectionSettings }) {
  const count = s.cardCount || 3;
  const names = ['Priya & Rohit', 'Aisha & Dev', 'Maya & Arjun'];
  return (
    <div className="px-6">
      {s.heading && (
        <h2
          className="mb-6"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: 'italic' }}
        >
          {s.heading}
        </h2>
      )}
      <div className="space-y-4">
        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-lg"
            style={{ backgroundColor: s.cardBackground || '#fff' }}
          >
            {s.showStars && (
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: s.starCount || 5 }).map((_, j) => (
                  <Star key={j} size={14} strokeWidth={1.5} fill="#1A1A1A" className="text-[#1A1A1A]" />
                ))}
              </div>
            )}
            <p
              className="text-sm italic"
              style={{ fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.7, color: s.textColor }}
            >
              "An absolutely magical experience. Every frame tells our story."
            </p>
            <p
              className="mt-2 text-[10px] uppercase tracking-[0.14em]"
              style={{ fontFamily: "'DM Sans', sans-serif", color: '#999' }}
            >
              {names[i] || 'Client'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactPreview({ s }: { s: SectionSettings }) {
  return (
    <div className="max-w-md mx-auto px-6">
      <h2
        className="mb-6"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontStyle: 'italic' }}
      >
        {s.heading}
      </h2>
      <div className="space-y-4">
        <div className="h-11 rounded border" style={{ borderColor: '#e8e4de' }} />
        <div className="h-11 rounded border" style={{ borderColor: '#e8e4de' }} />
        <div className="h-24 rounded border" style={{ borderColor: '#e8e4de' }} />
        <div
          className="h-12 rounded flex items-center justify-center text-[12px] uppercase tracking-[0.12em] text-white"
          style={{ backgroundColor: s.buttonColor || '#1A1A1A', fontFamily: "'DM Sans', sans-serif" }}
        >
          Send Message
        </div>
      </div>
    </div>
  );
}

function FooterPreview({ s }: { s: SectionSettings }) {
  return (
    <div className="text-center px-6 py-4">
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: 'italic', color: s.textColor }}>
        {s.heading}
      </p>
      <p className="mt-1 text-[10px]" style={{ fontFamily: "'DM Sans', sans-serif", color: '#555' }}>
        Delivered by MirrorAI
      </p>
    </div>
  );
}

function BlogGridPreview({ s }: { s: SectionSettings }) {
  const cols = s.columns || 3;
  return (
    <div className="px-6">
      <h2
        className="mb-4"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: 'italic' }}
      >
        {s.heading}
      </h2>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(cols, 2)}, 1fr)` }}>
        {Array.from({ length: Math.min(s.postsToShow || 6, 4) }).map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
            <div className="aspect-video bg-[#e0e0e0]" />
            <div className="p-3">
              <div className="h-3 w-3/4 rounded bg-[#d0d0d0] mb-2" />
              {s.showExcerpt && <div className="h-2 w-full rounded bg-[#e0e0e0]" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamPreview({ s }: { s: SectionSettings }) {
  return (
    <div className="px-6">
      <h2 className="mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: 'italic' }}>
        {s.heading}
      </h2>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(s.columns || 3, 2)}, 1fr)` }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#e0e0e0] mb-2" />
            <div className="h-3 w-2/3 mx-auto rounded bg-[#d0d0d0]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FAQPreview({ s }: { s: SectionSettings }) {
  return (
    <div className="px-6 max-w-lg mx-auto">
      <h2 className="mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: 'italic' }}>
        {s.heading}
      </h2>
      {[1, 2, 3].map((i) => (
        <div key={i} className="py-3 border-b" style={{ borderColor: '#2c2c2e30' }}>
          <div className="h-3 w-3/4 rounded bg-[#d0d0d0]" />
        </div>
      ))}
    </div>
  );
}
