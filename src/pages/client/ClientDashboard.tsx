import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Heart, Download, Eye } from 'lucide-react';
import { ClientDashboardLayout } from '@/components/ClientDashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clientId, setClientId] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [favCount, setFavCount] = useState(0);
  const [dlCount, setDlCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      // Get client record
      const { data: client } = await (supabase.from('clients').select('id, name') as any)
        .eq('user_id', user.id).single();
      if (!client) { setLoading(false); return; }
      setClientId(client.id);

      // Get assigned events
      const { data: access } = await (supabase.from('client_events').select('event_id, access_level') as any)
        .eq('client_id', client.id);
      if (access && access.length > 0) {
        const eventIds = access.map((a: any) => a.event_id);
        const { data: evts } = await (supabase.from('events').select('id, name, slug, event_date, location, cover_url, photo_count, is_published') as any)
          .in('id', eventIds);
        if (evts) setEvents(evts);
      }

      // Favorites count
      const { count: fc } = await supabase.from('client_favorites').select('*', { count: 'exact', head: true }).eq('client_id', client.id);
      setFavCount(fc ?? 0);

      // Downloads count
      const { count: dc } = await supabase.from('client_downloads').select('*', { count: 'exact', head: true }).eq('client_id', client.id);
      setDlCount(dc ?? 0);

      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <ClientDashboardLayout>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">Your photo galleries at a glance</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <StatCard icon={Camera} label="MY EVENTS" value={events.length} />
          <StatCard icon={Heart} label="FAVORITES" value={favCount} />
          <StatCard icon={Download} label="DOWNLOADS" value={dlCount} />
        </div>
      )}

      {/* Events */}
      <div className="mb-10">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-xl text-foreground">Your Events</h2>
          {events.length > 0 && (
            <button onClick={() => navigate('/client/events')} className="text-[11px] text-primary hover:text-primary/80 uppercase tracking-wider">View All</button>
          )}
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="border border-dashed border-border/60 py-20 text-center rounded-xl">
            <Camera className="mx-auto h-10 w-10 text-muted-foreground/15" />
            <p className="mt-4 font-serif text-sm text-muted-foreground/60">No events assigned yet</p>
            <p className="mt-1 text-[10px] text-muted-foreground/40">Your photographer will share events with you here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {events.map((evt) => (
              <div key={evt.id} className="bg-card border border-border rounded-xl overflow-hidden group cursor-pointer" onClick={() => navigate(`/client/events/${evt.id}`)}>
                <div className="relative aspect-[3/2] bg-secondary overflow-hidden">
                  {evt.cover_url ? (
                    <img src={evt.cover_url} alt={evt.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><Camera className="h-8 w-8 text-muted-foreground/15" /></div>
                  )}
                  <Badge className="absolute bottom-2 left-2 bg-card/90 text-foreground text-[10px] backdrop-blur-sm border-0">{evt.photo_count} photos</Badge>
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-base font-semibold text-foreground truncate">{evt.name}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{format(new Date(evt.event_date), 'MMM d, yyyy')}{evt.location ? ` · ${evt.location}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  );
};

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60 font-medium">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground/20" />
      </div>
      <p className="font-serif text-4xl font-bold text-foreground leading-none tracking-tight">{value}</p>
    </div>
  );
}

export default ClientDashboard;
