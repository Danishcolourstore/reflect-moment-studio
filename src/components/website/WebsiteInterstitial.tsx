import { getTemplate } from '@/lib/website-templates';

interface WebsiteInterstitialProps {
  titleLines: string[];
  subtitle?: string;
  backgroundUrl?: string;
  accent: string;
  id?: string;
  template?: string;
}

export function WebsiteInterstitial({ titleLines, subtitle, backgroundUrl, accent, id, template = 'vows-elegance' }: WebsiteInterstitialProps) {
  const tmpl = getTemplate(template);
  const isEditorial = template === 'editorial-luxury';

  return (
    <section
      id={id}
      className="relative py-32 sm:py-44 lg:py-56 px-6 overflow-hidden"
      style={{ backgroundColor: isEditorial ? '#EFEBE5' : tmpl.bg }}
    >
      {backgroundUrl && (
        <>
          <div className="absolute inset-0">
            <img src={backgroundUrl} alt="" className="h-full w-full object-cover opacity-15" loading="lazy" />
          </div>
          <div className="absolute inset-0" style={{ background: isEditorial
            ? 'linear-gradient(180deg, #EFEBE5 0%, #EFEBE5CC 40%, #EFEBE5CC 60%, #EFEBE5 100%)'
            : `linear-gradient(180deg, ${tmpl.bg} 0%, ${tmpl.bg}99 40%, ${tmpl.bg}99 60%, ${tmpl.bg} 100%)`
          }} />
        </>
      )}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {titleLines.map((line, i) => (
          <h2
            key={i}
            className={`font-light tracking-[0.04em] leading-[1.15] ${
              i === titleLines.length - 1
                ? 'text-5xl sm:text-7xl lg:text-8xl xl:text-9xl mt-2'
                : 'text-2xl sm:text-3xl lg:text-4xl'
            } ${isEditorial && i === titleLines.length - 1 ? 'italic' : isEditorial ? '' : 'uppercase'}`}
            style={{
              fontFamily: isEditorial ? '"Playfair Display", Georgia, serif' : '"Cormorant Garamond", Georgia, serif',
              color: i === titleLines.length - 1
                ? (isEditorial ? '#2B2A28' : tmpl.text)
                : accent,
              opacity: i === titleLines.length - 1 ? 1 : 0.85,
            }}
          >
            {line}
          </h2>
        ))}
        {subtitle && (
          <>
            <div className="mt-8 w-16 h-[1px] mx-auto" style={{ backgroundColor: isEditorial ? '#D5CEC5' : accent, opacity: 0.3 }} />
            <p
              className="mt-6 text-sm sm:text-base tracking-[0.15em] uppercase font-light"
              style={{ color: isEditorial ? '#6B6560' : tmpl.textSecondary, fontFamily: '"DM Sans", sans-serif' }}
            >
              {subtitle}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
