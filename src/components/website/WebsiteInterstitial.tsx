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
 * Inspired by the "CAPTURED WITH HEART" section in the reference design.
 */
export function WebsiteInterstitial({ titleLines, subtitle, backgroundUrl, accent, id, template = 'vows-elegance' }: WebsiteInterstitialProps) {
  const tmpl = getTemplate(template);

  return (
    <section
      id={id}
      className="relative py-28 sm:py-40 px-6 overflow-hidden"
      style={{ backgroundColor: tmpl.bg }}
    >
      {backgroundUrl && (
        <>
          <div className="absolute inset-0">
            <img src={backgroundUrl} alt="" className="h-full w-full object-cover opacity-20" loading="lazy" />
          </div>
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${tmpl.bg} 0%, ${tmpl.bg}88 40%, ${tmpl.bg}88 60%, ${tmpl.bg} 100%)` }} />
        </>
      )}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {titleLines.map((line, i) => (
          <h2
            key={i}
            className="text-3xl sm:text-5xl lg:text-6xl font-light uppercase tracking-[0.08em] leading-[1.2]"
            style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              color: i === 0 ? accent : tmpl.text,
              opacity: i === 0 ? 0.8 : 1,
            }}
          >
            {line}
          </h2>
        ))}
        {subtitle && (
          <p className="mt-6 text-sm sm:text-base tracking-[0.12em] uppercase" style={{ color: tmpl.textSecondary, fontFamily: tmpl.uiFontFamily }}>
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
