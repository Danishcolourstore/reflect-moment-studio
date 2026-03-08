import { getTemplate } from '@/lib/website-templates';

export interface ProcessBlock {
  title: string;
  description: string;
  imageUrl?: string;
}

interface Props {
  title: string;
  blocks: ProcessBlock[];
  template?: string;
  id?: string;
}

export function WebsiteProcessSection({ title, blocks, template = 'cinematic-wedding-story', id }: Props) {
  const tmpl = getTemplate(template);
  const isCinematic = template === 'cinematic-wedding-story';
  const bg = isCinematic ? '#FAF8F5' : tmpl.bg;
  const textColor = isCinematic ? '#1A1715' : tmpl.text;
  const secondaryColor = isCinematic ? '#7A756E' : tmpl.textSecondary;
  const fontSerif = isCinematic ? '"Cormorant Garamond", Georgia, serif' : tmpl.fontFamily;
  const fontSans = '"DM Sans", sans-serif';

  if (blocks.length === 0) return null;

  return (
    <section id={id} className="py-20 sm:py-32 px-6 sm:px-12" style={{ backgroundColor: bg }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 sm:mb-20">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-light italic"
            style={{ fontFamily: fontSerif, color: textColor }}
          >
            {title}
          </h2>
        </div>

        <div className="space-y-20 sm:space-y-28">
          {blocks.map((block, i) => {
            const isReversed = i % 2 === 1;
            return (
              <div
                key={i}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${isReversed ? '' : ''}`}
              >
                <div className={isReversed ? 'lg:order-2' : ''}>
                  {block.imageUrl ? (
                    <div className="overflow-hidden aspect-[4/5]">
                      <img
                        src={block.imageUrl}
                        alt={block.title}
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/5] flex items-center justify-center" style={{ backgroundColor: '#EDE9E3' }}>
                      <span className="text-sm" style={{ color: '#CCC' }}>Upload image</span>
                    </div>
                  )}
                </div>
                <div className={`space-y-6 ${isReversed ? 'lg:order-1' : ''}`}>
                  <p
                    className="text-[10px] uppercase tracking-[0.3em]"
                    style={{ color: secondaryColor, fontFamily: fontSans }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3
                    className="text-2xl sm:text-3xl font-light"
                    style={{ fontFamily: fontSerif, color: textColor }}
                  >
                    {block.title}
                  </h3>
                  <p
                    className="text-sm sm:text-base leading-[2] tracking-wide"
                    style={{ color: secondaryColor, fontFamily: fontSans }}
                  >
                    {block.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
