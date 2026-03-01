import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Users, Search, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface Client {
  name: string; email: string; events: number; comments: number; selections: number; lastActivity: string;
}

const Clients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [emailSheet, setEmailSheet] = useState<Client | null>(null);
  const [subject, setSubject] = useState('Your photos are ready');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: evts } = await (supabase.from('events').select('id') as any).eq('user_id', user.id);
      if (!evts || (evts as any[]).length === 0) { setLoading(false); return; }
      const ids = (evts as any[]).map((e: any) => e.id);

      const { data: comments } = await (supabase.from('photo_comments').select('guest_name, guest_session_id, event_id, created_at') as any).in('event_id', ids);
      const { data: selections } = await (supabase.from('guest_selections').select('guest_name, guest_email, event_id, created_at') as any).in('event_id', ids);

      const map = new Map<string, Client>();
      if (comments) {
        for (const c of comments as any[]) {
          const key = c.guest_name || c.guest_session_id || 'Guest';
          const existing = map.get(key) || { name: key, email: '', events: 0, comments: 0, selections: 0, lastActivity: c.created_at };
          existing.comments++;
          if (new Date(c.created_at) > new Date(existing.lastActivity)) existing.lastActivity = c.created_at;
          map.set(key, existing);
        }
      }
      if (selections) {
        for (const s of selections as any[]) {
          const key = s.guest_email || s.guest_name;
          const existing = map.get(key) || { name: s.guest_name, email: s.guest_email, events: 0, comments: 0, selections: 0, lastActivity: s.created_at };
          existing.email = s.guest_email;
          existing.name = s.guest_name || existing.name;
          existing.selections++;
          if (new Date(s.created_at) > new Date(existing.lastActivity)) existing.lastActivity = s.created_at;
          map.set(key, existing);
        }
      }
      setClients(Array.from(map.values()).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()));
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const sendEmail = () => {
    console.log('Send email:', { to: emailSheet?.email, subject, message });
    toast.success(`Email sent to ${emailSheet?.name || emailSheet?.email}`);
    setEmailSheet(null);
    setMessage('');
  };

  return (
    <DashboardLayout>
      <h1 className="font-serif text-2xl font-semibold text-foreground mb-6">Clients</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." className="pl-9 bg-card h-9 text-[13px]" />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border/60 py-24 text-center rounded-xl">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/15" />
          <p className="mt-4 font-serif text-lg text-muted-foreground/60">No clients yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground/40">Clients will appear here once guests interact with your galleries.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Client</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium text-center hidden sm:table-cell">Comments</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium text-center hidden sm:table-cell">Selections</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium hidden md:table-cell">Last Activity</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px] bg-secondary">{c.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{c.name}</p>
                      {c.email && <p className="text-[11px] text-muted-foreground">{c.email}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-foreground text-center hidden sm:table-cell">{c.comments}</td>
                  <td className="px-4 py-3 text-[13px] text-foreground text-center hidden sm:table-cell">{c.selections}</td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground hidden md:table-cell">{formatDistanceToNow(new Date(c.lastActivity), { addSuffix: true })}</td>
                  <td className="px-4 py-3 text-right">
                    {c.email && (
                      <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setEmailSheet(c)}>
                        <Send className="h-3 w-3 mr-1" /> Email
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!emailSheet} onOpenChange={() => setEmailSheet(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader><SheetTitle className="font-serif">Email {emailSheet?.name}</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Subject</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 bg-background" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Message</label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 bg-background min-h-[150px]" />
            </div>
            <Button onClick={sendEmail} className="w-full bg-primary text-primary-foreground">Send Email</Button>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default Clients;
