import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image, Eye, Download, Plus, Upload, Share2, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CreateEventModal } from '@/components/CreateEventModal';
import { ShareModal } from '@/components/ShareModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';

interface DashEvent {
  id: string; name: string; slug: string; event_date: string; location: string | null;
  is_published: boolean; cover_url: string | null; gallery_pin: string | null; photo_count: number;
}

interface ActivityItem {
  id: string; description: string; time: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<DashEvent[]>([]);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [shareEvent, setShareEvent] = useState<DashEvent | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: prof } = await (supabase.from('profiles').select('*') as any).eq('user_id', user.id).single();
      if (prof) setProfile(prof);
      const { data: evts } = await (supabase.from('events').select('id, name, slug, event_date, location, is_published, cover_url, gallery_pin, photos(count)') as any)
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
      if (evts) {
        setEvents((evts as any[]).map((e: any) => ({ ...e, photo_count: e.photos?.[0]?.count ?? 0 })));
      }
      const { count: pc } = await supabase.from('photos').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      setTotalPhotos(pc ?? 0);
      const { data: vd } = await (supabase.from('events').select('views') as any).eq('user_id', user.id);
      if (vd) setTotalViews((vd as any[]).reduce((s: number, e: any) => s + (e.views ?? 0), 0));
      const { data: evtIds } = await (supabase.from('events').select('id') as any).eq('user_id', user.id);
      if (evtIds && (evtIds as any[]).length > 0) {
        const ids = (evtIds as any[]).map((e: any) => e.id);
        const { data: analytics } = await (supabase.from('event_analytics').select('downloads_count') as any).in('event_id', ids);
        if (analytics) setTotalDownloads((analytics as any[]).reduce((s: number, a: any) => s + (a.downloads_count ?? 0), 0));
      }
      if (evtIds && (evtIds as any[]).length > 0) {
        const ids = (evtIds as any[]).map((e: any) => e.id);
        const { data: views } = await (supabase.from('event_views').select('id, viewed_at, event_id') as any).in('event_id', ids).order('viewed_at', { ascending: false }).limit(5);
        const { data: comments } = await (supabase.from('photo_comments').select('id, created_at, guest_name') as any).in('event_id', ids).order('created_at', { ascending: false }).limit(5);
        const items: ActivityItem[] = [];
        if (views) (views as any[]).forEach((v: any) => items.push({ id: v.id, description: 'Gallery viewed by a guest', time: v.viewed_at }));
        if (comments) (comments as any[]).forEach((c: any) => items.push({ id: c.id, description: `New comment from ${c.guest_name || 'Guest'}`, time: c.created_at }));
        items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setActivity(items.slice(0, 10));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 17) return 'Good afternoon';
    if (h >= 17 && h < 22) return 'Good evening';
    return 'Working late';
  };

  const displayName = profile?.studio_name || user?.user_metadata?.full_name || 'Creator';

  const contextLine = () => {
    if (events.length === 0) return 'Capture. Upload. Deliver.';
    const published = events.filter(e => e.is_published).length;
    if (totalViews > 0) return 'Clients are viewing your work.';
    if (published > 0) return 'Your galleries are ready to share.';
    return 'Your stories are live today.';
  };

  return (
    <DashboardLayout>
      {/* Greeting — editorial spacing */}
      <div className="mb-14">
        <p className="editorial-label">{greeting()}</p>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mt-2 leading-tight tracking-tight" style={{ fontWeight: 300 }}>{displayName}</h1>
        <p className="text-sm text-muted-foreground/50 mt-3 font-light tracking-wide">{loading ? format(new Date(), 'EEEE, MMMM d, yyyy') : contextLine()}</p>
      </div>

      {/* Stats — open editorial layout, no heavy borders */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          <EditorialStatCard icon={Camera} label="Events" value={events.length} onClick={() => navigate('/dashboard/events')} />
          <EditorialStatCard icon={Image} label="Photos" value={totalPhotos} onClick={() => navigate('/dashboard/events')} />
          <EditorialStatCard icon={Eye} label="Views" value={totalViews} onClick={() => navigate('/dashboard/analytics')} />
          <EditorialStatCard icon={Download} label="Downloads" value={totalDownloads} onClick={() => navigate('/dashboard/analytics')} />
        </div>
      )}

      {/* Recent Events */}
      <div className="mb-14">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-serif text-2xl text-foreground" style={{ fontWeight: 300 }}>Recent Events</h2>
          <button onClick={() => navigate('/dashboard/events')} className="text-[9px] text-muted-foreground/40 hover:text-muted-foreground uppercase tracking-[0.2em] transition-colors">View All</button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="py-24 text-center">
            <Camera className="mx-auto h-10 w-10 text-muted-foreground/10" />
            <p className="mt-5 font-serif text-lg text-muted-foreground/40">No events yet</p>
            <p className="mt-2 text-[10px] text-muted-foreground/30 tracking-wide">Create your first event to start delivering photos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {events.map((evt) => (
              <div key={evt.id} className="group cursor-pointer" onClick={() => navigate(`/dashboard/events/${evt.id}`)}>
                {/* Image container — no border */}
                <div className="relative aspect-[3/2] overflow-hidden rounded-[14px]">
                  {evt.cover_url ? (
                    <img src={evt.cover_url} alt={evt.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-secondary"><Camera className="h-8 w-8 text-muted-foreground/10" /></div>
                  )}
                  {/* Hover caption overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[rgba(44,33,24,0.7)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Badge className="absolute bottom-3 left-3 bg-card/80 text-foreground text-[9px] backdrop-blur-sm border-0 tracking-wider uppercase">{evt.photo_count} photos</Badge>
                  <Badge className={`absolute bottom-3 right-3 text-[9px] border-0 backdrop-blur-sm tracking-wider uppercase ${evt.is_published ? 'bg-muted-foreground/15 text-card' : 'bg-card/80 text-muted-foreground'}`}>
                    {evt.is_published ? 'Live' : 'Draft'}
                  </Badge>
                </div>
                {/* Text below — editorial whitespace */}
                <div className="pt-4 pb-2">
                  <h3 className="font-serif text-lg text-foreground truncate" style={{ fontWeight: 400 }}>{evt.name}</h3>
                  <p className="text-[10px] text-muted-foreground/40 mt-1 tracking-wide uppercase">{format(new Date(evt.event_date), 'MMM d, yyyy')}{evt.location ? ` · ${evt.location}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions — editorial, minimal */}
      <div className="mb-14">
        <h2 className="font-serif text-2xl text-foreground mb-8" style={{ fontWeight: 300 }}>Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickAction icon={Plus} title="Create New Event" desc="Create a new photo gallery for your client" btnText="Create Event" onClick={() => setCreateOpen(true)} />
          <QuickAction icon={Upload} title="Upload Photos" desc="Add photos to an existing event" btnText="Upload Now" onClick={() => navigate('/dashboard/upload')} />
          <QuickAction icon={Share2} title="Share Gallery" desc="Send your gallery link to clients" btnText="View Events" onClick={() => navigate('/dashboard/events')} />
        </div>
      </div>

      {/* Activity Feed */}
      {activity.length > 0 && (
        <div>
          <h2 className="font-serif text-2xl text-foreground mb-8" style={{ fontWeight: 300 }}>Recent Activity</h2>
          <div className="space-y-0">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-4 py-4 border-b border-border/30 last:border-0">
                <div className="mt-2 h-1.5 w-1.5 rounded-full bg-muted-foreground/25 shrink-0" />
                <p className="text-[13px] text-foreground/70 flex-1 tracking-wide">{item.description}</p>
                <span className="text-[10px] text-muted-foreground/35 shrink-0 tracking-wide">{formatDistanceToNow(new Date(item.time), { addSuffix: true })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => navigate(`/dashboard/events/${id}`)} />
      {shareEvent && <ShareModal open={!!shareEvent} onOpenChange={() => setShareEvent(null)} eventSlug={shareEvent.slug} eventName={shareEvent.name} pin={shareEvent.gallery_pin} />}
    </DashboardLayout>
  );
};

function EditorialStatCard({ icon: Icon, label, value, onClick }: { icon: any; label: string; value: number | string; onClick?: () => void }) {
  return (
    <div
      className="py-6 px-1 cursor-pointer min-h-[44px] active:scale-[0.97] transition-transform duration-150"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(); }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/20" strokeWidth={1.5} />
        <p className="editorial-label">{label}</p>
      </div>
      <p className="font-serif text-[42px] text-foreground leading-none tracking-tight" style={{ fontWeight: 300 }}>{value}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, title, desc, btnText, onClick }: { icon: any; title: string; desc: string; btnText: string; onClick: () => void }) {
  return (
    <div className="bg-card/50 rounded-[14px] p-8 flex flex-col items-center text-center border border-border/15">
      <Icon className="h-7 w-7 text-muted-foreground/20 mb-4" strokeWidth={1.2} />
      <h3 className="font-serif text-lg text-foreground" style={{ fontWeight: 400 }}>{title}</h3>
      <p className="text-[11px] text-muted-foreground/40 mt-2 tracking-wide">{desc}</p>
      <Button size="sm" className="mt-5" onClick={onClick}>{btnText}</Button>
    </div>
  );
}

export default Dashboard;
