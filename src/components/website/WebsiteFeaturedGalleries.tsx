import { getTemplate } from '@/lib/website-templates';

export interface FeaturedGalleryItem {
  title: string;
  location: string;
  imageUrl: string;
}

interface Props {
  galleries: FeaturedGalleryItem[];
  template?: string;
  id?: string;
}

export function WebsiteFeaturedGalleries({ galleries, template = 'cinematic-wedding-story', id }: Props) {
  const tmpl = getTemplate(template);
  const isCinematic = template === 'cinematic-wedding-story';
  const bg = isCinematic ? '#FAF8F5' : tmpl.bg;
  const textColor = isCinematic ? '#1A1715' : tmpl.text;
  const secondaryColor = isCinematic ? '#7A756E' : tmpl.textSecondary;
  const fontSerif = isCinematic ? '"Cormorant Garamond", Georgia, serif' : tmpl.fontFamily;
  const fontSans = '"DM Sans", sans-serif';

  if (galleries.length === 0) return null;

  return (
    <section id={id} className="py-20 sm:py-32 px-6 sm:px-12" style={{ backgroundColor: bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-20">
          <h2
            className="text-3xl sm:text-5xl lg:text-6xl font-light lowercase tracking-[0.02em]"
            style={{ fontFamily: fontSerif, color: textColor }}
          >
            featured galleries
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {galleries.map((g, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="relative overflow-hidden aspect-[4/5] sm:aspect-[3/4]">
                {g.imageUrl ? (
                  <img
                    src={g.imageUrl}
                    alt={g.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#EDE9E3' }}>
                    <span className="text-sm" style={{ color: '#CCC' }}>Upload image</span>
                  </div>
                )}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ background: 'linear-gradient(to top, rgba(26,23,21,0.4) 0%, transparent 50%)' }}
                />
              </div>
              <div className="mt-4 sm:mt-5 text-center">
                <h3
                  className="text-sm sm:text-base font-semibold uppercase tracking-[0.2em]"
                  style={{ color: textColor, fontFamily: fontSans }}
                >
                  {g.title}
                </h3>
                {g.location && (
                  <p
                    className="text-[10px] sm:text-xs mt-1 tracking-[0.1em]"
                    style={{ color: secondaryColor, fontFamily: fontSans }}
                  >
                    {g.location}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
