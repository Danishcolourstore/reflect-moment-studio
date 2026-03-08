import { useState } from 'react';
import { getTemplate } from '@/lib/website-templates';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

interface WebsiteNewsletterProps {
  id?: string;
  template?: string;
  title?: string;
  description?: string;
  buttonText?: string;
}

export function WebsiteNewsletter({
  id,
  template = 'modern-photography-grid',
  title = 'Follow Our Updates',
  description = 'Subscribe to stay updated with our latest photography work and behind-the-scenes stories.',
  buttonText = 'Subscribe',
}: WebsiteNewsletterProps) {
  const tmpl = getTemplate(template);
  const isModern = template === 'modern-photography-grid';
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success('Thank you for subscribing!');
    setEmail('');
  };

  return (
    <section
      id={id}
      className="py-16 sm:py-24 px-4"
      style={{ backgroundColor: isModern ? '#F8F8F8' : tmpl.cardBg }}
    >
      <div className="max-w-xl mx-auto text-center">
        <h2
          className="text-2xl sm:text-3xl font-light tracking-tight mb-4"
          style={{
            fontFamily: isModern ? '"DM Sans", sans-serif' : tmpl.fontFamily,
            color: isModern ? '#1A1A1A' : tmpl.text,
          }}
        >
          {title}
        </h2>
        <p
          className="text-sm leading-relaxed mb-8"
          style={{ color: isModern ? '#6B6B6B' : tmpl.textSecondary }}
        >
          {description}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: isModern ? '#999' : tmpl.textSecondary }} />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full h-12 pl-10 pr-4 text-sm border rounded-full outline-none transition-colors"
              style={{
                borderColor: isModern ? '#E0E0E0' : `${tmpl.text}20`,
                backgroundColor: isModern ? '#FFFFFF' : tmpl.bg,
                color: isModern ? '#1A1A1A' : tmpl.text,
              }}
              required
            />
          </div>
          <button
            type="submit"
            className="h-12 px-8 text-xs uppercase tracking-[0.2em] rounded-full transition-all duration-300 font-medium"
            style={{
              backgroundColor: isModern ? '#1A1A1A' : tmpl.text,
              color: isModern ? '#FFFFFF' : tmpl.bg,
            }}
          >
            {buttonText}
          </button>
        </form>
      </div>
    </section>
  );
}
