import { type TemplateConfig } from '@/lib/website-templates';

interface FooterSectionProps {
  template: TemplateConfig;
  studioName: string;
}

export function FooterSection({ template, studioName }: FooterSectionProps) {
  const t = template;
  const variant = t.sections.footer;

  /* ── Centered (Reverie, Heirloom) ── */
  if (variant === 'centered') {
    return (
      <footer className="py-12 px-6 text-center" style={{ backgroundColor: t.colors.footerBg }}>
        {t.id === 'heirloom' && (
          <span className="block mb-4" style={{ fontFamily: t.fonts.display, fontSize: 16, color: t.colors.accent }}>✦</span>
        )}
        <p style={{
          fontFamily: t.fonts.display,
          fontSize: t.id === 'heirloom' ? 16 : 18,
          fontWeight: t.fonts.displayWeight,
          fontStyle: t.fonts.displayStyle,
          color: t.colors.footerText,
          letterSpacing: t.id === 'heirloom' ? '0.08em' : undefined,
        }}>
          {studioName}
        </p>
        {/* Social icons placeholder */}
        <div className="flex items-center justify-center gap-4 mt-4">
          {['Instagram', 'Pinterest', 'Facebook'].map((s) => (
            <span key={s} style={{ fontFamily: t.fonts.ui, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: t.colors.footerSecondary }}>
              {s}
            </span>
          ))}
        </div>
        <p className="mt-6" style={{ fontFamily: t.fonts.ui, fontSize: 10, color: t.colors.footerSecondary }}>
          Delivered by MirrorAI
        </p>
      </footer>
    );
  }

  /* ── Two Column (Linen) ── */
  if (variant === 'two-col') {
    return (
      <footer className="py-10 px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between" style={{ backgroundColor: t.colors.footerBg }}>
        <p style={{
          fontFamily: t.fonts.ui,
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: t.colors.footerText,
        }}>
          {studioName}
        </p>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          {['Portfolio', 'About', 'Contact'].map((link) => (
            <a key={link} href={`#${link.toLowerCase()}`} style={{
              fontFamily: t.fonts.ui,
              fontSize: 11,
              color: t.colors.footerSecondary,
              textDecoration: 'none',
            }}>
              {link}
            </a>
          ))}
        </div>
      </footer>
    );
  }

  /* ── Dark Bar (Vesper, Alabaster) ── */
  return (
    <footer className="py-12 px-6 text-center" style={{ backgroundColor: t.colors.footerBg }}>
      <p style={{
        fontFamily: t.fonts.display,
        fontSize: t.id === 'alabaster' ? 16 : 22,
        fontWeight: t.fonts.displayWeight,
        fontStyle: t.fonts.displayStyle,
        color: t.colors.footerText,
      }}>
        {studioName}
      </p>
      <div className="flex items-center justify-center gap-4 mt-4">
        {['Instagram', 'Pinterest'].map((s) => (
          <span key={s} style={{ fontFamily: t.fonts.ui, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: t.colors.footerSecondary }}>
            {s}
          </span>
        ))}
      </div>
      <p className="mt-6" style={{ fontFamily: t.fonts.ui, fontSize: 10, color: t.colors.footerSecondary }}>
        Delivered by MirrorAI
      </p>
    </footer>
  );
}
