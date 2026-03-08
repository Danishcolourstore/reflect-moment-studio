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

/**
 * Dense masonry photo gallery matching the reference site.
 * 3-column layout with alternating tall/medium aspect ratios.
 * Dark gaps, hover zoom, full-bleed feel.
 */
export function WebsitePhotoShowcase({ photos, accent, id, template = 'vows-elegance' }: WebsitePhotoShowcaseProps) {
  if (photos.length === 0) return null;
  const tmpl = getTemplate(template);

  // Split into 3 columns
  const cols = 3;
  const columns: ShowcasePhoto[][] = Array.from({ length: cols }, () => []);
  photos.forEach((p, i) => columns[i % cols].push(p));

  return (
    <section id={id} className="py-4 px-2 sm:px-3" style={{ backgroundColor: tmpl.bg }}>
      {/* Section intro */}
      <div className="max-w-[1600px] mx-auto">
        <div className="flex gap-2 sm:gap-3">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-2 sm:gap-3">
              {col.map((photo, photoIdx) => {
                // Alternate aspect ratios like the reference masonry
                const aspects = ['aspect-[3/4]', 'aspect-[2/3]', 'aspect-[4/5]', 'aspect-[3/5]', 'aspect-[5/7]'];
                const aspect = aspects[(colIdx * 2 + photoIdx) % aspects.length];
                return (
                  <div
                    key={photoIdx}
                    className={`relative overflow-hidden group ${aspect}`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.alt || ''}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.05]"
                      loading="lazy"
                    />
                    {/* Subtle dark overlay on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `linear-gradient(to top, ${tmpl.bg}66 0%, transparent 50%)` }}
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
