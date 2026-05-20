import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Grid2X2, LayoutGrid, AlignJustify, Newspaper, GalleryHorizontalEnd, Clapperboard, Sparkles, LayoutDashboard, Loader2, Copy, ExternalLink, Image, BookOpen } from 'lucide-react';
import { SmartQRAccess } from '@/components/events/SmartQRAccess';
import { GALLERY_STYLES, DEFAULT_LAYOUT_FOR_STYLE, type GalleryStyleValue } from '@/lib/gallery-styles';

type WebsiteTemplateValue = string;
const useWebsiteTemplates = () => ({ data: [] as any[] });

const LAYOUT_OPTIONS = [
  { value: 'classic', label: 'Classic', icon: Grid2X2 },
  { value: 'masonry', label: 'Masonry', icon: LayoutGrid },
  { value: 'justified', label: 'Justified', icon: AlignJustify },
  { value: 'editorial', label: 'Editorial', icon: Newspaper },
  { value: 'editorial-collage', label: 'Collage', icon: GalleryHorizontalEnd },
  { value: 'pixieset', label: 'Pixieset', icon: Sparkles },
  { value: 'cinematic', label: 'Cinematic', icon: Clapperboard },
  { value: 'mosaic', label: 'Mosaic', icon: LayoutDashboard },
  { value: 'minimal-portfolio', label: 'Portfolio', icon: Image },
  { value: 'storybook', label: 'Story Book', icon: BookOpen },
] as const;

const PREVIEW_HEIGHTS: Record<string, number[]> = {
  classic:    [1,1,1,1,1,1],
  masonry:    [3,2,4,2,3,2],
  justified:  [2,3,2,3,2,3],
  editorial:  [4,3,5,3,4,3],
  'editorial-collage': [5,2,3,1,4,2],
  pixieset:   [5,3,3,4,3,4],
  cinematic:  [4,2,5,2,4,3],
  mosaic:     [5,1,3,2,4,1],
  'minimal-portfolio': [5,5,5,5,5,5],
  storybook:  [5,3,3,2,2,5],
};

const inputStyle = {
  border: "1px solid rgba(17,17,17,0.2)",
  background: "transparent",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  fontWeight: 300,
  padding: "8px 12px",
  width: "100%",
  color: "#111111",
  outline: "none",
  borderRadius: 0,
  boxSizing: "border-box" as const,
  height: 36,
};

const labelStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 11,
  fontWeight: 300,
  letterSpacing: "0.15em",
  textTransform: "uppercase" as const,
  color: "var(--ink-muted)",
  display: "block",
  marginBottom: 6,
};

const helperStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 11,
  fontWeight: 300,
  color: "var(--ink-whisper)",
  marginTop: 4,
};

const sectionTitleStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontSize: 18,
  fontWeight: 300,
  fontStyle: "italic",
  color: "var(--ink)",
  margin: "0 0 16px",
};

const dividerStyle = {
  height: 1,
  background: "var(--rule)",
  margin: "8px 0",
};

interface EventData {
  id: string; name: string; slug: string; event_date: string;
  location: string | null; cover_url: string | null; gallery_pin: string | null;
  gallery_layout: string; gallery_style?: string; downloads_enabled: boolean;
  download_resolution: string; watermark_enabled: boolean; is_published: boolean;
  selection_mode_enabled?: boolean; feed_visible?: boolean;
  hero_couple_name?: string | null; hero_subtitle?: string | null;
  hero_button_label?: string | null; website_template?: string;
}

interface EventSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventData;
  onUpdated: () => void;
}

