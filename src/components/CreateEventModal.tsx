import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';

/* Wireframe SVG previews for each layout */
function LayoutWireframe({ type }: { type: string }) {
  const s = { stroke: 'currentColor', strokeWidth: 1.2, fill: 'none', rx: 1 };
  const f = { fill: 'currentColor', opacity: 0.15, rx: 1 };
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full">
      {type === 'classic' && (
        <>
          <rect x="2" y="2" width="11" height="11" {...f} />
          <rect x="15" y="2" width="11" height="11" {...f} />
          <rect x="28" y="2" width="11" height="11" {...f} />
          <rect x="2" y="15" width="11" height="11" {...f} />
          <rect x="15" y="15" width="11" height="11" {...f} />
          <rect x="28" y="15" width="11" height="11" {...f} />
          <rect x="2" y="28" width="11" height="11" {...f} />
          <rect x="15" y="28" width="11" height="11" {...f} />
          <rect x="28" y="28" width="11" height="11" {...f} />
        </>
      )}
      {type === 'masonry' && (
        <>
          <rect x="2" y="2" width="11" height="16" {...f} />
          <rect x="15" y="2" width="11" height="10" {...f} />
          <rect x="28" y="2" width="11" height="13" {...f} />
          <rect x="2" y="20" width="11" height="10" {...f} />
          <rect x="15" y="14" width="11" height="16" {...f} />
          <rect x="28" y="17" width="11" height="10" {...f} />
          <rect x="2" y="32" width="11" height="7" {...f} />
          <rect x="15" y="32" width="11" height="7" {...f} />
          <rect x="28" y="29" width="11" height="10" {...f} />
        </>
      )}
      {type === 'justified' && (
        <>
          <rect x="2" y="2" width="14" height="8" {...f} />
          <rect x="18" y="2" width="21" height="8" {...f} />
          <rect x="2" y="12" width="21" height="8" {...f} />
          <rect x="25" y="12" width="14" height="8" {...f} />
          <rect x="2" y="22" width="10" height="8" {...f} />
          <rect x="14" y="22" width="12" height="8" {...f} />
          <rect x="28" y="22" width="11" height="8" {...f} />
          <rect x="2" y="32" width="18" height="7" {...f} />
          <rect x="22" y="32" width="17" height="7" {...f} />
        </>
      )}
      {type === 'editorial' && (
        <>
          <rect x="2" y="2" width="37" height="12" {...f} />
          <rect x="2" y="16" width="12" height="8" {...f} />
          <rect x="15.5" y="16" width="12" height="8" {...f} />
          <rect x="29" y="16" width="10" height="8" {...f} />
          <rect x="2" y="26" width="18" height="13" {...f} />
          <rect x="22" y="26" width="17" height="13" {...f} />
        </>
      )}
      {type === 'editorial-collage' && (
        <>
          <rect x="2" y="2" width="22" height="18" {...f} />
          <rect x="26" y="2" width="13" height="10" {...f} />
          <rect x="26" y="14" width="13" height="6" {...f} />
          <rect x="2" y="22" width="13" height="9" {...f} />
          <rect x="17" y="22" width="10" height="17" {...f} />
          <rect x="29" y="22" width="10" height="9" {...f} />
          <rect x="2" y="33" width="13" height="6" {...f} />
          <rect x="29" y="33" width="10" height="6" {...f} />
        </>
      )}
      {type === 'pixieset' && (
        <>
          <rect x="2" y="2" width="11" height="14" {...f} />
          <rect x="15" y="2" width="11" height="14" {...f} />
          <rect x="28" y="2" width="11" height="14" {...f} />
          <rect x="2" y="18" width="11" height="12" {...f} />
          <rect x="15" y="18" width="11" height="12" {...f} />
          <rect x="28" y="18" width="11" height="12" {...f} />
          <rect x="2" y="32" width="11" height="7" {...f} />
          <rect x="15" y="32" width="11" height="7" {...f} />
          <rect x="28" y="32" width="11" height="7" {...f} />
        </>
      )}
      {type === 'cinematic' && (
        <>
          <rect x="2" y="3" width="37" height="9" {...f} />
          <rect x="2" y="14" width="37" height="9" {...f} />
          <rect x="2" y="25" width="37" height="9" {...f} />
        </>
      )}
      {type === 'mosaic' && (
        <>
          <rect x="2" y="2" width="18" height="18" {...f} />
          <rect x="22" y="2" width="8" height="8" {...f} />
          <rect x="32" y="2" width="7" height="8" {...f} />
          <rect x="22" y="12" width="17" height="8" {...f} />
          <rect x="2" y="22" width="8" height="8" {...f} />
          <rect x="12" y="22" width="8" height="8" {...f} />
          <rect x="22" y="22" width="17" height="17" {...f} />
          <rect x="2" y="32" width="18" height="7" {...f} />
        </>
      )}
      {type === 'minimal-portfolio' && (
        <>
          <rect x="6" y="3" width="28" height="14" {...f} />
          <rect x="6" y="20" width="28" height="14" {...f} />
        </>
      )}
      {type === 'storybook' && (
        <>
          <rect x="2" y="2" width="18" height="14" {...f} />
          <rect x="22" y="4" width="16" height="3" {...f} />
          <rect x="22" y="9" width="12" height="2" {...f} />
          <rect x="2" y="20" width="16" height="3" {...f} />
          <rect x="2" y="25" width="12" height="2" {...f} />
          <rect x="20" y="18" width="19" height="14" {...f} />
          <rect x="2" y="34" width="37" height="5" {...f} />
        </>
      )}
    </svg>
  );
}

const LAYOUT_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'justified', label: 'Justified' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'editorial-collage', label: 'Collage' },
  { value: 'pixieset', label: 'Pixieset' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'mosaic', label: 'Mosaic' },
  { value: 'minimal-portfolio', label: 'Portfolio' },
  { value: 'storybook', label: 'Story Book' },
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
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {LAYOUT_OPTIONS.map(({ value, label }) => {
                const selected = galleryLayout === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGalleryLayout(value)}
                    className={`relative flex flex-col items-center gap-1.5 p-2 border rounded-lg transition-all min-h-[80px] ${
                      selected
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-muted-foreground/60 hover:border-muted-foreground/30'
                    }`}
                  >
                    {selected && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-accent-foreground" />
                      </div>
                    )}
                    <div className={`w-10 h-10 ${selected ? 'text-accent' : 'text-muted-foreground/40'}`}>
                      <LayoutWireframe type={value} />
                    </div>
                    <span className={`text-[8px] uppercase tracking-wider leading-none font-medium ${selected ? 'text-accent' : ''}`}>{label}</span>
                  </button>
                );
              })}
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
