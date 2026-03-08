import { Instagram, Globe, MessageCircle } from 'lucide-react';
import { getTemplate } from '@/lib/website-templates';

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
  if (!branding?.bio) return null;

  const tmpl = getTemplate(template);
  const accent = branding.studio_accent_color || '#C6A77B';

  return (
    <section id={id} className="py-24 sm:py-32 px-6" style={{ backgroundColor: tmpl.bg }}>
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em]" style={{ color: accent, opacity: 0.7 }}>
          About
        </p>
        <h3 className="text-3xl sm:text-4xl font-light tracking-wide" style={{ color: tmpl.text, fontFamily: tmpl.fontFamily }}>
          {branding.display_name || branding.studio_name}
        </h3>
        <div className="w-10 h-[1px] mx-auto" style={{ backgroundColor: accent, opacity: 0.4 }} />
        <p className="text-sm sm:text-base leading-[1.9] max-w-xl mx-auto" style={{ color: tmpl.textSecondary, fontFamily: tmpl.uiFontFamily }}>
          {branding.bio}
        </p>
        <div className="flex items-center justify-center gap-6 pt-4">
          {branding.instagram && (
            <a href={`https://instagram.com/${branding.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] hover:opacity-100 opacity-50 transition-opacity duration-300"
              style={{ color: tmpl.text }}>
              <Instagram className="h-4 w-4" /> Instagram
            </a>
          )}
          {branding.website && (
            <a href={branding.website.startsWith('http') ? branding.website : `https://${branding.website}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] hover:opacity-100 opacity-50 transition-opacity duration-300"
              style={{ color: tmpl.text }}>
              <Globe className="h-4 w-4" /> Website
            </a>
          )}
          {branding.whatsapp && (
            <a href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] hover:opacity-100 opacity-50 transition-opacity duration-300"
              style={{ color: tmpl.text }}>
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
