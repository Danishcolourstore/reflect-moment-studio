import { getTemplate } from '@/lib/website-templates';
import { Instagram, Globe, MessageCircle, Mail } from 'lucide-react';

interface StudioBranding {
  studio_name: string;
  studio_logo_url: string | null;
  studio_accent_color: string | null;
  instagram?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  footer_text?: string | null;
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
  const hasLinks = branding.instagram || branding.website || branding.whatsapp || branding.email;

  return (
    <footer
      className="border-t py-12 px-6"
      style={{
        backgroundColor: t.bg,
        borderColor: t.navBorder,
        fontFamily: t.uiFontFamily,
        color: t.textSecondary,
      }}
    >
      <div className="max-w-4xl mx-auto text-center space-y-6">
        {/* Studio logo / name */}
        {branding.studio_logo_url ? (
          <img src={branding.studio_logo_url} alt="" className="h-8 mx-auto object-contain opacity-60" />
        ) : (
          <p
            className="text-sm font-medium tracking-[0.15em] uppercase"
            style={{ color: t.text, opacity: 0.7 }}
          >
            {branding.studio_name}
          </p>
        )}

        {/* Footer text */}
        {branding.footer_text && (
          <p className="text-xs leading-relaxed max-w-md mx-auto" style={{ color: t.textSecondary }}>
            {branding.footer_text}
          </p>
        )}

        {/* Social links */}
        {hasLinks && (
          <div className="flex items-center justify-center gap-4">
            {branding.instagram && (
              <a
                href={`https://instagram.com/${branding.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-100 opacity-50 transition-opacity"
              >
                <Instagram className="h-4 w-4" style={{ color: t.text }} />
              </a>
            )}
            {branding.website && (
              <a
                href={branding.website.startsWith('http') ? branding.website : `https://${branding.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-100 opacity-50 transition-opacity"
              >
                <Globe className="h-4 w-4" style={{ color: t.text }} />
              </a>
            )}
            {branding.whatsapp && (
              <a
                href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-100 opacity-50 transition-opacity"
              >
                <MessageCircle className="h-4 w-4" style={{ color: t.text }} />
              </a>
            )}
            {branding.email && (
              <a
                href={`mailto:${branding.email}`}
                className="hover:opacity-100 opacity-50 transition-opacity"
              >
                <Mail className="h-4 w-4" style={{ color: t.text }} />
              </a>
            )}
          </div>
        )}

        {/* Photographer portfolio link */}
        {photographerUsername && (
          <div className="pt-2">
            <a
              href={`/studio/${photographerUsername}`}
              className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase transition-opacity hover:opacity-100"
              style={{ color: t.text, opacity: 0.5 }}
            >
              Explore Photographer Portfolio
            </a>
          </div>
        )}

        {/* Copyright + powered by */}
        <div className="space-y-1.5 pt-4">
          <p className="text-[10px] tracking-[0.12em] uppercase" style={{ color: t.textSecondary, opacity: 0.6 }}>
            © {year} {branding.studio_name}
          </p>
          <p className="text-[8px] tracking-[0.14em] uppercase" style={{ color: t.textSecondary, opacity: 0.3 }}>
            Powered by MirrorAI
          </p>
        </div>
      </div>
    </footer>
  );
}
