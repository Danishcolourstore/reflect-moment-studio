import { getTemplate } from '@/lib/website-templates';
import { Instagram, Globe, MessageCircle, Mail, Twitter, Facebook } from 'lucide-react';

interface StudioBranding {
  studio_name: string;
  studio_logo_url: string | null;
  studio_accent_color: string | null;
  instagram?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  footer_text?: string | null;
  phone?: string | null;
}

interface WebsiteFooterProps {
  template: string;
  branding: StudioBranding | null;
  photographerUsername?: string | null;
}

/**
 * Footer matching the reference site:
 * Navigation links row, logo/studio name, tagline, social icons, copyright.
 * Dark background with warm muted text.
 */
export function WebsiteFooter({ template, branding, photographerUsername }: WebsiteFooterProps) {
  const t = getTemplate(template);
  if (!branding) return null;

  const year = new Date().getFullYear();
  const accent = branding.studio_accent_color || '#C6A77B';

  return (
    <footer style={{ backgroundColor: t.footerBg, fontFamily: '"DM Sans", sans-serif' }}>
      {/* Navigation links */}
      <div className="border-t" style={{ borderColor: `${t.text}08` }}>
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10 py-8 px-6">
          {['Home', 'About Us', 'Gallery', 'Services', 'Contact'].map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s/g, '-')}`}
              className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-light transition-opacity hover:opacity-100"
              style={{ color: t.footerText, opacity: 0.7 }}
            >
              {link}
            </a>
          ))}
        </div>
      </div>

      {/* Main footer content */}
      <div className="border-t py-16 px-6 text-center" style={{ borderColor: `${t.text}06` }}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Logo or studio name */}
          {branding.studio_logo_url ? (
            <img src={branding.studio_logo_url} alt="" className="h-14 sm:h-16 mx-auto object-contain opacity-70" />
          ) : (
            <h3
              className="text-2xl sm:text-3xl font-light uppercase tracking-[0.08em]"
              style={{ color: t.text, opacity: 0.8, fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              {branding.studio_name}
            </h3>
          )}

          {/* Footer tagline */}
          {branding.footer_text && (
            <p
              className="text-sm font-light italic tracking-wide"
              style={{ color: t.footerText, fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              {branding.footer_text}
            </p>
          )}

          {/* Contact info */}
          {branding.email && (
            <p className="text-[11px] tracking-[0.1em]" style={{ color: t.footerText, opacity: 0.7 }}>
              Email: {branding.email}
            </p>
          )}
          {(branding as any).phone && (
            <p className="text-[11px] tracking-[0.1em]" style={{ color: t.footerText, opacity: 0.7 }}>
              Contact: {(branding as any).phone}
            </p>
          )}

          {/* Social icons */}
          <div className="flex items-center justify-center gap-5 pt-4">
            {branding.instagram && (
              <a
                href={`https://instagram.com/${branding.instagram.replace('@', '')}`}
                target="_blank" rel="noopener noreferrer"
                className="hover:opacity-100 opacity-50 transition-opacity duration-300"
              >
                <Instagram className="h-4 w-4" style={{ color: t.text }} />
              </a>
            )}
            <a href="#" className="hover:opacity-100 opacity-50 transition-opacity duration-300">
              <Facebook className="h-4 w-4" style={{ color: t.text }} />
            </a>
            <a href="#" className="hover:opacity-100 opacity-50 transition-opacity duration-300">
              <Twitter className="h-4 w-4" style={{ color: t.text }} />
            </a>
            {branding.whatsapp && (
              <a
                href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="hover:opacity-100 opacity-50 transition-opacity duration-300"
              >
                <MessageCircle className="h-4 w-4" style={{ color: t.text }} />
              </a>
            )}
            {branding.email && (
              <a href={`mailto:${branding.email}`} className="hover:opacity-100 opacity-50 transition-opacity duration-300">
                <Mail className="h-4 w-4" style={{ color: t.text }} />
              </a>
            )}
          </div>

          {/* Copyright */}
          <div className="space-y-2 pt-6">
            <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: t.footerText, opacity: 0.5 }}>
              © {branding.studio_name.toLowerCase()} {year} — All rights reserved
            </p>
            <p className="text-[8px] tracking-[0.15em] uppercase" style={{ color: t.footerText, opacity: 0.25 }}>
              Powered by MirrorAI
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
