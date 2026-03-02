import { getTemplate } from '@/lib/website-templates';
import { Mail, MessageCircle, Globe } from 'lucide-react';
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

export function WebsiteContact({ template, branding, id }: WebsiteContactProps) {
  const t = getTemplate(template);
  const hasContact = branding?.email || branding?.whatsapp || branding?.website;
  if (!hasContact) return null;

  const accentColor = branding?.studio_accent_color || t.text;

  return (
    <section
      id={id}
      className="py-16 px-6"
      style={{
        backgroundColor: template === 'editorial-studio' ? '#F5F0EA' : template === 'timeless-wedding' ? '#F5F3F0' : '#F8F8F8',
        fontFamily: t.uiFontFamily,
      }}
    >
      <div className="max-w-md mx-auto text-center space-y-5">
        <p
          className="text-[10px] uppercase tracking-[0.2em] font-medium"
          style={{ color: t.textSecondary, opacity: 0.6 }}
        >
          Get in Touch
        </p>
        <h3
          className="text-xl font-light"
          style={{
            color: t.text,
            fontFamily: template === 'editorial-studio' ? '"Cormorant Garamond", Georgia, serif' : t.uiFontFamily,
          }}
        >
          Let's create something beautiful
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {branding?.email && (
            <a href={`mailto:${branding.email}`}>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-[11px] uppercase tracking-[0.1em] rounded-full px-6"
                style={{ borderColor: accentColor, color: accentColor }}
              >
                <Mail className="h-3.5 w-3.5 mr-1.5" /> Email
              </Button>
            </a>
          )}
          {branding?.whatsapp && (
            <a href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-[11px] uppercase tracking-[0.1em] rounded-full px-6"
                style={{ borderColor: accentColor, color: accentColor }}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> WhatsApp
              </Button>
            </a>
          )}
          {branding?.website && (
            <a href={branding.website.startsWith('http') ? branding.website : `https://${branding.website}`} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-[11px] uppercase tracking-[0.1em] rounded-full px-6"
                style={{ borderColor: accentColor, color: accentColor }}
              >
                <Globe className="h-3.5 w-3.5 mr-1.5" /> Website
              </Button>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