export function EventSettingsModal({ open, onOpenChange, event, onUpdated }: EventSettingsModalProps) {
  const { toast } = useToast();
  const { data: wsTemplates = [] } = useWebsiteTemplates();
  const [title, setTitle] = useState(event.name);
  const [date, setDate] = useState(event.event_date);
  const [location, setLocation] = useState(event.location ?? '');
  const [password, setPassword] = useState(event.gallery_pin ?? '');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryLayout, setGalleryLayout] = useState(event.gallery_layout);
  const [galleryStyle, setGalleryStyle] = useState<GalleryStyleValue>((event.gallery_style as GalleryStyleValue) || 'vogue-editorial');
  const [downloadsEnabled, setDownloadsEnabled] = useState(event.downloads_enabled);
  const [watermarkEnabled, setWatermarkEnabled] = useState(event.watermark_enabled);
  const [isPublished, setIsPublished] = useState(event.is_published);
  const [selectionModeEnabled, setSelectionModeEnabled] = useState(event.selection_mode_enabled ?? false);
  const [feedVisible, setFeedVisible] = useState(event.feed_visible ?? false);
  const [heroCoupleName, setHeroCoupleName] = useState(event.hero_couple_name ?? '');
  const [heroSubtitle, setHeroSubtitle] = useState(event.hero_subtitle ?? '');
  const [heroButtonLabel, setHeroButtonLabel] = useState(event.hero_button_label ?? '');
  const [websiteTemplate, setWebsiteTemplate] = useState<WebsiteTemplateValue>((event.website_template as WebsiteTemplateValue) || 'vows-elegance');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(event.name); setDate(event.event_date);
    setLocation(event.location ?? ''); setPassword(event.gallery_pin ?? '');
    setGalleryLayout(event.gallery_layout);
    setGalleryStyle((event.gallery_style as GalleryStyleValue) || 'vogue-editorial');
    setDownloadsEnabled(event.downloads_enabled); setWatermarkEnabled(event.watermark_enabled);
    setIsPublished(event.is_published);
    setSelectionModeEnabled(event.selection_mode_enabled ?? false);
    setFeedVisible(event.feed_visible ?? false);
    setHeroCoupleName(event.hero_couple_name ?? ''); setHeroSubtitle(event.hero_subtitle ?? '');
    setHeroButtonLabel(event.hero_button_label ?? '');
    setWebsiteTemplate((event.website_template as WebsiteTemplateValue) || 'vows-elegance');
  }, [event]);

  const handleSave = async () => {
    setSaving(true);
    let coverUrl = event.cover_url;
    if (coverFile) {
      const ext = coverFile.name.split('.').pop();
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('event-covers').upload(path, coverFile);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('event-covers').getPublicUrl(path);
        coverUrl = publicUrl;
      }
    }
    const { error } = await supabase.from('events').update({
      name: title, event_date: date, location: location || null, cover_url: coverUrl,
      gallery_pin: password || null, gallery_layout: galleryLayout, gallery_style: galleryStyle,
      downloads_enabled: downloadsEnabled, watermark_enabled: watermarkEnabled,
      is_published: isPublished, selection_mode_enabled: selectionModeEnabled,
      feed_visible: feedVisible, hero_couple_name: heroCoupleName || null,
      hero_subtitle: heroSubtitle || null, hero_button_label: heroButtonLabel || null,
      website_template: websiteTemplate,
    } as any).eq('id', event.id);
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Settings saved' });
      onUpdated();
      onOpenChange(false);
    }
    setSaving(false);
  };

  const previewBars = PREVIEW_HEIGHTS[galleryLayout] ?? PREVIEW_HEIGHTS.masonry;

  const focusInput = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "rgba(184,149,63,0.6)");
  const blurInput = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "rgba(17,17,17,0.2)");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          background: "var(--paper, #FAFAF8)",
          border: "1px solid var(--rule)",
          borderRadius: 0,
          padding: 0,
          maxWidth: 500,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 8px 48px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ padding: "32px 32px 8px" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, fontStyle: "italic", color: "var(--ink)", margin: 0 }}>
            Event Settings
          </h2>
        </div>

        <div style={{ padding: "24px 32px 32px", display: "flex", flexDirection: "column", gap: 32 }}>

          {/* Basic Info */}
          <section>
            <h3 style={sectionTitleStyle}>Basic Info</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Gallery Link</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={`${window.location.origin}/event/${event.slug}`}
                    readOnly
                    style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, flex: 1 }}
                  />
                  <button
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/event/${event.slug}`); toast({ title: 'Gallery link copied' }); }}
                    style={{ border: "1px solid rgba(17,17,17,0.2)", background: "transparent", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >
                    <Copy size={14} style={{ color: "var(--ink)" }} />
                  </button>
                  <a
                    href={`/event/${event.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ border: "1px solid rgba(17,17,17,0.2)", background: "transparent", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, textDecoration: "none" }}
                  >
                    <ExternalLink size={14} style={{ color: "var(--ink)" }} />
                  </a>
                </div>
                <p style={helperStyle}>Share this URL with your clients.</p>
              </div>
              <div>
                <label style={labelStyle}>Event Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Event Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
                </div>
                <div>
                  <label style={labelStyle}>Location</label>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Cover Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} style={inputStyle} />
                {event.cover_url && !coverFile && <p style={helperStyle}>Current cover set. Upload to replace.</p>}
              </div>
            </div>
          </section>

          <div style={dividerStyle} />

          {/* Website Template */}
          {wsTemplates.length > 0 && (
            <>
              <section>
                <h3 style={sectionTitleStyle}>Website Template</h3>
                <p style={{ ...helperStyle, marginBottom: 12 }}>Choose how guests experience your gallery.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {wsTemplates.map((tmpl: any) => (
                    <button
                      key={tmpl.value}
                      type="button"
                      onClick={() => setWebsiteTemplate(tmpl.value)}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        border: websiteTemplate === tmpl.value ? "1px solid #B8953F" : "1px solid rgba(17,17,17,0.15)",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", color: websiteTemplate === tmpl.value ? "var(--ink)" : "var(--ink-muted)", display: "block" }}>{tmpl.label}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 300, color: "var(--ink-whisper)" }}>{tmpl.description}</span>
                    </button>
                  ))}
                </div>
              </section>
              <div style={dividerStyle} />
            </>
          )}

          {/* Gallery Style */}
          <section>
            <h3 style={sectionTitleStyle}>Gallery Style</h3>
            <p style={{ ...helperStyle, marginBottom: 12 }}>Visual presentation preset for your gallery.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {GALLERY_STYLES.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => {
                    setGalleryStyle(style.value);
                    if (galleryLayout === event.gallery_layout) setGalleryLayout(DEFAULT_LAYOUT_FOR_STYLE[style.value]);
                  }}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    border: galleryStyle === style.value ? "1px solid #B8953F" : "1px solid rgba(17,17,17,0.15)",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", color: galleryStyle === style.value ? "var(--ink)" : "var(--ink-muted)", display: "block", marginBottom: 2 }}>{style.label}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 300, color: "var(--ink-whisper)", lineHeight: 1.4 }}>{style.description}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Hero Section */}
          {(galleryStyle === 'timeless-wedding' || galleryStyle === 'andhakar') && (
            <>
              <div style={dividerStyle} />
              <section>
                <h3 style={sectionTitleStyle}>Hero Section</h3>
                <p style={{ ...helperStyle, marginBottom: 12 }}>Optional hero displayed above the gallery grid.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Couple Name</label>
                    <input value={heroCoupleName} onChange={(e) => setHeroCoupleName(e.target.value)} placeholder="Sarah & James" style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
                  </div>
                  <div>
                    <label style={labelStyle}>Subtitle / Studio Name</label>
                    <input value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} placeholder="Photography by Studio Name" style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
                  </div>
                  <div>
                    <label style={labelStyle}>Button Label</label>
                    <input value={heroButtonLabel} onChange={(e) => setHeroButtonLabel(e.target.value)} placeholder="View Gallery" style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
                    <p style={helperStyle}>Leave empty to use default "View Gallery".</p>
                  </div>
                </div>
              </section>
            </>
          )}

          <div style={dividerStyle} />

          {/* Gallery Layout */}
          <section>
            <h3 style={sectionTitleStyle}>Gallery Layout</h3>
            <p style={{ ...helperStyle, marginBottom: 12 }}>Choose how your photos are presented to guests.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {LAYOUT_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGalleryLayout(value)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 6px",
                    border: galleryLayout === value ? "1px solid #B8953F" : "1px solid rgba(17,17,17,0.15)",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <Icon size={16} strokeWidth={1.5} style={{ color: galleryLayout === value ? "#B8953F" : "var(--ink-muted)" }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 8, fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", color: galleryLayout === value ? "var(--ink)" : "var(--ink-muted)" }}>{label}</span>
                </button>
              ))}
            </div>
            <div style={{ border: "1px solid rgba(17,17,17,0.1)", background: "transparent", padding: 12, marginTop: 12 }}>
              <p style={{ ...labelStyle, marginBottom: 8 }}>Preview</p>
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 48 }}>
                {previewBars.map((h, i) => (
                  <div
                    key={`${galleryLayout}-${i}`}
                    style={{
                      flex: 1,
                      background: "rgba(17,17,17,0.1)",
                      height: `${(h / 5) * 100}%`,
                      transition: "height 300ms ease",
                    }}
                  />
                ))}
              </div>
            </div>
          </section>

          <div style={dividerStyle} />

          {/* Access & Security */}
          <section>
            <h3 style={sectionTitleStyle}>Access & Security</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Published", desc: "Make this gallery visible to anyone with the link.", checked: isPublished, onChange: setIsPublished },
                { label: "Show in Public Feed", desc: "Display this shoot on your public portfolio page.", checked: feedVisible, onChange: setFeedVisible },
              ].map(({ label, desc, checked, onChange }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 300, color: "var(--ink)", margin: 0 }}>{label}</p>
                    <p style={helperStyle}>{desc}</p>
                  </div>
                  <Switch checked={checked} onCheckedChange={onChange} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Gallery Password</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="4-digit PIN" maxLength={6} style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
                <p style={helperStyle}>Optional. Guests enter this PIN to view photos.</p>
              </div>
            </div>
          </section>

          <div style={dividerStyle} />

          {/* Downloads & Protection */}
          <section>
            <h3 style={sectionTitleStyle}>Downloads & Protection</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Downloads Enabled", desc: "Allow guests to download photos.", checked: downloadsEnabled, onChange: setDownloadsEnabled },
                { label: "Watermark Enabled", desc: "Display your studio name as a watermark.", checked: watermarkEnabled, onChange: setWatermarkEnabled },
              ].map(({ label, desc, checked, onChange }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 300, color: "var(--ink)", margin: 0 }}>{label}</p>
                    <p style={helperStyle}>{desc}</p>
                  </div>
                  <Switch checked={checked} onCheckedChange={onChange} />
                </div>
              ))}
            </div>
          </section>

          <div style={dividerStyle} />

          {/* Guest & AI Features */}
          <section>
            <h3 style={sectionTitleStyle}>Guest & AI Features</h3>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 300, color: "var(--ink)", margin: 0 }}>Photo Selection Mode</p>
                <p style={helperStyle}>Allow guests to curate and submit their favorite selections.</p>
              </div>
              <Switch checked={selectionModeEnabled} onCheckedChange={setSelectionModeEnabled} />
            </div>
            <div style={{ marginTop: 16 }}>
              <SmartQRAccess eventId={event.id} />
            </div>
          </section>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              border: "1px solid #B8953F",
              background: "transparent",
              color: "#111111",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 300,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "14px 20px",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : "Save Settings"}
          </button>

        </div>
      </DialogContent>
    </Dialog>
  );
}
