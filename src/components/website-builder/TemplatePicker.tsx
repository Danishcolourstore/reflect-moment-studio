import { useState } from 'react';
import { TEMPLATE_LIST, type TemplateConfig, type TemplateId } from '@/lib/website-templates';
import { Check } from 'lucide-react';

interface TemplatePickerProps {
  selectedId: TemplateId | null;
  onSelect: (id: TemplateId) => void;
  onPreview: (id: TemplateId) => void;
  onContinue: () => void;
}

// Color swatches for each template as visual preview
const TEMPLATE_COLORS: Record<TemplateId, string[]> = {
  reverie: ['#FDFCFB', '#C8A97E', '#2C2422'],
  linen: ['#FFFFFF', '#111111', '#999999'],
  vesper: ['#FAF7F2', '#B8873A', '#1E1916'],
  alabaster: ['#FFFFFF', '#0A0A0A', '#E0E0E0'],
  heirloom: ['#F5F0E8', '#8B6914', '#2A2118'],
};

export function TemplatePicker({ selectedId, onSelect, onPreview, onContinue }: TemplatePickerProps) {
  return (
    <div>
      {/* Header */}
      <div className="text-center mb-10">
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 28,
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
      <div className="space-y-6 max-w-2xl mx-auto">
        {TEMPLATE_LIST.map((tmpl) => {
          const isSelected = selectedId === tmpl.id;
          const colors = TEMPLATE_COLORS[tmpl.id];
          return (
            <div
              key={tmpl.id}
              className="relative overflow-hidden transition-all duration-200"
              style={{
                border: isSelected ? '2px solid #C8A97E' : '1px solid #F0EDE8',
                borderRadius: 4,
              }}
            >
              {/* Selected badge */}
              {isSelected && (
                <div
                  className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#C8A97E' }}
                >
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
              )}

              {/* Preview strip - color blocks representing the template */}
              <div className="w-full h-[200px] relative overflow-hidden" style={{ backgroundColor: colors[0] }}>
                {/* Simulated hero */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=60)',
                    opacity: 0.35,
                  }}
                />
                {/* Template name overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: tmpl.id === 'alabaster' ? 36 : 32,
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
              <div className="p-5" style={{ backgroundColor: colors[0] }}>
                <h3 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 22,
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

                {/* Action buttons */}
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => onPreview(tmpl.id)}
                    className="transition-opacity hover:opacity-70"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                      color: '#999',
                      border: '1px solid #E8E4DE',
                      background: 'none',
                      height: 44,
                      padding: '0 20px',
                      cursor: 'pointer',
                    }}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => onSelect(tmpl.id)}
                    className="transition-opacity hover:opacity-80"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                      color: isSelected ? 'white' : '#C8A97E',
                      backgroundColor: isSelected ? '#C8A97E' : 'transparent',
                      border: '1px solid #C8A97E',
                      height: 44,
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

      {/* Sticky bottom bar */}
      {selectedId && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 px-6 py-4"
          style={{
            backgroundColor: '#FDFCFB',
            borderTop: '1px solid #F0EDE8',
          }}
        >
          <div className="max-w-2xl mx-auto">
            <button
              onClick={onContinue}
              className="w-full transition-opacity hover:opacity-90 cursor-pointer"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: 'white',
                backgroundColor: '#C8A97E',
                border: 'none',
                height: 52,
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
