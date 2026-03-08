import { getTemplate } from '@/lib/website-templates';
import { Instagram, Globe, MessageCircle } from 'lucide-react';

interface StudioBranding {
  studio_name: string;
  studio_logo_url: string | null;
  studio_accent_color: string | null;
  instagram?: string | null;
  website?: string | null;
  whatsapp?: string | null;
}

interface WebsiteHeaderProps {
  template: string;
  branding: StudioBranding | null;
  eventName: string;
  onScrollToGallery?: () => void;
  onScrollToAbout?: () => void;
  onScrollToContact?: () => void;
}

export function WebsiteHeader({ template, branding, eventName, onScrollToGallery, onScrollToAbout, onScrollToContact }: WebsiteHeaderProps) {
  const t = getTemplate(template);

  const navItems = [
    { label: 'Gallery', onClick: onScrollToGallery },
    ...(onScrollToAbout ? [{ label: 'About', onClick: onScrollToAbout }] : []),
    ...(onScrollToContact ? [{ label: 'Contact', onClick: onScrollToContact }] : []),
  ];

  const isLight = ['minimal-portfolio', 'modern-grid'].includes(template);
  const isTransparent = ['luxury-wedding', 'magazine-editorial', 'dark-portfolio'].includes(template);

  if (isLight) {
    return (
      <header
        className="sticky top-0 z-[60] backdrop-blur-md transition-all duration-300"
        style={{
          backgroundColor: t.navBg,
          borderBottom: `1px solid ${t.navBorder}`,
          fontFamily: t.uiFontFamily,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {branding?.studio_logo_url ? (
              <img src={branding.studio_logo_url} alt="" className="h-8 object-contain" />
            ) : (
              <span className="text-sm font-semibold tracking-wide" style={{ color: t.text }}>
                {branding?.studio_name || 'Studio'}
              </span>
            )}
          </div>
          <nav className="hidden sm:flex items-center gap-6">
            {navItems.map(item => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="text-xs uppercase tracking-[0.12em] font-medium transition-colors hover:opacity-70"
                style={{ color: t.textSecondary }}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {branding?.instagram && (
              <a href={`https://instagram.com/${branding.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-100 transition-opacity">
                <Instagram className="h-4 w-4" style={{ color: t.text }} />
              </a>
            )}
            {branding?.website && (
              <a href={branding.website.startsWith('http') ? branding.website : `https://${branding.website}`} target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-100 transition-opacity">
                <Globe className="h-4 w-4" style={{ color: t.text }} />
              </a>
            )}
          </div>
        </div>
      </header>
    );
  }

  // Transparent overlay header for luxury-wedding, magazine-editorial, dark-portfolio
  return (
    <header
      className="absolute top-0 left-0 right-0 z-[60] pointer-events-none"
      style={{ fontFamily: t.uiFontFamily }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20 pointer-events-auto">
        <div className="flex items-center gap-3">
          {branding?.studio_logo_url ? (
            <img src={branding.studio_logo_url} alt="" className="h-9 object-contain drop-shadow-md" />
          ) : (
            <span className="text-sm font-medium text-white/80 tracking-[0.15em] uppercase drop-shadow-md">
              {branding?.studio_name || 'Studio'}
            </span>
          )}
        </div>
        <nav className="hidden sm:flex items-center gap-6">
          {navItems.map(item => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="text-[11px] uppercase tracking-[0.14em] font-medium text-white/70 hover:text-white/100 transition-colors drop-shadow-sm"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {branding?.instagram && (
            <a href={`https://instagram.com/${branding.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white/90 transition-colors">
              <Instagram className="h-4 w-4 drop-shadow-sm" />
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
