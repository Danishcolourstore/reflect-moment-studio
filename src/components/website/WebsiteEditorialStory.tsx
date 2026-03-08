import { getTemplate } from '@/lib/website-templates';

interface WebsiteEditorialStoryProps {
  heading: string;
  paragraph: string;
  ctaLabel?: string;
  ctaUrl?: string;
  images: string[];
  accent?: string;
  id?: string;
  template?: string;
}

/**
 * Editorial magazine-style story section.
 * Left: large heading + paragraph + CTA.
 * Right: stacked editorial images.
 */
export function WebsiteEditorialStory({
  heading,
  paragraph,
  ctaLabel = 'Begin Your Legacy',
  ctaUrl = '#contact',
  images,
  accent = '#8B7355',
  id,
  template = 'editorial-luxury',
}: WebsiteEditorialStoryProps) {
  const tmpl = getTemplate(template);
  const isEditorial = template === 'editorial-luxury';
  const textColor = isEditorial ? '#2B2A28' : tmpl.text;
  const secondaryColor = isEditorial ? '#6B6560' : tmpl.textSecondary;
  const bgColor = isEditorial ? '#F5F0EA' : tmpl.bg;

  return (
    <section id={id} className="py-20 sm:py-32 px-6 sm:px-12" style={{ backgroundColor: bgColor }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        {/* Left - Text */}
        <div className="space-y-8">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light leading-[1.15] italic"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', color: textColor }}
          >
            {heading}
          </h2>
          <p
            className="text-sm sm:text-base leading-[2] tracking-wide max-w-lg"
            style={{ color: secondaryColor, fontFamily: '"DM Sans", sans-serif' }}
          >
            {paragraph}
          </p>
          {ctaLabel && (
            <a href={ctaUrl} className="inline-block">
              <button
                className="h-12 sm:h-14 px-10 sm:px-14 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] border transition-all duration-500 hover:bg-[#2B2A28] hover:text-[#F5F0EA]"
                style={{ borderColor: textColor, color: textColor, backgroundColor: 'transparent' }}
              >
                {ctaLabel}
              </button>
            </a>
          )}
        </div>

        {/* Right - Stacked editorial images */}
        <div className="space-y-4 sm:space-y-6">
          {images.slice(0, 3).map((url, i) => (
            <div
              key={i}
              className={`overflow-hidden ${
                i === 0 ? 'aspect-[4/3]' : i === 1 ? 'aspect-[3/2]' : 'aspect-[16/9]'
              }`}
            >
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
