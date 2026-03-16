import { useState, useCallback } from 'react';
import { Instagram, MessageCircle, Mail } from 'lucide-react';
import { getTemplate } from '@/lib/website-templates';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WebsiteInquiryFormProps {
  template?: string;
  branding?: {
    studio_name: string;
    studio_accent_color: string | null;
    email?: string | null;
    whatsapp?: string | null;
    instagram?: string | null;
    user_id?: string;
  } | null;
  accent?: string;
  id?: string;
}

type FormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
};

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string) {
  if (!phone) return true; // optional
  // Indian phone: 10 digits, optionally starting with +91
  return /^(\+91[\s-]?)?[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ''));
}

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

  const [form, setForm] = useState({ name: '', email: '', phone: '', date: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = useCallback((): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'Name is required';
    else if (form.name.trim().length > 100) e.name = 'Name must be under 100 characters';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!validateEmail(form.email)) e.email = 'Please enter a valid email';
    if (form.phone && !validatePhone(form.phone)) e.phone = 'Enter a valid Indian phone number (e.g. +91 98765 43210)';
    if (!form.message.trim()) e.message = 'Message is required';
    else if (form.message.trim().length > 1000) e.message = 'Message must be under 1000 characters';
    return e;
  }, [form]);

  const isValid = !form.name.trim() || !form.email.trim() || !form.message.trim() ? false : Object.keys(validate()).length === 0;

  const handleSubmit = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('contact_submissions').insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        event_date: form.date || null,
        message: form.message.trim(),
        site_owner_id: (branding as any)?.user_id || '',
      } as any);

      if (error) throw error;

      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', date: '', message: '' });
      toast.success('Inquiry sent successfully! We\'ll get back to you soon.');
    } catch (err) {
      toast.error('Failed to send inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const errorStyle = { color: '#DC2626', fontSize: '11px', marginTop: '4px', fontFamily: '"DM Sans", sans-serif' };

  return (
    <section id={id} className="py-24 sm:py-36 px-6 sm:px-12" style={{ backgroundColor: bgColor }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] mb-4" style={{ color: accent, fontFamily: '"DM Sans", sans-serif' }}>
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

        {submitted ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-light mb-2" style={{ fontFamily: fontSerif, color: textColor }}>Thank You!</h3>
            <p className="text-sm" style={{ color: secondaryColor }}>Your inquiry has been sent. We'll get back to you within 24 hours.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-6 text-xs uppercase tracking-[0.2em] underline underline-offset-4"
              style={{ color: accent }}
            >
              Send another inquiry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-[0.2em]" style={{ color: secondaryColor, fontFamily: '"DM Sans", sans-serif' }}>
                  Your Name *
                </Label>
                <Input
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(e2 => ({ ...e2, name: undefined })); }}
                  placeholder="Full name"
                  className="h-12 rounded-none border-b bg-transparent px-0 focus-visible:ring-0"
                  style={{ borderColor: errors.name ? '#DC2626' : borderColor, color: textColor, fontFamily: '"DM Sans", sans-serif' }}
                  maxLength={100}
                />
                {errors.name && <p style={errorStyle}>{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-[0.2em]" style={{ color: secondaryColor, fontFamily: '"DM Sans", sans-serif' }}>
                  Email *
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(e2 => ({ ...e2, email: undefined })); }}
                  placeholder="your@email.com"
                  className="h-12 rounded-none border-b bg-transparent px-0 focus-visible:ring-0"
                  style={{ borderColor: errors.email ? '#DC2626' : borderColor, color: textColor, fontFamily: '"DM Sans", sans-serif' }}
                  maxLength={255}
                />
                {errors.email && <p style={errorStyle}>{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-[0.2em]" style={{ color: secondaryColor, fontFamily: '"DM Sans", sans-serif' }}>
                  Phone
                </Label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setErrors(e2 => ({ ...e2, phone: undefined })); }}
                  placeholder="+91 98765 43210"
                  className="h-12 rounded-none border-b bg-transparent px-0 focus-visible:ring-0"
                  style={{ borderColor: errors.phone ? '#DC2626' : borderColor, color: textColor, fontFamily: '"DM Sans", sans-serif' }}
                />
                {errors.phone && <p style={errorStyle}>{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-[0.2em]" style={{ color: secondaryColor, fontFamily: '"DM Sans", sans-serif' }}>
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
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-[0.2em]" style={{ color: secondaryColor, fontFamily: '"DM Sans", sans-serif' }}>
                Message *
              </Label>
              <Textarea
                value={form.message}
                onChange={e => { setForm(f => ({ ...f, message: e.target.value })); setErrors(e2 => ({ ...e2, message: undefined })); }}
                placeholder="Tell us about your event..."
                rows={4}
                className="rounded-none border-b bg-transparent px-0 resize-none focus-visible:ring-0"
                style={{ borderColor: errors.message ? '#DC2626' : borderColor, color: textColor, fontFamily: '"DM Sans", sans-serif' }}
                maxLength={1000}
              />
              {errors.message && <p style={errorStyle}>{errors.message}</p>}
              <p className="text-[10px] text-right" style={{ color: secondaryColor, opacity: 0.5 }}>{form.message.length}/1000</p>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSubmit}
                disabled={submitting || !isValid}
                className="h-14 px-14 text-[11px] uppercase tracking-[0.3em] border transition-all duration-500 hover:bg-[#2B2A28] hover:text-[#F5F0EA] w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: textColor, color: textColor, backgroundColor: 'transparent' }}
              >
                {submitting ? 'Sending...' : 'Send Inquiry'}
              </button>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-14 pt-10" style={{ borderTop: `1px solid ${borderColor}` }}>
          {branding?.whatsapp && (
            <a
              href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi, I saw your portfolio and I\'m interested in booking. Can we discuss?')}`}
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
