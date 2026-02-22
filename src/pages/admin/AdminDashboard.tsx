import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarDays, Camera, Users, HardDrive, Heart, Eye, UserPlus, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface Stats {
  photographers: number;
  events: number;
  photos: number;
  storageLabel: string;
  storageMB: number;
  guests: number;
  favorites: number;
  totalViews: number;
}

interface RecentSignup {
  studio_name: string;
  email: string | null;
  created_at: string;
  plan: string;
}

interface RecentEvent {
  name: string;
  photographer_name: string;
  created_at: string;
  photo_count: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    photographers: 0, events: 0, photos: 0, storageLabel: '0 MB',
    storageMB: 0, guests: 0, favorites: 0, totalViews: 0,
  });
  const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [profRes, evtRes, photoRes, guestRes, favRes] = await Promise.all([
      supabase.from('profiles').select('id, user_id, studio_name, email, created_at, plan') as any,
      supabase.from('events').select('id, name, user_id, created_at, photo_count, views') as any,
      supabase.from('photos').select('id, file_size') as any,
      (supabase.from('guest_sessions').select('id', { count: 'exact', head: true }) as any),
      (supabase.from('favorites').select('id', { count: 'exact', head: true }) as any),
    ]);

    const profiles = (profRes.data ?? []) as any[];
    const events = (evtRes.data ?? []) as any[];
    const photos = (photoRes.data ?? []) as any[];

    const totalBytes = photos.reduce((acc: number, r: any) => acc + (r.file_size ?? 0), 0);
    const totalMB = totalBytes / (1024 * 1024);
    const storageLabel = totalMB >= 1024
      ? `${(totalMB / 1024).toFixed(1)} GB`
      : `${Math.round(totalMB)} MB`;

    const totalViews = events.reduce((acc: number, e: any) => acc + (e.views ?? 0), 0);

    setStats({
      photographers: profiles.length,
      events: events.length,
      photos: photos.length,
      storageLabel,
      storageMB: totalMB,
      guests: guestRes.count ?? 0,
      favorites: favRes.count ?? 0,
      totalViews,
    });

    // Recent signups (last 10)
    const sorted = [...profiles].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setRecentSignups(sorted.slice(0, 8));

    // Recent events (last 10)
    const nameMap: Record<string, string> = {};
    profiles.forEach((p: any) => { nameMap[p.user_id ?? p.id] = p.studio_name; });
    // Need user_id from profiles
    const profById: Record<string, string> = {};
    profiles.forEach((p: any) => { profById[p.user_id] = p.studio_name; });

    const sortedEvents = [...events].sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setRecentEvents(
      sortedEvents.slice(0, 8).map((e: any) => ({
        name: e.name,
        photographer_name: profById[e.user_id] || 'Unknown',
        created_at: e.created_at,
        photo_count: e.photo_count ?? 0,
      }))
    );
  };

  const statCards = [
    { label: 'Photographers', value: stats.photographers, icon: Users, color: 'text-primary' },
    { label: 'Events', value: stats.events, icon: CalendarDays, color: 'text-accent' },
    { label: 'Photos', value: stats.photos.toLocaleString(), icon: Camera, color: 'text-foreground' },
    { label: 'Storage Used', value: stats.storageLabel, icon: HardDrive, color: 'text-muted-foreground' },
    { label: 'Guest Sessions', value: stats.guests, icon: Eye, color: 'text-primary' },
    { label: 'Favorites', value: stats.favorites, icon: Heart, color: 'text-destructive' },
    { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Activity, color: 'text-accent' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[26px] font-semibold text-foreground tracking-tight">Platform Overview</h1>
        <p className="text-[11px] text-muted-foreground/50 mt-1">Real-time platform metrics and activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {statCards.map((c) => (
          <div key={c.label} className="bg-card border border-border px-4 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium">{c.label}</p>
              <c.icon className={`h-4 w-4 ${c.color} opacity-40`} />
            </div>
            <p className="font-serif text-[24px] font-semibold text-foreground leading-none tracking-tight">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent signups */}
        <div className="bg-card border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary/60" />
            <h2 className="text-[12px] font-medium text-foreground uppercase tracking-[0.08em]">Recent Signups</h2>
          </div>
          <div className="divide-y divide-border/50">
            {recentSignups.map((s, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-foreground truncate">{s.studio_name}</p>
                  <p className="text-[10px] text-muted-foreground/50 truncate">{s.email}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    s.plan === 'pro' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>{s.plan}</span>
                  <p className="text-[9px] text-muted-foreground/40 mt-0.5">{format(new Date(s.created_at), 'MMM d')}</p>
                </div>
              </div>
            ))}
            {recentSignups.length === 0 && (
              <p className="text-center py-8 text-[11px] text-muted-foreground/40">No signups yet</p>
            )}
          </div>
        </div>

        {/* Recent events */}
        <div className="bg-card border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-accent/60" />
            <h2 className="text-[12px] font-medium text-foreground uppercase tracking-[0.08em]">Recent Events</h2>
          </div>
          <div className="divide-y divide-border/50">
            {recentEvents.map((e, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-foreground truncate">{e.name}</p>
                  <p className="text-[10px] text-muted-foreground/50 truncate">{e.photographer_name}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-[11px] text-foreground">{e.photo_count} photos</p>
                  <p className="text-[9px] text-muted-foreground/40">{format(new Date(e.created_at), 'MMM d')}</p>
                </div>
              </div>
            ))}
            {recentEvents.length === 0 && (
              <p className="text-center py-8 text-[11px] text-muted-foreground/40">No events yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
