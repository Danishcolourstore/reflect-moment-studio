import { type TemplateConfig } from '@/lib/website-templates';

interface NavigationBarProps {
  template: TemplateConfig;
  studioName: string;
  links?: { label: string; href: string }[];
}

export function NavigationBar({ template, studioName, links = [] }: NavigationBarProps) {
  const t = template;
  const variant = t.sections.nav;
  const defaultLinks = links.length > 0 ? links : [
    { label: 'Portfolio', href: '#portfolio' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  if (variant === 'masthead') {
    return (
      <nav
        className="w-full py-6 px-6"
        style={{ backgroundColor: t.colors.navBg }}
      >
        <div className="text-center">
          <div
            className="mb-3"
            style={{
              fontFamily: t.fonts.display,
              fontSize: 16,
              letterSpacing: '0.08em',
              color: t.colors.navText,
              fontWeight: t.fonts.displayWeight,
            }}
          >
            {studioName}
          </div>
          <div className="flex items-center justify-center gap-6">
            {defaultLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="transition-opacity hover:opacity-60"
                style={{
                  fontFamily: t.fonts.ui,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase' as const,
                  color: t.colors.navText,
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  const isTransparent = variant === 'transparent';

  return (
    <nav
      className="w-full flex items-center justify-between px-6 sm:px-10 h-16"
      style={{
        backgroundColor: isTransparent ? 'transparent' : t.colors.navBg,
        borderBottom: isTransparent ? 'none' : `1px solid ${t.colors.border}`,
        position: isTransparent ? 'absolute' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        style={{
          fontFamily: t.id === 'linen' ? t.fonts.ui : t.fonts.display,
          fontSize: t.id === 'alabaster' ? 20 : 18,
          fontWeight: t.fonts.displayWeight,
          fontStyle: t.fonts.displayStyle,
          letterSpacing: t.id === 'linen' ? '0.08em' : '0.02em',
          textTransform: t.id === 'linen' ? 'uppercase' as const : 'none' as const,
          color: isTransparent ? t.colors.heroText : t.colors.navText,
        }}
      >
        {t.id === 'alabaster' ? studioName.split(' ').map(w => w[0]).join('') : studioName}
      </div>

      {/* Links */}
      <div className="hidden sm:flex items-center gap-6">
        {defaultLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="transition-opacity hover:opacity-60"
            style={{
              fontFamily: t.fonts.ui,
              fontSize: t.id === 'alabaster' ? 10 : 12,
              letterSpacing: t.id === 'alabaster' ? '0.2em' : '0.1em',
              textTransform: 'uppercase' as const,
              color: isTransparent ? t.colors.heroText : t.colors.navText,
              textDecoration: 'none',
              fontWeight: t.fonts.uiWeight,
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Book Now (Linen) or separator (Alabaster) */}
      {t.id === 'linen' && (
        <a
          href="#contact"
          className="hidden sm:flex items-center justify-center transition-opacity hover:opacity-70"
          style={{
            fontFamily: t.fonts.ui,
            fontSize: 12,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: t.colors.text,
            border: `1px solid ${t.colors.text}`,
            height: 32,
            padding: '0 20px',
            textDecoration: 'none',
          }}
        >
          Book Now
        </a>
      )}
      {t.id === 'alabaster' && (
        <div className="hidden sm:flex items-center gap-4">
          <div style={{ width: 1, height: 20, backgroundColor: t.colors.border }} />
          <a
            href="#contact"
            className="transition-opacity hover:opacity-60"
            style={{
              fontFamily: t.fonts.ui,
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase' as const,
              color: t.colors.text,
              textDecoration: 'none',
            }}
          >
            Book
          </a>
        </div>
      )}
    </nav>
  );
}
