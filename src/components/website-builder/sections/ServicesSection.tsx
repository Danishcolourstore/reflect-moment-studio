import { type TemplateConfig } from '@/lib/website-templates';

interface Service {
  name: string;
  description: string;
  price?: string;
}

interface ServicesSectionProps {
  template: TemplateConfig;
  services?: Service[];
  id?: string;
}

const DEMO_SERVICES: Service[] = [
  { name: 'Wedding Photography', description: 'Full day coverage with two photographers, edited gallery of 400+ images.', price: '₹1,50,000' },
  { name: 'Pre-Wedding Shoot', description: 'Half day session at a location of your choice, 50+ edited images.', price: '₹40,000' },
  { name: 'Engagement Session', description: 'Intimate portrait session capturing your love story beautifully.', price: '₹25,000' },
];

export function ServicesSection({ template, services, id }: ServicesSectionProps) {
  const t = template;
  const items = services && services.length > 0 ? services : DEMO_SERVICES;
  const variant = t.sections.services;

  /* ── List (Reverie, Vesper) ── */
  if (variant === 'list') {
    return (
      <section id={id} className="py-16 sm:py-24 px-6 sm:px-10" style={{ backgroundColor: t.colors.bg }}>
        <div className="max-w-3xl mx-auto">
          <h2 style={{
            fontFamily: t.fonts.display,
            fontSize: 42,
            fontWeight: t.fonts.displayWeight,
            fontStyle: t.fonts.displayStyle,
            color: t.colors.text,
            marginBottom: 32,
          }}>
            {t.id === 'reverie' ? 'What We Offer' : 'Services'}
          </h2>
          {items.map((svc, i) => (
            <div
              key={i}
              className="py-6 flex flex-col sm:flex-row sm:items-baseline justify-between"
              style={{
                borderTop: i === 0 && t.id === 'vesper' ? `2px solid ${t.colors.accent}` : `1px solid ${t.colors.border}`,
              }}
            >
              <div className="flex-1">
                <h3 style={{
                  fontFamily: t.fonts.display,
                  fontSize: t.id === 'vesper' ? 32 : 24,
                  fontWeight: t.fonts.displayWeight,
                  fontStyle: t.fonts.displayStyle,
                  color: t.colors.text,
                }}>
                  {svc.name}
                </h3>
                <p style={{
                  fontFamily: t.fonts.ui,
                  fontSize: 13,
                  color: t.colors.textSecondary,
                  marginTop: 4,
                  paddingLeft: t.id === 'vesper' ? 20 : 0,
                }}>
                  {svc.description}
                </p>
              </div>
              {svc.price && (
                <p className="mt-2 sm:mt-0 sm:ml-8" style={{
                  fontFamily: t.fonts.ui,
                  fontSize: 14,
                  color: t.colors.text,
                  whiteSpace: 'nowrap',
                }}>
                  {svc.price}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  /* ── Cards (Linen) ── */
  if (variant === 'cards') {
    return (
      <section id={id} className="py-16 sm:py-24 px-6 sm:px-10" style={{ backgroundColor: t.colors.bg }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center mb-12" style={{
            fontFamily: t.fonts.display,
            fontSize: 42,
            fontWeight: t.fonts.displayWeight,
            color: t.colors.text,
          }}>
            Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {items.map((svc, i) => (
              <div
                key={i}
                className="p-6 flex flex-col"
                style={{ border: `1px solid ${t.colors.border}` }}
              >
                <h3 style={{
                  fontFamily: t.fonts.display,
                  fontSize: 22,
                  fontWeight: t.fonts.displayWeight,
                  color: t.colors.text,
                  marginBottom: 8,
                }}>
                  {svc.name}
                </h3>
                <p className="flex-1" style={{
                  fontFamily: t.fonts.ui,
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: t.colors.textSecondary,
                }}>
                  {svc.description}
                </p>
                {svc.price && (
                  <p className="mt-4" style={{
                    fontFamily: t.fonts.ui,
                    fontSize: 14,
                    color: t.colors.text,
                  }}>
                    {svc.price}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ── Numbered (Alabaster, Heirloom) ── */
  const numerals = t.id === 'heirloom'
    ? ['I', 'II', 'III', 'IV', 'V']
    : ['01', '02', '03', '04', '05'];

  return (
    <section id={id} className="py-16 sm:py-24 px-6 sm:px-10" style={{ backgroundColor: t.colors.bg }}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center mb-16" style={{
          fontFamily: t.fonts.display,
          fontSize: 42,
          fontWeight: t.fonts.displayWeight,
          fontStyle: t.id === 'heirloom' ? 'italic' : t.fonts.displayStyle,
          color: t.colors.text,
        }}>
          Services
        </h2>
        {items.map((svc, i) => (
          <div key={i} className="relative mb-12 sm:mb-16 pl-16 sm:pl-24">
            <span
              className="absolute left-0 top-0"
              style={{
                fontFamily: t.fonts.display,
                fontSize: t.id === 'heirloom' ? 48 : 80,
                fontWeight: '300',
                color: t.id === 'heirloom' ? t.colors.border : '#F0F0F0',
                lineHeight: 1,
              }}
            >
              {numerals[i]}
            </span>
            <div>
              <h3 style={{
                fontFamily: t.fonts.display,
                fontSize: t.id === 'heirloom' ? 24 : 26,
                fontWeight: t.fonts.displayWeight,
                fontStyle: t.id === 'heirloom' ? 'italic' : t.fonts.displayStyle,
                color: t.colors.text,
              }}>
                {svc.name}
              </h3>
              <p className="mt-2" style={{
                fontFamily: t.fonts.ui,
                fontSize: 13,
                color: t.colors.textSecondary,
              }}>
                {svc.description}
              </p>
              {svc.price && (
                <p className="mt-1" style={{
                  fontFamily: t.fonts.ui,
                  fontSize: 13,
                  color: t.colors.text,
                }}>
                  {svc.price}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
