import { getTemplate } from '@/lib/website-templates';

interface Props {
  headline: string;
  paragraph: string;
  backgroundImage?: string | null;
  template?: string;
  id?: string;
}

export function WebsiteStorytelling({ headline, paragraph, backgroundImage, template = 'cinematic-wedding-story', id }: Props) {
  const tmpl = getTemplate(template);
  const isCinematic = template === 'cinematic-wedding-story';
  const fontSerif = isCinematic ? '"Cormorant Garamond", Georgia, serif' : tmpl.fontFamily;
  const fontSans = '"DM Sans", sans-serif';

  return (
    <section
      id={id}
      className="relative min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center px-6 sm:px-12"
      style={{ backgroundColor: isCinematic ? '#1A1715' : tmpl.bg }}
    >
      {backgroundImage && (
        <>
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={backgroundImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              style={{ opacity: 0.35 }}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(26,23,21,0.6) 0%, rgba(26,23,21,0.8) 100%)' }}
          />
        </>
      )}

      <div className="relative z-10 max-w-4xl mx-auto text-center py-20 sm:py-28">
        <p
          className="text-[10px] sm:text-xs uppercase tracking-[0.4em] mb-6 sm:mb-8"
          style={{ color: 'rgba(250,248,245,0.5)', fontFamily: fontSans }}
        >
          Memories
        </p>
        <h2
          className="text-3xl sm:text-5xl lg:text-7xl font-light leading-[1.1] tracking-[0.02em]"
          style={{ fontFamily: fontSerif, color: '#FAF8F5' }}
        >
          {headline}
        </h2>
        <div className="mt-8 sm:mt-12 w-16 h-[1px] mx-auto" style={{ backgroundColor: 'rgba(250,248,245,0.2)' }} />
        <p
          className="mt-8 sm:mt-12 text-sm sm:text-base leading-[2] tracking-wide max-w-2xl mx-auto"
          style={{ color: 'rgba(250,248,245,0.7)', fontFamily: fontSans }}
        >
          {paragraph}
        </p>
      </div>
    </section>
  );
}
