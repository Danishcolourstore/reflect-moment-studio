import { type TemplateConfig } from '@/lib/website-templates';

interface ContactSectionProps {
  template: TemplateConfig;
  email?: string;
  phone?: string;
  instagram?: string;
  id?: string;
}

export function ContactSection({ template, email = 'hello@studio.com', phone = '+91 98765 43210', instagram = '@yourstudio', id }: ContactSectionProps) {
  const t = template;
  const variant = t.sections.contact;

  const formFields = (
    fieldStyle: React.CSSProperties,
    labelStyle: React.CSSProperties,
    submitStyle: React.CSSProperties,
    submitLabel: string,
  ) => (
    <div className="space-y-6">
      {['Name', 'Email', 'Message'].map((field) => (
        <div key={field}>
          <label style={labelStyle}>{field}</label>
          {field === 'Message' ? (
            <textarea rows={4} className="w-full resize-none outline-none mt-2" style={fieldStyle} placeholder={`Your ${field.toLowerCase()}`} />
          ) : (
            <input type={field === 'Email' ? 'email' : 'text'} className="w-full outline-none mt-2" style={fieldStyle} placeholder={`Your ${field.toLowerCase()}`} />
          )}
        </div>
      ))}
      <button className="transition-opacity hover:opacity-70 cursor-pointer" style={submitStyle}>
        {submitLabel}
      </button>
    </div>
  );

  /* ── Minimal (Reverie, Vesper, Heirloom) ── */
  if (variant === 'minimal') {
    const isVesper = t.id === 'vesper';
    const isHeirloom = t.id === 'heirloom';
    return (
      <section id={id} className="py-16 sm:py-24 px-6 sm:px-10" style={{ backgroundColor: t.colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center mb-12" style={{
            fontFamily: t.fonts.display,
            fontSize: isVesper ? 48 : isHeirloom ? 48 : 42,
            fontWeight: t.fonts.displayWeight,
            fontStyle: t.fonts.displayStyle === 'italic' || isHeirloom ? 'italic' : 'normal',
            color: t.colors.text,
          }}>
            {isVesper ? "Let's make something beautiful" : isHeirloom ? 'Begin Your Story' : 'Get in Touch'}
          </h2>
          <div className="flex flex-col sm:flex-row gap-12">
            {/* Contact info */}
            <div className="sm:w-1/3 space-y-3">
              <p style={{ fontFamily: t.fonts.ui, fontSize: 13, color: t.colors.textSecondary }}>{email}</p>
              <p style={{ fontFamily: t.fonts.ui, fontSize: 13, color: t.colors.textSecondary }}>{phone}</p>
              <p style={{ fontFamily: t.fonts.ui, fontSize: 13, color: t.colors.accent }}>{instagram}</p>
            </div>
            {/* Form */}
            <div className="sm:w-2/3">
              {formFields(
                {
                  fontFamily: t.fonts.ui,
                  fontSize: 14,
                  border: 'none',
                  borderBottom: `1px solid ${t.colors.border}`,
                  padding: '8px 0',
                  background: 'transparent',
                  color: t.colors.text,
                },
                {
                  fontFamily: t.fonts.ui,
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                  color: '#AAAAAA',
                },
                isVesper || isHeirloom ? {
                  fontFamily: t.fonts.ui,
                  fontSize: 13,
                  letterSpacing: '0.1em',
                  backgroundColor: isHeirloom ? t.colors.text : t.colors.accent,
                  color: isHeirloom ? t.colors.bg : 'white',
                  border: 'none',
                  width: '100%',
                  height: 52,
                  textTransform: 'uppercase' as const,
                } : {
                  fontFamily: t.fonts.ui,
                  fontSize: 12,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  color: t.colors.accent,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                },
                isVesper ? 'Send Message' : isHeirloom ? 'Begin' : 'Send a Message',
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ── Two Column (Linen) ── */
  if (variant === 'two-col') {
    return (
      <section id={id} className="py-16 sm:py-24 px-6 sm:px-10" style={{ backgroundColor: t.colors.bg }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center mb-12" style={{
            fontFamily: t.fonts.display,
            fontSize: 42,
            fontWeight: t.fonts.displayWeight,
            color: t.colors.text,
          }}>
            Contact
          </h2>
          <div className="flex flex-col sm:flex-row gap-12">
            <div className="sm:w-1/2">
              {formFields(
                {
                  fontFamily: t.fonts.ui,
                  fontSize: 14,
                  border: `1px solid ${t.colors.border}`,
                  padding: '10px 12px',
                  height: 44,
                  background: 'transparent',
                  color: t.colors.text,
                },
                {
                  fontFamily: t.fonts.ui,
                  fontSize: 11,
                  color: t.colors.textSecondary,
                  marginBottom: 4,
                },
                {
                  fontFamily: t.fonts.ui,
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                  backgroundColor: t.colors.text,
                  color: 'white',
                  border: 'none',
                  width: '100%',
                  height: 44,
                },
                'Send Message',
              )}
            </div>
            <div className="sm:w-1/2 rounded overflow-hidden" style={{ backgroundColor: '#F0F0F0', minHeight: 300 }}>
              <div className="w-full h-full flex items-center justify-center" style={{ fontFamily: t.fonts.ui, fontSize: 13, color: '#999' }}>
                Map / Image
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ── Split Dark (Alabaster) ── */
  return (
    <section id={id} className="flex flex-col sm:flex-row" style={{ minHeight: 500 }}>
      <div className="sm:w-1/2 flex flex-col justify-center px-8 sm:px-12 py-16" style={{ backgroundColor: '#0A0A0A' }}>
        <h2 style={{
          fontFamily: t.fonts.display,
          fontSize: 42,
          fontWeight: '300',
          color: 'white',
          marginBottom: 20,
        }}>
          Contact
        </h2>
        <p style={{ fontFamily: t.fonts.ui, fontSize: 14, color: '#999', lineHeight: 1.8, fontWeight: '300' }}>{email}</p>
        <p style={{ fontFamily: t.fonts.ui, fontSize: 14, color: '#999', fontWeight: '300' }}>{phone}</p>
      </div>
      <div className="sm:w-1/2 flex flex-col justify-center px-8 sm:px-12 py-16" style={{ backgroundColor: t.colors.bg }}>
        {formFields(
          {
            fontFamily: t.fonts.ui,
            fontSize: 14,
            fontWeight: '300',
            border: 'none',
            borderBottom: `1px solid ${t.colors.border}`,
            padding: '8px 0',
            background: 'transparent',
            color: t.colors.text,
          },
          {
            fontFamily: t.fonts.ui,
            fontSize: 10,
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            color: '#999',
            fontWeight: '300',
          },
          {
            fontFamily: t.fonts.ui,
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            color: t.colors.text,
            background: 'none',
            border: 'none',
            padding: 0,
            fontWeight: '300',
          },
          'Send',
        )}
      </div>
    </section>
  );
}
