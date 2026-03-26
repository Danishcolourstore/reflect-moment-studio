import { Check } from 'lucide-react';
import { type WebsiteTemplateValue } from '@/lib/website-templates';
import { useWebsiteTemplates } from '@/hooks/use-website-templates';
import { templatePreviews } from '@/assets/templates';

interface WebsiteTemplateSelectorProps {
  value: WebsiteTemplateValue;
  onChange: (value: WebsiteTemplateValue) => void;
}

export function WebsiteTemplateSelector({ value, onChange }: WebsiteTemplateSelectorProps) {
  const { data: templates = [] } = useWebsiteTemplates();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium mb-1">WEBSITE TEMPLATE</p>
        <p className="text-[11px] text-muted-foreground/40 mb-5">Choose a template for your public portfolio page. Your data auto-fills instantly.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates.map((tmpl) => {
          const isSelected = value === tmpl.value;
          return (
            <button
              key={tmpl.value}
              onClick={() => onChange(tmpl.value as WebsiteTemplateValue)}
              className={`group relative text-left rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 scale-[1.01]'
                  : 'border-border/50 hover:border-border'
              }`}
            >
              {/* Template preview image */}
              <div
                className="relative h-36 overflow-hidden"
                style={{ backgroundColor: tmpl.bg }}
              >
                {templatePreviews[tmpl.value] ? (
                  <img
                    src={templatePreviews[tmpl.value]}
                    alt={`${tmpl.label} template preview`}
                    loading="lazy"
                    width={800}
                    height={600}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                    <p className="text-lg font-light tracking-wide" style={{ fontFamily: tmpl.fontFamily, color: tmpl.text }}>
                      {tmpl.label}
                    </p>
                  </div>
                )}

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="p-3 bg-card border-t border-border/30">
                <p className="text-[11px] font-medium text-foreground">{tmpl.label}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">{tmpl.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
