import { Camera, Heart, MapPin, Users } from 'lucide-react';

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
}

export function WebsiteServices({ services, accent, id }: WebsiteServicesProps) {
  if (!services || services.length === 0) return null;

  return (
    <section id={id} className="py-16 px-4 sm:px-6" style={{ backgroundColor: '#0C0B08' }}>
      <div className="text-center mb-12">
        <p
          className="text-[10px] uppercase tracking-[0.25em] font-medium mb-2"
          style={{ color: accent, opacity: 0.7 }}
        >
          What I Offer
        </p>
        <h2
          className="text-2xl sm:text-3xl font-light"
          style={{ fontFamily: "'Playfair Display', serif", color: '#EDEAE3' }}
        >
          Services
        </h2>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
        {services.map((svc, i) => {
          const IconComp = ICON_MAP[svc.icon || ''] || Camera;
          return (
            <div
              key={i}
              className="p-6 rounded-xl border transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${accent}15` }}
              >
                <IconComp className="h-5 w-5" style={{ color: accent }} />
              </div>
              <h3
                className="text-base font-medium mb-2"
                style={{ color: '#EDEAE3' }}
              >
                {svc.title}
              </h3>
              {svc.description && (
                <p className="text-sm leading-relaxed" style={{ color: '#A6A197' }}>
                  {svc.description}
                </p>
              )}
              {svc.price && (
                <p className="mt-3 text-sm font-medium" style={{ color: accent }}>
                  {svc.price}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
