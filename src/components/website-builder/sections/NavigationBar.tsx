import { useState } from 'react';
import { type TemplateConfig } from '@/lib/website-templates';
import { Menu, X } from 'lucide-react';

interface NavigationBarProps {
  template: TemplateConfig;
  studioName: string;
  links?: { label: string; href: string }[];
}

export function NavigationBar({ template, studioName, links = [] }: NavigationBarProps) {
  const t = template;
  const variant = t.sections.nav;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const defaultLinks = links.length > 0 ? links : [
    { label: 'Portfolio', href: '#portfolio' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  if (variant === 'masthead') {
    return (
      <nav className="w-full py-6 px-6" style={{ backgroundColor: t.colors.navBg }}>
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
          {/* Desktop links */}
          <div className="hidden sm:flex items-center justify-center gap-6">
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
          {/* Mobile hamburger */}
          <div className="sm:hidden flex justify-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center"
              style={{ minWidth: 44, minHeight: 44, background: 'none', border: 'none', color: t.colors.navText }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="sm:hidden flex flex-col items-center gap-4 mt-4 pb-2">
              {defaultLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontFamily: t.fonts.ui,
                    fontSize: 12,
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
          )}
        </div>
      </nav>
    );
  }

  const isTransparent = variant === 'transparent';

  return (
    <nav
      className="w-full flex items-center justify-between px-4 sm:px-10"
      style={{
        minHeight: 56,
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
          fontSize: t.id === 'alabaster' ? 20 : 'clamp(16px, 3vw, 18px)',
          fontWeight: t.fonts.displayWeight,
          fontStyle: t.fonts.displayStyle,
          letterSpacing: t.id === 'linen' ? '0.08em' : '0.02em',
          textTransform: t.id === 'linen' ? 'uppercase' as const : 'none' as const,
          color: isTransparent ? t.colors.heroText : t.colors.navText,
        }}
      >
        {t.id === 'alabaster' ? studioName.split(' ').map(w => w[0]).join('') : studioName}
      </div>

      {/* Desktop Links */}
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

      {/* Mobile hamburger */}
      <button
        className="sm:hidden flex items-center justify-center"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{
          minWidth: 44,
          minHeight: 44,
          background: 'none',
          border: 'none',
          color: isTransparent ? t.colors.heroText : t.colors.navText,
        }}
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Book Now (Linen) — desktop only */}
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

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="sm:hidden fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8"
          style={{
            backgroundColor: isTransparent ? 'rgba(0,0,0,0.85)' : t.colors.navBg,
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 flex items-center justify-center"
            style={{
              minWidth: 44,
              minHeight: 44,
              background: 'none',
              border: 'none',
              color: isTransparent ? 'white' : t.colors.navText,
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>

          {defaultLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="transition-opacity hover:opacity-60"
              style={{
                fontFamily: t.fonts.display,
                fontSize: 28,
                fontWeight: t.fonts.displayWeight,
                fontStyle: t.fonts.displayStyle,
                color: isTransparent ? 'white' : t.colors.navText,
                textDecoration: 'none',
              }}
            >
              {link.label}
            </a>
          ))}

          {(t.id === 'linen' || t.id === 'alabaster') && (
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontFamily: t.fonts.ui,
                fontSize: 12,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: isTransparent ? 'white' : t.colors.text,
                border: `1px solid ${isTransparent ? 'rgba(255,255,255,0.3)' : t.colors.border}`,
                padding: '12px 28px',
                textDecoration: 'none',
                marginTop: 8,
              }}
            >
              Book Now
            </a>
          )}
        </div>
      )}
    </nav>
  );
}
