import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Grid2X2, LayoutGrid, AlignJustify, Newspaper, GalleryHorizontalEnd, Clapperboard, Sparkles, LayoutDashboard, Image, BookOpen } from 'lucide-react';

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

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (eventId: string) => void;
}

export function CreateEventModal({ open, onOpenChange, onCreated }: CreateEventModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [slug, setSlug] = useState('');
  const [password, setPassword] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryLayout, setGalleryLayout] = useState('classic');
  const [downloadsEnabled, setDownloadsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const mutexRef = useRef(false);
  const lastSubmitRef = useRef(0);

  const generateSlug = (name: string) => {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
    const rand = Math.random().toString(36).substring(2, 6);
    return `${base}-${rand}`;
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(val));
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Debounce: ignore if submitted within 1000ms
    const now = Date.now();
    if (now - lastSubmitRef.current < 1000) return;
    lastSubmitRef.current = now;

    // Mutex: prevent concurrent calls
    if (mutexRef.current) return;
    mutexRef.current = true;
    setLoading(true);

    try {
      const finalSlug = slug || generateSlug(title);

      // 1. Check if event with this slug already exists (retry-safe)
      const { data: existing } = await (supabase.from('events').select('id').eq('slug', finalSlug).eq('user_id', user.id).maybeSingle() as any);
      if (existing) {
        toast({ title: 'Event already exists' });
        onOpenChange(false);
        onCreated(existing.id);
        return;
      }

      // 2. Upload cover image sequentially
      let coverUrl: string | null = null;
      if (coverFile) {
        const ext = coverFile.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('event-covers').upload(path, coverFile);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('event-covers').getPublicUrl(path);
          coverUrl = publicUrl;
        }
      }

      // 3. Create event record
      const { data: inserted, error } = await (supabase.from('events').insert({
        user_id: user.id,
        name: title,
        slug: finalSlug,
        event_date: date,
        location: location || null,
        cover_url: coverUrl,
        gallery_pin: password || null,
        gallery_layout: galleryLayout,
        downloads_enabled: downloadsEnabled,
      } as any).select('id').single() as any);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Event created' });
        setTitle(''); setDate(''); setLocation(''); setSlug(''); setPassword(''); setCoverFile(null);
        setGalleryLayout('classic'); setDownloadsEnabled(true);
        onOpenChange(false);
        onCreated(inserted.id);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setLoading(false);
      mutexRef.current = false;
    }
  }, [user, title, slug, date, location, coverFile, password, galleryLayout, downloadsEnabled, toast, onOpenChange, onCreated]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-semibold">Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3.5 mt-1">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Event Title</Label>
            <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} required placeholder="Aisha & Rahul Wedding" className="bg-background h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="aisha-rahul-wedding" className="bg-background h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Event Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="bg-background h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Mumbai, India" className="bg-background h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Cover Photo</Label>
            <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="bg-background h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Gallery Password (Optional)</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="4-digit PIN" maxLength={6} className="bg-background h-9 text-[13px]" />
          </div>

          {/* Gallery layout preset */}
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
          </div>

          {/* Download permissions */}
          <div className="pt-2 border-t border-border space-y-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Guest Download Permissions</p>
            <div className="flex items-center justify-between">
              <Label className="text-[12px] text-foreground/80 font-normal">Allow downloads</Label>
              <Switch checked={downloadsEnabled} onCheckedChange={setDownloadsEnabled} />
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-gold-hover text-primary-foreground h-9 text-[12px] tracking-wide uppercase font-medium mt-1" disabled={loading}>
            {loading ? 'Creating...' : 'Create Event'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
