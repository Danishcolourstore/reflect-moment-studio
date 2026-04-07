import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited?: () => void;
}

export function InviteClientModal({ open, onOpenChange, onInvited }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [eventId, setEventId] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !open) return;
    (supabase.from('events').select('id, name') as any).eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }: any) => { if (data) setEvents(data); });
  }, [user, open]);

  const handleInvite = async () => {
    if (!user || !name || !email) return;
    setSubmitting(true);

    try {
      // Create auth account for client
      const tempPassword = crypto.randomUUID().slice(0, 12) + 'A1!';
      
      // Use edge function to create client (needs service role)
      const { data, error } = await supabase.functions.invoke('invite-client', {
        body: { name, email, phone, photographer_id: user.id, event_id: eventId || null, password: tempPassword },
      });

      if (error) throw error;

      toast.success(`${name} has been invited`);
      onOpenChange(false);
      setName(''); setEmail(''); setPhone(''); setEventId('');
      onInvited?.();
    } catch (err: any) {
      toast.error(err.message || 'Could not send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Invite</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-background" placeholder="Jane & John" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-background" placeholder="client@email.com" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 bg-background" placeholder="+1 (555) 123-4567" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Event</label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger className="mt-1 bg-background">
                <SelectValue placeholder="Select an event (optional)" />
              </SelectTrigger>
              <SelectContent>
                {events.map((evt) => (
                  <SelectItem key={evt.id} value={evt.id}>{evt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleInvite} disabled={submitting || !name || !email} className="w-full bg-primary text-primary-foreground text-[11px] uppercase tracking-wider">
            {submitting ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Sending…</> : 'Send Invitation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
