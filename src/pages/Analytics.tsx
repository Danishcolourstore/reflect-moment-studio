import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Heart, Download, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';

interface EventAnalyticRow {
  event_id: string;
  event_name: string;
  event_date: string;
  gallery_views: number;
  favorites_count: number;
  downloads_count: number;
}

type DateFilter = '7d' | '30d' | 'all';

const Analytics = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<EventAnalyticRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  useEffect(() => {
    document.title = 'MirrorAI — Analytics';
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      // Get user's events
      const { data: events } = await (supabase
        .from('events')
        .select('id, name, event_date') as any)
        .eq('user_id', user.id)
        .order('event_date', { ascending: false });

      if (!events || events.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const eventIds = (events as any[]).map((e: any) => e.id);
      const { data: analytics } = await (supabase
        .from('event_analytics' as any)
        .select('*') as any)
        .in('event_id', eventIds);

      const analyticsMap = new Map<string, any>();
      if (analytics) {
        for (const a of analytics as any[]) {
          analyticsMap.set(a.event_id, a);
        }
      }

      const mapped: EventAnalyticRow[] = (events as any[]).map((e: any) => {
        const a = analyticsMap.get(e.id);
        return {
          event_id: e.id,
          event_name: e.name,
          event_date: e.event_date,
          gallery_views: a?.gallery_views ?? 0,
          favorites_count: a?.favorites_count ?? 0,
          downloads_count: a?.downloads_count ?? 0,
        };
      });

      mapped.sort((a, b) => b.gallery_views - a.gallery_views);
      setRows(mapped);
      setLoading(false);
    };
    fetch();
  }, [user]);

  // Filter rows by date
  const filteredRows = rows.filter(r => {
    if (dateFilter === 'all') return true;
    const days = dateFilter === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return new Date(r.event_date) >= cutoff;
  });

  const totalViews = filteredRows.reduce((s, r) => s + r.gallery_views, 0);
  const totalFavs = filteredRows.reduce((s, r) => s + r.favorites_count, 0);
  const totalDownloads = filteredRows.reduce((s, r) => s + r.downloads_count, 0);
  const engagementRate = totalViews > 0 ? ((totalFavs / totalViews) * 100).toFixed(1) : '0.0';

  return (
    <DashboardLayout>
      <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">Analytics</h1>
      <p className="text-[11px] text-muted-foreground/50 uppercase tracking-[0.12em] mb-8">Track gallery performance</p>

      {/* Date filter pills */}
      <div className="flex items-center gap-2 mb-6">
        {([['7d', 'Last 7 Days'], ['30d', 'Last 30 Days'], ['all', 'All Time']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setDateFilter(key)}
            className={`px-4 py-1.5 rounded-full text-[11px] tracking-[0.06em] transition-all duration-200 border ${
              dateFilter === key
                ? 'bg-foreground text-background border-foreground'
                : 'bg-transparent text-muted-foreground/70 border-border/60 hover:border-foreground/40'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Top stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 border border-border divide-x divide-y sm:divide-y-0 divide-border overflow-hidden mb-8">
          <StatPill icon={<Eye className="h-4 w-4" />} label="Total Views" value={totalViews} />
          <StatPill icon={<Heart className="h-4 w-4" />} label="Total Favorites" value={totalFavs} />
          <StatPill icon={<Download className="h-4 w-4" />} label="Total Downloads" value={totalDownloads} />
          <StatPill icon={<TrendingUp className="h-4 w-4" />} label="Engagement" value={`${engagementRate}%`} />
        </div>
      )}

      {/* Events table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="border border-dashed border-border/60 py-20 text-center">
          <Eye className="mx-auto h-8 w-8 text-muted-foreground/15" />
          <p className="mt-4 font-serif text-sm text-muted-foreground/60">No analytics data yet</p>
          <p className="mt-1 text-[10px] text-muted-foreground/40">Share your galleries to start tracking.</p>
        </div>
      ) : (
        <div className="border border-border overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-[10px] uppercase tracking-[0.1em] text-muted-foreground/60 font-medium">Event</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-[0.1em] text-muted-foreground/60 font-medium text-right">Views</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-[0.1em] text-muted-foreground/60 font-medium text-right">Favorites</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-[0.1em] text-muted-foreground/60 font-medium text-right">Downloads</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-[0.1em] text-muted-foreground/60 font-medium text-right">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => {
                const eng = row.gallery_views > 0 ? ((row.favorites_count / row.gallery_views) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={row.event_id} className="border-b border-border/50 last:border-b-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-serif text-[13px] font-medium text-foreground">{row.event_name}</p>
                      <p className="text-[10px] text-muted-foreground/50">{format(new Date(row.event_date), 'MMM d, yyyy')}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground text-right font-medium">{row.gallery_views}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground text-right font-medium">{row.favorites_count}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground text-right font-medium">{row.downloads_count}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground text-right font-medium">{eng}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-card px-5 py-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60 font-medium">{label}</p>
        <span className="text-muted-foreground/15">{icon}</span>
      </div>
      <p className="font-serif text-[28px] font-semibold text-foreground leading-none tracking-tight">{value}</p>
    </div>
  );
}

export default Analytics;
