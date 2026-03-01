import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Calendar, Image, HardDrive } from 'lucide-react';

function formatBytes(bytes: number) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ photographers: 0, events: 0, photos: 0, storageBytes: 0 });
  const [recentProfiles, setRecentProfiles] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Stats
    Promise.all([
      (supabase.from('profiles').select('id', { count: 'exact', head: true }) as any),
      (supabase.from('events').select('id', { count: 'exact', head: true }) as any),
      (supabase.from('photos').select('id', { count: 'exact', head: true }) as any),
      (supabase.from('photos').select('file_size') as any),
    ]).then(([p, e, ph, sizes]) => {
      const totalSize = ((sizes as any).data || []).reduce((sum: number, r: any) => sum + (r.file_size || 0), 0);
      setStats({
        photographers: (p as any).count ?? 0,
        events: (e as any).count ?? 0,
        photos: (ph as any).count ?? 0,
        storageBytes: totalSize,
      });
    });

    // Recent profiles
    (supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10) as any)
      .then(({ data }: any) => setRecentProfiles(data || []));

    // Recent events with photographer names
    (supabase.from('events').select('*').order('created_at', { ascending: false }).limit(10) as any)
      .then(async ({ data }: any) => {
        if (!data) return;
        const { data: profiles } = await (supabase.from('profiles').select('user_id, studio_name') as any);
        const nameMap: Record<string, string> = {};
        (profiles || []).forEach((p: any) => { nameMap[p.user_id] = p.studio_name; });
        setRecentEvents(data.map((e: any) => ({ ...e, photographer: nameMap[e.user_id] || 'Unknown' })));
      });

    // Chart data - last 30 days
    const buildChart = async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data: profileData } = await (supabase.from('profiles').select('created_at').gte('created_at', thirtyDaysAgo) as any);
      const { data: eventData } = await (supabase.from('events').select('created_at').gte('created_at', thirtyDaysAgo) as any);

      const days: Record<string, { signups: number; events: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
        days[d] = { signups: 0, events: 0 };
      }
      (profileData || []).forEach((p: any) => {
        const d = p.created_at?.split('T')[0];
        if (days[d]) days[d].signups++;
      });
      (eventData || []).forEach((e: any) => {
        const d = e.created_at?.split('T')[0];
        if (days[d]) days[d].events++;
      });
      setChartData(Object.entries(days).map(([date, v]) => ({
        date: format(new Date(date), 'MMM d'),
        Signups: v.signups,
        Events: v.events,
      })));
    };
    buildChart();
  }, []);

  const statCards = [
    { label: 'Total Photographers', value: stats.photographers, icon: Users },
    { label: 'Total Events', value: stats.events, icon: Calendar },
    { label: 'Total Photos', value: stats.photos, icon: Image },
    { label: 'Storage Used', value: formatBytes(stats.storageBytes), icon: HardDrive },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl font-semibold text-foreground">Platform Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <c.icon className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="font-serif text-4xl font-semibold text-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-border">
              <h3 className="font-serif text-base font-semibold">Recent Signups</h3>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-secondary/30">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Name</th>
                    <th className="text-left px-4 py-2 font-medium">Email</th>
                    <th className="text-left px-4 py-2 font-medium">Plan</th>
                    <th className="text-left px-4 py-2 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentProfiles.map((p: any) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 font-medium">{p.studio_name}</td>
                      <td className="px-4 py-2 text-muted-foreground">{p.email || '—'}</td>
                      <td className="px-4 py-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${p.plan === 'pro' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                          {p.plan}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{format(new Date(p.created_at), 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-border">
              <h3 className="font-serif text-base font-semibold">Recent Events</h3>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-secondary/30">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Event</th>
                    <th className="text-left px-4 py-2 font-medium">Photographer</th>
                    <th className="text-left px-4 py-2 font-medium">Photos</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-left px-4 py-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentEvents.map((e: any) => (
                    <tr key={e.id}>
                      <td className="px-4 py-2 font-medium">{e.name}</td>
                      <td className="px-4 py-2 text-muted-foreground">{e.photographer}</td>
                      <td className="px-4 py-2">{e.photo_count}</td>
                      <td className="px-4 py-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${e.is_published ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                          {e.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{format(new Date(e.created_at), 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-serif text-base font-semibold mb-4">Platform Activity (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="Signups" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Events" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
