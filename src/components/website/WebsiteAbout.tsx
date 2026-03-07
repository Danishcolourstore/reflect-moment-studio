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

export function WebsiteAbout({ branding, id }: WebsiteAboutProps) {
  if (!branding?.bio) return null;

  const accent = branding.studio_accent_color || '#C6A77B';

  return (
    <section
      id={id}
      className="py-24 sm:py-32 px-6"
      style={{ backgroundColor: '#0F0E0A' }}
    >
      <div className="max-w-3xl mx-auto text-center space-y-8">
        {/* Label */}
        <p
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em]"
          style={{ color: accent, opacity: 0.7 }}
        >
          About
        </p>

        {/* Photographer name */}
        <h3
          className="text-3xl sm:text-4xl font-light tracking-wide"
          style={{
            color: '#EDEAE3',
            fontFamily: "'Playfair Display', serif",
          }}
        >
          {branding.display_name || branding.studio_name}
        </h3>

        {/* Accent line */}
        <div className="w-10 h-[1px] mx-auto" style={{ backgroundColor: accent, opacity: 0.4 }} />

        {/* Bio text */}
        <p
          className="text-sm sm:text-base leading-[1.9] max-w-xl mx-auto"
          style={{ color: 'rgba(166,161,151,0.85)', fontFamily: "'DM Sans', sans-serif" }}
        >
          {branding.bio}
        </p>

        {/* Social links */}
        <div className="flex items-center justify-center gap-6 pt-4">
          {branding.instagram && (
            <a
              href={`https://instagram.com/${branding.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] hover:opacity-100 opacity-50 transition-opacity duration-300"
              style={{ color: '#EDEAE3' }}
            >
              <Instagram className="h-4 w-4" /> Instagram
            </a>
          )}
          {branding.website && (
            <a
              href={branding.website.startsWith('http') ? branding.website : `https://${branding.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] hover:opacity-100 opacity-50 transition-opacity duration-300"
              style={{ color: '#EDEAE3' }}
            >
              <Globe className="h-4 w-4" /> Website
            </a>
          )}
          {branding.whatsapp && (
            <a
              href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] hover:opacity-100 opacity-50 transition-opacity duration-300"
              style={{ color: '#EDEAE3' }}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
