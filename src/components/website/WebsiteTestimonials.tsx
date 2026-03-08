import { Star, Quote } from 'lucide-react';
import { getTemplate } from '@/lib/website-templates';

export interface Testimonial {
  clientName: string;
  review: string;
  rating: number;
}

interface WebsiteTestimonialsProps {
  testimonials: Testimonial[];
  accent: string;
  id?: string;
  template?: string;
}

export function WebsiteTestimonials({ testimonials, accent, id, template = 'vows-elegance' }: WebsiteTestimonialsProps) {
  if (testimonials.length === 0) return null;
  const tmpl = getTemplate(template);
  const isEditorial = template === 'editorial-luxury';
  const textColor = isEditorial ? '#2B2A28' : tmpl.text;
  const secondaryColor = isEditorial ? '#6B6560' : tmpl.textSecondary;

  return (
    <section id={id} className="relative py-24 sm:py-36 px-6 overflow-hidden" style={{ backgroundColor: isEditorial ? '#EFEBE5' : tmpl.bg }}>
      <div className="text-center mb-16 sm:mb-20">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-4" style={{ color: accent, opacity: 0.7, fontFamily: '"DM Sans", sans-serif' }}>
          Client Love
        </p>
        <h2
          className={`text-3xl sm:text-4xl lg:text-5xl font-light tracking-[0.04em] ${isEditorial ? 'italic' : 'uppercase tracking-[0.06em]'}`}
          style={{ fontFamily: isEditorial ? '"Playfair Display", Georgia, serif' : '"Cormorant Garamond", Georgia, serif', color: textColor }}
        >
          {isEditorial ? 'Kind Words' : 'What They Say About Us'}
        </h2>
        <div className="mt-5 w-12 h-[1px] mx-auto" style={{ backgroundColor: isEditorial ? '#D5CEC5' : accent, opacity: 0.4 }} />
      </div>

      <div className="max-w-4xl mx-auto space-y-16 sm:space-y-24">
        {testimonials.map((t, idx) => (
          <div key={idx} className="text-center px-4 sm:px-8">
            <div className="flex justify-center mb-8">
              <Quote className="h-8 w-8 rotate-180" style={{ color: accent, opacity: 0.3 }} />
            </div>
            <p
              className="text-lg sm:text-xl lg:text-2xl leading-[1.9] font-light italic"
              style={{ color: textColor, fontFamily: isEditorial ? '"Playfair Display", Georgia, serif' : '"Cormorant Garamond", Georgia, serif', opacity: 0.9 }}
            >
              "{t.review}"
            </p>
            <div className="flex justify-center gap-1 mt-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3 w-3" fill={i < t.rating ? accent : 'transparent'} style={{ color: i < t.rating ? accent : `${textColor}1A` }} />
              ))}
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.25em]" style={{ color: accent, fontFamily: '"DM Sans", sans-serif' }}>
              — {t.clientName}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
