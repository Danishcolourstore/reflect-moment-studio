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

export function WebsiteFooter({ template, branding, photographerUsername }: WebsiteFooterProps) {
  const t = getTemplate(template);
  if (!branding) return null;

  const year = new Date().getFullYear();
  const accent = branding.studio_accent_color || '#C6A77B';
  const isEditorial = template === 'editorial-luxury';
  const isModernGrid = template === 'modern-photography-grid';

  // ── Modern Photography Grid Footer ──
  if (isModernGrid) {
    const navItems = ['Home', 'About', 'Projects', 'Team', 'Clients', 'Blog', 'Contact'];
    return (
      <footer style={{ backgroundColor: '#1A1A1A', fontFamily: '"DM Sans", sans-serif' }}>
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
            {/* Logo / name */}
            <div>
              {branding.studio_logo_url ? (
                <img src={branding.studio_logo_url} alt="" className="h-8 object-contain brightness-0 invert opacity-80" />
              ) : (
                <span className="text-sm font-semibold tracking-[0.02em]" style={{ color: '#FFFFFF', opacity: 0.9 }}>
                  {branding.studio_name}
                </span>
              )}
            </div>

            {/* Nav links */}
            <nav className="flex flex-wrap items-center justify-center gap-5">
              {navItems.map(link => (
                <a key={link} href={`#${link.toLowerCase()}`}
                  className="text-[10px] uppercase tracking-[0.15em] transition-opacity hover:opacity-100"
                  style={{ color: '#999', opacity: 0.7 }}>
                  {link}
                </a>
              ))}
            </nav>

            {/* Social icons */}
            <div className="flex items-center gap-4">
              {branding.instagram && (
                <a href={`https://instagram.com/${branding.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 opacity-50 transition-opacity">
                  <Instagram className="h-4 w-4" style={{ color: '#FFFFFF' }} />
                </a>
              )}
              {branding.email && (
                <a href={`mailto:${branding.email}`} className="hover:opacity-100 opacity-50 transition-opacity">
                  <Mail className="h-4 w-4" style={{ color: '#FFFFFF' }} />
                </a>
              )}
              {branding.website && (
                <a href={branding.website.startsWith('http') ? branding.website : `https://${branding.website}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 opacity-50 transition-opacity">
                  <Globe className="h-4 w-4" style={{ color: '#FFFFFF' }} />
                </a>
              )}
            </div>
          </div>

          <div className="border-t mt-8 pt-6 text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] tracking-[0.12em]" style={{ color: '#666' }}>
              {branding.footer_text || `© ${branding.studio_name} ${year}. All Rights Reserved.`}
            </p>
            <p className="text-[8px] tracking-[0.12em] mt-2" style={{ color: '#444' }}>
              Powered by MirrorAI
            </p>
          </div>
        </div>
      </footer>
    );
  }

  if (isEditorial) {
    return (
      <footer style={{ backgroundColor: '#2B2A28', fontFamily: '"DM Sans", sans-serif' }}>
        {/* Nav links */}
        <div className="border-t" style={{ borderColor: 'rgba(245,240,234,0.08)' }}>
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10 py-8 px-6">
            {['Home', 'About', 'Gallery', 'Experience', 'Journal', 'Inquire'].map((link) => (
              <a key={link} href={`#${link.toLowerCase()}`}
                className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-light transition-opacity hover:opacity-100"
                style={{ color: '#A09A92', opacity: 0.7 }}>
                {link}
              </a>
            ))}
          </div>
        </div>

        <div className="border-t py-16 px-6 text-center" style={{ borderColor: 'rgba(245,240,234,0.06)' }}>
          <div className="max-w-4xl mx-auto space-y-6">
            {branding.studio_logo_url ? (
              <img src={branding.studio_logo_url} alt="" className="h-14 sm:h-16 mx-auto object-contain opacity-70" />
            ) : (
              <h3
                className="text-2xl sm:text-3xl font-light italic"
                style={{ color: '#F5F0EA', opacity: 0.8, fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                {branding.studio_name}
              </h3>
            )}

            {branding.footer_text && (
              <p className="text-sm font-light italic tracking-wide" style={{ color: '#A09A92', fontFamily: '"Playfair Display", Georgia, serif' }}>
                {branding.footer_text}
              </p>
            )}

            <div className="flex items-center justify-center gap-5 pt-4">
              {branding.instagram && (
                <a href={`https://instagram.com/${branding.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 opacity-50 transition-opacity duration-300">
                  <Instagram className="h-4 w-4" style={{ color: '#F5F0EA' }} />
                </a>
              )}
              <a href="#" className="hover:opacity-100 opacity-50 transition-opacity duration-300">
                <Facebook className="h-4 w-4" style={{ color: '#F5F0EA' }} />
              </a>
              {branding.whatsapp && (
                <a href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 opacity-50 transition-opacity duration-300">
                  <MessageCircle className="h-4 w-4" style={{ color: '#F5F0EA' }} />
                </a>
              )}
              {branding.email && (
                <a href={`mailto:${branding.email}`} className="hover:opacity-100 opacity-50 transition-opacity duration-300">
                  <Mail className="h-4 w-4" style={{ color: '#F5F0EA' }} />
                </a>
              )}
            </div>

            <div className="space-y-2 pt-6">
              <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: '#A09A92', opacity: 0.5 }}>
                © {branding.studio_name.toLowerCase()} {year} — All rights reserved
              </p>
              <p className="text-[8px] tracking-[0.15em] uppercase" style={{ color: '#A09A92', opacity: 0.25 }}>
                Powered by MirrorAI
              </p>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Vows Elegance
  return (
    <footer style={{ backgroundColor: t.footerBg, fontFamily: '"DM Sans", sans-serif' }}>
      <div className="border-t" style={{ borderColor: `${t.text}08` }}>
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10 py-8 px-6">
          {['Home', 'About Us', 'Gallery', 'Services', 'Contact'].map((link) => (
            <a key={link} href={`#${link.toLowerCase().replace(/\s/g, '-')}`}
              className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-light transition-opacity hover:opacity-100"
              style={{ color: t.footerText, opacity: 0.7 }}>
              {link}
            </a>
          ))}
        </div>
      </div>

      <div className="border-t py-16 px-6 text-center" style={{ borderColor: `${t.text}06` }}>
        <div className="max-w-4xl mx-auto space-y-6">
          {branding.studio_logo_url ? (
            <img src={branding.studio_logo_url} alt="" className="h-14 sm:h-16 mx-auto object-contain opacity-70" />
          ) : (
            <h3 className="text-2xl sm:text-3xl font-light uppercase tracking-[0.08em]" style={{ color: t.text, opacity: 0.8, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              {branding.studio_name}
            </h3>
          )}
          {branding.footer_text && (
            <p className="text-sm font-light italic tracking-wide" style={{ color: t.footerText, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              {branding.footer_text}
            </p>
          )}
          {branding.email && <p className="text-[11px] tracking-[0.1em]" style={{ color: t.footerText, opacity: 0.7 }}>Email: {branding.email}</p>}
          {(branding as any).phone && <p className="text-[11px] tracking-[0.1em]" style={{ color: t.footerText, opacity: 0.7 }}>Contact: {(branding as any).phone}</p>}
          <div className="flex items-center justify-center gap-5 pt-4">
            {branding.instagram && (
              <a href={`https://instagram.com/${branding.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 opacity-50 transition-opacity duration-300">
                <Instagram className="h-4 w-4" style={{ color: t.text }} />
              </a>
            )}
            <a href="#" className="hover:opacity-100 opacity-50 transition-opacity duration-300"><Facebook className="h-4 w-4" style={{ color: t.text }} /></a>
            <a href="#" className="hover:opacity-100 opacity-50 transition-opacity duration-300"><Twitter className="h-4 w-4" style={{ color: t.text }} /></a>
            {branding.whatsapp && (
              <a href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 opacity-50 transition-opacity duration-300">
                <MessageCircle className="h-4 w-4" style={{ color: t.text }} />
              </a>
            )}
            {branding.email && (
              <a href={`mailto:${branding.email}`} className="hover:opacity-100 opacity-50 transition-opacity duration-300"><Mail className="h-4 w-4" style={{ color: t.text }} /></a>
            )}
          </div>
          <div className="space-y-2 pt-6">
            <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: t.footerText, opacity: 0.5 }}>© {branding.studio_name.toLowerCase()} {year} — All rights reserved</p>
            <p className="text-[8px] tracking-[0.15em] uppercase" style={{ color: t.footerText, opacity: 0.25 }}>Powered by MirrorAI</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
