import { Instagram } from 'lucide-react';
import { getTemplate } from '@/lib/website-templates';

interface WebsiteInstagramGridProps {
  photos: string[];
  instagramHandle?: string;
  accent: string;
  id?: string;
  template?: string;
}

/**
 * Instagram-style photo grid with follow CTA.
 * Inspired by the "FOLLOW US ON" section in the reference design.
 */
export function WebsiteInstagramGrid({ photos, instagramHandle, accent, id, template = 'vows-elegance' }: WebsiteInstagramGridProps) {
  if (photos.length === 0) return null;
  const tmpl = getTemplate(template);

  return (
    <section id={id} className="py-16 sm:py-24" style={{ backgroundColor: tmpl.bg }}>
      {/* Header */}
      <div className="text-center mb-10 px-6">
        <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: accent, opacity: 0.7 }}>
          Follow Us On
        </p>
        <h2 className="text-2xl sm:text-3xl font-light tracking-wide" style={{ fontFamily: tmpl.fontFamily, color: tmpl.text }}>
          {instagramHandle || 'Instagram'}
        </h2>
        <div className="mt-4 w-8 h-[1px] mx-auto" style={{ backgroundColor: accent, opacity: 0.4 }} />
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-0.5 sm:gap-1">
        {photos.slice(0, 6).map((url, i) => (
          <div key={i} className="relative group aspect-square overflow-hidden">
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ backgroundColor: `${tmpl.bg}BB` }}
            >
              <Instagram className="h-6 w-6" style={{ color: tmpl.text }} />
            </div>
          </div>
        ))}
      </div>

      {/* Follow CTA */}
      {instagramHandle && (
        <div className="text-center mt-8">
          <a
            href={`https://instagram.com/${instagramHandle.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-11 px-8 text-[10px] uppercase tracking-[0.2em] border rounded-none transition-all duration-300 hover:bg-white/5"
            style={{ borderColor: `${tmpl.text}30`, color: tmpl.text }}
          >
            <Instagram className="h-3.5 w-3.5" />
            Follow on Instagram
          </a>
        </div>
      )}
    </section>
  );
}
