import { Mail, MessageCircle, Globe, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudioBranding {
  studio_name: string;
  studio_accent_color: string | null;
  email?: string | null;
  whatsapp?: string | null;
  website?: string | null;
}

interface WebsiteContactProps {
  template: string;
  branding: StudioBranding | null;
  id?: string;
}

export function WebsiteContact({ branding, id }: WebsiteContactProps) {
  const hasContact = branding?.email || branding?.whatsapp || branding?.website;
  if (!hasContact) return null;

  const accent = branding?.studio_accent_color || '#C6A77B';

  return (
    <section
      id={id}
      className="py-24 sm:py-32 px-6"
      style={{ backgroundColor: '#0C0B08' }}
    >
      <div className="max-w-lg mx-auto text-center space-y-8">
        {/* Label */}
        <p
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em]"
          style={{ color: accent, opacity: 0.7 }}
        >
          Get in Touch
        </p>

        {/* Heading */}
        <h3
          className="text-3xl sm:text-4xl font-light tracking-wide"
          style={{
            color: '#EDEAE3',
            fontFamily: "'Playfair Display', serif",
          }}
        >
          Let's Create Together
        </h3>

        <div className="w-10 h-[1px] mx-auto" style={{ backgroundColor: accent, opacity: 0.4 }} />

        <p
          className="text-sm leading-relaxed"
          style={{ color: 'rgba(166,161,151,0.7)', fontFamily: "'DM Sans', sans-serif" }}
        >
          Ready to capture your story? Reach out and let's make something beautiful.
        </p>

        {/* Contact buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          {branding?.email && (
            <a href={`mailto:${branding.email}`}>
              <Button
                variant="outline"
                className="h-11 text-[10px] uppercase tracking-[0.15em] rounded-none px-8 transition-all duration-300 hover:scale-[1.02]"
                style={{ borderColor: accent, color: accent, backgroundColor: 'transparent' }}
              >
                <Mail className="h-3.5 w-3.5 mr-2" /> Email Me
              </Button>
            </a>
          )}
          {branding?.whatsapp && (
            <a href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                className="h-11 text-[10px] uppercase tracking-[0.15em] rounded-none px-8 transition-all duration-300 hover:scale-[1.02]"
                style={{ borderColor: accent, color: accent, backgroundColor: 'transparent' }}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-2" /> WhatsApp
              </Button>
            </a>
          )}
          {branding?.website && (
            <a href={branding.website.startsWith('http') ? branding.website : `https://${branding.website}`} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                className="h-11 text-[10px] uppercase tracking-[0.15em] rounded-none px-8 transition-all duration-300 hover:scale-[1.02]"
                style={{ borderColor: accent, color: accent, backgroundColor: 'transparent' }}
              >
                <Globe className="h-3.5 w-3.5 mr-2" /> Website
              </Button>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
