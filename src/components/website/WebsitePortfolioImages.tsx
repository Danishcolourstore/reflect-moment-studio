import { ProgressiveImage } from '@/components/ProgressiveImage';
import { getTemplate } from '@/lib/website-templates';
import { Camera } from 'lucide-react';

interface PortfolioPhoto {
  id: string;
  url: string;
}

interface WebsitePortfolioImagesProps {
  photos: PortfolioPhoto[];
  accent: string;
  template?: string;
  id?: string;
}

export function WebsitePortfolioImages({ photos, accent, template = 'vows-elegance', id }: WebsitePortfolioImagesProps) {
  if (photos.length === 0) return null;
  const tmpl = getTemplate(template);

  return (
    <section id={id} className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: tmpl.bg }}>
      <div className="text-center mb-16 sm:mb-20">
        <p
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] mb-4"
          style={{ color: accent, opacity: 0.7 }}
        >
          Featured Work
        </p>
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide"
          style={{ fontFamily: tmpl.fontFamily, color: tmpl.text }}
        >
          Portfolio
        </h2>
        <div className="mt-5 w-10 h-[1px] mx-auto" style={{ backgroundColor: accent, opacity: 0.5 }} />
      </div>

      <div className="max-w-7xl mx-auto columns-2 sm:columns-3 lg:columns-4 gap-2 sm:gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative mb-2 sm:mb-3 break-inside-avoid overflow-hidden cursor-pointer"
            style={{ borderRadius: '2px' }}
          >
            <div className="transition-transform duration-700 ease-out group-hover:scale-[1.04]">
              <ProgressiveImage src={photo.url} alt="" className="w-full block" />
            </div>
            {/* Subtle hover overlay */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `linear-gradient(to top, ${tmpl.footerBg}4D 0%, transparent 50%)`,
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
