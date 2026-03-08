import { getTemplate } from '@/lib/website-templates';

interface ShowcasePhoto {
  url: string;
  alt?: string;
}

interface WebsitePhotoShowcaseProps {
  photos: ShowcasePhoto[];
  accent: string;
  id?: string;
  template?: string;
}

export function WebsitePhotoShowcase({ photos, accent, id, template = 'vows-elegance' }: WebsitePhotoShowcaseProps) {
  if (photos.length === 0) return null;
  const tmpl = getTemplate(template);
  const isEditorial = template === 'editorial-luxury';

  const cols = 3;
  const columns: ShowcasePhoto[][] = Array.from({ length: cols }, () => []);
  photos.forEach((p, i) => columns[i % cols].push(p));

  return (
    <section
      id={id}
      className={isEditorial ? 'py-8 px-4 sm:px-8' : 'py-4 px-2 sm:px-3'}
      style={{ backgroundColor: isEditorial ? '#F5F0EA' : tmpl.bg }}
    >
      {isEditorial && (
        <div className="text-center mb-12">
          <p
            className="text-[10px] sm:text-xs uppercase tracking-[0.4em] mb-4"
            style={{ color: accent, fontFamily: '"DM Sans", sans-serif' }}
          >
            Portfolio
          </p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-light"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#2B2A28' }}
          >
            Featured Work
          </h2>
        </div>
      )}

      <div className={isEditorial ? 'max-w-6xl mx-auto' : 'max-w-[1600px] mx-auto'}>
        <div className={`flex ${isEditorial ? 'gap-3 sm:gap-4' : 'gap-2 sm:gap-3'}`}>
          {columns.map((col, colIdx) => (
            <div key={colIdx} className={`flex-1 flex flex-col ${isEditorial ? 'gap-3 sm:gap-4' : 'gap-2 sm:gap-3'}`}>
              {col.map((photo, photoIdx) => {
                const aspects = ['aspect-[3/4]', 'aspect-[2/3]', 'aspect-[4/5]', 'aspect-[3/5]', 'aspect-[5/7]'];
                const aspect = aspects[(colIdx * 2 + photoIdx) % aspects.length];
                return (
                  <div key={photoIdx} className={`relative overflow-hidden group ${aspect}`}>
                    <img
                      src={photo.url}
                      alt={photo.alt || ''}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.05]"
                      loading="lazy"
                    />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: isEditorial
                          ? 'linear-gradient(to top, rgba(43,42,40,0.3) 0%, transparent 50%)'
                          : `linear-gradient(to top, ${tmpl.bg}66 0%, transparent 50%)`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
