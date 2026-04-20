import type { SectionType, SectionSettings } from './section-configs';
import { EditorSlider } from './EditorSlider';
import { SegmentedGroup, Stepper, ToggleSwitch, ColorSwatchRow, ControlDivider } from './EditorControls';

interface EditorTabControlsProps {
  sectionType: SectionType;
  activeTab: string;
  settings: SectionSettings;
  onChange: (patch: Partial<SectionSettings>) => void;
}

/**
 * Renders the correct controls for a given tab + section type combo.
 */
export function EditorTabControls({ sectionType, activeTab, settings, onChange }: EditorTabControlsProps) {
  const s = settings;

  // ── Content tab ──
  if (activeTab === 'content') {
    return (
      <div className="space-y-1">
        {s.heading !== undefined && (
          <InlineTextControl
            label="Heading"
            value={s.heading || ''}
            onChange={(v) => onChange({ heading: v })}
          />
        )}
        {s.subtitle !== undefined && (
          <InlineTextControl
            label="Subtitle"
            value={s.subtitle || ''}
            onChange={(v) => onChange({ subtitle: v })}
          />
        )}
        {s.ctaText !== undefined && (
          <InlineTextControl
            label="CTA Text"
            value={s.ctaText || ''}
            onChange={(v) => onChange({ ctaText: v })}
          />
        )}
        {s.ctaVisible !== undefined && (
          <ToggleSwitch
            label="Show CTA"
            checked={s.ctaVisible}
            onChange={(v) => onChange({ ctaVisible: v })}
          />
        )}
        {s.bodyText !== undefined && (
          <div className="py-2">
            <span className="text-[11px] text-[#999] font-medium tracking-wide uppercase select-none block mb-1.5">
              Body Text
            </span>
            <textarea
              className="w-full min-h-[88px] p-3 rounded-lg text-[14px] text-white resize-none"
              style={{
                backgroundColor: '#2c2c2e',
                fontFamily: "'DM Sans', sans-serif",
                border: 'none',
                outline: 'none',
              }}
              value={s.bodyText}
              onChange={(e) => onChange({ bodyText: e.target.value })}
            />
          </div>
        )}
        {s.showExcerpt !== undefined && (
          <ToggleSwitch
            label="Show Excerpt"
            checked={s.showExcerpt}
            onChange={(v) => onChange({ showExcerpt: v })}
          />
        )}
        {s.showPhone !== undefined && (
          <ToggleSwitch
            label="Show Phone"
            checked={s.showPhone}
            onChange={(v) => onChange({ showPhone: v })}
          />
        )}
        {s.showAddress !== undefined && (
          <ToggleSwitch
            label="Show Address"
            checked={s.showAddress}
            onChange={(v) => onChange({ showAddress: v })}
          />
        )}
      </div>
    );
  }

  // ── Media tab ──
  if (activeTab === 'media') {
    return (
      <div className="space-y-1">
        {s.heroImageUrl !== undefined && (
          <div className="py-2">
            <span className="text-[11px] text-[#999] font-medium tracking-wide uppercase select-none block mb-2">
              Hero Image
            </span>
            <div
              className="relative aspect-video rounded-lg overflow-hidden mb-2"
              style={{ backgroundColor: '#2c2c2e' }}
            >
              {s.heroImageUrl && (
                <img src={s.heroImageUrl} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              )}
            </div>
            <div className="flex gap-2">
              {['Upload', 'Unsplash', 'AI Generate'].map((label) => (
                <button
                  key={label}
                  className="flex-1 min-h-[44px] rounded-lg text-[11px] font-medium uppercase tracking-wide text-[#999]"
                  style={{ backgroundColor: '#2c2c2e' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        {s.overlayOpacity !== undefined && (
          <EditorSlider
            label="Overlay Opacity"
            value={s.overlayOpacity}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => onChange({ overlayOpacity: v })}
          />
        )}
        {s.imageFit !== undefined && (
          <SegmentedGroup
            label="Image Fit"
            options={[
              { value: 'cover', label: 'Cover' },
              { value: 'contain', label: 'Contain' },
              { value: 'fill', label: 'Fill' },
            ]}
            value={s.imageFit}
            onChange={(v) => onChange({ imageFit: v as 'cover' | 'contain' | 'fill' })}
          />
        )}
      </div>
    );
  }

  // ── Cards tab (testimonials) ──
  if (activeTab === 'cards') {
    return (
      <div className="space-y-1">
        <Stepper
          label="Card Count"
          value={s.cardCount || 3}
          min={1}
          max={6}
          onChange={(v) => onChange({ cardCount: v })}
        />
        <ToggleSwitch
          label="Show Stars"
          checked={s.showStars || false}
          onChange={(v) => onChange({ showStars: v })}
        />
        {s.showStars && (
          <Stepper
            label="Star Count"
            value={s.starCount || 5}
            min={1}
            max={5}
            onChange={(v) => onChange({ starCount: v })}
          />
        )}
        <ColorSwatchRow
          label="Card Background"
          value={s.cardBackground || '#ffffff'}
          onChange={(v) => onChange({ cardBackground: v })}
        />
      </div>
    );
  }

  // ── Layout tab ──
  if (activeTab === 'layout') {
    return (
      <div className="space-y-1">
        {s.textAlign !== undefined && (
          <SegmentedGroup
            label="Text Align"
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
            value={s.textAlign}
            onChange={(v) => onChange({ textAlign: v as 'left' | 'center' | 'right' })}
          />
        )}
        <EditorSlider
          label="Padding Top"
          value={s.paddingTop}
          min={0}
          max={200}
          unit="px"
          onChange={(v) => onChange({ paddingTop: v })}
        />
        <EditorSlider
          label="Padding Bottom"
          value={s.paddingBottom}
          min={0}
          max={200}
          unit="px"
          onChange={(v) => onChange({ paddingBottom: v })}
        />
        {s.columns !== undefined && (
          <Stepper
            label="Columns"
            value={s.columns}
            min={1}
            max={6}
            onChange={(v) => onChange({ columns: v })}
          />
        )}
        {s.gap !== undefined && (
          <EditorSlider
            label="Gap"
            value={s.gap}
            min={0}
            max={48}
            unit="px"
            onChange={(v) => onChange({ gap: v })}
          />
        )}
        {s.postsToShow !== undefined && (
          <Stepper
            label="Posts to Show"
            value={s.postsToShow}
            min={1}
            max={12}
            onChange={(v) => onChange({ postsToShow: v })}
          />
        )}
      </div>
    );
  }

  // ── Style tab ──
  if (activeTab === 'style') {
    return (
      <div className="space-y-1">
        {s.headingSize !== undefined && (
          <EditorSlider
            label="Heading Size"
            value={s.headingSize}
            min={16}
            max={96}
            unit="px"
            onChange={(v) => onChange({ headingSize: v })}
          />
        )}
        {s.subtitleSize !== undefined && (
          <EditorSlider
            label="Subtitle Size"
            value={s.subtitleSize}
            min={10}
            max={24}
            unit="px"
            onChange={(v) => onChange({ subtitleSize: v })}
          />
        )}
        {s.bodySize !== undefined && (
          <EditorSlider
            label="Body Size"
            value={s.bodySize}
            min={12}
            max={28}
            unit="px"
            onChange={(v) => onChange({ bodySize: v })}
          />
        )}
        {s.lineHeight !== undefined && (
          <EditorSlider
            label="Line Height"
            value={Math.round(s.lineHeight * 10)}
            min={10}
            max={30}
            step={1}
            unit=""
            onChange={(v) => onChange({ lineHeight: v / 10 })}
          />
        )}
        {s.borderRadius !== undefined && (
          <EditorSlider
            label="Border Radius"
            value={s.borderRadius}
            min={0}
            max={24}
            unit="px"
            onChange={(v) => onChange({ borderRadius: v })}
          />
        )}
        <ControlDivider />
        <ColorSwatchRow
          label="Background"
          value={s.backgroundColor}
          onChange={(v) => onChange({ backgroundColor: v })}
        />
        <ColorSwatchRow
          label="Text Color"
          value={s.textColor}
          onChange={(v) => onChange({ textColor: v })}
        />
        {s.buttonColor !== undefined && (
          <ColorSwatchRow
            label="Button Color"
            value={s.buttonColor}
            onChange={(v) => onChange({ buttonColor: v })}
          />
        )}
      </div>
    );
  }

  // ── Animation tab ──
  if (activeTab === 'animation') {
    return (
      <div className="space-y-1">
        <SegmentedGroup
          label="Animation"
          options={[
            { value: 'none', label: 'None' },
            { value: 'fade', label: 'Fade' },
            { value: 'slide-up', label: 'Slide' },
            { value: 'scale', label: 'Scale' },
          ]}
          value={s.animationType || 'none'}
          onChange={(v) => onChange({ animationType: v as SectionSettings['animationType'] })}
        />
        {s.animationType !== 'none' && (
          <EditorSlider
            label="Duration"
            value={s.animationDuration || 400}
            min={100}
            max={2000}
            step={50}
            unit="ms"
            onChange={(v) => onChange({ animationDuration: v })}
          />
        )}
      </div>
    );
  }

  return null;
}

/* ── Inline Text Control ── */
function InlineTextControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="py-2">
      <span className="text-[11px] text-[#999] font-medium tracking-wide uppercase select-none block mb-1.5">
        {label}
      </span>
      <input
        type="text"
        className="w-full h-[44px] px-3 rounded-lg text-[14px] text-white"
        style={{
          backgroundColor: '#2c2c2e',
          fontFamily: "'DM Sans', sans-serif",
          border: 'none',
          outline: 'none',
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
