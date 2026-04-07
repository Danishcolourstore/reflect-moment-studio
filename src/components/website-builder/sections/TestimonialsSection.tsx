import { useState } from 'react';
import { type TemplateConfig } from '@/lib/website-templates';

interface Testimonial {
  quote: string;
  name: string;
}

interface TestimonialsSectionProps {
  template: TemplateConfig;
  testimonials?: Testimonial[];
  id?: string;
}

const DEMO: Testimonial[] = [
  { quote: 'They captured every emotion perfectly. Looking through our photos feels like reliving the most beautiful day of our lives.', name: 'Priya & Arjun' },
  { quote: 'The attention to detail was extraordinary. Every candid moment, every stolen glance - they saw it all.', name: 'Aisha & Rahul' },
  { quote: 'We did not just get photos - we got a love letter in images. Absolutely breathtaking work.', name: 'Meera & Siddharth' },
];

export function TestimonialsSection({ template, testimonials, id }: TestimonialsSectionProps) {
  const t = template;
  const items = testimonials && testimonials.length > 0 ? testimonials : DEMO;
  const variant = t.sections.testimonials;
  const [activeIdx, setActiveIdx] = useState(0);

  /* ── Single Centered (Reverie, Alabaster, Heirloom) ── */
  if (variant === 'single-centered') {
    const active = items[activeIdx];
    return (
      <section id={id} className="py-20 sm:py-32 px-6" style={{ backgroundColor: t.colors.bg }}>
        <div className="max-w-[800px] mx-auto text-center">
          {t.id === 'heirloom' && (
            <span style={{ fontFamily: t.fonts.display, fontSize: 24, color: t.colors.accent }}>✦</span>
          )}
          <p style={{
            fontFamily: t.fonts.display,
            fontSize: t.id === 'alabaster' ? 32 : t.id === 'heirloom' ? 20 : 26,
            fontWeight: t.id === 'alabaster' ? '300' : t.fonts.displayWeight,
            fontStyle: t.fonts.displayStyle === 'italic' || t.id === 'heirloom' ? 'italic' : 'normal',
            color: t.colors.text,
            lineHeight: t.id === 'alabaster' ? 1.9 : 1.7,
            marginTop: t.id === 'heirloom' ? 16 : 0,
          }}>
            {active.quote}
          </p>
          <p className="mt-5" style={{
            fontFamily: t.fonts.ui,
            fontSize: t.id === 'alabaster' ? 10 : 11,
            letterSpacing: t.id === 'alabaster' ? '0.2em' : '0.14em',
            textTransform: 'uppercase' as const,
            color: t.id === 'heirloom' ? t.colors.accent : (t.id === 'alabaster' ? '#CCCCCC' : '#AAAAAA'),
          }}>
            {active.name}
          </p>
          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className="transition-all duration-200"
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  backgroundColor: i === activeIdx ? t.colors.accent : t.colors.border,
                  border: 'none',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ── Horizontal Scroll (Linen) ── */
  if (variant === 'horizontal-scroll') {
    return (
      <section id={id} className="py-16 sm:py-24 px-6 sm:px-10" style={{ backgroundColor: t.colors.bg }}>
        <h2 className="text-center mb-12" style={{
          fontFamily: t.fonts.display,
          fontSize: 42,
          fontWeight: t.fonts.displayWeight,
          color: t.colors.text,
        }}>
          Kind Words
        </h2>
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex-shrink-0 snap-center"
              style={{
                width: 320,
                border: `1px solid ${t.colors.border}`,
                padding: 28,
              }}
            >
              <p style={{
                fontFamily: t.fonts.ui,
                fontSize: 14,
                fontStyle: 'italic',
                lineHeight: 1.8,
                color: t.colors.textSecondary,
              }}>
                "{item.quote}"
              </p>
              <p className="mt-4" style={{
                fontFamily: t.fonts.ui,
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                color: t.colors.textSecondary,
              }}>
                {item.name}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /* ── Dark Break (Vesper) ── */
  return (
    <section id={id} className="py-20 sm:py-32 px-6" style={{ backgroundColor: '#1E1916' }}>
      <div className="max-w-[700px] mx-auto text-center">
        <p style={{
          fontFamily: t.fonts.display,
          fontSize: 28,
          fontStyle: 'italic',
          color: '#FAF7F2',
          lineHeight: 1.7,
        }}>
          "{items[activeIdx].quote}"
        </p>
        <p className="mt-5" style={{
          fontFamily: t.fonts.ui,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          color: t.colors.accent,
        }}>
          {items[activeIdx].name}
        </p>
        <div className="flex items-center justify-center gap-2 mt-6">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className="transition-all duration-200"
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                backgroundColor: i === activeIdx ? t.colors.accent : 'rgba(250,247,242,0.2)',
                border: 'none',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
