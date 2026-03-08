import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Grid2X2, LayoutGrid, AlignJustify, Newspaper, GalleryHorizontalEnd, Clapperboard, Sparkles, LayoutDashboard, Loader2, Copy, ExternalLink, Image, BookOpen } from 'lucide-react';
import { SmartQRAccess } from '@/components/events/SmartQRAccess';
import { GALLERY_STYLES, DEFAULT_LAYOUT_FOR_STYLE, type GalleryStyleValue } from '@/lib/gallery-styles';
import { WEBSITE_TEMPLATES, type WebsiteTemplateValue } from '@/lib/website-templates';

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
  classic:    [1, 1, 1, 1, 1, 1],
  masonry:    [3, 2, 4, 2, 3, 2],
  justified:  [2, 3, 2, 3, 2, 3],
  editorial:  [4, 3, 5, 3, 4, 3],
  'editorial-collage': [5, 2, 3, 1, 4, 2],
  pixieset:   [5, 3, 3, 4, 3, 4],
  cinematic:  [4, 2, 5, 2, 4, 3],
  mosaic:     [5, 1, 3, 2, 4, 1],
  'minimal-portfolio': [5, 5, 5, 5, 5, 5],
  storybook:  [5, 3, 3, 2, 2, 5],
};

interface EventData {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  location: string | null;
  cover_url: string | null;
  gallery_pin: string | null;
  gallery_layout: string;
  gallery_style?: string;
  downloads_enabled: boolean;
  download_resolution: string;
  watermark_enabled: boolean;
  is_published: boolean;
  selection_mode_enabled?: boolean;
  feed_visible?: boolean;
  hero_couple_name?: string | null;
  hero_subtitle?: string | null;
  hero_button_label?: string | null;
  website_template?: string;
}

interface EventSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventData;
  onUpdated: () => void;
}

