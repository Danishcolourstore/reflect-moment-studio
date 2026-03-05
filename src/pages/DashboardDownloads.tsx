import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface DownloadRow {
  event_id: string;
  event_name: string;
  event_date: string;
  downloads_count: number;
}

const DashboardDownloads = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<DownloadRow[]>([]);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: evts } = await (supabase
        .from('events')
        .select('id, name, event_date') as any)
        .eq('user_id', user.id)
        .order('event_date', { ascending: false });

      if (!evts || evts.length === 0) { setLoading(false); return; }

      const ids = (evts as any[]).map((e: any) => e.id);
      const { data: analytics } = await (supabase
        .from('event_analytics')
        .select('event_id, downloads_count') as any)
        .in('event_id', ids);

      const analyticsMap = new Map<string, number>((analytics || []).map((a: any) => [a.event_id, (a.downloads_count || 0) as number]));
      let total = 0;
      const result: DownloadRow[] = [];
      for (const ev of evts as any[]) {
        const dc: number = analyticsMap.get(ev.id) || 0;
        total += dc;
        if (dc > 0) {
          result.push({ event_id: ev.id, event_name: ev.name, event_date: ev.event_date, downloads_count: dc });
        }
      }
      setTotalDownloads(total);
      setRows(result);
      setLoading(false);
    })();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="font-sans text-muted-foreground" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase' }}>
            Download Statistics
          </p>
        </div>
      </div>

      {/* Total */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6 flex items-center gap-4">
        <Download className="h-6 w-6 text-primary" strokeWidth={1.5} />
        <div>
          <p className="text-foreground" style={{ fontFamily: 'var(--editorial-heading)', fontSize: '48px', fontWeight: 300, lineHeight: 1 }}>
            {loading ? '—' : totalDownloads}
          </p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Total Downloads
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-border/60 py-24 text-center rounded-xl">
          <Download className="mx-auto h-12 w-12 text-muted-foreground/15" />
          <p className="mt-4 font-serif text-lg text-muted-foreground/60">No downloads yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground/40">Downloads from your galleries will appear here.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Event</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium text-right">Downloads</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.event_id}
                  className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/dashboard/events/${row.event_id}`)}
                >
                  <td className="px-4 py-3 text-[13px] text-foreground font-serif">{row.event_name}</td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground hidden sm:table-cell">
                    {new Date(row.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-foreground text-right font-medium">{row.downloads_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardDownloads;
