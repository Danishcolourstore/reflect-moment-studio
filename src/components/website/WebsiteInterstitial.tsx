import { getTemplate } from '@/lib/website-templates';

interface WebsiteInterstitialProps {
  titleLines: string[];
  subtitle?: string;
  backgroundUrl?: string;
  accent: string;
  id?: string;
  template?: string;
}

/**
 * Full-width dramatic interstitial text section.
 * Matches the "CAPTURED WITH HEART" section from reference.
 * Large serif text, accent-colored first word, dark background.
 */
export function WebsiteInterstitial({ titleLines, subtitle, backgroundUrl, accent, id, template = 'vows-elegance' }: WebsiteInterstitialProps) {
  const tmpl = getTemplate(template);

  return (
    <section
      id={id}
      className="relative py-32 sm:py-44 lg:py-56 px-6 overflow-hidden"
      style={{ backgroundColor: tmpl.bg }}
    >
      {backgroundUrl && (
        <>
          <div className="absolute inset-0">
            <img src={backgroundUrl} alt="" className="h-full w-full object-cover opacity-15" loading="lazy" />
          </div>
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${tmpl.bg} 0%, ${tmpl.bg}99 40%, ${tmpl.bg}99 60%, ${tmpl.bg} 100%)` }} />
        </>
      )}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* "CAPTURED WITH" in accent, "HEART" large */}
        {titleLines.map((line, i) => (
          <h2
            key={i}
            className={`font-light uppercase tracking-[0.08em] leading-[1.15] ${
              i === titleLines.length - 1
                ? 'text-5xl sm:text-7xl lg:text-8xl xl:text-9xl mt-2'
                : 'text-2xl sm:text-3xl lg:text-4xl'
            }`}
            style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              color: i === titleLines.length - 1 ? tmpl.text : accent,
              opacity: i === titleLines.length - 1 ? 1 : 0.85,
            }}
          >
            {line}
          </h2>
        ))}
        {subtitle && (
          <>
            <div className="mt-8 w-16 h-[1px] mx-auto" style={{ backgroundColor: accent, opacity: 0.3 }} />
            <p
              className="mt-6 text-sm sm:text-base tracking-[0.15em] uppercase font-light"
              style={{ color: tmpl.textSecondary, fontFamily: '"DM Sans", sans-serif' }}
            >
              {subtitle}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
