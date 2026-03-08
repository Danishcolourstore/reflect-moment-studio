import { Camera, Heart, MapPin, Users } from 'lucide-react';
import { getTemplate } from '@/lib/website-templates';

export interface ServiceItem {
  title: string;
  description: string;
  icon?: string;
  price?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  camera: Camera,
  heart: Heart,
  location: MapPin,
  people: Users,
};

interface WebsiteServicesProps {
  services: ServiceItem[];
  accent: string;
  id?: string;
  template?: string;
}

export function WebsiteServices({ services, accent, id, template = 'vows-elegance' }: WebsiteServicesProps) {
  if (!services || services.length === 0) return null;
  const tmpl = getTemplate(template);
  const isEditorial = template === 'editorial-luxury';
  const textColor = isEditorial ? '#2B2A28' : tmpl.text;
  const secondaryColor = isEditorial ? '#6B6560' : tmpl.textSecondary;
  const borderColor = isEditorial ? '#D5CEC5' : `${tmpl.text}0A`;

  if (isEditorial) {
    return (
      <section id={id} className="py-20 sm:py-32 px-6 sm:px-12" style={{ backgroundColor: '#F5F0EA' }}>
        <div className="text-center mb-16">
          <p className="text-[10px] uppercase tracking-[0.35em] mb-4" style={{ color: accent, fontFamily: '"DM Sans", sans-serif' }}>
            What We Offer
          </p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-light italic"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', color: textColor }}
          >
            The Experience
          </h2>
          <div className="mt-5 w-12 h-[1px] mx-auto" style={{ backgroundColor: borderColor }} />
        </div>

        <div className="max-w-4xl mx-auto">
          {services.map((svc, i) => (
            <div key={i} style={{ borderTop: `1px solid ${borderColor}` }}>
              <div className="flex items-start justify-between py-8 sm:py-10 gap-6">
                <div className="flex-1">
                  <h3
                    className="text-lg sm:text-xl font-light mb-2"
                    style={{ color: textColor, fontFamily: '"Playfair Display", Georgia, serif' }}
                  >
                    {svc.title}
                  </h3>
                  <p className="text-sm leading-relaxed max-w-md" style={{ color: secondaryColor, fontFamily: '"DM Sans", sans-serif' }}>
                    {svc.description}
                  </p>
                </div>
                {svc.price && (
                  <p className="text-sm font-medium shrink-0" style={{ color: accent, fontFamily: '"DM Sans", sans-serif' }}>
                    {svc.price}
                  </p>
                )}
              </div>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${borderColor}` }} />
        </div>
      </section>
    );
  }

  // Vows Elegance
  return (
    <section id={id} className="py-16 px-4 sm:px-6" style={{ backgroundColor: tmpl.bg }}>
      <div className="text-center mb-12">
        <p className="text-[10px] uppercase tracking-[0.25em] font-medium mb-2" style={{ color: accent, opacity: 0.7 }}>What I Offer</p>
        <h2 className="text-2xl sm:text-3xl font-light" style={{ fontFamily: tmpl.fontFamily, color: tmpl.text }}>Services</h2>
      </div>
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
        {services.map((svc, i) => {
          const IconComp = ICON_MAP[svc.icon || ''] || Camera;
          return (
            <div key={i} className="p-6 rounded-xl border transition-colors" style={{ backgroundColor: tmpl.cardBg, borderColor: `${tmpl.text}0A` }}>
              <div className="h-10 w-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${accent}15` }}>
                <IconComp className="h-5 w-5" style={{ color: accent }} />
              </div>
              <h3 className="text-base font-medium mb-2" style={{ color: tmpl.text }}>{svc.title}</h3>
              {svc.description && <p className="text-sm leading-relaxed" style={{ color: tmpl.textSecondary }}>{svc.description}</p>}
              {svc.price && <p className="mt-3 text-sm font-medium" style={{ color: accent }}>{svc.price}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
