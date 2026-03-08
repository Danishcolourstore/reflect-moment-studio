import { Star } from 'lucide-react';

export interface Testimonial {
  clientName: string;
  review: string;
  rating: number;
}

interface WebsiteTestimonialsProps {
  testimonials: Testimonial[];
  accent: string;
  id?: string;
}

export function WebsiteTestimonials({ testimonials, accent, id }: WebsiteTestimonialsProps) {
  if (testimonials.length === 0) return null;

  return (
    <section id={id} className="py-16 sm:py-24 px-4" style={{ backgroundColor: '#0C0B08' }}>
      <div className="text-center mb-10 sm:mb-14">
        <p
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] mb-3"
          style={{ color: accent, opacity: 0.7 }}
        >
          Client Love
        </p>
        <h2
          className="text-3xl sm:text-4xl font-light tracking-wide"
          style={{ fontFamily: "'Playfair Display', serif", color: '#EDEAE3' }}
        >
          Testimonials
        </h2>
        <div className="mt-4 w-10 h-[1px] mx-auto" style={{ backgroundColor: accent, opacity: 0.5 }} />
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="p-6 rounded-xl border"
            style={{ backgroundColor: '#14120D', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            {/* Stars */}
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-3.5 w-3.5"
                  fill={i < t.rating ? accent : 'transparent'}
                  style={{ color: i < t.rating ? accent : 'rgba(255,255,255,0.1)' }}
                />
              ))}
            </div>
            {/* Review */}
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ color: 'rgba(237,234,227,0.7)', fontFamily: "'DM Sans', sans-serif" }}
            >
              "{t.review}"
            </p>
            {/* Client name */}
            <p
              className="text-[11px] uppercase tracking-[0.15em] font-medium"
              style={{ color: accent, opacity: 0.8 }}
            >
              {t.clientName}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
