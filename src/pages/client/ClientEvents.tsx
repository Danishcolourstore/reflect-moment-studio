import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { ClientDashboardLayout } from '@/components/ClientDashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const ClientEvents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: client } = await (supabase.from('clients').select('id') as any).eq('user_id', user.id).maybeSingle();
      if (!client) { setLoading(false); return; }

      const { data: access } = await (supabase.from('client_events').select('event_id') as any).eq('client_id', client.id);
      if (access && access.length > 0) {
        const ids = access.map((a: any) => a.event_id);
        const { data: evts } = await (supabase.from('events').select('id, name, slug, event_date, location, cover_url, photo_count, event_type') as any)
          .in('id', ids).order('event_date', { ascending: false });
        if (evts) setEvents(evts);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <ClientDashboardLayout>
      <h1 className="font-serif text-2xl font-semibold text-foreground mb-6">My Events</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="border border-dashed border-border/60 py-24 text-center rounded-xl">
          <Camera className="mx-auto h-12 w-12 text-muted-foreground/15" />
          <p className="mt-4 font-serif text-lg text-muted-foreground/60">No events yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground/40">Your photographer will assign events to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((evt) => (
            <div key={evt.id} className="bg-card border border-border rounded-xl overflow-hidden group cursor-pointer" onClick={() => navigate(`/client/events/${evt.id}`)}>
              <div className="relative aspect-[3/2] bg-secondary overflow-hidden">
                {evt.cover_url ? (
                  <img src={evt.cover_url} alt={evt.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center"><Camera className="h-8 w-8 text-muted-foreground/15" /></div>
                )}
                <Badge className="absolute bottom-2 left-2 bg-card/90 text-foreground text-[10px] backdrop-blur-sm border-0">{evt.photo_count} photos</Badge>
                <Badge className="absolute top-2 right-2 bg-card/90 text-foreground text-[10px] backdrop-blur-sm border-0">{evt.event_type}</Badge>
              </div>
              <div className="p-4">
                <h3 className="font-serif text-base font-semibold text-foreground truncate">{evt.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{format(new Date(evt.event_date), 'MMM d, yyyy')}{evt.location ? ` · ${evt.location}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ClientDashboardLayout>
  );
};

export default ClientEvents;
