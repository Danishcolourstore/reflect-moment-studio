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
      // Profile
      const { data: prof } = await (supabase.from('profiles').select('*') as any).eq('user_id', user.id).single();
      if (prof) setProfile(prof);

      // Events
      const { data: evts } = await (supabase.from('events').select('id, name, slug, event_date, location, is_published, cover_url, gallery_pin, photos(count)') as any)
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
      if (evts) {
        setEvents((evts as any[]).map((e: any) => ({ ...e, photo_count: e.photos?.[0]?.count ?? 0 })));
      }

      // Stats
      const { count: pc } = await supabase.from('photos').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      setTotalPhotos(pc ?? 0);

      const { data: vd } = await (supabase.from('events').select('views') as any).eq('user_id', user.id);
      if (vd) setTotalViews((vd as any[]).reduce((s: number, e: any) => s + (e.views ?? 0), 0));

      // Downloads from analytics
      const { data: evtIds } = await (supabase.from('events').select('id') as any).eq('user_id', user.id);
      if (evtIds && (evtIds as any[]).length > 0) {
        const ids = (evtIds as any[]).map((e: any) => e.id);
        const { data: analytics } = await (supabase.from('event_analytics').select('downloads_count') as any).in('event_id', ids);
        if (analytics) setTotalDownloads((analytics as any[]).reduce((s: number, a: any) => s + (a.downloads_count ?? 0), 0));
      }

      // Activity feed
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
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = profile?.studio_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <DashboardLayout>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground">{greeting()}, {firstName}</h1>
        <p className="text-sm text-muted-foreground mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon={Camera} label="TOTAL EVENTS" value={events.length} />
          <StatCard icon={Image} label="TOTAL PHOTOS" value={totalPhotos} />
          <StatCard icon={Eye} label="GALLERY VIEWS" value={totalViews} />
          <StatCard icon={Download} label="DOWNLOADS" value={totalDownloads} />
        </div>
      )}

      {/* Recent Events */}
      <div className="mb-10">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-xl text-foreground">Recent Events</h2>
          <button onClick={() => navigate('/dashboard/events')} className="text-[11px] text-primary hover:text-primary/80 uppercase tracking-wider">View All</button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="border border-dashed border-border/60 py-20 text-center rounded-xl">
            <Camera className="mx-auto h-10 w-10 text-muted-foreground/15" />
            <p className="mt-4 font-serif text-sm text-muted-foreground/60">No events yet</p>
            <p className="mt-1 text-[10px] text-muted-foreground/40">Create your first event to start delivering photos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 overflow-x-auto">
            {events.map((evt) => (
              <div key={evt.id} className="bg-card border border-border rounded-xl overflow-hidden group cursor-pointer" onClick={() => navigate(`/dashboard/events/${evt.id}`)}>
                <div className="relative aspect-[3/2] bg-secondary overflow-hidden">
                  {evt.cover_url ? (
                    <img src={evt.cover_url} alt={evt.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><Camera className="h-8 w-8 text-muted-foreground/15" /></div>
                  )}
                  <Badge className="absolute bottom-2 left-2 bg-card/90 text-foreground text-[10px] backdrop-blur-sm border-0">{evt.photo_count} photos</Badge>
                  <Badge className={`absolute bottom-2 right-2 text-[10px] border-0 backdrop-blur-sm ${evt.is_published ? 'bg-green-500/20 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                    {evt.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-base font-semibold text-foreground truncate">{evt.name}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{format(new Date(evt.event_date), 'MMM d, yyyy')}{evt.location ? ` · ${evt.location}` : ''}</p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/events/${evt.id}`); }}>Edit</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={(e) => { e.stopPropagation(); window.open(`/event/${evt.slug}`, '_blank'); }}>View Gallery</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="font-serif text-xl text-foreground mb-5">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction icon={Plus} title="Create New Event" desc="Create a new photo gallery for your client" btnText="Create Event" onClick={() => setCreateOpen(true)} />
          <QuickAction icon={Upload} title="Upload Photos" desc="Add photos to an existing event" btnText="Upload Now" onClick={() => navigate('/dashboard/upload')} />
          <QuickAction icon={Share2} title="Share Gallery" desc="Send your gallery link to clients" btnText="View Events" onClick={() => navigate('/dashboard/events')} />
        </div>
      </div>

      {/* Activity Feed */}
      {activity.length > 0 && (
        <div>
          <h2 className="font-serif text-xl text-foreground mb-5">Recent Activity</h2>
          <div className="space-y-0">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                <p className="text-[13px] text-foreground flex-1">{item.description}</p>
                <span className="text-[11px] text-muted-foreground shrink-0">{formatDistanceToNow(new Date(item.time), { addSuffix: true })}</span>
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

function QuickAction({ icon: Icon, title, desc, btnText, onClick }: { icon: any; title: string; desc: string; btnText: string; onClick: () => void }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center text-center">
      <Icon className="h-8 w-8 text-muted-foreground/30 mb-3" />
      <h3 className="font-serif text-base font-semibold text-foreground">{title}</h3>
      <p className="text-[11px] text-muted-foreground mt-1">{desc}</p>
      <Button size="sm" className="mt-4 bg-primary hover:bg-gold-hover text-primary-foreground text-[10px] uppercase tracking-wider" onClick={onClick}>{btnText}</Button>
    </div>
  );
}

export default Dashboard;
