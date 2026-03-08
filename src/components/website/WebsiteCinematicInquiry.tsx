import { useState } from 'react';
import { MessageCircle, Instagram, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Props {
  branding?: {
    studio_name: string;
    studio_accent_color: string | null;
    email?: string | null;
    whatsapp?: string | null;
    instagram?: string | null;
  } | null;
  id?: string;
}

export function WebsiteCinematicInquiry({ branding, id }: Props) {
  const fontSerif = '"Cormorant Garamond", Georgia, serif';
  const fontSans = '"DM Sans", sans-serif';
  const textColor = '#1A1715';
  const secondaryColor = '#7A756E';
  const borderColor = 'rgba(26,23,21,0.15)';

  const [form, setForm] = useState({ name: '', email: '', date: '', location: '', message: '' });

  return (
    <section id={id} className="py-24 sm:py-36 px-6 sm:px-12" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p
            className="text-[10px] sm:text-xs uppercase tracking-[0.4em] mb-4"
            style={{ color: secondaryColor, fontFamily: fontSans }}
          >
            Get in Touch
          </p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-light lowercase tracking-[0.02em]"
            style={{ fontFamily: fontSerif, color: textColor }}
          >
            let's tell your story
          </h2>
          <div className="mt-6 w-16 h-[1px] mx-auto" style={{ backgroundColor: borderColor }} />
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-[0.2em]" style={{ color: secondaryColor, fontFamily: fontSans }}>
                Your Name
              </Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                className="h-12 rounded-none border-b bg-transparent px-0 focus-visible:ring-0"
                style={{ borderColor, color: textColor, fontFamily: fontSans }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-[0.2em]" style={{ color: secondaryColor, fontFamily: fontSans }}>
                Email
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
                className="h-12 rounded-none border-b bg-transparent px-0 focus-visible:ring-0"
                style={{ borderColor, color: textColor, fontFamily: fontSans }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-[0.2em]" style={{ color: secondaryColor, fontFamily: fontSans }}>
                Event Date
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="h-12 rounded-none border-b bg-transparent px-0 focus-visible:ring-0"
                style={{ borderColor, color: textColor, fontFamily: fontSans }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-[0.2em]" style={{ color: secondaryColor, fontFamily: fontSans }}>
                Wedding Location
              </Label>
              <Input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="City, Country"
                className="h-12 rounded-none border-b bg-transparent px-0 focus-visible:ring-0"
                style={{ borderColor, color: textColor, fontFamily: fontSans }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-[0.2em]" style={{ color: secondaryColor, fontFamily: fontSans }}>
              Message
            </Label>
            <Textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Tell us about your wedding day..."
              rows={4}
              className="rounded-none border-b bg-transparent px-0 resize-none focus-visible:ring-0"
              style={{ borderColor, color: textColor, fontFamily: fontSans }}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              className="h-14 px-14 text-[11px] uppercase tracking-[0.3em] border transition-all duration-500 hover:bg-[#1A1715] hover:text-[#FAF8F5]"
              style={{ borderColor: textColor, color: textColor, backgroundColor: 'transparent' }}
            >
              Send Inquiry
            </button>
            {branding?.whatsapp && (
              <a
                href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-14 px-10 text-[11px] uppercase tracking-[0.3em] border inline-flex items-center justify-center gap-2 transition-all duration-500 hover:bg-[#25D366] hover:text-white hover:border-[#25D366]"
                style={{ borderColor, color: textColor }}
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-14 pt-10" style={{ borderTop: `1px solid ${borderColor}` }}>
          {branding?.instagram && (
            <a
              href={`https://instagram.com/${branding.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-70"
              style={{ color: textColor }}
            >
              <Instagram className="h-3.5 w-3.5" /> Instagram
            </a>
          )}
          {branding?.email && (
            <a
              href={`mailto:${branding.email}`}
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-70"
              style={{ color: textColor }}
            >
              <Mail className="h-3.5 w-3.5" /> {branding.email}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
