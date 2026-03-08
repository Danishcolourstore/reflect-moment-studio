/**
 * Cinematic editorial photo gallery – responsive 3/2/1 column masonry.
 */
interface Props {
  photos: { url: string; alt?: string }[];
  id?: string;
}

export function WebsiteCinematicGallery({ photos, id }: Props) {
  const fontSerif = '"Cormorant Garamond", Georgia, serif';
  const fontSans = '"DM Sans", sans-serif';

  if (photos.length === 0) return null;

  // Split into 3 columns for masonry
  const cols = 3;
  const columns: typeof photos[] = Array.from({ length: cols }, () => []);
  photos.forEach((p, i) => columns[i % cols].push(p));

  return (
    <section id={id} className="py-20 sm:py-32 px-4 sm:px-8" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-20">
          <p
            className="text-[10px] sm:text-xs uppercase tracking-[0.4em] mb-6"
            style={{ color: '#7A756E', fontFamily: fontSans }}
          >
            Gallery
          </p>
          <h2
            className="text-3xl sm:text-5xl lg:text-6xl font-light lowercase tracking-[0.02em]"
            style={{ fontFamily: fontSerif, color: '#1A1715' }}
          >
            captured moments
          </h2>
        </div>

        {/* Desktop: 3 cols, Tablet: 2 cols, Mobile: 1 col */}
        <div className="hidden md:flex gap-3 sm:gap-4">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-3 sm:gap-4">
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
                      style={{ background: 'linear-gradient(to top, rgba(26,23,21,0.3) 0%, transparent 50%)' }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Tablet: 2 cols */}
        <div className="hidden sm:flex md:hidden gap-3">
          {[0, 1].map(colIdx => {
            const colPhotos = photos.filter((_, i) => i % 2 === colIdx);
            return (
              <div key={colIdx} className="flex-1 flex flex-col gap-3">
                {colPhotos.map((photo, i) => (
                  <div key={i} className="relative overflow-hidden group aspect-[3/4]">
                    <img src={photo.url} alt={photo.alt || ''} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Mobile: 1 col */}
        <div className="flex sm:hidden flex-col gap-3">
          {photos.map((photo, i) => (
            <div key={i} className="relative overflow-hidden group aspect-[3/4]">
              <img src={photo.url} alt={photo.alt || ''} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
