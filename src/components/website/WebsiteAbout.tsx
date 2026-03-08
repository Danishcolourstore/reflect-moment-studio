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
  about_image_url?: string | null;
}

interface WebsiteAboutProps {
  template: string;
  branding: StudioBranding | null;
  id?: string;
}

/**
 * Two-part About section matching the reference:
 * 1. "YOUR WORLD OUR VISION" intro with side image
 * 2. "HEY I'M [NAME]" photographer bio with portrait
 */
export function WebsiteAbout({ template, branding, id }: WebsiteAboutProps) {
  if (!branding?.bio) return null;

  const tmpl = getTemplate(template);
  const accent = branding.studio_accent_color || '#C6A77B';

  // Split bio into paragraphs for better layout
  const bioParagraphs = branding.bio.split('\n').filter(p => p.trim());

  return (
    <section id={id} style={{ backgroundColor: tmpl.bg }}>
      {/* Part 1: Vision statement with side image */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[70vh]">
        {/* Left - Large portrait image */}
        <div className="relative overflow-hidden min-h-[400px] md:min-h-0">
          {branding.cover_url ? (
            <img
              src={branding.cover_url}
              alt={branding.studio_name}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0" style={{ backgroundColor: tmpl.cardBg }} />
          )}
        </div>

        {/* Right - Text content */}
        <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-16 sm:py-20">
          <p
            className="text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-6"
            style={{ color: accent, fontFamily: '"DM Sans", sans-serif' }}
          >
            Your World Our Vision
          </p>
          <p
            className="text-sm sm:text-base leading-[2] tracking-wide"
            style={{ color: tmpl.textSecondary, fontFamily: '"DM Sans", sans-serif' }}
          >
            {bioParagraphs[0] || branding.bio}
          </p>
        </div>
      </div>

      {/* Part 2: Photographer personal intro */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[80vh]">
        {/* Left - Bio text */}
        <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-16 sm:py-20 order-2 md:order-1">
          <p
            className="text-[10px] sm:text-xs uppercase tracking-[0.3em] mb-3"
            style={{ color: accent, fontFamily: '"DM Sans", sans-serif' }}
          >
            Hey I'm
          </p>
          <h3
            className="text-3xl sm:text-4xl lg:text-5xl font-light uppercase tracking-[0.06em] mb-8"
            style={{ color: tmpl.text, fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            {branding.studio_name}
          </h3>
          <div className="space-y-5">
            {bioParagraphs.slice(1).map((para, i) => (
              <p
                key={i}
                className="text-sm sm:text-base leading-[2] tracking-wide"
                style={{ color: tmpl.textSecondary, fontFamily: '"DM Sans", sans-serif' }}
              >
                {para}
              </p>
            ))}
            {bioParagraphs.length <= 1 && (
              <p
                className="text-sm sm:text-base leading-[2] tracking-wide"
                style={{ color: tmpl.textSecondary, fontFamily: '"DM Sans", sans-serif' }}
              >
                {branding.bio}
              </p>
            )}
          </div>

          {/* Social links */}
          <div className="flex items-center gap-6 mt-10">
            {branding.instagram && (
              <a href={`https://instagram.com/${branding.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] hover:opacity-100 opacity-50 transition-opacity duration-300"
                style={{ color: tmpl.text }}>
                <Instagram className="h-4 w-4" /> Instagram
              </a>
            )}
            {branding.website && (
              <a href={branding.website.startsWith('http') ? branding.website : `https://${branding.website}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] hover:opacity-100 opacity-50 transition-opacity duration-300"
                style={{ color: tmpl.text }}>
                <Globe className="h-4 w-4" /> Website
              </a>
            )}
            {branding.whatsapp && (
              <a href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] hover:opacity-100 opacity-50 transition-opacity duration-300"
                style={{ color: tmpl.text }}>
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>

          {/* More About link */}
          <a
            href="#about"
            className="inline-flex items-center mt-8 text-[10px] uppercase tracking-[0.25em] transition-opacity hover:opacity-100"
            style={{ color: accent, opacity: 0.8, fontFamily: '"DM Sans", sans-serif' }}
          >
            More About Us →
          </a>
        </div>

        {/* Right - Portrait image */}
        <div className="relative overflow-hidden min-h-[400px] md:min-h-0 order-1 md:order-2">
          {(branding as any).about_image_url || branding.cover_url ? (
            <img
              src={(branding as any).about_image_url || branding.cover_url!}
              alt={branding.studio_name}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0" style={{ backgroundColor: tmpl.cardBg }} />
          )}
        </div>
      </div>
    </section>
  );
}
