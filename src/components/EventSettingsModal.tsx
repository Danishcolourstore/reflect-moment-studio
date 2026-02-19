import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Grid2X2, LayoutGrid, AlignJustify, Newspaper, GalleryHorizontalEnd, Clapperboard, Sparkles, LayoutDashboard, Loader2, Zap } from 'lucide-react';

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
  event_date: string;
  event_type: string;
  cover_url: string | null;
  gallery_pin: string | null;
  gallery_layout: string;
  allow_full_download: boolean;
  allow_favorites_download: boolean;
  livesync_enabled: boolean;
}

interface EventSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventData;
  onUpdated: () => void;
}

export function EventSettingsModal({ open, onOpenChange, event, onUpdated }: EventSettingsModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState(event.name);
  const [date, setDate] = useState(event.event_date);
  const [type, setType] = useState(event.event_type);
  const [pin, setPin] = useState(event.gallery_pin ?? '');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryLayout, setGalleryLayout] = useState(event.gallery_layout);
  const [allowFullDownload, setAllowFullDownload] = useState(event.allow_full_download);
  const [allowFavoritesDownload, setAllowFavoritesDownload] = useState(event.allow_favorites_download);
  const [livesyncEnabled, setLivesyncEnabled] = useState(event.livesync_enabled);
  const [saving, setSaving] = useState(false);

  // Sync when event changes
  useEffect(() => {
    setName(event.name);
    setDate(event.event_date);
    setType(event.event_type);
    setPin(event.gallery_pin ?? '');
    setGalleryLayout(event.gallery_layout);
    setAllowFullDownload(event.allow_full_download);
    setAllowFavoritesDownload(event.allow_favorites_download);
    setLivesyncEnabled(event.livesync_enabled);
  }, [event]);

  const handleSave = async () => {
    setSaving(true);

    let coverUrl = event.cover_url;

    if (coverFile) {
      const ext = coverFile.name.split('.').pop();
      const path = `${event.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('event-covers').upload(path, coverFile);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('event-covers').getPublicUrl(path);
        coverUrl = publicUrl;
      }
    }

    const { error } = await supabase.from('events').update({
      name,
      event_date: date,
      event_type: type,
      cover_url: coverUrl,
      gallery_pin: pin || null,
      gallery_layout: galleryLayout,
      allow_full_download: allowFullDownload,
      allow_favorites_download: allowFavoritesDownload,
      livesync_enabled: livesyncEnabled,
    }).eq('id', event.id);

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
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Event Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background h-9 text-[13px]" />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Event Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-background h-9 text-[13px]" />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Event Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-background h-9 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Wedding', 'Pre-Wedding', 'Portrait', 'Corporate', 'Other'].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cover */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Cover Photo</Label>
            <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="bg-background h-9 text-[13px]" />
            {event.cover_url && !coverFile && (
              <p className="text-[10px] text-muted-foreground/50">Current cover set. Upload to replace.</p>
            )}
          </div>

          {/* PIN */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Gallery PIN (Optional)</Label>
            <Input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4-digit PIN" maxLength={6} className="bg-background h-9 text-[13px]" />
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

          {/* Download permissions */}
          <div className="pt-2 border-t border-border space-y-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Guest Download Permissions</p>
            <div className="flex items-center justify-between">
              <Label className="text-[12px] text-foreground/80 font-normal">Allow full gallery download</Label>
              <Switch checked={allowFullDownload} onCheckedChange={setAllowFullDownload} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[12px] text-foreground/80 font-normal">Allow favorites download</Label>
              <Switch checked={allowFavoritesDownload} onCheckedChange={setAllowFavoritesDownload} />
            </div>
          </div>

          {/* LiveSync™ */}
          <div className="pt-2 border-t border-border space-y-3">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">LiveSync™</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[12px] text-foreground/80 font-normal">Enable LiveSync™</Label>
                <p className="text-[9px] text-muted-foreground/50 mt-0.5">Guests see photos as they're captured in real-time</p>
              </div>
              <Switch checked={livesyncEnabled} onCheckedChange={setLivesyncEnabled} />
            </div>
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
