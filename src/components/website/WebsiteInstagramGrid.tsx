import { Instagram } from 'lucide-react';
import { getTemplate } from '@/lib/website-templates';

interface WebsiteInstagramGridProps {
  photos: string[];
  instagramHandle?: string;
  accent: string;
  id?: string;
  template?: string;
}

export function WebsiteInstagramGrid({ photos, instagramHandle, accent, id, template = 'vows-elegance' }: WebsiteInstagramGridProps) {
  if (photos.length === 0) return null;
  const tmpl = getTemplate(template);
  const isEditorial = template === 'editorial-luxury';

  return (
    <section id={id} className="py-20 sm:py-28" style={{ backgroundColor: isEditorial ? '#F5F0EA' : tmpl.bg }}>
      <div className="text-center mb-12 px-6">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-4" style={{ color: accent, opacity: 0.7, fontFamily: '"DM Sans", sans-serif' }}>
          Follow Us On
        </p>
        <h2
          className={`text-2xl sm:text-3xl lg:text-4xl font-light ${isEditorial ? 'italic' : 'uppercase tracking-[0.06em]'}`}
          style={{ fontFamily: isEditorial ? '"Playfair Display", Georgia, serif' : '"Cormorant Garamond", Georgia, serif', color: isEditorial ? '#2B2A28' : tmpl.text }}
        >
          {instagramHandle || '@YourStudio'}
        </h2>
        <div className="mt-5 w-8 h-[1px] mx-auto" style={{ backgroundColor: isEditorial ? '#D5CEC5' : accent, opacity: 0.4 }} />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-1.5 px-1 sm:px-2">
        {photos.slice(0, 5).map((url, i) => (
          <div key={i} className="relative group aspect-[4/5] overflow-hidden">
            <img src={url} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400"
              style={{ backgroundColor: isEditorial ? 'rgba(43,42,40,0.7)' : `${tmpl.bg}CC` }}
            >
              <Instagram className="h-7 w-7" style={{ color: isEditorial ? '#F5F0EA' : tmpl.text, opacity: 0.9 }} />
            </div>
          </div>
        ))}
      </div>

      {instagramHandle && (
        <div className="text-center mt-10">
          <a
            href={`https://instagram.com/${instagramHandle.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 h-12 px-10 text-[10px] uppercase tracking-[0.25em] border transition-all duration-500"
            style={{
              borderColor: isEditorial ? '#D5CEC5' : `${tmpl.text}25`,
              color: isEditorial ? '#2B2A28' : tmpl.text,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            <Instagram className="h-4 w-4" />
            Go to Instagram
          </a>
        </div>
      )}
    </section>
  );
}
