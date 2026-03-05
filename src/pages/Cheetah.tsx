import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Eye, Download, Heart, Upload, Camera, Activity, Zap, Radio } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'view' | 'download' | 'favorite' | 'upload' | 'selection' | 'comment';
  message: string;
  time: string;
  eventName?: string;
}

const typeConfig: Record<string, { icon: typeof Eye; color: string; label: string }> = {
  view: { icon: Eye, color: 'text-emerald-500', label: 'Gallery View' },
  download: { icon: Download, color: 'text-blue-500', label: 'Download' },
  favorite: { icon: Heart, color: 'text-rose-500', label: 'Favorite' },
  upload: { icon: Upload, color: 'text-amber-500', label: 'Upload' },
  selection: { icon: Camera, color: 'text-violet-500', label: 'Selection' },
  comment: { icon: Activity, color: 'text-teal-500', label: 'Comment' },
};

const Cheetah = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState({ views: 0, downloads: 0, favorites: 0, activeEvents: 0 });
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);

  const loadActivity = useCallback(async () => {
    if (!user) return;

    // Load events for this user
    const { data: events } = await (supabase.from('events').select('id, name, photo_count') as any)
      .eq('user_id', user.id);
    if (!events || events.length === 0) {
      setLoading(false);
      return;
    }

    const eventIds = events.map((e: any) => e.id);
    const eventMap = new Map(events.map((e: any) => [e.id, e.name]));

    // Parallel fetches
    const [viewsRes, favsRes, selectionsRes, commentsRes, analyticsRes] = await Promise.all([
      (supabase.from('event_views').select('id, event_id, viewed_at') as any)
        .in('event_id', eventIds).order('viewed_at', { ascending: false }).limit(20),
      (supabase.from('favorites').select('id, event_id, created_at') as any)
        .in('event_id', eventIds).order('created_at', { ascending: false }).limit(20),
      (supabase.from('guest_selections').select('id, event_id, guest_name, created_at') as any)
        .in('event_id', eventIds).order('created_at', { ascending: false }).limit(10),
      (supabase.from('photo_comments').select('id, event_id, guest_name, created_at') as any)
        .in('event_id', eventIds).order('created_at', { ascending: false }).limit(10),
      (supabase.from('event_analytics').select('gallery_views, downloads_count, favorites_count') as any)
        .in('event_id', eventIds),
    ]);

    // Build stats
    const totals = { views: 0, downloads: 0, favorites: 0, activeEvents: events.filter((e: any) => e.photo_count > 0).length };
    (analyticsRes.data || []).forEach((a: any) => {
      totals.views += a.gallery_views || 0;
      totals.downloads += a.downloads_count || 0;
      totals.favorites += a.favorites_count || 0;
    });
    setStats(totals);

    // Build activity feed
    const items: ActivityItem[] = [];

    (viewsRes.data || []).forEach((v: any) => {
      items.push({
        id: v.id,
        type: 'view',
        message: `Someone viewed "${(eventMap.get(v.event_id) as string) || 'gallery'}"`,
        time: v.viewed_at,
        eventName: (eventMap.get(v.event_id) as string) || '',
      });
    });

    (favsRes.data || []).forEach((f: any) => {
      items.push({
        id: f.id,
        type: 'favorite',
        message: `A guest favorited a photo in "${(eventMap.get(f.event_id) as string) || 'gallery'}"`,
        time: f.created_at,
        eventName: (eventMap.get(f.event_id) as string) || '',
      });
    });

    (selectionsRes.data || []).forEach((s: any) => {
      items.push({
        id: s.id,
        type: 'selection',
        message: `${s.guest_name} submitted selections for "${(eventMap.get(s.event_id) as string) || 'gallery'}"`,
        time: s.created_at,
        eventName: (eventMap.get(s.event_id) as string) || '',
      });
    });

    (commentsRes.data || []).forEach((c: any) => {
      items.push({
        id: c.id,
        type: 'comment',
        message: `${c.guest_name || 'A guest'} commented on a photo in "${(eventMap.get(c.event_id) as string) || 'gallery'}"`,
        time: c.created_at,
        eventName: (eventMap.get(c.event_id) as string) || '',
      });
    });

    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setActivities(items.slice(0, 50));
    setLoading(false);
  }, [user]);

  useEffect(() => { loadActivity(); }, [loadActivity]);

  // Realtime subscription for live pulse
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('cheetah-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_views' }, () => {
        setPulse(true);
        setTimeout(() => setPulse(false), 2000);
        loadActivity();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'favorites' }, () => {
        setPulse(true);
        setTimeout(() => setPulse(false), 2000);
        loadActivity();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photo_comments' }, () => {
        setPulse(true);
        setTimeout(() => setPulse(false), 2000);
        loadActivity();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loadActivity]);

  const statCards = [
    { label: 'Total Views', value: stats.views, icon: Eye, color: 'text-emerald-500' },
    { label: 'Downloads', value: stats.downloads, icon: Download, color: 'text-blue-500' },
    { label: 'Favorites', value: stats.favorites, icon: Heart, color: 'text-rose-500' },
    { label: 'Active Events', value: stats.activeEvents, icon: Camera, color: 'text-amber-500' },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Zap className="h-6 w-6 text-amber-500" />
          {pulse && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
          )}
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground tracking-tight">Cheetah</h1>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Radio className="h-3 w-3 text-emerald-500" />
            <span>Live activity monitoring</span>
          </p>
        </div>
      </div>

      {/* Live indicator bar */}
      <div className={`h-0.5 rounded-full mb-6 transition-colors duration-500 ${pulse ? 'bg-emerald-500' : 'bg-border'}`} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg bg-secondary flex items-center justify-center ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground font-serif">{s.value.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Live Feed</h2>
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground">{activities.length} events</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-secondary/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="border border-dashed border-border/60 py-20 text-center rounded-xl">
          <Zap className="mx-auto h-10 w-10 text-muted-foreground/15" />
          <p className="mt-4 font-serif text-lg text-muted-foreground/60">No activity yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground/40">Activity will appear here as guests interact with your galleries.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((item, idx) => {
            const cfg = typeConfig[item.type] || typeConfig.view;
            const Icon = cfg.icon;
            return (
              <div
                key={item.id}
                className="group flex items-start gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:bg-secondary/30 transition-colors"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className={`mt-0.5 h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground leading-snug truncate">{item.message}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-medium uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-[9px] text-muted-foreground">
                      {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Cheetah;