export function EventSettingsModal({ open, onOpenChange, event, onUpdated }: EventSettingsModalProps) {
  const { toast } = useToast();
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
    setTitle(event.name);
    setDate(event.event_date);
    setLocation(event.location ?? '');
    setPassword(event.gallery_pin ?? '');
    setGalleryLayout(event.gallery_layout);
    setGalleryStyle((event.gallery_style as GalleryStyleValue) || 'vogue-editorial');
    setDownloadsEnabled(event.downloads_enabled);
    setWatermarkEnabled(event.watermark_enabled);
    setIsPublished(event.is_published);
    setSelectionModeEnabled(event.selection_mode_enabled ?? false);
    setFeedVisible(event.feed_visible ?? false);
    setHeroCoupleName(event.hero_couple_name ?? '');
    setHeroSubtitle(event.hero_subtitle ?? '');
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
      is_published: isPublished, selection_mode_enabled: selectionModeEnabled, feed_visible: feedVisible,
      hero_couple_name: heroCoupleName || null, hero_subtitle: heroSubtitle || null,
      hero_button_label: heroButtonLabel || null, website_template: websiteTemplate,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border/20 p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-8 pt-8 pb-2">
          <DialogTitle className="font-serif text-2xl" style={{ fontWeight: 300 }}>Event Settings</DialogTitle>
        </DialogHeader>

        <div className="px-8 pb-8 space-y-8">

          {/* ── Section 1: Basic Info ── */}
          <section className="space-y-4">
            <h3 className="font-serif text-base text-foreground tracking-wide" style={{ fontWeight: 400 }}>Basic Info</h3>
            <div className="space-y-1.5">
              <Label className="editorial-label">Gallery Link</Label>
              <div className="flex gap-1.5">
                <Input value={`${window.location.origin}/event/${event.slug}`} readOnly className="bg-background h-9 text-[12px] font-mono" />
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/event/${event.slug}`); toast({ title: 'Gallery link copied' }); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" asChild>
                  <a href={`/event/${event.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                </Button>
              </div>
              <p className="editorial-helper">Share this URL with your clients to give them access.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="editorial-label">Event Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background h-9 text-[13px]" />
              <p className="editorial-helper">The title displayed on your gallery page.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="editorial-label">Event Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-background h-9 text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="editorial-label">Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="bg-background h-9 text-[13px]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="editorial-label">Cover Photo</Label>
              <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="bg-background h-9 text-[13px]" />
              {event.cover_url && !coverFile && <p className="editorial-helper">Current cover set. Upload a new image to replace.</p>}
            </div>
          </section>

          <div className="h-px bg-border/30" />

          {/* ── Section: Website Template ── */}
          <section className="space-y-4">
            <h3 className="font-serif text-base text-foreground tracking-wide" style={{ fontWeight: 400 }}>Website Template</h3>
            <p className="editorial-helper !mt-0">Choose how guests experience your gallery — like visiting your own website.</p>
            <div className="grid grid-cols-1 gap-2">
              {WEBSITE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.value}
                  type="button"
                  onClick={() => setWebsiteTemplate(tmpl.value)}
                  className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border transition-colors text-left ${
                    websiteTemplate === tmpl.value
                      ? 'border-foreground/30 bg-foreground/5'
                      : 'border-border/30 hover:border-muted-foreground/20'
                  }`}
                >
                  <span className={`text-[11px] font-medium ${websiteTemplate === tmpl.value ? 'text-foreground' : 'text-muted-foreground/70'}`}>{tmpl.label}</span>
                  <span className="text-[9px] text-muted-foreground/50 leading-snug">{tmpl.description}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="h-px bg-border/30" />
          <section className="space-y-4">
            <h3 className="font-serif text-base text-foreground tracking-wide" style={{ fontWeight: 400 }}>Gallery Style</h3>
            <p className="editorial-helper !mt-0">Choose the visual presentation preset for your gallery.</p>
            <div className="grid grid-cols-3 gap-2">
              {GALLERY_STYLES.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => {
                    setGalleryStyle(style.value);
                    // Set default layout for the style if user hasn't manually changed it
                    if (galleryLayout === event.gallery_layout) {
                      setGalleryLayout(DEFAULT_LAYOUT_FOR_STYLE[style.value]);
                    }
                  }}
                  className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border transition-colors text-left ${
                    galleryStyle === style.value
                      ? 'border-foreground/30 bg-foreground/5'
                      : 'border-border/30 hover:border-muted-foreground/20'
                  }`}
                >
                  <span className={`text-[11px] font-medium ${galleryStyle === style.value ? 'text-foreground' : 'text-muted-foreground/70'}`}>{style.label}</span>
                  <span className="text-[9px] text-muted-foreground/50 leading-snug">{style.description}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ── Hero Fields (Timeless Wedding & Andhakar) ── */}
          {(galleryStyle === 'timeless-wedding' || galleryStyle === 'andhakar') && (
            <>
              <div className="h-px bg-border/30" />
              <section className="space-y-4">
                <h3 className="font-serif text-base text-foreground tracking-wide" style={{ fontWeight: 400 }}>Hero Section</h3>
                <p className="editorial-helper !mt-0">Optional hero displayed above the gallery grid.</p>
                <div className="space-y-1.5">
                  <Label className="editorial-label">Couple Name</Label>
                  <Input value={heroCoupleName} onChange={(e) => setHeroCoupleName(e.target.value)} placeholder="Sarah & James" className="bg-background h-9 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="editorial-label">Subtitle / Studio Name</Label>
                  <Input value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} placeholder="Photography by Studio Name" className="bg-background h-9 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="editorial-label">Button Label</Label>
                  <Input value={heroButtonLabel} onChange={(e) => setHeroButtonLabel(e.target.value)} placeholder="View Gallery" className="bg-background h-9 text-[13px]" />
                  <p className="editorial-helper">Leave empty to use default "View Gallery".</p>
                </div>
              </section>
            </>
          )}

          <div className="h-px bg-border/30" />

          {/* ── Section 2: Gallery Layout ── */}
          <section className="space-y-4">
            <h3 className="font-serif text-base text-foreground tracking-wide" style={{ fontWeight: 400 }}>Gallery Layout</h3>
            <p className="editorial-helper !mt-0">Choose how your photos are presented to guests.</p>
            <div className="grid grid-cols-4 gap-2">
              {LAYOUT_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button key={value} type="button" onClick={() => setGalleryLayout(value)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-1.5 rounded-xl border transition-colors text-center ${
                    galleryLayout === value
                      ? 'border-foreground/30 bg-foreground/5 text-foreground'
                      : 'border-border/30 text-muted-foreground/50 hover:border-muted-foreground/20'
                  }`}>
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  <span className="text-[8px] uppercase tracking-[0.12em] leading-none">{label}</span>
                </button>
              ))}
            </div>
            <div className="border border-border/20 bg-background/50 p-3 rounded-xl">
              <p className="editorial-label mb-2">Preview</p>
              <div className="flex gap-[2px] items-end h-12">
                {previewBars.map((h, i) => (
                  <div key={`${galleryLayout}-${i}`} className="flex-1 bg-muted-foreground/12 rounded-sm transition-all duration-300" style={{ height: `${(h / 5) * 100}%` }} />
                ))}
              </div>
            </div>
          </section>

          <div className="h-px bg-border/30" />

          {/* ── Section 3: Access & Security ── */}
          <section className="space-y-4">
            <h3 className="font-serif text-base text-foreground tracking-wide" style={{ fontWeight: 400 }}>Access & Security</h3>
            <div className="flex items-center justify-between py-1">
              <div>
                <Label className="text-[12px] text-foreground/70 font-normal">Published</Label>
                <p className="editorial-helper !mt-0.5">Make this gallery visible to anyone with the link.</p>
              </div>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <Label className="text-[12px] text-foreground/70 font-normal">Show in Public Feed</Label>
                <p className="editorial-helper !mt-0.5">Display this shoot on your public portfolio page.</p>
              </div>
              <Switch checked={feedVisible} onCheckedChange={setFeedVisible} />
            </div>
            <div className="space-y-1.5">
              <Label className="editorial-label">Gallery Password</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="4-digit PIN" maxLength={6} className="bg-background h-9 text-[13px]" />
              <p className="editorial-helper">Optional. Guests will need to enter this PIN to view photos.</p>
            </div>
          </section>

          <div className="h-px bg-border/30" />

          {/* ── Section 4: Downloads & Protection ── */}
          <section className="space-y-4">
            <h3 className="font-serif text-base text-foreground tracking-wide" style={{ fontWeight: 400 }}>Downloads & Protection</h3>
            <div className="flex items-center justify-between py-1">
              <div>
                <Label className="text-[12px] text-foreground/70 font-normal">Downloads Enabled</Label>
                <p className="editorial-helper !mt-0.5">Allow guests to download photos from this gallery.</p>
              </div>
              <Switch checked={downloadsEnabled} onCheckedChange={setDownloadsEnabled} />
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <Label className="text-[12px] text-foreground/70 font-normal">Watermark Enabled</Label>
                <p className="editorial-helper !mt-0.5">Display your studio name as a watermark on gallery images.</p>
              </div>
              <Switch checked={watermarkEnabled} onCheckedChange={setWatermarkEnabled} />
            </div>
          </section>

          <div className="h-px bg-border/30" />

          {/* ── Section 5: Guest & AI Features ── */}
          <section className="space-y-4">
            <h3 className="font-serif text-base text-foreground tracking-wide" style={{ fontWeight: 400 }}>Guest & AI Features</h3>
            <div className="flex items-center justify-between py-1">
              <div>
                <Label className="text-[12px] text-foreground/70 font-normal">Photo Selection Mode</Label>
                <p className="editorial-helper !mt-0.5">Allow guests to curate and submit their favorite photo selections.</p>
              </div>
              <Switch checked={selectionModeEnabled} onCheckedChange={setSelectionModeEnabled} />
            </div>
            <SmartQRAccess eventId={event.id} />
          </section>

          <Button onClick={handleSave} disabled={saving} className="w-full h-11 mt-2">
            {saving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving...</> : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
