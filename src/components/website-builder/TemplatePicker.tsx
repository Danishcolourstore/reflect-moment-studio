import { TEMPLATE_LIST, type TemplateId } from '@/lib/website-templates';
import { Check } from 'lucide-react';

interface TemplatePickerProps {
  selectedId: TemplateId | null;
  onSelect: (id: TemplateId) => void;
  onPreview: (id: TemplateId) => void;
  onContinue: () => void;
}

const TEMPLATE_COLORS: Record<TemplateId, string[]> = {
  reverie: ['#FDFCFB', '#1A1A1A', '#2C2422'],
  linen: ['#FFFFFF', '#111111', '#999999'],
  vesper: ['#FAF7F2', '#B8873A', '#1E1916'],
  alabaster: ['#FFFFFF', '#0A0A0A', '#E0E0E0'],
  heirloom: ['#F5F0E8', '#8B6914', '#2A2118'],
};

export function TemplatePicker({ selectedId, onSelect, onPreview, onContinue }: TemplatePickerProps) {
  return (
    <div className="pb-28">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(22px, 5vw, 28px)',
          fontWeight: 400,
          color: '#1C1C1E',
        }}>
          Choose Your Template
        </h2>
        <p className="mt-2" style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: '#999',
        }}>
          Each template is fully customizable
        </p>
      </div>

      {/* Template cards */}
      <div className="space-y-5 sm:space-y-6 max-w-2xl mx-auto">
        {TEMPLATE_LIST.map((tmpl) => {
          const isSelected = selectedId === tmpl.id;
          const colors = TEMPLATE_COLORS[tmpl.id];
          return (
            <div
              key={tmpl.id}
              className="relative overflow-hidden transition-all duration-200"
              style={{
                border: isSelected ? '2px solid #1A1A1A' : '1px solid #F0EDE8',
                borderRadius: 4,
              }}
            >
              {/* Selected badge */}
              {isSelected && (
                <div
                  className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#1A1A1A' }}
                >
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
              )}

              {/* Preview strip */}
              <div
                className="w-full relative overflow-hidden"
                style={{ height: 'clamp(140px, 25vw, 200px)', backgroundColor: colors[0] }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=60)',
                    opacity: 0.35,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: tmpl.id === 'alabaster' ? 'clamp(28px, 5vw, 36px)' : 'clamp(24px, 5vw, 32px)',
                      fontWeight: tmpl.fonts.displayWeight,
                      fontStyle: tmpl.fonts.displayStyle,
                      color: colors[2],
                      lineHeight: 1.1,
                    }}>
                      Studio Name
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      {colors.map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c, border: '1px solid rgba(0,0,0,0.08)' }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 sm:p-5" style={{ backgroundColor: colors[0] }}>
                <h3 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 'clamp(18px, 3vw, 22px)',
                  fontStyle: 'italic',
                  color: '#1C1C1E',
                }}>
                  {tmpl.name}
                </h3>
                <p className="mt-1" style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: '#999',
                }}>
                  {tmpl.tagline} — {tmpl.description}
                </p>

                {/* Action buttons — full width on mobile */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-4">
                  <button
                    onClick={() => onPreview(tmpl.id)}
                    className="transition-opacity hover:opacity-70 active:opacity-50"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                      color: '#999',
                      border: '1px solid #E8E4DE',
                      background: 'none',
                      minHeight: 44,
                      padding: '0 20px',
                      cursor: 'pointer',
                    }}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => onSelect(tmpl.id)}
                    className="transition-opacity hover:opacity-80 active:opacity-60"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                      color: isSelected ? 'white' : '#1A1A1A',
                      backgroundColor: isSelected ? '#1A1A1A' : 'transparent',
                      border: '1px solid #1A1A1A',
                      minHeight: 44,
                      padding: '0 20px',
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky bottom bar with safe area */}
      {selectedId && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 px-4 sm:px-6 pt-4"
          style={{
            backgroundColor: '#FDFCFB',
            borderTop: '1px solid #F0EDE8',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="max-w-2xl mx-auto">
            <button
              onClick={onContinue}
              className="w-full transition-opacity hover:opacity-90 active:opacity-70 cursor-pointer"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: 'white',
                backgroundColor: '#1A1A1A',
                border: 'none',
                minHeight: 52,
              }}
            >
              Continue with {TEMPLATE_LIST.find(t => t.id === selectedId)?.name}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
