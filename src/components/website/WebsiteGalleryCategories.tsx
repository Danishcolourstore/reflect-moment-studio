import { getTemplate } from '@/lib/website-templates';

interface GalleryCategory {
  number: string;
  title: string;
  imageUrl?: string;
}

interface WebsiteGalleryCategoriesProps {
  categories: GalleryCategory[];
  accent?: string;
  id?: string;
  template?: string;
  onNavigate?: (title: string) => void;
}

/**
 * Editorial "THE GALLERY" section with large serif category titles,
 * thin divider lines, and small preview thumbnails.
 */
export function WebsiteGalleryCategories({
  categories,
  accent = '#8B7355',
  id,
  template = 'editorial-luxury',
  onNavigate,
}: WebsiteGalleryCategoriesProps) {
  const tmpl = getTemplate(template);
  const isEditorial = template === 'editorial-luxury';

  return (
    <section
      id={id}
      className="py-24 sm:py-36 px-6 sm:px-12"
      style={{ backgroundColor: isEditorial ? '#F5F0EA' : tmpl.bg }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Section title */}
        <div className="text-center mb-20">
          <p
            className="text-[10px] sm:text-xs uppercase tracking-[0.4em] mb-4"
            style={{ color: accent, fontFamily: '"DM Sans", sans-serif' }}
          >
            Explore
          </p>
          <h2
            className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-[0.04em]"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              color: isEditorial ? '#2B2A28' : tmpl.text,
            }}
          >
            The Gallery
          </h2>
        </div>

        {/* Category list */}
        <div className="space-y-0">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate?.(cat.title)}
              className="group w-full text-left"
            >
              {/* Top divider */}
              <div
                className="h-[1px] w-full"
                style={{ backgroundColor: isEditorial ? '#D5CEC5' : `${tmpl.text}15` }}
              />
              <div className="flex items-center justify-between py-8 sm:py-12 gap-6">
                {/* Left: number + title */}
                <div className="flex items-baseline gap-6 sm:gap-10">
                  <span
                    className="text-sm sm:text-base font-light italic"
                    style={{
                      color: accent,
                      fontFamily: '"Playfair Display", Georgia, serif',
                    }}
                  >
                    {cat.number}
                  </span>
                  <h3
                    className="text-2xl sm:text-4xl lg:text-5xl font-light tracking-[0.02em] transition-all duration-500 group-hover:tracking-[0.06em]"
                    style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      color: isEditorial ? '#2B2A28' : tmpl.text,
                    }}
                  >
                    {cat.title}
                  </h3>
                </div>

                {/* Right: small preview image */}
                {cat.imageUrl && (
                  <div className="hidden sm:block w-20 h-28 rounded overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500 shrink-0">
                    <img
                      src={cat.imageUrl}
                      alt={cat.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
              {/* Bottom divider for last item */}
              {idx === categories.length - 1 && (
                <div
                  className="h-[1px] w-full"
                  style={{ backgroundColor: isEditorial ? '#D5CEC5' : `${tmpl.text}15` }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
