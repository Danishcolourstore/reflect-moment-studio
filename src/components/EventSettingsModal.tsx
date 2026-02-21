import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Grid2X2, LayoutGrid, AlignJustify, Newspaper, GalleryHorizontalEnd, Clapperboard, Sparkles, LayoutDashboard, Loader2, Copy, ExternalLink, RefreshCw, Link2 } from 'lucide-react';

const LAYOUT_OPTIONS = [
  { value: 'classic', label: 'Classic', icon: Grid2X2 },
  { value: 'masonry', label: 'Masonry', icon: LayoutGrid },
  { value: 'justified', label: 'Justified', icon: AlignJustify },
  { value: 'editorial', label: 'Editorial', icon: Newspaper },
  { value: 'editorial-collage', label: 'Collage', icon: GalleryHorizontalEnd },
  { value: 'pixieset', label: 'Pixieset', icon: Sparkles },
  { value: 'cinematic', label: 'Cinematic', icon: Clapperboard },
  { value: 'mosaic', label: 'Mosaic', icon: LayoutDashboard },
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
  downloads_enabled: boolean;
  download_resolution: string;
  watermark_enabled: boolean;
  is_published: boolean;
  selection_mode_enabled?: boolean;
  selection_token?: string | null;
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
  const [downloadsEnabled, setDownloadsEnabled] = useState(event.downloads_enabled);
  const [watermarkEnabled, setWatermarkEnabled] = useState(event.watermark_enabled);
  const [isPublished, setIsPublished] = useState(event.is_published);
  const [selectionModeEnabled, setSelectionModeEnabled] = useState(event.selection_mode_enabled ?? false);
  const [selectionToken, setSelectionToken] = useState(event.selection_token ?? null);
  const [saving, setSaving] = useState(false);

  // Sync when event changes
  useEffect(() => {
    setTitle(event.name);
    setDate(event.event_date);
    setLocation(event.location ?? '');
    setPassword(event.gallery_pin ?? '');
    setGalleryLayout(event.gallery_layout);
    setDownloadsEnabled(event.downloads_enabled);
    setWatermarkEnabled(event.watermark_enabled);
    setIsPublished(event.is_published);
    setSelectionModeEnabled(event.selection_mode_enabled ?? false);
    setSelectionToken(event.selection_token ?? null);
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
      name: title,
      event_date: date,
      location: location || null,
      cover_url: coverUrl,
      gallery_pin: password || null,
      gallery_layout: galleryLayout,
      downloads_enabled: downloadsEnabled,
      watermark_enabled: watermarkEnabled,
      is_published: isPublished,
      selection_mode_enabled: selectionModeEnabled,
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
      <DialogContent className="sm:max-w-[460px] bg-card border-border p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-semibold">Event Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 mt-1">
          {/* Gallery Link */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Gallery Link</Label>
            <div className="flex gap-1.5">
              <Input value={`${window.location.origin}/event/${event.slug}`} readOnly className="bg-background h-9 text-[12px] font-mono" />
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/event/${event.slug}`); toast({ title: 'Gallery link copied' }); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" asChild>
                <a href={`/event/${event.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
              </Button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Event Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background h-9 text-[13px]" />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Event Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-background h-9 text-[13px]" />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="bg-background h-9 text-[13px]" />
          </div>

          {/* Cover */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Cover Photo</Label>
            <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="bg-background h-9 text-[13px]" />
            {event.cover_url && !coverFile && (
              <p className="text-[10px] text-muted-foreground/50">Current cover set. Upload to replace.</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Gallery Password (Optional)</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="4-digit PIN" maxLength={6} className="bg-background h-9 text-[13px]" />
          </div>

          {/* Layout with live preview */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Gallery Layout</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {LAYOUT_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGalleryLayout(value)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 border transition-colors text-center ${
                    galleryLayout === value
                      ? 'border-foreground bg-foreground/5 text-foreground'
                      : 'border-border text-muted-foreground/60 hover:border-foreground/30'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[9px] uppercase tracking-wider leading-none">{label}</span>
                </button>
              ))}
            </div>

            {/* Mini live preview */}
            <div className="border border-border bg-background p-2.5 mt-1.5">
              <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50 mb-1.5">Preview</p>
              <div className="flex gap-[2px] items-end h-12">
                {previewBars.map((h, i) => (
                  <div
                    key={`${galleryLayout}-${i}`}
                    className="flex-1 bg-muted-foreground/15 transition-all duration-300"
                    style={{ height: `${(h / 5) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Download & publish permissions */}
          <div className="pt-2 border-t border-border space-y-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Settings</p>
            <div className="flex items-center justify-between">
              <Label className="text-[12px] text-foreground/80 font-normal">Downloads enabled</Label>
              <Switch checked={downloadsEnabled} onCheckedChange={setDownloadsEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[12px] text-foreground/80 font-normal">Watermark enabled</Label>
              <Switch checked={watermarkEnabled} onCheckedChange={setWatermarkEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[12px] text-foreground/80 font-normal">Published</Label>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[12px] text-foreground/80 font-normal">Photo Selection Mode</Label>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">Guests can select & submit photos</p>
              </div>
              <Switch checked={selectionModeEnabled} onCheckedChange={setSelectionModeEnabled} />
            </div>
          </div>

          {/* Client Proofing — Selection Link */}
          <div className="pt-2 border-t border-border space-y-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium flex items-center gap-1.5">
              <Link2 className="h-3 w-3" /> Client Proofing
            </p>
            {selectionToken ? (
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  <Input
                    value={`${window.location.origin}/event/${event.slug}/gallery?mode=select&token=${selectionToken}`}
                    readOnly
                    className="bg-background h-9 text-[10px] font-mono"
                  />
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/event/${event.slug}/gallery?mode=select&token=${selectionToken}`);
                    toast({ title: 'Link copied!' });
                  }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="text-[10px] h-7 uppercase tracking-[0.06em]" onClick={async () => {
                  const newToken = crypto.randomUUID();
                  const { error } = await supabase.from('events').update({ selection_token: newToken } as any).eq('id', event.id);
                  if (!error) {
                    setSelectionToken(newToken);
                    toast({ title: 'Link regenerated', description: 'Old selection link is now invalid.' });
                  }
                }}>
                  <RefreshCw className="mr-1 h-3 w-3" /> Regenerate Link
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground/50">No selection link generated yet.</p>
                <Button variant="outline" size="sm" className="text-[10px] h-8 uppercase tracking-[0.06em]" onClick={async () => {
                  const newToken = crypto.randomUUID();
                  const { error } = await supabase.from('events').update({ selection_token: newToken } as any).eq('id', event.id);
                  if (!error) {
                    setSelectionToken(newToken);
                    toast({ title: 'Selection link generated' });
                  }
                }}>
                  Generate Selection Link
                </Button>
              </div>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary hover:bg-gold-hover text-primary-foreground h-9 text-[12px] tracking-wide uppercase font-medium mt-1"
          >
            {saving ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving...</>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
