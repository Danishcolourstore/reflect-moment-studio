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

/* Template design tokens */
const TEMPLATE_STYLES: Record<string, { bg: string; labelColor: string; labelFont: string; headingColor: string; headingFont: string; heading: string; gap: string; maxW: string; pad: string }> = {
  'clean-minimal': { bg: '#FFFFFF', labelColor: '#999', labelFont: '"Inter", sans-serif', headingColor: '#1A1A1A', headingFont: '"Playfair Display", Georgia, serif', heading: 'Portfolio', gap: 'gap-3 sm:gap-4', maxW: 'max-w-6xl', pad: 'py-12 px-4 sm:px-8' },
  'magazine-editorial': { bg: '#0F0F0F', labelColor: 'rgba(237,237,237,0.35)', labelFont: '"Syne", sans-serif', headingColor: '#EDEDED', headingFont: '"Bodoni Moda", "Didot", serif', heading: 'Selected Work', gap: 'gap-2 sm:gap-3', maxW: 'max-w-[1600px]', pad: 'py-8 px-2 sm:px-4' },
  'warm-organic': { bg: '#FAF6F1', labelColor: '#8B7D6B', labelFont: '"Nunito Sans", sans-serif', headingColor: '#3D3228', headingFont: '"Lora", Georgia, serif', heading: 'Portfolio', gap: 'gap-3 sm:gap-5', maxW: 'max-w-6xl', pad: 'py-14 px-4 sm:px-8' },
  'bold-portfolio': { bg: '#0A0A0A', labelColor: '#888', labelFont: '"Space Grotesk", sans-serif', headingColor: '#F0F0F0', headingFont: '"Bebas Neue", Impact, sans-serif', heading: 'WORK', gap: 'gap-2 sm:gap-3', maxW: 'max-w-[1600px]', pad: 'py-8 px-2 sm:px-3' },
  'elegant-folio': { bg: '#FDFBF8', labelColor: '#78716C', labelFont: '"Outfit", sans-serif', headingColor: '#1C1917', headingFont: '"Cormorant Garamond", Georgia, serif', heading: 'Portfolio', gap: 'gap-3 sm:gap-5', maxW: 'max-w-6xl', pad: 'py-14 px-4 sm:px-8' },
  'starter-one': { bg: '#FFFFFF', labelColor: '#6B7280', labelFont: '"Inter", system-ui, sans-serif', headingColor: '#111111', headingFont: '"Inter", system-ui, sans-serif', heading: 'Work', gap: 'gap-2 sm:gap-3', maxW: 'max-w-5xl', pad: 'py-12 px-4 sm:px-6' },
  'noir-starter': { bg: '#0D0D0D', labelColor: '#7A756E', labelFont: '"Manrope", sans-serif', headingColor: '#E8E4DF', headingFont: '"Prata", Georgia, serif', heading: 'Portfolio', gap: 'gap-2 sm:gap-3', maxW: 'max-w-[1600px]', pad: 'py-8 px-2 sm:px-3' },
  'editorial-luxury': { bg: '#F5F0EA', labelColor: '', labelFont: '"DM Sans", sans-serif', headingColor: '#2B2A28', headingFont: '"Playfair Display", Georgia, serif', heading: 'Featured Work', gap: 'gap-3 sm:gap-4', maxW: 'max-w-6xl', pad: 'py-8 px-4 sm:px-8' },
};

const LIGHT_TEMPLATES = ['clean-minimal', 'warm-organic', 'elegant-folio', 'starter-one', 'editorial-luxury'];
const DARK_TEMPLATES = ['magazine-editorial', 'bold-portfolio', 'noir-starter'];

export function WebsitePhotoShowcase({ photos, accent, id, template = 'vows-elegance' }: WebsitePhotoShowcaseProps) {
  if (photos.length === 0) return null;
  const tmpl = getTemplate(template);
  const style = TEMPLATE_STYLES[template];

  const cols = template === 'starter-one' ? 2 : 3;
  const columns: ShowcasePhoto[][] = Array.from({ length: cols }, () => []);
  photos.forEach((p, i) => columns[i % cols].push(p));

  const isLight = LIGHT_TEMPLATES.includes(template);
  const isDark = DARK_TEMPLATES.includes(template);

  // Use template-specific styles if available
  if (style) {
    const showHeading = template !== 'bold-portfolio'; // bold uses inline heading style
    return (
      <section id={id} className={style.pad} style={{ backgroundColor: style.bg }}>
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-3" style={{ color: style.labelColor || accent, fontFamily: style.labelFont }}>
            {showHeading ? '' : 'Selected'}
          </p>
          <h2
            className={`font-light ${template === 'bold-portfolio' ? 'text-4xl sm:text-6xl uppercase' : template === 'starter-one' ? 'text-2xl sm:text-3xl font-bold' : 'text-3xl sm:text-4xl lg:text-5xl'}`}
            style={{ fontFamily: style.headingFont, color: style.headingColor }}
          >
            {style.heading}
          </h2>
        </div>

        <div className={style.maxW + ' mx-auto'}>
          <div className={`flex ${style.gap}`}>
            {columns.map((col, colIdx) => (
              <div key={colIdx} className={`flex-1 flex flex-col ${style.gap}`}>
                {col.map((photo, photoIdx) => {
                  const aspects = ['aspect-[3/4]', 'aspect-[2/3]', 'aspect-[4/5]', 'aspect-[3/5]', 'aspect-[5/7]'];
                  const aspect = aspects[(colIdx * 2 + photoIdx) % aspects.length];
                  return (
                    <div key={photoIdx} className={`relative overflow-hidden group ${aspect} ${template === 'starter-one' ? 'rounded-lg' : template === 'warm-organic' ? 'rounded-md' : ''}`}>
                      <img
                        src={photo.url}
                        alt={photo.alt || ''}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.05]"
                        loading="lazy"
                      />
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background: isDark
                            ? 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)'
                            : `linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 50%)`,
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

  // ── Default (Vows Elegance) ──
  return (
    <section id={id} className="py-4 px-2 sm:px-3" style={{ backgroundColor: tmpl.bg }}>
      <div className="max-w-[1600px] mx-auto">
        <div className="flex gap-2 sm:gap-3">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-2 sm:gap-3">
              {col.map((photo, photoIdx) => {
                const aspects = ['aspect-[3/4]', 'aspect-[2/3]', 'aspect-[4/5]', 'aspect-[3/5]', 'aspect-[5/7]'];
                const aspect = aspects[(colIdx * 2 + photoIdx) % aspects.length];
                return (
                  <div key={photoIdx} className={`relative overflow-hidden group ${aspect}`}>
                    <img src={photo.url} alt={photo.alt || ''} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.05]" loading="lazy" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(to top, ${tmpl.bg}66 0%, transparent 50%)` }} />
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