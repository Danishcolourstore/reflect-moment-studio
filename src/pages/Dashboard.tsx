import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image, Eye, Download, Plus, Upload, Clock, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CreateEventModal } from '@/components/CreateEventModal';
import { ShareModal } from '@/components/ShareModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
    if (h >= 5 && h < 12) return 'Good Morning';
    if (h >= 12 && h < 17) return 'Good Afternoon';
    if (h >= 17 && h < 22) return 'Good Evening';
    return 'Working Late';
  };

  const displayName = profile?.studio_name || user?.user_metadata?.full_name || 'Creator';

  const contextLine = () => {
    if (events.length === 0) return 'Create your first event to get started.';
    const published = events.filter(e => e.is_published).length;
    if (totalViews > 0) return 'Clients are viewing your work.';
    if (published > 0) return 'Your galleries are ready to share.';
    return 'Your stories are live today.';
  };

  return (
    <DashboardLayout>
      {/* Greeting */}
      <div className="mb-8" style={{ padding: '8px 0 0' }}>
        <p className="font-sans text-muted-foreground" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase' }}>
          {greeting()}
        </p>
        <h1
          className="text-foreground font-serif mt-2"
          style={{ fontSize: '52px', fontWeight: 300, fontStyle: 'italic', letterSpacing: '-0.5px', lineHeight: 1.1 }}
        >
          {displayName}
        </h1>
        <p className="font-sans text-muted-foreground mt-3" style={{ fontSize: '14px', fontWeight: 400 }}>
          {loading ? format(new Date(), 'EEEE, MMMM d, yyyy') : contextLine()}
        </p>
      </div>

      {/* Quick Actions Row */}
      <div className="flex gap-3 mb-8">
        <Button onClick={() => setCreateOpen(true)} className="flex-1 h-11 rounded-lg gap-2" style={{ fontSize: '12px', letterSpacing: '1.5px' }}>
          <Plus className="h-4 w-4" /> New Event
        </Button>
        <Button variant="outline" onClick={() => navigate('/dashboard/upload')} className="flex-1 h-11 rounded-lg gap-2" style={{ fontSize: '12px', letterSpacing: '1.5px' }}>
          <Upload className="h-4 w-4" /> Upload Photos
        </Button>
      </div>

      {/* Stats 2×2 Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-8">
          <PixisetStatCard icon={Camera} label="Events" value={events.length} onClick={() => navigate('/dashboard/events')} />
          <PixisetStatCard icon={Image} label="Photos" value={totalPhotos} onClick={() => navigate('/dashboard/events')} />
          <PixisetStatCard icon={Eye} label="Views" value={totalViews} onClick={() => navigate('/dashboard/analytics')} />
          <PixisetStatCard icon={Download} label="Downloads" value={totalDownloads} onClick={() => navigate('/dashboard/analytics')} />
        </div>
      )}

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="font-serif text-foreground mb-5" style={{ fontSize: '24px', fontWeight: 500 }}>Recent Activity</h2>
        {loading ? (
          <Skeleton className="h-48 rounded-2xl" />
        ) : activity.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center" style={{ boxShadow: '0 2px 12px rgba(28,24,21,0.06)' }}>
            <Clock className="mx-auto h-8 w-8 text-primary mb-4" strokeWidth={1.5} />
            <p className="font-serif text-muted-foreground" style={{ fontSize: '20px', fontStyle: 'italic', fontWeight: 400 }}>No recent activity yet</p>
            <p className="font-sans text-muted-foreground mt-2" style={{ fontSize: '13px' }}>Upload photos or create an event to get started</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(28,24,21,0.06)' }}>
            {activity.map((item, i) => (
              <div key={item.id} className={`flex items-center gap-4 px-5 py-4 ${i < activity.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="h-2 w-2 rounded-full bg-primary/40 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-foreground truncate" style={{ fontSize: '16px', fontWeight: 400 }}>{item.description}</p>
                  <p className="font-sans text-muted-foreground mt-0.5" style={{ fontSize: '12px' }}>{formatDistanceToNow(new Date(item.time), { addSuffix: true })}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-primary/40 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => navigate(`/dashboard/events/${id}`)} />
      {shareEvent && <ShareModal open={!!shareEvent} onOpenChange={() => setShareEvent(null)} eventSlug={shareEvent.slug} eventName={shareEvent.name} pin={shareEvent.gallery_pin} />}
    </DashboardLayout>
  );
};

function PixisetStatCard({ icon: Icon, label, value, onClick }: { icon: any; label: string; value: number | string; onClick?: () => void }) {
  return (
    <div
      className="bg-card border border-border rounded-2xl p-5 cursor-pointer active:scale-[0.97] transition-transform duration-150 hover:border-primary/30"
      style={{ boxShadow: '0 2px 12px rgba(28,24,21,0.06)' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(); }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={1.5} />
        <p className="font-sans text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
          {label}
        </p>
      </div>
      <p className="text-foreground font-serif leading-none" style={{ fontSize: '64px', fontWeight: 300 }}>
        {value}
      </p>
    </div>
  );
}

export default Dashboard;
