import { getTemplate } from '@/lib/website-templates';
import { Instagram, Globe, MessageCircle, Mail, Facebook } from 'lucide-react';

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

/* Social icons helper */
function SocialIcons({ branding, color }: { branding: StudioBranding; color: string }) {
  return (
    <div className="flex items-center justify-center gap-5 pt-4">
      {branding.instagram && (
        <a href={`https://instagram.com/${branding.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 opacity-50 transition-opacity">
          <Instagram className="h-4 w-4" style={{ color }} />
        </a>
      )}
      {branding.email && (
        <a href={`mailto:${branding.email}`} className="hover:opacity-100 opacity-50 transition-opacity">
          <Mail className="h-4 w-4" style={{ color }} />
        </a>
      )}
      {branding.website && (
        <a href={branding.website.startsWith('http') ? branding.website : `https://${branding.website}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 opacity-50 transition-opacity">
          <Globe className="h-4 w-4" style={{ color }} />
        </a>
      )}
      {branding.whatsapp && (
        <a href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 opacity-50 transition-opacity">
          <MessageCircle className="h-4 w-4" style={{ color }} />
        </a>
      )}
    </div>
  );
}

/* Template footer configs */
interface FooterConfig {
  bg: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  poweredColor: string;
  headingFont: string;
  bodyFont: string;
  navItems: string[];
  iconColor: string;
}

const FOOTER_CONFIGS: Record<string, FooterConfig> = {
  'clean-minimal': { bg: '#FFFFFF', borderColor: 'rgba(0,0,0,0.06)', textColor: '#1A1A1A', mutedColor: '#999', poweredColor: '#CCC', headingFont: '"Playfair Display", Georgia, serif', bodyFont: '"Inter", sans-serif', navItems: ['Home', 'Portfolio', 'About', 'Journal', 'Contact'], iconColor: '#1A1A1A' },
  'magazine-editorial': { bg: '#0A0A0A', borderColor: 'rgba(237,237,237,0.06)', textColor: '#EDEDED', mutedColor: 'rgba(237,237,237,0.35)', poweredColor: 'rgba(237,237,237,0.15)', headingFont: '"Bodoni Moda", "Didot", serif', bodyFont: '"Syne", sans-serif', navItems: ['Work', 'About', 'Journal', 'Inquire'], iconColor: '#EDEDED' },
  'warm-organic': { bg: '#F5F0EB', borderColor: 'rgba(61,50,40,0.08)', textColor: '#3D3228', mutedColor: '#8B7D6B', poweredColor: 'rgba(61,50,40,0.2)', headingFont: '"Lora", Georgia, serif', bodyFont: '"Nunito Sans", sans-serif', navItems: ['Home', 'Portfolio', 'About', 'Stories', 'Contact'], iconColor: '#3D3228' },
  'bold-portfolio': { bg: '#050505', borderColor: 'rgba(240,240,240,0.06)', textColor: '#F0F0F0', mutedColor: '#666', poweredColor: '#333', headingFont: '"Bebas Neue", Impact, sans-serif', bodyFont: '"Space Grotesk", sans-serif', navItems: ['Work', 'About', 'Contact'], iconColor: '#F0F0F0' },
  'elegant-folio': { bg: '#FAF8F5', borderColor: 'rgba(28,25,23,0.06)', textColor: '#1C1917', mutedColor: '#78716C', poweredColor: 'rgba(28,25,23,0.2)', headingFont: '"Cormorant Garamond", Georgia, serif', bodyFont: '"Outfit", sans-serif', navItems: ['Portfolio', 'About', 'Journal', 'Contact'], iconColor: '#1C1917' },
  'starter-one': { bg: '#FFFFFF', borderColor: 'rgba(0,0,0,0.06)', textColor: '#111111', mutedColor: '#9CA3AF', poweredColor: '#D1D5DB', headingFont: '"Inter", system-ui, sans-serif', bodyFont: '"Inter", system-ui, sans-serif', navItems: ['Work', 'About', 'Contact'], iconColor: '#111111' },
  'noir-starter': { bg: '#0A0A0A', borderColor: 'rgba(232,228,223,0.06)', textColor: '#E8E4DF', mutedColor: '#7A756E', poweredColor: 'rgba(232,228,223,0.15)', headingFont: '"Prata", Georgia, serif', bodyFont: '"Manrope", sans-serif', navItems: ['Portfolio', 'About', 'Contact'], iconColor: '#E8E4DF' },
};

export function WebsiteFooter({ template, branding }: WebsiteFooterProps) {
  const t = getTemplate(template);
  if (!branding) return null;
  const year = new Date().getFullYear();

  const config = FOOTER_CONFIGS[template];

  // ── Template-specific footers (all 7 new templates + editorial/cinematic/modern-grid) ──
  if (config) {
    return (
      <footer style={{ backgroundColor: config.bg, fontFamily: config.bodyFont }}>
        <div className="border-t" style={{ borderColor: config.borderColor }}>
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10 py-8 px-6">
            {config.navItems.map(link => (
              <a key={link} href={`#${link.toLowerCase()}`}
                className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-light transition-opacity hover:opacity-100"
                style={{ color: config.mutedColor, opacity: 0.7 }}>
                {link}
              </a>
            ))}
          </div>
        </div>
        <div className="border-t py-14 px-6 text-center" style={{ borderColor: config.borderColor }}>
          <div className="max-w-4xl mx-auto space-y-5">
            {branding.studio_logo_url ? (
              <img src={branding.studio_logo_url} alt={`${branding.studio_name} logo`} className="h-12 sm:h-14 mx-auto object-contain opacity-70" />
            ) : (
              <h3 className={`text-xl sm:text-2xl font-light ${template === 'bold-portfolio' ? 'uppercase tracking-[0.02em]' : 'tracking-[0.04em]'}`} style={{ color: config.textColor, opacity: 0.8, fontFamily: config.headingFont }}>
                {branding.studio_name}
              </h3>
            )}
            {branding.footer_text && (
              <p className="text-xs tracking-[0.12em]" style={{ color: config.mutedColor, opacity: 0.6 }}>
                {branding.footer_text}
              </p>
            )}
            <SocialIcons branding={branding} color={config.iconColor} />
            <div className="space-y-2 pt-4">
              <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: config.mutedColor, opacity: 0.5 }}>
                © {branding.studio_name.toLowerCase()} {year} — All rights reserved
              </p>
              <p className="text-[8px] tracking-[0.15em] uppercase" style={{ color: config.poweredColor }}>
                Powered by MirrorAI
              </p>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // ── Cinematic Wedding Story Footer ──
  if (template === 'cinematic-wedding-story') {
    const navItems = ['Home', 'About', 'Portfolio', 'Journal', 'Contact'];
    return (
      <footer style={{ backgroundColor: '#1A1715', fontFamily: '"DM Sans", sans-serif' }}>
        <div className="border-t" style={{ borderColor: 'rgba(250,248,245,0.06)' }}>
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10 py-8 px-6">
            {navItems.map(link => (
              <a key={link} href={`#${link.toLowerCase()}`} className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-light transition-opacity hover:opacity-100" style={{ color: '#9A958E', opacity: 0.7 }}>{link}</a>
            ))}
          </div>
        </div>
        <div className="border-t py-16 px-6 text-center" style={{ borderColor: 'rgba(250,248,245,0.04)' }}>
          <div className="max-w-4xl mx-auto space-y-6">
            {branding.studio_logo_url ? (
              <img src={branding.studio_logo_url} alt={`${branding.studio_name} logo`} className="h-14 sm:h-16 mx-auto object-contain opacity-70" />
            ) : (
              <h3 className="text-2xl sm:text-3xl font-light tracking-[0.04em]" style={{ color: '#FAF8F5', opacity: 0.8, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{branding.studio_name}</h3>
            )}
            {branding.footer_text && <p className="text-xs tracking-[0.15em] uppercase" style={{ color: '#9A958E', opacity: 0.6 }}>{branding.footer_text}</p>}
            <SocialIcons branding={branding} color="#FAF8F5" />
            <div className="space-y-2 pt-6">
              <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: '#9A958E', opacity: 0.5 }}>© {branding.studio_name.toLowerCase()} {year} — All rights reserved</p>
              <p className="text-[8px] tracking-[0.15em] uppercase" style={{ color: '#9A958E', opacity: 0.25 }}>Powered by MirrorAI</p>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // ── Modern Photography Grid Footer ──
  if (template === 'modern-photography-grid') {
    const navItems = ['Home', 'About', 'Projects', 'Team', 'Clients', 'Blog', 'Contact'];
    return (
      <footer style={{ backgroundColor: '#1A1A1A', fontFamily: '"DM Sans", sans-serif' }}>
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
            <div>
              {branding.studio_logo_url ? (
                <img src={branding.studio_logo_url} alt={`${branding.studio_name} logo`} className="h-8 object-contain brightness-0 invert opacity-80" />
              ) : (
                <span className="text-sm font-semibold tracking-[0.02em]" style={{ color: '#FFFFFF', opacity: 0.9 }}>{branding.studio_name}</span>
              )}
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-5">
              {navItems.map(link => (
                <a key={link} href={`#${link.toLowerCase()}`} className="text-[10px] uppercase tracking-[0.15em] transition-opacity hover:opacity-100" style={{ color: '#999', opacity: 0.7 }}>{link}</a>
              ))}
            </nav>
            <SocialIcons branding={branding} color="#FFFFFF" />
          </div>
          <div className="border-t mt-8 pt-6 text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] tracking-[0.12em]" style={{ color: '#666' }}>{branding.footer_text || `© ${branding.studio_name} ${year}. All Rights Reserved.`}</p>
            <p className="text-[8px] tracking-[0.12em] mt-2" style={{ color: '#444' }}>Powered by MirrorAI</p>
          </div>
        </div>
      </footer>
    );
  }

  // ── Editorial Luxury ──
  if (template === 'editorial-luxury') {
    return (
      <footer style={{ backgroundColor: '#2B2A28', fontFamily: '"DM Sans", sans-serif' }}>
        <div className="border-t" style={{ borderColor: 'rgba(245,240,234,0.08)' }}>
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10 py-8 px-6">
            {['Home', 'About', 'Gallery', 'Experience', 'Journal', 'Inquire'].map(link => (
              <a key={link} href={`#${link.toLowerCase()}`} className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-light transition-opacity hover:opacity-100" style={{ color: '#A09A92', opacity: 0.7 }}>{link}</a>
            ))}
          </div>
        </div>
        <div className="border-t py-16 px-6 text-center" style={{ borderColor: 'rgba(245,240,234,0.06)' }}>
          <div className="max-w-4xl mx-auto space-y-6">
            {branding.studio_logo_url ? (
              <img src={branding.studio_logo_url} alt={`${branding.studio_name} logo`} className="h-14 sm:h-16 mx-auto object-contain opacity-70" />
            ) : (
              <h3 className="text-2xl sm:text-3xl font-light italic" style={{ color: '#F5F0EA', opacity: 0.8, fontFamily: '"Playfair Display", Georgia, serif' }}>{branding.studio_name}</h3>
            )}
            {branding.footer_text && <p className="text-sm font-light italic tracking-wide" style={{ color: '#A09A92', fontFamily: '"Playfair Display", Georgia, serif' }}>{branding.footer_text}</p>}
            <SocialIcons branding={branding} color="#F5F0EA" />
            <div className="space-y-2 pt-6">
              <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: '#A09A92', opacity: 0.5 }}>© {branding.studio_name.toLowerCase()} {year} — All rights reserved</p>
              <p className="text-[8px] tracking-[0.15em] uppercase" style={{ color: '#A09A92', opacity: 0.25 }}>Powered by MirrorAI</p>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // ── Vows Elegance (default) ──
  return (
    <footer style={{ backgroundColor: t.footerBg, fontFamily: '"DM Sans", sans-serif' }}>
      <div className="border-t" style={{ borderColor: `${t.text}08` }}>
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10 py-8 px-6">
          {['Home', 'About Us', 'Gallery', 'Services', 'Contact'].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/\s/g, '-')}`} className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-light transition-opacity hover:opacity-100" style={{ color: t.footerText, opacity: 0.7 }}>{link}</a>
          ))}
        </div>
      </div>
      <div className="border-t py-16 px-6 text-center" style={{ borderColor: `${t.text}06` }}>
        <div className="max-w-4xl mx-auto space-y-6">
          {branding.studio_logo_url ? (
            <img src={branding.studio_logo_url} alt={`${branding.studio_name} logo`} className="h-14 sm:h-16 mx-auto object-contain opacity-70" />
          ) : (
            <h3 className="text-2xl sm:text-3xl font-light uppercase tracking-[0.08em]" style={{ color: t.text, opacity: 0.8, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{branding.studio_name}</h3>
          )}
          {branding.footer_text && <p className="text-sm font-light italic tracking-wide" style={{ color: t.footerText, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{branding.footer_text}</p>}
          {branding.email && <p className="text-[11px] tracking-[0.1em]" style={{ color: t.footerText, opacity: 0.7 }}>Email: {branding.email}</p>}
          {(branding as any).phone && <p className="text-[11px] tracking-[0.1em]" style={{ color: t.footerText, opacity: 0.7 }}>Contact: {(branding as any).phone}</p>}
          <SocialIcons branding={branding} color={t.text} />
          <div className="space-y-2 pt-6">
            <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: t.footerText, opacity: 0.5 }}>© {branding.studio_name.toLowerCase()} {year} — All rights reserved</p>
            <p className="text-[8px] tracking-[0.15em] uppercase" style={{ color: t.footerText, opacity: 0.25 }}>Powered by MirrorAI</p>
          </div>
        </div>
      </div>
    </footer>
  );
}