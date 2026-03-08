import { useState } from 'react';
import { Instagram, MessageCircle, Mail } from 'lucide-react';
import { getTemplate } from '@/lib/website-templates';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface WebsiteInquiryFormProps {
  template?: string;
  branding?: {
    studio_name: string;
    studio_accent_color: string | null;
    email?: string | null;
    whatsapp?: string | null;
    instagram?: string | null;
  } | null;
  accent?: string;
  id?: string;
}

/**
 * Luxury inquiry / contact form section with Name, Email, Event Date, Message.
 * Includes WhatsApp + Instagram quick-link buttons.
 */
export function WebsiteInquiryForm({
  template = 'editorial-luxury',
  branding,
  accent = '#8B7355',
  id,
}: WebsiteInquiryFormProps) {
  const tmpl = getTemplate(template);
  const isEditorial = template === 'editorial-luxury';
  const isCinematic = template === 'cinematic-wedding-story';
  const bgColor = isCinematic ? '#FAF8F5' : isEditorial ? '#EFEBE5' : tmpl.bg;
  const textColor = isCinematic ? '#1A1715' : isEditorial ? '#2B2A28' : tmpl.text;
  const secondaryColor = isCinematic ? '#7A756E' : isEditorial ? '#6B6560' : tmpl.textSecondary;
  const borderColor = isCinematic ? 'rgba(26,23,21,0.15)' : isEditorial ? '#D5CEC5' : `${tmpl.text}20`;
  const fontSerif = isCinematic ? '"Cormorant Garamond", Georgia, serif' : '"Playfair Display", Georgia, serif';

  const [form, setForm] = useState({ name: '', email: '', date: '', message: '' });

  return (
    <section id={id} className="py-24 sm:py-36 px-6 sm:px-12" style={{ backgroundColor: bgColor }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p
            className="text-[10px] sm:text-xs uppercase tracking-[0.4em] mb-4"
            style={{ color: accent, fontFamily: '"DM Sans", sans-serif' }}
          >
            Get in Touch
          </p>
          <h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-light ${isCinematic ? 'uppercase tracking-[0.04em]' : 'italic'}`}
            style={{ fontFamily: fontSerif, color: textColor }}
          >
            Let's Create Something Beautiful
          </h2>
          <div className="mt-6 w-16 h-[1px] mx-auto" style={{ backgroundColor: borderColor }} />
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{ color: secondaryColor, fontFamily: '"DM Sans", sans-serif' }}
              >
                Your Name
              </Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                className="h-12 rounded-none border-b bg-transparent px-0 focus-visible:ring-0"
                style={{ borderColor, color: textColor, fontFamily: '"DM Sans", sans-serif' }}
              />
            </div>
            <div className="space-y-2">
              <Label
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{ color: secondaryColor, fontFamily: '"DM Sans", sans-serif' }}
              >
                Email
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
                className="h-12 rounded-none border-b bg-transparent px-0 focus-visible:ring-0"
                style={{ borderColor, color: textColor, fontFamily: '"DM Sans", sans-serif' }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: secondaryColor, fontFamily: '"DM Sans", sans-serif' }}
            >
              Event Date
            </Label>
            <Input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="h-12 rounded-none border-b bg-transparent px-0 focus-visible:ring-0"
              style={{ borderColor, color: textColor, fontFamily: '"DM Sans", sans-serif' }}
            />
          </div>

          <div className="space-y-2">
            <Label
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: secondaryColor, fontFamily: '"DM Sans", sans-serif' }}
            >
              Message
            </Label>
            <Textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Tell us about your event..."
              rows={4}
              className="rounded-none border-b bg-transparent px-0 resize-none focus-visible:ring-0"
              style={{ borderColor, color: textColor, fontFamily: '"DM Sans", sans-serif' }}
            />
          </div>

          <div className="pt-4">
            <button
              className="h-14 px-14 text-[11px] uppercase tracking-[0.3em] border transition-all duration-500 hover:bg-[#2B2A28] hover:text-[#F5F0EA] w-full sm:w-auto"
              style={{ borderColor: textColor, color: textColor, backgroundColor: 'transparent' }}
            >
              Send Inquiry
            </button>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-14 pt-10" style={{ borderTop: `1px solid ${borderColor}` }}>
          {branding?.whatsapp && (
            <a
              href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-10 px-6 text-[10px] uppercase tracking-[0.2em] border transition-all duration-300 hover:opacity-70"
              style={{ borderColor, color: textColor }}
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          )}
          {branding?.instagram && (
            <a
              href={`https://instagram.com/${branding.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-10 px-6 text-[10px] uppercase tracking-[0.2em] border transition-all duration-300 hover:opacity-70"
              style={{ borderColor, color: textColor }}
            >
              <Instagram className="h-3.5 w-3.5" /> Instagram
            </a>
          )}
          {branding?.email && (
            <a
              href={`mailto:${branding.email}`}
              className="inline-flex items-center gap-2 h-10 px-6 text-[10px] uppercase tracking-[0.2em] border transition-all duration-300 hover:opacity-70"
              style={{ borderColor, color: textColor }}
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
