import { useState } from 'react';
import { Check, CheckSquare, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Photo {
  id: string;
  url: string;
  file_name: string | null;
}

interface GuestSelectionModeProps {
  eventId: string;
  photos: Photo[];
  onClose: () => void;
}

export function GuestSelectionMode({ eventId, photos, onClose }: GuestSelectionModeProps) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0 || !name.trim() || !email.trim()) return;

    setSubmitting(true);
    try {
      // Create the selection record
      const { data: selection, error: selError } = await (supabase
        .from('guest_selections' as any)
        .insert({ event_id: eventId, guest_name: name.trim(), guest_email: email.trim() } as any)
        .select('id')
        .single() as any);

      if (selError || !selection) throw selError;

      // Insert selected photo IDs
      const photoRows = Array.from(selectedIds).map(photoId => ({
        selection_id: selection.id,
        photo_id: photoId,
      }));

      const { error: photosError } = await (supabase
        .from('guest_selection_photos' as any)
        .insert(photoRows as any) as any);

      if (photosError) throw photosError;

      setSubmitted(true);
      toast({ title: 'Selection submitted!', description: `${selectedIds.size} photos sent to the photographer.` });
    } catch (err) {
      toast({ title: 'Submission failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="text-center space-y-3 max-w-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-foreground">Selection Submitted</h2>
          <p className="text-[12px] text-muted-foreground/60">
            Your {selectedIds.size} selected photos have been sent to the photographer. Thank you!
          </p>
          <Button onClick={onClose} variant="outline" className="mt-4 text-[11px] uppercase tracking-wider">
            Back to Gallery
          </Button>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-foreground">Submit Selection</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground/50 hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground/60">
            {selectedIds.size} photo{selectedIds.size !== 1 ? 's' : ''} selected. Enter your details to send to the photographer.
          </p>

          {/* Thumbnail strip */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {photos.filter(p => selectedIds.has(p.id)).slice(0, 8).map(p => (
              <img key={p.id} src={p.url} alt="" className="h-12 w-12 object-cover rounded-sm shrink-0" />
            ))}
            {selectedIds.size > 8 && (
              <div className="h-12 w-12 rounded-sm bg-muted flex items-center justify-center shrink-0">
                <span className="text-[10px] text-muted-foreground">+{selectedIds.size - 8}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Your Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="bg-background h-9 text-[13px]" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Your Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" className="bg-background h-9 text-[13px]" required />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1 h-9 text-[11px]" onClick={() => setShowForm(false)}>Back</Button>
              <Button type="submit" disabled={submitting} className="flex-1 h-9 text-[11px] bg-primary text-primary-foreground">
                {submitting ? 'Sending…' : 'Submit Selection'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating selection bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border px-4 py-3 flex items-center justify-between safe-area-pb">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span className="text-[12px] font-medium text-foreground">
            {selectedIds.size} selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-[10px] h-7 px-2.5 uppercase tracking-wider">
            Cancel
          </Button>
          <Button size="sm" disabled={selectedIds.size === 0} onClick={() => setShowForm(true)}
            className="bg-primary text-primary-foreground text-[10px] h-7 px-3 uppercase tracking-wider">
            <Send className="mr-1 h-3 w-3" /> Submit
          </Button>
        </div>
      </div>

      {/* Selection overlay grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-[2px] pb-16">
        {photos.map(photo => {
          const selected = selectedIds.has(photo.id);
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => toggle(photo.id)}
              className={`relative aspect-square overflow-hidden transition-all duration-150 ${
                selected ? 'ring-2 ring-primary ring-inset' : ''
              }`}
            >
              <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              {/* Checkmark overlay */}
              <div className={`absolute inset-0 transition-colors duration-150 ${
                selected ? 'bg-primary/20' : 'hover:bg-foreground/10'
              }`} />
              <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
                selected
                  ? 'bg-primary border-primary text-primary-foreground scale-100'
                  : 'border-card/80 bg-card/40 backdrop-blur-sm scale-90'
              }`}>
                {selected && <Check className="h-3 w-3" />}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
