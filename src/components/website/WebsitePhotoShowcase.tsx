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
 * Full-bleed masonry photo showcase inspired by the Vows Elegance reference.
 * Renders a dense, immersive photo wall with alternating tall/wide images.
 */
export function WebsitePhotoShowcase({ photos, accent, id, template = 'vows-elegance' }: WebsitePhotoShowcaseProps) {
  if (photos.length === 0) return null;
  const tmpl = getTemplate(template);

  // Split photos into columns for masonry effect
  const cols = 3;
  const columns: ShowcasePhoto[][] = Array.from({ length: cols }, () => []);
  photos.forEach((p, i) => columns[i % cols].push(p));

  return (
    <section id={id} className="py-2 px-1 sm:px-2" style={{ backgroundColor: tmpl.bg }}>
      <div className="max-w-[1600px] mx-auto flex gap-1 sm:gap-1.5">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="flex-1 flex flex-col gap-1 sm:gap-1.5">
            {col.map((photo, photoIdx) => {
              // Vary aspect ratios for visual interest
              const aspectVariants = ['aspect-[3/4]', 'aspect-[2/3]', 'aspect-[4/5]', 'aspect-[3/5]'];
              const aspect = aspectVariants[(colIdx + photoIdx) % aspectVariants.length];
              return (
                <div
                  key={photoIdx}
                  className={`relative overflow-hidden group ${aspect}`}
                >
                  <img
                    src={photo.url}
                    alt={photo.alt || ''}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(to top, ${tmpl.bg}88 0%, transparent 50%)` }}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
