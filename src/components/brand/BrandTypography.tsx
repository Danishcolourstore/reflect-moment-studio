import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Type, Sparkles } from 'lucide-react';
import { useGoogleFonts } from '@/hooks/use-google-fonts';

const HEADING_FONTS = [
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond', category: 'Editorial Serif' },
  { value: 'Playfair Display', label: 'Playfair Display', category: 'Editorial Serif' },
  { value: 'EB Garamond', label: 'EB Garamond', category: 'Editorial Serif' },
  { value: 'Jost', label: 'Jost', category: 'Modern Sans' },
  { value: 'DM Sans', label: 'DM Sans', category: 'Modern Sans' },
  { value: 'Inter', label: 'Inter', category: 'Modern Sans' },
  { value: 'Great Vibes', label: 'Great Vibes', category: 'Romantic Script' },
  { value: 'Parisienne', label: 'Parisienne', category: 'Romantic Script' },
];

const BODY_FONTS = [
  { value: 'Jost', label: 'Jost' },
  { value: 'DM Sans', label: 'DM Sans' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond' },
];

export interface BrandPreset {
  id: string;
  label: string;
  description: string;
  headingFont: string;
  bodyFont: string;
}

export const BRAND_PRESETS: BrandPreset[] = [
  { id: 'wedding-luxury', label: 'Wedding Luxury', description: 'Elegant serif pairing for luxury weddings', headingFont: 'Playfair Display', bodyFont: 'DM Sans' },
  { id: 'modern-minimal', label: 'Modern Minimal', description: 'Clean sans-serif for contemporary studios', headingFont: 'Jost', bodyFont: 'Inter' },
  { id: 'cinematic-dark', label: 'Cinematic Dark', description: 'Bold editorial look for cinematic work', headingFont: 'EB Garamond', bodyFont: 'Jost' },
  { id: 'editorial-vogue', label: 'Editorial Vogue', description: 'High-fashion editorial typography', headingFont: 'Cormorant Garamond', bodyFont: 'Jost' },
];

interface Props {
  headingFont: string;
  bodyFont: string;
  activePreset: string;
  onHeadingFontChange: (v: string) => void;
  onBodyFontChange: (v: string) => void;
  onPresetChange: (preset: BrandPreset) => void;
}

const BrandTypography = ({ headingFont, bodyFont, activePreset, onHeadingFontChange, onBodyFontChange, onPresetChange }: Props) => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium mb-4">TYPOGRAPHY PRESETS</p>
        <div className="grid grid-cols-2 gap-2">
          {BRAND_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => onPresetChange(preset)}
              className={`text-left p-3 rounded-xl border transition-all ${
                activePreset === preset.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-card hover:border-muted-foreground/20'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3 w-3 text-primary/60" />
                <p className="text-[11px] font-medium text-foreground">{preset.label}</p>
              </div>
              <p className="text-[9px] text-muted-foreground/50">{preset.description}</p>
              <div className="mt-2 space-y-0.5">
                <p className="text-[13px] truncate" style={{ fontFamily: `'${preset.headingFont}', serif` }}>
                  {preset.headingFont}
                </p>
                <p className="text-[10px] text-muted-foreground/40" style={{ fontFamily: `'${preset.bodyFont}', sans-serif` }}>
                  {preset.bodyFont}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium mb-4">CUSTOM FONTS</p>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Heading Font</label>
            <Select value={headingFont} onValueChange={onHeadingFontChange}>
              <SelectTrigger className="mt-1 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HEADING_FONTS.map(f => (
                  <SelectItem key={f.value} value={f.value}>
                    <span style={{ fontFamily: `'${f.value}', serif` }}>{f.label}</span>
                    <span className="text-[9px] text-muted-foreground/40 ml-2">({f.category})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Body Font</label>
            <Select value={bodyFont} onValueChange={onBodyFontChange}>
              <SelectTrigger className="mt-1 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BODY_FONTS.map(f => (
                  <SelectItem key={f.value} value={f.value}>
                    <span style={{ fontFamily: `'${f.value}', sans-serif` }}>{f.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Live type preview */}
      <div className="border border-border rounded-xl p-5 bg-card/50">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/40 font-medium mb-3">PREVIEW</p>
        <h3 className="text-xl font-semibold text-foreground mb-1" style={{ fontFamily: `'${headingFont}', serif` }}>
          The Art of Light
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: `'${bodyFont}', sans-serif` }}>
          Every photograph tells a story — a fleeting moment captured in light and shadow, preserved forever.
        </p>
      </div>
    </div>
  );
};

export default BrandTypography;
