import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { format, subDays } from 'date-fns';

interface AnalyticRow {
  event_id: string; event_name: string; event_date: string;
  gallery_views: number; favorites_count: number; downloads_count: number;
}

type DateRange = '7d' | '30d' | '90d' | 'all';

const RANGES: { key: DateRange; label: string }[] = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'all', label: 'All Time' },
];

const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<AnalyticRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>('30d');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: events } = await (supabase.from('events').select('id, name, event_date') as any).eq('user_id', user.id);
      if (!events || (events as any[]).length === 0) { setRows([]); setLoading(false); return; }

      const ids = (events as any[]).map((e: any) => e.id);
      const { data: analytics } = await (supabase.from('event_analytics').select('*') as any).in('event_id', ids);
      const aMap = new Map<string, any>();
      if (analytics) for (const a of analytics as any[]) aMap.set(a.event_id, a);

      setRows((events as any[]).map((e: any) => {
        const a = aMap.get(e.id);
        return { event_id: e.id, event_name: e.name, event_date: e.event_date, gallery_views: a?.gallery_views ?? 0, favorites_count: a?.favorites_count ?? 0, downloads_count: a?.downloads_count ?? 0 };
      }).sort((a: AnalyticRow, b: AnalyticRow) => b.gallery_views - a.gallery_views));
      setLoading(false);
    };
    load();
  }, [user]);

  const getDays = (r: DateRange) => r === '7d' ? 7 : r === '30d' ? 30 : r === '90d' ? 90 : 99999;
  const cutoff = subDays(new Date(), getDays(range));
  const filtered = rows.filter(r => range === 'all' || new Date(r.event_date) >= cutoff);
  const totalViews = filtered.reduce((s, r) => s + r.gallery_views, 0);
  const totalDownloads = filtered.reduce((s, r) => s + r.downloads_count, 0);
  const totalFavs = filtered.reduce((s, r) => s + r.favorites_count, 0);
  const engagement = totalViews > 0 ? `${((totalFavs / totalViews) * 100).toFixed(1)}%` : '—';

  const stats = [
    { label: "VIEWS", value: totalViews.toLocaleString() },
    { label: "DOWNLOADS", value: totalDownloads.toLocaleString() },
    { label: "FAVORITES", value: totalFavs.toLocaleString() },
    { label: "ENGAGEMENT", value: engagement },
  ];

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: "hsl(48, 7%, 10%)", letterSpacing: "0.02em", margin: 0 }}>
          Insights
        </h1>

        {/* Date range */}
        <div style={{ display: "flex", gap: 8, marginTop: 40, marginBottom: 40, flexWrap: "wrap" }}>
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: range === r.key ? "hsl(40, 52%, 48%)" : "hsl(35, 4%, 56%)",
                background: range === r.key ? "hsla(40, 52%, 48%, 0.08)" : "transparent",
                border: `1px solid ${range === r.key ? "hsl(40, 52%, 48%)" : "hsl(37, 10%, 90%)"}`,
                padding: "8px 16px",
                cursor: "pointer",
                transition: "all 0.2s",
                minHeight: 44,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(37, 10%, 90%)", padding: 16 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "hsl(35, 4%, 56%)" }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "hsl(48, 7%, 10%)", marginTop: 8 }}>
                {loading ? "—" : s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["EVENT", "DATE", "VIEWS", "FAVORITES", "DOWNLOADS"].map(h => (
                  <th key={h} style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 500, letterSpacing: "0.15em",
                    textTransform: "uppercase", color: "hsl(35, 4%, 56%)",
                    textAlign: "left", padding: "12px 16px", borderBottom: "1px solid hsl(37, 10%, 90%)",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(35, 4%, 56%)" }}>Preparing…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(35, 4%, 56%)" }}>No data yet</td></tr>
              ) : filtered.map(r => (
                <tr key={r.event_id} style={{ cursor: "pointer", transition: "background 0.2s" }} onClick={() => navigate(`/dashboard/events/${r.event_id}`)}>
                  <td style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(48, 7%, 10%)", padding: "16px", borderBottom: "1px solid hsl(37, 10%, 90%)" }}>{r.event_name}</td>
                  <td style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "hsl(35, 4%, 56%)", padding: "16px", borderBottom: "1px solid hsl(37, 10%, 90%)" }}>
                    {r.event_date ? format(new Date(r.event_date), "MMM d, yyyy") : "—"}
                  </td>
                  <td style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(48, 7%, 10%)", padding: "16px", borderBottom: "1px solid hsl(37, 10%, 90%)" }}>{r.gallery_views}</td>
                  <td style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(48, 7%, 10%)", padding: "16px", borderBottom: "1px solid hsl(37, 10%, 90%)" }}>{r.favorites_count}</td>
                  <td style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(48, 7%, 10%)", padding: "16px", borderBottom: "1px solid hsl(37, 10%, 90%)" }}>{r.downloads_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;