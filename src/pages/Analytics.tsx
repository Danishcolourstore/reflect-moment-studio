import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Heart, Download, MessageSquare, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface AnalyticRow {
  event_id: string; event_name: string; event_date: string; cover_url: string | null;
  gallery_views: number; favorites_count: number; downloads_count: number;
}

type DateRange = '7d' | '30d' | '90d' | 'all';

const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<AnalyticRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>('30d');
  const [viewsChart, setViewsChart] = useState<{ date: string; views: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: events } = await (supabase.from('events').select('id, name, event_date, cover_url') as any).eq('user_id', user.id);
      if (!events || (events as any[]).length === 0) { setRows([]); setLoading(false); return; }

      const ids = (events as any[]).map((e: any) => e.id);
      const { data: analytics } = await (supabase.from('event_analytics').select('*') as any).in('event_id', ids);
      const aMap = new Map<string, any>();
      if (analytics) for (const a of analytics as any[]) aMap.set(a.event_id, a);

      setRows((events as any[]).map((e: any) => {
        const a = aMap.get(e.id);
        return { event_id: e.id, event_name: e.name, event_date: e.event_date, cover_url: e.cover_url, gallery_views: a?.gallery_views ?? 0, favorites_count: a?.favorites_count ?? 0, downloads_count: a?.downloads_count ?? 0 };
      }).sort((a: AnalyticRow, b: AnalyticRow) => b.gallery_views - a.gallery_views));

      // Views chart data
      const { data: views } = await (supabase.from('event_views').select('viewed_at') as any).in('event_id', ids).order('viewed_at', { ascending: true });
      if (views) {
        const dayMap = new Map<string, number>();
        for (const v of views as any[]) {
          const d = format(new Date(v.viewed_at), 'yyyy-MM-dd');
          dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
        }
        setViewsChart(Array.from(dayMap.entries()).map(([date, views]) => ({ date, views })));
      }

      setLoading(false);
    };
    load();
  }, [user]);

  const getDays = (r: DateRange) => r === '7d' ? 7 : r === '30d' ? 30 : r === '90d' ? 90 : 99999;
  const cutoff = subDays(new Date(), getDays(range));

  const filtered = rows.filter(r => range === 'all' || new Date(r.event_date) >= cutoff);
  const filteredChart = viewsChart.filter(v => range === 'all' || new Date(v.date) >= cutoff);
  const totalViews = filtered.reduce((s, r) => s + r.gallery_views, 0);
  const totalDownloads = filtered.reduce((s, r) => s + r.downloads_count, 0);
  const totalFavs = filtered.reduce((s, r) => s + r.favorites_count, 0);

  const RANGES: { key: DateRange; label: string }[] = [
    { key: '7d', label: 'Last 7 Days' }, { key: '30d', label: 'Last 30 Days' },
    { key: '90d', label: 'Last 90 Days' }, { key: 'all', label: 'All Time' },
  ];

  return (
    <DashboardLayout>
      <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-4 sm:mb-6">Analytics</h1>

      {/* Range pills */}
      <div className="flex items-center gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {RANGES.map(({ key, label }) => (
          <button key={key} onClick={() => setRange(key)}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-[11px] tracking-wider transition-all border whitespace-nowrap min-h-[44px] ${
              range === key ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:border-foreground/30'
            }`}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <Eye className="h-7 w-7 text-muted-foreground/20" />
          </div>
          <h3 className="font-serif text-lg text-foreground/70 mb-1">No analytics yet</h3>
          <p className="text-[12px] text-muted-foreground/50 max-w-[260px]">
            Publish your first event gallery and share it with clients to start seeing analytics data here
          </p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <AnalyticStat icon={Eye} label="Total Views" value={totalViews} />
          <AnalyticStat icon={Download} label="Total Downloads" value={totalDownloads} />
          <AnalyticStat icon={Heart} label="Total Favorites" value={totalFavs} />
          <AnalyticStat icon={MessageSquare} label="Engagement" value={totalViews > 0 ? `${((totalFavs / totalViews) * 100).toFixed(1)}%` : '0%'} />
        </div>

      {/* Chart */}
      {filteredChart.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-8">
          <h3 className="font-serif text-base text-foreground mb-4">Gallery Views Over Time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={filteredChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => format(new Date(v), 'MMM d')} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Line type="monotone" dataKey="views" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Events table */}
      <h3 className="font-serif text-lg text-foreground mb-4">Top Events</h3>
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border/60 py-20 text-center rounded-xl">
          <Eye className="mx-auto h-10 w-10 text-muted-foreground/15" />
          <p className="mt-4 font-serif text-sm text-muted-foreground/60">No analytics data yet</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Event</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium text-right">Views</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium text-right hidden sm:table-cell">Downloads</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium text-right hidden sm:table-cell">Favorites</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.event_id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/events/${row.event_id}`)}>
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-secondary overflow-hidden shrink-0">
                      {row.cover_url ? <img src={row.cover_url} className="h-full w-full object-cover" /> : <Image className="h-full w-full p-2 text-muted-foreground/20" />}
                    </div>
                    <div>
                      <p className="font-serif text-[13px] font-medium text-foreground">{row.event_name}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(row.event_date), 'MMM d, yyyy')}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-foreground text-right font-medium">{row.gallery_views}</td>
                  <td className="px-4 py-3 text-[13px] text-foreground text-right font-medium hidden sm:table-cell">{row.downloads_count}</td>
                  <td className="px-4 py-3 text-[13px] text-foreground text-right font-medium hidden sm:table-cell">{row.favorites_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </>
      )}
    </DashboardLayout>
  );
};

function AnalyticStat({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60 font-medium">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground/20" />
      </div>
      <p className="font-serif text-3xl font-bold text-foreground leading-none tracking-tight">{value}</p>
    </div>
  );
}

export default Analytics;
