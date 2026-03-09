import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, UserPlus, Camera, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { InviteClientModal } from '@/components/InviteClientModal';

interface ManagedClient {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  event_count: number;
  favorite_count: number;
  download_count: number;
}

const Clients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ManagedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<ManagedClient | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [assignEventId, setAssignEventId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const loadClients = async () => {
    if (!user) return;
    setLoading(true);

    const { data: rawClients } = await (supabase.from('clients').select('id, user_id, name, email, phone, created_at') as any)
      .eq('photographer_id', user.id).order('created_at', { ascending: false });

    if (!rawClients || rawClients.length === 0) {
      setClients([]);
      setLoading(false);
      return;
    }

    const clientIds = rawClients.map((c: any) => c.id);

    const { data: eventAccess } = await (supabase.from('client_events').select('client_id') as any).in('client_id', clientIds);
    const eventCounts = new Map<string, number>();
    (eventAccess || []).forEach((a: any) => {
      eventCounts.set(a.client_id, (eventCounts.get(a.client_id) || 0) + 1);
    });

    const { data: favs } = await (supabase.from('client_favorites').select('client_id') as any).in('client_id', clientIds);
    const favCounts = new Map<string, number>();
    (favs || []).forEach((f: any) => {
      favCounts.set(f.client_id, (favCounts.get(f.client_id) || 0) + 1);
    });

    const { data: dls } = await (supabase.from('client_downloads').select('client_id') as any).in('client_id', clientIds);
    const dlCounts = new Map<string, number>();
    (dls || []).forEach((d: any) => {
      dlCounts.set(d.client_id, (dlCounts.get(d.client_id) || 0) + 1);
    });

    setClients(rawClients.map((c: any) => ({
      ...c,
      event_count: eventCounts.get(c.id) || 0,
      favorite_count: favCounts.get(c.id) || 0,
      download_count: dlCounts.get(c.id) || 0,
    })));

    setLoading(false);
  };

  useEffect(() => { loadClients(); }, [user]);

  useEffect(() => {
    if (!user) return;
    (supabase.from('events').select('id, name') as any).eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }: any) => { if (data) setEvents(data); });
  }, [user]);

  const filtered = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const assignEvent = async () => {
    if (!assignOpen || !assignEventId) return;
    setAssigning(true);
    const { error } = await supabase.from('client_events').insert({ client_id: assignOpen.id, event_id: assignEventId } as any);
    if (error) {
      if (error.code === '23505') toast.info('Event already assigned');
      else toast.error('Failed to assign event');
    } else {
      toast.success('Event assigned');
      loadClients();
    }
    setAssigning(false);
    setAssignOpen(null);
    setAssignEventId('');
  };

  const revokeAccess = async (clientId: string) => {
    await (supabase.from('client_events').delete() as any).eq('client_id', clientId);
    toast.success('All event access revoked');
    loadClients();
  };

  return (
    <DashboardLayout>
      {/* Header - responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">Clients</h1>
        <Button onClick={() => setInviteOpen(true)} className="bg-primary text-primary-foreground text-[10px] uppercase tracking-wider w-full sm:w-auto min-h-[44px]">
          <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Invite Client
        </Button>
      </div>

      {/* Search - responsive */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." className="pl-9 bg-card h-11 sm:h-9 text-[13px]" />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border/60 py-16 sm:py-24 text-center rounded-xl px-4">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/15" />
          <p className="mt-4 font-serif text-lg text-muted-foreground/60">No clients yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground/40">Invite clients to give them access to their event galleries.</p>
          <Button onClick={() => setInviteOpen(true)} className="mt-4 bg-primary text-primary-foreground text-[10px] uppercase tracking-wider min-h-[44px]">
            <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Invite Your First Client
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Client</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium text-center hidden sm:table-cell">Events</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium text-center hidden sm:table-cell">Favorites</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium text-center hidden md:table-cell">Downloads</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium hidden md:table-cell">Joined</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px] bg-secondary">{c.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">{c.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-foreground text-center hidden sm:table-cell">{c.event_count}</td>
                  <td className="px-4 py-3 text-[13px] text-foreground text-center hidden sm:table-cell">{c.favorite_count}</td>
                  <td className="px-4 py-3 text-[13px] text-foreground text-center hidden md:table-cell">{c.download_count}</td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground hidden md:table-cell">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setAssignOpen(c)}>
                        <Camera className="h-3 w-3 mr-1" /> Assign
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] text-destructive" onClick={() => revokeAccess(c.id)}>
                        <Shield className="h-3 w-3 mr-1" /> Revoke
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InviteClientModal open={inviteOpen} onOpenChange={setInviteOpen} onInvited={loadClients} />

      <Dialog open={!!assignOpen} onOpenChange={() => { setAssignOpen(null); setAssignEventId(''); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Assign Event to {assignOpen?.name}</DialogTitle>
            <DialogDescription className="text-[12px]">Select an event to give this client access.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Select value={assignEventId} onValueChange={setAssignEventId}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((evt) => (
                  <SelectItem key={evt.id} value={evt.id}>{evt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={assignEvent} disabled={assigning || !assignEventId} className="w-full bg-primary text-primary-foreground text-[11px] uppercase tracking-wider">
              {assigning ? 'Assigning...' : 'Assign Event'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Clients;
