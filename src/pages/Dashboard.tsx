import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image, Eye, Download, Plus, Upload, Clock, ChevronRight, Play, Instagram, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CreateEventModal } from '@/components/CreateEventModal';
import { ShareModal } from '@/components/ShareModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressiveImage } from '@/components/ProgressiveImage';
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
    if (h >= 5 && h < 12) return 'Hello bro, good morning ☀️';
    if (h >= 12 && h < 17) return 'Hello bro, good afternoon 👋';
    if (h >= 17 && h < 22) return 'Hello bro, good evening 🌙';
    return 'Hello bro, good evening 🌙';
  };

  return (
    <DashboardLayout>
      {/* Greeting */}
      <div className="mb-8" style={{ padding: '8px 0 0' }}>
        <h1
          className="text-foreground"
          style={{ fontFamily: 'var(--editorial-heading)', fontSize: '32px', fontWeight: 400, letterSpacing: '-0.3px', lineHeight: 1.3 }}
        >
          {greeting()}
        </h1>
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



      {/* ── Photographer Feed ── */}
      <PhotographerFeedSection userId={user?.id} />

      {/* ── Studio Info ── */}
      <StudioInfoSection profile={profile} />

      <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => navigate(`/dashboard/events/${id}`)} />
      {shareEvent && <ShareModal open={!!shareEvent} onOpenChange={() => setShareEvent(null)} eventSlug={shareEvent.slug} eventName={shareEvent.name} pin={shareEvent.gallery_pin} />}
    </DashboardLayout>
  );
};

function PixisetStatCard({ icon: Icon, label, value, onClick }: { icon: any; label: string; value: number | string; onClick?: () => void }) {
  return (
    <div
      className="bg-card border border-border rounded-2xl p-5 cursor-pointer active:scale-[0.97] transition-all duration-200 hover:border-primary/30 hover:-translate-y-0.5"
      style={{ boxShadow: '0 2px 12px rgba(28,24,21,0.06)' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(); }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={1.5} />
        <p className="text-muted-foreground" style={{ fontFamily: 'var(--editorial-body)', fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
          {label}
        </p>
      </div>
      <p className="text-foreground leading-none" style={{ fontFamily: 'var(--editorial-heading)', fontSize: '64px', fontWeight: 300 }}>
        {value}
      </p>
    </div>
  );
}


/* ── Photographer Feed Section ── */
function PhotographerFeedSection({ userId }: { userId?: string }) {
  const [feedEvents, setFeedEvents] = useState<{ id: string; name: string; slug: string; cover_url: string | null }[]>([]);
  const [coverPhotos, setCoverPhotos] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await (supabase
        .from('events')
        .select('id, name, slug, cover_url') as any)
        .eq('user_id', userId)
        .eq('is_published', true)
        .eq('feed_visible', true)
        .order('event_date', { ascending: false })
        .limit(6);

      const evts = (data || []) as { id: string; name: string; slug: string; cover_url: string | null }[];
      setFeedEvents(evts);

      // Fetch fallback covers
      const noCover = evts.filter(e => !e.cover_url);
      if (noCover.length > 0) {
        const covers: Record<string, string> = {};
        for (const ev of noCover) {
          const { data: p } = await (supabase
            .from('photos')
            .select('url') as any)
            .eq('event_id', ev.id)
            .order('sort_order', { ascending: true, nullsFirst: false })
            .limit(1);
          if (p && p.length > 0) covers[ev.id] = (p as any[])[0].url;
        }
        setCoverPhotos(covers);
      }
    })();
  }, [userId]);

  if (feedEvents.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="text-center mb-6">
        <p className="font-sans text-muted-foreground" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase' }}>
          Photographer Feed
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[3px]">
        {feedEvents.map(ev => {
          const coverUrl = ev.cover_url || coverPhotos[ev.id] || null;
          return (
            <div
              key={ev.id}
              className="group relative overflow-hidden cursor-pointer"
              onClick={() => navigate(`/dashboard/events/${ev.id}`)}
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                {coverUrl ? (
                  <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-105">
                    <ProgressiveImage src={coverUrl} alt={ev.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-secondary">
                    <Camera className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}

                {/* Dark overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500" />

                {/* Play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                  <div className="w-12 h-12 rounded-full border-2 border-white/70 flex items-center justify-center">
                    <Play className="h-4 w-4 text-white/90 ml-0.5" fill="white" fillOpacity={0.85} />
                  </div>
                </div>

                {/* Shoot title */}
                <div className="absolute bottom-0 inset-x-0 p-3">
                  <p className="text-[12px] text-white/90 lowercase italic font-serif tracking-wide">
                    {ev.name.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Studio Info Section ── */
function StudioInfoSection({ profile }: { profile: any }) {
  const [studio, setStudio] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase
        .from('studio_profiles')
        .select('display_name, instagram, website, whatsapp') as any)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setStudio(data);
    })();
  }, [user]);

  if (!profile && !studio) return null;

  const studioName = studio?.display_name || profile?.studio_name || 'Studio';

  return (
    <div className="mt-14 mb-4">
      <div className="text-center mb-6">
        <p className="font-sans text-muted-foreground" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase' }}>
          Studio Information
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 text-center space-y-4">
        <p className="font-serif text-foreground text-lg tracking-wide">{studioName}</p>

        <div className="space-y-3 text-[13px] text-muted-foreground font-sans">
          {profile?.email && (
            <a href={`mailto:${profile.email}`} className="flex items-center justify-center gap-2 hover:text-foreground transition-colors">
              <Mail className="h-3.5 w-3.5 text-primary/60" />
              <span>{profile.email}</span>
            </a>
          )}
          {profile?.mobile && (
            <a href={`tel:${profile.mobile}`} className="flex items-center justify-center gap-2 hover:text-foreground transition-colors">
              <Phone className="h-3.5 w-3.5 text-primary/60" />
              <span>{profile.mobile}</span>
            </a>
          )}
          {studio?.instagram && (
            <a
              href={`https://instagram.com/${studio.instagram.replace('@', '')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 hover:text-foreground transition-colors"
            >
              <Instagram className="h-3.5 w-3.5 text-primary/60" />
              <span>{studio.instagram}</span>
            </a>
          )}
          {studio?.website && (
            <a
              href={studio.website.startsWith('http') ? studio.website : `https://${studio.website}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 hover:text-foreground transition-colors"
            >
              <Globe className="h-3.5 w-3.5 text-primary/60" />
              <span>Website</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
