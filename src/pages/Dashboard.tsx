import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image, Eye, Download, Plus, Upload } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CreateEventModal } from '@/components/CreateEventModal';
import { ShareModal } from '@/components/ShareModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';


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
      const { data: prof } = await (supabase.from('profiles').select('*') as any).eq('user_id', user.id).maybeSingle();
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
    if (h >= 5 && h < 12) return 'Hello bro, good morning ☀️';
    if (h >= 12 && h < 17) return 'Hello bro, good afternoon 👋';
    if (h >= 17 && h < 22) return 'Hello bro, good evening 🌙';
    return 'Hello bro, good evening 🌙';
  };

  return (
    <DashboardLayout>
      {/* Greeting - responsive text */}
      <div className="mb-6 sm:mb-8 lg:mb-10" style={{ padding: '8px 0 0' }}>
        <h1
          className="text-foreground text-2xl sm:text-[28px] lg:text-[32px]"
          style={{ fontFamily: 'var(--editorial-heading)', fontWeight: 400, letterSpacing: '-0.3px', lineHeight: 1.3 }}
        >
          {greeting()}
        </h1>
      </div>

      {/* Quick Actions Row - responsive */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8 lg:mb-10">
        <Button onClick={() => setCreateOpen(true)} className="flex-1 sm:flex-none h-12 sm:h-11 lg:h-12 lg:px-8 rounded-lg gap-2 min-h-[44px]" style={{ fontSize: '12px', letterSpacing: '1.5px' }}>
          <Plus className="h-4 w-4" /> New Event
        </Button>
        <Button variant="outline" onClick={() => navigate('/dashboard/upload')} className="flex-1 sm:flex-none h-12 sm:h-11 lg:h-12 lg:px-8 rounded-lg gap-2 min-h-[44px]" style={{ fontSize: '12px', letterSpacing: '1.5px' }}>
          <Upload className="h-4 w-4" /> Upload Photos
        </Button>
      </div>

      {/* Stats Grid — responsive: 2×2 mobile, 4×1 tablet+, larger on desktop */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-10">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 sm:h-32 lg:h-44 rounded-xl sm:rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-10">
          <PixisetStatCard icon={Camera} label="Events" value={events.length} onClick={() => navigate('/dashboard/events')} />
          <PixisetStatCard icon={Image} label="Photos" value={totalPhotos} onClick={() => navigate('/dashboard/events')} />
          <PixisetStatCard icon={Eye} label="Views" value={totalViews} onClick={() => navigate('/dashboard/analytics')} />
          <PixisetStatCard icon={Download} label="Downloads" value={totalDownloads} onClick={() => navigate('/dashboard/analytics')} />
        </div>
      )}

      <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => navigate(`/dashboard/events/${id}`)} />
      {shareEvent && <ShareModal open={!!shareEvent} onOpenChange={() => setShareEvent(null)} eventSlug={shareEvent.slug} eventName={shareEvent.name} pin={shareEvent.gallery_pin} />}
    </DashboardLayout>
  );
};

function PixisetStatCard({ icon: Icon, label, value, onClick }: { icon: any; label: string; value: number | string; onClick?: () => void }) {
  return (
    <div
      className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-8 cursor-pointer active:scale-[0.97] transition-all duration-300 hover:border-accent/30 hover-lift min-h-[44px]"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(); }}
    >
      <div className="flex items-center gap-2 mb-3 sm:mb-4 lg:mb-6">
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-accent" strokeWidth={1.5} />
        <p className="text-muted-foreground text-[10px] sm:text-[11px]" style={{ fontFamily: 'var(--editorial-body)', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
          {label}
        </p>
      </div>
      <p className="text-foreground leading-none text-[40px] sm:text-[52px] lg:text-[64px]" style={{ fontFamily: 'var(--editorial-heading)', fontWeight: 300 }}>
        {value}
      </p>
    </div>
  );
}

export default Dashboard;
