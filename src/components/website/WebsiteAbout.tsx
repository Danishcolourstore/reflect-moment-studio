import { getTemplate } from '@/lib/website-templates';
import { Instagram, Globe, MessageCircle } from 'lucide-react';

interface StudioBranding {
  studio_name: string;
  studio_logo_url: string | null;
  studio_accent_color: string | null;
  bio?: string | null;
  display_name?: string | null;
  instagram?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  cover_url?: string | null;
}

interface WebsiteAboutProps {
  template: string;
  branding: StudioBranding | null;
  id?: string;
}

export function WebsiteAbout({ template, branding, id }: WebsiteAboutProps) {
  const t = getTemplate(template);
  if (!branding?.bio) return null;

  return (
    <section
      id={id}
      className="py-20 px-6"
      style={{ backgroundColor: t.bg, fontFamily: t.uiFontFamily }}
    >
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <p
          className="text-[10px] uppercase tracking-[0.2em] font-medium"
          style={{ color: t.textSecondary, opacity: 0.6 }}
        >
          About the Photographer
        </p>

        {branding.studio_logo_url && (
          <img src={branding.studio_logo_url} alt="" className="h-12 mx-auto object-contain opacity-70" />
        )}

        <h3
          className="text-2xl font-light tracking-wide"
          style={{
            color: t.text,
            fontFamily: template === 'editorial-studio' ? '"Cormorant Garamond", Georgia, serif' : t.uiFontFamily,
          }}
        >
          {branding.display_name || branding.studio_name}
        </h3>

        <p
          className="text-sm leading-relaxed max-w-lg mx-auto"
          style={{ color: t.textSecondary }}
        >
          {branding.bio}
        </p>

        {/* Social links */}
        <div className="flex items-center justify-center gap-4 pt-2">
          {branding.instagram && (
            <a
              href={`https://instagram.com/${branding.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] hover:opacity-100 opacity-60 transition-opacity"
              style={{ color: t.text }}
            >
              <Instagram className="h-3.5 w-3.5" /> Instagram
            </a>
          )}
          {branding.website && (
            <a
              href={branding.website.startsWith('http') ? branding.website : `https://${branding.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] hover:opacity-100 opacity-60 transition-opacity"
              style={{ color: t.text }}
            >
              <Globe className="h-3.5 w-3.5" /> Website
            </a>
          )}
          {branding.whatsapp && (
            <a
              href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] hover:opacity-100 opacity-60 transition-opacity"
              style={{ color: t.text }}
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
