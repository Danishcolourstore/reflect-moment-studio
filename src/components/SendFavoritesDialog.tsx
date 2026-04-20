import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SendFavoritesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  favoritePhotoIds: string[];
  favoritePhotos: { id: string; url: string }[];
  sessionId: string | null;
}

export function SendFavoritesDialog({
  open, onOpenChange, eventId, eventTitle, favoritePhotoIds, favoritePhotos, sessionId,
}: SendFavoritesDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { toast.error('Name and email are required'); return; }
    setSending(true);

    try {
      // Insert guest selection
      const { data: sel } = await (supabase.from('guest_selections' as any).insert({
        event_id: eventId,
        guest_name: name.trim(),
        guest_email: email.trim(),
      } as any).select('id').single() as any);

      if (sel) {
        // Insert photo links
        const photoInserts = favoritePhotoIds.map(pid => ({
          selection_id: (sel as any).id,
          photo_id: pid,
        }));
        await (supabase.from('guest_selection_photos' as any).insert(photoInserts as any) as any);
      }

      // Try to send notification edge function
      try {
        await supabase.functions.invoke('send-favorites-notification', {
          body: { event_id: eventId, guest_name: name.trim(), guest_email: email.trim(), photo_count: favoritePhotoIds.length, message: message.trim() || null },
        });
      } catch {}

      toast.success('Your favorites have been shared with your photographer!');
      onOpenChange(false);
      setName(''); setEmail(''); setMessage('');
    } catch (err) {
      toast.error('Could not send — try again');
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Share Your Favorites</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Your photographer will receive a list of your favorite photos</p>

        {/* Thumbnail row */}
        <div className="flex gap-1.5 overflow-x-auto py-2 scrollbar-hide">
          {favoritePhotos.slice(0, 10).map(p => (
            <img key={p.id} src={p.url} alt="" className="h-[60px] w-[60px] rounded-lg object-cover shrink-0" loading="lazy" decoding="async" />
          ))}
          {favoritePhotos.length > 10 && (
            <div className="h-[60px] w-[60px] rounded-lg bg-secondary flex items-center justify-center text-xs text-muted-foreground shrink-0">
              +{favoritePhotos.length - 10}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Your Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1 bg-background" required />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Your Email *</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 bg-background" required />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Message (Optional)</label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Any special notes for your photographer" className="mt-1 bg-background" rows={2} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={sending} className="flex-1 bg-primary text-primary-foreground">
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Send Favorites
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
