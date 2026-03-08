import { useState } from 'react';
import { Mail, MessageCircle, Globe, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getTemplate } from '@/lib/website-templates';

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
  photographerId?: string;
  id?: string;
}

export function WebsiteContact({ template, branding, photographerId, id }: WebsiteContactProps) {
  const hasContact = branding?.email || branding?.whatsapp || branding?.website;
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '', event_type: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const tmpl = getTemplate(template);
  const accent = branding?.studio_accent_color || '#C6A77B';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!photographerId) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase.from('contact_inquiries').insert({
        photographer_id: photographerId,
        name: formData.name.trim().slice(0, 100),
        email: formData.email.trim().slice(0, 255),
        phone: formData.phone.trim().slice(0, 30) || null,
        message: formData.message.trim().slice(0, 1000),
        event_type: formData.event_type.trim().slice(0, 50) || null,
      }) as any);
      if (error) throw error;
      setSubmitted(true);
      toast.success('Inquiry sent successfully!');
    } catch {
      toast.error('Failed to send inquiry');
    }
    setSubmitting(false);
  };

  if (!hasContact && !photographerId) return null;

  return (
    <section id={id} className="py-24 sm:py-32 px-6" style={{ backgroundColor: tmpl.bg }}>
      <div className="max-w-lg mx-auto text-center space-y-8">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em]" style={{ color: accent, opacity: 0.7 }}>
          Get in Touch
        </p>
        <h3 className="text-3xl sm:text-4xl font-light tracking-wide" style={{ color: tmpl.text, fontFamily: tmpl.fontFamily }}>
          Let's Create Together
        </h3>
        <div className="w-10 h-[1px] mx-auto" style={{ backgroundColor: accent, opacity: 0.4 }} />

        {/* Contact buttons */}
        {hasContact && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {branding?.email && (
              <a href={`mailto:${branding.email}`}>
                <Button variant="outline" className="h-11 text-[10px] uppercase tracking-[0.15em] rounded-none px-8 transition-all duration-300 hover:scale-[1.02]"
                  style={{ borderColor: accent, color: accent, backgroundColor: 'transparent' }}>
                  <Mail className="h-3.5 w-3.5 mr-2" /> Email Me
                </Button>
              </a>
            )}
            {branding?.whatsapp && (
              <a href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="h-11 text-[10px] uppercase tracking-[0.15em] rounded-none px-8 transition-all duration-300 hover:scale-[1.02]"
                  style={{ borderColor: accent, color: accent, backgroundColor: 'transparent' }}>
                  <MessageCircle className="h-3.5 w-3.5 mr-2" /> WhatsApp
                </Button>
              </a>
            )}
            {branding?.website && (
              <a href={branding.website.startsWith('http') ? branding.website : `https://${branding.website}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="h-11 text-[10px] uppercase tracking-[0.15em] rounded-none px-8 transition-all duration-300 hover:scale-[1.02]"
                  style={{ borderColor: accent, color: accent, backgroundColor: 'transparent' }}>
                  <Globe className="h-3.5 w-3.5 mr-2" /> Website
                </Button>
              </a>
            )}
          </div>
        )}

        {/* Inquiry Form */}
        {photographerId && !submitted && (
          <form onSubmit={handleSubmit} className="text-left space-y-4 pt-6">
            <div className="w-full h-[1px] mb-4" style={{ backgroundColor: tmpl.text, opacity: 0.06 }} />
            <p className="text-[10px] uppercase tracking-[0.25em] text-center mb-4" style={{ color: tmpl.textSecondary }}>
              Or send an inquiry
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="Your Name *" maxLength={100} required
                className="h-11 px-4 text-sm rounded-lg border bg-transparent outline-none focus:ring-1 transition-all"
                style={{ borderColor: `${tmpl.text}15`, color: tmpl.text, fontFamily: tmpl.uiFontFamily }}
              />
              <input
                type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="Email *" maxLength={255} required
                className="h-11 px-4 text-sm rounded-lg border bg-transparent outline-none focus:ring-1 transition-all"
                style={{ borderColor: `${tmpl.text}15`, color: tmpl.text, fontFamily: tmpl.uiFontFamily }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                placeholder="Phone (optional)" maxLength={30}
                className="h-11 px-4 text-sm rounded-lg border bg-transparent outline-none focus:ring-1 transition-all"
                style={{ borderColor: `${tmpl.text}15`, color: tmpl.text, fontFamily: tmpl.uiFontFamily }}
              />
              <input
                value={formData.event_type} onChange={e => setFormData(p => ({ ...p, event_type: e.target.value }))}
                placeholder="Event Type (optional)" maxLength={50}
                className="h-11 px-4 text-sm rounded-lg border bg-transparent outline-none focus:ring-1 transition-all"
                style={{ borderColor: `${tmpl.text}15`, color: tmpl.text, fontFamily: tmpl.uiFontFamily }}
              />
            </div>
            <textarea
              value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
              placeholder="Tell me about your event... *" maxLength={1000} required rows={4}
              className="w-full px-4 py-3 text-sm rounded-lg border bg-transparent outline-none focus:ring-1 transition-all resize-none"
              style={{ borderColor: `${tmpl.text}15`, color: tmpl.text, fontFamily: tmpl.uiFontFamily }}
            />
            <div className="text-center">
              <button
                type="submit" disabled={submitting}
                className="inline-flex items-center gap-2 h-12 px-10 text-[10px] uppercase tracking-[0.2em] font-medium transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                style={{ backgroundColor: accent, color: tmpl.bg, borderRadius: '2px' }}
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Send Inquiry
              </button>
            </div>
          </form>
        )}

        {submitted && (
          <div className="py-8 text-center">
            <p className="text-lg font-light" style={{ color: tmpl.text, fontFamily: tmpl.fontFamily }}>Thank you!</p>
            <p className="text-sm mt-2" style={{ color: tmpl.textSecondary }}>Your inquiry has been sent. I'll get back to you soon.</p>
          </div>
        )}
      </div>
    </section>
  );
}
