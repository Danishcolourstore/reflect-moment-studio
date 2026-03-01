import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: { id: string; name: string; slug: string };
}

export function EventDuplicateModal({ open, onOpenChange, event }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState(`Copy of ${event.name}`);
  const [slug, setSlug] = useState(`${event.slug}-copy`);
  const [copySettings, setCopySettings] = useState(true);
  const [copySections, setCopySections] = useState(true);
  const [copyPhotos, setCopyPhotos] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDuplicate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch original event
      const { data: original } = await supabase.from('events').select('*').eq('id', event.id).single();
      if (!original) throw new Error('Event not found');

      const newEvent: any = { ...original };
      delete newEvent.id;
      delete newEvent.created_at;
      delete newEvent.updated_at;
      newEvent.name = title;
      newEvent.slug = slug;
      newEvent.is_published = false;
      newEvent.views = 0;
      newEvent.photo_count = 0;
      if (!copySettings) {
        // Reset settings to defaults
        newEvent.gallery_pin = null;
        newEvent.watermark_enabled = false;
        newEvent.selection_mode_enabled = false;
      }

      const { data: inserted, error } = await (supabase.from('events').insert(newEvent).select('id').single() as any);
      if (error) throw error;
      const newId = inserted.id;

      // Copy sections
      if (copySections) {
        const { data: sections } = await (supabase.from('gallery_chapters').select('*') as any).eq('event_id', event.id);
        if (sections && (sections as any[]).length > 0) {
          for (const s of sections as any[]) {
            await (supabase.from('gallery_chapters').insert({
              event_id: newId, title: s.title, sort_order: s.sort_order,
            } as any) as any);
          }
        }
      }

      // Copy photos (DB rows only, same storage URLs)
      if (copyPhotos) {
        const { data: photos } = await (supabase.from('photos').select('*') as any).eq('event_id', event.id);
        if (photos && (photos as any[]).length > 0) {
          for (const p of photos as any[]) {
            await (supabase.from('photos').insert({
              event_id: newId, user_id: user.id, url: p.url,
              file_name: p.file_name, file_size: p.file_size,
              section: p.section, sort_order: p.sort_order,
            } as any) as any);
          }
        }
      }

      toast.success('Event duplicated successfully');
      onOpenChange(false);
      navigate(`/dashboard/events/${newId}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to duplicate');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Duplicate Event</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">Original: {event.name}</p>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">New Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 bg-background" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">New Slug</label>
            <Input value={slug} onChange={e => setSlug(e.target.value)} className="mt-1 bg-background" />
          </div>
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="flex items-center gap-2"><Checkbox checked={copySettings} onCheckedChange={(v) => setCopySettings(!!v)} /><span className="text-sm">Copy all settings</span></label>
            <label className="flex items-center gap-2"><Checkbox checked={copySections} onCheckedChange={(v) => setCopySections(!!v)} /><span className="text-sm">Copy sections/chapters</span></label>
            <label className="flex items-center gap-2"><Checkbox checked={copyPhotos} onCheckedChange={(v) => setCopyPhotos(!!v)} /><span className="text-sm">Copy photos</span></label>
            {copyPhotos && <p className="text-[10px] text-muted-foreground/50 ml-6">Photos will reference the same storage files</p>}
          </div>
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleDuplicate} disabled={loading} className="bg-primary text-primary-foreground">
            {loading ? 'Duplicating...' : 'Duplicate Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
